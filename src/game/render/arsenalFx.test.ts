import assert from 'node:assert/strict';
import test from 'node:test';
import { ATLAS_MANIFEST } from './assets/atlasManifest.generated.ts';
import type { AtlasManifest, SpriteAtlas } from './assets/spriteAtlas.ts';
import { ARSENAL_FX_PACK } from './assets/slots.ts';
import { jit } from './skillVfx.ts';
import { makeViewport } from './viewport.ts';
import type { ArsenalPending, AwakeningZone, BeamEffect, Entity, SkillMark } from '../engine/worldTypes.ts';
import {
  ArsenalFxPainter, LODS, bandCoreArcs, bandGeo, bandHead, bladeGeo, clearStart, coreArc, cometGeo, crescentPts, crowAt, fadeA, flightFrame, gapList, grownR, headMark, jagGeo,
  layout, linksGeo, lobPath, partFrame, punchM, raggedEdge, ridgePts, ropeGeo, rippleCoreArc, sagCurves, sizeClass, spinArcs, splashGeo, splashKeep, spikeTips, streakList, sweepAngle, taperRatio,
  twistGeo, unrollHead, zoneFade, zoneOf, zonePiece, type ArsenalFxSpec, type OverlayBody,
} from './arsenalFx.ts';

const manifest = ATLAS_MANIFEST as unknown as AtlasManifest;
const data = manifest.arsenalFx!;
const S = data.spec as unknown as ArsenalFxSpec;
const RAD = Math.PI / 180;
const r = (value: number, places = 2) => Math.round(value * 10 ** places) / 10 ** places + 0;
const pt = (p: readonly number[]) => [r(p[0]), r(p[1])];
type Opts = { radius?: number; inner?: number; length?: number; width?: number; seed?: number; p?: number; t?: number; awakened?: boolean; reduced?: boolean; lod?: string; points?: { x: number; y: number; r?: number }[] };

/** The life a stage's age runs over in the kit (its p): a zone's, the unrolling scroll's, else the weapon's mark. */
const lifeOf = (id: string, stage: string) => (zoneOf(S, id)?.stage === stage ? zoneOf(S, id)!.life : stage === 'unroll' ? S.gimmick.fallingScroll.life : S.life[id]?.mark ?? 1);
/** The kit's reference spots of a strike's n events (API §9.3), for the eighth seal's stitches. */
const spots = (n: number, seed: number) => Array.from({ length: n }, (_, k) => {
  const [sx, sy] = (S as unknown as { reference: { spread: [number, number] } }).reference.spread, a = (TAU * (k + 0.7 * jit(seed, 960 + k))) / n, rr = 0.35 + 0.65 * Math.sqrt(jit(seed, 980 + k));
  return [Math.cos(a) * sx * rr, Math.sin(a) * sy * rr];
});
const TAU = Math.PI * 2;

/** The kit's paths() (API §8.3, §14), composed from the ported shapes the painter draws with. */
function paths(id: string, stage: string, o: Opts) {
  const R = o.radius ?? 0, seed = o.seed ?? 1, aw = !!o.awakened, reduced = !!o.reduced, life = lifeOf(id, stage), age = (o.p ?? 0.35) * life, t = o.t ?? 0.2;
  const P2s = (o.points ?? []).map((q) => [q.x, q.y]);
  if (stage === 'spin') return { arcs: spinArcs(zoneOf(S, id)!, seed, age, reduced).map(([a0]) => [r((a0 / RAD) % 360), r((a0 / RAD + zoneOf(S, id)!.arcs!.span) % 360)]) };
  if (stage === 'unroll') return { ridge: ridgePts(o.length!, o.width!, S.gimmick.fallingScroll.band.ridge).slice(0, 12).map(pt), head: [pt([unrollHead(S.gimmick.fallingScroll, o.length!, age, reduced), 0])] };
  if (stage === 'triangle') {
    const T = P2s.length >= 3 ? P2s : [[-110, 40], [104, 56], [-6, -92]];
    return { corners: T.map(pt), centroid: [pt([(T[0][0] + T[1][0] + T[2][0]) / 3, (T[0][1] + T[1][1] + T[2][1]) / 3])] };
  }
  if (stage === 'eighth') return { stitch: spots(7, seed).map(pt) };
  if (data.meta[id].main !== stage) return {};
  const inner = o.inner ?? 0, L = o.length ?? 0, w = o.width ?? 0, P = (o.points ?? []).map((q): [number, number] => [q.x, q.y]);
  const deg = (iv: readonly (readonly number[])[]) => iv.map(([a, b]) => [a / RAD, b / RAD]);
  const out: Record<string, (readonly number[])[]> = {};
  const rs = S.ring[id], ls = S.line[id], hs = S.halo[id], sp = (S.splash as Record<string, unknown>)[id] as Parameters<typeof splashGeo>[1] | undefined, tl = S.tilt[id];
  if (rs?.prim === 'stroke') {
    out.gaps = deg(gapList(rs.gaps, seed));
    if (rs.core) out.core = deg([coreArc(S, rs.core, seed, aw)]);
  }
  if (rs?.prim === 'band') {
    const B = bandGeo(rs, R, seed, R, (aw && rs.awakened?.widthScale) || 1, (aw && rs.awakened?.fringeSides) || undefined);
    out.knots = B.knots.map((width, k) => [(k * 360) / B.knots.length, width]);
    if (B.gaps.length) out.gaps = deg(B.gaps);
    if (rs.core) out.core = deg(bandCoreArcs(S, rs, B.arcs, seed, aw));
    const fringe = B.segs[0]?.fringeIn ?? B.segs[0]?.fringeOut;
    if (fringe) out.fringe = fringe.slice(0, 12);
  }
  if (rs?.prim === 'jag') {
    const g = jagGeo(rs, R, rs.flicker.seeds[reduced ? 0 : Math.floor(t * rs.flicker.fps) % 2]);
    out.jag = g.V;
    out.forks = g.forks.flat();
  }
  if (rs?.prim === 'multi') {
    out.rings = rs.rings.concat(aw && rs.awakened?.ring ? [rs.awakened.ring] : []).map((q) => (age < q.delay ? [0, 0] : [grownR(R * q.final, rs.grow, age - q.delay, reduced), q.alpha * fadeA(rs.fade, age, life)]));
  }
  if (rs?.prim === 'ripple') out.core = deg([rippleCoreArc(S, rs, aw)]);
  if (sp) {
    const spikes = splashKeep(splashGeo(S, sp, R, seed, aw), sp, LODS.indexOf((o.lod ?? 'full') as never));
    out.splash = spikes.flatMap((q) => spikeTips(S, q));
    out.drops = (o.lod ?? 'full') === 'full' ? spikes.filter((q) => q.drop).map((q) => [Math.cos(q.th) * q.drop!.c, Math.sin(q.th) * q.drop!.c]) : [];
  }
  if (tl) out.tilt = tl.deg.map((d, i) => [i, (jit(seed, tl.sign) < 0.5 ? -1 : 1) * d]);
  if (ls?.prim === 'sag') {
    const g = sagCurves(P, ls.sag, ls.step);
    out.controls = g.ctrls;
    out.start = [clearStart(g.pts, S.footClear)[0]];
  }
  if (ls?.prim === 'twist') {
    const g = twistGeo(P, ls, ls.flicker.seeds[reduced ? 0 : Math.floor(t * ls.flicker.fps) % 2]);
    out.strandA = g.A.slice(0, 12);
    out.strandB = g.B.slice(0, 12);
  }
  if (ls?.prim === 'links') out.links = linksGeo(P, ls, S.footClear).slice(0, 12).map((it) => [it.x, it.y]);
  if (ls?.prim === 'blade') {
    const g = bladeGeo(S, ls, L, age, life, aw);
    out.tip = [[g.tip, 0]];
    out.head = g.head;
  }
  if (ls?.prim === 'brushBand') {
    const x1 = bandHead(S, ls, L, age, life), hw = (x: number) => (ls.taper ? w * taperRatio(ls.taper, (x - S.footClear) / (L - S.footClear)) : w);
    out.top = raggedEdge(S.footClear, x1, hw, ls.edge.ragged, seed, 100, -1).slice(0, 12);
    out.bottom = raggedEdge(S.footClear, x1, hw, ls.edge.ragged, seed, 200, 1).slice(0, 12);
    if (ls.streaks) out.streaks = streakList(S, ls, x1, w, seed).flatMap((q) => [[q.x0, q.y], [q.x1, q.y]]);
  }
  if (ls?.prim === 'string') {
    const k = 1 - Math.min(1, age / ls.after.seconds);
    out.after = Array.from({ length: aw ? ls.awakened!.after : ls.after.n }, (_, j) => [(S.footClear + L) / 2, 2 * ls.after.bow * ls.after.sign[j] * k]);
  }
  if (hs) {
    const span = (aw && hs.awakened?.span) || hs.crescent?.span || hs.comet?.span || 0;
    if (hs.comet) {
      const g = cometGeo((inner + R) / 2, sweepAngle(seed, hs.comet.sweep, age, life, reduced), span, hs.comet.head[0] + (hs.comet.head[1] - hs.comet.head[0]) * jit(seed, 710));
      out.comet = g.C.filter((_, i) => i % 3 === 0);
      out.gaps = deg(gapList(hs.outer!.gaps, seed));
    }
    if (hs.rope) {
      const g = ropeGeo(S, hs, R, seed, aw);
      out.twist = g.marks.slice(0, 6).flat();
      out.stitch = deg([g.core]);
    }
    if (hs.crescent) out.crescent = crescentPts(R, hs.crescent.thick * (R - inner), sweepAngle(seed, hs.crescent.sweep, age, life, reduced), span * RAD, 10);
  }
  return Object.fromEntries(Object.entries(out).map(([name, pts]) => [name, pts.map(pt)]));
}

test('K10: the bake carries the kit SPEC, the drawn weapons, every part rule, and all 280 stamps of the 30 groups in one page, with no Korean text', () => {
  const pack = manifest.packs[ARSENAL_FX_PACK];
  assert.ok(pack, 'the weapon field effects have their own pack');
  assert.equal(pack.pages.length, 1, 'one atlas page');
  assert.ok(pack.pages.every((page) => page.startsWith('assets/packs/')), 'outside the initial download');
  assert.equal(Object.keys(data.parts).length, 30);
  let stamps = 0;
  for (const [group, rules] of Object.entries(data.parts)) {
    assert.ok(data.meta[group]?.done.fx || data.meta[group]?.done.gimmick, `${group}'s field effect or gimmick is done`);
    const animation = manifest.animations[`afx/${group}`];
    for (const [part, rule] of Object.entries(rules)) {
      assert.equal(animation?.[part]?.frames, rule.frames, `afx/${group}/${part} is animated`);
      assert.equal(animation[part].fps > 0, rule.drive === 'loop', `${group}/${part} runs on the clock only when it loops`);
      if (rule.drive === 'prog' || rule.drive === 'cycle') assert.ok(rule.seconds !== null || ['beam', 'chain'].includes(rule.window), `${group}/${part}: a prog or cycle part has its seconds or the data's window`);
      for (let frame = 0; frame < rule.frames; frame += 1) assert.ok(pack.frames[`afx/${group}/${part}/${frame}`], `afx/${group}/${part}/${frame} is baked`);
      stamps += rule.frames;
    }
  }
  assert.equal(stamps, 280);
  assert.equal(Object.keys(pack.frames).length, 280);
  assert.deepEqual(Object.entries(data.meta).filter(([, m]) => m.done.lob).map(([id]) => id), ['inkPots', 'clusterPots', 'tarJar', 'meteorBrush']);
  // Delivery 3a: the 17 P1 gimmicks, each its weapon's last stage, and the new rules the parts read.
  const p1 = Object.entries(data.meta).filter(([, m]) => m.done.gimmick);
  assert.equal(p1.length, 17);
  for (const [id, m] of p1) assert.ok(m.stages.length >= 1, `${id} has its gimmick stage`);
  const rules = Object.values(data.parts).flatMap((group) => Object.values(group));
  for (const [field, values] of [['drive', ['cycle']], ['window', ['zone', 'zone-start', 'zone-end', 'status', 'event', 'variant', 'pending']], ['place', ['disc', 'over', 'orbit', 'feet']], ['rotate', ['face']]] as const) {
    for (const value of values) assert.ok(rules.some((rule) => rule[field] === value), `a part has ${field} ${value}`);
  }
  for (const key of ['zone', 'gimmick', 'overlay']) assert.ok((data.spec as Record<string, unknown>)[key], `SPEC.${key} is baked`);
  assert.match(data.version, /^1\.0-d3a/);
  assert.doesNotMatch(JSON.stringify(data), /[가-힣]/);
});

test('K10: the layout and shape ports give the kit C9 vectors (every drawn case of the brief, review 1\'s three, the P1 gimmicks, awakened, LOD, and reduced motion)', () => {
  const { cases } = data.vectors;
  assert.ok(cases.length >= 60, 'the cases the kit has drawn');
  for (const [id, stage, raw, items, shapes] of cases) {
    const o = raw as Opts, life = lifeOf(id, stage);
    const got = layout(S, id, stage, { R: o.radius ?? 0, L: o.length ?? 0, w: o.width ?? 0, aw: !!o.awakened, seed: o.seed ?? 1, age: (o.p ?? 0.35) * life, life, reduced: !!o.reduced, points: o.points });
    const label = `${id}/${stage} ${JSON.stringify(raw).slice(0, 60)}`;
    assert.deepEqual(got.map((q) => [q.part, r(q.x), r(q.y), r(q.angle, 3), q.flip ? 1 : 0, r(q.phase, 3), q.prio, q.z]), items, `${label} layout`);
    assert.deepEqual(paths(id, stage, o), shapes, `${label} paths`);
  }
  const kinds = new Set(cases.map(([id]) => data.meta[id].kind));
  assert.deepEqual([...kinds].sort(), ['beam', 'chain', 'halo', 'lob', 'nova', 'rear', 'seeker', 'spray', 'strike', 'volley']);
  const gimmicks = new Set(cases.filter(([id, stage]) => data.meta[id].main !== stage).map(([, stage]) => stage));
  for (const stage of ['fire', 'gather', 'smoke', 'mark', 'spin', 'total', 'unroll', 'caltrop', 'grave', 'pillar', 'triangle', 'eighth']) assert.ok(gimmicks.has(stage), `a ${stage} case`);
});

test('K10: the lob path port gives the kit vectors (C9 lines 72-75) and the cluster pots\' mini path', () => {
  for (const [id, rows] of Object.entries(data.vectors.lob)) {
    for (const row of rows) {
      const p = lobPath(S, id, 0, 0, 320, -120, row[0])!;
      assert.deepEqual([row[0], r(p.x), r(p.y), r(p.h), r(p.angle, 3), r(p.rx), r(p.alpha, 3)], row, `${id} t ${row[0]}`);
      assert.equal(r(p.ry, 6), r(0.42 * p.rx, 6));
    }
  }
  assert.deepEqual(Object.keys(data.vectors.lob), ['inkPots', 'clusterPots', 'tarJar', 'meteorBrush']);
  assert.equal(data.vectors.mini.length, 2);
  for (const [x1, y1, rows] of data.vectors.mini) {
    for (const row of rows) {
      const p = lobPath(S, 'clusterPots', 0, 0, x1, y1, row[0], true)!;
      assert.deepEqual([row[0], r(p.x), r(p.y), r(p.h), r(p.angle, 3), r(p.rx), r(p.alpha, 3)], row, `mini to ${x1} t ${row[0]}`);
    }
  }
  assert.equal(lobPath(S, 'inkPots', 0, 0, 0, 0, 0.5, true)!.h, 4 * S.lob.inkPots.H[1] * 0.25, 'mini only for the cluster pots');
  assert.equal(lobPath(S, 'inkLance', 0, 0, 1, 1, 0.5), null);
});

test('K10: drive rules — prog by its window, loop by the clock at half rate reduced and held on its phase, the pot rolls once over its flight', () => {
  const bolt = data.parts.inkLightning.bolt;
  assert.deepEqual([0, 0.059, 0.06, 0.19, 0.5].map((age) => partFrame(bolt, age, 0.3, 0, 0, false, 0)), [0, 0, 1, 3, 3]);
  const tassel = data.parts.inkLance.tassel;
  assert.deepEqual([0, 0.13, 0.27].map((age) => partFrame(tassel, age, 0.28, 0, 0, false, 0)), [0, 0, 1], 'a beam part plays over the beam\'s life');
  const ribbon = data.parts.eclipseHalo['ribbon-a'];
  assert.equal(partFrame(ribbon, 0, 0.3, 0, 0.25, false, 0), 0);
  assert.equal(partFrame(ribbon, 0, 0.3, 0, 0.1, false, 0), 1, '12 fps');
  assert.equal(partFrame(ribbon, 0, 0.3, 0, 0.1, false, 1), 0, 'half rate at reduced detail');
  assert.equal(partFrame(ribbon, 0, 0.3, 0.7, 5, true, 0), 2, 'held on its phase frame under reduced motion');
  assert.equal(partFrame(ribbon, 0, 0.3, 0, 5, false, 2), 0, 'held at minimal detail');
  // Review 4 F1: the ink pot rolls once over its flight (0, 25, 50, 75°): frames 0 1 2 2 3 at t .12 .30 .50 .70 .88.
  const pot = data.parts.inkPots.pot;
  assert.equal((S.flight as Record<string, { frame?: string }>).inkPots.frame, 'progress');
  assert.equal(pot.drive, 'prog');
  assert.deepEqual([0.12, 0.3, 0.5, 0.7, 0.88].map((t) => flightFrame(pot, true, t, t * 0.55, 0.9, false, 0)), [0, 1, 2, 2, 3]);
  assert.equal(flightFrame(pot, true, 0.7, 0.4, 0, true, 0), 2, 'reduced motion keeps the roll');
  assert.equal(flightFrame(pot, true, 0.7, 0.4, 0, false, 2), 0, 'frame 0 at minimal detail');
  const jar = data.parts.tarJar.jar;
  assert.equal(flightFrame(jar, false, 0.5, 0.35, 0, false, 0), 2, '8 fps by the flight\'s age');
  assert.equal(flightFrame(jar, false, 0.5, 0.35, 0, true, 0), jar.still, 'its still frame under reduced motion');
});

test('K10: punch, grow, and fade — the moment of the hit is the widest, reduced motion fades in at R and punches at most 1.5', () => {
  const pots = S.ring.inkPots;
  assert.equal(punchM(pots.punch, 0, false), pots.punch!.scale);
  assert.equal(punchM(pots.punch, 0, true), 1.5);
  assert.equal(punchM(pots.punch, 0.1, false), 1);
  assert.ok(punchM(pots.punch, 0.05, false) < pots.punch!.scale && punchM(pots.punch, 0.05, false) > 1);
  assert.equal(punchM(undefined, 0, false), 1);
  assert.equal(grownR(100, pots.grow, 0, false), 100 * pots.grow!.from);
  assert.equal(grownR(100, pots.grow, 0, true), 100);
  assert.equal(fadeA(pots.fade, 0, 0.36, pots.grow, true), 0, 'reduced motion: comes in by alpha');
  assert.equal(fadeA(pots.fade, 0.2, 0.36), 1);
  assert.ok(fadeA(pots.fade, 0.3, 0.36) < 1);
});

/** A canvas that records the stamps it is asked to draw, and an atlas over the baked manifest. */
function scene() {
  const drawn: string[] = [];
  const calls: string[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get(target, key) {
      if (key in target) return target[key as string];
      return (...args: unknown[]) => {
        calls.push(String(key));
        if (key === 'drawImage') drawn.push(String(args[0]));
      };
    },
    set(target, key, value) {
      target[key as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  (ctx as unknown as { globalAlpha: number }).globalAlpha = 1;
  const pack = manifest.packs[ARSENAL_FX_PACK];
  const atlas = {
    status: (name: string) => (name === ARSENAL_FX_PACK ? 'ready' : 'idle'),
    arsenalFx: () => data,
    frame: (key: string) => (pack.frames[key] ? { image: key, sx: 0, sy: 0, sw: 1, sh: 1, ax: 0, ay: 0, scale: 2 } : undefined),
  } as unknown as SpriteAtlas;
  return { ctx, atlas, drawn, calls, view: makeViewport(0, 0, 4000, 4000, 0) };
}
const mark = (skillId: string, age: number, life: number, extra: Partial<SkillMark> = {}): SkillMark => ({ kind: 'ring', skillId: skillId as SkillMark['skillId'], x: 0, y: 0, radius: 92, heavy: false, x2: 0, y2: 0, target: -1, life: life - age, maxLife: life, seed: 3, ...extra });

test('K10: the painter takes the weapons\' own blasts and lines; a gimmick\'s echo, the total eclipse, and the core skills keep theirs', () => {
  const { atlas } = scene();
  const painter = new ArsenalFxPainter();
  assert.equal(painter.begin(null, 0, false, 1, 'full', {}), false, 'no pack: the looks\' art draws');
  assert.equal(painter.markSeconds('inkPots'), undefined);
  assert.equal(painter.begin(atlas, 0, false, 1, 'full', {}), true);
  assert.ok(painter.handles(mark('inkPots', 0, 1.2)));
  assert.ok(!painter.handles(mark('inkPots', 0, 1.2, { echo: true })));
  assert.ok(painter.handles(mark('eclipseHalo', 0, 0.3, { heavy: true })), 'the total eclipse is the kit\'s (3a)');
  assert.ok(painter.handles(mark('seventhSeal', 0, 1.2, { echo: true, radius: 120 })), 'so is the eighth seal');
  assert.ok(!painter.handles(mark('thunderclap', 0, 0.3, { echo: true })), 'a P2 echo keeps the look\'s ring');
  assert.ok(!painter.handles(mark('clusterPots', 0, 0.3, { echo: true })));
  assert.ok(!painter.handles(mark('boneMortar', 0, 0.3)));
  assert.ok(!painter.handles(mark('tailGuard', 0, 0.3)));
  assert.ok(painter.handles(mark('eclipseHalo', 0, 0.3)));
  // A mark lasts through its decal: the seal's ring 0.36 s, its print 1.2 s.
  assert.equal(painter.markSeconds('seventhSeal'), 1.2);
  assert.equal(painter.markSeconds('thunderclap'), 0.3);
  assert.equal(painter.markSeconds('boneMortar'), undefined);
  assert.equal(painter.markSeconds('seventhSeal', true), 1.2, 'the eighth seal through its print');
  assert.equal(painter.markSeconds('eclipseHalo', false, true), 0.3);
  assert.equal(painter.markSeconds('thunderclap', true), undefined);
  const line = { id: 1, x1: 0, y1: 0, x2: 100, y2: 0, width: 12, life: 0.2, maxLife: 0.28, owner: 'player' as const };
  assert.ok(painter.handlesLine({ ...line, skillId: 'inkLance' }));
  assert.ok(!painter.handlesLine({ ...line, skillId: 'inkLance', echo: true }), 'a fork keeps the gimmick\'s drawing');
  assert.ok(!painter.handlesLine({ ...line, skillId: 'railSpear' }));
  assert.ok(painter.handlesLine({ ...line, skillId: 'trackingSeals' }), 'the triangle seal is the kit\'s (3a)');
  assert.ok(painter.handlesLine({ ...line, skillId: 'fallingScroll', echo: true }), 'so is the unrolling scroll');
  assert.ok(!painter.handlesLine({ ...line, skillId: 'wideBrush', echo: true }), 'a P2 line keeps its drawing');
  assert.ok(painter.handlesLine({ id: 2, points: [{ x: 0, y: 0 }, { x: 90, y: 0 }], life: 0.1, maxLife: 0.18, skillId: 'frostChainlet' }));
  assert.ok(!painter.handlesLine({ id: 2, points: [{ x: 0, y: 0 }, { x: 90, y: 0 }], life: 0.1, maxLife: 0.18, skillId: 'frostChainlet', echo: true }));
});

test('K10: caps — decals 16/8/0 newest first, the ring and object of every blast always, and the splash of 12/8/3 blasts', () => {
  const marks = Array.from({ length: 20 }, (_, i) => mark('inkPots', 0.02, 1.2, { x: i * 10, seed: i + 1 }));
  LODS.forEach((detail, li) => {
    const { ctx, atlas, drawn, calls, view } = scene();
    const painter = new ArsenalFxPainter();
    painter.begin(atlas, 1, false, 1, detail, {});
    painter.drawDecals(ctx, marks, [], view);
    assert.equal(drawn.filter((key) => key.startsWith('afx/inkPots/splat')).length, S.caps.decals[li], `${detail} decals`);
    drawn.length = 0;
    calls.length = 0;
    painter.drawMarks(ctx, marks, view, false);
    assert.equal(drawn.filter((key) => key.startsWith('afx/inkPots/shatter/0')).length, 20, `${detail}: every blast's object at its strongest frame`);
    // One fill per splash, one per ring layer (two) plus the ring's own arcs (two gaps).
    const fills = calls.filter((call) => call === 'fill').length;
    assert.equal(fills, Math.min(20, S.caps.splash[li]), `${detail} splashes`);
  });
});

test('K10: a lob flies from the hand over its shadow, by its own delay; it is gone at t = 1 (the blast takes over), and 12/12/6 a screen', () => {
  const lob = { at: 0.6, x: 300, y: 0, radius: 64, damage: 1, id: 'clusterPots' as const, x0: 0, y0: 0, born: 0, delay: 0.6, k: 0, awakened: false };
  const lobs = Array.from({ length: 14 }, (_, k) => ({ ...lob, k, x: 300 + k }));
  for (const [detail, cap] of [['full', 12], ['reduced', 12], ['minimal', 6]] as const) {
    const { ctx, atlas, drawn, calls, view } = scene();
    const painter = new ArsenalFxPainter();
    painter.begin(atlas, 0.3, false, 1, detail, {});
    painter.drawLobs(ctx, lobs, view);
    assert.equal(drawn.length, cap, `${detail} flights`);
    assert.deepEqual([...new Set(drawn.map((key) => key.split('/')[2]))], ['pot-s', 'pot-m'], 'the cast\'s pots s, m, s, m');
    painter.drawGround(ctx, [], lobs, view);
    assert.equal(calls.filter((call) => call === 'ellipse').length, cap, `${detail} shadows`);
  }
  const { ctx, atlas, drawn, view } = scene();
  const painter = new ArsenalFxPainter();
  painter.begin(atlas, 0.6, false, 1, 'full', {});
  painter.drawLobs(ctx, [lob], view);
  assert.equal(drawn.length, 0, 'landed');
});

test('K10 review 4 F2: a meteor brush that came from the right lands mirrored about its anchor; its crater, ring, and splash do not', () => {
  const lm = (S.flight as Record<string, { landMirror?: { when: string; parts: string[] } }>).meteorBrush.landMirror!;
  assert.deepEqual(lm, { when: 'dx<0', parts: ['impact', 'impact-awakened'] });
  const scaled = (dir?: -1 | 1) => {
    const { ctx, atlas, calls, view } = scene();
    const painter = new ArsenalFxPainter();
    painter.begin(atlas, 1, false, 1, 'full', {});
    painter.drawMarks(ctx, [mark('meteorBrush', 0.01, 1.5, { radius: 160, ...(dir ? { dir } : {}) })], view, false);
    return calls.filter((call) => call === 'scale').length;
  };
  assert.equal(scaled(-1), 1);
  assert.equal(scaled(1), 0);
  assert.equal(scaled(), 0, 'an unknown way keeps the baked side');
});

// ---- delivery 3a: the awakening gimmicks, P1 ----

/** A canvas that records each stamp, fill, and stroke with the alpha it is drawn at (and whether the stroke is dashed). */
function recorder(detail: 'full' | 'reduced' | 'minimal' = 'full', reduced = false, flash = 1, time = 1, skills = {}) {
  const ops: { op: string; key: string; alpha: number; dashed: boolean }[] = [];
  const state = { globalAlpha: 1, dash: [] as number[] }, saved: number[] = [];
  const ctx = new Proxy(state as unknown as Record<string, unknown>, {
    get(target, key) {
      if (key === 'setLineDash') return (dash: number[]) => (state.dash = dash);
      if (key === 'save') return () => saved.push(state.globalAlpha);
      if (key === 'restore') return () => (state.globalAlpha = saved.pop() ?? 1);
      if (key in target) return target[key as string];
      return (...args: unknown[]) => {
        if (key === 'drawImage') ops.push({ op: 'stamp', key: String(args[0]), alpha: state.globalAlpha, dashed: false });
        if (key === 'fill' || key === 'stroke') ops.push({ op: String(key), key: String((target as Record<string, unknown>)[key === 'fill' ? 'fillStyle' : 'strokeStyle']), alpha: state.globalAlpha, dashed: state.dash.length > 0 });
        if (key === 'ellipse') ops.push({ op: 'ellipse', key: '', alpha: state.globalAlpha, dashed: false });
      };
    },
    set(target, key, value) {
      target[key as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  const { atlas } = scene();
  const painter = new ArsenalFxPainter();
  painter.begin(atlas, time, reduced, flash, detail, skills);
  const stamps = (prefix: string) => ops.filter((o) => o.op === 'stamp' && o.key.startsWith(prefix));
  return { ctx, painter, ops, stamps, view: makeViewport(-2000, -2000, 8000, 8000, 0) };
}
const zoneAt = (weapon: string, x: number, y: number, radius: number, age: number, life: number): AwakeningZone => ({ weapon: weapon as AwakeningZone['weapon'], x, y, radius, life: life - age, maxLife: life, damage: 0, next: 0, hit: [] });
const enemyAt = (x: number, y: number, radius: number, awk: Entity['awk'] = undefined) => ({ x, y, radius, awk } as unknown as Entity);
const bodyOf = (e: Entity, top = e.y - 40): OverlayBody => ({ x: e.x, y: e.y, top, enemy: e });

test('K10 3a review 5 F2: a zone\'s rim stays, its wash and stamps fade, and its centre object hands over to its start and end parts at alpha 1', () => {
  const at = (id: string, age: number) => {
    const Z = zoneOf(S, id)!;
    return zonePiece(S, Z, { prim: 'center', part: S.layout[id][Z.stage][0].parts[0], x: 0, y: 0, angle: 0, flip: false, phase: 0, prio: 0, z: 'stand' }, age, Z.life);
  };
  // The pillar (start and end): alpha 1 all its life; its loop between the two parts.
  assert.deepEqual([0.06, 0.11, 0.13, 0.15, 0.84, 0.95, 0.98, 1.03, 1.14].map((a) => [at('inkLightning', a).part, at('inkLightning', a).alpha]), [
    ['pillar-start', 1], ['pillar-start', 1], ['pillar', 1], ['pillar', 1], ['pillar', 1], ['pillar', 1], ['pillar', 1], ['pillar-end', 1], ['pillar-end', 1],
  ]);
  assert.equal(at('inkLightning', 1.14).progress! > 0.5, true, 'the end part plays inside the life');
  // The spin (end only): fades in, then alpha 1 until its end part.
  assert.deepEqual([0.1, 0.2, 0.3, 0.345, 0.355, 0.4, 0.475].map((a) => [at('twinBlades', a).part, r(at('twinBlades', a).alpha)]), [
    ['spin', 0.67], ['spin', 1], ['spin', 1], ['spin', 1], ['spin-end', 1], ['spin-end', 1], ['spin-end', 1],
  ]);
  // The grave (start only): rises at alpha 1, fades over its last 0.3 s.
  assert.deepEqual([0.05, 2.6, 2.8, 2.95].map((a) => [at('gravePins', a).part, r(at('gravePins', a).alpha)]), [['grave-rise', 1], ['grave-a', 1], ['grave-a', 0.67], ['grave-a', 0.17]]);
  // The caltrop (neither): the zone's alpha both ways, as every other stamp, wash, and gloss.
  assert.deepEqual([0.05, 0.75, 1.4].map((a) => r(at('pinHail', a).alpha)), [0.33, 1, 0.33]);
  assert.equal(r(zoneFade(S, 1.14, 1.2)), 0.2);
  // Drawn: at the pillar's last frame its rim is still whole, its stamp at alpha 1, beside a faded wash elsewhere.
  const { ctx, painter, ops, stamps, view } = recorder('full', false, 1, 5);
  painter.planZones([zoneAt('inkLightning', 0, 0, 40, 1.17, 1.2), zoneAt('smokeTail', 400, 0, 70, 1.9, 2)], view, 0, 0);
  painter.drawZones(ctx, 0, 0);
  const rims = ops.filter((o) => o.op === 'stroke' && o.dashed);
  assert.equal(rims.length, 2, 'the two rims in one path, two dashed layers');
  assert.ok(rims.every((o) => o.alpha === 1), 'rims at alpha 1');
  assert.ok(ops.some((o) => o.op === 'fill' && r(o.alpha, 3) === r(0.16 * (0.1 / 0.3), 3)), 'the smoke\'s wash fades');
  assert.deepEqual(painter.stands().map((s) => s.it.part), ['pillar']);
  painter.drawStand(ctx, painter.stands()[0]);
  assert.deepEqual(stamps('afx/inkLightning/').map((o) => [o.key, o.alpha]), [['afx/inkLightning/pillar-end/1', 1]]);
});

test('K10 3a: zones in their layers — floor, wash, rim, and ground stamps in the hazards; graves and pillars among the bodies; blades, arcs, and motes over them', () => {
  const zones = [zoneAt('pinHail', 0, 0, 18, 0.5, 1.5), zoneAt('gravePins', 100, 0, 22, 1, 3), zoneAt('inkPots', 300, 0, 75, 1, 2), zoneAt('tarJar', 600, 0, 114, 0.7, 1.5), zoneAt('meteorBrush', 900, 0, 96, 1, 4), zoneAt('twinBlades', 1200, 0, 60, 0.25, 0.5), zoneAt('smokeTail', 1500, 0, 70, 1, 2), zoneAt('inkLightning', 1800, 0, 40, 0.6, 1.2)];
  const { ctx, painter, stamps, ops, view } = recorder();
  painter.planZones(zones, view, 0, 0);
  painter.drawZones(ctx, 900, 0);
  const ground = stamps('afx/').map((o) => o.key.split('/').slice(1, 3).join('/'));
  for (const part of ['pinHail/caltrop', 'inkPots/flame', 'tarJar/jarBroken', 'tarJar/string', 'meteorBrush/crater', 'smokeTail/puff']) assert.ok(ground.some((k) => k.startsWith(part)), `${part} on the ground`);
  for (const part of ['gravePins/', 'inkLightning/', 'twinBlades/', 'meteorBrush/mote']) assert.ok(!ground.some((k) => k.startsWith(part)), `${part} not on the ground`);
  assert.ok(ops.some((o) => o.op === 'stroke' && !o.dashed && o.alpha === 1), 'the meteor mark\'s solid rim');
  assert.deepEqual(painter.stands().map((s) => s.p.z.weapon).sort(), ['gravePins', 'inkLightning']);
  for (const s of painter.stands()) assert.ok(s.bottom > s.y && s.top < s.y - 20, 'a standing piece rises over its foot');
  ops.length = 0;
  painter.drawZoneTops(ctx);
  const tops = stamps('afx/').map((o) => o.key.split('/')[1]);
  assert.ok(tops.includes('twinBlades') && tops.includes('meteorBrush'));
  assert.equal(ops.filter((o) => o.op === 'stroke').length, 4, 'the spin\'s two arcs, two layers each');
  // Minimal detail keeps each zone's centre object, its floor, fill, and rim.
  const low = recorder('minimal');
  low.painter.planZones(zones, low.view, 0, 0);
  low.painter.drawZones(low.ctx, 0, 0);
  low.painter.drawZoneTops(low.ctx);
  const kept = low.stamps('afx/').map((o) => o.key.split('/')[2]);
  for (const part of ['flame-a', 'flame-b', 'puff-a', 'puff-b', 'puff-c', 'string-a', 'string-b', 'mote-a', 'mote-b']) assert.ok(!kept.includes(part), `no ${part} at minimal`);
  for (const part of ['jarBroken', 'crater', 'spin']) assert.ok(kept.includes(part), `${part} kept at minimal`);
});

test('K10 3a: zone stamps stay within 120/72/36 a screen (centre objects never dropped), and a meteor landing on its own mark leaves no second crater', () => {
  const smokes = Array.from({ length: 40 }, (_, i) => zoneAt('smokeTail', (i % 8) * 150, 600 + Math.floor(i / 8) * 150, 70, 1, 2));
  const pins = Array.from({ length: 60 }, (_, i) => zoneAt('pinHail', i * 5, 0, 18, 0.5, 1.5));
  LODS.forEach((detail, li) => {
    const { ctx, painter, stamps, view } = recorder(detail);
    painter.planZones([...smokes, ...pins], view, 0, 0);
    painter.drawZones(ctx, 0, 0);
    assert.equal(stamps('afx/pinHail/').length, 60, `${detail}: every caltrop`);
    assert.equal(stamps('afx/smokeTail/').length, Math.max(0, S.caps.zoneStamps[li] - 60) * (li < 2 ? 1 : 0), `${detail}: the extras fill what the cap leaves`);
  });
  const land = mark('meteorBrush', 0.05, 1.5, { x: 50, y: 60, radius: 160 });
  for (const [zones, craters] of [[[zoneAt('meteorBrush', 50, 60, 96, 0.05, 4)], 0], [[zoneAt('meteorBrush', 400, 60, 96, 0.05, 4)], 1], [[], 1]] as const) {
    const { ctx, painter, stamps, view } = recorder();
    painter.drawDecals(ctx, [land], zones, view);
    assert.equal(stamps('afx/meteorBrush/crater').length, craters);
  }
});

test('K10 3a: enemy overlays — one feet overlay (a freeze never dropped, burning ink on those in an ink pots fire), one head mark by priority, crows apart, nearest the hero first', () => {
  const t = 1;
  const fire = zoneAt('inkPots', 0, 0, 60, 0.5, 2);
  const inside = enemyAt(50, 0, 12), edge = enemyAt(70, 0, 12), outside = enemyAt(90, 0, 12), frozenIn = enemyAt(10, 10, 19, { freeze: 2 });
  const { ctx, painter, stamps } = recorder('full', false, 1, t);
  painter.planOverlays([inside, edge, outside, frozenIn].map((e) => bodyOf(e)), [fire], 0, 0);
  assert.deepEqual([inside, edge, outside, frozenIn].map((e) => painter.overlayOf(e)?.feet ?? null), ['scorch', 'scorch', null, 'freeze'], 'by the fire\'s hit rule (R + r)');
  painter.drawFeet(ctx, bodyOf(frozenIn));
  painter.drawFront(ctx, bodyOf(frozenIn));
  painter.drawFront(ctx, bodyOf(inside));
  assert.deepEqual(stamps('afx/').map((o) => o.key.replace(/\/\d+$/, '')), ['afx/frostNeedles/freeze-back-19', 'afx/frostNeedles/freeze-front-19', 'afx/inkPots/scorch12']);
  // Heads: silence over prey over the P2 marks; the kit draws silence and prey; a P2 mark alone keeps its vector sign.
  const both = enemyAt(0, 0, 12, { silence: 9, prey: 9 }), prey = enemyAt(0, 0, 12, { prey: 9, fear: 9 }), fear = enemyAt(0, 0, 12, { fear: 9 }), crow = enemyAt(0, 0, 12, { crow: 9, peckAt: t - 0.05 });
  assert.equal(headMark(S, both.awk, t), 'silence');
  assert.equal(headMark(S, prey.awk, t), 'prey');
  assert.equal(headMark(S, fear.awk, t), 'fear');
  assert.equal(headMark(S, { stain: 2, stainUntil: 9 }, t), 'stain');
  painter.planOverlays([both, prey, fear, crow].map((e) => bodyOf(e)), [], 0, 0);
  assert.deepEqual([both, prey, fear, crow].map((e) => [painter.overlayOf(e)?.head ?? null, painter.firstMark(e), painter.overlayOf(e)?.crow ?? false]), [
    ['silence', true, false], ['prey', true, false], [null, false, false], [null, false, true],
  ]);
  const before = stamps('afx/').length;
  for (const e of [both, prey, crow]) painter.drawHead(ctx, bodyOf(e), -52);
  assert.deepEqual(stamps('afx/').slice(before).map((o) => o.key.split('/').slice(1, 3).join('/')), ['silenceBell/mark-silence', 'huntersMarks/mark-prey', 'crowFeathers/crow', 'crowFeathers/peck']);
  // Caps (24/16/8 heads and feet, 12/8/4 crows), nearest the hero first; every freeze stays.
  const crowd = Array.from({ length: 40 }, (_, i) => enemyAt(100 + i * 10, 0, 12, { silence: 9, crow: 9, ...(i < 30 ? { freeze: 9 } : {}) }));
  LODS.forEach((detail, li) => {
    const low = recorder(detail, false, 1, t);
    low.painter.planOverlays(crowd.map((e) => bodyOf(e)), [], 0, 0);
    const plans = crowd.map((e) => low.painter.overlayOf(e));
    assert.equal(plans.filter((o) => o?.head).length, S.caps.heads[li], `${detail} heads`);
    assert.ok(plans.slice(0, S.caps.heads[li]).every((o) => o?.head), `${detail}: the nearest`);
    assert.equal(plans.filter((o) => o?.crow).length, S.caps.crows[li], `${detail} crows`);
    assert.equal(plans.filter((o) => o?.feet === 'freeze').length, 30, `${detail}: every freeze`);
    assert.ok(crowd.every((e) => low.painter.firstMark(e)), 'a dropped head mark drops the lower ones too');
  });
});

test('K10 3a: the crow circles over the head facing its way, dives to peck, and sits under reduced motion; prey tags and burning ink hold still', () => {
  const c = S.marks.crow, q = S.overlay.crow;
  const a = crowAt(S, 0, -40, -1, false);
  assert.deepEqual([r(a.x), r(a.y), a.flip], [c.rx, -40 - c.lift, false]);
  const b = crowAt(S, c.period / 4, -40, -1, false);
  assert.deepEqual([r(b.x), r(b.y), b.flip], [0, -40 - c.lift + c.ry, true], 'flies left, mirrored');
  const dive = crowAt(S, c.period / 4, -40, c.dive / 2, false);
  assert.deepEqual([r(dive.x), r(dive.y), dive.pecking], [q.dive.crow[0], -40 + q.dive.crow[1], true], 'at the head mid-dive');
  assert.deepEqual(crowAt(S, 3, -40, 0.05, true), { x: q.sit[0], y: -40 + q.sit[1], flip: false, pecking: true });
  assert.equal(sizeClass(16, [12, 19, 28]), 19);
  assert.equal(sizeClass(30, S.overlay.feet.scorch.r), 28);
  // cycle: the meteor's motes rise once every 1.2 s.
  const mote = data.parts.meteorBrush['mote-a'];
  assert.equal(mote.drive, 'cycle');
  assert.deepEqual([0, 0.3, 0.6, 0.9, 1.2].map((t) => partFrame(mote, 0, 1, 0, t, false, 0)), [0, 1, 2, 3, 0]);
  assert.equal(partFrame(mote, 0, 1, 0.6, 0.9, true, 0), 2, 'its phase frame under reduced motion');
});

test('K10 3a review 5 ②: the total eclipse — disc and band on the ground under the bodies (halved under reduced flash), rim, line, corona, and ribbon over them', () => {
  const total = mark('eclipseHalo', 0.05, 0.3, { heavy: true, radius: 276 });
  for (const flash of [1, 0.5]) {
    const { ctx, painter, ops, view } = recorder('full', false, flash);
    painter.drawDecals(ctx, [total], [], view);
    const fills = ops.filter((o) => o.op === 'fill');
    assert.deepEqual(fills.map((o) => r(o.alpha, 3)), [r(0.2 * flash, 3), r(0.22 * flash, 3)], `disc and band at flash ${flash}`);
    assert.ok(!ops.some((o) => o.op === 'stroke' || o.op === 'stamp'), 'nothing else on the ground');
  }
  const corona = (detail: 'full' | 'reduced' | 'minimal') => {
    const { ctx, painter, ops, stamps, view } = recorder(detail);
    painter.drawMarks(ctx, [total], view, false);
    assert.ok(!ops.some((o) => o.op === 'fill'), `${detail}: no disc over the bodies`);
    assert.equal(stamps('afx/eclipseHalo/ribbon').length, 1);
    return stamps('afx/eclipseHalo/corona').length;
  };
  const full = corona('full');
  assert.ok(full >= 7 && full <= 9);
  assert.equal(corona('reduced'), Math.ceil(full / 2));
  assert.equal(corona('minimal'), 0);
});

test('K10 3a: the triangle seal sews its edges and strikes, the scroll unrolls in place of the ink bar, and the eighth seal waits and strikes', () => {
  const edge = (x1: number, y1: number, x2: number, y2: number, width: number, age: number, life: number): BeamEffect => ({ id: 1, x1, y1, x2, y2, width, life: life - age, maxLife: life, owner: 'player', skillId: 'trackingSeals' });
  const tri = (width: number, age: number, life: number) => [edge(0, 0, 200, 0, width, age, life), edge(200, 0, 100, 150, width, age, life), edge(100, 150, 0, 0, width, age, life)];
  const sew = recorder();
  sew.painter.drawSeals(sew.ctx, tri(2, 0.3, 0.6), sew.view);
  assert.deepEqual(sew.stamps('afx/').map((o) => o.key), Array(3).fill('afx/trackingSeals/sealCorner/1'));
  assert.ok(sew.ops.filter((o) => o.op === 'stroke').every((o) => o.dashed), 'sewn');
  assert.equal(sew.ops.filter((o) => o.op === 'stroke').length, 4, 'one edge and a half sewn, two layers each');
  const hit = recorder();
  hit.painter.drawSeals(hit.ctx, tri(8, 0.05, 0.28), hit.view);
  assert.deepEqual(hit.stamps('afx/').map((o) => o.key), [...Array(3).fill('afx/trackingSeals/sealCorner/2'), 'afx/trackingSeals/sealStrike/0']);
  assert.ok(hit.ops.some((o) => o.op === 'fill'), 'the paper fill in its first moment');
  // The falling scroll's unrolling band (beam frame), its roller on the head.
  const scroll = recorder();
  scroll.painter.drawBeam(scroll.ctx, { id: 2, x1: 0, y1: 0, x2: 240, y2: 0, width: 50, life: 0.2, maxLife: 0.28, owner: 'player', skillId: 'fallingScroll', echo: true });
  assert.deepEqual(scroll.stamps('afx/').map((o) => o.key.split('/')[2]), ['roller']);
  assert.ok(scroll.ops.some((o) => o.op === 'fill' && r(o.alpha, 2) === 0.5), 'the paper band');
  // The eighth seal: its shadow on the ground and the stitches from the seven seals while it waits.
  const pending: ArsenalPending = { id: 'seventhSeal', x: 0, y: 0, born: 0.8, delay: 0.3, points: Array.from({ length: 7 }, (_, k) => ({ x: Math.cos(k) * 120, y: Math.sin(k) * 80 })) };
  LODS.forEach((detail, li) => {
    const wait = recorder(detail, false, 1, 0.95);
    wait.painter.drawPending(wait.ctx, [pending], wait.view, true);
    assert.equal(wait.ops.filter((o) => o.op === 'ellipse').length, 1);
    wait.ops.length = 0;
    wait.painter.drawPending(wait.ctx, [pending], wait.view, false);
    assert.equal(wait.ops.filter((o) => o.op === 'stroke').length / 2, [7, 4, 0][li], `${detail} stitches`);
  });
  const strike = mark('seventhSeal', 0.1, 1.2, { echo: true, radius: 120 });
  const eight = recorder();
  eight.painter.drawDecals(eight.ctx, [strike], [], eight.view);
  assert.deepEqual(eight.stamps('afx/').map((o) => o.key), ['afx/seventhSeal/print8/0']);
  eight.ops.length = 0;
  eight.painter.drawMarks(eight.ctx, [strike], eight.view, false);
  assert.deepEqual(eight.stamps('afx/').map((o) => o.key.split('/')[2]), ['seal8'], 'no seventh seal print or ring of its own');
  const dim = recorder('full', false, 0.5);
  dim.painter.drawMarks(dim.ctx, [strike], dim.view, false);
  assert.equal(dim.stamps('afx/seventhSeal/seal8')[0].alpha, 0.5, 'the big seal\'s flash halves under reduced flash');
});
