// Skill numbers and the draft-card copy generated from them (BUG-16).
// The engine reads every number a player can see on a card from SKILL_NUMBERS. The level and awakening copy are
// templates in the locale files (UI-10), filled below from the same entries, so a description cannot drift from what
// the skill does in any language.
// Damage entries are coefficients of the player's attack; per-level entries are the total at that level.
import SKILL_NUMBER_TABLE from '../content/data/skillNumbers.ts';
import AWAKENINGS from '../content/data/awakenings.ts';
import type { ArsenalId, CoreSkillId, SkillId } from './engine/worldTypes.ts';
import { ARSENAL, ARSENAL_AWAKENING as AWAKENING, ARSENAL_IDS, arsenalStats } from './arsenal.ts';
import { text, type StringKey, type Text, type TextParam } from '../i18n/text.ts';
import {
  COIN_FEVER_FRENZY_ATTACK_SPEED_MULTIPLIER,
  COIN_FEVER_FRENZY_DURATION,
  PAPER_WARD_INVULNERABILITY_PER_LEVEL,
} from './p1Core.ts';

/** base + perLevel × level, plus a flat bonus once awakened. */
export type Scaling = Readonly<{ base: number; perLevel: number; awakened?: number }>;

export function scaleAt(scaling: Scaling, level: number, awakened = false) {
  return scaling.base + level * scaling.perLevel + (awakened ? (scaling.awakened ?? 0) : 0);
}

export const SKILL_NUMBERS = SKILL_NUMBER_TABLE;

const N = SKILL_NUMBERS;

export function needleCount(level: number, awakened: boolean) {
  const extra = N.needleStorm.extraNeedleLevels.filter((threshold) => level >= threshold).length;
  return 1 + extra + (awakened ? N.needleStorm.awakenedNeedles : 0);
}

export function frostLineSlow(level: number) {
  return Math.min(N.frostLine.slowCap, scaleAt(N.frostLine.slow, level));
}

/** Mirror clone volley: two parallel flank shots; the reworked awakening adds aimed shots and pierce. */
export function mirrorCloneVolley(level: number, reworkedAwakening: boolean) {
  const m = N.mirrorClone;
  return {
    flankShots: 2,
    aimedShots: reworkedAwakening ? m.awakenedShots : 0,
    pierce: m.basePierce + Math.floor(level / 2) + (reworkedAwakening ? m.awakenedPierce : 0),
  };
}

/** Up to two decimals without float noise: 1.0499999999999998 -> "1.05", 3.5999999999999996 -> "3.6". */
export function formatNumber(value: number, digits = 2) {
  return String(Number(value.toFixed(digits)));
}

export function formatPercent(ratio: number, digits = 0) {
  return formatNumber(ratio * 100, digits);
}

const num = formatNumber;
const pct = formatPercent;
const gain = (scaling: Scaling, level: number) => level * scaling.perLevel;
/** Growth relative to the level-0 value, for stats that have no natural unit on screen (pull strength). */
const relative = (scaling: Scaling, level: number) => gain(scaling, level) / scaling.base;

/** One of a skill's numbers at a level, as a card prints it: the label and the value (UI-10: keys, not words). */
export type StatLine = readonly [label: StringKey, value: TextParam];
/** Every skill prints two numbers. */
export type SkillStats = readonly [StatLine, StatLine];

const count = (n: number | string) => text('unit.count', { n });
const times = (n: number | string) => text('unit.times', { n });

/** A skill's numbers at a level. The level copy and the draft card's change rows (UI-03) both read these. */
const CORE_LEVEL_STATS: Record<CoreSkillId, (level: number) => SkillStats> = {
  needleStorm: (level) => [['stat.damage', `+${pct(gain(N.needleStorm.damage, level))}%`], ['stat.projectiles', count(needleCount(level, false))]],
  fanKnives: (level) => [['stat.knives', count(num(scaleAt(N.fanKnives.knives, level)))], ['stat.cooldown', `-${num(level * N.fanKnives.cooldownPerLevel)}s`]],
  chainSpark: (level) => [['stat.jumps', times(num(scaleAt(N.chainSpark.jumps, level)))], ['stat.damage', `+${pct(gain(N.chainSpark.damage, level))}%`]],
  frostLine: (level) => [['stat.width', `+${num(gain(N.frostLine.width, level))}`], ['stat.slow', `${pct(frostLineSlow(level))}%`]],
  orbitScythes: (level) => [['stat.blades', count(num(scaleAt(N.orbitScythes.blades, level)))], ['stat.orbitRadius', `+${num(gain(N.orbitScythes.radius, level))}`]],
  boneMortar: (level) => [['stat.blastRadius', `+${num(gain(N.boneMortar.radius, level))}`], ['stat.damage', `+${pct(gain(N.boneMortar.damage, level))}%`]],
  railSpear: (level) => [['stat.width', `+${num(gain(N.railSpear.width, level))}`], ['stat.damage', `+${pct(gain(N.railSpear.damage, level))}%`]],
  mirrorClone: (level) => [['stat.cloneDamage', `+${pct(gain(N.mirrorClone.damage, level))}%`], ['stat.pierce', `+${Math.floor(level / 2)}`]],
  voidMine: (level) => [['stat.duration', `+${num(gain(N.voidMine.duration, level))}s`], ['stat.pull', `+${pct(relative(N.voidMine.pull, level))}%`]],
  blackSun: (level) => [['stat.duration', `+${num(gain(N.blackSun.duration, level))}s`], ['stat.pull', `+${pct(relative(N.blackSun.pull, level))}%`]],
  ironFrame: (level) => [['stat.defense', `+${num(scaleAt(N.ironFrame.defense, level))}`], ['stat.maxHp', `+${num(scaleAt(N.ironFrame.maxHp, level))}`]],
  magnetSigil: (level) => [['stat.pickupRange', `+${num(scaleAt(N.magnetSigil.magnet, level))}`], ['stat.coinGain', `+${pct(scaleAt(N.magnetSigil.coinGain, level))}%`]],
  paperWard: (level) => [['stat.defense', `+${num(scaleAt(N.paperWard.defense, level))}`], ['stat.hitInvulnerability', `+${num(level * PAPER_WARD_INVULNERABILITY_PER_LEVEL)}s`]],
  recoveryThread: (level) => [['stat.regen', `+${num(scaleAt(N.recoveryThread.regen, level))}`], ['stat.magnet', `+${num(scaleAt(N.recoveryThread.magnet, level))}`]],
  coinFever: (level) => [['stat.coins', `+${pct(scaleAt(N.coinFever.coinGain, level))}%`], ['stat.attackSpeed', `+${pct(scaleAt(N.coinFever.attackSpeed, level))}%`]],
  eclipseStep: (level) => [['stat.slashRadius', `+${num(gain(N.eclipseStep.radius, level))}`], ['stat.invulnerability', `+${num(gain(N.eclipseStep.invulnerability, level))}s`]],
  executionMark: (level) => [['stat.crit', `+${pct(scaleAt(N.executionMark.critChance, level))}%`], ['stat.bossDamage', `+${pct(scaleAt(N.executionMark.bossDamage, level))}%`]],
};

/** SYS-15: an arsenal weapon's card prints its damage and the number its kind grows by. */
function arsenalLevelStats(id: ArsenalId) {
  const weapon = ARSENAL[id];
  return (level: number): SkillStats => {
    const stats = arsenalStats(weapon, level, false);
    const damage: StatLine = ['stat.damage', `${pct(stats.damage)}%`];
    if (weapon.kind === 'chain') return [damage, ['stat.jumps', times(stats.jumps)]];
    if (weapon.kind === 'nova' || weapon.kind === 'lob' || weapon.kind === 'halo') return [damage, ['stat.blastRadius', num(stats.radius)]];
    if (weapon.kind === 'beam') return [damage, ['stat.cooldown', `${num(stats.cooldown)}s`]];
    return [damage, ['stat.projectiles', count(stats.count)]];
  };
}

export const SKILL_LEVEL_STATS: Record<SkillId, (level: number) => SkillStats> = {
  ...CORE_LEVEL_STATS,
  ...Object.fromEntries(ARSENAL_IDS.map((id) => [id, arsenalLevelStats(id)])),
} as Record<SkillId, (level: number) => SkillStats>;

/** The level copy: a skill's two numbers at a level on one line. */
export function skillLevelText(id: SkillId, level: number): Text {
  const [[a, av], [b, bv]] = SKILL_LEVEL_STATS[id](level);
  return text('skill.levelStats', { a: text(a), av, b: text(b), bv });
}

const bonus = (scaling: Scaling) => scaling.awakened ?? 0;

/** The awakening copy: each skill's template (skill.<id>.awakening) filled with the numbers it names. */
const CORE_AWAKENING_TEXT: Record<CoreSkillId, Text> = {
  needleStorm: text('skill.needleStorm.awakening', { needles: N.needleStorm.awakenedNeedles, damage: pct(bonus(N.needleStorm.damage)), pierce: N.needleStorm.awakenedPierce, shard: pct(N.needleStorm.shardDamage) }),
  fanKnives: text('skill.fanKnives.awakening', { knives: num(bonus(N.fanKnives.knives)) }),
  chainSpark: text('skill.chainSpark.awakening', { jumps: num(bonus(N.chainSpark.jumps)), damage: pct(bonus(N.chainSpark.damage)), stun: num(N.chainSpark.stunSeconds) }),
  frostLine: text('skill.frostLine.awakening', { width: num(bonus(N.frostLine.width)), root: num(N.frostLine.rootSeconds) }),
  orbitScythes: text('skill.orbitScythes.awakening', { blades: N.orbitScythes.awakenedOuterBlades }),
  boneMortar: text('skill.boneMortar.awakening', { radius: num(bonus(N.boneMortar.radius)), damage: pct(bonus(N.boneMortar.damage)), aftershock: pct(N.boneMortar.aftershockDamage) }),
  railSpear: text('skill.railSpear.awakening', { width: num(bonus(N.railSpear.width)), damage: pct(bonus(N.railSpear.damage)), fissure: pct(N.railSpear.fissureDamage) }),
  mirrorClone: text('skill.mirrorClone.awakening', { shots: N.mirrorClone.awakenedShots, pierce: N.mirrorClone.awakenedPierce, chance: pct(N.mirrorClone.railCopyChance), railDamage: pct(N.mirrorClone.railCopyDamage) }),
  voidMine: text('skill.voidMine.awakening', { radius: num(bonus(N.voidMine.radius)), duration: num(bonus(N.voidMine.duration)) }),
  blackSun: text('skill.blackSun.awakening', { radius: num(bonus(N.blackSun.radius)), duration: num(bonus(N.blackSun.duration)) }),
  ironFrame: text('skill.ironFrame.awakening', { defense: num(bonus(N.ironFrame.defense)), maxHp: num(bonus(N.ironFrame.maxHp)), shield: num(N.ironFrame.shieldSeconds) }),
  magnetSigil: text('skill.magnetSigil.awakening', { magnet: num(bonus(N.magnetSigil.magnet)), coins: pct(bonus(N.magnetSigil.coinGain)), pulse: num(N.magnetSigil.pulseSeconds) }),
  paperWard: text('skill.paperWard.awakening', { defense: num(bonus(N.paperWard.defense)), radius: N.paperWard.pushRadius }),
  recoveryThread: text('skill.recoveryThread.awakening', { regen: num(bonus(N.recoveryThread.regen)), magnet: num(bonus(N.recoveryThread.magnet)), counter: num(N.recoveryThread.counterSeconds) }),
  coinFever: text('skill.coinFever.awakening', { seconds: num(COIN_FEVER_FRENZY_DURATION), boost: pct(COIN_FEVER_FRENZY_ATTACK_SPEED_MULTIPLIER - 1) }),
  eclipseStep: text('skill.eclipseStep.awakening', { radius: num(bonus(N.eclipseStep.radius)), damage: pct(N.eclipseStep.afterimageDamage) }),
  executionMark: text('skill.executionMark.awakening', { crit: pct(bonus(N.executionMark.critChance)), boss: pct(bonus(N.executionMark.bossDamage)), bonus: pct(N.executionMark.lowHpBossBonus) }),
};

/** SYS-15: an arsenal weapon's awakening names the count its kind grows (shots, blasts, or hops), if it has one. */
function arsenalAwakening(id: ArsenalId): Text {
  const { kind } = ARSENAL[id];
  const numbers = { damage: pct(AWAKENING.damage - 1), reach: pct(AWAKENING.reach - 1) };
  if (kind === 'nova' || kind === 'halo' || kind === 'beam') return text('skill.arsenal.awakening.reach', numbers);
  return text('skill.arsenal.awakening', { ...numbers, count: text(kind === 'chain' ? 'stat.jumps' : 'stat.projectiles') });
}

export const SKILL_AWAKENING_TEXT: Record<SkillId, Text> = {
  ...CORE_AWAKENING_TEXT,
  ...Object.fromEntries(ARSENAL_IDS.map((id) => [id, arsenalAwakening(id)])),
} as Record<SkillId, Text>;

/** SYS-16: the gimmick numbers a card prints as percents (src/content/data/awakenings.ts); the rest print as they are. */
const GIMMICK_SHARES: ReadonlySet<string> = new Set(['damage', 'share', 'haste', 'growth', 'area', 'branch', 'weaken', 'prey']);

/** SYS-16: each weapon's awakening gimmick (skill.<id>.awakeningGimmick), filled from its row of the awakenings table. */
export const ARSENAL_GIMMICK_TEXT = Object.fromEntries(ARSENAL_IDS.map((id) => [
  id,
  text(`skill.${id}.awakeningGimmick`, Object.fromEntries(Object.entries(AWAKENINGS[id]).map(([key, value]: [string, number]) => [key, GIMMICK_SHARES.has(key) ? pct(value) : num(value)]))),
])) as Record<ArsenalId, Text>;

/** Classic rules (0.1.0) keep the old mirror clone awakening, which only copies rail shots. */
export const CLASSIC_AWAKENING_TEXT: Partial<Record<SkillId, Text>> = {
  mirrorClone: text('skill.mirrorClone.awakening.classic', { chance: pct(N.mirrorClone.railCopyChance), railDamage: pct(N.mirrorClone.railCopyDamage) }),
};
