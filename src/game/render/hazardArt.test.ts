import assert from 'node:assert/strict';
import test from 'node:test';
import { ATLAS_MANIFEST } from './assets/atlasManifest.generated.ts';
import type { AtlasManifest } from './assets/spriteAtlas.ts';
import { HAZARD_ART_KINDS } from './assets/slots.ts';
import { capCut, emberSlots, fireItems, fireState, hazardTokenColor, heroEmberSlots, layoutFire, screenCut, type FireItem, type HazardSpec } from './hazardArt.ts';
import { signalFamily } from './palette.ts';

const manifest = ATLAS_MANIFEST as unknown as AtlasManifest;
const data = manifest.hazards!;
const spec = data.spec as unknown as HazardSpec;
const parts = data.parts.fire;
const LODS = ['full', 'reduced', 'minimal'];
const round = (value: number, places: number) => Math.round(value * 10 ** places) / 10 ** places;
const item = (q: FireItem) => [q.part, round(q.x, 2), round(q.y, 2), q.flip ? 1 : 0, round(q.phase, 3), q.z, q.prio];

test('K11: the bake carries the kit SPEC, every part rule, and all 285 stamps of the nine groups, with no Korean text', () => {
  const pack = manifest.packs.hazards;
  assert.ok(pack, 'the hazard stamps have their own pack');
  assert.equal(pack.pages.length, 1, 'one atlas page');
  assert.ok(pack.pages.every((page) => page.startsWith('assets/packs/')), 'outside the initial download');
  assert.deepEqual(Object.keys(data.parts).sort(), ['fire', 'hero', 'mob', 'null', 'root', 'shock', 'slow', 'trap', 'water']);
  let stamps = 0;
  for (const [group, rules] of Object.entries(data.parts)) {
    const animation = manifest.animations[`hazard/${group}`];
    for (const [part, rule] of Object.entries(rules)) {
      assert.equal(animation?.[part]?.frames, rule.frames, `hazard/${group}/${part} is animated`);
      assert.equal(animation[part].fps > 0, rule.drive === 'loop', `${group}/${part} runs on the clock only when it loops`);
      for (let frame = 0; frame < rule.frames; frame += 1) assert.ok(pack.frames[`hazard/${group}/${part}/${frame}`], `hazard/${group}/${part}/${frame} is baked`);
      stamps += rule.frames;
    }
  }
  assert.equal(stamps, 285);
  assert.equal(Object.keys(pack.frames).length, 285);
  assert.doesNotMatch(JSON.stringify(data), /[가-힣]/);
});

test('K11: only fire is switched on, and fire SPEC colours are coral or neutral palette tokens (V2)', () => {
  assert.deepEqual([...HAZARD_ART_KINDS], ['fire']);
  const tokens = new Set<string>();
  JSON.stringify([spec.fire, spec.hero], (key, value) => {
    if (Array.isArray(value) && typeof value[0] === 'string' && typeof value[1] === 'number') tokens.add(value[0]);
    if (key === 'token' && typeof value === 'string') tokens.add(value);
    return value;
  });
  assert.deepEqual([...tokens].sort(), ['hostile', 'hostileGlow', 'ink']);
  for (const token of tokens) assert.ok([null, 'hostile'].includes(signalFamily(hazardTokenColor(token))), `${token} reads as ${signalFamily(hazardTokenColor(token))}`);
});

test('K11: the fire layout port gives the kit C9 vectors (fire 50:1, 74:7, 98:7, 150:23, and r150 reduced and minimal)', () => {
  const vectors = Object.entries(data.vectors.layout);
  assert.equal(vectors.length, 6);
  for (const [key, expected] of vectors) {
    const [, r, seed, lod = 'full'] = key.split(':');
    const items = fireItems(spec, layoutFire(spec, parts, Number(r), Number(seed)), LODS.indexOf(lod));
    assert.deepEqual(items.map(item), expected, key);
  }
  // The delivery's counts: r150 holds 16 bodies, 16 ring clusters, and 4 char (36); reduced 16 + 4 + 2, minimal 3 + 2.
  assert.deepEqual([data.vectors.layout['fire:50:1'].length, data.vectors.layout['fire:74:7'].length, data.vectors.layout['fire:98:7'].length], [11, 20, 31]);
  const big = layoutFire(spec, parts, 150, 23);
  const byClass = (items: FireItem[]) => [0, 1, 2].map((prio) => items.filter((q) => q.prio === prio).length);
  assert.deepEqual(byClass(fireItems(spec, big, 0)), [16, 4, 16]);
  assert.deepEqual(byClass(fireItems(spec, big, 1)), [16, 2, 4]);
  assert.deepEqual(byClass(fireItems(spec, big, 2)), [3, 2, 0]);
});

test('K11: the ember slots of the port give the kit vectors, the hero\'s included', () => {
  for (const [key, expected] of Object.entries(data.vectors.embers)) {
    const [kind, ...rest] = key.split(':');
    if (kind === 'hero') {
      assert.deepEqual(heroEmberSlots(spec, Number(rest[0])).map((q) => [q.part, round(q.x, 2), round(q.y, 2), q.frame]), expected, key);
      continue;
    }
    const [r, seed, t] = rest.map(Number);
    const bodies = fireItems(spec, layoutFire(spec, parts, r, seed), 0).filter((q) => q.prio === 0);
    assert.deepEqual(emberSlots(spec, bodies, r, seed, t, 0, null).map((q) => [q.part, round(q.x, 2), round(q.y, 2), q.frame]), expected, key);
  }
  assert.equal(Object.keys(data.vectors.embers).length, 5);
});

test('K11: LOD rules — each level is filtered from the full lists, capped per hazard, and loses its embers at minimal', () => {
  for (const r of [50, 60, 68, 74, 86, 98, 150]) {
    for (const seed of [1, 7, 23]) {
      const layout = layoutFire(spec, parts, r, seed);
      const [full, reduced, minimal] = [0, 1, 2].map((li) => fireItems(spec, layout, li));
      spec.fire.layout.caps.forEach((cap, li) => assert.ok([full, reduced, minimal][li].length <= cap, `r${r} under the ${LODS[li]} cap`));
      assert.ok(minimal.every((q) => q.prio !== 2), 'no rim ring at minimal');
      assert.ok(minimal.filter((q) => q.prio === 0).length <= 3 && minimal.filter((q) => q.prio === 1).length <= 2);
      assert.ok(reduced.filter((q) => q.prio === 2).every((q) => q.ring! % 2 === 0), 'reduced keeps the even ring clusters');
      for (const items of [full, reduced, minimal]) {
        for (const prio of [0, 1, 2]) {
          const ranks = items.filter((q) => q.prio === prio).sort((p, q) => p.gen - q.gen).map((q) => q.rank);
          assert.deepEqual(ranks, ranks.map((_, i) => i), 'each level ranks its own items in placement order');
        }
      }
      assert.ok(full.filter((q) => q.z === 'flame').every((q, i, all) => i === 0 || all[i - 1].y <= q.y), 'flames by y');
      const bodies = (items: FireItem[]) => items.filter((q) => q.prio === 0);
      assert.equal(emberSlots(spec, bodies(minimal), r, seed, 1, 2, null).length, 0);
      assert.equal(emberSlots(spec, bodies(reduced), r, seed, 1, 1, null).length, Math.ceil(Math.min(8, Math.max(3, Math.round(r / 12))) / 2));
    }
  }
});

test('K11: the per-hazard cap thins the rim ring evenly first, then char and bodies, keeping one body', () => {
  const make = (prio: number, gen: number): FireItem => ({ part: 'p', x: 0, y: gen, flip: false, phase: 0, z: prio === 1 ? 'ground' : 'flame', prio, gen });
  const items = [...[0, 1, 2].map((g) => make(0, g)), ...Array.from({ length: 10 }, (_, i) => make(2, 100 + i)), ...[200, 201].map((g) => make(1, g))];
  const cut = capCut(items, 10, 2, 1);
  assert.deepEqual(cut.filter((q) => q.prio === 2).map((q) => q.gen), [100, 102, 104, 106, 108], 'every other ring cluster');
  const hard = capCut(items, 1, 2, 1);
  assert.deepEqual(hard.map((q) => q.gen), [0], 'one body stays');
});

test('K11: the screen cap keeps every fire\'s body, then bodies and char nearest first, and shares the ring evenly', () => {
  // Twenty-one fire lanes at minimal: one body each even past the cap of 20.
  const lanes = screenCut(Array.from({ length: 21 }, () => [3, 2, 0] as const), 20);
  assert.ok(lanes.every((k) => k[0] >= 1));
  assert.equal(lanes.reduce((sum, k) => sum + k[0] + k[1], 0), 21);
  // Bodies and char first (34 of 60); the 26 left go to the rings in proportion, the remainder to the nearest fires.
  assert.deepEqual(screenCut([[10, 4, 16], [8, 4, 12], [5, 3, 8]], 60), [[10, 4, 12], [8, 4, 9], [5, 3, 5]]);
  assert.deepEqual(screenCut([[10, 4, 16], [8, 4, 12], [5, 3, 8]], 72), [[10, 4, 16], [8, 4, 12], [5, 3, 8]], 'nothing cut under the cap');
  // Bodies beyond the cap go to the nearest fires; the farthest keep their one.
  assert.deepEqual(screenCut([[6, 2, 4], [6, 2, 4]], 8), [[6, 0, 0], [2, 0, 0]]);
});

test('K11: fire states follow the kit windows; map fires always burn', () => {
  assert.equal(fireState(spec, { life: 12, maxLife: 12 }).state, 'ignite');
  assert.equal(fireState(spec, { life: 11.8, maxLife: 12 }).p.toFixed(2), '0.80');
  assert.equal(fireState(spec, { life: 6, maxLife: 12 }).state, 'burn');
  const gutter = fireState(spec, { life: 0.1, maxLife: 12 });
  assert.equal(gutter.state, 'gutter');
  assert.equal(gutter.age.toFixed(2), '0.40');
  assert.equal(fireState(spec, { life: Number.POSITIVE_INFINITY, maxLife: Number.POSITIVE_INFINITY }).state, 'burn');
});
