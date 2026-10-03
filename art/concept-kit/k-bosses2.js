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
  // glow (rev 3 K3-1f, default true = the old output): false leaves the hot halo to the caller, so a pair of eyes can
  // share ONE halo instead of two overlapping discs that brighten into a lens (empress, R5).
  function eyeBubble(X, x, y, r, hot = false, glow = true) {
    return `${hot && glow ? `<circle cx="${x}" cy="${y}" r="${f(r * 2.1)}" fill="${K.paper50}" opacity="0.35"/>` : ''}<circle cx="${x}" cy="${y}" r="${f(r)}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="${f(1.6 * X.li)}"/>` +
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
  // core = the ink core's +x offset as a share of r (default 0.1 = the old drawing, paper arc included). rev 3 (K3 F-B3):
  // the balance passes 0.22 so the paper crescent reads as an eclipse looking at the player; a moved core drops the paper
  // arc, which would otherwise fall off the core onto the paper and vanish.
  function eyeEclipse(X, x, y, r, hot = false, core = 0.1) {
    return `${hot ? `<circle cx="${x}" cy="${y}" r="${f(r * 2)}" fill="${K.paper50}" opacity="0.38"/>` : ''}<circle cx="${x}" cy="${y}" r="${f(r)}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="${f(1.8 * X.li)}"/>` +
      `<circle cx="${f(x + r * core)}" cy="${f(y + r * 0.05)}" r="${f(r * 0.66)}" fill="${hot ? K.paper50 : K.ink}"/>` +
      (hot || core !== 0.1 ? '' : `<path d="M ${f(x - r * 0.25)},${f(y - r * 0.5)} A ${f(r * 0.66)} ${f(r * 0.66)} 0 0 0 ${f(x - r * 0.5)},${f(y + r * 0.2)}" fill="none" stroke="${K.paper50}" stroke-width="${f(r * 0.1)}" opacity="0.9"/>`);
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
// ---------- K3-2 pose kit (rev 3, add-only): pose normalisation, transform ops, death vocabulary ----------
// New B._ keys only; the existing helpers above keep their signatures and default outputs.
(function (PN) {
  const B = PN.bossesB, K = B.K, { smooth, ell, dry, f, pt } = B._;
  // pose 'idle' | 'attack' | 'death' (anything else = 'idle'). death starts from the P3 damage and drops windup/enraged
  // (no coral, no amber); attack drops windup. frame = death 0..3 (truncated, clamped). Shared by draw() and anchors().
  B._.norm = function (o) {
    o.pose = o.pose === 'attack' || o.pose === 'death' ? o.pose : 'idle';
    if (o.pose === 'death') { o.frame = Math.max(0, Math.min(3, Math.trunc(Number(o.frame) || 0))); o.phase = 3; o.windup = false; o.enraged = false; }
    else if (o.pose === 'attack') o.windup = false;
    return o;
  };
  // one list of transform ops gives the SVG transform string and the point mapper, so anchors follow the drawing.
  // ops (first = outermost, as in transform=""): ['translate',x,y] ['rotate',deg,cx,cy] ['scale',sx,sy]
  B._.tfs = (ops) => ops.map(([k, ...a]) => k === 'rotate' ? `rotate(${a.map(f).join(' ')})` : `${k}(${a.map(f).join(',')})`).join(' ');
  const mat = (ops) => {
    const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
    let M = [1, 0, 0, 1, 0, 0];
    ops.forEach(([k, ...a]) => {
      let n = [1, 0, 0, 1, 0, 0];
      if (k === 'translate') n = [1, 0, 0, 1, a[0], a[1] || 0];
      else if (k === 'scale') n = [a[0], 0, 0, a[1] === undefined ? a[0] : a[1], 0, 0];
      else if (k === 'rotate') { const r = (a[0] * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r), cx = a[1] || 0, cy = a[2] || 0; n = [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy]; }
      M = mul(M, n);
    });
    return M;
  };
  B._.xf = (ops) => { const M = mat(ops); return (p) => [f(M[0] * p[0] + M[2] * p[1] + M[4]), f(M[1] * p[0] + M[3] * p[1] + M[5])]; };
  // inverse of the linear part: a ✕ drawn inside a lying (rotated + squashed) relic group with this local matrix comes out
  // upright and square on screen, like the enemy death decal
  B._.inv = (ops) => { const [a, b, c, d] = mat(ops), k = a * d - b * c; return [d / k, -b / k, -c / k, a / k].map((v) => Math.round(v * 1000) / 1000); };
  // paper ✕ with an ink rim (enemy decal ✕✕ grammar). Arm (centre → tip) game 7 / art 5 (≥ 6 / ≥ 4); paper stroke game
  // 3.8 / art 2.4; ink rim beyond it game 4.4 / art 3 in total (≥ 3.6 / ≥ 2). paper.50 spelled lower-case: the only
  // paper.50 that survives the death-frame dim in draw(). k scales the whole mark (empress: 0.86, two eyes 16 apart).
  B._.xMark = function (X, x, y, m, k = 1) {
    const s = (X.game ? 7 : 5) * k, w = (X.game ? 3.8 : 2.4) * k, rim = (X.game ? 4.4 : 3) * k;
    const d = `M ${f(x - s)},${f(y - s)} L ${f(x + s)},${f(y + s)} M ${f(x + s)},${f(y - s)} L ${f(x - s)},${f(y + s)}`;
    const g = `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="${f(w + rim)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${K.paper50.toLowerCase()}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
    return m ? `<g transform="translate(${f(x)},${f(y)}) matrix(${m.join(',')},0,0) translate(${f(-x)},${f(-y)})">${g}</g>` : g;
  };
  // f3 wet ink puddle (bossesC grammar): ink.700 surface + ink rim, darker inner pool, art ink.300 dry-brush on the rim
  B._.puddle = function (X, cx, cy, rx, ry, seed = 1) {
    const r = PN.rng(seed * 53 + 11), P = [];
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2, k = 1 + (r() - 0.5) * 0.1 + (i % 6 === 2 ? 0.07 : 0); P.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    const d = smooth(P, true);
    const inner = `<path d="${ell(cx - rx * 0.12, cy - ry * 0.18, rx * 0.72, ry * 0.5)}" fill="${K.ink}" opacity="0.55"/>` +
      X.art(dry(X, [cx - rx * 0.8, cy - ry * 0.55, cx - rx * 0.3, cy - ry * 0.95, cx + rx * 0.3, cy - ry * 0.9], 4, 3, K.ink300, seed + 3) +
        dry(X, [cx + rx * 0.45, cy + ry * 0.55, cx + rx * 0.7, cy + ry * 0.35, cx + rx * 0.86, cy + ry * 0.05], 3, 3, K.ink300, seed + 5));
    return { d, s: X.S(d, K.ink700, 2.4, inner) };
  };
  // f2 melting mound: ink body through the top-contour points (left → right, ends on the ground line g), one ink.500 lit
  // plane on the upper left, an ink.300 dry rim along the top-left contour, ink drips running down its face
  B._.mound = function (X, top, g, drips = []) {
    const P = [[top[0][0], g], ...top, [top[top.length - 1][0], g]];
    const d = smooth(P, false) + ' Z';
    const L = top.slice(0, Math.max(2, Math.ceil(top.length / 2)));
    const lit = smooth([[L[0][0] + 8, g - 6], ...L.map(([x, y]) => [x + 10, y + 12]), [L[L.length - 1][0] + 14, L[L.length - 1][1] + 26], [L[0][0] + 26, g - 10]], true);
    const inner = `<path d="${lit}" fill="${K.ink500}"/>` + X.T(L.slice(0, 3).flatMap(([x, y]) => [x + 3, y + 3]), 2.4, 'mid', K.ink300);
    return { d, s: X.S(d, K.ink, 2.6, inner) + drips.map(([x, y, l, w]) => B._.drip(X, x, y, l, w)).join('') };
  };
  // torn manuscript scrap (paper.300 + ink rim), death f2, art only
  B._.scrap = function (X, x, y, s, rot, seed) {
    if (X.game) return '';
    const r = PN.rng(seed * 17 + 3), P = [];
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, k = 0.6 + r() * 0.5; P.push([x + Math.cos(a) * s * k, y + Math.sin(a) * s * k * 0.7]); }
    return `<g transform="rotate(${rot} ${f(x)} ${f(y)})"><path d="M ${P.map(pt).join(' L ')} Z" fill="${K.paper300}" stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"/>${X.T([x - s * 0.4, y - s * 0.1, x, y - s * 0.16, x + s * 0.35, y - s * 0.08], 1.2, 'mid', K.ink300)}</g>`;
  };
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
  // K3-2: sep (optional, default off = the old drawing) lays an ink.500 separation edge under the hook, so a black hand
  // over the black veil still reads (the module's X.SS rule for overlapping blacks)
  E.hook = function (X, x0, y0, x1, y1, curl, w = 5.6, sep = false) {
    const ux = x1 - x0, uy = y1 - y0, k = X.game ? 1.2 : 1;
    const p = [x0, y0, x0 + ux * 0.6, y0 + uy * 0.6, x0 + ux * 1.08 + curl[0] * 0.5, y0 + uy * 1.08 + curl[1] * 0.5, x0 + ux * 0.9 + curl[0], y0 + uy * 0.9 + curl[1]];
    return (sep ? X.T(p, w * k + 2.4, 'start', K.ink500) : '') + X.T(p, w * k, 'start', K.ink) + X.art(X.T([x0 + 0.8, y0 - 0.8, x0 + ux * 0.5 + 0.8, y0 + uy * 0.5 - 0.8, x0 + ux * 0.92, y0 + uy * 0.92 - 0.6], 1.1, 'mid', K.ink300));
  };
  // hook hand: ink palm + 4 J-hooks fanning around dir (deg); lens = per-finger length factors; sep: see E.hook (hooks
  // only: an edge round the palm would make a ring round a dark disc, the fake-eye figure)
  E.hand = function (X, x, y, dir, spread, len, curlSign = 1, lens = [0.78, 1, 1, 0.78], wk = 1, sep = false) {
    let o = `<path d="${ell(x, y, 9 * wk, 7.5 * wk)}" fill="${K.ink}" ${X.O(1.8)}/>`;
    for (let i = 0; i < 4; i++) {
      const a = ((dir + (i - 1.5) * spread) * Math.PI) / 180, L = len * lens[i];
      const x0 = x + Math.cos(a) * 6, y0 = y + Math.sin(a) * 6, x1 = x + Math.cos(a) * L, y1 = y + Math.sin(a) * L;
      const c = 9 * Math.min(1, lens[i] + 0.1), cx = Math.cos(a + (curlSign * Math.PI) / 2) * c, cy = Math.sin(a + (curlSign * Math.PI) / 2) * c;
      o += E.hook(X, x0, y0, x1, y1, [cx, cy], (i === 3 ? 4.8 : 5.8) * wk, sep);
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
  // K3-2 face function (brief §1.10-2): state 'open' (idle · windup · attack) | 'out' (death f0–f2: the paper rings go
  // ink.300 and a paper crack runs across the glass, between the eyes) | 'dead' (f3 relic: each eye = paper ✕, drawn
  // upright through m = B._.inv(relic ops)). Every pose calls this one head; poses only move / rotate it.
  function head(X, ph, En, state = 'open', m) {
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
    // shadow wedge on the glass: a flat paper.300 plane in both LODs (20% dots printed as a dotted "mouth" in game and at
    // story-panel scale; rev 3 game, K3-1f R6 art)
    s += `<path d="${face}" fill="${En ? K.ink700 : K.paper}"/><g clip-path="url(#${fc})">${En ? '' : `<path d="M 213,84 C 207,104 200,116 178,126 L 214,130 Z" fill="${K.paper300}"/>`}</g>`;
    // rev 3 (K3 F-B1, user decision Q4 corrected): two EQUAL eyes on one level across the face glass (a size or height
    // difference would read as a second viewpoint). Each eye = ink ellipse + paper.50 ring (×0.6, dropped 0.08ry, clipped to
    // the eye) under an ink upper lid whose lower edge is a straight line through cy − 0.15ry, 0.35ry lower on the nose side
    // and 0.35ry higher outside: a stern, half-closed eye. The ink inside the ring is the pupil — no white dots.
    // Enraged: eyeBubble(hot) on the same two centres, both the same size, under ONE shared halo (K3-1f R5: the two
    // r×2.1 halos used to overlap into a bright lens that read as goggles). Ch3 bubbles: art only, ≥ 4 from the eyes.
    const erx = g ? 6.0 : 5.8, ery = g ? 4.6 : 4.4;
    if (En) s += `<g opacity="0.35"><circle cx="185" cy="99" r="${f(erx * 2.1)}" fill="${K.paper50}"/><circle cx="201" cy="99" r="${f(erx * 2.1)}" fill="${K.paper50}"/></g>`;
    const ring = state === 'open' ? K.paper50 : K.ink300;
    const eye = (x, y, nose) => {
      if (En) return eyeBubble(X, x, y, erx, true, false);
      // the two ✕ sit 1.5 outward of the eye centres at ×0.86 (game arm 6.0, art 4.3) so their paper strokes stay ≥ 3.5
      // apart: two touching ✕ read as the letters "XX"
      if (state === 'dead') return `<path d="${ell(x, y, erx, ery)}" fill="${K.ink}"/>` + B._.xMark(X, x - nose * 1.5, y, m, 0.86);
      const d = ell(x, y, erx, ery), c = X.clip(d), mm = y - 0.15 * ery, k = 0.35 * ery * nose / erx, ly = (dx) => f(mm + k * dx);
      return `<path d="${d}" fill="${K.ink}"/><g clip-path="url(#${c})"><path d="${ell(x, f(y + 0.08 * ery), f(erx * 0.6), f(ery * 0.6))}" fill="none" stroke="${ring}" stroke-width="${g ? 2 : 1.4}"/>` +
        `<path d="M ${f(x - erx - 1)},${ly(-erx - 1)} L ${f(x + erx + 1)},${ly(erx + 1)} L ${f(x + erx + 1)},${f(y - ery - 1)} L ${f(x - erx - 1)},${f(y - ery - 1)} Z" fill="${K.ink}"/></g>`;
    };
    s += eye(185, 99, 1) + eye(201, 99, -1);
    // death f0–f2: a paper crack across the glass from the upper right, between the eyes, to the lower left (same clip)
    if (state === 'out') s += `<g clip-path="url(#${fc})">${pcrack(X, [[214, 78], [205, 88], [198, 92], [193, 102], [186, 108], [180, 120], [172, 126]], [[186, 108], [176, 106]])}</g>`;
    if (!En) {
      s += X.art([[181, 83, 2.4], [185, 76, 1.6], [203.5, 88, 1.9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${K.ink}" stroke-width="1.2"/>`).join(''));
      // one ink tear running DOWN from the left eye's outer-lower corner, clear of the face midline (x 193)
      s += PN.taper([180.5, 104, 179.9, 108.5, 180.4, 112.5], g ? 2.4 : 2, 'end', K.ink) + `<circle cx="180.4" cy="113.8" r="${g ? 2 : 1.6}" fill="${K.ink}"/>`;
    }
    // open lid = faded portrait, knocked DOWN (ink500 + 60% dots, no paper) so the face wins the eye
    const portrait = X.art(`<g transform="translate(232 100) scale(0.6) translate(-235 -101)"><path d="M 238,80 C 231,80 228,86 229,92 L 226,96 L 229,98 C 228,102 231,104 233,104 L 231,110 C 226,112 224,118 224,126 L 246,126 C 246,118 243,112 239,110 C 243,106 244,100 243,95 C 245,90 245,82 238,80 Z" fill="${K.ink}" stroke="${K.ink300}" stroke-width="1.2"/></g>`);
    s += `<g transform="rotate(-10 233 98)">` + X.S(ell(233, 98, 12.5, 31), K.ink, 2.8, `<path d="${ell(232, 98, 8.6, 25)}" fill="${K.ink500}"/><path d="${ell(232, 98, 8.6, 25)}" fill="${X.pat('d60')}"/>` + portrait) +
      (ph >= 2 && state !== 'dead' ? pcrack(X, [[229, 69], [236, 83], [228.5, 96], [237, 111], [231, 128]], [[236, 83], [241.5, 89]]) : '') + `</g>`;   // the f3 relic drops the lid's paper crack: its ✕✕ stay the only bright marks
    s += `<path d="M 215,86 L 221,86 M 215,114 L 221,114" stroke="${K.ink}" stroke-width="${f(5.4 * X.li)}" stroke-linecap="round"/><path d="M 215,86 L 221,86 M 215,114 L 221,114" stroke="${K.ink300}" stroke-width="${f(1.6 * X.li)}" stroke-linecap="round"/>`;
    return s;
  }

  // ---- cage skirt: ONE big lit crescent (upper-left ink500) + 6 bars + 3 hoops; lower-right stays pure ink900 ----
  // K3-2: P = { sag, dead } (optional; omitted = the old drawing). sag = latch-chain sag (13; attack pulls them taut to 4).
  // dead = death path: the P3 lock heart loses its paper.50 glow disc and its keyhole goes ink.300 (review 2 §5-3).
  function skirt(X, ph, W, P = {}) {
    const g = X.game;
    let c = `<path d="M 178,196 C 160,226 120,256 100,288 C 90,304 78,318 78,330 L 100,341 C 104,327 112,315 124,307 L 117,295 C 130,281 142,273 154,269 L 147,255 C 158,243 170,235 182,229 L 177,216 L 190,204 Z" fill="${K.ink500}"/>`;
    c += `<path d="M 184,262 L 200,246 L 194,286 L 206,318 L 190,342 L 178,300 Z" fill="${K.ink700}"/>`;
    c += E.crane(X, 234, 297, g ? 1.34 : 1.28) + E.crane(X, 280, 332, g ? 1.0 : 0.95) + E.crane(X, 164, 284, g ? 1.1 : 1.04, true);
    if (ph >= 3) c += (P.dead ? '' : `<circle cx="200" cy="272" r="20" fill="${K.paper50}" opacity="0.2"/>`) + `<path d="M 200,258 C 184,244 170,262 184,278 L 200,294 L 216,278 C 230,262 216,244 200,258 Z" fill="${K.ink500}" ${X.O(1.8)}/>` +
      `<path d="M 200,264 a 4.4,4.4 0 1 1 -0.1,0 Z M 197.6,268 L 195.6,281 L 204.4,281 L 202.4,268 Z" fill="${P.dead ? K.ink300 : K.paper50}" stroke="${K.ink}" stroke-width="1.4"/>`;
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
    const sag = P.sag === undefined ? 13 : P.sag;
    for (let i = 0; i < 2; i++) { const p0 = E.ringPt(2, L2[i]), p1 = E.ringPt(2, L2[i + 1]); c += chain(X, p0[0] + 5, p0[1] + 8, p1[0] - 5, p1[1] + 8, g ? 5 : 8, sag, g ? 1.15 : 0.95, i ? K.ink500 : K.ink300); }
    L2.forEach((th) => { const p = E.ringPt(2, th); c += latch(X, p[0], p[1] - 2, g ? 1.5 : 1.35, W, th * 0.18, K.ch3.deep); });
    [-42, 42].forEach((th) => { const p = E.ringPt(1, th); c += latch(X, p[0], p[1] - 1, g ? 1.25 : 1.05, W, th * 0.2, K.ch3.deep); });
    [-42, 14, 70].forEach((th) => { const p = E.ringPt(3, th); c += latch(X, p[0], p[1] - 3, g ? 1.25 : 1.1, W, th * 0.12, K.ch3.deep); });
    c += dry(X, [170, 204, 130, 246, 88, 318], 5, 3, K.ink300, 4);
    return X.S(E.SKIRT, K.ink, 2.6, c);
  }

  // ---- K3-2 rig (drawing and anchors share it; ops first = outermost) ----
  // attack (brief §3.4): the key is driven forward into the lock (horizontal, toward the player, bit standing up), the head
  // bows 14° toward it, the far hook-hand clutches the ground, the cage tightens (hoops ×0.94 about x 196) and its latch
  // chains pull taut (sag 13 → 4); every latch snaps shut.
  // death: f0 = the idle pose hit (eyes out, glass cracked, latches burst open, the key slips out of the pinch); f1 the cage
  // crumples (squash 0.62 about the hem), the bodice sinks 70 into it, the head topples −20° onto the left shoulder and the
  // fan collar tilts with it; f2 a heap of bent bars and chain with the locket head on top, lid hanging; f3 puddle + relic.
  E.RIG = {
    atk: { head: 14, na: { s: [224, 164], e: [262, 176], w: [300, 170] }, fa: { s: [160, 170], e: [118, 238], w: [84, 300] }, tight: [['translate', 196, 0], ['scale', 0.94, 1], ['translate', -196, 0]], sag: 4 },
    d0: { key: [308, 168, -38] },
    d1: { sq: [['translate', 196, 360], ['scale', 1.08, 0.62], ['translate', -196, -360]], dn: [['translate', 0, 70]], head: [['translate', -10, 84], ['rotate', -20, 190, 132]], fan: [['translate', -6, 74], ['rotate', -14, 188, 148]] },
    d2: { head: [['translate', 14, 162], ['rotate', 60, 192, 100]] },
    d3: { relic: [['translate', 200, 334], ['rotate', -6], ['scale', 1, 0.4], ['translate', -192, -100]] }
  };
  E.FACE_T = [193, 101]; E.RIM_T = [198, 67]; E.EYES_T = [193, 99]; E.CROWN_T = [193, 26];   // head-template points
  E.palms = (na, fa) => {
    const nd = [na.w[0] - na.e[0], na.w[1] - na.e[1]], nl = Math.hypot(nd[0], nd[1]), palm = [na.w[0] + (nd[0] / nl) * 14, na.w[1] + (nd[1] / nl) * 14];
    const fd = [fa.w[0] - fa.e[0], fa.w[1] - fa.e[1]], fl = Math.hypot(fd[0], fd[1]), fpalm = [fa.w[0] + (fd[0] / fl) * 14, fa.w[1] + (fd[1] / fl) * 14];
    return { palm, fpalm, pin: [palm[0] + 8, palm[1] - 14] };
  };
  // ink ✦ (4 tapered points, ink.300 edge so it reads on the ink skirt; no paper core), span 2r ≤ 12
  const spark = (X, x, y, r) => { const q = r * 0.2; return `<path d="M ${f(x)},${f(y - r)} Q ${f(x + q)},${f(y - q)} ${f(x + r)},${f(y)} Q ${f(x + q)},${f(y + q)} ${f(x)},${f(y + r)} Q ${f(x - q)},${f(y + q)} ${f(x - r)},${f(y)} Q ${f(x - q)},${f(y - q)} ${f(x)},${f(y - r)} Z" fill="${K.ink}" stroke="${K.ink300}" stroke-width="${f(1.1 * X.li)}" stroke-linejoin="round"/>`; };

  B.parts.empress = function (X, o) {
    if (o.pose === 'death' && o.frame > 0) return E.death(X, o);
    const g = X.game, ph = o.phase || 1, W = o.windup, En = o.enraged;
    const at = o.pose === 'attack', d0 = o.pose === 'death', A = E.RIG.atk;   // d0: death f0 = the idle pose, hit
    let back = '', fig = '', front = '', under = '';
    back += X.S(E.VEIL, K.ink, 2.4, `<path d="M 162,150 C 128,162 104,200 92,240 C 84,266 72,290 58,312 L 78,306 C 94,262 110,214 146,178 Z" fill="${K.ink500}"/>` + X.art(dry(X, [150, 176, 128, 220, 116, 276, 104, 344], 3, 3, K.ink700, 9)));
    back += fan(X, ph);
    // far arm (viewer-left): hook hand points DOWN at the ground where the grid springs
    const fa = at ? A.fa : W ? { s: [162, 166], e: [124, 196], w: [80, 200] } : { s: [160, 170], e: [128, 222], w: [88, 246] };
    const fd = [(fa.w[0] - fa.e[0]), (fa.w[1] - fa.e[1])], fl = Math.hypot(fd[0], fd[1]), fu = [fd[0] / fl, fd[1] / fl], fpalm = [fa.w[0] + fu[0] * 14, fa.w[1] + fu[1] * 14];
    const fdir = (Math.atan2(fu[1], fu[0]) * 180) / Math.PI;
    back += E.sleeve(X, fa.s, fa.e, fa.w, K.ink700, true);
    // attack: the hook-hand turns down (≈100°) and closes (spread 8, short hooks) on the ground at y 345–355
    back += at ? E.hand(X, fpalm[0], fpalm[1], 100, 8, 38, 1, [0.6, 0.75, 0.75, 0.6], 1.25, true)
      : W ? E.hand(X, fpalm[0], fpalm[1], fdir + 10, 26, 46, 1, [0.9, 1.05, 1, 0.85], 1.25) : E.hand(X, fpalm[0], fpalm[1], fdir - 34, 16, 44, 1, [0.62, 1.28, 0.84, 0.62], 1.25);
    if (!W && !at) { const da = ((fdir - 34) * Math.PI) / 180; back += drip(X, fpalm[0] + Math.cos(da) * 58, fpalm[1] + Math.sin(da) * 58 + 2, 9, 4); }
    // cage skirt + hem drips (attack: the whole cage tightened about x 196; death f0: latches burst open, the lock heart dims)
    if (at) fig += `<g transform="${B._.tfs(A.tight)}">${skirt(X, ph, false, { sag: A.sag })}${drip(X, 126, 352, 12, 5) + drip(X, 214, 357, 10, 4.4) + drip(X, 278, 346, 14, 5)}</g>`;
    else {
      fig += d0 ? skirt(X, ph, true, { dead: true }) : skirt(X, ph, W);
      fig += drip(X, 126, 352, 12, 5) + drip(X, 214, 357, 10, 4.4) + drip(X, 278, 346, 14, 5);
    }
    if (ph >= 3) fig += drip(X, 162, 356, 18, 5.4) + drip(X, 248, 353, 20, 5);
    // corset bodice leaning left: ONE lit wedge upper-left, the rest ink900
    fig += X.S(E.BODICE, K.ink, 2.4, `<path d="M 158,156 C 168,150 176,149 184,149 L 178,170 L 187,184 L 176,204 L 184,214 L 168,214 C 162,194 158,176 158,156 Z" fill="${K.ink500}"/>` +
      chain(X, 196, 162, 200, 220, 6, 0, 0.8, K.ink500) + X.T([218, 160, 220, 182, 212, 206], 1.4, 'mid', K.ink500));
    fig += X.S('M 146,170 C 142,152 160,144 174,154 C 176,166 168,176 156,178 Z', K.ink700, 2.2, `<path d="M 140,168 C 140,150 156,144 168,148 L 156,164 Z" fill="${K.ink500}"/>`);
    // near arm (viewer-right): raised, pinching the master latch-key toward the viewer
    const na = at ? A.na : W ? { s: [224, 162], e: [254, 132], w: [268, 88] } : { s: [224, 164], e: [264, 194], w: [284, 146] };
    const nd = [(na.w[0] - na.e[0]), (na.w[1] - na.e[1])], nl = Math.hypot(nd[0], nd[1]), palm = [na.w[0] + (nd[0] / nl) * 14, na.w[1] + (nd[1] / nl) * 14];
    const pin = [palm[0] + 8, palm[1] - 14];
    fig += E.sleeve(X, na.s, na.e, na.w, K.ink, false);
    // attack: the key straight out of the pinch, horizontal (tip x ≈ 393), bit up; death f0: it slips out, turning as it falls
    if (at) fig += E.key(X, pin[0] + 1, pin[1] + 6, -90, g ? 1.35 : 1.2);
    else if (d0) fig += E.key(X, E.RIG.d0.key[0], E.RIG.d0.key[1], E.RIG.d0.key[2], g ? 1.35 : 1.2);
    else fig += chain(X, pin[0], pin[1], pin[0] + 1, pin[1] + 11, 2, 0, X.game ? 1.1 : 0.85, K.ink300) + E.key(X, pin[0] + 1, pin[1] + 14, W ? 8 : -14, g ? 1.35 : 1.2);
    fig += E.pinch(X, palm, pin);
    fig += X.S('M 234,170 C 238,152 220,144 206,154 C 204,166 212,176 224,178 Z', K.ink, 2.2, X.T([210, 152, 226, 146, 234, 158], 1.4, 'mid', K.ink500));
    // neck + standing collar + throat latch
    fig += X.S('M 181,152 L 184,128 L 196,128 L 197,152 Z', K.ink, 1.8, dry(X, [185, 130, 184, 140, 185, 152], 2.4, 2, K.ink500, 3));
    fig += X.S('M 158,152 C 168,138 210,138 222,152 L 218,168 C 204,158 176,158 162,168 Z', K.ink700, 2.2, `<path d="M 156,150 C 166,138 186,136 196,138 L 170,160 Z" fill="${K.ink500}"/>`);
    fig += latch(X, 190, 156, g ? 2.1 : 1.9, W || d0, 0, K.ch3.deep);
    // locket head, tilted +9° (S-curve end); attack bows it to 14° toward the lock
    fig += `<g transform="rotate(${at ? A.head : 9} 190 132)">${head(X, ph, En, d0 ? 'out' : 'open')}</g>`;
    if (ph >= 3) fig += drip(X, 176, 134, 26, 5) + drip(X, 216, 138, 30, 5.4) + drip(X, 170, 208, 22, 4.6) + drip(X, 222, 208, 28, 5) + drip(X, 104, 298, 26, 5);
    if (En) {
      const crown = flame(X, 170, 58, 34, 16, -0.35, 1) + flame(X, 199, 40, 46, 18, 0.05, 2) + flame(X, 228, 58, 34, 16, 0.35, 3);
      let fl = at ? `<g transform="rotate(${A.head - 9} 190 132)">${crown}</g>` : crown;   // crown flames follow the bowed head
      FAN.forEach(([a, L], i) => { if (i % 2) return; const p = fanP(a, L + 2, 0), ca = Math.cos((a * Math.PI) / 180); fl += flame(X, p[0], p[1] + 6, 26, 13, ca * 0.4, 10 + i); });
      back = fl + back;
    }
    if (W) front += exclaim(X, 132, 38, 1.1);
    if (at) {
      // 3 traps: an ink ✦ beside each of the 3 latches on hoop 2 (the tightened cage's own positions + (10, −8))
      const T = B._.xf(A.tight);
      front += [-70, -14, 42].map((th) => { const p = T(E.ringPt(2, th)); return spark(X, p[0] + 10, p[1] - 8, 6); }).join('');
      // two short chain pieces lying on the floor left and right of the clutching hook-hand (no grid lines)
      under += chain(X, 62, 362, 20, 366, g ? 4 : 6, 0, g ? 1.1 : 0.9, K.ink300) + chain(X, 90, 365, 134, 369, g ? 4 : 6, 0, g ? 1.1 : 0.9, K.ink300);
    }
    if (d0) {
      // three glass slivers flying off the cracked face (different sizes and distances: never a pair side by side)
      [[230, 70, 5.5, 20], [160, 88, 4.5, 200], [220, 132, 4, 110]].forEach(([x, y, r, a]) => {
        const P = [0, 130, 245].map((k) => [x + Math.cos(((a + k) * Math.PI) / 180) * r * (k ? 0.85 : 1.2), y + Math.sin(((a + k) * Math.PI) / 180) * r * (k ? 0.85 : 1.2)]);
        front += `<path d="M ${P.map(pt).join(' L ')} Z" fill="${K.paper300}" stroke="${K.ink}" stroke-width="${f(1.6 * X.li)}" stroke-linejoin="round"/>`;
      });
    }
    // enrage fill-silhouette: fan sector (gaps between plates never get the coral pulse). The attack pose opens no new
    // closed hole or gap < 26: the forward arm leaves a wide open armpit, the far arm lies on the veil (k3p-empress-atkE).
    const solid = 'M ' + [FANC, ...FAN.map(([a, L]) => fanP(a, L - 4, 0))].map(pt).join(' L ') + ' Z';
    return { back, fig, front, solid, under };
  };

  // ---- death f1–f3 (f0 is the idle pose above) ----
  E.death = function (X, o) {
    const g = X.game, fr = o.frame, ph = 3, tfs = B._.tfs;
    let back = '', fig = '', front = '';
    const veil = X.S(E.VEIL, K.ink, 2.4, `<path d="M 162,150 C 128,162 104,200 92,240 C 84,266 72,290 58,312 L 78,306 C 94,262 110,214 146,178 Z" fill="${K.ink500}"/>`);
    const bar = (P) => { const d = B._.smooth(P); return X.L(d, (5.6 * X.lw) / X.li, K.ink) + X.L(d, 1.8, K.ink700); };
    if (fr === 1) {
      const R = E.RIG.d1;
      back += `<g transform="${tfs(R.sq)}">${veil}</g>` + `<g transform="${tfs(R.fan)}">${fan(X, ph)}</g>`;
      // far arm falls with the sunk shoulder; the hook-hand lies flat on the floor, hooks spread
      back += E.sleeve(X, [160, 240], [118, 286], [88, 320], K.ink700, true) + E.hand(X, 76, 338, 156, 22, 40, 1, [0.7, 0.95, 0.9, 0.7], 1.25);
      // the bodice sinks into the cage (drawn behind it)
      fig += `<g transform="${tfs(R.dn)}">${X.S(E.BODICE, K.ink, 2.4, `<path d="M 158,156 C 168,150 176,149 184,149 L 178,170 L 187,184 L 176,204 L 184,214 L 168,214 C 162,194 158,176 158,156 Z" fill="${K.ink500}"/>`)}` +
        X.S('M 146,170 C 142,152 160,144 174,154 C 176,166 168,176 156,178 Z', K.ink700, 2.2, '') +
        X.S('M 181,152 L 184,128 L 196,128 L 197,152 Z', K.ink, 1.8, '') + X.S('M 158,152 C 168,138 210,138 222,152 L 218,168 C 204,158 176,158 162,168 Z', K.ink700, 2.2, `<path d="M 156,150 C 166,138 186,136 196,138 L 170,160 Z" fill="${K.ink500}"/>`) +
        latch(X, 190, 156, g ? 2.1 : 1.9, true, 0, K.ch3.deep) + `</g>`;
      fig += `<g transform="${tfs(R.sq)}">${skirt(X, ph, true, { dead: true })}</g>`;
      // ink runs down the crumpled cage onto the floor (short: the hem now lies on the ground)
      fig += drip(X, 118, 328, 12, 4.6) + drip(X, 168, 336, 10, 5) + drip(X, 244, 334, 12, 5) + drip(X, 290, 322, 10, 4.4);
      // near arm hangs limp over the cage (shoulder sunk 70), the key lies at the near foot
      fig += E.sleeve(X, [224, 234], [252, 266], [262, 302], K.ink, false) + E.hand(X, 266, 316, 84, 12, 30, 1, [0.8, 1, 0.9, 0.75], 1.05);
      fig += `<g transform="${tfs(R.dn)}">${X.S('M 234,170 C 238,152 220,144 206,154 C 204,166 212,176 224,178 Z', K.ink, 2.2, '')}</g>`;
      fig += E.key(X, 292, 354, -84, g ? 1.35 : 1.2);
      fig += `<g transform="${tfs(R.head)}">${head(X, ph, false, 'out')}</g>`;
      return { back, fig, front };
    }
    if (fr === 2) {
      // a heap of bent cage bars and chain melting into ink (top ≈ 228 = 40%); the locket head lies on top, its lid
      // hanging open over the heap's face; art: 3 manuscript scraps
      const R = E.RIG.d2;
      back += bar([[96, 334], [84, 298], [96, 266]]) + bar([[148, 292], [138, 258], [154, 236]]) + bar([[252, 290], [262, 256], [286, 246]]) + bar([[302, 330], [318, 294], [312, 266]]);
      const M = B._.mound(X, [[62, 358], [80, 320], [108, 294], [146, 274], [186, 262], [226, 262], [264, 274], [296, 298], [318, 326], [330, 358]], 360,
        [[104, 312, 16, 4.6], [150, 282, 22, 5], [270, 290, 18, 4.6], [312, 330, 12, 4.4]]);
      fig += M.s;
      fig += chain(X, 104, 324, 172, 304, g ? 5 : 8, 10, g ? 1.15 : 0.95, K.ink300) + chain(X, 214, 302, 290, 322, g ? 5 : 8, 12, g ? 1.15 : 0.95, K.ink500);
      fig += latch(X, 128, 340, g ? 1.5 : 1.35, true, -20, K.ch3.deep) + latch(X, 276, 334, g ? 1.4 : 1.25, true, 24, K.ch3.deep);
      fig += E.key(X, 300, 356, -84, g ? 1.35 : 1.2);
      fig += `<g transform="${tfs(R.head)}">${head(X, ph, false, 'out')}</g>`;
      fig += B._.scrap(X, 46, 350, 12, -18, 4) + B._.scrap(X, 344, 346, 11, 20, 5) + B._.scrap(X, 120, 366, 8, 6, 6);
      return { back, fig, front };
    }
    // f3: puddle (192,342) rx132 ry29; the locket lies face up (glass ×0.4) with paper ✕✕ eyes and its lid open beside it;
    // three burst latches, the master key, two bent bar ends (everything stays at or below y 300)
    const R = E.RIG.d3, P = B._.puddle(X, 192, 342, 132, 29, 3);
    fig += P.s + bar([[112, 352], [100, 330], [104, 310]]) + bar([[282, 350], [298, 330], [296, 312]]);
    fig += `<g transform="${tfs(R.relic)}">${head(X, ph, false, 'dead', B._.inv(R.relic))}</g>`;
    fig += latch(X, 92, 350, g ? 1.5 : 1.35, true, -30, K.ch3.deep) + latch(X, 288, 346, g ? 1.4 : 1.25, true, 40, K.ch3.deep) + latch(X, 150, 364, g ? 1.3 : 1.15, true, 10, K.ch3.deep);
    fig += E.key(X, 214, 360, -86, g ? 1.35 : 1.2);
    return { back, fig, front };
  };

  B.anchorsOf.empress = (o) => {
    if (o.pose === 'idle') return {
      face: [197, 101], faceRim: [208, 69], muzzle: [198, 290],
      hands: o.windup ? [[272, 75], [66, 201]] : [[289, 133], [76, 253]], key: o.windup ? [283, 90] : [302, 147]
    };
    // K3-2: attack / death from the rig ops above (face = glass centre, f3 = the midpoint of the relic's ✕✕)
    const r1 = (p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10], rot = (p, deg) => r1(B._.rotP(p, [190, 132], deg)), top = (pts) => pts.reduce((a, p) => (p[1] < a[1] ? p : a));
    // key = its bow centre (key frame (0,12) × 1.2), the same point as the idle anchor
    const keyC = (x, y, deg) => { const a = (deg * Math.PI) / 180; return r1([x - Math.sin(a) * 14.4, y + Math.cos(a) * 14.4]); };
    const hd = (t) => [t[0], Math.round((t[1] - 10) * 10) / 10];
    if (o.pose === 'attack') {
      const A = E.RIG.atk, H = E.palms(A.na, A.fa);
      return { face: rot(E.FACE_T, A.head), faceRim: rot(E.RIM_T, A.head), muzzle: [198, 290], hands: [r1(H.palm), r1(H.fpalm)], key: keyC(H.pin[0] + 1, H.pin[1] + 6, -90) };
    }
    const fr = o.frame;
    if (fr === 0) {
      const H = E.palms({ s: [224, 164], e: [264, 194], w: [284, 146] }, { s: [160, 170], e: [128, 222], w: [88, 246] }), k = E.RIG.d0.key;
      return { face: rot(E.FACE_T, 9), faceRim: rot(E.RIM_T, 9), muzzle: [198, 290], hands: [r1(H.palm), r1(H.fpalm)], key: keyC(k[0], k[1], k[2]), head: hd(rot(E.CROWN_T, 9)) };
    }
    if (fr === 1) {
      const R = E.RIG.d1, Hd = B._.xf(R.head), Fn = B._.xf(R.fan), t = top([Hd(E.CROWN_T), Fn([188, 56])]);
      return { face: Hd(E.FACE_T), faceRim: Hd(E.RIM_T), muzzle: B._.xf(R.sq)([198, 290]), hands: [[266, 316], [76, 338]], key: keyC(292, 354, -84), head: hd(t) };
    }
    if (fr === 2) {
      const Hd = B._.xf(E.RIG.d2.head), t = top([Hd(E.CROWN_T), Hd([170, 76]), Hd([214, 76]), [154, 236]]);
      return { face: Hd(E.FACE_T), faceRim: Hd(E.RIM_T), muzzle: [196, 300], hands: [[128, 340], [276, 334]], key: keyC(300, 356, -84), head: hd(t) };
    }
    const Rl = B._.xf(E.RIG.d3.relic), t = top([Rl(E.CROWN_T), [296, 312]]);
    return { face: Rl(E.EYES_T), faceRim: Rl(E.RIM_T), muzzle: [192, 342], hands: [[92, 350], [288, 346]], key: keyC(214, 360, -86), head: hd(t) };
  };
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
  // K3-2 face states: 'open' (as before) | 'out' (death f0–f2: the paper face goes ink.300, the glass cracks, both hands
  // drop to half past six) | 'dead' (f3 relic: the 'out' dial under a paper ✕, upright through m)
  H.dial = function (X, x, y, r, hand, hot, state = 'open', m) {
    let t = '';
    const n = X.game ? 4 : 12, lit = state === 'open';
    for (let i = 0; i < n; i++) { const a = ((i * 360) / n) * (Math.PI / 180), k = X.game || i % 3 === 0 ? 1 : 0.6; t += `<path d="M ${f(x + Math.cos(a) * r * 0.7)},${f(y + Math.sin(a) * r * 0.7)} L ${f(x + Math.cos(a) * r * (0.7 + 0.2 * k))},${f(y + Math.sin(a) * r * (0.7 + 0.2 * k))}" stroke="${K.ink}" stroke-width="${f((X.game ? 2.6 : 1.5) * k)}"/>`; }
    // half past six: the minute hand straight down (90°), the hour hand half-way to seven (105°)
    const a = ((lit ? hand : 90) * Math.PI) / 180, b = ((lit ? hand + 132 : 105) * Math.PI) / 180;
    const glow = hot ? `<circle cx="${x}" cy="${y}" r="${f(r * 1.7)}" fill="${K.paper50}" opacity="0.35"/>` : '';
    const hands = hot ? '' : `<path d="M ${f(x + Math.cos(b) * r * 0.46)},${f(y + Math.sin(b) * r * 0.46)} L ${x},${y} L ${f(x + Math.cos(a) * r * 0.74)},${f(y + Math.sin(a) * r * 0.74)}" fill="none" stroke="${K.ink}" stroke-width="${f(r * 0.24)}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="${f(r * 0.2)}" fill="${K.ink}"/>`;
    if (!lit) {
      // broken glass: two ink cracks from the upper-left rim through the face (no white), then the hands on top
      const crk = X.L(`M ${f(x - r * 0.9)},${f(y - r * 0.38)} L ${f(x - r * 0.3)},${f(y - r * 0.1)} L ${f(x - r * 0.12)},${f(y - r * 0.52)} L ${f(x + r * 0.5)},${f(y - r * 0.22)} M ${f(x - r * 0.3)},${f(y - r * 0.1)} L ${f(x - r * 0.42)},${f(y + r * 0.62)}`, X.game ? 1.4 : 1.1, K.ink);
      return `<circle cx="${x}" cy="${y}" r="${f(r + 2)}" fill="${K.ink}"/><circle cx="${x}" cy="${y}" r="${f(r - 2)}" fill="${K.ink300}"/>${t}${crk}${hands}` + (state === 'dead' ? B._.xMark(X, x, y, m) : '');
    }
    return `${glow}<circle cx="${x}" cy="${y}" r="${f(r + 2)}" fill="${K.ink}"/><circle cx="${x}" cy="${y}" r="${f(r - 2)}" fill="${K.paper50}"/>${t}${hands}` +
      (hot ? '' : `<path d="M ${f(x - r * 0.62)},${f(y - r * 0.3)} A ${f(r * 0.7)} ${f(r * 0.7)} 0 0 1 ${f(x - r * 0.2)},${f(y - r * 0.66)}" fill="none" stroke="${K.ink300}" stroke-width="${f(X.game ? 1.6 : 1)}" opacity="0.7"/>`);
  };
  // brass trumpet in its own frame (x along the tube, origin = mouthpiece), bell mouth turned 3/4 toward camera (≈1.4× old bell)
  // K3-2: state = the dial's face state (above); for 'dead', outer = the relic ops the caller wraps this trumpet in, so the
  // ✕ is counter-transformed through every group down to the dial and stands upright on screen. The bell-rim P2 crack
  // (paper) is left off the dead relic: its ✕ stays the one bright mark.
  H.trumpet = function (X, ang, hot, ph, state = 'open', outer = []) {
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
    // rev 3 (K3 F-B2): the dial lies IN the bell-mouth plane, so it takes the bell's own foreshortening 27/39 = 0.69
    // (was 0.84, which read as a disc pasted on): r17 → 11.7 × 17, inside the 22 × 33 throat.
    const dm = state === 'dead' ? B._.inv([...outer, ['translate', M[0], M[1]], ['rotate', ang], ['translate', bx + 2, 0], ['scale', 0.69, 1], ['rotate', -ang]]) : undefined;
    s += `<g transform="translate(${bx + 2},0) scale(0.69,1) rotate(${-ang})">${H.dial(X, 0, 0, hot ? 18 : 17, -52, hot, state, dm)}</g>`;
    if (ph >= 2 && state !== 'dead') s += B._.pcrack(X, [[bx - 26, -18], [bx - 20, -8], [bx - 27, 4], [bx - 21, 16], [bx - 25, 28]]);
    s += `</g>`;
    return { s, eye: rotP([M[0] + bx + 2, M[1]], M, ang) };
  };
  // proclamation scroll hanging from the far fist: two rolled rods with end-knobs, paper sheet (40% dots, §3.5)
  // K3-1f R4: plain knobs (no inner ink ellipse — two dark-centred knobs either side of the rod read as "◉≡◉", a second
  // face); game knobs pressed to ink.500, art keeps brass ch4.deep.
  H.scroll = function (X, x, y, rot, g) {
    const knob = (xx, yy, r) => `<path d="${ell(xx, yy, r * 0.72, r)}" fill="${g ? K.ink500 : K.ch4.deep}" ${X.O(1.3)}/>`;
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

  const hp = (a, r) => [HALO[0] + Math.cos((a * Math.PI) / 180) * r, HALO[1] + Math.sin((a * Math.PI) / 180) * r];
  // ---- K3-2 rig (drawing and anchors share it; ops first = outermost) ----
  // attack (brief §3.5): the raised trumpet comes down level (ang 2) and blasts straight at the player; the saws leave the
  // halo (P1 4, P2·P3 3: the phase-mark socket is already empty) and fly out to r 108 spinning (+40); wheel and halo turn
  // (spin + 30); the far arm swings the scroll back (−14°), the banner streams back.
  // death: f0 = the idle pose hit (dial out: ink.300 face, cracked glass, half past six; trumpet droops to 55°; a second
  // paper crack splits the halo and its lower-left saw drops; the wheel stops); f1 the wheel tips over (squashed to an
  // ellipse) and the body leans −30° onto it, the halo sinks behind, the trumpet lies on the floor with its bell on the
  // ground; f2 the body melts over the flat wheel, the halo ring sinks behind the heap, the scroll lies open on the floor;
  // f3 puddle + the relic trumpet (bell up, dial ×0.4, paper ✕), a half-sunk halo arc, two lying saws.
  H.RIG = {
    atk: { ang: 2, spin: 30, sawSpin: 40, fly: 108, el: [252, 172], fa: { s: [156, 162], e: [128, 198], w: [118, 234] }, scroll: -14, banner: [46, -12] },
    d0: { ang: 55, el: [258, 196], drop: 3, dropAt: [70, 226], dropRot: 24 },
    d1: { lean: [['translate', 0, 40], ['rotate', -30, 190, 280]], halo: [['translate', -81, 107], ['rotate', -30, 190, 118]], wheel: [['translate', 190, 360], ['scale', 1.06, 0.5], ['translate', -190, -360]], horn: [['translate', 22, 182]], hornAng: 14 },
    d2: { wheel: [['translate', 190, 360], ['scale', 1.12, 0.28], ['translate', -190, -360]], halo: [['translate', -14, 200], ['rotate', -14, 190, 118]], horn: [['translate', 4, 182]], hornAng: -10 },
    d3: { relic: [['translate', 204, 334], ['rotate', -8], ['scale', 1, 0.4], ['translate', -272, -114]], arc: [['translate', -40, 242]] }
  };
  // the halo ring gear with the teeth over each empty socket broken off (the ~3 nearest teeth → a jagged root-level edge)
  H.haloD = function (rot, gaps) {
    const cx = HALO[0], cy = HALO[1], rOut = 88, rRoot = 79, teeth = 26, hole = 67, tip = 0.46, step = (Math.PI * 2) / teeth, a0 = (rot * Math.PI) / 180, out = [], rr = PN.rng(29);
    for (let i = 0; i < teeth; i++) {
      const a = a0 + i * step, deg = (a * 180) / Math.PI;
      const near = gaps.some((gp) => Math.abs(((((deg - gp) % 360) + 540) % 360) - 180) <= (1.5 * 360) / teeth);
      const q = near ? [[a - step * 0.5, rRoot], [a - step * 0.22, rRoot - 3 - rr() * 4], [a + step * 0.08, rRoot - 1 - rr() * 3], [a + step * 0.34, rRoot - 4 - rr() * 3]]
        : [[a - step * 0.5, rRoot], [a - step * (tip * 0.5 + 0.08), rRoot], [a - step * tip * 0.5, rOut], [a + step * tip * 0.5, rOut], [a + step * (tip * 0.5 + 0.08), rRoot]];
      q.forEach(([an, r], k) => out.push((i === 0 && k === 0 ? 'M' : 'L') + f(cx + Math.cos(an) * r) + ',' + f(cy + Math.sin(an) * r)));
    }
    return out.join(' ') + ` Z M ${f(cx + hole)},${cy} A ${hole} ${hole} 0 1 0 ${f(cx - hole)},${cy} A ${hole} ${hole} 0 1 0 ${f(cx + hole)},${cy} Z`;
  };
  // empty saw socket (brief §3.5: never concentric rings): a jagged ink groove across the ring with an ink.500 broken edge
  // and ONE sheared bolt bar (ink.300) standing radially in it
  H.socket = function (X, a) {
    const c = hp(a, 75), r = (a * Math.PI) / 180, t = [-Math.sin(r), Math.cos(r)], n = [Math.cos(r), Math.sin(r)];
    const P = [[-12, -2], [-7, -6], [-1, -3], [5, -7], [11, -3], [9, 4], [3, 6], [-3, 4], [-9, 5]].map(([u, v]) => [c[0] + t[0] * u + n[0] * v, c[1] + t[1] * u + n[1] * v]);
    const b0 = [c[0] - n[0] * 4.5 + t[0] * 1.5, c[1] - n[1] * 4.5 + t[1] * 1.5], b1 = [c[0] + n[0] * 4.5 + t[0] * 1.5, c[1] + n[1] * 4.5 + t[1] * 1.5];
    return `<path d="M ${P.map(pt).join(' L ')} Z" fill="${K.ink}" stroke="${K.ink500}" stroke-width="${f(1.3 * X.li)}" stroke-linejoin="round"/>` + X.L(`M ${pt(b0)} L ${pt(b1)}`, 2.2, K.ink300);
  };

  // ---- the figure in sections (idle / windup output and evaluation order exactly as before) ----
  // halo ring gear + saws. P.gaps: socket angles whose saw has gone (attack: flown off; death: dropped)
  function haloS(X, o, sp, gaps = []) {
    const g = X.game, ph = o.phase || 1, W = o.windup;
    const hd = gaps.length ? H.haloD(sp * 0.5 + 4, gaps) : gearPath(HALO[0], HALO[1], 88, 79, 26, sp * 0.5 + 4, 67, 0.46);
    let s = X.S(hd, K.ink, 2.4, `<path d="M 90,20 L 200,20 L 200,40 C 150,44 118,70 104,118 L 90,118 Z" fill="${K.ink500}"/>` + dry(X, [106, 112, 110, 76, 140, 44, 186, 34], 5, 3, K.ink300, 5));
    s += `<path d="${circ(HALO[0], HALO[1], 72)}" fill="none" stroke="${K.ink500}" stroke-width="${f(1.2 * X.li)}" stroke-dasharray="${g ? '6 6' : '3 4'}"/>`;
    HALO_SAWS.forEach((a, i) => {
      if (ph >= 2 && i === 2) { // PHASE MARK: empty socket where the saw was torn off + paper crack along the ring
        const p = hp(a, 76);
        s += `<path d="${circ(p[0], p[1], 10)}" fill="${K.ink700}" ${X.O(1.8)}/><path d="${circ(p[0], p[1], 4.6)}" fill="${K.ink}" stroke="${K.ink300}" stroke-width="${f(1.2 * X.li)}"/>` +
          [0, 120, 240].map((b) => { const q = [p[0] + Math.cos((b * Math.PI) / 180) * 7.2, p[1] + Math.sin((b * Math.PI) / 180) * 7.2]; return `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(1.4 * X.li)}" fill="${K.ink300}"/>`; }).join('');
        s += pcrack(X, [hp(-39, 76), hp(-45, 82), hp(-51, 73), hp(-58, 81), hp(-65, 74)], [hp(-45, 82), hp(-44, 90)]);
        return;
      }
      if (gaps.indexOf(a) >= 0) { s += H.socket(X, a); return; }
      const lift = W && i === 1 ? 26 : 0, p = hp(a, 76 + lift);
      s += H.saw(X, p[0], p[1], 19, sp + i * 11);
      if (lift) s += X.L(`M ${f(p[0] - 24)},${f(p[1] + 8)} A 26 26 0 0 1 ${f(p[0] - 10)},${f(p[1] - 20)} M ${f(p[0] + 24)},${f(p[1] + 8)} A 26 26 0 0 0 ${f(p[0] + 10)},${f(p[1] - 20)}`, 2, K.ink);
    });
    return s;
  }
  // cape: 3 zigzag ink500 folds (lit upper-left), torn hem, no dots (flutters) + P3 drips + the liripipe tail
  function capeS(X, ph) {
    const capeInner =
      `<path d="M 158,148 C 126,152 98,176 76,206 L 96,201 L 70,238 L 97,220 L 82,250 L 112,211 L 103,213 L 128,184 L 118,186 L 152,160 Z" fill="${K.ink500}"/>` +
      `<path d="M 152,178 L 126,214 L 137,211 L 112,250 L 126,244 L 108,282 L 138,236 L 126,240 L 148,206 L 137,208 L 162,178 Z" fill="${K.ink500}"/>` +
      `<path d="M 60,256 L 74,248 L 70,262 L 88,252 L 86,268 L 104,258 L 98,276 L 88,272 L 82,290 L 72,276 L 62,286 L 64,270 L 50,274 Z" fill="${K.ink700}"/>` +
      X.art(dry(X, [150, 166, 118, 182, 92, 214, 58, 260], 4, 3, K.ink300, 3));
    let s = X.S(H.CAPE, K.ink, 2.4, capeInner);
    if (ph >= 3) s += drip(X, 60, 292, 18, 5) + drip(X, 100, 296, 22, 5.4) + drip(X, 40, 278, 14, 4.4);
    s += X.T([190, 64, 150, 34, 116, 72, 70, 62], 17, 'start', K.ink) + X.T([186, 60, 152, 38, 120, 68, 80, 62], 2.6, 'start', K.ink300);
    return s;
  }
  // WHEEL (gear unicycle) + spokes + hub + fork
  function wheelS(X, sp) {
    const wd = gearPath(WH[0], WH[1], 70, 61, 18, sp, 47, 0.48);
    let s = X.S(wd, K.ink, 2.6, `<path d="M 110,210 L 200,210 L 200,226 C 158,228 132,254 124,296 L 110,296 Z" fill="${K.ink500}"/>` +
      dry(X, [128, 288, 130, 250, 158, 226, 194, 222], 5, 3, K.ink300, 4) + X.T([248, 318, 236, 346, 196, 358], 2.2, 'mid', K.ink500));
    for (let i = 0; i < 5; i++) {
      const a = ((sp + i * 72 + 18) * Math.PI) / 180, b = a + 0.5;
      const p0 = [WH[0] + Math.cos(a) * 14, WH[1] + Math.sin(a) * 14], p1 = [WH[0] + Math.cos(b) * 50, WH[1] + Math.sin(b) * 50], pm = [WH[0] + Math.cos(a + 0.12) * 32, WH[1] + Math.sin(a + 0.12) * 32];
      s += X.L(`M ${pt(p0)} Q ${pt(pm)} ${pt(p1)}`, (7.4 * X.lw) / X.li, K.ink) + X.L(`M ${pt(p0)} Q ${pt(pm)} ${pt(p1)}`, 1.6, i < 2 ? K.ink500 : K.ink700);
    }
    s += `<path d="${circ(WH[0], WH[1], 16)}" fill="${K.ink700}" ${X.O(2.2)}/><path d="${circ(WH[0], WH[1], 7)}" fill="${K.ch4.deep}" ${X.O(1.4)}/>`;
    s += X.P('M 176,232 L 184,232 L 192,284 L 186,286 Z', K.ink, 1.8) + X.P('M 206,232 L 214,232 L 196,286 L 190,284 Z', K.ink700, 1.8);
    return s;
  }
  // lower robe + torso + tabard (+ P3 core) + belt
  function robeS(X, ph, sp) {
    let s = X.S(H.SKIRT, K.ink, 2.4, `<path d="M 156,198 C 146,218 136,236 124,258 L 134,256 L 146,226 L 158,222 L 166,200 Z" fill="${K.ink500}"/>` + X.T([222, 204, 232, 224, 244, 248], 1.6, 'mid', K.ink500));
    if (ph >= 3) s += drip(X, 150, 278, 16, 4.6) + drip(X, 204, 270, 20, 5) + drip(X, 232, 266, 14, 4.4);
    s += X.S(H.TORSO, K.ink, 2.4, `<path d="M 146,150 C 160,146 170,146 176,148 L 166,176 L 174,186 L 162,210 L 144,210 Z" fill="${K.ink500}"/>`);
    const TAB = 'M 172,150 L 218,150 L 216,250 L 206,244 L 196,258 L 186,244 L 174,250 Z';
    s += X.S(TAB, K.ink, 2, `<path d="M 170,146 L 195,146 L 195,262 L 170,262 Z" fill="${K.ink700}"/>` + X.L('M 195,150 L 195,256', 1.4, K.ink500) +
      `<path d="${gearPath(184, 180, 9, 7, 8, 0, 3.4)}" fill="${K.ink300}" fill-rule="evenodd"/>` + `<path d="M 200,168 L 212,168 L 206,178 L 212,190 L 200,190 L 206,178 Z" fill="none" stroke="${K.ink300}" stroke-width="${f(1.8 * X.li)}" stroke-linejoin="round"/>`);
    // P3 core: erased plate (dotted paper.300 cut) + the exposed saw + a brass hub. K3-1f F2: no paper.50 glow disc and no
    // paper.50 hub — a white dot in a ring on the body was a second face (the face is the dial in the bell).
    if (ph >= 3) s += `<path d="M 180,206 L 212,204 L 214,240 L 196,248 L 178,238 Z" fill="${K.ink}" stroke="${K.paper300}" stroke-width="${f(1.6 * X.li)}" stroke-dasharray="4 3"/>` + H.saw(X, 196, 224, 14, sp * 2) + `<circle cx="196" cy="224" r="5" fill="${K.ch4.deep}" stroke="${K.ink}" stroke-width="${f(1.6 * X.li)}"/>`;
    s += X.P('M 156,198 C 178,206 212,206 234,198 L 234,210 C 212,218 178,218 156,210 Z', K.ink700, 1.8) + `<rect x="189" y="199" width="12" height="13" rx="2" fill="${K.ch4.deep}" ${X.O(1.4)}/>`;
    return s;
  }
  // far arm: comes forward from under the cape, fist grips the proclamation scroll (rot = scroll swing)
  function farArmS(X, fa, rot) {
    const du = [fa.w[0] - fa.e[0], fa.w[1] - fa.e[1]], dl = Math.hypot(du[0], du[1]), fist = [fa.w[0] + (du[0] / dl) * 11, fa.w[1] + (du[1] / dl) * 11];
    let s = E.sleeve(X, fa.s, fa.e, fa.w, K.ink700, true);
    s += H.scroll(X, fist[0], fist[1] + 1, rot, X.game);
    s += `<path d="${ell(fist[0], fist[1], 9, 7.6)}" fill="${K.ink}" ${X.O(1.8)}/>` + X.L(`M ${f(fist[0] - 6)},${f(fist[1] - 1)} L ${f(fist[0] + 5)},${f(fist[1] - 3)} M ${f(fist[0] - 5)},${f(fist[1] + 3)} L ${f(fist[0] + 6)},${f(fist[1] + 1)}`, 1.1, K.ink500) +
      X.T([fist[0] - 7, fist[1] - 5, fist[0] - 1, fist[1] - 9, fist[0] + 6, fist[1] - 6], 1.2, 'mid', K.ink300);
    return s;
  }
  // shoulder mantle + hood (lit crescent + chaperon roll + an empty ink opening)
  // rev 3 (K3 F-B2, user decision Q4): no paper glints inside the hood, normal or enraged. Those who serve the void have
  // their faces erased (lore §3.1), and the face = weak point is ONE place: the dial in the bell. anchors().hoodEyes is
  // kept for callers but unused.
  function hoodS(X) {
    let s = X.S('M 150,160 C 150,142 170,134 194,134 C 216,134 236,142 238,160 L 228,170 L 222,160 L 212,172 L 204,162 L 194,174 L 184,162 L 174,172 L 166,160 L 158,170 Z', K.ink, 2.2, `<path d="M 148,160 C 150,140 168,134 186,134 L 176,150 L 182,154 L 164,168 Z" fill="${K.ink500}"/>`);
    s += X.S(H.HOOD, K.ink700, 2.6, `<path d="M 170,60 C 188,70 184,118 192,156 L 166,156 L 166,60 Z" fill="${K.ink500}"/>` + dry(X, [184, 62, 176, 92, 176, 128], 3.6, 3, K.ink300, 2) +
      `<path d="M 204,74 C 226,86 234,116 222,150 L 240,150 L 240,70 Z" fill="${K.ink}"/>`);
    s += `<path d="M 205,96 C 216,92 226,100 226,114 C 226,126 218,134 208,132 C 202,124 200,106 205,96 Z" fill="${K.ink}"/>`;
    s += `<path d="M 204,90 C 222,84 236,100 234,118 C 232,134 220,142 206,138 C 196,128 194,102 204,90 Z" fill="none" stroke="${K.ink}" stroke-width="${f(10 * X.lw)}" stroke-linejoin="round"/>` +
      `<path d="M 204,90 C 222,84 236,100 234,118 C 232,134 220,142 206,138 C 196,128 194,102 204,90 Z" fill="none" stroke="${K.ink700}" stroke-width="${f(6 * X.li)}"/>` +
      X.T([200, 104, 204, 90, 220, 88], 2.2, 'mid', K.ink300) + X.art(X.L('M 214,88 l 3,6 M 226,96 l -2,6 M 232,110 l -5,2 M 230,126 l -5,-2', 1, K.ink500));
    return s;
  }
  // near arm from the shoulder sh through the elbow el to the fist at grip (grip2 = the second hand on the tube, or null)
  function nearArmS(X, sh, el, grip, grip2) {
    const n1 = (a, b2) => { const dx = b2[0] - a[0], dy = b2[1] - a[1], L = Math.hypot(dx, dy); return [-dy / L, dx / L]; };
    const u1 = n1(sh, el), u2 = n1(el, grip), A = (p, u, k) => pt([p[0] + u[0] * k, p[1] + u[1] * k]);
    let s = X.SS(`M ${A(sh, u1, 14)} C ${A(el, u1, 13)} ${A(el, u2, 12)} ${A(grip, u2, 10)} L ${A(grip, u2, -10)} C ${A(el, u2, -8)} ${A(el, u1, -8)} ${A(sh, u1, -12)} Z`, K.ink, 2.4,
      dry(X, [sh[0] + u1[0] * 10, sh[1] + u1[1] * 10, el[0] + u1[0] * 9, el[1] + u1[1] * 9, grip[0] + u2[0] * 7, grip[1] + u2[1] * 7], 2.4, 2, K.ink500, 4));
    s += X.P(`M ${A(grip, u2, 13)} L ${A(grip, u2, -13)} L ${pt([grip[0] - u2[1] * -8 - u2[0] * 12, grip[1] + u2[0] * -8 - u2[1] * 12])} Z`, K.ink700, 1.8);
    s += `<path d="${ell(grip[0], grip[1], 9, 7.5)}" fill="${K.ink}" ${X.O(1.8)}/>` + (grip2 ? `<path d="${ell(grip2[0], grip2[1], 5.5, 5)}" fill="${K.ink}" ${X.O(1.4)}/>` : '');
    s += X.art(X.T([grip[0] - 7, grip[1] - 4, grip[0] - 2, grip[1] - 8, grip[0] + 5, grip[1] - 6], 1.2, 'mid', K.ink300));
    return s;
  }
  // trumpet + banner + near arm holding it. P = { bl, sway, el, state }
  function hornS(X, ang, En, ph, P) {
    const tr = H.trumpet(X, ang, En, ph, P.state);
    const grip = rotP([MOUTH[0] + 58, MOUTH[1] + 4], MOUTH, ang), grip2 = rotP([MOUTH[0] + 22, MOUTH[1] + 4], MOUTH, ang);
    const b0 = rotP([MOUTH[0] + 34, MOUTH[1] + 4], MOUTH, ang), b1 = rotP([MOUTH[0] + 74, MOUTH[1] + 4], MOUTH, ang);
    const { bl, sway } = P;
    const bannerD = `M ${pt(b0)} L ${pt(b1)} L ${f(b1[0] + sway)},${f(b1[1] + bl)} L ${f((b0[0] + b1[0]) / 2 + sway)},${f((b0[1] + b1[1]) / 2 + bl * 0.72)} L ${f(b0[0] + sway)},${f(b0[1] + bl)} Z`;
    let s = X.S(bannerD, K.ink700, 2, `<path d="M ${pt(b0)} L ${f(b0[0] + 16)},${f(b0[1])} L ${f(b0[0] + sway + 10)},${f(b0[1] + bl)} L ${f(b0[0] + sway)},${f(b0[1] + bl)} Z" fill="${K.ink500}"/>` +
      `<circle cx="${f((b0[0] + b1[0]) / 2 + sway * 0.5)}" cy="${f((b0[1] + b1[1]) / 2 + bl * 0.36)}" r="9.5" fill="none" stroke="${K.ink300}" stroke-width="${f(1.6 * X.li)}" stroke-dasharray="${X.game ? '4 3' : '2.6 1.8'}"/>`);
    s += tr.s;
    s += nearArmS(X, [232, 160], P.el, grip, grip2);
    return { s, eye: tr.eye };
  }

  B.parts.herald = function (X, o) {
    if (o.pose === 'death' && o.frame > 0) return H.death(X, o);
    const g = X.game, ph = o.phase || 1, W = o.windup, En = o.enraged, spin = o.spin || 0;
    const at = o.pose === 'attack', d0 = o.pose === 'death', A = H.RIG.atk, D0 = H.RIG.d0;   // d0: death f0 = the idle pose, hit
    const sp = at ? spin + A.spin : spin;
    let back = '', fig = '', front = '';
    // ---------------- halo ring gear (behind) ----------------
    back += haloS(X, o, sp, at ? HALO_SAWS.filter((a, i) => !(ph >= 2 && i === 2)) : d0 ? [HALO_SAWS[D0.drop]] : []);
    if (d0) back += pcrack(X, [hp(-172, 76), hp(-164, 84), hp(-156, 72), hp(-146, 82), hp(-138, 73)], [hp(-156, 72), hp(-152, 64)]);
    back += capeS(X, ph);
    // ---------------- wheel, robe, far arm, hood ----------------
    fig += wheelS(X, sp) + robeS(X, ph, sp);
    fig += farArmS(X, at ? A.fa : W ? { s: [156, 162], e: [120, 178], w: [100, 202] } : { s: [156, 162], e: [124, 186], w: [114, 214] }, at ? A.scroll : W ? 16 : -4);
    fig += hoodS(X);
    // ---------------- trumpet + banner + near arm ----------------
    const ang = at ? A.ang : d0 ? D0.ang : W ? -38 : 26;
    const tr = hornS(X, ang, En, ph, at ? { bl: A.banner[0], sway: A.banner[1], el: A.el, state: 'open' } : d0 ? { bl: 50, sway: 6, el: D0.el, state: 'out' } : { bl: W ? 44 : 50, sway: W ? -8 : 6, el: W ? [262, 140] : [248, 194], state: 'open' });
    fig += tr.s;
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
    if (at) {
      // the flying saws (P1 4, P2·P3 3) at r 108 on their socket angles, spinning +40, each trailed by 2–3 short ink speed
      // lines toward its socket (different lengths and angles); 3 tapered sound waves in front of the bell
      HALO_SAWS.forEach((a, i) => {
        if (ph >= 2 && i === 2) return;
        const p = hp(a, A.fly), r = (a * Math.PI) / 180, n = [Math.cos(r), Math.sin(r)], t = [-n[1], n[0]];
        front += H.saw(X, p[0], p[1], 19, spin + A.sawSpin + i * 11);
        // beside the saw (clear of its disc and of the ring, r ≥ 90), thick at the saw end, thinning toward the socket
        [[-27, 28, 2.2], [26, 21, 1.9], [33, 14, 1.6]].slice(0, i % 2 ? 2 : 3).forEach(([k, L, w], j) => {
          const s0 = [p[0] + t[0] * k + n[0] * 10, p[1] + t[1] * k + n[1] * 10], s1 = [s0[0] - n[0] * L + t[0] * (j - 1) * 3, s0[1] - n[1] * L + t[1] * (j - 1) * 3];
          front += X.T([s0[0], s0[1], (s0[0] + s1[0]) / 2, (s0[1] + s1[1]) / 2, s1[0], s1[1]], w, 'start', K.ink);
        });
      });
      const e = tr.eye;
      [[46, 3.6], [60, 2.8], [74, 2.0]].forEach(([R, w]) => {
        const p0 = [e[0] + R * Math.cos(-0.5585), e[1] + R * Math.sin(-0.5585)], p2 = [e[0] + R * Math.cos(0.5585), e[1] + R * Math.sin(0.5585)], c = [e[0] + R / Math.cos(0.5585), e[1]];
        front += X.T([p0[0], p0[1], c[0], c[1], p2[0], p2[1]], w, 'mid', K.ink);
      });
    }
    if (d0) {
      // the lower-left saw drops off the cracked halo (front: falling, not part of the body)
      front += `<g transform="rotate(${D0.dropRot} ${D0.dropAt[0]} ${D0.dropAt[1]})">${H.saw(X, D0.dropAt[0], D0.dropAt[1], 19, spin + 33)}</g>` +
        X.T([D0.dropAt[0] - 6, D0.dropAt[1] - 24, D0.dropAt[0] - 6, D0.dropAt[1] - 36, D0.dropAt[0] - 5, D0.dropAt[1] - 48], 2.6, 'start', K.ink) + X.T([D0.dropAt[0] + 8, D0.dropAt[1] - 22, D0.dropAt[0] + 9, D0.dropAt[1] - 30, D0.dropAt[0] + 10, D0.dropAt[1] - 38], 2.2, 'start', K.ink);
    }
    const solid = circ(WH[0], WH[1], 64) + ' ' + circ(HALO[0], HALO[1], 82) + (at ? ' ' + H.ATK_SOLID : '');
    return { back, fig, front, solid };
  };
  // attack: the slit between the halo ring / streaming banner and the level bell (8–25 wide, above and below the tube)
  // gets no coral (k3p-herald-atkE-bell); every vertex on the right lies inside the bell's outline, the mouths stay open
  H.ATK_SOLID = 'M ' + [[280, 90], [306, 90], [300, 104], [296, 116], [298, 126], [306, 138], [312, 150], [302, 157], [284, 157], [286, 130], [282, 110]].map(pt).join(' L ') + ' Z';

  // ---- death f1–f3 (f0 is the idle pose above) ----
  H.death = function (X, o) {
    const g = X.game, fr = o.frame, ph = 3, spin = o.spin || 0, tfs = B._.tfs, R = H.RIG['d' + fr];
    let back = '', fig = '', front = '';
    const all = HALO_SAWS.filter((a, i) => i !== 2);
    if (fr === 1) {
      // the halo sinks behind, tilted with the body (its saws gone but one)
      back += `<g transform="${tfs(R.halo)}">${haloS(X, o, spin, [HALO_SAWS[0], HALO_SAWS[3]])}</g>`;
      // body leaning −30° onto the tipped wheel; whatever would go under the floor is cut at the ground line
      const gc = X.clip('M -80,-100 L 470,-100 L 470,362 L -80,362 Z');
      back += `<g clip-path="url(#${gc})"><g transform="${tfs(R.lean)}">${capeS(X, ph)}</g></g>`;
      fig += `<g transform="${tfs(R.wheel)}">${wheelS(X, spin)}</g>`;
      fig += `<g clip-path="url(#${gc})"><g transform="${tfs(R.lean)}">${robeS(X, ph, spin)}${farArmS(X, { s: [156, 162], e: [124, 186], w: [114, 214] }, -4)}${hoodS(X)}${nearArmS(X, [232, 160], [246, 196], [240, 232], null)}</g></g>`;
      // the trumpet dropped: lying on the floor at the near side, bell on the ground
      fig += `<g transform="${tfs(R.horn)}">${H.trumpet(X, R.hornAng, false, ph, 'out').s}</g>`;
      fig += drip(X, 112, 318, 12, 4.6) + drip(X, 160, 326, 10, 4.4);
      return { back, fig, front };
    }
    if (fr === 2) {
      // the halo ring sinks behind the heap; the body melts over the flattened wheel (top ≈ 230 = 40%); the trumpet lies
      // on the heap's near side with its out dial; the scroll lies open on the floor (ink lines, no letters); art 3 scraps
      const gc = X.clip('M -80,-100 L 470,-100 L 470,360 L -80,360 Z');   // the ring sinks into the floor behind the heap
      back += `<g clip-path="url(#${gc})"><g transform="${tfs(R.halo)}">${haloS(X, o, spin, all)}</g></g>`;
      fig += `<g transform="${tfs(R.wheel)}">${wheelS(X, spin)}</g>`;
      const M = B._.mound(X, [[56, 358], [72, 326], [100, 300], [136, 282], [176, 272], [216, 272], [254, 282], [286, 302], [306, 330], [316, 358]], 360,
        [[96, 318, 18, 4.6], [146, 290, 22, 5], [262, 292, 16, 4.6]]);
      fig += M.s;
      fig += `<g transform="${tfs(R.horn)}">${H.trumpet(X, R.hornAng, false, ph, 'out').s}</g>`;
      // the proclamation lying open: a flat paper.300 sheet between two rolled rods, two ink lines of different length and
      // slant and one blot (never three parallel strokes)
      fig += `<path d="M 26,354 L 112,346 L 118,366 L 22,372 Z" fill="${K.paper300}" ${X.O(1.4)}/>` + X.T([40, 360, 62, 356, 92, 355], g ? 3.6 : 2.8, 'mid', K.ink) + X.T([48, 366, 64, 364, 80, 365], g ? 3 : 2.4, 'mid', K.ink) +
        `<path d="${ell(102, 360, 4, 3)}" fill="${K.ink}"/>` + `<rect x="14" y="350" width="10" height="24" rx="5" fill="${K.ink700}" ${X.O(1.3)}/><rect x="114" y="342" width="10" height="26" rx="5" fill="${K.ink700}" ${X.O(1.3)}/>`;
      fig += B._.scrap(X, 336, 352, 11, 18, 7) + B._.scrap(X, 168, 370, 8, -6, 8) + B._.scrap(X, 50, 330, 9, -24, 9);
      return { back, fig, front };
    }
    // f3: puddle; half-sunk halo arc behind (top ≥ 270), the relic trumpet lying bell-up (dial ×0.4, paper ✕), 2 lying saws
    const wl = X.clip('M -80,200 L 470,200 L 470,348 C 330,356 60,356 -80,348 Z');
    back += `<g clip-path="url(#${wl})"><g transform="${tfs(R.arc)}">${haloS(X, o, spin, all)}</g></g>`;
    const P = B._.puddle(X, 192, 342, 132, 29, 4);
    fig += P.s;
    fig += `<g transform="translate(300,352) scale(1,0.45) translate(-300,-352)">${H.saw(X, 300, 352, 19, spin + 20)}</g>` + `<g transform="translate(90,346) scale(1,0.45) translate(-90,-346)">${H.saw(X, 90, 346, 17, spin + 50)}</g>`;
    fig += `<g transform="${tfs(R.relic)}">${H.trumpet(X, 0, false, ph, 'dead', R.relic).s}</g>`;
    return { back, fig, front };
  };

  // hoodEyes: kept so existing callers keep working, but UNUSED since rev 3 (F-B2): the hood holds no glints any more.
  B.anchorsOf.herald = (o) => {
    if (o.pose === 'idle') { const ang = o.windup ? -38 : 26; return { face: rotP([MOUTH[0] + H.BELL + 2, MOUTH[1]], MOUTH, ang), muzzle: HALO.slice(), halo: { c: HALO.slice(), r: 76, saws: HALO_SAWS.slice() }, wheel: { c: WH.slice(), r: 70 }, scroll: o.windup ? [88, 244] : [108, 258], hoodEyes: [214, 106] }; }
    // K3-2: attack / death from the rig ops above. face = the dial centre (f3: the relic's ✕), scroll = scroll centre
    const r1 = (p) => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100], DIAL = [MOUTH[0] + H.BELL + 2, MOUTH[1]];
    const scrollC = (fa, rot) => { const du = [fa.w[0] - fa.e[0], fa.w[1] - fa.e[1]], dl = Math.hypot(du[0], du[1]), a = (rot * Math.PI) / 180; return r1([fa.w[0] + (du[0] / dl) * 11 - Math.sin(a) * 32, fa.w[1] + (du[1] / dl) * 11 + 1 + Math.cos(a) * 32]); };
    const hd = (p) => [p[0], Math.round((p[1] - 10) * 100) / 100];
    if (o.pose === 'attack') {
      const A = H.RIG.atk;
      return { face: r1(rotP(DIAL, MOUTH, A.ang)), muzzle: HALO.slice(), halo: { c: HALO.slice(), r: 76, saws: HALO_SAWS.slice() }, wheel: { c: WH.slice(), r: 70 }, scroll: scrollC(A.fa, A.scroll), hoodEyes: [214, 106],
        saws: HALO_SAWS.filter((a, i) => !((o.phase || 1) >= 2 && i === 2)).map((a) => r1(hp(a, A.fly))) };
    }
    const fr = o.frame;
    if (fr === 0) {
      return { face: r1(rotP(DIAL, MOUTH, H.RIG.d0.ang)), muzzle: HALO.slice(), halo: { c: HALO.slice(), r: 76, saws: HALO_SAWS.slice() }, wheel: { c: WH.slice(), r: 70 }, scroll: [108, 258], hoodEyes: [214, 106], head: hd(hp(-90, 88)) };
    }
    const R = H.RIG['d' + fr];
    if (fr === 1) {
      const L = B._.xf(R.lean), Hl = B._.xf(R.halo), Hn = B._.xf(R.horn), t = [L([200, 56]), Hl(hp(-90, 88))].reduce((a, p) => (p[1] < a[1] ? p : a));
      return { face: Hn(rotP(DIAL, MOUTH, R.hornAng)), muzzle: Hl(HALO), halo: { c: Hl(HALO), r: 76, saws: HALO_SAWS.slice() }, wheel: { c: B._.xf(R.wheel)(WH), r: 70 }, scroll: L([108, 258]), hoodEyes: L([214, 106]), head: hd(t) };
    }
    if (fr === 2) {
      const Hl = B._.xf(R.halo), Hn = B._.xf(R.horn), t = [Hl(hp(-90, 88)), Hl(hp(-60, 88)), Hl(hp(-120, 88))].reduce((a, p) => (p[1] < a[1] ? p : a));
      return { face: Hn(rotP(DIAL, MOUTH, R.hornAng)), muzzle: Hl(HALO), halo: { c: Hl(HALO), r: 76, saws: HALO_SAWS.slice() }, wheel: { c: B._.xf(R.wheel)(WH), r: 70 }, scroll: [70, 360], hoodEyes: [196, 290], head: hd(t) };
    }
    const Rl = B._.xf(R.relic), Ar = B._.xf(R.arc);
    return { face: Rl(DIAL), muzzle: Ar(HALO), halo: { c: Ar(HALO), r: 76, saws: HALO_SAWS.slice() }, wheel: { c: [192, 342], r: 70 }, scroll: [192, 342], hoodEyes: [192, 342], head: hd(Ar(hp(-90, 88))) };
  };
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

  // ---- K3-2 face function (brief §1.10-2): the eclipse eye standing in the ink pan, drawn at (0,0). 'open' = the old
  // eyeEclipse(core 0.22) call, unchanged; 'out' (death f0–f2) = the ink core spreads over most of the disc (r × 0.8 at
  // +0.16r) and the paper crescent left of it goes ink.300; 'dead' (f3 relic) = 'out' under a paper ✕, upright through m.
  Q.eye = function (X, r, En, state = 'open', m) {
    if (state === 'open') return eyeEclipse(X, 0, 0, r, En, 0.22);
    return `<circle cx="0" cy="0" r="${f(r)}" fill="${K.ink300}" stroke="${K.ink}" stroke-width="${f(1.8 * X.li)}"/><circle cx="${f(r * 0.16)}" cy="${f(r * 0.04)}" r="${f(r * 0.8)}" fill="${K.ink}"/>` + (state === 'dead' ? B._.xMark(X, 0, 0, m) : '');
  };
  // ---- K3-2 rig (drawing and anchors share it; ops first = outermost) ----
  // attack (brief §3.6): the verdict drops — the beam swings from the windup's +13° through level to −16°: the void pan sinks,
  // the ink pan (the eye) rises; the far palm presses down; two trajectory arcs trail behind the beam ends. No ground FX
  // under the pans (it would read as a real null zone).
  // death: f0 the eye goes out, the beam cracks at the pivot, both pans swing out, the blindfold ends droop; f1 the body
  // sinks (×0.7, hood top ≈ 158), the beam breaks at the pivot and both halves droop 40°, the pans lie on the floor and the
  // ink pan tips over, spilling; f2 the robe melts into a heap (post stub on top), the void pan lies on its slope with its
  // hole cut through the heap; f3 puddle with the void pan's hole, the overturned ink pan with the ✕ eye on top.
  Q.RIG = {
    atk: { tilt: -16, palm: [96, 300, 98, 12, 26, 3.8], farS: 'M 132,196 C 116,222 102,250 88,278 L 114,296 C 122,268 136,236 150,212 Z', farLit: 'M 132,196 C 116,222 102,250 88,278 L 96,284 C 110,256 124,226 140,204 Z', arc: 122 },
    d0: { swing: [14, -10] },
    d1: { sq: [['translate', 192, 360], ['scale', 1.04, 0.7], ['translate', -192, -360]], droop: 40, panL: [146, 333], panR: [332, 334], tipR: 24 },
    d2: { voidPan: [122, 318, -18], inkPan: [[['translate', 276, 304], ['rotate', 26]]] },
    d3: { voidPan: [114, 346], inkPan: [262, 340], relic: [['translate', 262, 321], ['rotate', -4], ['scale', 1, 0.4]] }
  };
  Q.FAR = { idle: ['M 132,196 C 114,220 96,242 78,262 L 106,284 C 116,258 132,234 150,212 Z', 'M 132,196 C 114,220 96,242 78,262 L 86,270 C 104,248 122,226 140,204 Z', [92, 286, 106, 9, 25, 3.8]] };
  const BEAM = `M ${-HALF},-3 C ${-HALF * 0.5},-5 -14,-8 0,-9 C 14,-8 ${HALF * 0.5},-5 ${HALF},-3 L ${HALF},3 C ${HALF * 0.5},4 14,6 0,7 C -14,6 ${-HALF * 0.5},4 ${-HALF},3 Z`;
  // one half of the broken beam in its own frame (x from the break at 0 out to ±HALF), jagged break end
  const HALFBEAM = (s) => `M ${s * HALF},-3 C ${s * HALF * 0.5},-5 ${s * 14},-8 ${s * 3},-9 L ${s * 7},-4 L ${s * 1},0 L ${s * 6},3 L ${s * 2},7 C ${s * 14},6 ${s * HALF * 0.5},4 ${s * HALF},3 Z`;

  // ---- the figure in sections (idle / windup strings and uid order exactly as before) ----
  // robe: 2 big swooping fold wedges lit from upper-left, lower-right pure ink900 (+ hem drips, P3 drips)
  function robeS(X, ph) {
    let s = X.S(Q.ROBE, K.ink, 2.6,
      `<path d="M 136,206 C 128,240 118,280 100,316 C 96,326 90,336 84,346 L 118,354 C 116,318 124,282 138,252 C 148,232 156,218 166,206 Z" fill="${K.ink500}"/>` +
      `<path d="M 166,206 C 156,218 148,232 138,252 L 151,249 C 158,234 166,222 177,212 Z" fill="${K.ink700}"/>` +
      `<path d="M 178,258 C 170,292 176,326 198,362 L 218,364 C 196,330 192,296 202,258 Z" fill="${K.ink500}"/>` +
      dry(X, [142, 214, 128, 250, 116, 290, 100, 336], 5, 3, K.ink300, 3) + X.T([254, 214, 264, 270, 284, 334], 2, 'mid', K.ink700));
    s += drip(X, 128, 352, 10, 4.4) + drip(X, 246, 356, 11, 4.4);
    if (ph >= 3) s += drip(X, 100, 344, 14, 5) + drip(X, 152, 357, 18, 5.4) + drip(X, 266, 352, 16, 5);
    // belt boss: a plain ink.500 cap with an ink rim (K3-1f R3: an ink disc ringed in ink.300 was ring + disc, a fake eye)
    s += X.S('M 128,238 C 160,248 228,248 262,238 L 264,254 C 228,264 160,264 126,254 Z', K.ink700, 2, X.T([132, 242, 160, 250, 196, 250], 1.4, 'mid', K.ink300)) + X.P('M 214,252 L 228,252 L 234,296 L 224,290 L 218,300 Z', K.ink700, 1.8) +
      `<path d="${circ(196, 250, 7)}" fill="${K.ink500}" stroke="${K.ink}" stroke-width="${f(1.4 * X.li)}"/>`;
    return s;
  }
  // far arm (viewer-left): sleeve path, its lit plane, Q.palm arguments
  const farArmS = (X, S, L, P) => X.SS(S, K.ink, 2.4, `<path d="${L}" fill="${K.ink500}"/>`) + Q.palm(X, ...P);
  // hood (crown severed by the void) + mantle + chest clasp (+ P3 drips)
  function hoodS(X, ph) {
    let s = X.SS(Q.HOOD, K.ink, 2.6, `<path d="M 144,112 C 160,114 164,136 170,170 L 144,170 Z" fill="${K.ink500}"/>` + dry(X, [156, 126, 152, 138, 152, 156], 3, 3, K.ink300, 2) + X.T([236, 102, 246, 124, 238, 162], 2, 'mid', K.ink500));
    s += X.SS(Q.MANTLE, K.ink700, 2.4, `<path d="M 100,200 C 104,168 140,150 180,146 C 150,160 132,180 126,212 Z" fill="${K.ink500}"/>` +
      dry(X, [110, 190, 126, 162, 160, 148, 196, 144], 4, 4, K.ink300, 7) + X.T([236, 150, 270, 164, 282, 192], 2, 'mid', K.ink500));
    // rev 3 (K3 F-B3): chest clasp = a flat square plate (ink.700, ink.300 lit rim on the top-left edges). The old brooch,
    // a ring around an off-centre disc, was the eclipse eye's own figure: a fake eye.
    s += `<path d="M 190,179.5 L 210,179.5 L 209,192.5 L 191,192.5 Z" fill="${K.ink700}" ${X.O(1.2)}/><path d="M 192.4,190.4 L 192.6,181.8 L 207.6,181.8" fill="none" stroke="${K.ink300}" stroke-width="${f(1.4 * X.li)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (ph >= 3) s += drip(X, 150, 216, 18, 4.6) + drip(X, 248, 216, 22, 5) + drip(X, 196, 208, 14, 4);
    return s;
  }
  // near arm (viewer-right): bell sleeve + forearm rising to grip the post; the post with its collars and grip band
  function nearArmPostS(X) {
    let s = X.SS('M 252,206 C 266,200 282,208 286,222 C 292,248 296,274 300,300 L 282,306 L 274,294 L 264,304 C 262,278 260,250 254,232 Z', K.ink, 2.4,
      `<path d="M 252,206 C 262,202 272,204 278,210 L 266,222 L 272,236 L 262,250 L 258,232 Z" fill="${K.ink500}"/>` + X.T([270, 214, 284, 240, 292, 290], 2.2, 'mid', K.ink700));
    s += X.SS('M 254,226 C 248,210 242,198 236,186 L 258,176 C 264,190 272,204 278,220 Z', K.ink, 2.2, dry(X, [240, 186, 246, 200, 254, 222], 2.6, 2, K.ink300, 14));
    s += X.S('M 236,24 L 244,24 L 246,254 L 234,254 Z', K.ink, 2, `<path d="M 234,22 L 238,22 L 237,256 L 234,256 Z" fill="${K.ink300}"/>`);
    [[240, 100], [240, 150], [240, 248]].forEach(([x, y]) => { s += `<path d="${ell(x, y, 8, 4.5)}" fill="${K.ink700}" ${X.O(1.6)}/>`; });
    s += X.P('M 230,168 C 234,160 252,160 256,168 L 256,184 C 250,190 236,190 230,184 Z', K.ink, 1.8) + X.art(X.T([232, 170, 242, 164, 254, 168], 1.2, 'mid', K.ink300)) + X.L('M 234,176 L 252,176 M 234,182 L 252,182', 1, K.ink500);
    return s;
  }
  // the beam at tilt + its pivot cap (crack = an extra crack inside the beam frame, death f0)
  function beamS(X, tilt, ph, crack = '') {
    return `<g transform="translate(${PIV[0]},${PIV[1]}) rotate(${tilt})">` + X.S(BEAM, K.ink, 2.4, `<path d="M ${-HALF},-9 L ${HALF},-9 L ${HALF},-3 L ${-HALF},-3.6 Z" fill="${K.ink500}"/>`) +
      `<path d="M ${-HALF - 4},0 a 5,5 0 1 1 0,0.1 Z M ${HALF + 4},0 a 5,5 0 1 1 0,0.1 Z" fill="none" stroke="${K.ink}" stroke-width="${f(3.6 * X.li)}"/>` +
      X.P('M -3,-8 L 0,-30 L 3,-8 Z', K.ink300, 1.6) + (ph >= 2 ? pcrack(X, [[-98, -1], [-86, 3], [-74, -3], [-60, 2.5], [-46, -2]]) : '') + crack + `</g>` +
      // beam pivot: a plain ink.500 cap (rev 3 F-B3: no inner ring — ring + disc is the fake-eye figure)
      `<path d="${circ(PIV[0], PIV[1], 9)}" fill="${K.ink500}" ${X.O(1.8)}/>`;
  }
  // three chains from a beam end down to a pan's rim points
  const chainsS = (X, e, p) => [[-34, -1], [34, -1], [4, -9]].map(([dx, dy], i) => chain(X, e[0], e[1] + 5, p[0] + dx, p[1] + dy, X.game ? 6 : 12, 0, X.game ? 0.8 : 0.55, i === 2 ? K.ink500 : K.ink300)).join('');
  // ink-full pan (focus exception: eclipse eye floating on the ink) at R; state = the eye's face state; drips = hanging drips
  function inkPanS(X, R, ph, En, state = 'open', drips = true) {
    const g = X.game;
    const bowl = `M ${f(R[0] - 37)},${f(R[1])} C ${f(R[0] - 30)},${f(R[1] + 26)} ${f(R[0] + 30)},${f(R[1] + 26)} ${f(R[0] + 37)},${f(R[1])} Z`;
    let s = X.S(bowl, K.ink, 2.4, `<path d="M ${f(R[0] - 40)},${f(R[1])} L ${f(R[0] - 10)},${f(R[1])} C ${f(R[0] - 14)},${f(R[1] + 12)} ${f(R[0] - 18)},${f(R[1] + 20)} ${f(R[0] - 26)},${f(R[1] + 24)} Z" fill="${K.ink500}"/>`);
    s += `<path d="${ell(R[0], R[1], 37, 12)}" fill="${K.ink}" ${X.O(2.2)}/><path d="${ell(R[0] - 1, R[1] + 0.5, 30, 8.4)}" fill="none" stroke="${K.ink500}" stroke-width="${f(1.2 * X.li)}"/>` + X.art(`<path d="${ell(R[0] - 3, R[1] + 1, 20, 4.4)}" fill="none" stroke="${K.ink500}" stroke-width="0.9"/>`);
    if (drips) s += drip(X, R[0] - 30, R[1] + 8, 18, 4.6) + drip(X, R[0] + 6, R[1] + 22, 26, 5) + drip(X, R[0] + 28, R[1] + 12, 14, 4);
    // rev 3 (K3 F-B3): the eclipse eye STANDS in the ink (a full circle, no longer half laid down by scale(1,0.8)) at
    // panR + (−6, +3), core offset 0.22r, and the pan's front rim is drawn again OVER it (ink, game 9 / art 7) so the
    // eye's lower part sinks behind the rim: hidden ≈ 31% of its height in game, ≈ 25% in art.
    const eye = [R[0] - 6, R[1] + 3];
    s += `<g transform="translate(${f(eye[0])},${f(eye[1])})">${Q.eye(X, En ? 12 : g ? 11.5 : 10.5, En, state)}</g>`;
    s += `<path d="M ${f(R[0] - 37)},${f(R[1])} A 37 12 0 0 0 ${f(R[0] + 37)},${f(R[1])}" fill="none" stroke="${K.ink}" stroke-width="${g ? 9 : 7}" stroke-linecap="round"/>`;
    if (ph >= 2) s += pcrack(X, [[R[0] + 34, R[1] - 2], [R[0] + 24, R[1] + 6], [R[0] + 29, R[1] + 12], [R[0] + 14, R[1] + 17], [R[0] + 18, R[1] + 22], [R[0] - 2, R[1] + 21]]);
    return s;
  }
  // the void pan's outline (it is a hole): bowl outline + rim + dashed inner rim + the 3 chain eyes
  function voidPanS(X, p) {
    const g = X.game, rw = g ? 7.4 : 5.2, bw2 = g ? 6.4 : 4.4;   // game: fixed rim widths so the interior stays OPEN at 156px
    return `<path d="${Q.bowlD(p[0], p[1])}" fill="none" stroke="${K.ink}" stroke-width="${f(bw2)}" stroke-linecap="round"/>` +
      `<path d="${ell(p[0], p[1], 36, 12)}" fill="none" stroke="${K.ink}" stroke-width="${f(rw)}"/><path d="${ell(p[0], p[1], 36, 12)}" fill="none" stroke="${K.ink500}" stroke-width="${f(1.4 * X.li)}" stroke-dasharray="${g ? '10 4' : '14 3 4 3'}"/>` +
      [[4, -9], [-34, -1], [34, -1]].map(([dx, dy]) => `<circle cx="${f(p[0] + dx)}" cy="${f(p[1] + dy)}" r="3" fill="${K.ink}"/>`).join('');
  }
  // P3 core floating in the erased chest = an INK BEAD (K3-1f F1). The old paper.50 glint + ink.300 ring + lower arc read
  // as an eyeball, a second face mid-body (bible §10.2-2 "one place"). Lit like every ink body: one ink.500 crescent on
  // the upper-left (max 4.2 thick) and an ink.300 dry rim on the upper-left quarter only. No ring + disc, no white dot.
  const beadS = (X) => `<circle cx="203" cy="224" r="13" fill="${K.ink}"/><path d="M 213.57,216.43 A 13 13 0 1 0 195.43,234.57 A 13 13 0 0 1 213.57,216.43 Z" fill="${K.ink500}"/>` + X.L('M 191.4,219.6 A 13 13 0 0 1 199.4,211.5', 1.2, K.ink300);
  // floating blindfold ends + knot (droop: hanging down, death f0)
  const ribbonsS = (X, droop) => (droop ? Q.ribbon(X, [156, 124, 148, 142, 140, 160, 134, 180], 8, 7, 2, 2.4, 0.6) + Q.ribbon(X, [156, 131, 154, 150, 150, 168, 148, 188], 8, 6.6, 1.8, 2.4, 2.4)
    : Q.ribbon(X, [156, 124, 140, 114, 124, 126, 106, 118], 8, 7, 2, 3.4, 0.6) + Q.ribbon(X, [156, 131, 142, 139, 128, 136, 112, 142], 8, 6.6, 1.8, 3.4, 2.4)) +
    `<path d="${ell(157, 128, 6.6, 8)}" fill="${K.paper300}" ${X.O(1.8)}/>` + X.T([153, 122, 157, 120, 161, 123], 1.4, 'mid', K.ink500);

  B.parts.balance = function (X, o) {
    if (o.pose === 'death' && o.frame > 0) return Q.death(X, o);
    const g = X.game, ph = o.phase || 1, W = o.windup, En = o.enraged;
    const at = o.pose === 'attack', d0 = o.pose === 'death', A = Q.RIG.atk;   // d0: death f0 = the idle pose, hit
    const tilt = at ? A.tilt : W ? 13 : 0;
    const endL = rotP([PIV[0] - HALF, PIV[1]], PIV, tilt), endR = rotP([PIV[0] + HALF, PIV[1]], PIV, tilt);
    // death f0: the pans swing out about the beam ends
    const sw = d0 ? Q.RIG.d0.swing : [0, 0], drop = (e, a) => (a ? [e[0] - Math.sin((a * Math.PI) / 180) * DROP, e[1] + Math.cos((a * Math.PI) / 180) * DROP] : [e[0], e[1] + DROP]);
    const panL = drop(endL, sw[0]), panR = drop(endR, sw[1]);
    let back = '', fig = '', front = '', rims = '', over = '';
    // ---------------- holes (true transparency) ----------------
    const headD = Q.jag(Q.HEAD, 2.2, 5), panD = Q.jag(Q.panPts(panL[0], panL[1]), 1.4, 9);
    const stripD = Q.jag(Q.STRIP, 1.8, 13), sleeveD = Q.jag(Q.SLEEVE, 1.6, 17), swipeD = Q.jag(Q.SWIPE, 1.6, 19);
    let holes = [headD, panD, stripD, sleeveD, swipeD].join(' ');
    let chestD = '', biteD = '';
    if (ph >= 3) { chestD = Q.jag(Q.CHEST, 2, 21); biteD = Q.jag(Q.FARBITE, 1.4, 23); holes += ' ' + chestD + ' ' + biteD; }
    back += robeS(X, ph);
    // far arm (viewer-left): idle = open palm pressing DOWN (판결); windup = palm raised toward the player; attack = the palm
    // pressed lower and spread (the verdict)
    back += at ? farArmS(X, A.farS, A.farLit, A.palm)
      : W ? farArmS(X, 'M 132,196 C 116,208 100,220 84,228 L 100,254 C 114,244 132,232 150,214 Z', 'M 132,196 C 116,208 100,220 84,228 L 89,237 C 104,228 120,216 138,204 Z', [82, 226, -116, 8, 22, 4]) : farArmS(X, ...Q.FAR.idle);
    fig += hoodS(X, ph) + nearArmPostS(X);
    // ---------------- the BALANCE ----------------
    fig += beamS(X, tilt, ph, d0 ? pcrack(X, [[-16, -9], [-10, -3], [-15, 2], [-9, 7]]) : '');
    fig += chainsS(X, endR, panR) + inkPanS(X, panR, ph, En, d0 ? 'out' : 'open');
    // ---------------- torn-edge rims (masked to the body by the composer) ----------------
    rims += Q.rim(X, headD, 5.6) + Q.rim(X, panD, 4) + Q.rim(X, stripD, 4.2) + Q.rim(X, sleeveD, 4.2) + Q.rim(X, swipeD, 4) + (ph >= 3 ? Q.rim(X, chestD, 4.4) + Q.rim(X, biteD, 4) : '');
    if (ph >= 3) rims += beadS(X);
    // ---------------- OVER (not erased): blindfold ends, void-pan chains + rim + bowl outline ----------------
    over += ribbonsS(X, d0) + chainsS(X, endL, panL) + voidPanS(X, panL);
    if (En) [[148, 116, -0.4], [166, 128, -0.25], [230, 96, 0.25], [230, 120, 0.4], [96, 226, -0.3], [372, panR[1] - 8, 0.3]].forEach(([x, y, l], i) => { over += flame(X, x, y + 6, i < 4 ? 36 : 24, i < 4 ? 15 : 12, l, 30 + i); });
    if (W) front += exclaim(X, 201, 114, 1.2); // the '!' floats IN the head void
    if (at) {
      // trajectory arcs behind the beam ends (centre PIV, r 122): right 13° → −16°, left 193° → 164°, thick at the beam's
      // present end, tapering back along the swing (each ≈ 62 long ≤ 65). No floor FX under the pans.
      const arcP = (a) => [PIV[0] + A.arc * Math.cos((a * Math.PI) / 180), PIV[1] + A.arc * Math.sin((a * Math.PI) / 180)], ctl = (a) => [PIV[0] + (A.arc / Math.cos((14.5 * Math.PI) / 180)) * Math.cos((a * Math.PI) / 180), PIV[1] + (A.arc / Math.cos((14.5 * Math.PI) / 180)) * Math.sin((a * Math.PI) / 180)];
      [[-16, -1.5, 13], [164, 178.5, 193]].forEach(([a0, am, a1]) => { const p0 = arcP(a0), c = ctl(am), p1 = arcP(a1); front += X.T([p0[0], p0[1], c[0], c[1], p1[0], p1[1]], 3.6, 'start', K.ink); });
    }
    // enrage fill-silhouette: chain fans (the coral pulse rims the pans + beam, never every chain link)
    const fanTri = (e, p) => `M ${pt([e[0], e[1] + 4])} L ${pt([p[0] - 38, p[1] + 2])} L ${pt([p[0] + 38, p[1] + 2])} Z`;
    const solid = fanTri(endL, panL) + ' ' + fanTri(endR, panR);
    return { back, fig, holes, rims, over, front, solid };
  };

  // ---- death f1–f3 (f0 is the idle pose above) ----
  Q.death = function (X, o) {
    const g = X.game, fr = o.frame, ph = 3, tfs = B._.tfs, R = Q.RIG['d' + fr];
    let back = '', fig = '', front = '', rims = '', over = '', holes = '';
    if (fr === 1) {
      const S = B._.xf(R.sq), tS = tfs(R.sq), pv = S(PIV);
      // the body cut-outs follow the squash (the jag of the squashed key points)
      const cuts = [[Q.HEAD, 2.2, 5, 5.6], [Q.STRIP, 1.8, 13, 4.2], [Q.SLEEVE, 1.6, 17, 4.2], [Q.SWIPE, 1.6, 19, 4], [Q.CHEST, 2, 21, 4.4], [Q.FARBITE, 1.4, 23, 4]].map(([P, a, sd, w]) => [Q.jag(P.map(S), a, sd), w]);
      const panD = Q.jag(Q.panPts(R.panL[0], R.panL[1]), 1.4, 9);
      holes = cuts.map((c) => c[0]).join(' ') + ' ' + panD;
      back += `<g transform="${tS}">${robeS(X, ph)}${farArmS(X, ...Q.FAR.idle)}</g>`;
      fig += `<g transform="${tS}">${hoodS(X, ph)}${nearArmPostS(X)}</g>`;
      // the beam broken at the pivot: both halves droop 40° from the sunk pivot
      const ends = [-1, 1].map((s) => { const a = s < 0 ? 180 - R.droop : R.droop; return [pv[0] + HALF * Math.cos((a * Math.PI) / 180), pv[1] + HALF * Math.sin((a * Math.PI) / 180)]; });
      [-1, 1].forEach((s) => { fig += `<g transform="translate(${f(pv[0])},${f(pv[1])}) rotate(${s < 0 ? -R.droop : R.droop})">` + X.S(HALFBEAM(s), K.ink, 2.4, `<path d="M ${s * HALF},-9 L 0,-9 L 0,-3 L ${s * HALF},-3.6 Z" fill="${K.ink500}"/>`) + `</g>`; });
      fig += `<path d="${circ(pv[0], pv[1], 9)}" fill="${K.ink500}" ${X.O(1.8)}/>`;
      // the ink pan on the floor, tipped 24°: ink spills out of its lip onto the ground; its eye is out
      const P = R.panR, T = (p) => B._.rotP(p, P, R.tipR);
      fig += [[-34, -1], [34, -1], [4, -9]].map(([dx, dy], i) => { const q = T([P[0] + dx, P[1] + dy]); return chain(X, ends[1][0], ends[1][1] + 5, q[0], q[1], g ? 6 : 12, 6, g ? 0.8 : 0.55, i === 2 ? K.ink500 : K.ink300); }).join('');
      // (the tipped pans drop their P2 rim crack: turned on its side the zigzag reads as a letter W)
      fig += `<path d="M 352,346 C 368,340 392,346 398,356 C 392,364 360,366 340,362 Z" fill="${K.ink700}" ${X.O(1.6)}/>` + `<g transform="rotate(${R.tipR} ${P[0]} ${P[1]})">${inkPanS(X, P, 1, false, 'out', false)}</g>` + drip(X, 366, 342, 8, 4.4);
      rims += cuts.map(([d, w]) => Q.rim(X, d, w)).join('') + Q.rim(X, panD, 4) + `<g transform="${tS}">${beadS(X)}</g>`;
      // the void pan on the floor (still a hole) with slack chains; the blindfold ends hang from the sunk knot
      over += chainsS(X, ends[0], R.panL) + voidPanS(X, R.panL) + `<g transform="${tS}">${ribbonsS(X, true)}</g>`;
      return { back, fig, holes, rims, over, front };
    }
    if (fr === 2) {
      // the robe melted into a heap (top ≈ 245: the post stub); the void pan lies on its left slope and its hole is cut
      // through the heap (the floor shows, ch5 transparency rule); the ink pan (eye out) lies tipped on the right slope;
      // the beam halves lie in front; art: 3 manuscript scraps
      const M = B._.mound(X, [[58, 358], [76, 328], [104, 302], [140, 286], [180, 278], [220, 278], [256, 288], [284, 308], [302, 334], [310, 358]], 360,
        [[100, 318, 16, 4.6], [150, 292, 20, 5], [262, 296, 14, 4.4]]);
      back += X.S('M 236,300 L 246,300 L 245,254 L 241,246 L 238,253 L 235,244 Z', K.ink, 2, `<path d="M 234,300 L 238,300 L 237,250 L 234,250 Z" fill="${K.ink300}"/>`);
      fig += M.s;
      // the pan lies on the slope seen from above (rim 38 × 17), its hole 32 × 13 shows the floor through the heap
      const [vx, vy, va] = R.voidPan, V = (p) => B._.rotP(p, [vx, vy], va);
      const vHole = Q.jag(Array.from({ length: 14 }, (_, i) => V([vx + 32 * Math.cos((i / 14) * Math.PI * 2), vy + 13 * Math.sin((i / 14) * Math.PI * 2)])), 1.2, 31);
      holes = vHole;
      rims += Q.rim(X, vHole, 1.6);
      over += `<g transform="rotate(${va} ${vx} ${vy})"><path d="${ell(vx, vy, 38, 17)}" fill="none" stroke="${K.ink}" stroke-width="${f(g ? 4.6 : 3.4)}"/><path d="${ell(vx, vy, 38, 17)}" fill="none" stroke="${K.ink500}" stroke-width="${f(1.2 * X.li)}" stroke-dasharray="${g ? '10 4' : '14 3 4 3'}"/></g>`;
      fig += `<g transform="${tfs(R.inkPan[0])} translate(-276,-304)">${inkPanS(X, [276, 304], 1, false, 'out', false)}</g>`;
      fig += `<g transform="translate(72,352) rotate(-6)">${X.S(HALFBEAM(1), K.ink, 2.4, '')}</g>` + `<g transform="translate(318,360) rotate(4)">${X.S(HALFBEAM(-1), K.ink, 2.4, '')}</g>`;
      fig += B._.scrap(X, 40, 344, 11, -16, 10) + B._.scrap(X, 336, 344, 10, 20, 11) + B._.scrap(X, 196, 370, 8, 4, 12);
      return { back, fig, holes, rims, over, front };
    }
    // f3: puddle with the void pan's transparent hole (the floor shows through); the overturned ink pan with the eclipse
    // eye lying on top of it (×0.4) as a paper ✕; the two beam halves lying crossed at a shallow angle; the blindfold ends
    const P = B._.puddle(X, 192, 342, 132, 29, 5);
    fig += P.s;
    // the void pan lying in the puddle (rim 36 × 15): its hole 30 × 11 shows the floor through the ink
    const [vx, vy] = R.voidPan, vHole = Q.jag(Array.from({ length: 14 }, (_, i) => [vx + 30 * Math.cos((i / 14) * Math.PI * 2), vy + 11 * Math.sin((i / 14) * Math.PI * 2)]), 1, 37);
    holes = vHole;
    rims += Q.rim(X, vHole, 1.6);
    over += `<path d="${ell(vx, vy, 36, 15)}" fill="none" stroke="${K.ink}" stroke-width="${f(g ? 4.6 : 3.4)}"/><path d="${ell(vx, vy, 36, 15)}" fill="none" stroke="${K.ink500}" stroke-width="${f(1.2 * X.li)}" stroke-dasharray="${g ? '10 4' : '14 3 4 3'}"/>`;
    fig += `<g transform="translate(150,366) rotate(-5)">${X.S(HALFBEAM(1), K.ink, 2.4, `<path d="M 0,-9 L ${HALF},-9 L ${HALF},-3 L 0,-3.6 Z" fill="${K.ink500}"/>`)}</g>` +
      `<g transform="translate(286,364) rotate(8)">${X.S(HALFBEAM(-1), K.ink, 2.4, `<path d="M ${-HALF},-9 L 0,-9 L 0,-3 L ${-HALF},-3.6 Z" fill="${K.ink500}"/>`)}</g>`;
    const [ix, iy] = R.inkPan;
    fig += X.S(`M ${ix - 37},${iy} C ${ix - 30},${iy - 26} ${ix + 30},${iy - 26} ${ix + 37},${iy} Z`, K.ink, 2.4, `<path d="M ${ix - 40},${iy} C ${ix - 34},${iy - 18} ${ix - 18},${iy - 24} ${ix - 4},${iy - 24} L ${ix - 10},${iy - 16} C ${ix - 22},${iy - 14} ${ix - 30},${iy - 8} ${ix - 32},${iy} Z" fill="${K.ink500}"/>`) +
      `<path d="${ell(ix, iy, 37, 6)}" fill="${K.ink}" ${X.O(1.8)}/>`;
    fig += `<g transform="${tfs(R.relic)}">${Q.eye(X, g ? 11.5 : 10.5, false, 'dead', B._.inv(R.relic))}</g>`;
    over += Q.ribbon(X, [96, 330, 80, 334, 66, 330, 50, 336], 8, 7, 1.4, 1.6, 0.6);
    return { back, fig, holes, rims, over, front };
  };

  B.anchorsOf.balance = (o) => {
    const at = o.pose === 'attack';
    if (o.pose === 'idle' || at) {
      const tilt = at ? Q.RIG.atk.tilt : o.windup ? 13 : 0, eL = rotP([PIV[0] - HALF, PIV[1]], PIV, tilt), eR = rotP([PIV[0] + HALF, PIV[1]], PIV, tilt);
      return { face: [eR[0] - 6, eR[1] + DROP + 3], muzzle: [[eL[0], eL[1] + DROP], [eR[0], eR[1] + DROP]], pans: { void: [eL[0], eL[1] + DROP], ink: [eR[0], eR[1] + DROP] }, beamPivot: PIV.slice(), beamEnds: [eL, eR], voidHead: [201, 116], head: [201, 112] };
    }
    // K3-2 death frames from the same rig. face = the out eye (f3: the relic's ✕); head = top of what is left + 10 above
    const r2 = (p) => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100], hd = (p) => [p[0], Math.round((p[1] - 10) * 100) / 100];
    const fr = o.frame;
    if (fr === 0) {
      const sw = Q.RIG.d0.swing, eL = [PIV[0] - HALF, PIV[1]], eR = [PIV[0] + HALF, PIV[1]];
      const pL = r2([eL[0] - Math.sin((sw[0] * Math.PI) / 180) * DROP, eL[1] + Math.cos((sw[0] * Math.PI) / 180) * DROP]), pR = r2([eR[0] - Math.sin((sw[1] * Math.PI) / 180) * DROP, eR[1] + Math.cos((sw[1] * Math.PI) / 180) * DROP]);
      return { face: [pR[0] - 6, pR[1] + 3], muzzle: [pL, pR], pans: { void: pL, ink: pR }, beamPivot: PIV.slice(), beamEnds: [eL, eR], voidHead: [201, 116], head: hd([240, 10]) };
    }
    const R = Q.RIG['d' + fr];
    if (fr === 1) {
      const S = B._.xf(R.sq), pv = S(PIV), ends = [180 - R.droop, R.droop].map((a) => r2([pv[0] + HALF * Math.cos((a * Math.PI) / 180), pv[1] + HALF * Math.sin((a * Math.PI) / 180)]));
      const eye = r2(rotP([R.panR[0] - 6, R.panR[1] + 3], R.panR, R.tipR));
      return { face: eye, muzzle: [R.panL.slice(), R.panR.slice()], pans: { void: R.panL.slice(), ink: R.panR.slice() }, beamPivot: pv, beamEnds: ends, voidHead: S([201, 116]), head: hd([pv[0], pv[1] - 9]) };
    }
    if (fr === 2) {
      const T = B._.xf([...R.inkPan[0], ['translate', -276, -304]]), eye = T([270, 307]);
      return { face: eye, muzzle: [R.voidPan.slice(0, 2), T([276, 304])], pans: { void: R.voidPan.slice(0, 2), ink: T([276, 304]) }, beamPivot: [240, 300], beamEnds: [[72, 352], [318, 360]], voidHead: [196, 300], head: hd([240, 244]) };
    }
    const Rl = B._.xf(R.relic);
    return { face: Rl([0, 0]), muzzle: [R.voidPan.slice(), R.inkPan.slice()], pans: { void: R.voidPan.slice(), ink: R.inkPan.slice() }, beamPivot: [218, 365], beamEnds: [[150, 366], [286, 364]], voidHead: [192, 342], head: hd(Rl([0, -11.5])) };
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
    // K3-2: pose ('idle' | 'attack' | 'death') and frame (death 0..3) are normalised here; idle output is unchanged
    const o = B._.norm(Object.assign({ phase: 1, windup: false, enraged: false, detail: 'art', halo: undefined, mono: false, spin: 0, shadow: true, hitbox: false }, opts));
    const part = B.parts[id];
    if (!part) return `<g><!-- PN.bossesB: unknown id ${id} --></g>`;
    const X = ctx(o);
    const ground = typeof o.halo === 'string' ? o.halo : K[CH[id]].base;
    const R = part(X, o);
    // death frames hold no paper.50 except the relic's ✕ (f3): anything left dims to paper.300. The ✕ spells paper.50 in
    // lower case, which this case-sensitive swap leaves alone (bakes map colours case-insensitively). The paper.100 phase
    // cracks (pcrack strokes) dim with them, as the paper.50 cracks of PN.bossesA do; paper.100 fills (the empress's face
    // glass) stay.
    if (o.pose === 'death') ['under', 'back', 'fig', 'rims', 'over', 'front'].forEach((k) => { if (R[k]) R[k] = R[k].split(K.paper50).join(K.paper300).split(`stroke="${K.paper}"`).join(`stroke="${K.paper300}"`); });
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
    const o = B._.norm(Object.assign({ phase: 1, windup: false }, opts));
    const base = { pivot: BOX.pivot.slice(), feet: BOX.feet.slice(), r: BOX.r, shadow: Object.assign({}, BOX.shadow), head: [192, 18] };
    const A = (B.anchorsOf[id] || (() => ({})))(o);
    return Object.assign(base, A);
  }
  B.CH = CH;
  B.draw = draw;
  B.anchors = anchors;
  B.ids = ['empress', 'herald', 'balance'];
})(window.PN);
