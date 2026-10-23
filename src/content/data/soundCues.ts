// Sound cues (AUD-01, AUD-04): every game and UI sound's bus, priority, voice and spacing rules, and its stand-in
// synth tone. Data, not code: built apps read it from assets/content/tables.json, and tests and tools import this
// module (see ./index.ts).
import type { CueSpec, SoundBus } from '../../game/audioPolicy.ts';
import { deepFreeze } from '../deepFreeze.ts';

type ToneArgs = [frequency: number, duration: number, oscillator: OscillatorType, gain?: number, spread?: number];

/** A spacing group's name, or the cue's optional voice rules (CueSpec: group, keep, jitter). */
type CueRules = string | Pick<CueSpec, 'group' | 'keep' | 'jitter'>;

function cue(bus: SoundBus, priority: number, maxVoices: number, spacing: number, [frequency, duration, oscillator, gain = 1, spread = 0]: ToneArgs, rules: CueRules = {}): CueSpec {
  const { group, keep, jitter } = typeof rules === 'string' ? { group: rules } : rules;
  // No key at all rather than an undefined one, so the table survives JSON unchanged.
  return {
    bus,
    priority,
    maxVoices,
    spacing,
    ...(group === undefined ? {} : { group }),
    ...(keep === undefined ? {} : { keep }),
    ...(jitter === undefined ? {} : { jitter }),
    synth: { frequency, spread, duration, oscillator, gain },
  };
}

const SOUND_CUES = {
  // The impact-tier contract (G13): heavier hits sound lower, longer, and louder, and share one spacing group. A heavier
  // tier outranks a lighter one, so a stream of light hits never holds back a heavy or critical one (AUD-02, P1-5).
  'hit.light': cue('sfx', 2, 2, 0.035, [270, 0.018, 'square', 0.72, 72], 'hit'),
  'hit.heavy': cue('sfx', 3, 2, 0.044, [178, 0.032, 'triangle', 1.1, 48], 'hit'),
  'hit.critical': cue('sfx', 3, 2, 0.055, [118, 0.055, 'sawtooth', 1.35, 34], 'hit'),
  'shield.block': cue('sfx', 2, 1, 0.05, [1480, 0.025, 'square'], 'hit'),
  // One kill sound per 30 ms: an area skill that clears 30 enemies no longer stacks 30 voices.
  'enemy.kill': cue('sfx', 2, 3, 0.03, [240, 0.035, 'square']),
  'enemy.stunned': cue('sfx', 2, 2, 0.05, [120, 0.06, 'triangle']),
  'boss.kill': cue('sfx', 5, 1, 0, [80, 0.09, 'sawtooth']),
  'boss.enraged': cue('sfx', 5, 1, 0, [65, 0.12, 'sawtooth']),
  // AUD-02 (P1-1): the hurt sits at or above the flow of hits and kills, not under it.
  'player.hurt': cue('sfx', 4, 1, 0.05, [140, 0.025, 'triangle', 1.45]),
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
  'cast.blackSun': cue('sfx', 1, 2, 0.03, [70, 0.06, 'sine', 0.7]),
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
  // Chapter materials (AUD-04): Ch2-5 enemies die in iron, water, clockwork, and eclipse glass, each held within 1 LU
  // of the Ch1 paper tear by its gain (AUD-02, P1-3; art/audio/p1-mix.md).
  'enemy.kill.iron': cue('sfx', 2, 3, 0.03, [880, 0.03, 'triangle']),
  'enemy.kill.water': cue('sfx', 2, 3, 0.03, [320, 0.04, 'sine', 0.82]),
  'enemy.kill.clock': cue('sfx', 2, 3, 0.03, [1250, 0.025, 'square', 0.77]),
  'enemy.kill.eclipse': cue('sfx', 2, 3, 0.03, [1760, 0.04, 'sine', 0.56]),
  // Boss patterns (AUD-04): one gesture per pattern, when it fires; they share a spacing group. The loud ones are held
  // near the family's level, and the shock, which sounds as it is telegraphed, is raised toward it (AUD-02, P1-4).
  'boss.dash': cue('sfx', 4, 1, 0.2, [90, 0.1, 'sawtooth'], 'bossAttack'),
  'boss.rings': cue('sfx', 4, 1, 0.2, [392, 0.12, 'sine'], 'bossAttack'),
  'boss.shock': cue('sfx', 4, 1, 0.2, [70, 0.1, 'square', 1.4], 'bossAttack'),
  'boss.clones': cue('sfx', 4, 1, 0.2, [1175, 0.08, 'triangle', 0.7], 'bossAttack'),
  'boss.flame': cue('sfx', 4, 1, 0.2, [140, 0.12, 'sawtooth'], 'bossAttack'),
  'boss.tide': cue('sfx', 4, 1, 0.2, [110, 0.14, 'sine', 0.6], 'bossAttack'),
  'boss.traps': cue('sfx', 4, 1, 0.2, [740, 0.05, 'square'], 'bossAttack'),
  'boss.clock': cue('sfx', 4, 1, 0.2, [1760, 0.04, 'square'], 'bossAttack'),
  'boss.saw': cue('sfx', 4, 1, 0.2, [180, 0.1, 'sawtooth'], 'bossAttack'),
  'boss.eclipse': cue('sfx', 4, 1, 0.2, [55, 0.16, 'sine'], 'bossAttack'),
  'boss.null': cue('sfx', 4, 1, 0.2, [880, 0.1, 'sine', 0.55], 'bossAttack'),
  // Ambience beds (AUD-04): loops on the ambience bus (AudioMixer.ambience); no synth stand-in, silent until loaded.
  'ambience.ch1': cue('ambience', 1, 1, 0, [0, 0, 'sine', 0]),
  'ambience.ch2': cue('ambience', 1, 1, 0, [0, 0, 'sine', 0]),
  'ambience.ch3': cue('ambience', 1, 1, 0, [0, 0, 'sine', 0]),
  'ambience.ch4': cue('ambience', 1, 1, 0, [0, 0, 'sine', 0]),
  'ambience.ch5': cue('ambience', 1, 1, 0, [0, 0, 'sine', 0]),
  // SYS-14 bombers: a planted fuse sizzles toward its blast; the blast is the loudest thing on the field. The sizzle
  // carries no timing and sits well under the ticks (bomber.tick, last in the table); a fuse that sounds keeps its
  // voice, so the bomber that goes off first is never the one cut (AUD-02, P0-3).
  'bomber.fuse': cue('sfx', 2, 3, 0.08, [1500, 0.08, 'square', 0.15], { keep: 'oldest' }),
  'bomber.blast': cue('sfx', 5, 3, 0.05, [70, 0.32, 'sawtooth', 1.4]),
  // SYS-15 arsenal casts (K10 Q7): each weapon's own cast; presentation falls back to cast.<look> without one. Priority 1
  // like the look casts, so warnings and hits always win a voice. No shared group: castOrder fires every ready weapon in
  // one tick, and a group spacing would always silence the ones later in the table. The sprays and the orbit are spaced.
  'cast.inkDarts': cue('sfx', 1, 2, 0.03, [820, 0.025, 'triangle', 0.8]),
  'cast.brushQuills': cue('sfx', 1, 2, 0.03, [1300, 0.03, 'triangle', 0.8]),
  'cast.sealArrows': cue('sfx', 1, 2, 0.03, [210, 0.05, 'triangle', 0.9]),
  'cast.frostNeedles': cue('sfx', 1, 2, 0.03, [1500, 0.03, 'sine', 0.7]),
  'cast.thunderNeedles': cue('sfx', 1, 2, 0.03, [180, 0.035, 'sawtooth', 0.8]),
  'cast.twinBlades': cue('sfx', 1, 2, 0.03, [1050, 0.04, 'triangle', 0.8]),
  'cast.ghostVolley': cue('sfx', 1, 2, 0.03, [1300, 0.05, 'sine', 0.5]),
  'cast.headsmanDarts': cue('sfx', 1, 2, 0.03, [620, 0.05, 'triangle', 0.9]),
  'cast.paperStorm': cue('sfx', 1, 2, 0.03, [900, 0.05, 'triangle', 0.8]),
  'cast.inkBloom': cue('sfx', 1, 2, 0.03, [330, 0.04, 'sine', 0.8]),
  'cast.thornHalo': cue('sfx', 1, 2, 0.03, [1720, 0.025, 'triangle', 0.8]),
  'cast.starShards': cue('sfx', 1, 2, 0.03, [1400, 0.035, 'triangle', 0.5]),
  'cast.sunNeedles': cue('sfx', 1, 1, 0.05, [1600, 0.04, 'sine', 0.6]),
  'cast.inkDrizzle': cue('sfx', 1, 1, 0.14, [1300, 0.015, 'triangle', 0.7]),
  'cast.pinHail': cue('sfx', 1, 1, 0.14, [1800, 0.012, 'sine', 0.7]),
  'cast.tailGuard': cue('sfx', 1, 2, 0.03, [840, 0.03, 'triangle', 0.8]),
  'cast.smokeTail': cue('sfx', 1, 2, 0.03, [500, 0.05, 'sine', 0.7]),
  'cast.gravePins': cue('sfx', 1, 2, 0.03, [300, 0.035, 'triangle', 0.8]),
  'cast.trackingSeals': cue('sfx', 1, 2, 0.03, [700, 0.03, 'triangle', 0.8]),
  'cast.huntersMarks': cue('sfx', 1, 2, 0.03, [600, 0.035, 'triangle', 0.8]),
  'cast.crowFeathers': cue('sfx', 1, 2, 0.03, [400, 0.04, 'triangle', 0.8]),
  'cast.bossbane': cue('sfx', 1, 1, 0.05, [110, 0.06, 'sine', 1]),
  'cast.inkLightning': cue('sfx', 1, 2, 0.03, [95, 0.06, 'sawtooth', 0.95]),
  'cast.brushDownpour': cue('sfx', 1, 2, 0.03, [160, 0.04, 'triangle', 0.9]),
  'cast.fallingScroll': cue('sfx', 1, 1, 0.05, [140, 0.07, 'sine', 1]),
  'cast.seventhSeal': cue('sfx', 1, 1, 0.05, [150, 0.05, 'triangle', 1]),
  'cast.inkPulse': cue('sfx', 1, 1, 0.05, [85, 0.07, 'sine', 1]),
  'cast.frostRing': cue('sfx', 1, 1, 0.05, [1050, 0.06, 'sine', 0.8]),
  'cast.thunderclap': cue('sfx', 1, 1, 0.05, [110, 0.08, 'sawtooth', 1]),
  'cast.silenceBell': cue('sfx', 1, 1, 0.05, [880, 0.12, 'sine', 0.6]),
  'cast.inkPots': cue('sfx', 1, 2, 0.03, [1720, 0.03, 'triangle', 0.8]),
  'cast.clusterPots': cue('sfx', 1, 2, 0.03, [2050, 0.025, 'triangle', 0.8]),
  'cast.tarJar': cue('sfx', 1, 1, 0.05, [220, 0.05, 'sine', 0.9]),
  'cast.meteorBrush': cue('sfx', 1, 1, 0.05, [70, 0.1, 'sawtooth', 0.8]),
  'cast.sparkThread': cue('sfx', 1, 2, 0.03, [1400, 0.025, 'triangle', 0.8]),
  'cast.stormThread': cue('sfx', 1, 2, 0.03, [130, 0.05, 'sawtooth', 0.9]),
  'cast.frostChainlet': cue('sfx', 1, 2, 0.03, [980, 0.035, 'triangle', 0.8]),
  'cast.inkLance': cue('sfx', 1, 2, 0.03, [1660, 0.04, 'triangle', 0.9]),
  'cast.wideBrush': cue('sfx', 1, 2, 0.03, [700, 0.05, 'triangle', 0.9]),
  'cast.crossStrokes': cue('sfx', 1, 1, 0.05, [1500, 0.04, 'triangle', 0.9]),
  'cast.judgmentLine': cue('sfx', 1, 1, 0.05, [200, 0.1, 'triangle', 0.9]),
  'cast.inkOrbit': cue('sfx', 1, 1, 0.1, [1000, 0.03, 'triangle', 0.6]),
  'cast.wardRing': cue('sfx', 1, 2, 0.03, [130, 0.05, 'triangle', 0.9]),
  'cast.eclipseHalo': cue('sfx', 1, 1, 0.05, [130, 0.08, 'sine', 0.7]),
  // AUD-02 (P0-3): one amber clack per fuse tick, which the presentation plays on simulation time with a rising pitch;
  // no pitch jitter, so the rise reads. The ticks that sound keep their voices.
  'bomber.tick': cue('sfx', 4, 4, 0.03, [2900, 0.03, 'triangle', 1.6], { keep: 'oldest', jitter: 0 }),
  // AUD-06 warnings (V3, the amber family): clacks as a threat starts its windup, at least 3 LU over the flow of hits
  // and kills (art/audio/p1-mix.md). A ranged aim or a charger's windup (pitched lower), and a boss's armed pattern or
  // dash. The warnings that sound keep their voices; no spacing group, so no other cue can hold one back.
  'warn.ranged': cue('sfx', 5, 2, 0.12, [3000, 0.03, 'triangle', 2.1], { keep: 'oldest' }),
  'warn.boss': cue('sfx', 5, 1, 0.25, [2900, 0.05, 'triangle', 1.65], { keep: 'oldest' }),
} satisfies Record<string, CueSpec>;

export default deepFreeze(SOUND_CUES);
