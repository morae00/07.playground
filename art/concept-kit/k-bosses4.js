// =====================================================================
// k-bosses4.js — PN.fieldBosses · 필드 보스 5종 (지움의 다섯 직분, 로어 §3.2~3.3 · §4.1)
//   'commander'   균열 장교   (field-shock · Ch1 · shock)
//   'reliquary'   백환 관리자 (field-rings · Ch2 · rings)
//   'architect'   덫 설계자   (field-trap  · Ch3 · traps)
//   'executioner' 초침 집행관 (field-clock · Ch4 · clock)
//   'judge'       무음 심판관 (field-null  · Ch5 · null)
// LOCAL BOX 384 x 384 (bossesB와 같다). PIVOT (192,252) = 판정 원 중심, r 76 로컬 (게임 r38 × 2).
// FEET (192,328) = pivot + r = 굽기 앵커. 킷 그림자 (192,294) rx76 ry32 (시트용, 굽기는 끈다).
// Display: scale 0.5 → 키 100~110px. 오른쪽을 본다(3/4, yaw 30°). 반전은 호출부가 한다. 몸은 자전하지 않는다.
// 얼굴판은 plane()/wrap()으로 좌표를 계산해 그리고, 거친 먹선 필터 밖의 `face` 층에 둔다(지시서 §1.1, §2).
// Requires lib.js (PN.taper, PN.rng). bossesB 도우미는 이 파일에 복사했다(로드 순서와 무관).
// Every call returns <g class="kb4 kb4-{id}"> with its own <defs>; ids carry the per-call prefix kb4_{n}_.
// =====================================================================
window.PN = window.PN || {};
(function (PN) {
  const K = {
    ink: '#0E0E10', ink700: '#2B2926', ink500: '#46423D', ink300: '#8C8579',
    paper50: '#FAF6EC', paper: '#F3EEE2', paper300: '#D8D0C0', voidPaper: '#E2DBCB', warn: '#D88D16',
    ch1: { light: '#D4CAB4', base: '#B8AC93', deep: '#8F836C', spot: '#7E6A4E' },
    ch2: { light: '#C8CACF', base: '#ABADB4', deep: '#878A93', spot: '#566077' },
    ch3: { light: '#C9CEC4', base: '#ADB4AA', deep: '#8A9288', spot: '#56625C' },
    ch4: { light: '#D5CAB2', base: '#BBAE94', deep: '#978A70', spot: '#7C6644' },
    ch5: { light: '#C8C3C9', base: '#ABA5AC', deep: '#8A848C', spot: '#3E3747' }
  };
  const BOX = { w: 384, h: 384, pivot: [192, 252], feet: [192, 328], r: 76, shadow: { cx: 192, cy: 294, rx: 76, ry: 32 }, gameScale: 0.5 };
  const D2R = Math.PI / 180;
  const f = (n) => Math.round(n * 100) / 100;
  const pt = (p) => f(p[0]) + ',' + f(p[1]);
  let UID = 0;

  // ---------- per-call drawing context (bossesB ctx, prefix kb4_) ----------
  // outline: X.O(v) paints a stroke 2·v·lw under the fill → visible v·lw. Body default v 2.8 → game 7u (3.5px@1x), art 2.8u.
  function ctx(o) {
    const id = 'kb4_' + (UID++) + '_';
    const game = o.detail === 'game';
    const lw = game ? 2.5 : 1, li = game ? 1.8 : 1, pitch = game ? 6 : 4.4;
    const defs = [];
    let n = 0;
    const X = { id, game, lw, li, pitch, o, defs, K };
    X.uid = (p = 'u') => id + p + (n++);
    const dot = (name, col, cov) => {
      const r = pitch * Math.sqrt(cov / Math.PI);
      defs.push(`<pattern id="${id}${name}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="${f(pitch / 2)}" cy="${f(pitch / 2)}" r="${f(r)}" fill="${col}"/></pattern>`);
    };
    dot('d20', K.ink, 0.2); dot('d40', K.ink, 0.4); dot('d60', K.ink, 0.6);
    X.pat = (name) => `url(#${id}${name})`;
    X.clip = (d) => { const c = X.uid('c'); defs.push(`<clipPath id="${c}"><path d="${d}"/></clipPath>`); return c; };
    X.O = (v = 2.8) => `stroke="${K.ink}" stroke-width="${f(v * 2 * lw)}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"`;
    X.P = (d, fill, v = 2.8, extra = '') => `<path d="${d}" fill="${fill}" ${X.O(v)} ${extra}/>`;
    X.S = (d, fill, v, inner) => { if (!inner) return X.P(d, fill, v); const c = X.clip(d); return `${X.P(d, fill, v)}<g clip-path="url(#${c})">${inner}</g>`; };
    X.SS = (d, fill, v, inner, sep = K.ink500) => X.S(d, fill, v, inner) + `<path d="${d}" fill="none" stroke="${sep}" stroke-width="${f(1.3 * li)}" stroke-linejoin="round"/>`;
    X.L = (d, w, col = K.ink, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w * li)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
    // fixed-width line (face layer: widths are designed per detail, not multiplied)
    X.Lf = (d, w, col = K.ink, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
    X.T = (p, w, mode = 'mid', fill = K.ink, extra = '') => PN.taper(p, w * li, mode, fill, extra);
    X.Tf = (p, w, mode = 'mid', fill = K.ink, extra = '') => PN.taper(p, w, mode, fill, extra);
    X.art = (s) => (game ? '' : s);
    X.gameOnly = (s) => (game ? s : '');
    X.g = (a, b) => (game ? b : a);
    return X;
  }

  // ---------- geometry helpers ----------
  const circ = (cx, cy, r) => `M ${f(cx + r)},${f(cy)} A ${f(r)} ${f(r)} 0 1 0 ${f(cx - r)},${f(cy)} A ${f(r)} ${f(r)} 0 1 0 ${f(cx + r)},${f(cy)} Z`;
  const ell = (cx, cy, rx, ry) => `M ${f(cx + rx)},${f(cy)} A ${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)},${f(cy)} A ${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)},${f(cy)} Z`;
  const poly = (pts, close = true) => 'M ' + pts.map(pt).join(' L ') + (close ? ' Z' : '');
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
  // runs of smooth points joined by deliberate corners (designed hard-edged blacks)
  const runs = (R, close = true) => R.map((P, i) => (i ? smooth(P).replace(/^M \S+/, '') : smooth(P))).join('') + (close ? ' Z' : '');
  const rotP = (p, c, deg) => { const a = deg * D2R, dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)]; };
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
  const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
  const nrm = (u) => [-u[1], u[0]];
  // rigid pose transform: rotate r° about c, then translate (dx,dy). Same in SVG (tfA) and in JS (tfP) → anchors match.
  const T0 = { r: 0, c: [192, 328], dx: 0, dy: 0 };
  const tfP = (p, T) => (T ? add(rotP(p, T.c, T.r || 0), [T.dx || 0, T.dy || 0]) : p);
  const tfA = (T) => (T && (T.r || T.dx || T.dy) ? `transform="translate(${f(T.dx || 0)} ${f(T.dy || 0)}) rotate(${f(T.r || 0)} ${f(T.c[0])} ${f(T.c[1])})"` : '');
  const tg = (T, s) => (s && T && (T.r || T.dx || T.dy) ? `<g ${tfA(T)}>${s}</g>` : s);
  // tube along a polyline with half-widths W (limbs, sleeves, shafts). caps: round ends
  function tube(P, W, caps = true) {
    const n = P.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const u = unit(P[Math.max(0, i - 1)], P[Math.min(n - 1, i + 1)]), m = nrm(u), w = W[Math.min(i, W.length - 1)];
      L.push(add(P[i], m, w)); R.push(add(P[i], m, -w));
    }
    const we = W[Math.min(n - 1, W.length - 1)], w0 = W[0];
    const sideL = n > 2 ? smooth(L) : poly(L, false), sideR = n > 2 ? smooth(R.slice().reverse()) : poly(R.slice().reverse(), false);
    return sideL + (caps ? ` A ${f(we)} ${f(we)} 0 0 0 ${pt(R[n - 1])}` : ` L ${pt(R[n - 1])}`) + sideR.replace(/^M \S+/, '') + (caps ? ` A ${f(w0)} ${f(w0)} 0 0 0 ${pt(L[0])}` : '') + ' Z';
  }
  // scissor / torn edge: jittered midpoints between key points (closed)
  function jag(pts, amp, seed, step = 9) {
    const r = PN.rng(seed), out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      out.push(a);
      const k = Math.max(1, Math.round(L / step));
      for (let j = 1; j <= k; j++) { const t = j / (k + 1), q = (r() - 0.5) * 2 * amp; out.push([a[0] + dx * t + nx * q, a[1] + dy * t + ny * q]); }
    }
    return 'M ' + out.map(pt).join(' L ') + ' Z';
  }
  // zigzag edge points from a to b (n teeth, amplitude amp, alternating)
  function zig(a, b, n, amp) {
    const u = unit(a, b), m = nrm(u), out = [];
    for (let i = 0; i <= n; i++) { const p = lerp(a, b, i / n); out.push(i % 2 ? add(p, m, amp) : p); }
    return out;
  }

  // ---------- the one-view face system (지시서 §2.3) ----------
  // flat plate (dial, lens, window). Design coords (u,v), radius 50. c = centre, R = real radius, tilt clockwise +.
  // persp: weak perspective so the far side of a turned plate is narrower (d x/du = 1 − 2·persp·u/50: near edge ×1.2,
  // far edge ×0.8 at 0.1). The outline keeps its extents (u = ±50 map as in the brief's formula); far features crowd.
  function plane(c, R, { yaw = 30, tilt = 0, squash = 0.97, persp = 0.1 } = {}) {
    const k = R / 50, sx = Math.cos(yaw * D2R), a = tilt * D2R;
    const m = (u, v) => { const x = (u - (persp * (u * u - 2500)) / 50) * k * sx, y = v * k * squash; return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)]; };
    m.k = k; m.c = c; m.R = R; m.yaw = yaw; m.tilt = tilt;
    m.du = (u) => 1 - (2 * persp * u) / 50; // local width factor at u (× k·cos yaw)
    // plate thickness: the back rim is the front rim pushed LEFT by t·sin(yaw) (right-turned plate shows its left edge only)
    m.back = (t) => { const s = -t * Math.sin(yaw * D2R); return [s * Math.cos(a), s * Math.sin(a)]; };
    return m;
  }
  // points of an ellipse in plate design coords (cu,cv) radii (ru,rv), from angle a0 to a1 (deg, 0 = +u, clockwise)
  const pRing = (P, cu, cv, ru, rv, n = 28, a0 = 0, a1 = 360) => { const out = []; for (let i = 0; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * D2R; out.push(P(cu + ru * Math.cos(a), cv + rv * Math.sin(a))); } if (a1 - a0 >= 360) out.pop(); return out; };
  const pEll = (P, cu, cv, ru, rv = ru, n = 28) => smooth(pRing(P, cu, cv, ru, rv, n), true);
  const pPoly = (P, uv, close = true) => poly(uv.map((q) => P(q[0], q[1])), close);
  const pSmooth = (P, uv, close = false) => smooth(uv.map((q) => P(q[0], q[1])), close);
  // mask wrapped round the head: vertical cylinder. phi = angle from the face midline (far side +), h = height (down +).
  function wrap(c, rho, { yaw = 30, look = 0.07 } = {}) {
    const W = (phi, h) => { const a = (phi + yaw) * D2R; return { p: [c[0] + rho * Math.sin(a), c[1] + h + look * rho * Math.cos(a)], k: Math.cos(a) }; };
    W.p = (phi, h) => W(phi, h).p;
    W.k = (phi) => Math.cos((phi + yaw) * D2R);
    // a decal placed on the cylinder at (phi0,h0): local (du,dv) in units → point. Foreshortens with the turn.
    W.at = (phi0, h0) => (du, dv) => W.p(phi0 + (du / rho) / D2R, h0 + dv);
    W.c = c; W.rho = rho; W.yaw = yaw;
    return W;
  }
  const dRing = (M, r1, r2 = r1, n = 24) => { const out = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; out.push(M(r1 * Math.cos(a), r2 * Math.sin(a))); } return smooth(out, true); };

  // ---------- shared ink vocabulary ----------
  // enemy ink drip (flows DOWN = hostile, bible §6-7). Clamped so the drop never hangs below the ground line
  // (floor 331 by default; puddle drips pass a lower floor) — the feet must read as standing on y 328.
  function drip(X, x, y, len, w = 5, floor = 331) {
    let w2 = w * X.li * (X.game ? 0.8 : 1);
    if (y + len + 2.6 * w2 > floor) { len = Math.max(2.5, floor - y - 2.6 * w2); if (y + len + 2.6 * w2 > floor) w2 = Math.max(2.4, (floor - y - len) / 2.6); }
    if (y + 2.5 + 2.6 * w2 > floor + 1) return '';
    return `<path d="M ${f(x - w2 / 2)},${f(y)} C ${f(x - w2 / 2)},${f(y + len * 0.5)} ${f(x - w2 * 0.2)},${f(y + len * 0.7)} ${f(x)},${f(y + len)} C ${f(x + w2 * 0.2)},${f(y + len * 0.7)} ${f(x + w2 / 2)},${f(y + len * 0.5)} ${f(x + w2 / 2)},${f(y)} Z" fill="${K.ink}"/>` +
      `<path d="M ${f(x)},${f(y + len + w2 * 0.9)} q ${f(-w2 * 0.8)},${f(w2 * 1.3)} 0,${f(w2 * 1.7)} q ${f(w2 * 0.8)},${f(-w2 * 0.4)} 0,${f(-w2 * 1.7)} Z" fill="${K.ink}"/>`;
  }
  // P2 PHASE crack (bible §10.2-4): bold paper zigzag ≥3px@1x in game (6.4u) with an ink shoulder (= bossesB pcrack)
  function pcrack(X, pts, branch) {
    const pw = X.game ? 6.4 : 3.4, iw = pw + (X.game ? 4.6 : 3);
    const line = (P, k = 1) => { const d = 'M ' + P.map(pt).join(' L '); return `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="${f(iw * k)}" stroke-linejoin="miter" stroke-miterlimit="6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${K.paper}" stroke-width="${f(pw * k)}" stroke-linejoin="miter" stroke-miterlimit="6" stroke-linecap="round"/>`; };
    return line(pts) + (branch ? line(branch, 0.62) : '');
  }
  // thin paper crack (death damage on a face plate): paper line with an ink shoulder, fixed widths
  function fcrack(X, pts, w) {
    const d = 'M ' + pts.map(pt).join(' L ');
    return X.Lf(d, w + (X.game ? 2.6 : 1.6), K.ink) + X.Lf(d, w, K.paper50);
  }
  // ink crack on plaster / ground: forks and bends, tapering from its root (never parallel bundles, bible §6-5)
  function inkCrack(X, pts, w, col = K.ink, fork) {
    let s = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], k = 1 - i / pts.length;
      s += X.Tf([a[0], a[1], (a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.08, (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.08, b[0], b[1]], w * (0.55 + 0.45 * k), 'flat', col);
    }
    if (fork) s += inkCrack(X, fork, w * 0.7, col);
    return s;
  }
  // amber windup '!' (sandwich: ink + warn + paper core) = bossesB exclaim without its invisible hit diamond
  function exclaim(X, x, y, s = 1) {
    const k = s * (X.game ? 1.25 : 1);
    const bar = `M ${f(x - 6 * k)},${f(y - 17 * k)} L ${f(x + 6 * k)},${f(y - 17 * k)} L ${f(x + 3 * k)},${f(y + 6 * k)} L ${f(x - 3 * k)},${f(y + 6 * k)} Z`;
    const O = `stroke="${K.ink}" stroke-width="${f(4.4 * k)}" stroke-linejoin="round" paint-order="stroke"`;
    return `<g><path d="${bar}" fill="${K.warn}" ${O}/><path d="${circ(x, y + 13.5 * k, 4.4 * k)}" fill="${K.warn}" ${O}/>` +
      `<path d="M ${f(x - 1.6 * k)},${f(y - 13 * k)} L ${f(x - 0.6 * k)},${f(y + 1 * k)}" stroke="${K.paper50}" stroke-width="${f(1.8 * k)}" stroke-linecap="round"/></g>`;
  }
  // dry-brush highlight (비백): n hair strokes across width w along bezier p (game: one tapered stroke)
  function dry(X, p, w, n = 4, col = K.ink300, seed = 3, mode = 'mid') {
    if (X.game) return X.T(p, w * 0.45, mode, col);
    const r = PN.rng(seed * 131 + 7);
    const cubic = p.length === 8, a = [p[0], p[1]], b = cubic ? [p[6], p[7]] : [p[4], p[5]];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    let o = '';
    for (let i = 0; i < n; i++) {
      const off = (i / Math.max(1, n - 1) - 0.5) * w, t0 = r() * 0.22, t1 = 1 - r() * 0.3;
      const q = p.map((v, k) => v + (k % 2 ? ny : nx) * off);
      const P0 = [q[0] + (q[2] - q[0]) * t0 * 2, q[1] + (q[3] - q[1]) * t0 * 2];
      const E = cubic ? [q[6] + (q[4] - q[6]) * (1 - t1) * 2, q[7] + (q[5] - q[7]) * (1 - t1) * 2] : [q[4] + (q[2] - q[4]) * (1 - t1) * 2, q[5] + (q[3] - q[5]) * (1 - t1) * 2];
      const qq = cubic ? [P0[0], P0[1], q[2], q[3], q[4], q[5], E[0], E[1]] : [P0[0], P0[1], q[2], q[3], E[0], E[1]];
      o += PN.taper(qq, (w / n) * (0.55 + r() * 0.5), mode, col);
    }
    return o;
  }
  // brush head (teardrop) at p moving along angle a (rad): "붓이 그려 나가는 예고"
  function brushHead(X, x, y, a, s = 1) {
    const k = s * (X.game ? 1.3 : 1);
    return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(a / D2R)}) scale(${f(k)})"><path d="M 7,0 C 3,-5 -6,-5 -10,0 C -6,5 3,5 7,0 Z" fill="${K.ink}"/>` +
      (X.game ? '' : `<path d="M 4,-1 C 1,-2.6 -3,-2.4 -5,-1" fill="none" stroke="${K.paper50}" stroke-width="1" opacity="0.8"/>`) + `</g>`;
  }
  // ground-plane ellipse arc (ground squash 0.42): centre c, radius r, from a0 to a1 (deg)
  const gArc = (c, r, a0, a1, sq = 0.42) => { const p = (a) => [c[0] + r * Math.cos(a * D2R), c[1] + r * sq * Math.sin(a * D2R)], s = p(a0), e = p(a1); return `M ${pt(s)} A ${f(r)} ${f(r * sq)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${pt(e)}`; };
  // speed line wedge from a toward b (thin end at b)
  const speed = (X, a, b, w) => X.T([a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, b[0], b[1]], w, 'start', K.ink);

  // collapsed ink heap (death 2): lumpy mound standing on y 328, slumped toward +x. h = height above the ground.
  function heap(X, { cx = 192, w = 150, h = 86, lean = 14, seed = 5 } = {}) {
    const r = PN.rng(seed * 53 + 11), y0 = 328, x0 = cx - w / 2, x1 = cx + w / 2;
    const top = [cx + lean, y0 - h];
    const P = [[x0, y0], [x0 + w * 0.06, y0 - h * 0.34], [x0 + w * 0.2, y0 - h * 0.62], [cx - w * 0.12 + lean * 0.4, y0 - h * 0.9], top,
      [cx + w * 0.2 + lean, y0 - h * 0.82], [x1 - w * 0.12, y0 - h * 0.5], [x1 - w * 0.02, y0 - h * 0.2], [x1, y0]]
      .map((p, i) => (i && i < 8 ? [p[0] + (r() - 0.5) * 6, p[1] + (r() - 0.5) * 5] : p));
    const d = smooth(P) + ` C ${f(x1 - w * 0.2)},${f(y0 + 9)} ${f(x0 + w * 0.2)},${f(y0 + 9)} ${f(x0)},${f(y0)} Z`;
    const lit = `<path d="M ${f(x0 - 4)},${f(y0)} C ${f(x0 + w * 0.02)},${f(y0 - h * 0.5)} ${f(cx - w * 0.2)},${f(y0 - h - 6)} ${f(cx + lean * 0.6)},${f(y0 - h - 6)} L ${f(cx - w * 0.04)},${f(y0 - h * 0.72)} L ${f(cx - w * 0.16)},${f(y0 - h * 0.66)} L ${f(x0 + w * 0.16)},${f(y0 - h * 0.28)} L ${f(x0 + w * 0.08)},${f(y0)} Z" fill="${K.ink500}"/>`;
    return { d, s: X.S(d, K.ink, 2.8, lit + dry(X, [x0 + w * 0.08, y0 - h * 0.36, cx - w * 0.2, y0 - h * 0.95, cx + lean * 0.4, y0 - h - 1], 3, 3, K.ink300, seed)), top };
  }
  // ink puddle (death 3): centre (192,328), rx ~100, ry ~42. Flat ground plane; ink500 sheen crescent + paper glints.
  function puddle(X, { rx = 100, ry = 42, seed = 7, glints = 3 } = {}) {
    const r = PN.rng(seed * 71 + 3), c = [192, 328], pts = [];
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, k = 1 + (r() - 0.5) * 0.12 + (i % 5 === 2 ? 0.07 : 0); pts.push([c[0] + Math.cos(a) * rx * k, c[1] + Math.sin(a) * ry * k]); }
    const d = smooth(pts, true);
    let s = X.S(d, K.ink, 2.4, `<path d="M ${f(c[0] - rx * 0.86)},${f(c[1] - ry * 0.1)} C ${f(c[0] - rx * 0.7)},${f(c[1] - ry * 0.8)} ${f(c[0] - rx * 0.1)},${f(c[1] - ry * 0.92)} ${f(c[0] + rx * 0.3)},${f(c[1] - ry * 0.7)} C ${f(c[0] - rx * 0.1)},${f(c[1] - ry * 0.62)} ${f(c[0] - rx * 0.6)},${f(c[1] - ry * 0.48)} ${f(c[0] - rx * 0.86)},${f(c[1] - ry * 0.1)} Z" fill="${K.ink500}"/>`);
    // satellite drops
    [[-1.08, 0.5, 5], [0.98, 0.62, 4], [1.1, -0.3, 3.4]].forEach(([u, v, rr]) => { s += `<path d="${ell(c[0] + u * rx, c[1] + v * ry, rr * 1.4, rr * 0.7)}" fill="${K.ink}"/>`; });
    const G = [[-0.46, -0.5, 9], [0.22, -0.56, 6], [-0.1, -0.36, 4]].slice(0, glints);
    G.forEach(([u, v, L]) => { s += X.T([c[0] + u * rx - L / 2, c[1] + v * ry, c[0] + u * rx, c[1] + v * ry - 0.8, c[0] + u * rx + L / 2, c[1] + v * ry], X.g(1.6, 2.4), 'mid', K.paper50); });
    return s;
  }

  const F = (PN.fieldBosses = { K, BOX, parts: {}, anchorsOf: {}, META: {} });
  F._ = { ctx, circ, ell, poly, smooth, runs, rotP, lerp, add, unit, nrm, T0, tfP, tfA, tg, tube, jag, zig, plane, pRing, pEll, pPoly, pSmooth, wrap, dRing, drip, pcrack, fcrack, inkCrack, exclaim, dry, brushHead, gArc, speed, heap, puddle, f, pt, D2R };
})(window.PN);
// ==== BOSSES (inserted above the composer) ====
// ---------- 균열 장교 (commander · Ch1 · shock) — part 1/2: head, cap, face, sword, coat pieces ----------
// 꼿꼿한 회벽 외투 기둥 + 위가 넓고 평평한 장교모(가까운 쪽 챙이 깨짐) + 뒤로 내린 금 간 군도. 금은 모두 땅(칼끝)에서 위로 번진다.
// Face: wrap(204,166) ρ20 yaw30. 먼 쪽 절반 = 회벽 가면 껍질(paper300), 가까운 절반 = 떨어져 나간 먹, 그 속에 흰 슬릿 눈 하나.
(function (PN) {
  const F = PN.fieldBosses, K = F.K, { circ, ell, poly, smooth, runs, rotP, lerp, add, unit, nrm, tube, wrap, drip, fcrack, inkCrack, dry, f, pt, D2R } = F._;
  const C = (F._cmd = {});
  const C1 = K.ch1.deep;
  C.HC = [204, 166]; C.RHO = 20; C.HIP = [200, 262];
  // the cap band looks down at the same ≈10° as the crown oval and the visor (look 0.17); the face keeps the brief's 0.07
  const W = wrap(C.HC, C.RHO), WB = wrap(C.HC, C.RHO + 1.6, { look: 0.17 });
  C.W = W;
  // head silhouette (near temple → jaw → chin → far cheek → far temple); its top hides under the cap band
  C.HEAD_PTS = [[184.6, 145], [183.8, 157], [184.6, 168], [187.6, 178], [195, 185.4], [205, 188.6], [214, 189.2], [219.6, 183.6], [222.2, 176.4], [222.6, 171.2], [224.8, 164.6], [224.6, 153], [222.6, 145]];
  C.HEAD = smooth(C.HEAD_PTS, true);
  // broken edge of the plaster shell, forehead (phi −8) → chin (phi +4), toothed; the nose bump stays on the shell
  const EDGE = [[-8, -18.5], [-5.4, -14.6], [-7.2, -11.4], [-3.6, -8.2], [-4.8, -5.6], [-2.2, -2.6], [-5.6, 0.6], [-7.8, 4], [-5.2, 7], [-6.8, 9.6], [-1.4, 12.2], [-3, 15], [1.8, 17.4], [4, 20.6]];
  const FAR = [[224.6, 153], [224.8, 164.6], [222.6, 171.2], [222.2, 176.4], [219.6, 183.6], [214.6, 188.8]];
  C.edgePts = () => EDGE.map(([p, h]) => W.p(p, h));
  // shell outline: under the band (wrap arc) → far contour (same points as the head) → back up the toothed broken edge
  C.maskTop = () => { const top = []; for (let p = -8; p <= 58; p += 6) top.push(W.p(p, -18.5)); return [...top, ...FAR]; };

  // ---- officer cap (drawn in `top`: it sits in front of the face plate). opt.noBrim drops the visor; opt.p2 bites the crown ----
  C.cap = function (X, opt = {}) {
    const g = X.game;
    // wide flat crown (the front rises: top oval tilted −7°) perched on a narrow band; the crown overhangs the band
    const top = [208, 127.5], rx = 32, ry = 8.4, th = -7 * D2R;
    const E = (t) => [top[0] + rx * Math.cos(t) * Math.cos(th) - ry * Math.sin(t) * Math.sin(th), top[1] + rx * Math.cos(t) * Math.sin(th) + ry * Math.sin(t) * Math.cos(th)];
    const front = [], rim = [];
    for (let i = 0; i <= 16; i++) front.push(E(Math.PI - (Math.PI * i) / 16));
    // phase 2 mark: the crown's far-back corner has fallen off → the oval's rim bites inward there
    for (let i = 0; i < 32; i++) { const q = E((Math.PI * 2 * i) / 32); rim.push(opt.p2 && i >= 26 && i <= 30 ? lerp(q, top, i % 2 ? 0.5 : 0.36) : q); }
    const bandT = [], bandB = [];
    for (let p = -120; p <= 60; p += 10) { bandT.push(WB.p(p, -26)); bandB.push(WB.p(p, -18.6)); }
    const L0 = bandT[0], R0 = bandT[bandT.length - 1];
    // crown side wall: the oval's front arc → band top (one turn; the arcs bow down)
    const wall = smooth(front) + ` L ${pt(R0)} ` + smooth(bandT.slice().reverse()).replace(/^M \S+/, '') + ' Z';
    let s = X.S(wall, K.ink, 2.8, `<path d="${poly([add(front[0], [-4, -2]), add(front[5], [0, -1]), add(front[5], [-3, 5]), add(L0, [10, -2]), add(L0, [-6, 2])])}" fill="${K.ink500}"/>`);
    // crown top: ink700 oval, ink500 lit crescent upper-left
    const crown = smooth(rim, true);
    s += X.S(crown, K.ink700, 2.2, `<path d="M ${pt(add(E(Math.PI), [-3, 2]))} C ${pt(add(E(Math.PI * 1.25), [-2, -3]))} ${pt(add(E(Math.PI * 1.6), [0, -4]))} ${pt(add(E(Math.PI * 1.72), [0, -3]))} C ${pt(add(E(Math.PI * 1.6), [0, 3]))} ${pt(add(E(Math.PI * 1.25), [3, 3]))} ${pt(add(E(Math.PI), [-3, 2]))} Z" fill="${K.ink500}"/>` +
      X.art(X.T([...add(E(Math.PI * 1.1), [3, 0]), ...add(E(Math.PI * 1.32), [3, 2.4]), ...add(E(Math.PI * 1.55), [0, 3])], 1.2, 'mid', K.ink300)));
    // band (ink700) following the wrap: the arc bows DOWN (one turn, seen from 10° above)
    const band = smooth(bandT) + ` L ${pt(bandB[bandB.length - 1])} ` + smooth(bandB.slice().reverse()).replace(/^M \S+/, '') + ' Z';
    s += X.S(band, K.ink700, 2, X.art(X.L(smooth(bandT.slice(2, 10).map((q) => [q[0], q[1] + 2.6])), 0.9, K.ink500)));
    // remaining visor: FAR half only, juts front-right; the broken end is toothed (the near half is gone)
    if (!opt.noBrim) {
      const vo = [], vi = [];
      for (let p = -4; p <= 66; p += 7) { const a = (p + 30) * D2R; vo.push([C.HC[0] + (C.RHO + 14) * Math.sin(a), 148.4 + 0.24 * (C.RHO + 14) * Math.cos(a) + 1.2]); vi.push(WB.p(p, -18.4)); }
      const brk = [vo[0], [vo[0][0] - 2.4, vo[0][1] - 2.6], [vo[0][0] + 1.6, vo[0][1] - 3.6], [vi[0][0] - 1.8, vi[0][1] + 2], vi[0]];
      const visor = 'M ' + vi.map(pt).join(' L ') + ' L ' + vo.slice().reverse().map(pt).join(' L ') + ' L ' + brk.slice(1).map(pt).join(' L ') + ' Z';
      s += X.S(visor, K.ink, 2.2, `<path d="M ${pt(vi[0])} L ${pt(vi[vi.length - 1])} L ${pt(add(vi[vi.length - 1], [0, 2.6]))} L ${pt(add(vi[0], [0, 3]))} Z" fill="${K.ink700}"/>` + X.art(X.L('M ' + vo.slice(2, 8).map((q) => pt([q[0] - 1.2, q[1] - 1.4])).join(' L '), 0.8, K.ink500)));
    }
    return s;
  };

  // ---- face plate: plaster shell on the far half + white slit eye in the fallen (ink) near half. Face layer, crisp. ----
  // one shadow mass (visor's diagonal shadow over the far brow + far eye, wrapping down the far cheek) + one accent (nose wedge)
  C.face = function (X, opt = {}) {
    const g = X.game;
    const mask = smooth(C.maskTop()) + ' L ' + C.edgePts().reverse().map(pt).join(' L ') + ' Z', edge = C.edgePts();
    // shell thickness band on the lit broken edge (ink300): the edge pushed left. The frame is the ink all round
    // (cap band above, collar below, head outline on the far side, the fallen ink half on the near side) + a thin rim.
    // the band is a plain ink300 face (no stroke of its own); the one edge line is the shell path's stroke below
    const tw = g ? 3 : 2.6, band = poly([...edge, ...edge.slice().reverse().map((q) => [q[0] - tw, q[1] + 0.4])]);
    let s = `<path d="${band}" fill="${K.ink300}"/>`;
    const cm = X.clip(mask);
    s += `<path d="${mask}" fill="${K.paper300}" stroke="${K.ink}" stroke-width="${f(g ? 2 : 1.2)}" stroke-linejoin="round"/>`;
    // ONE shadow mass = the visor's cast shadow + the far cheek band, one shape. Its edge leaves the band at the brow,
    // runs diagonally under the far eye and turns down the far cheek, so the lit shell is a wedge: narrow at the brow,
    // ≥ 8u wide from the cheek to the jaw. The far eye (phi 28°, h −3.6) is centred in the shadow; its slit's near end
    // (≈ 40%) reaches over the terminator (phi ≈ 21° at that height) onto the lit shell. Flat ink300 (both details).
    const term = [[0, -19], [8, -12], [18, -5], [28, 0], [36, 4], [36, 11], [34, 17], [30, 23]].map((q) => W.p(q[0], q[1]));
    const shD = smooth(term) + ' L 232,194 L 232,140 Z';
    let inner = `<path d="${shD}" fill="${K.ink300}"/>`;
    // far eye: lightless slit hole in the shell (phi +28°): a thin slit, foreshortened by the turn
    const fe = W.at(28, -3.6), few = g ? 6.2 : 5, feh = g ? 1.3 : 0.8;
    inner += `<path d="${smooth([fe(-few, -feh * 0.4), fe(0, -feh), fe(few, feh * 0.5), fe(0, feh)], true)}" fill="${K.ink}"/>`;
    // ONE accent: the ink wedge under the nose tip
    inner += `<path d="${poly([W.p(1.6, 6.2), W.p(12, 6.8), W.p(5, g ? 10.6 : 9.6)])}" fill="${K.ink}"/>`;
    // cracks: each starts at the jaw or the broken edge and climbs to the upper right (> 30° off vertical on screen),
    // one fork each, none parallel to another or to the broken edge, clear of the far eye and the nose wedge. art 3 · game 1
    const cr = [
      [[[2, 19], [12, 15], [22, 13]], [[12, 15], [18, 19]]],
      [[[-4.8, -5.6], [4, -7], [12, -9]], [[4, -7], [0.6, -9.8]]],
      [[[-5.6, 0.6], [4, -1.4], [9, -3]], [[4, -1.4], [8, 1.6]]]
    ].slice(0, g ? 1 : 3);
    cr.forEach(([P, Fk]) => { inner += inkCrack(X, P.map((q) => W.p(q[0], q[1])), g ? 2 : 0.9, K.ink, Fk ? Fk.map((q) => W.p(q[0], q[1])) : null); });
    if (opt.crack) inner += fcrack(X, [W.p(-6, -9), W.p(4, -5), W.p(1, 1), W.p(10, 5), W.p(8, 12), W.p(18, 16)], g ? 2.4 : 1.4);
    if (opt.p2) inner += F._.pcrack(X, [W.p(-7, -15), W.p(6, -8), W.p(0, -1), W.p(14, 6), W.p(10, 14), W.p(26, 20)]);
    s += `<g clip-path="url(#${cm})">${inner}</g>`;
    // near eye: ONE white slit in the fallen ink half (phi −31°): long and thin, the inner end cut low. Ink margin ≥ 3.
    const ne = W.at(-31, -3.6), sx = g ? 1.2 : 1, sy = g ? 1.65 : 1;
    const slit = [[-5, -0.9], [-2.2, -1.9], [2.2, -1.6], [5, 1.3], [1.8, 1.7], [-2.4, 0.8]].map(([u, v]) => ne(u * sx, v * sy));
    s += `<path d="${smooth(slit, true)}" fill="${K.paper50}"/>`;
    if (!g) s += `<path d="${circ(ne(0.6, 0)[0], ne(0.6, 0)[1], 0.95)}" fill="${K.ink}"/>`;
    // chin strap (ink300 thin) across the fallen cheek down under the jaw
    s += X.Lf(smooth([WB.p(-112, -19), W.p(-100, -6), W.p(-72, 10), W.p(-40, 19.4), W.p(-12, 22.6)]), g ? 2 : 1.1, K.ink300);
    return s;
  };

  // ---- cracked sabre: pommel → guard → slightly curved blade → tip. ink300 blade, paper50 edge glint, one ink crack ----
  // given as pommel + angle (deg from +x) + length (116 = grip 24 + blade 92). sunk: the blade ends flat in the ground
  C.swordAt = (X, pommel, ang, len, opt) => C.sword(X, pommel, add(pommel, [Math.cos(ang * D2R), Math.sin(ang * D2R)], len), opt);
  C.sword = function (X, pommel, tip, opt = {}) {
    const u = unit(pommel, tip), m = nrm(u), L = Math.hypot(tip[0] - pommel[0], tip[1] - pommel[1]);
    const grip = 24, guard = add(pommel, u, grip), bl = L - grip, bend = opt.straight ? 0 : 5;
    const P = (t, k) => add(add(guard, u, bl * t), m, k + bend * Math.sin(Math.PI * t) * (opt.flip ? -1 : 1));
    const wq = X.game ? 1.25 : 1, w = 4.2 * wq;
    let s = '';
    if (opt.sunk && !opt.hiltOnly) {
      s += X.S(poly([P(0, -w), P(1, -w * 0.9), P(1, w * 0.9), P(0, w)]), K.ink300, 1.8, X.L('M ' + [P(0.06, -w * 0.4), P(0.94, -w * 0.4)].map(pt).join(' L '), X.game ? 1.2 : 0.9, K.paper50));
    } else if (!opt.hiltOnly) {
      const bd = 'M ' + [P(0, -w), P(0.5, -w * 0.9), P(0.9, -w * 0.55), P(1, 0), P(0.92, w * 0.5), P(0.5, w * 0.9), P(0, w)].map(pt).join(' L ') + ' Z';
      s += X.S(bd, K.ink300, 1.8, X.L('M ' + [P(0.04, -w * 0.4), P(0.5, -w * 0.4), P(0.9, -w * 0.25)].map(pt).join(' L '), X.game ? 1.2 : 0.9, K.paper50) +
        `<path d="M ${pt(P(0.62, -w - 2))} L ${pt(P(0.6, -w * 0.2))} L ${pt(P(0.66, 0.4))} L ${pt(P(0.63, w + 2))}" fill="none" stroke="${K.ink}" stroke-width="${f(X.game ? 2.4 : 1.3)}" stroke-linejoin="bevel"/>`);
      if (opt.broken) s += X.P(poly([P(0.62, -w - 1), P(0.6, 0), P(0.65, w + 1), P(0.7, w + 1), P(0.7, -w - 1)]), K.ink, 1);
    }
    if (opt.bladeOnly) return s;
    // guard (ink700 bar across, a knuckle bow toward the pommel) + grip + pommel
    const g1 = add(guard, m, -9), g2 = add(guard, m, 9);
    s += X.P(poly([add(g1, u, -2), add(g2, u, -2), add(g2, u, 2.6), add(g1, u, 2.6)]), K.ink700, 1.6);
    s += X.P(tube([add(pommel, u, 3), add(guard, u, -2)], [3.2, 3.6], false), K.ink, 1.4) + X.art(X.L(`M ${pt(add(add(pommel, u, 5), m, -1.4))} L ${pt(add(add(guard, u, -4), m, -1.4))}`, 0.8, K.ink500));
    s += `<path d="${circ(pommel[0], pommel[1], 4.4)}" fill="${K.ink700}" ${X.O(1.4)}/>`;
    if (!opt.noBow) s += X.L(`M ${pt(add(g2, u, 1))} C ${pt(add(add(g2, m, 4), u, -8))} ${pt(add(add(pommel, m, 10), u, 4))} ${pt(add(add(pommel, m, 3), u, 3))}`, 2.2, K.ink);
    return s;
  };
  C.fist = (X, p, rot = 0) => `<g transform="translate(${f(p[0])},${f(p[1])}) rotate(${f(rot)})"><path d="${ell(0, 0, 8.4, 7.2)}" fill="${K.ink}" ${X.O(1.8)}/>` +
    X.L('M -4,-5 L -1,-6.4 M 1,-5.6 L 4,-6 M -5,-1.6 L -2.6,-2.6', 1.1, K.ink500) + `</g>`;
  // plaster shell chip (env.ch1.deep, ink rim, one forking crack that climbs from its lower edge)
  C.chip = (X, c, r, rot, seed, cracks = true) => {
    const R = PN.rng(seed * 17 + 5), P = [];
    for (let i = 0; i < 6; i++) { const a = (rot + i * 60 + (R() - 0.5) * 24) * D2R, k = r * (0.7 + R() * 0.45); P.push([c[0] + Math.cos(a) * k, c[1] + Math.sin(a) * k * 0.8]); }
    return X.P(poly(P), C1, 1.4) + (cracks ? inkCrack(X, [lerp(P[1], P[2], 0.5), c, lerp(P[4], P[5], 0.4)], X.game ? 1.8 : 0.9) : '');
  };
})(window.PN);
// ---------- 균열 장교 — part 2/2: coat, poses, composition, anchors ----------
(function (PN) {
  const F = PN.fieldBosses, K = F.K, C = F._cmd, { circ, ell, poly, smooth, lerp, add, unit, nrm, tfP, tg, tube, drip, inkCrack, exclaim, dry, brushHead, gArc, speed, heap, puddle, f, pt, D2R } = F._;
  const C1 = K.ch1.deep;
  const TORSO = [[173, 192], [158, 196], [155, 212], [159, 236], [161, 249], [243, 249], [245, 232], [247, 212], [245, 198], [231, 192]];
  const COLLAR = [[183, 175], [190, 181.5], [200, 186.6], [211, 189.6], [218, 188], [224, 181], [228, 186], [229, 197], [214, 201], [198, 201], [184, 199], [179, 189]];
  const SH_N = [166, 203], SH_F = [238, 203];

  // pose table (world coords; the upper body = torso, collar, epaulettes, head, cap moves rigidly with T)
  C.rig = function (o) {
    const P = o.pose, fr = o.frame, T = (r, dx, dy) => ({ r, c: C.HIP, dx, dy });
    const R = { pose: P, frame: fr, T: T(0, 0, 0), hemL: [155, 306], hemR: [250, 305], boots: [166, 212], face: true };
    if (P === 'idle') Object.assign(R, { near: [[156, 226], [171, 240]], fistN: [180, 237], far: [[251, 226], [236, 246]], sword: { p: [188, 228], a: 130, layer: 'back' } });
    // windup/attack: the sword stands clear in front at x 278 (R1); the far boot and hem stay at x ≤ 252 so the lower
    // blade is a separate vertical in silhouette. Near arm (shoulder→elbow→wrist) ≈ 85, within 10% of the old 80.
    // windup: the blade bows OUT (flip) — bowed in, its middle touched the coat's shadow-side edge at y ≈ 280
    if (P === 'windup') Object.assign(R, { T: T(18, 6, 0), hemL: [132, 303], hemR: [250, 301], boots: [136, 214], flare: true, near: [[228, 222], [265, 210]], fistN: [276, 205], far: [[286, 234], [276, 222]], fistF: [281, 218], sword: { p: [278, 210], a: 90, layer: 'fig', flip: true } });
    if (P === 'attack') Object.assign(R, { T: T(22, 6, 18), hemL: [138, 307], hemR: [250, 305], boots: [140, 214], near: [[230, 246], [265, 248]], fistN: [276, 244], far: [[292, 262], [283, 258]], fistF: [281, 256], sword: { p: [278, 250], a: 90, layer: 'fig', sunk: 40 } });
    if (P === 'death' && fr === 0) Object.assign(R, { T: T(-10, 0, 0), crack: true, near: [[141, 230], [138, 250]], palmN: [139, 260], far: [[240, 232], [222, 250]], sword: { p: [176, 246], a: 140, layer: 'back' } });
    if (P === 'death' && fr === 1) Object.assign(R, { T: T(7, 4, 42), kneel: true, crack: true, hemL: [134, 326], hemR: [266, 322], near: [[150, 270], [147, 296]], palmN: [149, 305], far: [[262, 268], [254, 288]], cap: { r: -40, c: [184, 140], dx: -16, dy: 6 }, sword: { p: [122, 318], a: 4, layer: 'back' } });
    if (P === 'death' && fr >= 2) R.face = false;
    return R;
  };

  const torso = (X) => {
    const lit = poly([[148, 189], [194, 189], [186, 199], [196, 207], [182, 215], [192, 226], [176, 234], [186, 244], [168, 254], [148, 254]]);
    // chest plaster plate: game shrinks it to 70% about its centre so it never outshines the face at 1x (R5)
    const pc = [212, 222], ps = X.g(1, 0.7), P7 = (q) => [pc[0] + (q[0] - pc[0]) * ps, pc[1] + (q[1] - pc[1]) * ps];
    const plate = [[193, 206], [214, 202.5], [227, 209], [223, 225], [231, 236], [207, 241], [196, 233], [200, 220]].map(P7);
    let inner = `<path d="${lit}" fill="${K.ink500}"/>`;
    inner += X.P(poly(plate), C1, 1.2) + `<path d="${poly([[214, 202.5], [227, 209], [223, 225], [231, 236], [207, 241], [216, 224]].map(P7))}" fill="${X.pat('d40')}"/>`;
    inner += inkCrack(X, [[207, 241], [210, 229], [205, 219], [213, 207]].map(P7), X.g(1.1, 2), K.ink, [[205, 219], [197, 212]].map(P7));
    inner += X.art(dry(X, [158, 200, 155, 222, 160, 246], 2.6, 3, K.ink300, 4));
    let s = X.S(poly(TORSO), K.ink, 2.8, inner);
    s += X.P(poly([[159, 239], [245, 239], [245, 249.5], [160, 249.5]]), K.ink700, 1.6) + `<rect x="198" y="237.6" width="10" height="13" rx="1.6" fill="${K.ink500}" ${X.O(1)}/>`;
    return s;
  };
  const shoulders = (X) => {
    const n = [[143, 191.5], [177.5, 188.4], [181.5, 199], [146.5, 203]], r = [[229, 191.4], [252, 193], [252.5, 202], [231, 201.4]];
    let s = X.P(poly(r), K.ink700, 2) + X.S(poly(n), K.ink, 2.4, `<path d="${poly([[141, 189], [178, 186], [170, 192], [176, 195], [150, 197], [156, 200], [141, 202]])}" fill="${K.ink500}"/>`);
    const b = [161, 196.4], bw = X.g(4, 5.2), bh = X.g(2.8, 3.6); // rank: one cracked diamond, paper300, small
    s += X.P(poly([[b[0] - bw, b[1]], [b[0], b[1] - bh], [b[0] + bw, b[1]], [b[0], b[1] + bh]]), K.paper300, 1) + X.Lf(`M ${f(b[0] - 1)},${f(b[1] - bh + 0.8)} L ${f(b[0] + 0.6)},${b[1]} L ${f(b[0] - 0.4)},${f(b[1] + bh - 0.6)}`, X.g(0.8, 1.4), K.ink);
    s += X.S(poly(COLLAR), K.ink700, 2.4, `<path d="${poly([[176, 186], [191, 181], [198, 188], [192, 202], [178, 202]])}" fill="${K.ink500}"/>`);
    // head (the erased near half is this ink); ear at phi −95° (art)
    s += X.S(C.HEAD, K.ink, 2.8, X.art(`<path d="M 187.6,157.6 C 184.2,160 184,167 188,170.4 L 189.4,168.6 C 187,166 187.2,161.4 189.4,159.4 Z" fill="${K.ink500}"/>` + dry(X, [185.4, 149, 184, 160, 186.4, 172], 1.8, 2, K.ink300, 6)));
    return s;
  };
  const skirt = (X, R) => {
    const wl = tfP([160, 243], R.T), wr = tfP([244, 243], R.T), hl = R.hemL, hr = R.hemR, mid = lerp(hl, hr, 0.5);
    const pts = [wl, wr, add(lerp(wr, hr, 0.5), [2, 0]), hr, [hr[0] - 14, hr[1] + 3.4], [mid[0] + 18, mid[1] + 2], [mid[0] + 4, mid[1] + 4.4], [mid[0] - 12, mid[1] + 2], [hl[0] + 16, hl[1] + 3], hl, add(lerp(hl, wl, 0.5), [-1, 0])];
    let inner = `<path d="${poly([add(wl, [-8, -6]), add(wl, [28, -6]), add(wl, [18, 14]), add(wl, [30, 26]), add(lerp(wl, hl, 0.62), [16, 0]), add(lerp(wl, hl, 0.74), [28, 0]), add(hl, [20, 7]), add(hl, [-8, 8])])}" fill="${K.ink500}"/>`;
    inner += C.chip(X, add(lerp(wl, hl, 0.66), [13, 0]), 10, 20, 3);
    const o0 = lerp(wl, wr, 0.55), o1 = lerp(hl, hr, 0.52);
    inner += X.L(`M ${pt(o0)} L ${pt(o1)}`, 1.3, K.ink500);
    [0.2, 0.4, 0.6].forEach((t) => { const b = add(lerp(o0, o1, t), [6, 0]); inner += `<circle cx="${f(b[0])}" cy="${f(b[1])}" r="${f(X.g(1.7, 2.6))}" fill="${K.ink500}"/>`; });
    inner += inkCrack(X, [add(hr, [-22, 2]), add(lerp(hr, wr, 0.3), [-18, 0]), add(lerp(hr, wr, 0.55), [-24, 0])], X.g(1, 1.8), K.ink500);
    // windup: the coat tail kicks out behind as he drives the blade down (a hard ink spike, no dots — it flutters)
    const tail = R.flare ? X.P(poly([add(wl, [6, 10]), [hl[0] - 14, hl[1] - 22], [hl[0] - 8, hl[1] - 8], [hl[0] + 10, hl[1] - 2]]), K.ink, 2.6) : '';
    return tail + X.S(poly(pts), K.ink, 2.8, inner);
  };
  const boot = (X, x, fill, lit) => X.S(poly([[x + 2, 294], [x + 24, 294], [x + 26, 313], [x + 36, 317], [x + 38, 328], [x, 328], [x + 1, 312]]), fill, 2.4, lit ? `<path d="${poly([[x - 2, 292], [x + 10, 292], [x + 6, 311], [x - 2, 326]])}" fill="${K.ink500}"/>` : '');
  const arm = (X, pts, fill, lit, chip) => {
    let inner = lit ? `<path d="${tube(pts.map((p) => add(p, [-4.6, -3.6])), [5, 4.2, 3.6])}" fill="${K.ink500}"/>` : '';
    if (chip) inner += C.chip(X, lerp(pts[0], pts[1], 0.5), 6.6, 40, 9, false);
    const u = unit(pts[1], pts[2]), m = nrm(u), c0 = add(pts[2], u, -5.5);
    inner += `<path d="${poly([add(c0, m, -10), add(c0, m, 10), add(add(c0, m, 10), u, 5), add(add(c0, m, -10), u, 5)])}" fill="${K.ink700}"/>`;
    return X.S(tube(pts, [9.6, 8, 7]), fill, 2.4, inner);
  };
  const palm = (X, p, dir) => { // open hand (letting go): palm + 4 short fingers fanned along dir
    let s = '', fin = '';
    for (let i = 0; i < 4; i++) { const a = (dir + (i - 1.5) * 20) * D2R, b = add(p, [Math.cos(a) * 5, Math.sin(a) * 5]), e = add(p, [Math.cos(a) * 13, Math.sin(a) * 13]); fin += `M ${pt(b)} L ${pt(e)} `; }
    s += `<path d="${fin}" fill="none" stroke="${K.ink}" stroke-width="${f(X.g(4.2, 7))}" stroke-linecap="round"/>` + `<path d="${ell(p[0], p[1], 7.6, 6.4)}" fill="${K.ink}" ${X.O(1.6)}/>`;
    return s;
  };

  F.parts.commander = function (X, o) {
    const R = C.rig(o), g = X.game, T = R.T, P = o.pose, fr = o.frame;
    let back = '', fig = '', over = '', face = '', top = '', under = '', front = '';
    if (P === 'death' && fr >= 2) return deathLate(X, fr);
    const sw = R.sword, swOpt = { sunk: !!sw.sunk, flip: !!sw.flip };
    const swLen = sw.sunk ? 116 - sw.sunk : 116;
    if (sw.layer === 'back') back += C.swordAt(X, sw.p, sw.a, swLen, swOpt);
    // far arm (behind the coat; its elbow shows past the far side)
    back += arm(X, [tfP(SH_F, T), ...R.far], K.ink700, false, false);
    // legs
    if (R.kneel) {
      back += X.S(poly([[124, 316], [150, 312], [160, 328], [122, 328]]), K.ink700, 2.2, ''); // near shin flat on the ground, sole out back
      fig += boot(X, 226, K.ink700, false);
    } else fig += boot(X, R.boots[1], K.ink700, false) + boot(X, R.boots[0], K.ink, true);
    fig += skirt(X, R);
    fig += drip(X, R.hemL[0] + 6, R.hemL[1] + 1, 11, 4.6) + drip(X, R.hemR[0] - 4, R.hemR[1], 13, 4.6) + (R.kneel ? drip(X, 196, 328, 8, 4) + drip(X, 236, 326, 10, 4.4) : drip(X, 200, 310, 9, 4.2));
    fig += tg(T, torso(X));
    if (sw.layer === 'fig') fig += C.swordAt(X, sw.p, sw.a, swLen, swOpt);
    fig += arm(X, [tfP(SH_N, T), ...R.near], K.ink, true, true);
    fig += tg(T, shoulders(X));
    if (P === 'idle') fig += C.sword(X, sw.p, add(sw.p, [Math.cos(sw.a * D2R), Math.sin(sw.a * D2R)], 116), { hiltOnly: true });
    if (R.fistF) fig += C.fist(X, R.fistF, 10);
    if (R.fistN) fig += C.fist(X, R.fistN, P === 'idle' ? -40 : 0);
    if (R.palmN) fig += palm(X, R.palmN, P === 'death' && fr === 1 ? 70 : 120);
    if (R.kneel) fig += drip(X, R.palmN[0], R.palmN[1] + 4, 9, 3.6) + drip(X, tfP([206, 300], T)[0], 300, 10, 4);
    // face plate (crisp) + cap in front of it
    face = tg(T, C.face(X, { crack: R.crack, p2: o.p2 }));
    top = R.cap ? tg(T, `<g transform="translate(${R.cap.dx} ${R.cap.dy}) rotate(${R.cap.r} ${R.cap.c[0]} ${R.cap.c[1]})">${C.cap(X, {})}</g>`) : tg(T, C.cap(X, { p2: o.p2 }));
    // ---- pose FX ----
    if (P === 'windup' || P === 'attack') {
      const c = [sw.p[0], 326], A = P === 'attack';
      under += `<path d="${ell(c[0], c[1] + 1, 9, 3.6)}" fill="${K.ink}"/>`;
      const rays = [[[-14, -3], [-25, 2], [-36, -2]], [[13, 3], [24, 0], [37, 4]], [[3, -8], [-3, -13], [2, -18]], [[-4, 7], [3, 12], [-2, 17]]];
      rays.forEach((ray, i) => {
        const P2 = [c, ...ray.map((q) => add(c, q, A ? 1.15 : 1))];
        under += inkCrack(X, P2, X.g(2.4, 4), K.ink);
        if (!A) { const e = P2[P2.length - 1], b = P2[P2.length - 2]; under += brushHead(X, e[0], e[1], Math.atan2(e[1] - b[1], e[0] - b[0]), 0.7); }
      });
      if (A) {
        under += X.L(gArc(c, 40, -200, 18, 0.42), 2.6, K.ink) + X.L(gArc(c, 40, 30, 150, 0.42), 2.2, K.ink);
        // plaster chips burst from the coat with ink speed lines; ground shards rise inside the hit circle
        [[[150, 226], [-1, -0.5]], [[266, 238], [1, -0.4]], [[206, 196], [-0.2, -1]]].forEach(([p, d], i) => { front += speed(X, add(p, d, -18), add(p, d, -4), X.g(3, 4)) + speed(X, add(add(p, d, -16), nrm(d), 6), add(add(p, d, -5), nrm(d), 5), X.g(2, 3)) + C.chip(X, p, 7.5, 30 + i * 40, 11 + i); });
        [[202, 312, 7], [216, 300, 6], [258, 306, 7], [180, 318, 5], [268, 292, 5]].forEach(([x, y, s]) => { front += `<path d="${poly([[x - s * 0.6, y], [x + s * 0.1, y - s * 1.3], [x + s * 0.7, y]])}" fill="${K.ink}"/>`; });
      }
    }
    if (P === 'windup') front += exclaim(X, ...add(C.headAt(R), [0, X.g(-23, -29)]), 1.1);
    if (P === 'death' && fr === 1) [[118, 252, 7, 10], [270, 270, 6, 70], [212, 244, 5.6, 120]].forEach(([x, y, r, a], i) => { front += C.chip(X, [x, y], r, a, 21 + i) + X.L(`M ${f(x)},${f(y - r - 10)} L ${f(x)},${f(y - r - 3)}`, 1.2, K.ink500); });
    return { under, back, fig, over, face, top, front };
  };

  // death 2 (ink heap) and 3 (puddle): the shared mound / pool + the officer's own wreckage
  function deathLate(X, fr) {
    let fig = '', under = '';
    if (fr === 2) {
      const H = heap(X, { cx: 192, w: 156, h: 86, lean: 18, seed: 3 });
      fig += H.s + drip(X, 128, 326, 8, 4) + drip(X, 252, 324, 10, 4.4);
      fig += X.S(poly([[150, 270], [180, 262], [186, 272], [154, 282]]), K.ink, 2.2, `<path d="${poly([[148, 268], [180, 260], [172, 268], [150, 276]])}" fill="${K.ink500}"/>`); // epaulette surfacing
      fig += C.swordAt(X, [108, 320], -8, 116, {});
      fig += `<g transform="translate(${f(H.top[0] - 202)} ${f(H.top[1] - 136)}) rotate(24 206 134)">${C.cap(X, {})}</g>`;
    } else {
      fig += puddle(X, { seed: 4 });
      fig += C.swordAt(X, [108, 334], -12, 58, { straight: true, broken: true });
      fig += C.sword(X, [190, 342], [262, 330], { bladeOnly: true, straight: true });
      fig += X.P(poly([[226, 312], [248, 309], [254, 314], [244, 318], [238, 315], [232, 319]]), K.ink, 1.8); // broken visor
      [[160, 316, 8, 10], [212, 352, 7, 80], [268, 344, 6, 140]].forEach(([x, y, r, a], i) => { fig += C.chip(X, [x, y], r, a, 31 + i); });
    }
    return { under, fig };
  }
  C.headAt = (R) => tfP([204, 106], R.T);
  F.anchorsOf.commander = function (o) {
    const R = C.rig(o.pose === 'death' && o.frame >= 2 ? { pose: 'idle', frame: 0 } : o), T = R.T;
    const eye = tfP(C.W.at(-31, -3.6)(0, 0), T);
    const box = [[182, 140], [228, 140], [228, 190], [182, 190]].map((q) => tfP(q, T));
    const xs = box.map((q) => q[0]), ys = box.map((q) => q[1]);
    const sw = R.sword, tip = sw.sunk || o.pose === 'windup' ? [sw.p[0], 328] : add(sw.p, [Math.cos(sw.a * D2R), Math.sin(sw.a * D2R)], 116);
    return {
      head: C.headAt(R).map(f), face: eye.map(f), faceBox: [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)].map(f),
      muzzle: tip.map(f), sword: { pommel: sw.p.slice(), tip: tip.map(f) },
      portrait: { center: [208, 169], scale: 0.27 }
    };
  };
})(window.PN);
// ---------- 백환 관리자 (reliquary · Ch2 · rings) — part 1/2: reliquary box, rings, window face ----------
// 40° 넘게 굽은 작은 몸 + 등에 진 첨탑 성유물함(몸보다 높다) + 함 윗부분을 꿴 쇠고리 셋. 2장 철선묘: 고른 선과 리벳.
// Face: 함 앞면의 뾰족 아치 창 = plane(yaw30, tilt12). 유리 속 종이 유물 얼굴, 열쇠 구멍 눈 둘(먼 쪽이 좁다).
(function (PN) {
  const F = PN.fieldBosses, K = F.K, { circ, ell, poly, smooth, lerp, add, unit, nrm, rotP, plane, pEll, pRing, pPoly, fcrack, pcrack, f, pt, D2R } = F._;
  const Q = (F._rel = {});
  const C2 = K.ch2.deep;
  // box frame: front(u,v) in frontal units (u ±25 across the window face, v down), turned 30°, leaning `tilt`
  Q.box = function (Fc = [164, 182], tilt = 12) {
    const a = tilt * D2R, ca = Math.cos(a), sa = Math.sin(a), sx = Math.cos(30 * D2R);
    const front = (u, v) => [Fc[0] + u * sx * ca - v * 0.97 * sa, Fc[1] + u * sx * sa + v * 0.97 * ca];
    const B = [-17 * ca + 6.8 * sa, -17 * sa - 6.8 * ca]; // side depth 34 → receding up-left
    const win = plane(front(0, 8), 20, { tilt, squash: 0.97 }); // window plate: half-width 20 → design 50
    return { Fc, tilt, front, B, back: (p) => add(p, B), win };
  };
  Q.RINGS = [[58, 0.3, -20], [64, 0.34, 6], [70, 0.36, 20]]; // [r, vertical ratio, tilt°]
  Q.RC = [156, 128];
  Q.ringPts = (c, r, q, th, t0, t1, n = 24) => { const out = [], a = th * D2R; for (let i = 0; i <= n; i++) { const t = t0 + ((t1 - t0) * i) / n, x = r * Math.cos(t), y = q * r * Math.sin(t); out.push([c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)]); } return out; };
  // one iron hoop: ink300 band (art 6 · game 7) + ink rim, paper50 glint arc upper-left; half = 'back' | 'front' | 'all'
  // gap: [t0,t1] (rad) left open (phase-2 C-ring). tags: collected line scraps hanging from the front arc (art)
  Q.ring = function (X, c, r, q, th, half, opt = {}) {
    const g = X.game, bw = g ? 7 : 6, ow = bw + (g ? 5 : 3.2);
    const spans = half === 'back' ? [[Math.PI, Math.PI * 2]] : half === 'front' ? [[0, Math.PI]] : [[0, Math.PI * 2]];
    let s = '';
    spans.forEach(([t0, t1]) => {
      let parts = [[t0, t1]];
      if (opt.gap) parts = parts.flatMap(([a0, a1]) => { const [g0, g1] = opt.gap; if (g1 <= a0 || g0 >= a1) return [[a0, a1]]; return [[a0, Math.max(a0, g0)], [Math.min(a1, g1), a1]].filter(([x, y]) => y - x > 0.05); });
      parts.forEach(([a0, a1]) => {
        const d = smooth(Q.ringPts(c, r, q, th, a0, a1, Math.max(4, Math.round(((a1 - a0) / Math.PI) * 18))));
        s += `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="${f(ow)}" stroke-linecap="${opt.gap ? 'butt' : 'round'}"/><path d="${d}" fill="none" stroke="${K.ink300}" stroke-width="${f(bw)}" stroke-linecap="butt"/>`;
      });
    });
    if (half !== 'back') {
      const gl = smooth(Q.ringPts(c, r - bw * 0.15, q, th, Math.PI * 0.62, Math.PI * 0.9, 6));
      if (!opt.gap) s += `<path d="${gl}" fill="none" stroke="${K.paper50}" stroke-width="${f(g ? 1.6 : 1.1)}" stroke-linecap="round"/>`;
      if (!g && opt.tags) [0.32, 0.5, 0.7].forEach((t, i) => { const p = Q.ringPts(c, r, q, th, t * Math.PI, t * Math.PI, 1)[0]; s += X.Tf([p[0], p[1] + 3, p[0] + (i - 1) * 1.6, p[1] + 7, p[0] + (i - 1) * 2.4, p[1] + 11 + i * 2], 1.1, 'start', K.paper300); });
    }
    if (opt.gap) [opt.gap[0], opt.gap[1]].forEach((t) => { const p = Q.ringPts(c, r, q, th, t, t, 1)[0]; s += `<path d="${circ(p[0], p[1], bw * 0.62)}" fill="${K.ink}"/>`; });
    return s;
  };

  // the reliquary: left side (stained glass, lit) + front (ink, window = face) + gable roof + spire. Window drawn in `face`.
  Q.drawBox = function (X, bx, opt = {}) {
    const g = X.game, { front: Fr, back: Bk } = bx;
    const FLT = Fr(-25, -42), FRT = Fr(25, -42), FLB = Fr(-25, 48), FRB = Fr(25, 48), AP = Fr(0, -64), TIP = Fr(0, -76);
    const side = [Bk(FLT), FLT, FLB, Bk(FLB)];
    const roofSide = [Bk(AP), AP, FLT, Bk(FLT)];
    let s = '';
    // side face: env.ch2.deep stained panel (art 40% dots) with 2-3 ink lead lines
    const sp = (t, k) => lerp(lerp(Bk(FLT), FLT, t), lerp(Bk(FLB), FLB, t), k);
    const panel = [sp(0.2, 0.16), sp(0.5, 0.08), sp(0.8, 0.16), sp(0.8, 0.9), sp(0.2, 0.9)];
    let si = `<path d="${poly(panel)}" fill="${C2}"/>` + (g ? '' : `<path d="${poly(panel)}" fill="${X.pat('d40')}"/>`);
    si += X.L(`M ${pt(sp(0.5, 0.08))} L ${pt(sp(0.5, 0.9))} M ${pt(sp(0.2, 0.5))} L ${pt(sp(0.8, 0.36))} M ${pt(sp(0.2, 0.72))} L ${pt(sp(0.8, 0.64))}`, g ? 1.4 : 1.2, K.ink);
    si += X.L(poly(panel), g ? 1.6 : 1.4, K.ink);
    s += X.S(poly(side), K.ink, 2.4, si);
    // roof: lit left slope (ink500) + front gable (ink) + spire with a knob
    s += X.S(poly(roofSide), K.ink500, 2.2, X.art(X.L(`M ${pt(lerp(Bk(AP), AP, 0.5))} L ${pt(lerp(Bk(FLT), FLT, 0.5))}`, 0.8, K.ink300)));
    s += X.S(poly([FLT, AP, FRT]), K.ink, 2.4, `<path d="${poly([add(FLT, [-3, 0]), add(AP, [-1, -3]), lerp(AP, FRT, 0.12), lerp(FLT, FRT, 0.3)])}" fill="${K.ink500}"/>`);
    s += X.P(poly([add(AP, [-3, 1]), TIP, add(AP, [3.4, 1.6])]), K.ink, 1.6) + `<path d="${circ(TIP[0], TIP[1], 3)}" fill="${K.ink700}" ${X.O(1.2)}/>`;
    // front face: ink, upper-left corner ink500; iron rivets along the edges (art)
    let fi = `<path d="${poly([add(FLT, [-4, -4]), lerp(FLT, FRT, 0.42), Fr(-12, -30), Fr(-21, -12), add(FLB, [-4, -30])])}" fill="${K.ink500}"/>`;
    if (!g) [[-21, -36], [21, -36], [-21, 42], [21, 42]].forEach(([u, v]) => { const p = Fr(u, v); fi += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="1.5" fill="${K.ink500}"/>`; });
    s += X.S(poly([FLT, FRT, FRB, FLB]), K.ink, 2.6, fi);
    // base plinth
    s += X.P(poly([add(Bk(FLB), [-2, 0]), add(FLB, [-3, 0]), add(FRB, [3, 0]), add(FRB, [3, 6]), add(FLB, [-3, 6]), add(Bk(FLB), [-2, 6])]), K.ink700, 1.8);
    // empty ring hangers on the roof (attack / death: the rings have left)
    if (opt.hooks) [-14, 0, 14].forEach((u, i) => { const p = Fr(u, -44 - (i === 1 ? 14 : 0)); s += X.L(`M ${pt(p)} l 0,-6 a 3.4 3.4 0 1 1 5,2`, 2, K.ink); });
    return s;
  };

  // ---- window face: pointed arch frame (ink, left thickness band) → dark glass → paper relic face with keyhole eyes ----
  // one shadow mass (far-cheek crescent wrapping under the chin, paper300) + one accent (nose wedge, ink300)
  // pointed (gothic) arch in plate design units: two circular arcs (radius rho·hw) meet at the apex; straight jambs to vb.
  // returns the runs [right jamb, right arc, left arc, left jamb] so corners stay sharp
  const archRuns = (hw, vs, vb, rho = 1.3) => {
    const fa = Math.acos((rho - 1) / rho), R = [];
    for (let i = 0; i <= 8; i++) { const p = (fa * i) / 8; R.push([hw - rho * hw + rho * hw * Math.cos(p), vs - rho * hw * Math.sin(p)]); }
    const L = R.slice().reverse().map(([u, v]) => [-u, v]);
    return [[[hw, vb], [hw, vs]], R, L, [[-hw, vs], [-hw, vb]], [[-hw, vb], [hw, vb]]];
  };
  const archD = (W, hw, vs, vb, sh = [0, 0]) => F._.runs(archRuns(hw, vs, vb).map((run) => run.map(([u, v]) => add(W(u, v), sh))));
  Q.face = function (X, bx, opt = {}) {
    const g = X.game, W = bx.win;
    // design units: window half-width 50 (= 20 local); outer apex −77, shoulders −14, sill +66 (≈ 40 × 56 local)
    const outer = archD(W, 50, -14, 66), inner = archD(W, 38, -10, 56);
    let s = `<path d="${archD(W, 50, -14, 66, W.back(g ? 5 : 4))}" fill="${K.ink700}" stroke="${K.ink}" stroke-width="${f(g ? 3 : 1.6)}" stroke-linejoin="round"/>`; // thickness band: left only
    s += `<path d="${outer}" fill="${K.ink}"/>`;
    // inner bevel: upper-left ink500 (left arc + left jamb), lower-right stays ink
    const bv = archRuns(44, -12, 61);
    s += `<path d="${smooth([...bv[2], ...bv[3].slice(1)].map(([u, v]) => W(u, v)))}" fill="none" stroke="${K.ink500}" stroke-width="${f(g ? 2.6 : 1.6)}" stroke-linecap="round"/>`;
    const glass = inner, gc = X.clip(glass);
    let gl = `<path d="${glass}" fill="${K.ink700}"/>`;
    // relic face: paper oval one size smaller than the glass, same plane
    const fc = [0, 6], fr = [g ? 32 : 30, 42];
    const faceD = pEll(W, fc[0], fc[1], fr[0], fr[1], 28), fcl = X.clip(faceD);
    gl += `<path d="${faceD}" fill="${opt.dead ? K.paper300 : K.paper}"/>`;
    // shadow mass: far cheek crescent wrapping under the chin (paper300)
    const shade = [...pRing(W, fc[0], fc[1], fr[0] + 4, fr[1] + 4, 14, -70, 120), W(-18, 50), W(4, 40), W(18, 28), W(24, 8), W(20, -18), W(14, -40)];
    let fi = `<path d="${smooth(shade, true)}" fill="${K.paper300}"/>`;
    // accent: nose wedge (ink300)
    fi += `<path d="${poly([W(2, 6), W(10, 14), W(1, 16)])}" fill="${K.ink300}"/>`;
    // keyhole eyes: round top + narrowing slot, same plane → the far hole is narrower. glint upper-left in the round part
    const eye = (u, v) => {
      const rt = g ? 12.5 : 9, sl = g ? 15 : 12.5, sw2 = g ? 6.5 : 5;
      const top = pRing(W, u, v, rt, rt, 16, 150, 390), bot = [W(u + sw2, v + rt * 0.6), W(u + sw2 * 0.55, v + rt + sl), W(u - sw2 * 0.55, v + rt + sl), W(u - sw2, v + rt * 0.6)];
      let e = `<path d="${smooth(top) + ' L ' + bot.map(pt).join(' L ') + ' Z'}" fill="${K.ink}"/>`;
      if (!opt.dead) { const gp = W(u - rt * 0.28, v - rt * 0.3); e += `<path d="${circ(gp[0], gp[1], g ? 2 : 1.2)}" fill="${K.paper50}"/>`; }
      return e;
    };
    fi += eye(-17, -6) + eye(17, -6);
    if (opt.crack) fi += fcrack(X, [W(-30, -40), W(-26, -24), W(-34, -10), W(-28, 4), W(-36, 22)], g ? 2.4 : 1.3);
    gl += `<g clip-path="url(#${fcl})">${fi}</g>`;
    // glass: sill band (ink300) + reflections (paper50 diagonal brush strokes upper-left, never across the eyes)
    gl += `<path d="${poly([W(-40, 50), W(40, 50), W(40, 60), W(-40, 60)])}" fill="${K.ink300}"/>`;
    if (!opt.dead) {
      gl += X.Tf([...W(-34, -18), ...W(-30, -34), ...W(-22, -48)], g ? 2.4 : 1.6, 'mid', K.paper50);
      if (!g) gl += X.Tf([...W(-25, -26), ...W(-22, -36), ...W(-16, -44)], 1, 'mid', K.paper50);
    }
    if (opt.p2) gl += pcrack(X, [W(36, -52), W(30, -36), W(40, -26), W(34, -10), W(38, 4), W(30, 22), W(36, 46)]);
    if (opt.dead) gl += fcrack(X, [W(-38, -30), W(-6, -20), W(8, -34), W(36, -26)], g ? 2.4 : 1.3) + fcrack(X, [W(-6, -20), W(-12, 20), W(10, 46)], g ? 2.4 : 1.3);
    s += `<g clip-path="url(#${gc})">${gl}</g>`;
    s += `<path d="${glass}" fill="none" stroke="${K.ink}" stroke-width="${f(g ? 2.4 : 1.4)}"/>`;
    return s;
  };
})(window.PN);
// ---------- 백환 관리자 — part 2/2: bent keeper, poses, composition, anchors ----------
(function (PN) {
  const F = PN.fieldBosses, K = F.K, Q = F._rel, { circ, ell, poly, smooth, lerp, add, unit, nrm, rotP, tfP, tg, tube, plane, drip, exclaim, dry, gArc, heap, puddle, f, pt, D2R } = F._;
  const HIPS = [198, 300];
  // robe outline; third value = how much the point follows the upper-body pose (0 = hem stays on the ground)
  // C-curve: back arches under the box, the cowl hangs forward-down, the chest is hollow (concave front), knees forward
  // the robe's top tucks under the reliquary's plinth; the back shows as one convex curve (rump) down to the hem
  const ROBE = [[126, 226, 1], [116, 248, 0.75], [113, 270, 0.45], [120, 288, 0.15], [134, 296, 0.05], [156, 297, 0], [180, 292, 0], [204, 297, 0], [228, 292, 0], [251, 295, 0], [257, 284, 0.15], [248, 273, 0.4], [243, 262, 0.7], [237, 252, 1], [224, 241, 1], [210, 233, 1], [197, 230, 1], [184, 230, 1], [156, 230, 1]];
  const HOOD = [[219, 226], [228, 212], [244, 207], [259, 214], [270, 230], [273, 244], [264, 257], [249, 261], [236, 253], [226, 241]];
  const HOLE = [[249, 233], [262, 237], [266, 249], [258, 257], [247, 255], [243, 243]];
  const bend = (pts, T) => pts.map(([x, y, w = 1]) => lerp([x, y], tfP([x, y], T), w));

  Q.rig = function (o) {
    const P = o.pose, fr = o.frame, T = (r, dx = 0, dy = 0) => ({ r, c: HIPS, dx, dy });
    const R = { T: T(0), tilt: 12, rings: Q.RINGS.map(([r, q, th], i) => ({ c: Q.RC.slice(), r, q, th })), hands: 'straps', face: true, lift: 0 };
    if (P === 'windup') { R.T = T(9, 2, 8); R.rings = Q.RINGS.map(([r, q, th], i) => ({ c: [158, 108 - (i - 1) * 11], r: r * 1.25, q: 0.25, th: th * 0.7 })); R.spin = true; }
    if (P === 'attack') { R.T = T(-10, -2, -2); R.rings = []; R.hooks = true; R.hands = 'spread'; R.flung = true; }
    if (P === 'death' && fr === 0) { R.T = T(-6, -2, 0); R.crack = true; R.rings[0] = { c: [176, 150], r: 58, q: 0.3, th: 34 }; }
    if (P === 'death' && fr === 1) { R.T = T(-14, -6, 30); R.tilt = 12; R.crack = true; R.hands = 'limp'; R.rings = [{ c: [196, 236], r: 60, q: 0.3, th: 8 }, { c: [176, 214], r: 64, q: 0.32, th: -10 }, { c: [200, 262], r: 66, q: 0.32, th: 14 }]; }
    if (P === 'death' && fr >= 2) R.face = false;
    return R;
  };
  // ring centre/tilts follow the box when it moves with T (idle/death); windup rings fly free of it
  const ringsOf = (R, idle) => R.rings.map((g) => (idle ? Object.assign({}, g, { c: tfP(g.c, R.T), th: g.th + R.T.r }) : g));

  F.parts.reliquary = function (X, o) {
    const R = Q.rig(o), g = X.game, P = o.pose, fr = o.frame, T = R.T;
    let back = '', fig = '', over = '', face = '', front = '', under = '';
    if (P === 'death' && fr >= 2) return late(X, fr);
    const bx = Q.box([164, 182], R.tilt);
    const follow = P !== 'windup';
    const rings = ringsOf(R, follow);
    // ring back halves behind the box
    rings.forEach((r) => { back += Q.ring(X, r.c, r.r, r.q, r.th, 'back', {}); });
    // robe: ONE C-shaped ink mass; ink500 crescent on the hump top; lit dry rim on the back (art)
    const robe = bend(ROBE, T);
    // bent legs under the knee-length robe: knees forward, shins slope back to the feet on y 328
    const leg = (x, fill, lit) => X.S(poly([[x + 8, 284], [x + 26, 284], [x + 18, 316], [x + 30, 320], [x + 32, 328], [x - 2, 328], [x, 316]]), fill, 2.4, lit ? `<path d="${poly([[x + 4, 282], [x + 14, 282], [x + 6, 318], [x - 4, 326]])}" fill="${K.ink500}"/>` : '');
    fig += leg(222, K.ink700, false) + leg(166, K.ink, true);
    const hump = bend([[180, 238], [204, 226], [224, 234], [214, 236], [203, 233], [190, 239]], T);
    let ri = `<path d="${smooth(hump, true)}" fill="${K.ink500}"/>`;
    ri += `<path d="${poly(bend([[108, 230, 1], [132, 230, 1], [126, 252, 0.75], [132, 274, 0.45], [124, 298, 0.1], [106, 298, 0.1]], T))}" fill="${K.ink500}"/>`;
    ri += X.art(dry(X, [...lerp(robe[0], robe[1], 0.1), ...robe[1], ...lerp(robe[1], robe[2], 0.8)], 2.6, 3, K.ink300, 8));
    ri += X.T([...lerp(robe[9], robe[10], 0.1), ...robe[10], ...lerp(robe[10], robe[11], 0.7)], 2, 'mid', K.ink700);
    fig += X.S(smooth(robe, true), K.ink, 2.8, ri);
    fig += drip(X, 142, 303, 10, 4.4) + drip(X, 210, 306, 9, 4.2) + drip(X, 252, 304, 8, 4);
    // the reliquary (moves with the back)
    fig += tg(T, Q.drawBox(X, bx, { hooks: R.hooks }));
    // hood: lit crescent upper-left, the opening is EMPTY ink (no face) set off by one ink500 rim
    const hood = bend(HOOD, T), hole = bend(HOLE, T);
    // the cowl juts forward-down; ONE ink500 separation line keeps it off the robe and the box behind it
    fig += X.SS(smooth(hood, true), K.ink, 2.8, `<path d="${smooth(bend([[216, 228], [226, 210], [244, 204], [246, 212], [234, 218], [226, 234]], T), true)}" fill="${K.ink500}"/>`) +
      `<path d="${smooth(hole, true)}" fill="${K.ink}" stroke="${K.ink500}" stroke-width="${f(1.6 * X.li)}"/>`;
    // straps (ink700) from the box over the shoulder to the chest; hands grip them (idle) / fling out (attack)
    const sA = tfP([182, 202], T), sB = tfP([220, 236], T), sC = tfP([238, 258], T);
    const hn = R.hands === 'spread' ? [276, 252] : R.hands === 'limp' ? [244, 300] : tfP([251, 273], T);
    const hf = R.hands === 'spread' ? [214, 276] : R.hands === 'limp' ? [226, 304] : tfP([262, 271], T);
    const strapEnd = R.hands === 'straps' ? hn : tfP([246, 274], T);
    fig += X.L(smooth([sA, sB, sC, strapEnd]), (5.4 / X.li) * X.lw * 0.9, K.ink) + X.L(smooth([sA, sB, sC, strapEnd]), 3.2, K.ink700);
    const sh = tfP([230, 248], T), shf = tfP([248, 246], T);
    fig += X.S(tube([shf, lerp(shf, hf, 0.5), hf], [7.4, 6.6, 6]), K.ink700, 2.2, '');
    fig += X.S(tube([sh, add(lerp(sh, hn, 0.5), [-4, 2]), hn], [8, 7, 6.4]), K.ink, 2.4, `<path d="${tube([add(sh, [-3, -3]), add(lerp(sh, hn, 0.5), [-7, -1]), add(hn, [-3, -3])], [4, 3.4, 3])}" fill="${K.ink500}"/>`);
    [hf, hn].forEach((p, i) => { fig += `<path d="${ell(p[0], p[1], 7.6, 6.6)}" fill="${K.ink}" ${X.O(1.8)}/>` + X.L(`M ${f(p[0] - 4)},${f(p[1] - 4)} L ${f(p[0] + 3)},${f(p[1] - 5)}`, 1.1, K.ink500); });
    // rings' front halves in front of the box (they thread it like a halo)
    rings.forEach((r, i) => { over += Q.ring(X, r.c, r.r, r.q, r.th, 'front', { gap: o.p2 && i === 2 ? [Math.PI * 0.18, Math.PI * 0.36] : null, tags: true }); });
    face = tg(T, Q.face(X, bx, { crack: R.crack, p2: o.p2 }));
    if (P === 'windup') {
      rings.forEach((r, i) => { if (i === 1) return; const pts = Q.ringPts(r.c, r.r + 12, r.q, r.th, Math.PI * (i ? 0.1 : 0.55), Math.PI * (i ? 0.4 : 0.85), 8); front += X.L(smooth(pts), 2.2, K.ink) + F._.brushHead(X, pts[pts.length - 1][0], pts[pts.length - 1][1], Math.atan2(pts[8][1] - pts[7][1], pts[8][0] - pts[7][0]), 0.55); });
      front += exclaim(X, 150, Q.headAt(R)[1] - X.g(23, 29), 1.1);
    }
    if (R.flung) [[120, -150, -104], [104, -40, 30], [84, 150, 208]].forEach(([rr, a0, a1], i) => { const c = tfP(Q.RC, T); front += X.L(gArc(c, rr, a0, a1, 0.36), 3, K.ink) + X.L(gArc(c, rr + 9, a0 + 12, a1 - 16, 0.36), 1.4, K.ink500); });
    return { back, fig, over, face, front, under };
  };
  // a plate lying on the ground, seen from above: its "up" (v) points along −x (roof end left), across (u) recedes (×0.42)
  const lying = (c, R, rot = -8) => {
    const k = R / 50, a = rot * D2R, m = (u, v) => { const x = v * k, y = -u * k * 0.42 * 0.866; return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)]; };
    m.back = (t) => [0, t * 0.8];
    return m;
  };
  function late(X, fr) {
    let fig = '', face = '';
    const flatRing = (c, r, a0 = 0) => Q.ring(X, c, r, 0.42, a0, 'all', {});
    if (fr === 2) {
      const H = heap(X, { cx: 196, w: 158, h: 72, lean: 10, seed: 9 });
      fig += flatRing([146, 322], 46, -4) + H.s + drip(X, 128, 326, 8, 4) + drip(X, 262, 324, 10, 4.4);
      // the reliquary lying on the heap, window up: the front face seen from above + its dark side slab, roof end left
      const W = lying([214, 250], 20), lid = [W(-62, -190), W(62, -190), W(62, 128), W(-62, 128)];
      fig += X.P(poly([lid[0], lid[3], add(lid[3], [0, 12]), add(lid[0], [0, 12])]), K.ink700, 2.2);
      fig += X.S(poly(lid), K.ink, 2.4, `<path d="${poly([lid[1], lerp(lid[1], lid[2], 0.5), lerp(lid[0], lid[3], 0.4), lid[0]])}" fill="${K.ink500}"/>`);
      fig += X.P(poly([W(-62, -190), W(0, -250), W(62, -190)]), K.ink, 2.2);
      face = Q.face(X, { win: W }, { dead: true });
      fig += flatRing([250, 304], 38, 10);
    } else {
      fig += puddle(X, { seed: 6 });
      [[[140, 330], 40, -6], [[244, 342], 42, 8], [[206, 316], 34, 2]].forEach(([c, r, a]) => { fig += flatRing(c, r, a); });
      face = Q.face(X, { win: lying([188, 340], 18, -4) }, { dead: true });
    }
    return { fig, face };
  }
  // '!' foot: 8 above the highest point of the rings (idle/windup), else above the spire
  Q.headAt = (R) => (R.rings.length && !R.flung ? [150, Math.min(...R.rings.map((r) => r.c[1] - Math.sqrt((r.r * Math.sin(r.th * D2R)) ** 2 + (r.q * r.r * Math.cos(r.th * D2R)) ** 2))) - 8] : tfP([179, 102], R.T));
  F.anchorsOf.reliquary = function (o) {
    const R = Q.rig(o.pose === 'death' && o.frame >= 2 ? { pose: 'idle', frame: 0 } : o), T = R.T, bx = Q.box([164, 182], R.tilt), W = bx.win;
    const eyeN = tfP(W(-17, -6), T), eyeF = tfP(W(17, -6), T);
    const box = [W(-50, -77), W(50, -77), W(50, 66), W(-50, 66)].map((q) => tfP(q, T)), xs = box.map((q) => q[0]), ys = box.map((q) => q[1]);
    const rings = ringsOf(R, o.pose !== 'windup');
    const h = Q.headAt(Object.assign({}, R, { rings }));
    return {
      head: h.map(f), face: lerp(eyeN, eyeF, 0.35).map(f), faceBox: [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)].map(f),
      muzzle: (rings[1] ? rings[1].c : tfP(Q.RC, T)).map(f), rings: { c: (rings[1] ? rings[1].c : tfP(Q.RC, T)).map(f), r: rings.map((r) => f(r.r)) },
      portrait: { center: [164, 193], scale: 0.3 }
    };
  };
})(window.PN);
// ---------- 덫 설계자 (architect · Ch3 · traps) — part 1/2: lens face, steel tools, cloak ----------
// 높은 혹 등 + Λ 다리(굽은 사람 다리 + 곧은 쇠 컴퍼스) + 앞위로 든 곱자 팔 + 숙인 머리의 렌즈. 3장 젖은 번짐: 옷단 드립.
// Face: head wrap(228,176) ρ17. Lens = 가까운 눈 자리(phi −28°)에서 시선 방향으로 나온 원통(길이 12, r 13): 앞면 plane(yaw30).
(function (PN) {
  const F = PN.fieldBosses, K = F.K, { circ, ell, poly, smooth, lerp, add, unit, nrm, tube, wrap, plane, pEll, pRing, fcrack, pcrack, inkCrack, dry, f, pt, D2R } = F._;
  const A = (F._arc = {});
  const C3 = K.ch3.deep;
  A.HC = [228, 176]; A.RHO = 17; A.NECK = [216, 198];
  A.W = wrap(A.HC, A.RHO);
  A.lensC = add(A.W.p(-28, -1), [12 * Math.sin(30 * D2R), 0]);
  A.lens = () => plane(A.lensC, 13, { yaw: 30, squash: 0.97 });
  // hood (ink, lit crescent) around a shaded face (ink700); the lens sits on the near eye
  A.head = function (X) {
    const hood = [[213, 161], [225, 152], [240, 153], [249, 162], [251, 176], [248, 190], [239, 199], [222, 201], [209, 194], [205, 180], [207, 168]];
    const faceIn = [[233, 160], [245, 165], [249, 177], [246, 190], [238, 197.5], [229, 196], [227, 184], [228, 170]];
    let s = X.S(smooth(hood, true), K.ink, 2.8, `<path d="${smooth([[206, 170], [214, 156], [228, 150], [240, 152], [226, 158], [214, 168], [210, 182]], true)}" fill="${K.ink500}"/>` + X.art(dry(X, [207, 178, 210, 162, 224, 153], 1.8, 2, K.ink300, 3)));
    s += X.S(smooth(faceIn, true), K.ink700, 1.4, X.T([244.6, 187, 246.4, 190.6, 244.2, 193.4], 1.6, 'mid', K.ink500) + X.L('M 232.6,194.2 Q 236.8,195.6 241,193.6', 1, K.ink));
    // goggle strap (ink300) round the hood to the back of the head
    s += X.L(smooth([[226, 169], [216, 172], [207.6, 179]]), 2.2, K.ink) + X.L(smooth([[226, 169], [216, 172], [207.6, 179]]), 1.1, K.ink300);
    return s;
  };
  // lens face (face layer): barrel band on the left only → env.ch3.deep rim (ink outline) → enlarged eye in the glass
  A.face = function (X, opt = {}) {
    const g = X.game, L = opt.plate || A.lens(), rim = g ? 6 : 3, sh = L.back(12);
    // barrel = cylinder silhouette: the back rim (pushed left by 12·sin30 = 6) left half + the front rim right half.
    // The side band shows on the LEFT only (§2.3). env.ch3.deep, ink outline (game 6).
    const barrel = smooth([...pRing(L, 0, 0, 50, 50, 16, 90, 270).map((q) => add(q, sh)), ...pRing(L, 0, 0, 50, 50, 16, 270, 450)], true);
    let s = opt.flat ? '' : `<path d="${barrel}" fill="${C3}" stroke="${K.ink}" stroke-width="${f(rim * 2)}" stroke-linejoin="round" paint-order="stroke"/>`;
    s += `<path d="${pEll(L, 0, 0, 50, 50, 32)}" fill="${C3}" stroke="${K.ink}" stroke-width="${f(opt.flat ? rim * 2 : g ? 2.6 : 1.4)}" paint-order="stroke"/>`;
    // glass + enlarged eye (all on the same plane: the far side of each ring is narrower)
    const glass = pEll(L, 0, 0, 40, 40, 28), gc = X.clip(glass), ic = [1, 1];
    let gl = `<path d="${glass}" fill="${K.ink700}"/>`;
    gl += `<path d="${pEll(L, 0, 0, 37, 37, 28)}" fill="${K.paper50}"/>`; // the white: 85% of the glass (game focus)
    // ONE shadow mass: the hood's eave crescent over the top of the glass; lower edge = the plate's own arc
    // (game: a thinner crescent, so the white band between it and the iris disc stays ≥ 4u = 2px at 1x, F5)
    gl += `<path d="${smooth([...pRing(L, 0, 0, 44, 44, 12, 196, 344), ...pRing(L, 0, g ? -14 : -6, 44, 22, 12, 344, 196)], true)}" fill="${K.paper300}"/>`;
    if (g) {
      // game: ONE ink disc r 5.0 (local) for iris + bubble + pupil — the art rings fused into a thin white thread here
      gl += `<path d="${pEll(L, ic[0], ic[1], 5 / L.k, 5 / L.k, 24)}" fill="${K.ink}"/>`;
      if (!opt.dead) { const gp = L(ic[0] - 7.6, ic[1] - 8.2); gl += `<path d="${circ(gp[0], gp[1], 1.6)}" fill="${K.paper50}"/>`; }
    } else {
      gl += `<path d="${pEll(L, ic[0], ic[1], 21, 21, 24)}" fill="none" stroke="${K.ink}" stroke-width="1.7"/>`; // iris ring r5.5
      gl += `<path d="${pEll(L, ic[0], ic[1], 13.5, 13.5, 20)}" fill="none" stroke="${K.ink}" stroke-width="1.1"/>`; // bubble ring r3.5 (Ch3)
      gl += `<path d="${pEll(L, ic[0], ic[1], 7.6, 7.6, 16)}" fill="${K.ink}"/>`; // pupil r2
      if (!opt.dead) { const gp = L(ic[0] - 7, ic[1] - 8); gl += `<path d="${circ(gp[0], gp[1], 1.2)}" fill="${K.paper50}"/>`; }
    }
    // glass reflection: one paper50 crescent inside the rim, upper-left, over the eave shadow (art; game drops it)
    if (!g && !opt.dead) gl += `<path d="${smooth([...pRing(L, 0, 0, 38, 38, 8, 200, 250), ...pRing(L, 0, 0, 33, 33, 8, 250, 200)], true)}" fill="${K.paper50}"/>`;
    if (opt.crack) gl += fcrack(X, [L(-38, -6), L(-30, -14), L(-34, -22), L(-26, -30)], g ? 2.4 : 1.2);
    if (opt.p2) gl += pcrack(X, [L(-36, 18), L(-22, 30), L(-6, 26), L(10, 36), L(30, 22)]);
    s += `<g clip-path="url(#${gc})">${gl}</g><path d="${glass}" fill="none" stroke="${K.ink}" stroke-width="${f(g ? 2.4 : 1.4)}"/>`;
    // accent: the ink line inside the rim, lower-right
    s += `<path d="${smooth(pRing(L, 0, 0, 38, 38, 10, 10, 80))}" fill="none" stroke="${K.ink}" stroke-width="${f(g ? 2.4 : 1.4)}" stroke-linecap="round"/>`;
    if (opt.spark) { const sp = L(-30, -30); s += `<path d="M ${f(sp[0])},${f(sp[1] - 7)} L ${f(sp[0] + 1.6)},${f(sp[1] - 1.6)} L ${f(sp[0] + 7)},${f(sp[1])} L ${f(sp[0] + 1.6)},${f(sp[1] + 1.6)} L ${f(sp[0])},${f(sp[1] + 7)} L ${f(sp[0] - 1.6)},${f(sp[1] + 1.6)} L ${f(sp[0] - 7)},${f(sp[1])} L ${f(sp[0] - 1.6)},${f(sp[1] - 1.6)} Z" fill="${K.paper50}" stroke="${K.ink}" stroke-width="${f(g ? 1.6 : 0.9)}" paint-order="stroke"/>`; }
    return s;
  };
  // steel bar (square side / compass leg): ink300 band, ink outline, one paper50 reflection line; ticks (art) along one edge
  A.steel = function (X, a, b, w, opt = {}) {
    const u = unit(a, b), m = nrm(u), L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d = opt.needle ? poly([add(a, m, -w), add(b, m, -0.6), b, add(b, m, 0.6), add(a, m, w)]) : poly([add(a, m, -w), add(b, m, -w), add(b, m, w), add(a, m, w)]);
    let inner = X.L(`M ${pt(add(add(a, m, -w * 0.45), u, 3))} L ${pt(add(add(b, m, -w * (opt.needle ? 0.1 : 0.45)), u, -4))}`, X.game ? 1.1 : 0.8, K.paper50);
    if (opt.ticks && !X.game) for (let i = 1; i <= opt.ticks; i++) { const p = add(add(a, u, (L * i) / (opt.ticks + 1)), m, w); inner += X.L(`M ${pt(p)} L ${pt(add(p, m, -w * 0.9))}`, 0.8, K.ink); }
    return X.S(d, K.ink300, 1.8, inner);
  };
  // the steel square (ㄱ): long side from `root` at angle ang (deg), length 118; short side 18 drops perpendicular
  A.square = function (X, root, ang, opt = {}) {
    const g = X.game, w = g ? 4.2 : 3.6, u = [Math.cos(ang * D2R), Math.sin(ang * D2R)], m = nrm(u);
    const corner = add(root, u, 118), end = add(corner, m, opt.bent ? 15 : 18);
    const tip = opt.bent ? add(end, u, -6) : end;
    return A.steel(X, root, add(corner, u, w), w, { ticks: 4 }) + A.steel(X, add(corner, m, -w), tip, w, {}) + `<path d="${circ(root[0], root[1], g ? 7 : 6)}" fill="${C3}" ${X.O(1.6)}/>`;
  };
  // the cloak: ONE big triangular ink mass (no dots: it flutters), lit fold upper-left, pale blueprint strokes (no hatching)
  A.cloak = function (X, pts, lit, marks) {
    const g = X.game;
    let inner = `<path d="${poly(lit)}" fill="${K.ink500}"/>`;
    const bw = g ? 2.2 : 1.1, col = K.ink300;
    marks.forEach((mk, i) => {
      if (g && i > 2) return;
      if (mk.arc) { const [c, r, a0, a1] = mk.arc, p0 = add(c, [r * Math.cos(a0 * D2R), r * Math.sin(a0 * D2R)]), p1 = add(c, [r * Math.cos(a1 * D2R), r * Math.sin(a1 * D2R)]); inner += X.Lf(`M ${pt(p0)} A ${r} ${r} 0 0 1 ${pt(p1)} M ${f(c[0] - 3)},${f(c[1])} L ${f(c[0] + 3)},${f(c[1])} M ${f(c[0])},${f(c[1] - 3)} L ${f(c[0])},${f(c[1] + 3)}`, bw, col); }
      if (mk.cross) { const [c, r] = mk.cross; inner += X.Lf(`${circ(c[0], c[1], r)} M ${f(c[0] - r - 3)},${f(c[1])} L ${f(c[0] + r + 3)},${f(c[1])} M ${f(c[0])},${f(c[1] - r - 3)} L ${f(c[0])},${f(c[1] + r + 3)}`, bw, col); }
      if (mk.dim) { const [a, b] = mk.dim, u = unit(a, b), m = nrm(u); inner += X.Lf(`M ${pt(a)} L ${pt(lerp(a, b, 0.4))} M ${pt(lerp(a, b, 0.6))} L ${pt(b)} M ${pt(add(a, m, -4))} L ${pt(add(a, m, 4))} M ${pt(add(b, m, -4))} L ${pt(add(b, m, 4))}`, bw, col); }
    });
    return X.S(poly(pts), K.ink, 2.8, inner + X.art(dry(X, [pts[0][0] - 2, pts[0][1] + 6, pts[0][0] - 20, pts[0][1] + 60, pts[1][0] + 8, pts[1][1] - 10], 2.6, 3, K.ink300, 5)));
  };
})(window.PN);
// ---------- 덫 설계자 — part 2/2: poses, composition, anchors ----------
(function (PN) {
  const F = PN.fieldBosses, K = F.K, A = F._arc, { circ, ell, poly, smooth, lerp, add, unit, nrm, tfP, tg, tube, plane, drip, exclaim, dry, brushHead, gArc, speed, heap, puddle, f, pt, D2R } = F._;
  const C3 = K.ch3.deep, HIP = [196, 256];
  // cloak outline (idle). Peak = the high collar behind the bowed head (silhouette top ≈ y 124)
  const CLOAK = [[176, 124], [196, 136], [210, 158], [216, 196], [222, 214], [216, 244], [196, 251], [170, 263], [144, 277], [119, 286], [117, 262], [127, 220], [145, 170], [160, 137]];
  const LIT = [[170, 121], [184, 128], [168, 150], [179, 162], [156, 198], [167, 207], [140, 246], [121, 252], [126, 214], [146, 166]];
  const MARKS = [{ arc: [[150, 238], 30, -70, 8] }, { cross: [[178, 184], 8] }, { dim: [[132, 262], [190, 247]] }, { arc: [[196, 206], 14, 100, 196] }, { dim: [[150, 150], [172, 139]] }];

  A.rig = function (o) {
    const P = o.pose, fr = o.frame, T = (r, dx = 0, dy = 0) => ({ r, c: HIP, dx, dy });
    const R = { T: T(0), HT: { r: 12, c: A.NECK, dx: 0, dy: 0 }, cloak: CLOAK, hinge: [204, 254], tip: [262, 326], leg: [[186, 258], [172, 292], [154, 321]], foot: 148, sleeve: [[201, 207], [178, 233]], sq: { root: [176, 234], ang: -22 }, face: true };
    if (P === 'windup') Object.assign(R, { HT: { r: -2, c: A.NECK, dx: 0, dy: 0 }, cloak: CLOAK.map(([x, y], i) => (i >= 6 && i <= 10 ? [x - (i - 5) * 6, y - (i - 5) * 6.5] : i >= 11 ? [x - 6, y - 4] : [x, y])), tip: [296, 288], leg: [[186, 258], [178, 294], [152, 322]], sleeve: [[203, 207], [226, 222]], sq: { root: [236, 218], ang: -58, len: 110 } });
    if (P === 'attack') Object.assign(R, { T: T(4, 2, 6), HT: { r: 16, c: A.NECK, dx: 2, dy: 6 }, hinge: [224, 258], tip: [258, 330], leg: [[190, 262], [170, 298], [152, 322]], sleeve: [[204, 213], [182, 240]], sq: { root: [182, 240], ang: -6 }, spark: true });
    if (P === 'death' && fr === 0) Object.assign(R, { T: T(-8, -2, 0), HT: { r: -6, c: A.NECK, dx: -2, dy: 0 }, crack: true, sleeve: [[198, 204], [178, 232]], sq: { root: [188, 244], ang: 34 } });
    if (P === 'death' && fr === 1) Object.assign(R, { T: T(6, 2, 34), HT: { r: 20, c: A.NECK, dx: 4, dy: 34 }, crack: true, hinge: [210, 290], tip: [150, 322], leg: [[188, 292], [166, 322], [196, 326]], foot: 196, sleeve: [[204, 240], [190, 268]], hand: [206, 294], sq: { root: [244, 324], ang: 182, dropped: true } });
    if (P === 'death' && fr >= 2) R.face = false;
    return R;
  };

  F.parts.architect = function (X, o) {
    const R = A.rig(o), g = X.game, P = o.pose, fr = o.frame, T = R.T;
    let back = '', fig = '', over = '', face = '', front = '', under = '', top = '';
    if (P === 'death' && fr >= 2) return late(X, fr);
    // far leg = the steel compass (hinge at the hip → needle). Behind the cloak hem.
    fig += A.steel(X, R.hinge, R.tip, g ? 4.4 : 3.8, { needle: true });
    // near leg: bent human leg, booted foot on y 328
    const L = R.leg;
    fig += X.S(tube(L, [10, 8.4, 7]), K.ink, 2.6, `<path d="${tube(L.map((p) => add(p, [-3.6, -2])), [5, 4, 3.4])}" fill="${K.ink500}"/>`);
    fig += X.P(poly([[R.foot - 8, 318], [R.foot + 12, 316], [R.foot + 24, 322], [R.foot + 26, 328], [R.foot - 8, 328]]), K.ink, 2.4);
    // the cloak (moves with T)
    fig += tg(T, A.cloak(X, R.cloak, LIT, MARKS));
    [[128, 285, 11, 4.6], [152, 275, 9, 4.2], [178, 262, 12, 4.6]].forEach(([x, y, l, w]) => { const q = tfP([x, y], T); fig += drip(X, q[0], q[1], l, w); }); // world coords → the ground clamp holds
    fig += `<path d="${circ(R.hinge[0], R.hinge[1], g ? 8 : 7)}" fill="${C3}" ${X.O(1.8)}/><path d="${circ(R.hinge[0], R.hinge[1], 2.2)}" fill="${K.ink}"/>`;
    // head (hood + shaded face + strap), bowed/rolled by HT; the lens face plate on top (crisp)
    fig += tg(R.HT, A.head(X));
    face = tg(R.HT, A.face(X, { crack: R.crack, p2: o.p2, spark: R.spark }));
    // square arm: sleeve (shoulder → elbow) then the steel square from the elbow
    const sv = R.sleeve, sq = R.sq, arm = [...sv, sq.dropped ? R.hand : sq.root];
    over += X.S(tube(arm, [8, 7, 6]), K.ink700, 2.2, `<path d="${tube(arm.map((p) => add(p, [-3, -2.6])), [4, 3.4, 3])}" fill="${K.ink500}"/>`);
    over += sq.len ? squareLen(X, sq.root, sq.ang, sq.len, o.p2) : A.square(X, sq.root, sq.ang, { bent: o.p2 });
    if (P === 'attack') {
      // the compass has just drawn its circle round the needle: thin ink ellipse, brush head at the closing end
      const c = R.tip, rx = 26, ry = 11;
      under += X.L(`M ${f(c[0] + rx)},${f(c[1])} A ${rx} ${ry} 0 1 1 ${f(c[0] + rx * Math.cos(-0.5))},${f(c[1] + ry * Math.sin(-0.5))}`, 1.6, K.ink) + brushHead(X, c[0] + rx * Math.cos(-0.5), c[1] + ry * Math.sin(-0.5), -0.5 + Math.PI / 2, 0.6);
      under += `<path d="${ell(c[0], c[1] + 1, 4, 1.8)}" fill="${K.ink}"/>`;
    }
    if (P === 'windup') {
      front += X.L(gArc(R.hinge, 70, 14, 34, 1), 2, K.ink) + exclaim(X, ...add(A.headAt(R), [0, X.g(-23, -29)]), 1.1);
    }
    if (P === 'death' && fr === 1) front += drip(X, 150, 300, 10, 4) + drip(X, 236, 300, 12, 4.4);
    return { back, fig, over, face, front, under, top };
  };
  function squareLen(X, root, ang, len, bent) { // windup square: same tool, shorter reach so the short side stays in frame
    const g = X.game, w = g ? 4.2 : 3.6, u = [Math.cos(ang * D2R), Math.sin(ang * D2R)], m = nrm(u), corner = add(root, u, len), end = add(corner, m, bent ? 15 : 18);
    return A.steel(X, root, add(corner, u, w), w, { ticks: 4 }) + A.steel(X, add(corner, m, -w), end, w, {}) + `<path d="${circ(root[0], root[1], g ? 7 : 6)}" fill="${C3}" ${X.O(1.6)}/>`;
  }
  function late(X, fr) {
    let fig = '', face = '';
    if (fr === 2) {
      const H = heap(X, { cx: 186, w: 160, h: 78, lean: -6, seed: 12 });
      fig += A.steel(X, [214, 300], [286, 238], X.game ? 4.4 : 3.8, { needle: true }) + `<path d="${circ(214, 300, 7)}" fill="${C3}" ${X.O(1.8)}/>`;
      fig += H.s + drip(X, 120, 326, 10, 4.4) + drip(X, 240, 324, 8, 4);
      fig += X.Lf(`M 150,280 A 22 22 0 0 1 178,262`, X.g(1.1, 2.2), K.ink300);
      fig += A.square(X, [116, 318], -4, {});
    } else {
      fig += puddle(X, { seed: 8 });
      // folded compass (V lying flat), the square, the cracked lens lying face-up
      fig += A.steel(X, [150, 336], [246, 352], X.game ? 4.4 : 3.8, { needle: true }) + A.steel(X, [150, 336], [240, 324], X.game ? 4.4 : 3.8, { needle: true }) + `<path d="${circ(150, 336, 7)}" fill="${C3}" ${X.O(1.8)}/>`;
      fig += A.square(X, [118, 314], 4, {});
      face = A.face(X, { plate: Object.assign(plane([232, 312], 12, { yaw: 30, squash: 0.45, tilt: -10 }), {}), dead: true, crack: true, flat: true });
    }
    return { fig, face };
  }
  // '!' foot: above the whole silhouette top (the high collar ≈ y 121) and over the head, never on the lens
  A.headAt = (R) => (R.HT.r < 0 && !R.T.dy ? [226, 112] : [222 + (R.T.dx || 0), 114 + (R.T.dy || 0)]);
  F.anchorsOf.architect = function (o) {
    const R = A.rig(o.pose === 'death' && o.frame >= 2 ? { pose: 'idle', frame: 0 } : o), L = A.lens();
    const c = tfP(L(0, 0), R.HT), bx = [L(-56, -56), L(56, -56), L(56, 56), L(-56, 56)].map((q) => tfP(add(q, [-3, 0]), R.HT));
    const xs = bx.map((q) => q[0]), ys = bx.map((q) => q[1]);
    return {
      head: A.headAt(R).map(f), face: tfP(L(-7, -8), R.HT).map(f), faceBox: [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)].map(f),
      muzzle: R.tip.map(f), lens: c.map(f), hinge: R.hinge.slice(), square: { root: R.sq.root.slice(), ang: R.sq.ang },
      portrait: { center: [236, 185], scale: 0.2 }
    };
  };
})(window.PN);
// ---------- 초침 집행관 (executioner · Ch4 · clock) — part 1/2: dial face, hood, second-hand axe ----------
// 다섯 중 가장 큰 가는 기둥 + 꼭지가 뒤로 늘어져 갈고리처럼 꺾인 두건 + 가까운 어깨에 멘 초침 도끼(초승달 날, 둥근 균형추).
// 4장 기계선: 두건·옷단 외곽을 각지게 꺾는다. Face: 문자판 가면 = plane((216,154), R19, yaw30, squash 0.95).
(function (PN) {
  const F = PN.fieldBosses, K = F.K, { circ, ell, poly, smooth, runs, lerp, add, unit, nrm, rotP, tube, plane, pEll, pRing, fcrack, pcrack, dry, f, pt, D2R } = F._;
  const E = (F._exe = {});
  const C4 = K.ch4.deep;
  E.DC = [216, 154];
  E.dial = (c = E.DC, opt = {}) => plane(c, 19, { yaw: 30, squash: opt.squash || 0.95, tilt: opt.tilt || 0 });
  // dial angle (clock: 0 = 12 o'clock, clockwise deg) → design (u,v) at radius r
  const clk = (a, r) => [r * Math.sin(a * D2R), -r * Math.cos(a * D2R)];
  // face plate (face layer): bezel band on the left only, env.ch4.deep bezel, paper50 face, ticks (no numerals),
  // two vertical eye holes, the second hand (thin needle + crescent tip = the axe's echo + round tail), hour hand
  E.face = function (X, opt = {}) {
    const g = X.game, D = opt.plate || E.dial(), rim = g ? 6 : 3;
    const sh = D.back(g ? 5 : 4);
    let s = '';
    if (!opt.flat) s += `<path d="${smooth(pRing(D, 0, 0, 50, 50, 32).map((q) => add(q, sh)), true)}" fill="${K.ink700}" stroke="${K.ink}" stroke-width="${f(rim * 2)}" stroke-linejoin="round" paint-order="stroke"/>`;
    s += `<path d="${pEll(D, 0, 0, 50, 50, 32)}" fill="${C4}" stroke="${K.ink}" stroke-width="${f(opt.flat ? rim * 2 : g ? 2.6 : 1.4)}" paint-order="stroke"/>`;
    const faceD = pEll(D, 0, 0, 42, 42, 32), fc = X.clip(faceD);
    let fi = `<path d="${faceD}" fill="${opt.dead ? K.paper300 : K.paper50}"/>`;
    // ONE shadow mass: the hood eave's crescent across the top, thicker on the right; lower edge = the plate's arc.
    // flat paper300 in both details (art pitch-4.4 dots are coarser than this 3–5u band)
    fi += `<path d="${smooth([...pRing(D, 0, 0, 46, 46, 14, 186, 354), ...pRing(D, 6, -8, 42, 22, 14, 354, 186)], true)}" fill="${K.paper300}"/>`;
    // ticks: art 12 (12·3·6·9 long), game the 4 heavy ones only (F4: dots next to the eye holes made an insect face).
    // Same plane → the far side's ticks crowd.
    for (let i = 0; i < 12; i++) {
      const a = i * 30, major = i % 3 === 0;
      if (g && !major) continue;
      const r0 = major ? 30 : 34, p0 = D(...clk(a, r0)), p1 = D(...clk(a, 40));
      fi += X.Lf(`M ${pt(p0)} L ${pt(p1)}`, g ? 3 : major ? 1.6 : 0.9, K.ink);
    }
    // eye holes: frontal ±7, 6 up (local) → design ±18.4, −15.8; vertical slots, glint at the top
    const ew = g ? 6.6 : 4, eh = g ? 10.5 : 7.9;
    [-18.4, 18.4].forEach((u) => {
      const P2 = [[u, -15.8 - eh], [u + ew, -15.8 - eh * 0.55], [u + ew, -15.8 + eh * 0.6], [u, -15.8 + eh], [u - ew, -15.8 + eh * 0.6], [u - ew, -15.8 - eh * 0.55]].map(([a, b]) => D(a, b));
      fi += `<path d="${smooth(P2, true)}" fill="${K.ink}"/>`;
      if (!opt.dead) { const gp = D(u - ew * 0.2, -15.8 - eh * 0.45); fi += `<path d="${circ(gp[0], gp[1], g ? 1.4 : 1)}" fill="${K.paper50}"/>`; }
    });
    // hands: second hand (needle 1.8, crescent tip, round tail) + short hour hand + centre dot
    // hour hand: art at 3 o'clock; game at 4 — at 3 its thick game stroke ran 0.3 under the far eye hole (F4)
    const sa = opt.sec == null ? 210 : opt.sec, ha = opt.hour == null ? (g ? 120 : 90) : opt.hour;
    // game (F4): tail 6 with a r1.6 weight and a 13-long hour hand, so the hub stays a hub (no nose, no mouth line)
    const tipP = clk(sa, 34), tailP = clk(sa + 180, g ? 6 : 10), bendK = opt.bent ? 8 : 0;
    const midP = clk(sa + bendK, 20);
    fi += X.Lf(`M ${pt(D(...tailP))} L ${pt(D(0, 0))} L ${pt(D(...midP))} L ${pt(D(...tipP))}`, g ? 2.6 : 1.8, K.ink);
    fi += `<path d="${smooth([D(...add(clk(sa, 34), clk(sa - 90, 6))), D(...clk(sa, 40)), D(...add(clk(sa, 34), clk(sa + 90, 6))), D(...clk(sa, 36))], true)}" fill="${K.ink}"/>`;
    fi += `<path d="${circ(...D(...tailP), g ? 1.6 : 2)}" fill="${K.ink}"/>`;
    fi += X.Lf(`M ${pt(D(0, 0))} L ${pt(D(...clk(ha, g ? 13 : 20)))}`, g ? 3.4 : 2.4, K.ink);
    fi += `<path d="${circ(...D(0, 0), g ? 2.6 : 1.8)}" fill="${K.ink}"/>`;
    if (opt.crack) fi += fcrack(X, [D(-38, 22), D(-28, 14), D(-30, 6), D(-18, 2), D(-8, 4)], g ? 2.4 : 1.3);
    if (opt.p2) fi += pcrack(X, [D(34, 30), D(24, 18), D(30, 8), D(14, 6), D(6, 14)]);
    s += `<g clip-path="url(#${fc})">${fi}</g>`;
    // accent: the bezel's inner lower-right ink line
    s += `<path d="${smooth(pRing(D, 0, 0, 43, 43, 10, 15, 85))}" fill="none" stroke="${K.ink}" stroke-width="${f(g ? 2.4 : 1.3)}" stroke-linecap="round"/>`;
    return s;
  };
  // hood: tall cone whose tip droops BACK and hooks (never stands up = not a mitre). Hard mechanical bends (Ch4).
  // outline: near side up → under the drooping tip (the hook's underside) → hook end → over the top → crown → far side
  E.HOOD = [[188, 194], [180, 170], [181, 148], [186, 134], [180, 127], [170, 131], [164, 141], [158, 137], [157, 127], [164, 117], [178, 110], [194, 109], [210, 112], [226, 125], [236, 142], [241, 164], [239, 188], [231, 198]];
  // attack: the tip whips forward over the crown instead of hanging back
  E.HOOD_FWD = [[188, 194], [180, 170], [181, 148], [188, 128], [198, 114], [212, 106], [230, 104], [246, 110], [254, 122], [252, 134], [246, 128], [236, 122], [228, 124], [236, 142], [241, 164], [239, 188], [231, 198]];
  E.hood = function (X, opt = {}) {
    const g = X.game, pts = opt.fwd ? E.HOOD_FWD : E.HOOD;
    const lit = opt.fwd ? [[176, 194], [176, 160], [184, 132], [200, 112], [214, 104], [204, 118], [192, 134], [186, 156], [188, 178], [184, 196]]
      : [[176, 194], [176, 160], [182, 136], [184, 128], [170, 122], [160, 120], [166, 110], [182, 104], [196, 104], [186, 116], [188, 134], [184, 156], [188, 178], [184, 196]];
    let s = X.S(poly(pts), K.ink, 2.8, `<path d="${poly(lit)}" fill="${K.ink500}"/>` + X.art(dry(X, [180, 178, 180, 146, 192, 118], 2, 2, K.ink300, 7)));
    // the opening: an ink ring round the dial (≥ 6 in game); the dial sits right of the hood's centre
    s += `<path d="${ell(E.DC[0] + 1, E.DC[1] + 0.4, g ? 23 : 20.6, g ? 24.4 : 21.6)}" fill="${K.ink}" stroke="${K.ink500}" stroke-width="${f(g ? 2 : 1.2)}"/>`;
    return s;
  };
  // second-hand axe: thin needle shaft (ink + one env.ch4.deep inlay band) · crescent blade at the tip (ink300, paper50
  // edge arc) · round counterweight tail (env.ch4.deep, centre hole, ink500 glint arc, 7 small teeth)
  E.axe = function (X, blade, tail, opt = {}) {
    const g = X.game, u = unit(tail, blade), m = nrm(u), L = Math.hypot(blade[0] - tail[0], blade[1] - tail[1]), w = g ? 3.6 : 2.8;
    let s = X.S(poly([add(tail, m, -w), add(blade, m, -w * 0.7), add(blade, m, w * 0.7), add(tail, m, w)]), K.ink, 1.8, `<path d="${poly([add(add(tail, u, L * 0.3), m, -w), add(add(tail, u, L * 0.36), m, -w), add(add(tail, u, L * 0.36), m, w), add(add(tail, u, L * 0.3), m, w)])}" fill="${C4}"/>`);
    // crescent blade beside the shaft tip: its chord runs along the shaft, the cutting edge bulges out to `side`
    // (local frame at the tip: x along the shaft, y out to the blade side). F6: the blade meets the shaft only at the
    // middle neck (|t| ≤ 0.25); the horns curl out to 21–22 from the shaft line, leaving a background notch at each
    // horn (the silhouette reads as a C crescent, not a ladle). Outer bulge 35.
    const sd = opt.side || 1, bm = [m[0] * sd, m[1] * sd], B = (x, y) => add(add(blade, u, x), bm, y);
    const outer = [], inner = [], back = (t) => (Math.abs(t) <= 0.25 ? 5 : 5 + 16 * Math.sqrt((Math.abs(t) - 0.25) / 0.75));
    for (let i = 0; i <= 12; i++) { const t = -1 + (2 * i) / 12; outer.push(B(-9 + t * 34 - (t < 0 ? t * t * 3 : 0), 22 + 13 * (1 - t * t))); }
    for (let i = 24; i >= 0; i--) { const t = -1 + (2 * i) / 24; inner.push(B(-9 + t * 33 - (t < 0 ? t * t * 2.6 : 0), back(t))); }
    const bd = smooth(outer) + ' L ' + smooth(inner).replace(/^M /, '') + ' Z';
    let bi = X.L(smooth(outer.slice(2, 11).map((q) => add(q, bm, -2.4))), g ? 1.4 : 1, K.paper50);
    if (opt.notch) { const q = outer[7]; bi += `<path d="${poly([add(q, bm, 3), add(add(q, bm, -8), u, -4.4), add(add(q, bm, -8), u, 4.4)])}" fill="${K.ink}"/>`; }
    s += X.S(bd, K.ink300, 2, bi + `<path d="${poly([...inner.slice(0, 13), B(-9, 14)])}" fill="${K.ink500}"/>`);
    s += `<path d="${circ(...B(-9, 1), g ? 4.4 : 3.6)}" fill="${C4}" ${X.O(1.2)}/>`; // the blade's socket on the shaft
    // counterweight disc (the second hand's tail)
    const cw = add(tail, u, -10), rr = 11;
    let teeth = '';
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.3, p = add(cw, [Math.cos(a), Math.sin(a)], rr + 1.6); teeth += `<path d="${circ(p[0], p[1], 2.2)}" fill="${C4}" ${X.O(0.8)}/>`; }
    s += teeth + `<path d="${circ(cw[0], cw[1], rr)}" fill="${C4}" ${X.O(1.8)}/><path d="${circ(cw[0], cw[1], 3)}" fill="${K.ink}"/>` + X.L(`M ${pt(add(cw, [-7, -3]))} A 7.6 7.6 0 0 1 ${pt(add(cw, [-2, -7.4]))}`, 1.4, K.ink500);
    return s;
  };
})(window.PN);
// ---------- 초침 집행관 — part 2/2: column body, poses, composition, anchors ----------
(function (PN) {
  const F = PN.fieldBosses, K = F.K, E = F._exe, { circ, ell, poly, smooth, lerp, add, unit, nrm, tfP, tg, tube, plane, drip, exclaim, dry, gArc, heap, puddle, f, pt, D2R } = F._;
  const C4 = K.ch4.deep, FEET = [196, 328];
  const MANTLE = [[170, 190], [190, 182], [224, 184], [246, 194], [251, 214], [241, 209], [237, 222], [226, 213], [214, 224], [204, 212], [192, 223], [181, 210], [169, 219], [165, 203]];
  const ROBE = [[176, 200], [244, 203], [246, 250], [248, 296], [252, 317], [236, 318], [226, 312], [216, 318], [200, 314], [186, 318], [172, 316], [173, 296], [172, 250]];
  E.rig = function (o) {
    const P = o.pose, fr = o.frame, T = (r, dx = 0, dy = 0) => ({ r, c: FEET, dx, dy });
    const R = { T: T(0), blade: [116, 114], tail: [212, 232], side: -1, hands: { n: null }, sec: 210, face: true, kneel: false };
    if (P === 'windup') Object.assign(R, { T: T(-6), blade: [212, 50], tail: [244, 182], side: -1, hn: [238, 150], hf: [241, 168], sec: 0 });
    if (P === 'attack') Object.assign(R, { T: T(10, 2, 0), blade: [284, 306], tail: [224, 222], side: 1, hn: [234, 234], hf: [248, 248], sec: 6, fwd: true });
    if (P === 'death' && fr === 0) Object.assign(R, { T: T(-8), blade: [112, 140], tail: [204, 240], crack: true, bent: true, sec: 214 });
    if (P === 'death' && fr === 1) Object.assign(R, { T: T(6, 2, 40), kneel: true, blade: [96, 268], tail: [196, 312], side: 1, crack: true, bent: true, sec: 214 });
    if (P === 'death' && fr >= 2) R.face = false;
    // idle-like poses: the near hand holds the shaft 14 up from its tail (the shaft rests on the near shoulder)
    if (!R.hn) { const u = unit(R.tail, R.blade); R.hn = add(R.tail, u, 14); R.hf = tfP([244, 258], R.T); }
    return R;
  };
  E.headAt = (R) => (R.hn && R.blade[1] < 100 ? [262, 96] : tfP([204, 98], R.T));

  F.parts.executioner = function (X, o) {
    const R = E.rig(o), g = X.game, P = o.pose, fr = o.frame, T = R.T;
    let back = '', fig = '', over = '', face = '', front = '', under = '', top = '';
    if (P === 'death' && fr >= 2) return late(X, fr);
    // feet (stay on the ground)
    fig += X.P(poly([[178, 314], [200, 314], [206, 328], [176, 328]]), K.ink, 2.4) + X.P(poly([[216, 314], [238, 314], [246, 328], [214, 328]]), K.ink700, 2.4);
    // the column: robe (ink700 tunic; its far side ink), two ink500 wedges, chest dots 20/40%; hard-bent hem
    const yb = R.kneel ? 270 : 322; // interior shading stops at the (shortened) hem so nothing hidden pads the bounds
    let ri = `<path d="${poly([[218, 196], [252, 196], [254, yb], [220, yb], [226, Math.min(290, yb)], [216, 250]])}" fill="${K.ink}"/>`;
    ri += `<path d="${poly([[168, 196], [192, 198], [184, 226], [194, 236], [180, 262], [168, 262]])}" fill="${K.ink500}"/>` + (R.kneel ? '' : `<path d="${poly([[168, 270], [182, 270], [178, 292], [188, 300], [176, 322], [168, 322]])}" fill="${K.ink500}"/>`);
    ri += `<path d="${poly([[190, 204], [214, 204], [210, 240], [192, 240]])}" fill="${X.pat('d20')}"/><path d="${poly([[200, 214], [214, 214], [210, 240], [198, 240]])}" fill="${X.pat('d40')}"/>`;
    if (R.kneel) {
      fig += tg(T, X.S(poly([[176, 200], [244, 203], [246, 250], [252, 266], [222, 270], [196, 266], [172, 266], [172, 250]]), K.ink700, 2.8, ri));
      fig += X.S(poly([[150, 296], [214, 286], [262, 296], [266, 328], [146, 328]]), K.ink, 2.8, `<path d="${poly([[146, 296], [180, 290], [170, 310], [176, 328], [146, 328]])}" fill="${K.ink500}"/>`); // robe pooled round the knees
    } else fig += tg(T, X.S(poly(ROBE), K.ink700, 2.8, ri));
    fig += tg(T, X.P(poly([[173, 244], [246, 247], [246, 256], [173, 253]]), K.ink, 1.8) + `<rect x="198" y="243" width="14" height="13" rx="1.4" fill="${C4}" ${X.O(1.2)}/><rect x="203" y="247" width="4" height="5" fill="${K.ink}"/>`);
    fig += R.kneel ? drip(X, 156, 328, 7, 4) + drip(X, 258, 327, 9, 4.2) + drip(X, 214, 328, 6, 3.6) : tg(T, drip(X, 180, 316, 9, 4) + drip(X, 228, 314, 11, 4.4) + drip(X, 248, 316, 8, 4));
    // far arm (hangs, ink700) → behind the axe; the axe; near arm over it
    const shF = tfP([242, 208], T), shN = tfP([182, 204], T);
    fig += X.S(tube([shF, lerp(shF, R.hf, 0.55).map((v, i) => v + (i ? 0 : 6)), R.hf], [8.4, 7.4, 6.6]), K.ink700, 2.4, '');
    fig += tg(T, X.S(poly(MANTLE), K.ink, 2.6, `<path d="${poly([[166, 192], [192, 182], [206, 184], [190, 196], [196, 204], [176, 210], [168, 218]])}" fill="${K.ink500}"/>`));
    fig += tg(T, E.hood(X, { fwd: R.fwd }));
    over += E.axe(X, R.blade, R.tail, { side: R.side, notch: o.p2 });
    const elN = P === 'windup' ? [212, 196] : P === 'attack' ? [214, 240] : add(lerp(shN, R.hn, 0.5), [-12, 10]);
    over += X.S(tube([shN, elN, R.hn], [9, 7.8, 6.8]), K.ink, 2.4, `<path d="${tube([add(shN, [-3, -3]), add(elN, [-3, -3]), add(R.hn, [-3, -3])], [4.4, 3.8, 3.2])}" fill="${K.ink500}"/>`);
    [R.hf, R.hn].forEach((p) => { over += `<path d="${ell(p[0], p[1], 7.8, 6.8)}" fill="${K.ink}" ${X.O(1.8)}/>` + X.L(`M ${f(p[0] - 4)},${f(p[1] - 4)} L ${f(p[0] + 3)},${f(p[1] - 5)}`, 1.1, K.ink500); });
    face = tg(T, E.face(X, { sec: R.sec, crack: R.crack, bent: R.bent, p2: o.p2 }));
    if (P === 'attack') {
      // the blade bites the ground ahead: 7 short ink ticks on an arc round the impact (the clock's echo)
      const c = [288, 326];
      for (let i = 0; i < 7; i++) { const a = (-160 + i * 26) * D2R, p0 = [c[0] + Math.cos(a) * 30, c[1] + Math.sin(a) * 30 * 0.42], p1 = [c[0] + Math.cos(a) * 40, c[1] + Math.sin(a) * 40 * 0.42]; under += X.L(`M ${pt(p0)} L ${pt(p1)}`, i % 3 === 0 ? 2.4 : 1.6, K.ink); }
      under += X.L(gArc(c, 22, -170, -10, 0.42), 1.4, K.ink);
    }
    if (P === 'windup') front += exclaim(X, ...add(E.headAt(R), [0, X.g(-23, -29)]), 1.1) + X.L(gArc([212, 116], 76, -150, -112, 1), 2.2, K.ink);
    return { back, fig, over, face, front, under, top };
  };
  function late(X, fr) {
    let fig = '', face = '';
    if (fr === 2) {
      const H = heap(X, { cx: 188, w: 162, h: 90, lean: 10, seed: 15 });
      fig += E.axe(X, [102, 300], [196, 262], { side: 1 }) + H.s + drip(X, 122, 326, 10, 4.4) + drip(X, 252, 326, 9, 4);
      fig += X.P(poly([[188, 250], [208, 240], [222, 250], [214, 262]]), K.ink, 2, ''); // hood tip surfacing
      face = E.face(X, { plate: plane([282, 296], 19, { yaw: 72, squash: 0.98, tilt: 6 }), sec: 214, hour: 300, crack: true, flat: true }); // the dial mask rolled away on its edge
    } else {
      fig += puddle(X, { seed: 10 });
      fig += E.axe(X, [270, 344], [128, 312], { side: -1 }); // edge up on the pool: the larger crescent stays in the box
      face = E.face(X, { plate: plane([204, 336], 17, { yaw: 0, squash: 0.42, tilt: -6 }), sec: 214, hour: 300, dead: true, flat: true }); // face-up, hands stopped
    }
    return { fig, face };
  }
  F.anchorsOf.executioner = function (o) {
    const R = E.rig(o.pose === 'death' && o.frame >= 2 ? { pose: 'idle', frame: 0 } : o), D = E.dial();
    const eyes = [D(-18.4, -15.8), D(18.4, -15.8)].map((q) => tfP(q, R.T));
    const bx = [D(-50, -50), D(50, -50), D(50, 50), D(-50, 50)].map((q) => tfP(add(q, [-2, 0]), R.T)), xs = bx.map((q) => q[0]), ys = bx.map((q) => q[1]);
    const u = unit(R.tail, R.blade);
    return {
      head: E.headAt(R).map(f), face: lerp(eyes[0], eyes[1], 0.35).map(f), faceBox: [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)].map(f),
      muzzle: (o.pose === 'attack' ? [290, 326] : add(R.blade, u, 2)).map(f), ticks: F.BOX.feet.slice(), dial: tfP(D(0, 0), R.T).map(f), counterweight: add(R.tail, u, -10).map(f),
      portrait: { center: [214, 153], scale: 0.23 }
    };
  };
})(window.PN);
// ---------- 무음 심판관 (judge · Ch5 · null) — part 1/2: paper mask face, cylinder hat, gavel, brush ----------
// 가늘고 긴 먹 기둥(다섯 중 가장 어둡다) + 꼭대기가 평평하고 위로 조금 벌어진 높은 원통 모자(날개 없음, §9-5 기본안)
// + 가슴 앞의 T자 의사봉. 5장: 옷단 가장자리가 투명하게 지워진 물림 2곳(굵은 먹테는 몸 알파로 가린다).
// Face: wrap(202,170) ρ18 yaw30, 5° 숙임. 판결문 백지 가면(phi −70°~+60°), 일식 고리 눈 둘, 흰 실로 꿰맨 입.
(function (PN) {
  const F = PN.fieldBosses, K = F.K, { circ, ell, poly, smooth, lerp, add, unit, nrm, tube, wrap, jag, dRing, fcrack, pcrack, dry, f, pt, D2R } = F._;
  const J = (F._jdg = {});
  J.HC = [202, 170]; J.RHO = 18;
  const W = wrap(J.HC, J.RHO, { look: 0.15 }); // 5° bow on the ≈10° view: same look-down as the hat (0.17), R2
  J.W = W;
  // the far cheekbone stands 1.2 further out at eye height (F3: the far eye's ring ends ≥ 1.5 inside this contour)
  J.HEAD = smooth([[185.4, 150], [184.6, 163], [186, 176], [190.6, 186], [200, 191.4], [210.6, 191], [216.8, 183.6], [218.6, 175], [221.6, 166.4], [220.6, 156], [218, 149]], true);
  J.FAR_EYE = 25; // phi of the far eye (brief 28°, F3 25°): with the smaller rings and the cheekbone its outer end is 2.4 inside
  // paper mask outline: under the band (h −20) → far contour (cheekbone bend) → torn jaw edge (toothed) → into the coif
  J.maskD = (opt = {}) => {
    const top = []; for (let p = -70; p <= 58; p += 8) top.push(W.p(p, -20));
    const far = [[220.6, 156], [221.6, 166.4], [218.6, 175], [216.8, 183.6]];
    const tear = [[50, 13], [40, 17.6], [33, 15], [24, 19.6], [14, 17], [4, 20.6], [-6, 17.8], [-16, 20.4], [-28, 17], [-40, 19], [-52, 15.6], [-62, 17], [-70, 14]].map(([p, h]) => W.p(p, h + (opt.drop || 0)));
    return smooth([...top, ...far]) + ' L ' + tear.map(pt).join(' L ') + ' Z';
  };
  // the mouth: ink band on the midline (phi ±22°), corners droop. Stitches = single VERTICAL paper50 stitches across the
  // band (length = band + 3.6), crowding toward the far side but keeping a gap ≥ 1.5 between neighbours along their
  // whole length. No X: a row of X reads as letters (§1.1, F2).
  // leans (deg, + = top toward the near side): one side, irregular. Alternating ±10° paired neighbours into V / Λ
  // ("\/\/\" read as a zigzag at 8×) and closed the converging ends to 0.4; these neighbour differences keep every
  // gap ≥ 1.5 (the far, tightest pair is parallel). Also used by the flat death mask.
  J.LEAN = { art: [10, 3, 7, 5, 5], game: [10, 3, 7] };
  // stitch positions: on-screen steps shrink by ×0.95 toward the far side (the turn crowds them) across the band
  // phi −20°…+21°; with 5 stitches the smallest step is 2.5 (gap ≥ 1.5 at width 1.0), with 3 it is 5.3
  J.stitchPhis = (n) => {
    const x0 = W.p(-20, 0)[0], x1 = W.p(21, 0)[0], q = 0.95, steps = [];
    for (let i = 0; i < n - 1; i++) steps.push(q ** i);
    const s0 = (x1 - x0) / steps.reduce((a, b) => a + b, 0), out = [];
    let x = x0;
    for (let i = 0; i < n; i++) { out.push(Math.asin(Math.max(-1, Math.min(1, (x - W.c[0]) / W.rho))) / D2R - W.yaw); if (i < n - 1) x += s0 * steps[i]; }
    return out;
  };
  J.mouth = function (X, opt = {}) {
    const g = X.game, th = g ? 4.6 : 2.8, n = g ? 3 : 5, h0 = 11.4, open = opt.open ? 1.6 : 0, sw = g ? 1.6 : 1;
    const drop = (p) => (Math.abs(p) > 16 ? (Math.abs(p) - 16) * 0.22 : 0);
    const P = []; for (let p = -22; p <= 22; p += 4) P.push(W.p(p, h0 + drop(p)));
    const up = P.map((q) => [q[0], q[1] - th / 2 - open * 0.5]), dn = P.map((q, i) => [q[0], q[1] + th / 2 + open * Math.sin((i / (P.length - 1)) * Math.PI)]);
    let s = `<path d="${smooth(up) + ' L ' + smooth(dn.slice().reverse()).replace(/^M /, '')} Z" fill="${K.ink}"/>`;
    const half = (th + 3.6) / 2;
    J.stitchPhis(n).forEach((phi, i) => {
      const c = W.p(phi, h0 + drop(phi)), lean = J.LEAN[g ? 'game' : 'art'][i] * D2R, dx = Math.sin(lean) * half, dy = Math.cos(lean) * half;
      if (opt.broken && i === Math.floor(n / 2)) { // one stitch snapped: two short loose ends, the band shows between them
        s += X.Lf(`M ${f(c[0] - dx)},${f(c[1] - dy)} L ${f(c[0] - dx * 0.25)},${f(c[1] - dy * 0.3)} M ${f(c[0] + dx * 0.4)},${f(c[1] + dy * 0.45)} L ${f(c[0] + dx)},${f(c[1] + dy)}`, sw, K.paper50);
        return;
      }
      s += X.Lf(`M ${f(c[0] - dx)},${f(c[1] - dy)} L ${f(c[0] + dx)},${f(c[1] + dy)}`, sw, K.paper50);
    });
    return s;
  };
  // eclipse-ring eye on the cylinder: ink outer ring → paper50 thin ring → ink disc (iris); glint upper-left of the iris
  // F3 sizes: the near eye's outer diameter ≤ 36% of the mask width (30). art: paper ring 3.8, black disc 2.4, outer ink
  // ring +1.0 (Ø 9.6). game: black disc 3.0 kept, paper ring 4.3, outer ring +1.0 (Ø 10.6) — r 5 + 1.4 would be Ø 12.8 = 43%
  J.EYE = { art: { ring: 1.0, paper: 3.8, disc: 2.4, glint: 0.8 }, game: { ring: 1.0, paper: 4.3, disc: 3.0, glint: 1.0 } };
  J.eye = function (X, phi, h, opt = {}) {
    const e = J.EYE[X.game ? 'game' : 'art'], M = W.at(phi, h);
    let s = `<path d="${dRing(M, e.paper + e.ring)}" fill="${K.ink}"/><path d="${dRing(M, e.paper)}" fill="${K.paper50}"/>`;
    s += `<path d="${dRing(M, e.disc)}" fill="${K.ink}"/>`;
    if (!opt.dead) { const q = M(-e.disc * 0.3, -e.disc * 0.35); s += `<path d="${circ(q[0], q[1], e.glint)}" fill="${K.paper50}"/>`; }
    return s;
  };
  J.face = function (X, opt = {}) {
    const g = X.game, mask = J.maskD(), mc = X.clip(mask);
    let s = `<path d="${mask}" fill="${K.paper}" stroke="${K.ink}" stroke-width="${f(g ? 2.4 : 1.3)}" stroke-linejoin="round"/>`;
    // ONE shadow mass: the far cheek turning away (phi > 36°), temple → jaw; flat paper300 (game & art: the band is 4u)
    let inner = `<path d="${smooth([W.p(34, -21), W.p(37, -10), W.p(36, -1), W.p(39, 6), W.p(36, 13), W.p(30, 21), [222, 196], [224, 150]], true)}" fill="${K.paper300}"/>`;
    // art: two crumple lines on the blank sheet (thin ink300), following the wrap
    inner += X.art(X.Lf(smooth([W.p(-60, -12), W.p(-50, -6), W.p(-44, 2)]), 0.8, K.ink300) + X.Lf(smooth([W.p(18, 14), W.p(26, 9), W.p(30, 1)]), 0.8, K.ink300));
    // nose: bridge in thin ink300 (art) + the accent: an ink nostril wedge under the tip toward the NEAR side
    inner += X.art(X.Tf([...W.p(-1, -7), ...W.p(1, -1), ...W.p(4, 4.6)], 1.1, 'mid', K.ink300));
    inner += `<path d="${poly([W.p(5, 5.4), W.p(-8, 6.8), W.p(-2, 8.8)])}" fill="${K.ink}"/>`;
    if (opt.crack) inner += fcrack(X, [W.p(-52, -18), W.p(-44, -10), W.p(-48, -2), W.p(-38, 6)], g ? 2.4 : 1.3);
    s += `<g clip-path="url(#${mc})">${inner}</g>`;
    // brows: heavy ink brush strokes, thick at the nose end, slanting DOWN toward the nose (stern), ≥ 1 clear of the
    // rings. The far one is short and follows the far eye (phi 25°).
    const bl = g ? -1.8 : 0; // game: the brows sit clear of the eye rings under the hat band's outline
    s += X.Tf([...W.p(-48, -9.6 + bl), ...W.p(-30, -12 + bl), ...W.p(-12, -8.6 + bl)], g ? 4.4 : 3, 'end', K.ink);
    s += X.Tf([...W.p(38, -11.2 + bl), ...W.p(26, -12 + bl), ...W.p(10, -10.6 + bl)], g ? 3.8 : 2.6, 'end', K.ink);
    // eyes (Ch5 eclipse rings); the far eye's inner end tucks behind the nose bridge
    s += J.eye(X, -28, -4, opt) + J.eye(X, J.FAR_EYE, -4, opt);
    s += X.Tf([...W.p(7, -6.6), ...W.p(8.6, -2), ...W.p(8, 2)], g ? 2.6 : 1.6, 'mid', K.paper);
    s += J.mouth(X, { broken: opt.broken, open: opt.open });
    return s;
  };
  // tall cylinder hat (flat top, flares a touch upward, no wings): ink front + left ink500 band, ink700 top oval,
  // paper300 band with 3 white stitches (they answer the mouth). Drawn in `top`, in front of the face.
  J.hat = function (X, opt = {}) {
    // a hard cylinder: its band and top oval share ONE elevation (≈10°: ry/rx 0.17), so the hat reads as one solid
    const g = X.game, Wb = wrap(J.HC, J.RHO + 1.6, { look: 0.17 });
    const tc = [J.HC[0], J.HC[1] - 56], trx = J.RHO + 4.6, tra = 0.17 * (J.RHO + 4.6);
    const bT = [], bB = [], cT = [];
    for (let p = -120; p <= 60; p += 12) { bT.push(Wb.p(p, -26)); bB.push(Wb.p(p, -19.4)); const a = (p + 30) * D2R; cT.push([tc[0] + trx * Math.sin(a), tc[1] + tra * Math.cos(a)]); }
    const body = smooth(cT) + ` L ${pt(bT[bT.length - 1])} ` + smooth(bT.slice().reverse()).replace(/^M \S+/, '') + ' Z';
    let s = X.S(body, K.ink, 2.8, `<path d="${poly([add(cT[0], [-4, -4]), add(cT[3], [0, -4]), add(bT[3], [0, 2]), add(bT[0], [-4, 2])])}" fill="${K.ink500}"/>` + X.art(dry(X, [...add(cT[1], [2, 2]), ...lerp(cT[1], bT[1], 0.5), ...add(bT[1], [2, -2])], 1.6, 2, K.ink300, 4)));
    s += X.S(ell(tc[0], tc[1], trx, tra), K.ink700, 2.2, `<path d="${ell(tc[0] - 5, tc[1] - 1.6, trx * 0.6, tra * 0.5)}" fill="${K.ink500}"/>`);
    const band = smooth(bT) + ` L ${pt(bB[bB.length - 1])} ` + smooth(bB.slice().reverse()).replace(/^M \S+/, '') + ' Z';
    s += X.P(band, K.paper300, 1.6);
    // three white running stitches: short dashes ALONG the band's arc (홈질, R4) — no slanted marks that read as hatching
    [-64, -30, 4].forEach((p) => { const d = smooth([-7, -2.5, 2.5, 7].map((dp) => Wb.p(p + dp, -22.7))); s += X.Lf(d, g ? 3.4 : 2.2, K.ink) + X.Lf(d, g ? 1.6 : 1, K.paper50); });
    if (opt.p2) s += pcrack(X, [Wb.p(-90, -27), Wb.p(-70, -21), Wb.p(-50, -25), Wb.p(-28, -20), Wb.p(-6, -24)]);
    return s;
  };
  // T gavel: ink handle + ink700 head with two ink500 bands. head = centre of the mallet, ang = handle direction (deg)
  J.gavel = function (X, head, ang) {
    const g = X.game, u = [Math.cos(ang * D2R), Math.sin(ang * D2R)], m = nrm(u), hw = g ? 3.2 : 2.6;
    const end = add(head, u, 34);
    let s = X.P(poly([add(head, m, -hw), add(end, m, -hw * 0.8), add(end, m, hw * 0.8), add(head, m, hw)]), K.ink, 1.6);
    const a = add(head, m, -12), b = add(head, m, 12), r = g ? 7 : 6;
    s += X.S(poly([add(a, u, -r), add(b, u, -r), add(b, u, r), add(a, u, r)]), K.ink700, 2, X.L(`M ${pt(add(add(head, m, -6), u, -r - 1))} L ${pt(add(add(head, m, -6), u, r + 1))} M ${pt(add(add(head, m, 6), u, -r - 1))} L ${pt(add(add(head, m, 6), u, r + 1))}`, 2.2, K.ink500));
    s += `<path d="${ell(a[0], a[1], 2.6, r)}" fill="${K.ink500}" transform="rotate(${f(ang)} ${f(a[0])} ${f(a[1])})"/>`;
    return s;
  };
  // the brush held upside down (bristles up): bamboo handle ink300 with knots, paper300 bristles
  J.brush = function (X, hand, tipP) {
    const u = unit(hand, tipP), m = nrm(u), L = Math.hypot(tipP[0] - hand[0], tipP[1] - hand[1]), neck = add(hand, u, L * 0.62), base = add(hand, u, -14);
    let s = X.P(poly([add(base, m, -2.4), add(neck, m, -2.4), add(neck, m, 2.4), add(base, m, 2.4)]), K.ink300, 1.4) + X.L(`M ${pt(add(add(hand, u, 8), m, -2.6))} L ${pt(add(add(hand, u, 8), m, 2.6))}`, 1.2, K.ink);
    s += X.P(`M ${pt(add(neck, m, -4))} C ${pt(add(add(neck, u, 10), m, -5.4))} ${pt(add(tipP, m, -1.6))} ${pt(tipP)} C ${pt(add(tipP, m, 1.6))} ${pt(add(add(neck, u, 10), m, 5.4))} ${pt(add(neck, m, 4))} Z`, K.paper300, 1.6);
    return s;
  };
})(window.PN);
// ---------- 무음 심판관 — part 2/2: robe column, poses, erased bites, composition, anchors ----------
(function (PN) {
  const F = PN.fieldBosses, K = F.K, J = F._jdg, { circ, ell, poly, smooth, lerp, add, unit, nrm, tfP, tg, tube, plane, pEll, jag, drip, exclaim, dry, gArc, heap, puddle, f, pt, D2R } = F._;
  const FEET = [204, 328];
  const ROBE = [[180, 196], [226, 198], [234, 240], [238, 290], [241, 325], [166, 325], [169, 290], [172, 240]];
  const COLLAR = [[187, 187], [200, 192.6], [213.6, 192], [221, 186.4], [225, 194], [214, 201], [198, 202], [185, 197]];
  const COIF = [[182, 150], [180.4, 168], [184, 186], [194, 196], [205, 197], [193, 185], [188.6, 168], [190.4, 151]];
  const NEAR_SLV = [[179, 202], [193, 206], [207, 221], [229, 222], [239, 231], [243, 262], [227, 270], [209, 266], [199, 252], [185, 237], [175, 218]];
  // idle (F7): the forearm reaches out to a fist at (248,224) so the raised T gavel clears the body by ≥ 6 in silhouette
  const NEAR_SLV_OUT = [[179, 202], [193, 206], [210, 216], [236, 214], [248, 221], [252, 258], [236, 266], [214, 262], [200, 250], [185, 237], [175, 218]];
  const FAR_SLV = [[222, 200], [236, 210], [244, 246], [256, 284], [232, 288], [228, 262], [224, 230]];
  // erased bites (true transparency): two across the robe's lower side contours (the bottom outline stays whole) + far cuff
  const BITES = [[[158, 284], [176, 287], [186, 294], [181, 304], [158, 307]], [[227, 300], [240, 295], [252, 297], [252, 316], [233, 314]], [[246, 272], [260, 268], [262, 284], [249, 286]]];

  J.rig = function (o) {
    const P = o.pose, fr = o.frame, T = (r, dx = 0, dy = 0) => ({ r, c: FEET, dx, dy });
    const R = { T: T(0), hatT: null, gavel: { head: [238, 207], ang: 95 }, fist: [236, 227], arm: 'chest', face: true };
    if (P === 'idle') Object.assign(R, { gavel: { head: [262.4, 193.2], ang: 115 }, fist: [248, 224], arm: 'chestOut' });
    if (P === 'windup') Object.assign(R, { T: T(-4), arm: 'down', gavel: null, fist: null, raise: { hand: [258, 124], tip: [276, 92] } });
    if (P === 'attack') Object.assign(R, { T: T(4, 2, 0), arm: 'strike', gavel: { head: [250, 250], ang: 215 }, fist: [240, 242] });
    if (P === 'death' && fr === 0) Object.assign(R, { T: T(-6), hatT: { r: -12, c: [190, 150], dx: -2, dy: 0 }, broken: true, open: true, gavel: { head: [244, 212], ang: 70 }, fist: [234, 230] });
    if (P === 'death' && fr === 1) Object.assign(R, { T: T(5, 2, 40), kneel: true, hatT: { r: -64, c: [190, 150], dx: -34, dy: 40 }, broken: true, open: true, arm: 'limp', gavel: { head: [262, 318], ang: 182 }, fist: null });
    if (P === 'death' && fr >= 2) R.face = false;
    return R;
  };
  J.headAt = (R) => (R.raise ? [232, 70] : tfP([202, 102], R.T));

  F.parts.judge = function (X, o) {
    const R = J.rig(o), g = X.game, P = o.pose, fr = o.frame, T = R.T;
    let back = '', fig = '', over = '', face = '', front = '', under = '', top = '', holes = '', rims = '';
    if (P === 'death' && fr >= 2) return late(X, fr);
    // shoe tips under the floor-length robe
    fig += X.P(poly([[196, 322], [212, 321], [218, 328], [194, 328]]), K.ink700, 2.2) + X.P(poly([[220, 322], [236, 321], [244, 328], [218, 328]]), K.ink, 2.2);
    // the robe: ONE ink column, no dots; obsidian reflections = ink500 crescents facing upper-left
    const refl = `<path d="${smooth([[171, 206], [184, 202], [178, 236], [176, 262], [168, 264], [168, 236]], true)}" fill="${K.ink500}"/>` + (R.kneel ? '' : `<path d="${smooth([[170, 278], [180, 276], [178, 306], [172, 322], [166, 320], [167, 296]], true)}" fill="${K.ink500}"/>`) + X.art(dry(X, [176, 200, 170, 236, 169, R.kneel ? 258 : 290], 2, 2, K.ink300, 6));
    if (R.kneel) {
      fig += tg(T, X.S(poly([[180, 196], [226, 198], [232, 240], [236, 262], [172, 262], [172, 240]]), K.ink, 2.8, refl));
      fig += X.S(poly([[150, 296], [210, 286], [262, 296], [266, 328], [146, 328]]), K.ink, 2.8, `<path d="${poly([[146, 296], [178, 290], [168, 310], [174, 328], [146, 328]])}" fill="${K.ink500}"/>`);
    } else fig += tg(T, X.S(poly(ROBE), K.ink, 2.8, refl));
    fig += R.kneel ? drip(X, 158, 328, 7, 4) + drip(X, 256, 327, 9, 4.2) : tg(T, drip(X, 176, 325, 8, 4) + drip(X, 232, 325, 10, 4.2));
    // far bell sleeve (hangs; windup: raised with the brush upside down)
    if (R.raise) {
      const sh = tfP([226, 204], T), hd = R.raise.hand;
      fig += X.S(poly([add(sh, [-6, -2]), add(sh, [10, 2]), add(hd, [10, 14]), add(hd, [14, 34]), add(hd, [-8, 30]), add(hd, [-8, 10])]), K.ink, 2.6, `<path d="${poly([add(sh, [-8, -4]), add(sh, [2, -4]), add(hd, [-2, 10]), add(hd, [-10, 12])])}" fill="${K.ink500}"/>`);
      over += J.brush(X, hd, R.raise.tip) + `<path d="${ell(hd[0], hd[1], 7, 6)}" fill="${K.ink}" ${X.O(1.6)}/>`;
    } else {
      fig += tg(T, X.S(poly(FAR_SLV), K.ink, 2.6, `<path d="${poly([[248, 278], [256, 284], [238, 286]])}" fill="${K.ink700}"/>`));
      if (!R.kneel) fig += tg(T, X.P(poly([[244, 283], [248, 282], [252, 294], [248, 295]]), K.ink300, 1.2)); // brush handle end in the far cuff
    }
    // collar + coif + head (ink; the paper mask goes in the face layer)
    fig += tg(T, X.S(poly(COIF), K.ink, 2.2, '') + X.S(J.HEAD, K.ink, 2.8, '') + X.S(poly(COLLAR), K.paper300, 2.4, `<path d="${poly([[214, 192], [222, 186], [226, 196], [214, 202]])}" fill="${K.ink300}"/>`));
    // near bell sleeve: across the chest holding the T gavel upright (idle) / swung down (attack) / behind the waist (windup)
    if (R.arm === 'chest' || R.arm === 'chestOut') fig += tg(T, X.S(poly(R.arm === 'chestOut' ? NEAR_SLV_OUT : NEAR_SLV), K.ink, 2.6, `<path d="${poly([[176, 204], [192, 206], [188, 222], [196, 238], [184, 240], [174, 222]])}" fill="${K.ink500}"/>`));
    if (R.arm === 'down' || R.arm === 'limp') fig += tg(T, X.S(poly([[178, 202], [194, 208], [192, 240], [196, 270], [174, 274], [170, 240]]), K.ink, 2.6, `<path d="${poly([[176, 204], [188, 208], [182, 240], [172, 244]])}" fill="${K.ink500}"/>`));
    if (R.arm === 'strike') fig += tg(T, X.S(poly([[179, 202], [194, 206], [216, 222], [244, 236], [246, 258], [228, 262], [208, 246], [184, 234], [175, 218]]), K.ink, 2.6, `<path d="${poly([[176, 204], [192, 206], [200, 220], [184, 230]])}" fill="${K.ink500}"/>`));
    if (R.gavel) over += J.gavel(X, R.gavel.head, R.gavel.ang);
    if (R.fist) over += `<path d="${ell(R.fist[0], R.fist[1], 7, 6.2)}" fill="${K.ink}" ${X.O(1.6)}/>` + X.L(`M ${f(R.fist[0] - 3.6)},${f(R.fist[1] - 3.6)} L ${f(R.fist[0] + 3)},${f(R.fist[1] - 4.4)}`, 1, K.ink500);
    // erased edges: true holes + thick ink rims masked to the body alpha
    if (!R.kneel) {
      const bites = BITES.map((b, i) => jag(b.map((q) => tfP(q, T)), 1.4, 31 + i));
      holes = bites.join(' ');
      rims = bites.map((d) => X.art(`<path d="${d}" fill="none" stroke="${K.ink300}" stroke-width="6"/>`) + `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="${f(4 * X.lw)}" stroke-linejoin="round"/>`).join('');
    }
    // phase 2 mark: one mouth stitch snapped (+ the paper crack across the hat band, in J.hat)
    face = tg(T, J.face(X, { broken: R.broken || o.p2, open: R.open }));
    top = R.hatT ? tg(T, `<g transform="translate(${R.hatT.dx} ${R.hatT.dy}) rotate(${R.hatT.r} ${R.hatT.c[0]} ${R.hatT.c[1]})">${J.hat(X, {})}</g>`) : tg(T, J.hat(X, { p2: o.p2 }));
    if (R.raise) {
      // the erase arc: from the bristles over the head — a band of erased paper (voidPaper) with pale dotted edges
      const C = [[276, 92], [244, 82], [204, 86], [170, 98], [148, 118]];
      const up = C.map((q, i) => add(q, [0, -7 + i * 0.4])), dn = C.map((q, i) => add(q, [0, 7 - i * 0.6]));
      const band = smooth(up) + ' L ' + smooth(dn.slice().reverse()).replace(/^M /, '') + ' Z';
      front += `<path d="${band}" fill="${K.voidPaper}"/>` + X.Lf(smooth(up), X.g(1.2, 2), K.ink300, `stroke-dasharray="${X.g('2 3', '3 4')}"`) + X.Lf(smooth(dn), X.g(1.2, 2), K.ink300, `stroke-dasharray="${X.g('2 3', '3 4')}"`);
      front += exclaim(X, ...add(J.headAt(R), [0, X.g(-23, -29)]), 1.1);
    }
    if (P === 'attack') {
      // three ERASED sound-wave arcs (voidPaper band 6 + pale dotted edges): the sound is gone, not drawn
      const c = R.gavel.head;
      [18, 30, 42].forEach((r, i) => {
        const a0 = -70 + i * 6, a1 = 70 - i * 6, arc = (rr) => { const p0 = add(c, [rr * Math.cos(a0 * D2R), rr * Math.sin(a0 * D2R)]), p1 = add(c, [rr * Math.cos(a1 * D2R), rr * Math.sin(a1 * D2R)]); return `M ${pt(p0)} A ${f(rr)} ${f(rr)} 0 0 1 ${pt(p1)}`; };
        front += X.Lf(arc(r), 6, K.voidPaper) + X.Lf(arc(r - 3.6), X.g(1, 1.8), K.ink300, `stroke-dasharray="${X.g('2 3', '3 4')}"`) + X.Lf(arc(r + 3.6), X.g(1, 1.8), K.ink300, `stroke-dasharray="${X.g('2 3', '3 4')}"`);
      });
    }
    return { back, fig, over, face, front, under, top, holes, rims };
  };
  // flat mask lying face-up (death 2/3): blank sheet, eclipse rings, the stitched mouth with its stitches cut
  J.flatMask = function (X, c, R, rot) {
    const g = X.game, Pl = plane(c, R, { yaw: 0, squash: 0.45, tilt: rot, persp: 0 });
    let s = `<path d="${pEll(Pl, 0, 0, 44, 50, 24)}" fill="${K.paper300}" stroke="${K.ink}" stroke-width="${f(g ? 2.6 : 1.4)}"/>`;
    [-18, 18].forEach((u) => { s += `<path d="${pEll(Pl, u, -8, 11, 11, 14)}" fill="${K.ink}"/><path d="${pEll(Pl, u, -8, 8, 8, 14)}" fill="${K.paper50}"/><path d="${pEll(Pl, u, -8, 5.5, 5.5, 12)}" fill="${K.ink}"/>`; });
    s += `<path d="${pEll(Pl, 0, 24, 18, 3.6, 12)}" fill="${K.ink}"/>`;
    // the same single vertical stitches as the living mouth (same leans, J.LEAN); the middle one is cut
    const n = g ? 3 : 5, sw = g ? 1.6 : 1, half = 2.3;
    for (let i = 0; i < n; i++) {
      const u = -14 + (28 * i) / (n - 1), c0 = Pl(u, 24), lean = J.LEAN[g ? 'game' : 'art'][i] * D2R, dx = Math.sin(lean) * half, dy = Math.cos(lean) * half;
      s += i === Math.floor(n / 2) ? X.Lf(`M ${f(c0[0] - dx)},${f(c0[1] - dy)} L ${f(c0[0] - dx * 0.3)},${f(c0[1] - dy * 0.3)} M ${f(c0[0] + dx * 0.4)},${f(c0[1] + dy * 0.4)} L ${f(c0[0] + dx)},${f(c0[1] + dy)}`, sw, K.paper50)
        : X.Lf(`M ${f(c0[0] - dx)},${f(c0[1] - dy)} L ${f(c0[0] + dx)},${f(c0[1] + dy)}`, sw, K.paper50);
    }
    return s;
  };
  function late(X, fr) {
    let fig = '', face = '', holes = '', rims = '';
    if (fr === 2) {
      const H = heap(X, { cx: 200, w: 150, h: 84, lean: 6, seed: 18 });
      fig += H.s + drip(X, 136, 326, 9, 4.2) + drip(X, 262, 324, 10, 4.4);
      fig += J.gavel(X, [128, 310], 8);
      face = J.flatMask(X, [210, 252], 15, -10);
    } else {
      fig += puddle(X, { seed: 12 });
      // the cylinder hat lying on its side + the gavel; the mask face-up; 1–2 erased bites in the pool itself
      fig += `<g transform="translate(-58 200) rotate(-84 202 131)">${J.hat(X, {})}</g>`;
      fig += J.gavel(X, [262, 346], 196);
      face = J.flatMask(X, [192, 330], 15, -6);
      const bites = [jag([[118, 334], [136, 328], [146, 340], [130, 348]], 1.2, 41), jag([[240, 316], [256, 312], [262, 322], [246, 326]], 1.2, 43)];
      holes = bites.join(' ');
      rims = bites.map((d) => `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="${f(3.6 * X.lw)}" stroke-linejoin="round"/>`).join('');
    }
    return { fig, face, holes, rims };
  }
  F.anchorsOf.judge = function (o) {
    const R = J.rig(o.pose === 'death' && o.frame >= 2 ? { pose: 'idle', frame: 0 } : o), W = J.W;
    const eyes = [W.p(-28, -4), W.p(J.FAR_EYE, -4)].map((q) => tfP(q, R.T));
    const bx = [W.p(-70, -21), [221.6, 150], [221.6, 191], W.p(-70, 21)].map((q) => tfP(q, R.T)), xs = bx.map((q) => q[0]), ys = bx.map((q) => q[1]);
    return {
      head: J.headAt(R).map(f), face: lerp(eyes[0], eyes[1], 0.3).map(f), faceBox: [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)].map(f),
      // windup: the brush tip previews the null zone (the gavel is behind the waist); otherwise the gavel head
      muzzle: (R.raise ? R.raise.tip : R.gavel ? R.gavel.head : [238, 207]).map(f), brush: R.raise ? R.raise.tip.slice() : null,
      portrait: { center: [205, 171], scale: 0.22 }
    };
  };
})(window.PN);
// ---------- (optional) signature telegraph references: PN.fieldBosses.fx.* (지시서 §4) ----------
// Design references for the canvas telegraphs (the renderer draws hazards itself). Caller space, 1x screen px (bible §3/§12.2):
// preview 2px brush-dashed rim + sparse amber hatching (pitch 10) · imminent 5px rim + dense hatching (pitch 5) + ticks ·
// active: a DAMAGE zone turns coral α0.55 + ink dot edge; a CONTROL zone (root snare) stays amber rim + hatching α0.35.
// Signal colours exist ONLY in this section (never on a body).
(function (PN) {
  const F = PN.fieldBosses, K = F.K, { circ, poly, smooth, lerp, add, f, pt, D2R } = F._;
  const SIG = { hostile: '#EF5B4F', warn: '#D88D16' };
  let FX = 0;
  const pid = () => 'kb4fx' + FX++ + '_';
  const hatch = (p) => `<pattern id="${p}h10" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="10" height="0.7" fill="${K.ink}" opacity="0.55"/><rect y="0.7" width="10" height="2" fill="${SIG.warn}"/></pattern>` +
    `<pattern id="${p}h5" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="5" height="0.7" fill="${K.ink}" opacity="0.55"/><rect y="0.7" width="5" height="2" fill="${SIG.warn}"/></pattern>` +
    `<pattern id="${p}ad" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2" cy="2" r="1.1" fill="${K.ink}"/></pattern>`;
  const head = (x, y, a, s = 1) => `<g transform="translate(${f(x)},${f(y)}) rotate(${f(a / D2R)}) scale(${s})"><path d="M 7,0 C 3,-5 -6,-5 -10,0 C -6,5 3,5 7,0 Z" fill="${K.ink}"/><path d="M 4,-1 C 1,-2.6 -3,-2.4 -5,-1" fill="none" stroke="${K.paper50}" stroke-width="1" opacity="0.8"/></g>`;
  // zone body shared by the three circle telegraphs: fill by state, rim drawn round by `progress`
  // brush: the preview rim is drawn round by a brush head (snare); otherwise it is a full faint dashed ring (shock).
  // harm: only a damaging zone turns coral when active (shock). A control zone (the root snare: kind 'root', damage 0,
  // GameEngine.ts:4049) stays in the control-zone grammar (bible §12.2): amber rim 3 on an ink underlay + dense
  // hatching α0.35 + its inner symbol — no coral (F8).
  function zone(p, x, y, r, st, prog, { brush = true, harm = false } = {}) {
    let s = '';
    if (st === 'active' && harm) return `<circle cx="${x}" cy="${y}" r="${r}" fill="${SIG.hostile}" opacity="0.55"/><circle cx="${x}" cy="${y}" r="${f(r - 2.5)}" fill="none" stroke="url(#${p}ad)" stroke-width="5"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${K.ink}" stroke-width="3"/>`;
    if (st === 'active') return `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${p}h5)" opacity="0.35"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${K.ink}" stroke-width="5.4"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${SIG.warn}" stroke-width="3"/>`;
    const rimByBrush = brush;
    const dense = st === 'imminent', C = 2 * Math.PI * r, part = rimByBrush && !dense ? prog : 1;
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${p}${dense ? 'h5' : 'h10'})" opacity="${dense ? 0.75 : 0.55}"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${K.ink}" stroke-width="${dense ? 5 : 2}" stroke-opacity="${dense ? 1 : 0.7}" stroke-dasharray="${part < 1 ? f(C * part) + ' ' + f(C) : dense ? 'none' : '7 4'}" transform="rotate(-90 ${x} ${y})"/>`;
    if (part < 1) { const a = -Math.PI / 2 + part * Math.PI * 2; s += head(x + Math.cos(a) * r, y + Math.sin(a) * r, a + Math.PI / 2); }
    if (dense) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, q0 = [x + Math.cos(a) * (r - 9), y + Math.sin(a) * (r - 9)], q1 = [x + Math.cos(a) * (r - 3), y + Math.sin(a) * (r - 3)]; s += `<path d="M ${pt(q0)} L ${pt(q1)}" stroke="${K.ink}" stroke-width="2.4" stroke-linecap="round"/>`; }
    return s;
  }
  // 균열 장교: 8 radial cracks drawn OUT from the centre by brush heads; imminent closes their ends with the ring
  function shockCracks(x, y, r, o = {}) {
    const p = pid(), st = o.state || 'preview', prog = o.progress == null ? 1 : o.progress, rnd = PN.rng(o.seed || 5);
    let s = zone(p, x, y, r, st, prog, { brush: false, harm: true });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2, L = r * (st === 'preview' ? prog : 1), pts = [[x, y]];
      for (let k = 1; k <= 4; k++) { const t = k / 4, j = (rnd() - 0.5) * 0.22; pts.push([x + Math.cos(a + j) * L * t, y + Math.sin(a + j) * L * t]); }
      s += `<path d="M ${pts.map(pt).join(' L ')}" fill="none" stroke="${K.ink}" stroke-width="${st === 'preview' ? 2 : 3}" stroke-linejoin="bevel" stroke-linecap="round"/>`;
      if (st === 'preview' && prog < 1) s += head(pts[4][0], pts[4][1], a, 0.8);
    }
    return `<g><defs>${hatch(p)}</defs>${s}</g>`;
  }
  // 백환 관리자 탄: a HOLLOW ring — ink 2 + coral rim 2.4 + one paper glint; the centre stays transparent (vs the gaoler's solid ink ball)
  function ringShot(x, y, r = 7) {
    return `<g><circle cx="${x}" cy="${y}" r="${f(r)}" fill="none" stroke="${K.ink}" stroke-width="${f(r * 0.62 + 2)}"/><circle cx="${x}" cy="${y}" r="${f(r)}" fill="none" stroke="${SIG.hostile}" stroke-width="2.4"/>` +
      `<circle cx="${f(x - r * 0.62)}" cy="${f(y - r * 0.62)}" r="${f(Math.max(1.2, r * 0.18))}" fill="${K.paper50}"/></g>`;
  }
  // 덫 설계자: compass-needle mark in the centre + a round snare the brush draws round (inner chain symbol; no grid, no latch)
  function compassSnare(x, y, r, o = {}) {
    const p = pid(), st = o.state || 'preview', prog = o.progress == null ? 1 : o.progress;
    let s = zone(p, x, y, r, st, prog);
    s += `<path d="M ${f(x)},${f(y - 9)} L ${f(x + 2.4)},${f(y)} L ${f(x)},${f(y + 2)} L ${f(x - 2.4)},${f(y)} Z" fill="${K.ink}"/><circle cx="${x}" cy="${y}" r="3" fill="none" stroke="${K.ink}" stroke-width="1.6"/>`;
    // inner symbol: a short chain of interlocking links (open/edge-on alternating) arcing under the needle
    for (let i = 0; i < 5; i++) { const a = (0.62 + (i - 2) * 0.09) * Math.PI, q = [x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5 - r * 0.14]; s += `<ellipse cx="${f(q[0])}" cy="${f(q[1])}" rx="5" ry="${i % 2 ? 1.4 : 3}" transform="rotate(${f(a / D2R + 90)} ${f(q[0])} ${f(q[1])})" fill="none" stroke="${K.ink}" stroke-width="${i % 2 ? 2.4 : 2}"/>`; }
    return `<g><defs>${hatch(p)}</defs>${s}</g>`;
  }
  // 초침 집행관: the slow field's inner symbol — 12 ticks that fill clockwise from 12 o'clock with progress (vs the tyrant's sweeping lane)
  function dialRing(x, y, r, o = {}) {
    const prog = o.progress == null ? 1 : o.progress, n = Math.round(prog * 12);
    let s = `<circle cx="${x}" cy="${y}" r="${f(r * 0.62)}" fill="none" stroke="${K.ink}" stroke-width="1.6" stroke-dasharray="3 5" opacity="0.7"/>`;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2, on = i < n, r0 = r * (i % 3 ? 0.68 : 0.62), r1 = r * 0.78, d = `M ${f(x + Math.cos(a) * r0)},${f(y + Math.sin(a) * r0)} L ${f(x + Math.cos(a) * r1)},${f(y + Math.sin(a) * r1)}`;
      s += on ? `<path d="${d}" stroke="${K.ink}" stroke-width="5.4" stroke-linecap="round"/><path d="${d}" stroke="${SIG.warn}" stroke-width="2.6" stroke-linecap="round"/>` : `<path d="${d}" stroke="${K.ink}" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>`;
    }
    return `<g>${s}</g>`;
  }
  F.fx = { shockCracks, ringShot, compassSnare, dialRing };
})(window.PN);
// ---------- composer: PN.fieldBosses.draw(id, opts) ----------
// Layer model returned by F.parts[id](X, o) (bossesB model + face/top):
//   under : ground-plane FX below the shadow (not masked, not in mono)
//   back, fig : the body (= raw). holes: punched out with a <mask> (true transparency). rims: masked to raw alpha
//   over  : props on top of the cut body (still in the rough/shadow-weight group)
//   face  : the face plate — drawn above the figure, OUTSIDE the rough filter so features and ticks stay crisp
//   top   : props that must pass in front of the face (own shadow-weight duplicate)
//   front : windup '!' and motion FX (not part of the silhouette, not in mono)
(function (PN) {
  const F = PN.fieldBosses, K = F.K, BOX = F.BOX, { ctx, f } = F._;
  const CH = { commander: 'ch1', reliquary: 'ch2', architect: 'ch3', executioner: 'ch4', judge: 'ch5' };
  const BIG = 'x="-80" y="-80" width="544" height="544"';
  const POSES = ['idle', 'windup', 'attack', 'death'];

  function norm(opts) {
    const o = Object.assign({ windup: false, frame: 0, phase: 1, enraged: false, detail: 'art', halo: undefined, shadow: true, mono: false, hitbox: false }, opts || {});
    let pose = o.pose || (o.windup ? 'windup' : 'idle');
    if (!POSES.includes(pose)) pose = 'idle';
    o.pose = pose;
    o.windup = pose === 'windup';
    o.frame = pose === 'death' ? Math.max(0, Math.min(3, Math.round(+o.frame || 0))) : 0;
    o.phase = Math.max(1, Math.min(3, Math.round(+o.phase || 1)));
    o.p2 = o.phase >= 2 && pose !== 'death'; // phase 3 = phase 2 (field bosses never show a core)
    o.enraged = false; // §9-3: no enrage art; accepted and ignored
    return o;
  }

  function filters(X, o, ground) {
    const id = X.id, big = `filterUnits="userSpaceOnUse" ${BIG}`, d = [];
    const sil = (name, col) => `<filter id="${id}${name}" ${big}><feFlood flood-color="${col}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
    d.push(sil('ink', K.ink), sil('white', '#fff'));
    if (!X.game && !o.mono) d.push(`<filter id="${id}rough" ${big}><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${7 + (X.id.length % 5)}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter>`);
    if (o.halo !== false && !o.mono) d.push(`<filter id="${id}halo" ${big}><feMorphology in="SourceAlpha" operator="dilate" radius="${X.game ? 3.2 : 2.2}" result="a"/><feFlood flood-color="${ground}"/><feComposite in2="a" operator="in" result="h"/><feMerge><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    if (o.mono) d.push(sil('mono', o.monoColor || K.ink));
    return d.join('');
  }

  function draw(id, opts) {
    const o = norm(opts);
    const part = F.parts[id];
    if (!part) return `<g class="kb4"><!-- PN.fieldBosses: unknown id ${id} --></g>`;
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
    // shadow-side weight (bible §3: 그림자 쪽 +40%): ink duplicate nudged down-right under the figure
    const dx = f(1.15 * X.lw), dy = f(1.45 * X.lw);
    const weigh = (s, dup = true) => { const g = X.uid('g'); X.defs.push(`<g id="${g}">${s}</g>`); let u = (dup ? `<use href="#${g}" transform="translate(${dx},${dy})" filter="url(#${X.id}ink)"/>` : '') + `<use href="#${g}"/>`; if (!X.game && !o.mono) u = `<g filter="url(#${X.id}rough)">${u}</g>`; return u; };
    // `top` (caps/hats in front of the face) skips the shadow-weight duplicate: it would lay 3.6u of ink over the brow line
    let all = weigh(body) + (R.face ? `<g class="kb4-face">${R.face}</g>` : '') + (R.top ? weigh(R.top, false) : '');
    if (o.mono) all = `<g filter="url(#${X.id}mono)">${all}</g>`;
    else if (o.halo !== false) all = `<g filter="url(#${X.id}halo)">${all}</g>`;
    const S = BOX.shadow;
    const shadow = o.shadow && !o.mono ? `<ellipse cx="${S.cx}" cy="${S.cy + 4}" rx="${S.rx + 12}" ry="${S.ry + 5}" fill="${K.ink}" opacity="0.16"/><ellipse cx="${S.cx}" cy="${S.cy}" rx="${S.rx}" ry="${S.ry}" fill="${K.ink}" opacity="0.26"/>` : '';
    const sw = X.game ? 3 : 2, da = X.game ? '8 6' : '6 5', [px, py] = BOX.pivot, [fx, fy] = BOX.feet;
    const hb = o.hitbox ? `<g fill="none" stroke="${K.ink}" stroke-width="${sw}" stroke-dasharray="${da}"><circle cx="${px}" cy="${py}" r="${BOX.r}"/><ellipse cx="${fx}" cy="${fy}" rx="${BOX.r}" ry="32"/></g>` +
      `<path d="M ${px - 10},${py} h 20 M ${px},${py - 10} v 20" stroke="${K.ink}" stroke-width="${sw}"/><circle cx="${fx}" cy="${fy}" r="${X.game ? 5 : 3.5}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="2"/>` : '';
    const inner = o.mono ? all : `${R.under || ''}${shadow}${all}${R.front || ''}${hb}`;
    return `<g class="kb4 kb4-${id}"><defs>${X.defs.join('')}</defs>${inner}</g>`;
  }

  // anchors in LOCAL BOX units (API-bosses4.md). Common: pivot, feet, r, shadow. Per boss: head, face, faceBox, muzzle, portrait, extras.
  function anchors(id, opts) {
    const o = norm(opts);
    const base = { pivot: BOX.pivot.slice(), feet: BOX.feet.slice(), r: BOX.r, shadow: Object.assign({}, BOX.shadow) };
    const A = (F.anchorsOf[id] || (() => ({})))(o);
    return Object.assign(base, A);
  }
  F.CH = CH;
  F.draw = draw;
  F.anchors = anchors;
  F.ids = ['commander', 'reliquary', 'architect', 'executioner', 'judge'];
  const ENV = { commander: 'ch1', reliquary: 'ch2', architect: 'ch3', executioner: 'ch4', judge: 'ch5' };
  [['commander', '균열 장교', 'field-shock', 1, 'shock'], ['reliquary', '백환 관리자', 'field-rings', 2, 'rings'], ['architect', '덫 설계자', 'field-trap', 3, 'traps'],
    ['executioner', '초침 집행관', 'field-clock', 4, 'clock'], ['judge', '무음 심판관', 'field-null', 5, 'null']].forEach(([k, name, bossId, chapter, pattern]) => {
    F.META[k] = Object.freeze({ name, bossId, chapter, pattern, env: Object.assign({}, K[ENV[k]]), box: [BOX.w, BOX.h], pivot: BOX.pivot.slice(), feet: BOX.feet.slice(), r: BOX.r, gameScale: BOX.gameScale });
  });
})(window.PN);
