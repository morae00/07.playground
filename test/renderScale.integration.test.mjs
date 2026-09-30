import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Render scale (TEC-04): the canvas backing store uses min(devicePixelRatio, renderScale, 2) pixels per CSS
// pixel; the default keeps the device resolution, so nothing changes until a player lowers it.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function engineAt(devicePixelRatio) {
  globalThis.window.devicePixelRatio = devicePixelRatio;
  const canvas = createHeadlessCanvas(1440, 900);
  const engine = new ProbedGameEngine(canvas, maxMeta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  return { engine, canvas };
}

test('the render scale caps the backing store and defaults to the device resolution', () => {
  const { engine, canvas } = engineAt(2);
  try {
    assert.deepEqual([canvas.width, canvas.height], [2880, 1800], 'default: full DPR 2');
    engine.setRenderScale(1.5);
    assert.deepEqual([canvas.width, canvas.height], [2160, 1350]);
    engine.setRenderScale(1);
    assert.deepEqual([canvas.width, canvas.height], [1440, 900]);
    engine.setRenderScale(4);
    assert.deepEqual([canvas.width, canvas.height], [2880, 1800], 'never above 2');
    engine.setRenderScale(Number.NaN);
    assert.deepEqual([canvas.width, canvas.height], [2880, 1800], 'invalid values fall back to the default');
  } finally {
    engine.dispose();
  }
  const low = engineAt(1);
  try {
    low.engine.setRenderScale(2);
    assert.deepEqual([low.canvas.width, low.canvas.height], [1440, 900], 'a DPR 1 screen stays at 1');
  } finally {
    low.engine.dispose();
    globalThis.window.devicePixelRatio = 1;
  }
});

test('benchmark probes add hostile shots and effects and count them without copying the world', () => {
  const { engine } = engineAt(1);
  try {
    engine.setRuleSet('remaster');
    engine.startRun(1, 1, 5);
    const { probe } = engine;
    probe.haltSpawns();
    probe.clear('enemies', 'hostileShots', 'effects');
    const { player } = probe.read();
    for (let index = 0; index < 12; index += 1) probe.spawnHostileShot({ x: player.x + 400, y: player.y + index * 10, vx: -10 });
    probe.burst(player.x, player.y, 30);
    probe.damageNumber(player.x, player.y, 42, true);
    const counts = probe.counts();
    assert.equal(counts.hostileShots, 12);
    assert.equal(counts.particles, 30);
    assert.equal(counts.damageNumbers, 1);
    assert.equal(counts.enemies, 0);
    assert.equal(probe.read().bossProjectiles[0].damage, 0, 'bench shots are harmless by default');
  } finally {
    engine.dispose();
  }
});
