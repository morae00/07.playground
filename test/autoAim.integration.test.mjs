import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Auto-aim reliability (SYS-01): lead moving targets, skip walled-off targets, prefer the logical view, and
// move on after three straight misses. Classic rules keep the 0.1.0 nearest-enemy aim for A/B runs.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function arena(rules) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), {
    onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {},
  });
  engine.setRuleSet(rules);
  engine.startRun(1, 3, 3333);
  engine.probe.haltSpawns();
  engine.probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots', 'effects');
  engine.probe.setGodMode();
  engine.probe.setSkills({ needleStorm: { level: 1 } });
  engine.probe.setPlayer({ nextXp: 1e9 });
  return { engine, player: engine.probe.read().player };
}

const hpLost = (engine, id, start) => start - (engine.probe.read().enemies.find((enemy) => enemy.id === id)?.hp ?? 0);

test('a lone strafing shooter is hit under remaster rules (classic rules stalemate)', () => {
  for (const [rules, check] of [['remaster', (lost) => lost > 500], ['classic', (lost) => lost === 0]]) {
    const { engine, player } = arena(rules);
    try {
      const shooter = engine.probe.spawnEnemy({ x: player.x + 320, y: player.y, hp: 5000, attackStyle: 'ranged' });
      engine.probe.step(20 * 60);
      const lost = hpLost(engine, shooter, 5000);
      assert.ok(check(lost), `${rules}: the strafer lost ${lost.toFixed(0)} hp in 20 s`);
    } finally {
      engine.dispose();
    }
  }
});

test('needles skip a nearer target behind a wall and hit the one in the open', () => {
  const { engine, player } = arena('remaster');
  try {
    engine.probe.addObstacle({ x: player.x - 260, y: player.y - 80, w: 40, h: 160, kind: 'solid' });
    const walled = engine.probe.spawnEnemy({ x: player.x - 300, y: player.y, hp: 5000, speed: 0, damage: 0 });
    const open = engine.probe.spawnEnemy({ x: player.x + 420, y: player.y, hp: 5000, speed: 0, damage: 0 });
    engine.probe.step(1);
    assert.equal(engine.probe.read().aim.targetId, open, 'the reticle marks the target the needles can reach');
    engine.probe.step(5 * 60);
    assert.equal(hpLost(engine, walled, 5000), 0);
    assert.ok(hpLost(engine, open, 5000) > 0);
  } finally {
    engine.dispose();
  }
});

test('enemies in the logical view come before nearer ones off view', () => {
  for (const [rules, expected] of [['remaster', 'inView'], ['classic', 'offView']]) {
    const { engine, player } = arena(rules);
    try {
      const ids = {
        offView: engine.probe.spawnEnemy({ x: player.x, y: player.y - 600, hp: 5000, speed: 0, damage: 0 }),
        inView: engine.probe.spawnEnemy({ x: player.x + 700, y: player.y, hp: 5000, speed: 0, damage: 0 }),
      };
      engine.probe.step(1);
      assert.equal(engine.probe.read().aim.targetId, ids[expected], rules);
    } finally {
      engine.dispose();
    }
  }
});

test('three straight misses push a target back for four seconds', () => {
  const { engine, player } = arena('remaster');
  try {
    const near = engine.probe.spawnEnemy({ x: player.x + 200, y: player.y, hp: 5000, speed: 0, damage: 0 });
    const far = engine.probe.spawnEnemy({ x: player.x + 500, y: player.y + 60, hp: 5000, speed: 0, damage: 0 });
    engine.probe.step(1);
    assert.equal(engine.probe.read().aim.targetId, near);
    const { elapsed } = engine.probe.read();
    engine.probe.patchEnemy(near, { aimMisses: 3, aimMissedAt: elapsed });
    engine.probe.step(1);
    assert.equal(engine.probe.read().aim.targetId, far, 'the streak moves the aim on');
    engine.probe.setClock({ elapsed: elapsed + 4.1 });
    engine.probe.step(1);
    assert.equal(engine.probe.read().aim.targetId, near, 'the streak is forgotten after four seconds');
  } finally {
    engine.dispose();
  }
});

test('needles lead a moving target by its velocity and the flight time', () => {
  const { engine, player } = arena('remaster');
  try {
    const target = engine.probe.spawnEnemy({ x: player.x + 380, y: player.y, hp: 5000, speed: 0, damage: 0 });
    engine.probe.patchEnemy(target, { vx: 0, vy: 150 });
    engine.probe.cast('needleStorm');
    const [needle] = engine.probe.read().projectiles.filter((shot) => shot.skillId === 'needleStorm');
    assert.ok(needle, 'a needle was fired');
    let aimY = player.y;
    for (let pass = 0; pass < 2; pass += 1) aimY = player.y + 150 * (Math.hypot(380, aimY - player.y) / 760);
    const expected = Math.atan2(aimY - player.y, 380);
    assert.ok(Math.abs(Math.atan2(needle.vy, needle.vx) - expected) < 1e-9, 'aims where the target will be');
    assert.ok(expected > 0.15, 'the lead is a real correction, not rounding');
  } finally {
    engine.dispose();
  }
});
