import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Terrain on enemies (SYS-06): on in the remaster rules since decision D-05, off in the classic ones. Fire, water, and
// traps act on enemies at half strength, and bosses are immune.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function arena(terrainOnEnemies) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet('remaster');
  engine.probe.patchRules({ terrainOnEnemies });
  engine.startRun(1, 2, 5151);
  const { probe } = engine;
  probe.haltSpawns();
  probe.setGodMode();
  probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots', 'effects');
  probe.setSkills({});
  return { engine, probe };
}

const zone = (kind, x, y, extra = {}) => ({ kind, x, y, radius: 90, life: 30, maxLife: 30, damage: 20, slow: 0.34, triggered: false, ...extra });
const enemyAt = (probe, id) => probe.read().enemies.find((enemy) => enemy.id === id);

test('SYS-06: the remaster rules put terrain on enemies, the classic ones keep it off', () => {
  for (const [rules, on] of [['classic', false], ['remaster', true]]) {
    const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
    engine.setRuleSet(rules);
    assert.equal(engine.ruleSet.terrainOnEnemies, on, rules);
    engine.dispose();
  }
});

test('SYS-06: fire burns an enemy at half strength and its kill counts; without the flag it does nothing', () => {
  for (const on of [true, false]) {
    const { engine, probe } = arena(on);
    try {
      const { player } = probe.read();
      const x = player.x + 400;
      probe.addHazard(zone('fire', x, player.y));
      const id = probe.spawnEnemy({ tier: 'small', x, y: player.y, speed: 0, damage: 0, hp: 100 });
      probe.step(60);
      const burnt = enemyAt(probe, id);
      if (!on) {
        assert.equal(burnt.hp, 100, 'no flag, no burn');
        continue;
      }
      assert.ok(Math.abs(burnt.hp - (100 - 20 * 0.5 * 1)) < 0.5, `one second at 20 per second, halved (${burnt.hp})`);
      const kills = probe.read().stageKills;
      probe.step(60 * 10);
      assert.equal(enemyAt(probe, id), undefined, 'the fire finishes it');
      assert.equal(probe.read().stageKills, kills + 1, 'a terrain kill is a kill');
    } finally {
      engine.dispose();
    }
  }
});

test('SYS-06: water and binding zones slow enemies by half their pull on the player', () => {
  const { engine, probe } = arena(true);
  try {
    const { player } = probe.read();
    probe.addHazard(zone('water', player.x + 400, player.y));
    probe.addHazard(zone('root', player.x - 400, player.y));
    const wet = probe.spawnEnemy({ tier: 'small', x: player.x + 400, y: player.y, speed: 0, damage: 0, hp: 1e6 });
    const bound = probe.spawnEnemy({ tier: 'small', x: player.x - 400, y: player.y, speed: 0, damage: 0, hp: 1e6 });
    probe.step(2);
    assert.ok(Math.abs(enemyAt(probe, wet).slowMultiplier - (1 - (1 - 0.34) * 0.5)) < 1e-9, 'water slows to 0.67');
    assert.ok(Math.abs(enemyAt(probe, bound).slowMultiplier - 0.5) < 1e-9, 'a binding zone slows to half instead of holding');
  } finally {
    engine.dispose();
  }
});

test('SYS-06: an enemy springs a trap, which then no longer waits for the player; bosses are immune', () => {
  const { engine, probe } = arena(true);
  try {
    const { player } = probe.read();
    const trap = probe.addHazard(zone('trap', player.x + 300, player.y, { radius: 40 }));
    const id = probe.spawnEnemy({ tier: 'small', x: player.x + 300, y: player.y, speed: 0, damage: 0, hp: 1e6 });
    probe.step(1);
    assert.equal(probe.read().hazards.find((hazard) => hazard.id === trap).triggered, true);
    assert.ok(enemyAt(probe, id).root > 0, 'the enemy is held for a moment');

    probe.addHazard(zone('fire', player.x - 500, player.y));
    const boss = probe.spawnBoss('mid', { x: player.x - 500, y: player.y, hp: 5000 });
    probe.patchEnemy(boss, { speed: 0 });
    probe.step(30);
    assert.equal(enemyAt(probe, boss).hp, 5000, 'bosses stand in their own fire');
  } finally {
    engine.dispose();
  }
});
