import assert from 'node:assert/strict';
import test from 'node:test';
import { installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Animation and motion policy (FX-01): level of detail follows the enemies on screen, reduced motion keeps
// full detail and frame animation, vector bodies turn to face their heading instead of spinning, and characters
// hold their animation state across frames.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, SpriteAtlas, ATLAS_MANIFEST } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

/** A canvas that records rotations and blits in screen order. */
function recordingCanvas() {
  const rotations = [];
  const images = [];
  const target = {
    measureText: () => ({ width: 0 }),
    createPattern: () => null,
    rotate(angle) { rotations.push(angle); },
    drawImage(image, sx, sy) { images.push({ url: image.url, sx, sy }); },
  };
  const context = new Proxy(target, {
    get(object, property) { return property in object ? object[property] : () => {}; },
    set(object, property, value) { object[property] = value; return true; },
  });
  return {
    rotations,
    images,
    canvas: {
      width: 0, height: 0,
      getContext: () => context,
      getBoundingClientRect: () => ({ width: 1440, height: 900, left: 0, top: 0 }),
      addEventListener() {}, removeEventListener() {},
      setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => false,
    },
  };
}

function arena(chapter = 2, stage = 2) {
  const fixture = recordingCanvas();
  // Full motion, so spinning would show (the headless default reduces motion).
  const engine = new ProbedGameEngine(fixture.canvas, maxMeta(), { ...standardOptions(), reducedFlash: false }, { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet('remaster');
  engine.startRun(chapter, stage, 6060);
  const { probe } = engine;
  probe.haltSpawns();
  probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots', 'effects');
  probe.setSkills({});
  probe.setGodMode();
  return { engine, probe, ...fixture };
}

test('detail follows the enemies on screen, and reduced motion keeps full detail', () => {
  const { engine, probe } = arena();
  try {
    const { player } = probe.read();
    for (let index = 0; index < 180; index += 1) probe.spawnEnemy({ tier: 'small', x: player.x + 2400 + (index % 20) * 30, y: player.y + Math.floor(index / 20) * 30, speed: 0, damage: 0 });
    for (let index = 0; index < 3; index += 1) probe.spawnEnemy({ tier: 'small', x: player.x + 100 + index * 40, y: player.y, speed: 0, damage: 0 });
    probe.render(1);
    assert.equal(probe.renderStats().detail, 'full', '180 enemies off screen do not lower detail');
    engine.setSystemReducedMotion(true);
    probe.render(1);
    assert.equal(probe.renderStats().detail, 'full', 'reduced motion keeps full detail');
    engine.setSystemReducedMotion(false);
    for (let index = 0; index < 170; index += 1) probe.spawnEnemy({ tier: 'small', x: player.x - 600 + (index % 17) * 70, y: player.y - 300 + Math.floor(index / 17) * 60, speed: 0, damage: 0 });
    probe.render(1);
    assert.equal(probe.renderStats().detail, 'minimal', 'a crowd on screen lowers it');
  } finally {
    engine.dispose();
  }
});

test('vector bodies face where they walk and hold that heading when they stop, instead of spinning', () => {
  const { engine, probe, rotations } = arena();
  try {
    const { player } = probe.read();
    const id = probe.spawnEnemy({ tier: 'small', x: player.x + 200, y: player.y + 200, speed: 0, damage: 0, hp: 1e6 });
    const draw = () => {
      rotations.length = 0;
      probe.render(1);
      return [...rotations];
    };
    const standing = draw();
    probe.step(60);
    assert.deepEqual(draw(), standing, 'a still stalker does not turn over a second');
    probe.patchEnemy(id, { vx: 0, vy: -80 });
    const walking = draw();
    assert.ok(walking.some((angle) => Math.abs(angle + Math.PI / 2) < 1e-9), 'it faces up while walking up');
    probe.patchEnemy(id, { vx: 0, vy: 0 });
    probe.step(30);
    assert.ok(draw().some((angle) => Math.abs(angle + Math.PI / 2) < 1e-9), 'and keeps that heading after it stops');
  } finally {
    engine.dispose();
  }
});

test('a Ch1 shooter keeps its windup pose for a moment after the shot leaves', async () => {
  const atlas = new SpriteAtlas({ loadManifest: async () => ATLAS_MANIFEST, loadImage: async (url) => ({ url, width: 2048, height: 2048 }) });
  assert.equal(await atlas.load('common'), true);
  assert.equal(await atlas.load('chapter-01'), true);
  const { engine, probe, images } = arena(1, 2);
  try {
    engine.setSprites(atlas);
    const { player } = probe.read();
    const id = probe.spawnEnemy({ tier: 'small', attackStyle: 'ranged', x: player.x + 380, y: player.y, speed: 0, damage: 0, hp: 1e6 });
    probe.patchEnemy(id, { rangedCooldown: 0.05 });
    const windup = ATLAS_MANIFEST.packs['chapter-01'].frames['enemy/1/shooter/windup/0'];
    const shooterBlit = () => images.find((draw) => draw.url === 'assets/packs/chapter-01/atlas-0.png');
    let fired = false;
    for (let step = 0; step < 120 && !fired; step += 1) {
      const aiming = probe.read().enemies.find((enemy) => enemy.id === id).rangedTelegraph > 0;
      probe.step(1);
      images.length = 0;
      probe.render(1);
      fired = aiming && probe.read().enemies.find((enemy) => enemy.id === id).rangedTelegraph <= 0;
    }
    assert.ok(fired, 'the shooter aimed and fired');
    assert.equal(shooterBlit().sx, windup[1], 'right after the shot it still shows the windup pose');
    probe.step(20);
    images.length = 0;
    probe.render(1);
    assert.notEqual(shooterBlit().sx, windup[1], 'then it lowers its bow');
  } finally {
    engine.dispose();
  }
});

test('a Ch1 kill tips its body over, leaves an ink stain, and the stain dries away (FX-03)', async () => {
  const atlas = new SpriteAtlas({ loadManifest: async () => ATLAS_MANIFEST, loadImage: async (url) => ({ url, width: 2048, height: 2048 }) });
  await atlas.load('common');
  await atlas.load('chapter-01');
  const { engine, probe, images, rotations } = arena(1, 2);
  try {
    engine.setSprites(atlas);
    const { player } = probe.read();
    const id = probe.spawnEnemy({ tier: 'small', x: player.x + 160, y: player.y, speed: 0, damage: 0, hp: 5 });
    probe.render(1);
    probe.patchEnemy(id, { hp: 0 });
    probe.step(1);
    const [corpse] = probe.effects().corpses;
    assert.ok(corpse && corpse.fall === 1, 'the body falls away from the player on its left');
    images.length = 0;
    rotations.length = 0;
    probe.step(8);
    probe.render(1);
    const hit = ATLAS_MANIFEST.packs['chapter-01'].frames['enemy/1/stalker/hit/0'];
    assert.ok(images.some((draw) => draw.sx === hit[1] && draw.sy === hit[2]), 'the hit pose is drawn while it falls');
    assert.ok(rotations.some((angle) => angle > 0.1), 'tipped over to the right');
    probe.step(60 * 2);
    assert.equal(probe.effects().corpses.length, 0, 'the stain has dried after 1.75 s');
  } finally {
    engine.dispose();
  }
});

test('a hit flashes a white cut-out over the sprite in three steps', async () => {
  const atlas = new SpriteAtlas({ loadManifest: async () => ATLAS_MANIFEST, loadImage: async (url) => ({ url, width: 2048, height: 2048 }) });
  await atlas.load('common');
  await atlas.load('chapter-01');
  const { engine, probe, images } = arena(1, 2);
  try {
    engine.setSprites(atlas);
    const { player } = probe.read();
    const id = probe.spawnEnemy({ tier: 'small', x: player.x + 160, y: player.y, speed: 0, damage: 0, hp: 1e6 });
    const cutouts = () => {
      images.length = 0;
      probe.render(1);
      return images.filter((draw) => draw.url === undefined && draw.sx === 0 && draw.sy === 0).length;
    };
    assert.equal(cutouts(), 0, 'no flash before a hit');
    probe.patchEnemy(id, { hitFlash: 0.08 });
    assert.equal(cutouts(), 1, 'the cut-out draws over the body');
    probe.patchEnemy(id, { hitFlash: 0 });
    assert.equal(cutouts(), 0);
  } finally {
    engine.dispose();
  }
});

test('the player hears where hits come from and when health runs low (FX-03)', () => {
  const { engine, probe } = arena(1, 2);
  const events = [];
  engine.subscribe((event) => events.push(event));
  try {
    probe.setGodMode(false);
    const { player } = probe.read();
    const maxHp = player.stats.maxHp;
    probe.setPlayer({ hp: maxHp, stats: { defense: 0 } });
    probe.spawnEnemy({ tier: 'large', x: player.x - 20, y: player.y, speed: 0, damage: maxHp * 0.8, hp: 1e6 });
    for (let step = 0; step < 30 && !events.some((event) => event.type === 'player/hurt'); step += 1) probe.step(1);
    const hurt = events.find((event) => event.type === 'player/hurt');
    assert.ok(hurt && hurt.fromX < hurt.x, 'the hit came from the enemy on the left');
    probe.step(1);
    assert.deepEqual(events.filter((event) => event.type === 'player/lowHealth').map((event) => event.low), [true]);
    probe.clear('enemies');
    probe.setPlayer({ hp: maxHp });
    probe.step(1);
    assert.deepEqual(events.filter((event) => event.type === 'player/lowHealth').map((event) => event.low), [true, false]);
  } finally {
    engine.dispose();
  }
});
