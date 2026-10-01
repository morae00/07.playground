// Engine content tables (TEC-05): base stats, skills, the economy, and the bosses. Data, not code: built apps read
// them from assets/content/tables.json, and tests and tools import this module (see ./index.ts).
import type { BossDef, SkillId } from '../../game/engine/worldTypes.ts';
import type { RunUpgradeId, SkillDef, StatBlock } from '../../game/GameEngine.ts';
import type { MetaUpgradeId, PassiveId } from '../../platform/save.ts';
import { deepFreeze } from '../deepFreeze.ts';

const baseStats: StatBlock = {
  attack: 12,
  defense: 2,
  maxHp: 120,
  moveSpeed: 212,
  critChance: 0.08,
  critDamage: 1.65,
  bossDamage: 1,
  attackSpeed: 1,
  hpRegen: 1.1,
  magnet: 115,
  coinGain: 1,
};

const skills: Record<SkillId, SkillDef> = {
  needleStorm: { id: 'needleStorm', rarity: 'common', active: true, chapterMin: 1, tags: ['projectile', 'single'] },
  fanKnives: { id: 'fanKnives', rarity: 'common', active: true, chapterMin: 1, tags: ['projectile', 'fan'] },
  chainSpark: { id: 'chainSpark', rarity: 'rare', active: true, chapterMin: 1, tags: ['chain', 'instant'] },
  frostLine: { id: 'frostLine', rarity: 'rare', active: true, chapterMin: 1, tags: ['line', 'slow'] },
  orbitScythes: { id: 'orbitScythes', rarity: 'epic', active: true, chapterMin: 2, tags: ['melee', 'sustained'] },
  boneMortar: { id: 'boneMortar', rarity: 'epic', active: true, chapterMin: 2, tags: ['area', 'explosive'] },
  railSpear: { id: 'railSpear', rarity: 'legendary', active: true, chapterMin: 3, tags: ['line', 'pierce'] },
  mirrorClone: { id: 'mirrorClone', rarity: 'legendary', active: true, chapterMin: 3, tags: ['clone', 'projectile'] },
  voidMine: { id: 'voidMine', rarity: 'epic', active: true, chapterMin: 3, tags: ['zone', 'pull'] },
  blackSun: { id: 'blackSun', rarity: 'mythic', active: true, chapterMin: 4, tags: ['gravity', 'crowdControl'] },
  ironFrame: { id: 'ironFrame', rarity: 'common', active: false, chapterMin: 1, tags: ['defense', 'health'] },
  magnetSigil: { id: 'magnetSigil', rarity: 'common', active: false, chapterMin: 1, tags: ['pickup', 'coin'] },
  paperWard: { id: 'paperWard', rarity: 'rare', active: false, chapterMin: 2, tags: ['defense', 'invulnerable'] },
  recoveryThread: { id: 'recoveryThread', rarity: 'rare', active: false, chapterMin: 1, tags: ['recovery', 'magnet'] },
  coinFever: { id: 'coinFever', rarity: 'rare', active: false, chapterMin: 4, tags: ['coin', 'attackSpeed'] },
  eclipseStep: { id: 'eclipseStep', rarity: 'mythic', active: true, chapterMin: 5, tags: ['area', 'invulnerable'] },
  executionMark: { id: 'executionMark', rarity: 'legendary', active: false, chapterMin: 2, tags: ['crit', 'boss'] },
};

/** Permanent upgrades; each shows as the strings upgrade.<id> and upgrade.<id>.line. */
const metaUpgrades: Record<MetaUpgradeId, { max: number; baseCost: number; growth: number }> = {
  attack: { max: 30, baseCost: 35, growth: 1.22 },
  defense: { max: 25, baseCost: 30, growth: 1.2 },
  maxHp: { max: 30, baseCost: 32, growth: 1.21 },
  moveSpeed: { max: 20, baseCost: 40, growth: 1.24 },
  crit: { max: 20, baseCost: 48, growth: 1.26 },
  regen: { max: 20, baseCost: 36, growth: 1.23 },
  magnet: { max: 25, baseCost: 34, growth: 1.2 },
};

/**
 * Account-level passives, a tree of three branches (CON-07): the first `tier` points are the passive's own effect, and
 * the points after it the branch's second node, which adds `perPoint` to a stat. Each shows as the strings
 * passive.<id> and passive.<id>.line, its second node as passive.<id>.tier2 and passive.<id>.tier2.line.
 */
const metaPassives: Record<PassiveId, { max: number; tier: number; next: { stat: 'critDamage' | 'critChance' | 'coinGain'; perPoint: number } }> = {
  rareLuck: { max: 10, tier: 5, next: { stat: 'critDamage', perPoint: 0.02 } },
  bossHunter: { max: 10, tier: 5, next: { stat: 'critChance', perPoint: 0.004 } },
  coinMagnet: { max: 10, tier: 5, next: { stat: 'coinGain', perPoint: 0.03 } },
};

/** Run shop upgrades; each shows as the string runUpgrade.<id>, and `line` is the gain per level. */
const runUpgrades: Record<RunUpgradeId, { baseCost: number; line: string }> = {
  attack: { baseCost: 34, line: '+12%' },
  maxHp: { baseCost: 28, line: '+20' },
  moveSpeed: { baseCost: 30, line: '+6%' },
  attackSpeed: { baseCost: 38, line: '+8%' },
  magnet: { baseCost: 24, line: '+36' },
};

const fieldBosses: BossDef[] = [
  { id: 'field-shock', name: 'boss.field-shock', chapter: 1, role: 'field', pattern: 'shock', hp: 720, damage: 15, speed: 92 },
  { id: 'field-rings', name: 'boss.field-rings', chapter: 2, role: 'field', pattern: 'rings', hp: 980, damage: 17, speed: 78 },
  { id: 'field-trap', name: 'boss.field-trap', chapter: 3, role: 'field', pattern: 'traps', hp: 1260, damage: 19, speed: 88 },
  { id: 'field-clock', name: 'boss.field-clock', chapter: 4, role: 'field', pattern: 'clock', hp: 1580, damage: 22, speed: 92 },
  { id: 'field-null', name: 'boss.field-null', chapter: 5, role: 'field', pattern: 'null', hp: 1960, damage: 24, speed: 82 },
];

const roundBosses: BossDef[] = [
  { id: 's1-mid-dash', name: 'boss.s1-mid-dash', chapter: 1, role: 'mid', pattern: 'dash', hp: 2400, damage: 20, speed: 112 },
  { id: 's1-final-rings', name: 'boss.s1-final-rings', chapter: 1, role: 'final', pattern: 'rings', hp: 3600, damage: 24, speed: 74 },
  { id: 's2-mid-clones', name: 'boss.s2-mid-clones', chapter: 2, role: 'mid', pattern: 'clones', hp: 4200, damage: 27, speed: 82 },
  { id: 's2-final-flame', name: 'boss.s2-final-flame', chapter: 2, role: 'final', pattern: 'flame', hp: 5800, damage: 31, speed: 78 },
  { id: 's3-mid-tide', name: 'boss.s3-mid-tide', chapter: 3, role: 'mid', pattern: 'tide', hp: 6700, damage: 34, speed: 86 },
  { id: 's3-final-traps', name: 'boss.s3-final-traps', chapter: 3, role: 'final', pattern: 'traps', hp: 8300, damage: 38, speed: 94 },
  { id: 's4-mid-clock', name: 'boss.s4-mid-clock', chapter: 4, role: 'mid', pattern: 'clock', hp: 9400, damage: 42, speed: 100 },
  { id: 's4-final-saw', name: 'boss.s4-final-saw', chapter: 4, role: 'final', pattern: 'saw', hp: 11600, damage: 46, speed: 104 },
  { id: 's5-mid-eclipse', name: 'boss.s5-mid-eclipse', chapter: 5, role: 'mid', pattern: 'eclipse', hp: 13200, damage: 50, speed: 92 },
  { id: 's5-final-null', name: 'boss.s5-final-null', chapter: 5, role: 'final', pattern: 'null', hp: 17000, damage: 56, speed: 98 },
];

/**
 * The difficulty curve (SYS-07, difficultyCurve rule).
 * - A hit is cut by a flat share of defence, then by the ratio 100 / (100 + defence × ratio), and never below `floor`
 *   of itself, so high defence no longer turns every hit into 1.
 * - Enemy contact and shot damage rises by `damageChapter` per chapter after the first.
 * - Stage difficulty (enemy health, spawn rate, and damage) climbs `chapterStep` per chapter and `stageStep` per stage.
 *   The pilots kept 0.45 and 0.2: flatter steps deepened the Ch3 valley instead of evening the curve.
 * - Boss stages' crowds are scaled by `bossStageMobs`: without saturated defence a tank no longer outlasts them.
 */
const difficulty = { flat: 0.35, flatOther: 0.2, ratio: 4, floor: 0.15, damageChapter: 0.07, chapterStep: 0.45, stageStep: 0.2, bossStageMobs: 0.85 };

export default deepFreeze({ baseStats, skills, metaUpgrades, metaPassives, runUpgrades, fieldBosses, roundBosses, difficulty });
