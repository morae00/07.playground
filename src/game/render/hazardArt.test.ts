import assert from 'node:assert/strict';
import test from 'node:test';
import { ATLAS_MANIFEST } from './assets/atlasManifest.generated.ts';
import type { AtlasManifest } from './assets/spriteAtlas.ts';
import { HAZARD_ART_KINDS } from './assets/slots.ts';
import { capCut, emberSlots, fireItems, fireState, heroEmberSlots, layoutFire, layoutZone, nullPaths, screenCut, shockCracks, shockSlots, trapState, windowOf, type FireItem, type HazardSpec } from './hazardArt.ts';

const manifest = ATLAS_MANIFEST as unknown as AtlasManifest;
const data = manifest.hazards!;
const spec = data.spec as unknown as HazardSpec;
const parts = data.parts.fire;
const LODS = ['full', 'reduced', 'minimal'];
const round = (value: number, places: number) => Math.round(value * 10 ** places) / 10 ** places + 0;
const item = (q: FireItem) => [q.part, round(q.x, 2), round(q.y, 2), q.flip ? 1 : 0, round(q.phase, 3), q.z, q.prio];

test('K11: the bake carries the kit SPEC, every part rule, and all 297 stamps of the nine groups, with no Korean text', () => {
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
  assert.equal(stamps, 297);
  assert.equal(Object.keys(pack.frames).length, 297);
  assert.equal(data.version, '1.0-d2r2');
  assert.doesNotMatch(JSON.stringify(data), /[가-힣]/);
});

test('K11: every terrain kind is switched on, in the brief\'s order (§15-6); the player\'s zones keep their own art', () => {
  assert.deepEqual([...HAZARD_ART_KINDS], ['fire', 'trap', 'null', 'shock', 'slow', 'root', 'water']);
  assert.ok(!HAZARD_ART_KINDS.has('warning') && !HAZARD_ART_KINDS.has('vortex'));
});

test('K11: the fire layout port gives the kit C9 vectors (fire 50:1, 74:7, 98:7, 150:23, and r150 reduced and minimal)', () => {
  const vectors = Object.entries(data.vectors.layout).filter(([key]) => key.startsWith('fire:'));
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

test('K11: the other kinds\' layout ports give the kit vectors (delivery 3 and N1: shock, slow, water, root, trap, null)', () => {
  const vectors = Object.entries(data.vectors.layout).filter(([key]) => !key.startsWith('fire:'));
  assert.deepEqual(vectors.map(([key]) => key.split(':')[0]).sort(), ['null', 'root', 'shock', 'slow', 'slow', 'slow', 'trap', 'water', 'water', 'water']);
  for (const [key, expected] of vectors) {
    const [kind, r, seed, lod = 'full'] = key.split(':');
    // Baked in chapter 3 (the trap's wet net); the other kinds draw the same in every chapter but slow in 4.
    const items = layoutZone(spec, data.parts, kind, Number(r), Number(seed), 3)[LODS.indexOf(lod)];
    assert.deepEqual(items.map(item), expected, key);
  }
  // Delivery 3's counts: water r200 has 7 strokes, 5 ripples, 3 flows, and the glint; root r52 six vines (R1).
  const water = data.vectors.layout['water:200:3'];
  assert.deepEqual(['wave', 'ripple', 'flow', 'glint'].map((name) => water.filter((q) => String(q[0]).startsWith(name)).length), [7, 5, 3, 1]);
  assert.equal(data.vectors.layout['root:52:9'].length, 6);
});

test('K11: the shock cracks and the null lines and erase edge are the kit\'s paths', () => {
  const line = (points: readonly (readonly number[])[]) => points.map((p) => [round(p[0], 2), round(p[1], 2)]);
  const cracks = shockCracks(spec, 190, 11);
  assert.deepEqual(cracks.arms.concat(cracks.branches).map(line), data.vectors.paths['shock:190:11'].cracks);
  assert.equal(cracks.arms.length + cracks.branches.length, 14, 'seven arms and their branches');
  const lines = nullPaths(spec, 130, 11);
  assert.deepEqual(lines.ghost.map(line), data.vectors.paths['null:130:11'].ghost);
  assert.deepEqual(lines.jag.map(line), data.vectors.paths['null:130:11'].jag);
  // N1: no ghost line passes within 0.15 r of the centre.
  for (const r of [120, 130, 170]) {
    for (let seed = 1; seed <= 60; seed += 1) {
      for (const [[x0, y0], [x1, y1]] of nullPaths(spec, r, seed).ghost) assert.ok(Math.abs(x0 * y1 - x1 * y0) / Math.hypot(x1 - x0, y1 - y0) >= 0.15 * r - 1e-6);
    }
  }
});

test('K11: zone LOD rules and caps — water 20/10/3, slow 24/12/3 (the dial in chapter 4), root six at every level, crumbs and pebbles only at full', () => {
  const kinds = (items: FireItem[], name: string) => items.filter((q) => q.part.startsWith(name)).length;
  for (const seed of [1, 3, 7, 23, 42]) {
    for (const r of [145, 200, 250, 270]) {
      const [full, reduced, minimal] = layoutZone(spec, data.parts, 'water', r, seed, 3);
      const nw = Math.min(10, Math.max(2, Math.round((r * r) / 6000)));
      assert.ok(full.length <= 20 && reduced.length <= 10 && minimal.length <= 3, `water r${r}`);
      assert.equal(kinds(full, 'wave'), nw, 'every surface stroke at full');
      assert.equal(kinds(reduced, 'flow') + kinds(reduced, 'glint'), 0, 'no flows or glint at reduced');
      assert.deepEqual([kinds(minimal, 'wave'), kinds(minimal, 'ripple')], [2, 1]);
    }
    for (const r of [86, 150, 200, 270]) {
      const [full, reduced, minimal] = layoutZone(spec, data.parts, 'slow', r, seed, 3);
      const mire = kinds(full, 'mire');
      assert.ok(full.length <= 24 && mire >= 3, `slow r${r}`);
      assert.equal(kinds(full, 'bubble'), Math.min(6, Math.max(2, Math.round(r / 30))));
      assert.deepEqual([reduced.length, kinds(reduced, 'bubble'), minimal.length], [Math.ceil(mire / 2), 0, 3]);
      assert.ok(layoutZone(spec, data.parts, 'slow', r, seed, 4).every((items) => items.length === 0), 'chapter 4 draws the dial');
    }
    for (const r of [50, 52]) assert.ok(layoutZone(spec, data.parts, 'root', r, seed, 1).every((items) => items.length === 6 && items.every((q) => q.flip === q.x > 0)), 'six vines curling to the centre');
    const crumbs = layoutZone(spec, data.parts, 'null', 170, seed, 5);
    assert.deepEqual(crumbs.map((items) => items.length), [9, 0, 0]);
    assert.deepEqual(layoutZone(spec, data.parts, 'shock', 190, seed, 1).map((items) => items.length), [6, 0, 0]);
  }
  assert.deepEqual([1, 2, 3, 4, 5].map((ch) => layoutZone(spec, data.parts, 'trap', 80, 1, ch)[0][0].part), ['armed-ch1', 'armed-ch2', 'armed-ch3', 'armed-ch4', 'armed-ch1']);
});

test('K11: zone states follow the kit windows — trap spring and shut fade, emerge and wither, erase and restore, and the slow fade', () => {
  assert.deepEqual(trapState(spec, { life: Number.POSITIVE_INFINITY, maxLife: Number.POSITIVE_INFINITY, triggered: false }), { state: 'armed', p: 0, k: 1 });
  // A sprung trap's life and length are cut to 3.2 s together.
  assert.equal(trapState(spec, { life: 3.1, maxLife: 3.2, triggered: true }).state, 'spring');
  assert.deepEqual(trapState(spec, { life: 2, maxLife: 3.2, triggered: true }), { state: 'shut', p: 0, k: 1 });
  assert.deepEqual(trapState(spec, { life: 0.3, maxLife: 3.2, triggered: true }), { state: 'shut', p: 0.5, k: 0.5 });
  const root = (life: number) => windowOf({ life, maxLife: 7 }, spec.root.windows.emerge, spec.root.windows.wither);
  assert.deepEqual([root(7), root(6.9), root(3), root(0.2)].map(([at, p]) => [at, round(p, 2)]), [[-1, 0], [-1, 0.4], [0, 0], [1, 0.5]]);
  const nul = (life: number) => windowOf({ life, maxLife: 5.4 }, spec.null.erase.seconds, spec.null.restore.seconds);
  assert.deepEqual([nul(5.25), nul(2), nul(0.1)].map(([at, p]) => [at, round(p, 2)]), [[-1, 0.5], [0, 0], [1, 0.8]]);
  assert.deepEqual(windowOf({ life: 0.25, maxLife: 4.6 }, 0, spec.slow.end.seconds), [1, 0.5]);
  assert.deepEqual(windowOf({ life: Number.POSITIVE_INFINITY, maxLife: Number.POSITIVE_INFINITY }, 0.3, 0.5), [0, 0], 'map hazards stand between');
});

test('K11: a shock\'s shards and dust fly for 0.3 s from the burst, every other one at reduced detail, none at minimal', () => {
  const { arms } = shockCracks(spec, 190, 11);
  const count = (age: number, li: number) => shockSlots(spec, arms, 190, 11, age, li).length;
  assert.deepEqual([count(0, 0), count(0.1, 1), count(0.1, 2), count(0.299, 0), count(0.3, 0)], [16, 8, 0, 16, 0]);
  const late = shockSlots(spec, arms, 190, 11, 0.29, 0);
  assert.ok(late.every((s) => s.frame === 3), 'the last frame at the end');
  assert.ok(late.filter((s) => s.part.startsWith('dust')).every((s) => Math.abs(Math.hypot(s.x, s.y) - (190 + spec.shock.burst.dust.at)) < 1e-6), 'dust on the rim');
});

test('K11: the screen cap keeps every zone its first item (a trap its machine), then shares the rest by class', () => {
  // Nine bindings and two traps at minimal detail with 9 stamps left after the fires: one each, even past the cap.
  const keep = screenCut([...Array.from({ length: 9 }, () => [6, 0, 0] as const), [1, 0, 0], [1, 0, 0]], 9);
  assert.ok(keep.every((k) => k[0] >= 1));
  // Slow puddles (prio 0) before its bubbles (prio 2); water strokes, then ripples, then flows and the glint.
  assert.deepEqual(screenCut([[18, 0, 6], [7, 5, 4]], 30), [[18, 0, 0], [7, 5, 0]]);
});
