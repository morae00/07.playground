// ============================================================================
// k-bombers.js — PN.bombers · 자폭 먹귀(폭탄병) 2종 × 5장 = 10 프로필 (K7, SYS-14)
// 심지형 fuse : 아래가 무거운 먹 주머니 + 지노 심지 한 가닥 + 짧고 굵은 네 다리. 닿으면 주저앉아 심지를 태운다.
// 즉시형 burst: 터질 듯 팽팽한 둥근 몸 + 촉발 뿔 5~6 + 새처럼 꺾인 두 다리. 닿는 순간 터진다.
// 지시서 docs/art/briefs/bombers.md · API art/concept-kit/API-bombers.md
// Requires lib.js (PN.taper) and k-enemies.js (PN.enemies._K — read only, never written to).
// ============================================================================
window.PN = window.PN || {};
// ---------------------------------------------------------------------------
// part 00 · core: namespace, rig constants, per-call context (copy of K.ctx), filters, geometry
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const EN = PN.enemies;
  if (!EN || !EN._K) { if (typeof console !== 'undefined') console.warn('PN.bombers: load k-enemies.js first'); return; }
  const B = (PN.bombers = PN.bombers || {});
  const K = EN._K, C = K.C, f = K.f;
  const _ = (B._ = {});
  _.BOX = [200, 200]; _.PIV = [100, 138]; _.U = 4; _.R = 12; _.FEET = [100, 186]; _.GY = 186; _.GYF = 184;
  _.n = 0; // module id counter → 'bmb<n>_' (never rewound)

  // per-call context: K.ctx (k-enemies.js:79-125) copied, id prefix bmb, u = 4, gameW = 2.5
  B.ctx = function (ch, kind, o) {
    const R = { u: _.U, gameW: 2.5 }, art = o.lod !== 'game', id = 'bmb' + (_.n++) + '_';
    const defs = [], x = { ch, kind, role: kind, o, R, art, id, defs, eyes: [], C, E: K.CH[ch], f };
    x.u = R.u;
    x.W = art ? 3.2 : R.gameW * R.u;
    x.w = art ? 1.8 : R.u * 1.0;
    x.join = ch === 4 ? 'miter' : 'round';
    let k = 0;
    x.uid = (p = 'x') => id + p + (k++);
    x.clip = (d, evenodd) => { const c = x.uid('c'); defs.push(`<clipPath id="${c}"><path d="${d}"${evenodd ? ' clip-rule="evenodd"' : ''}/></clipPath>`); return `url(#${c})`; };
    x.inClip = (d, inner) => `<g clip-path="${x.clip(d)}">${inner}</g>`;
    const pitch = art ? 6 : 3 * R.u;
    const pat = {};
    x.dot = (lv = 40, col = C.ink) => {
      const key = lv + col; if (pat[key]) return pat[key];
      const pid = x.uid('p'), rr = pitch * Math.sqrt(lv / 100 / Math.PI);
      defs.push(`<pattern id="${pid}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="${pitch / 2}" cy="${pitch / 2}" r="${f(rr)}" fill="${col}"/></pattern>`);
      return (pat[key] = `url(#${pid})`);
    };
    x.shape = (d, fill, w = x.W, extra = '') => {
      const j = `stroke-linejoin="${x.join}" stroke-miterlimit="3"`;
      if (!art) return `<path d="${d}" fill="${fill}" stroke="${C.ink}" stroke-width="${f(w * 1.25)}" ${j} paint-order="stroke" ${extra}/>`;
      if (ch === 2) return `<path d="${d}" fill="${fill}" stroke="${C.ink}" stroke-width="${f(w * 1.7)}" ${j} paint-order="stroke" ${extra}/>`;
      return `<path d="${d}" fill="${C.ink}" stroke="${C.ink}" stroke-width="${f(w * 1.5)}" ${j} transform="translate(${f(w * 0.3)},${f(w * 0.42)})"/>` +
        `<path d="${d}" fill="${fill}" stroke="${C.ink}" stroke-width="${f(w * 1.4)}" ${j} paint-order="stroke" ${extra}/>`;
    };
    x.line = (d, w = x.w, col = C.ink, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="${x.join}" ${extra}/>`;
    x.T = (p, w, mode = 'mid', col = C.ink, extra = '') => PN.taper(p, w, mode, col, extra);
    x.keylight = (hl, dx = 5, dy = 7, lv = 40) => {
      if (!art || !x.halftoneOK) return `<path d="${hl}" fill="${C.ink5}"/>`;
      const mid = x.uid('m'), Bx = 'x="-60" y="-60" width="360" height="360"';
      defs.push(`<mask id="${mid}" maskUnits="userSpaceOnUse" ${Bx}><rect ${Bx} fill="#fff"/><path d="${hl}" fill="#000" transform="translate(${-dx},${-dy})"/></mask>`);
      return `<path d="${hl}" fill="${C.ink5}"/><g mask="url(#${mid})"><path d="${hl}" fill="${x.dot(lv)}"/></g>`;
    };
    x.shade2 = (cx, cy, lo = 20, hi = 60, kk = 1) => {
      const L = 400, a = [cx - L, cy + L * kk], b = [cx + L, cy - L * kk];
      return `<rect x="-60" y="-60" width="360" height="360" fill="${x.dot(lo)}"/><path d="M${f(a[0])},${f(a[1])} L${f(b[0])},${f(b[1])} L${f(cx + L * 2)},${f(cy + L * 2)} Z" fill="${x.dot(hi)}"/>`;
    };
    x.halftoneOK = art;
    x.rim = (p, w) => PN.taper(p, w || (art ? 2.4 : R.u * 1.1), 'mid', C.ink3, '');
    return x;
  };

  // outline quality per chapter (art LOD only), as k-enemies filterDef (k-enemies.js:1416-1442)
  const ROUGH = { 1: { bf: '0.05', sc: 2.6, seed: 7 }, 3: { bf: '0.018 0.07', sc: 2.4, seed: 3 }, 5: { bf: '0.11', sc: 1.1, seed: 5 } };
  _.filterDef = function (x, mode) {
    const fid = x.uid('f'), hr = f(1.5 * x.u);
    const rr = x.art && ROUGH[x.ch];
    let src = 'SourceGraphic', out = '';
    if (rr) { out += `<feTurbulence type="fractalNoise" baseFrequency="${rr.bf}" numOctaves="2" seed="${rr.seed + x.ch}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${rr.sc}" xChannelSelector="R" yChannelSelector="G" result="g"/>`; src = 'g'; }
    if (mode === 'sil') {
      out += `<feFlood flood-color="${C.ink}"/><feComposite in2="${src}" operator="in"/>`;
    } else if (mode === 'hit') {
      const ow = f(x.W * 0.9);
      out += `<feMorphology in="${src}" operator="dilate" radius="${ow}" result="d1"/><feMorphology in="d1" operator="dilate" radius="${hr}" result="d2"/>` +
        `<feFlood flood-color="${x.E.base}"/><feComposite in2="d2" operator="in" result="h"/>` +
        `<feFlood flood-color="${C.ink}"/><feComposite in2="d1" operator="in" result="ol"/>` +
        `<feFlood flood-color="${C.p50}"/><feComposite in2="${src}" operator="in" result="pf"/>` +
        `<feMerge><feMergeNode in="h"/><feMergeNode in="ol"/><feMergeNode in="pf"/></feMerge>`;
    } else if (x.o.halo !== false) {
      out += `<feMorphology in="${src}" operator="dilate" radius="${hr}" result="d"/><feFlood flood-color="${x.E.base}"/><feComposite in2="d" operator="in" result="h"/>` +
        `<feMerge><feMergeNode in="h"/><feMergeNode in="${src}"/></feMerge>`;
    } else if (!rr) return '';
    x.defs.push(`<filter id="${fid}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">${out}</filter>`);
    return ` filter="url(#${fid})"`;
  };

  // ---------- 2D affine (SVG matrix a b c d e f) ----------
  _.I = [1, 0, 0, 1, 0, 0];
  _.mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  _.rot = (deg, cx, cy) => { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy]; };
  _.scl = (sx, sy, cx, cy) => [sx, 0, 0, sy, cx - sx * cx, cy - sy * cy];
  _.tr = (dx, dy) => [1, 0, 0, 1, dx, dy];
  _.ap = (m, p) => { const q = [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]]; if (p[2]) q.push(1); return q; };
  _.aps = (m, pts) => pts.map((p) => _.ap(m, p));
  _.mstr = (m) => `matrix(${m.map((v) => f(v)).join(' ')})`;
  _.isI = (m) => m.every((v, i) => Math.abs(v - _.I[i]) < 1e-9);

  // ---------- curves ----------
  // open Catmull-Rom (same tangents as K.sm) sampled to a dense polyline
  _.crSample = (pts, per = 8) => {
    const n = pts.length, P = (i) => pts[Math.max(0, Math.min(n - 1, i))], out = [];
    for (let i = 0; i < n - 1; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      for (let j = 0; j < per; j++) {
        const t = j / per, u = 1 - t;
        out.push([u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0], u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1]]);
      }
    }
    out.push([pts[n - 1][0], pts[n - 1][1]]);
    return out;
  };
  // the first `frac` of a polyline's length
  _.cut = (poly, frac) => {
    const seg = []; let L = 0;
    for (let i = 1; i < poly.length; i++) { const d = Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]); seg.push(d); L += d; }
    const target = L * Math.max(0, Math.min(1, frac)); let acc = 0; const out = [poly[0]];
    for (let i = 1; i < poly.length; i++) {
      if (acc + seg[i - 1] >= target - 1e-9) { const t = (target - acc) / (seg[i - 1] || 1); out.push([poly[i - 1][0] + (poly[i][0] - poly[i - 1][0]) * t, poly[i - 1][1] + (poly[i][1] - poly[i - 1][1]) * t]); return out; }
      acc += seg[i - 1]; out.push(poly[i]);
    }
    return out;
  };
  _.pd = (pts) => 'M' + pts.map((p) => f(p[0]) + ',' + f(p[1])).join(' L');
  _.len = (poly) => { let L = 0; for (let i = 1; i < poly.length; i++) L += Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]); return L; };
  // irregular blob around (cx,cy): n lobes, radii jittered by a fixed-seed rng
  _.blob = (cx, cy, rx, ry, n, jit, seed, rot = 0) => {
    const rnd = K.rng(seed), pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rot * Math.PI / 180, k = 1 - jit + rnd() * jit * 2; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return pts;
  };
  // torn paper scrap (k-enemies S.scrap recipe): art = p300 + 20/60 halftone + marks, game = flat ink3 + ink rim
  _.scrap = (x, pts, marks = '') => {
    const d = K.pl(pts), cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    return x.art ? x.shape(d, C.p300, 2.2) + x.inClip(d, x.shade2(cx + 2, cy + 2) + marks) : x.shape(d, C.ink3, x.W * 0.8);
  };

  // ---------- fuse (지노 심지) ----------
  // centreline from the root, idle; S-curve: forward ≤ 8 units, back, tip pointing back-up (≈34° off vertical).
  // Tip x 96 so the walk sway (±6) keeps it within ±3 px of the pivot column (renderer spark dot, brief §1.7)
  _.WICK = [[0, 0], [4.5, -10], [5.5, -20], [2, -29], [-4, -37]];
  _.wickPts = (root, sway, frac) => {
    const base = _.crSample(_.WICK.map(([dx, dy]) => [root[0] + dx, root[1] + dy]), 10), n = base.length - 1;
    return _.cut(base.map((p, i) => [p[0] + sway * Math.pow(i / n, 1.6), p[1] + Math.abs(sway) * 0.05 * Math.pow(i / n, 2)]), frac);
  };
  _.wick = (x, pts) => {
    const d = _.pd(pts);
    let o = x.line(d, x.art ? 11 : 12, C.ink) + x.line(d, x.art ? 3.2 : 4, C.ink3);
    if (x.art && pts.length > 6) { // twist marks: ≤ 4 short curved strokes, uneven spacing
      const L = _.len(pts);
      [0.16, 0.41, 0.58, 0.87].forEach((t, i) => {
        if (t * L > L - 4) return;
        const q = _.cut(pts, t), p = q[q.length - 1], pp = q[Math.max(0, q.length - 2)];
        let tx = p[0] - pp[0], ty = p[1] - pp[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
        const nx = -ty, ny = tx, s = i % 2 ? 1 : -1;
        o += `<path d="M${f(p[0] - nx * 4.6 - tx * 1.6)},${f(p[1] - ny * 4.6 - ty * 1.6)} Q${f(p[0] + tx * 2.4 * s)},${f(p[1] + ty * 2.4 * s)} ${f(p[0] + nx * 4.6 + tx * 1.6)},${f(p[1] + ny * 4.6 + ty * 1.6)}" fill="none" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round"/>`;
      });
    }
    return o;
  };
  // scorched knot at the wick end (idle · walk · hit)
  _.knot = (x, p) => {
    const pts = _.blob(p[0], p[1], 6.6, 6.2, 7, 0.12, 31, 10);
    let o = x.shape(K.sm(pts), C.ink, x.art ? 1.4 : x.u);
    if (x.art) o += K.circ(p[0] - 2.2, p[1] - 2, 1.3, C.ink5) + x.line(`M${f(p[0] - 1)},${f(p[1] - 6)} l-1.6,-3.2 M${f(p[0] + 2.4)},${f(p[1] - 5.6)} l0.6,-3`, 1.1, C.ink);
    return o;
  };
  // 먹 불꽃 (black fire + paper core ≤ 6 units), base = flame foot on the wick end, h = height
  _.flame = (x, b, h) => {
    const w = h * 0.36, [bx, by] = b, lean = -h * 0.06;
    const d = `M${f(bx)},${f(by + h * 0.12)} C${f(bx - w * 1.3)},${f(by + h * 0.05)} ${f(bx - w * 1.1)},${f(by - h * 0.5)} ${f(bx + lean)},${f(by - h)} C${f(bx + w * 0.15)},${f(by - h * 0.62)} ${f(bx + w * 1.25)},${f(by - h * 0.42)} ${f(bx + w * 0.95)},${f(by - h * 0.06)} C${f(bx + w * 0.8)},${f(by + h * 0.1)} ${f(bx + w * 0.35)},${f(by + h * 0.14)} ${f(bx)},${f(by + h * 0.12)} Z`;
    let o = '';
    if (x.art) { // tongues (2): small licks leaning back
      o += x.T([bx - w * 0.9, by - h * 0.18, bx - w * 1.6, by - h * 0.5, bx - w * 1.2, by - h * 0.78], 3.4, 'start', C.ink);
      o += x.T([bx + w * 0.8, by - h * 0.22, bx + w * 1.5, by - h * 0.46, bx + w * 1.05, by - h * 0.66], 2.6, 'start', C.ink);
    }
    o += x.shape(d, C.ink, x.art ? 1.3 : x.u * 0.9);
    const ch = Math.min(6, h * 0.36), cw = ch * 0.55, cy = by - h * 0.2; // paper core (height ≤ 6)
    o += `<path d="M${f(bx)},${f(cy + ch * 0.4)} C${f(bx - cw)},${f(cy + ch * 0.3)} ${f(bx - cw * 0.8)},${f(cy - ch * 0.3)} ${f(bx - ch * 0.05)},${f(cy - ch * 0.6)} C${f(bx + cw * 0.5)},${f(cy - ch * 0.25)} ${f(bx + cw)},${f(cy + ch * 0.15)} ${f(bx)},${f(cy + ch * 0.4)} Z" fill="${C.p50}"/>`;
    return o;
  };
  // 담묵 smoke strand (art only)
  _.smoke = (x, top, k = 1) => x.T([top[0], top[1] - 2, top[0] - 12 * k, top[1] - 14 * k, top[0] - 3 * k, top[1] - 28 * k], 3.6, 'mid', C.ink3) +
    x.T([top[0] - 3 * k, top[1] - 28 * k, top[0] + 7 * k, top[1] - 38 * k, top[0] + 1 * k, top[1] - 48 * k], 2.4, 'mid', C.ink3);
  // stitched mouth: K.stitch recipe (ink seam + p300 stitches), but the stitches stand normal to the seam at uneven
  // spacing — K.stitch's equal parallel ticks read as 'III' at 1x and hit the 3-parallel-lines rule (brief §1.8)
  // gape: the seam splits into two lips and the stitches stretch across (plant f3)
  _.stitch = (x, pts, ts, seam, gape) => {
    const poly = _.crSample(pts, 8), sw = x.art ? 2.2 : 0.9 * x.u, col = seam || C.ink;
    let st = '';
    ts.forEach((t, i) => {
      const q = _.cut(poly, t), p = q[q.length - 1], pp = q[q.length - 2] || poly[0];
      let tx = p[0] - pp[0], ty = p[1] - pp[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const nx = -ty, ny = tx, h = (x.art ? 3.4 : 3.9) * (i % 2 ? 0.84 : 1.08) * (gape ? 1.4 : 1), sk = i % 2 ? 0.9 : -0.6;
      st += `M${f(p[0] - nx * h - tx * sk)},${f(p[1] - ny * h - ty * sk)} L${f(p[0] + nx * h + tx * sk)},${f(p[1] + ny * h + ty * sk)} `;
    });
    const lips = gape ? x.line(K.sm(pts.map((p) => [p[0], p[1] - 2]), false), sw, col) + x.line(K.sm(pts.map((p) => [p[0] - 0.6, p[1] + 2]), false), sw, col) : x.line(K.sm(pts, false), sw, col);
    return lips + x.line(st, x.art ? 1.3 : 0.6 * x.u, C.p300);
  };
  // paper light through a crack: jagged ink cut + p300 (or p50-core) light
  _.crack = (x, pts, hot) => {
    const d = K.pl(pts, false);
    return x.line(d, x.art ? 5.2 : 6, C.ink) + x.line(d, x.art ? 2.6 : 3.4, C.p300) + (hot ? x.line(d, x.art ? 1.1 : 1.6, C.p50) : '');
  };
})(window.PN);
// ---------------------------------------------------------------------------
// part 10 · FUSE rig (심지형). Key pose = idle: upright pear pouch, wick tip = top painted point.
// walk 4f waddle (8 fps) · plant 4f crouch + burning wick (fuse progress 0/25/50/75%)
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const B = PN.bombers, _ = B && B._;
  if (!_) return;
  const K = PN.enemies._K, C = K.C, f = K.f, sm = K.sm, pl = K.pl;
  const F = (_.FUSE = { CH: {} });
  // pouch (rig space, idle): pear, widest y 118-126, neck under the stopper
  F.POUCH = [[100, 56], [115, 58], [128, 64], [139, 76], [147, 94], [154, 111], [157, 125], [155, 140], [146, 153], [128, 162], [100, 166], [72, 162], [54, 153], [45, 140], [43, 125], [46, 111], [53, 94], [61, 76], [72, 64], [85, 58]];
  F.ROOT = [100, 48];               // wick root, on the stopper (same for all chapters)
  F.EYE = [128, 92];
  F.HEAD = [100, 56];               // pouch top
  F.MOUTH = [[155, 117], [148, 125], [139, 130], [130, 132]];
  // key-light crescent (one ink.500 sliver wrapping the upper-left; clipped by the pouch)
  F.HL = sm([[34, 160, 1], [24, 108], [36, 56], [84, 34], [134, 44], [120, 61, 1], [100, 63.5], [82, 68], [69, 80], [61, 97], [56, 116], [54, 134], [50, 146, 1]]);
  F.RIM = [57, 80, 68, 61, 100, 57];
  F.WAIST = [[38, 134], [70, 147], [100, 151], [130, 147], [162, 134]]; // belt ring below the mouth (near side sags)
  F.DRIPS = [[100, 158, 18, 6.2], [86, 159, 11, 4.4]];
  // short thick legs. near = ink, far = ink.700 (12 units inward, 2 up). feet: boot / hoof
  F.LEGS = {
    fh: { h: [82, 148], tx: 72, L: [15, 15], b: -1, w: [15, 12, 11], far: 1 },
    ff: { h: [116, 148], tx: 118, L: [15, 15], b: -1, w: [15, 12, 11], far: 1 },
    nh: { h: [70, 150], tx: 60, L: [16, 16], b: -1, w: [18, 15, 13] },
    nf: { h: [128, 150], tx: 130, L: [16, 16], b: -1, w: [18, 15, 13] }
  };

  F.pose = (st, fr) => {
    const P = { st, fr, M: _.I, sway: 0, frac: 1, flame: 0, face: 'press', eyeK: 1, cracks: 0, swell: 0, arcs: false, smoke: false, gape: false, da: { nf: [0, 0], nh: [0, 0], ff: [0, 0], fh: [0, 0] } };
    if (st === 'walk') {
      const by = [4, -2, 4, -2][fr], sx = [1.02, 0.99, 1.02, 0.99][fr], sy = [0.98, 1.01, 0.98, 1.01][fr];
      P.M = _.mul(_.tr(0, by), _.scl(sx, sy, 100, 113));
      P.sway = [0, -6, 0, 6][fr];
      const ph = { nf: 0, fh: 0, ff: 0.5, nh: 0.5 };
      for (const k in ph) { const g = K.gait(fr, 4, ph[k], 9, 6); P.da[k] = [g[0], g[1]]; }
    } else if (st === 'plant') {
      const sx = [1.04, 1.04, 1.06, 1.09][fr], sy = [0.94, 0.96, 0.98, 1.01][fr];
      P.M = _.mul(_.tr(0, 6), _.scl(sx, sy, 100, 171));
      P.frac = [1, 0.7, 0.45, 0.2][fr]; P.flame = [12, 14, 16, 19][fr];
      P.face = fr < 2 ? 'press' : 'wide'; P.eyeK = [1, 1, 1.1, 1.17][fr];
      P.cracks = [0, 0, 1, 3][fr]; P.swell = fr === 3 ? 1 : 0; P.arcs = fr === 3; P.smoke = fr >= 1; P.gape = fr === 3;
      P.da = { nf: [10, 0], nh: [-10, 0], ff: [8, 0], fh: [-8, 0] };
    }
    return P;
  };
  F.wickAt = (P) => _.wickPts(_.ap(P.M, F.ROOT), P.sway, P.frac);
  // pouch points with the plant-f3 crown swell beside the stopper
  F.pts = (spec, P) => {
    const pts = (spec.pts || F.POUCH).map((p) => p.slice());
    if (P.swell) { const up = spec.swell || { 1: 5, 2: 3, [pts.length - 1]: 5, [pts.length - 2]: 3 }; for (const i in up) pts[i][1] -= up[i]; }
    return pts;
  };

  F.leg = (x, k, P, ft) => {
    const N = F.LEGS[k], d = P.da[k], gy = N.far ? _.GYF : _.GY, w = N.w;
    const h = _.ap(P.M, N.h), a0 = K.onGround(N.tx + d[0], gy, w[2], ft), a = [a0[0], a0[1] + d[1]];
    const g = K.legGeo({ h, a, L: N.L, b: N.b, w, ft, dir: 1 });
    let o = x.shape(g.d, N.far ? C.ink7 : C.ink, x.art ? x.W * 0.72 : x.u * 0.7);
    if (!N.far) { // lit sliver down the back (upper-left) edge of the visible shin
      const [, kn, an] = g.P;
      o += x.inClip(g.d, x.T([kn[0] - w[1] * 0.45, kn[1] - 4, (kn[0] + an[0]) / 2 - w[1] * 0.52, (kn[1] + an[1]) / 2, an[0] - w[2] * 0.45, an[1] + 2], x.art ? 4.4 : 4.8, 'mid', C.ink5));
    }
    return o;
  };

  // face: one near eye (front-upper quadrant), brow wedge, stitched mouth hugging the lower front contour
  F.face = (x, P, spec) => {
    const art = x.art, s = (art ? 10 : 11) * P.eyeK, ex = F.EYE[0] - (P.eyeK > 1 ? 2 : 0), ey = F.EYE[1];
    const mp = F.MOUTH;
    let o = art ? x.T([mp[3][0] + 1, mp[3][1] + 3.2, mp[2][0] + 3, mp[2][1] + 3.6, mp[0][0] - 1, mp[0][1] + 3.4], 1.8, 'mid', C.ink5) : ''; // lower lip catches the light (art)
    o += _.stitch(x, mp, art ? [0.13, 0.37, 0.6, 0.85] : [0.18, 0.5, 0.8], art ? C.ink : C.ink5, P.gape);
    if (art) {
      o += x.T([131, 131, 126, 130.5, 122.5, 127], 1.8, 'mid', C.ink5); // mouth-corner crease
      if (P.st === 'plant') o += x.T([124, 117, 118.5, 125, 122, 134], 2, 'mid', C.ink5); // puffed cheek
    }
    o += K.eye(x, ex, ey, s, spec.eye || {});
    if (art) {
      o += x.T([ex - s * 0.95, ey + s * 0.62, ex - s * 0.05, ey + s * 1.08, ex + s * 0.9, ey + s * 0.55], 1.7, 'mid', C.ink5); // lower lid
      if (spec.glint) o += K.circ(ex + spec.glint[0] * s, ey + spec.glint[1] * s, Math.max(1, s * 0.09), C.p50); // pupil highlight
    }
    const by = (spec.browY || 0) * s; // the keyhole eye stands taller: its brow sits higher so the round head stays whole
    const br = (P.face === 'press'
      ? [[ex - 1.3 * s, ey - 0.82 * s], [ex + 1.3 * s, ey - 0.06 * s], [ex + 1.45 * s, ey - 0.72 * s], [ex - 1.1 * s, ey - 1.55 * s]]
      : [[ex - 1.15 * s, ey - 1.36 * s], [ex + 1.2 * s, ey - 1.2 * s], [ex + 1.3 * s, ey - 1.6 * s], [ex - 1.0 * s, ey - 1.92 * s]]).map((q) => [q[0], q[1] + by]);
    o += x.shape(pl(br), C.ink, art ? 1.2 : x.u * 0.3);
    o += x.T([br[3][0] + 2, br[3][1] + 2.4, (br[3][0] + br[2][0]) / 2, (br[3][1] + br[2][1]) / 2 + 1.6, br[2][0] - 2, br[2][1] + 2.4], art ? 2.6 : 4, 'mid', C.ink5); // brow ridge
    return o;
  };

  // meandering cracks (never a zigzag glyph): back-lower ×2, crown beside the stopper
  F.CRACKS = [
    [[55, 132], [57.5, 138], [61, 141], [61.5, 147], [65.5, 152], [66, 158]],
    [[76, 150], [78, 154.5], [77.5, 158], [81.5, 162]],
    [[79, 62], [80.5, 66.5], [83.5, 68.5], [84, 74]]
  ];

  F.draw = (x, spec) => {
    const st = x.o.state === 'hit' ? 'idle' : x.o.state, P = F.pose(st, x.fr), M = P.M, sil = x.o.silhouette, ft = spec.ft || 'boot';
    let g = F.leg(x, 'fh', P, ft) + F.leg(x, 'ff', P, ft) + F.leg(x, 'nh', P, ft) + F.leg(x, 'nf', P, ft);
    const pts = F.pts(spec, P), d = spec.poly ? pl(pts) : sm(pts);
    let cracks = '';
    for (let i = 0; i < P.cracks; i++) cracks += _.crack(x, F.CRACKS[i], P.cracks > 1);
    let core = x.shape(d, C.ink) + x.inClip(d, x.keylight(spec.hl || F.HL, 3, 4, 40) + (spec.over ? spec.over(x, P, d) : '') + x.rim(spec.rim || F.RIM) + cracks + F.face(x, P, spec));
    if (spec.holes) core = K.holed(x, spec.holes, core, spec.erase ? spec.erase(x) : '');
    const body = K.drips(x, spec.drips || F.DRIPS, 2) + core + (spec.top ? spec.top(x, P) : '');
    g += _.isI(M) ? body : `<g transform="${_.mstr(M)}">${body}</g>`;
    const wp = F.wickAt(P), tip = wp[wp.length - 1];
    g += _.wick(x, wp);
    if (P.flame) {
      g += _.flame(x, tip, P.flame);
      if (x.art && P.smoke && !sil) g += _.smoke(x, [tip[0] - 1, tip[1] - P.flame], 0.7 + 0.12 * P.fr);
    } else g += _.knot(x, tip);
    if (P.arcs && !sil) g += K.arc(x, 100, 104, 70, 56, 205, 246, 2);
    return { g, eyeM: M };
  };

  // ======================= Ch1 · 벽보 보따리 (poster bundle) =======================
  F.CH[1] = {
    eye: { a: -12 }, glint: [0.27, -0.19], ft: 'boot',
    pts: [[100, 56], [115, 57], [128, 64], [139, 75], [147, 94], [154, 111], [157, 125], [155, 140], [147, 153], [128, 162], [100, 166], [72, 163], [53, 153], [45, 140], [43, 125], [46, 110], [53, 94], [62, 76], [72, 63], [86, 57]],
    over: (x) => {
      const art = x.art;
      // two torn posters wrapping the bundle (back, belly), tucked under the twine; no letters (print block + lines)
      let o = _.scrap(x, [[39, 104, 1], [59, 98, 1], [63, 104, 1], [67, 101, 1], [70, 140, 1], [64, 143, 1], [60, 138, 1], [57, 146, 1], [39, 148, 1]],
        art ? `<g transform="rotate(-7 52 112)"><rect x="45" y="106" width="11" height="8" fill="${C.ink}"/><path d="M45,118 h15 M45,122.5 h10" stroke="${C.ink}" stroke-width="2"/></g>` : '');
      o += _.scrap(x, [[96, 141, 1], [123, 137, 1], [127, 143, 1], [132, 140, 1], [146, 168, 1], [94, 174, 1]],
        art ? `<g transform="rotate(-9 116 156)"><rect x="104" y="153" width="12" height="7" fill="${C.ink}"/><path d="M104,164 h17" stroke="${C.ink}" stroke-width="2"/></g>` : '');
      const dw = sm(F.WAIST, false); // twine: one sagging ring, never tied in a cross
      o += x.line(dw, art ? 6 : 8.5, C.ink) + x.line(dw, art ? 3 : 4, C.ink3);
      if (art) o += K.circ(26, 150, 2, C.ink) + K.circ(20, 141, 1.3, C.ink); // ink spatter (거친 번짐)
      return o;
    },
    top: (x) => { // gathered bundle mouth: flat trapezoid narrow at the top, tie + one knot (never ear-like)
      const art = x.art, m = pl([[84, 64], [88, 56], [91, 49, 1], [95, 52], [99, 46, 1], [103, 51], [108, 47, 1], [110, 55], [116, 64]]);
      let o = x.shape(m, C.ink7, art ? x.W * 0.8 : x.u * 0.7) + x.inClip(m, x.line('M94,52 L92,63 M106,50 L109,63', art ? 1.3 : x.u * 0.9, C.ink5));
      o += x.line('M85,59 Q100,63.5 115,59', art ? 5 : 6.5, C.ink) + x.line('M85,59 Q100,63.5 115,59', art ? 2.4 : 3.4, C.ink3);
      return o + x.shape(sm(_.blob(114, 59.5, 4.8, 3.6, 6, 0.14, 5)), C.ink3, art ? 1.3 : x.u * 0.6);
    }
  };
  // waist band between two sagging rings (the near side of a hoop round the body, below the mouth)
  F.band = (y0, w) => sm([[36, y0], [68, y0 + 13], [100, y0 + 17], [132, y0 + 13], [164, y0]].concat([[164, y0 + w], [132, y0 + 13 + w], [100, y0 + 17 + w], [68, y0 + 13 + w], [36, y0 + w]]).map((p, i) => (i === 4 || i === 5 || i === 9 || i === 0 ? p.concat(1) : p)));

  // ======================= Ch2 · 무쇠 등잔 (cast-iron lamp jar) =======================
  F.CH[2] = {
    eye: {}, glint: [0.06, -0.48], ft: 'hoof', browY: -0.6,
    pts: [[100, 57], [115, 58], [129, 63], [141, 73, 1], [148, 92], [154, 112], [157, 126], [155, 141], [146, 154], [128, 162], [100, 166], [72, 162], [54, 154], [45, 141], [43, 126], [46, 112], [52, 92], [59, 73, 1], [71, 63], [85, 58]],
    over: (x) => { // riveted iron hoop: ink.700 band + ink.500 top edge + 3-4 rivets at uneven spacing
      const art = x.art, band = F.band(128, 12);
      let o = x.shape(band, C.ink7, art ? 1.4 : x.u * 0.45) + x.line(sm([[36, 129.5], [68, 142.5], [100, 146.5], [132, 142.5], [164, 129.5]], false), art ? 1.8 : 4, C.ink5);
      [[58, 143.5], [79, 150], [117, 150.5], [129, 148.5]].forEach(([a, b]) => { o += K.circ(a, b, art ? 2.8 : 3.4, C.ink) + (art ? K.circ(a - 0.8, b - 0.9, 0.9, C.ink5) : ''); });
      if (art) o += x.line('M60,82 Q56,100 58,118', 1.2, C.ink3); // cast seam
      return o;
    },
    top: (x) => { // short iron spout: cylinder widening upward + one lip ledge
      const art = x.art, sp = pl([[91, 64], [89, 53], [85, 52], [85, 46.5], [115, 46.5], [115, 52], [111, 53], [109, 64]]);
      return x.shape(sp, C.ink7, art ? x.W * 0.8 : x.u * 0.7) + x.line('M86.5,48.4 L113.5,48.4', art ? 1.6 : 3.2, C.ink5) + (art ? x.line('M93,56 L94,63', 1.2, C.ink5) : '');
    }
  };

  // ======================= Ch3 · 젖은 옹기 (wet onggi) =======================
  F.CH[3] = {
    eye: { noSat: true }, glint: [0.13, -0.04], ft: 'boot',
    pts: [[100, 57], [111, 58], [122, 63], [133, 74], [144, 92], [153, 112], [158, 128], [155, 144], [145, 156], [126, 163], [100, 166], [74, 163], [55, 156], [45, 144], [42, 128], [47, 112], [56, 92], [67, 74], [78, 63], [89, 58]],
    drips: [[100, 158, 18, 6.2], [86, 159, 11, 4.4], [118, 157, 13, 4.6]],
    over: (x) => { // waterline (ink.500) at ~60% height, ending before the face; wet env.deep below (≤ 12%); one moss clump
      const art = x.art;
      let o = `<path d="${sm([[38, 110, 1], [62, 117], [86, 120.5], [106, 120], [112, 121, 1], [104, 124], [94, 126], [86, 125], [77, 129], [66, 128], [52, 132], [38, 133, 1]])}" fill="${x.E.deep}"/>`;
      o += x.T([42, 109, 78, 122, 113, 119], art ? 2.4 : 4.4, 'start', C.ink5);
      o += `<path d="${sm(_.blob(60, 152, 9, 5.5, 7, 0.22, 13))}" fill="${x.E.deep}"/>` + K.circ(70, 156, art ? 2.4 : 3, x.E.deep);
      if (art) o += x.line('M66,140 Q64,150 66,158 M84,132 Q83,142 85,150', 1.2, C.ink5) + `<path d="${sm([[44, 126], [60, 131], [74, 138], [60, 140], [46, 136]])}" fill="${x.dot(20)}"/>`;
      return o;
    },
    top: (x) => { // wide cork
      const art = x.art, ck = sm([[87, 63.5, 1], [85.5, 50], [88, 47.5], [112, 47.5], [114.5, 50], [113, 63.5, 1]]);
      return x.shape(ck, x.E.deep, art ? x.W * 0.8 : x.u * 0.7) + (art ? K.circ(94, 54, 1.1, C.ink) + K.circ(104.5, 57.5, 1.3, C.ink) + K.circ(108, 52, 0.9, C.ink) + x.line('M88,50.5 L112,50.5', 1.2, C.ink5) : '');
    }
  };

  // ======================= Ch4 · 태엽 통 (mainspring barrel) =======================
  F.CH[4] = {
    eye: { hand: 6 }, ft: 'hoof', poly: true, swell: { 0: 4, 1: 3, 11: 4, 10: 3 },
    pts: [[114, 57], [137, 68], [151, 92], [157, 121], [150, 147], [129, 163], [71, 163], [50, 147], [43, 121], [49, 92], [63, 68], [86, 57]],
    hl: pl([[30, 150], [26, 100], [40, 52], [86, 36], [130, 44], [116, 62], [88, 64], [69, 75], [57, 95], [53, 121], [50, 140]]),
    rim: [52, 86, 62, 62, 112, 58],
    over: (x) => { // brass planes (env.deep ≤ 15%) on the lower back + one engraved band (ink.500)
      const art = x.art;
      let o = `<path d="${pl([[43, 121], [50, 147], [71, 163], [92, 163], [76, 143], [58, 126]])}" fill="${x.E.deep}"/>` + `<path d="${pl([[129, 163], [150, 147], [134, 150]])}" fill="${x.E.deep}"/>`;
      if (art) o += `<path d="${pl([[50, 147], [71, 163], [92, 163], [76, 143]])}" fill="${x.dot(40)}"/>`;
      o += x.line(pl([[40, 131], [72, 140], [128, 140], [160, 131]], false), art ? 2.2 : 4.4, C.ink5);
      if (art) o += x.line(pl([[61, 69], [57, 95], [53, 121]], false), 1.2, C.ink3); // facet edge
      return o;
    },
    top: (x) => { // crown (용두): short trapezoid, wider at the top. no ticks (equal grooves read as 'III')
      const art = x.art, cr = pl([[92, 63], [87, 48], [113, 48], [108, 63]]);
      return x.shape(cr, x.E.deep, art ? x.W * 0.8 : x.u * 0.7) + x.line('M89,51.5 L111,51.5', art ? 1.4 : 3, C.ink);
    }
  };

  // ======================= Ch5 · 흑요 구슬 (obsidian bead) =======================
  F.CH[5] = {
    eye: {}, ft: 'boot', poly: true,
    pts: [[100, 56], [120, 59], [136, 69], [148, 88], [155, 112], [157, 130], [151, 148], [136, 160], [112, 166], [86, 165], [64, 159], [50, 147], [43, 127], [46, 106], [54, 86], [68, 68], [81, 60]],
    hl: pl([[30, 150], [24, 100], [40, 50], [90, 34], [134, 44], [118, 62], [96, 64], [76, 72], [62, 88], [55, 108], [53, 128], [49, 142]]),
    rim: [54, 86, 64, 62, 108, 57],
    holes: [K.crescent(63, 139, 15, 70.5, 132.5, 12.5)],
    erase: (x) => (x.art ? K.nibble([[43, 127], [45, 106], [52, 86], [66, 68], [80, 60], [100, 56]], 18, 3.2, 5) + K.nibble([[64, 159], [86, 165], [112, 166]], 7, 2.6, 9) : ''),
    over: (x) => { // 3-4 obsidian faces (ink.700 / ink.500) on the back half — no face boundary crosses the eye or mouth
      const art = x.art;
      let o = `<path d="${pl([[43, 127], [53, 100], [76, 116], [70, 142], [50, 147]])}" fill="${C.ink7}"/>` + `<path d="${pl([[64, 159], [86, 165], [100, 150], [78, 142]])}" fill="${C.ink7}"/>` + `<path d="${pl([[86, 165], [112, 166], [102, 152]])}" fill="${C.ink5}"/>`;
      if (art) o += x.line(pl([[53, 100], [76, 116], [70, 142]], false), 1.2, C.ink3) + x.line(pl([[78, 142], [100, 150], [112, 166]], false), 1.1, C.ink3);
      return o;
    },
    top: (x) => { // eclipse-ring neck: a flat ring seen from the side (30 × 8) + one ≤ 1px paper crescent glint
      const art = x.art;
      let o = x.shape(`M93,64 L93,55 L107,55 L107,64 Z`, C.ink, art ? 1.2 : x.u * 0.4);
      o += x.shape(`M85,53 A15,4.6 0 1 0 115,53 A15,4.6 0 1 0 85,53 Z`, C.ink7, art ? x.W * 0.8 : x.u * 0.7) + `<ellipse cx="100.5" cy="51.8" rx="9" ry="2.1" fill="${C.ink}"/>`;
      return o + x.T([86.5, 52, 89, 49.2, 95, 48.6], art ? 1.1 : 1.6, 'mid', C.p100);
    }
  };
})(window.PN);
// ---------------------------------------------------------------------------
// part 20 · BURST rig (즉시형). Key pose = idle: crouched at the start line, whole body leaning 12° forward
// about the feet centre (100,186). walk 4f bouncing run (12 fps): land · push · airborne · reach.
// Body parts are drawn pre-tilt inside one matrix group; legs are solved in box space (feet stay on the ground).
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const B = PN.bombers, _ = B && B._;
  if (!_) return;
  const K = PN.enemies._K, C = K.C, f = K.f, sm = K.sm, pl = K.pl;
  const Q = (_.BURST = { CH: {} });
  Q.TILT = 12;
  Q.C0 = [100, 100]; Q.RX = 65; Q.RY = 56;            // pouch ellipse (pre-tilt): x 35-165, y 44-156 (area ≈ fuse × 1.1)
  Q.MT = _.rot(Q.TILT, 100, 186);
  Q.CEN = _.ap(Q.MT, Q.C0);
  Q.EYE = [128, 72];
  Q.HIP = { near: [112, 148], far: [86, 146] };
  // grin notch (pre-tilt): upper lip, mouth corner (up-turned), smile dip, lower lip
  Q.NOTCH = { U: [163.6, 88.4], A: [150, 104], D: [153, 117.5], L: [156.3, 128] };
  // trigger horns: angles (deg, pre-tilt, 270 = up), lengths beyond the contour. Uneven spacing 22-36°, neighbour
  // lengths differ ≥ 15%, nothing within ±10° of the crown before or after the tilt (it would read as a wick)
  // (5 horns: a sixth at the front would point forward like a charger's horn)
  Q.HORNS = [[196, 16], [223, 21], [246, 13], [281, 19], [309, 14]];
  Q.HL = sm([[28, 150, 1], [18, 100], [30, 38], [90, 20], [140, 30], [122, 47, 1], [100, 49.5], [77, 54], [59, 65], [46.5, 84], [42.5, 104], [42.5, 122], [39.5, 134, 1]]);
  Q.RIM = [50, 74, 64, 52, 100, 45];
  // seam splits on the lower back, inside the contour (each ≥ 20 units long, far from the eye and the ch5 hole)
  // two different splits (down-left with small uneven kinks · down-right, gently bent) — never a parallel zigzag pair
  Q.SEAMS = [[[67, 117], [65, 122.5], [65.8, 127], [62.8, 131.5], [63.4, 136.5], [60.5, 141]], [[70, 133], [74.5, 136.5], [77.5, 141.5], [81.5, 145], [86, 148.5]]];
  Q.DRIPS = [[66, 146, 15, 5.6], [82, 152, 10, 4.2]];
  // legs in box space per pose: knee k, heel e, ball b, toes [[x,y],...] (first = main toe). near = lead (ink), far = trailing (ink.700)
  Q.J = {
    idle: {
      near: { k: [139, 161], e: [132, 174], b: [149, 182], toes: [[163, 186], [157, 187.2], [142, 186.6]] },
      far: { k: [88, 164], e: [70, 159], b: [59, 180], toes: [[47, 186], [53, 187.2], [66, 186.6]] }
    },
    walk: [
      { near: { k: [139, 163], e: [131, 175], b: [148, 182], toes: [[162, 186], [156, 187.2], [141, 186.6]] },
        far: { k: [86, 162], e: [68, 157], b: [56, 176], toes: [[45, 181], [50, 183], [62, 180.5]] } },
      { near: { k: [127, 168], e: [115, 175], b: [104, 182], toes: [[93, 186], [99, 187.2], [111, 186.6]] },
        far: { k: [113, 155], e: [104, 165], b: [117, 170], toes: [[128, 172], [123, 175], [111, 172]] } },
      { near: { k: [139, 150], e: [129, 162], b: [142, 171], toes: [[152, 177], [147, 178.5], [137, 175]] },
        far: { k: [107, 150], e: [92, 158], b: [99, 169], toes: [[108, 175], [103, 176.5], [93, 172]] } },
      { near: { k: [144, 152], e: [148, 166], b: [160, 178], toes: [[171, 185], [165, 186], [154, 183]] },
        far: { k: [84, 156], e: [66, 151], b: [54, 167], toes: [[43, 172], [47, 175], [59, 170]] } }
    ]
  };

  Q.pose = (st, fr) => {
    const P = { st, fr, speed: false, dust: null };
    let by = 0, sx = 1, sy = 1, J = Q.J.idle;
    if (st === 'walk') {
      by = [6, 0, -12, -4][fr]; sx = [1.06, 0.98, 0.96, 1][fr]; sy = [0.94, 1.03, 1.05, 1][fr]; J = Q.J.walk[fr];
      P.speed = fr === 2; P.dust = fr === 0 ? [123, 184, 6] : null;
    }
    P.M = _.mul(_.tr(0, by), _.mul(_.scl(sx, sy, Q.CEN[0], Q.CEN[1]), Q.MT));
    P.near = Object.assign({ h: _.ap(P.M, Q.HIP.near) }, J.near);
    P.far = Object.assign({ h: _.ap(P.M, Q.HIP.far) }, J.far);
    return P;
  };

  // pouch outline (pre-tilt) with the notch; k(a) = per-chapter radius factor (taut bulges); poly = faceted
  Q.pts = (spec) => {
    const N = Q.NOTCH, k = spec.k || ((a) => 1 + 0.018 * Math.sin(a * 3 * Math.PI / 180)), pts = [N.U.concat(1), N.A.concat(1), N.D, N.L.concat(1)];
    for (let a = 48; a <= 336; a += 18) { const r = a * Math.PI / 180, kk = k(a) * (a > 60 && a < 120 ? 0.985 : 1); pts.push([Q.C0[0] + Q.RX * kk * Math.cos(r), Q.C0[1] + Q.RY * kk * Math.sin(r)]); }
    return pts;
  };
  // horn frame: base on the contour (inset), unit direction, unit side
  Q.horn = (i) => {
    const [a, L] = Q.HORNS[i], r = a * Math.PI / 180;
    const p = [Q.C0[0] + Q.RX * Math.cos(r), Q.C0[1] + Q.RY * Math.sin(r)];
    let nx = Math.cos(r) / Q.RX, ny = Math.sin(r) / Q.RY; const l = Math.hypot(nx, ny); nx /= l; ny /= l;
    return { b: [p[0] - nx * 5, p[1] - ny * 5], tip: [p[0] + nx * L, p[1] + ny * L], d: [nx, ny], s: [-ny, nx], L: L + 5, i };
  };

  // perpendicular teeth row (paper, ink rim): base a→b inset along nrm, tips toward nrm
  _.teeth = (x, a, b, n, h, nrm, inset = 0) => {
    const A = [a[0] + nrm[0] * inset, a[1] + nrm[1] * inset], Bp = [b[0] + nrm[0] * inset, b[1] + nrm[1] * inset];
    let d = `M${f(A[0])},${f(A[1])}`;
    for (let i = 1; i <= n; i++) {
      const t = (i - 0.5) / n, t2 = i / n, hh = h * (i % 2 ? 1 : 0.8);
      d += ` L${f(A[0] + (Bp[0] - A[0]) * t + nrm[0] * hh)},${f(A[1] + (Bp[1] - A[1]) * t + nrm[1] * hh)} L${f(A[0] + (Bp[0] - A[0]) * t2)},${f(A[1] + (Bp[1] - A[1]) * t2)}`;
    }
    return `<path d="${d} Z" fill="${C.p50}" stroke="${C.ink}" stroke-width="${f(x.art ? 1.1 : 0.55 * x.u)}" stroke-linejoin="round"/>`;
  };
  const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };

  // long bird leg: thigh · shin · raised heel → ball, then 2-3 toes (claw or web)
  Q.leg = (x, J, far, spec) => {
    const P = [J.h, J.k, J.e, J.b], W = [15, 12, 10, 9], fill = far ? C.ink7 : C.ink, ow = x.art ? x.W * 0.72 : x.u * 0.7;
    const d = K.limbD(P, W, 'none', 1);
    let toes = '';
    if (spec.web) {
      const t = J.toes;
      toes += x.shape(sm([J.b, [t[0][0], t[0][1] - 1], [t[0][0] - 1, t[0][1] + 1.2, 1], [t[1][0], t[1][1] + 0.6, 1], [t[2][0], t[2][1] + 0.4, 1], [J.b[0] + (t[2][0] - J.b[0]) * 0.4, J.b[1] - 1]]), fill, ow);
    }
    J.toes.forEach((t, i) => {
      const u = unit(J.b, t), s = [-u[1], u[0]], w = i === 2 ? 3.2 : 4.4, base = [J.b[0] - u[0] * 2, J.b[1] - u[1] * 2];
      toes += x.shape(pl([[base[0] + s[0] * w, base[1] + s[1] * w], [t[0], t[1], 1], [base[0] - s[0] * w, base[1] - s[1] * w]]), fill, x.art ? 1.3 : x.u * 0.55);
    });
    let o = toes + x.shape(d, fill, ow);
    if (!far) o += x.inClip(d, x.T([J.k[0] - 5, J.k[1] - 2, (J.k[0] + J.e[0]) / 2 - 5, (J.k[1] + J.e[1]) / 2, J.e[0] - 4, J.e[1] + 2], x.art ? 3.6 : 4.2, 'mid', C.ink5));
    return o;
  };

  Q.face = (x, spec) => {
    const art = x.art, s = art ? 11 : 12, [ex, ey] = Q.EYE, N = Q.NOTCH;
    let o = '';
    // teeth: 3-4 upper hang into the notch, 2-3 lower stand up from the smile line
    const nu = (() => { const u = unit(N.U, N.A); return [u[1], -u[0]]; })(), nl = (() => { const u = unit(N.A, N.L); return [u[1], -u[0]]; })();
    const la = [N.A[0] + (N.L[0] - N.A[0]) * 0.36, N.A[1] + (N.L[1] - N.A[1]) * 0.36];
    o += _.teeth(x, [N.U[0] - 1.2, N.U[1] + 1.4], [N.A[0] + 1.4, N.A[1] - 1.6], art ? 4 : 3, art ? 5.2 : 6, nu, art ? 2.2 : 3.4);
    o += _.teeth(x, la, [N.L[0] - 0.6, N.L[1] - 1.8], art ? 3 : 2, art ? 4.6 : 5.6, nl, art ? 2.2 : 3.4);
    if (art) o += x.T([N.A[0] + 1, N.A[1] + 1, N.A[0] - 4, N.A[1] - 3, N.A[0] - 5, N.A[1] - 9], 1.8, 'mid', C.ink5); // grin crease
    o += K.eye(x, ex, ey, s, spec.eye || {});
    if (art) {
      o += x.T([ex - s * 0.95, ey + s * 0.6, ex, ey + s * 1.05, ex + s * 0.9, ey + s * 0.5], 1.6, 'mid', C.ink5); // lower lid
      if (spec.glint) o += K.circ(ex + spec.glint[0] * s, ey + spec.glint[1] * s, Math.max(1, s * 0.09), C.p50);
      o += x.T([ex - s * 1.05, ey - s * 1.15, ex - s * 0.1, ey - s * 1.75, ex + s * 0.85, ey - s * 1.42], 2.2, 'mid', C.ink5); // raised thin brow
    }
    return o;
  };

  Q.draw = (x, spec) => {
    const st = x.o.state === 'hit' ? 'idle' : x.o.state, P = Q.pose(st, x.fr), M = P.M, sil = x.o.silhouette;
    let g = '';
    if (P.speed && !sil) g += K.speed(x, 44, 88, x.art ? 40 : 36, 15);
    if (P.dust && !sil) g += K.puffs(x, [P.dust]);
    g += Q.leg(x, P.far, true, spec) + Q.leg(x, P.near, false, spec);
    const pts = Q.pts(spec), d = spec.poly ? pl(pts) : sm(pts);
    let horns = '';
    Q.HORNS.forEach((h, i) => { horns += spec.horn(x, Q.horn(i), i); });
    let seams = '';
    Q.SEAMS.forEach((sp) => { const sd = K.pl(sp, false); seams += x.art ? x.line(sd, 5, C.ink) + x.line(sd, 3, C.p300) + x.line(sd, 1.1, C.p50) : x.line(sd, 7, C.ink) + x.line(sd, 3.8, C.ink3); });
    let core = x.shape(d, C.ink) + x.inClip(d, x.keylight(spec.hl || Q.HL, 3, 4, 40) + (spec.over ? spec.over(x, P, d) : '') + x.rim(spec.rim || Q.RIM) + seams);
    if (spec.holes) core = K.holed(x, spec.holes, core, spec.erase ? spec.erase(x) : '');
    const body = (spec.back ? spec.back(x, P) : '') + horns + K.drips(x, spec.drips || Q.DRIPS, 2) + core + Q.face(x, spec) + (spec.top ? spec.top(x, P) : '');
    g += `<g transform="${_.mstr(M)}">${body}</g>`;
    return { g, eyeM: M };
  };

  // ======================= Ch1 · 구김 먹공 (crumpled ink ball) =======================
  Q.CH[1] = {
    eye: { a: -22 }, glint: [0.27, -0.19],
    k: (a) => 1 + 0.03 * Math.sin(a * 5 * Math.PI / 180 + 1) - 0.015 * Math.cos(a * 3 * Math.PI / 180),
    horn: (x, H, i) => { // crumpled paper corner: a triangle with a torn, slightly curled tip; #1 and #4 show their ink.300 back
      const { b, d, s, L } = H, w = 7.2, curl = i % 2 ? 2.6 : -2.2;
      const tip = [b[0] + d[0] * L + s[0] * curl, b[1] + d[1] * L + s[1] * curl], tip2 = [b[0] + d[0] * (L - 4.5) - s[0] * 2.6, b[1] + d[1] * (L - 4.5) - s[1] * 2.6];
      const pts = [[b[0] + s[0] * w, b[1] + s[1] * w], [b[0] + d[0] * L * 0.55 + s[0] * w * 0.62, b[1] + d[1] * L * 0.55 + s[1] * w * 0.62, 1], tip.concat(1), tip2.concat(1), [b[0] + d[0] * L * 0.45 - s[0] * w * 0.5, b[1] + d[1] * L * 0.45 - s[1] * w * 0.5, 1], [b[0] - s[0] * w, b[1] - s[1] * w]];
      return x.shape(pl(pts), i === 1 || i === 4 ? C.ink3 : C.ink, x.art ? x.W * 0.75 : x.u * 0.7);
    },
    over: (x) => x.T([66, 64, 83, 76, 76, 97], x.art ? 2.6 : 4.8, 'mid', C.ink5) + x.T([48, 101, 68, 104, 76, 121], x.art ? 2.6 : 4.8, 'mid', C.ink5) + (x.art ? x.T([97, 57, 106, 62, 104, 72], 2, 'mid', C.ink5) : '') // crumple creases (2-3)
  };
  // ellipse ring sample (pre-tilt) between two radius factors, angles a0→a1 (deg)
  Q.arcBand = (a0, a1, k0, k1, n = 10) => {
    const P = (a, k) => { const r = a * Math.PI / 180; return [Q.C0[0] + Q.RX * k * Math.cos(r), Q.C0[1] + Q.RY * k * Math.sin(r)]; };
    const o = [], i = [];
    for (let j = 0; j <= n; j++) { const a = a0 + (a1 - a0) * j / n; o.push(P(a, k0)); i.unshift(P(a, k1)); }
    o[0].push(1); o[o.length - 1].push(1); i[0].push(1); i[i.length - 1].push(1);
    return sm(o.concat(i));
  };

  // ======================= Ch2 · 리벳 성수통 (riveted iron pail) =======================
  Q.CH[2] = {
    eye: {}, glint: [0.06, -0.48],
    k: (a) => 1.014 + 0.022 * Math.cos(a * 4 * Math.PI / 180),
    horn: (x, H, i) => {
      const art = x.art, { b, d, s, L } = H, ow = art ? x.W * 0.72 : x.u * 0.65;
      if (i === 2) { // the broken strap end, lifted off the crown — counts as one horn
        const w = 5.4, m = [b[0] + d[0] * L * 0.55 - s[0] * 3, b[1] + d[1] * L * 0.55 - s[1] * 3], t = [b[0] + d[0] * L - s[0] * 7, b[1] + d[1] * L - s[1] * 7];
        return x.shape(sm([[b[0] + s[0] * w, b[1] + s[1] * w], [m[0] + s[0] * w, m[1] + s[1] * w], [t[0] + s[0] * w, t[1] + s[1] * w, 1], [t[0] + d[0] * 1.5 - s[0] * 1.5, t[1] + d[1] * 1.5 - s[1] * 1.5, 1], [t[0] - d[0] * 1.2 - s[0] * 3.4, t[1] - d[1] * 1.2 - s[1] * 3.4, 1], [t[0] - s[0] * w, t[1] - s[1] * w, 1], [m[0] - s[0] * w, m[1] - s[1] * w], [b[0] - s[0] * w, b[1] - s[1] * w]]), C.ink7, ow) +
          K.circ(m[0] - d[0] * 3, m[1] - d[1] * 3, art ? 2.2 : 2.8, C.ink);
      }
      const w = 5.4, hr = 7.2, top = [b[0] + d[0] * (L - hr * 0.75), b[1] + d[1] * (L - hr * 0.75)];
      let o = x.shape(pl([[b[0] + s[0] * w, b[1] + s[1] * w], [top[0] + s[0] * w * 0.9, top[1] + s[1] * w * 0.9], [top[0] - s[0] * w * 0.9, top[1] - s[1] * w * 0.9], [b[0] - s[0] * w, b[1] - s[1] * w]]), C.ink, ow);
      o += x.shape(`M${f(top[0] - hr)},${f(top[1])} A${hr},${hr} 0 1 0 ${f(top[0] + hr)},${f(top[1])} A${hr},${hr} 0 1 0 ${f(top[0] - hr)},${f(top[1])} Z`, C.ink7, ow);
      return o + K.circ(top[0] - 2.2, top[1] - 2.4, art ? 1.7 : 2.2, C.ink5);
    },
    over: (x) => { // hoop band below the grin + the strap over the back (its broken end is horn #2)
      const art = x.art, hoop = sm([[34, 124, 1], [66, 141], [100, 148], [128, 146], [150, 138, 1], [154, 149, 1], [128, 157], [100, 159], [66, 152], [34, 135, 1]]);
      let o = x.shape(hoop, C.ink7, art ? 1.4 : x.u * 0.45) + x.T([36, 125.5, 92, 150, 150, 139.5], art ? 1.8 : 4, 'mid', C.ink5);
      o += x.shape(Q.arcBand(156, 238, 1.04, 0.86), C.ink7, art ? 1.4 : x.u * 0.45);
      [[62, 147, 2.6], [96, 153.5, 2.8], [121, 152.5, 2.6], [47, 103, 2.4], [58, 69, 2.4]].forEach(([a, b2, r]) => { o += K.circ(a, b2, art ? r : r + 0.6, C.ink); });
      return o;
    }
  };

  // ======================= Ch3 · 먹 복어 (ink pufferfish) =======================
  Q.CH[3] = {
    eye: { noSat: true }, glint: [0.13, -0.04], web: true,
    k: (a) => 1 + 0.02 * Math.sin(a * 6 * Math.PI / 180),
    back: (x) => { // small forked tail fin (≤ 4 px), behind the body
      const fin = sm([[46, 99], [33, 92], [27, 87, 1], [30, 100.5], [26, 114, 1], [34, 109], [46, 111]]);
      return x.shape(fin, C.ink7, x.art ? x.W * 0.72 : x.u * 0.65) + (x.art ? x.line('M43,103 L31,94 M43,107 L30,110', 1.1, C.ink5) : '');
    },
    horn: (x, H) => { // puffer spine: thin taper with a rounded tip, base ≥ 10
      const { b, d, s, L } = H, w = 5.2, t = [b[0] + d[0] * L, b[1] + d[1] * L];
      return x.shape(sm([[b[0] + s[0] * w, b[1] + s[1] * w, 1], [t[0] + s[0] * 1.7 - d[0] * 1.2, t[1] + s[1] * 1.7 - d[1] * 1.2], [t[0] + d[0] * 1.3, t[1] + d[1] * 1.3], [t[0] - s[0] * 1.7 - d[0] * 1.2, t[1] - s[1] * 1.7 - d[1] * 1.2], [b[0] - s[0] * w, b[1] - s[1] * w, 1]]), C.ink, x.art ? x.W * 0.7 : x.u * 0.6);
    },
    over: (x) => (x.art ? x.line('M60,118 Q66,128 64,140 M74,130 Q80,138 78,150', 1.2, C.ink5) + `<path d="${sm([[44, 118], [58, 126], [70, 142], [56, 142], [46, 132]])}" fill="${x.dot(20)}"/>` : '')
  };

  // ======================= Ch4 · 바늘 터진 시계알 (cracked watch egg) =======================
  Q.CH[4] = {
    eye: { hand: -14 },
    horn: (x, H, i) => { // clock hands: hour short & thick, minute long, second thin (base ≥ 10); counterweight bump at the root
      const art = x.art, { b, d, s, L } = H, kind = ['hour', 'minute', 'hour', 'minute', 'second'][i], ow = art ? x.W * 0.7 : x.u * 0.6;
      const at = (t, side) => [b[0] + d[0] * L * t + s[0] * side, b[1] + d[1] * L * t + s[1] * side];
      let pts;
      if (kind === 'hour') pts = [at(0, 5.2), at(0.5, 3.2), at(0.62, 6.6).concat(1), at(1.08, 0).concat(1), at(0.62, -6.6).concat(1), at(0.5, -3.2), at(0, -5.2)]; // spade head
      else if (kind === 'minute') pts = [at(0, 5.2), at(0.42, 2.8), at(0.76, 4.2).concat(1), at(1.04, 0).concat(1), at(0.76, -4.2).concat(1), at(0.42, -2.8), at(0, -5.2)]; // lance
      else pts = [at(0, 5.2), at(0.36, 1.4), at(1.08, 0.7), at(1.12, 0).concat(1), at(1.08, -0.7), at(0.36, -1.4), at(0, -5.2)]; // thin second hand
      const hub = at(kind === 'hour' ? 0.36 : 0.3, 0); // counterweight bump just outside the contour
      return x.shape(pl(pts), C.ink, ow) + x.shape(`M${f(hub[0] - 4.8)},${f(hub[1])} A4.8,4.8 0 1 0 ${f(hub[0] + 4.8)},${f(hub[1])} A4.8,4.8 0 1 0 ${f(hub[0] - 4.8)},${f(hub[1])} Z`, C.ink, art ? 1.2 : x.u * 0.45) + (art ? K.circ(hub[0] - 1.4, hub[1] - 1.4, 1.2, C.ink5) : '');
    },
    over: (x) => { // brass case-back plane (env.deep, a flat facet — never a ring) + a crack in the case
      const art = x.art;
      let o = `<path d="${pl([[36, 102], [40, 128], [55, 147], [70, 141], [59, 123], [53, 101]])}" fill="${x.E.deep}"/>`;
      if (art) o += `<path d="${pl([[40, 128], [55, 147], [70, 141], [59, 123]])}" fill="${x.dot(40)}"/>`;
      const ck = K.pl([[86, 45], [84, 51], [85, 55.5], [81.5, 61], [82, 66], [79.5, 71]], false);
      return o + (art ? x.line(ck, 3.6, C.p300) + x.line(ck, 1.1, C.p50) : x.line(ck, 4.4, C.ink3));
    }
  };

  // ======================= Ch5 · 파편 일식알 (shard eclipse egg) =======================
  Q.CH[5] = {
    eye: {}, poly: true,
    k: (a) => 1 + 0.035 * Math.sin(a * 7 * Math.PI / 180 + 0.6),
    hl: pl([[28, 150], [18, 100], [30, 38], [90, 20], [140, 30], [122, 47], [100, 50], [77, 54], [59, 65], [46.5, 84], [42.5, 104], [42.5, 122], [39.5, 134]]),
    holes: [K.crescent(54, 104, 13.5, 61, 97.5, 11)],
    erase: (x) => (x.art ? K.nibble([[38, 110], [40, 84], [56, 58], [84, 45], [110, 45]], 16, 3, 7) : ''),
    horn: (x, H) => { // obsidian shard: angular quad, one ink.500 face, sharp tip, base ≥ 10
      const { b, d, s, L } = H, at = (t, side) => [b[0] + d[0] * L * t + s[0] * side, b[1] + d[1] * L * t + s[1] * side];
      const tip = at(1, -1.5).concat(1), side = at(0.62, 4.6).concat(1);
      return x.shape(pl([at(0, 6), side, tip, at(0.4, -5.4).concat(1), at(0, -6)]), C.ink7, x.art ? x.W * 0.7 : x.u * 0.6) + `<path d="${pl([at(0.12, 1.5), side, tip])}" fill="${C.ink5}"/>`;
    },
    over: (x) => {
      const art = x.art;
      let o = `<path d="${pl([[36, 128], [52, 122], [70, 140], [58, 158], [40, 150]])}" fill="${C.ink7}"/>` + `<path d="${pl([[70, 140], [92, 150], [96, 166], [64, 166]])}" fill="${C.ink7}"/>`;
      if (art) o += x.line(pl([[52, 122], [70, 140], [92, 150]], false), 1.1, C.ink3);
      return o;
    }
  };
})(window.PN);
// ---------------------------------------------------------------------------
// part 30 · BLAST (터짐, 1 frame per kind): the body is gone. Lobed ink cloud (round brush-splat petal tips, uneven
// lengths) + irregular paper-flash core shifted toward the light + flat jagged ground splash + chapter debris + ink drops.
// Never a regular star, no X lines, no ✕ eyes, neutral colours only (+ env.deep debris). Not body-shaped (≠ PN.vfx.kill).
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const B = PN.bombers, _ = B && B._;
  if (!_) return;
  const K = PN.enemies._K, C = K.C, f = K.f, sm = K.sm, pl = K.pl;
  const BL = (_.BLAST = {});
  // petals [angle°, length × cloud ellipse, tip radius]; debris [angle°, distance × ellipse, size]; drops [angle°, distance, r]
  BL.SPEC = {
    fuse: {
      c: [100, 124], rx: 150, ry: 118, core: 0.42, body: 0.7, seed: 11,
      petals: [[-94, 1.0, 15], [-58, 0.82, 12], [-16, 1.03, 16], [16, 0.84, 11], [50, 1.0, 14], [92, 0.86, 13], [126, 1.0, 15], [160, 0.82, 11], [196, 1.03, 15], [234, 0.86, 12]],
      debris: [[-76, 1.12, 20], [-38, 1.2, 14], [-2, 1.1, 22], [32, 1.22, 12], [70, 1.08, 18], [146, 1.16, 16], [184, 1.1, 21], [218, 1.2, 13]],
      drops: [[-77, 1.06, 9], [26, 1.04, 7], [104, 1.07, 11], [180, 1.06, 8], [254, 1.08, 6.5]]
    },
    burst: {
      c: [100, 108], rx: 90, ry: 68.4, core: 0.42, body: 0.7, seed: 23,
      petals: [[-92, 1.0, 11], [-50, 0.84, 9], [-2, 0.98, 11.5], [38, 0.8, 8.5], [74, 0.94, 10], [128, 0.8, 8], [174, 1.0, 11], [216, 0.84, 9]],
      debris: [[-112, 1.14, 0], [-64, 1.22, 0], [-18, 1.1, 0], [158, 1.18, 0], [204, 1.12, 0]],
      drops: [[-28, 1.06, 7], [62, 1.05, 6], [148, 1.07, 8], [242, 1.04, 6.5]]
    }
  };
  BL.center = { fuse: BL.SPEC.fuse.c.slice(), burst: BL.SPEC.burst.c.slice() };
  const E = (S, a, k) => { const r = a * Math.PI / 180; return [S.c[0] + S.rx * k * Math.cos(r), S.c[1] + S.ry * k * Math.sin(r)]; };
  const U = (S, a) => { const r = a * Math.PI / 180, x = S.rx * Math.cos(r), y = S.ry * Math.sin(r), l = Math.hypot(x, y) || 1; return [x / l, y / l]; };

  // geometry shared by draw() and the pad computation
  BL.geom = (kind) => {
    const S = BL.SPEC[kind], g = { petals: [], drops: [], debris: [], box: [1e9, 1e9, -1e9, -1e9] };
    const grow = (p, r = 0) => { g.box[0] = Math.min(g.box[0], p[0] - r); g.box[1] = Math.min(g.box[1], p[1] - r); g.box[2] = Math.max(g.box[2], p[0] + r); g.box[3] = Math.max(g.box[3], p[1] + r); };
    g.body = _.blob(S.c[0], S.c[1], S.rx * S.body, S.ry * S.body, 14, 0.08, S.seed);
    g.core = _.blob(S.c[0] - 6, S.c[1] - 6, S.rx * S.core, S.ry * S.core, 11, 0.16, S.seed + 4, 12);
    S.petals.forEach(([a, L, tr]) => {
      const u = U(S, a), p = [-u[1], u[0]], out = E(S, a, L), tc = [out[0] - u[0] * tr, out[1] - u[1] * tr];
      const nk = [tc[0] - u[0] * tr * 1.3, tc[1] - u[1] * tr * 1.3], b0 = E(S, a - 15, S.body * 0.9), b1 = E(S, a + 15, S.body * 0.9), w = 0.8 + ((a + 400) % 7) * 0.03;
      g.petals.push({ d: sm([b0, [nk[0] + p[0] * tr * w, nk[1] + p[1] * tr * w], [tc[0] + p[0] * tr * 0.96, tc[1] + p[1] * tr * 0.96], out, [tc[0] - p[0] * tr * 0.96, tc[1] - p[1] * tr * 0.96], [nk[0] - p[0] * tr * w, nk[1] - p[1] * tr * w], b1]), tc, tr });
      grow(tc, tr);
    });
    // ground splash: flat, jagged (width 0.85 × cloud width, height 0.29 × its width)
    const sx = S.rx * 0.85, sy = sx * 0.29, rnd = K.rng(S.seed + 7);
    g.splash = [];
    for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2 + (rnd() - 0.5) * 0.12, k = i % 2 ? 0.72 + rnd() * 0.12 : 0.96 + rnd() * 0.06; g.splash.push([100 + Math.cos(a) * sx * k, 186 + Math.sin(a) * sy * k, 1]); }
    g.splash.forEach((p) => grow(p));
    S.drops.forEach(([a, k, r]) => { const p = E(S, a, k); g.drops.push([p[0], p[1], r]); grow(p, r); });
    S.debris.forEach(([a, k, s], i) => { const p = E(S, a, k); g.debris.push({ p, a, s, i }); grow(p, Math.max(s, 26) * 0.75); });
    return g;
  };
  BL.pad = {};
  ['fuse', 'burst'].forEach((kind) => {
    const b = BL.geom(kind).box, over = [-b[1], b[2] - 200, b[3] - 200, -b[0]];
    BL.pad[kind] = over.map((v) => (v > 0 ? Math.ceil(v + 8) : 0));
  });

  // chapter debris for the fuse (size = longest side, rot in degrees)
  BL.piece = {
    1: (x, p, s, rot, i) => { // torn poster scrap
      const pts = K.xf([[-s * 0.5, -s * 0.36, 1], [s * 0.18, -s * 0.42, 1], [s * 0.26, -s * 0.2, 1], [s * 0.5, -s * 0.26, 1], [s * 0.42, s * 0.36, 1], [-s * 0.08, s * 0.3, 1], [-s * 0.18, s * 0.42, 1], [-s * 0.5, s * 0.3, 1]].map((q) => [q[0] + p[0], q[1] + p[1], 1]), rot + i * 17, p[0], p[1]);
      return x.art ? x.shape(pl(pts), C.p300, 1.6) + x.inClip(pl(pts), `<rect x="${f(p[0] - s)}" y="${f(p[1] - s)}" width="${f(s * 2)}" height="${f(s * 2)}" fill="${x.dot(i % 2 ? 20 : 40)}"/>`) : x.shape(pl(pts), C.ink3, x.u * 0.7);
    },
    2: (x, p, s, rot, i) => { // bent hoop piece · rivet · iron bit
      if (i % 3 === 1) return x.shape(`M${f(p[0] - s * 0.3)},${f(p[1])} A${f(s * 0.3)},${f(s * 0.3)} 0 1 0 ${f(p[0] + s * 0.3)},${f(p[1])} A${f(s * 0.3)},${f(s * 0.3)} 0 1 0 ${f(p[0] - s * 0.3)},${f(p[1])} Z`, C.ink7, x.art ? 1.6 : x.u * 0.6) + K.circ(p[0] - s * 0.1, p[1] - s * 0.1, s * 0.09 + 0.6, C.ink5);
      if (i % 3 === 2) return x.shape(pl(K.xf([[p[0] - s * 0.5, p[1] - s * 0.1], [p[0] - s * 0.1, p[1] - s * 0.4], [p[0] + s * 0.5, p[1] - s * 0.2], [p[0] + s * 0.2, p[1] + s * 0.36]], rot, p[0], p[1])), C.ink7, x.art ? 1.6 : x.u * 0.6);
      const r = s * 0.62, a0 = (rot - 50) * Math.PI / 180, a1 = (rot + 40) * Math.PI / 180, w = 4.6;
      const P = (a, rr) => [p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr];
      return x.shape(`M${P(a0, r + w).map(f).join(',')} A${f(r + w)},${f(r + w)} 0 0 1 ${P(a1, r + w).map(f).join(',')} L${P(a1 + 0.12, r - w).map(f).join(',')} A${f(r - w)},${f(r - w)} 0 0 0 ${P(a0, r - w).map(f).join(',')} Z`, C.ink7, x.art ? 1.6 : x.u * 0.6) + K.circ(P(a0 + 0.4, r)[0], P(a0 + 0.4, r)[1], 2.2, C.ink);
    },
    3: (x, p, s, rot, i) => { // onggi shard · cork · ink droplet
      if (i % 3 === 2) return K.drip(p[0], p[1] - s * 0.5, s, s * 0.5);
      if (i % 3 === 1) return x.shape(sm(K.xf([[p[0] - s * 0.4, p[1] - s * 0.3, 1], [p[0] + s * 0.4, p[1] - s * 0.3, 1], [p[0] + s * 0.32, p[1] + s * 0.3, 1], [p[0] - s * 0.32, p[1] + s * 0.3, 1]], rot, p[0], p[1])), x.E.deep, x.art ? 1.6 : x.u * 0.6);
      const sh = K.xf([[p[0] - s * 0.5, p[1] + s * 0.1, 1], [p[0] - s * 0.1, p[1] - s * 0.34], [p[0] + s * 0.5, p[1] - s * 0.18, 1], [p[0] + s * 0.24, p[1] + s * 0.06, 1], [p[0] - s * 0.1, p[1] + s * 0.3, 1]], rot, p[0], p[1]);
      return x.shape(sm(sh), x.E.deep, x.art ? 1.6 : x.u * 0.6) + x.line(sm(K.xf([[p[0] - s * 0.34, p[1] + s * 0.04], [p[0], p[1] - s * 0.12], [p[0] + s * 0.32, p[1] - s * 0.08]], rot, p[0], p[1]), false), x.art ? 1.1 : 2.4, C.ink5);
    },
    4: (x, p, s, rot, i) => { // clock hands · one winding key · ≤ 2 small gear pieces
      if (i === 3) return K.gear(x, p[0], p[1], s * 0.42, 7, null, rot);
      if (i === 6) { // winding key: stem + two-loop bow
        const st = K.xf([[p[0] - s * 0.5, p[1]], [p[0] + s * 0.22, p[1]]], rot, p[0], p[1]), bw = K.xf([[p[0] + s * 0.36, p[1] - s * 0.17], [p[0] + s * 0.36, p[1] + s * 0.17]], rot, p[0], p[1]);
        return x.line(`M${st[0].map(f).join(',')} L${st[1].map(f).join(',')}`, x.art ? 4 : 5, C.ink) + bw.map((q) => `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(s * 0.15)}" fill="none" stroke="${C.ink}" stroke-width="${x.art ? 3.6 : 4.4}"/>`).join('');
      }
      const L = s, pts = K.xf([[p[0] - L * 0.5, p[1] - 3], [p[0] + L * 0.2, p[1] - 2.2], [p[0] + L * 0.5, p[1], 1], [p[0] + L * 0.2, p[1] + 2.2], [p[0] - L * 0.5, p[1] + 3]], rot, p[0], p[1]);
      return x.shape(pl(pts), C.ink, x.art ? 1.4 : x.u * 0.5) + K.circ(K.xf([[p[0] - L * 0.36, p[1]]], rot, p[0], p[1])[0][0], K.xf([[p[0] - L * 0.36, p[1]]], rot, p[0], p[1])[0][1], 3.6, C.ink);
    },
    5: (x, p, s, rot, i) => { // obsidian shard · ink.700 crescent bit with an ink rim
      if (i % 3 === 1) return x.shape(K.crescent(p[0], p[1], s * 0.48, p[0] + s * 0.2, p[1] - s * 0.18, s * 0.4), C.ink7, x.art ? 1.6 : x.u * 0.6);
      const q = K.xf([[p[0] - s * 0.5, p[1] + s * 0.12], [p[0] - s * 0.12, p[1] - s * 0.3], [p[0] + s * 0.5, p[1] - s * 0.06, 1], [p[0] + s * 0.06, p[1] + s * 0.28]], rot, p[0], p[1]);
      return x.shape(pl(q), C.ink7, x.art ? 1.6 : x.u * 0.6) + `<path d="${pl([q[1], q[2], [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2]])}" fill="${C.ink5}"/>`;
    }
  };

  const draw = (kind) => (x, ch) => {
    const S = BL.SPEC[kind], g = BL.geom(kind), art = x.art, sil = x.o.silhouette;
    let o = `<path d="${pl(g.splash)}" fill="${C.ink}"/>`;
    o += `<path d="${sm(g.body)}" fill="${C.ink}"/>` + g.petals.map((p) => `<path d="${p.d}" fill="${C.ink}"/>` + K.circ(p.tc[0], p.tc[1], p.tr, C.ink)).join('');
    if (art && !sil) o += g.petals.map((p, i) => (i % 3 === 0 ? K.circ(p.tc[0] + p.tr * 0.9, p.tc[1] - p.tr * 0.7, 2.2, C.ink) + K.circ(p.tc[0] + p.tr * 1.4, p.tc[1] - p.tr * 0.2, 1.4, C.ink) : '')).join('');
    o += g.drops.map(([px, py, r]) => K.circ(px, py, r, C.ink)).join('');
    // paper flash core (§12.2 active): flat p50 in game; art adds one 60% halftone band where it meets the ink
    const core = sm(g.core);
    if (art) {
      const big = sm(g.core.map((p) => [S.c[0] - 6 + (p[0] - S.c[0] + 6) * 1.22, S.c[1] - 6 + (p[1] - S.c[1] + 6) * 1.22]));
      o += `<path d="${big}" fill="${C.p50}"/><path d="${big}" fill="${x.dot(60)}"/>`;
    }
    o += `<path d="${core}" fill="${C.p50}"/>`;
    // debris: fuse = chapter material pieces, burst = its own horns flying off
    const Q = _.BURST, rnd = K.rng(S.seed + ch * 3);
    g.debris.forEach((d, i) => {
      const rot = d.a + 90 + (rnd() - 0.5) * 70;
      if (kind === 'burst') {
        const u = [Math.cos((d.a + (rnd() - 0.5) * 40) * Math.PI / 180), Math.sin((d.a + (rnd() - 0.5) * 40) * Math.PI / 180)], L = Q.HORNS[i % Q.HORNS.length][1] + 5;
        o += Q.CH[ch].horn(x, { b: [d.p[0] - u[0] * L * 0.5, d.p[1] - u[1] * L * 0.5], tip: [d.p[0] + u[0] * L * 0.5, d.p[1] + u[1] * L * 0.5], d: u, s: [-u[1], u[0]], L, i: i % Q.HORNS.length }, i % Q.HORNS.length);
      } else o += BL.piece[ch](x, d.p, d.s, rot, i);
    });
    return { g: o, eyeM: null };
  };
  BL.fuse = draw('fuse');
  BL.burst = draw('burst');
})(window.PN);
// ---------------------------------------------------------------------------
// part 90 · public API: PN.bombers.draw / meta / list / kinds / C
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const B = PN.bombers, _ = B && B._;
  if (!_) return;
  const K = PN.enemies._K, C = K.C, f = K.f;
  const KINDS = ['fuse', 'burst'];
  const STATES = { fuse: { idle: 1, walk: 4, plant: 4, blast: 1, hit: 1 }, burst: { idle: 1, walk: 4, blast: 1, hit: 1 } };
  const WALK_FPS = { fuse: 8, burst: 12 };
  // 가칭 (working names, API doc only — on-screen names go through the string tables, brief §11 Q5)
  const NAMES = { 1: { fuse: '벽보 보따리', burst: '구김 먹공' }, 2: { fuse: '무쇠 등잔', burst: '리벳 성수통' }, 3: { fuse: '젖은 옹기', burst: '먹 복어' }, 4: { fuse: '태엽 통', burst: '바늘 터진 시계알' }, 5: { fuse: '흑요 구슬', burst: '파편 일식알' } };
  const rigOf = (kind) => (kind === 'fuse' ? _.FUSE : kind === 'burst' ? _.BURST : null);

  /**
   * PN.bombers.draw(ch, kind, opts) → '<g class="pn-bomber" data-ch data-kind data-state><defs>…</defs>…</g>'
   * LOCAL BOX 200×200 facing right, pivot (100,138) = hit-circle centre, feet (100,186), r 12 (48 units), u 4.
   * opts: state 'idle'|'walk'|'plant'(fuse)|'blast'|'hit', frame, lod 'art'|'game', halo, shadow, silhouette, hitbox, flip
   */
  B.draw = function (ch, kind, opts) {
    const o = Object.assign({ state: 'idle', frame: 0, lod: 'art', halo: true, shadow: true, silhouette: false, hitbox: false, flip: false }, opts || {});
    const rig = rigOf(kind);
    let bad = '';
    if (!(Number.isInteger(ch) && ch >= 1 && ch <= 5)) bad = `chapter ${ch}`;
    else if (!rig || !rig.CH || !rig.CH[ch]) bad = `kind ${kind}`;
    else if (!Object.prototype.hasOwnProperty.call(STATES[kind], o.state)) bad = `state ${o.state} for ${kind}`;
    if (bad) { if (typeof console !== 'undefined') console.warn(`PN.bombers.draw: no ${bad}`); return '<g/>'; } // K5-G11: no fallback lettering
    const x = B.ctx(ch, kind, o), nf = STATES[kind][o.state], fr = o.frame | 0;
    x.fr = o.state === 'walk' ? ((fr % nf) + nf) % nf : o.state === 'plant' ? Math.max(0, Math.min(nf - 1, fr)) : 0;
    const L = o.state === 'blast' ? _.BLAST[kind](x, ch) : rig.draw(x, rig.CH[ch]);
    const [px, py] = _.PIV, u = x.u;
    const mode = o.silhouette ? 'sil' : (o.state === 'hit' ? 'hit' : '');
    const flt = _.filterDef(x, mode);
    let s = '';
    if (o.shadow !== false && !o.silhouette && o.state !== 'blast') s += `<ellipse cx="${px}" cy="${f(py + 0.55 * _.R * u)}" rx="${f(12 * u)}" ry="${f(5 * u)}" fill="${C.ink}" opacity="0.3"/>`;
    if (o.hitbox) s += `<circle cx="${px}" cy="${py}" r="${f(_.R * u)}" fill="none" stroke="${C.ink}" stroke-width="${f(0.9 * u)}" stroke-dasharray="${f(2.2 * u)} ${f(2.2 * u)}" opacity="0.55"/><path d="M${px - 3 * u},${py} h${6 * u} M${px},${py - 3 * u} v${6 * u}" stroke="${C.ink}" stroke-width="${f(0.8 * u)}" opacity="0.7"/>`;
    let body = mode ? `<g${flt}>${L.g}</g>` : `<g${flt}>${s}${L.g}</g>`;
    if (!mode) s = '';
    if (o.state === 'hit' && !o.silhouette) {
      const eyes = x.eyes.map(([ex, ey, es]) => K.circ(ex, ey, es * 0.78, C.ink)).join('');
      body += L.eyeM && !_.isI(L.eyeM) ? `<g transform="${_.mstr(L.eyeM)}">${eyes}</g>` : eyes;
    }
    s += body;
    const g = o.flip ? `<g transform="translate(${2 * px},0) scale(-1,1)">${s}</g>` : s;
    return `<g class="pn-bomber" data-ch="${ch}" data-kind="${kind}" data-state="${o.state}"><defs>${x.defs.join('')}</defs>${g}</g>`;
  };

  // ---------- metadata (anchors computed from the same pose functions the drawing uses) ----------
  const r2 = (p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
  function meta(ch, kind) {
    const rig = rigOf(kind), st = STATES[kind], u = _.U, m = {
      ch, kind, id: `${K.CH[ch].key}/bomber-${kind}`, nameKo: NAMES[ch][kind], chapterKo: K.CH[ch].nameKo, eyeKo: K.CH[ch].eyeKo,
      box: _.BOX.slice(), pivot: _.PIV.slice(), feet: _.FEET.slice(), r: _.R, unitsPerPx: u, displayScale: 0.25, shadowPx: [24, 10],
      states: Object.assign({}, st), walkFps: WALK_FPS[kind]
    };
    if (!rig || !rig.anchors) return m;
    const A = rig.anchors(ch);
    m.head = r2(A.head); m.eye = r2(A.eye);
    m.displayPx = [Math.round(A.pouchW / u * 2) / 2, Math.round((_.FEET[1] - A.head[1]) / u * 2) / 2];
    if (A.wick) m.wick = A.wick;
    m.blastCenter = _.BLAST && _.BLAST.center ? _.BLAST.center[kind].slice() : null;
    m.pad = {};
    Object.keys(st).forEach((s) => { m.pad[s] = s === 'blast' && _.BLAST && _.BLAST.pad ? _.BLAST.pad[kind].slice() : [0, 0, 0, 0]; });
    return m;
  }
  _.FUSE.anchors = (ch) => {
    const F = _.FUSE, spec = F.CH[ch], P0 = F.pose('idle', 0), pts = F.pts(spec, P0), xs = pts.map((p) => p[0]);
    const wick = { idle: [], walk: [], plant: [], hit: [] };
    const tipOf = (P) => { const w = F.wickAt(P); return r2(w[w.length - 1]); };
    wick.idle.push(tipOf(P0)); wick.hit.push(tipOf(P0));
    for (let i = 0; i < 4; i++) { wick.walk.push(tipOf(F.pose('walk', i))); wick.plant.push(tipOf(F.pose('plant', i))); }
    return { head: [F.HEAD[0], Math.min.apply(null, pts.map((p) => p[1]))], eye: F.EYE.slice(), pouchW: Math.max.apply(null, xs) - Math.min.apply(null, xs), wick };
  };
  _.BURST.anchors = (ch) => {
    const Q = _.BURST, P0 = Q.pose('idle', 0), pts = _.aps(P0.M, Q.pts(Q.CH[ch])), xs = pts.map((p) => p[0]);
    const top = pts.reduce((a, p) => (p[1] < a[1] ? p : a), pts[0]);
    return { head: [top[0], top[1]], eye: _.ap(P0.M, Q.EYE), pouchW: Math.max.apply(null, xs) - Math.min.apply(null, xs) };
  };
  B.kinds = KINDS.slice();
  B.C = C;
  B.list = [];
  for (let ch = 1; ch <= 5; ch++) KINDS.forEach((kind) => B.list.push(meta(ch, kind)));
  B.meta = (ch, kind) => B.list.find((m) => m.ch === ch && m.kind === kind);
})(window.PN);
