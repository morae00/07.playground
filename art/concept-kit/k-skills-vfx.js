// k-skills-vfx.js — 흑백 타격 생존전 먹극화 · PAPER NOIR INK — skill VFX, 17 skills + awakened variants → window.PN.skillVfx
// Work order K4: docs/art/briefs/skill-vfx.md. API: art/concept-kit/API-skills-vfx.md.
// Three forms: (1) stamps baked into the common pack as skill/<group>/<part>/<frame> (stamp()), (2) parametric shapes the
// renderer draws on the canvas from the numbers in SPEC (draw() paints the same rules as reference/golden art), (3) the
// mirror clone frames: the hero sprite turned into an ink.300 line copy by an SVG filter (needs k-hero.js loaded first).
// Units are world units (1440x900 at zoom 1.0, 1x px). Deterministic: no Math.random/Date; jitter comes from jit()/PN.rng.
// Every call returns one <g class="ksv ksv-<id>"> with its own <defs>; ids are 'ksv<N>_' per call.
window.PN = window.PN || {};
(function (PN) {
  'use strict';
  // ==== 1. tokens & helpers ====
  const K = Object.freeze({
    ink: '#121110', ink700: '#2B2926', ink500: '#46423D', ink300: '#8C8579', ink100: '#BCB4A5',
    p50: '#FAF6EC', paper: '#F3EEE2', p300: '#D8D0C0', ally: '#00A8C6', allyD: '#007C94', allyG: '#CFF6FF'
  });
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  let UID = 0;
  const f = (n) => Math.round(n * 100) / 100;
  const P2 = (p) => f(p[0]) + ',' + f(p[1]);
  const line = (a, close) => 'M' + a.map(P2).join(' L') + (close ? ' Z' : '');
  const colour = (t) => K[t] || t;
  /** Jitter 0..1 (SPEC.jit): the same hash as worldRenderer, so the renderer can reproduce it. */
  const jit = (seed, i) => ((Math.imul(seed * 31 + i, 2654435761) >>> 0) % 1000) / 1000;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const polar = (r, a, cx, cy) => [(cx || 0) + Math.cos(a) * r, (cy || 0) + Math.sin(a) * r];
  const op = (a) => (a != null && a < 0.999 ? ` opacity="${f(Math.max(0, a))}"` : '');
  const tr = (x, y, deg, s) => `translate(${f(x)} ${f(y)})` + (deg ? ` rotate(${f(deg)})` : '') + (s && s !== 1 ? ` scale(${f(s)})` : '');
  const G = (t, body, a) => `<g transform="${t}"${op(a)}>${body}</g>`;
  const GA = (body, a) => (a != null && a < 0.999 ? `<g${op(a)}>${body}</g>` : body);

  // per-call context: unique ids + defs
  function Ctx() {
    const id = 'ksv' + (++UID) + '_';
    const defs = [];
    let n = 0;
    return {
      id, defs,
      uid: (tag) => id + (tag || 'u') + (n++),
      out: (body, cls) => `<g class="ksv ksv-${cls}"><defs>${defs.join('')}</defs>${body}</g>`
    };
  }

  // stroked path. o: {cap, join, miter, dash, off, a}
  function S(d, t, w, o) {
    o = o || {};
    let s = `<path d="${d}" fill="none" stroke="${colour(t)}" stroke-width="${f(w)}" stroke-linecap="${o.cap || 'round'}" stroke-linejoin="${o.join || 'round'}"`;
    if (o.miter) s += ` stroke-miterlimit="${o.miter}"`;
    if (o.dash) s += ` stroke-dasharray="${o.dash.map(f).join(' ')}"`;
    if (o.off) s += ` stroke-dashoffset="${f(o.off)}"`;
    return s + op(o.a) + '/>';
  }
  /** Sandwich stroke: layers [[token, width], ...] from the bottom up (bible §5.3). */
  const SW = (d, layers, o) => layers.map((l) => S(d, l[0], l[1], o)).join('');
  /** Dashed sandwich, butt ends: the bottom (ink) layer runs `pad` past both ends of every dash above it. */
  function SWD(d, layers, dash, pad, o) {
    o = o || {};
    return layers.map((l, i) => (i === 0 && pad
      ? S(d, l[0], l[1], Object.assign({}, o, { cap: 'butt', dash: [dash[0] + 2 * pad, Math.max(0.05, dash[1] - 2 * pad)], off: pad }))
      : S(d, l[0], l[1], Object.assign({}, o, { cap: 'butt', dash })))).join('');
  }
  // filled path. o: {st, sw, rule, a}
  function F(d, t, o) {
    o = o || {};
    let s = `<path d="${d}" fill="${colour(t)}"`;
    if (o.rule) s += ` fill-rule="${o.rule}"`;
    if (o.st) s += ` stroke="${colour(o.st)}" stroke-width="${f(o.sw || 1)}" stroke-linejoin="round"`;
    return s + op(o.a) + '/>';
  }
  function Cir(x, y, r, t, o) {
    o = o || {};
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${t === 'none' ? 'none' : colour(t)}"` +
      (o.st ? ` stroke="${colour(o.st)}" stroke-width="${f(o.sw || 1)}"` : '') + op(o.a) + '/>';
  }
  /** Circle path from angle a0 (rad), clockwise on screen, as two arcs: dash patterns start at a0. */
  function circ(r, a0, cx, cy) {
    a0 = a0 == null ? -Math.PI / 2 : a0;
    const A = polar(r, a0, cx, cy), B = polar(r, a0 + Math.PI, cx, cy);
    return `M${P2(A)} A${f(r)},${f(r)} 0 1 1 ${P2(B)} A${f(r)},${f(r)} 0 1 1 ${P2(A)}`;
  }
  /** Arc from a0 sweeping `sw` rad clockwise. */
  function arc(r, a0, sw, cx, cy) {
    if (sw >= TAU - 1e-4) return circ(r, a0, cx, cy);
    const n = sw > Math.PI ? 2 : 1;
    let d = `M${P2(polar(r, a0, cx, cy))}`;
    for (let i = 1; i <= n; i++) d += ` A${f(r)},${f(r)} 0 0 1 ${P2(polar(r, a0 + sw * i / n, cx, cy))}`;
    return d;
  }
  /** Ellipse path from angle a0, clockwise. */
  function ellD(rx, ry, cx, cy, a0) {
    a0 = a0 == null ? -Math.PI / 2 : a0; cx = cx || 0; cy = cy || 0;
    const A = [cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry], B = [cx - Math.cos(a0) * rx, cy - Math.sin(a0) * ry];
    return `M${P2(A)} A${f(rx)},${f(ry)} 0 1 1 ${P2(B)} A${f(rx)},${f(ry)} 0 1 1 ${P2(A)}`;
  }
  /** Elliptical arc from angle a0 sweeping `sw` rad clockwise (sw < 2π). */
  function ellArc(rx, ry, cx, cy, a0, sw) {
    const p = (a) => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
    return `M${P2(p(a0))} A${f(rx)},${f(ry)} 0 ${sw > Math.PI ? 1 : 0} 1 ${P2(p(a0 + sw))}`;
  }
  /** Catmull-Rom spline through points as cubic Béziers. */
  function smooth(pts, closed) {
    const n = pts.length;
    if (n < 3) return line(pts, closed);
    const g = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
    let d = `M${P2(pts[0])}`;
    const m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      d += ` C${P2([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${P2([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${P2(p2)}`;
    }
    return d + (closed ? ' Z' : '');
  }
  /** Points of fn(t) for t = 0..1 in n steps. */
  const samp = (fn, n) => { const o = []; for (let i = 0; i <= n; i++) o.push(fn(i / n)); return o; };
  /** Filled brush stroke along a polyline; wf(t) = full width at t (0..1 by length). */
  function brushD(pts, wf) {
    const n = pts.length, acc = [0];
    for (let i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = acc[n - 1] || 1, Lf = [], Rt = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      const w = Math.max(0.08, wf(acc[i] / tot)) / 2;
      Lf.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); Rt.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    return line(Lf.concat(Rt.reverse()), true);
  }
  /** Irregular n-point star (bible: sparkles have 5-7 points of uneven length, never 4). */
  function starD(cx, cy, r, n, seed, a0, inner) {
    const p = [];
    a0 = a0 == null ? -Math.PI / 2 : a0; inner = inner || 0.36;
    for (let i = 0; i < 2 * n; i++) {
      const a = a0 + i * Math.PI / n + (jit(seed, i + 40) - 0.5) * 0.32;
      const rr = i % 2 ? r * inner * (0.85 + 0.3 * jit(seed, i + 80)) : r * (0.56 + 0.44 * jit(seed, i));
      p.push(polar(rr, a, cx, cy));
    }
    return line(p, true);
  }

  // ==== 2. data ====
  const IDS = ['needleStorm', 'fanKnives', 'chainSpark', 'frostLine', 'orbitScythes', 'boneMortar', 'railSpear', 'mirrorClone', 'voidMine', 'blackSun', 'ironFrame', 'magnetSigil', 'paperWard', 'recoveryThread', 'coinFever', 'eclipseStep', 'executionMark'];
  const GROUPS = IDS.concat(['common']);

  /** Copy of the work order §2 (hit numbers; the only source is the game: skillNumbers.ts, GameEngine.ts). */
  const SIZES = {
    needleStorm: { shape: 'circle', r: 4.5, count: [1, 1, 2, 2, 3], countAwakened: 5, spread: 0.18, spreadAwakened: 0.34, speed: 760, life: 1.15, reach: 874, pierceAwakened: 1, shardRange: 220 },
    fanKnives: { shape: 'circle', r: 5.2, count: [4, 5, 6, 7, 8], countAwakened: 11, spread: 0.22, speed: 680, life: 0.82, reach: 558, lifeAwakened: 1.35, returnAt: 0.675, returnReach: 459, returnSpeed: 720, pierceAwakened: 2 },
    chainSpark: { shape: 'none', count: [3, 4, 5, 6, 7], countAwakened: 9, firstRange: 780, jumpRange: 330, life: 0.18, burstR: 78, stun: 0.45 },
    frostLine: { shape: 'capsule', width: [15, 18, 21, 24, 27], widthAwakened: 35, length: 980, life: 0.28, slow: [0.32, 0.6], slowSeconds: 1.25, rootSeconds: 0.26 },
    railSpear: { shape: 'capsule', width: [21, 24, 27, 30, 33], widthAwakened: 45, length: 1500, life: 0.22, fissureR: 58, copyOffset: 42 },
    orbitScythes: { shape: 'circle', r: 17, blades: [2, 3, 4, 5, 6], radius: [82, 92, 102, 112, 122], outerBlades: 3, outerRadiusAdd: 52, outerRadius: 174, speed: 3.2, outerSpeed: -2.6, hitInterval: 0.22 },
    boneMortar: { shape: 'circle', radius: [98, 110, 122, 134, 146], radiusAwakened: 180, warn: 0.48, aftershock: 0.55, aftershockR: 99 },
    mirrorClone: { shape: 'circle', offset: 42, r: 5.5, pierce: [1, 2, 2, 3, 3], pierceAwakened: 4, flankShots: 2, aimedAwakened: 2, speed: 820, life: 1.15, reach: 943, tether: 0.16 },
    voidMine: { shape: 'circle', radius: [103, 114, 125, 136, 147], radiusAwakened: 177, duration: [2.65, 2.9, 3.15, 3.4, 3.65], durationAwakened: 4.55, tick: 0.35, collapseAdd: 30, collapseR: 207 },
    blackSun: { shape: 'circle', radius: [130, 144, 158, 172, 186], radiusAwakened: 228, duration: [3.55, 3.9, 4.25, 4.6, 4.95], durationAwakened: 6.15, collapseAdd: 30, collapseR: 258, slowSeconds: 3.5 },
    eclipseStep: { shape: 'circle', radius: [144, 160, 176, 192, 208], radiusAwakened: 263, invuln: [0.33, 0.38, 0.43, 0.48, 0.53], rays: [6, 7, 8, 9, 10], rayFrom: 22, rayWidth: [11, 12, 13, 14, 15], rayLife: 0.2, afterimage: 0.82, afterimageR: 216, afterimageDelay: 0.24 },
    ironFrame: { shape: 'none', shield: 0.36 },
    magnetSigil: { shape: 'none', pulseEvery: 4.8 },
    paperWard: { shape: 'none', invuln: [0.22, 0.26, 0.3, 0.34, 0.38], pushR: 140 },
    recoveryThread: { shape: 'none', every: 2.2, shots: 8, r: 5, speed: 620, life: 0.45, reach: 279 },
    coinFever: { shape: 'none', frenzy: 2.4, attackSpeed: 1.3 },
    executionMark: { shape: 'none', bossBonus: 0.45 }
  };

  /** Parametric shapes the renderer draws with the canvas (work order §1.5). Token names and numbers only. */
  const SPEC = {
    stitch: { layers: [['ink', 5], ['ally', 2.8], ['allyG', 0.8]], dash: [4.5, 7.5], cap: 'round', fit: 1, start: -90, dir: 'cw' },
    guide: { layers: [['allyD', 1.2]], alpha: 0.55 },
    fill: { token: 'p50', alpha: 0.25 },
    dots: { token: 'ally', r: 1.5, pitch: 6, angle: 45, alphaWarn: 0.6, alphaVortex: 1, band: [34, 0.25] },
    thread: { layers: [['ink', 4], ['ally', 2.2], ['allyG', 0.7]], seconds: 0.24, fade: 0.6 },
    threadHeavy: { layers: [['ink', 5], ['ally', 2.8], ['allyG', 0.8]], seconds: 0.24, fade: 0.6 },
    band: { frostLine: { edge: [['ink', 1.2]], inner: ['p50', 0.8, 1.4] }, railSpear: { edge: [['ink', 1.4]] } },
    chalk: { edge: [3.5, 2], step: 12, fill: 'p50', line: ['ink', 0.8], core: ['ally', 2.2], grow: 0.25, dust: { every: 14, r: [0.8, 1.6], fill: 'p50', line: ['ink', 0.4], inset: 3 } },
    spear: { fill: 'ink', half: [6, 4], grain: ['p50', 0.9, -3], core: [['ally', 2.4], ['allyG', 0.8]], head: 18, headHalf: 6.5, grow: 0.25, fade: { token: 'ink', width: 3, dash: [6, 4] } },
    spearCopy: { offset: 42, edge: ['ink300', 1.2], edgeDash: [5, 3], shaft: { fill: 'p50', alpha: 0.5, line: ['ink300', 0.9] }, core: [['ink', 2.6], ['ally', 1.6]], coreDash: [6, 4], pad: 0.6 },
    bolt: { layers: [['ink', 6], ['ally', 3], ['p50', 1.2]], awakened: [['ink', 7], ['ally', 3.6], ['p50', 1.4]], join: 'miter', miter: 10, cap: 'round', seg: 30, push: [3, 3], seeds: [11, 12], start: 0.28, end: 0.35, fade: { token: 'ink', dash: [6, 4] } },
    tether: { layers: [['ink', 3], ['ally', 1.6]], dash: [6, 4], pad: 0.6, sag: 0.06 },
    swirl: {
      voidMine: { arms: 3, r: [0.16, 0.88], wind: 200, width: [0.09, 0.015], token: 'ink', alpha: 0.5, speed: 0.6, turn: 'cw' },
      blackSun: { arms: 4, r: [0.16, 0.88], wind: 190, width: [0.1, 0.02], token: 'ink', alpha: 0.55, speed: 0.45, turn: 'cw' }
    },
    unravel: { seconds: 0.3, gap: [1, 2], alpha: [1, 0] },
    slashRing: { band: ['p50', 5], edge: ['ink', 1.2], outer: { at: 4.4, layers: [['ink', 3], ['ally', 1.6]] }, seconds: 0.2 },
    wardRing: { band: ['p50', 4], jag: [10, 2], edge: ['ink', 1.2], outer: { at: 4.6, layers: [['ink', 2.6], ['ally', 1.6]], dash: [6, 4], pad: 0.6 }, seconds: 0.24, plates: { count: 6, from: 20, to: 140, seconds: 0.2, angleJitter: 10, toMin: 126, seed: 9 } },
    pulse: { rings: [['allyD', 1.2], ['allyG', 0.5]], r: [24, 150], seconds: 0.45, ease: 2, alpha: [0.6, 0], delay: 0.08, reducedR: 60 },
    orbitTrail: { arc: 0.35, layers: [['p50', 1], ['ally', 0.8]], alpha: [0.6, 0] },
    aura: { stitchR: 35, seconds: 0.3, centerY: -32, layer: 'ally' },
    blastDust: { every: 40, jitter: 0.35, skip: 0.25, spike: 0.33, seed: 5, reach: 7 },
    jit: { mul: 31, hash: 2654435761, mod: 1000 }
  };

  const META = {
    needleStorm: { name: '먹선 바늘', kind: 'active', shape: 'projectile', stages: { normal: ['start', 'travel', 'end'], awakened: ['start', 'travel', 'end', 'shard'] }, main: 'travel', cell: [184, 196], origin: [28, 98] },
    fanKnives: { name: '부채 단검', kind: 'active', shape: 'projectile', stages: { normal: ['start', 'travel', 'end'], awakened: ['start', 'travel', 'return', 'end'] }, main: 'travel', cell: [160, 268], origin: [14, 134] },
    chainSpark: { name: '백색 연쇄', kind: 'active', shape: 'chain', stages: { normal: ['start', 'hold', 'end'], awakened: ['start', 'hold', 'end', 'burst'] }, main: 'hold', cell: [904, 172], origin: [10, 118] },
    frostLine: { name: '백묵 절단', kind: 'active', shape: 'beam', stages: { normal: ['start', 'hold', 'end', 'chill'], awakened: ['start', 'hold', 'end', 'root'] }, main: 'hold', cell: [728, 92], origin: [44, 46] },
    railSpear: { name: '흑선 레일', kind: 'active', shape: 'beam', stages: { normal: ['start', 'hold', 'end'], awakened: ['start', 'hold', 'end', 'fissure'] }, main: 'hold', cell: [744, 136], origin: [52, 68] },
    orbitScythes: { name: '초승 궤도', kind: 'active', shape: 'orbit', stages: { normal: ['hold'], awakened: ['hold'] }, main: 'hold', cell: [396, 396], origin: [198, 198] },
    boneMortar: { name: '골분 박격', kind: 'active', shape: 'zone', stages: { normal: ['warn', 'blast'], awakened: ['warn', 'blast'] }, main: 'warn', cell: [408, 408], origin: [204, 204] },
    mirrorClone: { name: '거울 분신', kind: 'active', shape: 'clone', stages: { normal: ['volley', 'travel'], awakened: ['volley', 'travel'] }, main: 'travel', cell: [196, 176], origin: [52, 120] },
    voidMine: { name: '무음 지뢰', kind: 'active', shape: 'zone', stages: { normal: ['start', 'hold', 'end'], awakened: ['start', 'hold', 'collapse'] }, main: 'hold', cell: [436, 436], origin: [218, 218] },
    blackSun: { name: '검은 태양', kind: 'active', shape: 'zone', stages: { normal: ['start', 'hold', 'end'], awakened: ['start', 'hold', 'collapse'] }, main: 'hold', cell: [536, 536], origin: [268, 268] },
    eclipseStep: { name: '일식 보법', kind: 'active', shape: 'ring', stages: { normal: ['slash'], awakened: ['slash', 'afterimage'] }, main: 'slash', cell: [556, 556], origin: [278, 278] },
    ironFrame: { name: '철골 프레임', kind: 'passive', shape: 'aura', stages: { normal: ['pop', 'aura'], awakened: ['pop', 'shield'] }, main: 'shield', cell: [88, 128], origin: [44, 114] },
    magnetSigil: { name: '수거 자석', kind: 'passive', shape: 'pulse', stages: { normal: ['pop', 'aura'], awakened: ['pop', 'pulse'] }, main: 'pulse', cell: [324, 324], origin: [162, 162] },
    paperWard: { name: '종이 갑주', kind: 'passive', shape: 'aura', stages: { normal: ['pop', 'plates'], awakened: ['pop', 'plates', 'ward'] }, main: 'ward', cell: [312, 312], origin: [156, 156] },
    recoveryThread: { name: '회복 실', kind: 'passive', shape: 'aura', stages: { normal: ['pop', 'aura'], awakened: ['pop', 'volley'] }, main: 'volley', cell: [180, 184], origin: [90, 108] },
    coinFever: { name: '동전 열병', kind: 'passive', shape: 'aura', stages: { normal: ['pop', 'glint'], awakened: ['pop', 'glint', 'frenzy'] }, main: 'frenzy', cell: [100, 124], origin: [50, 110] },
    executionMark: { name: '집행 표식', kind: 'passive', shape: 'mark', stages: { normal: ['pop', 'mark'], awakened: ['pop', 'mark', 'markBoss'] }, main: 'mark', cell: [116, 116], origin: [26, 106] }
  };
  /** A stage that is not in the asked list draws its nearest counterpart (work order §1.3). */
  const STAGE_TWIN = { shard: 'end', return: 'travel', burst: 'end', root: 'chill', chill: 'root', fissure: 'end', collapse: 'end', end: 'collapse', afterimage: 'slash', shield: 'aura', aura: 'shield', pulse: 'aura', ward: 'plates', volley: 'aura', frenzy: 'glint', markBoss: 'mark' };
  // aura → volley/pulse for the passives whose awakened list has no aura
  const AURA_TWIN = { magnetSigil: 'pulse', recoveryThread: 'volley', ironFrame: 'shield' };

  // ---- baked parts (work order §3 tables): [part, frames, drive, fps, window, box, anchor, rotate, layer, lod] ----
  const CHILL_R = [12, 19, 28, 38, 54];
  const chillBox = (r) => [2 * r + 12, 2 * Math.ceil(0.42 * r + 3) + 6];
  const POP = (aw) => ['pop' + (aw ? '-awakened' : ''), 1, 'idx', 0, '획득·레벨업·각성 때 한 번(같은 패시브 1.5초에 1번)', [36, 38], [18, 35], 'none', 'ally', 'info'];
  const PARTS_RAW = {
    needleStorm: [
      ['start', 2, 'prog', 0, '나이 0~0.06초', [64, 20], [46, 10], 'vel', 'ally', 'info'],
      ['travel', 2, 'loop', 12, '비행 중', [64, 20], [46, 10], 'vel', 'ally', 'info'],
      ['end', 2, 'prog', 0, '남은 수명 0.10→0초', [64, 20], [46, 10], 'vel', 'ally', 'info'],
      ['start-awakened', 2, 'prog', 0, '나이 0~0.06초', [64, 24], [46, 12], 'vel', 'ally', 'info'],
      ['travel-awakened', 2, 'loop', 12, '비행 중', [64, 24], [46, 12], 'vel', 'ally', 'info'],
      ['end-awakened', 2, 'prog', 0, '남은 수명 0.10→0초', [64, 24], [46, 12], 'vel', 'ally', 'info'],
      ['shard-awakened', 2, 'prog', 0, '파편 0~0.12초(맞은 적 → 파편 대상)', [48, 14], [4, 7], 'beam', 'ally', 'deco']
    ],
    fanKnives: [
      ['start', 2, 'prog', 0, '나이 0~0.06초', [44, 16], [28, 8], 'vel', 'ally', 'info'],
      ['travel', 2, 'loop', 12, '비행 중', [44, 16], [28, 8], 'vel', 'ally', 'info'],
      ['end', 2, 'prog', 0, '남은 수명 0.10→0초', [44, 16], [28, 8], 'vel', 'ally', 'info'],
      ['start-awakened', 2, 'prog', 0, '나이 0~0.06초', [44, 16], [28, 8], 'vel', 'ally', 'info'],
      ['travel-awakened', 2, 'loop', 12, '비행 중(나이 0.675초까지)', [44, 16], [28, 8], 'vel', 'ally', 'info'],
      ['end-awakened', 2, 'prog', 0, '남은 수명 0.10→0초', [44, 16], [28, 8], 'vel', 'ally', 'info'],
      ['return-awakened', 2, 'loop', 12, '귀환 중(나이 0.675초부터, +x = 주인공 쪽)', [44, 16], [28, 8], 'vel', 'ally', 'info']
    ],
    chainSpark: [
      ['burst-awakened', 3, 'prog', 0, '연쇄 폭발 0~0.24초', [64, 64], [32, 32], 'none', 'ally', 'deco']
    ],
    frostLine: [
      ['origin', 2, 'prog', 0, '빔 수명 0.28초', [48, 48], [24, 24], 'beam', 'ally', 'deco'],
      ['origin-awakened', 2, 'prog', 0, '빔 수명 0.28초', [48, 48], [24, 24], 'beam', 'ally', 'deco']
    ].concat(CHILL_R.map((r) => ['chill' + r, 1, 'idx', 0, '적 반지름 ' + r + '(감속 중)', chillBox(r), chillBox(r).map((v) => v / 2), 'none', 'ground', 'deco']))
      .concat(CHILL_R.map((r) => ['root' + r + '-awakened', 1, 'idx', 0, '적 반지름 ' + r + '(속박 중)', chillBox(r), chillBox(r).map((v) => v / 2), 'none', 'ground', 'info'])),
    railSpear: [
      ['origin', 2, 'prog', 0, '빔 수명 0.22초', [64, 64], [32, 32], 'beam', 'ally', 'deco'],
      ['origin-awakened', 2, 'prog', 0, '빔 수명 0.22초', [64, 64], [32, 32], 'beam', 'ally', 'deco'],
      ['flash', 1, 'prog', 0, '처음 0.08초', [64, 64], [32, 32], 'beam', 'ally', 'deco'],
      ['flash-awakened', 1, 'prog', 0, '처음 0.08초', [64, 64], [32, 32], 'beam', 'ally', 'deco'],
      ['fissure-awakened', 3, 'prog', 0, '균열 0~0.24초', [72, 72], [36, 36], 'none', 'ground', 'deco']
    ],
    orbitScythes: [
      ['blade', 2, 'loop', 8, '상시', [44, 44], [22, 22], 'radial', 'ally', 'info'],
      ['blade-outer-awakened', 2, 'loop', 8, '상시(역회전 바깥 날)', [44, 44], [22, 22], 'radial', 'ally', 'info']
    ],
    boneMortar: [
      ['shell', 4, 'prog', 0, '착탄 예고 수명 0.48초', [40, 176], [20, 166], 'none', 'ally', 'deco'],
      ['shell-awakened', 4, 'prog', 0, '착탄 예고 수명 0.48초', [40, 176], [20, 166], 'none', 'ally', 'deco'],
      ['blast', 3, 'prog', 0, 'area/blast부터 0.24초', [96, 96], [48, 48], 'none', 'ally', 'deco'],
      ['blast-awakened', 3, 'prog', 0, 'area/blast부터 0.24초', [96, 96], [48, 48], 'none', 'ally', 'deco'],
      ['dust', 2, 'idx', 0, '변형 번호(고리 둘레 40마다)', [24, 16], [12, 8], 'radial', 'ally', 'deco']
    ],
    mirrorClone: [
      // box 112x100, anchor (56,79): 4 taller than the order's 112x96 / (56,75) because the hero kit's run frames 2 and 6
      // reach 74.3 above the feet; the feet keep 21 below them as in the order
      ['clone-idle', 6, 'idx', 0, '주인공 idle 프레임 번호', [112, 100], [56, 79], 'face', 'body', 'info'],
      ['clone-run', 8, 'idx', 0, '주인공 run 프레임 번호', [112, 100], [56, 79], 'face', 'body', 'info'],
      ['clone-throw', 4, 'idx', 0, '주인공 throw 프레임 번호', [112, 100], [56, 79], 'face', 'body', 'info'],
      ['clone-hurt', 3, 'idx', 0, '주인공 hurt 프레임 번호', [112, 100], [56, 79], 'face', 'body', 'info'],
      ['shot-start', 2, 'prog', 0, '나이 0~0.06초', [52, 16], [38, 8], 'vel', 'ally', 'info'],
      ['shot-travel', 2, 'loop', 12, '비행 중', [52, 16], [38, 8], 'vel', 'ally', 'info'],
      ['shot-end', 2, 'prog', 0, '남은 수명 0.10→0초', [52, 16], [38, 8], 'vel', 'ally', 'info'],
      ['shot-start-awakened', 2, 'prog', 0, '나이 0~0.06초(조준 사격)', [52, 16], [38, 8], 'vel', 'ally', 'info'],
      ['shot-travel-awakened', 2, 'loop', 12, '비행 중(조준 사격)', [52, 16], [38, 8], 'vel', 'ally', 'info'],
      ['shot-end-awakened', 2, 'prog', 0, '남은 수명 0.10→0초(조준 사격)', [52, 16], [38, 8], 'vel', 'ally', 'info']
    ],
    voidMine: [
      ['core-start', 3, 'prog', 0, '생성 0~0.2초', [64, 48], [32, 24], 'none', 'ground', 'info'],
      ['core-hold', 2, 'loop', 6, '지속 중', [64, 48], [32, 24], 'none', 'ground', 'info'],
      ['core-end', 3, 'prog', 0, '마지막 0.3초', [64, 48], [32, 24], 'none', 'ground', 'info'],
      ['core-start-awakened', 3, 'prog', 0, '생성 0~0.2초', [64, 48], [32, 24], 'none', 'ground', 'info'],
      ['core-hold-awakened', 2, 'loop', 6, '지속 중', [64, 48], [32, 24], 'none', 'ground', 'info'],
      ['collapse-awakened', 3, 'prog', 0, 'vortex/collapse부터 0.3초', [96, 96], [48, 48], 'none', 'ally', 'info']
    ],
    blackSun: [
      ['core-start', 3, 'prog', 0, '생성 0~0.2초', [96, 96], [48, 48], 'none', 'ground', 'info'],
      ['core-hold', 2, 'loop', 6, '지속 중', [96, 96], [48, 48], 'none', 'ground', 'info'],
      ['core-end', 3, 'prog', 0, '마지막 0.3초', [96, 96], [48, 48], 'none', 'ground', 'info'],
      ['core-start-awakened', 3, 'prog', 0, '생성 0~0.2초', [112, 112], [56, 56], 'none', 'ground', 'info'],
      ['core-hold-awakened', 2, 'loop', 6, '지속 중', [112, 112], [56, 56], 'none', 'ground', 'info'],
      ['collapse-awakened', 3, 'prog', 0, 'vortex/collapse부터 0.3초', [120, 120], [60, 60], 'none', 'ally', 'info']
    ],
    eclipseStep: [
      ['slash', 2, 'prog', 0, '광선 수명 0.2초', [128, 24], [124, 12], 'ray', 'ally', 'deco'],
      ['slash-awakened', 2, 'prog', 0, '광선 수명 0.2초', [128, 24], [124, 12], 'ray', 'ally', 'deco'],
      ['feet', 3, 'prog', 0, '무적 시간(레벨별 0.33~0.53초)', [72, 32], [36, 16], 'none', 'ground', 'info'],
      ['feet-awakened', 3, 'prog', 0, '무적 시간 0.53초', [72, 32], [36, 16], 'none', 'ground', 'info']
    ],
    ironFrame: [POP(false), POP(true), ['shield', 3, 'prog', 0, '보호막 0.36초', [72, 100], [36, 88], 'none', 'body', 'info']],
    magnetSigil: [POP(false), POP(true)],
    paperWard: [
      POP(false), POP(true),
      ['plates', 3, 'prog', 0, '피격 무적 시간(0.22~0.38초)', [80, 100], [40, 88], 'none', 'body', 'info'],
      ['plate-awakened', 2, 'idx', 0, '변형 번호(갑편 6장 비행 0.2초)', [20, 14], [10, 7], 'radial', 'ally', 'deco']
    ],
    recoveryThread: [
      POP(false), POP(true),
      ['shot-start-awakened', 2, 'prog', 0, '나이 0~0.06초', [36, 14], [26, 7], 'vel', 'ally', 'info'],
      ['shot-travel-awakened', 2, 'loop', 12, '비행 중', [36, 14], [26, 7], 'vel', 'ally', 'info'],
      ['shot-end-awakened', 2, 'prog', 0, '남은 수명 0.10→0초', [36, 14], [26, 7], 'vel', 'ally', 'info']
    ],
    coinFever: [
      POP(false), POP(true),
      ['glint', 2, 'prog', 0, '엽전 획득 0~0.12초', [24, 24], [12, 12], 'none', 'ally', 'deco'],
      // 검수 1차 고침 6: 84×40 / (42,30) / ground → 96×48 / (48,38) / ally (coins in columns beside the body)
      ['frenzy-awakened', 3, 'loop', 8, '폭주 2.4초 동안', [96, 48], [48, 38], 'none', 'ally', 'info']
    ],
    executionMark: [
      POP(false), POP(true),
      ['mark', 3, 'prog', 0, '치명 적중 0~0.3초', [32, 32], [16, 29], 'none', 'ally', 'info'],
      ['markBoss-awakened', 3, 'prog', 0, '보스 치명 적중 0~0.3초', [44, 44], [22, 41], 'none', 'ally', 'info']
    ],
    common: [
      ['stitchHead', 2, 'loop', 12, '바느질 진행 중', [28, 12], [16, 6], 'tangent', 'ally', 'deco']
    ]
  };
  const PARTS = {};
  Object.keys(PARTS_RAW).forEach((g) => {
    PARTS[g] = PARTS_RAW[g].map((r) => Object.freeze({
      part: r[0], frames: r[1], drive: r[2], fps: r[3], window: r[4], box: r[5].slice(), anchor: r[6].slice(),
      rotate: r[7], layer: r[8], lod: r[9], still: r[2] === 'loop' ? 0 : null, flash: /^flash/.test(r[0])
    }));
  });
  function partOf(group, part) {
    const p = (PARTS[group] || []).find((q) => q.part === part);
    if (!p) throw new Error('skillVfx: unknown part ' + group + '/' + part);
    return p;
  }

  // ==== 3. parametric shapes (SPEC → SVG) ====
  // The renderer redraws these on the canvas from SPEC; the kit draws the same rules for review and golden images.
  /** Stitch dashes scaled so a whole number of stitches fills the circumference (SPEC.stitch.fit). */
  function stitchDash(R, gapScale) {
    const s = SPEC.stitch, d = s.dash[0], g = s.dash[1] * (gapScale || 1), per = d + g;
    const n = Math.max(3, Math.round(TAU * R / per)), k = TAU * R / (n * per);
    return [d * k, g * k];
  }
  /** Ally zone rim: running stitch on the hit circle, sewn clockwise from 12 o'clock up to p (0..1). */
  function stitchRing(R, p, o) {
    o = o || {};
    if (p <= 0.001) return '';
    const d = p >= 0.999 ? circ(R) : arc(R, -Math.PI / 2, TAU * p);
    return GA(SW(d, SPEC.stitch.layers, { dash: stitchDash(R, o.gap) }), o.a);
  }
  /** Where the stitch head sits at progress p, and its tangent angle (clockwise). */
  const stitchHeadAt = (R, p) => { const a = -Math.PI / 2 + TAU * p; return { x: Math.cos(a) * R, y: Math.sin(a) * R, a: a + Math.PI / 2 }; };
  const guideRing = (R, a) => S(circ(R), SPEC.guide.layers[0][0], SPEC.guide.layers[0][1], { a: SPEC.guide.alpha * (a == null ? 1 : a) });
  const zoneFill = (R, a) => F(circ(R), SPEC.fill.token, { a: SPEC.fill.alpha * (a == null ? 1 : a) });
  /** Cyan halftone: 'disc' over the whole circle (mortar warning), 'band' inside the rim only (vortex zones). */
  function zoneDots(c, R, mode, a) {
    const s = SPEC.dots, id = c.uid('dt');
    c.defs.push(`<pattern id="${id}" width="${s.pitch}" height="${s.pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(${s.angle})"><circle cx="${s.pitch / 2}" cy="${s.pitch / 2}" r="${s.r}" fill="${K[s.token]}"/></pattern>`);
    if (mode === 'disc') return `<path d="${circ(R)}" fill="url(#${id})"${op(s.alphaWarn * (a == null ? 1 : a))}/>`;
    const bw = Math.min(s.band[0], s.band[1] * R);
    return `<path d="${circ(R)} ${circ(R - bw)}" fill="url(#${id})" fill-rule="evenodd"${op(s.alphaVortex * (a == null ? 1 : a))}/>`;
  }
  /** Alpha of a closed thread ring t seconds after it appears: full, then the last 60% fades out. The size never changes. */
  function threadAlpha(t) {
    const s = SPEC.thread, u = clamp(t / s.seconds, 0, 1);
    return u <= 1 - s.fade ? 1 : clamp((1 - u) / s.fade, 0, 1);
  }
  const threadRing = (R, a, heavy, cx, cy) => GA(SW(circ(R, null, cx, cy), (heavy ? SPEC.threadHeavy : SPEC.thread).layers), a);

  /** Beam hit band: a capsule from (0,0) to (L,0) of half-width w (= the game's width), edge centrelines on ±w. */
  const capsuleD = (L, w) => `M0,${f(-w)} H${f(L)} A${f(w)},${f(w)} 0 0 1 ${f(L)},${f(w)} H0 A${f(w)},${f(w)} 0 0 1 0,${f(-w)} Z`;
  function beamBand(kind, L, w, a) {
    a = a == null ? 1 : a;
    let s = F(capsuleD(L, w), SPEC.fill.token, { a: SPEC.fill.alpha * a });
    if (kind === 'frostLine') {
      const b = SPEC.band.frostLine;
      s += S(capsuleD(L, w), b.edge[0][0], b.edge[0][1], { a }) + S(capsuleD(L, w - b.inner[2]), b.inner[0], b.inner[1], { a });
    } else {
      const b = SPEC.band.railSpear;
      s += S(capsuleD(L, w), b.edge[0][0], b.edge[0][1], { a });
    }
    return s;
  }
  /** Chalk core: two jagged edges y = ±(3.5 + 2·jit), x step 12, drawn to `grow` of L; cyan line on the axis. */
  function chalkCore(L, seed, grow, a, coreA) {
    const s = SPEC.chalk, Lg = L * clamp(grow, 0, 1);
    if (Lg < 2) return '';
    const top = [], bot = [];
    for (let k = 0, x = 0; ; k++, x += s.step) {
      const xx = Math.min(x, Lg);
      top.push([xx, -(s.edge[0] + s.edge[1] * jit(seed, k))]);
      bot.push([xx, s.edge[0] + s.edge[1] * jit(seed, k + 500)]);
      if (xx >= Lg) break;
    }
    const d = line([[0, 0]].concat(top, [[Lg + 2, 0]], bot.reverse()), true);
    let o = F(d, s.fill, { st: s.line[0], sw: s.line[1], a });
    if (coreA > 0.01) o += S(`M0,0 H${f(Lg)}`, s.core[0], s.core[1], { a: a * coreA });
    return o;
  }
  /** Chalk dust (decoration): one speck per 14 units, inside the band by 3. */
  function chalkDust(L, w, seed, grow, a) {
    const s = SPEC.chalk.dust, Lg = L * clamp(grow, 0, 1);
    let o = '';
    for (let j = 0, x = s.every / 2; x < Lg; j++, x += s.every) {
      const y = (2 * jit(seed, j + 900) - 1) * (w - s.inset), r = lerp(s.r[0], s.r[1], jit(seed, j + 1300));
      o += Cir(x + (jit(seed, j + 1700) - 0.5) * 6, y, r, s.fill, { st: s.line[0], sw: s.line[1] });
    }
    return GA(o, a);
  }
  /** Spear outline: tapered shaft (half 6 → 4) ending in a concave leaf head of 18 (never a triangular arrowhead). */
  function spearD(L) {
    const h = SPEC.spear, xb = L - h.head, q = h.headHalf;
    return `M0,${-h.half[0]} L${f(xb)},${-h.half[1]} C${f(xb + 2)},${-q} ${f(xb + 6)},${-q} ${f(xb + 8)},${f(-q + 0.9)} C${f(xb + 12)},-3.4 ${f(L - 3)},-1 ${f(L)},0 C${f(L - 3)},1 ${f(xb + 12)},3.4 ${f(xb + 8)},${f(q - 0.9)} C${f(xb + 6)},${q} ${f(xb + 2)},${q} ${f(xb)},${h.half[1]} L0,${h.half[0]} Z`;
  }
  /** Black spear: ink shaft and leaf head; cyan core; light-side grain. */
  function spear(L, a) {
    const h = SPEC.spear, xb = L - h.head;
    if (L < h.head + 4) return '';
    let s = F(spearD(L), h.fill);
    s += S(`M2,${h.grain[2]} L${f(xb - 2)},${f(h.grain[2] + 0.6)}`, h.grain[0], h.grain[1]);
    s += S(`M${f(xb + 4)},-1.2 L${f(L - 5)},-0.3`, 'p50', 0.8);
    s += SW(`M0,0 H${f(xb + 2)}`, h.core);
    return GA(s, a);
  }
  /** The spear breaking up: ink dashes on the axis only. */
  const spearFade = (L, a) => S(`M0,0 H${f(L)}`, SPEC.spear.fade.token, SPEC.spear.fade.width, { cap: 'butt', dash: SPEC.spear.fade.dash, a });
  /** Mirror rail copy (railSpear + mirrorClone): dotted band edge, hollow shaft, dotted cyan core. */
  function spearCopy(L, w, a) {
    const s = SPEC.spearCopy, h = SPEC.spear, xb = L - h.head;
    let o = S(capsuleD(L, w), s.edge[0], s.edge[1], { cap: 'butt', dash: s.edgeDash });
    o += F(spearD(L), s.shaft.fill, { a: s.shaft.alpha }) + S(spearD(L), s.shaft.line[0], s.shaft.line[1]);
    o += SWD(`M0,0 H${f(xb)}`, s.core, s.coreDash, s.pad);
    return GA(o, a);
  }

  /** Chain points pushed into small alternating kinks: k = max(1, round(len / 30)) parts per jump, ±(3 + 3·jit). */
  function boltPts(pts, seed) {
    const b = SPEC.bolt, out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], q = pts[i], dx = q[0] - a[0], dy = q[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const k = Math.max(1, Math.round(L / b.seg)), nx = -dy / L, ny = dx / L;
      for (let j = 1; j < k; j++) {
        const t = j / k, s = (j % 2 ? 1 : -1) * (b.push[0] + b.push[1] * jit(seed, i * 64 + j));
        out.push([a[0] + dx * t + nx * s, a[1] + dy * t + ny * s]);
      }
      out.push(q);
    }
    return out;
  }
  /** Polyline cut to the first `len` units. */
  function cutPts(pts, len) {
    const out = [pts[0]];
    let left = len;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (l >= left) { out.push([a[0] + (b[0] - a[0]) * left / l, a[1] + (b[1] - a[1]) * left / l]); return out; }
      out.push(b); left -= l;
    }
    return out;
  }
  const polyLen = (pts) => pts.reduce((t, p, i) => (i ? t + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  function bolt(pts, awakened, a) {
    const b = SPEC.bolt;
    return GA(SW(line(pts), awakened ? b.awakened : b.layers, { join: b.join, miter: b.miter, cap: b.cap }), a);
  }
  const boltFade = (pts, awakened, a) => S(line(pts), SPEC.bolt.fade.token, (awakened ? SPEC.bolt.awakened : SPEC.bolt.layers)[0][1], { cap: 'butt', join: 'miter', miter: SPEC.bolt.miter, dash: SPEC.bolt.fade.dash, a });

  /** Clone thread: dotted sandwich from the hero to the clone, sagging 0.06·length in +y at the middle. */
  function tether(x1, y1, x2, y2, a) {
    const s = SPEC.tether, L = Math.hypot(x2 - x1, y2 - y1);
    const d = `M${P2([x1, y1])} Q${P2([(x1 + x2) / 2, (y1 + y2) / 2 + 2 * s.sag * L])} ${P2([x2, y2])}`;
    return GA(SWD(d, s.layers, s.dash, s.pad), a);
  }
  /** Vortex arms: thick inside, thin outside, wound clockwise outward; turning clockwise draws them inward. */
  function swirlArms(R, kind, rot, a) {
    const s = SPEC.swirl[kind];
    let o = '';
    for (let i = 0; i < s.arms; i++) {
      const th0 = rot + i * TAU / s.arms;
      const pts = samp((t) => polar(R * lerp(s.r[0], s.r[1], t), th0 + s.wind * RAD * t), 48);
      o += F(brushD(pts, (t) => R * lerp(s.width[0], s.width[1], Math.pow(t, 0.8))), s.token, { a: s.alpha * (a == null ? 1 : a) });
    }
    return o;
  }
  /** Eclipse step hit ring: paper band 5 centred on R, ink edges, outer [ink, ally] line (sandwich). */
  function slashRing(R, a) {
    const s = SPEC.slashRing;
    return GA(S(circ(R), s.band[0], s.band[1]) + S(circ(R - s.band[1] / 2), s.edge[0], s.edge[1]) + S(circ(R + s.band[1] / 2), s.edge[0], s.edge[1]) + SW(circ(R + s.outer.at), s.outer.layers), a);
  }
  /** Paper ward push ring: torn paper band 4 (inner edge jagged every 10) + ink edges + dotted outer [ink, ally]. */
  function wardRing(R, a, seed) {
    const s = SPEC.wardRing, hb = s.band[1] / 2, n = Math.max(12, Math.round(TAU * R / s.jag[0])), pts = [];
    for (let i = 0; i < n; i++) pts.push(polar(R - hb - (i % 2 ? s.jag[1] * (0.4 + 0.6 * jit(seed || 3, i)) : 0.3 * jit(seed || 3, i)), -Math.PI / 2 + i * TAU / n));
    const inner = line(pts, true);
    let o = F(circ(R + hb) + ' ' + inner, s.band[0], { rule: 'evenodd' });
    o += S(circ(R + hb), s.edge[0], s.edge[1]) + S(inner, s.edge[0], s.edge[1], { join: 'miter', miter: 4 });
    o += SWD(circ(R + s.outer.at), s.outer.layers, s.outer.dash, s.outer.pad);
    return GA(o, a);
  }
  /** Magnet pulse: thin rings 24 → 150 in 0.45 s (ease-out), α 0.6 → 0, second ring 0.08 s later. No fill, no stitch. */
  function pulseRings(t, reduced, rings, a) {
    const s = SPEC.pulse;
    let o = '';
    [0, s.delay].slice(0, rings || 2).forEach((dl) => {
      if (t < dl) return;
      const u = clamp((t - dl) / s.seconds, 0, 1);
      const r = reduced ? s.reducedR : lerp(s.r[0], s.r[1], 1 - Math.pow(1 - u, s.ease));
      const al = lerp(s.alpha[0], s.alpha[1], u) * (a == null ? 1 : a);
      if (al > 0.01) o += SW(circ(r), s.rings, { a: al });
    });
    return o;
  }
  /** Orbit tail (optional): 0.35 rad of the orbit behind the blade, fading in three steps. */
  function orbitTrail(rad, ang, dir) {
    const s = SPEC.orbitTrail;
    let o = '';
    for (let k = 0; k < 3; k++) {
      const a1 = ang - dir * s.arc * k / 3, a0 = ang - dir * s.arc * (k + 1) / 3;
      const d = dir > 0 ? arc(rad, a0, s.arc / 3) : arc(rad, a1, s.arc / 3);
      o += SW(d, s.layers, { a: s.alpha[0] * (1 - k / 3) });
    }
    return o;
  }

  // ==== 4. stamps ====
  const ART = {};
  GROUPS.forEach((g) => { ART[g] = {}; });
  // Stamp art is drawn around the anchor (0,0), +x = the rotate direction of the part.

  // ---- shared: needles and threads ----
  const THREAD = [['ink', 2.6], ['ally', 1.6], ['allyG', 0.5]];
  const NEEDLE_PROFILE = [[0, 0.86], [0.2, 1], [0.45, 1], [0.66, 0.8], [0.84, 0.44], [1, 0]];
  /** Needle pointing +x: round butt at x0, tip at x1, half width w. */
  function needleGeo(x0, x1, w) {
    const L = x1 - x0, r = w * 0.86, cx = x0 + r;
    const up = [[cx, -r]].concat(NEEDLE_PROFILE.slice(1).map((q) => [x0 + q[0] * L, -q[1] * w]));
    const lo = up.slice(0, -1).map((p) => [p[0], -p[1]]).reverse();
    const hw = (x) => {
      const t = (x - x0) / L;
      for (let i = 1; i < NEEDLE_PROFILE.length; i++) { const a = NEEDLE_PROFILE[i - 1], b = NEEDLE_PROFILE[i]; if (t <= b[0]) return w * lerp(a[1], b[1], clamp((t - a[0]) / (b[0] - a[0]), 0, 1)); }
      return 0;
    };
    return { d: `M${P2(up[0])} L${up.slice(1).map(P2).join(' L')} L${lo.map(P2).join(' L')} A${f(r)},${f(r)} 0 0 1 ${P2(up[0])} Z`, hw };
  }
  /** The ink-dipped front of a needle, with a ragged back edge. */
  function needleTipD(g, xt, x1) {
    const up = samp((t) => [lerp(xt, x1, t), -g.hw(lerp(xt, x1, t))], 4);
    const lo = up.slice(0, -1).map((p) => [p[0], -p[1]]).reverse();
    return line(up.concat(lo, [[xt - 0.5, g.hw(xt) * 0.4], [xt + 0.3, 0], [xt - 0.6, -g.hw(xt) * 0.45]]), true);
  }
  /** Needle body. o: {fill, line, lw, tip (ink length), eye (x), eyeFill, a} */
  function needleBody(x0, x1, w, o) {
    o = o || {};
    const g = needleGeo(x0, x1, w);
    let s = F(g.d, o.fill || 'p50', { st: o.line || 'ink', sw: o.lw || 1.5, a: o.a });
    if (o.tip) s += F(needleTipD(g, x1 - o.tip, x1), o.tipFill || 'ink', { a: o.a });
    if (o.eye != null) s += `<ellipse cx="${f(o.eye)}" cy="0" rx="1.15" ry="0.5" fill="${colour(o.eyeFill || 'ally')}" stroke="${K.ink}" stroke-width="0.5"${op(o.a)}/>`;
    return s;
  }
  /** Thread trailing behind from x0 to x1 (x1 < x0): S wave that grows from the needle, optional droop. */
  const threadPts = (x0, x1, amp, phase, waves, sag, y0) => samp((t) => [lerp(x0, x1, t), (y0 || 0) + Math.min(1, t * 2.4) * amp * Math.sin(phase + t * waves * TAU) + (sag || 0) * t * t], 16);
  const threadD = (x0, x1, amp, phase, waves, sag, y0) => smooth(threadPts(x0, x1, amp, phase, waves, sag, y0));
  /** A slack thread whose last part thins out (frays) instead of forking. */
  function frayedThread(x0, x1, amp, phase, waves, sag) {
    const p = threadPts(x0, x1, amp, phase, waves, sag), k = 12;
    return SW(smooth(p.slice(0, k + 1)), THREAD) + SW(smooth(p.slice(k)), [['ink', 1.6], ['ally', 0.8]]);
  }

  // ---- common: the stitch head (sewing needle at the end of a progress stitch, +x = clockwise tangent) ----
  ART.common.stitchHead = (fr) => {
    const t = fr ? 'translate(-0.4 0.5) rotate(3)' : '';
    return SW(`M-5,0 C-7.5,0.2 -9.5,0.6 -12,0.9`, THREAD) + G(t || 'translate(0 0)', needleBody(-7, 9, 1.3, { tip: 4, eye: -5 }));
  };

  // ---- needleStorm: needle 18 (tip +6, butt -12) + cyan thread to -38; hit circle r 4.5 hugs the front ----
  const NEEDLE = (o) => needleBody(-12, 6, 1.55, Object.assign({ tip: 5, eye: -9.6 }, o || {}));
  ART.needleStorm.start = (fr) => SW(threadD(-9.6, fr ? -30 : -20, 2.2, 0.4, 0.7), THREAD) + NEEDLE();
  ART.needleStorm.travel = (fr) => SW(threadD(-9.6, -38, 3, fr ? 2.7 : 0, 1.1), THREAD) + NEEDLE();
  ART.needleStorm.end = (fr) => frayedThread(-9.6, fr ? -29 : -35, fr ? 1.5 : 2, 1.2, 1.0, fr ? 2.4 : 1.6) +
    NEEDLE({ fill: 'p300', line: fr ? 'ink300' : 'ink', lw: fr ? 1.2 : 1.5, tipFill: fr ? 'ink500' : 'ink' });
  // awakened (부채꼴 난사): one doubled, twisted thread (K4 검수 1차 고침 3: a thread that forks reads as Y / tongs).
  // A = +1.4·sin(φ + 2.2π·t)·env(t), B = −1.4·sin(φ + 2.2π·t)·env(t) + 0.4·env(t), env 0 → 1 by t = 0.3: centre gap
  // env·|2.8·sin − 0.4| ≤ 3.2 (1.6 as asked would reach 3.6), the strands cross twice; B is thinner and ends 4 short of A
  function twinThread(x1, phase, sag) {
    const env = (t) => Math.min(1, t / 0.3), w = (t) => 1.4 * Math.sin(phase + 2.2 * Math.PI * t) * env(t), dr = (t) => (sag || 0) * t * t;
    const A = smooth(samp((t) => [lerp(-9.6, x1, t), w(t) + dr(t)], 18));
    const B = smooth(samp((t) => [lerp(-9.6, x1 + 4, t), -w(t) + 0.4 * env(t) + dr(t)], 18));
    return SW(B, [['ink', 2], ['ally', 1.1]]) + SW(A, THREAD);
  }
  /** Paper sparkle on the point: travel frame 0 only and ≤ 0.75 size (검수 R6: a fixed star would echo the hit star). */
  const SPARK = (s) => F(starD(3.1, -3.7, (s || 0.75) * 3.5, 6, 5), 'p50', { st: 'ink', sw: 0.6 });
  ART.needleStorm['start-awakened'] = (fr) => twinThread(fr ? -31 : -25, 0.5) + NEEDLE();
  ART.needleStorm['travel-awakened'] = (fr) => twinThread(-38, fr ? 2.6 : 0) + NEEDLE() + (fr ? '' : SPARK(0.75));
  ART.needleStorm['end-awakened'] = (fr) => twinThread(fr ? -28 : -34, 1.2, fr ? 1.6 : 0.8) + NEEDLE({ fill: 'p300', line: fr ? 'ink300' : 'ink', lw: fr ? 1.2 : 1.5, tipFill: fr ? 'ink500' : 'ink' });
  // shard: one short cyan thread stroke leaping from the struck enemy (+x = toward the shard target)
  ART.needleStorm['shard-awakened'] = (fr) => {
    const x0 = fr ? 12 : 0, x1 = fr ? 39 : 25;
    const d = smooth(samp((t) => [lerp(x0, x1, t), -1.6 * Math.sin(t * Math.PI) + (fr ? 0.6 : 0)], 8));
    return SW(d, THREAD) + (fr ? F(starD(x1 - 1, 0.4, 2.6, 5, 9), 'p50', { st: 'ink', sw: 0.6 }) : '');
  };

  // ---- fanKnives: a hanji fan rib forged into a blade (tip +8), one ridge, ink knots on the rib, cyan point ----
  const KNIFE_D = 'M-7,-2.2 C-4,-3.9 2,-4.1 5.4,-2 Q7,-1 8,0 Q6.6,1.2 5,1.9 C2,3.2 -4,3.3 -7,2.2 Z';
  function knife(o) {
    o = o || {};
    const ln = o.faded ? 'ink300' : 'ink';
    let s = F('M-17.6,-1 L-7,-1.5 L-7,1.5 L-17.6,1 Z', o.faded ? 'p300' : 'p300', { st: ln, sw: 1 });
    s += F('M-14.4,-1.65 h1.6 v3.3 h-1.6 Z', ln) + F('M-11,-1.75 h1.6 v3.5 h-1.6 Z', ln);
    s += Cir(-16.3, 0, 1.2, 'p50', { st: ln, sw: 0.8 });
    s += F(KNIFE_D, o.faded ? 'p300' : 'p50', { st: ln, sw: o.faded ? 1.2 : 1.5 });
    s += S('M-6.4,0.2 C-2,-0.4 2,-0.6 5.6,-0.5', o.faded ? 'ink300' : 'ink', 0.8);
    if (!o.noDot) s += Cir(4.3, -0.6, 1.1, 'ally', { st: 'ink', sw: 0.6 }) + (o.glint ? Cir(3.9, -0.95, 0.4, 'allyG') : '');
    return s;
  }
  ART.fanKnives.start = (fr) => knife({ glint: fr === 0 });
  ART.fanKnives.travel = (fr) => knife({ glint: fr === 1 });
  ART.fanKnives.end = (fr) => knife({ faded: true, noDot: fr === 1 });
  // awakened: two layered ribs (two ridges) and a cyan thread along the blade's back
  function knifeAw(o) {
    o = o || {};
    const ln = o.faded ? 'ink300' : 'ink';
    let s = G('translate(-2.2 -0.6) rotate(-7) scale(0.9)', F(KNIFE_D, 'p300', { st: ln, sw: 1 }) + S('M-6.4,0.2 C-2,-0.4 2,-0.6 5.6,-0.5', ln, 0.7));
    s += knife({ faded: o.faded, noDot: o.noDot, glint: o.glint });
    if (!o.noThread) s += SW('M-6.6,-2.5 C-3.6,-3.9 1.6,-4 5,-2.2', [['ink', 2.2], ['ally', 1.3], ['allyG', 0.4]], { a: o.faded ? 0.7 : 1 });
    return s;
  }
  ART.fanKnives['start-awakened'] = (fr) => knifeAw({ glint: fr === 0 });
  ART.fanKnives['travel-awakened'] = (fr) => knifeAw({ glint: fr === 1 });
  // return / end (awakened knives end on the way back): +x is toward the hero, the handle leads, the point trails
  const MIRROR_KNIFE = (body) => G('translate(-10 0) scale(-1 1)', body);
  ART.fanKnives['return-awakened'] = (fr) => F(brushD([[-17.4, 3.4], [-14.6, 3], [-11.6, 2.5]], (t) => 1.2 * (1 - t) + 0.15), 'ink300') +
    (fr ? F(brushD([[-17.8, -3.6], [-15.4, -3.2]], (t) => 0.9 * (1 - t) + 0.15), 'ink300') : '') + MIRROR_KNIFE(knifeAw({ glint: fr === 1 }));
  ART.fanKnives['end-awakened'] = (fr) => MIRROR_KNIFE(knifeAw({ faded: true, noDot: fr === 1, noThread: fr === 1 }));

  // ---- mirrorClone shots: a hollow copy needle (paper α0.6 + ink.300) with a short stitched thread ----
  function cloneShot(x1, o) {
    o = o || {};
    const g = needleGeo(-9, 7, 1.7);
    let s = '';
    if (x1 < -9.5) s += SWD(threadD(-9, x1, 1.2, o.phase || 0, 0.7), [['ink', 2.6], ['ally', 1.6]], [4, 3], 0.6);
    s += F(g.d, 'p50', { a: o.fade ? 0.3 : 0.6 });
    s += S(g.d, 'ink300', 1.2, o.fade ? { dash: [2.4, 1.6], cap: 'butt' } : {});
    s += `<ellipse cx="-6.8" cy="0" rx="1.1" ry="0.48" fill="${K.ally}" stroke="${K.ink}" stroke-width="0.5"/>`;
    return s;
  }
  ART.mirrorClone['shot-start'] = (fr) => cloneShot(fr ? -20 : -13);
  ART.mirrorClone['shot-travel'] = (fr) => cloneShot(-20, { phase: fr ? 2.4 : 0 });
  ART.mirrorClone['shot-end'] = (fr) => cloneShot(fr ? -13 : -20, { fade: true, phase: 1 });
  // awakened (aimed shots): the stitched thread is two stitches longer
  ART.mirrorClone['shot-start-awakened'] = (fr) => cloneShot(fr ? -27 : -13);
  ART.mirrorClone['shot-travel-awakened'] = (fr) => cloneShot(-34, { phase: fr ? 2.4 : 0 });
  ART.mirrorClone['shot-end-awakened'] = (fr) => cloneShot(fr ? -20 : -34, { fade: true, phase: 1 });

  // ---- recoveryThread shots: a hollow knot loop of thread + one tail that bends once (K4 검수 1차 고침 1: a filled
  // round head with an S tail read as a tadpole). The loop is a teardrop (front +5.5, back crossing (−4.5, 0), widest
  // half 2.2 at x −0.5) whose thread crosses itself once at the back — the knot — and the ground shows inside it.
  // No needle, no filled circle, no ink ball + paper dot. Hit r 5 covers the loop (its front point +5.5 is 0.5 beyond).
  const TH_DIM = [['ink', 2.4], ['allyD', 1.4]];
  const qpt = (a, c, b, t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
  /** Teardrop loop; `open` = the knot has loosened (the two strands pass 2 apart instead of crossing). */
  function knotLoopD(open) {
    const loop = [[-4.5, open ? -1 : 0], [-2.5, -1.6], [-0.5, -2.2], [2.5, -1.7], [5.5, 0], [2.5, 1.7], [-0.5, 2.2], [-2.5, 1.6]];
    return smooth(loop.concat(open ? [[-4.5, 1], [-5.6, 1.8]] : [[-4.5, 0], [-6.2, -1.4]]));
  }
  /** Tail from the knot: one bend (quadratic), the last ~6 thinned and frayed into two fibres of 5 and 3. */
  function knotTail(c, end, fray, open, layers) {
    const pts = samp((t) => qpt([-4.5, open ? -1 : 0], c, end, t), 16);
    if (!fray) return SW(smooth(pts), layers);
    const k = Math.max(2, pts.findIndex((p) => p[0] < end[0] + 5.5)), s0 = pts[k];
    return SW(smooth(pts.slice(0, k + 1)), layers) + SW(smooth(pts.slice(k)), [['ink', 1.6], [layers[1][0], 0.8]]) +
      SW(`M${P2(s0)} L${P2([s0[0] - 2.7, s0[1] + 1.1])}`, [['ink', 1.5], [layers[1][0], 0.7]]);
  }
  const knotShot = (c, end, fray, open, layers, a) => GA(knotTail(c, end, fray, open, layers) + SW(knotLoopD(open), layers), a);
  ART.recoveryThread['shot-start-awakened'] = (fr) => knotShot(fr ? [-8.5, 1.6] : [-8, 2.4], fr ? [-12.5, 0.8] : [-12.5, 1.4], false, false, THREAD);
  ART.recoveryThread['shot-travel-awakened'] = (fr) => knotShot([-12, fr ? 2 : 3.5], [-20, fr ? 0.8 : 1.5], true, false, THREAD);
  ART.recoveryThread['shot-end-awakened'] = (fr) => knotShot([-12, 3.8], fr ? [-16, 2.4] : [-19, 2.2], true, true, TH_DIM, fr ? 0.6 : 1);

  // ---- shared: scattered bits ----
  /** Small irregular chip (paper shard): a 4-5 sided polygon around (x, y). */
  function chipD(x, y, s, seed, a0) {
    const n = 4 + (seed % 2), p = [];
    for (let i = 0; i < n; i++) p.push(polar(s * (0.55 + 0.45 * jit(seed, i)), (a0 || 0) + i * TAU / n + (jit(seed, i + 20) - 0.5) * 0.7, x, y));
    return line(p, true);
  }
  /** Irregular blot (closed smooth blob) of mean radius r. */
  function blotD(x, y, r, seed, n, amp) {
    const p = [];
    n = n || 9;
    for (let i = 0; i < n; i++) p.push(polar(r * (1 - (amp || 0.3) / 2 + (amp || 0.3) * jit(seed, i)), i * TAU / n + (jit(seed, i + 30) - 0.5) * 0.4, x, y));
    return smooth(p, true);
  }
  /** Specks: n paper dots (ink rim) scattered in a ring sector. */
  function specks(n, seed, r0, r1, a0, a1, s0, s1, fill, rim) {
    let o = '';
    for (let i = 0; i < n; i++) {
      const a = lerp(a0, a1, jit(seed, i)), r = lerp(r0, r1, jit(seed, i + 50)), s = lerp(s0, s1, jit(seed, i + 90));
      const q = polar(r, a);
      o += Cir(q[0], q[1], s, fill || 'p50', rim === false ? {} : { st: rim || 'ink', sw: 0.4 });
    }
    return o;
  }
  /** A cyan spark: a short ink-bordered sliver (sandwich), pointing along `a`. */
  const spark = (x, y, a, l) => SW(`M${P2([x, y])} L${P2(polar(l, a, x, y))}`, [['ink', 2.2], ['ally', 1.1]]);

  // ---- chainSpark: awakened burst at the last link (paper splash, ink drops, 1-2 cyan sparks), r 26 ----
  ART.chainSpark['burst-awakened'] = (fr) => {
    if (fr === 0) return specks(3, 21, 15, 18, 0, TAU, 1.3, 2, 'ink', false) + F(starD(0, 0, 13.5, 7, 31, -0.3, 0.4), 'p50', { st: 'ink', sw: 1.4 }) + spark(9.5, -11.5, -0.9, 4.5);
    if (fr === 1) {
      let s = specks(6, 22, 16, 23, 0, TAU, 1, 2.1, 'ink', false);
      for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + 0.5 + jit(23, i) * 0.6, q = polar(12 + 7 * jit(24, i), a); s += F(chipD(q[0], q[1], 2.6 + 1.2 * jit(25, i), 26 + i, a), 'p50', { st: 'ink', sw: 0.8 }); }
      return s + F(blotD(0, 0, 4.2, 27, 7, 0.4), 'p50', { st: 'ink', sw: 1 }) + spark(16, -13, -0.7, 5) + spark(-17.5, 8, 2.6, 4);
    }
    let s = specks(7, 28, 18, 24, 0, TAU, 0.7, 1.4, 'ink', false);
    for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 1.1 + jit(29, i) * 0.8, q = polar(17 + 6 * jit(30, i), a); s += F(chipD(q[0], q[1], 1.8, 31 + i, a), 'p300', { st: 'ink300', sw: 0.7 }); }
    return s + spark(19, -14.5, -0.7, 3);
  };

  // ---- frostLine: chalk scrape at the beam start; chalk-dust slow marks and chalk-ring root marks on enemy feet ----
  const SCRAPE = 'M-5,-2.2 L-1,-3.6 L3,-2.8 L7,-3.4 L11,-2.4 L14.5,-1.4 L14.5,1.3 L10,2.8 L6,2.2 L2,3.4 L-2,2.6 L-5,1.6 Z';
  function frostOrigin(fr, aw) {
    const late = fr === 1;
    let s = specks(aw ? 9 : 7, aw ? 41 : 40, 5, late ? 16 : 13, Math.PI * 0.55, Math.PI * 1.45, 0.6, 1.2);
    s += F(SCRAPE, late ? 'p300' : 'p50', { st: 'ink', sw: 0.8 });
    s += F(chipD(late ? -13 : -9, late ? -8.5 : -6, late ? 2.4 : 3.2, 42, 0.3), 'p50', { st: 'ink', sw: 0.8 });
    s += F(chipD(late ? -15 : -12, late ? 7.5 : 5, late ? 1.8 : 2.4, 43, 1.1), 'p50', { st: 'ink', sw: 0.8 });
    if (aw) {
      // a broken stick end and a third chip; the cyan core shows in the scrape (on paper)
      s += F(late ? 'M-6,10 L-0.5,8.8 L0.2,11.4 L-1.6,12.2 L-5.6,13 Z' : 'M-4,8.4 L2,7.4 L2.6,10 L0.8,10.8 L-3.6,11.6 Z', 'p50', { st: 'ink', sw: 0.9 });
      s += F(chipD(late ? -16.4 : -12.6, late ? -1.8 : -1.2, 1.6, 44, 0.8), 'p50', { st: 'ink', sw: 0.7 });
      s += S('M-3,0 H12', 'ally', 1.4, { a: late ? 0.6 : 1 });
    }
    return s;
  }
  ART.frostLine.origin = (fr) => frostOrigin(fr, false);
  ART.frostLine['origin-awakened'] = (fr) => frostOrigin(fr, true);
  function chillDots(r) {
    const ry = 0.42 * r, per = TAU * Math.sqrt((r * r + ry * ry) / 2), n = Math.max(8, Math.round(per / 5.2));
    let s = '';
    for (let i = 0; i < n; i++) {
      if (jit(r, i + 300) < 0.22) continue;
      const a = i * TAU / n + (jit(r, i) - 0.5) * 0.25, k = 1 - 0.1 * jit(r, i + 100), sz = lerp(0.7, r > 30 ? 1.5 : 1.2, jit(r, i + 200));
      s += Cir(Math.cos(a) * r * k, Math.sin(a) * ry * k, sz, 'p50', { st: 'ink', sw: 0.4 });
    }
    return s;
  }
  function rootRing(r) {
    const ry = 0.42 * r, n = Math.max(14, Math.round(TAU * r / 4)), out = [], inn = [];
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n;
      out.push([Math.cos(a) * (r + 1.2 + 0.6 * jit(r, i)), Math.sin(a) * (ry + 0.9 + 0.4 * jit(r, i))]);
      inn.push([Math.cos(a) * (r - 1.4 - (i % 2 ? 1.2 * jit(r, i + 60) : 0)), Math.sin(a) * (ry - 1 - (i % 2 ? 0.6 * jit(r, i + 60) : 0))]);
    }
    return F(line(out, true) + ' ' + line(inn, true), 'p50', { rule: 'evenodd', st: 'ink', sw: 0.8 });
  }
  CHILL_R.forEach((r) => {
    ART.frostLine['chill' + r] = () => chillDots(r);
    ART.frostLine['root' + r + '-awakened'] = () => rootRing(r);
  });

  // ---- railSpear: recoil blot at the start, paper muzzle flash, awakened fissure (radial ink cracks + paper edges) ----
  function railOrigin(fr, aw) {
    const late = fr === 1;
    let s = '';
    for (let i = 0; i < (aw ? 7 : 5); i++) {
      const a = Math.PI + (jit(51, i) - 0.5) * 1.9, d = lerp(late ? 15 : 11, late ? 26 : 22, jit(52, i)), q = polar(d, a), r = lerp(late ? 0.7 : 1, late ? 1.5 : 2.2, jit(53, i));
      s += Cir(q[0], q[1], r, 'ink');
      if (i < 2) s += F(brushD([polar(d - 7, a), polar(d - 1, a)], (t) => 0.3 + r * 1.4 * t), 'ink');
    }
    s += F(blotD(-6, 0, late ? 5 : (aw ? 8.6 : 7.4), 54, 9, 0.38), late ? 'ink700' : 'ink');
    if (!late) s += F(chipD(5, -4.2, 2.4, 55, -0.6), 'p50', { st: 'ink', sw: 0.8 }) + F(chipD(6, 4, 1.8, 56, 0.6), 'p50', { st: 'ink', sw: 0.8 });
    if (aw) s += spark(-9, -8, Math.PI + 0.55, late ? 5 : 7) + spark(-11, 7, Math.PI - 0.35, late ? 3.5 : 5.5);
    return s;
  }
  ART.railSpear.origin = (fr) => railOrigin(fr, false);
  ART.railSpear['origin-awakened'] = (fr) => railOrigin(fr, true);
  function railFlash(aw) {
    const rays = aw ? [[0, 25], [0.55, 10], [1.2, 13], [1.9, 8], [2.6, 11], [3.3, 9], [4, 12], [4.7, 9.5], [5.5, 14]] : [[0, 24], [0.7, 11], [1.5, 8], [2.4, 10], [3.3, 7.5], [4.2, 9], [5.4, 12]];
    const p = [];
    rays.forEach((q, i) => { p.push(polar(q[1], q[0])); p.push(polar(aw ? 5.2 : 4.6, q[0] + (((rays[i + 1] || [TAU])[0]) - q[0]) / 2)); });
    let s = F(line(p, true), 'p50', { st: 'ink', sw: 1.4 });
    if (aw) s += F(chipD(14, -11, 2.4, 57, 0.4), 'p50', { st: 'ink', sw: 0.8 }) + F(chipD(12, 12, 2, 58, -0.3), 'p50', { st: 'ink', sw: 0.8 });
    return s;
  }
  ART.railSpear.flash = () => railFlash(false);
  ART.railSpear['flash-awakened'] = () => railFlash(true);
  // fissure (K4 검수 R1: four-part kinked cracks round a fat blot read as spider legs): six cracks of two straight parts
  // each (one kink at the middle, none at the tip), lengths 8..27 with a single long one, centre blot r ≤ 2.5, no branches
  const FISSURE_L = [12, 9, 27, 14, 8, 16];
  ART.railSpear['fissure-awakened'] = (fr) => {
    const grow = fr === 0 ? 0.55 : 1, dry = fr === 2;
    let s = '', lit = '';
    FISSURE_L.forEach((len, i) => {
      const a0 = i * TAU / FISSURE_L.length + (jit(61, i) - 0.5) * 0.7, L = len * grow, bend = (jit(63, i) - 0.5) * 0.6;
      const pts = [[0, 0], polar(L * 0.5, a0), polar(L * 0.5, a0 + bend, ...polar(L * 0.5, a0))];
      s += F(brushD(pts, (t) => 2.4 * (1 - t) + 0.3), dry ? 'ink300' : 'ink');
      if (!dry) lit += S(line(pts.slice(0, 2).map((q) => [q[0] - 0.8, q[1] - 0.8])), 'p50', 0.6);
    });
    return s + lit + F(blotD(0, 0, 2.2, 64, 8, 0.4), dry ? 'ink300' : 'ink');
  };

  // ---- orbitScythes: crescent sickle inside r 17. +x = outward; the forward blade leads with +y ----
  function sickle(rev, fr) {
    const C = [-5.5, 0], R = 14.5, a0 = -72 * RAD, a1 = 80 * RAD, N = 20;
    const wf = (s) => (s < 0.35 ? lerp(3.3, 7.4, s / 0.35) : 7.4 * Math.pow((1 - s) / 0.65, 0.85));
    const outer = [], inner = [], core = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N, a = lerp(a0, a1, s), w = wf(s), n = [Math.cos(a), Math.sin(a)], c = [C[0] + n[0] * R, C[1] + n[1] * R];
      outer.push([c[0] + n[0] * w * 0.55, c[1] + n[1] * w * 0.55]);
      inner.push([c[0] - n[0] * w * 0.45, c[1] - n[1] * w * 0.45]);
      if (s > 0.12 && s < 0.8) core.push(rev ? [c[0] + n[0] * (w * 0.55 - 1.4), c[1] + n[1] * (w * 0.55 - 1.4)] : [c[0] - n[0] * (w * 0.45 - 1.4), c[1] - n[1] * (w * 0.45 - 1.4)]);
    }
    const d = line(outer.concat(inner.reverse()), true);
    const mir = (m) => (rev ? G('scale(1 -1)', m) : m);
    let s = F(d, rev ? 'ink' : 'p50', { st: rev ? 'p50' : 'ink', sw: rev ? 1.2 : 1.5 });
    // tang binding: two wraps across the blade foot
    const wrap = (s0) => { const a = lerp(a0, a1, s0), n = [Math.cos(a), Math.sin(a)], c = [C[0] + n[0] * R, C[1] + n[1] * R], w = wf(s0); return S(`M${P2([c[0] - n[0] * w * 0.45, c[1] - n[1] * w * 0.45])} L${P2([c[0] + n[0] * w * 0.55, c[1] + n[1] * w * 0.55])}`, rev ? 'p50' : 'ink', 1.1, { cap: 'butt' }); };
    s += wrap(0.035) + wrap(0.09);
    s += SW(smooth(core), [['ink', 1.7], ['ally', 0.95]]);
    const gl = fr ? core.slice(9, 12) : core.slice(3, 6);
    s += S(smooth(gl), 'allyG', 0.5);
    return mir(s);
  }
  ART.orbitScythes.blade = (fr) => sickle(false, fr);
  ART.orbitScythes['blade-outer-awakened'] = (fr) => sickle(true, fr);

  // ---- boneMortar: a falling ink onggi (ink.500 lit face, paper cloth lid, one cord knot), bone-powder blast, dust ----
  const JAR = 'M-6,0 C-9,-1 -11.6,-5 -10.8,-11 C-10.2,-16 -9.4,-18.6 -7.6,-21 C-6.4,-22.6 -5,-23.4 -5,-24.2 L-6.2,-25.4 L6.2,-25.4 L5,-24.2 C5,-23.4 6.4,-22.6 7.6,-21 C9.4,-18.6 10.2,-16 10.8,-11 C11.6,-5 9,-1 6,0 Z';
  function jar(band) {
    let s = F(JAR, 'ink');
    s += F('M-9.6,-9 C-9.6,-15 -7.6,-19 -4.6,-21 C-6.4,-17 -7.2,-13 -6.8,-8 C-7.4,-6 -8.6,-5 -9.6,-9 Z', 'ink500');
    s += S('M-10.3,-12 C-10.1,-16 -8.9,-19 -7.1,-21', 'p50', 0.7);
    s += F('M-6.8,-25.2 C-7,-29.5 -3,-32.6 0,-32.6 C3,-32.6 7,-29.5 6.8,-25.2 C4,-24.2 -4,-24.2 -6.8,-25.2 Z', 'p50', { st: 'ink', sw: 1 });
    s += S('M-1.2,-32 C-2,-29.5 -2.4,-27.6 -2.2,-25.4 M2.6,-31.4 C2.6,-29.4 2.2,-27.4 1.4,-25.4', 'ink', 0.6);
    s += S('M-6.4,-24.6 C-3,-23.4 3,-23.4 6.4,-24.6', 'ink', 1.2) + Cir(-6.6, -24.1, 1.15, 'none', { st: 'ink', sw: 0.9 }) + S('M-7,-23.2 L-8.2,-20.2 M-6.1,-23.1 L-5.9,-19.8', 'ink', 0.9);
    if (band) s += SW('M-10.9,-12.4 C-5,-8.8 5,-8.8 10.9,-12.4', THREAD);
    return s;
  }
  function shell(fr, band) {
    const yb = -[128, 86, 44, 8][fr];
    let s = `<ellipse cx="0" cy="0" rx="${7 + 3 * fr}" ry="${3 + fr}" fill="${K.ink}" opacity="0.28"/>`;
    if (fr < 3) s += F(brushD([[-12.6, yb - 32], [-12.9, yb - 22]], (t) => 0.2 + 1.2 * t), 'ink300') + F(brushD([[12.4, yb - 30], [12.2, yb - 24]], (t) => 0.2 + 0.9 * t), 'ink300');
    return s + G(tr(0, yb), jar(band));
  }
  ART.boneMortar.shell = (fr) => shell(fr, false);
  ART.boneMortar['shell-awakened'] = (fr) => shell(fr, true);
  /** Overlapping puffs as one silhouette: all ink rims first, then all paper fills. */
  function puffs(list, fill, rim) {
    return list.map((q) => Cir(q[0], q[1], q[2] + (rim || 1), 'ink')).join('') + list.map((q) => Cir(q[0], q[1], q[2], fill)).join('');
  }
  function blast(fr, aw) {
    const seed = aw ? 80 : 70;
    let s = '';
    if (fr === 0) {
      s += specks(aw ? 9 : 6, seed, 26, 38, 0, TAU, 1, 2.2, 'ink', false);
      for (let i = 0; i < (aw ? 8 : 5); i++) { const a = i * TAU / (aw ? 8 : 5) + jit(seed + 1, i), q = polar(24 + 9 * jit(seed + 2, i), a); s += F(chipD(q[0], q[1], 2.4 + 1.6 * jit(seed + 3, i), seed + 10 + i, a), 'p50', { st: 'ink', sw: 0.8 }); }
      s += F(starD(0, 0, aw ? 26 : 22, aw ? 9 : 7, seed + 4, -0.2, 0.42), 'p50', { st: 'ink', sw: 1.6 });
      if (aw) s += F(starD(1, 1, 13, 7, seed + 5, 0.3, 0.5), 'p50', { st: 'ink', sw: 1 });
      return s;
    }
    const n = aw ? 8 : 6;
    s += specks(aw ? 10 : 7, seed + 9, 30, 39, 0, TAU, fr === 1 ? 1 : 0.7, fr === 1 ? 2 : 1.4, 'ink', false);
    const nc = aw ? 8 : 5;
    for (let i = 0; i < nc; i++) { const a = i * TAU / nc + 0.4 + jit(seed + 11, i) * 0.5, q = polar(31 + 7 * jit(seed + 12, i), a); s += F(chipD(q[0], q[1], fr === 1 ? 2.4 : 1.8, seed + 20 + i, a), fr === 1 ? 'p50' : 'p300', { st: fr === 1 ? 'ink' : 'ink300', sw: 0.8 }); }
    if (fr === 1) {
      const list = [[0.5, 0.5, aw ? 10 : 8.5]];
      for (let i = 0; i < n; i++) { const a = i * TAU / n + jit(seed + 6, i) * 0.6, q = polar(9 + 6 * jit(seed + 7, i), a); list.push([q[0], q[1], 5.6 + 3 * jit(seed + 8, i)]); }
      return s + puffs(list, 'p50', 1.1);
    }
    // settling powder: a few irregular pale blots drifting outward
    for (let i = 0; i < n - 1; i++) { const a = i * TAU / (n - 1) + 0.3 + jit(seed + 6, i) * 0.7, q = polar(14 + 9 * jit(seed + 7, i), a); s += F(blotD(q[0], q[1], 3.2 + 1.8 * jit(seed + 8, i), seed + 40 + i, 7, 0.5), 'p300', { st: 'ink300', sw: 0.7 }); }
    return s;
  }
  ART.boneMortar.blast = (fr) => blast(fr, false);
  ART.boneMortar['blast-awakened'] = (fr) => blast(fr, true);
  // dust on the ring (+x = outward): dots and one short stroke, reaching at most +7 outside
  ART.boneMortar.dust = (fr) => fr === 0
    ? Cir(-5, -1.6, 1.4, 'p50', { st: 'ink', sw: 0.4 }) + Cir(-1, 2, 1.1, 'p50', { st: 'ink', sw: 0.4 }) + Cir(2.8, -0.8, 1.6, 'p50', { st: 'ink', sw: 0.4 }) + F(brushD([[1, 2.6], [6.6, 3.3]], (t) => 0.9 * (1 - t) + 0.2), 'ink')
    : Cir(-6.4, 1, 1.2, 'p50', { st: 'ink', sw: 0.4 }) + Cir(-2.2, -2.2, 1.5, 'p50', { st: 'ink', sw: 0.4 }) + Cir(1.8, 1.8, 1, 'p50', { st: 'ink', sw: 0.4 }) + Cir(5.4, -1.4, 0.8, 'p50', { st: 'ink', sw: 0.4 }) + F(chipD(-1, -0.2, 1.2, 77, 0.5), 'p50', { st: 'ink', sw: 0.5 });

  // ---- voidMine: a spiked disc sunk in the ground (3/4 ellipse, irregular hooked spikes, ink.500 lit face, paper rim) ----
  function mineSpikes(n, seed, k, twist, front) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n + (jit(seed, i) - 0.5) * 0.55 + (twist || 0), isFront = Math.sin(a) > -0.15;
      if (isFront !== front) continue;
      const L = lerp(6.5, 11, jit(seed, i + 10)) * k, bw = lerp(1.7, 2.4, jit(seed, i + 20));
      if (L < 0.8) continue;
      const base = [Math.cos(a) * 12, -1.6 + Math.sin(a) * 5.6], dir = [Math.cos(a), 0.48 * Math.sin(a)], dl = Math.hypot(dir[0], dir[1]);
      const u = [dir[0] / dl, dir[1] / dl], nrm = [-u[1], u[0]], hook = 0.22 * L;
      const tip = [base[0] + u[0] * L + nrm[0] * hook, base[1] + u[1] * L + nrm[1] * hook];
      const mid = [base[0] + u[0] * L * 0.55 + nrm[0] * hook * 0.3, base[1] + u[1] * L * 0.55 + nrm[1] * hook * 0.3];
      const d = `M${P2([base[0] - nrm[0] * bw, base[1] - nrm[1] * bw])} Q${P2([mid[0] - nrm[0] * bw * 0.6, mid[1] - nrm[1] * bw * 0.6])} ${P2(tip)} Q${P2([mid[0] + nrm[0] * bw * 0.4, mid[1] + nrm[1] * bw * 0.4])} ${P2([base[0] + nrm[0] * bw, base[1] + nrm[1] * bw])} Z`;
      s += F(d, 'ink') + S(`M${P2([base[0] - nrm[0] * bw * 0.5, base[1] - nrm[1] * bw * 0.5])} Q${P2([mid[0] - nrm[0] * bw * 0.35, mid[1] - nrm[1] * bw * 0.35])} ${P2([lerp(mid[0], tip[0], 0.5), lerp(mid[1], tip[1], 0.5)])}`, 'ink500', 0.8);
      if (jit(seed, i + 30) > 0.62 && k > 0.9) s += S(`M${P2([lerp(mid[0], tip[0], 0.6), lerp(mid[1], tip[1], 0.6)])} L${P2(tip)}`, 'p50', 0.6);
    }
    return s;
  }
  function mine(o) {
    o = o || {};
    const k = o.k == null ? 1 : o.k, n = o.n || 7, seed = o.seed || 91, sc = o.scale || 1;
    let s = mineSpikes(n, seed, k, o.twist, false);
    s += F('M-12.5,-1.6 A12.5,5.8 0 0 0 12.5,-1.6 L12.5,1.4 A12.5,5.8 0 0 1 -12.5,1.4 Z', o.dry ? 'ink300' : 'ink700');
    s += `<ellipse cx="0" cy="-1.6" rx="12.5" ry="5.8" fill="${K[o.dry ? 'ink300' : 'ink']}"/>`;
    if (!o.dry) s += F('M-11.6,-2.6 C-10.6,-5.6 -6,-7.4 -1,-7.2 C-5,-6.2 -8.6,-4.6 -9.6,-1.6 Z', 'ink500') + S(ellArc(12.5, 5.8, 0, -1.6, 200 * RAD, 125 * RAD), 'p50', 1.2);
    s += S('M0.4,-1.4 C1.8,-1.6 2,-3 0.6,-3.4 C-1.4,-3.8 -3,-2.2 -2.4,-0.6 C-1.8,1 1.6,1.4 3.6,0.2 C5.6,-1 5.4,-3.8 3.6,-5', 'ink500', 0.9);
    if (o.crown) {
      // awakened: a crown of short spikes standing on the lid (irregular height and spacing)
      [[-7.4, -0.4, 3.6], [-3.6, -4.9, 4.8], [1.4, -5.6, 3.2], [5.6, -4.1, 5], [7.8, -0.9, 3.4]].forEach((q, i) => {
        const h = q[2] * o.crown, lean = (i - 2) * 0.5;
        if (h < 0.6) return;
        s += F(`M${f(q[0] - 1.4)},${f(q[1] + 0.6)} L${f(q[0] + lean)},${f(q[1] - h)} L${f(q[0] + 1.4)},${f(q[1] + 0.6)} Z`, 'ink') + S(`M${f(q[0] - 0.8)},${f(q[1] + 0.2)} L${f(q[0] + lean * 0.7)},${f(q[1] - h * 0.7)}`, 'ink500', 0.6);
        // paper glint on two spikes, only once they stand (at crown 0.2 the two glints were a pair of dots at one height)
        if (i % 2 && o.crown >= 0.5) s += S(`M${f(q[0] + lean * 0.8)},${f(q[1] - h * 0.75)} L${f(q[0] + lean)},${f(q[1] - h)}`, 'p50', 0.5);
      });
    }
    if (o.crack) s += S('M-7.5,-3.4 L-3.4,-1.8 L-1.6,-3.6 L2.4,-2.2 M4.6,-0.4 L8,0.8', 'p50', 0.7);
    s += mineSpikes(n, seed, k, o.twist, true);
    return sc !== 1 ? G(tr(0, 0, 0, sc), s) : s;
  }
  /** Spawn dust (K4 검수 1차 고침 7): three angular chips at fixed spots, heights ≥ 3 apart (two round specks at one
   * height above the disc read as eyes). */
  const mineDust = (aw) => (aw ? [[-16, -2, 1.3, 1], [-5, -11, 1.6, 2], [11, -5.5, 1.1, 3]] : [[-15, -3, 1.2, 1], [-4, -10, 1.8, 2], [10, -6, 1, 3]])
    .map((q) => F(chipD(q[0], q[1], q[2], 97 + q[3], q[3] * 0.7), 'p300', { st: 'ink300', sw: 0.6 })).join('');
  ART.voidMine['core-start'] = (fr) => (fr === 0 ? mineDust(false) : '') + mine({ k: [0.3, 0.7, 1][fr], scale: [0.72, 0.9, 1][fr] });
  ART.voidMine['core-hold'] = (fr) => mine({ twist: fr ? 0.09 : 0, seed: 91 });
  ART.voidMine['core-end'] = (fr) => mine({ k: [0.75, 0.42, 0][fr], crack: fr > 0, dry: fr === 2 });
  ART.voidMine['core-start-awakened'] = (fr) => (fr === 0 ? mineDust(true) : '') + mine({ n: 8, seed: 93, k: [0.35, 0.75, 1.08][fr], scale: [0.72, 0.9, 1][fr], crown: [0.2, 0.6, 1][fr] });
  ART.voidMine['core-hold-awakened'] = (fr) => mine({ n: 8, seed: 93, k: 1.08, twist: fr ? 0.09 : 0, crown: fr ? 0.9 : 1 });
  // collapse: the disc caves in (inward wedges), bursts into paper shards, settles as ink dust (r 40)
  ART.voidMine['collapse-awakened'] = (fr) => {
    let s = '';
    if (fr === 0) {
      // 검수 R3 (as R2): five inward wedges of uneven length and width, one crack out to the rim of the blot
      [[0.4, 33, 6], [1.6, 24, 3.6], [2.7, 30, 5], [3.9, 22, 3], [5.1, 35, 4.4]].forEach((q) => {
        s += F(brushD([polar(q[1], q[0]), polar(q[1] * 0.6, q[0] + 0.12), polar(9, q[0] + 0.2)], (t) => q[2] * (1 - t) + 0.3), 'ink');
      });
      return s + F(blotD(0, 0, 7.6, 103, 9, 0.35), 'ink') + S('M1.5,-1.5 L-1.5,1 L-3.6,0.4 L-7.4,2.2', 'p50', 0.8);
    }
    if (fr === 1) {
      s += specks(9, 104, 22, 36, 0, TAU, 1, 2, 'ink', false);
      for (let i = 0; i < 7; i++) { const a = i * TAU / 7 + 0.3 + jit(105, i) * 0.6, q = polar(18 + 12 * jit(106, i), a); s += F(chipD(q[0], q[1], 2.6 + 1.8 * jit(107, i), 108 + i, a), 'p50', { st: 'ink', sw: 0.9 }); }
      return s + F(blotD(0, 0, 5, 109, 8, 0.4), 'ink');
    }
    s += specks(14, 110, 8, 36, 0, TAU, 0.7, 1.7, 'ink500', false);
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4, q = polar(24 + 8 * jit(111, i), a); s += F(chipD(q[0], q[1], 1.8, 112 + i, a), 'p300', { st: 'ink300', sw: 0.7 }); }
    return s;
  };

  // ---- blackSun: a floating ink sun (r 26, awakened 32), irregular paper corona behind it, one cyan diamond glint ----
  /** Corona behind the disc: long narrow curved streamers mixed with short fine filaments (never an even spike ring). */
  function corona(R, n, seed, lmin, lmax, k, rmax) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n + (jit(seed, i) - 0.5) * 0.6, long = jit(seed, i + 40) > 0.42;
      const L = Math.min((long ? lerp(lmin + 2, lmax, jit(seed, i + 10)) : lerp(2.2, lmin, jit(seed, i + 10))) * k, rmax - R);
      if (L < 0.8) continue;
      const bw = long ? lerp(1.3, 2.2, jit(seed, i + 20)) : lerp(0.7, 1.1, jit(seed, i + 20)), bend = (jit(seed, i + 30) - 0.5) * (long ? 0.62 : 0.35);
      const pts = samp((t) => polar(R - 2.5 + (L + 2.5) * t, a + bend * t * t / (R / 26)), 6);
      s += F(brushD(pts, (t) => bw * 2 * Math.pow(1 - t, 1.25) + 0.15), 'p50', { st: 'ink', sw: long ? 0.9 : 0.7 });
    }
    return s;
  }
  const diamond = (x, y, s) => F(`M${f(x)},${f(y - 4.4 * s)} L${f(x + 2.2 * s)},${f(y)} L${f(x)},${f(y + 4.4 * s)} L${f(x - 2.2 * s)},${f(y)} Z`, 'ally', { st: 'ink', sw: 0.9 }) + S(`M${f(x)},${f(y - 2.6 * s)} L${f(x)},${f(y + 2.6 * s)}`, 'allyG', 0.6);
  function sun(o) {
    const R = o.R, rmax = o.rmax;
    let s = '';
    if (o.n2) s += corona(R, o.n2, o.seed + 5, 9, 15, o.k, rmax);
    s += corona(R, o.n, o.seed, o.lmin || 5, o.lmax || 13, o.k, rmax);
    s += Cir(0, 0, R, o.dry ? 'ink700' : 'ink');
    if (!o.dry) s += F(`M${P2(polar(R - 1, 160 * RAD))} A${f(R - 1)},${f(R - 1)} 0 0 1 ${P2(polar(R - 1, 292 * RAD))} A${f(R * 1.08)},${f(R * 1.08)} 0 0 0 ${P2(polar(R - 1, 160 * RAD))} Z`, 'ink500');
    if (o.crack) s += S(`M${f(-R * 0.5)},${f(-R * 0.1)} L${f(-R * 0.15)},${f(R * 0.12)} L${f(R * 0.1)},${f(-R * 0.18)} L${f(R * 0.45)},${f(R * 0.05)}`, 'p50', 0.8);
    if (o.glint) { const q = polar(R, -130 * RAD); s += diamond(q[0], q[1], o.glint); }
    return s;
  }
  ART.blackSun['core-start'] = (fr) => (fr === 0 ? F(blotD(0, 0, 10, 121, 9, 0.35), 'ink') + corona(9, 5, 122, 3, 6, 1, 17) : sun({ R: fr === 1 ? 19 : 26, n: 16, seed: 123, k: fr === 1 ? 0.5 : 1, rmax: 39, glint: fr === 2 ? 1 : 0 }));
  ART.blackSun['core-hold'] = (fr) => sun({ R: 26, n: 16, seed: fr ? 125 : 123, k: 1, rmax: 39, glint: 1 });
  ART.blackSun['core-end'] = (fr) => sun({ R: [26, 23, 18][fr], n: 16, seed: 123, k: [0.6, 0.3, 0][fr], rmax: 39, crack: fr > 0, dry: fr === 2, glint: fr === 0 ? 0.8 : 0 });
  ART.blackSun['core-start-awakened'] = (fr) => (fr === 0 ? F(blotD(0, 0, 12, 131, 9, 0.35), 'ink') + corona(11, 6, 132, 3, 7, 1, 21) : sun({ R: fr === 1 ? 24 : 32, n: 20, seed: 133, k: fr === 1 ? 0.55 : 1, rmax: 47, lmin: 6, lmax: 15, glint: fr === 2 ? 1.2 : 0 }));
  ART.blackSun['core-hold-awakened'] = (fr) => sun({ R: 32, n: 20, seed: fr ? 135 : 133, k: 1, rmax: 47, lmin: 6, lmax: 15, glint: 1.2 });
  ART.blackSun['collapse-awakened'] = (fr) => {
    let s = '';
    if (fr === 0) {
      // the corona is sucked in (검수 R2): six strands of uneven length and width wind into the shrinking disc, and the
      // disc carries one crack that runs out to its rim (a zigzag in the middle read as a face)
      [[0.2, 44, 4.6], [1.15, 30, 2.6], [2.3, 39, 3.8], [3.1, 26, 2.2], [4.2, 41, 3.2], [5.3, 33, 2.8]].forEach((q, i) => {
        const pts = samp((t) => polar(lerp(15, q[1], t), q[0] + (0.6 + 0.5 * jit(142, i)) * t * t), 7);
        s += F(brushD(pts, (t) => q[2] * Math.pow(1 - t, 1.2) + 0.2), 'p50', { st: 'ink', sw: 0.9 });
      });
      return s + Cir(0, 0, 17, 'ink') + S('M3,-2.5 L-2,1.5 L-7,0.8 L-12,3.6 L-16.6,4.2', 'p50', 0.9);
    }
    if (fr === 1) {
      s += specks(10, 143, 36, 48, 0, TAU, 1.2, 2.4, 'ink', false);
      s += F(starD(0, 0, 41, 8, 144, 0.2, 0.45), 'p50', { st: 'ink', sw: 1.6 });
      return s + F(blotD(3, -2, 8, 145, 8, 0.5), 'ink') + F(brushD([[3, 5], [4, 12], [3.4, 16]], (t) => 2.4 * (1 - t) + 0.3), 'ink');
    }
    s += specks(16, 146, 10, 46, 0, TAU, 0.8, 1.9, 'ink500', false);
    for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.2, q = polar(28 + 14 * jit(147, i), a); s += F(chipD(q[0], q[1], 2.2, 148 + i, a), 'p300', { st: 'ink300', sw: 0.7 }); }
    return s;
  };

  // ---- eclipseStep: paper brush slash (+x = outward, anchor = outer end at R - 2), eclipse disc under the feet ----
  function slashArt(fr, aw) {
    const N = 26, Lr = fr ? (aw ? 104 : 92) : 118, wmax = aw ? 12 : 10, tail = aw ? 0.74 : 1;
    const cen = samp((t) => [-Lr * t, -1.6 * Math.sin(Math.PI * t)], N);
    const wf = (t) => (t < 0.12 ? lerp(3.6, wmax, t / 0.12) : wmax * Math.pow(Math.max(0, 1 - t) / 0.88, 0.95) + 0.2);
    const body = cen.filter((p, i) => i / N <= tail + 1e-6);
    let s = F(brushD(body, (t) => wf(t * tail)), 'p50', { st: 'ink', sw: 1.2 });
    if (aw) {
      // forked tail: the brush splits into two thin hairs
      const j = body[body.length - 1];
      [-2.6, 2.4].forEach((dy, i) => { s += F(brushD(samp((t) => [lerp(j[0], -Lr, t), j[1] + dy * t + (i ? 0.4 : -0.4) * Math.sin(t * Math.PI)], 6), (t) => 2.2 * (1 - t) + 0.2), 'p50', { st: 'ink', sw: 0.8 }); });
      s += S(smooth(cen.slice(3, Math.round(N * 0.62)).map((p) => [p[0], p[1] + 0.3])), 'ink', 0.9);
    }
    if (fr) s += S(smooth(cen.slice(5, 13).map((p) => [p[0], p[1] + 1.2])), 'ink300', 0.6) + S(smooth(cen.slice(8, 15).map((p) => [p[0], p[1] - 1.6])), 'ink300', 0.6);
    const rim = (sign, t1) => smooth(cen.slice(1, Math.max(3, Math.round(N * t1))).map((p, i) => [p[0], p[1] + sign * (wf((i + 1) / N) / 2 - 0.5)]));
    s += SW(rim(-1, fr ? 0.4 : 0.62), [['ink', 2], ['ally', 1.1]]);
    if (aw) s += SW(rim(1, fr ? 0.2 : 0.3), [['ink', 2], ['ally', 1.1]]);
    return s;
  }
  ART.eclipseStep.slash = (fr) => slashArt(fr, false);
  ART.eclipseStep['slash-awakened'] = (fr) => slashArt(fr, true);
  // feet: ink disc rx ≤ 20 inside the hero ring (rx 24), corona strands outside it (rx 26..31); fewer strands as the
  // invulnerability runs out, and the light returns on the disc rim in the last frame
  function eclipseFeet(fr, aw) {
    // corona: broken tangential paper arcs just outside the hero ring (never a ring of radial ticks)
    const n = aw ? 9 : 7, keep = [1.1, 0.72, 0.42][fr], seed = aw ? 152 : 151;
    let s = '';
    for (let i = 0; i < n; i++) {
      if (jit(seed, i + 60) > keep) continue;
      const a0 = i * TAU / n + (jit(seed, i) - 0.5) * 0.5, sweep = lerp(0.28, 0.72, jit(seed, i + 10)) * (fr === 2 ? 0.55 : 1);
      const rr = 26.8 + 1.4 * jit(seed, i + 20), w = lerp(1.1, aw ? 2.2 : 1.9, jit(seed, i + 30));
      const pts = samp((t) => { const a = a0 + sweep * t; return [Math.cos(a) * rr, 0.42 * Math.sin(a) * rr]; }, 10);
      s += F(brushD(pts, (t) => w * Math.sin(Math.PI * (0.08 + 0.84 * t)) + 0.2), 'p50', { st: 'ink', sw: 0.6 });
    }
    s += `<ellipse cx="0" cy="0" rx="18" ry="7.56" fill="${K.ink}"/>`;
    if (fr === 2) s += S(ellArc(16.6, 6.6, 0, 0, 195 * RAD, 55 * RAD), 'p50', 1.5);
    if (aw && fr < 2) s += F(starD(29.2, -1.4, 2.3, 5, 153), 'p50', { st: 'ink', sw: 0.5 }) + F(starD(-28.6, 2.6, 2, 6, 154), 'p50', { st: 'ink', sw: 0.5 });
    return s;
  }
  ART.eclipseStep.feet = (fr) => eclipseFeet(fr, false);
  ART.eclipseStep['feet-awakened'] = (fr) => eclipseFeet(fr, true);

  // ---- mirrorClone frames: the hero sprite as a line copy (filter) inside a stitched envelope ----
  // Line copy = the alpha edge (1.4) in ink.500 + edges of the ink parts (luminance threshold, 0.55) in ink.300
  // (K4 검수 1차 고침 4: all-ink.300 lines vanished on the Ch5 ground at 0.8x). No ink fill. The hero's own face comes
  // through the filter unchanged in viewpoint; nothing is redrawn on top. `fill` (comparison only, not baked): a paper
  // α 0.2 wash under the lines.
  const CLONE_FILTER = (id, fill) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="-56" y="-79" width="112" height="100" color-interpolation-filters="sRGB">` +
    '<feMorphology in="SourceAlpha" operator="erode" radius="1.4" result="ae"/><feComposite in="SourceAlpha" in2="ae" operator="out" result="ea"/>' +
    '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.7 -5.7232 -0.5768 10 -7.2" result="im"/>' +
    '<feMorphology in="im" operator="erode" radius="0.55" result="ie"/><feComposite in="im" in2="ie" operator="out" result="ei"/>' +
    `<feFlood flood-color="${K.ink300}" result="c3"/><feComposite in="c3" in2="ei" operator="in" result="inner"/>` +
    `<feFlood flood-color="${K.ink500}" result="c5"/><feComposite in="c5" in2="ea" operator="in" result="outer"/>` +
    (fill ? `<feFlood flood-color="${K.p50}" flood-opacity="0.2" result="cp"/><feComposite in="cp" in2="SourceAlpha" operator="in" result="wash"/>` : '') +
    `<feMerge>${fill ? '<feMergeNode in="wash"/>' : ''}<feMergeNode in="inner"/><feMergeNode in="outer"/></feMerge></filter>`;
  /** Stitched envelope per hero state (feet-relative), about 3.5 outside the union of that state's frames: the cyan
   * running stitch 1.5 with dash [5, 3] on an ink layer (bible §3). It hugs the body; it is not a ground ring. */
  const CLONE_ENVELOPE = {
    idle: [[-5, -67], [1, -68.5], [7.5, -67.5], [16, -64.5], [25.5, -58.5], [27, -52], [22, -46.5], [20.5, -40], [21.5, -31], [21.5, -24], [18.5, -14], [18.5, -4], [16, 4.5], [4, 5.5], [-9, 4.5], [-22, 2.5], [-29, -0.5], [-24, -9], [-16, -20], [-22, -28], [-33, -29], [-35, -34], [-30, -38.5], [-14, -44], [-23.5, -51], [-24, -57.5], [-16, -63.5]],
    run: [[-9, -69], [2, -70.5], [14, -69], [27, -64.5], [37, -56], [35.5, -48], [27.5, -42.5], [23.5, -35], [23.5, -24], [22, -13], [22, -3], [18, 4.5], [4, 5], [-12, 5], [-21.5, 2.5], [-23, -8], [-27, -18], [-22, -30], [-19, -38], [-32, -40], [-33.5, -48], [-30, -56.5], [-18, -58], [-15, -64.5]],
    throw: [[-5, -67], [1, -68.5], [7.5, -67.5], [17, -64.5], [29, -58], [30.5, -51.5], [25, -45], [24, -38], [25, -27], [19, -18], [18, -4], [16, 4.5], [4, 5.5], [-9, 4.5], [-24, 2.5], [-30.5, -0.5], [-25, -9], [-17, -20], [-22, -29], [-32, -31], [-34, -37], [-29, -41], [-15, -45], [-24, -51], [-25, -57.5], [-17, -63.5]],
    hurt: [[-8, -67.5], [2, -68.5], [12, -68], [22, -67.5], [25.5, -61], [22, -55], [20.5, -46], [20, -36], [21, -26], [19, -16], [18, -4], [16, 4.5], [4, 5.5], [-10, 4.5], [-20, 3], [-25.5, -1], [-22, -10], [-20, -22], [-21, -34], [-25, -44], [-29, -50], [-29, -57], [-21, -63.5]]
  };
  const CLONE_STITCH = { layers: [['ink', 2.7], ['ally', 1.5]], dash: [5, 3], pad: 0.6 };
  function cloneArt(state, fr, c, o) {
    if (!PN.heroKit || !PN.heroKit.sprite) return placeholder();
    const hero = PN.heroKit.sprite(state, fr, { ring: false, shadow: false, halo: false });
    // the hero kit always defines a blur filter it does not use in sprites; drop it when nothing refers to it
    const body = hero.replace(/<filter id="(hk\d+_)glow"[^>]*>[\s\S]*?<\/filter>/g, (m, p) => (hero.indexOf('url(#' + p + 'glow)') >= 0 ? m : ''));
    const id = c.uid('cl');
    c.defs.push(CLONE_FILTER(id, o && o.fill));
    // throw frame 2 (snap): the hand lets the needle go; the copy keeps the hat, the hand and the coat and drops only the
    // needle beyond the hand (x > 22.5 in the arm band y −42..−22; 검수 R8: the hollow needle outside the envelope, out to
    // +45.9, read as an arrow). The clone's own needles are the shot-* parts.
    let fig = `<g transform="translate(-48 -75)">${body}</g>`;
    if (state === 'throw' && fr === 2) {
      const cid = c.uid('cc');
      c.defs.push(`<clipPath id="${cid}"><path d="M-56,-79 H56 V-42 H22.5 V-22 H56 V21 H-56 Z"/></clipPath>`);
      fig = `<g clip-path="url(#${cid})">${fig}</g>`;
    }
    return `<g filter="url(#${id})">${fig}</g>` +
      SWD(smooth(CLONE_ENVELOPE[state], true), CLONE_STITCH.layers, CLONE_STITCH.dash, CLONE_STITCH.pad);
  }
  [['clone-idle', 'idle'], ['clone-run', 'run'], ['clone-throw', 'throw'], ['clone-hurt', 'hurt']].forEach((q) => {
    ART.mirrorClone[q[0]] = (fr, c, P, o) => cloneArt(q[1], fr, c, o);
  });

  // ---- passives: pops (no cyan). Normal: paper disc r 12 + ink 2 ring + ink symbol. Awakened: ink disc + paper
  // symbol + broken paper ensō (r ≤ 14.5). Circle centre (0,-15); the anchor is the bottom centre ----
  const ENSO = F(brushD(samp((t) => polar(13.3, -50 * RAD + t * 300 * RAD, 0, -15), 30), (t) => 0.5 + 1.7 * Math.sin(Math.PI * Math.pow(t, 0.8))), 'p50');
  const popBase = (aw) => (aw ? Cir(0, -15, 12.4, 'ink') + ENSO : Cir(0, -15, 12, 'p50', { st: 'ink', sw: 2 }));
  const POP_SYMBOL = {
    ironFrame: (ink, cut) => F('M-6.4,-7 C-3,-8 3,-8 6.4,-7 L6.4,-0.5 C6.4,3.6 3.6,6.4 0,8.6 C-3.6,6.4 -6.4,3.6 -6.4,-0.5 Z', ink) +
      S('M-5.2,-4.9 L4.7,2.5', cut, 2.6, { cap: 'butt' }) + Cir(-2.6, -2.9, 0.8, ink) + Cir(2.2, 0.7, 0.8, ink),
    magnetSigil: (ink, cut) => G('rotate(-38)', S('M-4.3,3.6 L-4.3,-0.9 A4.3,4.3 0 0 1 4.3,-0.9 L4.3,3.6', ink, 3.3, { cap: 'butt' }) +
      F('M-6.1,3.4 h3.6 v2.8 h-3.6 Z', cut, { st: ink, sw: 0.8 }) + F('M2.5,3.4 h3.6 v2.8 h-3.6 Z', cut, { st: ink, sw: 0.8 })) +
      F('M-3,-3.9 L-6.4,-7.6 L-4.6,-9.2 L-1.4,-5.4 Z', cut, { st: ink, sw: 0.8 }) + S('M-4.7,-6.6 L-3.6,-5.4', ink, 0.7),
    paperWard: (ink, cut) => [[-3.4, -2.8, -12], [2.9, -1.2, 9], [-0.3, 3.2, -3]].map((q) => G(tr(q[0], q[1], q[2]),
      F('M-2.9,-3.7 L2.9,-3.7 L3,1.6 Q0,4.7 -3,1.6 Z', ink, { st: cut, sw: 0.9 }) + S('M-1.6,-2.2 L1.6,-2.2', cut, 0.6))).join(''),
    recoveryThread: (ink, cut) => G('rotate(-30)', `<ellipse cx="4.4" cy="0" rx="1.9" ry="4.9" fill="${K[ink]}"/>` + F('M-4.4,-3.2 L4.4,-3.2 L4.4,3.2 L-4.4,3.2 Z', ink) +
      S('M-2.4,-3.2 L-2,3.2 M0.2,-3.2 L0.6,3.2 M2.6,-3.2 L3,3.2', cut, 0.6) + `<ellipse cx="-4.4" cy="0" rx="1.9" ry="4.9" fill="${K[ink]}" stroke="${K[cut]}" stroke-width="0.6"/>`) +
      S('M1.6,-2.6 C3.8,-6.6 6.4,-5.6 7.6,-8.4', ink, 1.1),
    // a tilted holed 엽전 in 3/4 (K4 검수 1차 고침 5: a round coin with a centred hole read as a target or an eye, and a
    // grey ball with a star as a bomb). Awakened = a paper coin; its hole shows the ink disc. A 5-point sparkle sits on
    // the upper-left rim; nothing outside the coin in the upper-right quadrant. (The optional coin on edge behind was
    // tried and dropped: at 1x it stuck out like a pan handle.)
    coinFever: (ink, cut, aw) => coin3q(-1, 2, 6.4, -20, 0.55, aw ? { face: 'p50', rim: 'p300', line: 'ink', lw: 1.1 } : { face: 'ink100', rim: 'ink700', line: 'ink', lw: 1.1 }) +
      F(starD(-5.5, -1.5, 2.6, 5, 171), 'p50', { st: 'ink', sw: 0.6 }),
    // needle from upper right to a point at lower left, three stitches under the point (nothing circles the disc centre)
    executionMark: (ink, cut, aw) => stitchArcs(-3, 2, 4.4, 62, [2, 1.6, 1.2], [2.2, 2], [[ink, 1.5]]) +
      G(tr(1.25, -2.25, Math.atan2(8.5, -8.5) / RAD), needleBody(-6, 6, 1.2, { tip: 2.6, eye: -4.2, eyeFill: aw ? 'ink' : 'p50', lw: 0.9 }))
  };
  Object.keys(POP_SYMBOL).forEach((id) => {
    ART[id].pop = () => popBase(false) + G('translate(0 -15)', POP_SYMBOL[id]('ink', 'p50', false));
    ART[id]['pop-awakened'] = () => popBase(true) + G('translate(0 -15)', POP_SYMBOL[id]('p50', 'ink', true));
  });

  // ---- ironFrame shield: cyan stitch ellipse (rx 30, ry 41, centre (0,-33)), five ink girders with paper rivets ----
  ART.ironFrame.shield = (fr) => {
    const dry = fr === 2, len = fr === 0 ? 0.65 : 1, pt = (phi, k) => [30 * Math.cos(phi) * k, -33 + 41 * Math.sin(phi) * k];
    let s = fr === 0 ? SW(ellArc(30, 41, 0, -33, -Math.PI / 2, TAU * 0.6), [['ink', 2.6], ['ally', 1.4]], { dash: [3.6, 5.2] })
      : SW(ellD(30, 41, 0, -33), [['ink', 2.6], ['ally', 1.4]], { dash: [3.6, 5.2], a: dry ? 0.55 : 1 });
    [[-152, -108], [-72, -28], [8, 52], [72, 108], [128, 172]].forEach((g) => {
      const k = dry ? 0.97 : 0.94, A = pt(g[0] * RAD, k), B = pt(g[1] * RAD, k), m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
      const a = [lerp(m[0], A[0], len), lerp(m[1], A[1], len)], b = [lerp(m[0], B[0], len), lerp(m[1], B[1], len)];
      s += S(line([a, b]), dry ? 'ink300' : 'ink', 1.4, { cap: 'butt' }) + Cir(a[0], a[1], 1.3, dry ? 'p300' : 'p50', { st: dry ? 'ink300' : 'ink', sw: 0.6 }) + Cir(b[0], b[1], 1.3, dry ? 'p300' : 'p50', { st: dry ? 'ink300' : 'ink', sw: 0.6 });
    });
    return s;
  };

  // ---- paperWard: three folded paper plates beside the shoulders and behind the back (face zone left empty) ----
  const LAMELLA = 'M-4,-6 L4,-6 L4.4,3 Q0,7.4 -4.4,3 Z';
  const lamella = (dry) => F(LAMELLA, dry ? 'p300' : 'p50', { st: dry ? 'ink300' : 'ink', sw: 1.2 }) + F('M4,-6 L4.4,3 L1.2,1.6 Z', dry ? 'ink100' : 'p300') + S('M-2.4,-3.8 L2.4,-3.8', dry ? 'ink300' : 'ink', 0.8);
  ART.paperWard.plates = (fr) => {
    const P = [[-24, -47, -24], [25, -41, 18], [-25, -28, -38]], c0 = [0, -40];
    return P.map((q) => {
      const v = [q[0] - c0[0], q[1] - c0[1]], l = Math.hypot(v[0], v[1]), push = [-3, 0, 2.2][fr];
      return G(tr(q[0] + v[0] / l * push, q[1] + v[1] / l * push, q[2] * [0.5, 1, 1.25][fr], [0.85, 1, 0.95][fr]), lamella(fr === 2));
    }).join('');
  };
  ART.paperWard['plate-awakened'] = (fr) => F('M-6,-3.4 L4,-3.6 Q7,0 4,3.6 L-6,3.4 Z', 'p50', { st: 'ink', sw: 1.2 }) +
    F(fr ? 'M4,3.6 Q7,0 4,-3.6 L2.6,0.4 Z' : 'M-6,-3.4 L-1.4,-3.5 L-4.2,0.2 Z', 'p300') + S(fr ? 'M-3.6,-1.6 L-3.6,1.8' : 'M0.4,-1.8 L0.4,1.8', 'ink', 0.8);

  // ---- coinFever: pickup glint (5-7 point paper sparkle + part of a coin rim), awakened frenzy coins at the feet ----
  ART.coinFever.glint = (fr) => (fr === 0
    ? SW(arc(5.4, 120 * RAD, 110 * RAD, -1.8, 2.2), [['ink', 2.6], ['ink100', 1.3]]) + F(starD(0.8, -0.8, 8.2, 6, 161), 'p50', { st: 'ink', sw: 0.8 })
    : SW(arc(5.4, 150 * RAD, 60 * RAD, -1.8, 2.2), [['ink300', 2.2], ['ink100', 1.1]]) + F(starD(0.8, -0.8, 5, 6, 162), 'p50', { st: 'ink', sw: 0.7 }));
  /** A tossed 엽전 in 3/4: face with a see-through square hole, a darker rim below for its thickness.
   * The rim is the face pushed down by d and has its own hole there, so through the face's hole one sees the far wall
   * (a rim-coloured band along the top of the hole) and then whatever lies behind the coin (K4 검수 1차 고침 5).
   * o: {face, rim, line, lw} tokens (default ink.100 face, ink.700 rim, ink line 0.9). */
  function coin3q(x, y, s, tilt, sq, o) {
    o = o || {};
    const ry = s * (sq || 0.5), h = s * 0.3, v = h * (sq || 0.5) * 1.6, d = Math.min(1.6, ry * 0.5);
    const hole = (dy) => `M${f(-h)},${f(-v + dy)} L${f(-h)},${f(v + dy)} L${f(h)},${f(v + dy)} L${f(h)},${f(-v + dy)} Z`;
    const ln = o.line || 'ink', lw = o.lw || 0.9, eo = { rule: 'evenodd' };
    return G(tr(x, y, tilt), F(ellD(s, ry, 0, d) + ' ' + hole(d), o.rim || 'ink700', eo) + S(ellD(s, ry, 0, d), ln, lw) +
      F(ellD(s, ry) + ' ' + hole(0), o.face || 'ink100', eo) + S(ellD(s, ry), ln, lw) + S(hole(0), ln, lw * 0.65));
  }
  // frenzy (K4 검수 1차 고침 6): coins rise only in two columns beside the body (x −40..−26 and +24..+40), from y +1 to
  // −30, at most two per side with a height gap ≥ 6; paper stars at |x| ≥ 20, y ≥ −30. Layer ally (outside the
  // silhouette, so it never covers the body); nothing above −34 (face zone).
  const FRENZY = [
    // [x, phase, size, squash, tilt]: left column phases 0 / 0.5, right 0.25 / 0.75 (height gap 15.5 on each side)
    [-34, 0, 4.6, 0.55, -18], [-30, 0.5, 3.8, 0.42, 22], [29, 0.25, 4.2, 0.6, 14], [35, 0.75, 4.8, 0.36, -26]
  ];
  ART.coinFever['frenzy-awakened'] = (fr) => {
    let s = '';
    [[-23, 0.15, 2.4, 181], [22, 0.6, 2.2, 182]].forEach((q) => { const u = (fr / 3 + q[1]) % 1; s += F(starD(q[0], -6 - 22 * u, q[2], 5, q[3]), 'p50', { st: 'ink', sw: 0.5 }); });
    FRENZY.forEach((q) => { const u = (fr / 3 + q[1]) % 1; s += coin3q(q[0], 1 - 31 * u, q[2], q[4], q[3]); });
    return s;
  };

  // ---- executionMark: one needle stuck in at a slant; a few stitches sewn round its point (K4 검수 1차 고침 2) ----
  // The stitch arc is centred on the needle's POINT, spans ≤ 120° on the side away from the needle (60° → 180°, below
  // and left), and never closes into a ring: stitches of different lengths with gaps ≥ 1.8. The thread leaves the eye
  // outward (up-right) with one bend and does not come back. No ✕, no ⊘ (circle + slash), no reticle.
  /** Stitches along an arc round (cx, cy): start angle a0 (deg), lengths and gaps in units of arc length. */
  function stitchArcs(cx, cy, r, a0, lens, gaps, layers) {
    let a = a0 * RAD, s = '';
    lens.forEach((l, i) => { s += SW(arc(r, a, l / r, cx, cy), layers); a += (l + (gaps[i] || 0)) / r; });
    return s;
  }
  // inner: [r, start°, stitch lengths, gaps] along the arc. Gaps ≥ the ink width (2.6) so the stitches stay apart
  // (mark 64° → 174°, boss 62° → 178°, both ≤ 120°); outer: the boss's two short stitches 3.5 further out
  const MARK_SPEC = {
    mark: { B: [6, -22], T: [-4, -9.5], w: 1.4, tip: 4, inner: [7, 64, [3, 2.4, 1.8], [3.2, 3]], outer: null, tail: [[10.5, -20], [11.5, -25.5]] },
    boss: { B: [12, -34.5], T: [-5, -15], w: 1.6, tip: 5, inner: [9, 62, [3, 2.6, 2.2, 1.8], [3, 2.9, 2.8]], outer: [12.5, 88, [2.2, 1.8], [7.8]], tail: [[16.5, -32.5], [17.2, -37.2]] }
  };
  function markArt(fr, boss) {
    const M = boss ? MARK_SPEC.boss : MARK_SPEC.mark, B = M.B, T0 = M.T, ang = Math.atan2(T0[1] - B[1], T0[0] - B[0]);
    // frame 0: the point is not in yet (2.6 short at the point end) and only the first stitch is sewn
    const T = fr === 0 ? [T0[0] - Math.cos(ang) * 2.6, T0[1] - Math.sin(ang) * 2.6] : T0;
    const L = Math.hypot(T[0] - B[0], T[1] - B[1]), mid = [(T[0] + B[0]) / 2, (T[1] + B[1]) / 2];
    const STITCH = [['ink', 2.6], ['ally', 1.4], ['allyG', 0.4]], I = M.inner;
    let s = stitchArcs(T0[0], T0[1], I[0], I[1], fr === 0 ? I[2].slice(0, 1) : I[2], I[3], STITCH);
    if (M.outer && fr > 0) s += stitchArcs(T0[0], T0[1], M.outer[0], M.outer[1], M.outer[2], M.outer[3], STITCH);
    const E = [B[0] + Math.cos(ang) * 2.4, B[1] + Math.sin(ang) * 2.4];   // the eye
    s += SW(`M${P2(E)} Q${P2(M.tail[0])} ${P2(fr === 0 ? [lerp(M.tail[0][0], M.tail[1][0], 0.5), lerp(M.tail[0][1], M.tail[1][1], 0.5)] : M.tail[1])}`, [['ink', 2], ['ally', 1.1]]);
    s += G(tr(mid[0], mid[1], ang / RAD), needleBody(-L / 2, L / 2, M.w, { tip: M.tip, eye: -L / 2 + 2.4 }));
    return fr === 2 ? `<g opacity="0.55">${s}</g>` : s;
  }
  ART.executionMark.mark = (fr) => markArt(fr, false);
  ART.executionMark['markBoss-awakened'] = (fr) => markArt(fr, true);
  // @@ART

  /** Placeholder for a part not drawn yet: a small paper lozenge on ink at the anchor. */
  const placeholder = () => F('M-3,0 L0,-2 L3,0 L0,2 Z', 'p50', { st: 'ink', sw: 1 });

  function stamp(group, part, o) {
    o = o || {};
    const P = partOf(group, part);
    const fr = clamp(Math.floor(o.frame || 0), 0, P.frames - 1);
    const c = Ctx();
    const fn = ART[group] && ART[group][part];
    const body = fn ? fn(fr, c, P, o) : placeholder();
    return c.out(`<g transform="translate(${P.anchor[0]} ${P.anchor[1]})">${body}</g>`, group);
  }
  /** A stamp placed with its anchor on (x, y), turned by `a` rad. */
  function place(group, part, frame, x, y, a, o) {
    o = o || {};
    const P = partOf(group, part);
    return `<g transform="${tr(x, y, a ? a / RAD : 0)}${o.flip ? ' scale(-1 1)' : ''} translate(${-P.anchor[0]} ${-P.anchor[1]})"${op(o.a)}>${stamp(group, part, { frame })}</g>`;
  }

  // ==== 5. draw / hit ====
  // draw(id, stage, opts) composes stamps and parametric shapes for review and golden images; hit() returns the same
  // judgment shapes in the same local frame. Origins: work order §3 (hero feet, beam start, zone centre).
  const DRAW = {}, HIT = {};
  const minimal = (o) => o.lod === 'minimal';
  const still = (o) => !!(o.reduced || minimal(o));
  /** Frame of a stamp: opts.frame wins; loop parts stop on `still` under reduced motion / minimal; prog parts follow p. */
  function frameOf(group, part, o, p) {
    const P = partOf(group, part);
    if (o.frame != null) return ((Math.floor(o.frame) % P.frames) + P.frames) % P.frames;
    if (P.drive === 'loop') return 0;
    if (P.drive === 'prog') return clamp(Math.floor((p == null ? 0.5 : p) * P.frames), 0, P.frames - 1);
    return 0;
  }
  const prog = (o, def) => clamp(o.progress != null ? o.progress : def, 0, 1);
  const lvl = (arr, o) => arr[o.level - 1];
  /** Places a stamp unless it is decoration and the LOD is minimal. */
  function put(o, group, part, p, x, y, a, extra) {
    const P = partOf(group, part);
    if (P.lod === 'deco' && minimal(o)) return '';
    return place(group, part, frameOf(group, part, o, p), x, y, a, extra);
  }

  // -- projectiles: fans of shots at a review distance from the hero's feet --
  function fan(n, spread, D) {
    const out = [];
    for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * spread; out.push({ x: Math.cos(a) * D, y: Math.sin(a) * D, a }); }
    return out;
  }
  function needleFan(o, st) {
    const Z = SIZES.needleStorm, n = o.points || (o.awakened ? Z.countAwakened : lvl(Z.count, o));
    return fan(n, o.awakened ? Z.spreadAwakened : Z.spread, st === 'start' ? 24 : 120);
  }
  DRAW.needleStorm = (st, o) => {
    const sfx = o.awakened ? '-awakened' : '', part = (st === 'shard' ? 'travel' : st) + sfx, p = prog(o, 0.5);
    let s = '';
    if (st === 'shard') s += put(o, 'needleStorm', 'shard-awakened', p, 120, 0, -50 * RAD);
    needleFan(o, st).forEach((q) => { s += put(o, 'needleStorm', part, p, q.x, q.y, q.a); });
    return s;
  };
  HIT.needleStorm = (st, o) => ({ circles: needleFan(o, st).map((q) => [f(q.x), f(q.y), SIZES.needleStorm.r]) });

  function knifeFan(o, st) {
    const Z = SIZES.fanKnives, n = o.points || (o.awakened ? Z.countAwakened : lvl(Z.count, o));
    return fan(n, Z.spread, st === 'start' ? 24 : st === 'end' && o.awakened ? 84 : 120);
  }
  DRAW.fanKnives = (st, o) => {
    const aw = o.awakened, part = st + (aw ? '-awakened' : ''), p = prog(o, 0.5);
    // awakened knives end on the way back, so their end (like their return) faces the hero with the handle first
    const back = aw && (st === 'return' || st === 'end');
    return knifeFan(o, st).map((q) => put(o, 'fanKnives', part, p, q.x, q.y, q.a + (back ? Math.PI : 0))).join('');
  };
  HIT.fanKnives = (st, o) => ({ circles: knifeFan(o, st).map((q) => [f(q.x), f(q.y), SIZES.fanKnives.r]) });

  // -- chain: review points 90 apart, y ±30 alternating --
  function chainPts(o) {
    const Z = SIZES.chainSpark, n = o.points || (o.awakened ? Z.countAwakened : lvl(Z.count, o)), pts = [[0, 0]];
    for (let k = 1; k <= n; k++) pts.push([90 * k, k % 2 ? -30 : 30]);
    return pts;
  }
  const CHAIN_T = { start: 0.03, hold: 0.08, end: 0.14, burst: 0.12 };
  DRAW.chainSpark = (st, o) => {
    const b = SPEC.bolt, pts = chainPts(o), last = pts[pts.length - 1], aw = o.awakened;
    const seed = o.reduced ? b.seeds[0] : b.seeds[(o.frame || 0) % 2];
    const bp = boltPts(pts, seed);
    let s = '';
    if (aw) s += threadRing(SIZES.chainSpark.burstR, threadAlpha(o.t != null ? o.t : CHAIN_T[st]), false, last[0], last[1]);
    if (st === 'start') s += bolt(cutPts(bp, polyLen(bp) * prog(o, 0.6)), aw);
    else if (st === 'hold') s += bolt(bp, aw);
    else s += boltFade(bp, aw, st === 'burst' ? 0.5 : 1 - 0.5 * prog(o, 0.4));
    if (aw && st === 'burst') s += put(o, 'chainSpark', 'burst-awakened', prog(o, 0.5), last[0], last[1], 0);
    return s;
  };
  HIT.chainSpark = (st, o) => {
    if (!o.awakened) return null;
    const pts = chainPts(o), last = pts[pts.length - 1];
    return { circles: [[last[0], last[1], SIZES.chainSpark.burstR]] };
  };

  // -- beams: +x from the beam start, review length 640 --
  const beamW = (id, o) => o.width || (o.awakened ? SIZES[id].widthAwakened : lvl(SIZES[id].width, o));
  const beamL = (o) => o.length || 640;
  const CHILL_AT = [[110, 12], [210, 19], [320, 28], [440, 38], [570, 54]];
  DRAW.frostLine = (st, o) => {
    const w = beamW('frostLine', o), L = beamL(o), seed = 7, aw = o.awakened, sfx = aw ? '-awakened' : '';
    if (st === 'chill' || st === 'root') {
      // chill marks are decoration (lod deco); a reference drawing cannot be empty, so minimal still shows them here
      return CHILL_AT.map((q) => place('frostLine', (st === 'root' ? 'root' : 'chill') + q[1] + (st === 'root' ? '-awakened' : ''), 0, q[0], 0, 0)).join('');
    }
    const p = prog(o, st === 'start' ? 0.6 : 0.5);
    let s = '';
    if (st === 'start') {
      s += beamBand('frostLine', L, w) + chalkCore(L, seed, p, 1, 1);
      if (!minimal(o)) s += chalkDust(L, w, seed, p, 1);
      s += put(o, 'frostLine', 'origin' + sfx, p * SPEC.chalk.grow, 0, 0, 0);
    } else if (st === 'hold') {
      s += beamBand('frostLine', L, w) + chalkCore(L, seed, 1, 1, 1);
      if (!minimal(o)) s += chalkDust(L, w, seed, 1, 1);
      s += put(o, 'frostLine', 'origin' + sfx, 0.5, 0, 0, 0);
    } else {
      s += beamBand('frostLine', L, w, 1 - p) + chalkCore(L, seed, 1, 1 - p, clamp(1 - 2 * p, 0, 1));
      if (!minimal(o)) s += chalkDust(L, w, seed, 1, 1);
      s += put(o, 'frostLine', 'origin' + sfx, 0.99, 0, 0, 0);
    }
    return s;
  };
  HIT.frostLine = (st, o) => (st === 'chill' || st === 'root' ? null : { capsules: [[0, 0, beamL(o), 0, beamW('frostLine', o)]] });

  const FISSURE_AT = [210, 440];
  const RAIL_T = { start: 0.03, hold: 0.09, end: 0.18, fissure: 0.12 };
  DRAW.railSpear = (st, o) => {
    const w = beamW('railSpear', o), L = beamL(o), aw = o.awakened, sfx = aw ? '-awakened' : '';
    const p = prog(o, st === 'start' ? 0.6 : 0.5);
    let s = '';
    if (aw) {
      FISSURE_AT.forEach((x) => { if (st === 'fissure') s += put(o, 'railSpear', 'fissure-awakened', p, x, 0, 0); });
      FISSURE_AT.forEach((x) => { s += threadRing(SIZES.railSpear.fissureR, threadAlpha(o.t != null ? o.t : RAIL_T[st]), false, x, 0); });
    }
    if (o.copy) [-1, 1].forEach((k) => { s += G(tr(0, k * SPEC.spearCopy.offset), spearCopy(L, w)); });
    if (st === 'start') {
      s += beamBand('railSpear', L, w) + spear(Math.max(SPEC.spear.head + 6, L * p), 1);
      s += put(o, 'railSpear', 'origin' + sfx, p * SPEC.spear.grow, 0, 0, 0) + put(o, 'railSpear', 'flash' + sfx, 0, 0, 0, 0);
    } else if (st === 'hold' || st === 'fissure') {
      s += beamBand('railSpear', L, w, st === 'fissure' ? 0.6 : 1) + (st === 'fissure' ? spearFade(L, 0.6) : spear(L, 1));
      s += put(o, 'railSpear', 'origin' + sfx, st === 'fissure' ? 0.9 : 0.5, 0, 0, 0);
    } else {
      s += beamBand('railSpear', L, w, 1 - p) + spearFade(L, 1 - 0.6 * p);
      s += put(o, 'railSpear', 'origin' + sfx, 0.99, 0, 0, 0);
    }
    return s;
  };
  HIT.railSpear = (st, o) => {
    const w = beamW('railSpear', o), L = beamL(o), h = { capsules: [[0, 0, L, 0, w]], circles: [] };
    if (o.copy) [-1, 1].forEach((k) => h.capsules.push([0, k * SPEC.spearCopy.offset, L, k * SPEC.spearCopy.offset, w]));
    if (o.awakened) FISSURE_AT.forEach((x) => h.circles.push([x, 0, SIZES.railSpear.fissureR]));
    return h;
  };

  // -- orbit: blade i at angle t·speed + 2πi/n (forward and outer blades share the spacing) --
  function blades(o) {
    const Z = SIZES.orbitScythes, fwd = o.points || lvl(Z.blades, o), n = fwd + (o.awakened ? Z.outerBlades : 0);
    const R0 = o.radius || lvl(Z.radius, o), t = o.t != null ? o.t : 0.35, out = [];
    for (let i = 0; i < n; i++) {
      const rev = i >= fwd, sp = rev ? Z.outerSpeed : Z.speed, r = rev ? R0 + Z.outerRadiusAdd : R0, a = t * sp + TAU * i / n;
      out.push({ rev, r, a, dir: Math.sign(sp), x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return out;
  }
  DRAW.orbitScythes = (st, o) => blades(o).map((b) => (minimal(o) ? '' : orbitTrail(b.r, b.a, b.dir)) +
    put(o, 'orbitScythes', b.rev ? 'blade-outer-awakened' : 'blade', 0, b.x, b.y, b.a)).join('');
  HIT.orbitScythes = (st, o) => ({ circles: blades(o).map((b) => [f(b.x), f(b.y), SIZES.orbitScythes.r]) });

  // -- ally zones --
  const zoneR = (id, o) => o.radius || (o.awakened ? SIZES[id].radiusAwakened : lvl(SIZES[id].radius, o));
  function stitchProgress(R, p, o, ex) {
    ex = ex || {};
    let s = guideRing(R, ex.a) + stitchRing(R, p, { a: ex.a, gap: ex.gap });
    if (p > 0.001 && p < 0.999) { const h = stitchHeadAt(R, p); s += put(o, 'common', 'stitchHead', 0, h.x, h.y, h.a); }
    return s;
  }
  DRAW.boneMortar = (st, o, c) => {
    const R = zoneR('boneMortar', o), aw = o.awakened, sfx = aw ? '-awakened' : '';
    if (st === 'warn') {
      const p = prog(o, 0.6);
      return zoneFill(R) + zoneDots(c, R, 'disc') + stitchProgress(R, p, o) + put(o, 'boneMortar', 'shell' + sfx, p, 0, 0, 0);
    }
    const p = prog(o, 0.3), al = threadAlpha(p * SPEC.thread.seconds);
    let s = '';
    if (!minimal(o)) {
      // bone dust round the ring (검수 R4: an even spacing with a spike on every other one read as radial ticks):
      // one slot per 40 units, angle jittered ±0.35 slot, a quarter of the slots skipped, the spiked variant (0) a third
      const B = SPEC.blastDust, n = Math.max(6, Math.round(TAU * R / B.every));
      for (let k = 0; k < n; k++) {
        if (jit(B.seed, k + 100) < B.skip) continue;
        const a = -Math.PI / 2 + (k + 0.5 + (jit(B.seed, k) - 0.5) * 2 * B.jitter) * TAU / n;
        s += place('boneMortar', 'dust', jit(B.seed, k + 200) < B.spike ? 0 : 1, Math.cos(a) * R, Math.sin(a) * R, a);
      }
    }
    s += threadRing(R, al);
    if (aw) s += threadRing(R * SIZES.boneMortar.aftershock, al, true);
    s += put(o, 'boneMortar', 'blast' + sfx, p, 0, 0, 0);
    return s;
  };
  HIT.boneMortar = (st, o) => {
    const R = zoneR('boneMortar', o), h = { circles: [[0, 0, R]] };
    if (o.awakened && st === 'blast') h.circles.push([0, 0, f(R * SIZES.boneMortar.aftershock)]);
    return h;
  };

  function vortex(id, st, o, c) {
    const R = zoneR(id, o), aw = o.awakened, sfx = aw ? '-awakened' : '', sw = SPEC.swirl[id];
    const rot = still(o) ? 0 : sw.speed * (o.t != null ? o.t : 0.8);
    if (st === 'collapse') {
      const p = prog(o, 0.3);
      return threadRing(R + SIZES[id].collapseAdd, threadAlpha(p * SPEC.thread.seconds)) + put(o, id, 'collapse-awakened', p, 0, 0, 0);
    }
    const p = prog(o, st === 'start' ? 0.6 : 0.5);
    const fade = st === 'end' ? 1 - p : 1, gap = st === 'end' ? lerp(SPEC.unravel.gap[0], SPEC.unravel.gap[1], p) : 1;
    let s = zoneFill(R, fade) + zoneDots(c, R, 'band', fade) + swirlArms(R, id, rot, fade);
    if (st === 'start') s += put(o, id, 'core-start' + sfx, p, 0, 0, 0);
    else if (st === 'hold') s += put(o, id, 'core-hold' + sfx, 0, 0, 0, 0);
    else s += put(o, id, 'core-end', p, 0, 0, 0);
    s += stitchProgress(R, st === 'start' ? p : 1, o, { a: fade, gap });
    return s;
  }
  DRAW.voidMine = (st, o, c) => vortex('voidMine', st, o, c);
  DRAW.blackSun = (st, o, c) => vortex('blackSun', st, o, c);
  HIT.voidMine = (st, o) => ({ circles: [[0, 0, zoneR('voidMine', o) + (st === 'collapse' ? SIZES.voidMine.collapseAdd : 0)]] });
  HIT.blackSun = (st, o) => ({ circles: [[0, 0, zoneR('blackSun', o) + (st === 'collapse' ? SIZES.blackSun.collapseAdd : 0)]] });

  // -- mirror clone: clones at (0, ±42) beside the hero (aim +x); two flank shots, awakened +2 aimed shots --
  const AIM_AT = [360, 0];
  function cloneShots(o, st) {
    const Z = SIZES.mirrorClone, D = st === 'volley' ? 20 : 120, out = [];
    [-1, 1].forEach((k) => out.push({ x: D, y: k * Z.offset, a: 0, aimed: false }));
    if (o.awakened) [-1, 1].forEach((k) => { const a = Math.atan2(AIM_AT[1] - k * Z.offset, AIM_AT[0]); out.push({ x: Math.cos(a) * D, y: k * Z.offset + Math.sin(a) * D, a, aimed: true }); });
    return out;
  }
  DRAW.mirrorClone = (st, o) => {
    const Z = SIZES.mirrorClone, p = prog(o, st === 'volley' ? 0.5 : 0.5);
    let s = '';
    // the clones copy the hero's own state and frame; the reference uses the throw snap (volley) and follow (travel)
    [-1, 1].forEach((k) => { s += place('mirrorClone', 'clone-throw', o.frame != null ? o.frame : st === 'volley' ? 2 : 3, 0, k * Z.offset, 0); });
    if (st === 'volley') [-1, 1].forEach((k) => { s += tether(0, 0, 0, k * Z.offset, 1 - 0.4 * p); });
    const shot = st === 'volley' ? 'shot-start' : 'shot-travel';
    cloneShots(o, st).forEach((q) => { s += put(o, 'mirrorClone', shot + (q.aimed ? '-awakened' : ''), p, q.x, q.y, q.a); });
    return s;
  };
  HIT.mirrorClone = (st, o) => ({ circles: cloneShots(o, st).map((q) => [f(q.x), f(q.y), SIZES.mirrorClone.r]) });

  // -- eclipse step: slash ring R, 5+L decorative rays whose outer end sits at R - 2, feet disc for the invulnerability --
  const eclipseR = (o) => zoneR('eclipseStep', o);
  DRAW.eclipseStep = (st, o) => {
    const R = eclipseR(o), Z = SIZES.eclipseStep, sfx = o.awakened ? '-awakened' : '';
    if (st === 'afterimage') {
      const r = Math.round(R * Z.afterimage), p = prog(o, 0.55);
      let s = place('mirrorClone', 'clone-throw', 1, 0, 0, 0);
      s += p >= 0.999 ? threadRing(r, 1) : stitchProgress(r, p, o);
      return s;
    }
    const p = prog(o, 0.4), n = lvl(Z.rays, o);
    let s = put(o, 'eclipseStep', 'feet' + sfx, p, 0, 0, 0) + slashRing(R, 1);
    for (let i = 0; i < n; i++) { const a = TAU * i / n + 0.3; s += put(o, 'eclipseStep', 'slash' + sfx, p, Math.cos(a) * (R - 2), Math.sin(a) * (R - 2), a); }
    return s;
  };
  HIT.eclipseStep = (st, o) => ({ circles: [[0, 0, st === 'afterimage' ? Math.round(eclipseR(o) * SIZES.eclipseStep.afterimage) : eclipseR(o)]] });

  // -- passives: origin = hero feet; pops sit on the head top - 4 (hero top = feet - 64) --
  const POP_AT = [0, -68];
  const pop = (id, o) => put(o, id, o.awakened ? 'pop-awakened' : 'pop', 0, POP_AT[0], POP_AT[1], 0);
  DRAW.ironFrame = (st, o) => {
    if (st === 'pop') return pop('ironFrame', o);
    if (st === 'aura') return put(o, 'ironFrame', 'shield', 0.5, 0, 0, 0, { a: 0.6 });
    return put(o, 'ironFrame', 'shield', prog(o, 0.5), 0, 0, 0);
  };
  DRAW.magnetSigil = (st, o) => {
    if (st === 'pop' || minimal(o)) return pop('magnetSigil', o);   // the pulse is decoration
    const t = o.t != null ? o.t : 0.2;
    return pulseRings(t, o.reduced, st === 'pulse' ? 2 : 1) + pop('magnetSigil', o);
  };
  /** Six plates fly out; angle jittered ±10°, end radius 126..140 (검수 R5: an even 60° spacing read as clock ticks). */
  function wardPlates(o) {
    const s = SPEC.wardRing.plates, p = o.reduced ? 1 : prog(o, 0.6), e = 1 - Math.pow(1 - p, 2), out = [];
    for (let i = 0; i < s.count; i++) {
      const a = -Math.PI / 2 + TAU * (i + 0.5) / s.count + (jit(s.seed, i) - 0.5) * 2 * s.angleJitter * RAD;
      const r = lerp(s.from, lerp(s.toMin, s.to, jit(s.seed, i + 50)), e);
      out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, a, v: i % 2 });
    }
    return out;
  }
  DRAW.paperWard = (st, o) => {
    if (st === 'pop') return pop('paperWard', o);
    if (st === 'plates') return put(o, 'paperWard', 'plates', prog(o, 0.4), 0, 0, 0);
    let s = wardRing(SIZES.paperWard.pushR, 1) + put(o, 'paperWard', 'plates', 0.4, 0, 0, 0);
    wardPlates(o).forEach((q) => { s += place('paperWard', 'plate-awakened', q.v, q.x, q.y, q.a); });
    if (minimal(o)) s = wardRing(SIZES.paperWard.pushR, 1) + put(o, 'paperWard', 'plates', 0.4, 0, 0, 0);
    return s;
  };
  HIT.paperWard = (st) => (st === 'ward' ? { circles: [[0, 0, SIZES.paperWard.pushR]] } : null);
  const RECOVERY_D = 64;
  DRAW.recoveryThread = (st, o) => {
    if (st === 'pop') return pop('recoveryThread', o);
    if (st === 'aura') {
      const A = SPEC.aura, p = prog(o, 0.65);
      return G(tr(0, A.centerY), guideRing(A.stitchR) + stitchRing(A.stitchR, p) + (p < 0.999 ? (() => { const h = stitchHeadAt(A.stitchR, p); return put(o, 'common', 'stitchHead', 0, h.x, h.y, h.a); })() : ''));
    }
    let s = '';
    for (let k = 0; k < SIZES.recoveryThread.shots; k++) { const a = k * TAU / 8; s += put(o, 'recoveryThread', 'shot-travel-awakened', 0.5, Math.cos(a) * RECOVERY_D, Math.sin(a) * RECOVERY_D, a); }
    return s;
  };
  HIT.recoveryThread = (st) => {
    if (st !== 'volley') return null;
    const out = [];
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8; out.push([f(Math.cos(a) * RECOVERY_D), f(Math.sin(a) * RECOVERY_D), SIZES.recoveryThread.r]); }
    return { circles: out };
  };
  const GLINT_AT = [30, -6];
  DRAW.coinFever = (st, o) => {
    if (st === 'pop') return pop('coinFever', o);
    // the frenzy reference shows the frenzy alone: the pickup glint at GLINT_AT sat on the right coin column
    if (st === 'frenzy') return put(o, 'coinFever', 'frenzy-awakened', 0, 0, 0, 0);
    return put(o, 'coinFever', 'glint', prog(o, 0.3), GLINT_AT[0], GLINT_AT[1], 0) || pop('coinFever', o);
  };
  const MARK_AT = [64, -30];
  DRAW.executionMark = (st, o) => {
    if (st === 'pop') return pop('executionMark', o);
    return put(o, 'executionMark', st === 'markBoss' ? 'markBoss-awakened' : 'mark', prog(o, 0.5), MARK_AT[0], MARK_AT[1], 0);
  };

  function resolveStage(id, stage, awakened) {
    const m = META[id], list = awakened ? m.stages.awakened : m.stages.normal;
    if (list.indexOf(stage) >= 0) return stage;
    if (stage === 'aura' && awakened && AURA_TWIN[id]) return AURA_TWIN[id];
    const twin = STAGE_TWIN[stage];
    if (twin && list.indexOf(twin) >= 0) return twin;
    return list.indexOf(m.main) >= 0 ? m.main : list[0];
  }

  function draw(id, stage, opts) {
    const m = META[id];
    if (!m) throw new Error('skillVfx: unknown skill ' + id);
    const o = Object.assign({ level: 5 }, opts || {});
    o.level = clamp(Math.round(o.level), 1, 5);
    o.awakened = !!o.awakened;
    const st = resolveStage(id, stage || m.main, o.awakened);
    const c = Ctx();
    const body = DRAW[id] ? DRAW[id](st, o, c) : placeholder();
    return c.out(body || placeholder(), id);
  }
  function hit(id, stage, opts) {
    const m = META[id];
    if (!m) throw new Error('skillVfx: unknown skill ' + id);
    const o = Object.assign({ level: 5 }, opts || {});
    o.level = clamp(Math.round(o.level), 1, 5);
    o.awakened = !!o.awakened;
    const st = resolveStage(id, stage || m.main, o.awakened);
    const h = HIT[id] ? HIT[id](st, o) : null;
    return { circles: (h && h.circles) || [], capsules: (h && h.capsules) || [] };
  }

  PN.skillVfx = {
    version: '1.0',
    K,
    ids: IDS.slice(),
    groups: GROUPS.slice(),
    META,
    SIZES,
    SPEC,
    jit,
    parts: (group) => (PARTS[group] || []).map((p) => Object.assign({}, p, { box: p.box.slice(), anchor: p.anchor.slice() })),
    stamp,
    draw,
    hit
  };
})(window.PN);
