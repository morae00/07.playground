// Skill numbers (BUG-16): every number a draft card shows, and the engine plays by. Damage entries are coefficients
// of the player's attack; per-level entries are the total at that level. Data, not code: built apps read it from
// assets/content/tables.json, and tests and tools import this module (see ./index.ts).
import { deepFreeze } from '../deepFreeze.ts';

const SKILL_NUMBERS = {
  needleStorm: {
    damage: { base: 0.85, perLevel: 0.18, awakened: 0.4 },
    extraNeedleLevels: [3, 5],
    awakenedNeedles: 2,
    awakenedPierce: 1,
    shardDamage: 0.35,
    shardRange: 220,
  },
  fanKnives: {
    knives: { base: 3, perLevel: 1, awakened: 3 },
    cooldownPerLevel: 0.04,
  },
  chainSpark: {
    jumps: { base: 2, perLevel: 1, awakened: 2 },
    damage: { base: 0.95, perLevel: 0.14, awakened: 0.28 },
    stunSeconds: 0.45,
  },
  frostLine: {
    width: { base: 12, perLevel: 3, awakened: 8 },
    slow: { base: 0.25, perLevel: 0.07 },
    slowCap: 0.7,
    rootSeconds: 0.26,
  },
  orbitScythes: {
    blades: { base: 1, perLevel: 1 },
    awakenedOuterBlades: 3,
    radius: { base: 72, perLevel: 10 },
  },
  boneMortar: {
    radius: { base: 86, perLevel: 12, awakened: 34 },
    damage: { base: 1.35, perLevel: 0.22, awakened: 0.55 },
    aftershockDamage: 0.65,
  },
  railSpear: {
    width: { base: 18, perLevel: 3, awakened: 12 },
    damage: { base: 2.15, perLevel: 0.32, awakened: 0.8 },
    fissureDamage: 0.42,
  },
  mirrorClone: {
    damage: { base: 0.72, perLevel: 0.18 },
    basePierce: 1,
    cloneOffset: 42,
    awakenedShots: 2,
    awakenedPierce: 1,
    railCopyChance: 0.3,
    railCopyDamage: 0.35,
  },
  voidMine: {
    radius: { base: 92, perLevel: 11, awakened: 30 },
    duration: { base: 2.4, perLevel: 0.25, awakened: 0.9 },
    pull: { base: 74, perLevel: 14, awakened: 36 },
    collapseDamage: 1.6,
  },
  blackSun: {
    radius: { base: 116, perLevel: 14, awakened: 42 },
    duration: { base: 3.2, perLevel: 0.35, awakened: 1.2 },
    pull: { base: 74, perLevel: 16, awakened: 55 },
    collapseDamage: 2.4,
  },
  ironFrame: {
    defense: { base: 0, perLevel: 1.2, awakened: 3.5 },
    maxHp: { base: 0, perLevel: 18, awakened: 40 },
    shieldSeconds: 0.36,
  },
  magnetSigil: {
    magnet: { base: 0, perLevel: 36, awakened: 180 },
    coinGain: { base: 0, perLevel: 0.04, awakened: 0.15 },
    pulseSeconds: 4.8,
  },
  paperWard: {
    defense: { base: 0, perLevel: 1, awakened: 2.5 },
    pushRadius: 140,
  },
  recoveryThread: {
    regen: { base: 0, perLevel: 0.65, awakened: 2.4 },
    magnet: { base: 0, perLevel: 14, awakened: 60 },
    counterSeconds: 2.2,
  },
  coinFever: {
    coinGain: { base: 0, perLevel: 0.09 },
    attackSpeed: { base: 0, perLevel: 0.04 },
  },
  eclipseStep: {
    radius: { base: 128, perLevel: 16, awakened: 55 },
    invulnerability: { base: 0.28, perLevel: 0.05 },
    afterimageDamage: 0.72,
  },
  executionMark: {
    critChance: { base: 0, perLevel: 0.03, awakened: 0.1 },
    bossDamage: { base: 0, perLevel: 0.07, awakened: 0.2 },
    lowHpBossBonus: 0.45,
  },
};

export default deepFreeze(SKILL_NUMBERS);
