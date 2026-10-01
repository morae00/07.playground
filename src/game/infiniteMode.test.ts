import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INFINITE_BALANCE_TARGET,
  INFINITE_BOSS_KILL_PRESSURE,
  dailySeed,
  dailySeedKey,
  estimateBossExposureSeconds,
  infiniteDifficultyAt,
  infiniteKillScore,
  infiniteScoreWithSurvival,
  logarithmicBossKillBonus,
  weeklySeed,
  weeklySeedKey,
} from './infiniteMode.ts';

test('infinite difficulty starts at the stage 5 mid-boss baseline and rises monotonically', () => {
  const start = infiniteDifficultyAt(0);
  const tenMinutes = infiniteDifficultyAt(10 * 60);
  const thirtyMinutes = infiniteDifficultyAt(30 * 60);
  const sixtyMinutes = infiniteDifficultyAt(60 * 60);

  assert.equal(start.enemyHealthScale, 1);
  assert.equal(start.enemyDamageScale, 1);
  assert.equal(start.rangedCap, 2);
  assert.ok(tenMinutes.enemyDamageScale > start.enemyDamageScale);
  assert.ok(thirtyMinutes.enemyHealthScale > tenMinutes.enemyHealthScale);
  assert.ok(sixtyMinutes.spawnRateScale > thirtyMinutes.spawnRateScale);
  assert.ok(thirtyMinutes.rangedChance <= 0.075);
  assert.ok(thirtyMinutes.rangedCap <= 5);
});

test('30 minute direct boss exposure is lethal to the modeled all-stat build within a few seconds', () => {
  const exposure = estimateBossExposureSeconds(INFINITE_BALANCE_TARGET.minute * 60);
  assert.ok(exposure >= 1.5, `expected a readable danger window, received ${exposure.toFixed(2)}s`);
  assert.ok(exposure <= 4.5, `expected lethal exposure within a few seconds, received ${exposure.toFixed(2)}s`);
});

test('boss-kill pressure follows a diminishing logarithmic curve and respects its hard caps', () => {
  const { capKills, maxHealthBonus, maxDamageBonus } = INFINITE_BOSS_KILL_PRESSURE;
  const earlyHealthStep = logarithmicBossKillBonus(1, maxHealthBonus);
  const lateHealthStep = logarithmicBossKillBonus(capKills, maxHealthBonus)
    - logarithmicBossKillBonus(capKills - 1, maxHealthBonus);

  assert.ok(earlyHealthStep > lateHealthStep, 'later boss kills must add less pressure than early kills');
  assert.ok(Math.abs(logarithmicBossKillBonus(capKills, maxHealthBonus) - 10) < 1e-9);
  assert.ok(Math.abs(logarithmicBossKillBonus(capKills, maxDamageBonus) - 5) < 1e-9);
  assert.equal(
    logarithmicBossKillBonus(capKills * 10, maxHealthBonus),
    logarithmicBossKillBonus(capKills, maxHealthBonus),
  );

  const capped = infiniteDifficultyAt(0, capKills);
  assert.ok(Math.abs(capped.bossHealthScale - 11) < 1e-9, 'health pressure must cap at +1000%');
  assert.ok(Math.abs(capped.bossDamageScale - 6) < 1e-9, 'damage pressure must cap at +500%');
});

test('infinite score rewards survival, enemy weight, time pressure, and boss streaks', () => {
  assert.ok(infiniteKillScore('medium', 0) > infiniteKillScore('small', 0));
  assert.ok(infiniteKillScore('boss', 1_800, 4) > infiniteKillScore('boss', 0, 0));
  assert.equal(infiniteScoreWithSurvival(2_500, 30), 2_800);
  // CON-08: a field boss pays less than a round boss and has no streak.
  assert.equal(infiniteKillScore('fieldBoss', 0, 9), 900);
  assert.ok(infiniteKillScore('fieldBoss', 900) < infiniteKillScore('boss', 900));
});

test('the date seeds follow the local calendar day and the ISO week', () => {
  assert.equal(dailySeedKey(new Date(2026, 9, 1, 23, 59)), '2026-10-01');
  for (const [[year, month, day], week] of [
    [[2026, 9, 1], '2026-W40'], [[2026, 8, 28], '2026-W40'], [[2026, 9, 4], '2026-W40'], [[2026, 9, 5], '2026-W41'],
    [[2027, 0, 1], '2026-W53'], [[2021, 0, 3], '2020-W53'], [[2021, 0, 4], '2021-W01'], [[2024, 11, 30], '2025-W01'],
  ] as const) {
    assert.equal(weeklySeedKey(new Date(year, month, day)), week, `${year}-${month + 1}-${day}`);
  }
  const seeds = [dailySeed(new Date(2026, 9, 1)), dailySeed(new Date(2026, 9, 2)), weeklySeed(new Date(2026, 9, 1))];
  assert.equal(new Set(seeds).size, 3);
  assert.ok(seeds.every((seed) => Number.isInteger(seed) && seed > 0 && seed <= 0xffff_ffff));
});
