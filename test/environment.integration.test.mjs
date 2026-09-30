import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform } from '../scripts/lib/headless-engine.mjs';

// Chapter environments (ART-05, ART-07): under remaster rules a chapter with an obstacle catalogue builds its maps from
// the kit's modules, whose footprints are the hit boxes; the same random draws pick the module, so hazards and
// positions do not move.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, SpriteAtlas, ATLAS_MANIFEST, OBSTACLE_CATALOGUE } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const meta = () => ({
  gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 5, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});
const options = { healthBars: 'elite', volume: 0, effects: 0.9, damageNumbers: true, screenShake: false, reducedFlash: false, paceMode: 'standard' };
/** Every footprint a chapter's catalogue allows, by module name (`solid1`, `landmark0`, ...). */
const footprints = (chapter) => new Map(Object.entries(OBSTACLE_CATALOGUE[chapter]).flatMap(([kind, modules]) => modules.map(([w, h], index) => [`${kind}${index}`, `${w}x${h}`])));

function map(rules, chapter, stage) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), options, { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.startRun(chapter, stage, 2468);
  const world = engine.probe.read();
  engine.dispose();
  return world;
}

test('ART-05, ART-07: remaster maps of Ch1-3 use only their catalogue footprints, and landmark posts on St3', () => {
  for (const chapter of [1, 2, 3]) {
    const allowed = footprints(chapter);
    for (const stage of [1, 3]) {
      const { obstacles } = map('remaster', chapter, stage);
      assert.ok(obstacles.length > 0);
      for (const obstacle of obstacles) {
        assert.equal(allowed.get(obstacle.art ?? ''), `${obstacle.w}x${obstacle.h}`, `${chapter}-${stage}: ${obstacle.art} ${obstacle.w}x${obstacle.h}`);
      }
      if (stage === 3) assert.ok(obstacles.some((obstacle) => obstacle.art === 'landmark0'), `${chapter}-3 landmark posts`);
    }
  }
});

test('ART-05: classic maps and chapters without a catalogue keep their random blocks', () => {
  const classic = map('classic', 1, 1);
  assert.ok(classic.obstacles.length > 0 && classic.obstacles.every((obstacle) => obstacle.art === undefined));
  const other = map('remaster', 4, 1);
  assert.ok(other.obstacles.length > 0 && other.obstacles.every((obstacle) => obstacle.art === undefined));
});

test('ART-05: catalogue obstacles and the ground draw from the chapter pack', async () => {
  const atlas = new SpriteAtlas({ loadManifest: async () => ATLAS_MANIFEST, loadImage: async (url) => ({ url, width: 1024, height: 1024 }) });
  assert.equal(await atlas.load('chapter-01'), true);
  assert.equal(atlas.ground('chapter-01')?.size, 512);
  const images = [];
  const target = { measureText: () => ({ width: 0 }), createPattern: () => ({ setTransform() {} }), drawImage(image, sx, sy) { images.push({ url: image.url, sx, sy }); } };
  const context = new Proxy(target, { get: (object, key) => (key in object ? object[key] : () => {}), set: (object, key, value) => { object[key] = value; return true; } });
  const canvas = { width: 0, height: 0, getContext: () => context, getBoundingClientRect: () => ({ width: 1440, height: 900, left: 0, top: 0 }), addEventListener() {}, removeEventListener() {}, setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => false };
  const engine = new ProbedGameEngine(canvas, meta(), options, { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  try {
    engine.setRuleSet('remaster');
    engine.setSprites(atlas);
    engine.startRun(1, 1, 2468);
    const { player } = engine.probe.read();
    engine.probe.clear('obstacles');
    engine.probe.addObstacle({ x: player.x + 200, y: player.y, w: 200, h: 130, kind: 'solid', art: 'solid1' });
    images.length = 0;
    engine.probe.render(1);
    const [, sx, sy] = ATLAS_MANIFEST.packs['chapter-01'].frames['env/1/solid1/0'];
    assert.ok(images.some((draw) => draw.sx === sx && draw.sy === sy), 'the wall module is drawn from its frame');
    // The ground is stamped tile by tile, not filled with a pattern (TEC-04: pattern fills stalled Chromium).
    const tiles = images.filter((draw) => draw.url === 'assets/packs/chapter-01/ground-0.webp');
    assert.ok(tiles.length >= 4 && tiles.length <= 16, `${tiles.length} ground stamps cover the view`);
  } finally {
    engine.dispose();
  }
});
