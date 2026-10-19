import assert from 'node:assert/strict';
import test from 'node:test';
import { ATLAS_MANIFEST } from './assets/atlasManifest.generated.ts';
import type { AtlasManifest, SpriteAtlas } from './assets/spriteAtlas.ts';
import { ARSENAL_FX_PACK } from './assets/slots.ts';
import { jit } from './skillVfx.ts';
import { makeViewport } from './viewport.ts';
import type { SkillMark } from '../engine/worldTypes.ts';
import {
  ArsenalFxPainter, LODS, bandCoreArcs, bandGeo, bandHead, bladeGeo, clearStart, coreArc, cometGeo, crescentPts, fadeA, flightFrame, gapList, grownR, jagGeo,
  layout, linksGeo, lobPath, partFrame, punchM, raggedEdge, ropeGeo, rippleCoreArc, sagCurves, splashGeo, splashKeep, spikeTips, streakList, sweepAngle, taperRatio,
  twistGeo, type ArsenalFxSpec,
} from './arsenalFx.ts';

const manifest = ATLAS_MANIFEST as unknown as AtlasManifest;
const data = manifest.arsenalFx!;
const S = data.spec as unknown as ArsenalFxSpec;
const RAD = Math.PI / 180;
const r = (value: number, places = 2) => Math.round(value * 10 ** places) / 10 ** places + 0;
const pt = (p: readonly number[]) => [r(p[0]), r(p[1])];
type Opts = { radius?: number; inner?: number; length?: number; width?: number; seed?: number; p?: number; t?: number; awakened?: boolean; reduced?: boolean; lod?: string; points?: { x: number; y: number; r?: number }[] };

/** The kit's paths() (API §8.3), composed from the ported shapes the painter draws with. */
function paths(id: string, o: Opts) {
  const R = o.radius ?? 0, seed = o.seed ?? 1, aw = !!o.awakened, reduced = !!o.reduced, life = S.life[id].mark, age = (o.p ?? 0.35) * life, t = o.t ?? 0.2;
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

test('K10: the bake carries the kit SPEC, the drawn weapons, every part rule, and all 173 stamps of the 22 groups in one page, with no Korean text', () => {
  const pack = manifest.packs[ARSENAL_FX_PACK];
  assert.ok(pack, 'the weapon field effects have their own pack');
  assert.equal(pack.pages.length, 1, 'one atlas page');
  assert.ok(pack.pages.every((page) => page.startsWith('assets/packs/')), 'outside the initial download');
  assert.equal(Object.keys(data.parts).length, 22);
  let stamps = 0;
  for (const [group, rules] of Object.entries(data.parts)) {
    assert.ok(data.meta[group]?.done.fx, `${group}'s field effect is done`);
    const animation = manifest.animations[`afx/${group}`];
    for (const [part, rule] of Object.entries(rules)) {
      assert.equal(animation?.[part]?.frames, rule.frames, `afx/${group}/${part} is animated`);
      assert.equal(animation[part].fps > 0, rule.drive === 'loop', `${group}/${part} runs on the clock only when it loops`);
      if (rule.drive === 'prog') assert.ok(rule.seconds !== null || ['beam', 'chain'].includes(rule.window), `${group}/${part}: a prog part has its seconds or the data's window`);
      for (let frame = 0; frame < rule.frames; frame += 1) assert.ok(pack.frames[`afx/${group}/${part}/${frame}`], `afx/${group}/${part}/${frame} is baked`);
      stamps += rule.frames;
    }
  }
  assert.equal(stamps, 173);
  assert.equal(Object.keys(pack.frames).length, 173);
  assert.deepEqual(Object.entries(data.meta).filter(([, m]) => m.done.lob).map(([id]) => id), ['inkPots', 'clusterPots', 'tarJar', 'meteorBrush']);
  assert.match(data.version, /^1\.0-d2/);
  assert.doesNotMatch(JSON.stringify(data), /[가-힣]/);
});

test('K10: the layout and shape ports give the kit C9 vectors (every drawn case of the brief, review 1\'s three, awakened, LOD, and reduced motion)', () => {
  const { cases } = data.vectors;
  assert.ok(cases.length >= 40, 'the cases the kit has drawn');
  for (const [id, stage, raw, items, shapes] of cases) {
    const o = raw as Opts, life = S.life[id].mark;
    const got = layout(S, id, stage, { R: o.radius ?? 0, L: o.length ?? 0, w: o.width ?? 0, aw: !!o.awakened, seed: o.seed ?? 1, age: (o.p ?? 0.35) * life, life, reduced: !!o.reduced, points: o.points });
    const label = `${id}/${stage} ${JSON.stringify(raw).slice(0, 60)}`;
    assert.deepEqual(got.map((q) => [q.part, r(q.x), r(q.y), r(q.angle, 3), q.flip ? 1 : 0, r(q.phase, 3), q.prio, q.z]), items, `${label} layout`);
    assert.deepEqual(paths(id, o), shapes, `${label} paths`);
  }
  const kinds = new Set(cases.map(([id]) => data.meta[id].kind));
  assert.deepEqual([...kinds].sort(), ['beam', 'chain', 'halo', 'lob', 'nova', 'strike']);
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
  assert.ok(!painter.handles(mark('eclipseHalo', 0, 0.3, { heavy: true })));
  assert.ok(!painter.handles(mark('boneMortar', 0, 0.3)));
  assert.ok(!painter.handles(mark('tailGuard', 0, 0.3)));
  assert.ok(painter.handles(mark('eclipseHalo', 0, 0.3)));
  // A mark lasts through its decal: the seal's ring 0.36 s, its print 1.2 s.
  assert.equal(painter.markSeconds('seventhSeal'), 1.2);
  assert.equal(painter.markSeconds('thunderclap'), 0.3);
  assert.equal(painter.markSeconds('boneMortar'), undefined);
  const line = { id: 1, x1: 0, y1: 0, x2: 100, y2: 0, width: 12, life: 0.2, maxLife: 0.28, owner: 'player' as const };
  assert.ok(painter.handlesLine({ ...line, skillId: 'inkLance' }));
  assert.ok(!painter.handlesLine({ ...line, skillId: 'inkLance', echo: true }), 'a fork keeps the gimmick\'s drawing');
  assert.ok(!painter.handlesLine({ ...line, skillId: 'railSpear' }));
  assert.ok(!painter.handlesLine({ ...line, skillId: 'trackingSeals' }));
  assert.ok(painter.handlesLine({ id: 2, points: [{ x: 0, y: 0 }, { x: 90, y: 0 }], life: 0.1, maxLife: 0.18, skillId: 'frostChainlet' }));
  assert.ok(!painter.handlesLine({ id: 2, points: [{ x: 0, y: 0 }, { x: 90, y: 0 }], life: 0.1, maxLife: 0.18, skillId: 'frostChainlet', echo: true }));
});

test('K10: caps — decals 16/8/0 newest first, the ring and object of every blast always, and the splash of 12/8/3 blasts', () => {
  const marks = Array.from({ length: 20 }, (_, i) => mark('inkPots', 0.02, 1.2, { x: i * 10, seed: i + 1 }));
  LODS.forEach((detail, li) => {
    const { ctx, atlas, drawn, calls, view } = scene();
    const painter = new ArsenalFxPainter();
    painter.begin(atlas, 1, false, 1, detail, {});
    painter.drawDecals(ctx, marks, view);
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
