// =====================================================================
// k-bosses3.js — PN.bossesC · 2~5장 중간 보스 (St5) — 작업 지시서 K1 (docs/art/briefs/bossesC.md)
//   'bishop'    유리 주교   (s2-mid-clones  · 2장 · clones)   yaw 30° 평면 거울 얼굴
//   'tide-king' 무채 조수왕 (s3-mid-tide    · 3장 · tide)     yaw 25° tilt 15° 입체 머리(_.wrap)
//   'tyrant'    시계 폭군   (s4-mid-clock   · 4장 · clock)    yaw 30° 평면 문자판 머리
//   'director'  일식 원장   (s5-mid-eclipse · 5장 · eclipse)  yaw 35° 평면 초승 가면
// LOCAL BOX 384 x 384. PIVOT (192,252) = 판정 원 중심 (r54@1x = r108 로컬). FEET (192,360) = 굽기 앵커.
// 발밑 그림자 (192,311) rx108 ry44. scale 0.5 → 156px(1x), detail:'game'. 원화/시트는 detail:'art'.
// 오른쪽(3/4)을 본다. 반전은 호출부(translate(2*192,0) scale(-1,1)). 몸은 자전하지 않는다.
// 의존: lib.js(PN.taper, PN.rng)만. PN.bossesB는 런타임에 부르지 않는다(필요한 도우미는 이 파일에 복사했다).
// 출처: AI 보조 잠정 아트(바이블 §15). 최종 외곽선과 블랙 스팟은 사람이 긋는다.
// =====================================================================
window.PN = window.PN || {};
(function (PN) {
  'use strict';
  // v1.0 킷 토큰(굽기 COLOR_MAP이 구현값으로 바꾼다) + 장 재질(light/base/deep). spot은 몸에 쓰지 않으므로 두지 않는다.
  const K = {
    ink: '#0E0E10', ink700: '#2B2926', ink500: '#46423D', ink300: '#8C8579',
    paper50: '#FAF6EC', paper: '#F3EEE2', paper300: '#D8D0C0',
    warn: '#D88D16', hostile: '#EF5B4F',
    ch2: { light: '#C8CACF', base: '#ABADB4', deep: '#878A93' },
    ch3: { light: '#C9CEC4', base: '#ADB4AA', deep: '#8A9288' },
    ch4: { light: '#D5CAB2', base: '#BBAE94', deep: '#978A70' },
    ch5: { light: '#C8C3C9', base: '#ABA5AC', deep: '#8A848C' }
  };
  // 코어 색 토큰(A-5가 정해지면 이 값만 바꾼다). 기본은 그 장의 deep.
  K.core = { bishop: K.ch2.deep, 'tide-king': K.ch3.deep, tyrant: K.ch4.deep, director: K.ch5.deep };
  const BOX = { w: 384, h: 384, pivot: [192, 252], feet: [192, 360], r: 108, shadow: { cx: 192, cy: 311, rx: 108, ry: 44 }, gameScale: 0.5 };
  const f = (n) => Math.round(n * 100) / 100;
  const pt = (p) => f(p[0]) + ',' + f(p[1]);
  const RAD = Math.PI / 180;
  let UID = 0;

  // ---------- per-call drawing context (k-bosses2.js ctx 복사, 접두사 kb3_) ----------
  function ctx(o) {
    const id = 'kb3_' + (UID++) + '_';
    const game = o.detail === 'game';
    const lw = game ? 2.5 : 1;        // outline multiplier
    const li = game ? 1.8 : 1;        // inner line multiplier
    const pitch = game ? 6 : 4.4;     // halftone pitch (game 6u = 3px@1x)
    const defs = [];
    let n = 0;
    const X = { id, game, lw, li, pitch, o, defs, K };
    X.uid = (p = 'u') => id + p + (n++);
    const dot = (name, col, cov, pv = pitch) => {
      const r = pv * Math.sqrt(cov / Math.PI);
      defs.push(`<pattern id="${id}${name}" width="${pv}" height="${pv}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="${pv / 2}" cy="${pv / 2}" r="${f(r)}" fill="${col}"/></pattern>`);
    };
    dot('d20', K.ink, 0.2); dot('d40', K.ink, 0.4); dot('d60', K.ink, 0.6);
    X.pat = (name) => `url(#${id}${name})`;
    X.clip = (d, tf = '') => { const c = X.uid('c'); defs.push(`<clipPath id="${c}"><path d="${d}"${tf ? ` transform="${tf}"` : ''}/></clipPath>`); return c; };
    X.O = (v = 2.6) => `stroke="${K.ink}" stroke-width="${f(v * 2 * lw)}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"`;
    X.P = (d, fill, v = 2.6, extra = '') => `<path d="${d}" fill="${fill}" ${X.O(v)} ${extra}/>`;
    X.S = (d, fill, v, inner) => { const c = X.clip(d); return `${X.P(d, fill, v)}<g clip-path="url(#${c})">${inner}</g>`; };
    X.SS = (d, fill, v, inner, sep = K.ink500) => X.S(d, fill, v, inner) + `<path d="${d}" fill="none" stroke="${sep}" stroke-width="${f(1.3 * li)}" stroke-linejoin="round"/>`;
    X.L = (d, w, col = K.ink, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w * li)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
    // absolute-width line (face rules give exact art/game widths in local units)
    X.LW = (d, w, col = K.ink, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
    X.T = (p, w, mode = 'mid', fill = K.ink, extra = '') => PN.taper(p, w * li, mode, fill, extra);
    X.TW = (p, w, mode = 'mid', fill = K.ink, extra = '') => PN.taper(p, w, mode, fill, extra);
    X.art = (s) => (game ? '' : s);
    X.gameOnly = (s) => (game ? s : '');
    X.v = (a, g) => (game ? g : a);
    // halftone (screen-aligned 45°) inside a path; tf = transform of the clip shape only; box = [x,y,w,h] of the
    // filled rect in screen units (getBBox ignores clips, so the rect must stay tight or the drawn bounds grow)
    X.ht = (d, name, tf = '', box) => {
      let b = box;
      if (!b) { const n = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number), xs = n.filter((v, i) => i % 2 === 0), ys = n.filter((v, i) => i % 2 === 1); b = [Math.min(...xs) - 2, Math.min(...ys) - 2, Math.max(...xs) - Math.min(...xs) + 4, Math.max(...ys) - Math.min(...ys) + 4]; }
      const c = X.clip(d, tf);
      return `<g clip-path="url(#${c})"><rect x="${f(b[0])}" y="${f(b[1])}" width="${f(b[2])}" height="${f(b[3])}" fill="${X.pat(name)}"/></g>`;
    };
    return X;
  }

  // ---------- geometry (k-bosses2.js 복사) ----------
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
  const circ = (cx, cy, r) => `M ${f(cx + r)},${f(cy)} A ${f(r)} ${f(r)} 0 1 0 ${f(cx - r)},${f(cy)} A ${f(r)} ${f(r)} 0 1 0 ${f(cx + r)},${f(cy)} Z`;
  const ell = (cx, cy, rx, ry) => `M ${f(cx + rx)},${f(cy)} A ${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)},${f(cy)} A ${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)},${f(cy)} Z`;
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

  // ---------- small vector helpers (새로 씀) ----------
  const poly = (P) => 'M ' + P.map(pt).join(' L ') + ' Z';
  const line = (P) => 'M ' + P.map(pt).join(' L ');
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const polar = (c, r, deg) => [c[0] + Math.cos(deg * RAD) * r, c[1] + Math.sin(deg * RAD) * r];
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const angOf = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / RAD;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // star polygon (R outer, r inner, n points, first point at rot deg)
  function star(cx, cy, R, r, n, rot = -90) {
    const P = [];
    for (let i = 0; i < n * 2; i++) P.push(polar([cx, cy], i % 2 ? r : R, rot + (i * 180) / n));
    return poly(P);
  }
  // scissor-jag polygon through key points (closed), jitter amp
  function jag(pts, amp, seed, step = 9) {
    const r = PN.rng(seed * 31 + 7), out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      out.push(a);
      const n = Math.max(1, Math.round(L / step));
      for (let k = 1; k <= n; k++) { const t = k / (n + 1), j = (r() - 0.5) * 2 * amp; out.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j]); }
    }
    return poly(out);
  }
  // Catmull-Rom samples through control points
  function sample(ctrl, n = 16) {
    if (ctrl.length < 2) return ctrl.slice();
    const P = [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]], out = [];
    const segs = ctrl.length - 1, per = Math.max(2, Math.ceil(n / segs));
    for (let s = 0; s < segs; s++) {
      const p0 = P[s], p1 = P[s + 1], p2 = P[s + 2], p3 = P[s + 3];
      for (let i = 0; i < per; i++) {
        const t = i / per, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    out.push(ctrl[ctrl.length - 1].slice());
    return out;
  }
  // closed band along a centreline; wf = half width (number or t => number); wave = [amp, cycles, phase]
  function bandD(ctrl, wf, n = 18, wave) {
    const Cl = sample(ctrl, n), L = [], R = [];
    Cl.forEach((p, i) => {
      const a = Cl[Math.max(0, i - 1)], b = Cl[Math.min(Cl.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, t = i / (Cl.length - 1);
      const w = typeof wf === 'function' ? wf(t) : wf, o = wave ? Math.sin(t * wave[1] * Math.PI * 2 + (wave[2] || 0)) * wave[0] * t : 0;
      L.push([p[0] + nx * (w + o), p[1] + ny * (w + o)]); R.push([p[0] - nx * (w - o), p[1] - ny * (w - o)]);
    });
    return 'M ' + L.map(pt).join(' L ') + ' L ' + R.reverse().map(pt).join(' L ') + ' Z';
  }
  // two-bone arm: elbow for shoulder sh → wrist wr with bone lengths U, F; side ±1 picks the bend
  function ik(sh, wr, U, F, side = 1) {
    const dx = wr[0] - sh[0], dy = wr[1] - sh[1], d = clamp(Math.hypot(dx, dy), 0.01, U + F - 0.01);
    const a = Math.atan2(dy, dx), A = Math.acos(clamp((U * U + d * d - F * F) / (2 * U * d), -1, 1));
    return [sh[0] + Math.cos(a + side * A) * U, sh[1] + Math.sin(a + side * A) * U];
  }

  // ---------- face coordinate helpers (지시서 §1.10) ----------
  // _.plane: 가면 로컬(정면, 원점 = 가면 중심)에서 그린 요소를 감쌀 변환 하나
  const plane = (c, yaw, roll = 0) => `translate(${f(c[0])},${f(c[1])}) rotate(${f(roll)}) scale(${f(Math.cos(yaw * Math.PI / 180))},1)`;
  // 판 두께 띠의 화면 폭 = depth × sin(yaw). 왼쪽 가장자리에만 그린다
  const planeEdge = (depth, yaw) => depth * Math.sin(yaw * Math.PI / 180);
  // plane-local point → screen (same transform as plane())
  const planeP = (c, yaw, roll = 0) => (p) => { const x = p[0] * Math.cos(yaw * RAD), y = p[1], r = roll * RAD; return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)]; };
  // _.wrap: c 머리 중심, rx·ry 화면 반지름, yaw 오른쪽 +(도), tilt 내려다보는 각(도)
  const wrap = (c, rx, ry, yaw, tilt) => (lon, lat) => {   // lon: 얼굴 정중선 기준 경도, lat: 위도(위 +), 도
    const R = Math.PI / 180, a = (lon + yaw) * R, b = lat * R, t = tilt * R;
    const z = Math.cos(a) * Math.cos(b);
    return {
      x: c[0] + rx * Math.sin(a) * Math.cos(b),
      y: c[1] - ry * (Math.sin(b) * Math.cos(t) - z * Math.sin(t)),
      sx: Math.max(0, Math.cos(a)),            // 가로 단축(먼 쪽 요소를 이만큼 누른다)
      sy: Math.max(0.3, Math.cos(b - t)),      // 세로 단축(근사)
      visible: Math.sin(b) * Math.sin(t) + z * Math.cos(t) > 0.02,
    };
  };

  // ---------- body lean: shear about the ground line y=360 (feet and hem stay planted) + slide dx ----------
  const leanK = (deg) => Math.tan(deg * RAD);
  const leanT = (k, dx = 0) => (k || dx ? `matrix(1,0,${f(-k)},1,${f(360 * k + dx)},0)` : '');
  const leanP = (k, dx = 0) => (p) => [p[0] + k * (360 - p[1]) + dx, p[1]];
  const leanInv = (k, dx = 0) => (p) => [p[0] - k * (360 - p[1]) - dx, p[1]];
  const G = (tf, s) => (tf ? `<g transform="${tf}">${s}</g>` : s);

  // ---------- shared ink vocabulary (k-bosses2.js 복사) ----------
  // enemy ink drip (flows DOWN = hostile, bible §6-7). Clamped so the droplet ends at y ≤ 378: with the 16u stroke/halo
  // allowance that keeps every state inside the brief's drawable box (y ≤ 396).
  function drip(X, x, y, len, w = 5) {
    let w2 = w * X.li;
    const maxY = 374; // + the composer's shadow-side copy (≤ 5u down) stays ≤ 380
    if (y + 3 + 2.6 * 2.4 > maxY) return ''; // starts too low to fall at all
    if (y + len + 2.6 * w2 > maxY) { len = Math.max(3, maxY - y - 2.6 * w2); if (y + len + 2.6 * w2 > maxY) w2 = Math.max(2.4, (maxY - y - len) / 2.6); }
    return `<path d="M ${f(x - w2 / 2)},${f(y)} C ${f(x - w2 / 2)},${f(y + len * 0.5)} ${f(x - w2 * 0.2)},${f(y + len * 0.7)} ${f(x)},${f(y + len)} C ${f(x + w2 * 0.2)},${f(y + len * 0.7)} ${f(x + w2 / 2)},${f(y + len * 0.5)} ${f(x + w2 / 2)},${f(y)} Z" fill="${K.ink}"/>` +
      `<path d="M ${f(x)},${f(y + len + w2 * 0.9)} q ${f(-w2 * 0.8)},${f(w2 * 1.3)} 0,${f(w2 * 1.7)} q ${f(w2 * 0.8)},${f(-w2 * 0.4)} 0,${f(-w2 * 1.7)} Z" fill="${K.ink}"/>`;
  }
  // paper crack (thin) — zigzag paper line with ink shoulder
  function crack(X, pts, w = 2.2) {
    const d = 'M ' + pts.map(pt).join(' L ');
    return X.L(d, w + 2.4, K.ink) + X.L(d, w, K.paper50);
  }
  // tapered crack (지시서 §1.10-5): polyline whose width runs from w at the root (first point) to w·end at the tip.
  // Each segment is a trapezoid, joints and root are round, the tip stays sharp-ish.
  function crackT(X, pts, w, col = K.ink, end = 0.38) {
    const N = pts.length - 1, wAt = (i) => w * (1 - (1 - end) * (i / N));
    let s = `<path d="${circ(pts[0][0], pts[0][1], w / 2)}" fill="${col}"/>`;
    for (let i = 0; i < N; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, wa = wAt(i) / 2, wb = wAt(i + 1) / 2;
      s += `<path d="${poly([[a[0] + nx * wa, a[1] + ny * wa], [b[0] + nx * wb, b[1] + ny * wb], [b[0] - nx * wb, b[1] - ny * wb], [a[0] - nx * wa, a[1] - ny * wa]])}" fill="${col}"/>`;
      if (i < N - 1) s += `<path d="${circ(b[0], b[1], wb)}" fill="${col}"/>`;
    }
    return s;
  }
  // P2 PHASE crack: bold paper zigzag — ≥3px wide at 1x game (6.4u @0.5) — with an ink shoulder + optional branch
  function pcrack(X, pts, branch) {
    const pw = X.game ? 6.4 : 3.4, iw = pw + (X.game ? 4.6 : 3);
    const ln = (P, k = 1) => { const d = 'M ' + P.map(pt).join(' L '); return `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="${f(iw * k)}" stroke-linejoin="miter" stroke-miterlimit="6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${K.paper}" stroke-width="${f(pw * k)}" stroke-linejoin="miter" stroke-miterlimit="6" stroke-linecap="round"/>`; };
    return ln(pts) + (branch ? ln(branch, 0.62) : '');
  }
  // ink flame tongue (enrage): black flame + paper core line
  function flame(X, x, y, h, w, lean = 0, seed = 1) {
    const r = PN.rng(seed * 97 + 13);
    const tipx = x + lean * h + (r() - 0.5) * w * 0.4, tipy = y - h;
    const d = `M ${f(x - w / 2)},${f(y)} C ${f(x - w * 0.62)},${f(y - h * 0.45)} ${f(tipx - w * 0.28)},${f(y - h * 0.62)} ${f(tipx)},${f(tipy)} C ${f(tipx + w * 0.08)},${f(y - h * 0.66)} ${f(x + w * 0.6)},${f(y - h * 0.4)} ${f(x + w / 2)},${f(y)} Z`;
    const core = X.T([x - w * 0.05, y - h * 0.1, x + lean * h * 0.5, y - h * 0.5, tipx - w * 0.05, tipy + h * 0.3], w * 0.22, 'mid', K.paper50);
    return `<path d="${d}" fill="${K.ink}" stroke="${K.ink}" stroke-width="${f(1.2 * X.li)}"/>${core}`;
  }
  // amber windup '!' (sandwich: ink ≥2px + warn + paper core), centred at (x,y)
  function exclaim(X, x, y, s = 1) {
    const k = s * (X.game ? 1.25 : 1);
    const bar = `M ${f(x - 6 * k)},${f(y - 17 * k)} L ${f(x + 6 * k)},${f(y - 17 * k)} L ${f(x + 3 * k)},${f(y + 6 * k)} L ${f(x - 3 * k)},${f(y + 6 * k)} Z`;
    const dotd = circ(x, y + 13.5 * k, 4.4 * k);
    const O = `stroke="${K.ink}" stroke-width="${f(4.4 * k)}" stroke-linejoin="round" paint-order="stroke"`;
    return `<g><path d="${bar}" fill="${K.warn}" ${O}/><path d="${dotd}" fill="${K.warn}" ${O}/>` +
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
  // dry-brush highlight (비백): n hair strokes across width w along bezier p
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

  // ---------- death vocabulary (새로 씀) ----------
  // paper ✕ eye with ink rim (적 처치 데칼의 ✕✕ 문법)
  function xMark(X, x, y, s) {
    const d = `M ${f(x - s)},${f(y - s)} L ${f(x + s)},${f(y + s)} M ${f(x + s)},${f(y - s)} L ${f(x - s)},${f(y + s)}`;
    const w = X.v(2.4, 3.8);
    return `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="${f(w + X.v(3, 4.4))}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${K.paper50}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
  }
  // wet ink puddle: ink700 surface + ink rim, art adds ink300 dry-brush scraps on the far rim
  function puddle(X, cx, cy, rx, ry, seed = 1) {
    const r = PN.rng(seed * 53 + 11), P = [];
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2, k = 1 + (r() - 0.5) * 0.1 + (i % 6 === 2 ? 0.07 : 0); P.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    const d = smooth(P, true);
    const inner = `<path d="${ell(cx - rx * 0.12, cy - ry * 0.18, rx * 0.72, ry * 0.5)}" fill="${K.ink}" opacity="0.55"/>` +
      X.art(dry(X, [cx - rx * 0.8, cy - ry * 0.55, cx - rx * 0.3, cy - ry * 0.95, cx + rx * 0.3, cy - ry * 0.9], 4, 3, K.ink300, seed + 3) +
        dry(X, [cx + rx * 0.45, cy + ry * 0.55, cx + rx * 0.7, cy + ry * 0.35, cx + rx * 0.86, cy + ry * 0.05], 3, 3, K.ink300, seed + 5));
    return { d, s: X.S(d, K.ink700, 2.4, inner) };
  }
  // torn manuscript scrap (paper300 + ink rim) — death f2 (art only)
  function scrap(X, x, y, s, rot, seed) {
    const r = PN.rng(seed * 17 + 3), P = [];
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, k = 0.6 + r() * 0.5; P.push([x + Math.cos(a) * s * k, y + Math.sin(a) * s * k * 0.7]); }
    return `<g transform="rotate(${rot} ${f(x)} ${f(y)})"><path d="${poly(P)}" fill="${K.paper300}" stroke="${K.ink}" stroke-width="${f(X.v(2, 3.6))}" stroke-linejoin="round"/></g>`;
  }
  // vertical squash about the feet (death collapse): sx, sy around (cx, 360)
  const squashT = (sx, sy, cx = 192) => `translate(${f(cx)},360) scale(${f(sx)},${f(sy)}) translate(${f(-cx)},-360)`;
  // point mapper for the same transform list an SVG transform="" applies (first op outermost), so anchors follow the drawing
  // ops: ['translate',x,y] ['rotate',deg,cx,cy] ['scale',sx,sy] ['matrix',a,b,c,d,e,f]
  function xf(...ops) {
    const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
    let M = [1, 0, 0, 1, 0, 0];
    ops.forEach(([k, ...a]) => {
      let n = [1, 0, 0, 1, 0, 0];
      if (k === 'translate') n = [1, 0, 0, 1, a[0], a[1] || 0];
      else if (k === 'scale') n = [a[0], 0, 0, a[1] === undefined ? a[0] : a[1], 0, 0];
      else if (k === 'matrix') n = a.slice(0, 6);
      else if (k === 'rotate') { const r = a[0] * RAD, c = Math.cos(r), s = Math.sin(r), cx = a[1] || 0, cy = a[2] || 0; n = [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy]; }
      M = mul(M, n);
    });
    return (p) => [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]];
  }

  // ---------- option normalisation (one state object for draw() and anchors()) ----------
  const MOVES = ['base', 'p2', 'p3'];
  function state(id, o) {
    const phase0 = clamp(Math.round(Number(o.phase) || 1), 1, 3);
    const S = { id, phase: phase0, pose: 'idle', move: 'base', frame: 0, windup: false, enraged: !!o.enraged, clone: !!o.clone && id === 'bishop', game: o.detail === 'game' };
    if (o.pose === 'death') {
      S.pose = 'death'; S.frame = clamp(Math.round(Number(o.frame) || 0), 0, 3);
      S.phase = 3; S.enraged = false; S.clone = false; S.move = 'base';
      return S;
    }
    S.pose = o.pose === 'attack' ? 'attack' : (o.windup ? 'windup' : 'idle');
    S.windup = S.pose === 'windup';
    S.move = MOVES.includes(o.move) ? o.move : MOVES[phase0 - 1];
    if (S.clone) { S.enraged = false; S.phase = 1; } // 분신: '!', 광폭, 페이즈 파손, 처치 없음
    return S;
  }

  PN.bossesC = {
    K, BOX, parts: {}, anchorsOf: {},
    _: {
      ctx, gearPath, circ, ell, smooth, rotP, drip, crack, pcrack, flame, exclaim, chain, dry, plane, planeEdge, planeP, wrap,
      f, pt, RAD, poly, line, lerp, polar, dist, angOf, clamp, star, jag, sample, bandD, ik,
      leanK, leanT, leanP, leanInv, G, xMark, puddle, scrap, squashT, xf, state, crackT
    }
  };
})(window.PN);
// ---------- composer: PN.bossesC.draw(id, opts) — k-bosses2.js 조합기 복사 + pose · move · frame · clone ----------
// Layer model returned by C.parts[id](X, S):
//   under  : ground-plane FX drawn below the shadow (not masked; dropped in mono)
//   back, fig : the body (unmasked source = "raw")
//   holes  : path(s) punched out of the body with a <mask> → TRUE transparency (ground shows through)
//   rims   : ink rims of the cut edges (and the clone's lead lattice), masked to the raw body alpha
//   over   : props drawn on top of the cut body, unmasked
//   solid  : extra filled path(s) added ONLY to the enrage "fill" silhouette (gaps never get the coral pulse)
//   front  : windup '!' and pose FX (not part of the silhouette; dropped in mono)
//   cut    : (bossesC addition) narrow transparent slits punched after the shadow-side copy, pulse and halo (director)
(function (PN) {
  'use strict';
  const C = PN.bossesC, K = C.K, BOX = C.BOX, { ctx, f, state } = C._;
  const CH = { bishop: 'ch2', 'tide-king': 'ch3', tyrant: 'ch4', director: 'ch5' };
  const BIG = 'x="-90" y="-130" width="560" height="560"';

  function filters(X, o, ground, enraged) {
    const id = X.id, big = `filterUnits="userSpaceOnUse" ${BIG}`;
    const d = [];
    const sil = (name, col) => `<filter id="${id}${name}" ${big}><feFlood flood-color="${col}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
    d.push(sil('ink', K.ink), sil('white', '#fff'), sil('black', '#000'));
    if (!X.game) d.push(`<filter id="${id}rough" ${big}><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${7 + (X.id.length % 5)}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter>`);
    if (o.halo !== false) {
      const r = X.game ? 3.2 : 2.2;
      d.push(`<filter id="${id}halo" ${big}><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="a"/><feFlood flood-color="${ground}"/><feComposite in2="a" operator="in" result="h"/><feMerge><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    }
    if (enraged) {
      const r1 = X.game ? 4.2 : 3.2, r2 = r1 + (X.game ? 2.4 : 1.8);
      d.push(`<filter id="${id}pulse" ${big}><feMorphology in="SourceAlpha" operator="dilate" radius="${r2}" result="o"/><feMorphology in="SourceAlpha" operator="dilate" radius="${r1}" result="i"/>` +
        `<feFlood flood-color="${K.ink}"/><feComposite in2="o" operator="in" result="ko"/><feFlood flood-color="${K.hostile}"/><feComposite in2="i" operator="in" result="ci"/>` +
        `<feMerge><feMergeNode in="ko"/><feMergeNode in="ci"/></feMerge></filter>`);
    }
    if (o.mono) d.push(sil('mono', o.monoColor || K.ink));
    return d.join('');
  }

  function draw(id, opts = {}) {
    const o = Object.assign({ phase: 1, windup: false, pose: 'idle', frame: 0, enraged: false, clone: false, detail: 'art', halo: undefined, mono: false, shadow: true, hitbox: false }, opts);
    const part = C.parts[id];
    if (!part) return `<g><!-- PN.bossesC: unknown id ${id} --></g>`;
    const S = state(id, o);
    const X = ctx(o);
    const ground = typeof o.halo === 'string' ? o.halo : K[CH[id]].base;
    const R = part(X, S);
    X.defs.push(filters(X, o, ground, S.enraged));
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
    // shadow-side weight: whole silhouette duplicated in ink, nudged down-right (bible §3: 그림자 쪽 굵게)
    const dx = f(1.6 * X.lw), dy = f(2.0 * X.lw);
    let fig = `<use href="#${figId}" transform="translate(${dx},${dy})" filter="url(#${X.id}ink)"/><use href="#${figId}"/>`;
    if (!X.game && !o.mono) fig = `<g filter="url(#${X.id}rough)">${fig}</g>`;
    if (S.enraged && !o.mono) {
      // outer 2px coral pulse: dilate the cut figure, then hide everything inside the HOLE-FILLED silhouette
      const fr = X.uid('fr'), nf = X.uid('nf');
      X.defs.push(`<g id="${fr}">${fig}</g>`);
      // solidT (optional): transform of the solid path — the director's solids live in its leaned body frame.
      // One <path> per subpath, so overlapping polygons of opposite winding never cancel each other out.
      const sol = R.solid ? R.solid.split(/(?=M)/).filter((d) => d.trim()).map((d) => `<path d="${d.trim()}" fill="#000"/>`).join('') : '';
      X.defs.push(`<mask id="${nf}" maskUnits="userSpaceOnUse" ${BIG}><rect ${BIG} fill="#fff"/><g filter="url(#${X.id}black)"><use href="#${rawId}"/>${sol ? (R.solidT ? `<g transform="${R.solidT}">${sol}</g>` : sol) : ''}</g></mask>`);
      fig = `<g mask="url(#${nf})"><use href="#${fr}" filter="url(#${X.id}pulse)"/></g><use href="#${fr}"/>`;
    }
    if (o.halo !== false && !o.mono) fig = `<g filter="url(#${X.id}halo)">${fig}</g>`;
    // cut: narrow transparent slits (5장 광배 틈, +자 틈, 꼬리 사이) punched AFTER the shadow-side copy, pulse and halo,
    // so an offset ink copy or a dilated halo cannot fill them. Used by 'director' only; other ids return no cut.
    // cutKeep: shapes in front of the slit (head, mask, torso) painted back in, so the slit passes BEHIND them.
    //   items: path string, or { d, tf, sw } = path + optional transform + optional white stroke width (covers the outline)
    // cutT (optional): transform of the cut path (the director's leaned body frame)
    if (R.cut) {
      const cm = X.uid('cut');
      const keep = [].concat(R.cutKeep || []).map((k) => { // one path per shape: no winding cancellation
        const q = typeof k === 'string' ? { d: k } : k;
        return `<path d="${q.d}" fill="#fff"${q.sw ? ` stroke="#fff" stroke-width="${f(q.sw)}" stroke-linejoin="round" stroke-linecap="round"` : ''}${q.tf ? ` transform="${q.tf}"` : ''}/>`;
      }).join('');
      X.defs.push(`<mask id="${cm}" maskUnits="userSpaceOnUse" ${BIG}><rect ${BIG} fill="#fff"/><path d="${R.cut}" fill="#000"${R.cutT ? ` transform="${R.cutT}"` : ''}/>${keep}</mask>`);
      fig = `<g mask="url(#${cm})">${fig}</g>`;
    }
    const SH = BOX.shadow;
    const shadow = o.shadow && !o.mono ? `<ellipse cx="${SH.cx}" cy="${SH.cy + 4}" rx="${SH.rx + 14}" ry="${SH.ry + 6}" fill="${K.ink}" opacity="0.16"/><ellipse cx="${SH.cx}" cy="${SH.cy}" rx="${SH.rx}" ry="${SH.ry}" fill="${K.ink}" opacity="0.26"/>` : '';
    const hb = o.hitbox ? `<g fill="none" stroke="${K.ink}" stroke-width="${X.game ? 3 : 2}" stroke-dasharray="${X.game ? '8 6' : '6 5'}"><circle cx="${BOX.pivot[0]}" cy="${BOX.pivot[1]}" r="${BOX.r}"/></g>` +
      `<g stroke="${K.ink}" stroke-width="${X.game ? 3 : 2}"><path d="M ${BOX.pivot[0] - 10},${BOX.pivot[1]} h 20 M ${BOX.pivot[0]},${BOX.pivot[1] - 10} v 20"/></g><circle cx="${BOX.feet[0]}" cy="${BOX.feet[1]}" r="${X.game ? 5 : 3.5}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="2"/>` : '';
    let inner = `${o.mono ? '' : (R.under || '')}${shadow}${fig}${o.mono ? '' : (R.front || '')}${hb}`;
    if (o.mono) inner = `<g filter="url(#${X.id}mono)">${fig}</g>`;
    else if (S.clone) inner = `<g opacity="0.8">${inner}</g>`; // 유리 분신: 묶음 불투명도 0.8 (단색은 진짜와 같게 둔다)
    return `<g class="kb3 kb3-${id}${S.clone ? ' kb3-clone' : ''}"><defs>${X.defs.join('')}</defs>${inner}</g>`;
  }

  // anchors in LOCAL BOX units (API-bosses3.md). Same state as draw(): pose · move · windup · frame.
  function anchors(id, opts = {}) {
    const o = Object.assign({ phase: 1, windup: false, pose: 'idle', frame: 0 }, opts);
    const S = state(id, o);
    const base = { pivot: BOX.pivot.slice(), feet: BOX.feet.slice(), r: BOX.r, shadow: Object.assign({}, BOX.shadow), head: [192, 18] };
    const A = (C.anchorsOf[id] || (() => ({})))(S);
    return Object.assign(base, A);
  }

  C.CH = CH;
  C.draw = draw;
  C.anchors = anchors;
  C.ids = ['bishop', 'tide-king', 'tyrant', 'director'];
  // portrait: center = 초상 원 중심(로컬), scale = 원 지름 / 박스(384). ui-art-spec BOSS_PORTRAITS와 같은 뜻.
  C.META = {
    bishop: { gameId: 's2-mid-clones', chapter: 2, stage: 5, pattern: 'clones', moves: { p2: 'mirror-procession', p3: 'false-bishop-lock' }, portrait: { center: [205, 134], scale: 0.36 } },
    'tide-king': { gameId: 's3-mid-tide', chapter: 3, stage: 5, pattern: 'tide', moves: { p2: 'current-reversal', p3: 'flood-crest' }, portrait: { center: [220, 124], scale: 0.44 } },
    tyrant: { gameId: 's4-mid-clock', chapter: 4, stage: 5, pattern: 'clock', moves: { p2: 'second-hand-sweep', p3: 'time-fracture' }, portrait: { center: [212, 102], scale: 0.36 } },
    director: { gameId: 's5-mid-eclipse', chapter: 5, stage: 5, pattern: 'eclipse', moves: { p2: 'penumbra-lanes', p3: 'totality-crossing' }, portrait: { center: [210, 94], scale: 0.38 } }
  };
})(window.PN);
// ---------- shared figure parts: sleeves and hands (새로 씀) ----------
(function (PN) {
  'use strict';
  const C = PN.bossesC, K = C.K, { ell, f, pt, RAD, sample, bandD, polar, lerp } = C._;
  // centreline offset toward the lit (upper-left) side
  function litLine(ctrl, k, n = 16) {
    const Cl = sample(ctrl, n);
    return 'M ' + Cl.map((p, i) => {
      const a = Cl[Math.max(0, i - 1)], b = Cl[Math.min(Cl.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      let nx = -dy / l, ny = dx / l; if (nx + ny > 0) { nx = -nx; ny = -ny; }
      return pt([p[0] + nx * k, p[1] + ny * k]);
    }).join(' L ');
  }
  // tapered sleeve shoulder → elbow → wrist; w = [shoulder, elbow, wrist] half widths; lit = ink500 plane on the upper edge
  // upper: fill of the upper arm (pass the cloak ink so it reads as tucked under the cloak), the forearm gets the lit plane
  function sleeve(X, sh, el, wr, w, fill, lit, sep = true, upper) {
    const up = bandD([sh, lerp(sh, el, 0.5), el], (t) => w[0] + (w[1] - w[0]) * t, 10);
    const fore = bandD([el, lerp(el, wr, 0.5), wr], (t) => w[1] + (w[2] - w[1]) * t * t, 12);
    const inner = lit ? `<path d="${litLine([el, wr], w[2] * 0.98, 10)}" fill="none" stroke="${K.ink500}" stroke-width="${f(w[2] * 0.6)}" stroke-linecap="round"/>` : '';
    const s = X.P(up, upper || fill, 2.4) + (sep ? X.SS(fore, fill, 2.4, inner) : X.S(fore, fill, 2.4, inner));
    return { d: fore, s };
  }
  // hands: 'grip' (fist round a shaft at angle a), 'open' (palm + 4 spread fingers toward a), 'bless' (two raised fingers toward a)
  function hand(X, kind, p, a, fill = K.ink, s = 1) {
    const g = X.game, u = [Math.cos(a * RAD), Math.sin(a * RAD)], nrm = [-u[1], u[0]];
    const P = (t, k) => [p[0] + u[0] * t * s + nrm[0] * k * s, p[1] + u[1] * t * s + nrm[1] * k * s];
    if (kind === 'grip') {
      return `<path d="${ell(p[0], p[1], 9.5 * s, 8 * s)}" transform="rotate(${f(a)} ${f(p[0])} ${f(p[1])})" fill="${fill}" ${X.O(1.8)}/>` +
        X.art(`<path d="M ${pt(P(-4, -5))} L ${pt(P(-4, 5))} M ${pt(P(1.5, -5.5))} L ${pt(P(1.5, 5.5))}" stroke="${K.ink500}" stroke-width="1.1" stroke-linecap="round"/>`);
    }
    const fw = g ? 5.4 : 4.2;
    const palm = `M ${pt(P(-8, -6))} L ${pt(P(5, -7))} C ${pt(P(10, -7))} ${pt(P(10, 7))} ${pt(P(5, 7))} L ${pt(P(-8, 6))} Z`;
    let fin = '';
    if (kind === 'bless') {
      // index + middle straight up the hand axis, ring + little folded, thumb across
      (g ? [[-3.4, 1.12], [3.4, 1.0]] : [[-2.2, 1.0], [2.4, 0.92]]).forEach(([k, L]) => { const b = P(6, k), e = P(6 + 15 * L, k * (g ? 1.5 : 1.15)); fin += `M ${pt(b)} L ${pt(e)} `; });
      const t0 = P(-2, 6.5), t1 = P(4, 1);
      fin += `M ${pt(t0)} Q ${pt(P(2, 7))} ${pt(t1)}`;
    } else {
      const spread = g ? 24 : 17, lk = g ? 1.3 : 1;
      [-1.5, -0.5, 0.5, 1.5].forEach((k, i) => {
        const aa = (a + k * spread) * RAD, L = [11, 14, 13, 10][i] * s * lk, b = P(6, k * 4.4);
        fin += `M ${pt(b)} Q ${pt([b[0] + Math.cos(aa) * L * 0.55, b[1] + Math.sin(aa) * L * 0.55])} ${pt([b[0] + Math.cos(aa) * L, b[1] + Math.sin(aa) * L])} `;
      });
      const t0 = P(-3, -6), ta = (a - 62) * RAD;
      fin += `M ${pt(t0)} L ${pt([t0[0] + Math.cos(ta) * 10 * s, t0[1] + Math.sin(ta) * 10 * s])}`;
    }
    return `<path d="${fin}" fill="none" stroke="${K.ink}" stroke-width="${f((fw + (g ? 4.4 : 2.4)) * s)}" stroke-linecap="round"/>` +
      `<path d="${palm}" fill="${fill}" ${X.O(1.6)}/>` +
      `<path d="${fin}" fill="none" stroke="${fill}" stroke-width="${f(fw * s)}" stroke-linecap="round"/>`;
  }
  C._.litLine = litLine; C._.sleeve = sleeve; C._.hand = hand;
})(window.PN);
// ---------- 유리 주교 (bishop · 2장 St5 · clones) — part 1/2: rig + figure pieces ----------
// 가장 가늘고 높은 기둥 · 두 봉우리 주교관 · 오른쪽 수직 거울 지팡이 · 곧게 떨어지는 코프(밑단 x 112~276).
// 얼굴 = 금 간 거울: 평면 하나(yaw 30°, roll −4°), 눈 = 충격점 둘(먹 별 소켓 + 종이백 눈빛).
(function (PN) {
  'use strict';
  const C = PN.bossesC, K = C.K;
  const { circ, ell, drip, pcrack, flame, dry, plane, planeEdge, planeP, f, pt, RAD, poly, line, lerp, polar, star, jag, bandD, ik, leanK, leanP, leanInv, sleeve, hand, crackT } = C._;
  const Q = (C._bishop = {});
  Q.YAW = 30; Q.ROLL = -4; Q.FACE = [206, 149]; Q.MR = [23, 27];
  Q.EYES = [[-9.5, -6], [9.5, -5]]; // 검수 F5: ±9.5 so the two game sockets keep a paper gap ≥ 4 between them
  Q.ROSE = [210, 224]; Q.ROSE_R = 30;
  Q.SHN = [240, 178]; Q.SHF = [178, 180];
  Q.LEN = 320; // staff: foot → mirror centre, the same in every pose (grip slides along it)
  Q.COPE = 'M 236,164 C 246,186 250,214 254,250 C 258,290 268,326 276,358 C 246,363 150,364 112,358 C 118,330 124,300 132,256 C 140,210 152,180 176,160 C 196,150 222,152 236,164 Z';
  Q.COPE_FLY = 'M 236,164 C 246,186 250,214 254,250 C 258,290 268,326 276,358 C 246,363 160,364 118,357 C 104,340 90,318 80,292 C 96,292 106,286 110,278 C 102,262 98,248 100,236 C 118,232 128,222 134,206 C 146,184 158,170 176,160 C 196,150 222,152 236,164 Z';
  Q.FOLD = 'M 176,162 C 156,178 144,206 138,246 C 132,286 124,322 118,352 L 132,350 C 138,316 144,282 151,248 C 157,214 166,188 186,168 Z';
  Q.FOLD_FLY = 'M 176,162 C 156,178 140,200 128,216 C 118,228 108,236 100,238 L 116,246 C 128,232 140,216 150,204 C 160,190 170,178 186,168 Z';
  Q.ALB = 'M 206,248 C 203,290 199,330 195,361 L 256,361 C 249,330 236,290 224,248 Z';
  Q.HOOD = 'M 176,178 C 165,162 163,136 171,118 C 182,108 230,106 239,118 C 246,136 244,162 235,178 C 220,186 190,186 176,178 Z';
  Q.HOODLIT = 'M 165,120 C 159,138 161,160 171,177 L 176,174 C 169,156 168,138 172,123 Z'; // 검수 F9: 6 left, clear of the wider thickness band
  Q.BAND = 'M 166,102 C 186,111 216,111 238,98 L 240,108 C 216,120 186,120 166,112 Z';
  Q.FRONT = 'M 188,118 C 190,96 202,68 218,48 C 230,62 238,84 240,106 C 222,116 204,118 188,118 Z';
  Q.JAG3 = [[218, 48], [222, 58], [216, 66], [224, 74], [218, 84], [228, 92], [222, 100], [234, 104], [240, 106]];
  Q.FRONT3 = 'M 188,118 C 190,96 202,68 218,48 L ' + Q.JAG3.slice(1).map((p) => p.join(',')).join(' L ') + ' C 222,116 204,118 188,118 Z';
  Q.BACKP = 'M 164,112 C 164,92 170,74 182,60 C 190,69 197,80 201,93 L 204,114 Z';
  Q.LAPPETS = [[[172, 114], [160, 140], [150, 166], [142, 194]], [[181, 118], [172, 146], [164, 172], [158, 200]]];
  Q.facePt = planeP(Q.FACE, Q.YAW, Q.ROLL);

  // ---- pose rig (screen space; the body itself is drawn in body space under the lean shear) ----
  Q.rig = function (S) {
    const pose = S.pose, mv = S.move;
    // elN / elF: elbows (screen). far.g: 'bless' | 'open' | 'grip'
    const R = { pose, mv, lean: 0, dx: 0, ang: 0, foot: [270, 356], mc: null, nearD: 170, farD: 0, elN: [248, 230], elF: [150, 238], far: { p: [126, 186], g: 'bless', a: -106 }, mirror: { rx: 18, ry: 24, rot: 0, mode: 'dark' }, cope: 0 };
    if (pose === 'windup') {
      if (mv === 'base') { R.ang = 12; R.mc = [293, -20]; R.nearD = 138; R.elN = [284, 162]; R.elF = [150, 200]; R.far = { p: [124, 150], g: 'open', a: -122 }; }
      else if (mv === 'p2') { R.lean = 6; R.ang = 40; R.mc = [352, 86]; R.nearD = 140; R.farD = 205; R.elN = [290, 206]; R.elF = [192, 240]; R.mirror = { rx: 10, ry: 24, rot: 0, mode: 'turn' }; }
      else { R.ang = 90; R.mc = [360, 198]; R.nearD = 82; R.farD = 156; R.elN = [262, 228]; R.elF = [178, 226]; R.mirror = { rx: 6, ry: 24, rot: 0, mode: 'edge' }; R.cope = 1; }
    } else if (pose === 'attack') {
      if (mv === 'base') { R.lean = 5; R.ang = 7; R.foot = [306, 360]; R.nearD = 145; R.elN = [290, 200]; R.elF = [160, 216]; R.far = { p: [126, 240], g: 'open', a: 146 }; }
      // p2 attack: the flash drives the staff down to 54° and the body recoils back 4° (the foot end kicks out behind)
      else if (mv === 'p2') { R.lean = -4; R.ang = 54; R.mc = [348, 112]; R.nearD = 120; R.farD = 196; R.elN = [278, 214]; R.elF = [188, 254]; R.mirror = { rx: 10, ry: 24, rot: 0, mode: 'turn' }; }
      // p3 attack: lunge (+10 slide, 7° forward); the cope settles again
      else { R.dx = 10; R.lean = 7; R.ang = 90; R.mc = [380, 198]; R.nearD = 82; R.farD = 156; R.elN = [282, 222]; R.elF = [200, 224]; R.mirror = { rx: 6, ry: 24, rot: 0, mode: 'edge' }; R.cope = 0; }
    }
    const a = R.ang * RAD;
    R.dir = [Math.sin(a), -Math.cos(a)];
    if (R.mc) R.foot = [R.mc[0] - R.dir[0] * Q.LEN, R.mc[1] - R.dir[1] * Q.LEN];
    else R.mc = [R.foot[0] + R.dir[0] * Q.LEN, R.foot[1] + R.dir[1] * Q.LEN];
    R.at = (d) => [R.mc[0] - R.dir[0] * d, R.mc[1] - R.dir[1] * d];
    R.near = R.at(R.nearD);
    if (R.farD) R.far = { p: R.at(R.farD), g: 'grip' };
    if (R.mirror.mode === 'dark') R.mirror.rot = R.ang;
    R.k = leanK(R.lean);
    R.L = leanP(R.k, R.dx); R.Li = leanInv(R.k, R.dx);
    return R;
  };

  // big crack (mirror-local): starts under the eyes, reaches the bottom rim in P3 and in death
  Q.bigCrack = (o) => (o.ph >= 3 || o.dead ? [[1, 3], [-1, 9], [3, 15], [1, 21], [3, 27]] : [[1, 3], [-1, 9], [3, 15], [1, 20]]);
  // ---- face: cracked mirror on ONE plane (rim, paper, impact eyes, cracks, mitre-band crescent) ----
  // o: { clone, hot, dead, ph }
  Q.face = function (X, o) {
    const g = X.game, tf = plane(Q.FACE, Q.YAW, Q.ROLL), [mx, my] = Q.MR;
    const rw = X.v(5, 8), irx = mx - rw / 2, iry = my - rw / 2;
    const faceD = ell(0, 0, mx, my), innerD = ell(0, 0, irx, iry);
    let s = '';
    // thickness band (art): the back plate shows only on the LEFT edge (yaw turns the left edge toward us).
    // 검수 F9: depth 14 → planeEdge 7 so 3–4u of band stay visible next to the rim, outline 1.4
    s += X.art(`<g transform="translate(${f(-planeEdge(14, Q.YAW))},0) ${tf}"><path d="${faceD}" fill="${K.ink500}" stroke="${K.ink}" stroke-width="1.4"/></g>`);
    s += `<g transform="${tf}"><path d="${faceD}" fill="${o.clone ? K.ink700 : K.paper}"/></g>`;
    // shadow crescent cast by the mitre band: upper inner edge, 205°→318°, thickest (7) toward the right end, ends above the eyes
    if (!o.clone) {
      const Pout = [], Pin = [], N = 18;
      for (let i = 0; i <= N; i++) {
        const t = i / N, a = (205 + 113 * t) * RAD, th = t < 0.84 ? 1 + 6 * Math.pow(t / 0.84, 1.3) : 7 * (1 - t) / 0.16;
        Pout.push([irx * Math.cos(a), iry * Math.sin(a)]); Pin.push([(irx - th) * Math.cos(a), (iry - th) * Math.sin(a)]);
      }
      const cres = 'M ' + Pout.map(pt).join(' L ') + ' L ' + Pin.reverse().map(pt).join(' L ') + ' Z';
      s += g ? `<g transform="${tf}"><path d="${cres}" fill="${K.paper300}"/></g>` : X.ht(cres, 'd40', tf, [Q.FACE[0] - 30, Q.FACE[1] - 34, 60, 40]);
      // accent (art): one short paper50 reflection stroke riding the crescent's left part
      s += X.art(`<g transform="${tf}">${X.TW([-17.6, -9.2, -15.6, -14.4, -11.4, -18.4], 1.2, 'mid', K.paper50)}</g>`);
    }
    // cracks: big crack starting BELOW the eyes and running to the bottom rim (reads as nose/mouth), branches from both
    // impact points. 검수 F5: nothing bridges the two sockets; 검수 F8: every crack tapers from root to tip (crackT)
    const big = Q.bigCrack(o);
    const br = g ? [[[-10.5, -11], [-13, -18]], [[11, 0], [15, 7]]]
      : [[[-12.5, -9], [-15, -14], [-18, -15]], [[-13.5, -4], [-18, -2]], [[-7.5, -1], [-8, 5]], [[12.5, -8], [15, -13]], [[13.5, -3], [18, -2], [20, 1]], [[8.5, 1], [9, 6]]];
    if (o.ph >= 2 || o.dead) br.push([[-1, 9], [-9, 12], [-16, 16]]);
    if (o.ph >= 3 || o.dead) { br.push([[1, 21], [-6, 23]]); br.push([[17, 1], [21, 4]]); }
    if (o.dead) br.push([[1, 3], [12, 8], [19, 12]], [[-3, -14], [-2, -22]]);
    const cw = X.v(2.4, 4.4), core = X.v(0.8, 1.6), bw = X.v(1.1, 3.6);
    let k = `<g clip-path="url(#${X.clip(innerD)})">`;
    if (o.clone) {
      k += crackT(X, big, X.v(1.4, 3.6), K.ink300) + br.map((b) => crackT(X, b, X.v(0.9, 3), K.ink300)).join('');
      Q.EYES.forEach(([x, y]) => { k += `<path d="${star(x, y, X.v(4.6, 5.2), X.v(2.4, 2.8), g ? 5 : 6)}" fill="none" stroke="${K.ink300}" stroke-width="${f(X.v(1, 2.4))}" stroke-linejoin="round"/>`; });
    } else {
      k += crackT(X, big, cw, K.ink) + (o.dead ? '' : crackT(X, big, core, K.paper50));
      br.forEach((b) => { k += crackT(X, b, bw, K.ink); });
      // impact eyes: ink star socket + paper50 glint (same size: one plane). 검수 F5: game R 6.2 / r 3.9
      const R0 = X.v(5.5, 6.2), r0 = X.v(3.2, 3.9), gl = X.v(1.8, 3);
      Q.EYES.forEach(([x, y]) => {
        k += `<path d="${star(x, y, R0, r0, g ? 5 : 6, -80)}" fill="${K.ink}"/>`;
        if (o.dead) return;
        k += o.hot ? `<circle cx="${x}" cy="${y}" r="${f(gl * 2.1)}" fill="${K.paper50}" opacity="0.35"/><circle cx="${x}" cy="${y}" r="${f(gl * 1.7)}" fill="${K.paper50}"/>`
          : `<circle cx="${x}" cy="${y}" r="${f(gl)}" fill="${K.paper50}"/>`;
      });
    }
    k += `</g>`;
    s += `<g transform="${tf}">${k}<path d="${faceD}" fill="none" stroke="${K.ink}" stroke-width="${f(rw)}"/></g>`;
    return s;
  };

  // ---- mitre: back panel (lit glass, 20% dots) + front panel (ch2 glass cells, ink leads) + band ----
  Q.mitre = function (X, o) {
    const g = X.game, ph = o.ph, glass = o.clone ? K.ink700 : K.ch2.deep;
    let s = X.S(Q.BACKP, o.clone ? K.ink700 : K.ink500, 2.4, (g ? '' : `<path d="${Q.BACKP}" fill="${X.pat('d20')}"/>`) +
      X.art(X.TW([174, 104, 175, 88, 181, 72], 1.1, 'mid', K.paper300)));
    const FR = ph >= 3 ? Q.FRONT3 : Q.FRONT;
    let inner = '';
    if (!o.clone) {
      // shadow half: right side of the centre lead (game: flat ink500 plane, art: 40% dots)
      const rightHalf = 'M 218,40 C 216,70 214,92 213,122 L 252,122 L 252,40 Z';
      inner += g ? `<path d="${rightHalf}" fill="${K.ink500}"/>` : `<path d="${rightHalf}" fill="${X.pat('d40')}"/><path d="M 182,40 L 218,40 C 216,70 214,92 213,122 L 182,122 Z" fill="${X.pat('d20')}"/>`;
      if (ph === 2) {
        // P2 mark: the upper-right cell is broken out — ink cavity with a jagged glass rim
        inner += `<path d="${jag([[218, 58], [231, 66], [237, 82], [217, 82], [216, 70]], 1.6, 3, 5)}" fill="${K.ink}"/>` +
          `<path d="M 217,60 L 222,66 L 219,70 L 225,72 M 235,74 L 230,78 L 236,80" fill="none" stroke="${K.ch2.deep}" stroke-width="${f(X.v(1.4, 3))}" stroke-linejoin="round"/>`;
      }
      if (ph >= 3) inner += `<path d="M ${Q.JAG3.map((p) => p.join(',')).join(' L ')} L 240,114 L 216,118 L 214,52 Z" fill="${K.ink}"/>`;
    }
    // ink lead lines (game 2 cells, art 3)
    const leadW = X.v(2.4, 4.4);
    inner += X.LW('M 218,48 C 216,70 214,92 213,118', leadW, K.ink) + (g ? '' : X.LW('M 215,82 C 224,82 232,84 240,88', leadW, K.ink));
    if (ph >= 2 && !o.clone) inner += pcrack(X, [[207, 70], [212, 78], [208, 85], [217, 92], [214, 99], [228, 105]]);
    s += X.S(FR, glass, 2.4, inner);
    if (ph >= 3 && !o.clone) s += X.LW(line(Q.JAG3), X.v(2.2, 4), K.ink) + X.art(X.LW('M 221,57 L 216,66 L 223,74', 0.9, K.ink300));
    // band (circlet): downward-bowed arc, lit top edge
    s += X.S(Q.BAND, o.clone ? K.ink700 : K.ink, 2.2, `<path d="M 166,100 C 186,109 216,109 238,96 L 238,102 C 216,114 186,114 166,106 Z" fill="${K.ink500}"/>`);
    if (ph >= 2 && !o.clone) s += drip(X, 228, 100, ph >= 3 ? 16 : 11, 4.4);
    return s;
  };

  // ---- rose window (chest morse): r30 on the body plane (yaw 30 → rx 26), petals 8 art / 6 game, ink square plug ----
  Q.rose = function (X, o) {
    const g = X.game, tf = plane(Q.ROSE, Q.YAW, 0), R = Q.ROSE_R, n = g ? 6 : 8, a0 = g ? -60 : -67.5;
    let s = `<g transform="${tf}"><path d="${circ(0, 0, R)}" fill="${o.clone ? K.ink700 : K.ch2.deep}"/></g>`;
    if (!o.clone) {
      // upper-left 20% / lower-right 40% (screen-aligned dots; the clip follows the plane)
      const rb = [Q.ROSE[0] - 32, Q.ROSE[1] - 32, 64, 64];
      if (!g) s += X.ht(`M -21.21,21.21 A ${R} ${R} 0 0 1 21.21,-21.21 Z`, 'd20', tf, rb);
      s += X.ht(`M 21.21,-21.21 A ${R} ${R} 0 0 1 -21.21,21.21 Z`, 'd40', tf, rb);
    }
    let k = '';
    for (let i = 0; i < n; i++) { const a = a0 + (i * 360) / n; k += X.LW(line([polar([0, 0], 6, a), polar([0, 0], R - 1, a)]), X.v(1.8, 3.8), K.ink); }
    if (!g) for (let i = 0; i < n; i++) { const a = a0 + ((i + 0.5) * 360) / n; k += X.LW(line([polar([0, 0], R - 9, a - 12), polar([0, 0], R - 4, a), polar([0, 0], R - 9, a + 12)]), 1.2, K.ink); }
    const rimW = X.v(3.4, 6);
    if (o.ph >= 3 && !o.clone) {
      // P3 core: the centre and lower-right panes are smashed out THROUGH the rim (a bitten disc, never a ring + centre):
      // jagged ink cavity, core token inside, 3 opaque paper50 glass shards off-centre
      const bite = [[-12, -4], [-4, -14], [8, -10], [18, -4], [33, 4], [30, 16], [22, 26], [10, 33], [2, 18], [-8, 10]];
      k += `<path d="${jag(bite, 2.2, 11, 5)}" fill="${K.ink}"/>` +
        `<path d="${jag([[-4, -5], [5, -6], [14, 2], [18, 12], [10, 18], [2, 9]], 1.4, 13, 4)}" fill="${K.core.bishop}"/>` +
        [[[-9, -3], [-3, -9], [-3, -1]], [[16, 5], [23, 9], [17, 12]], [[6, 20], [13, 22], [8, 27]]].map((P) => `<path d="${poly(P)}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="${f(X.v(1, 2))}" stroke-linejoin="round"/>`).join('');
      // the rim survives only outside the bite: from 76° clockwise through the bottom-left, top and right round to 4°
      s += `<g transform="${tf}">${k}<path d="M ${pt(polar([0, 0], R, 76))} A ${R} ${R} 0 1 1 ${pt(polar([0, 0], R, 4))}" fill="none" stroke="${K.ink}" stroke-width="${f(rimW)}"/></g>`;
      return s;
    }
    const q = X.v(4.5, 6);
    k += `<path d="M ${-q},${-q} L ${q},${-q} L ${q},${q} L ${-q},${q} Z" fill="${K.ink}"/>`;
    s += `<g transform="${tf}">${k}<path d="${circ(0, 0, R)}" fill="none" stroke="${K.ink}" stroke-width="${f(rimW)}"/></g>`;
    return s;
  };

  // ---- staff (screen space) + dark-glass mirror head ----
  Q.staff = function (X, o, R) {
    const d = line([R.foot, R.mc]);
    let s = X.LW(d, X.v(8, 11), K.ink) + X.LW(d, X.v(3.2, 4.6), o.clone ? K.ink700 : K.ink500);
    const kp = lerp(R.foot, R.mc, 0.6), a = R.ang;
    s += `<path d="${ell(kp[0], kp[1], 8.5, 5)}" transform="rotate(${f(a)} ${f(kp[0])} ${f(kp[1])})" fill="${K.ink700}" ${X.O(1.4)}/>`;
    s += `<path d="${ell(R.foot[0], R.foot[1], 5.5, 3.6)}" transform="rotate(${f(a)} ${f(R.foot[0])} ${f(R.foot[1])})" fill="${K.ink}"/>`;
    return s;
  };
  // spikes: 8 art (cardinals + diagonals), 4 game (diagonals); 'turn' mode lengthens the four cardinals (four-cardinal-glyphs)
  Q.mirrorHead = function (X, o, R) {
    const g = X.game, M = R.mirror, [cx, cy] = R.mc, rx = M.rx, ry = M.ry, fw = X.v(4.5, 6);
    let sp = [];
    if (M.mode === 'edge') sp = [[-90, 9], [90, 9]];
    else if (M.mode === 'turn') sp = [[-90, 20], [0, 20], [90, 20], [180, 20]].concat(g ? [] : [[-45, 7], [45, 7], [135, 7], [-135, 7]]);
    else sp = g ? [[-45, 9], [45, 9], [135, 9], [-135, 9]] : [[-90, 8], [0, 8], [90, 8], [180, 8], [-45, 7], [45, 7], [135, 7], [-135, 7]];
    let s = `<g transform="translate(${f(cx)},${f(cy)}) rotate(${f(M.rot)})">`;
    sp.forEach(([a, L]) => {
      const ex = rx + fw * 0.5, ey = ry + fw * 0.5, c = Math.cos(a * RAD), sn = Math.sin(a * RAD);
      const base = [ex * c, ey * sn], nl = Math.hypot(c * ey, sn * ex) || 1, nx = (c * ey) / nl, ny = (sn * ex) / nl;
      const tip = [base[0] + nx * L, base[1] + ny * L], w = L >= 14 ? 3.6 : 3;
      s += `<path d="${poly([[base[0] - ny * w, base[1] + nx * w], tip, [base[0] + ny * w, base[1] - nx * w]])}" fill="${K.ink}" ${X.O(0.8)}/>`;
    });
    s += `<path d="${ell(0, 0, rx + fw * 0.5, ry + fw * 0.5)}" fill="${K.ink}" ${X.O(1.2)}/>`;
    s += `<path d="${ell(0, 0, rx, ry)}" fill="${K.ink700}"/>`;
    if (!o.clone) {
      s += `<path d="${ell(0, 0, Math.max(1, rx - 2), ry - 2)}" fill="none" stroke="${K.ink300}" stroke-width="${f(X.v(1, 2.4))}"/>`;
      if (rx > 8) s += X.TW([-rx * 0.5, ry * 0.4, -rx * 0.72, -ry * 0.1, -rx * 0.2, -ry * 0.66], X.v(2.6, 4.4), 'mid', K.ch2.deep);
      if (M.mode === 'turn') s += `<path d="M 0,${-ry} A ${rx} ${ry} 0 0 1 0,${ry} A ${f(rx * 0.45)} ${ry} 0 0 0 0,${-ry} Z" fill="${K.paper50}"/>`;
    } else s += X.LW(`M ${f(-rx * 0.4)},${f(-ry * 0.5)} L ${f(rx * 0.1)},0 L ${f(-rx * 0.2)},${f(ry * 0.45)}`, X.v(1, 2.4), K.ink300);
    return s + `</g>`;
  };
})(window.PN);
// ---------- 유리 주교 — part 2/2: composition · pose FX · phases · clone · death · anchors ----------
(function (PN) {
  'use strict';
  const C = PN.bossesC, K = C.K, Q = C._bishop;
  const { ell, drip, flame, exclaim, dry, f, pt, RAD, poly, line, lerp, polar, rotP, jag, bandD, ik, leanT, G, sleeve, hand, xMark, puddle, scrap, squashT, plane, planeP } = C._;

  function lappets(X, o) {
    return Q.LAPPETS.map((P, i) => X.P(bandD(P, (t) => (X.game ? 5.2 : 4.4) - t * 1.2, 14, [1.4, 1, i * 2]), o.clone ? K.ink700 : K.ink, 2)).join('');
  }
  function body(X, R, o) {
    const INK = o.clone ? K.ink700 : K.ink;
    let s = X.S(R.cope ? Q.COPE_FLY : Q.COPE, INK, 2.6, `<path d="${R.cope ? Q.FOLD_FLY : Q.FOLD}" fill="${K.ink500}"/>` + X.art(dry(X, [176, 164, 152, 196, 140, 240, 128, 300], 4, 3, K.ink300, 5)));
    s += X.SS(Q.ALB, K.ink700, 2.2, X.art(X.T([214, 256, 212, 300, 210, 354], 1.2, 'mid', K.ink500)));
    s += Q.rose(X, o);
    s += X.S(Q.HOOD, INK, 2.6, `<path d="${Q.HOODLIT}" fill="${K.ink500}"/>` + X.art(dry(X, [172, 126, 168, 144, 172, 166], 2.6, 2, K.ink300, 8)));
    s += Q.face(X, o) + Q.mitre(X, o);
    return s;
  }
  // arms in body space (targets come from the screen-space rig through R.Li)
  function arms(X, R, o) {
    const INK = o.clone ? K.ink700 : K.ink, out = { s: '' };
    const one = (sh, elS, tgt, kind, a, w, fill, lit) => {
      const hp = R.Li(tgt), el = elS ? R.Li(elS) : ik(sh, hp, 48, 48, 1), u = [hp[0] - el[0], hp[1] - el[1]], ul = Math.hypot(u[0], u[1]) || 1;
      const wr = [hp[0] - (u[0] / ul) * 9, hp[1] - (u[1] / ul) * 9];
      const cuff = [-u[1] / ul, u[0] / ul], cw = w[2] * 0.92;
      return { s: sleeve(X, sh, el, wr, w, fill, lit, true, INK).s + X.LW(line([[wr[0] + cuff[0] * cw, wr[1] + cuff[1] * cw], [wr[0] - cuff[0] * cw, wr[1] - cuff[1] * cw]]), X.v(2.2, 3.6), K.ink500) + hand(X, kind, hp, a, INK, X.game ? 1.12 : 1), wr };
    };
    const F = R.far, fa = F.g === 'grip' ? R.ang : F.a;
    const far = one(Q.SHF, R.elF, F.p, F.g, fa, [9.5, 8.5, 13], K.ink700, true);
    const near = one(Q.SHN, R.elN, R.near, R.nearG || 'grip', R.nearG ? R.nearA : R.ang, [10.5, 9.5, 14], INK, true);
    out.s = far.s + near.s; out.wrF = far.wr; out.wrN = near.wr;
    return out;
  }
  function drips(X, R, o, A) {
    // the clone keeps the idle drips so its mono silhouette equals the real bishop's
    let s = drip(X, 150, 360, 10, 4.4) + drip(X, 262, 358, 12, 4.4) + drip(X, A.wrN[0], A.wrN[1] + 12, 10, 4.2);
    if (o.ph >= 3) s += drip(X, 128, 356, 16, 5) + drip(X, 176, 361, 20, 5.4) + drip(X, 236, 361, 16, 5) + drip(X, A.wrF[0], A.wrF[1] + 12, 16, 4.6) + drip(X, A.wrN[0] - 8, A.wrN[1] + 14, 18, 4.8);
    return s;
  }
  // tapered ink ray with a paper core, from r0 to r0+L at angle a (deg) around c
  function ray(X, c, a, r0, L, w) {
    const p0 = polar(c, r0, a), p1 = polar(c, r0 + L, a), m = lerp(p0, p1, 0.5);
    return X.TW([p0[0], p0[1], m[0], m[1], p1[0], p1[1]], w, 'start', K.ink) + X.TW([p0[0], p0[1], m[0], m[1], p1[0], p1[1]], w * 0.38, 'start', K.paper50);
  }
  // pose FX = shape cue (count / cone / lane), never direction; ink + paper only, ≤ 80 from the prop, no hatching
  function fx(X, R, o) {
    const g = X.game, c = R.mc, M = R.mirror, w = X.v(5, 7);
    const edgeR = (a) => { const ca = Math.cos(a * RAD), sa = Math.sin(a * RAD), rx = M.rx + 3, ry = M.ry + 3; return 1 / Math.sqrt((ca / rx) ** 2 + (sa / ry) ** 2); };
    let s = '';
    if (R.pose !== 'windup' && R.pose !== 'attack') return s;
    if (R.pose === 'windup' && R.mv === 'base') {
      [-45, 45, 135, -135].forEach((a) => { const aa = a + M.rot; s += ray(X, c, aa, edgeR(a) + 11, 18, w); }); // X-shaped 4 rays = 4 clones
      s += `<g transform="translate(${f(c[0])},${f(c[1])}) rotate(${f(M.rot)})">${X.TW([-9, 12, -2, 0, 8, -14], X.v(2.6, 4.4), 'mid', K.paper50)}</g>`;
    } else if (R.pose === 'attack' && R.mv === 'base') {
      // paper flash on the glass: a 4-point sparkle on the mirror's own axes (+, never ✕ — ✕ is the death grammar), art adds 4 short diagonal glints
      const sx = M.rx - 1, sy = M.ry - 1, q = X.v(3, 4);
      const spark = `M 0,${-sy} Q ${q},${-q} ${sx},0 Q ${q},${q} 0,${sy} Q ${-q},${q} ${-sx},0 Q ${-q},${-q} 0,${-sy} Z`;
      s += `<g transform="translate(${f(c[0])},${f(c[1])}) rotate(${f(M.rot)})"><path d="${spark}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="${f(X.v(1.2, 2))}" stroke-linejoin="round"/>` +
        X.art([45, 135, 225, 315].map((a) => X.LW(line([polar([0, 0], 7, a), polar([0, 0], 12, a)]), 1.2, K.paper50)).join('')) + `</g>`;
      // four dark glass shards flying out diagonally (70–90 from the mirror)
      [[-45, 78], [45, 72], [135, 84], [-135, 76]].forEach(([a, d], i) => {
        const p = polar(c, d, a + M.rot), r = 8 + (i % 2) * 2;
        s += `<path d="${poly([polar(p, r, a + 70), polar(p, r * 1.2, a + 200), polar(p, r * 0.7, a + 300)])}" fill="${K.ink700}" ${X.O(1)}/>` + X.LW(line([polar(p, r * 0.6, a + 80), polar(p, r * 0.6, a + 200)]), X.v(1.2, 2.4), K.ch2.deep);
      });
    } else if (R.mv === 'p2') {
      const fan = R.pose === 'windup' ? [-25, 0, 25] : [-30, -15, 0, 15, 30], L = R.pose === 'windup' ? 52 : 60, r0 = R.pose === 'windup' ? 14 : 8;
      fan.forEach((a) => { s += ray(X, c, a, r0, L, w); }); // cone
      if (R.pose === 'attack') s += `<path d="${ell(c[0], c[1], 9, 12)}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="${f(X.v(2, 3.4))}"/>`;
    } else if (R.mv === 'p3') {
      if (R.pose === 'windup') {
        [-1, 1].forEach((k) => { const y = c[1] + k * (M.ry + 1), p0 = [c[0] + 5, y], p1 = [c[0] + 51, y]; s += X.TW([p0[0], p0[1], (p0[0] + p1[0]) / 2, y, p1[0], y], w * 0.9, 'start', K.ink); }); // lane borders
      } else {
        const x0 = c[0] + 6, x1 = 424, y = c[1];
        s += `<path d="M ${x0},${f(y - 8)} L ${x1},${f(y - 3)} L ${x1},${f(y + 3)} L ${x0},${f(y + 8)} Z" fill="${K.paper50}" stroke="${K.ink}" stroke-width="${f(X.v(2.6, 4.4))}" stroke-linejoin="round"/>`;
      }
    }
    return s;
  }
  // clone: paper50 lead lattice (~26 irregular cells), α0.55, masked to the body by the composer (rims).
  // 검수 R4: built inside the pose's own bounds b = [x0,y0,x1,y1] (edge points pinned) so getBBox never grows past the figure
  function lattice(X, b) {
    const r = PN.rng(41), sp = 26, nx = Math.max(2, Math.round((b[2] - b[0]) / sp)), ny = Math.max(2, Math.round((b[3] - b[1]) / sp)), P = [];
    for (let j = 0; j <= ny; j++) {
      P.push([]);
      for (let i = 0; i <= nx; i++) { const edge = i === 0 || j === 0 || i === nx || j === ny; P[j].push([b[0] + (i * (b[2] - b[0])) / nx + (edge ? 0 : (r() - 0.5) * 13), b[1] + (j * (b[3] - b[1])) / ny + (edge ? 0 : (r() - 0.5) * 13)]); }
    }
    let d = '';
    for (let j = 0; j <= ny; j++) d += line(P[j]) + ' ';
    for (let i = 0; i <= nx; i++) d += line(P.map((row) => row[i])) + ' ';
    return `<path d="${d}" fill="none" stroke="${K.paper50}" stroke-width="${f(X.v(1, 2.2))}" stroke-linejoin="round" opacity="0.55"/>`;
  }

  C.parts.bishop = function (X, S) {
    if (S.pose === 'death') return death(X, S);
    const R = Q.rig(S), o = { clone: S.clone, hot: S.enraged, ph: S.phase, dead: false };
    const lt = leanT(R.k, R.dx), A = arms(X, R, o);
    let back = '', fig = '';
    let bk = lappets(X, o);
    if (S.enraged) bk = flame(X, 218, 58, 38, 15, 0.08, 1) + flame(X, 182, 68, 30, 13, -0.25, 2) + bk;
    back += G(lt, bk);
    if (S.enraged) back += flame(X, R.mc[0], R.mc[1] - R.mirror.ry - 4, 30, 14, 0.18, 3);
    fig += G(lt, body(X, R, o) + drips(X, R, o, A));
    fig += Q.staff(X, o, R) + Q.mirrorHead(X, o, R);
    fig += G(lt, A.s);
    let front = fx(X, R, o);
    if (S.windup && !S.clone) front += exclaim(X, Q.HEAD[0], Q.HEAD[1], 1.1);
    // enrage fill-silhouette: narrow slits never get the coral pulse — idle: staff ↔ cope, blessing forearm ↔ cope;
    // 검수 F2: attack base: the wedge between the slammed staff and the cope's front edge
    let solid = '';
    if (S.pose === 'idle') solid = poly([[236, 160], [268, 160], [268, 332], [236, 332]]) + ' ' + poly([[128, 186], [156, 180], [154, 242], [140, 242]]);
    else if (S.pose === 'attack' && S.move === 'base') solid = poly([[258, 196], [330, 190], [312, 362], [272, 362]]);
    // windup base: the slit between the raised far forearm and the hood (≈ 15 wide, closed by the shoulder)
    else if (S.pose === 'windup' && S.move === 'base') solid = poly([[132, 140], [168, 128], [174, 178], [156, 196], [140, 160]]);
    // lattice bounds = this pose's figure (body under the lean + staff + far hand)
    const lb = [Math.min(108 + Math.min(0, R.k) * 312 + R.dx, R.foot[0] - 30, R.mc[0] - 36, R.far.p[0] - 22), Math.min(40, R.mc[1] - 40), Math.max(284 + Math.max(0, R.k) * 312 + R.dx, R.foot[0] + 30, R.mc[0] + 36), 366];
    return { back, fig, front, solid, rims: S.clone ? lattice(X, lb) : '' };
  };
  Q.HEAD = [130, 44]; // '!' (and status icon) spot: empty sky left of the mitre in every pose

  // ---------------- death (handoff §1.3): f0 hit · f1 collapse 70% · f2 melt 40% · f3 ink puddle ----------------
  Q.deathRig = function (fr) {
    const R = Q.rig({ pose: 'idle', move: 'base' });
    if (fr === 0) { // staff slips 25° about the grip
      R.ang = 25; R.mc = rotP(R.mc, R.near, 25); R.foot = rotP(R.foot, R.near, 25); R.mirror.rot = 25;
      R.far = { p: [150, 210], g: 'open', a: 112 };
    }
    return R;
  };
  function death(X, S) {
    const fr = S.frame, o = { clone: false, hot: false, ph: 3, dead: true };
    let back = '', fig = '', over = '';
    if (fr === 0) {
      const R = Q.deathRig(0), A = arms(X, R, o);
      back += lappets(X, o);
      // body without the mitre, then the mitre tipped back 8° about the band
      fig += bodyNoMitre(X, R, o) + `<g transform="rotate(-8 204 114)">${Q.mitre(X, o)}</g>` + drips(X, R, o, A);
      fig += Q.staff(X, o, R) + Q.mirrorHead(X, o, R) + A.s;
      // four mirror shards fly off the face
      const c = Q.FACE;
      [[-36, -20, -30], [32, -26, 20], [-30, 24, 200], [36, 16, 120]].forEach(([dx, dy, a], i) => {
        const p = [c[0] + dx, c[1] + dy], r = 6 + (i % 2) * 1.5;
        over += `<path d="${poly([polar(p, r, a), polar(p, r * 1.1, a + 130), polar(p, r * 0.8, a + 240)])}" fill="${K.paper300}" stroke="${K.ink}" stroke-width="${f(X.v(1.6, 3.2))}" stroke-linejoin="round"/>`;
      });
      return { back, fig, over };
    }
    if (fr === 1) {
      // knees fold: the cope pools (squash 0.7, hem widens), mitre falls back 40°, staff topples backward
      const R = Q.rig({ pose: 'idle', move: 'base' });
      R.near = [262, 236]; R.nearG = 'open'; R.nearA = 96; R.far = { p: [150, 238], g: 'open', a: 100 };
      const A = arms(X, R, o);
      fig += `<g transform="${squashT(1.12, 0.7, 194)}">${bodyNoMitre(X, R, o)}${A.s}</g>`;
      const st = { ang: -50, foot: [252, 356] }; st.dir = [Math.sin(st.ang * RAD), -Math.cos(st.ang * RAD)]; st.mc = [st.foot[0] + st.dir[0] * Q.LEN, st.foot[1] + st.dir[1] * Q.LEN];
      back += Q.staff(X, o, st) + Q.mirrorHead(X, o, { mc: st.mc, mirror: { rx: 18, ry: 24, rot: -50, mode: 'dark' } });
      fig += `<g transform="translate(-30,76) rotate(-40 204 114)">${Q.mitre(X, o)}</g>`;
      fig += drip(X, 118, 352, 14, 5) + drip(X, 196, 360, 18, 5.4) + drip(X, 270, 354, 12, 4.6);
      return { back, fig, over };
    }
    if (fr === 2) {
      // melting ink mound (y 250–360); the mirror slides forward off its face; staff down behind; art: 3 manuscript scraps
      const MOUND = 'M 104,360 C 108,338 118,316 130,298 C 140,282 150,262 166,252 C 180,244 200,244 216,252 C 234,262 246,278 258,294 C 270,310 284,332 292,360 C 250,366 140,366 104,360 Z';
      back += Q.staff(X, o, { foot: [340, 352], mc: [26, 322], ang: -84.5 }) + Q.mirrorHead(X, o, { mc: [26, 322], mirror: { rx: 18, ry: 9, rot: 0, mode: 'dark' } });
      fig += X.S(MOUND, K.ink, 2.6, `<path d="M 166,252 C 150,262 140,282 130,298 C 120,314 110,336 106,358 L 128,356 C 132,330 142,306 156,286 C 166,272 176,262 190,256 Z" fill="${K.ink500}"/>` + X.art(dry(X, [168, 254, 146, 270, 132, 296, 118, 330], 4, 3, K.ink300, 6)));
      fig += `<g transform="translate(-4,92) rotate(-58 204 114) scale(0.9)">${Q.mitre(X, o)}</g>`;
      fig += drip(X, 132, 344, 14, 5) + drip(X, 170, 358, 16, 5.4) + drip(X, 224, 358, 18, 5.4) + drip(X, 268, 350, 14, 5);
      // the mirror face, slid forward and tipped (same plane rules, eyes out)
      const tf = `translate(248,318) rotate(38) scale(0.78,0.86)`;
      over += `<g transform="${tf}"><path d="${ell(0, 0, 23, 27)}" fill="${K.paper}" stroke="${K.ink}" stroke-width="${f(X.v(5, 8))}"/>` +
        C._.crackT(X, Q.bigCrack({ dead: true }), X.v(2.4, 4.4)) + C._.crackT(X, [[-12.5, -9], [-17, -15]], X.v(1.1, 3.6)) + C._.crackT(X, [[13.5, -3], [19, 1]], X.v(1.1, 3.6)) +
        Q.EYES.map(([x, y]) => `<path d="${C._.star(x, y, X.v(5.5, 6.2), X.v(3.2, 3.9), X.game ? 5 : 6, -80)}" fill="${K.ink}"/>`).join('') + `</g>`;
      over += X.art(scrap(X, 96, 330, 9, -20, 1) + scrap(X, 300, 342, 8, 25, 2) + scrap(X, 150, 300, 7, 10, 3));
      return { back, fig, over };
    }
    // f3: puddle (192,346) rx132 ry32 · mirror relic lying flat (rx22 ry9) with paper ✕ eyes · staff across · two glass shards
    const P = puddle(X, 192, 342, 132, 29, 7);
    fig += P.s;
    fig += Q.staff(X, o, { foot: [66, 352], mc: [318, 334], ang: 85.9 }) + Q.mirrorHead(X, o, { mc: [318, 334], mirror: { rx: 18, ry: 8, rot: 0, mode: 'dark' } });
    const relic = 'translate(202,340) scale(1,0.36)';
    fig += `<g transform="${relic}"><path d="${ell(0, 0, 23, 27)}" fill="${K.paper}" stroke="${K.ink}" stroke-width="${f(X.v(5, 8))}"/>` +
      C._.crackT(X, Q.bigCrack({ dead: true }), X.v(2.4, 4.4)) + C._.crackT(X, [[-13.5, -4], [-20, 2]], X.v(1.1, 3.6)) + `</g>`;
    Q.EYES.forEach(([x, y]) => { fig += `<g transform="translate(${f(202 + x)},${f(340 + y * 0.36)}) scale(1,0.55)">${xMark(X, 0, 0, X.v(4.2, 5))}</g>`; });
    [[146, 350, 8, 20], [262, 356, 7, -30]].forEach(([x, y, r, a]) => {
      fig += `<path d="${poly([polar([x, y], r, a), polar([x, y], r * 1.1, a + 140), polar([x, y], r * 0.7, a + 250)])}" fill="${K.ch2.deep}" stroke="${K.ink}" stroke-width="${f(X.v(1.6, 3.2))}" stroke-linejoin="round"/>`;
    });
    return { back, fig, over };
  }
  function bodyNoMitre(X, R, o) {
    const INK = K.ink;
    let s = X.S(Q.COPE, INK, 2.6, `<path d="${Q.FOLD}" fill="${K.ink500}"/>` + X.art(dry(X, [176, 164, 152, 196, 140, 240, 128, 300], 4, 3, K.ink300, 5)));
    s += X.SS(Q.ALB, K.ink700, 2.2, '') + Q.rose(X, o) + X.S(Q.HOOD, INK, 2.6, `<path d="${Q.HOODLIT}" fill="${K.ink500}"/>`) + Q.face(X, o);
    return s;
  }

  // anchors from the same rig (pose · move · windup · frame)
  C.anchorsOf.bishop = (S) => {
    const fp = (L) => ({ face: L(Q.FACE), cracks: Q.EYES.map((p) => L(Q.facePt(p))) });
    if (S.pose === 'death') {
      const fr = S.frame;
      if (fr === 0) { const R = Q.deathRig(0); return Object.assign(fp((p) => p), { head: Q.HEAD.slice(), mirror: R.mc, muzzle: R.mc, staffFoot: R.foot }); }
      const sq = (p) => [194 + (p[0] - 194) * 1.12, 360 - (360 - p[1]) * 0.7];
      if (fr === 1) { const st = [252 - Math.sin(50 * RAD) * Q.LEN, 356 - Math.cos(50 * RAD) * Q.LEN]; return Object.assign(fp(sq), { head: [150, 120], mirror: st, muzzle: st, staffFoot: [252, 356] }); }
      if (fr === 2) { const m = C._.xf(['translate', 248, 318], ['rotate', 38], ['scale', 0.78, 0.86]); return { face: m([0, 0]), cracks: Q.EYES.map(m), head: [190, 214], mirror: [26, 322], muzzle: [26, 322], staffFoot: [340, 352] }; }
      return { face: [202, 340], cracks: Q.EYES.map(([x, y]) => [202 + x, 340 + y * 0.36]), head: [192, 290], mirror: [318, 334], muzzle: [318, 334], staffFoot: [66, 352] };
    }
    const R = Q.rig(S);
    return Object.assign(fp(R.L), { head: Q.HEAD.slice(), muzzle: R.mc.slice(), mirror: R.mc.slice(), staffFoot: R.foot.slice(), hands: [R.near.slice(), R.far.p.slice()] });
  };
})(window.PN);
// ---------- 무채 조수왕 (tide-king · 3장 St5 · tide) — part 1/2: wrapped head · crown · robe ----------
// 가장 넓고 낮은 배 모양 덩어리(목 없음) · 오른쪽 위 펼친 우산 삼지창 · 앞으로 늘어진 수염.
// 얼굴 = 이 모듈 유일한 입체 머리: 좌표는 모두 _.wrap([206,134], 64, 42, yaw 25, tilt 15)에서 얻는다.
(function (PN) {
  'use strict';
  const C = PN.bossesC, K = C.K;
  const { ell, drip, pcrack, flame, dry, wrap, f, pt, RAD, poly, line, lerp, polar, smooth, jag, bandD, sample } = C._;
  const T = (C._tide = {});
  T.HC = [206, 134]; T.HRX = 64; T.HRY = 42; T.YAW = 25; T.TILT = 15;
  T.at = wrap(T.HC, T.HRX, T.HRY, T.YAW, T.TILT);
  const P = (lon, lat) => { const q = T.at(lon, lat); return [q.x, q.y]; };
  T.P = P;
  T.EYE_R = 9; T.EYES = [[-42, 25], [42, 25]];
  // pear robe: widest at y 300 (x 72–316), wavy water-bleed hem inside x 88–298 (y 352–362), no neck
  T.BODY = smooth([[150, 150], [132, 172], [110, 206], [92, 240], [78, 272], [72, 300], [76, 322], [86, 340], [91, 352], [100, 359], [114, 355], [130, 361], [148, 356], [166, 361], [184, 356], [202, 361], [220, 356], [238, 361], [256, 356], [274, 361], [289, 356], [297, 349], [302, 338], [310, 322], [316, 300], [312, 272], [301, 240], [287, 206], [273, 178], [262, 156], [240, 146], [206, 142], [170, 144]], true);
  T.FOLD = 'M 150,152 C 130,172 110,204 94,238 C 84,262 76,284 74,302 L 92,300 C 98,276 108,252 120,230 C 132,208 146,186 164,166 Z';
  // crown: iron band at latitude 50° (a downward-bowed arc by construction), 5 sluice plates, 3 reeds behind
  T.BAND_LAT = 50;
  T.PLATES = [-66, -34, -2, 30, 58];       // longitudes of the five plates
  T.bandPts = (lat, lo = -88, hi = 66) => { const out = []; for (let l = lo; l <= hi; l += 7) out.push(P(l, lat)); out.push(P(hi, lat)); return out; };
  T.plate = function (i) { // base centre, top centre, half widths (foreshortened by sx), flare angle
    const lon = T.PLATES[i], q = T.at(lon, T.BAND_LAT + 2), sx = Math.max(0.35, q.sx);
    const top = [q.x + lon * 0.14, [72, 64, 60, 63, 70][i]];
    return { b: [q.x, q.y], t: top, hw: 6.5 * sx + 0.8, lon };
  };

  // ---- wrapped head: base ink700, upper-left ink500 accent, washed face band, ONE terminator shadow, bubble eyes, mouth arc ----
  T.head = function (X, o) {
    // terminator = head − head moved (−16,−12): an evenodd rect kept tight to the head (getBBox ignores clips)
    const g = X.game, [cx, cy] = T.HC, hd = ell(cx, cy, T.HRX, T.HRY), BIG = poly([[cx - T.HRX - 4, cy - T.HRY - 4], [cx + T.HRX + 4, cy - T.HRY - 4], [cx + T.HRX + 4, cy + T.HRY + 4], [cx - T.HRX - 4, cy + T.HRY + 4]]);
    let inner = '';
    // accent: upper-left ink500 crescent (head − head moved down-right)
    inner += `<path d="${hd}" fill="${K.ink500}"/><path d="${ell(cx + 9, cy + 7, T.HRX, T.HRY)}" fill="${K.ink700}"/>`;
    // shadow mass: head − head moved (−16,−12) = lower-right terminator (ink900 on the head)
    const term = `${BIG} ${ell(cx - 16, cy - 12, T.HRX, T.HRY)}`;
    inner += `<path d="${term}" fill="${K.ink}" fill-rule="evenodd"/>`;
    // mouth: latitude −10° arc from lon −75° to the visible contour (cut there), near corner drooping 8
    const mouth = [];
    for (let l = -75; l <= 70; l += 5) { const q = T.at(l, -10); if (!q.visible) break; const droop = l < -50 ? 8 * Math.pow((-50 - l) / 25, 1.4) : 0; mouth.push([q.x, q.y + droop]); }
    // washed muzzle (무채로 씻긴 자리): from just under the eyes (lat 11°) down to the mouth arc, out to the right contour.
    // Its lower edge IS the mouth, so the mouth reads on the light face instead of vanishing into the jaw.
    const top = [];
    for (let l = -62; l <= 72; l += 6) { const q = T.at(l, 11); if (!q.visible) break; top.push([q.x, q.y]); }
    const right = T.at(66, 0);
    const wash = 'M ' + top.map(pt).join(' L ') + ' L ' + pt([right.x, right.y]) + ' L ' + mouth.slice().reverse().map(pt).join(' L ') + ' Q ' + pt(P(-74, 4)) + ' ' + pt(top[0]) + ' Z';
    // 검수 F1: "무채" = the ink washed off down to the paper: paper300 face plane (art keeps 20% / 40% terminator dots on it,
    // game puts a flat ink300 terminator) — the face now out-values the crown plates and the belt; the bubble eyes stay brightest
    const wc = X.clip(wash);
    inner += `<path d="${wash}" fill="${K.paper300}"/><g clip-path="url(#${wc})">` +
      (g ? `<path d="${term}" fill="${K.ink300}" fill-rule="evenodd"/>` : `<path d="${wash}" fill="${X.pat('d20')}"/><path d="${term}" fill="${X.pat('d40')}" fill-rule="evenodd"/>`) + `</g>`;
    const mw = X.v(2.6, 4.4), mid = mouth[Math.floor(mouth.length * 0.45)];
    inner += X.TW([mouth[0][0], mouth[0][1], mid[0], mid[1] + 3, mouth[mouth.length - 1][0], mouth[mouth.length - 1][1]], mw, 'mid', K.ink);
    inner += X.LW(line(mouth), mw * 0.6, K.ink);
    // nostrils (art): lon ±18°, lat 5°, one short tapered dash each (not round dots)
    if (!g) [-18, 18].forEach((l) => { const q = T.at(l, 5), w = 2.6 * Math.max(0.4, q.sx); inner += X.TW([q.x - w, q.y, q.x, q.y + 0.6, q.x + w, q.y], 1.6, 'mid', K.ink); });
    // chin whiskers: lon −14°, +18° at lat −32°. game: the near one, length 24, inside the head clip (unchanged).
    // K5def (K1 review 1 R10): in art the two read as short vertical ticks (the head outline clips them after ≈ 10), so art
    // hangs two curved barbels from the same chin points OUTSIDE the clip, over the collar: the near one longer (≈ 36),
    // bending down and to the left, the far one shorter (≈ 26, foreshortened), bending to the right — they diverge, never a
    // parallel pair. Same widths as before (ink 3.4 on a 5.4 ink300 edge).
    let barbels = '';
    if (g) [-14].forEach((l, i) => { const q = T.at(l, -32), d = [q.x, q.y, q.x - 3, q.y + 12, q.x - 1 + i * 2, q.y + 24]; inner += X.TW(d, X.v(3.4, 5.4) + X.v(2, 3.6), 'start', K.ink300) + X.TW(d, X.v(3.4, 5.4), 'start', K.ink); });
    else [[-14, [-1.4, 13.5, -7.4, 25.5, -16.4, 32.5]], [18, [2.5, 9.8, 8, 18.8, 16, 22.8]]].forEach(([l, c]) => { const q = T.at(l, -32), d = [q.x, q.y, q.x + c[0], q.y + c[1], q.x + c[2], q.y + c[3], q.x + c[4], q.y + c[5]]; barbels += X.TW(d, 5.4, 'start', K.ink300) + X.TW(d, 3.4, 'start', K.ink); });
    // bubble eyes (3장 지문) — the far eye is the same drawing squeezed by sx, tucked inside the right contour
    T.EYES.forEach(([lon, lat]) => { inner += T.eye(X, T.at(lon, lat), o); });
    return X.S(hd, K.ink700, 2.6, inner) + barbels;
  };
  T.eye = function (X, q, o) {
    const g = X.game, r = T.EYE_R, sx = q.sx, sy = q.sy, c = X.uid('e');
    const lidY = -r * 0.5; // heavy drowned upper lid covers the top quarter of both eyes (same ratio)
    X.defs.push(`<clipPath id="${c}"><circle cx="0" cy="0" r="${r}"/></clipPath>`);
    const hot = o.hot, dead = o.dead;
    let s = `<g transform="translate(${f(q.x)},${f(q.y)}) scale(${f(sx)},${f(sy)})">`;
    if (hot) s += `<circle r="${f(r * 2)}" fill="${K.paper50}" opacity="0.35"/>`;
    s += `<circle r="${r}" fill="${dead ? K.ink : K.paper50}" stroke="${K.ink}" stroke-width="${f(X.v(1.6, 2.6))}"/>`;
    if (!dead) {
      s += `<circle r="${f(r * 0.58)}" fill="none" stroke="${K.ink}" stroke-width="${f(r * X.v(0.18, 0.26))}"/>`;
      s += `<circle cx="${f(r * 0.15)}" r="${f(r * 0.3)}" fill="${hot ? K.paper50 : K.ink}"/>`;
    }
    s += `<g clip-path="url(#${c})"><path d="M ${-r - 2},${-r - 2} L ${r + 2},${-r - 2} L ${r + 2},${f(lidY)} Q 0,${f(lidY + 2)} ${-r - 2},${f(lidY)} Z" fill="${K.ink}"/></g>`;
    return s + `</g>`;
  };
  // whiskers: near one from the near mouth corner (S-curve, curls outward), far one from behind the right contour
  T.whiskerN = (X, o, tipDy = 0) => {
    const c0 = T.at(-75, -10), root = [c0.x, c0.y + 6];
    const d = [root[0], root[1], 140, 182 + tipDy * 0.4, 112, 214 + tipDy, 126, 238 + tipDy];
    return X.TW(d, X.v(6, 9) + X.v(2.4, 4), 'start', K.ink300) + X.TW(d, X.v(6, 9), 'start', K.ink) + X.art(X.TW([root[0] - 1, root[1] - 2, 138, 180, 112, 210], 1.1, 'mid', K.ink300)) +
      X.TW([126, 238 + tipDy, 120, 246 + tipDy, 110, 242 + tipDy], X.v(2.4, 4), 'start', K.ink);
  };
  T.whiskerF = (X) => {
    const d = [262, 146, 284, 158, 292, 182, 298, 208];
    return X.TW(d, X.v(5, 8) + X.v(2, 3.6), 'start', K.ink300) + X.TW(d, X.v(5, 8), 'start', K.ink);
  };

  // ---- crown: band + 5 sluice plates (ch3.deep) + 3 reeds; P2: 4th plate hangs on one nail at 30° ----
  T.crown = function (X, o) {
    const g = X.game, ph = o.ph;
    let s = '';
    // reeds behind the plates (tapered ink stalks, cattail heads 6×14) up to y 46; P3: snapped
    [[178, 48, -8], [204, 46, 2], [232, 52, 10]].forEach(([x, y, lean], i) => {
      const b = P([-40, 0, 36][i], 52);
      if (ph >= 3 && i !== 1) { const m = [lerp(b, [x, y], 0.55)[0], lerp(b, [x, y], 0.55)[1]]; const e = [m[0] + (i ? 18 : -18), m[1] + 10]; s += X.TW([b[0], b[1], m[0], m[1] + 4, m[0], m[1]], X.v(3, 4.6), 'start', K.ink) + X.TW([m[0], m[1], (m[0] + e[0]) / 2, m[1] - 2, e[0], e[1]], X.v(2.6, 4), 'start', K.ink) + `<path d="${ell(e[0], e[1], 3.2, 7)}" transform="rotate(${i ? 70 : -70} ${f(e[0])} ${f(e[1])})" fill="${K.ink}" ${X.O(0.6)}/>`; return; }
      s += X.TW([b[0], b[1], (b[0] + x) / 2 + lean * 0.3, (b[1] + y) / 2, x, y + 14], X.v(3, 4.6), 'start', K.ink) + `<path d="${ell(x, y + 7, 3.2, 7)}" transform="rotate(${lean} ${x} ${f(y + 7)})" fill="${K.ink}" ${X.O(0.6)}/>`;
    });
    // plates
    T.PLATES.forEach((lon, i) => {
      const p = T.plate(i), hw = p.hw, b = p.b, t = p.t;
      let d = poly([[b[0] - hw, b[1] + 2], [t[0] - hw * 0.92, t[1] + 2], [t[0], t[1] - 2], [t[0] + hw * 0.92, t[1] + 2], [b[0] + hw, b[1] + 2]]);
      let tf = '';
      if (ph >= 2 && i === 3) tf = ` transform="rotate(30 ${f(b[0] - hw)} ${f(b[1] - 4)}) translate(2,6)"`; // hangs on one nail
      const bat = lerp([b[0], b[1]], t, 0.55 + (i % 2) * 0.12); // one horizontal batten per plate (no nail dots: a row of dots reads as eyes)
      const grain = X.art(X.LW(line([lerp([b[0], b[1]], t, 0.15), lerp([b[0], b[1]], t, 0.85)]), 0.9, K.ink500) + X.LW(line([[bat[0] - hw * 0.9, bat[1] + 1], [bat[0] + hw * 0.9, bat[1] - 1]]), 1.4, K.ink));
      s += `<g${tf}>` + X.S(d, K.ch3.deep, 2, `<path d="${poly([[b[0] + hw * 0.1, b[1] + 4], [t[0] + hw * 0.1, t[1]], [t[0] + hw + 2, t[1]], [b[0] + hw + 2, b[1] + 4]])}" fill="${K.ink500}" opacity="0.55"/>` + grain) + `</g>`;
      if (ph >= 2 && i === 3) { const q = X.v(2, 3); s += `<path d="${poly([[b[0] - hw - q, b[1] - 4 - q], [b[0] - hw + q, b[1] - 4 - q], [b[0] - hw + q, b[1] - 4 + q], [b[0] - hw - q, b[1] - 4 + q]])}" fill="${K.ink300}" stroke="${K.ink}" stroke-width="1.4"/>`; }
    });
    // band: iron hoop at lat 50° (thickness 46°–54°)
    const up = T.bandPts(54), lo = T.bandPts(46).reverse();
    const bd = 'M ' + up.map(pt).join(' L ') + ' L ' + lo.map(pt).join(' L ') + ' Z';
    s += X.S(bd, K.ink, 2, X.art(X.LW(line(T.bandPts(53)), 1, K.ink300)));
    if (ph >= 2) s += pcrack(X, T.bandPts(50, -70, 40).filter((_, k) => k % 2 === 0).map((q, k) => [q[0], q[1] + (k % 2 ? 1.6 : -1.6)]));
    return s;
  };
})(window.PN);
// ---------- 무채 조수왕 — part 2/2: umbrella-trident · drapes · composition · FX · phases · death · anchors ----------
(function (PN) {
  'use strict';
  const C = PN.bossesC, K = C.K, T = C._tide;
  const { ell, drip, flame, exclaim, dry, f, pt, RAD, poly, line, lerp, polar, smooth, jag, bandD, leanK, leanT, leanP, leanInv, G, hand, xMark, puddle, scrap, squashT, rotP } = C._;

  // ---- umbrella-trident: ribs hinge at the hub. 'dome' = open canopy (ribs swept back, phi from the canopy axis),
  //      'fan' = half-folded forward funnel, 'spear' = folded shut; the middle three ribs run 18 past the rim as barbs ----
  T.umb = function (U) {
    const H = U.hub, L = 85, B = 18, k = 0.26, A = Object.assign({ L, B }, U);
    if (U.mode === 'dome') {
      const phi = U.phi * RAD, r = L * Math.sin(phi), cen = [H[0], H[1] - L * Math.cos(phi)];
      const rim = (t) => [cen[0] + r * Math.cos(t * RAD), cen[1] + r * Math.sin(t * RAD) * k];
      A.cen = cen; A.r = r; A.tips = [10, 50, 90, 130, 170].map(rim); A.rl = rim(180); A.rr = rim(0);
      A.barbs = [1, 2, 3].map((i) => { const tp = A.tips[i], u = [tp[0] - H[0], tp[1] - H[1]], l = Math.hypot(u[0], u[1]); return [tp[0] + (u[0] / l) * B, tp[1] + (u[1] / l) * B]; });
    } else {
      const m5 = [-1, -0.5, 0, 0.5, 1];
      A.tips = m5.map((m, i) => polar(H, L * (i === 0 || i === 4 ? 0.94 : 1), U.alpha + U.sigma * m));
      A.barbs = [1, 2, 3].map((i) => polar(H, L + B, U.alpha + U.sigma * m5[i]));
    }
    if (U.bent) A.tips[3] = [A.tips[3][0] - 6, A.tips[3][1] + 10]; // P2: one rib snapped and drooping
    A.prong = [(A.barbs[0][0] + A.barbs[1][0] + A.barbs[2][0]) / 3, (A.barbs[0][1] + A.barbs[1][1] + A.barbs[2][1]) / 3];
    A.butt = U.butt || polar(U.hand, 46, angDeg(H, U.hand));
    return A;
  };
  const angDeg = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / RAD;
  T.drawUmb = function (X, o, A) {
    const g = X.game, H = A.hub;
    let s = '';
    const sd = line([A.butt, H]);
    s += X.LW(sd, X.v(7, 10), K.ink) + X.LW(sd, X.v(2.6, 4), K.ink500);
    let d, ribs = A.tips;
    if (A.mode === 'dome') {
      const pts = [A.rr, ...A.tips, A.rl];
      d = `M ${pt(A.rl)} Q ${pt([A.rl[0] + 16, H[1] + 14])} ${pt(H)} Q ${pt([A.rr[0] - 16, H[1] + 14])} ${pt(A.rr)}`;
      for (let i = 1; i < pts.length; i++) d += ` Q ${pt(lerp(lerp(pts[i - 1], pts[i], 0.5), H, 0.1))} ${pt(pts[i])}`;
    } else {
      d = `M ${pt(H)} L ${pt(A.tips[0])}`;
      for (let i = 1; i < 5; i++) d += ` Q ${pt(lerp(lerp(A.tips[i - 1], A.tips[i], 0.5), H, 0.16))} ${pt(A.tips[i])}`;
    }
    d += ' Z';
    // membrane: ink700, ch3.deep fin rays between the ribs, 20% dots on the right half (art)
    let inner = '';
    const rimPts = A.mode === 'dome' ? [A.rr, ...A.tips, A.rl] : A.tips;
    for (let i = 1; i < rimPts.length; i++) inner += X.LW(line([H, lerp(rimPts[i - 1], rimPts[i], 0.5)]), X.v(1.3, 2.8), K.ch3.deep);
    if (!g && A.mode === 'dome') inner += `<rect x="${f(H[0])}" y="${f(H[1] - 4)}" width="${f(A.r + 6)}" height="${f(A.cen[1] - H[1] + 30)}" fill="${X.pat('d20')}"/>`;
    s += X.S(d, K.ink700, 2.2, inner);
    // ribs (slightly bowed) and the three barbed spearheads
    ribs.forEach((tp, i) => {
      const m = lerp(H, tp, 0.5), bow = A.mode === 'dome' ? [(tp[0] - H[0]) * 0.08, -6] : [0, 0];
      const kink = A.bent && i === 3 ? lerp(H, tp, 0.6) : null;
      s += kink ? X.LW(line([H, [kink[0] + 4, kink[1] - 6], tp]), X.v(1.8, 3.6), K.ink) : X.LW(`M ${pt(H)} Q ${pt([m[0] + bow[0], m[1] + bow[1]])} ${pt(tp)}`, X.v(1.8, 3.6), K.ink);
    });
    A.barbs.forEach((bp, j) => {
      const tp = A.tips[j + 1], u = [bp[0] - tp[0], bp[1] - tp[1]], l = Math.hypot(u[0], u[1]) || 1, ux = u[0] / l, uy = u[1] / l, nx = -uy, ny = ux;
      const w = X.v(3.4, 4.6), base = [bp[0] - ux * 11, bp[1] - uy * 11];
      s += X.LW(line([tp, base]), X.v(2.4, 4), K.ink);
      s += `<path d="${poly([bp, [base[0] + nx * w, base[1] + ny * w], [base[0] - nx * w, base[1] - ny * w]])}" fill="${K.ink}" ${X.O(0.7)}/>`;
      s += X.LW(line([[bp[0] - ux * 6 + nx * w, bp[1] - uy * 6 + ny * w], [bp[0] - ux * 13 + nx * (w + 3), bp[1] - uy * 13 + ny * (w + 3)]]), X.v(1.6, 3), K.ink);
    });
    if (A.mode === 'dome') s += `<path d="${poly([[H[0] - 3.4, H[1] + 2], [H[0], H[1] - 13], [H[0] + 3.4, H[1] + 2]])}" fill="${K.ink}" ${X.O(0.8)}/>`;
    return s;
  };
  // wide drooping sleeve (far sleeve x 70–130 in idle); cuff bleeds into water (ragged edge + drips)
  function drape(X, sh, w, droop, fill, seed, cuffDrip = true, wk = 1) {
    const u = [w[0] - sh[0], w[1] - sh[1]], l = Math.hypot(u[0], u[1]) || 1, ux = u[0] / l, uy = u[1] / l;
    let nx = -uy, ny = ux; if (ny < 0) { nx = -nx; ny = -ny; }
    const t0 = [sh[0] - nx * 11 * wk, sh[1] - ny * 11 * wk], t1 = [w[0] - nx * 13 * wk, w[1] - ny * 13 * wk];
    const b1 = [w[0] + nx * 13 * wk, w[1] + ny * 13 * wk + droop], b0 = [sh[0] + nx * 11 * wk, sh[1] + ny * 11 * wk + 4];
    const mid = lerp(t0, t1, 0.5), midB = lerp(b0, b1, 0.55);
    const cuff = [t1, lerp(t1, b1, 0.25), lerp(t1, b1, 0.5), lerp(t1, b1, 0.75), b1].map((p, i) => [p[0] + ux * (i % 2 ? 6 : 1), p[1] + uy * (i % 2 ? 6 : 1)]);
    const d = `M ${pt(t0)} Q ${pt([mid[0] - nx * 4, mid[1] - ny * 4])} ${pt(t1)} L ${cuff.map(pt).join(' L ')} Q ${pt([midB[0] + nx * 6, midB[1] + ny * 6 + droop * 0.25])} ${pt(b0)} Z`;
    const lit = `<path d="M ${pt(t0)} Q ${pt([mid[0] - nx * 4, mid[1] - ny * 4])} ${pt(t1)} L ${pt([t1[0] + nx * 6, t1[1] + ny * 6])} Q ${pt([mid[0] + nx * 2, mid[1] + ny * 2])} ${pt([t0[0] + nx * 5, t0[1] + ny * 5])} Z" fill="${K.ink500}"/>`;
    return X.SS(d, fill, 2.4, lit + X.art(dry(X, [t0[0] + nx * 2, t0[1] + ny * 2, mid[0], mid[1], t1[0] + nx * 2, t1[1] + ny * 2], 3, 3, K.ink300, seed))) +
      (cuffDrip ? drip(X, b1[0] + ux * 2, b1[1] - 2, 12, 4.6) : '');
  }
  // water drop (falling) — ink with a paper core line
  const dropFx = (X, x, y, s) => `<path d="M ${f(x)},${f(y - s * 1.6)} C ${f(x + s)},${f(y - s * 0.3)} ${f(x + s)},${f(y + s)} ${f(x)},${f(y + s)} C ${f(x - s)},${f(y + s)} ${f(x - s)},${f(y - s * 0.3)} ${f(x)},${f(y - s * 1.6)} Z" fill="${K.ink}"/>` +
    X.TW([x - s * 0.4, y - s * 0.2, x - s * 0.45, y + s * 0.3, x - s * 0.1, y + s * 0.6], s * 0.35, 'mid', K.paper50);

  // ---- pose rig (screen): umbrella + arms + wave ----
  T.rig = function (S) {
    const pose = S.pose, mv = S.move, R = { pose, mv, lean: 0, dx: 0, wave: 0, hd: T.HEAD_BASE };
    let U;
    if (pose === 'windup' && mv === 'base') {
      U = { mode: 'fan', hand: [262, 200], hub: [310, 256], alpha: 58, sigma: 26 };
      R.far = { sh: [150, 172], w: [96, 156], droop: 30, hand: [86, 146], g: 'open', a: -130 };
    } else if (pose === 'attack' && mv === 'base') {
      U = { mode: 'fan', hand: [272, 196], hub: [290, 252], alpha: 80, sigma: 24 };
      R.far = { sh: [150, 172], w: [100, 270], droop: 34 };
    } else if (mv === 'p2' && pose !== 'idle') {
      const at = pose === 'attack';
      U = { mode: 'spear', hand: at ? [278, 240] : [262, 244], hub: at ? [315, 239] : [305, 241], alpha: at ? -1 : -0.5, sigma: 3.5, butt: at ? [178, 244] : [168, 248] };
      // windup: both hands on the levelled spear; attack: the near hand drives it home, the far sleeve is flung back
      R.far = at ? { sh: [150, 172], w: [104, 192], droop: 30, hand: [92, 180], g: 'open', a: -150 } : { sh: [150, 172], w: [164, 238], droop: 26, hand: [176, 248], g: 'grip', a: 0 };
      if (at) R.lean = 6;
    } else if (mv === 'p3' && pose !== 'idle') {
      const at = pose === 'attack';
      // 검수 F6: in the windup both raised sleeves pass OUTSIDE the head (far hand x ≤ 132, near hand x ≥ 300, near shoulder
      // raised to the flank), the spear moves right so the near fist sits on its shaft, and the '!' clears the barbs by ≥ 8
      U = at ? { mode: 'spear', hand: [296, 212], hub: [324, 265], alpha: 62, sigma: 3.5, butt: [256, 138] } : { mode: 'spear', hand: [306, 42], hub: [314, 40], alpha: -1.5, sigma: 3.5, butt: [104, 47] };
      R.far = at ? { sh: [150, 172], w: [244, 156], droop: 18, hand: [262, 160], g: 'grip', a: 62 } : { sh: [124, 184], w: [116, 68], droop: 20, hand: [118, 46], g: 'grip', a: 0, wk: 0.75 };
      if (!at) { R.nsh = [282, 170]; R.nwk = 0.75; }
      R.wave = at ? 2 : 1;
      if (pose === 'windup') R.hd = [372, 100];
    } else {
      U = { mode: 'dome', hand: [280, 214], hub: [318, 16], phi: 124 };
      R.far = { sh: [150, 172], w: [100, 278], droop: 22 };
    }
    U.bent = S.phase >= 2 && U.mode !== 'spear';
    R.U = T.umb(U);
    R.k = leanK(R.lean); R.L = leanP(R.k, R.dx); R.Li = leanInv(R.k, R.dx);
    return R;
  };
  T.HEAD_BASE = [122, 46];

  function body(X, o) {
    const g = X.game;
    let s = X.S(T.BODY, K.ink, 2.6, `<path d="${T.FOLD}" fill="${K.ink500}"/>` +
      X.art(dry(X, [150, 154, 124, 184, 100, 226, 84, 270], 4, 3, K.ink300, 3) + [[110, 330], [150, 340], [210, 344], [262, 336]].map(([x, y], i) => X.TW([x, y - 26, x + 4, y - 10, x - 2 + i, y + 14], 2.2, 'mid', K.ink500)).join('')));
    // crossed collar (two ink500 bands, overlapping at the chest centre ≈ (218,196), yaw-shifted)
    s += X.SS(bandD([[262, 164], [240, 186], [212, 214]], 7.5, 10), K.ink500, 1.8, '') + X.SS(bandD([[158, 160], [192, 182], [232, 212]], 7.5, 10), K.ink500, 1.8, '');
    // reed belt (ch3.deep) at y 236, a downward-bowed arc
    const belt = bandD([[96, 226], [150, 240], [206, 246], [262, 240], [306, 230]], 6.5, 18);
    // woven reed belt: upright binding ticks (never slanted — slanted parallel strokes are the enemy-telegraph hatching)
    s += X.S(belt, K.ch3.deep, 2, X.art([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => { const x = 104 + i * 19.5, y = 228 + Math.sin(((x - 96) / 210) * Math.PI) * 18; return X.LW(`M ${f(x)},${f(y - 4)} L ${f(x)},${f(y + 5)}`, 1.4, K.ink500); }).join('')));
    if (o.ph >= 3) {
      // P3: the belly opens like a pair of sluice doors (ink500 lit leaf / ink900 leaf) on a whirlpool core.
      // K5def (K1 review 1 R3): the doors stand closer — the opening between the leaves runs x 184…238 (was ≈ 178…248), so
      // the light core plate no longer out-sizes the face. Core, whirlpool (r ≤ 25.9), art arcs and the two bubbles are
      // pulled in to fit; the leaves keep their outer edges.
      s += `<path d="${smooth([[190, 256], [212, 253], [236, 258], [242, 296], [232, 330], [206, 336], [186, 326], [180, 292]], true)}" fill="${K.core['tide-king']}" ${X.O(1.6)}/>`;
      let sp = 'M 210,296', a = 0;
      for (let i = 1; i <= 26; i++) { a += 0.42; const r = 3 + i * 0.88; sp += ` L ${f(210 + Math.cos(a) * r)},${f(296 + Math.sin(a) * r * 0.78)}`; }
      s += X.LW(sp, X.v(3.4, 5), K.ink) + X.art(X.LW('M 192,312 C 202,320 220,322 232,310', 1, K.ink300) + X.LW('M 190,279 C 198,269 220,267 232,278', 1, K.ink300));
      s += `<circle cx="222" cy="274" r="${X.v(2.6, 3)}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="1.4"/><circle cx="229" cy="264" r="${X.v(1.8, 2.4)}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="1.2"/>`;
      s += X.P('M 186,254 L 162,244 L 152,330 L 184,334 Z', K.ink500, 1.8) + X.P('M 237,256 L 262,248 L 268,326 L 239,336 Z', K.ink, 1.8);
    }
    return s;
  }
  function figure(X, S, R, o) {
    const A = R.U, F = R.far;
    let core = body(X, o);
    core += drape(X, F.sh, R.Li(F.w), F.droop, K.ink700, 4, true, F.wk || 1);
    core += T.whiskerF(X) + T.head(X, o);
    const crown = T.crown(X, o), wN = T.whiskerN(X, o, R.wave === 2 ? 4 : 0);
    const s = core + crown + wN;
    // near arm: sleeve drape from the shoulder to the grip on the shaft (p3 windup raises the shoulder to the flank)
    const nsh = R.nsh || [258, 170], ng = R.Li(A.hand), nw = lerp(nsh, ng, 0.78);
    const umb = T.drawUmb(X, o, A);
    const near = drape(X, nsh, nw, 16, K.ink, 6, false, R.nwk || 1) + hand(X, 'grip', ng, angDeg(A.butt, A.hub) + 90, K.ink, X.game ? 1.15 : 1);
    const farHand = F.hand ? hand(X, F.g, R.Li(F.hand), F.g === 'grip' ? angDeg(A.butt, A.hub) + 90 : F.a, K.ink, X.game ? 1.15 : 1) : '';
    return { body: s, core, crown, wN, umb, near, farHand };
  }
  function drips(X, S, R, o) {
    const A = R.U;
    let s = '';
    if (A.mode === 'dome') A.tips.forEach((tp) => { s += drip(X, tp[0], tp[1] + 2, 8, 3.8); });
    s += drip(X, 140, 358, 10, 4.4);
    if (o.ph >= 3) {
      s += drip(X, 124, 250, 16, 4.6) + drip(X, 236, 172, 14, 4.2) + drip(X, 104, 300, 18, 5);
      // canopy drips: open or half-folded only (검수 R5: on the folded spear they hang off the point and widen the drawing);
      // the spear gets them at its hub instead
      s += A.mode === 'spear' ? drip(X, A.hub[0] - 10, A.hub[1] + 4, 12, 4.2) + drip(X, A.hub[0] - 34, A.hub[1] + 5, 10, 4) : drip(X, A.tips[0][0], A.tips[0][1] + 2, 16, 4.4) + drip(X, A.tips[4][0], A.tips[4][1] + 2, 14, 4.4);
    }
    return s;
  }
  // pose FX: count / lane / line cues (ink + paper; ground marks go to `under`)
  function fx(X, S, R) {
    const A = R.U, g = X.game;
    let front = '', under = '';
    if (R.pose === 'windup' && R.mv === 'base') {
      // 5 drops = 5 pools. 검수 F7: a staggered column on the open ground right of the funnel, ≥ 6 clear of every ink, countable at 1x
      [[392, 298], [406, 310], [398, 324], [412, 336], [402, 350]].forEach(([x, y]) => { front += dropFx(X, x, y, X.v(4, 5.5)); });
    } else if (R.pose === 'attack' && R.mv === 'base') {
      [[400, 344, 330, 356], [404, 352, 336, 362], [394, 336, 326, 348]].forEach(([x0, y0, x1, y1], i) => { under += X.TW([x0, y0, (x0 + x1) / 2, (y0 + y1) / 2 + 3, x1, y1], X.v(3, 4.4), 'end', K.ink) + X.art(dry(X, [x0 - 6, y0 - 3, (x0 + x1) / 2, (y0 + y1) / 2, x1 + 10, y1 - 2], 2, 2, K.ink300, 5 + i)); });
      [[338, 340], [356, 348], [374, 338], [392, 348], [410, 340]].forEach(([x, y]) => { under += `<ellipse cx="${x}" cy="${y}" rx="${X.v(6, 7)}" ry="${X.v(2.4, 3)}" fill="none" stroke="${K.ink}" stroke-width="${f(X.v(1.8, 3))}"/>`; });
    } else if (R.mv === 'p2' && R.pose === 'windup') {
      // the hem bleed splits: two ink chevrons flowing left on the left, two flowing right on the right (opposed-chevron-lanes)
      [[78, 352, -1], [50, 356, -1], [306, 352, 1], [334, 356, 1]].forEach(([x, y, dirn]) => { under += `<path d="${poly([[x, y - 7], [x + dirn * 18, y], [x, y + 7], [x + dirn * 6, y]])}" fill="${K.ink}" ${X.O(0.6)}/>`; });
    } else if (R.mv === 'p2' && R.pose === 'attack') {
      [226, 238, 250].forEach((y, i) => { const x1 = 392 - i * 10; front += X.TW([x1, y, x1 - 46, y + (i - 1) * 1.5, x1 - 92 + i * 8, y + (i - 1) * 3], X.v(4, 5.6), 'start', K.ink) + X.TW([x1 - 4, y, x1 - 40, y, x1 - 70, y], X.v(1.2, 1.8), 'start', K.paper50); });
    } else if (R.mv === 'p3' && R.pose === 'attack') {
      [0, 1, 2].forEach((i) => { const y = 352 + i * 8, x0 = 236 + i * 10; under += X.LW(`M ${x0},${y} Q ${x0 + 24},${y - 7} ${x0 + 48},${y} T ${x0 + 96},${y} T ${x0 + 144},${y}`, X.v(2.2, 3.6), K.ink); });
    }
    return { front, under };
  }
  // flood crest: the robe's bleed rises behind (windup, up to y 70 at the upper left) / collapses forward over the shoulder (attack)
  // K5def (K1 review 1 R2): three foam claws on the crest lip — the triple crest line (flood-crest's triple-wave-keyline)
  // running out into foam talons — so in mono the windup crest no longer reads as a kettle handle and the attack crest no
  // longer as an elephant's trunk. Claw = [crest point b, outward normal n, length L, reach k, art / game width]: it grows
  // from b along n + k·t (t = n turned +90° = the contour's running direction) and its tip hooks DOWN (along ±t, whichever
  // points down: foam falls). Attack: the three claws sit on the lip itself (the curled end that read as the trunk's tip),
  // pointing right, down-right and down. Windup: the lip is behind the raised far sleeve, so the claws sit on the visible
  // upper-left crest. Reach, length and width differ from claw to claw (never a comb); an ink300 core carries the crest-line
  // rhythm into each claw.
  const CLAWS = {
    1: [[45.3, 139.3, -0.973, -0.23, 26, 0.5, 9, 14], [62.6, 97.9, -0.83, -0.558, 32, 0.8, 10, 16], [91.9, 72.4, -0.399, -0.917, 22, 1.1, 8, 12]],
    2: [[356.5, 157.2, 0.921, -0.389, 24, 0.5, 8, 13], [361.9, 191.9, 0.977, 0.214, 30, 0.8, 9, 15], [353.2, 205.8, 0.544, 0.839, 20, 0.5, 7, 12]]
  };
  const claws = (X, kind) => CLAWS[kind].map(([bx, by, nx, ny, L, k, wa, wg]) => {
    const tx = -ny, ty = nx, dl = Math.hypot(nx + k * tx, ny + k * ty), ux = (nx + k * tx) / dl, uy = (ny + k * ty) / dl, hs = ty >= 0 ? 1 : -1;
    const P = (a, b, c) => [bx + ux * L * a + hs * tx * L * b + nx * L * c, by + uy * L * a + hs * ty * L * b + ny * L * c];
    const cl = [bx - nx * 4, by - ny * 4, ...P(0.55, 0, 0), ...P(0.95, 0.3, 0), ...P(0.7, 0.62, -0.2)];
    const core = [bx + nx, by + ny, ...P(0.5, 0, 0), ...P(0.8, 0.22, 0), ...P(0.6, 0.45, -0.12)];
    return X.TW(cl, X.v(wa, wg), 'start', K.ink) + X.TW(core, X.v(1.6, 3), 'start', K.ink300);
  }).join('');
  function wave(X, kind) {
    const g = X.game;
    if (kind === 1) {
      const d = 'M 96,350 C 70,320 48,270 42,214 C 36,160 46,112 74,84 C 96,64 128,62 142,78 C 152,90 144,104 128,104 C 116,104 110,94 116,88 C 104,86 92,96 90,116 C 86,150 98,200 118,246 C 128,272 134,300 130,330 Z';
      return X.S(d, K.ink, 2.6, `<path d="M 74,84 C 96,64 128,62 142,78 L 130,82 C 118,74 100,76 86,92 C 70,112 62,150 64,196 L 52,200 C 46,150 52,108 74,84 Z" fill="${K.ink500}"/>` +
        ['M 58,220 C 54,170 62,128 88,100', 'M 72,252 C 64,206 68,160 92,124', 'M 88,286 C 78,242 80,196 98,156'].map((p) => X.LW(p, X.v(1.6, 3.6), K.ink300)).join('')) + claws(X, 1);
    }
    const d = 'M 104,300 C 96,240 104,170 136,124 C 170,82 236,70 286,92 C 326,110 356,140 362,176 C 366,200 352,214 336,206 C 322,198 324,178 338,176 C 330,160 312,148 290,148 C 268,150 252,166 246,184 L 230,170 C 210,150 176,152 154,176 C 134,200 126,250 130,300 Z';
    return X.S(d, K.ink, 2.6, `<path d="M 136,124 C 170,82 236,70 286,92 L 280,102 C 236,84 180,96 150,132 Z" fill="${K.ink500}"/>` +
      ['M 150,118 C 190,92 250,90 300,112', 'M 160,136 C 196,112 252,110 306,130', 'M 172,154 C 204,132 256,130 312,150'].map((p) => X.LW(p, X.v(1.6, 3.6), K.ink300)).join('')) + claws(X, 2);
  }

  C.parts['tide-king'] = function (X, S) {
    if (S.pose === 'death') return death(X, S);
    const R = T.rig(S), o = { hot: S.enraged, ph: S.phase, dead: false }, lt = leanT(R.k, R.dx), Fg = figure(X, S, R, o), FX = fx(X, S, R);
    let back = '', fig = '';
    if (R.wave) back += G(lt, wave(X, R.wave)); // crest rises behind (1) / arches over the shoulder from behind (2)
    if (S.enraged) {
      let fl = '', fu = '';
      [0, 2, 4].forEach((i) => { const p = T.plate(i); fl += flame(X, p.t[0], p.t[1] + 8, 30, 13, (i - 2) * 0.15, 40 + i); });
      // umbrella (screen space): two rib-tip flames; on the folded spear they sit on the hub instead (검수 R5: tips are the spear point)
      if (R.U.mode === 'spear') [[-12, 2], [-36, 3]].forEach(([dx, dy], j) => { fu += flame(X, R.U.hub[0] + dx, R.U.hub[1] + dy, 22, 11, j ? -0.2 : 0.2, 50 + j); });
      else [0, 4].forEach((i, j) => { const tp = R.U.tips[i]; fu += flame(X, tp[0], tp[1] + 4, 24, 12, j ? -0.3 : 0.3, 50 + i); });
      back += G(lt, fl) + fu;
    }
    fig += G(lt, Fg.body + drips(X, S, R, o));
    fig += Fg.umb + G(lt, Fg.farHand + Fg.near); // the umbrella is rigged in screen space; hands go through R.Li
    let front = FX.front;
    if (S.windup) front += exclaim(X, R.hd[0], R.hd[1], 1.1);
    // enrage fill-silhouette: the narrow gap between the umbrella shaft and the robe's right flank;
    // 검수 F2: the closed pockets under the flood crest (windup p3) and under the arching wave (attack p3)
    // (idle) + the closed pocket above it: crown's right plate · canopy rim · shaft · head (검수 F2 rule: closed holes)
    let solid = R.U.mode === 'dome' ? poly([[262, 160], [300, 160], [304, 236], [280, 236]]) + ' ' + poly([[240, 64], [262, 62], [300, 74], [305, 92], [291, 160], [262, 160], [264, 120], [258, 108], [246, 100]]) : '';
    if (R.wave === 1) solid += ' ' + poly([[90, 104], [140, 96], [140, 180], [112, 222], [96, 180]].map(R.L));
    // windup p3: the closed pockets under the raised spear (far sleeve · spear · crown and its flames · near sleeve · head)
    if (R.wave === 1) solid += ' ' + poly([[128, 50], [290, 44], [284, 120], [262, 132], [248, 102], [162, 102], [140, 140], [132, 100]].map(R.L));
    if (R.wave === 2) solid += ' ' + poly([[262, 166], [292, 150], [338, 178], [338, 206], [310, 214], [282, 190]].map(R.L));
    // attack p3: the long wedge where the driven spear leaves the robe's right flank (< 26 wide from y ≈ 276 to 322)
    if (R.wave === 2) solid += ' ' + poly([[316, 268], [326, 268], [344, 322], [312, 326]].map(R.L));
    return { back, fig, front, under: FX.under, solid };
  };

  // ---------------- death: f0 bubble eyes burst · f1 sinks into its own pool · f2 melts into water · f3 wide pool ----------------
  function death(X, S) {
    const fr = S.frame, o = { hot: false, ph: 3, dead: true };
    let back = '', fig = '', over = '', under = '';
    if (fr <= 1) {
      const R = T.rig({ pose: 'idle', move: 'base', phase: 3 });
      if (fr === 0) {
        // umbrella slips 20° about the grip; three small ink300 rings float up from the burst eyes
        R.U = T.umb({ mode: 'dome', hand: [280, 214], hub: rotP([318, 16], [280, 214], 8), phi: 124 });
        const Fg = figure(X, S, R, o);
        fig += Fg.body + Fg.umb + Fg.near;
        [[184, 104, 3.2], [192, 92, 2.4], [256, 100, 2.6]].forEach(([x, y, r]) => { over += `<circle cx="${x}" cy="${y}" r="${f(r * X.v(1, 1.4))}" fill="none" stroke="${K.ink300}" stroke-width="${f(X.v(1.2, 2.4))}"/>`; });
        return { back, fig, over };
      }
      // f1: sinks to 70% into a pool; crown tips; umbrella flipped onto the floor at the right
      const Fg = figure(X, S, R, o);
      const P = puddle(X, 196, 344, 128, 24, 3);
      under += P.s;
      fig += `<g transform="${squashT(1.08, 0.7, 196)}">${Fg.core}${Fg.wN}</g>`;
      fig += `<g transform="${squashT(1.08, 0.7, 196)} rotate(-14 206 90)">${Fg.crown}</g>`;
      // flipped umbrella: the open canopy lies upside-down on the floor at the right (a bowl), its shaft sticks up
      fig += X.LW(line([[334, 330], [372, 268]]), X.v(7, 10), K.ink) + X.LW(line([[334, 330], [372, 268]]), X.v(2.6, 4), K.ink500);
      fig += `<g transform="translate(332,334) scale(0.78,-0.6) translate(-318,-60)">${T.drawUmb(X, o, Object.assign(T.umb({ mode: 'dome', hand: [318, 120], hub: [318, 16], phi: 124 }), { butt: [318, 40] }))}</g>`;
      return { back, fig, over, under };
    }
    if (fr === 2) {
      // melts into spreading water (40%): a low wide mound, whiskers floating on the surface
      const P = puddle(X, 196, 346, 134, 26, 5);
      under += P.s;
      const MOUND = 'M 92,352 C 98,324 118,300 142,286 C 164,272 186,266 206,266 C 232,266 258,276 276,292 C 292,306 302,330 304,354 C 250,362 140,362 92,352 Z';
      fig += X.S(MOUND, K.ink, 2.6, `<path d="M 142,286 C 118,300 98,324 94,350 L 116,348 C 122,326 136,306 156,292 Z" fill="${K.ink500}"/>` + X.art(dry(X, [146, 288, 124, 304, 108, 326, 98, 346], 4, 3, K.ink300, 7)));
      // the head slumps forward as a low dome with dead bubble eyes
      fig += X.S(ell(214, 296, 52, 26), K.ink700, 2.4, `<path d="M 162,296 C 166,280 186,270 210,270 L 204,280 C 186,282 172,288 166,298 Z" fill="${K.ink500}"/>`);
      fig += `<circle cx="198" cy="290" r="${X.v(6, 7)}" fill="${K.ink}" stroke="${K.ink300}" stroke-width="${f(X.v(1.2, 2.4))}"/><ellipse cx="240" cy="288" rx="${X.v(2.6, 3.2)}" ry="${X.v(6, 7)}" fill="${K.ink}" stroke="${K.ink300}" stroke-width="${f(X.v(1, 2))}"/>`;
      // whiskers afloat
      over += X.TW([150, 312, 120, 330, 92, 326, 70, 340], X.v(5, 8), 'start', K.ink) + X.TW([262, 306, 290, 322, 318, 316, 340, 332], X.v(4.4, 7), 'start', K.ink);
      over += X.art(scrap(X, 110, 352, 8, -16, 10) + scrap(X, 290, 350, 8, 22, 11) + scrap(X, 232, 274, 6, 8, 12)); // the manuscript paper shows through
      fig += drip(X, 132, 350, 12, 5) + drip(X, 196, 360, 14, 5) + drip(X, 266, 352, 12, 5);
      return { back, fig, over, under };
    }
    // f3: wide water pool (rx 140, ry 34, ripple rim), three sluice plates afloat, folded umbrella across, paper ✕✕ on the middle plate
    const P = puddle(X, 192, 342, 140, 29, 9);
    fig += P.s;
    [0, 1, 2].forEach((i) => { fig += X.LW(`M ${f(70 + i * 6)},${f(346 - 18 + i * 4)} Q 192,${f(318 - i * 6)} ${f(314 - i * 6)},${f(346 - 18 + i * 4)}`, X.v(1, 2.4), K.ink300); });
    const sp = T.umb({ mode: 'spear', hand: [96, 340], hub: [214, 334], alpha: -3, sigma: 3.5, butt: [70, 342] });
    fig += T.drawUmb(X, o, sp);
    [[132, 350, -8], [196, 356, 4], [262, 348, 10]].forEach(([x, y, a], i) => {
      fig += `<g transform="rotate(${a} ${x} ${y})">${X.P(poly([[x - 22, y - 5], [x + 22, y - 7], [x + 24, y + 5], [x - 20, y + 7]]), K.ch3.deep, 2)}${X.art(X.LW(`M ${x - 16},${y} L ${x + 18},${y - 1}`, 0.9, K.ink500))}</g>`;
      if (i === 1) fig += `<g transform="translate(${x - 8},${y}) scale(1,0.6)">${xMark(X, 0, 0, X.v(3.6, 4.4))}</g><g transform="translate(${x + 8},${y - 1}) scale(1,0.6)">${xMark(X, 0, 0, X.v(3.6, 4.4))}</g>`;
    });
    return { back, fig, over, under };
  }

  // anchors from the same rig: canopy hub/tips, prongs, eyes, face (midpoint between the eyes)
  C.anchorsOf['tide-king'] = (S) => {
    const eyes = T.EYES.map(([l, b]) => T.P(l, b));
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 2];
    if (S.pose === 'death') {
      const fr = S.frame;
      if (fr === 0) { const U = T.umb({ mode: 'dome', hand: [280, 214], hub: rotP([318, 16], [280, 214], 8), phi: 124 }); return { face: mid(eyes[0], eyes[1]), eyes, head: T.HEAD_BASE.slice(), canopy: { hub: U.hub, tips: U.tips }, prongs: U.prong, muzzle: U.hub }; }
      const sq = (p) => [196 + (p[0] - 196) * 1.08, 360 - (360 - p[1]) * 0.7];
      if (fr === 1) {
        const e = eyes.map(sq), flip = C._.xf(['translate', 332, 334], ['scale', 0.78, -0.6], ['translate', -318, -60]), U = T.umb({ mode: 'dome', hand: [318, 120], hub: [318, 16], phi: 124 });
        return { face: mid(e[0], e[1]), eyes: e, head: [150, 150], canopy: { hub: flip(U.hub), tips: U.tips.map(flip) }, prongs: flip(U.prong), muzzle: flip(U.hub) };
      }
      if (fr === 2) return { face: [219, 288], eyes: [[198, 290], [240, 288]], head: [190, 240], canopy: { hub: [214, 296], tips: [] }, prongs: [214, 296], muzzle: [214, 296] };
      return { face: [196, 356], eyes: [[188, 356], [204, 355]], head: [192, 296], canopy: { hub: [214, 334], tips: [] }, prongs: [317, 329], muzzle: [214, 334] };
    }
    const R = T.rig(S), A = R.U, L = R.L;
    const e = eyes.map(L);
    return { face: mid(e[0], e[1]), eyes: e, head: R.hd.slice(), canopy: { hub: A.hub.slice(), tips: A.tips.map((p) => p.slice()) }, prongs: A.prong, muzzle: R.mv === 'base' ? A.hub.slice() : A.prong };
  };
})(window.PN);
// ---------- 시계 폭군 (tyrant · 4장 St5 · clock) — part 1/2: back tower · dial head · pendulum greatsword ----------
// 넓고 무거운 장롱형 + 왼쪽 어깨 뒤 시계탑(사각 몸 + 피라미드 지붕 + 첨탑) + 오른쪽 수직 칼날과 끝의 원판 추.
// 얼굴 = 크라운 베젤을 두른 문자판 머리(평면 하나, yaw 30°, roll −4°), 눈 = 태엽 구멍 둘, 콧수염 = 시침·분침(축 아래로 처짐).
// 12발의 그림 출처는 등의 탑 문자판(ch4.deep, 종이 아님)이다. 얼굴 문자판에는 발사 단서가 없다.
(function (PN) {
  'use strict';
  const C = PN.bossesC, K = C.K;
  const { circ, ell, drip, pcrack, flame, dry, plane, planeEdge, planeP, f, pt, RAD, poly, line, lerp, polar, rotP, jag, gearPath, star } = C._;
  const Y = (C._tyrant = {});
  Y.YAW = 30; Y.ROLL = -4; Y.FACE = [214, 104]; Y.DR = 27; Y.CASE = 32;
  Y.EYES = [-135, -45].map((a) => polar([0, 0], 0.46 * 27, a)); // winding holes, dial-local
  Y.PIV = [0, 3];                                               // hand arbor, below the eyes
  Y.facePt = planeP(Y.FACE, Y.YAW, Y.ROLL);
  Y.TBASE = [113, 200]; Y.TDIAL = [124, 84]; Y.TDR = 18;
  Y.towerLean = (ph) => (ph >= 3 ? -9 : -5);
  Y.towerHand = (ph) => (ph >= 3 ? -60 : ph === 2 ? -90 : -120); // 11 → 12 → 1 o'clock: one notch per phase

  // ---- clock tower (unrotated; the caller turns it about the base) ----
  // o: { ph, hand (deg), bell (deg), cracks12, burst, roofOff, stoneNotch, hot }
  Y.tower = function (X, o) {
    const g = X.game;
    let s = '';
    // P3: stones have fallen from the upper-left corner — the outline itself steps in
    const notch = o.ph >= 3 || o.stoneNotch;
    const LEFT = notch ? 'M 80,92 L 86,92 L 86,80 L 92,80 L 92,66 L 98,64 L 98,200 L 80,204 Z' : 'M 80,60 L 98,54 L 98,200 L 80,204 Z';
    const FRONT = notch ? 'M 98,64 L 104,64 L 104,54 L 146,54 L 146,200 L 98,200 Z' : 'M 98,54 L 146,54 L 146,200 L 98,200 Z';
    s += X.S(LEFT, K.ink500, 2.4, X.art(dry(X, [82, notch ? 98 : 66, 84, 130, 82, 190], 3, 3, K.ink300, 4)));
    s += X.S(FRONT, K.ink, 2.4, `<path d="M 98,54 L 108,54 L 108,200 L 98,200 Z" fill="${K.ink700}"/>`);
    // cornice + pyramid roof + spire (visual only)
    if (!o.roofOff) {
      s += X.S(notch ? 'M 98,50 L 112,14 L 104,51 Z' : 'M 76,50 L 112,14 L 98,52 Z', K.ink500, 2.2, '') + X.S('M 98,52 L 112,14 L 150,48 Z', K.ink, 2.2, X.art(X.LW('M 104,46 L 113,22 M 120,44 L 115,24', 0.9, K.ink500)));
      if (o.ph >= 2) s += `<path d="M 126,30 L 134,37 L 130,41 L 122,35 Z" fill="${K.ink500}" stroke="${K.ink}" stroke-width="${f(X.v(1.4, 2.6))}" stroke-linejoin="round"/>`; // one slate gone from the right slope
      s += X.P('M 110,16 L 112,-8 L 114,16 Z', K.ink, 1);
    }
    s += X.P(notch ? 'M 102,49 L 150,46 L 152,56 L 102,60 Z' : 'M 74,50 L 150,46 L 152,56 L 74,62 Z', K.ink, 2);
    // bell window (arched opening) with a small bell that can swing
    s += `<path d="M 112,132 L 112,116 C 112,104 136,104 136,116 L 136,132 Z" fill="${K.ink}" stroke="${K.ink500}" stroke-width="${f(X.v(1.6, 3))}"/>`;
    s += `<g transform="rotate(${f(o.bell || 0)} 124 110)"><path d="M 118,126 C 118,116 130,116 130,126 L 132,128 L 116,128 Z" fill="${K.ch4.deep}" ${X.O(1)}/><path d="M 124,110 L 124,117" stroke="${K.ink500}" stroke-width="2"/></g>`;
    // tower dial: ch4.deep face (NOT paper), on the same yaw plane as the boss
    const tf = plane(Y.TDIAL, Y.YAW, 0), r = Y.TDR;
    let k = `<path d="${circ(0, 0, r)}" fill="${o.burst ? K.ink : K.ch4.deep}"/>`;
    if (!o.burst) {
      const n = g ? 4 : 12;
      for (let i = 0; i < n; i++) { const a = (i * 360) / n - 90, big = g || i % 3 === 0; k += X.LW(line([polar([0, 0], r - (big ? 6 : 4), a), polar([0, 0], r - 1.5, a)]), big ? X.v(1.6, 3.6) : 1, K.ink); }
      if (o.cracks12) for (let i = 0; i < 12; i++) { const a = i * 30 + 15; k += X.LW(line([polar([0, 0], 4, a), polar([0, 0], r - 1, a + 4)]), X.v(1, 2.4), K.ink); }
      k += X.LW(line([polar([0, 0], r * 0.18, o.hand + 180), polar([0, 0], r * 0.82, o.hand)]), X.v(2.4, 4.4), K.ink); // one minute hand, no centre boss
    }
    k += `<path d="${circ(0, 0, r)}" fill="none" stroke="${K.ink}" stroke-width="${f(X.v(3.5, 5.4))}"/>`;
    // 검수 R1 (p2 windup/attack): a long second hand on the dial plane, pointing back to 9 o'clock past the tower's left face,
    // tail 12 the other way; ink with a paper50 core, thin tip and heavy root. With the sword held level in front it makes the
    // pair of opposed, parallel hands. Length 84 on the plane (≈ 73 on screen), not 66: the tower stands at −5° and its
    // outline is 6 wide, so 66 left only ≈ 7 outside the silhouette; 84 leaves ≈ 23 (≈ 12px at 1x).
    if (o.secondHand && !o.burst) {
      // needle profile instead of a linear taper: sharp over the last 12, then ≥ 4.4 wide (game) so the part outside the
      // tower still reads at 1x; the paper50 core shows the hand where it crosses the ink tower front
      const h1 = X.v(1.3, 2.2), h2 = X.v(1.8, 3), h3 = X.v(1.3, 2.2);
      k += `<path d="${poly([[-84, 0], [-72, -h1], [0, -h2], [12, -h3], [12, h3], [0, h2], [-72, h1]])}" fill="${K.ink}"/>` + X.LW(line([[-74, 0], [6, 0]]), X.v(1, 1.6), K.paper50);
    }
    s += `<g transform="${tf}">${k}</g>`;
    // two iron straps from the tower over the shoulder toward the chest
    s += X.LW('M 128,150 C 150,150 168,170 178,196', X.v(5, 7.4), K.ink) + X.LW('M 128,150 C 150,150 168,170 178,196', X.v(1.6, 2.8), K.ink500) +
      X.LW('M 140,158 C 162,160 180,186 190,222', X.v(5, 7.4), K.ink) + X.LW('M 140,158 C 162,160 180,186 190,222', X.v(1.6, 2.8), K.ink500);
    if (o.towerCrack) s += pcrack(X, [[100, 150], [108, 162], [102, 172], [112, 184]]);
    return s;
  };
  Y.towerDialAt = (lean) => rotP(Y.TDIAL, Y.TBASE, lean);

  // ---- dial head on ONE plane: case (thickness on the left only), paper dial, ticks, winding-hole eyes, moustache hands ----
  // o: { hands: [hourDeg, minDeg] | 'line' | 'drop', hot, dead, glassCrack, cracks12, hand }
  Y.face = function (X, o) {
    const g = X.game, tf = plane(Y.FACE, Y.YAW, Y.ROLL), R = Y.DR, rw = X.v(5, 8);
    let s = '';
    // thickness band (case depth 16 → 8 on screen), left edge only
    s += `<g transform="translate(${f(-planeEdge(16, Y.YAW))},0) ${tf}"><path d="${circ(0, 0, Y.CASE)}" fill="${K.ink500}" stroke="${K.ink}" stroke-width="${f(X.v(2.4, 4))}"/></g>`;
    let k = `<path d="${circ(0, 0, Y.CASE)}" fill="${K.ink}" ${X.O(1.8)}/>`;
    k += `<path d="${circ(0, 0, R)}" fill="${K.paper}"/>`;
    s += `<g transform="${tf}">${k}</g>`;
    // shadow crescent cast by the crown bezel: local 200°→340°, thicker to the right (6), ends above y −16
    const ri = R - rw / 2, Pout = [], Pin = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16, a = (205 + 128 * t) * RAD, th = t < 0.85 ? 1 + 5 * Math.pow(t / 0.85, 1.2) : 6 * (1 - t) / 0.15; Pout.push([ri * Math.cos(a), ri * Math.sin(a)]); Pin.push([(ri - th) * Math.cos(a), (ri - th) * Math.sin(a)]); }
    const cres = 'M ' + Pout.map(pt).join(' L ') + ' L ' + Pin.reverse().map(pt).join(' L ') + ' Z';
    if (!o.dead) s += g ? `<g transform="${tf}"><path d="${cres}" fill="${K.paper300}"/></g>` : X.ht(cres, 'd40', tf, [Y.FACE[0] - 30, Y.FACE[1] - 34, 60, 40]);
    let d = '';
    // ticks (no numerals): art 12, game 4 big
    const n = g ? 4 : 12;
    for (let i = 0; i < n; i++) { const a = (i * 360) / n - 90, big = g || i % 3 === 0; d += X.LW(line([polar([0, 0], ri - (big ? 4.6 : 3), a), polar([0, 0], ri - 0.6, a)]), big ? X.v(2.4, 3.6) : 1.2, K.ink); }
    // P3 windup: 12 radial cracks in the 0.55–0.95 r ring, kept off the eyes and the hands
    if (o.cracks12) for (let i = 0; i < 12; i++) {
      const a = i * 30 + 15, nearEye = [225, 315].some((e) => Math.abs(((a - e + 540) % 360) - 180) < 22), nearHand = [30, 150].some((h) => Math.abs(((a - h + 540) % 360) - 180) < 16);
      d += X.LW(line([polar([0, 0], R * (nearEye ? 0.8 : nearHand ? 0.86 : 0.55), a), polar([0, 0], R * 0.93, a + 3)]), X.v(1, 2.4), K.ink);
    }
    // P2: one thin glass crack from the upper-right rim toward the centre, stopping before the eyes (검수 F8: tapers rim → tip)
    if (o.glassCrack) d += C._.crackT(X, [polar([0, 0], R - 1, -32), [17.6, -8.6], [15, -3.4]], X.v(1.6, 3.6), K.ink);
    // winding-hole eyes (same size: one plane). art: ink ring + ink500 square arbor + paper50 glint; game: ink socket + glint ≥ 6u
    Y.EYES.forEach(([x, y]) => {
      if (o.dead) { d += `<circle cx="${f(x)}" cy="${f(y)}" r="${X.v(4.4, 6)}" fill="${K.ink}"/>`; return; }
      if (g) d += `<circle cx="${f(x)}" cy="${f(y)}" r="6.4" fill="${K.ink}"/>`;
      else d += `<circle cx="${f(x)}" cy="${f(y)}" r="4.4" fill="none" stroke="${K.ink}" stroke-width="2"/><path d="M ${f(x - 1.8)},${f(y - 1.8)} L ${f(x + 1.8)},${f(y - 1.8)} L ${f(x + 1.8)},${f(y + 1.8)} L ${f(x - 1.8)},${f(y + 1.8)} Z" fill="${K.ink500}"/>`;
      const gl = X.v(1.2, 3), gx = x + X.v(1.1, 0.6), gy = y - X.v(1.1, 0.6);
      d += o.hot ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(X.v(4.4, 6.4) * 1.05)}" fill="${K.paper50}" opacity="0.35"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(gl * 1.7)}" fill="${K.paper50}"/>` : `<circle cx="${f(gx)}" cy="${f(gy)}" r="${f(gl)}" fill="${K.paper50}"/>`;
    });
    // moustache = hour + minute hands hanging BELOW the arbor, tips curled up into spades
    const hw = X.v(3, 5), [px, py] = Y.PIV;
    const hands = o.hands === 'line' ? [[180, 0.6], [0, 0.78]] : o.hands === 'drop' ? [[92, 0.6], [88, 0.78]] : [[150, 0.6], [30, 0.78]];
    hands.forEach(([a, k2]) => {
      const L = R * k2, tip = polar([px, py], L, a), side = Math.cos(a * RAD) >= 0 ? 1 : -1, drop = o.hands === 'drop';
      const curl = drop ? [tip[0] + side * 1.5, tip[1] + 3] : [tip[0] + side * 3, tip[1] - X.v(5, 6)];
      d += X.TW([px, py, (px + tip[0]) / 2, (py + tip[1]) / 2 + (o.hands === 'line' ? 0 : 1.5), tip[0], tip[1]], hw, 'end', K.ink);
      d += `<path d="M ${pt(tip)} Q ${pt([tip[0] + side * 4.4, tip[1] + 1])} ${pt(curl)} Q ${pt([tip[0] + side * 0.6, tip[1] - 1.6])} ${pt([tip[0] - side * 1.2, tip[1] + 1.6])} Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="${f(X.v(1.2, 2))}" stroke-linejoin="round"/>`;
    });
    d += `<path d="M ${f(px - 2.6)},${f(py - 2.6)} L ${f(px + 2.6)},${f(py - 2.6)} L ${f(px + 2.6)},${f(py + 2.6)} L ${f(px - 2.6)},${f(py + 2.6)} Z" fill="${K.ink}"/>`;
    // accent (art): one curved glass reflection stroke
    d += X.art(X.TW([-19, -2, -18, -10, -13, -16], 1.3, 'mid', K.paper50));
    s += `<g transform="${tf}"><g clip-path="url(#${X.clip(circ(0, 0, ri))})">${d}</g><path d="${circ(0, 0, R)}" fill="none" stroke="${K.ink}" stroke-width="${f(rw)}"/></g>`;
    // crown bezel: 5 ink tines with ch4.deep knobs over the case (y 64–78)
    const cb = planeP(Y.FACE, Y.YAW, Y.ROLL);
    [-18, -9, 0, 9, 18].forEach((x, i) => {
      const b = cb([x, -Y.CASE + 3]), tH = [10, 13, 15, 13, 10][i], tp = [b[0] + x * 0.06, b[1] - tH];
      s += `<path d="${poly([[b[0] - 3.4, b[1] + 2], [tp[0], tp[1] + 3], [b[0] + 3.4, b[1] + 2]])}" fill="${K.ink}" ${X.O(1)}/><path d="${circ(tp[0], tp[1] + 1, X.v(2.6, 3.2))}" fill="${K.ch4.deep}" ${X.O(0.9)}/>`;
    });
    s += X.P(poly([cb([-22, -Y.CASE + 1]), cb([22, -Y.CASE + 1]), cb([20, -Y.CASE + 6]), cb([-20, -Y.CASE + 6])]), K.ink, 1.6);
    return s;
  };

  // ---- pendulum greatsword: grip + ring pommel, escapement-anchor guard, pendulum-rod blade, sharpened disc bob ----
  // W: { g: guard centre, a: blade angle from straight down (+ toward the front/right) }
  Y.sword = function (X, o, W) {
    const a = W.a * RAD, d = [Math.sin(a), Math.cos(a)], n = [d[1], -d[0]], G = W.g, Lb = 150;
    const P = (t, k) => [G[0] + d[0] * t + n[0] * k, G[1] + d[1] * t + n[1] * k];
    const bob = P(Lb, 0);
    let s = '';
    // grip + ring pommel (behind the guard)
    s += X.P(poly([P(-4, -4), P(-30, -3.4), P(-30, 3.4), P(-4, 4)]), K.ink700, 1.6) + X.art([-10, -17, -24].map((t) => X.LW(line([P(t, -3.6), P(t - 2, 3.6)]), 1, K.ink500)).join(''));
    // ring pommel drawn as an oval loop along the grip (a round ring next to the dial face would read as another eye)
    const pm = P(-38, 0), lp = `transform="rotate(${f(-W.a)} ${f(pm[0])} ${f(pm[1])})"`;
    s += `<ellipse cx="${f(pm[0])}" cy="${f(pm[1])}" rx="3.6" ry="7.6" fill="none" stroke="${K.ink}" stroke-width="${f(X.v(4.4, 6.4))}" ${lp}/><ellipse cx="${f(pm[0])}" cy="${f(pm[1])}" rx="3.6" ry="7.6" fill="none" stroke="${K.ch4.deep}" stroke-width="${f(X.v(1.6, 2.4))}" ${lp}/>`;
    // blade = pendulum rod (10 → 7 wide), ink500 core
    s += X.P(poly([P(4, -5), P(Lb - 20, -3.5), P(Lb - 20, 3.5), P(4, 5)]), K.ink, 1.8) + X.LW(line([P(8, 0), P(Lb - 24, 0)]), X.v(2.2, 3.4), K.ink500);
    // escapement-anchor guard: arms bend toward the blade, two pallet hooks
    const ga = `M ${pt(P(-2, -20))} Q ${pt(P(-8, 0))} ${pt(P(-2, 20))} L ${pt(P(10, 22))} L ${pt(P(6, 15))} Q ${pt(P(2, 0))} ${pt(P(6, -15))} L ${pt(P(10, -22))} Z`;
    s += X.P(ga, K.ink, 1.8) + X.LW(`M ${pt(P(-1, -15))} Q ${pt(P(-4, 0))} ${pt(P(-1, 15))}`, X.v(1.4, 2.6), K.ch4.deep);
    // disc bob r26: ch4.deep, ink rim 4, ink300 sharpened edge on the lower-right only; the clamp sits where the rod
    // enters the rim, so nothing marks the disc centre (a disc + centre dot reads as a second eye)
    s += `<path d="${circ(bob[0], bob[1], 26)}" fill="${K.ch4.deep}" ${X.O(2)}/>`;
    s += X.LW(`M ${pt(polar(bob, 21.5, -10))} A 21.5 21.5 0 0 1 ${pt(polar(bob, 21.5, 120))}`, X.v(1.6, 3), K.ink300);
    s += X.art(X.LW(`M ${pt(polar(bob, 12, 200))} A 12 12 0 0 1 ${pt(polar(bob, 12, 250))}`, 1, K.ink500));
    s += X.P(poly([P(Lb - 30, -6), P(Lb - 20, -6.5), P(Lb - 20, 6.5), P(Lb - 30, 6)]), K.ink500, 1);
    if (o.ph >= 3 && !o.noDrip) s += drip(X, bob[0] + 6, bob[1] + 24, 14, 4.6);
    return { s, bob, grip: [P(-14, 0), P(-26, 0)], d, n };
  };
})(window.PN);
// ---------- 시계 폭군 — part 2/2: rig · body · composition · FX · phases · death · anchors ----------
(function (PN) {
  'use strict';
  const C = PN.bossesC, K = C.K, Y = C._tyrant;
  const { circ, ell, drip, pcrack, flame, exclaim, dry, f, pt, RAD, poly, line, lerp, polar, rotP, jag, gearPath, bandD, leanK, leanT, leanP, leanInv, G, sleeve, hand, xMark, puddle, scrap, squashT, angOf } = C._;
  Y.COAT = 'M 120,146 C 106,150 102,164 104,184 C 104,214 102,246 100,272 L 104,292 L 122,282 L 140,296 L 160,284 L 180,296 L 200,284 L 220,296 L 240,284 L 260,296 L 280,284 L 292,294 L 296,272 C 294,246 292,214 292,184 C 294,164 288,150 274,146 C 240,138 156,138 120,146 Z';
  Y.COATLIT = 'M 108,166 C 104,196 102,232 101,268 L 116,262 C 118,230 120,198 128,170 Z';
  Y.CLOAK = 'M 110,150 C 90,172 80,220 74,270 C 70,300 72,320 76,334 L 90,322 L 98,338 L 110,320 L 122,330 L 128,292 L 104,292 Z';
  Y.FUR = 'M 106,156 L 116,138 L 128,148 L 138,132 L 150,144 L 162,130 L 176,142 L 190,130 L 204,142 L 218,130 L 232,142 L 246,132 L 258,144 L 270,134 L 280,148 L 292,140 L 294,158 L 284,166 L 272,158 L 260,168 L 246,160 L 232,170 L 218,162 L 204,170 L 190,162 L 176,170 L 162,162 L 148,170 L 136,160 L 122,168 L 110,162 Z';
  Y.FURLIT = 'M 106,156 L 116,138 L 128,148 L 138,132 L 150,144 L 162,130 L 176,142 L 190,130 L 196,140 L 190,162 L 176,170 L 162,162 L 148,170 L 136,160 L 122,168 L 110,162 Z';
  Y.SHN = [270, 160]; Y.SHF = [128, 162];
  Y.BOSS = [215, 210];

  // ---- pose rig (screen space) ----
  Y.rig = function (S) {
    const pose = S.pose, mv = S.move;
    const R = { pose, mv, lean: 0, dx: 0, hd: [276, 40], tHand: Y.towerHand(S.phase), tLean: Y.towerLean(S.phase), faceHands: 'droop', bell: 0, behind: false };
    // windup: planted upright in front of the body, both fists on the pommel, elbows out (the blade leaves the right flank)
    if (pose === 'windup' && mv === 'base') { R.W = { g: [236, 184], a: 0 }; R.elN = [300, 180]; R.elF = [172, 192]; R.bell = 20; }
    // attack: lifted and smashed down on a diagonal; the bob lands at ≈ (262,340)
    else if (pose === 'attack' && mv === 'base') { R.lean = 6; R.W = { g: [222, 182], a: 28 }; R.elN = [266, 214]; R.elF = [170, 210]; R.bell = -14; }
    else if (pose === 'windup' && mv === 'p2') { R.W = { g: [242, 156], a: 90 }; R.elN = [280, 196]; R.elF = [180, 200]; R.tHand = 180; R.faceHands = 'line'; }
    else if (pose === 'attack' && mv === 'p2') { R.lean = -5; R.W = { g: [142, 196], a: -90 }; R.elN = [214, 218]; R.elF = [128, 214]; R.tHand = 180; R.faceHands = 'line'; }
    else if (pose === 'windup' && mv === 'p3') { R.W = { g: [234, 80], a: -149 }; R.elN = [290, 120]; R.elF = [182, 116]; R.behind = true; R.hd = [300, 44]; R.cracks = true; }
    // attack p3: the overhead blow follows through far forward and low, so its silhouette differs from the base smash
    else if (pose === 'attack' && mv === 'p3') { R.lean = 8; R.W = { g: [250, 226], a: 50 }; R.elN = [286, 222]; R.elF = [190, 232]; R.burst = true; }
    else { R.W = { g: [284, 174], a: 4.6 }; R.elN = [306, 208]; R.elF = [104, 214]; R.fist = [128, 250]; }
    R.k = leanK(R.lean); R.L = leanP(R.k, R.dx); R.Li = leanInv(R.k, R.dx);
    const a = R.W.a * RAD, d = [Math.sin(a), Math.cos(a)];
    R.bob = [R.W.g[0] + d[0] * 150, R.W.g[1] + d[1] * 150];
    R.grip = [[R.W.g[0] - d[0] * 14, R.W.g[1] - d[1] * 14], [R.W.g[0] - d[0] * 26, R.W.g[1] - d[1] * 26]];
    R.tDial = R.L(Y.towerDialAt(R.tLean));
    return R;
  };

  function body(X, o) {
    let s = '';
    // short thick legs (ink700, lit stripe) + boots on y 360
    s += X.S('M 132,284 L 170,284 L 172,340 L 130,340 Z', K.ink700, 2.2, '') + X.S('M 212,284 L 254,284 L 256,340 L 210,340 Z', K.ink700, 2.2, `<path d="M 210,282 L 220,282 L 221,342 L 210,342 Z" fill="${K.ink500}"/>`);
    s += X.P('M 126,334 L 174,334 C 178,344 178,354 176,360 L 122,360 C 120,350 122,340 126,334 Z', K.ink, 2.4) + X.P('M 208,334 L 256,334 C 262,342 266,352 264,360 L 204,360 C 202,350 204,340 208,334 Z', K.ink, 2.4);
    // coat: wide trapezoid, ONE lit flank wedge upper-left, lower-right stays ink900
    let ci = `<path d="${Y.COATLIT}" fill="${K.ink500}"/>` + X.art(dry(X, [118, 150, 160, 142, 220, 142, 268, 148], 4, 3, K.ink300, 6));
    const band = (y) => bandD([[106, y - 6], [160, y + 2], [215, y + 8], [262, y + 2], [292, y - 8]], 4.6, 16);
    ci += X.P(band(196), K.ch4.deep, 1.6) + X.P(band(226), K.ch4.deep, 1.6);
    if (o.ph >= 2) ci += pcrack(X, [[124, 176], [134, 190], [126, 204], [138, 216], [130, 232]]);
    s += X.S(Y.COAT, K.ink, 2.6, ci);
    // sternum gear boss r14 on the chest centre line (ink square hub — no paper dot); P3: it bursts and the core shows
    const [bx, by] = Y.BOSS;
    if (o.ph >= 3) {
      s += `<path d="${jag([[bx - 24, by - 6], [bx - 12, by - 22], [bx + 8, by - 20], [bx + 24, by - 8], [bx + 22, by + 14], [bx + 4, by + 24], [bx - 16, by + 20]], 2.4, 7, 6)}" fill="${K.ink}" ${X.O(1.2)}/>`;
      s += `<path d="${gearPath(bx, by, 18, 14.5, 15, 6, 0, 0.5)}" fill="${K.core.tyrant}" ${X.O(1.2)}/>` + `<path d="${gearPath(bx, by, 9, 7, 6, 0, 0, 0.5)}" fill="${K.ink}"/>`;
      s += X.LW(`M ${bx - 4},${by + 2} C ${bx - 14},${by + 2} ${bx - 14},${by - 12} ${bx - 2},${by - 12} C ${bx + 6},${by - 12} ${bx + 8},${by - 2} ${bx + 2},${by + 6} L ${bx + 10},${by + 14}`, X.v(1.4, 2.8), K.ink300);
      const tt = polar([bx, by], 18.5, -60);
      s += `<path d="${C._.star(tt[0], tt[1], X.v(4, 5), X.v(1.2, 1.6), 4, -90)}" fill="${K.paper50}" stroke="${K.ink}" stroke-width="${f(X.v(0.8, 1.4))}"/>`;
    } else {
      s += `<path d="${gearPath(bx, by, 14, 11, 10, 9, 0, 0.5)}" fill="${K.ch4.deep}" ${X.O(1.2)}/><path d="M ${bx - 4},${by - 4} L ${bx + 4},${by - 4} L ${bx + 4},${by + 4} L ${bx - 4},${by + 4} Z" fill="${K.ink}"/>`;
    }
    // jagged fur collar (left half lit)
    s += X.S(Y.FUR, K.ink, 2.2, `<path d="${Y.FURLIT}" fill="${K.ink500}"/>`);
    return s;
  }
  function arms(X, R, o) {
    const one = (sh, elS, tgt, kind, a, w, fill) => {
      const hp = R.Li(tgt), el = R.Li(elS), u = [hp[0] - el[0], hp[1] - el[1]], ul = Math.hypot(u[0], u[1]) || 1;
      const wr = [hp[0] - (u[0] / ul) * 9, hp[1] - (u[1] / ul) * 9];
      return sleeve(X, sh, el, wr, w, fill, true, true, K.ink).s + hand(X, kind, hp, a, K.ink, X.game ? 1.2 : 1.08);
    };
    const ga = R.W.a; // fist across the grip
    const far = R.fist ? one(Y.SHF, R.elF, R.fist, 'grip', 80, [11, 10, 11], K.ink700) : one(Y.SHF, R.elF, R.grip[1], 'grip', -ga, [11, 10, 11], K.ink700);
    const near = R.release ? one(Y.SHN, R.elN, R.release, 'open', 70, [12, 11, 12], K.ink) : one(Y.SHN, R.elN, R.grip[0], 'grip', -ga, [12, 11, 12], K.ink);
    return { far, near };
  }

  C.parts.tyrant = function (X, S) {
    if (S.pose === 'death') return death(X, S);
    const R = Y.rig(S), o = { ph: S.phase, hot: S.enraged }, lt = leanT(R.k, R.dx), g = X.game;
    let back = '', fig = '', front = '', under = '';
    // back: cloak (P2 crack on its back), tower turned about its base, enrage flames on roof/spire
    let bk = X.S(Y.CLOAK, K.ink, 2.4, `<path d="M 110,150 C 96,168 86,200 80,236 L 92,232 C 98,204 106,176 118,156 Z" fill="${K.ink500}"/>`);
    if (S.phase >= 2) bk += pcrack(X, [[100, 178], [92, 202], [100, 222], [88, 248], [94, 270]]);
    const tower = Y.tower(X, { ph: S.phase, hand: R.tHand, bell: R.bell, cracks12: R.cracks, burst: R.burst, secondHand: R.mv === 'p2' && R.pose !== 'idle' });
    // clockwork spikes: 12 ink spikes (paper cores) shoot out of the tower dial rim — r20→34 in the windup, →48 in the attack.
    // They are part of the tower (silhouette), so the base windup reads in mono too. Count = 12 bullets.
    let spk = '';
    if (R.mv === 'base' && R.pose !== 'idle') {
      const r1 = R.pose === 'windup' ? 34 : 48, sw = X.v(3, 4) * (R.pose === 'windup' ? 1 : 1.1);
      for (let i = 0; i < 12; i++) { const a = i * 30 - 90, p0 = polar(Y.TDIAL, 20, a), p1 = polar(Y.TDIAL, r1, a), m = lerp(p0, p1, 0.5); spk += X.TW([p0[0], p0[1], m[0], m[1], p1[0], p1[1]], sw, 'start', K.ink) + X.TW([p0[0], p0[1], m[0], m[1], p1[0], p1[1]], sw * 0.36, 'start', K.paper50); }
    }
    let tw = tower + spk;
    if (S.enraged) tw = flame(X, 92, 46, 30, 13, -0.3, 61) + flame(X, 136, 42, 30, 13, 0.25, 62) + flame(X, 112, -2, 32, 13, 0, 63) + tw;
    bk += `<g transform="rotate(${f(R.tLean)} ${Y.TBASE[0]} ${Y.TBASE[1]})">${tw}</g>`;
    if (S.phase >= 3) bk += drip(X, 96, 330, 16, 5) + drip(X, 108, 200, 14, 4.6);
    back += G(lt, bk);
    const SW = Y.sword(X, o, R.W), A = arms(X, R, o);
    if (R.behind) back += SW.s + G(lt, A.far);
    // body + head
    let b = body(X, o) + drip(X, 140, 296, 12, 4.4) + drip(X, 240, 286, 10, 4.2);
    if (S.phase >= 3) b += drip(X, 180, 296, 16, 5);
    if (R.fist) b += A.far;
    const face = Y.face(X, { hands: R.faceHands, hot: S.enraged, glassCrack: S.phase >= 2, cracks12: R.cracks });
    let headFl = '';
    if (S.enraged) headFl = flame(X, 196, 72, 26, 12, -0.2, 64) + flame(X, 230, 70, 26, 12, 0.2, 65);
    fig += G(lt, b + headFl + face);
    if (!R.behind) fig += SW.s + G(lt, A.far);
    fig += G(lt, A.near);
    // pose FX (count 12 from the TOWER dial; never from the face)
    const td = R.tDial;
    const arcs = () => { const bw = R.L(rotP([136, 120], Y.TBASE, R.tLean)); return X.LW(`M ${f(bw[0] + 8)},${f(bw[1] - 12)} A 14 14 0 0 1 ${f(bw[0] + 8)},${f(bw[1] + 12)} M ${f(bw[0] + 16)},${f(bw[1] - 18)} A 22 22 0 0 1 ${f(bw[0] + 16)},${f(bw[1] + 18)}`, X.v(2.4, 3.6), K.ink); };
    if (R.pose === 'windup' && R.mv === 'base') front += arcs();
    if (R.pose === 'attack' && R.mv === 'base') {
      front += arcs();
      const c = [R.bob[0], R.bob[1] + 26];
      under += `<ellipse cx="${c[0]}" cy="${c[1]}" rx="56" ry="16" fill="none" stroke="${K.ink}" stroke-width="${f(X.v(2.4, 3.6))}"/>`;
      for (let i = 0; i < 12; i++) { const a = i * 30 * RAD, p0 = [c[0] + Math.cos(a) * 58, c[1] + Math.sin(a) * 17.5], p1 = [c[0] + Math.cos(a) * 68, c[1] + Math.sin(a) * 21]; under += X.LW(line([p0, p1]), X.v(2.4, 3.6), K.ink); }
    }
    if (R.pose === 'attack' && R.mv === 'p2') {
      // curved ink afterimage arc in front of the body (sweep), three ticks along it (numbered-sweep-sector)
      const arc = [404, 170, 330, 262, 120, 270, 14, 214];
      front += X.TW(arc, X.v(6, 8), 'end', K.ink) + X.TW([400, 172, 330, 258, 124, 266, 22, 214], X.v(1.6, 2.4), 'end', K.paper50);
      [[0.25], [0.5], [0.75]].forEach(([t]) => { const u = 1 - t, x = u * u * u * arc[0] + 3 * u * u * t * arc[2] + 3 * u * t * t * arc[4] + t * t * t * arc[6], y = u * u * u * arc[1] + 3 * u * u * t * arc[3] + 3 * u * t * t * arc[5] + t * t * t * arc[7]; front += X.LW(line([[x, y + 4], [x, y + 16]]), X.v(2.6, 3.8), K.ink); });
    }
    if (R.pose === 'attack' && R.mv === 'p3') {
      // the tower dial bursts into 12 wedge fragments flying out in a ring; a ground crack ring of 12 segments under the impact
      for (let i = 0; i < 12; i++) { const a = i * 30 - 75, r = 44 + (i % 3) * 10, p = polar(td, r, a); front += `<path d="${poly([polar(p, 8, a), polar(p, 6, a + 120), polar(p, 6, a - 120)])}" fill="${K.ch4.deep}" ${X.O(0.9)}/>`; }
      const c = [R.bob[0], R.bob[1] + 24];
      for (let i = 0; i < 12; i++) { const a0 = (i * 30 + 4) * RAD, a1 = (i * 30 + 24) * RAD; under += X.LW(`M ${f(c[0] + Math.cos(a0) * 54)},${f(c[1] + Math.sin(a0) * 16)} L ${f(c[0] + Math.cos(a1) * 56)},${f(c[1] + Math.sin(a1) * 17)}`, X.v(2.4, 3.8), K.ink); }
    }
    if (S.windup) front += exclaim(X, R.hd[0], R.hd[1], 1.1);
    // enrage fill-silhouette: the slit between the hanging blade and the coat's right flank (idle);
    // 검수 F2: the narrow gap between the boots in every pose (the base windup also fills both sides of the planted bob)
    let solid = R.pose === 'idle' ? poly([[286, 170], [296, 170], [296, 300], [286, 300]]) : '';
    solid += ' ' + (R.pose === 'windup' && R.mv === 'base' ? poly([[168, 280], [262, 280], [262, 362], [174, 362]].map(R.L)) : poly([[168, 280], [214, 280], [206, 362], [174, 362]].map(R.L)));
    // attack base: the r48 spikes close the tower–head notch to ≈ 18 (and wedge under the cornice) → fill it from the
    // cornice to the fur collar (tower points turn with the tower, then everything leans with the body)
    if (R.pose === 'attack' && R.mv === 'base') { const tw = (p) => rotP(p, Y.TBASE, R.tLean); solid += ' ' + poly([tw([146, 46]), tw([176, 46]), [196, 76], [184, 104], [190, 146], tw([140, 150])].map(R.L)); }
    // windup p3: the closed window between the raised near forearm, the head and the fur collar (≈ 20 × 15)
    if (R.pose === 'windup' && R.mv === 'p3') solid += ' ' + poly([[244, 116], [272, 116], [272, 142], [244, 142]].map(R.L));
    // 검수 2차 §5: the 9–21 wide slit between the pendulum disc and the right leg + boot, closed by the coat hem above.
    // idle (no lean, every phase) in body space; attack base: the bob lands at (292,314) in screen space. Lowest point ≤ y 354
    if (R.pose === 'idle') solid += ' ' + poly([[252, 290], [292, 290], [286, 340], [280, 354], [268, 354], [256, 346]].map(R.L));
    if (R.pose === 'attack' && R.mv === 'base') solid += ' ' + poly([[256, 294], [286, 298], [284, 338], [266, 354], [258, 344]]);
    return { back, fig, front, under, solid };
  };

  // ---------------- death: f0 glass breaks · f1 knees fold, tower tips 25° · f2 melts 45%, tower falls in blocks · f3 puddle ----------------
  function death(X, S) {
    const fr = S.frame, o = { ph: 3, hot: false, noDrip: fr >= 2 };
    let back = '', fig = '', over = '', under = '';
    if (fr <= 1) {
      const R = Y.rig({ pose: 'idle', move: 'base', phase: 3 });
      R.W = fr === 0 ? { g: [296, 196], a: 16 } : { g: [228, 320], a: 80 };
      if (fr === 0) { R.elN = [304, 214]; R.fist = [128, 252]; R.release = [300, 194]; }
      const tw = Y.tower(X, { ph: 3, hand: -60, towerCrack: true, roofOff: fr === 1 });
      const tl = fr === 0 ? -9 : -25;
      const SW = Y.sword(X, o, R.W);
      const face = Y.face(X, { hands: 'drop', dead: true, glassCrack: true });
      const glass = X.LW('M 196,90 L 210,104 L 204,114 L 222,124', X.v(1.6, 3), K.ink) + X.LW('M 210,104 L 228,96', X.v(1.2, 2.4), K.ink);
      if (fr === 0) {
        const A = arms(X, R, o);
        back += X.S(Y.CLOAK, K.ink, 2.4, '') + `<g transform="rotate(${tl} ${Y.TBASE[0]} ${Y.TBASE[1]})">${tw}</g>`;
        fig += body(X, o) + A.far + face + SW.s + A.near;
        over += glass;
        return { back, fig, over };
      }
      back += `<g transform="${squashT(1.08, 0.72, 196)}">${X.S(Y.CLOAK, K.ink, 2.4, '')}<g transform="rotate(${tl} ${Y.TBASE[0]} ${Y.TBASE[1]})">${tw}</g></g>`;
      // the roof has fallen beside the tower
      back += `<g transform="translate(-34,226) rotate(-62 112 34)">${X.S('M 76,50 L 112,14 L 98,52 Z', K.ink500, 2.2, '') + X.S('M 98,52 L 112,14 L 150,48 Z', K.ink, 2.2, '')}</g>`;
      fig += `<g transform="${squashT(1.08, 0.72, 196)}">${body(X, o)}${face}</g>`;
      fig += SW.s;
      return { back, fig, over };
    }
    if (fr === 2) {
      // melting body (45%), tower collapsed behind into 4 stone blocks, the dial head slid forward
      [[86, 296, 40, 30, -12], [118, 276, 34, 26, 8], [70, 330, 36, 24, 18], [128, 316, 30, 22, -20]].forEach(([x, y, w, h, a], i) => { back += `<g transform="rotate(${a} ${x} ${y})">${X.S(poly([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]]), i % 2 ? K.ink : K.ink500, 2.2, '')}</g>`; });
      const MOUND = 'M 100,360 C 104,330 118,300 140,282 C 160,266 186,260 206,260 C 232,260 256,272 272,290 C 286,306 294,332 296,360 C 250,366 146,366 100,360 Z';
      fig += X.S(MOUND, K.ink, 2.6, `<path d="M 140,282 C 118,300 104,330 102,358 L 124,356 C 128,330 138,308 156,292 Z" fill="${K.ink500}"/>` + X.art(dry(X, [144, 284, 124, 304, 110, 330, 104, 352], 4, 3, K.ink300, 9)));
      fig += drip(X, 140, 352, 14, 5) + drip(X, 204, 362, 16, 5.4) + drip(X, 262, 354, 14, 5);
      const SW = Y.sword(X, o, { g: [182, 322], a: 84 });
      fig += SW.s;
      over += `<g transform="translate(36,214) rotate(26 214 104) scale(0.86)">${Y.face(X, { hands: 'drop', dead: true, glassCrack: true })}</g>`;
      over += X.art(scrap(X, 100, 340, 9, -14, 4) + scrap(X, 298, 346, 8, 20, 5) + scrap(X, 170, 300, 7, 6, 6));
      return { back, fig, over };
    }
    // f3: puddle; the dial lies face-up (rx26 ry10, hands at 6:30, winding holes = paper ✕); bob lies flat; 3 tower stones behind-left (≤ 30 tall)
    const P = puddle(X, 196, 342, 134, 29, 11);
    fig += P.s;
    [[86, 322, 30, 22], [112, 314, 26, 20], [72, 340, 24, 18]].forEach(([x, y, w, h], i) => { fig += X.S(poly([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2 + 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]]), i % 2 ? K.ink : K.ink500, 2.2, ''); });
    fig += `<g transform="translate(296,350) scale(1,0.36)">${X.P(circ(0, 0, 26), K.ch4.deep, 2)}${X.LW(`M ${pt(polar([0, 0], 21.5, -10))} A 21.5 21.5 0 0 1 ${pt(polar([0, 0], 21.5, 120))}`, X.v(1.6, 3), K.ink300)}</g>`;
    fig += `<g transform="translate(196,340) scale(1,0.38)">${X.P(circ(0, 0, 30), K.ink, 2)}<path d="${circ(0, 0, 25)}" fill="${K.paper}" stroke="${K.ink}" stroke-width="${f(X.v(4, 6))}"/>` +
      X.LW('M 0,3 L 0,20 M 0,3 L 1,17', X.v(3, 5), K.ink) + `</g>`;
    Y.EYES.forEach(([x, y]) => { fig += `<g transform="translate(${f(196 + x)},${f(340 + y * 0.38)}) scale(1,0.55)">${xMark(X, 0, 0, X.v(3.6, 4.4))}</g>`; });
    return { back, fig, over };
  }

  C.anchorsOf.tyrant = (S) => {
    if (S.pose === 'death') {
      const fr = S.frame;
      const bobOf = (W) => [W.g[0] + Math.sin(W.a * RAD) * 150, W.g[1] + Math.cos(W.a * RAD) * 150];
      if (fr === 0) { const W = { g: [296, 196], a: 16 }; return { face: Y.FACE.slice(), eyes: Y.EYES.map(Y.facePt), head: [276, 40], towerDial: Y.towerDialAt(-9), bob: bobOf(W), guard: W.g, muzzle: Y.towerDialAt(-9) }; }
      const sq = (p) => [196 + (p[0] - 196) * 1.08, 360 - (360 - p[1]) * 0.72];
      if (fr === 1) { const W = { g: [228, 320], a: 80 }; return { face: sq(Y.FACE), eyes: Y.EYES.map((p) => sq(Y.facePt(p))), head: [200, 120], towerDial: sq(Y.towerDialAt(-25)), bob: bobOf(W), guard: W.g, muzzle: sq(Y.towerDialAt(-25)) }; }
      if (fr === 2) { const m = C._.xf(['translate', 36, 214], ['rotate', 26, 214, 104], ['scale', 0.86]), W = { g: [182, 322], a: 84 }; return { face: m(Y.FACE), eyes: Y.EYES.map((p) => m(Y.facePt(p))), head: [196, 236], towerDial: [118, 276], bob: bobOf(W), guard: W.g, muzzle: [118, 276] }; }
      return { face: [196, 340], eyes: Y.EYES.map(([x, y]) => [196 + x, 340 + y * 0.38]), head: [196, 296], towerDial: [112, 314], bob: [296, 350], guard: [296, 350], muzzle: [112, 314] };
    }
    const R = Y.rig(S);
    return { face: R.L(Y.FACE), eyes: Y.EYES.map((p) => R.L(Y.facePt(p))), head: R.hd.slice(), towerDial: R.tDial, bob: R.bob, guard: R.W.g.slice(), muzzle: R.mv === 'p2' ? R.bob : R.tDial };
  };
})(window.PN);
// ---------- 일식 원장 (director · 5장 St5 · eclipse) — part 1/2: crescent mask · aureole · ruler · baton ----------
// 가는 장신 + 머리 뒤 큰 원판(왼쪽 위 투명 초승 틈 = 다이아몬드 링) · 뒤로 갈라진 연미복 꼬리 둘 · 왼쪽에 지팡이처럼 짚은 긴 자.
// 얼굴 = 초승 가면 하나(평면, yaw 35°, roll −6°): 바깥 원 r28 − 안쪽 원 (−18,−1) r22, 눈 하나 = 5장 일식 고리 눈.
(function (PN) {
  'use strict';
  const C = PN.bossesC, K = C.K;
  const { circ, ell, drip, pcrack, dry, plane, planeEdge, planeP, f, pt, RAD, poly, line, lerp, polar, jag } = C._;
  const D = (C._director = {});
  D.YAW = 35; D.ROLL = -6; D.MASK = [216, 94];
  D.HEAD = [208, 92]; D.HRX = 21; D.HRY = 27;
  D.AUR = [184, 84]; D.AR = 58; D.AR2 = 68;
  D.EYE = [13, -2];
  D.facePt = planeP(D.MASK, D.YAW, D.ROLL);
  // crescent: from the brow horn along the OUTER circle (through the right) to the chin horn, back along the INNER circle
  D.CRES = 'M -16.09,-22.9 A 28 28 0 1 1 -18.53,21.05 A 22 22 0 0 0 -16.09,-22.9 Z';
  D.CRES_TOP = 'M -16.09,-22.9 A 28 28 0 0 1 28,0 L 12,0 A 22 22 0 0 0 -16.09,-22.9 Z';  // death f0: upper shard
  D.CRES_BOT = 'M 28,0 A 28 28 0 0 1 -18.53,21.05 A 22 22 0 0 0 4,0 Z';                     // death f0: lower shard

  // ---- the head disc (ink, upper-left ink500 sliver) + the crescent mask on one plane ----
  // o: { hot, dead, split, ph }
  D.face = function (X, o) {
    const g = X.game, tf = plane(D.MASK, D.YAW, D.ROLL), [hx, hy] = D.HEAD;
    let s = X.SS(ell(hx, hy, D.HRX, D.HRY), K.ink, 2.6, `<path d="M ${hx - 20},${hy - 8} C ${hx - 18},${hy - 20} ${hx - 10},${hy - 27} ${hx - 1},${hy - 27} C ${hx - 9},${hy - 23} ${hx - 14},${hy - 16} ${hx - 16},${hy - 8} Z" fill="${K.ink500}"/>` +
      X.art(X.LW(`M ${hx - 17},${hy + 12} C ${hx - 12},${hy + 22} ${hx - 2},${hy + 27} ${hx + 8},${hy + 26}`, 0.9, K.ink300)));
    const edge = planeEdge(10, D.YAW); // 검수 F9: depth 10 → 5.7 so the concave-edge band reads at art scale
    const shard = (d, dx, dy, rot) => {
      const t2 = `translate(${dx},${dy}) ${tf} rotate(${rot})`;
      return `<g transform="translate(${f(-edge)},0) ${t2}"><path d="${d}" fill="${K.ink500}" stroke="${K.ink}" stroke-width="${f(X.v(1, 3))}" stroke-linejoin="round"/></g>` +
        `<g transform="${t2}"><path d="${d}" fill="${K.paper}" stroke="${K.ink}" stroke-width="${f(X.v(3, 5))}" stroke-linejoin="round"/></g>`;
    };
    if (o.split) return s + shard(D.CRES_TOP, -2, -3, -6) + shard(D.CRES_BOT, 2, 4, 8) + D.eye(X, Object.assign({}, o, { dead: true }), `translate(-2,-3) ${tf} rotate(-6)`);
    // thickness band: the plate edge shows only on the concave (left) side
    s += `<g transform="translate(${f(-edge)},0) ${tf}"><path d="${D.CRES}" fill="${K.ink500}" stroke="${K.ink}" stroke-width="${f(X.v(1, 3))}" stroke-linejoin="round"/></g>`;
    let k = `<path d="${D.CRES}" fill="${K.paper}"/>`;
    const cl = X.clip(D.CRES);
    let inner = '';
    // shadow (art): one band along the outer arc's lower-right edge. 검수 R7: 40% dots, width 8 (a 5-wide 20% band read as a dotted line)
    if (!g) inner += `<path d="M 26.6,8.6 A 28 28 0 0 1 6,27.3 L 4.29,19.53 A 20 20 0 0 0 19.02,6.18 Z" fill="${X.pat('d40')}"/>`;
    // accent (art): small paper50 reflection at the brow horn tip
    if (!g) inner += X.TW([-12, -21.4, -6, -24.4, 2, -25.4], 1.3, 'mid', K.paper50);
    // P2: one thin ink crack on the chin horn, far from the eye (검수 F8: tapers from its root). The root sits on the outer rim
    // of the lower horn; the old path started inside the inner circle (= the hole), so only its thin tip ever showed
    if (o.ph >= 2 || o.dead) inner += C._.crackT(X, [[-10.4, 25.4], [-7, 22.2], [-4, 23.6], [0, 20.4]], X.v(1.6, 3.6), K.ink);
    k += `<g clip-path="url(#${cl})">${inner}</g><path d="${D.CRES}" fill="none" stroke="${K.ink}" stroke-width="${f(X.v(3, 5))}" stroke-linejoin="round"/>`;
    s += `<g transform="${tf}">${k}</g>`;
    return s + D.eye(X, o, tf);
  };
  // 5장 일식 고리 눈: paper50 disc + ink core ×0.74 pushed +x by r×0.2 → a paper crescent rim on the left (no centre core, no glint)
  D.eye = function (X, o, tf) {
    const r = X.v(6, 7), [ex, ey] = D.EYE;
    let s = '';
    if (o.hot && !o.dead) s += `<circle cx="${ex}" cy="${ey}" r="${f(r * 2.1)}" fill="${K.paper50}" opacity="0.35"/>`;
    s += `<circle cx="${ex}" cy="${ey}" r="${f(r)}" fill="${o.dead ? K.ink : K.paper50}" stroke="${o.dead ? K.ink300 : K.ink}" stroke-width="${f(X.v(1.6, 2.6))}"/>`;
    if (!o.dead) s += `<circle cx="${f(ex + r * 0.2)}" cy="${ey}" r="${f(r * 0.74)}" fill="${o.hot ? K.paper50 : K.ink}"/>`;
    return `<g transform="${tf}">${s}</g>`;
  };

  // ---- aureole (black sun): ink disc r58 + corona ring to r68 with a paper300 inner line; gaps are returned as `cut` ----
  // mode: 'gap' (upper-left diamond-ring slit), 'cracks' (P2 white-crack-lanes), 'total' (unbroken thin corona + plus slit), 'broken3' (death f0)
  D.aureole = function (X, o, mode) {
    const g = X.game, [cx, cy] = D.AUR;
    let s = X.S(circ(cx, cy, D.AR2), K.ink, 2.4,
      `<path d="M ${pt(polar(D.AUR, 54, 165))} A 54 54 0 0 1 ${pt(polar(D.AUR, 54, 250))} L ${pt(polar(D.AUR, 44, 240))} A 44 44 0 0 0 ${pt(polar(D.AUR, 46, 172))} Z" fill="${K.ink500}"/>` +
      X.art(dry(X, [cx - 52, cy + 14, cx - 58, cy - 20, cx - 36, cy - 48, cx - 6, cy - 58], 3, 3, K.ink300, 8)));
    // corona inner line (paper300): full ring; 'cracks' keeps only the left half; 'total' = a thin unbroken ring
    const cr = 64;
    if (mode === 'cracks') s += X.LW(`M ${pt(polar(D.AUR, cr, 90))} A ${cr} ${cr} 0 0 1 ${pt(polar(D.AUR, cr, 270))}`, X.v(1.6, 3), K.paper300);
    else s += `<path d="${circ(cx, cy, cr)}" fill="none" stroke="${K.paper300}" stroke-width="${f(mode === 'total' ? X.v(1.2, 2.4) : X.v(1.6, 3))}"/>`;
    if (mode === 'cracks' || mode === 'flash') {
      // three cracks crossing the disc on the diagonal = white-crack-lanes. 검수 R8: uneven spacing, slightly different angles
      // and a jagged course, so they read as cracks and never as hatching (바이블 §6-5)
      const c = X.clip(circ(cx, cy, D.AR - 1));
      let k = '';
      [[-18, 3, 11], [-3, -2, 23], [15, 5, 37]].forEach(([dv, da, seed]) => {
        const rr = PN.rng(seed), a = (-33 + da) * RAD, u = [Math.cos(a), Math.sin(a)], nv = [-u[1], u[0]], c0 = [cx + nv[0] * dv, cy + nv[1] * dv], P = [];
        for (let i = 0; i <= 7; i++) { const t = -70 + i * 20, j = i === 0 || i === 7 ? 0 : (rr() - 0.5) * 8; P.push([c0[0] + u[0] * t + nv[0] * j, c0[1] + u[1] * t + nv[1] * j]); }
        k += X.LW(line(P), X.v(2, 3), mode === 'flash' ? K.paper50 : K.paper300, 'stroke-miterlimit="4"');
      });
      s += `<g clip-path="url(#${c})">${k}</g>`;
    }
    return s;
  };
  // transparent slits of the aureole, in the aureole's own (body) frame — the composer applies the pose lean via cutT
  D.cutGap = (X) => { const a = X.v(58, 55), b = X.v(62, 63), P0 = [], P1 = []; for (let t = 150; t <= 300; t += 6) { P0.push(polar(D.AUR, a, t)); P1.push(polar(D.AUR, b, t)); } return poly(P0.concat(P1.reverse())); };
  // 'total': the + slit sits on the disc centre (검수 F4) — two full arms inside the corona; the head, mask and coat are
  // painted back into the cut mask (D.keep), so the + passes BEHIND them and reads as "+" (never "†")
  D.PLUS = [184, 84];
  D.cutPlus = (X) => { const w = X.v(8, 10) / 2, [px, py] = D.PLUS; return poly([[120, py - w], [248, py - w], [248, py + w], [120, py + w]]) + ' ' + poly([[px - w, 20], [px + w, 20], [px + w, 148], [px - w, 148]]); };
  // cutKeep for the + : head ell + outline + shadow copy, crescent mask, coat (path + white stroke over its outline), all in
  // the leaned body frame lt; the raised baton of attack p3 is in screen space
  D.keep = (X, R, lt) => {
    const k = [{ d: ell(208, 92, 28, 34), tf: lt }, { d: ell(216, 94, 27, 31), tf: lt }, { d: D.TORSO, tf: lt, sw: X.v(7, 16) }];
    if (R.swap) k.push({ d: line([R.bat.h, R.bat.t]), sw: X.v(12, 18) });
    return k;
  };
  // death f0: the corona snaps into three arcs (three radial notches through the ring only)
  D.cutBroken = () => [128, 236, 330].map((a0) => { const P0 = [], P1 = []; for (let t = a0; t <= a0 + 9; t += 3) { P0.push(polar(D.AUR, 59, t)); P1.push(polar(D.AUR, 72, t)); } return poly(P0.concat(P1.reverse())); }).join(' ');
  D.cutBite = () => jag([[238, 116], [250, 110], [262, 118], [264, 132], [254, 142], [242, 138]], 2, 21, 5);

  // ---- ruler (자): length 230, width 16, ink700 lacquer + ch5.deep inlay; staff grooves 7 with the 5th left empty ----
  D.ruler = function (X, o, a, b, broken) {
    const g = X.game, L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = [-u[1], u[0]];
    const P = (t, k) => [a[0] + u[0] * t + n[0] * k, a[1] + u[1] * t + n[1] * k];
    const end = broken ? L - 18 : L;
    const body = broken ? poly([P(0, -8), P(end, -8), P(end, -3), P(end + 7, -3), P(end + 7, 3), P(end + 12, 3), P(end + 12, 8), P(0, 8)]) : poly([P(0, -8), P(L, -8), P(L, 8), P(0, 8)]);
    let inner = X.LW(line([P(2, -5.6), P(L - 2, -5.6)]), X.v(1.2, 2.4), K.ch5.deep);
    // staff grooves: game = 1 ink300 groove + 1 paper300 empty band, 3.6 each (검수 R6: 2-wide lines vanish at 1x);
    // art = 7 grooves, the 5th left empty as a paper300 band
    if (g) inner += X.LW(line([P(4, -1.2), P(L - 4, -1.2)]), 3.6, K.ink300) + X.LW(line([P(4, 3.8), P(L - 4, 3.8)]), 3.6, K.paper300);
    else [-4, -2.6, -1.2, 0.2, 1.6, 3, 4.4].forEach((k, i) => { inner += i === 4 ? X.LW(line([P(3, k), P(L - 3, k)]), 1.3, K.paper300) : X.LW(line([P(3, k), P(L - 3, k)]), 0.7, K.ink300); });
    let s = X.S(body, K.ink700, 2, inner);
    if (broken) s += pcrack(X, [P(end - 26, -6), P(end - 18, 2), P(end - 10, -3), P(end - 2, 5)]);
    return { s, front: broken ? P(end + 12, 0) : b.slice(), back: a.slice() };
  };
  // ---- baton: ink rod, ink500 bead handle, tip ink300 (game) / paper300 (art) — never as bright as the eye ----
  D.baton = function (X, o, hand, tip, brokenAt) {
    const g = X.game, w = X.v(3, 5);
    let s = '';
    if (brokenAt) {
      const m = lerp(hand, tip, brokenAt);
      s += X.LW(line([hand, m]), w + X.v(2.4, 3.6), K.ink) + X.LW(line([hand, m]), w * 0.4, K.ink500);
    } else s += X.LW(line([hand, tip]), w + X.v(2.4, 3.6), K.ink) + `<circle cx="${f(tip[0])}" cy="${f(tip[1])}" r="${f(X.v(2.2, 3.2))}" fill="${g ? K.ink300 : K.paper300}" stroke="${K.ink}" stroke-width="${f(X.v(1.2, 2))}"/>`;
    s += `<path d="${ell(hand[0], hand[1], 5.4, 5.4)}" fill="${K.ink500}" ${X.O(1)}/>`;
    return s;
  };
})(window.PN);
// ---------- 일식 원장 — part 2/2: rig · tailcoat · composition · FX · phases · death · anchors ----------
(function (PN) {
  'use strict';
  const C = PN.bossesC, K = C.K, D = C._director;
  const { circ, ell, drip, pcrack, flame, exclaim, dry, f, pt, RAD, poly, line, lerp, polar, jag, bandD, leanK, leanT, leanP, leanInv, G, sleeve, hand, xMark, puddle, scrap, squashT, angOf } = C._;
  D.TORSO = 'M 172,140 C 186,134 230,134 246,140 C 252,160 247,186 240,206 L 178,206 C 172,186 166,160 172,140 Z';
  D.LAPEL_L = 'M 182,141 L 200,140 L 211,196 L 194,178 Z';
  D.LAPEL_R = 'M 228,140 L 242,143 L 219,196 L 215,184 Z';
  D.SHIRT = 'M 202,140 L 226,140 L 214,190 Z';
  D.TAIL_A = [[178, 202], [156, 232], [128, 266], [96, 300]];
  D.TAIL_B = [[170, 214], [158, 252], [142, 286], [130, 316]];
  D.TAIL_A_UP = [[178, 202], [150, 222], [116, 240], [80, 254]];
  D.TAIL_B_UP = [[170, 214], [146, 240], [116, 262], [88, 276]];
  D.SHF = [178, 146]; D.SHN = [240, 146];

  // ---- pose rig (screen space) ----
  D.rig = function (S) {
    const pose = S.pose, mv = S.move;
    const R = { pose, mv, lean: 0, dx: 0, hd: [80, 44], aur: 'gap', tailsUp: false, swap: false };
    if (pose === 'windup' && mv === 'base') { R.ruler = { a: [140, 156], b: [372, 152] }; R.farH = [162, 156]; R.elF = [150, 186]; R.bat = { h: [264, 98], t: [292, 30] }; R.elN = [278, 128]; }
    else if (pose === 'attack' && mv === 'base') { R.lean = 4; R.ruler = { a: [140, 156], b: [372, 152] }; R.farH = [162, 156]; R.elF = [150, 186]; R.bat = { h: [336, 138], t: [372, 148] }; R.elN = [298, 152]; }
    else if (pose === 'windup' && mv === 'p2') { R.ruler = { a: [130, 250], b: [320, 64] }; R.farH = [150, 230]; R.elF = [146, 196]; R.bat = { h: [278, 156], t: [340, 156] }; R.elN = [262, 186]; R.aur = 'cracks'; }
    // p2 attack: the ruler comes down level at the waist; the baton recoils up and back
    else if (pose === 'attack' && mv === 'p2') { R.ruler = { a: [140, 206], b: [372, 202] }; R.farH = [162, 206]; R.elF = [150, 186]; R.bat = { h: [262, 176], t: [292, 236] }; R.elN = [262, 150]; R.aur = 'flash'; }
    else if (pose === 'windup' && mv === 'p3') { R.ruler = { a: [100, 176], b: [330, 176] }; R.farH = [168, 176]; R.elF = [150, 168]; R.bat = { h: [214, 208], t: [214, 144] }; R.elN = [252, 192]; R.aur = 'total'; }
    else if (pose === 'attack' && mv === 'p3') { R.lean = -3; R.ruler = { a: [200, 140], b: [370, 286] }; R.nearH = [268, 198]; R.elN = [262, 172]; R.bat = { h: [132, 112], t: [98, 56] }; R.elF = [150, 140]; R.swap = true; R.aur = 'total'; R.tailsUp = true; }
    else { R.ruler = { a: [130, 136], b: [122, 358] }; R.farH = [130, 142]; R.elF = [152, 176]; R.bat = { h: [262, 214], t: [300, 252] }; R.elN = [248, 192]; }
    if (!R.swap) R.nearH = R.bat.h; else R.farH = R.bat.h;
    R.k = leanK(R.lean); R.L = leanP(R.k, R.dx); R.Li = leanInv(R.k, R.dx);
    return R;
  };

  function tails(X, o, R) {
    const A = R.tailsUp ? D.TAIL_A_UP : D.TAIL_A, B = (R.tailsUp ? D.TAIL_B_UP : D.TAIL_B).slice();
    if (o.ph >= 3) B[3] = lerp(B[2], B[3], 0.25); // P3: one tail torn short
    const ta = bandD(A, (t) => 9 - 5 * t, 16), tb = bandD(B, (t) => 8 - 5 * t, 14);
    let s = X.SS(ta, K.ink, 2.2, '') + X.SS(tb, K.ink700, 2.2, '');
    if (o.ph >= 3) s += `<path d="${jag([B[3], [B[3][0] - 7, B[3][1] + 4], [B[3][0] + 2, B[3][1] + 8]], 1.6, 3, 3)}" fill="${K.ink700}" ${X.O(1)}/>`;
    if (o.ph >= 2) s += pcrack(X, [[172, 208], [164, 220], [170, 230], [160, 242]]);
    // the slit between the tails (6–10 wide): kept transparent through the cut, and kept out of the coral pulse
    const mid = [0.12, 0.35, 0.6, 0.85, 1].map((t) => { const ia = Math.min(3, t * 3), ib = Math.min(3, t * 3); const pa = lerp(A[Math.floor(ia)], A[Math.min(3, Math.floor(ia) + 1)], ia % 1), pb = lerp(B[Math.floor(ib)], B[Math.min(3, Math.floor(ib) + 1)], ib % 1); return lerp(pa, pb, 0.5); });
    const half = X.v(1.8, 2.6);
    const cut = poly(mid.map((p) => [p[0] - half, p[1] - half]).concat(mid.slice().reverse().map((p) => [p[0] + half, p[1] + half])));
    // 검수 F2 rule: the V between tail B and the far leg stays < 26 wide down to the shoe → filled too (not when the tails fly up)
    const vee = R.tailsUp ? '' : ' ' + poly([B[1], [168, 266], [154, 340], [140, 344], [B[3][0] - 2, B[3][1] + 10], lerp(B[2], B[3], 0.5)]);
    const solid = poly([A[0], A[1], A[2], A[3], B[3], B[2], B[1], B[0]]) + vee;
    return { s, cut: o.ph >= 3 ? '' : cut, solid };
  }
  function body(X, o, R) {
    const g = X.game;
    let s = '';
    // legs (ink700, ink500 side stripe) in a wide stance, pointed shoes on y 360
    s += X.SS(bandD([[190, 204], [176, 280], [158, 348]], (t) => 9.5 - 2.5 * t, 12), K.ink700, 2.2, '') + X.SS(bandD([[226, 204], [238, 280], [252, 348]], (t) => 10 - 2.5 * t, 12), K.ink700, 2.2, X.LW('M 218,206 L 232,282 L 246,346', X.v(1.4, 2.6), K.ink500));
    s += X.P('M 146,344 L 170,344 C 172,352 172,356 170,360 L 136,360 C 134,354 140,348 146,344 Z', K.ink, 2.2) + X.P('M 242,344 L 262,344 C 270,348 278,354 276,360 L 238,360 C 236,354 238,348 242,344 Z', K.ink, 2.2);
    // tailcoat front, cut across at the waist; lapels ink500 satin (the lit planes); narrow shirt V pressed down; ink bow tie
    let ti = `<path d="${D.LAPEL_L}" fill="${K.ink500}"/><path d="${D.LAPEL_R}" fill="${K.ink500}"/>` + `<path d="${D.SHIRT}" fill="${g ? K.ink300 : K.paper300}"/>` + (g ? '' : `<path d="${D.SHIRT}" fill="${X.pat('d40')}"/>`);
    if (o.ph >= 2) ti += pcrack(X, [[176, 150], [184, 164], [178, 176], [188, 190]]);
    if (o.ph >= 3) {
      // P3: the front tears open on the core (검수 F3). The ink bead (210,168) r11 sits at the TOP of a tall tear, a coat flap
      // covers its left third, and six short paper300 rays leave its right side only — so it never reads as a grey iris
      // with a centre pupil, and no ray closes into a ring
      const c = [210, 168];
      ti += `<path d="${jag([[198, 148], [218, 144], [234, 160], [232, 192], [218, 208], [202, 198], [196, 172]], 2.2, 17, 5)}" fill="${K.core.director}" ${X.O(1)}/>`;
      [[-70, 8], [-40, 12], [-12, 7], [16, 13], [46, 9], [78, 6]].forEach(([a, L]) => { ti += X.LW(line([polar(c, 13.5, a), polar(c, 13.5 + L, a)]), X.v(1.8, 3.2), K.paper300); });
      ti += `<path d="${circ(c[0], c[1], 11)}" fill="${K.ink}" ${X.O(0.8)}/>`;
      ti += `<path d="${jag([[190, 150], [207, 153], [204, 188], [189, 184]], 1.6, 5, 4)}" fill="${K.ink}" stroke="${K.ink500}" stroke-width="${f(X.v(1.4, 2.4))}" stroke-linejoin="round"/>`;
    }
    s += X.S(D.TORSO, K.ink, 2.4, ti);
    s += X.P('M 204,138 L 212,143 L 204,148 Z M 224,138 L 216,143 L 224,148 Z', K.ink, 1) + `<path d="${ell(214, 143, 2.6, 2.6)}" fill="${K.ink}"/>`;
    return s;
  }
  function arms(X, R, o) {
    const one = (sh, elS, tgt, a, w, fill) => {
      const hp = R.Li(tgt), el = R.Li(elS), u = [hp[0] - el[0], hp[1] - el[1]], ul = Math.hypot(u[0], u[1]) || 1;
      const wr = [hp[0] - (u[0] / ul) * 7, hp[1] - (u[1] / ul) * 7];
      return sleeve(X, sh, el, wr, w, fill, true, true, K.ink).s + hand(X, 'grip', hp, a, K.ink, X.game ? 0.92 : 0.82);
    };
    const ra = angOf(R.ruler.a, R.ruler.b) + 90, ba = angOf(R.bat.h, R.bat.t) + 90;
    const far = one(D.SHF, R.elF, R.farH, R.swap ? ba : ra, [8.5, 7.5, 8], K.ink700);
    const near = one(D.SHN, R.elN, R.nearH, R.swap ? ra : ba, [9, 8, 8.5], K.ink);
    return { far, near };
  }

  C.parts.director = function (X, S) {
    if (S.pose === 'death') return death(X, S);
    const R = D.rig(S), o = { ph: S.phase, hot: S.enraged, dead: false }, lt = leanT(R.k, R.dx);
    let back = '', fig = '', front = '', under = '';
    let cut = '', solid = '';
    // aureole behind the head (transparent slits go to `cut`)
    let au = D.aureole(X, o, R.aur);
    if (S.enraged) au = [-150, -120, -90, -60, -30].map((a, i) => { const p = polar(D.AUR, 70, a); return flame(X, p[0], p[1] + 5, 30, 13, Math.cos(a * RAD) * 0.4, 70 + i); }).join('') + au;
    back += G(lt, au);
    const TL = tails(X, o, R);
    back += G(lt, TL.s);
    // cut, cutKeep and solid are all in the leaned body frame (cutT / solidT = lt), like the aureole and tails they belong to
    cut += (R.aur === 'total' ? D.cutPlus(X) : D.cutGap(X)) + ' ' + TL.cut + (S.phase >= 3 ? ' ' + D.cutBite() : '');
    const cutKeep = R.aur === 'total' ? D.keep(X, R, lt) : [];
    solid += TL.solid + ' ' + circ(D.AUR[0], D.AUR[1], 66);
    // idle (ruler planted on the left): the closed pocket under the far elbow (ruler · arm · coat · tail A) and the slit
    // between the ruler and the far leg down to the shoe. Ruler points are screen space → R.Li, since solidT applies lt
    if (R.pose === 'idle') solid += ' ' + poly([[140, 176], [160, 178], [170, 196], [150, 232], [136, 226]].map(R.Li)) + ' ' + poly([[140, 280], [168, 262], [160, 344], [134, 350]].map(R.Li));
    // ruler (planted on the left in idle), body, head + mask, baton, arms
    const RU = D.ruler(X, o, R.ruler.a, R.ruler.b, S.phase >= 2);
    const A = arms(X, R, o);
    fig += RU.s;
    // the two tail-hung drips follow the tail tip (attack p3 raises the tails; they used to float in the air there)
    const tA = (R.tailsUp ? D.TAIL_A_UP : D.TAIL_A)[3], tdx = tA[0] - 96, tdy = tA[1] - 300;
    fig += G(lt, body(X, o, R) + D.face(X, o) + drip(X, 158, 350, 10, 4.2) + drip(X, 120 + tdx, 296 + tdy, 10, 4.2) + (S.phase >= 3 ? drip(X, 100 + tdx, 300 + tdy, 16, 4.6) + drip(X, 206, 204, 14, 4.6) + drip(X, 250, 350, 14, 4.6) + drip(X, 236, 150, 12, 4.4) : ''));
    fig += D.baton(X, o, R.bat.h, R.bat.t) + G(lt, A.far + A.near);
    if (S.enraged) front += flame(X, R.bat.t[0], R.bat.t[1] - 2, 22, 11, 0.1, 76);
    // pose FX: the 7-line staff with the 5th line missing (count cue), lanes, the + rays
    const b = RU.front, w = X.v(3, 3.6);
    const staff = (x0, len, taper) => { let s2 = ''; for (let i = 0; i < 7; i++) { if (i === 4) continue; const y = b[1] + (i - 3) * 9; s2 += taper ? X.TW([x0, y, x0 + len / 2, y, x0 + len, y], w * 1.4, 'start', K.ink) : X.LW(line([[x0, y], [x0 + len, y]]), w, K.ink); } return s2; };
    if (R.pose === 'windup' && R.mv === 'base') front += staff(b[0] + 6, 30, false);
    if (R.pose === 'attack' && R.mv === 'base') front += staff(b[0] + 4, 424 - b[0] - 6, true);
    if (R.pose === 'attack' && R.mv === 'p2') [[-12, 46], [0, 26], [12, 46]].forEach(([dy, L], i) => { const y = b[1] + dy; front += X.TW([b[0] + 6 + i * 4, y, b[0] + 6 + L / 2, y, b[0] + 6 + L, y], w * 1.4, 'start', K.ink); });
    if (R.pose === 'attack' && R.mv === 'p3') {
      // the + rays leave the corona where the arms end (검수 F4: centre (184,84), leaned with the body). The lower arm ends
      // behind the coat, so its ray would cross the body: only the top, left and right rays are drawn
      const [px, py] = D.PLUS, R2 = D.AR2;
      const exits = [[[px, py - R2], -90], [[px - R2, py], 180], [[px + R2, py], 0]];
      exits.forEach(([q, a]) => { const e = R.L(q), p0 = polar(e, 4, a), p1 = polar(e, 34, a); front += X.TW([p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, p1[0], p1[1]], X.v(4.4, 6), 'start', K.ink) + X.TW([p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, p1[0], p1[1]], X.v(1.4, 2), 'start', K.paper50); });
    }
    if (S.windup) front += exclaim(X, R.hd[0], R.hd[1], 1.1);
    return { back, fig, front, under, cut, cutT: lt, cutKeep, solid, solidT: lt };
  };

  // ---------------- death: f0 mask splits, corona snaps in 3 · f1 curtain-call bow 70% · f2 the black sun melts · f3 puddle ----------------
  function death(X, S) {
    const fr = S.frame, o = { ph: 3, hot: false, dead: true };
    let back = '', fig = '', over = '', cut = '';
    const R = D.rig({ pose: 'idle', move: 'base', phase: 3 });
    if (fr === 0) {
      back += D.aureole(X, o, 'gap') + tails(X, o, R).s;
      cut += D.cutGap(X) + ' ' + D.cutBroken() + ' ' + D.cutBite();
      const RU = D.ruler(X, o, R.ruler.a, R.ruler.b, true), A = arms(X, R, o);
      fig += RU.s + body(X, o, R) + D.face(X, Object.assign({ split: true }, o)) + D.baton(X, o, R.bat.h, R.bat.t, 0.5) + A.far + A.near;
      over += X.LW(line([[288, 262], [312, 248]]), X.v(5.4, 8.6), K.ink) + `<circle cx="312" cy="248" r="${X.v(2.2, 3.2)}" fill="${X.game ? K.ink300 : K.paper300}" stroke="${K.ink}" stroke-width="${f(X.v(1.2, 2))}"/>`;
      return { back, fig, over, cut };
    }
    if (fr === 1) {
      // bows forward like a curtain call and folds to 70%; the aureole sinks back behind
      back += `<g transform="translate(184,206) scale(0.84,0.62) translate(-184,-84)">${D.aureole(X, o, 'gap')}</g>`;
      const bow = `${squashT(1.06, 0.7, 200)} matrix(1,0,${f(-0.26)},1,${f(360 * 0.26)},0)`;
      fig += `<g transform="${bow}">${tails(X, o, R).s}${body(X, o, R)}${D.face(X, Object.assign({ split: true }, o))}</g>`;
      fig += D.ruler(X, o, [108, 330], [330, 356], true).s;
      fig += D.baton(X, o, [262, 346], [300, 356], 0.5);
      return { back, fig, over };
    }
    if (fr === 2) {
      // the black sun melts down over the folded body; tails pool on the floor
      const MOUND = 'M 104,360 C 106,330 120,302 142,286 C 160,272 182,266 204,266 C 230,266 254,278 270,296 C 284,312 292,334 294,360 C 250,366 146,366 104,360 Z';
      fig += X.P('M 80,350 C 96,338 126,336 150,344 L 146,356 C 124,352 100,354 82,360 Z', K.ink, 2) + X.P('M 92,360 C 104,352 128,350 150,356 L 140,362 Z', K.ink700, 1.8);
      fig += X.S(MOUND, K.ink, 2.6, `<path d="M 142,286 C 120,302 106,330 104,358 L 126,356 C 128,330 140,306 158,292 Z" fill="${K.ink500}"/>`);
      fig += X.S('M 150,276 C 150,236 176,214 204,214 C 232,214 258,236 258,276 C 240,282 222,284 204,284 C 186,284 168,282 150,276 Z', K.ink, 2.4, X.LW('M 156,262 C 162,236 182,222 204,220', X.v(1.6, 3), K.paper300));
      fig += drip(X, 160, 278, 26, 5.4) + drip(X, 188, 282, 34, 5.8) + drip(X, 226, 282, 30, 5.6) + drip(X, 250, 276, 22, 5);
      over += `<g transform="translate(250,326) rotate(30) scale(0.7,0.62)">${'<path d="' + D.CRES + '" fill="' + K.paper + '" stroke="' + K.ink + '" stroke-width="' + f(X.v(3, 5)) + '"/>'}<circle cx="13" cy="-2" r="${X.v(6, 7)}" fill="${K.ink}" stroke="${K.ink300}" stroke-width="${f(X.v(1.6, 2.6))}"/></g>`;
      over += X.art(scrap(X, 96, 334, 9, -18, 7) + scrap(X, 300, 346, 8, 14, 8) + scrap(X, 176, 300, 7, 8, 9));
      return { back, fig, over };
    }
    // f3: round puddle rx120 · paper300 corona line on the far rim · split mask lying with a paper ✕ eye · ruler across · baton in two
    const P = puddle(X, 192, 342, 122, 29, 13);
    fig += P.s + X.LW('M 92,334 C 130,316 250,314 292,332', X.v(1.4, 2.8), K.paper300);
    fig += D.ruler(X, o, [86, 344], [312, 336], true).s;
    fig += D.baton(X, o, [118, 358], [150, 352], 1) + D.baton(X, o, [258, 360], [294, 354], 1);
    const lie = (d, x, y, rot) => `<g transform="translate(${x},${y}) rotate(${rot}) scale(0.9,0.42)"><path d="${d}" fill="${K.paper}" stroke="${K.ink}" stroke-width="${f(X.v(3, 5))}" stroke-linejoin="round"/></g>`;
    fig += lie(D.CRES_TOP, 202, 350, -8) + lie(D.CRES_BOT, 228, 352, 10);
    fig += `<g transform="translate(213,349) scale(1,0.55)">${xMark(X, 0, 0, X.v(3.6, 4.4))}</g>`;
    return { back, fig, over };
  }

  C.anchorsOf.director = (S) => {
    const aur = { c: D.AUR.slice(), r: D.AR2 };
    if (S.pose === 'death') {
      const fr = S.frame;
      if (fr === 0) return { face: D.MASK.slice(), eye: D.facePt(D.EYE), head: [80, 44], aureole: aur, rulerEnds: [[130, 136], [122, 340]], batonTip: [312, 248], muzzle: [122, 340] };
      if (fr === 1) { const bow = C._.xf(['translate', 200, 360], ['scale', 1.06, 0.7], ['translate', -200, -360], ['matrix', 1, 0, -0.26, 1, 360 * 0.26, 0]); return { face: bow(D.MASK), eye: bow(D.facePt(D.EYE)), head: [196, 150], aureole: { c: [184, 206], r: 57 }, rulerEnds: [[108, 330], [330, 356]], batonTip: [300, 356], muzzle: [330, 356] }; }
      if (fr === 2) { const m = C._.xf(['translate', 250, 326], ['rotate', 30], ['scale', 0.7, 0.62]); return { face: m([0, 0]), eye: m(D.EYE), head: [204, 196], aureole: { c: [204, 250], r: 54 }, rulerEnds: [[86, 344], [312, 336]], batonTip: [294, 354], muzzle: [204, 250] }; }
      return { face: [213, 350], eye: [213, 349], head: [192, 296], aureole: { c: [192, 330], r: 100 }, rulerEnds: [[86, 344], [312, 336]], batonTip: [294, 354], muzzle: [192, 330] };
    }
    const R = D.rig(S);
    const front = S.phase >= 2 ? (() => { const a = R.ruler.a, b = R.ruler.b, L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [a[0] + (b[0] - a[0]) * (L - 6) / L, a[1] + (b[1] - a[1]) * (L - 6) / L]; })() : R.ruler.b.slice();
    // the aureole is drawn in the leaned body frame: its centre follows the lean (attack base +19.3, attack p3 −14.5 in x)
    const ac = R.L(D.AUR);
    // K5def (K1 review 1 R9, main-session decision 2026-10-27): idle muzzle = the ruler's upper end held by the far hand
    // (ruler.a [130,136]); `front` is the tip planted in the floor there. p3 move → aureole centre; windup / attack keep `front`.
    // The game does not read this anchor (no muzzle field in the manifest); draw() output is unchanged.
    return { face: R.L(D.MASK), eye: R.L(D.facePt(D.EYE)), head: R.hd.slice(), aureole: { c: ac, r: D.AR2 }, rulerEnds: [R.ruler.a.slice(), front], batonTip: R.bat.t.slice(), muzzle: R.mv === 'p3' ? ac.slice() : R.pose === 'idle' ? R.ruler.a.slice() : front };
  };
})(window.PN);
