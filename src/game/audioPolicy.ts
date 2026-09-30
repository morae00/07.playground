// Audio policy (AUD-01): the cue table every game and UI sound plays through, bus levels, and the voice rules
// the mixer follows. Pure data and arithmetic, so it runs and is tested without Web Audio.
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

type ToneArgs = [frequency: number, duration: number, oscillator: OscillatorType, gain?: number, spread?: number];

function cue(bus: SoundBus, priority: number, maxVoices: number, spacing: number, [frequency, duration, oscillator, gain = 1, spread = 0]: ToneArgs, group?: string): CueSpec {
  return { bus, priority, maxVoices, spacing, group, synth: { frequency, spread, duration, oscillator, gain } };
}

export const CUES = {
  // The impact-tier contract (G13): heavier hits sound lower, longer, and louder, and share one spacing group.
  'hit.light': cue('sfx', 2, 2, 0.035, [270, 0.018, 'square', 0.72, 72], 'hit'),
  'hit.heavy': cue('sfx', 2, 2, 0.044, [178, 0.032, 'triangle', 1.1, 48], 'hit'),
  'hit.critical': cue('sfx', 3, 2, 0.055, [118, 0.055, 'sawtooth', 1.35, 34], 'hit'),
  'shield.block': cue('sfx', 2, 1, 0.05, [1480, 0.025, 'square'], 'hit'),
  // One kill sound per 30 ms: an area skill that clears 30 enemies no longer stacks 30 voices.
  'enemy.kill': cue('sfx', 2, 3, 0.03, [240, 0.035, 'square']),
  'enemy.stunned': cue('sfx', 2, 2, 0.05, [120, 0.06, 'triangle']),
  'boss.kill': cue('sfx', 5, 1, 0, [80, 0.09, 'sawtooth']),
  'boss.enraged': cue('sfx', 5, 1, 0, [65, 0.12, 'sawtooth']),
  'player.hurt': cue('sfx', 4, 1, 0.05, [140, 0.025, 'triangle']),
  // FX-03: the low-health heartbeat and the fall. Placeholders until the SFX library (AUD-02).
  'player.heartbeat': cue('sfx', 4, 1, 0.3, [58, 0.11, 'sine', 1.6]),
  'player.down': cue('sfx', 5, 1, 0, [62, 0.36, 'sawtooth', 1.3]),
  'cast.fanKnives': cue('sfx', 1, 2, 0.03, [390, 0.025, 'triangle']),
  'cast.chainSpark': cue('sfx', 1, 2, 0.03, [660, 0.025, 'square']),
  'cast.frostLine': cue('sfx', 1, 2, 0.03, [510, 0.04, 'sine']),
  'cast.railSpear': cue('sfx', 1, 2, 0.03, [95, 0.055, 'sawtooth']),
  'cast.boneMortar': cue('sfx', 1, 2, 0.03, [120, 0.055, 'sawtooth']),
  'cast.mirrorClone': cue('sfx', 1, 2, 0.03, [470, 0.035, 'square']),
  'cast.voidMine': cue('sfx', 1, 2, 0.03, [82, 0.055, 'sine']),
  'cast.blackSun': cue('sfx', 1, 2, 0.03, [70, 0.06, 'sine']),
  'draft.skill': cue('sfx', 3, 1, 0, [420, 0.05, 'square']),
  'draft.awakening': cue('sfx', 3, 1, 0, [110, 0.09, 'sawtooth']),
  'draft.heal': cue('sfx', 3, 1, 0, [520, 0.045, 'sine']),
  'draft.coins': cue('sfx', 3, 1, 0, [360, 0.05, 'triangle']),
  'draft.overdrive': cue('sfx', 3, 1, 0, [130, 0.08, 'sawtooth']),
  'run.upgrade': cue('ui', 3, 2, 0, [180, 0.03, 'triangle']),
  // FX-05 events, placeholders until the SFX library (AUD-02). Pickup ticks rise in pitch with the combo.
  'pickup.xp': cue('sfx', 1, 3, 0.03, [880, 0.03, 'sine', 0.6], 'pickup'),
  'pickup.coin': cue('sfx', 1, 3, 0.03, [1320, 0.028, 'triangle', 0.55], 'pickup'),
  'run.levelUp': cue('sfx', 4, 1, 0, [520, 0.22, 'triangle', 1.2]),
  'draft.sting': cue('sfx', 4, 1, 0, [196, 0.3, 'sawtooth', 1.1]),
  'boss.intro': cue('sfx', 5, 1, 0, [55, 0.5, 'sawtooth', 1.4]),
  // Placeholder UI ticks until the SFX library (AUD-02) brings recorded ones.
  'ui.confirm': cue('ui', 3, 2, 0.03, [740, 0.02, 'triangle', 0.5]),
  'ui.cancel': cue('ui', 3, 2, 0.03, [440, 0.024, 'triangle', 0.5]),
  'ui.deny': cue('ui', 3, 1, 0.08, [150, 0.04, 'square', 0.4]),
} satisfies Record<string, CueSpec>;

export type CueId = keyof typeof CUES;

export const HIT_CUES: Readonly<Record<ImpactTier, CueId>> = { light: 'hit.light', heavy: 'hit.heavy', critical: 'hit.critical' };

/** Most voices sounding at once across every bus. */
export const MAX_VOICES = 16;
/** Peak level of one synth voice before the bus and master gains (0.1.0's tone level). */
export const SYNTH_PEAK = 0.055;
/** Peak the sound pack files are normalized to (art/sfx-spec.mjs SFX_PEAK); samples play back at the synth level. */
export const SAMPLE_PEAK = 0.9;
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
  /** pan runs from -1 (left edge of the screen) to 1 (right edge); pitch scales the frequency (1 = as authored). */
  play(cue: CueId, pan?: number, pitch?: number): void;
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

  /** Forgets voices that have finished by audio time now. */
  expire(now: number) {
    let kept = 0;
    for (const voice of this.voices) {
      if (voice.endsAt > now) this.voices[kept++] = voice;
    }
    this.voices.length = kept;
  }
}
