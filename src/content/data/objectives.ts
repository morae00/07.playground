// Stage objectives (CON-03): what each survival objective changes and its bonus goal. Data, not code: built apps
// read it from assets/content/tables.json, and tests and tools import this module (see ./index.ts).
// - mix: tier shares moved by up to 15 points (G9's stage exception); the other tiers split the rest 58:30:12.
// - rangedCap: the cap on ranged enemies alive at once, multiplied, up to maxRanged (G9 allows it on this stage only).
// - extraFieldBossMarks: stage progress that calls one more field boss, on top of 36% and 72% (G8).
// - Kill goals scale by chapter (killScale), since later chapters bring far more enemies.
// - fieldBosses.within: only field bosses defeated within that many seconds of appearing count, and one that outlives
//   it fails the goal (decision D-04: the untimed goal was met on 93-94% of clears).
// - Under the bonusGoalRetune rule (remaster, user decision 2026-10-28) `retune` below sets the kill targets by chapter
//   and the window instead.
// The stage card states every change (src/ui/menuStage.ts stageObjective).
import { deepFreeze } from '../deepFreeze.ts';

export type ObjectiveBonus =
  | { kind: 'kills'; tier: 'small' | 'large' | 'ranged' | 'elite'; count: number; byChapter?: readonly number[] }
  | { kind: 'hold'; seconds: number; radius: number; moveEvery: number }
  | { kind: 'terrain'; seconds: number }
  | { kind: 'fieldBosses'; within?: number }
  | { kind: 'salvage'; count: number; radius: number; seconds: number };

export type ObjectiveDef = {
  mix?: { small?: number; large?: number };
  spawnRate?: number;
  terrain?: number;
  rangedCap?: number;
  fieldBoss?: { hp: number; damage: number };
  extraFieldBossMarks?: number[];
  bonus: ObjectiveBonus;
  /** SYS-10: with elites in play (eliteAffixes rule), the objective brings elites and asks for them instead. */
  eliteHunt?: { bonus: ObjectiveBonus };
};

const objectives = {
  swarm: { mix: { small: 0.15 }, spawnRate: 1.2, bonus: { kind: 'kills', tier: 'small', count: 280 } },
  holdLine: { bonus: { kind: 'hold', seconds: 30, radius: 150, moveEvery: 10 } },
  traps: { terrain: 2, bonus: { kind: 'terrain', seconds: 20 } },
  elites: { fieldBoss: { hp: 1.5, damage: 1.2 }, bonus: { kind: 'fieldBosses', within: 60 }, eliteHunt: { bonus: { kind: 'kills', tier: 'elite', count: 10 } } },
  salvage: { bonus: { kind: 'salvage', count: 5, radius: 70, seconds: 1.5 } },
  giants: { mix: { large: 0.15 }, bonus: { kind: 'kills', tier: 'large', count: 45 } },
  crossfire: { rangedCap: 3, bonus: { kind: 'kills', tier: 'ranged', count: 14 } },
  vanguard: { extraFieldBossMarks: [0.18], bonus: { kind: 'fieldBosses', within: 60 } },
} satisfies Record<string, ObjectiveDef>;

export default deepFreeze({
  objectives: objectives as Record<keyof typeof objectives, ObjectiveDef>,
  /** Kill goals × this, by chapter. */
  killScale: [1, 1.6, 3.5, 4.5, 5.5],
  /** A bonus goal met on a clear pays this share of the stage's floor gold (base, chapter, and stage parts). */
  bonusGoldShare: 0.5,
  maxRanged: 6,
  /**
   * Balance audit P2-3 (bonusGoalRetune rule, user decision 2026-10-28), measured on f57e3c0: the team personas'
   * clears of the 23 stages with these goals × 10 seeds, about half of which meet each goal.
   * - kills: a kill goal's target by chapter, in place of count × killScale, at about the median of the clears' kills
   *   of that kind (the elite hunt's counts elites). The rotation leaves swarm out of Ch5, giants out of Ch2, and
   *   crossfire out of Ch3; their numbers there come from the chapters beside them.
   * - fieldBossWithin: the field boss goals' window by chapter, in place of D-04's 60 s: twice it, as SYS-12 doubled
   *   the field bosses' health after D-04.
   */
  retune: {
    kills: {
      swarm: [700, 1650, 2200, 4250, 5300],
      giants: [48, 120, 300, 820, 1150],
      crossfire: [20, 22, 40, 72, 160],
      elites: [3, 4, 30, 30, 25],
    } as Partial<Record<keyof typeof objectives, readonly number[]>>,
    fieldBossWithin: [120, 120, 120, 120, 120],
  },
});
