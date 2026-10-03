// k-env.js — PN.env : chapter environments (ground / props / landmarks / hazards / boundaries)
// 먹극화 · PAPER NOIR INK — style bible §3.3 · §4 · §5 · §11 · §12. Built from parts in work/env/parts (concatenated).
// Requires lib.js (PN.taper) loaded first. Every function returns an SVG <g> string with its own <defs>; ids are unique per call.
window.PN = window.PN || {};
(function (PN) {
  const E = PN.env = PN.env || {};
  // ---- bible tokens (§3.1 / §3.2 / §3.3). NOTE: bible values override lib.js PN.C for environment work ----
  const K = E.K = {
    ink9: '#121110', ink7: '#2B2926', ink5: '#46423D', ink3: '#8C8579', ink1: '#BCB4A5',
    p50: '#FAF6EC', p100: '#F3EEE2', p300: '#D8D0C0', hanji: '#EFE6D2', voidp: '#E2DBCB',
    ally: '#00A8C6', allyD: '#007C94', allyG: '#CFF6FF', host: '#EF5B4F', hostD: '#B8352B', warn: '#D88D16'
  };
  E.CH = {
    1: { key: 'ink-alley', name: '먹선 골목', hanja: '墨線巷', axis: '직교 · 입문', light: '#D4CAB4', base: '#B8AC93', deep: '#8F836C', spot: '#7E6A4E', spotName: '벽보 세피아', mat: 'scrap/plaster' },
    2: { key: 'iron-chapel', name: '철문 예배당', hanja: '鐵門堂', axis: '방사 · 보통', light: '#C8CACF', base: '#ABADB4', deep: '#878A93', spot: '#566077', spotName: '납청(퓨터)', mat: 'iron' },
    3: { key: 'ashen-canal', name: '무채 운하', hanja: '無彩渠', axis: '수평 · 위험', light: '#C9CEC4', base: '#ADB4AA', deep: '#8A9288', spot: '#56625C', spotName: '젖은 석축 흑록', mat: 'water/stone' },
    4: { key: 'clock-grave', name: '시계 무덤', hanja: '時計塚', axis: '회전 · 고난', light: '#D5CAB2', base: '#BBAE94', deep: '#978A70', spot: '#7C6644', spotName: '바랜 황동', mat: 'clockwork/brass' },
    5: { key: 'eclipse-gate', name: '일식 관문', hanja: '日蝕關', axis: '동심 · 최종', light: '#C8C3C9', base: '#ABA5AC', deep: '#8A848C', spot: '#3E3747', spotName: '흑요', mat: 'eclipse/obsidian' }
  };
  const f = E.f = (n) => Math.round(n * 100) / 100;
  let UID = 0;
  E.uid = () => 'ev' + (UID++).toString(36) + '_';

  // mulberry32 rng + 2D integer hash (world-space, seamless chunking)
  E.rng = function (seed) { let a = (seed >>> 0) || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  E.hash = function (i, j, s) { let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const mix = E.mix = function (a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const c = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  };
  E.P = (pts, closed = true) => 'M' + pts.map((p) => f(p[0]) + ',' + f(p[1])).join(' L') + (closed ? ' Z' : '');

  // ---- halftone tone.dot 20/40/60 % (45°, pitch 5 ≥ 3px @1x) ----
  E.dotDefs = function (p, color = K.ink9, pitch = 5) {
    const r = (c) => f(Math.sqrt(c * pitch * pitch / Math.PI));
    return [20, 40, 60].map((c) => `<pattern id="${p}d${c}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="${pitch / 2}" cy="${pitch / 2}" r="${r(c / 100)}" fill="${color}"/></pattern>`).join('');
  };
  // paper grain (α ≤ 0.06) and rough ink edge filters
  // grain: alpha 0..1 speckle; ALWAYS apply on a rect with opacity ≤ 0.06 (bible §5-8)
  E.grainDef = (id, seed = 4, freq = 0.9) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${seed}"/><feColorMatrix type="matrix" values="0 0 0 0 0.07  0 0 0 0 0.065  0 0 0 0 0.06  3.4 0 0 0 -1.35"/></filter>`;
  E.roughDef = (id, sc = 2.2, fr = 0.05, seed = 7) => `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="${fr}" numOctaves="2" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${sc}" xChannelSelector="R" yChannelSelector="G"/></filter>`;

  // ---- geometry ----
  E.area = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
  E.hull = function (pts) {
    const s = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (s.length < 3) return s;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of s) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = s.length - 1; i >= 0; i--) { const p = s[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop(); return lo.concat(up);
  };
  // cast shadow (light from upper-left → shadow to lower-right)
  E.castPts = (pts, dx, dy) => E.hull(pts.concat(pts.map((p) => [p[0] + dx, p[1] + dy])));
  // rounded polygon sampled densely (for ribbons) or as path
  E.sampleRound = function (pts, r = 4, step = 3) {
    pts = pts.filter((q, i) => { const p = pts[(i + pts.length - 1) % pts.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.01; });
    const out = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
      const la = Math.hypot(b[0] - a[0], b[1] - a[1]), lc = Math.hypot(c[0] - b[0], c[1] - b[1]);
      const rr = Math.min(r, la * 0.45, lc * 0.45);
      const p0 = [b[0] + (a[0] - b[0]) * rr / la, b[1] + (a[1] - b[1]) * rr / la], p2 = [b[0] + (c[0] - b[0]) * rr / lc, b[1] + (c[1] - b[1]) * rr / lc];
      for (let k = 0; k <= 4; k++) { const t = k / 4, u = 1 - t; out.push([u * u * p0[0] + 2 * u * t * b[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * b[1] + t * t * p2[1]]); }
      const L = Math.hypot(c[0] - p2[0], c[1] - p2[1]) - rr, m = Math.max(1, Math.floor(L / step));
      for (let k = 1; k < m; k++) { const t = k / m; out.push([p2[0] + (c[0] - p2[0]) * t * (L / (L + rr)), p2[1] + (c[1] - p2[1]) * t * (L / (L + rr))]); }
    }
    return out;
  };
  E.roundPath = function (pts, r = 4) {
    const n = pts.length; let d = '';
    for (let i = 0; i < n; i++) {
      const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
      const la = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, lc = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1, rr = Math.min(r, la * 0.45, lc * 0.45);
      const p0 = [b[0] + (a[0] - b[0]) * rr / la, b[1] + (a[1] - b[1]) * rr / la], p2 = [b[0] + (c[0] - b[0]) * rr / lc, b[1] + (c[1] - b[1]) * rr / lc];
      d += (i ? ' L' : 'M') + f(p0[0]) + ',' + f(p0[1]) + ' Q' + f(b[0]) + ',' + f(b[1]) + ' ' + f(p2[0]) + ',' + f(p2[1]);
    }
    return d + ' Z';
  };
  // jitter + subdivide polygon edges (hand-cut stone / torn paper)
  E.jag = function (pts, rnd, amp = 2, seg = 14, closed = true) {
    const out = [], n = pts.length, m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const a = pts[i], b = pts[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(L / seg));
      const nx = -(b[1] - a[1]) / (L || 1), ny = (b[0] - a[0]) / (L || 1);
      for (let j = 0; j < k; j++) { const t = j / k, o = j === 0 ? 0 : (rnd() - 0.5) * 2 * amp; out.push([a[0] + (b[0] - a[0]) * t + nx * o, a[1] + (b[1] - a[1]) * t + ny * o]); }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  };
  E.ellPts = (cx, cy, rx, ry, n = 48, a0 = 0, a1 = Math.PI * 2) => { const o = []; for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
})(window.PN);
// ---- brush-pen ribbons (§4: shadow side lower-right ×1.4, light side upper-left ×0.7, 筆斷意連 gaps on light side only) ----
(function (PN) {
  const E = PN.env, K = E.K, f = E.f;
  const SQ = Math.SQRT1_2;
  function noiser(rnd) { const a = rnd() * 6.28, b = rnd() * 6.28, fa = 1 + Math.floor(rnd() * 3), fb = 4 + Math.floor(rnd() * 4); return (t) => 0.62 * Math.sin(t * fa * 6.2832 + a) + 0.38 * Math.sin(t * fb * 6.2832 + b); }
  // S: dense samples. o: {closed, color, taper:'mid'|'start'|'end'|'none', shade, wobble, gaps, seed, opacity, min}
  E.ribbon = function (S, w, o = {}) {
    const n = S.length; if (n < 2) return '';
    const closed = !!o.closed, rnd = E.rng(o.seed || (n * 131 + Math.round(S[0][0] * 7 + S[0][1] * 13))), nz = noiser(rnd);
    const sg = closed ? (E.area(S) > 0 ? 1 : -1) : 1, shade = o.shade !== false && closed, wob = o.wobble == null ? 0.16 : o.wobble;
    const taper = o.taper || (closed ? 'none' : 'mid'), minW = o.min == null ? 0.18 : o.min;
    // light-side gaps
    const gapAt = [];
    if (closed && o.gaps) {
      const cands = [];
      for (let i = 0; i < n; i++) { const a = S[(i + n - 1) % n], b = S[(i + 1) % n]; const tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty) || 1; const nx = sg * ty / L, ny = -sg * tx / L; if ((nx + ny) * SQ < -0.55) cands.push(i); }
      for (let g = 0; g < o.gaps && cands.length; g++) gapAt.push(cands[Math.floor(rnd() * cands.length)]);
    }
    const Lp = [], Rp = [];
    for (let i = 0; i < n; i++) {
      const a = closed ? S[(i + n - 1) % n] : S[Math.max(0, i - 1)], b = closed ? S[(i + 1) % n] : S[Math.min(n - 1, i + 1)];
      const tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty) || 1, nx = sg * ty / L, ny = -sg * tx / L;
      const t = closed ? i / n : i / (n - 1);
      let k = 1;
      if (shade) { const s = Math.max(-1, Math.min(1, nx + ny)); k *= s > 0 ? 1 + 0.4 * s : 1 + 0.3 * s; }
      if (!closed) k *= taper === 'mid' ? Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.62) : taper === 'start' ? Math.pow(1 - t, 0.75) : taper === 'end' ? Math.pow(t, 0.75) : (i === 0 || i === n - 1 ? 0.6 : 1);
      k *= 1 + wob * nz(t);
      for (const g of gapAt) { let d = Math.abs(i - g); if (closed) d = Math.min(d, n - d); if (d < 5) k *= 0.12 + 0.88 * (d / 5) * (d / 5); }
      const hw = Math.max(minW, w * k / 2);
      Lp.push([S[i][0] + nx * hw, S[i][1] + ny * hw]); Rp.push([S[i][0] - nx * hw, S[i][1] - ny * hw]);
    }
    const col = o.color || K.ink9, op = o.opacity != null ? ` opacity="${o.opacity}"` : '';
    if (closed) return `<path d="${E.P(Lp)} ${E.P(Rp.reverse())}" fill="${col}" fill-rule="evenodd"${op}/>`;
    return `<path d="${E.P(Lp.concat(Rp.reverse()))}" fill="${col}"${op}/>`;
  };
  // Catmull-Rom densify through control points
  E.cr = function (pts, closed = false, per = 8) {
    const n = pts.length, out = [], m = closed ? n : n - 1;
    const P = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    for (let i = 0; i < m; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  };
  E.crPath = (pts, closed = false, per = 6) => E.P(E.cr(pts, closed, per), closed);
  // quadratic bezier sample
  E.qs = function (x0, y0, x1, y1, x2, y2, n = 20) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2]); } return o; };
  // shortcuts
  E.inkShape = (pts, w, o = {}) => E.ribbon(E.sampleRound(pts, o.r == null ? 3 : o.r, 2.5), w, Object.assign({ closed: true }, o));
  E.inkSmooth = (pts, w, o = {}) => E.ribbon(E.cr(pts, true, o.per || 6), w, Object.assign({ closed: true }, o));
  E.inkEll = (cx, cy, rx, ry, w, o = {}) => E.ribbon(E.ellPts(cx, cy, rx, ry, Math.max(24, Math.round((rx + ry) * 2.2)), o.a0 || 0, o.a1 || Math.PI * 2), w, Object.assign({ closed: o.a1 == null }, o));
  E.inkLine = (pts, w, o = {}) => E.ribbon(pts.length > 2 ? E.cr(pts, false, o.per || 6) : E.qs(pts[0][0], pts[0][1], (pts[0][0] + pts[1][0]) / 2 + (o.bow || 0), (pts[0][1] + pts[1][1]) / 2 + (o.bow || 0), pts[1][0], pts[1][1], 16), w, Object.assign({ closed: false }, o));
  E.inkQ = (x0, y0, x1, y1, x2, y2, w, o = {}) => E.ribbon(E.qs(x0, y0, x1, y1, x2, y2, 20), w, Object.assign({ closed: false }, o));
  // clip helper → {def, url}
  E.clip = function (id, d) { return { def: `<clipPath id="${id}"><path d="${d}"/></clipPath>`, at: `clip-path="url(#${id})"` }; };
  // ink splat (drop cluster) — env decals use tinted colors, never pure ink on the ground
  E.splat = function (cx, cy, r, n, seed, fill) {
    const rnd = E.rng(seed); let o = `<path d="${E.crPath(E.ellPts(cx, cy, r * 0.55, r * 0.5, 9).map((p) => [p[0] + (rnd() - 0.5) * r * 0.3, p[1] + (rnd() - 0.5) * r * 0.3]), true)}"/>`;
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.283, d = r * (0.55 + rnd() * 1.3), rr = r * (0.05 + rnd() * 0.18);
      o += `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d * 0.8)}" r="${f(rr)}"/>`;
      if (rnd() > 0.55) o += E.inkQ(cx, cy, cx + Math.cos(a) * d * 0.5, cy + Math.sin(a) * d * 0.4, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, rr * 1.8, { taper: 'end', color: fill, wobble: 0 });
    }
    return `<g fill="${fill}">${o}</g>`;
  };
})(window.PN);
// ---- flagstone generators (world-hash Voronoi, polar slabs) ----
(function (PN) {
  const E = PN.env, f = E.f;
  function clipHalf(poly, a, b, c) { // keep a*x + b*y <= c
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], dp = a * p[0] + b * p[1] - c, dq = a * q[0] + b * q[1] - c;
      if (dp <= 0) out.push(p);
      if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) { const t = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    return out;
  }
  E.clipHalf = clipHalf;
  const mod = (a, m) => ((a % m) + m) % m;
  // Voronoi slabs over [x0,x1]×[y0,y1] in WORLD coords. o: {cell, sx, sy, jit, seed, period:[pi,pj]}
  E.voronoi = function (x0, y0, x1, y1, o) {
    const cw = o.cell * (o.sx || 1), chh = o.cell * (o.sy || 1), jit = o.jit == null ? 0.85 : o.jit, sd = o.seed || 1, per = o.period;
    const site = (i, j) => {
      const ii = per ? mod(i, per[0]) : i, jj = per ? mod(j, per[1]) : j;
      const off = (o.stagger && (mod(j, 2) === 1)) ? 0.5 : 0;
      return [(i + 0.5 + off + (E.hash(ii, jj, sd) - 0.5) * jit) * cw, (j + 0.5 + (E.hash(ii + 71, jj - 37, sd + 5) - 0.5) * jit) * chh];
    };
    const i0 = Math.floor(x0 / cw) - 1, i1 = Math.floor(x1 / cw) + 1, j0 = Math.floor(y0 / chh) - 1, j1 = Math.floor(y1 / chh) + 1;
    const cells = [];
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const p = site(i, j);
      let poly = [[p[0] - 3 * cw, p[1] - 3 * chh], [p[0] + 3 * cw, p[1] - 3 * chh], [p[0] + 3 * cw, p[1] + 3 * chh], [p[0] - 3 * cw, p[1] + 3 * chh]];
      for (let di = -2; di <= 2; di++) for (let dj = -2; dj <= 2; dj++) {
        if (!di && !dj) continue;
        const q = site(i + di, j + dj), a = q[0] - p[0], b = q[1] - p[1];
        poly = clipHalf(poly, a, b, (q[0] * q[0] + q[1] * q[1] - p[0] * p[0] - p[1] * p[1]) / 2);
        if (poly.length < 3) break;
      }
      if (poly.length < 3) continue;
      const xs = poly.map((v) => v[0]), ys = poly.map((v) => v[1]);
      if (Math.max(...xs) < x0 || Math.min(...xs) > x1 || Math.max(...ys) < y0 || Math.min(...ys) > y1) continue;
      const ii = per ? mod(i, per[0]) : i, jj = per ? mod(j, per[1]) : j;
      cells.push({ pts: poly, site: p, h: E.hash(ii + 13, jj + 29, sd + 11), h2: E.hash(ii - 3, jj + 91, sd + 17), h3: E.hash(ii + 57, jj - 11, sd + 23) });
    }
    return cells;
  };
  // polar slabs around (cx,cy): rings with staggered joints; every rib-th spoke continuous (방사형 리브)
  E.polar = function (cx, cy, rMax, o) {
    const rnd = E.rng(o.seed || 3), cells = [], ribs = o.ribs || 8;
    let r0 = o.r0 || 28, k = 0;
    while (r0 < rMax) {
      const step = (o.step || 64) * (0.9 + rnd() * 0.22), r1 = r0 + step;
      const m = Math.max(1, Math.round((2 * Math.PI * (r0 + step / 2)) / (o.arc || 110) / ribs));
      const N = ribs * m, off = (k % 2) ? 0.5 : 0;
      for (let s = 0; s < N; s++) {
        const bd = (q) => ((q % m === 0) ? q : q + off) / N * 2 * Math.PI, a0 = bd(s), a1 = bd(s + 1);
        const seg = Math.max(2, Math.ceil((a1 - a0) * r1 / 18)), pts = [];
        for (let q = 0; q <= seg; q++) { const a = a0 + (a1 - a0) * q / seg; pts.push([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0]); }
        for (let q = seg; q >= 0; q--) { const a = a0 + (a1 - a0) * q / seg; pts.push([cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]); }
        cells.push({ pts, h: rnd(), h2: rnd(), h3: rnd(), ring: k });
      }
      r0 = r1; k++;
    }
    return cells;
  };
  // irregular rectilinear flagstones (recursive split inside staggered macro blocks; world-hashed → seamless)
  // o: {mw, mh, seed, bias (preferred w/h), min, maxD, period:[pi,pj]}
  E.rectSlabs = function (x0, y0, x1, y1, o) {
    const MW = o.mw, MH = o.mh, sd = o.seed || 1, out = [], per = o.period;
    const j0 = Math.floor(y0 / MH) - 1, j1 = Math.floor(y1 / MH) + 1;
    for (let j = j0; j <= j1; j++) {
      const jj = per ? mod(j, per[1]) : j, shift = (per ? (jj % 2) * 0.5 : E.hash(0, jj, sd + 3)) * MW;
      const i0 = Math.floor((x0 - shift) / MW) - 1, i1 = Math.floor((x1 - shift) / MW) + 1;
      for (let i = i0; i <= i1; i++) {
        const ii = per ? mod(i, per[0]) : i, rnd = E.rng(((ii * 7919) ^ (jj * 104729) ^ (sd * 31)) >>> 0 || 7);
        const stack = [[i * MW + shift, j * MH, MW, MH, 0]];
        while (stack.length) {
          const [x, y, w, h, d] = stack.pop(), r = w / h, bias = o.bias || 1, mn = o.min || 60;
          const canV = w > mn * 1.7, canH = h > mn * 1.5 / bias;
          const stop = d >= (o.maxD || 3) || (!canV && !canH) || (d >= 1 && w * h < (o.bigA || 20000) && rnd() < 0.3);
          if (stop) {
            if (x + w < x0 - 4 || x > x1 + 4 || y + h < y0 - 4 || y > y1 + 4) continue;
            const J = () => (rnd() - 0.5) * 2.2;
            out.push({ pts: [[x + J(), y + J()], [x + w + J(), y + J()], [x + w + J(), y + h + J()], [x + J(), y + h + J()]], site: [x + w / 2, y + h / 2], h: rnd(), h2: rnd(), h3: rnd() });
            continue;
          }
          const vert = canV && (!canH || r > bias * 1.15 || (r > bias / 1.15 && rnd() < 0.5));
          const t = 0.34 + rnd() * 0.32;
          if (vert) stack.push([x, y, w * t, h, d + 1], [x + w * t, y, w * (1 - t), h, d + 1]);
          else stack.push([x, y, w, h * t, d + 1], [x, y + h * t, w, h * (1 - t), d + 1]);
        }
      }
    }
    return out;
  };
  // centroid
  E.cent = (pts) => { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1]; } return [x / pts.length, y / pts.length]; };
  E.shrink = (pts, d) => { const c = E.cent(pts); return pts.map((p) => { const L = Math.hypot(p[0] - c[0], p[1] - c[1]) || 1; const k = Math.max(0.2, 1 - d / L); return [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]; }); };
})(window.PN);
// ---- PN.env.ground(ch, w, h, seed, o) ----
// local box (0,0)-(w,h) = world units at 1x. Seamless: slabs are hashed in WORLD space (o.ox,o.oy offset) → adjacent chunks join.
// o.tile=true makes the patch itself wrap (period = w,h). Joint layout follows the chapter movement axis:
// Ch1 직교 = irregular rectilinear flagstones · Ch2 방사 = polar ribs · Ch3 수평 = long horizontal courses · Ch4 회전 = cut slabs + dial · Ch5 동심 = obsidian facets + rings
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix;
  function slabFill(c, t, b = 0) { t = Math.min(1, t + b); return t < 0.4 ? mix(c.base, c.deep, (0.4 - t) * 0.26) : mix(c.base, c.light, (t - 0.4) * 0.36); }
  function crack(x, y, len, a, rnd, col, w = 0.9) {
    const pts = [[x, y]]; let cx = x, cy = y, ca = a;
    for (let i = 0; i < 4; i++) { ca += (rnd() - 0.5) * 1.1; cx += Math.cos(ca) * len / 4; cy += Math.sin(ca) * len / 4; pts.push([cx, cy]); }
    return E.ribbon(E.cr(pts, false, 4), w, { color: col, taper: 'mid', wobble: 0.3, min: 0.1 });
  }
  let WC = 0;
  E.slabLayer = function (c, cells, p, rnd, o = {}) {
    const joint = mix(c.base, c.deep, o.jointMix == null ? 0.55 : o.jointMix);
    let s = '', det = '';
    for (const cl of cells) {
      const pts = E.jag(cl.pts, rnd, o.jagAmp == null ? 0.9 : o.jagAmp, 16);
      const tone = slabFill(c, cl.h, o.lift || 0);
      s += `<path d="${E.roundPath(pts, o.round == null ? 4 : o.round)}" fill="${tone}" stroke="${joint}" stroke-width="1.5" stroke-linejoin="round"/>`;
      const cc = E.cent(cl.pts);
      if (o.facet && cl.pts.length > 3) { // obsidian cleavage: darker lower-right facet + light facet edge
        const a = -0.6 + cl.h2 * 1.2 + Math.PI / 4, nx = Math.cos(a), ny = Math.sin(a), cc2 = nx * cc[0] + ny * cc[1] + (cl.h3 - 0.5) * 20;
        const half = E.clipHalf(E.shrink(pts, 1.2), -nx, -ny, -cc2);
        if (half.length > 2) s += `<path d="${E.P(half)}" fill="${c.deep}" opacity="0.1"/>`;
      }
      if (cl.h2 < (o.crackP == null ? 0.18 : o.crackP)) det += crack(cc[0] + (cl.h3 - 0.5) * 30, cc[1] + (cl.h - 0.5) * 24, 22 + cl.h3 * 26, cl.h2 * 40, rnd, mix(c.base, c.deep, 0.6));
      if (o.wear && cl.h2 > 0.8) { // weathering blob of 20% tone.dot hugging a corner
        const id = p + 'wc' + (WC++), v = pts[Math.floor(cl.h3 * pts.length) % pts.length], R = 12 + cl.h * 16;
        const blob = E.ellPts(v[0] + (cc[0] - v[0]) * 0.3, v[1] + (cc[1] - v[1]) * 0.3, R * 1.3, R, 8).map((q) => [q[0] + (rnd() - 0.5) * R * 0.6, q[1] + (rnd() - 0.5) * R * 0.5]);
        det += `<clipPath id="${id}"><path d="${E.P(E.shrink(cl.pts, 4))}"/></clipPath><path d="${E.crPath(blob, true)}" fill="url(#${p}wd20)" clip-path="url(#${id})"/>`;
      }
    }
    return s + det;
  };
  // engraved line (음각): dark groove + light lip offset down-right (≤1.35 local)
  E.engrave = (d, c, w = 1.5, extra = '') => `<path d="${d}" fill="none" stroke="${mix(c.base, c.light, 0.7)}" stroke-width="${w}" transform="translate(0.9,1.1)" ${extra}/><path d="${d}" fill="none" stroke="${mix(c.base, c.deep, 0.6)}" stroke-width="${w}" ${extra}/>`;
  E.ground = function (ch, w, h, seed = 1, o = {}) {
    const c = E.CH[ch], p = E.uid(), rnd = E.rng(seed * 97 + ch), ox = o.ox || 0, oy = o.oy || 0;
    const defs = [`<clipPath id="${p}cl"><rect width="${w}" height="${h}"/></clipPath>`, E.grainDef(p + 'gr', seed + ch), E.roughDef(p + 'rf', 3, 0.04, seed)];
    defs.push(E.dotDefs(p + 'w', mix(c.base, c.deep, 0.72), 5));
    const shiftC = (cs) => { cs.forEach((cl) => { cl.pts = cl.pts.map((q) => [q[0] - ox, q[1] - oy]); if (cl.site) cl.site = [cl.site[0] - ox, cl.site[1] - oy]; }); return cs; };
    const vo = (cell, sx = 1, sy = 1, jit = 0.85) => {
      let cv = cell, sxv = sx, syv = sy, per = null;
      if (o.tile) { per = [Math.max(1, Math.round(w / (cell * sx))), Math.max(1, Math.round(h / (cell * sy)))]; cv = w / per[0]; sxv = 1; syv = (h / per[1]) / cv; }
      return shiftC(E.voronoi(ox - 8, oy - 8, ox + w + 8, oy + h + 8, { cell: cv, sx: sxv, sy: syv, jit, seed: seed * 13 + ch, period: per }));
    };
    const rs = (mw, mh, bias, min, maxD) => {
      let per = null;
      if (o.tile) { per = [Math.max(1, Math.round(w / mw)), Math.max(2, 2 * Math.round(h / mh / 2))]; mw = w / per[0]; mh = h / per[1]; }
      return shiftC(E.rectSlabs(ox - 8, oy - 8, ox + w + 8, oy + h + 8, { mw, mh, bias, min, maxD, seed: seed * 17 + ch, period: per }));
    };
    const rsRot = (mw, mh, bias, min, maxD, th) => { // rect slabs in a frame rotated by th about WORLD origin (Ch4 회전)
      const ca = Math.cos(th), sa = Math.sin(th), corners = [[ox, oy], [ox + w, oy], [ox + w, oy + h], [ox, oy + h]].map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
      const xs = corners.map((q) => q[0]), ys = corners.map((q) => q[1]);
      const cs = E.rectSlabs(Math.min(...xs) - 8, Math.min(...ys) - 8, Math.max(...xs) + 8, Math.max(...ys) + 8, { mw, mh, bias, min, maxD, seed: seed * 19 + ch });
      cs.forEach((cl) => { cl.pts = cl.pts.map(([u, v]) => [u * ca - v * sa, u * sa + v * ca]); cl.site = [cl.site[0] * ca - cl.site[1] * sa, cl.site[0] * sa + cl.site[1] * ca]; });
      return shiftC(cs);
    };
    let body = `<rect x="-2" y="-2" width="${w + 4}" height="${h + 4}" fill="${mix(c.base, c.deep, 0.55)}"/>`;
    const ctr = o.center === null ? null : (o.center || [w * 0.5, h * 0.5]);
    const dec = o.decals !== false;
    if (ch === 1) {
      body += E.slabLayer(c, rs(310, 260, 1.2, 56, 4), p, rnd, { wear: true, crackP: 0.22, round: 3, jagAmp: 1.1 });
      if (dec) body += E.ch1Decals(c, w, h, rnd, p, o);
    } else if (ch === 2) {
      const cs = ctr ? E.polar(ctr[0], ctr[1], Math.hypot(w, h) * 1.1, { seed: seed + 5, step: 66, arc: 108, ribs: 8, r0: 30 }) : vo(110, 1, 1, 0.6);
      body += E.slabLayer(c, cs, p, rnd, { wear: true, round: 2.5, jagAmp: 0.5, crackP: 0.1 });
      if (ctr) body += E.ch2Ribs(c, ctr, Math.hypot(w, h) * 1.1, p);
      if (dec) body += E.ch2Decals(c, w, h, rnd, p, o, ctr);
    } else if (ch === 3) {
      body += E.slabLayer(c, rs(330, 124, 2.9, 44, 3), p, rnd, { wear: true, round: 3.5, crackP: 0.14, jagAmp: 1.2 });
      if (dec) body += E.ch3Decals(c, w, h, rnd, p, o);
    } else if (ch === 4) {
      body += E.slabLayer(c, rsRot(280, 240, 1.1, 58, 4, -0.26), p, rnd, { wear: true, crackP: 0.16, round: 3 });
      if (dec) body += E.ch4Decals(c, w, h, rnd, p, o, ctr);
    } else {
      body += E.slabLayer(c, vo(126, 1.1, 1.0, 0.7), p, rnd, { wear: false, round: 1.2, jagAmp: 0.35, crackP: 0.08, facet: true, lift: 0.56 });
      if (dec) body += E.ch5Decals(c, w, h, rnd, p, o, ctr);
    }
    body += `<rect width="${w}" height="${h}" filter="url(#${p}gr)" opacity="0.055"/>`;
    return `<g class="pn-ground ch${ch}"><defs>${defs.join('')}</defs><g clip-path="url(#${p}cl)">${body}</g></g>`;
  };
})(window.PN);
// ---- ground decals per chapter (all ≤ 1.35:1 vs base: mix toward deep ≤ 0.62; one wet highlight allowed in Ch3) ----
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix;
  const D = (c, t) => mix(c.base, c.deep, t), Lt = (c, t) => mix(c.base, c.light, t);
  function torn(cx, cy, w, h, a, rnd, amp = 2.4) {
    const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
    return E.jag(pts, rnd, amp, 6);
  }
  E.torn = torn;
  // Ch1 — drain gutter, fallen posters, ink puddle
  E.ch1Decals = function (c, w, h, rnd, p, o) {
    let s = '';
    const dy = o.drainY == null ? h * 0.72 : o.drainY;
    if (dy !== false) {
      const edge = E.jag([[-10, dy], [w + 10, dy + 3]], rnd, 0.8, 18, false);
      const pts = edge.concat(edge.slice().reverse().map((q) => [q[0], q[1] + 9]));
      s += `<path d="${E.P(pts)}" fill="${D(c, 0.42)}"/>`;
      s += E.ribbon(edge, 1.6, { color: D(c, 0.62), taper: 'none', wobble: 0.25 });
      s += E.ribbon(edge.map((q) => [q[0], q[1] + 9.5]), 1.1, { color: Lt(c, 0.55), taper: 'none', wobble: 0.2 });
      for (let x = 20 + rnd() * 20; x < w; x += 56 + rnd() * 20) s += `<rect x="${f(x)}" y="${f(dy + 2.2 + x * 3 / w)}" width="11" height="4.6" rx="1" fill="${D(c, 0.6)}"/>`;
      // ink wash trickling along the gutter
      s += `<g filter="url(#${p}rf)">${E.ribbon(E.cr([[w * 0.08, dy + 5], [w * 0.3, dy + 4.2], [w * 0.55, dy + 5.4], [w * 0.8, dy + 5]], false, 8), 4.2, { color: D(c, 0.6), taper: 'mid', wobble: 0.4 })}</g>`;
    }
    const posters = o.posters || [[w * 0.2, h * 0.3, 34, 44, -0.35], [w * 0.74, h * 0.52, 28, 36, 0.5], [w * 0.52, h * 0.9, 38, 26, 0.12]];
    for (const [x, y, pw, ph, a] of posters) {
      const pts = torn(x, y, pw, ph, a, rnd);
      s += `<path d="${E.P(pts)}" fill="${D(c, 0.24)}" stroke="${D(c, 0.4)}" stroke-width="1"/>`;
      const ca = Math.cos(a), sa = Math.sin(a), T = (u, v) => [x + u * ca - v * sa, y + u * sa + v * ca];
      s += `<path d="${E.P([T(-pw * 0.32, -ph * 0.32), T(pw * 0.1, -ph * 0.32), T(pw * 0.1, -ph * 0.05), T(-pw * 0.32, -ph * 0.05)])}" fill="${D(c, 0.5)}"/>`;
      for (let k = 0; k < 3; k++) s += `<path d="${E.P([T(-pw * 0.32, ph * (0.06 + k * 0.12)), T(pw * (0.3 - k * 0.12), ph * (0.06 + k * 0.12))], false)}" stroke="${D(c, 0.46)}" stroke-width="2"/>`;
    }
    const pu = o.puddle || [w * 0.8, h * 0.18, 20];
    if (pu) {
      const [x, y, r] = pu, blob = E.ellPts(x, y, r * 1.3, r * 0.8, 10).map((q) => [q[0] + (rnd() - 0.5) * r * 0.5, q[1] + (rnd() - 0.5) * r * 0.4]);
      s += `<g filter="url(#${p}rf)"><path d="${E.crPath(blob, true)}" fill="${D(c, 0.4)}"/><path d="${E.crPath(E.shrink(blob, r * 0.35), true)}" fill="${D(c, 0.56)}"/>${E.splat(x + r * 1.5, y + r * 0.3, r * 0.3, 7, 11, D(c, 0.45))}</g>`;
    }
    return s;
  };
  // Ch2 — radial ribs + centre rosette; rose-window halftone light; wax drips
  E.ch2Ribs = function (c, ctr, R, p) {
    let s = ''; const [cx, cy] = ctr;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, ux = Math.cos(a), uy = Math.sin(a), nx = -uy * 3.2, ny = ux * 3.2;
      const x0 = cx + ux * 30, y0 = cy + uy * 30, x1 = cx + ux * R, y1 = cy + uy * R;
      s += `<path d="M ${f(x0 + nx)},${f(y0 + ny)} L ${f(x1 + nx)},${f(y1 + ny)} L ${f(x1 - nx)},${f(y1 - ny)} L ${f(x0 - nx)},${f(y0 - ny)} Z" fill="${Lt(c, 0.35)}" stroke="${D(c, 0.6)}" stroke-width="1.4"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="30" fill="${Lt(c, 0.2)}" stroke="${D(c, 0.6)}" stroke-width="1.6"/>`;
    let ros = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; ros += `<path d="${E.crPath([[cx, cy], [cx + Math.cos(a - 0.3) * 14, cy + Math.sin(a - 0.3) * 14], [cx + Math.cos(a) * 24, cy + Math.sin(a) * 24], [cx + Math.cos(a + 0.3) * 14, cy + Math.sin(a + 0.3) * 14]], true, 4)}"/>`; }
    s += `<g fill="none" stroke="${D(c, 0.55)}" stroke-width="1.2">${ros}<circle cx="${cx}" cy="${cy}" r="24"/></g>`;
    return s;
  };
  // rose-window light pool: the stone tracery's SHADOW is 40 % halftone (ground-tone dots, ≤ 1.35:1), the glass lets lighter duotone through.
  // Projected as an ellipse (light from a high window, upper-left). Scale it BIG (R ≈ 0.45 × patch) so it reads at thumbnail size.
  E.roseLight = function (c, x, y, R, p, rot = 0) {
    const id = p + 'rm' + Math.round(x * 3 + y), T = `transform="translate(${f(x)},${f(y)}) rotate(-24) scale(1,0.74) translate(${f(-x)},${f(-y)})"`;
    const Pc = (r, a) => [x + Math.cos(a) * r, y + Math.sin(a) * r];
    let lit = `<circle cx="${x}" cy="${y}" r="${f(R * 0.1)}"/>`;
    for (let i = 0; i < 12; i++) { // lancet petals
      const a = rot + i * Math.PI / 6;
      lit += `<path d="${E.crPath([Pc(R * 0.2, a), Pc(R * 0.34, a - 0.16), Pc(R * 0.56, a - 0.1), Pc(R * 0.64, a), Pc(R * 0.56, a + 0.1), Pc(R * 0.34, a + 0.16)], true, 5)}"/>`;
      const b = a + Math.PI / 12; lit += `<circle cx="${f(Pc(R * 0.8, b)[0])}" cy="${f(Pc(R * 0.8, b)[1])}" r="${f(R * 0.075)}"/>`;
      lit += `<path d="${E.crPath([Pc(R * 0.7, a - 0.06), Pc(R * 0.9, a - 0.035), Pc(R * 0.93, a), Pc(R * 0.9, a + 0.035), Pc(R * 0.7, a + 0.06)], true, 4)}"/>`;
    }
    for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3 + Math.PI / 6; lit += `<path d="${E.crPath([Pc(R * 0.03, a), Pc(R * 0.12, a - 0.4), Pc(R * 0.17, a), Pc(R * 0.12, a + 0.4)], true, 4)}"/>`; }
    return `<mask id="${id}"><g ${T}><circle cx="${x}" cy="${y}" r="${R}" fill="#fff"/><g fill="#000">${lit}</g></g></mask>
      <rect x="${x - R * 1.3}" y="${y - R * 1.3}" width="${2.6 * R}" height="${2.6 * R}" fill="url(#${p}wd40)" mask="url(#${id})"/>
      <g ${T}><g fill="${Lt(c, 0.74)}">${lit}</g><circle cx="${x}" cy="${y}" r="${R}" fill="none" stroke="${D(c, 0.45)}" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="${f(R * 0.97)}" fill="none" stroke="${Lt(c, 0.5)}" stroke-width="1"/></g>`;
  };
  E.ch2Decals = function (c, w, h, rnd, p, o, ctr) {
    let s = '';
    const rs = o.rose === undefined ? [w * 0.5, h * 0.62, Math.min(w, h) * 0.46] : o.rose;
    if (rs) s += E.roseLight(c, rs[0], rs[1], rs[2], p, 0.2);
    const wax = o.wax || [[w * 0.78, h * 0.26], [w * 0.14, h * 0.5]];
    for (const [x, y] of wax) for (let k = 0; k < 5; k++) { const r = 2 + rnd() * 4; s += `<ellipse cx="${f(x + (rnd() - 0.5) * 22)}" cy="${f(y + (rnd() - 0.5) * 14)}" rx="${f(r)}" ry="${f(r * 0.8)}" fill="${D(c, 0.38)}" stroke="${D(c, 0.5)}" stroke-width="0.8"/>`; }
    return s;
  };
  // Ch3 — horizontal shallow channel (ink-wash flow lines, reflections, ONE wet highlight), moss & barnacles
  E.ch3Decals = function (c, w, h, rnd, p, o) {
    let s = '';
    const cy = o.canalY == null ? h * 0.56 : o.canalY, hh = o.canalH || 40; // canal = continuous horizontal channel, 2·hh tall (70–90 px)
    if (cy !== false) {
      const y0 = cy - hh, y1 = cy + hh, deep = c.deep, lip = Lt(c, 0.85);
      // water: smooth flat ink wash (NO slab joints inside — reads through texture/shape, not value)
      s += `<rect x="-10" y="${f(y0)}" width="${w + 20}" height="${f(2 * hh)}" fill="${D(c, 0.36)}"/>`;
      s += `<rect x="-10" y="${f(y0 + 3)}" width="${w + 20}" height="7" fill="url(#${p}wd20)"/>`; // curb shadow on the water
      // curbs on both banks: 3 px spot-free lip + 1.5 px deep joint line, curb stones every ~40 px
      [[y0, -1], [y1, 1]].forEach(([yy, sg]) => {
        const edge = E.jag([[-10, yy], [w + 10, yy]], rnd, 0.5, 26, false), cw = 9;
        // curb-stone strip on the bank (light band, stone joints), then the water-side joint (deep α.55) and 3 px spot-free lip
        s += `<path d="${E.P(edge.concat(edge.slice().reverse().map(([x, y]) => [x, y + sg * cw])))}" fill="${Lt(c, 0.32)}"/>`;
        for (let x = 10 + rnd() * 20; x < w; x += 30 + rnd() * 18) s += `<path d="M ${f(x)},${f(yy + sg * 1.5)} L ${f(x + (rnd() - 0.5) * 1.5)},${f(yy + sg * cw)}" stroke="${D(c, 0.5)}" stroke-width="1.5"/>`;
        s += E.ribbon(edge.map(([x, y]) => [x, y + sg * cw]), 1.5, { color: D(c, 0.5), taper: 'none', wobble: 0.1 });
        s += E.ribbon(edge.map(([x, y]) => [x, y + sg * 2]), 3, { color: lip, taper: 'none', wobble: 0.1 });
        s += E.ribbon(edge, 1.5, { color: deep, taper: 'none', wobble: 0.1, opacity: 0.55 });
      });
      // 4 long flow lines, varied length, broken, with small curls at their ends
      const flow = mix(c.base, mix(c.deep, K.ink5, 0.2), 0.56);
      const lines = [[0.28, -0.1, 0.62], [0.5, 0.25, 0.95], [0.7, -0.05, 0.4], [0.84, 0.45, 0.85]];
      lines.forEach(([ty, xa, xb], k) => {
        const yy = y0 + 2 * hh * ty, xs = w * xa, xe = w * xb, br = xs + (xe - xs) * (0.45 + rnd() * 0.2);
        [[xs, br - 5], [br + 6, xe]].forEach(([u0, u1], j) => {
          const L = u1 - u0; if (L < 12) return;
          s += E.ribbon(E.cr([[u0, yy], [u0 + L * 0.3, yy - 2.6], [u0 + L * 0.62, yy + 2], [u1, yy - 0.4]], false, 8), 3.4 - (k % 2) * 0.7, { color: flow, taper: 'mid', wobble: 0.3 });
          if (j === 1) s += E.ribbon(E.cr([[u1 - 1, yy - 0.4], [u1 + 4, yy - 3], [u1 + 2, yy - 6.4], [u1 - 2, yy - 4.4]], false, 6), 2.2, { color: flow, taper: 'end', wobble: 0 });
        });
      });
      // reflections of the curb posts (short vertical ink-wash bars) + the ONE white glint
      for (let k = 0; k < 3; k++) { const x = w * (0.18 + k * 0.31) + rnd() * 16; for (let q = 0; q < 3; q++) s += `<rect x="${f(x + (rnd() - 0.5) * 3)}" y="${f(y0 + 10 + q * 10)}" width="${f(2.4 - q * 0.6)}" height="${f(6 - q * 1.4)}" fill="${D(c, 0.55)}"/>`; }
      if (o.highlight !== false) s += `<path d="M ${f(w * 0.6)},${f(cy - hh * 0.36)} q 3,-1.6 6,0 q -3,1.4 -6,0 Z" fill="${K.p50}"/>`;
      for (let k = 0; k < 10; k++) s += `<circle cx="${f(rnd() * w)}" cy="${f((rnd() > 0.5 ? y0 - 10 : y1 + 10) + (rnd() - 0.5) * 4)}" r="${f(1.3 + rnd() * 1.3)}" fill="none" stroke="${D(c, 0.58)}" stroke-width="1"/>`;
    }
    for (let k = 0; k < 4; k++) { // moss specks on the paving
      const x = rnd() * w, y = rnd() * h; if (cy !== false && Math.abs(y - cy) < hh + 8) continue;
      for (let q = 0; q < 9; q++) s += `<circle cx="${f(x + (rnd() - 0.5) * 18)}" cy="${f(y + (rnd() - 0.5) * 10)}" r="${f(0.8 + rnd() * 1.4)}" fill="${D(c, 0.5)}"/>`;
    }
    return s;
  };
  // Ch4 — engraved dial ring (plaza), gear-inlaid slabs, rust bleed
  E.gearPath = function (cx, cy, r, n, tooth = 0.18, rot = 0) {
    const pts = [];
    for (let i = 0; i < n; i++) { const a = rot + i * 2 * Math.PI / n, d = Math.PI / n * 0.55; pts.push([cx + Math.cos(a - d) * r, cy + Math.sin(a - d) * r], [cx + Math.cos(a - d * 0.6) * r * (1 + tooth), cy + Math.sin(a - d * 0.6) * r * (1 + tooth)], [cx + Math.cos(a + d * 0.6) * r * (1 + tooth), cy + Math.sin(a + d * 0.6) * r * (1 + tooth)], [cx + Math.cos(a + d) * r, cy + Math.sin(a + d) * r]); }
    return pts;
  };
  // engraved band (ring channel): subtle D-tone fill between two grooves — BIG shape, low contrast
  E.ringBand = (c, cx, cy, r0, r1, fill) => { const cd = (r) => `M ${f(cx - r)},${f(cy)} a ${f(r)},${f(r)} 0 1 0 ${f(2 * r)},0 a ${f(r)},${f(r)} 0 1 0 ${f(-2 * r)},0 Z`; return `<path d="${cd(r1)} ${cd(r0)}" fill="${fill}" fill-rule="evenodd"/>` + E.engrave(cd(r1), c, 1.6) + E.engrave(cd(r0), c, 1.4); };
  E.ch4Decals = function (c, w, h, rnd, p, o, ctr) {
    let s = '';
    if (ctr) { // plaza-scale dial: ring band + 60 ticks + 12 engraved hour wedges running round the patch (≥ 200 px across)
      const [cx, cy] = ctr, R = o.dialR || Math.max(104, Math.min(w, h) * 0.42);
      s += E.ringBand(c, cx, cy, R - 30, R, D(c, 0.22));
      s += E.engrave(`M ${f(cx - R - 10)},${f(cy)} a ${f(R + 10)},${f(R + 10)} 0 1 0 ${f(2 * R + 20)},0 a ${f(R + 10)},${f(R + 10)} 0 1 0 ${f(-2 * R - 20)},0`, c, 1.2);
      let tk = ''; for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, big = i % 5 === 0, r0 = big ? R + 1 : R + 3, r1 = big ? R + 10 : R + 7; tk += `M ${f(cx + Math.cos(a) * r0)},${f(cy + Math.sin(a) * r0)} L ${f(cx + Math.cos(a) * r1)},${f(cy + Math.sin(a) * r1)} `; }
      s += E.engrave(tk, c, 1.5);
      // K5-G8: hour marks are engraved WEDGES pointing at the centre (no numerals, no font). 3·6·9 are 1.6× longer and 1.5× wider;
      // 12 is a broad triangle pointing inward. Centred on the old numeral radius R − 15.
      for (let i = 0; i < 12; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 6, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux, rr = R - 15;
        const big = i % 3 === 0, Lw = big ? 16 : 10, hw = i === 0 ? 7 : (big ? 3.3 : 2.2);
        const tip = [cx + ux * (rr - Lw / 2), cy + uy * (rr - Lw / 2)], bo = [cx + ux * (rr + Lw / 2), cy + uy * (rr + Lw / 2)];
        const wd = E.P([tip, [bo[0] + nx * hw, bo[1] + ny * hw], [bo[0] - nx * hw, bo[1] - ny * hw]]);
        s += E.engrave(wd, c, 1.2) + `<path d="${wd}" fill="${D(c, 0.6)}"/>`;
      }
      s += E.engrave(`M ${f(cx - 16)},${f(cy)} a 16,16 0 1 0 32,0 a 16,16 0 1 0 -32,0`, c, 1.4);
    }
    const gears = o.gears || [[w * 0.18, h * 0.16, 20, 10], [w * 0.84, h * 0.86, 15, 8]];
    for (const [x, y, r, n] of gears) {
      s += `<g filter="url(#${p}rf)"><path d="${E.crPath(E.ellPts(x + r * 0.5, y + r * 0.7, r * 1.6, r * 1.1, 9).map((q) => [q[0] + (rnd() - 0.5) * r * 0.5, q[1] + (rnd() - 0.5) * r * 0.5]), true)}" fill="${D(c, 0.3)}" opacity="0.8"/></g>`;
      s += E.engrave(E.P(E.gearPath(x, y, r, n, 0.22, rnd())), c, 1.4) + E.engrave(`M ${x - r * 0.35},${y} a ${r * 0.35},${r * 0.35} 0 1 0 ${r * 0.7},0 a ${r * 0.35},${r * 0.35} 0 1 0 ${-r * 0.7},0`, c, 1.2);
    }
    return s;
  };
  // Ch5 — concentric eclipse rings, obsidian sheen streaks, torn paper gaps (lighter, harmless)
  // Ch5 — concentric eclipse ring BANDS (center may sit off-patch: o.ringC, radii o.rings), obsidian sheens, torn paper rips (env.ch5.light, harmless)
  E.ch5Decals = function (c, w, h, rnd, p, o, ctr) {
    let s = '';
    const rc = o.ringC || ctr;
    if (rc) {
      const [cx, cy] = rc, R = o.ringR || Math.min(w, h) * 0.44, radii = o.rings || [R, R * 0.56];
      radii.forEach((r, i) => { s += E.ringBand(c, cx, cy, r - (i ? 12 : 18), r, D(c, i % 2 ? 0.22 : 0.14)); });
      let dots = ''; const r0 = radii[0] - 9, n = Math.round(r0 * 0.25);
      for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n; dots += `<circle cx="${f(cx + Math.cos(a) * r0)}" cy="${f(cy + Math.sin(a) * r0)}" r="1.6"/>`; }
      s += `<g fill="${Lt(c, 0.6)}">${dots}</g>`;
      if (!o.ringC) { const r2 = radii[radii.length - 1] - 6; s += E.engrave(`M ${cx - r2 * 0.7},${cy - r2 * 0.71} A ${r2 * 0.95},${r2 * 0.95} 0 0 1 ${cx - r2 * 0.7},${cy + r2 * 0.71}`, c, 1.4); }
    }
    const sheens = o.sheens || [[w * 0.22, h * 0.2], [w * 0.7, h * 0.34], [w * 0.4, h * 0.82], [w * 0.88, h * 0.7]];
    for (const [x, y] of sheens) { const L = 22 + rnd() * 18; s += E.inkQ(x, y, x + L * 0.5, y - L * 0.5 - 2, x + L, y - L, 3.4, { color: Lt(c, 0.82), taper: 'mid', wobble: 0.1 }); }
    const gaps = o.gaps || [[w * 0.66, h * 0.12, 70, 10, 0.28], [w * 0.16, h * 0.64, 52, 8, -0.5]];
    for (const [x, y, gw, gh, a] of gaps) { // torn rip (lens) — lighter paper under the manuscript, torn-edge shadow on the lower lip, fibres
      const top = [], bot = [], n = Math.max(9, Math.round(gw / 7));
      for (let i = 0; i <= n; i++) { const t = i / n, u = (t - 0.5) * gw, k = Math.pow(Math.sin(Math.PI * t), 0.8); top.push([u, -gh * 0.5 * k - (i % 2 ? rnd() * 2.6 : 0)]); bot.push([u, gh * 0.5 * k * (0.55 + rnd() * 0.5)]); }
      const R2 = ([u, v]) => [x + u * Math.cos(a) - v * Math.sin(a), y + u * Math.sin(a) + v * Math.cos(a)];
      const pts = top.concat(bot.slice().reverse()).map(R2);
      s += `<path d="${E.P(pts.map((q) => [q[0] + 1.1, q[1] + 1.6]))}" fill="${D(c, 0.5)}"/><path d="${E.P(pts)}" fill="${Lt(c, 0.8)}"/>`;
      s += `<path d="${E.P(top.map(R2), false)}" fill="none" stroke="${D(c, 0.62)}" stroke-width="1.2"/>`;
      for (let q = 0; q < Math.round(gw / 14) - 1; q++) { const t = Math.min(0.9, 0.12 + q * 14 / gw), u = (t - 0.5) * gw, v = -gh * 0.5 * Math.pow(Math.sin(Math.PI * t), 0.8) - 1; const [px, py] = R2([u, v]); s += `<path d="M ${f(px)},${f(py)} l ${f(-1 + rnd() * 2)},${f(-2 - rnd() * 2)}" stroke="${Lt(c, 0.7)}" stroke-width="0.8"/>`; }
    }
    return s;
  };
})(window.PN);
// ---- prop kit: 3/4 blocks (§11: top = env.light, front = base + dot20, cast shadow lower-right = dot40), brush outlines (§4) ----
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix;
  E.HERO_H = 64;          // PN.heroKit.SPRITE.height — every prop height is measured against this
  E.PROP_MAX = 0.45;      // knee–waist rule: vertical front face ≤ 0.45 × hero (≈ 28.8 px @1x) until the occlusion rule changes (§11)
  const SQ = Math.SQRT1_2;
  // ---- brush-pen silhouette stroke (§4) -------------------------------------------------------
  // pts: polygon corners (or dense samples with o.dense). Weight follows the outward normal:
  // shadow side (lower-right) → w·1.4 (≈3.5 @ w2.5), light side (upper-left) → w·0.72 (≈1.8).
  // The loop is split into 2–3 open strokes whose ends taper to a point; breaks are placed ONLY on the
  // upper-left light side (1–2 real gaps + overlapping 筆斷意連 joins). The bottom / footprint edge is never broken.
  E.brushOut = function (pts, o = {}) {
    const w = o.w || 2.5, col = o.color || K.ink9;
    let S = o.dense ? pts.slice() : (o.smooth ? E.cr(pts, true, 7) : E.sampleRound(pts, o.r == null ? 0.9 : o.r, 2));
    S = S.filter((q, i) => { const p = S[(i + S.length - 1) % S.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.05; });
    const n = S.length; if (n < 4) return '';
    const sg = E.area(S) > 0 ? 1 : -1, rnd = E.rng(o.seed || (n * 71 + Math.round(S[0][0] * 5 + S[0][1] * 11)));
    // per-sample outward normal, shade s∈[-1,1] (+ = lower-right), arc length
    const N = [], sh = [], arc = [0];
    let yMax = -1e9; S.forEach((q) => { yMax = Math.max(yMax, q[1]); });
    for (let i = 0; i < n; i++) {
      const a = S[(i + n - 1) % n], b = S[(i + 1) % n], tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty) || 1;
      const nx = sg * ty / L, ny = -sg * tx / L; N.push([nx, ny]); sh.push(Math.max(-1, Math.min(1, (nx + ny) * SQ)));
      if (i) arc.push(arc[i - 1] + Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]));
    }
    const total = arc[n - 1] + Math.hypot(S[0][0] - S[n - 1][0], S[0][1] - S[n - 1][1]);
    const wAt = (i) => { const s = sh[i]; return w * (s > 0 ? 1 + 0.4 * s : 1 + 0.28 * s) * (1 + (o.wobble == null ? 0.1 : o.wobble) * Math.sin(arc[i] * 0.21 + 1.3)); };
    // break candidates: light side, normal facing up/left, away from the lowest (footprint) edge
    const cand = []; for (let i = 0; i < n; i++) if (sh[i] < -0.45 && N[i][1] < 0.2 && S[i][1] < yMax - 3) cand.push(i);
    if (!cand.length || total < 40 || o.gaps === -1) return E.ribbon(S, w, { closed: true, color: col, wobble: 0.1, seed: o.seed });
    const nb = o.strokes || (total > 220 ? 3 : 2), nGap = o.gaps == null ? 1 : o.gaps;
    const sep = (i, j) => { const d = Math.abs(arc[i] - arc[j]); return Math.min(d, total - d); };
    const br = [];
    for (let t = 0; t < 40 && br.length < nb; t++) { const i = cand[Math.floor(rnd() * cand.length)]; if (br.every((j) => sep(i, j) > Math.min(40, total / (nb + 1)))) br.push(i); }
    // strokes that cannot break on the light side join on the shadow side is NOT allowed: fall back to joins inside candidates only
    br.sort((a, b) => a - b);
    const type = br.map((_, k) => (k < nGap ? 'gap' : 'join'));
    const gapN = 1, ovN = 3, tLen = o.taper || 7;
    let out = '';
    for (let k = 0; k < br.length; k++) {
      const last = k + 1 === br.length, nxt = last ? br[0] + n : br[k + 1], tn = last ? type[0] : type[k + 1];
      const a = br[k] + (type[k] === 'gap' ? gapN : -ovN), b = nxt - (tn === 'gap' ? gapN : -ovN);
      const idx = []; for (let i = a; i <= b; i++) idx.push(((i % n) + n) % n);
      if (idx.length < 3) continue;
      const L = [], R = []; let acc = 0; const lens = [0];
      for (let j = 1; j < idx.length; j++) { acc += Math.hypot(S[idx[j]][0] - S[idx[j - 1]][0], S[idx[j]][1] - S[idx[j - 1]][1]); lens.push(acc); }
      for (let j = 0; j < idx.length; j++) {
        const i = idx[j], d0 = lens[j], d1 = acc - lens[j];
        const tp = Math.min(1, Math.min(d0, d1) / tLen), ease = tp * tp * (3 - 2 * tp);
        const hw = Math.max(0.12, wAt(i) * (0.08 + 0.92 * ease) / 2), [nx, ny] = N[i];
        // weight grows outward on the shadow side; a join's entering tip is lifted 0.7px outward (筆斷意連)
        const off = (sh[i] > 0 ? sh[i] * w * 0.18 : 0) + (d0 < tLen && type[k] === 'join' ? 0.7 * (1 - ease) : 0);
        L.push([S[i][0] + nx * (hw + off), S[i][1] + ny * (hw + off)]); R.push([S[i][0] - nx * (hw - off), S[i][1] - ny * (hw - off)]);
      }
      out += `<path d="${E.P(L.concat(R.reverse()))}" fill="${col}"/>`;
    }
    return out;
  };
  // context per prop call: unique id prefix + collected defs
  E.ctx = function (ch, seed = 1) {
    const c = E.CH[ch], p = E.uid(), defs = [E.dotDefs(p, K.ink9, 5), E.dotDefs(p + 'e', mix(c.deep, K.ink7, 0.35), 5)];
    let n = 0;
    const X = {
      c, p, defs, rnd: E.rng(seed * 131 + ch * 7), meta: {},
      d20: `url(#${p}d20)`, d40: `url(#${p}d40)`, d60: `url(#${p}d60)`, e20: `url(#${p}ed20)`, e40: `url(#${p}ed40)`,
      clipped(d, inner) { const id = p + 'k' + (n++); defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); return `<g clip-path="url(#${id})">${inner}</g>`; },
      face(pts, fill, inner = '', r = 1) { const d = r ? E.roundPath(pts, r) : E.P(pts); return `<path d="${d}" fill="${fill}"/>` + (inner ? X.clipped(d, inner) : ''); },
      faceD(d, fill, inner = '') { return `<path d="${d}" fill="${fill}"/>` + (inner ? X.clipped(d, inner) : ''); },
      // outer silhouette: brush-pen (tapered, shadow-weighted, light-side breaks)
      out(pts, w = 2.5, o = {}) { return E.brushOut(pts, Object.assign({ w, seed: n++ * 17 + 3 }, o)); },
      outSm(pts, w = 2.5, o = {}) { return E.brushOut(pts, Object.assign({ w, seed: n++ * 17 + 3, smooth: true }, o)); },
      // interior joint (1.5) and top-rim edge (2.2): tapered both ends
      line(pts, w = 1.5, o = {}) { return E.inkLine(pts, w, Object.assign({ seed: n++ * 13 + 5, taper: 'mid' }, o)); },
      rim(x0, y0, x1, y1, w = 2.2) { return E.ribbon(E.jag([[x0, y0], [x1, y1]], X.rnd, 0.4, 14, false), w, { color: K.ink9, taper: 'mid', min: 0.5, wobble: 0.2, seed: n++ * 7 + 1 }); },
      shadow(pts, dx, dy, pat = 'd40') { return `<path d="${E.P(E.castPts(pts, dx, dy))}" fill="url(#${p}${pat})"/>`; },
      wrap(body, cls) { return `<g class="pn-prop ${cls || ''}"${X.meta.H != null ? ` data-h="${f(X.meta.H)}" data-hr="${f(X.meta.H / E.HERO_H)}"` : ''}><defs>${defs.join('')}</defs>${body}</g>`; }
    };
    return X;
  };
  // registry + public entry: PN.env.prop(ch, kind, o) → <g> in local box centred on the footprint (pivot 0,0)
  E.props = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} };
  E.resolveKind = function (ch, kind) { const lib = E.props[ch] || {}; return lib[kind] ? kind : (lib._alias && lib._alias[kind]) || Object.keys(lib).find((k) => k[0] !== '_'); };
  E.prop = function (ch, kind, o = {}) {
    const k = E.resolveKind(ch, kind), X = E.ctx(ch, o.seed || 1);
    const body = E.props[ch][k](X, o);
    E.lastMeta = Object.assign({ ch, kind: k }, X.meta);
    return X.wrap(body, 'ch' + ch + ' ' + k);
  };
  // front-face height of a prop (px @1x) and its ratio to the hero (64 px). Every kind records X.meta.H.
  E.propMeta = function (ch, kind, o = {}) { E.prop(ch, kind, o); const m = E.lastMeta; return Object.assign({ ratio: m.H / E.HERO_H }, m); };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  E.rect = rect;
  // K5 (rev 3) solid tiers: the big bake sizes get a dressed top. min(w,d) ≥ 160 → 'large' (280×190), ≥ 100 → 'mid' (200×130), else 'base'
  // (120×70, the 70×132 / 104×30 / 76×28 pillars and every default size). 'base' keeps the rev 2 code path.
  E.tier = (w, d) => { const m = Math.min(w, d); return m >= 160 ? 'large' : m >= 100 ? 'mid' : 'base'; };
  // generic 3/4 block on footprint (x,y center, w×d), height H. o: {jag, topFill, frontFill, topInner, frontInner, r, noShadow, rim}
  E.block = function (X, x, y, w, d, H, o = {}) {
    const c = X.c, rnd = X.rnd, j = o.jag == null ? 0 : o.jag;
    const x0 = x - w / 2, x1 = x + w / 2, yT0 = y - d / 2 - H, yT1 = y + d / 2 - H, yB = y + d / 2;
    const J = (pts) => j ? E.jag(pts, rnd, j, 12) : pts;
    const top = J(rect(x0, yT0, x1, yT1)), front = rect(x0, yT1, x1, yB), sil = rect(x0, yT0, x1, yB);
    let s = '';
    if (!o.noShadow) s += X.shadow(rect(x0, y - d / 2, x1, yB), H * 0.62 + 4, H * 0.3 + 3);
    s += X.face(front, o.frontFill || c.base, `<rect x="${x0 - 2}" y="${yT1}" width="${w + 4}" height="${H + 2}" fill="${X.d20}"/>` + (o.frontInner || ''), 0);
    s += X.face(top, o.topFill || c.light, o.topInner || '', o.r == null ? 0 : o.r);
    s += X.rim(x0 + 1.5, yT1, x1 - 1.5, yT1, 2.2);
    if (o.rim !== false) s += E.ribbon(E.qs(x0 + 4, yT0 + 2.2, x + (x1 - x0) * 0.1, yT0 + 1.6, x1 - 8, yT0 + 2.2, 18), 1.2, { color: K.p100, taper: 'mid', opacity: 0.85 });
    return { s, top, front, sil, x0, x1, yT0, yT1, yB, outline: (ow) => X.out(J(sil), ow || o.w || 2.5, { gaps: 1, r: 0.8 }) };
  };
  // rubble chips at a base line (tiny: uniform 1.3 line is fine at this size)
  E.rubble = function (X, x0, x1, y, n) {
    const c = X.c, rnd = X.rnd; let s = '';
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0), yy = y + rnd() * 6 - 1, r = 2 + rnd() * 3.5;
      const pts = [[x - r, yy], [x - r * 0.3, yy - r * 0.9], [x + r * 0.8, yy - r * 0.5], [x + r, yy + r * 0.3], [x, yy + r * 0.5]];
      s += `<path d="${E.P(pts)}" fill="${c.light}" stroke="${K.ink9}" stroke-width="1.4" stroke-linejoin="miter"/><path d="M ${f(x + r * 0.2)},${f(yy + r * 0.45)} L ${f(x + r)},${f(yy + r * 0.3)} L ${f(x + r * 0.8)},${f(yy - r * 0.5)} Z" fill="${K.ink9}"/>`;
    }
    return s;
  };
  // torn poster (paper piece) with print blocks; tone: 'paper' | 'spot' | 'pale'; o.dots presses value; o.curl adds a lifted corner
  // K5 (rev 3): NO lettering. o.glyph is gone. o.layout picks the print vocabulary (API-env §E.poster, brief §1.6):
  //   'print'    (default) block top-left + 3 left-aligned lines of falling length — byte-identical to rev 2
  //   'portrait' wanted-poster: big block u −0.30…0.30 × v −0.40…0.10 + 2 lines (v 0.24 → u 0.24, v 0.36 → u 0.02)
  //   'blank'    no print; the lower 35 % is torn away (jagged). The tear uses its own rng, so X.rnd advances exactly as in 'print'.
  E.poster = function (X, cx, cy, w, h, a, o = {}) {
    const rnd = X.rnd, c = X.c, lay = o.layout || 'print';
    let pts = E.torn(cx, cy, w, h, a, rnd, o.amp || 1.6);
    const fill = o.tone === 'spot' ? c.spot : o.tone === 'pale' ? mix(K.p300, c.light, 0.5) : K.p300;
    const ink = o.tone === 'spot' ? mix(c.spot, K.ink9, 0.55) : K.ink9;
    const ca = Math.cos(a), sa = Math.sin(a), T = (u, v) => [cx + u * w * ca - v * h * sa, cy + u * w * sa + v * h * ca];
    const lw = f(Math.max(1.2, h * 0.05));
    let print = '';
    if (lay === 'portrait') {
      print = `<path d="${E.P([T(-0.3, -0.4), T(0.3, -0.4), T(0.3, 0.1), T(-0.3, 0.1)])}" fill="${ink}"/>`;
      [[0.24, 0.24], [0.36, 0.02]].forEach(([v, u1]) => { print += `<path d="${E.P([T(-0.3, v), T(u1, v)], false)}" stroke="${ink}" stroke-width="${lw}"/>`; });
    } else if (lay === 'blank') {
      // keep the top 65 %: drop the jag points below v 0.15 and splice in a ragged tear (right → left)
      const V = (p) => (-(p[0] - cx) * sa + (p[1] - cy) * ca) / h, cut = 0.15, tr = E.rng(Math.round(Math.abs(cx * 7 + cy * 13 + w * 3)) + 17);
      let i0 = -1, i1 = -1; pts.forEach((p, i) => { if (V(p) > cut) { if (i0 < 0) i0 = i; i1 = i; } });
      const tear = []; for (let k = 0; k <= 6; k++) { const u = 0.5 - k / 6; tear.push(T(Math.max(-0.5, Math.min(0.5, u + (k % 6 ? (tr() - 0.5) * 0.06 : 0))), cut + (k % 2 ? 0.05 + tr() * 0.09 : -0.03 - tr() * 0.06))); }
      if (i0 > 0) pts = pts.slice(0, i0).concat(tear, pts.slice(i1 + 1));
    } else {
      print = `<path d="${E.P([T(-0.34, -0.36), T(0.2, -0.36), T(0.2, -0.04), T(-0.34, -0.04)])}" fill="${ink}"/>`;
      for (let k = 0; k < 3; k++) print += `<path d="${E.P([T(-0.34, 0.08 + k * 0.12), T(0.34 - k * 0.14, 0.08 + k * 0.12)], false)}" stroke="${ink}" stroke-width="${lw}"/>`;
    }
    const d = E.P(pts);
    let s = `<path d="${d}" fill="${fill}"/>` + X.clipped(d, print + (o.dots ? `<rect x="${f(cx - w)}" y="${f(cy - h)}" width="${f(w * 2)}" height="${f(h * 2)}" fill="url(#${X.p}${o.dots})"/>` : ''));
    s += E.ribbon(pts.concat([pts[0]]), 1.4, { color: K.ink9, taper: 'none', wobble: 0.25 });
    if (o.curl) { const q = pts[Math.floor(pts.length * o.curl) % pts.length]; s += `<path d="M ${f(q[0])},${f(q[1])} q 5,-2 7,3 q -4,1 -7,-3 Z" fill="${K.p100}" stroke="${K.ink9}" stroke-width="1.2"/>`; }
    return s;
  };
  // nail hole with rust streak
  E.nail = (x, y, c) => `<circle cx="${f(x)}" cy="${f(y)}" r="1.5" fill="${K.ink9}"/>` + E.inkQ(x, y + 1, x + 0.4, y + 4, x - 0.2, y + 8, 1.4, { color: c.deep, taper: 'start', wobble: 0 });
  // jagged black crack wedge (Mignola black spot) from (x,y) downward
  E.crackWedge = function (x, y, len, w, rnd, dir = 1) {
    const L = [[x - w / 2, y]], R = [[x + w / 2, y]]; let cx = x, cy = y;
    const n = 5;
    for (let i = 1; i <= n; i++) { const t = i / n; cx += (rnd() - 0.5) * len * 0.35 + dir * len * 0.06; cy += len / n; const hw = w / 2 * (1 - t); L.push([cx - hw - rnd() * 1.2, cy]); R.push([cx + hw + rnd() * 1.2, cy]); }
    return `<path d="${E.P(L.concat(R.reverse()))}" fill="${K.ink9}"/>`;
  };
  // cylinder silhouette (dense samples): back half of the top ellipse + sides + front half of the base ellipse
  E.cylSil = (cx, R, ry, yTop, yBase) => E.ellPts(cx, yTop, R, ry, 28, Math.PI, Math.PI * 2 + 1e-6).concat(E.ellPts(cx, yBase, R, ry, 28, 0, Math.PI + 1e-6));
  // ink drip stain running down a front face (ink flows DOWN on the world's wet things)
  E.dripStain = function (x, y, len, c, w = 2.4) {
    const col = mix(c.deep, K.ink9, 0.35);
    return E.inkQ(x, y, x + 0.8, y + len * 0.5, x - 0.4, y + len, w, { color: col, taper: 'start', wobble: 0.2 }) + `<circle cx="${f(x - 0.4)}" cy="${f(y + len + 1.3)}" r="${f(w * 0.55)}" fill="${col}"/>`;
  };
})(window.PN);
// ---- Ch1 먹선 골목 props: wall(금 간 회벽 + 벽보) · jars(먹통·항아리) · cart(나무 수레) · pole(전봇대 밑동, pillar) ----
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix, L = E.props[1];
  L._alias = { solid: 'wall', pillar: 'pole' };
  // 금 간 회벽 블록 — footprint w×d (default 150×46), height H 30 (knee–waist). Broken right end exposes a black rubble core.
  L.wall = function (X, o) {
    const w = o.w || 150, d = o.d || 40, H = Math.min(o.H || 26, 28), c = X.c, rnd = X.rnd, tier = E.tier(w, d);
    if (tier !== 'base') return wallBig(X, { w, d }, tier); // K5: mid / large = '벽보 담장 빈터'
    X.meta = { H, name: '금 간 회벽', front: H, tier };
    const x0 = -w / 2, x1 = w / 2, yT0 = -d / 2 - H, yT1 = d / 2 - H, yB = d / 2, bx = x1 - 16;
    // broken right end profile (top face) and front
    const topPts = E.jag([[x0 + 5, yT0], [bx - 4, yT0], [bx + 3, yT0 + d * 0.22], [bx - 3, yT0 + d * 0.45], [bx + 6, yT0 + d * 0.7], [bx + 2, yT1]], rnd, 0.8, 10, false)
      .concat([[x0 + w * 0.36, yT1], [x0 + w * 0.32, yT1 - 4], [x0 + w * 0.25, yT1 - 3], [x0 + w * 0.22, yT1], [x0, yT1], [x0, yT0 + 6]]);
    const frontPts = [[x0, yT1], [x0 + w * 0.22, yT1], [x0 + w * 0.25, yT1 - 3], [x0 + w * 0.32, yT1 - 4], [x0 + w * 0.36, yT1], [bx + 2, yT1], [bx + 9, yT1 + H * 0.35], [bx + 7, yT1 + H * 0.6], [x1, yB], [x0, yB]];
    const sil = topPts.slice(0, topPts.length - 6).concat([[bx + 9, yT1 + H * 0.35], [bx + 7, yT1 + H * 0.6], [x1, yB], [x0, yB], [x0, yT0 + 6]]);
    let s = X.shadow([[x0, -d / 2], [bx, -d / 2], [x1, yB], [x0, yB]], H * 0.62 + 4, H * 0.3 + 3);
    // FRONT
    let fr = `<rect x="${x0 - 2}" y="${yT1 - 6}" width="${w + 4}" height="${H + 8}" fill="${X.d20}"/>`;
    fr += `<path d="${E.P(E.jag([[x0 + w * 0.05, yT1 + H * 0.2], [x0 + w * 0.16, yT1 + H * 0.12], [x0 + w * 0.17, yT1 + H * 0.88], [x0 + w * 0.04, yT1 + H * 0.92]], rnd, 1.2, 6))}" fill="${mix(c.base, c.light, 0.6)}" stroke="${mix(c.deep, K.ink9, 0.3)}" stroke-width="1"/>`;
    fr += E.poster(X, x0 + w * 0.29, yT1 + H * 0.54, 25, H * 0.72, -0.05, { tone: 'paper', layout: 'portrait', curl: 0.1 }); // K5-G2: was '수배' lettering
    fr += E.poster(X, x0 + w * 0.5, yT1 + H * 0.47, 28, H * 0.6, 0.07, { tone: 'pale', dots: 'd20' });
    fr += E.crackWedge(x0 + w * 0.66, yT1 - 1, H + 1, 6, rnd, 1);
    fr += E.inkQ(x0 + w * 0.675, yT1 + H * 0.5, x0 + w * 0.69, yT1 + H * 0.8, x0 + w * 0.685, yB + 1, 3, { color: mix(c.deep, K.ink9, 0.25), taper: 'mid', opacity: 0.8 });
    fr += X.line([[x0 + w * 0.66, yT1 + H * 0.4], [x0 + w * 0.72, yT1 + H * 0.55], [x0 + w * 0.76, yT1 + H * 0.5]], 1.3);
    [0.12, 0.4, 0.6, 0.78].forEach((t) => { fr += E.nail(x0 + w * t, yT1 + 5 + rnd() * 3, c); });
    // exposed rubble core (black spot) at the broken end with a few light stones
    const core = E.jag([[bx - 10, yT1], [bx + 2, yT1], [bx + 9, yT1 + H * 0.35], [bx + 7, yT1 + H * 0.6], [x1, yB], [bx - 22, yB], [bx - 14, yT1 + H * 0.5]], rnd, 1.4, 6);
    fr += `<path d="${E.P(core)}" fill="${K.ink9}"/>`;
    [[bx - 9, yT1 + H * 0.3, 7, 4], [bx - 1, yT1 + H * 0.62, 6, 4], [bx - 14, yT1 + H * 0.78, 8, 4.4]].forEach(([x, y, a, b2]) => { fr += `<path d="${E.P(E.jag([[x - a / 2, y - b2 / 2], [x + a / 2, y - b2 / 2], [x + a / 2, y + b2 / 2], [x - a / 2, y + b2 / 2]], rnd, 0.8, 3))}" fill="${c.deep}" stroke="${K.ink9}" stroke-width="0.8"/>`; });
    fr += `<path d="M ${f(x0)},${f(yT1)} L ${f(bx)},${f(yT1)} L ${f(bx)},${f(yT1 + 3)} L ${f(x0)},${f(yT1 + 3.4)} Z" fill="${K.ink9}" opacity="0.5"/>`;
    s += X.face(frontPts, c.base, fr, 1);
    // TOP
    let tp = `<path d="M ${f(x0)},${f(yT0)} L ${f(x1)},${f(yT0)} L ${f(x1)},${f(yT0 + 5)} L ${f(x0)},${f(yT0 + 6)} Z" fill="${X.e20}"/>`;
    tp += `<path d="${E.crPath(E.ellPts(x0 + w * 0.2, yT0 + d * 0.62, 18, 8, 7).map((q) => [q[0] + (rnd() - 0.5) * 8, q[1] + (rnd() - 0.5) * 5]), true)}" fill="${X.e20}"/>`;
    tp += E.poster(X, x0 + w * 0.43, yT0 + d * 0.5, 34, d * 0.56, 0.16, { tone: 'spot', amp: 2 });
    tp += E.ribbon(E.cr([[x0 + w * 0.61, yT0 + 1], [x0 + w * 0.64, yT0 + d * 0.35], [x0 + w * 0.62, yT0 + d * 0.62], [x0 + w * 0.665, yT1 + 1]], false, 5), 2.8, { color: K.ink9, taper: 'end', wobble: 0.4 });
    tp += X.line([[x0 + w * 0.63, yT0 + d * 0.35], [x0 + w * 0.71, yT0 + d * 0.3], [x0 + w * 0.77, yT0 + d * 0.37]], 1.1);
    tp += `<path d="${E.P([[bx - 12, yT0 + d * 0.15], [bx + 2, yT0 + d * 0.24], [bx - 3, yT0 + d * 0.45], [bx + 5, yT0 + d * 0.7], [bx - 8, yT0 + d * 0.62]])}" fill="${X.e40}"/>`;
    s += X.face(topPts, c.light, tp, 1.5);
    s += E.ribbon(E.jag([[x0 + 2, yT1], [x0 + w * 0.22, yT1]], rnd, 0.5, 12, false).concat([[x0 + w * 0.25, yT1 - 3], [x0 + w * 0.32, yT1 - 4], [x0 + w * 0.36, yT1]]).concat(E.jag([[x0 + w * 0.36, yT1], [bx, yT1]], rnd, 0.5, 12, false)), 1.8, { color: K.ink9, taper: 'none', wobble: 0.3 });
    s += E.ribbon(E.qs(x0 + 7, yT0 + 2.2, x0 + w * 0.3, yT0 + 1.5, bx - 10, yT0 + 2.2, 18), 1.2, { color: K.p100, taper: 'mid', opacity: 0.85 });
    s += `<path d="M ${f(x0 + 1)},${f(yB)} L ${f(x1 - 1)},${f(yB)}" stroke="${K.ink9}" stroke-width="3" stroke-linecap="round"/>`;
    s += X.out(sil, 2.6, { gaps: 1, r: 1.5 });
    s += E.rubble(X, bx - 4, x1 + 16, yB - 3, 6);
    return s;
  };
  // onggi jar helper: base centre (cx, cy), radius R, height H, mouth ratio m
  function jar(X, cx, cy, R, H, m = 0.5, kind = 'onggi') {
    const c = X.c, top = cy - H, rm = R * m;
    const body = kind === 'bucket'
      ? [[cx - R, top + 2], [cx - R * 1.02, cy - H * 0.5], [cx - R * 0.94, cy - 1], [cx, cy + R * 0.28], [cx + R * 0.94, cy - 1], [cx + R * 1.02, cy - H * 0.5], [cx + R, top + 2]]
      : [[cx - rm, top], [cx - R * 0.92, top + H * 0.26], [cx - R, top + H * 0.5], [cx - R * 0.72, cy - 2], [cx, cy + R * 0.22], [cx + R * 0.72, cy - 2], [cx + R, top + H * 0.5], [cx + R * 0.92, top + H * 0.26], [cx + rm, top]];
    const d = E.crPath(body, true, 6);
    let inner = `<path d="M ${f(cx - R * 2)},${f(top)} h ${f(R * 4)} v ${f(H + R)} h ${f(-R * 4)} Z" fill="${X.d20}"/>`;
    inner += `<ellipse cx="${f(cx + R * 1.1)}" cy="${f(cy - H * 0.45)}" rx="${f(R * 0.62)}" ry="${f(H * 0.9)}" fill="${K.ink9}"/>`;
    inner += E.inkQ(cx - R * 0.62, top + H * 0.2, cx - R * 0.8, top + H * 0.5, cx - R * 0.5, cy - 4, 2.6, { color: K.p100, taper: 'mid', opacity: 0.9 });
    if (kind === 'bucket') { [0.28, 0.72].forEach((t) => { inner += `<path d="M ${f(cx - R * 1.1)},${f(top + H * t)} Q ${f(cx)},${f(top + H * t + R * 0.34)} ${f(cx + R * 1.1)},${f(top + H * t)}" fill="none" stroke="${K.ink9}" stroke-width="3.2"/><path d="M ${f(cx - R * 0.9)},${f(top + H * t - 1)} Q ${f(cx - R * 0.4)},${f(top + H * t + R * 0.12)} ${f(cx - R * 0.1)},${f(top + H * t + R * 0.15)}" fill="none" stroke="${K.ink5}" stroke-width="1"/>`; });
      [-0.5, 0, 0.5].forEach((t) => { inner += `<path d="M ${f(cx + R * t)},${f(top + 3)} L ${f(cx + R * t * 1.02)},${f(cy + 2)}" stroke="${c.deep}" stroke-width="1"/>`; }); }
    else inner += `<path d="M ${f(cx - R)},${f(top + H * 0.36)} q ${f(R * 0.25)},-4 ${f(R * 0.5)},0 t ${f(R * 0.5)},0 t ${f(R * 0.5)},0 t ${f(R * 0.5)},0" fill="none" stroke="${c.deep}" stroke-width="1.6"/>`;
    let s = X.shadow(E.ellPts(cx, cy - 2, R, R * 0.36, 16), R * 0.7, R * 0.3);
    s += X.faceD(d, kind === 'bucket' ? c.deep : c.base, inner);
    s += X.outSm(body, 2.5, { gaps: 1 });
    // mouth
    const ry = rm * 0.38;
    s += `<ellipse cx="${f(cx)}" cy="${f(top)}" rx="${f(rm + 2)}" ry="${f(ry + 1.4)}" fill="${c.light}" stroke="${K.ink9}" stroke-width="2"/><ellipse cx="${f(cx)}" cy="${f(top + 0.6)}" rx="${f(rm - 1.5)}" ry="${f(ry - 0.6)}" fill="${K.ink9}"/>`;
    if (kind === 'bucket') s += `<path d="M ${f(cx - rm * 0.5)},${f(top - ry * 0.1)} q ${f(rm * 0.3)},-1.5 ${f(rm * 0.6)},0" stroke="${K.p100}" stroke-width="1.2" fill="none"/>` + E.inkQ(cx + rm * 0.55, top + ry, cx + rm * 0.7, top + H * 0.3, cx + rm * 0.6, top + H * 0.55, 3.2, { taper: 'start', wobble: 0 }) + `<circle cx="${f(cx + rm * 0.6)}" cy="${f(top + H * 0.58)}" r="1.9" fill="${K.ink9}"/>`;
    return s;
  }
  // 먹통·항아리 더미 — footprint default 92×60
  L.jars = function (X, o) {
    const w = o.w || 92, d = o.d || 60, sc = Math.min(w / 92, d / 60);
    X.meta = { H: Math.round(28 * sc), name: '먹통·항아리 더미' };
    let s = '';
    s += `<g filter="none"><path d="${E.crPath(E.ellPts(38 * sc, 22 * sc, 16 * sc, 6 * sc, 8).map((q, i) => [q[0] + (i % 2 ? 3 : -2), q[1] + (i % 3 ? 1.5 : -1)]), true)}" fill="${mix(X.c.base, X.c.deep, 0.55)}"/></g>`;
    s += jar(X, -12 * sc, -6 * sc, 21 * sc, 28 * sc, 0.52, 'onggi');
    // straw rope round the big jar's neck
    { const cx = -12 * sc, y = -6 * sc - 28 * sc + 7 * sc, R = 21 * sc * 0.72; let rp = `<path d="M ${f(cx - R)},${f(y)} Q ${f(cx)},${f(y + 7 * sc)} ${f(cx + R)},${f(y)}" fill="none" stroke="${K.ink9}" stroke-width="5.4"/><path d="M ${f(cx - R)},${f(y)} Q ${f(cx)},${f(y + 7 * sc)} ${f(cx + R)},${f(y)}" fill="none" stroke="${X.c.light}" stroke-width="3" stroke-dasharray="2.2 1.6"/>`;
      rp += E.inkQ(cx + R - 2, y + 1, cx + R + 4, y + 8, cx + R + 1, y + 15, 2.4, { taper: 'end' }); s += rp; }
    s += jar(X, 24 * sc, 4 * sc, 15 * sc, 21 * sc, 0.92, 'bucket');
    s += jar(X, -30 * sc, 18 * sc, 11 * sc, 16 * sc, 0.5, 'onggi');
    { const cx = -30 * sc, y = 18 * sc - 16 * sc - 1; s += `<ellipse cx="${f(cx)}" cy="${f(y)}" rx="${f(8 * sc)}" ry="${f(3.2 * sc)}" fill="${X.c.light}" stroke="${K.ink9}" stroke-width="2"/><path d="M ${f(cx - 8 * sc)},${f(y)} a ${f(8 * sc)},${f(3.2 * sc)} 0 0 0 ${f(16 * sc)},0 v 2 a ${f(8 * sc)},${f(3.2 * sc)} 0 0 1 ${f(-16 * sc)},0 Z" fill="${K.ink9}"/><circle cx="${f(cx)}" cy="${f(y - 2)}" r="${f(2.2 * sc)}" fill="${K.ink9}"/>`; }
    s += E.rubble(X, 4 * sc, 30 * sc, 22 * sc, 3);
    return s;
  };
  // ===== K5 (rev 3) · Ch1 wall, big tiers: '벽보 담장 빈터' (brief §2.1) =====
  // A plaster wall ring (front 26, thickness 12 / 14) closes a sunken lot; the cap is the rail (Q1). Inside: a jar pile with a fallen ink
  // bucket and its spilled ink (focus), tied manuscript bundles, floor posters. The large tier adds the hand cart and a heap of fallen plaster.
  // copy of the cart's paper bundle (L.cart stays byte-identical); the three sheet edges are uneven so they never stack into '≡'
  function bundle(X, x, y, w, d, H, fill) {
    const c = X.c, rnd = X.rnd, yt = y + d / 2 - H;
    let q = X.shadow(E.rect(x - w / 2, y - d / 2, x + w / 2, y + d / 2), 6, 3.5, 'd40');
    let fr = ''; [[0, -2], [3, 0], [1, -6]].forEach(([a, b], k) => { const yy = yt + H * (k + 1) / 4 + (rnd() - 0.5); fr += `<path d="M ${f(x - w / 2 + a)},${f(yy)} L ${f(x + w / 2 + b)},${f(yy)}" stroke="${mix(K.p300, K.ink7, 0.5)}" stroke-width="0.9"/>`; });
    fr += `<path d="M ${f(x + w / 2 - 5)},${f(yt)} L ${f(x + w / 2)},${f(yt)} L ${f(x + w / 2)},${f(y + d / 2)} L ${f(x + w / 2 - 8)},${f(y + d / 2)} Z" fill="${K.ink9}"/>`;
    q += X.face(E.rect(x - w / 2, yt, x + w / 2, y + d / 2), fill === c.spot ? mix(c.spot, K.ink7, 0.25) : mix(K.p300, c.base, 0.3), fr, 1);
    q += X.face(E.jag(E.rect(x - w / 2, y - d / 2 - H, x + w / 2, yt), rnd, 0.7, 8), fill, fill === c.spot ? '' : `<path d="M ${f(x - w / 2 + 3)},${f(y - d / 2 - H + 3)} l ${f(w * 0.5)},0" stroke="${c.deep}" stroke-width="0.9"/>`, 1.5);
    q += `<path d="M ${f(x + w * 0.1)},${f(y - d / 2 - H)} L ${f(x + w * 0.1)},${f(y + d / 2)}" stroke="${K.ink9}" stroke-width="1.6"/><circle cx="${f(x + w * 0.1)}" cy="${f(yt + 1)}" r="2.3" fill="${K.ink9}"/>` + E.inkQ(x + w * 0.1, yt + 2, x + w * 0.1 - 3, yt + 6, x + w * 0.1 - 5, yt + 9, 1.4, { taper: 'end' });
    q += X.out(E.rect(x - w / 2, y - d / 2 - H, x + w / 2, y + d / 2), 2, { r: 1.5 });
    return q;
  }
  // fallen ink bucket on its side, mouth to the lower-right: (gx, gy) ground contact, R radius, Lb length, a axis tilt (deg)
  function tippedBucket(X, gx, gy, R, Lb, a) {
    const c = X.c, ry = R * 0.82, cy = gy - ry, ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
    const T = (u, v) => [gx + u * ca - v * sa, cy + u * sa + v * ca], Q = (p) => f(p[0]) + ',' + f(p[1]);
    const body = [T(-Lb / 2, -ry * 0.88), T(Lb / 2, -ry), T(Lb / 2, ry), T(-Lb / 2, ry * 0.88)];
    let s = X.shadow(E.ellPts(gx + 2, gy - 1, Lb * 0.58, ry * 0.42, 16), R * 0.6, R * 0.3);
    let inner = `<path d="${E.P([T(-Lb, ry * 0.18), T(Lb, ry * 0.24), T(Lb, ry * 1.5), T(-Lb, ry * 1.5)])}" fill="${K.ink9}"/>`; // underside = black spot
    [0.24, 0.7].forEach((k) => { const u = -Lb / 2 + Lb * k; inner += `<path d="M ${Q(T(u, -ry * 1.1))} Q ${Q(T(u + 2.6, 0))} ${Q(T(u, ry * 1.1))}" fill="none" stroke="${K.ink9}" stroke-width="3"/>`; });
    inner += E.ribbon(E.qs(...T(-Lb * 0.42, -ry * 0.6), ...T(0, -ry * 0.74), ...T(Lb * 0.36, -ry * 0.66), 12), 1.6, { color: K.p100, taper: 'mid', opacity: 0.85 });
    s += X.face(body, c.deep, inner, 2) + X.out(body, 2.4, { gaps: 1, r: 2 });
    const m = T(Lb / 2, 0);
    s += `<g transform="rotate(${f(a)} ${f(m[0])} ${f(m[1])})"><ellipse cx="${f(m[0])}" cy="${f(m[1])}" rx="${f(ry * 0.32)}" ry="${f(ry + 1)}" fill="${c.light}" stroke="${K.ink9}" stroke-width="2"/><ellipse cx="${f(m[0] + 0.5)}" cy="${f(m[1] + 0.4)}" rx="${f(ry * 0.18)}" ry="${f(ry * 0.8)}" fill="${K.ink9}"/></g>`;
    return s;
  }
  // spilled ink (black spot): a 9-point fan, narrow at the source (sx, sy), radius ±25 % (never an ellipse), ink9 core in a c.deep rim, 3 drops
  function spill(X, sx, sy, rx, ry, rot) {
    const rnd = X.rnd, ca = Math.cos(rot), sa = Math.sin(rot), cx = sx + rx * 0.85 * ca, cy = sy + rx * 0.85 * sa, pts = [];
    for (let i = 0; i < 9; i++) { const t = i / 9 * Math.PI * 2, k = 0.75 + rnd() * 0.5, u = Math.cos(t) * rx * k, v = Math.sin(t) * ry * k * (0.55 + 0.45 * (1 + Math.cos(t)) / 2); pts.push([cx + u * ca - v * sa, cy + u * sa + v * ca]); }
    let s = `<path d="${E.crPath(pts, true)}" fill="${mix(X.c.deep, K.ink9, 0.5)}"/><path d="${E.crPath(E.shrink(pts, 2.2), true)}" fill="${K.ink9}"/>`;
    for (let i = 0; i < 3; i++) { const t = (rnd() - 0.5) * 1.6, dd = 1.15 + rnd() * 0.3, r = 1.2 + rnd() * 1.2, u = Math.cos(t) * rx * dd, v = Math.sin(t) * ry * dd; s += `<circle cx="${f(cx + u * ca - v * sa)}" cy="${f(cy + u * sa + v * ca)}" r="${f(r)}" fill="${K.ink9}"/>`; }
    return s;
  }
  // heap of fallen plaster (≈ wd × ht): angular light lumps with a black lower-right wedge, painted back to front
  function chunks(X, cx, cy, wd, ht, n) {
    const c = X.c, rnd = X.rnd, L = [];
    for (let i = 0; i < n; i++) L.push([cx + (rnd() - 0.5) * wd * 0.8, cy + (rnd() - 0.5) * ht * 0.6, 4 + rnd() * 4, i % 2]);
    L.sort((p, q) => p[1] - q[1]);
    let s = X.shadow(E.ellPts(cx, cy + 2, wd * 0.5, ht * 0.45, 12), 5, 3);
    for (const [x, y, r, k] of L) {
      s += `<path d="${E.P([[x - r, y], [x - r * 0.35, y - r * 0.95], [x + r * 0.75, y - r * 0.55], [x + r, y + r * 0.25], [x + r * 0.05, y + r * 0.5]])}" fill="${k ? mix(c.light, c.base, 0.4) : c.base}" stroke="${K.ink9}" stroke-width="1.5" stroke-linejoin="miter"/>` +
        `<path d="${E.P([[x + r * 0.15, y + r * 0.45], [x + r, y + r * 0.25], [x + r * 0.78, y - r * 0.5]])}" fill="${K.ink9}"/>`;
    }
    return s;
  }
  function wallBig(X, o, tier) {
    const c = X.c, rnd = X.rnd, w = o.w, d = o.d, H = 26, lg = tier === 'large', t = lg ? 14 : 12;
    X.meta = { H, name: '벽보 담장 빈터', front: H, tier };
    const x0 = -w / 2, x1 = w / 2, yN = -d / 2, yS = d / 2, ix0 = x0 + t, ix1 = x1 - t, iyN = yN + t, iyS = yS - t;
    const cN0 = yN - H, cN1 = iyN - H, cS0 = iyS - H, cS1 = yS - H, fw = ix1 - ix0, fh = cS0 - iyN, dp = iyS - iyN;
    const U = (u) => ix0 + u * fw, V = (v) => iyN + v * dp;            // inner floor (plane): u across, v back → front
    const brk = ['N', 'E', 'W'][Math.floor(rnd() * 3)], du = (rnd() - 0.5) * 0.16 * fw, DROP = 7;
    const bL = 22 + rnd() * 8, bA = brk === 'N' ? ix0 + 24 + rnd() * (fw - 48 - bL) : cN1 + 16 + rnd() * (cS0 - cN1 - 32 - bL), bB = bA + bL;
    const jt = (xa, ya, xb, yb) => `<path d="M ${f(xa)},${f(ya)} L ${f(xb)},${f(yb)}" stroke="${mix(c.deep, K.ink9, 0.3)}" stroke-width="1.5"/>`;
    let s = X.shadow(E.rect(x0, yN, x1, yS), H * 0.62 + 4, H * 0.3 + 3);
    // ── north wall, inner (south-facing) face: plaster + 20 % dots, 2–3 / 3–5 posters (≤ 19 tall, one half-fallen), nails, crack wedge, ink run
    let ni = `<rect x="${f(ix0 - 2)}" y="${f(cN1 - 2)}" width="${f(fw + 4)}" height="${H + 4}" fill="${X.d20}"/>`;
    const nP = lg ? 3 + Math.floor(rnd() * 3) : 2 + Math.floor(rnd() * 2), sh = Math.floor(rnd() * 4);
    const LAY = ['portrait', 'print', 'blank', 'print'], TONE = ['paper', 'pale', 'spot', 'pale'];
    for (let i = 0; i < nP; i++) {
      const fall = i === nP - 1, pw = 15 + rnd() * 5, ph = 14 + rnd() * 4, px = U((i + 0.5) / nP) + (rnd() - 0.5) * 8, tn = TONE[(i + sh) % 4];
      ni += E.poster(X, px, cN1 + H * 0.5 + (fall ? 3 : 0), pw, ph, fall ? 0.5 : (rnd() - 0.5) * 0.16, { tone: tn, layout: LAY[(i + sh) % 4], dots: tn === 'pale' ? 'd20' : undefined, curl: fall ? 0.35 : undefined });
    }
    for (let i = 0, nn = lg ? 5 : 3; i < nn; i++) ni += E.nail(U(0.05 + 0.9 * (i + 0.2 + rnd() * 0.6) / nn), cN1 + 4 + rnd() * 2, c);
    ni += E.crackWedge(U(Math.floor(nP / 2) / nP), cN1 - 1, H + 1, 5, rnd, 1) + E.dripStain(U(0.5 / nP) - 9, cN1 + 3, H * 0.45, c, 2.4);
    s += X.face(E.rect(ix0, cN1, ix1, iyN), c.base, ni, 0);
    // ── the lot's floor: base/deep mix, inner shadow bands (north 11, west 20) in 40 % dots, two slab joints, flat posters, spilled ink
    const J = lg ? { oR: 19, oH: 18, oM: 0.48, sR: 10, sH: 13, bR: 14, bL: 18, sx: 34, sy: 19 } : { oR: 15, oH: 16, oM: 0.52, sR: 8, sH: 11, bR: 11, bL: 14, sx: 22, sy: 12 }; // spill ≈ 2.48·sx·sy ≈ 4.7 % of the floor
    const px = U(0.3) + du, py = iyN + fh * 0.55, bx = px + J.oR * 0.95, by = py + 3, ba = 16, bry = J.bR * 0.82; // pile contact −35,−9 / −50,−6
    const mo = [bx + J.bL / 2 * Math.cos(ba * Math.PI / 180), by - bry + J.bL / 2 * Math.sin(ba * Math.PI / 180)];
    let fi = `<rect x="${f(ix0)}" y="${f(iyN)}" width="${f(fw)}" height="11" fill="${X.d40}"/><rect x="${f(ix0)}" y="${f(iyN + 11)}" width="20" height="${f(fh - 11)}" fill="${X.d40}"/>`;
    fi += X.line([[U(0.27), iyN + 1], [U(0.31), iyN + fh * 0.4], [U(0.25), cS0]], 1.5, { color: mix(c.base, c.deep, 0.8), taper: 'none' });
    fi += X.line([[U(0.36), iyN + fh * 0.52], [U(0.68), iyN + fh * 0.6], [ix1, iyN + fh * 0.5]], 1.5, { color: mix(c.base, c.deep, 0.8), taper: 'none' });
    const FL = lg ? [[0.47, 0.15, 20, 14, 0.3, 'pale', 'print'], [0.13, 0.64, 22, 15, -0.5, 'paper', 'portrait'], [0.53, 0.69, 18, 13, 0.55, 'spot', 'blank']] : [[0.48, 0.17, 18, 13, 0.35, 'pale', 'print'], [0.16, 0.66, 20, 14, -0.45, 'paper', 'portrait']];
    FL.forEach(([u, v, pw, ph, a, tone, lay]) => { fi += E.poster(X, U(u), V(v), pw, ph, a, { tone, layout: lay, dots: tone === 'pale' ? 'd20' : undefined }); });
    fi += spill(X, mo[0], mo[1] + bry * 0.75, J.sx, J.sy, 0.22);
    s += X.face(E.rect(ix0, iyN, ix1, cS0), mix(c.base, c.deep, 0.4), fi, 0) + E.rubble(X, U(0.1), U(0.9), iyN - 2, lg ? 4 : 3);
    // ── standing props, painted back to front by their ground line (all tops ≤ 24 above the floor)
    const it = [[py - 5, jar(X, px - 4, py - 5, J.oR, J.oH, J.oM, 'onggi')], [py + 8, jar(X, px - J.oR - J.sR * 0.3, py + 8, J.sR, J.sH, 0.5, 'onggi')], [by, tippedBucket(X, bx, by, J.bR, J.bL, ba)]];
    const BU = lg ? [[0.66, 0.36, 30, 18, 11, K.p300], [0.83, 0.56, 22, 15, 13, c.spot], [0.71, 0.72, 26, 14, 8, K.p300]] : [[0.69, 0.29, 26, 16, 11, K.p300], [0.83, 0.585, 22, 14, 13, c.spot]];
    if (rnd() < 0.5) BU.push(lg ? [0.45, 0.28, 22, 14, 8, mix(K.p300, c.light, 0.5)] : [0.86, 0.3, 22, 14, 8, mix(K.p300, c.light, 0.5)]); // seed: bundle count (22–30 × 14–18 × 8–14)
    BU.forEach(([u, v, bw, bd, bh, fill]) => it.push([V(v) + bd / 2, bundle(X, U(u), V(v), bw, bd, bh, fill)]));
    if (lg) {
      const tx = U(0.8), ty = iyN + 22, cart = E.props[1].cart(X, { w: 80 }); // cart scale 0.65 → height ≤ 17; it overwrites X.meta
      X.meta = { H, name: '벽보 담장 빈터', front: H, tier };
      it.push([ty + 19, `<g transform="translate(${f(tx)},${f(ty)})">${cart}</g>`], [V(0.76) + 10, chunks(X, U(0.32), V(0.76), 40, 20, 6)]);
    }
    it.sort((p, q) => p[0] - q[0]).forEach((p) => { s += p[1]; });
    s += wallRing(X, { x0, x1, ix0, ix1, cN0, cN1, cS0, cS1, t, brk, bA, bB, DROP, U, jt });
    s += wallFront(X, { x0, x1, w, yS, cS1, H, lg });
    // ── edges: rims (cap / face), inner cap edges, wall foot, ground line, brush silhouette, chips outside the front
    const N = brk === 'N', edge = (a, b) => E.ribbon(E.jag([a, b], rnd, 0.4, 12, false), 1.8, { color: K.ink9, taper: 'none', wobble: 0.25 });
    s += X.rim(x0 + 1.5, cS1, x1 - 1.5, cS1, 2.2) + (N ? X.rim(ix0 + 1, cN1, bA, cN1, 2.2) + X.rim(bB, cN1, ix1 - 1, cN1, 2.2) + X.rim(bA + 1, cN1 + DROP - 1, bB - 1, cN1 + DROP - 1, 2) : X.rim(ix0 + 1, cN1, ix1 - 1, cN1, 2.2));
    s += edge([ix0, cN1 + 0.5], [ix0, cS0]) + edge([ix1, cN1 + 0.5], [ix1, cS0]) + edge([ix0, cS0], [ix1, cS0]) + X.line([[ix0 + 1, iyN], [ix1 - 1, iyN]], 1.5, { color: mix(c.deep, K.ink9, 0.4), taper: 'none' });
    s += `<path d="M ${f(x0 + 1)},${f(yS)} L ${f(x1 - 1)},${f(yS)}" stroke="${K.ink9}" stroke-width="3" stroke-linecap="round"/>`;
    s += X.out(N ? [[x0, cN0], [bA, cN0], [bA + 2, cN0 + DROP], [bB - 2, cN0 + DROP], [bB, cN0], [x1, cN0], [x1, yS], [x0, yS]] : E.rect(x0, cN0, x1, yS), 2.6, { gaps: 1, r: 1.5 });
    s += E.rubble(X, x0 + 14, x1 - 40, yS - 3, lg ? 4 : 3);
    return s;
  }
  // cap ring (c.light): irregular joints 28–48 apart, 2–3 chipped spots, one section broken down by DROP showing the black rubble core.
  // N: the north top drops (notch in the silhouette). E/W: a rubble crater on the inner 62 % of the side cap — the outer edge stays, so it never reads as a gate.
  function wallRing(X, g) {
    const c = X.c, rnd = X.rnd, { x0, x1, ix0, ix1, cN0, cN1, cS0, cS1, t, brk, bA, bB, DROP, U, jt } = g, N = brk === 'N';
    const outer = N ? [[x0, cN0], [bA, cN0], [bA + 2, cN0 + DROP], [bB - 2, cN0 + DROP], [bB, cN0], [x1, cN0], [x1, cS1], [x0, cS1]] : E.rect(x0, cN0, x1, cS1);
    let s = `<path d="${E.P(outer)} ${E.P(E.rect(ix0, cN1, ix1, cS0).reverse())}" fill="${c.light}"/>`;
    for (let x = x0 + 18 + rnd() * 14; x < x1 - 14; x += 28 + rnd() * 20) if (!(N && x > bA - 4 && x < bB + 4)) s += jt(x, cN0 + 0.6, x + (rnd() - 0.5) * 2, cN1 - 0.6);
    for (let x = x0 + 26 + rnd() * 14; x < x1 - 14; x += 28 + rnd() * 20) s += jt(x, cS0 + 0.6, x + (rnd() - 0.5) * 2, cS1 - 0.6);
    [[x0, ix0, 'W'], [ix1, x1, 'E']].forEach(([xa, xb, side]) => {
      for (let y = cN1 + 14 + rnd() * 14; y < cS0 - 10; y += 28 + rnd() * 20) if (!(brk === side && y > bA - 4 && y < bB + 4)) s += jt(xa + 0.6, y, xb - 0.6, y + (rnd() - 0.5) * 2);
      s += jt(xa + 0.6, cN1, xb - 0.6, cN1) + jt(xa + 0.6, cS0, xb - 0.6, cS0);
    });
    for (let i = 0, n = 2 + Math.floor(rnd() * 2); i < n; i++) { // chipped spots: dark notches biting into the cap from its inner edges
      const q = 0.15 + rnd() * 0.7;
      if (i % 3 === 0) { const x = U(q); s += `<path d="M ${f(x - 3)},${f(cN1)} L ${f(x)},${f(cN1 - 3.2)} L ${f(x + 3.6)},${f(cN1)} Z" fill="${K.ink9}"/>`; }
      else if (i % 3 === 1) { const x = U(q); s += `<path d="M ${f(x - 3.4)},${f(cS0)} L ${f(x + 0.4)},${f(cS0 + 3.2)} L ${f(x + 3)},${f(cS0)} Z" fill="${K.ink9}"/>`; }
      else { const y = cN1 + (cS0 - cN1) * q; s += `<path d="M ${f(ix1)},${f(y - 3)} L ${f(ix1 + 3.2)},${f(y)} L ${f(ix1)},${f(y + 3.4)} Z" fill="${K.ink9}"/>`; }
    }
    const stones = (L) => L.map(([x, y, a, b]) => `<path d="${E.P(E.jag(E.rect(x - a / 2, y - b / 2, x + a / 2, y + b / 2), rnd, 0.7, 3))}" fill="${c.deep}" stroke="${K.ink9}" stroke-width="0.8"/>`).join('');
    if (N) {
      const ya = cN0 + DROP, yb = cN1 + DROP - 1, m = (bA + bB) / 2;
      s += `<path d="${E.P(E.jag([[bA + 2, ya], [bB - 2, ya], [bB - 1, yb], [bA + 1, yb]], rnd, 1.1, 5))}" fill="${K.ink9}"/>` + stones([[m - 6, ya + 4, 6, 3.4], [m + 5, ya + 7.5, 7, 3.6]]);
    } else {
      const W = brk === 'W', xi = W ? ix0 : ix1, xo = W ? x0 + t * 0.38 : x1 - t * 0.38, mx = (xi + xo) / 2;
      s += `<path d="${E.P(E.jag([[xo, bA + 3], [xi, bA], [xi, bB], [xo, bB - 4]], rnd, 1.1, 5))}" fill="${K.ink9}"/>` + `<path d="M ${f(xo)},${f(bA + 3)} L ${f(xo)},${f(bB - 4)}" stroke="${mix(c.deep, K.ink9, 0.4)}" stroke-width="1.2"/>`;
      s += stones([[mx, bA + (bB - bA) * 0.32, 5, 3.4], [mx + (W ? 1 : -1), bA + (bB - bA) * 0.7, 6, 3.4]]);
    }
    const hl = (xa, xb) => (xb - xa > 20 ? E.ribbon(E.qs(xa, cN0 + 2.2, (xa + xb) / 2, cN0 + 1.5, xb, cN0 + 2.2, 14), 1.2, { color: K.p100, taper: 'mid', opacity: 0.85 }) : '');
    return s + (N ? hl(x0 + 7, bA - 4) + hl(bB + 4, x1 - 10) : hl(x0 + 7, x1 - 10));
  }
  // south wall front (26 band): the small wall's front grammar stretched — plaster patch, 3 / 4 posters (§1.6; the old '수배' spot is 'portrait'),
  // crack wedge + ink run, nails, the plaster fallen off at the east end (black rubble core, lit stones), dark band under the cap
  function wallFront(X, g) {
    const c = X.c, rnd = X.rnd, { x0, x1, w, yS, cS1, H, lg } = g;
    let fr = `<rect x="${f(x0 - 2)}" y="${f(cS1 - 6)}" width="${f(w + 4)}" height="${H + 8}" fill="${X.d20}"/>`;
    fr += `<path d="${E.P(E.jag([[x0 + w * 0.03, cS1 + H * 0.2], [x0 + w * 0.1, cS1 + H * 0.12], [x0 + w * 0.11, cS1 + H * 0.88], [x0 + w * 0.025, cS1 + H * 0.92]], rnd, 1.2, 6))}" fill="${mix(c.base, c.light, 0.6)}" stroke="${mix(c.deep, K.ink9, 0.3)}" stroke-width="1"/>`;
    const FP = lg ? [[0.18, 'portrait', 'paper', 25], [0.34, 'print', 'pale', 27], [0.5, 'blank', 'spot', 22], [0.72, 'print', 'pale', 26]] : [[0.2, 'portrait', 'paper', 25], [0.37, 'print', 'pale', 27], [0.58, 'blank', 'spot', 22]];
    FP.forEach(([u, lay, tone, pw], i) => { fr += E.poster(X, x0 + w * u + (rnd() - 0.5) * 6, cS1 + H * 0.54, pw, H * 0.72, (rnd() - 0.5) * 0.14, { tone, layout: lay, dots: tone === 'pale' ? 'd20' : undefined, curl: i === 0 ? 0.1 : undefined }); });
    const kx = x0 + w * (lg ? 0.61 : 0.48);
    fr += E.crackWedge(kx, cS1 - 1, H + 1, 6, rnd, 1) + E.inkQ(kx + 3, cS1 + H * 0.5, kx + 6, cS1 + H * 0.8, kx + 5, yS + 1, 3, { color: mix(c.deep, K.ink9, 0.25), taper: 'mid', opacity: 0.8 }) + X.line([[kx, cS1 + H * 0.4], [kx + 12, cS1 + H * 0.55], [kx + 20, cS1 + H * 0.5]], 1.3);
    [0.1, 0.28, 0.45, 0.66, 0.8].forEach((u) => { fr += E.nail(x0 + w * u, cS1 + 5 + rnd() * 3, c); });
    const ex = x1 - 18;
    fr += `<path d="${E.P(E.jag([[ex - 10, cS1], [ex + 2, cS1], [ex + 9, cS1 + H * 0.35], [ex + 7, cS1 + H * 0.6], [x1 - 1, yS], [ex - 22, yS], [ex - 14, cS1 + H * 0.5]], rnd, 1.4, 6))}" fill="${K.ink9}"/>`;
    [[ex - 9, cS1 + H * 0.3, 7, 4], [ex - 1, cS1 + H * 0.62, 6, 4], [ex - 14, cS1 + H * 0.8, 8, 4.4]].forEach(([x, y, a, b]) => { fr += `<path d="${E.P(E.jag(E.rect(x - a / 2, y - b / 2, x + a / 2, y + b / 2), rnd, 0.8, 3))}" fill="${c.deep}" stroke="${K.ink9}" stroke-width="0.8"/>`; });
    fr += `<path d="M ${f(x0)},${f(cS1)} L ${f(x1)},${f(cS1)} L ${f(x1)},${f(cS1 + 3)} L ${f(x0)},${f(cS1 + 3.4)} Z" fill="${K.ink9}" opacity="0.5"/>`;
    return X.face(E.rect(x0, cS1, x1, yS), c.base, fr, 0);
  }
})(window.PN);
// ---- Ch1 props (cont.): cart 나무 수레 · pole 전봇대 밑동 ----
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix, L = E.props[1];
  // 나무 수레 (handles to the LEFT; mirror with scale(-1,1)). footprint default 124×60, bed height 22
  L.cart = function (X, o) {
    const c = X.c, rnd = X.rnd, sc = (o.w || 124) / 124;
    let s = `<g transform="scale(${f(sc)})">`;
    const bx0 = -30, bx1 = 54, byT = -44, byF = 6, byB = 16, yG = 30;
    X.meta = { H: 26, name: '나무 수레' };
    s += X.shadow([[bx0, -20], [bx1, -20], [bx1, yG], [bx0, yG]], 18, 9);
    // under-bed black void + rear legs
    s += `<path d="M ${bx0 + 4},${byB} L ${bx1 - 2},${byB} L ${bx1 - 4},${yG - 3} L ${bx0 + 10},${yG - 4} Z" fill="${K.ink9}"/>`;
    s += `<path d="M ${bx1 - 8},${byB} L ${bx1 - 6},${yG} M ${bx1 - 18},${byB} L ${bx1 - 17},${yG - 1}" stroke="${K.ink9}" stroke-width="4.2" stroke-linecap="round"/>`;
    // far handle (behind), bed top planks, front board
    s += E.ribbon(E.qs(bx0 + 2, byT + 10, bx0 - 16, byT + 18, bx0 - 36, byT + 30, 16), 5, { taper: 'none', wobble: 0.1 });
    let planks = '';
    for (let k = 1; k < 5; k++) planks += `<path d="M ${bx0},${f(byT + (byF - byT) * k / 5)} L ${bx1},${f(byT + (byF - byT) * k / 5 + (rnd() - 0.5) * 1.4)}" stroke="${c.deep}" stroke-width="1.5"/>`;
    planks += `<path d="M ${bx0 + 30},${byT + 10} q 3,1 5,-1 M ${bx1 - 20},${byT + 32} q 3,1 5,-1" stroke="${c.deep}" stroke-width="1.1" fill="none"/>`;
    planks += `<path d="M ${bx0},${byT} L ${bx0 + 8},${byT} L ${bx0 + 8},${byF} L ${bx0},${byF} Z M ${bx1 - 8},${byT} L ${bx1},${byT} L ${bx1},${byF} L ${bx1 - 8},${byF} Z" fill="${X.e20}"/>`;
    s += X.face(E.rect(bx0, byT, bx1, byF), mix(c.light, c.base, 0.25), planks, 2);
    s += X.face(E.rect(bx0, byF, bx1, byB), c.base, `<rect x="${bx0}" y="${byF}" width="${bx1 - bx0}" height="10" fill="${X.d20}"/><path d="M ${bx1 - 16},${byF} L ${bx1},${byF} L ${bx1},${byB} L ${bx1 - 22},${byB} Z" fill="${K.ink9}"/>`);
    s += X.out(E.rect(bx0, byT, bx1, byB), 2.6, { gaps: 1, r: 1 });
    s += `<path d="M ${bx0 + 2},${byF} L ${bx1 - 2},${byF}" stroke="${K.ink9}" stroke-width="1.8"/>`;
    // cargo: paper bundle stack (paper300) + sepia-wrapped bundle (spot = top accent) + rolled poster tube
    const bundle = (x, y, w, d, H, fill) => { // tied stack of paper: sheet edges on the front, twine band + knot
      let q = X.shadow(E.rect(x - w / 2, y - d / 2, x + w / 2, y + d / 2), 6, 3.5, 'd40');
      let fr = ''; for (let k = 1; k < 4; k++) fr += `<path d="M ${f(x - w / 2)},${f(y + d / 2 - H + H * k / 4 + (rnd() - 0.5))} L ${f(x + w / 2)},${f(y + d / 2 - H + H * k / 4 + (rnd() - 0.5))}" stroke="${mix(K.p300, K.ink7, 0.5)}" stroke-width="0.9"/>`;
      fr += `<path d="M ${f(x + w / 2 - 5)},${f(y + d / 2 - H)} L ${f(x + w / 2)},${f(y + d / 2 - H)} L ${f(x + w / 2)},${f(y + d / 2)} L ${f(x + w / 2 - 8)},${f(y + d / 2)} Z" fill="${K.ink9}"/>`;
      q += X.face(E.rect(x - w / 2, y + d / 2 - H, x + w / 2, y + d / 2), fill === c.spot ? mix(c.spot, K.ink7, 0.25) : mix(K.p300, c.base, 0.3), fr, 1);
      q += X.face(E.jag(E.rect(x - w / 2, y - d / 2 - H, x + w / 2, y + d / 2 - H), rnd, 0.7, 8), fill, fill === c.spot ? '' : `<path d="M ${f(x - w / 2 + 3)},${f(y - d / 2 - H + 3)} l ${f(w * 0.5)},0" stroke="${c.deep}" stroke-width="0.9"/>`, 1.5);
      q += `<path d="M ${f(x + w * 0.1)},${f(y - d / 2 - H)} L ${f(x + w * 0.1)},${f(y + d / 2)}" stroke="${K.ink9}" stroke-width="1.6"/><circle cx="${f(x + w * 0.1)}" cy="${f(y + d / 2 - H + 1)}" r="2.3" fill="${K.ink9}"/>` + E.inkQ(x + w * 0.1, y + d / 2 - H + 2, x + w * 0.1 - 3, y + d / 2 - H + 6, x + w * 0.1 - 5, y + d / 2 - H + 9, 1.4, { taper: 'end' });
      q += X.out(E.rect(x - w / 2, y - d / 2 - H, x + w / 2, y + d / 2), 2, { r: 1.5 });
      return q;
    };
    const tube = (x, y, len, r, a, tone) => `<g transform="translate(${x},${y}) rotate(${a})"><rect x="${-len / 2}" y="${-r}" width="${len}" height="${2 * r}" rx="${r}" fill="${tone}"/><rect x="${-len / 2}" y="${-r}" width="${len}" height="${2 * r}" rx="${r}" fill="${X.d20}" opacity="0.5"/><path d="M ${-len / 2 + r},${r - 1.5} L ${len / 2 - r},${r - 1.5}" stroke="${K.ink9}" stroke-width="2.2" opacity="0.8"/><rect x="${-len / 2}" y="${-r}" width="${len}" height="${2 * r}" rx="${r}" fill="none" stroke="${K.ink9}" stroke-width="1.9"/><ellipse cx="${-len / 2 + r * 0.6}" cy="0" rx="${f(r * 0.62)}" ry="${r - 0.6}" fill="${mix(tone, K.p100, 0.4)}" stroke="${K.ink9}" stroke-width="1.4"/><path d="M ${-len / 2 + r * 0.6},0 m -1,0 a 1.2,1.6 0 1 1 2,0.6 a 2.4,3 0 1 1 -3.6,-1.2" fill="none" stroke="${K.ink9}" stroke-width="0.8"/><path d="M ${len * 0.12},${-r} v ${2 * r}" stroke="${K.ink9}" stroke-width="1.3"/></g>`;
    s += tube(-2, -16, 40, 5.5, -4, K.p300) + tube(4, -6, 42, 5.5, -2, mix(K.p300, c.light, 0.5)) + tube(0, -24, 36, 5, -8, K.p300) + tube(36, -20, 30, 6, 84, c.spot) + tube(30, -8, 26, 5, 88, K.p300);
    // near wheel: black rim + spokes over the black under-bed void
    const wx = 10, wy = 17, r = 13;
    let spokes = ''; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + 0.3; spokes += `M ${f(wx + Math.cos(a) * 4)},${f(wy + Math.sin(a) * 4)} L ${f(wx + Math.cos(a) * (r - 3))},${f(wy + Math.sin(a) * (r - 3))} `; }
    s += `<circle cx="${wx}" cy="${wy}" r="${r - 2.5}" fill="${K.ink9}" opacity="0.92"/><path d="${spokes}" stroke="${c.light}" stroke-width="2.6"/><path d="${spokes}" stroke="${K.ink9}" stroke-width="0.8" opacity="0.5"/>`;
    s += X.out(E.ellPts(wx, wy, r, r, 40), 3.6, { dense: true, gaps: 1 }) + E.ribbon(E.ellPts(wx, wy, r - 1, r - 1, 30, Math.PI * 1.05, Math.PI * 1.55), 1.2, { color: c.light, taper: 'mid' });
    s += `<circle cx="${wx}" cy="${wy}" r="4.4" fill="${c.deep}" stroke="${K.ink9}" stroke-width="2"/><circle cx="${wx - 1}" cy="${wy - 1}" r="1.2" fill="${K.p100}"/>`;
    // near handle (in front), grip end resting on the ground
    s += E.ribbon(E.qs(bx0 + 4, byF - 2, bx0 - 16, byF + 8, bx0 - 38, byF + 22, 16), 5.4, { taper: 'none', wobble: 0.1 }) + E.ribbon(E.qs(bx0 + 2, byF - 3.4, bx0 - 16, byF + 6.4, bx0 - 34, byF + 18.6, 16), 1.2, { color: c.light, taper: 'mid' });
    s += `</g>`;
    return s;
  };
  // 전봇대 밑동 (pillar) — footprint default 36×36 (r 18), height 48; posters wrapped round, splintered top, wire tie
  L.pole = function (X, o) {
    const c = X.c, rnd = X.rnd, R = (o.w || 34) / 2, H = Math.min(o.H || 26, 28), ry = R * 0.42, top = -H + R * 0.2;
    X.meta = { H, name: '전봇대 밑동' };
    let s = X.shadow(E.ellPts(0, 0, R, ry * 1.2, 20), H * 0.5, H * 0.24);
    const body = `M ${-R},${top} L ${-R},${f(R * 0.25)} A ${R},${ry} 0 0 0 ${R},${f(R * 0.25)} L ${R},${top} Z`;
    let inner = `<rect x="${-R - 2}" y="${top - 2}" width="${2 * R + 4}" height="${H + 6}" fill="${X.d20}"/>`;
    // wrapped posters (curved edges), torn hems
    const band = (y0, y1, x0, x1, fill) => {
      const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8, x = x0 + (x1 - x0) * t, yy = Math.sqrt(Math.max(0, 1 - (x / R) ** 2)) * ry * 0.9; pts.push([x, y0 + yy]); }
      for (let k = 8; k >= 0; k--) { const t = k / 8, x = x0 + (x1 - x0) * t, yy = Math.sqrt(Math.max(0, 1 - (x / R) ** 2)) * ry * 0.9; pts.push([x, y1 + yy + (k % 2 ? rnd() * 4 : -rnd() * 2)]); }
      return `<path d="${E.P(pts)}" fill="${fill}" stroke="${K.ink9}" stroke-width="1.3"/>`;
    };
    inner += band(top + H * 0.16, top + H * 0.56, -R * 0.95, R * 0.4, K.p300) + band(top + H * 0.34, top + H * 0.76, -R * 0.2, R * 1.1, mix(K.p300, c.light, 0.5));
    inner += `<rect x="${-R * 0.7}" y="${f(top + H * 0.28)}" width="${f(R * 0.6)}" height="5" fill="${K.ink9}"/><path d="M ${-R * 0.7},${f(top + H * 0.4)} h ${f(R * 0.7)} M ${-R * 0.7},${f(top + H * 0.46)} h ${f(R * 0.5)}" stroke="${K.ink9}" stroke-width="1.6"/>`;
    // black spot: right third + dark band ring near the foot
    inner += `<path d="M ${f(R * 0.42)},${top - 4} C ${f(R * 0.62)},${f(top + H * 0.3)} ${f(R * 0.5)},${f(top + H * 0.7)} ${f(R * 0.4)},${f(R)} L ${R + 2},${f(R)} L ${R + 2},${top - 4} Z" fill="${K.ink9}"/>`;
    inner += `<path d="M ${-R},${f(-H * 0.12)} A ${R},${ry} 0 0 0 ${R},${f(-H * 0.12)} L ${R},${f(-H * 0.12 + 4)} A ${R},${ry} 0 0 1 ${-R},${f(-H * 0.12 + 4)} Z" fill="${K.ink9}"/>`;
    inner += E.inkQ(-R * 0.62, top + 4, -R * 0.72, top + H * 0.5, -R * 0.6, R * 0.1, 2.2, { color: K.p100, taper: 'mid', opacity: 0.8 });
    s += X.faceD(body, c.base, inner);
    s += X.out(E.cylSil(0, R, ry, top, R * 0.25), 2.6, { dense: true, gaps: 1 });
    // splintered cut top
    s += `<ellipse cx="0" cy="${f(top)}" rx="${R}" ry="${f(ry)}" fill="${c.light}" stroke="${K.ink9}" stroke-width="2.4"/>`;
    s += `<g fill="none" stroke="${c.deep}" stroke-width="1"><ellipse cx="1" cy="${f(top + 0.5)}" rx="${f(R * 0.62)}" ry="${f(ry * 0.6)}"/><ellipse cx="1.5" cy="${f(top + 0.8)}" rx="${f(R * 0.3)}" ry="${f(ry * 0.3)}"/></g>`;
    s += E.crackWedge(R * 0.2, top - ry * 0.6, ry * 1.4, 3.2, rnd, 1);
    { const sp = []; const n = 7; for (let k = 0; k <= n; k++) { const t = k / n, a = Math.PI + t * Math.PI, x = Math.cos(a) * R * 0.98, y = top + Math.sin(a) * ry * 0.98; sp.push([x, y]); if (k < n) { const a2 = Math.PI + (t + 0.5 / n) * Math.PI; sp.push([Math.cos(a2) * R * 0.9, top + Math.sin(a2) * ry - 3 - rnd() * (k === 2 ? 9 : 5)]); } }
      const base = E.ellPts(0, top, R * 0.98, ry * 0.98, 12, 0, Math.PI).reverse();
      s += `<path d="${E.P(sp.concat(base.slice(0, 1)))}" fill="${c.light}" stroke="${K.ink9}" stroke-width="1.6" stroke-linejoin="round"/>`;
      s += `<path d="${E.P(sp.slice(3, 8).concat([[sp[7][0], top]]))}" fill="${K.ink9}" opacity="0.9"/>`; }
    // wire tie loop hanging from a bracket
    s += `<path d="M ${f(-R)},${f(top + H * 0.14)} h -6 v 4 h 6" fill="${K.ink9}" stroke="${K.ink9}" stroke-width="1.4"/>` + E.inkQ(-R - 5, top + H * 0.16, -R - 16, top + H * 0.5, -R - 8, top + H * 0.72, 1.6, { taper: 'end' });
    s += E.rubble(X, R * 0.2, R + 14, R * 0.3, 4);
    return s;
  };
})(window.PN);
// ---- Ch2 철문 예배당 props: gate(쇠창살 칸막이 · 낮은 난간) · glass(떨어진 스테인드 조각) · pillar(부러진 석주 · 홈 파인 원통) ----
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix, L = E.props[2], P = E.P;
  L._alias = { solid: 'gate', pillar: 'pillar' };
  const iron = (x0, y0, x1, y1, w) => E.ribbon([[x0, y0], [x1, y1]], w, { taper: 'none', wobble: 0.05 }) + `<path d="M ${f(x0 - w * 0.22)},${f(y0 + 1)} L ${f(x1 - w * 0.22)},${f(y1 - 1)}" stroke="${K.ink5}" stroke-width="0.8"/>`;
  // 쇠창살 칸막이 — LOW rail: stone sill (H 8) + iron bars 15 + short spear finials ≈ 26 px total. See-through; chained gate section + pewter padlock.
  L.gate = function (X, o) {
    const w = o.w || 150, d = o.d || 22, c = X.c, rnd = X.rnd, Hs = 8, Hb = Math.min(o.H || 15, 18), pitch = 11, tier = E.tier(w, d);
    if (tier !== 'base') return gateBig(X, { w, d }, tier); // K5: mid / large = '철책 제단'
    X.meta = { H: Hs + Hb + 3, name: '쇠창살 칸막이', front: Hs, tier };
    const x0 = -w / 2, x1 = w / 2, yb = d / 2 - Hs - d / 2; // bar foot = sill top (centre line of the top face)
    let s = '';
    // bar shadows on the floor (dotted slants to the lower-right)
    let sh = ''; for (let x = x0 + 9; x <= x1 - 7; x += pitch) sh += `<path d="M ${f(x)},${f(d / 2)} L ${f(x + 3)},${f(d / 2)} L ${f(x + 16)},${f(d / 2 + 8)} L ${f(x + 13)},${f(d / 2 + 8)} Z"/>`;
    s += `<g fill="url(#${X.p}d40)">${sh}</g>`;
    const B = E.block(X, 0, 0, w, d, Hs, { jag: 0.5 });
    s += B.s + X.clipped(E.P(B.front), `<path d="M ${f(x1 - 20)},${f(B.yT1)} L ${f(x1)},${f(B.yT1)} L ${f(x1)},${f(B.yB)} L ${f(x1 - 26)},${f(B.yB)} Z" fill="${K.ink9}"/>` + [0.3, 0.62].map((t) => X.line([[x0 + w * t, B.yT1 + 1], [x0 + w * t + 1, B.yB - 1]], 1.5)).join('')) + B.outline(2.5);
    for (let x = x0 + 9; x <= x1 - 7; x += pitch) s += `<path d="M ${f(x - 2.4)},${f(yb + 0.6)} L ${f(x + 3.4)},${f(yb + 0.6)} L ${f(x + 2.4)},${f(yb + 2.2)} L ${f(x - 1.6)},${f(yb + 2.2)} Z" fill="${mix(c.deep, K.ink9, 0.5)}"/>`;
    const r1 = yb - Hb * 0.82, r2 = yb - Hb * 0.28, gx0 = -16, gx1 = 18;
    s += iron(x0 + 4, r1, x1 - 4, r1, 2.8);
    for (let x = x0 + 9, i = 0; x <= x1 - 7; x += pitch, i++) {
      const gate = x > gx0 && x < gx1, top = yb - Hb - (gate ? 2 : 0) - (i % 2 ? 0 : 1.5);
      s += iron(x, yb + 1, x + (rnd() - 0.5) * 0.8, top + 2.5, 3);
      s += `<path d="M ${f(x - 2.8)},${f(top + 3)} L ${f(x)},${f(top - 3)} L ${f(x + 2.8)},${f(top + 3)} L ${f(x)},${f(top + 1.6)} Z" fill="${K.ink9}"/>`;
    }
    s += iron(x0 + 4, r2, x1 - 4, r2, 2.8);
    // squat end posts (stone, capped)
    [x0 + 3, x1 - 3].forEach((x, i) => { const P2 = E.block(X, x, 0, 11, 12, Hs + Hb + 1, { noShadow: true, rim: false }); s += P2.s + X.clipped(E.P(P2.front), i ? `<rect x="${f(x - 1)}" y="${f(P2.yT1)}" width="8" height="${Hs + Hb + 2}" fill="${K.ink9}"/>` : `<rect x="${f(x + 1)}" y="${f(P2.yT1)}" width="6" height="${Hs + Hb + 2}" fill="${X.d40}"/>`) + P2.outline(2.3); });
    // gate hinge bars + sagging chain + pewter padlock
    s += iron(gx0, r1 - 2, gx0, r2 + 4, 4.4) + iron(gx1, r1 - 2, gx1, r2 + 4, 4.4);
    for (let k = 0; k < 6; k++) { const t = k / 5, x = gx0 + 3 + (gx1 - gx0 - 6) * t, y = r2 - 3 + Math.sin(t * Math.PI) * 4.5; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${k % 2 ? 3 : 3.4}" ry="${k % 2 ? 1.3 : 2.2}" fill="none" stroke="${K.ink9}" stroke-width="2.2"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${k % 2 ? 3 : 3.4}" ry="${k % 2 ? 1.3 : 2.2}" fill="none" stroke="${c.light}" stroke-width="0.7"/>`; }
    const lx = 2, ly = r2 + 4.5;
    s += `<path d="M ${lx - 3},${ly - 1.6} v -3.4 a 3,3 0 0 1 6,0 v 3.4" fill="none" stroke="${K.ink9}" stroke-width="2.2"/><rect x="${lx - 5}" y="${ly - 1.6}" width="10" height="8.4" rx="1.6" fill="${c.spot}" stroke="${K.ink9}" stroke-width="1.8"/><circle cx="${lx}" cy="${ly + 2}" r="1.3" fill="${K.ink9}"/><path d="M ${lx - 3.4},${ly + 0.4} h 2.6" stroke="${mix(c.spot, K.p100, 0.6)}" stroke-width="1"/>`;
    return s;
  };
  // ===== K5 (rev 3) · Ch2 gate, big tiers: '철책 제단' (brief §2.2) =====
  // A low stone dais (front 8) ringed by iron: the north and south railings are bar rows (bars 15 on the dais, finial tips ≤ z 26), the side
  // railings ONE iron rail between stone posts (N–S bars would stack into one line in this view). On the dais: altar stone with a broken
  // corner, a fallen bell (focus), a toppled pew, fallen candlesticks, wax, glass shards. Each railing casts ONE 40 % dot band.
  // E–W railing: bar sockets, two rails, bars (pitch 11) with spear finials; a chained gate leaf between gx0..gx1 (hinge bars, chain, padlock)
  function railRow(X, xa, xb, yb, Hb, pitch, gx0, gx1) {
    const c = X.c, rnd = X.rnd, r1 = yb - Hb * 0.82, r2 = yb - Hb * 0.28;
    let s = '';
    for (let x = xa + 9; x <= xb - 7; x += pitch) s += `<path d="M ${f(x - 2.4)},${f(yb + 0.6)} L ${f(x + 3.4)},${f(yb + 0.6)} L ${f(x + 2.4)},${f(yb + 2.2)} L ${f(x - 1.6)},${f(yb + 2.2)} Z" fill="${mix(c.deep, K.ink9, 0.5)}"/>`;
    s += iron(xa + 4, r1, xb - 4, r1, 2.8);
    for (let x = xa + 9, i = 0; x <= xb - 7; x += pitch, i++) {
      const top = yb - Hb + (i % 2 ? 1.5 : 0); // finial tip = top − 3 ≥ yb − Hb − 3 → z ≤ 26 (the gate leaf is not lifted any more)
      s += iron(x, yb + 1, x + (rnd() - 0.5) * 0.8, top + 2.5, 3) + `<path d="M ${f(x - 2.8)},${f(top + 3)} L ${f(x)},${f(top - 3)} L ${f(x + 2.8)},${f(top + 3)} L ${f(x)},${f(top + 1.6)} Z" fill="${K.ink9}"/>`;
    }
    s += iron(xa + 4, r2, xb - 4, r2, 2.8);
    if (gx1 > gx0) {
      s += iron(gx0, r1 - 2, gx0, r2 + 4, 4.4) + iron(gx1, r1 - 2, gx1, r2 + 4, 4.4);
      for (let k = 0; k < 6; k++) { const t = k / 5, x = gx0 + 3 + (gx1 - gx0 - 6) * t, y = r2 - 3 + Math.sin(t * Math.PI) * 4.5; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${k % 2 ? 3 : 3.4}" ry="${k % 2 ? 1.3 : 2.2}" fill="none" stroke="${K.ink9}" stroke-width="2.2"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${k % 2 ? 3 : 3.4}" ry="${k % 2 ? 1.3 : 2.2}" fill="none" stroke="${c.light}" stroke-width="0.7"/>`; }
      const lx = (gx0 + gx1) / 2 + 1, ly = r2 + 4.5;
      s += `<path d="M ${f(lx - 3)},${f(ly - 1.6)} v -3.4 a 3,3 0 0 1 6,0 v 3.4" fill="none" stroke="${K.ink9}" stroke-width="2.2"/><rect x="${f(lx - 5)}" y="${f(ly - 1.6)}" width="10" height="8.4" rx="1.6" fill="${c.spot}" stroke="${K.ink9}" stroke-width="1.8"/><circle cx="${f(lx)}" cy="${f(ly + 2)}" r="1.3" fill="${K.ink9}"/><path d="M ${f(lx - 3.4)},${f(ly + 0.4)} h 2.6" stroke="${mix(c.spot, K.p100, 0.6)}" stroke-width="1"/>`;
    }
    return s;
  }
  // stone post 11×12, 24 tall from the floor (the base gate's end-post grammar)
  function post(X, x, y, right) {
    const P2 = E.block(X, x, y, 11, 12, 24, { noShadow: true, rim: false });
    return P2.s + X.clipped(E.P(P2.front), right ? `<rect x="${f(x - 1)}" y="${f(P2.yT1)}" width="8" height="26" fill="${K.ink9}"/>` : `<rect x="${f(x + 1)}" y="${f(P2.yT1)}" width="6" height="26" fill="${X.d40}"/>`) + P2.outline(2.3);
  }
  // altar stone (plane centre ax, ay on a floor at z), aw × ad, 10 tall, the north-east corner broken off; a short candlestick (≤ 8) on it
  function altarStone(X, ax, ay, aw, ad, z) {
    const c = X.c, h = 10, x0 = ax - aw / 2, x1 = ax + aw / 2, t0 = ay - ad / 2 - z - h, t1 = ay + ad / 2 - z - h, fb = ay + ad / 2 - z;
    const top = [[x0, t0], [x1 - 12, t0], [x1 - 8, t0 + 3], [x1 - 10, t0 + 6.5], [x1 - 4, t0 + 8.5], [x1, t0 + 12], [x1, t1], [x0, t1]];
    let s = X.shadow(E.rect(x0, ay - ad / 2 - z, x1, fb), h * 0.62 + 4, h * 0.3 + 3);
    s += X.face(E.rect(x0, t1, x1, fb), c.base, `<rect x="${f(x0 - 2)}" y="${f(t1)}" width="${f(aw + 4)}" height="${h + 2}" fill="${X.d20}"/><path d="${E.P([[x1 - 13, t1], [x1 + 2, t1], [x1 + 2, fb + 2], [x1 - 19, fb + 2]])}" fill="${K.ink9}"/>` + X.line([[x0 + aw * 0.34, t1 + 1], [x0 + aw * 0.34 + 0.6, fb - 1]], 1.5), 0);
    s += X.face(top, c.light, `<path d="${E.P([[x0, t0], [x1, t0], [x1, t0 + 2.4], [x0, t0 + 2.4]])}" fill="${X.e20}"/><path d="${E.P([[x0 + aw * 0.55, t0 + 5], [x1 - 14, t0 + 9], [x1 - 6, t1 - 2], [x0 + aw * 0.62, t1 - 1]])}" fill="${X.e20}"/>`, 0);
    s += `<path d="${E.P([[x1 - 12, t0], [x1 - 8, t0 + 3], [x1 - 10, t0 + 6.5], [x1 - 4, t0 + 8.5], [x1, t0 + 12], [x1, t0 + 14.5], [x1 - 5.4, t0 + 10.4], [x1 - 11.6, t0 + 8], [x1 - 10, t0 + 3.4]])}" fill="${mix(c.deep, K.ink9, 0.4)}"/>`; // fracture face
    s += X.rim(x0 + 1.5, t1, x1 - 1.5, t1, 2.2) + X.out(top.slice(0, 6).concat([[x1, fb], [x0, fb]]), 2.5, { gaps: 1, r: 0.8 });
    const kx = x0 + aw * 0.3, ky = (t0 + t1) / 2 + 2; // candlestick: foot, stem, pan, candle stub (paper300) — 8 tall
    s += `<path d="M ${f(kx + 1)},${f(ky + 0.6)} l 8,4 l 2.4,-1.4 l -8,-4 Z" fill="url(#${X.p}d40)"/><ellipse cx="${f(kx)}" cy="${f(ky)}" rx="3.4" ry="1.4" fill="${K.ink7}" stroke="${K.ink9}" stroke-width="1"/><rect x="${f(kx - 0.9)}" y="${f(ky - 5)}" width="1.8" height="5" fill="${K.ink9}"/><ellipse cx="${f(kx)}" cy="${f(ky - 5)}" rx="2.6" ry="1" fill="${K.ink7}" stroke="${K.ink9}" stroke-width="0.8"/><rect x="${f(kx - 1.3)}" y="${f(ky - 8.2)}" width="2.6" height="3.4" fill="${K.p300}" stroke="${K.ink9}" stroke-width="0.8"/>`;
    return s;
  }
  // fallen bell lying on its side, mouth to the upper-right (axis angle rot): ground contact (cx, cy), length L, mouth width D.
  // Round things are foreshortened (kit convention): the drawn width across the axis is 0.72 D, so the top stays ≤ 16 above the floor.
  // Iron ink7 + an ink5 lit band on the upper-left; the inside shows only as a thin ink crescent; no clapper, no light dot.
  function fallenBell(X, cx, cy, L, D, rot) {
    const c = X.c, rnd = X.rnd, h = D * 0.36, ca = Math.cos(rot), sa = Math.sin(rot), my = cy - h;
    const T = (u, v) => [cx + u * ca - v * sa, my + u * sa + v * ca];
    const prof = [[-0.5, 0.3], [-0.36, 0.62], [0, 0.66], [0.28, 0.78], [0.46, 0.98], [0.5, 1]];
    const body = prof.map(([u, v]) => T(u * L, -v * h)).concat(prof.slice().reverse().map(([u, v]) => T(u * L, v * h)));
    const bd = E.crPath(body, true, 5), m = T(L / 2, 0), am = D * 0.13, deg = f(rot * 57.2958);
    let s = X.shadow(E.ellPts(cx + 1, cy - 1, L * 0.5, h * 0.55, 14), h * 0.9, h * 0.45);
    s += `<path d="${E.P([T(-L / 2, -h * 0.2), T(-L / 2 - 3.5, -h * 0.14), T(-L / 2 - 3.5, h * 0.14), T(-L / 2, h * 0.2)])}" fill="${K.ink7}" stroke="${K.ink9}" stroke-width="1.4"/>`; // crown knob
    const lit = `<path d="${E.crPath([T(-L * 0.46, -h * 0.4), T(-L * 0.1, -h * 0.62), T(L * 0.3, -h * 0.74), T(L * 0.44, -h * 0.92), T(L * 0.34, -h * 0.5), T(0, -h * 0.34), T(-L * 0.36, -h * 0.2)], true, 4)}" fill="${K.ink5}"/>`;
    s += X.faceD(bd, K.ink7, lit + E.crackWedge(T(L * 0.08, -h * 0.66)[0], T(L * 0.08, -h * 0.66)[1], h * 1.1, 2.6, rnd, 1));
    s += `<g transform="rotate(${deg} ${f(m[0])} ${f(m[1])})"><ellipse cx="${f(m[0])}" cy="${f(m[1])}" rx="${f(am)}" ry="${f(h)}" fill="${K.ink9}"/><ellipse cx="${f(m[0] - am * 0.42)}" cy="${f(m[1])}" rx="${f(am * 0.86)}" ry="${f(h * 0.94)}" fill="${K.ink7}"/></g>`;
    return s + X.outSm(body, 2.4, { gaps: 1 });
  }
  // toppled pew: backrest flat on the floor (north), seat standing on edge (9 tall), 2–3 legs at uneven spacing sticking out toward the viewer
  function toppledPew(X, cx, cy, L, W, rot) {
    const c = X.c, rnd = X.rnd, ca = Math.cos(rot), sa = Math.sin(rot), hs = 9;
    const P3 = (u, v, z) => [cx + u * ca - v * sa, cy + u * sa + v * ca - z];
    const back = [P3(-L / 2, -W - 1, 2), P3(L / 2, -W - 1, 2), P3(L / 2, -1, 2), P3(-L / 2, -1, 2)];
    const stop = [P3(-L / 2, -1, hs), P3(L / 2, -1, hs), P3(L / 2, 2, hs), P3(-L / 2, 2, hs)], sfr = [P3(-L / 2, 2, hs), P3(L / 2, 2, hs), P3(L / 2, 2, 0), P3(-L / 2, 2, 0)];
    let s = X.shadow(back.concat(sfr), 9, 4.5);
    s += X.face(back, mix(c.base, c.light, 0.35), X.line([P3(-L * 0.47, -W * 0.55, 2), P3(L * 0.47, -W * 0.5, 2)], 1.2, { color: mix(c.deep, K.ink9, 0.2) }), 0) + X.out(back, 1.8, { gaps: 0 });
    s += X.face(sfr, c.base, `<path d="${E.P([P3(L / 2 - 9, 2, hs), P3(L / 2 + 1, 2, hs), P3(L / 2 + 1, 2, -1), P3(L / 2 - 13, 2, -1)])}" fill="${K.ink9}"/><path d="${E.P(sfr)}" fill="${X.d20}"/>`, 0) + X.face(stop, c.light, '', 0);
    [-0.37, 0.02 + rnd() * 0.08, 0.36].forEach((k, i) => { const u = k * L; if (i === 1 && L < 90) return; const a = P3(u, 2, 4.5), b = P3(u, 9, 4.5); s += `<path d="M ${f(a[0])},${f(a[1])} L ${f(b[0])},${f(b[1])}" stroke="${K.ink9}" stroke-width="4.2" stroke-linecap="square"/><path d="M ${f(a[0] - 0.8)},${f(a[1] + 0.6)} L ${f(b[0] - 0.8)},${f(b[1] - 0.4)}" stroke="${K.ink5}" stroke-width="1"/>`; });
    return s + X.out(stop.slice(0, 2).concat([sfr[1], sfr[2], sfr[3]]), 2.2, { gaps: 1, r: 0.6 });
  }
  // fallen iron candlestick: rod (w 3) from the foot plate (x, y) for len at angle a; drip pan + broken candle (paper300, ≤ 4×8) at the end
  function fallenCandle(X, x, y, len, a) {
    const c = X.c, ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len, nx = -Math.sin(a), ny = Math.cos(a);
    let s = `<path d="${E.P([[x + 2, y + 2.5], [ex + 2, ey + 2.5], [ex + 3.6, ey + 4.6], [x + 3.6, y + 4.6]])}" fill="${X.d40}"/>` + iron(x, y, ex, ey, 3);
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.4" ry="4.4" fill="${K.ink7}" stroke="${K.ink9}" stroke-width="1.4" transform="rotate(${f(a * 57.2958)} ${f(x)} ${f(y)})"/>`;
    s += `<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="1.4" ry="3.4" fill="${K.ink7}" stroke="${K.ink9}" stroke-width="1" transform="rotate(${f(a * 57.2958)} ${f(ex)} ${f(ey)})"/>`;
    const q = [ex + Math.cos(a) * 1.6, ey + Math.sin(a) * 1.6];
    s += `<path d="${E.P([[q[0] + nx * 1.8, q[1] + ny * 1.8], [q[0] + Math.cos(a) * 6.5 + nx * 1.6, q[1] + Math.sin(a) * 6.5 + ny * 1.6], [q[0] + Math.cos(a) * 7.4 - nx * 0.4, q[1] + Math.sin(a) * 7.4 - ny * 0.4], [q[0] + Math.cos(a) * 5.6 - nx * 1.9, q[1] + Math.sin(a) * 5.6 - ny * 1.9], [q[0] - nx * 1.8, q[1] - ny * 1.8]])}" fill="${K.p300}" stroke="${K.ink9}" stroke-width="1"/>`;
    return s;
  }
  // fallen stained-glass shard (glass grammar at ≈ 0.5): black thickness strip (H 3), two panes split by one lead came, exactly one spot pane
  function glassShard(X, cx, cy, k, rot, flip) {
    const c = X.c, P0 = [[-12, -3], [-3, -10], [12, -7], [10, 5], [-7, 8]].map(([u, v]) => [cx + (u * Math.cos(rot) - v * Math.sin(rot)) * k, cy + (u * Math.sin(rot) + v * Math.cos(rot)) * k]);
    const m0 = [(P0[0][0] + P0[1][0]) / 2, (P0[0][1] + P0[1][1]) / 2], m1 = [(P0[2][0] + P0[3][0]) / 2, (P0[2][1] + P0[3][1]) / 2], d = E.P(P0), lite = mix(c.light, c.base, 0.4);
    let s = `<path d="${E.P(P0.map(([x, y]) => [x + 0.6, y + 3]))}" fill="${K.ink9}"/><path d="${d}" fill="${flip ? c.spot : lite}"/>`;
    s += X.clipped(d, `<path d="${E.P([m0, P0[1], P0[2], m1])}" fill="${flip ? lite : c.spot}"/><path d="M ${f(m0[0])},${f(m0[1])} L ${f(m1[0])},${f(m1[1])}" stroke="${K.ink9}" stroke-width="1.8"/><path d="M ${f(m0[0] - 0.6)},${f(m0[1] - 0.6)} L ${f(m1[0] - 0.6)},${f(m1[1] - 0.6)}" stroke="${K.ink5}" stroke-width="0.6"/>`);
    return s + X.out(P0, 2, { gaps: 0 });
  }
  function gateBig(X, o, tier) {
    const c = X.c, rnd = X.rnd, w = o.w, d = o.d, Hs = 8, Hb = 15, lg = tier === 'large', Z = Hs;
    X.meta = { H: Hs + Hb + 3, name: '철책 제단', front: Hs, tier };
    const x0 = -w / 2, x1 = w / 2, yN = -d / 2, yS = d / 2, fx = x1 - 4, ybN = yN + 4 - Hs, ybS = yS - 4 - Hs, px = x1 - 4.5, py = yS - 6;
    // floor band of the south railing's shadow (one 40 % band, not a slant per bar)
    let s = `<path d="${E.P([[x0 + 16, yS + 1], [x1 - 2, yS + 1], [x1 + 5, yS + 9], [x0 + 22, yS + 9]])}" fill="${X.d40}"/>`;
    // dais: c.light top, radial joints (8 spokes from (0, −0.05d), two short arcs — never a closed circle), north railing shadow band; sill front
    const jc = [0, -0.05 * d - Hs], jcol = mix(c.light, c.deep, 0.45);
    let tj = '';
    for (let i = 0; i < 8; i++) { // each spoke ends on the top face's edge (getBBox ignores clipping, so nothing is drawn past it)
      const a = (i + 0.5) * Math.PI / 4 + (rnd() - 0.5) * 0.14, ux = Math.cos(a), uy = Math.sin(a), ex = ux > 0 ? x1 - 1 : x0 + 1, ey = uy > 0 ? yS - Hs - 1 : yN - Hs + 1;
      const tm = Math.min(Math.abs(ux) > 1e-6 ? (ex - jc[0]) / ux : 1e9, Math.abs(uy) > 1e-6 ? (ey - jc[1]) / uy : 1e9);
      tj += `<path d="M ${f(jc[0] + ux * 18)},${f(jc[1] + uy * 18)} L ${f(jc[0] + ux * tm)},${f(jc[1] + uy * tm)}" stroke="${jcol}" stroke-width="1.5"/>`;
    }
    [[0.3, 0.55, 1.25], [0.53, 2.45, 0.9]].forEach(([rr, a0, da]) => { const r = d * rr; tj += `<path d="M ${f(jc[0] + Math.cos(a0) * r)},${f(jc[1] + Math.sin(a0) * r)} A ${f(r)},${f(r)} 0 0 1 ${f(jc[0] + Math.cos(a0 + da) * r)},${f(jc[1] + Math.sin(a0 + da) * r)}" fill="none" stroke="${jcol}" stroke-width="1.5"/>`; });
    tj += `<path d="${E.P([[-fx + 6, ybN], [fx - 4, ybN], [fx + 2, ybN + 8], [-fx + 12, ybN + 8]])}" fill="${X.d40}"/>`;
    const B = E.block(X, 0, 0, w, d, Hs, { jag: 0.5, topInner: tj });
    s += B.s + X.clipped(E.P(B.front), `<path d="M ${f(x1 - 20)},${f(B.yT1)} L ${f(x1)},${f(B.yT1)} L ${f(x1)},${f(B.yB)} L ${f(x1 - 26)},${f(B.yB)} Z" fill="${K.ink9}"/>` + [0.3, 0.62].map((t) => X.line([[x0 + w * t, B.yT1 + 1], [x0 + w * t + 1, B.yB - 1]], 1.5)).join('')) + B.outline(2.5);
    // north railing + its posts
    s += railRow(X, -px, px, ybN, Hb, 11, 0, 0) + post(X, -px, -py, false) + post(X, px, -py, true);
    // dais props (on z = 8: a floor point (x, y) is drawn at (x, y − 8)), back to front
    const it = [];
    const SH = lg ? [[-104, -62, 0.55, 0.4, 0], [-30, 54, 0.5, -0.5, 1], [108, -12, 0.45, 1.1, 0], [-82, 16, 0.4, 2.2, 1], [-117, -22, 0.42, -0.9, 1]] : [[-70, -36, 0.5, 0.4, 0], [-22, 44, 0.45, -0.6, 1]]; // K5 F1-R1: large adds a shard + wax cluster at the left-middle
    SH.forEach(([x, y, k, r, fl]) => it.push([y - 1e3, glassShard(X, x, y - Z, k, r, fl)])); // flat (H 3): always under the standing props
    const WX = lg ? [[-96, 40, 2], [92, -46, 2], [-8, 12, 1], [-104, -20, 3]] : [[-62, 30, 2], [-8, 8, 2], [60, -40, 2]]; // [x, y, drops]: 8 / 6 drops (brief 4–8)
    let wax = ''; WX.forEach(([x, y, nd]) => { for (let k = 0; k < nd; k++) { const r = 1 + rnd() * 2; wax += `<ellipse cx="${f(x + (rnd() - 0.5) * 18)}" cy="${f(y - Z + (rnd() - 0.5) * 10)}" rx="${f(r)}" ry="${f(r * 0.8)}" fill="${mix(c.base, c.deep, 0.38)}" stroke="${mix(c.base, c.deep, 0.5)}" stroke-width="0.8"/>`; } });
    it.push([-1e3, wax]);
    const A = lg ? [20, -20, 95, 53] : [14, -14, 68, 36];
    it.push([A[1] + A[3] / 2, altarStone(X, A[0], A[1], A[2], A[3], Z)]);
    const BL = lg ? [-50, -9.5, 30, 22] : [-36, -6.5, 24, 18], bx0 = BL[0] - BL[2] * 0.45, by0 = BL[1] - Z + 1, kc = mix(c.deep, K.ink9, 0.3);
    it.push([-999, X.line([[bx0, by0], [bx0 - 9, by0 + 5], [bx0 - 16, by0 + 4]], 1.3, { color: kc }) + X.line([[bx0 + 2, by0 + 2], [bx0 + 1, by0 + 11], [bx0 - 5, by0 + 17]], 1.2, { color: kc })]); // impact cracks
    it.push([BL[1] + 2, fallenBell(X, BL[0], BL[1] - Z, BL[2], BL[3], -0.32 + (rnd() - 0.5) * 0.16)]); // seed: small angle changes only
    const PW = lg ? [50, 34, 106, 16, -(0.14 + rnd() * 0.1)] : [36, 23, 76, 12, -(0.14 + rnd() * 0.1)]; // pew −8…−14°
    it.push([PW[1] + 3, toppledPew(X, PW[0], PW[1] - Z, PW[2], PW[3], PW[4])]);
    if (lg) it.push([65, toppledPew(X, -62, 62 - Z, 58, 12, 0.12)]); // large: a second, shorter pew fills the front-left
    (lg ? [[-100, 46, 38, -0.3], [92, -50, 30, 2.75]] : [[-64, 34, 32, -0.35], [72, -40, 28, 2.6]]).forEach(([x, y, len, a]) => it.push([y, fallenCandle(X, x, y - Z, len, a + (rnd() - 0.5) * 0.4)]));
    it.sort((p, q) => p[0] - q[0]).forEach((p) => { s += p[1]; });
    // side railings: one iron rail (w 3, ink + ink5 core) at bar-rail height between the posts; the large tier adds a middle post per side
    const rz = Hs + Hb * 0.82;
    [-fx, fx].forEach((x) => { s += iron(x, -py - rz + 2, x, py - rz, 3); });
    if (lg) s += post(X, -px, 0, false) + post(X, px, 0, true);
    // south railing with the chained gate leaf (x −18…18) + its posts
    s += railRow(X, -px, px, ybS, Hb, 11, -18, 18) + post(X, -px, py, false) + post(X, px, py, true);
    return s;
  }
  // 떨어진 스테인드 조각 — 4 large angular shards lying flat (H 3). Each: thick lead came border, 2–4 panes (duotone light/base + dots),
  // exactly ONE pewter spot pane, a curved came fragment (it was a round window) and a paper glint. Heavy ink silhouette around the cluster.
  L.glass = function (X, o) {
    const c = X.c, rnd = X.rnd, sc = (o.w || 104) / 104, th = 3;
    X.meta = { H: th, name: '스테인드 조각' };
    const shards = [
      { pts: [[-50, 2], [-30, -24], [-6, -20], [-12, 10], [-38, 18]], arc: [-44, 40, 58] },
      { pts: [[-8, -26], [22, -30], [34, -8], [10, 4], [-4, -6]], arc: [8, 40, 44] },
      { pts: [[-10, 12], [12, 2], [40, 6], [30, 28], [0, 30]], arc: [16, -26, 40] },
      { pts: [[38, -14], [52, -4], [46, 10], [36, 2]], arc: null }
    ].map((sd) => ({ pts: sd.pts.map(([x, y]) => [x * sc, y * sc]), arc: sd.arc && sd.arc.map((v) => v * sc) }));
    const tones = [c.light, mix(c.light, c.base, 0.45), c.base];
    let s = X.shadow([].concat(...shards.map((sd) => sd.pts)), 6, 3.5);
    shards.forEach((sd, i) => {
      const pts = sd.pts, dd = E.P(pts), cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      // edge thickness strip (black) under the lower edges
      s += `<path d="${P(pts.map(([x, y]) => [x + 0.6, y + th]))}" fill="${K.ink9}"/>`;
      // panes: split by two came lines through the centre + a curved came (fragment of the rose tracery)
      const a = rnd() * Math.PI, ux = Math.cos(a), uy = Math.sin(a);
      const spotSide = i % 2;
      let pn = `<rect x="-80" y="-60" width="160" height="120" fill="${tones[i % 3]}"/>`;
      pn += `<path d="${P([[cx, cy], [cx + ux * 60, cy + uy * 60], [cx + ux * 60 - uy * 60, cy + uy * 60 + ux * 60], [cx - uy * 60, cy + ux * 60]])}" fill="${spotSide ? c.spot : tones[(i + 1) % 3]}"/>`;
      pn += `<path d="${P([[cx, cy], [cx - ux * 60, cy - uy * 60], [cx - ux * 60 + uy * 60, cy - uy * 60 - ux * 60], [cx + uy * 60, cy - ux * 60]])}" fill="${spotSide ? tones[(i + 2) % 3] : c.spot}"/>`;
      pn += `<path d="${P([[cx, cy], [cx + ux * 60, cy + uy * 60], [cx + ux * 60 + uy * 60, cy + uy * 60 - ux * 60], [cx + uy * 60, cy - ux * 60]])}" fill="${X.d20}"/>`;
      let came = `M ${f(cx - ux * 40)},${f(cy - uy * 40)} L ${f(cx + ux * 40)},${f(cy + uy * 40)} M ${f(cx)},${f(cy)} L ${f(cx - uy * 40)},${f(cy + ux * 40)}`;
      if (sd.arc) came += ` M ${f(sd.arc[0] - sd.arc[2])},${f(sd.arc[1])} a ${f(sd.arc[2])},${f(sd.arc[2])} 0 0 1 ${f(sd.arc[2] * 2)},0`;
      pn += `<path d="${came}" fill="none" stroke="${K.ink9}" stroke-width="2.3"/>`;
      pn += `<path d="${came}" fill="none" stroke="${K.ink5}" stroke-width="0.7" transform="translate(-0.7,-0.7)"/>`;
      // one paper glint on the lightest pane (tapered, upper-left)
      pn += E.inkQ(pts[0][0] + (cx - pts[0][0]) * 0.3, pts[0][1] + (cy - pts[0][1]) * 0.3 + 3, pts[0][0] + (cx - pts[0][0]) * 0.4, pts[0][1] + (cy - pts[0][1]) * 0.4 - 1, pts[0][0] + (cx - pts[0][0]) * 0.55, pts[0][1] + (cy - pts[0][1]) * 0.55 - 3, 1.8, { color: K.p50, taper: 'mid' });
      if (i === 0) pn += E.crackWedge(cx - 4, cy - 12, 16, 2.4, rnd, 1);
      s += `<path d="${dd}" fill="${tones[i % 3]}"/>` + X.clipped(dd, pn);
      s += X.out(pts, 2.7, { gaps: i === 3 ? 0 : 1 });
    });
    // small splinters near the broken edge
    [[54, 16, 5, 0.4], [-54, 14, 4, 1.3], [44, 26, 4, 2.2]].forEach(([x, y, r, a]) => { const pts = [[x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7], [x + Math.cos(a + 2.2) * r * 0.8, y + Math.sin(a + 2.2) * r * 0.6], [x + Math.cos(a + 3.9) * r, y + Math.sin(a + 3.9) * r * 0.7]].map(([u, v]) => [u * sc, v * sc]); s += `<path d="${P(pts)}" fill="${c.light}" stroke="${K.ink9}" stroke-width="1.5" stroke-linejoin="miter"/>`; });
    return s;
  };
  // 부러진 석주 — fluted stone drum on a square plinth, fractured on a DIAGONAL (high left 24 → low right 13), broken chunks at the foot.
  // No iron band, no rivets. Elliptic top (3/4), flutes = lit/shadow stripe pairs following the curvature.
  L.pillar = function (X, o) {
    const c = X.c, rnd = X.rnd, R = (o.w || 50) / 2 * 0.78, ry = R * 0.45, hHi = Math.min(o.H || 22, 24), hLo = hHi * 0.5, lift = 4;
    X.meta = { H: hHi + lift, name: '부러진 석주' };
    const PL = E.block(X, 0, 0, R * 2.5, R * 1.7, lift, {});
    let s = PL.s + PL.outline(2.2);
    const yb = -lift, hAt = (x) => hHi - (hHi - hLo) * (x + R) / (2 * R);
    const base = E.ellPts(0, yb, R, ry, 40, 0, Math.PI + 1e-6);
    const topE = (a) => { const x = Math.cos(a) * R; return [x, yb + Math.sin(a) * ry - hAt(x) + (Math.sin(a) < 0 ? 0 : 0)]; };
    const topRing = []; for (let i = 0; i <= 40; i++) topRing.push(topE(i / 40 * Math.PI * 2));
    const front = base.concat(topRing.slice(0, 21).reverse());
    let fi = `<rect x="${-R - 2}" y="${yb - hHi - ry - 4}" width="${2 * R + 4}" height="${hHi + 2 * ry + 8}" fill="${X.d20}"/>`;
    for (let k = -3; k <= 3; k++) { const a = Math.PI / 2 - k * Math.PI / 8, x = Math.cos(a) * R * 0.97, yB = yb + Math.sin(a) * ry, yT = yB - hAt(x); fi += `<path d="M ${f(x + 1.4)},${f(yT + 1)} L ${f(x + 1.4)},${f(yB - 0.5)}" stroke="${K.ink9}" stroke-width="${f(k > 0 ? 2.2 : 1.5)}" opacity="${k > 0 ? 0.95 : 0.7}"/><path d="M ${f(x - 0.5)},${f(yT + 1)} L ${f(x - 0.5)},${f(yB - 0.5)}" stroke="${c.light}" stroke-width="0.9" opacity="${k > 0 ? 0.25 : 0.8}"/>`; }
    fi += `<path d="M ${f(R * 0.4)},${f(yb - hHi - 10)} C ${f(R * 0.58)},${f(yb - hHi * 0.4)} ${f(R * 0.5)},${f(yb)} ${f(R * 0.38)},${f(yb + ry + 2)} L ${R + 2},${f(yb + ry + 2)} L ${R + 2},${f(yb - hHi - 10)} Z" fill="${K.ink9}"/>`;
    s += X.face(front, c.base, fi, 0);
    // fracture plane (diagonal): light broken face with a darker lower-right chip and one crack wedge
    const fr = topRing.map(([x, y], i) => [x, y + (Math.sin(i / 40 * Math.PI * 2) < -0.2 ? -(rnd() * 3) : rnd() * 1.2)]);
    s += X.face(fr, c.light, `<path d="${P([[R * 0.1, yb - hHi], [R * 1.1, yb - hLo - ry], [R * 1.1, yb - hLo + ry], [R * 0.2, yb - hHi * 0.6 + ry * 0.5]])}" fill="${X.e40}"/><path d="${P([[-R * 0.8, yb - hHi - ry * 0.4], [-R * 0.3, yb - hHi - ry * 0.8], [-R * 0.5, yb - hHi + ry * 0.2]])}" fill="${K.p100}"/>`, 0);
    s += E.crackWedge(-R * 0.05, yb - hHi * 0.85 - ry * 0.6, ry * 1.4, 2.6, rnd, 1);
    s += X.out(fr.slice(20).concat(base), 2.6, { dense: true, gaps: 1 });
    // broken drum chunks at the foot (angular, straight edges)
    const chunk = (x, y, s0, rot) => { const pts = [[-s0, 0], [-s0 * 0.4, -s0 * 0.8], [s0 * 0.7, -s0 * 0.6], [s0, s0 * 0.2], [0, s0 * 0.5]].map(([u, v]) => [x + u * Math.cos(rot) - v * Math.sin(rot), y + u * Math.sin(rot) + v * Math.cos(rot)]); return X.face(pts, c.light, `<path d="${P([pts[2], pts[3], pts[4], [pts[4][0], pts[4][1] - 2]])}" fill="${K.ink9}"/>`, 0) + X.out(pts, 1.8, { gaps: 0 }); };
    s += chunk(R * 1.35, R * 0.55, 5.5, 0.3) + chunk(R * 1.7, R * 0.15, 4, -0.6) + chunk(-R * 1.3, R * 0.62, 4.2, 1.1);
    return s;
  };
})(window.PN);
// ---- Ch3 무채 운하 props: embank(운하 석축) · sluice(수문짝) · reeds(갈대) · bollard(계류 말뚝, pillar). Water = ink wash only, never cyan ----
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix, L = E.props[3];
  L._alias = { solid: 'embank', pillar: 'bollard' };
  const ripple = (x, y, rx, c, n = 2) => { let s = ''; for (let k = 0; k < n; k++) s += E.ribbon(E.ellPts(x, y, rx + k * 7, (rx + k * 7) * 0.3, 30, 0.15, Math.PI - 0.15), 1.4 - k * 0.3, { color: mix(c.base, c.deep, 0.8), taper: 'mid' }); return s; };
  E.ripple = ripple;
  const drip = (x, y, len, c, w = 2.4) => E.inkQ(x, y, x + 0.8, y + len * 0.5, x - 0.4, y + len, w, { color: mix(c.deep, K.ink9, 0.35), taper: 'start', wobble: 0.2 }) + `<circle cx="${f(x - 0.4)}" cy="${f(y + len + 1.4)}" r="${f(w * 0.55)}" fill="${mix(c.deep, K.ink9, 0.35)}"/>`;
  // 운하 석축 — narrow canal curb wall: coping row on top (5 unequal chipped blocks, one MISSING = black gap), two ashlar courses,
  // wet waterline band, mooring ring, moss-dot cluster and a drip stain. Straight edges only. Default footprint 150×16, H 26 (top ≈ 38 % of the height).
  L.embank = function (X, o) {
    const w = o.w || 150, d = o.d || 16, H = Math.min(o.H || 26, 28), c = X.c, rnd = X.rnd, P = E.P, tier = E.tier(w, d);
    if (tier !== 'base') return embankBig(X, { w, d }, tier); // K5: mid / large = '갈대 둑'
    X.meta = { H, name: '운하 석축', front: H, tier };
    const x0 = -w / 2, x1 = w / 2, yT0 = -d / 2 - H, yT1 = d / 2 - H, yB = d / 2, cf = 4; // cf = coping front strip
    // coping block layout (unequal widths), one missing block
    const cuts = [x0]; let x = x0; while (x < x1 - 14) { x += 18 + rnd() * 26; cuts.push(Math.min(x, x1)); } if (cuts[cuts.length - 1] < x1) cuts[cuts.length - 1] = x1;
    const miss = Math.min(cuts.length - 2, 2 + Math.floor(rnd() * 2)), mx0 = cuts[miss], mx1 = cuts[miss + 1];
    let s = X.shadow(E.rect(x0, -d / 2, x1, yB), H * 0.62 + 4, H * 0.3 + 3);
    // FRONT (ashlar)
    let fr = `<rect x="${x0 - 2}" y="${yT1}" width="${w + 4}" height="${H + 2}" fill="${X.d20}"/>`;
    const cy1 = yT1 + cf, cy2 = cy1 + (H - cf) * 0.5;
    let jn = `M ${f(x0)},${f(cy1)} H ${f(x1)} M ${f(x0)},${f(cy2)} H ${f(x1)} `;
    [[cy1, cy2, 0], [cy2, yB, 1]].forEach(([ya, yb, r]) => { let xx = x0 + (r ? 12 + rnd() * 10 : 24 + rnd() * 14); while (xx < x1 - 8) { jn += `M ${f(xx)},${f(ya)} V ${f(yb)} `; xx += 26 + rnd() * 22; } });
    fr += `<path d="${jn}" stroke="${mix(c.deep, K.ink9, 0.25)}" stroke-width="1.5" fill="none"/>`;
    fr += `<rect x="${x0 - 2}" y="${yB - 6}" width="${w + 4}" height="7" fill="${X.d40}"/>`;
    fr += `<rect x="${x0}" y="${cy1}" width="${w}" height="2.2" fill="${K.ink9}" opacity="0.55"/>`; // shadow under the coping lip
    fr += `<path d="${P(E.jag([[x1 - 24, cy1], [x1 + 2, cy1], [x1 + 2, yB + 1], [x1 - 34, yB + 1], [x1 - 26, cy1 + (H - cf) * 0.45]], rnd, 1, 6))}" fill="${K.ink9}"/>`;
    fr += E.dripStain(x0 + w * 0.2, cy1 + 2, H * 0.62, c, 2.6) + E.dripStain(x0 + w * 0.47, cy1 + 2, H * 0.4, c, 2.1) + E.dripStain((mx0 + mx1) / 2, yT1 + 2, H * 0.7, c, 3);
    const rx = x0 + w * 0.62, ry = cy2 - 1;
    fr += `<rect x="${f(rx - 3)}" y="${f(ry - 5)}" width="6" height="4.6" fill="${K.ink9}"/><ellipse cx="${f(rx)}" cy="${f(ry + 4)}" rx="5.4" ry="5.8" fill="none" stroke="${K.ink9}" stroke-width="2.8"/><path d="M ${f(rx - 4.6)},${f(ry + 1.2)} a 5.4,5.8 0 0 1 3.6,-2.8" fill="none" stroke="${K.ink5}" stroke-width="1"/>`;
    s += X.face(E.rect(x0, yT1, x1, yB), c.base, fr, 0);
    // coping front strip per block (light) — missing block leaves a notch
    for (let i = 0; i < cuts.length - 1; i++) { if (i === miss) continue; const a = cuts[i] + 0.8, b = cuts[i + 1] - 0.8; s += `<path d="${P(E.rect(a, yT1, b, cy1))}" fill="${mix(c.light, c.base, 0.35)}"/><path d="M ${f(a)},${f(cy1)} H ${f(b)}" stroke="${K.ink9}" stroke-width="1.5"/>`; }
    // TOP: coping blocks, chipped corners, straight edges
    for (let i = 0; i < cuts.length - 1; i++) {
      const a = cuts[i] + 0.8, b = cuts[i + 1] - 0.8;
      if (i === miss) { s += `<path d="${P([[a, yT0 + 1], [b, yT0 + 1], [b, cy1], [a, cy1]])}" fill="${K.ink9}"/>` + E.rubble(X, a + 2, b - 4, yT1 - 3, 2); continue; }
      const ch = rnd() * 4 + 2.5, corner = Math.floor(rnd() * 3);
      let pts = [[a, yT0], [b, yT0], [b, yT1], [a, yT1]];
      if (corner === 0) pts = [[a + ch, yT0], [b, yT0], [b, yT1], [a, yT1], [a, yT0 + ch * 0.8]];
      if (corner === 1) pts = [[a, yT0], [b - ch, yT0], [b, yT0 + ch * 0.8], [b, yT1], [a, yT1]];
      if (corner === 2) pts = [[a, yT0], [b, yT0], [b, yT1 - ch * 0.6], [b - ch, yT1], [a, yT1]];
      const tone = i % 2 ? c.light : mix(c.light, c.base, 0.2);
      s += X.face(pts, tone, `<path d="${P([[a, yT0], [b, yT0], [b, yT0 + 2.4], [a, yT0 + 2.4]])}" fill="${X.e20}"/>`, 0) + `<path d="${P(pts)}" fill="none" stroke="${K.ink9}" stroke-width="1.5" stroke-linejoin="miter"/>`;
    }
    // moss cluster straddling a joint + one wet glint
    const mxx = cuts[1] - 2; for (let k = 0; k < 13; k++) s += `<circle cx="${f(mxx + (rnd() - 0.5) * 16)}" cy="${f(yT0 + 2 + rnd() * (d - 4))}" r="${f(0.8 + rnd() * 1.5)}" fill="${mix(c.deep, K.ink9, 0.3)}"/>`;
    s += `<path d="M ${f(x0 + w * 0.78)},${f(yT0 + d * 0.5)} l 3,-1 l -1,1.6 Z" fill="${K.p50}"/>`;
    s += X.rim(x0 + 1.5, yT1, mx0, yT1, 2.2) + X.rim(mx1, yT1, x1 - 1.5, yT1, 2.2);
    s += X.out([[x0, yB], [x0, yT0], [mx0, yT0], [mx0, yT0 + 1], [mx1, yT0 + 1], [mx1, yT0], [x1, yT0], [x1, yB]], 2.6, { gaps: 1, r: 0.4 });
    s += ripple(x0 + w * 0.3, yB + 6, 26, c) + ripple(x1 - w * 0.2, yB + 7, 18, c, 1);
    return s;
  };
  // ===== K5 (rev 3) · Ch3 embank, big tiers: '갈대 둑' (brief §2.3) =====
  // Coping stones (t 10 / 12, top z 26) ring an earth bank that has settled to z 10. On the wet bank: reed beds (2 big at the north and west,
  // small ones in front), one ragged puddle and a half-sunk boat (focus). No cyan anywhere: the water is an ink wash.
  // reed clump on the bank (floor at screen = plane − zb): plane centre (cx, cy), pw × pd; blades 10–16 tall (tips ≤ z 26), back blades
  // mix(deep, ink7, .6) 2.6, front blades ink9 3.0–3.4, 1–3 cattails (L.reeds grammar). Blade tips stay inside the plane footprint.
  function reedBed(X, cx, cy, pw, pd, zb, nCat, xl, xr) {
    const c = X.c, rnd = X.rnd, n = Math.min(112, Math.round((pw * 0.7 + pd * 0.4) * 1.4)), B = [], tri = () => rnd() + rnd() - 1; // centre-weighted spread; K5 F1-R2: 1.4× blades
    for (let k = 0; k < n; k++) { const bx = cx + tri() * pw * 0.6, by = cy + tri() * pd * 0.6, len = k % 3 === 1 ? 13.5 + rnd() * 2.5 : 9.5 + rnd() * 3.5; let lean = ((bx - cx) / (pw / 2)) * 5 + (rnd() - 0.5) * 10 - 2; lean = Math.max(xl - bx, Math.min(xr - bx, lean)); B.push({ bx, by, len, lean, back: by < cy - pd * 0.12 }); } // staggered heights (⅓ tall 13.5–16, ⅔ short 9.5–13); ≈ ⅓ back (grey), ⅔ front (ink)
    B.sort((a, b) => a.by - b.by);
    let s = `<path d="${E.crPath(E.ellPts(cx, cy - zb + 1, pw * 0.5, pd * 0.5, 9).map(([x, y]) => [x + (rnd() - 0.5) * pw * 0.14, y + (rnd() - 0.5) * pd * 0.22]), true)}" fill="${mix(c.base, c.deep, 0.85)}"/>`; // root mat
    for (const b of B) {
      const y0 = b.by - zb, p1 = [b.bx + b.lean * 0.3, y0 - b.len * 0.5], p2 = [b.bx + b.lean, y0 - b.len];
      s += E.ribbon(E.qs(b.bx, y0, p1[0], p1[1], p2[0], p2[1], 16), b.back ? 2.6 : 3 + rnd() * 0.4, { color: b.back ? mix(c.deep, K.ink7, 0.6) : K.ink9, taper: 'start', wobble: 0.1 });
      if (!b.back && rnd() > 0.7) s += E.ribbon(E.qs(b.bx - 0.8, y0 - b.len * 0.2, p1[0] - 0.8, p1[1], p1[0] + b.lean * 0.3 - 0.8, p1[1] - b.len * 0.2, 10), 0.9, { color: c.light, taper: 'mid' });
    }
    for (let k = 0; k < nCat; k++) { // cattail: stalk + ink head (rotated) with a light stroke and a short spike — top ≤ 16 above the bank
      const x = cx + (k - (nCat - 1) / 2) * pw * 0.28 + (rnd() - 0.5) * 6, y = cy + (rnd() - 0.2) * pd * 0.4 - zb, a = (rnd() - 0.5) * 16, hy = y - 10.5;
      s += E.inkQ(x - a * 0.05, y, x - a * 0.02, y - 6, x, hy + 3, 1.6, { taper: 'none' }) + `<g transform="rotate(${f(a)} ${f(x)} ${f(hy)})"><ellipse cx="${f(x)}" cy="${f(hy)}" rx="2.6" ry="3.6" fill="${K.ink9}"/><path d="M ${f(x - 1.6)},${f(hy - 2.4)} q -0.8,2.4 0,4.8" stroke="${c.light}" stroke-width="1" fill="none"/><path d="M ${f(x)},${f(hy - 3.6)} v -1.8" stroke="${K.ink9}" stroke-width="1.2"/></g>`;
    }
    return s;
  }
  // half-sunk boat: gunwale lens (bow +u), ink7 hull with an ink5 lit gunwale on the upper-left, deep plank seams 1.5, two thwarts of
  // different width and angle, a broken plank gap (black spot) near the stern, the stern buried in mud. Centre (cx, cy) on the water line.
  function sunkBoat(X, cx, cy, L, W, rot) {
    const c = X.c, rnd = X.rnd, ca = Math.cos(rot), sa = Math.sin(rot), gz = 5;
    const T = (u, v, z = 0) => [cx + u * ca - v * sa, cy + u * sa + v * ca - z];
    const G = [[0.5, 0], [0.34, 0.36], [0.06, 0.5], [-0.3, 0.46], [-0.5, 0.34], [-0.5, -0.34], [-0.3, -0.46], [0.06, -0.5], [0.34, -0.36]];
    const gun = G.map(([u, v]) => T(u * L, v * W, gz)), near = G.slice(0, 5).map(([u, v]) => T(u * L, v * W, gz)), nearW = G.slice(0, 5).map(([u, v]) => T(u * L, v * W, 1)).reverse();
    const inn = E.shrink(gun, 2.8).map(([x, y]) => [x, y + 2.2]);
    let s = X.shadow(gun.map(([x, y]) => [x, y + gz]), 6, 3);
    s += `<path d="${E.P(near.concat(nearW))}" fill="${K.ink7}"/><path d="${E.P(near.concat(nearW))}" fill="${X.d20}"/>`; // near hull side above the water
    s += `<path d="${E.crPath(gun, true, 4)}" fill="${K.ink5}"/>`;
    let fl = '';
    [-0.24, 0.02, 0.26].forEach((v) => { fl += `<path d="M ${f(T(-0.5 * L, v * W, 2)[0])},${f(T(-0.5 * L, v * W, 2)[1])} L ${f(T(0.48 * L, v * W * 0.3, 2)[0])},${f(T(0.48 * L, v * W * 0.3, 2)[1])}" stroke="${c.deep}" stroke-width="1.5"/>`; });
    [[-0.2, 3.4, 0.08], [0.16, 2.4, -0.16]].forEach(([u, tw, ta]) => { const a = T((u - ta) * L, -0.6 * W, 3), b = T((u + ta) * L, 0.6 * W, 3); fl += `<path d="M ${f(a[0])},${f(a[1])} L ${f(b[0])},${f(b[1])}" stroke="${K.ink9}" stroke-width="${f(tw + 1.6)}"/><path d="M ${f(a[0])},${f(a[1])} L ${f(b[0])},${f(b[1])}" stroke="${mix(K.ink5, c.deep, 0.5)}" stroke-width="${f(tw)}"/>`; });
    const g0 = T(-0.36 * L, 0.05 * W, 2);
    fl += `<path d="${E.P(E.jag([[g0[0] - 4, g0[1] - 2], [g0[0] + 5, g0[1] - 3], [g0[0] + 6, g0[1] + 2], [g0[0] - 3, g0[1] + 3]], rnd, 1, 3))}" fill="${K.ink9}"/>`; // broken plank gap
    s += `<path d="${E.crPath(inn, true, 4)}" fill="${K.ink7}"/>` + X.clipped(E.crPath(inn, true, 4), fl);
    s += E.ribbon(E.cr(gun.slice(4, 9), false, 4), 1.4, { color: mix(K.ink5, c.light, 0.35), taper: 'mid' }); // lit gunwale (far / upper-left side)
    s += X.outSm(gun, 2.2, { gaps: 1 });
    const st = T(-0.5 * L, 0, 0); // mud swallowing the stern + a water ring at the bow
    s += `<path d="${E.crPath(E.ellPts(st[0] - 2, st[1] + 2, W * 0.42, W * 0.32, 8).map(([x, y]) => [x + (rnd() - 0.5) * 3, y + (rnd() - 0.5) * 2]), true)}" fill="${mix(c.base, c.deep, 0.62)}"/>`;
    return s + ripple(T(0.42 * L, 0, 0)[0], T(0.42 * L, 0, 0)[1] + 2, 8, c, 1);
  }
  // ragged puddle (never an ellipse): 11 points, radius 0.72–1.22, jagged edge; ink-wash fill mix(base, deep, .36), 2 ripple arcs, one glint ≤ 6×2
  function puddle(X, cx, cy, rx, ry) {
    const c = X.c, rnd = X.rnd, pts = [];
    for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2, k = 0.72 + rnd() * 0.5; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    const d = E.P(E.jag(pts, rnd, 1.6, 9));
    return `<path d="${d}" fill="${mix(c.base, c.deep, 0.36)}"/><path d="${d}" fill="none" stroke="${mix(c.deep, K.ink9, 0.2)}" stroke-width="1.5" opacity="0.7"/>` +
      ripple(cx - rx * 0.28, cy + ry * 0.12, rx * 0.3, c, 1) + ripple(cx + rx * 0.3, cy - ry * 0.3, rx * 0.2, c, 1) + `<path d="M ${f(cx - rx * 0.5)},${f(cy - ry * 0.42)} q 3,-1.6 6,0 q -3,1.4 -6,0 Z" fill="${K.p50}"/>`;
  }
  function embankBig(X, o, tier) {
    const c = X.c, rnd = X.rnd, w = o.w, d = o.d, H = 26, ZB = 10, lg = tier === 'large', t = lg ? 12 : 10;
    X.meta = { H, name: '갈대 둑', front: H, tier };
    const x0 = -w / 2, x1 = w / 2, yN = -d / 2, yS = d / 2, ix0 = x0 + t, ix1 = x1 - t, iyN = yN + t, iyS = yS - t;
    const cN0 = yN - H, cN1 = iyN - H, cS0 = iyS - H, cS1 = yS - H, bT = iyN - ZB, bw = ix1 - ix0, bdp = iyS - iyN;
    const U = (u) => ix0 + u * bw, V = (v) => iyN + v * bdp;   // bank plane: u across, v back → front
    const cuts = (a, b) => { const L = [a]; let x = a; while (x < b - 14) { x += 18 + rnd() * 26; L.push(Math.min(x, b)); } L[L.length - 1] = b; return L; };
    const stone = (x0b, y0b, x1b, y1b, i) => { // coping block: alternating light tones, 1.5 ink line, one chipped corner (L.embank grammar)
      const ch = 2.5 + rnd() * 3.5, k = Math.floor(rnd() * 3); let pts = E.rect(x0b, y0b, x1b, y1b);
      if (k === 0) pts = [[x0b + ch, y0b], [x1b, y0b], [x1b, y1b], [x0b, y1b], [x0b, y0b + ch * 0.8]];
      if (k === 1) pts = [[x0b, y0b], [x1b - ch, y0b], [x1b, y0b + ch * 0.8], [x1b, y1b], [x0b, y1b]];
      if (k === 2) pts = [[x0b, y0b], [x1b, y0b], [x1b, y1b - ch * 0.6], [x1b - ch, y1b], [x0b, y1b]];
      return `<path d="${E.P(pts)}" fill="${i % 2 ? c.light : mix(c.light, c.base, 0.2)}"/><path d="${E.P(pts)}" fill="none" stroke="${K.ink9}" stroke-width="1.5" stroke-linejoin="miter"/>`;
    };
    const gap = (x0b, y0b, x1b, y1b) => `<path d="${E.P(E.rect(x0b, y0b, x1b, y1b))}" fill="${K.ink9}"/>` + E.rubble(X, x0b + 2, Math.max(x0b + 3, x1b - 4), y1b - 4, 2); // missing block
    let s = X.shadow(E.rect(x0, yN, x1, yS), H * 0.62 + 4, H * 0.3 + 3);
    // north coping, inner face (16 tall): base + 20 % dots, the shade under the coping, joints, two wet ink runs
    let ni = `<rect x="${f(ix0 - 2)}" y="${f(cN1 - 2)}" width="${f(bw + 4)}" height="${H - ZB + 4}" fill="${X.d20}"/><rect x="${f(ix0)}" y="${f(cN1)}" width="${f(bw)}" height="2.2" fill="${K.ink9}" opacity="0.55"/>`;
    for (let x = ix0 + 20 + rnd() * 16; x < ix1 - 10; x += 30 + rnd() * 22) ni += `<path d="M ${f(x)},${f(cN1 + 2)} L ${f(x + (rnd() - 0.5) * 1.5)},${f(bT)}" stroke="${mix(c.deep, K.ink9, 0.25)}" stroke-width="1.5"/>`;
    ni += E.dripStain(U(0.3), cN1 + 3, (H - ZB) * 0.6, c, 2.4) + E.dripStain(U(0.71), cN1 + 3, (H - ZB) * 0.45, c, 2);
    s += X.face(E.rect(ix0, cN1, ix1, bT), c.base, ni, 0);
    // the settled bank (z 10): wet earth, inner shadow bands (north 8, west 14), moss, 1–2 cracks, the puddle
    let bi = `<rect x="${f(ix0)}" y="${f(bT)}" width="${f(bw)}" height="8" fill="${X.d40}"/><rect x="${f(ix0)}" y="${f(bT + 8)}" width="14" height="${f(cS0 - bT - 8)}" fill="${X.d40}"/>`;
    bi += X.line([[U(0.22), V(0.56) - ZB], [U(0.31), V(0.63) - ZB], [U(0.4), V(0.6) - ZB]], 1.5, { color: mix(c.deep, K.ink9, 0.25) });
    if (lg) bi += X.line([[U(0.78), V(0.18) - ZB], [U(0.86), V(0.24) - ZB], [U(0.95), V(0.2) - ZB]], 1.5, { color: mix(c.deep, K.ink9, 0.25) });
    (lg ? [[0.3, 0.73], [0.74, 0.82], [0.5, 0.22]] : [[0.33, 0.75], [0.82, 0.62]]).forEach(([u, v]) => { for (let q = 0; q < 9; q++) bi += `<circle cx="${f(U(u) + (rnd() - 0.5) * 16)}" cy="${f(V(v) - ZB + (rnd() - 0.5) * 8)}" r="${f(0.8 + rnd() * 1.4)}" fill="${mix(c.deep, K.ink9, 0.3)}"/>`; });
    const PU = lg ? [0.6, 0.45, 54, 28] : [0.62, 0.45, 36, 18];
    bi += puddle(X, U(PU[0]), V(PU[1]) - ZB, PU[2], PU[3]);
    s += X.face(E.rect(ix0, bT, ix1, cS0), mix(c.base, c.deep, 0.5), bi, 0) + X.line([[ix0 + 1, bT], [ix1 - 1, bT]], 1.5, { color: mix(c.deep, K.ink9, 0.4), taper: 'none' });
    // north + side coping (before the reeds: blades may overlap them), missing blocks: north (all), east (large, seed)
    const cn = cuts(x0, x1), miss = Math.min(cn.length - 2, 1 + Math.floor(rnd() * (cn.length - 2))), mx0 = cn[miss], mx1 = cn[miss + 1];
    for (let i = 0; i < cn.length - 1; i++) s += i === miss ? gap(cn[i] + 0.8, cN0 + 1, cn[i + 1] - 0.8, cN1) : stone(cn[i] + 0.8, cN0, cn[i + 1] - 0.8, cN1, i);
    const eMiss = lg && rnd() < 0.6;
    [[x0, ix0, false], [ix1, x1, eMiss]].forEach(([xa, xb, mm]) => { const cv = cuts(cN1, cS0), mi = mm ? 1 + Math.floor(rnd() * Math.max(1, cv.length - 3)) : -1; for (let i = 0; i < cv.length - 1; i++) s += i === mi ? gap(xa + 0.8, cv[i] + 0.8, xb - 0.8, cv[i + 1] - 0.8) : stone(xa + 0.8, cv[i] + 0.8, xb - 0.8, cv[i + 1] - 0.8, i + 1); });
    const mj = cn[Math.max(1, miss - 1)] - 2; for (let k = 0; k < 13; k++) s += `<circle cx="${f(mj + (rnd() - 0.5) * 16)}" cy="${f(cN0 + 2 + rnd() * (t - 4))}" r="${f(0.8 + rnd() * 1.5)}" fill="${mix(c.deep, K.ink9, 0.3)}"/>`; // moss on a joint
    s += `<path d="M ${f(x0 + w * 0.8)},${f(cN0 + t * 0.5)} l 3,-1 l -1,1.6 Z" fill="${K.p50}"/>`; // the one wet glint on the coping
    // bank props, back to front: reed beds (big ones north + west, small ones in front), the half-sunk boat (focus)
    const xl = x0 + 2, xr = x1 - 2, it = [];
    const RB = lg ? [[0.38, 0.15, 116, 38, 3], [0.12, 0.52, 38, 110, 2], [0.4, 0.74, 34, 14, 1], [0.86, 0.68, 28, 12, 1], [0.88, 0.2, 26, 11, 1], [0.64, 0.8, 24, 10, 1]] : [[0.42, 0.15, 78, 25, 2], [0.12, 0.5, 26, 72, 2], [0.62, 0.72, 30, 12, 1], [0.86, 0.26, 24, 10, 1]]; // 1–3 cattails per bed
    RB.forEach(([u, v, pw, pd, nc]) => it.push([V(v) + pd / 2, reedBed(X, U(u), V(v), pw, pd, ZB, nc, xl, xr)]));
    const BT = lg ? [0.6, 0.43, 70, 24, 0.3] : [0.64, 0.42, 50, 18, 0.35];
    it.push([V(BT[1]) + 6, sunkBoat(X, U(BT[0]), V(BT[1]) - ZB, BT[2], BT[3], BT[4])]);
    it.sort((p, q) => p[0] - q[0]).forEach((p) => { s += p[1]; });
    // south coping (hides the bank behind it) and the front face: coping lip strip, two ashlar courses, shade, water band, drips, ring
    const cs = cuts(x0, x1), cf = 4, cy1 = cS1 + cf, cy2 = cy1 + (H - cf) * 0.5;
    for (let i = 0; i < cs.length - 1; i++) s += stone(cs[i] + 0.8, cS0, cs[i + 1] - 0.8, cS1, i);
    let fr = `<rect x="${f(x0 - 2)}" y="${f(cS1)}" width="${f(w + 4)}" height="${H + 2}" fill="${X.d20}"/>`;
    let jn = `M ${f(x0)},${f(cy1)} H ${f(x1)} M ${f(x0)},${f(cy2)} H ${f(x1)} `;
    [[cy1, cy2, 0], [cy2, yS, 1]].forEach(([ya, yb, r]) => { let xx = x0 + (r ? 12 + rnd() * 10 : 24 + rnd() * 14); while (xx < x1 - 8) { jn += `M ${f(xx)},${f(ya)} V ${f(yb)} `; xx += 26 + rnd() * 22; } });
    fr += `<path d="${jn}" stroke="${mix(c.deep, K.ink9, 0.25)}" stroke-width="1.5" fill="none"/><rect x="${f(x0 - 2)}" y="${f(yS - 6)}" width="${f(w + 4)}" height="7" fill="${X.d40}"/><rect x="${f(x0)}" y="${f(cy1)}" width="${f(w)}" height="2.2" fill="${K.ink9}" opacity="0.55"/>`;
    fr += `<path d="${E.P(E.jag([[x1 - 24, cy1], [x1 + 2, cy1], [x1 + 2, yS + 1], [x1 - 34, yS + 1], [x1 - 26, cy1 + (H - cf) * 0.45]], rnd, 1, 6))}" fill="${K.ink9}"/>`;
    fr += E.dripStain(x0 + w * 0.2, cy1 + 2, H * 0.62, c, 2.6) + E.dripStain(x0 + w * 0.47, cy1 + 2, H * 0.4, c, 2.1) + E.dripStain(x0 + w * 0.66, cy1 + 2, H * 0.52, c, 2.4);
    const rx = x0 + w * 0.58, ry = cy2 - 1;
    fr += `<rect x="${f(rx - 3)}" y="${f(ry - 5)}" width="6" height="4.6" fill="${K.ink9}"/><ellipse cx="${f(rx)}" cy="${f(ry + 4)}" rx="5.4" ry="5.8" fill="none" stroke="${K.ink9}" stroke-width="2.8"/><path d="M ${f(rx - 4.6)},${f(ry + 1.2)} a 5.4,5.8 0 0 1 3.6,-2.8" fill="none" stroke="${K.ink5}" stroke-width="1"/>`;
    s += X.face(E.rect(x0, cS1, x1, yS), c.base, fr, 0);
    for (let i = 0; i < cs.length - 1; i++) { const a = cs[i] + 0.8, b = cs[i + 1] - 0.8; s += `<path d="${E.P(E.rect(a, cS1, b, cy1))}" fill="${mix(c.light, c.base, 0.35)}"/><path d="M ${f(a)},${f(cy1)} H ${f(b)}" stroke="${K.ink9}" stroke-width="1.5"/>`; }
    // edges: rims, inner coping edges, silhouette (1-unit notch at the missing north block), ripples on the floor in front
    const edge = (a, b) => E.ribbon(E.jag([a, b], rnd, 0.4, 12, false), 1.8, { color: K.ink9, taper: 'none', wobble: 0.25 });
    s += X.rim(x0 + 1.5, cS1, x1 - 1.5, cS1, 2.2) + (mx0 > ix0 ? X.rim(ix0 + 1, cN1, Math.min(mx0, ix1 - 1), cN1, 2.2) : '') + (mx1 < ix1 ? X.rim(Math.max(mx1, ix0 + 1), cN1, ix1 - 1, cN1, 2.2) : '');
    s += edge([ix0, cN1 + 0.5], [ix0, cS0]) + edge([ix1, cN1 + 0.5], [ix1, cS0]) + edge([ix0, cS0], [ix1, cS0]);
    s += X.out([[x0, yS], [x0, cN0], [mx0, cN0], [mx0, cN0 + 1], [mx1, cN0 + 1], [mx1, cN0], [x1, cN0], [x1, yS]], 2.6, { gaps: 1, r: 0.4 });
    return s + ripple(x0 + w * 0.3, yS + 6, 26, c) + ripple(x1 - w * 0.2, yS + 7, 18, c, 1);
  }
  L.sluice = function (X, o) {
    const w = o.w || 124, d = o.d || 30, c = X.c, rnd = X.rnd, pw = 22, Hp = Math.min(o.H || 26, 28), Hg = Hp - 8;
    X.meta = { H: Hp, name: '수문짝' };
    const x0 = -w / 2, x1 = w / 2;
    let s = X.shadow(E.rect(x0, -d / 2, x1, d / 2), 26, 12);
    // gate panel (between posts)
    const g = E.block(X, 0, 2, w - 2 * pw + 6, d * 0.5, Hg, { noShadow: true });
    let gi = `<rect x="${x0}" y="${g.yT1}" width="${w}" height="${Hg}" fill="${X.d20}"/>`;
    for (let x = g.x0 + 10; x < g.x1; x += 10) gi += `<path d="M ${f(x)},${f(g.yT1)} L ${f(x + (rnd() - 0.5))},${f(g.yB)}" stroke="${c.deep}" stroke-width="1.3"/>`;
    [0.28, 0.72].forEach((t) => { const y = g.yT1 + Hg * t; gi += `<rect x="${g.x0}" y="${f(y - 2.6)}" width="${g.x1 - g.x0}" height="5.2" fill="${K.ink9}"/><path d="M ${g.x0},${f(y - 2)} H ${g.x1}" stroke="${K.ink5}" stroke-width="0.9"/>`; for (let x = g.x0 + 6; x < g.x1; x += 14) gi += `<circle cx="${f(x)}" cy="${f(y)}" r="1.2" fill="${c.light}"/>`; });
    gi += `<rect x="${g.x0}" y="${f(g.yB - 6)}" width="${g.x1 - g.x0}" height="7" fill="${K.ink9}" opacity="0.85"/>`;
    [0.3, 0.62].forEach((t) => { gi += drip(g.x0 + (g.x1 - g.x0) * t, g.yT1 + Hg * 0.76, 7, c, 2); });
    s += g.s + X.clipped(E.P(g.front), gi) + g.outline();
    // posts
    [[x0 + pw / 2, 0], [x1 - pw / 2, 1]].forEach(([x, right]) => {
      const P = E.block(X, x, 0, pw, d, Hp, { noShadow: true });
      s += P.s + X.clipped(E.P(P.front), right ? `<path d="M ${f(x + pw * 0.05)},${P.yT1} h ${pw} v ${Hp} h ${-pw * 0.9} Z" fill="${K.ink9}"/>` : `<path d="M ${f(x + pw * 0.3)},${P.yT1} h ${pw} v ${Hp} h ${-pw * 0.9} Z" fill="${X.d40}"/>`) + `<path d="M ${f(x - pw / 2)},${f(P.yT1 + Hp * 0.5)} h ${pw}" stroke="${K.ink9}" stroke-width="1.3"/>` + P.outline();
      // gate groove
      s += `<rect x="${f(right ? x - pw / 2 - 1 : x + pw / 2 - 3)}" y="${f(P.yT0 + 2)}" width="4" height="${f(d - 4)}" fill="${K.ink9}"/>`;
    });
    // crank wheel on the right post top + chain down to the gate
    const wx = x1 - pw / 2, wy = -d / 2 - Hp + d / 2 - 4;
    s += `<path d="M ${f(wx)},${f(wy + 4)} L ${f(wx)},${f(wy - 6)}" stroke="${K.ink9}" stroke-width="4"/>`;
    s += `<ellipse cx="${f(wx)}" cy="${f(wy - 7)}" rx="12" ry="5" fill="none" stroke="${K.ink9}" stroke-width="3.2"/>`;
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; s += `<path d="M ${f(wx - Math.cos(a) * 12)},${f(wy - 7 - Math.sin(a) * 5)} L ${f(wx + Math.cos(a) * 12)},${f(wy - 7 + Math.sin(a) * 5)}" stroke="${K.ink9}" stroke-width="1.6"/>`; }
    s += `<circle cx="${f(wx)}" cy="${f(wy - 7)}" r="2.4" fill="${c.spot}" stroke="${K.ink9}" stroke-width="1.4"/>`;
    for (let k = 0; k < 5; k++) { const x = wx - 14 - k * 6, y = wy - 2 + k * 5.2; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${k % 2 ? 1.6 : 3}" ry="${k % 2 ? 3 : 2}" fill="none" stroke="${K.ink9}" stroke-width="2"/>`; }
    s += ripple(-8, d / 2 + 6, 30, c) + ripple(x0 + 8, d / 2 + 4, 12, c, 1);
    return s;
  };
  // 갈대 — reed clump in a shallow pool: tapered brush blades (sumi), cattail heads, ripples (non-blocking decor, footprint ~60×28)
  L.reeds = function (X, o) {
    const c = X.c, rnd = X.rnd, sc = (o.w || 60) / 60;
    X.meta = { H: Math.round(28 * sc), name: '갈대(비차단 장식)' };
    let s = `<g transform="scale(${f(sc)})">`;
    s += `<path d="${E.crPath(E.ellPts(2, 6, 30, 10, 9).map((q) => [q[0] + (rnd() - 0.5) * 6, q[1] + (rnd() - 0.5) * 3]), true)}" fill="${mix(c.base, c.deep, 0.55)}"/>` + ripple(2, 6, 34, c, 2);
    const blades = [];
    for (let k = 0; k < 17; k++) { const bx = -18 + rnd() * 38, len = 14 + rnd() * 14, lean = (bx / 20) * 10 + (rnd() - 0.5) * 16 - 4, back = k < 7; blades.push({ bx, len, lean, back }); }
    blades.sort((a, b) => (a.back ? 0 : 1) - (b.back ? 0 : 1));
    for (const b of blades) {
      const y0 = 6 + (b.back ? -3 : 1) + rnd() * 2, pts = [[b.bx, y0], [b.bx + b.lean * 0.3, y0 - b.len * 0.5], [b.bx + b.lean, y0 - b.len]];
      s += E.ribbon(E.qs(pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1], 18), b.back ? 2.6 : 3.4, { color: b.back ? mix(c.deep, K.ink7, 0.6) : K.ink9, taper: 'start', wobble: 0.1 });
      if (!b.back && rnd() > 0.55) s += E.ribbon(E.qs(pts[0][0] - 0.8, pts[0][1] - b.len * 0.2, pts[1][0] - 0.8, pts[1][1], pts[1][0] + b.lean * 0.3 - 0.8, pts[1][1] - b.len * 0.2, 10), 0.9, { color: c.light, taper: 'mid' });
    }
    [[-8, -13, 3], [6, -16, -2], [16, -10, 6]].forEach(([x, y, a]) => { s += E.inkQ(x - a * 0.3, 6, x - a * 0.2, y + 20, x, y + 6, 1.8, { taper: 'none' }) + `<g transform="rotate(${a * 2} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="3" ry="5.6" fill="${K.ink9}"/><path d="M ${x - 2},${y - 5} q -1,5 0,10" stroke="${c.light}" stroke-width="1" fill="none"/><path d="M ${x},${y - 8} v -5" stroke="${K.ink9}" stroke-width="1.2"/></g>`; });
    s += `</g>`;
    return s;
  };
  // 계류 말뚝 (pillar) — tarred wooden post, iron cap, coiled rope; footprint default 28×28
  L.bollard = function (X, o) {
    const c = X.c, rnd = X.rnd, R = (o.w || 28) / 2, H = Math.min(o.H || 24, 28), ry = R * 0.42, top = -H + R * 0.4;
    X.meta = { H, name: '계류 말뚝' };
    let s = X.shadow(E.ellPts(0, 0, R, ry * 1.2, 20), H * 0.5, H * 0.24) + ripple(0, R * 0.5, R + 8, c, 2);
    const body = `M ${-R},${f(top)} L ${-R},${f(R * 0.25)} A ${R},${f(ry)} 0 0 0 ${R},${f(R * 0.25)} L ${R},${f(top)} Z`;
    let inner = `<rect x="${-R - 2}" y="${f(top - 2)}" width="${2 * R + 4}" height="${H + 6}" fill="${X.d40}"/><path d="M ${f(R * 0.2)},${f(top - 4)} C ${f(R * 0.4)},${f(top + H * 0.3)} ${f(R * 0.3)},${f(top + H * 0.7)} ${f(R * 0.2)},${f(R)} L ${R + 2},${f(R)} L ${R + 2},${f(top - 4)} Z" fill="${K.ink9}"/>`;
    for (let k = 0; k < 3; k++) inner += `<path d="M ${f(-R * 0.6 + k * 5)},${f(top + 6 + k * 9)} l 0.6,${f(8 + rnd() * 8)}" stroke="${c.light}" stroke-width="1" opacity="0.8"/>`;
    // rope coil band
    const ry0 = top + H * 0.42;
    for (let k = 0; k < 3; k++) { const y = ry0 + k * 5; inner += `<path d="M ${-R},${f(y)} A ${R},${f(ry)} 0 0 0 ${R},${f(y)} L ${R},${f(y + 4.4)} A ${R},${f(ry)} 0 0 1 ${-R},${f(y + 4.4)} Z" fill="${c.light}" stroke="${K.ink9}" stroke-width="1.2"/>`; for (let q = -3; q <= 3; q++) inner += `<path d="M ${f(q * R / 3.5)},${f(y + Math.sqrt(1 - (q / 3.5) ** 2) * ry)} l 2.4,4" stroke="${K.ink9}" stroke-width="0.9"/>`; }
    s += X.faceD(body, c.deep, inner) + X.out(E.cylSil(0, R, ry, top, R * 0.25), 2.6, { dense: true, gaps: 1 });
    s += `<ellipse cx="0" cy="${f(top)}" rx="${R + 2}" ry="${f(ry + 1)}" fill="${K.ink9}"/><ellipse cx="-1" cy="${f(top - 1)}" rx="${R - 1}" ry="${f(ry - 1)}" fill="${K.ink7}"/><path d="M ${f(-R * 0.6)},${f(top - 1.5)} q ${f(R * 0.4)},-2.5 ${f(R * 0.9)},-1" stroke="${c.light}" stroke-width="1.2" fill="none"/>`;
    s += E.inkQ(R - 1, ry0 + 12, R + 8, ry0 + 20, R + 4, R * 0.6, 3, { color: c.light, taper: 'end' }).replace('/>', ` stroke="${K.ink9}" stroke-width="1"/>`);
    return s;
  };
})(window.PN);
// ---- Ch4 시계 무덤 props: clock(괘종 묘비) · gears(톱니 잔해 더미) · hand(부러진 분침) · tomb(문자판 묘비, pillar) ----
// spot 바랜 황동 = flat fills on upward faces only (never rings/hatch — bible §3.3)
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix, L = E.props[4];
  L._alias = { solid: 'clock', pillar: 'tomb' };
  function dial(X, cx, cy, r, rnd, broken = true) {
    const c = X.c; let s = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${c.light}" stroke="${K.ink9}" stroke-width="2.4"/>`;
    let t = ''; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r0 = r * (i % 3 ? 0.78 : 0.66); t += `M ${f(cx + Math.cos(a) * r0)},${f(cy + Math.sin(a) * r0)} L ${f(cx + Math.cos(a) * r * 0.9)},${f(cy + Math.sin(a) * r * 0.9)} `; }
    s += `<path d="${t}" stroke="${K.ink9}" stroke-width="${f(Math.max(1, r * 0.09))}"/>`;
    s += `<path d="M ${f(cx)},${f(cy)} L ${f(cx - r * 0.35)},${f(cy - r * 0.42)}" stroke="${K.ink9}" stroke-width="${f(r * 0.14)}" stroke-linecap="round"/>`;
    s += broken ? `<path d="M ${f(cx)},${f(cy)} L ${f(cx + r * 0.3)},${f(cy + r * 0.2)} L ${f(cx + r * 0.55)},${f(cy + r * 0.62)}" fill="none" stroke="${K.ink9}" stroke-width="${f(r * 0.1)}" stroke-linejoin="bevel"/>` : `<path d="M ${f(cx)},${f(cy)} L ${f(cx + r * 0.1)},${f(cy - r * 0.72)}" stroke="${K.ink9}" stroke-width="${f(r * 0.1)}"/>`;
    s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.12)}" fill="${K.ink9}"/>`;
    if (broken) s += E.crackWedge(cx - r * 0.6, cy - r * 0.8, r * 1.3, 2.4, rnd, 1);
    return s;
  }
  E.dial = dial;
  // 괘종 묘비 — LOW plinth (H 18) with the clock dial set flush into its top plane (spot 바랜 황동 = flat plate fill, never a ring),
  // and the clock's pendulum case lying flat beside it (H 8): glass window on its up-facing front shows rod + bob.
  // recessed blank name plate (brief §1.6-5): filled face, inner shade on the top + left, light lip on the bottom + right. Never an empty outline.
  const plaque = (x0, y0, x1, y1, fill, shade, lip, sw = 1.5, lw = 0.8) => `<path d="${E.P(E.rect(x0, y0, x1, y1))}" fill="${fill}"/>` +
    `<path d="M ${f(x0 + sw / 2)},${f(y1)} L ${f(x0 + sw / 2)},${f(y0 + sw / 2)} L ${f(x1)},${f(y0 + sw / 2)}" fill="none" stroke="${shade}" stroke-width="${sw}"/>` +
    `<path d="M ${f(x0 + sw)},${f(y1 - lw / 2)} L ${f(x1 - lw / 2)},${f(y1 - lw / 2)} L ${f(x1 - lw / 2)},${f(y0 + sw)}" fill="none" stroke="${lip}" stroke-width="${lw}"/>`;
  E.plaque = plaque;
  L.clock = function (X, o) {
    const c = X.c, rnd = X.rnd, w = o.w || 84, d = o.d || 38, H = Math.min(o.H || 18, 28), sc = w / 84, tier = E.tier(w, d);
    if (tier !== 'base') return clockBig(X, { w, d }, tier); // K5: mid / large = '문자판 받침'
    X.meta = { H, name: '괘종 묘비', front: H, tier };
    // K5 §2.4 base fix: the plinth now runs up to the lying case (pw = w − cw − 1), so no floor gap shows inside the footprint (bible §7.2)
    const cw = 17 * sc, pw = w - cw - 1, px = -w / 2 + pw / 2, cx = w / 2 - cw / 2 - 1;
    let s = X.shadow(E.rect(-w / 2, -d / 2, w / 2 - cw - 1, d / 2), H * 0.62 + 4, H * 0.3 + 3);
    // pendulum case lying flat (N–S), behind-right of the plinth front
    const C = E.block(X, cx, 2, cw, d - 4, 8, { jag: 0.3 });
    const wx0 = C.x0 + 3.5, wx1 = C.x1 - 3.5, wy0 = C.yT0 + 5, wy1 = C.yT1 - 4;
    let ci = `<path d="${P([[C.x0 + 1.5, C.yT0 + 1.5], [C.x1 - 1.5, C.yT0 + 1.5], [C.x1 - 1.5, C.yT1 - 1.5], [C.x0 + 1.5, C.yT1 - 1.5]])}" fill="none" stroke="${mix(c.deep, K.ink9, 0.35)}" stroke-width="1"/>`;
    ci += `<path d="${P(E.rect(wx0, wy0, wx1, wy1))}" fill="${K.ink7}"/><path d="M ${f((wx0 + wx1) / 2)},${f(wy0 + 1)} L ${f((wx0 + wx1) / 2 + 1.2)},${f(wy1 - 7)}" stroke="${c.light}" stroke-width="1.2"/>`;
    ci += `<path d="${P([[(wx0 + wx1) / 2 - 3.8, wy1 - 9], [(wx0 + wx1) / 2 + 5, wy1 - 8], [(wx0 + wx1) / 2 + 4, wy1 - 2.4], [(wx0 + wx1) / 2 - 4, wy1 - 3]])}" fill="${c.spot}" stroke="${K.ink9}" stroke-width="1.2"/>`;
    ci += `<path d="${P([[wx0, wy0], [wx0 + 4, wy0], [wx0, wy0 + 12]])}" fill="${K.ink3}"/>` + E.crackWedge(wx1 - 2, wy0, (wy1 - wy0) * 0.6, 2.2, rnd, -1);
    s += C.s + X.clipped(E.P(C.top), ci) + X.clipped(E.P(C.front), `<path d="${P([[C.x1 - 6, C.yT1], [C.x1 + 2, C.yT1], [C.x1 + 2, C.yB], [C.x1 - 8, C.yB]])}" fill="${K.ink9}"/>`) + C.outline(2.4);
    // plinth
    const B = E.block(X, px, 0, pw, d, H, { jag: 0.5, noShadow: true }); // its cast shadow is the one above (it would dot the case top now)
    const dx = px - pw * 0.04, dy = B.yT0 + d * 0.52, R = Math.min(d * 0.4, pw * 0.3);
    let ti = `<path d="${P(E.rect(dx - R - 4, dy - R - 3, dx + R + 4, dy + R + 3))}" fill="${c.spot}"/><path d="${P([[dx - R - 4, dy - R - 3], [dx + R + 4, dy - R - 3], [dx + R + 1, dy - R], [dx - R - 1, dy - R]])}" fill="${mix(c.spot, c.light, 0.35)}"/>`;
    ti += dial(X, dx, dy, R, rnd, true);
    ti += `<path d="${P([[B.x1 - 10, B.yT0], [B.x1, B.yT0], [B.x1, B.yT1], [B.x1 - 6, B.yT1]])}" fill="${X.e20}"/>`;
    let fi = `<path d="${P([[B.x1 - 14, B.yT1], [B.x1 + 2, B.yT1], [B.x1 + 2, B.yB + 2], [B.x1 - 20, B.yB + 2]])}" fill="${K.ink9}"/>`;
    fi += `<path d="${P([[B.x0 + 6, B.yT1 + H * 0.3], [B.x0 + pw * 0.58, B.yT1 + H * 0.3], [B.x0 + pw * 0.58, B.yT1 + H * 0.3 + 1.5], [B.x0 + 6, B.yT1 + H * 0.3 + 1.5]])}" fill="${mix(c.deep, K.ink9, 0.35)}"/>`;
    { const qw = pw * 0.22, qx = B.x0 + pw * 0.3, qh = Math.min(7, H * 0.4), qy = B.yT1 + H * 0.3 + 1.5 + (H * 0.7 - 1.5 - qh) * 0.45; // K5-G6: blank plate replaces '時'
      fi += plaque(qx - qw / 2, qy, qx + qw / 2, qy + qh, mix(c.deep, K.ink9, 0.15), K.ink7, c.light); }
    s += B.s + X.clipped(E.P(B.top), ti) + X.clipped(E.P(B.front), fi) + B.outline(2.6);
    s += E.rubble(X, B.x1 - 6, B.x1 + 6, d / 2 - 1, 3);
    return s;
  };
  const P = E.P;
  // gear lying flat: face on top, thickness strip below (3/4)
  function flatGear(X, cx, cy, r, n, fill, rot, th = 5, inkHub = false) { // K5: inkHub (opt-in) paints the axle hole ink — never a lit ring with a dot
    const pts = E.gearPath(cx, cy, r, n, 0.2, rot), side = pts.map(([x, y]) => [x, y + th]);
    let s = `<path d="${E.P(E.hull(pts.concat(side)))}" fill="${K.ink9}"/>`;
    let holes = ''; for (let k = 0; k < 4; k++) { const a = rot + k * Math.PI / 2 + 0.4; holes += `<path d="${E.crPath(E.ellPts(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.2, r * 0.14, 8), true)}"/>`; }
    s += `<path d="${E.P(pts)}" fill="${fill}" stroke="${K.ink9}" stroke-width="2" stroke-linejoin="round"/>` + `<g fill="${K.ink9}">${holes}</g>`;
    s += inkHub ? `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.22)}" fill="${K.ink9}"/>` : `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.2)}" fill="${X.c.light}" stroke="${K.ink9}" stroke-width="1.6"/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.08)}" fill="${K.ink9}"/>`;
    s += E.ribbon(E.ellPts(cx, cy, r * 0.82, r * 0.82, 20, Math.PI * 1.05, Math.PI * 1.45), 1.2, { color: K.p100, taper: 'mid', opacity: 0.8 });
    return s;
  }
  // ===== K5 (rev 3) · Ch4 clock, big tiers: '문자판 받침' (brief §2.4) =====
  // A plinth (18) over the whole footprint (no floor gap). Most of its top is a SQUARE brass plate (spot flat fill, so the brass shows as four
  // corners — never a ring) holding the dial (E.dial as is); its lower-right corner is broken open on the clockwork (ink hole, ink5 gear arcs,
  // no light circles). The pendulum case lies on the right (+8 → z 26), a snapped minute-hand fragment between plate and case, 2 / 3 flat gears
  // with ink axle holes. Front: the groove, the black wedge, and a recessed blank name plate.
  function clockBig(X, o, tier) {
    const c = X.c, rnd = X.rnd, w = o.w, d = o.d, H = 18, lg = tier === 'large';
    X.meta = { H: 26, name: '문자판 받침', front: H, tier };
    const x0 = -w / 2, x1 = w / 2, R = Math.round(0.33 * d), S2 = R + Math.round(0.18 * R), pcx = x0 + 0.4 * w, pcy = -H, br = 0.35 * R;
    const px0 = pcx - S2, px1 = pcx + S2, py0 = pcy - S2, py1 = pcy + S2, bev = mix(c.spot, c.light, 0.35);
    let ti = `<path d="${E.P(E.rect(px0, py0, px1, py1))}" fill="${c.spot}"/><path d="${E.P([[px0, py0], [px1, py0], [px1 - 3, py0 + 3], [px0 + 3, py0 + 3]])}" fill="${bev}"/><path d="${E.P([[px0, py0], [px0 + 3, py0 + 3], [px0 + 3, py1 - 3], [px0, py1]])}" fill="${bev}"/>`;
    ti += dial(X, pcx, pcy, R, rnd, true);
    const brk = E.jag([[px1 + 1, py1 - br * 1.25], [px1 - br * 0.35, py1 - br * 0.9], [px1 - br * 0.75, py1 - br * 0.98], [px1 - br * 0.58, py1 - br * 0.45], [px1 - br * 1.05, py1 - br * 0.32], [px1 - br * 1.3, py1 + 1]], rnd, 1.2, 5, false), hole = brk.concat([[px1 + 1, py1 + 1]]);
    const ga = (gx, gy, gr, n) => `<path d="${E.P(E.gearPath(gx, gy, gr, n, 0.22, rnd()))}" fill="none" stroke="${K.ink5}" stroke-width="1.5"/>`;
    ti += `<path d="${E.P(hole)}" fill="${K.ink9}"/>` + X.clipped(E.P(hole), ga(px1 - br * 0.25, py1 - br * 0.15, br * 0.62, 10) + ga(px1 - br * 0.95, py1 + br * 0.05, br * 0.4, 8));
    ti += `<path d="${E.P(brk.map(([x, y]) => [x - 0.7, y - 0.7]), false)}" fill="none" stroke="${bev}" stroke-width="1.2" stroke-linejoin="round"/>`; // K5 F1-R3: lit brass lip along the break, so it reads as a broken plate, not an ink blot
    let fi = `<path d="${E.P([[x1 - 14, d / 2 - H], [x1 + 2, d / 2 - H], [x1 + 2, d / 2 + 2], [x1 - 20, d / 2 + 2]])}" fill="${K.ink9}"/>`;
    fi += `<path d="${E.P([[x0 + 6, d / 2 - H + H * 0.3], [x0 + w * 0.58, d / 2 - H + H * 0.3], [x0 + w * 0.58, d / 2 - H + H * 0.3 + 1.5], [x0 + 6, d / 2 - H + H * 0.3 + 1.5]])}" fill="${mix(c.deep, K.ink9, 0.35)}"/>`;
    { const qw = w * 0.22, qx = x0 + w * 0.3, qh = 9, qy = d / 2 - H + H * 0.3 + 1.5 + (H * 0.7 - 1.5 - qh) * 0.45; fi += E.plaque(qx - qw / 2, qy, qx + qw / 2, qy + qh, mix(c.deep, K.ink9, 0.15), K.ink7, c.light); }
    const B = E.block(X, 0, 0, w, d, H, { jag: 0.5, topInner: ti });
    let s = B.s + X.clipped(E.P(B.front), fi) + B.outline(2.6);
    // props on the plinth top (a floor point (x, y) at z 18 is drawn at (x, y − 18)), back to front
    const it = [], GR = lg ? [[x0 + 0.1 * w, -d / 2 + 0.15 * d, 16, 12, c.base], [63, 70, 13, 10, c.spot], [-121, 62, 10, 8, mix(c.light, c.base, 0.3)]] : [[x0 + 0.1 * w, -d / 2 + 0.15 * d, 13, 10, c.base], [45, 50, 11, 9, c.spot]]; // front gear clear of the broken corner
    GR.forEach(([x, y, r, n, fill], i) => it.push([y, flatGear(X, x, y - H, r, n, fill, 0.3 + i * 0.7 + rnd() * 0.6, 4, true)]));
    // snapped minute-hand fragment (spot, ink rim, ≤ 2 thick) from the plate's right edge toward the case (seed: ±4°)
    { const a = ((lg ? 58 : 50) + (rnd() - 0.5) * 8) * Math.PI / 180, L = 0.9 * R, hw = 0.07 * R, sx = px1 - 3, sy = py0 + 0.56 * S2, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
      const Q = (t, k) => [sx + ux * L * t + nx * hw * k, sy + uy * L * t + ny * hw * k];
      const bl = [Q(0, -1), Q(0.06, -0.4), Q(0.02, 0.2), Q(0, 1), Q(0.55, 1.35), Q(0.86, 0.75), Q(1, 0), Q(0.86, -0.75), Q(0.55, -1.35)];
      it.push([sy + 4, `<path d="${E.P(bl.map(([x, y]) => [x + 0.6, y + 2]))}" fill="${K.ink9}"/><path d="${E.P(bl)}" fill="${c.spot}" stroke="${K.ink9}" stroke-width="1.6" stroke-linejoin="miter"/><path d="${E.P([Q(0.08, -0.35), Q(0.8, -0.3)], false)}" stroke="${bev}" stroke-width="1"/>`]); }
    // pendulum case lying on the plinth (+8): window 0.5 × 0.7 of the case, angular brass bob (never a round one)
    { const cx0 = lg ? 78 : 56, cx1 = lg ? 134 : 94, cd = (lg ? 79.8 : 54.6) * 2, cw = cx1 - cx0, C = E.block(X, (cx0 + cx1) / 2, -H, cw, cd, 8, { jag: 0.3 });
      const wx0 = C.x0 + cw * 0.25, wx1 = C.x1 - cw * 0.25, wy0 = C.yT0 + cd * 0.15, wy1 = C.yT1 - cd * 0.15, mx = (wx0 + wx1) / 2, k = cw / 38;
      let ci = `<path d="${E.P([[C.x0 + 1.5, C.yT0 + 1.5], [C.x1 - 1.5, C.yT0 + 1.5], [C.x1 - 1.5, C.yT1 - 1.5], [C.x0 + 1.5, C.yT1 - 1.5]])}" fill="none" stroke="${mix(c.deep, K.ink9, 0.35)}" stroke-width="1"/>`;
      ci += `<path d="${E.P(E.rect(wx0, wy0, wx1, wy1))}" fill="${K.ink7}"/><path d="M ${f(mx)},${f(wy0 + 1)} L ${f(mx + 1.2)},${f(wy1 - 9 * k)}" stroke="${c.light}" stroke-width="1.2"/>`;
      ci += `<path d="${E.P([[mx - 3.8 * k, wy1 - 11 * k], [mx + 5 * k, wy1 - 10 * k], [mx + 4 * k, wy1 - 3 * k], [mx - 4 * k, wy1 - 3.6 * k]])}" fill="${c.spot}" stroke="${K.ink9}" stroke-width="1.2"/>`;
      ci += `<path d="${E.P([[wx0, wy0], [wx0 + 4 * k, wy0], [wx0, wy0 + 12 * k]])}" fill="${K.ink3}"/>` + E.crackWedge(wx1 - 2, wy0, (wy1 - wy0) * 0.45, 2.2, rnd, -1);
      it.push([cd / 2, C.s + X.clipped(E.P(C.top), ci) + X.clipped(E.P(C.front), `<path d="${E.P([[C.x1 - 6, C.yT1], [C.x1 + 2, C.yT1], [C.x1 + 2, C.yB], [C.x1 - 8, C.yB]])}" fill="${K.ink9}"/>`) + C.outline(2.4)]); }
    it.sort((p, q) => p[0] - q[0]).forEach((p) => { s += p[1]; });
    return s + E.rubble(X, x1 - 6, x1 + 6, d / 2 - 1, 3);
  }
  // 톱니 잔해 더미 — gears heaped, one on edge, spring coil; brass on the top gear face
  L.gears = function (X, o) {
    const c = X.c, rnd = X.rnd, sc = (o.w || 96) / 96;
    X.meta = { H: Math.round(26 * sc), name: '톱니 잔해 더미' };
    let s = `<g transform="scale(${f(sc)})">` + X.shadow(E.ellPts(2, 8, 44, 18, 16), 16, 8);
    s += flatGear(X, -18, 4, 22, 12, c.base, 0.2, 6);
    // standing gear on edge (behind right), black spoked face
    const gx = 22, gy = -2, gr = 14;
    s += `<path d="${E.P(E.gearPath(gx + 4, gy, gr, 11, 0.2, 0.1))}" fill="${K.ink9}"/><path d="${E.P(E.gearPath(gx, gy, gr, 11, 0.2, 0.1))}" fill="${c.deep}" stroke="${K.ink9}" stroke-width="2.2" stroke-linejoin="round"/>`;
    s += `<circle cx="${gx}" cy="${gy}" r="${gr * 0.62}" fill="${K.ink9}"/>`;
    for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; s += `<path d="M ${f(gx)},${f(gy)} L ${f(gx + Math.cos(a) * gr * 0.64)},${f(gy + Math.sin(a) * gr * 0.64)}" stroke="${c.deep}" stroke-width="3.4"/>`; }
    s += `<circle cx="${gx}" cy="${gy}" r="4" fill="${c.light}" stroke="${K.ink9}" stroke-width="1.6"/>`;
    s += flatGear(X, 10, 14, 17, 10, c.spot, 0.6, 5) + flatGear(X, -30, 18, 10, 8, c.light, 0.1, 4);
    // spring coil + screws
    let sp = ''; for (let k = 0; k < 6; k++) sp += `<ellipse cx="${f(34 + k * 3.2)}" cy="${f(20 - k * 0.6)}" rx="2" ry="4.6" fill="none" stroke="${K.ink9}" stroke-width="1.5"/>`;
    s += sp + `<path d="M -40,26 l 7,-2 M 30,28 l 6,1" stroke="${K.ink9}" stroke-width="2.6" stroke-linecap="round"/>`;
    for (let k = 0; k < 10; k++) s += `<circle cx="${f(-30 + rnd() * 60)}" cy="${f(-4 + rnd() * 24)}" r="${f(0.8 + rnd())}" fill="${mix(c.deep, K.ink9, 0.3)}"/>`;
    return s + '</g>';
  };
  // 부러진 분침 — giant minute hand driven into the ground at a LOW angle (tip rise 26 px), pointing west-north-west.
  // Its dotted ground shadow separates the blade from the floor. Ground point (pivot) = (0, 8).
  L.hand = function (X, o) {
    const c = X.c, rnd = X.rnd, len = o.len || 86, rise = Math.min(o.H || 26, 28), ga = Math.PI + 0.3;
    X.meta = { H: rise, name: '부러진 분침' };
    const ce = Math.sqrt(Math.max(0, 1 - (rise / len) ** 2)), bx = 0, by = 8;
    const ux = Math.cos(ga) * ce, uy = Math.sin(ga) * ce - rise / len;           // screen direction per unit length
    const nx = -uy / Math.hypot(ux, uy), ny = ux / Math.hypot(ux, uy);
    const Pt = (t, w) => [bx + ux * len * t + nx * w, by + uy * len * t + ny * w];
    const blade = [Pt(0, -4.2), Pt(0.5, -5.2), Pt(0.56, -10), Pt(0.64, -11.5), Pt(0.72, -5.8), Pt(0.86, -4.2), Pt(1.0, 0), Pt(0.86, 4.2), Pt(0.72, 5.8), Pt(0.64, 11.5), Pt(0.56, 10), Pt(0.5, 5.2), Pt(0, 4.2)];
    // ground shadow: from the pivot to the tip's ground point pushed lower-right by the rise
    const tipG = [bx + Math.cos(ga) * ce * len + rise * 0.62, by + Math.sin(ga) * ce * len + rise * 0.3];
    let s = `<path d="${E.P([[bx, by - 3.5], [bx, by + 3.5], [tipG[0] + 2, tipG[1] + 2], [tipG[0] - 1, tipG[1] - 2]])}" fill="url(#${X.p}d40)"/>`;
    for (let k = 0; k < 5; k++) { const aa = k * 1.26 + 0.3; s += X.line([[bx, by + 1], [bx + Math.cos(aa) * 10, by + 1 + Math.sin(aa) * 5], [bx + Math.cos(aa + 0.2) * 20, by + 1 + Math.sin(aa + 0.2) * 9]], 1.5, { color: mix(c.deep, K.ink9, 0.25) }); }
    s += `<ellipse cx="${bx}" cy="${by + 1}" rx="7" ry="3" fill="${K.ink9}"/>`;
    const bl = E.P(blade);
    s += `<path d="${bl}" fill="${c.spot}"/>` + X.clipped(bl, `<path d="${E.P([Pt(0, 0), Pt(1.1, 0), Pt(1.1, 12), Pt(0, 12)])}" fill="${K.ink9}"/><path d="${E.P([Pt(0.05, -1.4), Pt(0.9, -1.4)], false)}" stroke="${mix(c.spot, K.p100, 0.5)}" stroke-width="1.2"/>`);
    s += X.out(blade, 2.4, { gaps: 1 });
    const cw = Pt(0.3, 0), sp = Pt(0.6, 0); s += `<circle cx="${f(cw[0])}" cy="${f(cw[1])}" r="7" fill="${K.ink9}"/><circle cx="${f(cw[0])}" cy="${f(cw[1])}" r="3" fill="${c.light}"/><circle cx="${f(sp[0])}" cy="${f(sp[1])}" r="3.6" fill="${K.ink9}"/><circle cx="${f(sp[0] - 1)}" cy="${f(sp[1] - 1)}" r="1.2" fill="${c.light}"/>`;
    s += `<path d="${E.P([[bx + 12, by + 4], [bx + 26, by + 1], [bx + 28, by + 6], [bx + 14, by + 9]])}" fill="${c.spot}" stroke="${K.ink9}" stroke-width="1.8" stroke-linejoin="miter"/><path d="M ${bx + 14},${by + 9} L ${bx + 28},${by + 6} L ${bx + 28},${by + 8.5} L ${bx + 14},${by + 11.5} Z" fill="${K.ink9}"/>`;
    return s;
  };
  // 문자판 묘비 (pillar) — small round-topped headstone with an engraved dial, on a base
  L.tomb = function (X, o) {
    const c = X.c, rnd = X.rnd, w = o.w || 40, H = Math.min(o.H || 19, 22);
    X.meta = { H: H + 8, name: '문자판 묘비' };
    const P = E.block(X, 0, 0, w, w * 0.62, 6, {});
    let s = P.s + P.outline();
    const x0 = -w * 0.34, x1 = w * 0.34, yb = P.yT0 + w * 0.36, yt = yb - H, th = 5;
    const face = [[x0, yb], [x0, yt + 10]].concat(E.ellPts(0, yt + 10, x1, 12, 10, Math.PI, Math.PI * 2)).concat([[x1, yt + 10], [x1, yb]]);
    s += `<path d="${E.P(face.map(([x, y]) => [x + th, y - th * 0.7]))}" fill="${K.ink9}"/>`;
    s += X.face(face, c.base, `<rect x="${x0 - 2}" y="${yt - 4}" width="${x1 - x0 + 4}" height="${H + 6}" fill="${X.d20}"/><path d="M ${f(x1 - 6)},${yt} L ${x1 + 2},${yt} L ${x1 + 2},${yb} L ${f(x1 - 9)},${yb} Z" fill="${X.d40}"/>`, 1) + X.out(face, 2.4, { r: 1 });
    s += E.engrave(`M ${-6.5},${f(yt + 10)} a 6.5,6.5 0 1 0 13,0 a 6.5,6.5 0 1 0 -13,0 M 0,${f(yt + 10)} l 0,-4.4 M 0,${f(yt + 10)} l 3.4,1.8`, { base: c.base, light: c.light, deep: K.ink7 }, 1.4);
    return s;
  };
})(window.PN);
// ---- Ch5 일식 관문 props: stele(쓰러진 흑요 비석) · ring(바닥에 누운 일식 고리) · void(오려진 공백 — 윗부분이 찢겨 나간 낮은 문틀) · pillar(관문 석주 밑동) ----
// Obsidian is the one dark obstacle material (§11 Ch5). Obstacles have NO eyes: no round highlights on dark props, only angular facet glints.
// Every kind is squat: vertical front face ≤ 0.45 × hero (28.8 px). X.meta.H = measured front-face height.
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix, L = E.props[5];
  L._alias = { solid: 'stele' };
  const P = E.P;
  // K5 (rev 3) erased inscription: a recessed blank plate on a slab plane mapped by q(u, v) (u along the length, v toward the back = up).
  // Fill mix(ob, ink3, .62); inner shade ink7 1.5 on the top + left; lip mix(ob, ink3, .75) 0.8 on the bottom + right. No strokes inside.
  // K5 F1: optional `cut` (fraction of the plate width) chamfers the back-right corner at 45° on screen — a broken tablet, not a window.
  // cut = 0 (default, base stele) keeps the plain four-corner plate byte-identical.
  E.erasedPlate = function (q, u0, v0, u1, v1, ob, cut = 0) {
    if (!cut) {
      const pl = [q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1)], sh = E.shrink(pl, 0.9), lp = E.shrink(pl, 0.55);
      return `<path d="${P(pl)}" fill="${mix(ob, K.ink3, 0.62)}"/>` +
        `<path d="${P([sh[0], sh[3], sh[2]], false)}" fill="none" stroke="${K.ink7}" stroke-width="1.5"/>` +
        `<path d="${P([lp[0], lp[1], lp[2]], false)}" fill="none" stroke="${mix(ob, K.ink3, 0.75)}" stroke-width="0.8"/>`;
    }
    const a = q(u0, v0), b = q(u1, v0), cc = q(u1, v1), dd = q(u0, v1), W = Math.hypot(b[0] - a[0], b[1] - a[1]), cl = cut * W;
    const tw = (p) => { const L = Math.hypot(p[0] - cc[0], p[1] - cc[1]) || 1; return [cc[0] + (p[0] - cc[0]) * cl / L, cc[1] + (p[1] - cc[1]) * cl / L]; }; // point on the corner's edge toward p, cl from the corner
    const pl = [a, b, tw(b), tw(dd), dd], sh = E.shrink(pl, 0.9), lp = E.shrink(pl, 0.55);
    return `<path d="${P(pl)}" fill="${mix(ob, K.ink3, 0.62)}"/>` +
      `<path d="${P([sh[0], sh[4], sh[3], sh[2]], false)}" fill="none" stroke="${K.ink7}" stroke-width="1.5"/>` +
      `<path d="${P([lp[0], lp[1], lp[2]], false)}" fill="none" stroke="${mix(ob, K.ink3, 0.75)}" stroke-width="0.8"/>`;
  };
  // 쓰러진 흑요 비석 — slab lying at a slant: left end sunk into the floor, right end propped on a rock (front face 20 px).
  // Moonlit top plane (the read), one angular facet glint along the upper-left bevel, black underside wedge (Mignola).
  L.stele = function (X, o) {
    const c = X.c, rnd = X.rnd, w = o.w || 76, d = o.d || 28, ob = c.spot, tier = E.tier(w, d);
    if (tier !== 'base') return steleBig(X, { w, d }, tier); // K5: mid / large = '갈라진 흑요 석판'
    const hR = Math.min(o.H || 18, 26), hL = 3, t = Math.min(9, hR * 0.45);
    const x0 = -w / 2, x1 = w / 2, yG = d / 2, yK = -d / 2;
    X.meta = { H: hR, name: '쓰러진 흑요 비석', front: hR, tier };
    const FL = [x0, yG - hL], FR = [x1 - 3, yG - hR], BR = [x1 - 9, yK - hR - 1], BL = [x0 + 7, yK - hL];
    const U = [FR[0], FR[1] + t], contact = [x0 + w * 0.46, yG];
    let s = X.shadow([[x0 + w * 0.3, yK], [x1, yK - 4], [x1, yG], [x0 + w * 0.3, yG]], hR * 0.7 + 4, hR * 0.3 + 3);
    // black underside gap below the raised end + prop rock
    s += `<path d="${P([U, [x1 - 1, yG], contact])}" fill="${K.ink9}"/>`;
    const rk = [[x1 - 18, yG + 1], [x1 - 16, yG - 6], [x1 - 9, yG - 8], [x1 - 4, yG - 3], [x1 - 5, yG + 1.5]];
    s += X.face(rk, c.light, `<path d="${P([[x1 - 10, yG - 8], [x1 - 3, yG - 3], [x1 - 5, yG + 2], [x1 - 11, yG + 2]])}" fill="${K.ink9}"/>`, 0) + X.out(rk, 1.8, { gaps: 0 });
    // front (thickness) face: obsidian, lit bevel strip on top, black right half
    const front = [FL, FR, U, contact, [x0, yG]];
    s += X.face(front, ob, `<path d="${P([[x0 + w * 0.52, FR[1] - 4], [x1 + 2, FR[1] - 4], [x1 + 2, yG + 2], [x0 + w * 0.36, yG + 2]])}" fill="${K.ink9}"/>` +
      `<path d="${P([FL, FR, [FR[0], FR[1] + 2.2], [FL[0], FL[1] + 1.6]])}" fill="${mix(ob, K.ink3, 0.35)}"/>`, 0);
    // top plane: moonlit obsidian + angular conchoidal facets (flat tones, crisp edges)
    const lerp0 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    const chipA = lerp0(BL, BR, 0.52), chipB = lerp0(BL, BR, 0.7), chipM = [(chipA[0] + chipB[0]) / 2 + 1, (chipA[1] + chipB[1]) / 2 + 5];
    const top = [FL, FR, BR, chipB, chipM, chipA, BL], tp = mix(ob, K.ink3, 0.5);
    const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    const q = (u, v) => lerp(lerp(FL, FR, u), lerp(BL, BR, u), v); // (u along length, v toward the back)
    let ti = `<path d="${P([q(0.55, 0), q(1, 0), q(1, 0.62), q(0.78, 0.4)])}" fill="${mix(ob, K.ink3, 0.28)}"/>`;
    ti += `<path d="${P([q(0.1, 0), q(0.38, 0), q(0.3, 0.34), q(0.12, 0.26)])}" fill="${mix(ob, K.ink3, 0.38)}"/>`;
    ti += `<path d="${P([q(0.62, 0.55), q(0.86, 0.72), q(0.9, 1), q(0.6, 1)])}" fill="${mix(ob, K.ink3, 0.62)}"/>`;
    // K5-G7: erased inscription — one recessed BLANK plate (filled, ≤ 12 % of the top), no carved strokes (they read as letters)
    ti += E.erasedPlate(q, 0.22, 0.32, 0.5, 0.74, ob);
    // the ONE moonlit glint: tapered wedge along the upper-left bevel (back edge, left → right), paper core
    ti += `<path d="${P([q(0.03, 0.98), q(0.7, 0.99), q(0.34, 0.86), q(0.06, 0.84)])}" fill="${K.ink3}"/>` + `<path d="${P([q(0.05, 0.97), q(0.4, 0.985), q(0.12, 0.9)])}" fill="${K.p300}"/>`;
    s += X.face(top, tp, ti, 0);
    s += X.rim(FL[0] + 1, FL[1], FR[0] - 1, FR[1], 2.2);
    // sunk left end: heaved floor chips + fracture in the ground
    s += X.line([[x0 - 8, yG - 5], [x0 - 2, yG - 1], [x0 + 6, yG + 3], [x0 + 18, yG + 4]], 1.5, { color: mix(c.deep, K.ink9, 0.3) });
    s += `<path d="${P([chipM, chipB, [chipB[0] - 2, chipB[1] + 2.5], [chipM[0], chipM[1] + 2]])}" fill="${K.ink9}"/>`;
    s += X.out([BL, chipA, chipM, chipB, BR, FR, U, [x1 - 1, yG], [x0, yG], FL], 2.6, { gaps: 1 });
    [[x0 - 4, yG - 4, 9, 5, -0.3], [x0 + 5, yG + 1, 8, 4, 0.2]].forEach(([x, y, a, b, r]) => { const pts = [[x - a / 2, y + b / 2], [x - a * 0.3, y - b / 2], [x + a / 2, y - b * 0.3], [x + a * 0.4, y + b / 2]].map(([u, v]) => [x + (u - x) * Math.cos(r) - (v - y) * Math.sin(r), y + (u - x) * Math.sin(r) + (v - y) * Math.cos(r)]); s += X.face(pts, c.light, `<path d="${P([pts[2], pts[3], [pts[3][0] - 3, pts[3][1]]])}" fill="${K.ink9}"/>`, 0) + `<path d="${P(pts)}" fill="none" stroke="${K.ink9}" stroke-width="1.5" stroke-linejoin="miter"/>`; });
    return s;
  };
  // ===== K5 (rev 3) · Ch5 stele, big tiers: '갈라진 흑요 석판' (brief §2.5) =====
  // The toppled slab (sunk end raised to 8, raised end 18, corners within ±3 of the footprint) split into 2 / 3 pieces by LEANING,
  // non-parallel splits that bend once (K5 F1 — straight back-to-front splits read as cabinet doors). The splits show the blank paper
  // (void.paper) underneath — one wall shaded with ink wedges, the other a single line. Each piece tilts 1–2 differently. Tops: conchoidal
  // facets fanning out from a fracture origin on the split (tones .28/.38/.62/.75 over .55, never tall slivers), ONE moon glint, a WIDE
  // erased plate with a chamfered corner on the widest piece, chips only near the split ends. Front: tone .35, black wedge on the right 20 %.
  function steleBig(X, o, tier) {
    const c = X.c, rnd = X.rnd, w = o.w, d = o.d, ob = c.spot, lg = tier === 'large', hR = 18, hL = 8, t = Math.min(9, hR * 0.45), tn = (k) => mix(ob, K.ink3, k);
    const x0 = -w / 2, x1 = w / 2, yG = d / 2, yK = -d / 2;
    const FL = [x0, yG - hL], FR = [x1 - 3, yG - hR], BR = [x1 - 3, yK - hR - 1], BL = [x0 + 2, yK - hL], U = [FR[0], FR[1] + t], contact = [x0 + w * 0.46, yG];
    const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], q = (u, v) => lerp(lerp(FL, FR, u), lerp(BL, BR, u), v);
    const yb = (x) => (x <= contact[0] ? yG : yG + (U[1] - yG) * (x - contact[0]) / (U[0] - contact[0]));
    // F1 (a): split = [u at the back (v 1), u at the front (v 0), kink side, bend from v, kink]. Large: .30 → .43 and .73 → .59 (opposite
    // leans), mid: .38 → .57. ONE bend at v .40–.60, pushed .12–.18u off the chord so neither half runs straight (each half |Δu/Δv| ≥ .118);
    // 6–9 jagged nodes (±.012u), whole split shifted ±.04 by seed. Nodes are [u, v, half-gap]; gap 6–9 → 3–6 of paper between the outlines.
    // half slopes over the seed ranges: large A ≥ .120 / .313, B ≥ .131 / .357, mid ≥ .118 / .476 (lower / upper half)
    const SPEC = lg ? [[0.30, 0.43, -1, 0.52, 0.12], [0.73, 0.59, -1, 0.40, 0.13]] : [[0.38, 0.57, 1, 0.44, 0.16]]; // both large splits bend the same way: no symmetric 'vase'
    const cracks = SPEC.map(([uB, uF, side, vb0, kk]) => {
      const sh = (rnd() - 0.5) * 0.08, vb = vb0 + rnd() * 0.08, ub = uF + (uB - uF) * vb + side * (kk + rnd() * 0.02), n = 6 + Math.floor(rnd() * 4);
      const cu = (v) => sh + (v >= vb ? ub + (uB - ub) * (v - vb) / (1 - vb) : uF + (ub - uF) * v / vb);
      const vs = []; for (let k = 0; k <= n; k++) vs.push(1 - k / n);
      if (!vs.some((v) => Math.abs(v - vb) < 0.03)) vs.push(vb);
      vs.sort((a, b) => b - a);
      return vs.map((v, k) => [cu(v) + (k && k < vs.length - 1 && Math.abs(v - vb) > 0.01 ? (rnd() - 0.5) * 0.024 : 0), v, (3 + Math.sin(Math.PI * v) + rnd() * 0.5) / w]);
    });
    const along = (C, v, j) => { for (let k = 0; k < C.length - 1; k++) { const a = C[k], b = C[k + 1]; if (v <= a[1] && v >= b[1]) return a[j] + (b[j] - a[j]) * (a[1] - v) / ((a[1] - b[1]) || 1); } return C[C.length - 1][j]; }; // centre u (j 0) / half-gap (j 2) at v
    const DZ = lg ? [0, 1.6, 0.8] : [0, 1.5], Qd = (i) => (u, v) => { const p = q(u, v); return [p[0], p[1] - DZ[i] * v]; }; // a piece tilts by lifting its back edge
    X.meta = { H: Math.round(hR + 1 + Math.max(...DZ)), name: '갈라진 흑요 석판', front: hR, tier };
    let s = X.shadow([[x0 + w * 0.3, yK], [x1, yK - 4], [x1, yG], [x0 + w * 0.3, yG]], hR * 0.7 + 4, hR * 0.3 + 3);
    s += `<path d="${E.P([U, [x1 - 1, yG], contact])}" fill="${K.ink9}"/>`; // black underside gap below the raised end (black spot)
    const rk = [[x1 - 18, yG + 1], [x1 - 16, yG - 6], [x1 - 9, yG - 8], [x1 - 4, yG - 3], [x1 - 5, yG + 1.5]];
    s += X.face(rk, c.light, `<path d="${E.P([[x1 - 10, yG - 8], [x1 - 3, yG - 3], [x1 - 5, yG + 2], [x1 - 11, yG + 2]])}" fill="${K.ink9}"/>`, 0) + X.out(rk, 1.8, { gaps: 0 });
    // paper void through each split (top + down the front face); the pieces cover everything but the gap
    cracks.forEach((C, i) => {
      const L = C.map(([u, v, h]) => Qd(i)(u - h, v)), R = C.map(([u, v, h]) => Qd(i + 1)(u + h, v)), fl = L[L.length - 1], fr = R[R.length - 1];
      s += `<path d="${E.P(L.concat([[fl[0], yb(fl[0]) + 0.5], [fr[0], yb(fr[0]) + 0.5]], R.slice().reverse()))}" fill="${K.voidp}"/>`;
    });
    // pieces
    const nP = cracks.length + 1, P = [];
    for (let i = 0; i < nP; i++) {
      const Lc = i ? cracks[i - 1] : null, Rc = i < nP - 1 ? cracks[i] : null, g = Qd(i);
      const uv = (Lc ? Lc.slice().reverse().map(([u, v, h]) => [u + h, v]) : [[0, 0], [0, 1]]).concat(Rc ? Rc.map(([u, v, h]) => [u - h, v]) : [[1, 1], [1, 0]]);
      const top = uv.map(([u, v]) => g(u, v)), A = top[0], B = top[top.length - 1], mid = A[0] < contact[0] && B[0] > contact[0] ? [contact] : [];
      P.push({ i, g, top, front: [A, B, [B[0], yb(B[0])]].concat(mid, [[A[0], yb(A[0])]]), sil: [[A[0], yb(A[0])]].concat(top, [[B[0], yb(B[0])]], mid), crackL: Lc, crackR: Rc,
        lo: (v) => (Lc ? along(Lc, v, 0) + along(Lc, v, 2) : 0), hi: (v) => (Rc ? along(Rc, v, 0) - along(Rc, v, 2) : 1) });
    }
    const PV = [0.42, 0.53, 0.64], narrow = (p) => Math.min(...PV.map((v) => p.hi(v) - p.lo(v))); // splits lean, so judge a piece by its narrowest row
    const big = P.reduce((a, b) => (narrow(b) > narrow(a) ? b : a));
    P.forEach((p) => {
      const g = p.g;
      s += X.face(p.front, tn(0.35), `<path d="${E.P([[x1 - w * 0.2, FR[1] - 8], [x1 + 2, FR[1] - 8], [x1 + 2, yG + 2], [x1 - w * 0.26, yG + 2]])}" fill="${K.ink9}"/><path d="${E.P([p.front[0], p.front[1], [p.front[1][0], p.front[1][1] + 2.2], [p.front[0][0], p.front[0][1] + 1.6]])}" fill="${tn(0.5)}"/>`, 0);
      let ti = '';
      // F1 (b): 3–5 conchoidal facets fanning out from a fracture origin O on this piece's split edge (v .38–.58). Each facet points its
      // tip at O and bows its far side away from O; screen w:h is clamped to .7–1.8 (no tall slivers); direction, size, aspect and tone
      // all change from one facet to the next. (F1 (c): the small concentric arcs are gone — they read as '(((' .)
      const C0 = p.crackR || p.crackL, sgn = p.crackR ? -1 : 1, vo = 0.38 + rnd() * 0.2, O = g(along(C0, vo, 0) + sgn * along(C0, vo, 2), vo);
      const Wp = (p.hi(vo) - p.lo(vo)) * w, th0 = p.crackR ? Math.PI : 0, AS = [0.85, 1.2, 0.7, 1.35, 1.0];
      for (let k = 0, n = 3 + Math.floor(rnd() * 3); k < n; k++) {
        const th = th0 + (-1.3 + 2.6 * (k + 0.5) / n) + (rnd() - 0.5) * 0.25, ux = Math.cos(th), uy = Math.sin(th), nx = -uy, ny = ux;
        const dk = (0.3 + 0.4 * ((k * 0.618 + 0.3) % 1)) * Math.min(Wp, d) * 0.9, C = [O[0] + ux * dk, O[1] + uy * dk];
        const tw = Wp * (0.28 + 0.17 * ((k * 0.618 + 0.2) % 1)), thh = d * (0.1 + 0.08 * ((k * 0.382 + 0.5) % 1)); // target box: (.28–.45)·piece width × (.10–.18)·depth
        let F = [[-0.55, 0], [0.1, 0.5 * AS[k]], [0.95, 0], [0.1, -0.5 * AS[k]]].map(([r, tt]) => [C[0] + ux * r + nx * tt, C[1] + uy * r + ny * tt]); // unit scallop: tip, side, bulge control, side
        const bx = [F[0][0], F[1][0], F[3][0], 0.25 * F[1][0] + 0.5 * F[2][0] + 0.25 * F[3][0]], by = [F[0][1], F[1][1], F[3][1], 0.25 * F[1][1] + 0.5 * F[2][1] + 0.25 * F[3][1]];
        let sx = tw / (Math.max(...bx) - Math.min(...bx) || 1), sy = thh / (Math.max(...by) - Math.min(...by) || 1);
        const rt = tw / thh; if (rt > 1.8) sx *= 1.8 / rt; else if (rt < 0.7) sy *= rt / 0.7; // screen w:h .7–1.8
        F = F.map(([x, y]) => [C[0] + (x - C[0]) * sx, C[1] + (y - C[1]) * sy]);
        ti += `<path d="M ${f(F[0][0])},${f(F[0][1])} L ${f(F[1][0])},${f(F[1][1])} Q ${f(F[2][0])},${f(F[2][1])} ${f(F[3][0])},${f(F[3][1])} Z" fill="${tn([0.28, 0.38, 0.62, 0.75][(k + p.i) % 4])}"/>`;
      }
      if (p.i === 0) { const ue = Math.min(0.62, Math.min(p.hi(0.84), p.hi(0.99)) - 0.05); ti += `<path d="${E.P([g(0.03, 0.98), g(ue, 0.99), g(ue * 0.49, 0.86), g(0.06, 0.84)])}" fill="${K.ink3}"/><path d="${E.P([g(0.05, 0.97), g(ue * 0.57, 0.985), g(ue * 0.17, 0.9)])}" fill="${K.p300}"/>`; } // the ONE moon glint
      if (p === big) { // F1 (d): a WIDE erased plate — 60 % of the piece's narrowest width in v .42–.64 (≥ 4 off the splits), screen w:h ≈ 1.8, one corner chamfered 12 %
        const L0 = Math.max(p.lo(0.42), p.lo(0.64)), H0 = Math.min(p.hi(0.42), p.hi(0.64)), Wa = H0 - L0, u0 = L0 + 0.2 * Wa, u1 = H0 - 0.2 * Wa;
        const dv = Math.max(0.16, Math.min(0.26, (u1 - u0) * w / 1.8 / d)), v0 = 0.53 - dv / 2;
        ti += E.erasedPlate(g, u0, v0, u1, v0 + dv, ob, 0.12);
      }
      s += X.face(p.top, tn(0.55), ti, 0) + X.rim(p.front[0][0] + 1, p.front[0][1], p.front[1][0] - 1, p.front[1][1], 2.2);
      if (p.crackR) { const C = p.crackR; [0.22, 0.5, 0.78].forEach((t2) => { const k = Math.min(C.length - 2, Math.floor(t2 * (C.length - 1))), a = g(C[k][0] - C[k][2], C[k][1]), b = g(C[k + 1][0] - C[k + 1][2], C[k + 1][1]); s += `<path d="${E.P([a, b, [(a[0] + b[0]) / 2 + 2.6, (a[1] + b[1]) / 2 + 1]])}" fill="${K.ink9}"/>`; }); } // shade wedges on the split's dark wall
      s += X.out(p.sil, 2.6, { gaps: 1 });
    });
    // F1 (e): obsidian chips (≤ 6 tall) only near a split's front end (v .07–.25) or back end (v .77–.91), each split's chips on ONE side
    // (never a facing pair), none in the middle band v .3–.7. Mid: both right of the split; large: split A's left (front), split B's right.
    const CH = lg ? [[0, -1, 0], [1, 1, 1], [1, 1, 0]].concat(rnd() < 0.5 ? [[0, -1, 2]] : []) : [[0, 1, 0], [0, 1, 1]];
    CH.forEach(([ci, sd, e]) => {
      const C = cracks[ci], v = e === 1 ? 0.77 + rnd() * 0.14 : e === 0 ? 0.07 + rnd() * 0.1 : 0.19 + rnd() * 0.05, u = along(C, v, 0) + sd * (along(C, v, 2) + 0.03 + rnd() * 0.03 + (e === 2 ? 0.05 : 0)), cc = P[sd < 0 ? ci : ci + 1].g(u, v), z0 = 4 + rnd() * 2.4;
      const pts = [[-z0, 0.3 * z0], [-0.3 * z0, -0.75 * z0], [0.7 * z0, -0.55 * z0], [z0, 0.35 * z0], [0.1 * z0, 0.65 * z0]].map(([a, b]) => [cc[0] + a, cc[1] + b]);
      s += `<path d="${E.P(pts.map(([a, b]) => [a + 0.4, b + 2]))}" fill="${K.ink9}"/><path d="${E.P(pts)}" fill="${tn(0.62)}" stroke="${K.ink9}" stroke-width="1.2" stroke-linejoin="miter"/><path d="${E.P([pts[0], pts[1], [(pts[0][0] + pts[2][0]) / 2, (pts[0][1] + pts[2][1]) / 2]])}" fill="${tn(0.78)}"/>`;
    });
    // sunk left end: a fracture in the floor + two heaved floor chips
    s += X.line([[x0 + 2, yG - 2], [x0 + 8, yG + 2], [x0 + 20, yG + 3.5]], 1.5, { color: mix(c.deep, K.ink9, 0.3) });
    [[x0 + 1, yG - 3, 8, 4.4, -0.3], [x0 + 9, yG + 1.5, 7, 3.6, 0.2]].forEach(([x, y, a, b, r]) => { const pts = [[x - a / 2, y + b / 2], [x - a * 0.3, y - b / 2], [x + a / 2, y - b * 0.3], [x + a * 0.4, y + b / 2]].map(([u, v]) => [x + (u - x) * Math.cos(r) - (v - y) * Math.sin(r), y + (u - x) * Math.sin(r) + (v - y) * Math.cos(r)]); s += X.face(pts, c.light, `<path d="${E.P([pts[2], pts[3], [pts[3][0] - 3, pts[3][1]]])}" fill="${K.ink9}"/>`, 0) + `<path d="${E.P(pts)}" fill="none" stroke="${K.ink9}" stroke-width="1.5" stroke-linejoin="miter"/>`; });
    return s;
  }
  // 일식 고리 — stone ring lying flat, half-sunk on the front-right. Hole shows the floor; the far inner wall is a black crescent (= the eclipse).
  // Footprint: circle R = w/2 (default 84 → R42). Thickness above the floor H = 11.
  L.ring = function (X, o) {
    const c = X.c, rnd = X.rnd, R = (o.w || 76) / 2, r = R * 0.6, H = Math.min(o.H || 11, 16), KY = 0.6; // lying flat → ellipse
    X.meta = { H, name: '일식 고리' };
    const circ = (cx, cy, rr, a0 = 0, a1 = Math.PI * 2, n = 64) => E.ellPts(cx, cy, rr, rr * KY, n, a0, a1);
    const cd = (cx, cy, rr) => `M ${f(cx - rr)},${f(cy)} a ${f(rr)},${f(rr * KY)} 0 1 0 ${f(2 * rr)},0 a ${f(rr)},${f(rr * KY)} 0 1 0 ${f(-2 * rr)},0 Z`;
    let s = `<path d="${P(E.castPts(circ(0, 0, R, 0, Math.PI * 2, 32), H * 0.7 + 4, H * 0.35 + 3))}" fill="url(#${X.p}d40)"/>`;
    // outer wall (front half): bottom semicircle of the top rim → bottom semicircle at the floor
    const wallPts = circ(0, -H, R, 0, Math.PI + 1e-6, 33).reverse().concat(circ(0, 0, R, 0, Math.PI + 1e-6, 33));
    s += X.face(wallPts, c.base, `<rect x="${-R - 2}" y="${-H - R}" width="${2 * R + 4}" height="${2 * R + H}" fill="${X.d20}"/><path d="${P([[R * 0.18, -H], [R + 2, -H], [R + 2, R + 2], [R * 0.1, R + 2]])}" fill="${K.ink9}"/>` + [0.35 + 2 * Math.PI / 9, 0.35 + 4 * Math.PI / 9, 0.35 + 3 * Math.PI / 9].map((a) => `<path d="M ${f(Math.cos(a) * R)},${f(-H + Math.sin(a) * R)} L ${f(Math.cos(a) * R)},${f(Math.sin(a) * R)}" stroke="${K.ink9}" stroke-width="1.5"/>`).join(''), 0);
    // top annulus: light stone + obsidian inlay band with 12 carved hour notches; one moonlit arc on the upper-left
    const ann = cd(0, -H, R) + ' ' + cd(0, -H, r);
    const m0 = r + (R - r) * 0.36, m1 = r + (R - r) * 0.64;
    let ti = `<path d="${cd(0, -H, m1)} ${cd(0, -H, m0)}" fill="${c.spot}" fill-rule="evenodd"/>`;
    let nt = ''; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, k0 = m0 + 1.2, k1 = i % 3 ? m1 - 3 : m1 - 0.8; nt += `M ${f(Math.cos(a) * k0)},${f(-H + Math.sin(a) * (k0) * KY)} L ${f(Math.cos(a) * k1)},${f(-H + Math.sin(a) * (k1) * KY)} `; }
    ti += `<path d="${nt}" stroke="${K.ink3}" stroke-width="1.5"/>`;
    let vj = ''; for (let i = 0; i < 9; i++) { const a = 0.35 + i * Math.PI * 2 / 9; vj += `M ${f(Math.cos(a) * (r + 0.5))},${f(-H + Math.sin(a) * (r + 0.5) * KY)} L ${f(Math.cos(a) * m0)},${f(-H + Math.sin(a) * (m0) * KY)} M ${f(Math.cos(a) * m1)},${f(-H + Math.sin(a) * (m1) * KY)} L ${f(Math.cos(a) * R)},${f(-H + Math.sin(a) * R)} `; }
    ti += `<path d="${vj}" stroke="${mix(c.deep, K.ink9, 0.3)}" stroke-width="1.5"/>`;
    ti += `<path d="${P([[R * 0.62, -H - R * 0.2 * KY], [R * 0.96, -H - R * 0.05 * KY], [R * 0.9, -H + R * 0.3 * KY], [R * 0.64, -H + R * 0.18 * KY]])}" fill="${mix(c.base, c.deep, 0.3)}"/>`;
    s += `<path d="${ann}" fill="${c.light}" fill-rule="evenodd"/>` + X.clipped(ann, ti);
    s += E.ribbon(circ(0, -H, R - 2.4, Math.PI * 1.08, Math.PI * 1.46, 18), 1.6, { color: K.p100, taper: 'mid' });
    // hole: far inner wall = black crescent; floor visible through the hole (ground tone + a slab joint + a torn-paper sliver)
    const hole = cd(0, -H, r - 0.5);
    let hi = `<rect x="${-r - 2}" y="${-H - r - 2}" width="${2 * r + 4}" height="${2 * r + 4}" fill="${K.ink9}"/>`;
    hi += `<path d="${cd(0, 0, r)}" fill="${c.base}"/>` + X.clipped(cd(0, 0, r), `<path d="M ${f(-r)},${f(r * 0.06)} L ${f(r * 0.3)},${f(-r * 0.12)} L ${f(r)},${f(r * 0.2)} M ${f(r * 0.3)},${f(-r * 0.12)} L ${f(r * 0.12)},${f(-r * KY)}" fill="none" stroke="${mix(c.base, c.deep, 0.55)}" stroke-width="1.5"/><path d="${P([[-r * 0.5, r * 0.27], [-r * 0.05, r * 0.18], [r * 0.2, r * 0.25], [-r * 0.2, r * 0.32]])}" fill="${mix(c.base, c.light, 0.78)}"/>`);
    s += `<path d="${hole}" fill="${K.ink9}"/>` + X.clipped(hole, hi);
    s += E.ribbon(circ(0, -H, r, 0, Math.PI * 2, 48), 2, { closed: true, color: K.ink9, wobble: 0.12 });
    // silhouette
    const sil = circ(0, -H, R, Math.PI, Math.PI * 2, 33).concat(circ(0, 0, R, 0, Math.PI, 33));
    s += X.out(sil, 2.6, { dense: true, gaps: 1 });
    // half-sunk: heaved floor slab chunks over the front-right base + ground fracture
    const chunk = (cx, cy, cw, chh, rot, th) => { // heaved floor slab: tilted top face (base tone) + thickness strip (black)
      const R2 = (u, v) => [cx + u * Math.cos(rot) - v * Math.sin(rot), cy + u * Math.sin(rot) + v * Math.cos(rot)];
      const tpP = [R2(-cw / 2, -chh / 2), R2(cw / 2, -chh / 2 - 2), R2(cw / 2 + 1, chh / 2), R2(-cw / 2 + 2, chh / 2 + 1)];
      const fr = [tpP[3], tpP[2], [tpP[2][0], tpP[2][1] + th], [tpP[3][0], tpP[3][1] + th]];
      return X.face(fr, K.ink9, '', 0) + X.face(tpP, mix(c.base, c.light, 0.35), `<path d="${P([tpP[1], tpP[2], [tpP[2][0] - 4, tpP[2][1]], [tpP[1][0] - 3, tpP[1][1] + 3]])}" fill="${X.e20}"/>`, 0) + X.out(tpP.slice(0, 3).concat([fr[2], fr[3]]), 1.8, { gaps: 0 });
    };
    s += chunk(R * 0.52, R * 0.84 * KY + 2, 20, 8, -0.3, 4) + chunk(R * 0.98, R * 0.42 * KY + 1, 14, 7, -0.8, 3.5);
    s += X.line([[R * 0.28, R * 1.02 * KY + 3], [R * 0.7, R * 1.12 * KY + 3], [R * 1.1, R * 0.98 * KY + 2], [R * 1.3, R * 1.04 * KY + 2]], 1.5, { color: mix(c.deep, K.ink9, 0.3) });
    return s;
  };
  // 오려진 공백 — low stone doorframe (two jambs + lintel + threshold, H 28). A diagonal tear runs from the lintel's top-left down to
  // the right jamb foot: above/right of it the frame is torn out of the manuscript, so INSIDE the frame silhouette you see blank paper.50
  // (ghost pencil lines of what was drawn, page-edge shadow). Top-left corner stays inked, so it still reads as a door frame.
  L.void = function (X, o) {
    const c = X.c, rnd = X.rnd, w = o.w || 56, d = o.d || 8, pw = 11, Hf = Math.min(o.H || 28, 28), lh = 6;
    const x0 = -w / 2, x1 = w / 2, yB = d / 2, yF = yB - Hf, yTop = yF - d, yL = yF + lh;
    X.meta = { H: Hf, name: '오려진 공백(지워진 문틀)' };
    // tear: from the lintel top (x0 + 0.3w) down to the right jamb foot, jagged
    const t0 = [x0 + w * 0.46, yTop - 3], t1 = [x1 + 4, yB - 11];
    const tear = []; for (let i = 0; i <= 22; i++) { const k = i / 22; tear.push([t0[0] + (t1[0] - t0[0]) * k + (rnd() - 0.5) * 2.4, t0[1] + (t1[1] - t0[1]) * Math.pow(k, 0.8) + (rnd() - 0.5) * 3 + (i % 5 === 2 ? -2.2 : 0)]); }
    const clipA = P(tear.concat([[x1 + 30, yB - 6], [x1 + 30, yTop - 30], [t0[0], yTop - 30]])), clipB = P(tear.concat([[x1 + 30, yB - 6], [x1 + 30, yB + 40], [x0 - 30, yB + 40], [x0 - 30, yTop - 30], [t0[0], yTop - 30]]));
    let s = X.shadow(E.rect(x0, -d / 2, x0 + w * 0.7, yB), 14, 7);
    const T = E.block(X, 0, yB - 4, w - 2 * pw + 4, 7, 3, { noShadow: true }); s += T.s + T.outline(1.8);
    // inked frame (full), clipped to the surviving side of the tear
    let fr = '';
    [[x0 + pw / 2, 0], [x1 - pw / 2, 1]].forEach(([x, right]) => {
      const B = E.block(X, x, 0, pw, d, Hf, { noShadow: true, rim: false });
      fr += B.s + X.clipped(E.P(B.front), right ? `<path d="${P([[x - 1, B.yT1], [x + pw, B.yT1], [x + pw, yB], [x - 4, yB]])}" fill="${K.ink9}"/>` : `<rect x="${x + 1.5}" y="${B.yT1}" width="${pw}" height="${Hf}" fill="${X.d40}"/>`);
    });
    const Lt = E.block(X, 0, 0, w, d, Hf, { noShadow: true, rim: true });
    const lintF = E.rect(x0, yF, x1, yL);
    fr += X.face(lintF, c.base, `<rect x="${x0}" y="${yF}" width="${w}" height="${lh}" fill="${X.d20}"/><path d="${P([[x1 - pw - 4, yF], [x1, yF], [x1, yL], [x1 - pw - 10, yL]])}" fill="${K.ink9}"/>`, 0);
    fr += X.face(E.rect(x0, yTop, x1, yF), c.light, `<path d="${P([[x0 + 3, yTop + 3], [x0 + w * 0.26, yTop + 2.4], [x0 + w * 0.2, yTop + 5], [x0 + 3, yTop + 5.4]])}" fill="${X.e20}"/>`, 0);
    fr += X.rim(x0 + 1, yF, x1 - 1, yF, 2.2);
    // through the doorway the world is erased: blank paper.50 + page-edge shadow along the lit jamb and lintel
    fr = `<path d="${P(E.jag(E.rect(x0 + pw - 1, yL - 1, x1 - pw + 1, yB - 5), rnd, 0.8, 5))}" fill="${K.p50}"/><path d="${P([[x0 + pw, yB - 5], [x0 + pw, yL], [x1 - pw, yL], [x1 - pw, yL + 2.6], [x0 + pw + 2.6, yL + 2.6], [x0 + pw + 2.6, yB - 5]])}" fill="${K.voidp}"/>` + fr;
    fr += X.line([[x0 + pw, yL + 0.5], [x0 + pw, yB - 0.5]], 1.9, { taper: 'end' }) + X.line([[x1 - pw, yL + 0.5], [x1 - pw, yB - 0.5]], 1.9, { taper: 'end' }) + X.line([[x0 + pw, yL], [x1 - pw, yL]], 2.2);
    const cap = [[x0, yB], [x0, yTop], [x1, yTop], [x1, yB], [x1 - pw, yB], [x1 - pw, yL], [x0 + pw, yL], [x0 + pw, yB]];
    fr += X.out(E.rect(x0, yTop, x0 + pw, yB), 2.4, { gaps: 1 }) + X.out(E.rect(x1 - pw, yTop, x1, yB), 2.4, { gaps: 1 }) + X.out(E.rect(x0, yTop, x1, yL), 2.4, { gaps: 1 });
    s += X.clipped(clipB, fr);
    // torn-out part: blank paper inside the frame silhouette (torn outline), ghost lines, page-edge shadow
    const capJ = E.jag(cap, rnd, 1.3, 5);
    const ghost = mix(K.p50, K.ink3, 0.45);
    let pp = `<path d="${P(capJ)}" fill="${K.p50}"/>`;
    pp += `<path d="M ${f(x0)},${f(yF)} H ${f(x1)} M ${f(x1 - pw)},${f(yL)} V ${f(yB)} M ${f(x0 + pw)},${f(yL)} H ${f(x1 - pw)}" stroke="${ghost}" stroke-width="1" stroke-dasharray="4 3" fill="none"/>`;
    pp += `<path d="${P(capJ.map(([x, y]) => [x + 1.2, y + 1.6]))}" fill="none" stroke="${K.voidp}" stroke-width="2.2"/>`;
    pp += `<path d="${P(capJ)}" fill="none" stroke="${mix(c.deep, K.ink9, 0.15)}" stroke-width="1" opacity="0.75"/>`;
    s += X.clipped(clipA, pp);
    // the tear itself: ink fibre edge + lifted-page shadow + fibres
    const inCap = tear.filter(([x, y]) => y > yTop - 2 && y < yB + 1 && x > x0 - 1 && x < x1 + 1);
    s += `<path d="${P(inCap.map(([x, y]) => [x + 1, y + 1.8]), false)}" fill="none" stroke="${mix(c.deep, K.ink9, 0.2)}" stroke-width="1.6" opacity="0.55"/>` + E.ribbon(inCap, 1.8, { color: K.ink9, taper: 'mid', min: 0.45, wobble: 0.5 });
    for (let k = 0; k < 6; k++) { const [x, y] = inCap[Math.floor(rnd() * inCap.length)]; s += `<path d="M ${f(x)},${f(y)} l ${f(1 + rnd() * 2)},${f(-1.5 - rnd() * 2)}" stroke="${ghost}" stroke-width="0.8"/>`; }
    // curled flap where the tear leaves the lintel + eraser crumbs on the threshold
    const q0 = inCap[3] || tear[3];
    s += `<path d="M ${f(q0[0])},${f(q0[1])} q 7,-7 13,-3 q -6,1 -8,7 Z" fill="${K.p300}" stroke="${K.ink9}" stroke-width="1.2" stroke-linejoin="round"/>`;
    for (let k = 0; k < 4; k++) { const x = w * 0.05 + rnd() * w * 0.4, y = yB + 3 + rnd() * 5; s += `<path d="M ${f(x)},${f(y)} q 1.6,-1.2 3.2,0.3 q -1.2,1.4 -3.2,-0.3 Z" fill="${K.voidp}" stroke="${mix(c.deep, K.ink9, 0.3)}" stroke-width="0.7"/>`; }
    return s;
  };
  // 관문 석주 밑동 (pillar) — squat hexagonal obsidian stump sheared at a slant; facet glint is a single wedge (no round shapes)
  L.pillar = function (X, o) {
    const c = X.c, rnd = X.rnd, w = o.w || 36, d = o.d || 22, ob = c.spot, lift = 5, H = Math.min(o.H || 19, 23);
    X.meta = { H: H + lift, name: '관문 석주 밑동' };
    let s = X.shadow(E.rect(-w / 2 - 5, -d / 2 - 4, w / 2 + 5, d / 2 + 4), (H + lift) * 0.62 + 4, (H + lift) * 0.3 + 3);
    const PL = E.block(X, 0, 0, w + 10, d + 8, lift, { noShadow: true }); s += PL.s + PL.outline(2.2);
    const y0 = -lift, x0 = -w / 2, x1 = w / 2, yT1 = y0 + d / 2 - H, yT0 = y0 - d / 2 - H, yB = y0 + d / 2;
    // broken top rim: jagged back edge (the shaft snapped), flat moonlit plane, one angular glint
    const topP = [[x0, yT1], [x1, yT1], [x1, yT0 + 6], [x1 - w * 0.2, yT0 + 3], [x1 - w * 0.33, yT0 + 5.5], [x0 + w * 0.46, yT0 + 0.5], [x0 + w * 0.2, yT0 + 2], [x0, yT0]];
    const front = E.rect(x0, yT1, x1, yB);
    s += X.face(front, ob, `<path d="${P([[x1 - w * 0.36, yT1], [x1 + 2, yT1], [x1 + 2, yB + 2], [x1 - w * 0.46, yB + 2]])}" fill="${K.ink9}"/><path d="${P([[x0, yT1 + H * 0.55], [x1, yT1 + H * 0.55], [x1, yT1 + H * 0.55 + 2.4], [x0, yT1 + H * 0.55 + 2.4]])}" fill="${K.ink9}"/><path d="${P([[x0, yT1 + H * 0.55 + 2.4], [x1 - w * 0.4, yT1 + H * 0.55 + 2.4], [x1 - w * 0.42, yT1 + H * 0.55 + 3.6], [x0, yT1 + H * 0.55 + 3.6]])}" fill="${mix(ob, K.ink3, 0.45)}"/>`, 0);
    s += X.face(topP, mix(ob, K.ink3, 0.5), `<path d="${P([[x0, yT0], [x0 + w * 0.2, yT0 + 3], [x0 + w * 0.12, yT0 + 7], [x0 + 2, yT1 - 2]])}" fill="${K.ink3}"/><path d="${P([[x0 + 1, yT0 + 1], [x0 + w * 0.16, yT0 + 3.4], [x0 + 3, yT0 + 7]])}" fill="${K.p300}"/><path d="${P([[x1 - w * 0.3, yT1 - 1], [x1, yT1 - 1], [x1, yT0 + 8]])}" fill="${mix(ob, K.ink3, 0.25)}"/>`, 0);
    s += X.rim(x0 + 1, yT1, x1 - 1, yT1, 2.2);
    s += X.out([[x0, yB], [x0, yT0]].concat(topP.slice(1, 7).reverse()).concat([[x1, yT0 + 5], [x1, yB]]), 2.6, { gaps: 1 });
    s += E.rubble(X, x1 - 4, x1 + 14, d / 2 + 2, 3);
    return s;
  };
})(window.PN);
// ---- PN.env.hazard(kind, stage, o): circle of EXACT hit radius o.r centred on (0,0) (§7.3 · §12) ----
// ownership (§12.1): hostile = amber hatch preview → coral active, brush-drawn border; ally = paper + cyan halftone + cyan stitch; neutral water = ink wash only.
// stages: 'static' (persistent zone) · 'preview' (0–65 %, o.p = progress) · 'imminent' (65–100 %) · 'active' (hit) · 'decay' (dry ink stain)
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix;
  const H = E.hz = {};
  H.defs = function (p) {
    const hat = (id, pitch, lw, col, a, inkA) => `<pattern id="${id}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect y="${f(-0.9)}" width="${pitch}" height="${f(lw + 1.8)}" fill="${K.ink9}" opacity="${inkA}"/><rect width="${pitch}" height="${lw}" fill="${col}" opacity="${a}"/></pattern>`;
    return hat(p + 'hs', 10, 2, K.warn, 0.75, 0.28) + hat(p + 'hd', 5, 1.8, K.warn, 0.85, 0.22) + hat(p + 'hc', 6, 2, K.warn, 0.6, 0.18) +
      `<pattern id="${p}ad" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.5" cy="2.5" r="1.26" fill="${K.allyD}"/></pattern>` + E.dotDefs(p, K.ink9, 5);
  };
  const circ = (r) => `M ${-r},0 a ${r},${r} 0 1 0 ${2 * r},0 a ${r},${r} 0 1 0 ${-2 * r},0`;
  H.circ = circ;
  // arc from 12 o'clock clockwise for fraction t
  H.arc = function (r, t, a0 = -Math.PI / 2) {
    t = Math.max(0.001, Math.min(0.9999, t)); const a1 = a0 + t * Math.PI * 2;
    return `M ${f(Math.cos(a0) * r)},${f(Math.sin(a0) * r)} A ${r},${r} 0 ${t > 0.5 ? 1 : 0} 1 ${f(Math.cos(a1) * r)},${f(Math.sin(a1) * r)}`;
  };
  // brush head (teardrop, ink) sitting on the circle at fraction t, pointing along the stroke
  H.brushHead = function (r, t, s = 7) {
    const a = -Math.PI / 2 + t * Math.PI * 2, x = Math.cos(a) * r, y = Math.sin(a) * r, deg = a * 180 / Math.PI + 90;
    return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(deg)})"><path d="M ${-s * 2.2},0 C ${-s},${-s * 0.25} ${-s * 0.2},${-s * 0.72} ${s * 0.45},${-s * 0.5} C ${s * 1.05},${-s * 0.25} ${s * 1.05},${s * 0.25} ${s * 0.45},${s * 0.5} C ${-s * 0.2},${s * 0.72} ${-s},${s * 0.25} ${-s * 2.2},0 Z" fill="${K.ink9}"/><circle cx="${f(s * 0.3)}" cy="${f(-s * 0.18)}" r="${f(s * 0.16)}" fill="${K.p100}"/></g>`;
  };
  // needle head for ALLY progress (stitch drawn by the needle)
  H.needleHead = function (r, t, s = 8) {
    const a = -Math.PI / 2 + t * Math.PI * 2, x = Math.cos(a) * r, y = Math.sin(a) * r, deg = a * 180 / Math.PI + 90;
    return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(deg)})"><path d="M ${-s * 1.6},-1.6 L ${s * 0.8},-1.3 L ${s * 1.6},0 L ${s * 0.8},1.3 L ${-s * 1.6},1.6 Z" fill="${K.p50}" stroke="${K.ink9}" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="${-s * 1.1}" cy="0" rx="1.6" ry="0.7" fill="${K.ally}"/><path d="M ${s * 0.8},-1.3 L ${s * 1.6},0 L ${s * 0.8},1.3 Z" fill="${K.ally}"/></g>`;
  };
  // sandwich stroke (§3.2): ink ≥2px outside + signal + paper/glow core
  H.sand = (d, col, w = 2.6, core = K.p50, extra = '') => `<path d="${d}" fill="none" stroke="${K.ink9}" stroke-width="${f(w + 2.6)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>` + (core ? `<path d="${d}" fill="none" stroke="${core}" stroke-width="${f(Math.max(0.7, w * 0.28))}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>` : '');
  // ---- HOSTILE telegraph circle (preview → imminent → active), shared by shock / generic enemy circles ----
  H.tele = function (p, r, stage, t, glyph = '') {
    let s = '';
    if (stage === 'preview') {
      s += `<circle r="${r}" fill="url(#${p}hs)" opacity="0.75"/>`;
      s += `<circle r="${r}" fill="none" stroke="${K.ink9}" stroke-width="1.4" stroke-dasharray="1.5 7" stroke-linecap="round" opacity="0.4"/>`;
      s += `<path d="${H.arc(r, t)}" fill="none" stroke="${K.ink9}" stroke-width="2.6" stroke-dasharray="1 5.5" stroke-linecap="round" opacity="0.85"/>`;
      s += `<path d="${H.arc(r, t)}" fill="none" stroke="${K.warn}" stroke-width="1" stroke-linecap="round"/>`;
      s += H.brushHead(r, t, 6.5);
      s += glyph;
    } else if (stage === 'imminent') {
      s += `<circle r="${r}" fill="url(#${p}hd)"/>`;
      s += `<path d="${H.arc(r, t)}" fill="none" stroke="${K.ink9}" stroke-width="5" stroke-linecap="round"/><path d="${H.arc(r, t)}" fill="none" stroke="${K.warn}" stroke-width="1.6" stroke-linecap="round"/>`;
      const n = r > 90 ? 12 : 8;
      for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n, x0 = Math.cos(a) * (r + 3), y0 = Math.sin(a) * (r + 3), x1 = Math.cos(a) * (r + 11), y1 = Math.sin(a) * (r + 11); s += `<path d="M ${f(x0)},${f(y0)} L ${f(x1)},${f(y1)}" stroke="${K.ink9}" stroke-width="3.6" stroke-linecap="round"/><path d="M ${f(x0)},${f(y0)} L ${f(x1)},${f(y1)}" stroke="${K.warn}" stroke-width="1.2" stroke-linecap="round"/>`; }
      s += H.brushHead(r, t, 7.5) + glyph;
    } else if (stage === 'active') {
      s += `<circle r="${r}" fill="${K.host}" opacity="0.55"/>`;
      s += PN.env.hz.edgeDots(r, K.ink9);
      s += `<circle r="${f(r * 0.94)}" fill="none" stroke="${K.p50}" stroke-width="3" opacity="0.9"/>`;
      s += `<circle r="${r}" fill="none" stroke="${K.ink9}" stroke-width="4.5"/>` + glyph;
    } else if (stage === 'decay') {
      s += H.stain(r, 7);
    }
    return s;
  };
  // ink halftone rim (dots growing toward the edge) — "먹 망점 가장자리"
  H.edgeDots = function (r, col, band = 0.3) {
    const out = []; const pitch = 5;
    for (let y = -r; y <= r; y += pitch) for (let x = -r; x <= r; x += pitch) {
      const u = (x + y) * Math.SQRT1_2, v = (y - x) * Math.SQRT1_2, d = Math.hypot(u, v), k = (d - r * (1 - band)) / (r * band);
      if (k > 0 && d < r - 1) out.push(`<circle cx="${f(u)}" cy="${f(v)}" r="${f(Math.min(2.1, 0.5 + k * 1.8))}"/>`);
    }
    return `<g fill="${col}">${out.join('')}</g>`;
  };
  // dry ink stain decal (ink.700 → ink.300 as it dries), irregular, inside the circle
  H.stain = function (r, seed, dry = 0.5) {
    const rnd = E.rng(seed), col = mix(K.ink7, K.ink3, dry);
    const blob = E.ellPts(0, 0, r * 0.62, r * 0.5, 11).map((q) => [q[0] * (0.8 + rnd() * 0.4), q[1] * (0.8 + rnd() * 0.4)]);
    let s = `<path d="${E.crPath(blob, true)}" fill="${col}" opacity="0.5"/><path d="${E.crPath(E.shrink(blob, r * 0.18), true)}" fill="${col}" opacity="0.35"/>`;
    s += E.splat(r * 0.5, r * 0.1, r * 0.1, 8, seed + 3, col).replace('<g ', '<g opacity="0.55" ');
    for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, d = r * (0.6 + rnd() * 0.3); s += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(0.8 + rnd() * 1.6)}" fill="${col}" opacity="0.6"/>`; }
    return s;
  };
  H.wrap = (p, body, cls) => `<g class="pn-hazard ${cls}"><defs>${H.defs(p)}</defs>${body}</g>`;
})(window.PN);
// ---- hazard kinds: glyphs + 9 kinds ----
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix, H = E.hz;
  const G = H.glyph = {
    wave: (g, col = K.warn) => { let d = ''; for (let k = -1; k <= 1; k++) { const y = k * g * 0.42; d += `M ${f(-g)},${f(y)} q ${f(g * 0.25)},${f(-g * 0.3)} ${f(g * 0.5)},0 t ${f(g * 0.5)},0 t ${f(g * 0.5)},0 t ${f(g * 0.5)},0 `; } return H.sand(d, col, 2.4); },
    chain: (g, col = K.warn) => H.sand(`M ${f(-g * 0.95)},${f(-g * 0.05)} a ${f(g * 0.5)},${f(g * 0.3)} -30 1 1 ${f(g * 0.9)},${f(-g * 0.02)} a ${f(g * 0.5)},${f(g * 0.3)} -30 1 1 ${f(-g * 0.9)},${f(g * 0.02)} M ${f(-g * 0.02)},${f(g * 0.1)} a ${f(g * 0.5)},${f(g * 0.3)} -30 1 1 ${f(g * 0.9)},${f(-g * 0.02)} a ${f(g * 0.5)},${f(g * 0.3)} -30 1 1 ${f(-g * 0.9)},${f(g * 0.02)}`, col, 2.4),
    nul: (g, col = K.warn) => H.sand(`M ${f(-g * 0.62)},0 a ${f(g * 0.62)},${f(g * 0.62)} 0 1 0 ${f(g * 1.24)},0 a ${f(g * 0.62)},${f(g * 0.62)} 0 1 0 ${f(-g * 1.24)},0 M ${f(-g * 0.48)},${f(g * 0.48)} L ${f(g * 0.48)},${f(-g * 0.48)}`, col, 2.6),
    flame: (g, core = K.host) => { const d = `M 0,${f(g * 0.9)} C ${f(-g * 0.75)},${f(g * 0.85)} ${f(-g * 0.85)},${f(g * 0.05)} ${f(-g * 0.35)},${f(-g * 0.35)} C ${f(-g * 0.3)},${f(-g * 0.05)} ${f(-g * 0.1)},${f(g * 0.05)} ${f(-g * 0.05)},${f(-g * 0.1)} C ${f(-g * 0.2)},${f(-g * 0.55)} ${f(0)},${f(-g * 0.8)} ${f(g * 0.15)},${f(-g * 1.05)} C ${f(g * 0.2)},${f(-g * 0.6)} ${f(g * 0.75)},${f(-g * 0.35)} ${f(g * 0.62)},${f(g * 0.2)} C ${f(g * 0.58)},${f(g * 0.7)} ${f(g * 0.35)},${f(g * 0.9)} 0,${f(g * 0.9)} Z`;
      return `<path d="${d}" fill="${K.p50}" stroke="${K.ink9}" stroke-width="3" stroke-linejoin="round"/><path d="M 0,${f(g * 0.72)} C ${f(-g * 0.38)},${f(g * 0.65)} ${f(-g * 0.35)},${f(g * 0.2)} ${f(-g * 0.05)},${f(-g * 0.2)} C ${f(g * 0.1)},${f(g * 0.1)} ${f(g * 0.4)},${f(g * 0.2)} ${f(g * 0.3)},${f(g * 0.45)} C ${f(g * 0.25)},${f(g * 0.65)} ${f(g * 0.15)},${f(g * 0.72)} 0,${f(g * 0.72)} Z" fill="${core}"/>`; },
    crack: (g, col = K.warn) => { // shattered-ground glyph: zig-zag fissures of unequal length from a pit
      let d = ''; const arms = [[-0.95, -0.3, 1], [-0.35, -1, 0.8], [0.45, -0.9, 1.05], [1, 0.1, 0.9], [0.3, 0.95, 0.75], [-0.7, 0.72, 0.6]];
      arms.forEach(([x, y, L], i) => { const nx = -y, ny = x, k = g * L, sg = i % 2 ? 1 : -1; d += `M ${f(x * 3)},${f(y * 3)} L ${f(x * k * 0.38 + nx * sg * 3.2)},${f(y * k * 0.38 + ny * sg * 3.2)} L ${f(x * k * 0.66 - nx * sg * 2.6)},${f(y * k * 0.66 - ny * sg * 2.6)} L ${f(x * k)},${f(y * k)} `; });
      return H.sand(d, col, 1.9) + `<circle r="${f(g * 0.2)}" fill="${K.ink9}"/>`; },
    // shatter burst (shock): irregular 5-spike comic impact burst — ink.900 2px outline / signal fill (amber; coral when active) / paper.50 core + 3 crack cuts
    shatter: (g, col = K.warn, core = K.p50) => {
      const RR = [1, 0.46, 0.8, 0.42, 0.95, 0.5, 0.76, 0.44, 0.9, 0.48], a0 = -Math.PI / 2 + 0.12;
      const burst = (k) => RR.map((rr, i) => { const a = a0 + i * Math.PI / 5; return (i ? 'L' : 'M') + f(Math.cos(a) * rr * g * k) + ',' + f(Math.sin(a) * rr * g * k); }).join('') + 'Z';
      let cuts = ''; [1, 5, 7].forEach((i) => { const a = a0 + i * Math.PI / 5; cuts += `M ${f(Math.cos(a) * g * 0.18)},${f(Math.sin(a) * g * 0.18)} L ${f(Math.cos(a) * g * 0.48)},${f(Math.sin(a) * g * 0.48)} `; });
      return `<path d="${burst(1)}" fill="${col}" stroke="${K.ink9}" stroke-width="2" stroke-linejoin="miter"/>` + (core ? `<path d="${burst(0.42)}" fill="${core}" stroke="${K.ink9}" stroke-width="1.2" stroke-linejoin="miter"/>` : '') + `<path d="${cuts}" stroke="${K.ink9}" stroke-width="1.4" stroke-linecap="square"/>`;
    },
    bone: (g) => `<path d="M ${f(-g * 0.55)},${f(-g * 0.14)} L ${f(g * 0.55)},${f(-g * 0.14)} M ${f(-g * 0.55)},${f(g * 0.14)} L ${f(g * 0.55)},${f(g * 0.14)}" stroke="${K.ink9}" stroke-width="${f(g * 0.5)}" stroke-linecap="round"/><g fill="${K.p50}" stroke="${K.ink9}" stroke-width="2"><circle cx="${f(-g * 0.6)}" cy="${f(-g * 0.22)}" r="${f(g * 0.24)}"/><circle cx="${f(-g * 0.6)}" cy="${f(g * 0.22)}" r="${f(g * 0.24)}"/><circle cx="${f(g * 0.6)}" cy="${f(-g * 0.22)}" r="${f(g * 0.24)}"/><circle cx="${f(g * 0.6)}" cy="${f(g * 0.22)}" r="${f(g * 0.24)}"/></g><rect x="${f(-g * 0.6)}" y="${f(-g * 0.17)}" width="${f(g * 1.2)}" height="${f(g * 0.34)}" fill="${K.p50}"/><circle r="${f(g * 0.1)}" fill="${K.ally}"/>`,
    star: (g) => { let d = ''; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, rr = i % 2 ? g * 0.42 : g; d += (i ? 'L' : 'M') + f(Math.cos(a) * rr) + ',' + f(Math.sin(a) * rr); } return `<path d="${d}Z" fill="${K.p50}" stroke="${K.ink9}" stroke-width="2.6" stroke-linejoin="round"/>`; }
  };
  const circ = H.circ;
  const zoneRim = (r) => H.sand(circ(r), K.warn, 3, K.p50);
  const stitch = (d, w = 2.2) => `<path d="${d}" fill="none" stroke="${K.ink9}" stroke-width="${w + 2.4}" stroke-dasharray="6 2" stroke-linecap="butt"/><path d="${d}" fill="none" stroke="${K.ally}" stroke-width="${w}" stroke-dasharray="5 3" stroke-linecap="butt"/><path d="${d}" fill="none" stroke="${K.allyG}" stroke-width="0.7" stroke-dasharray="5 3"/>`;
  H.stitch = stitch;
  const KIND = H.kind = {};
  // neutral: shallow ink-wash water (§11 Ch3) — no signal colour, no cyan ever
  KIND.water = (p, r, st, o) => {
    const c = E.CH[o.ch || 3], rnd = E.rng(o.seed || 5), wash = mix(c.deep, K.ink5, 0.3);
    const edge = E.ellPts(0, 0, r, r, 30).map(([x, y]) => { const k = 0.955 + rnd() * 0.045; return [x * k, y * k]; });
    const d = E.crPath(edge, true);
    let s = `<path d="${d}" fill="${mix(c.base, c.deep, 0.42)}" opacity="0.62"/><circle r="${f(r * 0.9)}" fill="none" stroke="${mix(c.base, c.light, 0.6)}" stroke-width="3" opacity="0.5"/>`;
    let fl = '';
    [0.28, 0.5, 0.72].forEach((k, i) => { for (let q = 0; q < 3; q++) { const a0 = q * 2.1 + i * 0.7 + rnd() * 0.5; fl += E.ribbon(E.ellPts(0, 0, r * k, r * k, 26, a0, a0 + 1.2 + rnd() * 0.6), 2.2 - i * 0.3, { color: wash, taper: 'mid', opacity: 0.8 }); } });
    for (let k = 0; k < 3; k++) { const y = -r * 0.35 + k * r * 0.35 + (rnd() - 0.5) * 6, x0 = -r * 0.85 + rnd() * r * 0.2, L = r * (0.5 + rnd() * 0.4); fl += E.ribbon(E.cr([[x0, y], [x0 + L * 0.5, y - 2], [x0 + L, y + 1]], false, 8), 1.6, { color: wash, taper: 'mid', opacity: 0.55 }); }
    s += `<clipPath id="${p}wc"><path d="${d}"/></clipPath><g clip-path="url(#${p}wc)">${fl}</g>`;
    s += E.ribbon(E.cr(edge, true, 4), 1.5, { closed: true, color: wash, gaps: 3, wobble: 0.4, opacity: 0.9 });
    s += `<ellipse cx="${f(-r * 0.3)}" cy="${f(-r * 0.34)}" rx="2.6" ry="1.5" fill="${K.p50}"/>`;
    return s;
  };
  // hostile control zones: amber rim 3px + dense hatch α≈0.35 + inner glyph (no coral — no damage)
  KIND.slow = (p, r, st, o) => {
    const g = Math.max(11, Math.min(20, r * 0.28));
    let s = `<circle r="${r}" fill="url(#${p}hc)" opacity="0.6"/>`;
    if (o.ch === 4) { // Ch4 호박 눈금 원: ticks fill clockwise with progress o.p
      const n = 24, t = o.p == null ? 0.6 : o.p;
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / n, on = i / n < t, r0 = r - 14, r1 = r - (i % 6 ? 6 : 3); const dd = `M ${f(Math.cos(a) * r0)},${f(Math.sin(a) * r0)} L ${f(Math.cos(a) * r1)},${f(Math.sin(a) * r1)}`; s += on ? H.sand(dd, K.warn, 2.2, null) : `<path d="${dd}" stroke="${K.ink9}" stroke-width="2" opacity="0.45"/>`; }
      s += H.sand(`M 0,0 L 0,${f(-g * 0.8)} M 0,0 L ${f(g * 0.55)},${f(g * 0.2)}`, K.warn, 2.4) + `<circle r="3" fill="${K.ink9}"/>`;
    } else s += G.wave(g);
    return s + zoneRim(r);
  };
  KIND.root = (p, r, st, o) => {
    const g = Math.max(11, Math.min(20, r * 0.28));
    let links = ''; const n = Math.max(10, Math.round(r * 2 * Math.PI / 13));
    for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n, x = Math.cos(a) * (r - 9), y = Math.sin(a) * (r - 9), deg = a * 57.3 + 90; links += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${i % 2 ? 5.4 : 6}" ry="${i % 2 ? 1.6 : 3}" transform="rotate(${f(deg)} ${f(x)} ${f(y)})" fill="none" stroke="${K.ink9}" stroke-width="2.4"/>`; }
    return `<circle r="${r}" fill="url(#${p}hc)" opacity="0.6"/>` + `<g opacity="0.85">${links}</g>` + G.chain(g) + zoneRim(r);
  };
})(window.PN);
// ---- hazard kinds (cont.): trap · fire · null · shock · vortex(ally) · warning(ally) + PN.env.hazard entry ----
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix, H = E.hz, G = H.glyph, KIND = H.kind, circ = H.circ;
  const zoneRim = (r) => H.sand(circ(r), K.warn, 3, K.p50);
  // trap — physical object inside the hostile ring. o.ch: 1 쥐덫 철판 (default) · 2 쇠사슬 올가미 · 4 톱니 덫
  KIND.trap = (p, r, st, o) => {
    const ch = o.ch || 1, pr = r * 0.74, rnd = E.rng(o.seed || 9);
    let s = st === 'active' ? `<circle r="${r}" fill="${K.host}" opacity="0.55"/>` : `<circle r="${r}" fill="url(#${p}hc)" opacity="0.6"/>`;
    if (ch === 2) { // chain snare: noose ring of links + stake
      const n = Math.round(pr * 2 * Math.PI / 12); let ln = '';
      const rr = st === 'active' ? pr * 0.45 : pr;
      for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n, x = Math.cos(a) * rr, y = Math.sin(a) * rr, deg = a * 57.3 + 90; ln += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${i % 2 ? 6 : 6.6}" ry="${i % 2 ? 2 : 3.6}" transform="rotate(${f(deg)} ${f(x)} ${f(y)})" fill="none" stroke="${K.ink9}" stroke-width="3.2"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${i % 2 ? 6 : 6.6}" ry="${i % 2 ? 2 : 3.6}" transform="rotate(${f(deg)} ${f(x)} ${f(y)})" fill="none" stroke="${K.ink1}" stroke-width="1"/>`; }
      s += ln + `<circle r="7" fill="${K.ink9}"/><circle cx="-1.5" cy="-1.5" r="2.4" fill="${K.ink1}"/>` + E.inkQ(pr * 0.7, pr * 0.7, pr * 0.9, pr * 0.95, r * 1.02, r * 0.85, 3.4, { taper: 'end' });
    } else if (ch === 4) { // circular saw-gear trap
      s += `<path d="${E.P(E.gearPath(0, 0, pr * 0.9, 18, 0.14, 0.1))}" fill="${K.ink7}" stroke="${K.ink9}" stroke-width="2.6" stroke-linejoin="round"/>`;
      s += `<path d="${E.P(E.gearPath(0, 0, pr * 0.9, 18, 0.14, 0.1).filter((q, i) => i % 4 === 1 || i % 4 === 2), false)}" fill="none" stroke="${K.p300}" stroke-width="1.4" stroke-dasharray="3 9"/>`;
      s += `<circle r="${f(pr * 0.5)}" fill="none" stroke="${K.ink5}" stroke-width="2"/><circle r="${f(pr * 0.2)}" fill="${K.ink9}"/><circle cx="-2" cy="-2" r="2.4" fill="${K.p300}"/>`;
      s += E.ribbon(E.ellPts(0, 0, pr * 0.84, pr * 0.84, 20, Math.PI * 1.05, Math.PI * 1.45), 1.4, { color: K.ink1, taper: 'mid' });
    } else { // 원형 쥐덫 철판: iron plate, toothed jaw ring, pressure pad, rivets
      s += `<circle r="${f(pr)}" fill="${K.ink7}" stroke="${K.ink9}" stroke-width="3"/>` + E.ribbon(E.ellPts(0, 0, pr - 3, pr - 3, 24, Math.PI * 1.02, Math.PI * 1.5), 1.6, { color: K.ink3, taper: 'mid' });
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.39; s += `<circle cx="${f(Math.cos(a) * pr * 0.86)}" cy="${f(Math.sin(a) * pr * 0.86)}" r="1.7" fill="${K.ink1}"/>`; }
      const jr = pr * 0.62;
      if (st === 'active') {
        let z = `M ${f(-jr)},0`; for (let i = 0; i <= 10; i++) z += ` L ${f(-jr + i * jr * 0.2)},${i % 2 ? -5 : 5}`;
        s += `<path d="M ${f(-jr)},-7 L ${f(jr)},-7 L ${f(jr)},7 L ${f(-jr)},7 Z" fill="${K.ink9}"/><path d="${z}" fill="none" stroke="${K.p100}" stroke-width="2"/>`;
      } else {
        s += `<circle r="${f(jr)}" fill="none" stroke="${K.ink9}" stroke-width="5"/>`;
        let teeth = ''; const n = 16; for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n, a1 = a - 0.14, a2 = a + 0.14; teeth += `<path d="M ${f(Math.cos(a1) * jr)},${f(Math.sin(a1) * jr)} L ${f(Math.cos(a) * jr * 0.72)},${f(Math.sin(a) * jr * 0.72)} L ${f(Math.cos(a2) * jr)},${f(Math.sin(a2) * jr)} Z"/>`; }
        s += `<g fill="${K.p300}" stroke="${K.ink9}" stroke-width="1.2" stroke-linejoin="round">${teeth}</g>`;
        s += `<path d="M ${f(-jr - 3)},0 L ${f(jr + 3)},0" stroke="${K.ink9}" stroke-width="3.4"/><circle cx="${f(-jr - 3)}" cy="0" r="3.4" fill="${K.ink5}" stroke="${K.ink9}" stroke-width="1.6"/><circle cx="${f(jr + 3)}" cy="0" r="3.4" fill="${K.ink5}" stroke="${K.ink9}" stroke-width="1.6"/>`;
        s += `<circle r="${f(pr * 0.24)}" fill="${K.ink5}" stroke="${K.p300}" stroke-width="1.6"/><path d="M -4,-1 h 8 M -3,2.5 h 6" stroke="${K.ink9}" stroke-width="1.3"/>`;
      }
    }
    if (st === 'active') s += G.star(Math.min(14, r * 0.2)) + `<circle r="${r}" fill="none" stroke="${K.ink9}" stroke-width="4.5"/>`;
    else if (st === 'decay') s = H.stain(r, 13, 0.6) + s.replace(/fill="url\(#[^)]+\)"/, 'fill="none"');
    else s += zoneRim(r);
    return s;
  };
  // fire — amber hatch ring + coral core + flame glyph → soot decal
  KIND.fire = (p, r, st, o) => {
    const g = Math.max(12, Math.min(22, r * 0.34)), cr = r * 0.56;
    if (st === 'decay') { let s = H.stain(r, 21, 0.25); const rnd = E.rng(4); for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, d = rnd() * r * 0.7; s += `<path d="M ${f(Math.cos(a) * d)},${f(Math.sin(a) * d)} q 2,-3 4,0" stroke="${K.ink7}" stroke-width="1.2" fill="none" opacity="0.7"/>`; } return s; }
    if (st === 'preview') return H.tele(p, r, 'preview', o.p == null ? 0.45 : o.p, `<g opacity="0.8">${G.flame(g * 0.8, K.warn)}</g>`);
    let s = `<circle r="${r}" fill="url(#${p}hd)"/>`;
    s += `<circle r="${f(cr)}" fill="${K.host}" opacity="${st === 'active' ? 0.9 : 0.78}"/>` + `<g opacity="0.55">${H.edgeDots(cr, K.hostD, 0.35)}</g>` + `<circle r="${f(cr)}" fill="none" stroke="${K.ink9}" stroke-width="3"/>`;
    s += G.flame(g);
    s += H.sand(circ(r), K.warn, 2.6, K.p50);
    if (st === 'active') s += `<circle r="${f(r + 5)}" fill="none" stroke="${K.host}" stroke-width="2" opacity="0.8"/>`;
    return s;
  };
  // null — ground pattern ERASED: flat void.paper, amber dotted rim, ⊘ glyph; thin coral ring 1.5px while active
  KIND.null = (p, r, st, o) => {
    const rnd = E.rng(o.seed || 17);
    const edge = E.ellPts(0, 0, r, r, 40).map(([x, y], i) => { const k = 1 - (i % 3 ? 0 : rnd() * 0.025); return [x * k, y * k]; });
    let s = `<path d="${E.P(edge)}" fill="${K.voidp}"/>`;
    // interior stays a PURE erased plane (no flecks); 3 eraser crumbs sit just OUTSIDE the rim
    for (let i = 0; i < 3; i++) { const a = 0.5 + i * 2.1 + rnd() * 0.5, d = r * (1.1 + rnd() * 0.06), x = Math.cos(a) * d, y = Math.sin(a) * d; s += `<path d="M ${f(x)},${f(y)} q 2,-2 4.4,-0.4 q -1.4,2.2 -4.4,0.4 Z" fill="${K.voidp}" stroke="${K.ink3}" stroke-width="0.8"/>`; }
    s += `<circle r="${r}" fill="none" stroke="${K.ink9}" stroke-width="5.4" stroke-dasharray="0.1 9" stroke-linecap="round"/><circle r="${r}" fill="none" stroke="${K.warn}" stroke-width="3" stroke-dasharray="0.1 9" stroke-linecap="round"/>`;
    s += `<circle r="${r}" fill="none" stroke="${K.ink3}" stroke-width="1"/>`;
    s += G.nul(Math.max(12, Math.min(22, r * 0.3)));
    if (st === 'active') s += `<circle r="${f(r * 0.9)}" fill="none" stroke="${K.ink9}" stroke-width="3.2"/><circle r="${f(r * 0.9)}" fill="none" stroke="${K.host}" stroke-width="1.5"/>`;
    return s;
  };
  // shock — boss 균열 충격 (0.52 s): full 3-stage enemy telegraph + crack glyph
  KIND.shock = (p, r, st, o) => {
    const g = Math.max(11, Math.min(22, r * 0.32)), t = o.p == null ? (st === 'preview' ? 0.42 : 0.86) : o.p;
    if (st === 'decay') return H.stain(r, 31, 0.5) + `<g opacity="0.6">${G.shatter(g, K.ink3, null)}</g>`;
    const glyph = st === 'active' ? G.shatter(g, K.host) : st === 'imminent' ? G.shatter(g, K.warn) : `<g opacity="0.75">${G.shatter(g * 0.9, K.warn)}</g>`;
    return H.tele(p, r, st === 'static' ? 'imminent' : st, t, glyph);
  };
  // generic enemy circle telegraph (impact / mortar / flame / null precursor) — no glyph
  KIND.tele = (p, r, st, o) => H.tele(p, r, st === 'static' ? 'imminent' : st, o.p == null ? (st === 'preview' ? 0.42 : 0.86) : o.p, '');
  // ALLY vortex (voidMine / blackSun): paper α0.25 + ink swirl + black sun with paper corona + cyan stitched rim. No hatch, no amber/coral, no violet.
  KIND.vortex = (p, r, st, o) => {
    let s = `<circle r="${r}" fill="${K.p100}" opacity="0.25"/><circle r="${r}" fill="url(#${p}ad)" opacity="0.5"/>`;
    for (let k = 0; k < 4; k++) { const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24, a = k * Math.PI / 2 + t * 3.4, rr = r * (0.92 - t * 0.7); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } s += E.ribbon(pts, 5.5, { taper: 'end', color: K.ink9, wobble: 0.1 }); }
    const sr = Math.max(8, r * 0.2);
    s += `<circle r="${f(sr + 3.2)}" fill="none" stroke="${K.p50}" stroke-width="2.4"/><circle r="${f(sr + 5.4)}" fill="none" stroke="${K.ink9}" stroke-width="1.4"/><circle r="${f(sr)}" fill="${K.ink9}"/>`;
    return s + H.stitch(circ(r), 2.2);
  };
  // ALLY warning (boneMortar landing / eclipseStep afterimage): paper α0.25 + cyan 20% halftone + cyan stitch drawn by a needle
  KIND.warning = (p, r, st, o) => {
    const t = o.p == null ? (st === 'preview' ? 0.6 : 1) : o.p;
    let s = `<circle r="${r}" fill="${K.p100}" opacity="0.25"/><circle r="${r}" fill="url(#${p}ad)" opacity="0.9"/>`;
    if (st === 'active') {
      const rnd = E.rng(3); s += `<circle r="${f(r * 0.96)}" fill="${K.p50}" opacity="0.35"/>`;
      for (let i = 0; i < 12; i++) { const a = i * 0.52 + rnd() * 0.3, d = r * (0.3 + rnd() * 0.55); s += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(2 + rnd() * 3.4)}" fill="${K.p50}" stroke="${K.ink9}" stroke-width="1.4"/>`; }
      s += G.star(Math.min(16, r * 0.24)) + H.stitch(circ(r), 2.4);
      return s;
    }
    s += `<circle r="${r}" fill="none" stroke="${K.allyD}" stroke-width="1" opacity="0.5"/>`;
    s += t >= 0.999 ? H.stitch(circ(r), 2.2) : H.stitch(H.arc(r, t), 2.2) + H.needleHead(r, t, 7);
    s += G.bone(Math.max(10, Math.min(18, r * 0.26)));
    return s;
  };
  // entry
  E.hazard = function (kind, stage = 'static', o = {}) {
    const p = E.uid(), r = o.r || 60, fn = KIND[kind] || KIND.tele;
    return H.wrap(p, fn(p, r, stage, o), kind + ' ' + stage);
  };
  E.hazard.kinds = ['water', 'slow', 'trap', 'fire', 'root', 'null', 'shock', 'vortex', 'warning'];
  E.hazard.owner = { water: 'neutral', slow: 'hostile', trap: 'hostile', fire: 'hostile', root: 'hostile', null: 'hostile', shock: 'hostile', vortex: 'player', warning: 'player' };
})(window.PN);
// ---- PN.env.boundary(ch, w, o): north arena edge strip. local x∈[0,w], edge (collision) line y=0, outside y<0 up to −o.h (default 74), inner lip to y=+14 ----
// Ch1 먹 번짐 담장 + 말려 올라간 종이 끝 · Ch2 철창 담장 · Ch3 깊은 먹물 수면(농묵으로) · Ch4 톱니 울타리 · Ch5 백지 공허(흰색이 끝)
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix;
  E.boundary = function (ch, w = 300, o = {}) {
    const c = E.CH[ch], X = E.ctx(ch, o.seed || 3), rnd = X.rnd, Hb = o.h || 74, p = X.p;
    X.defs.push(E.roughDef(p + 'rb', 3.2, 0.05, 5));
    let s = '';
    if (ch === 1) {
      // outermost: page edge rolled up toward the viewer (paper cylinder) → plaster wall top soaked by ink bleeding DOWN from the curl → wall front facing the arena
      const cy0 = -Hb + 2, cyl = 15;
      s += `<rect x="-2" y="${-Hb - 2}" width="${w + 4}" height="${cyl + 6}" fill="${K.p300}"/><rect x="-2" y="${f(cy0 + cyl * 0.55)}" width="${w + 4}" height="${f(cyl * 0.45)}" fill="${X.d40}"/>`;
      s += E.ribbon(E.qs(-2, cy0 + 4, w * 0.5, cy0 + 2.5, w + 2, cy0 + 4.5, 30), 2, { color: K.p50, taper: 'none', wobble: 0.2 });
      s += `<path d="M -2,${f(cy0 + cyl)} L ${w + 2},${f(cy0 + cyl)}" stroke="${K.ink9}" stroke-width="2.6"/>`;
      for (let x = 30 + rnd() * 40; x < w; x += 80 + rnd() * 60) s += `<path d="M ${f(x)},${f(cy0 + 2)} q 6,${f(cyl * 0.5)} 0,${f(cyl - 1)}" fill="none" stroke="${mix(K.p300, K.ink7, 0.5)}" stroke-width="1"/>`;
      const wt0 = cy0 + cyl, wt1 = -20;
      s += `<rect x="-2" y="${f(wt0)}" width="${w + 4}" height="${f(wt1 - wt0)}" fill="${c.light}"/>`;
      let bleed = '', feather = '';
      const edgePts = [[-4, wt0]]; for (let i = 0; i <= 26; i++) { const x = i * w / 26; edgePts.push([x, wt0 + 4 + Math.abs(Math.sin(i * 1.9)) * 9 + rnd() * 6]); } edgePts.push([w + 4, wt0]);
      bleed += `<path d="${E.P(edgePts)}" fill="${K.ink9}"/>`;
      feather += `<path d="${E.P(edgePts.map(([x, y], i) => [x, i && i < edgePts.length - 1 ? y + 3 + rnd() * 4 : y]))}" fill="${K.ink7}" opacity="0.45"/>`;
      for (let i = 0; i < 10; i++) { const x = rnd() * w; bleed += `<circle cx="${f(x)}" cy="${f(wt0 + 12 + rnd() * 7)}" r="${f(1.2 + rnd() * 2.2)}" fill="${K.ink9}"/>`; }
      s += `<g filter="url(#${p}rb)">${feather}${bleed}</g>`;
      s += `<path d="M -2,${wt1} L ${w + 2},${wt1}" stroke="${K.ink9}" stroke-width="2"/>`;
      let fr = `<rect x="-2" y="${wt1}" width="${w + 4}" height="${-wt1}" fill="${c.base}"/><rect x="-2" y="${wt1}" width="${w + 4}" height="${-wt1}" fill="${X.d20}"/>`;
      const pos = [[w * 0.14, 22, 'paper'], [w * 0.52, 16, 'pale'], [w * 0.83, 26, 'pale']];
      pos.forEach(([x, pw, tone], i) => { fr += E.poster(X, x + rnd() * 10, wt1 / 2 + 1, pw, -wt1 * 0.74, (rnd() - 0.5) * 0.25, { tone, dots: tone === 'spot' ? undefined : 'd20', layout: i === 0 ? 'portrait' : undefined }); }); // K5-G3: was '禁'
      for (let x = 60 + rnd() * 30; x < w; x += 120 + rnd() * 60) fr += E.crackWedge(x, wt1, -wt1, 4.4, rnd, 1);
      fr += `<path d="M ${f(w * 0.66)},${wt1} L ${f(w * 0.74)},${wt1} L ${f(w * 0.72)},0 L ${f(w * 0.63)},0 Z" fill="${K.ink9}"/>`;
      s += fr + `<path d="M -2,0 L ${w + 2},0" stroke="${K.ink9}" stroke-width="3.4"/><rect x="-2" y="1.5" width="${w + 4}" height="10" fill="${X.d40}"/>`;
    } else if (ch === 2) {
      // iron railing with continuous stone plinth; outside = chapel dark (60 % dots → solid ink)
      s += `<rect x="-2" y="${-Hb}" width="${w + 4}" height="${Hb - 12}" fill="${K.ink9}"/>`;
      s += PN.halftone ? PN.halftone(-2, -26, w + 2, -8, 5, (x, y) => Math.max(0, (-y - 8) / 18) * 2.3, K.ink9, 45) : '';
      const B = E.block(X, w / 2, -5, w + 8, 12, 9, { noShadow: true });
      s += B.s + X.clipped(E.P(B.front), `<rect x="-4" y="-7" width="${w + 8}" height="12" fill="${X.d20}"/>`);
      const yb = -11, hb = Hb - 22;
      s += `<path d="M -2,${yb - hb * 0.8} L ${w + 2},${yb - hb * 0.8} M -2,${yb - hb * 0.25} L ${w + 2},${yb - hb * 0.25}" stroke="${K.ink1}" stroke-width="4.6"/><path d="M -2,${yb - hb * 0.8} L ${w + 2},${yb - hb * 0.8} M -2,${yb - hb * 0.25} L ${w + 2},${yb - hb * 0.25}" stroke="${K.ink7}" stroke-width="2.6"/>`;
      for (let x = 6, i = 0; x < w; x += 12, i++) { const tip = yb - hb - (i % 3 ? 0 : 5); s += `<path d="M ${x},${yb} L ${x},${tip + 6}" stroke="${K.ink1}" stroke-width="4.4"/><path d="M ${x},${yb} L ${x},${tip + 6}" stroke="${K.ink7}" stroke-width="2.4"/><path d="M ${x - 3.6},${tip + 7} L ${x},${tip - 2} L ${x + 3.6},${tip + 7} Z" fill="${K.ink7}" stroke="${K.ink1}" stroke-width="1.2"/>`; }
      for (let x = 60; x < w; x += 150) s += `<rect x="${x - 5}" y="${yb - hb - 6}" width="10" height="${hb + 6}" fill="${K.ink7}" stroke="${K.ink1}" stroke-width="1.4"/><rect x="${x - 7}" y="${yb - hb - 11}" width="14" height="6" fill="${c.spot}" stroke="${K.ink9}" stroke-width="1.6"/>`;
      s += `<path d="M -2,0 L ${w + 2},0" stroke="${K.ink9}" stroke-width="3.2"/><rect x="-2" y="0" width="${w + 4}" height="10" fill="${X.d40}"/>`;
    } else if (ch === 3) {
      // canal lip (wet stone curb) then deep ink water darkening outward in halftone steps
      s += `<rect x="-2" y="${-Hb}" width="${w + 4}" height="${Hb}" fill="${mix(c.deep, K.ink7, 0.35)}"/>`;
      s += PN.halftone(-2, -Hb, w + 2, -6, 5, (x, y) => Math.min(2.6, Math.max(0, (-y - 8) / (Hb * 0.5)) * 2.6), K.ink9, 45);
      s += `<rect x="-2" y="${-Hb}" width="${w + 4}" height="${f(Hb * 0.3)}" fill="${K.ink9}"/>`;
      for (let k = 0; k < 5; k++) { const y = -12 - k * 11, x0 = rnd() * w * 0.5; s += E.ribbon(E.cr([[x0, y], [x0 + 40, y - 2], [x0 + 90, y + 1.5], [x0 + 150, y - 1]], false, 8), 1.6 - k * 0.18, { color: mix(c.light, K.ink3, 0.3 + k * 0.1), taper: 'mid', opacity: 0.8 - k * 0.12 }); }
      const B = E.block(X, w / 2, 3, w + 8, 10, 7, { noShadow: true });
      s += B.s + X.clipped(E.P(B.front), `<rect x="-4" y="-4" width="${w + 8}" height="12" fill="${X.d40}"/>`);
      for (let x = 30 + rnd() * 40; x < w; x += 90 + rnd() * 60) s += `<path d="M ${f(x)},-4 L ${f(x + 1)},${3}" stroke="${K.ink9}" stroke-width="1.4"/>`;
      s += `<path d="M -2,8 L ${w + 2},8" stroke="${K.ink9}" stroke-width="3"/>`;
    } else if (ch === 4) {
      // gear fence: half-buried standing gears overlapping, clock-hand pikes, black beyond
      s += `<rect x="-2" y="${-Hb}" width="${w + 4}" height="${Hb - 16}" fill="${K.ink9}"/>`;
      let x = -10, i = 0;
      while (x < w + 20) {
        const r = 22 + rnd() * 14, gy = -6, back = i % 2;
        const pts = E.gearPath(x, gy, r, Math.round(r / 3), 0.2, rnd());
        s += `<clipPath id="${p}g${i}"><rect x="${x - r - 10}" y="${gy - r - 10}" width="${2 * r + 20}" height="${r + 10}"/></clipPath><g clip-path="url(#${p}g${i})"><path d="${E.P(pts)}" fill="${back ? c.deep : c.base}" stroke="${K.ink9}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="${f(x)}" cy="${gy}" r="${f(r * 0.6)}" fill="${back ? K.ink9 : c.light}" stroke="${K.ink9}" stroke-width="2"/>${back ? '' : `<circle cx="${f(x)}" cy="${gy}" r="${f(r * 0.6)}" fill="${X.d20}"/><path d="M ${f(x + r * 0.2)},${gy - r} L ${f(x + r)},${gy - r} L ${f(x + r)},${gy} L ${f(x + r * 0.3)},${gy} Z" fill="${K.ink9}"/>`}<circle cx="${f(x)}" cy="${gy}" r="${f(r * 0.16)}" fill="${K.ink9}"/></g>`;
        if (i % 3 === 1) s += `<path d="M ${f(x + r * 0.8)},${gy} L ${f(x + r * 0.9)},${f(gy - r - 22)} L ${f(x + r * 0.9 + 4)},${f(gy - r - 30)} L ${f(x + r * 0.9 + 8)},${f(gy - r - 22)} L ${f(x + r)},${gy} Z" fill="${c.spot}" stroke="${K.ink9}" stroke-width="2"/>`;
        x += r * 1.45; i++;
      }
      s += `<path d="M -2,-6 L ${w + 2},-6" stroke="${K.ink9}" stroke-width="3.4"/><rect x="-2" y="-6" width="${w + 4}" height="14" fill="${X.d40}"/>`;
    } else {
      // white void: ground dissolves into paper — shrinking ground-tone dots, drifting slab shards, torn page edge; NO darkness here
      s += `<rect x="-2" y="${-Hb}" width="${w + 4}" height="${Hb + 2}" fill="${K.p100}"/>`;
      s += PN.halftone(-2, -Hb * 0.72, w + 2, 2, 5, (x, y) => Math.max(0, Math.min(2.5, 2.5 + y / (Hb * 0.26))), c.base, 45);
      for (let k = 0; k < 7; k++) { const x = rnd() * w, y = -10 - rnd() * Hb * 0.55, sz = 6 + rnd() * 12; s += `<path d="${E.P(E.torn(x, y, sz * 1.4, sz, rnd() * 3, rnd, 1.6))}" fill="${mix(c.base, c.light, 0.3)}" stroke="${mix(c.deep, K.ink9, 0.2)}" stroke-width="1"/>`; }
      const tear = Array.from({ length: 30 }, (_, i) => [i * w / 29, -2 + Math.sin(i * 1.7) * 3 + (rnd() - 0.5) * 5]);
      s += `<path d="${E.P([[-2, 16]].concat(tear).concat([[w + 2, 16]]))}" fill="${c.base}" opacity="0"/>` + E.ribbon(tear, 1.4, { color: mix(c.deep, K.ink9, 0.3), taper: 'none', wobble: 0.5 });
      s += `<rect x="-2" y="${-Hb}" width="${w + 4}" height="${f(Hb * 0.34)}" fill="${K.p50}"/>`;
    }
    X.defs.push(`<clipPath id="${p}bc"><rect x="0" y="${-Hb - 2}" width="${w}" height="${Hb + 20}"/></clipPath>`);
    return X.wrap(`<g clip-path="url(#${p}bc)">${s}</g>`, 'boundary ch' + ch);
  };
})(window.PN);
// ---- PN.env.landmark(ch, o): vignette of the chapter landmark, local box (0,0)-(o.w=280, o.h=150), own ground included ----
// Ch1 St3 찢어진 포스터 교차로 · Ch2 St7 잠긴 장미창 · Ch3 St3 분할 수문 · Ch4 St3 부러진 분침 다이얼 · Ch5 St7 갈라진 개기
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix;
  const LM = E.lm = {};
  E.landmarkInfo = {
    1: { stage: 'St3', name: '찢어진 포스터 교차로', note: '사거리 중앙 벽보 기둥 + 흩어진 벽보 원', alt: 'St7 잉크 봉쇄선' },
    2: { stage: 'St7', name: '잠긴 장미창', note: '바닥에 누운 거대 장미창을 쇠사슬이 봉인', alt: 'St3 리브 신랑' },
    3: { stage: 'St3', name: '분할 수문', note: '가로 수로를 끊는 수문 두 짝', alt: 'St7 범람 수문 분지' },
    4: { stage: 'St3', name: '부러진 분침 다이얼', note: '거대 문자판 광장 + 쓰러진 분침', alt: 'St7 톱니 납골당' },
    5: { stage: 'St7', name: '갈라진 개기', note: '반으로 갈라진 검은 원반 석판, 틈은 백지', alt: 'St3 반영의 고리' }
  };
  LM[1] = function (X, W, H, o) {
    const c = X.c, rnd = X.rnd, cx = W * 0.58, cy = H * 0.58;
    let s = E.ground(1, W, H, 11, { drainY: cy + 20, posters: [], puddle: [W * 0.84, H * 0.3, 12] });
    // vertical gutter (orthogonal crossroads)
    s += `<path d="M ${cx - 5},-4 L ${cx - 4},${H + 4} L ${cx + 5},${H + 4} L ${cx + 4},-4 Z" fill="${mix(c.base, c.deep, 0.42)}"/><path d="M ${cx - 5},-4 L ${cx - 4},${H + 4}" stroke="${mix(c.base, c.deep, 0.62)}" stroke-width="1.5"/>`;
    // ring of fallen posters (paper debris, inked)
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + rnd() * 0.3, d = 64 + rnd() * 26; s += E.poster(X, cx + Math.cos(a) * d * 1.25, cy + 14 + Math.sin(a) * d * 0.5, 14 + rnd() * 8, 10 + rnd() * 6, rnd() * 3, { tone: i % 4 === 0 ? 'spot' : i % 2 ? 'pale' : 'paper', amp: 1.2 }); }
    // poster column (광고탑) — squat & wide, stone capital slab (no lid), torn posters whose edges curl OFF the silhouette, paste drips
    const R = 29, Hc = 44, ry = R * 0.42, top = cy - Hc;
    s += X.shadow(E.ellPts(cx, cy, R + 4, ry + 2, 20), 24, 11);
    // plinth ring
    s += `<path d="${E.P(E.cylSil(cx, R + 5, ry + 2, cy - 4, cy + 1))}" fill="${c.light}"/>` + `<path d="${E.P(E.ellPts(cx, cy + 1, R + 5, ry + 2, 28, 0, Math.PI))}" fill="none" stroke="${K.ink9}" stroke-width="3"/>` + X.out(E.cylSil(cx, R + 5, ry + 2, cy - 4, cy + 1), 2.4, { dense: true, gaps: 1 });
    const body = `M ${cx - R},${top} L ${cx - R},${cy - 4} A ${R},${ry} 0 0 0 ${cx + R},${cy - 4} L ${cx + R},${top} Z`;
    let inner = `<rect x="${cx - R - 2}" y="${top - 2}" width="${2 * R + 4}" height="${Hc + ry + 4}" fill="${c.base}"/>`;
    const layouts = ['portrait', 'print', 'blank', 'print', 'portrait', 'blank', 'print']; // K5-G4: was 수배·禁·失·墨·尋 lettering
    let pst = ''; // K5: posters are collected first (same rng order) and stacked OVER the paste drips, so no pale drip splits a print block
    for (let k = 0; k < 9; k++) { const col = k % 3, row = Math.floor(k / 3), px = cx - R + 6 + col * (R * 0.6) + rnd() * 3, py = top + 6 + row * 13 + rnd() * 3; pst += E.poster(X, px + 5, py + 5, 17, 13, (rnd() - 0.5) * 0.3, { tone: k === 5 ? 'spot' : k % 2 ? 'pale' : 'paper', layout: layouts[k % 7] }); }
    // paste drips under the posters (dried glue, pale) + black-spot shadow side (right) + foot shadow band
    for (let k = 0; k < 5; k++) { const x = cx - R + 10 + k * 12 + rnd() * 3, y = top + 20 + (k % 2) * 12; inner += E.inkQ(x, y, x + 0.6, y + 5, x - 0.2, y + 9 + rnd() * 5, 2, { color: mix(K.p300, c.light, 0.3), taper: 'start', wobble: 0.2 }); }
    inner += pst;
    inner += `<path d="M ${cx + R * 0.36},${top - 4} C ${cx + R * 0.58},${top + Hc * 0.3} ${cx + R * 0.5},${top + Hc * 0.7} ${cx + R * 0.4},${cy + ry + 2} L ${cx + R + 2},${cy + ry + 2} L ${cx + R + 2},${top - 4} Z" fill="${K.ink9}"/>`;
    inner += `<path d="M ${cx - R},${cy - 10} A ${R},${ry} 0 0 0 ${cx + R},${cy - 10} L ${cx + R},${cy} L ${cx - R},${cy} Z" fill="${X.d40}"/>`;
    s += X.faceD(body, c.base, inner) + X.out(E.cylSil(cx, R, ry, top, cy - 4), 3, { dense: true, gaps: 1 });
    // curling poster edges lifted OFF the silhouette (left lit side + right shadow side)
    const curl = (x, y, dir, len) => `<path d="M ${f(x)},${f(y)} q ${f(dir * len * 0.7)},${f(-len * 0.2)} ${f(dir * len)},${f(len * 0.5)} q ${f(-dir * len * 0.35)},${f(-len * 0.05)} ${f(-dir * len * 0.62)},${f(len * 0.42)} Z" fill="${K.p300}" stroke="${K.ink9}" stroke-width="1.3" stroke-linejoin="round"/><path d="M ${f(x + dir * len * 0.2)},${f(y + len * 0.3)} q ${f(dir * len * 0.3)},${f(-len * 0.05)} ${f(dir * len * 0.5)},${f(len * 0.2)}" fill="none" stroke="${K.ink3}" stroke-width="0.8"/>`;
    s += curl(cx - R + 1, top + 8, -1, 11) + curl(cx - R + 1, top + 26, -1, 8) + curl(cx + R - 1, top + 16, 1, 10) + curl(cx + R - 1, top + 33, 1, 7);
    // stone capital: round overhanging slab (R+7, 6 px thick) seated ON the column top — flat moulded top plane with a spot-sepia notice
    const CR = R + 5, cry = ry + 2, ct = top - 4;
    s += `<path d="${E.P(E.ellPts(cx, top + 1, R, ry, 24, 0, Math.PI))}" fill="none" stroke="${K.ink9}" stroke-width="4" opacity="0.55"/>`;
    const capSil = E.cylSil(cx, CR, cry, ct, top + 1);
    s += `<path d="${E.P(capSil)}" fill="${c.base}"/>` + X.clipped(E.P(capSil), `<rect x="${cx - CR}" y="${ct}" width="${2 * CR}" height="${cry + 8}" fill="${X.d20}"/><path d="${E.P([[cx + CR * 0.4, ct], [cx + CR + 2, ct], [cx + CR + 2, top + cry + 4], [cx + CR * 0.3, top + cry + 4]])}" fill="${K.ink9}"/>`);
    const capTop = E.ellPts(cx, ct, CR, cry, 40);
    s += X.face(capTop, c.spot, `<path d="${E.P(E.ellPts(cx - 3, ct - 1, CR * 0.62, cry * 0.55, 20))}" fill="${mix(c.spot, c.light, 0.3)}"/>` + E.crackWedge(cx + 6, ct - cry + 2, cry * 1.3, 2.6, rnd, 1) + `<path d="${E.P(E.ellPts(cx, ct, CR - 4, cry - 2, 30))}" fill="none" stroke="${mix(c.deep, K.ink9, 0.2)}" stroke-width="1.5"/><path d="${E.P([[cx + CR * 0.3, ct - cry], [cx + CR, ct - cry], [cx + CR, ct + cry], [cx + CR * 0.5, ct + cry]])}" fill="${X.e20}"/>`, 0);
    s += E.ribbon(E.ellPts(cx, ct, CR - 1.5, cry - 1.2, 26, Math.PI * 1.08, Math.PI * 1.5), 1.4, { color: K.p100, taper: 'mid' });
    s += X.out(capSil, 2.8, { dense: true, gaps: 1 });
    s += E.rubble(X, cx + R * 0.5, cx + R + 18, cy + ry - 1, 4);
    return s;
  };
  LM[2] = function (X, W, H, o) {
    const c = X.c, rnd = X.rnd, cx = W * 0.6, cy = H * 0.46, R = Math.min(50, H * 0.34);
    let s = E.ground(2, W, H, 7, { center: [cx, cy], rose: null, wax: [[W * 0.1, H * 0.2], [W * 0.9, H * 0.85]] });
    // raised stone frame (3/4): thickness band below
    s += X.shadow(E.ellPts(cx, cy, R + 6, R + 6, 30), 12, 6);
    s += `<circle cx="${cx}" cy="${cy + 5}" r="${R + 6}" fill="${K.ink9}"/><circle cx="${cx}" cy="${cy}" r="${R + 6}" fill="${c.light}" stroke="${K.ink9}" stroke-width="2.6"/>`;
    const tones = [c.spot, c.light, mix(c.spot, c.light, 0.45), K.ink7, c.base, c.spot];
    let g = '';
    for (let i = 0; i < 12; i++) { const a0 = i * Math.PI / 6, a1 = a0 + Math.PI / 6; g += `<path d="M ${f(cx + Math.cos(a0) * R * 0.28)},${f(cy + Math.sin(a0) * R * 0.28)} L ${f(cx + Math.cos(a0) * R)},${f(cy + Math.sin(a0) * R)} A ${R},${R} 0 0 1 ${f(cx + Math.cos(a1) * R)},${f(cy + Math.sin(a1) * R)} L ${f(cx + Math.cos(a1) * R * 0.28)},${f(cy + Math.sin(a1) * R * 0.28)} Z" fill="${tones[i % 6]}"/>`; }
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + Math.PI / 12; g += `<path d="${E.crPath([[cx + Math.cos(a) * R * 0.3, cy + Math.sin(a) * R * 0.3], [cx + Math.cos(a - 0.2) * R * 0.62, cy + Math.sin(a - 0.2) * R * 0.62], [cx + Math.cos(a) * R * 0.74, cy + Math.sin(a) * R * 0.74], [cx + Math.cos(a + 0.2) * R * 0.62, cy + Math.sin(a + 0.2) * R * 0.62]], true, 4)}" fill="${i % 2 ? c.light : mix(c.light, c.base, 0.4)}" stroke="${K.ink9}" stroke-width="1.8"/>`; g += `<circle cx="${f(cx + Math.cos(a) * R * 0.86)}" cy="${f(cy + Math.sin(a) * R * 0.86)}" r="${f(R * 0.08)}" fill="${i % 2 ? c.spot : c.light}" stroke="${K.ink9}" stroke-width="1.5"/>`; }
    let lead = ''; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; lead += `M ${f(cx + Math.cos(a) * R * 0.28)},${f(cy + Math.sin(a) * R * 0.28)} L ${f(cx + Math.cos(a) * R)},${f(cy + Math.sin(a) * R)} `; }
    g += `<path d="${lead}" stroke="${K.ink9}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${f(R * 0.28)}" fill="${c.light}" stroke="${K.ink9}" stroke-width="2.4"/><circle cx="${cx}" cy="${cy}" r="${f(R * 0.14)}" fill="${c.spot}" stroke="${K.ink9}" stroke-width="1.6"/>`;
    g += `<path d="M ${cx + R * 0.1},${cy - R} L ${cx + R},${cy - R} L ${cx + R},${cy + R} L ${cx + R * 0.5},${cy + R} Z" fill="${X.d40}" opacity="0.8"/>`;
    g += E.crackWedge(cx - R * 0.5, cy - R * 0.72, R * 0.9, 3.4, rnd, 1);
    s += X.clipped(`M ${cx - R},${cy} a ${R},${R} 0 1 0 ${2 * R},0 a ${R},${R} 0 1 0 ${-2 * R},0`, g) + `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${K.ink9}" stroke-width="3"/>`;
    // sealing chains: a "+" (never an X), anchored with staples, big pewter padlock
    const chainLine = (x0, y0, x1, y1) => { let q = ''; const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 7.5), deg = Math.atan2(y1 - y0, x1 - x0) * 57.3; for (let k = 0; k <= n; k++) { const t = k / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 3; q += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${k % 2 ? 4.4 : 4.8}" ry="${k % 2 ? 1.5 : 2.8}" transform="rotate(${f(deg)} ${f(x)} ${f(y)})" fill="none" stroke="${K.ink9}" stroke-width="3"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${k % 2 ? 4.4 : 4.8}" ry="${k % 2 ? 1.5 : 2.8}" transform="rotate(${f(deg)} ${f(x)} ${f(y)})" fill="none" stroke="${c.light}" stroke-width="0.9"/>`; } return q; };
    s += chainLine(cx - R - 14, cy, cx + R + 14, cy) + chainLine(cx, cy - R - 12, cx, cy + R + 12);
    [[cx - R - 14, cy], [cx + R + 14, cy], [cx, cy - R - 12], [cx, cy + R + 12]].forEach(([x, y]) => { s += `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="${K.ink9}"/><rect x="${x - 2.5}" y="${y - 2.5}" width="2" height="2" fill="${K.ink5}"/>`; });
    s += `<path d="M ${cx - 6},${cy - 2} v -7 a 6,6 0 0 1 12,0 v 7" fill="none" stroke="${K.ink9}" stroke-width="3.4"/><rect x="${cx - 10}" y="${cy - 3}" width="20" height="17" rx="3" fill="${c.spot}" stroke="${K.ink9}" stroke-width="2.6"/><path d="M ${cx - 7},${cy} h 6" stroke="${mix(c.spot, K.p100, 0.6)}" stroke-width="1.2"/><circle cx="${cx}" cy="${cy + 5}" r="2.4" fill="${K.ink9}"/><path d="M ${cx},${cy + 6} v 4" stroke="${K.ink9}" stroke-width="1.8"/>`;
    return s;
  };
  // St3 분할 수문 — MASSIVE paired mitre (lock) gate cutting the horizontal canal. Two timber-and-iron leaves meet mid-channel in a V
  // pointing upstream (left): the north leaf shows its downstream face (shadow side = bold black Mignola wedge), the south leaf its
  // lit upstream face with ink drips. Walkway on the leaf tops = spot #56625C flat fill. Stone piers with gear-wheel housings, chains
  // to the leaves, balance beams over the banks. Upstream water piled higher (darker + 3 achromatic ripple rings); spill downstream.
  LM[3] = function (X, W, H, o) {
    const c = X.c, rnd = X.rnd, P = E.P, cy = 86, hh = 32, y0 = cy - hh, y1 = cy + hh, gx = W * 0.52, hs = 26, t = 11;
    let s = E.ground(3, W, H, 5, { canalY: cy, canalH: hh, highlight: false });
    const A = [gx - 20, cy], HN = [gx + 16, y0 + 1], HS = [gx + 16, y1 - 1];
    s += `<path d="${P([[-4, y0 + 2], [HN[0] - 4, y0 + 2], A, [HS[0] - 4, y1 - 2], [-4, y1 - 2]])}" fill="${mix(c.deep, K.ink5, 0.32)}" opacity="0.5"/>`;
    for (let k = 0; k < 3; k++) { const rx = 14 + k * 13; s += E.ribbon(E.ellPts(gx - 70, cy + 3, rx, rx * 0.34, 36, 0.3, Math.PI * 2 - 0.2), 1.7 - k * 0.35, { color: k % 2 ? K.ink3 : mix(c.light, K.p100, 0.35), taper: 'mid' }); }
    const up = (p2, h) => [p2[0], p2[1] - h];
    const leaf = (p2, q, lit) => {
      const L = Math.hypot(q[0] - p2[0], q[1] - p2[1]), ux = (q[0] - p2[0]) / L, uy = (q[1] - p2[1]) / L;
      let nx = -uy, ny = ux; if (ny < 0) { nx = -nx; ny = -ny; }
      const F = (pt, k) => [pt[0] + nx * t / 2 * k, pt[1] + ny * t / 2 * k];
      const pF = F(p2, 1), qF = F(q, 1), pB = F(p2, -1), qB = F(q, -1);
      const face = [pF, qF, up(qF, hs), up(pF, hs)], top = [up(pB, hs), up(qB, hs), up(qF, hs), up(pF, hs)];
      const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      let q2 = `<path d="${P(E.castPts([pF, qF, qB, pB], 16, 8))}" fill="url(#${X.p}${lit ? 'd40' : 'd60'})"/>`;
      let fi = `<rect x="${Math.min(pF[0], qF[0]) - 30}" y="${Math.min(pF[1], qF[1]) - hs - 20}" width="${Math.abs(qF[0] - pF[0]) + 60}" height="${hs + 60}" fill="${lit ? c.base : mix(c.base, c.deep, 0.5)}"/>`;
      for (let i = 1; i < 5; i++) { const b0 = lerp(pF, qF, i / 5); fi += `<path d="M ${f(b0[0])},${f(b0[1])} L ${f(b0[0])},${f(b0[1] - hs)}" stroke="${mix(c.deep, K.ink9, 0.35)}" stroke-width="1.5"/>`; }
      [0.25, 0.72].forEach((k) => { const a2 = up(pF, hs * k), b2 = up(qF, hs * k); fi += `<path d="M ${f(a2[0])},${f(a2[1])} L ${f(b2[0])},${f(b2[1])}" stroke="${K.ink9}" stroke-width="3.2"/>`; for (let i = 0; i < 4; i++) { const r2 = lerp(a2, b2, 0.12 + i * 0.25); fi += `<circle cx="${f(r2[0])}" cy="${f(r2[1])}" r="1.1" fill="${c.light}"/>`; } });
      if (lit) { fi += `<path d="${P([up(qF, hs * 0.55), up(qF, 0), [qF[0] + 4, qF[1] + 3], lerp(pF, qF, 0.55)])}" fill="${K.ink9}"/>`; for (let i = 0; i < 4; i++) { const d0 = up(lerp(pF, qF, 0.12 + i * 0.2), hs * 0.96); fi += E.dripStain(d0[0], d0[1], 6 + rnd() * 6, c, 2.1); } }
      else { const zz = []; for (let i = 0; i <= 6; i++) zz.push(up(lerp(pF, qF, i / 6), hs * (i % 2 ? 0.74 : 0.5))); fi += `<path d="${P(zz.concat([[qF[0] + 3, qF[1] + 3], [pF[0] - 3, pF[1] + 3]]))}" fill="${K.ink9}"/>`; for (let i = 0; i < 3; i++) { const d0 = up(lerp(pF, qF, 0.2 + i * 0.28), hs * 0.95); fi += E.dripStain(d0[0], d0[1], 4 + rnd() * 3, c, 1.8); } }
      q2 += X.face(face, c.base, fi, 0);
      q2 += X.face(top, c.spot, `<path d="${P([top[0], top[1], lerp(top[1], top[2], 0.35), lerp(top[0], top[3], 0.35)])}" fill="${mix(c.spot, c.light, 0.3)}"/>`, 0);
      q2 += X.out([top[0], top[1], up(qF, hs), qF, pF, up(pF, hs)], 2.8, { gaps: 1 });
      return q2;
    };
    const beam = (a2, b2) => { const n0 = [-(b2[1] - a2[1]), b2[0] - a2[0]], L = Math.hypot(n0[0], n0[1]), nx = n0[0] / L * 3.4, ny = n0[1] / L * 3.4; const pts = [[a2[0] - nx, a2[1] - ny], [b2[0] - nx, b2[1] - ny], [b2[0] + nx, b2[1] + ny + 3], [a2[0] + nx, a2[1] + ny + 3]]; return `<path d="${P(pts.map(([x, y]) => [x + 12, y + 18]))}" fill="url(#${X.p}d40)"/>` + X.face(pts, c.spot, `<path d="${P([[a2[0] + nx, a2[1] + ny], [b2[0] + nx, b2[1] + ny], [b2[0] + nx, b2[1] + ny + 3], [a2[0] + nx, a2[1] + ny + 3]])}" fill="${K.ink9}"/>`, 0) + X.out(pts, 2.2, { gaps: 0 }); };
    const pier = (ya, Hp) => {
      const B = E.block(X, gx + 22, ya, 38, 24, Hp, {});
      let q2 = B.s + X.clipped(E.P(B.front), `<path d="${P([[B.x1 - 14, B.yT1], [B.x1 + 2, B.yT1], [B.x1 + 2, B.yB + 2], [B.x1 - 20, B.yB + 2]])}" fill="${K.ink9}"/>` + X.line([[B.x0 + 2, B.yT1 + Hp * 0.5], [B.x1 - 14, B.yT1 + Hp * 0.5]], 1.5) + X.line([[B.x0 + 16, B.yT1 + 1], [B.x0 + 16.5, B.yT1 + Hp * 0.5]], 1.5)) + B.outline(2.8);
      const hx = gx + 16, hy = B.yT0 + 10, R = 10; // upright toothed wheel in an iron hood
      q2 += `<path d="${P(E.gearPath(hx, hy - R + 2, R, 12, 0.2, 0.2))}" fill="${K.ink9}"/><circle cx="${f(hx)}" cy="${f(hy - R + 2)}" r="${f(R * 0.64)}" fill="${c.deep}"/>`;
      for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; q2 += `<path d="M ${f(hx - Math.cos(a) * R * 0.6)},${f(hy - R + 2 - Math.sin(a) * R * 0.6)} L ${f(hx + Math.cos(a) * R * 0.6)},${f(hy - R + 2 + Math.sin(a) * R * 0.6)}" stroke="${K.ink9}" stroke-width="2"/>`; }
      q2 += `<circle cx="${f(hx)}" cy="${f(hy - R + 2)}" r="2.4" fill="${c.light}" stroke="${K.ink9}" stroke-width="1.4"/>`;
      q2 += `<path d="M ${f(hx + 2)},${f(hy + 3)} L ${f(hx + 2)},${f(hy - R)} A ${R + 3},${R + 3} 0 0 1 ${f(hx + R + 5)},${f(hy - 1)} L ${f(hx + R + 5)},${f(hy + 3)} Z" fill="${K.ink9}"/><path d="M ${f(hx + 4)},${f(hy - R + 1)} A ${R},${R} 0 0 1 ${f(hx + R + 2)},${f(hy - 2)}" fill="none" stroke="${K.ink5}" stroke-width="1.1"/>`;
      return { q: q2, hub: [hx, hy - R + 2] };
    };
    const pN = pier(y0 - 14, 16), pS = pier(y1 + 14, 16);
    const chain = (a2, b2, sag) => { let q2 = ''; const n = Math.round(Math.hypot(b2[0] - a2[0], b2[1] - a2[1]) / 5); for (let k = 0; k <= n; k++) { const t2 = k / n, x = a2[0] + (b2[0] - a2[0]) * t2, y = a2[1] + (b2[1] - a2[1]) * t2 + Math.sin(t2 * Math.PI) * sag; q2 += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${k % 2 ? 1.3 : 2.5}" ry="${k % 2 ? 2.5 : 1.5}" fill="none" stroke="${K.ink9}" stroke-width="1.7"/>`; } return q2; };
    s += pN.q + beam([HN[0] + 2, HN[1] - hs], [gx + 88, y0 - hs - 20]) + leaf(HN, A, false);
    for (let k = 0; k < 6; k++) { const yy = cy - 7 + k * 2.8, L = 34 + rnd() * 40; s += E.inkQ(A[0] + 12, yy, A[0] + 26 + L * 0.3, yy + (k - 2.5) * 1.4, A[0] + 28 + L, yy + (k - 2.5) * 3.2, 2.2, { color: K.p100, taper: 'end', opacity: 0.9 }); }
    s += leaf(A, HS, true) + chain(pN.hub, [gx - 2, cy - hs - 18], 5);
    s += pS.q + beam([HS[0] + 2, HS[1] - hs], [gx + 92, y1 - hs + 4]) + chain(pS.hub, [gx - 2, cy - hs + 14], -3);
    s += E.props[3].reeds(X, { w: 40 }).replace(/^/, `<g transform="translate(${W * 0.88},${y1 + 14})">`) + '</g>';
    return s;
  };
})(window.PN);
// ---- landmarks Ch4 · Ch5 + PN.env.landmark entry ----
(function (PN) {
  const E = PN.env, K = E.K, f = E.f, mix = E.mix, LM = E.lm;
  LM[4] = function (X, W, H, o) {
    const c = X.c, rnd = X.rnd, cx = W * 0.66, cy = H * 0.45, R = Math.min(H * 0.31, 46);
    let s = E.ground(4, W, H, 9, { center: [cx, cy], dialR: R, gears: [[W * 0.08, H * 0.2, 14, 8], [W * 0.92, H * 0.78, 12, 8]] });
    // raised dial rim ring (brass spot = flat top fill), numerals engraved by ground layer
    s += `<circle cx="${cx}" cy="${cy + 3}" r="${f(R + 16)}" fill="none" stroke="${K.ink9}" stroke-width="9"/><circle cx="${cx}" cy="${cy}" r="${f(R + 16)}" fill="none" stroke="${c.light}" stroke-width="7"/><circle cx="${cx}" cy="${cy}" r="${f(R + 19.5)}" fill="none" stroke="${K.ink9}" stroke-width="1.8"/><circle cx="${cx}" cy="${cy}" r="${f(R + 12.5)}" fill="none" stroke="${K.ink9}" stroke-width="1.4"/>`;
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += `<rect x="${f(cx + Math.cos(a) * (R + 16) - 2.5)}" y="${f(cy + Math.sin(a) * (R + 16) - 2.5)}" width="5" height="5" fill="${c.spot}" stroke="${K.ink9}" stroke-width="1.2" transform="rotate(${f(a * 57.3 + 45)} ${f(cx + Math.cos(a) * (R + 16))} ${f(cy + Math.sin(a) * (R + 16))})"/>`; }
    // centre boss + upright hour hand (short), fallen minute hand broken in two across the plaza
    const bx = cx, by = cy;
    const blade = (x0, y0, x1, y1, w0) => { const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux; const P = (t, w) => [x0 + ux * L * t + nx * w, y0 + uy * L * t + ny * w]; return [P(0, -w0), P(0.7, -w0 * 1.1), P(0.76, -w0 * 2.3), P(0.9, -w0), P(1, 0), P(0.9, w0), P(0.76, w0 * 2.3), P(0.7, w0 * 1.1), P(0, w0)]; };
    const mh = blade(bx + 18, by + 10, bx + R * 1.5, by + R * 0.62, 4.2);
    s += `<path d="${E.P(mh.map(([x, y]) => [x + 7, y + 5]))}" fill="url(#${X.p}d40)"/>`;
    s += `<path d="${E.P(mh)}" fill="${c.spot}"/>` + X.clipped(E.P(mh), `<path d="M ${bx},${by + 12} L ${bx + R * 2},${by + R * 0.72} L ${bx + R * 2},${by + R} L ${bx},${by + 40} Z" fill="${K.ink9}" opacity="0.9"/>`) + X.out(mh, 2.4, { r: 1 });
    // snapped stub at the pivot + debris chips
    s += `<path d="${E.P([[bx + 4, by + 1], [bx + 17, by + 7], [bx + 15, by + 12], [bx + 3, by + 6]])}" fill="${c.spot}" stroke="${K.ink9}" stroke-width="2" stroke-linejoin="round"/>`;
    for (let k = 0; k < 5; k++) { const x = bx + 20 + rnd() * 16, y = by + 12 + rnd() * 10; s += `<path d="M ${f(x)},${f(y)} l 3,-2 l 2,3 Z" fill="${c.spot}" stroke="${K.ink9}" stroke-width="1"/>`; }
    // hour hand upright (3/4 standing blade) + pivot
    const hh = blade(bx, by, bx - 10, by - 36, 3.4);
    s += `<path d="${E.P([[bx - 2, by], [bx + 2, by], [bx + 18, by + 8], [bx + 14, by + 10]])}" fill="url(#${X.p}d40)"/>`;
    s += `<path d="${E.P(hh)}" fill="${c.spot}"/>` + X.clipped(E.P(hh), `<path d="M ${bx - 1},${by} L ${bx - 12},${by - 40} L ${bx + 10},${by - 40} L ${bx + 10},${by} Z" fill="${K.ink9}"/>`) + X.out(hh, 2.2, { r: 1 });
    s += `<circle cx="${bx}" cy="${by}" r="7" fill="${K.ink9}"/><circle cx="${bx}" cy="${by}" r="3" fill="${c.light}"/><circle cx="${bx - 1}" cy="${by - 1}" r="1" fill="${K.p100}"/>`;
    return s;
  };
  LM[5] = function (X, W, H, o) {
    const c = X.c, rnd = X.rnd, cx = W * 0.6, cy = H * 0.45, R = Math.min(H * 0.35, 52), ob = c.spot, th = 7;
    let s = E.ground(5, W, H, 13, { center: [cx, cy], ringR: R + 26, gaps: [[W * 0.12, H * 0.2, 40, 6, 0.4]], sheens: [[W * 0.1, H * 0.8], [W * 0.86, H * 0.25]] });
    // corona rays engraved around the disc
    let rays = ''; for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, r0 = R + 8, r1 = R + (i % 2 ? 14 : 20); rays += `M ${f(cx + Math.cos(a) * r0)},${f(cy + Math.sin(a) * r0)} L ${f(cx + Math.cos(a) * r1)},${f(cy + Math.sin(a) * r1)} `; }
    s += E.engrave(rays, c, 1.4);
    // jagged split line across the disc
    const crack = []; for (let k = 0; k <= 10; k++) { const t = k / 10; crack.push([cx - R * 1.1 + t * R * 2.2 + (k % 2 ? 4 : -3), cy - R * 0.9 + t * R * 1.8 + (rnd() - 0.5) * 8]); }
    const disc = E.ellPts(cx, cy, R, R, 60);
    const side = (sgn) => { const nx = 0.63, ny = -0.78; return disc.filter(([x, y]) => ((x - cx) * nx + (y - cy) * ny) * sgn > -2); };
    s += X.shadow(E.ellPts(cx, cy, R, R, 24), 14, 8);
    // paper void seen through the gap (the manuscript beneath is blank)
    X.defs.push(`<clipPath id="${X.p}gap"><circle cx="${cx}" cy="${cy + 2}" r="${R + 5}"/></clipPath>`); s += `<path clip-path="url(#${X.p}gap)" d="${E.P(crack.map(([x, y]) => [x + 4.6, y - 5.6]).concat(crack.slice().reverse().map(([x, y]) => [x - 4.6, y + 5.6])))}" fill="${K.p50}"/>`;
    const half = (dx, dy, clipSide) => {
      const id = X.p + 'hf' + clipSide;
      const poly = clipSide > 0 ? crack.concat([[cx + R * 1.6, cy + R * 1.6], [cx + R * 1.6, cy - R * 1.6], [cx - R * 1.6, cy - R * 1.6]]) : crack.concat([[cx + R * 1.6, cy + R * 1.6], [cx - R * 1.6, cy + R * 1.6], [cx - R * 1.6, cy - R * 1.6]]);
      X.defs.push(`<clipPath id="${id}"><path d="${E.P(poly)}"/></clipPath><clipPath id="${id}d"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>`);
      let q = `<g transform="translate(${dx},${dy})"><g clip-path="url(#${id})"><circle cx="${cx}" cy="${cy + th}" r="${R}" fill="${K.ink9}"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="${ob}"/><g clip-path="url(#${id}d)">`;
      q += `<path d="M ${cx - R},${cy - R} L ${cx + R * 0.1},${cy - R} L ${cx - R * 0.5},${cy + R} L ${cx - R},${cy + R} Z" fill="${mix(ob, K.ink5, 0.5)}"/><path d="M ${cx + R * 0.35},${cy - R} L ${cx + R},${cy - R} L ${cx + R},${cy + R} L ${cx},${cy + R} Z" fill="${K.ink9}"/>`;
      q += `<circle cx="${cx}" cy="${cy}" r="${f(R * 0.62)}" fill="none" stroke="${K.ink3}" stroke-width="1.2" opacity="0.7"/></g>`;
      q += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${K.ink9}" stroke-width="3.2"/>` + E.ribbon(E.ellPts(cx, cy, R - 4, R - 4, 30, Math.PI * 1.02, Math.PI * 1.5), 4.2, { color: K.p300, taper: 'mid', wobble: 0 }) + E.ribbon(E.ellPts(cx, cy, R - 3.4, R - 3.4, 24, Math.PI * 1.12, Math.PI * 1.38), 1.4, { color: K.p50, taper: 'mid', wobble: 0 });
      return q + '</g></g>';
    };
    s += half(4.6, -5.6, 1) + half(-4.6, 5.6, -1);
    s += `<g clip-path="url(#${X.p}gap)">` + E.ribbon(crack.map(([x, y]) => [x + 4.6, y - 5.6]), 1.8, { taper: 'none' }) + E.ribbon(crack.map(([x, y]) => [x - 4.6, y + 5.6]), 2.6, { taper: 'none' }) + '</g>';
    for (let k = 0; k < 6; k++) { const t = 0.2 + rnd() * 0.6, q = crack[Math.floor(t * 10)]; s += `<path d="${E.P(E.torn(q[0] + (rnd() - 0.5) * 30, q[1] + 18 + rnd() * 20, 6, 4, rnd() * 3, rnd, 1))}" fill="${ob}" stroke="${K.ink9}" stroke-width="1.2"/>`; }
    return s;
  };
  E.landmark = function (ch, o = {}) {
    const W = o.w || 280, H = o.h || 150, X = E.ctx(ch, o.seed || 2);
    X.defs.push(`<clipPath id="${X.p}lm"><rect width="${W}" height="${H}"/></clipPath>`);
    return X.wrap(`<g clip-path="url(#${X.p}lm)">${LM[ch](X, W, H, o)}</g>`, 'landmark ch' + ch);
  };
})(window.PN);
