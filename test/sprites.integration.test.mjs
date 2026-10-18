import assert from 'node:assert/strict';
import test from 'node:test';
import { installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Character sprites (TEC-03): with a loaded atlas the hero and chapter enemies draw from it, anchored on the
// hit circle's centre; without a pack (or for bosses) the vector renderer still draws them.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, SpriteAtlas, ATLAS_MANIFEST, BOMBERS } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

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

test('Ch1 enemies, round bosses, and the field boss draw from the chapter pack; a chapter without its pack keeps vectors', async () => {
  const atlas = await loadedAtlas();
  const ch1 = arena(1, 2, atlas);
  try {
    const { player } = ch1.engine.probe.read();
    ch1.engine.probe.spawnEnemy({ tier: 'small', x: player.x + 150, y: player.y, speed: 0, damage: 0 });
    ch1.engine.probe.spawnEnemy({ tier: 'large', x: player.x - 180, y: player.y, speed: 0, damage: 0 });
    ch1.engine.probe.spawnEnemy({ tier: 'medium', x: player.x, y: player.y + 160, speed: 0, damage: 0, attackStyle: 'ranged' });
    ch1.engine.probe.render(1);
    // Pack pages hold more than enemies (ART-05 modules); count the blits whose source is an enemy frame.
    const pack = ATLAS_MANIFEST.packs['chapter-01'];
    const enemyFrames = Object.entries(pack.frames).filter(([key]) => key.startsWith('enemy/1/')).map(([, frame]) => `${pack.pages[frame[0]]}:${frame[1]},${frame[2]}`);
    const enemyBlits = ch1.images.filter((draw) => enemyFrames.includes(`${draw.image.url}:${draw.sx},${draw.sy}`));
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
    const butcherPage = ATLAS_MANIFEST.packs['chapter-01'].pages[butcher[0]];
    assert.ok(boss.images.some((draw) => draw.image.url === butcherPage && draw.sx === butcher[1] && draw.sy === butcher[2]), 'the Ink Butcher draws its phase 1 art');
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
    // ART-04 (90388ba): the field bosses have kit art too; Ch1's is the crack officer.
    const commander = ATLAS_MANIFEST.packs['chapter-01'].frames['boss/1/commander/phase1/0'];
    assert.ok(boss.images.some((draw) => draw.image.url === ATLAS_MANIFEST.packs['chapter-01'].pages[commander[0]] && draw.sx === commander[1] && draw.sy === commander[2]), 'the crack officer draws its phase 1 art');
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

test('bombers draw from their own frames: standing, planted by the fuse\'s progress, and the blast for a moment (SYS-14, K7)', async () => {
  const atlas = await loadedAtlas();
  const { engine, images } = arena(1, 4, atlas);
  try {
    const pack = ATLAS_MANIFEST.packs['chapter-01'];
    const shows = (key) => {
      const frame = pack.frames[key];
      assert.ok(frame, `${key} is baked`);
      return images.some((draw) => draw.image.url === pack.pages[frame[0]] && draw.sx === frame[1] && draw.sy === frame[2]);
    };
    engine.probe.setGodMode();
    const { player } = engine.probe.read();
    engine.probe.spawnEnemy({ tier: 'small', bomber: 'burst', x: player.x + 200, y: player.y, speed: 0, damage: 0 });
    const fuse = engine.probe.spawnEnemy({ tier: 'small', bomber: 'fuse', x: player.x - 200, y: player.y, speed: 0, damage: 0 });
    engine.probe.render(1);
    assert.ok(shows('enemy/1/bomber-burst/idle/0'), 'the burst bomber stands in its own drawing');
    assert.ok(shows('enemy/1/bomber-fuse/idle/0'), 'so does the fuse bomber');
    const { elapsed } = engine.probe.read();
    engine.probe.patchEnemy(fuse, { fuseAt: elapsed - BOMBERS.fuse.seconds * 0.6 });
    images.length = 0;
    engine.probe.render(1);
    assert.ok(shows('enemy/1/bomber-fuse/plant/2'), 'planted 60% of the way, it shows the third plant frame');
    engine.probe.patchEnemy(fuse, { fuseAt: elapsed - BOMBERS.fuse.seconds - 0.01 });
    engine.probe.step(1);
    images.length = 0;
    engine.probe.render(1);
    assert.ok(shows('enemy/1/bomber-fuse/blast/0'), 'it goes off and its blast shows');
    engine.probe.step(12);
    images.length = 0;
    engine.probe.render(1);
    assert.ok(!shows('enemy/1/bomber-fuse/blast/0'), 'for a moment only');
  } finally {
    engine.dispose();
  }
});

test('a weapon the kit has drawn fires its own shot stamps from the skills pack (SYS-15, K9)', async () => {
  const atlas = await loadedAtlas();
  assert.equal(await atlas.load('skills'), true);
  const { engine, images } = arena(1, 2, atlas);
  try {
    const { player } = engine.probe.read();
    engine.probe.spawnEnemy({ tier: 'large', x: player.x + 260, y: player.y, speed: 0, damage: 0, hp: 1e6 });
    engine.probe.setSkills({ inkDarts: { level: 1 } });
    for (let step = 0; step < 240 && !engine.probe.read().projectiles.some((shot) => shot.skillId === 'inkDarts'); step += 1) engine.probe.step(1);
    engine.probe.step(4);
    images.length = 0;
    engine.probe.render(1);
    const pack = ATLAS_MANIFEST.packs.skills;
    const own = new Set(Object.entries(pack.frames).filter(([key]) => key.startsWith('skill/inkDarts/')).map(([, frame]) => `${pack.pages[frame[0]]}:${frame[1]},${frame[2]}`));
    assert.ok(own.size > 0, 'the ink darts have baked shots');
    assert.ok(images.some((draw) => own.has(`${draw.image.url}:${draw.sx},${draw.sy}`)), 'an ink dart in flight draws its own stamp');
  } finally {
    engine.dispose();
  }
});

test('the chosen character draws from its own pack once it is loaded, and as Gyeol until then (CON-10, K8)', async () => {
  const atlas = await loadedAtlas();
  const fixture = recordingCanvas();
  const engine = new ProbedGameEngine(fixture.canvas, maxMeta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  try {
    engine.setCharacter({ id: 'dan', level: 0 });
    engine.startRun(1, 1, 4040);
    engine.probe.haltSpawns();
    engine.probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots', 'effects');
    engine.setSprites(atlas);
    engine.probe.render(1);
    assert.equal(fixture.images.filter((draw) => draw.image.url === 'assets/atlas/common-0.png').length, 1, 'Gyeol stands in while the pack is out');
    assert.equal(await atlas.load('hero-dan'), true);
    fixture.images.length = 0;
    engine.probe.render(1);
    const pack = ATLAS_MANIFEST.packs['hero-dan'];
    const idle = pack.frames['hero/dan/idle/0'];
    assert.ok(fixture.images.some((draw) => draw.image.url === pack.pages[idle[0]] && draw.sx === idle[1] && draw.sy === idle[2]), 'Dan draws his own idle frame');
    assert.equal(engine.probe.hud().character, 'dan', 'the HUD shows whose portrait');
  } finally {
    engine.dispose();
  }
});

test('a weapon without shots draws its look\'s art, awakened when the weapon itself is (SYS-15)', async () => {
  const atlas = await loadedAtlas();
  assert.equal(await atlas.load('skills'), true);
  const pack = ATLAS_MANIFEST.packs.skills;
  const blits = (images, prefix) => {
    const keys = new Set(Object.entries(pack.frames).filter(([key]) => key.startsWith(prefix)).map(([, frame]) => `${pack.pages[frame[0]]}:${frame[1]},${frame[2]}`));
    return images.some((draw) => keys.has(`${draw.image.url}:${draw.sx},${draw.sy}`));
  };
  for (const awakened of [false, true]) {
    const { engine, images } = arena(1, 2, atlas);
    try {
      const { player } = engine.probe.read();
      engine.probe.spawnEnemy({ tier: 'large', x: player.x + 60, y: player.y, speed: 0, damage: 0, hp: 1e6 });
      // The ink pulse is a nova that borrows the bone mortar's blast; the mortar itself is not held.
      engine.probe.setSkills({ inkPulse: { level: 5, awakened } });
      for (let step = 0; step < 240 && !engine.probe.effects().skillMarks.some((mark) => mark.skillId === 'inkPulse'); step += 1) engine.probe.step(1);
      images.length = 0;
      engine.probe.render(1);
      assert.equal(blits(images, 'skill/boneMortar/blast-awakened/'), awakened, `awakened blast art only when the pulse is awakened (${awakened})`);
      assert.equal(blits(images, 'skill/boneMortar/blast/'), !awakened, `plain blast art when it is not (${awakened})`);
    } finally {
      engine.dispose();
    }
  }
});

test('a body in fire shows it burns while it stands there and a moment after, and the drawing survives it', async () => {
  const atlas = await loadedAtlas();
  const { engine } = arena(1, 2, atlas);
  try {
    engine.probe.setGodMode();
    const { player } = engine.probe.read();
    const enemy = engine.probe.spawnEnemy({ tier: 'small', x: player.x + 30, y: player.y, speed: 0, damage: 0, hp: 1e6 });
    engine.probe.addHazard({ kind: 'fire', x: player.x, y: player.y, radius: 90, life: 5, maxLife: 5, damage: 4, slow: 1, triggered: false });
    engine.probe.step(6);
    assert.ok(engine.probe.read().player.burn > 0, 'the hero burns in the fire');
    assert.ok(engine.probe.read().enemies.find((body) => body.id === enemy).burn > 0, 'so does an enemy in it');
    engine.probe.render(1);
    engine.probe.clear('hazards');
    engine.probe.step(30);
    assert.equal(engine.probe.read().player.burn, 0, 'and stops a moment after the fire is gone');
    engine.probe.render(1);
  } finally {
    engine.dispose();
  }
});

test('fire draws the kit\'s burning floor from the hazards pack, the bodies in it burn with feet flames, and it leaves soot (K11)', async () => {
  const atlas = await loadedAtlas();
  assert.equal(await atlas.load('hazards'), true);
  const pack = ATLAS_MANIFEST.packs.hazards;
  const shows = (images, prefix) => {
    const keys = new Set(Object.entries(pack.frames).filter(([key]) => key.startsWith(prefix)).map(([, frame]) => `${pack.pages[frame[0]]}:${frame[1]},${frame[2]}`));
    return images.some((draw) => keys.has(`${draw.image.url}:${draw.sx},${draw.sy}`));
  };
  const { engine, images } = arena(1, 2, atlas);
  try {
    engine.probe.setGodMode();
    const { player } = engine.probe.read();
    engine.probe.spawnEnemy({ tier: 'small', x: player.x + 30, y: player.y, speed: 0, damage: 0, hp: 1e6 });
    engine.probe.addHazard({ kind: 'fire', x: player.x, y: player.y, radius: 90, life: 5, maxLife: 5, damage: 4, slow: 1, triggered: false });
    engine.probe.step(2);
    images.length = 0;
    engine.probe.render(1);
    assert.ok(shows(images, 'hazard/fire/cluster-l-a-ignite/') || shows(images, 'hazard/fire/cluster-l-b-ignite/'), 'it flares up first');
    engine.probe.step(30);
    images.length = 0;
    engine.probe.render(1);
    assert.ok(shows(images, 'hazard/fire/cluster-l-') && shows(images, 'hazard/fire/cluster-s-'), 'body clusters and the rim ring burn');
    assert.ok(shows(images, 'hazard/fire/char-') && shows(images, 'hazard/fire/ember-'), 'over char, with embers');
    assert.ok(shows(images, 'hazard/hero/back/') && shows(images, 'hazard/hero/front/'), 'the hero stands in flames');
    assert.ok(shows(images, 'hazard/mob/front-12/'), 'the enemy in it gets feet flames');
    // Burned out: the renderer saw it gutter, so its cold char stays on the floor for a moment.
    while (engine.probe.read().hazards.some((hazard) => hazard.kind === 'fire')) {
      engine.probe.step(6);
      engine.probe.render(1);
    }
    images.length = 0;
    engine.probe.render(1);
    assert.ok(shows(images, 'hazard/fire/char-cold-'), 'soot after the fire');
    assert.ok(!shows(images, 'hazard/fire/cluster-'), 'and no flames');
    engine.probe.step(120);
    images.length = 0;
    engine.probe.render(1);
    assert.ok(!shows(images, 'hazard/'), 'the soot is gone 1.5 s later and the bodies no longer burn');
  } finally {
    engine.dispose();
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
