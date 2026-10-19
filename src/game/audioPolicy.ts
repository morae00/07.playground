// Audio policy (AUD-01): the cue table every game and UI sound plays through, bus levels, and the voice rules
// the mixer follows. Pure data and arithmetic, so it runs and is tested without Web Audio.
import SOUND_CUES from '../content/data/soundCues.ts';
import type { ImpactTier } from './visualContracts.ts';

export type SoundBus = 'music' | 'sfx' | 'ui' | 'ambience';

/** Stand-in synth tone for a cue until a sound pack supplies samples (the 0.1.0 sounds, unchanged). */
export type SynthTone = {
  frequency: number;
  /** Random pitch spread added on top of frequency, in Hz. */
  spread: number;
  duration: number;
  oscillator: OscillatorType;
  gain: number;
};

export type CueSpec = {
  bus: SoundBus;
  /** Higher priorities take voices from lower ones when every voice is busy. */
  priority: number;
  /** Most voices of this cue sounding at once; one more replaces the oldest. */
  maxVoices: number;
  /** Seconds before the cue, or any cue in its group, can start again. */
  spacing: number;
  group?: string;
  synth: SynthTone;
};

export const CUES = SOUND_CUES;

/** The enemy kill each chapter's material makes (AUD-04); Ch1 keeps the paper tear. */
export const KILL_CUES: readonly CueId[] = ['enemy.kill', 'enemy.kill.iron', 'enemy.kill.water', 'enemy.kill.clock', 'enemy.kill.eclipse'];

export type CueId = keyof typeof CUES;

export const HIT_CUES: Readonly<Record<ImpactTier, CueId>> = { light: 'hit.light', heavy: 'hit.heavy', critical: 'hit.critical' };

/** Most voices sounding at once across every bus. */
export const MAX_VOICES = 16;
/**
 * Peak level of one synth voice before the bus and master gains. 0.1.0 played its tones at 0.055 (−25 dBFS), which
 * left the effects 14-18 LU under the ambience and the whole mix near −35 LUFS at the default volume (AUD-05); the
 * mix plan B raises the effects 16 dB, so pile-ups now reach the limiter it was built to catch them with.
 */
export const SYNTH_PEAK = 0.347;
/** Peak the sound pack files are normalized to (art/sfx-spec.mjs SFX_PEAK); samples play back at the synth level. */
export const SAMPLE_PEAK = 0.9;
/**
 * Each chapter's ambience bed level on the ambience bus (AUD-05 plan B): about 10 LU under the effects, set per bed
 * because the beds' own loudness spans 6.7 LU (docs/decisions/AUD-05-loudness.md).
 */
export const AMBIENCE_LEVELS: Readonly<Partial<Record<CueId, number>>> = Object.freeze({
  'ambience.ch1': 0.122,
  'ambience.ch2': 0.07,
  'ambience.ch3': 0.081,
  'ambience.ch4': 0.152,
  'ambience.ch5': 0.074,
});
/** How far a sound at the screen edge sits toward that speaker (1 would be hard left or right). */
export const PAN_SPREAD = 0.6;
/** Limiter on the master bus: catches pile-ups without touching a single voice. */
export const LIMITER = Object.freeze({ threshold: -3, knee: 0, ratio: 20, attack: 0.002, release: 0.12 });
/**
 * A DynamicsCompressorNode adds makeup gain of (1 / curve(0 dBFS))^0.6 to everything (Web Audio spec); the master
 * gain divides it back out so the limiter does not make the game louder.
 */
export const LIMITER_MAKEUP = (1 / 10 ** ((LIMITER.threshold - LIMITER.threshold / LIMITER.ratio) / 20)) ** 0.6;

function unit(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

export type SoundLevels = Record<'master' | SoundBus, number>;

/** Bus levels from the three volume options: UI sounds follow the effects level and ambience follows music. */
export function mixLevels(options: { volume: number; musicVolume: number; sfxVolume: number }): SoundLevels {
  const music = unit(options.musicVolume);
  const sfx = unit(options.sfxVolume);
  return { master: unit(options.volume), music, sfx, ui: sfx, ambience: music };
}

/** What the game and the UI play sounds through: the app's mixer, or a recorder in tests. */
export interface SoundOutput {
  /** Called from user gestures and run starts: browsers only start audio after a gesture. */
  unlock(): void;
  /**
   * pan runs from -1 (left edge of the screen) to 1 (right edge); pitch scales the frequency (1 = as authored).
   * Returns the voice's id when it sounds, for stop.
   */
  play(cue: CueId, pan?: number, pitch?: number): number | void;
  /** Fades a voice out before its end: a fuse whose bomber was felled stops ticking (S4). */
  stop?(voice: number): void;
}

export type VoiceSlot = { id: number; cue: CueId; priority: number; endsAt: number };
export type VoiceCounts = { started: number; spaced: number; dropped: number; stolen: number; peak: number };

/**
 * Voice bookkeeping on the audio clock. A cue waits out its group's spacing; a cue at its own voice limit replaces
 * its oldest voice; when all voices are busy it takes the oldest voice of the lowest priority, or stays silent if
 * every voice outranks it.
 */
export class VoiceLedger {
  readonly voices: VoiceSlot[] = [];
  readonly counts: VoiceCounts = { started: 0, spaced: 0, dropped: 0, stolen: 0, peak: 0 };
  private readonly readyAt = new Map<string, number>();
  private readonly limit: number;
  private lastId = 0;

  constructor(limit = MAX_VOICES) {
    this.limit = limit;
  }

  /** Admits a cue at audio time now for duration seconds: the new voice and the voice it cuts, or null. */
  request(cueId: CueId, now: number, duration: number): { voice: VoiceSlot; cut: VoiceSlot | null } | null {
    this.expire(now);
    const spec: CueSpec = CUES[cueId];
    const key = spec.group ?? cueId;
    if (now < (this.readyAt.get(key) ?? Number.NEGATIVE_INFINITY)) {
      this.counts.spaced += 1;
      return null;
    }
    let same = 0;
    let oldestSame: VoiceSlot | null = null;
    let lowest: VoiceSlot | null = null;
    for (const voice of this.voices) {
      if (voice.cue === cueId) {
        same += 1;
        oldestSame ??= voice;
      }
      if (!lowest || voice.priority < lowest.priority) lowest = voice;
    }
    let cut: VoiceSlot | null = null;
    if (same >= spec.maxVoices) {
      cut = oldestSame;
    } else if (this.voices.length >= this.limit) {
      if (!lowest || lowest.priority > spec.priority) {
        this.counts.dropped += 1;
        return null;
      }
      cut = lowest;
    }
    if (cut) {
      this.voices.splice(this.voices.indexOf(cut), 1);
      this.counts.stolen += 1;
    }
    this.lastId += 1;
    const voice = { id: this.lastId, cue: cueId, priority: spec.priority, endsAt: now + duration };
    this.voices.push(voice);
    this.readyAt.set(key, now + spec.spacing);
    this.counts.started += 1;
    this.counts.peak = Math.max(this.counts.peak, this.voices.length);
    return { voice, cut };
  }

  /** Frees a voice stopped early; the voice, or null when it already ended or was cut. */
  release(id: number): VoiceSlot | null {
    const index = this.voices.findIndex((voice) => voice.id === id);
    return index < 0 ? null : this.voices.splice(index, 1)[0];
  }

  /** Forgets voices that have finished by audio time now. */
  expire(now: number) {
    let kept = 0;
    for (const voice of this.voices) {
      if (voice.endsAt > now) this.voices[kept++] = voice;
    }
    this.voices.length = kept;
  }
}
