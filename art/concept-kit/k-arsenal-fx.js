// k-arsenal-fx.js — 흑백 타격 생존전 먹극화 · PAPER NOIR INK — battlefield art of the arsenal's 44 weapons → window.PN.arsenalFx
// Work order K10: docs/art/briefs/arsenal-fx.md (B7, art-director 2026-10-16). API: art/concept-kit/API-arsenal-fx.md.
// Delivery 1 of 3: the skeleton (tokens, META for all 44, SPEC, jit, layout / paths / lobPath, parts / stamp, draw /
// overlay) and the main stage, plain and awakened, of the 22 weapons that fire no projectile (strike impact, nova burst,
// lob landing, chain jump, beam stroke, halo sweep). Delivery 2: the lob flight of the four lob weapons (stage
// 'flight', the flying objects, SPEC.flight, the cluster pots' `mini` and lobPath's mini path). The awakening gimmicks
// (delivery 3) are not drawn yet and are listed nowhere (META.stages / gimmicks / groups hold only what is drawn).
// Two forms, as in K4 / K11: (1) fixed-size stamps baked into the arsenal-fx pack as afx/<group>/<part>/<frame>
// (stamp()), never stretched; (2) shapes that follow a radius, a length or a list of points, drawn by the renderer
// from the numbers in SPEC (draw() paints the same rules as reference / golden art; layout(), paths() and lobPath()
// are the formulas the renderer ports to TypeScript).
// Units are world units (1440x900 at zoom 1.0, 1x px). Deterministic: no Math.random / Date; jitter is jit(seed, i).
// Every call returns one <g class="kaf kaf-<id>"> with its own <defs>; ids are 'kaf<N>_' per call (counter, never reset).
// Colours: the 11 tokens in K, written as the implemented palette values (palette.ts), so the bake's COLOR_MAP leaves
// them as they are. Nothing here calls PN.arsenal (K9) or PN.hazards (K11); PN.skillVfx is not read either.
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

  /** Parametric shapes and placement rules (work order §1.5); token names, numbers and English words only. */
  const SPEC = {
    version: '1.0-d2r1',
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
      ['lob.shadow', 'ink', 0.14, 1]
    ]
  };

  const META = {};
  ROWS.forEach(([id, name, rarity, kind, look, geo]) => {
    const fx = DRAWN_FX.has(id), lob = DRAWN_LOB.has(id), main = MAIN[kind] || null;
    META[id] = Object.freeze({
      name, rarity, kind, look, geo: Object.freeze(Object.assign({}, geo)), main,
      stages: Object.freeze(fx ? [main].concat(lob ? ['flight'] : []) : []), gimmicks: Object.freeze([]), object: fx ? OBJECT[id] : null,
      done: Object.freeze({ fx, lob, gimmick: false })
    });
  });
  Object.freeze(META);

  // ---- baked parts (work order §2): [part, frames, drive, fps, seconds, window, box, anchor, place, rotate, layer, lod, extra] ----
  const PT = {
    inkLightning: [
      ['bolt', 4, 'prog', 0, 0.24, 'mark', [36, 120], [18, 112], 'target', 'none', 'ally', 'info'],
      ['bolt-awakened', 4, 'prog', 0, 0.24, 'mark', [36, 120], [18, 112], 'target', 'none', 'ally', 'info'],
      ['scorch', 1, 'idx', 0, 0.6, 'decal', [52, 24], [26, 12], 'target', 'none', 'ground', 'deco']
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
      ['scroll-awakened', 4, 'prog', 0, 0.42, 'mark', [52, 104], [26, 98], 'target', 'none', 'ally', 'info']
    ],
    seventhSeal: [
      ['seal', 3, 'prog', 0, 0.3, 'mark', [40, 56], [20, 50], 'target', 'none', 'ally', 'info'],
      ['seal-awakened', 3, 'prog', 0, 0.3, 'mark', [40, 56], [20, 50], 'target', 'none', 'ally', 'info'],
      ['print-a', 1, 'idx', 0, 1.2, 'decal', [48, 24], [24, 12], 'target', 'none', 'ground', 'deco'],
      ['print-b', 1, 'idx', 0, 1.2, 'decal', [48, 24], [24, 12], 'target', 'none', 'ground', 'deco'],
      ['print-c', 1, 'idx', 0, 1.2, 'decal', [48, 24], [24, 12], 'target', 'none', 'ground', 'deco']
    ],
    inkPulse: [
      ['splash-a', 3, 'prog', 0, 0.3, 'mark', [40, 28], [6, 14], 'ring', 'radial', 'ally', 'deco'],
      ['splash-b', 3, 'prog', 0, 0.3, 'mark', [40, 28], [6, 14], 'ring', 'radial', 'ally', 'deco']
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
      ['bell-awakened', 3, 'prog', 0, 0.45, 'mark', [40, 52], [20, 50], 'head', 'none', 'ally', 'info']
    ],
    inkPots: [
      ['shatter', 3, 'prog', 0, 0.3, 'mark', [76, 64], [38, 40], 'target', 'none', 'ally', 'info'],
      ['splat', 1, 'idx', 0, 1.2, 'decal', [64, 30], [32, 15], 'target', 'none', 'ground', 'deco'],
      // delivery 2: the flight (§3). The pot rolls once over its flight (review 4 F1): prog by the flight's progress t;
      // seconds 0.55 is a reference value (the ink pot's flight delay), the renderer uses the data's delay
      ['pot', 4, 'prog', 0, 0.55, 'flight', [30, 34], [15, 17], 'air', 'none', 'air', 'info'],
      ['pot-awakened', 4, 'prog', 0, 0.55, 'flight', [30, 34], [15, 17], 'air', 'none', 'air', 'info']
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
      ['jar-awakened', 4, 'loop', 8, null, 'flight', [34, 38], [17, 19], 'air', 'none', 'air', 'info', { still: 0 }]
    ],
    meteorBrush: [
      ['impact', 3, 'prog', 0, 0.36, 'mark', [88, 68], [44, 46], 'target', 'none', 'ally', 'info', { flash: true }],
      ['impact-awakened', 3, 'prog', 0, 0.36, 'mark', [88, 68], [44, 46], 'target', 'none', 'ally', 'info', { flash: true }],
      ['crater', 1, 'idx', 0, 1.5, 'decal', [120, 52], [60, 26], 'target', 'none', 'ground', 'info'],
      ['comet', 4, 'loop', 12, null, 'flight', [32, 92], [16, 14], 'air', 'path', 'air', 'info', { still: 0 }],
      ['comet-awakened', 4, 'loop', 12, null, 'flight', [32, 92], [16, 14], 'air', 'path', 'air', 'info', { still: 0 }]
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
      ['tassel-awakened', 2, 'prog', 0, null, 'beam', [60, 22], [56, 11], 'origin', 'beam', 'ally', 'info']
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
      ['chip-b', 2, 'prog', 0, 0.24, 'mark', [16, 12], [4, 6], 'ring', 'radial', 'ally', 'deco']
    ],
    wardRing: [
      ['knot-a', 1, 'idx', 0, null, 'variant', [22, 18], [11, 9], 'ring', 'radial', 'ally', 'info'],
      ['knot-b', 1, 'idx', 0, null, 'variant', [22, 18], [11, 9], 'ring', 'radial', 'ally', 'info']
    ],
    eclipseHalo: [
      ['ribbon-a', 3, 'loop', 12, null, 'mark', [36, 18], [32, 9], 'ring', 'tangent', 'ally', 'info', { still: 0 }],
      ['ribbon-b', 3, 'loop', 12, null, 'mark', [36, 18], [32, 9], 'ring', 'tangent', 'ally', 'info', { still: 0 }]
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

  function layout(id, stage, opts) {
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
  function paths(id, stage, opts) {
    if (!META[id] || META[id].stages.indexOf(stage) < 0) return {};
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

  function draw(id, stage, opts) {
    if (!META[id] || META[id].stages.indexOf(stage) < 0) {
      if (typeof console !== 'undefined') console.warn('PN.arsenalFx: nothing drawn for ' + id + '/' + stage);
      return '<g/>';
    }
    const o = norm(opts), c = Ctx();
    return c.out(DRAW[META[id].kind](id, stage, o, c), id);
  }
  /** Enemy overlays come with the gimmicks (delivery 3); until then every key is unknown. */
  const OVERLAYS = [];
  function overlay(key, opts) {
    if (OVERLAYS.indexOf(key) < 0) {
      if (typeof console !== 'undefined') console.warn('PN.arsenalFx: unknown overlay ' + key);
      return '<g/>';
    }
    return '<g/>';
  }

  PN.arsenalFx = Object.freeze({
    version: '1.0',   // the delivery stage is SPEC.version (now '1.0-d2')
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
