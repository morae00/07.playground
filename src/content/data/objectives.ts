// Stage objectives (CON-03): what each survival objective changes and its bonus goal. Data, not code: built apps
// read it from assets/content/tables.json, and tests and tools import this module (see ./index.ts).
// - mix: tier shares moved by up to 15 points (G9's stage exception); the other tiers split the rest 58:30:12.
// - rangedCap: the cap on ranged enemies alive at once, multiplied, up to maxRanged (G9 allows it on this stage only).
// - extraFieldBossMarks: stage progress that calls one more field boss, on top of 36% and 72% (G8).
// - Kill goals scale by chapter (killScale), since later chapters bring far more enemies.
// The stage card states every change (src/ui/menuStage.ts stageObjective).
import { deepFreeze } from '../deepFreeze.ts';

export type ObjectiveBonus =
  | { kind: 'kills'; tier: 'small' | 'large' | 'ranged'; count: number }
  | { kind: 'hold'; seconds: number; radius: number; moveEvery: number }
  | { kind: 'terrain'; seconds: number }
  | { kind: 'fieldBosses' }
  | { kind: 'salvage'; count: number; radius: number; seconds: number };

export type ObjectiveDef = {
  mix?: { small?: number; large?: number };
  spawnRate?: number;
  terrain?: number;
  rangedCap?: number;
  fieldBoss?: { hp: number; damage: number };
  extraFieldBossMarks?: number[];
  bonus: ObjectiveBonus;
};

const objectives = {
  swarm: { mix: { small: 0.15 }, spawnRate: 1.2, bonus: { kind: 'kills', tier: 'small', count: 280 } },
  holdLine: { bonus: { kind: 'hold', seconds: 30, radius: 150, moveEvery: 10 } },
  traps: { terrain: 2, bonus: { kind: 'terrain', seconds: 20 } },
  elites: { fieldBoss: { hp: 1.5, damage: 1.2 }, bonus: { kind: 'fieldBosses' } },
  salvage: { bonus: { kind: 'salvage', count: 5, radius: 70, seconds: 1.5 } },
  giants: { mix: { large: 0.15 }, bonus: { kind: 'kills', tier: 'large', count: 45 } },
  crossfire: { rangedCap: 3, bonus: { kind: 'kills', tier: 'ranged', count: 14 } },
  vanguard: { extraFieldBossMarks: [0.18], bonus: { kind: 'fieldBosses' } },
} satisfies Record<string, ObjectiveDef>;

export default deepFreeze({
  objectives: objectives as Record<keyof typeof objectives, ObjectiveDef>,
  /** Kill goals × this, by chapter. */
  killScale: [1, 1.6, 3.5, 4.5, 5.5],
  /** A bonus goal met on a clear pays this share of the stage's floor gold (base, chapter, and stage parts). */
  bonusGoldShare: 0.5,
  maxRanged: 6,
});
