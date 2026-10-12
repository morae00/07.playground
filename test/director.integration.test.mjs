import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Encounter director (SYS-03): normal stages follow the chapter's encounter grammar. The opening ramps the
// spawn rate from 0.4x to 1.0x over 45 s, breathers pay more, and boss-made terrain stays within the beat's
// hazard budget. The tier mix (G9), field boss marks (G8), and stage kinds (G7) are unchanged.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const meta = () => ({
  gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 5, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});

function stage(rules, chapter, stageNo, seed = 3030) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  // The director's own numbers, without the horde's multipliers (SYS-13; horde.integration.test covers those).
  if (rules === 'remaster') engine.probe.patchRules({ horde: false });
  engine.startRun(chapter, stageNo, seed);
  engine.probe.setSkills({});
  engine.probe.setGodMode();
  engine.probe.setPlayer({ nextXp: 1e12 });
  return engine;
}

test('the director runs on remaster normal stages only', () => {
  for (const [rules, chapter, stageNo, expected] of [
    ['remaster', 1, 1, true], ['remaster', 1, 5, false], ['remaster', 1, 10, false], ['classic', 1, 1, false], ['remaster', 3, 2, true],
  ]) {
    const engine = stage(rules, chapter, stageNo);
    try {
      assert.equal(engine.probe.director() !== null, expected, `${rules} ${chapter}-${stageNo}`);
    } finally {
      engine.dispose();
    }
  }
  const engine = stage('remaster', 1, 1);
  try {
    const director = engine.probe.director();
    assert.equal(director.beat, 'opening');
    assert.equal(director.formation, 'front', 'Ink Alley opens from the front');
    assert.equal(director.rateFactor, 0.4);
  } finally {
    engine.dispose();
  }
});

test('the opening ramp spawns about half as many enemies in the first ten seconds', () => {
  const counts = {};
  for (const rules of ['classic', 'remaster']) {
    const engine = stage(rules, 1, 1);
    try {
      engine.probe.step(600);
      counts[rules] = engine.probe.read().enemies.length;
    } finally {
      engine.dispose();
    }
  }
  // Without the ramp about 1.8 enemies spawn per second; the ramp integrates to about 8 over ten seconds.
  assert.ok(counts.classic >= 16 && counts.classic <= 20, `classic ${counts.classic}`);
  assert.ok(counts.remaster >= 6 && counts.remaster <= 11, `remaster ${counts.remaster}`);
});

test('the tier mix stays 58/30/12 under the director (G9)', () => {
  // Three seeds, about 2,800 enemies: one seed alone (about 930) swings by a few points.
  const counts = { small: 0, medium: 0, large: 0 };
  for (const seed of [777, 778, 779]) {
    const engine = stage('remaster', 2, 4, seed);
    try {
      const seen = new Set();
      for (let step = 0; step < 60 * 240; step += 1) {
        engine.probe.step(1);
        const { enemies } = engine.probe.read();
        for (const enemy of enemies) {
          if (enemy.isBoss || seen.has(enemy.id)) continue;
          seen.add(enemy.id);
          counts[enemy.tier] += 1;
        }
        if (enemies.length > 120) engine.probe.removeEnemies(enemies.filter((enemy) => !enemy.isBoss).map((enemy) => enemy.id));
      }
    } finally {
      engine.dispose();
    }
  }
  const total = counts.small + counts.medium + counts.large;
  assert.ok(total > 2400, `sampled ${total}`);
  assert.ok(Math.abs(counts.small / total - 0.58) < 0.03, `small ${counts.small / total}`);
  assert.ok(Math.abs(counts.medium / total - 0.3) < 0.03, `medium ${counts.medium / total}`);
  assert.ok(Math.abs(counts.large / total - 0.12) < 0.025, `large ${counts.large / total}`);
});

test('enemies spawned during a breather drop 1.5x XP and coin', () => {
  const engine = stage('remaster', 1, 2);
  try {
    engine.probe.haltSpawns();
    const { duration } = engine.probe.read();
    let breather = null;
    for (let t = 0; t < duration; t += 2) {
      engine.probe.setClock({ timeLeft: duration - t });
      if (engine.probe.director().beat === 'breather') {
        breather = t;
        break;
      }
    }
    assert.ok(breather !== null, 'the schedule has a breather');
    engine.probe.clear('enemies');
    const inBreather = engine.probe.spawnEnemy({ tier: 'small' });
    engine.probe.setClock({ timeLeft: duration - 1 });
    const inOpening = engine.probe.spawnEnemy({ tier: 'small' });
    const byId = new Map(engine.probe.read().enemies.map((enemy) => [enemy.id, enemy]));
    assert.equal(byId.get(inOpening).xp, 4);
    assert.equal(byId.get(inOpening).coin, 1);
    assert.equal(byId.get(inBreather).xp, 6);
    assert.equal(byId.get(inBreather).coin, 2);
  } finally {
    engine.dispose();
  }
});

test('boss-made terrain never exceeds the beat budget on normal stages', () => {
  const engine = stage('remaster', 3, 2, 4545);
  try {
    engine.probe.haltSpawns();
    engine.probe.clear('enemies', 'hazards');
    const { player } = engine.probe.read();
    // Field bosses are drawn from every chapter up to this one; draw until the trap layer comes up.
    let boss = null;
    for (let attempt = 0; attempt < 40 && !boss; attempt += 1) {
      engine.probe.clear('enemies');
      engine.probe.spawnBoss('field', { x: player.x + 220, y: player.y, hp: 1e9 });
      const candidate = engine.probe.read().enemies.find((enemy) => enemy.isBoss);
      if (candidate.boss.pattern === 'traps') boss = candidate;
    }
    assert.ok(boss, 'the trap layer comes up among the Ch3 field bosses');
    let placed = 0;
    for (let step = 0; step < 60 * 40; step += 1) {
      engine.probe.step(1);
      const world = engine.probe.read();
      const terrain = world.hazards.filter((hazard) => Number.isFinite(hazard.life) && ['fire', 'slow', 'root', 'null'].includes(hazard.kind));
      placed = Math.max(placed, terrain.length);
      const cap = engine.probe.director().terrainCap;
      assert.ok(terrain.length <= cap, `step ${step}: ${terrain.length} pieces over the cap ${cap}`);
    }
    assert.ok(placed > 0, 'the boss still lays terrain');
  } finally {
    engine.dispose();
  }
});
