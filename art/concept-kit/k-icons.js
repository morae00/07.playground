// k-icons.js — Blackline Survivor 먹극화 · PAPER NOIR INK
// PN.icons : skill icons (17) · rarity frames · tiles · pickups
// PN.vfx   : telegraph 4 shapes x 3 stages · ally/enemy zones · hit · kill · decal · damage numbers
// Requires lib.js (PN.taper, PN.rng). Every function returns a self-contained <g> string with its own <defs>;
// all ids are unique per call (prefix 'ki<N>_'). See kit/API-icons.md.
window.PN = window.PN || {};
(function (PN) {
  // ---- bible §3 tokens (binding values) ----
  const K = {
    ink: '#121110', ink7: '#2B2926', ink5: '#46423D', ink3: '#8C8579', ink1: '#BCB4A5',
    p50: '#FAF6EC', paper: '#F3EEE2', p300: '#D8D0C0', hanji: '#EFE6D2', voidp: '#E2DBCB',
    ally: '#00A8C6', allyD: '#007C94', allyG: '#CFF6FF',
    hostile: '#EF5B4F', hostileD: '#B8352B', warn: '#D88D16', reward: '#86B82D', elite: '#805AD5',
    silver: '#A3A7AC', gold: '#B08A3E', ground1: '#B8AC93', ground1L: '#D4CAB4', ground1D: '#8F836C'
  };
  let N = 0;
  const f = (n) => Math.round(n * 100) / 100;
  const T = (p, w, mode, fill, extra) => PN.taper(p, w, mode || 'mid', fill || K.ink, extra || '');
  const FONT = `'Apple SD Gothic Neo','AppleGothic','Helvetica Neue',sans-serif`;
  const NUMF = `'Avenir Next Condensed','DIN Condensed','Helvetica Neue',sans-serif`;
  const cov = (p, c) => f(p * Math.sqrt(c / Math.PI));
  const rng = (s) => { let x = s; return () => ((x = (x * 16807) % 2147483647) / 2147483647); };
  const pt = (a) => a.map((q) => f(q[0]) + ',' + f(q[1])).join(' L');
  const poly = (a) => 'M' + pt(a) + ' Z';

  // per-call context: unique ids + defs collector
  function ctx(tag) {
    const p = 'ki' + (N++) + (tag || '') + '_';
    const defs = [];
    const c = {
      p, defs, minPitch: 0,
      id: (n) => p + n,
      add: (s) => { defs.push(s); return c; },
      // halftone dot pattern; pitch is raised to c.minPitch (skill(): max(8, 3*128/displaySize)) so tones stay >= 3px on screen
      dot(n, pitch, cv, col, ang = 45) {
        const P = f(Math.max(pitch, c.minPitch || 0));
        const id = p + n; defs.push(`<pattern id="${id}" width="${P}" height="${P}" patternUnits="userSpaceOnUse" patternTransform="rotate(${ang})"><circle cx="${f(P / 2)}" cy="${f(P / 2)}" r="${cov(P, cv)}" fill="${col}"/></pattern>`); return `url(#${id})`;
      },
      // variable halftone (PN.halftone) with the same pitch floor; rfn radii are authored for `pitch` and scaled to keep coverage
      ht(x0, y0, x1, y1, pitch, rfn, col = K.ink) {
        const P = Math.max(pitch, c.minPitch || 0), k = P / pitch;
        return PN.halftone(x0, y0, x1, y1, P, (x, y) => rfn(x, y) * k, col, 45);
      },
      hatch(n, pitch, lw, col, ang = -45, under) {
        const id = p + n; const u = under ? `<rect y="${f(lw)}" width="${pitch}" height="${under[0]}" fill="${under[1]}" opacity="${under[2]}"/>` : '';
        defs.push(`<pattern id="${id}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(${ang})"><rect width="${pitch}" height="${lw}" fill="${col}"/>${u}</pattern>`); return `url(#${id})`;
      },
      clip(n, d, tr) { const id = p + n; defs.push(`<clipPath id="${id}"><path d="${d}" ${tr ? `transform="${tr}"` : ''}/></clipPath>`); return `url(#${id})`; },
      rough(n, sc = 1.5, bf = 0.07, seed = 5) {
        const id = p + n; defs.push(`<filter id="${id}" x="-12%" y="-12%" width="124%" height="124%"><feTurbulence type="fractalNoise" baseFrequency="${bf}" numOctaves="2" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${sc}" xChannelSelector="R" yChannelSelector="G"/></filter>`); return `url(#${id})`;
      },
      grain(n, a = 0.06, seed = 9) {
        const id = p + n; defs.push(`<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${seed}"/><feColorMatrix type="matrix" values="0 0 0 0 0.07  0 0 0 0 0.065  0 0 0 0 0.06  1.3 0 0 0 -0.52"/><feComponentTransfer><feFuncA type="linear" slope="${f(a * 5)}"/></feComponentTransfer></filter>`); return `url(#${id})`;
      },
      halo(n, r, col) {
        const id = p + n; defs.push(`<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/><feFlood flood-color="${col}"/><feComposite in2="d" operator="in" result="h"/><feMerge><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`); return `url(#${id})`;
      },
      out: (body, attrs = '') => `<g ${attrs}><defs>${defs.join('')}</defs>${body}</g>`
    };
    return c;
  }
  // brush-ink shape: offset ink copy (shadow side, down-right, +40%) under a stroked fill (light side thinner)
  function S(d, fill, w = 3, off = 1.5, extra = '') {
    return `<path d="${d}" fill="${K.ink}" stroke="${K.ink}" stroke-width="${w}" stroke-linejoin="round" transform="translate(${off},${f(off * 1.25)})"/><path d="${d}" fill="${fill}" stroke="${K.ink}" stroke-width="${w}" stroke-linejoin="round" ${extra}/>`;
  }
  const P = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
  const L = (d, col, w, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  // tapered polyline stroke (width w0 -> w1 along length)
  function taperPoly(pts, w0, w1, fill = K.ink, extra = '') {
    if (pts.length < 2) return '';
    const Lf = [], Rt = []; let tot = 0; const acc = [0];
    for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc.push(tot); }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      const t = tot ? acc[i] / tot : 0, hw = Math.max(0.12, (w0 + (w1 - w0) * t) / 2);
      Lf.push([pts[i][0] + nx * hw, pts[i][1] + ny * hw]); Rt.push([pts[i][0] - nx * hw, pts[i][1] - ny * hw]);
    }
    return `<path d="${poly(Lf.concat(Rt.reverse()))}" fill="${fill}" ${extra}/>`;
  }
  // Catmull-Rom resample of a control polyline (open), n samples per span
  function smooth(ctrl, n = 8) {
    const out = [];
    for (let i = 0; i < ctrl.length - 1; i++) {
      const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((j) => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    out.push(ctrl[ctrl.length - 1].slice(0, 2));
    return out;
  }
  // brush contour: width follows wfn(t) (0..1 along length) — pointed entry / exit like a brush pen
  function taperFn(pts, wfn, fill = K.ink, extra = '') {
    if (pts.length < 2) return '';
    const Lf = [], Rt = []; let tot = 0; const acc = [0];
    for (let i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc.push(tot); }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      const hw = Math.max(0.12, wfn(tot ? acc[i] / tot : 0) / 2);
      Lf.push([pts[i][0] + nx * hw, pts[i][1] + ny * hw]); Rt.push([pts[i][0] - nx * hw, pts[i][1] - ny * hw]);
    }
    return `<path d="${poly(Lf.concat(Rt.reverse()))}" fill="${fill}" ${extra}/>`;
  }
  // standard brush profile: ramps in over a, out over b, full width w between
  const bw = (w, a = 0.15, b = 0.2, w0 = 0.25) => (t) => w * (t < a ? w0 + (1 - w0) * t / a : t > 1 - b ? w0 + (1 - w0) * (1 - t) / b : 1);
  // star / burst polygon
  function burst(cx, cy, r1, r2, n, rot = 0, jit = 0, seed = 3) {
    const R = rng(seed); const a = [];
    for (let i = 0; i < n * 2; i++) {
      const ang = rot + i * Math.PI / n, r = (i % 2 ? r2 : r1) * (1 - jit / 2 + jit * R());
      a.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
    }
    return poly(a);
  }
  function ellipsePts(cx, cy, rx, ry, n = 64, a0 = 0, a1 = Math.PI * 2, rot = 0) {
    const out = []; const cr = Math.cos(rot), sr = Math.sin(rot);
    for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n, x = Math.cos(t) * rx, y = Math.sin(t) * ry; out.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); }
    return out;
  }
  // soft blob outline (for ink splats)
  function blob(cx, cy, r, n, amp, seed, sy = 1) {
    const R = rng(seed); const ks = []; for (let i = 0; i < n; i++) ks.push(1 - amp / 2 + amp * R());
    let d = '';
    const P0 = (i) => { const a = i / n * Math.PI * 2, k = ks[(i + n) % n]; return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k * sy]; };
    for (let i = 0; i <= n; i++) {
      const p0 = P0(i), p1 = P0(i + 1), m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      d += i === 0 ? `M${f(m[0])},${f(m[1])}` : ` Q${f(p0[0])},${f(p0[1])} ${f(m[0])},${f(m[1])}`;
    }
    return d + ' Z';
  }
  // ink drip droplet (hanging)
  const drip = (x, y, h, w) => `M${f(x - w)},${f(y)} C${f(x - w)},${f(y + h * 0.6)} ${f(x - w * 0.4)},${f(y + h)} ${f(x)},${f(y + h)} C${f(x + w * 0.4)},${f(y + h)} ${f(x + w)},${f(y + h * 0.6)} ${f(x + w)},${f(y)} Z`;
  // 엽전 coin with punched square hole (evenodd)
  function coinD(cx, cy, r, hk = 0.36) { const h = r * hk; return `M${f(cx - r)},${f(cy)} A${r},${r} 0 1 0 ${f(cx + r)},${f(cy)} A${r},${r} 0 1 0 ${f(cx - r)},${f(cy)} Z M${f(cx - h)},${f(cy - h)} L${f(cx - h)},${f(cy + h)} L${f(cx + h)},${f(cy + h)} L${f(cx + h)},${f(cy - h)} Z`; }
  function coin(cx, cy, r, w = 2.4, sq = 1, detail = true, hk = 0.36) {
    const h = r * hk;
    return `<g transform="translate(${f(cx)},${f(cy)}) scale(1,${sq}) translate(${f(-cx)},${f(-cy)})">
      <path d="${coinD(cx + w * 0.5, cy + w * 0.6, r, hk)}" fill="${K.ink}" fill-rule="evenodd" stroke="${K.ink}" stroke-width="${w}"/>
      <path d="${coinD(cx, cy, r, hk)}" fill="${K.ink1}" fill-rule="evenodd" stroke="${K.ink}" stroke-width="${w}" stroke-linejoin="round"/>
      ${detail ? `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.78)}" fill="none" stroke="${K.ink}" stroke-width="${f(w * 0.45)}" opacity="0.8"/>
      <path d="M${f(cx - h - 1.5)},${f(cy - h - 1.5)} h${f(2 * h + 3)} v${f(2 * h + 3)} h${f(-2 * h - 3)} Z" fill="none" stroke="${K.ink}" stroke-width="${f(w * 0.5)}"/>` : ''}
      ${!detail ? '' : L(`M${f(cx - r * 0.1)},${f(cy - r * 0.62)} h${f(r * 0.2)} M${f(cx + r * 0.55)},${f(cy - r * 0.08)} v${f(r * 0.2)} M${f(cx - r * 0.1)},${f(cy + r * 0.6)} h${f(r * 0.2)} M${f(cx - r * 0.55)},${f(cy - r * 0.1)} v${f(r * 0.2)}`, K.ink, f(w * 0.55))}
      <path d="M${f(cx - r * 0.82)},${f(cy - r * 0.2)} A${f(r * 0.85)},${f(r * 0.85)} 0 0 1 ${f(cx - r * 0.2)},${f(cy - r * 0.82)}" fill="none" stroke="${K.p50}" stroke-width="${f(w * 0.6)}" stroke-linecap="round" opacity="0.9"/>
    </g>`;
  }

  PN.icons = PN.icons || {};
  PN.vfx = PN.vfx || {};
  PN.icons.K = K;
  PN._ki = { K, ctx, S, P, L, T, f, rng, pt, poly, taperPoly, taperFn, bw, smooth, burst, ellipsePts, blob, drip, coin, coinD, cov, FONT, NUMF };
})(window.PN);
// ---- skill icon drawings A (actives 1-6). 128 x 128 master, light = top-left ----
(function (PN) {
  const { K, S, P, L, T, f, rng, poly, taperPoly, burst, ellipsePts, blob, drip } = PN._ki;
  const I = PN._ki.ICON = PN._ki.ICON || {};
  const thread = (d, w = 3) => L(d, K.ink, w + 2.4) + L(d, K.ally, w) + L(d, K.allyG, 0.9, 'opacity="0.9"');
  // flying needle: back(eye) -> tip, paper body, ink-soaked tip (last ~26%)
  function needle(x0, y0, x1, y1, w) {
    const dx = x1 - x0, dy = y1 - y0, Ln = Math.hypot(dx, dy), ux = dx / Ln, uy = dy / Ln, nx = -uy, ny = ux;
    const at = (t, s) => [x0 + ux * Ln * t + nx * w * s, y0 + uy * Ln * t + ny * w * s];
    const q = (p) => p.map(f).join(',');
    const body = `M${q(at(0, 0.85))} L${q(at(0.76, 1))} L${f(x1)},${f(y1)} L${q(at(0.76, -1))} L${q(at(0, -0.85))} A${f(w * 0.85)},${f(w * 0.85)} 0 0 1 ${q(at(0, 0.85))} Z`;
    const tip = `M${q(at(0.8, 0.9))} L${f(x1)},${f(y1)} L${q(at(0.8, -0.9))} Q${q(at(0.75, -0.2))} ${q(at(0.81, 0.2))} Q${q(at(0.78, 0.7))} ${q(at(0.8, 0.9))} Z`;
    const e = at(0.09, 0), a = Math.atan2(dy, dx) * 180 / Math.PI;
    return S(body, K.p50, 2.4, 1.1) + P(tip, K.ink) +
      `<ellipse cx="${f(e[0])}" cy="${f(e[1])}" rx="${f(w * 0.8)}" ry="${f(w * 0.26)}" transform="rotate(${f(a)} ${f(e[0])} ${f(e[1])})" fill="${K.ink}"/>` +
      L(`M${q(at(0.2, -0.5))} L${q(at(0.66, -0.62))}`, K.ink3, 1.1);
  }
  // cyan thread trailing behind a needle (ink / cyan / glow sandwich), wavy, tapered
  function tail(B, u, len, amp, ph = 0) {
    const n = [-u[1], u[0]], pts = [];
    for (let i = 0; i <= 24; i++) { const s = len * i / 24, w = Math.sin(s / len * Math.PI * 1.6 + ph) * amp * (s / len); pts.push([B[0] - u[0] * s + n[0] * w, B[1] - u[1] * s + n[1] * w]); }
    return taperPoly(pts, 6.4, 2, K.ink) + taperPoly(pts, 3.6, 0.5, K.ally) + taperPoly(pts.slice(0, 14), 1.1, 0.2, K.allyG);
  }
  PN._ki.needle = needle; PN._ki.tail = tail;
  // slim sewing needle (tail/eye B -> tip Tp), paper body width w, ink-dipped point (last 26%), elongated eye slot.
  // Outline = paint-order stroke (2.6 visible) + ink offset copy on the shadow side (≈ +40%).
  function slimNeedle(B, Tp, w, ow = 2.2) {
    const dx = Tp[0] - B[0], dy = Tp[1] - B[1], Ln = Math.hypot(dx, dy), u = [dx / Ln, dy / Ln], n = [-u[1], u[0]];
    const at = (t, s) => [B[0] + u[0] * Ln * t + n[0] * s, B[1] + u[1] * Ln * t + n[1] * s];
    const hw = (t) => (w / 2) * (t < 0.14 ? 0.82 + 0.18 * t / 0.14 : Math.max(0, 1 - Math.pow((t - 0.14) / 0.86, 1.5)));
    const q = (p) => f(p[0]) + ',' + f(p[1]);
    // shape(t1, grow): needle outline from the round tail to t1 (tip = 1), widened by `grow`
    const shape = (t1, grow, ext) => {
      const ts = []; for (let i = 0; i <= 16; i++) ts.push(0.02 + (t1 - 0.02) * i / 16);
      const Lp = ts.map((t) => at(t, hw(t) + grow)), Rp = ts.map((t) => at(t, -hw(t) - grow)).reverse();
      const end = at(t1 + ext, 0), r0 = f(hw(0.02) + grow);
      return `M${q(Lp[0])} ${Lp.slice(1).map((p) => 'L' + q(p)).join(' ')} L${q(end)} ${Rp.map((p) => 'L' + q(p)).join(' ')} A${r0},${r0} 0 0 1 ${q(Lp[0])} Z`;
    };
    const outer = shape(1, ow, 0.07), paper = shape(0.79, 0, 0.012);
    const e0 = at(0.045, 0), e1 = at(0.17, 0);
    return `<path d="${outer}" fill="${K.ink}" transform="translate(1.1,1.4)"/><path d="${outer}" fill="${K.ink}"/>` +
      `<path d="${paper}" fill="${K.p50}"/>` + L(`M${q(e0)} L${q(e1)}`, K.ink, f(Math.max(1.3, w * 0.28))) +
      L(`M${q(at(0.84, hw(0.84) * 0.3 + 0.3))} L${q(at(0.95, 0.2))}`, K.ink3, 0.8);
  }
  // cyan thread through the eye, S-curve back to P0 (ink / cyan / glow sandwich, tapered)
  function sThread(E, u, P0, amp, sgn = 1, wk = 1) {
    const n = [-u[1], u[0]], c1 = [E[0] - u[0] * 16 + n[0] * amp * sgn, E[1] - u[1] * 16 + n[1] * amp * sgn];
    const c2 = [P0[0] + (E[0] - P0[0]) * 0.45 - n[0] * amp * sgn, P0[1] + (E[1] - P0[1]) * 0.45 - n[1] * amp * sgn];
    const pts = []; for (let i = 0; i <= 28; i++) { const t = i / 28, v = 1 - t; pts.push([0, 1].map((j) => v * v * v * E[j] + 3 * v * v * t * c1[j] + 3 * v * t * t * c2[j] + t * t * t * P0[j])); }
    const eyeLoop = L(`M${f(E[0] - u[0] * 2.4)},${f(E[1] - u[1] * 2.4)} L${f(E[0] + u[0] * 2.4)},${f(E[1] + u[1] * 2.4)}`, K.ally, 1.5);
    return [taperPoly(pts, 6 * wk, 2.6 * wk, K.ink) + taperPoly(pts, 3.3 * wk, 0.9 * wk, K.ally) + taperPoly(pts.slice(0, 16), 1.1 * wk, 0.2, K.allyG, 'opacity="0.9"'), eyeLoop];
  }
  PN._ki.slimNeedle = slimNeedle; PN._ki.sThread = sThread;
  // 1. 먹선 바늘 — three slim paper needles fan out (20° apart) from one ink splash; cyan threads through the eyes S-curve back
  //    to the splash. Awakened (Lv5 부채꼴 난사): the thread splits and two extra needles widen the fan.
  I.needleStorm = { rarity: 'common', kind: 'active', name: '먹선 바늘', draw(c, A) {
    const O = [12, 116], R = rng(5), ln = A ? K.p300 : K.ink;
    const fan = A ? [-72, -58.5, -45, -31.5, -18] : [-65, -45, -25];
    // ink splash at the origin + 3 tapered speed strokes behind the fan (no radial field)
    // black brush sweep (ring band centred on the splash) behind the needle bodies: paper bodies pop on ink, ink points land on paper
    const sw = []; const b0 = -84 * Math.PI / 180, b1 = -6 * Math.PI / 180;
    for (let i = 0; i <= 30; i++) { const a = b0 + (b1 - b0) * i / 30, e = Math.sin(Math.PI * i / 30); sw.push([O[0] + Math.cos(a) * (62 + 26 * Math.pow(e, 0.8)), O[1] + Math.sin(a) * (62 + 26 * Math.pow(e, 0.8))]); }
    for (let i = 30; i >= 0; i--) { const a = b0 + (b1 - b0) * i / 30, e = Math.sin(Math.PI * i / 30); sw.push([O[0] + Math.cos(a) * (62 - 6 * e), O[1] + Math.sin(a) * (62 - 6 * e)]); }
    const dry = [[72, -70, -22, 1.4], [80, -58, -30, 1.1], [66, -40, -14, 1]].map(([rr, d0, d1, w]) => { const a0 = d0 * Math.PI / 180, a1 = d1 * Math.PI / 180; return L(`M${f(O[0] + Math.cos(a0) * rr)},${f(O[1] + Math.sin(a0) * rr)} A${rr},${rr} 0 0 1 ${f(O[0] + Math.cos(a1) * rr)},${f(O[1] + Math.sin(a1) * rr)}`, K.paper, w, 'stroke-dasharray="9 3 4 5"'); }).join('');
    let bg = (A ? '' : `<path d="${poly(sw)}" fill="${K.ink}"/>` + dry) +
      PN.splat(O[0] + 1, O[1] - 1, 15, 10, 7, A ? K.ink7 : K.ink) +
      [[-55, 26, 50, 1.8], [-35, 30, 54, 1.6], [-75, 30, 48, 1.4], [-15, 36, 56, 1.4]].map(([deg, r0, r1, w]) => { const a = deg * Math.PI / 180; return taperPoly([[O[0] + Math.cos(a) * r1, O[1] + Math.sin(a) * r1], [O[0] + Math.cos(a) * r0, O[1] + Math.sin(a) * r0]], w, 0.2, ln); }).join('');
    const d0 = 40, len = 70, thr = [], nd = [], eyes = [];
    fan.forEach((deg, i) => {
      const r = deg * Math.PI / 180, u = [Math.cos(r), Math.sin(r)], main = !A || (i % 2 === 0), k = main ? 1 : 0.84;
      const B = [O[0] + u[0] * d0, O[1] + u[1] * d0], Tp = [B[0] + u[0] * len * k, B[1] + u[1] * len * k];
      const E = [B[0] + u[0] * len * k * 0.11, B[1] + u[1] * len * k * 0.11];
      const th = sThread(E, u, [O[0] + 5 + i * 1.2, O[1] - 6 - i * 0.8], 6, i % 2 ? -1 : 1, main ? 0.8 : 0.6); thr.push(th[0]); eyes.push(th[1]);
      nd.push(slimNeedle(B, Tp, main ? 6.8 : 5.2, main ? 2.4 : 1.9));
    });
    const fg = thr.join('') + nd.join('') + eyes.join('');
    return { bg, fg };
  } };

  // 2. 부채 단검 — hanji fan whose ribs are forged into blades, against a black moon; one cyan glint
  I.fanKnives = { rarity: 'common', kind: 'active', name: '부채 단검', draw(c, A) {
    const cx = 64, cy = 113, n = 7, a0 = -146, a1 = -34, rad = (d) => d * Math.PI / 180;
    const at = (a, r) => [cx + Math.cos(rad(a)) * r, cy + Math.sin(rad(a)) * r];
    const angs = []; for (let i = 0; i < n; i++) angs.push(a0 + (a1 - a0) * i / (n - 1));
    const bg = `<circle cx="64" cy="58" r="52" fill="${A ? K.ink7 : K.ink}"/>` + L(`M${f(at(-150, 70)[0])},${f(at(-150, 70)[1])} A70,70 0 0 1 ${f(at(-30, 70)[0])},${f(at(-30, 70)[1])}`, A ? K.p300 : K.p50, 1.2, 'stroke-dasharray="2 4" opacity="0.8"');
    let leaf = '';
    for (let i = 0; i < n - 1; i++) {
      const pa = angs[i], pb = angs[i + 1], pm = (pa + pb) / 2;
      const whole = poly([at(pa, 22), at(pa, 60), at(pm, 61.5), at(pb, 60), at(pb, 22)]);
      const half = poly([at(pm, 22), at(pm, 61.5), at(pb, 60), at(pb, 22)]);
      const tone = i >= n - 2 ? K.ink : c.dot('fd' + i, 6, i >= 3 ? 0.4 : 0.2, K.ink);
      leaf += P(whole, K.paper) + P(half, tone) + L(`M${at(pm, 22).map(f).join(',')} L${at(pm, 61).map(f).join(',')}`, K.ink, 1);
    }
    const leafOut = poly(angs.map((a) => at(a, 60.5)).concat([at(a1, 22), at(a0, 22)]));
    let blades = '';
    angs.forEach((a, i) => {
      if (i === 0 || i === n - 1) return;
      const u = [Math.cos(rad(a)), Math.sin(rad(a))], nn = [-u[1], u[0]];
      const q = (r, s) => [cx + u[0] * r + nn[0] * s, cy + u[1] * r + nn[1] * s];
      const w = 4.6, tipR = i === 3 ? 88 : 81;
      blades += S(poly([q(52, -w * 0.75), q(63, -w), q(tipR, 0), q(63, w), q(52, w * 0.75)]), K.p50, 2.3, 1.2) + P(poly([q(55, 0), q(63, w * 0.9), q(tipR - 1, 0)]), K.ink);
    });
    const sticks = poly([at(a0, 23), [cx - 5, cy + 5], [cx + 5, cy + 5], at(a1, 23)]);
    const ribs = angs.map((a) => L(`M${at(a, 9).map(f).join(',')} L${at(a, 58).map(f).join(',')}`, K.ink, 2)).join('');
    const tip = at(-90, 86);
    const glint = `<path d="${burst(tip[0], tip[1] - 1, 9, 2.4, 4, -Math.PI / 2)}" fill="${K.ally}" stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"/><circle cx="${f(tip[0])}" cy="${f(tip[1] - 1)}" r="1.7" fill="${K.p50}"/>`;
    const fg = `${blades}${P(leafOut, K.ink, 'transform="translate(1.6,2)"')}${leaf}
      ${P(leafOut, 'none', `stroke="${K.ink}" stroke-width="3" stroke-linejoin="round"`)}${ribs}
      ${T([at(-140, 58)[0], at(-140, 58)[1], at(-110, 64)[0], at(-110, 64)[1], at(-80, 62)[0], at(-80, 62)[1]], 2.2, 'mid', K.p50)}
      ${S(sticks, K.ink, 2.4, 1.2)}${T([at(a0 + 8, 21)[0], at(a0 + 8, 21)[1], cx - 12, cy - 8, cx - 3, cy - 1], 1.6, 'mid', K.ink5)}
      <circle cx="${cx}" cy="${cy}" r="4.6" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.2"/><circle cx="${cx}" cy="${cy}" r="1.5" fill="${K.ink}"/>
      ${glint}`;
    return { bg, fg };
  } };

  // ink-drop target (먹귀 drop): ink blob + ink.500 lit plane + ink.300 rim + slit paper eyes + drips
  function inkDot(c, x, y, r, seed, eyes = true) {
    const d = blob(x, y, r, 9, 0.22, seed);
    const lit = P(d, K.ink5) + P(blob(x + r * 0.2, y + r * 0.22, r * 0.97, 9, 0.22, seed), K.ink);
    const eye = eyes ? `<path d="M${f(x - r * 0.55)},${f(y - r * 0.05)} Q${f(x - r * 0.25)},${f(y - r * 0.32)} ${f(x + r * 0.02)},${f(y - r * 0.08)} Q${f(x - r * 0.25)},${f(y + r * 0.08)} ${f(x - r * 0.55)},${f(y - r * 0.05)} Z M${f(x + r * 0.15)},${f(y - r * 0.15)} Q${f(x + r * 0.35)},${f(y - r * 0.34)} ${f(x + r * 0.55)},${f(y - r * 0.18)} Q${f(x + r * 0.35)},${f(y - r * 0.05)} ${f(x + r * 0.15)},${f(y - r * 0.15)} Z" fill="${K.p50}"/>` : '';
    return S(d, K.ink, 2.2, 1) + `<g clip-path="${c.clip('dl' + seed, d)}">${lit}</g>` + eye +
      P(drip(x + r * 0.25, y + r * 0.8, r * 0.75, r * 0.2) + drip(x - r * 0.4, y + r * 0.7, r * 0.5, r * 0.15), K.ink) +
      L(`M${f(x - r * 0.85)},${f(y - r * 0.25)} Q${f(x - r * 0.65)},${f(y - r * 0.85)} ${f(x)},${f(y - r * 0.97)}`, K.ink3, 1.1);
  }
  PN._ki.inkDot = inkDot;
  // 3. 백색 연쇄 — a white bolt (ink / cyan / paper core) links three ink-drop ghouls
  I.chainSpark = { rarity: 'rare', kind: 'active', name: '백색 연쇄', draw(c, A) {
    const bg = (A ? '' : c.ht(0, 0, 128, 90, 8, (x, y) => Math.max(0, Math.min(2.7, (64 - y) / 18 + 0.3)), K.ink, 45)) +
      `<path d="M0,128 L0,114 C30,106 70,120 128,106 L128,128 Z" fill="${A ? K.ink7 : K.ink}"/>`;
    const pts = [[28, 87], [40, 75], [33, 69], [50, 58], [44, 52], [60, 46], [73, 58], [67, 63], [88, 64], [83, 70], [104, 74]];
    const d = 'M' + pts.map((q) => q.join(',')).join(' L');
    const star = (x, y, r, s) => `<path d="${burst(x, y, r, r * 0.42, 6, 0.3, 0.3, s)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"/>`;
    const ticks = [[29, 72, -1], [47, 57, 1], [73, 55, 1], [82, 75, -1]].map(([x, y, sg]) => L(`M${x - 5 * sg},${y - 6} l-4,-3 M${x + 6 * sg},${y - 4} l4,-4`, K.ink, 2)).join('');
    const fg = `${inkDot(c, 20, 99, 14, 3)}${inkDot(c, 61, 34, 12, 7)}${inkDot(c, 107, 86, 13, 11)}
      ${L(d, K.ink, 10.5)}${L(d, K.ally, 5.6)}${L(d, K.p50, 2.2)}
      ${star(28, 87, 7, 2)}${star(60, 46, 6.5, 4)}${star(104, 74, 7, 6)}`;
    return { bg, fg };
  } };

  // 4. 백묵 절단 — a chalk stick has sliced a black mass in two; chalk dust flies
  I.frostLine = { rarity: 'rare', kind: 'active', name: '백묵 절단', draw(c, A) {
    const y = (x) => 121 - x * 0.867;
    const mass = `M0,0 L128,0 L128,${f(y(128) - 5)} L0,${f(y(0) - 5)} Z`;
    const R = rng(21); let dust = '', crumbs = '';
    for (let i = 0; i < 30; i++) { const x = 10 + R() * 80, yy = y(x) - 8 - R() * 30 * (x / 90); dust += `<circle cx="${f(x)}" cy="${f(yy)}" r="${f(0.7 + R() * 1.8)}" fill="${K.p50}"/>`; }
    // rev 2.2 (P2 follow-up F2): angular chalk chips below the cut, not round crumbs (ink-ringed blobs read as 'o·0·8').
    // [x on the cut, extra clearance, long, wide, deg, shape]: four-point wedges (long side ≥ 1.6 × short side), centred
    // 1.5 + their radius + clearance off the cut's 12-wide ink stroke, outlines ≥ 8 apart (ink ≥ 7.2), clear of the star;
    // ink edge 1.1 and a p300 shade facet. Fixed geometry: the dust above still draws R first, in the same order.
    const CHIP = { qa: [[-0.5, -0.25], [0.3, -0.5], [0.5, 0.3], [-0.2, 0.5]], qb: [[-0.5, 0.1], [-0.1, -0.5], [0.5, -0.2], [0.25, 0.5]], wa: [[-0.5, -0.45], [0.5, -0.2], [0.42, 0.22], [-0.45, 0.5]] };
    const FACET = { qa: [1, 2, 3], qb: [2, 3, 0], wa: [2, 3] };
    [[30, 0.5, 7.4, 4, 25, 'qa'], [42, 4, 6.6, 3.8, -35, 'wa'], [54, 1, 8, 4.4, 70, 'qb'], [65, 5, 6.6, 3.8, 10, 'qa'], [76, 2.5, 7.2, 4, -60, 'wa']].forEach(([x0, e, lg, w, deg, sh]) => {
      const r = deg * Math.PI / 180, co = Math.cos(r), si = Math.sin(r);
      const pts = CHIP[sh].map(([u, v]) => [u * lg * co - v * w * si, u * lg * si + v * w * co]);
      const d = 7.5 + Math.max(...pts.map((p) => Math.hypot(p[0], p[1]))) + e, cx = x0 + 0.655 * d, cy = y(x0) + 0.756 * d;
      const Q = pts.map((p) => [cx + p[0], cy + p[1]]), F = FACET[sh].map((k) => Q[k]).concat([[cx, cy]]);
      crumbs += P(poly(Q), K.p50) + P(poly(F), K.p300) + `<path d="${poly(Q)}" fill="none" stroke="${K.ink}" stroke-width="1.1" stroke-linejoin="miter"/>`;
    });
    const bg = `<path d="${mass}" fill="${A ? K.ink7 : K.ink}"/>` +
      `<path d="M0,0 L60,0 C40,4 16,18 0,40 Z" fill="${K.ink5}" opacity="${A ? 0.5 : 1}"/><path d="M0,0 L46,0 C30,6 12,16 0,30 Z" fill="${A ? K.ink7 : K.ink}"/>` + L('M0,39 C16,18 38,4 60,0', K.ink3, 1.2) +
      `<path d="M12,58 Q22,51 31,57 Q22,61 12,58 Z M36,49 Q42,45 48,48 Q43,52 36,49 Z" fill="${K.p50}"/><circle cx="23" cy="57" r="1.7" fill="${K.ink}"/><circle cx="43" cy="48.5" r="1.3" fill="${K.ink}"/>` +
      P(drip(22, y(22) - 6, 6, 1.6) + drip(58, y(58) - 6, 8, 2), A ? K.ink7 : K.ink);
    const cut = `M-4,${f(y(-4) - 2)} L132,${f(y(132) - 2)}`;
    const u = [0.756, -0.655], n = [0.655, 0.756], r = 9, len = 44;
    const Tp = [78, y(78) - 12], E = [Tp[0] + u[0] * len, Tp[1] + u[1] * len];
    const q = (p) => p.map(f).join(',');
    const pa = [Tp[0] + n[0] * r, Tp[1] + n[1] * r], pb = [Tp[0] - n[0] * r + u[0] * 7, Tp[1] - n[1] * r + u[1] * 7];
    const body = `M${q(pa)} L${q([E[0] + n[0] * r, E[1] + n[1] * r])} L${q([E[0] - n[0] * r, E[1] - n[1] * r])} L${q(pb)} Z`;
    const shade = `M${q([Tp[0] + n[0] * 2, Tp[1] + n[1] * 2])} L${q([E[0] + n[0] * 2, E[1] + n[1] * 2])} L${q([E[0] + n[0] * r * 1.3, E[1] + n[1] * r * 1.3])} L${q([Tp[0] + n[0] * r * 1.3, Tp[1] + n[1] * r * 1.3])} Z`;
    const deg = f(Math.atan2(u[1], u[0]) * 180 / Math.PI);
    const fg = `${L(cut, K.ink, 12)}${L(cut, K.p50, 8)}${L(cut, K.ally, 2)}
      ${crumbs}${dust}
      ${S(body, K.p50, 2.6, 1.4)}<g clip-path="${c.clip('ch', body)}">${P(shade, c.dot('chs', 6, 0.4, K.ink))}${L(`M${q([Tp[0] - n[0] * 4 + u[0] * 10, Tp[1] - n[1] * 4 + u[1] * 10])} L${q([E[0] - n[0] * 5, E[1] - n[1] * 5])}`, K.p300, 1.6)}</g>
      <ellipse cx="${f(E[0])}" cy="${f(E[1])}" rx="3.6" ry="${r}" transform="rotate(${deg} ${f(E[0])} ${f(E[1])})" fill="${K.paper}" stroke="${K.ink}" stroke-width="2.4"/>
      <path d="${burst(Tp[0] + 2, Tp[1] + 9, 10, 4, 6, 0.2, 0.4, 8)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.8" stroke-linejoin="round"/>`;
    return { bg, fg };
  } };

})(window.PN);
// ---- skill icon drawings A2 (actives 5-6: orbitScythes, boneMortar) ----
(function (PN) {
  const { K, S, P, L, T, f, rng, poly, taperPoly, burst, ellipsePts, blob, drip } = PN._ki;
  const I = PN._ki.ICON = PN._ki.ICON || {};
  // crescent blade: circle(R) minus circle offset by d; inner(): line just inside the concave edge
  function crescent(cx, cy, R, dk, rot) {
    const d = R * dk, h = Math.sqrt(R * R - d * d / 4);
    return `d="M${f(d / 2)},${f(-h)} A${R},${R} 0 1 0 ${f(d / 2)},${f(h)} A${R},${R} 0 0 1 ${f(d / 2)},${f(-h)} Z" transform="translate(${f(cx)},${f(cy)}) rotate(${rot})"`;
  }
  function crescentInner(cx, cy, R, dk, rot, ins = 2.6) {
    const d = R * dk, h = Math.sqrt(R * R - d * d / 4) - 3, c0 = d - ins, x = c0 - Math.sqrt(R * R - h * h);
    return `d="M${f(x)},${f(h)} A${R},${R} 0 0 1 ${f(x)},${f(-h)}" transform="translate(${f(cx)},${f(cy)}) rotate(${rot})"`;
  }
  PN._ki.crescent = crescent; PN._ki.crescentInner = crescentInner;
  // 낫 sickle in local coords: handle along -x (wrapped), ferrule at 0, hooked crescent blade curving to the tip (+x,-y)
  const q = (p) => f(p[0]) + ',' + f(p[1]);
  function sickle(x, y, ang, k, cyan) {
    const blade = 'M-1,-1.6 C1,-13 11,-22.6 25,-21.2 C27.4,-21 28.2,-19.6 26.6,-19 C15.6,-16 8.2,-9.8 5,2.6 Z';
    const inner = 'M6.6,-2.4 C9.6,-10.6 15.6,-16 24.4,-18.8';
    return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(ang)}) scale(${k})">
      <path d="M-16,-3.2 L-1,-3.2 L-1,3.2 L-16,3.2 A3.2,3.2 0 0 1 -16,-3.2 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="2.6" transform="translate(1,1.3)"/>
      <path d="M-16,-3.2 L-1,-3.2 L-1,3.2 L-16,3.2 A3.2,3.2 0 0 1 -16,-3.2 Z" fill="${K.p300}" stroke="${K.ink}" stroke-width="2.2"/>
      ${L('M-13,-3.2 l2.4,6.4 M-8.4,-3.2 l2.4,6.4', K.ink, 1.8)}
      <path d="${blade}" fill="${K.ink}" stroke="${K.ink}" stroke-width="3" stroke-linejoin="round" transform="translate(1.2,1.5)"/>
      <path d="${blade}" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.6" stroke-linejoin="round"/>
      ${cyan ? L(inner, K.ink, 4.2) + L(inner, K.ally, 2.2) : L(inner, K.ink3, 1.3)}
      <rect x="-3.4" y="-4.6" width="5.2" height="9.2" rx="1" fill="${K.ink}" stroke="${K.p50}" stroke-width="1.1"/></g>`;
  }
  PN._ki.sickle = sickle;
  // 5. 초승 궤도 — a 3/4 top-down gat at the centre; two wrapped-handle sickles ride a tilted orbit (10 & 4 o'clock)
  //    with trailing motion arcs; the orbit breaks outside the black disc on both sides (no iris read).
  I.orbitScythes = { rarity: 'epic', kind: 'active', name: '초승 궤도', draw(c, A) {
    const cx = 64, cy = 66, rx = 51, ry = 23, rot = 20 * Math.PI / 180;
    const E = (th) => { const x = Math.cos(th) * rx, y = Math.sin(th) * ry; return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]; };
    const arc = (a0, a1, n = 40) => { const o = []; for (let i = 0; i <= n; i++) o.push(E(a0 + (a1 - a0) * i / n)); return o; };
    const disc = 'M22,63 A42,42 0 1 0 106,63 A42,42 0 1 0 22,63 Z', inD = c.clip('dc', disc);
    const dd = (pts) => 'M' + pts.map(q).join(' L');
    const two = (s1, s2) => s1 + `<g clip-path="${inD}">${s2}</g>`; // ink outside the disc, paper inside
    const ring = (a0, a1, w) => two(L(dd(arc(a0, a1)), K.ink, w), L(dd(arc(a0, a1)), K.p50, w));
    const bg = `<circle cx="64" cy="63" r="42" fill="${A ? K.ink7 : K.ink}"/>` + (A ? '' : c.ht(0, 0, 128, 128, 8, (x, y) => { const d = Math.hypot(x - 64, y - 63); return d < 40 ? Math.max(0, Math.min(2.2, (d - 24) / 8)) : 0; }, K.ink5));
    // sickle A (back, upper-left, 10 o'clock) travels right->left over the back; sickle B (front, lower-right, 4 o'clock)
    const tA = 3.72, tB = 0.58, pA = E(tA), pB = E(tB);
    const tang = (t) => { const a = E(t - 0.02), b = E(t + 0.02); return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; };
    const trail = (t) => { const a1 = arc(t - 1.2, t - 0.2, 30), a2 = arc(t - 0.85, t - 0.24, 20).map((p) => [p[0] + (p[0] - cx) * 0.12, p[1] + (p[1] - cy) * 0.12]); return two(taperPoly(a1, 0.4, 6.6, K.ink), taperPoly(a1, 0.4, 6.6, K.p50)) + two(taperPoly(a2, 0.2, 2.6, K.ink), taperPoly(a2, 0.2, 2.6, K.p300)); };
    // gat (3/4 top-down): paper brim disc + concentric 말총 rings, crown with ink shadow wedge, ink band
    const gx = 64, gy = 64;
    const gat = `<ellipse cx="${gx + 2}" cy="${gy + 3}" rx="30" ry="12.6" fill="${K.ink}"/>
      <ellipse cx="${gx}" cy="${gy}" rx="30" ry="12.6" fill="${K.p50}" stroke="${K.ink}" stroke-width="3.2"/>
      <path d="M${gx - 26},${gy + 4} A30,12.6 0 0 0 ${gx + 18},${gy + 11}" fill="none" stroke="${K.ink3}" stroke-width="1.6"/>
      <path d="M${gx - 10},${gy - 1} L${gx - 9},${gy - 17} A9,3.6 0 0 1 ${gx + 9},${gy - 17} L${gx + 10},${gy - 1} A10,4.2 0 0 1 ${gx - 10},${gy - 1} Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M${gx + 3},${gy - 16.4} L${gx + 9},${gy - 17} L${gx + 10},${gy - 1} C${gx + 8},${gy + 2} ${gx + 5},${gy + 3} ${gx + 2.4},${gy + 3.2} Z" fill="${K.ink}"/>
      <path d="M${gx - 10},${gy - 4.4} A10,4.2 0 0 0 ${gx + 10},${gy - 4.4} L${gx + 10},${gy - 1} A10,4.2 0 0 1 ${gx - 10},${gy - 1} Z" fill="${K.ink}"/>
      <ellipse cx="${gx}" cy="${gy - 17}" rx="9" ry="3.6" fill="${K.p300}" stroke="${K.ink}" stroke-width="2.4"/>`;
    const fg = `${ring(Math.PI, Math.PI * 2, 2.2)}${trail(tA)}
      ${sickle(pA[0], pA[1], tang(tA), 1.02, false)}
      ${gat}
      ${ring(0, Math.PI, 2.8)}${trail(tB)}
      ${sickle(pB[0], pB[1], tang(tB), 1.14, true)}`;
    return { bg, fg };
  } };

  // 6. 골분 박격 — a sealed bone-powder onggi jar drops onto a stitched landing zone, white burst
  I.boneMortar = { rarity: 'epic', kind: 'active', name: '골분 박격', draw(c, A) {
    const bg = (A ? '' : c.ht(0, 0, 128, 84, 8, (x, y) => Math.max(0, Math.min(2.6, (64 - y) / 22 + 0.5)), K.ink, 45)) +
      `<path d="M0,128 L0,100 C40,90 90,96 128,88 L128,128 Z" fill="${A ? K.ink7 : K.ink}"/>`;
    const jar = 'M-9,-22 L9,-22 L8,-19 C14,-17 21,-13 23,-6 C25,2 20,12 13,19 C10,22 8,24 6,25 L-6,25 C-8,24 -10,22 -13,19 C-20,12 -25,2 -23,-6 C-21,-13 -14,-17 -8,-19 Z';
    const R = rng(4); let bones = '', powder = '';
    [[60, 82, -30], [112, 80, 25], [72, 96, 70], [106, 100, -15]].forEach(([x, y, a]) => {
      bones += `<g transform="translate(${x},${y}) rotate(${a})"><path d="M-5,-1.4 L5,-1.4 A2.1,2.1 0 1 1 5,1.4 L-5,1.4 A2.1,2.1 0 1 1 -5,-1.4 Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.5"/></g>`;
    });
    for (let i = 0; i < 9; i++) powder += `<circle cx="${f(20 + R() * 14 - i)}" cy="${f(14 - i * 1.4 + R() * 6)}" r="${f(1 + R() * 1.4)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="0.9"/>`;
    const ring = ellipsePts(88, 106, 36, 11, 60), rd = 'M' + ring.map((q) => f(q[0]) + ',' + f(q[1])).join(' L');
    const fall = [[34, 0, 38, 12], [48, 0, 50, 8], [60, 2, 60, 12]].map(([a, b, x, y]) => T([a, b, (a + x) / 2, (b + y) / 2, x, y], 2.4, 'end', A ? K.p300 : K.ink)).join('');
    const fg = `
      ${L(rd, K.ink, 5, 'stroke-dasharray="7 4.5"')}${L(rd, K.ally, 2.6, 'stroke-dasharray="7 4.5"')}
      <path d="${burst(88, 92, 31, 12, 9, -0.2, 0.5, 12)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="${burst(88, 92, 15, 7, 7, 0.1, 0.4, 13)}" fill="none" stroke="${K.ink}" stroke-width="1.4"/>
      ${bones}${fall}${powder}
      <g transform="translate(44,41) rotate(20) scale(1.14)">
        <path d="${jar}" fill="none" stroke="${K.p50}" stroke-width="7" stroke-linejoin="round"/>
        ${S(jar, K.ink, 3, 1.6)}
        <g clip-path="${c.clip('jar', jar)}"><path d="M-26,-12 C-22,-19 -12,-21 -3,-20 C-13,-14 -18,-3 -19,14 C-24,6 -27,-3 -26,-12 Z" fill="${K.ink5}"/>${T([-21, -9, -23, 2, -18, 14], 1.8, 'mid', K.ink3)}</g>
        ${L('M-13,-17.6 C-5,-14.6 5,-14.6 13,-17.6', K.p50, 2.2)}${L('M9,-16 q4,6 1,12 M11,-16 q6,5 4,10', K.p50, 1.6)}
        <g transform="rotate(-8 1 4)"><path d="M-9.6,-5.4 L10.4,-6.4 L11.2,13 L-8.8,13.8 Z" fill="${K.ink}" transform="translate(1.2,1.4)"/><path d="M-9.6,-5.4 L10.4,-6.4 L11.2,13 L-8.8,13.8 Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.8" stroke-linejoin="round"/>
          ${[38, -38].map((a) => `<g transform="translate(0.8,3.8) rotate(${a})"><path d="M-6,-1.3 L6,-1.3 A1.9,1.9 0 1 1 6,1.3 L-6,1.3 A1.9,1.9 0 1 1 -6,-1.3 Z" fill="${K.ink}"/></g>`).join('')}</g>
        <path d="M-11,-30 L11,-31 L9,-21 L-10,-21 Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="2"/>
        ${L('M-10,-21 C-4,-19 4,-19 9,-21', K.ink, 1.8)}
      </g>`;
    return { bg, fg };
  } };
})(window.PN);
// ---- PN.icons.skill / frame / tile ----
(function (PN) {
  const { K, ctx, S, P, L, T, f, rng, poly, taperPoly, ellipsePts, blob, drip } = PN._ki;
  const I = () => PN._ki.ICON;
  const RAR = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  const RAR_KO = { common: '일반', rare: '희귀', epic: '영웅', legendary: '전설', mythic: '신화' };
  PN.icons.RARITY = RAR; PN.icons.RARITY_KO = RAR_KO;
  // 覺 seal glyph (rev 2.3, 2026-10-27; the user's choice (다) in the kit P2 review §2.2). The kit wrote it with brush
  // strokes from the structure of the character alone: 覺 = 𦥯 (the two 𦥑 halves around 爻, then 冖) over 見 (目 + 儿),
  // 20 strokes in the standard order. No font was rendered or looked at, no other hand's calligraphy, and not the
  // earlier outline. Each stroke is a taperFn brush ribbon over a smooth() spine, plus small ellipses for the pressed
  // entries, the turns and the round ends. Every piece winds the same way, so the one nonzero-filled path is their
  // union (even-odd would open holes where strokes cross). Card units, inside the seal's ensō ring. The stroke table
  // (start, end, brush) is in API-icons.md, frame().
  const KAKU_STROKES = (() => {
    const { taperFn, smooth } = PN._ki;
    const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));
    // brush width along the stroke (t 0..1): presses in over a from s0·w, lifts out over b to s1·w, body eased to m·w
    const prof = (w, a, s0, b, s1, m) => (t) => {
      const u = (t - a) / (1 - a - b);
      return w * (t < a ? s0 + (1 - s0) * ease(t / a) : t > 1 - b ? s1 + (1 - s1) * ease((1 - t) / b) : 1) *
        (u > 0 && u < 1 ? 1 - (1 - m) * Math.sin(Math.PI * u) : 1);
    };
    // even spacing along the spine, about 3 samples per card unit
    const resample = (pts) => {
      const acc = [0];
      for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const len = acc[acc.length - 1], n = Math.max(10, Math.min(28, Math.round(len * 3))), out = [];
      for (let k = 0, j = 0; k <= n; k++) {
        const s = len * k / n;
        while (j < acc.length - 2 && acc[j + 1] < s) j++;
        const u = (s - acc[j]) / ((acc[j + 1] - acc[j]) || 1);
        out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]);
      }
      return out;
    };
    const unit = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
    const at = (p, u, s, dy = 0) => [p[0] + u[0] * s, p[1] + u[1] * s + dy];
    // ellipse wound like the ribbons (reversed ellipsePts), so nonzero fill unions it with them
    const ell = (c, rx, ry, deg) => poly(ellipsePts(c[0], c[1], rx, ry, 12, 0, Math.PI * 2, deg * Math.PI / 180).slice(0, 12).reverse());
    const rib = (pts, wfn) => { const m = taperFn(resample(smooth(pts, 8)), wfn), i = m.indexOf('d="') + 3; return m.slice(i, m.indexOf('"', i)); };
    // piece kinds: [ribbon profile a, s0, b, s1, m], pressed head, end
    const KIND = {
      H: [[0.14, 0.8, 0.16, 0.72, 0.92], 1, 'press'],  // 橫: pressed entry, a slightly thinner body, pressed stop
      Hc: [[0.14, 0.8, 0.06, 0.92, 0.92], 1, ''],       // 橫 running into a turn
      S: [[0.12, 0.85, 0.14, 0.82, 0.9], 1, 'round'],   // 豎 with a round (垂露) end
      Sc: [[0.05, 0.95, 0.14, 0.82, 0.9], 0, 'round'],  // 豎 out of a turn
      P: [[0.12, 0.88, 0.6, 0.07, 1], 1, ''],           // 撇: pressed entry, lifts off to a point
      T: [[0.12, 0.9, 0.7, 0.07, 1], 1, ''],            // 提
      D: [[0.68, 0.3, 0.12, 0.82, 1], 0, 'round'],      // 點: lands thin, ends full
      N: [[0.72, 0.24, 0.1, 0.78, 1], 0, 'round'],      // 爻's right-falling long dots
      W: [[0.1, 0.88, 0.05, 0.96, 0.8], 1, ''],         // 豎彎 running into the hook
      G: [[0.04, 1, 0.8, 0.06, 1], 0, '']               // 鉤
    };
    const piece = ([k, pts, w]) => {
      if (k === 'Z') return ell([pts[0] + w * 0.1, pts[1] + w * 0.06], w * 0.6, w * 0.46, 45); // pressed turn (頓)
      const [pr, hd, end] = KIND[k], p0 = pts[0], p1 = pts[pts.length - 1];
      const u0 = unit(p0, pts[1]), u1 = unit(pts[pts.length - 2], p1);
      let d = rib(pts, prof(w, ...pr));
      if (hd) d += ' ' + ell(at(p0, u0, w * 0.26, w * 0.03), w * 0.55, w * 0.41, 45);
      if (end === 'press') d += ' ' + ell(at(p1, u1, -w * 0.24, w * 0.07), w * 0.5, w * 0.39, 38);
      if (end === 'round') d += ' ' + ell(at(p1, u1, -w * 0.1), w * 0.45, w * 0.41, Math.atan2(u1[1], u1[0]) * 180 / Math.PI);
      return d;
    };
    // [stroke number, stroke, pieces [kind, spine (card units), width]] in writing order
    const STROKES = [
      // 𦥑, left half
      [1, '㇒', [['P', [[131.35, 11.88], [130.42, 12.84], [129.5, 13.8]], 1.45]]],
      [2, '㇑', [['S', [[129.4, 13.6], [129.52, 16.1], [129.68, 18.7]], 1.45]]],
      [3, '㇐', [['H', [[129.9, 15.72], [131.0, 15.6], [132.2, 15.48]], 1.02]]],
      [4, '㇀', [['T', [[129.8, 18.55], [131.2, 18.08], [132.7, 17.45]], 1.14]]],
      // 爻
      [5, '㇒', [['P', [[138.75, 12.0], [137.3, 13.22], [135.25, 14.6]], 1.38]]],
      [6, '㇔', [['N', [[135.55, 12.55], [136.85, 13.5], [138.05, 14.35]], 1.45]]],
      [7, '㇒', [['P', [[140.0, 15.55], [137.65, 17.2], [134.55, 18.85]], 1.45]]],
      [8, '㇏', [['N', [[135.3, 15.95], [137.6, 17.25], [140.2, 18.5]], 1.55]]],
      // 𦥑, right half
      [9, '㇕', [['Hc', [[142.1, 12.85], [143.65, 12.75], [145.25, 12.62]], 1.12], ['Z', [145.4, 12.75], 1.3], ['Sc', [[145.4, 12.8], [145.3, 15.7], [145.1, 18.45]], 1.45]]],
      [10, '㇐', [['H', [[142.35, 15.7], [143.65, 15.62], [145.0, 15.55]], 1.12]]],
      [11, '㇐', [['H', [[142.15, 18.45], [143.65, 18.38], [145.2, 18.3]], 1.19]]],
      // 冖
      [12, '㇔', [['D', [[127.0, 20.15], [127.32, 20.95], [127.6, 21.8]], 1.75]]],
      [13, '㇖', [['Hc', [[127.9, 20.9], [137.5, 20.68], [146.9, 20.55]], 1.5], ['Z', [146.9, 20.6], 1.45], ['G', [[146.95, 20.65], [146.4, 21.8], [145.6, 22.85]], 1.65]]],
      // 目
      [14, '㇑', [['S', [[133.0, 22.75], [133.08, 25.95], [133.2, 29.4]], 1.75]]],
      [15, '㇕', [['Hc', [[133.3, 22.95], [137.2, 22.8], [141.1, 22.6]], 1.26], ['Z', [141.25, 22.75], 1.35], ['Sc', [[141.25, 22.8], [141.12, 26.0], [140.9, 29.25]], 1.85]]],
      [16, '㇐', [['H', [[133.7, 25.05], [136.7, 24.93], [139.35, 24.81]], 1.19]]],
      [17, '㇐', [['H', [[133.7, 27.12], [136.7, 27.0], [139.35, 26.89]], 1.19]]],
      [18, '㇐', [['H', [[133.15, 29.25], [137.1, 29.1], [141.3, 28.92]], 1.3]]],
      // 儿
      [19, '㇒', [['P', [[134.55, 29.6], [134.4, 31.0], [133.0, 32.3], [129.5, 33.0]], 2.0]]],
      [20, '㇟', [['W', [[138.65, 29.55], [138.7, 31.15], [139.4, 32.35], [141.5, 32.65], [145.3, 32.5]], 1.9], ['Z', [145.25, 32.4], 1.7], ['G', [[145.3, 32.55], [145.75, 31.7], [146.15, 30.75]], 1.8]]]
    ];
    return Object.freeze(STROKES.map(([n, stroke, pieces]) => Object.freeze({ n, stroke, pieces, d: pieces.map(piece).join(' ') })));
  })();
  const KAKU = KAKU_STROKES.map((s) => s.d).join(' ');
  PN._ki.KAKU_STROKES = KAKU_STROKES;
  PN._ki.KAKU = KAKU;

  // ensō brush circle: thick entry, dry-brush (비백) streaks, thin exit, open gap
  function enso(cx, cy, r, col, w, gapAt = -0.9, seed = 3, bgc) {
    const arc = ellipsePts(cx, cy, r, r, 60, gapAt + 0.35, gapAt + Math.PI * 2 - 0.25);
    const R = rng(seed);
    let s = taperPoly(arc.slice(0, 44), w * 0.6, w, col) + taperPoly(arc.slice(43), w, w * 0.12, col);
    if (bgc) for (let k = 0; k < 3; k++) { const i0 = 8 + Math.floor(R() * 26), off = (R() - 0.5) * w * 0.5; s += taperPoly(ellipsePts(cx, cy, r + off, r + off, 60, gapAt + 0.35, gapAt + Math.PI * 2 - 0.25).slice(i0, i0 + 10 + Math.floor(R() * 10)), 0.3, 1.1, bgc, 'opacity="0.85"'); }
    return s;
  }
  PN._ki.enso = enso;

  // skill(id, {size=128, awakened=false}) -> <g> in 0..size box
  PN.icons.skill = function (id, o = {}) {
    const def = I()[id]; if (!def) return '';
    const A = !!o.awakened, size = o.size || 128, c = ctx('s');
    // halftone floor: >= 8 at the 128 master and >= 3 px at the display size (40 px HUD -> 9.6)
    c.minPitch = Math.max(8, 3 * 128 / (o.pitchFor || size));
    const win = 'M0,0 H128 V128 H0 Z', cw = c.clip('w', win);
    const r = def.draw(c, A);
    const gr = c.grain('g', A ? 0.07 : 0.06, 3 + (id.length % 7));
    const rough = c.rough('r', 1.3, 0.06, 4);
    // r.top = foreground that must stay inside the window (roof lines, ground bands): drawn after fg, always clipped
    const top = r.top ? `<g clip-path="${cw}"><g filter="${rough}">${r.top}</g></g>` : '';
    let body;
    if (!A) {
      const tone = c.ht(0, 0, 128, 128, 8, (x, y) => Math.max(0, Math.min(2.2, (x + y - 170) / 40)), K.ink);
      body = `<g clip-path="${cw}"><rect width="128" height="128" fill="${K.paper}"/>${tone}${r.bg || ''}<g filter="${rough}">${r.fg}</g>${r.top ? `<g filter="${rough}">${r.top}</g>` : ''}<rect width="128" height="128" filter="${gr}"/></g>`;
    } else {
      const tone = c.ht(0, 0, 128, 128, 8, (x, y) => Math.max(0, Math.min(2.4, (Math.hypot(x - 64, y - 64) - 40) / 14)), K.ink5);
      body = `<g clip-path="${cw}"><rect width="128" height="128" fill="${K.ink}"/>${tone}${r.bg || ''}${enso(64, 64, 52, K.p50, 9, -0.9, 5, K.ink)}<rect width="128" height="128" filter="${gr}"/></g>
        <g clip-path="${c.clip('pop', 'M-10,-10 H138 V138 H-10 Z')}"><g transform="translate(64 64) scale(1.1) translate(-64 -64)" ${def.halo === false ? '' : `filter="${c.halo('h', 2.2, K.p50)}"`}><g filter="${rough}">${r.fg}</g></g></g>${top}`;
    }
    return c.out(body, `transform="scale(${f(size / 128)})"`);
  };

  // ---- rarity frame parts: 160 x 160 card, icon window (16,16)-(144,144), knot thread y=152 ----
  function frameParts(rarity, o = {}) {
    const c = ctx('f'), ri = Math.max(0, RAR.indexOf(rarity)), inv = rarity === 'mythic';
    c.minPitch = Math.max(8, o.size ? 3 * 160 / o.size : 8);
    const metal = o.metal !== false, A = !!o.awakened;
    const card = inv ? K.ink : K.hanji, ln = inv ? K.p50 : K.ink, R = rng(11 + ri);
    let back = '', front = '', seal = '';
    // card silhouette: plain (common..epic) / torn edge (legendary, mythic)
    let cardD = 'M0,0 H160 V160 H0 Z';
    if (ri >= 3) {
      const e = []; const j = () => (R() - 0.5) * 2.4;
      for (let x = 0; x <= 160; x += 8) e.push([x, j() - 1]); for (let y = 8; y <= 160; y += 8) e.push([161 + j(), y]);
      for (let x = 152; x >= 0; x -= 8) e.push([x, 161 + j()]); for (let y = 152; y > 0; y -= 8) e.push([j() - 1, y]);
      cardD = poly(e);
    }
    back += `<path d="${cardD}" fill="${K.ink}" transform="translate(4,4)"/><path d="${cardD}" fill="${card}" stroke="${inv ? K.p50 : K.ink}" stroke-width="2"/>`;
    if (!inv) back += `<rect x="2" y="2" width="156" height="156" filter="${c.grain('g', 0.05)}"/>`;
    if (ri >= 3) front += `<rect x="5" y="5" width="150" height="150" fill="none" stroke="${ln}" stroke-width="1.3" stroke-dasharray="3 3" opacity="0.8"/>`;
    // metal leaf band (draft modal only) or ink fallback
    const band = (w) => {
      if (ri < 2) return '';
      let fill;
      if (ri >= 3 && metal) {
        const gid = c.id('m'), st = ri === 4 ? ['#6E5524', '#E9CF8A', '#B08A3E', '#F6E7B8', '#8A6A2C'] : ['#6D7176', '#E6E8EA', '#A3A7AC', '#F4F5F6', '#7E8287'];
        c.add(`<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">${st.map((s, i) => `<stop offset="${i / 4}" stop-color="${s}"/>`).join('')}</linearGradient>`);
        fill = `url(#${gid})`;
      } else fill = ri >= 3 ? (inv ? K.p50 : K.ink3) : c.dot('bd', 8, 0.4, ln);
      return `<path d="M${16 - w},${16 - w} H${144 + w} V${144 + w} H${16 - w} Z M16,16 V144 H144 V16 Z" fill="${fill}" fill-rule="evenodd"/>`;
    };
    const gap = ri >= 2 ? 6 : 3.5;
    front += band(gap);
    // window line(s): brush-pen strokes, heavier on bottom / right (shadow side)
    const brushBox = (x0, y0, x1, y1, w, col) =>
      T([x0 - 2, y0, (x0 + x1) / 2, y0 - 0.6, x1 + 2, y0], w * 0.8, 'flat', col) + T([x1, y0 - 2, x1 + 0.6, (y0 + y1) / 2, x1, y1 + 2], w * 1.3, 'flat', col) +
      T([x1 + 2, y1, (x0 + x1) / 2, y1 + 0.6, x0 - 2, y1], w * 1.35, 'flat', col) + T([x0, y1 + 2, x0 - 0.6, (y0 + y1) / 2, x0, y0 - 2], w * 0.8, 'flat', col);
    front += brushBox(16, 16, 144, 144, 3.2, ln);
    if (ri >= 1) front += `<rect x="${16 - gap}" y="${16 - gap}" width="${128 + gap * 2}" height="${128 + gap * 2}" fill="none" stroke="${ln}" stroke-width="1.5"/>`;
    // corner diamonds (epic+)
    if (ri >= 2) [[16, 16], [144, 16], [16, 144], [144, 144]].forEach(([x, y]) => {
      front += `<path d="M${x - 8},${y} L${x},${y - 8} L${x + 8},${y} L${x},${y + 8} Z" fill="${ln}" stroke="${inv ? K.ink : K.hanji}" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="1.8" fill="${inv ? K.ink : K.hanji}"/>`;
    });
    // knots (結) on a thread: count = rarity rank
    const n = ri + 1, sp = 14, x0 = 80 - (n - 1) * sp / 2, ky = 152.5;
    const tcol = inv ? K.p50 : K.ink;
    front += `<rect x="${f(x0 - 14)}" y="${ky - 6.5}" width="${f((n - 1) * sp + 28)}" height="13" fill="${card}"/>`;
    front += L(`M${f(x0 - 13)},${ky + 1} C${f(x0 - 6)},${ky - 2} ${f(x0 + (n - 1) * sp + 6)},${ky + 3} ${f(x0 + (n - 1) * sp + 13)},${ky}`, tcol, 1.5);
    for (let k = 0; k < n; k++) {
      const x = x0 + k * sp;
      front += `<circle cx="${f(x)}" cy="${ky}" r="5.4" fill="${tcol}"/>` + L(`M${f(x - 3.2)},${ky + 1.8} Q${f(x - 0.5)},${ky - 4.6} ${f(x + 2.2)},${ky - 0.4} M${f(x - 1.6)},${ky + 3.4} Q${f(x + 1.4)},${ky + 0.6} ${f(x + 3.4)},${ky + 1.6}`, inv ? K.ink : K.hanji, 1.2);
    }
    // awakened: ink-bleed border + ensō seal 覺
    if (A) {
      const bc = inv ? K.p50 : K.ink;
      [[10, 40, 6, 1], [150, 110, 7, 2], [30, 150, 5, 3], [120, 8, 5, 4], [150, 60, 4, 5]].forEach(([x, y, r, s]) => {
        front += P(blob(x, y, r, 8, 0.5, s), bc) + P(drip(x + 1, y + r * 0.6, r * 1.2, r * 0.3), bc);
      });
      // 覺 seal: paper disc + ink ensō ring, fully inside the card corner (glyph ≈ 22 units ≈ 8.8 px at 0.4 display).
      // The glyph is KAKU, the kit's 20 brush strokes as one path (no <text>, no font): the same shape on every machine.
      // nonzero fill: the stroke pieces overlap and wind the same way, so they union (even-odd would hole the joints).
      seal = `<circle cx="137" cy="23" r="${inv ? 20 : 19}" fill="${inv ? K.p50 : K.ink}" opacity="${inv ? 1 : 0.9}" transform="translate(${inv ? 0 : 1.5},${inv ? 0 : 2})"/>` +
        `<circle cx="137" cy="23" r="18" fill="${K.p50}"/>` + enso(137, 23, 16.2, K.ink, 4.4, -1.2, 7) +
        `<path class="ki-kaku" d="${KAKU}" fill="${K.ink}" fill-rule="nonzero"/>`;
    }
    return { c, back, front, seal };
  }
  PN.icons.frame = function (rarity, o = {}) {
    const { c, back, front, seal } = frameParts(rarity, o);
    return c.out(back + front + seal, o.size ? `transform="scale(${f(o.size / 160)})"` : '');
  };
  // tile(id, {rarity, awakened, metal, size=160}) -> frame + icon (awakened art breaks the panel)
  PN.icons.tile = function (id, o = {}) {
    const def = I()[id]; if (!def) return '';
    const { c, back, front, seal } = frameParts(o.rarity || def.rarity, o);
    const icon = PN.icons.skill(id, { awakened: o.awakened, pitchFor: o.size ? o.size * 0.8 : 128 });
    const body = (o.awakened ? back + front + `<g transform="translate(16,16)">${icon}</g>` : back + `<g transform="translate(16,16)">${icon}</g>` + front) + seal;
    return c.out(body, o.size ? `transform="scale(${f(o.size / 160)})"` : '');
  };
  PN.icons.list = () => Object.keys(I());
  PN.icons.info = (id) => { const d = I()[id]; return d ? { id, name: d.name, rarity: d.rarity, rarityKo: RAR_KO[d.rarity], kind: d.kind } : null; };
})(window.PN);
// ---- skill icon drawings B (actives 7-11) ----
(function (PN) {
  const { K, S, P, L, T, f, rng, poly, taperPoly, burst, ellipsePts, blob, drip } = PN._ki;
  const I = PN._ki.ICON;
  const q = (p) => p.map(f).join(',');
  const stitch = (d, w = 2.6, da = '7 4.5') => L(d, K.ink, w + 2.4, `stroke-dasharray="${da}"`) + L(d, K.ally, w, `stroke-dasharray="${da}"`);
  PN._ki.stitch = stitch;
  const ptsD = (a) => 'M' + a.map(q).join(' L');

  // 7. 흑선 레일 — a heavy black spear (cyan core) rides a ruled rail band across the whole icon and runs a ghoul through
  I.railSpear = { rarity: 'legendary', kind: 'active', name: '흑선 레일', draw(c, A) {
    const u = [0.788, -0.616], n = [0.616, 0.788], O = [60, 68];
    const at = (t, s = 0) => [O[0] + u[0] * t + n[0] * s, O[1] + u[1] * t + n[1] * s];
    const ln = A ? K.p300 : K.ink;
    // ruled rail band: flat ink.100 band between two ruled ink lines + one rivet-dot row (no ties, no hatching)
    const band = poly([at(-140, -11), at(140, -11), at(140, 11), at(-140, 11)]);
    let bg = `<path d="M128,70 L128,128 L58,128 Z" fill="${A ? K.ink7 : K.ink}"/>` + `<path d="${band}" fill="${A ? K.ink5 : K.ink1}"/>` +
      L(`M${q(at(-140, -11))} L${q(at(140, -11))}`, ln, 2.4) + L(`M${q(at(-140, 11))} L${q(at(140, 11))}`, ln, 3.4);
    for (let t = -126; t <= 126; t += 14) { const p = at(t, 7); bg += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="1.9" fill="${ln}"/>`; }
    const R = rng(8);
    [[-30, -60, 10], [-24, -90, -30], [26, -70, -20], [34, -40, 20], [-40, -20, 30]].forEach(([s0, t0, dt]) => { bg += taperPoly([at(t0 + 50 + dt + R() * 10, s0), at(t0, s0)], 2.2, 0.2, ln); });
    const shaft = [at(-118), at(30)];
    const head = poly([at(27, 7.4), at(38, 11), at(66, 0), at(38, -11), at(27, -7.4)]);
    const facet = poly([at(31, -1), at(39, -9.6), at(62, -0.6)]);
    const hit = at(-8);
    const fg = `
      ${PN._ki.inkDot(c, hit[0] - 2, hit[1] + 3, 16, 5)}
      <path d="${burst(hit[0], hit[1], 22, 9, 8, 0.4, 0.45, 5)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.6" stroke-linejoin="round"/>
      ${L(`M${q(shaft[0])} L${q(shaft[1])}`, K.p50, 13)}${L(`M${q(shaft[0])} L${q(shaft[1])}`, K.ink, 8)}
      ${L(`M${q(at(-114))} L${q(at(26))}`, K.ally, 2.4)}${L(`M${q(at(-70, -0.3))} L${q(at(14, -0.3))}`, K.allyG, 0.8)}
      ${S(head, K.ink, 2.4, 1.6)}${P(facet, K.p50)}${L(`M${q(at(33, 3.6))} L${q(at(56, 1.4))}`, K.ink5, 1.4)}
      <path d="M${q(at(22, 6.4))} L${q(at(29, 6.4))} L${q(at(29, -6.4))} L${q(at(22, -6.4))} Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="2"/>
      ${L(`M${q(at(23.4, -4.4))} L${q(at(23.4, 4.4))} M${q(at(26.6, -4.4))} L${q(at(26.6, 4.4))}`, K.p50, 1.3)}`;
    return { bg, fg };
  } };

  // Gyeol side profile, line only (faces +x). Local origin = ear. Shares the hero face design (k-hero / hero.js):
  // gat seen from the side (flat lens brim ≈ 1.6× shoulder, tapered crown + band), one brush contour brow→nose→lips→chin,
  // eye glint = one paper dot under the diagonal brim shadow, right-cheek scar stroke, 갓끈 beads, scarf knot (結) at the neck.
  const PF = {
    front: [[8.6, -9.6], [10.8, -6.2], [10.4, -3.4], [14.6, 1.4], [19.4, 6.2], [14.6, 7.9], [15.4, 9.7], [13.4, 11.3], [14.9, 12.9], [12.7, 14.7], [14.8, 18.2], [10.8, 21.2], [6.4, 22.2], [8.4, 31]],
    back: [[-11.8, -9.6], [-15, -2.6], [-14.2, 5.6], [-10.6, 12.8], [-6.8, 19], [-4.6, 31]],
    stitch: [[-40, 36], [-26, 26], [-19.6, 10], [-19.4, -4.8], [-26.2, -8.8], [-24.4, -15], [-13.4, -16.4], [-12, -33], [-7.2, -36], [9.2, -36], [13.4, -33], [15, -16.4], [25.6, -15.8], [29, -11], [24.6, -6.8], [15.8, -6.4], [15.2, -3.4], [23.2, 5.6], [19.2, 9.6], [18.6, 18.4], [14, 25.4], [19, 30.4], [21, 40]]
  };
  function profile(c, col, bgc, o = {}) {
    const { smooth, taperFn, bw } = PN._ki, w = o.w || 4, ws = w * 1.35;
    const fr = smooth(PF.front, 7), bk = smooth(PF.back, 7);
    const head = poly(fr.concat([[-4.6, 31]], bk.slice().reverse(), [[-11.8, -9.6]]));
    let s = '';
    const sp = 'M' + smooth(PF.stitch, 6).map(q).join(' L');
    if (o.stitch) s += L(sp, K.ink, 4, 'stroke-dasharray="4.2 2.8"') + L(sp, K.ally, 2.2, 'stroke-dasharray="4.2 2.8"') + L(sp, K.allyG, 0.6, 'stroke-dasharray="4.2 2.8" opacity="0.8"');
    // diagonal brim shadow (far brow -> near cheekbone) as a black spot inside the face
    if (o.shadow) s += `<g clip-path="${c.clip('hd' + (o.key || ''), head)}"><path d="M-20,-12 L22,-12 L22,-4.6 L12.4,-3.4 L-3,8.4 L-20,5 Z" fill="${o.shadow}"/></g>`;
    // hair: one long low-tied tail flowing back-down (profile cue) + scarf tail flowing back
    s += taperFn(smooth([[-12.4, 2], [-18, 11], [-26, 21], [-38, 31]], 7), bw(w * 1.25, 0.08, 0.55, 0.5), col);
    s += taperFn(smooth([[-6, 24.6], [-14, 25.4], [-22, 30], [-31, 33]], 6), bw(w * 0.8, 0.08, 0.6), col);
    s += L('M-6.4,23.2 C-1,27 7,26.6 12.4,23', col, f(w * 0.7));
    // scarf knot (結) at the throat + two short tails
    s += `<path d="M10.2,25.2 C12.2,22.2 16.8,23 17,26.2 C17.2,29.6 12.6,31 10.6,29.2 Z" fill="${bgc}" stroke="${col}" stroke-width="${f(w * 0.85)}" stroke-linejoin="round"/>`;
    s += taperFn(smooth([[13.6, 30], [15.4, 34], [15, 38]], 5), bw(w * 0.75, 0.1, 0.6), col) + taperFn(smooth([[11.2, 30.2], [10, 34.4], [8.4, 37.6]], 5), bw(w * 0.7, 0.1, 0.6), col);
    // head contour: back (light side) + ONE brush contour brow -> nose -> lips -> chin -> throat (shadow side, heavier)
    s += taperFn(bk, bw(w, 0.08, 0.3), col) + taperFn(fr, bw(ws, 0.08, 0.14, 0.35), col);
    // eye glint (one paper dot) + lower lid + mouth + right-cheek scar (one stroke)
    s += `<circle cx="7.4" cy="-2" r="1.9" fill="${o.glint || K.p50}"/>` + L('M4.4,0.6 Q7.2,1.4 9.8,0', o.glint || col, 1.3);
    s += L('M11.2,11.3 L13.4,11.3', col, 1.3) + taperFn([[5.2, 3.2], [7.2, 5.6], [9.4, 8]], bw(2, 0.3, 0.45, 0.1), col);
    // gat: tapered crown + band + flat lens brim (drawn last so it caps the head)
    s += `<path d="M-9.4,-12.6 L-7.4,-31 Q1,-33.4 9.4,-31 L11.4,-12.6" fill="${bgc}" stroke="${col}" stroke-width="${w}" stroke-linejoin="round"/>` + L('M-9,-16.6 Q1,-17.8 11,-16.6', col, f(w * 0.7));
    s += `<ellipse cx="1" cy="-11.6" rx="23" ry="3.6" transform="rotate(-3 1 -11.6)" fill="${bgc}" stroke="${col}" stroke-width="${f(w * 1.05)}"/>`;
    return s;
  }
  // 8. 거울 분신 — two line-only side profiles of Gyeol face each other across a cracked mirror; cyan running stitch on the right copy only
  I.mirrorClone = { rarity: 'legendary', kind: 'active', name: '거울 분신', halo: false, draw(c, A) {
    const R = rng(3); const crack = [[64, -2]]; for (let y = 10; y <= 132; y += 12) crack.push([64 + (R() - 0.5) * 8, y]);
    const dark = poly([[-2, -2]].concat(crack, [[-2, 132]]));
    const bg = (A ? '' : c.ht(64, 64, 128, 128, 8, (x, y) => Math.max(0, Math.min(2.4, (y - 78) / 22)), K.ink)) + P(dark, A ? K.ink7 : K.ink) +
      L(ptsD(crack), K.p50, 2.6) + L('M62,30 L52,24 M63,86 L72,94 L80,92 M61,112 L52,120', K.p50, 1.4, 'opacity="0.85"') +
      P(poly([[64, 46], [72, 51], [65, 57]]), K.p300, `stroke="${K.ink}" stroke-width="1.4"`);
    const lc = A ? K.p300 : K.p50, rc = A ? K.p50 : K.ink;
    const fg = `<g transform="translate(35,58) scale(1.15)">${profile(c, lc, A ? K.ink7 : K.ink, { key: 'l', glint: K.p50 })}</g>
      <g transform="translate(93,58) scale(-1.15,1.15)">${profile(c, rc, A ? K.ink : K.paper, { key: 'r', stitch: true, shadow: A ? null : K.ink })}</g>`;
    return { bg, fg };
  } };

  // 9. 무음 지뢰 — an ink-swirl disc sunk into the ground, cyan stitched ring, cracks
  I.voidMine = { rarity: 'epic', kind: 'active', name: '무음 지뢰', draw(c, A) {
    const cx = 64, cy = 76;
    const bg = (A ? '' : c.ht(0, 0, 128, 128, 8, (x, y) => (y < 50 ? Math.max(0, Math.min(3, (44 - y) / 12)) : Math.max(0, Math.min(2.8, (y - 50) / 20))), K.ink, 45)) +
      [14, 24, 34].map((r, i) => L(`M${cx - r * 1.6},${cy - 22 - r * 0.5} Q${cx},${cy - 30 - r * 1.1} ${cx + r * 1.6},${cy - 22 - r * 0.5}`, A ? K.p300 : K.ink, 3 - i * 0.6, `stroke-dasharray="${6 - i} ${3 + i * 2}"`)).join('') +
      L('M0,52 C30,46 96,46 128,50', A ? K.p300 : K.ink, 1.6, 'opacity="0.6"') +
      L(`M22,96 L10,104 L2,102 M104,96 L116,106 L126,104 M40,64 L28,54 M92,62 L104,52 L112,54 M60,102 L56,118`, A ? K.p300 : K.ink, 2.2);
    const spiral = []; for (let i = 0; i <= 70; i++) { const t = i / 70, a = t * Math.PI * 4.2, r = 3 + t * 32; spiral.push([cx + Math.cos(a) * r, cy - 3 + Math.sin(a) * r * 0.4]); }
    let spikes = '';
    [-2.6, -1.9, -1.25, -0.55, 0.15].forEach((a) => { const x = cx + Math.cos(a) * 40, y = cy + Math.sin(a) * 16; spikes += S(poly([[x - 4, y + 1], [x + Math.cos(a) * 3, y - 11], [x + 4, y + 1]]), K.p50, 1.8, 0.8); });
    const ring = ptsD(ellipsePts(cx, cy + 4, 55, 23, 64));
    const fg = `${stitch(ring)}
      <ellipse cx="${cx + 4}" cy="${cy + 9}" rx="44" ry="17" fill="${K.ink}"/>
      ${spikes}
      <path d="M${cx - 40},${cy} L${cx - 40},${cy + 7} A40,16 0 0 0 ${cx + 40},${cy + 7} L${cx + 40},${cy} Z" fill="${K.ink7}" stroke="${K.ink}" stroke-width="2.6"/>
      ${L(`M${cx - 36},${cy + 9} A40,16 0 0 0 ${cx + 10},${cy + 22}`, K.ink3, 1.3)}
      <ellipse cx="${cx}" cy="${cy}" rx="40" ry="16" fill="${K.ink}" stroke="${K.ink}" stroke-width="2.6"/>
      ${taperPoly(spiral, 0.4, 6, K.ink5)}${taperPoly(spiral.slice(6, 64), 0.3, 2.6, K.p50)}
      <circle cx="${cx}" cy="${cy - 3}" r="2.2" fill="${K.p50}"/>
      ${L(`M${cx - 38},${cy - 3} A40,16 0 0 1 ${cx - 6},${cy - 16}`, K.ink3, 1.2)}`;
    return { bg, fg };
  } };

  // 10. 검은 태양 — a black disc wearing a white corona over the alley roofs; diamond-ring glint in cyan
  I.blackSun = { rarity: 'mythic', kind: 'active', name: '검은 태양', draw(c, A) {
    const cx = 64, cy = 58;
    const bg = (A ? '' : c.ht(0, 0, 128, 128, 8, (x, y) => Math.max(0, Math.min(3.4, (Math.hypot(x - cx, y - cy) - 44) / 12)), K.ink, 45));
    const roofs = `<path d="M-4,128 L-4,104 L4,103 C12,99 26,96 40,97 C50,97 56,100 62,98 L64,102 L60,106 L58,128 Z" fill="${A ? K.ink7 : K.ink}"/>
      <path d="M52,128 L56,110 L62,108 C76,104 94,102 110,104 C118,104 124,102 132,100 L132,128 Z" fill="${A ? K.ink7 : K.ink}"/>
      ${L('M6,102 C16,99 30,97 40,98 M64,108 C80,104 98,103 112,104', K.p50, 1.4, 'opacity="0.8"')}
      ${L('M12,108 v6 M22,106 v6 M32,105 v6 M76,111 v6 M88,109 v6 M100,109 v6 M112,109 v6', K.p50, 1, 'opacity="0.5"')}`;
    const fg = `
      <path d="${burst(cx, cy, 55, 39, 15, 0.1, 0.42, 21)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="${burst(cx, cy, 46, 37, 11, 0.4, 0.3, 22)}" fill="none" stroke="${K.ink}" stroke-width="1.3"/>
      <circle cx="${cx}" cy="${cy}" r="37" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.6"/>
      <circle cx="${cx + 1.2}" cy="${cy + 1.5}" r="33" fill="${K.ink}"/>
      <circle cx="${cx}" cy="${cy}" r="33" fill="${K.ink}"/>
      ${L(`M${cx - 26},${cy - 18} A32,32 0 0 1 ${cx - 6},${cy - 31}`, K.ink5, 3)}
      <circle cx="${cx + 25.5}" cy="${cy - 23.5}" r="7" fill="${K.allyG}" opacity="0.35"/><path d="${burst(cx + 25.5, cy - 23.5, 16, 3, 4, -0.2)}" fill="${K.ally}" stroke="${K.ink}" stroke-width="2.2" stroke-linejoin="round"/>
      <circle cx="${cx + 25.5}" cy="${cy - 23.5}" r="3.2" fill="${K.p50}" stroke="${K.ink}" stroke-width="1"/>`;
    return { bg: bg, fg: fg, top: roofs };
  } };

  // 11. 일식 보법 — the verb is the slash: one heavy diagonal paper brush stroke with a cyan rim crosses the icon;
  //     a small eclipse disc (≤45% of the window) sits behind; three 짚신 sole prints with crescent shadows step along it.
  I.eclipseStep = { rarity: 'mythic', kind: 'active', name: '일식 보법', draw(c, A) {
    const { smooth, taperFn, bw } = PN._ki;
    const ex = 92, ey = 36, er = 25;
    const bg = (A ? '' : c.ht(0, 0, 128, 128, 8, (x, y) => Math.max(0, Math.min(2.4, (x + y - 150) / 36)), K.ink)) +
      `<path d="M0,0 L0,54 C10,40 22,22 44,0 Z" fill="${A ? K.ink7 : K.ink}"/>` +
      // eclipse: thin paper corona crescent on the lit side, ink disc, dry flecks
      `<circle cx="${ex}" cy="${ey}" r="${er + 3.6}" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.2"/><circle cx="${ex + 2.6}" cy="${ey + 2.4}" r="${er}" fill="${K.ink}"/>` +
      L(`M${ex - 20},${ey + 8} A${er},${er} 0 0 1 ${ex + 6},${ey - 21}`, K.ink5, 2.6);
    // slash centreline (slight bow) lower-left -> upper-right
    const ctrl = [[4, 122], [28, 101], [60, 72], [92, 42], [124, 8]], pts = smooth(ctrl, 10);
    const wf = (t) => 27 * (t < 0.1 ? 0.55 + 0.45 * t / 0.1 : t < 0.3 ? 1 : Math.max(0.04, 1 - Math.pow((t - 0.3) / 0.7, 1.25))), N = pts.length;
    const edge = (sg, k) => pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; const hw = wf(i / (N - 1)) / 2; return [p[0] + (dy / l) * hw * sg * k, p[1] - (dx / l) * hw * sg * k]; });
    const rim = edge(1, 0.84).slice(3, N - 7);
    // 짚신 sole: rounded toe, narrow waist, heel; woven cross lines; crescent shadow (eclipse) on the shadow side
    const SD = 'M-10,0 C-10,-3.8 -7,-5 -4,-4.6 C-1,-4.2 1,-5.6 4,-6.1 C8.6,-6.9 11.6,-3.6 11.2,0 C11,3.9 8,6.3 4,5.9 C1.4,5.6 -0.6,3.6 -3.2,4.2 C-6.6,5 -10,3.8 -10,0 Z';
    const sole = (x, y, a, k, col, fl) => `<g transform="translate(${x},${y}) rotate(${a}) scale(${k},${fl ? -k : k})">
      <path d="${SD}" fill="${K.ink5}" transform="translate(2.6,${fl ? -3.2 : 3.2})"/>
      <path d="${SD}" fill="${col}" stroke="${K.p50}" stroke-width="1.6" stroke-linejoin="round"/>
      ${L('M-6.6,-3.2 v6.4 M-2.2,-3.4 v6 M2.6,-4.6 v8.8 M7,-4.6 v8.4', K.p50, 0.9, 'opacity="0.5"')}</g>`;
    const fg = `
      ${sole(46, 116, -42, 1.12, K.ink3, 0)}${sole(79, 96, -40, 1.28, K.ink5, 1)}${sole(106, 73, -44, 1.44, K.ink, 0)}
      ${taperFn(pts, (t) => wf(t) + 6.4, K.ink, 'transform="translate(2,2.6)"')}${taperFn(pts, (t) => wf(t) + 5, K.ink)}
      ${taperFn(pts, wf, K.p50)}
      ${taperFn(rim, bw(4.2, 0.3, 0.3, 0.1), K.ink)}${taperFn(rim, bw(2.6, 0.3, 0.3, 0.1), K.ally)}
      ${[0.1, -0.25, -0.55].map((k, i) => taperFn(edge(1, k).slice(18 + i * 3, N - 4), bw(1.3, 0.2, 0.5, 0.1), K.ink3, 'opacity="0.8"')).join('')}
      ${T([4, 124, 1, 118, 6, 112], 3.4, 'mid', K.ink)}${T([2, 114, 6, 108, 12, 107], 2.2, 'mid', K.ink)}
`;
    return { bg, fg };
  } };
})(window.PN);
// ---- skill icon drawings C (passives 12-17): ink + paper + halftone only, NO cyan ----
(function (PN) {
  const { K, S, P, L, T, f, rng, poly, taperPoly, burst, ellipsePts, blob, drip, coin } = PN._ki;
  const I = PN._ki.ICON;
  const q = (p) => p.map(f).join(',');

  // 12. 철골 프레임 — a heater shield built from riveted iron girders
  I.ironFrame = { rarity: 'common', kind: 'passive', name: '철골 프레임', draw(c, A) {
    const sh = 'M22,18 L106,18 L106,60 C106,90 88,108 64,121 C40,108 22,90 22,60 Z';
    const bg = `<path d="${sh}" fill="${A ? K.ink5 : K.ink}" transform="translate(7,8)"/>`;
    const beams = [[22, 52, 106, 52], [26, 84, 102, 84], [64, 18, 64, 121], [22, 18, 64, 52], [106, 18, 64, 52], [22, 52, 64, 84], [106, 52, 64, 84], [34, 90, 64, 121], [94, 90, 64, 121]];
    const bm = beams.map(([a, b, x, y]) => L(`M${a},${b} L${x},${y}`, K.ink, 7)).join('') + beams.map(([a, b, x, y]) => L(`M${a - 1.2},${b - 1.6} L${x - 1.2},${y - 1.6}`, K.ink5, 1.6)).join('');
    const rv = [[22, 18], [64, 18], [106, 18], [22, 52], [64, 52], [106, 52], [26, 84], [64, 84], [102, 84], [64, 121], [43, 35], [85, 35], [43, 68], [85, 68]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.8" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.4"/>`).join('');
    const fg = `<path d="${sh}" fill="${K.p300}"/>
      <g clip-path="${c.clip('sh', sh)}"><rect width="128" height="128" fill="${c.dot('sd', 6, 0.4, K.ink)}"/><path d="M64,0 L128,0 L128,128 L64,128 Z" fill="${c.dot('sd2', 6, 0.6, K.ink)}"/>${bm}</g>
      <path d="${sh}" fill="none" stroke="${K.ink}" stroke-width="9" stroke-linejoin="round"/>
      <path d="M25,58 L25,21 L103,21" fill="none" stroke="${K.p50}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M106,62 C106,90 88,108 64,121" fill="none" stroke="${K.ink}" stroke-width="4" transform="translate(2,2)"/>
      ${rv}`;
    return { bg, fg };
  } };

  // 13. 수거 자석 — a horseshoe talisman drags 엽전 coins in on ink field lines.
  //     P2-4 (2026-10-26): the talisman carries no strokes (they read as 'エ·ㄴ·十'): a blank paper strip with torn
  //     side edges and a torn foot, and one ink seal blot.
  I.magnetSigil = { rarity: 'common', kind: 'passive', name: '수거 자석', draw(c, A) {
    const ln = A ? K.p300 : K.ink;
    const field = ['M64,64 C80,72 88,84 94,96', 'M56,76 C62,94 70,102 78,110', 'M72,56 C90,58 104,62 110,72'].map((d) => L(d, ln, 1.8, 'stroke-dasharray="5 4"')).join('');
    const bg = (A ? '' : c.ht(0, 0, 128, 128, 8, (x, y) => Math.max(0, Math.min(2.4, (Math.hypot(x - 100, y - 100) - 18) / -14 + 2.4) * (Math.hypot(x - 100, y - 100) < 50 ? 1 : 0)), K.ink, 45)) + field;
    const U = 'M-20,22 L-20,0 A20,20 0 0 1 20,0 L20,22';
    const nails = [-150, -120, -90, -60, -30].map((a) => { const r = a * Math.PI / 180, x = Math.cos(r) * 20, y = Math.sin(r) * 20; return `<rect x="${f(x - 1.6)}" y="${f(y - 2.6)}" width="3.2" height="5.2" transform="rotate(${a + 90} ${f(x)} ${f(y)})" fill="${K.p50}"/>`; }).join('');
    const fg = `
      ${coin(96, 98, 15, 2.6)}${coin(112, 70, 9, 2.2, 0.8)}${coin(72, 112, 9, 2.2, 0.9)}
      <g transform="translate(46,48) rotate(-45)">
        ${L(U, K.ink, 17)}<path d="${U}" fill="none" stroke="${K.ink}" stroke-width="17" transform="translate(1.6,2)"/>
        ${L('M-20,20 L-20,0 A20,20 0 0 1 -6,-19', K.ink5, 5, 'transform="translate(-2,0)"')}${nails}
        <rect x="-29" y="20" width="18" height="10" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.4"/><rect x="11" y="20" width="18" height="10" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.4"/>
        ${L('M-29,25 h18 M11,25 h18', K.ink, 1.2)}
      </g>
      <g transform="translate(20,20) rotate(-12)">
        <path d="M-7,-2 L9,-4 L9.8,6 L9,8.4 L10.6,17 L10.1,24.6 L11.4,30 L12,40 L9,36 L5,42 L2,37 L-3,42 L-4,38 L-4.8,28.4 L-4,26.2 L-5.6,15.4 L-5.1,9.2 L-6.3,5.2 Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="2"/>
        <path d="${blob(2.4, 12.6, 3.2, 7, 0.3, 13)}" fill="${K.ink}"/>
      </g>
      ${L('M25,16 C30,20 34,24 38,28', K.ink, 1.6)}`;
    return { bg, fg };
  } };

  // 14. 종이 갑주 — a lamellar cuirass of overlapping folded-paper scales; loose plates lift off.
  //     P2-4 (2026-10-26): no dots inside any scale. The dot halftone on each scale's right half and the two lacing holes
  //     made 'B'/'R' counters (the three loose plates read as a Latin 'B'). Every scale is now folded paper: a lit face
  //     and a flat shade face split by one oblique fold. The loose plates are cut, slanted paper scales with one fold
  //     line, spread so no two stack.
  I.paperWard = { rarity: 'rare', kind: 'passive', name: '종이 갑주', draw(c, A) {
    const bg = `<circle cx="64" cy="66" r="56" fill="${A ? K.ink7 : K.ink}"/>`;
    const cu = 'M24,30 C40,24 52,27 64,29 C76,27 88,24 104,30 L99,58 C96,70 97,86 100,106 C84,112 44,112 28,106 C31,86 32,70 29,58 Z';
    const sc = 'M-6.5,-10 L6.5,-10 L6.5,5 C6.5,10 3.5,12.5 0,12.5 C-3.5,12.5 -6.5,10 -6.5,5 Z';
    // the shade face right of the fold (2,-10) -> (0,12.5): a flat tone plane, never a dot pattern
    const scShade = 'M2,-10 L6.5,-10 L6.5,5 C6.5,10 3.5,12.5 0,12.5 Z';
    // rows are laid from the bottom up, so each scale's rounded foot overlaps the row below (scale armor, not bricks)
    let rows = '';
    for (let r = 5; r >= 0; r--) for (let k = -1; k < 7; k++) {
      const x = 28 + k * 13 + (r % 2) * 6.5, y = 36 + r * 14.5, dark = x > 76;
      rows += `<g transform="translate(${f(x)},${f(y)})"><path d="${sc}" fill="${dark ? K.paper : K.p50}"/><path d="${scShade}" fill="${dark ? K.ink1 : K.p300}"/><path d="${sc}" fill="none" stroke="${K.ink}" stroke-width="1.7"/></g>`;
    }
    // loose plate: the same paper scale cut with a slanted top, one fold line from the top edge to the foot.
    // rev 2.2 (P2 follow-up R1): the top edge is 3.5 lower (a shorter plate with its rounded foot showing).
    const lp = 'M-6.4,-6.9 L6.6,-8.1 L6.6,4.6 C6.6,9.8 3.6,12.4 0.1,12.6 C-3.4,12.8 -6.4,10.2 -6.4,5 Z';
    const lpShade = 'M2.1,-7.5 L6.6,-8.1 L6.6,4.6 C6.6,9.8 3.6,12.4 0.1,12.6 Z';
    const loose = (x, y, a, k) => `<g transform="translate(${x},${y}) rotate(${a}) scale(${k})">${S(lp, K.p50, 1.8, 1)}<path d="${lpShade}" fill="${K.p300}"/>${L('M2.1,-7.5 L0.1,12.6', K.ink, 1.2)}<path d="${lp}" fill="none" stroke="${K.ink}" stroke-width="1.8" stroke-linejoin="round"/></g>`;
    // rev 2.4 (F3): the two top plates fly off tilted, both leaning the same way (no mirrored '( )' pair, no upright 'U'
    // or shield). Their top is a torn edge of four uneven teeth, inked heavier than the sides so it never reads as a thin
    // lid, and the fold is a short diagonal crease (a bent corner) instead of a line from the top to the foot.
    const tornTop = 'M-6.4,-6.6 L-4.6,-8.5 L-3.3,-7 L-1.3,-8.2 L0.1,-6.9 L2.6,-8.7 L4.4,-7.6 L5.5,-8.3 L6.6,-7.5';
    const lpT = `${tornTop} L6.6,4.6 C6.6,9.8 3.6,12.4 0.1,12.6 C-3.4,12.8 -6.4,10.2 -6.4,5 Z`;
    const lpTShade = 'M0.1,-6.9 L2.6,-8.7 L4.4,-7.6 L5.5,-8.3 L6.6,-7.5 L6.6,3 Z';
    const flying = (x, y, a, k) => `<g transform="translate(${x},${y}) rotate(${a}) scale(${k})">${S(lpT, K.p50, 1.8, 0.6)}<path d="${lpTShade}" fill="${K.p300}"/>${L('M0.1,-6.9 L6.6,3', K.ink, 1.2)}<path d="${lpT}" fill="none" stroke="${K.ink}" stroke-width="1.8" stroke-linejoin="round"/>${L(tornTop, K.ink, 2)}</g>`;
    // rev 2.4 F3 placement (ink to ink, probe rev24-plates-probe): right (84.5,11.6) −38° ×0.8 sits between collar and
    // strap, 7.2 off the strap, 3.3 off the cuirass, 2.8 inside the window and 6.5 card units clear of the awakened seal
    // (right of the strap is the seal, icon (116,12), r ≈ 18). Left (10,36) −50° ×0.74 sits below the left strap's foot,
    // 5.9 off the strap, 4.2 off the cuirass, 2.3 inside the window. The third plate keeps the rev 2.2 cut and place.
    const fg = `<path d="${cu}" fill="${K.ink}" transform="translate(2,3)"/>
      <g clip-path="${c.clip('cu', cu)}"><rect width="128" height="128" fill="${K.ink7}"/>${rows}<path d="M96,20 L128,20 L128,120 L64,120 C84,112 98,90 100,60 Z" fill="${K.ink}" opacity="0.35"/></g>
      <path d="${cu}" fill="none" stroke="${K.ink}" stroke-width="3.4" stroke-linejoin="round"/>
      <path d="M50,28 L64,44 L78,28 C72,30 58,30 50,28 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="2"/>
      <path d="M30,84 C50,88 78,88 98,84 L98,93 C78,97 50,97 30,93 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="1.5"/><rect x="58" y="84" width="12" height="11" fill="${K.p50}" stroke="${K.ink}" stroke-width="2"/>
      ${L('M26,30 L22,12 M102,30 L106,12', K.ink, 7)}${L('M25,28 L21.5,13', K.ink5, 1.5)}
      ${flying(84.5, 11.6, -38, 0.8)}${loose(113, 52, 62, 0.92)}${flying(10, 36, -50, 0.74)}`;
    return { bg, fg };
  } };

  // 15. 회복 실 — a thread spool feeds ink thread through a needle that is mid-stitch, cross-stitching a torn paper wound shut
  I.recoveryThread = { rarity: 'rare', kind: 'passive', name: '회복 실', draw(c, A) {
    const bg = (A ? '' : c.ht(0, 0, 128, 128, 8, (x, y) => Math.max(0, Math.min(2.2, (x + y - 130) / 46)), K.ink));
    let wraps = ''; for (let x = -13; x <= 13; x += 2.6) wraps += L(`M${f(x)},-12 Q${f(x + 2)},0 ${f(x + 0.6)},12`, K.ink, 1.3);
    // torn paper patch (fibrous edge) + gash
    const R = rng(15), pe = [];
    const cxp = 80, cyp = 86, rxp = 42, ryp = 30;
    for (let i = 0; i < 44; i++) { const a = i / 44 * Math.PI * 2, j = (i % 2 ? 2.6 : 0) + R() * 2.2; pe.push([cxp + Math.cos(a) * (rxp - j) * (1 + 0.08 * Math.sin(a * 3)), cyp + Math.sin(a) * (ryp - j)]); }
    const patch = poly(pe.map(([x, y]) => [cxp + (x - cxp) * 0.99 - (y - cyp) * 0.14, cyp + (x - cxp) * 0.14 + (y - cyp) * 0.99]));
    const gt = [[50, 102], [58, 96], [63, 99], [71, 90], [77, 93], [85, 83], [91, 86], [99, 76], [106, 73]];
    const gb = gt.map(([x, y], i) => [x + (i % 2 ? 1.5 : -1), y + (i === 0 || i === gt.length - 1 ? 0 : 10.5 + (i % 3))]);
    const gash = poly(gt.concat(gb.slice().reverse()));
    const fib = gt.slice(1, -1).map(([x, y], i) => L(`M${x},${y} l${i % 2 ? -1.6 : 1.4},${-2.6 - (i % 3)}`, K.p50, 1.1)).join('');
    // rev 2.2 (P2 follow-up F1): one thread sews the wound, not a row of equal X's ('XXX' at 120 px). Two cross-stitches of
    // different size and angle (0.8× −12°, 1× 0°), spaced more than a stitch apart, a needle hole (r 1.2) at every end,
    // a short thread arcing from one stitch to the next (the tailT grammar: paper 5 + ink 2.2), and the last stitch by
    // the needle a single pulled stroke (1.15× +10°) that starts where tailT ends.
    const stitch = (cx, cy, k, deg, both) => {
      const r = deg * Math.PI / 180, co = Math.cos(r), si = Math.sin(r), at = (x, y) => [cx + k * (x * co - y * si), cy + k * (x * si + y * co)];
      return { ul: at(-5.6, -7.5), lr: at(5.6, 7.5), ur: at(5.6, -7.5), ll: at(-5.6, 7.5), both };
    };
    const inset = (p, q, d) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); return [[p[0] + dx / l * d, p[1] + dy / l * d], [q[0] - dx / l * d, q[1] - dy / l * d]]; };
    const seg = (e) => `M${f(e[0][0])},${f(e[0][1])} L${f(e[1][0])},${f(e[1][1])}`;
    const hop = (p, q) => { const e = inset(p, q, 2.4), dx = e[1][0] - e[0][0], dy = e[1][1] - e[0][1], l = Math.hypot(dx, dy); return `M${f(e[0][0])},${f(e[0][1])} Q${f((e[0][0] + e[1][0]) / 2 + dy / l * 3)},${f((e[0][1] + e[1][1]) / 2 - dx / l * 3)} ${f(e[1][0])},${f(e[1][1])}`; };
    const sts = [stitch(52.5, 103, 0.8, -12, true), stitch(75, 95.5, 1, 0, true), stitch(97.35, 86.11, 1.15, 10, false)];
    let xs = [hop(sts[0].ur, sts[1].ul), hop(sts[1].ur, sts[2].ul)].map((d) => L(d, K.p50, 5) + L(d, K.ink, 2.2)).join('');
    sts.forEach((s) => { const d = seg(inset(s.ul, s.lr, 2.6)) + (s.both ? ' ' + seg(inset(s.ur, s.ll, 2.6)) : ''); xs += L(d, K.p50, 6) + L(d, K.ink, 3); });
    sts.forEach((s) => (s.both ? [s.ul, s.lr, s.ur, s.ll] : [s.ul, s.lr]).forEach((p) => { xs += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="1.2" fill="${K.ink}"/>`; }));
    // thread: spool -> needle eye (long run) + eye -> last stitch (short tail)
    const thr = 'M44,34 C58,34 64,40 66,48', tailT = 'M69,52 C74,62 84,70 92,76';
    const nd = PN._ki.slimNeedle([64, 44], [100, 76], 5.6, 2);
    const fg = `${S(patch, K.paper, 3.4, 2.4)}
      <g clip-path="${c.clip('pt', patch)}"><path d="M84,50 L132,50 L132,132 L56,132 Z" fill="${c.dot('pd', 8, 0.2, K.ink)}"/></g>
      ${P(gash, K.ink)}${L('M50,102 L58,96 L63,99 L71,90 L77,93 L85,83 L91,86 L99,76 L106,73', K.ink, 2.4)}${fib}${xs}
      ${L(tailT, K.p50, 5)}${L(tailT, K.ink, 2.2)}
      <circle cx="100.5" cy="76.5" r="3.6" fill="${K.ink}"/>${nd}
      ${L(thr, K.p50, 5)}${L(thr, K.ink, 2.2)}
      <g transform="translate(30,32) rotate(-28)">
        <path d="M-15,-12 L15,-12 L15,12 L-15,12 Z" fill="${K.ink7}" stroke="${K.ink}" stroke-width="2.4"/>${wraps}
        ${L('M-13,-9 L13,-9', K.p50, 1.4, 'opacity="0.8"')}
        <ellipse cx="-17" cy="0" rx="6" ry="18" fill="${K.p300}" stroke="${K.ink}" stroke-width="2.6"/>
        <ellipse cx="19" cy="1.4" rx="6" ry="18" fill="${K.ink}"/>
        <ellipse cx="17" cy="0" rx="6" ry="18" fill="${K.paper}" stroke="${K.ink}" stroke-width="2.6"/>
        <ellipse cx="17" cy="0" rx="2" ry="5" fill="${K.ink}"/>${L('M-21,-11 C-22,-4 -22,4 -20,11', K.p50, 1.3)}
      </g>`;
    return { bg, fg };
  } };

  // 16. 동전 열병 — 엽전 (ink.100 discs, square holes) stack up and leap out of the tip of a black flame; paper sparkle stars
  I.coinFever = { rarity: 'rare', kind: 'passive', name: '동전 열병', draw(c, A) {
    const flame = 'M64,124 C30,124 18,100 26,78 C30,66 38,60 36,44 C48,52 50,62 50,70 C54,54 60,40 58,20 C72,30 80,46 78,62 C84,56 88,48 88,38 C104,56 110,78 104,98 C100,114 86,124 64,124 Z';
    const bg = `<path d="${flame}" fill="${A ? K.ink7 : K.ink}" ${A ? `stroke="${K.p50}" stroke-width="2.6" stroke-linejoin="round"` : ''}/>` + L('M40,54 C46,60 46,68 44,76 M62,30 C68,40 68,50 64,60 M86,50 C92,60 94,70 92,80', K.ink5, 2.6);
    const star = (x, y, r) => `<path d="${burst(x, y, r, r * 0.28, 4, -Math.PI / 2)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.5" stroke-linejoin="round"/>`;
    const pile = [[48, 114, 12], [66, 116, 12], [84, 112, 11], [58, 105, 11], [76, 104, 11]].map(([x, y, r]) => coin(x, y, r, 2.4, 0.42, false, 0.26)).join('');
    const fly = [[64, 86, 11, 0.78], [51, 64, 9.4, 0.92], [75, 47, 9.6, 0.62], [60, 27, 8.6, 1], [80, 12, 7.4, 0.72]].map(([x, y, r, sq]) => coin(x, y, r, 2.4, sq, false, 0.24)).join('');
    const fg = `${pile}${fly}${star(24, 30, 8)}${star(104, 30, 6.5)}${star(100, 90, 5)}${star(38, 12, 5)}`;
    return { bg, fg };
  } };

  // 17. 집행 표식 — an ink seal stamp with a brush ✕ knocked out in paper
  I.executionMark = { rarity: 'legendary', kind: 'passive', name: '집행 표식', draw(c, A) {
    const R = rng(17); const e = []; const j = () => (R() - 0.5) * 3;
    for (let x = 26; x <= 102; x += 6) e.push([x, 26 + j()]); for (let y = 32; y <= 102; y += 6) e.push([102 + j(), y]);
    for (let x = 96; x >= 26; x -= 6) e.push([x, 102 + j()]); for (let y = 96; y > 26; y -= 6) e.push([26 + j(), y]);
    const seal = poly(e);
    let spk = ''; for (let i = 0; i < 40; i++) spk += `<circle cx="${f(30 + R() * 68)}" cy="${f(30 + R() * 68)}" r="${f(0.4 + R() * 1.3)}" fill="${K.paper}" opacity="${f(0.5 + R() * 0.5)}"/>`;
    const bg = (A ? '' : c.ht(0, 0, 128, 128, 8, (x, y) => Math.max(0, Math.min(2.2, (x + y - 180) / 30)), K.ink, 45)) +
      `<g opacity="${A ? 0.6 : 1}">${PN.splat(108, 22, 5, 7, 3, A ? K.ink5 : K.ink)}${PN.splat(18, 108, 4, 6, 9, A ? K.ink5 : K.ink)}</g>`;
    const x1 = T([40, 40, 62, 60, 90, 90], 15, 'mid', K.paper), x2 = T([88, 38, 66, 62, 38, 90], 14, 'mid', K.paper);
    const dry = L('M36,37 L50,50 M42,35 L54,47 M84,86 L93,94 M80,90 L88,97 M90,36 L80,46 M40,88 L50,79', K.ink, 1.1);
    const fg = `<g transform="rotate(-6 64 64)">${S(seal, K.ink, 2, 2)}${spk}
      <rect x="33" y="33" width="62" height="62" fill="none" stroke="${K.paper}" stroke-width="1.6" opacity="0.85"/>
      ${x1}${x2}${dry}</g>`;
    return { bg, fg };
  } };
})(window.PN);
// ---- PN.icons.pickup(kind, {tier}) : 48 x 48 master (= 2x of in-game px), pivot (24,24) ----
(function (PN) {
  const { K, ctx, S, P, L, T, f, poly, burst, coin } = PN._ki;
  const shadow = (rx = 12) => `<ellipse cx="24" cy="43" rx="${rx}" ry="3.2" fill="${K.ink}" opacity="0.28"/>`;
  function gem(cx, cy, h, tier) {
    const w = h * 0.72, t = [cx, cy - h / 2], r = [cx + w / 2, cy], b = [cx, cy + h / 2], l = [cx - w / 2, cy];
    const inner = [[cx, cy - h * 0.22], [cx + w * 0.2, cy], [cx, cy + h * 0.22], [cx - w * 0.2, cy]];
    let s = `<path d="${poly([t, r, b, l])}" fill="${K.ink}" stroke="${K.ink}" stroke-width="3" stroke-linejoin="round" transform="translate(1,1.4)"/>`;
    s += `<path d="${poly([t, r, b, l])}" fill="${K.reward}" stroke="${K.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="${poly([t, inner[0], inner[3], l])}" fill="${K.p50}" opacity="0.45"/><path d="${poly([r, inner[1], inner[2], b])}" fill="${K.ink}" opacity="0.28"/>`;
    s += `<path d="${poly(inner)}" fill="none" stroke="${K.ink}" stroke-width="1.1" opacity="0.8"/>`;
    if (tier >= 2) s += L(`M${f(t[0])},${f(t[1])} L${f(inner[0][0])},${f(inner[0][1])} M${f(b[0])},${f(b[1])} L${f(inner[2][0])},${f(inner[2][1])}`, K.ink, 1, 'opacity="0.7"');
    s += `<circle cx="${f(cx - w * 0.2)}" cy="${f(cy - h * 0.2)}" r="${f(1.6 + tier * 0.3)}" fill="${K.p50}"/>`;
    if (tier >= 3) s += `<path d="${burst(cx + w * 0.42, cy - h * 0.36, 6, 1.4, 4, -Math.PI / 2)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.2" stroke-linejoin="round"/>`;
    return s;
  }
  PN._ki.gem = gem;
  const DRAW = {
    // XP 옥: lime diamond + ink 1.5px(1x) + paper glint. tier 1/2/3 = 14/16/18 px tall in game
    xp: (o) => { const tier = o.tier || 1; return shadow(8) + gem(24, 22, [0, 28, 32, 36][tier], tier); },
    // 엽전 coin: ink.100 disc, square hole, ink rim. 12 px in game. No amber.
    coin: () => shadow(9) + coin(24, 22, 12, 2.6, 1, false),
    // 수거 자석 pickup: ink horseshoe + paper poles, lime jade at the bend (it hauls XP). ~22 px in game
    magnet: () => {
      const U = 'M-12,11 L-12,0 A12,12 0 0 1 12,0 L12,11';
      return shadow(12) + `<g transform="translate(24,24) rotate(-20)">
        <path d="${U}" fill="none" stroke="${K.ink}" stroke-width="8.5" transform="translate(1,1.3)"/>${L(U, K.ink, 8.5)}${L('M-12,9 L-12,0 A12,12 0 0 1 -4,-11.3', K.ink5, 2.4, 'transform="translate(-1.2,0)"')}
        <rect x="-17.5" y="10" width="11" height="7" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.2"/><rect x="6.5" y="10" width="11" height="7" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.2"/>
        ${gem(0, 5, 12, 1)}</g>
        ${L('M36,31 q4,3 8,1 M34,37 q4,3 9,3', K.ink, 1.6, 'stroke-dasharray="3 2.5"')}`;
    },
    // 회복 약첩: folded paper medicine packet tied with ink cord, lime cross seal. ~22 px in game
    heal: () => {
      const pk = 'M24,6 L41,22 L24,39 L7,22 Z';
      return shadow(12) + S(pk, K.paper, 2.8, 1.3) +
        `<path d="M24,6 L41,22 L24,24 Z" fill="${K.p50}"/><path d="M7,22 L24,24 L24,39 Z" fill="${K.p300}"/>` +
        L('M7,22 L24,24 L41,22 M24,24 L24,39', K.ink, 1.2) + L('M13,15 L35,31 M35,14 L14,31', K.ink, 2) +
        `<circle cx="24" cy="23" r="7.2" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.2"/>` +
        `<path d="M22,17.5 h4 v3.5 h3.5 v4 h-3.5 v3.5 h-4 v-3.5 h-3.5 v-4 h3.5 Z" fill="${K.reward}" stroke="${K.ink}" stroke-width="1.5" stroke-linejoin="round"/>`;
    }
  };
  PN.icons.pickup = function (kind, o = {}) {
    const c = ctx('p'); const d = DRAW[kind]; if (!d) return '';
    return c.out(d(o), o.size ? `transform="scale(${f(o.size / 48)})"` : '');
  };
  PN.icons.PICKUP_PX = { xp: [14, 16, 18], coin: 12, magnet: 22, heal: 22 };
})(window.PN);
// ---- PN.vfx.telegraph / allyZone / enemyZone — world units (1 unit = 1 in-game px at zoom 1.0) ----
(function (PN) {
  const { K, ctx, P, L, f, taperPoly, ellipsePts } = PN._ki;
  const dP = (a, z) => 'M' + a.map((p) => f(p[0]) + ',' + f(p[1])).join(' L') + (z ? ' Z' : '');
  const line = (a, b, n = 40) => { const o = []; for (let i = 0; i <= n; i++) o.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); return o; };
  const rectPts = (x0, y0, x1, y1) => line([x0, y0], [x1, y0], 20).concat(line([x1, y0], [x1, y1], 20).slice(1), line([x1, y1], [x0, y1], 20).slice(1), line([x0, y1], [x0, y0], 20).slice(1));
  const rectD = (x0, y0, x1, y1) => `M${f(x0)},${f(y0)} H${f(x1)} V${f(y1)} H${f(x0)} Z`;
  function measure(p) { const a = [0]; for (let i = 1; i < p.length; i++) a.push(a[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return a; }
  function cut(p, len) {
    const a = measure(p), tot = a[a.length - 1];
    if (len >= tot) return { done: p, rest: [], head: p[p.length - 1], ang: Math.atan2(p[p.length - 1][1] - p[p.length - 2][1], p[p.length - 1][0] - p[p.length - 2][0]) };
    let i = 1; while (a[i] < len) i++;
    const t = (len - a[i - 1]) / (a[i] - a[i - 1] || 1), h = [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t];
    return { done: p.slice(0, i).concat([h]), rest: [h].concat(p.slice(i)), head: h, ang: Math.atan2(p[i][1] - p[i - 1][1], p[i][0] - p[i - 1][0]) };
  }
  const tail = (p, len) => { const a = measure(p), tot = a[a.length - 1]; let i = p.length - 1; while (i > 0 && tot - a[i] < len) i--; return p.slice(i); };
  // geometry per shape: subs (outline strokes that the brush draws), fill path, sdf (>0 inside), ticks, bbox
  const GEO = {
    circle(r) {
      const pts = ellipsePts(0, 0, r, r, 140, -Math.PI / 2, Math.PI * 1.5);
      const ticks = []; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 - Math.PI / 2; ticks.push([[Math.cos(a) * r, Math.sin(a) * r], [Math.cos(a), Math.sin(a)]]); }
      return { subs: [pts], mode: 'seq', fill: `M${-r},0 A${r},${r} 0 1 0 ${r},0 A${r},${r} 0 1 0 ${-r},0 Z`, sdf: (x, y) => r - Math.hypot(x, y), inr: r, bb: [-r, -r, r, r], ticks, pulse: dP(ellipsePts(0, 0, r + 8, r + 8, 80), true) };
    },
    lane(len, o) {
      const h = (o.width || 36) / 2, ticks = [];
      for (let k = 0; k < 6; k++) { const x = len * (k + 0.5) / 6; ticks.push([[x, -h], [0, -1]], [[x, h], [0, 1]]); }
      return { subs: [line([0, -h], [len, -h]), line([0, h], [len, h])], mode: 'par', fixed: [line([0, -h], [0, h], 4)], close: [line([len, -h], [len, h], 4)], fill: rectD(0, -h, len, h), sdf: (x, y) => Math.min(x, len - x, h - Math.abs(y)), inr: h, bb: [0, -h, len, h], ticks, arrow: [len, h] };
    },
    cone(r, o) {
      const a = (o.angle || 60) * Math.PI / 180, arc = ellipsePts(0, 0, r, r, 80, -a / 2, a / 2);
      const e1 = [Math.cos(-a / 2) * r, Math.sin(-a / 2) * r], e2 = [Math.cos(a / 2) * r, Math.sin(a / 2) * r], ticks = [];
      for (let k = 0; k < 8; k++) { const t = -a / 2 + a * (k + 0.5) / 8; ticks.push([[Math.cos(t) * r, Math.sin(t) * r], [Math.cos(t), Math.sin(t)]]); }
      return { subs: [arc], mode: 'seq', fixed: [line([0, 0], e1, 20), line([0, 0], e2, 20)], fill: `M0,0 L${f(e1[0])},${f(e1[1])} A${r},${r} 0 0 1 ${f(e2[0])},${f(e2[1])} Z`,
        sdf: (x, y) => { const d = Math.hypot(x, y), t = Math.abs(Math.atan2(y, x)); return Math.min(r - d, d * Math.sin(a / 2 - t)); }, bb: [0, -r * Math.sin(a / 2), r, r * Math.sin(a / 2)], inr: r * Math.sin(a / 2) / (1 + Math.sin(a / 2)), ticks };
    },
    grid(s, o) {
      const b = s * 0.1, q = s / 4, hs = s / 2, bars = [[-hs, -q - b, hs, -q + b], [-hs, q - b, hs, q + b], [-q - b, -hs, -q + b, hs], [q - b, -hs, q + b, hs]];
      const ticks = []; [[-hs, -q, -1, 0], [hs, -q, 1, 0], [-hs, q, -1, 0], [hs, q, 1, 0], [-q, -hs, 0, -1], [q, -hs, 0, -1], [-q, hs, 0, 1], [q, hs, 0, 1]].forEach(([x, y, nx, ny]) => ticks.push([[x, y], [nx, ny]]));
      return { subs: bars.map((r) => rectPts(...r)), mode: 'seq', fill: bars.map((r) => rectD(...r)).join(' '), sdf: (x, y) => Math.max(...bars.map(([x0, y0, x1, y1]) => Math.min(x - x0, x1 - x, y - y0, y1 - y))), bb: [-hs, -hs, hs, hs], inr: b, ticks, latch: [[-q, -q], [q, -q], [-q, q], [q, q]] };
    }
  };
  // brush head (물방울형): round head leads, tail trails
  const head = (p, ang, k) => `<g transform="translate(${f(p[0])},${f(p[1])}) rotate(${f(ang * 180 / Math.PI)}) scale(${k})"><path d="M-11,0 C-6,-0.8 -2.5,-3.8 1,-3.8 A3.8,3.8 0 0 1 1,3.8 C-2.5,3.8 -6,0.8 -11,0 Z" fill="${K.ink}"/><circle cx="1.8" cy="-1.3" r="1" fill="${K.p50}"/><circle cx="7" cy="2.4" r="0.9" fill="${K.ink}"/><circle cx="9.5" cy="-1" r="0.6" fill="${K.ink}"/></g>`;
  const tickW = (p, n, len) => taperPoly([[p[0] + n[0] * 3, p[1] + n[1] * 3], [p[0] + n[0] * (3 + len), p[1] + n[1] * (3 + len)]], 4, 0.6, K.ink);

  PN.vfx.telegraph = function (shape, stage, size, o = {}) {
    const g = GEO[shape](size, o), c = ctx('t');
    const p = o.progress != null ? o.progress : { preview: 0.42, imminent: 0.86, active: 1 }[stage];
    const clip = c.clip('cl', g.fill);
    let s = '';
    if (stage === 'active') {
      // coral α.55 fill + graded ink halftone edge band (4 rows: merged 85% -> 60 -> 40 -> 20 %, pitch 4.5 ≥ 3 px),
      // closed 5 px ink rim. The 0.1 s paper flash (o.flash) is a ≤ 3 px paper line just inside the rim — not in the resting frame.
      const hp = 4.6, bk = Math.max(0.5, Math.min(1, (g.inr || 30) / 24)), band = [3.4, 7.4, 11.2, 14.4].map((b) => b * bk), cv = [0.86, 0.6, 0.4, 0.2];
      s += `<path d="${g.fill}" fill="${K.hostile}" opacity="0.55"/>`;
      s += `<g clip-path="${clip}">${PN.halftone(g.bb[0] - hp, g.bb[1] - hp, g.bb[2] + hp, g.bb[3] + hp, hp, (x, y) => { const d = g.sdf(x, y); if (d < -1) return 0; const k = band.findIndex((b) => d < b); return k < 0 ? 0 : hp * Math.sqrt(cv[k] / Math.PI); }, K.ink, 45)}` +
        `${o.flash ? L(g.fill, K.p50, 5.6) : ''}</g>`;
    } else {
      const pitch = stage === 'preview' ? 10 : 5;
      s += `<path d="${g.fill}" fill="${c.hatch('h', pitch, 2, K.warn, -45, [0.7, K.ink, 0.55])}" opacity="${stage === 'preview' ? 0.6 : 0.8}"/>`;
    }
    // fixed ruled edges (lane start cap, cone radial edges) — 자로 그은 먹줄
    (g.fixed || []).forEach((a) => { s += stage === 'preview' ? L(dP(a), K.ink, 1.6, 'opacity="0.7"') : L(dP(a), K.ink, stage === 'active' ? 5 : 4); });
    // brush-drawn outline: drawn fraction = progress
    const tot = g.subs.reduce((t, a) => t + measure(a).slice(-1)[0], 0);
    let left = p * tot; const heads = [];
    g.subs.forEach((a) => {
      const la = measure(a).slice(-1)[0];
      const want = g.mode === 'par' ? p * la : Math.max(0, Math.min(la, left)); left -= la;
      const r = cut(a, want);
      if (stage === 'active') { s += L(dP(a), K.ink, 5); return; }
      if (r.rest.length > 1) s += L(dP(r.rest), K.ink3, 1.3, 'stroke-dasharray="1.5 4"');
      if (r.done.length > 1 && want > 0.5) {
        if (stage === 'preview') s += L(dP(r.done), K.ink, 2, 'stroke-dasharray="6 4" opacity="0.7"') + taperPoly(tail(r.done, 22), 0.6, 3.2, K.ink);
        else s += L(dP(r.done), K.ink, 5) + L(dP(r.done), K.warn, 1.8, 'stroke-dasharray="7 5"');
        if (want < la - 0.5) heads.push([r.head, r.ang]);
      }
    });
    if (g.close && (p >= 1 || stage === 'active')) g.close.forEach((a) => { s += L(dP(a), K.ink, stage === 'active' ? 5 : 4); });
    if (stage === 'imminent') {
      s += g.ticks.map(([pp, n]) => tickW(pp, n, 8)).join('');
      if (g.pulse) s += L(g.pulse, K.ink, 1.6, 'opacity="0.3"');
    }
    if (g.arrow && stage !== 'preview') { const [x, h] = g.arrow; s += `<path d="M${f(x - 18)},${f(-h - 7)} L${f(x + 6)},0 L${f(x - 18)},${f(h + 7)} Z" fill="${stage === 'active' ? K.hostile : K.warn}" stroke="${K.ink}" stroke-width="2.6" stroke-linejoin="round"/>`; }
    if (g.latch && stage !== 'preview') s += g.latch.map(([x, y]) => `<rect x="${f(x - 5)}" y="${f(y - 5)}" width="10" height="10" fill="${K.ink}" transform="rotate(45 ${f(x)} ${f(y)})"/><circle cx="${f(x)}" cy="${f(y)}" r="1.8" fill="${K.p50}"/>`).join('');
    s += heads.map(([hp, a]) => head(hp, a, stage === 'preview' ? 1 : 1.35)).join('');
    return c.out(s, o.dir ? `transform="rotate(${o.dir})"` : '');
  };
  PN.vfx.TELE_STAGE = { preview: [0, 0.65], imminent: [0.65, 1], active: [1, 1] };

  // ally zone (e.g. 골분 박격 landing): paper α0.25 + cyan halftone 20% + cyan running-stitch border. NO hatching, NO coral.
  PN.vfx.allyZone = function (r = 64, o = {}) {
    const c = ctx('a'); const d = `M${-r},0 A${r},${r} 0 1 0 ${r},0 A${r},${r} 0 1 0 ${-r},0 Z`;
    const ring = dP(ellipsePts(0, 0, r, r, 120), true);
    let s = `<path d="${d}" fill="${K.p50}" opacity="0.25"/><path d="${d}" fill="${c.dot('d', 6, 0.2, K.ally)}"/>`;
    s += L(ring, K.allyD, 1, 'opacity="0.8"') + L(ring, K.ink, 5, 'stroke-dasharray="8 5"') + L(ring, K.ally, 2.8, 'stroke-dasharray="8 5"') + L(ring, K.allyG, 0.8, 'stroke-dasharray="8 5"');
    if (o.motif === 'bone') {
      const R = PN.rng(7); for (let i = 0; i < 16; i++) { const a = R() * 6.28, rr = R() * r * 0.7; s += `<circle cx="${f(Math.cos(a) * rr)}" cy="${f(Math.sin(a) * rr)}" r="${f(1 + R() * 1.6)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="0.9"/>`; }
    }
    return c.out(s);
  };
  // enemy persistent zones: amber border 3px + dense hatch α0.35 + inner symbol; fire/null variants
  PN.vfx.enemyZone = function (kind = 'slow', r = 64) {
    const c = ctx('e'); const d = `M${-r},0 A${r},${r} 0 1 0 ${r},0 A${r},${r} 0 1 0 ${-r},0 Z`;
    const ring = dP(ellipsePts(0, 0, r, r, 120), true); let s = '';
    if (kind === 'null') {
      s += `<path d="${d}" fill="${K.voidp}"/>` + L(ring, K.ink, 4.6, 'stroke-dasharray="3 5"') + L(ring, K.warn, 2.2, 'stroke-dasharray="3 5"') + L(dP(ellipsePts(0, 0, r - 7, r - 7, 100), true), K.hostile, 1.5);
      s += `<circle r="11" fill="none" stroke="${K.ink}" stroke-width="3"/>` + L('M-8,8 L8,-8', K.ink, 3);
      return c.out(s);
    }
    if (kind === 'fire') {
      s += `<path d="${d}" fill="${c.hatch('h', 5, 2, K.warn, -45, [0.7, K.ink, 0.55])}" opacity="0.75"/>` + L(ring, K.ink, 4.5) + L(ring, K.warn, 1.8, 'stroke-dasharray="7 5"');
      const cr = r * 0.42;
      s += `<circle r="${f(cr)}" fill="${K.hostile}" stroke="${K.ink}" stroke-width="3"/>` + `<path d="M0,${f(cr * 0.62)} C${f(-cr * 0.55)},${f(cr * 0.6)} ${f(-cr * 0.5)},0 ${f(-cr * 0.1)},${f(-cr * 0.7)} C0,${f(-cr * 0.3)} ${f(cr * 0.2)},${f(-cr * 0.2)} ${f(cr * 0.24)},${f(-cr * 0.5)} C${f(cr * 0.56)},${f(-cr * 0.1)} ${f(cr * 0.5)},${f(cr * 0.6)} 0,${f(cr * 0.62)} Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="2"/>`;
      return c.out(s);
    }
    s += `<path d="${d}" fill="${c.hatch('h', 5, 2, K.warn, -45, [0.7, K.ink, 0.55])}" opacity="0.35"/>` + L(ring, K.ink, 5.4) + L(ring, K.warn, 3);
    const sk = Math.min(1, r / 42);
    if (kind === 'slow') s += `<g transform="scale(${f(sk)})">${L('M-16,-4 q4,-5 8,0 t8,0 t8,0 M-16,6 q4,-5 8,0 t8,0 t8,0', K.p50, 6)}${L('M-16,-4 q4,-5 8,0 t8,0 t8,0 M-16,6 q4,-5 8,0 t8,0 t8,0', K.ink, 3)}</g>`;
    if (kind === 'root') s += `<g transform="scale(${f(sk)})"><ellipse cx="-6" cy="0" rx="8" ry="5" fill="none" stroke="${K.ink}" stroke-width="3"/><ellipse cx="6" cy="0" rx="8" ry="5" fill="none" stroke="${K.ink}" stroke-width="3"/></g>`;
    return c.out(s);
  };
})(window.PN);
// ---- PN.vfx.hit / kill / decal / damageNumber — world units (1 unit = 1 in-game px) ----
(function (PN) {
  const { K, ctx, S, P, L, f, rng, poly, taperPoly, burst, blob, drip, NUMF } = PN._ki;
  const mix = (a, b, t) => { const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)); const x = h(a), y = h(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  PN._ki.mix = mix;

  // hit(frame 0..3, {angle deg = travel direction of the blow, crit, seed}) — comic impact star <= 16px + ink spatter
  PN.vfx.hit = function (frame = 1, o = {}) {
    const c = ctx('h'), a = (o.angle || 0) * Math.PI / 180, crit = !!o.crit, k = crit ? 1.55 : 1, w = crit ? 2 : 1, R = rng(5 + (o.seed || 0));
    const n = crit ? 16 : 9, dist = [4, 9, 15, 20][frame] * k;
    let s = '';
    if (crit && frame >= 1) s += `<path d="${blob(a ? Math.cos(a) * 3 : 3, 0, 8 * k * (0.8 + frame * 0.16), 11, 0.55, 9)}" fill="${K.ink}" opacity="${frame === 3 ? 0.55 : 0.92}"/>` + P(drip(4, 6 * k, 5 + frame * 1.5, 1.6) + drip(-5, 5.4 * k, 4 + frame, 1.2), K.ink, `opacity="${frame === 3 ? 0.55 : 0.92}"`);
    for (let i = 0; i < n; i++) {
      const t = a + (R() - 0.5) * 1.7, d = dist * (0.55 + 0.7 * R()), r = (0.55 + R() * 1.25) * (crit ? 1.25 : 1) * (frame === 3 ? 0.75 : 1);
      const x = Math.cos(t) * d, y = Math.sin(t) * d;
      if ((frame === 1 || frame === 2) && R() > 0.45) s += taperPoly([[x - Math.cos(t) * d * 0.35, y - Math.sin(t) * d * 0.35], [x, y]], 0.2, r * 2, K.ink);
      else if (frame > 0 || i % 3 === 0) s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${K.ink}"/>`;
    }
    const st = (r1, r2, m, jit, sw) => `<path d="${burst(0, 0, r1 * k, r2 * k, m, a + 0.2, jit, 3)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="${sw * w}" stroke-linejoin="round"/>`;
    if (frame === 0) s += `<circle r="${f(4 * k)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="${1.2 * w}"/>` + st(5.5, 2.4, 8, 0.2, 1.3);
    if (frame === 1) s += st(8, 3.3, 9, 0.35, 1.5) + `<circle r="${f(1.6 * k)}" fill="${K.ink}"/>`;
    if (frame === 2) s += `<path d="${burst(0, 0, 7 * k, 3.4 * k, 9, a + 0.5, 0.35, 4)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="${1.3 * w}" stroke-dasharray="${f(5 * k)} ${f(3 * k)}" stroke-linejoin="round"/>`;
    if (frame === 3) { s += `<circle r="${f(6 * k)}" fill="none" stroke="${K.ink}" stroke-width="${0.9 * w}" stroke-dasharray="2 3"/>`; for (let i = 0; i < 4; i++) { const t = a + i * 1.57 + 0.4, d = 6.5 * k; s += `<path d="${poly([[Math.cos(t) * d, Math.sin(t) * d], [Math.cos(t + 0.25) * (d + 2.4 * k), Math.sin(t + 0.25) * (d + 2.4 * k)], [Math.cos(t - 0.1) * (d + 2.8 * k), Math.sin(t - 0.1) * (d + 2.8 * k)]])}" fill="${K.p50}" stroke="${K.ink}" stroke-width="0.8"/>`; } }
    return c.out(s);
  };

  const xEyes = (x, y, s, col = K.p50) => L(`M${f(x - s)},${f(y - s)} l${f(2 * s)},${f(2 * s)} M${f(x + s)},${f(y - s)} l${f(-2 * s)},${f(2 * s)} M${f(x + 3.2 * s - s)},${f(y - s * 0.8)} l${f(2 * s)},${f(2 * s)} M${f(x + 3.2 * s + s)},${f(y - s * 0.8)} l${f(-2 * s)},${f(2 * s)}`, K.ink, f(s * 1.9)) +
    L(`M${f(x - s)},${f(y - s)} l${f(2 * s)},${f(2 * s)} M${f(x + s)},${f(y - s)} l${f(-2 * s)},${f(2 * s)} M${f(x + 3.2 * s - s)},${f(y - s * 0.8)} l${f(2 * s)},${f(2 * s)} M${f(x + 3.2 * s + s)},${f(y - s * 0.8)} l${f(-2 * s)},${f(2 * s)}`, col, f(s * 0.8));
  PN._ki.xEyes = xEyes;

  // ---- role silhouettes (PN._ki.SIL, baked from k-enemies Ch1 lod:'game') → world units, pivot at (0,0) ----
  const EYE = { stalker: [175, 87], charger: [175, 88], shooter: [75, 41], warden: [112, 42] };
  function sil(role, r) {
    const Sd = PN._ki.SIL[role] ? role : 'stalker', S = PN._ki.SIL[Sd], R = r || S.r, k = R / S.r / S.u;
    const X = (x) => (x - S.pivot[0]) * k, Y = (y) => (y - S.pivot[1]) * k;
    return { role: Sd, S, r: R, k, tf: `scale(${f(k)}) translate(${-S.pivot[0]},${-S.pivot[1]})`, X, Y,
      bb: [X(S.bb[0]), Y(S.bb[1]), X(S.bb[2]), Y(S.bb[3])], eye: [X(EYE[Sd][0]), Y(EYE[Sd][1])], c: [X((S.bb[0] + S.bb[2]) / 2), Y((S.bb[1] + S.bb[3]) / 2)] };
  }
  // all outline shapes; `add` = extra stroke in world px (converted to box units)
  const parts = (G, fill, stroke, add = 0) => G.S.parts.map(([d, sw, tf, so]) => `<path d="${d}" fill="${so ? 'none' : fill}" stroke="${stroke}" stroke-width="${f(sw + add / G.k)}" stroke-linejoin="round" stroke-linecap="round" ${tf ? `transform="matrix(${tf})"` : ''}/>`).join('');
  const paperBits = (G, fill) => G.S.paper.map(([d, sw, tf]) => `<path d="${d}" fill="${fill}" ${tf ? `transform="matrix(${tf})"` : ''}/>`).join('');
  const goo = (c, n, sd) => { const id = c.id(n); c.add(`<filter id="${id}" x="-40%" y="-60%" width="180%" height="220%"><feGaussianBlur stdDeviation="${sd}"/><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -7"/></filter>`); return `url(#${id})`; };
  PN._ki.silRole = sil;

  // kill(frame 0..5, {role = 'stalker'|'charger'|'shooter'|'warden', r = role hitbox radius, seed})
  // f0 paper negative (ink outline, ink eye holes) · f1 ink body swells + paper cracks · f2 body bursts into shards
  // f3 body slumps into ink · f4 puddle + drips + paper ✕✕ · f5 settled ink.700 puddle (→ decal(0)). Pivot = hitbox centre.
  PN.vfx.kill = function (frame = 0, o = {}) {
    const c = ctx('k'), G = sil(o.role || 'stalker', o.r), r = G.r, gy = r * 0.55, R = rng(31 + (o.seed || 0));
    const [x0, y0, x1, y1] = G.bb, hl = (x1 - x0) / 2, [cx, cy] = G.c;
    const body = (fill, stroke, add, eyes) => `<g transform="${G.tf}">${parts(G, fill, stroke, add)}${eyes ? paperBits(G, eyes) : ''}</g>`;
    const shadow = `<ellipse cx="0" cy="${f(gy)}" rx="${f(r)}" ry="${f(r * 0.4)}" fill="${K.ink}" opacity="0.3"/>`;
    const puddle = (sy, col, sd) => `<g filter="${goo(c, 'g' + frame, sd)}"><g transform="translate(0,${f(r * 0.9)}) scale(1,${sy}) translate(0,${f(-r * 0.9)})"><g transform="translate(${f(-cx * 0.1)},0) scale(0.92,1)">${body(col, col, 0)}</g></g></g>`;
    const xx = (sy) => { const ex = G.eye[0] * 0.92 - cx * 0.1, ey = r * 0.9 + (G.eye[1] - r * 0.9) * sy; return xEyes(ex - r * 0.3, ey + 0.4, r * 0.13); };
    const scrap = (sy) => { const px = cx - hl * 0.2, py = r * 0.9 + (y0 + (y1 - y0) * 0.3 - r * 0.9) * sy; return `<path d="M${f(px - 4)},${f(py - 1.6)} L${f(px + 3)},${f(py - 2.6)} L${f(px + 4.4)},${f(py + 1.2)} L${f(px - 2.6)},${f(py + 2.2)} Z" fill="${K.ink1}" stroke="${K.ink}" stroke-width="1" stroke-linejoin="round"/>`; };
    let s = '';
    if (frame === 0) s = shadow + `<g transform="${G.tf}">${parts(G, K.ink, K.ink, 4)}${parts(G, K.p50, K.p50, 0)}${paperBits(G, K.ink)}</g>`;
    if (frame === 1) {
      const cl = c.clip('b', G.S.parts[G.S.main][0]);
      let cr = ''; for (let i = 0; i < 6; i++) { const a = -2.9 + i * 1.05 + R() * 0.3; let p = [cx, cy], d = `M${f(p[0])},${f(p[1])}`; for (let j = 0; j < 3; j++) { p = [p[0] + Math.cos(a + (R() - 0.5) * 0.9) * hl * 0.22, p[1] + Math.sin(a + (R() - 0.5) * 0.9) * hl * 0.16]; d += ` L${f(p[0])},${f(p[1])}`; } cr += L(d, K.p50, 1.4); }
      s += shadow + `<g transform="translate(${f(cx)},${f(cy)}) scale(1.08) translate(${f(-cx)},${f(-cy)})">${body(K.ink, K.ink, 0, K.p50)}<g transform="${G.tf}"><g clip-path="${cl}"><g transform="scale(${f(1 / G.k)}) translate(${f(G.S.pivot[0] * G.k)},${f(G.S.pivot[1] * G.k)})">${cr}</g></g></g></g>`;
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + 0.3, ex = cx + Math.cos(a) * (hl + 3), ey = cy + Math.sin(a) * ((y1 - y0) / 2 + 3); s += taperPoly([[ex, ey], [ex + Math.cos(a) * 4, ey + Math.sin(a) * 4]], 1.8, 0.3, K.ink); }
    }
    if (frame === 2) {
      const br = Math.min(hl * 0.9, 1.6 * r);
      s += `<path d="${burst(cx, cy, br, br * 0.5, 11, 0.1, 0.5, 7)}" fill="${K.ink}"/><path d="${burst(cx, cy, br * 0.62, br * 0.28, 8, 0.4, 0.3, 2)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
      [[-150, -40], [-40, 60], [60, 150], [150, 210]].forEach(([a0, a1], i) => {
        const am = (a0 + a1) / 2 * Math.PI / 180, W = 400, wedge = `M${cx},${cy} L${f(cx + Math.cos(a0 * Math.PI / 180) * W)},${f(cy + Math.sin(a0 * Math.PI / 180) * W)} L${f(cx + Math.cos(am) * W)},${f(cy + Math.sin(am) * W)} L${f(cx + Math.cos(a1 * Math.PI / 180) * W)},${f(cy + Math.sin(a1 * Math.PI / 180) * W)} Z`;
        const cl = c.clip('w' + i, wedge), dd = r * 0.28;
        s += `<g transform="translate(${f(Math.cos(am) * dd)},${f(Math.sin(am) * dd * 0.8)}) rotate(${(i % 2 ? 7 : -7)} ${f(cx)} ${f(cy)})"><g clip-path="${cl}">${body(K.ink, K.ink, 0, K.p50)}</g></g>`;
      });
      for (let i = 0; i < 12; i++) { const a = R() * 6.283, d = hl * (0.9 + 0.28 * R()); s += `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d * 0.62)}" r="${f(0.7 + R() * 1.1)}" fill="${K.ink}"/>`; }
    }
    if (frame === 3) {
      s += `<g filter="${goo(c, 'g3', 1.1)}"><g transform="translate(0,${f(r * 0.95)}) scale(1.04,0.5) translate(0,${f(-r * 0.95)})">${body(K.ink, K.ink, 0)}</g></g>`;
      for (let i = 0; i < 5; i++) { const x = x0 * 0.8 + (x1 - x0) * 0.8 * (i + 0.5) / 5, h = r * (0.55 + 0.35 * R()); s += P(`M${f(x)},${f(r * 0.95 - (y1 - r * 0.95) - h)} c1.6,1.8 1.6,3.6 0,3.6 c-1.6,0 -1.6,-1.8 0,-3.6 Z`, K.ink); }
      s += taperPoly([[x0 * 0.9, r * 0.8], [x0 * 1.02, r * 0.62]], 2, 0.2, K.ink) + taperPoly([[x1 * 0.9, r * 0.8], [x1 * 1.02, r * 0.64]], 2, 0.2, K.ink);
    }
    if (frame >= 4) {
      const sy = frame === 4 ? 0.36 : 0.32;
      s += puddle(sy, frame === 4 ? K.ink : K.ink7, 1.6);
      for (let i = 0; i < (frame === 4 ? 7 : 4); i++) { const a = R() * 6.283, d = hl * (0.86 + 0.12 * R()); s += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(r * 0.72 + Math.sin(a) * r * 0.32)}" r="${f(0.6 + R() * 0.8)}" fill="${frame === 4 ? K.ink : K.ink7}"/>`; }
      s += scrap(sy) + xx(sy);
      if (frame === 4) s += `<ellipse cx="${f(-hl * 0.35)}" cy="${f(r * 0.62)}" rx="${f(hl * 0.18)}" ry="0.9" fill="${K.p50}" opacity="0.7"/>`;
    }
    return c.out(s);
  };

  // decal(age seconds, {role, r, seed, lod}) — dried ink puddle derived from the same body: ink.700 -> ink.300 over 3 s,
  // fades out 25~30 s. Origin = ground point = enemy pivot + (0, 0.55·r) (rev-1 contract), so decal(0) at the ground point
  // overlaps kill f5 drawn at the pivot exactly.
  PN.vfx.decal = function (age = 0, o = {}) {
    const c = ctx('d'), G = sil(o.role || 'stalker', o.r), r = G.r, R = rng(11 + (o.seed || 0)), t = Math.max(0, Math.min(1, age / 3));
    const col = mix(K.ink7, K.ink3, t), op = (0.92 - 0.32 * t) * (age > 25 ? Math.max(0, (30 - age) / 5) : 1);
    if (op <= 0) return c.out('');
    const [x0, , x1] = G.bb, hl = (x1 - x0) / 2, cx = G.c[0], sy = 0.32;
    const shape = (fill) => `<g transform="translate(0,${f(r * 0.9)}) scale(1,${sy}) translate(0,${f(-r * 0.9)})"><g transform="translate(${f(-cx * 0.1)},0) scale(0.92,1)"><g transform="${G.tf}">${parts(G, fill, fill, 0)}</g></g></g>`;
    const gf = goo(c, 'g', 1.6);
    let s = `<g filter="${gf}">${shape(col)}</g>`;
    for (let i = 0; i < 5; i++) { const a = R() * 6.283, d = hl * (0.86 + 0.12 * R()); s += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(r * 0.72 + Math.sin(a) * r * 0.3)}" r="${f(0.6 + R() * 0.8)}" fill="${col}"/>`; }
    if (o.lod !== 'reduced' && t > 0.05) {
      const mid = c.id('m'); c.add(`<mask id="${mid}"><g filter="${gf}">${shape('#fff')}</g></mask>`);
      s += `<g mask="url(#${mid})">${PN.halftone(x0, r * 0.2, x1, r * 1.1, 3.2, (x, y) => { const e = Math.hypot((x - G.c[0] * 0.92) / (hl * 0.9), (y - r * 0.66) / (r * 0.34)); return e > 0.6 ? 1.05 * t : 0; }, K.ink3, 45)}</g>`;
    }
    if (t >= 0.6) s += [[-0.8, 0.62, 0.7, 0.66], [-0.4, 0.78, 0.8, 0.8]].map(([a, b, cc, d]) => taperPoly([[a * hl, b * r], [cc * hl, d * r]], 0.2, 1.1, K.ground1, `opacity="${f(0.55 * t)}"`)).join('');
    if (age < 15) { const px = cx - hl * 0.2, py = r * 0.78; s += `<path d="M${f(px - 4)},${f(py - 1.4)} L${f(px + 3)},${f(py - 2.4)} L${f(px + 4.4)},${f(py + 1.2)} L${f(px - 2.6)},${f(py + 2)} Z" fill="${mix(K.ink1, K.ink3, t)}" stroke="${col}" stroke-width="1"/>`; }
    if (age < 1) s += `<ellipse cx="${f(-hl * 0.35)}" cy="${f(r * 0.64)}" rx="${f(hl * 0.18)}" ry="0.9" fill="${K.p50}" opacity="${f(0.75 * (1 - age))}"/>`;
    if (age < 1.2) { const ex = G.eye[0] * 0.92 - cx * 0.1, ey = r * 0.9 + (G.eye[1] - r * 0.9) * sy; s += `<g opacity="${f(age < 0.9 ? 1 : (1.2 - age) / 0.3)}">${xEyes(ex - r * 0.3, ey + 0.4, r * 0.13)}</g>`; }
    // origin = ground point (pivot + 0.55·r), unchanged from rev 1: shift the pivot-frame drawing up by 0.55·r
    return c.out(`<g transform="translate(0,${f(-r * 0.55)})">${s}</g>`, `opacity="${f(op)}"`);
  };

  // damageNumber(value, crit, {kind: 'dealt'|'taken'|'heal'}) — origin = center baseline
  PN.vfx.damageNumber = function (value, crit = false, o = {}) {
    const c = ctx('n'), kind = o.kind || 'dealt', str = String(value);
    const tx = (t, size, fill, stroke, sw) => `<text x="0" y="0" text-anchor="middle" font-family="${NUMF}" font-weight="800" font-size="${size}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" paint-order="stroke" letter-spacing="0.3" transform="skewX(-8)">${t}</text>`;
    let s = '';
    if (kind === 'taken') s = tx('−' + str, 15, K.hostile, K.ink, 3.6);
    else if (kind === 'heal') s = tx('+' + str, 14, K.reward, K.ink, 3.4);
    else if (!crit) s = tx(str, 14, K.ink, K.p50, 3.4);
    else {
      const wdt = str.length * 9 + 16, R = rng(value % 97 + 3), e = [];
      for (let i = 0; i <= 8; i++) e.push([-wdt / 2 + wdt * i / 8, -17 + (R() - 0.5) * 3]); e.push([wdt / 2 + 4, -6]);
      for (let i = 8; i >= 0; i--) e.push([-wdt / 2 + wdt * i / 8 + 2, 5 + (R() - 0.5) * 3]); e.push([-wdt / 2 - 3, -7]);
      s = `<path d="${poly(e)}" fill="${K.ink}" transform="translate(1.5,2)"/><path d="${poly(e)}" fill="${K.ink}" stroke="${K.p50}" stroke-width="1.4" stroke-linejoin="round"/>` +
        `<circle cx="${f(wdt / 2 + 7)}" cy="-16" r="1.6" fill="${K.ink}"/><circle cx="${f(-wdt / 2 - 6)}" cy="3" r="1.2" fill="${K.ink}"/>` +
        tx(str + '!', 17, K.p50, K.ink, 0.01);
    }
    return c.out(s);
  };
})(window.PN);
// ---- Ch1 role silhouettes (baked from kit/k-enemies.js PN.enemies.draw(1, role, {lod:'game'}), outline geometry only) ----
// parts: [d, strokeWidth, matrix|'', strokeOnly?]  paper: eye/teeth shapes. Box units, u = box units per 1x px.
(function (PN) {
  PN._ki.SIL = {"stalker":{"box":[200,160],"pivot":[100,98],"u":4,"r":12,"main":9,"bb":[2,29,200,146],"parts":[["M59,75 L49,55 L53,52 L54,46 L61,49 L65,42 L77,70 Z",12,""],["M80,72 L70,37 L78,38 L85,29 L90,36 L99,29 L106,64 Z",12,""],["M110,63 L112,44 L118,40 L122,46 L127,59 Z",12,""],["M140,70 L132,46 L138,50 L141,44 L152,70 Z",16,""],["M35,77 L33,77 L31,77 L29,77 L27,76 L25,76 L23,75 L21,75 L19,74 L17,73 L15,72 L14,71 L12,70 L10,69 L9,68 L7,67 L5,65 L4,64 L2,62 L2,62 L3,64 L3,67 L4,69 L5,71 L7,73 L8,75 L9,76 L11,78 L13,80 L15,81 L16,83 L18,84 L21,86 L23,87 L25,88 L28,89 L30,90 L33,91 Z",0,""],["M115,95 C117,93 127,93 129,95 C131,97 128,105 128,109 C128,113 127,117 127,121 C127,125 126,129 126,131 C126,133 126,134 128,135 C130,136 136,138 136,138 C136,138 137,143 137,143 C137,143 122,143 122,143 C122,143 119,141 118,139 C117,137 118,134 118,131 C118,128 118,123 117,119 C117,115 115,111 115,107 C115,103 113,97 115,95 Z",14,""],["M54,88 C58,86 74,86 78,88 C82,90 81,98 80,102 C80,106 77,109 75,112 C73,115 70,117 69,120 C68,123 67,125 67,128 C67,131 67,135 69,137 C71,139 78,139 78,139 C78,139 79,143 79,143 C79,143 62,143 62,143 C62,143 61,141 60,138 C59,136 57,128 57,128 C57,128 59,122 60,120 C61,118 65,117 64,114 C63,111 56,106 54,102 C52,98 50,90 54,88 Z",14,""],["M135,122 C135,126 137,132 137,134 A3,3 0 1 0 139,134 C139,132 141,126 141,122 Z",0,""],["M184,115 C184,118 185,122 185,124 A2,2 0 1 0 187,124 C187,122 188,118 188,115 Z",0,""],["M30,82 C33,78 40,72 46,70 C52,68 59,68 66,68 C73,68 80,72 86,72 C92,72 99,68 104,66 C109,64 114,59 118,58 C122,57 126,60 130,62 C134,64 138,69 142,72 C146,75 148,77 152,78 C156,79 160,79 164,80 C168,81 172,84 176,86 C180,88 184,90 188,92 C192,94 198,99 198,99 C198,99 195,103 192,104 C189,105 182,105 178,105 C174,105 166,106 166,106 C166,106 176,109 180,110 C184,111 190,112 190,112 C190,112 184,117 180,118 C176,119 170,118 164,118 C158,118 150,117 146,118 C142,119 142,124 138,124 C134,125 127,124 122,121 C117,118 112,111 106,108 C100,105 91,104 84,104 C77,104 70,107 64,108 C58,109 53,113 48,112 C43,111 37,107 34,104 C31,101 29,96 28,92 C27,88 27,86 30,82 Z",20,""],["M150,78 L148,50 L153,55 L157,48 L160,58 L165,80 Z",12,""],["M176,87 a2,2 0 1 0 4,0 a2,2 0 1 0 -4,0 Z",0,"0.978,-0.208,0.208,0.978,-14.472,38.308"],["M127,98 C129,96 139,96 141,98 C143,100 140,108 140,112 C140,116 139,120 139,124 C139,128 138,132 138,134 C138,136 138,137 140,138 C142,139 148,141 148,141 C148,141 149,146 149,146 C149,146 134,146 134,146 C134,146 131,144 130,142 C129,140 130,137 130,134 C130,131 130,126 129,122 C129,118 127,114 127,110 C127,106 125,100 127,98 Z",14,""],["M40,91 C44,89 60,89 64,91 C68,93 67,101 66,105 C66,109 63,112 61,115 C59,118 56,120 55,123 C54,126 53,128 53,131 C53,134 53,138 55,140 C57,142 64,142 64,142 C64,142 65,146 65,146 C65,146 48,146 48,146 C48,146 47,144 46,141 C45,139 43,131 43,131 C43,131 45,125 46,123 C47,121 51,120 50,117 C49,114 42,109 40,105 C38,101 36,93 40,91 Z",14,""]],"paper":[["M166,89 Q174,82 184,86 L180,90 L178,88 L175,91 L172,89 Z",0,"0.978,-0.208,0.208,0.978,-14.472,38.308"],["M194,104 L190,110 L185,105 L181,111 L177,105 L172,111 L168,106 Z",2,""],["M168,106 L173,103 L179,109 L184,106 L189,112 Z",2,""]]},"charger":{"box":[200,170],"pivot":[96,99],"u":3,"r":19,"main":14,"bb":[2,9,204,157],"parts":[["M24,83 L23,84 L21,85 L20,87 L19,88 L17,89 L16,91 L15,92 L14,94 L13,95 L12,97 L12,99 L11,101 L10,102 L10,104 L10,106 L9,108 L9,110 L9,112 L9,112 L10,110 L10,108 L11,107 L12,105 L13,103 L13,102 L14,100 L15,99 L16,98 L17,96 L19,95 L20,94 L21,93 L22,92 L23,91 L25,90 L26,90 L28,89 Z",0,""],["M7,106 L6,107 L6,109 L5,110 L5,111 L4,112 L4,114 L4,115 L3,116 L3,118 L3,119 L2,120 L2,122 L2,123 L2,124 L2,126 L2,127 L2,129 L2,130 L2,130 L3,129 L3,127 L4,126 L4,125 L5,124 L5,123 L6,122 L7,120 L7,119 L8,118 L8,117 L9,116 L10,115 L10,114 L11,113 L12,112 L13,111 L13,110 Z",0,""],["M8,108 L8,109 L8,111 L8,112 L8,113 L8,115 L9,116 L9,117 L9,119 L9,120 L9,121 L9,123 L10,124 L10,125 L10,127 L11,128 L11,129 L11,131 L12,132 L12,132 L12,131 L12,129 L12,128 L12,127 L12,125 L12,124 L12,123 L12,121 L12,120 L13,119 L13,117 L13,116 L13,115 L13,113 L13,112 L14,111 L14,110 L14,108 Z",0,""],["M92,50 L82,26",8,"",1],["M74,26 a8,4 0 1 0 16,0 a8,4 0 1 0 -16,0 Z",4,"0.923,-0.385,0.385,0.923,-3.692,33.539"],["M114,40 L110,14",8,"",1],["M102,14 a8,4 0 1 0 16,0 a8,4 0 1 0 -16,0 Z",4,"0.988,-0.152,0.152,0.988,-0.849,16.897"],["M134,38 L144,16",8,"",1],["M136,16 a8,4 0 1 0 16,0 a8,4 0 1 0 -16,0 Z",4,"0.91,0.414,-0.414,0.91,19.523,-58.145"],["M180,66 L184,50 Q186,44 192,44 L199,44",12,"",1],["M113,105 C117,102 131,102 135,105 C139,108 136,116 135,121 C135,126 132,130 132,133 C132,137 132,140 133,142 C134,145 136,148 136,148 C136,148 136,152 136,152 C136,152 115,152 115,152 C115,152 115,147 115,147 C115,147 117,139 117,135 C117,131 114,126 113,121 C112,116 109,108 113,105 Z",15,""],["M47,103 C51,100 68,97 73,98 C79,99 78,107 78,111 C78,116 75,120 74,123 C74,127 73,131 73,134 C74,137 76,139 78,141 C79,143 82,146 82,146 C82,146 82,149 82,149 C82,149 64,153 64,153 C64,153 63,147 63,147 C63,147 59,141 58,138 C56,135 56,132 54,128 C52,124 48,119 47,115 C46,111 43,106 47,103 Z",15,""],["M139,123 C139,127 141,132 141,135 A3,3 0 1 0 143,135 C143,132 145,127 145,123 Z",0,""],["M92,115 C92,118 93,121 93,123 A2,2 0 1 0 95,123 C95,121 96,118 96,115 Z",0,""],["M22,96 C22,92 22,85 24,80 C26,75 30,70 36,66 C42,62 50,59 58,56 C66,53 76,51 84,48 C92,45 97,41 104,38 C111,36 118,33 124,33 C130,33 137,35 142,38 C147,41 151,45 154,50 C157,55 159,59 160,66 C162,73 164,82 163,90 C163,98 161,106 157,112 C153,118 147,123 140,125 C134,127 125,124 118,122 C111,121 104,117 96,116 C88,115 79,117 72,118 C65,119 58,123 52,123 C46,123 39,120 34,117 C29,114 26,110 24,106 C22,103 22,100 22,96 Z",18,""],["M162,70 L166,46 Q168,36 178,34 L198,30",13,"",1],["M163,58 L169,58 M185,32 L185,40",3,"",1],["M154,64 Q170,44 188,68",3,"",1],["M150,62 L190,68 L196,112 L152,120 Z",18,""],["M167,87 a2,2 0 1 0 3,0 a2,2 0 1 0 -3,0 Z",0,"0.998,-0.07,0.07,0.998,-5.734,11.794"],["M185,88 a1,1 0 1 0 3,0 a1,1 0 1 0 -3,0 Z",0,"0.998,0.07,-0.07,0.998,6.622,-12.62"],["M192,118 C192,117 194,114 195,113 C196,112 199,111 200,112 C202,113 204,115 204,117 C204,118 203,120 202,121 C200,122 197,122 196,121 C194,121 192,119 192,118 Z",7,""],["M127,109 C131,106 145,106 149,109 C153,112 150,120 149,125 C149,130 146,134 146,137 C146,141 146,144 147,146 C148,149 150,152 150,152 C150,152 150,156 150,156 C150,156 129,156 129,156 C129,156 129,151 129,151 C129,151 131,143 131,139 C131,135 128,130 127,125 C126,120 123,112 127,109 Z",15,""],["M38,101 C43,100 60,103 64,107 C68,110 65,117 63,121 C62,125 58,127 55,130 C53,133 51,137 51,140 C50,142 51,145 52,148 C52,150 54,154 54,154 C54,154 53,157 53,157 C53,157 35,154 35,154 C35,154 36,148 36,148 C36,148 35,141 35,137 C34,134 35,131 35,127 C34,123 33,117 33,113 C34,108 32,102 38,101 Z",15,""]],"paper":[["M159,89 Q165,83 174,87 L170,90 L168,88 L166,91 L163,89 Z",0,"0.998,-0.07,0.07,0.998,-5.734,11.794"],["M178,89 Q183,84 191,87 L188,90 L186,89 L184,91 L182,89 Z",0,"0.998,0.07,-0.07,0.998,6.622,-12.62"]]},"shooter":{"box":[200,200],"pivot":[78,144],"u":3.5,"r":12,"main":7,"bb":[20,4,199,187],"parts":[["M88,156 L94,170 L99,184",8,"",1],["M88,156 L94,170 L99,184",4,"",1],["M92,185 L108,185 L104,180 L95,180 Z",9,""],["M66,74 C64,73 56,79 52,84 C48,89 43,100 44,104 C45,108 54,108 58,106 C62,104 65,95 66,90 C67,85 68,75 66,74 Z",14,""],["M53,88 C54,86 60,86 62,87 C64,88 65,93 64,95 C63,97 57,98 55,97 C53,96 52,90 53,88 Z",11,""],["M100,156 C100,159 101,162 101,164 A2,2 0 1 0 103,164 C103,162 104,159 104,156 Z",0,""],["M64,158 C64,162 65,166 65,168 A2,2 0 1 0 67,168 C67,166 68,162 68,158 Z",0,""],["M60,70 C67,65 89,65 96,70 C103,75 98,88 100,100 C102,112 104,130 106,140 C108,150 112,162 112,162 C112,162 102,156 102,156 C102,156 96,166 96,166 C96,166 86,158 86,158 C86,158 76,168 76,168 C76,168 66,158 66,158 C66,158 56,166 56,166 C56,166 48,160 48,160 C48,160 51,140 52,130 C53,120 55,110 56,100 C57,90 53,75 60,70 Z",18,""],["M70,156 L64,170 L59,186",8,"",1],["M70,156 L64,170 L59,186",4,"",1],["M52,187 L68,187 L64,182 L55,182 Z",9,""],["M30,78 L170,80 L170,92 L30,90 Z",18,""],["M168,78 C170,75 176,75 180,76 C184,77 189,80 192,82 C195,84 199,86 199,86 C199,86 195,89 192,90 C189,91 184,93 180,94 C176,95 170,97 168,94 C166,91 166,81 168,78 Z",18,""],["M162,76 L172,76 L172,96 L162,96 Z",11,""],["M78,18 C84,18 92,22 96,26 C100,30 102,38 102,44 C102,50 100,58 96,62 C92,66 84,70 78,70 C72,70 64,66 60,62 C56,58 54,50 54,44 C54,38 56,30 60,26 C64,22 72,18 78,18 Z",18,""],["M66,14 L90,14 L88,21 L68,21 Z M68,66 L88,66 L86,74 L70,74 Z",9,""],["M78,14 L78,4",5,"",1],["M56,40 L62,34 L68,38 L74,33 L78,40 L74,47 L66,50 L58,48 Z",5,""],["M68,41 a1,1 0 1 0 3,0 a1,1 0 1 0 -3,0 Z",0,"0.995,-0.105,0.105,0.995,-4.023,7.233"],["M80,40 Q88,33 97,39 Q89,45 80,40 Z",0,""],["M86,72 C89,71 100,79 106,82 C112,85 119,85 122,88 C125,91 126,98 124,100 C122,102 114,102 108,100 C102,98 94,95 90,90 C86,85 83,73 86,72 Z",14,""],["M121,89 C122,87 128,87 130,88 C132,89 133,94 132,96 C131,98 125,99 123,98 C121,97 120,91 121,89 Z",11,""]],"paper":[["M60,43 Q66,38 74,41 L71,43 L69,42 L67,44 L65,43 Z",0,"0.995,-0.105,0.105,0.995,-4.023,7.233"],["M87,40 a4,4 0 1 0 7,0 a4,4 0 1 0 -7,0 Z",0,""]]},"warden":{"box":[220,220],"pivot":[110,136],"u":2.5,"r":28,"main":8,"bb":[13,4,210,206],"parts":[["M62,40 L48,12 L40,10",8,"",1],["M104,30 L104,4",8,"",1],["M146,38 L162,14 L172,16",8,"",1],["M121,162 L155,162 L156,182 L160,196 L160,202 L118,202 L118,196 L122,182 Z",15,""],["M38,70 C33,71 25,86 22,96 C19,106 17,121 18,130 C19,139 22,147 26,150 C30,153 41,151 44,146 C47,141 41,127 42,118 C43,109 51,100 50,92 C49,84 43,69 38,70 Z",15,""],["M14,140 C15,136 20,133 24,132 C28,131 37,133 40,136 C43,139 45,148 44,152 C43,156 37,161 32,162 C27,163 19,160 16,156 C13,152 13,144 14,140 Z",12,""],["M60,180 C60,184 61,187 61,189 A3,3 0 1 0 63,189 C63,187 65,184 65,180 Z",0,""],["M144,188 C144,191 145,194 145,196 A2,2 0 1 0 147,196 C147,194 148,191 148,188 Z",0,""],["M28,70 C29,58 34,38 34,38 C34,38 42,30 60,28 C78,26 122,25 140,26 C158,27 168,32 168,32 C168,32 174,52 176,70 C178,88 180,122 178,140 C176,158 175,168 164,176 C153,184 129,185 112,186 C95,187 75,186 62,182 C49,178 40,176 34,164 C28,152 27,128 26,112 C25,96 27,82 28,70 Z",16,""],["M92,46 C92,42 93,35 96,32 C99,29 105,26 110,26 C115,26 121,27 124,30 C127,33 130,40 130,44 C130,48 129,52 124,54 C119,56 103,55 98,54 C93,53 92,50 92,46 Z",15,""],["M105,41 a2,2 0 1 0 3,0 a2,2 0 1 0 -3,0 Z",0,"0.995,0.105,-0.105,0.995,4.96,-10.641"],["M65,166 L99,166 L100,186 L104,200 L104,206 L62,206 L62,200 L66,186 Z",15,""],["M118,58 L204,50 L208,180 L122,190 Z",16,""],["M138,80 L186,74 L190,124 L168,126 L160,132 L150,125 L142,128 Z",8,""],["M96,74 C97,70 109,60 114,58 C119,56 125,60 124,64 C123,68 113,82 108,84 C103,86 95,78 96,74 Z",15,""],["M112,46 C115,42 124,37 130,36 C136,35 145,38 148,42 C151,46 153,56 150,60 C147,64 138,68 132,68 C126,68 117,66 114,62 C111,58 109,50 112,46 Z",15,""]],"paper":[["M97,43 Q103,37 112,41 L108,44 L106,42 L104,45 L101,43 Z",0,"0.995,0.105,-0.105,0.995,4.96,-10.641"],["M114,43 Q119,39 126,41 L123,44 L122,43 L120,45 L118,43 Z",0,"0.99,-0.139,0.139,0.99,-4.747,17.114"]]}};
})(window.PN);
// ---- PN.icons.hudSlot(id, {size = 40, level, cooldown, awakenReady, rarity}) — §13.2 in-game HUD skill slot ----
// Local box 0,0 -> 52,56 at size 40 (scales with size/40). Slot card (0,0)-(44,44), icon 40 at (2,2).
// Rarity = knot count only, in ink, under the slot (knot glyph 5.2 px, 1 px gaps). Level = 5 pips in a column at x 47.
// Active = square slot, passive = chamfered slot. No cyan / coral / metal in the slot chrome (HUD rule §3.4).
(function (PN) {
  const { K, ctx, L, f } = PN._ki;
  PN.icons.hudSlot = function (id, o = {}) {
    const def = PN._ki.ICON[id]; if (!def) return '';
    const c = ctx('u'), S = o.size || 40, k = S / 40;
    const ri = Math.max(0, PN.icons.RARITY.indexOf(o.rarity || def.rarity)), n = ri + 1, pas = def.kind === 'passive';
    const fr = pas ? 'M6,0 H38 L44,6 V38 L38,44 H6 L0,38 V6 Z' : 'M0,0 H44 V44 H0 Z';
    const win = pas ? 'M6,2 H38 L42,6 V38 L38,42 H6 L2,38 V6 Z' : 'M2,2 H42 V42 H2 Z';
    let s = `<path d="${fr}" fill="${K.ink}" transform="translate(2,2)"/><path d="${fr}" fill="${K.hanji}" stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<g clip-path="${c.clip('w', win)}"><g transform="translate(2,2)">${PN.icons.skill(id, { size: 40, pitchFor: S })}</g>`;
    // cooldown ink mask: remaining fraction as a clockwise wedge from 12 o'clock, paper hairline on the sweeping edge
    const cd = Math.max(0, Math.min(1, o.cooldown || 0));
    if (cd > 0 && cd < 1) {
      const a0 = -Math.PI / 2 + (1 - cd) * Math.PI * 2, a1 = Math.PI * 1.5, R = 34, P = (a) => `${f(22 + Math.cos(a) * R)},${f(22 + Math.sin(a) * R)}`;
      s += `<path d="M22,22 L${P(a0)} A${R},${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${P(a1)} Z" fill="${K.ink}" opacity="0.64"/>` + L(`M22,22 L${P(a0)}`, K.p50, 1.2);
    } else if (cd >= 1) s += `<rect x="2" y="2" width="40" height="40" fill="${K.ink}" opacity="0.64"/>`;
    s += '</g>';
    if (pas) s += `<path d="${win}" fill="none" stroke="${K.ink}" stroke-width="1"/>`;
    // knots (結) on a thread — count = rarity rank; glyph ≥ 5 px with 1 px gaps
    const sp = 6.4, x0 = 22 - (n - 1) * sp / 2, ky = 50.5;
    s += L(`M${f(x0 - 5)},${ky} L${f(x0 + (n - 1) * sp + 5)},${ky}`, K.ink, 1.1);
    for (let i = 0; i < n; i++) { const x = x0 + i * sp; s += `<circle cx="${f(x)}" cy="${ky}" r="2.7" fill="${K.ink}"/>` + L(`M${f(x - 1.4)},${ky + 0.9} Q${f(x)},${ky - 2} ${f(x + 1.2)},${ky - 0.2}`, K.hanji, 0.8); }
    // level pips (column right of the slot)
    const lv = Math.max(0, Math.min(5, o.level || 0));
    for (let i = 0; i < 5; i++) { const y = 36 - i * 7.4; s += `<rect x="46.4" y="${f(y)}" width="4.2" height="4.2" fill="${i < lv ? K.ink : K.hanji}" stroke="${K.ink}" stroke-width="1"/>`; }
    // awaken-ready badge: paper ensō at the top-right corner
    if (o.awakenReady) s += `<circle cx="41" cy="3" r="5.6" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.2"/>` + PN._ki.enso(41, 3, 4.1, K.ink, 1.8, -1.2, 4);
    return c.out(s, k !== 1 ? `transform="scale(${f(k)})"` : '');
  };
  PN.icons.HUD_SLOT_BOX = { w: 52, h: 56, icon: [2, 2, 40], knotY: 50.5 };
})(window.PN);
