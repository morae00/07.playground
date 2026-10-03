// k-bosses1.js — 라운드 보스 A: 잉크 도살자(butcher) · 종탑 간수(gaoler) · 용광의 입(maw)
// 먹극화 · PAPER NOIR INK. rev 3(K3, 2026-10): 킷 사본을 직접 고쳤다. concept/work 원본은 이 판보다 오래됐다.
// LOCAL BOX 400 x 400, all bosses face RIGHT (flip with scale(-1,1) around x=200).
//   pivot  = (200,257) = hit-circle centre (r54 in game -> 135 local units)
//   feet   = y 392 (pivot + r)          shadow = ellipse (200,331) rx135 ry55 (= hit diameter)
//   gameScale = 0.4  -> 400 local = 160px, figure height ~390 local = 156px on a 1440x900 screen
// Requires lib.js (PN.C, PN.taper). Every call returns <g>…</g> with its own <defs>; ids are unique per call.
window.PN = window.PN || {};
(function (PN) {
  const C = PN.C, TP = PN.taper;
  const K = {
    ink: C.ink, ink700: '#2B2926', ink500: '#46423D', ink300: '#8C8579', ink100: '#BCB4A5',
    paper: C.paper, paper50: '#FAF6EC', paper300: C.paperShade,
    warn: C.warn, hostile: C.hostile, hostileDeep: '#B8352B',
    ch1: { light: '#D4CAB4', base: '#B8AC93', deep: '#8F836C', spot: '#7E6A4E' },
    ch2: { light: '#C8CACF', base: '#ABADB4', deep: '#878A93', spot: '#566077' }
  };
  const f = (n) => Math.round(n * 10) / 10;
  let UID = 0;

  // per-call drawing context
  function mk(opts) {
    const o = Object.assign({ phase: 1, windup: false, enraged: false, lod: 'art', halo: null, silhouette: false, shadow: true, fx: true, seed: 3 }, opts || {});
    o.phase = Math.max(1, Math.min(3, o.phase | 0 || 1));
    const p = 'bA' + (UID++) + '_';
    const game = o.lod === 'game';
    const LW = game ? 1.55 : 1;           // outline multiplier (bible §4: 4px @156px)
    const TW = game ? 1.35 : 1;           // brush highlight multiplier
    const pitch = game ? 8 : 5;           // halftone pitch (>=3px at 1x in game)
    const defs = []; let cid = 0;
    const X = {
      o, p, game, LW, TW, pitch, defs, K, f,
      url: (n) => `url(#${p}${n})`,
      O: (w, col = K.ink) => `stroke="${col}" stroke-width="${f(w * LW)}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"`,
      // filled shape; inner content clipped to it
      S(d, fill, w, inner = '', extra = '') {
        let s = `<path d="${d}" fill="${fill}" ${w ? X.O(w) : ''} ${extra}/>`;
        if (inner) { const id = p + 'c' + (cid++); defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); s += `<g clip-path="url(#${id})">${inner}</g>`; }
        return s;
      },
      clip(d, inner) { const id = p + 'c' + (cid++); defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); return `<g clip-path="url(#${id})">${inner}</g>`; },
      // tapered brush stroke (lib taper), width scaled for lod
      T: (pts, w, mode = 'mid', fill = K.ink, extra = '') => TP(pts, w * TW, mode, fill, extra),
      Ts: (list, fill, extra) => list.map((s) => TP(s.slice(0, -2), s[s.length - 2] * TW, s[s.length - 1], fill, extra)).join(''),
      ht: (d, pat, op = 1) => `<path d="${d}" fill="url(#${p}${pat})" ${op < 1 ? `opacity="${op}"` : ''}/>`,
      line: (d, col, w, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w * LW)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`,
      // enemy ink drip (flows DOWN): stem from (x,y), drop at y+len
      drip(x, y, len, w, fill = K.ink) {
        const r = w * 0.78;
        return `<path d="M ${f(x - w / 2)},${f(y)} C ${f(x - w / 2)},${f(y + len * 0.45)} ${f(x - r)},${f(y + len - r * 1.7)} ${f(x - r)},${f(y + len - r)} A ${f(r)} ${f(r)} 0 1 0 ${f(x + r)},${f(y + len - r)} C ${f(x + r)},${f(y + len - r * 1.7)} ${f(x + w / 2)},${f(y + len * 0.45)} ${f(x + w / 2)},${f(y)} Z" fill="${fill}"/>`;
      },
      rivet(x, y, r = 2.6) { return `<circle cx="${x}" cy="${y}" r="${r}" fill="${K.ink500}" stroke="${K.ink}" stroke-width="${f(1.2 * LW)}"/><circle cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.35)}" r="${f(r * 0.38)}" fill="${K.ink100}"/>`; },
      // chain of links from a to b with sag
      chain(x0, y0, x1, y1, n, sag = 10, lw = 4.2, hi = K.ink300) {
        let s = ''; const a = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
        for (let i = 0; i <= n; i++) {
          const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag;
          const rx = 5.6, ry = i % 2 ? 2 : 3.6, tr = `transform="rotate(${f(a)} ${f(x)} ${f(y)})"`;
          s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${rx}" ry="${ry}" ${tr} fill="none" stroke="${K.ink}" stroke-width="${f(lw * LW)}"/>`;
          if (!X.game) s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${rx}" ry="${ry}" ${tr} fill="none" stroke="${hi}" stroke-width="1.4" stroke-dasharray="4 9"/>`;
        }
        return s;
      },
      // amber "!" windup mark (ink rim + amber + paper core), centred at x, bottom at y
      bang(x, y, s = 1) {
        const k = s * (X.game ? 1.25 : 1);
        return `<g transform="translate(${x},${y}) scale(${f(k)})">
          <path d="M -9,-62 L 9,-62 L 5,-20 L -5,-20 Z" fill="${K.warn}" stroke="${K.ink}" stroke-width="5" stroke-linejoin="round" paint-order="stroke"/>
          <circle cx="0" cy="-8" r="7" fill="${K.warn}" stroke="${K.ink}" stroke-width="5" paint-order="stroke"/>
          <path d="M -3,-56 L 1,-56 L -1,-28 Z" fill="${K.paper50}"/><circle cx="-2" cy="-10" r="2" fill="${K.paper50}"/>
          <path d="M -22,-58 L -14,-48 M 22,-58 L 14,-48 M -26,-36 L -16,-34 M 26,-36 L 16,-34" stroke="${K.ink}" stroke-width="3.2" stroke-linecap="round"/></g>`;
      },
      // §4 shadow-side contour: tapered ink stroke laid ON an outline (lower-right), swells mid-stroke
      C: (pts, w) => TP(pts, w * LW, 'mid', K.ink),
      // §5.3 dry-brush rim (ink.300) along a top-left contour
      R: (pts, w = 2) => TP(pts, w * TW, 'mid', K.ink300),
      // 2px ink.300 break line: separates overlapping ink parts (arm over torso etc.)
      brk: (d, w = 2) => `<path d="${d}" fill="none" stroke="${K.ink300}" stroke-width="${f(w * TW)}" stroke-linecap="round" stroke-linejoin="round"/>`,
      // capsule limb p0->p1 (radii r0,r1) with designed planes: ink.500 lit crescent on the top-left side,
      // 60% dots + solid black spot on the underside, ink.300 rim, tapered shadow-side contour, optional break line at p0
      limb(p0, p1, r0, r1, lo = {}) {
        const [x0, y0] = p0, [x1, y1] = p1, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
        const sL = (-nx - ny) >= 0 ? 1 : -1, bul = lo.bulge || 1.1, cp = 1.32;
        const P = (t, s) => { const r = r0 + (r1 - r0) * Math.min(1, Math.max(0, t)); return [x0 + ux * L * t + nx * s * r, y0 + uy * L * t + ny * s * r]; };
        const q = (p) => f(p[0]) + ',' + f(p[1]);
        const A0 = P(0, 1), A1 = P(1, 1), B1 = P(1, -1), B0 = P(0, -1);
        const d = `M ${q(A0)} C ${q(P(0.33, bul))} ${q(P(0.66, bul))} ${q(A1)} C ${q([A1[0] + ux * r1 * cp, A1[1] + uy * r1 * cp])} ${q([B1[0] + ux * r1 * cp, B1[1] + uy * r1 * cp])} ${q(B1)} C ${q(P(0.66, -bul))} ${q(P(0.33, -bul))} ${q(B0)} C ${q([B0[0] - ux * r0 * cp, B0[1] - uy * r0 * cp])} ${q([A0[0] - ux * r0 * cp, A0[1] - uy * r0 * cp])} ${q(A0)} Z`;
        const lit = `M ${q(P(-0.16, sL * 0.5))} C ${q(P(0.2, sL * 1.6))} ${q(P(0.8, sL * 1.6))} ${q(P(1.12, sL * 0.55))} L ${q(P(0.72, sL * 0.46))} L ${q(P(0.56, sL * 0.2))} L ${q(P(0.44, sL * 0.5))} C ${q(P(0.3, sL * 0.4))} ${q(P(0.05, sL * 0.36))} ${q(P(-0.16, sL * 0.5))} Z`;
        const dots = `M ${q(P(-0.3, -sL * 0.08))} C ${q(P(0.3, sL * 0.02))} ${q(P(0.7, sL * 0.02))} ${q(P(1.3, -sL * 0.1))} L ${q(P(1.3, -sL * 1.7))} L ${q(P(-0.3, -sL * 1.7))} Z`;
        const blk = `M ${q(P(-0.3, -sL * 0.62))} C ${q(P(0.3, -sL * 0.5))} ${q(P(0.7, -sL * 0.5))} ${q(P(1.3, -sL * 0.66))} L ${q(P(1.3, -sL * 1.7))} L ${q(P(-0.3, -sL * 1.7))} Z`;
        const inner = `<path d="${lit}" fill="${lo.lit || K.ink500}"/>${X.ht(dots, lo.dots || 'd60')}<path d="${blk}" fill="${K.ink}"/>` +
          X.R([...P(0.06, sL * 0.8), ...P(0.5, sL * 0.95), ...P(0.9, sL * 0.8)], lo.rim || 2);
        let s = X.S(d, lo.fill || K.ink700, lo.w || 5.5, inner);
        s += X.C([...P(-0.04, -sL * 1.02), ...P(0.5, -sL * bul * 1.05), ...P(1.04, -sL * 1.0)], lo.cw || 4.6);
        if (lo.brk0) s += X.brk(`M ${q(P(0.02, 0.8))} C ${q([A0[0] - ux * r0 * 1.1, A0[1] - uy * r0 * 1.1])} ${q([B0[0] - ux * r0 * 1.1, B0[1] - uy * r0 * 1.1])} ${q(P(0.02, -0.8))}`);
        if (lo.brk1) s += X.brk(`M ${q(P(0.98, 0.8))} C ${q([A1[0] + ux * r1 * 1.1, A1[1] + uy * r1 * 1.1])} ${q([B1[0] + ux * r1 * 1.1, B1[1] + uy * r1 * 1.1])} ${q(P(0.98, -0.8))}`);
        return s;
      },
      // ink flame tongue (black fire + paper core) rising from (x,y)
      flame(x, y, h, w, lean = 0) {
        const tip = [x + lean, y - h];
        const outer = `M ${f(x - w / 2)},${f(y)} C ${f(x - w * 0.7)},${f(y - h * 0.4)} ${f(tip[0] - w * 0.25)},${f(y - h * 0.62)} ${f(tip[0])},${f(tip[1])} C ${f(tip[0] + w * 0.1)},${f(y - h * 0.55)} ${f(x + w * 0.75)},${f(y - h * 0.35)} ${f(x + w / 2)},${f(y)} Z`;
        const iw = w * 0.26, ih = h * 0.42, it = [x + lean * 0.5, y - ih];
        const inner = `M ${f(x - iw / 2)},${f(y - 2)} C ${f(x - iw * 0.6)},${f(y - ih * 0.5)} ${f(it[0] - 2)},${f(y - ih * 0.7)} ${f(it[0])},${f(it[1])} C ${f(it[0] + 3)},${f(y - ih * 0.6)} ${f(x + iw * 0.6)},${f(y - ih * 0.4)} ${f(x + iw / 2)},${f(y - 2)} Z`;
        return `<path d="${outer}" fill="${K.ink}" stroke="${K.ink}" stroke-width="${f(2 * LW)}" stroke-linejoin="round"/><path d="${inner}" fill="${K.paper50}"/>`;
      }
    };
    return X;
  }

  // shared per-call defs: halftone 20/40/60, light-dots for ink bodies, rough/halo/silhouette/enrage filters
  function baseDefs(X, env) {
    const { p, pitch: P, o, K } = X;
    const r20 = f(P * 0.252), r40 = f(P * 0.357), r60 = f(P * 0.437), h = P / 2;
    const dot = (id, r, col) => `<pattern id="${p}${id}" width="${P}" height="${P}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="${h}" cy="${h}" r="${r}" fill="${col}"/></pattern>`;
    let d = dot('d20', r20, K.ink) + dot('d40', r40, K.ink) + dot('d60', r60, K.ink) +
      dot('l20', r20, K.ink500) + dot('l40', r40, K.ink500) + dot('r40', r40, K.ink300) + dot('e40', r40, env.deep) + dot('p40', r40, K.paper50);
    const rs = X.game ? 1.0 : 1.5;
    const sh = X.game ? 2.5 : 2.3;   // shadow-side (lower-right) brush weight: +~40% outline (bible §4)
    d += `<filter id="${p}rough" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="${o.seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${rs}" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
      `<feFlood flood-color="${K.ink}"/><feComposite in2="d" operator="in"/><feOffset dx="${sh}" dy="${sh * 1.1}" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="d"/></feMerge></filter>`;
    d += `<filter id="${p}glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${X.game ? 5 : 4}"/></filter>`;
    if (o.silhouette) d += `<filter id="${p}sil" x="-5%" y="-5%" width="110%" height="110%"><feFlood flood-color="${K.ink}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`;
    const halo = o.halo === true ? env.base : o.halo;
    if (halo) d += `<filter id="${p}halo" x="-6%" y="-6%" width="112%" height="112%"><feMorphology in="SourceAlpha" operator="dilate" radius="${o.haloW || (X.game ? 3.8 : 3)}" result="dl"/><feFlood flood-color="${halo}"/><feComposite in2="dl" operator="in" result="hl"/><feMerge><feMergeNode in="hl"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    if (o.enraged) d += `<filter id="${p}rage" x="-8%" y="-8%" width="116%" height="116%"><feMorphology in="SourceAlpha" operator="dilate" radius="${X.game ? 5.5 : 4}" result="a"/><feMorphology in="SourceAlpha" operator="dilate" radius="${X.game ? 9.5 : 7}" result="b"/><feFlood flood-color="${K.ink}"/><feComposite in2="b" operator="in" result="bk"/><feFlood flood-color="${K.hostile}"/><feComposite in2="a" operator="in" result="co"/><feMerge><feMergeNode in="bk"/><feMergeNode in="co"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    return d;
  }

  const META = {};
  const BUILD = {};
  PN.bossesA = {
    K, META, BUILD, mk, _baseDefs: baseDefs,
    ids: ['butcher', 'gaoler', 'maw'],
    // draw(id, {phase:1|2|3, windup:bool, enraged:bool, lod:'art'|'game', halo:true|color|null, silhouette:bool, shadow:bool, fx:bool})
    draw(id, opts) {
      const b = BUILD[id]; if (!b) throw new Error('bossesA: unknown id ' + id);
      const X = mk(opts), m = META[id], o = X.o;
      const parts = b(X);                    // {ground, body, fx}
      const pre = baseDefs(X, m.env);
      const sil = o.silhouette;
      let body = `<g filter="url(#${X.p}rough)">${parts.body}</g>`;
      if (o.enraged && !sil) body = `<g filter="url(#${X.p}rage)">${body}</g>`;
      if ((o.halo === true || o.halo) && !sil) body = `<g filter="url(#${X.p}halo)">${body}</g>`;
      if (sil) body = `<g filter="url(#${X.p}sil)">${body}</g>`;
      const shadow = o.shadow && !sil ? `<ellipse cx="200" cy="331" rx="135" ry="55" fill="${K.ink}" opacity="0.26"/><ellipse cx="200" cy="336" rx="104" ry="38" fill="${K.ink}" opacity="0.22"/>` : '';
      const ground = sil ? '' : (parts.ground || '');
      const fx = o.fx && !sil ? (parts.fx || '') : '';
      return `<g class="bossA bossA-${id}"><defs>${pre}${X.defs.join('')}</defs>${shadow}${ground}${body}${fx}</g>`;
    }
  };
})(window.PN);
// ---------------------------------------------------------------- 잉크 도살자 (butcher · Ch1 St5 · dash) — shapes, cleaver, fist
// Hunched 3/4 stance facing right, torso pitched ~15° forward, paper-bag head sunk below the shoulder line.
// Near (right) arm: elbow back, fist forward wrapping the sign-board cleaver (tilted 18° off vertical).
// Far (left) arm hangs, fist clenched on the meat-hook chain. Bowed trousered legs, heavy clogs on y=392.
(function (PN) {
  const A = PN.bossesA, K = A.K;
  A.META.butcher = {
    name: '잉크 도살자', en: 'INK BUTCHER', chapter: 1, stage: 5, pattern: 'dash', env: K.ch1,
    box: [400, 400], pivot: [200, 257], feet: 392, r: 135, gameScale: 0.4,
    face: [271, 150],     // paper-bag eye hole = weak point / reticle focus
    muzzle: [358, 321],   // sign-board cleaver (blade centre, idle) = dash lane origin side
    fist: [340, 262],     // near fist wrapping the cleaver handle (idle); windup fist (236,314), blade tip drags at ~(150,395)
    head: [270, 46],      // status-icon / windup '!' anchor (bottom-centre of mark), clear of hump + bag
    windupSec: 0.62
  };
  A.BSH = {
    // hunched torso: trapezius hump peaks behind/above the sunk head, belly thrusts forward-right
    torso: 'M 102,302 C 88,284 78,256 76,226 C 74,196 78,166 90,146 C 96,134 104,126 114,122 C 128,102 146,80 162,64 C 172,54 186,50 198,56 C 220,68 240,82 254,98 L 260,112 C 284,106 308,112 326,124 C 344,136 352,156 352,178 L 350,196 C 360,222 360,254 348,278 C 336,298 316,308 290,310 L 160,312 C 134,312 116,310 102,302 Z',
    torsoLit: 'M 116,120 C 130,100 146,80 160,64 C 170,54 184,50 198,54 C 216,64 234,76 248,90 C 230,82 214,80 198,82 L 204,90 L 182,94 C 164,104 150,116 136,128 L 142,136 L 122,140 Z',
    deltF: 'M 76,226 C 74,196 78,166 90,146 C 96,134 104,126 114,122 L 124,128 C 134,146 136,166 130,184 C 122,202 106,214 90,222 Z',
    deltN: 'M 290,148 C 292,128 308,116 328,118 C 346,120 358,136 356,156 C 354,174 344,186 330,192 L 300,194 C 292,184 288,166 290,148 Z',
    apron: 'M 252,204 L 302,200 C 314,216 324,234 334,252 C 348,266 354,286 352,306 L 350,334 L 336,324 L 324,338 L 310,326 L 294,340 L 280,326 L 264,340 L 250,326 L 236,338 L 224,324 L 212,332 C 208,304 212,278 220,258 C 232,244 244,226 252,204 Z',
    bag: 'M 226,130 L 234,120 L 242,128 L 250,116 L 258,126 L 266,114 L 274,124 L 284,114 L 294,126 C 298,152 300,180 298,202 C 274,212 248,212 228,204 C 224,178 224,154 226,130 Z',
    legB: 'M 146,300 C 132,318 120,336 122,352 L 130,360 C 132,366 138,372 142,376 L 190,376 C 192,366 188,356 182,348 C 190,334 198,316 200,300 Z',
    bootB: 'M 120,392 L 122,378 L 130,368 L 188,366 C 204,366 216,376 218,386 L 218,392 Z',
    legF: 'M 238,302 C 236,318 242,336 254,348 C 256,358 254,368 252,376 L 302,376 C 310,366 318,356 318,344 C 318,328 304,312 292,300 Z',
    bootF: 'M 244,392 L 246,378 L 254,368 L 306,366 C 324,366 340,376 344,386 L 344,392 Z',
    // windup (crouch lunge): back leg driven back, front knee over the toe
    legBw: 'M 150,304 C 134,320 116,336 106,354 L 100,368 L 148,378 C 154,362 166,346 182,332 C 192,322 198,312 198,302 Z',
    bootBw: 'M 74,392 L 76,380 L 86,370 L 142,368 C 154,370 162,380 162,388 L 162,392 Z',
    legFw: 'M 240,300 C 250,318 268,330 292,334 C 302,350 302,362 298,376 L 348,376 C 350,358 348,340 338,326 C 324,310 306,302 288,296 Z',
    bootFw: 'M 288,392 L 290,380 L 298,368 L 350,366 C 368,366 382,376 386,386 L 386,392 Z'
  };

  // sign-board cleaver in its own frame: handle axis x=0 (fist at 0,0), blade hangs +y. Rotate the frame to pose it.
  // K3-1f R7: paper.50 is for the face only — the steel edge highlight is paper.300 and its 4 rivets ink.300 (ink rim kept).
  A.butcherCleaver = function (X) {
    const { K, T } = X, ph = X.o.phase, LW = X.LW;
    const blade = 'M -29,22 L 29,22 L 29,100 L 22,106 L 8,102 L -4,108 L -29,102 Z';
    // rev 3 (K3 F-A3, user decisions Q3 · Q5): the shop sign shows a picture, not letters (the old 정육점 <text> and the
    // game strokes that read "HOI" are gone). ONE piece of meat hanging on a J hook inside the sign frame (x −21…17,
    // y 28…96): a short rounded bone end (no round knob), an ink lump widening downward to 26 with a round bottom, and
    // curved paper.300 fat seams (art 2, game 1 at ≥ 3.6 wide). Laid over the board's dots so it stays one clean shape.
    const lump = 'M -6,47 C -11.5,51 -14,60 -14,69 C -13.5,79 -7,85 0,84 C 7.5,83 12,77 12,68 C 11.5,58 8,50 4,46 C 1,48 -3,48 -6,47 Z';
    const meat = `<g transform="rotate(16 1 46)"><rect x="-2" y="33" width="6" height="16" rx="2.6" fill="${K.paper300}" stroke="${K.ink}" stroke-width="${X.f(1.5 * LW)}"/></g><path d="${lump}" fill="${K.ink}"/>` +
      (X.game ? T([-8.5, 54, -12, 64, -6.5, 77], 3, 'mid', K.paper300)
        : T([-8.5, 54, -12, 63, -10, 73, -5, 79], 2.2, 'mid', K.paper300) + T([3, 56, 6, 63, 5.5, 71], 1.6, 'mid', K.paper300)) +
      X.line('M -2,29 L -2,35 C -2,40.5 6,40.5 6,35', K.ink, 2.4);
    const crack = 'M 12,24 L 4,40 L 14,52 L 2,66 L 10,78 L 0,94 L 6,102';
    const inner = `<rect x="-30" y="18" width="62" height="92" fill="${K.paper300}"/>
      <path d="M -21,28 L 17,28 L 17,96 L -21,96 Z" fill="none" stroke="${K.ink}" stroke-width="${1.8 * LW}"/>
      ${X.ht('M -30,18 L 32,18 L 32,110 L -30,110 Z', 'd40', 0.72)}${X.ht('M 6,18 L 32,18 L 32,110 L 12,110 Z', 'd60', 0.5)}
      ${meat}
      <path d="M -30,70 L -18,76 L -22,86 L -10,92 L -14,110 L -30,110 Z" fill="${K.ink}"/>
      <path d="M 21,18 L 32,18 L 32,110 L 21,110 Z" fill="${K.ink300}"/>
      ${T([24.5, 28, 25, 60, 24.5, 96], 2.2, 'mid', K.paper300)}
      <path d="M 21,18 L 21,104" stroke="${K.ink}" stroke-width="${1.8 * LW}"/>
      ${[34, 54, 74, 92].map((y) => `<circle cx="26.5" cy="${y}" r="2.4" fill="${K.ink300}" stroke="${K.ink}" stroke-width="1.2"/>`).join('')}
      ${[[-22, 24], [12, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${K.ink}"/>`).join('')}
      ${ph >= 2 ? `<path d="${crack}" fill="none" stroke="${K.ink}" stroke-width="${5 * LW}" stroke-linejoin="round"/><path d="${crack}" fill="none" stroke="${K.paper50}" stroke-width="${2 * LW}" stroke-linejoin="round"/>` : ''}`;
    // wrapped handle + ring pommel + riveted ferrule
    const handle = X.S('M -7,-52 L 7,-52 L 8,24 L -8,24 Z', K.ink500, 4.2, `${[-48, -42, -36, -30].map((y) => `<path d="M -8,${y} L 8,${y + 4}" stroke="${K.ink}" stroke-width="1.8"/>`).join('')}${X.R([-4, -50, -4, -40, -4, -30], 1.8)}`);
    return `${handle}<circle cx="0" cy="-59" r="7" fill="none" stroke="${K.ink}" stroke-width="${4.4 * LW}"/><circle cx="0" cy="-59" r="7" fill="none" stroke="${K.ink300}" stroke-width="1.4" stroke-dasharray="10 6"/>
      ${X.S(blade, K.paper300, 5.5, inner)}
      ${X.C([29, 22, 32, 62, 28, 100], 4.4)}${X.C([28, 102, 12, 104, -2, 106], 3.6)}
      ${X.R([-27, 30, -28, 60, -27, 92], 1.6)}
      ${X.S('M -11,14 L 11,14 L 12,26 L -12,26 Z', K.ink500, 2.6, X.R([-9, 16.5, 0, 16, 9, 16.5], 1.6))}<circle cx="-6" cy="20" r="1.8" fill="${K.ink100}"/><circle cx="6" cy="20" r="1.8" fill="${K.ink100}"/>
      ${X.drip(-20, 102, 20, 3.8)}${X.drip(14, 102, 14, 3)}`;
  };

  // clenched fist wrapped around a vertical handle (frame: handle axis x=0, fist centre 0,0).
  // Back of hand faces up-left; 4 finger wedges stack on the right; thumb crosses the top. Knuckle wedges ink.500 + 1.5px paper.300 rim.
  A.butcherFist = function (X, s = 1) {
    const { K } = X, P = (x, y) => `${X.f(x * s)},${X.f(y * s)}`;
    const back = `M ${P(-24, -14)} C ${P(-22, -26)} ${P(-6, -30)} ${P(8, -26)} L ${P(22, -18)} C ${P(28, -6)} ${P(28, 10)} ${P(22, 22)} L ${P(4, 26)} C ${P(-12, 26)} ${P(-24, 18)} ${P(-26, 4)} Z`;
    let fing = '';
    for (let i = 0; i < 4; i++) {
      const y0 = -18 + i * 10.5, y1 = y0 + 10;
      const d = `M ${P(4, y0)} L ${P(20, y0 - 1)} C ${P(27, y0 + 1)} ${P(27, y1 - 1)} ${P(21, y1)} L ${P(4, y1)} Z`;
      fing += `<path d="${d}" fill="${K.ink500}" stroke="${K.ink}" stroke-width="${X.f(2 * X.LW)}" stroke-linejoin="round"/>` +
        `<path d="M ${P(6, y0 + 1.6)} L ${P(20, y0 + 0.8)} C ${P(23.5, y0 + 1.6)} ${P(24.5, y0 + 3.4)} ${P(24.5, y0 + 5)}" fill="none" stroke="${K.paper300}" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    const inner = `<path d="M ${P(-28, 6)} C ${P(-26, -16)} ${P(-10, -28)} ${P(12, -28)} L ${P(8, -20)} C ${P(-6, -20)} ${P(-16, -10)} ${P(-18, 4)} Z" fill="${K.ink500}"/>
      ${X.ht(`M ${P(-30, 8)} L ${P(4, 8)} L ${P(4, 30)} L ${P(-30, 30)} Z`, 'd60')}${X.R([-24 * s, -4 * s, -18 * s, -22 * s, 2 * s, -28 * s], 1.8)}`;
    const thumb = `M ${P(-20, -20)} C ${P(-12, -30)} ${P(6, -30)} ${P(16, -22)} L ${P(14, -14)} C ${P(4, -18)} ${P(-8, -16)} ${P(-16, -10)} Z`;
    return `${X.S(back, K.ink700, 5, inner)}${fing}
      <path d="${thumb}" fill="${K.ink500}" stroke="${K.ink}" stroke-width="${X.f(2.6 * X.LW)}" stroke-linejoin="round"/>${X.R([-16 * s, -21 * s, -4 * s, -26 * s, 12 * s, -22 * s], 1.5)}
      ${X.C([24 * s, -14 * s, 30 * s, 4 * s, 22 * s, 22 * s], 4)}${X.C([22 * s, 22 * s, 8 * s, 28 * s, -8 * s, 25 * s], 3.4)}`;
  };
})(window.PN);
// ---------------------------------------------------------------- 잉크 도살자 builder (idle / windup are separate drawings, not transforms)
(function (PN) {
  const A = PN.bossesA;
  A.BUILD.butcher = function (X) {
    const { K, T, o } = X, ph = o.phase, wu = o.windup, SH = A.BSH;
    // windup = shoulders dropped + chest pitched further forward (rigid upper body), legs redrawn as a crouch lunge
    const UP = wu ? { tx: 10, ty: 18, a: 11 } : { tx: 0, ty: 0, a: 0 };
    const upT = wu ? `transform="translate(${UP.tx},${UP.ty}) rotate(${UP.a} 200 320)"` : '';
    // ---- far arm: hangs, fist clenched on the hook chain
    const hook = `${X.chain(71, 330, 68, 346, 3, 2)}
      <path d="M 68,352 C 63,364 63,374 66,382 C 72,398 100,398 103,380 C 104,372 101,366 97,361" fill="none" stroke="${K.ink}" stroke-width="${8.5 * X.LW}" stroke-linecap="round"/>
      <path d="M 67,358 C 65,366 66,374 68,380 C 72,390 90,392 96,382" fill="none" stroke="${K.ink300}" stroke-width="${2 * X.TW}" stroke-linecap="round"/>
      <path d="M 99,366 L 90,346 L 104,358 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="68" cy="349" r="6.5" fill="none" stroke="${K.ink}" stroke-width="${4.6 * X.LW}"/>
      ${X.drip(84, 394, 10, 3)}`;
    const cuff = (x, y, a) => `<g transform="rotate(${a} ${x} ${y})">${X.S(`M ${x - 25},${y - 7} C ${x - 12},${y - 13} ${x + 12},${y - 13} ${x + 25},${y - 7} L ${x + 24},${y + 7} C ${x + 10},${y + 2} ${x - 10},${y + 2} ${x - 24},${y + 7} Z`, K.ink500, 3.6, X.R([x - 20, y - 6, x, y - 11, x + 20, y - 6], 1.6) + X.ht(`M ${x - 26},${y} L ${x + 26},${y} L ${x + 26},${y + 10} L ${x - 26},${y + 10} Z`, 'd60'))}</g>`;
    const farArm = `${X.limb([88, 174], [60, 240], 25, 21, { bulge: 1.08 })}${cuff(62, 230, 22)}
      ${X.limb([60, 240], [70, 294], 22, 19, { bulge: 1.16, brk0: true })}
      ${hook}<g transform="translate(72,308)">${A.butcherFist(X, 0.92)}</g>`;
    const strap = X.S('M 78,236 C 112,246 168,252 218,250 L 218,266 C 168,268 112,262 80,254 Z', K.ink300, 3.4, `${X.ht('M 70,230 L 222,230 L 222,272 L 70,272 Z', 'd40', 0.85)}${X.R([84, 240, 150, 250, 214, 252], 1.4)}`) +
      X.S('M 100,258 L 148,262 L 152,306 L 104,302 Z', K.ink700, 4, `${X.ht('M 128,258 L 156,258 L 156,310 L 134,310 Z', 'd60')}<path d="M 106,266 L 146,270 M 108,296 L 148,300" stroke="${K.ink300}" stroke-width="1.3" stroke-dasharray="3 3"/>${X.R([104, 268, 104, 284, 106, 298], 1.6)}`) +
      [[110, 232, 8], [122, 226, 9], [136, 234, 8]].map(([x, y, w]) => X.S(`M ${x},${y} L ${x + w},${y} L ${x + w},262 L ${x},262 Z`, K.ink500, 2.6, X.R([x + 2, y + 3, x + 2, y + 12, x + 2, y + 22], 1.4)) + X.rivet(x + w / 2, y + 6, 1.7)).join('') +
      `<path d="M 118,304 L 122,322 L 126,304 Z" fill="${K.paper300}" stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"/>`;
    const deltF = X.S(SH.deltF, K.ink, 6, `<path d="M 72,218 C 70,188 76,160 88,144 C 96,132 106,124 118,120 C 110,136 102,154 100,172 L 108,178 L 90,188 Z" fill="${K.ink500}"/>
        ${X.ht('M 100,174 C 102,156 110,138 122,124 L 130,134 C 118,146 112,164 110,182 Z', 'l20')}${X.R([80, 200, 80, 168, 94, 142], 2.4)}`) +
      X.brk('M 112,124 C 130,138 136,158 130,178 C 124,196 110,208 92,218') + X.C([114, 122, 134, 138, 138, 162, 130, 180], 4.2);
    // ---- legs: bowed trousers (ink.700) with knee break, clogs with ink.500 toe caps
    const trouser = (d, lit, knee, dots, crease, cont) => X.S(d, K.ink700, 5.5, `<path d="${lit}" fill="${K.ink500}"/>${X.ht(dots, 'd60')}<path d="${knee}" fill="${K.ink}"/>${X.Ts(crease, K.ink)}`) + X.C(cont, 4.8);
    const clog = (d, cap, glint, sole) => X.S(d, K.ink, 5.5, `<path d="${cap}" fill="${K.ink500}"/>${T(glint, 2.2, 'mid', K.paper300)}<path d="${sole}" stroke="${K.ink500}" stroke-width="3"/>`);
    const patch = (x, y) => X.S(`M ${x - 13},${y - 11} L ${x + 12},${y - 13} L ${x + 14},${y + 11} L ${x - 11},${y + 13} Z`, K.ink300, 2.6, X.ht(`M ${x - 16},${y - 16} L ${x + 16},${y - 16} L ${x + 16},${y + 16} L ${x - 16},${y + 16} Z`, 'd40') + [[-9, -8], [8, -10], [10, 8], [-8, 10]].map(([a, b]) => `<path d="M ${x + a - 2.4},${y + b - 2.4} l 4.8,4.8 m 0,-4.8 l -4.8,4.8" stroke="${K.paper300}" stroke-width="1.3"/>`).join(''));
    const legs = wu ? `${trouser(SH.legBw, 'M 150,304 C 134,320 116,336 106,354 L 118,352 C 130,336 146,322 164,310 Z', 'M 104,358 L 132,350 L 118,368 Z', 'M 170,306 L 204,306 L 204,386 L 140,386 C 160,358 176,334 170,306 Z', [[124, 340, 138, 346, 150, 340, 2, 'mid']], [198, 302, 194, 322, 170, 342, 148, 378])}
        ${patch(134, 340)}${clog(SH.bootBw, 'M 128,370 C 142,372 154,380 158,390 L 150,390 C 146,382 138,376 126,374 Z', [132, 373, 146, 376, 154, 386], 'M 76,386 L 160,386')}
        ${trouser(SH.legFw, 'M 240,300 C 250,316 266,326 288,330 L 290,322 C 270,318 256,310 250,298 Z', 'M 338,326 L 310,340 L 342,346 Z', 'M 310,300 L 356,300 L 356,380 L 330,380 C 336,350 330,322 310,300 Z', [[300, 346, 312, 350, 326, 346, 2, 'mid']], [338, 326, 350, 344, 350, 360, 348, 376])}
        ${clog(SH.bootFw, 'M 348,368 C 364,370 378,378 383,388 L 372,388 C 368,380 360,374 346,372 Z', [352, 372, 366, 376, 376, 386], 'M 290,386 L 386,386')}` :
      `${trouser(SH.legB, 'M 146,300 C 134,316 124,334 124,350 L 134,346 C 138,332 146,318 160,306 Z', 'M 121,352 L 150,346 L 132,363 Z', 'M 178,300 L 206,300 L 206,382 L 168,382 C 184,360 188,330 178,300 Z', [[152, 340, 164, 344, 176, 338, 2, 'mid']], [200, 300, 196, 322, 182, 340, 186, 358])}
        ${patch(146, 344)}${clog(SH.bootB, 'M 188,368 C 200,370 210,378 213,388 L 204,388 C 202,380 196,374 186,372 Z', [190, 372, 202, 376, 208, 386], 'M 122,386 L 216,386')}
        ${trouser(SH.legF, 'M 238,302 C 238,318 244,334 256,346 L 262,340 C 254,328 250,316 252,302 Z', 'M 319,344 L 292,347 L 312,359 Z', 'M 298,300 L 324,300 L 324,382 L 292,382 C 302,360 306,330 298,300 Z', [[262, 352, 276, 356, 290, 350, 2, 'mid']], [292, 300, 308, 314, 320, 330, 318, 346])}
        ${clog(SH.bootF, 'M 306,368 C 322,370 336,378 341,388 L 330,388 C 326,380 318,374 304,372 Z', [308, 372, 324, 376, 334, 386], 'M 246,386 L 344,386')}`;
    // ---- torso: hump lit crescent with zigzag terminator, fat-fold highlights, pec wedge, belly contours
    const torso = X.S(SH.torso, K.ink, 6.5, `<path d="${SH.torsoLit}" fill="${K.ink500}"/>
        ${X.ht('M 136,136 C 150,114 170,98 196,88 C 206,84 216,82 226,84 L 216,96 C 200,98 184,106 170,116 C 158,126 150,136 144,148 Z', 'l20')}
        ${X.R([118, 116, 136, 92, 160, 64], 2.6)}${X.R([176, 54, 214, 64, 250, 92], 2)}
        <path d="M 128,176 C 136,156 152,142 172,138 L 166,150 L 180,152 C 162,160 150,172 142,188 Z" fill="${K.ink500}"/>${X.R([130, 172, 140, 152, 170, 140], 1.6)}
        ${X.Ts([[244, 100, 250, 110, 258, 116, 2.4, 'mid'], [236, 110, 244, 120, 254, 126, 2, 'mid']], K.ink500)}
        <path d="M 196,218 C 212,206 236,204 252,210 L 248,224 L 232,222 L 222,232 L 212,226 C 206,228 200,232 196,236 Z" fill="${K.ink500}"/>
        ${X.Ts([[108, 238, 124, 248, 146, 244, 2.6, 'mid'], [112, 272, 130, 280, 152, 274, 2.4, 'mid'], [156, 292, 176, 298, 200, 294, 2, 'mid']], K.ink500)}
        <path d="M 78,232 C 80,262 90,286 106,302 L 114,296 C 102,278 96,256 94,236 Z" fill="${K.ink500}"/>`) +
      X.C([352, 196, 362, 226, 360, 256, 348, 278], 6.4) + X.C([348, 278, 336, 298, 316, 308, 290, 310], 5.6) + X.C([290, 310, 240, 314, 190, 314, 160, 312], 4.4);
    // ---- apron: ink-soaked leather (ink.300 under 40% dots), zigzag black hem, belly crescent, running splash
    const tear = 'M 212,288 L 230,276 L 244,288 L 262,268 L 280,282 L 298,264 L 316,278 L 334,260 L 356,270';
    const apron = X.S(SH.apron, K.ink300, 5.5, `${X.ht('M 200,196 L 360,196 L 360,360 L 200,360 Z', 'd40', 0.9)}
        ${X.ht('M 318,196 L 360,196 L 360,360 L 332,360 C 344,300 336,240 318,196 Z', 'd60', 0.8)}
        <path d="M 340,232 L 292,244 L 346,258 Z" fill="${K.ink}"/>
        <path d="M 218,280 C 252,306 316,306 356,270 L 356,284 C 318,318 252,322 216,294 Z" fill="${K.ink}"/>
        <path d="M 206,314 L 222,304 L 236,316 L 252,304 L 268,318 L 284,302 L 300,316 L 316,300 L 332,314 L 356,302 L 356,360 L 206,360 Z" fill="${K.ink}"/>
        <path d="M 278,212 C 288,226 290,244 282,256 C 288,266 286,280 276,286 L 278,298 L 270,298 L 270,288 C 264,278 268,266 270,258 C 260,248 266,226 278,212 Z" fill="${K.ink}"/>
        ${T([252, 214, 236, 250, 222, 300], 2.4, 'mid', K.ink100, 'opacity="0.75"')}${T([258, 208, 280, 204, 300, 204], 2, 'mid', K.ink100, 'opacity="0.7"')}
        ${ph >= 2 ? `<path d="${tear} L 356,360 L 206,360 Z" fill="${K.ink}"/><path d="${tear}" fill="none" stroke="${K.paper300}" stroke-width="${2.4 * X.LW}" stroke-linejoin="round"/>` : ''}`) +
      X.C([334, 252, 350, 266, 354, 288, 352, 306], 4.6) +
      (ph >= 2 ? `<path d="M 298,264 L 316,278 L 322,320 L 304,332 Z" fill="${K.ink300}" ${X.O(3)}/>${X.drip(244, 288, 26, 4.4)}${X.drip(282, 282, 34, 4.6)}${X.drip(334, 262, 20, 3.6)}` :
        `${X.drip(236, 334, 22, 4.2)}${X.drip(280, 324, 32, 4.6)}${X.drip(324, 332, 18, 3.8)}`) +
      `<path d="M 218,262 C 206,252 194,256 190,266 C 196,276 208,274 218,268 Z M 216,268 C 206,286 204,304 208,320 L 216,318 C 216,302 218,288 222,272 Z" fill="${K.ink300}" ${X.O(3)}/><circle cx="218" cy="265" r="5" fill="${K.ink300}" ${X.O(2.4)}/>`;
    // ---- near shoulder cap
    const deltN = X.S(SH.deltN, K.ink, 6, `<path d="M 288,152 C 288,128 306,114 328,116 C 342,118 352,126 356,138 C 344,132 330,134 320,142 L 326,150 L 306,154 C 300,162 296,172 294,184 Z" fill="${K.ink500}"/>
        ${X.ht('M 296,176 C 300,162 312,154 326,154 L 318,166 C 308,168 302,176 300,186 Z', 'l20')}${X.R([292, 146, 298, 124, 326, 118], 2.6)}`) +
      X.brk('M 291,168 C 294,182 298,190 302,195') + X.C([357, 150, 358, 172, 348, 186, 330, 193], 5.2);
    // ---- paper-bag head (face = weak point, <=12%, heavy ink frame)
    // rev 3 (K3 F-A3): the stamp circle and its 肉 are gone in both LODs (a ring inside the bag is a fake eye; no lettering).
    // game is redrawn for 156px rather than shrunk: no wrinkle strokes, the lower band a flat paper.300 plane (not big 20%
    // dots), 2 short wide ink drips under the eye hole, 3 stitches spaced 12.6 so eye, mouth and drips stay apart at 0.4.
    // The near arm (drawn over the head) hides the bag right of x≈280 at mouth height, so in game the stitched mouth is
    // moved into the visible window (x 236…275) and the front fold stops above it; art keeps its mouth and fold. The P3
    // drip at x 262 then runs between the 2nd and 3rd stitch instead of through one.
    const band = 'M 220,178 C 250,188 276,188 306,172 L 306,216 L 220,216 Z';
    const bag = X.S(SH.bag, K.paper, 6, `${X.ht('M 286,110 L 306,110 L 306,216 L 282,216 C 290,180 290,140 286,110 Z', 'd40')}
        ${X.game ? `<path d="${band}" fill="${K.paper300}"/>` : X.ht(band, 'd20')}
        <path d="${X.game ? 'M 250,118 C 252,150 252.2,166 251.4,177' : 'M 250,118 C 252,150 252,178 250,208'}" fill="none" stroke="${K.ink}" stroke-width="${2 * X.LW}"/>
        <path d="M 228,124 L 294,122 L 296,136 L 285,129 L 274,138 L 264,129 L 254,138 L 244,131 L 230,138 Z" fill="${K.ink}"/>
        ${X.game ? '' : X.Ts([[231, 148, 235, 158, 233, 170, 1.4, 'mid'], [240, 142, 244, 150, 242, 158, 1.3, 'mid'], [293, 150, 289, 162, 293, 176, 1.6, 'mid'], [254, 198, 266, 196, 278, 200, 1.3, 'mid']], K.ink)}`) +
      X.C([298, 128, 303, 158, 303, 184, 298, 204], 4.6) + X.C([298, 204, 274, 213, 250, 213, 228, 205], 3.4);
    const eye = ph >= 3 ? '' : `<path d="M 260,146 L 268,138 L 276,143 L 285,138 L 290,150 L 284,162 L 272,165 L 263,158 Z" fill="${K.ink}" ${X.O(1.6)}/>
      <ellipse cx="275" cy="151" rx="7" ry="5" fill="${K.paper50}"/><circle cx="277.6" cy="151.6" r="2.6" fill="${K.ink}"/>${X.game ? X.drip(266, 160, 20, 5) + X.drip(282, 163, 13, 4.2) : X.drip(266, 160, 38, 3.4) + X.drip(281, 163, 22, 2.8)}`;
    let mouth = X.line(X.game ? 'M 236,190 C 252,195 270,192 290,184' : 'M 254,188 C 266,192 280,190 294,182', K.ink, 2.8);
    if (X.game) [[243.1, 191.7], [255.7, 192.4], [268.3, 190.8]].forEach(([x, y]) => { const f = X.f; mouth += X.line(`M ${f(x - 3.8)},${f(y - 5.2)} L ${f(x + 3.8)},${f(y + 5.2)} M ${f(x + 3.8)},${f(y - 5.2)} L ${f(x - 3.8)},${f(y + 5.2)}`, K.ink, 2.6); });
    else for (let i = 0; i < 5; i++) { const x = 258 + i * 8.4, y = 190 - i * 1.6; mouth += X.line(`M ${x - 3.2},${y - 4.4} L ${x + 3.2},${y + 4.4} M ${x + 3.2},${y - 4.4} L ${x - 3.2},${y + 4.4}`, K.ink, 2); }
    const twine = `<path d="M 226,202 C 250,212 276,210 300,198" fill="none" stroke="${K.ink}" stroke-width="${5.5 * X.LW}"/><path d="M 226,202 C 250,212 276,210 300,198" fill="none" stroke="${K.ink300}" stroke-width="2.2" stroke-dasharray="5 3"/>
      <circle cx="296" cy="200" r="4.6" fill="${K.ink300}" ${X.O(2.2)}/>${T([297, 204, 305, 214, 306, 228], 3.2, 'end', K.ink300, `stroke="${K.ink}" stroke-width="1.5"`)}${T([294, 205, 293, 216, 289, 228], 2.8, 'end', K.ink300, `stroke="${K.ink}" stroke-width="1.5"`)}`;
    const broken = ph >= 3 ? `<path d="M 250,116 L 258,132 L 252,146 L 264,154 L 258,168 L 272,176 L 282,170 L 292,182 L 302,178 L 298,112 Z" fill="${K.ink}" ${X.O(3)}/>
      <path d="M 250,116 L 258,132 L 252,146 L 264,154 L 258,168 L 272,176 L 282,170 L 292,182 L 302,178" fill="none" stroke="${K.paper300}" stroke-width="${2.6 * X.LW}" stroke-linejoin="round"/>
      <ellipse cx="278" cy="144" rx="10" ry="7.5" fill="${K.paper50}"/><circle cx="281" cy="145" r="3.4" fill="${K.ink}"/>
      ${X.drip(262, 170, 34, 3.8)}${X.drip(282, 176, 26, 3.4)}${X.drip(252, 150, 18, 2.8)}` : '';
    const headT = wu ? 'transform="rotate(7 262 206) translate(2,5)"' : 'transform="rotate(-4 262 206)"';
    const head = `<g ${headT}>${bag}${eye}${mouth}${twine}${broken}</g>`;
    // ---- near arm: elbow back, forearm forward, fist wrapping the cleaver handle
    let nearArm;
    if (!wu) {
      nearArm = `${X.limb([320, 174], [290, 234], 26, 23, { bulge: 1.08 })}${cuff(292, 226, -30)}
        ${X.limb([290, 236], [328, 256], 24, 20, { bulge: 1.18, brk0: true })}
        <g transform="translate(340,262) rotate(-17)">${A.butcherCleaver(X)}${A.butcherFist(X)}</g>`;
    } else {
      nearArm = `${X.limb([348, 208], [312, 266], 26, 23, { bulge: 1.08 })}${cuff(315, 257, -30)}
        ${X.limb([312, 266], [250, 306], 24, 20, { bulge: 1.18, brk0: true })}
        <g transform="translate(236,314) rotate(62)">${A.butcherCleaver(X)}${A.butcherFist(X)}</g>`;
    }
    const farT = wu ? 'transform="rotate(14 92 150)"' : '';
    const body = `${legs}<g ${upT}>${torso}${strap}<g ${farT}>${farArm}</g>${deltF}${apron}${head}${deltN}${wu ? '' : nearArm}</g>${wu ? nearArm : ''}`;
    let fx = '';
    if (o.enraged) {
      const ey = ph >= 3 ? 144 : 151, ex = ph >= 3 ? 278 : 275;
      fx += `<g ${upT}><g ${headT}>${X.Ts([[226, 122, 210, 104, 234, 90, 216, 68, 13, 'start'], [252, 116, 270, 98, 242, 82, 262, 54, 16, 'start'], [278, 120, 296, 106, 284, 90, 300, 74, 11, 'start'], [216, 68, 208, 56, 220, 48, 214, 36, 6, 'start'], [262, 54, 268, 42, 258, 34, 266, 22, 7, 'start']], K.ink, `stroke="${K.ink}" stroke-width="1.5"`)}
        ${X.Ts([[228, 118, 218, 104, 232, 94, 220, 78, 3.5, 'start'], [253, 112, 264, 98, 246, 86, 258, 66, 4.5, 'start'], [279, 116, 290, 106, 282, 96, 292, 84, 3, 'start']], K.paper50)}
        ${[[204, 80, 6], [284, 64, 5], [248, 36, 4.5], [304, 84, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${K.ink}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.35}" fill="${K.paper50}"/>`).join('')}
        <ellipse cx="${ex}" cy="${ey}" rx="13" ry="10" fill="${K.paper50}" filter="url(#${X.p}glow)"/><ellipse cx="${ex}" cy="${ey}" rx="7.5" ry="5.4" fill="${K.paper50}"/></g></g>`;
    }
    if (wu) fx += `${X.Ts([[150, 397, 128, 395, 74, 399, 5.5, 'start'], [152, 390, 132, 388, 92, 390, 3.4, 'start'], [154, 404, 136, 405, 104, 406, 2.6, 'start']], K.ink)}
      ${[[156, 392], [148, 384], [164, 380], [140, 396]].map(([x, y], i) => `<path d="M ${x},${y} l ${-7 - i * 2},-${4 + i} l 1,6 Z" fill="${K.paper50}" stroke="${K.ink}" stroke-width="1.8" stroke-linejoin="round"/>`).join('')}
      ${X.bang(300, 64, 0.9)}${X.Ts([[112, 72, 96, 60, 74, 50, 4, 'end'], [92, 104, 72, 98, 48, 96, 3.4, 'end'], [150, 50, 142, 34, 130, 18, 3.4, 'end']], K.ink)}`;
    const ground = `<ellipse cx="${wu ? 232 : 232}" cy="393" rx="${wu ? 150 : 110}" ry="7" fill="${K.ink}" opacity="0.5"/>`;
    return { ground, body, fx };
  };
})(window.PN);
// ---------------------------------------------------------------- 종탑 간수 (gaoler · Ch1 St10 · rings) — shapes + bell + key + lantern + chimes
// Bell head tilted 8° toward facing. Tower-key staff crosses the body diagonally (bow upper-right, ward bit lower-left),
// gripped at chest height by a plated gauntlet. Lantern arm raised to hip height from under the eave cape.
(function (PN) {
  const A = PN.bossesA, K = A.K;
  A.META.gaoler = {
    name: '종탑 간수', en: 'BELFRY GAOLER', chapter: 1, stage: 10, pattern: 'rings', env: K.ch1,
    box: [400, 400], pivot: [200, 257], feet: 392, r: 135, gameScale: 0.4,
    face: [235, 132],     // keyhole eye in the 당좌 (bell tilted 8°) = weak point
    muzzle: [210, 121],   // bell body = ripple / ring-shot origin
    head: [200, 0],       // status-icon / windup '!' anchor (bottom-centre), above the bell loop
    windupSec: 0.6,
    grip: [286, 248]      // gauntlet grip on the staff (idle)
  };
  A.GSH = {
    bell: 'M 168,54 C 170,48 184,44 200,44 C 216,44 230,48 232,54 C 244,76 252,114 256,146 C 258,162 264,174 272,184 C 246,196 154,196 128,184 C 136,174 142,162 144,146 C 148,114 156,76 168,54 Z',
    cape: 'M 140,180 C 116,186 92,182 62,164 L 52,154 C 60,182 76,206 96,224 C 150,238 256,238 306,224 C 326,206 340,182 348,154 L 338,164 C 308,182 284,186 262,180 Z',
    coat: 'M 108,220 L 294,220 C 302,262 314,306 328,352 C 332,366 336,378 340,388 L 318,382 L 302,392 L 282,381 L 262,391 L 242,381 L 222,392 L 202,381 L 182,391 L 162,381 L 142,391 L 122,381 L 100,388 C 98,360 100,320 102,284 C 104,256 104,236 108,220 Z',
    cage: 'M 160,312 L 160,256 C 160,226 244,226 244,256 L 244,312 Z',
    lantern: 'M 22,278 L 70,278 L 76,292 L 72,332 L 20,332 L 16,292 Z'
  };

  A.gaolerBell = function (X) {
    const { K, T } = X, ph = X.o.phase, SH = A.GSH, f = X.f;
    // 유곽 cell. rev 3 (K3 F-A1) game: no circle (two circled cells read as a second pair of eyes over the keyhole);
    // the recessed cell's lower-right half catches the key light (ink.500), the ink.300 frame laid back on top.
    const nip = (x0, y0, w, h, skew) => {
      let s = `<path d="M ${x0},${y0} L ${x0 + w},${y0 + skew} L ${x0 + w},${y0 + h + skew} L ${x0},${y0 + h} Z" fill="${K.ink700}" stroke="${K.ink300}" stroke-width="${1.4 * X.TW}"/>`;
      if (X.game) return s + `<path d="M ${x0 + w},${y0 + skew} L ${x0 + w},${y0 + h + skew} L ${x0},${y0 + h} Z" fill="${K.ink500}"/><path d="M ${x0},${y0} L ${x0 + w},${y0 + skew} L ${x0 + w},${y0 + h + skew} L ${x0},${y0 + h} Z" fill="none" stroke="${K.ink300}" stroke-width="${1.4 * X.TW}"/>`;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const x = x0 + w * (0.2 + 0.3 * i), y = y0 + h * (0.2 + 0.3 * j) + skew * (0.2 + 0.3 * i);
        s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(w * 0.1)}" fill="${K.ink500}" stroke="${K.ink}" stroke-width="1"/><circle cx="${f(x - 1)}" cy="${f(y - 1)}" r="0.9" fill="${K.ink100}"/>`;
      }
      return s;
    };
    const wave = (y, x0, x1) => { let d = `M ${x0},${y}`; for (let x = x0; x < x1; x += 12) d += ' q 3,-5 6,0 q 3,5 6,0'; return `<path d="${d}" fill="none" stroke="${K.ink300}" stroke-width="${1.3 * X.TW}"/>`; };
    const crack = 'M 168,190 L 175,172 L 166,158 L 178,142 L 170,124 L 180,108';
    const inner = `
      <path d="M 140,40 L 176,40 C 164,80 158,130 160,200 L 120,200 Z" fill="${K.ink500}"/>
      ${X.ht('M 150,40 L 196,40 C 186,90 182,140 186,200 L 150,200 Z', 'l40')}
      ${X.Ts([[158, 70, 152, 120, 150, 176, 4, 'mid'], [166, 62, 163, 96, 162, 130, 1.6, 'mid']], K.paper300, 'opacity="0.75"')}
      ${T([246, 80, 254, 128, 262, 176], 2, 'mid', K.ink300)}
      <path d="M 140,54 L 260,54 L 262,68 L 138,68 Z" fill="${K.ink700}"/>${wave(61, 150, 250)}
      <path d="M 138,54 L 262,54 M 136,68 L 264,68" stroke="${K.ink300}" stroke-width="${1.2 * X.TW}"/>
      ${nip(154, 74, 26, 34, -2)}${nip(210, 72, 30, 30, 2)}
      <path d="M 130,162 L 270,162 L 272,178 L 128,178 Z" fill="${K.ink700}"/>${wave(170, 140, 262)}
      <path d="M 132,162 L 268,162" stroke="${K.ink300}" stroke-width="${1.2 * X.TW}"/>
      ${ph >= 2 ? `<path d="${crack}" fill="none" stroke="${K.ink}" stroke-width="${6 * X.LW}" stroke-linejoin="round"/><path d="${crack}" fill="none" stroke="${K.paper50}" stroke-width="${2.4 * X.LW}" stroke-linejoin="round"/>` : ''}
      ${ph >= 3 ? `<path d="M 248,188 L 240,170 L 250,160 L 240,146" fill="none" stroke="${K.ink}" stroke-width="${5 * X.LW}" stroke-linejoin="round"/><path d="M 248,188 L 240,170 L 250,160 L 240,146" fill="none" stroke="${K.paper50}" stroke-width="${2.2 * X.LW}" stroke-linejoin="round"/>` : ''}`;
    // 용뉴 loop + 음통
    const top = `<path d="M 186,48 C 178,26 194,12 208,18 C 220,24 222,38 214,48" fill="none" stroke="${K.ink}" stroke-width="${10 * X.LW}" stroke-linecap="round"/>
      ${X.R([188, 42, 184, 28, 204, 22], 2.2)}
      <path d="M 208,18 C 214,10 224,12 224,20 C 220,18 214,20 212,24 Z" fill="${K.ink}" ${X.O(2)}/>
      <path d="M 224,22 L 236,22 L 236,48 L 224,48 Z" fill="${K.ink}" ${X.O(3)}/><path d="M 223,30 h14 M 223,38 h14" stroke="${K.ink300}" stroke-width="1.4"/>
      <ellipse cx="230" cy="22" rx="6" ry="2.4" fill="${K.ink500}" stroke="${K.ink}" stroke-width="1.6"/>`;
    // 당좌 lotus medallion with a TRUE keyhole: round top + tapering slot, 3px ink frame, paper.50 inner rim, eye in the round part
    let petals = '';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8, cx = 226 + Math.cos(a) * 20, cy = 136 + Math.sin(a) * 20; petals += `<path d="M ${f(226 + Math.cos(a) * 13)},${f(136 + Math.sin(a) * 13)} Q ${f(cx + Math.cos(a + 1.2) * 7)},${f(cy + Math.sin(a + 1.2) * 7)} ${f(226 + Math.cos(a) * 27)},${f(136 + Math.sin(a) * 27)} Q ${f(cx + Math.cos(a - 1.2) * 7)},${f(cy + Math.sin(a - 1.2) * 7)} ${f(226 + Math.cos(a) * 13)},${f(136 + Math.sin(a) * 13)} Z" fill="${i >= 4 && i <= 6 ? K.ink300 : K.ink500}" stroke="${K.ink}" stroke-width="1.5"/>`; }
    const kr = ph >= 3 ? 10 : 9;
    const key = `M ${226 - kr},128 A ${kr} ${kr} 0 1 1 ${226 + kr},128 C ${226 + kr},${128 + kr * 0.7} ${226 + kr * 0.55},${128 + kr * 0.95} ${226 + kr * 0.45},${128 + kr * 1.1} L ${226 + kr * 0.8},156 L ${226 - kr * 0.8},156 L ${226 - kr * 0.45},${128 + kr * 1.1} C ${226 - kr * 0.55},${128 + kr * 0.95} ${226 - kr},${128 + kr * 0.7} ${226 - kr},128 Z`;
    const er = X.game ? 1.25 : 1;
    const medal = `${petals}<circle cx="226" cy="136" r="16" fill="${K.ink700}" stroke="${K.ink}" stroke-width="2"/><circle cx="226" cy="136" r="16" fill="none" stroke="${K.ink300}" stroke-width="1" stroke-dasharray="2 3"/>
      <path d="${key}" fill="${K.ink}" stroke="${K.ink}" stroke-width="${3 * X.LW}" stroke-linejoin="round"/>
      <path d="${key}" fill="none" stroke="${K.paper50}" stroke-width="1.2" transform="translate(226 136) scale(0.8) translate(-226 -136)"/>
      <ellipse cx="226.5" cy="128" rx="${f(6.2 * er)}" ry="${f(4.4 * er)}" fill="${K.paper50}"/><circle cx="228.6" cy="128.4" r="${f(2.4 * er)}" fill="${K.ink}"/>
      ${X.Ts([[222, 156, 221, 166, 223, 178, 2.4, 'start'], [226.5, 156, 227, 170, 226, 186, 2.8, 'start'], [231, 156, 232, 164, 231, 174, 2, 'start']], K.paper50, 'opacity="0.92"')}`;
    const rim = `<path d="M 128,184 C 154,196 246,196 272,184" fill="none" stroke="${K.ink}" stroke-width="${7 * X.LW}" stroke-linecap="round"/><path d="M 134,184 C 160,193 240,193 266,184" fill="none" stroke="${K.ink300}" stroke-width="${1.8 * X.TW}"/>`;
    // P3: a chip knocked out of the bell lip (silhouette-level phase marker)
    const chip = ph >= 3 ? `<path d="M 238,194 L 244,180 L 252,186 L 258,176 L 266,190 Z" fill="${A._envBase || K.ch1.base}"/><path d="M 238,194 L 244,180 L 252,186 L 258,176 L 266,190" fill="none" stroke="${K.ink}" stroke-width="${3 * X.LW}" stroke-linejoin="round"/><path d="M 244,183 L 252,189 L 257,180" fill="none" stroke="${K.paper50}" stroke-width="1.6"/>` : '';
    return `${top}${X.S(SH.bell, K.ink, 6.5, inner)}${X.R([170, 56, 154, 92, 146, 140], 2.6)}${X.C([234, 58, 250, 96, 256, 140, 270, 182], 5)}${rim}${medal}${chip}`;
  };

  // tower-key staff in its own frame: grip at (0,0), shaft along -y (bow) / +y (ward bit, resting on the ground)
  A.gaolerKey = function (X) {
    const { K, T } = X, f = X.f;
    const gap = (d, w) => `<path d="${d}" fill="none" stroke="${K.ink300}" stroke-width="${f((w + 4) * X.LW)}" stroke-linejoin="round"/>`;
    const shaft = 'M -7,-214 L 7,-214 L 7,142 L 0,150 L -7,142 Z';
    const bit = 'M 6,70 L 40,70 L 40,84 L 48,84 L 48,100 L 30,100 L 30,112 L 46,112 L 46,128 L 38,128 L 38,142 L 6,142 Z';
    return `${gap(shaft, 4)}${gap(bit, 3.4)}
      ${X.S(bit, K.ink500, 3.4, `<path d="M 6,70 L 40,70 L 40,77 L 6,77 Z M 40,84 L 48,84 L 48,90 L 40,90 Z M 30,112 L 46,112 L 46,118 L 30,118 Z" fill="${K.ink300}"/>${X.ht('M 20,70 L 50,70 L 50,146 L 20,146 Z', 'd60', 0.7)}`)}
      ${X.S(shaft, K.ink700, 4, `<path d="M -7,-214 L -2,-214 L -2,146 L -7,146 Z" fill="${K.ink500}"/>${X.R([-4.5, -208, -4.5, -40, -4.5, 138], 1.6)}`)}
      ${[-190, -140, -92, -44, 40].map((y) => `<rect x="-11" y="${y}" width="22" height="8" rx="1.5" fill="${K.ink500}" ${X.O(2.4)}/><path d="M -9,${y + 2} L 9,${y + 2}" stroke="${K.ink300}" stroke-width="1.2"/>`).join('')}
      ${X.C([7, -208, 8, -60, 7, 138], 3)}
      <circle cx="0" cy="-232" r="15" fill="none" stroke="${K.ink300}" stroke-width="${f(13 * X.LW)}"/>
      <circle cx="0" cy="-232" r="15" fill="none" stroke="${K.ink}" stroke-width="${f(9 * X.LW)}"/><circle cx="0" cy="-232" r="15" fill="none" stroke="${K.ink500}" stroke-width="${f(2.6 * X.TW)}" stroke-dasharray="14 6"/>
      <path d="M -7,-247 C -15,-250 -21,-249 -26,-254 C -18,-258 -8,-263 0,-268 C 8,-263 18,-258 26,-254 C 21,-249 15,-250 7,-247 Z" fill="${K.ink}" stroke="${K.ink300}" stroke-width="${f(5.6 * X.LW)}" paint-order="stroke" stroke-linejoin="round"/>
      <path d="M -7,-247 C -15,-250 -21,-249 -26,-254 C -18,-258 -8,-263 0,-268 C 8,-263 18,-258 26,-254 C 21,-249 15,-250 7,-247 Z" fill="none" stroke="${K.ink}" stroke-width="${f(2.4 * X.LW)}" stroke-linejoin="round"/>
      ${X.R([-22, -254, -11, -259, 0, -266], 1.6)}
      <path d="M 0,-268 L 0,-278" stroke="${K.ink}" stroke-width="${f(3.4 * X.LW)}" stroke-linecap="round"/><circle cx="0" cy="-280" r="3.2" fill="${K.ink}"/>`;
  };

  // plated gauntlet wrapped round the staff (same frame as the key): back plate right, thumb over the top, 3 finger wedges across the shaft
  A.gaolerGauntlet = function (X) {
    const { K } = X;
    const back = 'M 6,-24 C 20,-30 36,-24 40,-10 L 40,14 C 34,26 20,28 8,22 Z';
    let s = X.S(back, K.ink700, 5, `<path d="M 6,-24 C 20,-30 36,-24 40,-10 L 30,-8 C 26,-18 16,-20 8,-16 Z" fill="${K.ink500}"/>${X.ht('M 20,6 L 44,6 L 44,30 L 20,30 Z', 'd60')}${X.R([10, -22, 24, -28, 38, -14], 1.8)}`);
    s += X.rivet(30, -4, 2.4) + X.rivet(24, 12, 2.2);
    [-12, -1, 10].forEach((y, i) => {
      const d = `M 14,${y - 5} L -12,${y - 6} C -20,${y - 5} -21,${y + 5} -13,${y + 6} L 14,${y + 6} Z`;
      s += `<path d="${d}" fill="${K.ink500}" stroke="${K.ink}" stroke-width="${X.f(2.4 * X.LW)}" stroke-linejoin="round"/><path d="M 12,${y - 3.4} L -11,${y - 4.2} C -15,${y - 4} -17,${y - 2} -17,${y}" fill="none" stroke="${K.paper300}" stroke-width="1.5" stroke-linecap="round"/><path d="M -2,${y - 5.5} L -2,${y + 5.5}" stroke="${K.ink}" stroke-width="1.4"/>`;
    });
    s += `<path d="M 10,-26 C -2,-32 -16,-30 -22,-22 L -16,-16 C -10,-22 0,-22 8,-18 Z" fill="${K.ink500}" stroke="${K.ink}" stroke-width="${X.f(2.6 * X.LW)}" stroke-linejoin="round"/>${X.R([-18, -21, -8, -28, 6, -26], 1.5)}`;
    return s + X.C([40, -10, 44, 4, 40, 16], 3.6);
  };

  // raised paper lantern (hangs from the fist at 46,252) with a folded-paper bird inside
  // rev 3 (K3 F-A1): the bird is pressed below the keyhole eye: game = flat ink.300, art = paper.300 under 40% dots.
  A.gaolerLantern = function (X) {
    const { K, T } = X, SH = A.GSH, en = X.o.enraged;
    const folds = ['M -11,4 L 0,12 L 13,2 L 1,-1 Z', 'M -3,2 L -9,-17 L 4,-1 Z', 'M 3,1 L 12,-15 L 8,2 Z', 'M -9,5 L -15,-7 L -21,-7 L -14,-10 L -5,2 Z', 'M 11,3 L 19,-9 L 14,5 Z'];
    const bird = `<g transform="translate(46,306)" stroke="${K.ink}" stroke-width="1.5" stroke-linejoin="round" fill="${X.game ? K.ink300 : K.paper300}">
      ${folds.map((d) => `<path d="${d}"/>`).join('')}${X.game ? '' : `<path d="${folds.join(' ')}" fill="url(#${X.p}d40)" stroke="none"/>`}
      <path d="M 0,12 L 1,-1 M -9,-17 L -1,1" fill="none" stroke-width="1"/></g>`;
    return `${X.chain(46, 256, 46, 266, 1, 0, 3.2)}
      <path d="M 14,278 L 78,278 L 68,266 L 24,266 Z" fill="${K.ink}" ${X.O(3.5)}/><path d="M 10,278 C 28,273 64,273 82,278" fill="none" stroke="${K.ink}" stroke-width="${4.4 * X.LW}" stroke-linecap="round"/>
      <path d="M 10,278 C 6,272 6,268 10,264 M 82,278 C 86,272 86,268 82,264" fill="none" stroke="${K.ink}" stroke-width="${3.4 * X.LW}" stroke-linecap="round"/>
      ${X.S(SH.lantern, K.ink700, 5, `<path d="M 16,280 L 72,280 L 72,334 L 16,334 Z" fill="${K.ink300}"/>${en ? X.flame(46, 334, 56, 36, -4) + X.flame(30, 334, 30, 14, -8) + X.flame(62, 334, 34, 14, 7) : bird}
        <path d="M 22,280 L 22,334 M 70,280 L 70,334" stroke="${K.ink}" stroke-width="${3 * X.LW}"/>${X.ht('M 58,278 L 80,278 L 80,336 L 60,336 Z', 'd40', 0.7)}${X.R([19, 286, 17, 306, 20, 328], 1.6)}`)}
      <path d="M 20,332 L 72,332 L 64,342 L 28,342 Z" fill="${K.ink}" ${X.O(3)}/>${X.drip(46, 342, 14, 3.4)}
      ${en ? X.flame(46, 266, 44, 24, 6) + X.flame(34, 268, 26, 11, -6) : ''}`;
  };

  // 풍경 wind chime hung on a visible cord from an eave tip (x,y): bronze cup + clapper + paper fish plate
  // rev 3 (K3 F-A1): the fish is a prop, not a face, so it is pressed below the keyhole eye (bible §4.2, §10.2-2):
  //   game = flat ink.300; art = paper.300 under 40% dots, its eye and gill marks kept in art only, in ink.300.
  //   `loud` draws the two sound arcs only. No lettering: the old 「딩—」 <text> is gone (CONTEXT §2, story outro-1).
  A.gaolerChime = function (X, x, y, sw, loud) {
    const { K, T } = X, f = X.f;
    const cup = `M ${x - 11},${y + 38} C ${x - 11},${y + 22} ${x - 6},${y + 16} ${x},${y + 16} C ${x + 6},${y + 16} ${x + 11},${y + 22} ${x + 11},${y + 38} Z`;
    const fish = `M ${x - 12},${y + 60} C ${x - 6},${y + 51} ${x + 5},${y + 51} ${x + 11},${y + 58} L ${x + 17},${y + 52} L ${x + 16},${y + 66} L ${x + 11},${y + 61} C ${x + 5},${y + 68} ${x - 6},${y + 68} ${x - 12},${y + 60} Z`;
    const fishPlate = `<path d="${fish}" fill="${X.game ? K.ink300 : K.paper300}" stroke="${K.ink}" stroke-width="${f(1.8 * X.LW)}" stroke-linejoin="round"/>` +
      (X.game ? '' : X.ht(fish, 'd40') + `<circle cx="${x - 6}" cy="${y + 58}" r="1.5" fill="${K.ink300}"/><path d="M ${x - 1},${y + 55} C ${x + 1},${y + 58} ${x + 1},${y + 62} ${x - 1},${y + 64} M ${x + 4},${y + 56} C ${x + 6},${y + 59} ${x + 6},${y + 62} ${x + 4},${y + 64}" fill="none" stroke="${K.ink300}" stroke-width="1"/>`);
    return `<g transform="rotate(${sw} ${x} ${y})">
      <path d="M ${x},${y} L ${x},${y + 17}" stroke="${K.ink}" stroke-width="${f(2.2 * X.LW)}"/>
      ${X.S(cup, K.ink, 2.6, X.R([x - 7, y + 22, x - 8, y + 29, x - 8, y + 36], 1.8))}<path d="M ${x - 13},${y + 38} L ${x + 13},${y + 38}" stroke="${K.ink}" stroke-width="${f(3 * X.LW)}" stroke-linecap="round"/>
      <path d="M ${x},${y + 38} L ${x},${y + 52}" stroke="${K.ink}" stroke-width="1.6"/><circle cx="${x}" cy="${y + 42}" r="2.6" fill="${K.ink}"/>
      ${fishPlate}</g>
      ${loud ? `<g fill="none" stroke="${K.ink}" stroke-linecap="round"><path d="M ${x - 22},${y + 22} C ${x - 30},${y + 30} ${x - 30},${y + 44} ${x - 22},${y + 52}" stroke-width="${f(3 * X.LW)}"/><path d="M ${x - 32},${y + 12} C ${x - 44},${y + 26} ${x - 44},${y + 50} ${x - 32},${y + 64}" stroke-width="${f(2.4 * X.LW)}"/></g>` : ''}`;
  };
})(window.PN);
// ---------------------------------------------------------------- 종탑 간수 builder
(function (PN) {
  const A = PN.bossesA;
  const bz = (p, t) => { const u = 1 - t; return [u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6], u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7]]; };
  A.BUILD.gaoler = function (X) {
    const { K, T, o } = X, ph = o.phase, wu = o.windup, SH = A.GSH, f = X.f;
    // ---- tiled eave cape: ridges + round tile-ends along the eave
    const segs = [[52, 154, 60, 182, 76, 206, 96, 224], [96, 224, 150, 238, 256, 238, 306, 224], [306, 224, 326, 206, 340, 182, 348, 154]];
    const eave = []; segs.forEach((sg, k) => { const n = k === 1 ? 11 : 4; for (let i = (k ? 1 : 0); i <= n; i++) eave.push(bz(sg, i / n)); });
    let ridges = '', ends = '';
    eave.forEach(([x, y], i) => {
      const cx = 200 + (x - 200) * 0.28, cy = 176;
      ridges += `<path d="M ${f(cx)},${cy} L ${f(x)},${f(y)}" stroke="${K.ink}" stroke-width="${2.4 * X.LW}"/><path d="M ${f(cx - 3)},${cy} L ${f(x - 5)},${f(y - 2)}" stroke="${K.ink500}" stroke-width="${2.2 * X.TW}" opacity="${x < 200 ? 1 : 0.55}"/>`;
      if (!X.game || i % 2 === 0) ends += `<circle cx="${f(x)}" cy="${f(y)}" r="${X.game ? 7 : 5.6}" fill="${K.ink}" stroke="${K.ink}" stroke-width="1.5"/><circle cx="${f(x)}" cy="${f(y)}" r="${X.game ? 4 : 3.4}" fill="none" stroke="${K.ink300}" stroke-width="${1.3 * X.TW}"/><circle cx="${f(x - 1.6)}" cy="${f(y - 1.8)}" r="1.1" fill="${K.ink100}"/>`;
    });
    const cape = X.S(SH.cape, K.ink, 6, `${ridges}
      ${[0.34, 0.62].map((k) => `<path d="M ${f(52 + 14 * k)},${f(154 - 8 * k + 30 * k)} C ${f(62 + 20 * k)},${f(182 - 10 * k)} ${f(78 + 22 * k)},${f(206 - 14 * k)} ${f(98 + 24 * k)},${f(224 - 20 * k)} C ${f(150 + 10 * k)},${f(238 - 26 * k)} ${f(256 - 10 * k)},${f(238 - 26 * k)} ${f(306 - 24 * k)},${f(224 - 20 * k)} C ${f(326 - 22 * k)},${f(206 - 14 * k)} ${f(340 - 20 * k)},${f(182 - 10 * k)} ${f(348 - 14 * k)},${f(154 + 22 * k)}" fill="none" stroke="${K.ink}" stroke-width="${2.2 * X.LW}"/>`).join('')}${X.ht('M 40,150 L 200,150 L 200,240 L 40,240 Z', 'l20')}
      <path d="M 52,154 C 90,176 120,184 144,182 L 146,190 C 118,194 86,186 56,166 Z" fill="${K.ink500}"/>
      ${X.R([56, 156, 96, 178, 140, 184], 2.6)}${X.R([262, 184, 300, 180, 344, 158], 2)}`) + ends +
      `<path d="M 52,154 C 46,146 46,138 52,132" fill="none" stroke="${K.ink}" stroke-width="${5 * X.LW}" stroke-linecap="round"/><path d="M 348,154 C 354,146 354,138 348,132" fill="none" stroke="${K.ink}" stroke-width="${5 * X.LW}" stroke-linecap="round"/>` +
      X.C([306, 224, 326, 206, 340, 182, 348, 156], 4.4) + X.C([96, 226, 150, 240, 256, 240, 306, 226], 3.6);
    // ---- 풍경 x3 on cords from the two upturned tips + the front-left eave corner; P2: the left one swings and rings
    const chimes = A.gaolerChime(X, 52, 134, ph >= 2 ? 22 : 0, ph >= 2) + A.gaolerChime(X, 348, 134, 0, false) + A.gaolerChime(X, 98, 226, 0, false);
    // ---- boots + robe
    const boots = `${X.S('M 164,395 L 168,378 L 212,378 C 222,382 228,388 230,395 Z', K.ink, 5, `<path d="M 196,380 C 210,381 222,386 226,392 L 216,392 C 212,386 204,383 194,383 Z" fill="${K.ink500}"/>`)}
      ${X.S('M 232,395 L 236,380 L 276,380 C 288,384 294,389 296,395 Z', K.ink, 5, `<path d="M 262,382 C 276,383 288,387 292,393 L 282,393 C 278,387 270,385 260,385 Z" fill="${K.ink500}"/>`)}`;
    const coat = X.S(SH.coat, K.ink, 6.5, `
      <path d="M 106,222 L 128,222 C 124,270 124,330 130,392 L 96,392 C 96,340 100,280 106,222 Z" fill="${K.ink500}"/>
      ${X.ht('M 124,222 L 150,222 C 146,280 148,340 156,392 L 128,392 C 122,330 122,270 124,222 Z', 'l40')}
      ${X.ht('M 150,222 L 166,222 C 164,280 166,340 172,392 L 156,392 C 148,340 146,280 150,222 Z', 'l20')}
      ${X.R([108, 226, 102, 300, 102, 384], 2.8)}
      <path d="M 172,330 C 176,352 180,372 188,392 L 170,392 C 168,370 168,350 172,330 Z" fill="${K.ink500}"/><path d="M 236,330 C 244,354 252,374 262,392 L 250,392 C 242,372 236,352 236,330 Z" fill="${K.ink500}" opacity="0.8"/>${X.Ts([[146, 330, 142, 356, 146, 384, 2.4, 'mid'], [206, 334, 208, 362, 212, 388, 2.2, 'mid'], [288, 330, 298, 358, 310, 380, 2, 'mid']], K.ink500)}${X.line('M 204,326 L 202,392', K.ink300, 1.4)}`) +
      X.C([294, 222, 304, 280, 318, 330, 340, 388], 5.2);
    const drop = (x, y, l, w) => `<g stroke="${K.ink300}" stroke-width="1">${X.drip(x, y, l, w)}</g>`;
    const hemDrips = ph >= 3 ? `${drop(142, 388, 30, 4.8)}${drop(202, 388, 38, 5)}${drop(262, 388, 28, 4.4)}${drop(318, 384, 34, 4.6)}` :
      `${X.drip(142, 388, 18, 4)}${X.drip(202, 388, 24, 4.2)}${X.drip(262, 388, 16, 3.6)}${X.drip(318, 384, 20, 3.8)}`;
    const lapels = `${X.S('M 146,222 L 162,222 L 166,318 L 150,318 Z', K.ink, 3.5, X.R([150, 226, 152, 270, 156, 314], 2))}
      ${X.S('M 244,222 L 258,222 L 254,318 L 240,318 Z', K.ink, 3.5, T([250, 226, 250, 270, 248, 314], 1.6, 'mid', K.ink500))}`;
    // ---- chest cage: iron bars, trapped ink soul (eyeless since rev 3 F-A1: the keyhole is the only face); P3 door swung open, soul core exposed
    const open = ph >= 3;
    const soul = open ? 'M 184,306 C 176,282 180,258 192,246 C 186,238 190,228 200,226 C 212,228 216,238 210,246 C 222,258 226,282 218,306 C 210,298 208,308 200,300 C 194,308 190,298 184,306 Z'
      : 'M 188,304 C 184,284 186,266 194,256 C 190,250 192,242 200,240 C 208,242 212,250 208,256 C 216,266 218,284 214,304 C 208,298 206,306 200,300 C 196,306 192,298 188,304 Z';
    const bars = open ? `<path d="M 172,236 L 172,312 M 228,236 L 228,312" stroke="${K.ink}" stroke-width="${3 * X.LW}" opacity="0.7"/>`
      : [172, 186, 200, 214, 228].map((x) => `<path d="M ${x},226 L ${x},314" stroke="${K.ink}" stroke-width="${5 * X.LW}"/><path d="M ${x - 1.4},230 L ${x - 1.4},312" stroke="${K.ink500}" stroke-width="1.2"/>`).join('') + `<path d="M 158,272 L 246,272" stroke="${K.ink}" stroke-width="${4.5 * X.LW}"/>`;
    const door = open ? X.S('M 160,236 L 128,246 L 128,322 L 160,312 Z', K.ink700, 4.4, `${[138, 148].map((x) => `<path d="M ${x},230 L ${x},326" stroke="${K.ink}" stroke-width="${4 * X.LW}"/><path d="M ${x - 1.2},242 L ${x - 1.2},318" stroke="${K.ink300}" stroke-width="1.2"/>`).join('')}<path d="M 126,284 L 162,274" stroke="${K.ink}" stroke-width="${3.6 * X.LW}"/>`) +
      `<rect x="156" y="240" width="8" height="12" rx="2" fill="${K.ink500}" ${X.O(2)}/><rect x="156" y="294" width="8" height="12" rx="2" fill="${K.ink500}" ${X.O(2)}/>` +
      `<path d="M 126,300 C 118,306 118,316 124,322" fill="none" stroke="${K.ink}" stroke-width="${3 * X.LW}"/><rect x="112" y="320" width="16" height="13" rx="2" fill="${K.ink300}" ${X.O(2.4)} transform="rotate(-14 120 326)"/>` : '';
    const cage = X.S(SH.cage, K.ink700, 6, `
      <ellipse cx="200" cy="274" rx="${open ? 40 : 30}" ry="${open ? 44 : 36}" fill="${K.ink300}" opacity="${open ? 0.75 : 0.35}"/>
      <path d="${soul}" fill="${open ? K.paper300 : K.ink100}" opacity="${open ? 1 : 0.8}" stroke="${K.ink}" stroke-width="${open ? 2 : 0}"/>
      ${open ? X.drip(196, 300, 16, 3) + X.drip(210, 302, 12, 2.6) : ''}
      ${bars}${X.ht('M 214,226 L 250,226 L 250,316 L 222,316 Z', 'd40', 0.6)}`) +
      `<path d="M 162,254 C 164,232 236,232 240,254" fill="none" stroke="${K.ink300}" stroke-width="${1.4 * X.TW}"/>` +
      [[163, 258], [241, 258], [163, 308], [241, 308]].map(([x, y]) => X.rivet(x, y, 3)).join('') + door +
      (open ? '' : `<path d="M 240,268 C 240,258 256,258 256,268" fill="none" stroke="${K.ink}" stroke-width="${3.4 * X.LW}"/><rect x="238" y="268" width="20" height="16" rx="2.5" fill="${K.ink300}" ${X.O(2.6)}/><path d="M 248,273 L 248,279" stroke="${K.ink}" stroke-width="2.6" stroke-linecap="round"/>`);
    // ---- belt + key ring (left hip, clear of the staff)
    const belt = `<path d="M 102,314 C 160,322 250,322 312,312 L 314,328 C 250,338 160,338 100,330 Z" fill="${K.ink700}" ${X.O(3.5)}/>${X.R([106, 318, 200, 326, 308, 316], 1.6)}
      <rect x="190" y="316" width="20" height="18" rx="2" fill="none" stroke="${K.ink300}" stroke-width="${3 * X.TW}"/>
      <circle cx="134" cy="340" r="10" fill="none" stroke="${K.ink}" stroke-width="${6.5 * X.LW}"/><circle cx="134" cy="340" r="10" fill="none" stroke="${K.ink300}" stroke-width="2"/>
      ${[[126, 350, 122, 370], [136, 351, 138, 374]].map(([a, b, c, d]) => `<path d="M ${a},${b} L ${c},${d}" stroke="${K.ink}" stroke-width="${6 * X.LW}" stroke-linecap="round"/><path d="M ${a},${b} L ${c},${d}" stroke="${K.ink500}" stroke-width="2.2" stroke-linecap="round"/><path d="M ${c - 4},${d - 5} l 7,2" stroke="${K.ink}" stroke-width="2.4"/>`).join('')}`;
    // ---- lantern arm: forearm emerges from under the left eave, gauntlet fist holds the lantern ring at hip height
    const lanternArm = `${A.gaolerLantern(X)}${X.limb([88, 204], [54, 242], 17, 15, { bulge: 1.06, fill: K.ink700 })}
      ${X.S('M 34,236 C 38,226 58,224 66,234 L 68,252 C 60,262 42,262 36,254 Z', K.ink700, 4.6, `<path d="M 34,238 C 40,228 56,226 64,232 L 56,238 C 50,234 42,236 38,244 Z" fill="${K.ink500}"/>${X.ht('M 40,248 L 70,248 L 70,264 L 40,264 Z', 'd60')}`)}
      ${[0, 1, 2].map((i) => `<path d="M ${40 + i * 8},250 L ${42 + i * 8},258" stroke="${K.ink}" stroke-width="1.6"/>`).join('')}${X.brk('M 70,214 C 76,222 78,230 74,238')}`;
    // ---- key staff + gauntlet (idle: diagonal across the body; windup: raised high, bow over the bell)
    const G = wu ? [318, 150] : A.META.gaoler.grip, rot = wu ? -8 : 19;
    const keyT = `transform="translate(${G[0]},${G[1]}) rotate(${rot})"`;
    const forearm = wu ? X.limb([360, 204], [352, 134], 18, 15, { bulge: 1.06 }) : X.limb([346, 204], [328, 242], 18, 15, { bulge: 1.06 });
    const bellT = 'transform="rotate(8 200 190)"';
    const body = `${boots}${coat}${hemDrips}${lapels}${cage}${belt}${lanternArm}${wu ? '' : forearm}${cape}${chimes}<g ${bellT}>${A.gaolerBell(X)}</g>
      ${wu ? forearm : ''}<g ${keyT}>${A.gaolerKey(X)}${A.gaolerGauntlet(X)}</g>`;
    let fx = '';
    if (ph >= 3) fx += `<g stroke="${K.ink300}" stroke-width="1">${X.drip(52, 160, 30, 4.8)}${X.drip(348, 160, 26, 4.4)}${X.drip(150, 236, 28, 4.4)}${X.drip(256, 236, 32, 4.6)}</g>`;
    if (o.enraged) fx += `<g ${bellT}><ellipse cx="226.5" cy="129" rx="12" ry="10" fill="${K.paper50}" filter="url(#${X.p}glow)"/><ellipse cx="226.5" cy="129" rx="6" ry="4.4" fill="${K.paper50}"/><circle cx="228" cy="129.4" r="1.8" fill="${K.ink}"/></g>`;
    if (wu) fx += `${X.bang(186, 4, 0.85)}<path d="M 292,-78 C 262,-84 250,-30 252,26" fill="none" stroke="${K.ink}" stroke-width="2.6" stroke-dasharray="7 5"/><path d="M 243,18 L 253,40 L 262,18 Z" fill="${K.ink}"/>`;
    const ground = `<ellipse cx="220" cy="394" rx="94" ry="7" fill="${K.ink}" opacity="0.45"/>`;
    return { ground, body, fx };
  };
})(window.PN);
// ---------------------------------------------------------------- 용광의 입 (maw · Ch2 St10 · flame) — shapes + parts
// Cast-iron stove idol. Face (firebox) stays frontal; body leans on ONE planted knuckle fist (left) while the right
// stovepipe arm is lifted with a bent, rivet-collared elbow. Organ pipes carry V-cut mouths; soot = tapered brush plumes.
(function (PN) {
  const A = PN.bossesA, K = A.K;
  A.META.maw = {
    name: '용광의 입', en: 'FURNACE MAW', chapter: 2, stage: 10, pattern: 'flame', env: K.ch2,
    box: [400, 400], pivot: [200, 257], feet: 392, r: 135, gameScale: 0.4,
    face: [206, 244],     // two white eyes deep in the firebox = weak point
    muzzle: [206, 284],   // firebox mouth = flame origin
    head: [206, 104],     // status-icon / windup '!' anchor (bottom-centre, over the finial)
    windupSec: 0.6
  };
  A.MSH = {
    body: 'M 124,166 C 128,136 160,116 200,114 C 240,116 272,136 276,166 C 304,196 314,240 306,284 C 300,314 290,334 280,346 L 120,346 C 110,334 100,314 94,284 C 86,240 96,196 124,166 Z',
    bodyLit: 'M 96,262 C 92,222 106,190 128,168 C 144,146 170,128 204,122 C 184,134 168,150 156,168 L 166,172 L 146,188 C 136,206 128,226 126,248 L 136,254 L 122,266 C 122,288 128,308 138,326 L 118,326 C 104,308 98,286 96,262 Z',
    collar: 'M 118,160 C 150,176 250,176 282,160 L 286,176 C 250,194 150,194 114,176 Z',
    base: 'M 108,338 L 292,338 L 300,356 L 100,356 Z',
    // gothic pointed-arch firebox (Ch2 chapel), keystone at the apex
    frame: 'M 136,318 L 136,238 C 136,208 162,180 206,152 C 250,180 276,208 276,238 L 276,318 Z',
    mouth: 'M 152,310 L 152,240 C 152,216 172,194 206,172 C 240,194 260,216 260,240 L 260,310 Z',
    legL: 'M 146,354 L 176,354 C 178,368 172,380 166,386 L 176,393 L 130,393 L 140,385 C 146,376 148,366 146,354 Z',
    legR: 'M 224,354 L 254,354 C 252,366 254,376 260,385 L 270,393 L 224,393 L 234,386 C 228,380 222,368 224,354 Z'
  };
  // straight stovepipe segment p0->p1 (width w): lit band on the key-light side, 60% dots + black on the other, flange rings
  A.pipeSeg = function (x0, y0, x1, y1, w) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L * w / 2, ny = dx / L * w / 2, f = (n) => n.toFixed(1);
    return `M ${f(x0 + nx)},${f(y0 + ny)} L ${f(x1 + nx)},${f(y1 + ny)} L ${f(x1 - nx)},${f(y1 - ny)} L ${f(x0 - nx)},${f(y0 - ny)} Z`;
  };
  A.mawPipe = function (X, p0, p1, w) {
    const { K } = X, f = X.f, [x0, y0] = p0, [x1, y1] = p1, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const sL = (-nx - ny) >= 0 ? 1 : -1, P = (t, s) => [x0 + dx * t + nx * s * w / 2, y0 + dy * t + ny * s * w / 2], q = (p) => f(p[0]) + ',' + f(p[1]);
    const band = (a, b) => `M ${q(P(-0.1, sL * a))} L ${q(P(1.1, sL * a))} L ${q(P(1.1, sL * b))} L ${q(P(-0.1, sL * b))} Z`;
    const inner = `<path d="${band(0.35, 1.2)}" fill="${K.ink500}"/>${X.ht(band(-0.1, -0.7), 'd60')}<path d="${band(-0.7, -1.3)}" fill="${K.ink}"/>` +
      X.R([...P(0.04, sL * 0.8), ...P(0.5, sL * 0.84), ...P(0.96, sL * 0.8)], 1.8);
    return X.S(A.pipeSeg(x0, y0, x1, y1, w), K.ink700, 5.5, inner) + X.C([...P(0, -sL * 1.02), ...P(0.5, -sL * 1.06), ...P(1, -sL * 1.02)], 4.4);
  };
  // flange / collar ring across a joint (ellipse perpendicular to the pipe), with rivets
  A.mawCollar = function (X, x, y, rx, ry, a, rv) {
    const { K } = X, f = X.f;
    let s = `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="${K.ink}" ${X.O(4)}/><ellipse cx="${x}" cy="${y}" rx="${rx - 5}" ry="${Math.max(2, ry - 5)}" transform="rotate(${a} ${x} ${y})" fill="none" stroke="${K.ink500}" stroke-width="${f(2.4 * X.TW)}"/>`;
    s += `<path d="M ${f(x - rx * 0.8)},${f(y - ry * 0.4)} A ${rx} ${ry} ${a} 0 1 ${f(x + rx * 0.2)},${f(y - ry * 0.98)}" transform="rotate(${a} ${x} ${y})" fill="none" stroke="${K.ink300}" stroke-width="${f(1.6 * X.TW)}"/>`;
    if (rv) { const r = a * Math.PI / 180; [-0.62, 0, 0.62].forEach((k) => { s += X.rivet(f(x + Math.cos(r) * rx * k), f(y + Math.sin(r) * rx * k + ry * 0.45), 2.4); }); }
    return s;
  };
  // clenched iron fist: hand-back plate + 4 blocky fingers in a row + thumb block. (cx,cy) centre, planted = knuckles on the ground
  A.mawFist = function (X, cx, cy, s, planted, side) {
    const { K } = X, f = X.f, P = (x, y) => `${f(cx + x * s)},${f(cy + y * s)}`;
    const back = `M ${P(-30, -22)} C ${P(-26, -30)} ${P(26, -30)} ${P(30, -22)} L ${P(32, 2)} L ${P(-32, 2)} Z`;
    let o = X.S(back, K.ink700, 5, `<path d="M ${P(-34, -24)} L ${P(34, -24)} L ${P(34, -14)} L ${P(-34, -14)} Z" fill="${K.ink500}"/>${X.ht(`M ${P(-34, -8)} L ${P(34, -8)} L ${P(34, 4)} L ${P(-34, 4)} Z`, 'd60')}${X.R([cx - 26 * s, cy - 24 * s, cx, cy - 28 * s, cx + 26 * s, cy - 24 * s], 1.8)}`);
    o += X.rivet(f(cx - 16 * s), f(cy - 12 * s), 2.4) + X.rivet(f(cx + 16 * s), f(cy - 12 * s), 2.4);
    for (let i = 0; i < 4; i++) {
      const x0 = -32 + i * 16, h = planted ? 24 : 22 - Math.abs(i - 1.5) * 2;
      o += X.S(`M ${P(x0 + 1, 0)} L ${P(x0 + 15, 0)} L ${P(x0 + 15, h - 4)} C ${P(x0 + 15, h)} ${P(x0 + 1, h)} ${P(x0 + 1, h - 4)} Z`, K.ink500, 3.2, `<path d="M ${P(x0 + 1, 0)} L ${P(x0 + 6, 0)} L ${P(x0 + 6, h)} L ${P(x0 + 1, h)} Z" fill="${K.ink300}"/>${X.ht(`M ${P(x0 + 10, 0)} L ${P(x0 + 16, 0)} L ${P(x0 + 16, h)} L ${P(x0 + 10, h)} Z`, 'd60')}`);
    }
    const tx = side < 0 ? 28 : -28, tw = side < 0 ? 12 : -12;
    o += X.S(`M ${P(tx, -18)} L ${P(tx + tw, -14)} L ${P(tx + tw, 10)} L ${P(tx, 14)} Z`, K.ink500, 3.2, X.R([cx + (tx + tw * 0.3) * s, cy - 14 * s, cx + (tx + tw * 0.3) * s, cy, cx + (tx + tw * 0.3) * s, cy + 10 * s], 1.4));
    return o + X.C([cx + 32 * s, cy - 20 * s, cx + 34 * s, cy, cx + 30 * s, cy + 22 * s], 4.4);
  };
  // organ pipes behind the stove (5, tallest centre) with V-cut organ mouths; P2 snaps the right one
  A.mawPipes = function (X) {
    const { K } = X, ph = X.o.phase, f = X.f;
    const P = [[128, 78, 24], [164, 42, 28], [202, 12, 32], [240, 42, 28], [276, 78, 24]];
    let s = '';
    P.forEach(([x, top, w], i) => {
      const bent = ph >= 2 && i === 4, t0 = bent ? top + 26 : top, h = w / 2;
      const d = `M ${x - h},172 L ${x - h},${t0 + 6} L ${x + h},${t0 + 6} L ${x + h},172 Z`;
      const my = Math.min(i === 2 ? 104 : 140, t0 + 58);
      s += X.S(d, K.ink, 5, `<rect x="${x - h}" y="${t0}" width="${w * 0.3}" height="${172 - t0}" fill="${K.ink500}"/>
        ${X.ht(`M ${x - h + w * 0.3},${t0} L ${x},${t0} L ${x},172 L ${x - h + w * 0.3},172 Z`, 'l40')}
        ${X.line(`M ${x - h + 2.5},${t0 + 10} L ${x - h + 2.5},168`, K.ink300, 1.4)}
        <path d="M ${f(x - w * 0.34)},${my - 4} L ${x},${my - 20} L ${f(x + w * 0.34)},${my - 4} Z" fill="${K.ink500}" stroke="${K.ink}" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M ${f(x - w * 0.34)},${my - 4} L ${x},${my - 20}" stroke="${K.ink300}" stroke-width="1.2"/>
        <rect x="${f(x - w * 0.36)}" y="${my - 4}" width="${f(w * 0.72)}" height="6" fill="${K.ink}"/>
        <path d="M ${f(x - w * 0.36)},${my + 2} L ${f(x + w * 0.36)},${my + 2} L ${f(x + w * 0.3)},${my + 7} L ${f(x - w * 0.3)},${my + 7} Z" fill="${K.ink500}" stroke="${K.ink}" stroke-width="1.2"/>
        ${[t0 + 22, t0 + 92].filter((y) => y < 160 && Math.abs(y - my) > 14).map((y) => `<path d="M ${x - h},${y} L ${x + h},${y}" stroke="${K.ink500}" stroke-width="2"/>`).join('')}`);
      if (bent) s += `<path d="M ${x - h - 2},${t0 + 6} L ${x + h + 2},${t0 + 6} L ${x + h + 16},${t0 - 14} L ${x - h + 12},${t0 - 22} Z" fill="${K.ink}" ${X.O(4)}/>
        <path d="M ${x - h},${t0 + 6} L ${x - 2},${t0 + 14} L ${x + 4},${t0 + 4} L ${x + h},${t0 + 12}" fill="none" stroke="${K.paper50}" stroke-width="${2 * X.LW}" stroke-linejoin="round"/>`;
      else s += `<ellipse cx="${x}" cy="${t0 + 6}" rx="${h + 2}" ry="5" fill="${K.ink700}" ${X.O(3.4)}/><ellipse cx="${x}" cy="${t0 + 6}" rx="${h - 3}" ry="2.6" fill="${K.ink}"/>
        ${X.line(`M ${x - h},${t0 + 5} C ${x - w / 4},${t0 + 1} ${x + w / 4},${t0 + 1} ${x + h},${t0 + 5}`, K.ink300, 1.2)}`;
      s += X.C([x + h, t0 + 8, x + h + 1, t0 + 60, x + h, 168], 3.4);
    });
    return s;
  };
  // soot = 2–3 tapered dry-brush plumes per pipe (flat ink.300 + 20% dot tail), rising and bending away from the key light
  A.mawSoot = function (X, strong) {
    const { K } = X, f = X.f, T = PN.taper;
    const tops = [[128, 78, 1], [164, 42, 2], [202, 12, 3], [240, 42, 2], [276, 78, 1]];
    let s = '', tl = '';
    tops.forEach(([x, t, n], i) => {
      if (X.o.phase >= 2 && i === 4) t += 26;
      const m = strong ? n + 1 : n;
      for (let k = 0; k < m; k++) {
        const sp = (k - (m - 1) / 2) * 7, hgt = 44 + n * 10 - k * 6, bend = 18 + k * 8, w = 12 + n * 2 - k * 2;
        const pts = [x + sp * 0.4, t + 2, x + sp - 4, t - hgt * 0.4, x + sp + bend * 0.5, t - hgt * 0.7, x + sp + bend, t - hgt];
        s += T(pts, w, 'start', K.ink300);
        const tail = [pts[6] - 1, pts[7] + 2, pts[6] + bend * 0.35, pts[7] - 12, pts[6] + bend * 0.9, pts[7] - 20];
        tl += T(tail, w * 0.75, 'start', K.ink300, 'opacity="0.35"') + T(tail, w * 0.75, 'start', `url(#${X.p}d20)`);
      }
    });
    return `<g filter="url(#${X.p}soot)" opacity="0.95">${s}</g>${tl}`;
  };
})(window.PN);
// ---------------------------------------------------------------- 용광의 입 builder
(function (PN) {
  const A = PN.bossesA;
  const bz = (p, t) => { const u = 1 - t; return [u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6], u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7]]; };
  A.BUILD.maw = function (X) {
    const { K, T, o } = X, ph = o.phase, wu = o.windup, SH = A.MSH, f = X.f;
    X.defs.push(`<filter id="${X.p}soot" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${X.game ? 4 : 7}" xChannelSelector="R" yChannelSelector="G"/></filter>`);
    // ---- arms: left planted on its knuckles, right lifted with a bent, rivet-collared elbow
    const armL = `${A.mawPipe(X, [62, 258], [58, 342], 32)}${A.mawPipe(X, [116, 204], [62, 258], 36)}
      ${A.mawCollar(X, 116, 204, 22, 14, -45, false)}${A.mawCollar(X, 62, 258, 24, 15, 40, true)}${A.mawCollar(X, 58, 340, 20, 9, 0, false)}
      ${A.mawFist(X, 58, 368, 1, true, -1)}`;
    const armR = `${A.mawPipe(X, [284, 204], [350, 244], 36)}${A.mawPipe(X, [350, 246], [348, 302], 32)}
      ${A.mawCollar(X, 284, 204, 22, 14, 45, false)}${A.mawCollar(X, 350, 246, 25, 16, -30, true)}${A.mawCollar(X, 348, 300, 20, 9, 0, false)}
      ${A.mawFist(X, 348, 324, 0.95, false, 1)}`;
    // ---- cast-iron belly: designed lit crescent, 60% band under the collar, plate seams curving round the volume
    const crack = 'M 300,210 L 286,226 L 296,240 L 280,256 L 290,272 L 276,290';
    const hole = 'M 96,214 L 118,204 L 132,214 L 146,208 L 150,232 L 140,246 L 148,264 L 138,286 L 116,298 L 100,290 L 92,266 L 94,240 Z';
    let core = '';
    if (ph >= 3) {
      core = `<path d="${hole}" fill="${K.ink}" ${X.O(4)}/>` + X.clip(hole, `<rect x="88" y="200" width="66" height="104" fill="${K.paper300}"/>
        ${[0, 1, 2, 3].map((j) => `<path d="M 88,${218 + j * 22} C 110,${212 + j * 22} 130,${226 + j * 22} 154,${216 + j * 22}" fill="none" stroke="${K.ink}" stroke-width="${4 * X.LW}"/>`).join('')}
        ${[0, 1, 2].map((j) => `<path d="M ${104 + j * 18},200 L ${98 + j * 18},304" stroke="${K.ink}" stroke-width="${3 * X.LW}"/>`).join('')}
        ${X.ht('M 88,200 L 154,200 L 154,304 L 88,304 Z', 'd40', 0.45)}`) +
        `<path d="${hole}" fill="none" stroke="${K.paper300}" stroke-width="${2 * X.LW}" stroke-dasharray="7 5"/>${X.drip(118, 296, 30, 4.4)}${X.drip(138, 284, 22, 3.6)}${X.drip(100, 288, 18, 3)}`;
    }
    const merL = [128, 180, 108, 222, 106, 290, 122, 336], merR = [280, 180, 300, 222, 302, 290, 286, 336];
    const seam = (p) => X.line(`M ${p[0]},${p[1]} C ${p[2]},${p[3]} ${p[4]},${p[5]} ${p[6]},${p[7]}`, K.ink500, 2.6) + [0.14, 0.38, 0.62, 0.86].map((t) => { const [x, y] = bz(p, t); return X.rivet(f(x), f(y), 2.5); }).join('');
    const body = X.S(SH.body, K.ink, 6.5, `<path d="${SH.bodyLit}" fill="${K.ink500}"/>
      ${X.ht('M 132,176 C 146,156 168,140 196,130 L 180,150 C 164,160 152,174 144,192 Z', 'l40')}${X.ht('M 124,232 C 128,212 138,196 150,184 L 146,204 C 138,214 134,226 132,240 Z', 'l20')}
      ${X.ht('M 88,180 C 150,202 250,202 312,180 L 312,206 C 250,226 150,226 88,206 Z', 'l40')}
      ${X.R([100, 250, 104, 206, 128, 170], 2.6)}${X.R([140, 150, 164, 126, 196, 118], 2.4)}
      ${X.line('M 98,222 C 150,238 250,238 304,222', K.ink500, 3)}${X.line('M 96,296 C 150,312 250,312 306,296', K.ink500, 3)}${X.line('M 92,328 C 150,336 250,336 308,328', K.ink500, 2.2)}
      ${seam(merL)}${seam(merR)}
      ${ph >= 2 ? `<path d="${crack}" fill="none" stroke="${K.ink}" stroke-width="${6 * X.LW}" stroke-linejoin="round"/><path d="${crack}" fill="none" stroke="${K.paper50}" stroke-width="${2.4 * X.LW}" stroke-linejoin="round"/>` : ''}`) +
      X.C([276, 166, 304, 196, 314, 240, 306, 284], 6) + X.C([306, 284, 300, 314, 290, 334, 280, 346], 5.4) + core;
    const collar = X.S(SH.collar, K.ink, 4.5, `${X.R([114, 166, 200, 182, 286, 166], 1.4)}
      ${[132, 166, 234, 268].map((x) => `<rect x="${x - 7}" y="172" width="14" height="10" rx="1.5" fill="${K.ink700}" stroke="${K.ink300}" stroke-width="1"/>${X.rivet(x - 3, 177, 1.8)}${X.rivet(x + 3, 177, 1.8)}`).join('')}`);
    const finial = `<path d="M 192,116 L 196,98 C 196,92 204,92 204,98 L 208,116 Z" fill="${K.ink}" ${X.O(3.4)}/><circle cx="200" cy="90" r="6" fill="${K.ink}" ${X.O(2.6)}/>${X.R([197, 112, 197, 104, 199, 98], 1.4)}`;
    const base = X.S(SH.base, K.ink, 5, `${X.R([102, 342, 200, 341, 298, 342], 1.4)}${[120, 160, 200, 240, 280].map((x) => X.rivet(x, 348, 2.2)).join('')}`);
    const legs = [SH.legL, SH.legR].map((d, i) => X.S(d, K.ink, 5, X.line(i ? 'M 228,358 C 228,370 232,378 238,386' : 'M 150,358 C 150,370 146,378 140,386', K.ink500, 3)) +
      [0, 1, 2].map((k) => { const x = (i ? 228 : 134) + k * 13; return `<path d="M ${x},393 L ${x + 4},400 L ${x + 8},393 Z" fill="${K.ink}"/>`; }).join('')).join('');
    // ---- pointed-arch firebox frame: lit inner bevel, keystone, rivets
    const frame = X.S(SH.frame, K.ink, 6.5, `<path d="M 138,314 L 138,238 C 138,210 162,184 206,156 L 206,172 C 172,194 152,216 152,240 L 152,314 Z" fill="${K.ink500}"/>
      ${X.R([140, 306, 140, 240, 204, 156], 2)}${X.ht('M 260,240 C 260,216 240,194 206,172 L 206,158 C 250,184 274,210 274,238 L 274,316 L 260,316 Z', 'd60')}
      ${[[145, 296], [145, 262], [150, 226], [170, 196], [242, 196], [262, 226], [267, 262], [267, 296]].map(([x, y]) => X.rivet(x, y, 2.6)).join('')}`) +
      X.brk('M 136,318 L 136,238 C 136,208 162,180 206,152 C 250,180 276,208 276,238 L 276,318', 2.2) + X.brk('M 152,310 L 152,240 C 152,216 172,194 206,172 C 240,194 260,216 260,240 L 260,310', 1.6) + X.S('M 194,146 L 218,146 L 213,176 L 199,176 Z', K.ink500, 3.4, X.R([197, 149, 206, 148, 215, 149], 1.4)) + X.C([250, 180, 276, 206, 278, 240, 276, 318], 5);
    const topT = ph >= 3 ? [176, 236] : [176, 191, 206, 221, 236];
    const heat = wu ? `<rect x="140" y="160" width="130" height="160" fill="${K.warn}"/>
        <path d="M 150,300 C 176,284 236,284 262,300 L 262,312 L 150,312 Z" fill="${K.paper50}" stroke="${K.ink}" stroke-width="${2.4 * X.LW}"/>
        ${X.ht('M 140,160 L 270,160 L 270,230 L 140,230 Z', 'd20', 0.55)}` : '';
    const eyeR = o.enraged ? 1.25 : 1;
    const eye = (x, y, w, h, tilt) => `<path d="M ${f(x - w)},${f(y - h * 0.2 * tilt)} C ${f(x - w * 0.5)},${f(y - h - h * 0.5 * tilt)} ${f(x + w * 0.5)},${f(y - h + h * 0.5 * tilt)} ${f(x + w)},${f(y + h * 0.1 * tilt)} C ${f(x + w * 0.4)},${f(y + h)} ${f(x - w * 0.4)},${f(y + h)} ${f(x - w)},${f(y - h * 0.2 * tilt)} Z" fill="${K.paper50}" stroke="${K.ink}" stroke-width="${wu ? 3 : 1.4}"/>`;
    // rev 3 (K3 F-A2): one eye line (y 244) on the frontal firebox; the asymmetry is wide-open vs narrowed, not a size/height
    // (perspective) difference. Both pupils look +x (at the player) and touch the upper lid on that side. META.maw.face = midpoint.
    const eyes = `${eye(186, 244, 13.5 * eyeR, 8.6 * eyeR, 1)}<circle cx="191.5" cy="242.6" r="4" fill="${K.ink}"/>${eye(227, 244, 10.4 * eyeR, 6.2 * eyeR, -1)}<circle cx="231.5" cy="242.4" r="3.2" fill="${K.ink}"/>`;
    const tooth = (x, y0, tip, up) => `<path d="M ${x - 6},${y0} L ${x + 6},${y0} L ${x + 6},${tip + (up ? 12 : -12)} L ${x},${tip} L ${x - 6},${tip + (up ? 12 : -12)} Z" fill="${K.ink300}" stroke="${K.ink}" stroke-width="${2.2 * X.LW}" stroke-linejoin="round"/><path d="M ${x + 1},${y0} L ${x + 1},${tip + (up ? 10 : -10)} L ${x + 5},${tip + (up ? 12 : -12)} L ${x + 5},${y0} Z" fill="${K.ink500}"/>`;
    const mouth = X.S(SH.mouth, K.ink, 5, `${heat}
      ${wu ? '' : `<ellipse cx="206" cy="302" rx="50" ry="12" fill="${K.ink700}"/>${[[172, 302, 3.4], [188, 306, 2.6], [202, 298, 3.8], [218, 305, 3], [234, 300, 2.8], [196, 292, 2], [226, 294, 2.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${K.ink300}" stroke="${K.ink}" stroke-width="1.2"/>`).join('')}${X.ht('M 150,270 L 262,270 L 262,312 L 150,312 Z', 'r40', 0.5)}`}
      ${eyes}
      ${topT.map((x) => tooth(x, 160, x === 206 ? 226 : 222 - Math.abs(x - 206) * 0.1, false)).join('')}
      ${[178, 197, 216, 235].map((x) => tooth(x, 312, 276, true)).join('')}
      ${ph >= 3 ? `<path d="M 191,190 L 191,206 L 187,210 M 206,176 L 206,200 M 221,190 L 221,208 L 225,212" fill="none" stroke="${K.ink300}" stroke-width="${4 * X.LW}"/>` : ''}`);
    const sootDrips = `${X.drip(170, 312, 26, 4.2)}${X.drip(214, 312, 36, 4.6)}${X.drip(248, 312, 20, 3.6)}`;
    const bodyAll = `${A.mawPipes(X)}${legs}${armL}${armR}${body}${collar}${finial}${base}${frame}${mouth}${sootDrips}`;
    let fx = A.mawSoot(X, o.enraged || wu);
    if (o.enraged) fx += `${[[128, 78, 30], [164, 42, 40], [202, 12, 48], [240, 42, 40], [276, ph >= 2 ? 104 : 78, 30]].map(([x, t, h]) => X.flame(x, t + 4, h, 22, -4)).join('')}
      ${X.flame(180, 196, 30, 20, -6)}${X.flame(232, 196, 34, 20, 6)}
      <ellipse cx="186" cy="244" rx="18" ry="12" fill="${K.paper50}" filter="url(#${X.p}glow)"/><ellipse cx="227" cy="244" rx="14" ry="10" fill="${K.paper50}" filter="url(#${X.p}glow)"/>`;
    if (wu) fx += `${X.bang(206, 104, 0.85)}${[0, 1, 2].map((i) => X.line(`M ${178 + i * 28},150 c -6,-8 6,-14 0,-22 c -6,-8 6,-14 0,-22`, K.ink, 2)).join('')}`;
    const ground = `<ellipse cx="200" cy="394" rx="150" ry="9" fill="${K.ink}" opacity="0.3"/>`;
    return { ground, body: bodyAll, fx };
  };
})(window.PN);
// ---------------------------------------------------------------- telegraphs (bible §12.2) — ground-plane, same local units as draw()
// PN.bossesA.telegraph(kind, opts) -> <g> string centred on (0,0) (= boss pivot projected to the ground / zone centre)
//   kinds: 'dashLane' {len, w, fan, stage:'preview'|'imminent', progress}   lane along +x, end fans to ±fan (3.8x homing)
//          'dashTrail' {len, w}                                             dry-ink trail decal after the dash (3s)
//          'tollRing' {r, stage, progress}                                   amber hatched ring under the gaoler during windup
//          'ripple'   {r0, r1, n}                                            담묵 concentric ripples (precede the shots)
//          'ringShots'{n:22, r, size, phase}                                 ink-ball + coral-rim bullets on a ring
//          'fireZone' {r, stage:'preview'|'imminent'|'active'|'decal', progress}
// Scale: local units are world*2.5 (boss gameScale 0.4). hatch 2px/10px(preview) -> 5/25 local; imminent pitch 12.5.
(function (PN) {
  const A = PN.bossesA, K = A.K;
  const f = (n) => Math.round(n * 10) / 10;
  function tdefs(p) {
    return `<pattern id="${p}hp" width="25" height="25" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="25" height="5" fill="${K.warn}" opacity="0.55"/></pattern>
      <pattern id="${p}hi" width="12.5" height="12.5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="12.5" height="5" fill="${K.warn}"/></pattern>
      <pattern id="${p}dk" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="5" cy="5" r="2.6" fill="${K.ink}"/></pattern>
      <filter id="${p}rg" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  }
  // brush-drawn border: faint dotted full outline + solid painted part = progress, teardrop brush head at the tip
  function brushBorder(d, len, prog, w) {
    const done = Math.max(0, Math.min(1, prog)) * len;
    return `<path d="${d}" fill="none" stroke="${K.ink}" stroke-opacity="0.45" stroke-width="${f(w * 0.6)}" stroke-dasharray="4 9" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="${K.ink}" stroke-opacity="0.85" stroke-width="${w}" stroke-dasharray="${f(done)} ${f(len + 10)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  function bullet(x, y, r, a = 0) {
    const tx = Math.cos(a), ty = Math.sin(a);
    return `${PN.taper([x - tx * r * 0.6, y - ty * r * 0.6, x - tx * r * 1.6, y - ty * r * 1.6, x - tx * r * 2.8, y - ty * r * 2.8], r * 0.9, 'start', K.hostile, 'opacity="0.7"')}
      <circle cx="${f(x)}" cy="${f(y)}" r="${f(r + 2.5)}" fill="${K.ink}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${K.hostile}"/>
      <circle cx="${f(x)}" cy="${f(y)}" r="${f(r - 6)}" fill="${K.ink}"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.32)}" r="${f(r * 0.2)}" fill="${K.paper50}"/>`;
  }
  let TID = 0;
  A.bullet = bullet;
  A.telegraph = function (kind, opts = {}) {
    const p = 'bT' + (TID++) + '_', st = opts.stage || 'imminent', prog = opts.progress == null ? (st === 'preview' ? 0.55 : 1) : opts.progress;
    const imm = st === 'imminent', bw = imm ? 12.5 : 5, hatch = `url(#${p}${imm ? 'hi' : 'hp'})`;
    let s = '';
    if (kind === 'dashLane') {
      const L = opts.len || 700, w = opts.w || 70, fan = opts.fan || 150, a = L * 0.62;
      const d = `M 0,${-w} L ${a},${-w} L ${L},${-fan} Q ${L + fan * 0.3},0 ${L},${fan} L ${a},${w} L 0,${w} Z`;
      s += `<path d="${d}" fill="${hatch}"/>${imm ? `<path d="${d}" fill="${K.warn}" opacity="0.14"/>` : ''}`;
      s += brushBorder(d, 2 * (a + Math.hypot(L - a, fan - w) + fan * 0.9) + 2 * w, imm ? 1 : prog, bw);
      if (imm) for (let i = 1; i <= 5; i++) { const x = (L * i) / 6; s += `<path d="M ${f(x - 16)},${-w * 0.3} L ${f(x + 10)},0 L ${f(x - 16)},${w * 0.3}" fill="none" stroke="${K.ink}" stroke-width="7" stroke-linejoin="round" opacity="0.8"/>`; }
      if (!imm) { const hx = Math.min(L, prog * L * 1.1); s += `<path d="M ${f(hx - 26)},${-w - 6} C ${f(hx - 10)},${-w - 16} ${f(hx + 12)},${-w - 10} ${f(hx + 16)},${-w} C ${f(hx + 12)},${-w + 8} ${f(hx - 10)},${-w + 6} ${f(hx - 26)},${-w - 6} Z" fill="${K.ink}"/>`; }
    } else if (kind === 'dashTrail') {
      const L = opts.len || 700, w = opts.w || 60;
      s += `<g filter="url(#${p}rg)" opacity="0.9">${PN.taper([0, 0, L * 0.5, -6, L, 4], w * 1.3, 'end', K.ink700, 'opacity="0.55"')}${PN.taper([0, -w * 0.4, L * 0.5, -w * 0.5, L, -w * 0.3], w * 0.36, 'end', K.ink300)}${PN.taper([0, w * 0.4, L * 0.5, w * 0.46, L * 0.96, w * 0.36], w * 0.3, 'end', K.ink300)}${PN.splat(L, 0, w * 0.5, 12, 31, K.ink700)}</g>`;
    } else if (kind === 'tollRing') {
      const r = opts.r || 150, r2 = r - (opts.band || 34);
      const d = `M ${-r},0 A ${r} ${r} 0 1 0 ${r},0 A ${r} ${r} 0 1 0 ${-r},0 Z M ${-r2},0 A ${r2} ${r2} 0 1 1 ${r2},0 A ${r2} ${r2} 0 1 1 ${-r2},0 Z`;
      s += `<path d="${d}" fill="${hatch}" fill-rule="evenodd"/>${brushBorder(`M ${r},0 A ${r} ${r} 0 1 1 ${-r},0 A ${r} ${r} 0 1 1 ${r},0`, 2 * Math.PI * r, imm ? 1 : prog, bw)}
        <circle r="${r2}" fill="none" stroke="${K.ink}" stroke-width="${bw * 0.6}" stroke-opacity="0.8"/>`;
      if (imm) for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6; s += `<path d="M ${f(Math.cos(an) * r)},${f(Math.sin(an) * r)} L ${f(Math.cos(an) * (r + 22))},${f(Math.sin(an) * (r + 22))}" stroke="${K.ink}" stroke-width="9" stroke-linecap="round"/>`; }
    } else if (kind === 'ripple') {
      const r0 = opts.r0 || 170, r1 = opts.r1 || 420, n = opts.n || 3;
      for (let i = 0; i < n; i++) { const r = r0 + (r1 - r0) * i / Math.max(1, n - 1), w = 14 - i * 3.5; s += `<circle r="${f(r)}" fill="none" stroke="${K.ink300}" stroke-width="${f(w)}" stroke-dasharray="${i ? '60 22' : 'none'}" opacity="${f(0.95 - i * 0.2)}"/><circle r="${f(r - w)}" fill="none" stroke="${K.ink300}" stroke-width="2.4" opacity="${f(0.6 - i * 0.15)}"/>`; }
    } else if (kind === 'ringShots') {
      const n = opts.n || 22, r = opts.r || 300, sz = opts.size || 17, off = opts.phase || 0;
      for (let i = 0; i < n; i++) { const an = off + i * 2 * Math.PI / n; s += bullet(Math.cos(an) * r, Math.sin(an) * r, sz, an); }
    } else if (kind === 'fireZone') {
      const r = opts.r || 130;
      if (st === 'decal') {
        s += `<g filter="url(#${p}rg)">${PN.splat(0, 0, r * 0.62, 18, 11, K.ink300)}<circle r="${f(r * 0.8)}" fill="url(#${p}dk)" opacity="0.28"/></g>`;
      } else if (st === 'active') {
        s += `<circle r="${r}" fill="${K.hostile}" opacity="0.55"/><circle r="${r}" fill="none" stroke="url(#${p}dk)" stroke-width="22"/><circle r="${r}" fill="none" stroke="${K.ink}" stroke-width="7"/>`;
        const X = A.mk({}); const fl = [[-0.5, 0.2, 1], [0, -0.1, 1.35], [0.48, 0.18, 1.05], [-0.18, 0.5, 0.8], [0.28, 0.55, 0.75], [-0.62, -0.28, 0.7], [0.6, -0.3, 0.72]];
        s += fl.map(([x, y, k]) => X.flame(x * r, y * r + 30 * k, 80 * k, 44 * k, (x < 0 ? -1 : 1) * 8)).join('');
        s += `<circle r="${f(r * 0.3)}" fill="${K.hostile}" stroke="${K.ink}" stroke-width="7"/><circle cx="${f(-r * 0.08)}" cy="${f(-r * 0.09)}" r="${f(r * 0.08)}" fill="${K.paper50}"/>`;
      } else {
        s += `<circle r="${r}" fill="${hatch}"/>${brushBorder(`M ${r},0 A ${r} ${r} 0 1 1 ${-r},0 A ${r} ${r} 0 1 1 ${r},0`, 2 * Math.PI * r, imm ? 1 : prog, bw)}`;
        if (imm) for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; s += `<path d="M ${f(Math.cos(an) * r)},${f(Math.sin(an) * r)} L ${f(Math.cos(an) * (r + 24))},${f(Math.sin(an) * (r + 24))}" stroke="${K.ink}" stroke-width="10" stroke-linecap="round"/>`; }
        const cr = r * 0.34;
        s += `<circle r="${f(cr)}" fill="${K.hostile}" stroke="${K.ink}" stroke-width="7"/>
          <path d="M 0,${f(-cr * 0.7)} C ${f(cr * 0.45)},${f(-cr * 0.2)} ${f(cr * 0.45)},${f(cr * 0.5)} 0,${f(cr * 0.6)} C ${f(-cr * 0.45)},${f(cr * 0.5)} ${f(-cr * 0.5)},${f(-cr * 0.05)} ${f(-cr * 0.15)},${f(-cr * 0.25)} C ${f(-cr * 0.1)},${f(0)} ${f(cr * 0.05)},${f(0.05 * cr)} 0,${f(-cr * 0.7)} Z" fill="${K.ink}"/>
          <path d="M 0,${f(cr * 0.1)} C ${f(cr * 0.18)},${f(cr * 0.25)} ${f(cr * 0.15)},${f(cr * 0.45)} 0,${f(cr * 0.48)} C ${f(-cr * 0.15)},${f(cr * 0.45)} ${f(-cr * 0.16)},${f(cr * 0.25)} 0,${f(cr * 0.1)} Z" fill="${K.paper50}"/>`;
      }
    }
    return `<g class="bossA-tele bossA-tele-${kind}"><defs>${tdefs(p)}</defs>${s}</g>`;
  };
})(window.PN);
// ---------------------------------------------------------------- dashed hit circle (bible §7.3 dev overlay / §15 "판정 원을 점선으로 깔고 그 위에 캐릭터")
// PN.bossesA.hitCircle({part:'full'|'back'|'front', px, w, dash:[on,off], alpha}) -> markup in the SAME local box as draw()
//   centre = pivot (200,257), r = 135 (r54 world). 'back' = upper half (draw BEFORE the boss), 'front' = lower half (draw AFTER).
//   px = local units per screen px (1/scale) so w and dash are given in screen px. paper.50 dashes over an ink.900 underlay.
(function (PN) {
  const A = PN.bossesA, K = A.K;
  A.hitCircle = function (o = {}) {
    const part = o.part || 'full', s = o.px || 1, w = (o.w || 1.2) * s, dash = (o.dash || [3, 3]).map((v) => v * s).join(' '), a = o.alpha == null ? 0.85 : o.alpha;
    const cx = 200, cy = 257, r = 135;
    const d = part === 'front' ? `M ${cx - r},${cy} A ${r} ${r} 0 0 0 ${cx + r},${cy}` : part === 'back' ? `M ${cx - r},${cy} A ${r} ${r} 0 0 1 ${cx + r},${cy}`
      : `M ${cx - r},${cy} A ${r} ${r} 0 1 0 ${cx + r},${cy} A ${r} ${r} 0 1 0 ${cx - r},${cy}`;
    return `<g class="bossA-hit" opacity="${a}" fill="none" stroke-linecap="butt"><path d="${d}" stroke="${K.ink}" stroke-width="${(w + 2 * s).toFixed(2)}" stroke-dasharray="${dash}"/><path d="${d}" stroke="${K.paper50}" stroke-width="${w.toFixed(2)}" stroke-dasharray="${dash}"/></g>`;
  };
})(window.PN);
