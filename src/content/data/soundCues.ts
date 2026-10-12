// Sound cues (AUD-01, AUD-04): every game and UI sound's bus, priority, voice and spacing rules, and its stand-in
// synth tone. Data, not code: built apps read it from assets/content/tables.json, and tests and tools import this
// module (see ./index.ts).
import type { CueSpec, SoundBus } from '../../game/audioPolicy.ts';
import { deepFreeze } from '../deepFreeze.ts';

type ToneArgs = [frequency: number, duration: number, oscillator: OscillatorType, gain?: number, spread?: number];

function cue(bus: SoundBus, priority: number, maxVoices: number, spacing: number, [frequency, duration, oscillator, gain = 1, spread = 0]: ToneArgs, group?: string): CueSpec {
  // No group key at all rather than an undefined one, so the table survives JSON unchanged.
  return { bus, priority, maxVoices, spacing, ...(group === undefined ? {} : { group }), synth: { frequency, spread, duration, oscillator, gain } };
}

const SOUND_CUES = {
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
  // Chapter materials (AUD-04): Ch2-5 enemies die in iron, water, clockwork, and eclipse glass.
  'enemy.kill.iron': cue('sfx', 2, 3, 0.03, [880, 0.03, 'triangle']),
  'enemy.kill.water': cue('sfx', 2, 3, 0.03, [320, 0.04, 'sine']),
  'enemy.kill.clock': cue('sfx', 2, 3, 0.03, [1250, 0.025, 'square']),
  'enemy.kill.eclipse': cue('sfx', 2, 3, 0.03, [1760, 0.04, 'sine']),
  // Boss patterns (AUD-04): one gesture per pattern, when it fires; they share a spacing group.
  'boss.dash': cue('sfx', 4, 1, 0.2, [90, 0.1, 'sawtooth'], 'bossAttack'),
  'boss.rings': cue('sfx', 4, 1, 0.2, [392, 0.12, 'sine'], 'bossAttack'),
  'boss.shock': cue('sfx', 4, 1, 0.2, [70, 0.1, 'square'], 'bossAttack'),
  'boss.clones': cue('sfx', 4, 1, 0.2, [1175, 0.08, 'triangle'], 'bossAttack'),
  'boss.flame': cue('sfx', 4, 1, 0.2, [140, 0.12, 'sawtooth'], 'bossAttack'),
  'boss.tide': cue('sfx', 4, 1, 0.2, [110, 0.14, 'sine'], 'bossAttack'),
  'boss.traps': cue('sfx', 4, 1, 0.2, [740, 0.05, 'square'], 'bossAttack'),
  'boss.clock': cue('sfx', 4, 1, 0.2, [1760, 0.04, 'square'], 'bossAttack'),
  'boss.saw': cue('sfx', 4, 1, 0.2, [180, 0.1, 'sawtooth'], 'bossAttack'),
  'boss.eclipse': cue('sfx', 4, 1, 0.2, [55, 0.16, 'sine'], 'bossAttack'),
  'boss.null': cue('sfx', 4, 1, 0.2, [880, 0.1, 'sine'], 'bossAttack'),
  // Ambience beds (AUD-04): loops on the ambience bus (AudioMixer.ambience); no synth stand-in, silent until loaded.
  'ambience.ch1': cue('ambience', 1, 1, 0, [0, 0, 'sine', 0]),
  'ambience.ch2': cue('ambience', 1, 1, 0, [0, 0, 'sine', 0]),
  'ambience.ch3': cue('ambience', 1, 1, 0, [0, 0, 'sine', 0]),
  'ambience.ch4': cue('ambience', 1, 1, 0, [0, 0, 'sine', 0]),
  'ambience.ch5': cue('ambience', 1, 1, 0, [0, 0, 'sine', 0]),
  // SYS-14 bombers: a planted fuse hisses and ticks toward its blast; the blast is the loudest thing on the field.
  'bomber.fuse': cue('sfx', 4, 3, 0.08, [1500, 0.08, 'square', 0.7]),
  'bomber.blast': cue('sfx', 5, 3, 0.05, [70, 0.32, 'sawtooth', 1.4]),
} satisfies Record<string, CueSpec>;

export default deepFreeze(SOUND_CUES);
