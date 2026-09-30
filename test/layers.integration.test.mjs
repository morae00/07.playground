import assert from 'node:assert/strict';
import test from 'node:test';
import { installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Render layer contract (TEC-12): bodies are depth-sorted by their feet, threats and telegraphs draw above every
// body (V3), health bars are one batch above the bodies, effects sit above bodies, and the player x-ray pass is
// last, drawing whenever something covers the player (V4, BUG-12).

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, SpriteAtlas, ATLAS_MANIFEST, WORLD_LAYERS, XRAY_COVERAGE } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

/** A 2D context that logs draw calls with the current translation, plus a marker as each layer starts. */
function recordingCanvas() {
  const log = [];
  let transform = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const target = {
    globalAlpha: 1,
    measureText: () => ({ width: 0 }),
    createPattern: () => null,
    createLinearGradient: () => ({ addColorStop() {} }),
    save() { stack.push({ transform: [...transform], alpha: this.globalAlpha }); },
    restore() { const top = stack.pop(); transform = top?.transform ?? [1, 0, 0, 1, 0, 0]; this.globalAlpha = top?.alpha ?? 1; },
    setTransform(a, b, c, d, e, f) { transform = [a, b, c, d, e, f]; },
    translate(x, y) { transform = [transform[0], transform[1], transform[2], transform[3], transform[4] + transform[0] * x + transform[2] * y, transform[5] + transform[1] * x + transform[3] * y]; },
    scale(sx, sy) { transform = [transform[0] * sx, transform[1] * sx, transform[2] * sy, transform[3] * sy, transform[4], transform[5]]; },
    drawImage(image, sx, sy, sw, sh) { log.push({ call: 'drawImage', sx, sy, sw, sh, alpha: this.globalAlpha, at: [transform[4], transform[5]] }); },
    fillRect(x, y, w, h) { log.push({ call: 'fillRect', x, y, w, h }); },
    arc(x, y, r) { log.push({ call: 'arc', x, y, r, at: [transform[4], transform[5]] }); },
  };
  const context = new Proxy(target, {
    get(object, property) { return property in object ? object[property] : () => {}; },
    set(object, property, value) { object[property] = value; return true; },
  });
  return {
    log,
    canvas: {
      width: 0, height: 0,
      getContext: () => context,
      getBoundingClientRect: () => ({ width: 1440, height: 900, left: 0, top: 0 }),
      addEventListener() {}, removeEventListener() {},
      setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => false,
    },
  };
}

const heroRects = new Set(Object.entries(ATLAS_MANIFEST.packs.common.frames).map(([, [, x, y]]) => `${x},${y}`));
const isHero = (entry) => entry.call === 'drawImage' && heroRects.has(`${entry.sx},${entry.sy}`);

async function arena({ healthBars = 'elite' } = {}) {
  const fixture = recordingCanvas();
  const atlas = new SpriteAtlas({ loadManifest: async () => ATLAS_MANIFEST, loadImage: async (url) => ({ url, width: 2048, height: 512 }) });
  await atlas.load('common');
  await atlas.load('chapter-01');
  const engine = new ProbedGameEngine(fixture.canvas, maxMeta(), { ...standardOptions(), healthBars, damageNumbers: true }, { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet('remaster');
  engine.startRun(1, 1, 7070);
  engine.setSprites(atlas);
  const { probe } = engine;
  probe.haltSpawns();
  probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots', 'effects');
  probe.setSkills({});
  let layer = 'none';
  probe.onRenderLayer((next) => {
    layer = next;
    fixture.log.push({ call: 'layer', layer: next });
  });
  /** Renders one frame and returns its calls grouped by layer. */
  const frame = () => {
    fixture.log.length = 0;
    probe.render(1);
    const byLayer = {};
    let current = 'none';
    for (const entry of fixture.log) {
      if (entry.call === 'layer') current = entry.layer;
      else (byLayer[current] ??= []).push(entry);
    }
    return byLayer;
  };
  return { engine, probe, frame, player: probe.read().player, layerNow: () => layer };
}

test('the layer order is the TEC-12 contract', () => {
  assert.deepEqual([...WORLD_LAYERS], [
    'ground', 'hazards', 'groundMarks', 'pickups', 'targetGuide', 'obstacleShadows', 'bodies', 'overheads',
    'allyAttacks', 'hostileShots', 'telegraphs', 'effects', 'playerXray',
  ]);
  const at = (layer) => WORLD_LAYERS.indexOf(layer);
  assert.ok(at('hostileShots') > at('bodies') && at('telegraphs') > at('bodies'), 'threats above every body (V3)');
  assert.ok(at('groundMarks') < at('bodies'), 'foot shadows and rings under bodies');
  assert.ok(at('overheads') > at('bodies'), 'health bars in one batch above bodies');
  assert.equal(WORLD_LAYERS.at(-1), 'playerXray', 'the player x-ray is the last world layer');
});

test('bodies draw in depth order: nearer enemies over the hero, farther ones under it', async () => {
  const { engine, probe, frame, player } = await arena();
  try {
    probe.spawnEnemy({ tier: 'small', x: player.x - 30, y: player.y - 70, hp: 1e6, speed: 0, damage: 0 });
    probe.spawnEnemy({ tier: 'small', x: player.x + 30, y: player.y + 70, hp: 1e6, speed: 0, damage: 0 });
    probe.spawnEnemy({ tier: 'medium', x: player.x + 200, y: player.y + 10, hp: 1e6, speed: 0, damage: 0 });
    const layers = frame();
    const blits = layers.bodies.filter((entry) => entry.call === 'drawImage');
    assert.equal(blits.length, 4, 'three enemies and the hero');
    const feet = blits.map((entry) => entry.at[1]);
    assert.deepEqual(feet, [...feet].sort((a, b) => a - b), 'sorted by feet y');
    assert.equal(blits.findIndex(isHero), 1, 'the hero sits between the enemy behind and the ones in front');
  } finally {
    engine.dispose();
  }
});

test('the x-ray pass draws when a nearer body covers the hero, not when bodies stand behind it', async () => {
  const { engine, probe, frame, player } = await arena();
  try {
    const behind = probe.spawnEnemy({ tier: 'small', x: player.x, y: player.y - 24, hp: 1e6, speed: 0, damage: 0 });
    let layers = frame();
    assert.equal(probe.renderStats().xray, false, 'an enemy behind does not cover the hero');
    assert.equal((layers.playerXray ?? []).length, 0);
    probe.removeEnemies([behind]);
    probe.spawnEnemy({ tier: 'small', x: player.x + 6, y: player.y + 22, hp: 1e6, speed: 0, damage: 0 });
    layers = frame();
    const stats = probe.renderStats();
    assert.ok(stats.playerCoverage >= XRAY_COVERAGE, `a nearer enemy covers ${stats.playerCoverage}`);
    assert.equal(stats.xray, true);
    const xray = layers.playerXray.filter(isHero);
    assert.equal(xray.length, 1, 'the hero is redrawn on top');
    assert.ok(xray[0].alpha < 1, 'half-transparent over what covers it');
    assert.ok(layers.playerXray.some((entry) => entry.call === 'arc'), 'with its hit circle');
  } finally {
    engine.dispose();
  }
});

test('effects over the hero trigger the x-ray too, so particles never hide the player (BUG-12)', async () => {
  const { engine, probe, frame, player } = await arena();
  try {
    frame();
    assert.equal(probe.renderStats().xray, false);
    probe.burst(player.x, player.y - 20, 60);
    probe.damageNumber(player.x, player.y - 30, 99);
    const layers = frame();
    assert.equal(probe.renderStats().xray, true);
    assert.equal(layers.playerXray.filter(isHero).length, 1);
  } finally {
    engine.dispose();
  }
});

test('health bars are one batch above the bodies, and shots and ranged windups draw above them', async () => {
  const { engine, probe, frame, player } = await arena({ healthBars: 'all' });
  try {
    const shooter = probe.spawnEnemy({ tier: 'small', x: player.x + 160, y: player.y, hp: 50, speed: 0, damage: 0, attackStyle: 'ranged' });
    probe.spawnEnemy({ tier: 'large', x: player.x + 150, y: player.y + 30, hp: 50, speed: 0, damage: 0 });
    probe.patchEnemy(shooter, { hp: 25, rangedTelegraph: 0.3, patternX: player.x, patternY: player.y });
    probe.spawnHostileShot({ x: player.x + 150, y: player.y + 20, vx: -1, radius: 8 });
    const layers = frame();
    assert.equal(layers.bodies.filter((entry) => entry.call === 'fillRect').length, 0, 'no health bar inside the body pass');
    assert.ok(layers.overheads.filter((entry) => entry.call === 'fillRect').length >= 2, 'bars for both enemies');
    assert.ok((layers.hostileShots ?? []).length > 0, 'the shot draws in its own layer above the bodies');
    assert.ok(layers.telegraphs.some((entry) => entry.call === 'arc' && Math.abs(entry.x - (player.x + 160)) < 1), 'the windup ring is on the telegraph layer');
  } finally {
    engine.dispose();
  }
});
