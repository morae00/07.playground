// Audio mixer (AUD-01): one AudioContext for the whole app session, created on the first user gesture. Every
// sound goes through its bus (music, sfx, ui, ambience) into the master gain and a limiter, under the voice
// rules in audioPolicy. A cue plays a sample once a sound pack supplies one and its synth tone until then.
import { CUES, LIMITER, LIMITER_MAKEUP, MAX_VOICES, PAN_SPREAD, SAMPLE_PEAK, SYNTH_PEAK, VoiceLedger, mixLevels, type CueId, type SoundBus, type SoundLevels, type SoundOutput, type VoiceSlot } from '../audioPolicy.ts';
import type { MusicCommand } from './musicDirector.ts';
import type { MusicPack, MusicPlayer } from './musicPlayer.ts';

/** Sample files per cue (AUD-02 fills these), relative to the pack's base path; Opus in WebM or Ogg. */
export type SoundPack = { id: string; base: string; cues: Partial<Record<CueId, readonly string[]>> };

export type MixerOptions = {
  createContext?: () => AudioContext;
  fetchFile?: (url: string) => Promise<ArrayBuffer>;
  random?: () => number;
};

/** Builds the music player on the music bus once audio opens (AUD-03); the app passes it with a music pack. */
export type MusicPlayerFactory = (options: { context: AudioContext; output: AudioNode; pack: MusicPack; fetchFile: (url: string) => Promise<ArrayBuffer> }) => MusicPlayer;

type LiveVoice = { source: AudioScheduledSourceNode; gain: GainNode };

const BUSES: readonly SoundBus[] = ['music', 'sfx', 'ui', 'ambience'];
const SILENT = 0.001;
/** Level changes glide over about 15 ms so dragging a slider does not click. */
const LEVEL_GLIDE = 0.015;
/** A voice cut for a newer one fades out this fast instead of clicking off. */
const CUT_FADE = 0.012;
/** Samples vary their pitch by up to 4% each play so repeats do not sound mechanical. */
const SAMPLE_PITCH_JITTER = 0.04;
/** AUD-04 ambience beds: their level on the ambience bus, and how long one fades into the next. */
const AMBIENCE_LEVEL = 0.3;
const AMBIENCE_FADE = 1.2;
/** Music commands kept while audio is closed; the title's play is among the first. */
const MUSIC_QUEUE = 64;

async function fetchArrayBuffer(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`sound ${url} did not load (${response.status})`);
  return response.arrayBuffer();
}

export class AudioMixer implements SoundOutput {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly buses = new Map<SoundBus, GainNode>();
  private readonly live = new Map<number, LiveVoice>();
  private readonly samples = new Map<CueId, AudioBuffer[]>();
  private readonly waiting: { pack: SoundPack; done: (complete: boolean) => void }[] = [];
  private readonly ledger = new VoiceLedger(MAX_VOICES);
  private ambienceCue: CueId | null = null;
  private ambienceVoice: LiveVoice | null = null;
  private musicSetup: { pack: MusicPack; create: MusicPlayerFactory } | null = null;
  private musicPlayer: MusicPlayer | null = null;
  private readonly musicQueue: MusicCommand[] = [];
  private levels: SoundLevels = mixLevels({ volume: 0, musicVolume: 0, sfxVolume: 0 });
  private contexts = 0;
  private unavailable = false;
  private readonly createContext: () => AudioContext;
  private readonly fetchFile: (url: string) => Promise<ArrayBuffer>;
  private readonly random: () => number;

  constructor({ createContext = () => new AudioContext({ latencyHint: 'interactive' }), fetchFile = fetchArrayBuffer, random = Math.random }: MixerOptions = {}) {
    this.createContext = createContext;
    this.fetchFile = fetchFile;
    this.random = random;
  }

  /** Master, music, and effects levels from the options; applied smoothly while sounds play. */
  setLevels(options: { volume: number; musicVolume: number; sfxVolume: number }) {
    this.levels = mixLevels(options);
    const { context, master } = this;
    if (!context || !master) return;
    const now = context.currentTime;
    master.gain.setTargetAtTime(this.levels.master / LIMITER_MAKEUP, now, LEVEL_GLIDE);
    for (const [bus, gain] of this.buses) gain.gain.setTargetAtTime(this.levels[bus], now, LEVEL_GLIDE);
  }

  /** From a user gesture: opens the audio context once (never while muted) and wakes it if it was suspended. */
  unlock() {
    if (this.levels.master <= SILENT) return;
    const context = this.context ?? this.open();
    if (context?.state === 'suspended') void context.resume().catch(() => undefined);
  }

  play(cueId: CueId, pan = 0, pitch = 1) {
    const spec = CUES[cueId];
    const { context } = this;
    const bus = this.buses.get(spec.bus);
    if (!context || !bus || context.state !== 'running' || this.levels.master <= SILENT || this.levels[spec.bus] <= SILENT) return;
    const now = context.currentTime;
    const variants = this.samples.get(cueId);
    const buffer = variants?.[Math.floor(this.random() * variants.length)];
    const rate = (buffer ? 1 + (this.random() * 2 - 1) * SAMPLE_PITCH_JITTER : 1) * pitch;
    const duration = buffer ? buffer.duration / rate : spec.synth.duration + 0.01;
    const admitted = this.ledger.request(cueId, now, duration);
    if (!admitted) return;
    if (admitted.cut) this.cut(admitted.cut, now);
    const gain = context.createGain();
    let source: AudioScheduledSourceNode;
    if (buffer) {
      const sample = context.createBufferSource();
      sample.buffer = buffer;
      sample.playbackRate.value = rate;
      // Pack files are normalized to SAMPLE_PEAK; this brings a sample to the level its synth tone had.
      gain.gain.value = spec.synth.gain * (SYNTH_PEAK / SAMPLE_PEAK);
      source = sample;
    } else {
      const { frequency, spread, oscillator, duration: length, gain: level } = spec.synth;
      const tone = context.createOscillator();
      tone.type = oscillator;
      tone.frequency.value = (frequency + this.random() * spread) * pitch;
      gain.gain.value = 0.0001;
      gain.gain.exponentialRampToValueAtTime(SYNTH_PEAK * level, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
      source = tone;
    }
    source.connect(gain);
    const position = Math.max(-1, Math.min(1, Number.isFinite(pan) ? pan : 0)) * PAN_SPREAD;
    let panner: StereoPannerNode | null = null;
    if (Math.abs(position) >= 0.02) {
      panner = context.createStereoPanner();
      panner.pan.value = position;
      gain.connect(panner);
      panner.connect(bus);
    } else {
      gain.connect(bus);
    }
    const { id } = admitted.voice;
    this.live.set(id, { source, gain });
    source.addEventListener('ended', () => {
      source.disconnect();
      gain.disconnect();
      panner?.disconnect();
      this.live.delete(id);
    }, { once: true });
    source.start(now);
    source.stop(now + duration);
  }

  /**
   * Loops a chapter's ambience bed on the ambience bus, fading over from the one before; null fades it out (AUD-04).
   * A bed whose samples have not decoded yet starts once they have.
   */
  ambience(cueId: CueId | null) {
    if (cueId === this.ambienceCue) return;
    this.ambienceCue = cueId;
    this.startAmbience();
  }

  private startAmbience() {
    const { context } = this;
    const bus = this.buses.get('ambience');
    if (!context || !bus) return;
    const now = context.currentTime;
    const old = this.ambienceVoice;
    if (old) {
      old.gain.gain.cancelScheduledValues(now);
      old.gain.gain.setValueAtTime(Math.max(0.0001, old.gain.gain.value), now);
      old.gain.gain.exponentialRampToValueAtTime(0.0001, now + AMBIENCE_FADE);
      old.source.stop(now + AMBIENCE_FADE);
      this.ambienceVoice = null;
    }
    const buffer = this.ambienceCue ? this.samples.get(this.ambienceCue)?.[0] : undefined;
    if (!buffer) return;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = context.createGain();
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(AMBIENCE_LEVEL, now + AMBIENCE_FADE);
    source.connect(gain);
    gain.connect(bus);
    source.addEventListener('ended', () => {
      source.disconnect();
      gain.disconnect();
    }, { once: true });
    source.start(now);
    this.ambienceVoice = { source, gain };
  }

  /** Gives the mixer a music pack and the player for it (AUD-03); the player starts once audio opens. */
  setMusic(pack: MusicPack, create: MusicPlayerFactory) {
    if (this.musicSetup) return;
    this.musicSetup = { pack, create };
    if (this.context) this.openMusic(this.context);
  }

  /** A music director command; kept until audio opens, and dropped while the mixer has no music pack. */
  music(command: MusicCommand) {
    if (this.musicPlayer) {
      this.musicPlayer.run(command);
      return;
    }
    if (!this.musicSetup || this.unavailable) return;
    this.musicQueue.push(command);
    if (this.musicQueue.length > MUSIC_QUEUE) this.musicQueue.shift();
  }

  /** Queues a sound pack; its samples decode once audio is open. Resolves false if any file failed (synth covers it). */
  loadPack(pack: SoundPack) {
    return new Promise<boolean>((done) => {
      this.waiting.push({ pack, done });
      if (this.context) this.decodeWaiting(this.context);
    });
  }

  /** Mixer state for diagnostics and probes: voices sounding now, node sets not yet released, and totals. */
  stats() {
    if (this.context) this.ledger.expire(this.context.currentTime);
    return {
      state: this.context?.state ?? 'closed',
      contexts: this.contexts,
      limiter: this.master !== null,
      voices: this.ledger.voices.length,
      nodes: this.live.size,
      samples: this.samples.size,
      ambience: this.ambienceCue,
      music: this.musicPlayer?.stats() ?? null,
      ...this.ledger.counts,
    };
  }

  private open() {
    if (this.unavailable) return null;
    let context: AudioContext;
    try {
      context = this.createContext();
    } catch {
      // No Web Audio here: the game stays silent rather than retrying every gesture.
      this.unavailable = true;
      return null;
    }
    this.contexts += 1;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = LIMITER.threshold;
    limiter.knee.value = LIMITER.knee;
    limiter.ratio.value = LIMITER.ratio;
    limiter.attack.value = LIMITER.attack;
    limiter.release.value = LIMITER.release;
    limiter.connect(context.destination);
    const master = context.createGain();
    master.gain.value = this.levels.master / LIMITER_MAKEUP;
    master.connect(limiter);
    for (const bus of BUSES) {
      const gain = context.createGain();
      gain.gain.value = this.levels[bus];
      gain.connect(master);
      this.buses.set(bus, gain);
    }
    this.context = context;
    this.master = master;
    this.decodeWaiting(context);
    this.openMusic(context);
    return context;
  }

  private openMusic(context: AudioContext) {
    const bus = this.buses.get('music');
    if (!this.musicSetup || !bus || this.musicPlayer) return;
    this.musicPlayer = this.musicSetup.create({ context, output: bus, pack: this.musicSetup.pack, fetchFile: this.fetchFile });
    for (const command of this.musicQueue.splice(0)) this.musicPlayer.run(command);
  }

  private cut(voice: VoiceSlot, now: number) {
    const live = this.live.get(voice.id);
    if (!live) return;
    live.gain.gain.cancelScheduledValues(now);
    live.gain.gain.setValueAtTime(Math.max(0.0001, live.gain.gain.value), now);
    live.gain.gain.exponentialRampToValueAtTime(0.0001, now + CUT_FADE);
    live.source.stop(now + CUT_FADE);
  }

  private decodeWaiting(context: AudioContext) {
    for (const { pack, done } of this.waiting.splice(0)) void this.decode(context, pack).then(done);
  }

  private async decode(context: AudioContext, pack: SoundPack) {
    let complete = true;
    await Promise.all(Object.entries(pack.cues).map(async ([cueId, files]) => {
      const buffers: AudioBuffer[] = [];
      for (const file of files ?? []) {
        try {
          buffers.push(await context.decodeAudioData(await this.fetchFile(`${pack.base}${file}`)));
        } catch {
          complete = false;
        }
      }
      if (buffers.length > 0) this.samples.set(cueId as CueId, buffers);
      if (cueId === this.ambienceCue && !this.ambienceVoice) this.startAmbience();
    }));
    return complete;
  }
}
