// k-arsenal-fx.js — 흑백 타격 생존전 먹극화 · PAPER NOIR INK — battlefield art of the arsenal's 44 weapons → window.PN.arsenalFx
// Work order K10: docs/art/briefs/arsenal-fx.md (B7, art-director 2026-10-16). API: art/concept-kit/API-arsenal-fx.md.
// Delivery 1 of 3: the skeleton (tokens, META for all 44, SPEC, jit, layout / paths / lobPath, parts / stamp, draw /
// overlay) and the main stage, plain and awakened, of the 22 weapons that fire no projectile (strike impact, nova burst,
// lob landing, chain jump, beam stroke, halo sweep). Delivery 2: the lob flight of the four lob weapons (stage
// 'flight', the flying objects, SPEC.flight, the cluster pots' `mini` and lobPath's mini path). Delivery 3, round 1
// (3a): the 17 P1 awakening gimmicks (one stage each, GSTAGE; ground pieces SPEC.zone, the drawn shapes SPEC.gimmick,
// the enemy overlays SPEC.overlay / overlay()). Delivery 3, round 2, part 1 (3b1): the P2 gimmicks that are enemy
// marks and feet overlays (GSTAGE2, more overlay keys), the crow's primaries (review 5 R1) and the eclipse's layers
// (decision 2). Part 2 (3b2): the P2 follow-up effects (work order §4.4: bursts, event rings, the leap, the rewound,
// amplified and linked chains, the branch lances, the re-sweep, the deflected shot, the hero's haste, the caltrop snap;
// their SPEC under new SPEC.gimmick keys), joined to the 3b1 stages where the gimmick is the same (stain, fear, crack,
// pollen), and review 7 F1 (lost), F2 (thorn), R2 (stain 1), R4 (frost 1, class 12), §5-6 (the spores' size). 3b2-r1
// (review 8 F1): the pollen ring back to the brief's ink + cyan dashed sandwich (SPEC and its draw only, no stamp).
// Two forms, as in K4 / K11: (1) fixed-size stamps baked into the arsenal-fx pack as afx/<group>/<part>/<frame>
// (stamp()), never stretched; (2) shapes that follow a radius, a length or a list of points, drawn by the renderer
// from the numbers in SPEC (draw() paints the same rules as reference / golden art; layout(), paths() and lobPath()
// are the formulas the renderer ports to TypeScript).
// Units are world units (1440x900 at zoom 1.0, 1x px). Deterministic: no Math.random / Date; jitter is jit(seed, i).
// Every call returns one <g class="kaf kaf-<id>"> with its own <defs>; ids are 'kaf<N>_' per call (counter, never reset).
// Colours: the 11 tokens in K, written as the implemented palette values (palette.ts), so the bake's COLOR_MAP leaves
// them as they are. Nothing here calls PN.arsenal (K9) or PN.hazards (K11); PN.skillVfx is not read either. Only the
// reference composition with opts.context reads PN.enemies / PN.heroKit; stamp() and the default draw() read nothing.
window.PN = window.PN || {};
(function (PN) {
  'use strict';

  // ==== 1. tokens & helpers ====
  const K = Object.freeze({
    ink: '#101312', ink700: '#343936', ink500: '#46423d', ink300: '#8c8579', ink100: '#bcb4a5',
    p50: '#fffff8', paper: '#f4f4ef', p300: '#d8dad3', ally: '#00a8c6', allyD: '#007c94', allyG: '#cff6ff'
  });
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  let UID = 0;
  const f = (n) => Math.round(n * 100) / 100;
  const P2 = (p) => f(p[0]) + ',' + f(p[1]);
  const line = (a, close) => 'M' + a.map(P2).join(' L') + (close ? ' Z' : '');
  const colour = (t) => K[t] || t;
  /** Jitter 0..1 (SPEC.jit): the same hash as K4 / K11 and worldRenderer, so the renderer reproduces it. */
  const jit = (seed, i) => ((Math.imul(seed * 31 + i, 2654435761) >>> 0) % 1000) / 1000;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const polar = (r, a, cx, cy) => [(cx || 0) + Math.cos(a) * r, (cy || 0) + Math.sin(a) * r];
  const op = (a) => (a != null && a < 0.999 ? ` opacity="${f(Math.max(0, a))}"` : '');
  const tr = (x, y, deg, s) => `translate(${f(x)} ${f(y)})` + (deg ? ` rotate(${f(deg)})` : '') + (s && s !== 1 ? ` scale(${f(s)})` : '');
  const G = (t, body, a) => `<g transform="${t}"${op(a)}>${body}</g>`;
  const GA = (body, a) => (a != null && a < 0.999 ? `<g${op(a)}>${body}</g>` : body);
  const smoothstep = (u) => u * u * (3 - 2 * u);
  const easeOut = (u) => 1 - (1 - u) * (1 - u);

  // per-call context: unique ids + defs
  function Ctx() {
    const id = 'kaf' + (++UID) + '_';
    const defs = [];
    let n = 0;
    return {
      id, defs,
      uid: (tag) => id + (tag || 'u') + (n++),
      out: (body, cls) => `<g class="kaf kaf-${cls}"><defs>${defs.join('')}</defs>${body}</g>`
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
  /** Sandwich stroke: layers [[token, width, alpha?], ...] from the bottom up (bible §5.3). */
  const SW = (d, layers, o) => layers.map((l) => S(d, l[0], l[1], Object.assign({}, o || {}, { a: (l[2] == null ? 1 : l[2]) * ((o && o.a) == null ? 1 : o.a) }))).join('');
  /** Dashed sandwich, butt ends: the bottom (ink) layer runs `pad` past both ends of every dash above it. */
  function SWD(d, layers, dash, pad, o) {
    o = o || {};
    return layers.map((l, i) => {
      const a = (l[2] == null ? 1 : l[2]) * (o.a == null ? 1 : o.a);
      return i === 0 && pad
        ? S(d, l[0], l[1], Object.assign({}, o, { a, cap: 'butt', dash: [dash[0] + 2 * pad, Math.max(0.05, dash[1] - 2 * pad)], off: pad }))
        : S(d, l[0], l[1], Object.assign({}, o, { a, cap: 'butt', dash }));
    }).join('');
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
  function E(x, y, rx, ry, t, o) {
    o = o || {};
    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${t === 'none' ? 'none' : colour(t)}"` +
      (o.st ? ` stroke="${colour(o.st)}" stroke-width="${f(o.sw || 1)}"` : '') + op(o.a) + '/>';
  }
  const circD = (cx, cy, r) => `M${f(cx - r)},${f(cy)} a${f(r)},${f(r)} 0 1 0 ${f(2 * r)},0 a${f(r)},${f(r)} 0 1 0 ${f(-2 * r)},0 Z`;
  const ellD = (cx, cy, rx, ry) => `M${f(cx - rx)},${f(cy)} a${f(rx)},${f(ry)} 0 1 0 ${f(2 * rx)},0 a${f(rx)},${f(ry)} 0 1 0 ${f(-2 * rx)},0 Z`;
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
  /** Points along the open Catmull-Rom spline through pts (the curve smooth() draws), k per segment. */
  function crPts(pts, k) {
    const n = pts.length, g = (i) => pts[clamp(i, 0, n - 1)], out = [];
    for (let i = 0; i < n - 1; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      for (let j = 0; j < k; j++) {
        const t = j / k, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (p2[c] - p0[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t3)));
      }
    }
    out.push(pts[n - 1].slice());
    return out;
  }
  /** Points of fn(t) for t = 0..1 in n steps. */
  const samp = (fn, n) => { const o = []; for (let i = 0; i <= n; i++) o.push(fn(i / n)); return o; };
  /** Each segment split into k parts (keeps the corners). */
  function dens(pts, k) {
    const o = [pts[0]];
    for (let i = 1; i < pts.length; i++) for (let j = 1; j <= k; j++) o.push([lerp(pts[i - 1][0], pts[i][0], j / k), lerp(pts[i - 1][1], pts[i][1], j / k)]);
    return o;
  }
  const polyLen = (pts) => pts.reduce((t, p, i) => (i ? t + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  /** The part of a polyline between length fractions t0 and t1. */
  function cutAlong(pts, t0, t1) {
    const L = polyLen(pts), a = L * t0, b = L * t1, out = [];
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i], l = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const s0 = acc, s1 = acc + l;
      if (s1 >= a && s0 <= b && l > 0) {
        const u0 = clamp((a - s0) / l, 0, 1), u1 = clamp((b - s0) / l, 0, 1);
        const P = [lerp(p[0], q[0], u0), lerp(p[1], q[1], u0)], Q = [lerp(p[0], q[0], u1), lerp(p[1], q[1], u1)];
        if (!out.length) out.push(P);
        out.push(Q);
      }
      acc = s1;
    }
    return out.length > 1 ? out : [pts[0], pts[0]];
  }
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
  /** Small irregular chip: a 4-5 sided polygon around (x, y). */
  function chipD(x, y, s, seed, a0) {
    const n = 4 + (seed % 2), p = [];
    for (let i = 0; i < n; i++) p.push(polar(s * (0.55 + 0.45 * jit(seed, i)), (a0 || 0) + i * TAU / n + (jit(seed, i + 20) - 0.5) * 0.7, x, y));
    return line(p, true);
  }
  /** Irregular closed blot with separate x / y radii. */
  function blotE(cx, cy, rx, ry, seed, n, amp) {
    n = n || 9; amp = amp == null ? 0.3 : amp;
    const p = [];
    for (let i = 0; i < n; i++) {
      const k = 1 - amp / 2 + amp * jit(seed, i), a = i * TAU / n + (jit(seed, i + 30) - 0.5) * 0.4;
      p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return smooth(p, true);
  }
  /** Tapered stroke from p0 (width w0) to p1 (width w1), optionally through a middle point. */
  const taper = (pts, w0, w1, t, o) => F(brushD(pts, (u) => lerp(w0, w1, u)), t || 'ink', o);
  /** Paper sparkle (5-6 uneven points, ink rim). */
  const sparkle = (x, y, r, n, seed) => F(starD(x, y, r, n, seed, -Math.PI / 2, 0.38), 'p50', { st: 'ink', sw: 0.7 });
  /** §1.8 doubled rim of an awakened object: a paper line round the silhouette and an ink line outside it (strokes
   *  under the body: ink to 3.0 outside the silhouette edge, paper to 2.2, the object's own outline covers the rest). */
  const rimmed = (sil, body) => (sil ? S(sil, 'ink', 6, {}) + S(sil, 'p50', 4.4, {}) : '') + body;
  /** An ink burst: a blot of radius r and `arms` tapered arms of uneven length and angle, some with a drop. */
  function inkBurst(cx, cy, r, seed, o) {
    o = o || {};
    const n = o.arms || 7, fy = o.flat || 1, col = o.col || 'ink', reach = o.reach || [1.5, 2.6], wk = o.wk || 1;
    let s = F(blotE(cx, cy, r, r * fy, seed, 10, 0.35), col, { a: o.a });
    for (let i = 0; i < n; i++) {
      const a = (i + (jit(seed, i + 300) - 0.5) * 0.7) * TAU / n + (o.rot || 0);
      const L = r * lerp(reach[0], reach[1], jit(seed, i + 320)), w = r * lerp(0.32, 0.56, jit(seed, i + 340)) * wk;
      const c = Math.cos(a), sn = Math.sin(a), bend = (jit(seed, i + 380) - 0.5) * 0.5;
      const p0 = [cx + c * r * 0.55, cy + sn * r * 0.55 * fy], p1 = [cx + c * L, cy + sn * L * fy];
      const pm = [lerp(p0[0], p1[0], 0.55) - sn * L * bend * 0.3, lerp(p0[1], p1[1], 0.55) + c * L * bend * 0.3 * fy];
      s += F(brushD([p0, pm, p1], (t) => w * Math.pow(1 - t, 0.8) + 0.3), col, { a: o.a });
      if (jit(seed, i + 360) < (o.drops == null ? 0.5 : o.drops)) s += Cir(p1[0] + c * w * 1.1, p1[1] + sn * w * 1.1 * fy, Math.max(0.6, w * 0.42), col, { a: o.a });
    }
    return s;
  }
  /** An ink burst with the arms placed by hand: [deg, reach × r, width × r, drop 0/1] (inkBurst's arm and drop shapes). */
  function inkBurstAt(cx, cy, r, seed, arms, o) {
    o = o || {};
    const fy = o.flat || 1, col = o.col || 'ink';
    let s = F(blotE(cx, cy, r, r * fy, seed, 10, 0.35), col, { a: o.a });
    arms.forEach(([deg, reach, wk, drop], i) => {
      const a = deg * RAD, L = r * reach, w = r * wk, c = Math.cos(a), sn = Math.sin(a), bend = (jit(seed, i + 380) - 0.5) * 0.5;
      const p0 = [cx + c * r * 0.55, cy + sn * r * 0.55 * fy], p1 = [cx + c * L, cy + sn * L * fy];
      const pm = [lerp(p0[0], p1[0], 0.55) - sn * L * bend * 0.3, lerp(p0[1], p1[1], 0.55) + c * L * bend * 0.3 * fy];
      s += F(brushD([p0, pm, p1], (t) => w * Math.pow(1 - t, 0.8) + 0.3), col, { a: o.a });
      if (drop) s += Cir(p1[0] + c * w * 1.1, p1[1] + sn * w * 1.1 * fy, Math.max(0.6, w * 0.42), col, { a: o.a });
    });
    return s;
  }
  /** Torn paper burst: rays [deg, length] round (cx, cy) (clockwise order), valleys at `inner` × the shorter neighbour;
   *  some long rays end in two torn tips. Uneven by design: never a symmetric star. */
  function tornD(cx, cy, rays, inner, seed) {
    const p = [];
    rays.forEach(([deg, L], i) => {
      const nx = rays[(i + 1) % rays.length], a = deg * RAD;
      let a2 = nx[0] * RAD;
      if (a2 <= a) a2 += TAU;
      if (L > 14 && jit(seed, i) < 0.45) p.push(polar(L * 0.8, a - 0.08, cx, cy), polar(L * 0.66, a - 0.02, cx, cy), polar(L, a + 0.04, cx, cy));
      else p.push(polar(L, a, cx, cy));
      p.push(polar(Math.min(L, nx[1]) * (inner + 0.12 * jit(seed, i + 20)), (a + a2) / 2 + (jit(seed, i + 40) - 0.5) * 0.25, cx, cy));
    });
    return line(p, true);
  }

  /** The affine m applied to one path's data (the part of TX that works on `d`). */
  function txPath(d, m) {
    const P = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
    const V = (x, y) => [m[0] * x + m[2] * y, m[1] * x + m[3] * y];
    const det = m[0] * m[3] - m[1] * m[2], sc = Math.sqrt(Math.abs(det)), rot = Math.atan2(m[1], m[0]) / RAD;
    const tok = d.match(/[a-zA-Z]|-?\d*\.?\d+/g) || [];
    let out = '', i = 0, cmd = '';
    while (i < tok.length) {
      if (/[a-zA-Z]/.test(tok[i])) { cmd = tok[i++]; out += cmd; if (cmd === 'Z' || cmd === 'z') continue; }
      if (cmd === 'A' || cmd === 'a') {
        const q = (cmd === 'A' ? P : V)(+tok[i + 5], +tok[i + 6]);
        out += `${f(+tok[i] * sc)},${f(+tok[i + 1] * sc)} ${f(+tok[i + 2] + rot)} ${tok[i + 3]} ${det < 0 ? 1 - tok[i + 4] : tok[i + 4]} ${P2(q)} `;
        i += 7;
      } else {
        const q = (cmd === cmd.toUpperCase() ? P : V)(+tok[i], +tok[i + 1]);
        out += P2(q) + ' ';
        i += 2;
      }
    }
    return out.trim();
  }
  /** Applies the affine m = [a, b, c, d, e, f] (x' = a·x + c·y + e, y' = b·x + d·y + f) to the geometry of a markup
   *  string: path data (absolute M L C Q A Z, relative a) and circle centres. A turned <g> hands getBBox the turned box
   *  of all its content (C7 would measure far too wide), so turned objects carry real coordinates instead. For rotations
   *  and near-uniform scales only (radii scale by √|det|); ellipses inside must be paths (ellD). */
  function TX(markup, m) {
    const P = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
    const sc = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
    return markup.replace(/ d="([^"]*)"/g, (a, d) => ` d="${txPath(d, m)}"`)
      .replace(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g, (a, x, y, r) => { const q = P(+x, +y); return `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(+r * sc)}"`; });
  }
  /** A point through the affine m. */
  const apM = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
  /** Affine helpers: rotation by deg about (cx, cy), scale, translation, and A∘B (B first). */
  const rotM = (deg, cx, cy) => { const a = deg * RAD, c = Math.cos(a), s = Math.sin(a); cx = cx || 0; cy = cy || 0; return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy]; };
  const scaleM = (sx, sy) => [sx, 0, 0, sy == null ? sx : sy, 0, 0];
  const transM = (x, y) => [1, 0, 0, 1, x, y];
  const mulM = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
  const chainM = (...ms) => ms.reduce((a, b) => mulM(a, b));
  /** Crystal blade along deg from (0,0): wide base, a shoulder, a hard point, one branch on the long ones. */
  function spikeD(deg, len, w0, seed, ox, oy, flat) {
    const a = deg * RAD, fy = flat || 1, u = [Math.cos(a), Math.sin(a) * fy], ul = Math.hypot(u[0], u[1]), uu = [u[0] / ul, u[1] / ul], n = [-uu[1], uu[0]];
    const at = (t, s) => [(ox || 0) + uu[0] * t + n[0] * s, (oy || 0) + uu[1] * t + n[1] * s];
    const w = w0 + len * 0.07;
    let d = line([at(-1, -w), at(len * 0.6, -w * 0.82), at(len, 0), at(len * 0.68, w * 0.66), at(-1, w)], true);
    if (len > 15) {
      const t = len * (0.42 + 0.12 * jit(seed, 1)), sg = jit(seed, 2) < 0.5 ? 1 : -1, bl = len * (0.26 + 0.1 * jit(seed, 3)), ba = Math.atan2(uu[1], uu[0]) + sg * (0.9 + 0.2 * jit(seed, 4));
      const B = at(t, 0), bu = [Math.cos(ba), Math.sin(ba)], bn = [-bu[1], bu[0]], bw = w * 0.5;
      d += ' ' + line([[B[0] - bn[0] * bw - bu[0], B[1] - bn[1] * bw - bu[1]], [B[0] + bu[0] * bl * 0.7 - bn[0] * bw * 0.5, B[1] + bu[1] * bl * 0.7 - bn[1] * bw * 0.5], [B[0] + bu[0] * bl, B[1] + bu[1] * bl], [B[0] + bn[0] * bw - bu[0], B[1] + bn[1] * bw - bu[1]]], true);
    }
    return d;
  }
  /** Paper crystals with an ink rim drawn under the paper (the rim never eats the thin blade). */
  const frostFill = (d, rim, last) => S(d, last ? 'ink300' : 'ink', rim * 2, {}) + F(d, last ? 'p300' : 'p50');

  // ==== 2. data ====
  // [id, name (ko.json skill.<id>), rarity, kind, look, geo (arsenal.ts: radius/length/count/jumps = [base, per level])]
  const ROWS = [
    ['inkDarts', '먹침', 'common', 'volley', 'needleStorm', { count: [2, 0.25], size: 4 }],
    ['brushQuills', '붓깃', 'common', 'volley', 'fanKnives', { count: [3, 0.5], size: 5 }],
    ['sealArrows', '인장 화살', 'rare', 'volley', 'needleStorm', { count: [1, 0.25], size: 6 }],
    ['frostNeedles', '서리침', 'rare', 'volley', 'needleStorm', { count: [2, 0.25], size: 4.5 }],
    ['thunderNeedles', '뇌침', 'rare', 'volley', 'needleStorm', { count: [1, 0.5], size: 4.5 }],
    ['twinBlades', '쌍날', 'common', 'volley', 'fanKnives', { count: [2, 0.25], size: 6 }],
    ['ghostVolley', '혼령 일제사격', 'epic', 'volley', 'mirrorClone', { count: [4, 0.5], size: 5 }],
    ['headsmanDarts', '망나니 침', 'legendary', 'volley', 'needleStorm', { count: [1, 0.5], size: 4.5 }],
    ['paperStorm', '종이 폭풍', 'rare', 'burst', 'fanKnives', { count: [8, 1], size: 5 }],
    ['inkBloom', '먹꽃', 'rare', 'burst', 'needleStorm', { count: [6, 1], size: 4.5 }],
    ['thornHalo', '가시 테', 'epic', 'burst', 'needleStorm', { count: [12, 1.5], size: 4 }],
    ['starShards', '별조각', 'epic', 'burst', 'mirrorClone', { count: [5, 0.75], size: 5.5 }],
    ['sunNeedles', '해바늘', 'mythic', 'burst', 'needleStorm', { count: [16, 2], size: 5 }],
    ['inkDrizzle', '먹 이슬비', 'common', 'spray', 'needleStorm', { count: [1, 0], size: 3.5 }],
    ['pinHail', '핀 우박', 'rare', 'spray', 'fanKnives', { count: [1, 0.25], size: 4.5 }],
    ['tailGuard', '꼬리 방패', 'common', 'rear', 'fanKnives', { count: [3, 0.5], size: 5 }],
    ['smokeTail', '연막 꼬리', 'rare', 'rear', 'needleStorm', { count: [2, 0.25], size: 4.5 }],
    ['gravePins', '묘침', 'epic', 'rear', 'needleStorm', { count: [5, 0.5], size: 4.5 }],
    ['trackingSeals', '추적 인장', 'rare', 'seeker', 'needleStorm', { count: [3, 0.5], size: 4.5 }],
    ['huntersMarks', '사냥꾼 표식', 'epic', 'seeker', 'mirrorClone', { count: [4, 0.5], size: 5 }],
    ['crowFeathers', '까마귀 깃', 'rare', 'seeker', 'fanKnives', { count: [5, 0.5], size: 5 }],
    ['bossbane', '보스 사냥침', 'legendary', 'seeker', 'needleStorm', { count: [1, 0.25], size: 5.5 }],
    ['inkLightning', '먹번개', 'rare', 'strike', 'chainSpark', { count: [2, 0.5], radius: [56, 0] }],
    ['brushDownpour', '붓 폭우', 'epic', 'strike', 'boneMortar', { count: [4, 0.5], radius: [46, 0] }],
    ['fallingScroll', '족자 낙하', 'epic', 'strike', 'boneMortar', { count: [1, 0.25], radius: [110, 0] }],
    ['seventhSeal', '일곱째 인장', 'mythic', 'strike', 'voidMine', { count: [7, 1], radius: [58, 0] }],
    ['inkPulse', '먹 파동', 'common', 'nova', 'boneMortar', { radius: [135, 8] }],
    ['frostRing', '서리 고리', 'rare', 'nova', 'blackSun', { radius: [160, 9] }],
    ['thunderclap', '천둥 박수', 'epic', 'nova', 'chainSpark', { radius: [120, 8] }],
    ['silenceBell', '침묵의 종', 'legendary', 'nova', 'voidMine', { radius: [220, 12] }],
    ['inkPots', '먹단지', 'common', 'lob', 'boneMortar', { count: [1, 0.25], radius: [80, 6], delay: 0.55, scatter: 0 }],
    ['clusterPots', '송이 단지', 'rare', 'lob', 'boneMortar', { count: [3, 0.5], radius: [56, 4], delay: 0.6, scatter: 70 }],
    ['tarJar', '타르 항아리', 'epic', 'lob', 'voidMine', { count: [1, 0.25], radius: [100, 7], delay: 0.7, scatter: 0 }],
    ['meteorBrush', '유성 붓', 'legendary', 'lob', 'boneMortar', { count: [1, 0.25], radius: [140, 10], delay: 1.0, scatter: 0 }],
    ['sparkThread', '불꽃실', 'common', 'chain', 'chainSpark', { jumps: [3, 0.5], hop: 260 }],
    ['stormThread', '폭풍실', 'epic', 'chain', 'chainSpark', { jumps: [6, 0.75], hop: 300 }],
    ['frostChainlet', '서리 사슬', 'rare', 'chain', 'chainSpark', { jumps: [4, 0.5], hop: 280 }],
    ['inkLance', '먹창', 'rare', 'beam', 'railSpear', { length: [600, 20], width: 12, directions: 1 }],
    ['wideBrush', '넓은 붓', 'epic', 'beam', 'frostLine', { length: [380, 15], width: 34, directions: 1 }],
    ['crossStrokes', '십자 획', 'epic', 'beam', 'railSpear', { length: [460, 18], width: 14, directions: 4 }],
    ['judgmentLine', '심판선', 'mythic', 'beam', 'railSpear', { length: [900, 30], width: 18, directions: 1 }],
    ['inkOrbit', '먹 궤도', 'common', 'halo', 'orbitScythes', { radius: [120, 6], inner: 40 }],
    ['wardRing', '수호 고리', 'rare', 'halo', 'eclipseStep', { radius: [90, 5], inner: 0 }],
    ['eclipseHalo', '일식 테', 'legendary', 'halo', 'eclipseStep', { radius: [210, 10], inner: 110 }]
  ];
  const IDS = ROWS.map((r) => r[0]);
  const KINDS = ['volley', 'burst', 'spray', 'rear', 'seeker', 'strike', 'nova', 'lob', 'chain', 'beam', 'halo'];
  const MAIN = { strike: 'impact', nova: 'burst', lob: 'land', chain: 'jump', beam: 'stroke', halo: 'sweep' };
  // the object stamp that stands for each weapon (C15); null where the weapon has no object (the line or ring is it)
  const OBJECT = {
    inkLightning: 'bolt', brushDownpour: 'stroke-a', fallingScroll: 'scroll', seventhSeal: 'seal',
    inkPulse: null, frostRing: 'shard-a', thunderclap: 'clap', silenceBell: 'bell',
    inkPots: 'pot', clusterPots: 'pot-m', tarJar: 'jar', meteorBrush: 'comet',   // the flying objects (delivery 2)
    sparkThread: 'spark', stormThread: null, frostChainlet: null,
    inkLance: 'tassel', wideBrush: 'brush', crossStrokes: null, judgmentLine: 'inkbox',
    inkOrbit: null, wardRing: 'knot-a', eclipseHalo: 'ribbon-a'
  };
  // delivery 1: the main stage of the 22 weapons without projectiles; delivery 2: the flight of the four lobs
  const DRAWN_FX = new Set(Object.keys(OBJECT));
  const DRAWN_LOB = new Set(['inkPots', 'clusterPots', 'tarJar', 'meteorBrush']);
  // delivery 3a: the P1 awakening gimmicks (work order §4.1), one stage each (stage names as the §7.2 commands use them)
  const GSTAGE = {
    frostNeedles: 'freeze', twinBlades: 'spin', pinHail: 'caltrop', smokeTail: 'smoke', gravePins: 'grave', trackingSeals: 'triangle',
    huntersMarks: 'prey', crowFeathers: 'crow', inkLightning: 'pillar', brushDownpour: 'surge', fallingScroll: 'unroll',
    seventhSeal: 'eighth', silenceBell: 'silence', inkPots: 'fire', tarJar: 'gather', meteorBrush: 'mark', eclipseHalo: 'total'
  };
  // delivery 3b1: the P2 gimmicks drawn as enemy marks and feet overlays (work order §4.3), one stage each (priority 2).
  // 3b2 adds the follow-up effects (§4.4): to the same stage where the gimmick already has one (stain, fear, crack,
  // pollen: the burst or the ring joins the marks), a new stage for the rest (priority 2)
  const GSTAGE2 = { inkDarts: 'stain', headsmanDarts: 'fear', inkBloom: 'pollen', thornHalo: 'thorn', smokeTail: 'lost', gravePins: 'bound', bossbane: 'crack', frostNeedles: 'frost', wardRing: 'weak',
    brushQuills: 'dab', sealArrows: 'topple', thunderNeedles: 'leap', tailGuard: 'rear', inkPulse: 'bump', thunderclap: 'echo', clusterPots: 'split', sparkThread: 'rewind',
    stormThread: 'amplify', frostChainlet: 'link', inkLance: 'branch', wideBrush: 'resweep', inkOrbit: 'deflect', meteorBrush: 'haste', pinHail: 'snap' };
  const isGimmick = (id, stage) => GSTAGE[id] === stage || GSTAGE2[id] === stage;
  // the object stamp of the weapons that fire projectiles, from their gimmick (C15 against the K9 icon); null: none
  const GOBJECT = { twinBlades: 'spin', pinHail: 'caltrop-a', smokeTail: 'puff-a', gravePins: 'grave-a', trackingSeals: 'sealStrike', huntersMarks: 'mark-prey', crowFeathers: 'crow',
    inkDarts: 'mark-stain2', headsmanDarts: 'mark-fear', inkBloom: 'spore-a', thornHalo: 'thorn28', bossbane: 'mark-crack3',
    brushQuills: 'dab', sealArrows: 'topple', thunderNeedles: 'leapHit', tailGuard: 'rearHit' };

  /** Parametric shapes and placement rules (work order §1.5); token names, numbers and English words only. */
  const SPEC = {
    version: '1.0-d3b2-r1',
    jit: { mul: 31, hash: 2654435761, mod: 1000 },
    headY: -66, headLift: 26, footClear: 26, faceZone: [-8, -58, 18, -34],
    rim: {
      ally: { layers: [['ink', 2.6], ['ally', 1.4]], dash: [6, 4], pad: 0.6 },
      pad: { layers: [['ink', 3.4], ['ally', 1.8], ['allyG', 0.6]], inside: [['ink', 4], ['ally', 2.4], ['allyG', 0.8]] }
    },
    // awakened rings add a thin line at R - inset; cyan cores are 1.5 x as long; objects get the doubled rim (§1.8)
    awakened: {
      inset: 6, layers: [['ink', 1], ['p50', 0.6]], coreScale: 1.5, count: 1, reach: 1.2,
      object: { offset: 1.2, paper: 1, ink: 0.8, sparkle: { points: [5, 6], r: [2.4, 3] } },
      prims: ['stroke', 'band', 'multi', 'jag', 'ripple', 'halo']
    },
    // decal stamps: alpha 1 for the first half of their life, then down to 0
    decal: { fadeAt: 0.5 },
    life: {
      inkLightning: { mark: 0.3, decal: 0.6 }, brushDownpour: { mark: 0.3, decal: 0.9 }, fallingScroll: { mark: 0.45 },
      seventhSeal: { mark: 0.36, decal: 1.2 }, inkPulse: { mark: 0.3 }, frostRing: { mark: 0.45 }, thunderclap: { mark: 0.3 },
      silenceBell: { mark: 0.5 }, inkPots: { mark: 0.36, decal: 1.2 }, clusterPots: { mark: 0.3 }, tarJar: { mark: 0.4, decal: 1.5 },
      meteorBrush: { mark: 0.45, decal: 1.5 }, sparkThread: { mark: 0.18 }, stormThread: { mark: 0.18 },
      frostChainlet: { mark: 0.18, decal: 0.48 }, inkLance: { mark: 0.28 }, wideBrush: { mark: 0.28 },
      crossStrokes: { mark: 0.28 }, judgmentLine: { mark: 0.28 }, inkOrbit: { mark: 0.3 }, wardRing: { mark: 0.3 },
      eclipseHalo: { mark: 0.3 }
    },
    // ---- rings: strike / nova / lob blasts (the hit circle: centre line exactly on R) ----
    // punch {scale, seconds, reducedMax}: every layer of a stroke / ripple ring is m times as wide in the first moment,
    // m = 1 + (scale - 1)(1 - u)², u = clamp(age / seconds); under reduced motion scale is at most reducedMax. The centre
    // line stays on R(grow). band / jag / multi rings have no punch.
    ring: {
      inkLightning: { prim: 'stroke', layers: [['ink', 3.4], ['ally', 1.8], ['allyG', 0.6]], gaps: { n: [2, 3], deg: [8, 14] }, punch: { scale: 2, seconds: 0.1, reducedMax: 1.5 }, grow: { from: 0.7, seconds: 0.08 }, fade: { at: 0.6 } },
      brushDownpour: { prim: 'band', token: 'ink', width: [1.5, 6], knots: 13, gaps: { n: [5, 7], deg: [12, 26] }, endTaper: 7, core: { layers: [['ink', 4], ['ally', 1.8]], span: [30, 50], at: 'mid', dab: true }, grow: { from: 0.8, seconds: 0.06 }, fade: { at: 0.6 } },
      fallingScroll: { prim: 'ripple', arcs: [{ at: 0.72, span: [15, 165], layers: [['ink', 3], ['p50', 1.6]] }, { at: 1, span: [10, 170], layers: [['ink', 3.4], ['p50', 2]] }], full: { layers: [['ink', 1.6, 0.6]] }, core: { layers: [['ink', 3.2], ['ally', 1.6]], span: [60, 120], arc: 1 }, punch: { scale: 2, seconds: 0.1, reducedMax: 1.5 }, grow: { from: 0.5, seconds: 0.15 }, fade: { at: 0.6 } },
      seventhSeal: { prim: 'stroke', wash: { token: 'p50', alpha: 0.18, union: true }, layers: [['ink', 2.6]], gaps: { n: [2, 2], deg: [10, 18] }, inner: { at: 0.92, layers: [['ink300', 1]] }, core: { layers: [['ink', 3], ['ally', 1.4]], span: [40, 70] }, punch: { scale: 1.5, seconds: 0.1, reducedMax: 1.5 }, grow: { from: 0.85, seconds: 0.06 }, fade: { at: 0.6 } },
      inkPulse: { prim: 'band', token: 'ink', width: [6, 16], knots: 9, gaps: { n: [3, 4], deg: [3, 7] }, endTaper: 0, core: { layers: [['ink', 4], ['ally', 2]], span: [80, 120], at: 'outer' }, grow: { from: 0.55, seconds: 0.1 }, fade: { at: 0.6 }, awakened: { widthScale: 1.2, inner: { at: 0.8, layers: [['ink', 1.6]] } } },
      frostRing: { prim: 'band', token: 'p50', alpha: 0.5, edge: [['ink', 2.2]], width: [14, 17], knots: 9, endTaper: 0, core: { layers: [['ink', 3.2], ['ally', 1.6]], span: [360, 360], at: 'mid' }, fringe: { side: -1, pitch: 7, h: [2, 7], skip: 0.35, layers: [['ink', 1.4]] }, grow: { from: 0.6, seconds: 0.12 }, fade: { at: 0.3 }, awakened: { fringeSides: [-1, 1] } },
      thunderclap: { prim: 'jag', layers: [['ink', 5], ['ally', 2.4], ['p50', 0.8]], seg: 26, amp: [1.5, 6.5], forks: { n: 3, len: [12, 24] }, flicker: { fps: 12, seeds: [5, 6] }, grow: { from: 0.5, seconds: 0.08 }, fade: { at: 0.65, dash: [6, 4] } },
      silenceBell: { prim: 'multi', rings: [{ final: 1, delay: 0, alpha: 1 }, { final: 0.86, delay: 0.08, alpha: 0.7 }, { final: 0.72, delay: 0.16, alpha: 0.45 }], layers: [['ink', 5.4], ['p50', 2.6]], grow: { from: 0.35, seconds: 0.3 }, fade: { at: 0.7 }, awakened: { ring: { final: 0.58, delay: 0.24, alpha: 0.3 } } },
      inkPots: { prim: 'stroke', layers: [['ink', 3], ['ally', 1.6]], gaps: { n: [2, 2], deg: [6, 10] }, punch: { scale: 2.2, seconds: 0.1, reducedMax: 1.5 }, grow: { from: 0.75, seconds: 0.07 }, fade: { at: 0.6 } },
      clusterPots: { prim: 'stroke', layers: [['ink', 2.6], ['ally', 1.4]], gaps: { n: [1, 1], deg: [8, 14] }, punch: { scale: 1.8, seconds: 0.1, reducedMax: 1.5 }, grow: { from: 0.75, seconds: 0.06 }, fade: { at: 0.6 } },
      tarJar: { prim: 'stroke', layers: [['ink', 3.2], ['ally', 1.4]], gaps: { n: [1, 1], deg: [8, 14] }, punch: { scale: 2, seconds: 0.1, reducedMax: 1.5 }, grow: { from: 0.75, seconds: 0.08 }, fade: { at: 0.6 } },
      meteorBrush: { prim: 'stroke', layers: [['ink', 5], ['ally', 2.8], ['allyG', 0.8]], gaps: { n: [2, 2], deg: [6, 10] }, punch: { scale: 2.2, seconds: 0.1, reducedMax: 1.5 }, grow: { from: 0.7, seconds: 0.08 }, fade: { at: 0.6 } }
    },
    // ---- splash: ink spikes that grow with R inside the disc (lob landings). Ink only, drawn after the ground decals and
    // before the rings; nothing on or outside the ring (tips ≤ 0.82 R, a drop is left out if it would pass R - clear).
    // Per weapon: spike count n (awakenedN), base from·R, tip lerp(to)·R, full width lerp(width), angle jitter, fork
    // share, drop {p, r, gap}, grow {from, seconds} of the length, fade {at} of the mark life, minimal-LOD spike count.
    splash: {
      shape: { shoulder: [0.45, 0.55], bend: 0.5, fork: { at: 0.7, deg: 7, short: 0.82 }, drop: { stretch: 1.7, clear: 6 }, reducedIn: 0.06 },
      inkPots: { token: 'ink', n: [7, 9], awakenedN: [8, 10], from: 0.12, to: [0.42, 0.72], width: [5, 10], jitter: 0.4, fork: 0.25, drop: { p: 0.5, r: [1.8, 3.2], gap: [4, 9] }, grow: { from: 0.3, seconds: 0.06 }, fade: { at: 0.4 }, minimal: 3 },
      clusterPots: { token: 'ink', n: [5, 6], awakenedN: [6, 7], from: 0.15, to: [0.35, 0.58], width: [4, 7], jitter: 0.4, fork: 0, drop: { p: 0.35, r: [1.4, 2.4], gap: [3, 6] }, grow: { from: 0.3, seconds: 0.05 }, fade: { at: 0.4 }, minimal: 0 },
      meteorBrush: { token: 'ink', n: [8, 10], awakenedN: [10, 12], from: 0.1, to: [0.5, 0.82], width: [7, 14], jitter: 0.35, fork: 0.35, drop: { p: 0.6, r: [2.6, 4.6], gap: [6, 14] }, grow: { from: 0.25, seconds: 0.07 }, fade: { at: 0.5 }, minimal: 3 }
    },
    // ---- stamps the renderer turns about their anchor by frame: deg[frame] × s, s = J(sign) < 0.5 ? -1 : +1 per event
    // (baked upright; never mirrored, the light stays upper left) ----
    tilt: {
      fallingScroll: { parts: ['scroll', 'scroll-awakened'], deg: [0, 6, 12, 12], sign: 954 }
    },
    // ---- lines: chain (point list from the hero) and beam (+x from the beam start, half width w) ----
    line: {
      sparkThread: { prim: 'sag', sag: 0.16, step: 8, layers: [['ink', 3.4], ['ally', 1.8], ['allyG', 0.6]], grow: { frac: 0.4 }, fade: { at: 0.65, dash: [5, 4] } },
      stormThread: { prim: 'twist', amp: 4, wave: 36, step: 6, strands: [[['ink', 3], ['ally', 1.5]], [['ink', 2.6], ['p50', 1]]], kinkEvery: 3, kinkAmp: 5, kinkStrand: 0, flicker: { fps: 12, seeds: [7, 8] }, grow: { frac: 0.3 }, fade: { at: 0.6 } },
      frostChainlet: { prim: 'links', pitch: 14, ellipse: { rx: 7.5, ry: 4, layers: [['ink', 3.4], ['p50', 1.6]] }, bar: { len: 14, h: 3.2, fill: 'p300', edge: ['ink', 1.6] }, core: { layers: [['ink', 3.4], ['ally', 1.6]] }, nubs: { every: 4, r: 2.4, fill: 'p50', edge: ['ink', 0.8] }, grow: { frac: 0.3 }, fade: { at: 0.6 }, minimal: { layers: [['ink', 3], ['ally', 1.6]] } },
      inkLance: { prim: 'blade', capsule: { fill: ['p50', 0.16], edge: [['ink', 1.2]] }, shaft: { token: 'ink', width: [4.8, 3], grain: ['p50', 0.8] }, head: { len: 30, half: 6.5, fill: 'p50', edge: ['ink', 1.6] }, thrust: 0.18, retract: { at: 0.7, to: 0.6 }, awakened: { headScale: 1.2, shadow: { offset: 3, layers: [['ink300', 1.2]] } } },
      wideBrush: { prim: 'brushBand', fill: ['p50', 0.45], edge: { layers: [['ink', 2]], ragged: { pitch: 10, amp: [0.5, 2.5] }, sides: 'both' }, streaks: { n: [3, 5], layers: [['ink300', 1.2]], len: [0.3, 0.8] }, front: { layers: [['ink', 3], ['ally', 1.6]] }, grow: { frac: 0.3 }, fade: { at: 0.6 } },
      crossStrokes: { prim: 'brushBand', capsule: { edge: [['ink300', 1, 0.6]], dash: [6, 4] }, fill: ['p50', 0.5], edge: { layers: [['ink', 1.6]], ragged: { pitch: 8, amp: [0.5, 3] }, sides: 'back' }, taper: [[0, 0.15], [0.35, 1], [1, 0.4]], core: { layers: [['ink', 3], ['ally', 1.4]], from: 0.7 }, grow: { frac: 0.25 }, fade: { at: 0.6 }, aim: 30 },
      judgmentLine: { prim: 'string', capsule: { fill: ['p50', 0.12], edge: [['ink300', 1.2]], dash: [6, 4] }, layers: [['ink', 2.8], ['ally', 1.2], ['p50', 0.4]], punch: { scale: 2, seconds: 0.06, reducedMax: 1.5 }, after: { n: 2, bow: 9, seconds: 0.12, sign: [1, -0.7, 0.48], layers: [['ink300', 1.2, 0.6]] }, fade: { at: 0.7 }, awakened: { after: 3, widthScale: 1.2 } }
    },
    // ---- halos: a band from inner to R round the hero's feet, swept (not spreading) ----
    halo: {
      inkOrbit: { wash: { token: 'ink', alpha: 0.14 }, outer: { layers: [['ink', 2.4]], gaps: { n: [2, 2], deg: [8, 14] } }, inner: { layers: [['ink300', 1.2]], dash: [4, 4] }, comet: { span: 100, head: [14, 18], rim: ['ink', 1.6], body: 'p50', core: { layers: [['ink', 3.6], ['ally', 2]], from: 0.08, to: 0.55 }, sweep: 240 }, fade: { at: 0.6 }, awakened: { span: 140 } },
      wardRing: { wash: { token: 'p50', alpha: 0.12 }, rope: { width: 10, body: 'p50', edge: ['ink', 1.4], twist: { pitch: [9, 15], angle: 40, layers: [['ink', 1.4]] } }, core: { layers: [['ink', 2.4], ['ally', 1.4]], dash: [5, 4], pad: 0.6, span: 120, gap: 1.6 }, grow: { from: 0.82, seconds: 0.1 }, fade: { at: 0.6 }, awakened: { width: 12 } },
      eclipseHalo: { outer: { layers: [['ink', 3.6], ['p50', 1.8]] }, inner: { layers: [['ink300', 1.2]], dash: [5, 5] }, wash: { token: 'ink', alpha: 0.1 }, crescent: { token: 'ink', alpha: 0.35, span: 90, thick: 0.9, sweep: 180, step: 3 }, fade: { at: 0.6 }, awakened: { span: 110, opposite: { alpha: 0.18, thick: 0.45 } } }
    },
    // ---- stamp placement per stage (§1.6). jit index bands: ring 0-399, count 900, pick 950-953, flip 955, line 0-99 ----
    layout: {
      inkLightning: { impact: [{ prim: 'center', parts: ['bolt'], awakened: ['bolt-awakened'], z: 'ally' }, { prim: 'center', parts: ['scorch'], z: 'ground' }] },
      brushDownpour: { impact: [{ prim: 'center', parts: ['stroke-a', 'stroke-b'], awakened: ['stroke-a-awakened', 'stroke-b-awakened'], pick: 950, z: 'ally' }, { prim: 'center', parts: ['mark-s', 'mark-m', 'mark-l'], by: 'radius', steps: [52, 72], z: 'ground' }] },
      fallingScroll: { impact: [{ prim: 'center', parts: ['scroll'], awakened: ['scroll-awakened'], z: 'ally' }] },
      seventhSeal: { impact: [{ prim: 'center', parts: ['seal'], awakened: ['seal-awakened'], z: 'ally' }, { prim: 'center', parts: ['print-a', 'print-b', 'print-c'], pick: 951, flip: 955, z: 'ground' }] },
      inkPulse: { burst: [{ prim: 'ring', parts: ['splash-a', 'splash-b'], count: [3, 3], awakenedCount: [4, 4], jitter: 0.4, skip: 0, dr: 4, z: 'ally' }] },
      frostRing: { burst: [{ prim: 'ring', parts: ['shard-a', 'shard-b', 'shard-c'], awakened: ['shard-awakened-a', 'shard-awakened-b'], count: [6, 6], awakenedCount: [7, 7], jitter: 0.35, skip: 0.15, dr: 6, inout: true, info: 3, z: 'ally' }] },
      thunderclap: { burst: [{ prim: 'head', parts: ['clap'], awakened: ['clap-awakened'], z: 'ally' }] },
      silenceBell: { burst: [{ prim: 'head', parts: ['bell'], awakened: ['bell-awakened'], z: 'ally' }] },
      inkPots: { land: [{ prim: 'center', parts: ['shatter'], z: 'ally' }, { prim: 'center', parts: ['splat'], z: 'ground' }] },
      clusterPots: { land: [{ prim: 'center', parts: ['burst'], z: 'ally' }] },
      tarJar: { land: [{ prim: 'center', parts: ['crack'], z: 'ally' }, { prim: 'center', parts: ['pool'], z: 'ground' }] },
      meteorBrush: { land: [{ prim: 'center', parts: ['impact'], awakened: ['impact-awakened'], z: 'ally' }, { prim: 'center', parts: ['crater'], z: 'ground' }] },
      sparkThread: { jump: [{ prim: 'point', parts: ['spark'], awakened: ['spark-awakened'], z: 'ally' }] },
      stormThread: { jump: [{ prim: 'point', parts: ['gust-a', 'gust-b'], pick: 600, big: 0.35, z: 'ally' }] },
      frostChainlet: { jump: [{ prim: 'point', parts: ['rime12', 'rime19', 'rime28'], by: 'r', z: 'feet' }] },
      inkLance: { stroke: [{ prim: 'center', parts: ['tassel'], awakened: ['tassel-awakened'], z: 'ally' }] },
      wideBrush: { stroke: [{ prim: 'tip', parts: ['brush'], awakened: ['brush-awakened'], z: 'ally' }] },
      crossStrokes: { stroke: [{ prim: 'tip', parts: ['scrap-a', 'scrap-b'], pick: 952, z: 'ally' }] },
      judgmentLine: { stroke: [{ prim: 'center', parts: ['inkbox'], awakened: ['inkbox-awakened'], z: 'ally' }, { prim: 'line', parts: ['flick-a', 'flick-b'], count: [4, 6], offset: 0.6, z: 'ally' }] },
      inkOrbit: { sweep: [{ prim: 'ring', parts: ['chip-a', 'chip-b'], count: [2, 3], jitter: 0.45, skip: 0, dr: 2, z: 'ally' }] },
      wardRing: { sweep: [{ prim: 'ring', parts: ['knot-a', 'knot-b'], count: [2, 2], awakenedCount: [3, 3], jitter: 0.4, skip: 0, dr: 0, z: 'ally' }] },
      eclipseHalo: { sweep: [{ prim: 'tail', parts: ['ribbon-a', 'ribbon-b'], pick: 953, z: 'ally' }] }
    },
    zorder: ['ground', 'feet', 'stand', 'ally'],
    // lob flight path (§3): H = clamp(k·d, min, max); the cluster pots' mini path is lobMini (fixed height, its own shadow
    // size, the cluster pots' shadow alpha)
    lob: {
      inkPots: { H: [0.35, 48, 140], shadow: { rx: [9, 15], alpha: [0.18, 0.32] } },
      clusterPots: { H: [0.35, 40, 120], shadow: { rx: [7, 12], alpha: [0.18, 0.32] } },
      tarJar: { H: [0.33, 48, 130], shadow: { rx: [10, 16], alpha: [0.18, 0.32] } },
      meteorBrush: { H: [0.5, 90, 220], shadow: { rx: [12, 22], alpha: [0.14, 0.34] } }
    },
    lobMini: { h: 28, shadow: { rx: [5, 7] } },
    // ---- lob flight objects (§3, delivery 2): one per lob, its anchor on (x, y - h) of lobPath, after its shadow (an
    // ellipse of lobPath.shadow in `shadow.token`, on the ground where enemy shot shadows go). The part is parts[0]
    // (awakened: awakened[0]); by 'index': lob k of a cast takes parts[k % 2] (cluster pots s, m, s, m). Loop frame
    // ⌊age·fps + J(phase + k)·frames⌋ mod frames, age = t·delay; still frame under reduced motion and minimal LOD, half
    // fps at reduced LOD. frame 'progress' (the ink pot, review 4 F1): frame = min(frames - 1, ⌊t·frames⌋), no phase;
    // frame 0 at minimal LOD, the same rule under reduced motion. rotate 'path' stamps are baked head up and turned by
    // lobPath.angle + turn°. Drawn while t < 1; at the blast the land stage's frame 0 takes the place. landMirror (review
    // 4 F2): when the lob came from the right (x1 < x0, 'dx<0') the land stage's `parts` are mirrored about their anchor
    // (not the crater, the splash or the ring; no mirror when the way is unknown). The split's mini (delivery 3 gimmick)
    // flies lobMini. ----
    flight: {
      inkPots: { parts: ['pot'], awakened: ['pot-awakened'], frame: 'progress' },
      clusterPots: { parts: ['pot-s', 'pot-m'], by: 'index', mini: 'mini' },
      tarJar: { parts: ['jar'], awakened: ['jar-awakened'] },
      meteorBrush: { parts: ['comet'], awakened: ['comet-awakened'], turn: 90, landMirror: { when: 'dx<0', parts: ['impact', 'impact-awakened'] } },
      phase: 1850,
      shadow: { token: 'ink' }
    },
    // ---- delivery 3a, awakening gimmicks P1 (work order §4, §12). Ground zones (RenderWorld.zones): the hit rim on the
    // zone's radius (rim.ally, the sewn dashes; the meteor's mark rim.pad, solid), a pale floor wash (Y ≤ 0.62, C10) and
    // the stamps by SPEC.layout[id][stage]; no bright fill, no sign disc. The fill and the stamps come in over fadeIn
    // and go over fadeOut of the life (data); the rim stays the whole life (V4). r: fixed radius; area: share of the
    // weapon's radius; life: the data's seconds (reference). start / end: the centre object's parts at the ends ----
    zone: {
      fadeIn: 0.15, fadeOut: 0.3,
      twinBlades: { stage: 'spin', r: 60, life: 0.5, rim: 'ally', arcs: { n: 2, at: 0.75, span: 70, layers: [['ink', 3.2], ['p50', 1.6]], turns: 2, start: 1960 }, end: { part: 'spin-end', seconds: 0.15 } },
      pinHail: { stage: 'caltrop', r: 18, life: 1.5, rim: 'none', shadow: { rx: 18, alpha: 0.25 } },
      smokeTail: { stage: 'smoke', r: 70, life: 2, rim: 'ally', wash: { token: 'ink300', alpha: 0.16 } },
      gravePins: { stage: 'grave', r: 22, life: 3, rim: 'none', shadow: { rx: 21, alpha: 0.25 }, start: { part: 'grave-rise', seconds: 0.15 } },
      inkLightning: { stage: 'pillar', r: 40, life: 1.2, rim: 'ally', start: { part: 'pillar-start', seconds: 0.12 }, end: { part: 'pillar-end', seconds: 0.2 } },
      inkPots: { stage: 'fire', area: 0.6, life: 2, rim: 'ally', wash: { token: 'ink', alpha: 0.24 } },
      tarJar: { stage: 'gather', area: 1, life: 1.5, rim: 'ally', wash: { token: 'ink700', alpha: 0.32 }, gloss: { at: [0.55, 0.7], span: [200, 250], layers: [['p300', 1.4]] } },
      meteorBrush: { stage: 'mark', area: 0.6, life: 4, rim: 'pad', wash: { token: 'p50', alpha: 0.14 }, floor: 'crater' }
    },
    // ---- the other P1 gimmicks: the triangle seal (pending, then the strike), the unrolling scroll (a beam frame from the
    // scroll's landing point), the eighth seal (pending shadow and stitches, then the big seal, its print and the heavy
    // ring), the total eclipse, the growing downpour (data only) ----
    gimmick: {
      trackingSeals: { stage: 'triangle', delay: 0.6, life: 0.28, pre: { layers: [['ink', 2.6], ['ally', 1.4]], dash: [6, 4], pad: 0.6, sewn: true }, strike: { layers: [['ink', 4], ['ally', 2.2], ['allyG', 0.7]], fill: { token: 'p50', alpha: 0.25 }, fillSeconds: 0.1, fade: { at: 0.6 } } },
      fallingScroll: { stage: 'unroll', length: 240, width: 50, life: 0.28, grow: 0.2, fade: { at: 0.75 }, band: { fill: { token: 'p50', alpha: 0.5 }, edge: [['ink', 1.6]], ridge: { humps: 2, amp: 0.25, base: 0.18, layers: [['ink', 1.4]] }, head: [['ink', 6], ['p50', 3.4]] } },
      seventhSeal: { stage: 'eighth', r: 120, delay: 0.3, life: 0.5, shadow: { token: 'ink', rx: [18, 64], alpha: [0.12, 0.35] }, stitch: { layers: [['ink', 2], ['ally', 1]], dash: [5, 4], pad: 0.6 }, ring: { layers: [['ink', 4], ['ally', 2.2], ['allyG', 0.7]], gaps: { n: [2, 2], deg: [6, 10] }, wash: { token: 'p50', alpha: 0.2 }, grow: { from: 0.7, seconds: 0.08 }, fade: { at: 0.6 } }, sealSeconds: 0.45 },
      eclipseHalo: { stage: 'total', inner: 0, wash: { token: 'ink', alpha: 0.2 }, band: { token: 'ink', alpha: 0.22, at: 0.62 }, outer: [['ink', 4], ['p50', 2]],
        // review 5 decision 2 (3b1): the disc and the band lie on the ground under the bodies, the rest over them; under
        // reduced flash the disc's and the band's alpha are multiplied by reducedFlash
        layers: { wash: 'ground', band: 'ground', outer: 'ally', inset: 'ally', corona: 'ally', ribbon: 'ally' }, reducedFlash: 0.5 },
      brushDownpour: { stage: 'surge', scale: [1, 1.2, 1.4, 1.6] },
      // ---- delivery 3b2, P2 follow-up effects (§4.4). Event rings (centre line exactly on R; gaps, so never an even
      // closed ring; solid rings carry cyan only on a core of at most 120°; no awakened inset line): prim stroke / band
      // (as SPEC.ring), torn (a paper band, its inner edge torn), dashed (the ink + cyan dashed sandwich all round, the ink
      // dash pad past both ends: 3b2-r1), jag (as SPEC.ring, with gaps and a core). life = the event's seconds; the burst
      // stamp is the event's centre object. lift = height above the feet where a line meets an enemy (reference) ----
      inkDarts: { stage: 'stain', stacks: 3, r: 70, life: 0.3, burst: 'stainBurst',
        ring: { prim: 'stroke', layers: [['ink', 3.2], ['p50', 1.2]], gaps: { n: [3, 4], deg: [9, 18] }, core: { layers: [['ink', 3.6], ['ally', 1.6], ['allyG', 0.5]], span: [60, 100] }, punch: { scale: 1.8, seconds: 0.1, reducedMax: 1.5 }, grow: { from: 0.7, seconds: 0.08 }, fade: { at: 0.6 } } },
      brushQuills: { stage: 'dab', delay: 0.6, r: 50, life: 0.24, dab: 'dab', burst: 'dabBurst',
        ring: { prim: 'band', token: 'ink', width: [2.4, 5], knots: 10, gaps: { n: [3, 3], deg: [10, 18] }, endTaper: 9, core: { layers: [['ink', 3.6], ['ally', 1.6], ['allyG', 0.5]], span: [40, 70], at: 'mid', dab: true }, grow: { from: 0.75, seconds: 0.06 }, fade: { at: 0.6 } } },
      sealArrows: { stage: 'topple', life: 0.16, event: 'topple', window: 0.4 },
      thunderNeedles: { stage: 'leap', range: 200, life: 0.2, hit: 'leapHit', lift: 14,
        line: { prim: 'kink', seg: 24, n: [3, 8], shift: 0.5, push: [3, 8], layers: [['ink', 3.4], ['ally', 1.8], ['allyG', 0.6]], flicker: { fps: 12, seeds: [3, 4] }, grow: { frac: 0.35 }, fade: { at: 0.6 } } },
      headsmanDarts: { stage: 'fear', r: 160, life: 0.45,
        ring: { prim: 'torn', token: 'p50', width: 3, alpha: 0.85, edge: [['ink', 1.2]], tear: { pitch: 6, depth: [0.4, 2.6], skip: 0.3, end: 1.6, layers: [['ink', 1]] }, gaps: { n: [2, 2], deg: [5, 9] }, grow: { from: 0.4, seconds: 0.15 }, fade: { at: 0.6 } } },
      // review 8 F1 (3b2-r1): the pollen ring is the brief's ink + cyan dashed sandwich all round (the ally grammar of
      // rim.ally); bare ink dashes round an enemy read as an enemy telegraph's dashed rim
      inkBloom: { stage: 'pollen', r: 50, tick: 0.5, life: 0.45, puff: 'pollenPuff',
        ring: { prim: 'dashed', layers: [['ink', 1.6], ['ally', 1]], dash: [4, 5], pad: 0.6, gaps: { n: [2, 2], deg: [16, 28] }, grow: { from: 0.6, seconds: 0.25 }, fade: { at: 0.6 } } },
      tailGuard: { stage: 'rear', reach: 200, arc: 70, life: 0.2, hit: 'rearHit', lift: 14 },
      bossbane: { stage: 'crack', r: 90, life: 0.3, burst: 'crackBurst',
        ring: { prim: 'stroke', layers: [['ink', 3.4], ['p50', 1.6]], gaps: { n: [2, 3], deg: [8, 16] }, core: { layers: [['ink', 3.6], ['ally', 1.8], ['allyG', 0.6]], span: [70, 110] }, punch: { scale: 2, seconds: 0.1, reducedMax: 1.5 }, grow: { from: 0.65, seconds: 0.09 }, fade: { at: 0.6 } },
        cracks: { n: [6, 8], from: 0.24, to: [0.55, 0.9], jitter: 0.35, steps: [0.32, 0.26, 0.24, 0.18], bend: [8, 22], layers: [['ink', 3], ['p50', 1.4]], core: { n: 2, layers: [['ink', 3], ['ally', 1.4], ['allyG', 0.4]] }, fork: { n: 1, at: 2, deg: 30, len: 0.26 }, grow: { from: 0.4, seconds: 0.09 } } },
      inkPulse: { stage: 'bump', life: 0.16, event: 'bump', window: 0.5 },
      thunderclap: { stage: 'echo', delay: 0.5, reach: 1.4, life: 0.3,
        ring: { prim: 'jag', alpha: 0.75, layers: [['ink300', 3.4], ['p300', 1.2]], core: { layers: [['ink300', 3.4], ['ally', 1.6]], span: [80, 110] }, seg: 26, amp: [1.5, 6.5], forks: { n: 0, len: [0, 0] }, gaps: { n: [2, 2], deg: [10, 16] }, flicker: { fps: 12, seeds: [7, 8] }, grow: { from: 0.85, seconds: 0.08 }, fade: { at: 0.6 } } },
      clusterPots: { stage: 'split', delay: 0.35, offset: 60, area: 0.6, mini: 'mini', burst: 'burst', ring: 'clusterPots' },
      sparkThread: { stage: 'rewind', hit: 'spark', line: { prim: 'sag', sag: -0.16, step: 8, from: 'tail', layers: [['ink', 2.6], ['ally', 1.4], ['allyG', 0.5]], grow: { frac: 0.4 }, fade: { at: 0.65, dash: [5, 4] } } },
      stormThread: { stage: 'amplify', width: 0.15, amp: 0.1, big: { part: 'gust-b', from: 3 } },
      frostChainlet: { stage: 'link', life: 2, line: { prim: 'links', pitch: 20, alpha: 0.45, clear: 0 }, share: { seconds: 0.18, alpha: 1 }, fade: { at: 0.85 } },
      inkLance: { stage: 'branch', angle: 35, branch: 0.4, fork: 'fork', head: 0.85, tassel: false },
      wideBrush: { stage: 'resweep', delay: 0.3, alpha: 0.65, seed: 500, head: 'mirror' },
      inkOrbit: { stage: 'deflect', speed: 2, life: 1.2, hitR: 7, start: 'deflect-start', travel: 'deflect-travel', end: 'deflect-end' },
      meteorBrush: { stage: 'haste', part: 'haste', at: 'feet', rim: 'inside' },
      pinHail: { stage: 'snap', life: 0.15, event: 'caltrop-snap' },
      // the scorching needles: no art; the renderer scales the needle's shot stamps by the shot's radius over the weapon's
      // size (data shot.radius / geo.size), at most max (the one exception to 'stamps are never stretched')
      sunNeedles: { scale: { by: 'radius', over: 'size', max: 1.6 } }
    },
    // ---- enemy overlays (§4.3): head marks at (0, top + dy) (top = the sprite's top), one per enemy by priority.heads;
    // feet overlays by the nearest size class r, one per enemy by priority.feet (-back under the body, -front in front);
    // the crow orbits (marks.crow) or sits at (sit) under reduced motion. At each crow hit tick it dives for marks.crow.dive
    // seconds: its anchor goes to dive.crow (x on the side it faces from) and back, the peck stamp shows at dive.peck
    // (both from (0, top)) ----
    // 3b1 (P2): more head marks (stain by stack 1-3; fear mirrored with the enemy, rotate 'face'), the boss's crack plate
    // (stack 1-5, at (0, top + dy), or `beside` to the right when a head mark is shown; never dropped), the pollen spores
    // (two slots at `at`, each rising marks.spores.rise and drifting outward marks.spores.drift over its cycle, phase
    // apart), and the feet: frost (stack 1-2), bound and thorn, all three in front of the body ----
    overlay: {
      head: { dy: -12, parts: { silence: { group: 'silenceBell', part: 'mark-silence' }, prey: { group: 'huntersMarks', part: 'mark-prey' },
        fear: { group: 'headsmanDarts', part: 'mark-fear' }, lost: { group: 'smokeTail', part: 'lost' }, weak: { group: 'wardRing', part: 'mark-weak' }, stain: { group: 'inkDarts', part: 'mark-stain', stack: [1, 3] } } },
      feet: { freeze: { group: 'frostNeedles', back: 'freeze-back-', front: 'freeze-front-', r: [12, 19, 28] }, scorch: { group: 'inkPots', part: 'scorch', r: [12, 19, 28, 38, 54] },
        frost: { group: 'frostNeedles', part: 'frost', stack: [1, 2], r: [12, 19, 28] }, bound: { group: 'gravePins', part: 'bound', r: [12, 19, 28] }, thorn: { group: 'thornHalo', part: 'thorn', r: [12, 19, 28, 38, 54] } },
      crow: { group: 'crowFeathers', part: 'crow', peck: 'peck', sit: [6, -6], dive: { crow: [7, -5], peck: [0, -1] } },
      crack: { group: 'bossbane', part: 'mark-crack', stack: [1, 5], dy: -12, beside: 26 },
      pollen: { group: 'inkBloom', parts: ['spore-a', 'spore-b'], at: [[-6, 2], [5, -1]], phase: [0, 0.5] }
    },
    reference: { chainStep: [90, 40], spread: [120, 80] },
    // screen caps (full / reduced / minimal, §4.5 / §5.4) and the order things are dropped in when over
    caps: {
      stamps: [220, 140, 70], heads: [24, 16, 8], feet: [24, 16, 8], crows: [12, 8, 4], spores: [16, 8, 0], pollenRings: [8, 4, 0],
      events: [16, 10, 4], zoneStamps: [120, 72, 36], decals: [16, 8, 0], flights: [12, 12, 6], pending: [12, 12, 12], links: [120, 60, 0], splash: [12, 8, 3],
      perZone: { smoke: 4, flame: 5, string: 7, mote: 6 }
    },
    priority: {
      heads: ['silence', 'prey', 'fear', 'lost', 'weak', 'stain'],
      feet: ['freeze', 'bound', 'scorch', 'frost2', 'frost1', 'thorn', 'rime'],
      drop: ['deco', 'events', 'decals', 'farHeads', 'farFeet', 'zoneExtras'],
      keep: ['hitShapes', 'mainObjects', 'flights', 'pending', 'freeze']
    },
    marks: {
      rects: { 12: [-16, -14, 16, 4], 19: [-22, -18, 22, 4], 28: [-30, -24, 30, 5], 38: [-40, -30, 40, 6], 54: [-56, -38, 56, 7] },
      emblem: { box: [22, 22], gap: 4 }, crow: { rx: 14, ry: 5, period: 0.9, lift: 8, dive: 0.12 }, spores: { slots: 2, rise: 16, drift: 6 }
    },
    // every area fill and band [name, token, alpha, seconds visible at that alpha or above] (C10)
    fills: [
      ['brushDownpour.band', 'ink', 1, 0.3],
      ['seventhSeal.wash', 'p50', 0.18, 0.36],
      ['seventhSeal.print', 'p50', 0.25, 1.2],
      ['inkPulse.band', 'ink', 1, 0.3],
      ['frostRing.band', 'p50', 0.5, 0.29],
      ['frostRing.band.tail', 'p50', 0.25, 0.45],
      ['inkLance.capsule', 'p50', 0.16, 0.28],
      ['wideBrush.band', 'p50', 0.45, 0.28],
      ['crossStrokes.band', 'p50', 0.5, 0.28],
      ['judgmentLine.capsule', 'p50', 0.12, 0.28],
      ['inkOrbit.wash', 'ink', 0.14, 0.3],
      ['wardRing.wash', 'p50', 0.12, 0.3],
      ['eclipseHalo.wash', 'ink', 0.1, 0.3],
      ['eclipseHalo.crescent', 'ink', 0.35, 0.3],
      ['lob.shadow', 'ink', 0.14, 1],
      // delivery 3a
      ['smokeTail.smoke', 'ink300', 0.16, 2],
      ['inkPots.fire', 'ink', 0.24, 2],
      ['tarJar.gather', 'ink700', 0.32, 1.5],
      ['meteorBrush.mark', 'p50', 0.14, 4],
      ['seventhSeal.eighth', 'p50', 0.2, 0.3],
      ['seventhSeal.shadow', 'ink', 0.12, 0.3],
      ['trackingSeals.fill', 'p50', 0.25, 0.1],
      ['fallingScroll.unroll', 'p50', 0.5, 0.28],
      ['eclipseHalo.total', 'ink', 0.2, 0.3]
    ]
  };
  // delivery 3a: the gimmick stages' stamp placement, appended to SPEC.layout (read by glayout; layout() hands them on)
  const GLAYOUT = {
    twinBlades: { spin: [{ prim: 'center', parts: ['spin'], z: 'ally' }] },
    pinHail: { caltrop: [{ prim: 'center', parts: ['caltrop-a', 'caltrop-b', 'caltrop-c'], pick: 1950, z: 'ground' }] },
    smokeTail: { smoke: [{ prim: 'disc', parts: ['puff-a', 'puff-b', 'puff-c'], per: 26, min: 2, max: 4, margin: 16, minGap: 0.45, info: 1, z: 'ground' }] },
    gravePins: { grave: [{ prim: 'center', parts: ['grave-a', 'grave-b', 'grave-c'], pick: 1951, z: 'stand' }] },
    trackingSeals: { triangle: [{ prim: 'corner', parts: ['sealCorner'], z: 'ally' }, { prim: 'centroid', parts: ['sealStrike'], z: 'ally' }] },
    inkLightning: { pillar: [{ prim: 'center', parts: ['pillar'], z: 'stand' }] },
    fallingScroll: { unroll: [{ prim: 'tip', parts: ['roller'], z: 'ally' }] },
    seventhSeal: { eighth: [{ prim: 'center', parts: ['print8'], z: 'ground' }, { prim: 'center', parts: ['seal8'], z: 'ally' }] },
    inkPots: { fire: [{ prim: 'disc', parts: ['flame-a', 'flame-b'], per: 24, min: 2, max: 5, margin: 10, minGap: 0.35, info: 1, z: 'ground' }] },
    tarJar: { gather: [{ prim: 'center', parts: ['jarBroken'], z: 'ground' }, { prim: 'ring', parts: ['string-a', 'string-b'], count: [5, 7], jitter: 0.3, skip: 0, dr: -6, info: 3, z: 'ground' }] },
    meteorBrush: { mark: [{ prim: 'disc', parts: ['mote-a', 'mote-b'], per: 30, min: 3, max: 6, margin: 8, minGap: 0.3, z: 'ally' }] },
    eclipseHalo: { total: [{ prim: 'ring', parts: ['corona-a', 'corona-b'], count: [7, 9], jitter: 0.35, skip: 0, dr: 2, z: 'ally' }, { prim: 'tail', parts: ['ribbon-a', 'ribbon-b'], pick: 953, z: 'ally' }] }
  };
  Object.keys(GLAYOUT).forEach((id) => { SPEC.layout[id] = Object.assign(SPEC.layout[id] || {}, GLAYOUT[id]); });

  const META = {};
  ROWS.forEach(([id, name, rarity, kind, look, geo]) => {
    const fx = DRAWN_FX.has(id), lob = DRAWN_LOB.has(id), gm = GSTAGE[id] || null, gm2 = GSTAGE2[id] || null, main = MAIN[kind] || null;
    META[id] = Object.freeze({
      name, rarity, kind, look, geo: Object.freeze(Object.assign({}, geo)), main,
      stages: Object.freeze((fx ? [main].concat(lob ? ['flight'] : []) : []).concat(gm ? [gm] : []).concat(gm2 ? [gm2] : [])),
      gimmicks: Object.freeze((gm ? [Object.freeze({ stage: gm, priority: 1 })] : []).concat(gm2 ? [Object.freeze({ stage: gm2, priority: 2 })] : [])),
      object: fx ? OBJECT[id] : (GOBJECT[id] || null),
      done: Object.freeze({ fx, lob, gimmick: !!(gm || gm2) })
    });
  });
  Object.freeze(META);

  // ---- baked parts (work order §2): [part, frames, drive, fps, seconds, window, box, anchor, place, rotate, layer, lod, extra] ----
  const PT = {
    // delivery 3b1: new groups of projectile weapons whose P2 gimmick is an enemy mark or a feet overlay (§4.3)
    inkDarts: [
      ['mark-stain1', 1, 'idx', 0, null, 'stack', [22, 22], [11, 20], 'over', 'none', 'head', 'info'],
      ['mark-stain2', 1, 'idx', 0, null, 'stack', [22, 22], [11, 20], 'over', 'none', 'head', 'info'],
      ['mark-stain3', 1, 'idx', 0, null, 'stack', [22, 22], [11, 20], 'over', 'none', 'head', 'info'],
      // delivery 3b2: the third stain's burst (with SPEC.gimmick.inkDarts.ring r 70)
      ['stainBurst', 3, 'prog', 0, 0.3, 'event', [64, 52], [32, 30], 'center', 'none', 'ally', 'info']
    ],
    headsmanDarts: [
      ['mark-fear', 1, 'idx', 0, null, 'status', [22, 22], [11, 20], 'over', 'face', 'head', 'info']
    ],
    inkBloom: [
      ['spore-a', 4, 'cycle', 0, 1, 'status', [10, 14], [5, 12], 'over', 'none', 'head', 'deco'],
      ['spore-b', 4, 'cycle', 0, 1, 'status', [10, 14], [5, 12], 'over', 'none', 'head', 'deco'],
      // delivery 3b2: the pollen puff every tick (with SPEC.gimmick.inkBloom.ring r 50)
      ['pollenPuff', 3, 'prog', 0, 0.3, 'event', [36, 28], [18, 18], 'target', 'none', 'ally', 'deco']
    ],
    // delivery 3b2: new groups of projectile weapons whose P2 gimmick is a follow-up effect (§4.4)
    brushQuills: [
      ['dab', 3, 'prog', 0, null, 'pending', [28, 18], [14, 9], 'target', 'none', 'ground', 'info'],
      ['dabBurst', 3, 'prog', 0, 0.24, 'event', [52, 40], [26, 24], 'center', 'none', 'ally', 'info']
    ],
    sealArrows: [
      ['topple', 2, 'prog', 0, 0.16, 'event', [32, 28], [16, 14], 'event', 'none', 'ally', 'deco']
    ],
    thunderNeedles: [
      ['leapHit', 2, 'prog', 0, null, 'chain', [24, 24], [12, 12], 'point', 'none', 'ally', 'deco']
    ],
    tailGuard: [
      ['rearHit', 3, 'prog', 0, 0.2, 'event', [40, 32], [20, 18], 'target', 'none', 'ally', 'deco']
    ],
    thornHalo: [
      ['thorn12', 1, 'idx', 0, null, 'status', [30, 16], [15, 8], 'feet', 'none', 'front', 'info', { r: 12 }],
      ['thorn19', 1, 'idx', 0, null, 'status', [40, 18], [20, 9], 'feet', 'none', 'front', 'info', { r: 19 }],
      ['thorn28', 1, 'idx', 0, null, 'status', [56, 22], [28, 11], 'feet', 'none', 'front', 'info', { r: 28 }],
      ['thorn38', 1, 'idx', 0, null, 'status', [72, 26], [36, 13], 'feet', 'none', 'front', 'info', { r: 38 }],
      ['thorn54', 1, 'idx', 0, null, 'status', [96, 30], [48, 15], 'feet', 'none', 'front', 'info', { r: 54 }]
    ],
    bossbane: [
      ['mark-crack1', 1, 'idx', 0, null, 'stack', [26, 24], [13, 22], 'over', 'none', 'head', 'info'],
      ['mark-crack2', 1, 'idx', 0, null, 'stack', [26, 24], [13, 22], 'over', 'none', 'head', 'info'],
      ['mark-crack3', 1, 'idx', 0, null, 'stack', [26, 24], [13, 22], 'over', 'none', 'head', 'info'],
      ['mark-crack4', 1, 'idx', 0, null, 'stack', [26, 24], [13, 22], 'over', 'none', 'head', 'info'],
      ['mark-crack5', 1, 'idx', 0, null, 'stack', [26, 24], [13, 22], 'over', 'none', 'head', 'info'],
      // delivery 3b2: the fifth crack's burst (with SPEC.gimmick.bossbane.ring r 90 and the paper crack lines)
      ['crackBurst', 3, 'prog', 0, 0.3, 'event', [56, 48], [28, 30], 'center', 'none', 'ally', 'info']
    ],
    // delivery 3a: the groups of the projectile weapons hold only their P1 gimmick's stamps (work order §4.2-§4.4)
    frostNeedles: [
      ['freeze-back-12', 1, 'idx', 0, null, 'status', [36, 20], [18, 10], 'feet', 'none', 'feet', 'info', { r: 12 }],
      ['freeze-back-19', 1, 'idx', 0, null, 'status', [48, 24], [24, 12], 'feet', 'none', 'feet', 'info', { r: 19 }],
      ['freeze-back-28', 1, 'idx', 0, null, 'status', [64, 30], [32, 15], 'feet', 'none', 'feet', 'info', { r: 28 }],
      ['freeze-front-12', 1, 'idx', 0, null, 'status', [32, 24], [16, 20], 'feet', 'none', 'front', 'info', { r: 12 }],
      ['freeze-front-19', 1, 'idx', 0, null, 'status', [44, 30], [22, 25], 'feet', 'none', 'front', 'info', { r: 19 }],
      ['freeze-front-28', 1, 'idx', 0, null, 'status', [60, 38], [30, 32], 'feet', 'none', 'front', 'info', { r: 28 }],
      // delivery 3b1: the frost marks (stack 1-2) that come before the freeze
      ['frost1-12', 1, 'idx', 0, null, 'stack', [36, 20], [18, 10], 'feet', 'none', 'front', 'info', { r: 12 }],
      ['frost1-19', 1, 'idx', 0, null, 'stack', [48, 24], [24, 12], 'feet', 'none', 'front', 'info', { r: 19 }],
      ['frost1-28', 1, 'idx', 0, null, 'stack', [64, 30], [32, 15], 'feet', 'none', 'front', 'info', { r: 28 }],
      ['frost2-12', 1, 'idx', 0, null, 'stack', [36, 20], [18, 10], 'feet', 'none', 'front', 'info', { r: 12 }],
      ['frost2-19', 1, 'idx', 0, null, 'stack', [48, 24], [24, 12], 'feet', 'none', 'front', 'info', { r: 19 }],
      ['frost2-28', 1, 'idx', 0, null, 'stack', [64, 30], [32, 15], 'feet', 'none', 'front', 'info', { r: 28 }]
    ],
    twinBlades: [
      ['spin', 4, 'loop', 16, null, 'zone', [40, 40], [20, 20], 'center', 'none', 'ally', 'info', { still: 0 }],
      ['spin-end', 2, 'prog', 0, 0.15, 'zone-end', [40, 40], [20, 20], 'center', 'none', 'ally', 'info']
    ],
    pinHail: [
      ['caltrop-a', 1, 'idx', 0, null, 'variant', [44, 26], [22, 17], 'center', 'none', 'ground', 'info'],
      ['caltrop-b', 1, 'idx', 0, null, 'variant', [44, 26], [22, 17], 'center', 'none', 'ground', 'info'],
      ['caltrop-c', 1, 'idx', 0, null, 'variant', [44, 26], [22, 17], 'center', 'none', 'ground', 'info'],
      // delivery 3b2: the caltrop snapping under the first enemy to step on it
      ['caltrop-snap', 2, 'prog', 0, 0.15, 'event', [44, 30], [22, 19], 'center', 'none', 'ally', 'deco']
    ],
    smokeTail: [
      ['puff-a', 4, 'loop', 6, null, 'zone', [40, 28], [20, 24], 'disc', 'none', 'ground', 'info', { still: 0 }],
      ['puff-b', 4, 'loop', 6, null, 'zone', [40, 28], [20, 24], 'disc', 'none', 'ground', 'info', { still: 0 }],
      ['puff-c', 4, 'loop', 6, null, 'zone', [40, 28], [20, 24], 'disc', 'none', 'ground', 'info', { still: 0 }],
      // delivery 3b1: the wander mark (two smoke curls circling over the head)
      ['lost', 4, 'loop', 8, null, 'status', [24, 14], [12, 10], 'over', 'none', 'head', 'deco', { still: 0 }]
    ],
    gravePins: [
      ['grave-a', 1, 'idx', 0, null, 'variant', [48, 36], [24, 27], 'center', 'none', 'stand', 'info'],
      ['grave-b', 1, 'idx', 0, null, 'variant', [48, 36], [24, 27], 'center', 'none', 'stand', 'info'],
      ['grave-c', 1, 'idx', 0, null, 'variant', [48, 36], [24, 27], 'center', 'none', 'stand', 'info'],
      ['grave-rise', 2, 'prog', 0, 0.15, 'zone-start', [48, 36], [24, 27], 'center', 'none', 'stand', 'info'],
      // delivery 3b1: bound feet (the thread sewing them down, a small grave pin beside), in front of the body
      ['bound12', 1, 'idx', 0, null, 'status', [34, 20], [17, 10], 'feet', 'none', 'front', 'info', { r: 12 }],
      ['bound19', 1, 'idx', 0, null, 'status', [46, 24], [23, 12], 'feet', 'none', 'front', 'info', { r: 19 }],
      ['bound28', 1, 'idx', 0, null, 'status', [62, 30], [31, 15], 'feet', 'none', 'front', 'info', { r: 28 }]
    ],
    trackingSeals: [
      ['sealCorner', 3, 'prog', 0, 0.6, 'pending', [26, 20], [13, 10], 'point', 'none', 'ally', 'info'],
      ['sealStrike', 3, 'prog', 0, 0.28, 'event', [48, 40], [24, 22], 'center', 'none', 'ally', 'info']
    ],
    huntersMarks: [
      ['mark-prey', 2, 'loop', 4, null, 'status', [22, 24], [11, 22], 'over', 'none', 'head', 'info', { still: 0 }]
    ],
    crowFeathers: [
      ['crow', 6, 'loop', 12, null, 'status', [26, 18], [13, 9], 'orbit', 'face', 'head', 'info', { still: 0 }],
      ['peck', 2, 'prog', 0, 0.12, 'event', [16, 16], [8, 8], 'orbit', 'none', 'head', 'deco']
    ],
    inkLightning: [
      ['bolt', 4, 'prog', 0, 0.24, 'mark', [36, 120], [18, 112], 'target', 'none', 'ally', 'info'],
      ['bolt-awakened', 4, 'prog', 0, 0.24, 'mark', [36, 120], [18, 112], 'target', 'none', 'ally', 'info'],
      ['scorch', 1, 'idx', 0, 0.6, 'decal', [52, 24], [26, 12], 'target', 'none', 'ground', 'deco'],
      // delivery 3a: the lightning pillar (zone)
      ['pillar-start', 2, 'prog', 0, 0.12, 'zone-start', [32, 84], [16, 78], 'center', 'none', 'stand', 'info'],
      ['pillar', 4, 'loop', 12, null, 'zone', [32, 84], [16, 78], 'center', 'none', 'stand', 'info', { still: 0 }],
      ['pillar-end', 2, 'prog', 0, 0.2, 'zone-end', [32, 84], [16, 78], 'center', 'none', 'stand', 'info']
    ],
    brushDownpour: [
      ['stroke-a', 3, 'prog', 0, 0.18, 'mark', [48, 88], [14, 80], 'target', 'none', 'ally', 'info'],
      ['stroke-b', 3, 'prog', 0, 0.18, 'mark', [48, 88], [14, 80], 'target', 'none', 'ally', 'info'],
      ['stroke-a-awakened', 3, 'prog', 0, 0.18, 'mark', [48, 88], [14, 80], 'target', 'none', 'ally', 'info'],
      ['stroke-b-awakened', 3, 'prog', 0, 0.18, 'mark', [48, 88], [14, 80], 'target', 'none', 'ally', 'info'],
      ['mark-s', 1, 'idx', 0, 0.9, 'decal', [56, 28], [28, 14], 'target', 'none', 'ground', 'deco'],
      ['mark-m', 1, 'idx', 0, 0.9, 'decal', [76, 36], [38, 18], 'target', 'none', 'ground', 'deco'],
      ['mark-l', 1, 'idx', 0, 0.9, 'decal', [100, 46], [50, 23], 'target', 'none', 'ground', 'deco']
    ],
    fallingScroll: [
      ['scroll', 4, 'prog', 0, 0.42, 'mark', [52, 104], [26, 98], 'target', 'none', 'ally', 'info'],
      ['scroll-awakened', 4, 'prog', 0, 0.42, 'mark', [52, 104], [26, 98], 'target', 'none', 'ally', 'info'],
      // delivery 3a: the unrolling scroll's head
      ['roller', 2, 'loop', 12, null, 'beam', [36, 24], [18, 12], 'tip', 'beam', 'ally', 'info', { still: 0 }]
    ],
    seventhSeal: [
      ['seal', 3, 'prog', 0, 0.3, 'mark', [40, 56], [20, 50], 'target', 'none', 'ally', 'info'],
      ['seal-awakened', 3, 'prog', 0, 0.3, 'mark', [40, 56], [20, 50], 'target', 'none', 'ally', 'info'],
      ['print-a', 1, 'idx', 0, 1.2, 'decal', [48, 24], [24, 12], 'target', 'none', 'ground', 'deco'],
      ['print-b', 1, 'idx', 0, 1.2, 'decal', [48, 24], [24, 12], 'target', 'none', 'ground', 'deco'],
      ['print-c', 1, 'idx', 0, 1.2, 'decal', [48, 24], [24, 12], 'target', 'none', 'ground', 'deco'],
      // delivery 3a: the eighth seal
      ['seal8', 4, 'prog', 0, 0.45, 'mark', [60, 80], [30, 74], 'center', 'none', 'ally', 'info', { flash: true }],
      ['print8', 1, 'idx', 0, 1.2, 'decal', [88, 36], [44, 18], 'center', 'none', 'ground', 'deco']
    ],
    inkPulse: [
      ['splash-a', 3, 'prog', 0, 0.3, 'mark', [40, 28], [6, 14], 'ring', 'radial', 'ally', 'deco'],
      ['splash-b', 3, 'prog', 0, 0.3, 'mark', [40, 28], [6, 14], 'ring', 'radial', 'ally', 'deco'],
      // delivery 3b2: a pushed enemy striking a wall
      ['bump', 2, 'prog', 0, 0.16, 'event', [32, 32], [16, 16], 'event', 'none', 'ally', 'deco']
    ],
    frostRing: [
      ['shard-a', 3, 'prog', 0, 0.45, 'mark', [36, 32], [6, 16], 'ring', 'radial', 'ally', 'info'],
      ['shard-b', 3, 'prog', 0, 0.45, 'mark', [36, 32], [6, 16], 'ring', 'radial', 'ally', 'info'],
      ['shard-c', 3, 'prog', 0, 0.45, 'mark', [36, 32], [6, 16], 'ring', 'radial', 'ally', 'info'],
      ['shard-awakened-a', 3, 'prog', 0, 0.45, 'mark', [44, 36], [6, 18], 'ring', 'radial', 'ally', 'info'],
      ['shard-awakened-b', 3, 'prog', 0, 0.45, 'mark', [44, 36], [6, 18], 'ring', 'radial', 'ally', 'info']
    ],
    thunderclap: [
      ['clap', 3, 'prog', 0, 0.24, 'mark', [60, 44], [30, 42], 'head', 'none', 'ally', 'info'],
      ['clap-awakened', 3, 'prog', 0, 0.24, 'mark', [60, 44], [30, 42], 'head', 'none', 'ally', 'info']
    ],
    silenceBell: [
      ['bell', 3, 'prog', 0, 0.45, 'mark', [40, 52], [20, 50], 'head', 'none', 'ally', 'info'],
      ['bell-awakened', 3, 'prog', 0, 0.45, 'mark', [40, 52], [20, 50], 'head', 'none', 'ally', 'info'],
      // delivery 3a: the silence mark over an enemy's head
      ['mark-silence', 1, 'idx', 0, null, 'status', [22, 22], [11, 20], 'over', 'none', 'head', 'info']
    ],
    inkPots: [
      ['shatter', 3, 'prog', 0, 0.3, 'mark', [76, 64], [38, 40], 'target', 'none', 'ally', 'info'],
      ['splat', 1, 'idx', 0, 1.2, 'decal', [64, 30], [32, 15], 'target', 'none', 'ground', 'deco'],
      // delivery 2: the flight (§3). The pot rolls once over its flight (review 4 F1): prog by the flight's progress t;
      // seconds 0.55 is a reference value (the ink pot's flight delay), the renderer uses the data's delay
      ['pot', 4, 'prog', 0, 0.55, 'flight', [30, 34], [15, 17], 'air', 'none', 'air', 'info'],
      ['pot-awakened', 4, 'prog', 0, 0.55, 'flight', [30, 34], [15, 17], 'air', 'none', 'air', 'info'],
      // delivery 3a: the ink fire (zone) and the scorch under enemies standing in it (feet overlay, in front of the body)
      ['flame-a', 6, 'loop', 12, null, 'zone', [22, 28], [11, 25], 'disc', 'none', 'ground', 'info', { still: 0 }],
      ['flame-b', 6, 'loop', 12, null, 'zone', [22, 28], [11, 25], 'disc', 'none', 'ground', 'info', { still: 0 }],
      ['scorch12', 2, 'loop', 8, null, 'status', [30, 18], [15, 14], 'feet', 'none', 'front', 'info', { still: 0, r: 12 }],
      ['scorch19', 2, 'loop', 8, null, 'status', [40, 22], [20, 17], 'feet', 'none', 'front', 'info', { still: 0, r: 19 }],
      ['scorch28', 2, 'loop', 8, null, 'status', [56, 26], [28, 21], 'feet', 'none', 'front', 'info', { still: 0, r: 28 }],
      ['scorch38', 2, 'loop', 8, null, 'status', [72, 30], [36, 25], 'feet', 'none', 'front', 'info', { still: 0, r: 38 }],
      ['scorch54', 2, 'loop', 8, null, 'status', [96, 34], [48, 29], 'feet', 'none', 'front', 'info', { still: 0, r: 54 }]
    ],
    clusterPots: [
      ['burst', 3, 'prog', 0, 0.24, 'mark', [56, 48], [28, 30], 'target', 'none', 'ally', 'info'],
      ['pot-s', 4, 'loop', 12, null, 'flight', [22, 26], [11, 13], 'air', 'none', 'air', 'info', { still: 0 }],
      ['pot-m', 4, 'loop', 12, null, 'flight', [26, 30], [13, 15], 'air', 'none', 'air', 'info', { still: 0 }],
      ['mini', 4, 'loop', 12, null, 'pending', [18, 20], [9, 11], 'air', 'none', 'air', 'info', { still: 0 }]
    ],
    tarJar: [
      ['crack', 3, 'prog', 0, 0.32, 'mark', [80, 56], [40, 34], 'target', 'none', 'ally', 'info'],
      ['pool', 1, 'idx', 0, 1.5, 'decal', [104, 44], [52, 22], 'target', 'none', 'ground', 'deco'],
      ['jar', 4, 'loop', 8, null, 'flight', [34, 38], [17, 19], 'air', 'none', 'air', 'info', { still: 0 }],
      ['jar-awakened', 4, 'loop', 8, null, 'flight', [34, 38], [17, 19], 'air', 'none', 'air', 'info', { still: 0 }],
      // delivery 3a: the sticky gathering (zone): tar strings pulled from the rim, the broken jar in the middle
      ['string-a', 4, 'loop', 8, null, 'zone', [40, 14], [36, 7], 'ring', 'radial', 'ground', 'info', { still: 1 }],
      ['string-b', 4, 'loop', 8, null, 'zone', [40, 14], [36, 7], 'ring', 'radial', 'ground', 'info', { still: 1 }],
      ['jarBroken', 1, 'idx', 0, null, 'variant', [36, 26], [18, 18], 'center', 'none', 'ground', 'info']
    ],
    meteorBrush: [
      ['impact', 3, 'prog', 0, 0.36, 'mark', [88, 68], [44, 46], 'target', 'none', 'ally', 'info', { flash: true }],
      ['impact-awakened', 3, 'prog', 0, 0.36, 'mark', [88, 68], [44, 46], 'target', 'none', 'ally', 'info', { flash: true }],
      ['crater', 1, 'idx', 0, 1.5, 'decal', [120, 52], [60, 26], 'target', 'none', 'ground', 'info'],
      ['comet', 4, 'loop', 12, null, 'flight', [32, 92], [16, 14], 'air', 'path', 'air', 'info', { still: 0 }],
      ['comet-awakened', 4, 'loop', 12, null, 'flight', [32, 92], [16, 14], 'air', 'path', 'air', 'info', { still: 0 }],
      // delivery 3a: the star mark (zone) - paper star motes rising
      ['mote-a', 4, 'cycle', 0, 1.2, 'zone', [10, 14], [5, 12], 'disc', 'none', 'ally', 'deco'],
      ['mote-b', 4, 'cycle', 0, 1.2, 'zone', [10, 14], [5, 12], 'disc', 'none', 'ally', 'deco'],
      // delivery 3b2: the hero's haste while standing in the star mark (right after the hero's body)
      ['haste', 4, 'loop', 12, null, 'status', [52, 40], [26, 36], 'hero', 'face', 'front', 'info', { still: 0 }]
    ],
    sparkThread: [
      ['spark', 2, 'prog', 0, null, 'chain', [24, 24], [12, 12], 'point', 'none', 'ally', 'deco'],
      ['spark-awakened', 2, 'prog', 0, null, 'chain', [24, 24], [12, 12], 'point', 'none', 'ally', 'deco']
    ],
    stormThread: [
      ['gust-a', 2, 'prog', 0, null, 'chain', [24, 20], [12, 10], 'point', 'none', 'ally', 'deco'],
      ['gust-b', 2, 'prog', 0, null, 'chain', [32, 26], [16, 13], 'point', 'none', 'ally', 'deco']
    ],
    frostChainlet: [
      ['rime12', 1, 'idx', 0, null, 'class', [36, 18], [18, 9], 'feet', 'none', 'feet', 'info', { r: 12 }],
      ['rime19', 1, 'idx', 0, null, 'class', [48, 22], [24, 11], 'feet', 'none', 'feet', 'info', { r: 19 }],
      ['rime28', 1, 'idx', 0, null, 'class', [64, 28], [32, 14], 'feet', 'none', 'feet', 'info', { r: 28 }]
    ],
    inkLance: [
      ['tassel', 2, 'prog', 0, null, 'beam', [60, 22], [56, 11], 'origin', 'beam', 'ally', 'info'],
      ['tassel-awakened', 2, 'prog', 0, null, 'beam', [60, 22], [56, 11], 'origin', 'beam', 'ally', 'info'],
      // delivery 3b2: where the lance's tip splits into its two branch lances (place 'point', not 'origin': §12)
      ['fork', 2, 'prog', 0, 0.2, 'event', [28, 28], [14, 14], 'point', 'beam', 'ally', 'deco']
    ],
    wideBrush: [
      ['brush', 3, 'prog', 0, null, 'beam', [56, 48], [14, 24], 'tip', 'beam', 'ally', 'info'],
      ['brush-awakened', 3, 'prog', 0, null, 'beam', [56, 48], [14, 24], 'tip', 'beam', 'ally', 'info']
    ],
    crossStrokes: [
      ['scrap-a', 2, 'prog', 0, null, 'beam', [20, 16], [10, 8], 'tip', 'beam', 'ally', 'deco'],
      ['scrap-b', 2, 'prog', 0, null, 'beam', [20, 16], [10, 8], 'tip', 'beam', 'ally', 'deco']
    ],
    judgmentLine: [
      ['inkbox', 2, 'prog', 0, null, 'beam', [64, 30], [60, 15], 'origin', 'beam', 'ally', 'info'],
      ['inkbox-awakened', 2, 'prog', 0, null, 'beam', [64, 30], [60, 15], 'origin', 'beam', 'ally', 'info'],
      ['flick-a', 2, 'prog', 0, 0.24, 'beam', [22, 18], [11, 9], 'line', 'beam', 'ally', 'deco'],
      ['flick-b', 2, 'prog', 0, 0.24, 'beam', [22, 18], [11, 9], 'line', 'beam', 'ally', 'deco']
    ],
    inkOrbit: [
      ['chip-a', 2, 'prog', 0, 0.24, 'mark', [16, 12], [4, 6], 'ring', 'radial', 'ally', 'deco'],
      ['chip-b', 2, 'prog', 0, 0.24, 'mark', [16, 12], [4, 6], 'ring', 'radial', 'ally', 'deco'],
      // delivery 3b2: an enemy shot turned back by the band (hit r 7), turned along its velocity
      ['deflect-start', 2, 'prog', 0, 0.06, 'vel', [40, 18], [27, 9], 'air', 'vel', 'ally', 'info'],
      ['deflect-travel', 2, 'loop', 12, null, 'vel', [40, 18], [27, 9], 'air', 'vel', 'ally', 'info', { still: 0 }],
      ['deflect-end', 2, 'prog', 0, 0.1, 'vel', [40, 18], [27, 9], 'air', 'vel', 'ally', 'info']
    ],
    wardRing: [
      ['knot-a', 1, 'idx', 0, null, 'variant', [22, 18], [11, 9], 'ring', 'radial', 'ally', 'info'],
      ['knot-b', 1, 'idx', 0, null, 'variant', [22, 18], [11, 9], 'ring', 'radial', 'ally', 'info'],
      // delivery 3b1: the weaken mark over an enemy's head
      ['mark-weak', 1, 'idx', 0, null, 'status', [22, 22], [11, 20], 'over', 'none', 'head', 'info']
    ],
    eclipseHalo: [
      ['ribbon-a', 3, 'loop', 12, null, 'mark', [36, 18], [32, 9], 'ring', 'tangent', 'ally', 'info', { still: 0 }],
      ['ribbon-b', 3, 'loop', 12, null, 'mark', [36, 18], [32, 9], 'ring', 'tangent', 'ally', 'info', { still: 0 }],
      // delivery 3a: the total eclipse's corona flags
      ['corona-a', 2, 'prog', 0, 0.3, 'mark', [26, 14], [3, 7], 'ring', 'radial', 'ally', 'deco'],
      ['corona-b', 2, 'prog', 0, 0.3, 'mark', [26, 14], [3, 7], 'ring', 'radial', 'ally', 'deco']
    ]
  };
  const PARTS = {};
  Object.keys(PT).forEach((g) => {
    PARTS[g] = PT[g].map((r) => {
      const ex = r[12] || {};
      const d = {
        part: r[0], frames: r[1], drive: r[2], fps: r[3], seconds: r[4], still: r[2] === 'loop' ? (ex.still == null ? 0 : ex.still) : null,
        box: r[6].slice(), anchor: r[7].slice(), place: r[8], rotate: r[9], layer: r[10], lod: r[11], flash: !!ex.flash, window: r[5]
      };
      if (ex.r) d.r = ex.r;
      return Object.freeze(Object.assign(d, { box: Object.freeze(d.box), anchor: Object.freeze(d.anchor) }));
    });
  });
  const GROUPS = IDS.filter((id) => PARTS[id]);
  function partOf(group, part) {
    const list = PARTS[group];
    if (!list) throw new Error('PN.arsenalFx: unknown group ' + group);
    const p = list.find((q) => q.part === part);
    if (!p) throw new Error('PN.arsenalFx: unknown part ' + group + '/' + part);
    return p;
  }

  // ==== 3. stamps (art drawn round the anchor (0,0); +x = the part's rotate direction) ====
  const ART = {};
  GROUPS.forEach((g) => { ART[g] = {}; });

  // ---- inkLightning: a vertical ink bolt from a small ink cloud (painted height ~108), paper core, cyan core ----
  const BOLT = [[2, -96], [-5, -84], [6, -62], [-3, -50], [7, -26], [-3, -19], [1, 0]];
  // branches stay in the upper half and short (two long lower branches read as legs)
  const BOLT_BR = [[6, -62], [11, -56], [9.4, -51.2], [12.4, -46.6]];
  const BOLT_BR2 = [[-5, -84], [-10.4, -77.2], [-8.8, -72.4], [-12, -67.4]];
  const boltW = (t) => (t < 0.22 ? lerp(7.5, 11.5, t / 0.22) : lerp(11.5, 4.6, (t - 0.22) / 0.78));
  const CLOUD = [[-7, -98.6, 5.4], [1, -101.6, 5.8], [8, -98.4, 4.8], [-11, -96.2, 3.4], [4, -95.4, 4.4]];
  function cloud(col, lit, k, sil) {
    let s = '';
    if (lit) s += CLOUD.map((q) => Cir(q[0], q[1], q[2] * k, lit)).join('');
    s += CLOUD.map((q) => Cir(q[0] + (lit ? 1.1 : 0), q[1] + (lit ? 1.1 : 0), q[2] * k - (lit ? 0.5 : 0), col)).join('');
    if (sil) CLOUD.forEach((q) => sil.push(circD(q[0], q[1], q[2] * k)));
    return s;
  }
  function boltArt(fr, aw) {
    const sil = [];
    let s = '', front = '';
    if (fr === 0) {
      // the strike: the brightest frame, a paper splash where it lands and two speed strokes up the bolt
      s += F(starD(0, -2.4, 5, 6, 13, -Math.PI / 2, 0.42), 'p50', { st: 'ink', sw: 1 });
      s += taper([[-11, -64], [-11.6, -86]], 1.9, 0.3) + taper([[10.6, -38], [11.2, -53]], 1.5, 0.3);
      s += Cir(-7.5, -3, 1.1, 'ink') + Cir(8.6, -5.2, 0.8, 'ink');
    }
    if (fr === 3) {
      // what is left: ink dashes along the path, a thinning cloud
      s += S(line(BOLT), 'ink', 2.6, { cap: 'butt', dash: [6, 4], a: 0.85 });
      s += cloud('ink300', null, 0.7);
      return s;
    }
    const k = [1, 0.85, 0.55][fr];
    const main = brushD(dens(BOLT, 3), (t) => boltW(t) * k);
    sil.push(main);
    let body = F(main, 'ink');
    const brs = [];
    if (fr >= 1) brs.push(BOLT_BR);
    if (aw) brs.push(BOLT_BR2);
    brs.forEach((b) => { const d = brushD(dens(b, 2), (t) => lerp(3.8, 0.5, t) * (fr === 2 ? 0.7 : 1)); sil.push(d); body += F(d, 'ink'); });
    body += cloud(fr === 2 ? 'ink700' : 'ink', fr === 2 ? null : 'ink500', 1, sil);
    if (fr < 2) {
      front += S(line(cutAlong(BOLT, 0.05, 0.93)), 'p50', fr === 0 ? 2.2 : 1.6);
      front += S(line(cutAlong(BOLT, 0.12, fr === 0 ? 0.64 : 0.5)), 'ally', 1.4);
      if (brs.length) front += S(line(cutAlong(brs[0], 0.05, 0.6)), 'p50', 0.8);
    } else front += S(line(cutAlong(BOLT, 0.1, 0.85)), 'p50', 0.8);
    s += aw ? rimmed(sil.join(' '), body + front) : body + front;
    if (aw && fr === 0) s += sparkle(-6, -104.6, 2.8, 6, 3);
    return s;
  }
  ART.inkLightning.bolt = (fr) => boltArt(fr, false);
  ART.inkLightning['bolt-awakened'] = (fr) => boltArt(fr, true);
  // pale scorch on the ground (ink.300 blot, no cracks)
  ART.inkLightning.scorch = () => F(blotE(0, 0.4, 18, 6.6, 31, 11, 0.28), 'ink300') + F(blotE(-3, 0, 10, 3.6, 32, 9, 0.35), 'ink500', { a: 0.7 }) +
    Cir(12.4, -3.6, 1.1, 'ink700') + Cir(-14.6, 3.2, 0.9, 'ink700') + F(chipD(15.2, 2.4, 1.4, 33, 0.4), 'ink700') + Cir(5.4, 4.6, 0.7, 'ink700');

  // ---- brushDownpour: one thick brush stroke coming down from the upper right, its head pressed on the anchor ----
  // a: 18° off vertical, 64 long; b: 26°, 68 long (the order's 76 does not fit the 48-wide box at 26°)
  function rainStroke(deg, len, fr, aw, seed) {
    const a = deg * RAD, u = [Math.sin(a), -Math.cos(a)], nr = [Math.cos(a), Math.sin(a)];
    const H = [0, -6], T = [H[0] + u[0] * len, H[1] + u[1] * len];
    const C = (s) => { const b = 1.4 * Math.sin(Math.PI * s * 1.6); return [lerp(T[0], H[0], s) + nr[0] * b, lerp(T[1], H[1], s) + nr[1] * b]; };
    const W = (s) => lerp(1.2, 13.2, Math.pow(s, 0.85));
    const solid = [0.4, 0.62, 0.88][fr], col = fr === 2 ? 'ink700' : 'ink';
    const sil = [];
    let s = '', body = '';
    if (fr === 0) {
      // speed strokes up the path (on the light side, different lengths) and drops thrown off the pressed head
      const s1 = C(0.58), s2 = C(0.34);
      s += taper([[s1[0] - nr[0] * 11, s1[1] - nr[1] * 11], [s1[0] - nr[0] * 11 + u[0] * 15, s1[1] - nr[1] * 11 + u[1] * 15]], 1.5, 0.3);
      s += taper([[s2[0] - nr[0] * 9, s2[1] - nr[1] * 9], [s2[0] - nr[0] * 9 + u[0] * 9, s2[1] - nr[1] * 9 + u[1] * 9]], 1.1, 0.3);
      s += Cir(-9.4, -1.4, 1.4, 'ink') + Cir(8.8, 0.2, 1.1, 'ink') + Cir(-5.8, 1.6, 0.8, 'ink') + Cir(10.6, -4.6, 0.7, 'ink');
    }
    const pts = samp((t) => C(lerp(solid, 1, t)), 14);
    const d = brushD(pts, (t) => W(lerp(solid, 1, t)));
    sil.push(d);
    body += F(d, col);
    // the pressed head: a flat, ragged press mark wider than tall (a round ball would read as the enemy's teardrop brush head)
    const hk = fr === 2 ? 0.8 : 1, head = blotE(H[0] + 0.8, H[1] + 2.6, 7.6 * hk, 3.8 * hk, seed + 5, 11, 0.34);
    sil.push(head);
    body += F(head, col) + taper([[H[0] - 5.2, H[1] + 4.4], [H[0] - 8.6, H[1] + 5.6]], 1.4 * hk, 0.3, col) + taper([[H[0] + 6, H[1] + 4.6], [H[0] + 9.6, H[1] + 5.2]], 1.2 * hk, 0.3, col);
    // dry brush (비백): three bristle strokes in the tail with ground showing between them; they lift (start later) frame by frame
    [[-0.32, 0.03], [0.04, 0.0], [0.3, 0.06]].forEach(([o, s0], i) => {
      const s1 = Math.min(1, solid + 0.1), st = s0 + fr * 0.18;
      if (st >= s1 - 0.02) return;
      const bp = samp((t) => { const q = lerp(st, s1, t), c = C(q), w = W(q); return [c[0] + nr[0] * w * o, c[1] + nr[1] * w * o]; }, 8);
      const bd = brushD(bp, (t) => lerp(0.35, 2.1 - 0.3 * i, t));
      sil.push(bd);
      body += F(bd, fr === 0 ? col : (fr === 1 ? 'ink700' : 'ink300'));
    });
    // the wet line: one cyan streak along the body on the light side
    if (fr < 2) {
      const wp = samp((t) => { const q = lerp(fr === 0 ? 0.55 : 0.68, 0.9, t), c = C(q), w = W(q); return [c[0] - nr[0] * w * 0.18, c[1] - nr[1] * w * 0.18]; }, 8);
      body += SW(smooth(wp), [['ally', 1.2], ['allyG', 0.4]]);
    }
    s += aw && fr < 2 ? rimmed(sil.join(' '), body) : body;
    if (aw && fr === 0) s += sparkle(T[0] - 3.6, T[1] - 1.2, 2.6, 5, seed);
    return s;
  }
  ART.brushDownpour['stroke-a'] = (fr) => rainStroke(18, 64, fr, false, 41);
  ART.brushDownpour['stroke-b'] = (fr) => rainStroke(26, 68, fr, false, 42);
  ART.brushDownpour['stroke-a-awakened'] = (fr) => rainStroke(18, 64, fr, true, 41);
  ART.brushDownpour['stroke-b-awakened'] = (fr) => rainStroke(26, 68, fr, true, 42);
  /** Ground mark of a stroke: an ink blot with a dry tail toward where the stroke came from (upper right, flattened). */
  function rainMark(w, h, seed) {
    const B = [-w * 0.1, h * 0.05], rx = w * 0.2, ry = h * 0.25;
    let s = F(blotE(B[0], B[1], rx, ry, seed, 10, 0.32), 'ink700');
    const dir = [0.94, -0.34];
    [[-0.5, 0.95, 1.3], [0.05, 1.25, 1.0], [0.55, 0.8, 0.8]].forEach(([o, L, wk], i) => {
      const p0 = [B[0] + rx * 0.5 - dir[1] * ry * o * 0.9, B[1] + ry * o * 0.7], p1 = [p0[0] + dir[0] * rx * L * 1.25, p0[1] + dir[1] * rx * L * 0.42 * 1.25];
      s += taper([p0, [lerp(p0[0], p1[0], 0.5), lerp(p0[1], p1[1], 0.5) + 0.4], p1], ry * 0.42 * wk, 0.2, i === 1 ? 'ink700' : 'ink300');
    });
    s += Cir(B[0] - rx * 1.05, B[1] + ry * 0.5, Math.max(0.8, h * 0.04), 'ink700') + Cir(B[0] + rx * 0.1, B[1] + ry * 1.18, Math.max(0.7, h * 0.03), 'ink700');
    return s;
  }
  ART.brushDownpour['mark-s'] = () => rainMark(56, 28, 51);
  ART.brushDownpour['mark-m'] = () => rainMark(76, 36, 52);
  ART.brushDownpour['mark-l'] = () => rainMark(100, 46, 53);

  // ---- fallingScroll: a hanging scroll (paper screen, ink rods, end knobs, cyan hanging cord), painted height ~94 ----
  // Baked upright in every frame; the renderer turns it about the anchor by SPEC.tilt (0 / 6 / 12 / 12°, side per event).
  function scrollArt(fr, aw) {
    const fade = fr === 3;
    const pc = fade ? 'p300' : 'p50', ln = fade ? 'ink300' : 'ink', rod = fade ? 'ink300' : 'ink';
    const sil = [];
    let b = '';
    // hanging cord (cyan) from the top rod to the hook, swinging in frames 1-2
    const sw = [0, 2.6, -1.8, 0][fr];
    const cord = `M-9,-87.5 C${f(-6 + sw)},-95 ${f(6 + sw)},-95 9,-87.5`;
    b += SW(cord, fade ? [['ink300', 2], ['allyD', 1]] : [['ink', 2.4], ['ally', 1.3]]);
    b += Cir(sw * 0.5, -93.2, 0.9, ln);
    // top rod with knobs
    const top = 'M-13,-87.6 L13,-87.6 L13,-84.6 L-13,-84.6 Z';
    sil.push(top, circD(-14.3, -86.1, 1.9), circD(14.3, -86.1, 1.9));
    b += F(top, rod) + Cir(-14.3, -86.1, 1.9, rod) + Cir(14.3, -86.1, 1.9, rod) + S('M-12,-86.9 L11,-86.9', 'ink500', 0.7);
    // mount (p300 border) and picture (paper) with one painted mountain: a pale wash and a single ridge stroke on it
    const mount = 'M-12,-84.6 L12,-84.6 L12,-8.6 L-12,-8.6 Z';
    sil.push(mount);
    b += F(mount, 'p300', { st: ln, sw: 1.6 });
    b += F('M-9,-78.6 L9,-78.6 L9,-17 L-9,-17 Z', pc, { st: ln, sw: 0.8 });
    b += F('M7.6,-78 L9,-78.6 L9,-17 L7.6,-17 Z', 'p300', { a: 0.8 });
    const ridge = samp((t) => { const x = lerp(-8.4, 8.4, t); return [x, -33.4 + 1.4 * t - 9.6 * Math.exp(-Math.pow((x + 2.2) / 3.4, 2)) - 4.2 * Math.exp(-Math.pow((x - 4) / 2.2, 2))]; }, 24);
    b += F(line(ridge.concat([[8.4, -29.6], [-8.4, -29.6]]), true), fade ? 'p300' : 'ink300', { a: 0.55 });
    b += F(brushD(ridge, (t) => 0.4 + 1.5 * Math.sin(Math.PI * Math.min(1, t * 1.1))), fade ? 'ink300' : 'ink');
    // bottom roller with knobs (squashed a little on the impact frame)
    const bot = 'M-16,-6.2 L16,-6.2 L16,-0.8 L-16,-0.8 Z';
    sil.push(bot, circD(-17.8, -3.5, 2.8), circD(17.8, -3.5, 2.8));
    b += F(bot, rod) + Cir(-17.8, -3.5, 2.8, rod) + Cir(17.8, -3.5, 2.8, rod) + S('M-15,-5.2 L14,-5.2', 'ink500', 0.8) + Cir(-18.6, -4.4, 0.8, 'ink500');
    if (aw) {
      // the awakened scroll: a paper tongue starting to unroll from the bottom roller (toward the viewer)
      const tongue = 'M-12,-1.2 L12.4,-1.2 C14,-0.8 15,0 15.2,1.2 C13.6,1.8 11.4,1.6 10.4,1 L-12,1.4 Z';
      sil.push(tongue);
      b += F(tongue, pc, { st: ln, sw: 1.2 }) + S('M10.8,0.9 C12.2,1.3 13.4,1.2 14.4,0.8', ln, 0.7);
    }
    let s = aw && !fade ? rimmed(sil.join(' '), b) : b;
    if (fr === 0) s = TX(s, scaleM(1.03, 0.97));   // pressed on landing
    if (fade) s = GA(s, 0.7);
    if (fr === 0) {
      // landing: speed strokes beside the scroll and dust out from under the bottom roller
      s = taper([[-18.6, -50], [-18.8, -80]], 1.7, 0.3) + taper([[19.2, -64], [19.4, -84]], 1.3, 0.3) + s;
      s += F(blotE(-19.4, -0.6, 3, 2.2, 61, 7, 0.4), 'p300', { st: 'ink300', sw: 0.7 }) + F(blotE(17.4, 0, 2.4, 1.8, 62, 7, 0.4), 'p300', { st: 'ink300', sw: 0.7 }) +
        Cir(-14, 1.6, 0.8, 'ink300') + Cir(13, 1.8, 0.7, 'ink300');
      if (aw) s += sparkle(-5.2, -92.2, 2.6, 5, 7);
    }
    return s;
  }
  ART.fallingScroll.scroll = (fr) => scrollArt(fr, false);
  ART.fallingScroll['scroll-awakened'] = (fr) => scrollArt(fr, true);

  // ---- seventhSeal: a low wide cylinder seal seen from the side (paper body, p300 shade, top ellipse), a neck and a ball
  // knob in ink, cyan face rim ----
  const SEAL_NECK = 'M-2,-19.2 L2,-19.2 L1.5,-25.2 L-1.5,-25.2 Z';
  function sealArt(fr, aw) {
    const lift = [0, 10, 14][fr], last = fr === 2, ln = last ? 'ink300' : 'ink';
    const sil = [];
    let b = '';
    const body = 'M-11,-18 L-11,-2 A11,3.4 0 0 0 11,-2 L11,-18 A11,3.4 0 0 0 -11,-18 Z';
    sil.push(body, SEAL_NECK, circD(0, -28.4, 4));
    b += F(body, last ? 'p300' : 'p50', { st: ln, sw: 2 });
    b += F('M5,-18.6 L11,-18 L11,-2 A11,3.4 0 0 1 5,0.9 Z', 'p300', { a: last ? 0.6 : 1 });
    b += E(0, -18, 11, 3.4, last ? 'p300' : 'p50', { st: ln, sw: 1.4 });
    b += S(ellArc(11, 3.4, 0, -5.2, 0.1, Math.PI - 0.2), 'ink300', 0.9);
    // the face rim (where it presses the ground): cyan on ink
    b += SW(ellArc(11, 3.4, 0, -2, 0.02, Math.PI - 0.04), last ? [['ink300', 2.2], ['allyD', 1.1]] : [['ink', 2.6], ['ally', 1.4]]);
    // knob (K9 review 7 §7, K10 review 2 F2): a neck and a ball, both ink. The ball (d 8, ≤ 0.4 × the body's 22) sits on
    // a neck that shows 5.2 under it, so it reads as a handle, not as a lid on a can or a head on the body
    b += F(SEAL_NECK, ln) + Cir(0, -28.4, 4, ln);
    if (!last) b += Cir(-1.2, -29.6, 1.5, 'ink500') + Cir(-1.7, -30.2, 0.6, 'p50');
    let s = aw && !last ? rimmed(sil.join(' '), b) : b;
    if (fr === 0) s = G('translate(0 0) scale(1.06 0.9)', s);
    if (lift) s = G(tr(0, -lift), s, last ? 0.55 : 1);
    if (fr === 0) {
      s = taper([[-15, -12], [-15.4, -30]], 1.5, 0.3) + taper([[14.4, -18], [14.6, -33]], 1.2, 0.3) + s;
      s += F(blotE(-14.2, 0.4, 2.4, 1.6, 71, 7, 0.4), 'p300', { st: 'ink300', sw: 0.6 }) + F(blotE(13.6, 0.6, 2, 1.4, 72, 7, 0.4), 'p300', { st: 'ink300', sw: 0.6 });
      // the awakened sparkle on the ball's upper right edge (the ball is pressed 1.06 × 0.9 in this frame)
      if (aw) s += sparkle(4.4, -29.4, 2.6, 6, 9);
    }
    if (fr === 1) s += Cir(-6, 0.8, 0.9, 'ink') + Cir(5.2, 1.4, 0.7, 'ink');
    return s;
  }
  ART.seventhSeal.seal = (fr) => sealArt(fr, false);
  ART.seventhSeal['seal-awakened'] = (fr) => sealArt(fr, true);
  /** Round print, lying flat (ry = 0.42 rx): paper α 0.25 under an ink rim stamped only in part (one or two arcs, 70-85 %
   *  of the round, the gaps in a different place on each print) and one knot cord that runs off the centre to and across
   *  the rim (at least half the print wide), a speck or two. a: a loosened cord threaded through the print, in through the
   *  left rim gap, sagging evenly under the middle and out across the right rim; b: a loosened cord out of the rim at the
   *  lower left in one wide bend, its end springing outward over the upper-right rim; c: a wave in a half-moon print (one
   *  side pressed hard: its rim tapers 2.4 → 0.8, the paper lies only under that side), out through the lower-right gap.
   *  All three cords are single brush strokes (`brush`, K10 review 2 F1 and review 3 decision 1): unbroken curvature (no
   *  12° stretch longer than 33 % / 25 % / 25 % of the print), no corner, no closed loop, no end that curls in, dry at
   *  both ends (a pen-even ㄱ and a J-curl read as letters); none runs along the rim (a cord beside the rim read as a
   *  doubled rim or an eyelid). Nothing crosses the centre and there is no centre dot (5장 눈); the layout mirrors them
   *  (J(955)), so a cast's prints come in six shapes.
   *  arcs [from°, to°] are ellipse angles (0 = right, clockwise); knot and dots are in rx / ry units. */
  const PRINTS = {
    'print-a': { rx: 17, arcs: [[215, 400], [70, 165]], brush: true, knot: [[-1.12, -0.2], [-0.86, 0.22], [-0.48, 0.52], [-0.04, 0.64], [0.4, 0.56], [0.74, 0.34], [1.08, 0]], w: 1.4, dots: [[-0.84, 0.66, 0.6], [0.24, 1.16, 0.5]] },
    'print-b': { rx: 13.5, arcs: [[290, 560]], brush: true, knot: [[-0.78, 0.62], [-0.54, 0.76], [-0.2, 0.74], [0.16, 0.58], [0.46, 0.3], [0.66, -0.08], [0.86, -0.46], [1.18, -0.72]], w: 1.3, dots: [[-0.92, 0.58, 0.5]] },
    'print-c': { rx: 10.5, arcs: [[100, 380]], heavy: [0.8, 2.4], brush: true, knot: [[-0.94, 0.1], [-0.57, 0.62], [-0.14, 0.42], [0.23, 0.78], [0.66, 0.98]], w: 1.1, dots: [[0.96, -0.66, 0.5]] }
  };
  function printArt(q) {
    const rx = q.rx, ry = 0.42 * rx, onE = (deg) => [Math.cos(deg * RAD) * rx, Math.sin(deg * RAD) * ry];
    let s = '';
    if (q.heavy) {
      // the half moon: paper only under the pressed side, the rim a brush stroke heavy in its middle
      s += F(line(samp((t) => onE(lerp(125, 335, t)), 14).concat([[-0.06 * rx, 0.04 * ry]]), true), 'p50', { a: 0.25 });
      const A = q.arcs[0];
      s += F(brushD(samp((t) => onE(lerp(A[0], A[1], t)), 28), (t) => q.heavy[0] + (q.heavy[1] - q.heavy[0]) * Math.sin(Math.PI * t)), 'ink');
    } else {
      // the rim arcs as brush strokes: thick in the middle, dry at the ends (K9 review 7 §7)
      s += E(0, 0, rx, ry, 'p50', { a: 0.25 });
      q.arcs.forEach(([a0, a1]) => { s += F(brushD(samp((t) => onE(lerp(a0, a1, t)), Math.max(8, Math.round((a1 - a0) / 8))), (t) => 0.5 + 1.3 * Math.sin(Math.PI * t)), 'ink'); });
    }
    const kp = q.knot.map(([x, y]) => [x * rx, y * ry]);
    // the cord: a brush stroke along the spline, q.w in the middle and 0.4 at both dry ends
    s += q.brush ? F(brushD(crPts(kp, 8), (t) => 0.4 + (q.w - 0.4) * Math.pow(Math.sin(Math.PI * t), 0.6)), 'ink', { a: 0.85 }) : S(smooth(kp), 'ink', q.w, { a: 0.85 });
    q.dots.forEach(([x, y, r]) => { s += Cir(x * rx, y * ry, r, 'ink700'); });
    return s;
  }
  Object.keys(PRINTS).forEach((p) => { ART.seventhSeal[p] = () => printArt(PRINTS[p]); });

  // ---- inkPulse: ink clumps flung outward off the band (+x = outward) ----
  function splashArt(fr, v) {
    const k = v ? 0.85 : 1, dy = v ? 1.6 : -0.6;
    if (fr === 0) return taper([[0, 0.6 + dy], [7.6 * k, dy], [15.6 * k, -1.2 + dy]], 6.6 * k, 1.4) + Cir(17 * k, -1.2 + dy, 2.6 * k, 'ink') +
      Cir(22 * k, -3 + dy, 1.5, 'ink') + Cir(25.4, 1.6 + dy, 1.1, 'ink') + (v ? Cir(19, 4.6, 1, 'ink') : '');
    if (fr === 1) return taper([[3, 1 + dy], [9 * k, 0.4 + dy], [13 * k, dy]], 0.4, 1.6) + F(blotE(17 * k, -0.4 + dy, 4.2 * k, 3.2 * k, 81 + (v ? 1 : 0), 8, 0.3), 'ink') +
      Cir(25, -2.8 + dy, 1.5, 'ink') + Cir(28.4, 2.4 + dy, 1, 'ink') + Cir(7.4, 3.8 + dy, 0.9, 'ink') + (v ? taper([[19, 3.2], [24, 6.4]], 1.4, 0.3) : '');
    return Cir(22 * k, -1 + dy, 2.2, 'ink700') + Cir(27, 2.8 + dy, 1.3, 'ink700') + Cir(16 * k, 3.4 + dy, 0.9, 'ink700') + Cir(29, -3.6 + dy, 0.8, 'ink700') +
      taper([[11, -2 + dy], [17, -3 + dy]], 1, 0.2, 'ink700');
  }
  ART.inkPulse['splash-a'] = (fr) => splashArt(fr, 0);
  ART.inkPulse['splash-b'] = (fr) => G('scale(1 -1)', splashArt(fr, 1));

  // ---- frostRing: fans of straight crystal prisms rooted side by side on an angular ice chip on the band (+x = outward).
  // Each prism has parallel sides and a chisel point and is split along its axis into a paper face and a p300 face; the
  // roots stand 0.8 apart, so the fan never closes into one feather; the ink rim lies under the paper. ----
  function prismGeo(deg, len, w, bx, by) {
    const a = deg * RAD, u = [Math.cos(a), Math.sin(a)], n = [-u[1], u[0]], tl = Math.min(len * 0.3, w * 1.6);
    const at = (t, s) => [bx + u[0] * t + n[0] * s, by + u[1] * t + n[1] * s];
    return {
      out: line([at(0, -w / 2), at(len - tl, -w / 2), at(len, 0), at(len - tl * 0.6, w / 2), at(0, w / 2)], true),
      a: line([at(0, -w / 2), at(len - tl, -w / 2), at(len, 0), at(0, 0)], true),
      b: line([at(0, 0), at(len, 0), at(len - tl * 0.6, w / 2), at(0, w / 2)], true)
    };
  }
  const FROST_CHIP = line([[-2.4, -3.6], [1.6, -4.8], [3.6, -1.6], [3, 3.2], [-0.6, 4.6], [-2.8, 1]], true);
  function shardArt(spikes, fr, aw, seed) {
    const k = [0.55, 1, 1][fr], last = fr === 2, w = aw ? 3 : 2.6, n = spikes.length, sil = [];
    let out = '', fa = '', fb = '';
    spikes.forEach(([deg, len], i) => {
      const g = prismGeo(deg, len * k * (last && i === 1 ? 0.6 : 1), w, 0.4, (i - (n - 1) / 2) * (w + 0.8));
      out += g.out + ' '; fa += g.a + ' '; fb += g.b + ' ';
    });
    sil.push(out.trim(), FROST_CHIP);
    let b = S(out + FROST_CHIP, last ? 'ink300' : 'ink', 3) + F(fa.trim(), last ? 'p300' : 'p50') + F(fb.trim(), 'p300') +
      F(FROST_CHIP, last ? 'p300' : 'p50', { st: last ? 'ink300' : 'ink', sw: 1.2 }) + F('M1.6,-4.8 L3.6,-1.6 L3,3.2 L1.2,0.6 Z', 'p300');
    if (last) { const q = spikes[1]; b += F(chipD(Math.cos(q[0] * RAD) * q[1] * 0.78, Math.sin(q[0] * RAD) * q[1] * 0.78, 1.6, seed + 20, 0.3), 'p300', { st: 'ink300', sw: 0.6 }); }
    let s = aw && !last ? rimmed(sil.join(' '), b) : b;
    if (aw && fr === 0) s += sparkle(Math.cos(spikes[0][0] * RAD) * spikes[0][1] * 0.3 + 1, Math.sin(spikes[0][0] * RAD) * spikes[0][1] * 0.3 - 6.4, 2.4, 5, seed + 30);
    return s;
  }
  // [deg, length]: plain 14-27, awakened 19-34.5 (the longest the boxes hold), sorted by angle
  const SHARDS = {
    'shard-a': [[-26, 14], [-9, 26.5], [10, 22], [27, 15]],
    'shard-b': [[-20, 19], [3, 26.5], [24, 16]],
    'shard-c': [[-30, 14], [-12, 20], [6, 25], [24, 18]],
    'shard-awakened-a': [[-26, 19], [-8, 34], [11, 29], [28, 19]],
    'shard-awakened-b': [[-21, 26], [4, 34.5], [25, 22]]
  };
  Object.keys(SHARDS).forEach((p, i) => { ART.frostRing[p] = (fr) => shardArt(SHARDS[p], fr, /awakened/.test(p), 90 + 10 * i); });

  // ---- thunderclap: two paper hands seen from the side clapping above the head, tilted 32° (never upright) ----
  const HAND = [[-4.4, 2.6], [-5.4, -5.4], [-5.2, -11.4], [-4.2, -16.8], [-2.6, -20.6], [-0.6, -21.6], [1, -20.2], [1.6, -15.6], [2, -11.4],
    [3, -9.8], [5.4, -12.2], [7, -12.6], [7.4, -11.2], [6, -8.2], [4.2, -4.6], [3.8, -0.4], [3.6, 2.6]];
  function handD(mx, dx, dy) { return smooth(HAND.map(([x, y]) => [mx * x + dx, y + (dy || 0)]), true); }
  function handArt(mx, dx, ln, pc, dy) {
    const X = (x) => mx * x + dx, Y = (y) => y + (dy || 0);
    let s = F(handD(mx, dx, dy), pc, { st: ln, sw: 1.7 });
    s += F(line([[X(-4.6), Y(0.2)], [X(3.8), Y(0.2)], [X(3.7), Y(3.6)], [X(-4.5), Y(3.6)]], true), ln);
    s += S(`M${f(X(-3))},${f(Y(-13.6))} L${f(X(-1.4))},${f(Y(-20))}`, ln, 0.8) + S(`M${f(X(-0.6))},${f(Y(-12.4))} L${f(X(0.6))},${f(Y(-18.4))}`, ln, 0.8) +
      S(`M${f(X(1.6))},${f(Y(-9))} C${f(X(2.6))},${f(Y(-7.6))} ${f(X(3.2))},${f(Y(-6))} ${f(X(3.6))},${f(Y(-4.4))}`, 'ink300', 0.8);
    s += F(line([[X(4.6), Y(-6)], [X(3.9), Y(-1)], [X(3.7), Y(0.2)], [X(4.3), Y(-5)]], true), 'p300', { a: 0.9 });
    return s;
  }
  function clapArt(fr, aw) {
    const gap = [10, 0, 7][fr], last = fr === 2, ln = 'ink';
    // the hands meet at different angles: the back (left, p300) hand is turned 40°, the front one 14°, both about the point
    // where the fingertips meet, so the pair opens toward the wrists and never closes into one pressed (praying) shape;
    // at the clap the front hand also sits lower (off-line)
    const dx = 3.8 + gap / 2, dyB = fr === 1 ? 4.2 : 1.6, pv = [0, -20.6];
    const mL = rotM(40, pv[0], pv[1]), mR = rotM(14, pv[0], pv[1]);
    const sil = [txPath(handD(1, -dx), mL), txPath(handD(-1, dx, dyB), mR)];
    const hands = TX(handArt(1, -dx, ln, 'p300'), mL) + TX(handArt(-1, dx, ln, last ? 'p300' : 'p50', dyB), mR);
    let over = '';
    if (fr === 1) {
      // the clap: an uneven paper flash (7 points, r 10.5) where the fingertips meet, a cyan core in it, and two impact
      // strokes of different length off the meeting point
      over += F(starD(1.2, -18.4, 10.5, 7, 21, -0.3, 0.42), 'p50', { st: 'ink', sw: 1.2 });
      over += F(starD(1.2, -18.4, 4.4, 5, 22, 0.2, 0.45), 'ally', { st: 'ink', sw: 0.8 }) + Cir(1.4, -18.2, 1.1, 'allyG');
      over += taper([[-10.6, -14.6], [-17.2, -14.4]], 1.6, 0.3) + taper([[8.8, -9.6], [13.6, -6.8]], 1.3, 0.3);
    }
    if (fr === 0) over += taper([[-18.6, -12.4], [-22.4, -11.2]], 1.4, 0.3) + taper([[12.4, -14.6], [16.4, -13.4]], 1.4, 0.3);
    if (last) over += F(blotE(-15.4, -4.6, 2.6, 1.8, 23, 7, 0.4), 'p300', { st: 'ink300', sw: 0.6 }) + F(blotE(8.4, -2.6, 2.2, 1.6, 24, 7, 0.4), 'p300', { st: 'ink300', sw: 0.6 }) +
      Cir(-19, -10, 0.7, 'ink300') + Cir(12, -9, 0.6, 'ink300') + Cir(3, -27.4, 0.7, 'ink300');
    const body = (aw && !last ? rimmed(sil.join(' '), hands) : hands) + over;
    // placed with real coordinates so the box is exact
    let s = TX(body, chainM(transM(9.4, -10.2), scaleM(1)));
    if (aw && fr === 0) s += sparkle(9.4, -34.6, 2.4, 6, 25);
    return s;
  }
  ART.thunderclap.clap = (fr) => clapArt(fr, false);
  ART.thunderclap['clap-awakened'] = (fr) => clapArt(fr, true);

  // ---- silenceBell: a small paper hand bell, handle up, its ink clapper lashed with cyan thread (a bell that cannot ring) ----
  function bellArt(fr, aw) {
    const rot = [-12, 12, 0][fr], last = fr === 2, ln = last ? 'ink300' : 'ink', pc = last ? 'p300' : 'p50';
    const sil = [];
    let b = '';
    const bodyD = 'M-4.4,-31.4 C-6.2,-30.4 -7.6,-26.4 -8.2,-20.6 C-8.8,-14.8 -10.4,-11.4 -12,-9.6 L12,-9.6 C10.4,-11.4 8.8,-14.8 8.2,-20.6 C7.6,-26.4 6.2,-30.4 4.4,-31.4 Z';
    sil.push(bodyD, 'M-1.9,-44 L1.9,-44 L1.9,-32 L-1.9,-32 Z', ellD(0, -44.4, 2.6, 1.8), ellD(0, -9.6, 12, 3), circD(0.5, -5.8, 3));
    // clapper behind the lip, lashed with cyan thread
    b += Cir(0.5, -5.8, 3, ln) + (last ? '' : Cir(-0.4, -6.6, 1.2, 'ink500'));
    b += F('M-1.9,-44 L1.9,-44 L1.9,-32 L-1.9,-32 Z', ln) + S('M-0.8,-43 L-0.8,-33', 'ink500', 0.8) + F(ellD(0, -44.4, 2.6, 1.8), ln);
    b += F(bodyD, pc, { st: ln, sw: 2.2 });
    b += F('M4.4,-31.4 C6.2,-30.4 7.6,-26.4 8.2,-20.6 C8.8,-14.8 10.4,-11.4 12,-9.6 L6.6,-9.6 C6.8,-14 6.6,-22 4.4,-31.4 Z', 'p300', { a: last ? 0.5 : 1 });
    b += F(ellD(0, -32, 4.2, 1.3), 'p300', { st: ln, sw: 1 });
    b += F(ellD(0, -9.6, 12, 3), ln) + S(ellArc(11.2, 2.4, 0, -9.2, 0.2, Math.PI - 0.4), 'p300', 1);
    b += S('M-6.2,-27 C-6.8,-22 -7.4,-17 -9,-13.4', 'p50', 0.8);
    // the lashing: a cyan wrap round the clapper's neck and a tie up into the bell (cyan on ink)
    b += SW(ellArc(3.4, 1.4, 0.5, -8.2, 0.15, Math.PI - 0.3), last ? [['ink300', 2], ['allyD', 1]] : [['ink', 2.2], ['ally', 1.2]]);
    b += SW('M-2.4,-8.6 C-3.6,-9.6 -4.2,-10.6 -4.6,-11.6', last ? [['ink300', 1.8], ['allyD', 0.9]] : [['ink', 1.9], ['ally', 1]]);
    b += SW('M3.6,-7.8 C4.8,-6.6 5.2,-5.4 5,-4', last ? [['ink300', 1.6], ['allyD', 0.8]] : [['ink', 1.7], ['ally', 0.9]]);
    let s = aw && !last ? rimmed(sil.join(' '), b) : b;
    s = GA(TX(s, chainM(transM(0, 1.4), rotM(rot, 0, -24))), last ? 0.65 : 1);
    if (aw && fr === 0) s += sparkle(-6.4, -40.2, 2.4, 5, 27);
    return s;
  }
  ART.silenceBell.bell = (fr) => bellArt(fr, false);
  ART.silenceBell['bell-awakened'] = (fr) => bellArt(fr, true);

  // ---- inkPots: a white porcelain pot bursting: paper shards, a big ink splash, a paper flash, the cyan neck cord ----
  // pot body ellipse (cx, cy, rx, ry); shards are curved pieces of it (k = inner radius share, moved and turned)
  function potShard(cx, cy, rx, ry, a0, a1, k, dx, dy, rotDeg, inner) {
    const out = [], inn = [];
    for (let i = 0; i <= 5; i++) { const a = lerp(a0, a1, i / 5); out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); inn.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    const mid = [(out[2][0] + out[3][0]) / 2, (out[2][1] + out[3][1]) / 2];
    const pts = out.concat(inn.reverse().map((p, i) => [p[0] + (i % 2 ? 0.6 : -0.5), p[1] + (i % 2 ? -0.4 : 0.5)]));
    const moved = pts.map(([x, y]) => { const c = Math.cos(rotDeg * RAD), s = Math.sin(rotDeg * RAD), X = x - mid[0], Y = y - mid[1]; return [mid[0] + X * c - Y * s + dx, mid[1] + X * s + Y * c + dy]; });
    return { d: line(moved, true), inner: inner ? line(moved.slice(6).concat([moved[5]]), false) : '' };
  }
  const SHATTER = [[-2.9, -1.9], [-1.9, -0.7], [-0.7, 0.5], [0.5, 1.6], [1.6, 3.3]];
  /** A curved porcelain shard (a piece of the pot wall): paper outside, a p300 band on its inner side, ink edge. len along
   *  the curve, th thick, its outside turned toward screen angle `deg`, centred near (cx, cy). */
  function porcelain(cx, cy, len, th, deg, seed) {
    const rc = len * 1.15, sp = len / rc, a0 = -Math.PI / 2 - sp / 2, out = [], inn = [], mid = [];
    for (let i = 0; i <= 6; i++) {
      const a = a0 + sp * i / 6, j = (jit(seed, i) - 0.5) * 0.6;
      out.push([Math.cos(a) * rc, Math.sin(a) * rc + rc]);
      inn.push([Math.cos(a) * (rc - th + j), Math.sin(a) * (rc - th + j) + rc]);
      mid.push([Math.cos(a) * (rc - th * 0.5), Math.sin(a) * (rc - th * 0.5) + rc]);
    }
    const m = chainM(transM(cx, cy), rotM(deg + 90), transM(0, -th / 2));
    return TX(F(line(out.concat(inn.slice().reverse()), true), 'p50', { st: 'ink', sw: 1.3 }) + F(line(mid.concat(inn.slice().reverse()), true), 'p300'), m);
  }
  // frame 0: the five shards just split off the pot (centre (0, -12)), 8-12 out, of different sizes and turns, none in
  // the lower right (five pieces evenly round a black core read as a broken white ring): [angle°, distance, len, thick, turn°]
  const SHATTER0 = [[-150, 12, 9.6, 3.4, 34], [-98, 8, 5.6, 2.8, -48], [-28, 12, 8.4, 3.1, 36], [32, 8.2, 5.2, 2.6, 62], [168, 10.6, 8.8, 3.3, -42]];
  function shatterArt(fr) {
    let s = '';
    if (fr === 0) {
      // the hit, the strongest frame: a paper flash (r 23) whose points show behind the big ink splash (the same splash
      // frame 1 keeps, before its drops fly), the five porcelain shards just split off round it (inside p300), the lid (no
      // knob) thrown up and left, the broken neck cord thrown up and right. No pot body: the whole pot is the flight's.
      // the star's valleys stay inside the splash's blot, so only separate rays show (a paper collar round a black
      // core reads as a black sun)
      s += F(starD(0, -11, 23, 7, 101, -0.25, 0.32), 'p50', { st: 'ink', sw: 1.4 });
      s += inkBurst(0, -9, 10, 105, { arms: 8, reach: [1.8, 3.1], drops: 0, flat: 0.9 });
      SHATTER0.forEach(([deg, d, len, th, turn], i) => {
        const c = polar(d, deg * RAD, 0, -12);
        s += porcelain(c[0], c[1], len, th, deg + turn, 106 + i);
      });
      s += TX(F('M-6.6,0 C-6,-4.6 6,-4.6 6.8,-0.6 C3,0.8 -3,0.8 -6.6,0 Z', 'ink', { st: 'ink', sw: 1 }) + S('M-4,-2.6 C-1,-3.6 2,-3.4 4,-2.6', 'ink500', 0.8), chainM(transM(-15.6, -27.4), rotM(-26)));
      s += SW('M8.2,-22.6 C11.2,-25.8 14.8,-26.6 17.8,-25', [['ink', 2.4], ['ally', 1.3], ['allyG', 0.4]]);
      return s;
    }
    const far = fr === 2;
    s += inkBurst(0, far ? -4 : -9, far ? 7.6 : 10, 104 + fr, { arms: 8, reach: far ? [1.6, 2.4] : [1.8, 3.1], wk: far ? 0.7 : 1, col: far ? 'ink700' : 'ink', drops: 0.6, flat: far ? 0.7 : 0.9 });
    const D = far ? [19, 23] : [15, 19];
    SHATTER.forEach(([a0, a1], i) => {
      const m = (a0 + a1) / 2, r = lerp(D[0], D[1], jit(105, i)), dx = Math.cos(m) * r, dy = Math.sin(m) * r * 0.7 + (far ? 6.4 : 2);
      const sh = potShard(0, -12, 11.5, 11, a0 + 0.05, a1 - 0.05, 0.6, dx, dy, (i - 2) * 22 + (far ? 40 : 0), true);
      s += F(sh.d, far ? 'p300' : 'p50', { st: far ? 'ink300' : 'ink', sw: 1.3 }) + (sh.inner ? S(sh.inner, 'p300', 1.4) : '');
    });
    // the neck cord flies off up and right
    s += SW(far ? 'M15,-2 C18,-1 21,0.6 23,3' : 'M13,-24 C16.6,-27 20.4,-27.4 23.6,-25.6', far ? [['ink300', 2], ['allyD', 1.1]] : [['ink', 2.4], ['ally', 1.3], ['allyG', 0.4]]);
    if (!far) s += F('M-14,-30 C-10.6,-33.6 -6,-33 -4.6,-30 C-7.6,-29 -11,-29 -14,-30 Z', 'ink');
    return s;
  }
  ART.inkPots.shatter = (fr) => shatterArt(fr);
  ART.inkPots.splat = () => {
    let s = F(blotE(0, 0, 13, 5.4, 111, 11, 0.36), 'ink700');
    for (let i = 0; i < 9; i++) {
      const a = (i + (jit(112, i) - 0.5) * 0.7) * TAU / 9, L = lerp(16, 26, jit(113, i)), w = lerp(1.6, 3, jit(114, i));
      const p0 = [Math.cos(a) * 9, Math.sin(a) * 3.8], p1 = [Math.cos(a) * L, Math.sin(a) * L * 0.42];
      s += F(brushD([p0, p1], (t) => w * (1 - t) + 0.3), 'ink700');
      if (jit(115, i) < 0.6) s += E(p1[0] + Math.cos(a) * 2.4, p1[1] + Math.sin(a) * 1, w * 0.5, w * 0.32, 'ink700');
    }
    return s;
  };

  // ---- clusterPots: a small break: a wide ink splash, two curved shards, a scrap of the cluster cord. No pot body (a
  // 12-18 px white disc reads as a pickup) ----
  // the splash's six arms by hand so it is at least 38 across: [deg, reach × r, width × r, drop]
  const CLUSTER_ARMS = [[-176, 2.95, 0.5, 1], [-131, 2, 0.44, 0], [-88, 2.55, 0.5, 1], [-10, 3, 0.52, 0], [38, 2.15, 0.46, 1], [104, 2.5, 0.48, 0]];
  function clusterArt(fr) {
    let s = '';
    if (fr < 2) {
      // 0: the hit, the strongest frame (splash, shards just off it, the cord scrap); 1: the same splash with its drops
      // flown, the shards further out (0 → 1 keeps the splash, it does not shrink)
      s += inkBurstAt(0, -5.4, 6.5, 127, CLUSTER_ARMS.map((q) => (fr ? q : [q[0], q[1], q[2], 0])), { flat: 0.9 });
      if (fr === 0) {
        // [arc from, to (rad) on the little pot (0, -7, 6.4 × 6.2), move x, y, turn°]
        [[-2.6, -1.6, -5, -3, -14], [-0.9, 0.2, 5, -2, 18]].forEach(([a0, a1, dx, dy, rot]) => {
          const sh = potShard(0, -7, 6.4, 6.2, a0, a1, 0.5, dx, dy, rot, true);
          s += F(sh.d, 'p50', { st: 'ink', sw: 1.1 }) + S(sh.inner, 'p300', 1);
        });
        s += SW('M4.6,-13.2 C6.8,-15.8 9.4,-16.6 11.8,-15.8', [['ink', 2], ['ally', 1.1]]);
        return s;
      }
    }
    const far = fr === 2;
    if (far) s += inkBurst(0, -1.4, 4, 126, { arms: 6, reach: [1.7, 2.6], wk: 0.7, col: 'ink700' });
    const L1 = far ? [-17, 3] : [-11, -12], R1 = far ? [16, 4.6] : [11, -14.6];
    s += F(chipD(L1[0], L1[1], far ? 2.6 : 3.4, 125, far ? 1.6 : 0.6), far ? 'p300' : 'p50', { st: far ? 'ink300' : 'ink', sw: 1.1 });
    s += F(chipD(R1[0], R1[1], far ? 2.2 : 3, 126, far ? -0.4 : 1.4), far ? 'p300' : 'p50', { st: far ? 'ink300' : 'ink', sw: 1.1 });
    s += SW(far ? 'M8,2.4 C10,3.4 12,3.6 13.6,3' : 'M5,-15 C7.4,-18.4 10,-19.4 12.6,-18.6', far ? [['ink300', 1.8], ['allyD', 1]] : [['ink', 2], ['ally', 1.1]]);
    return s;
  }
  ART.clusterPots.burst = (fr) => clusterArt(fr);

  // ---- tarJar: a black jar lying where it fell (the K9 icon's jar, K9 review 7 §7): its foot ring (굽: a band, ink500 on
  // its lit side, a p300 line on its rim) up and left, its open mouth (a paper lip p50 2, ink inside) down and right, an
  // ink500 light face and a paper glint on the upper shoulder, the cyan seal cord round the neck with its end hanging to the
  // ground; glossy tar pours over the lower lip. Frame 1: a curved piece of the upper shoulder cracks off and lifts, the
  // hole shows the dark inside (ink700, a bent ink500 edge, never a zigzag), tar strings stretch to it; frame 2: the piece
  // lies on the ground, the strings hang broken, more tar has run out, the cord lies along the ground. No white cracks, no
  // round dome, no knob (a black ball with white zigzags is the K7 bomber); body length : width 1.3. Drawn upright (foot at
  // y 0, mouth at y -28) and laid down by TJ_M: turned 120°, so the axis runs 30° below the horizontal to the mouth.
  const TJ_SIDE = [[-6.6, -2.6], [-8.4, -3.4], [-10.4, -6.6], [-11.2, -10.8], [-10.8, -15.4], [-9.6, -19.4], [-7.8, -22.4], [-6.8, -24.4], [-7.4, -26.4], [-8.4, -28]];
  const TJ_BODY = smooth(TJ_SIDE.concat(TJ_SIDE.map(([x, y]) => [-x, y]).reverse()), true);
  const TJ_FOOT = 'M-5.6,0 L-6.4,-0.9 L-6.6,-2.6 L6.6,-2.6 L6.4,-0.9 L5.6,0 Z';
  const TJ_MOUTH = ellD(0, -28, 8.4, 3.8);
  const TJ_LIGHT = 'M-8.8,-4.4 C-10.5,-7.4 -11,-11.6 -10.4,-15.6 C-10,-18 -9.2,-19.8 -8.4,-20.8 C-9,-17.2 -9.4,-13 -9.2,-9.6 C-9,-7.6 -8.4,-6 -8.8,-4.4 Z';
  const TJ_M = chainM(transM(-15, -14), rotM(120));
  // the piece that cracks off the upper shoulder: its outline (on the body's edge, then the bent break back) and the break
  const TJ_HOLE = [[-10.9, -12.8], [-10.8, -15.4], [-9.6, -19.4], [-8.4, -21.4], [-7.2, -20.6], [-6.2, -18.4], [-6.4, -15.6], [-8.6, -13.6]];
  const TJ_BREAK = [[-8.4, -21.4], [-7.2, -20.6], [-6.2, -18.4], [-6.4, -15.6], [-8.6, -13.6], [-10.9, -12.8]];
  /** The jar in upright coordinates: foot ring, body, light face, shoulder glint, cracks by the mouth, the hole (frames 1-2),
   *  the cord band round the neck, the open mouth with its paper lip. */
  function tjJar(hole) {
    let s = F(TJ_FOOT, 'ink', { st: 'ink', sw: 1.2 }) + F('M-6.2,-0.6 L-6.4,-2.2 L-1.6,-2.2 L-1.8,-0.6 Z', 'ink500') + S(ellArc(5.8, 1.3, 0, -0.2, 0.2, Math.PI - 0.4), 'p300', 1.3);
    s += F(TJ_BODY, 'ink', { st: 'ink', sw: 1.4 }) + F(TJ_LIGHT, 'ink500') + S('M-9.6,-18.6 C-9,-20.4 -8.2,-21.6 -7.2,-22.4', 'p300', 1.1);
    s += S('M-5.4,-22.4 L-4.4,-20.2 L-5.4,-18.4', 'ink500', 0.9) + S('M4.2,-22.6 L5.1,-20.8 L4.6,-19.6', 'ink500', 0.8);
    if (hole) s += F(smooth(TJ_HOLE, true), 'ink700') + S(smooth(TJ_BREAK), 'ink500', 0.9);
    s += SW('M-7.9,-22 C-3.8,-20.2 3.8,-20.2 7.9,-22', [['ink', 2.8], ['ally', 1.6]]);
    return s + S(TJ_MOUTH, 'ink', 3.6) + F(TJ_MOUTH, 'ink') + F(ellD(0.4, -29, 6, 2.2), 'ink700') + S(TJ_MOUTH, 'p50', 2);
  }
  /** The cracked-off piece: the hole's shape, black, its broken face an ink500 line (upright coordinates). */
  const tjPiece = () => F(smooth(TJ_HOLE, true), 'ink', { st: 'ink', sw: 0.9 }) + S(smooth(TJ_BREAK), 'ink500', 0.9) + S('M-10.2,-15 C-9.8,-17 -9.2,-18.6 -8.6,-19.8', 'ink500', 0.8);
  /** The tar tongue poured over the lower lip, from the lip's lowest point (screen coordinates, k = size). */
  const tjTongue = (p, k) => TX(F('M0.4,-5 C3.6,-4.4 6.4,-2.8 9.2,-1 C12.4,-0.2 16.2,0.4 18.2,2.8 C18.8,5.2 14.8,6.6 10.2,6.2 C5.4,6 1.2,4.8 -0.6,2.4 C-1.6,0.8 -1.4,-1 -0.8,-2.4 C-0.4,-3.6 -0.2,-4.4 0.4,-5 Z', 'ink') +
    S('M4.4,-1.4 C6.8,-0.8 9.4,0.6 11.2,1.6', 'p300', 1.2, { a: 0.85 }) + S('M13.4,2 C14.8,2.2 16,2.6 16.8,3.4', 'p300', 1, { a: 0.7 }) + Cir(2.6, -2, 0.8, 'p50'), chainM(transM(p[0], p[1]), scaleM(k)));
  /** The cord's end from the knot at the neck's lower side: hanging to the ground (frames 0-1) or lying along it (2). */
  function tjCordEnd(p, lying) {
    const d = lying ? `M${P2(p)} C${P2([p[0] - 1.6, p[1] + 3])} ${P2([p[0] - 4.6, p[1] + 4.6])} ${P2([p[0] - 8.6, p[1] + 5])}` : `M${P2(p)} C${P2([p[0] - 0.8, p[1] + 2.4])} ${P2([p[0] - 1.8, p[1] + 4])} ${P2([p[0] - 3.8, p[1] + 5.2])}`;
    return SW(d, [['ink', 2.2], ['ally', 1.2]]) + Cir(p[0], p[1], 1.4, 'ally', { st: 'ink', sw: 0.8 });
  }
  /** A bent sliver of the jar wall (black, its broken face an ink500 hairline), centred on (x, y). */
  const tjShard = (x, y, deg) => { const sh = potShard(0, 0, 7, 5, -2.5, -1.3, 0.62, 0, 0, 0, true); return TX(F(sh.d, 'ink', { st: 'ink', sw: 0.8 }) + S(sh.inner, 'ink500', 0.8), chainM(transM(x, y), rotM(deg), transM(2.3, 4.6))); };
  function tarArt(fr) {
    let s = '';
    if (fr === 0) s += F(blotE(-20.4, -7.2, 2.8, 1.9, 135, 7, 0.4), 'p300', { st: 'ink300', sw: 0.7 }) + F(blotE(-13.8, 3.6, 2.4, 1.7, 136, 7, 0.4), 'p300', { st: 'ink300', sw: 0.7 });
    if (fr === 2) {
      // the tar that has run out lies in front of the mouth (the wide puddle is the pool decal)
      s += F(blotE(10.4, 9, 13, 4.4, 133, 11, 0.3), 'ink') + S('M3,7.4 C7,6.2 12,6 16.4,6.8', 'p300', 1.1, { a: 0.8 });
    }
    s += TX(tjJar(fr > 0), TJ_M);
    // the piece off the shoulder: cracked open in place, pushed out a little along the shoulder (1; it never stands up off
    // the top, which would read as a wick), lying on the ground behind the mouth (2); tar strings across the crack
    const hc = apM(TJ_M, [-8.4, -17.2]);
    if (fr === 1) {
      const pm = chainM(transM(2.2, -1.2), rotM(-9, hc[0], hc[1]), TJ_M);
      s += TX(tjPiece(), pm);
      [[-6.4, -15.6], [-6.2, -18.4], [-7.2, -20.6]].forEach((p, i) => {
        const a = apM(TJ_M, p), b = apM(pm, p);
        s += S(`M${P2(a)} Q${P2([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 1.2])} ${P2(b)}`, 'ink', [1, 0.8, 0.7][i]);
      });
    }
    if (fr === 2) {
      s += TX(tjPiece(), chainM(transM(10.4, -2.4), rotM(150, hc[0], hc[1]), TJ_M));
      [[-6.4, -15.6], [-7.2, -20.6]].forEach((p, i) => { const a = apM(TJ_M, p); s += S(`M${P2(a)} L${P2([a[0] + 0.5, a[1] + 3.4 - i])}`, 'ink', 0.8); });
    }
    s += tjTongue(apM(TJ_M, [8.4, -28]), [1, 1.1, 1.18][fr]) + tjCordEnd(apM(TJ_M, [7.9, -22]), fr === 2);
    s += tjShard(-27.4, 3.4, 18) + tjShard(-7.6, 13.2, -32) + Cir(-23.6, -16.4, 1.2, 'ink') + Cir(21, -8.4, 1, 'ink') + Cir(28.4, 3.4, 1.3, 'ink');
    return s;
  }
  ART.tarJar.crack = (fr) => tarArt(fr);
  ART.tarJar.pool = () => {
    let s = F(blotE(0, 0, 40, 13.6, 141, 13, 0.3), 'ink') + F(blotE(-26, 4, 9, 4, 142, 8, 0.4), 'ink') + F(blotE(28, -2, 8, 3.4, 143, 8, 0.4), 'ink');
    s += S('M-30,-3.4 C-26,-6.6 -20,-8 -14,-8.4', 'p300', 1.2, { a: 0.75 }) + S('M-6,-6.8 C1,-8.6 8,-8.4 12,-7', 'p300', 1.2, { a: 0.7 }) + S('M14,4 C18,3.4 22,2.2 24,0.6', 'p300', 1, { a: 0.6 }) + Cir(-11, -6.8, 0.8, 'p50');
    // drips and strings at the front edge
    [[-20, 11], [-6, 13.4], [9, 12.6], [22, 9.6]].forEach(([x, y], i) => { s += F(brushD([[x, y - 3], [x + 0.6, y + 1.2]], (t) => 2.6 * (1 - t) + 0.6), 'ink') + Cir(x + 0.7, y + 1.8, 1.2 + 0.3 * (i % 2), 'ink'); });
    s += S('M-38,2 C-42,4 -44,6 -45,8.6', 'ink', 0.9) + S('M37,-1 C41,0 43.6,2 44.6,4.4', 'ink', 0.8);
    return s;
  };

  // ---- meteorBrush: the K9 icon's brush (K9 review 7 §7) stuck head first, come down from the upper left at 42°: its ink
  // bristles crushed into three clumps fanned out on the ground (ragged, split ends), a paper ferrule (three bands), a paper
  // bamboo handle (two nodes), a round ink cap with a paper hanging loop. Frame 0: a torn paper flash thrown toward the
  // lower right (the way it flew; rays 10-27, uneven), the comet tail from the cap (the handle's width there, about 3 × at
  // the far end, four dry strands with blunt split ends and broken drops, the cyan core from the brush side, stopping short
  // of the end), a short ink burst under the bristles. Frame 1: the big ink burst on the ground, no tail. Frame 2: the
  // burst sinks, the brush is gone. (A clean point, a cyan stub past the end and a symmetric star read as a rocket, a dart
  // or a firework; the old p300 end cap read as a pen cap.)
  const MB_M = chainM(transM(5, 2), rotM(42));   // brush frame: +x = the way it flew, origin = where the head hit
  const MB_FERRULE = 'M-14,-3.6 L-8.9,-3.6 L-7.8,-2.8 L-7.8,2.8 L-8.9,3.6 L-14,3.6 Z';
  const MB_HANDLE = 'M-33.2,-2.2 L-14,-2.5 L-14,2.5 L-33.2,2.2 Z';
  const MB_CAP = 'M-32.8,-2.9 L-35.2,-2.9 C-37,-2.9 -38,-1.5 -38,0 C-38,1.5 -37,2.9 -35.2,2.9 L-32.8,2.9 Z';
  // crushed bristle clumps (screen coordinates): [root on the ferrule, bend, end, width at the root, ragged tips]
  const MB_CLUMPS = [
    [[-0.8, -3.2], [4.6, 3.4], [11.6, 8.6], 6.2, [[13, 7.8], [11.2, 10.2], [13.4, 9.6]]],
    [[0.8, -4.8], [9, -1.6], [20, 1.4], 5.2, [[21.4, 0.4], [20.6, 2.6]]],
    [[-2.4, -1.6], [-5, 2.4], [-8.4, 5.4], 3.6, [[-9.6, 4.8], [-8.2, 6.8]]]
  ];
  // the frame-0 comet tail in the brush frame: from the cap end at the handle's width to the far end about 3 × as wide,
  // its middle rising a little (the way the brush came down); the far end breaks into four dry strands of different
  // length with blunt, split ends (never spikes) and three broken drops; the cyan core runs from the cap along the middle
  // and stops short of the end
  const mbTailMid = (x) => -0.12 * Math.max(0, -36 - x), mbTailW = (x) => lerp(4.4, 12.4, clamp((-36 - x) / 17, 0, 1));
  // the body ends raggedly at x -53; the strands (root, tip, width) are its dry end, 4-5 past it; then the broken drops
  const MB_TAIL_END = [[-53.4, -7.6], [-51.4, -5.2], [-54, -3], [-52, -0.6], [-53.6, 1.8], [-51.8, 3.4]];
  const MB_STRANDS = [[[-49, -6], [-56.2, -6.2], 3.2], [[-50, -3.4], [-58.4, -2.8], 3], [[-49.6, 0.2], [-57, 2], 2.8], [[-48.4, 2.6], [-53.6, 5.2], 2.4]];
  const MB_DROPS = [[-59.8, -4.4, 0.95], [-59.4, 0.4, 0.8], [-61.2, -1.8, 0.7]];
  /** The paper hanging loop (ink edge) hanging from the cap's end beside the cap, in screen coordinates. */
  const MB_LOOP = (() => { const e = apM(MB_M, [-38, 0]); return [e[0] - 2.8, e[1] + 2.2, 2.3]; })();
  /** Handle, ferrule, cap (brush frame → screen) and the loop; their outlines go to sil. */
  function mbBrush(sil) {
    const hand = F(MB_HANDLE, 'p50', { st: 'ink', sw: 1.3 }) + F('M-33,0.7 L-14.2,1 L-14.2,2.4 L-33,2 Z', 'p300') +
      S('M-21.4,-2.6 C-21.8,-0.8 -21.8,0.8 -21.4,2.6', 'ink', 1) + S('M-28.4,-2.4 C-28.8,-0.8 -28.8,0.8 -28.4,2.4', 'ink', 1);
    const ferr = F(MB_FERRULE, 'p50', { st: 'ink', sw: 1.5 }) + F('M-13.8,1.1 L-8.9,1.1 L-8,0.8 L-8,2.7 L-8.9,3.4 L-13.8,3.4 Z', 'p300') +
      S('M-12.4,-3.6 L-12.4,3.6', 'ink', 0.9) + S('M-10.8,-3.6 L-10.8,3.6', 'ink', 0.9) + S('M-9.3,-3.5 L-9.3,3.5', 'ink', 0.8);
    const cap = F(MB_CAP, 'ink') + S('M-34,-1.9 C-35.6,-2 -36.8,-1.4 -37.2,-0.4', 'ink500', 0.8);
    if (sil) sil.push(txPath(MB_FERRULE, MB_M), txPath(MB_HANDLE, MB_M), txPath(MB_CAP, MB_M));
    return TX(hand + cap + ferr, MB_M) + SW(circD(MB_LOOP[0], MB_LOOP[1], MB_LOOP[2]), [['ink', 2.6], ['p50', 1.1]]);
  }
  /** The frame-0 tail (brush frame → screen), drawn behind the brush. */
  function mbTail() {
    const xs = samp((t) => lerp(-35.4, -51, t), 10);
    let tl = F(line(xs.map((x) => [x, mbTailMid(x) - mbTailW(x) / 2]).concat(MB_TAIL_END, xs.slice().reverse().map((x) => [x, mbTailMid(x) + mbTailW(x) / 2])), true), 'ink');
    MB_STRANDS.forEach(([a, b, w]) => {
      // a dry strand narrowing to a blunt end 2.2 wide that a notch splits into two short prongs (K9 R7: never a spike)
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), u = [dx / l, dy / l], n = [-u[1], u[0]];
      const P = (p, s, t) => [p[0] + u[0] * s + n[0] * t, p[1] + u[1] * s + n[1] * t], m = [lerp(a[0], b[0], 0.55) - n[0] * 0.3, lerp(a[1], b[1], 0.55) - n[1] * 0.3];
      tl += F(line([P(a, 0, w / 2), P(m, 0, (w + 2.2) / 4 + 0.2), P(b, 0, 1.1), P(b, 1.5, 1.2), P(b, -0.4, 0.05), P(b, 1.2, -1.15), P(b, 0, -1.1), P(m, 0, -(w + 2.2) / 4 - 0.2), P(a, 0, -w / 2)], true), 'ink');
    });
    MB_DROPS.forEach(([x, y, r]) => { tl += Cir(x, y, r, 'ink'); });
    // dry gaps in the tail (paper streaks, the ground showing through) and the cyan core from the cap along the middle,
    // stopping short of the end
    tl += S('M-39.4,-2.2 C-43,-3.2 -47,-4.4 -51.6,-6', 'p300', 0.8, { a: 0.9 }) + S('M-42,1.8 C-45,2.2 -48,2.4 -51.2,3.2', 'p300', 0.7, { a: 0.8 }) + S('M-45.4,-0.4 C-47.4,-0.8 -49.4,-1.2 -52,-1.6', 'p300', 0.6, { a: 0.7 });
    tl += SW(smooth(samp((t) => { const x = lerp(-36.6, -49.6, t); return [x, mbTailMid(x) - 0.6]; }, 6)), [['ally', 1.6], ['allyG', 0.5]]);
    return TX(tl, MB_M);
  }
  /** The crushed bristles: three clumps from the ferrule's end along the ground, ragged ends, ink500 bristle sheen. */
  function mbBristles(sil) {
    let s = '';
    MB_CLUMPS.forEach(([r0, m, e, w, tips]) => {
      const pts = samp((t) => { const u = 1 - t; return [u * u * r0[0] + 2 * u * t * m[0] + t * t * e[0], u * u * r0[1] + 2 * u * t * m[1] + t * t * e[1]]; }, 10);
      const d = brushD(pts, (t) => w * (1 - 0.6 * t));
      if (sil) sil.push(d);
      s += F(d, 'ink');
      tips.forEach((p) => { s += taper([pts[8], p], w * 0.32, 0.25); });
      [-0.22, 0.2].forEach((o) => {
        const sh = pts.slice(1, 9).map((p, i) => { const a = pts[i], b = pts[i + 2], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ww = w * (1 - 0.6 * (i + 1) / 10); return [p[0] - dy / l * ww * o, p[1] + dx / l * ww * o]; });
        s += S(smooth(sh), 'ink500', 0.8);
      });
    });
    return s;
  }
  function meteorArt(fr, aw) {
    let s = '', body = '';
    const sil = [];
    if (fr === 0) {
      s += F(tornD(6, 1, [[-168, 10], [-128, 12], [-86, 11], [-46, 15], [-14, 22], [14, 27], [38, 22], [64, 16], [96, 12], [134, 11]], 0.4, 151), 'p50', { st: 'ink', sw: 1.6 });
      s += mbTail();
      s += inkBurstAt(5.4, 3, 6, 152, [[-152, 2.3, 0.5, 0], [-104, 2, 0.45, 1], [-48, 2.4, 0.5, 0], [26, 1.7, 0.42, 0], [98, 1.8, 0.5, 1], [144, 2.4, 0.46, 1]], { flat: 0.7 });
    } else if (fr === 1) {
      // the big ink burst lies on the ground (flattened), arms of very different length and weight
      s += inkBurst(0, -8.6, 12.6, 153, { arms: aw ? 10 : 8, reach: [1.25, 2.5], flat: 0.6, drops: 0.6, wk: 1.15 });
      s += F(blotE(-6, -14, 5.4, 4.2, 160, 8, 0.4), 'ink') + F(chipD(-22, -24, 2.4, 154, 0.5), 'p50', { st: 'ink', sw: 0.9 }) + F(chipD(25, -18, 2, 155, 1.2), 'p50', { st: 'ink', sw: 0.9 });
    } else {
      s += inkBurst(0, -3, 11, 156, { arms: aw ? 9 : 7, reach: [1.3, 2.6], flat: 0.58, col: 'ink700', wk: 0.75, drops: 0.7 });
      s += F(chipD(-26, 8, 1.8, 157, 0.4), 'p300', { st: 'ink300', sw: 0.7 }) + F(chipD(29, 5, 1.6, 158, 1.1), 'p300', { st: 'ink300', sw: 0.7 });
    }
    if (fr < 2) body = mbBrush(sil) + mbBristles(sil);
    s += aw && body ? rimmed(sil.join(' '), body) : body;
    if (aw && fr === 0) s += sparkle(-9.4, -18.6, 2.6, 6, 159);
    return s;
  }
  ART.meteorBrush.impact = (fr) => meteorArt(fr, false);
  ART.meteorBrush['impact-awakened'] = (fr) => meteorArt(fr, true);
  ART.meteorBrush.crater = () => {
    let s = F(blotE(0, 0, 46, 18.6, 161, 14, 0.18) + ' ' + blotE(1, -0.6, 26, 9.8, 162, 11, 0.22), 'ink700', { rule: 'evenodd' });
    s += F(blotE(1, -0.6, 26, 9.8, 162, 11, 0.22), 'ink300', { a: 0.85 });
    // radial dry-brush streaks: few, uneven in angle, length and weight (an even ring of spikes reads as a sun / a gear)
    for (let i = 0; i < 9; i++) {
      if (jit(163, i) < 0.3) continue;
      const a = (i + (jit(164, i) - 0.5) * 0.9) * TAU / 9, L = lerp(3.6, 12, Math.pow(jit(165, i), 1.6)), w = lerp(1.4, 3.2, jit(166, i));
      const p0 = [Math.cos(a) * 43, Math.sin(a) * 17.2], p1 = [Math.cos(a) * (44 + L), Math.sin(a) * (17.6 + L * 0.42)];
      s += F(brushD([p0, [lerp(p0[0], p1[0], 0.5) + Math.sin(a) * 0.8, lerp(p0[1], p1[1], 0.5)], p1], (t) => lerp(w, 0.3, t)), 'ink700');
    }
    s += Cir(-30, -3, 1.2, 'ink700') + Cir(33, 4, 1, 'ink700') + Cir(8, 15.6, 0.9, 'ink700');
    return s;
  };

  // ==== lob flight (delivery 2, work order §3): the thrown objects round the lob point (the anchor) ====
  // The pots and the jar keep the light upper left on screen whatever their turn: their shade band is laid out after the
  // turn. The comet is baked head up (local -y = the way it flies) and the renderer turns it along the path.
  const LIGHT = [-0.6, -0.8];   // unit vector toward the light, screen
  /** Points along the closed Catmull-Rom curve that smooth(pts, true) draws, k per segment. */
  function crClosed(pts, k) {
    const n = pts.length, g = (i) => pts[((i % n) + n) % n], out = [];
    for (let i = 0; i < n; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      for (let j = 0; j < k; j++) {
        const t = j / k, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (p2[c] - p0[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t3)));
      }
    }
    return out;
  }
  /** Outward unit normals of a closed polyline (either winding). */
  function outNormals(P) {
    const n = P.length;
    let A = 0;
    for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1]; }
    const sg = A > 0 ? 1 : -1;
    return P.map((p, i) => { const a = P[(i - 1 + n) % n], b = P[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [sg * dy / l, -sg * dx / l]; });
  }
  /** The shade inside a closed outline P (screen points) on the side turned from the light: a band up to wMax wide,
   *  none on the lit half. One path (the outline, then the band's inner edge back). */
  function shadeBand(P, wMax) {
    const N = outNormals(P), n = P.length;
    const w = N.map((q) => wMax * Math.pow(clamp((-(q[0] * LIGHT[0] + q[1] * LIGHT[1]) - 0.08) / 0.92, 0, 1), 0.75));
    const i0 = Math.max(0, w.findIndex((v) => v === 0)), out = [], inn = [];
    for (let j = 0; j <= n; j++) { const i = (i0 + j) % n; out.push(P[i]); inn.push([P[i][0] - N[i][0] * w[i], P[i][1] - N[i][1] * w[i]]); }
    return line(out.concat(inn.reverse()), true);
  }
  /** A line `inset` inside the part of a closed outline P that faces the light by more than thr (the longest such run). */
  function litLine(P, inset, thr) {
    const N = outNormals(P), n = P.length, lit = N.map((q) => q[0] * LIGHT[0] + q[1] * LIGHT[1] > thr);
    let best = null;
    for (let s0 = 0; s0 < n; s0++) {
      if (!lit[s0] || lit[(s0 - 1 + n) % n]) continue;
      let e = s0;
      while (lit[(e + 1) % n] && e - s0 < n - 1) e++;
      if (!best || e - s0 > best[1] - best[0]) best = [s0, e];
    }
    if (!best || best[1] - best[0] < 2) return '';
    const pts = [];
    for (let i = best[0]; i <= best[1]; i++) { const k = i % n; pts.push([P[k][0] - N[k][0] * inset, P[k][1] - N[k][1] * inset]); }
    return line(pts);
  }

  // ---- inkPots pot: the white porcelain pot of the K9 icon: paper body, a flat ink lid with no knob (K9 #38), one ink
  // drip down from under the lid, the cyan cord round the neck knotted on the right with its end down the shoulder, a
  // foot ring. The four frames turn it 0 / 25 / 50 / 75° about its middle (pot coordinates, centre (0, 0)); it rolls once
  // over its flight (prog by the flight's progress, review 4 F1) ----
  const POT_SIDE = [[2.9, -6.3], [2.7, -5.2], [4.4, -4.2], [6.1, -2.2], [6.7, 0.6], [6.1, 3.8], [4.7, 6.1], [2.8, 7.3]];
  const POT_BODY = POT_SIDE.concat(POT_SIDE.map(([x, y]) => [-x, y]).reverse());
  const POT_LID = [[-4.1, -5.9], [-4.25, -7.3], [-3.8, -8.6], [-2.6, -9.2], [2.6, -9.2], [3.8, -8.6], [4.25, -7.3], [4.1, -5.9], [2.2, -5.45], [-2.2, -5.45]];
  const POT_FOOT = 'M-3.3,6.6 L3.3,6.6 L3.6,8.5 L-3.6,8.5 Z';
  function potArt(fr, aw) {
    const m = rotM([0, 25, 50, 75][fr]);
    const body = crClosed(POT_BODY, 6).map((p) => apM(m, p)), lid = crClosed(POT_LID, 4).map((p) => apM(m, p));
    const bodyD = line(body, true), lidD = line(lid, true), footD = txPath(POT_FOOT, m);
    // the foot ring under the belly (in its shade), then the body with its shade band, the drip, the outline, the lid
    let b = F(footD, 'p300', { st: 'ink', sw: 1.2 }) + F(bodyD, 'p50') + F(shadeBand(body, 3.2), 'p300');
    b += TX(F(brushD(samp((t) => [lerp(-1.8, -3.4, t) - 0.5 * Math.sin(Math.PI * t), lerp(-5.2, 1.2, t)], 8), (t) => lerp(1.7, 0.9, t)), 'ink') + F(ellD(-3.4, 2.1, 0.85, 1.2), 'ink'), m);
    b += S(bodyD, 'ink', 1.6) + F(lidD, 'ink');
    const ll = litLine(lid, 0.9, 0.35);
    if (ll) b += S(ll, 'ink500', 0.9);
    b += TX(SW('M-3,-5 C-1.4,-4.3 1.4,-4.3 3,-5', [['ink', 2.4], ['ally', 1.3]]) + SW('M3.2,-4.6 C4.5,-3.5 5,-1.9 4.7,-0.3', [['ink', 2.2], ['ally', 1.2]]) +
      Cir(3.1, -4.8, 1.1, 'ally', { st: 'ink', sw: 0.8 }), m);
    let s = aw ? rimmed(bodyD + ' ' + lidD + ' ' + footD, b) : b;
    if (aw && fr === 0) s += sparkle(5.6, -10, 2.6, 6, 181);
    return s;
  }
  ART.inkPots.pot = (fr) => potArt(fr, false);
  ART.inkPots['pot-awakened'] = (fr) => potArt(fr, true);

  // ---- clusterPots pot-s / pot-m / mini: a small round pot with no lid (an ink band round the open mouth), the cyan
  // cluster cord round the neck, its end a ribbon blown out and down (pot-s to the left, pot-m and mini to the right: the
  // s, m, s of a cast fan their cords like a tied bunch coming apart); the wave runs along the ribbon over the frames ----
  const CP_SIDE = [[0.3, -0.42], [0.46, -0.29], [0.54, -0.02], [0.48, 0.28], [0.34, 0.45], [0.28, 0.53]];
  const CP_BODY = CP_SIDE.concat(CP_SIDE.map(([x, y]) => [-x, y]).reverse());
  /** k = size (the body is about 1.08k wide), lean = the side the cord's end flutters to (-1 left, 1 right). */
  function cpArt(fr, k, lean) {
    const body = crClosed(CP_BODY.map(([x, y]) => [x * k, y * k]), 6), bodyD = line(body, true);
    let s = F(bodyD, 'p50') + F(shadeBand(body, 0.22 * k), 'p300');
    s += S(`M${f(-0.27 * k)},${f(0.43 * k)} C${f(-0.1 * k)},${f(0.47 * k)} ${f(0.1 * k)},${f(0.47 * k)} ${f(0.27 * k)},${f(0.43 * k)}`, 'p300', 0.9);
    s += S(bodyD, 'ink', k > 10 ? 1.7 : k > 8 ? 1.5 : 1.3);
    // the mouth band: an ink collar round the open mouth (dark inside, the far inner wall catching the light: an open
    // pot, not a lid)
    const yt = -0.5 * k, yb = -0.38 * k, wt = 0.35 * k, wb = 0.32 * k;
    s += F(`M${f(-wt)},${f(yt)} A${f(wt)},${f(0.1 * k)} 0 0 1 ${f(wt)},${f(yt)} L${f(wb)},${f(yb)} A${f(wb)},${f(0.09 * k)} 0 0 1 ${f(-wb)},${f(yb)} Z`, 'ink');
    s += F(ellD(0, yt + 0.01 * k, wt * 0.74, 0.065 * k), 'ink700') + S(ellArc(wt * 0.74, 0.065 * k, 0, yt + 0.01 * k, Math.PI + 0.3, Math.PI - 0.6), 'p300', k > 8 ? 0.8 : 0.6);
    // the cord: a cyan band round the neck, the knot on the lean side, the end a ribbon blown out and down, one slow wave
    // (an end standing up off the top would read as a fuse: the K7 bomber's pot)
    const ny = -0.34 * k;
    s += SW(`M${f(-0.31 * k)},${f(ny)} C${f(-0.15 * k)},${f(ny + 0.06 * k)} ${f(0.15 * k)},${f(ny + 0.06 * k)} ${f(0.31 * k)},${f(ny)}`, k > 8 ? [['ink', 1.9], ['ally', 1]] : [['ink', 1.6], ['ally', 0.8]]);
    const K0 = [lean * 0.33 * k, ny + 0.02 * k], L = 0.55 * k, dir = [lean * 0.72, 0.69], nrm = [-dir[1], dir[0]], ph = fr / 4;
    const pts = samp((t) => { const w = 0.1 * k * Math.sin(TAU * (0.75 * t - ph)) * Math.min(1, t * 2); return [K0[0] + dir[0] * L * t + nrm[0] * w, K0[1] + dir[1] * L * t + nrm[1] * w]; }, 12);
    const wr = k > 8 ? [1.8, 0.8] : [1.3, 0.6];
    s += F(brushD(pts, (t) => lerp(wr[0], wr[1], t)), 'ally', { st: 'ink', sw: 0.8 }) + Cir(K0[0], K0[1], k > 8 ? 0.85 : 0.65, 'ally', { st: 'ink', sw: 0.7 });
    return s;
  }
  ART.clusterPots['pot-s'] = (fr) => cpArt(fr, 9.6, -1);
  ART.clusterPots['pot-m'] = (fr) => cpArt(fr, 12, 1);
  ART.clusterPots.mini = (fr) => cpArt(fr, 6.6, 1);

  // ---- tarJar jar: the landing's jar (K9 review 7 §7) at 0.62 ×, turned 35° so its open mouth looks up and right: the
  // foot ring with its p300 line at the lower left, the ink body with the ink500 light face and the shoulder glint upper
  // left, the cyan seal cord round the neck with its end hanging over the shoulder, the open mouth (paper lip, ink inside). Glossy
  // tar comes over the lowest point of the lip and runs off in two strings that hang and sway (loop 8). No cracks, no
  // knob, no wick: a black ball with a wick is the K7 bomber; a lid with a cord knot falling straight is the core mortar ----
  const TJF_M = chainM(rotM(35), scaleM(0.62), transM(0, 14));
  /** The lowest point of the turned lip (where the tar comes over). */
  const TJF_LIP = (() => {
    let best = null;
    for (let i = 0; i < 72; i++) { const a = i * TAU / 72, p = apM(TJF_M, [8.4 * Math.cos(a), -28 + 3.8 * Math.sin(a)]); if (!best || p[1] > best[1]) best = p; }
    return best;
  })();
  function jarFlightArt(fr, aw) {
    // upright jar coordinates (foot at y 0, mouth at y -28) with stroke widths for the flight size, then turned
    let jar = F(TJ_FOOT, 'ink', { st: 'ink', sw: 1 }) + F('M-6.2,-0.6 L-6.4,-2.2 L-1.6,-2.2 L-1.8,-0.6 Z', 'ink500') + S(ellArc(5.8, 1.3, 0, -0.2, 0.2, Math.PI - 0.4), 'p300', 1);
    jar += F(TJ_BODY, 'ink', { st: 'ink', sw: 1 }) + F(TJ_LIGHT, 'ink500') + S('M-9.6,-18.6 C-9,-20.4 -8.2,-21.6 -7.2,-22.4', 'p300', 1);
    jar += SW('M-7.9,-22 C-3.8,-20.2 3.8,-20.2 7.9,-22', [['ink', 2.2], ['ally', 1.2]]);
    jar += S(TJ_MOUTH, 'ink', 2.4) + F(TJ_MOUTH, 'ink') + F(ellD(0.4, -29, 6, 2.2), 'ink700') + S(TJ_MOUTH, 'p50', 1.5);
    const sil = [TJ_FOOT, TJ_BODY, TJ_MOUTH].map((d) => txPath(d, TJF_M)).join(' ');
    let b = TX(jar, TJF_M);
    // the seal cord's end from the knot at the neck's upper left, hanging down over the shoulder and swinging (an end
    // standing up off the top would read as a fuse)
    const kn = apM(TJF_M, [-7.9, -22]), fl = [[0, 0], [0.7, 0.2], [0.2, -0.3], [-0.6, 0]][fr];
    b += SW(`M${P2(kn)} C${P2([kn[0] - 1.4, kn[1] + 1.4])} ${P2([kn[0] - 2 + fl[0], kn[1] + 3.2 + fl[1]])} ${P2([kn[0] - 1.6 + fl[0] * 1.6, kn[1] + 5.2 + fl[1]])}`, [['ink', 2], ['ally', 1.1]]) +
      Cir(kn[0], kn[1], 1, 'ally', { st: 'ink', sw: 0.7 });
    // the tar: a wide tongue over the lowest point of the lip, then two gooey strings that sag, neck and gather into a
    // drip at the end (thick, thin, a bulb, a point: never a stick with a ball on it); they sway over the frames
    const L0 = TJF_LIP, sw = [[0, 0], [1, 0.6], [0.3, 1.2], [-0.7, 0.4]][fr];
    const goo = (w0, w1, wb) => (t) => (t < 0.6 ? lerp(w0, w1, t / 0.6) : t < 0.86 ? lerp(w1, wb, (t - 0.6) / 0.26) : lerp(wb, 0.3, (t - 0.86) / 0.14));
    const string = (a, c, e, w0, w1, wb) => F(brushD(samp((t) => { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * e[0], u * u * a[1] + 2 * u * t * c[1] + t * t * e[1]]; }, 14), goo(w0, w1, wb)), 'ink');
    let tar = F(brushD([[L0[0] - 1.6, L0[1] - 0.6], [L0[0] + 0.6, L0[1] + 1.1], [L0[0] + 1.5, L0[1] + 3.2]], (t) => lerp(3.8, 3, t)), 'ink');
    const A0 = [L0[0] + 1.5, L0[1] + 2.6], B0 = [L0[0] + 0.2, L0[1] + 2.2];
    tar += string(A0, [L0[0] + 3.4 + sw[0] * 0.5, L0[1] + 6.4], [L0[0] + 3.2 + sw[0], 8.8 + sw[1]], 2.8, 1.2, 2.4);
    tar += string(B0, [L0[0] + 0.2, L0[1] + 5], [L0[0] - 0.6 - sw[0] * 0.6, 5.6 - sw[1] * 0.5], 2.2, 1, 1.9);
    tar += S(`M${P2([L0[0] - 0.6, L0[1] + 0.3])} C${P2([L0[0] + 0.4, L0[1] + 1])} ${P2([L0[0] + 1, L0[1] + 1.8])} ${P2([L0[0] + 1.3, L0[1] + 2.8])}`, 'p300', 0.8, { a: 0.85 }) + Cir(L0[0] - 0.8, L0[1] + 0.2, 0.55, 'p50');
    let s = (aw ? rimmed(sil, b) : b) + tar;
    if (aw && fr === 0) s += sparkle(-3.8, -10.4, 2.6, 6, 185);
    return s;
  }
  ART.tarJar.jar = (fr) => jarFlightArt(fr, false);
  ART.tarJar['jar-awakened'] = (fr) => jarFlightArt(fr, true);

  // ---- meteorBrush comet: the K9 brush (K9 review 7 §7) flying head first, baked head up: the ink bristle head pressed
  // by the air (full behind the ferrule, a tip bent off the axis and split by a notch: neither a smooth rocket cone nor a
  // round torch head), a paper ferrule (three bands), a
  // paper bamboo handle (two nodes), the round ink cap and the paper hanging loop; the comet tail from the cap, the
  // handle's width there and about 3 × at the far end, broken into four dry strands with blunt split ends and drops,
  // dry paper streaks in it, the cyan core from the brush side along the middle, stopping well short of the end. The
  // tail flickers over the four frames (strands, drops, streaks and the core's length move); the brush does not. ----
  const CM_M = rotM(-90);   // brush frame (+x = the head's way, origin among the bristles) → stamp (head up)
  const CM_FERRULE = 'M-10.4,-3 L-6.2,-3 L-5.4,-2.4 L-5.4,2.4 L-6.2,3 L-10.4,3 Z';
  const CM_HANDLE = 'M-26.6,-1.9 L-10.4,-2.1 L-10.4,2.1 L-26.6,1.9 Z';
  const CM_CAP = 'M-26.4,-2.5 L-28.6,-2.5 C-30,-2.5 -30.8,-1.3 -30.8,0 C-30.8,1.3 -30,2.5 -28.6,2.5 L-26.4,2.5 Z';
  // the bristle head, pressed by the air: full behind the ferrule, tapering to a tip bent a little off the axis and split
  // in two by a notch (a brush tip, not a smooth cone: a rocket nose; not a round bulb: a torch), the bristle lines
  // along it (outline points, smoothed)
  const CM_HEAD = [[-5.6, -2.6], [-3, -3.9], [0, -4], [3, -3.3], [5.4, -2.3], [7.4, -1.5], [8.6, -0.9], [6.7, 0.2], [8.2, 1.3], [6.6, 1.9], [4.6, 2.7],
    [2, 3.6], [-1, 4.1], [-3.2, 3.8], [-5.6, 2.6]];
  const CM_HAIRS = [[[-4.6, -1.8], [0, -2.6], [5.2, -1.4]], [[-4.8, 0.2], [1, 0.4], [6.6, 0.4]], [[-4.6, 2], [0, 2.6], [4.8, 1.9]]];
  function cmBrush(sil) {
    const hand = F(CM_HANDLE, 'p50', { st: 'ink', sw: 1.2 }) + F('M-26.4,0.6 L-10.6,0.8 L-10.6,2 L-26.4,1.7 Z', 'p300') +
      S('M-15.6,-2.1 C-15.9,-0.7 -15.9,0.7 -15.6,2.1', 'ink', 0.9) + S('M-21.4,-2 C-21.7,-0.7 -21.7,0.7 -21.4,2', 'ink', 0.9);
    const ferr = F(CM_FERRULE, 'p50', { st: 'ink', sw: 1.3 }) + F('M-10.2,0.9 L-6.2,0.9 L-5.6,0.6 L-5.6,2.3 L-6.2,2.8 L-10.2,2.8 Z', 'p300') +
      S('M-9.2,-3 L-9.2,3', 'ink', 0.8) + S('M-7.9,-3 L-7.9,3', 'ink', 0.8) + S('M-6.6,-2.9 L-6.6,2.9', 'ink', 0.7);
    const cap = F(CM_CAP, 'ink') + S('M-27.2,-1.6 C-28.6,-1.7 -29.6,-1.2 -30,-0.4', 'ink500', 0.8);
    if (sil) sil.push(CM_FERRULE, CM_HANDLE, CM_CAP);
    return hand + cap + ferr;
  }
  function cmBristles(sil) {
    const d = smooth(CM_HEAD, true);
    if (sil) sil.push(d);
    return F(d, 'ink') + CM_HAIRS.map((h) => S(smooth(h), 'ink500', 0.7)).join('');
  }
  /** The tail in the brush frame for frame fr: body, ragged end, strands, drops, dry streaks, cyan core. */
  function cmTail(fr) {
    const J = (i) => jit(195 + fr, i) - 0.5, x0 = -30.2, x1 = -63;
    const wAt = (x) => lerp(3.8, 11.6, clamp((x0 - x) / 20, 0, 1)), xs = samp((t) => lerp(x0, x1, t), 12);
    const END = [[-62.6, -5.6], [-64.4, -3.6], [-62.2, -1.4], [-64.6, 0.8], [-62.4, 3], [-63.8, 5.2]].map(([x, y], i) => [x + J(i) * 1.6, y + J(i + 10) * 0.6]);
    let tl = F(line(xs.map((x) => [x, -wAt(x) / 2]).concat(END, xs.slice().reverse().map((x) => [x, wAt(x) / 2])), true), 'ink');
    // four dry strands from the far end: narrowing to a blunt end 2.2 wide that a notch splits in two (never a spike)
    [[[-60, -4.6], [-68.4, -5.6], 2.8], [[-61, -1.6], [-70.6, -1.4], 2.6], [[-60.6, 1.6], [-69, 2.8], 2.6], [[-59.4, 4], [-65.6, 6.2], 2.2]].forEach(([a, b0, w], i) => {
      const b = [b0[0] + J(20 + i) * 3, b0[1] + J(30 + i) * 1.2], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), u = [dx / l, dy / l], n = [-u[1], u[0]];
      const P = (p, s1, t1) => [p[0] + u[0] * s1 + n[0] * t1, p[1] + u[1] * s1 + n[1] * t1], m = [lerp(a[0], b[0], 0.55) - n[0] * 0.3, lerp(a[1], b[1], 0.55) - n[1] * 0.3];
      tl += F(line([P(a, 0, w / 2), P(m, 0, (w + 2.2) / 4 + 0.2), P(b, 0, 1.1), P(b, 1.5, 1.2), P(b, -0.4, 0.05), P(b, 1.2, -1.15), P(b, 0, -1.1), P(m, 0, -(w + 2.2) / 4 - 0.2), P(a, 0, -w / 2)], true), 'ink');
    });
    [[-72.4, -3.4, 0.9], [-71.6, 0.6, 0.8], [-73.2, 3.2, 0.7]].forEach(([x, y, r], i) => { tl += Cir(x + J(40 + i) * 1.4, y + J(50 + i) * 0.8, r, 'ink'); });
    // two short dry gaps (paper streaks of different length: the ground shows through) and the cyan core from the cap
    // along the middle, stopping well short of the end
    tl += S(`M${f(-43 + J(60) * 3)},-2.6 C-48,-3.2 -53,-3.8 ${f(-59 + J(61) * 2)},-4.2`, 'p300', 0.8, { a: 0.9 }) +
      S(`M${f(-51 + J(62) * 3)},2.6 C-54,2.9 -57,3.1 ${f(-61 + J(63) * 2)},3.4`, 'p300', 0.7, { a: 0.8 });
    tl += SW(smooth(samp((t) => [lerp(-31.4, -49 - 2.2 * (fr % 2) + J(66), t), 0.5 * t * t], 5)), [['ally', 1.6], ['allyG', 0.5]]);
    return tl;
  }
  function cometArt(fr, aw) {
    const sil = [];
    const obj = TX(cmBrush(sil) + cmBristles(sil) + SW(circD(-31.6, 2.6, 1.9), [['ink', 2.2], ['p50', 0.9]]), CM_M);
    let s = TX(cmTail(fr), CM_M) + (aw ? rimmed(sil.map((d) => txPath(d, CM_M)).join(' '), obj) : obj);
    if (aw && fr === 0) s += sparkle(6.6, -5.6, 2.6, 6, 199);
    return s;
  }
  ART.meteorBrush.comet = (fr) => cometArt(fr, false);
  ART.meteorBrush['comet-awakened'] = (fr) => cometArt(fr, true);

  // ---- sparkThread: paper sparks (5-6 uneven points) where the thread touches ----
  ART.sparkThread.spark = (fr) => (fr === 0 ? F(starD(0, 0, 8.4, 6, 171, -0.2, 0.42), 'p50', { st: 'ink', sw: 1 }) + Cir(-6.6, 5.4, 0.8, 'ink') + Cir(6, -6.4, 0.7, 'ink')
    : F(starD(0.6, -0.6, 5.2, 5, 172, 0.3, 0.45), 'p50', { st: 'ink', sw: 0.9 }) + Cir(-6.6, 4.8, 0.8, 'ink300') + Cir(7, -5.6, 0.7, 'ink300') + Cir(-4, -7, 0.6, 'ink300'));
  ART.sparkThread['spark-awakened'] = (fr) => (fr === 0
    ? F(starD(0, 0, 9, 6, 173, -0.2, 0.42), 'p50', { st: 'ink', sw: 1.1 }) + F(starD(0, 0, 3.6, 5, 174, 0.3, 0.5), 'ally', { st: 'ink', sw: 0.6 }) + Cir(0.1, 0, 0.9, 'allyG')
    : F(starD(0.4, -0.4, 6.4, 6, 175, 0.2, 0.44), 'p50', { st: 'ink', sw: 1 }) + F(starD(0.4, -0.4, 2.6, 5, 176, 0.5, 0.5), 'ally', { st: 'ink', sw: 0.5 }) + Cir(-7, 5, 0.7, 'ink'));

  // ---- stormThread: open wind strokes (2-3 swooshes of different length, a small hook at one end), no filled swirl ----
  /** A swoosh: a gentle arc from (x, y) of length len bowing by bow, thin → thick → thin, its last part hooking up. */
  function swoosh(x, y, len, bow, w, hook, col) {
    const p = samp((t) => { const h = t > 0.78 ? (t - 0.78) / 0.22 : 0; return [x + len * t - hook * 0.6 * h * h, y - bow * Math.sin(Math.PI * t) - hook * h * h]; }, 14);
    return F(brushD(p, (t) => 0.3 + w * Math.sin(Math.PI * Math.min(1, t * 1.08))), col || 'ink');
  }
  // strokes rise at different angles and sit along a diagonal, never stacked in parallel (a stacked pair read as eyebrows)
  const gust = (strokes, col) => strokes.map(([x, y, len, bow, w, hook, deg]) => TX(swoosh(0, 0, len, bow, w, hook, col), chainM(transM(x, y), rotM(deg)))).join('');
  ART.stormThread['gust-a'] = (fr) => (fr === 0 ? gust([[-8.4, 4.4, 15, 2.4, 2, 3.4, -22], [-7.6, -2.6, 6.4, 0.8, 1.1, 0, 12]], 'ink')
    : gust([[-6.6, 3.6, 14.4, 2.8, 1.4, 4, -26], [-3.4, -3.8, 5.4, 0.6, 0.9, 0, 18]], 'ink700'));
  ART.stormThread['gust-b'] = (fr) => (fr === 0 ? gust([[-12, 6.4, 21, 3.4, 2.6, 4.6, -24], [-11.4, -1.6, 9.6, 1.2, 1.5, 0, 14], [2.6, 7.2, 8, 0.8, 1.1, 1.6, -8]], 'ink')
    : gust([[-10, 5.6, 20.4, 3.8, 1.9, 5.2, -28], [-7.4, -3, 8.6, 1, 1.1, 0, 20], [4.4, 7.4, 6.6, 0.6, 0.9, 1.2, -6]], 'ink700'));

  // ---- frostChainlet: an ice plate under the feet (ragged paper edge, an ice facet, two cracks) with frost
  // crystals lying out from its rim (r 12 / 19 / 28); kept low: the boxes are 18 / 22 / 28 tall and the feet rects end at +4/+4/+5
  function rimeArt(rx, ry, cy, xmax, seed) {
    const pl = [];
    for (let i = 0; i < 14; i++) { const a = i * TAU / 14 + (jit(seed, i + 40) - 0.5) * 0.3, k = 0.9 + 0.12 * jit(seed, i); pl.push([Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    let s = F(line(pl, true), 'p50', { st: 'ink', sw: 1.2 });
    s += F(line([[rx * 0.12, cy + ry * 0.1], [rx * 0.62, cy - ry * 0.05], [rx * 0.5, cy + ry * 0.62], [rx * 0.06, cy + ry * 0.7]], true), 'p300', { a: 0.9 });
    // two cracks at different heights: one runs in from the plate's left edge (low), one short and high on the right (a
    // 'V' and a '\' side by side at one height read as a pair of closed eyes)
    s += S(`M${f(-rx * 0.97)},${f(cy + ry * 0.2)} L${f(-rx * 0.62)},${f(cy + ry * 0.08)} L${f(-rx * 0.38)},${f(cy + ry * 0.36)}`, 'ink300', 1) + S(`M${f(rx * 0.18)},${f(cy - ry * 0.62)} L${f(rx * 0.34)},${f(cy - ry * 0.3)}`, 'ink300', 0.9);
    // crystals in the ground plane: one out of each side and one to the front, of different lengths
    let d = '';
    [[188, 0.95], [-14, 0.8], [148, 0.55]].forEach(([deg, k], i) => {
      const a = deg * RAD, P = [Math.cos(a) * rx * 0.86, cy + Math.sin(a) * ry * 0.86], len = Math.max(2.4, Math.min(xmax - Math.abs(P[0]) - 0.6, rx * 0.5) * k);
      d += spikeD(deg, len, 1, seed + i, P[0], P[1], 0.42) + ' ';
    });
    return frostFill(d, 0.9, false) + s;
  }
  ART.frostChainlet.rime12 = () => rimeArt(11.6, 4.4, -1, 14.6, 181);
  ART.frostChainlet.rime19 = () => rimeArt(16.6, 5.4, -2, 20.6, 182);
  ART.frostChainlet.rime28 = () => rimeArt(23.6, 6.6, -3.4, 28.6, 183);

  // ---- inkLance: the tassel at the spear's butt (ink strands + cyan knot band), painted 26..52 behind the hero ----
  function tasselArt(fr, aw) {
    const sil = [];
    let b = '';
    const stub = brushD([[-26.4, 0], [-31.6, 0]], (t) => lerp(3.6, 4.2, t));
    sil.push(stub);
    for (let i = 0; i < 6; i++) {
      const y0 = lerp(-2.2, 2.2, i / 5), L = lerp(13, 18, jit(191, i)), ph = fr ? 1.9 : 0;
      const pts = samp((t) => [-33.4 - L * t, y0 * (1 + 1.4 * t) + 2.4 * t * t + 0.9 * Math.sin(ph + t * 5 + i) * t], 8);
      const d = brushD(pts, (t) => lerp(1.5, 0.3, t));
      sil.push(d);
      b += F(d, i % 2 ? 'ink700' : 'ink');
    }
    b += F(stub, 'ink') + F('M-32.2,-2.7 L-30.4,-2.7 L-30.4,2.7 L-32.2,2.7 Z', 'p300', { st: 'ink', sw: 0.8 });
    // the cyan knot band wrapped round the strands (curved with the bundle), one loose end hanging back from its lower
    // side (a loop read as '?', a bead on top as 'i')
    b += SW('M-34.6,-3.4 C-33.8,-1.4 -33.8,1.4 -34.4,3.4', [['ink', 3.4], ['ally', 1.9], ['allyG', 0.5]]);
    b += SW(fr ? 'M-34.6,3 C-35.8,4.6 -37.4,5 -39,4.6' : 'M-34.6,3 C-35.6,4.8 -36.8,5.6 -38.6,5.8', [['ink', 1.9], ['ally', 1]]);
    let s = aw ? rimmed(sil.join(' '), b) : b;
    if (aw && fr === 0) s += sparkle(-29.4, -4.6, 2.4, 5, 192);
    return s;
  }
  ART.inkLance.tassel = (fr) => tasselArt(fr, false);
  ART.inkLance['tassel-awakened'] = (fr) => tasselArt(fr, true);

  // ---- wideBrush: the big brush at the band's head: pressed ink bristles, paper ferrule, handle leaning forward ----
  function wideBrushArt(fr, aw) {
    const sp = [1, 1.06, 0.8][fr];
    const bristles = smooth([[9, -6], [3, -10.6 * sp], [-4, -13.8 * sp], [-8.8, -14.2 * sp], [-9.2, -8 * sp], [-8.2, -2], [-9.2, 4 * sp], [-8.6, 10.2 * sp], [-5.4, 14.2 * sp], [1, 11 * sp], [9, 6]], true);
    const ferrule = line([[8, -6.6], [15, -5.8], [15, 5.8], [8, 6.6]], true);
    const handle = brushD([[14.6, 0], [25.6, -6.6], [36.2, -13.4]], (t) => lerp(6.2, 5, t));
    const sil = [bristles, ferrule, handle];
    let b = F(bristles, fr === 2 ? 'ink700' : 'ink');
    b += S(`M7,-3 C1,-6 -4,${f(-9 * sp)} -8.6,${f(-11.6 * sp)}`, 'ink500', 0.8) + S(`M7,2.4 C1,4 -4,${f(7.6 * sp)} -8.4,${f(10 * sp)}`, 'ink500', 0.8) + S('M6.6,-0.4 L-8.2,-0.6', 'ink500', 0.7);
    b += F(handle, 'ink') + S('M17,-3.4 L34.6,-14.6', 'ink500', 1) + E(35.6, -13.2, 2.2, 2.6, 'p300', { st: 'ink', sw: 1 });
    b += F(ferrule, 'p50', { st: 'ink', sw: 1.6 }) + F('M8,2.4 L15,2.2 L15,5.8 L8,6.6 Z', 'p300') + S('M11.6,-6.1 C11.2,-2 11.2,2 11.6,6.1', 'ink', 0.8);
    let s = aw ? rimmed(sil.join(' '), b) : b;
    if (fr < 2) s = Cir(-8.6, -17, 1.1, 'ink') + Cir(-8.8, 17.4, 1.2, 'ink') + (fr ? '' : Cir(-7.6, 1.4, 0.9, 'ink') + taper([[-8, -16.6], [-6, -18.2]], 1, 0.2)) + s;
    if (aw && fr === 0) s += sparkle(33.4, -17.8, 2.6, 6, 201);
    return s;
  }
  ART.wideBrush.brush = (fr) => wideBrushArt(fr, false);
  ART.wideBrush['brush-awakened'] = (fr) => wideBrushArt(fr, true);

  // ---- crossStrokes: torn paper scraps flying off a stroke's end ----
  ART.crossStrokes['scrap-a'] = (fr) => (fr === 0
    ? F('M-6,-2.4 L-1.6,-4.2 L1.2,-2.8 L0.4,0.2 L-2,1 L-5,0.6 Z', 'p50', { st: 'ink', sw: 0.9 }) + F('M2.4,1.4 L5.6,0.4 L6.2,3.2 L3.6,4.2 Z', 'p50', { st: 'ink', sw: 0.9 })
    : F('M-3,-3.6 L0.6,-4.4 L1.4,-2 L-1.6,-1.2 Z', 'p300', { st: 'ink', sw: 0.8 }) + F('M3.8,1.6 L6.2,1.2 L6,3.8 Z', 'p300', { st: 'ink', sw: 0.8 }) + Cir(-5, 3, 0.6, 'ink'));
  ART.crossStrokes['scrap-b'] = (fr) => (fr === 0
    ? F('M-5.6,0.4 L-2.6,-2.6 L1,-1.8 L-0.6,1.6 L-3.6,2.6 Z', 'p50', { st: 'ink', sw: 0.9 }) + F('M2,-4 L5.4,-3.2 L4.4,-0.6 L1.8,-1.4 Z', 'p50', { st: 'ink', sw: 0.9 })
    : F('M-4.6,1.6 L-1.6,-0.6 L0.2,1.8 L-2.4,3.4 Z', 'p300', { st: 'ink', sw: 0.8 }) + F('M3.4,-4.2 L6,-3.4 L4.6,-1.6 Z', 'p300', { st: 'ink', sw: 0.8 }));

  // ---- judgmentLine: the carpenter's ink box (ink well + reel), painted 26..56 behind the hero; ink flicks on the line ----
  // Side view of a long wooden box: the reel (wound line, light) stands half above the back of it on its axle, the
  // crank turns; the ink-soaked cotton bulges dark over the front; the line leaves through the bow. One round thing only
  // (a well and a reel side by side read as two eyes).
  function inkboxArt(fr, aw) {
    const body = 'M-27.4,0.4 C-28.4,-3.2 -31,-4.8 -35,-4.8 L-50.6,-4.8 C-53.6,-4.8 -55.4,-2.8 -55.4,0.2 C-55.4,3.6 -53.4,6 -50,6 L-35,6 C-31,6 -28.4,3.6 -27.4,0.4 Z';
    const ax = [-46.4, -5.2], crank = fr ? [ax, [-51.6, -9.8]] : [ax, [-40.6, -9.6]];
    const sil = [body, circD(ax[0], ax[1], 6.2), circD(crank[1][0], crank[1][1], 1.6)];
    let b = Cir(ax[0], ax[1], 6.2, 'p300', { st: 'ink', sw: 1.4 }) + S(arc(4.4, fr ? 3.6 : 2.6, 2.2, ax[0], ax[1]), 'ink300', 0.9) + S(arc(2.8, fr ? 4.4 : 3.4, 1.8, ax[0], ax[1]), 'ink300', 0.8);
    b += F('M-40.4,-4.6 C-38.6,-7.4 -33.4,-7.6 -31.6,-4.4 Z', 'ink');
    b += F(body, 'ink500', { st: 'ink', sw: 1.8 });
    b += S('M-50,-3.6 L-36,-3.8', 'p300', 0.9) + S('M-36,4.8 L-50,4.8', 'ink700', 1.2) + S('M-38.2,-4.2 L-38.6,5.4', 'ink', 0.8);
    b += Cir(ax[0], ax[1], 1.4, 'ink') + S(line(crank), 'ink', 1.6) + Cir(crank[1][0], crank[1][1], 1.6, 'p300', { st: 'ink', sw: 1 });
    b += SW('M-27.6,0.3 L-26.2,0.3', [['ink', 2.6], ['ally', 1.2]]);
    let s = aw ? rimmed(sil.join(' '), b) : b;
    if (fr === 1) s += Cir(-31, 9, 1, 'ink') + Cir(-34.6, 9.8, 0.6, 'ink');
    if (aw && fr === 0) s += sparkle(-36.2, -9, 2.4, 5, 211);
    return s;
  }
  ART.judgmentLine.inkbox = (fr) => inkboxArt(fr, false);
  ART.judgmentLine['inkbox-awakened'] = (fr) => inkboxArt(fr, true);
  ART.judgmentLine['flick-a'] = (fr) => (fr === 0 ? taper([[-1, 1], [1.2, -2.2], [2.2, -3.8]], 0.4, 1.8) + Cir(2.4, -4, 1.2, 'ink') + Cir(-3.6, 2.6, 0.8, 'ink')
    : Cir(4, -4, 1.1, 'ink700') + Cir(-1.4, -1.6, 0.7, 'ink700') + Cir(-5, 3, 0.6, 'ink700'));
  ART.judgmentLine['flick-b'] = (fr) => (fr === 0 ? taper([[1, -1], [-1.4, 2], [-3, 3.6]], 0.4, 1.7) + Cir(-3.2, 3.9, 1.1, 'ink') + Cir(4.2, -2.6, 0.7, 'ink')
    : Cir(-5, 3.8, 1, 'ink700') + Cir(2.6, 1.6, 0.6, 'ink700'));

  // ---- inkOrbit: ink chips knocked off the band's outer edge (+x = outward) ----
  ART.inkOrbit['chip-a'] = (fr) => (fr === 0 ? F(chipD(2.4, -0.6, 1.9, 221, 0.3), 'ink') + F(chipD(6, 1.2, 1.2, 222, 1), 'ink')
    : F(chipD(5, -1, 1.5, 223, 0.8), 'ink700') + F(chipD(8, 1.4, 0.9, 224, 1.6), 'ink700'));
  ART.inkOrbit['chip-b'] = (fr) => (fr === 0 ? F(chipD(3, 0.6, 1.6, 225, 0.5), 'ink') + F(chipD(6.4, -1.4, 1.1, 226, 1.4), 'ink') + Cir(1, -1.8, 0.5, 'ink')
    : F(chipD(5.6, 0.8, 1.3, 227, 0.4), 'ink700') + Cir(8.2, -1.2, 0.6, 'ink700'));

  // ---- wardRing: a knot on the twisted rope (+x = outward, the rope runs along y) ----
  // a lumpy knot across the rope: one S-shaped wrap where the rope crosses itself, a shaded side, a loose end (a straight
  // diagonal through an oval read as ⊘; a barrel with two wraps read as ≡)
  function knotArt(v) {
    const sil = smooth([[-6.4, -1.6], [-5.2, -4.6], [-1.4, -5.2], [3.2, -4.4], [6.2, -2.4], [6.4, 1.4], [4, 4.6], [-0.4, 5.2], [-4.6, 4.2], [-6.6, 1.8]], true);
    let s = F(sil, 'p50', { st: 'ink', sw: 1.4 });
    s += F('M1,-4.6 C3.6,-4.2 5.8,-3 6.2,-0.6 C4.2,-1.6 2.4,-2.4 1,-4.6 Z', 'p300') + S('M-5.8,2.2 C-3,1.6 -1.6,-3.4 1.4,-3.6 C3.6,-3.6 4.6,-1 5.8,-0.4', 'ink', 1.1);
    s += v ? taper([[6, 1.4], [7, 3.4], [7.6, 5]], 2, 0.6, 'p50') + S('M6,1.4 C6.8,2.6 7.3,3.8 7.6,5', 'ink', 0.8)
      : taper([[-6, -1.6], [-7.1, -3.6], [-7.6, -5.1]], 2, 0.6, 'p50') + S('M-6,-1.6 C-6.8,-2.8 -7.3,-4 -7.6,-5.1', 'ink', 0.8);
    return s;
  }
  ART.wardRing['knot-a'] = () => knotArt(0);
  ART.wardRing['knot-b'] = () => knotArt(1);

  // ---- eclipseHalo: two cyan ribbons streaming back from the crescent's tail (+x = clockwise tangent) ----
  function ribbonArt(fr, v) {
    const ph = fr * 2.1 + v * 1.3;
    const r1 = samp((t) => [-1 - 27 * t, -1.4 - 2.2 * t + 1.8 * Math.sin(ph + t * 7) * t], 12);
    const r2 = samp((t) => [-1.4 - 22 * t, 1 + 1.6 * t + 1.6 * Math.sin(ph + 1.7 + t * 6) * t], 12);
    const rib = (pts, w0) => F(brushD(pts, (t) => lerp(w0, 1.2, t)), 'ally', { st: 'ink', sw: 1.1 });
    return rib(r2, 2.6) + rib(r1, 3.2) + S(smooth(cutAlong(r1, 0.1, 0.4)), 'allyG', 0.6) + Cir(r1[3][0], r1[3][1] - 0.6, 0.7, 'p50') + Cir(-0.6, 0, 1.6, 'ink');
  }
  ART.eclipseHalo['ribbon-a'] = (fr) => ribbonArt(fr, 0);
  ART.eclipseHalo['ribbon-b'] = (fr) => ribbonArt(fr, 1);

  // ==== 3b. awakening gimmicks, P1 (delivery 3a, work order §4.2-§4.4): stamps ====
  /** A ground shadow ellipse (ink α) of a ground piece: rx, centre y. */
  const gShadow = (rx, cy, a) => E(0, cy, rx, 0.42 * rx, 'ink', { a: a == null ? 0.25 : a });

  // ---- frostNeedles freeze: an ice plate under the feet with crystals behind (-back, under the body) and a fan of
  // crystals in front rising to about 40 % of the body (-front, in front of it; never up to the eyes); the tallest has
  // the needle's cyan core. Inside the feet rects (marks.rects) ----
  const FREEZE = {
    12: { rx: 12.5, ry: 3.2, cy: 0, by: 0.2, H: 13, w: 2.2, back: 4.8, chips: [1.8, 2.1, 1.7] },
    19: { rx: 18.5, ry: 4.2, cy: -0.4, by: 0.6, H: 17, w: 2.8, back: 6.1, chips: [2.3, 2.7, 2.1] },
    28: { rx: 26, ry: 5.4, cy: -0.6, by: 0.9, H: 23, w: 3.4, back: 8.3, chips: [2.8, 3.2, 2.6] }
  };
  /** Crystal prisms [deg, len, base x, base y] of width w: ink rim under, a paper and a p300 face. */
  function crystalFan(list, w) {
    let out = '', fa = '', fb = '';
    list.forEach(([deg, len, bx, by]) => { const g = prismGeo(deg, len, w, bx, by); out += g.out + ' '; fa += g.a + ' '; fb += g.b + ' '; });
    return S(out.trim(), 'ink', 2.4) + F(fa.trim(), 'p50') + F(fb.trim(), 'p300');
  }
  /** A ragged ice plate lying on the ground: paper, ink edge, one p300 facet. */
  function icePlate(rx, ry, cy, seed) {
    const pl = [];
    for (let i = 0; i < 14; i++) { const a = i * TAU / 14 + (jit(seed, i + 40) - 0.5) * 0.3, k = 0.9 + 0.1 * jit(seed, i); pl.push([Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return F(line(pl, true), 'p50', { st: 'ink', sw: 1.2 }) + F(line([[rx * 0.12, cy + ry * 0.1], [rx * 0.62, cy - ry * 0.05], [rx * 0.5, cy + ry * 0.62], [rx * 0.06, cy + ry * 0.7]], true), 'p300', { a: 0.9 });
  }
  function freezeBackArt(rc) {
    const q = FREEZE[rc], b = q.back, y0 = q.cy - q.ry * 0.55;
    return crystalFan([[-114, b * 0.8, -q.rx * 0.62, y0], [-96, b, -q.rx * 0.5, y0], [-84, b * 0.92, q.rx * 0.48, y0], [-64, b * 0.72, q.rx * 0.62, y0]], q.w * 0.85) + icePlate(q.rx, q.ry, q.cy, 230 + rc);
  }
  function freezeFrontArt(rc) {
    const q = FREEZE[rc], H = q.H, L = -q.rx * 0.42, R = q.rx * 0.36, y = q.by;
    const fan = [[-118, 0.6 * H, L, y], [-98, 0.9 * H, L + q.w * 0.9, y], [-80, 0.55 * H, L + q.w * 1.8, y], [-104, 0.68 * H, R, y], [-84, 0.84 * H, R + q.w * 0.9, y], [-64, 0.5 * H, R + q.w * 1.8, y]];
    let s = crystalFan(fan, q.w);
    const t = fan[1], a = t[0] * RAD;
    s += SW(`M${P2([t[2], t[3] - 0.6])} L${P2([t[2] + Math.cos(a) * t[1] * 0.68, t[3] + Math.sin(a) * t[1] * 0.68])}`, [['ink', 1.3], ['ally', 0.75]]);
    [[-q.rx * 0.62, 0], [q.rx * 0.02, 1], [q.rx * 0.6, 2]].forEach(([x, i]) => { s += F(chipD(x, -1.2, q.chips[i], 240 + rc + i, 0.4 + i), 'p50', { st: 'ink', sw: 1 }); });
    return s;
  }
  [12, 19, 28].forEach((rc) => { ART.frostNeedles['freeze-back-' + rc] = () => freezeBackArt(rc); ART.frostNeedles['freeze-front-' + rc] = () => freezeFrontArt(rc); });

  // ---- twinBlades spin: the twin blades' paper crescents (no handles), opposite each other, spinning in place: 45° a
  // frame, so the 4-frame loop at 16 fps is two turns a second (the pair repeats every 180°). spin-end: slowing, falling ----
  function bladeD(a0, k) {
    const outer = [], inner = [];
    for (let i = 0; i <= 10; i++) { const s = i / 10, a = a0 + s * 110 * RAD, th = 4.6 * Math.sin(Math.PI * s); outer.push(polar(15, a)); inner.push(polar(15 - th, a)); }
    return line(outer.concat(inner.reverse()).map(([x, y]) => [x, y * (k || 1)]), true);
  }
  function bladePair(rot, k, pc, ln, cy) {
    let s = '';
    [0, Math.PI].forEach((o) => {
      const a0 = -2.4 + rot + o;
      s += S(`M${P2(polar(11.6, a0 - 0.9).map((v, i) => (i ? v * (k || 1) : v)))} A11.6,${f(11.6 * (k || 1))} 0 0 1 ${P2(polar(11.6, a0 - 0.2).map((v, i) => (i ? v * (k || 1) : v)))}`, 'ink300', 0.9);
      s += F(bladeD(a0, k), pc, { st: ln, sw: 1.4 });
      const core = samp((t) => { const ss = 0.2 + 0.6 * t, p = polar(15 - 2.3 * Math.sin(Math.PI * ss), a0 + ss * 110 * RAD); return [p[0], p[1] * (k || 1)]; }, 8);
      s += SW(smooth(core), cy);
    });
    return s;
  }
  ART.twinBlades.spin = (fr) => bladePair(fr * 45 * RAD, 1, 'p50', 'ink', [['ink', 1.6], ['ally', 0.8]]);
  ART.twinBlades['spin-end'] = (fr) => (fr === 0 ? bladePair(0.4, 1, 'p300', 'ink', [['ink', 1.4], ['allyD', 0.7]]) : GA(bladePair(0.9, 0.45, 'p300', 'ink300', [['ink300', 1.2], ['allyD', 0.6]]), 0.7));

  // ---- pinHail caltrop: two or three dagger pins of the K9 icon (a diamond paper blade, a hollow ring handle up) stuck
  // point first in the ground like a thicket; one blade's groove is cyan; the ground shadow rx 18, no rim, no fill ----
  function pinArt(bx, by, deg, len, cyan) {
    const a = deg * RAD, u = [Math.cos(a), Math.sin(a)], n = [-u[1], u[0]], at = (t, sx) => [bx + u[0] * t + n[0] * sx, by + u[1] * t + n[1] * sx];
    let s = F(line([at(0, -1.4), at(len * 0.55, -2.3), at(len, -0.7), at(len, 0.7), at(len * 0.55, 2.3), at(0, 1.4)], true), 'p50', { st: 'ink', sw: 1.1 }) +
      F(line([at(0, 0.2), at(len * 0.55, 2.3), at(len, 0.7), at(len, 0.2)], true), 'p300');
    const g0 = at(len * 0.12, 0), g1 = at(len * 0.82, 0);
    s += cyan ? SW(`M${P2(g0)} L${P2(g1)}`, [['ink', 1.1], ['ally', 0.6]]) : S(`M${P2(g0)} L${P2(g1)}`, 'ink', 0.8);
    const c = at(len + 2.5, 0);
    s += S(`M${P2(at(len, 0))} L${P2(at(len + 0.7, 0))}`, 'ink', 1.4) + Cir(c[0], c[1], 1.7, 'none', { st: 'ink', sw: 1.2 });
    return s + S(`M${f(bx - 2)},${f(by + 0.3)} L${f(bx + 2)},${f(by + 0.3)}`, 'ink700', 1) + Cir(bx - 2.8, by + 0.9, 0.5, 'ink300') + Cir(bx + 2.6, by + 1.1, 0.45, 'ink300');
  }
  // [base x, base y, deg, len, cyan]: back to front, leaning hard and at different depths (upright pins in a row with
  // round rings read as little figures)
  const CALTROPS = {
    'caltrop-a': [[-8, -2.6, -122, 7.6, false], [8, -1.2, -60, 7.2, false], [0, 1.4, -92, 8.4, true]],
    'caltrop-b': [[-5, -2.2, -116, 8, true], [6, 1, -68, 8.2, false]],
    'caltrop-c': [[2, -3, -104, 6.8, false], [-9, -0.6, -72, 7.2, false], [9, 1.2, -126, 8, true]]
  };
  Object.keys(CALTROPS).forEach((p) => { ART.pinHail[p] = () => gShadow(18, -1.6) + CALTROPS[p].map((q) => pinArt(q[0], q[1], q[2], q[3], q[4])).join(''); });

  // ---- smokeTail puff: a clump of smoke rolling along the ground: lobes in ink300 with a crisp ink500 lower part and an
  // open curl on top; each variant a different size (not a caterpillar of equal lobes) ----
  const PUFFS = { 'puff-a': [[-7.6, -8, 7.6], [1.4, -11.4, 9.2], [9.4, -7.4, 6]], 'puff-b': [[-5.6, -7.2, 7], [4.4, -9.4, 8.2], [11, -5.4, 4.2]], 'puff-c': [[-9.8, -6.6, 5.6], [-2.4, -10.2, 8.2], [6.6, -8.6, 7], [11.4, -5, 3.6]] };
  function puffArt(fr, lobes) {
    const ph = fr / 4, L = lobes.map(([x, y, r], i) => { const w = TAU * (ph + i / 3); return [x + 1.2 * Math.sin(w), y + 0.6 * Math.cos(w), r * (1 + 0.05 * Math.sin(w + 1))]; });
    // the light clump, a crisp darker core low in it, the clump's lower edge, an open light curl on top
    let s = F(L.map(([x, y, r]) => circD(x, y, r)).join(' '), 'ink300') + F(L.map(([x, y, r]) => circD(x + 0.16 * r, y + 0.5 * r, r * 0.42)).join(' '), 'ink500');
    const t = L.reduce((m, q) => (q[1] - q[2] < m[1] - m[2] ? q : m), L[0]), cx = t[0] + t[2] * 0.15, cy = t[1] - t[2] * 0.25, rr = t[2] * 0.45;
    s += S(smooth(samp((u) => { const a = -0.6 + u * 4.6 + ph * 1.2, k = rr * (1 - 0.55 * u); return [cx + Math.cos(a) * k, cy + Math.sin(a) * k]; }, 16)), 'p300', 1.1);
    return s + S(smooth(samp((u) => [lerp(L[0][0] - L[0][2] * 0.6, L[L.length - 1][0] + L[L.length - 1][2] * 0.5, u), -0.6 - 0.8 * Math.sin(Math.PI * u)], 8)), 'ink500', 0.9);
  }
  Object.keys(PUFFS).forEach((p) => { ART.smokeTail[p] = (fr) => puffArt(fr, PUFFS[p]); });

  // ---- gravePins grave: the K9 grave pin stuck in the ground: an ink shaft, a small round-topped paper head (ink edge,
  // p300 shade; no writing, no cross), cyan thread wound round the shaft; ground shadow (rx 21: the box allows no more).
  // grave-rise: it comes up out of the ground (the head's top, then most of it) with clods flying ----
  const GRAVES = { 'grave-a': [-8, 9, 9.4, 10], 'grave-b': [10, 7.6, 8.2, 9], 'grave-c': [-3, 10.4, 10, 11] };   // [tilt°, shaft, head w, head h]
  function gravePin(q, out) {   // out: share of the pin standing above the ground (1 = all)
    const [tilt, sh, hw, hh] = q, total = sh + hh, base = -total * (out - 1);
    const y0 = base - sh, h2 = hw / 2;
    let s = '';
    if (out >= 0.99) {
      s += F(`M-1,${f(base)} L1,${f(base)} L1,${f(y0)} L-1,${f(y0)} Z`, 'ink');
      [0.32, 0.58].forEach((k, i) => { const y = base - sh * k; s += SW(`M-1.9,${f(y + 0.9)} L1.9,${f(y - 0.9)}`, [['ink', 1.5], ['ally', 0.8]]); if (i) s += SW(`M1.9,${f(y - 0.9)} C3.4,${f(y - 0.2)} 3.8,${f(y + 1.4)} 3.4,${f(y + 2.8)}`, [['ink', 1.2], ['ally', 0.6]]); });
    }
    const head = `M${f(-h2)},${f(y0)} L${f(-h2)},${f(y0 - hh + h2)} A${f(h2)},${f(h2)} 0 0 1 ${f(h2)},${f(y0 - hh + h2)} L${f(h2)},${f(y0)} Z`;
    const shade = `M${f(h2 * 0.25)},${f(y0)} L${f(h2 * 0.25)},${f(y0 - hh + h2 * 0.4)} A${f(h2)},${f(h2)} 0 0 1 ${f(h2)},${f(y0 - hh + h2)} L${f(h2)},${f(y0)} Z`;
    s += F(head, 'p50', { st: 'ink', sw: 1.4 }) + F(shade, 'p300');
    return TX(s, rotM(tilt, 0, 0));
  }
  Object.keys(GRAVES).forEach((p, i) => {
    ART.gravePins[p] = () => gShadow(21, -2.9) + gravePin(GRAVES[p], 1) + Cir(-4.6, 0.6, 0.6, 'ink300') + Cir(4.2 - i, 1, 0.5, 'ink300');
  });
  /** The grave pin coming up: the round top of the head out of the ground (0), then most of the pin (1), clods flying. */
  ART.gravePins['grave-rise'] = (fr) => {
    const q = GRAVES['grave-a'], h2 = q[2] / 2;
    let s = gShadow(21, -2.9, 0.18);
    if (fr === 0) s += TX(F(`M${f(-h2)},0 A${f(h2)},${f(h2)} 0 0 1 ${f(h2)},0 Z`, 'p50', { st: 'ink', sw: 1.4 }), rotM(q[0], 0, 0));
    else s += gravePin([q[0], q[1] * 0.6, q[2], q[3]], 1);
    [[-7, -3, 1.6, 0], [6, -5, 1.3, 1], [-2, -8, 1.1, 2], [9, -1, 1.2, 3]].forEach(([x, y, r, i]) => { s += F(chipD(x * (fr ? 1.4 : 1), y * (fr ? 0.6 : 1) + (fr ? 1.5 : 0), r, 270 + i, i), i % 2 ? 'ink700' : 'ink300'); });
    return s;
  };

  // ---- trackingSeals: the K9 seal is a square paper tag. sealCorner: a small square print pressed on the ground at
  // each corner (0 faint, 1 half, 2 pressed + the cyan thread's knot); sealStrike: the big square print slammed at the
  // centroid (0 torn paper flash, 1 an ink splat, 2 fading); the threads' cyan ends reach its corners. A plain square,
  // no inner square (a square in a square reads as a character) ----
  function sqPts(cx, cy, side, rotDeg, flat) {
    const a = rotDeg * RAD, c = Math.cos(a), s = Math.sin(a), h = side / 2;
    return [[-h, -h], [h, -h], [h, h], [-h, h]].map(([x, y]) => [cx + x * c - y * s, cy + (x * s + y * c) * flat]);
  }
  ART.trackingSeals.sealCorner = (fr) => {
    const sq = sqPts(0, 0, 11.5, 14, 0.5);
    if (fr === 0) return F(line(sq, true), 'p300', { a: 0.55 }) + S(line(sq, true), 'ink300', 0.9);
    let s = F(line(sq, true), 'p50', { st: 'ink', sw: fr === 1 ? 1 : 1.3, a: fr === 1 ? 0.8 : 1 }) + F(line([sq[1], sq[2], sq[3]], true), 'p300', { a: 0.85 });
    if (fr === 2) s += Cir(sq[0][0], sq[0][1], 1.3, 'ally', { st: 'ink', sw: 0.7 });
    return s;
  };
  ART.trackingSeals.sealStrike = (fr) => {
    const sq = sqPts(0, -2, 22, 14, 0.5), last = fr === 2;
    let s = '';
    if (fr === 0) s += TX(F(tornD(0, 0, [[-170, 18], [-128, 13], [-84, 16], [-40, 20], [-6, 15], [32, 19], [76, 12], [122, 17], [150, 14]], 0.4, 311), 'p50', { st: 'ink', sw: 1.3 }), chainM(transM(0, -2), scaleM(1, 0.55)));
    if (fr === 1) s += inkBurst(0, -1, 6, 312, { arms: 7, reach: [1.6, 2.6], flat: 0.5, drops: 0.6, col: 'ink700' });
    s += F(line(sq, true), last ? 'p300' : 'p50', { st: last ? 'ink300' : 'ink', sw: 1.6 }) + F(line([sq[1], sq[2], sq[3]], true), 'p300', { a: last ? 0.5 : 0.9 });
    if (!last) [0, 1, 3].forEach((k) => { const p = sq[k]; s += SW(`M${P2(p)} L${P2([p[0] * 1.3, (p[1] + 2) * 1.3 - 2])}`, [['ink', 2], ['ally', 1.1]]); });
    return last ? GA(s, 0.75) : s;
  };

  // ---- huntersMarks mark-prey: the K9 tag: a punched paper tag hung on a cyan cord loop, swinging (2 frames ±9°) ----
  ART.huntersMarks['mark-prey'] = (fr) => {
    let b = F('M-4.4,-12.6 L4.4,-12.6 L4.6,-3 L-4.2,-2.4 Z', 'p50', { st: 'ink', sw: 1.3 }) + F('M1.6,-12.6 L4.4,-12.6 L4.6,-3 L1.8,-2.8 Z', 'p300') + Cir(0, -10.4, 1.2, 'ink700', { st: 'ink', sw: 0.6 });
    b += SW('M0,-10.4 C-0.4,-12.8 -0.6,-14.2 0,-15.4', [['ink', 1.9], ['ally', 1]]) + SW(circD(0, -17.1, 1.7), [['ink', 1.8], ['ally', 0.9]]);
    return TX(b, rotM([9, -9][fr], 0, -17.1));
  };

  // ---- crowFeathers crow: an ink crow flying (+x, mirrored by the renderer for the way it goes): paper strokes on the
  // wing edges, cyan thread on a leg, no eye (6-frame wing beat). peck: a small paper burst where it pecks ----
  const CROW_BODY = smooth([[-5, -0.6], [-2, -2.4], [2.4, -2.4], [4.8, -1.4], [5.2, 0.6], [2.6, 2.2], [-2.2, 2], [-5.2, 0.9]], true);
  const CROW_WING = [[0, 0], [-2.6, -1.4], [-6.4, -2], [-9.4, -1.6], [-7.4, -0.2], [-4, 0.9]];
  // R1 (review 5, 3b1): the raised and level frames open the wing's tip into four primaries, each the K9 feather (a
  // pointed ink feather with a paper shaft stroke); the down-beat frame keeps the closed wing. The beak is heavier and
  // longer (a crow, not a small bird). No eye; frames, box and the one cyan (the leg thread) as before
  // the open wing: the closed wing's tip split by three notches into four pointed primaries (the fingers show against
  // the ground when the wing is up); paper shaft strokes on the two longest only (four read as a comb)
  const CROW_WING_OPEN = [[0, 0], [-2.6, -1.4], [-5.6, -2.1], [-7, -2.2], [-8.7, -2.3], [-7.6, -1.5], [-9.3, -1.2], [-7.8, -0.6], [-9.1, 0.1], [-7.4, 0.3], [-8.1, 1.1], [-6.2, 0.8], [-4, 0.9]];
  const CROW_SHAFTS = [[[-7.2, -2], [-8.3, -2.2]], [[-7.7, -1.1], [-8.9, -1.2]]];
  function crowWing(m, open, col, edge) {
    if (!open) return F(smooth(CROW_WING.map((p) => apM(m, p)), true), col) + (edge ? S(smooth(CROW_WING.slice(0, 4).map((p) => apM(m, p))), 'p50', 0.7) : '');
    return F(line(CROW_WING_OPEN.map((p) => apM(m, p)), true), col) + (edge ? S(smooth(CROW_WING_OPEN.slice(0, 4).map((p) => apM(m, p))), 'p50', 0.7) +
      CROW_SHAFTS.map((q) => S(line(q.map((p) => apM(m, p))), 'p50', 0.42)).join('') : '');
  }
  function crowArt(fr) {
    const el = [18, 9, -4, -20, -9, 8][fr], open = fr !== 3;
    const wm = (dx, dy, k) => chainM(transM(-0.4 + dx, -0.8 + dy), rotM(el * k));
    let s = crowWing(wm(1.2, -0.6, 0.8), open, 'ink700', false);
    s += F(line([[-4.4, -0.8], [-9.6, -2.2], [-8.9, -0.2], [-9.8, 1.6], [-4.4, 1.1]], true), 'ink') + F(CROW_BODY, 'ink') + Cir(5.3, -1.7, 2.4, 'ink') +
      F(line([[6.7, -2.9], [8.6, -2.5], [9.9, -1.5], [8.5, -1], [6.7, -0.5]], true), 'ink');
    s += S('M-0.6,2 L-1.3,4 M1,2.1 L0.6,4.1', 'ink', 0.9) + SW('M-2.1,3.5 L0.3,3.2', [['ink', 1.4], ['ally', 0.75]]) + SW('M-2.1,3.5 C-3.4,3.9 -4.4,4.6 -5.4,4.8', [['ink', 1.2], ['ally', 0.6]]);
    s += crowWing(wm(0, 0, 1), open, 'ink', true);
    return s;
  }
  ART.crowFeathers.crow = (fr) => crowArt(fr);
  ART.crowFeathers.peck = (fr) => (fr === 0 ? F(starD(0, 0, 4.8, 6, 281, -0.3, 0.42), 'p50', { st: 'ink', sw: 0.8 }) : F(starD(0.3, 0.2, 3.2, 5, 282, 0.2, 0.45), 'p300', { st: 'ink300', sw: 0.7 }) + Cir(-3.8, 2.6, 0.6, 'ink') + Cir(3.6, -2.4, 0.5, 'ink'));

  // ---- inkLightning pillar: a narrow (≤ 14) ink lightning pillar standing from a small ink cloud to the ground,
  // flickering (4 frames), with the bolt's cyan core; start: it strikes down (0 half, 1 grounded); end: it breaks up ----
  const PCLOUD = [[-5, -67, 4.6], [1, -69.6, 5.2], [6.4, -66.8, 4.2], [-9, -65.4, 3], [3.4, -64.4, 3.8]];
  function pillarPts(seed) { const pts = [[0, -62]]; for (let i = 1; i <= 6; i++) pts.push([i === 6 ? 0 : (jit(seed, i) - 0.5) * 8, -62 + 62 * i / 6]); return pts; }
  function pillarArt(fr, mode) {
    const end = mode === 'end', col = end ? (fr ? 'ink300' : 'ink700') : 'ink';
    let s = PCLOUD.map(([x, y, r]) => Cir(x, y, r, end && fr ? 'ink300' : 'ink')).join('') + PCLOUD.slice(0, 3).map(([x, y, r]) => Cir(x + 0.9, y + 1, r * 0.55, 'ink500')).join('');
    const pts = pillarPts(212 + (mode === 'loop' ? fr : mode === 'start' ? 6 : 8));
    if (end && fr === 1) return GA(s + dens(pts, 2).filter((p, i) => i % 3 === 0).map(([x, y]) => Cir(x, y, 1.2, 'ink300')).join(''), 0.8);
    let bolt = pts;
    if (mode === 'start' && fr === 0) bolt = cutAlong(pts, 0, 0.5);
    const d = brushD(dens(bolt, 3), (t) => lerp(end ? 5 : 7, end ? 3.4 : 5, t) * (mode === 'loop' && fr === 2 ? 0.85 : 1));
    if (end) { s += F(brushD(dens(cutAlong(pts, 0, 0.42), 3), (t) => lerp(5, 3.8, t)), col) + F(brushD(dens(cutAlong(pts, 0.56, 1), 3), (t) => lerp(3.8, 3, t)), col); return s; }
    s += F(d, col) + SW(line(cutAlong(bolt, 0.04, mode === 'start' && fr === 0 ? 0.9 : 0.86)), [['ally', 1.6], ['allyG', 0.5]], { join: 'miter', miter: 5 });
    if (!(mode === 'start' && fr === 0)) s += Cir(-4.4, 0.6, 0.9, 'p50', { st: 'ink', sw: 0.5 }) + Cir(4.8, 1.2, 0.8, 'p50', { st: 'ink', sw: 0.5 }) + Cir(-1.6, 2.2, 0.6, 'ink300');
    if (mode === 'start' && fr === 1) s += F(starD(0, -3.6, 6.2, 6, 291, -0.2, 0.4), 'p50', { st: 'ink', sw: 0.9 }) + F(brushD(dens(pts, 3), (t) => lerp(7, 5, t)), 'ink');
    return s;
  }
  ART.inkLightning['pillar-start'] = (fr) => pillarArt(fr, 'start');
  ART.inkLightning.pillar = (fr) => pillarArt(fr, 'loop');
  ART.inkLightning['pillar-end'] = (fr) => pillarArt(fr, 'end');

  // ---- fallingScroll roller: the middle of the scroll's roll at the band's head (+x = the band's way): paper roll seen
  // from above, the paper layers' lines rolling, the cyan hanging cord tied round it, its end trailing behind ----
  ART.fallingScroll.roller = (fr) => {
    let s = F('M-4.2,-7.6 L4.2,-7.6 L4.2,7.6 L-4.2,7.6 Z', 'p50', { st: 'ink', sw: 1.4 }) + F('M0.6,-7.6 L4.2,-7.6 L4.2,7.6 L0.6,7.6 Z', 'p300');
    [-2.4, 0.2, 2.6].forEach((x, i) => { const xx = x + fr * 1.2 - (x + fr * 1.2 > 3.4 ? 7.2 : 0); s += S(`M${f(xx)},-7.2 L${f(xx)},7.2`, 'ink300', 0.8 - i * 0.1); });
    s += E(0, -7.9, 4.4, 1, 'ink') + E(0, 7.9, 4.4, 1, 'ink');
    s += SW('M-4.6,-2.6 C-1.6,-1.8 1.6,-1.8 4.6,-2.6', [['ink', 2], ['ally', 1.1]]) + Cir(-4.4, -2.5, 1.1, 'ally', { st: 'ink', sw: 0.7 });
    return s + SW(`M-4.6,-2.4 C-7.4,${f(-1.8 + fr * 0.8)} -10,${f(-0.6 - fr * 0.6)} -12.8,${f(0.8 + fr * 0.6)}`, [['ink', 1.7], ['ally', 0.9]]);
  };

  // ---- seventhSeal seal8 / print8: the eighth seal, the seal's form 1.55 × (low wide cylinder, neck, ball knob, cyan
  // face rim); 0: the heavy press (squashed, a torn paper flash spread flat behind it on the ground - flash, speed
  // strokes, dust), 1-2: lifting, 3: fading. print8: a big print with a double rim ----
  const S8_BODY = 'M-17,-28 L-17,-3 A17,5.2 0 0 0 17,-3 L17,-28 A17,5.2 0 0 0 -17,-28 Z';
  const S8_NECK = 'M-3,-30.4 L3,-30.4 L2.3,-39.6 L-2.3,-39.6 Z';
  ART.seventhSeal.seal8 = (fr) => {
    const lift = [0, 8, 14, 18][fr], last = fr === 3, ln = last ? 'ink300' : 'ink';
    let b = F(S8_BODY, last ? 'p300' : 'p50', { st: ln, sw: 2.4 }) + F('M8,-28.8 L17,-28 L17,-3 A17,5.2 0 0 1 8,1.4 Z', 'p300', { a: last ? 0.6 : 1 });
    b += E(0, -28, 17, 5.2, last ? 'p300' : 'p50', { st: ln, sw: 1.7 }) + S(ellArc(17, 5.2, 0, -8, 0.1, Math.PI - 0.2), 'ink300', 1.1);
    b += SW(ellArc(17, 5.2, 0, -3, 0.02, Math.PI - 0.04), last ? [['ink300', 2.8], ['allyD', 1.4]] : [['ink', 3.6], ['ally', 2]]);
    b += F(S8_NECK, ln) + Cir(0, -45, 6.2, ln);
    if (!last) b += Cir(-1.9, -46.8, 2.3, 'ink500') + Cir(-2.7, -48, 0.9, 'p50');
    let s = b;
    if (fr === 0) s = G('scale(1.06 0.9)', s);
    if (lift) s = G(tr(0, -lift), s, last ? 0.55 : 1);
    if (fr === 0) {
      s = TX(F(tornD(0, 0, [[-176, 27], [-150, 19], [-118, 12], [-62, 12], [-30, 19], [-4, 27], [24, 16], [160, 16]], 0.42, 301), 'p50', { st: 'ink', sw: 1.4 }), chainM(transM(0, -8), scaleM(1, 0.5))) +
        taper([[-24, -18], [-24.4, -44]], 2, 0.4) + taper([[23, -26], [23.4, -50]], 1.6, 0.4) + s;
      s += F(blotE(-21, 0.6, 3.4, 2.2, 302, 7, 0.4), 'p300', { st: 'ink300', sw: 0.7 }) + F(blotE(20.6, 0.4, 3, 2, 303, 7, 0.4), 'p300', { st: 'ink300', sw: 0.7 });
    }
    if (fr === 1) s += Cir(-9, 1.2, 1.2, 'ink') + Cir(8, 1.8, 1, 'ink');
    return s;
  };
  ART.seventhSeal.print8 = () => {
    const rx = 32, ry = 0.42 * rx, onE = (deg, k) => [Math.cos(deg * RAD) * rx * (k || 1), Math.sin(deg * RAD) * ry * (k || 1)];
    let s = E(0, 0, rx, ry, 'p50', { a: 0.25 });
    [[200, 335], [355, 520]].forEach(([a0, a1]) => { s += F(brushD(samp((t) => onE(lerp(a0, a1, t)), 24), (t) => 0.6 + 2 * Math.sin(Math.PI * t)), 'ink'); });
    s += S(ellArc(rx * 0.8, ry * 0.8, 0, 0, 230 * RAD, 75 * RAD), 'ink300', 1) + S(ellArc(rx * 0.8, ry * 0.8, 0, 0, 20 * RAD, 60 * RAD), 'ink300', 0.9);
    const kp = [[-1.1, -0.1], [-0.8, 0.3], [-0.4, 0.56], [0.06, 0.62], [0.5, 0.5], [0.84, 0.26], [1.1, -0.06]].map(([x, y]) => [x * rx, y * ry]);
    s += F(brushD(crPts(kp, 8), (t) => 0.5 + 1.4 * Math.pow(Math.sin(Math.PI * t), 0.6)), 'ink', { a: 0.85 });
    return s + [[-0.86, 0.7, 0.8], [0.3, 1.04, 0.6], [0.92, -0.74, 0.6]].map(([x, y, r]) => Cir(x * rx, y * ry, r, 'ink700')).join('');
  };

  // ---- silenceBell mark-silence: the weapon's paper hand bell, small, its mouth lashed shut with cyan thread ----
  ART.silenceBell['mark-silence'] = () => {
    let s = F('M-0.9,-15.6 L0.9,-15.6 L0.9,-13 L-0.9,-13 Z', 'ink') + F(ellD(0, -15.9, 1.6, 1), 'ink');
    s += F('M-2.6,-13.2 C-3.8,-12.6 -4.7,-10.4 -5.1,-7.8 C-5.5,-6 -6.4,-5 -7.2,-4.4 L7.2,-4.4 C6.4,-5 5.5,-6 5.1,-7.8 C4.7,-10.4 3.8,-12.6 2.6,-13.2 Z', 'p50', { st: 'ink', sw: 1.3 });
    s += F('M2.6,-13.2 C3.8,-12.6 4.7,-10.4 5.1,-7.8 C5.5,-6 6.4,-5 7.2,-4.4 L3.8,-4.4 C4,-6.6 3.9,-10.2 2.6,-13.2 Z', 'p300') + F(ellD(0, -4.4, 7.2, 1.5), 'ink');
    s += SW('M-7,-5.2 C-3,-3.2 3,-3.2 7,-5.2', [['ink', 1.9], ['ally', 1]]) + SW('M-6.6,-3.8 C-2.6,-2.3 2.6,-2.3 6.6,-3.8', [['ink', 1.7], ['ally', 0.9]]);
    return s + Cir(5.4, -4.2, 1.1, 'ally', { st: 'ink', sw: 0.7 }) + SW('M6.2,-3.8 C6.8,-3.2 7,-2.8 7.4,-2.4', [['ink', 1.3], ['ally', 0.7]]);
  };

  // ---- inkPots fire: an ink flame of two or three tongues joined (ink silhouette, cyan body, allyG heart, paper sparks
  // off the tips), flickering over six frames; scorch<r>: the same flame in one to three clumps at the front of the feet
  // (review 5 F1) ----
  function tongueD(x, h, w, lean, y0) {
    return smooth([[x - w / 2, y0], [x - w * 0.46 + lean * 0.15, y0 - h * 0.34], [x - w * 0.22 + lean * 0.55, y0 - h * 0.7], [x + lean, y0 - h], [x + w * 0.2 + lean * 0.62, y0 - h * 0.66], [x + w * 0.44 + lean * 0.2, y0 - h * 0.3], [x + w / 2, y0]], true);
  }
  const FLAMES = { 'flame-a': [[0, 18, 7.6, 0], [-3.5, 11.5, 4.4, -1.2], [4.2, 12.8, 4.8, 1.6]], 'flame-b': [[-1, 16.4, 7.2, -0.8], [3.8, 13.4, 5, 1.4]] };
  function flameArt(fr, T) {
    const sway = [0, 0.9, 1.5, 0.7, -0.5, -1.1][fr], grow = [1, 1.05, 0.97, 1.02, 0.95, 1.03][fr];
    const tg = T.map(([x, h, w, lean], i) => [x, h * (i ? 2 - grow : grow), w, lean + sway * (i ? 0.7 : 1)]);
    let s = F(tg.map(([x, h, w, l]) => tongueD(x, h - 0.8, w, l, -0.8)).join(' ') + ' ' + ellD(0, -1.8, 6, 1.4), 'ink');
    s += F(tg.map(([x, h, w, l]) => tongueD(x + l * 0.12, h * 0.7, w * 0.52, l * 0.7, -1)).join(' '), 'ally');
    s += F(tongueD(tg[0][0] + tg[0][3] * 0.1, tg[0][1] * 0.42, tg[0][2] * 0.28, tg[0][3] * 0.5, -1.4), 'allyG');
    tg.slice(0, 2).forEach(([x, h, , l], i) => { s += Cir(x + l + (i ? -1.6 : 1.4), -h - 1.6 - i * 0.6, 0.7, 'p50', { st: 'ink', sw: 0.45 }); });
    return s;
  }
  Object.keys(FLAMES).forEach((p) => { ART.inkPots[p] = (fr) => flameArt(fr, FLAMES[p]); });
  // scorch<r>: clumps [x, s, tongues] of the ground flame (flame-a three tongues, flame-b two) at height H = hm·s, uneven
  // in gap and size (never a row of like single tongues); hm by size class. The big tongue's tip bends by SCORCH_LEAN (per
  // clump) through tongueD's lean: no straight cones
  const SCORCH_HM = { 12: 9.5, 19: 12, 28: 15, 38: 18, 54: 21 };
  const SCORCH = {
    12: [[-1, 1, 3]],
    19: [[-5, 1, 3], [7, 0.72, 2]],
    28: [[-8, 1, 3], [10, 0.76, 2]],
    38: [[-19, 0.8, 2], [-2, 1, 3], [17, 0.64, 2]],
    54: [[-30, 0.86, 3], [1, 1, 3], [29, 0.68, 2]]
  };
  const SCORCH_LEAN = [0.5, -0.6, 0.4];
  /** One scorch frame, flameArt's order: every tongue and each clump's base ellipse (rx = clump half width + 1, ry 1.4) in
   *  one ink path; the inner tongues (0.7h, 0.52w but leaving at least 1.2 of ink rim) in cyan; an allyG heart in each
   *  clump's big tongue (0.42h, 0.3w, at least 1.4 wide); one paper spark beside the biggest clump's tip when it fits
   *  inside the box - 3 and the feet rect (not class 12). Tongues at least 5 (big) / 3.4 (side) wide. Frame 1: big
   *  tongues sway +1 and stand 0.95 as high, side tongues sway -0.7 and stand 1.05 as high (no uniform scaling). */
  function scorchArt(fr, rc, P) {
    const hm = SCORCH_HM[rc], R = SPEC.marks.rects[rc];
    let ink = '', cy = '', heart = '', top = null;
    SCORCH[rc].forEach(([cx, sc, n], ci) => {
      const H = hm * sc, k = H / 18;
      const tg = FLAMES[n === 3 ? 'flame-a' : 'flame-b'].map(([x, h, w, l], i) => (i === 0
        ? [cx + x * k, h * k * (fr ? 0.95 : 1), Math.max(5, w * k), (l + SCORCH_LEAN[ci]) * k + (fr ? 1 : 0)]
        : [cx + x * k, h * k * (fr ? 1.05 : 1), Math.max(3.4, w * k), l * k - (fr ? 0.7 : 0)]));
      const half = Math.max(...tg.map(([x, , w]) => Math.abs(x - cx) + w / 2));
      ink += tg.map(([x, h, w, l]) => tongueD(x, h - 0.8, w, l, -0.8)).join(' ') + ' ' + ellD(cx, -1, half + 1, 1.4) + ' ';
      cy += tg.map(([x, h, w, l]) => tongueD(x + l * 0.12, h * 0.7, Math.min(w * 0.52, w - 2.4 - 0.24 * Math.abs(l)), l * 0.7, -1)).join(' ') + ' ';
      const [bx, bh, bw, bl] = tg[0];
      heart += tongueD(bx + bl * 0.1, bh * 0.42, Math.max(1.4, bw * 0.3), bl * 0.5, -1.4) + ' ';
      if (!top || H > top.H) top = { H, x: bx + bl, y: -bh };
    });
    let s = F(ink.trim(), 'ink') + F(cy.trim(), 'ally') + F(heart.trim(), 'allyG');
    if (rc !== 12) {
      const x = top.x + 2.1, y = top.y + 1.2, r = 0.75, x0 = 3 - P.anchor[0], y0 = 3 - P.anchor[1], x1 = P.box[0] - 3 - P.anchor[0], y1 = P.box[1] - 3 - P.anchor[1];
      if (x - r >= Math.max(x0, R[0]) && x + r <= Math.min(x1, R[2]) && y - r >= Math.max(y0, R[1]) && y + r <= Math.min(y1, R[3])) s += Cir(x, y, r, 'p50', { st: 'ink', sw: 0.45 });
    }
    return s;
  }
  [12, 19, 28, 38, 54].forEach((rc) => { ART.inkPots['scorch' + rc] = (fr, c, P) => scorchArt(fr, rc, P); });

  // ---- tarJar gather: a tar string pulled from the rim toward the middle (+x = outward, the anchor on the rim side):
  // thick at the rim, thin, a bead at the inner end; it tightens over four frames; jarBroken: the landing's jar, half
  // size, lying broken in the middle with tar run out of its mouth ----
  function stringArt(fr, v) {
    const inner = [-30, -27.5, -25.5, -27][fr] + (v ? 2 : 0), sag = [2.4, 1.6, 0.9, 1.4][fr] * (v ? -1 : 1);
    const pts = samp((t) => [lerp(-1, inner, t), sag * Math.sin(Math.PI * t) + (v ? 0.6 : -0.4) * t], 14);
    const s = F(brushD(pts, (t) => (t < 0.7 ? lerp(3, 1.1, t / 0.7) : t < 0.9 ? lerp(1.1, 2.4, (t - 0.7) / 0.2) : lerp(2.4, 0.5, (t - 0.9) / 0.1))), 'ink');
    return s + S(smooth(cutAlong(pts, 0.05, 0.3).map(([x, y]) => [x, y - 0.6])), 'p300', 0.7, { a: 0.85 });
  }
  ART.tarJar['string-a'] = (fr) => stringArt(fr, 0);
  ART.tarJar['string-b'] = (fr) => stringArt(fr, 1);
  const JB_M = chainM(transM(-1, -6.9), rotM(120), scaleM(0.5), transM(0, 14));
  ART.tarJar.jarBroken = () => {
    let jar = F(TJ_FOOT, 'ink', { st: 'ink', sw: 0.9 }) + S(ellArc(5.8, 1.3, 0, -0.2, 0.2, Math.PI - 0.4), 'p300', 0.9);
    jar += F(TJ_BODY, 'ink', { st: 'ink', sw: 0.9 }) + F(TJ_LIGHT, 'ink500') + F(smooth(TJ_HOLE, true), 'ink700') + S(smooth(TJ_BREAK), 'ink500', 0.8);
    jar += SW('M-7.9,-22 C-3.8,-20.2 3.8,-20.2 7.9,-22', [['ink', 1.8], ['ally', 1]]) + S(TJ_MOUTH, 'ink', 2) + F(TJ_MOUTH, 'ink') + F(ellD(0.4, -29, 6, 2.2), 'ink700') + S(TJ_MOUTH, 'p50', 1.2);
    const lip = apM(JB_M, [8.4, -28]);
    return F(blotE(lip[0] + 3.4, lip[1] + 2.2, 5.4, 2.2, 251, 9, 0.3), 'ink') + TX(jar, JB_M) + S(`M${P2([lip[0] + 1, lip[1] + 1.6])} L${P2([lip[0] + 5, lip[1] + 2])}`, 'p300', 0.8, { a: 0.8 });
  };

  // ---- meteorBrush mark: paper star motes (5-6 uneven points) rising and fading over the 1.2 s cycle ----
  const MOTE = [[-2.6, 1.85, 'p50'], [-4.4, 1.75, 'p50'], [-6.1, 1.5, 'p50'], [-7.6, 1.1, 'p300']];
  [0, 1].forEach((v) => { ART.meteorBrush['mote-' + 'ab'[v]] = (fr) => { const [y, r, col] = MOTE[fr]; return F(starD(v ? 0.3 : -0.3, y, r, v ? 6 : 5, 262 + v * 4 + fr, -Math.PI / 2, 0.42), col, { st: 'ink', sw: 0.5 }); }; });

  // ---- eclipseHalo corona: a torn paper flag out from the rim (+x = outward), a notch at its far end; 1: shorter, p300 ----
  function coronaArt(fr, v) {
    const L = (v ? 13.5 : 17) * (fr ? 0.8 : 1), wv = v ? -1 : 1;
    const top = samp((t) => [t * L, -lerp(2.2, 0.5, t) + wv * 0.9 * Math.sin(Math.PI * t * 1.4)], 8), bot = samp((t) => [t * L, lerp(2.2, 0.5, t) + wv * 0.9 * Math.sin(Math.PI * t * 1.4)], 8).reverse();
    return F(line(top.concat([[L + 0.6, -0.6], [L - 1.4, 0], [L + 0.4, 0.7]], bot), true), fr ? 'p300' : 'p50', { st: 'ink', sw: 0.9 });
  }
  ART.eclipseHalo['corona-a'] = (fr) => coronaArt(fr, 0);
  ART.eclipseHalo['corona-b'] = (fr) => coronaArt(fr, 1);

  // ==== 3c. awakening gimmicks, P2 (delivery 3b1, work order §4.3): enemy marks and feet overlays ====
  // Head marks paint 16-18 inside the box - 3 with an outline of 1.2-1.6; each is the gimmick's object and carries the
  // weapon's cyan on ink (with an allyG or paper heart). None may read as the bell's dome, the tag's square and loop, the
  // elite's three beads or affix signs, the stun's three dots, a pickup, a face or a letter.

  // -- headsmanDarts mark-fear: one paper cold-sweat drop (ink rim, p300 shade, a cyan glint) set to the back of the
  //    head; rotate 'face': the renderer mirrors it with the enemy. White with an ink rim and a glint, tilted: never the
  //    elite's filled drain drop --
  const dropD = (cx, cy, k) => `M${f(cx)},${f(cy - 7 * k)} C${f(cx + 1.3 * k)},${f(cy - 4.6 * k)} ${f(cx + 3.9 * k)},${f(cy - 1.8 * k)} ${f(cx + 3.9 * k)},${f(cy + 1.5 * k)} A${f(3.9 * k)},${f(3.9 * k)} 0 1 1 ${f(cx - 3.9 * k)},${f(cy + 1.5 * k)} C${f(cx - 3.9 * k)},${f(cy - 1.8 * k)} ${f(cx - 1.3 * k)},${f(cy - 4.6 * k)} ${f(cx)},${f(cy - 7 * k)} Z`;
  ART.headsmanDarts['mark-fear'] = () => {
    const body = F(dropD(0, 0, 1), 'p50') + F(dropD(0, 0, 1) + ' ' + dropD(-0.6, -0.7, 0.78), 'p300', { rule: 'evenodd' }) + S(dropD(0, 0, 1), 'ink', 1.4);
    return TX(body + SW('M-1.8,-2.4 C-2.5,-1 -2.6,0.6 -2.1,2', [['ink', 2], ['ally', 1.1], ['allyG', 0.4]]), chainM(transM(-2.6, -9.6), rotM(-16)));
  };

  // -- wardRing mark-weak: a short piece of the ward's twisted rope tied in one lumpy knot off centre, one end hanging
  //    long and the other short (a cord, never a ribbon bow); one cyan stitch through the knot --
  function ropeBand(pts, w0, w1) { const P = crPts(pts, 6); return { d: brushD(P, (t) => lerp(w0, w1, t)), P }; }
  ART.wardRing['mark-weak'] = () => {
    const L = ropeBand([[-5.4, -2.6], [-5.9, -6.4], [-3.8, -9.8], [-1.2, -11]], 2.6, 3.6), R = ropeBand([[1.6, -10.8], [4.2, -10.8], [5.9, -8.8], [6, -6]], 3.6, 2.6);
    let s = F(L.d, 'p50', { st: 'ink', sw: 1.3 }) + F(R.d, 'p50', { st: 'ink', sw: 1.3 });
    // the twist: slanted wraps across each band, uneven in spacing (no hatching)
    [[L.P, [0.24, 0.6]], [R.P, [0.4, 0.82]]].forEach(([P, ts]) => ts.forEach((t) => {
      const i = Math.round(t * (P.length - 1)), a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, c = P[i];
      s += S(`M${P2([c[0] - uy * 1.4 - ux * 0.6, c[1] + ux * 1.4 - uy * 0.6])} Q${P2([c[0] + ux * 0.3, c[1] + uy * 0.3])} ${P2([c[0] + uy * 1.4 + ux * 0.7, c[1] - ux * 1.4 + uy * 0.7])}`, 'ink', 0.9);
    }));
    // the frayed free ends
    s += S('M-6.2,-2.8 L-6.6,-1.6 M-5.1,-2.6 L-4.9,-1.4', 'ink', 0.8) + S('M5.2,-6.2 L5,-5 M6.6,-6.2 L6.9,-5.1', 'ink', 0.8);
    // the knot: a lumpy paper lump, its lower side in p300, the wrap crossing it; one cyan stitch through it
    const knot = blotE(0.2, -10.9, 3.4, 2.9, 431, 9, 0.24);
    s += F(knot, 'p50') + F(knot + ' ' + blotE(-0.2, -11.3, 2.3, 1.95, 431, 9, 0.24), 'p300', { rule: 'evenodd' }) + S(knot, 'ink', 1.3) + S('M-2.6,-9.8 C-1,-12.3 1.2,-12.5 2.7,-11', 'ink', 1);
    return s + SW('M-1.4,-13.3 L1.6,-8.7', [['ink', 2.2], ['ally', 1.2], ['allyG', 0.4]]);
  };

  // -- inkDarts mark-stain<n>: the ink stain grows with each hit: a blot (1), bigger with a drop (2), a big wet stain with
  //    two drops at its edge (3); a paper rim 1.2 round every piece; a cyan wet glint on the ink. Lobed: never a round
  //    disc (3 is not an 18 px black coin), the drops never two like dots side by side --
  // [r, lobe amplitude, drops [dx, dy, r], x and y radius factors]. Review 7 R2 (3b2): stain 1 more lobed (0.34) and a
  // little wide (1.15 r × 0.85 r), a spread stain and not a ball even without drops; 2 and 3 as in 3b1
  const STAINS = { 1: [3.6, 0.34, [], 1.15, 0.85], 2: [4.8, 0.28, [[5.1, 3.4, 1.3]], 1, 0.92], 3: [5.8, 0.34, [[6.1, 3.7, 1.5], [-5.3, 4.8, 1]], 1, 0.92] };
  function stainArt(n) {
    const [r, amp, drops, kx, ky] = STAINS[n], cx = -0.4, cy = -9.2;
    const pieces = [blotE(cx, cy, r * kx, r * ky, 470 + n, 10, amp)].concat(drops.map(([dx, dy, rr], i) => blotE(cx + dx, cy + dy, rr, rr * 1.12, 480 + 3 * n + i, 6, 0.2))).join(' ');
    return S(pieces, 'ink', 3.6) + S(pieces, 'p50', 2.4) + F(pieces, 'ink') + SW(arc(r * 0.56, -2.55, 1.15, cx, cy), [['ally', 1.1], ['allyG', 0.4]]);
  }
  [1, 2, 3].forEach((n) => { ART.inkDarts['mark-stain' + n] = () => stainArt(n); });

  // -- bossbane mark-crack<n>: the boss's crack plate: a torn paper tab (no circle, no holes: never a mask, a dial or a
  //    bag) with n cracks fanning from its upper left corner, uneven in angle and length, the long ones forking once;
  //    the newest crack has the cyan heart --
  const CRACK_PLATE = [[-9.4, -15.2], [-3, -16.4], [3.2, -15.6], [9.2, -16.2], [9.6, -10.2], [9, -4], [2.4, -3.4], [-3.4, -4], [-9.4, -3.6], [-8.8, -9.6]];
  const CRACK_SHADE = [[9.6, -10.2], [9, -4], [2.4, -3.4], [-3.4, -4], [-9.4, -3.6], [-9.2, -5.2], [-3.2, -5.6], [2.2, -5], [7.6, -5.6], [8.2, -10]];
  const CRACKS = [[12, 15.6], [30, 10.2], [49, 13.2], [61, 8.4], [82, 9.4]];   // [deg from the corner, length], in the order they come
  function crackPts(k) {
    const [deg, L] = CRACKS[k], sg = k % 2 ? -1 : 1, out = [[-8, -14.4]];
    [[0.42, 7 * 0.8], [0.36, -9], [0.22, 6 * 0.8]].forEach(([sh, dd]) => { const p = out[out.length - 1], a = (deg + dd * sg) * RAD; out.push([p[0] + Math.cos(a) * L * sh, p[1] + Math.sin(a) * L * sh]); });
    return out;
  }
  function crackArt(n) {
    let s = F(line(CRACK_PLATE, true), 'p50') + F(line(CRACK_SHADE, true), 'p300') + S(line(CRACK_PLATE, true), 'ink', 1.4);
    for (let k = 0; k < n; k++) {
      const P = crackPts(k), a = (CRACKS[k][0] + 34) * RAD;
      const d = line(P) + (CRACKS[k][1] > 12 ? ` M${P2(P[1])} L${P2([P[1][0] + Math.cos(a) * 3.4, P[1][1] + Math.sin(a) * 3.4])}` : '');
      s += k === n - 1 ? SW(d, [['ink', 2], ['ally', 1], ['allyG', 0.35]], { join: 'miter', miter: 4 }) : S(d, 'ink', 1, { join: 'miter', miter: 4 });
    }
    return s;
  }
  [1, 2, 3, 4, 5].forEach((n) => { ART.bossbane['mark-crack' + n] = () => crackArt(n); });

  // -- smokeTail lost: two smoke curls circling over the head (two open curls, never the stun's three dots), each
  //    trailing a small cyan ribbon (the tail's ribbon, K9); the four frames turn them half way round (they look alike).
  //    Review 7 F1 (3b2): an ink rim on both (the near curl [ink 3.4, p300 1], the far one [ink 2.8, ink300 0.8]: the
  //    light heart is the pale smoke, size and heart tone tell near from far), the curl k·1.6 (from 1.2), the orbit 4.7
  //    wide (from 3.6; 1.7 and 5 went past the box - 3 once the open ends face outward).
  //    The pair rocks 0 → 13° → 25° → 13° round the head while each curl spins, its open end kept on its own outer side
  //    (a half revolution put them one behind the other at 90°, one blob in a 14 high box; open ends turned inward
  //    touched) --
  function curlPts(cx, cy, k, ph) { return samp((u) => { const a = ph + u * 4.4, rr = k * (2.3 - 1.5 * u); return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.82]; }, 14); }
  const LOST_ROCK = [0, 0.22, 0.44, 0.22], LOST_SPIN = [0, 0.45, 0.9, 0.45];
  ART.smokeTail.lost = (fr) => {
    let back = '', front = '';
    [0, 1].forEach((i) => {
      const th = LOST_ROCK[fr] + i * Math.PI, near = i === 0, k = near ? 1 : 0.84;
      const P = curlPts(Math.cos(th) * 4.7, -3.4 + Math.sin(th) * 0.4, k * 1.6, i * Math.PI - 0.35 + LOST_SPIN[fr]);
      const e = P[0], dx = e[0] - P[1][0], dy = e[1] - P[1][1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
      const c = SW(smooth(P), near ? [['ink', 3.4], ['p300', 1]] : [['ink', 2.8], ['ink300', 0.8]]) +
        SW(`M${P2(e)} Q${P2([e[0] + ux * 0.9 - uy * 0.45, e[1] + uy * 0.9 + ux * 0.45])} ${P2([e[0] + ux * 1.6, e[1] + uy * 1.6 + 0.2])}`, [['ink', 2.2], ['ally', 1.2], ['allyG', 0.4]]);
      if (near) front += c; else back += c;
    });
    return back + front;
  };

  // -- inkBloom spore-a/b: a grain of the flower's cyan pollen in an ink rim; over its 1 s cycle it opens (0), floats
  //    (1, 2) and fades (3). The renderer lifts and drifts it (marks.spores); deco. No paper ball with a dark heart:
  //    that read as an eye. Review 7 §5-6 (3b2): about 5 px at 1x (radius 2 inside the box - 3, the rim makes 2.5) and
  //    light: an allyG body in a thin cyan ring, the glint off the centre, so it rises as a light grain in grey (the
  //    stun's dots are dark) --
  function sporeArt(fr, v) {
    // no tail (a dot with a tail read as the figure 9)
    const k = [0.72, 1, 1, 0.9][fr], last = fr === 3, cy = -5, rim = last ? 'ink300' : 'ink', rx = 2 * k, ry = (v ? 1.7 : 2.2) * k;
    let s = E(0, cy, rx, ry, last ? 'allyD' : 'ally', { st: rim, sw: 1 });
    if (!last) s += E(-0.2 * k, cy - 0.15 * k, rx * 0.62, ry * 0.62, 'allyG') + Cir(-0.85 * k, cy - (v ? 0.6 : 0.85) * k, 0.42 * k, 'p50');
    return s;
  }
  ART.inkBloom['spore-a'] = (fr) => sporeArt(fr, 0);
  ART.inkBloom['spore-b'] = (fr) => sporeArt(fr, 1);

  // -- frostNeedles frost<n>-<r>: the frost marks before the freeze: short crystal prisms on the ground just in front of
  //    the feet (front layer: under the body the feet hid them); one cluster at stack 1, two clusters and a thin ice
  //    sliver at stack 2; no taller than a quarter of the body (the freeze is the 40 % fans on a plate); the tallest
  //    crystal has the needle's cyan core --
  // review 7 R4 (3b2): frost 1 of class 12 from 4.6 to 5.6 high (still under a quarter of the body)
  const FROST = { 12: { H: [5.6, 6.2], w: 1.8, rx: 12 }, 19: { H: [5.8, 8], w: 2.2, rx: 17 }, 28: { H: [7.4, 10.6], w: 2.6, rx: 25 } };
  // clusters [x share of rx, root y, [[deg, length share], ...]]
  const FROST_CL = { 1: [[-0.42, 0.6, [[-122, 0.62], [-97, 1], [-74, 0.7]]]], 2: [[-0.5, 0.5, [[-124, 0.6], [-99, 1], [-79, 0.76]]], [0.44, 1.1, [[-106, 0.7], [-83, 0.88]]]] };
  function frostArt(n, rc) {
    const q = FROST[rc], H = q.H[n - 1];
    let s = n === 2 ? F(ellD(0, 0.8, q.rx * 0.72, 1.1), 'p50', { st: 'ink', sw: 1 }) : '', tall = null;
    FROST_CL[n].forEach(([xs, y, cr], ci) => {
      const list = cr.map(([deg, ls], j) => [deg, H * ls * (ci ? 0.84 : 1), q.rx * xs + (j - (cr.length - 1) / 2) * q.w * 0.95, y]);
      s += crystalFan(list, q.w);
      list.forEach((c) => { if (!tall || c[1] > tall[1]) tall = c; });
    });
    const a = tall[0] * RAD;
    s += SW(`M${P2([tall[2], tall[3] - 0.5])} L${P2([tall[2] + Math.cos(a) * tall[1] * 0.66, tall[3] + Math.sin(a) * tall[1] * 0.66])}`, [['ink', 1.2], ['ally', 0.7]]);
    // chips of ice on the ground
    [[q.rx * 0.12, 1.8, 0], [q.rx * 0.78, 0.6, 1]].slice(0, n).forEach(([x, y, i]) => { s += F(chipD(x, y, q.w * 0.55, 600 + rc + i, 0.5 + i), 'p50', { st: 'ink', sw: 0.9 }); });
    return s;
  }
  [1, 2].forEach((n) => [12, 19, 28].forEach((rc) => { ART.frostNeedles['frost' + n + '-' + rc] = () => frostArt(n, rc); }));

  // -- gravePins bound<r>: the cyan thread sews the feet to the ground: a running stitch along the front of the feet (an
  //    open arc: the hero's foot ring is a small closed cyan ring), its loose end lying on the ground; a small grave pin
  //    (3a's pin) stuck beside the feet with the thread tied to it --
  const BOUND = { 12: { rx: 10, cy: -0.4, pin: [-10, 2.6, 4.2, 4.4], px: 10.4 }, 19: { rx: 14.6, cy: -1.4, pin: [-8, 3.4, 5.2, 5.6], px: 15.4 }, 28: { rx: 21.4, cy: -3, pin: [-6, 4.6, 6.6, 7.2], px: 22.6 } };
  function boundArt(rc) {
    const q = BOUND[rc], ry = q.rx * 0.36;
    const P = samp((u) => { const a = lerp(0.18, Math.PI - 0.14, u); return [Math.cos(a) * q.rx, q.cy + Math.sin(a) * ry]; }, 24), e = P[P.length - 1], b = P[0];
    let s = SWD(smooth(P), [['ink', 2.2], ['ally', 1.2]], [3.4, 2.4], 0.6);
    s += SW(`M${P2(e)} C${P2([e[0] - 1.4, e[1] - 1])} ${P2([e[0] - 2.8, e[1] - 0.1])} ${P2([e[0] - 3.4, e[1] + 1.2])}`, [['ink', 2], ['ally', 1], ['allyG', 0.35]]);
    return s + TX(gravePin(q.pin, 1), transM(q.px, 0.4)) + SW(`M${P2(b)} Q${P2([q.px - 1.4, b[1] - 0.6])} ${P2([q.px - 0.6, -1.2])}`, [['ink', 2], ['ally', 1.1]]);
  }
  [12, 19, 28].forEach((rc) => { ART.gravePins['bound' + rc] = () => boundArt(rc); });

  // -- thornHalo thorn<r>: three curved rose thorns stuck in the ground round the feet (beside them and in front),
  //    different in size and hook; ink with the outer half in paper; one has the cyan heart. Never round the head (a
  //    crown of thorns), never straight cones --
  const thornPts = (x, y0, b, h, hook) => [[x - b / 2, y0], [x - b * 0.3 + hook * h * 0.18, y0 - h * 0.44], [x - b * 0.06 + hook * h * 0.6, y0 - h * 0.8], [x + hook * h, y0 - h], [x + b * 0.12 + hook * h * 0.5, y0 - h * 0.6], [x + b * 0.32 + hook * h * 0.14, y0 - h * 0.28], [x + b / 2, y0]];
  const thornD = (x, y0, b, h, hook) => smooth(thornPts(x, y0, b, h, hook), true);
  // [x, ground y, base, height, hook (tip offset share of the height), cyan]
  // Review 7 F2 (3b2): dark hooks. The front thorn is the biggest and stands lowest (in front of the feet line); the side
  // thorns (0.78 and 0.62 of it) stand higher, near the feet line at the sides, so the three lie on a shallow arc round
  // the feet (not a row); base about 0.75 of the height; each class as big as its box - 3 and feet rect allow (front
  // 6.4 / 7.6 / 9.6 / 11.6 / 13.6). Hooks as in 3b1 (the side thorns bend in, the front one to the right). The cyan heart
  // is on the front thorn (the biggest: it shows at 1x)
  const THORNS = {
    12: [[-8.6, 1, 3.75, 5, 0.55, 0], [8.8, 0.2, 2.98, 3.97, -0.6, 0], [-1.2, 2.8, 4.8, 6.4, 0.5, 1]],
    19: [[-13, 0.9, 4.45, 5.93, 0.55, 0], [13.2, 0.1, 3.53, 4.71, -0.6, 0], [-1.8, 2.7, 5.7, 7.6, 0.48, 1]],
    28: [[-19.5, 1.2, 5.62, 7.49, 0.55, 0], [19.5, 0.3, 4.46, 5.95, -0.6, 0], [-2.6, 3.4, 7.2, 9.6, 0.5, 1]],
    38: [[-26.5, 1.6, 6.79, 9.05, 0.55, 0], [26.5, 0.4, 5.39, 7.19, -0.6, 0], [-3.4, 4.1, 8.7, 11.6, 0.5, 1]],
    54: [[-37, 2, 7.96, 10.6, 0.55, 0], [37, 0.6, 6.32, 8.43, -0.6, 0], [-4.6, 4.8, 10.2, 13.6, 0.5, 1]]
  };
  function thornArt(rc) {
    return THORNS[rc].map(([x, y0, b, h, hook, cy]) => {
      // an ink thorn; paper only as a thin lit band (0.25 × the base wide at the root, to nothing at the tip) inside its
      // convex edge; an ink outline 1.2 (marks' 1.2-1.6); the cyan heart runs up the ink between the middle and the
      // concave side of one thorn
      const p = thornPts(x, y0, b, h, hook), d = thornD(x, y0, b, h, hook), C = crClosed(p, 6), N = outNormals(C), mid = (a, c) => [(p[a][0] + p[c][0]) / 2, (p[a][1] + p[c][1]) / 2];
      const idx = [];
      if (hook > 0) for (let i = 0; i <= 18; i++) idx.push(i); else for (let i = 36; i >= 18; i--) idx.push(i);
      const edge = idx.map((i) => C[i]), band = idx.map((i, j) => { const w = 0.25 * b * Math.pow(1 - j / (idx.length - 1), 0.9); return [C[i][0] - N[i][0] * w, C[i][1] - N[i][1] * w]; });
      const inner = hook > 0 ? [p[6], p[5], p[4]] : [p[0], p[1], p[2]], M = [mid(0, 6), mid(1, 5), mid(2, 4)];
      let s = E(x, y0 + 0.2, b * 0.55, b * 0.18, 'ink700', { a: 0.6 }) + F(d, 'ink') + F(line(edge.concat(band.reverse()), true), 'p50') + S(d, 'ink', 1.2);
      if (cy) s += SW(smooth(M.map((q, i) => [(q[0] + inner[i][0]) / 2, (q[1] + inner[i][1]) / 2 - (i ? 0 : 0.3)])), [['ally', 1], ['allyG', 0.35]]);
      return s;
    }).join('');
  }
  [12, 19, 28, 38, 54].forEach((rc) => { ART.thornHalo['thorn' + rc] = () => thornArt(rc); });

  // ==== 3d. awakening gimmicks, P2 follow-up effects (delivery 3b2, work order §4.4): stamps ====
  // Event pieces are short (0.15-0.3 s); each is the weapon's object or its K9 cyan element at the moment of the event.
  /** The pieces of an ink burst (a blot, arms [deg, reach × r, width × r, drop 0/1], drops) as inkBurstAt shapes them, as
   *  path data one piece each (their windings differ, so each is filled on its own). */
  function burstPieces(cx, cy, r, seed, arms, flat) {
    const fy = flat || 1, out = [blotE(cx, cy, r, r * fy, seed, 10, 0.35)];
    arms.forEach(([deg, reach, wk, drop], i) => {
      const a = deg * RAD, L = r * reach, w = r * wk, c = Math.cos(a), sn = Math.sin(a), bend = (jit(seed, i + 380) - 0.5) * 0.5;
      const p0 = [cx + c * r * 0.55, cy + sn * r * 0.55 * fy], p1 = [cx + c * L, cy + sn * L * fy];
      const pm = [lerp(p0[0], p1[0], 0.55) - sn * L * bend * 0.3, lerp(p0[1], p1[1], 0.55) + c * L * bend * 0.3 * fy];
      out.push(brushD([p0, pm, p1], (t) => w * Math.pow(1 - t, 0.8) + 0.3));
      if (drop) out.push(circD(p1[0] + c * w * 1.1, p1[1] + sn * w * 1.1 * fy, Math.max(0.6, w * 0.42)));
    });
    return out;
  }
  /** The stain's grammar (mark-stain): ink pieces in a paper rim 1.2 with an ink line outside it. */
  const stainRim = (pieces) => { const d = pieces.join(' '); return S(d, 'ink', 3.6) + S(d, 'p50', 2.4) + pieces.map((q) => F(q, 'ink')).join(''); };

  // -- inkDarts stainBurst: the third stain bursts off the enemy: the wet stain torn open into arms and drops, every piece
  //    in the mark's paper rim, the mark's cyan wet glint (0); the stain flies apart in rimmed pieces (1); spent ink700
  //    drops lying on the ground (2). Paper-rimmed ink: not the pot's white shards, not a round splat --
  ART.inkDarts.stainBurst = (fr) => {
    if (fr === 0) {
      // the rim on the stain itself; the arms and drops thrown off it are bare ink (rimmed sticks and drops read as a
      // molecule model)
      const p = burstPieces(0, -8.4, 6.8, 711, [[-170, 2.5, 0.42, 1], [-128, 1.9, 0.38, 0], [-88, 2.15, 0.4, 1], [-46, 2.2, 0.36, 0], [-8, 2.7, 0.44, 1], [36, 2, 0.4, 1], [86, 1.6, 0.42, 0], [134, 2.2, 0.38, 1]], 0.9);
      return stainRim([p[0]]) + p.slice(1).map((q) => F(q, 'ink')).join('') + Cir(-24, -15.4, 1.3, 'ink') + Cir(23.4, -18.4, 1.1, 'ink') + Cir(25.2, 3.2, 1, 'ink') +
        SW(arc(3.6, -2.6, 1.3, -1.2, -9.4), [['ally', 1.4], ['allyG', 0.5]]);
    }
    if (fr === 1) {
      // the stain flies apart in rimmed pieces; short spent streaks from the middle (never reaching them), bare drops
      const pieces = [blotE(-13.6, -13.8, 4.4, 3.5, 712, 9, 0.34), blotE(12.4, -16, 3.7, 3.1, 713, 8, 0.32), blotE(16.2, -2.6, 3.2, 2.7, 714, 8, 0.3), blotE(-12, 0.4, 3, 2.5, 715, 8, 0.3)];
      let s = taper([[-1.6, -9], [-6.4, -11.4]], 2, 0.3, 'ink700') + taper([[1.6, -9.6], [6.6, -12.6]], 1.8, 0.3, 'ink700') + taper([[2, -7.2], [8, -5.2]], 1.6, 0.3, 'ink700') + F(blotE(0, -8, 3.2, 2.8, 716, 8, 0.36), 'ink700');
      s += Cir(-24, -21, 1.2, 'ink') + Cir(22.6, -23.4, 1, 'ink') + Cir(26, 4.6, 1.1, 'ink') + Cir(-25.2, 5.4, 0.9, 'ink') + Cir(2.4, -24, 0.8, 'ink');
      return s + stainRim(pieces) + SW(arc(2.4, -2.5, 1.2, -14.2, -14.4), [['ally', 1.2], ['allyG', 0.4]]);
    }
    const lie = [blotE(-15, 2.6, 3.8, 1.6, 717, 8, 0.3), blotE(14.4, 4.2, 3.2, 1.4, 718, 8, 0.3), blotE(-3, 6.2, 2.6, 1.1, 719, 7, 0.3), circD(-24, 7.4, 0.9), circD(23.4, 9.6, 0.8), circD(6.6, 11.4, 0.7)];
    return S(lie.join(' '), 'p300', 1.4) + lie.map((q) => F(q, 'ink700')).join('') + Cir(-8, -6, 0.8, 'ink300') + Cir(9, -9, 0.7, 'ink300');
  };

  // -- brushQuills dab: where a quill first hit, the pen's ink lies flat on the ground until it bursts: a lobed wet pool
  //    (no tail, no dot near an end: a tail and a dot read as a fish's eye) with the quill pen's cyan stroke, a tick of
  //    the nib across its sheen; it swells, satellite drops trembling (1); its skin bulges, beads rising off it, the
  //    tick brightest (2). A dark flat pool: not a pickup disc, not a cyan ring on the ground --
  /** The pen's cyan tick: a short tapered stroke (ink under, cyan, an allyG hair). */
  function penTick(pts, w) {
    const P = crPts(pts, 6);
    return F(brushD(P, (t) => lerp(w + 1, 0.6, t)), 'ink') + F(brushD(P, (t) => lerp(w, 0.2, t)), 'ally') + S(line(cutAlong(P, 0.08, 0.45)), 'allyG', 0.45);
  }
  ART.brushQuills.dab = (fr) => {
    const k = [1, 1.08, 1.16][fr];
    let s = F(blotE(0, 0.6, 8.2 * k, 3.8 * k, 721, 9, 0.28), 'ink') + F(blotE(-7.6 * k, 2.6, 1.3, 0.8, 722, 6, 0.3), 'ink') + F(blotE(7.2 * k, 2.8, 1, 0.7, 723, 6, 0.3), 'ink');
    s += S(ellArc(4.8 * k, 1.8 * k, -0.6, -0.2, Math.PI + 0.35, 1.3), 'p300', 0.8, { a: 0.85 });
    if (fr) s += Cir(-8.2 * k, -1.6, 0.6, 'ink') + Cir(8 * k, -1.2, 0.55, 'ink');
    if (fr === 2) s += S(ellArc(3.4, 1.2, 1.2, 0.2, Math.PI + 0.5, 1.2), 'ink500', 0.8) + Cir(-2.8, -4.6, 0.7, 'ink') + Cir(1.6, -5.2, 0.55, 'ink');
    return s + penTick([[-1.4 * k, -0.2], [1.4 * k, -1.4], [4.4 * k, -0.9]], [1.3, 1.5, 1.7][fr]);
  };

  // -- brushQuills dabBurst: the dab erupts: pen flicks of ink thrown up and out of the flat dab (thick at the root, a
  //    hooked thin end, uneven in angle and length), two torn shreds of the quill's paper vane, the pen's cyan point flung
  //    up (0); fewer, thinner flicks breaking into drops, the shreds floating (1); the flat dab in ink700 and drops (2) --
  /** A pen flick from p0 to p1 bowing by bow (share of its length), root width w, its last fifth hooking by hook. */
  function flick(p0, p1, w, bow, hook, col) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1, n = [-dy / L, dx / L];
    const pts = samp((t) => { const h = t > 0.8 ? (t - 0.8) / 0.2 : 0, b = bow * L * Math.sin(Math.PI * t) + hook * h * h; return [p0[0] + dx * t + n[0] * b, p0[1] + dy * t + n[1] * b]; }, 12);
    return F(brushD(pts, (t) => lerp(w, 0.3, Math.pow(t, 0.8))), col || 'ink');
  }
  /** A torn shred of the quill's paper vane: an uneven leaf, ink rim, two barb lines (turned deg, scaled k). */
  function vaneShred(cx, cy, deg, k, col) {
    const m = chainM(transM(cx, cy), rotM(deg), scaleM(k)), A = (q) => q.map((p) => apM(m, p));
    return F(line(A([[-3.6, 0.4], [-2.4, -1.6], [0.4, -2.2], [3.2, -1.4], [4.2, 0.2], [2.4, 0.6], [1.6, 1.4], [-0.6, 0.8], [-2, 1.6]]), true), col, { st: 'ink', sw: 0.9 }) +
      S(line(A([[-1.6, -0.6], [0.8, -1.4]])), 'ink300', 0.7) + S(line(A([[0, 0.2], [2.4, -0.6]])), 'ink300', 0.7);
  }
  ART.brushQuills.dabBurst = (fr) => {
    let s = F(blotE(0, 0.4, 9.4, 3.6, 731, 10, 0.26), fr === 2 ? 'ink700' : 'ink');
    if (fr === 0) {
      // nearly straight flicks (bowed ones read as a tuft of grass), drops off their ends, the pen's cyan tick flung up
      [[[-3, -1], [-19.6, -7.6], 3, 0.04, 0.6], [[-1.6, -1.4], [-12.4, -17.6], 2.6, -0.03, -0.6], [[0, -1.6], [-2.4, -19.4], 3.2, 0.03, 0.6], [[1.4, -1.4], [9.6, -18.2], 2.4, -0.04, -0.5], [[3, -1], [17.8, -11.4], 2.8, 0.03, 0.6], [[3.6, -0.4], [20.6, -2.6], 2, -0.03, -0.4]]
        .forEach(([a, b, w, bow, hook]) => { s += flick(a, b, w, bow, hook); });
      s += Cir(-21.6, -9, 0.9, 'ink') + Cir(11, -19.6, 0.8, 'ink') + Cir(21.6, -4.4, 0.7, 'ink');
      s += vaneShred(-15.2, -14.6, -30, 1, 'p50') + vaneShred(13.4, -16.6, 24, 0.85, 'p50');
      s += penTick([[2.4, -10.4], [4.6, -13.4], [7.6, -14.6]], 1.4);
    } else if (fr === 1) {
      [[[-4, -2], [-21, -10.4], 1.8, 0.05, 0.6], [[-2, -3], [-13.8, -18.8], 1.6, -0.04, -0.6], [[2, -3], [11.6, -18.6], 1.6, -0.04, -0.6], [[4, -1.6], [20.4, -6.4], 1.5, 0.04, 0.5]]
        .forEach(([a, b, w, bow, hook]) => { s += flick(a, b, w, bow, hook, 'ink700'); });
      s += Cir(-20, -13.6, 1.1, 'ink') + Cir(-3.8, -19.4, 1, 'ink') + Cir(15.2, -15.4, 0.9, 'ink') + Cir(21.6, -9.6, 0.8, 'ink');
      s += vaneShred(-17.2, -16.4, -44, 0.9, 'p50') + vaneShred(16.2, -16.8, 38, 0.8, 'p300');
      s += penTick([[5.4, -14.6], [7.8, -16.8], [10.6, -17.4]], 1.2);
    } else {
      s += Cir(-16, 3.2, 1.2, 'ink700') + Cir(13.4, 4.6, 1, 'ink700') + Cir(-6, 7, 0.8, 'ink300') + Cir(19.6, 1.6, 0.8, 'ink300') + vaneShred(-18.6, 0.6, -70, 0.7, 'p300');
    }
    return s;
  };

  // -- sealArrows topple: domino: the arrow's seal head (K9: a squat paper block, its inked face below with the cyan face
  //    rim) tipping over where the pushed enemy struck the next one, a torn paper burst at the blow and two fall strokes
  //    (0); almost down, dust (1). No letters on the face; no knob (with one it read as a bottle) --
  function sealBlock(m, last) {
    const ln = last ? 'ink300' : 'ink';
    let b = F('M-4.6,-9 L4.6,-9 L4.6,0 L-4.6,0 Z', last ? 'p300' : 'p50', { st: ln, sw: 1.4 }) + F('M1.6,-9 L4.6,-9 L4.6,-2.6 L1.6,-2.6 Z', 'p300', { a: last ? 0.6 : 1 });
    b += F('M-4.6,-2.6 L4.6,-2.6 L4.6,0 L-4.6,0 Z', ln) + SW('M-5,-1.3 L5,-1.3', last ? [['ink300', 1.6], ['allyD', 0.8]] : [['ink', 2], ['ally', 1.1]]);
    return TX(b, m);
  }
  ART.sealArrows.topple = (fr) => {
    if (fr === 0) {
      return S('M-6.4,-3.2 C-5.6,-6.2 -3.2,-8.4 0.2,-8.8', 'ink300', 1.1) + S('M-8.6,0.4 C-8.6,-2.2 -7.6,-4.2 -6,-5.4', 'ink300', 0.9) +
        TX(F(tornD(0, 0, [[-160, 5.2], [-112, 3.6], [-64, 5.6], [-18, 4], [30, 5.4], [80, 3.4], [128, 4.8]], 0.45, 741), 'p50', { st: 'ink', sw: 1 }), transM(7.6, -2.4)) +
        sealBlock(chainM(transM(-1, 6), rotM(28, 4.6, 0)), false);
    }
    return F(chipD(-8.6, 8.4, 1.3, 742, 0.4), 'ink300') + F(chipD(-3.4, 9.6, 1, 743, 1.1), 'ink300') + F(chipD(10.6, 8.6, 1.1, 744, 0.7), 'ink300') +
      TX(F(tornD(0, 0, [[-150, 3.6], [-90, 2.6], [-30, 3.8], [40, 2.8], [110, 3.4]], 0.45, 745), 'p300', { st: 'ink300', sw: 0.8 }), transM(8.6, 3.2)) +
      sealBlock(chainM(transM(-4, 6), rotM(62, 4.6, 0)), true);
  };

  // -- thunderNeedles leapHit: where the leaping bolt strikes: three short kinked bolt prongs of uneven length and angle
  //    (ink, the needle's cyan bolt core, allyG) and a small paper flash at the point (0); shorter and spent (1). Not the
  //    spark thread's paper star --
  const PRONGS = [[-132, 8.2, 1], [-28, 7.4, -1], [58, 6.2, 1], [154, 3.6, -1]];
  function prongPts(deg, len, side, k) {
    const a = deg * RAD, u = [Math.cos(a), Math.sin(a)], n = [-u[1], u[0]], L = len * k;
    return [[u[0] * 1.2, u[1] * 1.2], [u[0] * L * 0.48 + n[0] * side * 1.5, u[1] * L * 0.48 + n[1] * side * 1.5], [u[0] * L, u[1] * L]];
  }
  ART.thunderNeedles.leapHit = (fr) => {
    const P = PRONGS.map(([d, l, sd]) => prongPts(d, l, sd, fr ? 0.62 : 1));
    let s = P.map((p) => F(brushD(p, (t) => lerp(fr ? 1.8 : 2.8, 0.5, t)), fr ? 'ink300' : 'ink')).join('');
    s += P.slice(0, 3).map((p) => F(brushD(p, (t) => lerp(fr ? 0.9 : 1.4, 0.2, t)), fr ? 'allyD' : 'ally')).join('');
    if (!fr) s += S(line(cutAlong(P[0], 0, 0.55)), 'allyG', 0.5);
    return s + F(starD(0, 0, fr ? 2.4 : 3.4, 5, 746 + fr, 0.2, 0.46), fr ? 'p300' : 'p50', { st: 'ink', sw: 0.8 });
  };

  // -- inkPulse bump: a pushed enemy strikes a wall: the pulse's black band breaks on it: a squashed ink smack with short
  //    heavy arms, a torn paper flash behind it and a piece of the band's cyan leading arc over it (0); ink700, the flash
  //    in p300 (1). Round (rotate none): the wall's side is not known to the stamp --
  ART.inkPulse.bump = (fr) => {
    if (fr === 0) {
      let s = TX(F(tornD(0, 0, [[-176, 11.6], [-140, 8], [-104, 10.4], [-70, 7.4], [-30, 11.8], [6, 9], [44, 12.2], [86, 7.6], [122, 10.6], [158, 8.4]], 0.45, 751), 'p50', { st: 'ink', sw: 1.1 }), scaleM(1, 0.8));
      s += inkBurstAt(0, 0.6, 5.2, 752, [[-160, 1.7, 0.6, 1], [-96, 1.6, 0.56, 0], [-30, 1.8, 0.62, 1], [24, 1.7, 0.6, 0], [92, 1.5, 0.56, 1], [148, 1.9, 0.6, 0]], { flat: 0.62 });
      // a broken piece of the black band with its cyan leading edge, low on the left (over the top it read as a brow)
      return s + SW(arc(8, 2.15, 1.25), [['ink', 5]]) + SW(arc(9.6, 2.2, 1.1), [['ink', 2.6], ['ally', 1.4], ['allyG', 0.45]]);
    }
    let s = TX(F(tornD(0, 0, [[-170, 7.4], [-120, 5.4], [-66, 7], [-14, 5.6], [40, 7.8], [100, 5.2], [150, 6.6]], 0.45, 753), 'p300', { st: 'ink300', sw: 0.9 }), scaleM(1, 0.8));
    s += F(blotE(0, 0.8, 4.4, 2.6, 754, 9, 0.3), 'ink700') + Cir(-10.6, -4, 1.1, 'ink700') + Cir(10.8, 3.6, 1, 'ink700') + Cir(-6, 7.2, 0.8, 'ink300') + Cir(8.2, -7.4, 0.7, 'ink300');
    return s + SW(arc(8.8, 2.3, 0.9), [['ink300', 2.4], ['allyD', 1.2]]);
  };

  // -- inkBloom pollenPuff: every half second a puff of the flower's cyan pollen leaves the enemy: grains of different size
  //    (the spores' light grain: ink rim, cyan ring, allyG body, an off-centre glint) in a loose cluster with two pale puff
  //    curls (0); spreading up and out (1); small, allyD, fading (2) --
  const PUFF_GRAINS = [[-2.4, -1.8, 1.9], [2.6, -3, 1.5], [0.4, 1.2, 1.3], [5.2, 0.2, 1.1], [-5.4, 0.8, 1.2], [-1.2, -4.2, 1]];
  function grain(x, y, r, last) {
    if (last) return Cir(x, y, r, 'allyD', { st: 'ink300', sw: 0.7 });
    return Cir(x, y, r, 'ally', { st: 'ink', sw: 0.7 }) + Cir(x - r * 0.1, y - r * 0.08, r * 0.6, 'allyG') + Cir(x - r * 0.42, y - r * 0.42, Math.max(0.3, r * 0.22), 'p50');
  }
  ART.inkBloom.pollenPuff = (fr) => {
    const sp = [1, 1.6, 2.1][fr], up = [0, 1.6, 3][fr], k = [1, 0.95, 0.7][fr];
    let s = '';
    if (fr < 2) {
      s += S(`M${f(-7 * sp)},${f(-2 - up)} C${f(-8.4 * sp)},${f(-6 - up)} ${f(-4.6 * sp)},${f(-9 - up)} ${f(-1.6 * sp)},${f(-7.6 - up)}`, 'ink300', 0.9, { a: fr ? 0.6 : 0.9 });
      s += S(`M${f(6.6 * sp)},${f(-1.6 - up)} C${f(8.2 * sp)},${f(-4.8 - up)} ${f(6.2 * sp)},${f(-7.6 - up)} ${f(3.6 * sp)},${f(-7.4 - up)}`, 'ink300', 0.8, { a: fr ? 0.5 : 0.8 });
    }
    PUFF_GRAINS.forEach(([x, y, r]) => { s += grain(x * sp, -4 + y * sp * 0.8 - up, r * k, fr === 2); });
    return s;
  };

  // -- tailGuard rearHit: a hit from behind takes double: the guard's dagger (K9: a paper blade with a round paper guard,
  //    no centre dot) stabs in through a paper slash, a short cyan ribbon (the rear weapons' scarf colour) flicking off
  //    its grip (0); a second cut beside the first, not crossing it (two cuts, not an ✕) (1); both cuts fade, drops (2) --
  function slashD(x0, y0, x1, y1, bow, w) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, n = [-dy / L, dx / L];
    return brushD(samp((t) => { const b = bow * L * Math.sin(Math.PI * t); return [x0 + dx * t + n[0] * b, y0 + dy * t + n[1] * b]; }, 14), (t) => w * Math.pow(Math.sin(Math.PI * t), 0.7) + 0.2);
  }
  function guardDagger(m) {
    const b = F('M2.4,-1.5 L12.6,-0.6 L15,0 L12.6,0.6 L2.4,1.5 Z', 'p50', { st: 'ink', sw: 1.2 }) + F('M2.4,0.25 L12.6,0.3 L15,0 L12.6,0.6 L2.4,1.5 Z', 'p300') +
      F('M-5,-1.1 L-0.8,-1.1 L-0.8,1.1 L-5,1.1 Z', 'ink') + Cir(0.8, 0, 2.5, 'p50', { st: 'ink', sw: 1.2 });
    return TX(b, m);
  }
  ART.tailGuard.rearHit = (fr) => {
    const cutA = slashD(-14, -10.4, 6.6, 6.8, 0.12, 3.4), cutB = slashD(-6.4, -12.6, 11.4, 1.6, 0.12, 2.6);
    if (fr === 2) return F(cutA, 'p300', { st: 'ink300', sw: 0.8 }) + F(cutB, 'p300', { st: 'ink300', sw: 0.7 }) + Cir(-14.6, 2.4, 0.9, 'ink700') + Cir(9.6, 8.4, 0.8, 'ink700') + Cir(13.4, -5, 0.7, 'ink300');
    const back = fr ? [2, -1.4] : [0, 0], m = chainM(transM(7.4 + back[0], -7.6 + back[1]), rotM(150)), g = apM(m, [-5, 0]), rv = fr ? [2.4, -2.8] : [4, -2.6];
    let s = F(cutA, 'p50', { st: 'ink', sw: 1.1 });
    if (fr) s += F(cutB, 'p50', { st: 'ink', sw: 1 }) + Cir(-15.4, -12.2, 1.1, 'ink') + Cir(8.6, 9, 1, 'ink') + Cir(13.6, 3.2, 0.8, 'ink');
    else s += inkBurstAt(-3.6, -1.8, 2.6, 755, [[-150, 2.2, 0.5, 1], [-60, 1.9, 0.46, 0], [40, 2.1, 0.5, 1], [120, 1.8, 0.46, 0]], {});
    s += guardDagger(m);
    const rib = samp((t) => [g[0] + rv[0] * t + 0.5 * Math.sin(t * 5 + fr), g[1] + rv[1] * t - 0.5 * Math.sin(t * 4 + fr * 1.7)], 8);
    return s + F(brushD(rib, (t) => lerp(2.2, 0.8, t)), 'ally', { st: 'ink', sw: 0.8 }) + S(line(cutAlong(rib, 0.1, 0.5)), 'allyG', 0.45);
  };

  // -- inkLance fork: where the lance's tip splits into its two branch lances (+x = the lance's way): a small ink burst
  //    thrown forward, a torn paper flash behind it, the tassel's cyan knot band wrapped across it (0); ink700, p300 (1).
  //    The branches are the SPEC lances (no V is drawn here) --
  ART.inkLance.fork = (fr) => {
    if (fr === 0) {
      let s = TX(F(tornD(0, 0, [[-170, 8.4], [-128, 6.6], [-86, 8], [-40, 5.8], [6, 7], [52, 5.6], [96, 8.2], [140, 6.4]], 0.45, 761), 'p50', { st: 'ink', sw: 1 }), chainM(transM(-2.2, 0), scaleM(1, 0.85)));
      s += inkBurstAt(0.6, 0, 3.8, 762, [[-48, 2.1, 0.55, 1], [-8, 2.2, 0.5, 0], [34, 2, 0.52, 1], [146, 1.4, 0.5, 0]], {});
      return s + SW('M-1.4,-3.8 C0,-1.4 0,1.4 -1.2,3.8', [['ink', 3], ['ally', 1.6], ['allyG', 0.5]]);
    }
    return TX(F(tornD(0, 0, [[-160, 5.6], [-100, 4.4], [-40, 5.2], [20, 4], [90, 5.4], [150, 4.2]], 0.45, 763), 'p300', { st: 'ink300', sw: 0.8 }), transM(-2.6, 0)) +
      F(blotE(1.4, 0, 2.6, 2.2, 764, 8, 0.3), 'ink700') + Cir(7.6, -4.2, 0.8, 'ink700') + Cir(8.8, 3.4, 0.7, 'ink700') + SW('M-1,-3 C0.2,-1 0.2,1 -0.8,3', [['ink300', 2.2], ['allyD', 1.1]]);
  };

  // -- inkOrbit deflect-start / -travel / -end: an enemy shot turned back by the band becomes a paper shard comet (+x =
  //    its way): an angular paper shard head (ink rim, a p300 face and a crease), the orbit's cyan swirl at its back
  //    flowing into the paper comet tail, the tail breaking into shards. Hit r 7: the front at +8.6, the sides within
  //    ±5.2, the tail to -22 (K9 §4.2). Light with an ink rim: never the enemy shot's ink ball with a paper dot, no coral;
  //    the swirl is an open curl off the head's middle (a centred spiral in a white oval read as an eye) --
  const DF_HEAD = [[8.6, 0.8], [4.6, -3.4], [0.6, -5], [-3.8, -4], [-5.6, -1.2], [-4.8, 2.2], [-1.6, 4.6], [1, 3.2], [2.8, 4], [5.6, 3]];
  const DF_TAIL = [[-4.4, -4], [-9.8, -3.2], [-15.2, -2.2], [-20.6, -1], [-22.2, 0.2], [-19.6, 1.3], [-14, 2.4], [-8.6, 3.4], [-4, 3.8]];
  // the swirl: a swoosh entering the head from its upper middle, bending down and back along the tail's middle (a loop
  // in it read as a 'G'); ph shifts its bend (the travel frames)
  const dfSwirl = (ph) => smooth([[4 - ph, -1.8], [1, -2.6 + ph * 0.5], [-2, -1.4], [-5.6, 0.2 - ph * 0.3], [-10, 0.5], [-14, 0.6]]);
  function dfHead(m, ph, last) {
    const P = DF_HEAD.map((p) => apM(m, p)), d = line(P, true);
    let s = S(d, last ? 'ink300' : 'ink', 3) + F(d, last ? 'p300' : 'p50') + F(shadeBand(P, 1.8), 'p300') + S(line([apM(m, [6.4, -1.6]), apM(m, [2, 0.6])]), 'ink300', 0.8);
    if (!last) s += SW(txPath(dfSwirl(ph), m), [['ink', 2], ['ally', 1.1], ['allyG', 0.35]]);
    return s;
  }
  function dfTail(fr, len) {
    const k = len / 22, J = (i) => (jit(771 + fr, i) - 0.5) * 0.8, T = DF_TAIL.map(([x, y], i) => [-4.4 + (x + 4.4) * k + (i > 1 && i < 8 ? J(i) : 0), y + (i > 1 && i < 8 ? J(i + 10) * 0.5 : 0)]);
    const d = line(T, true);
    return S(d, 'ink', 2) + F(d, 'p300') + S(line([[-6.4, -0.6], [-6.4 - 12 * k, -0.2 + J(30) * 0.4]]), 'ink300', 0.8);
  }
  const dfChips = (fr) => [[-15.6 - fr, -4.6 + fr * 0.6, 1.3], [-20.6 + fr * 0.4, 3.4 - fr * 0.4, 1.1], [-23 + fr * 0.8, -2.2 - fr * 0.2, 0.9]].map(([x, y, r], i) => F(chipD(x, y, r, 781 + i + 3 * fr, 0.4 + i), 'p50', { st: 'ink', sw: 0.7 })).join('');
  ART.inkOrbit['deflect-start'] = (fr) => (fr === 0
    ? TX(F(tornD(0, 0, [[-176, 10.6], [-136, 7.4], [-96, 9.6], [-52, 6.8], [-14, 8.4], [30, 7], [76, 9.2], [122, 7.2], [158, 9.8]], 0.42, 785), 'p50', { st: 'ink', sw: 1 }), chainM(transM(-3, 0), scaleM(1, 0.56))) + dfHead(transM(0, 0), 0, false)
    : TX(F(tornD(0, 0, [[-170, 6.8], [-110, 5], [-50, 6.2], [10, 4.6], [70, 6], [130, 4.8]], 0.42, 786), 'p300', { st: 'ink300', sw: 0.8 }), chainM(transM(-8, 0), scaleM(1, 0.6))) + dfTail(0, 9) + dfHead(transM(0, 0), 0.4, false));
  ART.inkOrbit['deflect-travel'] = (fr) => dfTail(fr, 22) + dfChips(fr) + dfHead(transM(0, 0), fr ? 0.6 : 0, false);
  ART.inkOrbit['deflect-end'] = (fr) => {
    if (fr === 1) return [[-2, -3, 2, 0.2], [3.4, 2.6, 1.6, 1.4], [-8, 1.8, 1.4, 2.1], [6.6, -3.2, 1.2, 0.9]].map(([x, y, r, a], i) => F(chipD(x, y, r, 791 + i, a), 'p300', { st: 'ink300', sw: 0.7 })).join('') + Cir(8.4, 1.2, 0.8, 'ink700') + Cir(-12, -1.6, 0.7, 'ink300');
    // the head breaks in three, an ink splash at its front, a piece of the swirl
    let s = inkBurstAt(5.6, 0.2, 2.2, 792, [[-40, 1.6, 0.5, 1], [20, 1.3, 0.46, 0], [70, 1.4, 0.5, 0]], { flat: 0.8 });
    [[[1.6, -5.2], [6, -3.4], [8.6, 0.3], [3.2, -0.6]], [[3.2, -0.6], [8.6, 0.3], [4, 4.2], [-1.2, 5], [0.4, 0.8]], [[-3, -4.6], [1.6, -5.2], [3.2, -0.6], [0.4, 0.8], [-1.2, 5], [-4.8, 2.6], [-5.4, -1.6]]].forEach((P, i) => {
      const o = [[0.6, -0.7], [1, 0.8], [-1.4, 0]][i], Q = P.map(([x, y]) => [x + o[0], y + o[1]]);
      s += S(line(Q, true), 'ink', 2.6) + F(line(Q, true), i === 2 ? 'p50' : 'p300');
    });
    return s + SW(arc(2.2, -1.2, 2.2, -1.6, 0.2), [['ink', 2], ['ally', 1.1]]);
  };

  // -- meteorBrush haste: inside the star mark the hero's cooldowns run fast: two cyan speed strokes winding up from
  //    behind the feet (ink edge, cyan, an allyG run that climbs over the four frames) and two paper star motes rising (the
  //    mark's motes); painted y -33..-11 and behind the hero (+x = the way the hero faces; the renderer mirrors it with the
  //    hero): clear of the face zone and the foot ring --
  // two rising streaks of different length and bend, both sweeping up and back (curled back on themselves they read as
  // nested 'C's / crescent moons), not crossing
  // thin ribbons (a fat middle tapering both ways read as leaves): the width rises over the first 18 % and falls over the
  // last 30 %
  const HASTE = [{ P: [[-4.6, -12.6], [-10, -13.6], [-14.4, -16.4], [-17.2, -20.6], [-18.4, -25.4], [-20.6, -30.6]], w: [1.9, 1] }, { P: [[-12.6, -13.2], [-16.4, -14.8], [-19.6, -17.8], [-21.2, -21.6]], w: [1.5, 0.8] }];
  const ribbonW = (t) => clamp(Math.min(t / 0.18, (1 - t) / 0.3), 0, 1);
  ART.meteorBrush.haste = (fr) => {
    let s = '';
    HASTE.forEach(({ P, w }, i) => {
      const sway = [0, 0.5, 0.2, -0.4][(fr + i) % 4], pts = crPts(P.map(([x, y], j) => [x - sway * j * 0.25, y]), 6);
      s += F(brushD(pts, (t) => 0.5 + w[0] * ribbonW(t)), 'ink') + F(brushD(pts, (t) => 0.15 + w[1] * ribbonW(t)), 'ally');
      const a = (fr / 4 + i * 0.3) % 1;
      s += S(line(cutAlong(pts, 0.1 + 0.55 * a, 0.3 + 0.55 * a)), 'allyG', 0.6);
    });
    [[-14.2, -27.6, 1.8, 5, 0], [-8.4, -21.6, 1.5, 6, 1]].forEach(([x, y, r, n, i]) => {
      const rise = [0, 1.2, 2.4, 3.4][(fr + 2 * i) % 4];
      s += F(starD(x, y - rise, r * [1, 0.9, 1.08, 0.86][(fr + i) % 4], n, 801 + i * 4 + fr, -Math.PI / 2, 0.42), 'p50', { st: 'ink', sw: 0.5 });
    });
    return s;
  };

  // -- pinHail caltrop-snap: the first enemy to step on a caltrop snaps it: the dagger pins break and fly (a blade half
  //    with the cyan groove up to the left, the ring handle half up to the right), a flat torn paper flash on the ground,
  //    chips (0); higher, in p300, falling (1) --
  function pinHalf(m, len, top, cyan, last) {
    const pc = last ? 'p300' : 'p50', ln = last ? 'ink300' : 'ink', br = [[0.55 * len, -2.3], [0.5 * len, -0.8], [0.6 * len, 0.5], [0.55 * len, 2.3]];
    let b;
    if (!top) {
      b = F(line([[0, -1.4]].concat(br, [[0, 1.4]]), true), pc, { st: ln, sw: 1.1 }) + F(line([[0, 0.2], [0.6 * len, 0.5], [0.55 * len, 2.3], [0, 1.4]], true), 'p300');
      b += cyan && !last ? SW(`M${f(0.1 * len)},0 L${f(0.45 * len)},0`, [['ink', 1.1], ['ally', 0.6]]) : S(`M${f(0.1 * len)},0 L${f(0.45 * len)},0`, ln, 0.8);
    } else {
      b = F(line([br[0], [len, -0.7], [len, 0.7], br[3], br[2], br[1]], true), pc, { st: ln, sw: 1.1 }) + F(line([[0.6 * len, 0.5], [len, 0.2], [len, 0.7], [0.55 * len, 2.3]], true), 'p300');
      b += S(`M${f(len)},0 L${f(len + 0.7)},0`, ln, 1.4) + Cir(len + 2.5, 0, 1.7, 'none', { st: ln, sw: 1.2 });
    }
    return TX(b, m);
  }
  ART.pinHail['caltrop-snap'] = (fr) => {
    if (fr === 0) {
      return TX(F(tornD(0, 0, [[-172, 13.4], [-134, 9], [-96, 11.6], [-56, 8.4], [-18, 12.6], [22, 9.4], [60, 13], [104, 8.6], [144, 11]], 0.42, 811), 'p50', { st: 'ink', sw: 1.1 }), chainM(transM(0, -1.4), scaleM(1, 0.5))) +
        F(chipD(-4.2, -11.4, 1.2, 812, 0.3), 'ink') + F(chipD(11.6, -4.2, 1, 813, 1), 'ink') + Cir(-12.6, -2.6, 0.7, 'ink') + Cir(3.6, -13.6, 0.6, 'ink') +
        pinHalf(chainM(transM(-6.6, -6.6), rotM(-150)), 8.4, false, true, false) + pinHalf(chainM(transM(2.4, -2.4), rotM(-58)), 8.2, true, false, false);
    }
    return F(chipD(-6, 2.6, 1, 814, 0.6), 'ink300') + F(chipD(12.6, 4.4, 0.9, 815, 1.2), 'ink300') + Cir(-14, 5.4, 0.6, 'ink300') +
      pinHalf(chainM(transM(-10.2, -10.4), rotM(-196)), 8.4, false, false, true) + pinHalf(chainM(transM(3.2, -9.6), rotM(-14)), 8.2, true, false, true);
  };

  // -- bossbane crackBurst: the fifth crack bursts the boss's plate: a torn paper flash and the plate's shards flung out
  //    (paper, a p300 underside, ink cracks; the newest crack's cyan on the biggest shard) (0); further, over a small ink
  //    burst (1); the shards falling in p300 (2) --
  const CB_SHARDS = [[[-4.6, -3.4], [3.2, -4.4], [4.4, 1.2], [-1.2, 3.6], [-5, 0.8]], [[-3.4, -2.6], [3, -2.2], [2.4, 2.6], [-2.8, 2]], [[-3, -2], [2.6, -2.8], [3.2, 1.8], [-1.6, 2.4]], [[-2.6, -1.8], [2.4, -1.4], [1.6, 2], [-2.2, 1.6]]];
  const CB_AT = [[[-10.6, -17, -18, 1.5], [11.6, -18.6, 16, 1.5], [14.6, -6, 34, 1.4], [-12.6, -4, -40, 1.4]],
    [[-15.6, -18.8, -38, 1.35], [16.4, -19.6, 32, 1.35], [19.4, -6.4, 62, 1.3], [-18.4, -3.6, -66, 1.3]],
    [[-16.6, 3.6, -80, 1.2], [15.6, 5.4, 70, 1.2], [21, 9, 100, 1.1], [-20.4, 8.4, -100, 1.1]]];
  function cbShard(i, x, y, deg, k, last, cyan) {
    const m = chainM(transM(x, y), rotM(deg), scaleM(k)), P = CB_SHARDS[i].map((p) => apM(m, p)), d = line(P, true);
    let s = F(d, last ? 'p300' : 'p50', { st: last ? 'ink300' : 'ink', sw: 1.2 }) + F(shadeBand(P, 1.4 * k), 'p300');
    const a = apM(m, [-2.4, -1.6]), b = apM(m, [0.4, 0.2]), c = apM(m, [2.4, 1.6]);
    s += cyan ? SW(line([a, b, c]), [['ink', 2], ['ally', 1], ['allyG', 0.35]], { join: 'miter', miter: 4 }) : S(line([a, b]), last ? 'ink300' : 'ink', 0.9);
    return s;
  }
  ART.bossbane.crackBurst = (fr) => {
    let s = '';
    if (fr === 0) s += TX(F(tornD(0, 0, [[-172, 19], [-140, 12.4], [-108, 17], [-74, 11.4], [-40, 18.6], [-6, 13], [28, 19.4], [66, 12], [100, 16], [136, 11.6]], 0.42, 821), 'p50', { st: 'ink', sw: 1.4 }), chainM(transM(0, -9), scaleM(1, 0.72)));
    if (fr === 1) s += TX(F(tornD(0, 0, [[-160, 11], [-110, 8], [-60, 12], [-10, 8.6], [40, 11.4], [92, 7.8], [140, 10]], 0.42, 822), 'p300', { st: 'ink300', sw: 1 }), chainM(transM(0, -9), scaleM(1, 0.7))) +
      inkBurst(0, -8, 3.6, 823, { arms: 6, reach: [1.5, 2.4], flat: 0.8, drops: 0.6, col: 'ink700' });
    CB_AT[fr].forEach(([x, y, deg, k], i) => { s += cbShard(i, x, y, deg, k, fr === 2, i === 0 && fr < 2); });
    return s;
  };

  function stamp(group, part, o) {
    o = o || {};
    const P = partOf(group, part);
    const fr = clamp(Math.floor(o.frame || 0), 0, P.frames - 1);
    const c = Ctx();
    const body = ART[group][part](fr, c, P, o);
    return c.out(`<g transform="translate(${P.anchor[0]} ${P.anchor[1]})">${body}</g>`, group);
  }
  /** A stamp placed with its anchor on (x, y), turned by `a` rad. */
  function place(group, part, frame, x, y, a, o) {
    o = o || {};
    const P = partOf(group, part);
    return `<g transform="${tr(x, y, a ? a / RAD : 0)}${o.flip ? ' scale(-1 1)' : ''} translate(${-P.anchor[0]} ${-P.anchor[1]})"${op(o.a)}>${stamp(group, part, { frame })}</g>`;
  }

  // ==== 4. parametric geometry (shared by paths, layout and draw; the renderer ports these) ====
  /** Gap list [a0, a1] (rad, a1 > a0, may leave 0..2π) of a ring: n by J(10), centre 2π(k + J(20+k))/n, width by J(40+k). */
  function gapList(g, seed) {
    if (!g || !g.n[1]) return [];
    const n = Math.min(g.n[1], g.n[0] + Math.floor(jit(seed, 10) * (g.n[1] - g.n[0] + 1))), out = [];
    for (let k = 0; k < n; k++) {
      const c = TAU * (k + jit(seed, 20 + k)) / n, w = lerp(g.deg[0], g.deg[1], jit(seed, 40 + k)) * RAD;
      out.push([c - w / 2, c + w / 2]);
    }
    return out;
  }
  /** The arcs between gaps (clockwise), as [a0, a1] with a1 > a0; overlapping gaps merge; one full turn if none. */
  function arcsBetween(gaps) {
    if (!gaps.length) return [[-Math.PI / 2, -Math.PI / 2 + TAU]];
    const g = gaps.map((q) => q.slice()).sort((a, b) => a[0] - b[0]), m = [g[0]];
    for (let i = 1; i < g.length; i++) { const L = m[m.length - 1]; if (g[i][0] <= L[1]) L[1] = Math.max(L[1], g[i][1]); else m.push(g[i]); }
    const last = m[m.length - 1];
    if (m.length > 1 && last[1] - TAU >= m[0][0]) { m[0][0] = last[1] - TAU; m.pop(); }
    const arcs = [];
    for (let i = 0; i < m.length; i++) {
      const a0 = m[i][1], a1 = i + 1 < m.length ? m[i + 1][0] : m[0][0] + TAU;
      if (a1 - a0 > 1.5 * RAD) arcs.push([a0, a1]);
    }
    return arcs;
  }
  /** Core arc [c0, c1]: start 2π·J(60), span lerp(span, J(61)) deg (× coreScale awakened). */
  function coreArc(core, seed, aw) {
    if (!core) return null;
    const span = Math.min(360, lerp(core.span[0], core.span[1], jit(seed, 61)) * (aw ? SPEC.awakened.coreScale : 1)) * RAD;
    const c0 = TAU * jit(seed, 60);
    return [c0, c0 + span];
  }
  /** Parts of the interval [c0, c1] that lie on the arcs. */
  function clipToArcs(c, arcs) {
    if (!c) return [];
    const out = [];
    arcs.forEach(([a0, a1]) => {
      for (let k = -1; k <= 1; k++) { const s0 = Math.max(a0, c[0] + k * TAU), s1 = Math.min(a1, c[1] + k * TAU); if (s1 - s0 > 0.5 * RAD) out.push([s0, s1]); }
    });
    return out;
  }
  const deg2 = (iv) => iv.map(([a, b]) => [f(a / RAD), f(b / RAD)]);
  /** Radius after `grow` {from, seconds} at age (ease out), or R at once under reduced motion. */
  function grownR(R, grow, age, reduced) {
    if (!grow || reduced) return R;
    const u = clamp(age / grow.seconds, 0, 1);
    return R * (grow.from + (1 - grow.from) * easeOut(u));
  }
  /** Fade alpha: 1 until fade.at of life, then down to 0 (reduced motion also fades in over the grow time). */
  function fadeA(fade, age, life, grow, reduced) {
    let a = 1;
    const u = clamp(age / life, 0, 1);
    if (fade && u > fade.at) a = clamp((1 - u) / (1 - fade.at), 0, 1);
    if (reduced && grow) a *= clamp(age / grow.seconds, 0, 1);
    return a;
  }
  /** Band widths at the knots (J(1100+k)) and the cosine-blended width at θ. */
  function bandWidthFn(sp, seed, scale) {
    const K = sp.knots, wk = [];
    for (let k = 0; k < K; k++) wk.push(lerp(sp.width[0], sp.width[1], jit(seed, 1100 + k)) * (scale || 1));
    const fn = (th) => { const s = (((th % TAU) + TAU) % TAU) / TAU * K, k = Math.floor(s) % K, u = s - Math.floor(s), c = (1 - Math.cos(Math.PI * u)) / 2; return wk[k] + (wk[(k + 1) % K] - wk[k]) * c; };
    fn.knots = wk;
    return fn;
  }
  /** Band segments: [{a0, a1, closed, outer: pts, inner: pts}] at radius R. Fringe vertices replace a side's edge.
   *  Vertex counts come from the full radius o.R0 (so nothing crawls while the ring grows); widths do not scale. */
  function bandGeo(R, sp, seed, o) {
    o = o || {};
    const R0 = o.R0 || R, wf = bandWidthFn(sp, seed, o.widthScale), gaps = gapList(sp.gaps, seed), arcs = arcsBetween(gaps), closed = !gaps.length;
    const fr = sp.fringe, sides = o.fringeSides || (fr ? [fr.side] : []);
    const segs = arcs.map(([a0, a1]) => {
      const n = Math.max(6, Math.ceil((a1 - a0) * R0 / 5)), outer = [], inner = [];
      for (let i = 0; i <= (closed ? n - 1 : n); i++) {
        const th = lerp(a0, a1, i / n);
        let w = wf(th);
        if (sp.endTaper && !closed) { const d = Math.min(th - a0, a1 - th) / (sp.endTaper * RAD); if (d < 1) w *= 0.3 + 0.7 * Math.sin(Math.PI / 2 * d); }
        outer.push(polar(R + w / 2, th)); inner.push(polar(R - w / 2, th));
      }
      return { a0, a1, closed, outer, inner };
    });
    if (fr && sides.length) {
      // fringe: vertices every `pitch` along the edge, even ones pushed out by h (J(base+100+k)) unless J(base+k) < skip;
      // base 1300 for the inner side, 1500 for the outer
      segs.forEach((sg) => {
        sides.forEach((side) => {
          const base = side < 0 ? 1300 : 1500, rEdge = R0 + side * 6, n = Math.max(8, Math.round((sg.a1 - sg.a0) * rEdge / fr.pitch)), pts = [];
          for (let k = 0; k < (sg.closed ? n : n + 1); k++) {
            const th = lerp(sg.a0, sg.a1, k / n), w = wf(th);
            const h = k % 2 ? 0 : (jit(seed, base + k) < fr.skip ? 0 : lerp(fr.h[0], fr.h[1], jit(seed, base + 100 + k)));
            pts.push(polar(R + side * (w / 2 + h), th));
          }
          if (side < 0) sg.inner = pts; else sg.outer = pts;
          sg['fringe' + (side < 0 ? 'In' : 'Out')] = pts;
        });
      });
    }
    return { segs, gaps, arcs, wf };
  }
  /** A band's cyan core as drawn: the core arc (J(60), J(61)); a `dab` core is re-centred in the longest dab (the first
   *  of equals) and kept 2° inside its ends; a 360° core is the whole ring; otherwise only the parts on the band's arcs. */
  function bandCoreArcs(rs, B, seed, aw) {
    let c = coreArc(rs.core, seed, aw);
    if (rs.core.dab && B.arcs.length) {
      const dab = B.arcs.reduce((m, q) => (q[1] - q[0] > m[1] - m[0] + 1e-9 ? q : m), B.arcs[0]), span = Math.min(c[1] - c[0], dab[1] - dab[0] - 4 * RAD), mid = (dab[0] + dab[1]) / 2;
      c = [mid - span / 2, mid + span / 2];
    }
    return c[1] - c[0] >= TAU - 1e-3 ? [[c[0], c[0] + TAU]] : clipToArcs(c, B.arcs);
  }
  /** The ripple's cyan core on arc `arc`: centred in core.span, its length × coreScale when awakened, inside the arc. */
  function rippleCoreArc(rs, aw) {
    const A = rs.arcs[rs.core.arc], span = (rs.core.span[1] - rs.core.span[0]) * (aw ? SPEC.awakened.coreScale : 1), mid = (rs.core.span[0] + rs.core.span[1]) / 2;
    return [Math.max(A.span[0], mid - span / 2) * RAD, Math.min(A.span[1], mid + span / 2) * RAD];
  }
  /** Punch: the width factor of a ring's / line's layers at age (1 when there is no punch or it is over). */
  function punchM(pu, age, reduced) {
    if (!pu) return 1;
    const sc = reduced ? Math.min(pu.scale, pu.reducedMax) : pu.scale, v = 1 - clamp(age / pu.seconds, 0, 1);
    return 1 + (sc - 1) * v * v;
  }
  const thick = (layers, m) => (m === 1 ? layers : layers.map((l) => [l[0], l[1] * m].concat(l.slice(2))));
  /** Splash spikes of one event at full growth (§7.x): n = n0 + ⌊J(1700)·(n1 - n0 + 1)⌋, θk = 2π·J(1701) +
   *  (k + 0.5 + (J(1710+k) - 0.5)·2·jitter)·2π/n, base from·R0, tip lerp(to, J(1730+k))·R0, half width lerp(width,
   *  J(1740+k))/2, bend (J(1750+k) - 0.5)·0.5·half width, fork J(1760+k) < fork, drop J(1770+k) < p at tip +
   *  lerp(gap, J(1780+k)) of radius lerp(r, J(1790+k)), left out if its far end passes R0 - clear. */
  function splashGeo(sp, R0, seed, aw) {
    const SH = SPEC.splash.shape, N = aw && sp.awakenedN ? sp.awakenedN : sp.n, n = N[0] + Math.floor(jit(seed, 1700) * (N[1] - N[0] + 1)), a0 = TAU * jit(seed, 1701), out = [];
    for (let k = 0; k < n; k++) {
      const th = a0 + (k + 0.5 + (jit(seed, 1710 + k) - 0.5) * 2 * sp.jitter) * TAU / n, rb = sp.from * R0, rt = lerp(sp.to[0], sp.to[1], jit(seed, 1730 + k)) * R0;
      const h = lerp(sp.width[0], sp.width[1], jit(seed, 1740 + k)) / 2;
      let drop = null;
      if (jit(seed, 1770 + k) < sp.drop.p) {
        const gap = lerp(sp.drop.gap[0], sp.drop.gap[1], jit(seed, 1780 + k)), r = lerp(sp.drop.r[0], sp.drop.r[1], jit(seed, 1790 + k));
        if (rt + gap + SH.drop.stretch * r <= R0 - SH.drop.clear) drop = { c: rt + gap, r };
      }
      out.push({ k, th, rb, rt, L: rt - rb, h, bend: (jit(seed, 1750 + k) - 0.5) * SH.bend * h, fork: jit(seed, 1760 + k) < sp.fork, drop });
    }
    return out;
  }
  /** The spikes kept at a LOD: reduced = even k; minimal = none (minimal 0) or k = 0, ⌊n/3⌋, ⌊2n/3⌋. */
  function splashKeep(spikes, sp, lod) {
    if (lod === 'reduced') return spikes.filter((q) => q.k % 2 === 0);
    if (lod === 'minimal') { const n = spikes.length, keep = sp.minimal ? [0, Math.floor(n / 3), Math.floor(2 * n / 3)] : []; return spikes.filter((q) => keep.indexOf(q.k) >= 0); }
    return spikes;
  }
  /** A spike's outline at length share g, in event coordinates: a wedge (rb, -h) → (rb + 0.45L, -0.55h + bend) → tip →
   *  (rb + 0.45L, 0.55h + bend) → (rb, h); a forked spike ends in two prongs from (rb + 0.7L, bend/2) to polar
   *  (rb + L, θ + 7°) and (rb + 0.82L, θ - 7°). */
  function spikeOutline(q, g) {
    const SH = SPEC.splash.shape, L = q.L * g, x = (t) => q.rb + t * L, h = q.h, b = q.bend, c = Math.cos(q.th), s = Math.sin(q.th);
    const W = (p) => [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
    const s0 = SH.shoulder[0], s1 = SH.shoulder[1];
    if (!q.fork) return [[q.rb, -h], [x(s0), -s1 * h + b], [x(1), 0], [x(s0), s1 * h + b], [q.rb, h]].map(W);
    const fa = SH.fork.deg * RAD, rA = x(1), rB = x(SH.fork.short);
    return [[q.rb, -h], [x(s0), -s1 * h + b], [rB * Math.cos(fa), -rB * Math.sin(fa)], [x(SH.fork.at), b / 2], [rA * Math.cos(fa), rA * Math.sin(fa)], [x(s0), s1 * h + b], [q.rb, h]].map(W);
  }
  /** The tip points of a spike (one, or the two prongs of a fork) and its drop centre, at full length (paths). */
  function spikeTips(q) {
    const SH = SPEC.splash.shape, fa = SH.fork.deg * RAD;
    return q.fork ? [polar(q.rb + q.L, q.th + fa), polar(q.rb + SH.fork.short * q.L, q.th - fa)] : [polar(q.rt, q.th)];
  }
  /** Jag ring vertices (closed) and forks. seed = the flicker seed. */
  function jagGeo(R, sp, seed) {
    const n = Math.max(8, Math.round(TAU * R / sp.seg)), V = [];
    for (let k = 0; k < n; k++) {
      const a = (k + (jit(seed, k) - 0.5) * 0.5) * TAU / n, amp = lerp(sp.amp[0], sp.amp[1], jit(seed, 20 + k)), sg = jit(seed, 200 + k) < 0.5 ? -1 : 1;
      V.push(polar(R + sg * amp, a));
    }
    const forks = [];
    for (let fk = 0; fk < sp.forks.n; fk++) {
      const k = Math.floor(jit(seed, 500 + fk) * n) % n, P = V[k], a = Math.atan2(P[1], P[0]) + (jit(seed, 510 + fk) - 0.5) * 0.6;
      const len = lerp(sp.forks.len[0], sp.forks.len[1], jit(seed, 520 + fk)), kink = (jit(seed, 530 + fk) < 0.5 ? -1 : 1) * 0.5;
      const P1 = polar(len * 0.55, a, P[0], P[1]), P2 = polar(len * 0.45, a + kink, P1[0], P1[1]);
      forks.push([P, P1, P2]);
    }
    return { V, forks };
  }
  /** Crescent (cosine lune) between R and R - d·cos(π(θ - φ)/span) over φ ± span/2. */
  function crescentPts(R, d, phi, span, step) {
    const n = Math.max(4, Math.ceil(span / (step * RAD))), out = [], inn = [];
    for (let i = 0; i <= n; i++) {
      const th = phi - span / 2 + span * i / n, c = Math.cos(Math.PI * (th - phi) / span);
      out.push(polar(R, th)); inn.push(polar(R - d * c, th));
    }
    return out.concat(inn.reverse().slice(1, -1));
  }
  /** Comet along radius rm: head at θh moving clockwise, tail span behind; returns centre line and outline. */
  function cometGeo(rm, th, spanDeg, head) {
    const span = spanDeg * RAD, n = Math.max(8, Math.ceil(span / (4 * RAD))), C = [], L = [], Rr = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n, a = th - span * s, w = head * Math.pow(1 - s, 0.9) + 0.8 * s;
      C.push(polar(rm, a)); L.push(polar(rm + w / 2, a)); Rr.push(polar(rm - w / 2, a));
    }
    // a blunt rounded front: a half ellipse (half width head/2, reach 0.45·head) ahead of the head, clockwise
    const fwd = [-Math.sin(th), Math.cos(th)], out = [Math.cos(th), Math.sin(th)], H = polar(rm, th), capPts = [];
    for (let i = 1; i < 8; i++) { const b = Math.PI * i / 8; capPts.push([H[0] + out[0] * Math.cos(b) * head / 2 + fwd[0] * Math.sin(b) * head * 0.45, H[1] + out[1] * Math.cos(b) * head / 2 + fwd[1] * Math.sin(b) * head * 0.45]); }
    return { C, L, Rr, capPts };
  }

  /** Sag curves through points: segment i is a quadratic, control = midpoint + normal · (±sag · length), sign (-1)^i. */
  function sagCurves(pts, sag, step) {
    const out = [], ctrls = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, n = [-dy / L, dx / L], sg = i % 2 ? -1 : 1;
      const c = [(a[0] + b[0]) / 2 + n[0] * sg * sag * L, (a[1] + b[1]) / 2 + n[1] * sg * sag * L];
      ctrls.push(c);
      const m = Math.max(8, Math.round(L / step));
      for (let j = i ? 1 : 0; j <= m; j++) { const t = j / m, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
    }
    return { pts: out, ctrls };
  }
  /** Drops the part of a polyline within `clear` of its first point (the hero's foot ring). */
  function clearStart(pts, clear) {
    const P0 = pts[0];
    for (let i = 1; i < pts.length; i++) {
      const d1 = Math.hypot(pts[i][0] - P0[0], pts[i][1] - P0[1]);
      if (d1 >= clear) {
        const d0 = Math.hypot(pts[i - 1][0] - P0[0], pts[i - 1][1] - P0[1]), u = (clear - d0) / ((d1 - d0) || 1);
        return [[lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]].concat(pts.slice(i));
      }
    }
    return pts.slice(-1);
  }
  /** Twisted two strands per segment; strand kinkStrand is kinked every kinkEvery samples by ±kinkAmp (flicker seed). */
  function twistGeo(pts, sp, fseed) {
    const A = [], B = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, u = [dx / L, dy / L], n = [-u[1], u[0]];
      const m = Math.max(6, Math.round(L / sp.step));
      for (let j = i ? 1 : 0; j <= m; j++) {
        const t = j / m, base = [a[0] + dx * t, a[1] + dy * t], env = Math.sin(Math.PI * t), ph = TAU * t * L / sp.wave;
        let oa = sp.amp * Math.sin(ph) * env;
        const ob = sp.amp * Math.sin(ph + Math.PI) * env;
        if (j % sp.kinkEvery === 0 && j > 0 && j < m) oa += 2 * sp.kinkAmp * (jit(fseed, 1000 * i + j) - 0.5);
        A.push([base[0] + n[0] * oa, base[1] + n[1] * oa]); B.push([base[0] + n[0] * ob, base[1] + n[1] * ob]);
      }
    }
    return sp.kinkStrand === 0 ? { A, B } : { A: B, B: A };
  }
  /** Chain links along the points (after the clear zone): item k every pitch, rings (even) and bars (odd). */
  function linksGeo(pts, sp, clear) {
    const items = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      let a = pts[i];
      const b = pts[i + 1], dx = b[0] - pts[i][0], dy = b[1] - pts[i][1], L = Math.hypot(dx, dy) || 1, u = [dx / L, dy / L];
      let s0 = 0;
      if (i === 0) s0 = clear;
      const n = Math.max(1, Math.floor((L - s0) / sp.pitch));
      const start = s0 + ((L - s0) - n * sp.pitch) / 2 + sp.pitch / 2;
      const segItems = [];
      for (let k = 0; k < n; k++) { const s = start + k * sp.pitch; segItems.push({ x: a[0] + u[0] * s, y: a[1] + u[1] * s, angle: Math.atan2(u[1], u[0]), seg: i }); }
      segItems.forEach((it, k) => { it.type = k % 2 ? 'bar' : 'ring'; });
      const rings = segItems.filter((q) => q.type === 'ring');
      if (rings.length) rings[Math.floor(rings.length / 2)].core = true;
      items.push.apply(items, segItems);
    }
    items.forEach((it, k) => { if (k % SPEC.line.frostChainlet.nubs.every === SPEC.line.frostChainlet.nubs.every - 1) it.nub = k % 2 ? 1 : -1; });
    return items;
  }
  /** Ragged band edge: x from x0 to x1 every pitch, y = sideSign·(hw(x) + amp·±1) with J offsets. */
  function raggedEdge(x0, x1, hw, rg, seed, base, sign) {
    const n = Math.max(2, Math.ceil((x1 - x0) / rg.pitch)), out = [];
    for (let k = 0; k <= n; k++) {
      const x = lerp(x0, x1, k / n), amp = lerp(rg.amp[0], rg.amp[1], jit(seed, base + k)) * (jit(seed, base + 50 + k) < 0.5 ? -1 : 1);
      out.push([x, sign * Math.max(0.6, hw(x) + amp)]);
    }
    return out;
  }
  const taperRatio = (tp, t) => { for (let i = 1; i < tp.length; i++) if (t <= tp[i][0]) return lerp(tp[i - 1][1], tp[i][1], (t - tp[i - 1][0]) / (tp[i][0] - tp[i - 1][0])); return tp[tp.length - 1][1]; };

  // ==== 5. options, stats, layout, paths, lobPath ====
  function norm(o) {
    o = Object.assign({}, o || {});
    o.level = clamp(Math.round(o.level == null ? 3 : o.level), 1, 5);
    o.awakened = !!o.awakened;
    o.p = clamp(o.p == null ? 0.35 : +o.p, 0, 1);
    o.t = o.t == null ? 0.2 : +o.t;
    o.seed = o.seed == null ? 1 : Math.floor(+o.seed) || 0;
    o.lod = o.lod === 'reduced' || o.lod === 'minimal' ? o.lod : 'full';
    o.reduced = !!o.reduced;
    o.ch = clamp(Math.round(o.ch || 1), 1, 5);
    return o;
  }
  /** A weapon's numbers at opts.level (arsenalStats): counts round down, awakening adds one and reaches 1.2 x. */
  function stats(id, o) {
    const g = META[id].geo, lv = o.level == null ? 3 : o.level, aw = !!o.awakened;
    const at = (q) => (q ? q[0] + q[1] * (lv - 1) : 0);
    return {
      count: Math.floor(at(g.count || [1, 0])) + (aw ? 1 : 0),
      jumps: Math.floor(at(g.jumps || [0, 0])) + (aw ? 1 : 0),
      radius: o.radius != null ? +o.radius : at(g.radius) * (aw ? SPEC.awakened.reach : 1),
      inner: o.inner != null ? +o.inner : (g.inner || 0),
      length: o.length != null ? +o.length : at(g.length) * (aw ? SPEC.awakened.reach : 1),
      width: o.width != null ? +o.width : (g.width || 0) * (aw ? SPEC.awakened.reach : 1)
    };
  }
  const lifeOf = (id) => SPEC.life[id].mark;
  const ptsOf = (o) => (o.points || []).map((p) => (Array.isArray(p) ? [p[0], p[1]] : [p.x, p.y]));
  /** Reference chain points: x chainStep[0] apart, y ±chainStep[1]·(0.6 + 0.4·J(990+k)) alternating. */
  function chainPts(id, o) {
    if (o.points && o.points.length > 1) return ptsOf(o);
    const n = stats(id, o).jumps + 1, st = SPEC.reference.chainStep, out = [[0, 0]];
    for (let k = 1; k <= n; k++) out.push([st[0] * k, (k % 2 ? -1 : 1) * st[1] * (0.6 + 0.4 * jit(o.seed, 990 + k))]);
    return out;
  }
  /** Comet / crescent angle at age: start 2π·J(700) plus sweep·age/life (none under reduced motion). */
  const sweepAngle = (seed, sweepDeg, age, life, reduced) => TAU * jit(seed, 700) + (reduced ? 0 : sweepDeg * RAD * clamp(age / life, 0, 1));
  /** Where the wide brush's / cross stroke's head is at age (grows over grow.frac of life). */
  function bandHead(sp, L, age, life) { return SPEC.footClear + (L - SPEC.footClear) * easeOut(clamp(age / (sp.grow.frac * life), 0, 1)); }

  /** The radius of a stage: opts.radius; a zone's r, or area × the weapon's radius; a gimmick's r; else the weapon's. */
  function stageR(id, stage, o) {
    if (o.radius != null) return +o.radius;
    const z = SPEC.zone[id], g = SPEC.gimmick[id];
    if (z && z.stage === stage) return z.area ? z.area * stats(id, o).radius : z.r;
    if (g && g.stage === stage && g.r) return g.r;
    return stats(id, o).radius;
  }
  /** The three corners of the triangle seal: opts.points (the three sealed enemies) or a reference triangle. */
  const triPts = (o) => { const P = ptsOf(o); return P.length >= 3 ? P.slice(0, 3) : [[-110, 40], [104, 56], [-6, -92]]; };
  /** Stamp placement of a gimmick stage (SPEC.layout[id][stage], delivery 3a). Prims: center (pick), disc (§1.6: 40
   *  candidates at 2π·J(k), (R - margin)·√J(k + 40), refused within minGap·R by hypot(dx, 1.3 dy); n = clamp(round(R /
   *  per), min, max); variant J(k + 80), flip J(k + 120) < 0.5, phase J(k + 160); the first `info` are prio 0), ring
   *  (as layout's, but +x stays outward), corner and centroid (the triangle), tip (the unroll head), tail (eclipse). */
  function glayout(id, stage, o) {
    const L = SPEC.layout[id] && SPEC.layout[id][stage];
    if (!L) return [];
    const R = stageR(id, stage, o), seed = o.seed, out = [];
    L.forEach((q) => {
      const parts = q.parts;
      if (q.prim === 'center') {
        const part = q.pick ? parts[Math.min(parts.length - 1, Math.floor(jit(seed, q.pick) * parts.length))] : parts[0];
        out.push({ prim: 'center', part, x: 0, y: 0, angle: 0, flip: false, phase: 0, prio: 0, z: q.z });
      } else if (q.prim === 'disc') {
        const n = clamp(Math.round(R / q.per), q.min, q.max), mg = q.margin || 0, got = [];
        for (let k = 0; k < 40 && got.length < n; k++) {
          const a = TAU * jit(seed, k), d = Math.max(0, R - mg) * Math.sqrt(jit(seed, k + 40)), x = Math.cos(a) * d, y = Math.sin(a) * d;
          if (got.some((g) => Math.hypot(g.x - x, 1.3 * (g.y - y)) < (q.minGap || 0) * R)) continue;
          got.push({ x, y, k });
        }
        got.forEach((g, i) => out.push({ prim: 'disc', part: parts[Math.min(parts.length - 1, Math.floor(jit(seed, g.k + 80) * parts.length))], x: g.x, y: g.y, angle: 0, flip: jit(seed, g.k + 120) < 0.5, phase: jit(seed, g.k + 160), prio: i < (q.info == null ? 99 : q.info) ? 0 : 2, z: q.z, margin: mg }));
      } else if (q.prim === 'ring') {
        const n = q.count[0] + Math.floor(jit(seed, 900) * (q.count[1] - q.count[0] + 1));
        let placed = 0;
        for (let k = 0; k < n; k++) {
          if (jit(seed, k + 100) < (q.skip || 0)) continue;
          const a = -Math.PI / 2 + (k + 0.5 + (jit(seed, k) - 0.5) * 2 * (q.jitter || 0)) * TAU / n, dr = q.dr || 0, rr = R + dr;
          out.push({ prim: 'ring', part: parts[Math.min(parts.length - 1, Math.floor(jit(seed, k + 200) * parts.length))], x: Math.cos(a) * rr, y: Math.sin(a) * rr, angle: a, flip: false, phase: jit(seed, k + 400), prio: placed < (q.info == null ? 99 : q.info) ? 0 : 2, z: q.z, dr });
          placed++;
        }
      } else if (q.prim === 'corner') {
        triPts(o).forEach((p, i) => out.push({ prim: 'corner', part: parts[0], x: p[0], y: p[1], angle: 0, flip: false, phase: 0, prio: 0, z: q.z, index: i }));
      } else if (q.prim === 'centroid') {
        const P = triPts(o);
        out.push({ prim: 'centroid', part: parts[0], x: (P[0][0] + P[1][0] + P[2][0]) / 3, y: (P[0][1] + P[1][1] + P[2][1]) / 3, angle: 0, flip: false, phase: 0, prio: 0, z: q.z });
      } else if (q.prim === 'tip') {
        const g = SPEC.gimmick[id], Lb = o.length != null ? +o.length : g.length, age = clamp(o.p, 0, 1) * g.life;
        out.push({ prim: 'tip', part: parts[0], x: o.reduced ? Lb : Lb * easeOut(clamp(age / g.grow, 0, 1)), y: 0, angle: 0, flip: false, phase: 0, prio: 0, z: q.z });
      } else if (q.prim === 'tail') {
        const h = SPEC.halo[id], life = lifeOf(id), age = o.p * life, span = h.crescent.span * RAD;
        const phi = sweepAngle(seed, h.crescent.sweep, age, life, o.reduced), th = phi - span / 2;
        out.push({ prim: 'tail', part: parts[Math.floor(jit(seed, q.pick) * parts.length) % parts.length], x: Math.cos(th) * R, y: Math.sin(th) * R, angle: th + Math.PI / 2, flip: false, phase: jit(seed, 410), prio: 0, z: q.z });
      }
    });
    const zo = SPEC.zorder.concat(['stand']);
    return out.map((it, i) => [it, i]).sort((a, b) => (zo.indexOf(a[0].z) - zo.indexOf(b[0].z)) || (a[1] - b[1])).map((q) => q[0]);
  }

  function layout(id, stage, opts) {
    if (isGimmick(id, stage)) return glayout(id, stage, norm(opts));
    const L = SPEC.layout[id] && SPEC.layout[id][stage];
    if (!L) return [];
    const o = norm(opts), st = stats(id, o), R = st.radius, seed = o.seed, life = lifeOf(id), age = o.p * life, out = [];
    L.forEach((q) => {
      const parts = o.awakened && q.awakened ? q.awakened : q.parts;
      if (q.prim === 'center' || q.prim === 'head') {
        let part = parts[0];
        if (q.by === 'radius') part = parts[R < q.steps[0] ? 0 : R < q.steps[1] ? 1 : 2];
        else if (q.pick) part = parts[Math.min(parts.length - 1, Math.floor(jit(seed, q.pick) * parts.length))];
        out.push({ prim: q.prim, part, x: 0, y: q.prim === 'head' ? SPEC.headY : 0, angle: 0, flip: q.flip ? jit(seed, q.flip) < 0.5 : false, phase: 0, prio: 0, z: q.z });
      } else if (q.prim === 'ring') {
        const cnt = o.awakened && q.awakenedCount ? q.awakenedCount : q.count;
        const n = cnt[0] + Math.floor(jit(seed, 900) * (cnt[1] - cnt[0] + 1));
        let placed = 0;
        for (let k = 0; k < n; k++) {
          if (jit(seed, k + 100) < (q.skip || 0)) continue;
          const a = -Math.PI / 2 + (k + 0.5 + (jit(seed, k) - 0.5) * 2 * (q.jitter || 0)) * TAU / n;
          const dr = (q.dr || 0) * (q.inout && jit(seed, k + 300) < 0.5 ? -1 : 1), rr = R + dr;
          const part = parts[Math.min(parts.length - 1, Math.floor(jit(seed, k + 200) * parts.length))];
          out.push({ prim: 'ring', part, x: Math.cos(a) * rr, y: Math.sin(a) * rr, angle: dr < 0 ? a + Math.PI : a, flip: false, phase: jit(seed, k + 400), prio: placed < (q.info == null ? 99 : q.info) ? 0 : 2, z: q.z, dr });
          placed++;
        }
      } else if (q.prim === 'point') {
        const pts = chainPts(id, o);
        pts.slice(1).forEach((p, i) => {
          let part = parts[0];
          if (q.by === 'r') { const r = (o.points && o.points[i + 1] && o.points[i + 1].r) || 19; part = parts[r <= 15.5 ? 0 : r <= 23.5 ? 1 : 2]; }
          else if (q.pick) part = parts[jit(seed, q.pick + i) < q.big ? 1 : 0];
          out.push({ prim: 'point', part, x: p[0], y: p[1], angle: 0, flip: !!q.pick && jit(seed, q.pick + 50 + i) < 0.5, phase: 0, prio: 0, z: q.z, index: i + 1 });
        });
      } else if (q.prim === 'tip') {
        const sp = SPEC.line[id], x = sp.grow ? bandHead(sp, st.length, age, life) : st.length;
        const part = q.pick ? parts[Math.floor(jit(seed, q.pick) * parts.length) % parts.length] : parts[0];
        out.push({ prim: 'tip', part, x, y: 0, angle: 0, flip: false, phase: 0, prio: 0, z: q.z });
      } else if (q.prim === 'line') {
        const n = q.count[0] + Math.floor(jit(seed, 900) * (q.count[1] - q.count[0] + 1)), x0 = SPEC.footClear, Ln = st.length - x0;
        for (let j = 0; j < n; j++) {
          const s = x0 + Ln * (j + 0.5 + (jit(seed, j) - 0.5) * 0.6) / n, y = (2 * jit(seed, j + 50) - 1) * q.offset * st.width;
          out.push({ prim: 'line', part: parts[jit(seed, j + 60) < 0.5 ? 0 : 1], x: s, y, angle: 0, flip: y < 0, phase: 0, prio: 2, z: q.z });
        }
      } else if (q.prim === 'tail') {
        const h = SPEC.halo[id], span = (o.awakened && h.awakened ? h.awakened.span : h.crescent.span) * RAD;
        const phi = sweepAngle(seed, h.crescent.sweep, age, life, o.reduced), th = phi - span / 2;
        out.push({ prim: 'tail', part: parts[Math.floor(jit(seed, q.pick) * parts.length) % parts.length], x: Math.cos(th) * R, y: Math.sin(th) * R, angle: th + Math.PI / 2, flip: false, phase: jit(seed, 410), prio: 0, z: q.z });
      }
    });
    const zo = SPEC.zorder;
    return out.map((it, i) => [it, i]).sort((a, b) => (zo.indexOf(a[0].z) - zo.indexOf(b[0].z)) || (a[1] - b[1])).map((q) => q[0]);
  }

  /** Vertices of the stage's parametric shapes (C9 vectors; compact: defining points, see API §8). */
  /** The gimmick stages' defining points (C9): spin arcs [start°, end°], the unroll's ridge and head, the triangle's
   *  corners and centroid, the eighth seal's stitch starts (the seven seals). */
  function gpaths(id, stage, o) {
    const out = {};
    if (stage === 'spin') { const Z = SPEC.zone[id], age = clamp(o.p, 0, 1) * Z.life, th0 = TAU * jit(o.seed, Z.arcs.start) + (o.reduced ? 0 : TAU * Z.arcs.turns * age); out.arcs = []; for (let k = 0; k < Z.arcs.n; k++) { const a0 = th0 + k * TAU / Z.arcs.n; out.arcs.push([f((a0 / RAD) % 360), f((a0 / RAD + Z.arcs.span) % 360)]); } }
    if (stage === 'unroll') { const g = SPEC.gimmick[id], Lb = o.length != null ? +o.length : g.length, w = o.width != null ? +o.width : g.width; out.ridge = ridgePts(Lb, w, g.band.ridge).slice(0, 12); out.head = [[glayout(id, stage, o)[0].x, 0]]; }
    if (stage === 'triangle') { const P = triPts(o); out.corners = P; out.centroid = [[(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3]]; }
    if (stage === 'eighth') out.stitch = eventPositions(id, 7, o).map((q) => [q.x, q.y]);
    // 3b2: the follow-up effects' defining points (event rings: gaps and core [start°, end°], band knots [θ°, width], the
    // torn band's inner edge, jag vertices; crack lines; the kink; the rewound sag's controls; the amplified strands;
    // links; branch tips; the re-sweep's edge and head; the split's landing points and mini path)
    const g = SPEC.gimmick[id] && SPEC.gimmick[id].stage === stage ? SPEC.gimmick[id] : null;
    if (g && g.ring && typeof g.ring === 'object') {
      const rs = g.ring, R = stage === 'echo' ? stats(id, o).radius * g.reach : g.r, gaps = gapList(rs.gaps, o.seed);
      out.gaps = deg2(gaps);
      if (rs.prim === 'band') { const B = bandGeo(R, rs, o.seed); out.knots = B.wf.knots.map((w, k) => [k * 360 / B.wf.knots.length, w]); out.core = deg2(bandCoreArcs(rs, B, o.seed, false)); }
      else if (rs.core) out.core = deg2(clipToArcs(coreArc(rs.core, o.seed, false), arcsBetween(gaps)));
      if (rs.prim === 'torn') out.torn = tornRing(R, rs, o.seed, R)[0].rest.slice(2, 14);
      if (rs.prim === 'jag') out.jag = jagGeo(R, rs, rs.flicker.seeds[0]).V.slice(0, 12);
    }
    if (stage === 'crack') { const C = crackLines(g.r, g.cracks, o.seed); out.cracks = [].concat.apply([], C.slice(0, 3).map((q) => q.pts)); out.fork = C.filter((q) => q.fork)[0].fork; out.coreLines = C.filter((q) => q.core).map((q) => [q.k, C.length]); }
    if (stage === 'leap') { const Q = ptsOf(o), A0 = Q.length > 1 ? Q[0] : [-92, 26], B0 = Q.length > 1 ? Q[1] : [84, -14]; out.kink = kinkPts([A0[0], A0[1] - g.lift], [B0[0], B0[1] - g.lift], g.line, o.seed * 13 + g.line.flicker.seeds[0]); }
    if (stage === 'rewind') { const P = chainPts(id, o), q = sagCurves(P, g.line.sag, g.line.step); out.controls = q.ctrls; out.end = [clearStart(q.pts, SPEC.footClear)[0]]; }
    if (stage === 'amplify') { const P = chainPts(id, o), ls = SPEC.line[id]; out.scale = P.slice(1).map((p, i) => [1 + g.width * i, 1 + g.amp * i]); out.strandA = twistGeo([P[1], P[2]], Object.assign({}, ls, { amp: ls.amp * (1 + g.amp) }), ls.flicker.seeds[0] + 31).A.slice(0, 12); }
    if (stage === 'link') { const P = o.points && o.points.length > 1 ? ptsOf(o) : chainPts(id, o).slice(1); out.links = linksGeo(P, Object.assign({}, SPEC.line[id], { pitch: g.line.pitch }), g.line.clear).slice(0, 12).map((it) => [it.x, it.y]); }
    if (stage === 'branch') { const L = stats(id, o).length; out.tips = [-1, 1].map((sg) => [L + Math.cos(sg * g.angle * RAD) * g.branch * L, Math.sin(sg * g.angle * RAD) * g.branch * L]); }
    if (stage === 'resweep') {
      const ls = SPEC.line[id], st = stats(id, o), life = lifeOf(id), x0 = SPEC.footClear;
      out.top = raggedEdge(x0, st.length, () => st.width, ls.edge.ragged, o.seed + g.seed, 100, -1).slice(0, 12);
      out.head = [[st.length - (st.length - x0) * easeOut(clamp(o.p * life / (ls.grow.frac * life), 0, 1)), 0]];
    }
    if (stage === 'split') { out.land = [[-g.offset, 0], [g.offset, 0]]; out.mini = [0.25, 0.5, 0.75].map((t) => { const L = lobPath(id, { x0: 0, y0: 0, x1: g.offset, y1: 0, t, mini: true }); return [L.x, L.y - L.h]; }); }
    Object.keys(out).forEach((k) => { out[k] = out[k].map((p) => [f(p[0]), f(p[1])]); });
    return out;
  }
  /** The unroll's mountain ridge: two humps of amp × w over the band, its base at base × w below the axis. */
  const ridgePts = (Lb, w, rg) => samp((t) => { const x = lerp(0.06 * Lb, 0.96 * Lb, t); return [x, rg.base * w - rg.amp * w * Math.abs(Math.sin(Math.PI * rg.humps * (x - 0.06 * Lb) / (0.9 * Lb)))]; }, 24);
  function paths(id, stage, opts) {
    if (!META[id] || META[id].stages.indexOf(stage) < 0) return {};
    if (isGimmick(id, stage)) return gpaths(id, stage, norm(opts));
    const o = norm(opts), st = stats(id, o), R = st.radius, seed = o.seed, life = lifeOf(id), age = o.p * life, out = {};
    const rs = SPEC.ring[id], ls = SPEC.line[id], hs = SPEC.halo[id], aw = o.awakened;
    if (rs) {
      if (rs.prim === 'stroke') { const g = gapList(rs.gaps, seed); out.gaps = deg2(g); if (rs.core) out.core = deg2([coreArc(rs.core, seed, aw)]); }
      if (rs.prim === 'band') {
        const B = bandGeo(R, rs, seed, { widthScale: aw && rs.awakened ? rs.awakened.widthScale : 1, fringeSides: aw && rs.awakened && rs.awakened.fringeSides });
        out.knots = B.wf.knots.map((w, k) => [f(k * 360 / B.wf.knots.length), f(w)]);
        if (B.gaps.length) out.gaps = deg2(B.gaps);
        if (rs.core) out.core = deg2(bandCoreArcs(rs, B, seed, aw));
        const fr = B.segs[0] && (B.segs[0].fringeIn || B.segs[0].fringeOut);
        if (fr) out.fringe = fr.slice(0, 12);
      }
      if (rs.prim === 'jag') { const fs = rs.flicker.seeds[o.reduced ? 0 : Math.floor(o.t * rs.flicker.fps) % 2], g = jagGeo(R, rs, fs); out.jag = g.V; out.forks = [].concat.apply([], g.forks); }
      if (rs.prim === 'multi') {
        const rings = rs.rings.concat(aw && rs.awakened ? [rs.awakened.ring] : []);
        out.rings = rings.map((q) => { const a2 = age - q.delay; return a2 < 0 ? [0, 0] : [f(grownR(R * q.final, rs.grow, a2, o.reduced)), f(q.alpha * fadeA(rs.fade, age, life))]; });
      }
      if (rs.prim === 'ripple') out.core = deg2([rippleCoreArc(rs, aw)]);
    }
    const sp = SPEC.splash[id], tl = SPEC.tilt[id];
    if (sp) {
      const spikes = splashKeep(splashGeo(sp, R, seed, aw), sp, o.lod);
      out.splash = [].concat.apply([], spikes.map(spikeTips));
      out.drops = o.lod === 'full' ? spikes.filter((q) => q.drop).map((q) => polar(q.drop.c, q.th)) : [];
    }
    if (tl) { const sg = jit(seed, tl.sign) < 0.5 ? -1 : 1; out.tilt = tl.deg.map((d, i) => [i, sg * d]); }
    if (ls) {
      const L = st.length, w = st.width;
      if (ls.prim === 'sag') { const P = chainPts(id, o), g = sagCurves(P, ls.sag, ls.step); out.controls = g.ctrls; out.start = [clearStart(g.pts, SPEC.footClear)[0]]; }
      if (ls.prim === 'twist') { const P = chainPts(id, o), fs = ls.flicker.seeds[o.reduced ? 0 : Math.floor(o.t * ls.flicker.fps) % 2], g = twistGeo(P, ls, fs); out.strandA = g.A.slice(0, 12); out.strandB = g.B.slice(0, 12); }
      if (ls.prim === 'links') { const P = chainPts(id, o); out.links = linksGeo(P, ls, SPEC.footClear).slice(0, 12).map((it) => [it.x, it.y]); }
      if (ls.prim === 'blade') { const g = bladeGeo(ls, L, age, life, aw); out.tip = [[g.tip, 0]]; out.head = g.head; }
      if (ls.prim === 'brushBand') {
        const x1 = bandHead(ls, L, age, life), hw = (x) => (ls.taper ? w * taperRatio(ls.taper, (x - SPEC.footClear) / (L - SPEC.footClear)) : w);
        out.top = raggedEdge(SPEC.footClear, x1, hw, ls.edge.ragged, seed, 100, -1).slice(0, 12);
        out.bottom = raggedEdge(SPEC.footClear, x1, hw, ls.edge.ragged, seed, 200, 1).slice(0, 12);
        if (ls.streaks) out.streaks = streakList(ls, x1, w, seed).map((q) => [[q.x0, q.y], [q.x1, q.y]]).reduce((a, b) => a.concat(b), []);
      }
      if (ls.prim === 'string') { const n = aw ? ls.awakened.after : ls.after.n, k = 1 - clamp(age / ls.after.seconds, 0, 1); out.after = []; for (let j = 0; j < n; j++) out.after.push([f((SPEC.footClear + L) / 2), f(2 * ls.after.bow * ls.after.sign[j] * k)]); }
    }
    if (hs) {
      const span = (aw && hs.awakened && hs.awakened.span) || (hs.crescent ? hs.crescent.span : hs.comet ? hs.comet.span : 0);
      if (hs.comet) { const th = sweepAngle(seed, hs.comet.sweep, age, life, o.reduced), g = cometGeo((st.inner + R) / 2, th, span, lerp(hs.comet.head[0], hs.comet.head[1], jit(seed, 710))); out.comet = g.C.filter((q, i) => i % 3 === 0); out.gaps = deg2(gapList(hs.outer.gaps, seed)); }
      if (hs.rope) { const g = ropeGeo(R, hs, seed, aw); out.twist = g.marks.slice(0, 6).reduce((a, m) => a.concat(m), []); out.stitch = deg2([g.core]); }
      if (hs.crescent) { const phi = sweepAngle(seed, hs.crescent.sweep, age, life, o.reduced), d = hs.crescent.thick * (R - st.inner); out.crescent = crescentPts(R, d, phi, span * RAD, 10); }
    }
    Object.keys(out).forEach((k) => { out[k] = out[k].map((p) => [f(p[0]), f(p[1])]); });
    return out;
  }
  /** Lob path (§1.6): ground lerp, h = 4H·t(1-t) with H = clamp(k·d, min, max), shadow rx lerp, ry 0.42 rx. q.mini
   *  (cluster pots only, the split's mini pots): H = SPEC.lobMini.h and the lobMini shadow size, the same alpha. */
  function lobPath(id, q) {
    const L = SPEC.lob[id];
    if (!L) return null;
    const mini = !!q.mini && id === 'clusterPots', LM = SPEC.lobMini;
    const x0 = +q.x0 || 0, y0 = +q.y0 || 0, x1 = +q.x1 || 0, y1 = +q.y1 || 0, t = clamp(+q.t || 0, 0, 1);
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy), H = mini ? LM.h : clamp(L.H[0] * d, L.H[1], L.H[2]);
    const rx = mini ? lerp(LM.shadow.rx[0], LM.shadow.rx[1], t) : lerp(L.shadow.rx[0], L.shadow.rx[1], t);
    return { x: x0 + dx * t, y: y0 + dy * t, h: 4 * H * t * (1 - t), angle: Math.atan2(dy - 4 * H * (1 - 2 * t), dx), shadow: { rx, ry: 0.42 * rx, alpha: lerp(L.shadow.alpha[0], L.shadow.alpha[1], t) } };
  }

  // ---- line / halo geometry used by paths and draw ----
  function bladeGeo(ls, L, age, life, aw) {
    const u = clamp(age / life, 0, 1), th = ls.thrust, rt = ls.retract, hs = aw ? ls.awakened.headScale : 1;
    let tip = u < th ? lerp(SPEC.footClear + 8, L, easeOut(u / th)) : L, a = 1;
    if (u > rt.at) { const v = (u - rt.at) / (1 - rt.at); tip = lerp(L, rt.to * L, v); a = 1 - v; }
    const hl = ls.head.len * hs, hh = ls.head.half * hs, xb = tip - hl;
    // leaf head: shoulders at 35 % of its length, concave flanks to the point (never a triangle)
    const head = [[xb, -1.6], [xb + hl * 0.18, -hh * 0.85], [xb + hl * 0.35, -hh], [xb + hl * 0.62, -hh * 0.62], [xb + hl * 0.86, -hh * 0.22], [tip, 0],
      [xb + hl * 0.86, hh * 0.22], [xb + hl * 0.62, hh * 0.62], [xb + hl * 0.35, hh], [xb + hl * 0.18, hh * 0.85], [xb, 1.6]];
    return { tip, xb, head, a };
  }
  function streakList(ls, x1, w, seed) {
    const n = ls.streaks.n[0] + Math.floor(jit(seed, 300) * (ls.streaks.n[1] - ls.streaks.n[0] + 1)), span = x1 - SPEC.footClear, out = [];
    for (let j = 0; j < n; j++) {
      const len = lerp(ls.streaks.len[0], ls.streaks.len[1], jit(seed, 320 + j)) * span, x0 = SPEC.footClear + jit(seed, 330 + j) * (span - len);
      out.push({ x0, x1: x0 + len, y: (2 * jit(seed, 310 + j) - 1) * 0.7 * w });
    }
    return out;
  }
  function ropeGeo(R, hs, seed, aw) {
    const w = aw && hs.awakened ? hs.awakened.width : hs.rope.width, tw = hs.rope.twist, marks = [];
    let s = TAU * jit(seed, 800) * R;
    const end = s + TAU * R - tw.pitch[0];
    for (let k = 0; s < end && k < 400; k++) {
      const th = s / R, dt = Math.tan(tw.angle * RAD) * w / 2 / R;
      marks.push([polar(R - w / 2, th - dt), polar(R + w / 2, th + dt)]);
      s += lerp(tw.pitch[0], tw.pitch[1], jit(seed, 810 + k));
    }
    const c0 = TAU * jit(seed, 820);
    return { w, marks, core: [c0, c0 + hs.core.span * RAD * (aw ? SPEC.awakened.coreScale : 1)] };
  }

  // ==== 6. draw (reference composition: same rules the renderer runs) ====
  const minimal = (o) => o.lod === 'minimal';
  /** Frame of a placed stamp: prog by its own seconds (or the data window), loop by fps and phase, idx 0. */
  function frameFor(P, o, age, life, phase) {
    if (P.drive === 'prog') return clamp(Math.floor((P.seconds ? age / P.seconds : age / life) * P.frames), 0, P.frames - 1);
    if (P.drive === 'loop') {
      if (o.reduced || minimal(o)) return phase != null ? Math.min(P.frames - 1, Math.floor(phase * P.frames)) : P.still;
      const fps = o.lod === 'reduced' ? P.fps / 2 : P.fps;
      return ((Math.floor(o.t * fps + (phase || 0) * P.frames) % P.frames) + P.frames) % P.frames;
    }
    return 0;
  }
  const decalAlpha = (id, age) => { const Ld = SPEC.life[id].decal || 1, fa = SPEC.decal.fadeAt; return age <= fa * Ld ? 1 : clamp(1 - (age - fa * Ld) / ((1 - fa) * Ld), 0, 1); };
  /** Draws layout items of one z group (one event at the origin). minimal: no deco parts and no prio-2 items;
   *  reduced: every other deco item (layout order) is dropped. */
  function putItems(id, items, o, age, life, z) {
    let s = '', deco = 0;
    const tl = SPEC.tilt[id];
    items.filter((it) => it.z === z).forEach((it) => {
      const P = partOf(id, it.part);
      if (minimal(o) && (P.lod === 'deco' || it.prio === 2)) return;
      if (P.lod === 'deco' || it.prio === 2) { deco++; if (o.lod === 'reduced' && deco % 2 === 0) return; }
      const fr = frameFor(P, o, age, life, it.phase);
      const a = P.window === 'decal' ? decalAlpha(id, age) : 1;
      if (a <= 0.01) return;
      let ang = P.rotate === 'none' ? 0 : it.angle;
      // tilt (SPEC.tilt): turned about the anchor by deg[frame], to the side J(sign) of the event's seed
      if (tl && tl.parts.indexOf(it.part) >= 0) ang += (jit(o.seed, tl.sign) < 0.5 ? -1 : 1) * tl.deg[fr] * RAD;
      s += place(id, it.part, fr, it.x, it.y, ang, { flip: it.flip, a });
    });
    return s;
  }

  // -- rings --
  function drawRing(id, R0, seed, age, o) {
    const rs = SPEC.ring[id], life = lifeOf(id), aw = o.awakened;
    const R = grownR(R0, rs.grow, age, o.reduced), A = fadeA(rs.fade, age, life, rs.grow, o.reduced);
    if (A <= 0.01) return '';
    let s = '';
    const dashMode = rs.fade && rs.fade.dash && clamp(age / life, 0, 1) > rs.fade.at;
    const pm = punchM(rs.punch, age, o.reduced);   // stroke and ripple rings: wide at the moment of the hit
    if (rs.prim === 'stroke') {
      if (rs.wash && !o.noWash) s += F(circ(R), rs.wash.token, { a: rs.wash.alpha * A });
      if (rs.inner) s += SW(circ(R * rs.inner.at), thick(rs.inner.layers, pm), { a: A });
      const arcs = arcsBetween(gapList(rs.gaps, seed));
      arcs.forEach(([a0, a1]) => { s += SW(arc(R, a0, a1 - a0), thick(rs.layers, pm), { a: A }); });
      if (rs.core) clipToArcs(coreArc(rs.core, seed, aw), arcs).forEach(([a0, a1]) => { s += SW(arc(R, a0, a1 - a0), thick(rs.core.layers, pm), { a: A }); });
    } else if (rs.prim === 'band') {
      const B = bandGeo(R, rs, seed, { R0, widthScale: aw && rs.awakened ? rs.awakened.widthScale : 1, fringeSides: aw && rs.awakened && rs.awakened.fringeSides });
      if (aw && rs.awakened && rs.awakened.inner) s += SW(circ(R * rs.awakened.inner.at), rs.awakened.inner.layers, { a: A });
      const fa = (rs.alpha == null ? 1 : rs.alpha) * A;
      B.segs.forEach((sg) => {
        const d = sg.closed ? line(sg.outer, true) + ' ' + line(sg.inner, true) : line(sg.outer.concat(sg.inner.slice().reverse()), true);
        s += F(d, rs.token, { rule: sg.closed ? 'evenodd' : null, a: fa });
        if (rs.edge) s += SW(line(sg.outer, sg.closed), rs.edge, { a: A }) + SW(line(sg.inner, sg.closed), sg.fringeIn ? rs.fringe.layers : rs.edge, { a: A });
        if (rs.edge && sg.fringeOut) s += SW(line(sg.outer, sg.closed), rs.fringe.layers, { a: A });
      });
      if (rs.core) {
        bandCoreArcs(rs, B, seed, aw).forEach(([a0, a1]) => {
          const pts = samp((t) => { const th = lerp(a0, a1, t), w = B.wf(th); return polar(rs.core.at === 'outer' ? R + w / 2 : R, th); }, Math.max(4, Math.ceil((a1 - a0) * R / 6)));
          s += SW(a1 - a0 >= TAU - 1e-3 ? line(pts.slice(0, -1), true) : line(pts), rs.core.layers, { a: A });
        });
      }
    } else if (rs.prim === 'jag') {
      // the jag is built once at the full radius and scaled while it grows (its vertex count never changes)
      const fs = rs.flicker.seeds[o.reduced ? 0 : Math.floor(o.t * rs.flicker.fps) % 2], g = jagGeo(R0, rs, fs);
      const sc = R / R0, V = g.V.map(([x, y]) => [x * sc, y * sc]);
      if (dashMode) s += S(line(V, true), 'ink', rs.layers[0][1] * 0.6, { cap: 'butt', join: 'miter', miter: 6, dash: rs.fade.dash, a: A });
      else {
        s += SW(line(V, true), rs.layers, { join: 'miter', miter: 6, a: A });
        g.forks.forEach((fk) => { s += SW(line(fk.map(([x, y]) => [x * sc, y * sc])), [[rs.layers[0][0], rs.layers[0][1] * 0.6], [rs.layers[1][0], rs.layers[1][1] * 0.55]], { join: 'miter', miter: 6, a: A }); });
      }
    } else if (rs.prim === 'multi') {
      const rings = rs.rings.concat(aw && rs.awakened ? [rs.awakened.ring] : []);
      rings.forEach((q) => { const a2 = age - q.delay; if (a2 < 0) return; const r = grownR(R0 * q.final, rs.grow, a2, o.reduced); s += SW(circ(r), rs.layers, { a: q.alpha * fadeA(rs.fade, age, life, rs.grow, o.reduced) }); });
    } else if (rs.prim === 'ripple') {
      if (rs.full) s += SW(circ(R), thick(rs.full.layers, pm), { a: A });
      rs.arcs.forEach((q) => { s += SW(arc(R * q.at, q.span[0] * RAD, (q.span[1] - q.span[0]) * RAD), thick(q.layers, pm), { a: A }); });
      const cc = rippleCoreArc(rs, aw);
      s += SW(arc(R * rs.arcs[rs.core.arc].at, cc[0], cc[1] - cc[0]), thick(rs.core.layers, pm), { a: A });
    }
    if (aw && rs.prim !== 'multi') s += SW(circ(R - SPEC.awakened.inset), SPEC.awakened.layers, { a: A });
    if (aw && rs.prim === 'multi') s += SW(circ(grownR(R0, rs.grow, age, o.reduced) - SPEC.awakened.inset), SPEC.awakened.layers, { a: fadeA(rs.fade, age, life, rs.grow, o.reduced) });
    return s;
  }
  /** Event positions of a reference strike / lob: lobs use the game's scatter, strikes the reference spread ellipse. */
  function eventPositions(id, n, o) {
    const g = META[id].geo, out = [];
    if (META[id].kind === 'lob') {
      const sc = n > 1 ? (g.scatter || 0) : 0;
      for (let k = 0; k < n; k++) { const a = k * TAU / n; out.push({ x: Math.cos(a) * sc, y: Math.sin(a) * sc }); }
      return out;
    }
    if (n === 1) return [{ x: 0, y: 0 }];
    const sp = SPEC.reference.spread;
    for (let k = 0; k < n; k++) {
      const a = TAU * (k + 0.7 * jit(o.seed, 960 + k)) / n, rr = 0.35 + 0.65 * Math.sqrt(jit(o.seed, 980 + k));
      out.push({ x: Math.cos(a) * sp[0] * rr, y: Math.sin(a) * sp[1] * rr });
    }
    return out;
  }
  /** One event's splash (SPEC.splash): the spikes kept at the LOD grow in length (reduced motion: full length, α comes in
   *  over reducedIn), drops show once grown (full LOD only); all of it one ink path, faded after fade.at of the life. */
  function drawSplash(id, R0, seed, age, o) {
    const sp = SPEC.splash[id], SH = SPEC.splash.shape, u = clamp(age / lifeOf(id), 0, 1);
    let A = u > sp.fade.at ? clamp((1 - u) / (1 - sp.fade.at), 0, 1) : 1, g = 1;
    if (o.reduced) A *= clamp(age / SH.reducedIn, 0, 1);
    else g = sp.grow.from + (1 - sp.grow.from) * easeOut(clamp(age / sp.grow.seconds, 0, 1));
    if (A <= 0.01) return '';
    const spikes = splashKeep(splashGeo(sp, R0, seed, o.awakened), sp, o.lod);
    if (!spikes.length) return '';
    const d = spikes.map((q) => {
      let t = line(spikeOutline(q, g), true);
      if (q.drop && o.lod === 'full' && g >= 1) {
        const c = polar(q.drop.c, q.th), rx = SH.drop.stretch * q.drop.r, ry = q.drop.r, a = q.th / RAD, e0 = polar(rx, q.th + Math.PI, c[0], c[1]), e1 = polar(rx, q.th, c[0], c[1]);
        t += ` M${P2(e0)} A${f(rx)},${f(ry)} ${f(a)} 1 0 ${P2(e1)} A${f(rx)},${f(ry)} ${f(a)} 1 0 ${P2(e0)} Z`;
      }
      return t;
    }).join(' ');
    return F(d, sp.token, { a: A });
  }
  /** Frame of a flying object. frame 'progress' (SPEC.flight[id].frame, the ink pot's roll): min(frames - 1, ⌊u·frames⌋)
   *  by the flight's progress u, no phase, frame 0 at minimal LOD, the same under reduced motion. Otherwise a loop: by
   *  the flight's age and the lob's phase; the still frame under reduced motion and at minimal LOD; half fps at reduced
   *  LOD. */
  function flightFrame(P, o, u, age, ph, byProgress) {
    if (byProgress) return minimal(o) ? 0 : Math.min(P.frames - 1, Math.floor(u * P.frames));
    if (o.reduced || minimal(o)) return P.still;
    const fps = o.lod === 'reduced' ? P.fps / 2 : P.fps;
    return ((Math.floor(age * fps + ph * P.frames) % P.frames) + P.frames) % P.frames;
  }
  /** The land items mirrored about their anchor when the lob came from the right (SPEC.flight[id].landMirror; the
   *  reference composition takes the way from opts.dir: -1 = from the right; none = unknown = no mirror). */
  function mirrorLand(id, stage, items, o) {
    const lm = SPEC.flight[id] && SPEC.flight[id].landMirror;
    if (!lm || stage !== META[id].main || !(+o.dir < 0)) return items;
    return items.map((it) => (lm.parts.indexOf(it.part) >= 0 ? Object.assign({}, it, { flip: !it.flip }) : it));
  }
  /** Lob flight (§3, SPEC.flight): every lob of the cast from the throw point (the origin) to the landing point (o.dx,
   *  o.dy; default 240, -60) plus the game's scatter; o.t = the flight's progress (lobPath's t, 0..1), age = t·delay.
   *  The shadows first, then the objects at (x, y - h). Nothing from t = 1: the blast's land frame 0 takes the place.
   *  Lobs bound for the same point are drawn once (reference only: in the game each lob has its own target). */
  function drawFlight(id, o) {
    const FL = SPEC.flight[id], u = clamp(o.t, 0, 1);
    if (u >= 1) return '';
    const dx = o.dx == null ? 240 : +o.dx, dy = o.dy == null ? -60 : +o.dy, age = u * META[id].geo.delay, seen = {};
    let sh = '', ob = '';
    eventPositions(id, stats(id, o).count, o).forEach((q, k) => {
      const key = f(q.x) + ',' + f(q.y);
      if (seen[key]) return;
      seen[key] = 1;
      const L = lobPath(id, { x0: 0, y0: 0, x1: dx + q.x, y1: dy + q.y, t: u });
      sh += E(L.x, L.y, L.shadow.rx, L.shadow.ry, SPEC.flight.shadow.token, { a: L.shadow.alpha });
      const parts = o.awakened && FL.awakened ? FL.awakened : FL.parts, part = FL.by === 'index' ? parts[k % parts.length] : parts[0], P = partOf(id, part);
      ob += place(id, part, flightFrame(P, o, u, age, jit(o.seed, SPEC.flight.phase + k), FL.frame === 'progress'), L.x, L.y - L.h, P.rotate === 'path' ? L.angle + (FL.turn || 0) * RAD : 0);
    });
    return sh + ob;
  }
  const DRAW = {};
  DRAW.strike = DRAW.lob = (id, stage, o) => {
    if (stage === 'flight') return drawFlight(id, o);
    const st = stats(id, o), life = lifeOf(id), age = o.p * life, ev = eventPositions(id, st.count, o), rs = SPEC.ring[id];
    let ground = '', splash = '', rings = '';
    const objs = [];
    // washes of one cast are one path filled once (nonzero union): seven overlapping seals do not stack their paper
    if (rs.wash && rs.wash.union) {
      const R = grownR(st.radius, rs.grow, age, o.reduced), A = fadeA(rs.fade, age, life, rs.grow, o.reduced);
      ground += F(ev.map((q) => circ(R, null, q.x, q.y)).join(' '), rs.wash.token, { a: rs.wash.alpha * A });
    }
    // per event: ground decals, then the splash, then the ring, then the objects (by y); the event's seed also picks
    // its tilt side
    ev.forEach((q, k) => {
      const seed = o.seed + 17 * k, oe = Object.assign({}, o, { seed }), items = mirrorLand(id, stage, layout(id, stage, oe), o);
      ground += G(tr(q.x, q.y), putItems(id, items, oe, age, life, 'ground'));
      const sh = SPEC.splash[id] ? drawSplash(id, st.radius, seed, age, o) : '';
      if (sh) splash += G(tr(q.x, q.y), sh);
      rings += G(tr(q.x, q.y), drawRing(id, st.radius, seed, age, Object.assign({}, o, { noWash: !!(rs.wash && rs.wash.union) })));
      objs.push([q.y, G(tr(q.x, q.y), putItems(id, items, oe, age, life, 'ally'))]);
    });
    return ground + splash + rings + objs.sort((a, b) => a[0] - b[0]).map((q) => q[1]).join('');
  };
  DRAW.nova = (id, stage, o) => {
    const st = stats(id, o), life = lifeOf(id), age = o.p * life, items = layout(id, stage, o);
    return drawRing(id, st.radius, o.seed, age, o) + putItems(id, items, o, age, life, 'ally');
  };

  // -- chains --
  DRAW.chain = (id, stage, o) => {
    const ls = SPEC.line[id], life = lifeOf(id), age = o.p * life, u = clamp(age / life, 0, 1), P = chainPts(id, o), items = layout(id, stage, Object.assign({}, o, { points: P.map((p, i) => ({ x: p[0], y: p[1], r: o.points && o.points[i] && o.points[i].r })) }));
    const A = fadeA(ls.fade, age, life), late = ls.fade && u > ls.fade.at;
    // a point's stamp shows once the growing line has reached it (straight-line share of the whole chain)
    const cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const reach = clamp(u / ls.grow.frac, 0, 1) * cum[cum.length - 1];
    const shown = items.filter((it) => it.index == null || cum[it.index] <= reach + 0.5);
    let s = putItems(id, shown, o, age, life, 'feet');
    if (ls.prim === 'sag') {
      let pts = clearStart(sagCurves(P, ls.sag, ls.step).pts, SPEC.footClear);
      const g = clamp(u / ls.grow.frac, 0, 1);
      if (g < 1) pts = cutAlong(pts, 0, g);
      if (late) s += S(smooth(pts), 'ink', ls.layers[0][1] * 0.7, { cap: 'butt', dash: ls.fade.dash, a: A });
      else s += SW(smooth(pts), ls.layers, {});
    } else if (ls.prim === 'twist') {
      const fs = ls.flicker.seeds[o.reduced ? 0 : Math.floor(o.t * ls.flicker.fps) % 2], g = twistGeo(P, ls, fs);
      const cut = (pts) => { let q = clearStart(pts, SPEC.footClear); const gr = clamp(u / ls.grow.frac, 0, 1); if (gr < 1) q = cutAlong(q, 0, gr); return q; };
      s += SW(line(cut(g.B)), ls.strands[1], { a: A }) + SW(line(cut(g.A)), ls.strands[0], { join: 'miter', miter: 5, a: A });
    } else if (ls.prim === 'links') {
      if (minimal(o)) s += SW(line(clearStart(P, SPEC.footClear)), ls.minimal.layers, { join: 'miter', miter: 5, a: A });
      else {
        const its = linksGeo(P, ls, SPEC.footClear), shown = Math.ceil(its.length * clamp(u / ls.grow.frac, 0, 1));
        its.slice(0, shown).forEach((it) => {
          const deg = it.angle / RAD;
          if (it.type === 'ring') s += G(tr(it.x, it.y, deg), SW(ellD(0, 0, ls.ellipse.rx, ls.ellipse.ry), it.core ? ls.core.layers : ls.ellipse.layers, {}), A);
          else s += G(tr(it.x, it.y, deg), F(line([[-ls.bar.len / 2, -ls.bar.h / 2], [ls.bar.len / 2, -ls.bar.h / 2], [ls.bar.len / 2, ls.bar.h / 2], [-ls.bar.len / 2, ls.bar.h / 2]], true), ls.bar.fill, { st: ls.bar.edge[0], sw: ls.bar.edge[1] }), A);
          if (it.nub) s += G(tr(it.x, it.y, deg), Cir(0, it.nub * (ls.ellipse.ry + ls.nubs.r), ls.nubs.r, ls.nubs.fill, { st: ls.nubs.edge[0], sw: ls.nubs.edge[1] }), A);
        });
      }
    }
    return s + putItems(id, shown, o, age, life, 'ally');
  };

  // -- beams --
  function capsule(c, L, w, a) {
    const x0 = SPEC.footClear;
    if (L <= x0 + 2) return '';
    const d = `M${f(x0)},${f(-w)} L${f(L)},${f(-w)} A${f(w)},${f(w)} 0 0 1 ${f(L)},${f(w)} L${f(x0)},${f(w)} Z`;
    let s = c.fill ? F(d, c.fill[0], { a: c.fill[1] * a }) : '';
    if (c.edge) s += c.dash ? SWD(d, c.edge, c.dash, 0, { a }) : SW(d, c.edge, { a });
    return s;
  }
  function drawBeamOne(id, o, L, w, age, life, seed) {
    const ls = SPEC.line[id], u = clamp(age / life, 0, 1), A = fadeA(ls.fade, age, life), aw = o.awakened;
    let s = '';
    if (ls.prim === 'blade') {
      const g = bladeGeo(ls, L, age, life, aw);
      s += capsule(ls.capsule, L, w, g.a);
      const x0 = SPEC.footClear;
      if (g.xb > x0 + 1) {
        if (aw) s += SW(`M${f(x0)},${f(ls.awakened.shadow.offset)} L${f(g.xb)},${f(ls.awakened.shadow.offset)}`, ls.awakened.shadow.layers, { a: g.a });
        s += F(brushD([[x0, 0], [g.xb + 1, 0]], (t) => lerp(ls.shaft.width[0], ls.shaft.width[1], t)), ls.shaft.token, { a: g.a });
        s += S(`M${f(x0 + 2)},-0.9 L${f(g.xb - 2)},-0.7`, ls.shaft.grain[0], ls.shaft.grain[1], { a: g.a });
      }
      s += F(smooth(g.head, true), ls.head.fill, { st: ls.head.edge[0], sw: ls.head.edge[1], a: g.a }) + S(`M${f(g.xb + 3)},-0.3 L${f(g.tip - 5)},-0.2`, 'ink300', 0.8, { a: g.a });
    } else if (ls.prim === 'brushBand') {
      if (ls.capsule) s += capsule(ls.capsule, L, w, A);
      const x0 = SPEC.footClear, x1 = bandHead(ls, L, age, life);
      if (x1 > x0 + 2) {
        const hw = (x) => (ls.taper ? w * taperRatio(ls.taper, (x - x0) / (L - x0)) : w);
        const top = raggedEdge(x0, x1, hw, ls.edge.ragged, seed, 100, -1), bot = raggedEdge(x0, x1, hw, ls.edge.ragged, seed, 200, 1);
        const body = line(top.concat(bot.slice().reverse()), true);
        s += F(body, ls.fill[0], { a: ls.fill[1] * A });
        if (ls.edge.sides === 'both') s += SW(line(top), ls.edge.layers, { a: A }) + SW(line(bot), ls.edge.layers, { a: A });
        else s += SW(line(bot), ls.edge.layers, { a: A });
        if (ls.streaks) streakList(ls, x1, w, seed).forEach((q) => { s += SW(`M${f(q.x0)},${f(q.y)} L${f(q.x1)},${f(q.y + 0.6)}`, ls.streaks.layers, { a: A }); });
        if (ls.front) { const h = hw(x1); s += SW(`M${f(x1 - 4)},${f(-h)} Q${f(x1 + 3)},0 ${f(x1 - 4)},${f(h)}`, ls.front.layers, { a: A }); }
        if (ls.core) {
          const from = aw ? 1 - (1 - ls.core.from) * SPEC.awakened.coreScale : ls.core.from, xa = x0 + (L - x0) * from;
          if (x1 > xa + 2) s += SW(`M${f(xa)},0 L${f(x1 - 2)},0`, ls.core.layers, { a: A });
        }
      }
    } else if (ls.prim === 'string') {
      s += capsule(ls.capsule, L, w, A);
      const ws = aw ? ls.awakened.widthScale : 1, n = aw ? ls.awakened.after : ls.after.n, k = 1 - clamp(age / ls.after.seconds, 0, 1), x0 = SPEC.footClear, mid = (x0 + L) / 2;
      if (k > 0) for (let j = 0; j < n; j++) s += SW(`M${f(x0)},0 Q${f(mid)},${f(2 * ls.after.bow * ls.after.sign[j] * k)} ${f(L)},0`, ls.after.layers, { a: A });
      const pm = punchM(ls.punch, age, o.reduced);   // the snap: the line is wide for a moment
      s += SW(`M${f(x0)},0 L${f(L)},0`, ls.layers.map((l) => [l[0], l[1] * ws * pm]), { a: A });
    }
    return s;
  }
  DRAW.beam = (id, stage, o) => {
    const st = stats(id, o), life = lifeOf(id), age = o.p * life, ls = SPEC.line[id], dirs = META[id].geo.directions || 1;
    const aim = dirs > 1 ? (ls.aim || 0) * RAD : 0;
    let s = '';
    for (let k = 0; k < dirs; k++) {
      const seed = o.seed + 31 * k, items = layout(id, stage, Object.assign({}, o, { seed }));
      s += G(tr(0, 0, (aim + k * Math.PI / 2) / RAD), drawBeamOne(id, o, st.length, st.width, age, life, seed) + putItems(id, items, o, age, life, 'ally'));
    }
    return s;
  };

  // -- halos --
  DRAW.halo = (id, stage, o) => {
    const hs = SPEC.halo[id], st = stats(id, o), R = st.radius, inner = st.inner, life = lifeOf(id), age = o.p * life, A = fadeA(hs.fade, age, life), aw = o.awakened, seed = o.seed;
    let s = '';
    if (hs.wash) s += F(inner > 0 ? circ(R) + ' ' + circ(inner) : circ(R), hs.wash.token, { rule: inner > 0 ? 'evenodd' : null, a: hs.wash.alpha * A });
    if (hs.crescent) {
      const span = (aw ? hs.awakened.span : hs.crescent.span) * RAD, phi = sweepAngle(seed, hs.crescent.sweep, age, life, o.reduced), d = hs.crescent.thick * (R - inner);
      s += F(line(crescentPts(R, d, phi, span, hs.crescent.step), true), hs.crescent.token, { a: hs.crescent.alpha * A });
      if (aw) s += F(line(crescentPts(R, hs.awakened.opposite.thick * (R - inner), phi + Math.PI, span, hs.crescent.step), true), hs.crescent.token, { a: hs.awakened.opposite.alpha * A });
    }
    if (hs.inner && inner > 0) s += SWD(circ(inner), hs.inner.layers, hs.inner.dash, 0, { a: A });
    if (hs.outer) {
      if (hs.outer.gaps) arcsBetween(gapList(hs.outer.gaps, seed)).forEach(([a0, a1]) => { s += SW(arc(R, a0, a1 - a0), hs.outer.layers, { a: A }); });
      else s += SW(circ(R), hs.outer.layers, { a: A });
    }
    if (hs.comet) {
      const th = sweepAngle(seed, hs.comet.sweep, age, life, o.reduced), span = aw ? hs.awakened.span : hs.comet.span, head = lerp(hs.comet.head[0], hs.comet.head[1], jit(seed, 710));
      const g = cometGeo((inner + R) / 2, th, span, head);
      s += F(line(g.capPts.slice().reverse().concat(g.L).concat(g.Rr.slice().reverse()), true), hs.comet.body, { st: hs.comet.rim[0], sw: hs.comet.rim[1], a: A });
      const n = g.C.length - 1, c0 = Math.floor(hs.comet.core.from * n), c1 = Math.max(c0 + 2, Math.floor(hs.comet.core.to * n));
      s += SW(smooth(g.C.slice(c0, c1 + 1)), hs.comet.core.layers, { a: A });
    }
    if (hs.rope) {
      const Rg = grownR(R, hs.grow, age, o.reduced), sc = Rg / R, g = ropeGeo(R, hs, seed, aw), w = g.w;
      s += G(`scale(${f(sc)})`, F(circ(R + w / 2) + ' ' + circ(R - w / 2), hs.rope.body, { rule: 'evenodd', a: A }) +
        S(circ(R + w / 2), hs.rope.edge[0], hs.rope.edge[1], { a: A }) + S(circ(R - w / 2), hs.rope.edge[0], hs.rope.edge[1], { a: A }) +
        g.marks.map(([p, q]) => SW(`M${P2(p)} Q${P2([(p[0] + q[0]) / 2 + (q[1] - p[1]) * 0.12, (p[1] + q[1]) / 2 - (q[0] - p[0]) * 0.12])} ${P2(q)}`, hs.rope.twist.layers, { a: A })).join('') +
        SWD(arc(R + w / 2 + hs.core.gap, g.core[0], g.core[1] - g.core[0]), hs.core.layers, hs.core.dash, hs.core.pad, { a: A }));
    }
    if (aw && !hs.rope) s += SW(circ(R - SPEC.awakened.inset), SPEC.awakened.layers, { a: A });
    const items = layout(id, stage, o);
    return s + putItems(id, items, o, age, life, 'ally');
  };

  // -- awakening gimmicks, P1 (delivery 3a) --
  const rClass = (r, list) => list.reduce((m, q) => (Math.abs(q - r) < Math.abs(m - r) ? q : m), list[0]);
  /** An overlay's markup round an enemy's feet (origin): head marks at (0, top + dy), feet overlays by size class.
   *  layer (the renderer's layers, §5.1): 'feet' = groundMarks, under the body (freeze -back); 'front' = right after
   *  that enemy's body (freeze -front, scorch); 'head' = overheads (head marks, the crow); none = all, in that order. */
  function ovBody(key, o, r, top, layer) {
    const OV = SPEC.overlay, t = o.t, want = (ly) => !layer || layer === ly;
    if (OV.head.parts[key]) {
      if (!want('head')) return '';
      // stacked marks pick their part by opts.stack; deco marks are left out at minimal LOD; rotate 'face' marks are
      // mirrored with the enemy (opts.facing -1)
      const q = OV.head.parts[key], part = q.stack ? q.part + clamp(Math.round(+o.stack || 1), q.stack[0], q.stack[1]) : q.part, P = partOf(q.group, part);
      if (P.lod === 'deco' && minimal(o)) return '';
      const fr = P.drive === 'loop' ? (o.reduced || minimal(o) ? P.still : Math.floor(t * P.fps) % P.frames) : 0;
      return place(q.group, part, fr, 0, top + OV.head.dy, 0, P.rotate === 'face' && +o.facing < 0 ? { flip: true } : undefined);
    }
    if (key === 'crack') {
      if (!want('head')) return '';
      const q = OV.crack;
      return place(q.group, q.part + clamp(Math.round(+o.stack || 1), q.stack[0], q.stack[1]), 0, 0, top + q.dy, 0);
    }
    if (key === 'pollen') {
      // two spores, each rising and drifting outward over its cycle, phase apart (still at their phase under reduced
      // motion; deco: none at minimal LOD)
      if (!want('head') || minimal(o)) return '';
      const q = OV.pollen, sp = SPEC.marks.spores;
      return q.parts.map((part, i) => {
        const P = partOf(q.group, part), u = o.reduced ? q.phase[i] : ((((t / P.seconds) + q.phase[i]) % 1) + 1) % 1, side = q.at[i][0] < 0 ? -1 : 1;
        return place(q.group, part, Math.min(P.frames - 1, Math.floor(u * P.frames)), q.at[i][0] + side * sp.drift * u, top + q.at[i][1] - sp.rise * u, 0);
      }).join('');
    }
    // frost, bound and thorn stand in front of the body (under it, the feet hide them: §12)
    if (key === 'frost') { if (!want('front')) return ''; const q = OV.feet.frost; return place(q.group, q.part + clamp(Math.round(+o.stack || 1), q.stack[0], q.stack[1]) + '-' + rClass(r, q.r), 0, 0, 0, 0); }
    if (key === 'bound') { if (!want('front')) return ''; const q = OV.feet.bound; return place(q.group, q.part + rClass(r, q.r), 0, 0, 0, 0); }
    if (key === 'thorn') { if (!want('front')) return ''; const q = OV.feet.thorn; return place(q.group, q.part + rClass(r, q.r), 0, 0, 0, 0); }
    if (key === 'crow') {
      if (!want('head')) return '';
      const c = SPEC.marks.crow, q = OV.crow, P = partOf(q.group, q.part), Pk = partOf(q.group, q.peck);
      // opts.peck = seconds since the crow's hit tick (data crowAt): for dive seconds the peck stamp shows on the head
      // (deco: not at minimal LOD) and the flying crow dives to it and back (k = sin(π·peck / dive))
      const pk = o.peck == null ? -1 : +o.peck, pecking = pk >= 0 && pk < c.dive;
      const burst = pecking && !minimal(o) ? place(q.group, q.peck, clamp(Math.floor(pk / Pk.seconds * Pk.frames), 0, Pk.frames - 1), q.dive.peck[0], top + q.dive.peck[1], 0) : '';
      if (o.reduced) return place(q.group, q.part, P.still, q.sit[0], top + q.sit[1], 0) + burst;
      const a = TAU * t / c.period, fl = Math.sin(a) > 0, k = pecking ? Math.sin(Math.PI * pk / c.dive) : 0;
      const x = lerp(Math.cos(a) * c.rx, (fl ? 1 : -1) * q.dive.crow[0], k), y = lerp(top - c.lift + Math.sin(a) * c.ry, top + q.dive.crow[1], k);
      return place(q.group, q.part, Math.floor(t * P.fps) % P.frames, x, y, 0, { flip: fl }) + burst;
    }
    if (key === 'freeze') { const q = OV.feet.freeze, rc = rClass(r, q.r); return (want('feet') ? place(q.group, q.back + rc, 0, 0, 0, 0) : '') + (want('front') ? place(q.group, q.front + rc, 0, 0, 0, 0) : ''); }
    if (key === 'scorch') { if (!want('front')) return ''; const q = OV.feet.scorch, rc = rClass(r, q.r), P = partOf(q.group, q.part + rc); return place(q.group, q.part + rc, o.reduced || minimal(o) ? P.still : Math.floor(t * P.fps) % P.frames, 0, 0, 0); }
    return '';
  }
  // reference context (opts.context, C5): enemies of chapter ch (and the hero) read only from PN.enemies / PN.heroKit
  const CTX_SCL = { stalker: 0.9, charger: 0.963, shooter: 0.783, warden: 1 }, CTX_TOP = { stalker: -30, charger: -40, shooter: -44, warden: -74 };
  function ctxEnemy(role, x, y, o, ov, heads) {
    const EN = PN.enemies;
    if (!EN || !EN.meta) return '';
    const m = EN.meta(o.ch, role), k = m.displayScale * (CTX_SCL[role] || 1);
    // the overlay in the renderer's layers: feet under the body, front right after it, head marks over it (3b2: pushed to
    // `heads` instead when given, so a caller can draw an event between the bodies and the overheads)
    const lay = (ly) => { const b = ov ? ovBody(ov, o, m.r, CTX_TOP[role] || -34, ly) : ''; return b ? G(tr(x, y), b) : ''; };
    const body = E(x, y, m.r, m.r * 0.42, 'ink', { a: 0.3 }) + lay('feet') + `<g transform="translate(${f(x - m.feet[0] * k)} ${f(y - m.feet[1] * k)}) scale(${f(k)})">${EN.draw(o.ch, role, { lod: 'game' })}</g>` + lay('front');
    if (heads) { heads.push(lay('head')); return body; }
    return body + lay('head');
  }
  const ctxHero = (state, fr, x, y) => (PN.heroKit && PN.heroKit.placeSprite ? PN.heroKit.placeSprite(state, fr, x, y, 1) : '');
  const ZONE_CTX = { inkPots: [['stalker', -24, 12, 'scorch'], ['charger', 28, -12, 'scorch']], tarJar: [['stalker', -72, 26], ['shooter', 60, -46]], smokeTail: [['charger', -16, 10]], pinHail: [['stalker', 26, 6]], gravePins: [['stalker', 30, 4]], inkLightning: [['charger', 34, 10]], twinBlades: [['stalker', -42, 18], ['shooter', 46, -8]] };
  const zoneAlpha = (age, life) => Math.min(clamp(age / SPEC.zone.fadeIn, 0, 1), clamp((life - age) / SPEC.zone.fadeOut, 0, 1));
  /** Frame of a zone stamp: cycle by o.t / seconds + phase; loop and idx as frameFor. */
  function zoneFrame(P, o, age, phase) {
    if (P.drive === 'cycle') return (o.reduced || minimal(o)) ? Math.min(P.frames - 1, Math.floor((phase || 0) * P.frames)) : Math.floor(((((o.t / P.seconds) + (phase || 0)) % 1) + 1) % 1 * P.frames) % P.frames;
    return frameFor(P, o, age, 1, phase);
  }
  /** A ground zone (SPEC.zone[id], §4.2): floor, wash, gloss, rim (whole life), turning arcs, stamps by glayout (ground,
   *  then stand by y with the context, then ally); minimal keeps the centre object only, reduced drops every other deco
   *  part / prio-2 item. The centre object's start / end parts carry its own coming and going: drawn at full alpha, and
   *  its frames between them skip the fade of an end that has such a part (F2). */
  function drawZone(id, stage, o) {
    const Z = SPEC.zone[id], R = stageR(id, stage, o), life = Z.life, age = clamp(o.p, 0, 1) * life, A = zoneAlpha(age, life);
    let ground = '', ally = '', deco = 0;
    const stand = [];
    if (Z.floor) ground += place(id, Z.floor, 0, 0, 0, 0, { a: A });
    if (Z.wash) ground += F(circ(R), Z.wash.token, { a: Z.wash.alpha * A });
    if (Z.gloss) Z.gloss.at.forEach((k, i) => { ground += SW(arc(R * k, (Z.gloss.span[0] + i * 12) * RAD, (Z.gloss.span[1] - Z.gloss.span[0]) * RAD), Z.gloss.layers, { a: A }); });
    if (Z.rim === 'ally') ground += SWD(circ(R), SPEC.rim.ally.layers, SPEC.rim.ally.dash, SPEC.rim.ally.pad);
    else if (Z.rim === 'pad') ground += SW(circ(R), o.context || o.inside ? SPEC.rim.pad.inside : SPEC.rim.pad.layers);
    if (Z.arcs) {
      const th0 = TAU * jit(o.seed, Z.arcs.start) + (o.reduced ? 0 : TAU * Z.arcs.turns * age);
      for (let k = 0; k < Z.arcs.n; k++) ally += SW(arc(R * Z.arcs.at, th0 + k * TAU / Z.arcs.n, Z.arcs.span * RAD), Z.arcs.layers, { a: A });
    }
    glayout(id, stage, o).forEach((it) => {
      if (minimal(o) && it.prim !== 'center') return;
      if (partOf(id, it.part).lod === 'deco' || it.prio === 2) { deco++; if (o.lod === 'reduced' && deco % 2 === 0) return; }
      let part = it.part, fr, own = false;
      if (it.prim === 'center' && Z.start && age < Z.start.seconds) { part = Z.start.part; fr = Math.floor(age / Z.start.seconds * partOf(id, part).frames); own = true; }
      else if (it.prim === 'center' && Z.end && age > life - Z.end.seconds) { part = Z.end.part; fr = Math.floor((age - life + Z.end.seconds) / Z.end.seconds * partOf(id, part).frames); own = true; }
      const P = partOf(id, part);
      fr = fr == null ? zoneFrame(P, o, age, it.phase) : clamp(fr, 0, P.frames - 1);
      // the centre object's loop / idx frames take only the fade of an end that has no start / end part (review 5 F2):
      // the part at that end does the coming or going, so the object never dims next to it
      const a = own ? 1 : it.prim === 'center' ? Math.min(Z.start ? 1 : clamp(age / SPEC.zone.fadeIn, 0, 1), Z.end ? 1 : clamp((life - age) / SPEC.zone.fadeOut, 0, 1)) : A;
      const m = place(id, part, fr, it.x, it.y, P.rotate === 'none' ? 0 : it.angle, { flip: it.flip, a });
      if (it.z === 'stand') stand.push([it.y, m]); else if (it.z === 'ally') ally += m; else ground += m;
    });
    if (o.context) {
      // big zones: the enemies inside (scaled with R); small ones (< 50): an enemy beside the piece
      (ZONE_CTX[id] || []).forEach(([role, x, y, ov]) => { const k = R < 50 ? 1 : R / 75, dx = R < 50 ? R + 16 : 0; stand.push([y * k, ctxEnemy(role, x * k + dx, y * k, o, ov)]); });
      if (id === 'meteorBrush' && PN.heroKit && PN.heroKit.placeSprite) stand.push([8, PN.heroKit.placeSprite('idle', 0, -10, 8, 1)]);
    }
    return ground + stand.sort((a, b) => a[0] - b[0]).map((q) => q[1]).join('') + ally;
  }
  /** Head and feet marks as a gimmick stage: the overlay alone (r 19), or three enemies wearing it (context; stacked
   *  marks show their stacks, the boss's crack plate stands on three wardens). */
  const MARK_STAGES = ['freeze', 'prey', 'crow', 'silence', 'stain', 'fear', 'weak', 'crack', 'lost', 'pollen', 'frost', 'bound', 'thorn'];
  const MARK_CTX = {
    stain: [['shooter', 10, -40, 1], ['stalker', -70, 40, 2], ['charger', 50, 70, 3]],
    crack: [['warden', -80, 70, 1], ['warden', 84, 84, 3], ['warden', 0, -10, 5]],
    frost: [['shooter', 10, -40, 1], ['stalker', -70, 40, 2], ['charger', 50, 70, 2]]
  };
  // 3b2: the follow-up event of four of these gimmicks joins its stage: the stain's burst, the fear ring, the crack's
  // burst, the pollen ring and puff (every tick). Reference: age = p × life (pollen: p × the tick)
  const MARK_EVENT = { stain: 1, fear: 1, crack: 1, pollen: 1 };
  // context of those four: [role, x, y, stack, overlay key (default the stage; null none)] and the event's place [role or
  // null, x, y] (the burst's enemy carries no mark: the burst resets it)
  const EVENT_CTX = {
    stain: { list: [['shooter', -150, -56, 1], ['charger', -64, 64, 2]], at: ['stalker', 92, 4] },
    fear: { list: [['shooter', 10, -40], ['stalker', -70, 40], ['charger', 50, 70]], at: [null, 0, 0] },
    crack: { list: [['warden', -176, 64, 1], ['warden', 176, 44, 3]], at: ['warden', 0, 0] },
    pollen: { list: [['shooter', 84, -54], ['stalker', -60, 30], ['charger', -22, 64, 0, null]], at: [null, -60, 30] }
  };
  /** The event of a mark stage at an enemy (origin = its feet): burst stamp + event ring (+ the crack lines), the fear
   *  ring, the pollen ring (none at minimal LOD) + the puff (deco). */
  function markEvent(id, stage, o, age) {
    const g = SPEC.gimmick[id];
    if (stage === 'stain' || stage === 'crack') {
      const P = partOf(id, g.burst), fr = clamp(Math.floor(age / P.seconds * P.frames), 0, P.frames - 1);
      const cr = stage === 'crack' ? drawCracks(g.cracks, g.r, o.seed, age, fadeA(g.ring.fade, age, g.life, g.ring.grow, o.reduced), o) : '';
      return cr + eventRing(g.ring, g.r, o.seed, age, g.life, o) + place(id, g.burst, fr, 0, 0, 0);
    }
    if (stage === 'fear') return eventRing(g.ring, g.r, o.seed, age, g.life, o);
    if (stage === 'pollen') {
      if (minimal(o)) return '';
      const P = partOf(id, g.puff);
      return eventRing(g.ring, g.r, o.seed, age, g.life, o) + (age < P.seconds ? place(id, g.puff, clamp(Math.floor(age / P.seconds * P.frames), 0, P.frames - 1), 0, 0, 0) : '');
    }
    return '';
  }
  function drawMarks(id, stage, o) {
    const ev = MARK_EVENT[stage], g = SPEC.gimmick[id], age = ev ? clamp(o.p, 0, 1) * (stage === 'pollen' ? g.tick : g.life) : 0;
    if (o.context && ev) {
      // bodies (feet and front overlays), then the event over them, then the head marks (the overheads pass)
      const C = EVENT_CTX[stage], heads = [];
      let s = C.list.map(([r, x, y, st, ov]) => ctxEnemy(r, x, y, st ? Object.assign({}, o, { stack: st }) : o, ov === undefined ? stage : ov, heads)).join('');
      if (C.at[0]) s += ctxEnemy(C.at[0], C.at[1], C.at[2], o, null);
      return s + G(tr(C.at[1], C.at[2]), markEvent(id, stage, o, age)) + heads.join('');
    }
    if (o.context) return (MARK_CTX[stage] || [['shooter', 10, -40], ['stalker', -70, 40], ['charger', 50, 70]]).map(([r, x, y, st]) => ctxEnemy(r, x, y, st ? Object.assign({}, o, { stack: st }) : o, stage)).join('');
    return ovBody(stage, o, 19, -40) + (ev ? markEvent(id, stage, o, age) : '');
  }
  /** The triangle seal (§4.4): pending (delay) the threads sew the edges corner to corner and the corner prints come in;
   *  then the strike edges, the triangle's paper fill for fillSeconds and the strike print at the centroid. */
  function drawTriangle(id, o) {
    const g = SPEC.gimmick[id], P = triPts(o), age = clamp(o.p, 0, 1) * (g.delay + g.life), cen = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3];
    let s = o.context ? P.map((p, i) => ctxEnemy(['stalker', 'charger', 'shooter'][i], p[0], p[1] + 8, o)).join('') : '', top = '';
    if (age < g.delay) {
      const u = o.reduced ? 1 : age / g.delay;
      for (let k = 0; k < 3; k++) { const a = P[k], b = P[(k + 1) % 3], gk = clamp(u * 3 - k, 0, 1); if (gk > 0.01) s += SWD(`M${P2(a)} L${P2([lerp(a[0], b[0], gk), lerp(a[1], b[1], gk)])}`, g.pre.layers, g.pre.dash, g.pre.pad); }
      P.forEach((p) => { top += place(id, 'sealCorner', Math.min(2, Math.floor(u * 3)), p[0], p[1], 0); });
    } else {
      const v = age - g.delay;
      if (v < g.strike.fillSeconds) s += F(line(P, true), g.strike.fill.token, { a: g.strike.fill.alpha });
      s += SW(line(P, true), g.strike.layers, { a: fadeA(g.strike.fade, v, g.life) });
      P.forEach((p) => { top += place(id, 'sealCorner', 2, p[0], p[1], 0); });
      top += place(id, 'sealStrike', clamp(Math.floor(v / partOf(id, 'sealStrike').seconds * 3), 0, 2), cen[0], cen[1], 0);
    }
    return s + top;
  }
  /** The unrolling scroll (§4.4, beam frame from the landing point): the paper band at ±w (straight ink edges, the
   *  mountain ridge) unrolls over grow, the roll's rod across its head, the roller stamp in the middle of it. */
  function drawUnroll(id, o) {
    const g = SPEC.gimmick[id], Lb = o.length != null ? +o.length : g.length, w = o.width != null ? +o.width : g.width, age = clamp(o.p, 0, 1) * g.life;
    const x1 = o.reduced ? Lb : Lb * easeOut(clamp(age / g.grow, 0, 1)), A = fadeA(g.fade, age, g.life);
    if (x1 < 2) return '';
    let s = o.context ? ctxEnemy('stalker', x1 * 0.5, w * 0.3, o) + ctxEnemy('charger', x1 * 0.85, -w * 0.4, o) : '';
    s += F(`M0,${f(-w)} L${f(x1)},${f(-w)} L${f(x1)},${f(w)} L0,${f(w)} Z`, g.band.fill.token, { a: g.band.fill.alpha * A });
    s += SW(`M0,${f(-w)} L${f(x1)},${f(-w)}`, g.band.edge, { a: A }) + SW(`M0,${f(w)} L${f(x1)},${f(w)}`, g.band.edge, { a: A });
    const ridge = ridgePts(Lb, w, g.band.ridge).filter((p) => p[0] <= x1 - 3);
    if (ridge.length > 1) s += SW(smooth(ridge), g.band.ridge.layers, { a: A });
    s += SW(`M${f(x1)},${f(-w)} L${f(x1)},${f(w)}`, g.band.head, { a: A });
    const P = partOf(id, 'roller');
    return s + place(id, 'roller', o.reduced || minimal(o) ? P.still : Math.floor(o.t * P.fps) % P.frames, x1, 0, 0, { a: A });
  }
  /** The eighth seal (§4.4): pending (delay) its shadow grows at the centre and the stitches run in from the seven seals
   *  (deco); then the big print, the wash, the heavy ring (gaps, grow, fade) and the big seal. */
  function drawEighth(id, o) {
    const g = SPEC.gimmick[id], R = stageR(id, 'eighth', o), age = clamp(o.p, 0, 1) * (g.delay + g.life);
    let s = '';
    if (age < g.delay) {
      const u = age / g.delay, rx = lerp(g.shadow.rx[0], g.shadow.rx[1], u);
      s += E(0, 0, rx, 0.42 * rx, g.shadow.token, { a: lerp(g.shadow.alpha[0], g.shadow.alpha[1], u) });
      // the stitches are deco: none at minimal LOD, every other one at reduced
      if (!minimal(o)) eventPositions(id, 7, o).forEach((q, k) => { if (o.lod === 'reduced' && k % 2) return; s += SWD(`M${P2([q.x, q.y])} L${P2([q.x * (1 - u), q.y * (1 - u)])}`, g.stitch.layers, g.stitch.dash, g.stitch.pad); });
      return s;
    }
    const v = age - g.delay, rg = g.ring, Rg = grownR(R, rg.grow, v, o.reduced), A = fadeA(rg.fade, v, g.life, rg.grow, o.reduced);
    s += place(id, 'print8', 0, 0, 0, 0) + F(circ(Rg), rg.wash.token, { a: rg.wash.alpha * A });
    arcsBetween(gapList(rg.gaps, o.seed)).forEach(([a0, a1]) => { s += SW(arc(Rg, a0, a1 - a0), rg.layers, { a: A }); });
    return s + place(id, 'seal8', clamp(Math.floor(v / g.sealSeconds * 4), 0, 3), 0, 0, 0);
  }
  /** The total eclipse (every fourth sweep): the disc's pale ink, the crescent closed into a full shadow band, the
   *  heavy outer rim, the corona flags round the rim and the ribbons (translucent: never the black sun's solid disc). */
  function drawTotal(id, o) {
    const hs = SPEC.halo[id], g = SPEC.gimmick[id], R = stageR(id, 'total', o), life = lifeOf(id), age = clamp(o.p, 0, 1) * life, A = fadeA(hs.fade, age, life);
    // the disc and the band lie on the ground (g.layers); under reduced flash (opts.reducedFlash) their alpha × reducedFlash
    const kf = o.reducedFlash ? g.reducedFlash : 1;
    let s = F(circ(R), g.wash.token, { a: g.wash.alpha * A * kf }) + F(circ(R) + ' ' + circ(R * g.band.at), g.band.token, { rule: 'evenodd', a: g.band.alpha * A * kf });
    s += SW(circ(R), g.outer, { a: A }) + SW(circ(R - SPEC.awakened.inset), SPEC.awakened.layers, { a: A });
    let deco = 0;   // the corona flags are deco: none at minimal LOD, every other one at reduced
    glayout(id, 'total', o).forEach((it) => { if (it.prim === 'ring' && (minimal(o) || (o.lod === 'reduced' && deco++ % 2))) return; const P = partOf(id, it.part); s += place(id, it.part, P.drive === 'loop' ? frameFor(P, o, age, life, it.phase) : clamp(Math.floor(age / P.seconds * P.frames), 0, P.frames - 1), it.x, it.y, it.angle, { a: A }); });
    if (o.context && PN.heroKit && PN.heroKit.placeSprite) s += PN.heroKit.placeSprite('idle', 0, 0, 0, 1);
    return s;
  }
  /** The growing downpour: no new art (data); four strokes at the scale steps, their marks chosen by radius. */
  function drawSurge(id, o) {
    const g = SPEC.gimmick[id], st = stats(id, o), life = lifeOf(id), age = o.p * life, pos = [[-110, -70], [110, -70], [-110, 90], [110, 90]];
    return g.scale.map((m, i) => {
      const R = st.radius * m, seed = o.seed + 17 * i, oe = Object.assign({}, o, { seed, radius: R }), items = layout(id, 'impact', oe);
      return G(tr(pos[i][0], pos[i][1]), putItems(id, items, oe, age, life, 'ground') + drawRing(id, R, seed, age, o) + putItems(id, items, oe, age, life, 'ally'));
    }).join('');
  }
  // -- awakening gimmicks, P2 follow-up effects (delivery 3b2) --
  /** An event ring (SPEC.gimmick[id].ring): the centre line on R(grow); gaps (gapList: J(10), J(20+k), J(40+k)); cyan only
   *  on the core arc (coreArc J(60), J(61), never × coreScale; no awakened inset line). alpha × rs.alpha (torn, jag).
   *  stroke and band as SPEC.ring (punch on stroke); torn: tornRing; dashed: the ink + cyan dashed sandwich on every arc
   *  between gaps (3b2-r1, no core); jag: jagGeo at R0 by the flicker seed, scaled by R/R0, the vertices on each arc
   *  between gaps as one open line, the core's vertices again in the core layers. */
  function eventRing(rs, R0, seed, age, life, o) {
    const R = grownR(R0, rs.grow, age, o.reduced), A = fadeA(rs.fade, age, life, rs.grow, o.reduced) * (rs.alpha == null ? 1 : rs.alpha);
    if (A <= 0.01) return '';
    const arcs = arcsBetween(gapList(rs.gaps, seed)), core = rs.core ? clipToArcs(coreArc(rs.core, seed, false), arcs) : [];
    let s = '';
    if (rs.prim === 'stroke') {
      const pm = punchM(rs.punch, age, o.reduced);
      arcs.forEach(([a0, a1]) => { s += SW(arc(R, a0, a1 - a0), thick(rs.layers, pm), { a: A }); });
      core.forEach(([a0, a1]) => { s += SW(arc(R, a0, a1 - a0), thick(rs.core.layers, pm), { a: A }); });
    } else if (rs.prim === 'band') {
      const B = bandGeo(R, rs, seed, { R0 });
      B.segs.forEach((sg) => { s += F(sg.closed ? line(sg.outer, true) + ' ' + line(sg.inner, true) : line(sg.outer.concat(sg.inner.slice().reverse()), true), rs.token, { rule: sg.closed ? 'evenodd' : null, a: A }); });
      bandCoreArcs(rs, B, seed, false).forEach(([a0, a1]) => { s += SW(line(samp((t) => polar(R, lerp(a0, a1, t)), Math.max(4, Math.ceil((a1 - a0) * R / 6)))), rs.core.layers, { a: A }); });
    } else if (rs.prim === 'torn') {
      tornRing(R, rs, seed, R0).forEach((q) => { s += F(q.d, rs.token, { a: A }) + SW(line(q.outer), rs.edge, { a: A }) + SW(line(q.rest), rs.tear.layers, { a: A }); });
    } else if (rs.prim === 'dashed') {
      // the ally dashed sandwich (as rim.ally, review 8 F1): over each arc between gaps the ink dashes and on them the cyan
      // ones in the same phase; the ink dash runs pad past both ends of each cyan dash (SWD: ink [d0 + 2 pad, d1 - 2 pad]
      // offset pad, cyan [d0, d1], butt ends; each arc's pattern starts at its own start)
      arcs.forEach(([a0, a1]) => { s += SWD(arc(R, a0, a1 - a0), rs.layers, rs.dash, rs.pad, { a: A }); });
    } else if (rs.prim === 'jag') {
      const fs = rs.flicker.seeds[o.reduced ? 0 : Math.floor(o.t * rs.flicker.fps) % 2], sc = R / R0, V = jagGeo(R0, rs, fs).V.map(([x, y]) => [x * sc, y * sc]), ang = V.map(([x, y]) => Math.atan2(y, x));
      const run = ([a0, a1]) => V.map((p, k) => [a0 + ((((ang[k] - a0) % TAU) + TAU) % TAU), p]).filter((q) => q[0] <= a1).sort((a, b) => a[0] - b[0]).map((q) => q[1]);
      arcs.forEach((iv) => { const P = run(iv); if (P.length > 1) s += SW(line(P), rs.layers, { join: 'miter', miter: 6, a: A }); });
      core.forEach((iv) => { const P = run(iv); if (P.length > 1) s += SW(line(P), rs.core.layers, { join: 'miter', miter: 6, a: A }); });
    }
    return s;
  }
  /** The torn paper band (prim torn) per arc a between gaps: n = max(6, round((a1 - a0)·R0 / pitch)) steps; the outer
   *  edge on R + w/2; the inner edge on R - w/2, every even inner vertex (not the ends) pushed in by lerp(depth,
   *  J(2150 + 97a + k)) unless J(2100 + 97a + k) < skip; each end torn across: the band's middle juts `end` past it. */
  function tornRing(R, rs, seed, R0) {
    const w = rs.width, tr = rs.tear;
    return arcsBetween(gapList(rs.gaps, seed)).map(([a0, a1], ai) => {
      const n = Math.max(6, Math.round((a1 - a0) * R0 / tr.pitch)), outer = [], inner = [];
      for (let k = 0; k <= n; k++) {
        const th = lerp(a0, a1, k / n), j = 97 * ai + k, d = k % 2 || k === 0 || k === n ? 0 : (jit(seed, 2100 + j) < tr.skip ? 0 : lerp(tr.depth[0], tr.depth[1], jit(seed, 2150 + j)));
        outer.push(polar(R + w / 2, th)); inner.push(polar(R - w / 2 - d, th));
      }
      const e0 = polar(R, a0 - tr.end / R), e1 = polar(R, a1 + tr.end / R), back = inner.slice().reverse();
      return { outer, d: line(outer.concat([e1], back, [e0]), true), rest: [outer[n], e1].concat(back, [e0, outer[0]]) };
    });
  }
  /** The crack burst's paper crack lines (SPEC.gimmick.bossbane.cracks): n = n0 + ⌊J(1900)·(n1 - n0 + 1)⌋ lines; θk =
   *  2π·J(1901) + (k + 0.5 + (J(1910 + k) - 0.5)·2·jitter)·2π/n; from from·R, length L = lerp(to, J(1930 + k))·R in four
   *  steps (steps × (L - from·R)), step j heading θk ± lerp(bend, J(1980 + 4k + j))° (minus when J(1950 + 4k + j) < 0.5),
   *  so never past L ≤ 0.9 R; line ⌊J(1902)·n⌋ forks once at its vertex `at` (len·L at θk ± deg, minus when J(1904) <
   *  0.5); lines c = ⌊J(1903)·n⌋ and (c + ⌊n/2⌋) mod n take the core layers. */
  function crackLines(R, cs, seed) {
    const n = cs.n[0] + Math.floor(jit(seed, 1900) * (cs.n[1] - cs.n[0] + 1)), a0 = TAU * jit(seed, 1901), fk = Math.floor(jit(seed, 1902) * n), c1 = Math.floor(jit(seed, 1903) * n), c2 = (c1 + Math.floor(n / 2)) % n, out = [];
    for (let k = 0; k < n; k++) {
      const th = a0 + (k + 0.5 + (jit(seed, 1910 + k) - 0.5) * 2 * cs.jitter) * TAU / n, r0 = cs.from * R, L = lerp(cs.to[0], cs.to[1], jit(seed, 1930 + k)) * R, pts = [polar(r0, th)];
      cs.steps.forEach((st, j) => {
        const a = th + (jit(seed, 1950 + 4 * k + j) < 0.5 ? -1 : 1) * lerp(cs.bend[0], cs.bend[1], jit(seed, 1980 + 4 * k + j)) * RAD, p = pts[pts.length - 1];
        pts.push([p[0] + Math.cos(a) * (L - r0) * st, p[1] + Math.sin(a) * (L - r0) * st]);
      });
      let fork = null;
      if (k === fk) { const p = pts[cs.fork.at], a = th + (jit(seed, 1904) < 0.5 ? -1 : 1) * cs.fork.deg * RAD; fork = [p, [p[0] + Math.cos(a) * cs.fork.len * L, p[1] + Math.sin(a) * cs.fork.len * L]]; }
      out.push({ k, pts, fork, core: k === c1 || k === c2 });
    }
    return out;
  }
  /** The crack lines growing out (length × lerp(from, 1, easeOut(age / seconds)); full at once under reduced motion), the
   *  fork once the line is three quarters out; alpha A (the ring's). */
  function drawCracks(cs, R, seed, age, A, o) {
    if (A <= 0.01) return '';
    const g = o.reduced ? 1 : cs.grow.from + (1 - cs.grow.from) * easeOut(clamp(age / cs.grow.seconds, 0, 1));
    return crackLines(R, cs, seed).map((q) => SW(line(g < 1 ? cutAlong(q.pts, 0, g) : q.pts), q.core ? cs.core.layers : cs.layers, { join: 'miter', miter: 4, a: A }) +
      (q.fork && g >= 0.75 ? SW(line(q.fork), cs.layers, { join: 'miter', miter: 4, a: A }) : '')).join('');
  }
  /** The leap's kinked bolt from A to B (the K4 bolt manner): n = clamp(round(|AB| / seg), n0, n1) steps; inner vertex i
   *  at (i + (J(2000 + i) - 0.5)·shift)/n along AB, pushed lerp(push, J(2020 + i)) across it, sides alternating; J with
   *  the seed (event seed)·13 + the flicker seed. */
  function kinkPts(A, B, sp, js) {
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nn = [-dy / L, dx / L], n = clamp(Math.round(L / sp.seg), sp.n[0], sp.n[1]), out = [A.slice()];
    for (let i = 1; i < n; i++) {
      const t = (i + (jit(js, 2000 + i) - 0.5) * sp.shift) / n, push = lerp(sp.push[0], sp.push[1], jit(js, 2020 + i)) * (i % 2 ? 1 : -1);
      out.push([A[0] + dx * t + nn[0] * push, A[1] + dy * t + nn[1] * push]);
    }
    out.push(B.slice());
    return out;
  }
  /** Frame of an event stamp: prog by its own seconds. */
  const evFrame = (P, age) => clamp(Math.floor(age / P.seconds * P.frames), 0, P.frames - 1);
  /** The late dab (brushQuills): pending (delay), the dab by its progress; then the burst stamp and the event ring r. */
  function dabEvent(id, g, age, seed, o) {
    if (age < g.delay) { const P = partOf(id, g.dab); return place(id, g.dab, clamp(Math.floor(age / g.delay * P.frames), 0, P.frames - 1), 0, 0, 0); }
    const v = age - g.delay;
    return eventRing(g.ring, g.r, seed, v, g.life, o) + place(id, g.burst, evFrame(partOf(id, g.burst), v), 0, 0, 0);
  }
  function drawDab(id, o) {
    const g = SPEC.gimmick[id], u = clamp(o.p, 0, 1);
    if (!o.context) return dabEvent(id, g, u * (g.delay + g.life), o.seed, o);
    // two quills' first hits: one dab waiting on the ground by the enemy it hit, one bursting among two enemies
    return G(tr(-122, 28), dabEvent(id, g, u * g.delay, o.seed, o)) + ctxEnemy('stalker', -96, 10, o) + ctxEnemy('charger', 96, -6, o) + ctxEnemy('shooter', 128, 34, o) +
      G(tr(104, 12), dabEvent(id, g, g.delay + u * g.life, o.seed + 17, o));
  }
  function drawTopple(id, o) {
    const g = SPEC.gimmick[id], fr = evFrame(partOf(id, g.event), clamp(o.p, 0, 1) * g.life);
    if (!o.context) return place(id, g.event, fr, 0, 0, 0);
    // a pushed enemy has struck the next one: the topple at the blow between their bodies
    return ctxEnemy('stalker', -18, 12, o) + ctxEnemy('charger', 22, 2, o) + place(id, g.event, fr, 2, -16, 0);
  }
  function drawLeap(id, o) {
    const g = SPEC.gimmick[id], ls = g.line, age = clamp(o.p, 0, 1) * g.life, u = age / g.life, Q = ptsOf(o);
    const A0 = Q.length > 1 ? Q[0] : [-92, 26], B0 = Q.length > 1 ? Q[1] : [84, -14], A = [A0[0], A0[1] - g.lift], B = [B0[0], B0[1] - g.lift];
    const fs = ls.flicker.seeds[o.reduced ? 0 : Math.floor(o.t * ls.flicker.fps) % 2], gr = clamp(u / ls.grow.frac, 0, 1);
    let pts = kinkPts(A, B, ls, o.seed * 13 + fs);
    if (gr < 1) pts = cutAlong(pts, 0, gr);
    let s = o.context ? ctxEnemy('charger', A0[0], A0[1], o) + ctxEnemy('stalker', B0[0], B0[1], o) : '';
    s += SW(line(pts), ls.layers, { join: 'miter', miter: 5, a: fadeA(ls.fade, age, g.life) });
    // the strike where it lands (deco: none at minimal LOD)
    if (gr >= 1 && !minimal(o)) s += place(id, g.hit, u < 0.6 ? 0 : 1, B[0], B[1], 0);
    return s;
  }
  function drawRear(id, o) {
    const g = SPEC.gimmick[id], P = partOf(id, g.hit), fr = evFrame(P, clamp(o.p, 0, 1) * g.life);
    if (!o.context) return place(id, g.hit, fr, 0, -g.lift, 0);
    // the hero runs right; enemies behind (within 70° of straight back, 200 away) take the doubled hits
    return ctxEnemy('stalker', -124, 14, o) + ctxEnemy('charger', -92, -64, o) + ctxHero('run', 1, 0, 0) + place(id, g.hit, fr, -124, 14 - g.lift, 0) + place(id, g.hit, Math.min(P.frames - 1, fr + 1), -92, -64 - 20, 0);
  }
  function drawBump(id, o) {
    const g = SPEC.gimmick[id], fr = evFrame(partOf(id, g.event), clamp(o.p, 0, 1) * g.life);
    if (!o.context) return place(id, g.event, fr, 0, 0, 0);
    // a pushed enemy has struck the arena's edge (a reference wall line, not K10 art) and is stunned
    return S('M156,-120 L150,-30 L156,60 L152,140', 'ink700', 4) + ctxEnemy('charger', 128, 12, o) + place(id, g.event, fr, 144, -14, 0);
  }
  function drawEcho(id, o) {
    const g = SPEC.gimmick[id], R = stats(id, o).radius * g.reach;
    // enemies just outside the clap's own radius, inside the echo's
    const s = o.context ? [[190, 'stalker'], [-30, 'charger'], [40, 'shooter']].map(([deg, r]) => ctxEnemy(r, Math.cos(deg * RAD) * R * 0.88, Math.sin(deg * RAD) * R * 0.66, o)).join('') + ctxHero('idle', 0, 0, 0) : '';
    return s + eventRing(g.ring, R, o.seed, clamp(o.p, 0, 1) * g.life, g.life, o);
  }
  function drawSplit(id, o) {
    const g = SPEC.gimmick[id], R = stats(id, o).radius * g.area, life = lifeOf(id), u = clamp(o.p, 0, 1);
    // reference: the two minis fly to ±offset for delay (the lobMini path), then burst (the land stamp, the ring at
    // area·R, plain: no awakened line); with context the burst moment
    const age = o.context ? g.delay + u * life : u * (g.delay + life);
    let s = o.context ? ctxEnemy('stalker', -84, 20, o) + ctxEnemy('charger', 70, -16, o) : '';
    if (age < g.delay) {
      const t = age / g.delay, Pm = partOf(id, g.mini);
      [-1, 1].forEach((sg, k) => {
        const L = lobPath(id, { x0: 0, y0: 0, x1: sg * g.offset, y1: 0, t, mini: true });
        s += E(L.x, L.y, L.shadow.rx, L.shadow.ry, SPEC.flight.shadow.token, { a: L.shadow.alpha }) + place(id, g.mini, flightFrame(Pm, o, t, age, jit(o.seed, SPEC.flight.phase + k), false), L.x, L.y - L.h, 0);
      });
      return s;
    }
    const v = age - g.delay, fr = evFrame(partOf(id, g.burst), v), oa = Object.assign({}, o, { awakened: false });
    [-1, 1].forEach((sg, k) => { s += G(tr(sg * g.offset, 0), drawRing(id, R, o.seed + 17 * k, v, oa) + place(id, g.burst, fr, 0, 0, 0)); });
    return s;
  }
  /** The chain's points with an enemy on each but the first (the hero), for the chain gimmicks' context. */
  const ctxChain = (P, o) => P.slice(1).map((p, i) => ctxEnemy(['stalker', 'charger', 'shooter'][i % 3], p[0], p[1] + 8, o)).join('') + ctxHero('idle', 0, P[0][0], P[0][1]);
  /** With context and no opts.points: a compact chain for the board's cells (at most six points 64 apart from x -170;
   *  the reference chain without context is chainPts'). */
  function ctxPoints(id, o) {
    if (!o.context || (o.points && o.points.length > 1)) return o;
    const n = Math.min(6, stats(id, o).jumps + 1), P = [];
    for (let k = 0; k < n; k++) P.push([-170 + 64 * k, k ? (k % 2 ? -1 : 1) * 34 * (0.6 + 0.4 * jit(o.seed, 990 + k)) : 0]);
    return Object.assign({}, o, { points: P });
  }
  function drawRewind(id, o) {
    o = ctxPoints(id, o);
    const g = SPEC.gimmick[id], ls = g.line, life = lifeOf(id), age = o.p * life, u = clamp(age / life, 0, 1), P = chainPts(id, o), A = fadeA(ls.fade, age, life);
    // the same sag manner bowed the other way, drawn from the last point back to the hero (cleared 26 there)
    let pts = clearStart(sagCurves(P, ls.sag, ls.step).pts, SPEC.footClear).reverse();
    const gr = clamp(u / ls.grow.frac, 0, 1);
    if (gr < 1) pts = cutAlong(pts, 0, gr);
    let s = o.context ? ctxChain(P, o) : '';
    s += u > ls.fade.at ? S(smooth(pts), 'ink', ls.layers[0][1] * 0.7, { cap: 'butt', dash: ls.fade.dash, a: A }) : SW(smooth(pts), ls.layers, {});
    // a spark on each enemy the rewound thread has reached (straight-line share from the tail; never on the hero)
    const cum = [0];
    for (let i = P.length - 1; i > 0; i--) cum.push(cum[cum.length - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const reach = gr * cum[cum.length - 1];
    for (let j = 0; j < P.length - 1; j++) { const p = P[P.length - 1 - j]; if (cum[j] <= reach + 0.5) s += place(id, g.hit, u < 0.5 ? 0 : 1, p[0], p[1], 0); }
    return s;
  }
  function drawAmplify(id, o) {
    o = ctxPoints(id, o);
    const g = SPEC.gimmick[id], ls = SPEC.line[id], life = lifeOf(id), age = o.p * life, u = clamp(age / life, 0, 1), P = chainPts(id, o), A = fadeA(ls.fade, age, life);
    const fs = ls.flicker.seeds[o.reduced ? 0 : Math.floor(o.t * ls.flicker.fps) % 2], cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const reach = clamp(u / ls.grow.frac, 0, 1) * cum[cum.length - 1];
    let s = o.context ? ctxChain(P, o) : '';
    // segment i: the strands × (1 + width·i) wide, the twist × (1 + amp·i)
    for (let i = 0; i + 1 < P.length && reach > cum[i]; i++) {
      const tw = twistGeo([P[i], P[i + 1]], Object.assign({}, ls, { amp: ls.amp * (1 + g.amp * i) }), fs + 31 * i), k = 1 + g.width * i, gr = clamp((reach - cum[i]) / (cum[i + 1] - cum[i]), 0, 1);
      const cut = (q) => { let r = i === 0 ? clearStart(q, SPEC.footClear) : q; if (gr < 1) r = cutAlong(r, 0, gr); return r; };
      s += SW(line(cut(tw.B)), thick(ls.strands[1], k), { a: A }) + SW(line(cut(tw.A)), thick(ls.strands[0], k), { join: 'miter', miter: 5, a: A });
    }
    // the gust at each point reached: gust-b from segment big.from on
    P.slice(1).forEach((p, j) => { if (cum[j + 1] > reach + 0.5) return; const part = j >= g.big.from ? g.big.part : 'gust-a'; s += place(id, part, u < 0.5 ? 0 : 1, p[0], p[1], 0, { flip: jit(o.seed, 650 + j) < 0.5 }); });
    return s;
  }
  function drawLink(id, o) {
    const g = SPEC.gimmick[id], ls = SPEC.line[id], age = clamp(o.p, 0, 1) * g.life, P = o.points && o.points.length > 1 ? ptsOf(o) : chainPts(id, ctxPoints(id, o)).slice(1);
    // links between the living members in order, light for the 2 s; whole for share.seconds after a shared hit (opts.share
    // = seconds since it); minimal LOD: one bent line
    const share = o.share != null && +o.share >= 0 && +o.share < g.share.seconds, A = (share ? g.share.alpha : g.line.alpha) * fadeA(g.fade, age, g.life);
    let s = o.context ? P.map((p, i) => ctxEnemy(['stalker', 'charger', 'shooter'][i % 3], p[0], p[1] + 8, o)).join('') : '';
    if (A <= 0.01) return s;
    if (minimal(o)) return s + SW(line(P), ls.minimal.layers, { join: 'miter', miter: 5, a: A });
    linksGeo(P, Object.assign({}, ls, { pitch: g.line.pitch }), g.line.clear).forEach((it) => {
      const deg = it.angle / RAD;
      if (it.type === 'ring') s += G(tr(it.x, it.y, deg), SW(ellD(0, 0, ls.ellipse.rx, ls.ellipse.ry), it.core ? ls.core.layers : ls.ellipse.layers, {}), A);
      else s += G(tr(it.x, it.y, deg), F(line([[-ls.bar.len / 2, -ls.bar.h / 2], [ls.bar.len / 2, -ls.bar.h / 2], [ls.bar.len / 2, ls.bar.h / 2], [-ls.bar.len / 2, ls.bar.h / 2]], true), ls.bar.fill, { st: ls.bar.edge[0], sw: ls.bar.edge[1] }), A);
      if (it.nub) s += G(tr(it.x, it.y, deg), Cir(0, it.nub * (ls.ellipse.ry + ls.nubs.r), ls.nubs.r, ls.nubs.fill, { st: ls.nubs.edge[0], sw: ls.nubs.edge[1] }), A);
    });
    return s;
  }
  /** A branch lance (+x from the lance's tip): the lance's blade manner without the tassel: thrust and retract over its
   *  life, the leaf head × hk, the capsule of its hit from 0 (it starts at the lance's tip, not at the hero). */
  function branchBody(ls, Lb, w, age, life, aw, hk) {
    const u = clamp(age / life, 0, 1), rt = ls.retract, hs = (aw ? ls.awakened.headScale : 1) * hk;
    let tip = u < ls.thrust ? lerp(4, Lb, easeOut(u / ls.thrust)) : Lb, a = 1;
    if (u > rt.at) { const v = (u - rt.at) / (1 - rt.at); tip = lerp(Lb, rt.to * Lb, v); a = 1 - v; }
    if (a <= 0.01) return '';
    const hl = Math.min(ls.head.len * hs, tip * 0.8), hh = ls.head.half * hs, xb = tip - hl, c = ls.capsule;
    const head = [[xb, -1.6], [xb + hl * 0.18, -hh * 0.85], [xb + hl * 0.35, -hh], [xb + hl * 0.62, -hh * 0.62], [xb + hl * 0.86, -hh * 0.22], [tip, 0], [xb + hl * 0.86, hh * 0.22], [xb + hl * 0.62, hh * 0.62], [xb + hl * 0.35, hh], [xb + hl * 0.18, hh * 0.85], [xb, 1.6]];
    const cap = `M0,${f(-w)} L${f(Lb)},${f(-w)} A${f(w)},${f(w)} 0 0 1 ${f(Lb)},${f(w)} L0,${f(w)} Z`;
    let s = F(cap, c.fill[0], { a: c.fill[1] * a }) + SW(cap, c.edge, { a });
    if (xb > 1) s += F(brushD([[0, 0], [xb + 1, 0]], (t) => lerp(ls.shaft.width[0], ls.shaft.width[1], t)), ls.shaft.token, { a }) + S(`M2,-0.9 L${f(xb - 2)},-0.7`, ls.shaft.grain[0], ls.shaft.grain[1], { a });
    return s + F(smooth(head, true), ls.head.fill, { st: ls.head.edge[0], sw: ls.head.edge[1], a }) + S(`M${f(xb + 3)},-0.3 L${f(tip - 5)},-0.2`, 'ink300', 0.8, { a });
  }
  function drawBranch(id, o) {
    // with context the lance is cut to 300 and the hero set 210 left (the board's cells are 520 wide)
    if (o.context && o.length == null && !o.ctxShifted) return G(tr(-210, 0), drawBranch(id, Object.assign({}, o, { length: Math.min(stats(id, o).length, 300), ctxShifted: true })));
    const g = SPEC.gimmick[id], ls = SPEC.line[id], st = stats(id, o), L = st.length, w = st.width, life = lifeOf(id), delay = ls.thrust * life, age = clamp(o.p, 0, 1) * (delay + life);
    let s = o.context ? ctxHero('throw', 1, 0, 0) + ctxEnemy('stalker', L + 0.3 * L * Math.cos(g.angle * RAD), -0.3 * L * Math.sin(g.angle * RAD) + 8, o) + ctxEnemy('charger', L + 0.32 * L * Math.cos(g.angle * RAD), 0.32 * L * Math.sin(g.angle * RAD) + 8, o) : '';
    // the lance itself (its stroke stage), then at its tip the two branches at ±angle, branch × L long, and the fork
    const am = Math.min(age, life);
    s += drawBeamOne(id, o, L, w, am, life, o.seed) + putItems(id, layout(id, 'stroke', o), o, am, life, 'ally');
    const v = age - delay;
    if (v >= 0) {
      [-1, 1].forEach((sg) => { s += G(tr(L, 0, sg * g.angle), branchBody(ls, g.branch * L, w, v, life, o.awakened, g.head)); });
      const P = partOf(id, g.fork);
      if (v < P.seconds && !minimal(o)) s += place(id, g.fork, evFrame(P, v), L, 0, 0);
    }
    return s;
  }
  function drawResweep(id, o) {
    if (o.context && o.length == null && !o.ctxShifted) return G(tr(-190, 0), drawResweep(id, Object.assign({}, o, { length: Math.min(stats(id, o).length, 380), ctxShifted: true })));
    const g = SPEC.gimmick[id], ls = SPEC.line[id], st = stats(id, o), L = st.length, w = st.width, life = lifeOf(id), age = clamp(o.p, 0, 1) * life, x0 = SPEC.footClear, seed = o.seed + g.seed;
    // the same wide band at alpha × 0.65, its head running back from the far end to the hero's clear (the brush
    // mirrored: it sweeps the other way); ragged edges and streaks by seed + 500
    const A = fadeA(ls.fade, age, life) * g.alpha, x1 = L - (L - x0) * easeOut(clamp(age / (ls.grow.frac * life), 0, 1));
    let s = o.context ? ctxHero('idle', 0, 0, 0) + ctxEnemy('stalker', L * 0.42, 10, o) + ctxEnemy('shooter', L * 0.74, -6, o) : '';
    if (L - x1 > 2 && A > 0.01) {
      const hw = () => w, top = raggedEdge(x1, L, hw, ls.edge.ragged, seed, 100, -1), bot = raggedEdge(x1, L, hw, ls.edge.ragged, seed, 200, 1), span = L - x1;
      s += F(line(top.concat(bot.slice().reverse()), true), ls.fill[0], { a: ls.fill[1] * A }) + SW(line(top), ls.edge.layers, { a: A }) + SW(line(bot), ls.edge.layers, { a: A });
      const n = ls.streaks.n[0] + Math.floor(jit(seed, 300) * (ls.streaks.n[1] - ls.streaks.n[0] + 1));
      for (let j = 0; j < n; j++) {
        const len = lerp(ls.streaks.len[0], ls.streaks.len[1], jit(seed, 320 + j)) * span, xa = L - len - jit(seed, 330 + j) * (span - len), y = (2 * jit(seed, 310 + j) - 1) * 0.7 * w;
        s += SW(`M${f(xa)},${f(y)} L${f(xa + len)},${f(y + 0.6)}`, ls.streaks.layers, { a: A });
      }
      s += SW(`M${f(x1 + 4)},${f(-w)} Q${f(x1 - 3)},0 ${f(x1 + 4)},${f(w)}`, ls.front.layers, { a: A });
    }
    const part = o.awakened ? 'brush-awakened' : 'brush', P = partOf(id, part);
    return s + place(id, part, clamp(Math.floor(age / life * P.frames), 0, P.frames - 1), x1, 0, 0, { flip: true, a: A });
  }
  function drawDeflect(id, o) {
    const g = SPEC.gimmick[id], R = stats(id, o).radius, u0 = clamp(o.p, 0, 1);
    let s = o.context ? ctxEnemy('shooter', 222, -78, o) + ctxEnemy('shooter', 196, 70, o) + ctxHero('idle', 0, 0, 0) + DRAW.halo(id, 'sweep', o) : '';
    // three turned shots flying out from the band (reference: 90 further over their life): starting, travelling, ending
    [[-20, 0], [-46, 1 / 3], [14, 2 / 3]].forEach(([deg, ph], k) => {
      const u = (u0 + ph) % 1, d = R + 4 + u * 90, a = deg * RAD;
      let part = g.travel, fr = o.reduced || minimal(o) ? 0 : Math.floor(o.t * 12 + k) % 2;
      if (u < 0.08) { part = g.start; fr = Math.min(1, Math.floor(u / 0.04)); } else if (u > 0.9) { part = g.end; fr = Math.min(1, Math.floor((u - 0.9) / 0.05)); }
      s += place(id, part, fr, Math.cos(a) * d, Math.sin(a) * d, a);
    });
    return s;
  }
  function drawHaste(id, o) {
    const g = SPEC.gimmick[id], P = partOf(id, g.part), fr = o.reduced || minimal(o) ? P.still : Math.floor(o.t * (o.lod === 'reduced' ? P.fps / 2 : P.fps)) % P.frames;
    // the star mark with the hero inside (its rim the 'inside' layers), the hero, the haste right after the hero's body
    return drawZone(id, 'mark', Object.assign({}, o, { context: false, inside: true })) + (o.context ? ctxHero('run', 2, -10, 8) : '') + place(id, g.part, fr, -10, 8, 0, +o.facing < 0 ? { flip: true } : undefined);
  }
  function drawSnap(id, o) {
    const g = SPEC.gimmick[id], fr = evFrame(partOf(id, g.event), clamp(o.p, 0, 1) * g.life);
    // the enemy that stepped on it and an untouched caltrop beside
    return (o.context ? place(id, 'caltrop-b', 0, 70, 26, 0) + ctxEnemy('stalker', 4, 8, o) : '') + place(id, g.event, fr, 0, 0, 0);
  }
  const P2_DRAW = { dab: drawDab, topple: drawTopple, leap: drawLeap, rear: drawRear, bump: drawBump, echo: drawEcho, split: drawSplit, rewind: drawRewind, amplify: drawAmplify, link: drawLink, branch: drawBranch, resweep: drawResweep, deflect: drawDeflect, haste: drawHaste, snap: drawSnap };

  function drawGimmick(id, stage, o) {
    if (SPEC.zone[id] && SPEC.zone[id].stage === stage) return drawZone(id, stage, o);
    if (MARK_STAGES.indexOf(stage) >= 0) return drawMarks(id, stage, o);
    if (stage === 'triangle') return drawTriangle(id, o);
    if (stage === 'unroll') return drawUnroll(id, o);
    if (stage === 'eighth') return drawEighth(id, o);
    if (stage === 'total') return drawTotal(id, o);
    if (stage === 'surge') return drawSurge(id, o);
    if (P2_DRAW[stage] && GSTAGE2[id] === stage) return P2_DRAW[stage](id, o);
    return '';
  }

  function draw(id, stage, opts) {
    if (!META[id] || META[id].stages.indexOf(stage) < 0) {
      if (typeof console !== 'undefined') console.warn('PN.arsenalFx: nothing drawn for ' + id + '/' + stage);
      return '<g/>';
    }
    const o = norm(opts), c = Ctx();
    if (isGimmick(id, stage)) return c.out(drawGimmick(id, stage, o), id);
    return c.out(DRAW[META[id].kind](id, stage, o, c), id);
  }
  /** Enemy overlays (§4.3; P1: silence, prey, crow, freeze, scorch; 3b1 (P2): fear, lost, weak, stain, crack, pollen,
   *  frost, bound, thorn). Origin = the enemy's feet; opts.r = its radius (size class), opts.top = its sprite's top (y),
   *  opts.t = clock, opts.stack = stain 1-3 / crack 1-5 / frost 1-2, opts.facing = -1 mirrors the fear drop,
   *  opts.peck = seconds since the crow's hit tick, opts.layer = 'feet' | 'front' | 'head' (one layer only; default all). */
  const OVERLAYS = ['silence', 'prey', 'crow', 'freeze', 'scorch', 'fear', 'lost', 'weak', 'stain', 'crack', 'pollen', 'frost', 'bound', 'thorn'];
  function overlay(key, opts) {
    if (OVERLAYS.indexOf(key) < 0) {
      if (typeof console !== 'undefined') console.warn('PN.arsenalFx: unknown overlay ' + key);
      return '<g/>';
    }
    const o = norm(opts), r = opts && opts.r != null ? +opts.r : 12, top = opts && opts.top != null ? +opts.top : -30, c = Ctx();
    const layer = ['feet', 'front', 'head'].indexOf(o.layer) >= 0 ? o.layer : null;
    return c.out(ovBody(key, o, r, top, layer), 'ov-' + key);
  }

  PN.arsenalFx = Object.freeze({
    version: '1.0',   // the delivery stage is SPEC.version (now '1.0-d3b2-r1')
    K, ids: Object.freeze(IDS.slice()), kinds: Object.freeze(KINDS.slice()), META,
    groups: Object.freeze(GROUPS.slice()), overlays: Object.freeze(OVERLAYS.slice()),
    SPEC, jit,
    parts(group) {
      const list = PARTS[group];
      if (!list) throw new Error('PN.arsenalFx: unknown group ' + group);
      return list.map((p) => Object.assign({}, p, { box: p.box.slice(), anchor: p.anchor.slice() }));
    },
    stamp, layout, paths, lobPath, draw, overlay
  });
})(window.PN);
