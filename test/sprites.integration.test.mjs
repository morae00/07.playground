import assert from 'node:assert/strict';
import test from 'node:test';
import { installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Character sprites (TEC-03): with a loaded atlas the hero and chapter enemies draw from it, anchored on the
// hit circle's centre; without a pack (or for bosses) the vector renderer still draws them.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, SpriteAtlas, ATLAS_MANIFEST } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function recordingCanvas() {
  const images = [];
  let transform = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const target = {
    measureText: () => ({ width: 0 }),
    createPattern: () => null,
    save() { stack.push([...transform]); },
    restore() { transform = stack.pop() ?? [1, 0, 0, 1, 0, 0]; },
    setTransform(a, b, c, d, e, f) { transform = [a, b, c, d, e, f]; },
    translate(x, y) { transform = [transform[0], transform[1], transform[2], transform[3], transform[4] + transform[0] * x + transform[2] * y, transform[5] + transform[1] * x + transform[3] * y]; },
    scale(sx, sy) { transform = [transform[0] * sx, transform[1] * sx, transform[2] * sy, transform[3] * sy, transform[4], transform[5]]; },
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) { images.push({ image, sx, sy, sw, sh, dx, dy, dw, dh, transform: [...transform] }); },
  };
  const context = new Proxy(target, {
    get(object, property) { return property in object ? object[property] : () => {}; },
    set(object, property, value) { object[property] = value; return true; },
  });
  return {
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

async function loadedAtlas() {
  const atlas = new SpriteAtlas({ loadManifest: async () => ATLAS_MANIFEST, loadImage: async (url) => ({ url, width: 2048, height: 512 }) });
  assert.equal(await atlas.load('common'), true);
  assert.equal(await atlas.load('chapter-01'), true);
  return atlas;
}

function arena(chapter, stage, atlas) {
  const fixture = recordingCanvas();
  const engine = new ProbedGameEngine(fixture.canvas, maxMeta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.startRun(chapter, stage, 4040);
  engine.probe.haltSpawns();
  engine.probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots', 'effects');
  engine.probe.setSkills({});
  if (atlas) engine.setSprites(atlas);
  return { engine, ...fixture };
}

test('the hero draws from the atlas with its feet on the player position', async () => {
  const atlas = await loadedAtlas();
  const { engine, images } = arena(1, 1, atlas);
  try {
    const { player, camera } = engine.probe.read();
    engine.probe.render(1);
    const hero = images.filter((draw) => draw.image.url === 'assets/atlas/common-0.png');
    assert.equal(hero.length, 1, 'one hero blit');
    const [draw] = hero;
    const idle = ATLAS_MANIFEST.packs.common.frames['hero/idle/0'];
    assert.deepEqual([draw.sx, draw.sy, draw.sw, draw.sh], idle.slice(1, 5), 'standing still shows idle frame 0');
    assert.ok(Math.abs(draw.dx + idle[5] / 2) < 1e-9 && Math.abs(draw.dy + idle[6] / 2) < 1e-9, 'the anchor sits on the origin of the blit');
    assert.ok(Math.abs(draw.transform[4] - (player.x - camera.x)) < 1e-6, 'the blit origin is the player x');
    assert.ok(Math.abs(draw.transform[5] - (player.y - camera.y)) < 1e-6, 'the blit origin is the player y (the feet)');
  } finally {
    engine.dispose();
  }
});

test('Ch1 enemies and round bosses draw from the chapter pack; field bosses and other chapters keep vectors', async () => {
  const atlas = await loadedAtlas();
  const ch1 = arena(1, 2, atlas);
  try {
    const { player } = ch1.engine.probe.read();
    ch1.engine.probe.spawnEnemy({ tier: 'small', x: player.x + 150, y: player.y, speed: 0, damage: 0 });
    ch1.engine.probe.spawnEnemy({ tier: 'large', x: player.x - 180, y: player.y, speed: 0, damage: 0 });
    ch1.engine.probe.spawnEnemy({ tier: 'medium', x: player.x, y: player.y + 160, speed: 0, damage: 0, attackStyle: 'ranged' });
    ch1.engine.probe.render(1);
    const enemyBlits = ch1.images.filter((draw) => draw.image.url === 'assets/packs/chapter-01/atlas-0.png');
    assert.equal(enemyBlits.length, 3, 'stalker, warden, and shooter blits');
    const shooterFrame = ATLAS_MANIFEST.packs['chapter-01'].frames['enemy/1/shooter/idle/0'];
    assert.ok(enemyBlits.some((draw) => draw.sw === shooterFrame[3] && Math.abs(draw.dw - shooterFrame[3] / 2 * 1.26) < 1e-9), 'the medium shooter is drawn at x1.26');
  } finally {
    ch1.engine.dispose();
  }

  const boss = arena(1, 5, atlas);
  try {
    boss.engine.probe.spawnBoss('mid');
    boss.engine.probe.render(1);
    const butcher = ATLAS_MANIFEST.packs['chapter-01'].frames['boss/1/butcher/phase1/0'];
    assert.ok(boss.images.some((draw) => draw.image.url === 'assets/packs/chapter-01/atlas-0.png' && draw.sx === butcher[1] && draw.sy === butcher[2]), 'the Ink Butcher draws its phase 1 art');
    const id = boss.engine.probe.read().enemies.find((enemy) => enemy.isBoss).id;
    boss.engine.probe.patchEnemy(id, { bossPhase: 3, patternPhase: 'warn' });
    boss.images.length = 0;
    boss.engine.probe.render(1);
    const windup = ATLAS_MANIFEST.packs['chapter-01'].frames['boss/1/butcher/phase3-windup/0'];
    assert.ok(boss.images.some((draw) => draw.sx === windup[1] && draw.sy === windup[2]), 'phase 3 winding up uses its own drawing');
    boss.engine.probe.clear('enemies');
    boss.engine.probe.spawnBoss('field');
    boss.images.length = 0;
    boss.engine.probe.render(1);
    assert.equal(boss.images.filter((draw) => draw.image.url?.includes('chapter-01')).length, 0, 'the field boss has no kit art yet');
  } finally {
    boss.engine.dispose();
  }

  const ch2 = arena(2, 2, atlas);
  try {
    const { player } = ch2.engine.probe.read();
    ch2.engine.probe.spawnEnemy({ tier: 'small', x: player.x + 150, y: player.y });
    ch2.engine.probe.render(1);
    assert.equal(ch2.images.filter((draw) => draw.image.url?.includes('packs')).length, 0, 'Ch2 has no pack, so vectors draw');
    assert.equal(ch2.images.filter((draw) => draw.image.url === 'assets/atlas/common-0.png').length, 1, 'the hero still uses the common pack');
  } finally {
    ch2.engine.dispose();
  }
});

test('without an atlas nothing is blitted (vector fallback)', () => {
  const { engine, images } = arena(1, 2, null);
  try {
    const { player } = engine.probe.read();
    engine.probe.spawnEnemy({ tier: 'small', x: player.x + 150, y: player.y });
    engine.probe.render(1);
    assert.equal(images.length, 0);
  } finally {
    engine.dispose();
  }
});

test('the hero faces its target and plays hurt and throw poses from game events', async () => {
  const atlas = await loadedAtlas();
  const { engine, images } = arena(1, 1, atlas);
  try {
    const { player } = engine.probe.read();
    engine.probe.setSkills({ needleStorm: { level: 1 } });
    engine.probe.spawnEnemy({ tier: 'small', x: player.x - 200, y: player.y, speed: 0, damage: 0, hp: 1e6 });
    engine.probe.step(2);
    images.length = 0;
    engine.probe.render(1);
    const draw = images.find((item) => item.image.url === 'assets/atlas/common-0.png');
    assert.ok(draw.transform[0] < 0, 'mirrored to face the target on the left');
    const throwFrames = [0, 1, 2, 3].map((index) => ATLAS_MANIFEST.packs.common.frames[`hero/throw/${index}`][1]);
    assert.ok(throwFrames.includes(draw.sx), 'a needle cast shows the throw pose');
  } finally {
    engine.dispose();
  }
});
