import assert from 'node:assert/strict';
import test from 'node:test';
import { ATLAS_MANIFEST } from './atlasManifest.generated.ts';
import { ATLAS_MANIFEST_URL, SpriteAtlas, loopFrame, phaseFor, type AtlasManifest } from './spriteAtlas.ts';
import { CHAPTER_PACKS, COMMON_PACK, HERO_SLOT, enemyDrawScale, enemySlot, frameKey } from './slots.ts';

const manifest = ATLAS_MANIFEST as AtlasManifest;
const fakeImage = (width: number, height: number) => ({ width, height }) as unknown as CanvasImageSource & { width: number; height: number };

test('the baked manifest is complete: every animation frame exists and sits inside its page', async () => {
  const { readFileSync } = await import('node:fs');
  for (const [packName, pack] of Object.entries(manifest.packs)) {
    const sizes = pack.pages.map((page) => {
      const png = readFileSync(new URL(`../../../../public/${page}`, import.meta.url));
      return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
    });
    for (const [key, [page, x, y, w, h, ax, ay]] of Object.entries(pack.frames)) {
      assert.ok(page < sizes.length, `${packName} ${key} page`);
      assert.ok(x >= 0 && y >= 0 && x + w <= sizes[page].width && y + h <= sizes[page].height, `${packName} ${key} is inside its page`);
      assert.ok(ax >= 0 && ax <= w && ay >= 0 && ay <= h + 4, `${packName} ${key} anchor lies on the drawing`);
    }
  }
  const allFrames = Object.values(manifest.packs).flatMap((pack) => Object.keys(pack.frames));
  for (const [slot, states] of Object.entries(manifest.animations)) {
    for (const [state, spec] of Object.entries(states)) {
      for (let frame = 0; frame < spec.frames; frame += 1) {
        assert.ok(allFrames.includes(frameKey(slot, state, frame)), `${frameKey(slot, state, frame)} is baked`);
      }
    }
  }
  for (const role of ['stalker', 'charger', 'shooter', 'warden']) assert.ok(manifest.animations[`enemy/1/${role}`], `Ch1 ${role}`);
  for (const boss of ['butcher', 'gaoler']) {
    assert.equal(Object.keys(manifest.animations[`boss/1/${boss}`]).length, 12, `Ch1 ${boss}: 3 phases x windup x enraged`);
  }
  assert.deepEqual(Object.keys(manifest.animations[HERO_SLOT]).sort(), ['hurt', 'idle', 'run', 'throw']);
  assert.equal(manifest.atlasScale, 2, 'atlas pixels per world unit');
});

// Frame tops include the 1.5 px halo and visual-only protrusions above the body (antennae, hat brims), which
// the style bible §7.1 excludes from the measured height; the bounds below leave room for them.
test('baked sizes stay inside the style bible ranges (hero 56-64 tall, warden 68-76, plus protrusions)', () => {
  const heightOf = (key: string) => {
    for (const pack of Object.values(manifest.packs)) {
      const frame = pack.frames[key];
      if (frame) return frame[6] / manifest.atlasScale;
    }
    return Number.NaN;
  };
  const hero = heightOf('hero/idle/0');
  assert.ok(hero >= 56 && hero <= 70, `hero stands ${hero} units above its feet`);
  const warden = heightOf('enemy/1/warden/idle/0');
  assert.ok(warden >= 68 && warden <= 90, `warden stands ${warden}`);
  const stalker = heightOf('enemy/1/stalker/idle/0');
  assert.ok(stalker <= 40, `stalker stands ${stalker}`);
});

test('packs load once, hand out frames, and fall back cleanly when a page fails', async () => {
  const loads: string[] = [];
  const atlas = new SpriteAtlas({
    loadManifest: async () => manifest,
    loadImage: async (url) => {
      loads.push(url);
      return fakeImage(2048, 512);
    },
  });
  assert.equal(atlas.frame(frameKey(HERO_SLOT, 'idle', 0)), undefined, 'nothing before loading');
  assert.equal(await atlas.load(COMMON_PACK), true);
  assert.equal(await atlas.load(COMMON_PACK), true);
  assert.equal(loads.length, 1, 'pages load once');
  const frame = atlas.frame(frameKey(HERO_SLOT, 'run', 3));
  assert.ok(frame);
  assert.equal(frame.scale, 2);
  assert.equal(atlas.frame('enemy/1/stalker/walk/0'), undefined, 'chapter frames need their pack');

  const failing = new SpriteAtlas({ loadManifest: async () => manifest, loadImage: async () => { throw new Error('404'); } });
  assert.equal(await failing.load(CHAPTER_PACKS[1]), false);
  assert.equal(failing.status(CHAPTER_PACKS[1]), 'failed');
  assert.match(String(failing.failure(CHAPTER_PACKS[1])), /404/, 'the reason is kept for the error log');
  assert.equal(failing.frame('enemy/1/stalker/walk/0'), undefined);
  assert.equal(await failing.load('no-such-pack'), false);
});

test('a released pack frees its pages, drops a load still in flight, and loads again on request (ART-07)', async () => {
  const closed: string[] = [];
  const waiting: (() => void)[] = [];
  let hold = false;
  const atlas = new SpriteAtlas({
    loadManifest: async () => manifest,
    loadImage: async (url) => {
      if (hold) await new Promise<void>((resolve) => waiting.push(resolve));
      return Object.assign(fakeImage(2048, 512), { close: () => closed.push(url) });
    },
  });
  const pack = CHAPTER_PACKS[1];
  assert.equal(await atlas.load(pack), true);
  assert.ok(atlas.frame('enemy/1/stalker/walk/0'));
  atlas.release(pack);
  assert.equal(atlas.status(pack), 'idle');
  assert.equal(atlas.frame('enemy/1/stalker/walk/0'), undefined, 'a released pack hands out no frames');
  assert.equal(atlas.ground(pack), undefined);
  assert.equal(closed.length, manifest.packs[pack].pages.length + 1, 'every page and the ground are closed');

  hold = true;
  const inFlight = atlas.load(pack);
  await new Promise((resolve) => setTimeout(resolve, 0));
  atlas.release(pack);
  hold = false;
  for (const resolve of waiting) resolve();
  assert.equal(await inFlight, false, 'a load overtaken by a release is thrown away');
  assert.equal(atlas.status(pack), 'idle');
  assert.equal(await atlas.load(pack), true, 'the pack loads again when asked');
  assert.ok(atlas.frame('enemy/1/stalker/walk/0'));
});

test('loops pick frames by time with a stable per-id phase, and slots map enemies to roles', () => {
  const spec = { frames: 4, fps: 8 };
  assert.deepEqual([0, 0.125, 0.25, 0.5].map((t) => loopFrame(spec, t)), [0, 1, 2, 0]);
  assert.equal(loopFrame({ frames: 1, fps: 1 }, 99), 0);
  assert.equal(phaseFor(17), phaseFor(17));
  assert.notEqual(phaseFor(17), phaseFor(18));
  assert.equal(enemySlot(1, 'small', 'contact'), 'enemy/1/stalker');
  assert.equal(enemySlot(1, 'medium', 'ranged'), 'enemy/1/shooter');
  assert.equal(enemySlot(1, 'large', 'contact'), 'enemy/1/warden');
  assert.equal(enemyDrawScale('shooter', 'medium'), 1.26);
  assert.equal(enemyDrawScale('charger', 'medium'), 1);
});

test('the runtime JSON manifest holds the same content as the generated one', async () => {
  const { readFile } = await import('node:fs/promises');
  const json = JSON.parse(await readFile(new URL('../../../../public/assets/atlas/manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(json, JSON.parse(JSON.stringify(ATLAS_MANIFEST)));
  assert.equal(ATLAS_MANIFEST_URL, 'assets/atlas/manifest.json');
});
