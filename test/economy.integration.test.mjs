import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Economy (SYS-09): buying in the pause hub cannot heal a player in a tight spot, and pickups wait longer before
// they fly home on their own under the remaster rules.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function arena(rules = 'remaster') {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.startRun(1, 2, 4242);
  const { probe } = engine;
  probe.haltSpawns();
  probe.clear('enemies', 'hazards', 'pickups', 'projectiles', 'hostileShots');
  probe.setSkills({});
  return { engine, probe };
}

test('SYS-09: a max-health upgrade bought in the pause hub heals nothing while paused, then fills in over 3 s', () => {
  const { engine, probe } = arena();
  try {
    probe.setPlayer({ hp: 12, coins: 10_000 });
    engine.pause();
    const before = probe.read().player;
    assert.equal(engine.buyRunUpgrade('maxHp'), true);
    // The purchase rebuilds the stats; regeneration off afterwards, so only the upgrade's health is measured.
    probe.setPlayer({ stats: { hpRegen: 0 } });
    probe.step(60);
    const paused = probe.read().player;
    const gain = paused.stats.maxHp - before.stats.maxHp;
    assert.ok(gain > 0, 'the upgrade raised max health');
    assert.equal(paused.hp, 12, 'no health while paused, however long the pause');

    engine.resume();
    let last = paused.hp;
    let largest = 0;
    for (let tick = 0; tick < 60 * 3.5; tick += 1) {
      probe.step(1);
      const { hp } = probe.read().player;
      largest = Math.max(largest, hp - last);
      last = hp;
    }
    assert.ok(Math.abs(last - (12 + gain)) < 1e-6, `the whole gain arrives after resuming (${last})`);
    assert.ok(largest <= gain / (60 * 3) + 1e-9, 'a sixtieth of a second never brings more than its share of 3 s');
  } finally {
    engine.dispose();
  }
});

test('SYS-09: the same upgrade bought in play heals at once, as before', () => {
  const { engine, probe } = arena();
  try {
    probe.setPlayer({ hp: 12, coins: 10_000 });
    const before = probe.read().player.stats.maxHp;
    engine.buyRunUpgrade('maxHp');
    const after = probe.read().player;
    assert.equal(after.hp, 12 + (after.stats.maxHp - before));
  } finally {
    engine.dispose();
  }
});

test('SYS-09: remaster pickups wait 60 s before flying home and are banked at 75 s; classic ones keep 30 s and 45 s', () => {
  for (const [rules, soft, hard] of [['remaster', 60, 75], ['classic', 30, 45]]) {
    const { engine, probe } = arena(rules);
    try {
      probe.setPlayer({ stats: { magnet: 0 } });
      const { player } = probe.read();
      probe.spawnPickup({ kind: 'coin', x: player.x + 900, y: player.y, value: 5 });
      const coins = player.coins;
      probe.step(60 * (soft - 0.5));
      const waiting = probe.read().pickups[0];
      assert.ok(waiting && Math.abs(waiting.x - (player.x + 900)) < 1, `${rules}: still where it fell after ${soft - 0.5} s`);
      probe.step(60);
      const flying = probe.read().pickups[0];
      assert.ok(!flying || flying.x < player.x + 890, `${rules}: flying home by ${soft + 0.5} s`);
      probe.step(60 * (hard - soft));
      assert.equal(probe.read().pickups.length, 0, `${rules}: gone by ${hard} s`);
      assert.ok(probe.read().player.coins >= coins + 5, `${rules}: and banked, never lost`);
    } finally {
      engine.dispose();
    }
  }
});
