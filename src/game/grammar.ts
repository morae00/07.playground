// Core game grammar (remaster plan G1–G17). These numbers define how the game plays and are pinned by
// grammarContracts.test.ts and test/grammarContracts.integration.test.mjs. Changing one requires a matching
// change to the preserved-grammar list in artifacts/remaster/ and a rules version bump (src/game/rules.ts).

export const HIT_RADIUS = Object.freeze({
  /** Player body radius used for enemy contact (enemy.radius + this). */
  playerContact: 15,
  /** Player radius used for enemy and boss projectile hits (projectile.radius + this). */
  playerVsHostileShot: 13,
  /** Extra reach for collecting pickups (pickup.radius + this). */
  pickupReach: 18,
  /** Player collision radius against obstacles. */
  playerVsObstacle: 16,
});

export const ENEMY_RADIUS = Object.freeze({
  small: 12,
  medium: 19,
  large: 28,
  fieldBoss: 38,
  boss: 54,
});

/** Cumulative spawn roll thresholds for small / medium / large (58 / 30 / 12 %). */
export const TIER_ROLL = Object.freeze({
  small: 0.58,
  medium: 0.88,
});

export const RARITY_WEIGHTS = Object.freeze({
  common: 52,
  rare: 25,
  epic: 14,
  legendary: 7,
  mythic: 2,
});

export const DRAFT_SIZE = Object.freeze({
  level: 3,
  boss: 4,
});

export const MAX_SKILL_LEVEL = 5;

export const STAGE_STRUCTURE = Object.freeze({
  chapters: 5,
  stagesPerChapter: 10,
  midBossStage: 5,
  finalBossStage: 10,
});

/** Normal-stage progress marks that call a field boss, and the Chapter 3+ legacy boss mark. */
export const FIELD_BOSS_MARKS = Object.freeze([0.36, 0.72] as const);
export const LEGACY_BOSS_MARK = 0.55;
export const LEGACY_BOSS_MIN_CHAPTER = 3;

export const RANGED_ENEMY = Object.freeze({
  telegraphSeconds: 0.44,
  maxConcurrent: 3,
});
