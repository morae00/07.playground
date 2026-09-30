// =====================================================================
// k-bosses2.js — PN.bossesB · 라운드 최종 보스 Ch3~Ch5
//   'empress' 걸쇠 여제 (Ch3 St10 · traps/grid)
//   'herald'  톱니 전령 (Ch4 St10 · saw)
//   'balance' 공백 천칭 (Ch5 St10 · null · 최종 보스)
// LOCAL BOX 384 x 384 (= bible §7.3 @2x 원화 셀). PIVOT (192,252) = 판정 원 중심 (r54@1x = 108u).
// FEET y=360 (= pivot + r). 그림자 타원 중심 (192,311) rx108 ry44 (= pivot + 0.55r, 폭 = 판정 지름).
// Display: scale 0.5 → 인게임 156px (1x). 원화/시트 일러스트는 scale 1.5~1.7 + detail:'art'.
// Faces RIGHT (3/4 front). Flip: translate(2*px,0) scale(-1,1). 몸 자전 금지 — 톱니·천칭 팔만 회전.
// Requires lib.js (PN.C, PN.taper) loaded first. Every call returns a <g> with its own unique-id <defs>.
// =====================================================================
window.PN = window.PN || {};
(function (PN) {
  const K = {
    ink: '#0E0E10', ink700: '#2B2926', ink500: '#46423D', ink300: '#8C8579', ink100: '#BCB4A5',
    paper50: '#FAF6EC', paper: '#F3EEE2', paper300: '#D8D0C0', voidPaper: '#E2DBCB',
    ally: '#00A8C6', allyDeep: '#007C94', hostile: '#EF5B4F', hostileDeep: '#B8352B',
    warn: '#D88D16', reward: '#86B82D', elite: '#805AD5',
    ch3: { light: '#C9CEC4', base: '#ADB4AA', deep: '#8A9288', spot: '#56625C' },
    ch4: { light: '#D5CAB2', base: '#BBAE94', deep: '#978A70', spot: '#7C6644' },
    ch5: { light: '#C8C3C9', base: '#ABA5AC', deep: '#8A848C', spot: '#3E3747' }
  };
  const BOX = { w: 384, h: 384, pivot: [192, 252], feet: [192, 360], r: 108, shadow: { cx: 192, cy: 311, rx: 108, ry: 44 }, gameScale: 0.5 };
  const f = (n) => Math.round(n * 100) / 100;
  const pt = (p) => f(p[0]) + ',' + f(p[1]);
  let UID = 0;

  // ---------- per-call drawing context ----------
  function ctx(o) {
    const id = 'kb2_' + (UID++) + '_';
    const game = o.detail === 'game';
    const lw = game ? 2.5 : 1;        // outline multiplier (art 2.6u visible → game 6.5u ≈ 3.3px@1x + shadow-side dup)
    const li = game ? 1.8 : 1;        // inner line multiplier
    const pitch = game ? 6 : 4.4;     // halftone pitch (game 6u = 3px@1x, bible §4 ≥3px)
    const defs = [];
    let n = 0;
    const X = { id, game, lw, li, pitch, o, defs, K };
    X.uid = (p = 'u') => id + p + (n++);
    const dot = (name, col, cov, pv = pitch) => {
      const r = pv * Math.sqrt(cov / Math.PI);
      defs.push(`<pattern id="${id}${name}" width="${pv}" height="${pv}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="${pv / 2}" cy="${pv / 2}" r="${f(r)}" fill="${col}"/></pattern>`);
    };
    dot('d20', K.ink, 0.2); dot('d40', K.ink, 0.4); dot('d60', K.ink, 0.6);
    dot('g20', K.ink300, 0.2); dot('g40', K.ink300, 0.36);
    X.pat = (name) => `url(#${id}${name})`;
    X.clip = (d) => { const c = X.uid('c'); defs.push(`<clipPath id="${c}"><path d="${d}"/></clipPath>`); return c; };
    X.O = (v = 2.6) => `stroke="${K.ink}" stroke-width="${f(v * 2 * lw)}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"`;
    X.P = (d, fill, v = 2.6, extra = '') => `<path d="${d}" fill="${fill}" ${X.O(v)} ${extra}/>`;
    // outlined shape + clipped interior shading
    X.S = (d, fill, v, inner) => { const c = X.clip(d); return `${X.P(d, fill, v)}<g clip-path="url(#${c})">${inner}</g>`; };
    // shaded shape + separation contour (ink500 line on the edge so overlapping blacks stay readable)
    X.SS = (d, fill, v, inner, sep = K.ink500) => X.S(d, fill, v, inner) + `<path d="${d}" fill="none" stroke="${sep}" stroke-width="${f(1.3 * li)}" stroke-linejoin="round"/>`;
    X.L = (d, w, col = K.ink, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w * li)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
    X.T = (p, w, mode = 'mid', fill = K.ink, extra = '') => PN.taper(p, w * li, mode, fill, extra);
    X.art = (s) => (game ? '' : s);
    X.gameOnly = (s) => (game ? s : '');
    return X;
  }

  // ---------- geometry helpers ----------
  // gear outline (teeth trapezoids) as a closed path; optional hollow hole radius → evenodd ring
  function gearPath(cx, cy, rOut, rRoot, teeth, rot = 0, hole = 0, tip = 0.42) {
    const out = [];
    const step = (Math.PI * 2) / teeth, a0 = (rot * Math.PI) / 180;
    for (let i = 0; i < teeth; i++) {
      const a = a0 + i * step;
      const q = [
        [a - step * 0.5, rRoot], [a - step * (tip * 0.5 + 0.08), rRoot], [a - step * tip * 0.5, rOut],
        [a + step * tip * 0.5, rOut], [a + step * (tip * 0.5 + 0.08), rRoot]
      ];
      q.forEach(([ang, r], k) => out.push((i === 0 && k === 0 ? 'M' : 'L') + f(cx + Math.cos(ang) * r) + ',' + f(cy + Math.sin(ang) * r)));
    }
    let d = out.join(' ') + ' Z';
    if (hole > 0) d += ` M ${f(cx + hole)},${cy} A ${hole} ${hole} 0 1 0 ${f(cx - hole)},${cy} A ${hole} ${hole} 0 1 0 ${f(cx + hole)},${cy} Z`;
    return d;
  }
  const circ = (cx, cy, r) => `M ${f(cx + r)},${f(cy)} A ${r} ${r} 0 1 0 ${f(cx - r)},${f(cy)} A ${r} ${r} 0 1 0 ${f(cx + r)},${f(cy)} Z`;
  const ell = (cx, cy, rx, ry) => `M ${f(cx + rx)},${f(cy)} A ${rx} ${ry} 0 1 0 ${f(cx - rx)},${f(cy)} A ${rx} ${ry} 0 1 0 ${f(cx + rx)},${f(cy)} Z`;
  // Catmull-Rom → cubic path through points
  function smooth(pts, closed = false) {
    const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
    let d = 'M ' + pt(P[1]);
    for (let i = 1; i < P.length - 2; i++) {
      const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C ${pt(c1)} ${pt(c2)} ${pt(p2)}`;
    }
    return d + (closed ? ' Z' : '');
  }
  const rotP = (p, c, deg) => { const a = (deg * Math.PI) / 180, dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)]; };

  // ---------- shared ink vocabulary ----------
  // enemy ink drip (flows DOWN = hostile, bible §5-7)
  function drip(X, x, y, len, w = 5) {
    const w2 = w * X.li;
    return `<path d="M ${f(x - w2 / 2)},${f(y)} C ${f(x - w2 / 2)},${f(y + len * 0.5)} ${f(x - w2 * 0.2)},${f(y + len * 0.7)} ${f(x)},${f(y + len)} C ${f(x + w2 * 0.2)},${f(y + len * 0.7)} ${f(x + w2 / 2)},${f(y + len * 0.5)} ${f(x + w2 / 2)},${f(y)} Z" fill="${K.ink}"/>` +
      `<path d="M ${f(x)},${f(y + len + w2 * 0.9)} q ${f(-w2 * 0.8)},${f(w2 * 1.3)} 0,${f(w2 * 1.7)} q ${f(w2 * 0.8)},${f(-w2 * 0.4)} 0,${f(-w2 * 1.7)} Z" fill="${K.ink}"/>`;
  }
  // paper crack (P2 phase mark) — zigzag paper line with ink shoulder
  function crack(X, pts, w = 2.2) {
    const d = 'M ' + pts.map(pt).join(' L ');
    return X.L(d, w + 2.4, K.ink) + X.L(d, w, K.paper50);
  }
  // P2 PHASE crack (bible §10.1-4): bold paper.100 zigzag — ≥3px wide at 1x game (6.4u @0.5) — with an ink shoulder + optional branch
  function pcrack(X, pts, branch) {
    const pw = X.game ? 6.4 : 3.4, iw = pw + (X.game ? 4.6 : 3);
    const line = (P, k = 1) => { const d = 'M ' + P.map(pt).join(' L '); return `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="${f(iw * k)}" stroke-linejoin="miter" stroke-miterlimit="6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${K.paper}" stroke-width="${f(pw * k)}" stroke-linejoin="miter" stroke-miterlimit="6" stroke-linecap="round"/>`; };
    return line(pts) + (branch ? line(branch, 0.62) : '');
  }
  // ink flame tongue (enrage): black flame + paper core line (bible §10.1-4)
  function flame(X, x, y, h, w, lean = 0, seed = 1) {
    const r = PN.rng(seed * 97 + 13);
    const tipx = x + lean * h + (r() - 0.5) * w * 0.4, tipy = y - h;
    const d = `M ${f(x - w / 2)},${f(y)} C ${f(x - w * 0.62)},${f(y - h * 0.45)} ${f(tipx - w * 0.28)},${f(y - h * 0.62)} ${f(tipx)},${f(tipy)} C ${f(tipx + w * 0.08)},${f(y - h * 0.66)} ${f(x + w * 0.6)},${f(y - h * 0.4)} ${f(x + w / 2)},${f(y)} Z`;
    const core = X.T([x - w * 0.05, y - h * 0.1, x + lean * h * 0.5, y - h * 0.5, tipx - w * 0.05, tipy + h * 0.3], w * 0.22, 'mid', K.paper50);
    return `<path d="${d}" fill="${K.ink}" stroke="${K.ink}" stroke-width="${f(1.2 * X.li)}"/>${core}`;
  }
  // amber windup '!' (sandwich: ink ≥2px + warn + paper core), centred at (x,y), height ~ 34*s
  function exclaim(X, x, y, s = 1) {
    const k = s * (X.game ? 1.25 : 1);
    const bar = `M ${f(x - 6 * k)},${f(y - 17 * k)} L ${f(x + 6 * k)},${f(y - 17 * k)} L ${f(x + 3 * k)},${f(y + 6 * k)} L ${f(x - 3 * k)},${f(y + 6 * k)} Z`;
    const dotd = circ(x, y + 13.5 * k, 4.4 * k);
    const O = `stroke="${K.ink}" stroke-width="${f(4.4 * k)}" stroke-linejoin="round" paint-order="stroke"`;
    return `<g><path d="M ${f(x - 17 * k)},${f(y - 2 * k)} L ${f(x)},${f(y - 29 * k)} L ${f(x + 17 * k)},${f(y - 2 * k)} L ${f(x)},${f(y + 25 * k)} Z" fill="${K.ink}" opacity="0.0"/>` +
      `<path d="${bar}" fill="${K.warn}" ${O}/><path d="${dotd}" fill="${K.warn}" ${O}/>` +
      `<path d="M ${f(x - 1.6 * k)},${f(y - 13 * k)} L ${f(x - 0.6 * k)},${f(y + 1 * k)}" stroke="${K.paper50}" stroke-width="${f(1.8 * k)}" stroke-linecap="round"/></g>`;
  }
  // chain of links between two points (sag = downward bow)
  function chain(X, x0, y0, x1, y1, n, sag = 0, w = 1, col = K.ink500) {
    let o = '';
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag;
      const t2 = Math.min(1, t + 0.02), xn = x0 + (x1 - x0) * t2, yn = y0 + (y1 - y0) * t2 + Math.sin(t2 * Math.PI) * sag;
      const a = (Math.atan2(yn - y + 0.0001, xn - x + 0.0001) * 180) / Math.PI;
      const rx = 4.6 * w, ry = (i % 2 ? 1.5 : 2.8) * w;
      o += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})" fill="none" stroke="${K.ink}" stroke-width="${f(3.4 * w * X.li)}"/>`;
      o += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})" fill="none" stroke="${col}" stroke-width="${f(1.2 * w * X.li)}"/>`;
    }
    return o;
  }
  // eyes = paper holes (chapter fingerprint, bible §9.1): ch3 bubble · ch4 dial · ch5 eclipse ring
  function eyeBubble(X, x, y, r, hot = false) {
    return `${hot ? `<circle cx="${x}" cy="${y}" r="${f(r * 2.1)}" fill="${K.paper50}" opacity="0.35"/>` : ''}<circle cx="${x}" cy="${y}" r="${f(r)}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="${f(1.6 * X.li)}"/>` +
      `<circle cx="${x}" cy="${y}" r="${f(r * 0.58)}" fill="none" stroke="${K.ink}" stroke-width="${f(r * 0.2)}"/>` +
      `<circle cx="${f(x + r * 0.08)}" cy="${f(y + r * 0.06)}" r="${f(r * 0.26)}" fill="${hot ? K.paper50 : K.ink}"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.32)}" r="${f(r * 0.14)}" fill="${K.ink}" opacity="${hot ? 0 : 0.0}"/>`;
  }
  function eyeDial(X, x, y, r, hand = -40, hot = false) {
    let ticks = '';
    if (!X.game) for (let i = 0; i < 12; i++) { const a = (i * 30 * Math.PI) / 180; ticks += `<path d="M ${f(x + Math.cos(a) * r * 0.72)},${f(y + Math.sin(a) * r * 0.72)} L ${f(x + Math.cos(a) * r * 0.9)},${f(y + Math.sin(a) * r * 0.9)}" stroke="${K.ink}" stroke-width="${i % 3 ? 0.8 : 1.6}"/>`; }
    const a = (hand * Math.PI) / 180, b = ((hand + 150) * Math.PI) / 180;
    return `${hot ? `<circle cx="${x}" cy="${y}" r="${f(r * 1.9)}" fill="${K.paper50}" opacity="0.35"/>` : ''}<circle cx="${x}" cy="${y}" r="${f(r)}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="${f(1.8 * X.li)}"/>${ticks}` +
      (hot ? '' : `<path d="M ${f(x + Math.cos(b) * r * 0.35)},${f(y + Math.sin(b) * r * 0.35)} L ${x},${y} L ${f(x + Math.cos(a) * r * 0.8)},${f(y + Math.sin(a) * r * 0.8)}" fill="none" stroke="${K.ink}" stroke-width="${f(r * 0.2)}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="${f(r * 0.17)}" fill="${K.ink}"/>`);
  }
  function eyeEclipse(X, x, y, r, hot = false) {
    return `${hot ? `<circle cx="${x}" cy="${y}" r="${f(r * 2)}" fill="${K.paper50}" opacity="0.38"/>` : ''}<circle cx="${x}" cy="${y}" r="${f(r)}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="${f(1.8 * X.li)}"/>` +
      `<circle cx="${f(x + r * 0.1)}" cy="${f(y + r * 0.05)}" r="${f(r * 0.66)}" fill="${hot ? K.paper50 : K.ink}"/>` +
      (hot ? '' : `<path d="M ${f(x - r * 0.25)},${f(y - r * 0.5)} A ${f(r * 0.66)} ${f(r * 0.66)} 0 0 0 ${f(x - r * 0.5)},${f(y + r * 0.2)}" fill="none" stroke="${K.paper50}" stroke-width="${f(r * 0.1)}" opacity="0.9"/>`);
  }
  // hasp latch glyph (걸쇠): plate + hinged tongue + staple ring. open → tongue swings out
  function latch(X, x, y, s = 1, open = false, rot = 0, fill = K.ch3.deep) {
    const sw = f(1.8 * X.li * s), O = `stroke="${K.ink}" stroke-width="${f(3.6 * X.lw * s * 0.8)}" stroke-linejoin="round" paint-order="stroke"`;
    const plate = `<rect x="${f(-7 * s)}" y="${f(-5 * s)}" width="${f(14 * s)}" height="${f(10 * s)}" rx="${f(1.6 * s)}" fill="${fill}" ${O}/>`;
    const staple = `<path d="M ${f(-3 * s)},${f(3 * s)} L ${f(-3 * s)},${f(9 * s)} A ${f(3 * s)} ${f(3 * s)} 0 0 0 ${f(3 * s)},${f(9 * s)} L ${f(3 * s)},${f(3 * s)}" fill="none" stroke="${K.ink}" stroke-width="${f(2.6 * s * X.li)}"/>`;
    const tongue = open
      ? `<g transform="rotate(-118 0 ${f(-3 * s)})"><path d="M ${f(-4 * s)},${f(-3 * s)} L ${f(4 * s)},${f(-3 * s)} L ${f(4 * s)},${f(14 * s)} A ${f(4 * s)} ${f(4 * s)} 0 0 1 ${f(-4 * s)},${f(14 * s)} Z" fill="${K.ink500}" ${O}/><rect x="${f(-1.4 * s)}" y="${f(6 * s)}" width="${f(2.8 * s)}" height="${f(6 * s)}" fill="${K.ink}"/></g>`
      : `<path d="M ${f(-4 * s)},${f(-3 * s)} L ${f(4 * s)},${f(-3 * s)} L ${f(4 * s)},${f(14 * s)} A ${f(4 * s)} ${f(4 * s)} 0 0 1 ${f(-4 * s)},${f(14 * s)} Z" fill="${K.ink500}" ${O}/><rect x="${f(-1.4 * s)}" y="${f(6 * s)}" width="${f(2.8 * s)}" height="${f(6 * s)}" fill="${K.ink}"/>`;
    const pin = `<circle cx="0" cy="${f(-3 * s)}" r="${f(1.6 * s)}" fill="${K.ink300}" stroke="${K.ink}" stroke-width="${sw}"/>`;
    return `<g transform="translate(${f(x)},${f(y)}) rotate(${rot})">${plate}${open ? staple : ''}${tongue}${pin}</g>`;
  }

  // dry-brush highlight (비백): n hair strokes across width w along bezier p, with ragged starts/ends
  function dry(X, p, w, n = 4, col = K.ink300, seed = 3, mode = 'mid') {
    if (X.game) return X.T(p, w * 0.45, mode, col);
    const r = PN.rng(seed * 131 + 7);
    const cubic = p.length === 8, a = [p[0], p[1]], b = cubic ? [p[6], p[7]] : [p[4], p[5]];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    let o = '';
    for (let i = 0; i < n; i++) {
      const off = (i / Math.max(1, n - 1) - 0.5) * w, t0 = r() * 0.22, t1 = 1 - r() * 0.3;
      const q = p.map((v, k) => v + (k % 2 ? ny : nx) * off);
      // trim by moving endpoints toward interior
      const P0 = [q[0] + (q[2] - q[0]) * t0 * 2, q[1] + (q[3] - q[1]) * t0 * 2];
      const E = cubic ? [q[6] + (q[4] - q[6]) * (1 - t1) * 2, q[7] + (q[5] - q[7]) * (1 - t1) * 2] : [q[4] + (q[2] - q[4]) * (1 - t1) * 2, q[5] + (q[3] - q[5]) * (1 - t1) * 2];
      const qq = cubic ? [P0[0], P0[1], q[2], q[3], q[4], q[5], E[0], E[1]] : [P0[0], P0[1], q[2], q[3], E[0], E[1]];
      o += PN.taper(qq, (w / n) * (0.55 + r() * 0.5), mode, col);
    }
    return o;
  }

  PN.bossesB = { K, BOX, _: { ctx, gearPath, circ, ell, smooth, rotP, drip, crack, pcrack, flame, exclaim, chain, eyeBubble, eyeDial, eyeEclipse, latch, dry, f, pt }, parts: {}, anchorsOf: {} };
})(window.PN);
// ---------- 걸쇠 여제 (empress · Ch3 St10 · traps) — part 1/2: shapes + helpers ----------
// S-curve pose: hips shifted right (skirt waist x≈203), bodice leans left (shoulders x≈190), locket head tilted +9°.
// near hand raised, pinching the master latch-key toward the viewer · far hook-hand points DOWN at the ground (grid springs there)
(function (PN) {
  const B = PN.bossesB, K = B.K, { smooth, dry, f, pt, ell } = B._;
  const E = (B._emp = {});
  E.RINGS = [[202, 28, 203], [242, 62, 201], [286, 96, 198], [326, 114, 196]]; // cage hoops [centreY, halfWidth, centreX]
  E.RY = 0.3;
  E.ringPt = (k, th, back = false) => { const [yc, hw, cx] = E.RINGS[k], a = (th * Math.PI) / 180; return [cx + hw * Math.sin(a), yc + (back ? -1 : 1) * E.RY * hw * Math.cos(a)]; };
  E.SKIRT = 'M 176,200 C 160,228 120,258 102,288 C 92,306 82,318 82,326 C 86,345 136,359 196,359 C 256,359 306,345 310,326 C 310,318 300,306 290,288 C 274,258 244,228 230,200 Z';
  E.BODICE = 'M 160,158 C 170,149 208,149 220,158 C 222,176 218,194 216,208 L 201,232 L 183,210 C 172,194 160,176 160,158 Z';
  E.VEIL = 'M 160,152 C 128,164 106,200 94,240 C 84,274 68,308 40,346 L 58,340 L 60,354 L 76,344 L 84,356 L 98,346 L 108,356 C 112,300 122,246 150,198 Z';

  // J-hook finger: tapered stroke x0,y0 → x1,y1 whose tip curls by vector curl
  E.hook = function (X, x0, y0, x1, y1, curl, w = 5.6) {
    const ux = x1 - x0, uy = y1 - y0, k = X.game ? 1.2 : 1;
    const p = [x0, y0, x0 + ux * 0.6, y0 + uy * 0.6, x0 + ux * 1.08 + curl[0] * 0.5, y0 + uy * 1.08 + curl[1] * 0.5, x0 + ux * 0.9 + curl[0], y0 + uy * 0.9 + curl[1]];
    return X.T(p, w * k, 'start', K.ink) + X.art(X.T([x0 + 0.8, y0 - 0.8, x0 + ux * 0.5 + 0.8, y0 + uy * 0.5 - 0.8, x0 + ux * 0.92, y0 + uy * 0.92 - 0.6], 1.1, 'mid', K.ink300));
  };
  // hook hand: ink palm + 4 J-hooks fanning around dir (deg); lens = per-finger length factors
  E.hand = function (X, x, y, dir, spread, len, curlSign = 1, lens = [0.78, 1, 1, 0.78], wk = 1) {
    let o = `<path d="${ell(x, y, 9 * wk, 7.5 * wk)}" fill="${K.ink}" ${X.O(1.8)}/>`;
    for (let i = 0; i < 4; i++) {
      const a = ((dir + (i - 1.5) * spread) * Math.PI) / 180, L = len * lens[i];
      const x0 = x + Math.cos(a) * 6, y0 = y + Math.sin(a) * 6, x1 = x + Math.cos(a) * L, y1 = y + Math.sin(a) * L;
      const c = 9 * Math.min(1, lens[i] + 0.1), cx = Math.cos(a + (curlSign * Math.PI) / 2) * c, cy = Math.sin(a + (curlSign * Math.PI) / 2) * c;
      o += E.hook(X, x0, y0, x1, y1, [cx, cy], (i === 3 ? 4.8 : 5.8) * wk);
    }
    return o;
  };
  // pinch hand: palm at p, thumb + index hooks meet at pin (holding a chain); ring + little fingers curl into the palm
  E.pinch = function (X, p, pin) {
    const [x, y] = p;
    let o = `<path d="${ell(x, y, 9.5, 8)}" fill="${K.ink}" ${X.O(1.8)}/>`;
    o += E.hook(X, x - 5, y - 4, pin[0] - 3, pin[1] + 1, [5, -3], 5.6);       // index, arcs over the top
    o += E.hook(X, x + 6, y - 1, pin[0] + 2, pin[1] + 3, [-4, -2], 5.2);      // thumb, comes up from below
    o += E.hook(X, x + 2, y + 5, x + 14, y + 6, [0, 7], 4.8) + E.hook(X, x - 3, y + 6, x + 7, y + 12, [-1, 6], 4.4); // curled fingers
    o += `<circle cx="${f(pin[0])}" cy="${f(pin[1])}" r="${f(2.2 * X.li)}" fill="${K.ink300}" stroke="${K.ink}" stroke-width="${f(1.4 * X.li)}"/>`;
    return o;
  };
  // tapered sleeve along shoulder→elbow→wrist with a ragged bell cuff
  E.sleeve = function (X, s, e, w, fill, lit) {
    const n1 = [-(e[1] - s[1]), e[0] - s[0]], l1 = Math.hypot(n1[0], n1[1]); n1[0] /= l1; n1[1] /= l1;
    const n2 = [-(w[1] - e[1]), w[0] - e[0]], l2 = Math.hypot(n2[0], n2[1]); n2[0] /= l2; n2[1] /= l2;
    const A = (p, n, k) => [p[0] + n[0] * k, p[1] + n[1] * k];
    const d = `M ${pt(A(s, n1, 13))} C ${pt(A(e, n1, 12))} ${pt(A(e, n2, 11))} ${pt(A(w, n2, 12))} L ${pt(A(w, n2, -12))} C ${pt(A(e, n2, -8))} ${pt(A(e, n1, -8))} ${pt(A(s, n1, -12))} Z`;
    const cuffL = A(w, n2, 15), cuffR = A(w, n2, -15), dir = [(w[0] - e[0]) / l2, (w[1] - e[1]) / l2];
    const tip = (p, k, m) => [p[0] + dir[0] * k + n2[0] * m, p[1] + dir[1] * k + n2[1] * m];
    const cuff = `M ${pt(A(w, n2, 12))} L ${pt(cuffL)} L ${pt(tip(w, 12, 12))} L ${pt(tip(w, 6, 5))} L ${pt(tip(w, 16, 0))} L ${pt(tip(w, 7, -6))} L ${pt(tip(w, 13, -14))} L ${pt(cuffR)} L ${pt(A(w, n2, -12))} Z`;
    // lit sleeves get ONE designed ink500 plane along the upper edge (no stripes)
    const plane = lit ? `<path d="M ${pt(A(s, n1, 14))} C ${pt(A(e, n1, 13))} ${pt(A(e, n2, 12))} ${pt(A(w, n2, 13))} L ${pt(A(w, n2, 3))} L ${pt(A(e, n2, 6))} L ${pt(A(e, n1, 2))} Z" fill="${K.ink500}"/>` : '';
    return X.SS(d, fill, 2.4, plane + dry(X, [A(s, n1, 9)[0], A(s, n1, 9)[1], A(e, n1, 9)[0], A(e, n1, 9)[1], A(w, n2, 9)[0], A(w, n2, 9)[1]], lit ? 3.4 : 2, 3, lit ? K.ink300 : K.ink500, 5)) +
      X.P(cuff, K.ink700, 2) + X.art(X.T([cuffL[0], cuffL[1], tip(w, 8, 6)[0], tip(w, 8, 6)[1], tip(w, 14, -2)[0], tip(w, 14, -2)[1]], 1, 'mid', K.ink300));
  };
  // origami crane (facing right, wings raised) — paper300 + 40% dots, 3u ink rim; caged behind the bars
  E.crane = function (X, x, y, s, flip = false) {
    const O = `stroke="${K.ink}" stroke-width="${f((X.game ? 7.5 : 5.4) / s)}" stroke-linejoin="round" paint-order="stroke"`;
    const tail = 'M -4,1 L -27,-15 L -9,5 Z', body = 'M -13,4 L 0,-3 L 12,3 L 2,9 Z', neck = 'M 6,1 L 21,-20 L 12,4 Z', beak = 'M 20,-20 L 29,-16 L 19,-15 Z';
    const wf = 'M -4,-1 L -14,-23 L 2,-3 Z', wn = 'M -3,0 L 6,-31 L 10,1 Z';
    return `<g transform="translate(${f(x)},${f(y)}) scale(${flip ? -s : s},${s})">` +
      `<path d="${wf}" fill="${K.paper300}" ${O}/><path d="${tail}" fill="${K.paper300}" ${O}/><path d="${neck}" fill="${K.paper300}" ${O}/><path d="${beak}" fill="${K.paper300}" ${O}/>` +
      `<path d="${body}" fill="${K.paper300}" ${O}/><path d="${wn}" fill="${K.paper}" ${O}/>` +
      `<path d="${tail}" fill="${X.pat('d40')}"/><path d="${body}" fill="${X.pat('d40')}"/><path d="${wf}" fill="${X.pat('d20')}"/><path d="M 6,-31 L 10,1 L 5,0 Z" fill="${X.pat('d20')}"/>` +
      `<path d="M 6,-31 L 3,-1" stroke="${K.ink}" stroke-width="${f(1.2 / s * X.li)}"/></g>`;
  };
  // master latch-key hanging from its bow ring; origin = chain ring, points DOWN, rot = swing (deg)
  E.key = function (X, x, y, rot, s = 1.2) {
    const O = X.O(1.6 / s), m = K.ch3.deep;
    return `<g transform="translate(${f(x)},${f(y)}) rotate(${rot}) scale(${s})">` +
      `<path d="M 0,-1 A 3 3 0 1 1 0.1,-1" fill="none" stroke="${K.ink}" stroke-width="${f(2.6 * X.li)}"/>` +
      `<path d="M -8,12 C -12,6 -6,1 0,4 C 6,1 12,6 8,12 C 12,18 6,24 0,20 C -6,24 -12,18 -8,12 Z" fill="${m}" ${O}/>` +
      `<path d="${ell(0, 12, 3.4, 3.4)}" fill="${K.ink}"/>` +
      `<rect x="-4.5" y="20" width="9" height="4.6" rx="1.2" fill="${K.ink500}" ${O}/><path d="M -2.6,24 L 2.6,24 L 2.4,52 L -2.4,52 Z" fill="${m}" ${O}/>` +
      `<path d="M 2.4,41 L 11,41 L 11,44.6 L 7.4,44.6 L 7.4,47.4 L 11,47.4 L 11,52 L 2.4,52 Z" fill="${m}" ${O}/>` +
      X.art(`<path d="M -1.6,25 L -1.5,50" stroke="${K.paper300}" stroke-width="0.9"/><path d="M -5.6,8 C -4,5 -1.5,5 0,6.5" fill="none" stroke="${K.paper300}" stroke-width="0.9"/>`) + `</g>`;
  };
  E.bars = (k0, th, bend) => smooth([0, 1, 2, 3].map((k) => { const p = E.ringPt(k, th); if (bend && (k === 1 || k === 2)) p[0] += bend * (k === 1 ? 0.7 : 1); return p; }));
})(window.PN);
// ---------- 걸쇠 여제 — part 2/2: collar fan · locket head · cage skirt · composition ----------
(function (PN) {
  const B = PN.bossesB, K = B.K, E = B._emp, { drip, pcrack, flame, exclaim, chain, eyeBubble, latch, dry, f, pt, ell } = B._;
  const FANC = [188, 148];
  const FAN = [[-168, 54], [-143, 70], [-118, 84], [-93, 92], [-68, 84], [-43, 70], [-18, 54]];
  const fanP = (a, r, t) => { const ca = Math.cos((a * Math.PI) / 180), sa = Math.sin((a * Math.PI) / 180); return [FANC[0] + ca * r - sa * t, FANC[1] + sa * r + ca * t]; };

  // ---- giant latch collar: 7 hasp-tongue plates fanned behind the head (P2: one snaps and hangs loose) ----
  function fan(X, ph) {
    let s = '';
    FAN.forEach(([a, L], i) => {
      const P = (r, t) => fanP(a, r, t), lit = i <= 3, w0 = 5.5, w1 = 9;
      const slot = (Lx) => { const q = P(Lx - 13, 0); return `<rect x="${f(q[0] - 2.6)}" y="${f(q[1] - 6)}" width="5.2" height="12" rx="2.4" transform="rotate(${f(a + 90)} ${f(q[0])} ${f(q[1])})" fill="${K.ink}" stroke="${lit ? K.ink300 : K.ink500}" stroke-width="${f(0.9 * X.li)}"/>`; };
      if (ph >= 2 && i === 5) { // phase mark: plate snapped at the root, broken blade hangs on two links
        const Ls = 40, d = `M ${pt(P(26, w0))} L ${pt(P(Ls, w1 * 0.9))} L ${pt(P(Ls - 6, 3))} L ${pt(P(Ls + 3, -1))} L ${pt(P(Ls - 4, -w1 * 0.9))} L ${pt(P(26, -w0))} Z`;
        s += X.S(d, K.ink, 2.2, '') + pcrack(X, [P(27, 1), P(33, -3), P(39, 2)]);
        const e = P(Ls - 2, 0), hang = [e[0] + 3, e[1] + 12];
        s += chain(X, e[0], e[1], hang[0], hang[1], 2, 0, X.game ? 1.2 : 0.95, K.ink300);
        s += `<g transform="translate(${f(hang[0])},${f(hang[1])}) rotate(78)">` + X.S('M -2,-8 L 30,-9 C 40,-9 40,9 30,9 L -2,8 L 3,3 L -3,0 L 3,-4 Z', K.ink, 2.2,
          `<rect x="17" y="-2.6" width="12" height="5.2" rx="2.4" fill="${K.ink}" stroke="${K.ink500}" stroke-width="${f(0.9 * X.li)}"/>` + X.T([2, -6, 16, -6.5, 30, -6], 1.6, 'mid', K.ink500)) + `</g>`;
        return;
      }
      const d = `M ${pt(P(26, w0))} L ${pt(P(L - 6, w1))} C ${pt(P(L + 4, w1))} ${pt(P(L + 4, -w1))} ${pt(P(L - 6, -w1))} L ${pt(P(26, -w0))} Z`;
      const plane = lit ? `<path d="M ${pt(P(24, -w0 - 1))} L ${pt(P(L + 6, -w1 - 1))} L ${pt(P(L + 6, -1))} L ${pt(P(24, -1))} Z" fill="${K.ink500}"/>` : '';
      s += X.S(d, lit ? K.ink700 : K.ink, 2.2, plane + slot(L) + `<circle cx="${f(P(34, 0)[0])}" cy="${f(P(34, 0)[1])}" r="${f(1.9 * X.li)}" fill="${K.ink300}"/>`);
    });
    return s;
  }

  // ---- locket head (template centred (192,100); caller tilts it +9° about the neck) ----
  function head(X, ph, En) {
    const g = X.game;
    let s = '';
    // hook-latch tiara: 4 J-tines + centre bail ring & tall hook (regal cue)
    [[-56, 19], [-28, 26], [28, 26], [56, 19]].forEach(([th, L]) => {
      const t = (th * Math.PI) / 180, b = [192 + 26 * Math.sin(t), 100 - 33 * Math.cos(t)], n = [Math.sin(t) / 27, -Math.cos(t) / 34], nl = Math.hypot(n[0], n[1]);
      const u = [n[0] / nl, n[1] / nl], tip = [b[0] + u[0] * L, b[1] + u[1] * L], side = Math.sign(th);
      s += E.hook(X, b[0], b[1], tip[0], tip[1], [side * 8, 3], 7.6) + `<rect x="${f(b[0] - 4)}" y="${f(b[1] - 3)}" width="8" height="6" rx="1.4" transform="rotate(${th} ${f(b[0])} ${f(b[1])})" fill="${K.ch3.deep}" ${X.O(1.2)}/>`;
    });
    s += E.hook(X, 192, 60, 193, 30, [8, 3], 8.4);
    s += `<circle cx="192" cy="64" r="6.4" fill="none" stroke="${K.ink}" stroke-width="${f(6 * X.li)}"/><circle cx="192" cy="64" r="6.4" fill="none" stroke="${K.ink300}" stroke-width="${f(1.8 * X.li)}"/>`;
    // case (upper-left ink500 crescent = lit plane)
    s += X.S(ell(192, 100, 27, 34), K.ink, 2.8, `<path d="M 162,66 C 178,70 176,104 170,138 L 160,138 Z" fill="${K.ink500}"/>` + dry(X, [173, 78, 167, 96, 170, 122], 3, 3, K.ink300, 12));
    s += X.art(`<path d="${ell(192, 100, 24, 30.6)}" fill="none" stroke="${K.ink300}" stroke-width="0.8" stroke-dasharray="1.6 2.2" opacity="0.8"/>`);
    // bezel: ink rim ≥5u around the FACE GLASS = the one bright face (weak point, §10.1-2)
    s += `<path d="${ell(193, 101, 22, 28)}" fill="${K.ink}" stroke="${K.ink300}" stroke-width="${f(1.3 * X.li)}"/>`;
    const face = ell(193, 101, 17, 23);
    const fc = X.clip(face);
    s += `<path d="${face}" fill="${En ? K.ink700 : K.paper}"/><g clip-path="url(#${fc})">${En ? '' : `<path d="M 213,84 C 207,104 200,116 178,126 L 214,130 Z" fill="${X.pat('d20')}"/>`}</g>`;
    // two bubble eyes (Ch3 fingerprint) — ink discs with paper glints, rising bubbles, one ink tear running DOWN
    const eye = (x, y, r) => En ? eyeBubble(X, x, y, r * 1.08, true)
      : `<circle cx="${x}" cy="${y}" r="${r}" fill="${K.ink}"/><circle cx="${f(x - r * 0.34)}" cy="${f(y - r * 0.36)}" r="${f(r * 0.34)}" fill="${K.paper50}"/><circle cx="${f(x + r * 0.38)}" cy="${f(y + r * 0.3)}" r="${f(r * 0.15)}" fill="${K.paper50}"/>` +
        X.art(`<circle cx="${x}" cy="${y}" r="${f(r + 2.4)}" fill="none" stroke="${K.ink}" stroke-width="0.9"/>`);
    s += eye(185, 97, g ? 7.8 : 7.4) + eye(203, 103, g ? 5.8 : 5.3);
    if (!En) {
      s += g ? `<circle cx="182" cy="81" r="3" fill="none" stroke="${K.ink}" stroke-width="2"/>`
        : [[181, 83, 2.4], [185, 76, 1.6], [207, 91, 1.9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${K.ink}" stroke-width="1.2"/>`).join('');
      s += X.T([185.4, 104, 184.6, 112, 185.4, 119], 2.8, 'end', K.ink) + `<circle cx="185.4" cy="120.5" r="${f(g ? 2.4 : 1.9)}" fill="${K.ink}"/>`;
    }
    // open lid = faded portrait, knocked DOWN (ink500 + 60% dots, no paper) so the face wins the eye
    const portrait = X.art(`<g transform="translate(232 100) scale(0.6) translate(-235 -101)"><path d="M 238,80 C 231,80 228,86 229,92 L 226,96 L 229,98 C 228,102 231,104 233,104 L 231,110 C 226,112 224,118 224,126 L 246,126 C 246,118 243,112 239,110 C 243,106 244,100 243,95 C 245,90 245,82 238,80 Z" fill="${K.ink}" stroke="${K.ink300}" stroke-width="1.2"/></g>`);
    s += `<g transform="rotate(-10 233 98)">` + X.S(ell(233, 98, 12.5, 31), K.ink, 2.8, `<path d="${ell(232, 98, 8.6, 25)}" fill="${K.ink500}"/><path d="${ell(232, 98, 8.6, 25)}" fill="${X.pat('d60')}"/>` + portrait) +
      (ph >= 2 ? pcrack(X, [[229, 69], [236, 83], [228.5, 96], [237, 111], [231, 128]], [[236, 83], [241.5, 89]]) : '') + `</g>`;
    s += `<path d="M 215,86 L 221,86 M 215,114 L 221,114" stroke="${K.ink}" stroke-width="${f(5.4 * X.li)}" stroke-linecap="round"/><path d="M 215,86 L 221,86 M 215,114 L 221,114" stroke="${K.ink300}" stroke-width="${f(1.6 * X.li)}" stroke-linecap="round"/>`;
    return s;
  }

  // ---- cage skirt: ONE big lit crescent (upper-left ink500) + 6 bars + 3 hoops; lower-right stays pure ink900 ----
  function skirt(X, ph, W) {
    const g = X.game;
    let c = `<path d="M 178,196 C 160,226 120,256 100,288 C 90,304 78,318 78,330 L 100,341 C 104,327 112,315 124,307 L 117,295 C 130,281 142,273 154,269 L 147,255 C 158,243 170,235 182,229 L 177,216 L 190,204 Z" fill="${K.ink500}"/>`;
    c += `<path d="M 184,262 L 200,246 L 194,286 L 206,318 L 190,342 L 178,300 Z" fill="${K.ink700}"/>`;
    c += E.crane(X, 234, 297, g ? 1.34 : 1.28) + E.crane(X, 280, 332, g ? 1.0 : 0.95) + E.crane(X, 164, 284, g ? 1.1 : 1.04, true);
    if (ph >= 3) c += `<circle cx="200" cy="272" r="20" fill="${K.paper50}" opacity="0.2"/><path d="M 200,258 C 184,244 170,262 184,278 L 200,294 L 216,278 C 230,262 216,244 200,258 Z" fill="${K.ink500}" ${X.O(1.8)}/>` +
      `<path d="M 200,264 a 4.4,4.4 0 1 1 -0.1,0 Z M 197.6,268 L 195.6,281 L 204.4,281 L 202.4,268 Z" fill="${K.paper50}" stroke="${K.ink}" stroke-width="1.4"/>`;
    const bend = ph >= 3 ? { '-14': -20, '14': 20 } : {};
    [-70, -42, -14, 14, 42, 70].forEach((th) => {
      const d = E.bars(0, th, bend[th]);
      c += X.L(d, (5.6 * X.lw) / X.li, K.ink) + X.L(d, 1.8, K.ink700) + (th < 0 ? X.art(X.L(d, 1, K.ink300, `transform="translate(-1.6,-0.3)"`)) : '');
    });
    E.RINGS.forEach(([yc, hw, cx], k) => {
      if (!k) return;
      const d = `M ${cx - hw},${yc} A ${hw} ${f(hw * E.RY)} 0 0 0 ${cx + hw},${yc}`;
      c += X.L(d, ((k === 3 ? 8 : 6.4) * X.lw) / X.li, K.ink) + X.L(d, 2.2, K.ink700) + X.art(X.L(`M ${cx - hw + 1},${yc - 1.6} A ${hw} ${f(hw * E.RY)} 0 0 0 ${f(cx - hw * 0.3)},${f(yc + hw * E.RY * 0.96 - 1.6)}`, 1.1, K.ink300));
    });
    const L2 = [-70, -14, 42];
    for (let i = 0; i < 2; i++) { const p0 = E.ringPt(2, L2[i]), p1 = E.ringPt(2, L2[i + 1]); c += chain(X, p0[0] + 5, p0[1] + 8, p1[0] - 5, p1[1] + 8, g ? 5 : 8, 13, g ? 1.15 : 0.95, i ? K.ink500 : K.ink300); }
    L2.forEach((th) => { const p = E.ringPt(2, th); c += latch(X, p[0], p[1] - 2, g ? 1.5 : 1.35, W, th * 0.18, K.ch3.deep); });
    [-42, 42].forEach((th) => { const p = E.ringPt(1, th); c += latch(X, p[0], p[1] - 1, g ? 1.25 : 1.05, W, th * 0.2, K.ch3.deep); });
    [-42, 14, 70].forEach((th) => { const p = E.ringPt(3, th); c += latch(X, p[0], p[1] - 3, g ? 1.25 : 1.1, W, th * 0.12, K.ch3.deep); });
    c += dry(X, [170, 204, 130, 246, 88, 318], 5, 3, K.ink300, 4);
    return X.S(E.SKIRT, K.ink, 2.6, c);
  }

  B.parts.empress = function (X, o) {
    const g = X.game, ph = o.phase || 1, W = o.windup, En = o.enraged;
    let back = '', fig = '', front = '';
    back += X.S(E.VEIL, K.ink, 2.4, `<path d="M 162,150 C 128,162 104,200 92,240 C 84,266 72,290 58,312 L 78,306 C 94,262 110,214 146,178 Z" fill="${K.ink500}"/>` + X.art(dry(X, [150, 176, 128, 220, 116, 276, 104, 344], 3, 3, K.ink700, 9)));
    back += fan(X, ph);
    // far arm (viewer-left): hook hand points DOWN at the ground where the grid springs
    const fa = W ? { s: [162, 166], e: [124, 196], w: [80, 200] } : { s: [160, 170], e: [128, 222], w: [88, 246] };
    const fd = [(fa.w[0] - fa.e[0]), (fa.w[1] - fa.e[1])], fl = Math.hypot(fd[0], fd[1]), fu = [fd[0] / fl, fd[1] / fl], fpalm = [fa.w[0] + fu[0] * 14, fa.w[1] + fu[1] * 14];
    const fdir = (Math.atan2(fu[1], fu[0]) * 180) / Math.PI;
    back += E.sleeve(X, fa.s, fa.e, fa.w, K.ink700, true);
    back += W ? E.hand(X, fpalm[0], fpalm[1], fdir + 10, 26, 46, 1, [0.9, 1.05, 1, 0.85], 1.25) : E.hand(X, fpalm[0], fpalm[1], fdir - 34, 16, 44, 1, [0.62, 1.28, 0.84, 0.62], 1.25);
    if (!W) { const da = ((fdir - 34) * Math.PI) / 180; back += drip(X, fpalm[0] + Math.cos(da) * 58, fpalm[1] + Math.sin(da) * 58 + 2, 9, 4); }
    // cage skirt + hem drips
    fig += skirt(X, ph, W);
    fig += drip(X, 126, 352, 12, 5) + drip(X, 214, 357, 10, 4.4) + drip(X, 278, 346, 14, 5);
    if (ph >= 3) fig += drip(X, 162, 356, 18, 5.4) + drip(X, 248, 353, 20, 5);
    // corset bodice leaning left: ONE lit wedge upper-left, the rest ink900
    fig += X.S(E.BODICE, K.ink, 2.4, `<path d="M 158,156 C 168,150 176,149 184,149 L 178,170 L 187,184 L 176,204 L 184,214 L 168,214 C 162,194 158,176 158,156 Z" fill="${K.ink500}"/>` +
      chain(X, 196, 162, 200, 220, 6, 0, 0.8, K.ink500) + X.T([218, 160, 220, 182, 212, 206], 1.4, 'mid', K.ink500));
    fig += X.S('M 146,170 C 142,152 160,144 174,154 C 176,166 168,176 156,178 Z', K.ink700, 2.2, `<path d="M 140,168 C 140,150 156,144 168,148 L 156,164 Z" fill="${K.ink500}"/>`);
    // near arm (viewer-right): raised, pinching the master latch-key toward the viewer
    const na = W ? { s: [224, 162], e: [254, 132], w: [268, 88] } : { s: [224, 164], e: [264, 194], w: [284, 146] };
    const nd = [(na.w[0] - na.e[0]), (na.w[1] - na.e[1])], nl = Math.hypot(nd[0], nd[1]), palm = [na.w[0] + (nd[0] / nl) * 14, na.w[1] + (nd[1] / nl) * 14];
    const pin = [palm[0] + 8, palm[1] - 14];
    fig += E.sleeve(X, na.s, na.e, na.w, K.ink, false);
    fig += chain(X, pin[0], pin[1], pin[0] + 1, pin[1] + 11, 2, 0, X.game ? 1.1 : 0.85, K.ink300) + E.key(X, pin[0] + 1, pin[1] + 14, W ? 8 : -14, g ? 1.35 : 1.2);
    fig += E.pinch(X, palm, pin);
    fig += X.S('M 234,170 C 238,152 220,144 206,154 C 204,166 212,176 224,178 Z', K.ink, 2.2, X.T([210, 152, 226, 146, 234, 158], 1.4, 'mid', K.ink500));
    // neck + standing collar + throat latch
    fig += X.S('M 181,152 L 184,128 L 196,128 L 197,152 Z', K.ink, 1.8, dry(X, [185, 130, 184, 140, 185, 152], 2.4, 2, K.ink500, 3));
    fig += X.S('M 158,152 C 168,138 210,138 222,152 L 218,168 C 204,158 176,158 162,168 Z', K.ink700, 2.2, `<path d="M 156,150 C 166,138 186,136 196,138 L 170,160 Z" fill="${K.ink500}"/>`);
    fig += latch(X, 190, 156, g ? 2.1 : 1.9, W, 0, K.ch3.deep);
    // locket head, tilted +9° (S-curve end)
    fig += `<g transform="rotate(9 190 132)">${head(X, ph, En)}</g>`;
    if (ph >= 3) fig += drip(X, 176, 134, 26, 5) + drip(X, 216, 138, 30, 5.4) + drip(X, 170, 208, 22, 4.6) + drip(X, 222, 208, 28, 5) + drip(X, 104, 298, 26, 5);
    if (En) {
      let fl = flame(X, 170, 58, 34, 16, -0.35, 1) + flame(X, 199, 40, 46, 18, 0.05, 2) + flame(X, 228, 58, 34, 16, 0.35, 3);
      FAN.forEach(([a, L], i) => { if (i % 2) return; const p = fanP(a, L + 2, 0), ca = Math.cos((a * Math.PI) / 180); fl += flame(X, p[0], p[1] + 6, 26, 13, ca * 0.4, 10 + i); });
      back = fl + back;
    }
    if (W) front += exclaim(X, 132, 38, 1.1);
    // enrage fill-silhouette: fan sector (gaps between plates never get the coral pulse)
    const solid = 'M ' + [FANC, ...FAN.map(([a, L]) => fanP(a, L - 4, 0))].map(pt).join(' L ') + ' Z';
    return { back, fig, front, solid };
  };
  B.anchorsOf.empress = (o) => ({
    face: [197, 101], faceRim: [208, 69], muzzle: [198, 290],
    hands: o.windup ? [[272, 75], [66, 201]] : [[289, 133], [76, 253]], key: o.windup ? [283, 90] : [302, 147]
  });
})(window.PN);
// ---------- 톱니 전령 (herald · Ch4 St10 · saw) — part 1/2: shapes + props ----------
// 거대한 톱니바퀴 외발 · 전령 망토/두건 · 황동 나팔(종구 3/4 정면 = 문자판 눈 = 약점) · 등 뒤 톱니 후광(던질 톱니 4개) · 먼 손에 선언문 두루마리
(function (PN) {
  const B = PN.bossesB, K = B.K, { gearPath, circ, ell, rotP, f, pt } = B._;
  const H = (B._her = {});
  H.WH = [190, 290]; H.HALO = [190, 118]; H.MOUTH = [216, 114];
  H.HALO_SAWS = [-150, -90, -30, 160];
  H.BELL = 112; // bell-mouth centre along the tube (trumpet frame)
  // cape flowing back (viewer-left) with a TORN hem
  H.CAPE = 'M 160,146 C 128,150 96,176 72,210 C 58,230 46,246 30,258 L 48,265 L 34,281 L 58,277 L 50,298 L 72,283 L 76,302 L 90,285 L 101,299 L 108,280 L 120,289 L 124,264 C 136,236 150,206 168,184 Z';
  H.HOOD = 'M 180,144 C 172,126 172,106 180,92 C 186,82 190,74 184,56 C 200,62 216,74 224,88 C 232,102 234,120 229,134 C 226,142 222,148 216,152 Z';
  H.TORSO = 'M 148,156 C 164,142 222,142 240,156 C 242,176 236,192 232,206 L 154,206 C 150,192 146,174 148,156 Z';
  H.SKIRT = 'M 156,198 C 144,220 132,240 120,262 L 134,258 L 130,276 L 148,262 L 152,280 L 166,264 L 178,274 L 188,258 L 204,270 L 216,254 L 232,264 L 238,248 L 250,252 C 240,232 234,214 226,198 Z';

  H.saw = function (X, cx, cy, r, rot) {
    const d = gearPath(cx, cy, r, r * 0.8, 10, rot, r * 0.26, 0.5);
    return X.S(d, K.ink700, 1.8, `<path d="M ${f(cx - r)},${f(cy - r)} L ${f(cx + r * 0.2)},${f(cy - r)} L ${f(cx - r)},${f(cy + r * 0.3)} Z" fill="${K.ink500}"/>` +
      X.T([cx - r * 0.8, cy - r * 0.2, cx - r * 0.7, cy - r * 0.75, cx - r * 0.1, cy - r * 0.86], 1.4, 'mid', K.ink300)) +
      `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.34)}" fill="none" stroke="${K.ch4.deep}" stroke-width="${f(2 * X.li)}"/>`;
  };
  // dial eye (Ch4 fingerprint): paper.50 face, 4u ink rim, ink hands = pupils. squash = foreshortening along the tube
  H.dial = function (X, x, y, r, hand, hot) {
    let t = '';
    const n = X.game ? 4 : 12;
    for (let i = 0; i < n; i++) { const a = ((i * 360) / n) * (Math.PI / 180), k = X.game || i % 3 === 0 ? 1 : 0.6; t += `<path d="M ${f(x + Math.cos(a) * r * 0.7)},${f(y + Math.sin(a) * r * 0.7)} L ${f(x + Math.cos(a) * r * (0.7 + 0.2 * k))},${f(y + Math.sin(a) * r * (0.7 + 0.2 * k))}" stroke="${K.ink}" stroke-width="${f((X.game ? 2.6 : 1.5) * k)}"/>`; }
    const a = (hand * Math.PI) / 180, b = ((hand + 132) * Math.PI) / 180;
    const glow = hot ? `<circle cx="${x}" cy="${y}" r="${f(r * 1.7)}" fill="${K.paper50}" opacity="0.35"/>` : '';
    const hands = hot ? '' : `<path d="M ${f(x + Math.cos(b) * r * 0.46)},${f(y + Math.sin(b) * r * 0.46)} L ${x},${y} L ${f(x + Math.cos(a) * r * 0.74)},${f(y + Math.sin(a) * r * 0.74)}" fill="none" stroke="${K.ink}" stroke-width="${f(r * 0.24)}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="${f(r * 0.2)}" fill="${K.ink}"/>`;
    return `${glow}<circle cx="${x}" cy="${y}" r="${f(r + 2)}" fill="${K.ink}"/><circle cx="${x}" cy="${y}" r="${f(r - 2)}" fill="${K.paper50}"/>${t}${hands}` +
      (hot ? '' : `<path d="M ${f(x - r * 0.62)},${f(y - r * 0.3)} A ${f(r * 0.7)} ${f(r * 0.7)} 0 0 1 ${f(x - r * 0.2)},${f(y - r * 0.66)}" fill="none" stroke="${K.ink300}" stroke-width="${f(X.game ? 1.6 : 1)}" opacity="0.7"/>`);
  };
  // brass trumpet in its own frame (x along the tube, origin = mouthpiece), bell mouth turned 3/4 toward camera (≈1.4× old bell)
  H.trumpet = function (X, ang, hot, ph) {
    const M = H.MOUTH, tf = `translate(${M[0]},${M[1]}) rotate(${ang})`, bx = H.BELL;
    let s = `<g transform="${tf}">`;
    s += X.S('M 2,-3.4 L 80,-5 L 80,5 L 2,3.4 Z', K.ink, 2, `<path d="M 0,-4 L 84,-4 L 84,-1.2 L 0,-1.2 Z" fill="${K.ch4.deep}"/>`);
    const flare = `M 78,-5 C 90,-6 100,-16 ${bx - 4},-37 L ${bx - 4},37 C 100,16 90,6 78,5 Z`;
    s += X.S(flare, K.ink, 2.4, `<path d="M 76,-40 L ${bx},-40 L ${bx},-12 C 100,-12 90,-7 76,-3 Z" fill="${K.ch4.deep}"/><path d="M 76,-40 L ${bx},-40 L ${bx},-12 C 100,-12 90,-7 76,-3 Z" fill="${X.pat('d40')}"/>` + X.T([84, -5, 96, -12, 106, -30], 1.8, 'mid', K.paper300));
    [28, 60].forEach((x) => { s += `<rect x="${x - 3}" y="-6.6" width="6" height="13.2" rx="1.6" fill="${K.ch4.deep}" ${X.O(1.4)}/>`; });
    s += `<path d="M -5,-6 L 3,-3 L 3,3 L -5,6 Z" fill="${K.ch4.deep}" ${X.O(1.4)}/>`;
    // bell mouth (foreshortened 0.7 along the axis → reads as facing us), black throat
    s += `<path d="${ell(bx, 0, 27, 39)}" fill="${K.ch4.deep}" ${X.O(2.8)}/><path d="${ell(bx - 5, -6, 20, 26)}" fill="none" stroke="${K.paper300}" stroke-width="${f(1.4 * X.li)}" stroke-dasharray="${X.game ? '20 90' : '14 60'}" opacity="0.9"/>`;
    s += `<path d="${ell(bx + 1.5, 0, 22, 33)}" fill="${K.ink}"/>`;
    s += `<g transform="translate(${bx + 2},0) scale(0.84,1) rotate(${-ang})">${H.dial(X, 0, 0, hot ? 18 : 17, -52, hot)}</g>`;
    if (ph >= 2) s += B._.pcrack(X, [[bx - 26, -18], [bx - 20, -8], [bx - 27, 4], [bx - 21, 16], [bx - 25, 28]]);
    s += `</g>`;
    return { s, eye: rotP([M[0] + bx + 2, M[1]], M, ang) };
  };
  // proclamation scroll hanging from the far fist: two rolled rods with ink end-knobs, paper sheet (40% dots, §3.5)
  H.scroll = function (X, x, y, rot, g) {
    const knob = (xx, yy, r) => `<path d="${ell(xx, yy, r * 0.72, r)}" fill="${K.ch4.deep}" ${X.O(1.3)}/><path d="${ell(xx, yy, r * 0.3, r * 0.42)}" fill="${K.ink}"/>`;
    const sheet = 'M -16,3 C -8,1 8,1 16,3 L 17,60 C 8,63 -6,64 -17,60 Z';
    let s = `<g transform="translate(${f(x)},${f(y)}) rotate(${rot})">`;
    s += X.S(sheet, K.paper300, 1.7, `<path d="M 8,0 L 20,0 L 20,70 L 12,70 C 10,40 9,20 8,0 Z" fill="${X.pat('d40')}"/><path d="M -20,0 L 8,0 C 9,20 10,40 12,70 L -20,70 Z" fill="${X.pat('d20')}"/>` +
      [11, 19, 27, 35, 43].map((yy, i) => X.T([-12, yy, -1, yy - 1.2, 12 - (i % 2) * 8, yy + 0.4], g ? 4.4 : 3.8, 'mid', K.ink)).join('') +
      `<circle cx="8" cy="53" r="${g ? 5.2 : 4.8}" fill="none" stroke="${K.ink}" stroke-width="${f(g ? 3 : 2)}"/><path d="M 5.6,50.6 L 10.4,55.4 M 10.4,50.6 L 5.6,55.4" stroke="${K.ink}" stroke-width="${f(g ? 2.2 : 1.4)}"/>`);
    // rolled bottom end (thick paper cylinder with spiral) + top rod gripped by the fist, brass knobs
    s += `<rect x="-19" y="56" width="38" height="13" rx="6.5" fill="${K.paper300}" ${X.O(1.7)}/><rect x="-19" y="62" width="38" height="7" rx="3.5" fill="${X.pat('d60')}"/>` +
      `<path d="${ell(19, 62.5, 4.2, 6.5)}" fill="${K.paper300}" ${X.O(1.3)}/><path d="M 19,62.5 m -2,0 a 2,2.6 0 1 1 2,2.6 a 3.4,4.4 0 1 1 3,-4.2" fill="none" stroke="${K.ink}" stroke-width="${f(1.3 * X.li)}"/>`;
    s += `<rect x="-19" y="-5" width="38" height="10" rx="5" fill="${K.ink700}" ${X.O(1.6)}/>` + X.art(`<path d="M -15,-2.4 L 15,-2.4" stroke="${K.ink300}" stroke-width="1.1"/>`) + knob(-22, 0, 6.4) + knob(22, 0, 6.4);
    s += `</g>`;
    return s;
  };
})(window.PN);
// ---------- 톱니 전령 — part 2/2: composition ----------
(function (PN) {
  const B = PN.bossesB, K = B.K, H = B._her, E = B._emp, { gearPath, circ, ell, drip, pcrack, flame, exclaim, dry, rotP, f, pt } = B._;
  const { WH, HALO, MOUTH, HALO_SAWS } = H;

  B.parts.herald = function (X, o) {
    const g = X.game, ph = o.phase || 1, W = o.windup, En = o.enraged, spin = o.spin || 0;
    let back = '', fig = '', front = '';
    // ---------------- halo ring gear (behind) ----------------
    const hd = gearPath(HALO[0], HALO[1], 88, 79, 26, spin * 0.5 + 4, 67, 0.46);
    back += X.S(hd, K.ink, 2.4, `<path d="M 90,20 L 200,20 L 200,40 C 150,44 118,70 104,118 L 90,118 Z" fill="${K.ink500}"/>` + dry(X, [106, 112, 110, 76, 140, 44, 186, 34], 5, 3, K.ink300, 5));
    back += `<path d="${circ(HALO[0], HALO[1], 72)}" fill="none" stroke="${K.ink500}" stroke-width="${f(1.2 * X.li)}" stroke-dasharray="${g ? '6 6' : '3 4'}"/>`;
    const hp = (a, r) => [HALO[0] + Math.cos((a * Math.PI) / 180) * r, HALO[1] + Math.sin((a * Math.PI) / 180) * r];
    HALO_SAWS.forEach((a, i) => {
      if (ph >= 2 && i === 2) { // PHASE MARK: empty socket where the saw was torn off + paper crack along the ring
        const p = hp(a, 76);
        back += `<path d="${circ(p[0], p[1], 10)}" fill="${K.ink700}" ${X.O(1.8)}/><path d="${circ(p[0], p[1], 4.6)}" fill="${K.ink}" stroke="${K.ink300}" stroke-width="${f(1.2 * X.li)}"/>` +
          [0, 120, 240].map((b) => { const q = [p[0] + Math.cos((b * Math.PI) / 180) * 7.2, p[1] + Math.sin((b * Math.PI) / 180) * 7.2]; return `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(1.4 * X.li)}" fill="${K.ink300}"/>`; }).join('');
        back += pcrack(X, [hp(-39, 76), hp(-45, 82), hp(-51, 73), hp(-58, 81), hp(-65, 74)], [hp(-45, 82), hp(-44, 90)]);
        return;
      }
      const lift = W && i === 1 ? 26 : 0, p = hp(a, 76 + lift);
      back += H.saw(X, p[0], p[1], 19, spin + i * 11);
      if (lift) back += X.L(`M ${f(p[0] - 24)},${f(p[1] + 8)} A 26 26 0 0 1 ${f(p[0] - 10)},${f(p[1] - 20)} M ${f(p[0] + 24)},${f(p[1] + 8)} A 26 26 0 0 0 ${f(p[0] + 10)},${f(p[1] - 20)}`, 2, K.ink);
    });
    // ---------------- cape: 3 zigzag ink500 folds (lit upper-left), torn hem, no dots (flutters) ----------------
    const capeInner =
      `<path d="M 158,148 C 126,152 98,176 76,206 L 96,201 L 70,238 L 97,220 L 82,250 L 112,211 L 103,213 L 128,184 L 118,186 L 152,160 Z" fill="${K.ink500}"/>` +
      `<path d="M 152,178 L 126,214 L 137,211 L 112,250 L 126,244 L 108,282 L 138,236 L 126,240 L 148,206 L 137,208 L 162,178 Z" fill="${K.ink500}"/>` +
      `<path d="M 60,256 L 74,248 L 70,262 L 88,252 L 86,268 L 104,258 L 98,276 L 88,272 L 82,290 L 72,276 L 62,286 L 64,270 L 50,274 Z" fill="${K.ink700}"/>` +
      X.art(dry(X, [150, 166, 118, 182, 92, 214, 58, 260], 4, 3, K.ink300, 3));
    back += X.S(H.CAPE, K.ink, 2.4, capeInner);
    if (ph >= 3) back += drip(X, 60, 292, 18, 5) + drip(X, 100, 296, 22, 5.4) + drip(X, 40, 278, 14, 4.4);
    back += X.T([190, 64, 150, 34, 116, 72, 70, 62], 17, 'start', K.ink) + X.T([186, 60, 152, 38, 120, 68, 80, 62], 2.6, 'start', K.ink300);
    // ---------------- WHEEL (gear unicycle) ----------------
    const wd = gearPath(WH[0], WH[1], 70, 61, 18, spin, 47, 0.48);
    fig += X.S(wd, K.ink, 2.6, `<path d="M 110,210 L 200,210 L 200,226 C 158,228 132,254 124,296 L 110,296 Z" fill="${K.ink500}"/>` +
      dry(X, [128, 288, 130, 250, 158, 226, 194, 222], 5, 3, K.ink300, 4) + X.T([248, 318, 236, 346, 196, 358], 2.2, 'mid', K.ink500));
    for (let i = 0; i < 5; i++) {
      const a = ((spin + i * 72 + 18) * Math.PI) / 180, b = a + 0.5;
      const p0 = [WH[0] + Math.cos(a) * 14, WH[1] + Math.sin(a) * 14], p1 = [WH[0] + Math.cos(b) * 50, WH[1] + Math.sin(b) * 50], pm = [WH[0] + Math.cos(a + 0.12) * 32, WH[1] + Math.sin(a + 0.12) * 32];
      fig += X.L(`M ${pt(p0)} Q ${pt(pm)} ${pt(p1)}`, (7.4 * X.lw) / X.li, K.ink) + X.L(`M ${pt(p0)} Q ${pt(pm)} ${pt(p1)}`, 1.6, i < 2 ? K.ink500 : K.ink700);
    }
    fig += `<path d="${circ(WH[0], WH[1], 16)}" fill="${K.ink700}" ${X.O(2.2)}/><path d="${circ(WH[0], WH[1], 7)}" fill="${K.ch4.deep}" ${X.O(1.4)}/>`;
    fig += X.P('M 176,232 L 184,232 L 192,284 L 186,286 Z', K.ink, 1.8) + X.P('M 206,232 L 214,232 L 196,286 L 190,284 Z', K.ink700, 1.8);
    // ---------------- lower robe + torso + tabard ----------------
    fig += X.S(H.SKIRT, K.ink, 2.4, `<path d="M 156,198 C 146,218 136,236 124,258 L 134,256 L 146,226 L 158,222 L 166,200 Z" fill="${K.ink500}"/>` + X.T([222, 204, 232, 224, 244, 248], 1.6, 'mid', K.ink500));
    if (ph >= 3) fig += drip(X, 150, 278, 16, 4.6) + drip(X, 204, 270, 20, 5) + drip(X, 232, 266, 14, 4.4);
    fig += X.S(H.TORSO, K.ink, 2.4, `<path d="M 146,150 C 160,146 170,146 176,148 L 166,176 L 174,186 L 162,210 L 144,210 Z" fill="${K.ink500}"/>`);
    const TAB = 'M 172,150 L 218,150 L 216,250 L 206,244 L 196,258 L 186,244 L 174,250 Z';
    fig += X.S(TAB, K.ink, 2, `<path d="M 170,146 L 195,146 L 195,262 L 170,262 Z" fill="${K.ink700}"/>` + X.L('M 195,150 L 195,256', 1.4, K.ink500) +
      `<path d="${gearPath(184, 180, 9, 7, 8, 0, 3.4)}" fill="${K.ink300}" fill-rule="evenodd"/>` + `<path d="M 200,168 L 212,168 L 206,178 L 212,190 L 200,190 L 206,178 Z" fill="none" stroke="${K.ink300}" stroke-width="${f(1.8 * X.li)}" stroke-linejoin="round"/>`);
    if (ph >= 3) fig += `<path d="M 180,206 L 212,204 L 214,240 L 196,248 L 178,238 Z" fill="${K.ink}" stroke="${K.paper300}" stroke-width="${f(1.6 * X.li)}" stroke-dasharray="4 3"/><circle cx="196" cy="224" r="17" fill="${K.paper50}" opacity="0.24"/>` + H.saw(X, 196, 224, 14, spin * 2) + `<circle cx="196" cy="224" r="5" fill="${K.paper50}" stroke="${K.ink}" stroke-width="1.6"/>`;
    fig += X.P('M 156,198 C 178,206 212,206 234,198 L 234,210 C 212,218 178,218 156,210 Z', K.ink700, 1.8) + `<rect x="189" y="199" width="12" height="13" rx="2" fill="${K.ch4.deep}" ${X.O(1.4)}/>`;
    // ---------------- far arm: comes forward from under the cape, fist grips the proclamation scroll ----------------
    const fa = W ? { s: [156, 162], e: [120, 178], w: [100, 202] } : { s: [156, 162], e: [124, 186], w: [114, 214] };
    const du = [fa.w[0] - fa.e[0], fa.w[1] - fa.e[1]], dl = Math.hypot(du[0], du[1]), fist = [fa.w[0] + (du[0] / dl) * 11, fa.w[1] + (du[1] / dl) * 11];
    fig += E.sleeve(X, fa.s, fa.e, fa.w, K.ink700, true);
    fig += H.scroll(X, fist[0], fist[1] + 1, W ? 16 : -4, g);
    fig += `<path d="${ell(fist[0], fist[1], 9, 7.6)}" fill="${K.ink}" ${X.O(1.8)}/>` + X.L(`M ${f(fist[0] - 6)},${f(fist[1] - 1)} L ${f(fist[0] + 5)},${f(fist[1] - 3)} M ${f(fist[0] - 5)},${f(fist[1] + 3)} L ${f(fist[0] + 6)},${f(fist[1] + 1)}`, 1.1, K.ink500) +
      X.T([fist[0] - 7, fist[1] - 5, fist[0] - 1, fist[1] - 9, fist[0] + 6, fist[1] - 6], 1.2, 'mid', K.ink300);
    // shoulder mantle (ragged capelet) — lit wedge upper-left
    fig += X.S('M 150,160 C 150,142 170,134 194,134 C 216,134 236,142 238,160 L 228,170 L 222,160 L 212,172 L 204,162 L 194,174 L 184,162 L 174,172 L 166,160 L 158,170 Z', K.ink, 2.2, `<path d="M 148,160 C 150,140 168,134 186,134 L 176,150 L 182,154 L 164,168 Z" fill="${K.ink500}"/>`);
    // ---------------- hood: lit crescent + chaperon roll + two paper glints deep inside (it is a being, not a sack) ----------------
    fig += X.S(H.HOOD, K.ink700, 2.6, `<path d="M 170,60 C 188,70 184,118 192,156 L 166,156 L 166,60 Z" fill="${K.ink500}"/>` + dry(X, [184, 62, 176, 92, 176, 128], 3.6, 3, K.ink300, 2) +
      `<path d="M 204,74 C 226,86 234,116 222,150 L 240,150 L 240,70 Z" fill="${K.ink}"/>`);
    fig += `<path d="M 205,96 C 216,92 226,100 226,114 C 226,126 218,134 208,132 C 202,124 200,106 205,96 Z" fill="${K.ink}"/>`;
    const gr = g ? 1.35 : 1;
    fig += En ? `<circle cx="210" cy="106" r="${f(3 * gr)}" fill="${K.paper50}"/><circle cx="220" cy="107" r="${f(2.4 * gr)}" fill="${K.paper50}"/>`
      : `<path d="${ell(209.5, 106, 2.6 * gr, 1.7 * gr)}" fill="${K.paper50}" transform="rotate(-14 209.5 106)"/><path d="${ell(219.5, 107.5, 2.1 * gr, 1.4 * gr)}" fill="${K.paper50}" transform="rotate(-14 219.5 107.5)"/>`;
    fig += `<path d="M 204,90 C 222,84 236,100 234,118 C 232,134 220,142 206,138 C 196,128 194,102 204,90 Z" fill="none" stroke="${K.ink}" stroke-width="${f(10 * X.lw)}" stroke-linejoin="round"/>` +
      `<path d="M 204,90 C 222,84 236,100 234,118 C 232,134 220,142 206,138 C 196,128 194,102 204,90 Z" fill="none" stroke="${K.ink700}" stroke-width="${f(6 * X.li)}"/>` +
      X.T([200, 104, 204, 90, 220, 88], 2.2, 'mid', K.ink300) + X.art(X.L('M 214,88 l 3,6 M 226,96 l -2,6 M 232,110 l -5,2 M 230,126 l -5,-2', 1, K.ink500));
    // ---------------- trumpet + banner + near arm ----------------
    const ang = W ? -38 : 26, tr = H.trumpet(X, ang, En, ph);
    const grip = rotP([MOUTH[0] + 58, MOUTH[1] + 4], MOUTH, ang), grip2 = rotP([MOUTH[0] + 22, MOUTH[1] + 4], MOUTH, ang);
    const b0 = rotP([MOUTH[0] + 34, MOUTH[1] + 4], MOUTH, ang), b1 = rotP([MOUTH[0] + 74, MOUTH[1] + 4], MOUTH, ang);
    const bl = W ? 44 : 50, sway = W ? -8 : 6;
    const bannerD = `M ${pt(b0)} L ${pt(b1)} L ${f(b1[0] + sway)},${f(b1[1] + bl)} L ${f((b0[0] + b1[0]) / 2 + sway)},${f((b0[1] + b1[1]) / 2 + bl * 0.72)} L ${f(b0[0] + sway)},${f(b0[1] + bl)} Z`;
    fig += X.S(bannerD, K.ink700, 2, `<path d="M ${pt(b0)} L ${f(b0[0] + 16)},${f(b0[1])} L ${f(b0[0] + sway + 10)},${f(b0[1] + bl)} L ${f(b0[0] + sway)},${f(b0[1] + bl)} Z" fill="${K.ink500}"/>` +
      `<circle cx="${f((b0[0] + b1[0]) / 2 + sway * 0.5)}" cy="${f((b0[1] + b1[1]) / 2 + bl * 0.36)}" r="9.5" fill="none" stroke="${K.ink300}" stroke-width="${f(1.6 * X.li)}" stroke-dasharray="${g ? '4 3' : '2.6 1.8'}"/>`);
    fig += tr.s;
    const sh = [232, 160], el = W ? [262, 140] : [248, 194];
    const n1 = (a, b2) => { const dx = b2[0] - a[0], dy = b2[1] - a[1], L = Math.hypot(dx, dy); return [-dy / L, dx / L]; };
    const u1 = n1(sh, el), u2 = n1(el, grip), A = (p, u, k) => pt([p[0] + u[0] * k, p[1] + u[1] * k]);
    fig += X.SS(`M ${A(sh, u1, 14)} C ${A(el, u1, 13)} ${A(el, u2, 12)} ${A(grip, u2, 10)} L ${A(grip, u2, -10)} C ${A(el, u2, -8)} ${A(el, u1, -8)} ${A(sh, u1, -12)} Z`, K.ink, 2.4,
      dry(X, [sh[0] + u1[0] * 10, sh[1] + u1[1] * 10, el[0] + u1[0] * 9, el[1] + u1[1] * 9, grip[0] + u2[0] * 7, grip[1] + u2[1] * 7], 2.4, 2, K.ink500, 4));
    fig += X.P(`M ${A(grip, u2, 13)} L ${A(grip, u2, -13)} L ${pt([grip[0] - u2[1] * -8 - u2[0] * 12, grip[1] + u2[0] * -8 - u2[1] * 12])} Z`, K.ink700, 1.8);
    fig += `<path d="${ell(grip[0], grip[1], 9, 7.5)}" fill="${K.ink}" ${X.O(1.8)}/><path d="${ell(grip2[0], grip2[1], 5.5, 5)}" fill="${K.ink}" ${X.O(1.4)}/>`;
    fig += X.art(X.T([grip[0] - 7, grip[1] - 4, grip[0] - 2, grip[1] - 8, grip[0] + 5, grip[1] - 6], 1.2, 'mid', K.ink300));
    // ---------------- enrage + windup ----------------
    if (En) {
      let fl = '';
      for (let i = 0; i < 7; i++) { const a = -165 + i * 25, ca = Math.cos((a * Math.PI) / 180), sa = Math.sin((a * Math.PI) / 180); fl += flame(X, HALO[0] + ca * 86, HALO[1] + sa * 86 + 8, 30, 15, ca * 0.5, 20 + i); }
      back = fl + back;
      front += flame(X, tr.eye[0] + 8, tr.eye[1] - 34, 26, 12, 0.3, 40);
    }
    if (W) {
      const e = tr.eye;
      front += X.L(`M ${f(e[0] + 30)},${f(e[1] - 22)} A 36 36 0 0 1 ${f(e[0] + 34)},${f(e[1] + 22)} M ${f(e[0] + 40)},${f(e[1] - 34)} A 50 50 0 0 1 ${f(e[0] + 46)},${f(e[1] + 32)}`, 3, K.ink) + exclaim(X, 132, 22, 1.05);
    }
    const solid = circ(WH[0], WH[1], 64) + ' ' + circ(HALO[0], HALO[1], 82);
    return { back, fig, front, solid };
  };
  B.anchorsOf.herald = (o) => { const ang = o.windup ? -38 : 26; return { face: rotP([MOUTH[0] + H.BELL + 2, MOUTH[1]], MOUTH, ang), muzzle: HALO.slice(), halo: { c: HALO.slice(), r: 76, saws: HALO_SAWS.slice() }, wheel: { c: WH.slice(), r: 70 }, scroll: o.windup ? [88, 244] : [108, 258], hoodEyes: [214, 106] }; };
})(window.PN);
// ---------- 공백 천칭 (balance · Ch5 St10 · null · FINAL) — part 1/2: geometry + helpers ----------
// 머리 자리 = 오려진 공백: the scissor cut runs UP THROUGH the hood crown, so the silhouette itself is bitten open (투명, 굵은 먹테).
// The beam floats above the gap (PIV y=40) so nothing re-closes the void. 몸 곳곳 지워짐 (P1: 5 holes, P3: +2).
(function (PN) {
  const B = PN.bossesB, K = B.K, { ell, f, pt } = B._;
  const Q = (B._bal = {});
  Q.PIV = [240, 40]; Q.HALF = 108; Q.DROP = 116;
  Q.ROBE = 'M 136,206 L 252,206 C 256,228 258,246 262,262 C 276,300 294,328 302,346 C 266,366 118,366 84,346 C 96,326 112,298 124,262 C 128,246 132,228 136,206 Z';
  Q.HOOD = 'M 152,168 C 144,144 146,116 158,98 C 168,84 184,75 200,72 C 214,77 230,88 238,103 C 248,123 246,145 238,168 Z';
  Q.MANTLE = 'M 94,192 C 106,166 142,148 194,142 C 246,148 282,164 294,188 L 278,194 L 272,210 L 258,200 L 246,220 L 232,206 L 218,224 L 200,208 L 184,224 L 170,206 L 156,220 L 144,202 L 130,212 L 118,198 Z';
  // scissor-cut polygon: jittered midpoints between key points
  Q.jag = function (pts, amp, seed) {
    const r = PN.rng(seed), out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      out.push(a);
      const n = Math.max(1, Math.round(L / 9));
      for (let k = 1; k <= n; k++) { const t = k / (n + 1), j = (r() - 0.5) * 2 * amp; out.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j]); }
    }
    return 'M ' + out.map(pt).join(' L ') + ' Z';
  };
  // head void: top at y≈61 is ABOVE the hood crown (72) → the outline is severed, not enclosed
  Q.HEAD = [[174, 140], [168, 131], [158, 125], [146, 120], [132, 108], [136, 74], [168, 56], [200, 54], [222, 59], [229, 76], [231, 98], [229, 120], [221, 145], [214, 159], [206, 167], [188, 167], [181, 157], [177, 148]];
  // P1 erased bands: (a) torn strip crossing the robe's LEFT contour, (b) band through the near bell sleeve (crosses its right contour), (c) low swipe
  Q.STRIP = [[78, 322], [100, 317], [124, 320], [148, 317], [168, 322], [175, 329], [164, 335], [138, 337], [114, 334], [90, 337], [76, 331]];
  Q.SLEEVE = [[246, 274], [264, 265], [286, 259], [306, 255], [308, 265], [290, 271], [268, 279], [250, 285]];
  Q.SWIPE = [[166, 294], [184, 284], [206, 281], [226, 286], [228, 295], [208, 301], [186, 305], [168, 304]];
  // P3 additions: erased chest (core floats inside) + far-sleeve bite
  Q.CHEST = [[186, 204], [206, 198], [222, 208], [224, 230], [212, 246], [192, 244], [182, 228]];
  Q.FARBITE = [[100, 238], [118, 228], [134, 236], [130, 252], [112, 256]];
  Q.panPts = function (cx, cy, rx = 36, ry = 12, depth = 16) {
    const P = [];
    for (let a = 180; a <= 360; a += 22.5) P.push([cx + rx * Math.cos((a * Math.PI) / 180), cy + ry * Math.sin((a * Math.PI) / 180)]);
    for (let t = 0.15; t < 1; t += 0.2) { const x = cx + rx - 2 * rx * t, y = cy + Math.sin(t * Math.PI) * (ry + depth) * 0.95 + 1; P.push([x, y]); }
    return P;
  };
  Q.bowlD = (cx, cy, rx = 36, ry = 12, depth = 16) => `M ${f(cx - rx)},${f(cy)} C ${f(cx - rx * 0.8)},${f(cy + (ry + depth) * 1.3)} ${f(cx + rx * 0.8)},${f(cy + (ry + depth) * 1.3)} ${f(cx + rx)},${f(cy)}`;
  // thick ink rim on a torn edge (masked to the body by the composer); paper cut-line dropped → 1u ink300 inside, art only
  Q.rim = function (X, d, w) {
    const c = X.clip(d);
    return X.art(`<g clip-path="url(#${c})"><path d="${d}" fill="none" stroke="${K.ink300}" stroke-width="${f(w * X.lw + 2)}" stroke-linejoin="round"/></g>`) +
      `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="${f(w * X.lw)}" stroke-linejoin="round"/>`;
  };
  // floating blindfold end: FLAT paper300 (no halftone on fluttering cloth, §5-4) + ink taper rim + one ink500 fold
  Q.ribbon = function (X, P, w0, w1, waves, amp, seed) {
    const T = [], Bt = [], N = 18;
    for (let i = 0; i <= N; i++) {
      const t = i / N, u = 1 - t;
      const x = u * u * u * P[0] + 3 * u * u * t * P[2] + 3 * u * t * t * P[4] + t * t * t * P[6], y = u * u * u * P[1] + 3 * u * u * t * P[3] + 3 * u * t * t * P[5] + t * t * t * P[7];
      const dx = 3 * u * u * (P[2] - P[0]) + 6 * u * t * (P[4] - P[2]) + 3 * t * t * (P[6] - P[4]), dy = 3 * u * u * (P[3] - P[1]) + 6 * u * t * (P[5] - P[3]) + 3 * t * t * (P[7] - P[5]);
      const L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, fl = Math.sin(t * waves * Math.PI + seed) * amp * t, hw = ((w0 + (w1 - w0) * t) * (0.85 + 0.25 * Math.cos(t * waves * Math.PI + seed))) / 2;
      T.push([x + nx * (fl + hw), y + ny * (fl + hw)]); Bt.push([x + nx * (fl - hw), y + ny * (fl - hw)]);
    }
    const e = T.length - 1, notch = [(T[e][0] + Bt[e][0]) / 2 - (T[e][0] - T[e - 2][0]) * 0.9, (T[e][1] + Bt[e][1]) / 2 - (T[e][1] - T[e - 2][1]) * 0.9];
    const d = 'M ' + T.map(pt).join(' L ') + ' L ' + pt(notch) + ' L ' + Bt.slice().reverse().map(pt).join(' L ') + ' Z';
    return X.S(d, K.paper300, 1.6, X.T([Bt[3][0], Bt[3][1], Bt[9][0], Bt[9][1], Bt[16][0], Bt[16][1]], X.game ? 3.4 : 2.6, 'mid', K.ink500));
  };
  // open hand: palm + 4 tapered fingers fanning around dir (deg)
  Q.palm = function (X, x, y, dir, spread, len, w = 4.2) {
    // long judge's hand: tapered palm (wrist→knuckles along dir) + 4 round-capped fingers + thumb — reads as a HAND at 156px
    const a0 = (dir * Math.PI) / 180, u = [Math.cos(a0), Math.sin(a0)], n = [-u[1], u[0]], wk = X.game ? 1.3 : 1;
    const P = (t, k) => [x + u[0] * t + n[0] * k, y + u[1] * t + n[1] * k];
    const palm = `M ${pt(P(-9, -5.5))} L ${pt(P(7, -7.5))} C ${pt(P(11, -7.5))} ${pt(P(11, 7.5))} ${pt(P(7, 7.5))} L ${pt(P(-9, 5.5))} Z`;
    let s = '', fin = '';
    [-1.5, -0.5, 0.5, 1.5].forEach((k, i) => {
      const a = ((dir + k * spread) * Math.PI) / 180, L = len * [0.8, 1, 0.94, 0.72][i], b = P(8, k * 5.4);
      const m = [b[0] + Math.cos(a) * L * 0.55 + n[0] * 1.2, b[1] + Math.sin(a) * L * 0.55 + n[1] * 1.2], e = [b[0] + Math.cos(a) * L, b[1] + Math.sin(a) * L];
      fin += `M ${pt(b)} Q ${pt(m)} ${pt(e)} `;
    });
    const t0 = P(-2, -6), ta = a0 - 0.95, t1 = [t0[0] + Math.cos(ta) * 13, t0[1] + Math.sin(ta) * 13];
    fin += `M ${pt(t0)} Q ${pt([t0[0] + Math.cos(ta) * 8 + u[0] * 2, t0[1] + Math.sin(ta) * 8 + u[1] * 2])} ${pt(t1)}`;
    s += `<path d="${fin}" fill="none" stroke="${K.ink}" stroke-width="${f((w + 1.6) * wk)}" stroke-linecap="round"/>`; // outline pass
    s += `<path d="${palm}" fill="${K.ink}" ${X.O(1.6)}/>`;
    s += `<path d="${fin}" fill="none" stroke="${K.ink}" stroke-width="${f(w * wk)}" stroke-linecap="round"/>`;
    return s + X.art(`<path d="M ${pt(P(-8, -4.4))} L ${pt(P(7, -6.4))}" stroke="${K.ink300}" stroke-width="1.1" stroke-linecap="round"/>`);
  };
})(window.PN);
// ---------- 공백 천칭 — part 2/2: composition ----------
(function (PN) {
  const B = PN.bossesB, K = B.K, Q = B._bal, { circ, ell, drip, pcrack, flame, exclaim, chain, eyeEclipse, dry, rotP, f, pt } = B._;
  const { PIV, HALF, DROP } = Q;

  B.parts.balance = function (X, o) {
    const g = X.game, ph = o.phase || 1, W = o.windup, En = o.enraged;
    const tilt = W ? 13 : 0;
    const endL = rotP([PIV[0] - HALF, PIV[1]], PIV, tilt), endR = rotP([PIV[0] + HALF, PIV[1]], PIV, tilt);
    const panL = [endL[0], endL[1] + DROP], panR = [endR[0], endR[1] + DROP];
    let back = '', fig = '', front = '', rims = '', over = '';
    // ---------------- holes (true transparency) ----------------
    const headD = Q.jag(Q.HEAD, 2.2, 5), panD = Q.jag(Q.panPts(panL[0], panL[1]), 1.4, 9);
    const stripD = Q.jag(Q.STRIP, 1.8, 13), sleeveD = Q.jag(Q.SLEEVE, 1.6, 17), swipeD = Q.jag(Q.SWIPE, 1.6, 19);
    let holes = [headD, panD, stripD, sleeveD, swipeD].join(' ');
    let chestD = '', biteD = '';
    if (ph >= 3) { chestD = Q.jag(Q.CHEST, 2, 21); biteD = Q.jag(Q.FARBITE, 1.4, 23); holes += ' ' + chestD + ' ' + biteD; }
    // ---------------- robe: 2 big swooping fold wedges lit from upper-left, lower-right pure ink900 ----------------
    back += X.S(Q.ROBE, K.ink, 2.6,
      `<path d="M 136,206 C 128,240 118,280 100,316 C 96,326 90,336 84,346 L 118,354 C 116,318 124,282 138,252 C 148,232 156,218 166,206 Z" fill="${K.ink500}"/>` +
      `<path d="M 166,206 C 156,218 148,232 138,252 L 151,249 C 158,234 166,222 177,212 Z" fill="${K.ink700}"/>` +
      `<path d="M 178,258 C 170,292 176,326 198,362 L 218,364 C 196,330 192,296 202,258 Z" fill="${K.ink500}"/>` +
      dry(X, [142, 214, 128, 250, 116, 290, 100, 336], 5, 3, K.ink300, 3) + X.T([254, 214, 264, 270, 284, 334], 2, 'mid', K.ink700));
    back += drip(X, 128, 352, 10, 4.4) + drip(X, 246, 356, 11, 4.4);
    if (ph >= 3) back += drip(X, 100, 344, 14, 5) + drip(X, 152, 357, 18, 5.4) + drip(X, 266, 352, 16, 5);
    back += X.S('M 128,238 C 160,248 228,248 262,238 L 264,254 C 228,264 160,264 126,254 Z', K.ink700, 2, X.T([132, 242, 160, 250, 196, 250], 1.4, 'mid', K.ink300)) + X.P('M 214,252 L 228,252 L 234,296 L 224,290 L 218,300 Z', K.ink700, 1.8) +
      `<path d="${circ(196, 250, 7)}" fill="${K.ink}" stroke="${K.ink300}" stroke-width="${f(1.4 * X.li)}"/>`;
    // far arm (viewer-left): idle = open palm pressing DOWN (판결); windup = palm raised toward the player
    const farS = W ? 'M 132,196 C 116,208 100,220 84,228 L 100,254 C 114,244 132,232 150,214 Z' : 'M 132,196 C 114,220 96,242 78,262 L 106,284 C 116,258 132,234 150,212 Z';
    const farLit = W ? 'M 132,196 C 116,208 100,220 84,228 L 89,237 C 104,228 120,216 138,204 Z' : 'M 132,196 C 114,220 96,242 78,262 L 86,270 C 104,248 122,226 140,204 Z';
    back += X.SS(farS, K.ink, 2.4, `<path d="${farLit}" fill="${K.ink500}"/>`);
    back += W ? Q.palm(X, 82, 226, -116, 8, 22, 4) : Q.palm(X, 92, 286, 106, 9, 25, 3.8);
    // ---------------- hood (crown severed by the void) + mantle ----------------
    fig += X.SS(Q.HOOD, K.ink, 2.6, `<path d="M 144,112 C 160,114 164,136 170,170 L 144,170 Z" fill="${K.ink500}"/>` + dry(X, [156, 126, 152, 138, 152, 156], 3, 3, K.ink300, 2) + X.T([236, 102, 246, 124, 238, 162], 2, 'mid', K.ink500));
    fig += X.SS(Q.MANTLE, K.ink700, 2.4, `<path d="M 100,200 C 104,168 140,150 180,146 C 150,160 132,180 126,212 Z" fill="${K.ink500}"/>` +
      dry(X, [110, 190, 126, 162, 160, 148, 196, 144], 4, 4, K.ink300, 7) + X.T([236, 150, 270, 164, 282, 192], 2, 'mid', K.ink500));
    fig += `<path d="${circ(200, 186, 11)}" fill="${K.ink}" ${X.O(1.8)}/><path d="${circ(200, 186, 7.6)}" fill="none" stroke="${K.ink300}" stroke-width="${f(1.6 * X.li)}"/><path d="${circ(202.4, 186, 6.2)}" fill="${K.ink}"/>`;
    if (ph >= 3) fig += drip(X, 150, 216, 18, 4.6) + drip(X, 248, 216, 22, 5) + drip(X, 196, 208, 14, 4);
    // ---------------- near arm (viewer-right): bell sleeve + forearm rising to grip the post ----------------
    fig += X.SS('M 252,206 C 266,200 282,208 286,222 C 292,248 296,274 300,300 L 282,306 L 274,294 L 264,304 C 262,278 260,250 254,232 Z', K.ink, 2.4,
      `<path d="M 252,206 C 262,202 272,204 278,210 L 266,222 L 272,236 L 262,250 L 258,232 Z" fill="${K.ink500}"/>` + X.T([270, 214, 284, 240, 292, 290], 2.2, 'mid', K.ink700));
    fig += X.SS('M 254,226 C 248,210 242,198 236,186 L 258,176 C 264,190 272,204 278,220 Z', K.ink, 2.2, dry(X, [240, 186, 246, 200, 254, 222], 2.6, 2, K.ink300, 14));
    // ---------------- the BALANCE ----------------
    fig += X.S('M 236,24 L 244,24 L 246,254 L 234,254 Z', K.ink, 2, `<path d="M 234,22 L 238,22 L 237,256 L 234,256 Z" fill="${K.ink300}"/>`);
    [[240, 100], [240, 150], [240, 248]].forEach(([x, y]) => { fig += `<path d="${ell(x, y, 8, 4.5)}" fill="${K.ink700}" ${X.O(1.6)}/>`; });
    fig += X.P('M 230,168 C 234,160 252,160 256,168 L 256,184 C 250,190 236,190 230,184 Z', K.ink, 1.8) + X.art(X.T([232, 170, 242, 164, 254, 168], 1.2, 'mid', K.ink300)) + X.L('M 234,176 L 252,176 M 234,182 L 252,182', 1, K.ink500);
    const bd = `M ${-HALF},-3 C ${-HALF * 0.5},-5 -14,-8 0,-9 C 14,-8 ${HALF * 0.5},-5 ${HALF},-3 L ${HALF},3 C ${HALF * 0.5},4 14,6 0,7 C -14,6 ${-HALF * 0.5},4 ${-HALF},3 Z`;
    fig += `<g transform="translate(${PIV[0]},${PIV[1]}) rotate(${tilt})">` + X.S(bd, K.ink, 2.4, `<path d="M ${-HALF},-9 L ${HALF},-9 L ${HALF},-3 L ${-HALF},-3.6 Z" fill="${K.ink500}"/>`) +
      `<path d="M ${-HALF - 4},0 a 5,5 0 1 1 0,0.1 Z M ${HALF + 4},0 a 5,5 0 1 1 0,0.1 Z" fill="none" stroke="${K.ink}" stroke-width="${f(3.6 * X.li)}"/>` +
      X.P('M -3,-8 L 0,-30 L 3,-8 Z', K.ink300, 1.6) + (ph >= 2 ? pcrack(X, [[-98, -1], [-86, 3], [-74, -3], [-60, 2.5], [-46, -2]]) : '') + `</g>`;
    fig += `<path d="${circ(PIV[0], PIV[1], 9)}" fill="${K.ink}" ${X.O(1.8)}/><path d="${circ(PIV[0], PIV[1], 5.4)}" fill="none" stroke="${K.ink300}" stroke-width="${f(1.8 * X.li)}"/>`;
    // ink-full pan (focus exception: eclipse eye floating on the ink)
    const R = panR;
    fig += [[-34, -1], [34, -1], [4, -9]].map(([dx, dy], i) => chain(X, endR[0], endR[1] + 5, R[0] + dx, R[1] + dy, g ? 6 : 12, 0, g ? 0.8 : 0.55, i === 2 ? K.ink500 : K.ink300)).join('');
    const bowl = `M ${f(R[0] - 37)},${f(R[1])} C ${f(R[0] - 30)},${f(R[1] + 26)} ${f(R[0] + 30)},${f(R[1] + 26)} ${f(R[0] + 37)},${f(R[1])} Z`;
    fig += X.S(bowl, K.ink, 2.4, `<path d="M ${f(R[0] - 40)},${f(R[1])} L ${f(R[0] - 10)},${f(R[1])} C ${f(R[0] - 14)},${f(R[1] + 12)} ${f(R[0] - 18)},${f(R[1] + 20)} ${f(R[0] - 26)},${f(R[1] + 24)} Z" fill="${K.ink500}"/>`);
    fig += `<path d="${ell(R[0], R[1], 37, 12)}" fill="${K.ink}" ${X.O(2.2)}/><path d="${ell(R[0] - 1, R[1] + 0.5, 30, 8.4)}" fill="none" stroke="${K.ink500}" stroke-width="${f(1.2 * X.li)}"/>` + X.art(`<path d="${ell(R[0] - 3, R[1] + 1, 20, 4.4)}" fill="none" stroke="${K.ink500}" stroke-width="0.9"/>`);
    fig += drip(X, R[0] - 30, R[1] + 8, 18, 4.6) + drip(X, R[0] + 6, R[1] + 22, 26, 5) + drip(X, R[0] + 28, R[1] + 12, 14, 4);
    if (ph >= 2) fig += pcrack(X, [[R[0] + 34, R[1] - 2], [R[0] + 24, R[1] + 6], [R[0] + 29, R[1] + 12], [R[0] + 14, R[1] + 17], [R[0] + 18, R[1] + 22], [R[0] - 2, R[1] + 21]]);
    const eye = [R[0] - 6, R[1] - 1];
    fig += `<g transform="translate(${f(eye[0])},${f(eye[1])}) scale(1,0.8)">${eyeEclipse(X, 0, 0, En ? 12 : g ? 11.5 : 10.5, En)}</g>`;
    // ---------------- torn-edge rims (masked to the body by the composer) ----------------
    rims += Q.rim(X, headD, 5.6) + Q.rim(X, panD, 4) + Q.rim(X, stripD, 4.2) + Q.rim(X, sleeveD, 4.2) + Q.rim(X, swipeD, 4) + (ph >= 3 ? Q.rim(X, chestD, 4.4) + Q.rim(X, biteD, 4) : '');
    if (ph >= 3) rims += `<circle cx="203" cy="224" r="13" fill="${K.ink}" stroke="${K.ink300}" stroke-width="${f(1.4 * X.li)}"/><circle cx="199" cy="220" r="3.4" fill="${K.paper50}"/>` + X.L('M 188,224 A 15 15 0 0 0 218,224', 1.4, K.ink300);
    // ---------------- OVER (not erased): void-pan chains + rim + bowl outline, floating blindfold ends ----------------
    over += Q.ribbon(X, [156, 124, 140, 114, 124, 126, 106, 118], 8, 7, 2, 3.4, 0.6) + Q.ribbon(X, [156, 131, 142, 139, 128, 136, 112, 142], 8, 6.6, 1.8, 3.4, 2.4);
    over += `<path d="${ell(157, 128, 6.6, 8)}" fill="${K.paper300}" ${X.O(1.8)}/>` + X.T([153, 122, 157, 120, 161, 123], 1.4, 'mid', K.ink500);
    over += [[-34, -1], [34, -1], [4, -9]].map(([dx, dy], i) => chain(X, endL[0], endL[1] + 5, panL[0] + dx, panL[1] + dy, g ? 6 : 12, 0, g ? 0.8 : 0.55, i === 2 ? K.ink500 : K.ink300)).join('');
    // game: fixed rim widths so the void pan's interior stays OPEN at 156px (it must not read as a solid black pan)
    const rw = g ? 7.4 : 5.2, bw2 = g ? 6.4 : 4.4;
    over += `<path d="${Q.bowlD(panL[0], panL[1])}" fill="none" stroke="${K.ink}" stroke-width="${f(bw2)}" stroke-linecap="round"/>` +
      `<path d="${ell(panL[0], panL[1], 36, 12)}" fill="none" stroke="${K.ink}" stroke-width="${f(rw)}"/><path d="${ell(panL[0], panL[1], 36, 12)}" fill="none" stroke="${K.ink500}" stroke-width="${f(1.4 * X.li)}" stroke-dasharray="${g ? '10 4' : '14 3 4 3'}"/>` +
      [[4, -9], [-34, -1], [34, -1]].map(([dx, dy]) => `<circle cx="${f(panL[0] + dx)}" cy="${f(panL[1] + dy)}" r="3" fill="${K.ink}"/>`).join('');
    if (En) [[148, 116, -0.4], [166, 128, -0.25], [230, 96, 0.25], [230, 120, 0.4], [96, 226, -0.3], [372, R[1] - 8, 0.3]].forEach(([x, y, l], i) => { over += flame(X, x, y + 6, i < 4 ? 36 : 24, i < 4 ? 15 : 12, l, 30 + i); });
    if (W) front += exclaim(X, 201, 114, 1.2); // the '!' floats IN the head void
    // enrage fill-silhouette: chain fans (the coral pulse rims the pans + beam, never every chain link)
    const fanTri = (e, p) => `M ${pt([e[0], e[1] + 4])} L ${pt([p[0] - 38, p[1] + 2])} L ${pt([p[0] + 38, p[1] + 2])} Z`;
    const solid = fanTri(endL, panL) + ' ' + fanTri(endR, panR);
    return { back, fig, holes, rims, over, front, solid };
  };
  B.anchorsOf.balance = (o) => {
    const tilt = o.windup ? 13 : 0, eL = rotP([PIV[0] - HALF, PIV[1]], PIV, tilt), eR = rotP([PIV[0] + HALF, PIV[1]], PIV, tilt);
    return { face: [eR[0] - 6, eR[1] + DROP - 1], muzzle: [[eL[0], eL[1] + DROP], [eR[0], eR[1] + DROP]], pans: { void: [eL[0], eL[1] + DROP], ink: [eR[0], eR[1] + DROP] }, beamPivot: PIV.slice(), beamEnds: [eL, eR], voidHead: [201, 116], head: [201, 112] };
  };
})(window.PN);
// ---------- signature-attack FX (bible §12.2 텔레그래프 3단계 · §12.4 적 탄) ----------
// All fx.* functions draw in the CALLER's space at 1x screen px (line widths per bible §4). Unique ids per call.
(function (PN) {
  const B = PN.bossesB, K = B.K, { gearPath, circ, latch, f, pt } = B._;
  let FX = 0;
  const pid = () => 'kb2fx' + (FX++) + '_';
  function hatchDefs(p) {
    return `<pattern id="${p}h10" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="10" height="2" fill="${K.warn}"/></pattern>` +
      `<pattern id="${p}h5" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="5" height="2" fill="${K.warn}"/></pattern>` +
      `<pattern id="${p}ad" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2" cy="2" r="1.1" fill="${K.ink}"/></pattern>`;
  }
  // brush head (teardrop) at point p moving along angle a — "붓이 그려 나가는 예고"
  function brushHead(x, y, a, s = 1) {
    const r = (a * 180) / Math.PI;
    return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(r)}) scale(${s})"><path d="M 7,0 C 3,-5 -6,-5 -10,0 C -6,5 3,5 7,0 Z" fill="${K.ink}"/><path d="M 4,-1 C 1,-2.6 -3,-2.4 -5,-1" fill="none" stroke="${K.paper50}" stroke-width="1" opacity="0.8"/></g>`;
  }

  // enemy saw-gear projectile: ink gear core + coral tooth edge + ink 1px outline + paper glint + speed tail
  function saw(x, y, r = 15, o = {}) {
    const rot = o.rot || 0, tail = o.tail; // tail: [dx,dy] direction of travel (unit-ish) → streaks behind
    let s = '';
    if (tail) {
      const L = Math.hypot(tail[0], tail[1]) || 1, ux = tail[0] / L, uy = tail[1] / L, nx = -uy, ny = ux;
      [[-0.55, 1.5], [0, 2.2], [0.55, 1.4]].forEach(([k, w], i) => { s += PN.taper([x - ux * r * 0.8 + nx * r * k, y - uy * r * 0.8 + ny * r * k, x - ux * r * 2 + nx * r * k * 1.1, y - uy * r * 2 + ny * r * k * 1.1, x - ux * r * (3.2 - i * 0.3) + nx * r * k * 1.2, y - uy * r * (3.2 - i * 0.3) + ny * r * k * 1.2], w * 2, 'start', K.ink); });
      s += `<path d="M ${f(x - ux * r * 1.1 + nx * r * 1.1)},${f(y - uy * r * 1.1 + ny * r * 1.1)} A ${r * 1.15} ${r * 1.15} 0 0 0 ${f(x - ux * r * 1.1 - nx * r * 1.1)},${f(y - uy * r * 1.1 - ny * r * 1.1)}" fill="none" stroke="${K.ink}" stroke-width="1.6" stroke-dasharray="3 3"/>`;
    }
    if (!o.noGlow) s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 1.25)}" fill="${K.hostile}" opacity="0.3"/>`;
    s += `<path d="${gearPath(x, y, r, r * 0.74, 9, rot, 0, 0.5)}" fill="${K.hostile}" stroke="${K.ink}" stroke-width="${f(Math.max(1.2, r * 0.07))}" stroke-linejoin="round"/>`;
    s += `<path d="${gearPath(x, y, r * 0.8, r * 0.64, 9, rot, 0, 0.5)}" fill="${K.ink}"/>`;
    s += `<path d="${circ(x, y, r * 0.34)}" fill="none" stroke="${K.ink500}" stroke-width="${f(r * 0.08)}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.12)}" fill="${K.ink500}"/>`;
    s += `<circle cx="${f(x - r * 0.36)}" cy="${f(y - r * 0.4)}" r="${f(Math.max(1.3, r * 0.1))}" fill="${K.paper50}"/>`;
    return `<g>${s}</g>`;
  }

  // grid trap (걸쇠 여제): bars = 쇠창살 edges; state per cell 'preview' | 'imminent' | 'active' | null. latch glyph inside.
  function gridTrap(x, y, cell, cols, rows, o = {}) {
    const p = pid(), st = o.state || (() => 'preview'), prog = o.progress == null ? 1 : o.progress;
    let defs = hatchDefs(p), s = '';
    const X = { li: 1, lw: 1, game: true };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const state = typeof st === 'function' ? st(c, r) : st;
      if (!state) continue;
      const cx = x + c * cell, cy = y + r * cell, m = 3;
      if (state === 'active') {
        s += `<rect x="${cx + m}" y="${cy + m}" width="${cell - 2 * m}" height="${cell - 2 * m}" fill="${K.hostile}" opacity="0.55"/><rect x="${cx + m}" y="${cy + m}" width="${cell - 2 * m}" height="${cell - 2 * m}" fill="none" stroke="url(#${p}ad)" stroke-width="5"/>`;
        s += `<rect x="${cx + m}" y="${cy + m}" width="${cell - 2 * m}" height="${cell - 2 * m}" fill="none" stroke="${K.ink}" stroke-width="3"/>`;
      } else {
        const dense = state === 'imminent';
        s += `<rect x="${cx + m}" y="${cy + m}" width="${cell - 2 * m}" height="${cell - 2 * m}" fill="url(#${p}${dense ? 'h5' : 'h10'})" opacity="${dense ? 0.75 : 0.55}"/>`;
        s += `<rect x="${cx + m}" y="${cy + m}" width="${cell - 2 * m}" height="${cell - 2 * m}" fill="none" stroke="${K.ink}" stroke-width="${dense ? 5 : 2}" stroke-opacity="${dense ? 1 : 0.7}" stroke-dasharray="${dense ? 'none' : '7 4'}" stroke-linejoin="round"/>`;
        if (dense) { [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]].forEach(([u, v]) => { const tx = cx + u * cell, ty = cy + v * cell; s += `<circle cx="${tx}" cy="${ty}" r="3" fill="${K.warn}" stroke="${K.ink}" stroke-width="1.5"/>`; }); }
      }
      // latch glyph (걸쇠) — marks this as the empress's trap (vs architect's circles)
      s += `<g opacity="${state === 'preview' ? 0.85 : 1}">${latch(X, cx + cell / 2, cy + cell / 2 - 3, cell / 58, state === 'active', 0, state === 'active' ? K.ink500 : K.ink700)}</g>`;
    }
    // iron bars over the grid (drawn by the brush → progress)
    const tot = cols + rows + 2;
    let k = 0;
    for (let c = 0; c <= cols; c++, k++) { const t = Math.min(1, Math.max(0, prog * tot - k)); if (t > 0) s += `<path d="M ${x + c * cell},${y} L ${x + c * cell},${y + rows * cell * t}" stroke="${K.ink}" stroke-width="3.2" stroke-linecap="round"/>`; }
    for (let r = 0; r <= rows; r++, k++) { const t = Math.min(1, Math.max(0, prog * tot - k)); if (t > 0) s += `<path d="M ${x},${y + r * cell} L ${x + cols * cell * t},${y + r * cell}" stroke="${K.ink}" stroke-width="3.2" stroke-linecap="round"/>`; }
    if (prog < 1) { const kk = Math.floor(prog * tot), t = prog * tot - kk; if (kk <= cols) s += brushHead(x + kk * cell, y + rows * cell * t, Math.PI / 2); else { const r = kk - cols - 1; s += brushHead(x + cols * cell * t, y + r * cell, 0); } }
    return `<g><defs>${defs}</defs>${s}</g>`;
  }

  // null zone (공백 천칭): erased flat void.paper + amber dotted rim (ink under-stroke) + ⊘ symbol; active adds fine coral ring
  function nullZone(x, y, r, o = {}) {
    const state = o.state || 'preview', prog = o.progress == null ? 1 : o.progress, p = pid();
    let s = `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * (o.squash || 1))}" fill="${K.voidPaper}"/>`;
    const ry = r * (o.squash || 1);
    // rim = solid ink 5.4 underlay + AMBER DOTTED 3px (§12.2 '호박 점선 테') — ALWAYS dotted, every state.
    // progress (brush drawing the rim) is revealed by a mask holding a solid arc of length L.
    const C = 2 * Math.PI * Math.sqrt((r * r + ry * ry) / 2), L = C * prog;
    let defs = '', mk = '';
    if (prog < 1) {
      defs = `<defs><mask id="${p}pm" maskUnits="userSpaceOnUse" x="${f(x - r - 12)}" y="${f(y - ry - 12)}" width="${f(2 * r + 24)}" height="${f(2 * ry + 24)}"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(ry)}" fill="none" stroke="#fff" stroke-width="12" stroke-dasharray="${f(L)} ${f(C)}" transform="rotate(-90 ${x} ${y})"/></mask></defs>`;
      mk = `mask="url(#${p}pm)"`;
    }
    s += `${defs}<g ${mk}><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(ry)}" fill="none" stroke="${K.ink}" stroke-width="5.4"/>` +
      `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(ry)}" fill="none" stroke="${K.warn}" stroke-width="3" stroke-dasharray="3 6" stroke-linecap="round"/></g>`;
    if (prog < 1) { const a = -Math.PI / 2 + prog * 2 * Math.PI; s += brushHead(x + Math.cos(a) * r, y + Math.sin(a) * ry, a + Math.PI / 2); }
    if (state === 'active') s += `<ellipse cx="${x}" cy="${y}" rx="${f(r - 7)}" ry="${f(ry - 7 * (o.squash || 1))}" fill="none" stroke="${K.ink}" stroke-width="3"/><ellipse cx="${x}" cy="${y}" rx="${f(r - 7)}" ry="${f(ry - 7 * (o.squash || 1))}" fill="none" stroke="${K.hostile}" stroke-width="1.5"/>`;
    const q = Math.min(r, ry) * 0.34;
    s += `<g opacity="0.8"><circle cx="${x}" cy="${y}" r="${f(q)}" fill="none" stroke="${K.ink300}" stroke-width="2.2"/><path d="M ${f(x - q * 0.7)},${f(y + q * 0.7)} L ${f(x + q * 0.7)},${f(y - q * 0.7)}" stroke="${K.ink300}" stroke-width="2.2"/></g>`;
    return `<g>${s}</g>`;
  }

  // hostile hatched lane (preview/imminent) from p0 to p1, width w
  function lane(x0, y0, x1, y1, w, o = {}) {
    const p = pid(), dense = o.state === 'imminent', prog = o.progress == null ? 1 : o.progress;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), a = (Math.atan2(dy, dx) * 180) / Math.PI;
    let s = `<defs>${hatchDefs(p)}</defs><g transform="translate(${f(x0)},${f(y0)}) rotate(${f(a)})">`;
    s += `<rect x="0" y="${-w / 2}" width="${f(L)}" height="${w}" fill="url(#${p}${dense ? 'h5' : 'h10'})" opacity="${dense ? 0.75 : 0.55}"/>`;
    s += `<path d="M 0,${-w / 2} L ${f(L * prog)},${-w / 2} M 0,${w / 2} L ${f(L * prog)},${w / 2}" stroke="${K.ink}" stroke-width="${dense ? 4 : 2}" stroke-opacity="${dense ? 1 : 0.7}" stroke-dasharray="${dense ? 'none' : '7 4'}"/>`;
    if (prog < 1) s += brushHead(L * prog, w / 2, 0) + brushHead(L * prog, -w / 2, 0);
    return s + `</g>`;
  }

  B.fx = { saw, gridTrap, nullZone, lane, brushHead, hatchDefs, exclaim: (x, y, s = 1) => B._.exclaim({ game: false, li: 1, lw: 1 }, x, y, s) };
})(window.PN);
// ---------- composer: PN.bossesB.draw(id, opts) ----------
// Layer model returned by B.parts[id](X, o):
//   under  : ground-plane FX drawn below the shadow (not masked)
//   back, fig : the body (unmasked source = "raw")
//   holes  : path(s) punched out of the body with a <mask> → TRUE transparency (ground shows through)
//   rims   : ink rims of the torn edges; masked to the raw body alpha so a cut that crosses the outer contour
//            never draws an ink line over open ground (the void bites OUT of the silhouette)
//   over   : props drawn on top of the cut body, unmasked (balance: void-pan ring, chains, enrage flames)
//   solid  : extra filled path(s) added ONLY to the enrage "fill" silhouette (wheel spokes, halo ring, fan gaps)
//   front  : windup '!' / sound arcs (not part of the silhouette)
(function (PN) {
  const B = PN.bossesB, K = B.K, BOX = B.BOX, { ctx, f } = B._;
  const CH = { empress: 'ch3', herald: 'ch4', balance: 'ch5' };
  const BIG = 'x="-80" y="-80" width="544" height="544"';

  function filters(X, o, ground) {
    const id = X.id, big = `filterUnits="userSpaceOnUse" ${BIG}`;
    const d = [];
    const sil = (name, col) => `<filter id="${id}${name}" ${big}><feFlood flood-color="${col}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
    d.push(sil('ink', K.ink), sil('white', '#fff'), sil('black', '#000'));
    if (!X.game) d.push(`<filter id="${id}rough" ${big}><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${7 + (X.id.length % 5)}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter>`);
    if (o.halo !== false) {
      const r = X.game ? 3.2 : 2.2;
      d.push(`<filter id="${id}halo" ${big}><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="a"/><feFlood flood-color="${ground}"/><feComposite in2="a" operator="in" result="h"/><feMerge><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    }
    if (o.enraged) {
      // ring only (coral 2px@1x inside an ink ring); the body itself is drawn on top, the fill-silhouette mask removes interior holes
      const r1 = X.game ? 4.2 : 3.2, r2 = r1 + (X.game ? 2.4 : 1.8);
      d.push(`<filter id="${id}pulse" ${big}><feMorphology in="SourceAlpha" operator="dilate" radius="${r2}" result="o"/><feMorphology in="SourceAlpha" operator="dilate" radius="${r1}" result="i"/>` +
        `<feFlood flood-color="${K.ink}"/><feComposite in2="o" operator="in" result="ko"/><feFlood flood-color="${K.hostile}"/><feComposite in2="i" operator="in" result="ci"/>` +
        `<feMerge><feMergeNode in="ko"/><feMergeNode in="ci"/></feMerge></filter>`);
    }
    if (o.mono) d.push(sil('mono', o.monoColor || K.ink));
    return d.join('');
  }

  function draw(id, opts = {}) {
    const o = Object.assign({ phase: 1, windup: false, enraged: false, detail: 'art', halo: undefined, mono: false, spin: 0, shadow: true, hitbox: false }, opts);
    const part = B.parts[id];
    if (!part) return `<g><!-- PN.bossesB: unknown id ${id} --></g>`;
    const X = ctx(o);
    const ground = typeof o.halo === 'string' ? o.halo : K[CH[id]].base;
    const R = part(X, o);
    X.defs.push(filters(X, o, ground));
    const rawId = X.uid('raw');
    X.defs.push(`<g id="${rawId}">${(R.back || '') + (R.fig || '')}</g>`);
    let body = `<use href="#${rawId}"/>`;
    if (R.holes) {
      const m = X.uid('m');
      X.defs.push(`<mask id="${m}" maskUnits="userSpaceOnUse" ${BIG}><rect ${BIG} fill="#fff"/><path d="${R.holes}" fill="#000"/></mask>`);
      body = `<g mask="url(#${m})">${body}</g>`;
    }
    if (R.rims) {
      const bm = X.uid('bm');
      X.defs.push(`<mask id="${bm}" maskUnits="userSpaceOnUse" ${BIG}><use href="#${rawId}" filter="url(#${X.id}white)"/></mask>`);
      body += `<g mask="url(#${bm})">${R.rims}</g>`;
    }
    body += R.over || '';
    const figId = X.uid('fig');
    X.defs.push(`<g id="${figId}">${body}</g>`);
    // shadow-side weight: whole silhouette duplicated in ink, nudged down-right (bible §4: 그림자 쪽 +40%)
    const dx = f(1.6 * X.lw), dy = f(2.0 * X.lw);
    let fig = `<use href="#${figId}" transform="translate(${dx},${dy})" filter="url(#${X.id}ink)"/><use href="#${figId}"/>`;
    if (!X.game && !o.mono) fig = `<g filter="url(#${X.id}rough)">${fig}</g>`;
    if (o.enraged && !o.mono) {
      // §10.1-4 outer 2px coral pulse: dilate the cut figure, then hide everything inside the HOLE-FILLED silhouette
      const fr = X.uid('fr'), nf = X.uid('nf');
      X.defs.push(`<g id="${fr}">${fig}</g>`);
      X.defs.push(`<mask id="${nf}" maskUnits="userSpaceOnUse" ${BIG}><rect ${BIG} fill="#fff"/><g filter="url(#${X.id}black)"><use href="#${rawId}"/>${R.solid ? `<path d="${R.solid}" fill="#000"/>` : ''}</g></mask>`);
      fig = `<g mask="url(#${nf})"><use href="#${fr}" filter="url(#${X.id}pulse)"/></g><use href="#${fr}"/>`;
    }
    if (o.halo !== false && !o.mono) fig = `<g filter="url(#${X.id}halo)">${fig}</g>`;
    const S = BOX.shadow;
    const shadow = o.shadow && !o.mono ? `<ellipse cx="${S.cx}" cy="${S.cy + 4}" rx="${S.rx + 14}" ry="${S.ry + 6}" fill="${K.ink}" opacity="0.16"/><ellipse cx="${S.cx}" cy="${S.cy}" rx="${S.rx}" ry="${S.ry}" fill="${K.ink}" opacity="0.26"/>` : '';
    const hb = o.hitbox ? `<g fill="none" stroke="${K.ink}" stroke-width="${X.game ? 3 : 2}" stroke-dasharray="${X.game ? '8 6' : '6 5'}"><circle cx="${BOX.pivot[0]}" cy="${BOX.pivot[1]}" r="${BOX.r}"/></g>` +
      `<g stroke="${K.ink}" stroke-width="${X.game ? 3 : 2}"><path d="M ${BOX.pivot[0] - 10},${BOX.pivot[1]} h 20 M ${BOX.pivot[0]},${BOX.pivot[1] - 10} v 20"/></g><circle cx="${BOX.feet[0]}" cy="${BOX.feet[1]}" r="${X.game ? 5 : 3.5}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="2"/>` : '';
    let inner = `${o.mono ? '' : (R.under || '')}${shadow}${fig}${o.mono ? '' : (R.front || '')}${hb}`;
    if (o.mono) inner = `<g filter="url(#${X.id}mono)">${fig}</g>`;
    return `<g class="kb2 kb2-${id}"><defs>${X.defs.join('')}</defs>${inner}</g>`;
  }

  // anchors in LOCAL BOX units (see API-bosses2.md)
  function anchors(id, opts = {}) {
    const o = Object.assign({ phase: 1, windup: false }, opts);
    const base = { pivot: BOX.pivot.slice(), feet: BOX.feet.slice(), r: BOX.r, shadow: Object.assign({}, BOX.shadow), head: [192, 18] };
    const A = (B.anchorsOf[id] || (() => ({})))(o);
    return Object.assign(base, A);
  }
  B.CH = CH;
  B.draw = draw;
  B.anchors = anchors;
  B.ids = ['empress', 'herald', 'balance'];
})(window.PN);
