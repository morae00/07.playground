export type InfiniteEnemyTier = 'small' | 'medium' | 'large' | 'boss' | 'fieldBoss';

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

/**
 * CON-08 (infiniteRotation rule): the infinite run's turn through the chapters. Once a chapter has lasted
 * `chapterSeconds`, the next round boss to fall turns the run to the next chapter. `fieldBossAt` seconds into each
 * chapter its field boss comes, with `fieldBossHp` of a round boss's health and `fieldBossDamage` of its damage at
 * that minute, before the boss-kill pressure (a campaign field boss is about that share of its stage's round boss).
 * It is not a round boss: the round bosses keep coming while it lives, and its kill scores without the boss streak.
 * The app loads the next chapter's art `preloadSeconds` before the turn is due.
 */
export const INFINITE_ROTATION = Object.freeze({
  chapters: 5,
  chapterSeconds: 300,
  fieldBossAt: 150,
  fieldBossHp: 0.45,
  fieldBossDamage: 0.87,
  preloadSeconds: 20,
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
  const base = tier === 'small' ? 30 : tier === 'medium' ? 75 : tier === 'large' ? 180 : tier === 'fieldBoss' ? 900 : 2_500;
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

/** FNV-1a over a text: a 32-bit seed, never 0. */
function textSeed(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 0x01000193) >>> 0;
  return hash || 1;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** CON-08: the local calendar day a date falls on, as 2026-10-01. */
export function dailySeedKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** CON-08: the ISO week (Monday first, week 1 holds 4 January) a local date falls in, as 2026-W40. */
export function weeklySeedKey(date: Date) {
  const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const firstWeek = new Date(thursday.getFullYear(), 0, 4);
  const week = 1 + Math.round(((thursday.getTime() - firstWeek.getTime()) / 86_400_000 - 3 + ((firstWeek.getDay() + 6) % 7)) / 7);
  return `${thursday.getFullYear()}-W${pad(week)}`;
}

/**
 * CON-08: the challenge seeds of the day and of the week, worked out from the date alone, so every player gets the
 * same run on the same day without a server. Their outcomes are pinned by test/rotation.integration.test.mjs (G14).
 */
export const dailySeed = (date: Date) => textSeed(`blackline:daily:${dailySeedKey(date)}`);
export const weeklySeed = (date: Date) => textSeed(`blackline:weekly:${weeklySeedKey(date)}`);
