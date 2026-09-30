import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Obstacles as cover (SYS-06): under remaster rules an ordinary enemy shot stops at the first obstacle, a shooter
// only aims with a clear line to the player, and boss shots are airborne: they fly over obstacles with a shadow.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function arena(rules, canvas = createHeadlessCanvas(1440, 900)) {
  const engine = new ProbedGameEngine(canvas, maxMeta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.startRun(1, 2, 7070);
  const { probe } = engine;
  probe.haltSpawns();
  probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots', 'effects');
  probe.setSkills({});
  const events = [];
  engine.subscribe((event) => events.push(event));
  return { engine, probe, events };
}

/** A wall standing between x-240 and x-180 of the player, and a shot fired at the player from x-400. */
function shotThroughWall(probe, kind) {
  const { player } = probe.read();
  probe.addObstacle({ x: player.x - 240, y: player.y - 70, w: 60, h: 140, kind: 'solid' });
  probe.spawnHostileShot({ x: player.x - 400, y: player.y, vx: 320, vy: 0, damage: 30, life: 4, kind });
}

test('SYS-06: an enemy shot stops at the wall in its way; classic rules let it through', () => {
  for (const [rules, covered] of [['remaster', true], ['classic', false]]) {
    const { engine, probe, events } = arena(rules);
    try {
      shotThroughWall(probe, 'enemy');
      probe.step(120);
      const hurt = events.filter((event) => event.type === 'player/hurt' && event.source === 'shot');
      assert.equal(hurt.length, covered ? 0 : 1, `${rules}: shot hits`);
      assert.equal(events.some((event) => event.type === 'shot/blocked'), covered, `${rules}: the wall takes the shot`);
    } finally {
      engine.dispose();
    }
  }
});

test('SYS-06: a boss shot is airborne and flies over the wall', () => {
  const { engine, probe, events } = arena('remaster');
  try {
    shotThroughWall(probe, 'dot');
    probe.step(120);
    assert.equal(events.filter((event) => event.type === 'player/hurt' && event.source === 'bossShot').length, 1);
    assert.equal(events.some((event) => event.type === 'shot/blocked'), false);
  } finally {
    engine.dispose();
  }
});

test('SYS-06: a shooter behind a wall does not aim; it circles until the line clears, then aims', () => {
  const { engine, probe } = arena('remaster');
  try {
    const { player } = probe.read();
    probe.addObstacle({ x: player.x - 300, y: player.y - 90, w: 80, h: 180, kind: 'solid' });
    const id = probe.spawnEnemy({ tier: 'small', attackStyle: 'ranged', x: player.x - 520, y: player.y, speed: 60, damage: 0, hp: 1e6 });
    probe.patchEnemy(id, { rangedCooldown: 0 });
    const shooter = () => probe.read().enemies.find((enemy) => enemy.id === id);
    probe.step(10);
    assert.equal(shooter().rangedTelegraph, 0, 'no aim through the wall');
    assert.ok(Math.abs(shooter().y - player.y) > 3, 'it steps sideways to find a line');
    let aimed = false;
    for (let step = 0; step < 900 && !aimed; step += 1) {
      probe.step(1);
      aimed = shooter().rangedTelegraph > 0;
    }
    assert.ok(aimed, 'once past the wall it aims');
  } finally {
    engine.dispose();
  }
});

test('SYS-06: boss shots cast a ground shadow; enemy shots and classic rules do not', () => {
  const ellipses = [];
  const target = { measureText: () => ({ width: 0 }), createPattern: () => null, ellipse(x, y, rx, ry) { ellipses.push({ x, y, rx, ry }); } };
  const context = new Proxy(target, { get: (object, key) => (key in object ? object[key] : () => {}), set: (object, key, value) => { object[key] = value; return true; } });
  const canvas = { width: 0, height: 0, getContext: () => context, getBoundingClientRect: () => ({ width: 1440, height: 900, left: 0, top: 0 }), addEventListener() {}, removeEventListener() {}, setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => false };
  for (const [rules, kind, shadowed] of [['remaster', 'dot', true], ['remaster', 'enemy', false], ['classic', 'dot', false]]) {
    const { engine, probe } = arena(rules, canvas);
    try {
      const { player } = probe.read();
      probe.spawnHostileShot({ x: player.x + 200, y: player.y - 100, radius: 9, life: 4, kind });
      ellipses.length = 0;
      probe.render(1);
      const shadow = ellipses.some((ellipse) => Math.abs(ellipse.x - (player.x + 200 + 18 * 0.4)) < 1e-6 && Math.abs(ellipse.y - (player.y - 100 + 18)) < 1e-6 && ellipse.rx === 9);
      assert.equal(shadow, shadowed, `${rules} ${kind}`);
    } finally {
      engine.dispose();
    }
  }
});
