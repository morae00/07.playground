import assert from 'node:assert/strict';
import test from 'node:test';
import { ATLAS_MANIFEST } from './atlasManifest.generated.ts';
import { ATLAS_MANIFEST_URL, SpriteAtlas, loopFrame, phaseFor, type AtlasManifest } from './spriteAtlas.ts';
import { BOSS_SLOTS, CHAPTER_PACKS, COMMON_PACK, FIELD_BOSS_KITS, HERO_SLOT, bossSlot, characterPack, characterSlot, enemyDrawScale, enemySlot, frameKey } from './slots.ts';

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
      // Skill stamps (FX-06) anchor where they sit in the world, which can be just off the drawing: a pop's anchor is
      // the head it floats over, a mark's the body it hangs above. So do hazard stamps (K11): smoke rises off its base;
      // and weapon stamps (K10): a lance's tassel and an ink box sit 26 or more behind the beam's start.
      const slack = key.startsWith('skill/') || key.startsWith('hazard/') || key.startsWith('afx/') ? 64 : 0;
      assert.ok(ax >= -slack && ax <= w + slack && ay >= -slack && ay <= h + 4 + slack, `${packName} ${key} anchor lies on the drawing`);
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
  for (const [chapter, pack] of Object.entries(CHAPTER_PACKS)) {
    assert.ok(manifest.packs[pack], `${pack} is baked`);
    for (const role of ['stalker', 'charger', 'shooter', 'warden']) assert.ok(manifest.animations[`enemy/${chapter}/${role}`], `Ch${chapter} ${role}`);
  }
  for (const [bossId, { slot, pack }] of Object.entries(BOSS_SLOTS)) {
    const states = manifest.animations[slot];
    // Round and mid bosses draw idle, windup, and attack in every phase, calm and enraged, and four death frames (K3-2).
    assert.equal(Object.keys(states).length, 19, `${bossId}: 3 phases x idle, windup, and attack x enraged, and death`);
    assert.ok(manifest.packs[pack].frames[frameKey(slot, 'phase3-windup-enraged', 0)], `${bossId} is in ${pack}`);
    assert.ok(manifest.packs[pack].frames[frameKey(slot, 'phase3-attack-enraged', 0)] && states.death.frames === 4, `${bossId} attacks and falls`);
  }
  // Field bosses (ART-04) roam their own chapter and the ones after it, so each chapter pack holds every earlier one.
  for (const [bossId, { chapter: home }] of Object.entries(FIELD_BOSS_KITS)) {
    for (const chapter of Object.keys(CHAPTER_PACKS).map(Number)) {
      const entry = bossSlot(bossId, chapter);
      if (chapter < home) {
        assert.equal(entry, undefined, `${bossId} does not appear before Ch${home}`);
        continue;
      }
      assert.ok(entry, `${bossId} has a slot in Ch${chapter}`);
      assert.deepEqual(Object.keys(manifest.animations[entry.slot]).sort(), ['death', 'phase1', 'phase1-attack', 'phase1-windup', 'phase2', 'phase2-attack', 'phase2-windup'], `${bossId} in Ch${chapter}`);
      assert.equal(manifest.animations[entry.slot].death.frames, 4);
      assert.ok(manifest.packs[entry.pack].frames[frameKey(entry.slot, 'death', 3)], `${bossId} is in ${entry.pack}`);
    }
  }
  assert.deepEqual(Object.keys(manifest.animations[HERO_SLOT]).sort(), ['hurt', 'idle', 'run', 'throw']);
  // CON-10 (K8): every other character has Gyeol's states and frame counts, in a pack of its own under packs/.
  for (const id of ['dan', 'noeul', 'seori', 'dok', 'hwi', 'ryeong', 'wol']) {
    const pack = characterPack(id)!;
    assert.deepEqual(manifest.animations[characterSlot(id)], manifest.animations[HERO_SLOT], `${id} plays Gyeol's states`);
    assert.ok(manifest.packs[pack].pages.every((page) => page.startsWith('assets/packs/')), `${pack} stays out of the initial download`);
    assert.equal(Object.keys(manifest.packs[pack].frames).length, 21, `${pack} holds its 21 frames`);
  }
  assert.equal(characterPack('gyeol'), undefined);
  assert.equal(characterSlot('gyeol'), HERO_SLOT);
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
  for (const chapter of Object.keys(CHAPTER_PACKS)) {
    const warden = heightOf(`enemy/${chapter}/warden/idle/0`);
    assert.ok(warden >= 68 && warden <= 90, `Ch${chapter} warden stands ${warden}`);
    const stalker = heightOf(`enemy/${chapter}/stalker/idle/0`);
    assert.ok(stalker <= 40, `Ch${chapter} stalker stands ${stalker}`);
  }
  // Round bosses: the kit draws the r54 body about 156 units across; smoke, horns, and flames reach higher. The Ch2-5
  // mid bosses stand 148-157 tall on the same circle but are built narrower or wider (API-bosses3: the glass bishop
  // is the thinnest pillar, the tide king the widest mass), so only their height range and a 150-unit body cap apply.
  for (const [bossId, { slot, pack }] of Object.entries(BOSS_SLOTS)) {
    const frame = manifest.packs[pack].frames[frameKey(slot, 'phase1', 0)];
    const [width, height] = [frame[3] / manifest.atlasScale, frame[6] / manifest.atlasScale];
    const [low, high] = bossId.includes('-mid-') && bossId !== 's1-mid-dash' ? [90, 175] : [140, 170];
    assert.ok(width >= low && width <= high && height >= 130 && height <= 200, `${slot} is ${width} wide and stands ${height}`);
  }
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

test('TEC-09: a key gives the same frame object until the resident packs change', async () => {
  const atlas = new SpriteAtlas({ loadManifest: async () => manifest, loadImage: async () => fakeImage(2048, 512) });
  await atlas.load(COMMON_PACK);
  const key = frameKey(HERO_SLOT, 'run', 3);
  const first = atlas.frame(key);
  assert.ok(first);
  assert.equal(atlas.frame(key), first, 'the renderer caches cut-outs by frame, so the frame must be the same object');
  assert.equal(atlas.frame('enemy/1/stalker/walk/0'), undefined);
  await atlas.load(CHAPTER_PACKS[1]);
  assert.ok(atlas.frame('enemy/1/stalker/walk/0'), 'a frame missing before its pack loaded is found after');
  assert.notEqual(atlas.frame(key), first, 'a pack change hands out fresh frames');
  atlas.release(CHAPTER_PACKS[1]);
  assert.equal(atlas.frame('enemy/1/stalker/walk/0'), undefined, 'and a release forgets the released frames');
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
