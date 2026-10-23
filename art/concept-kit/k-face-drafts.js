// k-face-drafts.js — B8 face & character redesign drafts → window.PN.faceDrafts (v0.3)
// Brief: docs/art/briefs/face-redesign.md (art-director, 2026-10-22; §6 main-session decision 2026-10-23: direction A).
// API: art/concept-kit/API-face-drafts.md. v0.2: direction A draws rev 2 (refined brush, planes, eyes, hair bundles,
// costume, expressions; 노을 · 령 drafts); { rev: 1 } and B · C keep the round-1 drawing.
// v0.3 (B8 review 2, docs/art/deliveries/B8-faces.md F1–F5): three different women, 결's open eye and clean near
// locks, 독's cheek and jaw, nose marks that touch, 령's fringe shadow with both eyes lit; faceBoard(); more measures.
// Three directions (A 3/4 30° · B front · C profile) × three people (결 · 독 · 월). Every feature is a point of ONE 3D
// head model projected with ONE turn angle (brief §3.2, appendix A); nothing is moved in 2D after projection.
// Load time builds only the PN.faceDrafts object. Other kit modules (PN._hk.hat34 · hatFront · scarfWrap · Ctx,
// PN.heroKit.full · POSES · portrait, PN.characters.portrait, PN.halftone) are read when a function is called.
// Nothing is added to PN._hk or any other namespace. ids: 'fd<N>_' per call (and 'hk<N>_' from PN._hk.Ctx).
window.PN = window.PN || {};
(function (PN) {
  'use strict';
  // ---- v1.0 tokens (the only colours of the drawings), the vignette tone, review-only construction colours ----
  const K = Object.freeze({ ink: '#121110', ink7: '#2B2926', p50: '#FAF6EC', paper: '#F3EEE2', p300: '#D8D0C0', ally: '#00A8C6', allyD: '#007C94', allyG: '#CFF6FF' });
  const VIG = '#BCB4A5';   // portrait background vignette only
  const DBG = Object.freeze({ mid: '#dd2233', lev: '#2a6fd6', term: '#1a9c4a' });   // construct: true only
  const DIRS = Object.freeze({ A: 30, B: 0, C: 90 });
  const WHO = Object.freeze(['gyeol', 'dok', 'wol']);
  const f = (n) => Math.round(n * 100) / 100;
  const P2 = (p) => f(p[0]) + ',' + f(p[1]);
  const Rd = Math.PI / 180;
  const lerp = (a, b, t) => a + (b - a) * t;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const fp = (d, fill, extra) => `<path d="${d}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
  const OLs = (w) => `stroke="${K.ink}" stroke-width="${f(w)}" stroke-linejoin="round" paint-order="stroke"`;
  let UID = 0;

  // per-call context: unique ids, clip paths; defs are written after the drawing is finished (appendix A note)
  function Ctx() {
    const id = 'fd' + (++UID) + '_', defs = [];
    let n = 0;
    return {
      id, defs,
      clip(d) { const cid = id + 'c' + (n++); defs.push(`<clipPath id="${cid}"><path d="${d}"/></clipPath>`); return `clip-path="url(#${cid})"`; },
      wrap(body, attrs) { return `<g${attrs ? ' ' + attrs : ''}>${defs.length ? `<defs>${defs.join('')}</defs>` : ''}${body}</g>`; }
    };
  }
  // Catmull-Rom → cubic Bézier (the same method as PN._hk.smooth, kept local so drawing needs no other module)
  function smooth(P, closed, k) {
    k = k == null ? 1 / 6 : k;
    const n = P.length, g = (i) => (closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
    let d = 'M ' + P2(P[0]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      d += ` C ${P2([p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k])} ${P2([p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k])} ${P2(p2)}`;
    }
    return d + (closed ? ' Z' : '');
  }
  const spl = (P, k) => {             // open Catmull-Rom sampling (appendix A)
    k = k || 6;
    const n = P.length, o = [], g = (i) => P[cl(i, 0, n - 1)];
    if (n < 2) return P.slice();
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < k; j++) {
      const t = j / k, a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2), t2 = t * t, t3 = t2 * t;
      o.push([0, 1].map((z) => 0.5 * (2 * b[z] + (c[z] - a[z]) * t + (2 * a[z] - 5 * b[z] + 4 * c[z] - d[z]) * t2 + (3 * b[z] - a[z] - 3 * c[z] + d[z]) * t3)));
    }
    o.push(P[n - 1]); return o;
  };
  const brush = (P, W) => {            // variable-width brush W(t), t = arc-length fraction (appendix A)
    const n = P.length, L = [], R = [], cum = [0];
    for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const tot = cum[n - 1] || 1;
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, h = Math.max(0.06, W(cum[i] / tot) / 2);
      L.push([P[i][0] - dy / l * h, P[i][1] + dx / l * h]); R.push([P[i][0] + dy / l * h, P[i][1] - dx / l * h]);
    }
    return 'M ' + L.concat(R.reverse()).map(P2).join(' L ') + ' Z';
  };
  const tw = (w, a, b, p) => (t) => w * Math.pow(cl(Math.min(t / a, (1 - t) / b), 0, 1), p == null ? 0.6 : p);
  const kf = (Q) => (y) => {           // 1D Catmull-Rom keyframes in y (appendix A)
    const n = Q.length; if (y <= Q[0][0]) return Q[0][1]; if (y >= Q[n - 1][0]) return Q[n - 1][1];
    let i = 0; while (y > Q[i + 1][0]) i++;
    const g = (j) => Q[cl(j, 0, n - 1)][1], t = (y - Q[i][0]) / (Q[i + 1][0] - Q[i][0]), a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2), t2 = t * t, t3 = t2 * t;
    return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
  };
  // camera: x = s·cosθ + d·sinθ, y unchanged; z = toward the viewer (visibility)
  const cam = (th) => { const c = Math.cos(th * Rd), s = Math.sin(th * Rd); return { th, c, s, p: (q) => [q[0] * c + q[2] * s, q[1]], z: (q) => -q[0] * s + q[2] * c }; };
  const inside = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };

  // ---- head model tables (appendix A). Head units u: s across (+ = the person's left = screen right at 0°),
  // y down (eye line 0), d forward (toward the nose); origin on the turning axis in the ear-hole plane ----
  const BASE = {
    S: [[-26, 22.5], [-15, 25.2], [-5, 27], [3, 27], [9, 26.2], [14, 24.8], [18, 22.8], [22, 19.9], [25.5, 16.4], [28.5, 12.4], [31, 7.4], [32.6, 1.5]],
    Ds: [[-26, 8], [-5, 6], [5, 5], [12, 4], [18, 3.5], [21, 6], [24, 11], [27, 16], [29.5, 19.8], [31.3, 22.6], [32.6, 24]],
    Df: [[-26, 31], [-18, 33], [-11, 34], [-6, 33.2], [-3, 32.6], [0, 30.6], [13, 30.6], [14.6, 32.4], [17, 33.2], [19.5, 32.2], [21.8, 32.5], [24.5, 30.6], [27.5, 31.4], [30, 29.8], [31.5, 27.6], [32.6, 24.5]],
    Pw: [[-26, 3.2], [-5, 3.6], [5, 3.6], [12, 3], [18, 2.6], [24, 2.4], [30, 2.2]]
  };
  // B8 refinement (main-session note 2): the lips and the chin point are narrow midline forms. The section keeps the
  // volume midline DV across its width and adds (Df − DV) only near the midline (u < 0.3), so the far contour of a
  // 30° turn is one smooth cheekbone → cheek → jaw line, while the 90° profile (u = 0) still shows Df exactly.
  const DV = [[-26, 31], [-18, 33], [-11, 34], [-6, 33.2], [-3, 32.6], [0, 30.6], [13, 30.6], [16.5, 31.3], [20.5, 31.5], [24.5, 31], [28, 30.3], [30.2, 29.4], [31.5, 27.6], [32.6, 24.5]];
  const U10 = [0, 0.15, 0.3, 0.45, 0.58, 0.7, 0.8, 0.88, 0.94, 1];
  const U51 = Array.from({ length: 51 }, (_, i) => i / 50);
  // people (brief §3.3 values; B8 changes in the API change log: eye opening, iris, brow shapes, crown height)
  const CH = {
    gyeol: { ws: 0.93, jw: 0.90, ky: 0.95, nose: 0.96, neck: 9.6, hair: 2.8, crown: -36.6,
      brow: { w: 2.3, y: 0.3, fall: 0.8, pts: [[6.4, -7.7, 32.7], [13.4, -8.4, 31.2], [19.2, -9.4, 24.6]] },
      mouth: { cw: 6.8, lip: 1, lift: -0.3 },
      eye: { si: 4.7, so: 16, yi: 0.7, yo: -0.8, hu: 2.7, hl: 1.9, ri: 2.8, lid: 2.3 } },
    dok: { ws: 1.04, jw: 1.10, ky: 1.03, nose: 1.18, neck: 11.6, hair: 2.0, crown: -35.6, lipFwd: 1.1,
      brow: { w: 3.6, y: 1.2, pts: [[6.4, -7.6, 32.7], [13.2, -9.6, 31.2], [19.6, -7.6, 24.6]] },
      mouth: { cw: 8.6, lip: 1.15, lift: 0.9 },
      eye: { si: 5.6, so: 15.6, yi: 0.6, yo: 0.3, hu: 2.1, hl: 1.4, ri: 2.8, lid: 3.0, smile: true } },
    wol: { ws: 0.94, jw: 0.88, ky: 0.92, nose: 0.80, neck: 8.2, hair: 3.8, crown: -37.6, softJaw: true,
      brow: { w: 1.5, y: -0.9 },
      mouth: { cw: 5.6, lip: 0.9, lift: 0.5, upper: true, lower: true },
      eye: { si: 4.3, so: 16.1, yi: 0.5, yo: -0.5, hu: 3.1, hl: 2.6, ri: 3.45, lid: 2.52, liner: true, lash: 2, crease: true, glint2: true } }
  };
  // rev 2 drafts (A only, AD request 2026-10-23): 노을 and 령, women under §2.2 (B2 §6.2 · §6.6 designs)
  // v0.3 (B8 review 2, F1): three different women — 노을 slimmer with cat eyes (outer corner +1.9, a 4 u wing), a long
  // high-peaked arch, a small tipped-up nose, a crisp upper-lip line; 령 narrow cold eyes (height/width 0.42, no double
  // lid, a single 2.4 u wing), straight low brows, a thin level mouth, a slightly more angular jaw
  Object.assign(CH, {
    noeul: { ws: 0.91, jw: 0.86, ky: 0.91, nose: 0.76, tipLift: 0.6, neck: 8, hair: 3, crown: -37.4, softJaw: true,
      brow: { w: 1.4, y: 0, arch: true, pts: [[6.2, -8.4, 32.7], [15.6, -11.9, 30.2], [20.6, -9.6, 23.4]] },
      mouth: { cw: 5.2, lip: 0.85, lift: 0.35, upper: true, lower: true, upperLine: 0.5 },
      eye: { si: 3.7, so: 17.3, yi: 0.6, yo: -1.4, hu: 3.2, hl: 3, ri: 4, lid: 2.4, liner: true, lash: 3, crease: true, glint2: true, dOut: 21.5, wing: [4, 2.6] } },
    ryeong: { ws: 0.93, jw: 0.92, ky: 0.94, nose: 0.84, neck: 8.4, hair: 2.6, crown: -37, softJaw: false,
      brow: { w: 1.8, y: 0, straight: true, pts: [[6.4, -7.2, 32.7], [13.6, -8.5, 31.2], [19.6, -8.8, 24.6]] },
      mouth: { cw: 5.8, lip: 0.85, lift: 0, upper: false, lower: true, thin: true },
      eye: { si: 3.8, so: 17.4, yi: 0.5, yo: -0.6, hu: 3.05, hl: 2.35, ri: 3.8, lid: 2.6, liner: true, lash: 0, crease: false, glint2: true, dOut: 21.3, wing: [2.4, 1] } }
  });
  const WHO2 = Object.freeze(['gyeol', 'dok', 'wol', 'noeul', 'ryeong']);
  // women: the jaw angle rounds off (side depth keyframes 12 … 27 only), so no turn of the near jaw is sharper than 150°
  const DS_SOFT = [[-26, 8], [-5, 6], [5, 5], [12, 4.6], [16, 5.2], [19.5, 7], [23, 10.6], [26.5, 15.2], [29.5, 19.8], [31.3, 22.6], [32.6, 24]];
  const BROW0 = [[6.6, -7.4, 32.7], [13.8, -10.1, 31.2], [19, -8.3, 24.6]];
  const HAIRLINE = {   // front-hair boundary (3D, s ≥ 0 side; the near side is −s), appendix A
    wol: [[0, -26.6, 31.8], [6.5, -25, 31], [13, -21, 28.8], [18, -14.8, 25.6], [21.6, -7.6, 22], [23.6, -0.6, 18], [25.6, 6, 12.4], [27.4, 10.4, 4.6], [29.2, 10.8, -2.6], [30.4, 9.6, -8.4]],
    gyeol: [[0, -24, 31.6], [7, -23, 31], [13, -20, 28.6], [18.6, -13, 24.6], [21.4, -4, 20], [22.4, 6, 15.6], [22.2, 17, 12.4], [23.6, 19, 8], [26, 8, -1], [26.6, -6, -5]],
    // 노을: centre parting, the side hair over the ears down to the braid; 령: pulled back above the ears (ears show)
    noeul: [[0, -26.4, 31.8], [6.5, -24.6, 31], [13, -20.6, 28.8], [18, -14.6, 25.6], [21.4, -7.4, 22], [23.4, -0.4, 18.2], [25.4, 6.4, 12.6], [27.2, 11.4, 4.6], [29, 12, -2.6], [30.2, 10.6, -8.4]],
    ryeong: [[0, -26.8, 31.8], [7, -25.6, 31], [13.4, -22, 28.6], [18.4, -16.4, 25.4], [21.6, -9.6, 21.8], [23.4, -4.2, 16.6], [24.6, -6.8, 9], [25.6, -10.6, 2], [26.4, -13, -6]]
  };
  const TERM = {   // terminator (3D): the paper-shadow plane lies to its right, clipped by the face (appendix A)
    A: [[13, -26, 28.5], [10.5, -14, 31.6], [8, -7, 32.6], [4.2, -2, 30.8], [4.6, 6, 31], [6, 12.5, 29.6], [8.6, 16.5, 28.6], [9.6, 21, 27.2], [8.6, 26, 27.6], [6.4, 30, 27.2], [3, 32.6, 24.6]],
    B: [[19, -26, 23], [19.5, -12, 26.5], [20.5, -3, 21], [21.8, 4, 20], [18.5, 11, 24], [15.5, 17, 24], [13, 23, 24], [9.5, 28.5, 25], [4, 32.6, 24]],
    C: [[-8, -6.4, 32.2], [-14, -5.6, 29], [-19, -3.8, 23], [-16.5, -3, 25.6], [-11.5, -4.2, 30]]
  };
  const BRIM = {   // 결's brim shadow, lower edge (3D); above it is ink, clipped by the face (appendix A; B is the band)
    A_light: [[-24, -16, 14], [-15, -13.6, 29], [-6, -12.6, 33.3], [1.5, -5, 32.6], [6.5, 2.6, 29.6], [12, 4, 28.2], [19, 5, 23], [24, 9, 15]],
    A_bible: [[24, -11, 16], [19, -9.6, 25], [8, -9.2, 33], [1.2, -4.4, 32.6], [-2.6, -0.8, 31.6], [-8, 3.6, 29.4], [-13, 4.6, 27.6], [-19, 5.6, 22.6], [-22.6, 11, 13], [-21, 16, 8]],
    C_bible: [[-6, -12, 34.5], [-8, -10.6, 33.4], [-10, -6.5, 31], [-12, 3.6, 28.4], [-17, 5, 24], [-22, 6, 16], [-24, 10, 8], [-24, 16, 2]],
    C_light: [[-6, -14, 34.5], [-9, -13, 33], [-14, -12.4, 29], [-20, -11, 22], [-24, -9, 12], [-25, -5, 4]]
  };

  function person(who) { const ch = CH[who]; if (!ch) throw new Error('faceDrafts: unknown person ' + who); return ch; }
  function camFor(dir) { if (!(dir in DIRS)) throw new Error('faceDrafts: unknown direction ' + dir); return cam(DIRS[dir]); }

  // model(who): face volume as rings of cross-sections. rings = the brief's 1.3-step / 10-sample review model;
  // dense = 0.65-step / 51-sample rings that the outline uses (main-session note 2: smoother far contour)
  function model(who, mo) {
    const ch = person(who), cheek = mo && mo.cheek;
    const S0 = kf(BASE.S), Ds = kf(ch.softJaw ? DS_SOFT : BASE.Ds), Df = kf(BASE.Df), Dv = kf(DV), Pw = kf(BASE.Pw);
    const Y = (y) => (y > 0 ? y * ch.ky : y);
    // rev 2 option: a cheek profile on the half-width (cheekbone forward, a soft hollow under it, the jaw angle), each
    // [centre y, width, share]; the far contour of a 30° turn then dips once under the cheekbone instead of a plank
    const ck = (y) => (cheek ? cheek.reduce((a, [c, w, h]) => a + h * Math.exp(-Math.pow((y - c) / w, 2)), 1) : 1);
    const W = (y) => ch.ws * (y <= 8 ? 1 : 1 + (ch.jw - 1) * Math.min(1, (y - 8) / 12)) * ck(y);
    // 독: a fuller upper lip / mustache line (midline detail only, y 14 … 24), so the profile lips meet the E-line rule
    const lipF = (yy) => (ch.lipFwd && yy > 14 && yy < 24 ? ch.lipFwd * Math.sin(Math.PI * (yy - 14) / 10) : 0);
    const section = (yy, U) => {
      const S = S0(yy) * W(yy), ds = Ds(yy), df = Df(yy) + lipF(yy), dv = Dv(yy), p = Pw(yy);
      return U.map((u) => [S * u, ds + (dv - ds) * (1 - Math.pow(u, p)) + (df - dv) * Math.pow(Math.max(0, 1 - u / 0.3), 2)]);
    };
    const rings = [], dense = [];
    for (let k = 0; k <= 45; k++) { const yy = Math.min(-26 + 1.3 * k, 32.6); rings.push([Y(yy), section(yy, U10)]); }
    for (let k = 0; k <= 90; k++) { const yy = -26 + 0.65 * k; dense.push([Y(yy), section(yy, U51)]); }
    dense.push([Y(32.6), section(32.6, U51)]);
    const n = ch.nose, tl = ch.tipLift || 0;   // 노을: the tip turned up 0.6 u (and the underside 0.36 u)
    const N = { root: [0, -3, 32.6], ridge: [0, Y(4), 33.4 + 2 * (n - 1)], tip: [0, Y(12 + 2 * (n - 1)) - tl, 32.4 + 5 * n], bot: [0, Y(13.6 + 2 * (n - 1)) - tl * 0.6, 31.6 + 4.2 * n],
      col: [0, Y(14.2 + 1.5 * (n - 1)), 31 + 3 * n], sub: [0, Y(14.6 + 1.2 * (n - 1)), 32.4], ala: [4.8 * n * ch.ws, Y(12.6 + 1.5 * (n - 1)), 29.4] };
    // the midline profile (u = 0) for construction lines and the profile chin
    const mid = (yy) => [0, Y(yy), Df(yy) + lipF(yy)];
    return { who, ch, rings, dense, N, Y, W, mid, lipF, params: { BASE, DV, CH: ch, HAIRLINE: HAIRLINE[who] || null } };
  }
  // binomial smoothing of a dense outline (x only; the samples are 0.65 u apart)
  function soften(L) {
    const o = L.map((p) => p.slice());
    for (let i = 2; i < L.length - 2; i++) o[i][0] = (L[i - 2][0] + 4 * L[i - 1][0] + 6 * L[i][0] + 4 * L[i + 1][0] + L[i + 2][0]) / 16;
    return o;
  }
  const atY = (L, y) => {
    for (let i = 0; i < L.length - 1; i++) if (y >= L[i][1] && y <= L[i + 1][1]) { const t = (y - L[i][1]) / ((L[i + 1][1] - L[i][1]) || 1); return L[i][0] + (L[i + 1][0] - L[i][0]) * t; }
    return y < L[0][1] ? L[0][0] : L[L.length - 1][0];
  };
  // outline: far contour = max x per section, near edge = min x; nose points join the far contour only where they
  // stand ≥ 0.4 u outside it (never at 30°). face = far (top → bottom) + near (bottom → top), closed, k 0.1
  function outline(C, M) {
    let far = [], near = [];
    for (const [y, P] of M.dense) {
      let mx = -1e9, mn = 1e9;
      for (const [s, d] of P) { const a = s * C.c, b = d * C.s; if (a + b > mx) mx = a + b; if (b - a < mn) mn = b - a; }
      far.push([mx, y]); near.push([mn, y]);
    }
    far = soften(far); near = soften(near);
    const N = M.N, nose = [N.root, N.ridge, N.tip, N.bot, N.col, N.sub].map(C.p);
    let last = -1;
    nose.forEach((p, i) => { if (p[0] > atY(far, p[1]) + 0.4) last = i; });
    let F = far;
    if (last >= 0) {
      // the profile nose: one spline from the root (so the bridge rises without a notch) to the last nose point that
      // stands outside the contour, joined to the contour above and below
      const ins = nose.slice(0, last + 1), y0 = ins[0][1], y1 = ins[last][1], line = spl(ins, 5);
      F = far.filter((p) => p[1] < y0 - 0.3).concat(line, far.filter((p) => p[1] > y1 + 0.3));
    }
    const face = F.concat(near.slice().reverse());
    return { F, N: near, raw: far, at: (y) => atY(F, y), atN: (y) => atY(near, y), poly: face, face: smooth(face, true, 0.1) };
  }
  // ---- features (appendix A geometry; B8 tuning per person noted inline) ----
  // eye geometry: lids are u ∈ [0, 1] curves (inner → outer), depth 27.7 → 29.7 (u 0.4) → 23.4. The iris centre is
  // (±11.3ws, −0.6, 29.3) projected; B turns the gaze 8° to the screen right about the eyeball centre (r 6)
  function eyeGeo(C, ch, side) {
    const E = ch.eye, ws = ch.ws, up = [], lo = [];
    const dAt = (u) => (u < 0.4 ? lerp(27.7, 29.7, Math.sin(u / 0.4 * Math.PI / 2)) : lerp(29.7, E.dOut || 23.4, Math.pow((u - 0.4) / 0.6, 1.5)));
    for (let i = 0; i <= 24; i++) {
      const u = i / 24, s = side * lerp(E.si, E.so, u) * ws, yb = lerp(E.yi, E.yo, u), d = dAt(u);
      up.push(C.p([s, yb - E.hu * Math.sin(Math.PI * Math.pow(u, 0.85)), d + 0.4]));
      lo.push(C.p([s, yb + E.hl * Math.sin(Math.PI * Math.pow(u, 1.2)), d]));
    }
    let i0 = 0;
    if (side < 0 && C.th > 50) { let mx = -1e9; up.forEach((p, i) => { if (p[0] > mx) { mx = p[0]; i0 = i; } }); }
    const far = side > 0 && C.th > 15, g = C.th < 15 ? 8 * Rd : 0, R = 6;
    const c0 = C.p([side * 11.3 * ws + R * Math.sin(g), -0.6, 29.3 - R * (1 - Math.cos(g))]);
    const ic = [c0[0] + (far ? 0.5 : 0), c0[1]];
    const rx = E.ri * Math.max(0.42, Math.cos(C.th * Rd)) * (far ? 0.82 : 1), ry = E.ri * 1.04;
    return { U2: up.slice(i0), L2: lo.slice(i0), up, lo, i0, ic, rx, ry, far };
  }
  // one eye. mode 'lit' (white, iris, lid shade, catch-lights, lid strokes) or 'shadow' (결 under the brim: a paper
  // lower-lid stroke and one glint). kind: 'open' | 'shut' (hurt) | 'smile' (victory crescent)
  function eye(ctx, C, ch, side, mode, kind) {
    const G = eyeGeo(C, ch, side), E = ch.eye, { U2, L2, ic, rx, ry, far } = G;
    if (mode === 'shadow') {
      const gl = [ic[0] + 0.2, ic[1] - 0.3];
      return fp(brush(spl(L2.slice(Math.floor(L2.length * (far ? 0.4 : 0.15))), 3), tw(far ? 0.9 : 1.2, 0.2, 0.2)), K.p50) +
        `<ellipse cx="${f(gl[0])}" cy="${f(gl[1])}" rx="${far ? 0.8 : 1.1}" ry="${far ? 1.1 : 1.45}" transform="rotate(-20 ${f(gl[0])} ${f(gl[1])})" fill="${K.p50}"/>`;
    }
    const UL = spl(U2, 3), lw = E.lid * (far ? 0.85 : 1);
    if (kind === 'shut') {   // squeezed shut: the upper lid pressed onto the lower lid line, a crease above
      const mid = U2.map((p, i) => [p[0], (p[1] + L2[i][1] * 2) / 3]);
      return fp(brush(spl(mid, 3), tw(lw * 1.1, 0.08, 0.1, 0.5)), K.ink) + fp(brush(spl(U2.slice(4, U2.length - 3).map((p) => [p[0], p[1] - 0.6]), 3), tw(0.8, 0.2, 0.2)), K.ink);
    }
    const white = smooth(U2.concat(L2.slice().reverse()), true, 0.12);
    let inner = `<ellipse cx="${f(ic[0])}" cy="${f(ic[1])}" rx="${f(rx)}" ry="${f(ry)}" fill="${K.ink}"/>`;
    // the iris catches a little light low on its far side (women: liveliness, §2.2), the lid casts a paper shade
    if (E.liner) inner += fp(brush(spl([[ic[0] - rx * 0.55, ic[1] + ry * 0.55], [ic[0], ic[1] + ry * 0.78], [ic[0] + rx * 0.55, ic[1] + ry * 0.55]], 4), tw(Math.max(0.5, rx * 0.22), 0.3, 0.3)), K.p300);
    inner += fp(brush(UL.map((p) => [p[0], p[1] + 0.9]), () => 1.5), K.p300);
    // the catch-light sits up-left of the iris centre but below the lid stroke, so the lid never swallows it
    inner += `<circle cx="${f(ic[0] - 0.32 * rx)}" cy="${f(ic[1] - 0.12 * ry)}" r="${f(0.3 * E.ri)}" fill="${K.p50}"/>`;
    if (E.glint2) inner += `<circle cx="${f(ic[0] + 0.36 * rx)}" cy="${f(ic[1] + 0.42 * ry)}" r="${f(0.12 * E.ri)}" fill="${K.p50}"/>`;
    let s = fp(white, K.p50) + `<g ${ctx.clip(white)}>${inner}</g>`;
    if (kind === 'smile') {   // the cheek pushes the lower lid up: skin over the lower eye, a thin new lid line
      const raised = L2.map((p, i) => [p[0], p[1] - (E.hl + 0.5) * Math.sin(Math.PI * i / (L2.length - 1))]);
      s += fp(smooth(L2.concat(raised.slice().reverse()), true, 0.1), K.paper) + fp(brush(spl(raised, 2), tw(0.8, 0.2, 0.2)), K.ink);
    }
    // upper lid: liner thickens outward (inner 0.5× → outer 1.15×, max 2.9 u); men: full in the middle
    const liner = (t) => (lw / 1.15) * (0.5 + 0.65 * t) * Math.pow(cl(Math.min(t / 0.06, (1 - t) / 0.04), 0, 1), 0.5);
    s += fp(brush(UL, E.liner ? liner : tw(lw, 0.06, 0.12, 0.5)), K.ink);
    if (E.lash) {   // wing past the outer corner, 3.2 u long, lifted 1.9 u, and one short lash
      const o = UL[UL.length - 1], o2 = UL[UL.length - 6], dx = o[0] - o2[0], dy = o[1] - o2[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
      s += fp(brush(spl([o, [o[0] + ux * 1.8, o[1] + uy * 1.8 - 0.6], [o[0] + ux * 3.2, o[1] + uy * 3.2 - 1.9]], 4), tw(1.7, 0.02, 0.95, 0.8)), K.ink);
      if (E.lash > 1) { const m = UL[Math.floor(UL.length * 0.8)]; s += fp(brush(spl([m, [m[0] + ux * 0.9, m[1] - 1.1], [m[0] + ux * 1.7, m[1] - 2.1]], 3), tw(0.85, 0.02, 0.95, 0.8)), K.ink); }
    }
    if (E.crease) s += fp(brush(spl(U2.slice(Math.floor(U2.length * 0.3), Math.floor(U2.length * 0.92)).map((p) => [p[0], p[1] - 1.8]), 3), tw(0.55, 0.3, 0.3)), K.ink);
    if (E.smile && kind !== 'smile') s += fp(brush(spl(L2.slice(Math.floor(L2.length * 0.2)).map((p) => [p[0], p[1] + 0.9]), 3), tw(0.6, 0.3, 0.2)), K.ink);
    return s + fp(brush(spl(L2.slice(Math.floor(L2.length * 0.45)), 3), tw(E.liner ? 0.95 : 0.7, 0.25, 0.12)), K.ink);
  }
  // brow: head (thick) → tail (0). Women: thin arch, peak at 60 %, 0.9 u higher; 결 straight with the tail lifted;
  // 독 thick, low, the tail easing down (kindly). The far brow at 3/4 is 0.85×
  function brow(C, ch, side, dy) {
    const B = ch.brow, ws = ch.ws, by = (B.y || 0) + (dy || 0), w = B.w * (side > 0 && C.th > 15 ? 0.85 : 1);
    const Q = (B.pts || BROW0).map(([s, y, d]) => C.p([side * s * ws, y + by, d]));
    const rise = B.pts ? 0.06 : 0.04, fall = B.fall || (B.pts ? 0.6 : 0.85);
    return fp(brush(spl(Q, 6), (t) => w * Math.pow(cl(Math.min(t / rise, (1 - t) / fall), 0, 1), 0.7)), K.ink);
  }
  // nose. B: right side plane + two alae commas + sub-nasal wedge; A: far side plane + short far line from y +6 + near
  // ala + wedge; C: the nose is the contour, inside only the ala '(' and the nostril shade. 월: smaller wedge, the
  // bridge plane starts at y +6 (§2.2); 결: the far plane runs from between the eyes (straight bridge, no ink line)
  function nose(C, ch, M, who) {
    const N = M.N, P = C.p, ws = ch.ws, Y = M.Y, tb = P(N.bot), sb = P(N.sub), fa = P(N.ala), na = P([-N.ala[0], N.ala[1], N.ala[2]]), tp = P(N.tip);
    const fem = who === 'wol', k = fem ? 0.62 : who === 'dok' ? 1.12 : 1;
    const wedge = (pts) => { const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length; return pts.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]); };
    let s = '';
    if (C.th < 15) {
      s += fp(smooth([P([1.2, Y(fem ? 6.5 : 4), 32.4]), P([3.2, Y(8), 32.2]), [fa[0] - 0.8, fa[1] - 1.4], [tb[0] + 1.6, tb[1] - 0.6], P([1.2, Y(9), 33.4])], true, 0.12), K.p300);
      s += fp(brush(spl([[na[0] + 0.6, na[1] - 1.4], [na[0] - 0.4, na[1] + 0.2], [na[0] + 1.6, na[1] + 1.2]], 4), tw(fem ? 0.65 : 0.75, 0.2, 0.2)), K.ink);
      s += fp(brush(spl([[fa[0] - 0.6, fa[1] - 1.4], [fa[0] + 0.4, fa[1] + 0.2], [fa[0] - 1.6, fa[1] + 1.2]], 4), tw(fem ? 0.8 : 0.95, 0.2, 0.2)), K.ink);
      const w = wedge([[tb[0] - 1.2, tb[1] + 0.3], [tb[0] + 0.4, tb[1] + 1.3], [fa[0] - 0.6, fa[1] + 1.2], [sb[0] + 2.4, sb[1] + 2]]);
      s += fp(`M ${P2(w[0])} Q ${P2(w[1])} ${P2(w[2])} L ${P2(w[3])} Z`, K.ink);
    } else if (C.th < 60) {
      const top = who === 'gyeol' ? P([0.9, -1.5, 33]) : P([0.9, Y(fem ? 6 : 3), 33.2]);
      s += fp(smooth([top, [tp[0] + 0.2, tp[1] - 1.2], [fa[0] + 0.2, fa[1] + 0.4], [fa[0] - 0.3, fa[1] - 1.8], P([3.4 * ws, Y(6), 31.6])], true, 0.1), K.p300);
      s += fp(brush(spl([P([3.4 * ws, Y(6.5), 31.6]), [fa[0] - 0.3, fa[1] - 1.8], [fa[0] + 0.3, fa[1] + 0.6]], 4), tw(fem ? 0.62 : 0.75, 0.35, 0.1, 0.7)), K.ink);
      s += fp(brush(spl([[na[0] + 1.4, na[1] - 2], [na[0] - 0.1, na[1] - 0.2], [na[0] + 1.4, na[1] + 1.2], [tb[0] - 1.2, tb[1] + 0.7]], 4), tw(fem ? 0.72 : 0.9, 0.15, 0.3)), K.ink);
      const w = wedge([[tb[0] - 1, tb[1] + 0.5], [tb[0] + 1.4, tb[1] + 1.4], [fa[0] + 0.8, fa[1] + 1.2], [sb[0] + 3, sb[1] + 2.4]]);
      s += fp(`M ${P2(w[0])} Q ${P2(w[1])} ${P2(w[2])} L ${P2(w[3])} Z`, K.ink);
    } else {
      s += fp(brush(spl([[na[0] + 1.6, na[1] - 2.6], [na[0] - 0.4, na[1] - 0.4], [na[0] + 0.6, na[1] + 1.3], [na[0] + 2.6, na[1] + 1.6]], 4), tw(fem ? 0.8 : 1, 0.15, 0.2)), K.ink);
      const w = wedge([[tb[0] - 2.6, tb[1] + 0.2], [tb[0] - 1.2, tb[1] + 1.3], [sb[0] + 0.2, sb[1] + 0.4]]);
      s += fp(`M ${P2(w[0])} Q ${P2(w[1])} ${P2(w[2])} Z`, K.ink);
    }
    return s;
  }
  // mouth: five points across the mouth arch; corners lifted by ch.mouth.lift. 월: cupid's-bow upper lip in paper
  // shade, lower lip a 2 u paper-shade band + 0.7 u ink stroke 3.2 u long under its middle (§2.2)
  function mouth(C, ch, M, kind) {
    const Mo = ch.mouth, ws = ch.ws, Y = M.Y, my = Y(19.5), P = C.p, cw = Mo.cw * ws, prof = C.th > 60, lift = Mo.lift || 0;
    if (kind === 'open') {   // hurt: an open ink mouth, the upper teeth a paper band
      let o = [[-cw * 0.85, my - 0.4, 28.4], [0, my - 0.9, 32.4], [cw * 0.85, my - 0.4, 28.4], [cw * 0.5, my + 3.6, 30.4], [0, my + 4.4, 31.4], [-cw * 0.5, my + 3.6, 30.4]].map(P);
      if (prof) o = [o[0], [o[1][0] - 0.6, o[1][1]], [o[4][0] - 0.8, o[4][1]], o[5]];
      return fp(smooth(o, true, 0.14), K.ink) + (prof ? '' : fp(brush(spl([[-cw * 0.6, my + 0.3, 30], [0, my, 32.2], [cw * 0.6, my + 0.3, 30]].map(P), 4), tw(1, 0.2, 0.2)), K.p50));
    }
    const sm1 = kind === 'smirk' ? 1.4 : 0, lf = M.lipF ? M.lipF(19.5) : 0;   // victory: only the near corner rises (결)
    let pts = [[-cw, my - 0.5 - lift - sm1, 27.6], [-cw * 0.5, my + 0.1, 31.3 + lf * 0.7], [0, my + 0.4, 32.3 + lf], [cw * 0.5, my + 0.1, 31.3 + lf * 0.7], [cw, my - 0.5 - lift, 27.6]].map(P);
    if (prof) pts = [pts[0], pts[1], [pts[2][0] - 0.8, pts[2][1]]];
    let s = '';
    if (Mo.upper && !prof) {
      const up = [[-cw * 0.75, my - 0.4, 30], [-1.6 * ws, my - 2.3, 32.6], [0, my - 1.6, 32.8], [1.6 * ws, my - 2.3, 32.6], [cw * 0.75, my - 0.4, 30]].map(P);
      s += fp(smooth(up.concat([pts[3], pts[2], pts[1]]), true, 0.15), K.p300);
    }
    s += fp(brush(spl(pts, 5), tw(Mo.lip * 1.5, 0.1, 0.1, 0.6)), K.ink);
    const lo = [[-3 * ws, Y(22.6), 30.8], [0, Y(23.1), 31.8], [3 * ws, Y(22.6), 30.8]].map(P); if (prof) lo.splice(0, 1);
    s += fp(brush(spl(lo, 4), tw(Mo.lower ? 2 : 1.4, 0.3, 0.3)), K.p300);
    if (Mo.lower) { const l2 = [[-1.6 * ws, Y(23.9), 31.2], [0, Y(24.1), 31.6], [1.6 * ws, Y(23.9), 31.2]].map(P); if (prof) l2.splice(0, 1); s += fp(brush(spl(l2, 3), tw(0.7, 0.3, 0.3)), K.ink); }
    return s;
  }
  // ear: paper with a 1.5 ink rim and one helix stroke; s grows behind the face (appendix A)
  function ear(C, ch, M, side) {
    const ws = ch.ws, P = C.p, Y = M.Y;
    const out = [[-6, 1.5], [-7.4, -1.4], [-6.6, -4.6], [-3.6, -6.9], [1, -7.3], [6, -6.4], [10, -4.7], [12.8, -2.6], [13.8, -0.6], [12.6, 1.4], [9.4, 2]].map(([y, d]) => P([side * (25.4 * ws + 3.5 * cl(-d / 7, 0, 1)), Y(y), d]));
    const inn = [[-3.4, -3.8], [0.5, -5.2], [5.5, -4.6], [9, -2.6]].map(([y, d]) => P([side * (25.5 * ws + 2.4 * cl(-d / 7, 0, 1)), Y(y), d]));
    return fp(smooth(out, true, 0.14), K.paper, `stroke="${K.ink}" stroke-width="1.5"`) + fp(brush(spl(inn, 4), tw(1.1, 0.2, 0.3)), K.ink);
  }
  // paper-shadow plane right of the terminator (A·B), the eye-socket piece in C
  function shadeQ(C, ch, M) {
    const P = C.p, Y = M.Y, ws = ch.ws;
    if (C.th >= 60) return { closed: true, Q: TERM.C.map(P) };
    return { closed: false, Q: TERM[C.th < 15 ? 'B' : 'A'].map(([s, y, d]) => P([s * ws, Y(y), d])) };
  }
  function shadePlane(C, ch, M) {
    const T = shadeQ(C, ch, M);
    if (T.closed) return fp(smooth(T.Q, true, 0.2), K.p300);
    const Q = T.Q, l = Q[Q.length - 1];
    return fp(smooth(Q, false, 0.12) + ` L ${P2([l[0] + 30, l[1] + 4])} L ${P2([Q[0][0] + 30, Q[0][1] - 4])} Z`, K.p300);
  }
  // 결's brim shadow: above the edge everything is ink (clipped by the face). B: a 0–2 u band under the brim only
  function brimShadow(C, ch, M, key, dy) {
    dy = dy || 0;
    if (key === 'B_band') {
      // the hatFront brim's lower edge (ellipse rx 112 · ry 19 about (0, −30.5) in these units) lowered by 1.6 u
      const e = []; for (let i = 0; i <= 24; i++) { const x = -40 + 80 * i / 24; e.push([x, -30.5 + 19 * Math.sqrt(Math.max(0, 1 - (x / 112) ** 2)) + 1.6 + dy]); }
      return fp('M -40,-70 L 40,-70 L ' + e.slice().reverse().map(P2).join(' L ') + ' Z', K.ink);
    }
    const Q = BRIM[key].map(([s, y, d]) => C.p([s * (key[0] === 'A' ? ch.ws : 1), M.Y(y) + dy, d])), a = Q[0], b = Q[Q.length - 1], sg = b[0] > a[0] ? 1 : -1;
    return fp(smooth(Q, false, 0.12) + ` L ${P2([b[0] + sg * 40, b[1]])} L ${P2([b[0] + sg * 40, -70])} L ${P2([a[0] - sg * 40, -70])} L ${P2([a[0] - sg * 40, a[1]])} Z`, K.ink);
  }
  // brush contour: far contour 1.3 → 2.6 (shadow side heavier) → chin → jaw 2.8 → 0.5 (B: the left side to 1.4)
  function contour(C, OL, M, k) {
    k = k || 1;
    const F = OL.F.filter((p) => p[1] >= -14), Nn = OL.N.filter((p) => p[1] >= (C.th < 15 ? -14 : M.Y(14))).reverse();
    const P = F.concat(Nn), nf = F.length / P.length;
    return fp(brush(P, (t) => k * (t < nf ? lerp(1.3, 2.6, Math.pow(t / nf, 0.8)) * Math.min(1, t / 0.03 + 0.3) : lerp(2.8, C.th < 15 ? 1.4 : 0.5, Math.pow((t - nf) / (1 - nf), 0.9)))), K.ink);
  }
  // ---- hair shell, neck, bust ----
  // B8: the cranium (hair shell) is an ellipsoid whose top is ch.crown, set from §2.1's eye-line ratio (0.53–0.56,
  // 독 0.51–0.52), and whose length is 24 + hair (appendix A: 34 + hair; the longer skull read as a helmet)
  function shell(ch) { const yc = -12; return { yc, b: yc - ch.crown, a: 25.5 * ch.ws + ch.hair, c: 24 + ch.hair, dc: -1 }; }
  const skullE = (C, H) => ({ x: H.dc * C.s, y: H.yc, rx: Math.hypot(H.a * C.c, H.c * C.s), ry: H.b });
  // a point on the shell at longitude φ (0 front, −90 the near side = the person's right), latitude λ (90 top)
  const shellPt = (H, phi, lam, lift) => { lift = lift || 0; const cp = Math.cos(phi * Rd), sp = Math.sin(phi * Rd), c2 = Math.cos(lam * Rd), s2 = Math.sin(lam * Rd); return [(H.a + lift) * c2 * sp, H.yc - (H.b + lift) * s2, H.dc + (H.c + lift) * c2 * cp]; };
  const facing = (C, H, q) => { const n = [q[0] / (H.a * H.a), (q[1] - H.yc) / (H.b * H.b), (q[2] - H.dc) / (H.c * H.c)], l = Math.hypot(n[0], n[1], n[2]) || 1; return (-n[0] * C.s + n[2] * C.c) / l; };
  // strands on the shell: stops [φ, λ]; only the part that faces the viewer is drawn, tapered at its own ends
  function strands(C, H, list, w, fill, lift) {
    let s = '';
    for (const st of list) {
      const W = st.w || w, dense = spl(st.p, 8), run = [];
      const flush = () => { if (run.length > 2) s += fp(brush(run.slice(), tw(W, 0.22, 0.32, 0.7)), fill); run.length = 0; };
      for (const [phi, lam] of dense) { const q = shellPt(H, phi, lam, lift == null ? 0.3 : lift); if (facing(C, H, q) > 0.12) run.push(C.p(q)); else flush(); }
      flush();
    }
    return s;
  }
  // hair silhouette: the projected shell ellipse, grown radially where the forehead of the face volume (projected
  // points above the brow) stands outside it, so the hair always covers the top of the face (B8: the shorter shell)
  function hull(E, pts) {
    const N = 180, R = new Array(N).fill(1);
    for (const p of pts) {
      const nx = (p[0] - E.x) / E.rx, ny = (p[1] - E.y) / E.ry, rr = Math.hypot(nx, ny) * 1.025;
      if (rr <= 1) continue;
      const k = Math.round(((Math.atan2(ny, nx) / (2 * Math.PI)) + 1) % 1 * N) % N;
      for (let j = -2; j <= 2; j++) { const i = (k + j + N) % N; R[i] = Math.max(R[i], rr); }
    }
    let S = R;
    for (let pass = 0; pass < 3; pass++) S = S.map((_, i) => { let a = 0; for (let j = -5; j <= 5; j++) a += Math.max(S[(i + j + N) % N], j === 0 ? S[i] : 0); return Math.max(S[i], a / 11); });
    const r = (a) => { const t = (((a / (2 * Math.PI)) % 1) + 1) % 1 * N, i = Math.floor(t) % N, u = t - Math.floor(t); return lerp(S[i], S[(i + 1) % N], u); };
    const pt = (a) => [E.x + E.rx * Math.cos(a) * r(a), E.y + E.ry * Math.sin(a) * r(a)];
    const ring = []; for (let i = 0; i < N; i += 2) ring.push(pt(i / N * 2 * Math.PI));
    return { r, pt, d: smooth(ring, true, 0.16) };
  }
  // front hair curtain (appendix A): hairline on both sides closed by the hair silhouette's arc; the far side stops
  // where it meets the face contour; in profile only the near side
  function curtain(C, ch, OL, line, E, HU) {
    const P = C.p, ws = ch.ws, ang = (p) => Math.atan2((p[1] - E.y) / E.ry, (p[0] - E.x) / E.rx) / Rd;
    const near = line.map(([s, y, d]) => P([-s * ws, y, d])), fa = line.map(([s, y, d]) => P([s * ws, y, d]));
    let far = fa;
    if (C.th > 15) { let cut = fa.length - 1; for (let i = 1; i < fa.length; i++) if (fa[i][0] >= OL.at(fa[i][1]) - 0.6) { cut = i; break; } far = fa.slice(0, cut + 1); }
    if (C.th > 60) far = [near[0]];
    let an = ((ang(near[near.length - 1]) % 360) + 360) % 360, af = ((ang(far[far.length - 1]) % 360) + 360) % 360;
    if (an < 90) an += 360; if (af < an) af += 360; if (af - an > 300) af -= 360;
    const arc = []; for (let i = 0; i <= 36; i++) { const a = (an + (af - an) * i / 36) * Rd; arc.push(HU ? HU.pt(a) : [E.x + E.rx * Math.cos(a), E.y + E.ry * Math.sin(a)]); }
    return { d: smooth(far.slice().reverse().concat(near.slice(1)), false, 0.14) + ' L ' + arc.map(P2).join(' L ') + ' Z', near, far };
  }
  // neck: lofted cross-sections (wide under the skull between the mastoids, slim in the middle, flaring into the
  // trapezius), projected with the head's camera; edges L (near) and R (far)
  function neckGeo(C, ch, yBot) {
    const n = ch.neck, ws = ch.ws;
    const T = [[6, 19.5 * ws, 15, -5], [16, n * 1.42, n * 1.34, -2], [26, n, n * 1.2, -0.5], [36, n * 1.05, n * 1.22, -1], [yBot, n * 1.55, n * 1.45, -2.5]];
    const hw = kf(T.map((r) => [r[0], r[1]])), hd = kf(T.map((r) => [r[0], r[2]])), dc = kf(T.map((r) => [r[0], r[3]]));
    const L = [], R = [];
    for (let y = 6; y <= yBot + 0.01; y += 2) { const x = dc(y) * C.s, h = Math.hypot(hw(y) * C.c, hd(y) * C.s); L.push([x - h, y]); R.push([x + h, y]); }
    return { d: smooth(L.concat(R.slice().reverse()), true, 0.12), L, R };
  }
  function neck(ctx, C, ch, M, OL, yBot) {
    const G = neckGeo(C, ch, yBot), clip = ctx.clip(G.d);
    // shadow side plane (right) and the jaw's cast-shadow band: jawline (near y ≥ Y(12), far y ≥ Y(22)) moved (+1, +2.6)
    const shade = G.R.map((p, i) => [lerp(G.L[i][0], p[0], 0.62), p[1]]);
    const jaw = OL.N.filter((p) => p[1] >= M.Y(12)).concat(OL.F.filter((p) => p[1] >= M.Y(22)).reverse()).map((p) => [p[0] + 1, p[1] + 2.6]);
    // the band is thin on the lit near side and full (6.5) under the chin and the far jaw, where the light can't reach
    const bw = (t) => lerp(1.2, 6.5, Math.pow(t, 0.7)) * Math.min(1, (1 - t) / 0.04 + 0.2);
    return fp(G.d, K.paper, OLs(2.4)) + `<g ${clip}>` + fp(smooth(shade.concat(G.R.map((p) => [p[0] + 4, p[1]]).reverse()), true, 0.12), K.p300) + fp(brush(jaw, bw), K.ink) + '</g>';
  }
  // bust: torso cross-sections widening from the neck base (y0) to the shoulders (y1), body camera Cb (A 30°, B 30°,
  // C 90°). Returns the silhouette and a front-surface point function for the collar
  function bustGeo(Cb, ch, o) {
    const n = ch.neck, y0 = 37, y1 = 54, dB = -2, k = o.slope;
    const w = (y) => (y <= y0 ? n * 1.25 : y >= y1 ? o.Ws : n * 1.25 + (o.Ws - n * 1.25) * Math.pow((y - y0) / (y1 - y0), k));
    const dd = (y) => (y <= y0 ? n * 1.3 : y >= y1 ? o.Dt : n * 1.3 + (o.Dt - n * 1.3) * Math.pow((y - y0) / (y1 - y0), 0.5));
    const xc = dB * Cb.s, L = [], R = [];
    for (let y = y0; y <= 110; y += (y < y1 ? 1 : 8)) { const h = Math.hypot(w(y) * Cb.c, dd(y) * Cb.s); L.push([xc - h, y]); R.push([xc + h, y]); }
    const front = (s, y) => { const ww = w(y), d = dB + dd(y) * Math.sqrt(Math.max(0, 1 - (s / ww) * (s / ww))); return [s, y, d]; };
    return { L, R, w, dd, front, d: smooth(L.concat(R.slice().reverse()), true, 0.1) };
  }
  // cyan cloth (signature sandwich: ink edge · ally · allyD underside · allyG core) along projected points
  function ribbon(P, w0, w1, o) {
    o = o || {};
    const n = P.length, W = P.map((_, i) => w0 + (w1 - w0) * i / (n - 1)), L = [], R = [], D = [], SE = [], G = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, h = W[i] / 2, sg = nx + ny > 0 ? 1 : -1;
      L.push([P[i][0] + nx * h, P[i][1] + ny * h]); R.push([P[i][0] - nx * h, P[i][1] - ny * h]);
      D.push([P[i][0] + sg * nx * h * 0.4, P[i][1] + sg * ny * h * 0.4]); SE.push([P[i][0] + sg * nx * h * 0.92, P[i][1] + sg * ny * h * 0.92]);
      G.push([P[i][0] - sg * nx * h * 0.3, P[i][1] - sg * ny * h * 0.3]);
    }
    const e = P[n - 1], q = P[n - 2], ul = Math.hypot(e[0] - q[0], e[1] - q[1]) || 1, ux = (e[0] - q[0]) / ul, uy = (e[1] - q[1]) / ul, we = W[n - 1] / 2;
    const tip = o.end === 'fork' ? [[L[n - 1][0] + ux * we * 1.3, L[n - 1][1] + uy * we * 1.3], [e[0] + ux * we * 0.15, e[1] + uy * we * 0.15], [R[n - 1][0] + ux * we, R[n - 1][1] + uy * we]] : [];
    const body = smooth(L.concat(tip, R.slice().reverse()), true, 0.1);
    return fp(body, K.ally, OLs(o.edge || 2)) + fp(smooth(D.concat(SE.slice().reverse()), true, 0.1), K.allyD) + fp(brush(G.slice(0, Math.max(2, n - 1)), tw(o.glow || 1.1, 0.2, 0.3)), K.allyG);
  }
  // ---- people: hair, props, costume (B2 §6 designs, brief §2.1–2.3, §3.3–3.4) ----
  const proj = (C, L) => L.map(C.p);
  // a tapered ink lock / stray hair along projected 3D points
  const lock = (C, L, w, fill, a, b) => fp(brush(spl(proj(C, L), 6), tw(w, a == null ? 0.12 : a, b == null ? 0.55 : b, 0.75)), fill || K.ink);
  const HAIR = {
    wol: {
      // 댕기: two cyan ribbons from under the bun, down behind the near ear (A), behind both shoulders (B), the back (C)
      behind(C) {
        const R1 = [[-3, -26, -26], [-9, -8, -26.5], [-13, 12, -24], [-15, 30, -20.5], [-16, 48, -16]];
        const R2 = [[3, -26, -24], [9, -8, -23.5], [13, 12, -20.5], [15, 30, -17], [16, 48, -13]];
        const Z = (L) => L.reduce((a, q) => a + C.z(q), 0) / L.length;
        return [R1, R2].sort((a, b) => Z(a) - Z(b)).map((R) => ribbon(spl(proj(C, R), 5), 5.2, 4.2, { end: 'fork' })).join('');
      },
      // the bun on the upper back of the skull (centre 0.55 r outside the shell along its normal), its paper sheen arc
      // and coil line; the long pin through it (ornament on the end that shows in all three directions)
      bun: [0, -33.6, -24],
      back(C) {
        const b = C.p(this.bun), r = 8.6, a = C.p([-16, -36, -17]), e = C.p([18, -30.5, -33]);
        const arc = (r0, a0, a1) => { const P = []; for (let i = 0; i <= 12; i++) { const t = (a0 + (a1 - a0) * i / 12) * Rd; P.push([b[0] + r0 * Math.cos(t), b[1] + r0 * Math.sin(t)]); } return P; };
        let s = `<circle cx="${f(b[0])}" cy="${f(b[1])}" r="${r}" fill="${K.ink}"/>`;
        s += fp(brush(arc(r * 0.64, 196, 262), tw(2.1, 0.25, 0.35)), K.p50) + fp(brush(arc(r * 0.34, 300, 470), tw(0.7, 0.2, 0.3)), K.p50);
        const ux = e[0] - a[0], uy = e[1] - a[1], l = Math.hypot(ux, uy) || 1, nx = -uy / l * 0.85, ny = ux / l * 0.85;
        s += fp(`M ${P2([a[0] + nx, a[1] + ny])} L ${P2([e[0] + nx * 0.6, e[1] + ny * 0.6])} L ${P2([e[0] - nx * 0.6, e[1] - ny * 0.6])} L ${P2([a[0] - nx, a[1] - ny])} Z`, K.p50, OLs(1.3));
        // the pin head: a small paper teardrop with a crescent cut (the eclipse motif), outlined
        const h = [a[0] - ux / l * 2.2, a[1] - uy / l * 2.2];
        s += `<ellipse cx="${f(h[0])}" cy="${f(h[1])}" rx="2.6" ry="1.9" transform="rotate(${f(Math.atan2(uy, ux) / Rd)} ${f(h[0])} ${f(h[1])})" fill="${K.p50}" ${OLs(1.3)}/>` +
          `<circle cx="${f(h[0] - 0.7)}" cy="${f(h[1] - 0.3)}" r="1.1" fill="${K.ink}"/>`;
        return s;
      },
      // shell strands: a ring of short paper sheen strokes across the lit (near, upper) curve, each stroke along the
      // hair's sweep toward the bun, and two long fine flow lines
      strands(C, H) {
        const sheen = [{ p: [[-14, 60], [-45, 56], [-80, 51], [-100, 48]], w: 2.3 }, { p: [[-42, 49], [-72, 45], [-104, 41], [-128, 39]], w: 1.9 }, { p: [[-28, 40], [-52, 36], [-74, 34]], w: 1.8 }];
        const fine = [{ p: [[-5, 62], [-45, 52], [-95, 43], [-150, 38]] }, { p: [[-26, 28], [-62, 21], [-110, 22], [-155, 30]] }, { p: [[5, 62], [45, 52], [95, 43]] }];
        return strands(C, H, fine, 0.55, K.p50, 0.35) + strands(C, H, sheen, 2, K.p50, 0.5);
      },
      // a thin paper line where the skull passes in front of the bun, so the two ink masses read apart
      sep(C, E) {
        const b = C.p(this.bun), r = 8.6, P = [];
        for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2, p = [E.x + E.rx * Math.cos(a), E.y + E.ry * Math.sin(a)]; P.push(Math.hypot(p[0] - b[0], p[1] - b[1]) < r - 0.4 ? p : null); }
        const runs = []; let cur = [];
        P.concat(P).forEach((p) => { if (p) cur.push(p); else { if (cur.length > 2) runs.push(cur); cur = []; } });
        const best = runs.sort((x, y) => y.length - x.length)[0];
        return best ? fp(brush(best.slice(0, 121), tw(1.1, 0.25, 0.25)), K.p50) : '';
      },
      // in front: the sideburn lock (B: both sides) — two strands from the temple hair, S-curved, its tip crossing the
      // face edge — and two stray baby hairs at the temple
      front(C, ch, M) {
        const ws = ch.ws, Y = M.Y;
        const L1 = [[-21.4 * ws, -5, 21.4], [-22.6 * ws, Y(3.5), 16.6], [-21.4 * ws, Y(10.5), 14.8], [-22.4 * ws, Y(15.5), 12.8], [-24.4 * ws, Y(19.5), 10.4]];
        const L2 = [[-21.8 * ws, -4, 20.6], [-23.4 * ws, Y(4), 15.4], [-22.6 * ws, Y(10), 13.6], [-24 * ws, Y(14), 11.2]];
        const st = [[[-12.6 * ws, -21.6, 29.2], [-14.4 * ws, -19.4, 29.2], [-15.6 * ws, -17.4, 28.4], [-15.4 * ws, -15.6, 28.2]], [[-18.4 * ws, -14.4, 25.8], [-20 * ws, -11.6, 24.8], [-19.4 * ws, -9.4, 24.4]]];
        const sides = C.th < 15 ? [1, -1] : [1];
        let s = '';
        for (const sg of sides) {
          const m = (Q) => Q.map(([a, b, c]) => [a * sg, b, c]);
          s += lock(C, m(L1), 2.1, K.ink, 0.3, 0.5) + lock(C, m(L2), 0.8, K.ink, 0.2, 0.45);
          s += st.map((Q) => lock(C, m(Q), 0.5, K.ink, 0.2, 0.4)).join('');
        }
        return s;
      }
    },
    gyeol: {
      // the low tied hair at the nape, hanging down the back, with a paper tie crossing it
      behind(C) {
        const T = [[0, -4, -29], [0, 6, -32.5], [-1.5, 20, -33.5], [-2.5, 34, -31], [-3.5, 50, -27]];
        const P = spl(proj(C, T), 5), W = P.map((_, i) => 9 - 5 * i / (P.length - 1));
        let L = [], R = [];
        P.forEach((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; L.push([p[0] - dy / l * W[i] / 2, p[1] + dx / l * W[i] / 2]); R.push([p[0] + dy / l * W[i] / 2, p[1] - dx / l * W[i] / 2]); });
        const tip = P[P.length - 1];
        let s = fp(smooth(L.concat([[tip[0], tip[1] + 5]], R.reverse()), true, 0.1), K.ink);
        s += fp(brush(P.slice(3, P.length - 3).map((p) => [p[0] - 1.6, p[1]]), tw(1.4, 0.3, 0.3)), K.p50);
        const t0 = C.p([0, 4, -32.2]);
        s += fp(brush([[t0[0] - 6, t0[1] - 1.2], [t0[0] + 6, t0[1] + 1.2]], () => 2.6), K.p50, OLs(1.1));
        return s;
      },
      strands(C, H) {
        return strands(C, H, [{ p: [[-20, 40], [-70, 30], [-120, 22], [-170, 16]], w: 2.1 }, { p: [[-40, 20], [-90, 12], [-140, 8]], w: 1.8 }], 2, K.p50, 0.4);
      },
      // front locks: two paper sheen strokes down the near locks and one loose lock over the near cheek edge
      front(C, ch, M) {
        const ws = ch.ws, Y = M.Y, sides = C.th < 15 ? [1, -1] : [1];
        let s = '';
        for (const sg of sides) {
          const m = (Q) => Q.map(([a, b, c]) => [a * sg * ws, b, c]);
          // sheen only on the lit (screen-left) locks; one loose lock crossing the cheek edge on each visible side
          if (sg > 0) s += lock(C, m([[-18.6, -12, 25], [-21, -1, 21], [-21.6, 9, 16.6], [-21.2, Y(15), 13.8]]), 1.9, K.p50, 0.3, 0.5) + lock(C, m([[-15, -16, 27.6], [-18, -6, 24.4], [-19.6, 3, 20.6]]), 1.8, K.p50, 0.3, 0.5);
          s += lock(C, m([[-19.6, -4, 21.6], [-20.8, 8, 17.8], [-19.8, Y(17), 15.2], [-17.8, Y(21.5), 14.6]]), 1.7, K.ink, 0.1, 0.6);
        }
        return s;
      }
    },
    dok: {
      // the 지게 pole tips behind the back (C), the towel's knot ends at the near back (sticking out at A and B)
      behind(C) {
        if (C.th < 60) return '';
        const pole = (Q) => fp(brush(proj(C, Q), () => 4.2), K.ink);
        return pole([[-10, 70, -30], [-10, 12, -33], [-10, -14, -34]]) + pole([[10, 70, -37], [10, 16, -40], [10, -6, -41]]) +
          fp(brush(proj(C, [[0, 20, -31], [0, 23, -44]]), () => 3.2), K.ink);
      },
      // the towel knot on the near side just behind the temple; its two ends hang down behind the ear and stick out of
      // the head's silhouette (in front of the hair at A·C, behind the head at B)
      knot(C) {
        const k = C.p([-25.7, -19.5, -10.5]), e1 = C.p([-28.5, -6, -8]), e2 = C.p([-30, -11, -15]);
        const end = (e, w) => { const ux = e[0] - k[0], uy = e[1] - k[1], l = Math.hypot(ux, uy) || 1, nx = -uy / l, ny = ux / l; return fp(`M ${P2([k[0] + nx * w * 0.6, k[1] + ny * w * 0.6])} L ${P2([e[0] + nx * w * 0.5, e[1] + ny * w * 0.5])} L ${P2([e[0] - nx * w * 0.5 + ux / l * 1.6, e[1] - ny * w * 0.5 + uy / l * 1.6])} L ${P2([k[0] - nx * w * 0.6, k[1] - ny * w * 0.6])} Z`, K.paper, OLs(2)); };
        return end(e2, 5.6) + end(e1, 6.2) + `<ellipse cx="${f(k[0])}" cy="${f(k[1])}" rx="4.2" ry="5" fill="${K.paper}" ${OLs(2)}/>` + fp(brush([[k[0] - 1.6, k[1] - 2.6], [k[0] + 0.4, k[1]], [k[0] - 1, k[1] + 2.8]], tw(0.8, 0.3, 0.3)), K.ink);
      },
      back(C) { return C.th < 15 ? this.knot(C) : ''; },
      strands(C, H) {
        // short cropped hair above the towel: a ring of short paper strokes on the lit crown, brushed up and back
        return strands(C, H, [{ p: [[-26, 50], [-44, 62], [-66, 74]], w: 2.1 }, { p: [[-70, 46], [-88, 58], [-108, 70]], w: 1.8 }], 1.9, K.p50, 0.3);
      },
      // sideburns in front of the ear, below the towel (B: both)
      front(C, ch) {
        const ws = ch.ws, sides = C.th < 15 ? [1, -1] : [1];
        let s = '';
        for (const sg of sides) {
          const Q = [[-25.4, -15, 7.6], [-25.8, -6, 7], [-25.4, 3.6, 7.8], [-24.6, 4.4, 10.6], [-24.4, -4, 11], [-24.2, -14, 11.6]].map(([a, b, c]) => C.p([a * sg * ws, b, c]));
          s += fp(smooth(Q, true, 0.18), K.ink);
        }
        return s;
      },
      // the towel band (brief §3.3): visible where −s·sinθ + d·cosθ > −2; paper, folds, paper shade on the right
      towel(C, ch) {
        const lo = [], up = [];
        for (let ps = -180; ps <= 180; ps += 3) {
          const a = ps * Rd, s0 = 27.04 * Math.sin(a), d0 = 34 * Math.cos(a), q1 = [s0, -14.6 - 2.2 * Math.cos(a), d0], q2 = [s0 * 0.96, -25.2 - 1.6 * Math.cos(a), d0 * 0.96];
          if (C.z(q1) > -2) { lo.push(C.p(q1)); up.push(C.p(q2)); }
        }
        if (lo.length < 3) return '';
        lo.sort((p, q) => p[0] - q[0]); up.sort((p, q) => p[0] - q[0]);
        const band = smooth(lo.concat(up.slice().reverse()), true, 0.05);
        const mid = (t) => lo.map((p, i) => [p[0], lerp(p[1], up[i][1], t)]);
        const xR = lo[lo.length - 1][0], xL = lo[0][0];
        return fp(band, K.paper, OLs(2.4)) + fp(smooth(lo.filter((p) => p[0] > lerp(xL, xR, 0.62)).concat(up.filter((p) => p[0] > lerp(xL, xR, 0.62)).reverse()), true, 0.05), K.p300) +
          fp(brush(mid(0.42).slice(2, -2), tw(0.8, 0.2, 0.2)), K.ink) + fp(brush(mid(0.72).slice(4, -6), tw(0.6, 0.3, 0.3)), K.ink);
      }
    }
  };
  // bust costume: shoulders (paper, far shoulder in paper shade), the back collar behind the neck, and the front collar
  // (ink 깃 with the paper 동정) crossing wearer's-left over right
  const BODY = { gyeol: { Ws: 44, Dt: 17, slope: 0.42 }, dok: { Ws: 52, Dt: 21, slope: 0.33 }, wol: { Ws: 37, Dt: 14.5, slope: 0.62 }, noeul: { Ws: 37, Dt: 14.5, slope: 0.62 }, ryeong: { Ws: 39, Dt: 15, slope: 0.55 } };
  function bustParts(ctx, Cb, ch, who) {
    const o = BODY[who], G = bustGeo(Cb, ch, o), n = ch.neck, P = (q) => Cb.p(q);
    const xs = G.R.map((p) => p[0]), xL = Math.min(...G.L.map((p) => p[0])), xR = Math.max(...xs);
    let s = fp(G.d, K.paper, OLs(2.6)) + `<g ${ctx.clip(G.d)}>` + fp(`M ${P2([lerp(xL, xR, 0.7), 30])} C ${P2([lerp(xL, xR, 0.78), 46])} ${P2([lerp(xL, xR, 0.74), 70])} ${P2([lerp(xL, xR, 0.7), 120])} L ${P2([xR + 10, 120])} L ${P2([xR + 10, 30])} Z`, K.p300) + '</g>';
    const on = (L, lift) => L.map(([sx, y]) => { const q = G.front(sx, y); return P([q[0], q[1], q[2] + (lift || 0)]); });
    const back = [[-n * 1.15, 36.6], [-n * 0.6, 33.6], [0, 33], [n * 0.6, 33.6], [n * 1.15, 36.6]].map(([sx, y]) => P([sx, y, -2 - n * 1.25 * Math.sqrt(Math.max(0, 1 - (sx / (n * 1.25)) ** 2))]));
    const inner = on([[-n * 1.0, 35], [-n * 0.35, 40.5], [n * 0.45, 47], [n * 1.3, 55], [n * 2.2, 66]], 0.3);
    const outer = on([[n * 1.0, 35], [n * 0.35, 40.5], [-n * 0.45, 47], [-n * 1.3, 55], [-n * 2.2, 66]], 0.8);
    const wC = who === 'dok' ? 7 : who === 'wol' ? 5.6 : 6.4;
    const band = (L, w) => fp(brush(spl(L, 4), tw(w, 0.02, 0.02, 0.3)), K.ink);
    const collarIn = (L, w) => fp(brush(spl(L, 4).map((p) => [p[0], p[1] - w * 0.18]), tw(w * 0.36, 0.04, 0.04, 0.3)), K.p50);
    const backC = band(back, wC * 0.9);
    let vee = '';
    if (who === 'gyeol') vee = fp(smooth([inner[0], outer[0], outer[2], inner[2]], true, 0.1), K.ink7);
    const front = vee + band(inner, wC) + collarIn(inner, wC) + band(outer, wC) + collarIn(outer, wC);
    return { body: s, backC, front, G };
  }
  // ======================================================================================================
  // REV 2 (2026-10-23, brief §6: direction A chosen; refine the drawing, keep the one-angle 3D structure).
  // Brush grammar, form planes, eyes, hair bundles, costume detail, six expressions. A only; rev 1 stays for review.
  // ======================================================================================================
  // rev 2 parameter overrides (rev 1 keeps CH as delivered): 결 a lighter upper lid so the calm eye isn't swallowed;
  // 독 the outer corners drooping (kindly)
  // 월 (AD check 1): eye width 0.25 of the front face width (13.6 × 0.94 = 12.8 u); a wider eye wraps further round the
  // eyeball, so its outer corner sits deeper (dOut 21.3), which keeps the far eye 2.6 u inside the far contour at 30°.
  // 결 (AD check 5): one soft dip under the cheekbone on the 3D half-width
  // v0.3 (B8 review 2): 결 F2 — the near eye opened (hu 3.1, hl 2.0), its outer corner lifted 2.2 into a sharp tail, a
  // lid shade ≤ 0.9 u, the lash lines lifted off the eye (lidOff · loOff: the iris shows 77 % between the inks); 독 F3 —
  // the near cheek fuller at y 4…10 and a turned jaw angle; 령 F1 — a slightly angular jaw; 월 F1 — a soft drooping eye (outer
  // corner 0.3 below the inner) with only the liner's wing lifted, a rounder taller eye (0.55), round arch brows, a fuller
  // lower lip
  const REV2 = {
    gyeol: { eye: { lid: 2, hu: 3.1, hl: 2, yo: -1.5, lidShade: 0.9, lidOff: 0.8, loOff: 0.5 }, cheek: [[3, 4.5, 0.02], [12.5, 4.5, -0.05], [21, 3.5, 0.012]] },
    dok: { eye: { yi: 0.3, yo: 1.3, hu: 2.5, lid: 2.4 }, brow: { w: 3.3, y: 0.9, pts: [[6.4, -8.2, 32.7], [13.2, -9.7, 31.2], [19.6, -7.4, 24.6]] }, cheek: [[7, 3.4, 0.06], [19, 2.4, 0.024]] },
    wol: { eye: { si: 3.8, so: 17.4, yi: 0.1, yo: 0.4, hu: 3.9, hl: 3.2, ri: 3.96, dOut: 21.3, wing: [3.2, 1.9], lash: 3 },
      brow: { w: 1.5, y: 0, arch: true, pts: [[6.4, -8.4, 32.7], [12.8, -11.2, 31.6], [19.2, -9.4, 24.6]] },
      mouth: { cw: 5.6, lip: 0.9, lift: 0.5, upper: true, lower: true, lowerW: 2.4 } },
    // 령 F1: a slightly angular jaw (a shallow hollow under the cheekbone, the jaw angle held out) — sharpest turn 152…158°
    ryeong: { cheek: [[12.5, 4.5, -0.04], [21, 3.5, 0.022]] }
  };
  const ch2 = (who) => { const b = CH[who], o = REV2[who] || {}; return Object.assign({}, b, o, { eye: Object.assign({}, b.eye, o.eye || {}) }); };
  const LD = [0.656, 0.755];   // unit vector pointing away from the key light (down-right)
  const sstep = (x) => { const t = cl(x, 0, 1); return t * t * (3 - 2 * t); };
  const atX = (L, x) => {      // y of a polyline at x (first segment that spans x), null outside
    for (let i = 0; i < L.length - 1; i++) { const a = L[i], b = L[i + 1]; if ((x - a[0]) * (x - b[0]) <= 0 && a[0] !== b[0]) return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); }
    return null;
  };
  // brush stroke along a dense polyline. o: { w, a (entry share), b (exit share), wf(t) width factor, light (0…1: the
  // side facing away from the key light swells, the lit side thins), out (±1: outside = left normal) or center (outside
  // = away from it), curve (pressure where the stroke turns), dry / dry0 (exit / entry share split by paper slits) }
  function ink(P, o) {
    o = o || {};
    const n = P.length;
    if (n < 2) return '';
    const cum = [0]; for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const tot = cum[n - 1] || 1, w = o.w == null ? 1 : o.w, a = o.a == null ? 0.12 : o.a, b = o.b == null ? 0.25 : o.b, lt = o.light || 0;
    const L = [], R = [], H = [], N = [];
    for (let i = 0; i < n; i++) {
      const p = P[Math.max(0, i - 1)], q = P[Math.min(n - 1, i + 1)], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, t = cum[i] / tot;
      let k = Math.pow(sstep(t / a), 0.5) * Math.pow(sstep((1 - t) / b), 0.7);
      if (o.wf) k *= o.wf(t);
      if (lt) {
        let side = o.out || 1;
        if (o.center) side = ((P[i][0] - o.center[0]) * nx + (P[i][1] - o.center[1]) * ny) >= 0 ? 1 : -1;
        k *= lerp(1 - 0.42 * lt, 1 + 0.42 * lt, ((nx * LD[0] + ny * LD[1]) * side + 1) / 2);
      }
      if (o.curve && i > 0 && i < n - 1) {
        const u1 = [P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]], u2 = [P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]], l1 = Math.hypot(u1[0], u1[1]) || 1, l2 = Math.hypot(u2[0], u2[1]) || 1;
        k *= 1 + o.curve * Math.min(1, Math.acos(cl((u1[0] * u2[0] + u1[1] * u2[1]) / (l1 * l2), -1, 1)) / ((l1 + l2) / 2) * 1.6);
      }
      const h = Math.max(0.04, w * k / 2);
      H.push(h); N.push([nx, ny]);
      L.push([P[i][0] + nx * h, P[i][1] + ny * h]); R.push([P[i][0] - nx * h, P[i][1] - ny * h]);
    }
    let s = fp('M ' + L.concat(R.slice().reverse()).map(P2).join(' L ') + ' Z', o.fill || K.ink);
    // dry brush: two thin paper slits run inside the stroke's thinning end (or start), fading in and out
    const slits = (i0, i1) => {
      [[0.24, 0.2, 0], [-0.3, 0.13, 1]].forEach(([off, ww, j]) => {
        const Q = [], Wd = [];
        for (let i = i0 + j; i < i1; i++) { Q.push([P[i][0] + N[i][0] * H[i] * off * 2, P[i][1] + N[i][1] * H[i] * off * 2]); Wd.push(H[i] * 2 * ww); }
        if (Q.length > 3) s += fp(brush(Q, (t) => Wd[Math.min(Wd.length - 1, Math.round(t * (Wd.length - 1)))] * Math.pow(sstep(t / 0.3), 0.6) * Math.pow(sstep((1 - t) / 0.3), 0.6)), o.dryFill || K.p50);
      });
    };
    if (o.dry) { const i0 = cum.findIndex((c) => c / tot >= 1 - o.dry); if (i0 > 0) slits(i0, n - 1); }
    if (o.dry0) { const i1 = cum.findIndex((c) => c / tot >= o.dry0); if (i1 > 3) slits(1, i1); }
    return s;
  }
  const inkC = (C3, P3, o, k) => ink(spl(P3.map(C3.p), k || 6), o);   // brush through projected 3D control points
  const loop3 = (C3, L3, fill) => fp(smooth(L3.map(C3.p), true, 0.16), fill);   // closed plane from 3D points
  // face contour: one stroke entering dry at the temple, heavy on the shadow side (far cheek, under the chin), thinning
  // up the lit near jaw; pressure where it turns at the chin
  function contour2(C, OL, M, k) {
    const F = OL.F.filter((p) => p[1] >= -15), Nn = OL.N.filter((p) => p[1] >= M.Y(13)).reverse();
    const P = F.concat(Nn), c0 = [lerp(OL.atN(8), OL.at(8), 0.5), 6];
    return ink(P, { w: 2.25 * (k || 1), a: 0.07, b: 0.32, light: 1, center: c0, curve: 0.45, dry0: 0.09 });
  }
  // form planes inside the face (clipped by it). Shade (paper shadow): the far plane up to a reflected-light band along
  // the far contour, the eye sockets, the nose's cast shadow over the lip, the cheek-apple folds (독). Light (paper
  // white): forehead, near cheekbone, the bridge of the nose, the chin
  function planes2(C, ch, M, OL, who, X) {
    const P = C.p, Y = M.Y, ws = ch.ws;
    const T = TERM.A.map(([s, y, d]) => P([s * ws, Y(y), d])), yT = T[0][1], yB = T[T.length - 1][1];
    const rb = (y) => (y < -2 ? 0 : y < 8 ? lerp(0, 1.5, (y + 2) / 10) : y < 24 ? 1.5 : lerp(1.5, 0.5, (y - 24) / 8));
    const edge = OL.F.filter((p) => p[1] >= yT && p[1] <= yB).map((p) => [p[0] - rb(p[1]) - 0.15, p[1]]).reverse();
    let s = fp(smooth(spl(T, 3).concat(edge), true, 0.06), K.p300);
    // v0.3: the nose's far side and the far cheek are ONE shadow — a patch from inside the nose's side plane to past the
    // terminator (y +5 … the wing), so no paper sliver runs down between them (F2: no isolated vertical lines)
    s += loop3(C, [[1.1 * ws, Y(5.7), 33.1], [1.9 * ws, Y(7.5), 33], [2.6 * ws, Y(10), 33], [2.6 * ws, Y(11.2), 33.4], [4.2 * ws, Y(12.8), 30.2], [6.3 * ws, Y(12.5), 29.6], [4.9 * ws, Y(6), 31], [4.4 * ws, Y(2.5), 31]], K.p300);
    // sockets: a paper-shadow band over each upper lid, deeper toward the nose (the far one all along)
    const fem = !!ch.eye.liner, sk = fem ? 0.55 : 1;   // a woman's lid crease stays clean: a lighter socket
    [-1, 1].forEach((sd) => {
      const G = eyeGeo(C, ch, sd), U = G.U2, nU = U.length - 1, tk = (u) => (sd < 0 ? 2.2 * Math.pow(1 - u, 1.4) + 0.15 : 2.4 - 0.9 * u) * sk;
      const bot = U.map((p) => [p[0], p[1] - 0.45]), top = U.map((p, i) => [p[0], p[1] - 0.6 - tk(i / nU)]);
      s += fp(smooth(bot.concat(top.slice().reverse()), true, 0.1), K.p300);
    });
    // the nose's cast shadow on the upper lip, down-right of the nose base
    const n = ch.nose, k = fem ? 0.7 : who === 'dok' ? 1.25 : 1;
    s += loop3(C, [[-1.2 * k, Y(14.9 + (n - 1)), 32.4], [2.4 * k, Y(15.2 + (n - 1)), 32], [5 * k * ws, Y(15.9 + (n - 1)), 29.8], [3.4 * k, Y(16.9 + (n - 1)), 31], [0.4, Y(16.6 + (n - 1)), 32.4]], K.p300);
    if (who === 'dok') {   // smile folds as paper-shadow crescents along the nasolabial line (no hard line), cheek apples
      [-1, 1].forEach((sd) => {
        const Q = [[sd * 6.4, Y(12.6), 30], [sd * 9.6, Y(16.8), 27.6], [sd * 10.6, Y(21.6), 25.4], [sd * 8.8, Y(19), 27.6], [sd * 7, Y(15), 29.4]];
        if (C.z(Q[1]) > 2) s += loop3(C, Q, K.p300);
      });
    }
    // the lit planes (forehead, near cheekbone) read through the shadows that bound them: men get the hollow under the
    // near cheekbone as a soft paper-shadow plane; the bridge of the nose carries one paper-white highlight stroke
    // men: the hollow under the cheekbone as a short paper-shadow curve, concave upward, ≤ 9 u, tapered (v0.3 F3: never a
    // diagonal running down to the jaw, which read as a scar)
    if (!fem) s += inkC(C, [[-17.4, 9.6, 22.4], [-14.4, 11.2, 25.2], [-11.6, 10.4, 27.2]].map(([a, b, c]) => [a * ws, b, c]), { w: who === 'dok' ? 2.3 : 2, a: 0.4, b: 0.45, fill: K.p300 });
    s += inkC(C, [[-1.3, Y(2.6), 33.2], [-1.5, Y(5.6), 33.6 + 2 * (n - 1)], [-1.4, Y(9.4 + 2 * (n - 1)), 33.4 + 4 * n]], { w: who === 'gyeol' ? 1.15 : 0.9, a: 0.35, b: 0.4, fill: K.p50 });
    return s;
  }
  const dirTo = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
  const ell = (c, rx, ry, fill, rot) => `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(rx)}" ry="${f(ry)}"${rot ? ` transform="rotate(${f(rot)} ${f(c[0])} ${f(c[1])})"` : ''} fill="${fill}"/>`;
  // lash clumps along a lid: each a short curved tapered stroke fanning toward the outer corner
  function lashes(Lid, us, lens, ws0, up) {
    let s = '';
    const n = Lid.length - 1;
    us.forEach((u, j) => {
      const i = Math.max(1, Math.min(n - 1, Math.round(u * n))), B = Lid[i], t = dirTo(Lid[i - 1], Lid[i + 1]);
      let nr = [-t[1], t[0]]; if ((nr[1] > 0) === up) nr = [-nr[0], -nr[1]];
      const d = dirTo([0, 0], [nr[0] * 0.78 + t[0] * 0.62, nr[1] * 0.78 + t[1] * 0.62]), L = lens[j];
      s += ink(spl([B, [B[0] + d[0] * L * 0.5 + t[0] * 0.2, B[1] + d[1] * L * 0.5 + t[1] * 0.2], [B[0] + d[0] * L + t[0] * 0.45, B[1] + d[1] * L + t[1] * 0.45]], 3), { w: ws0[j], a: 0.04, b: 0.8 });
    });
    return s;
  }
  // the upper lid stroke's width factor along the lid (t: inner → outer): women swell into the wing, 독 presses at the
  // drooping corner, 결 full from 40 %
  const lidWf = (E, t) => (E.liner ? lerp(0.32, 1, sstep(t / 0.5)) * (0.6 + 0.55 * t) : E.smile ? lerp(0.35, 1, sstep(t / 0.35)) * (0.85 + 0.3 * t) : lerp(0.3, 1, sstep(t / 0.4)));
  // eye (rev 2). mode 'lit' | 'shadow' (결 under the brim). kind: open · narrow (focus) · half (lowhp) · smile (lower lid
  // raised) · shut (hurt: chevron toward the nose) · arc (closed: 월 a calm crescent, 독 a laughing arch).
  // X: { wake (cyan iris), low (lowered glint), glint (glint scale) }
  function eye2(ctx, C, ch, side, mode, kind, X) {
    X = X || {};
    const G = eyeGeo(C, ch, side), E = ch.eye, { U2, L2, ic, rx, ry, far } = G, fem = !!E.liner, droop = !!E.smile, nU = U2.length - 1;
    const lw = E.lid * (far ? 0.85 : 1);
    if (mode === 'shadow') {
      if (kind === 'shut') return ink(spl(L2.map((p, i) => [p[0], lerp(p[1], U2[i][1], 0.4)]), 3), { w: 1.1, a: 0.25, b: 0.25, fill: K.p50 });
      // one almond glint sitting on a short paper lower-lid stroke (no loose hook)
      const sc = X.glint || 1, gl = [ic[0] + 0.1, ic[1] - 0.1 + (X.low ? 0.7 : 0)];
      return ink(spl(L2.slice(Math.floor(nU * 0.35), Math.floor(nU * 0.85)), 3), { w: far ? 0.7 : 1, a: 0.35, b: 0.35, fill: K.p50 }) +
        ell(gl, (far ? 0.75 : 1.05) * sc, (far ? 1.05 : 1.4) * sc, X.wake ? K.ally : K.p50, -20);
    }
    if (kind === 'shut') {
      const o1 = U2[Math.round(nU * 0.86)], o2 = L2[Math.round(nU * 0.86)], tp = [lerp(U2[1][0], L2[1][0], 0.5), lerp(U2[1][1], L2[1][1], 0.5)];
      const up = [o1[0], o1[1] - 0.5], dn = [o2[0], o2[1] + 0.3];
      return ink(spl([up, [lerp(up[0], tp[0], 0.5), lerp(up[1], tp[1], 0.5) - 0.35], tp], 4), { w: lw * 1.05, a: 0.08, b: 0.3 }) +
        ink(spl([dn, [lerp(dn[0], tp[0], 0.5), lerp(dn[1], tp[1], 0.5) + 0.25], tp], 4), { w: lw * 0.85, a: 0.08, b: 0.3 }) +
        ink(spl(U2.slice(Math.round(nU * 0.2), Math.round(nU * 0.8)).map((p) => [p[0], p[1] - 1.4]), 3), { w: 0.6, a: 0.3, b: 0.3 });
    }
    if (kind === 'arc') {
      const mid = U2.map((p, i) => [p[0], lerp(p[1], L2[i][1], 0.5) + (fem ? 1 : -1) * 0.95 * Math.sin(Math.PI * i / nU)]);
      let s = ink(spl(mid, 3), { w: lw * (fem ? 0.9 : 1), a: 0.06, b: fem ? 0.05 : 0.14, wf: (t) => lerp(0.4, 1, sstep(t / 0.45)) });
      if (fem) s += lashes(mid, [0.66, 0.8, 0.93], [1, 1.3, 1.6], [0.7, 0.66, 0.62], false);
      return s;
    }
    let U = U2, Lo = L2;
    if (kind === 'narrow') { U = U2.map((p, i) => [p[0], lerp(p[1], L2[i][1], 0.36)]); Lo = L2.map((p, i) => [p[0], lerp(p[1], U2[i][1], 0.15)]); }
    if (kind === 'half') U = U2.map((p, i) => [p[0], lerp(p[1], L2[i][1], 0.47)]);
    if (kind === 'smile') Lo = L2.map((p, i) => [p[0], p[1] - E.hl * 0.5 * Math.sin(Math.PI * i / nU)]);
    const white = smooth(U.concat(Lo.slice().reverse()), true, 0.12);
    // iris in two values (ink rim and pupil, soft-ink iris), the lid's thickness as a paper shadow under the upper lid,
    // the tear duct at the inner corner; ONE catch-light up-left of the pupil, kept clear below the lid (same rule for
    // every eye), and for women a second small one low right
    const irisC = X.wake ? (far ? K.allyD : K.ally) : K.ink7;
    // v0.3: the lid's shade lies on the white just under the lash line and is drawn UNDER the iris (a light band never
    // crosses the dark iris); with a lifted lash line (E.lidOff, 결) it follows the stroke's lower edge. env: the lift
    // fades out at both corners, so the upper and lower lid strokes still meet there
    const env = (t) => sstep(t / 0.15) * sstep((1 - t) / 0.25), shW = E.lidShade || 1.35, US = spl(U, 3), nS = US.length - 1;
    let inner = ink(US.map((p, i) => [p[0], p[1] + (E.lidOff ? lw * 0.5 * lidWf(E, i / nS) * (1 - E.lidOff * env(i / nS)) + shW / 2 - 0.15 : lw * 0.42 + 0.5)]), { w: shW, a: 0.12, b: 0.12, fill: K.p300 });
    inner += ell(ic, rx, ry, K.ink) + ell(ic, rx * 0.8, ry * 0.8, irisC) + ell(ic, rx * 0.44, ry * 0.44, K.ink);
    if (fem && !X.wake) inner += ink(spl([[ic[0] - rx * 0.5, ic[1] + ry * 0.42], [ic[0], ic[1] + ry * 0.66], [ic[0] + rx * 0.5, ic[1] + ry * 0.42]], 4), { w: Math.max(0.45, rx * 0.2), a: 0.35, b: 0.35, fill: K.p300 });
    inner += fp(smooth([U2[0], [U2[2][0], lerp(U2[2][1], L2[2][1], 0.3)], [L2[2][0], lerp(L2[2][1], U2[2][1], 0.25)]], true, 0.25), K.p300);
    const lidAt = (x) => { const y = atX(U, x); return y == null ? ic[1] - ry : y; };
    const gr = 0.25 * E.ri * (X.low ? 0.75 : 1), gx = ic[0] - 0.28 * rx, gy = Math.max(ic[1] - 0.24 * ry + (X.low ? 0.6 : 0), lidAt(gx) + lw * 0.5 + gr + 0.2);
    inner += `<circle cx="${f(gx)}" cy="${f(gy)}" r="${f(gr)}" fill="${X.wake ? K.allyG : K.p50}"/>`;
    if (fem) inner += `<circle cx="${f(ic[0] + 0.38 * rx)}" cy="${f(ic[1] + 0.4 * ry)}" r="${f(0.12 * E.ri)}" fill="${K.p50}"/>`;
    let s = fp(white, K.p50) + `<g ${ctx.clip(white)}>${inner}</g>`;
    // upper lid: thin at the tear duct, full from about 40 %; women swell outward into the wing; the line hooks down past
    // the inner corner (the canthus); 결 ends in a short sharp tail, 독 presses heavy over the drooping corner.
    // v0.3 (F2): E.lidOff lifts the lash line by that share of its own half-width (it grows up from the lid margin instead
    // of over the eye), E.loOff lowers the lower lid's stroke the same way — 결's near iris shows ≥ 75 % between the inks
    const UL = spl(U, 3), nL = UL.length - 1, wfU = (t) => lidWf(E, t);
    const ULo = E.lidOff ? UL.map((p, i) => [p[0], p[1] - E.lidOff * lw * 0.5 * wfU(i / nL) * env(i / nL)]) : UL;
    s += ink(ULo, { w: lw, a: 0.04, b: fem ? 0.03 : droop ? 0.12 : 0.05, wf: wfU, curve: 0.25 });
    const din = dirTo(U2[3], U2[0]);
    s += ink(spl([U2[2], U2[0], [U2[0][0] + din[0] * 0.7, U2[0][1] + din[1] * 0.7 + 0.55]], 3), { w: lw * 0.28, a: 0.3, b: 0.55 });
    if (!fem && !droop) { const o = ULo[nL], d = dirTo(ULo[nL - 5], o); s += ink(spl([ULo[nL - 3], o, [o[0] + d[0] * 1.3, o[1] + d[1] * 1.3 - 0.2]], 3), { w: lw * 0.7, a: 0.05, b: 0.75 }); }
    if (fem) {   // the wing [length, lift above the outer corner] (v0.3 F1: the lift is from the horizontal, so 월's drooping
      // corner still flicks up; the far wing is foreshortened round the temple), lash clumps (령 none), the crease (령 none)
      const o = UL[nL], sx = Math.sign(o[0] - UL[0][0]) || -1, [wl, wh] = E.wing || [3.2, 1.9], hx = Math.sqrt(Math.max(0.25, wl * wl - wh * wh)) * (far ? 0.55 : 1), hy = wh * (far ? 0.9 : 1);
      s += ink(spl([o, [o[0] + sx * hx * 0.55, o[1] - hy * 0.3], [o[0] + sx * hx, o[1] - hy]], 4), { w: 1.65, a: 0.02, b: 0.9 });
      if (E.lash !== 0) s += lashes(UL, [0.6, 0.73, 0.85], [1.15, 1.5, 1.85], [0.8, 0.75, 0.7], true);
      if (E.crease) s += ink(spl(U2.slice(Math.floor(nU * 0.3), Math.floor(nU * 0.92)).map((p) => [p[0], p[1] - 1.8]), 3), { w: 0.55, a: 0.3, b: 0.3 });
    }
    const lo0 = Math.floor(nU * (fem ? 0.45 : 0.3)), loW = fem ? 0.95 : 0.8;
    const LoS = spl(Lo.slice(lo0), 3), nLo = LoS.length - 1;
    s += ink(E.loOff ? LoS.map((p, i) => [p[0], p[1] + E.loOff * loW * 0.5 * sstep((1 - i / nLo) / 0.25)]) : LoS, { w: loW, a: 0.3, b: 0.1 });
    if (fem && E.lash !== 0) s += lashes(Lo.slice(lo0), [0.55, 0.85], [0.75, 0.95], [0.5, 0.45], false);
    if (droop) s += ink(spl(Lo.slice(Math.floor(nU * 0.25)).map((p) => [p[0], p[1] + 1.1]), 3), { w: 0.55, a: 0.3, b: 0.3 });
    return s;
  }
  // brow (rev 2): one brush stroke along the 3D points; 월 feathered at the head (dry entry), neat thin arch; 결 straight
  // and crisp with a dry tail; 독 bushy with a few loose hairs. X: { dy:[head, peak, tail], knit (head toward the nose), w }
  function brow2(C, ch, side, X) {
    X = X || {};
    const B = ch.brow, ws = ch.ws, by = B.y || 0, fem = !!ch.eye.liner, bushy = !!ch.eye.smile, w = B.w * (side > 0 && C.th > 15 ? 0.85 : 1) * (X.w || 1);
    const P = spl((B.pts || BROW0).map(([s, y, d], i) => C.p([side * (s - (i === 0 ? X.knit || 0 : 0)) * ws, y + by + (X.dy ? X.dy[i] : 0), d])), 8);
    const soft = fem && !B.straight;   // 월 · 노을 feathered arches; 령 a straight, crisp brow
    let s = ink(P, { w, a: soft ? 0.14 : 0.06, b: soft ? 0.78 : B.straight ? 0.42 : bushy ? 0.5 : 0.62, curve: 0.2, dry0: soft ? 0.2 : 0, dry: bushy ? 0 : 0.22, wf: soft ? (t) => 1 - 0.15 * t : null });
    if (bushy) [0.12, 0.3, 0.5, 0.68].forEach((t, j) => {
      const i = Math.round(t * (P.length - 1)), p = P[i], d = dirTo(P[Math.max(0, i - 2)], P[Math.min(P.length - 1, i + 2)]);
      const up = j % 2 ? -1 : 1, q0 = [p[0] - d[1] * w * 0.35 * up, p[1] + d[0] * w * 0.35 * up];
      s += ink(spl([q0, [q0[0] + d[0] * 1 - d[1] * 0.5 * up, q0[1] + d[1] * 1 + d[0] * 0.5 * up], [q0[0] + d[0] * 2 - d[1] * 0.7 * up, q0[1] + d[1] * 2 + d[0] * 0.7 * up]], 3), { w: 0.75, a: 0.1, b: 0.7 });
    });
    return s;
  }
  // nose (rev 2, A): far side plane with soft curved edges (결: from between the eyes, a straight bridge), the underside
  // as a curved ink crescent from the near wing to the column (no hole), the near wing a brushed comma, a short far edge
  // from y +6, a small tucked nostril (men)
  function nose2(C, ch, M, who) {
    const N = M.N, P = C.p, ws = ch.ws, Y = M.Y, tb = P(N.bot), fa = P(N.ala), na = P([-N.ala[0], N.ala[1], N.ala[2]]), tp = P(N.tip), col = P(N.col);
    const fem = !!ch.eye.liner, big = who === 'dok';
    // the far side plane starts below y +5 for everyone (v0.3 F2: no long bridge line from between 결's eyes)
    // v0.3: one simple plane — the ridge side down to the tip, back up the far side (the round-2 loop crossed itself and
    // left a paper notch at its waist); planes2's bridge patch joins it to the cheek's shadow
    const top = P([0.9, Y(fem ? 5.5 : 4.6), 33.2]);
    let s = fp(smooth([top, [tp[0] + 0.1, tp[1] - 1.5], [tp[0] + 0.55, tp[1] + 0.15], [tp[0] + 0.9, tp[1] + 0.2], P([3.2 * ws, Y(8.5), 31.8]), P([2.6 * ws, Y(6.2), 32.4])], true, 0.16), K.p300);
    if (fem) {   // women (AD check 2, v0.3 F4): ONE stroke — the short wing curve, the nostril comma, the small under-tip
      // wedge — so no mark stands alone; the far nostril is left out at 30°
      return s + ink(spl([[na[0] + 0.7, na[1] - 0.4], [na[0] + 0.2, na[1] + 0.5], [na[0] + 0.95, na[1] + 1.05], [tb[0] - 1.3, tb[1] + 0.9], [tb[0] + 0.1, tb[1] + 1.15], [col[0] + 0.7, col[1] + 0.5]], 4),
        { w: 0.85, a: 0.12, b: 0.3, wf: (t) => (t < 0.3 ? 0.62 : t < 0.48 ? 0.95 : 0.9 + 0.3 * Math.sin(Math.PI * (t - 0.48) / 0.52)) });
    }
    s += ink(spl([[na[0] + 0.5, na[1] + 0.9], [tb[0] - 1.5, tb[1] + 0.95], [tb[0], tb[1] + 1.05], [col[0] + 0.7, col[1] + 0.45], [fa[0] - 0.2, fa[1] + 0.85]], 4), { w: big ? 1.25 : 1, a: 0.28, b: 0.32, wf: (t) => 1 + 0.45 * Math.sin(Math.PI * t) });
    s += ink(spl([[na[0] + 1.3, na[1] - 1.9], [na[0] - 0.2, na[1] - 0.3], [na[0] + 0.5, na[1] + 1], [na[0] + 1.6, na[1] + 1.1]], 5), { w: big ? 1.15 : 0.9, a: 0.3, b: 0.25, curve: 0.5 });
    // far edge: from below y +5, at most 7 u long (독's longer nose: it starts lower)
    const e0 = P([3.2 * ws, Y(6.4), 31.6]), e0y = Math.max(e0[1], fa[1] - 6.5);
    s += ink(spl([[lerp(e0[0], fa[0] - 0.3, (e0y - e0[1]) / Math.max(0.1, fa[1] - 1.5 - e0[1])), e0y], [fa[0] - 0.3, fa[1] - 1.5], [fa[0] + 0.25, fa[1] + 0.5]], 4), { w: 0.72, a: 0.4, b: 0.15 });
    // the near nostril: a short comma (1.4 × 0.7 u) curving from the wing toward the column, touching the under-tip stroke
    s += ink(spl([[na[0] + 0.85, na[1] + 0.55], [na[0] + 1.6, na[1] + 0.95], [na[0] + 2.25, na[1] + 1.05]], 3), { w: 0.7, a: 0.15, b: 0.45 });
    return s;
  }
  // mouth (rev 2). kind: null (calm) · flat (focus) · open (hurt) · small (lowhp) · firm (awakened) · smirk (결 victory)
  // · laugh (독 victory) · smile (월 victory). Upper lip a paper-shadow bow (fuller for 월), the line heavier at its middle
  // and corners; 월's lower lip: a paper-white light band, the paper shadow under it and the short ink stroke
  function mouth2(C, ch, M, who, kind) {
    const Mo = ch.mouth, ws = ch.ws, Y = M.Y, my = Y(19.5), P = C.p, cw = Mo.cw * ws, lf = M.lipF ? M.lipF(19.5) : 0, fem = !!ch.eye.liner;
    const lift = (Mo.lift || 0) + (kind === 'smile' ? 0.6 : kind === 'firm' || kind === 'small' ? -0.6 : kind === 'flat' ? -0.3 : 0);
    const nearUp = kind === 'smirk' ? 1.5 : 0, cv = Mo.thin ? 0.35 : 1;   // 령: a nearly level line
    const pts = [[-cw, my - 0.5 * cv - lift - nearUp, 27.6], [-cw * 0.5, my + 0.1 * cv, 31.3 + lf * 0.7], [0, my + 0.4 * cv, 32.3 + lf], [cw * 0.5, my + 0.1 * cv, 31.3 + lf * 0.7], [cw, my - 0.5 * cv - lift, 27.6]].map(P);
    let s = '';
    if (kind === 'open' || kind === 'laugh' || kind === 'small') {
      const g = kind === 'small' ? 0.45 : 1, op = [[-cw * 0.85, my - 0.6 - (kind === 'laugh' ? 0.9 : 0), 28.4], [0, my - 0.9, 32.4 + lf], [cw * 0.85, my - 0.6 - (kind === 'laugh' ? 0.9 : 0), 28.4], [cw * 0.45, my + 3.4 * g, 30.6], [0, my + 4.4 * g, 31.6], [-cw * 0.45, my + 3.4 * g, 30.6]].map((q) => P(kind === 'small' ? [q[0] * 0.5, q[1], q[2]] : q));
      s += fp(smooth(op, true, 0.16), K.ink);
      if (kind !== 'small') s += ink(spl([[-cw * 0.6, my + 0.2, 30.2], [0, my - 0.1, 32.2 + lf], [cw * 0.6, my + 0.2, 30.2]].map(P), 4), { w: 1.05, a: 0.2, b: 0.2, fill: K.p50 });
      return s + ink(spl([[-3 * ws, Y(23.4) + (kind === 'small' ? -1.2 : 0.6), 30.8], [0, Y(24) + (kind === 'small' ? -1.2 : 0.6), 31.8], [3 * ws, Y(23.4) + (kind === 'small' ? -1.2 : 0.6), 30.8]].map(P), 4), { w: 1.3, a: 0.3, b: 0.3, fill: K.p300 });
    }
    // upper lip (vermilion) as a paper-shadow bow
    const uh = fem ? 1 : 0.55;
    const up = [[-cw * 0.78, my - 0.45, 29.8], [-1.6 * ws, my - 0.7 - 1.6 * uh, 32.6 + lf], [0, my - 0.2 - 1.15 * uh, 32.9 + lf], [1.6 * ws, my - 0.7 - 1.6 * uh, 32.6 + lf], [cw * 0.78, my - 0.45, 29.8]].map(P);
    if (Mo.upper !== false) s += fp(smooth(up.concat([pts[3], pts[2], pts[1]]), true, 0.15), K.p300);   // 령: no upper-lip plane
    if (Mo.upperLine) s += ink(spl(up, 5), { w: Mo.upperLine, a: 0.3, b: 0.3 });   // 노을: the crisp bow line, fading into the corners
    if (fem && !Mo.thin) {   // lower lip: light band, its shadow below (월 fuller: 2.4), the short ink stroke under the middle
      s += fp(smooth([[-cw * 0.7, my + 0.5, 30], [0, my + 0.9, 32.6 + lf], [cw * 0.7, my + 0.5, 30], [cw * 0.45, Y(22.2), 30.6], [0, Y(22.8), 31.8], [-cw * 0.45, Y(22.2), 30.6]].map(P), true, 0.18), K.paper);
      s += ink(spl([[-2.4 * ws, my + 1.3, 31.2], [0, my + 1.6, 32.6], [2.4 * ws, my + 1.3, 31.2]].map(P), 4), { w: 0.9, a: 0.3, b: 0.3, fill: K.p50 });
      s += ink(spl([[-3 * ws, Y(22.7), 30.8], [0, Y(23.2), 31.8], [3 * ws, Y(22.7), 30.8]].map(P), 4), { w: Mo.lowerW || 1.9, a: 0.3, b: 0.3, fill: K.p300 });
      s += ink(spl([[-1.6 * ws, Y(23.9), 31.2], [0, Y(24.1), 31.6], [1.6 * ws, Y(23.9), 31.2]].map(P), 3), { w: 0.7, a: 0.3, b: 0.3 });
    } else if (fem) {   // 령: a thin level mouth — a slim lower-lip shadow and the short stroke
      s += ink(spl([[-2.6 * ws, Y(22.2), 30.8], [0, Y(22.6), 31.8], [2.6 * ws, Y(22.2), 30.8]].map(P), 4), { w: 1.25, a: 0.3, b: 0.3, fill: K.p300 });
      s += ink(spl([[-1.4 * ws, Y(23.3), 31.2], [0, Y(23.5), 31.6], [1.4 * ws, Y(23.3), 31.2]].map(P), 3), { w: 0.6, a: 0.3, b: 0.3 });
    } else s += ink(spl([[-3 * ws, Y(22.6), 30.8], [0, Y(23.1), 31.8], [3 * ws, Y(22.6), 30.8]].map(P), 4), { w: 1.4, a: 0.3, b: 0.3, fill: K.p300 });
    // the line: heavier in the middle and pressed at the corners, the corners tapered; 월's corners tick up
    s += ink(spl(pts, 6), { w: Mo.lip * 1.45 * (kind === 'flat' ? 1.15 : 1), a: 0.08, b: 0.08, wf: (t) => 0.75 + 0.35 * Math.sin(Math.PI * t) + 0.25 * Math.exp(-Math.pow((t - 0.08) / 0.06, 2)) + 0.25 * Math.exp(-Math.pow((t - 0.92) / 0.06, 2)) });
    if ((fem && !Mo.thin) || kind === 'smile') [pts[0], pts[4]].forEach((c, j) => { const d = dirTo(pts[j ? 3 : 1], c); s += ink(spl([c, [c[0] + d[0] * 0.5, c[1] - 0.35], [c[0] + d[0] * 0.8, c[1] - 0.9]], 3), { w: 0.6, a: 0.1, b: 0.6 }); });
    if (nearUp) { const c = pts[0]; s += ink(spl([c, [c[0] - 0.5, c[1] - 0.7], [c[0] - 0.6, c[1] - 1.6]], 3), { w: 0.9, a: 0.1, b: 0.6 }); }
    return s;
  }
  // ear (rev 2): paper, concha in paper shadow, the rim brushed heavy at the back and lobe (shadow) and thin at the top
  // front (light); antihelix and tragus strokes
  function ear2(C, ch, M, side) {
    const ws = ch.ws, P = C.p, Y = M.Y, pt = ([y, d], k) => P([side * (25.4 * ws + (k == null ? 3.5 : k) * cl(-d / 7, 0, 1)), Y(y), d]);
    const out = [[-6, 1.5], [-7.4, -1.4], [-6.6, -4.6], [-3.6, -6.9], [1, -7.3], [6, -6.4], [10, -4.7], [12.8, -2.6], [13.8, -0.6], [12.6, 1.4], [9.4, 2]].map((q) => pt(q));
    const cx = out.reduce((a, p) => a + p[0], 0) / out.length, cy = out.reduce((a, p) => a + p[1], 0) / out.length;
    let s = fp(smooth(out, true, 0.14), K.paper);
    s += fp(smooth([[-1, -2.6], [4.5, -3.4], [8.6, -1.6], [7.2, 0.8], [2, 0.6]].map((q) => pt(q, 1.6)), true, 0.2), K.p300);
    s += ink(spl(out.slice(1).concat([out[0], out[1]]), 4), { w: 1.45, a: 0.1, b: 0.1, light: 1, center: [cx, cy], curve: 0.3 });
    s += ink(spl([[-3.4, -3.8], [0.5, -5.2], [5.5, -4.6], [9, -2.6]].map((q) => pt(q, 2.4)), 4), { w: 1, a: 0.25, b: 0.4 });
    s += ink(spl([[-2.6, 0.6], [-0.8, 1.3], [1.4, 1.5]].map((q) => pt(q, 0.8)), 3), { w: 0.75, a: 0.3, b: 0.3 });
    return s;
  }
  // hair silhouette with clumps: the hull's radius gains soft points at the given angles [deg (0 = screen right, 90 =
  // down), width deg, height share], so the edge reads as bundles, never a smooth helmet
  function clumped(E, HU, bumps) {
    const r = (a) => { let k = 1; const deg = ((a / Rd) % 360 + 360) % 360; bumps.forEach(([c, w, h]) => { let d = Math.abs(deg - c); d = Math.min(d, 360 - d); if (d < w) k += h * Math.pow(1 - d / w, 1.6); }); return HU.r(a) * k; };
    const pt = (a) => [E.x + E.rx * Math.cos(a) * r(a), E.y + E.ry * Math.sin(a) * r(a)];
    const ring = []; for (let i = 0; i < 240; i++) ring.push(pt(i / 240 * 2 * Math.PI));
    return { r, pt, d: smooth(ring, true, 0.14) };
  }
  // seeded clump list: n soft points spread over an angle range
  function clumps(a0, a1, n, h, w, seed) {
    let r = seed || 7; const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    const L = []; for (let i = 0; i < n; i++) L.push([lerp(a0, a1, (i + 0.5 + (rnd() - 0.5) * 0.6) / n), w * (0.7 + 0.6 * rnd()), h * (0.5 + rnd())]);
    return L;
  }
  const HAIR2 = {
    wol: {
      bumps: () => clumps(150, 300, 14, 0.012, 9, 5).concat(clumps(105, 150, 5, 0.035, 7, 9)),
      // bun with its coils (spiral paper gaps), sheen arc, the pin through it with the eclipse ornament
      back(C) {
        const b = C.p(HAIR.wol.bun), r = 8.6, a = C.p([-16, -36, -17]), e = C.p([18, -30.5, -33]);
        const arc = (r0, a0, a1, cx) => { const P = []; for (let i = 0; i <= 16; i++) { const t = (a0 + (a1 - a0) * i / 16) * Rd; P.push([b[0] + r0 * Math.cos(t) + (cx || 0), b[1] + r0 * Math.sin(t)]); } return P; };
        const out = []; for (let i = 0; i < 36; i++) { const t = i / 36 * 2 * Math.PI; out.push([b[0] + r * (1 + 0.035 * Math.sin(5 * t + 0.6)) * Math.cos(t), b[1] + r * (1 + 0.035 * Math.sin(5 * t + 0.6)) * Math.sin(t)]); }
        let s = fp(smooth(out, true, 0.16), K.ink);
        s += ink(arc(r * 0.72, 150, 330), { w: 0.6, a: 0.3, b: 0.3, fill: K.p50 }) + ink(arc(r * 0.42, 330, 560), { w: 0.55, a: 0.3, b: 0.3, fill: K.p50 });
        s += ink(arc(r * 0.6, 196, 258), { w: 2, a: 0.3, b: 0.35, fill: K.p50 });
        const ux = e[0] - a[0], uy = e[1] - a[1], l = Math.hypot(ux, uy) || 1, nx = -uy / l, ny = ux / l;
        s += fp(`M ${P2([a[0] + nx * 0.9, a[1] + ny * 0.9])} L ${P2([e[0] + nx * 0.55, e[1] + ny * 0.55])} L ${P2([e[0] + ux / l * 0.8, e[1] + uy / l * 0.8])} L ${P2([e[0] - nx * 0.55, e[1] - ny * 0.55])} L ${P2([a[0] - nx * 0.9, a[1] - ny * 0.9])} Z`, K.p50, OLs(1.2));
        const h = [a[0] - ux / l * 2.3, a[1] - uy / l * 2.3];
        s += ell(h, 2.7, 2, K.p50, Math.atan2(uy, ux) / Rd).replace('/>', ` ${OLs(1.2)}/>`) + ell([h[0] - 0.7, h[1] - 0.25], 1.15, 1.15, K.ink);
        return s;
      },
      // bundle gaps (thin paper slits along the sweep to the bun, some broken) and a staggered band of curved sheen
      gaps(C, H) {
        const g = [[[-6, 64], [-38, 58], [-80, 52], [-125, 47], [-160, 45]], [[-14, 54], [-48, 50], [-78, 46]], [[-96, 44], [-128, 42], [-150, 42]], [[-26, 44], [-60, 38], [-100, 36], [-145, 39]],
          [[-38, 32], [-70, 27], [-92, 26]], [[-112, 27], [-140, 31], [-158, 36]], [[-55, 20], [-84, 15], [-118, 18], [-155, 30]], [[-72, 10], [-98, 6], [-130, 12], [-160, 26]], [[6, 62], [30, 57], [55, 50]], [[14, 48], [40, 42]]];
        const ws0 = [0.6, 0.7, 0.55, 0.5, 0.65, 0.5, 0.5, 0.45, 0.5, 0.45];
        return strands(C, H, g.map((p, i) => ({ p, w: ws0[i] })), 0.5, K.p50, 0.35);
      },
      sheen(C, H) {
        return strands(C, H, [{ p: [[-18, 61], [-40, 58], [-62, 54]], w: 2.2 }, { p: [[-56, 52], [-78, 48], [-96, 45]], w: 1.9 }, { p: [[-32, 50], [-50, 47], [-68, 44]], w: 1.8 }, { p: [[-86, 41], [-102, 39], [-116, 38]], w: 1.6 }], 2, K.p50, 0.5);
      },
      // in front: slits inside the near curtain along the hairline, the sideburn lock (a main lock and two strands, S-curved,
      // tips curling out past the jaw), baby hairs at the temple, two flyaways at the nape
      front(C, ch, M, cu) {
        const ws = ch.ws, Y = M.Y, hl = HAIRLINE.wol;
        let s = '';
        [1, 2].forEach((i) => { s += inkC(C, hl.slice(2, 8).map(([a, b, c]) => [-a * ws * (1 + 0.045 * i), b - 1.3 * i, c - 2.4 * i]), { w: 0.55, a: 0.25, b: 0.3, fill: K.p50 }); });
        s = `<g ${cu}>${s}</g>`;
        const lk = (L3, w, a, b) => inkC(C, L3.map(([a0, b0, c0]) => [a0 * ws, Y(b0), c0]), { w, a, b, curve: 0.3 });
        s += lk([[-21.4, -5, 21.4], [-22.8, 3.5, 16.6], [-21.2, 10.5, 14.8], [-22.2, 15.5, 12.8], [-24.6, 19.5, 10.2]], 2, 0.3, 0.45);
        s += lk([[-21.8, -4, 20.8], [-23.6, 4.5, 15.4], [-22.8, 10.5, 13.6], [-24.4, 14.5, 11]], 0.75, 0.2, 0.45) + lk([[-20.8, -3, 21.8], [-21.6, 5, 17.4], [-20.4, 11, 15.6], [-21, 16.6, 14.2], [-22.8, 20.4, 12.4]], 0.5, 0.2, 0.45);
        s += lk([[-12.4, -21.6, 29.2], [-14.4, -19.4, 29.2], [-15.8, -17, 28.4], [-15.2, -15.2, 28.4]], 0.48, 0.2, 0.4) + lk([[-17.6, -15.4, 26.4], [-19.6, -12.6, 25.2], [-19.2, -10, 24.6]], 0.45, 0.2, 0.4) + lk([[-7, -24.6, 31.2], [-8.6, -23.2, 31.4], [-9, -21.6, 31.6]], 0.42, 0.2, 0.4);
        s += lk([[-24, 10, 0], [-25.4, 13.6, -2], [-24.6, 16.4, -3.4]], 0.5, 0.2, 0.4) + lk([[-22.6, 11, -5], [-23.2, 14.6, -6.4], [-21.8, 17, -7]], 0.42, 0.2, 0.4);
        return s;
      }
    },
    gyeol: {
      bumps: () => clumps(110, 250, 10, 0.03, 8, 3),
      // the low tied hair down the back: tapered strands with paper gaps, a paper tie crossing it, the tail split in three
      behind(C) {
        const T = [[0, -4, -29], [0, 6, -32.5], [-1.5, 20, -33.5], [-2.5, 34, -31], [-3.5, 50, -27]];
        const P = spl(proj(C, T), 6), n = P.length - 1, W = P.map((_, i) => 9.5 - 5.5 * i / n);
        const side = (k) => P.map((p, i) => { const d = dirTo(P[Math.max(0, i - 1)], P[Math.min(n, i + 1)]); return [p[0] - d[1] * W[i] / 2 * k, p[1] + d[0] * W[i] / 2 * k]; });
        const Lf = side(1), Rt = side(-1), e = P[n], d = dirTo(P[n - 2], e);
        const tips = [[Lf[n][0] + d[0] * 4, Lf[n][1] + d[1] * 4], [e[0] + d[0] * 1.5, e[1] + d[1] * 1.5], [e[0] + d[0] * 6.5, e[1] + d[1] * 6.5], [e[0] - d[1] * 0.4 + d[0] * 2, e[1] + d[0] * 0.4 + d[1] * 2], [Rt[n][0] + d[0] * 5, Rt[n][1] + d[1] * 5]];
        let s = fp(smooth(Lf.concat(tips, Rt.slice().reverse()), true, 0.08), K.ink);
        [-0.22, 0.2].forEach((k) => { s += ink(P.slice(4, n - 1).map((p, i) => { const j = i + 4, dd = dirTo(P[j - 1], P[j + 1]); return [p[0] - dd[1] * W[j] * k, p[1] + dd[0] * W[j] * k]; }), { w: 0.5, a: 0.25, b: 0.25, fill: K.p50 }); });
        s += ink(P.slice(6, n - 3).map((p) => [p[0] - 1.8, p[1]]), { w: 1.5, a: 0.3, b: 0.3, fill: K.p50 });
        const t0 = C.p([0, 4, -32.2]);
        s += fp(brush([[t0[0] - 6, t0[1] - 1.2], [t0[0] + 6, t0[1] + 1.2]], () => 2.6), K.p50, OLs(1.1));
        return s;
      },
      gaps(C, H) { return strands(C, H, [{ p: [[-30, 30], [-70, 22], [-120, 16]], w: 0.5 }, { p: [[-50, 14], [-90, 8], [-130, 6]], w: 0.45 }], 0.5, K.p50, 0.3); },
      sheen(C, H) { return strands(C, H, [{ p: [[-26, 40], [-60, 33], [-92, 27]], w: 2 }, { p: [[-76, 24], [-104, 18], [-128, 15]], w: 1.7 }], 2, K.p50, 0.4); },
      // near locks (v0.3 F2): the three pointed lock ends hang beside the jaw, outside the face; the paper gaps and the
      // broken sheen stay inside the hair, ≥ 2 u from the face's skin
      front(C, ch, M, cu) {
        const ws = ch.ws, Y = M.Y, m = (Q) => Q.map(([a, b, c]) => [a * ws, b, c]);
        let s = '';
        [[[-24, 4, 14], [-24.6, 12, 11], [-25, 20, 8.2]], [[-25.6, 2, 10], [-26, 10, 7], [-26.2, 17.5, 4.6]], [[-22.8, 6, 15], [-23.2, 11, 13], [-23.6, 15.6, 11.4]]].forEach((L3, j) => {
          s += inkC(C, m(L3).map(([a, b, c]) => [a, Y(b), c]), { w: [3.2, 2.6, 2][j], a: 0.05, b: 0.7 });
        });
        // v0.3 F2: every paper stroke ≥ 2 u (edge) inside the hair from the face: two sheen strokes 3.6 · 4.4 u and one
        // gap 6.2 u from the hairline, in the band between the face and the ear
        let g = inkC(C, m([[-26.3, -10, 21.6], [-28.4, -4, 19], [-28.8, 2, 16]]).map(([a, b, c]) => [a, Y(b), c]), { w: 0.5, a: 0.2, b: 0.25, fill: K.p50 });
        [[[-23.6, -8, 20.4], [-25.6, -2, 18], [-26, 4, 15.4]], [[-26.8, 6, 14], [-26.2, 10, 12], [-26, 14, 10.4]]].forEach((L3, j) => { g += inkC(C, m(L3).map(([a, b, c]) => [a, Y(b), c]), { w: [1.8, 1.5][j], a: 0.3, b: 0.35, fill: K.p50 }); });
        return s + `<g ${cu}>${g}</g>`;
      }
    },
    dok: {
      bumps: () => clumps(195, 345, 20, 0.022, 5, 11).concat(clumps(120, 190, 7, 0.03, 6, 13)),
      gaps(C, H) { return strands(C, H, [{ p: [[-40, 48], [-56, 64]], w: 0.5 }, { p: [[-78, 44], [-92, 62]], w: 0.45 }, { p: [[-112, 40], [-122, 56]], w: 0.45 }], 0.5, K.p50, 0.3); },
      sheen(C, H) { return strands(C, H, [{ p: [[-26, 50], [-44, 62], [-66, 74]], w: 2 }, { p: [[-70, 46], [-88, 58], [-108, 70]], w: 1.8 }], 1.9, K.p50, 0.3); },
      // sideburn: a clump in front of the ear with three pointed ends below the towel
      front(C, ch) {
        // v0.3 F3: wide enough to cover the upper third of the near contour
        const ws = ch.ws, Q = [[-27.6, -15, 6.4], [-28.2, -6, 5.6], [-27.6, 1.2, 6.2], [-26.6, 4.6, 7.6], [-25.6, 2.4, 9.2], [-25.2, 5.2, 10.4], [-24.8, 2.4, 11.2], [-24.4, -4, 11.6], [-24.2, -14, 12]].map(([a, b, c]) => C.p([a * ws, b, c]));
        return fp(smooth(Q, true, 0.12), K.ink) + inkC(C, [[-25.2 * ws, -12, 9.4], [-25.2 * ws, -4, 9.2], [-25.1 * ws, 1, 9.4]], { w: 0.5, a: 0.3, b: 0.3, fill: K.p50 });
      },
      // the towel band: wavy edges, paper shadow on its right and under its upper fold, two fold strokes; the knot on the
      // near side behind the temple with two ends hanging behind the ear, each with a fold line
      towel(C, ch) {
        const lo = [], up = [];
        for (let ps = -180; ps <= 180; ps += 3) {
          const a = ps * Rd, s0 = 27.04 * Math.sin(a), d0 = 34 * Math.cos(a), q1 = [s0, -14.6 - 2.2 * Math.cos(a) + 0.35 * Math.sin(ps * Rd * 9), d0], q2 = [s0 * 0.96, -25.2 - 1.6 * Math.cos(a) + 0.3 * Math.sin(ps * Rd * 7 + 1), d0 * 0.96];
          if (C.z(q1) > -2) { lo.push(C.p(q1)); up.push(C.p(q2)); }
        }
        if (lo.length < 3) return '';
        lo.sort((p, q) => p[0] - q[0]); up.sort((p, q) => p[0] - q[0]);
        const band = smooth(lo.concat(up.slice().reverse()), true, 0.05), mid = (t) => lo.map((p, i) => [p[0], lerp(p[1], up[i][1], t)]);
        const xR = lo[lo.length - 1][0], xL = lo[0][0];
        let s = fp(band, K.paper);
        s += fp(smooth(lo.filter((p) => p[0] > lerp(xL, xR, 0.6)).concat(up.filter((p) => p[0] > lerp(xL, xR, 0.6)).reverse()), true, 0.05), K.p300);
        s += fp(smooth(mid(0.78).concat(up.slice().reverse()), true, 0.05), K.p300);
        s += ink(mid(0.4).slice(3, -3), { w: 0.85, a: 0.25, b: 0.25 }) + ink(mid(0.66).slice(8, -10), { w: 0.6, a: 0.3, b: 0.3 });
        s += ink(lo, { w: 2.1, a: 0.04, b: 0.04, light: 1, out: 1 }) + ink(up, { w: 1.6, a: 0.04, b: 0.04 });
        return s;
      },
      knot(C) {
        const k = C.p([-25.7, -19.5, -10.5]), e1 = C.p([-28.2, -5.5, -7.6]), e2 = C.p([-29.4, -10, -11.6]);
        const end = (e, w) => { const ux = e[0] - k[0], uy = e[1] - k[1], l = Math.hypot(ux, uy) || 1, nx = -uy / l, ny = ux / l; return fp(`M ${P2([k[0] + nx * w * 0.6, k[1] + ny * w * 0.6])} L ${P2([e[0] + nx * w * 0.5, e[1] + ny * w * 0.5])} L ${P2([e[0] - nx * w * 0.5 + ux / l * 1.6, e[1] - ny * w * 0.5 + uy / l * 1.6])} L ${P2([k[0] - nx * w * 0.6, k[1] - ny * w * 0.6])} Z`, K.paper, OLs(1.8)) + ink(spl([[k[0] + ux * 0.25, k[1] + uy * 0.25], [k[0] + ux * 0.6 + nx * 0.6, k[1] + uy * 0.6 + ny * 0.6], [e[0] - ux / l * 0.8, e[1] - uy / l * 0.8]], 3), { w: 0.6, a: 0.3, b: 0.3 }); };
        return end(e2, 5.4) + end(e1, 6) + ell(k, 4.2, 5, K.paper).replace('/>', ` ${OLs(1.8)}/>`) + ink(spl([[k[0] - 1.6, k[1] - 2.6], [k[0] + 0.4, k[1]], [k[0] - 1, k[1] + 2.8]], 3), { w: 0.8, a: 0.3, b: 0.3 });
      }
    }
  };
  HAIR2.wol.behind = (C) => HAIR.wol.behind(C);
  // a braid / tail: tapered ink along projected 3D points, paper gaps (braid: alternating slants), a paper tie, a split tip
  function tail3(C, T3, w0, w1, o) {
    o = o || {};
    const P = spl(proj(C, T3), 6), n = P.length - 1, W = P.map((_, i) => lerp(w0, w1, i / n));
    const side = (k) => P.map((p, i) => { const d = dirTo(P[Math.max(0, i - 1)], P[Math.min(n, i + 1)]); return [p[0] - d[1] * W[i] / 2 * k, p[1] + d[0] * W[i] / 2 * k]; });
    const Lf = side(1), Rt = side(-1), e = P[n], d = dirTo(P[n - 2], e);
    const tips = [[Lf[n][0] + d[0] * 3.4, Lf[n][1] + d[1] * 3.4], [e[0] + d[0] * 1.2, e[1] + d[1] * 1.2], [e[0] + d[0] * 5.6, e[1] + d[1] * 5.6], [Rt[n][0] + d[0] * 4.2, Rt[n][1] + d[1] * 4.2]];
    let s = fp(smooth(Lf.concat(tips, Rt.slice().reverse()), true, 0.08), K.ink);
    if (o.braid) for (let i = 3; i < n - 4; i += 4) { const dd = dirTo(P[i - 1], P[i + 1]), k = (i / 4) % 2 ? 1 : -1, a = [P[i][0] - dd[1] * W[i] * 0.42 * k, P[i][1] + dd[0] * W[i] * 0.42 * k], b = [P[i + 2][0] + dd[1] * W[i] * 0.3 * k, P[i + 2][1] - dd[0] * W[i] * 0.3 * k]; s += ink(spl([a, [lerp(a[0], b[0], 0.5), lerp(a[1], b[1], 0.5) - 0.3], b], 3), { w: 0.6, a: 0.3, b: 0.3, fill: K.p50 }); }
    else [-0.22, 0.2].forEach((k) => { s += ink(P.slice(3, n - 1).map((p, i) => { const j = i + 3, dd = dirTo(P[j - 1], P[j + 1]); return [p[0] - dd[1] * W[j] * k, p[1] + dd[0] * W[j] * k]; }), { w: 0.5, a: 0.25, b: 0.25, fill: K.p50 }); });
    s += ink(P.slice(4, n - 3).map((p) => [p[0] - W[4] * 0.2, p[1]]), { w: 1.4, a: 0.3, b: 0.3, fill: K.p50 });
    if (o.tie != null) { const i = Math.round(o.tie * n), dd = dirTo(P[Math.max(0, i - 1)], P[Math.min(n, i + 1)]), p = P[i], hw = W[i] * 0.7; s += fp(brush([[p[0] - dd[1] * hw, p[1] + dd[0] * hw], [p[0] + dd[1] * hw, p[1] - dd[0] * hw]], () => 2.4), K.p50, OLs(1)); }
    return s;
  }
  // a cyan spirit flame (령's fletching): teardrop with a wavy point, the sandwich (ink edge · ally · deep underside ·
  // glow core)
  function flame(C, base3, top3, w) {
    const b = C.p(base3), t = C.p(top3), d = dirTo(b, t), n = [-d[1], d[0]], L = Math.hypot(t[0] - b[0], t[1] - b[1]);
    const at = (u, o) => [b[0] + d[0] * L * u + n[0] * o, b[1] + d[1] * L * u + n[1] * o];
    const body = [at(0, -w * 0.3), at(0.3, -w * 0.55), at(0.62, -w * 0.4), at(0.86, -w * 0.12), at(1, 0.6), at(0.8, w * 0.32), at(0.5, w * 0.5), at(0.18, w * 0.42), at(0, w * 0.3)];
    return fp(smooth(body, true, 0.16), K.ally, OLs(1.8)) + fp(smooth([at(0.12, w * 0.12), at(0.5, w * 0.36), at(0.8, w * 0.22), at(0.5, w * 0.1)], true, 0.2), K.allyD) + ink(spl([at(0.1, -w * 0.1), at(0.5, -w * 0.16), at(0.85, -w * 0.02)], 4), { w: w * 0.18, a: 0.3, b: 0.4, fill: K.allyG });
  }
  Object.assign(HAIR2, {
    noeul: {
      bumps: () => clumps(150, 300, 12, 0.012, 9, 21).concat(clumps(105, 150, 5, 0.03, 7, 23)),
      // the braid down the back from the nape, a paper tie near its end
      behind(C) { return tail3(C, [[0, 6, -24], [-1, 20, -26.5], [-2, 36, -25.5], [-3, 54, -22]], 7, 4.6, { braid: true, tie: 0.86 }); },
      gaps(C, H) {
        const g = [[[-6, 64], [-40, 56], [-85, 44], [-130, 28], [-165, 10]], [[-16, 52], [-52, 44], [-95, 32]], [[-110, 24], [-145, 12]], [[-30, 38], [-66, 28], [-108, 18], [-150, 6]], [[-50, 22], [-86, 12], [-122, 6]], [[-70, 8], [-100, 2], [-140, -2]], [[6, 62], [32, 56], [58, 48]]];
        return strands(C, H, g.map((p, i) => ({ p, w: [0.6, 0.65, 0.5, 0.5, 0.55, 0.45, 0.5][i] })), 0.5, K.p50, 0.35);
      },
      sheen(C, H) { return strands(C, H, [{ p: [[-16, 58], [-40, 54], [-62, 48]], w: 2.1 }, { p: [[-54, 46], [-76, 40], [-94, 34]], w: 1.8 }, { p: [[-30, 46], [-48, 42], [-66, 37]], w: 1.7 }], 2, K.p50, 0.5); },
      front(C, ch, M, cu) {
        const ws = ch.ws, Y = M.Y, hl = HAIRLINE.noeul;
        let s = `<g ${cu}>` + [1, 2].map((i) => inkC(C, hl.slice(2, 8).map(([a, b, c]) => [-a * ws * (1 + 0.045 * i), b - 1.3 * i, c - 2.4 * i]), { w: 0.55, a: 0.25, b: 0.3, fill: K.p50 })).join('') + '</g>';
        const lk = (L3, w) => inkC(C, L3.map(([a0, b0, c0]) => [a0 * ws, Y(b0), c0]), { w, a: 0.3, b: 0.45, curve: 0.3 });
        s += lk([[-21.2, -4, 21.2], [-22.4, 4, 16.6], [-21.2, 11, 14.8], [-22.6, 17, 12.6], [-24.4, 21, 10.4]], 1.6) + lk([[-21.8, -3, 20.6], [-23.4, 5, 15.4], [-22.8, 11, 13.6], [-24.2, 15.6, 11.2]], 0.6);
        s += lk([[-11.6, -22.2, 29.6], [-13.6, -20, 29.6], [-15, -17.6, 28.8]], 0.45) + lk([[-17.4, -15.6, 26.4], [-19.4, -12.6, 25.2], [-19, -10.2, 24.6]], 0.45);
        return s;
      },
      // the folded paper 고깔 sitting on the crown, leaning back: paper with the shaded far side, two fold lines, the hooked
      // tip (out of the disc in the HUD crop), a cyan band round its base (signature)
      over(C) {
        const ring = []; for (let i = 0; i < 48; i++) { const a = i / 48 * 2 * Math.PI; ring.push([15.5 * Math.sin(a), -35.4 + 1.2 * Math.cos(a), -5 + 13.5 * Math.cos(a)]); }
        const apex = [0, -63, -22], R = ring.map(C.p), A = C.p(apex), all = R.concat([A]);
        const cx = all.reduce((a, p) => a + p[0], 0) / all.length, cy = all.reduce((a, p) => a + p[1], 0) / all.length;
        const hull = []; all.slice().sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx)).forEach((p) => { while (hull.length >= 2) { const a = hull[hull.length - 2], b = hull[hull.length - 1]; if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) <= 0) hull.pop(); else break; } hull.push(p); });
        const front = ring.map((q, i) => [q, R[i]]).filter(([q]) => C.z(q) > -6).sort((a, b) => a[1][0] - b[1][0]).map((x) => x[1]);
        let s = fp('M ' + hull.map(P2).join(' L ') + ' Z', K.paper, OLs(2));
        const rx = R.reduce((a, p) => (p[0] > a[0] ? p : a), [-1e9, 0]);
        s += fp(smooth([A, [lerp(A[0], rx[0], 0.55) - 2, lerp(A[1], rx[1], 0.55)], rx, [rx[0] - 6, rx[1] + 1], [lerp(A[0], rx[0], 0.5) - 4, lerp(A[1], rx[1], 0.5) + 2]], true, 0.12), K.p300);
        [-0.7, 0.35].forEach((ph) => { const q = C.p([15.5 * Math.sin(ph), -35.4 + 1.2 * Math.cos(ph), -5 + 13.5 * Math.cos(ph)]); s += ink(spl([q, [lerp(q[0], A[0], 0.5), lerp(q[1], A[1], 0.5)], A], 4), { w: 0.9, a: 0.2, b: 0.4 }); });
        s += fp(smooth([A, C.p([0, -66.5, -29]), C.p([0, -64, -34]), C.p([0, -61.6, -27])], true, 0.2), K.paper, OLs(1.6));
        if (front.length > 3) s += ribbon(front.map((p) => [p[0], p[1] - 1.4]), 4, 4, { edge: 1.8, glow: 1 });
        return s;
      }
    },
    ryeong: {
      bumps: () => clumps(150, 300, 12, 0.014, 8, 31).concat(clumps(110, 150, 4, 0.025, 7, 33)),
      // the high ponytail swept back from the tie, and three cyan fletchings rising from the quiver behind the near shoulder
      behind(C) {
        return flame(C, [-17, 46, -16], [-18.6, 22, -19], 5.6) + flame(C, [-13.4, 46, -15], [-14, 18, -17], 6.2) + flame(C, [-20.4, 46, -18], [-23, 26, -21], 5) +
          tail3(C, [[0, -32, -25], [-2, -22, -40], [-5, -2, -46], [-6, 16, -44], [-6, 32, -38]], 9, 3, {});
      },
      back(C) { const t = C.p([0, -31.4, -21.6]); return fp(brush([[t[0] - 4.6, t[1] - 3.2], [t[0] + 3.8, t[1] + 3.4]], () => 2.6), K.p50, OLs(1.1)); },
      gaps(C, H) {
        const g = [[[-6, 64], [-46, 58], [-100, 52], [-160, 50]], [[-18, 50], [-60, 44], [-112, 42], [-160, 46]], [[-34, 34], [-74, 30], [-124, 32]], [[-56, 18], [-96, 16], [-140, 26]], [[8, 60], [40, 54], [70, 48]]];
        return strands(C, H, g.map((p, i) => ({ p, w: [0.6, 0.6, 0.5, 0.5, 0.5][i] })), 0.5, K.p50, 0.35);
      },
      sheen(C, H) { return strands(C, H, [{ p: [[-20, 60], [-46, 56], [-72, 52]], w: 2.1 }, { p: [[-60, 50], [-84, 47], [-104, 45]], w: 1.8 }, { p: [[-36, 46], [-56, 43], [-76, 41]], w: 1.6 }], 2, K.p50, 0.5); },
      // fringe: pointed locks over the forehead ending above y −6 (their cast shadow is drawn in the face); one loose lock
      front(C, ch, M) {
        const ws = ch.ws;
        let s = '';
        // four bundles whose ends are the shadow's tips (one ink mass with their cast shadow)
        [[-12, -10.4], [-3.4, -8.6], [5.2, -7.4], [13.2, -5.6]].forEach(([s1, tip], i) => {
          s += inkC(C, [[(s1 - 1.8) * ws, -26, 30.8], [(s1 - 0.9) * ws, -17, 33], [(s1 + 1.8) * ws, tip, 32.6]], { w: 4.6 - (i % 2) * 0.6, a: 0.05, b: 0.75 });
        });
        s += inkC(C, [[-14.4 * ws, -22, 29], [-15.6 * ws, -15, 29.4], [-15.4 * ws, -9, 28.6]], { w: 0.5, a: 0.2, b: 0.4 });
        return s;
      }
    }
  });
  // neck (rev 2): paper shadow on the far side, the jaw's cast shadow thin at the lit near side and full under the chin
  // (soft lower edge), men's near neck muscle as a paper-shadow sliver; the neck line thin on the lit side, heavier on
  // the shadow side
  function neck2(ctx, C, ch, M, OL, yBot, who) {
    const G = neckGeo(C, ch, yBot), clip = ctx.clip(G.d), fem = !!ch.eye.liner, xl = (y) => atY(G.L, y), xr = (y) => atY(G.R, y);
    const shade = G.R.map((p, i) => [lerp(G.L[i][0], p[0], fem ? 0.68 : 0.6), p[1]]);
    const jaw = OL.N.filter((p) => p[1] >= M.Y(12)).concat(OL.F.filter((p) => p[1] >= M.Y(22)).reverse()).map((p) => [p[0] + 1, p[1] + 2.3]);
    let s = fp(G.d, K.paper) + `<g ${clip}>` + fp(smooth(shade.concat(G.R.map((p) => [p[0] + 4, p[1]]).reverse()), true, 0.12), K.p300);
    if (fem) {   // women (AD check 3): the jaw's shadow is a paper-shadow plane, never an ink band (it read as a strap)
      const n = jaw.length - 1, low = jaw.map((p, i) => [p[0], p[1] + lerp(1.4, 6, Math.pow(i / n, 0.7))]);
      s += fp(smooth(jaw.map((p) => [p[0], p[1] - 2]).concat(low.slice().reverse()), true, 0.1), K.p300);
    } else s += ink(jaw, { w: 6.5, a: 0.02, b: 0.05, wf: (t) => lerp(0.22, 1, Math.pow(t, 0.7)) });
    if (!fem) s += fp(smooth([[xl(15) + 1, 15], [lerp(xl(30), xr(30), 0.32), 30], [lerp(xl(46), xr(46), 0.5), 46], [lerp(xl(46), xr(46), 0.4), 46], [lerp(xl(30), xr(30), 0.2), 30], [xl(15) + 0.4, 15]], true, 0.2), K.p300);
    s += '</g>';
    return s + ink(G.L.filter((p) => p[1] >= 12), { w: fem ? 1 : 1.3, a: 0.3, b: 0.15 }) + ink(G.R.filter((p) => p[1] >= 18), { w: fem ? 1.8 : 2.3, a: 0.25, b: 0.15 });
  }
  // costume (rev 2): shoulders with a brushed outline, the far shoulder in paper shadow, two or three cloth folds, the
  // back collar behind the neck, the inner collar, the outer collar laid over it (its cast shadow on the inner one),
  // each 깃 with its paper 동정 on the neck side
  function bust2(ctx, Cb, ch, who) {
    const o = BODY[who], G = bustGeo(Cb, ch, o), n = ch.neck, P = (q) => Cb.p(q), xL = Math.min(...G.L.map((p) => p[0])), xR = Math.max(...G.R.map((p) => p[0]));
    const on = (L, lift) => L.map(([sx, y]) => { const q = G.front(sx, y); return P([q[0], q[1], q[2] + (lift || 0)]); });
    let body = fp(G.d, K.paper) + `<g ${ctx.clip(G.d)}>` + fp(`M ${P2([lerp(xL, xR, 0.7), 30])} C ${P2([lerp(xL, xR, 0.8), 46])} ${P2([lerp(xL, xR, 0.74), 74])} ${P2([lerp(xL, xR, 0.69), 120])} L ${P2([xR + 10, 120])} L ${P2([xR + 10, 30])} Z`, K.p300);
    body += ink(on([[-n * 2.1, 40], [-n * 1.7, 50], [-n * 1.2, 62]]), { w: 1.7, a: 0.2, b: 0.5 }) + ink(on([[n * 2.5, 43], [n * 2.3, 53], [n * 1.9, 64]]), { w: 1.4, a: 0.25, b: 0.5 }) + ink(on([[-n * 0.1, 51], [n * 0.5, 58], [n * 0.6, 66]]), { w: 1.1, a: 0.3, b: 0.5 });
    body += '</g>' + ink(G.L.slice(0, 22), { w: 1.6, a: 0.2, b: 0.2 }) + ink(G.R.slice(0, 22), { w: 2.6, a: 0.2, b: 0.2 });
    // the back collar runs from the near shoulder line round behind the neck (no loose end beside the neck)
    const back = [[-n * 1.7, 39.4], [-n * 1.2, 36.4], [-n * 0.6, 33.6], [0, 33], [n * 0.6, 33.6], [n * 1.15, 36.6]].map(([sx, y]) => P([sx, y, -2 - n * 1.25 * Math.sqrt(Math.max(0, 1 - Math.min(1, (sx / (n * 1.25)) ** 2)))]));
    const inner = on([[-n * 1.0, 35], [-n * 0.35, 40.5], [n * 0.45, 47], [n * 1.3, 55], [n * 2.2, 66]], 0.3);
    const outer = on([[n * 1.0, 35], [n * 0.35, 40.5], [-n * 0.45, 47], [-n * 1.3, 55], [-n * 2.2, 66]], 0.8);
    const wC = who === 'dok' ? 7 : ch.eye.liner ? 5.4 : 6.4;
    const band = (L, w) => ink(spl(L, 5), { w, a: 0.02, b: 0.02 });
    const dongjeong = (L, w) => ink(spl(L, 5).map((p) => [p[0], p[1] - w * 0.2]), { w: w * 0.34, a: 0.05, b: 0.05, fill: K.p50 });
    const backC = band(back, wC * 0.9) + dongjeong(back, wC * 0.9);
    let front = who === 'gyeol' ? fp(smooth([inner[0], outer[0], outer[2], inner[2]], true, 0.1), K.ink7) : '';
    front += band(inner, wC) + dongjeong(inner, wC) + ink(spl(outer, 5).map((p) => [p[0] - 0.6, p[1] + wC * 0.55]), { w: 1.6, a: 0.1, b: 0.3, fill: K.p300 }) + band(outer, wC) + dongjeong(outer, wC);
    return { body, backC, front, G };
  }
  // expressions. 결: six (k-hero EX head angles); 독 · 월: calm and victory
  const EX2 = {
    calm: { rot: 0 },
    focus: { rot: 7, hatDy: 3.4, tilt: 5, sDy: 2.6, eye: 'narrow', brow: { dy: [1.5, 0.7, 0], knit: 0.8, w: 1.15 }, mouth: 'flat' },
    hurt: { rot: -10, hatDy: -1, tilt: -2, sDy: -1.5, eye: 'shut', brow: { dy: [-1.4, -0.6, 0.6] }, mouth: 'open', splash: true },
    lowhp: { rot: 8, hatDy: 1.2, tilt: 5, sDy: 1.2, eye: 'half', low: true, brow: { dy: [-1.1, -0.4, 0.2] }, mouth: 'small', sweat: true, worn: true },
    awakened: { rot: -3, tilt: 4, eye: 'open', wake: true, brow: { dy: [0.5, 0.3, 0] }, mouth: 'firm' },
    victory: { rot: -4, hatDy: -3, tilt: -8, sDy: -9, eye: 'smile', lift: true, brow: { dy: [-0.5, -0.6, -0.4] }, mouth: 'smirk', hand: true }
  };
  const EX_OTHER = { dok: { victory: { rot: -6, eye: 'arc', brow: { dy: [-0.8, -0.8, -0.4] }, mouth: 'laugh' } }, wol: { victory: { rot: -4, eye: 'arc', brow: { dy: [-0.4, -0.5, -0.3] }, mouth: 'smile' } } };
  const EXPRS2 = { gyeol: Object.keys(EX2), dok: ['calm', 'victory'], wol: ['calm', 'victory'], noeul: ['calm'], ryeong: ['calm'] };
  function exprSpec(who, expr) {
    if (!EXPRS2[who].includes(expr)) throw new Error('faceDrafts: unknown expression ' + expr + ' for ' + who + ' (rev 2)');
    return who === 'gyeol' || expr === 'calm' ? EX2[expr] : EX_OTHER[who][expr];
  }
  // A framing (rev 2): scale and where the eye midpoint sits, per person, so each signature stays inside the disc
  // (월's bun and pin, 독's towel knot, 결's brim not over the eyes)
  const FRAME2 = { gyeol: { S: 1.5, ex: 82, ey: 76 }, dok: { S: 1.48, ex: 86, ey: 77 }, wol: { S: 1.4, ex: 86, ey: 78 }, noeul: { S: 1.4, ex: 85, ey: 80 }, ryeong: { S: 1.44, ex: 84, ey: 78 } };
  function framing2(who) {
    const F = FRAME2[who], pu = pupils('A', who), xm = (pu[0][0] + pu[1][0]) / 2;
    return { S: F.S, ox: F.ex - xm * F.S, oy: F.ey, xm };
  }
  // expression backgrounds in the 160 box (the same grammar as 결's HUD portraits, k-hero.js:1588-1596)
  const HOSTD = '#B8352B';   // lowhp ring only (brief B2 §2)
  function bg2(expr) {
    const vig = (cx, cy) => PN.halftone(0, 0, 160, 160, 6, (x, y) => Math.max(0, Math.min(1.9, (Math.hypot(x - cx, y - cy) - 40) / 30)), VIG, 45);
    let s = `<rect width="160" height="160" fill="${K.paper}"/>` + vig(96, 70);
    const H = PN._hk || {};
    if (expr === 'hurt') {
      s = `<rect width="160" height="160" fill="${K.ink}"/>` + (H.splat ? H.splat(136, 34, 8, 10, 7, K.p50) + H.splat(20, 114, 7, 8, 3, K.p50) : '') + `<path d="M 160,40 L 138,60 L 147,66 L 130,88 M 0,62 L 28,77 L 21,85 L 46,100" fill="none" stroke="${K.p50}" stroke-width="2.4"/>`;
    }
    if (expr === 'focus' && PN.speedLines) s += PN.speedLines(104, 90, 58, 130, 60, 13, K.ink, 0, Math.PI * 2, 0.012);
    if (expr === 'lowhp') s += PN.halftone(0, 0, 160, 160, 6, () => 6 * Math.sqrt(0.2 / Math.PI), K.ink, 45);
    if (expr === 'awakened' && H.brushArc) s += [0, 1, 2].map((i) => fp(H.brushArc(80, 88, 60 + i * 8, 60 + i * 8, -2.6 + i * 0.7, -0.4 + i * 0.9, (t) => 1 + 5 * Math.sin(Math.PI * t)), K.ally, `stroke="${K.ink}" stroke-width="1.6"`)).join('');
    if (expr === 'victory') { let r = 5; const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; }; for (let i = 0; i < 11; i++) { const x = 14 + rnd() * 58, y = 14 + rnd() * 54, q = 2 + rnd() * 3; s += fp(`M ${f(x)},${f(y - q * 2)} L ${f(x + q * 0.6)},${f(y - q * 0.6)} L ${f(x + q * 2)},${f(y)} L ${f(x + q * 0.6)},${f(y + q * 0.6)} L ${f(x)},${f(y + q * 2)} L ${f(x - q * 0.6)},${f(y + q * 0.6)} L ${f(x - q * 2)},${f(y)} L ${f(x - q * 0.6)},${f(y - q * 0.6)} Z`, K.p50, `stroke="${K.ink}" stroke-width="1.2"`); } }
    return s;
  }
  // the skull's edge where it passes in front of 월's bun, as a thin paper line (the two ink masses read apart)
  function bunSep(C, HU) {
    const b = C.p(HAIR.wol.bun), r = 8.6, P = [];
    for (let i = 0; i <= 240; i++) { const p = HU.pt(i / 240 * 2 * Math.PI); P.push(Math.hypot(p[0] - b[0], p[1] - b[1]) < r - 0.5 ? p : null); }
    const runs = []; let cur = [];
    P.concat(P).forEach((p) => { if (p) cur.push(p); else { if (cur.length > 2) runs.push(cur); cur = []; } });
    const best = runs.sort((x, y) => y.length - x.length)[0];
    return best ? ink(best.slice(0, 241), { w: 1, a: 0.25, b: 0.25, fill: K.p50 }) : '';
  }
  // 령's fringe shadow (v0.3 F5): its lower edge is the fringe's bundle ends (four pointed tips, straight runs keep them
  // sharp); it covers the forehead, the far brow's head and the far temple, passes ≥ 1 u above the far upper lid and drops
  // outside the far eye's outer corner at y ≈ 4 — both eyes stay in the light
  const FRINGE = [[-20, -14.6, 22], [-14, -12.4, 28.6], [-10.2, -10.4, 30.8], [-7, -12.6, 31.8], [-1.6, -8.6, 33], [2.4, -11.4, 32.8], [7, -6.8, 32], [10.6, -9.8, 30.8], [15, -5.6, 28.6], [18.6, -2.6, 25.8], [21.6, 3.6, 21.6], [23.6, 9, 17]];
  const fringePts = (C, ch, M) => FRINGE.map(([s, y, d]) => C.p([s * ch.ws, M.Y(y), d]));
  function fringeShadow(C, ch, M) {
    const Q = fringePts(C, ch, M), a = Q[0], b = Q[Q.length - 1];
    return fp('M ' + Q.map(P2).join(' L ') + ` L ${P2([b[0] + 40, b[1]])} L ${P2([b[0] + 40, -70])} L ${P2([a[0] - 40, -70])} L ${P2([a[0] - 40, a[1]])} Z`, K.ink);
  }
  const dropP = (x, y, h) => fp(`M ${f(x)},${f(y)} C ${f(x - 0.34 * h)},${f(y + 0.57 * h)} ${f(x - 0.31 * h)},${f(y + 0.94 * h)} ${f(x)},${f(y + h)} C ${f(x + 0.31 * h)},${f(y + 0.94 * h)} ${f(x + 0.34 * h)},${f(y + 0.57 * h)} ${f(x)},${f(y)} Z`, K.p50, `stroke="${K.ink}" stroke-width="1"`);
  // head layers for direction A (rev 2), head units. X = expression spec
  function layers2(ctx, who, X) {
    const C = cam(30), M = model(who, REV2[who]), ch = ch2(who), OL = outline(C, M), H = shell(ch), E = skullE(C, H), H2 = HAIR2[who], Y = M.Y, gy = who === 'gyeol', vic = !!X.lift;
    // 결's brim and 령's fringe cast one shadow over the forehead and the far eye; X.bare (faceBoard) = the face alone
    const bare = !!X.bare, shadowed = !bare && (gy || who === 'ryeong');
    const L = { behind: H2.behind ? H2.behind(C) : '', back: H2.back ? H2.back(C) : '', neckC: { C, ch, M, OL } };
    const HU = clumped(E, hull(E, OL.F.concat(OL.N).filter((p) => p[1] <= -13)), H2.bumps());
    L.mass = fp(HU.d, K.ink) + H2.gaps(C, H) + H2.sheen(C, H) + (who === 'wol' ? bunSep(C, HU) : '');
    L.ears = ear2(C, ch, M, -1);
    // face: planes, 독's beard planes, lowhp's worn plane, 결's brim shadow; the brush contour
    let inner = planes2(C, ch, M, OL, who, X);
    if (who === 'dok') {
      const chinQ = [[-12.5, 15, 24], [-9, 22, 27.5], [-5, 26.5, 30], [0, 27.6, 31.4], [5, 26.5, 30], [9, 22, 27.5], [12.5, 15, 24]].map(([s, y, d]) => C.p([s, Y(y), d]));
      inner += fp(smooth(chinQ, false, 0.14) + ` L ${P2([chinQ[6][0] + 10, 60])} L ${P2([chinQ[0][0] - 10, 60])} Z`, K.p300);
      inner += fp(smooth([[-6.6, 16.6, 29.6], [0, 15.8, 32.8], [6.6, 16.6, 29.6], [6.4, 18.4, 28.4], [0, 17.8, 32.6], [-6.4, 18.4, 28.4]].map(([s, y, d]) => C.p([s, Y(y), d + 1])), true, 0.16), K.p300);
      const G = eyeGeo(C, ch, -1), oc = G.L2[G.L2.length - 1];
      inner += fp(smooth([[oc[0] - 0.4, oc[1] - 0.6], [oc[0] - 3.4, oc[1] - 0.2], [oc[0] - 4.4, oc[1] + 1.8], [oc[0] - 1.6, oc[1] + 1.2]], true, 0.2), K.p300);
    }
    if (X.worn) { const G = eyeGeo(C, ch, -1), Lw = G.L2.slice(4); inner += fp(smooth(Lw.map((p) => [p[0], p[1] + 0.7]).concat(Lw.map((p, i) => [p[0], p[1] + 0.9 + 1.6 * Math.sin(Math.PI * i / (Lw.length - 1))]).reverse()), true, 0.12), K.p300); }
    if (shadowed) inner += gy ? brimShadow(C, ch, M, 'A_light', X.sDy || 0) : fringeShadow(C, ch, M);
    // bare: the near cheek above the jaw (normally under the hair and the ear) gets a thin lit-side contour
    L.face = fp(OL.face, K.paper) + `<g ${ctx.clip(OL.face)}>${inner}</g>` + contour2(C, OL, M) +
      (bare ? ink(OL.N.filter((p) => p[1] >= -15 && p[1] <= M.Y(14)).reverse(), { w: 1.3, a: 0.3, b: 0.25 }) : '');
    // features (령's far eye is lit: her fringe shadow stops above it)
    const kind = X.eye || 'open', farShadow = gy && !vic && !bare;
    let ft = brow2(C, ch, -1, X.brow) + brow2(C, ch, 1, X.brow);
    ft += eye2(ctx, C, ch, -1, 'lit', kind, X);
    ft += farShadow ? eye2(ctx, C, ch, 1, 'shadow', kind === 'shut' ? 'shut' : 'open', { wake: X.wake, low: X.low, glint: kind === 'narrow' ? 0.75 : 1 }) : eye2(ctx, C, ch, 1, 'lit', kind === 'smile' ? 'open' : kind, X);
    ft += nose2(C, ch, M, who) + mouth2(C, ch, M, who, X.mouth || null);
    if (gy) {   // scar on the near (right) cheek, in the light: one rising brushed stroke and two stitches
      const sc = spl(proj(C, [[-16.5, Y(11.6), 23.6], [-12, Y(10), 27.4], [-8.4, Y(8.2), 29.6]]), 8);
      ft += ink(sc, { w: 1.05, a: 0.2, b: 0.3, dry: 0.25 });
      [0.36, 0.64].forEach((t) => { const i = Math.round(t * (sc.length - 1)), d = dirTo(sc[i - 1], sc[i + 1]), p = sc[i]; ft += ink(spl([[p[0] + d[1] * 1.3, p[1] - d[0] * 1.3], p, [p[0] - d[1] * 1.2, p[1] + d[0] * 1.2]], 2), { w: 0.6, a: 0.3, b: 0.3 }); });
    }
    if (X.splash && PN._hk && PN._hk.splat) { const p = C.p([-13, Y(18), 26.4]); ft += PN._hk.splat(p[0], p[1], 3.4, 7, 31, K.ink, 2.4); }
    if (X.sweat) { const p = C.p([-13.4, -11.6, 30.4]); ft += dropP(p[0], p[1], 4.6); }
    if (X.wake) {   // the near glint bleeds back into a cyan thread (ink · cyan · glow), no blur
      const G = eyeGeo(C, ch, -1), g = [G.ic[0] - 0.36 * G.rx, G.ic[1] - 0.2 * G.ry], p = [g, [g[0] - 9, g[1] - 3.2], [g[0] - 21, g[1] + 0.8]];
      ft += ink(spl(p, 5), { w: 3.2, a: 0.02, b: 0.6 }) + ink(spl(p, 5), { w: 2, a: 0.02, b: 0.6, fill: K.ally }) + ink(spl([g, [g[0] - 8, g[1] - 1.8], [g[0] - 18, g[1] + 2.6]], 5), { w: 0.85, a: 0.02, b: 0.6, fill: K.allyG });
    }
    L.features = ft;
    // front hair
    let fr = '';
    if (HAIRLINE[who]) {
      const cu = curtain(C, ch, OL, HAIRLINE[who], E, HU), clip = ctx.clip(cu.d);
      fr += fp(cu.d, K.ink);
      if (!gy) fr += `<g ${clip}>${H2.gaps(C, H)}${H2.sheen(C, H)}</g>`;
      fr += H2.front(C, ch, M, clip);
    } else fr += H2.front(C, ch, M);
    L.front = fr;
    if (who === 'dok') L.over = H2.towel(C, ch) + H2.knot(C);
    else if (H2.over) L.over = H2.over(C);
    else if (gy) {
      if (!PN._hk || !PN._hk.hat34) throw new Error('faceDrafts: load k-hero.js (PN._hk.hat34) before drawing 결');
      L.over = `<g transform="translate(${f(-C.s)} ${f(3.5 + (X.hatDy || 0))})">${PN._hk.hat34(PN._hk.Ctx({ pitch: 6 }), X.tilt == null ? 4 : X.tilt, 2)}</g>`;
    } else L.over = '';
    L.rot = X.rot || 0; L.pivot = [3 * C.s, 22]; L.info = { C, M, OL, H, E, ch };
    return L;
  }
  // portrait, direction A, rev 2 (160 box as rev 1; framing FRAME2)
  function portrait2(who, opts) {
    const expr = opts.expr || 'calm', X = exprSpec(who, expr), ctx = Ctx(), L = layers2(ctx, who, X), Fm = framing2(who), S = Fm.S, Cb = cam(30);
    const B = bust2(ctx, Cb, L.info.ch, who), hg = (m) => (L.rot ? `<g transform="rotate(${L.rot} ${f(L.pivot[0])} ${f(L.pivot[1])})">${m}</g>` : m);
    let cyan = '';
    if (who === 'gyeol') {
      if (!PN._hk || !PN._hk.scarfWrap) throw new Error('faceDrafts: load k-hero.js (PN._hk.scarfWrap) before drawing 결');
      const c1 = PN._hk.Ctx({ pitch: 6 });
      cyan = `<g transform="translate(1.4 40.6) scale(0.86)">${PN._hk.scarfWrap(c1, [0, 0], 0, { ends: false })}</g>`;
      ctx.defs.push(...c1.defs);
    }
    if (who === 'dok') {   // the strap over the near shoulder with its stitch line (ally dashes on paper white)
      const n = L.info.ch.neck, q = spl([[-n * 1.55, 36, -n * 0.9], [-n * 1.75, 37.4, 1], [-n * 1.62, 43, n * 1.05], [-n * 1.45, 56, n * 1.35]].map((p) => Cb.p(p)), 5);
      cyan = ribbon(q, 7.4, 7, { edge: 2 }) + `<path d="M ${q.map(P2).join(' L ')}" fill="none" stroke="${K.p50}" stroke-width="0.7" stroke-dasharray="1.6 1.5" stroke-linecap="round"/>`;
    }
    const head = L.back + L.mass + L.ears + L.face + L.features + L.front + L.over;
    let fig = L.behind + B.body + B.backC + hg(neck2(ctx, L.info.C, L.info.ch, L.info.M, L.info.OL, 52, who)) + B.front + cyan + hg(head);
    if (opts.construct) fig += hg(constructOverlay('A', who, L));
    let over = '';
    if (X.hand && who === 'gyeol' && PN._hk && PN._hk.hand) over = PN._hk.hand(PN._hk.Ctx({ pitch: 6 }), [160, 116], -106.8, 'point', { scale: 1.9 });
    if (opts.bg !== false && !PN.halftone) throw new Error('faceDrafts: load lib.js (PN.halftone) first');
    let s = `<g ${ctx.clip('M 80,6 A 74 74 0 1 1 79.9,6 Z')}>${opts.bg === false ? '' : bg2(expr)}<g transform="translate(${f(Fm.ox)} ${f(Fm.oy)}) scale(${S})">${fig}</g>${over}</g>`;
    if (opts.frame !== false) {
      s += `<circle cx="80" cy="80" r="74" fill="none" stroke="${K.ink}" stroke-width="6"/><circle cx="80" cy="80" r="78.5" fill="none" stroke="${K.p50}" stroke-width="2.4"/>`;
      if (expr === 'lowhp') s += `<circle cx="80" cy="80" r="74" fill="none" stroke="${HOSTD}" stroke-width="2.4" stroke-dasharray="14 6"/>`;
      if (expr === 'awakened') s += `<circle cx="80" cy="80" r="74" fill="none" stroke="${K.ally}" stroke-width="2.2" stroke-dasharray="6 5"/>`;
    }
    return ctx.wrap(s);
  }
  // @@REV2@@
  // ---- head assembly (brief §3.2-9 order). Head units, origin on the ear axis, eye line y 0 ----
  const EXPR = { calm: { rot: 0 }, hurt: { rot: -10 }, victory: { rot: -4 } };   // rot from k-hero.js EX (1571-1578)
  function shadowKey(dir, who, opt) {
    if (who !== 'gyeol') { if (opt) throw new Error('faceDrafts: shadow is for gyeol only'); return null; }
    const k = opt || (dir === 'A' ? 'light' : dir === 'B' ? 'band' : 'bible');
    const ok = { A: ['light', 'bible'], B: ['band'], C: ['bible', 'light'] }[dir];
    if (!ok.includes(k)) throw new Error('faceDrafts: unknown shadow ' + k + ' for direction ' + dir);
    return k;
  }
  function layers(ctx, dir, who, o) {
    o = o || {};
    const expr = o.expr || 'calm';
    if (!EXPR[expr] || (expr !== 'calm' && who !== 'gyeol')) throw new Error('faceDrafts: unknown expression ' + expr + ' for ' + who);
    const C = camFor(dir), M = model(who), ch = M.ch, OL = outline(C, M), H = shell(ch), E = skullE(C, H), Hd = HAIR[who], Y = M.Y;
    const sk = shadowKey(dir, who, o.shadow), vic = expr === 'victory', hurt = expr === 'hurt';
    const sides = dir === 'C' ? [-1] : [-1, 1];
    const inShadow = (side) => !vic && ((sk === 'light' && dir === 'A' && side > 0) || (sk === 'bible' && side < 0));
    const L = {};
    L.behind = Hd.behind ? Hd.behind(C, ch, M) : '';
    L.back = Hd.back ? Hd.back(C, ch, M) : '';
    L.neckC = { C, ch, M, OL };
    const HU = hull(E, OL.F.concat(OL.N).filter((p) => p[1] <= -13));
    L.mass = fp(HU.d, K.ink) + Hd.strands(C, H) + (Hd.sep ? Hd.sep(C, E) : '');
    L.ears = sides.map((sd) => ear(C, ch, M, sd)).join('');
    // face fill, then the face-clipped planes (one paper-shadow plane; 독's beard planes; 결's brim shadow)
    let inner = shadePlane(C, ch, M);
    if (who === 'dok') {
      const chinQ = [[-12.5, 15, 24], [-9, 22, 27.5], [-5, 26.5, 30], [0, 27.6, 31.4], [5, 26.5, 30], [9, 22, 27.5], [12.5, 15, 24]].map(([s, y, d]) => C.p([s, Y(y), d]));
      inner += fp(smooth(chinQ, false, 0.14) + ` L ${P2([chinQ[6][0] + 10, 60])} L ${P2([chinQ[0][0] - 10, 60])} Z`, K.p300);
      const upQ = [[-6.6, 16.6, 29.6], [0, 15.8, 32.8], [6.6, 16.6, 29.6]].map(([s, y, d]) => C.p([s, Y(y), d])), loQ = [[6.4, 18.4, 28.4], [0, 17.8, 32.6], [-6.4, 18.4, 28.4]].map(([s, y, d]) => C.p([s, Y(y), d]));
      inner += fp(smooth(upQ.concat(loQ), true, 0.16), K.p300);
    }
    if (sk) inner += sk === 'band' ? brimShadow(C, ch, M, 'B_band', vic ? -6 : 0) : brimShadow(C, ch, M, (dir === 'A' ? 'A_' : 'C_') + sk, vic ? -9 : 0);
    L.face = fp(OL.face, K.paper) + `<g ${ctx.clip(OL.face)}>${inner}</g>` + contour(C, OL, M);
    // features
    let ft = sides.map((sd) => brow(C, ch, sd, hurt ? -0.8 : vic ? -0.5 : 0)).join('');
    ft += sides.map((sd) => eye(ctx, C, ch, sd, inShadow(sd) ? 'shadow' : 'lit', hurt ? 'shut' : 'open')).join('');
    ft += nose(C, ch, M, who) + mouth(C, ch, M, hurt ? 'open' : vic ? 'smirk' : null);
    if (who === 'gyeol') {   // scar on the near (right) cheek, in the light: one rising stroke + 2 stitches
      const sc = spl(proj(C, [[-16.5, Y(11.6), 23.6], [-12, Y(10), 27.4], [-8.4, Y(8.2), 29.6]]), 6);
      ft += fp(brush(sc, tw(1.1, 0.12, 0.2)), K.ink);
      [0.36, 0.66].forEach((t) => { const i = Math.round(t * (sc.length - 1)), a = sc[i - 1], b = sc[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, p = sc[i]; ft += `<path d="M ${P2([p[0] + dy / l * 1.3, p[1] - dx / l * 1.3])} L ${P2([p[0] - dy / l * 1.3, p[1] + dx / l * 1.3])}" stroke="${K.ink}" stroke-width="0.6" stroke-linecap="round"/>`; });
    }
    if (who === 'dok') {     // nasolabial folds (both, where they face the viewer) and two smile lines at the near eye corner
      [-1, 1].forEach((sd) => {
        const Q = [[sd * (5 * 1.18 * 1.04 + 0.4), Y(13.6), 29.4], [sd * 8.4, Y(17.8), 27.6], [sd * 9.8, Y(21.6), 25.8]];
        if (C.z(Q[1]) > 2 && (dir !== 'C' || sd < 0)) ft += fp(brush(spl(proj(C, Q), 5), tw(0.85, 0.15, 0.4)), K.ink);
      });
      const G = eyeGeo(C, ch, -1), oc = G.U2[G.U2.length - 1];
      if (dir !== 'B' || true) ft += [[-0.4, 0.4], [0.9, 2.2]].map(([a, b]) => fp(brush(spl([[oc[0] - 1.2 - (dir === 'C' ? -0.6 : 0), oc[1] + a], [oc[0] - 2.6, oc[1] + a + 0.4 + b * 0.3], [oc[0] - 3.6, oc[1] + a + b]], 3), tw(0.6, 0.2, 0.4)), K.ink)).join('');
    }
    L.features = o.small ? smallFace(C, ch, M, who, dir, o.small) : ft;
    // front hair: curtain (월, 결), sheen and strays (small: the silhouette only)
    let fr = '';
    if (HAIRLINE[who]) {
      const cu = curtain(C, ch, OL, HAIRLINE[who], E, HU);
      fr += fp(cu.d, K.ink);
      if (who === 'wol' && !o.small) fr += `<g ${ctx.clip(cu.d)}>` + HAIR.wol.strands(C, H) + '</g>';
    }
    if (!o.small) fr += Hd.front(C, ch, M);
    else L.mass = fp(HU.d, K.ink);
    L.front = fr;
    L.over = who === 'dok' ? HAIR.dok.towel(C, ch) + (C.th >= 15 ? HAIR.dok.knot(C) : '') : '';
    if (who === 'gyeol') {
      const hat = PN._hk && PN._hk.hat34, hatF = PN._hk && PN._hk.hatFront;
      if (!hat || !hatF) throw new Error('faceDrafts: load k-hero.js (PN._hk.hat34, hatFront) before drawing 결');
      const c0 = PN._hk.Ctx({ pitch: 6 });
      const tilt = vic ? -8 : hurt ? -10 : dir === 'A' ? (sk === 'light' ? 4 : -3) : -3;
      const lift = vic ? -3 : hurt ? -1 : 0;
      L.over = `<g transform="translate(${f(-C.s)} ${f(3.5 + lift)})">` + (dir === 'B' ? hatF(c0, vic ? -6 : -4, false) : hat(c0, tilt, 2)) + '</g>';
      L.hatDefs = c0.defs;   // hat34 / hatFront write no ids of their own; kept for completeness
    }
    L.rot = EXPR[expr].rot;
    L.pivot = [3 * C.s, 22];
    L.info = { C, M, OL, H, E, ch, sk };
    return L;
  }
  // 64 px redraw of the face (brief §2.2 last table, §3.5): eye marks 1.4 × 1.8 px (B: two), a 1 px lash stroke up
  // from the outer corner for women, a 1 px mouth stroke; no nose, brows or other marks. small = px per head unit
  function smallFace(C, ch, M, who, dir, k) {
    const ex = 0.7 / k, ey = 0.9 / k, px = 1 / k, Y = M.Y;
    let s = '';
    (dir === 'B' ? [-1, 1] : [-1]).forEach((sd) => {
      const G = eyeGeo(C, ch, sd), c = G.ic;
      s += `<ellipse cx="${f(c[0])}" cy="${f(c[1] - 0.4)}" rx="${f(ex)}" ry="${f(ey)}" fill="${K.ink}"/>`;
      if (ch.eye.liner) { const o = G.U2[G.U2.length - 1], dx = Math.sign(o[0] - c[0]) || -1; s += `<path d="M ${P2([c[0] + dx * ex * 0.6, c[1] - ey * 0.5])} L ${P2([c[0] + dx * (ex + px * 0.55), c[1] - ey - px * 0.5])}" stroke="${K.ink}" stroke-width="${f(px * 0.9)}" stroke-linecap="round"/>`; }
    });
    const m = C.p([0, Y(19.5), 32.3]), w = dir === 'C' ? px * 0.9 : px * 1.4;
    s += `<path d="M ${P2([m[0] - w, m[1]])} L ${P2([m[0] + (dir === 'C' ? 0 : w), m[1]])}" stroke="${K.ink}" stroke-width="${f(px * 0.9)}" stroke-linecap="round"/>`;
    return s;
  }
  function neckLayer(ctx, L, yBot) { const { C, ch, M, OL } = L.neckC; return neck(ctx, C, ch, M, OL, yBot); }
  // pupils (projected iris centres) for framing and measuring
  function pupils(dir, who) {
    const C = camFor(dir), ch = person(who);
    return dir === 'C' ? [eyeGeo(C, ch, -1).ic] : [eyeGeo(C, ch, -1).ic, eyeGeo(C, ch, 1).ic];
  }
  // portrait framing (brief §3.2-8): A·B scale 1.58, origin (80 − xc·S, 76); C scale 1.42, origin (80 − xc·S, 78)
  function framing(dir, who) {
    const pu = pupils(dir, who), S = dir === 'C' ? 1.42 : 1.58;
    const xc = dir === 'C' ? pu[0][0] - 10 : (pu[0][0] + pu[1][0]) / 2 - (dir === 'A' ? 1 : 0);
    return { S, ox: 80 - xc * S, oy: dir === 'C' ? 78 : 76, xc };
  }

  // portrait(dir, who, opts) → 160 × 160. opts: { expr:'calm' (결: 'hurt' | 'victory'), shadow (결), bg:true,
  // frame:true, construct:false }
  function portrait(dir, who, opts) {
    opts = opts || {};
    camFor(dir); person(who);
    if (opts.rev != null && opts.rev !== 1 && opts.rev !== 2) throw new Error('faceDrafts: unknown rev ' + opts.rev);
    // direction A draws rev 2 unless rev 1 or the bible shadow (a rev 1 comparison) is asked for
    if (dir === 'A' && opts.rev !== 1 && opts.shadow !== 'bible') return portrait2(who, opts);
    if (!WHO.includes(who)) throw new Error('faceDrafts: ' + who + ' is drawn in direction A rev 2 only');
    const ctx = Ctx(), L = layers(ctx, dir, who, opts), Fm = framing(dir, who), S = Fm.S;
    const C = L.info.C, Cb = cam(dir === 'C' ? 90 : 30);
    const B = bustParts(ctx, Cb, L.info.ch, who);
    // the head bundle turns about the neck point for expression tilts; the bust stays
    const hg = (m) => (L.rot ? `<g transform="rotate(${L.rot} ${f(L.pivot[0])} ${f(L.pivot[1])})">${m}</g>` : m);
    let cyan = '';
    if (who === 'gyeol') {
      if (!PN._hk || !PN._hk.scarfWrap) throw new Error('faceDrafts: load k-hero.js (PN._hk.scarfWrap) before drawing 결');
      const c1 = PN._hk.Ctx({ pitch: 6 }), at = dir === 'C' ? [7, 41] : dir === 'B' ? [-4.6, 40.5] : [1.2, 40.5];
      cyan = `<g transform="translate(${f(at[0])} ${f(at[1])}) scale(${dir === 'C' ? '0.7 0.86' : '0.86'})">${PN._hk.scarfWrap(c1, [0, 0], 0, { ends: false })}</g>`;
      ctx.defs.push(...c1.defs);
    }
    if (who === 'dok') {   // the cyan strap over the near shoulder, close to the neck (never below the chest)
      const n = L.info.ch.neck, q = [[-n * 1.55, 36, -n * 0.9], [-n * 1.75, 37.4, 1], [-n * 1.62, 43, n * 1.05], [-n * 1.45, 56, n * 1.35]].map((p) => Cb.p(p));
      cyan = ribbon(spl(q, 5), 7.2, 6.8);
    }
    // order (brief §3.2-9, adapted): props behind the body, bust and back collar, neck (with the jaw band, clipped to
    // it), front collar and cyan, then the head bundle: bun/knot, hair mass, ears, face, features, front hair, towel/hat
    const head = L.back + L.mass + L.ears + L.face + L.features + L.front + L.over;
    let fig = L.behind + B.body + B.backC + hg(neckLayer(ctx, L, 52)) + B.front + cyan + hg(head);
    if (opts.construct) fig += hg(constructOverlay(dir, who, L));
    let bg = '';
    if (opts.bg !== false) {
      if (!PN.halftone) throw new Error('faceDrafts: load lib.js (PN.halftone) first');
      const vc = dir === 'A' ? [96, 70] : dir === 'B' ? [80, 70] : [94, 72];
      bg = `<rect width="160" height="160" fill="${K.paper}"/>` + PN.halftone(0, 0, 160, 160, 6, (x, y) => Math.max(0, Math.min(1.9, (Math.hypot(x - vc[0], y - vc[1]) - 40) / 30)), VIG, 45);
    }
    let s = `<g ${ctx.clip('M 80,6 A 74 74 0 1 1 79.9,6 Z')}>${bg}<g transform="translate(${f(Fm.ox)} ${f(Fm.oy)}) scale(${S})">${fig}</g></g>`;
    if (opts.frame !== false) s += `<circle cx="80" cy="80" r="74" fill="none" stroke="${K.ink}" stroke-width="6"/><circle cx="80" cy="80" r="78.5" fill="none" stroke="${K.p50}" stroke-width="2.4"/>`;
    return ctx.wrap(s);
  }
  // construction overlay (review colours, construct: true only): red midline, blue level lines (brow, eye, nose base,
  // mouth, chin), green dashed terminator, red feature points
  function constructOverlay(dir, who, L) {
    const { C, M, OL, ch } = L.info, Y = M.Y, P = C.p;
    const mid = [M.mid(-26), M.mid(-11), M.N.root, M.N.ridge, M.N.tip, M.N.sub, [0, Y(19.5) + 0.4, 32.3], M.mid(27.5), M.mid(32.6)].map(P);
    let s = `<path d="M ${mid.map(P2).join(' L ')}" fill="none" stroke="${DBG.mid}" stroke-width="0.5"/>`;
    [-9 + (ch.brow.y || 0), 0, M.N.sub[1], Y(19.5), Y(27.5)].forEach((y) => { s += `<path d="M ${f(OL.atN(y))},${f(y)} L ${f(OL.at(y))},${f(y)}" fill="none" stroke="${DBG.lev}" stroke-width="0.4"/>`; });
    const T = shadeQ(C, ch, M);
    s += `<path d="${smooth(T.Q, T.closed, 0.12)}" fill="none" stroke="${DBG.term}" stroke-width="0.5" stroke-dasharray="1.6 1.2"/>`;
    const pts = [P(M.N.root), P(M.N.tip), P(M.N.sub), P(M.mid(27.5))];
    (dir === 'C' ? [-1] : [-1, 1]).forEach((sd) => { const G = eyeGeo(C, ch, sd); pts.push(G.ic, G.U2[0], G.U2[G.U2.length - 1]); });
    const cw = ch.mouth.cw * ch.ws;
    pts.push(P([-cw, Y(19.5) - 0.5, 27.6]), P([0, Y(19.5) + 0.4, 32.3]));
    if (dir !== 'C') pts.push(P([cw, Y(19.5) - 0.5, 27.6]));
    return s + pts.map((p) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="0.6" fill="${DBG.mid}"/>`).join('');
  }
  function construct(dir, who) { return portrait(dir, who, { construct: true, bg: false }); }

  // measure(dir, who) → plain numbers for the brief's §3.8 checks and §2.2 (data only, no drawing)
  function measure(dir, who, mo) {
    const r2v = !!(mo && mo.rev === 2), C = camFor(dir), M = model(who, r2v ? REV2[who] : null), ch = r2v ? ch2(who) : M.ch, OL = outline(C, M), Y = M.Y, P = C.p, E = ch.eye;
    const r1 = (v) => Math.round(v * 10) / 10, r2 = (v) => Math.round(v * 100) / 100;
    const eyeM = (side) => {
      const G = eyeGeo(C, ch, side), all = G.U2.concat(G.L2), xs = all.map((p) => p[0]);
      let open = 0; G.U2.forEach((p, i) => { open = Math.max(open, G.L2[i][1] - p[1]); });
      return { G, x0: Math.min(...xs), x1: Math.max(...xs), w: Math.max(...xs) - Math.min(...xs), open, inner: G.U2[0], outer: G.U2[G.U2.length - 1] };
    };
    const o = { dir, who, theta: C.th };
    const eN = eyeM(-1);
    o.eyeNear = [r1(eN.x0), r1(eN.x1)]; o.pupilNear = r1(eN.G.ic[0]); o.pupilY = r1(eN.G.ic[1]);
    const root = P(M.N.root), tip = P(M.N.tip), sub = P(M.N.sub), pog = P(M.mid(27.5)), cw = ch.mouth.cw * ch.ws, my = Y(19.5);
    o.root = r1(root[0]); o.tip = [r1(tip[0]), r1(tip[1])]; o.sub = r1(sub[0]);
    o.mouth = [P([-cw, my, 27.6])[0], P([0, my, 32.3])[0], P([cw, my, 27.6])[0]].map(r1); o.mouthY = r1(my);
    o.chinTip = [r1(pog[0]), r1(pog[1])];
    o.farContour = [-8, 0, 5, 10, 15, 20, 25, 30].map((y) => [y, r1(OL.at(y))]);
    o.nearEdge = [0, 10, 15, 20, 25].map((y) => [y, r1(OL.atN(y))]);
    let inc = 0, prev = Infinity, maxRise = 0;
    for (const p of OL.F) if (p[1] >= 6 && p[1] <= pog[1]) { if (p[0] > prev + 0.01) { inc++; maxRise = Math.max(maxRise, p[0] - prev); } prev = p[0]; }
    o.farContourRises = inc; o.farContourMaxRise = r2(maxRise);
    if (dir !== 'C') {
      const eF = eyeM(1);
      o.eyeFar = [r1(eF.x0), r1(eF.x1)]; o.pupilFar = r1(eF.G.ic[0]);
      o.farOverNear = r2(eF.w / eN.w);
      o.farEyeGap = r1(OL.at(eF.outer[1]) - eF.x1);
      o.tipMinusFarInner = r1(tip[0] - eF.inner[0]);
      o.mouthMinusRoot = r1(o.mouth[1] - root[0]);
      o.chinMinusRoot = r1(pog[0] - root[0]);
      if (dir === 'B') {
        o.symEyes = r2(Math.max(Math.abs(eN.x0 + eF.x1), Math.abs(eN.x1 + eF.x0)));
        o.symMouth = r2(Math.abs(o.mouth[0] + o.mouth[2]));
        o.symContour = r2(Math.max(...[0, 10, 20, 30].map((y) => Math.abs(OL.at(y) + OL.atN(y)))));
      }
    } else {
      o.eyeFrontBehindRoot = r1(root[0] - eN.x1);
      // E-line: nose tip → chin point; lips = the profile's most forward points above and below the mouth line
      const seg = (y0, y1) => OL.F.filter((p) => p[1] >= y0 && p[1] <= y1).reduce((a, p) => (p[0] > a[0] ? p : a), [-1e9, 0]);
      const ul = seg(Y(15.5), my), ll = seg(my, Y(24.5)), ex = pog[0] - tip[0], ey = pog[1] - tip[1], el = Math.hypot(ex, ey);
      const dist = (p) => ((p[0] - tip[0]) * ey - (p[1] - tip[1]) * ex) / el;   // + = behind the line (toward the face)
      o.lipsInsideEline = [r1(-dist(ul)), r1(-dist(ll))];
      const ec = [[-6, 1.5], [13.8, -0.6], [1, -7.3], [6, -6.4]].map(([y, d]) => P([-(25.4 * ch.ws + 3.5 * cl(-d / 7, 0, 1)), Y(y), d]));
      o.earCenterX = r1((Math.min(...ec.map((p) => p[0])) + Math.max(...ec.map((p) => p[0]))) / 2);
    }
    // shade plane share of the face (grid sampling)
    const T = shadeQ(C, ch, M), TQ = T.closed ? spl(T.Q.concat([T.Q[0]]), 4) : (() => { const q = spl(T.Q, 4), l = q[q.length - 1]; return q.concat([[l[0] + 30, l[1] + 4], [q[0][0] + 30, q[0][1] - 4]]); })();
    const FP = OL.poly; let nf = 0, ns = 0;
    const xs = FP.map((p) => p[0]), ys = FP.map((p) => p[1]);
    for (let x = Math.min(...xs); x <= Math.max(...xs); x += 0.5) for (let y = Math.min(...ys); y <= Math.max(...ys); y += 0.5) if (inside(FP, x, y)) { nf++; if (inside(TQ, x, y)) ns++; }
    o.shadeShare = r2(ns / nf);
    // proportions (§2.1): eye-line position in the head height (crown → chin), lower face vs middle face
    const chin = Y(32.6), browY = -9 + (ch.brow.y || 0);
    o.eyeLineRatio = r2(-ch.crown / (chin - ch.crown));
    o.lowerOverMiddle = r2((chin - M.N.sub[1]) / (M.N.sub[1] - browY));
    // eye numbers (model, i.e. the front view): width ratio to the face, height / width, iris, lid cover
    const ew = (E.so - E.si) * ch.ws, Cf = cam(0), Gf = eyeGeo(Cf, ch, -1);
    let openF = 0; Gf.U2.forEach((p, i) => { openF = Math.max(openF, Gf.L2[i][1] - p[1]); });
    const hlQ = HAIRLINE[who] ? HAIRLINE[who].filter((q) => q[1] > -20 && q[1] < 9).map((q) => [q[1], q[0]]).sort((a, b) => a[0] - b[0]) : [];
    const hl = hlQ.length > 1 && hlQ[0][0] < 0 && hlQ[hlQ.length - 1][0] > 0 ? kf(hlQ)(0) * ch.ws : null;
    const iu = (11.3 - E.si) / (E.so - E.si), yb = lerp(E.yi, E.yo, iu), lidY = yb - E.hu * Math.sin(Math.PI * Math.pow(iu, 0.85)), top = -0.6 - E.ri * 1.04;
    o.eye = { width: r2(ew), overFaceWidth: r2(ew / (2 * OLw0(M))), overVisibleFace: hl ? r2(ew / (2 * hl)) : null, heightOverWidth: r2(openF / ew), irisOverWidth: r2(2 * E.ri / ew), lidCover: r2((lidY - top) / (2 * E.ri * 1.04)), outerLift: r2(E.yi - E.yo) };
    o.jawSharpest = r1(sharpest(OL.N.filter((p) => p[1] >= 4)));
    // v0.3 checks (B8 review 2): brow arch height (+ = arched up; ≈ 0 = straight), mouth width, ws · jw (F1); how much of
    // the near iris shows between the lids (F2); the near contour's bulge at y 4…10 over the chord y 0 → 14, the jaw turn
    // at y 14…26, jaw width over cheekbone width (F3); 령's fringe edge above the far upper lid (F5)
    const Bp = (ch.brow.pts || BROW0).map(([s, y]) => [s, y + (ch.brow.y || 0)]), [h0, pk, t0] = Bp;
    o.browArch = r2(lerp(h0[1], t0[1], (pk[0] - h0[0]) / (t0[0] - h0[0])) - pk[1]);
    o.browPeakAt = r2((pk[0] - h0[0]) / (t0[0] - h0[0])); o.browW = ch.brow.w;
    o.mouthWidth = r1(2 * ch.mouth.cw * ch.ws); o.ws = ch.ws; o.jw = ch.jw;
    if (E.liner) o.wing = (E.wing || [3.2, 1.9]).slice();
    // near iris between the lid LINES (nearIrisVisible) and between the lid INKS (nearIrisInk: the upper stroke's lower
    // edge to the lower stroke's upper edge — what the eye sees at 8×)
    const Gn = eyeGeo(C, ch, -1), uY = atX(Gn.U2, Gn.ic[0]), lY = atX(Gn.L2, Gn.ic[0]);
    if (uY != null && lY != null) {
      const top = Gn.ic[1] - Gn.ry, bot = Gn.ic[1] + Gn.ry, tI = cl((Gn.ic[0] - Gn.U2[0][0]) / (Gn.U2[Gn.U2.length - 1][0] - Gn.U2[0][0]), 0, 1);
      const hU = E.lid / 2 * lidWf(E, tI) * (1 - (E.lidOff || 0)), hL = (E.liner ? 0.95 : 0.8) / 2 * (1 - (E.loOff || 0));
      o.nearIrisVisible = r2((Math.min(lY, bot) - Math.max(uY, top)) / (2 * Gn.ry));
      o.nearIrisInk = r2((Math.min(lY - hL, bot) - Math.max(uY + hU, top)) / (2 * Gn.ry));
    }
    if (dir !== 'C') {
      const a0 = [OL.atN(0), 0], a1 = [OL.atN(14), 14];
      let bulge = 0; for (let y = 4; y <= 10; y += 0.5) bulge = Math.max(bulge, lerp(a0[0], a1[0], y / 14) - OL.atN(y));
      o.nearBulge = r2(bulge);
      o.jawTurn = r1(sharpest(OL.N.filter((p) => p[1] >= 14 && p[1] <= 26)));
      o.jawOverCheek = r2((OL.at(22) - OL.atN(22)) / (OL.at(3) - OL.atN(3)));
    }
    if (who === 'ryeong' && dir === 'A') {
      const Bf = fringePts(C, ch, M), Gf = eyeGeo(C, ch, 1);
      o.fringeAboveFarLid = r1(Math.min(...Gf.U2.map((p) => { const y = atX(Bf, p[0]); return y == null ? 99 : p[1] - y; })));
    }
    return o;
  }
  const OLw0 = (M) => { const ring = M.dense.find((r) => Math.abs(r[0]) < 0.33) || M.dense[40]; return Math.max(...ring[1].map((q) => q[0])); };
  // the smallest turning angle along a polyline (3 u chords): 180° = straight
  function sharpest(L) {
    let mn = 180;
    for (let i = 0; i < L.length; i++) {
      const a = L.slice(0, i).reverse().find((p) => Math.hypot(p[0] - L[i][0], p[1] - L[i][1]) >= 3), b = L.slice(i + 1).find((p) => Math.hypot(p[0] - L[i][0], p[1] - L[i][1]) >= 3);
      if (!a || !b) continue;
      const v1 = [a[0] - L[i][0], a[1] - L[i][1]], v2 = [b[0] - L[i][0], b[1] - L[i][1]];
      mn = Math.min(mn, Math.acos(cl((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2)), -1, 1)) / Rd);
    }
    return mn;
  }
  // ---- full bodies: 400 × 640 box, pivot (200, 600) ----
  const part = (d, fill, w) => fp(d, fill, OLs(w == null ? 3.6 : w));
  const ground = (o, rx) => (o.ground === false ? '' : `<ellipse cx="200" cy="600" rx="${rx}" ry="${f(rx * 0.15)}" fill="${K.ink}" opacity="0.22"/><ellipse cx="200" cy="600" rx="${f(rx * 0.62)}" ry="${f(rx * 0.08)}" fill="${K.ink}" opacity="0.32"/>`);
  // ink soaking UP from a cloth edge (the ally rule, bible §6-7): a ragged band over the polyline P, rising by h
  function hemBand(P, h, seed) {
    let r = seed || 3; const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    const dense = spl(P, 4), top = dense.map((p) => [p[0], p[1] - h * (0.55 + 0.7 * rnd())]);
    return fp(smooth(top, false, 0.2) + ' L ' + dense.slice().reverse().map((p) => P2([p[0], p[1] + 2])).join(' L ') + ' Z', K.ink);
  }
  const tstroke = (P, w, fill, a, b) => fp(brush(spl(P, 6), tw(w, a == null ? 0.15 : a, b == null ? 0.3 : b, 0.6)), fill || K.ink);
  // A — 결 3/4: the existing body (PN.heroKit.full threeQuarter without its head) under the new head, placed with
  // translate(219 134) rotate(3) scale(1.04) translate(0.5 −3.5) (the old head's skull centre and −3.5 eye line)
  function fullA(ctx, o) {
    const HK = PN.heroKit, H = PN._hk;
    if (!HK || !HK.full || !HK.POSES || !H || !H.scarfWrap) throw new Error('faceDrafts: load k-hero.js before full("A")');
    const P0 = HK.POSES.threeQuarter, T = 'translate(219 134) rotate(3) scale(1.04) translate(0.5 -3.5)';
    const body = HK.full(Object.assign({}, P0, { order: P0.order.filter((k) => k !== 'head') }), { ground: o.ground !== false });
    const c1 = H.Ctx({ pitch: 6 }), scarf = H.scarfWrap(c1, [216, 176], 0, {});
    ctx.defs.push(...c1.defs);
    // hat strings with beads (결's costume): from the brim by the near ear and the far temple down to the chest
    const beads = H.beads ? `<path d="M -15.5,-10.5 C -12.5,7.5 -8.5,23.5 -6.5,33.5" fill="none" stroke="${K.ink}" stroke-width="1.2"/>` + H.beads([-6.5, 34.5], [-0.5, 63.5], [8.5, 91.5], 11, 2.2) + H.beads([24.5, 41.5], [23.5, 65.5], [16.5, 93.5], 10, 2) : '';
    if (o.rev === 1 || o.small) {   // rev 1 head (and the 64 px redraw, which keeps the rev 1 silhouette path)
      const L = layers(ctx, 'A', 'gyeol', { shadow: 'light', small: o.small ? 0.115 * 1.04 : 0 });
      return body + `<g transform="${T}">${neckLayer(ctx, L, 62)}</g>` + scarf + `<g transform="${T}">${L.back + L.mass + L.ears + L.face + L.features + L.front + beads + L.over}</g>`;
    }
    // rev 2 (v0.3 F2): the new head ×1.10 with its eye line at the old −1.6, so its chin tip lands on the old chin (old
    // y 32.5, box y ≈ 168); the hat and the bead strings stay where the old head had them; the neck tucks under the scarf
    const T0 = 'translate(219 134) rotate(3) scale(1.04)', T2 = T0 + ' translate(0.5 -1.6) scale(1.1)';
    const L = layers2(ctx, 'gyeol', EX2.calm), I = L.info;
    const oldBeads = H.beads ? `<path d="M -15,-14 C -12,4 -8,20 -6,30" fill="none" stroke="${K.ink}" stroke-width="1.2"/>` + H.beads([-6, 31], [0, 60], [9, 88], 11, 2.2) + H.beads([25, 38], [24, 62], [17, 90], 10, 2) : '';
    return body + `<g transform="${T2}">${neck2(ctx, I.C, I.ch, I.M, I.OL, 50, 'gyeol')}</g>` + scarf +
      `<g transform="${T2}">${L.back + L.mass + L.ears + L.face + L.features + L.front}</g>` +
      `<g transform="${T0}">${oldBeads}${H.hat34(H.Ctx({ pitch: 6 }), 4, 2)}</g>`;
  }
  // B — 월 front: 6.6 heads (feet → bun top ≈ 520), body turned ≈ 10°, short jeogori, bell skirt to the ground (hem ≈ 2×
  // the shoulders), the hollow waist ring (1.3× the hem: paper band, ink rim, ink crescent on its back right = the
  // eclipse), two cyan ribbons from the ring, face B. Head: origin (200, 129), scale 1.16
  const WOL_FULL = { hx: 200, hy: 129, hs: 1.16, ring: { cx: 200, cy: 306, rx: 113, ry: 25, w: 7.5 } };
  function ringBand(R, a0, a1, fill, w) {
    const o = [], i = [];
    for (let k = 0; k <= 40; k++) { const a = (a0 + (a1 - a0) * k / 40) * Rd; o.push([R.cx + (R.rx + R.w / 2) * Math.cos(a), R.cy + (R.ry + R.w / 3) * Math.sin(a)]); i.push([R.cx + (R.rx - R.w / 2) * Math.cos(a), R.cy + (R.ry - R.w / 3) * Math.sin(a)]); }
    return part('M ' + o.map(P2).join(' L ') + ' L ' + i.reverse().map(P2).join(' L ') + ' Z', fill, w == null ? 3 : w);
  }
  function fullB(ctx, o) {
    const W = WOL_FULL, R = W.ring, L = layers(ctx, 'B', 'wol', { small: o.small ? 0.115 * W.hs : 0 }), Hg = (m) => `<g transform="translate(${W.hx} ${W.hy}) scale(${W.hs})">${m}</g>`;
    let s = ground(o, 100);
    // the ring's back half behind the body, with the eclipse crescent on its back right quarter
    s += ringBand(R, 180, 360, K.p50);
    const cr = []; for (let k = 0; k <= 30; k++) { const t = k / 30, a = (276 + 70 * t) * Rd, w = R.w * 0.9 * Math.sin(Math.PI * t); cr.push([[R.cx + (R.rx + R.w / 2 - 0.4) * Math.cos(a), R.cy + (R.ry + R.w / 3 - 0.3) * Math.sin(a)], [R.cx + (R.rx + R.w / 2 - 0.4 - w) * Math.cos(a), R.cy + (R.ry + R.w / 3 - 0.3 - w * 0.66) * Math.sin(a)]]); }
    s += fp('M ' + cr.map((q) => P2(q[0])).join(' L ') + ' L ' + cr.map((q) => P2(q[1])).reverse().join(' L ') + ' Z', K.ink);
    s += Hg(L.behind);
    // skirt: bell to the ground, paper, shade plane on the right, folds, ink soaking up from the hem, toe tips
    const sk = 'M 158,226 C 146,300 128,420 112,588 C 130,596 152,592 170,597 C 190,601 210,595 230,599 C 252,602 270,594 290,590 C 276,430 258,300 244,226 Z';
    s += part(sk, K.paper, 4) + `<g ${ctx.clip(sk)}>` + fp('M 232,226 C 246,330 262,450 274,600 L 300,600 L 300,226 Z', K.p300) +
      [[176, 236, 160, 420, 140, 592], [194, 240, 188, 430, 180, 596], [214, 240, 222, 430, 232, 598], [230, 236, 248, 420, 262, 592]].map((q, i) => tstroke([[q[0], q[1]], [q[2], q[3]], [q[4], q[5]]], i % 2 ? 1.6 : 2.2, K.ink, 0.5, 0.15)).join('') +
      hemBand([[110, 590], [150, 593], [190, 598], [230, 598], [270, 594], [292, 590]], 11, 5) + '</g>';
    s += part('M 172,596 C 176,588 190,588 194,594 C 190,600 178,602 172,596 Z', K.ink, 2) + part('M 208,597 C 212,589 226,589 230,595 C 226,601 214,603 208,597 Z', K.ink, 2);
    // neck first (the jeogori covers its base), then the sleeves: sloped shoulders, a curved underside (배래), ink cuff
    // bands (끝동); the hands hold the ring's front
    s += Hg(neckLayer(ctx, L, 62));
    const slv = (d, cuff, fill) => part(d, fill, 3.6) + `<g ${ctx.clip(d)}>${fp(cuff, K.ink)}</g>`;
    s += slv('M 168,186 C 154,192 146,204 142,222 C 136,252 130,284 126,312 C 134,318 144,320 152,318 C 152,292 158,262 166,240 Z', 'M 110,300 C 130,300 150,304 172,308 L 172,334 L 110,334 Z', K.paper);
    s += slv('M 232,186 C 246,192 254,204 258,222 C 264,252 270,284 274,312 C 266,318 256,320 248,318 C 248,292 242,262 234,240 Z', 'M 228,308 C 250,304 270,300 290,300 L 290,334 L 228,334 Z', K.p300);
    // jeogori body: short, sloped shoulders from the neck, the hem curving down at the front; shade plane on the right
    const jg = 'M 186,178 C 178,182 168,184 160,190 C 154,204 154,222 158,244 C 176,250 192,254 202,256 C 216,252 230,248 242,244 C 246,222 246,204 240,190 C 232,184 222,182 214,178 Z';
    s += part(jg, K.paper, 3.6) + `<g ${ctx.clip(jg)}>${fp('M 226,170 C 234,196 236,220 236,260 L 260,260 L 260,170 Z', K.p300)}</g>`;
    // collar (wearer's left over right): inner collar, then the outer one with the paper 동정; 고름 (ink) at the closing
    s += tstroke([[188, 177], [196, 196], [212, 214]], 8, K.ink, 0.05, 0.1) + tstroke([[214, 176], [206, 196], [186, 226]], 9, K.ink, 0.05, 0.08) + tstroke([[213, 175], [205.5, 193], [189, 219]], 3, K.p50, 0.08, 0.12);
    s += part('M 186,224 C 176,220 168,226 172,232 C 176,236 184,232 186,224 Z', K.ink, 1.5) + tstroke([[184, 228], [178, 252], [176, 284]], 5.4, K.ink, 0.05, 0.25) + tstroke([[188, 229], [190, 256], [196, 280]], 4.4, K.ink, 0.05, 0.25);
    s += Hg(L.back + L.mass + L.ears + L.face + L.features + L.front + L.over);
    // hands on the ring's front arc, then the front half of the ring over them, the ribbons from its left side
    s += ringBand(R, 0, 180, K.p50);
    s += part('M 124,314 C 118,320 120,330 128,332 C 136,334 142,326 140,318 Z', K.paper, 2.4) + part('M 278,314 C 284,320 282,330 274,332 C 266,334 260,326 262,318 Z', K.paper, 2.4);
    s += ribbon(spl([[90, 312], [70, 330], [56, 358], [50, 392], [54, 424]], 5), 9, 7, { end: 'fork', edge: 2.6, glow: 1.6 }) + ribbon(spl([[96, 318], [86, 346], [84, 378], [92, 410], [104, 436]], 5), 8, 6, { end: 'fork', edge: 2.6, glow: 1.4 });
    return s;
  }
  // C — 독 side, facing right: ≈ 560 to the top of the 지게, head ≈ 0.16 of the height, belly forward, wide stance,
  // ink leggings, a small jar in hand; the 지게 (two ink poles, two crossbars) with three white porcelain jars (ink
  // lids, cyan strings), the cyan strap over the shoulder; towel and knot ends; face C. Head: origin (212, 150), 1.3
  const DOK_FULL = { hx: 214, hy: 158, hs: 1.3 };
  function jar(cx, cy, r, seed) {
    const body = `M ${P2([cx - r * 0.42, cy - r * 0.86])} C ${P2([cx - r * 1.2, cy - r * 0.7])} ${P2([cx - r * 1.12, cy + r * 0.8])} ${P2([cx - r * 0.5, cy + r])} L ${P2([cx + r * 0.5, cy + r])} C ${P2([cx + r * 1.12, cy + r * 0.8])} ${P2([cx + r * 1.2, cy - r * 0.7])} ${P2([cx + r * 0.42, cy - r * 0.86])} Z`;
    let s = part(body, K.p50, 3.4) + fp(`M ${P2([cx + r * 0.25, cy - r * 0.7])} C ${P2([cx + r * 0.95, cy - r * 0.4])} ${P2([cx + r * 0.95, cy + r * 0.6])} ${P2([cx + r * 0.42, cy + r * 0.95])} L ${P2([cx + r * 0.5, cy + r])} C ${P2([cx + r * 1.12, cy + r * 0.8])} ${P2([cx + r * 1.2, cy - r * 0.7])} ${P2([cx + r * 0.42, cy - r * 0.86])} Z`, K.p300);
    s += tstroke([[cx - r * 0.75, cy - r * 0.35], [cx - r * 0.84, cy + r * 0.1], [cx - r * 0.7, cy + r * 0.55]], Math.max(1.6, r * 0.09), K.paper, 0.3, 0.3);
    // neck rim, cyan string, ink lid with one drip
    s += part(`M ${P2([cx - r * 0.48, cy - r * 0.86])} L ${P2([cx + r * 0.48, cy - r * 0.86])} L ${P2([cx + r * 0.42, cy - r * 1.02])} L ${P2([cx - r * 0.42, cy - r * 1.02])} Z`, K.paper, 2.4);
    s += part(`M ${P2([cx - r * 0.5, cy - r * 0.84])} C ${P2([cx - r * 0.2, cy - r * 0.74])} ${P2([cx + r * 0.2, cy - r * 0.74])} ${P2([cx + r * 0.5, cy - r * 0.84])} L ${P2([cx + r * 0.52, cy - r * 0.7])} C ${P2([cx + r * 0.2, cy - r * 0.6])} ${P2([cx - r * 0.2, cy - r * 0.6])} ${P2([cx - r * 0.52, cy - r * 0.7])} Z`, K.ally, 2);
    s += part(`M ${P2([cx - r * 0.52, cy - r * 1.02])} C ${P2([cx - r * 0.4, cy - r * 1.32])} ${P2([cx + r * 0.4, cy - r * 1.32])} ${P2([cx + r * 0.52, cy - r * 1.02])} Z`, K.ink, 2.4);
    s += tstroke([[cx + r * 0.3 + (seed || 0), cy - r * 1.0], [cx + r * 0.34 + (seed || 0), cy - r * 0.7], [cx + r * 0.3 + (seed || 0), cy - r * 0.45]], Math.max(1.4, r * 0.07), K.ink, 0.1, 0.5);
    return s;
  }
  function fullC(ctx, o) {
    const D = DOK_FULL, L = layers(ctx, 'C', 'dok', { small: o.small ? 0.115 * D.hs : 0 }), Hg = (m) => `<g transform="translate(${D.hx} ${D.hy}) scale(${D.hs})">${m}</g>`;
    let s = ground(o, 128);
    // the load on the 지게 shelf behind the back: three white jars stacked (largest lowest), then the frame in front
    s += jar(84, 386, 46, 1) + jar(90, 288, 37, -1) + jar(96, 206, 27, 0.5);
    s += tstroke([[100, 506], [114, 300], [130, 62]], 9, K.ink, 0.02, 0.02) + tstroke([[122, 516], [138, 300], [152, 50]], 10, K.ink, 0.02, 0.02);
    s += tstroke([[94, 236], [146, 230]], 7, K.ink, 0.05, 0.05) + tstroke([[88, 330], [152, 324]], 7, K.ink, 0.05, 0.05) + tstroke([[120, 438], [58, 424], [38, 426]], 7, K.ink, 0.05, 0.3) + tstroke([[128, 50], [154, 46]], 6, K.ink, 0.05, 0.05);
    // far leg (paper shade) and near leg: baggy trousers gathered at the knee, ink leggings (행전) with a paper tie,
    // ink straw-shoe shapes; wide stance
    const leg = (d, fill, lg, ties, shoe) => part(d, fill, 3.6) + part(lg, K.ink, 3) + ties.map((t) => tstroke(t, 1.8, K.p50, 0.1, 0.1)).join('') + part(shoe, K.ink, 2.6);
    s += leg('M 184,384 C 166,414 152,446 150,474 C 160,482 176,484 188,478 C 192,452 204,426 214,402 Z', K.p300, 'M 154,476 L 184,480 C 182,512 178,542 176,564 L 152,564 C 152,538 152,506 154,476 Z', [[[153, 506], [182, 509]], [[152, 538], [179, 541]]], 'M 146,562 L 180,561 C 188,570 192,586 190,597 L 132,597 C 132,584 136,570 146,562 Z');
    s += leg('M 236,384 C 256,410 274,440 282,468 C 272,478 256,482 246,478 C 240,452 228,426 214,404 Z', K.paper, 'M 250,476 L 280,468 C 286,500 290,532 292,560 L 264,564 C 260,536 254,506 250,476 Z', [[[253, 500], [283, 494]], [[258, 534], [288, 529]]], 'M 260,560 L 294,558 C 308,564 320,580 324,597 L 256,597 C 254,584 255,570 260,560 Z');
    // torso: hunched shoulders under the frame, chest, big belly forward, paper jeogori with its shade plane under the
    // belly, the ink belt (전대) under the belly's curve, ink soaking up from the jeogori hem
    const tor = 'M 196,184 C 178,192 166,212 162,240 C 156,280 156,330 162,362 C 166,384 174,398 186,404 C 214,410 252,408 278,396 C 300,382 312,350 308,318 C 304,284 290,254 272,232 C 262,218 252,206 240,196 C 226,190 210,186 196,184 Z';
    s += part(tor, K.paper, 4) + `<g ${ctx.clip(tor)}>${fp('M 312,300 C 310,350 292,384 252,404 L 330,430 L 330,300 Z', K.p300)}${fp('M 156,356 C 204,368 262,368 312,344 L 312,362 C 262,386 204,386 156,374 Z', K.ink)}${hemBand([[168, 398], [208, 408], [248, 406], [284, 394]], 9, 7)}${tstroke([[214, 250], [236, 290], [262, 312]], 2.4, K.ink, 0.3, 0.3)}</g>`;
    // the cyan strap from the frame over the shoulder to the armpit (never below the chest), then the short thick neck
    s += ribbon(spl([[146, 226], [170, 200], [198, 192], [214, 212], [214, 248], [176, 268]], 5), 11, 10, { edge: 2.6, glow: 1.6 });
    s += Hg(neckLayer(ctx, L, 46));
    // collar (ink 깃 + paper 동정) running down into the jeogori's front opening over the belly, an ink 고름 at the chest
    s += tstroke([[226, 198], [242, 216], [254, 240]], 8, K.ink, 0.04, 0.08) + tstroke([[227, 199], [241, 214], [250, 232]], 2.8, K.p50, 0.06, 0.1);
    s += tstroke([[254, 240], [276, 276], [292, 316], [294, 350]], 2.6, K.ink, 0.05, 0.1) + part('M 262,250 C 256,244 248,248 250,256 C 252,262 260,260 262,250 Z', K.ink, 1.4) + tstroke([[258, 256], [262, 280], [268, 300]], 4.2, K.ink, 0.05, 0.3);
    // near arm: a wide sleeve from the shoulder to the elbow, the forearm forward, the hand holding a small jar
    s += part('M 200,214 C 186,240 186,280 202,306 C 214,318 230,318 240,310 C 236,284 236,256 240,232 C 230,218 216,212 200,214 Z', K.paper, 3.6) + fp(brush([[204, 236], [200, 270], [210, 300]], tw(3.4, 0.2, 0.2)), K.p300) +
      tstroke([[230, 244], [226, 270], [230, 296]], 2, K.ink, 0.3, 0.3) + tstroke([[214, 300], [224, 306], [236, 306]], 1.8, K.ink, 0.3, 0.3);
    s += part('M 220,300 C 244,312 264,316 282,312 L 280,290 C 262,292 248,290 236,284 Z', K.paper, 3.6) + hemBand([[262, 314], [282, 312]], 5, 4);
    s += jar(302, 300, 15, 0) + part('M 278,286 C 290,284 296,294 294,304 C 292,314 282,318 274,312 Z', K.paper, 2.6);
    s += Hg(L.back + L.mass + L.ears + L.face + L.features + L.front + L.over);
    return s;
  }
  // full(dir, opts) → 400 × 640, pivot (200, 600). opts: { ground: true, small: false }
  function full(dir, opts) {
    opts = opts || {};
    if (!(dir in DIRS)) throw new Error('faceDrafts: unknown direction ' + dir);
    const ctx = Ctx(), o = Object.assign({}, opts, opts.small ? { ground: false } : {});
    const fig = dir === 'A' ? fullA(ctx, o) : dir === 'B' ? fullB(ctx, o) : fullC(ctx, o);
    if (!opts.small) return ctx.wrap(fig);
    // small (64 px check, --scale ≈ 0.115): one baked outer outline of 2.5 px at that scale (dilate 10.9 box units)
    ctx.defs.push(`<filter id="${ctx.id}sm" x="-20%" y="-12%" width="140%" height="124%"><feMorphology in="SourceAlpha" operator="dilate" radius="10.9" result="d"/><feFlood flood-color="${K.ink}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    return ctx.wrap((opts.ground === false ? '' : ground({}, dir === 'C' ? 128 : dir === 'B' ? 100 : 120)) + `<g filter="url(#${ctx.id}sm)">${fig}</g>`);
  }
  // fullSheet(opts) → 1200 × 640: full('A') · full('B') · full('C') side by side (review sheet, no lettering).
  // opts go to every full() call ({ small: true } for the 64 px check at --scale 0.115)
  function fullSheet(opts) { return `<g>${['A', 'B', 'C'].map((d, i) => `<g transform="translate(${i * 400} 0)">${full(d, opts)}</g>`).join('')}</g>`; }
  // board(opts) → 640 × 480 comparison: columns = now · A · B · C, rows = 결 · 독 · 월 (no lettering; the main session
  // labels it). extra: true adds a 4th row (640 × 640): 결 A bible shadow · 결 A hurt · 결 A victory · (노을 A: not drawn)
  function board(opts) {
    opts = opts || {};
    const now = {
      gyeol: () => (PN.heroKit && PN.heroKit.portrait ? PN.heroKit.portrait('calm') : ''),
      dok: () => (PN.characters && PN.characters.portrait ? PN.characters.portrait('dok', 'calm') : ''),
      wol: () => (PN.characters && PN.characters.portrait ? PN.characters.portrait('wol', 'calm') : '')
    };
    const cell = (c, r, m) => (m ? `<g transform="translate(${c * 160} ${r * 160})">${m}</g>` : '');
    let s = '';
    const rev = opts.rev || 1;
    WHO.forEach((who, r) => { s += cell(0, r, now[who]()); ['A', 'B', 'C'].forEach((dir, c) => { s += cell(c + 1, r, portrait(dir, who, { rev })); }); });
    if (opts.extra) s += cell(0, 3, portrait('A', 'gyeol', { shadow: 'bible' })) + cell(1, 3, portrait('A', 'gyeol', { expr: 'hurt', rev: 1 })) + cell(2, 3, portrait('A', 'gyeol', { expr: 'victory', rev: 1 }));
    return `<g>${s}</g>`;
  }
  // refineBoard() → 480 × 320: top row = round 1 direction A, bottom row = rev 2; columns 결 · 독 · 월 (no lettering)
  function refineBoard(opts) {
    opts = opts || {};
    const cell = (c, r, m) => `<g transform="translate(${c * 160} ${r * 160})">${m}</g>`;
    return `<g>${WHO.map((who, c) => cell(c, 0, portrait('A', who, { rev: 1, bg: opts.bg })) + cell(c, 1, portrait('A', who, { bg: opts.bg }))).join('')}</g>`;
  }
  // exprBoard(who) → one row of 160 cells: 결 calm · focus · hurt · lowhp · awakened · victory; 독 · 월 calm · victory
  function exprBoard(who, opts) {
    opts = opts || {};
    person(who);
    return `<g>${EXPRS2[who].map((e, i) => `<g transform="translate(${i * 160} 0)">${portrait('A', who, { expr: e, bg: opts.bg })}</g>`).join('')}</g>`;
  }
  // faceBoard(list, opts) → one row of 140 × 124 cells (default 월 · 노을 · 령): each face ALONE at one common scale
  // (2.5 px per head unit), direction A rev 2 — no hair, hat, ears, neck, bust or hair shadow (the review's crop with
  // the hair and hats covered, F1), clipped by an ellipse from above the brows to under the chin; head unrotated.
  // opts: { expr } (calm by default)
  function faceBoard(list, opts) {
    opts = opts || {};
    const L0 = list || ['wol', 'noeul', 'ryeong'], S = 2.5, W = 140, Hh = 124, cx0 = 4.5, cy0 = 7, rx = 25.5, ry = 22;
    const e = `M ${f(cx0 - rx)},${cy0} A ${rx} ${ry} 0 1 0 ${f(cx0 + rx)},${cy0} A ${rx} ${ry} 0 1 0 ${f(cx0 - rx)},${cy0} Z`;
    return `<g>${L0.map((who, i) => {
      person(who);
      const ctx = Ctx(), L = layers2(ctx, who, Object.assign({}, exprSpec(who, opts.expr || 'calm'), { bare: true }));
      const head = `<g transform="translate(${f(W / 2 - cx0 * S)} ${f(Hh / 2 - cy0 * S)}) scale(${S})"><g ${ctx.clip(e)}>${L.face + L.features}</g><path d="${e}" fill="none" stroke="${K.ink}" stroke-width="${f(1.2 / S)}"/></g>`;
      return `<g transform="translate(${i * W} 0)">${ctx.wrap(`<rect width="${W}" height="${Hh}" fill="${K.paper}"/>` + head)}</g>`;
    }).join('')}</g>`;
  }
  // castBoard() → 800 × 160: direction A rev 2, calm, 결 · 독 · 월 · 노을 · 령
  function castBoard(opts) {
    opts = opts || {};
    return `<g>${WHO2.map((who, i) => `<g transform="translate(${i * 160} 0)">${portrait('A', who, { bg: opts.bg })}</g>`).join('')}</g>`;
  }
  PN.faceDrafts = { version: '0.3', DIRS, WHO, WHO2, EXPRS: EXPRS2, model, portrait, full, fullSheet, construct, measure, board, refineBoard, exprBoard, castBoard, faceBoard };
})(window.PN);
