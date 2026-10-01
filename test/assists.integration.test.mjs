import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Assists (SYS-07): the share of damage taken, enemy speed, and a slower game. An assisted run never counts on the
// infinite board, and the settlement says it was assisted, so the stage record can (G15, G16).
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const ASSISTS_OFF = { assistDamage: 1, assistEnemySpeed: 1, assistSlowGame: false };

function engineWith(assists, settlements = []) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), { ...standardOptions(), ...ASSISTS_OFF, ...assists }, {
    onSnapshot() {},
    onDraft() {},
    onRoundClear(result) { settlements.push(result); },
    onGameOver(result) { settlements.push(result); },
  });
  engine.setRuleSet('remaster');
  return engine;
}

function arena(assists) {
  const settlements = [];
  const engine = engineWith(assists, settlements);
  engine.startRun(1, 2, 31337);
  const { probe } = engine;
  probe.haltSpawns();
  probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots');
  probe.setSkills({});
  // No regeneration, so the health lost is exactly the damage taken.
  probe.setPlayer({ nextXp: 1e12, stats: { hpRegen: 0 } });
  return { engine, probe, settlements };
}

test('SYS-07: the damage assist scales every hit and burn the player takes', () => {
  const taken = {};
  for (const share of [1, 0.5]) {
    const { engine, probe } = arena({ assistDamage: share });
    try {
      const { player } = probe.read();
      const hp = player.hp;
      probe.spawnHostileShot({ x: player.x + 40, y: player.y, vx: -400, vy: 0, radius: 8, damage: 40, life: 2 });
      probe.step(20);
      taken[share] = hp - probe.read().player.hp;
    } finally {
      engine.dispose();
    }
  }
  assert.ok(taken[1] > 1, `a hit lands (${taken[1]})`);
  assert.ok(Math.abs(taken[0.5] - taken[1] / 2) < 1e-6, `half of it with the assist (${taken[0.5]} of ${taken[1]})`);
});

test('SYS-07: the enemy speed assist slows every enemy, and the slow game runs the simulation at 0.8', () => {
  const travelled = {};
  for (const speed of [1, 0.8]) {
    const { engine, probe } = arena({ assistEnemySpeed: speed });
    try {
      probe.setGodMode();
      const { player } = probe.read();
      const id = probe.spawnEnemy({ tier: 'small', x: player.x + 900, y: player.y, speed: 120, damage: 0, hp: 1e6 });
      probe.step(60);
      travelled[speed] = player.x + 900 - probe.read().enemies.find((enemy) => enemy.id === id).x;
    } finally {
      engine.dispose();
    }
  }
  assert.ok(Math.abs(travelled[0.8] / travelled[1] - 0.8) < 0.02, `enemies cover 80% of the ground (${travelled[0.8].toFixed(1)} of ${travelled[1].toFixed(1)})`);

  const elapsed = {};
  for (const slow of [false, true]) {
    const { engine, probe } = arena({ assistSlowGame: slow });
    try {
      for (let frame = 0; frame < 120; frame += 1) engine.advanceFrame(1 / 60, false);
      elapsed[slow] = probe.read().elapsed;
    } finally {
      engine.dispose();
    }
  }
  assert.ok(Math.abs(elapsed.true / elapsed.false - 0.8) < 0.03, `two real seconds play ${elapsed.true.toFixed(2)} s instead of ${elapsed.false.toFixed(2)}`);
});

test('SYS-07: an assisted infinite run never counts, even when the assist comes on mid-run', () => {
  const started = engineWith({ assistDamage: 0.7 });
  started.startInfiniteRun(99, true);
  assert.equal(started.probe.hud().scoreEligible, false);
  started.dispose();

  const options = { ...standardOptions(), ...ASSISTS_OFF };
  const later = engineWith({});
  later.startInfiniteRun(99, true);
  assert.equal(later.probe.hud().scoreEligible, true);
  later.setOptions({ ...options, assistSlowGame: true });
  later.setOptions(options);
  assert.equal(later.probe.hud().scoreEligible, false, 'switching it off again does not restore the run');
  later.dispose();
});

test('SYS-07: a campaign settlement says whether the run was assisted', () => {
  for (const [assists, expected] of [[{}, false], [{ assistEnemySpeed: 0.9 }, true]]) {
    const { engine, probe, settlements } = arena(assists);
    try {
      probe.setGodMode();
      probe.setClock({ timeLeft: 0.05 });
      probe.step(10);
      assert.equal(settlements.at(-1).assisted, expected);
    } finally {
      engine.dispose();
    }
  }
});
