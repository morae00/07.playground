// Music player (AUD-03): carries out the music director's commands with Web Audio, on the mixer's music bus. A deck
// is a track's base buffer and its stems, started at the same moment; a new deck fades or crossfades (equal power)
// over the one before. Ducks and the pause low-pass sit after the decks; the enrage sting goes past the ducks (cue
// sheet §5.3). Tracks decode on demand and are let go when no deck or preload needs them; one that fails is silence.
import type { DuckId, MusicCommand, MusicStem, MusicTrackId } from './musicDirector.ts';

export type MusicTrackSpec = {
  file: string;
  /** Tempo and the beats of each bar in turn, for bar lines (a 7/8 bar is 3.5 quarter beats). */
  bpm?: number;
  meter?: number[];
  /** False for a track that plays once (the ending); true by default. */
  loop?: boolean;
  /** The sting's length; the decks under it come back from here. */
  cutAt?: number;
  stems?: Partial<Record<MusicStem, { file: string }>>;
};
/** The music pack (public/assets/packs/music/pack.json): files relative to `base`, Opus in WebM or Ogg. */
export type MusicPack = { id: string; base: string; tracks: Partial<Record<MusicTrackId, MusicTrackSpec>> };

/**
 * The decks' level on the music bus (AUD-05 plan B): a −16 LUFS stereo master plays about 4 LU under the effects'
 * flow at the default options. Measure again with the real tracks (npm run measure:mix).
 */
export const MUSIC_LEVEL = 0.32;
const QUIET = 0.0001;
const OPEN_FILTER_HZ = 20_000;
const STING_DUCK_DB = -10;
const STING_LENGTH = 3.6;
const STING_RECOVER = 1.5;
/** At most this many decks fade out at once; the oldest is cut short this fast (§5.4). */
const MAX_FADING = 1;
const CUT_OLDEST = 0.1;
/** A stem change waits at most this long for its bar line. */
const MAX_BAR_WAIT = 4;
/** Steps of an equal-power fade, drawn as linear ramps (curves cannot overlap other automation). */
const FADE_STEPS = 8;
const BOSS_TRACKS: readonly MusicTrackId[] = ['boss-mid', 'boss-final'];

type Deck = {
  track: MusicTrackId;
  spec: MusicTrackSpec;
  gain: GainNode;
  sources: AudioBufferSourceNode[];
  stems: Map<MusicStem, GainNode>;
  /** Context time at which the track's position 0 would have played. */
  zero: number;
  duration: number;
};

const dbToGain = (db: number) => 10 ** (db / 20);

export type MusicPlayerOptions = {
  context: BaseAudioContext;
  output: AudioNode;
  pack: MusicPack;
  fetchFile: (url: string) => Promise<ArrayBuffer>;
  onError?: (message: string) => void;
};

export class MusicPlayer {
  private readonly context: BaseAudioContext;
  private readonly pack: MusicPack;
  private readonly fetchFile: (url: string) => Promise<ArrayBuffer>;
  private readonly onError: (message: string) => void;
  private readonly duck: GainNode;
  private readonly filter: BiquadFilterNode;
  private readonly buffers = new Map<string, Promise<AudioBuffer | null>>();
  private deck: Deck | null = null;
  private fading: Deck[] = [];
  private readonly positions = new Map<MusicTrackId, number>();
  private readonly ducks = new Map<DuckId | 'sting', number>();
  private readonly stemLevels = new Map<MusicStem, number>();
  private preloads: MusicTrackId[] = [];
  private wanted: MusicTrackId | null = null;
  /** Bumped by every play and stop, so a play still decoding knows it was overtaken. */
  private generation = 0;
  private lowpassHz = OPEN_FILTER_HZ;

  constructor({ context, output, pack, fetchFile, onError = () => undefined }: MusicPlayerOptions) {
    this.context = context;
    this.pack = pack;
    this.fetchFile = fetchFile;
    this.onError = onError;
    const level = context.createGain();
    level.gain.value = MUSIC_LEVEL;
    level.connect(output);
    this.filter = context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = OPEN_FILTER_HZ;
    this.filter.connect(level);
    this.duck = context.createGain();
    this.duck.connect(this.filter);
  }

  run(command: MusicCommand) {
    switch (command.type) {
      case 'play':
        void this.play(command.track, command.fade, command.crossfade, command.resume);
        return;
      case 'stop':
        this.generation += 1;
        this.wanted = null;
        this.stop(command.fade, command.remember, command.tape === true);
        return;
      case 'stem':
        this.setStem(command.stem, command.db);
        return;
      case 'duck':
        this.setDuck(command.id, command.db, command.seconds, command.hold, command.release);
        return;
      case 'lowpass':
        this.lowpassHz = command.hz ?? OPEN_FILTER_HZ;
        this.glideFilter(this.lowpassHz, command.seconds);
        return;
      case 'sting':
        void this.sting();
        return;
      case 'preload':
        this.preloads = command.tracks;
        for (const track of command.tracks) for (const file of this.files(track)) void this.buffer(file);
        // A boss stage's first enrage step stings: decode it with the boss track.
        if (command.tracks.some((track) => BOSS_TRACKS.includes(track))) for (const file of this.files('enrage-sting')) void this.buffer(file);
        this.prune();
        return;
      default:
    }
  }

  /** What plays, what fades, buffers held, and the effective duck, for diagnostics and tests. */
  stats() {
    return { track: this.deck?.track ?? null, fading: this.fading.length, buffers: this.buffers.size, duckDb: this.duckDb() };
  }

  private async play(track: MusicTrackId, fade: number, crossfade: boolean, resume: boolean) {
    this.generation += 1;
    const generation = this.generation;
    this.wanted = track;
    const spec = this.pack.tracks[track];
    if (!spec) return;
    const stemSpecs = this.stemEntries(spec);
    const [base, ...stemBuffers] = await Promise.all([this.buffer(spec.file), ...stemSpecs.map(([, stem]) => this.buffer(stem.file))]);
    if (generation !== this.generation || !base) return;
    const now = this.context.currentTime;
    const loop = spec.loop !== false;
    const offset = resume ? this.resumeOffset(track, spec, base.duration) : 0;
    this.positions.delete(track);
    const gain = this.context.createGain();
    gain.connect(this.duck);
    const deck: Deck = { track, spec, gain, sources: [], stems: new Map(), zero: now - offset, duration: base.duration };
    const baseSource = this.source(base, loop);
    baseSource.connect(gain);
    baseSource.start(now, offset);
    deck.sources.push(baseSource);
    stemSpecs.forEach(([name], index) => {
      const buffer = stemBuffers[index];
      if (!buffer) return;
      const stemGain = this.context.createGain();
      stemGain.gain.value = this.stemLevels.get(name) ?? 0;
      stemGain.connect(gain);
      const source = this.source(buffer, true);
      source.connect(stemGain);
      // Stems start with the base; a stem shorter than its base joins at the same place in its own loop (§3.2).
      source.start(now, offset % buffer.duration);
      deck.sources.push(source);
      deck.stems.set(name, stemGain);
    });
    // A track that plays once ends by itself and takes its stems with it.
    baseSource.addEventListener('ended', () => this.release(deck), { once: true });
    const seconds = Math.max(0.01, fade);
    const outgoing = this.deck;
    if (outgoing) this.fadeOut(outgoing, seconds, now, crossfade);
    if (crossfade && outgoing) {
      glide(gain.gain, now, seconds, (x) => Math.sin((x * Math.PI) / 2));
    } else {
      gain.gain.setValueAtTime(QUIET, now);
      gain.gain.exponentialRampToValueAtTime(1, now + seconds);
    }
    this.deck = deck;
    this.prune();
  }

  private stop(fade: number, remember: boolean, tape: boolean) {
    const deck = this.deck;
    if (!deck) return;
    const now = this.context.currentTime;
    if (remember) this.positions.set(deck.track, (now - deck.zero) % deck.duration);
    else this.positions.delete(deck.track);
    const seconds = Math.max(0.01, fade);
    if (tape) {
      // The defeat's tape stop (§2.5): the pitch sinks and the sound darkens over the death moment.
      for (const source of deck.sources) {
        source.playbackRate.cancelScheduledValues(now);
        source.playbackRate.setValueAtTime(1, now);
        source.playbackRate.exponentialRampToValueAtTime(0.25, now + seconds);
      }
      const frequency = this.filter.frequency;
      frequency.cancelScheduledValues(now);
      frequency.setValueAtTime(Math.min(12_000, this.lowpassHz), now);
      frequency.exponentialRampToValueAtTime(400, now + seconds);
      frequency.setValueAtTime(this.lowpassHz, now + seconds + 0.05);
    }
    this.fadeOut(deck, seconds, now, false);
    this.deck = null;
    this.prune();
  }

  /** Fades a deck out and stops it; past MAX_FADING fading decks, the oldest is cut short. */
  private fadeOut(deck: Deck, seconds: number, now: number, equalPower: boolean) {
    this.fading.push(deck);
    while (this.fading.length > MAX_FADING) this.ramp(this.fading.shift()!, CUT_OLDEST, now, false);
    this.ramp(deck, seconds, now, equalPower);
  }

  private ramp(deck: Deck, seconds: number, now: number, equalPower: boolean) {
    const param = deck.gain.gain;
    const from = Math.max(QUIET, param.value);
    param.cancelScheduledValues(now);
    if (equalPower) {
      glide(param, now, seconds, (x) => from * Math.cos((x * Math.PI) / 2));
    } else {
      param.setValueAtTime(from, now);
      param.exponentialRampToValueAtTime(QUIET, now + seconds);
    }
    for (const source of deck.sources) source.stop(now + seconds + 0.02);
  }

  private release(deck: Deck) {
    for (const source of deck.sources) {
      // A once-through base ends before its looping stems; they stop with it.
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
      source.disconnect();
    }
    for (const stem of deck.stems.values()) stem.disconnect();
    deck.gain.disconnect();
    this.fading = this.fading.filter((candidate) => candidate !== deck);
    if (this.deck === deck) this.deck = null;
    this.prune();
  }

  /** A stem's level changes at the next bar line of the deck playing, ramped over one bar (§0, §3.3). */
  private setStem(stem: MusicStem, db: number | null) {
    const target = db === null ? 0 : dbToGain(db);
    this.stemLevels.set(stem, target);
    const deck = this.deck;
    const gain = deck?.stems.get(stem);
    if (!deck || !gain) return;
    const now = this.context.currentTime;
    const { at, bar } = this.nextBar(deck, now);
    const param = gain.gain;
    const from = param.value;
    param.cancelScheduledValues(now);
    param.setValueAtTime(from, now);
    param.setValueAtTime(from, at);
    param.linearRampToValueAtTime(target, at + bar);
  }

  private setDuck(id: DuckId | 'sting', db: number | null, seconds: number, hold?: number, release = 0.3) {
    if (db === null) this.ducks.delete(id);
    else this.ducks.set(id, db);
    const now = this.context.currentTime;
    const param = this.duck.gain;
    const from = param.value;
    const reach = now + Math.max(0.01, seconds);
    param.cancelScheduledValues(now);
    param.setValueAtTime(from, now);
    param.linearRampToValueAtTime(dbToGain(this.duckDb()), reach);
    if (db !== null && hold !== undefined) {
      // A self-lifting duck: after `hold` the deepest of the others takes over again. A later duck command
      // reschedules from the ducks then held, which lifts this one early.
      this.ducks.delete(id);
      param.setValueAtTime(dbToGain(Math.min(db, this.duckDb())), reach + hold);
      param.linearRampToValueAtTime(dbToGain(this.duckDb()), reach + hold + Math.max(0.01, release));
    }
  }

  /** The deepest duck wins (§3.5). */
  private duckDb() {
    return Math.min(0, ...this.ducks.values());
  }

  private glideFilter(hz: number, seconds: number) {
    const now = this.context.currentTime;
    const param = this.filter.frequency;
    const from = param.value;
    param.cancelScheduledValues(now);
    param.setValueAtTime(from, now);
    param.exponentialRampToValueAtTime(hz, now + Math.max(0.01, seconds));
  }

  /** The sting goes past the ducks and ducks the decks under it, then lets them back (§2.4). */
  private async sting() {
    const spec = this.pack.tracks['enrage-sting'];
    const buffer = spec ? await this.buffer(spec.file) : null;
    if (!buffer) return;
    const now = this.context.currentTime;
    const source = this.source(buffer, false);
    source.connect(this.filter);
    source.addEventListener('ended', () => source.disconnect(), { once: true });
    source.start(now);
    this.setDuck('sting', STING_DUCK_DB, 0.05, Math.min(spec?.cutAt ?? STING_LENGTH, buffer.duration), STING_RECOVER);
  }

  /** Where a remembered track picks up: its 4-bar group, or the top when fewer than 8 bars remain (§0). */
  private resumeOffset(track: MusicTrackId, spec: MusicTrackSpec, duration: number) {
    const position = this.positions.get(track);
    if (position === undefined) return 0;
    const bars = barTimes(spec, duration);
    if (bars.length < 2) return duration - position < 20 ? 0 : position;
    let index = 0;
    while (index + 1 < bars.length && bars[index + 1] <= position) index += 1;
    if (bars.length - index < 8) return 0;
    return bars[index - (index % 4)];
  }

  /** The next bar line of a deck in context time and that bar's length; without a tempo, now and half a second. */
  private nextBar(deck: Deck, now: number) {
    const bars = barTimes(deck.spec, deck.duration);
    if (bars.length < 2) return { at: now, bar: 0.5 };
    const position = (((now - deck.zero) % deck.duration) + deck.duration) % deck.duration;
    const index = bars.findIndex((time) => time >= position);
    const boundary = index < 0 ? deck.duration : bars[index];
    const next = index < 0 ? deck.duration + bars[1] : index + 1 < bars.length ? bars[index + 1] : deck.duration;
    const at = Math.min(now + (boundary - position), now + MAX_BAR_WAIT);
    return { at, bar: Math.max(0.05, next - boundary) };
  }

  private stemEntries(spec: MusicTrackSpec) {
    return Object.entries(spec.stems ?? {}) as [MusicStem, { file: string }][];
  }

  private files(track: MusicTrackId) {
    const spec = this.pack.tracks[track];
    return spec ? [spec.file, ...this.stemEntries(spec).map(([, stem]) => stem.file)] : [];
  }

  private source(buffer: AudioBuffer, loop: boolean) {
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    return source;
  }

  private buffer(file: string) {
    let pending = this.buffers.get(file);
    if (!pending) {
      pending = this.fetchFile(`${this.pack.base}${file}`)
        .then((data) => this.context.decodeAudioData(data))
        .catch((error: unknown) => {
          this.onError(`music ${file} did not decode (${error instanceof Error ? error.message : String(error)})`);
          return null;
        });
      this.buffers.set(file, pending);
    }
    return pending;
  }

  /** Lets go of decoded tracks no deck plays and no preload asked for (§5.4). */
  private prune() {
    const keep = new Set<string>();
    const tracks = [...this.preloads, ...this.fading.map((deck) => deck.track)];
    if (this.deck) tracks.push(this.deck.track);
    if (this.wanted) tracks.push(this.wanted);
    if (tracks.some((track) => BOSS_TRACKS.includes(track))) tracks.push('enrage-sting');
    for (const track of tracks) for (const file of this.files(track)) keep.add(file);
    for (const file of [...this.buffers.keys()]) if (!keep.has(file)) this.buffers.delete(file);
  }
}

/** Bar start times (seconds) over one pass of a track, from its tempo and meter; empty without a tempo. */
export function barTimes(spec: Pick<MusicTrackSpec, 'bpm' | 'meter'>, duration: number) {
  if (!spec.bpm || spec.bpm <= 0) return [];
  const meter = spec.meter?.length ? spec.meter : [4];
  const times: number[] = [];
  let time = 0;
  for (let bar = 0; time < duration - 1e-6 && bar < 10_000; bar += 1) {
    times.push(time);
    time += (meter[bar % meter.length] * 60) / spec.bpm;
  }
  return times;
}

/** Draws a gain shape over [0, 1] as linear ramps from now (the first point is set at once). */
function glide(param: AudioParam, now: number, seconds: number, shape: (x: number) => number) {
  param.setValueAtTime(Math.max(QUIET, shape(0)), now);
  for (let step = 1; step <= FADE_STEPS; step += 1) {
    param.linearRampToValueAtTime(Math.max(QUIET, shape(step / FADE_STEPS)), now + (seconds * step) / FADE_STEPS);
  }
}
