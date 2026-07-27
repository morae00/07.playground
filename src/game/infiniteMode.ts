export type InfiniteEnemyTier = 'small' | 'medium' | 'large' | 'boss';

export type InfiniteDifficulty = {
  minute: number;
  rank: number;
  enemyHealthScale: number;
  enemyDamageScale: number;
  enemySpeedScale: number;
  spawnRateScale: number;
  enemyCap: number;
  rangedChance: number;
  rangedCap: number;
  bossHealthScale: number;
  bossDamageScale: number;
};

export const INFINITE_BASELINE = Object.freeze({
  chapter: 1,
  stage: 5,
  mobDifficulty: 1.15,
  bossHp: 2_400 * 0.72,
  bossDamage: 20 * 0.62,
});

export const INFINITE_BALANCE_TARGET = Object.freeze({
  minute: 30,
  maxBuildHp: 650,
  maxBuildDefense: 41.5,
  directHitInvulnerability: 0.38,
});

export const INFINITE_BOSS_KILL_PRESSURE = Object.freeze({
  capKills: 500,
  curve: 0.004,
  maxHealthBonus: 10,
  maxDamageBonus: 5,
});

function finiteNonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function logarithmicBossKillBonus(bossKills: number, maxBonus: number) {
  const { capKills, curve } = INFINITE_BOSS_KILL_PRESSURE;
  const safeKills = Math.min(capKills, Math.floor(finiteNonNegative(bossKills)));
  const safeMaxBonus = finiteNonNegative(maxBonus);
  const logarithmicRange = Math.log1p(capKills * curve);
  if (safeKills === 0 || logarithmicRange <= 0) return 0;
  return safeMaxBonus * Math.log1p(safeKills * curve) / logarithmicRange;
}

export function infiniteDifficultyAt(elapsedSeconds: number, bossKills = 0): InfiniteDifficulty {
  const minute = finiteNonNegative(elapsedSeconds) / 60;
  const safeBossKills = Math.floor(finiteNonNegative(bossKills));
  const enemyHealthScale = 1 + minute * 0.15 + minute ** 2 * 0.008;
  const enemyDamageScale = 1 + minute * 0.18 + minute ** 2 * 0.0055;
  const bossKillHealthPressure = 1 + logarithmicBossKillBonus(
    safeBossKills,
    INFINITE_BOSS_KILL_PRESSURE.maxHealthBonus,
  );
  const bossKillDamagePressure = 1 + logarithmicBossKillBonus(
    safeBossKills,
    INFINITE_BOSS_KILL_PRESSURE.maxDamageBonus,
  );

  return {
    minute,
    rank: 1 + Math.floor(minute / 3),
    enemyHealthScale,
    enemyDamageScale,
    enemySpeedScale: Math.min(1.85, 1 + minute * 0.018),
    spawnRateScale: 1 + minute * 0.055 + minute ** 2 * 0.0015,
    enemyCap: Math.min(220, 114 + Math.floor(minute * 2.4)),
    rangedChance: Math.min(0.075, 0.045 + minute * 0.001),
    rangedCap: Math.min(5, 2 + Math.floor(minute / 12)),
    bossHealthScale: enemyHealthScale * bossKillHealthPressure,
    bossDamageScale: enemyDamageScale * bossKillDamagePressure,
  };
}

export function infiniteKillScore(tier: InfiniteEnemyTier, elapsedSeconds: number, bossKillsBefore = 0) {
  const base = tier === 'small' ? 30 : tier === 'medium' ? 75 : tier === 'large' ? 180 : 2_500;
  const timeMultiplier = 1 + Math.min(2.5, finiteNonNegative(elapsedSeconds) / 1_800);
  const streak = tier === 'boss' ? Math.floor(finiteNonNegative(bossKillsBefore)) * 225 : 0;
  return Math.floor(base * timeMultiplier + streak);
}

export function infiniteScoreWithSurvival(eventScore: number, elapsedSeconds: number) {
  return Math.max(0, Math.floor(finiteNonNegative(eventScore) + finiteNonNegative(elapsedSeconds) * 10));
}

export function estimateBossExposureSeconds(
  elapsedSeconds: number,
  hp = INFINITE_BALANCE_TARGET.maxBuildHp,
  defense = INFINITE_BALANCE_TARGET.maxBuildDefense,
) {
  const difficulty = infiniteDifficultyAt(elapsedSeconds);
  const rawHit = INFINITE_BASELINE.bossDamage * difficulty.bossDamageScale;
  const effectiveHit = Math.max(1, rawHit - finiteNonNegative(defense) * 0.72);
  const hitsToDefeat = Math.ceil(finiteNonNegative(hp) / effectiveHit);
  return hitsToDefeat * INFINITE_BALANCE_TARGET.directHitInvulnerability;
}
