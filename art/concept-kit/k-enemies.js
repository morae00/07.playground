// ============================================================================
// k-enemies.js — PN.enemies · 먹귀(墨鬼) 20 프로필 (5 챕터 × 4 역할)
// Paper Noir Ink / 먹극화. "role rig + chapter material overlay".
// Built from concept/work/enemies/src/*.js (concatenated). Requires lib.js (PN.taper).
// ============================================================================
window.PN = window.PN || {};
(function (PN) {
  'use strict';
  const E = (PN.enemies = PN.enemies || {});
  const K = (E._K = E._K || {});
  const f = (K.f = (n) => Math.round(n * 100) / 100);

  // --- bible §3.1 / §3.2 tokens (binding values) ---
  const C = (K.C = {
    ink: '#121110', ink7: '#2B2926', ink5: '#46423D', ink3: '#8C8579', ink1: '#BCB4A5',
    p50: '#FAF6EC', p100: '#F3EEE2', p300: '#D8D0C0',
    hostile: '#EF5B4F', hostileDeep: '#B8352B', warn: '#D88D16', reward: '#86B82D', elite: '#805AD5'
  });
  // --- bible §3.3 chapter duotones (environment only; halo color = base) ---
  K.CH = {
    1: { key: 'ink-alley', nameKo: '먹선 골목', light: '#D4CAB4', base: '#B8AC93', deep: '#8F836C', spot: '#7E6A4E', eyeKo: '찢긴 슬릿 눈', lineKo: '거친 번짐' },
    2: { key: 'iron-chapel', nameKo: '철문 예배당', light: '#C8CACF', base: '#ABADB4', deep: '#878A93', spot: '#566077', eyeKo: '열쇠 구멍 눈', lineKo: '철선묘' },
    3: { key: 'ashen-canal', nameKo: '무채 운하', light: '#C9CEC4', base: '#ADB4AA', deep: '#8A9288', spot: '#56625C', eyeKo: '기포 눈', lineKo: '습윤 번짐' },
    4: { key: 'clock-grave', nameKo: '시계 무덤', light: '#D5CAB2', base: '#BBAE94', deep: '#978A70', spot: '#7C6644', eyeKo: '문자판 눈', lineKo: '기계선' },
    5: { key: 'eclipse-gate', nameKo: '일식 관문', light: '#C8C3C9', base: '#ABA5AC', deep: '#8A848C', spot: '#3E3747', eyeKo: '일식 고리 눈', lineKo: '지워진 흑요' }
  };
  // --- role rigs (bible §6 / §7.3 / §9.2). u = local units per in-game px. feet = pivot + r*u ---
  K.ROLE = {
    stalker: { glyph: '△', nameKo: '추적', box: [200, 160], pivot: [100, 98], r: 12, u: 4, disp: [40, 26], shadow: [24, 10], gameW: 2.5, frames: 4 },
    charger: { glyph: '▶', nameKo: '돌격', box: [200, 170], pivot: [96, 99], r: 19, u: 3, disp: [54, 40], shadow: [38, 16], gameW: 3, frames: 6 },
    shooter: { glyph: '┳', nameKo: '사격', box: [200, 200], pivot: [78, 144], r: 12, u: 3.5, disp: [48, 46], shadow: [24, 10], gameW: 2.5, frames: 2 },
    warden: { glyph: '■', nameKo: '수문', box: [220, 220], pivot: [110, 136], r: 28, u: 2.5, disp: [68, 76], shadow: [56, 24], gameW: 3, frames: 4 }
  };
  K.NAMES = {
    1: { stalker: '벽보 들개', charger: '먹통 황소', shooter: '붓대 포수', warden: '회벽 수문장' },
    2: { stalker: '창살 쥐', charger: '향로 멧돼지', shooter: '성가대 촛대', warden: '철문 기사상' },
    3: { stalker: '먹물 장어', charger: '수문 거북', shooter: '잿빛 백로 포수', warden: '석축 게' },
    4: { stalker: '태엽 벌레', charger: '시침 멧돼지', shooter: '진자 박격수', warden: '괘종 관 수문장' },
    5: { stalker: '초승 여우', charger: '흑요 코뿔소', shooter: '반영 눈알 포대', warden: '공백 석상' }
  };
  K.DRAW = { stalker: {}, charger: {}, shooter: {}, warden: {} }; // filled by role parts: K.DRAW[role][ch] = (x) => layers
  K.ANCH = { stalker: {}, charger: {}, shooter: {}, warden: {} };
  K.n = 0;

  // ---------- geometry ----------
  // Catmull-Rom through points; a point [x,y,1] is a sharp corner.
  K.sm = function (pts, closed = true) {
    const n = pts.length, P = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const s1 = p1[2] ? 0 : 1 / 6, s2 = p2[2] ? 0 : 1 / 6;
      d += ` C${f(p1[0] + (p2[0] - p0[0]) * s1)},${f(p1[1] + (p2[1] - p0[1]) * s1)} ${f(p2[0] - (p3[0] - p1[0]) * s2)},${f(p2[1] - (p3[1] - p1[1]) * s2)} ${f(p2[0])},${f(p2[1])}`;
    }
    return closed ? d + ' Z' : d;
  };
  K.pl = (pts, closed = true) => 'M' + pts.map((p) => f(p[0]) + ',' + f(p[1])).join(' L') + (closed ? ' Z' : '');
  K.rng = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
  // transform point list: rotate a° about (cx,cy) then translate
  K.xf = (pts, a = 0, cx = 0, cy = 0, dx = 0, dy = 0) => {
    const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    return pts.map((p) => { const x = p[0] - cx, y = p[1] - cy; const q = [cx + x * c - y * s + dx, cy + x * s + y * c + dy]; if (p[2]) q.push(1); return q; });
  };
  // torn edge between a and b (sharp jag points)
  K.jag = (a, b, n, amp, rnd) => {
    const out = [], nx = -(b[1] - a[1]), ny = b[0] - a[0], L = Math.hypot(nx, ny) || 1;
    for (let i = 1; i < n; i++) { const t = i / n, k = (i % 2 ? 1 : -0.55) * amp * (0.45 + rnd()); out.push([a[0] + (b[0] - a[0]) * t + nx / L * k, a[1] + (b[1] - a[1]) * t + ny / L * k, 1]); }
    return out;
  };
  K.circ = (x, y, r, fill, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
  // hanging ink drip (flows DOWN: enemy grammar §5-7)
  K.drip = (x, y, L, w, col = C.ink) => {
    const rb = w * 0.5, cy = y + L - rb;
    return `<path d="M${f(x - w * 0.5)},${f(y)} C${f(x - w * 0.5)},${f(y + L * 0.25)} ${f(x - rb * 0.42)},${f(cy - rb * 1.7)} ${f(x - rb * 0.42)},${f(cy - rb * 0.9)} A${f(rb)},${f(rb)} 0 1 0 ${f(x + rb * 0.42)},${f(cy - rb * 0.9)} C${f(x + rb * 0.42)},${f(cy - rb * 1.7)} ${f(x + w * 0.5)},${f(y + L * 0.25)} ${f(x + w * 0.5)},${f(y)} Z" fill="${col}"/>`;
  };

  // ---------- per-call context ----------
  K.ctx = function (ch, role, o) {
    const R = K.ROLE[role], art = o.lod !== 'game', id = 'ke' + (K.n++) + '_';
    const defs = [], x = { ch, role, o, R, art, id, defs, eyes: [], C, E: K.CH[ch], f };
    x.u = R.u;
    x.W = art ? 3.2 : R.gameW * R.u;          // visible outline width (local units)
    x.w = art ? 1.8 : R.u * 1.0;              // inner line
    x.join = ch === 4 ? 'miter' : 'round';
    let k = 0;
    x.uid = (p = 'x') => id + p + (k++);
    x.clip = (d, evenodd) => { const c = x.uid('c'); defs.push(`<clipPath id="${c}"><path d="${d}"${evenodd ? ' clip-rule="evenodd"' : ''}/></clipPath>`); return `url(#${c})`; };
    x.inClip = (d, inner) => `<g clip-path="${x.clip(d)}">${inner}</g>`;
    // halftone 20/40/60% · 45° · pitch ≥ 3px@1x (art: 6 units)
    const pitch = art ? 6 : 3 * R.u;
    const pat = {};
    x.dot = (lv = 40, col = C.ink) => {
      const key = lv + col; if (pat[key]) return pat[key];
      const pid = x.uid('p'), rr = pitch * Math.sqrt(lv / 100 / Math.PI);
      defs.push(`<pattern id="${pid}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="${pitch / 2}" cy="${pitch / 2}" r="${f(rr)}" fill="${col}"/></pattern>`);
      return (pat[key] = `url(#${pid})`);
    };
    // outlined shape. art: brush feel = shadow-side (down-right) offset stroke +40%, light side 0.7×
    x.shape = (d, fill, w = x.W, extra = '') => {
      const j = `stroke-linejoin="${x.join}" stroke-miterlimit="3"`;
      if (!art) return `<path d="${d}" fill="${fill}" stroke="${C.ink}" stroke-width="${f(w * 1.25)}" ${j} paint-order="stroke" ${extra}/>`; // game: w=x.W → 2.5–3px band at 1x
      if (ch === 2) return `<path d="${d}" fill="${fill}" stroke="${C.ink}" stroke-width="${f(w * 1.7)}" ${j} paint-order="stroke" ${extra}/>`; // 철선묘: even iron wire
      return `<path d="${d}" fill="${C.ink}" stroke="${C.ink}" stroke-width="${f(w * 1.5)}" ${j} transform="translate(${f(w * 0.3)},${f(w * 0.42)})"/>` +
        `<path d="${d}" fill="${fill}" stroke="${C.ink}" stroke-width="${f(w * 1.4)}" ${j} paint-order="stroke" ${extra}/>`;
    };
    x.line = (d, w = x.w, col = C.ink, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="${x.join}" ${extra}/>`;
    x.T = (p, w, mode = 'mid', col = C.ink, extra = '') => PN.taper(p, w, mode, col, extra);
    // key light: flat ink.500 plane; art LOD adds ONE halftone level only along its lower-right terminator
    x.keylight = (hl, dx = 5, dy = 7, lv = 40) => {
      if (!art || !x.halftoneOK) return `<path d="${hl}" fill="${C.ink5}"/>`;
      const mid = x.uid('m'), B = 'x="-60" y="-60" width="360" height="360"';
      defs.push(`<mask id="${mid}" maskUnits="userSpaceOnUse" ${B}><rect ${B} fill="#fff"/><path d="${hl}" fill="#000" transform="translate(${-dx},${-dy})"/></mask>`);
      return `<path d="${hl}" fill="${C.ink5}"/><g mask="url(#${mid})"><path d="${hl}" fill="${x.dot(lv)}"/></g>`;
    };
    // two-level tone (§5-4: max 2 levels per part): 20% overall + 60% on the down-right half through (cx,cy)
    x.shade2 = (cx, cy, lo = 20, hi = 60, k = 1) => {
      const L = 400, a = [cx - L, cy + L * k], b = [cx + L, cy - L * k];
      return `<rect x="-60" y="-60" width="360" height="360" fill="${x.dot(lo)}"/><path d="M${f(a[0])},${f(a[1])} L${f(b[0])},${f(b[1])} L${f(cx + L * 2)},${f(cy + L * 2)} Z" fill="${x.dot(hi)}"/>`;
    };
    x.halftoneOK = art; // art LOD = 원화/쇼케이스(키아트 규칙: 망점 허용). game LOD = 망점 0 (§5-4 ≤48px 규칙을 인게임에서 보장)
    // ink.300 dry-brush rim on top contour (1px @1x)
    x.rim = (p, w) => PN.taper(p, w || (art ? 2.4 : R.u * 1.1), 'mid', C.ink3, '');
    return x;
  };

  // ---------- chapter eyes (paper holes: brightest point, never coral) ----------
  // s = radius-ish; dir = look direction (deg, 0 = right)
  K.eye = function (x, cx, cy, s, opt = {}) {
    const ch = opt.ch || x.ch, a = opt.a || 0, P = C.p50, I = C.ink;
    x.eyes.push([cx, cy, s]);
    const rot = a ? ` transform="rotate(${a} ${f(cx)} ${f(cy)})"` : '';
    if (ch === 1 && !x.art) { // game LOD: full lens slit ≥ 3×2px at 1x + 1px ink pupil (torn jag is noise at 64px)
      const d = `M${f(cx - s)},${f(cy + s * 0.12)} Q${f(cx - s * 0.05)},${f(cy - s * 0.95)} ${f(cx + s * 1.02)},${f(cy - s * 0.16)} Q${f(cx + s * 0.1)},${f(cy + s * 0.78)} ${f(cx - s)},${f(cy + s * 0.12)} Z`;
      return `<g${rot}><path d="${d}" fill="${P}"/>${K.circ(cx + s * 0.28, cy - s * 0.08, s * 0.24, I)}</g>`;
    }
    if (ch === 1) { // torn slit (jagged lower lid)
      const d = `M${f(cx - s)},${f(cy + s * 0.12)} Q${f(cx - s * 0.1)},${f(cy - s * 0.62)} ${f(cx + s * 1.05)},${f(cy - s * 0.18)} L${f(cx + s * 0.55)},${f(cy + s * 0.2)} L${f(cx + s * 0.3)},${f(cy + s * 0.02)} L${f(cx - s * 0.05)},${f(cy + s * 0.34)} L${f(cx - s * 0.35)},${f(cy + s * 0.14)} Z`;
      return `<g${rot}><path d="${d}" fill="${P}"/>${K.circ(cx + s * 0.32, cy - s * 0.12, s * 0.2, I)}</g>`;
    }
    if (ch === 2) { // keyhole
      const d = `M${f(cx - s * 0.2)},${f(cy + s * 0.1)} L${f(cx - s * 0.46)},${f(cy + s * 1.0)} L${f(cx + s * 0.46)},${f(cy + s * 1.0)} L${f(cx + s * 0.2)},${f(cy + s * 0.1)} A${f(s * 0.52)},${f(s * 0.52)} 0 1 0 ${f(cx - s * 0.2)},${f(cy + s * 0.1)} Z`;
      return `<g${rot}><path d="${d}" transform="translate(0,${f(-s * 0.3)})" fill="${P}"/>${K.circ(cx + s * 0.12, cy - s * 0.42, s * 0.2, I)}</g>`;
    }
    if (ch === 3) { // bubble: two rings
      return `${K.circ(cx, cy, s, P)}<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s * 0.64)}" fill="none" stroke="${I}" stroke-width="${f(Math.max(0.9, s * 0.16))}"/>${K.circ(cx + s * 0.2, cy + s * 0.05, s * 0.26, I)}` +
        (x.art && !opt.noSat ? `<circle cx="${f(cx + s * 1.25)}" cy="${f(cy - s * 1.15)}" r="${f(s * 0.32)}" fill="${I}" stroke="${P}" stroke-width="${f(s * 0.14)}"/>` : '');
    }
    if (ch === 4) { // dial: ticks + hand pupil
      const hand = (opt.hand === undefined ? 0 : opt.hand) * Math.PI / 180;
      let t = ''; for (let i = 0; i < 12; i += 3) { const q = i / 12 * Math.PI * 2; t += `M${f(cx + Math.cos(q) * s * 0.68)},${f(cy + Math.sin(q) * s * 0.68)} L${f(cx + Math.cos(q) * s * 0.92)},${f(cy + Math.sin(q) * s * 0.92)} `; }
      return `${K.circ(cx, cy, s, P)}<path d="${t}" stroke="${I}" stroke-width="${f(Math.max(0.8, s * 0.12))}"/>` +
        `<path d="M${f(cx - Math.cos(hand) * s * 0.2)},${f(cy - Math.sin(hand) * s * 0.2)} L${f(cx + Math.cos(hand) * s * 0.8)},${f(cy + Math.sin(hand) * s * 0.8)}" stroke="${I}" stroke-width="${f(Math.max(1, s * 0.24))}" stroke-linecap="round"/>${K.circ(cx, cy, s * 0.2, I)}`;
    }
    // ch5 eclipse: the black disk sits +x of centre, so the white shows as a crescent rim (thick behind, thin in front) — not a goggle / bead.
    // K5-E1 (R4-faces §2.7): core offset s·0.18; the bead only in art.
    const core = x.art ? 0.66 : 0.5; // game LOD: thicker white ring so it survives 1x
    return `${K.circ(cx, cy, s, P)}${K.circ(cx + s * 0.18, cy, s * core, I)}` + (x.art ? K.circ(cx + s * 0.58, cy - s * 0.58, s * 0.2, P) : '');
  };
})(window.PN);
// ---------------------------------------------------------------------------
// part 01 · chapter-material helpers (Ch4 gears, Ch5 crescents / transparent holes / erasure)
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const K = PN.enemies._K, C = K.C, f = K.f;

  // Ch4: brass gear (env.ch4.deep patch) with ink rim and axle hole
  K.gear = (x, cx, cy, r, n = 8, fill, rot = 0) => {
    const pts = [], ri = r * 0.74;
    for (let i = 0; i < n * 2; i++) {
      const a0 = (i / (n * 2)) * Math.PI * 2 + rot * Math.PI / 180, rr = i % 2 ? ri : r;
      pts.push([cx + Math.cos(a0 - 0.12) * rr, cy + Math.sin(a0 - 0.12) * rr], [cx + Math.cos(a0 + 0.12) * rr, cy + Math.sin(a0 + 0.12) * rr]);
    }
    return `<path d="${K.pl(pts)}" fill="${fill || x.E.deep}" stroke="${C.ink}" stroke-width="${f(x.art ? 1.8 : 0.8 * x.u)}" stroke-linejoin="miter" paint-order="stroke"/>` + K.circ(cx, cy, r * 0.3, C.ink);
  };

  // arc flags for going a → b through m (angles in rad, SVG y-down)
  function flags(a, m, b) {
    const N = (t) => ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const ab = N(b - a), am = N(m - a);
    return am < ab ? { sw: 1, lg: ab > Math.PI ? 1 : 0 } : { sw: 0, lg: 2 * Math.PI - ab > Math.PI ? 1 : 0 };
  }
  // crescent = disc(c1,r1) minus disc(c2,r2)
  K.crescent = (x1, y1, r1, x2, y2, r2) => {
    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
    const px = x1 + ux * a, py = y1 + uy * a;
    const I1 = [px - uy * h, py + ux * h], I2 = [px + uy * h, py - ux * h];
    const ang = (p, cx, cy) => Math.atan2(p[1] - cy, p[0] - cx);
    const F = [x1 - ux * r1, y1 - uy * r1], G = [x2 - ux * r2, y2 - uy * r2];
    const o = flags(ang(I2, x1, y1), ang(F, x1, y1), ang(I1, x1, y1));
    const i = flags(ang(I1, x2, y2), ang(G, x2, y2), ang(I2, x2, y2));
    return `M${f(I2[0])},${f(I2[1])} A${f(r1)},${f(r1)} 0 ${o.lg} ${o.sw} ${f(I1[0])},${f(I1[1])} A${f(r2)},${f(r2)} 0 ${i.lg} ${i.sw} ${f(I2[0])},${f(I2[1])} Z`;
  };

  // Ch5 hole rule (§9.3): cut TRANSPARENT (ground shows through), 3px ink rim + halftone bleed.
  // erase = optional svg of black shapes that nibble the body edge (지워진 가장자리)
  K.holed = (x, holes, content, erase = '') => {
    const mid = x.uid('m'), B = 'x="-120" y="-120" width="480" height="480"';
    x.defs.push(`<mask id="${mid}" maskUnits="userSpaceOnUse" ${B}><rect ${B} fill="#fff"/>${holes.map((d) => `<path d="${d}" fill="#000"/>`).join('')}${erase}</mask>`);
    let rim = '';
    holes.forEach((d) => {
      if (x.art) rim += x.inClip(d, `<path d="${d}" fill="none" stroke="${x.dot(20)}" stroke-width="${f(x.W * 2.4)}"/><path d="${d}" fill="none" stroke="${x.dot(60)}" stroke-width="${f(x.W * 1.5)}"/>`); // thin bleed so the ground still shows through
      rim += `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${f(x.art ? x.W * 1.5 : 3 * x.u)}" stroke-linejoin="round"/>`;
    });
    return `<g mask="url(#${mid})">${content}</g>${rim}`;
  };
  // irregular erasure nibbles along an edge polyline (black = erased in the mask). Never a regular dot row.
  K.nibble = (pts, n, r, seed) => {
    const rnd = K.rng(seed); let o = '';
    for (let i = 0; i < n; i++) {
      const k = rnd() * (pts.length - 1), j = Math.floor(k), t = k - j, a = pts[j], b = pts[j + 1];
      const nx = -(b[1] - a[1]), ny = b[0] - a[0], L = Math.hypot(nx, ny) || 1, rr = r * (0.45 + rnd() * 0.8), off = -rr * (0.35 + rnd() * 0.5);
      o += K.circ(a[0] + (b[0] - a[0]) * t + nx / L * off, a[1] + (b[1] - a[1]) * t + ny / L * off, rr, '#000');
    }
    return o;
  };

  // Ch5 obsidian facet glint (thin paper sliver, tiny area)
  K.glint = (x, pts) => `<path d="${K.pl(pts)}" fill="${C.p100}"/>`;
})(window.PN);
// ---------------------------------------------------------------------------
// part 02 · shared rig kit: 2-bone IK legs (thigh / shin / foot), limb outlines,
// gait cycles, designed spot planes, speed lines, dust puffs, tension arcs.
// Every role rig builds its pose from these so the 4 silhouettes stay constant
// while chapter overlays change only material / eyes / line quality.
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const K = PN.enemies._K, C = K.C, f = K.f;

  // 2-bone IK: knee for hip a → ankle b, bone lengths L1/L2.
  // bend +1 = knee to the BACK (−x, e.g. dog elbow), −1 = knee FORWARD (+x, e.g. hind stifle / human knee)
  K.ik = (a, b, L1, L2, bend) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.max(1e-3, Math.min(Math.hypot(dx, dy), L1 + L2 - 0.05));
    const ca = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), ang = Math.acos(Math.max(-1, Math.min(1, ca)));
    const t = Math.atan2(dy, dx) + bend * ang;
    return [a[0] + Math.cos(t) * L1, a[1] + Math.sin(t) * L1];
  };
  // apply a 2D affine (a,b,c,d,e,f like SVG matrix) to a point
  K.mx = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
  // rotate(deg about cx,cy) · then scale(sx,sy about ox,oy) · then translate(tx,ty) → matrix
  K.pose = (o = {}) => {
    const r = (o.rot || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), [cx, cy] = o.rc || [0, 0];
    let m = [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy];
    const sx = o.sx || 1, sy = o.sy || 1, [ox, oy] = o.sc || [0, 0];
    m = [m[0] * sx, m[1] * sy, m[2] * sx, m[3] * sy, (m[4] - ox) * sx + ox, (m[5] - oy) * sy + oy];
    m[4] += o.tx || 0; m[5] += o.ty || 0;
    return m;
  };
  K.mstr = (m) => `matrix(${m.map(f).join(' ')})`;

  // limb outline through joints P[i] with widths W[i]; foot shape appended at the last joint.
  // foot: 'paw' | 'hoof' | 'claw' | 'web' | 'boot' | 'spade' | 'none'. gy = ground y (contact) or null (lifted)
  K.limbD = (P, W, foot = 'paw', dirSign = 1) => {
    const n = P.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const nx = -dy, ny = dx, h = W[i] / 2;               // left of travel (downwards) = −x = back
      L.push([P[i][0] + nx * h, P[i][1] + ny * h]); R.push([P[i][0] - nx * h, P[i][1] - ny * h]);
    }
    const e = P[n - 1], w = W[n - 1], d = dirSign;          // d = +1 toes point +x (facing right)
    let tip = [];
    if (foot === 'paw') tip = [[e[0] - d * w * 0.55, e[1] + w * 0.34], [e[0] + d * w * 0.2, e[1] + w * 0.5, 1], [e[0] + d * w * 0.95, e[1] + w * 0.46, 1], [e[0] + d * w * 1.05, e[1] + w * 0.05]];
    else if (foot === 'hoof') tip = [[e[0] - d * w * 0.62, e[1] + w * 0.1, 1], [e[0] - d * w * 0.6, e[1] + w * 0.62, 1], [e[0] + d * w * 0.78, e[1] + w * 0.62, 1], [e[0] + d * w * 0.66, e[1] + w * 0.02, 1]];
    else if (foot === 'claw') tip = [[e[0] + d * w * 0.1, e[1] + w * 1.4, 1]];
    else if (foot === 'web') tip = [[e[0] - d * w * 0.9, e[1] + w * 0.52, 1], [e[0] - d * w * 0.3, e[1] + w * 0.4, 1], [e[0] + d * w * 0.3, e[1] + w * 0.56, 1], [e[0] + d * w * 0.8, e[1] + w * 0.42, 1], [e[0] + d * w * 1.5, e[1] + w * 0.52, 1], [e[0] + d * w * 0.9, e[1] - w * 0.1]];
    else if (foot === 'boot') tip = [[e[0] - d * w * 0.7, e[1] + w * 0.2], [e[0] - d * w * 0.66, e[1] + w * 0.7, 1], [e[0] + d * w * 1.6, e[1] + w * 0.7, 1], [e[0] + d * w * 1.3, e[1] + w * 0.05]];
    else if (foot === 'spade') tip = [[e[0] - d * w * 1.1, e[1] + w * 0.9, 1], [e[0] + d * w * 0.1, e[1] + w * 0.15, 1], [e[0] + d * w * 1.2, e[1] + w * 0.9, 1]];
    if (foot === 'claw' || foot === 'spade') { L[n - 1] = L[n - 1].concat([1]); R[n - 1] = R[n - 1].concat([1]); } // no spline overshoot below a point
    return K.sm(L.concat(tip, R.slice().reverse()));
  };

  // how far below the last joint each foot type reaches (× last width) → place joint at ground − drop·w
  K.DROP = { paw: 0.5, hoof: 0.62, claw: 1.4, web: 0.56, boot: 0.7, spade: 0.9, none: 0.5 };
  K.onGround = (tx, gy, w, ft) => [tx, gy - w * (K.DROP[ft] || 0.5)];
  // one IK leg. spec: {h:[hip], a:[ankle], t:[toe], L:[L1,L2], b:bend, w:[w_hip,w_knee,w_ankle,w_toe], ft:'paw'}
  // returns {d, knee, joints}
  K.legGeo = (s) => {
    const k = s.k || K.ik(s.h, s.a, s.L[0], s.L[1], s.b);
    const P = s.t ? [s.h, k, s.a, s.t] : [s.h, k, s.a];
    const W = s.t ? s.w : s.w.slice(0, 3);
    return { d: K.limbD(P, W, s.ft || 'paw', s.dir || 1), knee: k, P };
  };
  // draw an IK leg with the context outline; near = ink, far = ink.700. Adds a key-light sliver on the thigh front.
  K.leg = (x, s, near = true, extra = '') => {
    const g = K.legGeo(s), fill = s.fill || (near ? C.ink : C.ink7);
    let o = x.shape(g.d, fill, x.W * (s.ow || 0.8));
    if (near && s.hl !== false) {
      const [h, k] = g.P, w0 = s.w[0] * 0.5, mx = (h[0] + k[0]) / 2, my = (h[1] + k[1]) / 2;
      const hlD = `M${f(h[0] - w0 * 0.9)},${f(h[1] - 2)} Q${f(mx - w0 * 0.9)},${f(my)} ${f(k[0] - s.w[1] * 0.35)},${f(k[1])} L${f(k[0] - s.w[1] * 0.05)},${f(k[1] - 3)} Q${f(mx - w0 * 0.2)},${f(my - 2)} ${f(h[0] - w0 * 0.1)},${f(h[1] - 4)} Z`;
      o += x.inClip(g.d, `<path d="${hlD}" fill="${C.ink5}"/>`);
    }
    return o + extra;
  };

  // gait offset for a foot: t in [0,1): stance 0..0.5 slides +S → −S on the ground, swing lifts by H.
  K.gait = (fr, N, ph, S, H) => {
    const t = (((fr / N + ph) % 1) + 1) % 1;
    if (t < 0.5) return [S * (1 - 4 * t), 0, 0];
    const u = (t - 0.5) * 2, e = u * u * (3 - 2 * u);
    return [-S + 2 * S * e, -H * Math.sin(Math.PI * u), 1];
  };
  K.fr = (x, N) => (x.o.frame == null ? null : (((x.o.frame | 0) % N) + N) % N);

  // designed spot plane (flat ink.500) clipped to a body; art LOD adds a 40% halftone terminator band.
  K.spot = (x, bodyD, planeD, lv = 40) => x.inClip(bodyD, x.keylight(planeD, 4, 6, lv));
  // zig-zag lower edge between two x's along y(x) — returns point list (for plane polygons)
  K.zig = (x0, x1, yTop, yFn, n, amp, rnd) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, xx = x0 + (x1 - x0) * t; pts.push([xx, yFn(xx) + (i % 2 ? amp * (0.6 + 0.6 * (rnd ? rnd() : 0.5)) : 0), 1]); }
    return pts;
  };

  // two ink.700 speed lines trailing behind (stalker pass frames, §9.2 '먹 속도선 2줄')
  K.speed = (x, x0, y0, len, gap = 10) => x.T([x0, y0, x0 - len * 0.5, y0 - 1, x0 - len, y0], x.art ? 5 : 1.4 * x.u, 'start', C.ink7) +
    x.T([x0 + 6, y0 + gap, x0 - len * 0.35, y0 + gap - 1, x0 - len * 0.7, y0 + gap], x.art ? 4 : 1.2 * x.u, 'start', C.ink7);
  // 담묵 dust puffs (ink.300 fill, ink rim) — kicked behind feet
  K.puffs = (x, pts) => pts.map(([px, py, r]) => x.shape(K.sm([[px - r, py], [px - r * 0.6, py - r * 0.8], [px, py - r * 1.05], [px + r * 0.7, py - r * 0.7], [px + r, py - r * 0.05], [px + r * 0.5, py + r * 0.45], [px - r * 0.5, py + r * 0.45]]), C.ink3, x.art ? 1.5 : 0.7 * x.u)).join('');
  // comic tension arc(s) above a body (ink, never signal colour)
  K.arc = (x, cx, cy, rx, ry, a0, a1, n = 2) => {
    let o = '';
    for (let i = 0; i < n; i++) {
      const k = 1 + i * 0.28, A = a0 * Math.PI / 180, B = a1 * Math.PI / 180, M = (A + B) / 2;
      const p = (t) => [cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k];
      const [p0, p1, p2] = [p(A), p(M), p(B)], c = [2 * p1[0] - (p0[0] + p2[0]) / 2, 2 * p1[1] - (p0[1] + p2[1]) / 2];
      o += x.T([p0[0], p0[1], c[0], c[1], p2[0], p2[1]], (x.art ? 4.2 : 1.5 * x.u) * (1 - i * 0.25), 'mid', C.ink);
    }
    return o;
  };
  // teeth row (paper, ink rim) along a→b, n points; up = teeth point upward
  K.teeth = (x, a, b, n, h, up, sw) => {
    let d = `M${f(a[0])},${f(a[1])}`;
    for (let i = 1; i <= n; i++) { const t = (i - 0.5) / n, t2 = i / n; d += ` L${f(a[0] + (b[0] - a[0]) * t)},${f(a[1] + (b[1] - a[1]) * t + (up ? -h : h))} L${f(a[0] + (b[0] - a[0]) * t2)},${f(a[1] + (b[1] - a[1]) * t2)}`; }
    return `<path d="${d} Z" fill="${C.p50}" stroke="${C.ink}" stroke-width="${f(sw || (x.art ? 1.1 : 0.55 * x.u))}" stroke-linejoin="round"/>`;
  };
  // stitched mouth line (ink + paper stitches)
  K.stitch = (x, pts, n = 4) => {
    const d = K.sm(pts, false);
    let st = '';
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1), j = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1))), u = t * (pts.length - 1) - j, a = pts[j], b = pts[j + 1];
      const px = a[0] + (b[0] - a[0]) * u, py = a[1] + (b[1] - a[1]) * u;
      st += `M${f(px - 1.2)},${f(py - 3.4)} L${f(px + 1.2)},${f(py + 3.4)} `;
    }
    return x.line(d, x.art ? 2.2 : 0.9 * x.u) + x.line(st, x.art ? 1.3 : 0.6 * x.u, C.p300);
  };
  // hanging drips list [[x,y,len,w],...]; game LOD keeps the first `keep` (≥2px wide)
  K.drips = (x, list, keep = 2) => list.filter((d, i) => x.art || i < keep).map(([a, b, l, w, col]) => K.drip(a, b, x.art ? l : Math.max(l, 3 * x.u), x.art ? w : Math.max(w, 2.2 * x.u), col)).join('');
})(window.PN);
// ---------------------------------------------------------------------------
// part 10 · STALKER △ rig (box 200×160, pivot 100,98, feet y146, u=4)
// Low, long, FLAT topline (0.6:1), saw-tooth back, long thin tail stroke, head raised &
// extended with pointed ears. Key pose = stalking crouch (near fore-paw lifted, hind bent).
// Walk = 4f diagonal trot (contact / pass / contact / pass) with body bob + 2 speed lines.
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const E = PN.enemies, K = E._K, C = K.C, f = K.f, sm = K.sm, pl = K.pl;
  const S = (K.STK = {});
  S.GY = 146; S.GYF = 142;
  // neutral legs: h = hip/shoulder, a = ankle (wrist / hock), tx = toe x on the ground
  S.LEGS = {
    ff: { h: [126, 88], a: [134, 132], tx: 142, L: [24, 23], b: 1, w: [18, 10, 7, 8], far: 1 },
    fh: { h: [68, 86], a: [60, 126], tx: 68, L: [26, 24], b: -1, w: [24, 12, 7, 8], far: 1 },
    nf: { h: [136, 90], a: [142, 136], tx: 150, L: [25, 24], b: 1, w: [22, 12, 8, 9] },
    nh: { h: [56, 86], a: [46, 128], tx: 56, L: [28, 26], b: -1, w: [30, 14, 8, 9] }
  };
  S.NECK = [146, 82];

  // pose from state/frame (simulation-invariant; renderer only)
  S.pose = (x) => {
    const st = x.o.state, fr = K.fr(x, 4), key = fr == null;
    const P = { key, fr, pass: false, body: [0, 0], head: [0, 0, 0], tail: 0, L: {} };
    for (const k in S.LEGS) P.L[k] = { da: [0, 0], curl: 0 };
    if (key) {
      P.L.nf.da = [7, -19]; P.L.nf.curl = 80;       // near fore-paw lifted & curled (pointer)
      P.L.ff.da = [4, 0]; P.L.nh.da = [-5, 0]; P.L.fh.da = [3, 0];
      P.body = [0, 3]; P.head = [3, 4, 3]; P.tail = -4;
    } else {
      const ph = { nf: 0, fh: 0, ff: 0.5, nh: 0.5 };
      for (const k in P.L) {
        const g = K.gait(fr, 4, ph[k], k[1] === 'f' ? 13 : 12, 13);
        P.L[k].da = [g[0], g[1]]; P.L[k].curl = g[2] ? 60 * Math.min(1, -g[1] / 10) : 0;
      }
      P.pass = fr % 2 === 1;
      P.body = [0, P.pass ? -5 : 1]; P.head = [0, P.pass ? -3 : 2, P.pass ? -2 : 2]; P.tail = P.pass ? 6 : -6;
    }
    if (st === 'windup') { // closing in: flatten lower, legs splay, head drops to strike line
      P.body = [0, 9]; P.head = [5, 12, 8]; P.tail = -12;
      P.L.nf.da = [9, 0]; P.L.nf.curl = 0; P.L.ff.da = [6, 0]; P.L.nh.da = [-9, 0]; P.L.fh.da = [-4, 0];
    }
    return P;
  };

  // build one leg from pose
  S.legSpec = (x, k, P, st) => {
    const N = S.LEGS[k], L = P.L[k], by = P.body[1], gy = N.far ? S.GYF : S.GY;
    const w = (st.w && st.w[k]) || N.w, ft = st.ft || 'paw';
    const a = [N.a[0] + L.da[0], N.a[1] + L.da[1]];
    const t0 = K.onGround(N.tx, gy, w[3], ft), fv = [t0[0] - N.a[0], t0[1] - N.a[1]];
    const r = L.curl * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    const t = [a[0] + fv[0] * c - fv[1] * s, a[1] + fv[0] * s + fv[1] * c];
    return { h: [N.h[0] + P.body[0], N.h[1] + by], a, t, L: N.L, b: N.b, w, ft, fill: N.far ? (st.farFill || C.ink7) : (st.fill || C.ink), hl: !N.far && st.hl !== false };
  };
  S.leg = (x, k, P, st) => {
    const s = S.legSpec(x, k, P, st);
    if (!x.art) s.w = s.w.map((v) => v * 0.8);
    const g = K.legGeo(s), [h, kn, an] = g.P;
    let o = x.shape(g.d, s.fill, x.art ? x.W * 0.72 : x.u * 0.7);
    if (s.hl) { // lit crescent on the upper-left edge of thigh → shin
      const w0 = s.w[0] * 0.5, w1 = s.w[1] * 0.5;
      o += x.inClip(g.d, x.T([h[0] - w0 * 0.55, h[1] - 4, (h[0] + kn[0]) / 2 - w0 * 0.75, (h[1] + kn[1]) / 2, kn[0] - w1 * 0.55, kn[1] + 3], x.art ? w0 * 0.75 : w0 * 0.6, 'end', C.ink5));
    }
    return o + (st.deco ? st.deco(x, g, !S.LEGS[k].far) : '');
  };

  /**
   * S.rig(x, spec) → {g, head, front, posed:true}
   * spec: torso (pts, neutral), poly, planes (d, clipped to torso), rim (taper pts),
   *       back(x,P) behind torso · spikes(x,P) over torso · head(x,P) head-local (rig transforms it)
   *       top(x,P) after near legs · legs {ft, w, fill, deco} · drips [[x,y,l,w]]
   */
  S.rig = (x, sp) => {
    const P = S.pose(x), st = sp.legs || {};
    const bm = `translate(${f(P.body[0])},${f(P.body[1])})`;
    const [nx, ny] = S.NECK, hm = `translate(${f(P.head[0] + P.body[0])},${f(P.head[1] + P.body[1])}) rotate(${f(P.head[2])} ${nx} ${ny})`;
    const T = sp.poly ? pl(sp.torso) : sm(sp.torso);
    const torso = x.shape(T, C.ink) + x.inClip(T, (sp.planes ? x.keylight(sp.planes, 2, 3, 20) : '') + (sp.inner ? sp.inner(x, P) : '') + (sp.rim ? x.rim(sp.rim) : ''));
    let g = '';
    if (!P.key && P.pass && x.o.state !== 'windup') g += K.speed(x, 24, 96, x.art ? 44 : 40, x.art ? 14 : 16);
    g += (sp.back ? `<g transform="${bm}">${sp.back(x, P)}</g>` : '');
    g += S.leg(x, 'ff', P, st) + S.leg(x, 'fh', P, st);
    const tg = torso + (sp.spikes ? sp.spikes(x, P) : '');
    g += `<g transform="${bm}">${K.drips(x, sp.drips || [], 2)}${sp.holes ? K.holed(x, sp.holes, tg, sp.erase || '') : tg}</g>`;
    g += `<g transform="${hm}">${sp.head(x, P)}</g>`;
    g += S.leg(x, 'nh', P, st) + S.leg(x, 'nf', P, st);
    if (sp.top) g += `<g transform="${bm}">${sp.top(x, P)}</g>`;
    if (x.o.state === 'windup' && !x.o.silhouette) g += K.arc(x, 92, 74, 58, 26, 205, 330, 2);
    return { g, head: sp.anchor || [150, 30], front: [150, 146], posed: true };
  };

  // paper scrap (poster / talisman): art = paper.300 + 20/60 halftone (reads ≤ ground), game = flat ink.300
  S.scrap = (x, pts, marks = '') => {
    const d = pl(pts), cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    return x.art ? x.shape(d, C.p300, 2.2) + x.inClip(d, x.shade2(cx + 2, cy + 2) + marks) : x.shape(d, C.ink3, x.W * 0.8);
  };
  // shared canine torso (flat topline y≈69, deep chest, tucked waist) — chapters tweak a few points
  S.DOG = [[36, 82], [46, 72], [70, 69], [104, 70], [130, 68], [146, 70], [155, 78], [157, 92], [150, 106], [138, 112], [122, 108], [104, 98], [86, 96], [70, 102], [54, 106], [40, 100], [33, 90]];
  // designed spot planes (art): zig-zag back plane (3/4 top sliver) + shoulder crescent + haunch crescent
  S.DOG_PL = pl([[26, 90], [40, 62], [152, 60], [161, 82], [148, 86, 1], [140, 96], [130, 86, 1], [114, 94], [104, 84, 1], [88, 92], [78, 83, 1], [62, 91], [52, 84, 1], [38, 100]]) + ' ' +
    sm([[124, 98], [140, 92], [156, 94], [154, 108, 1], [146, 100], [132, 101]]) + ' ' + sm([[34, 98], [48, 94], [66, 97], [54, 101], [42, 108, 1]]);
  // game LOD: one clean back band + shoulder wedge (no zig noise at 1x)
  S.DOG_PLG = pl([[26, 86], [40, 64], [152, 62], [157, 80], [136, 86], [128, 82], [96, 83], [64, 83], [40, 90]]);
  S.DOG_RIM = [40, 72, 96, 66, 148, 69];
  // torn poster standing out of the back like a raked saw tooth. base centre (bx,by), height h, width w, tilt deg
  S.poster = (x, bx, by, w, h, tilt, seed, marks) => {
    // a rectangular sheet with straight sides, one corner torn off diagonally and a few small jags (never a crown)
    const r = K.rng(seed), L = bx - w / 2, Rr = bx + w / 2, T = by - h;
    const pts = K.xf([[L, by, 1], [L, T + h * 0.08, 1], [L + w * 0.18, T, 1], [L + w * 0.42, T + 2 + r() * 2, 1], [L + w * 0.5, T + 5, 1], [L + w * 0.62, T + 1, 1], [Rr, T + h * (0.34 + r() * 0.1), 1], [Rr - 2, T + h * 0.5, 1], [Rr, T + h * 0.56, 1], [Rr, by, 1]], tilt, bx, by);
    return S.scrap(x, pts, marks ? `<g transform="rotate(${tilt} ${bx} ${by})">${marks}</g>` : '') + (x.art ? K.circ(bx, by - 4, 2.4, C.ink3, `stroke="${C.ink}" stroke-width="1.2"`) : '');
  };
  S.tooth = (x, bx, by, w, h, tilt = -20, fill = C.ink) => x.shape(pl(K.xf([[bx - w / 2, by + 2], [bx - w * 0.2, by - h, 1], [bx + w / 2, by + 2]], tilt, bx, by)), fill, x.art ? x.W * 0.6 : x.u * 0.6);

  // ======================= Ch1 · 벽보 들개 =======================
  K.DRAW.stalker[1] = (x) => {
    const art = x.art;
    return S.rig(x, {
      torso: S.DOG, planes: art ? S.DOG_PL : S.DOG_PLG, rim: S.DOG_RIM, drips: [[138, 110, 16, 5.4], [70, 102, 12, 4.4], [106, 97, 10, 3.8]],
      back: (x, P) => x.T([38, 82, 14, 80 + P.tail, 2, 58 + P.tail * 1.6], art ? 10 : 12, 'start') + (art ? x.T([36, 88, 22, 94, 10, 86], 4, 'start') + K.circ(8, 98, 2, C.ink) + K.circ(3, 92, 1.3, C.ink) : ''),
      spikes: (x) => {
        let o = S.tooth(x, 46, 74, 12, 12, -26) + S.tooth(x, 134, 72, 12, 14, -22) + S.tooth(x, 144, 74, 10, 11, -18);
        if (art) {
          // K5-G10: no letter-like marks. A = print (block + 3 falling lines), B = solid block + 2 lines, C = blank with the lower-left corner torn off
          o += S.poster(x, 62, 79, 22, 32, -32, 3, `<rect x="54" y="53" width="12.5" height="8.5" fill="${C.ink}"/><path d="M54,65 h15 M54,69.5 h11 M54,74 h7" stroke="${C.ink}" stroke-width="2"/>`);
          o += S.poster(x, 90, 77, 26, 40, -24, 7, `<rect x="80" y="46" width="17" height="13" fill="${C.ink}"/><path d="M80,64.5 h19 M80,69.5 h12" stroke="${C.ink}" stroke-width="2.2"/>`);
          o += S.poster(x, 117, 75, 20, 30, -18, 5, `<path d="M105,63 L109.6,64.8 L108.2,67.6 L112.4,69.6 L111,72.2 L115.6,74 L116.8,77 L105,77 Z" fill="${C.ink}"/>`);
        } else {
          o += S.poster(x, 70, 78, 22, 28, -28, 3) + S.poster(x, 104, 76, 22, 30, -22, 7);
        }
        return o;
      },
      head: (x) => {
        const H = sm([[143, 76], [149, 63], [161, 56], [176, 58], [186, 66], [196, 73], [201, 80, 1], [199, 87], [190, 90], [176, 92, 1], [190, 97], [186, 104], [171, 107], [156, 103], [146, 93]]);
        const earF = x.shape(pl([[146, 66], [140, 34, 1], [157, 61]]), C.ink7, art ? x.W * 0.72 : x.u * 0.6);
        const earN = pl([[154, 62], [153, 28, 1], [158, 35, 1], [161, 30, 1], [171, 59]]);
        let o = earF + x.shape(H, C.ink) + x.inClip(H, x.keylight(pl([[146, 64], [160, 53], [177, 56], [199, 77], [189, 78], [178, 68], [165, 66], [153, 73]]), 1.5, 2.5, 20) +
          (art ? x.keylight(sm([[150, 96], [160, 100], [174, 101], [166, 105, 1], [152, 102]]), 1, 2, 20) : '') + x.rim([150, 62, 164, 55, 182, 63]));
        o += x.shape(earN, C.ink, art ? x.W : x.u * 0.6) + x.inClip(earN, art ? `<path d="${pl([[146, 26], [176, 26], [172, 37, 1], [166, 34, 1], [161, 40, 1], [155, 36, 1], [150, 41]])}" fill="${C.p300}"/><path d="M146,32 L176,32 L172,41 L150,43 Z" fill="${x.dot(40)}"/>` + `<path d="${pl([[155, 58], [154, 42], [162, 58]])}" fill="${C.ink5}"/>` : `<path d="${pl([[155, 58], [154, 34], [162, 58]])}" fill="${C.ink5}"/>`);
        o += x.shape(pl([[156, 67], [170, 62], [187, 70], [183, 73, 1], [170, 68], [158, 72]]), C.ink, art ? 1.2 : x.u * 0.3); // heavy brow
        o += K.eye(x, 172, 75, art ? 11.5 : 12, { a: -12 });
        o += K.teeth(x, [199, 87], [176, 92], art ? 6 : 3, art ? 5.5 : 6) + K.teeth(x, [177, 93], [190, 97], art ? 4 : 2, art ? 4.2 : 5, true);
        if (art) o += x.line('M186,82 q4,2 8,0 M183,86 q5,1 9,-1 M178,80 q3,3 7,3', 1.3, C.ink5) + K.circ(198, 79, 1.8, C.ink5);
        return o;
      },
      legs: { ft: 'paw' },
      top: (x) => (art ? K.circ(24, 104, 2.2, C.ink) + K.circ(18, 112, 1.4, C.ink) : ''),
      anchor: [158, 22]
    });
  };
  K.ANCH.stalker[1] = { head: [158, 22] };
})(window.PN);
// ---------------------------------------------------------------------------
// part 11 · STALKER △ Ch2 창살 쥐 · Ch3 먹물 장어 · Ch4 태엽 벌레 · Ch5 초승 여우
// same rig (S.rig) → same flat-topped, saw-backed, ear-up, thin-tailed silhouette
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const E = PN.enemies, K = E._K, C = K.C, f = K.f, sm = K.sm, pl = K.pl, S = K.STK;
  const D = K.DRAW.stalker, A = K.ANCH.stalker;

  // ======================= Ch2 · 창살 쥐 =======================
  D[2] = (x) => {
    const art = x.art;
    const T = [[32, 92], [38, 76], [60, 69], [100, 68], [128, 68], [146, 72], [154, 82], [155, 96], [147, 107], [132, 111], [112, 107], [92, 103], [70, 107], [50, 110], [36, 104]];
    const bars = [48, 70, 92, 114, 134];
    return S.rig(x, {
      torso: T, rim: [40, 74, 96, 66, 146, 70], drips: [[128, 110, 14, 4.8], [60, 108, 12, 4.4], [96, 103, 9, 3.6]],
      planes: art ? pl([[26, 92], [40, 62], [152, 62], [160, 84], [146, 88, 1], [138, 94], [126, 86, 1], [100, 92], [76, 86, 1], [52, 94], [38, 100]]) + ' ' + sm([[120, 96], [138, 92], [152, 96], [148, 106, 1], [140, 100], [128, 101]]) : pl([[26, 90], [40, 62], [152, 62], [158, 82], [120, 86], [60, 86], [38, 94]]),
      back: (x, P) => { // riveted chain tail — long thin, sweeping back and up
        let o = ''; const cp = [[34, 92], [24, 91], [15, 86], [8, 78], [4, 68], [4 + P.tail * 0.3, 58], [7 + P.tail * 0.6, 49]];
        cp.forEach(([cx, cy], i) => {
          const nx = cp[Math.min(i + 1, cp.length - 1)], a = i < cp.length - 1 ? Math.atan2(nx[1] - cy, nx[0] - cx) * 180 / Math.PI : -80;
          const el = (sw, col) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${i % 2 ? 5.6 : 6}" ry="${i % 2 ? 2 : 3.8}" transform="rotate(${f(a)} ${f(cx)} ${f(cy)})" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
          o += el(art ? 4 : 2.2 * x.u, C.ink) + (art ? el(1.2, C.ink3) : '');
        });
        return o + x.shape(pl([[4 + P.tail * 0.6, 50], [10 + P.tail * 0.6, 38, 1], [12 + P.tail * 0.6, 50]]), C.ink, art ? 1.4 : x.u * 0.5);
      },
      spikes: (x) => { // cage-bar spine: arched iron ribs wrap the flank and spear out above the back, raked back
        let o = '';
        bars.forEach((bx, i) => {
          const h = [14, 18, 20, 18, 14][i], top = [bx - 9, 66 - h, 1];
          const d = sm([[bx - 4, 106], [bx - 1, 86], [bx - 1, 72], top, [bx + 5, 70], [bx + 4, 86], [bx + 2, 106]]);
          o += x.shape(d, C.ink5, art ? 1.9 : x.u * 0.55) + (art ? x.line(`M${bx + 1},${74} Q${bx + 2},90 ${bx},104`, 1.1, C.ink3) : '');
        });
        o += x.line('M40,78 Q92,62 146,76', art ? 5.2 : 2.2 * x.u) + x.line('M40,78 Q92,62 146,76', art ? 2 : 0.8 * x.u, C.ink5);
        if (art) o += bars.map((bx) => K.circ(bx + 1, 71 - (bx - 92) * (bx - 92) * -0.0012 - 2, 2, C.ink3, `stroke="${C.ink}" stroke-width="1"`)).join('');
        return o;
      },
      head: (x) => {
        const H = sm([[142, 78], [148, 66], [160, 61], [174, 64], [186, 72], [197, 82], [202, 88, 1], [197, 93], [185, 96], [176, 101], [158, 103], [145, 95]]);
        const earF = x.shape(sm([[146, 68], [138, 50], [144, 38, 1], [156, 50], [156, 64]]), C.ink7, art ? x.W * 0.72 : x.u * 0.6);
        const earN = sm([[153, 64], [148, 46], [154, 30, 1], [164, 40], [168, 52, 1], [163, 53], [168, 62]]);
        let o = earF + x.shape(H, C.ink) + x.inClip(H, x.keylight(pl([[146, 66], [160, 57], [176, 60], [200, 84], [190, 84], [176, 72], [162, 70], [152, 76]]), 1.5, 2.5, 20) + x.rim([150, 64, 164, 60, 182, 68]));
        o += x.shape(earN, C.ink, art ? x.W : x.u * 0.6) + x.inClip(earN, `<path d="${sm([[155, 58], [153, 42], [158, 36], [162, 50]])}" fill="${C.ink5}"/>`);
        o += x.shape(pl([[158, 70], [171, 66], [184, 74], [180, 76, 1], [170, 72], [160, 75]]), C.ink, art ? 1.2 : x.u * 0.3);
        o += K.eye(x, 171, 81, art ? 10 : 11);
        o += `<path d="M186,95 l1.5,9 l5,-1 l-1,-8 Z M192,94 l2,8 l4,-1.5 l-1.5,-7 Z" fill="${C.p50}" stroke="${C.ink}" stroke-width="${art ? 1.1 : 0.55 * x.u}"/>`;
        if (art) o += x.line('M196,86 L208,82 M196,89 L210,90 M195,92 L206,97', 1.1) + K.circ(200, 86, 1.8, C.ink5) + x.line('M160,98 q6,3 14,1', 1.4, C.ink5);
        return o;
      },
      legs: { ft: 'paw', deco: (x, g, near) => (art && near ? x.line(`M${f(g.P[3][0] + 2)},${f(g.P[3][1] + 4)} l5,2 M${f(g.P[3][0] + 1)},${f(g.P[3][1] + 6)} l4,3`, 1.2, C.ink) : '') },
      anchor: [156, 24]
    });
  };
  A[2] = { head: [156, 24] };

  // ======================= Ch3 · 먹물 장어 =======================
  D[3] = (x) => {
    const art = x.art;
    const T = [[28, 98], [38, 82], [62, 74], [100, 72], [130, 72], [148, 76], [156, 86], [154, 99], [142, 108], [120, 110], [96, 106], [70, 108], [48, 112], [32, 108]];
    return S.rig(x, {
      torso: T, rim: [40, 80, 96, 70, 146, 74],
      drips: [[140, 106, 18, 5.4], [110, 108, 14, 4.8], [76, 107, 16, 5], [48, 111, 11, 4.2], [128, 109, 9, 3.4]],
      planes: art ? sm([[26, 94], [40, 70], [110, 64], [154, 70], [162, 88], [150, 86, 1], [136, 92], [118, 84, 1], [96, 90], [74, 84, 1], [54, 92], [36, 102, 1]]) + ' ' + sm([[124, 98], [140, 94], [154, 98], [150, 106, 1], [138, 102]]) : pl([[26, 94], [40, 66], [154, 68], [158, 86], [120, 88], [60, 88], [36, 100]]),
      back: (x, P) => { // long eel tail: falls from the rump and snakes along the ground, fin frill continues; ink trail behind
        const tail = sm([[38, 94], [22, 108], [10, 126 + P.tail * 0.2], [-2, 140, 1], [-12, 143, 1], [4, 132], [18, 118], [36, 104]]);
        const frill = pl([[30, 98], [22, 92, 1], [20, 104], [10, 104, 1], [10, 116], [0, 118, 1], [2, 128], [-8, 132, 1], [-4, 138]]);
        return `<path d="M-14,142 Q6,135 30,139 Q16,145 -14,146 Z" fill="${C.ink7}"/>` + x.shape(frill, C.ink7, art ? x.W * 0.6 : x.u * 0.5) + x.shape(tail, C.ink, art ? x.W * 0.8 : x.u * 0.6) + x.inClip(tail, `<path d="M-4,124 L30,96 L36,100 L6,128 Z" fill="${C.ink5}"/>`) +
          (art ? x.line('M-24,144 L0,143 M-18,146 L6,145', 1.6, C.ink7) + x.line('M8,128 L-2,136 M18,118 L8,126', 1.2, C.ink5) + K.drip(12, 128, 9, 3.2) : '');
      },
      spikes: (x) => { // saw-tooth dorsal fin, raked back, ribbed
        const fin = pl([[36, 86], [36, 70, 1], [50, 80], [54, 62, 1], [70, 76], [76, 58, 1], [92, 74], [98, 56, 1], [114, 72], [120, 58, 1], [134, 74], [140, 62, 1], [150, 80]]);
        return x.shape(fin, C.ink7, art ? 2.2 : x.u * 0.6) + x.inClip(fin, art ? x.line('M38,84 L37,72 M54,78 L55,64 M76,74 L77,60 M98,72 L99,58 M120,70 L121,60 M140,74 L141,64', 1.4, C.ink5) + `<path d="M30,60 L150,52 L150,62 L30,70 Z" fill="${C.ink5}" opacity="0.7"/>` : '');
      },
      head: (x) => {
        const H = sm([[140, 84], [148, 72], [166, 66], [184, 70], [196, 78], [202, 86, 1], [196, 92], [178, 96], [194, 100], [184, 106], [162, 106], [146, 98]]);
        const gill = (bx, by, s, col) => x.shape(pl([[bx, by + 10], [bx - 8 * s, by - 16 * s, 1], [bx + 1, by - 4], [bx + 4, by - 22 * s, 1], [bx + 9, by + 4]]), col, art ? x.W * 0.7 : x.u * 0.6);
        let o = gill(146, 70, 0.9, C.ink7) + x.shape(H, C.ink) + x.inClip(H, x.keylight(sm([[144, 74], [166, 62], [192, 70], [200, 86], [186, 80], [168, 74], [152, 80]]), 1.5, 2.5, 20) + x.rim([150, 72, 168, 66, 186, 70]));
        o += gill(156, 72, 1.1, C.ink) + x.inClip(pl([[156, 82], [148, 48], [157, 68], [160, 44], [165, 76]]), `<path d="M150,50 L158,70 L160,48 Z" fill="${C.ink5}"/>`);
        o += K.teeth(x, [199, 91], [180, 95], art ? 7 : 3, art ? 4.5 : 5.5) + K.teeth(x, [180, 97], [193, 100], art ? 5 : 2, art ? 3.8 : 4.5, true);
        o += K.eye(x, 168, 80, art ? 9.5 : 10) + K.eye(x, 183, 73, art ? 6.5 : 7.2, { noSat: true });
        if (art) o += x.T([150, 70, 156, 67, 162, 67], 1.6, 'mid', C.p50); // K5-E2: wet highlight = a sliver on the top contour (a round dot read as a 3rd eye); none in game
        if (art) o += K.drip(170, 104, 12, 3.6) + K.drip(190, 102, 9, 3);
        return o;
      },
      legs: { ft: 'web', w: { nf: [15, 9, 6, 7], ff: [12, 8, 5, 6], nh: [20, 10, 6, 7], fh: [17, 9, 5, 6] } },
      anchor: [160, 30]
    });
  };
  A[3] = { head: [160, 30] };

  // ======================= Ch4 · 태엽 벌레 =======================
  D[4] = (x) => {
    const art = x.art, fr = K.fr(x, 4) || 0;
    const T = [[30, 92], [38, 76], [60, 69], [100, 68], [130, 68], [148, 72], [156, 82], [154, 98], [140, 108], [110, 106], [80, 106], [52, 108], [36, 102]];
    const midLeg = (hx, hy, kx, ky, fx, near) => { const d = `M${hx},${hy} L${kx},${ky} L${fx},${S.GY - (near ? 0 : 4)}`; return x.line(d, art ? 5 : 2 * x.u, near ? C.ink : C.ink7) + (art ? x.line(d, 1.2, C.ink5) : ''); }; // K5-D: x.line already sets round cap + x.join (miter in Ch4)
    const sx = [1, 0.55, 0.1, 0.55][fr];
    return S.rig(x, {
      torso: T, poly: true, rim: [40, 74, 96, 67, 146, 70], drips: [[118, 106, 13, 4.4], [66, 107, 10, 3.8], [146, 104, 9, 3.4]],
      planes: art ? pl([[26, 92], [40, 62], [152, 62], [160, 84], [146, 86], [146, 78], [124, 80], [124, 88], [100, 84], [100, 78], [76, 80], [76, 88], [52, 86], [38, 98]]) : pl([[26, 90], [40, 62], [152, 62], [158, 82], [124, 84], [60, 84], [38, 94]]),
      inner: (x) => x.line('M62,70 L58,108 M88,68 L86,106 M114,68 L114,106 M140,70 L144,106', art ? 2.2 : 0.9 * x.u, C.ink) + (art ? [[74, 94], [100, 92], [128, 92]].map(([a, b]) => K.circ(a, b, 2.2, C.ink3, `stroke="${C.ink}" stroke-width="1"`)).join('') : ''),
      back: (x) => { // wind-up key tail (bow turns per frame) + far mid legs
        const key = x.line('M34,86 L12,62', art ? 6 : 2.4 * x.u) + (art ? x.line('M34,86 L12,62', 1.8, x.E.deep) : '') +
          `<g transform="translate(9,57) rotate(-42) scale(${sx},1)">${['-7', '7'].map((dx) => `<circle cx="${dx}" cy="-9" r="7" fill="none" stroke="${C.ink}" stroke-width="${art ? 7 : 3.2 * x.u}"/>` + (art ? `<circle cx="${dx}" cy="-9" r="7" fill="none" stroke="${x.E.deep}" stroke-width="3.2"/>` : '')).join('')}${K.circ(0, -2, art ? 3.2 : 1.5 * x.u, C.ink)}</g>`;
        return key + midLeg(96, 100, 92, 116, 86 - fr * 2, false);
      },
      spikes: (x) => [[46, 74, 14, 14], [72, 72, 16, 18], [98, 71, 16, 20], [124, 71, 16, 17], [146, 74, 12, 12]].map(([bx, by, w, h]) => S.tooth(x, bx, by, w, h, -24, C.ink) + (art ? `<path d="${pl(K.xf([[bx - w / 2 + 3, by], [bx - w * 0.2, by - h + 4], [bx, by]], -24, bx, by))}" fill="${C.ink5}"/>` : '')).join(''),
      head: (x) => {
        const H = pl([[142, 78], [150, 64], [168, 60], [186, 66], [198, 78], [199, 90], [186, 98], [160, 102], [146, 94]]);
        const ant = (x0, y0, x1, y1, col) => x.line(`M${x0},${y0} Q${(x0 + x1) / 2 - 6},${(y0 + y1) / 2} ${x1},${y1}`, art ? 2.6 : 1.1 * x.u, col) + x.shape(pl([[x1 - 4, y1 + 4], [x1 - 1, y1 - 8, 1], [x1 + 4, y1 + 3]]), col, art ? 1.2 : x.u * 0.4);
        let o = ant(152, 64, 144, 36, C.ink7) + x.shape(H, C.ink) + x.inClip(H, `<path d="${pl([[146, 64], [168, 56], [192, 66], [200, 80], [186, 74], [166, 68], [152, 74]])}" fill="${C.ink5}"/>` + x.rim([150, 64, 168, 60, 186, 66]) + (art ? x.line('M160,62 L156,100 M186,68 L184,98', 1.6, C.ink5) : ''));
        o += ant(162, 62, 162, 30, C.ink);
        o += K.eye(x, 172, 80, art ? 11 : 12, { hand: -20 });
        // mandibles (mechanical: no lips)
        o += x.shape(pl([[190, 92], [206, 96], [200, 104, 1], [194, 98]]), C.ink, art ? x.W * 0.6 : x.u * 0.5) + x.shape(pl([[184, 98], [198, 110], [188, 108, 1]]), C.ink7, art ? x.W * 0.6 : x.u * 0.5);
        return o;
      },
      legs: { ft: 'claw', w: { nf: [18, 9, 7, 5], ff: [15, 8, 6, 4], nh: [22, 10, 7, 5], fh: [18, 9, 6, 4] },
        deco: (x, g, near) => (near ? K.gear(x, g.P[1][0], g.P[1][1], art ? 6 : 2.4 * x.u, 7, null, fr * 22) + (art ? K.drip(g.P[1][0] + 1, g.P[1][1] + 5, 8, 2.8) : '') : '') },
      top: (x) => midLeg(104, 100, 110, 118, 116 + fr * 2, true),
      anchor: [160, 22]
    });
  };
  A[4] = { head: [160, 22] };

  // ======================= Ch5 · 초승 여우 =======================
  D[5] = (x) => {
    const art = x.art;
    const T = [[34, 84], [46, 72], [72, 68], [104, 69], [130, 67], [146, 70], [155, 78], [157, 92], [150, 106], [138, 112], [122, 108], [104, 99], [86, 97], [70, 102], [54, 106], [40, 100], [33, 90]];
    const hole = K.crescent(100, 85, 16, 108, 79, 12.5);
    const erase = art ? K.nibble([[34, 84], [46, 72], [72, 68], [104, 69]], 20, 4, 5) + K.nibble([[40, 100], [54, 106], [70, 102]], 7, 3, 9) : '';
    const facets = pl([[46, 72], [72, 68], [58, 88]]) + ' ' + pl([[104, 69], [130, 67], [118, 86]]) + ' ' + pl([[146, 70], [157, 88], [138, 84]]) + ' ' + pl([[54, 106], [70, 102], [62, 94]]);
    return S.rig(x, {
      torso: T, poly: true, rim: [46, 72, 96, 66, 146, 70], drips: [[138, 110, 13, 4.4], [60, 104, 10, 3.8]],
      planes: art ? facets + ' ' + pl([[30, 80], [40, 64], [150, 62], [150, 70], [104, 72], [60, 74], [40, 84]]) : pl([[30, 82], [40, 62], [152, 62], [157, 80], [120, 78], [60, 80], [38, 90]]),
      inner: (x) => (art ? x.line('M72,68 L58,88 L70,102 M130,67 L118,86 L104,99 M146,70 L138,84 L138,112', 1.2, C.ink3) + K.glint(x, [[120, 68], [132, 69], [122, 71]]) : ''),
      back: (x, P) => { // tail = white crescent brush stroke, ink-rimmed
        const tp = [38, 84, -10, 76 + P.tail, 14, 26 + P.tail];
        return x.T(tp, art ? 21 : 22, 'mid', C.ink) + x.T(tp, art ? 11 : 9, 'mid', C.p100);
      },
      spikes: (x) => [[52, 72, 12, 14], [80, 70, 12, 16], [110, 70, 13, 18], [138, 69, 11, 13]].map(([bx, by, w, h]) => S.tooth(x, bx, by, w, h, -28) + (art ? `<path d="${pl(K.xf([[bx - w / 2 + 2, by], [bx - w * 0.2, by - h + 3], [bx - 1, by]], -28, bx, by))}" fill="${C.ink5}"/>` : '')).join(''),
      holes: [hole], erase,
      head: (x) => {
        const H = pl([[143, 76], [150, 64], [162, 58], [178, 62], [190, 72], [201, 81], [197, 87], [182, 90], [188, 96], [171, 101], [154, 99], [146, 90]]);
        const earF = x.shape(pl([[146, 66], [140, 30, 1], [157, 60]]), C.ink7, art ? x.W * 0.72 : x.u * 0.6);
        const earN = pl([[154, 62], [158, 22, 1], [172, 59]]);
        let o = earF + x.shape(H, C.ink) + x.inClip(H, `<path d="${pl([[146, 66], [162, 55], [180, 60], [199, 80], [182, 72], [162, 66]])}" fill="${C.ink5}"/>` + x.rim([150, 64, 164, 58, 182, 64]) + (art ? x.line('M162,66 L170,98 M180,62 L174,90', 1.1, C.ink3) : ''));
        o += x.shape(earN, C.ink, art ? x.W : x.u * 0.6) + `<path d="${pl([[157, 58], [158, 32], [165, 58]])}" fill="${C.ink5}"/>`;
        o += x.shape(pl([[158, 68], [172, 64], [186, 71], [182, 73, 1], [170, 70], [160, 72]]), C.ink, art ? 1.2 : x.u * 0.3);
        o += art ? K.eye(x, 169.5, 77, 8) + K.eye(x, 186.5, 74.5, 4.6) : K.eye(x, 172, 76, 9.5); // K5-E1: game = one eye; art gap ≥ 4
        o += K.teeth(x, [197, 87], [182, 90], art ? 4 : 2, art ? 5 : 6);
        return o;
      },
      legs: { ft: 'paw', w: { nf: [20, 10, 7, 8], ff: [16, 9, 6, 7], nh: [28, 12, 7, 8], fh: [22, 10, 6, 7] } },
      anchor: [158, 18]
    });
  };
  A[5] = { head: [158, 18] };
})(window.PN);
// ---------------------------------------------------------------------------
// part 20 · CHARGER ▶ rig (box 200×170, pivot 96,99, feet y156, u=3)
// TRUE WEDGE: back peak directly over the front legs (y36), straight topline falling to a rear
// at ~58% height, small bent rear legs, head dropped 18% below the peak, ram/horn projecting
// forward ≥20% of body length ahead of the snout. Key pose = braced; windup = dedicated pose.
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const E = PN.enemies, K = E._K, C = K.C, f = K.f, sm = K.sm, pl = K.pl;
  const G = (K.CHG = {});
  G.GY = 156; G.GYF = 151;
  G.LEGS = {
    ff: { h: [122, 108], a: [136, 141], tx: 144, L: [22, 21], b: 1, w: [28, 17, 12, 13], far: 1 },
    fh: { h: [46, 106], a: [38, 136], tx: 46, L: [20, 19], b: -1, w: [22, 11, 8, 10], far: 1 },
    nf: { h: [132, 112], a: [146, 146], tx: 154, L: [23, 22], b: 1, w: [34, 20, 14, 15] },
    nh: { h: [34, 110], a: [24, 140], tx: 32, L: [22, 20], b: -1, w: [26, 13, 9, 11] }
  };
  G.NECK = [142, 70];   // head group pivot
  G.SHOULDER = [124, 44];
  // neutral wedge torso: peak (124,36) over the front legs → straight fall → rear top (26,88)
  G.TORSO = [[20, 114], [18, 98], [26, 88], [56, 74], [90, 56], [114, 40], [124, 36], [136, 39], [147, 50], [155, 70], [158, 96], [152, 120], [138, 132], [118, 131], [94, 127], [70, 127], [46, 127], [30, 123]];
  G.PL = pl([[14, 96], [22, 82], [120, 30], [140, 34], [150, 52], [138, 54, 1], [132, 64], [124, 56, 1], [110, 68], [102, 60, 1], [86, 74], [78, 68, 1], [62, 82], [54, 76, 1], [38, 92], [30, 88, 1], [22, 102]]) + ' ' +
    sm([[118, 70], [138, 62], [154, 74], [156, 94, 1], [146, 80], [130, 76]]) + ' ' + sm([[22, 104], [36, 98], [52, 102], [40, 106], [28, 114, 1]]);
  G.PLG = pl([[14, 96], [22, 80], [120, 30], [142, 34], [154, 60], [132, 62], [100, 70], [60, 84], [30, 100]]);
  G.RIM = [30, 86, 80, 60, 132, 36];

  G.pose = (x) => {
    const st = x.o.state, fr = K.fr(x, 6), key = fr == null;
    const P = { key, fr, wind: st === 'windup', body: { rot: 0, tx: 0, ty: 0, sx: 1, sy: 1 }, head: [0, 0, 0], L: {}, dust: [] };
    for (const k in G.LEGS) P.L[k] = { da: [0, 0], curl: 0 };
    if (key) { // braced: fore-legs splayed forward, rear bent
      P.L.nf.da = [8, 0]; P.L.ff.da = [6, 0]; P.L.nh.da = [-6, 0]; P.L.fh.da = [-3, 0]; P.head = [0, 2, 2];
    } else {
      const ph = { nf: 0, ff: 0.5, nh: 0.5, fh: 0 };
      for (const k in P.L) { const g = K.gait(fr, 6, ph[k], k[1] === 'f' ? 10 : 8, 10); P.L[k].da = [g[0], g[1]]; P.L[k].curl = g[2] ? -30 * Math.min(1, -g[1] / 8) : 0; if (!g[2] && Math.abs(g[0]) > 9) P.dust.push(k); }
      P.body.ty = [0, -3, -4, 0, -3, -4][fr]; P.body.rot = [0, 1, 0, 0, 1, 0][fr]; P.head = [0, [2, -1, -2, 2, -1, -2][fr], [2, 0, -1, 2, 0, -1][fr]];
    }
    if (P.wind) { // designed first & bigger than the charge (§15): rear crouch, fore-legs planted forward, head to the ground
      P.body = { rot: -7, tx: 0, ty: 4, sx: 1.08, sy: 0.95 };
      P.L.nf.da = [16, 0]; P.L.ff.da = [13, 0]; P.L.nh.da = [-12, 0]; P.L.fh.da = [-9, 0];
      P.head = [6, 20, 10];
    }
    P.m = K.pose({ rot: P.body.rot, rc: [G.SHOULDER[0], G.GY], sx: P.body.sx, sy: P.body.sy, sc: [150, G.GY], tx: P.body.tx, ty: P.body.ty });
    return P;
  };
  G.legSpec = (x, k, P, st) => {
    const N = G.LEGS[k], L = P.L[k], gy = N.far ? G.GYF : G.GY, w = (st.w && st.w[k]) || N.w, ft = st.ft || 'hoof';
    const a = [N.a[0] + L.da[0], N.a[1] + L.da[1]], t0 = K.onGround(N.tx, gy, w[3], ft), fv = [t0[0] - N.a[0], t0[1] - N.a[1]];
    const r = L.curl * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    return { h: K.mx(P.m, N.h), a, t: [a[0] + fv[0] * c - fv[1] * s, a[1] + fv[0] * s + fv[1] * c], L: N.L, b: N.b, w: x.art ? w : w.map((v) => v * 0.85), ft, fill: N.far ? C.ink7 : C.ink, near: !N.far };
  };
  G.leg = (x, k, P, st) => {
    const s = G.legSpec(x, k, P, st), g = K.legGeo(s), [h, kn] = g.P;
    let o = x.shape(g.d, s.fill, x.art ? x.W * 0.8 : x.u * 0.8);
    if (s.near) o += x.inClip(g.d, x.T([h[0] - s.w[0] * 0.3, h[1] - 6, (h[0] + kn[0]) / 2 - s.w[0] * 0.4, (h[1] + kn[1]) / 2, kn[0] - s.w[1] * 0.3, kn[1] + 4], s.w[0] * (x.art ? 0.42 : 0.34), 'end', C.ink5));
    if (s.ft === 'hoof' && x.art) { const t = g.P[g.P.length - 1], w3 = s.w[3]; o += x.line(`M${f(t[0] - w3 * 0.5)},${f(t[1] + w3 * 0.14)} L${f(t[0] + w3 * 0.6)},${f(t[1] + w3 * 0.14)}`, 1.6, C.ink5); }
    return o + (st.deco ? st.deco(x, g, s.near) : '');
  };

  /** G.rig(x, sp): sp = {torso?, poly?, planes?, rim?, back, over (on torso), head (head-local), front, legs, drips, holes, erase, anchor} */
  G.rig = (x, sp) => {
    const P = G.pose(x), st = sp.legs || {}, bm = K.mstr(P.m);
    const [nx, ny] = G.NECK, hp = K.mx(P.m, G.NECK);
    const hm = `translate(${f(hp[0] - nx + P.head[0])},${f(hp[1] - ny + P.head[1])}) rotate(${f(P.head[2])} ${nx} ${ny})`;
    const T = sp.poly ? pl(sp.torso || G.TORSO) : sm(sp.torso || G.TORSO);
    const torso = x.shape(T, C.ink, x.W * 1.05) + x.inClip(T, x.keylight(sp.planes || (x.art ? G.PL : G.PLG), 3, 4, 20) + (sp.inner ? sp.inner(x, P) : '') + x.rim(sp.rim || G.RIM));
    let g = '';
    if (P.wind && !x.o.silhouette) g += K.puffs(x, [[10, G.GY - 4, 8 * (x.art ? 1 : 1.3)], [-4, G.GY - 12, 5.5 * (x.art ? 1 : 1.3)], [26, G.GY + 2, 5]]);
    if (!P.key && !P.wind && !x.o.silhouette) P.dust.forEach((k) => { const N = G.LEGS[k]; g += K.puffs(x, [[N.tx - 12, (N.far ? G.GYF : G.GY) - 2, 4.5]]); });
    g += `<g transform="${bm}">${sp.back ? sp.back(x, P) : ''}</g>`;
    g += G.leg(x, 'ff', P, st) + G.leg(x, 'fh', P, st);
    const tg = torso + (sp.over ? sp.over(x, P) : '');
    g += `<g transform="${bm}">${K.drips(x, sp.drips || [], 2)}${sp.holes ? K.holed(x, sp.holes, tg, sp.erase || '') : tg}</g>`;
    g += G.leg(x, 'nh', P, st);
    g += `<g transform="${hm}">${sp.head(x, P)}</g>`;
    g += G.leg(x, 'nf', P, st);
    if (sp.front) g += `<g transform="${hm}">${sp.front(x, P)}</g>`;
    if (P.wind && !x.o.silhouette) g += K.arc(x, 70, 70, 60, 34, 200, 300, 2);
    return { g, head: sp.anchor || [110, 10], front: [150, 156], posed: true };
  };
  // bent pipe (ink sandwich + ink.300 metal core)
  G.pipe = (x, d, w) => x.line(d, w + (x.art ? 5 : 2.4 * x.u), C.ink) + x.line(d, w, C.ink3) + (x.art ? x.line(d, 1.4, C.ink1, 'opacity="0.7" transform="translate(-0.8,-1.4)"') : '');

  // ======================= Ch1 · 먹통 황소 =======================
  K.DRAW.charger[1] = (x) => {
    const art = x.art;
    const nail = (x0, y0, x1, y1) => x.line(`M${x0},${y0} L${x1},${y1}`, art ? 5 : 2.2 * x.u) + (art ? x.line(`M${x0},${y0} L${x1},${y1}`, 1.6, x.E.deep) : '') +
      `<ellipse cx="${x1}" cy="${y1}" rx="${art ? 5.5 : 2.4 * x.u}" ry="${art ? 2.2 : 1.1 * x.u}" transform="rotate(${f(Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI + 90)} ${x1} ${y1})" fill="${x.E.deep}" stroke="${C.ink}" stroke-width="${art ? 2.2 : 1 * x.u}" paint-order="stroke"/>`;
    return G.rig(x, {
      drips: [[140, 130, 16, 5.4], [90, 126, 12, 4.4], [50, 126, 10, 3.8]],
      back: (x) => x.T([22, 96, 8, 102, 6, 120], art ? 5 : 2.2 * x.u, 'start') + x.T([7, 116, 1, 126, 0, 136], art ? 6 : 2.6 * x.u, 'start') + x.T([8, 116, 8, 128, 11, 138], art ? 5 : 2 * x.u, 'start'),
      over: (x) => nail(86, 60, 76, 36) + nail(106, 48, 102, 22) + nail(126, 40, 118, 14),
      head: (x) => {
        // skull + jaw under the bucket (mouth read), bucket helmet, forward-bent pipe horns
        const jaw = sm([[140, 104], [158, 100], [172, 106], [170, 118], [156, 124], [140, 120]]);
        let o = x.shape(jaw, C.ink) + K.teeth(x, [168, 108], [148, 108], art ? 5 : 2, art ? 4 : 5) + x.line('M146,114 L166,114', art ? 1.4 : 0.6 * x.u, C.ink5);
        o += G.pipe(x, 'M150,68 Q156,58 170,58 L198,60 Q203,61 204,66', art ? 4 : 1.6 * x.u); // far horn: bent forward, tip hooks down
        const B = pl([[132, 60], [170, 64], [176, 106], [134, 110]]);
        o += x.shape(B, x.E.deep, x.W) + x.inClip(B, (art ? x.shade2(154, 86, 20, 60, 0.6) : '') +
          `<path d="M124,58 L180,62 L180,69 L124,65 Z M124,98 L180,98 L180,114 L124,114 Z" fill="${C.ink}"/><path d="M124,76 L180,78 L180,90 L124,90 Z" fill="${C.ink}"/>` +
          (art ? `<path d="M166,66 L170,104" stroke="${C.ink1}" stroke-width="2" opacity="0.6"/><path d="M142,94 q4,-4 8,0" stroke="${C.ink}" stroke-width="1.6" fill="none"/>` : ''));
        o += x.line('M136,62 Q152,40 168,64', art ? 2.4 : x.u);
        o += K.eye(x, 146, 84, art ? 8.2 : 9, { a: -6 }) + K.eye(x, 163, 84.5, art ? 6.6 : 7.4, { a: 5 });
        o += G.pipe(x, 'M156,72 Q160,62 174,62 L200,64 Q206,65 207,72', art ? 5.5 : 2.2 * x.u); // near horn: forward, near-horizontal ram
        if (art) o += `<path d="${pl([[172, 56], [180, 55], [180, 61], [172, 62]])}" fill="${C.p300}" stroke="${C.ink}" stroke-width="1.6"/><path d="${pl([[190, 58], [196, 57], [195, 63]])}" fill="${C.p300}" stroke="${C.ink}" stroke-width="1.4"/>` + x.line('M168,58 L168,66 M192,60 L192,68', 2, C.ink);
        return o;
      },
      front: (x, P) => (P.wind || P.key ? K.puffs(x, [[182, 116, 6], [192, 124, 4]]) : ''),
      anchor: [118, 4]
    });
  };
  K.ANCH.charger[1] = { head: [118, 4] };

  // ======================= Ch2 · 향로 멧돼지 =======================
  K.DRAW.charger[2] = (x) => {
    const art = x.art, sway = x.o.frame == null ? 3 : [0, 3, 5, 3, 0, -2][K.fr(x, 6)];
    // censer head hangs from the neck (sways); body = shared wedge
    return G.rig(x, {
      drips: [[138, 130, 15, 5.2], [84, 126, 11, 4]],
      back: (x) => x.line('M22,96 q-10,4 -8,12 q2,8 -8,10', art ? 3 : 1.4 * x.u),
      over: (x) => { // iron-wire bristle crest swept back along the falling topline
        let br = ''; for (let i = 0; i < 8; i++) { const t = i / 7, bx = 36 + t * 92, by = 84 - t * 46; br += `${f(bx - 2)},${f(by + 4)} ${f(bx - 16)},${f(by - 10 + t * 2)} ${f(bx + 6)},${f(by - 2)} `; }
        return x.shape(`M30,92 L${br} L136,40 L130,52 Z`, C.ink, art ? 1.6 : x.u * 0.5) + (art ? x.line('M40,86 L128,44', 1.2, C.ink3) : '');
      },
      head: (x) => {
        const jaw = sm([[136, 108], [156, 104], [170, 110], [168, 120], [150, 126], [136, 122]]);
        let o = x.shape(jaw, C.ink) + K.stitch(x, [[142, 114], [154, 113], [166, 114]], 3);
        o += x.line('M150,108 L186,104 L196,94', art ? 6 : 2.6 * x.u, C.ink7) + `<ellipse cx="196" cy="92" rx="5" ry="2" fill="${C.ink7}" stroke="${C.ink}" stroke-width="${art ? 1.6 : x.u}"/>`; // far candlestick tusk
        const bowl = sm([[130, 70], [168, 70], [174, 86], [168, 102], [150, 110], [132, 102], [126, 86]]);
        const lid = sm([[132, 70], [136, 58], [150, 52], [164, 58], [168, 70]]);
        const smoke = art ? x.T([142, 56, 128, 42, 138, 28], 4, 'mid', C.ink3) + x.T([160, 54, 154, 38, 166, 24], 3.4, 'mid', C.ink3) + x.T([138, 32, 148, 20, 138, 10], 2.4, 'mid', C.ink3) : x.T([150, 52, 140, 38, 150, 26], 2 * x.u, 'mid', C.ink3);
        const holes = art ? [[138, 94], [152, 100], [164, 90]].map(([a, b]) => `<path d="M${a - 3},${b} L${a},${b - 3} L${a + 3},${b} L${a},${b + 3} Z" fill="${C.ink}"/>`).join('') : '';
        o += `<g transform="rotate(${sway} 132 58)">` + smoke + x.line('M126,56 L136,64 M128,50 L150,53', art ? 2.4 : x.u) +
          x.shape(bowl, C.ink5, x.W) + x.inClip(bowl, (art ? `<rect x="120" y="60" width="70" height="60" fill="${x.dot(40)}" transform="translate(10,10)"/>` : '') + `<path d="M120,76 L180,76 L180,81 L120,81 Z" fill="${C.ink}"/>` + x.rim([130, 86, 132, 76, 142, 74], art ? 2 : null)) + holes +
          x.shape(lid, C.ink7) + x.shape('M146,54 L150,42 L154,54 Z', C.ink, art ? 1.8 : x.u * 0.5) +
          K.eye(x, 142, 88, art ? 8 : 8.8) + K.eye(x, 159, 89, art ? 6.4 : 7) +
          `<circle cx="172" cy="104" r="${art ? 6 : 6.5}" fill="none" stroke="${C.ink}" stroke-width="${art ? 4 : 2 * x.u}"/>` + (art ? `<circle cx="172" cy="104" r="6" fill="none" stroke="${C.ink3}" stroke-width="1.4"/>` : '') + `</g>`;
        // near candlestick tusk: forward, near-horizontal, drip-cup + stub candle at the tip
        const tusk = 'M154,114 L192,112 Q200,111 202,102';
        o += x.line(tusk, art ? 7 : 3 * x.u) + x.line(tusk, art ? 2.6 : 1 * x.u, C.ink3) + (art ? x.line('M168,110 l0,6 M182,109 l0,6', 2.2) : '') +
          `<ellipse cx="202" cy="100" rx="7" ry="2.6" fill="${C.ink5}" stroke="${C.ink}" stroke-width="${art ? 1.8 : x.u}" paint-order="stroke"/>` + x.shape('M199,99 L199,89 L205,89 L205,99 Z', C.p300, art ? 1.4 : x.u * 0.5) + (art ? K.drip(203, 94, 6, 2, C.p300) : '');
        return o;
      },
      anchor: [112, 4]
    });
  };
  K.ANCH.charger[2] = { head: [112, 4] };
})(window.PN);
// ---------------------------------------------------------------------------
// part 21 · CHARGER ▶ Ch3 수문 거북 · Ch4 시침 멧돼지 · Ch5 흑요 코뿔소 (same wedge rig G.rig)
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const E = PN.enemies, K = E._K, C = K.C, f = K.f, sm = K.sm, pl = K.pl, G = K.CHG;
  const D = K.DRAW.charger, A = K.ANCH.charger;

  // ======================= Ch3 · 수문 거북 =======================
  // the sluice-gate slab IS the wedge shell; its iron-shod top corner is the forward prow (ram).
  D[3] = (x) => {
    const art = x.art;
    const skin = [[20, 116], [22, 104], [40, 100], [100, 92], [146, 88], [158, 100], [150, 122], [136, 132], [100, 130], [60, 128], [30, 124]];
    return G.rig(x, {
      torso: skin, planes: pl([[10, 104], [20, 94], [150, 82], [156, 96], [120, 100], [40, 108]]), rim: [24, 104, 90, 94, 150, 90],
      drips: [[110, 128, 16, 5.2], [60, 126, 12, 4.4], [140, 130, 10, 3.8]],
      back: (x) => x.shape('M24,114 L2,124 L26,124 Z', C.ink, x.art ? x.W * 0.7 : x.u * 0.6),
      over: (x) => {
        const side = pl([[12, 102], [22, 84], [120, 36], [142, 33], [200, 57, 1], [194, 66, 1], [162, 70], [158, 82], [36, 120], [16, 118]]);
        const top = pl([[22, 84], [120, 36], [142, 33], [200, 57], [190, 60], [142, 42], [122, 45], [26, 92]]);
        let pk = ''; for (let i = 1; i < 7; i++) { const t = i / 7; pk += `M${f(26 + 120 * t)},${f(90 - 50 * t)} L${f(36 + 124 * t)},${f(118 - 40 * t)} `; }
        let o = x.shape(side, C.ink7, x.W * 1.05) + x.inClip(side, x.line(pk, art ? 2 : 0.9 * x.u) + `<path d="M8,100 L200,52 L200,60 L8,110 Z M8,114 L180,70 L180,78 L8,124 Z" fill="${C.ink}"/>` +
          (art ? `<path d="M150,30 L204,52 L200,72 L150,76 Z" fill="${x.dot(40)}"/>` + [[46, 96], [86, 80], [126, 64], [160, 56], [50, 112], [100, 100], [150, 78]].map(([a, b]) => K.circ(a, b, 2, C.ink3, `stroke="${C.ink}" stroke-width="0.9"`)).join('') : ''));
        o += x.shape(top, C.ink5, x.W * 0.8) + (art ? x.inClip(top, `<path d="M20,70 L200,50 L200,58 L20,90 Z" fill="${x.dot(20)}"/>` + x.rim([26, 86, 90, 54, 146, 38], 2.2)) : '');
        // iron shoe on the prow corner
        o += x.shape(pl([[178, 50], [202, 57, 1], [196, 67, 1], [176, 64]]), C.ink, art ? x.W * 0.8 : x.u * 0.6) + (art ? x.line('M182,54 L198,59', 1.6, C.ink5) : '');
        // screw stem + handwheel (sluice identity) near the peak
        o += x.line('M128,40 L130,24', art ? 5 : 2.2 * x.u) + `<ellipse cx="130" cy="22" rx="16" ry="5.5" fill="none" stroke="${C.ink}" stroke-width="${art ? 6 : 2.6 * x.u}"/>` + (art ? `<ellipse cx="130" cy="22" rx="16" ry="5.5" fill="none" stroke="${C.ink5}" stroke-width="2"/>` + x.line('M114,22 L146,22 M130,17 L130,27', 2.2) : '');
        const barn = (bx, by, s) => x.shape(`M${bx - s},${by} L${bx - s * 0.5},${by - s * 1.3} L${bx + s * 0.5},${by - s * 1.3} L${bx + s},${by} Z`, C.ink3, art ? 1.4 : x.u * 0.5) + (art ? K.circ(bx, by - s * 1.2, s * 0.3, C.ink) : '');
        o += barn(160, 42, art ? 5 : 6) + barn(170, 47, art ? 3.6 : 4) + barn(30, 82, art ? 4.4 : 5) + (art ? barn(190, 66, 3.2) + barn(42, 116, 3) : '');
        if (art) o += K.drip(60, 112, 12, 4, x.E.deep) + K.drip(100, 100, 16, 4.6, x.E.deep) + K.drip(150, 76, 10, 3.6, x.E.deep);
        return o;
      },
      head: (x) => { // head + long neck LUNGING from the dark cavity under the gate prow; mossy horn forward; hooked beak
        let o = `<path d="${sm([[128, 84], [160, 76], [166, 92], [140, 102]])}" fill="${C.ink}"/>`; // cavity under the prow
        const neck = sm([[128, 94], [150, 88], [170, 98], [166, 120], [138, 122]]);
        const H = sm([[158, 94], [176, 88], [190, 92], [199, 102], [197, 116], [184, 124], [166, 124], [156, 114]]);
        o += x.shape(neck, C.ink) + x.inClip(neck, `<path d="M126,90 L160,86 L148,100 L130,102 Z" fill="${C.ink5}"/>` + (art ? x.line('M142,98 q4,10 0,20 M150,96 q4,10 0,20 M158,98 q3,8 0,16', 1.6, C.ink5) : ''));
        o += x.shape(H, C.ink) + x.inClip(H, x.keylight(pl([[156, 92], [176, 84], [199, 100], [186, 98], [170, 96], [160, 104]]), 1.5, 2.5, 20) + x.rim([160, 94, 176, 88, 190, 92]));
        const horn = sm([[176, 92], [188, 84], [207, 80, 1], [194, 92], [184, 98]]);
        o += x.shape(horn, C.ink7, art ? x.W * 0.8 : x.u * 0.6) + x.inClip(horn, `<path d="${pl([[174, 88], [190, 80], [206, 79], [188, 88]])}" fill="${C.ink5}"/>` + (art ? `<path d="${sm([[178, 90], [188, 86], [194, 92], [184, 96]])}" fill="${x.E.deep}"/>` : '')) + x.rim([178, 90, 190, 83, 204, 80], art ? 1.8 : null) + (art ? K.drip(186, 94, 9, 3, x.E.deep) : '');
        o += K.eye(x, 176, 104, art ? 8.5 : 9.5) + K.teeth(x, [197, 112], [178, 116], art ? 5 : 2, art ? 3.8 : 4.5) + x.line('M199,108 L180,117 L164,116', art ? 1.8 : 0.8 * x.u, C.ink5);
        o += x.shape(pl([[194, 104], [202, 110, 1], [196, 114]]), C.ink, art ? x.W * 0.5 : x.u * 0.4); // hooked beak tip
        return o;
      },
      legs: { ft: 'web', w: { nf: [34, 22, 17, 19], ff: [28, 18, 14, 15] } },
      anchor: [130, 0]
    });
  };
  A[3] = { head: [130, 0] };

  // ======================= Ch4 · 시침 멧돼지 =======================
  D[4] = (x) => {
    const art = x.art, fr = K.fr(x, 6) || 0, sw = [0, 8, 12, 8, 0, -6][fr];
    return G.rig(x, {
      poly: true, drips: [[138, 130, 13, 4.6], [58, 126, 10, 3.8], [100, 126, 8, 3.2]],
      inner: (x) => (art ? x.line('M60,76 L64,126 M100,58 L102,126 M140,44 L144,128', 1.8, C.ink5) + [[72, 100], [112, 96], [148, 104]].map(([a, b]) => K.circ(a, b, 2.2, C.ink3, `stroke="${C.ink}" stroke-width="1"`)).join('') : ''),
      back: (x) => `<g transform="rotate(${sw} 22 100)">${x.line('M22,100 L14,132', art ? 4.4 : 2 * x.u)}${art ? x.line('M22,100 L14,132', 1.4, x.E.deep) : ''}<circle cx="13" cy="138" r="${art ? 8.5 : 9.5}" fill="${x.E.deep}" stroke="${C.ink}" stroke-width="${art ? 4 : 2 * x.u}" paint-order="stroke"/>${art ? K.circ(13, 138, 3.6, 'none', `stroke="${C.ink}" stroke-width="1.6"`) : ''}${K.drip(13, 146, 8, 3)}</g>`,
      over: (x) => K.gear(x, 56, 74, art ? 14 : 15, 9, null, fr * 10) + K.gear(x, 86, 56, art ? 17 : 18, 10, null, -fr * 9) + K.gear(x, 116, 38, art ? 14 : 15, 8, null, fr * 12),
      head: (x) => {
        const H = pl([[136, 64], [152, 60], [168, 68], [178, 84], [182, 102], [172, 114], [152, 118], [138, 108], [132, 86]]);
        let o = x.shape(pl([[148, 62], [154, 44, 1], [164, 64]]), C.ink7, art ? x.W * 0.7 : x.u * 0.6);
        o += x.shape(H, C.ink) + x.inClip(H, `<path d="${pl([[132, 64], [154, 56], [172, 70], [180, 88], [168, 80], [150, 72], [138, 80]])}" fill="${C.ink5}"/>` + x.rim([140, 64, 154, 60, 168, 68]));
        o += x.shape(pl([[140, 62], [146, 42, 1], [156, 62]]), C.ink) + `<path d="${pl([[143, 58], [146, 48], [151, 60]])}" fill="${C.ink5}"/>`;
        // snout disc (grille) + clock-hand tusks: minute hand long & near-horizontal, hour hand short
        o += `<ellipse cx="180" cy="100" rx="6" ry="11" fill="${C.ink3}" stroke="${C.ink}" stroke-width="${art ? 2.2 : x.u}"/>` + x.line('M178,93 L178,107 M182,93 L182,107', art ? 1.4 : 0.6 * x.u);
        const hand = (d, col) => x.shape(d, col, art ? 2 : x.u * 0.55);
        o += hand(pl([[170, 108], [196, 104], [196, 100], [207, 107], [196, 114], [196, 110], [172, 114]]), C.ink3);
        o += hand(pl([[166, 100], [186, 90], [184, 86], [196, 84], [192, 94], [188, 93], [170, 106]]), C.ink3) + (art ? `<circle cx="190" cy="89" r="2.6" fill="none" stroke="${C.ink}" stroke-width="2.4"/>` : '');
        o += K.eye(x, 158, 84, art ? 10 : 11, { hand: 0 });
        return o;
      },
      legs: { ft: 'hoof', deco: (x, g, near) => (near ? K.gear(x, g.P[1][0], g.P[1][1], art ? 5 : 2.2 * x.u, 7, null, fr * 20) + (art ? K.drip(g.P[1][0] + 1, g.P[1][1] + 4, 9, 3) : '') : '') },
      anchor: [110, 4]
    });
  };
  A[4] = { head: [110, 4] };

  // ======================= Ch5 · 흑요 코뿔소 =======================
  D[5] = (x) => {
    const art = x.art;
    const hole = K.crescent(104, 84, 16, 112, 77, 13);
    const erase = art ? K.nibble([[18, 98], [26, 88], [56, 74], [90, 56], [114, 40]], 22, 4.4, 21) + K.nibble([[30, 123], [46, 127], [70, 127]], 7, 3.2, 4) : '';
    return G.rig(x, {
      poly: true, holes: [hole], erase, drips: [[140, 130, 14, 4.8], [80, 126, 10, 3.8]],
      planes: art ? [pl([[26, 88], [56, 74], [44, 96]]), pl([[90, 56], [124, 36], [112, 64]]), pl([[136, 39], [155, 70], [132, 66]]), pl([[46, 127], [70, 127], [58, 112]]), pl([[14, 96], [22, 80], [120, 30], [124, 36], [60, 70], [26, 90]])].join(' ') : G.PLG,
      inner: (x) => (art ? x.line('M56,74 L44,96 L46,127 M124,36 L112,64 L110,130 M155,70 L132,66 L136,132', 1.2, C.ink3) + K.glint(x, [[118, 40], [132, 38], [122, 44]]) : ''),
      back: (x) => x.shape(pl([[22, 98], [4, 104, 1], [20, 110]]), C.ink, art ? x.W * 0.6 : x.u * 0.5),
      over: (x) => [[[64, 76], [34, 62], [78, 70]], [[92, 60], [62, 42], [106, 54]], [[116, 44], [92, 20], [130, 38]]].map((p) => x.shape(pl(p), C.ink, art ? x.W * 0.7 : x.u * 0.6) + (art ? `<path d="${pl([p[0], p[1], [(p[0][0] + p[2][0]) / 2, (p[0][1] + p[2][1]) / 2 - 2]])}" fill="${C.ink5}"/>` : '')).join(''),
      head: (x) => {
        const H = pl([[134, 70], [150, 62], [166, 70], [178, 86], [184, 102], [174, 114], [154, 118], [138, 108]]);
        let o = x.shape(pl([[150, 66], [158, 50, 1], [164, 70]]), C.ink7, art ? x.W * 0.7 : x.u * 0.6);
        o += x.shape(H, C.ink) + x.inClip(H, `<path d="${pl([[132, 70], [150, 58], [170, 70], [182, 92], [166, 82], [146, 76]])}" fill="${C.ink5}"/>` + x.rim([138, 70, 150, 62, 168, 72]) + (art ? x.line('M150,64 L156,116 M168,72 L164,114', 1.1, C.ink3) : ''));
        // great horn: forward, 20° up; white crescent stroke at the tip; small second horn
        o += x.shape(pl([[168, 84], [206, 70, 1], [180, 100]]), C.ink, x.art ? x.W : x.u * 0.8) + (art ? `<path d="${pl([[170, 86], [202, 72], [184, 90]])}" fill="${C.ink5}"/>` : '');
        o += x.T([190, 70, 200, 66, 207, 72], art ? 5 : 2.4 * x.u, 'mid', C.ink) + x.T([191, 70, 200, 67, 205, 72], art ? 2.4 : 1.1 * x.u, 'mid', C.p100);
        o += x.shape(pl([[160, 78], [176, 64, 1], [170, 84]]), C.ink7, art ? x.W * 0.7 : x.u * 0.6);
        o += art ? K.eye(x, 153, 88.5, 8) + K.eye(x, 170, 85, 5) : K.eye(x, 154, 88, 9.2); // K5-E1: game = one eye; art gap ≥ 4
        o += K.stitch(x, [[160, 108], [170, 106], [180, 104]], 3);
        return o;
      },
      legs: { ft: 'hoof' },
      anchor: [112, 0]
    });
  };
  A[5] = { head: [112, 0] };
})(window.PN);
// ---------------------------------------------------------------------------
// part 30 · SHOOTER ┳ rig (box 200×200, pivot 78,144, feet y186, u=3.5)
// Thin vertical body 3.5–4 heads + horizontal barrel at SHOULDER height (y≈86) ≥ 2× body width,
// clear two-hand grip (rear hand at the stock, front hand under the barrel), braced stance
// (front knee forward, rear leg back), slight recoil lean. muzzle anchor → API windup ring.
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const E = PN.enemies, K = E._K, C = K.C, f = K.f, sm = K.sm, pl = K.pl;
  const H = (K.SHT = {});
  H.GY = 186; H.HIP = [78, 138];
  H.pose = (x) => {
    const fr = K.fr(x, 2), key = fr == null, wind = x.o.state === 'windup';
    const P = { key, fr, wind, lean: key ? -1.5 : -1, swell: wind ? 1.03 : 1, step: key ? 0 : (fr ? 1 : -1) };
    if (wind) P.lean = -3; // recoil brace; barrel stays within 3° of the +x aim axis
    P.m = K.pose({ rot: P.lean, rc: [H.HIP[0], H.GY], sx: P.swell, sy: P.swell, sc: [78, 144] });
    return P;
  };
  // legs: front (near) knee forward, rear (far) leg braced back. hips follow the body matrix.
  H.legs = (x, P, o = {}) => {
    const W = o.w || [16, 11, 8, 8], ft = o.ft || 'boot', s = P.step * 6;
    const one = (hip, ank, tx, near) => {
      const w = x.art ? W : W.map((v) => v * 0.85), h = K.mx(P.m, hip), t = K.onGround(tx + (near ? s : -s), H.GY - (near ? 0 : 3), w[3], ft);
      const a = [ank[0] + (near ? s : -s), ank[1]];
      const g = K.legGeo({ h, a, t, L: o.L || [26, 24], b: o.b || -1, w, ft });
      return x.shape(g.d, near ? C.ink : C.ink7, x.art ? x.W * 0.72 : x.u * 0.7) + (near ? x.inClip(g.d, x.T([g.P[0][0] - w[0] * 0.3, g.P[0][1], (g.P[0][0] + g.P[1][0]) / 2 - w[0] * 0.3, (g.P[0][1] + g.P[1][1]) / 2, g.P[1][0] - w[1] * 0.3, g.P[1][1] + 4], w[0] * 0.4, 'end', C.ink5)) : '');
    };
    return { back: one(o.fh || [70, 136], o.fa || [56, 172], o.ft0 || 54, false), front: one(o.nh || [86, 136], o.na || [98, 172], o.nt || 104, true) };
  };
  // two-segment sleeve arm shoulder → elbow → hand (tapered, with a gripping fist)
  H.arm = (x, sh, el, hd, w0, near, fist = true) => {
    const d = K.limbD([sh, el, hd], [w0, w0 * 0.78, w0 * 0.62], 'none');
    let o = x.shape(d, near ? C.ink : C.ink7, x.art ? x.W * 0.72 : x.u * 0.7);
    if (near) o += x.inClip(d, x.T([sh[0] - 2, sh[1] - w0 * 0.3, (sh[0] + el[0]) / 2, (sh[1] + el[1]) / 2 - w0 * 0.4, el[0] + 2, el[1] - w0 * 0.3], w0 * 0.34, 'end', C.ink5));
    if (fist) o += x.shape(sm([[hd[0] - 5, hd[1] - 5], [hd[0] + 4, hd[1] - 7], [hd[0] + 7, hd[1] + 1], [hd[0] + 2, hd[1] + 6], [hd[0] - 5, hd[1] + 4]]), C.ink, x.art ? x.W * 0.6 : x.u * 0.5) + (x.art && near ? x.line(`M${hd[0] - 2},${hd[1] - 5} L${hd[0] - 1},${hd[1] + 4} M${hd[0] + 2},${hd[1] - 5} L${hd[0] + 3},${hd[1] + 3}`, 1.2, C.ink5) : '');
    return o;
  };
  /** H.rig(x, sp): sp = { legs:{…}|false, back(x,P), body(x,P), barrel(x,P), head(x,P), front(x,P), drips, muzzle, anchor } — all body-local */
  H.rig = (x, sp) => {
    const P = H.pose(x), bm = K.mstr(P.m);
    const L = sp.legs === false ? { back: '', front: '' } : H.legs(x, P, sp.legs || {});
    let g = L.back + `<g transform="${bm}">${sp.back ? sp.back(x, P) : ''}${K.drips(x, sp.drips || [], 2)}${sp.body(x, P)}</g>` + L.front;
    g += `<g transform="${bm}">${sp.barrel(x, P)}${sp.head(x, P)}${sp.front ? sp.front(x, P) : ''}</g>`;
    const mz = K.mx(P.m, sp.muzzle);
    return { g, head: sp.anchor || [78, 4], muzzle: [f(mz[0]), f(mz[1])], posed: true };
  };

  // ======================= Ch1 · 붓대 포수 =======================
  K.DRAW.shooter[1] = (x) => {
    const art = x.art;
    return H.rig(x, {
      muzzle: [198, 84], drips: [[100, 150, 12, 4.4], [64, 154, 14, 4.6], [84, 156, 9, 3.6]],
      back: (x) => H.arm(x, [68, 76], [60, 98], [76, 98], 13, false),
      body: (x) => { // ragged ink robe + sash; weight on the back foot
        const robe = sm([[62, 70], [94, 70], [98, 100], [104, 136], [112, 156, 1], [101, 150, 1], [96, 160, 1], [86, 151, 1], [76, 162, 1], [66, 151, 1], [56, 158, 1], [48, 150, 1], [52, 124], [56, 96]]);
        return x.shape(robe, C.ink) + x.inClip(robe, x.keylight(pl([[50, 70], [82, 68], [72, 90], [64, 120], [52, 146]]), 2, 3, 20) + x.rim([62, 72, 78, 69, 94, 72]) +
          `<path d="M50,106 L104,103 L106,113 L50,116 Z" fill="${C.ink7}"/>` + (art ? x.T([88, 116, 94, 132, 100, 150], 2.6, 'mid', C.ink5) + `<path d="M94,112 L104,134 L96,132 L92,116 Z" fill="${C.ink7}"/>` : ''));
      },
      barrel: (x) => { // bamboo brush-tube on the shoulder, brush-tip muzzle
        const tube = pl([[34, 78], [172, 79], [172, 91], [34, 90]]);
        let o = x.shape(tube, x.E.deep, x.W) + x.inClip(tube, (art ? `<rect x="20" y="85" width="160" height="10" fill="${x.dot(40)}"/>` : `<rect x="20" y="86" width="160" height="6" fill="${C.ink7}"/>`) +
          [60, 98, 136].map((nx) => `<path d="M${nx - 2.2},76 L${nx + 2.2},76 L${nx + 2.2},94 L${nx - 2.2},94 Z" fill="${C.ink}"/>`).join('') + (art ? x.line('M36,81 L170,82', 1.3, C.ink1, 'opacity="0.8"') : ''));
        o += x.shape('M164,76 L174,76 L174,94 L164,94 Z', C.ink5, art ? x.W * 0.6 : x.u * 0.5);
        o += x.shape(sm([[172, 77], [184, 76], [194, 80], [200, 84, 1], [194, 88], [184, 92], [172, 92]]), C.ink) + (art ? x.line('M176,81 Q188,81 197,84 M176,88 Q188,88 197,85', 1.2, C.ink5) : '');
        return o;
      },
      head: (x) => { // torn paper lantern: bamboo ribs, torn gaps, ONE brush-stroke mask eye, torn mouth
        const lan = sm([[78, 18], [95, 25], [103, 44], [97, 63], [78, 71], [59, 63], [53, 44], [60, 25]]);
        const gaps = [pl([[86, 27], [97, 31, 1], [95, 36, 1], [98, 41, 1], [90, 42, 1], [88, 36, 1]]), pl([[57, 50], [66, 48, 1], [64, 53, 1], [68, 58, 1], [58, 60, 1]])];
        const panel = art ? C.p300 : C.ink3;
        let o = x.shape(lan, panel, x.W) + x.inClip(lan, (art ? `<rect x="40" y="10" width="80" height="70" fill="${x.dot(20)}"/>` : '') +
          `<path d="M84,10 C100,24 102,54 86,78 L124,78 L124,10 Z" fill="${C.ink}"/>` + // black spot: shadow third
          gaps.map((d) => `<path d="${d}" fill="${C.ink}"/>`).join('') + (art ? `<path d="M86,27 L80,33 L88,36 Z M57,50 L52,56 L60,55 Z" fill="${C.p300}" stroke="${C.ink}" stroke-width="1"/>` : '') +
          x.line('M53,33 Q78,28 103,33 M51,45 Q78,40 105,45 M53,57 Q78,53 103,57', art ? 2.4 : 1.1 * x.u) + x.line('M66,20 Q60,44 66,68 M90,20 Q96,44 90,68', art ? 1.6 : 0.7 * x.u));
        o += x.shape('M66,15 L90,15 L88,22 L68,22 Z M68,66 L88,66 L86,74 L70,74 Z', C.ink, art ? x.W * 0.5 : x.u * 0.5) + x.line('M78,15 L78,5', art ? 3 : 1.4 * x.u);
        // single brush-stroke mask eye (ink stroke with the paper slit as the brightest point)
        o += x.T([56, 44, 70, 32, 94, 40], art ? 13 : 13, 'mid', C.ink) + K.eye(x, 73, 40, art ? 8 : 9.5, { a: -8 });
        // torn mouth slit with paper teeth
        o += `<path d="M64,56 L70,53 L74,58 L79,53 L84,58 L89,54 L92,58 L88,62 L68,62 Z" fill="${C.ink}"/>` + K.teeth(x, [66, 57], [90, 57], art ? 4 : 2, art ? 3 : 3.5);
        return o;
      },
      front: (x) => H.arm(x, [88, 74], [100, 102], [122, 94], 15, true) + x.shape(sm([[118, 86], [128, 84], [130, 92], [120, 96]]), C.ink, art ? x.W * 0.5 : x.u * 0.4),
      anchor: [78, 0]
    });
  };
  K.ANCH.shooter[1] = { head: [78, 0], muzzle: [198, 84] };
})(window.PN);
// ---------------------------------------------------------------------------
// part 31 · SHOOTER ┳ Ch2 성가대 촛대 · Ch3 잿빛 백로 포수 · Ch4 진자 박격수 · Ch5 반영 눈알 포대
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const E = PN.enemies, K = E._K, C = K.C, f = K.f, sm = K.sm, pl = K.pl, H = K.SHT;
  const D = K.DRAW.shooter, A = K.ANCH.shooter;

  // ======================= Ch2 · 성가대 촛대 =======================
  D[2] = (x) => {
    const art = x.art;
    return H.rig(x, {
      muzzle: [200, 86], legs: false, drips: [[110, 175, 9, 3.6], [48, 175, 9, 3.8]],
      back: (x) => H.arm(x, [66, 74], [58, 100], [74, 100], 14, false),
      body: (x, P) => {
        const s = P.step * 4, boots = x.shape(`M${54 - s},178 L${72 - s},178 L${74 - s},186 L${50 - s},186 Z M${82 + s},178 L${98 + s},178 L${106 + s},186 L${82 + s},186 Z`, C.ink, art ? x.W * 0.5 : x.u * 0.5);
        const robe = sm([[60, 66], [96, 66], [100, 100], [106, 146], [112, 180, 1], [80, 176], [46, 180, 1], [52, 146], [56, 100]]);
        let o = boots + x.shape(robe, C.ink) + x.inClip(robe, x.keylight(pl([[54, 66], [80, 66], [68, 110], [60, 180], [40, 180]]), 2, 3, 20) + x.rim([62, 68, 78, 65, 92, 68]) +
          x.line('M74,104 L70,176 M90,104 L96,150 L92,176', art ? 1.8 : 0.8 * x.u, C.ink5) + `<path d="M96,146 L110,156 L102,160 Z" fill="${C.ink5}"/>`); // pleats + pleat break at the knee
        const surp = sm([[58, 70], [98, 70], [104, 104], [110, 132, 1], [98, 126], [88, 138, 1], [78, 128], [68, 138, 1], [58, 126], [48, 132, 1], [54, 104]]);
        o += x.shape(surp, C.ink7, art ? x.W * 0.8 : x.u * 0.6) + x.inClip(surp, `<path d="${pl([[52, 70], [76, 70], [64, 104], [50, 132]])}" fill="${C.ink5}"/>` + (art ? x.line('M70,84 Q66,108 64,130 M86,84 Q90,108 92,130', 1.3) : ''));
        o += x.shape(pl([[56, 64], [100, 64], [96, 76], [60, 76]]), C.ink, art ? x.W * 0.6 : x.u * 0.5) + x.line('M58,106 L102,104', art ? 3 : 1.2 * x.u, C.ink); // collar + cord belt
        return o;
      },
      barrel: (x) => { // long iron trumpet, riveted bands, flared bell = muzzle
        const pipe = pl([[36, 81], [176, 79], [176, 92], [36, 93]]);
        let o = x.shape(pipe, C.ink5, x.W) + x.inClip(pipe, `<rect x="30" y="88" width="150" height="8" fill="${C.ink}"/>` + x.rim([40, 82, 110, 80, 174, 80], art ? 1.6 : null));
        o += [70, 126, 162].map((bx) => x.shape(`M${bx - 3},77 L${bx + 3},77 L${bx + 3},95 L${bx - 3},96 Z`, C.ink, art ? 1.4 : x.u * 0.4)).join('');
        o += x.shape(sm([[174, 79], [186, 72], [200, 64, 1], [203, 86, 1], [200, 108, 1], [186, 100], [174, 93]]), C.ink) + (art ? `<path d="${sm([[184, 76], [198, 68, 1], [194, 86]])}" fill="${C.ink5}"/>` : '');
        return o;
      },
      head: (x) => { // cowl + iron mask: brow ridge, gaunt cheek plane, keyhole eyes, stitched mouth; unlit 3-branch candelabrum
        let o = x.shape(sm([[58, 44], [66, 26], [80, 20], [94, 26], [100, 46], [98, 66], [58, 66]]), C.ink7, art ? x.W * 0.8 : x.u * 0.6);
        const br = 'M78,26 L78,14 M78,18 Q62,18 60,6 M78,18 Q94,18 96,6';
        o += x.line(br, art ? 3.4 : 1.6 * x.u) + (art ? x.line(br, 1.2, C.ink5) : '');
        o += [[60, 6], [78, 10], [96, 6]].map(([cx, cy]) => `<ellipse cx="${cx}" cy="${cy}" rx="6.5" ry="2.3" fill="${C.ink5}" stroke="${C.ink}" stroke-width="${art ? 1.8 : 0.9 * x.u}" paint-order="stroke"/>` +
          x.shape(`M${cx - 3},${cy - 1} L${cx - 3},${cy - 12} L${cx + 3},${cy - 13} L${cx + 3},${cy - 1} Z`, art ? C.p300 : C.ink3, art ? 1.4 : x.u * 0.45) + x.line(`M${cx},${cy - 13} l1,-4`, art ? 1.4 : 0.6 * x.u) + (art ? K.drip(cx + 1.5, cy - 4, 6, 2, C.p300) : '')).join('');
        const mask = sm([[64, 32], [80, 27], [94, 32], [96, 48], [90, 62], [80, 68], [68, 62], [62, 48]]);
        o += x.shape(mask, C.ink5, x.W) + x.inClip(mask, `<path d="M86,24 C98,36 98,58 84,72 L102,72 L102,24 Z" fill="${C.ink}"/>` + // shadow half
          `<path d="M58,36 L100,34 L98,43 L80,41 L60,44 Z" fill="${C.ink}"/>` + `<path d="M58,33 L100,31 L100,35 L58,37 Z" fill="${C.ink3}"/>` + // brow ridge + lit top
          `<path d="${pl([[64, 50], [74, 54], [70, 62], [64, 58]])}" fill="${C.ink}"/><path d="${pl([[64, 48], [76, 52], [74, 54], [64, 51]])}" fill="${C.ink3}"/>`); // gaunt cheek hollow + cheekbone
        o += K.eye(x, 72, 43, art ? 7 : 7.8) + K.eye(x, 87, 44, art ? 5.6 : 6.2);
        o += K.stitch(x, [[70, 60], [79, 61], [88, 59]], 3);
        return o;
      },
      front: (x) => { // near arm: the bell sleeve drapes OVER the horn, fist grips from above
        let o = H.arm(x, [90, 70], [102, 88], [124, 84], 15, true);
        o += x.shape(sm([[104, 80], [128, 76], [136, 96], [124, 104, 1], [116, 96], [108, 102, 1], [100, 94]]), C.ink, art ? x.W * 0.7 : x.u * 0.6) + x.inClip(sm([[104, 80], [128, 76], [136, 96], [124, 104], [100, 94]]), `<path d="M102,78 L128,74 L120,84 L104,88 Z" fill="${C.ink5}"/>`);
        return o;
      },
      anchor: [78, -10]
    });
  };
  A[2] = { head: [78, -10], muzzle: [200, 86] };

  // ======================= Ch3 · 잿빛 백로 포수 =======================
  D[3] = (x) => {
    const art = x.art;
    return H.rig(x, {
      muzzle: [198, 70], drips: [[42, 152, 14, 4.4], [60, 138, 12, 4], [80, 132, 9, 3.4], [100, 118, 8, 3]],
      legs: { w: [9, 6, 4.5, 4.5], ft: 'spade', b: 1, L: [28, 26], fh: [72, 126], fa: [62, 166], ft0: 60, nh: [86, 126], na: [96, 166], nt: 100 },
      back: (x) => x.shape(sm([[62, 90], [44, 110], [30, 146, 1], [50, 128], [64, 110]]), C.ink7, art ? x.W * 0.7 : x.u * 0.6), // far wing
      body: (x) => {
        const bd = sm([[70, 64], [94, 70], [104, 92], [98, 116], [84, 128], [62, 134, 1], [38, 152, 1], [46, 132], [52, 108], [56, 84]]);
        const wing = sm([[60, 78], [90, 82], [98, 104], [86, 126], [58, 142, 1], [34, 162, 1], [48, 136], [52, 106]]);
        let o = x.shape(bd, C.ink) + x.inClip(bd, x.keylight(pl([[50, 62], [84, 62], [66, 92], [50, 122]]), 2, 3, 20) + x.rim([62, 70, 78, 64, 96, 72]));
        o += x.shape(wing, C.ink7, art ? x.W * 0.8 : x.u * 0.6) + x.inClip(wing, `<path d="${pl([[56, 78], [84, 80], [66, 96], [54, 112]])}" fill="${C.ink5}"/>` +
          (art ? x.line('M60,100 Q74,110 70,132 M72,94 Q86,106 82,124 M52,114 Q58,128 48,146', 1.5) : ''));
        o += x.line('M84,72 C98,62 90,58 96,50', art ? 13 : 5 * x.u) + x.line('M84,72 C98,62 90,58 96,50', art ? 3 : 1.2 * x.u, C.ink5, 'transform="translate(-3,0)"'); // S-neck
        return o;
      },
      barrel: (x) => { // tube-beak = barrel (bore at the tip)
        const beak = pl([[106, 58], [194, 64], [196, 74], [106, 72]]);
        return x.shape(beak, C.ink, x.W) + x.inClip(beak, x.line('M108,61 L192,66', art ? 2 : 0.8 * x.u, C.ink5)) + x.line('M140,68 L150,68 M170,69 L178,69', art ? 1.4 : 0, C.ink5) +
          `<ellipse cx="195.5" cy="69" rx="${art ? 2.8 : 3.2}" ry="${art ? 5 : 5.4}" fill="${C.ink5}" stroke="${C.ink}" stroke-width="${art ? 1.6 : 0.8 * x.u}"/>`;
      },
      head: (x) => {
        const hd = sm([[86, 52], [98, 42], [112, 48], [114, 62], [102, 70], [90, 66]]);
        let o = x.T([90, 46, 66, 36, 46, 42], art ? 5.5 : 2.2 * x.u, 'start') + x.T([90, 50, 68, 48, 52, 56], art ? 4 : 1.6 * x.u, 'start');
        o += x.shape(hd, C.ink) + x.inClip(hd, `<path d="${pl([[82, 40], [106, 40], [100, 52], [86, 56]])}" fill="${C.ink5}"/>`) + K.eye(x, 100, 55, art ? 7.5 : 8.5);
        return o;
      },
      front: (x) => { // wing-tip "hands": primaries curl round the beak-barrel (two-hand grip)
        const grip = (x0, y0, x1, y1, col) => x.shape(sm([[x0, y0], [x1 - 6, y1 + 10], [x1 + 4, y1 + 4], [x1 + 6, y1 - 6, 1], [x1, y1 - 2], [x1 - 10, y1 + 2], [x0 - 6, y0 - 4]]), col, art ? x.W * 0.6 : x.u * 0.5);
        return grip(90, 100, 116, 76, C.ink7) + grip(96, 112, 134, 78, C.ink) + (art ? x.line('M112,90 Q124,84 132,76 M106,98 Q120,90 128,82', 1.2, C.ink5) : '');
      },
      anchor: [96, 26]
    });
  };
  A[3] = { head: [96, 26], muzzle: [198, 70] };

  // ======================= Ch4 · 진자 박격수 =======================
  D[4] = (x) => {
    const art = x.art;
    return H.rig(x, {
      muzzle: [196, 80], legs: false, drips: [[58, 128, 10, 3.6], [102, 126, 10, 3.6], [96, 88, 8, 3]],
      body: (x, P) => {
        const sw = P.wind ? -14 : [0, 5][P.fr || 0], s = P.step * 3;
        const hand = (x0, y0, kx, ky, x1, y1, col) => { const d = `M${x0},${y0} L${kx},${ky} L${x1},${y1}`; return x.line(d, art ? 7 : 2.6 * x.u, C.ink) + (art ? x.line(d, 2, col) : '') + x.shape(pl([[x1 - 8, y1 + 2], [x1, y1 - 10], [x1 + 8, y1 + 2]]), C.ink, art ? x.W * 0.5 : x.u * 0.5) + K.gear(x, kx, ky, art ? 6 : 2.6 * x.u, 7, null, 12); };
        let o = hand(70, 76, 56 - s, 130, 48 - s, 184, C.ink5) + hand(86, 76, 104 + s, 128, 110 + s, 184, C.ink5);
        o += `<g transform="rotate(${sw} 78 80)">${x.line('M78,80 L78,112', art ? 7 : 2.6 * x.u)}${art ? x.line('M78,80 L78,112', 2, x.E.deep) : ''}` +
          `<circle cx="78" cy="132" r="24" fill="${C.ink}" stroke="${C.ink}" stroke-width="${f(x.W * (x.art ? 2 : 1.25))}"/><circle cx="78" cy="132" r="17" fill="${x.E.deep}" stroke="${C.ink}" stroke-width="${art ? 2.4 : 1.1 * x.u}"/>` +
          (art ? `<circle cx="78" cy="132" r="17" fill="${x.dot(40)}"/>` : '') + `<path d="M62,120 A22,22 0 0 1 86,110" fill="none" stroke="${C.ink5}" stroke-width="${art ? 3 : 1.4 * x.u}"/>` +
          `<path d="M66,134 L72,130 L76,136 L81,130 L86,136 L90,132 L88,142 L68,142 Z" fill="${C.ink}"/>` + K.teeth(x, [68, 135], [89, 135], art ? 4 : 2, art ? 3 : 3.5) + K.drip(76, 155, 12, 4.4) + '</g>'; // bob belly-grin
        const yoke = pl([[52, 64], [104, 64], [98, 80], [58, 80]]);
        o += x.shape(yoke, C.ink) + x.inClip(yoke, `<path d="M50,62 L106,62 L106,68 L50,68 Z" fill="${C.ink5}"/>`) + (art ? [[60, 72], [96, 72]].map(([a, b]) => K.circ(a, b, 2, C.ink3, `stroke="${C.ink}" stroke-width="1"`)).join('') : '');
        return o;
      },
      barrel: (x) => {
        const tube = pl([[36, 74], [166, 69], [168, 89], [36, 90]]);
        return x.shape(tube, C.ink7, x.W) + x.inClip(tube, `<rect x="30" y="82" width="150" height="10" fill="${C.ink}"/>` + x.rim([40, 75, 100, 72, 164, 70], art ? 1.8 : null)) +
          K.gear(x, 118, 80, art ? 13 : 14, 9, null, 10) + K.gear(x, 150, 79, art ? 11 : 12, 8, null, -6) +
          x.shape(pl([[164, 64], [186, 60], [196, 64], [196, 96], [186, 98], [164, 94]]), C.ink) + (art ? `<path d="${pl([[168, 66], [186, 62], [184, 72], [168, 74]])}" fill="${C.ink5}"/>` : '');
      },
      head: (x) => { // dial head: dial eye + clock-hand brows (angry), grille mouth
        let o = `<circle cx="78" cy="40" r="22" fill="${C.ink}" stroke="${C.ink}" stroke-width="${f(x.W * (x.art ? 2 : 1.25))}"/>` + (art ? `<circle cx="78" cy="40" r="22" fill="${C.ink5}"/><circle cx="81" cy="43" r="21" fill="${C.ink}"/>` : '');
        o += K.eye(x, 80, 40, art ? 14 : 15, { hand: -28 });
        o += x.shape(pl([[62, 22], [80, 28], [79, 32], [61, 26]]), C.ink3, art ? 1.4 : x.u * 0.5) + x.shape(pl([[98, 20], [82, 28], [83, 32], [99, 25]]), C.ink3, art ? 1.4 : x.u * 0.5);
        o += x.shape(pl([[70, 18], [78, 6], [86, 18]]), C.ink, art ? x.W * 0.6 : x.u * 0.5) + x.line('M78,6 L78,0', art ? 3 : 1.2 * x.u);
        return o;
      },
      front: (x) => x.line('M62,76 L56,96 L72,94', art ? 6.5 : 2.4 * x.u, C.ink7) + x.line('M96,74 L110,98 L128,92', art ? 7 : 2.6 * x.u, C.ink) + // K5-D: no duplicate cap/join attrs
        x.shape(pl([[124, 86], [134, 84], [134, 96], [124, 98]]), C.ink, art ? x.W * 0.5 : x.u * 0.4) + K.gear(x, 110, 98, art ? 5 : 2.2 * x.u, 7, null, 0),
      anchor: [78, -4]
    });
  };
  A[4] = { head: [78, -4], muzzle: [196, 80] };

  // ======================= Ch5 · 반영 눈알 포대 =======================
  D[5] = (x) => {
    const art = x.art;
    const shard = (pts, col) => x.shape(pl(pts), col, art ? x.W * 0.7 : x.u * 0.6);
    return H.rig(x, {
      muzzle: [198, 66], legs: false, drips: [[70, 100, 12, 4.4], [92, 98, 9, 3.6]],
      body: (x, P) => {
        const s = P.step * 3;
        let o = shard([[72, 112], [82, 112], [52 + s, 183], [40 + s, 183]], C.ink7) + shard([[74, 114], [84, 116], [120 - s, 183], [108 - s, 183]], C.ink7) +
          shard([[72, 110], [86, 110], [86, 185], [74, 185]], C.ink) + x.shape(pl([[60, 100], [96, 100], [90, 120], [66, 120]]), C.ink) + (art ? `<path d="${pl([[62, 102], [80, 102], [72, 118]])}" fill="${C.ink5}"/>` : '');
        const hole = K.crescent(56, 62, 16, 50, 56, 12.5);
        const erase = art ? K.nibble([[40, 74], [42, 50], [56, 34], [76, 28]], 16, 4, 31) : '';
        const facet = `<path d="${pl([[46, 46], [70, 30], [66, 54]])}" fill="${C.ink5}"/><path d="${pl([[52, 86], [74, 98], [60, 94]])}" fill="${C.ink5}"/>` + x.rim([46, 48, 60, 32, 84, 28]);
        o += K.holed(x, [hole], `<circle cx="76" cy="64" r="36" fill="${C.ink}" stroke="${C.ink}" stroke-width="${f(x.W * (art ? 2 : 1.25))}"/>` + x.inClip('M40,64 a36,36 0 1,0 72,0 a36,36 0 1,0 -72,0 Z', facet), erase);
        return o;
      },
      barrel: (x) => {
        const tube = pl([[104, 57], [180, 57], [180, 73], [104, 73]]);
        return x.shape(tube, C.ink, x.W) + x.inClip(tube, x.rim([108, 58, 140, 57.4, 178, 58], art ? 1.8 : null)) + [132, 158].map((bx) => shard([[bx - 4, 53], [bx + 4, 53], [bx + 6, 77], [bx - 6, 77]], C.ink7)).join('') +
          x.shape(pl([[178, 53], [194, 55], [199, 59], [199, 73], [194, 77], [178, 79]]), C.ink) + `<ellipse cx="197" cy="66" rx="${art ? 3.4 : 3.6}" ry="${art ? 7 : 7.4}" fill="${C.p50}" stroke="${C.ink}" stroke-width="${art ? 1.6 : 0.9 * x.u}"/><ellipse cx="198" cy="66" rx="1.8" ry="4.4" fill="${C.ink}"/>`;
      },
      head: (x) => { // the iris faces the aim: white ring round the black pupil (pupil bore → shroud)
        x.eyes.push([100, 64, 14]);
        return `<ellipse cx="100" cy="64" rx="15" ry="25" fill="${C.p50}" stroke="${C.ink}" stroke-width="${art ? 2.8 : 1.4 * x.u}" paint-order="stroke"/><ellipse cx="104" cy="64" rx="9.6" ry="17" fill="${C.ink}"/>` + K.circ(97, 47, art ? 2.8 : 1.5 * x.u, C.p50);
      },
      front: (x) => shard([[64, 108], [74, 104], [98, 86], [106, 76], [110, 82], [102, 94], [74, 114]], C.ink7) + shard([[80, 110], [90, 104], [118, 88], [126, 76], [132, 82], [122, 96], [90, 116]], C.ink),
      anchor: [76, 16]
    });
  };
  A[5] = { head: [76, 16], muzzle: [198, 66] };
})(window.PN);
// ---------------------------------------------------------------------------
// part 40 · WARDEN ■ rig (box 220×220, pivot 110,136, feet y206, u=2.5)
// Widest square, FLAT top, shield/door = 40% of the front plane (right), small head sunk
// below the shoulder line just left of the shield edge. Wide braced stance: rear leg
// driven back, weight leaning into the shield. Walk 4f stomp (f1 near / f3 far foot up).
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const E = PN.enemies, K = E._K, C = K.C, f = K.f, sm = K.sm, pl = K.pl;
  const R = (K.WRD = {});
  R.GY = 206;
  R.pose = (x, sp = {}) => {
    const fr = K.fr(x, 4), key = fr == null, wind = x.o.state === 'windup';
    const P = { key, fr, wind, lean: 3, lift: [0, 0], ty: 0, sy: 1 };
    if (!key) { P.lift = [[0, 0], [12, 0], [0, 0], [0, 12]][fr]; P.ty = [2, -3, 2, -3][fr]; P.sy = [0.97, 1, 0.97, 1][fr]; P.lean = [3, 4, 3, 2][fr]; }
    if (wind) { P.lean = -3; P.sy = 1.05; P.ty = -4; P.lift = [0, 16]; }
    if (sp.noLean) P.lean = 0; // splayed-leg rigs (crab) keep every tip on the ground line
    P.m = K.pose({ rot: P.lean, rc: [110, R.GY], sx: 1, sy: P.sy, sc: [110, R.GY], ty: P.ty });
    return P;
  };
  R.legs = (x, P, o = {}) => {
    const W = o.w || [38, 28, 22, 22], ft = o.ft || 'boot';
    const one = (hip, ank, tx, lift, near) => {
      const gy = o.gy || R.GY, w = x.art ? W : W.map((v) => v * 0.9), h = K.mx(P.m, hip), t = K.onGround(tx, gy - lift, w[3], ft), a = [ank[0], ank[1] - lift - (R.GY - gy)];
      const g = K.legGeo({ h, a, t, L: o.L || [22, 20], b: -1, w, ft });
      return x.shape(g.d, near ? C.ink : C.ink7, x.art ? x.W * 0.9 : x.u * 0.8) + (near ? x.inClip(g.d, x.T([g.P[0][0] - w[0] * 0.3, g.P[0][1], (g.P[0][0] + g.P[1][0]) / 2 - w[0] * 0.4, (g.P[0][1] + g.P[1][1]) / 2, g.P[1][0] - w[1] * 0.35, g.P[1][1] + 4], w[0] * 0.36, 'end', C.ink5)) + (x.art ? x.line(`M${f(t[0] - w[3] * 0.6)},${f(t[1] + w[3] * 0.5)} L${f(t[0] + w[3] * 1.3)},${f(t[1] + w[3] * 0.5)}`, 1.8, C.ink5) : '') : '');
    };
    return { rear: one(o.rh || [62, 166], o.ra || [40, 194], o.rt || 34, P.lift[1], true), front: one(o.fh || [116, 168], o.fa || [132, 194], o.ft0 || 142, P.lift[0], false) };
  };
  // carved eye recess under the shoulder line: ink.500 brow plane over an ink.900 socket
  R.recess = (x, cx, cy, w, h) => x.shape(sm([[cx - w / 2, cy - h * 0.2], [cx - w * 0.3, cy - h / 2], [cx + w * 0.3, cy - h / 2], [cx + w / 2, cy - h * 0.1], [cx + w * 0.38, cy + h / 2], [cx - w * 0.36, cy + h / 2]]), C.ink, x.art ? x.W * 0.7 : x.u * 0.6) +
    `<path d="${pl([[cx - w / 2 - 2, cy - h * 0.34], [cx - w * 0.3, cy - h / 2 - 4], [cx + w * 0.34, cy - h / 2 - 4], [cx + w / 2 + 2, cy - h * 0.26], [cx + w * 0.3, cy - h * 0.34], [cx - w * 0.32, cy - h * 0.3]])}" fill="${C.ink5}"/>`;
  /** R.rig(x, sp): sp = { legs, back(x,P) arm, body(x,P) (mass + overlays), head(x,P), shield(x,P), front(x,P) fist, drips, anchor } */
  R.rig = (x, sp) => {
    const P = R.pose(x, sp), bm = K.mstr(P.m), L = sp.legs === false ? { rear: '', front: '' } : R.legs(x, P, sp.legs || {});
    let g = (sp.ground ? sp.ground(x, P) : '') + `<g transform="${bm}">${sp.back ? sp.back(x, P) : ''}</g>` + L.front;
    g += `<g transform="${bm}">${K.drips(x, sp.drips || [], 2)}${sp.body(x, P)}${sp.head(x, P)}</g>` + L.rear;
    g += `<g transform="${bm}">${sp.shield(x, P)}${sp.front ? sp.front(x, P) : ''}</g>`;
    if (P.wind && !x.o.silhouette) g += K.arc(x, 96, 40, 70, 22, 200, 340, 2);
    return { g, head: sp.anchor || [100, 4], front: [140, 206], posed: true };
  };
  R.rivets = (x, pts, r = 2.4) => x.art ? pts.map(([a, b]) => K.circ(a, b, r, C.ink3, `stroke="${C.ink}" stroke-width="1.1"`)).join('') : '';
  R.mass = (x, d, hl, rim, extra = '') => x.shape(d, C.ink, x.W * 1.05) + x.inClip(d, x.keylight(hl, 4, 6, 20) + extra + x.rim(rim));

  // ======================= Ch1 · 회벽 수문장 =======================
  K.DRAW.warden[1] = (x) => {
    const art = x.art;
    return R.rig(x, {
      drips: [[64, 178, 14, 5], [100, 182, 12, 4.6], [36, 160, 10, 4]],
      back: (x) => x.shape(sm([[40, 66], [22, 96], [16, 132], [24, 152], [42, 148], [42, 118], [50, 90]]), C.ink7) + x.shape(sm([[12, 142], [22, 132], [40, 136], [44, 154], [32, 164], [14, 158]]), C.ink7, x.W * 0.8),
      body: (x) => {
        const T = sm([[28, 70], [32, 30, 1], [60, 20], [140, 18], [160, 26, 1], [168, 68], [168, 140], [156, 174], [112, 184], [62, 182], [34, 166], [26, 112]]);
        const hl = pl([[20, 84], [30, 26], [150, 14], [158, 30], [120, 34], [84, 34], [56, 44], [44, 70], [36, 110], [30, 150]]);
        const plaster = pl([[40, 64], [56, 46], [80, 42], [88, 58], [76, 72], [82, 92], [60, 104], [46, 96]]);
        const pch = `<path d="${plaster}" fill="${C.ink3}"/>` + (art ? `<path d="${plaster}" fill="${x.dot(20)}"/>` + x.line('M60,48 L66,64 L58,78 L68,92 M78,46 L72,58', 1.8) : x.line('M62,52 L64,68 L58,82', 0.8 * x.u));
        const rebar = (d) => x.line(d, art ? 7 : 3 * x.u) + (art ? x.line(d, 2.2, C.ink3) : '');
        let o = rebar('M58,28 L44,6 L34,4') + rebar('M100,22 L102,0') + rebar('M138,24 L152,4 L162,6');
        o += R.mass(x, T, hl, [40, 30, 100, 18, 158, 28], pch + (art ? x.T([40, 150, 90, 176, 150, 170], 3.4, 'mid', C.ink5) + x.line('M110,120 L118,136 L112,150', 1.8, C.ink5) : ''));
        return o;
      },
      head: (x) => { // head buried under the shoulder line: carved recess, two asymmetric white slits (brightest point)
        let o = R.recess(x, 100, 48, 44, 22);
        o += K.eye(x, 92, 50, art ? 8 : 9.5, { a: 6 }) + K.eye(x, 110, 50.5, art ? 5.6 : 6.8, { a: -8 });
        o += K.stitch(x, [[90, 62], [100, 64], [110, 62]], 3);
        return o;
      },
      shield: (x) => { // plank door with a wanted poster, weight braced behind it
        const door = pl([[118, 44], [206, 36], [210, 180], [122, 192]]);
        let planks = ''; [140, 162, 186].forEach((px) => { planks += `M${px},${42 - (px - 118) * 0.09} L${px + 2},${190 - (px - 118) * 0.12} `; });
        const posterP = [[138, 70], [188, 64], [192, 116], [170, 118], [162, 124], [152, 117], [142, 120]];
        // K5-G9: 'portrait' print instead of the '禁' glyph — ink block + 2 left-aligned lines (34 / 22 long incl. caps), all tilted −4° with the poster.
        // game 0.4×: block ≈ 8.8 px tall, lines 1.6 px.
        const print = `<path d="${pl([[146, 74], [179, 71], [180, 93], [147, 96]])}" fill="${C.ink}"/>` + x.line('M149.3,102.6 L179.3,100.5 M149.7,110.6 L167.7,109.3', art ? 3.2 : 4, C.ink);
        const poster = x.shape(pl(posterP), art ? C.p300 : C.ink3, art ? 2.4 : x.u * 0.8) + x.inClip(pl(posterP), (art ? x.shade2(165, 94) : '') + print);
        return x.shape(door, C.ink7, x.W * 1.1) + x.inClip(door, x.line(planks, art ? 2.4 : 1.1 * x.u) + `<path d="M110,52 L212,44 L212,54 L110,62 Z M110,160 L212,154 L212,164 L110,170 Z" fill="${C.ink}"/>` +
          `<path d="M112,40 L210,32 L210,40 L112,48 Z" fill="${C.ink3}"/>` + (art ? `<path d="M182,30 L220,30 L220,200 L188,200 Z" fill="${x.dot(40)}"/>` + x.T([202, 50, 206, 120, 208, 178], 2.6, 'mid', C.ink3) : '')) + poster +
          R.rivets(x, [[126, 54], [202, 48], [128, 166], [206, 160]], 3);
      },
      front: (x) => x.shape(sm([[112, 70], [126, 58], [136, 66], [122, 84]]), C.ink) + x.shape(sm([[110, 128], [124, 120], [134, 130], [126, 142], [112, 140]]), C.ink) + (art ? x.line('M118,124 L121,136 M125,122 L128,134', 1.6, C.ink5) : ''),
      anchor: [100, 0]
    });
  };
  K.ANCH.warden[1] = { head: [100, 0] };

  // ======================= Ch2 · 철문 기사상 =======================
  K.DRAW.warden[2] = (x) => {
    const art = x.art;
    return R.rig(x, {
      legs: { ft: 'hoof', gy: 194 }, drips: [[70, 182, 12, 4.4], [110, 184, 10, 4]],
      ground: (x) => x.shape(pl([[16, 194], [200, 192], [206, 207], [10, 208]]), C.ink7, x.W * 0.9) + x.line('M18,195 L198,193', art ? 2.2 : x.u, C.ink3) + (art ? x.line('M-6,204 L8,204 M-10,198 L6,198', 1.6, C.ink3) + x.line('M60,196 L56,206 M150,194 L154,204', 1.4, C.ink) : ''), // dragged plinth
      back: (x) => x.shape(sm([[36, 76], [22, 108], [22, 146], [40, 150], [44, 118], [52, 92]]), C.ink7),
      body: (x) => {
        const T = sm([[26, 74], [32, 34, 1], [70, 26], [146, 24], [170, 32, 1], [178, 76], [176, 148], [158, 178], [60, 182], [34, 160]]);
        const hl = pl([[22, 88], [34, 30], [160, 20], [170, 34], [96, 34], [70, 40], [52, 60], [42, 100], [32, 140]]);
        let o = R.mass(x, T, hl, [40, 34, 100, 24, 162, 32], x.line('M62,96 Q90,90 118,94 M58,124 Q90,118 118,122', art ? 2.2 : x.u, C.ink5) + x.line('M84,70 L80,150', art ? 2.4 : x.u, C.ink5) + R.rivets(x, [[66, 96], [94, 92], [66, 124], [94, 120]], 2));
        o += [0, 1, 2].map((i) => x.shape(sm([[40 + i * 24, 152], [66 + i * 24, 150], [70 + i * 24, 174], [44 + i * 24, 178]]), C.ink7, x.W * 0.7) + (art ? x.line(`M${44 + i * 24},156 L${64 + i * 24},154`, 1.4, C.ink5) : '')).join('');
        const pd = sm([[22, 72], [30, 44], [60, 34], [84, 44], [80, 72], [50, 82]]);
        o += x.shape(pd, C.ink) + x.inClip(pd, `<path d="M16,40 L76,32 L52,56 L24,66 Z" fill="${C.ink5}"/>`) + x.line('M28,66 Q52,52 80,58', art ? 1.8 : 0.8 * x.u, C.ink5) + R.rivets(x, [[34, 62], [46, 56], [58, 52], [70, 54]], 2.2);
        return o;
      },
      head: (x) => { // great helm sunk between the pauldrons: grille, keyhole eyes (×1.4)
        const helm = sm([[82, 60], [84, 36], [102, 28], [120, 36], [122, 60], [102, 66]]);
        let o = x.shape(helm, C.ink5) + x.inClip(helm, `<path d="M104,26 C122,34 124,56 110,68 L128,68 L128,26 Z" fill="${C.ink}"/><path d="M86,42 L120,42 L120,58 L86,58 Z" fill="${C.ink}"/><path d="M80,32 L124,30 L124,36 L80,38 Z" fill="${C.ink3}"/>`);
        o += K.eye(x, 95, 47, art ? 7 : 8.5) + K.eye(x, 111, 47, art ? 5.8 : 7) + x.line('M86,42 L120,42 M86,58 L120,58 M103,40 L103,60', art ? 2.2 : x.u, C.ink5) + K.stitch(x, [[92, 62], [102, 63.5], [112, 62]], 3);
        return o;
      },
      shield: (x) => { // arched chapel iron door with lattice + ring handle
        const door = 'M118,62 L118,54 Q120,30 162,28 Q204,30 208,54 L210,184 L120,192 Z';
        let lat = ''; for (let i = 0; i < 4; i++) { const gx = 132 + i * 20; lat += `M${gx},36 L${gx + 2},190 `; } for (let j = 0; j < 5; j++) { const gy = 66 + j * 26; lat += `M116,${gy} L212,${gy - 4} `; }
        return x.shape(door, C.ink7, x.W * 1.1) + x.inClip(door, (art ? `<rect x="110" y="26" width="102" height="170" fill="${x.dot(20)}"/>` : '') + x.line(lat, art ? 3.4 : 1.4 * x.u) + x.line(lat, art ? 1 : 0.4 * x.u, C.ink5) +
          x.line('M122,54 Q126,36 162,34 Q200,36 204,54', art ? 2.4 : x.u, C.ink3)) +
          `<circle cx="138" cy="114" r="9" fill="none" stroke="${C.ink}" stroke-width="${art ? 5 : 2.2 * x.u}"/>` + (art ? `<circle cx="138" cy="114" r="9" fill="none" stroke="${C.ink3}" stroke-width="1.6"/>` : '') +
          R.rivets(x, [[124, 66], [206, 60], [124, 182], [208, 176], [164, 32]], 2.6);
      },
      front: (x) => x.shape(sm([[112, 60], [124, 54], [134, 62], [132, 76], [116, 76]]), C.ink) + (art ? x.line('M118,62 L121,72 M125,60 L127,72', 1.4, C.ink5) : ''),
      anchor: [102, 6]
    });
  };
  K.ANCH.warden[2] = { head: [102, 6] };
})(window.PN);
// ---------------------------------------------------------------------------
// part 41 · WARDEN ■ Ch3 석축 게 · Ch4 괘종 관 수문장 · Ch5 공백 석상 (same ■ rig)
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const E = PN.enemies, K = E._K, C = K.C, f = K.f, sm = K.sm, pl = K.pl, R = K.WRD;
  const D = K.DRAW.warden, A = K.ANCH.warden;

  // ======================= Ch3 · 석축 게 =======================
  D[3] = (x) => {
    const art = x.art, fr = K.fr(x, 4), st = fr == null ? 0 : [0, 5, 0, -5][fr];
    // jointed crab leg (3 joints): hip → knee (UP and OUT, above the shell rim) → wrist (out/down) → pointed tip on the ground
    const cleg = (hx, hy, kx, ky, wx, wy, tx, lift, col, w) => {
      const W = art ? w : w * 0.85, ty = R.GY - lift;
      const d = K.limbD([[hx, hy], [kx, ky - lift * 0.6], [wx, wy - lift * 0.8], [tx, ty - W * 0.5]], [W, W * 0.86, W * 0.6, W * 0.34], 'claw');
      return x.shape(d, col, art ? x.W * 0.7 : x.u * 0.6) + (art && col === C.ink ? x.line(`M${hx},${hy - W * 0.3} L${kx},${ky - lift * 0.6 - W * 0.3}`, 2, C.ink5) + K.circ(kx, ky - lift * 0.6, W * 0.4, C.ink, `stroke="${C.ink5}" stroke-width="1.2"`) + K.circ(wx, wy - lift * 0.8, W * 0.3, C.ink, `stroke="${C.ink5}" stroke-width="1"`) : '');
    };
    const L1 = [[46, 120, 20, 88, 4, 146, 10], [62, 128, 36, 100, 20, 154, 28], [80, 134, 58, 112, 44, 160, 50]]; // fan out to the left
    const L2 = [[128, 132, 152, 104, 170, 150, 166], [146, 128, 172, 96, 192, 146, 188], [160, 122, 186, 88, 210, 140, 208]]; // out to the right, under the claw
    return R.rig(x, {
      legs: false, noLean: true, drips: [[70, 138, 14, 5], [108, 138, 16, 5.4], [40, 128, 10, 4]],
      back: (x) => L2.map(([a, b, c, d, e, g, h], i) => cleg(a, b - 6, c, d - 8, e, g - 6, h, i % 2 ? st : -st, C.ink7, 11)).join('') + x.shape(sm([[26, 112], [8, 118], [2, 136, 1], [16, 132], [30, 128]]), C.ink7, x.W * 0.8),
      body: (x) => {
        const cara = sm([[12, 96], [22, 58, 1], [50, 42], [150, 36], [178, 44, 1], [194, 84], [182, 120], [150, 136], [66, 140], [26, 128]]);
        let blocks = ''; const rnd = K.rng(33);
        for (let r = 0; r < 4; r++) { let bx = 20 + (r % 2) * 14; const by = 52 + r * 22; while (bx < 192) { blocks += `M${f(bx)},${by} L${f(bx + 1)},${by + 22} `; bx += 24 + rnd() * 20; } blocks += `M12,${by + 22} L198,${by + 20} `; }
        let o = x.shape(cara, C.ink, x.W * 1.05) + x.inClip(cara, `<path d="M0,0 L220,0 L220,50 L0,64 Z" fill="${C.ink5}"/>` + `<path d="M8,42 L200,32 L200,50 L8,60 Z" fill="${C.ink3}"/>` + x.line('M8,60 L200,50', art ? 2.4 : x.u) +
          (art ? `<path d="M20,112 L200,102 L200,150 L20,150 Z" fill="${x.dot(40)}"/><path d="${sm([[40, 70], [66, 66], [74, 76], [50, 80]])}" fill="${x.E.deep}"/>` : '') + x.line(blocks, art ? 2 : 0.9 * x.u, C.ink3, 'opacity="0.9"') + x.rim([28, 56, 100, 40, 170, 40]));
        o += K.teeth(x, [92, 138], [122, 136], art ? 6 : 3, art ? 5 : 6); // mouthparts under the overhang
        o += L1.map(([a, b, c, d, e, g, h], i) => cleg(a, b, c, d, e, g, h, i % 2 ? -st : st, C.ink, 14)).join('');
        return o;
      },
      head: (x) => { // eye stalks rising from under the shell rim → bubble eyes (×1.4)
        const stalk = (sx, sy, tx, ty, s) => x.line(`M${sx},${sy} Q${sx + 2},${(sy + ty) / 2} ${tx},${ty}`, art ? 6 : 2.4 * x.u) + K.eye(x, tx, ty - s * 0.4, s, { noSat: true });
        return stalk(108, 42, 102, 18, art ? 8.5 : 9.5) + stalk(126, 40, 132, 22, art ? 6.8 : 7.8);
      },
      shield: (x) => { // giant sluice-gate claw: palm slab (planks, iron straps) + pincer
        const palm = sm([[122, 74], [164, 58], [196, 64, 1], [202, 110], [196, 146, 1], [156, 160], [124, 150]]);
        const dactyl = sm([[190, 70], [208, 76], [218, 100], [214, 128, 1], [206, 108], [192, 96]]);
        const fixed = sm([[192, 120], [210, 134], [216, 160, 1], [200, 150], [188, 144]]);
        const barn = (bx, by, s) => x.shape(`M${bx - s},${by} L${bx - s * 0.5},${by - s * 1.3} L${bx + s * 0.5},${by - s * 1.3} L${bx + s},${by} Z`, C.ink3, art ? 1.4 : x.u * 0.5);
        return x.shape(dactyl, C.ink) + x.shape(fixed, C.ink) + (art ? `<path d="M208,104 l4,-4 l1,6 Z M206,116 l5,-3 l0,6 Z M204,138 l5,1 l-3,4 Z" fill="${C.p50}"/>` : '') +
          x.shape(palm, C.ink7, x.W * 1.1) + x.inClip(palm, x.line('M140,66 L142,160 M162,60 L164,160 M184,62 L186,160', art ? 2.2 : x.u) + `<path d="M110,92 L210,82 L210,92 L110,102 Z M110,132 L210,122 L210,132 L110,142 Z" fill="${C.ink}"/>` +
          `<path d="M118,70 L200,56 L200,64 L118,78 Z" fill="${C.ink3}"/>` + (art ? `<path d="M178,56 L220,56 L220,170 L180,170 Z" fill="${x.dot(40)}"/>` : '')) + R.rivets(x, [[130, 96], [196, 86], [130, 138], [196, 128]], 2.6) +
          barn(192, 66, art ? 5 : 6) + barn(146, 160, art ? 4 : 5) + (art ? barn(28, 60, 4) + barn(40, 50, 3) + K.drip(170, 158, 12, 4.4, x.E.deep) : '');
      },
      anchor: [116, 0]
    });
  };
  A[3] = { head: [116, 0] };

  // ======================= Ch4 · 괘종 관 수문장 =======================
  D[4] = (x) => {
    const art = x.art, fr = K.fr(x, 4) || 0;
    return R.rig(x, {
      legs: { w: [34, 26, 20, 20], ft: 'hoof' }, drips: [[58, 184, 12, 4.4], [150, 186, 10, 4], [104, 184, 8, 3.2]],
      back: (x) => x.shape(pl([[42, 70], [24, 108], [26, 148], [42, 148], [42, 112], [52, 90]]), C.ink7),
      body: (x) => {
        const T = pl([[64, 22], [150, 22], [178, 60], [170, 186], [50, 186], [40, 60]]);
        const hl = pl([[40, 60], [64, 18], [160, 18], [150, 28], [96, 30], [72, 40], [56, 72], [52, 140], [46, 170]]);
        let o = x.shape(pl([[84, 22], [96, 8], [120, 8], [132, 22]]), C.ink) + x.line('M108,8 L108,0', art ? 3 : 1.2 * x.u);
        o += R.mass(x, T, hl, [46, 60, 70, 24, 146, 24], art ? x.line('M50,88 L172,88 M52,176 L168,176', 1.8, C.ink5) : '');
        const win = pl([[80, 98], [126, 98], [124, 168], [82, 168]]), sw = [0, 5, 0, -5][fr];
        o += x.shape(win, C.ink7, art ? 2.4 : x.u * 0.7) + x.inClip(win, `<g transform="rotate(${sw} 103 98)">${x.line('M103,98 L103,150', art ? 3 : 1.4 * x.u, x.E.deep)}<circle cx="103" cy="154" r="10" fill="${x.E.deep}" stroke="${C.ink}" stroke-width="${art ? 2.4 : x.u}"/></g>` + (art ? `<path d="M80,98 L96,98 L84,168 L80,168 Z" fill="${C.ink5}" opacity="0.8"/>` : ''));
        return o;
      },
      head: (x) => { // dial face: two dial eyes, clock hands as angry brows
        let o = `<circle cx="106" cy="58" r="28" fill="${C.ink}"/><circle cx="106" cy="58" r="22" fill="${C.ink3}" stroke="${C.ink}" stroke-width="${art ? 2 : x.u}"/>` + (art ? `<circle cx="106" cy="58" r="22" fill="${x.dot(40)}"/>` : '');
        let ticks = ''; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ticks += `M${f(106 + Math.cos(a) * 18)},${f(58 + Math.sin(a) * 18)} L${f(106 + Math.cos(a) * 21)},${f(58 + Math.sin(a) * 21)} `; }
        o += x.line(ticks, art ? 1.6 : 0.8 * x.u) + K.eye(x, 96, 62, art ? 7 : 8.5, { hand: 200 }) + K.eye(x, 116, 62, art ? 5.8 : 7, { hand: -20 });
        o += x.shape(pl([[82, 44], [104, 54], [102, 58], [80, 49]]), C.ink, art ? 1.4 : 0.6 * x.u) + x.shape(pl([[132, 42], [110, 54], [112, 58], [134, 47]]), C.ink, art ? 1.4 : 0.6 * x.u) + K.circ(106, 56, art ? 2.4 : 1.4 * x.u, C.ink);
        return o;
      },
      shield: (x) => { // coffin lid shield
        const lid = pl([[126, 60], [188, 48], [212, 84], [206, 184], [142, 198], [120, 112]]);
        return x.shape(lid, C.ink7, x.W * 1.1) + x.inClip(lid, (art ? `<path d="M180,40 L220,40 L220,200 L170,200 Z" fill="${x.dot(40)}"/>` : '') + x.line('M136,68 L190,58 L206,86 L200,176 L148,188 L132,112 Z', art ? 2 : x.u, C.ink5) +
          `<path d="M124,58 L188,46 L192,52 L128,64 Z" fill="${C.ink3}"/>`) + K.gear(x, 126, 88, art ? 7 : 7.5, 7, null, fr * 15) + K.gear(x, 132, 170, art ? 7 : 7.5, 7, null, 20 - fr * 15) + R.rivets(x, [[168, 90], [184, 120], [170, 150], [150, 120]], 2.4);
      },
      front: (x) => x.shape(sm([[118, 108], [132, 100], [142, 108], [138, 122], [122, 122]]), C.ink) + (art ? x.line('M126,108 L129,118 M133,106 L136,116', 1.4, C.ink5) + K.drip(128, 122, 9, 3) : ''),
      anchor: [108, -8]
    });
  };
  A[4] = { head: [108, -8] };

  // ======================= Ch5 · 공백 석상 =======================
  D[5] = (x) => {
    const art = x.art;
    return R.rig(x, {
      legs: { w: [34, 28, 22, 22], ft: 'hoof' }, drips: [[62, 184, 10, 4], [104, 186, 9, 3.6]],
      back: (x) => x.shape(pl([[34, 86], [14, 104], [12, 158], [28, 164], [34, 124]]), C.ink7),
      body: (x) => { // obsidian stele: chest cut TRANSPARENT (3px ink rim), erased left edge = dry-brush breaks + 20→40% fade
        const T = pl([[36, 186], [34, 72], [44, 36], [80, 22], [140, 22], [170, 34], [182, 72], [180, 186]]);
        const facets = pl([[34, 72], [44, 36], [80, 22], [100, 30], [66, 48], [50, 86], [42, 150]]) + ' ' + pl([[140, 22], [170, 34], [150, 44], [124, 32]]);
        const hole = 'M84,90 L126,84 L134,100 L144,108 L135,130 L141,146 L120,155 L100,150 L80,156 L74,135 L81,117 L72,102 Z';
        const erase = art ? K.nibble([[34, 150], [34, 72], [44, 36], [80, 22]], 12, 4.2, 77) : '';
        const inner = x.shape(T, C.ink, x.W * 1.05) + x.inClip(T, x.keylight(facets, 5, 7, 20) + x.rim([46, 38, 110, 20, 168, 34], art ? 2.6 : null) +
          (art ? `<path d="M30,60 L52,60 L48,176 L30,176 Z" fill="${x.dot(20)}"/><path d="M30,80 L42,80 L40,166 L30,166 Z" fill="${x.dot(40)}"/>` + x.line('M66,48 L50,86 M100,30 L66,48', 1.3, C.ink3) : ''));
        let o = K.holed(x, [hole], inner, erase);
        if (art) o += [[40, 60, 30, 96], [36, 110, 28, 136], [38, 146, 30, 170]].map(([a, b, c, d]) => x.T([a, b, (a + c) / 2 - 4, (b + d) / 2, c, d], 4.2, 'mid', C.ink) + x.T([a - 6, b + 8, (a + c) / 2 - 10, (b + d) / 2 + 6, c - 5, d - 4], 2, 'start', C.ink)).join(''); // dry-brush breaks
        o += K.drip(110, 87, art ? 16 : 14, art ? 5 : 5.5) + (art ? K.drip(130, 152, 9, 3.6) + K.drip(92, 150, 8, 3.2) : '');
        return o;
      },
      head: (x) => { // carved block head sunk between the shoulders: brow slab + eclipse eyes (×1.4) + carved mouth slot
        const hb = pl([[82, 38], [126, 36], [128, 70], [84, 72]]);
        let o = x.shape(hb, C.ink7, x.W) + `<path d="${pl([[78, 34], [130, 32], [128, 44], [80, 46]])}" fill="${C.ink5}" stroke="${C.ink}" stroke-width="${art ? 2.4 : x.u}"/>`;
        o += K.eye(x, 96, 55, art ? 8 : 9) + K.eye(x, 115, 53.5, art ? 6.2 : 7.2); // K5-E1: far eye up 1.5 (no '8')
        o += x.line('M92,66 L118,66', art ? 3 : 1.2 * x.u) + x.line('M98,64 L98,68 M105,64 L105,68 M112,64 L112,68', art ? 1.3 : 0.5 * x.u, C.ink3);
        return o;
      },
      shield: (x) => { // distinct front slab offset right = the ■ shield plane; 2px rim + crescent moonlight on its top edge
        const slab = pl([[126, 48], [204, 40], [210, 192], [132, 198]]);
        let o = x.shape(slab, C.ink, x.W * 1.4) + x.inClip(slab, x.keylight(pl([[122, 44], [206, 36], [200, 52], [150, 60], [134, 120], [126, 190]]), 4, 6, 20) + (art ? `<path d="M180,40 L220,40 L220,200 L186,200 Z" fill="${x.dot(40)}"/>` + x.line('M150,70 L146,180 M176,66 L180,186', 1.2, C.ink3) : ''));
        o += x.T([132, 46, 168, 34, 204, 40], art ? 6 : 2.6 * x.u, 'mid', C.ink) + x.T([136, 45, 168, 36, 200, 40], art ? 3 : 1.2 * x.u, 'mid', C.p100);
        o += x.T([54, 30, 104, 16, 150, 26], art ? 5.5 : 2.4 * x.u, 'mid', C.ink) + x.T([62, 28, 106, 19, 146, 26], art ? 2.6 : 1.1 * x.u, 'mid', C.p100);
        return o;
      },
      front: (x) => x.shape(pl([[118, 104], [134, 96], [140, 110], [130, 122], [118, 118]]), C.ink) + (art ? `<path d="${pl([[120, 104], [132, 98], [128, 108]])}" fill="${C.ink5}"/>` : ''),
      anchor: [106, 4]
    });
  };
  A[5] = { head: [106, 4] };
})(window.PN);
// ---------------------------------------------------------------------------
// part 90 · public API: PN.enemies.draw / list / meta / lane
// ---------------------------------------------------------------------------
(function (PN) {
  'use strict';
  const E = PN.enemies, K = E._K, C = K.C, f = K.f;
  const ROLES = ['stalker', 'charger', 'shooter', 'warden'];
  K.ANCH = K.ANCH || { stalker: {}, charger: {}, shooter: {}, warden: {} };

  // chapter outline quality → filter recipe (art LOD only; game LOD stays clean per §4 small-sprite rule)
  const ROUGH = {
    1: { bf: '0.05', sc: 2.6, seed: 7 },        // 거친 번짐
    3: { bf: '0.018 0.07', sc: 2.4, seed: 3 },  // 습윤 번짐 (vertical run)
    5: { bf: '0.11', sc: 1.1, seed: 5 }         // 지워진 흑요 (fine nibble)
  };

  function filterDef(x, mode) {
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
  }

  function eliteRing(x, cx, cy, rx, ry) {
    const u = x.u, e = `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke-width="`;
    return `${e}${f(5.2 * u)}" stroke="${C.ink}"/>${e}${f(3 * u)}" stroke="${C.elite}"/>${e}${f(0.8 * u)}" stroke="${C.p50}"/>`;
  }
  function eliteCrown(x, hx, hy) {
    const u = x.u; let o = '';
    [[-6.5, 1.2], [0, -2.6], [6.5, 1.2]].forEach(([dx, dy], i) => {
      const cx = hx + dx * u, cy = hy + dy * u - 4 * u, r = (i === 1 ? 2.7 : 2.2) * u;
      o += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${C.elite}" stroke="${C.ink}" stroke-width="${f(1.8 * u)}" paint-order="stroke"/>${K.circ(cx - r * 0.3, cy - r * 0.32, r * 0.34, C.p50)}`;
    });
    return o;
  }
  function muzzleRing(x, m, aim) {
    const u = x.u, [mx, my] = m, r = 5.6 * u;
    let o = '';
    if (aim) { // amber dotted aim line (ink sandwich)
      const L = 64 * u, d = `M${f(mx + r + 2 * u)},${f(my)} L${f(mx + L)},${f(my)}`;
      o += `<path d="${d}" stroke="${C.ink}" stroke-width="${f(3.6 * u)}" stroke-dasharray="${f(7 * u)} ${f(5 * u)}" stroke-linecap="round"/><path d="${d}" stroke="${C.warn}" stroke-width="${f(1.9 * u)}" stroke-dasharray="${f(7 * u)} ${f(5 * u)}" stroke-linecap="round"/>`;
    }
    o += `<circle cx="${f(mx)}" cy="${f(my)}" r="${f(r)}" fill="none" stroke="${C.ink}" stroke-width="${f(4.4 * u)}"/><circle cx="${f(mx)}" cy="${f(my)}" r="${f(r)}" fill="none" stroke="${C.warn}" stroke-width="${f(2.4 * u)}"/>` +
      `<circle cx="${f(mx)}" cy="${f(my)}" r="${f(1.7 * u)}" fill="${C.p50}" stroke="${C.ink}" stroke-width="${f(0.9 * u)}"/>`;
    return o;
  }
  // comic tension marks (ink, not signal colour)
  function tension(x, cx, cy, n, len, a0, spread) {
    let o = '';
    for (let i = 0; i < n; i++) {
      const a = (a0 + (i - (n - 1) / 2) * spread) * Math.PI / 180, r0 = len * 0.25;
      o += x.T([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * len * 0.6, cy + Math.sin(a) * len * 0.6, cx + Math.cos(a) * len, cy + Math.sin(a) * len], x.art ? 3.2 : 1.6 * x.u, 'start');
    }
    return o;
  }
  function puffs(x, pts) { // 담묵 dust puffs
    return pts.map(([px, py, r]) => `<path d="M${f(px - r)},${f(py)} a${f(r * 0.6)},${f(r * 0.6)} 0 0 1 ${f(r * 0.7)},${f(-r * 0.7)} a${f(r * 0.7)},${f(r * 0.7)} 0 0 1 ${f(r * 1.2)},${f(r * 0.1)} a${f(r * 0.5)},${f(r * 0.5)} 0 0 1 ${f(r * 0.1)},${f(r * 0.6)} Z" fill="${C.ink3}" stroke="${C.ink}" stroke-width="${f(x.art ? 1.6 : 0.8 * x.u)}"/>`).join('');
  }

  /**
   * PN.enemies.draw(ch, role, opts) → '<g>…</g>' in the role's LOCAL BOX, facing right.
   * opts: state 'idle'|'windup'|'hit', elite bool, frame int, lod 'art'|'game', flip bool,
   *       halo bool(default true), shadow bool(default true), silhouette bool, hitbox bool
   */
  E.draw = function (ch, role, opts = {}) {
    const o = Object.assign({ state: 'idle', elite: false, frame: null, lod: 'art', flip: false }, opts);
    const fn = K.DRAW[role] && K.DRAW[role][ch];
    if (!fn) { if (typeof console !== 'undefined') console.warn(`PN.enemies.draw: no ${role}/${ch}`); return '<g/>'; } // K5-G11: no fallback lettering
    const x = K.ctx(ch, role, o), R = x.R, [px, py] = R.pivot, u = x.u, fy = py + R.r * u;
    const L = fn(x); // { g, head:[x,y], muzzle:[x,y], front:[x,y] }
    const mode = o.silhouette ? 'sil' : (o.state === 'hit' ? 'hit' : '');
    const flt = filterDef(x, mode);
    // state transforms (shared rig behaviour — independent of chapter)
    let tf = '', over = '', under = '';
    const bob = L.posed ? 0 : [0, -0.6, 0, 0.5][(((o.frame | 0) % 4) + 4) % 4] * u;
    if (o.state === 'windup' && L.posed) { // rig drew a dedicated windup pose; API adds only signal overlays
      if (role === 'shooter' && !o.silhouette && L.muzzle) over += muzzleRing(x, L.muzzle, true);
    } else if (o.state === 'windup') {
      if (role === 'stalker') { tf = `translate(${px},${fy}) scale(1.05,0.88) translate(${-px},${-fy})`; if (!o.silhouette) over += tension(x, px - 70, py - 20, 3, 9 * u, 200, 22); }
      if (role === 'charger') { const fx = L.front ? L.front[0] : px + 50; tf = `rotate(9 ${f(fx)} ${f(fy)})`; if (!o.silhouette) { under += puffs(x, [[px - 62, fy - 2, 5 * u], [px - 80, fy - 10, 3.6 * u], [px - 40, fy + 2, 3 * u]]); over += tension(x, px - 58, py - 38, 3, 9 * u, 205, 20); } }
      if (role === 'shooter') { tf = `translate(${px},${py}) scale(1.03) translate(${-px},${-py})`; if (!o.silhouette && L.muzzle) over += muzzleRing(x, L.muzzle, true); }
      if (role === 'warden') { tf = `translate(${px},${fy}) scale(0.97,1.05) translate(${-px},${-fy})`; if (!o.silhouette) over += tension(x, px, py - 70 * 1.0, 3, 8 * u, 270, 30); }
    } else if (bob) tf = `translate(0,${f(bob)})`;
    if (o.elite) tf = `translate(${px},${py}) scale(1.1) translate(${-px},${-py}) ` + tf;
    const scx = px, scy = py + 0.55 * R.r * u, srx = R.shadow[0] / 2 * u, sry = R.shadow[1] / 2 * u;
    let s = '';
    if (o.shadow !== false && !o.silhouette) s += `<ellipse cx="${f(scx)}" cy="${f(scy)}" rx="${f(srx)}" ry="${f(sry)}" fill="${C.ink}" opacity="0.3"/>`;
    if (o.elite && !o.silhouette) s += eliteRing(x, scx, scy, srx * 1.3, sry * 1.45);
    if (o.hitbox) s += `<circle cx="${px}" cy="${py}" r="${f(R.r * u)}" fill="none" stroke="${C.ink}" stroke-width="${f(0.9 * u)}" stroke-dasharray="${f(2.2 * u)} ${f(2.2 * u)}" opacity="0.55"/><path d="M${px - 3 * u},${py} h${6 * u} M${px},${py - 3 * u} v${6 * u}" stroke="${C.ink}" stroke-width="${f(0.8 * u)}" opacity="0.7"/>`;
    s += under;
    // shadow + elite ring live INSIDE the halo group so the knockout halo never punches its own shadow
    const inner = `<g${tf ? ` transform="${tf}"` : ''}>${L.g}</g>`;
    let body = mode ? `<g${flt}>${inner}</g>` : `<g${flt}>${s}${inner}</g>`;
    if (!mode) s = '';
    if (o.state === 'hit' && !o.silhouette) body += `<g${tf ? ` transform="${tf}"` : ''}>${x.eyes.map(([ex, ey, es]) => K.circ(ex, ey, es * 0.78, C.ink)).join('')}</g>`;
    s += body;
    if (o.elite && !o.silhouette && L.head) s += `<g transform="translate(${px},${py}) scale(1.1) translate(${-px},${-py})">${eliteCrown(x, L.head[0], L.head[1])}</g>`;
    s += over;
    const g = o.flip ? `<g transform="translate(${2 * px},0) scale(-1,1)">${s}</g>` : s;
    return `<g class="pn-enemy" data-ch="${ch}" data-role="${role}"><defs>${x.defs.join('')}</defs>${g}</g>`;
  };

  // metadata for all 20 profiles
  E.list = [];
  for (let ch = 1; ch <= 5; ch++) ROLES.forEach((role) => {
    const R = K.ROLE[role], a = Object.assign({}, K.ANCH[role][ch] || {});
    try { const L0 = K.DRAW[role][ch](K.ctx(ch, role, { state: 'idle', frame: null, lod: 'art' })); if (L0.muzzle) a.muzzle = L0.muzzle.map(Number); if (L0.head) a.head = L0.head; } catch (e) { /* keep static anchors */ }
    E.list.push({
      ch, role, id: `${K.CH[ch].key}/${role}`, nameKo: K.NAMES[ch][role], glyph: R.glyph, chapterKo: K.CH[ch].nameKo,
      eyeKo: K.CH[ch].eyeKo, lineKo: K.CH[ch].lineKo,
      box: R.box.slice(), pivot: R.pivot.slice(), feet: [R.pivot[0], R.pivot[1] + R.r * R.u], r: R.r, unitsPerPx: R.u,
      displayScale: f(1 / R.u), displayPx: R.disp.slice(), shadowPx: R.shadow.slice(), frames: R.frames,
      head: a.head || null, muzzle: a.muzzle || null
    });
  });
  E.meta = (ch, role) => E.list.find((m) => m.ch === ch && m.role === role);
  E.roles = ROLES.slice();
  E.chapters = K.CH;
  E.C = C;

  // enemy dash-lane telegraph (for charger windup demos). World coords, length/width in px of the caller space.
  // Lane runs FORWARD (+x) from x0; the brush head at the leading edge = progress (§12.2 "붓이 그려 나가는 예고")
  E.lane = function (x0, y0, len, w, progress = 1, pitch = 10) {
    const id = 'kel' + (K.n++), x1 = x0 + len * progress, cid = id + 'c';
    return `<g class="pn-lane"><defs><pattern id="${id}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="${pitch}" height="${f(pitch * 0.4)}" fill="${C.warn}"/></pattern><clipPath id="${cid}"><rect x="${f(x0)}" y="${f(y0 - w / 2)}" width="${f(x1 - x0)}" height="${f(w)}"/></clipPath></defs>` +
      `<rect x="${f(x0)}" y="${f(y0 - w / 2)}" width="${f(len)}" height="${f(w)}" fill="none" stroke="${C.ink}" stroke-width="1.4" stroke-dasharray="3 5" opacity="0.55"/>` +
      `<g clip-path="url(#${cid})"><rect x="${f(x0)}" y="${f(y0 - w / 2)}" width="${f(len)}" height="${f(w)}" fill="url(#${id})" opacity="0.85"/></g>` +
      `<path d="M${f(x0)},${f(y0 - w / 2)} L${f(x1)},${f(y0 - w / 2)} M${f(x0)},${f(y0 + w / 2)} L${f(x1)},${f(y0 + w / 2)}" stroke="${C.ink}" stroke-width="2.2"/>` +
      `<path d="M${f(x1)},${f(y0 - w / 2 - 3)} q9,${f(w / 2 + 3)} 0,${f(w + 6)} q-4,${f(-w / 2 - 3)} 0,${f(-w - 6)} Z" fill="${C.ink}"/></g>`;
  };
})(window.PN);
