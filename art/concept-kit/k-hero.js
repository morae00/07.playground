// k-hero.js — 결(結) · 먹선 사냥꾼 hero kit  →  window.PN.heroKit
// Requires kit/lib.js (PN.taper, PN.rng). Built from work/hero/src/*.js (do not hand-edit the built file).
window.PN = window.PN || {};
(function (PN) {
  'use strict';
  // ---- bible §3 tokens (binding) ----
  const K = {
    ink: '#121110', ink7: '#2B2926', ink5: '#46423D', ink3: '#8C8579', ink1: '#BCB4A5',
    p50: '#FAF6EC', paper: '#F3EEE2', p300: '#D8D0C0',
    ally: '#00A8C6', allyD: '#007C94', allyG: '#CFF6FF',
    hostile: '#EF5B4F', hostileD: '#B8352B', warn: '#D88D16',
    ch1: '#B8AC93', ch1L: '#D4CAB4', ch1D: '#8F836C'
  };
  const f = (n) => Math.round(n * 100) / 100;
  const pt = (p) => f(p[0]) + ',' + f(p[1]);
  const T = (p, w, mode, fill, extra) => PN.taper(p, w, mode || 'mid', fill || K.ink, extra || '');
  let UID = 0;

  // ---- per-call context: unique ids, pattern/clip/filter defs ----
  function Ctx(opts) {
    opts = opts || {};
    const id = 'hk' + (++UID) + '_';
    const defs = [];
    const pitch = opts.pitch || 6;          // halftone pitch in local units
    const dot = (name, cov, col, p) => {
      p = p || pitch; const r = p * Math.sqrt(cov / Math.PI);
      defs.push(`<pattern id="${id}${name}" width="${f(p)}" height="${f(p)}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="${f(p / 2)}" cy="${f(p / 2)}" r="${f(r)}" fill="${col}"/></pattern>`);
    };
    dot('d20', 0.2, K.ink); dot('d40', 0.4, K.ink); dot('d60', 0.6, K.ink);
    dot('w30', 0.3, K.p50); dot('c40', 0.4, K.allyD);
    // v2: sub-pixel wobble only (scale ≤ 1, high frequency) — brush feel comes from PN.taper width variation, not displacement
    const rs = opts.rough == null ? 0.9 : Math.min(1, opts.rough);
    defs.push(`<filter id="${id}rough" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="${opts.seed || 7}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${rs}" xChannelSelector="R" yChannelSelector="G"/></filter>`);
    defs.push(`<filter id="${id}glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>`);
    const c = {
      id, defs, K, opts,
      pat: (n) => `url(#${id}${n})`,
      rough: `filter="url(#${id}rough)"`,
      n: 0,
      clip(d) { const cid = id + 'c' + (c.n++); defs.push(`<clipPath id="${cid}"><path d="${d}"/></clipPath>`); return cid; },
      // filled + outlined part with clipped inner shading
      part(d, fill, w, inner, extra) {
        const o = `<path d="${d}" fill="${fill}" stroke="${K.ink}" stroke-width="${w}" stroke-linejoin="round" paint-order="stroke" ${extra || ''}/>`;
        if (!inner) return o;
        return o + `<g clip-path="url(#${c.clip(d)})">${inner}</g>`;
      },
      wrap(body, attrs) { return `<g ${attrs || ''}><defs>${defs.join('')}</defs>${body}</g>`; }
    };
    return c;
  }

  // ---- geometry ----
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, s) => [a[0] * s, a[1] * s], len: (a) => Math.hypot(a[0], a[1]),
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    norm: (a) => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; },
    perp: (a) => [-a[1], a[0]],
    rot: (a, deg) => { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [a[0] * c - a[1] * s, a[0] * s + a[1] * c]; }
  };
  // smooth closed/open path through points (Catmull-Rom → cubic Bezier)
  function smooth(P, closed, k) {
    k = k == null ? 1 / 6 : k;
    const n = P.length, g = (i) => closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))];
    let d = 'M ' + pt(P[0]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
      const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
      d += ` C ${pt(c1)} ${pt(c2)} ${pt(p2)}`;
    }
    return d + (closed ? ' Z' : '');
  }
  const poly = (P) => 'M ' + P.map(pt).join(' L ') + ' Z';

  // limb capsule a→b, widths wa/wb, bulge on each side (fraction of width)
  function limb(a, b, wa, wb, bl, br) {
    bl = bl == null ? 0.1 : bl; br = br == null ? 0.1 : br;
    const u = V.norm(V.sub(b, a)), n = V.perp(u);
    const m = V.lerp(a, b, 0.5), wm = (wa + wb) / 4;
    const A1 = V.add(a, V.mul(n, wa / 2)), B1 = V.add(b, V.mul(n, wb / 2));
    const A2 = V.sub(a, V.mul(n, wa / 2)), B2 = V.sub(b, V.mul(n, wb / 2));
    const M1 = V.add(m, V.mul(n, wm * (1 + bl))), M2 = V.sub(m, V.mul(n, wm * (1 + br)));
    const q1 = V.sub(V.mul(M1, 2), V.mul(V.add(A1, B1), 0.5)), q2 = V.sub(V.mul(M2, 2), V.mul(V.add(A2, B2), 0.5));
    return {
      d: `M ${pt(A1)} Q ${pt(q1)} ${pt(B1)} A ${f(wb / 2)} ${f(wb / 2)} 0 0 0 ${pt(B2)} Q ${pt(q2)} ${pt(A2)} A ${f(wa / 2)} ${f(wa / 2)} 0 0 0 ${pt(A1)} Z`,
      e1: [A1, q1, B1], e2: [A2, q2, B2], u, n
    };
  }
  // which edge of a limb faces away from the key light (upper-left) → shadow side
  const shadowEdge = (L) => (L.n[0] + L.n[1] > 0 ? L.e1 : L.e2);
  const litEdge = (L) => (L.n[0] + L.n[1] > 0 ? L.e2 : L.e1);
  const flat = (e) => [e[0][0], e[0][1], e[1][0], e[1][1], e[2][0], e[2][1]];
  // shading band inside a limb: offset strip toward the shadow edge
  function limbShade(L, a, b, wa, wb, from, fill) {
    const s = L.n[0] + L.n[1] > 0 ? 1 : -1, n = L.n;
    const P = [V.add(a, V.mul(n, s * wa * from)), V.add(b, V.mul(n, s * wb * from)), V.add(b, V.mul(n, s * wb)), V.add(a, V.mul(n, s * wa))];
    const ext = V.mul(L.u, 30);
    P[0] = V.sub(P[0], ext); P[3] = V.sub(P[3], ext); P[1] = V.add(P[1], ext); P[2] = V.add(P[2], ext);
    return `<path d="${poly(P)}" fill="${fill}"/>`;
  }

  // ink-soaked hem (먹 스민 끝단): bleeding ink band rising from an edge (p0→p1, "up" = direction into cloth)
  function inkHem(c, p0, p1, up, h, seed) {
    const r = PN.rng(seed || 3), N = 9, top = [], U = V.norm(up);
    for (let i = 0; i <= N; i++) {
      const t = i / N, b = V.lerp(p0, p1, t), hh = h * (0.55 + 0.6 * r());
      top.push(V.add(b, V.mul(U, hh)));
    }
    const base = [V.sub(p1, V.mul(U, 8)), V.sub(p0, V.mul(U, 8))];
    const d = smooth(top, false, 0.2) + ` L ${pt(base[0])} L ${pt(base[1])} Z`;
    // bleed dots above the band + dry-brush streaks inside
    const lift = V.mul(U, h * 0.9);
    const bleed = [p0, p1, V.add(p1, V.mul(U, h * 1.9)), V.add(p0, V.mul(U, h * 1.9))];
    let streak = '';
    for (let i = 0; i < 3; i++) {
      const t0 = 0.15 + 0.25 * i + r() * 0.1, a = V.add(V.lerp(p0, p1, t0), V.mul(U, h * 0.25)), b = V.add(V.lerp(p0, p1, t0 + 0.16), V.mul(U, h * 0.3 + r() * 3));
      streak += T([a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 1, b[0], b[1]], 1.2, 'mid', K.paper, 'opacity="0.55"');
    }
    return `<path d="${poly(bleed)}" fill="${c.pat('d20')}" opacity="0.9"/><path d="${poly([p0, p1, V.add(p1, lift), V.add(p0, lift)])}" fill="${c.pat('d40')}"/><path d="${d}" fill="${K.ink}"/>${streak}`;
  }

  // chin-strap beads along a quadratic (ink / paper alternating)
  function beads(p0, p1, p2, n, r) {
    let o = '';
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
      o += i % 2 ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.9)}" fill="${K.paper}" stroke="${K.ink}" stroke-width="${f(r * 0.55)}"/>`
        : `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${K.ink}"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.35)}" r="${f(r * 0.3)}" fill="${K.p50}"/>`;
    }
    return o;
  }

  // flying needle (ally projectile): paper body, ink tip, cyan thread tail (sandwich rule)
  function needle(c, x0, y0, x1, y1, w, tail) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), u = [dx / L, dy / L], n = [-u[1], u[0]];
    const P = (s, o) => [x0 + u[0] * s + n[0] * o, y0 + u[1] * s + n[1] * o];
    tail = tail == null ? L * 1.3 : tail;
    const th = (k, wd, col, op) => T([...P(-2, 0), ...P(-tail * 0.45, k * 0.4), ...P(-tail, k)], wd, 'start', col, op ? `opacity="${op}"` : '');
    return th(2, w * 2.4, K.ink) + th(2, w * 1.5, K.ally) + th(2, w * 0.5, K.allyG) +
      `<path d="M ${pt(P(0, w))} L ${pt(P(L * 0.66, w * 0.85))} L ${f(x1)},${f(y1)} L ${pt(P(L * 0.66, -w * 0.85))} L ${pt(P(0, -w))} Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="${f(w * 0.75)}" stroke-linejoin="round" paint-order="stroke"/>` +
      `<path d="M ${pt(P(L * 0.66, w * 0.85))} L ${f(x1)},${f(y1)} L ${pt(P(L * 0.66, -w * 0.85))} Z" fill="${K.ink}"/>` +
      `<ellipse cx="${f(P(w * 2, 0)[0])}" cy="${f(P(w * 2, 0)[1])}" rx="${f(w * 1.1)}" ry="${f(w * 0.42)}" transform="rotate(${f(Math.atan2(dy, dx) * 180 / Math.PI)} ${pt(P(w * 2, 0)).replace(',', ' ')})" fill="${K.ally}" stroke="${K.ink}" stroke-width="${f(w * 0.35)}"/>` +
      `<circle cx="${f(x1)}" cy="${f(y1)}" r="${f(w * 2.2)}" fill="${K.allyG}" opacity="0.35" filter="url(#${c.id}glow)"/>`;
  }

  // ink droplets / splatter (seeded)
  function splat(cx, cy, r, n, seed, fill, dir) {
    const rnd = PN.rng(seed); let o = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.45)}"/>`;
    for (let i = 0; i < n; i++) {
      const a = dir != null ? dir + (rnd() - 0.5) * 1.6 : rnd() * Math.PI * 2, d = r * (0.5 + rnd() * 1.5), rr = r * (0.06 + rnd() * 0.2);
      o += `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d)}" r="${f(rr)}"/>`;
      if (rnd() > 0.45) o += T([cx, cy, cx + Math.cos(a) * d * 0.6, cy + Math.sin(a) * d * 0.6, cx + Math.cos(a) * d, cy + Math.sin(a) * d], rr * 1.7, 'end', fill || K.ink);
    }
    return `<g fill="${fill || K.ink}">${o}</g>`;
  }

  PN.heroKit = PN.heroKit || {};
  PN._hk = { K, f, pt, T, Ctx, V, smooth, poly, limb, shadowEdge, litEdge, flat, limbShade, inkHem, beads, needle, splat };
})(window.PN);
// ---- HEAD · 흑립 (head-local coords: origin = skull centre, chin y≈+37, brim centre (0,-34), 1 head ≈ 84u) ----
(function (PN) {
  'use strict';
  const { K, f, T, splat, beads } = PN._hk;

  // 3/4 view facing RIGHT. Face design shared by full body, portraits (bible §6: glint in shadow, right-cheek scar, knot)
  const FACE = 'M -13,-28 C -4,-34 14,-34 23,-30 C 28,-26 30,-19 30,-12 C 29.6,-9 28.4,-7.6 28.6,-6 L 35,6 C 35.6,7.8 34.4,9.4 32.8,9.4 C 31.6,9.4 30.8,10 30.2,10.8 C 31.2,12 31.6,13.4 31.2,14.6 L 30.2,16.4 C 31,17.4 31,18.8 30.2,19.8 C 29,21 27.8,21.6 27.8,23 C 28,25.6 28,28.6 26,30.6 C 24,32.6 20.6,33 17.6,32.4 C 8,30 -2,24 -9,14 C -12,8 -13.6,0 -13.6,-8 C -13.6,-16 -13.4,-22 -13,-28 Z';
  // diagonal brim shadow: far brow (upper right) → near cheekbone (lower left). NOT a horizontal band.
  const SHADOW = 'M -40,-50 L 46,-50 L 46,-15.5 L 37,-14.5 C 31,-12.2 26.5,-10 22,-8.4 C 17.5,-6.6 14.5,-4 11.5,-1.8 L 8.6,0.2 C 4.6,2.6 0.4,4.6 -3.6,6.6 C -8.4,9 -11.6,12 -15.6,16.6 L -40,22 Z';
  const HAIR_BACK = 'M -12,-42 C -28,-42 -40,-28 -39,-8 C -38,8 -33,20 -24,28 L -10,22 C -14,12 -14.5,0 -13.5,-12 C -13,-22 -11,-30 -4,-36 Z';
  const NECK = 'M -9,14 C -2,24 8,30 18,31 L 18,62 L -20,62 L -21,20 Z';

  function eyes34(expr) {
    let o = '';
    const glint = expr === 'awakened' ? K.ally : K.p50;
    // ---- near eye (inside the diagonal brim shadow unless the brim is lifted)
    if (expr === 'victory') {
      // brim lifted → near eye lit: almond + ink iris, lash stroke
      o += `<path d="M 3.6,-4.8 C 6,-7.4 11,-7.8 14,-5.4 C 11.4,-2.6 6.4,-2.4 3.6,-4.8 Z" fill="${K.p50}"/><ellipse cx="9.4" cy="-4.8" rx="1.9" ry="2.1" fill="${K.ink}"/><circle cx="9.9" cy="-5.5" r="0.6" fill="${K.p50}"/>` +
        T([3, -4.6, 8.4, -8.6, 14.8, -5.8], 2.2, 'mid', K.ink) + T([4, -2.6, 9, -1.6, 13.6, -3], 0.9, 'mid', K.ink, 'opacity="0.8"');
    } else if (expr === 'hurt') {
      o += T([2.6, -4.4, 8, -2.2, 13.6, -5.2], 1.8, 'mid', K.p50) + T([3.4, -6.6, 8.2, -5.4, 13, -7.6], 1.1, 'mid', K.p50, 'opacity="0.7"');
    } else if (expr === 'focus') {
      // horizontal slit glint + hard lower lid
      o += `<ellipse cx="9.6" cy="-4.2" rx="3" ry="0.8" fill="${glint}"/>` + T([2, -2.6, 8, -1.8, 14, -3.2], 1.5, 'mid', K.p50, 'opacity="0.95"');
    } else {
      const lid = expr === 'lowhp' ? -2.8 : -2.4, gy = expr === 'lowhp' ? -4.4 : -5;
      o += T([2, lid, 7.5, lid + 1.4, 13.6, lid - 0.6], 1.3, 'mid', K.p50, 'opacity="0.95"');
      if (expr === 'awakened') o += `<circle cx="9.6" cy="${gy}" r="4.4" fill="${K.allyG}" opacity="0.5" filter="url(#{ID}glow)"/>` + T([9.6, gy, 0, gy - 3, -14, gy + 1], 2.2, 'start', K.ally) + T([9.6, gy, -2, gy + 2, -12, gy + 8], 1.4, 'start', K.allyG);
      o += `<ellipse cx="9.6" cy="${gy}" rx="2" ry="${expr === 'lowhp' ? 1.5 : 2}" fill="${glint}"/><circle cx="6.4" cy="${gy + 1}" r="0.7" fill="${K.p50}" opacity="0.8"/>`;
    }
    // ---- far eye (lit, just under the shadow edge)
    if (expr === 'hurt') {
      o += T([22, -8, 26.6, -5.2, 30, -3.4], 2.3, 'mid', K.ink) + T([22.4, -1.4, 26.4, -2.8, 30, -3.4], 2.3, 'mid', K.ink) + T([21, -11.4, 25.6, -9.4, 30.6, -11.8], 1.8, 'mid', K.ink);
    } else if (expr === 'victory') {
      o += `<path d="M 22.4,-5 C 24.4,-7.2 27.6,-7.2 29.6,-5.4 C 27.8,-3.2 24.6,-3 22.4,-5 Z" fill="${K.p50}"/><ellipse cx="26.4" cy="-5" rx="1.5" ry="1.8" fill="${K.ink}"/><circle cx="26.8" cy="-5.6" r="0.5" fill="${K.p50}"/>` +
        T([21.8, -5, 25.4, -8.4, 30, -5.8], 2.1, 'mid', K.ink) + T([21.6, -10.6, 26, -12.6, 31, -11], 1.9, 'mid', K.ink);
    } else if (expr === 'focus') {
      // narrowed: heavy upper lid low over the iris, hard brow slanting down to the nose
      o += `<path d="M 22.6,-3.6 C 24.6,-4.4 27.4,-4.4 29.4,-3.4 C 27.8,-1.8 24.8,-1.6 22.6,-3.6 Z" fill="${K.p50}"/><ellipse cx="26.6" cy="-2.9" rx="1.5" ry="1.1" fill="${K.ink}"/>` +
        T([22, -3.4, 25.8, -5, 30, -3.6], 2.6, 'mid', K.ink) + `<path d="M 20.6,-10.6 L 31.6,-7.4 L 31,-5.8 L 20.4,-8.4 Z" fill="${K.ink}"/>`;
    } else {
      const top = expr === 'lowhp' ? -3.8 : -5.2;
      o += `<path d="M 22.6,${top + 0.4} C 24.6,${top - 0.6} 27.4,${top - 0.4} 29.4,${top + 0.4} C 27.8,-1.6 24.8,-1.4 22.6,${top + 0.4} Z" fill="${K.p50}"/>`;
      o += `<ellipse cx="26.6" cy="-3.2" rx="1.55" ry="1.95" fill="${expr === 'awakened' ? K.allyD : K.ink}"/><circle cx="27" cy="-3.8" r="0.55" fill="${K.p50}"/>`;
      o += T([22.2, top + 0.6, 25.6, top - 1, 29.8, top + 0.2], expr === 'lowhp' ? 2.8 : 2.1, 'mid', K.ink) + T([23.6, -1.4, 26.2, -1, 28.8, -1.8], 0.8, 'mid', K.ink, 'opacity="0.8"');
    }
    return o;
  }
  function mouth34(expr) {
    switch (expr) {
      case 'focus': return `<path d="M 23.4,18.6 L 31.8,18.2 L 31.8,19.8 L 23.4,20.2 Z" fill="${K.ink}"/>` + T([23, 18.6, 23.4, 20.2, 24.4, 21.4], 1.1, 'mid', K.ink);
      case 'hurt': return `<path d="M 23,17.8 C 25.6,16.4 29.8,16.6 32,17.8 C 30.8,22.4 26.4,23 23,17.8 Z" fill="${K.ink}"/><path d="M 24.4,18.4 L 31,18.2" stroke="${K.p50}" stroke-width="1"/>`;
      case 'lowhp': return `<path d="M 25,18.6 C 27,17.8 30,18 31.6,18.6 C 30.6,21 27.4,21.4 25,18.6 Z" fill="${K.ink}"/>`;
      case 'victory': return T([22.6, 19.6, 27, 20.6, 31.4, 16.6], 2, 'mid', K.ink) + T([31, 17.2, 32.2, 16.2, 32.4, 14.8], 1.1, 'mid', K.ink) + T([26, 23.4, 28.4, 23.8, 30.4, 22.8], 0.9, 'mid', K.ink, 'opacity="0.7"');
      default: return T([24.2, 19, 28, 19.6, 31.6, 18.7], 1.6, 'mid', K.ink) + T([27, 22.8, 28.6, 23, 30, 22.4], 0.9, 'mid', K.ink, 'opacity="0.7"');
    }
  }

  // hat in head-local coords (brim tilt deg)
  function hat34(c, tilt, rings) {
    tilt = tilt == null ? 5 : tilt;
    const rim = (a0, a1, rx, ry, w, op) => {
      const p = (a) => [f(rx * Math.cos(a * Math.PI / 180)), f(-34 + ry * Math.sin(a * Math.PI / 180))];
      const s = p(a0), e = p(a1);
      return `<path d="M ${s[0]},${s[1]} A ${rx} ${ry} 0 0 1 ${e[0]},${e[1]}" fill="none" stroke="${K.p50}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
    };
    return `<g transform="rotate(${tilt} 0 -34)">
      <ellipse cx="0" cy="-34" rx="106" ry="20" fill="${K.ink}" stroke="${K.ink}" stroke-width="4"/>
      <g fill="none" stroke="${K.p50}" stroke-width="1" opacity="${rings === 2 ? 0.16 : 0.22}">
        <ellipse cx="0" cy="-34" rx="92" ry="17.2"/>${rings === 2 ? '' : '<ellipse cx="0" cy="-34" rx="76" ry="14.2"/>'}<ellipse cx="0" cy="-34" rx="60" ry="11.2"/>${rings === 2 ? '' : '<ellipse cx="0" cy="-34" rx="45" ry="8.6"/>'}</g>
      ${rim(188, 246, 104, 18.6, 3.2, 0.95)}${rim(250, 272, 102, 18, 1.4, 0.5)}${rim(40, 118, 105, 19.6, 1.3, 0.35)}
      <path d="M -30,-38 L -24.5,-80 A 23 5 0 0 1 21.5,-80 L 27,-38 A 28.5 6.6 0 0 1 -30,-38 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="3.4" stroke-linejoin="round"/>
      <ellipse cx="-1.5" cy="-80" rx="23" ry="5" fill="${K.ink7}" stroke="${K.ink}" stroke-width="2.6"/>
      <path d="M -16,-77.4 L -11.4,-77.8 L -14,-40 L -19.4,-40.4 Z" fill="${K.p50}" opacity="0.88"/>
      <path d="M -6.6,-78 L -4.8,-78 L -6.4,-39.4 L -8.6,-39.4 Z" fill="${K.p50}" opacity="0.4"/>
      <path d="M 10.4,-77.8 L 12.2,-77.6 L 15.4,-39.4 L 13.2,-39.6 Z" fill="${K.p50}" opacity="0.22"/>
      <path d="M -29.6,-40 A 28.5 6.6 0 0 0 26.6,-40" fill="none" stroke="${K.p50}" stroke-width="1.6" opacity="0.55"/>
    </g>`;
  }

  function neck34(c, lite) {
    return `<path d="${NECK}" fill="${K.paper}" stroke="${K.ink}" stroke-width="4.4" stroke-linejoin="round" paint-order="stroke"/>` +
      (lite ? `<path d="M -21,20 C -8,29 6,34 18,32 L 18,62 L -21,62 Z" fill="${c.pat('d20')}"/><path d="M -21,20 C -8,29 6,34 18,32 L 18,37 C 6,39 -10,34 -21,26 Z" fill="${K.ink}"/>`
        : `<path d="M -21,20 C -8,29 6,34 18,32 L 18,46 C 6,46 -10,42 -21,34 Z" fill="${K.ink}"/>`);
  }
  // full 3/4 head. o: {expr, hat:true, tilt, beads:true, sweat, splash}
  function head34(c, o) {
    o = o || {}; const expr = o.expr || 'calm';
    const cl = c.clip(FACE);
    let s = `<path d="${HAIR_BACK}" fill="${K.ink}" stroke="${K.ink}" stroke-width="4"/>`;
    s += o.sheen ? T([-26, -36, -38, -12, -30, 20], 3.2, 'mid', K.p50, 'opacity="0.9"') + T([-18, -38, -28, -18, -24, 8], 2, 'mid', K.p50, 'opacity="0.8"') + T([-33, -24, -40, -4, -34, 18], 1.4, 'mid', K.p50, 'opacity="0.7"')
      : T([-30, -34, -42, -10, -30, 22], 1.6, 'mid', K.p50, 'opacity="0.55"') + T([-22, -38, -34, -18, -28, 10], 1, 'mid', K.p50, 'opacity="0.4"');
    if (o.neck !== false) s += neck34(c);
    s += `<path d="M -16,-6 C -23,-9 -26,1 -23,7 C -21.6,10.6 -18.4,12 -15,10.4 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="2"/>`;
    s += `<path d="${FACE}" fill="${K.paper}" stroke="${K.ink}" stroke-width="4" stroke-linejoin="round" paint-order="stroke"/>`;
    s += `<g clip-path="url(#${cl})">
      <path d="M 30.2,10.8 C 32,11 34,10.6 35,9 L 35,12 L 30,12 Z" fill="${K.ink}"/>
      <path d="M 27.8,23 C 26,24.4 24.6,24.6 23,24.2 C 24.6,25.8 26.6,26 28,25.2 Z" fill="${K.ink}" opacity="0.85"/>
      <path d="${SHADOW}" fill="${K.ink}" transform="translate(0 ${o.shadowDy || 0}) rotate(${o.shadowRot || 0} 10 -10)"/>
      ${expr === 'lowhp' || expr === 'hurt' ? `<path d="M -16,16.6 C -11,12 -6,8.4 0,5.2 L 2,8.4 C -4,11 -10,16 -16,22 Z" fill="${c.pat('d40')}"/>` : ''}
    </g>`;
    // nostril + scar (right cheek, sewn stroke) + eyes + mouth
    s += T([29.6, 8.6, 31, 7.8, 32.6, 8.2], 1.2, 'mid', K.ink);
    s += T([-4, 14.6, 2, 12, 9.6, 9.2], 1.3, 'mid', K.ink) + `<path d="M 0.6,11.4 L 1.8,14.2 M 5,9.8 L 6.2,12.6" stroke="${K.ink}" stroke-width="0.7"/>`;
    const B = o.bold || 1, sc = (cx, cy, m) => B === 1 ? m : `<g transform="translate(${cx} ${cy}) scale(${B}) translate(${-cx} ${-cy})">${m}</g>`;
    s += sc(18, -4, eyes34(expr).replace(/\{ID\}/g, c.id)) + sc(27, 17, `<g transform="translate(-1.3 -2.2)">${mouth34(expr)}</g>`);
    // front locks (near side) framing the face
    s += T([-9, -26, -19, 0, -18, 28], 6, 'mid', K.ink) + T([-3, -28, -10, -6, -8.6, 16], 4.2, 'mid', K.ink) + T([-12, -24, -16, 2, -14, 22], 1, 'mid', K.p50, 'opacity="0.55"');
    if (o.sweat || expr === 'lowhp') {
      s += `<path d="M 16,-10 C 13.6,-6 13.8,-3.4 16,-3 C 18.2,-3.4 18.4,-6 16,-10 Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.2"/>` +
        `<path d="M 33,-16 C 31.2,-12.6 31.4,-10.4 33.2,-10 C 35,-10.4 35.2,-12.6 33,-16 Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.1"/>`;
    }
    if (o.splash || expr === 'hurt') s += splat(18, 26, 5, 7, 31, K.ink, 2.4);
    if (o.beads !== false) {
      s += `<path d="M -15,-14 C -12,4 -8,20 -6,30" fill="none" stroke="${K.ink}" stroke-width="1.2"/>`;
      s += beads([-6, 31], [0, 60], [9, 88], 11, 2.2) + beads([25, 38], [24, 62], [17, 90], 10, 2);
    }
    if (o.hat !== false) s += `<g transform="translate(0 ${o.hatDy || 0})">${hat34(c, o.tilt, o.rings)}</g>`;
    return s;
  }

  Object.assign(PN._hk, { neck34, head34, hat34, FACE });
})(window.PN);
// ---- HEAD (front / back views) · head-local coords: origin = skull centre ----
(function (PN) {
  'use strict';
  const { K, f, T, splat, beads } = PN._hk;
  // ---- FRONT head (origin skull centre, symmetric; brim tilts down to viewer-left so the shadow runs diagonally) ----
  const FFACE = 'M -22,-30 C -24.6,-14 -24.4,2 -21,12.6 C -17.4,22.4 -9.4,30.4 -2.4,36.4 C -1.2,37.6 -0.4,39.2 0,40.2 C 0.6,39 1.4,37.6 2.8,36.2 C 9.6,30.2 17,22.2 20.6,12.6 C 24,2 24.6,-14 22,-30 Z';
  // diagonal brim shadow: viewer-right brow (y≈−15) → viewer-left cheekbone (y≈+3). NOT a horizontal band.
  const FSHADOW = 'M -40,-60 L 40,-60 L 40,-15.4 L 30,-14.2 C 22,-12.2 14,-9.8 6,-6.8 C -2,-3.8 -10,-1.2 -17,1.8 L -40,7 Z';
  function headFront(c, o) {
    o = o || {};
    const cl = c.clip(FFACE);
    let s = `<path d="M -30,-38 C -44,-20 -42,14 -34,40 L -18,34 L -24,-10 Z M 30,-38 C 44,-20 42,14 34,40 L 18,34 L 24,-10 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="3"/>`;
    s += `<path d="M -13,26 L -14,58 L 14,58 L 13,26 Z" fill="${K.paper}" stroke="${K.ink}" stroke-width="4" paint-order="stroke"/><path d="M -14,29 C -6,38 6,38 14,29 L 14,33 C 6,42 -6,42 -14,33 Z" fill="${K.ink}"/><path d="M -14,33 C -6,42 6,42 14,33 L 14,42 L -14,42 Z" fill="${c.pat('d20')}"/><path d="M 4,40 L 14,34 L 14,58 L 8,58 Z" fill="${c.pat('d40')}"/>`;
    s += `<path d="M -23,-6 C -30,-8 -31,4 -27,8 L -22,9 Z M 23,-6 C 30,-8 31,4 27,8 L 22,9 Z" fill="${K.ink}"/>`;
    s += `<path d="${FFACE}" fill="${K.paper}" stroke="${K.ink}" stroke-width="4" stroke-linejoin="round" paint-order="stroke"/>`;
    // inside the face: jaw plane tone on the shadow (viewer-right) side, under-chin tone, then the diagonal brim shadow
    s += `<g clip-path="url(#${cl})">
      <path d="M 10,16 C 16,11 20,4 22,-4 L 30,-4 L 30,44 L 2,44 C 10,34 14,26 15,20 Z" fill="${c.pat('d20')}"/>
      <path d="M 13,20 C 16,14 19,8 21,1 L 26,1 L 26,30 L 6,40 C 10,32 12,26 13,20 Z" fill="${c.pat('d40')}"/>
      <path d="M -24,26 C -14,34 -5,39 0,41 C 6,39 15,33 24,24 L 24,46 L -24,46 Z" fill="${c.pat('d40')}"/>
      <path d="${FSHADOW}" fill="${K.ink}"/></g>`;
    // nose: tapered wedge on the shadow side from brow to tip + nostril ticks
    s += `<path d="M 1.2,-5 C 3.2,1.6 4.8,7.6 6.6,12.8 C 5.8,14.6 4.2,15.2 2.6,14.8 C 3.6,10 3,3.6 1.2,-5 Z" fill="${K.ink}"/>` + T([-3.6, 14.4, -1.8, 15.9, 0.4, 15.1], 1.4, 'mid', K.ink) + T([2.4, 15.2, 3.8, 15.9, 5.4, 15.2], 1.1, 'mid', K.ink);
    // eyes: viewer-left (character's right) in shadow → glint + lower lid; viewer-right lit with brow
    s += T([-16.5, -2.2, -11, -0.4, -5.6, -2.6], 1.3, 'mid', K.p50) + `<circle cx="-10.4" cy="-4.6" r="2" fill="${K.p50}"/>`;
    s += `<path d="M 5,-5 C 8,-7.4 13.6,-7.6 17,-5 C 14,-2 8.4,-2 5,-5 Z" fill="${K.p50}"/><ellipse cx="11.2" cy="-4.4" rx="1.9" ry="2.1" fill="${K.ink}"/><circle cx="11.7" cy="-5" r="0.6" fill="${K.p50}"/>`;
    s += T([4.4, -4.8, 10.8, -8.2, 17.6, -5.2], 2.1, 'mid', K.ink) + T([4.6, -11.2, 11.6, -13.4, 19, -11.4], 2.3, 'mid', K.ink) + T([6, -1.4, 11, -0.6, 16, -2.2], 0.8, 'mid', K.ink, 'opacity="0.8"');
    // mouth: one-sided corner (right corner tucked), lower-lip shadow, chin cleft
    s += T([-5.8, 22.4, -0.4, 23.4, 5.4, 22], 1.8, 'mid', K.ink) + T([5, 21.9, 6.4, 21, 7, 19.6], 1.2, 'mid', K.ink) + T([-2.4, 26.4, 0.4, 27.2, 3, 26.4], 1, 'mid', K.ink, 'opacity="0.8"') + T([-0.6, 33.6, 0.4, 35, 1.2, 36.6], 1, 'mid', K.ink, 'opacity="0.7"');
    // scar on the character's right cheek (viewer-left), sewn stroke
    s += T([-21, 12.6, -17, 9.4, -11.6, 7.6], 1.5, 'mid', K.ink) + `<path d="M -18.6,9 L -17.4,12 M -14.6,7.6 L -13.8,10.6" stroke="${K.ink}" stroke-width="0.8"/>`;
    // jaw: heavier tapered contour on the shadow side
    s += T([23.2, 2, 21, 20, 2.6, 37.8], 2.6, 'mid', K.ink);
    s += T([-12, -28, -24, -4, -27, 26], 6.6, 'mid', K.ink) + T([12, -28, 24, -4, 27, 26], 6.6, 'mid', K.ink) + T([-4, -30, -12, -18, -18, -8], 4, 'mid', K.ink);
    if (o.beads !== false) s += beads([-10, 33], [-12, 62], [-4, 92], 11, 2.2) + beads([10, 33], [12, 62], [4, 92], 11, 2.2);
    s += hatFront(c, o.tilt == null ? -4 : o.tilt, false);
    return s;
  }
  function hatFront(c, tilt, back) {
    return `<g transform="rotate(${tilt} 0 -34)">
      <ellipse cx="0" cy="-34" rx="112" ry="19" fill="${K.ink}" stroke="${K.ink}" stroke-width="4"/>
      <g fill="none" stroke="${K.p50}" stroke-width="1" opacity="0.22"><ellipse cx="0" cy="-34" rx="96" ry="16.2"/><ellipse cx="0" cy="-34" rx="78" ry="13.2"/><ellipse cx="0" cy="-34" rx="60" ry="10.2"/><ellipse cx="0" cy="-34" rx="44" ry="7.6"/></g>
      <path d="M -109,-38 A 112 19 0 0 1 -58,-50.6" fill="none" stroke="${K.p50}" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
      <path d="M 40,-16.4 A 112 19 0 0 0 100,-25" fill="none" stroke="${K.p50}" stroke-width="1.3" stroke-linecap="round" opacity="0.4"/>
      <path d="M -29,-38 L -23.5,-80 A 23.5 5 0 0 1 23.5,-80 L 29,-38 A 29 6.4 0 0 1 -29,-38 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="3.4" stroke-linejoin="round"/>
      <ellipse cx="0" cy="-80" rx="23.5" ry="5" fill="${K.ink7}" stroke="${K.ink}" stroke-width="2.6"/>
      <path d="M -15,-77.4 L -10.6,-77.8 L -12.8,-40 L -18.4,-40.4 Z" fill="${K.p50}" opacity="${back ? 0.6 : 0.88}"/>
      <path d="M -4.4,-78 L -2.6,-78 L -3.2,-39.4 L -5.4,-39.4 Z" fill="${K.p50}" opacity="0.38"/>
      <path d="M 10.8,-77.8 L 12.6,-77.6 L 15.2,-39.4 L 13,-39.6 Z" fill="${K.p50}" opacity="0.2"/>
      <path d="M -28.6,-40 A 29 6.4 0 0 0 28.6,-40" fill="none" stroke="${K.p50}" stroke-width="1.6" opacity="0.55"/>
    </g>`;
  }
  // ---- BACK head: hair mass, tie, ears, nape; ponytail drawn by body ----
  function headBack(c, o) {
    o = o || {};
    let s = `<path d="M -13,26 L -14,58 L 14,58 L 13,26 Z" fill="${K.paper}" stroke="${K.ink}" stroke-width="4" paint-order="stroke"/><path d="M -14,26 L 14,26 L 14,44 C 6,40 -6,40 -14,44 Z" fill="${c.pat('d40')}"/>`;
    s += `<path d="M -26,-6 C -32,-8 -33,4 -29,9 L -24,8 Z M 26,-6 C 32,-8 33,4 29,9 L 24,8 Z" fill="${K.paper}" stroke="${K.ink}" stroke-width="2.6" paint-order="stroke"/>`;
    s += `<path d="M -27,-34 C -34,-10 -30,14 -18,30 C -8,36 8,36 18,30 C 30,14 34,-10 27,-34 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="3"/>`;
    s += T([-16, -30, -22, -4, -12, 22], 1.4, 'mid', K.p50, 'opacity="0.5"') + T([-6, -32, -9, 0, -4, 24], 1.1, 'mid', K.p50, 'opacity="0.4"') + T([10, -32, 14, -2, 8, 22], 1, 'mid', K.p50, 'opacity="0.3"');
    s += `<path d="M -8,24 L 8,24 L 7,34 L -7,34 Z" fill="${K.paper}" stroke="${K.ink}" stroke-width="2"/><path d="M -7,28 L 7,28" stroke="${K.ink}" stroke-width="1.4"/>`;
    s += hatFront(c, o.tilt == null ? 4 : o.tilt, true);
    return s;
  }

  Object.assign(PN._hk, { headFront, headBack, hatFront });
})(window.PN);
// ---- ORGANIC LIMB (v2) · one continuous tapered outline through the joints — no capsules / elbow discs ----
(function (PN) {
  'use strict';
  const H = PN._hk;
  const { K, f, pt, T, V, smooth } = H;
  const LIGHT = V.norm([-1, -1.15]);            // direction toward the key light (upper-left)
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const turn = (a, b, c) => { const u1 = V.norm(V.sub(b, a)), u2 = V.norm(V.sub(c, b)); return Math.acos(Math.max(-1, Math.min(1, dot(u1, u2)))) * 180 / Math.PI; };

  // guarantee a joint break ≥ minDeg by sliding the middle joint sideways (keeps the current bend side, or `pref` ±1)
  function ensureBend(a, b, c, minDeg, pref) {
    if (turn(a, b, c) >= minDeg) return b;
    const ac = V.sub(c, a), L = V.len(ac), u = V.norm(ac), n = V.perp(u);
    const t = Math.max(0.2, Math.min(0.8, dot(V.sub(b, a), u) / L));
    let s = Math.sign(dot(V.sub(b, a), n)); if (!s || (pref && Math.abs(dot(V.sub(b, a), n)) < 1)) s = pref || 1;
    let lo = 0, hi = L, h = 0;
    for (let i = 0; i < 30; i++) { h = (lo + hi) / 2; const bb = V.add(V.add(a, V.mul(u, t * L)), V.mul(n, s * h)); if (turn(a, bb, c) < minDeg) lo = h; else hi = h; }
    return V.add(V.add(a, V.mul(u, t * L)), V.mul(n, s * h));
  }

  // outline through joints J with widths W. o.bulge[i] = [left, right] extra fraction at t≈0.3 of segment i
  function limbPath(J, W, o) {
    o = o || {};
    const n = J.length, U = [], N = [];
    for (let i = 0; i < n - 1; i++) { U.push(V.norm(V.sub(J[i + 1], J[i]))); N.push(V.perp(U[i])); }
    const Lp = [], Rp = [], segIdx = [];
    const push = (p, nn, wl, wr, si) => { Lp.push(V.add(p, V.mul(nn, wl))); Rp.push(V.sub(p, V.mul(nn, wr))); segIdx.push(si); };
    for (let i = 0; i < n - 1; i++) {
      const a = J[i], b = J[i + 1], wa = W[i], wb = W[i + 1], bl = (o.bulge && o.bulge[i]) || [0.08, 0.08];
      if (i === 0) push(a, N[0], wa / 2, wa / 2, 0);
      else {
        // interior joint: bisector normal; outer side of the bend pointy, inner side tucked (crease)
        const nb = V.norm(V.add(N[i - 1], N[i])), inner = V.sub(U[i], U[i - 1]), leftInner = dot(N[i], inner) > 0;
        const kO = o.kOut || 1.07, kI = o.kIn || 0.8;
        push(a, nb, wa / 2 * (leftInner ? kI : kO), wa / 2 * (leftInner ? kO : kI), i);
      }
      [[0.3, 1], [0.66, 0]].forEach(([t, bump]) => {
        const p = V.lerp(a, b, t), w = wa + (wb - wa) * t;
        push(p, N[i], w / 2 * (1 + bl[0] * bump), w / 2 * (1 + bl[1] * bump), i);
      });
    }
    const e = J[n - 1], ue = U[n - 2], we = W[n - 1];
    push(e, N[n - 2], we / 2, we / 2, n - 2);
    const cap = V.add(e, V.mul(ue, we * (o.endCap == null ? 0.28 : o.endCap)));
    const base = V.sub(J[0], V.mul(U[0], W[0] * (o.baseCap == null ? 0.18 : o.baseCap)));
    const pts = Lp.concat([cap], Rp.slice().reverse(), [base]);
    return { d: smooth(pts, true, 0.15), Lp, Rp, segIdx, U, N, J, W };
  }

  // which side (+1 = Lp / -1 = Rp) of segment i faces away from the light
  const shadowSign = (G, i) => (dot(G.N[i], LIGHT) < 0 ? 1 : -1);
  function segSide(G, i, s) {
    // contour points on side s spanning joint i → joint i+1
    const arr = s > 0 ? G.Lp : G.Rp, k0 = i * 3, out = [];
    for (let k = k0; k <= Math.min(arr.length - 1, k0 + 3); k++) out.push(arr[k]);
    return out;
  }
  // designed black crescent hugging the shadow side of segment i (0 at the joints, `depth`·width at the belly)
  function crescent(G, i, depth, fill, s) {
    s = s || shadowSign(G, i);
    const side = segSide(G, i, s), a = G.J[i], b = G.J[i + 1];
    const inner = side.map((p, k) => { const t = k / (side.length - 1), c = V.lerp(a, b, t), w = G.W[i] + (G.W[i + 1] - G.W[i]) * t, k2 = depth * Math.pow(Math.sin(Math.PI * Math.min(0.96, Math.max(0.04, t))), 0.7); return V.add(p, V.mul(V.norm(V.sub(c, p)), w * k2)); });
    const ext = (p, q, L) => V.add(p, V.mul(V.norm(V.sub(p, q)), L));
    const out = side.map((p) => V.add(p, V.mul(V.norm(V.sub(p, V.lerp(a, b, 0.5))), 6)));
    return `<path d="${smooth(out.concat(inner.slice().reverse()), true, 0.14)}" fill="${fill || K.ink}"/>`;
  }
  // heavy tapered brush stroke along the shadow contour (+40%) and a broken thin one on the lit side
  function contourStrokes(G, wShadow, wLit) {
    let s = '';
    for (let i = 0; i < G.U.length; i++) {
      const sh = segSide(G, i, shadowSign(G, i)), li = segSide(G, i, -shadowSign(G, i));
      if (sh.length >= 3) s += T([...sh[0], ...sh[Math.floor(sh.length / 2)], ...sh[sh.length - 1]], wShadow, 'mid', K.ink);
      if (wLit && li.length >= 3) s += T([...li[0], ...li[1], ...li[2]], wLit, 'mid', K.ink);
    }
    return s;
  }
  // crease at an interior joint i (1..n-2): tucked black wedge on the inner side + 2 fold ticks
  function crease(G, i, size) {
    const inner = V.sub(G.U[i], G.U[i - 1]); if (V.len(inner) < 0.2) return '';
    const s = dot(G.N[i], inner) > 0 ? 1 : -1, arr = s > 0 ? G.Lp : G.Rp, p = arr[i * 3], j = G.J[i];
    const inw = V.norm(V.sub(j, p)), al = V.norm(V.add(G.U[i - 1], G.U[i])), z = size || G.W[i] * 0.42;
    const a = V.sub(p, V.mul(al, z * 0.9)), b = V.add(p, V.mul(al, z * 0.9)), c = V.add(p, V.mul(inw, z * 0.75));
    return `<path d="M ${pt(a)} Q ${pt(V.add(p, V.mul(inw, z * 0.25)))} ${pt(c)} Q ${pt(V.add(p, V.mul(inw, z * 0.2)))} ${pt(b)} Z" fill="${K.ink}"/>` +
      T([...V.add(c, V.mul(al, -z * 0.2)), ...V.add(V.add(c, V.mul(inw, z * 0.35)), V.mul(al, -z * 0.7)), ...V.add(V.add(c, V.mul(inw, z * 0.5)), V.mul(al, -z * 1.3))], 1.6, 'start', K.ink) +
      T([...V.add(c, V.mul(al, z * 0.2)), ...V.add(V.add(c, V.mul(inw, z * 0.3)), V.mul(al, z * 0.8)), ...V.add(V.add(c, V.mul(inw, z * 0.4)), V.mul(al, z * 1.4))], 1.3, 'start', K.ink);
  }
  // thin rim light along the lit side, inset into the limb
  function rim(G, i, inset, w, col, op) {
    const s = -shadowSign(G, i), side = segSide(G, i, s), a = G.J[i], b = G.J[i + 1];
    const p = side.map((q, k) => V.add(q, V.mul(V.norm(V.sub(V.lerp(a, b, k / (side.length - 1)), q)), inset)));
    if (p.length < 3) return '';
    return T([...V.lerp(p[0], p[1], 0.3), ...p[Math.floor(p.length / 2)], ...V.lerp(p[p.length - 2], p[p.length - 1], 0.7)], w, 'mid', col || K.p50, `opacity="${op || 0.8}"`);
  }

  Object.assign(H, { ensureBend, limbPath, shadowSign, segSide, crescent, contourStrokes, crease, rim, LIGHT, turn });
})(window.PN);
// ---- BODY PARTS (v2) · world coords of the full-body box; figure faces RIGHT; key light upper-left ----
(function (PN) {
  'use strict';
  const { K, f, pt, T, V, smooth, poly, inkHem } = PN._hk;
  const H = PN._hk;
  const OL = 6; // outline stroke (paint-order stroke → 3u visible), shadow side gets +taper on top

  // ARM · paper sleeve, one tapered outline: shoulder 1.0 → elbow 0.8 → wrist 0.55, elbow break ≥ 15°
  function arm(c, a, h, o) {
    o = o || {}; h = h || {};
    const sh = a[0], wr = a[2], el = H.ensureBend(a[0], a[1], a[2], o.minBend || 15, o.pref || 1);
    const w0 = o.w0 || 30, W = [w0, w0 * 0.8, w0 * 0.55];
    const G = H.limbPath([sh, el, wr], W, { bulge: [[0.14, 0.12], [0.16, 0.05]], endCap: 0.02, baseCap: 0.35, kOut: 1.12, kIn: 0.74 });
    let inner = '';
    for (let i = 0; i < 2; i++) inner += H.crescent(G, i, 0.56, c.pat('d20')) + H.crescent(G, i, 0.36, K.ink);
    inner += H.crease(G, 1);
    // sleeve drag folds on the forearm (from the elbow crease toward the cuff)
    const u2 = G.U[1], n2 = G.N[1], mid = V.lerp(el, wr, 0.42), ss = H.shadowSign(G, 1);
    inner += T([...V.add(V.lerp(el, wr, 0.18), V.mul(n2, ss * W[1] * 0.42)), ...V.add(mid, V.mul(n2, ss * W[1] * 0.12)), ...V.add(V.lerp(el, wr, 0.62), V.mul(n2, -ss * W[1] * 0.1))], 2.2, 'mid', K.ink);
    // ink-soaked cuff (먹 스민 끝단) rising from the sleeve end
    const p0 = V.add(V.add(wr, V.mul(n2, W[2] / 2 + 5)), V.mul(u2, 4)), p1 = V.add(V.sub(wr, V.mul(n2, W[2] / 2 + 5)), V.mul(u2, 4));
    inner += inkHem(c, p0, p1, V.mul(u2, -1), 15, 11);
    const deg = Math.atan2(u2[1], u2[0]) * 180 / Math.PI;
    return c.part(G.d, K.paper, OL, inner) + H.contourStrokes(G, 3.8, 0) + H.hand(c, wr, deg + (h.rot || 0), h.type || 'fist', h);
  }

  // LEG · ink.700 trouser + 3 white 행전 wraps + black boot. l = [hip, knee, ankle, toe]
  function leg(c, l, o) {
    o = o || {};
    const hp = l[0], an = l[2], toe = l[3], kn = H.ensureBend(l[0], l[1], l[2], o.minBend || 15, o.pref || -1);
    const tw = o.tw || 40, W = [tw, tw * 0.8, tw * 0.52];
    const G = H.limbPath([hp, kn, an], W, { bulge: [[0.03, 0.12], [0.2, 0.02]], endCap: 0.05, baseCap: 0.2 });
    const u = G.U[1], n = G.N[1], at = (t, off) => V.add(V.lerp(kn, an, t), V.mul(n, off));
    const band = (t0, th) => {
      const a = at(t0, 30), b = at(t0, -30), a2 = at(t0 + th, 30), b2 = at(t0 + th, -30), sag = V.mul(u, 4.5);
      return `<path d="M ${pt(a)} Q ${pt(V.add(V.lerp(a, b, 0.5), sag))} ${pt(b)} L ${pt(b2)} Q ${pt(V.add(V.lerp(a2, b2, 0.5), sag))} ${pt(a2)} Z" fill="${K.paper}" stroke="${K.ink}" stroke-width="2"/>`;
    };
    let inner = band(0.4, 0.095) + band(0.54, 0.095) + band(0.68, 0.095);
    inner += H.crescent(G, 1, 0.5, c.pat('d60')) + H.crescent(G, 0, 0.34, K.ink) + H.crescent(G, 1, 0.22, K.ink) + H.crease(G, 1, 10);
    // boot shaft
    inner += `<path d="${poly([at(0.81, 34), at(1.08, 34), at(1.08, -34), at(0.81, -34)])}" fill="${K.ink}"/>` + T([...at(0.815, 26), ...at(0.83, 0), ...at(0.815, -26)], 1.3, 'mid', K.p50, 'opacity="0.55"');
    const litS = -H.shadowSign(G, 1);
    inner += T([...at(0.85, litS * W[2] * 0.3), ...at(0.92, litS * W[2] * 0.3), ...at(0.99, litS * W[2] * 0.28)], 1.8, 'mid', K.p50, 'opacity="0.55"');
    const legM = c.part(G.d, K.ink7, OL, inner) + H.rim(G, 0, 3.2, 1.8, K.p50, 0.7) + H.contourStrokes(G, 3.4, 0);
    return legM + (o.noFoot ? '' : foot(c, an, toe, o.flipFoot));
  }
  // boot foot from ankle toward toe
  function foot(c, an, toe, flip) {
    const d = V.norm(V.sub(toe, an)); let n = V.perp(d); if (flip) n = V.mul(n, -1);
    const L = V.len(V.sub(toe, an));
    const P = (x, y) => V.add(an, V.add(V.mul(d, x), V.mul(n, y)));
    const pts = [P(-9, -8), P(-11.5, 4), P(-9.5, 12.5), P(L * 0.5, 13.5), P(L + 1, 11), P(L + 2.5, 5.5), P(L * 0.72, -1), P(L * 0.3, -6), P(9, -9.5)];
    return c.part(smooth(pts, true, 0.16), K.ink, OL) + T([...P(-7, 10.8), ...P(L * 0.4, 12.4), ...P(L, 9.4)], 1.8, 'mid', K.p50, 'opacity="0.7"') +
      T([...P(L * 0.2, -4), ...P(L * 0.55, -1.6), ...P(L * 0.85, 2)], 1.6, 'mid', K.p50, 'opacity="0.45"');
  }

  // generic ribbon along a spine with widths (ponytail)
  function ribbon(P, W, fork) {
    const Lp = [], Rp = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], n = V.perp(V.norm(V.sub(b, a)));
      Lp.push(V.add(P[i], V.mul(n, W[i] / 2))); Rp.push(V.sub(P[i], V.mul(n, W[i] / 2)));
    }
    const end = P[P.length - 1], prev = P[P.length - 2], u = V.norm(V.sub(end, prev));
    let tip = [V.add(end, V.mul(u, 10))];
    if (fork) tip = [V.add(Lp[Lp.length - 1], V.mul(u, 16)), V.sub(end, V.mul(u, 3)), V.add(Rp[Rp.length - 1], V.mul(u, 12))];
    return { d: smooth(Lp.concat(tip, Rp.slice().reverse()), true, 0.12), Lp, Rp };
  }
  function pony(c, P, w0) {
    const W = P.map((_, i) => w0 * (1 - i / P.length * 0.75));
    const R = ribbon(P, W, false);
    return `<path d="${R.d}" fill="${K.ink}" stroke="${K.ink}" stroke-width="3"/>` + T([...R.Lp[1], ...P[Math.floor(P.length / 2)], ...P[P.length - 2]], 1.4, 'mid', K.p50, 'opacity="0.5"') +
      `<circle cx="${f(P[1][0])}" cy="${f(P[1][1])}" r="${f(w0 * 0.42)}" fill="${K.paper}" stroke="${K.ink}" stroke-width="2.4"/><path d="M ${pt(V.add(P[1], [-3, -2]))} L ${pt(V.add(P[1], [3, 2]))}" stroke="${K.ink}" stroke-width="1.4"/>`;
  }

  // neck wrap + knot (結) at the neck point, rotated by deg. Knot sits on the near/front side.
  function scarfWrap(c, at, deg, o) {
    o = o || {};
    const wrap = 'M -24,-6 C -12,4 10,6 26,-4 L 29,12 C 12,24 -14,22 -27,10 Z';
    const knot = 'M -2,4 C 4,-1 13,1 14,9 C 14,17 5,21 -1,17 C -5,13 -5,8 -2,4 Z';
    const endA = 'M 0,14 C -6,24 -8,36 -4,46 L 4,44 L 2,52 C 8,40 10,28 8,16 Z';
    const endB = 'M 8,14 C 14,22 20,30 30,34 L 26,40 L 36,40 C 26,30 20,20 13,12 Z';
    return `<g transform="translate(${f(at[0])} ${f(at[1])}) rotate(${f(deg || 0)})">
      ${c.part(wrap, K.ally, 4.6, `<path d="M -30,6 C -12,18 12,18 30,6 L 30,30 L -30,30 Z" fill="${K.allyD}"/><path d="M -2,-8 C 2,4 4,12 2,26 L 8,26 C 10,12 8,2 4,-8 Z" fill="${K.allyD}" opacity="0.9"/>`)}
      <path d="M -20,2.6 C -10,8 8,9 22,2.4" fill="none" stroke="${K.p50}" stroke-width="1.7" stroke-dasharray="3.4 3.2" stroke-linecap="round"/>
      ${T([-20, -2, 0, 5, 22, -2], 2.2, 'mid', K.allyG, 'opacity="0.85"')}
      ${o.ends === false ? '' : c.part(endB, K.ally, 4, `<path d="M 16,20 C 20,26 26,32 36,38 L 36,44 L 10,30 Z" fill="${K.allyD}"/>`) + c.part(endA, K.ally, 4, `<path d="M 4,14 L 12,14 L 8,54 L 2,54 Z" fill="${K.allyD}"/>`)}
      ${o.knot === false ? '' : c.part(knot, K.ally, 4.2, `<path d="M -6,12 C 2,18 10,18 16,12 L 16,24 L -6,24 Z" fill="${K.allyD}"/>`) + T([0, 6, 5, 3, 10, 4], 1.6, 'mid', K.allyG) + `<path d="M 4,6 C 6,9 6,12 4,15" fill="none" stroke="${K.ink}" stroke-width="1.3"/>`}
    </g>`;
  }

  // bandolier strap a→b with n needles (cyan eyes), plus optional greyed state
  function bandolier(c, a, b, n, o) {
    o = o || {};
    const u = V.norm(V.sub(b, a)), nn = V.perp(u), w = o.w || 12;
    const P = [V.add(a, V.mul(nn, w / 2)), V.add(b, V.mul(nn, w / 2)), V.sub(b, V.mul(nn, w / 2)), V.sub(a, V.mul(nn, w / 2))];
    let s = '';
    for (let i = 0; i < n; i++) {
      const t = 0.14 + i * (0.64 / Math.max(1, n - 1)), p = V.lerp(a, b, t), up = V.rot(V.mul(nn, -1), 14);
      const q = V.add(p, V.mul(up, 26)), base = V.add(p, V.mul(up, -5));
      s += `<path d="M ${pt(base)} L ${pt(q)}" stroke="${K.ink}" stroke-width="6.4" stroke-linecap="round"/><path d="M ${pt(base)} L ${pt(V.add(q, V.mul(up, -1.5)))}" stroke="${o.grey ? K.ink3 : K.p50}" stroke-width="2.8" stroke-linecap="round"/>` +
        `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="2.8" fill="${o.grey ? K.ink3 : K.ally}" stroke="${K.ink}" stroke-width="1.3"/>`;
    }
    let loops = '';
    for (let i = 0; i < n; i++) { const p = V.lerp(a, b, 0.14 + i * (0.64 / Math.max(1, n - 1))); loops += `<path d="M ${pt(V.add(p, V.mul(u, -4)))} L ${pt(V.add(p, V.mul(u, 4)))}" stroke="${K.p50}" stroke-width="${f(w * 0.72)}" opacity="0.9"/><path d="M ${pt(V.add(p, V.mul(u, -4)))} L ${pt(V.add(p, V.mul(u, 4)))}" stroke="${K.ink}" stroke-width="${f(w * 0.28)}"/>`; }
    return s + `<path d="${poly(P)}" fill="${K.ink}" stroke="${K.ink}" stroke-width="3" stroke-linejoin="round"/>` + loops +
      T([...V.add(a, V.mul(nn, w * 0.3)), ...V.lerp(V.add(a, V.mul(nn, w * 0.3)), V.add(b, V.mul(nn, w * 0.3)), 0.5), ...V.add(b, V.mul(nn, w * 0.3))], 1.4, 'mid', K.p50, 'opacity="0.5"');
  }
  // thread spool (실패) hanging at hip
  function spool(c, p, deg) {
    return `<g transform="translate(${f(p[0])} ${f(p[1])}) rotate(${deg || 0})">
      <path d="M 0,-14 L 0,-4" stroke="${K.ink}" stroke-width="2.4"/>
      <rect x="-9" y="-4" width="18" height="26" rx="3" fill="${K.ink}" stroke="${K.ink}" stroke-width="3"/>
      ${[0, 1, 2, 3, 4].map((i) => `<path d="M -8,${1 + i * 4.4} L 8,${-0.4 + i * 4.4}" stroke="${K.ink5}" stroke-width="1.3"/>`).join('')}
      <rect x="-12" y="-6.5" width="24" height="5" rx="2" fill="${K.paper}" stroke="${K.ink}" stroke-width="2.4"/>
      <rect x="-12" y="20" width="24" height="5" rx="2" fill="${K.paper}" stroke="${K.ink}" stroke-width="2.4"/>
      <path d="M 8,12 C 16,16 14,26 20,30" fill="none" stroke="${K.ink}" stroke-width="1.5"/></g>`;
  }
  // needle-sword (먹침검) slung: hilt point h, direction deg (toward pommel), length of visible part
  function swordHilt(c, h, deg, len) {
    len = len || 70;
    return `<g transform="translate(${f(h[0])} ${f(h[1])}) rotate(${f(deg)})">
      <path d="M -40,-5 L 6,-5 L 6,5 L -40,5 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="3"/>
      ${T([-38, -2, -16, -2.6, 4, -2], 1.4, 'mid', K.p50, 'opacity="0.6"')}
      <path d="M 6,-9 L 12,-9 L 12,9 L 6,9 Z" fill="${K.paper}" stroke="${K.ink}" stroke-width="2.6"/>
      <path d="M 12,-4 L ${len - 14},-4 L ${len - 14},4 L 12,4 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="2.6"/>
      ${[0, 1, 2, 3].map((i) => `<path d="M ${18 + i * 9},-4 L ${22 + i * 9},4" stroke="${K.p50}" stroke-width="1.6"/>`).join('')}
      <ellipse cx="${len - 7}" cy="0" rx="7.5" ry="5.4" fill="${K.paper}" stroke="${K.ink}" stroke-width="3"/>
      <ellipse cx="${len - 7}" cy="0" rx="3.6" ry="2" fill="${K.ink}"/>
      <path d="M ${len - 2},2 C ${len + 12},10 ${len + 4},26 ${len + 18},32" fill="none" stroke="${K.ink}" stroke-width="1.7"/></g>`;
  }

  Object.assign(H, { arm, leg, foot, ribbon, pony, scarfWrap, bandolier, spool, swordHilt, OL });
})(window.PN);
// ---- GLOVES (v2) · separated thumb + 2–3 finger masses; local frame: origin = wrist, +x = toward fingers, −y = back of hand ----
(function (PN) {
  'use strict';
  const H = PN._hk;
  const { K, f, pt, T, V, smooth } = H;
  const S = (w) => `stroke="${K.ink}" stroke-width="${w}" stroke-linejoin="round" paint-order="stroke"`;

  // one finger mass: tapered 2-segment outline, ink, with a paper rim on the lit edge
  function finger(J, W, lit) {
    const G = H.limbPath(J, W, { kOut: 1.04, kIn: 0.86, endCap: 0.42, baseCap: 0.1, bulge: [[0.04, 0.04], [0.02, 0.02]] });
    const e = lit > 0 ? G.Rp : G.Lp; // local −y edge is Rp for +x fingers
    const hi = e.length > 4 ? T([...V.lerp(e[1], e[2], 0.5), ...e[3], ...V.lerp(e[4], e[5] || e[4], 0.6)], 1.25, 'mid', K.p50, 'opacity="0.85"') : '';
    return `<path d="${G.d}" fill="${K.ink}" ${S(2.4)}/>` + hi;
  }
  // back-of-hand / palm block + knuckle ridge light
  function palm(d, lit, ridge) {
    return `<path d="${d}" fill="${K.ink}" ${S(3.6)}/>` + (ridge ? T(lit > 0 ? ridge[0] : ridge[1], 1.5, 'mid', K.p50, 'opacity="0.8"') : '');
  }
  const FIST = 'M 0,-8.5 C 6,-11 14,-11.5 20,-9.6 C 24.4,-8 26.8,-4.8 27.2,-1.4 L 27.6,6 C 27.2,10.6 24,13.2 19.4,13.2 C 13.6,13 8,11.6 3,10 L 0,8.5 Z';
  const RIDGE_F = [[4, -8.6, 13, -10.9, 21, -8.6], [5, 9.6, 13, 11.8, 21, 12.2]];
  // curled finger masses seen from the front of the fist (index / middle / ring+pinky) + thumb laid across
  function curled(lit, from) {
    const F = [
      'M 19,-6.4 C 23.4,-7.2 27.4,-5 27.8,-1.4 C 28,0.8 26,1.8 22.8,1.3 L 18.6,0.6 Z',
      'M 18.8,1 C 23.2,0.6 27.8,1.8 28,4.8 C 28.1,7.2 25.6,8 22.4,7.5 L 18.6,6.8 Z',
      'M 18.2,7.2 C 22.6,6.9 27.2,8.2 27.1,11 C 26.9,13.4 23.4,14.2 19.4,13.6 L 15.6,12.4 Z'].slice(from || 0);
    let s = F.map((d) => `<path d="${d}" fill="${K.ink}" ${S(2.2)}/>`).join('');
    // negative-space separations: paper hairlines between the masses (lit side of each lower mass)
    const sep = [[19.6, 1.2, 23.6, 1.1, 27.4, 2.6], [19, 7.4, 23, 7.2, 26.6, 8.8]].slice(Math.max(0, (from || 0) - 1));
    s += sep.map((q) => T(q, 1.15, 'mid', K.p50, 'opacity="0.8"')).join('');
    if (lit > 0 && !from) s += T([20, -6.2, 24.2, -6.6, 27, -3.6], 1.2, 'mid', K.p50, 'opacity="0.75"');
    return s;
  }
  function thumbOver(lit) {
    return `<path d="M 5.6,-3.4 C 11,-5 17.2,-4 21.2,-1 C 23.4,0.8 22.8,3.8 20,4 C 15,4.2 9.8,3.2 5.6,2.4 Z" fill="${K.ink}" ${S(2.2)}/>` +
      T(lit > 0 ? [7, -3.6, 14.4, -4.6, 20.8, -1.4] : [7, 2.6, 14, 3.8, 20, 3.6], 1.3, 'mid', K.p50, 'opacity="0.85"');
  }
  // needle held between knuckles: paper body, ink tip, base hidden in the fist
  function heldNeedle(y0, deg, len) {
    const r = deg * Math.PI / 180, u = [Math.cos(r), Math.sin(r)], n = [-u[1], u[0]], b = [16, y0], w = 1.9;
    const P = (s, o) => V.add(V.add(b, V.mul(u, s)), V.mul(n, o));
    return `<path d="M ${pt(P(0, w))} L ${pt(P(len * 0.62, w * 0.85))} L ${pt(P(len, 0))} L ${pt(P(len * 0.62, -w * 0.85))} L ${pt(P(0, -w))} Z" fill="${K.p50}" ${S(2.6)}/>` +
      `<path d="M ${pt(P(len * 0.62, w * 0.85))} L ${pt(P(len, 0))} L ${pt(P(len * 0.62, -w * 0.85))} Z" fill="${K.ink}"/>` +
      T([...P(14, -w * 0.35), ...P(len * 0.35, -w * 0.4), ...P(len * 0.58, -w * 0.3)], 0.8, 'mid', K.ink3, 'opacity="0.8"');
  }

  // hand(c, wrist, deg, type, o) — types: fist | grip | relax | open | hold | point | sign  (o.mirror flips across the forearm)
  function hand(c, wr, deg, type, o) {
    o = o || {};
    const m = o.mirror ? -1 : 1, rr = deg * Math.PI / 180;
    const up = [Math.sin(rr) * m, -Math.cos(rr) * m];           // world direction of local −y
    const lit = up[0] * H.LIGHT[0] + up[1] * H.LIGHT[1] >= -0.15 ? 1 : -1;
    let s = '';
    if (type === 'open') {
      s = finger([[19, -7], [28.5, -10.6], [37.6, -12.2]], [6.2, 5.2, 4.2], lit) + finger([[21, -2], [31, -2.6], [41, -1.2]], [6.4, 5.4, 4.3], lit) +
        finger([[20.4, 3.6], [29, 6.8], [36, 10.6]], [7.6, 6.4, 5], lit) +
        palm('M 0,-8 C 6,-10.2 13,-10.8 18.4,-9.2 L 21.6,-5.6 L 22.4,5.4 C 18,9.4 10,10.6 3,9.6 L 0,8 Z', lit, [[4, -8.2, 11, -10, 18, -8.8], [4, 8.6, 12, 9.8, 20, 6.6]]) +
        T([24, 5.4, 29, 8, 33.6, 10.2], 0.9, 'mid', K.p50, 'opacity="0.55"') +
        finger([[9, -8], [14.4, -14.6], [20.4, -19.2]], [7.2, 5.8, 4.4], lit);
    } else if (type === 'relax') {
      s = finger([[18.4, 5], [25, 7.8], [28.4, 12]], [7.2, 6, 4.8], lit) + finger([[19.6, -0.4], [28, 0.8], [32, 5.2]], [6.4, 5.4, 4.4], lit) +
        palm('M 0,-8 C 6,-10 13,-10.2 18.2,-8.2 L 21.2,-4 L 21.2,6.2 C 17,9.6 9,10.2 3,9.2 L 0,8 Z', lit, [[4, -8.2, 11, -9.8, 18, -8.2], [4, 8.6, 12, 9.8, 19, 7]]) +
        finger([[18, -6], [26, -6.6], [31, -3]], [6.2, 5.2, 4.2], lit) + finger([[7, -6.4], [13.2, -9.8], [19.4, -10.4]], [6.6, 5.4, 4.2], lit);
    } else if (type === 'point' || type === 'sign') {
      s = palm(FIST, lit, RIDGE_F) + curled(lit, type === 'sign' ? 2 : 1) +
        (type === 'sign' ? finger([[20.4, -0.4], [31, -0.6], [41.4, 0.8]], [6.2, 5.2, 4.2], lit) : '') +
        finger([[19.6, -6.2], [30, -8], [40.4, -8.4]], [6.2, 5.2, 4.2], lit) + thumbOver(lit);
    } else {
      // fist / grip / hold
      if (type === 'hold') s += heldNeedle(-1.6, -11, 50) + heldNeedle(4, 0, 54) + heldNeedle(9.6, 11, 48);
      s += palm(FIST, lit, RIDGE_F) + curled(lit, 0) + thumbOver(lit);
      if (type === 'grip') s += `<path d="M 9,-9.6 L 10,10.4" stroke="${K.ink7}" stroke-width="1.3"/>`;
      if (type === 'hold') s += `<path d="M 6,10.4 C 5,15 8,18 4,23" fill="none" stroke="${K.ink}" stroke-width="2.6" stroke-linecap="round"/><path d="M 6,10.4 C 5,15 8,18 4,23" fill="none" stroke="${K.ally}" stroke-width="1.2" stroke-linecap="round"/>`;
    }
    return `<g transform="translate(${f(wr[0])} ${f(wr[1])}) rotate(${f(deg)})${o.mirror ? ' scale(1,-1)' : ''}${o.scale ? ` scale(${o.scale})` : ''}">${s}</g>`;
  }
  Object.assign(H, { hand, finger });
})(window.PN);
// ---- SCARF TAILS (v2) · 2 twisting ribbons (long ≈ 1.6 × short), knot 100% → tip 35%, swallowtail, stitch line ----
(function (PN) {
  'use strict';
  const H = PN._hk;
  const { K, f, pt, T, V, smooth } = H;

  // arc-length resample of a Catmull-Rom spine → [{p,u,n,t}]
  function resample(P, N) {
    const dense = [], g = (i) => P[Math.max(0, Math.min(P.length - 1, i))];
    for (let i = 0; i < P.length - 1; i++) for (let k = 0; k < 12; k++) {
      const t = k / 12, p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2), t2 = t * t, t3 = t2 * t;
      dense.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
    dense.push(P[P.length - 1]);
    const cum = [0]; for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + V.len(V.sub(dense[i], dense[i - 1])));
    const Ltot = cum[cum.length - 1], out = [];
    let j = 0;
    for (let i = 0; i < N; i++) {
      const s = Ltot * i / (N - 1); while (j < cum.length - 2 && cum[j + 1] < s) j++;
      const k = (s - cum[j]) / ((cum[j + 1] - cum[j]) || 1), p = V.lerp(dense[j], dense[j + 1], k);
      out.push({ p, t: i / (N - 1) });
    }
    out.forEach((o, i) => { const a = out[Math.max(0, i - 1)].p, b = out[Math.min(N - 1, i + 1)].p; o.u = V.norm(V.sub(b, a)); o.n = V.perp(o.u); });
    out.L = Ltot;
    return out;
  }
  const sstep = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

  // one ribbon. o: {twists:[t…], tip:0.35, fork:true, seed, flutter}
  function twistRibbon(c, P, w0, o) {
    o = o || {};
    const S = resample(P, 30), tips = o.tip == null ? 0.35 : o.tip, tw = o.twists || [0.48], r = PN.rng(o.seed || 5), ph = r() * 6;
    const hw = S.map((s) => {
      let phi = 0; tw.forEach((tc) => { phi += Math.PI * sstep((s.t - tc) / 0.22 + 0.5); });
      const w = w0 * (1 - (1 - tips) * s.t) * (1 + 0.07 * Math.sin(s.t * 11 + ph)), cs = Math.cos(phi);
      return w / 2 * (Math.abs(cs) < 0.22 ? 0.22 * Math.sign(cs || 1) : cs);
    });
    const L = S.map((s, i) => V.add(s.p, V.mul(s.n, hw[i]))), R = S.map((s, i) => V.sub(s.p, V.mul(s.n, hw[i])));
    // runs of constant face sign
    const runs = []; let st = 0;
    for (let i = 1; i < S.length; i++) if (Math.sign(hw[i]) !== Math.sign(hw[i - 1])) { runs.push([st, i]); st = i - 1; }
    runs.push([st, S.length - 1]);
    let out = '';
    runs.forEach(([i0, i1], ri) => {
      const top = hw[Math.round((i0 + i1) / 2)] > 0, last = ri === runs.length - 1;
      let Lp = L.slice(i0, i1 + 1), Rp = R.slice(i0, i1 + 1), tip = [];
      if (last && o.fork !== false) {
        const e = S[S.length - 1], wE = Math.abs(hw[hw.length - 1]) * 2;
        tip = [V.add(Lp[Lp.length - 1], V.mul(e.u, wE * 1.1)), V.add(e.p, V.mul(e.u, wE * 0.15)), V.add(Rp[Rp.length - 1], V.mul(e.u, wE * 0.85))];
      } else if (last) tip = [V.add(S[S.length - 1].p, V.mul(S[S.length - 1].u, 6))];
      const d = smooth(Lp.concat(tip, Rp.slice().reverse()), true, 0.1);
      let inner = '';
      if (top) {
        // fold shade on the shadow edge + stitch line (paper.50 dashes) + glow core on the lit edge
        const litL = (S[i0].n[0] * H.LIGHT[0] + S[i0].n[1] * H.LIGHT[1]) * Math.sign(hw[i0]) > 0;
        const shE = litL ? Rp : Lp, ltE = litL ? Lp : Rp, mid = S.slice(i0, i1 + 1).map((s) => s.p);
        const shIn = shE.map((p, k) => V.lerp(p, mid[k], 0.62));
        inner += `<path d="${smooth(shE.map((p, k) => V.add(p, V.mul(V.norm(V.sub(p, mid[k])), 5))).concat(shIn.slice().reverse()), true, 0.12)}" fill="${K.allyD}"/>`;
        const st2 = ltE.map((p, k) => V.lerp(mid[k], p, 0.1));
        if (st2.length > 2) inner += `<path d="${smooth(st2, false, 0.12)}" fill="none" stroke="${K.p50}" stroke-width="1.7" stroke-dasharray="3.6 3.4" stroke-linecap="round"/>`;
        const g2 = ltE.map((p, k) => V.lerp(p, mid[k], 0.3));
        if (g2.length > 2) inner += T([...g2[0], ...g2[Math.floor(g2.length / 2)], ...g2[g2.length - 1]], Math.max(1.4, w0 * 0.1), 'mid', K.allyG, 'opacity="0.85"');
      } else {
        const mid = S.slice(i0, i1 + 1).map((s) => s.p);
        if (mid.length > 2) inner += T([...mid[0], ...mid[Math.floor(mid.length / 2)], ...mid[mid.length - 1]], 1.2, 'mid', K.ink, 'opacity="0.55"');
      }
      out += c.part(d, top ? K.ally : K.allyD, H.OL, inner);
    });
    return out;
  }
  // shorter companion ribbon: first 1/1.6 of A, swung by `deg` about the root
  function companion(A, ratio, deg) {
    const S = resample(A, 16), keep = S.filter((s) => s.t <= ratio + 1e-6).map((s) => s.p), root = A[0];
    return keep.filter((_, i) => i % 2 === 0 || i === keep.length - 1).map((p, i, arr) => V.add(root, V.rot(V.sub(p, root), deg * (i / (arr.length - 1)))));
  }
  // both tails: long A behind, short B on top
  function scarfTails(c, A, B, w0, o) {
    o = o || {};
    B = B || companion(A, 1 / 1.6, o.swing == null ? 16 : o.swing);
    return twistRibbon(c, A, w0, { twists: o.twA || [0.46], seed: 3 }) + twistRibbon(c, B, w0 * 0.86, { twists: o.twB || [0.56], seed: 9 });
  }
  // legacy entry (v1 signature) → two ribbons
  function scarfTail(c, P, w0) { return scarfTails(c, P, null, w0 || 24); }

  Object.assign(H, { resample, twistRibbon, companion, scarfTails, scarfTail });
})(window.PN);
// ---- SIDE (3/4, facing right) figure assembler (v2): curved spine + shoulder/hip counter-tilt, one continuous coat ----
(function (PN) {
  'use strict';
  const H = PN._hk;
  const { K, f, pt, T, V, smooth, poly } = H;
  const tanD = (d) => Math.tan((d || 0) * Math.PI / 180);
  const sstep = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

  // torso frame: spine N→Hp bowed by P.bow (+ = convex back), skewed so the shoulder line tilts P.shTilt and the hip line P.hipTilt
  function frame(P) {
    const N = P.neck, Hp = P.hip, D = V.sub(Hp, N), u0 = V.norm(D), back = V.rot(u0, 90), bow = P.bow || 0;
    const ts = tanD(P.shTilt), th = tanD(P.hipTilt);
    const base = (t) => V.add(V.add(N, V.mul(D, t)), V.mul(back, bow * 4 * t * (1 - t)));
    const tang = (t) => V.norm(V.sub(base(Math.min(1.05, t + 0.02)), base(Math.max(-0.05, t - 0.02))));
    const at = (t, o) => { const u = tang(t), fw = V.rot(u, -90), k = ts + (th - ts) * sstep((t - 0.15) / 0.7); return V.add(V.add(base(t), V.mul(fw, o)), V.mul(u, o * k)); };
    return { N, Hp, u: u0, fw: V.rot(u0, -90), at, tang };
  }
  // ink-soaked hem along a polyline (bottom edge), band rises toward `up`
  function hemLine(c, pts, h, seed, up) {
    const r = PN.rng(seed || 5), U = up || [0, -1], top = [], bot = [], dots = [];
    for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < 5; k++) {
      const p = V.lerp(pts[i], pts[i + 1], k / 5), hh = h * (0.5 + 0.75 * r());
      top.push(V.add(p, V.mul(U, hh))); bot.push(V.sub(p, V.mul(U, 10)));
      if (r() > 0.4) dots.push(V.add(p, V.mul(U, hh + 3 + r() * h * 0.6)));
    }
    const last = pts[pts.length - 1]; top.push(V.add(last, V.mul(U, h * 0.8))); bot.push(V.sub(last, V.mul(U, 10)));
    const band = smooth(top, false, 0.18) + ' L ' + bot.reverse().map(pt).join(' L ') + ' Z';
    const halo = smooth(top.map((p) => V.add(p, V.mul(U, h * 0.55))), false, 0.18) + ' L ' + top.slice().reverse().map(pt).join(' L ') + ' Z';
    let streak = '';
    for (let i = 1; i < pts.length; i++) { const a = V.add(V.lerp(pts[i - 1], pts[i], 0.2), V.mul(U, h * 0.3)), b = V.add(V.lerp(pts[i - 1], pts[i], 0.75), V.mul(U, h * 0.36)); streak += T([...a, ...V.lerp(a, b, 0.5), ...b], 1.3, 'mid', K.paper, 'opacity="0.5"'); }
    return `<path d="${halo}" fill="${c.pat('d40')}"/><g fill="${K.ink}">${dots.map((p) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(0.8 + r() * 1.6)}"/>`).join('')}</g><path d="${band}" fill="${K.ink}"/>${streak}`;
  }

  function torso(c, P, F) {
    const at = F.at, w = P.torsoW || 1, B = (x) => x * w;
    const shape = smooth([at(-0.03, -10), at(0.03, B(-36)), at(0.15, B(-45)), at(0.45, B(-35)), at(0.72, B(-26)), at(0.98, B(-32)), at(1.04, 0), at(0.98, B(25)), at(0.73, B(28)), at(0.54, B(42)), at(0.34, B(48)), at(0.1, B(33)), at(-0.03, 14)], true, 0.17);
    // shading: tone on the front/shadow half, a designed black spot under the chest, crease wedges at the waist
    const inner = `<path d="${poly([at(0.3, B(12)), at(0.3, 60), at(1.1, 60), at(1.1, B(8))])}" fill="${c.pat('d20')}"/>` +
      `<path d="${poly([at(0.2, B(56)), at(0.3, B(30)), at(0.38, B(36)), at(0.47, B(20)), at(0.56, B(28)), at(0.66, B(15)), at(0.74, B(22)), at(0.86, B(17)), at(1.02, B(26)), at(1.02, B(40)), at(0.7, B(40)), at(0.44, B(50))])}" fill="${K.ink}"/>` +
      `<path d="${smooth([at(0.62, B(-30)), at(0.7, B(-18)), at(0.74, B(-26))], true)}" fill="${K.ink}"/>` +
      T([...at(0.38, B(4)), ...at(0.56, B(10)), ...at(0.7, B(14))], 2.4, 'mid', K.ink) + T([...at(0.36, B(-22)), ...at(0.52, B(-20)), ...at(0.68, B(-16))], 1.8, 'mid', K.ink, 'opacity="0.8"');
    let s = c.part(shape, K.paper, H.OL, inner);
    // 사선 여밈: ink.900 깃 + paper.50 동정, vest V, overlap edge running to the belt
    const vee = [at(-0.01, -6), at(0.5, B(13)), at(-0.01, 17)];
    s += `<path d="${poly(vee)}" fill="${K.ink7}" stroke="${K.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += T([...vee[0], ...V.lerp(vee[0], vee[1], 0.5), ...vee[1]], 9, 'flat', K.ink) + T([...vee[2], ...V.lerp(vee[2], vee[1], 0.5), ...vee[1]], 8, 'flat', K.ink);
    s += T([...V.add(vee[0], F.fw), ...V.add(V.lerp(vee[0], vee[1], 0.5), V.mul(F.fw, 2.4)), ...V.add(vee[1], V.mul(F.fw, 1))], 2.6, 'start', K.p50);
    s += T([...V.sub(vee[2], V.mul(F.fw, 2)), ...V.lerp(vee[2], vee[1], 0.5), ...vee[1]], 2.2, 'start', K.p50, 'opacity="0.9"');
    s += T([...vee[1], ...at(0.64, B(20)), ...at(0.8, B(26))], 3.4, 'mid', K.ink);
    // heavy shadow-side contour
    s += T([...at(0.12, B(37)), ...at(0.4, B(40)), ...at(0.74, B(29))], 3.6, 'mid', K.ink);
    return s;
  }
  function belt(c, P, F) {
    const at = F.at, w = P.torsoW || 1;
    const top = [at(0.73, -26 * w), at(0.755, 0), at(0.74, 27 * w)], bot = [at(0.815, 28 * w), at(0.835, 0), at(0.81, -27 * w)];
    let s = `<path d="${smooth(top, false, 0.2)} L ${smooth(bot, false, 0.2).slice(2)} Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    s += T([...at(0.75, -22), ...at(0.765, 0), ...at(0.75, 20)], 1.4, 'mid', K.p50, 'opacity="0.55"');
    const b = at(0.785, 10), tg = F.tang(0.78);
    s += `<g transform="translate(${f(b[0])} ${f(b[1])}) rotate(${f(Math.atan2(tg[1], tg[0]) * 180 / Math.PI - 90)})"><rect x="-7" y="-7" width="14" height="14" rx="2" fill="${K.paper}" stroke="${K.ink}" stroke-width="2.6"/><rect x="-2.6" y="-3" width="5.2" height="6.6" fill="${K.ink}"/></g>`;
    return s;
  }
  // trench shoulder cover following the shoulder tilt, cast shadow on the chest, ink-soaked edge
  function cape(c, P, F) {
    const at = F.at, w = P.torsoW || 1, lift = P.capeLift || 0;
    const pts = [at(-0.03, -14), at(0.0, -44 * w), at(0.24 - lift, -54 * w), at(0.29 - lift, -36 * w), at(0.25 - lift * 0.5, -14), at(0.27, 10), at(0.23, 30 * w), at(0.1, 46 * w), at(-0.02, 18)];
    const d = smooth(pts, true, 0.16);
    const sh = smooth([pts[3], pts[4], pts[5], pts[6], V.add(pts[6], V.mul(F.u, 6)), V.add(V.lerp(pts[5], pts[6], 0.5), V.mul(F.u, 15)), V.add(pts[5], V.mul(F.u, 11)), V.add(pts[4], V.mul(F.u, 5))], true, 0.14);
    const inner = `<path d="${poly([at(0.14, 22), at(0.14, 60), at(0.5, 60), at(0.5, 18)])}" fill="${c.pat('d20')}"/>` +
      `<path d="${smooth([at(0.12, 42), at(0.2, 30), at(0.27, 14), at(0.28, 44)], true)}" fill="${K.ink}"/>` +
      hemLine(c, [pts[2], pts[3], pts[4], pts[5], pts[6]], 8, 13, F.u.map((x) => -x));
    return `<g clip-path="url(#${c.clip(smooth([at(-0.02, -44), at(0.62, -44), at(0.62, 46), at(-0.02, 46)], true))})"><path d="${sh}" fill="${K.ink}"/></g>` +
      c.part(d, K.paper, H.OL, inner) + T([...at(0.02, -8), ...at(0.12, -34), ...at(0.27, -48)], 1.8, 'mid', K.ink, 'opacity="0.8"') +
      T([...at(0.03, 22), ...at(0.1, 44), ...at(0.22, 34)], 3.2, 'mid', K.ink);
  }
  // coat skirt / front flap from pose data: {pts, tone, tone40, spots, folds, hem, hemH, edge, lining, slit}
  function coatPart(c, S, seed) {
    if (!S) return '';
    const d = smooth(S.pts, true, S.k || 0.16);
    let inner = S.tone ? `<path d="${poly(S.tone)}" fill="${c.pat('d20')}"/>` : '';
    (S.tone40 || []).forEach((q) => { inner += `<path d="${smooth(q, true, 0.2)}" fill="${c.pat('d40')}"/>`; });
    (S.spots || []).forEach((q) => { inner += `<path d="${smooth(q, true, 0.18)}" fill="${K.ink}"/>`; });
    (S.folds || []).forEach((q) => { inner += T(q.slice(0, q.length === 9 ? 8 : 6), q[q.length - 1], 'mid', K.ink); });
    if (S.hem) inner += hemLine(c, S.hem, S.hemH || 16, seed || S.seed || 9);
    if (S.waist) { const [w0, w1] = S.waist, wm = V.lerp(w0, w1, 0.5); inner += `<path d="${smooth([V.add(w0, [-6, -6]), V.add(w1, [6, -6]), V.add(w1, [0, 9]), V.add(V.lerp(w0, w1, 0.75), [0, 14]), V.add(wm, [0, 8]), V.add(V.lerp(w0, w1, 0.25), [0, 15]), V.add(w0, [0, 8])], true, 0.1)}" fill="${K.ink}"/>`; }
    let s = c.part(d, K.paper, H.OL, inner) + (S.edge ? T(S.edge.slice(0, 6), S.edge[6] || 3.6, 'mid', K.ink) : '');
    // ink.900 lining where the hem turns over: designed wedges, outlined, with a paper fold-edge highlight
    (S.lining || []).forEach((q) => {
      s += `<path d="${smooth(q, true, 0.12)}" fill="${K.ink}" stroke="${K.ink}" stroke-width="4" stroke-linejoin="round" paint-order="stroke"/>` +
        T([...q[0], ...V.lerp(q[0], q[1], 0.5), ...q[1]], 2, 'mid', K.p50, 'opacity="0.75"');
    });
    return s;
  }

  const ORDER = ['behind', 'scarf', 'pony', 'aF', 'lF', 'lN', 'coat', 'front', 'torso', 'belt', 'cape', 'bandolier', 'spool', 'aN', 'head'];
  function side(c, P) {
    const F = frame(P); let s = '';
    const hd = P.head, hs = hd.s || 1.12, hg = (inner) => `<g transform="translate(${f(hd.p[0])} ${f(hd.p[1])}) rotate(${f(hd.rot || 0)}) scale(${hs})">${inner}</g>`;
    const coat = P.coat || P.skirt;
    const parts = {
      behind: () => (typeof P.behind === 'function' ? P.behind(c) : P.behind || ''),
      scarf: () => (P.scarf ? H.scarfTails(c, P.scarf, P.scarf2, P.scarfW ? P.scarfW[0] : 26, P.scarfO) : ''),
      pony: () => (P.pony ? H.pony(c, P.pony, 15) : ''),
      aF: () => H.arm(c, P.aF, P.hF || {}, { w0: P.aFw || 26, pref: P.aFpref, minBend: P.aFbend }),
      lF: () => H.leg(c, P.lF, { tw: 36, pref: P.lFpref }) + (P.sword && !P.swordOver ? H.swordHilt(c, P.sword.p, P.sword.deg, P.sword.len) : ''),
      lN: () => H.leg(c, P.lN, { pref: P.lNpref }),
      coat: () => coatPart(c, coat, 9),
      front: () => coatPart(c, P.front, 17),
      torso: () => torso(c, P, F),
      belt: () => belt(c, P, F),
      cape: () => cape(c, P, F),
      bandolier: () => H.bandolier(c, F.at(0.04, 26), F.at(0.9, -27), P.nNeedles || 5, { grey: P.grey }),
      spool: () => H.spool(c, F.at(0.9, -12), -6) + (P.sword && P.swordOver ? H.swordHilt(c, P.sword.p, P.sword.deg, P.sword.len) : ''),
      aN: () => H.arm(c, P.aN, P.hN || {}, { w0: P.aNw, pref: P.aNpref, minBend: P.aNbend }),
      head: () => hg(H.neck34(c)) + H.scarfWrap(c, P.wrap ? P.wrap.p : V.add(F.N, [4, -10]), P.wrap ? P.wrap.rot : 0, P.wrap || {}) +
        hg(H.head34(c, { expr: hd.expr, tilt: hd.tilt, neck: false, splash: hd.splash })) + (P.front2 || '')
    };
    (P.order || ORDER).forEach((k) => { s += parts[k] ? parts[k]() : ''; });
    return s;
  }
  Object.assign(H, { frame, hemLine, torso, belt, cape, coatPart, side, ORDER });
})(window.PN);
// ---- FULL-BODY POSES · local box 400 x 640, ground y = 600, pivot (ground contact centre) = (200, 600) ----
(function (PN) {
  'use strict';
  const H = PN._hk;
  const { K, f, T, V } = H;
  const POSES = {};

  // main 3/4 view: weight on the front (far) foot, near hand on the needle-sword grip, far hand holding 3 needles
  POSES.threeQuarter = {
    neck: [212, 186], hip: [201, 342], bow: 5, shTilt: 5, hipTilt: -4,
    head: { p: [219, 134], rot: 3, expr: 'calm', s: 1.04 },
    scarf: [[196, 190], [168, 200], [142, 220], [122, 250], [108, 288], [100, 328], [98, 368]], scarfW: [26, 13],
    scarf2: [[198, 192], [176, 208], [158, 232], [146, 262], [140, 294]],
    pony: [[190, 170], [170, 198], [158, 234], [152, 270], [154, 304]],
    aN: [[184, 212], [158, 268], [152, 318]], hN: { type: 'grip', rot: 8 }, aNpref: 1,
    aF: [[246, 208], [270, 266], [292, 304]], hF: { type: 'hold', rot: -24 }, aFpref: 1,
    lN: [[184, 346], [178, 462], [166, 572], [202, 588]],
    lF: [[218, 342], [236, 460], [246, 566], [284, 578]],
    sword: { p: [158, 324], deg: -146, len: 66 },
    order: ['behind', 'scarf', 'pony', 'aF', 'lN', 'lF', 'coat', 'front', 'torso', 'belt', 'bandolier', 'spool', 'aN', 'cape', 'head'],
    coat: {
      pts: [[176, 262], [167, 334], [150, 404], [128, 468], [104, 508], [138, 507], [178, 514], [222, 513], [252, 508], [262, 470], [252, 400], [246, 330], [242, 270]],
      tone: [[214, 300], [300, 300], [300, 520], [214, 520]],
      spots: [[[232, 318], [244, 380], [250, 440], [254, 500], [244, 504], [238, 440], [230, 378]]],
      folds: [[196, 326, 190, 414, 184, 504, 3.2], [164, 368, 148, 436, 134, 498, 2.4], [212, 342, 214, 420, 216, 506, 2.2]],
      hem: [[104, 508], [138, 507], [178, 514], [222, 513], [252, 508]],
      waist: [[168, 304], [246, 304]],
      lining: [[[104, 508], [124, 482], [132, 496], [150, 488], [146, 507], [118, 511]], [[172, 440], [168, 476], [166, 512], [178, 513], [177, 474]]]
    },
    front: {
      pts: [[240, 308], [256, 356], [272, 420], [292, 494], [276, 506], [252, 510], [244, 460], [238, 400], [234, 340]],
      tone: [[240, 300], [300, 300], [300, 520], [240, 520]],
      tone40: [[[262, 380], [286, 470], [292, 494], [276, 500], [268, 440]]],
      folds: [[250, 340, 258, 420, 262, 500, 2.4]],
      hem: [[252, 510], [276, 506], [292, 494]], hemH: 14,
      edge: [240, 312, 244, 410, 252, 508, 3.6],
      lining: [[[292, 494], [284, 474], [278, 492], [270, 506], [288, 504]]]
    }
  };

  function ground(c, cx, w) {
    return `<ellipse cx="${cx}" cy="600" rx="${w}" ry="${f(w * 0.16)}" fill="${K.ink}" opacity="0.22"/><ellipse cx="${cx}" cy="600" rx="${f(w * 0.62)}" ry="${f(w * 0.09)}" fill="${K.ink}" opacity="0.35"/>`;
  }

  // full(pose, opts) → SVG <g> string in the 400x640 local box. opts: {pitch, rough, ground:true, scaleHint}
  PN.heroKit.full = function (pose, opts) {
    opts = opts || {};
    pose = pose || 'threeQuarter';
    const pitch = opts.pitch || (opts.scaleHint ? Math.max(6, 3.2 / opts.scaleHint) : 6);
    const c = H.Ctx({ pitch, rough: opts.rough, seed: 7 });
    let body = '';
    if (pose === 'front') body = H.frontFig(c, opts);
    else if (pose === 'back') body = H.backFig(c, opts);
    else {
      const P = typeof pose === 'object' ? pose : POSES[pose];
      if (!P) throw new Error('heroKit.full: unknown pose ' + pose);
      const fig = H.side(c, P);
      const under = typeof P.under === 'function' ? P.under(c) : (P.under || '');
      // hurt: flat paper.50 echo with ink outline only, offset along the knockback vector
      let echo = '';
      const echoV = P.echo || (P.negative ? [-14, -4] : null);
      if (echoV) {
        c.defs.push(`<filter id="${c.id}echo" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="2.6" result="d"/><feFlood flood-color="${K.ink}"/><feComposite in2="d" operator="in" result="o"/><feFlood flood-color="${K.p50}"/><feComposite in2="SourceAlpha" operator="in" result="p"/><feMerge><feMergeNode in="o"/><feMergeNode in="p"/></feMerge></filter>`);
        echo = `<g transform="translate(${echoV[0]} ${echoV[1]})" filter="url(#${c.id}echo)" opacity="0.96">${fig}</g>`;
      }
      body = (opts.ground === false ? '' : ground(c, P.groundX || 200, P.groundW || 120)) + under + echo + `<g ${c.rough}>${fig}</g>` + (P.over ? P.over(c) : '');
    }
    return c.wrap(body);
  };
  // swap ink <-> paper in markup (negative flash, sprites); signal colours untouched
  H.negate = function (m) {
    return m.replace(/#121110|#2B2926/g, '@INK@').replace(/#F3EEE2|#FAF6EC|#D8D0C0/g, '#121110').replace(/@INK@/g, '#F3EEE2');
  };
  PN.heroKit.POSES = POSES;
  PN.heroKit.FULL_BOX = { w: 400, h: 640, pivot: [200, 600], groundY: 600, headUnit: 79 };
  H.POSES = POSES; H.ground = ground;
})(window.PN);
// ---- ACTION POSES A (v2): throw · run  (same 400x640 box; FX may overflow the box, see API) ----
(function (PN) {
  'use strict';
  const H = PN._hk, P = H.POSES;
  const { K, f, T, V, smooth, needle, splat } = H;

  // variable-width brush arc (ensō / slash). wfn(t)→width
  function brushArc(cx, cy, rx, ry, a0, a1, wfn, N) {
    N = N || 48; const L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = a0 + (a1 - a0) * t, x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
      const nx = Math.cos(a), ny = Math.sin(a) * rx / ry, l = Math.hypot(nx, ny), w = wfn(t) / 2;
      L.push([x + nx / l * w, y + ny / l * w]); R.push([x - nx / l * w, y - ny / l * w]);
    }
    return 'M ' + L.concat(R.reverse()).map((p) => f(p[0]) + ',' + f(p[1])).join(' L ') + ' Z';
  }
  H.brushArc = brushArc;
  const speed = (list) => list.map(([x0, y0, x1, w]) => T([x0, y0, (x0 + x1) / 2, y0 + 0.5, x1, y0], w, 'start', K.ink)).join('');
  H.speed = speed;

  // THROW · key-art lunge. Line of action: rear heel → spine → throwing hand (C-curve bowed up-left).
  // Near (right) arm throws; far (left) leg leads (opposition); shoulders drop 14° to the front, hips rise 6° → 20° counter-tilt.
  P.throw = {
    neck: [250, 236], hip: [198, 380], bow: 9, shTilt: 10, hipTilt: -12, groundX: 190, groundW: 175,
    head: { p: [268, 186], rot: 10, expr: 'focus', s: 1.04 },
    scarf: [[240, 232], [210, 214], [176, 204], [140, 214], [104, 234], [70, 238], [36, 226], [6, 234]], scarfW: [26, 13], scarfO: { swing: 22 },
    pony: [[232, 214], [206, 236], [184, 262], [166, 290], [154, 320]],
    aN: [[262, 256], [320, 256], [376, 222]], hN: { type: 'open', rot: -8 }, aNpref: 1, aNw: 36, aNbend: 26,
    aF: [[228, 248], [178, 282], [150, 318]], hF: { type: 'fist', rot: 0, mirror: true }, aFpref: -1, aFbend: 30,
    lF: [[222, 372], [334, 452], [302, 574], [346, 590]], lFpref: -1,
    lN: [[190, 384], [122, 470], [62, 556], [90, 590]], lNpref: -1,
    sword: { p: [172, 356], deg: -162, len: 66 },
    order: ['behind', 'scarf', 'pony', 'aF', 'coat', 'lF', 'front', 'lN', 'torso', 'belt', 'bandolier', 'spool', 'aN', 'cape', 'head'],
    coat: {
      pts: [[198, 300], [184, 352], [150, 382], [104, 400], [58, 410], [16, 420], [34, 440], [10, 466], [56, 470], [96, 482], [134, 494], [172, 486], [206, 468], [228, 430], [238, 380], [240, 330]],
      tone: [[120, 440], [240, 400], [240, 500], [120, 500]],
      tone40: [[[60, 430], [120, 440], [150, 470], [96, 476]]],
      spots: [[[180, 372], [150, 412], [120, 450], [136, 486], [156, 450], [186, 404]], [[206, 388], [238, 384], [238, 470], [214, 470], [198, 440]]],
      folds: [[184, 362, 132, 396, 66, 420, 3.2], [192, 392, 150, 432, 92, 462, 2.4], [200, 420, 176, 450, 150, 480, 2]],
      hem: [[56, 470], [96, 482], [134, 494], [172, 486], [206, 468]], hemH: 13,
      waist: [[176, 346], [240, 340]],
      lining: [[[16, 420], [52, 408], [92, 404], [58, 418], [34, 440]], [[10, 466], [36, 452], [60, 456], [48, 462], [56, 470]]]
    },
    front: {
      pts: [[234, 356], [264, 360], [284, 396], [292, 444], [268, 456], [240, 458], [226, 448], [226, 400]],
      tone: [[262, 350], [300, 350], [300, 470], [262, 470]],
      folds: [[244, 370, 250, 410, 250, 452, 2.4]],
      hem: [[226, 448], [240, 458], [268, 456], [292, 444]], hemH: 11,
      edge: [234, 360, 228, 404, 228, 448, 3.2],
      lining: [[[292, 444], [286, 424], [280, 442], [270, 456], [288, 452]]]
    },
    over(c) {
      // needles leaving the splayed fingers, ink threads back to the fingertips, 3 in flight
      return `<g fill="none" stroke="${K.ink}" stroke-width="1.6"><path d="M 414,194 C 426,186 434,182 444,176"/><path d="M 420,218 C 434,216 444,215 456,214"/><path d="M 412,238 C 424,244 434,248 446,252"/></g>` +
        needle(c, 444, 176, 494, 150, 3.8, 72) + needle(c, 456, 214, 514, 208, 4, 78) + needle(c, 446, 252, 496, 272, 3.6, 70) +
        `<g transform="translate(318 118) rotate(-10)"><text x="0" y="0" font-family="'Apple SD Gothic Neo','AppleGothic',sans-serif" font-size="44" font-weight="900" fill="${K.p50}" stroke="${K.ink}" stroke-width="8" paint-order="stroke" stroke-linejoin="round">슉!</text></g>`;
    }
  };

  // RUN · 12° lean, opposite swing (near leg + far arm forward / near arm + far leg back), coat hem lags and curls
  P.run = {
    neck: [228, 206], hip: [196, 352], bow: 5, shTilt: 6, hipTilt: -10, groundX: 180, groundW: 120,
    head: { p: [244, 156], rot: 8, expr: 'focus', s: 1.04 },
    scarf: [[216, 200], [184, 188], [148, 180], [112, 190], [78, 204], [44, 200], [10, 186]], scarfW: [26, 13], scarfO: { swing: 20 },
    pony: [[208, 186], [182, 198], [158, 212], [134, 226], [112, 244]],
    aN: [[206, 228], [164, 274], [176, 318]], hN: { type: 'fist', rot: 0 }, aNpref: 1, aNbend: 70,
    aF: [[240, 222], [262, 276], [304, 254]], hF: { type: 'fist', rot: -30 }, aFpref: -1,
    lN: [[190, 356], [262, 418], [254, 516], [294, 526]], lNpref: -1,
    lF: [[208, 352], [178, 458], [120, 548], [150, 590]], lFpref: -1,
    sword: { p: [166, 326], deg: -168, len: 66 },
    order: ['behind', 'scarf', 'pony', 'aF', 'lF', 'coat', 'front', 'lN', 'torso', 'belt', 'bandolier', 'spool', 'aN', 'cape', 'head'],
    coat: {
      pts: [[194, 290], [180, 330], [140, 356], [90, 372], [46, 380], [20, 376], [30, 396], [14, 414], [58, 420], [104, 430], [146, 442], [178, 438], [202, 414], [218, 374], [226, 326]],
      tone: [[130, 400], [230, 370], [230, 452], [130, 452]],
      spots: [[[176, 350], [148, 386], [120, 418], [138, 438], [160, 400], [186, 368]]],
      folds: [[180, 336, 126, 364, 60, 384, 3], [190, 362, 150, 398, 96, 420, 2.2]],
      hem: [[58, 420], [104, 430], [146, 442], [178, 438], [202, 414]], hemH: 12,
      waist: [[172, 320], [230, 316]],
      lining: [[[20, 376], [54, 372], [90, 380], [56, 386], [30, 396]], [[14, 414], [40, 402], [70, 408], [52, 414], [58, 420]]]
    },
    front: {
      pts: [[212, 326], [240, 332], [262, 366], [276, 404], [256, 418], [228, 420], [212, 396], [204, 356]],
      tone: [[240, 320], [290, 320], [290, 430], [240, 430]],
      hem: [[212, 396], [228, 420], [256, 418], [276, 404]], hemH: 11,
      folds: [[224, 340, 232, 374, 236, 410, 2.4]],
      lining: [[[276, 404], [266, 386], [262, 404], [252, 416], [270, 414]]]
    },
    under: speed([[40, 250, 150, 3], [10, 300, 120, 2.4], [70, 470, 150, 3], [30, 520, 110, 2.2]]),
    over(c) {
      const puff = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${K.paper}" stroke="${K.ink}" stroke-width="2.6"/>`;
      return puff(118, 594, 9) + puff(100, 588, 6) + puff(86, 596, 4);
    }
  };
})(window.PN);
// ---- ACTION POSES B (v2): dash · hurt · levelup ----
(function (PN) {
  'use strict';
  const H = PN._hk, P = H.POSES;
  const { K, f, T, V, smooth, needle, splat } = H;

  // DASH · 일식 보법: the rear half (coat + rear leg) unravels into ONE long tapered ink stroke with a cyan thread core.
  // Front half (hat, face, lead leg) stays crisp. Sword stays sheathed. No weapon arc.
  P.dash = {
    neck: [300, 322], hip: [236, 404], bow: 4, shTilt: 10, hipTilt: -4, groundX: 300, groundW: 90,
    head: { p: [324, 276], rot: 24, expr: 'focus', s: 1.04 },
    scarf: [[290, 318], [252, 306], [210, 298], [166, 298], [122, 304], [80, 300], [40, 308]], scarfW: [24, 12],
    scarf2: [[290, 322], [258, 320], [224, 324], [192, 332], [166, 344]],
    pony: [[282, 302], [254, 310], [226, 320], [198, 332], [172, 346]],
    aN: [[290, 340], [244, 368], [198, 376]], hN: { type: 'open', rot: 172, mirror: true }, aNpref: 1,
    aF: [[314, 332], [348, 372], [382, 394]], hF: { type: 'relax', rot: -10 }, aFpref: -1,
    lF: [[244, 400], [324, 452], [322, 562], [366, 580]], lFpref: -1,
    order: ['behind', 'scarf', 'pony', 'aF', 'lF', 'front', 'torso', 'belt', 'bandolier', 'aN', 'cape', 'head'],
    front: {
      pts: [[244, 380], [270, 392], [300, 424], [318, 468], [298, 482], [268, 486], [244, 470], [232, 420]],
      tone: [[268, 380], [330, 380], [330, 500], [268, 500]],
      hem: [[244, 470], [268, 486], [298, 482], [318, 468]], hemH: 12,
      folds: [[250, 394, 264, 434, 270, 474, 2.4]],
      edge: [244, 384, 238, 430, 244, 470, 3.2]
    },
    under(c) {
      const mid = `${c.id}dm`, r = PN.rng(29);
      // dry-brush breaks (비백): real gaps cut through the stroke with a mask
      let cuts = '';
      [[210, 372, 120, 372, 20, 408, -60, 452, 3.2], [226, 420, 140, 424, 40, 448, -40, 480, 2.6], [200, 398, 110, 402, 0, 434, -70, 468, 1.6]].forEach((q) => { cuts += T(q.slice(0, 8), q[8], 'mid', '#000'); });
      c.defs.push(`<mask id="${mid}" maskUnits="userSpaceOnUse" x="-200" y="200" width="700" height="400"><rect x="-200" y="200" width="700" height="400" fill="#fff"/>${cuts}</mask>`);
      let s = `<g mask="url(#${mid})">`;
      // coat back + rear leg → one stroke, widest at the hip, tapering behind (~1.5 figure lengths)
      s += T([262, 402, 170, 372, 60, 404, -70, 462], 118, 'start', K.ink);
      s += T([240, 440, 196, 474, 140, 506, 56, 530], 38, 'start', K.ink) + T([150, 500, 110, 520, 70, 536, 10, 548], 9, 'start', K.ink);
      // split bristles at the tail
      s += T([40, 426, 0, 440, -40, 452, -110, 474], 10, 'start', K.ink) + T([60, 452, 10, 468, -30, 482, -90, 506], 7, 'start', K.ink) + T([80, 404, 30, 404, -10, 414, -80, 424], 5, 'start', K.ink);
      s += `</g>`;
      // paper dry streaks inside the wet body of the stroke
      [[232, 388, 150, 380, 70, 400, 1.8], [236, 430, 160, 432, 90, 446, 1.4]].forEach(([x0, y0, x1, y1, x2, y2, w]) => { s += T([x0, y0, x1, y1, x2, y2], w, 'mid', K.ch1L, 'opacity="0.9"'); });
      // cyan thread through the stroke's core (ink · cyan · glow sandwich), curling where it re-knots at the tail
      const th = [268, 398, 170, 392, 60, 422, -60, 462];
      s += T(th, 5.4, 'end', K.ink) + T(th, 3, 'end', K.ally) + T(th, 1, 'end', K.allyG);
      s += `<path d="M -60,462 C -84,470 -96,452 -84,442 C -74,434 -64,446 -74,454" fill="none" stroke="${K.ink}" stroke-width="4.4" stroke-linecap="round"/><path d="M -60,462 C -84,470 -96,452 -84,442 C -74,434 -64,446 -74,454" fill="none" stroke="${K.ally}" stroke-width="2.2" stroke-linecap="round"/>`;
      for (let i = 0; i < 10; i++) s += `<circle cx="${f(-110 + r() * 120)}" cy="${f(420 + r() * 100)}" r="${f(1.2 + r() * 3.2)}" fill="${K.ink}"/>`;
      s += H.speed([[380, 250, 440, 2.4], [396, 300, 460, 2], [400, 520, 456, 2.2]]);
      return s;
    }
  };

  // HURT · knocked back: flat paper echo offset 14px along the knockback vector, ink splats on the coat, coral damage number
  P.hurt = {
    neck: [184, 222], hip: [206, 366], bow: -6, shTilt: -8, hipTilt: 4, groundX: 196, groundW: 120,
    head: { p: [176, 172], rot: -14, expr: 'hurt', tilt: -8, s: 1.04 },
    scarf: [[172, 214], [204, 196], [240, 184], [274, 182], [304, 192], [328, 210], [344, 234]], scarfW: [24, 13],
    scarf2: [[174, 218], [202, 214], [230, 216], [256, 226], [274, 242]],
    pony: [[166, 202], [190, 188], [214, 180], [238, 180], [260, 186]],
    aN: [[174, 242], [128, 262], [100, 236]], hN: { type: 'open', rot: 150, mirror: true }, aNpref: -1,
    aF: [[206, 236], [240, 212], [276, 190]], hF: { type: 'open', rot: -20 }, aFpref: 1,
    lN: [[196, 368], [160, 470], [142, 572], [178, 590]], lNpref: -1,
    lF: [[216, 364], [268, 446], [292, 534], [330, 544]], lFpref: -1,
    sword: { p: [164, 342], deg: -128, len: 66 },
    order: ['behind', 'scarf', 'pony', 'aF', 'lF', 'lN', 'coat', 'front', 'torso', 'belt', 'bandolier', 'spool', 'aN', 'cape', 'head'],
    coat: {
      pts: [[182, 300], [172, 340], [166, 400], [152, 470], [148, 488], [178, 498], [214, 500], [252, 490], [290, 472], [326, 444], [306, 426], [268, 386], [240, 346], [230, 310]],
      tone: [[232, 330], [330, 330], [330, 510], [232, 510]],
      spots: [[[242, 352], [270, 396], [302, 432], [292, 450], [262, 414], [240, 378]]],
      folds: [[200, 346, 204, 420, 204, 496, 3], [220, 356, 250, 420, 270, 480, 2.4]],
      hem: [[152, 482], [178, 498], [214, 500], [252, 490], [290, 472]], hemH: 14,
      waist: [[176, 318], [240, 322]],
      lining: [[[326, 444], [300, 432], [306, 452], [292, 470], [316, 462]], [[148, 488], [158, 470], [170, 486], [178, 498]]]
    },
    echo: [-14, -4],
    over(c) {
      return splat(232, 282, 14, 14, 41, K.ink, -2.6) + splat(262, 408, 11, 10, 5, K.ink, -2.8) + splat(198, 454, 9, 8, 13, K.ink, -2.2) +
        `<g transform="translate(262 126) rotate(8)"><text x="0" y="0" font-family="'Helvetica Neue','Apple SD Gothic Neo',sans-serif" font-size="40" font-weight="900" font-style="italic" fill="${K.hostile}" stroke="${K.ink}" stroke-width="7" paint-order="stroke" stroke-linejoin="round">-18</text></g>`;
    }
  };

  // LEVEL-UP · cyan → paper ensō in one stroke around the hero, needles rising
  P.levelup = {
    neck: [206, 190], hip: [200, 348], bow: -3, shTilt: -3, hipTilt: 3, groundX: 200, groundW: 120,
    head: { p: [210, 140], rot: -6, expr: 'victory', s: 1.04 },
    scarf: [[196, 186], [172, 170], [154, 148], [146, 122], [152, 96], [170, 76], [194, 66]], scarfW: [24, 12],
    scarf2: [[198, 190], [178, 180], [164, 162], [160, 142], [166, 124]],
    pony: [[188, 172], [166, 184], [148, 196], [132, 212], [122, 232]],
    aN: [[182, 212], [140, 262], [112, 294]], hN: { type: 'open', rot: 30 }, aNpref: 1,
    aF: [[238, 208], [276, 258], [304, 288]], hF: { type: 'open', rot: 40, mirror: true }, aFpref: -1,
    lN: [[186, 350], [166, 466], [152, 574], [190, 590]],
    lF: [[214, 346], [240, 464], [256, 568], [294, 580]],
    sword: { p: [158, 318], deg: -146, len: 66 },
    capeLift: 0.04,
    order: ['behind', 'scarf', 'pony', 'aF', 'lN', 'lF', 'coat', 'torso', 'belt', 'bandolier', 'spool', 'aN', 'cape', 'head'],
    coat: {
      pts: [[176, 262], [168, 330], [148, 400], [116, 462], [86, 486], [120, 496], [160, 500], [204, 504], [244, 498], [284, 500], [318, 486], [294, 452], [268, 400], [250, 336], [238, 270]],
      tone: [[226, 308], [320, 308], [320, 510], [226, 510]],
      spots: [[[244, 330], [262, 390], [286, 450], [300, 474], [286, 470], [264, 420], [248, 370]]],
      folds: [[198, 330, 190, 420, 186, 500, 3], [160, 370, 136, 430, 110, 482, 2.4], [224, 350, 244, 420, 262, 496, 2.4]],
      hem: [[86, 486], [120, 496], [160, 500], [204, 504], [244, 498], [284, 500], [318, 486]], hemH: 14,
      waist: [[166, 304], [246, 304]],
      lining: [[[86, 486], [104, 462], [116, 480], [120, 496]], [[318, 486], [300, 462], [292, 480], [284, 500]]]
    },
    under(c) {
      const ens = H.brushArc(204, 318, 186, 186, 2.3, 2.3 + Math.PI * 1.82, (t) => t < 0.02 ? 6 : 34 * Math.pow(1 - t, 0.55) + 3, 64);
      const ensC = H.brushArc(204, 318, 186, 186, 2.3, 2.3 + Math.PI * 1.0, (t) => 30 * Math.pow(1 - t * 0.55, 0.9), 40);
      return `<path d="${ens}" fill="${K.paper}" stroke="${K.ink}" stroke-width="5" stroke-linejoin="round"/><path d="${ensC}" fill="${K.ally}"/>` +
        `<path d="${H.brushArc(204, 318, 186, 186, 2.35, 2.3 + Math.PI * 0.9, (t) => 7 * (1 - t) + 1, 30)}" fill="${K.allyG}"/>` +
        T([60, 250, 90, 160, 160, 120], 1.4, 'mid', K.ink, 'opacity="0.7"') + T([300, 150, 360, 210, 384, 300], 1.4, 'mid', K.ink, 'opacity="0.6"');
    },
    over(c) {
      const rnd = PN.rng(19); let s = '';
      for (let i = 0; i < 16; i++) { const x = 70 + rnd() * 270, y = 90 + rnd() * 420, r = 1.6 + rnd() * 3; s += `<rect x="${f(x)}" y="${f(y)}" width="${f(r * 2)}" height="${f(r * 2)}" transform="rotate(${f(rnd() * 90)} ${f(x + r)} ${f(y + r)})" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.4"/>`; }
      [[92, 200, -12], [316, 214, 14], [64, 330, -4], [344, 346, 8]].forEach(([x, y, a]) => {
        const r = (a - 90) * Math.PI / 180; s += needle(c, x - Math.cos(r) * 30, y - Math.sin(r) * 30, x, y, 3.2, 26);
      });
      return s;
    }
  };
})(window.PN);
// ---- FRONT / BACK turnaround views (v2) · same 400x640 box, centre x=200, ground 600 ----
(function (PN) {
  'use strict';
  const H = PN._hk;
  const { K, f, pt, T, V, smooth, poly } = H;
  const X = (x) => 200 + x;
  const XP = (P) => P.map(([x, y]) => [X(x), y]);

  function bootFront(c, an, s) {
    const x = an[0], y = an[1];
    const d = `M ${x - 11},${y - 6} C ${x - 14},${y + 6} ${x - 16 * s - 4},${y + 14} ${x - 4 * s},${y + 22} C ${x + 6 * s},${y + 26} ${x + 16 * s},${y + 22} ${x + 16},${y + 12} C ${x + 14},${y + 4} ${x + 12},${y - 2} ${x + 11},${y - 6} Z`;
    return c.part(d, K.ink, H.OL) + T([x - 8, y + 16, x - 2 * s, y + 20, x + 8, y + 18], 1.6, 'mid', K.p50, 'opacity="0.7"') + T([x - 6, y + 2, x - 7, y + 8, x - 6 * s, y + 13], 1.6, 'mid', K.p50, 'opacity="0.5"');
  }
  function bootBack(c, an) {
    const x = an[0], y = an[1];
    return c.part(`M ${x - 12},${y - 8} C ${x - 14},${y + 6} ${x - 13},${y + 16} ${x - 8},${y + 21} L ${x + 8},${y + 21} C ${x + 13},${y + 16} ${x + 14},${y + 6} ${x + 12},${y - 8} Z`, K.ink, H.OL) +
      `<path d="M ${x - 9},${y + 16} L ${x + 9},${y + 16}" stroke="${K.p50}" stroke-width="1.6" opacity="0.6"/>`;
  }
  const legFront = (c, hp, kn, an, s, back) => H.leg(c, [hp, kn, an, V.add(an, [0.1, 2])], { tw: 38, noFoot: true, pref: s, minBend: 3 }) + (back ? bootBack(c, an) : bootFront(c, an, s));

  // shared coat: torso + skirt + shoulder cover. back=true → centre seam + vent instead of the 사선 여밈 front
  function coat(c, back) {
    let s = '';
    // skirt: the overlapping (viewer-right) panel is longer → asymmetric hem with a step at the overlap line
    const skirt = XP([[-42, 306], [-52, 350], [-72, 424], [-94, 500], [-60, 508], [-20, 510], [4, 509], [16, 518], [52, 516], [90, 508], [72, 424], [53, 350], [42, 306]]);
    const hem = back ? XP([[-94, 500], [-60, 508], [-20, 510], [16, 512], [52, 512], [90, 508]]) : XP([[-94, 500], [-60, 508], [-20, 510], [4, 509]]);
    let sk = `<path d="${poly(XP([[30, 300], [110, 300], [110, 530], [30, 530]]))}" fill="${c.pat('d20')}"/>` +
      `<path d="${smooth(XP([[52, 330], [68, 400], [84, 488], [74, 496], [58, 410], [45, 340]]), true)}" fill="${K.ink}"/>` +
      T([X(-26), 322, X(-36), 410, X(-46), 500], 2.4, 'mid', K.ink) + T([X(-52), 364, X(-62), 432, X(-74), 496], 2, 'mid', K.ink) + T([X(36), 330, X(44), 420, X(52), 508], 2.2, 'mid', K.ink) +
      H.hemLine(c, hem, 16, back ? 21 : 9) +
      `<path d="${smooth(XP([[-46, 300], [46, 300], [48, 322], [24, 331], [0, 325], [-22, 333], [-48, 322]]), true, 0.12)}" fill="${K.ink}"/>`;
    if (back) {
      sk += `<path d="${smooth(XP([[-3, 414], [-12, 506], [0, 514], [12, 506], [3, 414]]), true, 0.2)}" fill="${K.ink}"/>` + T([X(0), 350, X(0), 388, X(0), 416], 2.2, 'mid', K.ink);
    } else {
      // overlap panel: its own ink-soaked hem (lower), overlap edge line, side slit with black lining
      sk += H.hemLine(c, XP([[4, 511], [16, 518], [52, 516], [90, 508]]), 17, 15);
      sk += `<path d="${smooth(XP([[4, 324], [10, 420], [16, 518], [8, 516], [0, 420], [-4, 330]]), true, 0.2)}" fill="${c.pat('d40')}"/>`;
      sk += `<path d="${smooth(XP([[60, 426], [66, 462], [76, 504], [64, 510], [60, 470]]), true, 0.2)}" fill="${K.ink}"/>`;
    }
    s += c.part(smooth(skirt, true, 0.15), K.paper, H.OL, sk);
    if (!back) s += T([X(-3), 318, X(4), 420, X(16), 518], 3.6, 'mid', K.ink) + T([X(60), 424, X(64), 462, X(72), 506], 2.4, 'mid', K.ink) +
      `<path d="${smooth(XP([[16, 518], [12, 508], [22, 505], [34, 510], [28, 518]]), true, 0.2)}" fill="${K.ink}"/>`;
    // torso
    const torso = smooth(XP([[-16, 184], [-50, 196], [-56, 226], [-50, 262], [-42, 300], [-44, 342], [0, 348], [44, 342], [42, 300], [50, 262], [56, 226], [50, 196], [16, 184]]), true, 0.17);
    let ti = `<path d="${poly(XP([[24, 186], [80, 186], [80, 350], [24, 350]]))}" fill="${c.pat('d20')}"/>` +
      `<path d="${smooth(XP([[48, 236], [54, 262], [44, 300], [48, 342], [36, 344], [32, 312], [40, 280], [42, 250]]), true)}" fill="${K.ink}"/>` +
      T([X(-30), 280, X(-26), 300, X(-30), 318], 1.6, 'mid', K.ink, 'opacity="0.7"');
    if (back) ti += T([X(0), 196, X(1), 260, X(0), 330], 2.4, 'mid', K.ink) + T([X(-36), 290, X(0), 296, X(36), 290], 1.6, 'mid', K.ink, 'opacity="0.7"');
    s += c.part(torso, K.paper, H.OL, ti);
    if (!back) {
      // 사선 여밈: vest V, ink.900 깃 bands, paper.50 동정 trim, overlap edge from the collar to the belt
      s += `<path d="${poly(XP([[-12, 188], [14, 188], [-4, 226]]))}" fill="${K.ink7}" stroke="${K.ink}" stroke-width="2.2"/>`;
      s += T([X(-14), 188, X(-10), 204, X(-6), 218], 8, 'flat', K.ink);
      s += T([X(17), 187, X(4), 226, X(-14), 264], 10, 'flat', K.ink) + T([X(13), 186, X(2), 212, X(-6), 236], 3, 'start', K.p50);
      s += T([X(-14), 262, X(-8), 284, X(-3), 304], 3.4, 'mid', K.ink);
      s += `<path d="${smooth(XP([[-12, 262], [-4, 300], [8, 300], [0, 280]]), true, 0.2)}" fill="${c.pat('d40')}"/>`;
    }
    // belt
    s += `<path d="M ${X(-41)},302 C ${X(-20)},308 ${X(20)},308 ${X(41)},302 L ${X(43)},315 C ${X(20)},321 ${X(-20)},321 ${X(-43)},315 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="3"/>`;
    if (!back) s += `<rect x="${X(-11)}" y="302.6" width="14" height="15" rx="2" fill="${K.paper}" stroke="${K.ink}" stroke-width="2.6"/><rect x="${X(-6.6)}" y="306.6" width="5.2" height="7" fill="${K.ink}"/>`;
    // shoulder cover + cast shadow + ink-soaked edge
    const capeP = XP([[-18, 184], [-60, 196], [-68, 230], [-52, 246], [-26, 250], [0, 260], [26, 250], [52, 246], [68, 230], [60, 196], [18, 184]]);
    s += `<path d="${smooth(XP([[-48, 246], [-26, 250], [0, 260], [26, 250], [48, 246], [46, 253], [26, 258], [0, 268], [-26, 258], [-46, 253]]), true, 0.2)}" fill="${K.ink}"/>`;
    const capeIn = `<path d="${poly(XP([[30, 180], [90, 180], [90, 262], [30, 262]]))}" fill="${c.pat('d20')}"/>` + H.hemLine(c, [capeP[2], capeP[3], capeP[4], capeP[5], capeP[6], capeP[7], capeP[8]], 8, back ? 25 : 13);
    s += c.part(smooth(capeP, true, 0.16), K.paper, H.OL, capeIn);
    if (!back) s += `<path d="${poly(XP([[-12, 188], [-2, 222], [14, 188]]))}" fill="${K.ink7}"/>` + T([X(17), 187, X(8), 206, X(0), 224], 9, 'flat', K.ink) + T([X(13), 186, X(7), 198, X(2), 212], 2.8, 'start', K.p50) + T([X(-14), 188, X(-10), 200, X(-6), 212], 7, 'flat', K.ink);
    return s;
  }

  H.frontFig = function (c, o) {
    let s = H.ground(c, 200, 110) + `<g ${c.rough}>`;
    // scarf falls BEHIND the viewer-right shoulder (wearer's left) and trails diagonally down
    s += H.scarfTails(c, XP([[16, 192], [46, 204], [74, 222], [100, 248], [120, 280], [134, 316], [142, 350]]), XP([[16, 196], [44, 210], [68, 230], [86, 254], [98, 280]]), 24, { twA: [0.5], twB: [0.62] });
    s += H.swordHilt(c, [X(-48), 322], -150, 64);
    s += legFront(c, [X(-24), 346], [X(-29), 466], [X(-32), 572], -1) + legFront(c, [X(24), 346], [X(30), 466], [X(34), 572], 1);
    s += coat(c, false);
    s += H.bandolier(c, [X(42), 202], [X(-36), 332], 5, {});
    s += H.spool(c, [X(-30), 328], 4);
    // arms angled 6–8° off the body with an elbow break
    s += H.arm(c, [[X(-54), 210], [X(-74), 286], [X(-78), 360]], { type: 'relax', rot: 6 }, { pref: 1 });
    s += H.arm(c, [[X(54), 210], [X(74), 286], [X(80), 358]], { type: 'hold', rot: -14, mirror: true }, { pref: -1 });
    s += `<g transform="translate(${X(0)} 134) scale(1.04)">${H.headFront(c, {})}</g>`;
    s += H.scarfWrap(c, [X(-2), 188], 0, {});
    return s + '</g>';
  };

  H.backFig = function (c, o) {
    let s = H.ground(c, 200, 110) + `<g ${c.rough}>`;
    s += legFront(c, [X(-24), 346], [X(-30), 466], [X(-34), 572], -1, true) + legFront(c, [X(24), 346], [X(28), 466], [X(32), 572], 1, true);
    s += H.arm(c, [[X(-54), 210], [X(-72), 288], [X(-78), 360]], { type: 'relax', rot: -8, mirror: true }, { pref: 1 });
    s += H.arm(c, [[X(54), 210], [X(72), 288], [X(76), 360]], { type: 'relax', rot: 8 }, { pref: -1 });
    s += coat(c, true);
    // strap over the shoulder → hip, sword across the lower back (hilt out at viewer right)
    s += `<path d="${poly(XP([[-40, 198], [-28, 196], [44, 330], [32, 334]]))}" fill="${K.ink}" stroke="${K.ink}" stroke-width="3"/>` + T([X(-38), 200, X(4), 266, X(42), 328], 1.4, 'mid', K.p50, 'opacity="0.5"');
    s += `<g transform="translate(${X(-66)} 344) rotate(-16)"><path d="M 0,-5 L 110,-5 L 110,5 L 0,5 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="3"/>${T([4, -2, 50, -2.6, 104, -2], 1.4, 'mid', K.p50, 'opacity="0.6"')}<path d="M -6,-4 L 0,-5 L 0,5 L -6,4 Z" fill="${K.paper}" stroke="${K.ink}" stroke-width="2"/></g>`;
    s += H.swordHilt(c, [X(40), 316], -16, 66);
    s += `<g transform="translate(${X(0)} 134) scale(1.04)">${H.headBack(c, {})}</g>`;
    s += H.scarfWrap(c, [X(0), 190], 0, { ends: false, knot: false });
    s += H.pony(c, XP([[0, 170], [-1, 204], [2, 240], [-2, 276], [1, 312]]), 17);
    // scarf tails hang from the nape over the viewer-left shoulder blade, trailing diagonally down
    s += H.scarfTails(c, XP([[-2, 194], [-22, 214], [-44, 244], [-64, 280], [-80, 320], [-90, 362], [-94, 402]]), XP([[0, 196], [-16, 222], [-32, 252], [-44, 282], [-50, 310]]), 24, { twA: [0.52], twB: [0.6] });
    return s + '</g>';
  };
})(window.PN);
// ---- IN-GAME SPRITE (v2) · 1x px units · box 96x96 · pivot (48,60) = hitbox centre (r15) · 64px tall (hat top y=11, feet y=75) ----
// part A: constants, ring, scarf ribbon, legs, coat, head
(function (PN) {
  'use strict';
  const H = PN._hk;
  const { K, f, T } = H;
  const SP = { w: 96, h: 96, pivot: [48, 60], r: 15, height: 64, top: -49, feet: 15, shadow: { cy: 8.25, rx: 15, ry: 6.5 }, ring: { cy: 8.25, rx: 24, ry: 10.3 }, frames: { idle: 6, run: 8, throw: 4, hurt: 3 }, fps: { idle: 8, run: 14, throw: 16, hurt: 12 }, eye: [1, -31] };
  const IL = `stroke="${K.ink}" stroke-width="0.6" stroke-linejoin="round"`;
  const P2 = (p) => f(p[0]) + ',' + f(p[1]);

  // ring: 4 arcs of 0.7 rad on the ground ellipse, rotated to aim (sandwich: ink · deep · ally · glow)
  function ring(aim) {
    let o = '';
    const R = SP.ring;
    for (let k = 0; k < 4; k++) {
      const a0 = aim + k * Math.PI / 2 - 0.35, a1 = a0 + 0.7;
      const p = (a) => f(R.rx * Math.cos(a)) + ',' + f(R.cy + R.ry * Math.sin(a));
      o += `M ${p(a0)} A ${R.rx} ${R.ry} 0 0 1 ${p(a1)} `;
    }
    return `<g fill="none" stroke-linecap="round"><path d="${o}" stroke="${K.ink}" stroke-width="5.2" opacity="0.8"/><path d="${o}" stroke="${K.allyD}" stroke-width="4.2"/><path d="${o}" stroke="${K.ally}" stroke-width="2.6"/><path d="${o}" stroke="${K.allyG}" stroke-width="0.7" opacity="0.9"/></g>`;
  }
  // single scarf ribbon: 4.6px at the knot → 2px, swallowtail, deep underside strip, glow core, paper stitch
  function ribbon(pts) {
    const n = pts.length, L = [], R = [], W = pts.map((_, i) => 4.8 - 2.8 * i / (n - 1));
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = W[i] / 2;
      L.push([p[0] + nx * w, p[1] + ny * w]); R.push([p[0] - nx * w, p[1] - ny * w]);
    });
    const e = pts[n - 1], q = pts[n - 2], ul = Math.hypot(e[0] - q[0], e[1] - q[1]), ux = (e[0] - q[0]) / ul, uy = (e[1] - q[1]) / ul;
    const tip = [[L[n - 1][0] + ux * 2.6, L[n - 1][1] + uy * 2.6], [e[0] + ux * 0.2, e[1] + uy * 0.2], [R[n - 1][0] + ux * 1.8, R[n - 1][1] + uy * 1.8]];
    const d = H.smooth(L.concat(tip, R.slice().reverse()), true, 0.12);
    const deep = H.smooth(R.map((p, i) => [p[0] * 0.55 + pts[i][0] * 0.45, p[1] * 0.55 + pts[i][1] * 0.45]).concat(R.slice().reverse()), true, 0.12);
    const glow = L.map((p, i) => [p[0] * 0.55 + pts[i][0] * 0.45, p[1] * 0.55 + pts[i][1] * 0.45]);
    return `<path d="${d}" fill="${K.ally}" ${IL}/><path d="${deep}" fill="${K.allyD}"/>` +
      `<path d="${H.smooth(glow.slice(0, -1), false, 0.12)}" fill="none" stroke="${K.allyG}" stroke-width="0.6" stroke-linecap="round" opacity="0.95"/>` +
      `<path d="M ${P2(pts[1])} L ${P2(pts[2])}" stroke="${K.p50}" stroke-width="0.7" stroke-linecap="round" opacity="0.9"/>`;
  }
  // 2-bone IK (knee forward = +x); returns knee
  function knee(hp, an, l1, l2) {
    const dx = an[0] - hp[0], dy = an[1] - hp[1], d = Math.min(l1 + l2 - 0.01, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
    const k = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
    return [hp[0] + Math.cos(a - k) * l1, hp[1] + Math.sin(a - k) * l1];
  }
  // leg: ink.700 trouser, 3 white 행전 bands on the shin, short black boot; toe = foot pitch (deg, + = toe down)
  function leg(hp, an, toe, back, L) {
    L = L || [7.8, 7.6];
    const kn = knee(hp, an, L[0], L[1]), sx = an[0] - kn[0], sy = an[1] - kn[1], sl = Math.hypot(sx, sy), ux = sx / sl, uy = sy / sl, nx = -uy, ny = ux;
    const w = back ? 3.6 : 4.1;
    let s = `<path d="M ${P2(hp)} L ${P2(kn)} L ${P2(an)}" fill="none" stroke="${K.ink}" stroke-width="${f(w + 1)}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M ${P2(hp)} L ${P2(kn)} L ${P2(an)}" fill="none" stroke="${K.ink7}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    [0.46, 0.66, 0.86].forEach((t) => { const x = kn[0] + sx * t, y = kn[1] + sy * t, hw = w / 2 + 0.3; s += `<path d="M ${f(x - nx * hw)},${f(y - ny * hw)} L ${f(x + nx * hw)},${f(y + ny * hw)}" stroke="${back ? K.p300 : K.p50}" stroke-width="1.15"/>`; });
    const r = (toe || 0) * Math.PI / 180, c = Math.cos(r), si = Math.sin(r), P = (x, y) => f(an[0] + x * c - y * si) + ',' + f(an[1] + x * si + y * c);
    s += `<path d="M ${P(-2.1, -1)} L ${P(1.8, -1)} L ${P(2.3, 0.4)} L ${P(4.8, 1)} L ${P(5.1, 2.4)} L ${P(-2.5, 2.4)} Z" fill="${K.ink}"/>` +
      `<path d="M ${P(-2.2, 2.05)} L ${P(4.9, 2.05)}" stroke="${K.p50}" stroke-width="0.6" opacity="0.8"/>`;
    return s;
  }
  // coat skirt: back-swept triangle (silhouette #2). g = {bx, by: back tip, fx, fy: front hem, lift: lining size}
  function coat(g) {
    const { bx, by, fx, fy } = g, lift = g.lift || 0;
    const d = `M -10.4,-9 L 10.8,-9 C 11.4,-3 ${f(fx - 0.2)},${f(fy - 4)} ${f(fx)},${f(fy)} C ${f(fx - 5)},${f(fy + 1)} ${f(fx - 10)},${f(fy + 1.4)} ${f((fx + bx) / 2)},${f((fy + by) / 2 + 0.8)} C ${f(bx + 6)},${f(by + 0.4)} ${f(bx + 2.4)},${f(by)} ${f(bx)},${f(by)} C ${f(bx + 4.6)},${f(by - 6)} -13.2,-2.6 -10.4,-9 Z`;
    let s = `<path d="${d}" fill="${K.paper}"/>`;
    s += `<path d="M 5.4,-9 L 10.2,-9 C 10.8,-3 ${f(fx - 0.2)},${f(fy - 4)} ${f(fx)},${f(fy)} L ${f(fx - 5.6)},${f(fy + 0.8)} Z" fill="${K.p300}"/>`;
    // ink-soaked hem band + one pleat + overlap edge
    s += `<path d="M ${f(fx)},${f(fy)} C ${f(fx - 5)},${f(fy + 1)} ${f(fx - 10)},${f(fy + 1.4)} ${f((fx + bx) / 2)},${f((fy + by) / 2 + 0.8)} C ${f(bx + 6)},${f(by + 0.4)} ${f(bx + 2.4)},${f(by)} ${f(bx)},${f(by)} L ${f(bx + 2.2)},${f(by - 1.1)} C ${f(bx + 7)},${f(by - 0.6)} ${f((fx + bx) / 2 - 2)},${f((fy + by) / 2 - 0.1)} ${f(fx - 6)},${f(fy - 0.2)} L ${f(fx)},${f(fy - 0.8)} Z" fill="${K.ink}"/>`;
    s += `<path d="M -3.4,-7.6 L ${f((fx + bx) / 2 + 1)},${f((fy + by) / 2 - 1)}" stroke="${K.ink}" stroke-width="0.8" opacity="0.8"/><path d="M 7.8,-8.4 L ${f(fx - 2.6)},${f(fy - 1.2)}" stroke="${K.ink}" stroke-width="0.8"/>`;
    // ink.900 lining where the back hem turns over
    s += `<path d="M ${f(bx)},${f(by)} L ${f(bx + 4.4 + lift)},${f(by - 3.4 - lift * 0.8)} L ${f(bx + 5.6 + lift * 0.6)},${f(by - 0.6)} Z" fill="${K.ink}" ${IL}/>`;
    return s;
  }
  // head: short crown, diagonal brim shadow with a 2×2 eye glint, near-cheek scar, reduced hair
  function head(tilt, o) {
    o = o || {};
    let s = `<path d="M -4.6,-33.8 C -6.6,-31.8 -7.2,-29.6 -6.8,-27.4 L -5.2,-27.6 C -5.2,-29.6 -4.4,-31.4 -3.2,-33 Z" fill="${K.ink}"/>`;
    s += `<path d="M -6.2,-27.6 C -7.8,-25.4 -8.4,-23.4 -8.4,-21.6" fill="none" stroke="${K.ink}" stroke-width="1.2" stroke-linecap="round"/>`;
    s += `<path d="M -2.6,-34.6 L 8.6,-34.6 L 9.4,-31.6 L 11.2,-29.6 L 10,-28.8 L 10.1,-27.9 L 8.6,-26.4 C 7.4,-25.2 6.2,-24.8 5.2,-24.9 C 2.8,-25.2 0.4,-26.4 -1.4,-28.4 C -2.6,-29.8 -2.8,-32 -2.6,-34.6 Z" fill="${K.paper}"/>`;
    // diagonal shadow: far brow (upper right) → near cheekbone (lower left); leaves the lower-front face lit
    s += `<path d="M -3,-35 L 9,-35 L 9,-32.4 L 4.6,-30.4 L 1,-28.6 L -3,-27 Z" fill="${K.ink}"/>`;
    s += `<rect x="${f(SP.eye[0] - 1)}" y="${f(SP.eye[1] - 1)}" width="2" height="2" fill="${o.glint || K.p50}"/>`;
    s += `<path d="M 7.4,-30.9 L 8.5,-30.9" stroke="${K.ink}" stroke-width="1.2"/><path d="M 10.6,-29 L 9.8,-28.7" stroke="${K.ink}" stroke-width="0.6"/><path d="M 8.2,-27.5 L 9.9,-27.8" stroke="${K.ink}" stroke-width="0.7"/>`;
    s += `<path d="M 1.6,-27.2 L 3.8,-28.1" stroke="${K.ink}" stroke-width="0.9"/>`;
    // hat: brim 40 × 11, crown lowered 25% (6.4 → top y≈-48.5)
    s += `<g transform="rotate(${f(tilt)} 1 -39)"><ellipse cx="1" cy="-38.6" rx="20" ry="5.6" transform="rotate(6 1 -38.6)" fill="${K.ink}"/>` +
      `<ellipse cx="1" cy="-38.6" rx="16.4" ry="4.4" transform="rotate(6 1 -38.6)" fill="none" stroke="${K.p50}" stroke-width="0.6" opacity="0.5"/><ellipse cx="1" cy="-38.6" rx="12.2" ry="3.2" transform="rotate(6 1 -38.6)" fill="none" stroke="${K.p50}" stroke-width="0.5" opacity="0.4"/>` +
      `<path d="M -17.4,-38.8 A 19.3 5.1 6 0 1 -2,-43.6" fill="none" stroke="${K.p50}" stroke-width="1.35" stroke-linecap="round" opacity="0.95"/>` +
      `<path d="M -4.2,-40.6 L -3.6,-46.7 A 4.2 1.2 0 0 1 4.8,-46.7 L 5.4,-40.6 Z" fill="${K.ink}"/><ellipse cx="0.6" cy="-46.7" rx="4.2" ry="1.2" fill="${K.ink7}"/>` +
      `<path d="M -2.3,-46 L -1.2,-46 L -1.6,-41.2 L -2.8,-41.2 Z" fill="${K.p50}" opacity="0.85"/></g>`;
    return s;
  }
  Object.assign(H, { SP, spriteRing: ring, sRibbon: ribbon, sLeg: leg, sCoat: coat, sHead: head, sKnee: knee, IL });
})(window.PN);
// ---- IN-GAME SPRITE (v2) part B: frame assembly + export ----
(function (PN) {
  'use strict';
  const H = PN._hk, SP = H.SP, IL = H.IL;
  const { K, f, T } = H;
  const TAU = Math.PI * 2;

  // throw-arm overlay in arm-local coords (origin shoulder, +x = aim). mode: ready|draw|wind|snap|follow
  function armOverlay(mode) {
    const J = { ready: [[1.4, 7], [7.6, 9.6]], draw: [[3.4, 6.6], [8.4, 1.4]], wind: [[-4.4, -2.4], [-7.4, -8.6]], snap: [[6.2, 0.8], [12.6, 0]], follow: [[5.6, 3.2], [10.4, 6.4]] }[mode];
    const [e, w] = J;
    // tapered sleeve: 4.4 at the shoulder → 3.4 elbow → 2.5 wrist
    const seg = (a, b, w0, w1) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l; return `M ${f(a[0] + nx * w0 / 2)},${f(a[1] + ny * w0 / 2)} L ${f(b[0] + nx * w1 / 2)},${f(b[1] + ny * w1 / 2)} L ${f(b[0] - nx * w1 / 2)},${f(b[1] - ny * w1 / 2)} L ${f(a[0] - nx * w0 / 2)},${f(a[1] - ny * w0 / 2)} Z`; };
    let s = `<path d="${seg([0, 0], e, 4.4, 3.4)}" fill="${K.paper}" ${IL}/><circle cx="${f(e[0])}" cy="${f(e[1])}" r="1.7" fill="${K.paper}"/><path d="${seg(e, w, 3.4, 2.5)}" fill="${K.paper}" ${IL}/>`;
    const cx = w[0] - (w[0] - e[0]) * 0.2, cy = w[1] - (w[1] - e[1]) * 0.2;
    s += `<path d="M ${f(cx)},${f(cy)} L ${f(w[0])},${f(w[1])}" stroke="${K.ink}" stroke-width="3.2" stroke-linecap="butt"/>`;
    const needle = (x, y, a, l) => { const r = a * Math.PI / 180, x1 = x + Math.cos(r) * l, y1 = y + Math.sin(r) * l; return `<path d="M ${f(x)},${f(y)} L ${f(x1)},${f(y1)}" stroke="${K.ink}" stroke-width="2.4" stroke-linecap="round"/><path d="M ${f(x)},${f(y)} L ${f(x + Math.cos(r) * l * 0.68)},${f(y + Math.sin(r) * l * 0.68)}" stroke="${K.p50}" stroke-width="1" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y)}" r="1" fill="${K.ally}" stroke="${K.ink}" stroke-width="0.6"/>`; };
    if (mode === 'ready' || mode === 'draw') s += needle(w[0] + 1, w[1], mode === 'draw' ? -70 : 6, 8);
    if (mode === 'wind') s += needle(w[0], w[1], -40, 8);
    // glove: fist with a thumb nub
    s += `<circle cx="${f(w[0] + 0.7)}" cy="${f(w[1])}" r="2.2" fill="${K.ink}"/><circle cx="${f(w[0] + 0.4)}" cy="${f(w[1] - 1.8)}" r="0.9" fill="${K.ink}"/>`;
    if (mode === 'snap') s += `<path d="M ${f(w[0] + 2)},${f(w[1] - 1.8)} l 3.4,-1.6 M ${f(w[0] + 2.6)},${f(w[1])} l 3.8,0 M ${f(w[0] + 2)},${f(w[1] + 1.8)} l 3.4,1.6" stroke="${K.ink}" stroke-width="1.5" stroke-linecap="round"/>` +
      T([w[0] + 22, w[1] - 0.6, w[0] + 12, w[1] - 0.4, w[0] + 5, w[1]], 2.2, 'start', K.ally) + `<path d="M ${f(w[0] + 22)},${f(w[1] - 2)} L ${f(w[0] + 31)},${f(w[1] - 0.6)} L ${f(w[0] + 22)},${f(w[1] + 1)} Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="1"/>`;
    if (mode === 'follow') s += T([w[0] - 16, w[1] - 16, w[0] - 2, w[1] - 12, w[0] + 12, w[1] - 2], 2.2, 'end', K.ink) + T([w[0] - 14, w[1] - 13, w[0] - 2, w[1] - 9.6, w[0] + 9, w[1] - 1], 0.7, 'end', K.p50);
    return s;
  }

  // per-state pose: bob, squash, lean, legs (world, un-leaned), coat hem, scarf spine
  function pose(state, fr) {
    const N = SP.frames[state] || 1, i = ((fr % N) + N) % N, ph = i / N * TAU;
    const P = { bob: 0, sx: 1, sy: 1, lean: 0, tilt: 0, hand: 0 };
    if (state === 'run') {
      const A = [[11.6, 12.4, -6], [7.4, 12.6, 0], [2.4, 12.6, 0], [-3.6, 12, 16], [-11.4, 11, 32], [-12.6, 8, 42], [-7, 5.4, 18], [4.4, 6.4, -14]];
      const nearA = A[i], farA = A[(i + 4) % 8];
      P.bob = [0, 0.6, -1.5, -1, 0, 0.6, -1.5, -1][i];
      P.sy = [0.94, 1, 1.04, 1, 0.94, 1, 1.04, 1][i]; P.sx = [1.03, 1, 0.98, 1, 1.03, 1, 0.98, 1][i];
      P.lean = 12; P.tilt = -3;
      P.legN = [[1.6, -2.6 + P.bob], [nearA[0], nearA[1]], nearA[2]]; P.legF = [[-1.6, -2.6 + P.bob], [farA[0] - 0.6, farA[1] - 0.3], farA[2]]; P.legL = [9.2, 9];
      const lag = Math.sin((i - 1) / 8 * TAU * 2) * 3;   // hem swings ±3, one frame behind the legs
      P.coat = { bx: -22.4 + lag * 0.4, by: -0.6 + lag, fx: 7.6, fy: 0.8 - lag * 0.3, lift: 2 };
      P.tail = []; for (let k = 0; k < 7; k++) { const t = k / 6; P.tail.push([-5 - k * 4.4, -26 - Math.sin(t * 2.2) * 1.2 + Math.sin(ph * 2 - k * 1.1) * 1.6 * t]); }
    } else {
      const hurt = state === 'hurt', thr = state === 'throw';
      P.bob = state === 'idle' ? -(1 - Math.cos(ph)) * 0.5 : 0;
      P.lean = hurt ? [-9, -6, -3][i % 3] : thr ? [2, -2, 6, 5][i % 4] : 0;
      P.tilt = hurt ? [-14, -10, -5][i % 3] : 0;
      P.legN = [[1.8, P.bob], [4.8, 12.6], 0]; P.legF = [[-1.8, P.bob], [-3.8, 12.4], 0];
      if (hurt) { P.legN = [[1.8, 0], [6.6, 12.4], -8]; P.legF = [[-1.8, 0], [-4.6, 12.6], 0]; }
      const fl = state === 'idle' ? Math.sin(ph) * 0.8 : hurt ? -1.2 : thr ? [0, 0.6, 1.4, 1] [i % 4] : 0;
      P.coat = { bx: -22.8 - fl, by: 11.4 - fl * 0.6, fx: 12.6, fy: 8.8 };
      // idle: one-frame S-wave that differs per frame (±2px)
      P.tail = []; for (let k = 0; k < 8; k++) {
        const t = k / 7, wv = Math.sin(ph - k * 0.95) * 2 * t;
        if (hurt) P.tail.push([-4 + k * 3.4, -27 - k * 2.4 + wv * 0.6]);
        else P.tail.push([-5 - k * 3.2 + t * t * 1.5, -26 + t * t * 8.4 + wv * 0.35 + (thr ? -t * 3 : 0), wv]);
      }
      if (!hurt) P.tail = P.tail.map(([x, y, wv]) => [x + (wv || 0) * 0.4, y + (wv || 0) * 0.55]);
    }
    return P;
  }

  function body(state, fr) {
    const P = pose(state, fr);
    const legs = H.sLeg(P.legF[0], P.legF[1], P.legF[2], true, P.legL) + H.sLeg(P.legN[0], P.legN[1], P.legN[2], false, P.legL);
    let up = '';
    // far arm (behind the body)
    up += `<path d="M 4.4,-22.4 L 7.4,-22.8 L 9.6,-13.4 L 7.4,-13 Z" fill="${K.p300}"/><path d="M 7.4,-22.8 L 9.6,-13.4" stroke="${K.ink}" stroke-width="0.6"/><circle cx="8.6" cy="-12.3" r="1.7" fill="${K.ink}"/>`;
    up += H.sRibbon(P.tail);
    up += H.sCoat(P.coat);
    // torso coat + shoulder cover + (smaller) vest V + bandolier (3 needles) + thin belt
    up += `<path d="M -9.4,-25 C -11.4,-20 -11.4,-14 -10.4,-9.4 L 10.4,-9.4 C 11.6,-14 12,-19 10,-24.6 C 5,-26.6 -4,-26.8 -9.4,-25 Z" fill="${K.paper}"/><path d="M 5.4,-25.6 C 8.4,-25.8 10.6,-24.4 11,-22 C 11.8,-17 11.4,-12.6 10.4,-9.4 L 6,-9.4 Z" fill="${K.p300}"/>`;
    up += `<path d="M 3,-25.8 L 5.6,-25.8 L 4.5,-22.2 Z" fill="${K.ink7}"/>`;
    up += `<path d="M -10.8,-24.8 C -12.6,-22 -12.8,-19.4 -12,-17.4 C -6.6,-16.4 -1,-16.8 2.4,-17.6 C 6,-17 9.8,-17.4 12.2,-18.9 C 12.4,-22 11.2,-24.4 9.4,-25.4 C 3,-27.6 -4.4,-27.4 -10.8,-24.8 Z" fill="${K.paper}" ${IL}/>` +
      `<path d="M -12,-17.4 C -6.6,-16.4 -1,-16.8 2.4,-17.6 C 6,-17 9.8,-17.4 12.2,-18.9 L 12.2,-18.3 C 9.2,-16.9 5.6,-16.5 2.4,-17 C -1,-16.2 -6.6,-15.9 -11.8,-16.8 Z" fill="${K.ink}"/><path d="M 5.8,-24.8 C 8.8,-24.2 10.8,-22.2 11,-19.2 L 7.2,-18 C 7.6,-20.4 7.2,-23 5.8,-24.8 Z" fill="${K.p300}"/>`;
    up += `<path d="M 8.6,-23.1 L 9.7,-22.3 L -7,-9.8 L -8.1,-10.6 Z" fill="${K.ink}"/>` +
      [0.26, 0.48, 0.7].map((t) => { const x = 9 - t * 16.4, y = -22.8 + t * 12.6; return `<path d="M ${f(x)},${f(y)} l 2.2,-3" stroke="${K.ink}" stroke-width="2" stroke-linecap="round"/><path d="M ${f(x)},${f(y)} l 1.9,-2.6" stroke="${K.p50}" stroke-width="0.85" stroke-linecap="round"/><circle cx="${f(x + 2.3)}" cy="${f(y - 3.1)}" r="0.9" fill="${K.ally}" stroke="${K.ink}" stroke-width="0.5"/>`; }).join('');
    up += `<path d="M -10.4,-9.9 C -3,-9.3 4,-9.3 10.9,-9.9 L 10.9,-8.7 C 4,-8.1 -3,-8.1 -10.4,-8.7 Z" fill="${K.ink}"/><rect x="2.6" y="-10.1" width="2.2" height="2.2" fill="${K.paper}" stroke="${K.ink}" stroke-width="0.5"/>`;
    // scarf wrap + knot (結) + 2 short knot ends
    up += `<path d="M -6.4,-28.6 C -1.6,-26.2 3.8,-26.2 8.4,-28.2 L 8.8,-24.2 C 4,-22.2 -1.4,-22.4 -6.6,-24.6 Z" fill="${K.ally}" ${IL}/><path d="M -6.6,-25.6 C -1.4,-23.6 4,-23.4 8.8,-25.4 L 8.8,-24.2 C 4,-22.2 -1.4,-22.4 -6.6,-24.6 Z" fill="${K.allyD}"/>` +
      `<path d="M -3,-26.4 L -1.6,-26" stroke="${K.p50}" stroke-width="0.6"/><path d="M 1,-25.6 L 2.4,-25.5" stroke="${K.p50}" stroke-width="0.6"/>` +
      `<path d="M 5.6,-23.6 L 5.2,-19.6 L 6.6,-20.2 L 7.8,-18.8 L 7.8,-23.2 Z" fill="${K.ally}" ${IL}/><circle cx="6.6" cy="-24.4" r="1.9" fill="${K.ally}" ${IL}/><path d="M 6,-25.2 L 7.2,-25.4" stroke="${K.allyG}" stroke-width="0.6"/>`;
    up += H.sHead(P.tilt, {});
    if (state === 'hurt' && fr % 3 === 2) up += `<g fill="${K.ink}"><circle cx="4" cy="-14" r="1.3"/><circle cx="6.6" cy="-11.6" r="0.8"/><circle cx="-2" cy="-2" r="1.1"/><circle cx="1" cy="1.4" r="0.6"/><circle cx="-7" cy="3" r="0.9"/></g>`;
    return { legs, up, P };
  }

  // sprite(state, frame, opts) → SVG <g> in the 96x96 box. opts: {ring:true, aim:0 (rad), shadow:true, halo:true, xray:false, xrayOnly:false, flip:false, mode, noOutline}
  PN.heroKit.sprite = function (state, frame, opts) {
    opts = opts || {}; state = state || 'idle'; frame = frame || 0;
    const c = H.Ctx({ pitch: 3 });
    const id = c.id, halo = opts.halo !== false;
    c.defs.push(`<filter id="${id}ol" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.1" result="a"/><feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="b0"/><feOffset in="b0" dx="0.75" dy="0.75" result="b"/><feMerge result="ol"><feMergeNode in="a"/><feMergeNode in="b"/></feMerge><feFlood flood-color="${K.ink}"/><feComposite in2="ol" operator="in" result="ink"/>` +
      (halo ? `<feMorphology in="ol" operator="dilate" radius="1.5" result="h"/><feFlood flood-color="${K.p50}"/><feComposite in2="h" operator="in" result="paper"/><feMerge><feMergeNode in="paper"/><feMergeNode in="ink"/><feMergeNode in="SourceGraphic"/></feMerge>` : `<feMerge><feMergeNode in="ink"/><feMergeNode in="SourceGraphic"/></feMerge>`) + `</filter>`);
    c.defs.push(`<filter id="${id}xr" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="d"/><feMorphology in="SourceAlpha" operator="dilate" radius="0.4" result="e"/><feComposite in="d" in2="e" operator="out" result="r"/><feFlood flood-color="${K.ally}"/><feComposite in2="r" operator="in"/></filter>`);
    const B = body(state, frame), P = B.P;
    let aim = opts.aim || 0; if (opts.flip) { aim = Math.PI - aim; aim = Math.atan2(Math.sin(aim), Math.cos(aim)); }
    const armMode = state === 'throw' ? ['draw', 'wind', 'snap', 'follow'][frame % 4] : (opts.mode || 'ready');
    const arm = `<g transform="translate(-2.6 -21) rotate(${f((state === 'throw' ? aim * 0.35 : aim) * 180 / Math.PI)})">${H.sArm(armMode)}</g>`;
    // lean the whole upper body around the hip; squash/stretch anchored at the feet
    let fig = `${B.legs}<g transform="translate(0 ${f(P.bob)}) rotate(${P.lean} 0 1)">${B.up}${arm}</g>`;
    if (P.sx !== 1 || P.sy !== 1) fig = `<g transform="translate(0 15) scale(${P.sx} ${P.sy}) translate(0 -15)">${fig}</g>`;
    if (state === 'hurt' && frame % 3 < 2) fig = H.negate(fig);
    let s = '';
    if (opts.shadow !== false) s += `<ellipse cx="0" cy="${SP.shadow.cy}" rx="${SP.shadow.rx}" ry="${SP.shadow.ry}" fill="${K.ink}" opacity="0.3"/>`;
    if (opts.ring !== false) s += H.spriteRing(aim);
    if (!opts.xrayOnly) s += opts.noOutline ? fig : `<g filter="url(#${id}ol)">${fig}</g>`;
    if (opts.xray || opts.xrayOnly) s += `<g filter="url(#${id}xr)">${fig}</g>`;
    const flip = opts.flip ? ' scale(-1 1)' : '';
    return c.wrap(`<g transform="translate(${SP.pivot[0]} ${SP.pivot[1]})${flip}">${s}</g>`);
  };
  PN.heroKit.SPRITE = SP;
  H.sArm = armOverlay; H.sBody = body;
})(window.PN);
// ---- HUD PORTRAIT (v2) · box 160x160 · centre/pivot (80,80) · frame circle r=74 · designed for 84–160 px ----
// Framing zoomed toward the face (brim top cropped); each expression differs by SHAPE (head angle, hat height, eyes, mouth, hand), not only by background.
(function (PN) {
  'use strict';
  const H = PN._hk;
  const { K, f, T, V, smooth, splat } = H;
  const PB = { w: 160, h: 160, pivot: [80, 80], r: 74, exprs: ['calm', 'focus', 'hurt', 'lowhp', 'awakened', 'victory'], headScale: 1.72 };
  // per-expression shape parameters: head rotation, brim tilt, hat drop, shadow shift, head offset
  const EX = {
    calm: { rot: 0, tilt: 2, hatDy: 0, shDy: -1.5, dx: 0, dy: 0 },
    focus: { rot: 7, tilt: 7, hatDy: 3.4, shDy: 3.4, dx: 2, dy: 2 },
    hurt: { rot: -10, tilt: -10, hatDy: -1, shDy: 0, dx: -6, dy: -2 },
    lowhp: { rot: 8, tilt: 4, hatDy: 1.2, shDy: 1.2, dx: 0, dy: 4 },
    awakened: { rot: -3, tilt: 1, hatDy: 0, shDy: -1.5, dx: 0, dy: -1 },
    victory: { rot: -4, tilt: -8, hatDy: -3, shDy: -8, shRot: -5, dx: -13, dy: 0 }
  };

  // portrait(expr, opts) → SVG <g> in the 160x160 box. opts: {frame:true, bg:true}
  PN.heroKit.portrait = function (expr, opts) {
    opts = opts || {}; expr = EX[expr] ? expr : 'calm';
    const E = EX[expr], S = PB.headScale;
    const c = H.Ctx({ pitch: 4.2, rough: 0.6, seed: 11 });
    const clip = c.clip(`M 80,6 A 74 74 0 1 1 79.9,6 Z`);
    let bg = '';
    if (opts.bg !== false) {
      bg = `<rect width="160" height="160" fill="${K.paper}"/>` + PN.halftone(0, 0, 160, 160, 5, (x, y) => { const d = Math.hypot(x - 96, y - 70); return Math.max(0, Math.min(1.9, (d - 40) / 30)); }, K.ink1, 45);
      if (expr === 'awakened') bg += [0, 1, 2].map((i) => `<path d="${H.brushArc(80, 88, 60 + i * 8, 60 + i * 8, -2.6 + i * 0.7, -0.4 + i * 0.9, (t) => 1 + 5 * Math.sin(Math.PI * t))}" fill="${K.ally}" stroke="${K.ink}" stroke-width="1.6"/>`).join('');
      if (expr === 'hurt') bg = `<rect width="160" height="160" fill="${K.ink}"/>` + splat(132, 44, 12, 12, 7, K.p50) + splat(20, 112, 8, 8, 3, K.p50) + `<path d="M 160,20 L 112,64 L 124,70 L 92,104 M 0,60 L 30,76 L 22,84 L 48,100" fill="none" stroke="${K.p50}" stroke-width="2.4"/>`;
      if (expr === 'focus') bg += PN.speedLines(104, 90, 56, 130, 60, 13, K.ink, 0, Math.PI * 2, 0.012);
      if (expr === 'lowhp') bg += `<rect width="160" height="160" fill="${c.pat('d20')}"/>`;
      if (expr === 'victory') { const r = PN.rng(5); for (let i = 0; i < 12; i++) { const x = 16 + r() * 60, y = 16 + r() * 60, q = 2 + r() * 3; bg += `<path d="M ${f(x)},${f(y - q * 2)} L ${f(x + q * 0.6)},${f(y - q * 0.6)} L ${f(x + q * 2)},${f(y)} L ${f(x + q * 0.6)},${f(y + q * 0.6)} L ${f(x)},${f(y + q * 2)} L ${f(x - q * 0.6)},${f(y + q * 0.6)} L ${f(x - q * 2)},${f(y)} L ${f(x - q * 0.6)},${f(y - q * 0.6)} Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.2"/>`; } }
    }
    // head frame: face centre (head-local ≈ (11, 2)) lands near the disc centre
    const hx = 98 - 11 * S + E.dx, hy = 72 + E.dy, g = (m) => `<g transform="translate(${f(hx)} ${f(hy)}) rotate(${E.rot} 11 4) scale(${S})">${m}</g>`;
    let fig = '';
    // collar / coat shoulder just visible at the bottom of the disc
    fig += c.part('M -10,176 C 4,156 24,146 50,144 L 124,144 C 140,148 156,158 170,176 Z', K.paper, 5, `<path d="M 110,140 L 170,140 L 170,180 L 118,180 Z" fill="${c.pat('d20')}"/>` + H.hemLine(c, [[-10, 170], [20, 154], [48, 148]], expr === 'lowhp' ? 18 : 7, 3, [0.4, -1]));
    fig += `<path d="M 66,146 L 84,178 L 102,146 Z" fill="${K.ink7}" stroke="${K.ink}" stroke-width="2"/>` + T([62, 146, 72, 162, 82, 180], 9, 'flat', K.ink) + T([104, 146, 96, 162, 88, 180], 8, 'flat', K.ink);
    fig += g(H.neck34(c, true));
    fig += `<g transform="translate(${f(hx + 8 * S)} ${f(hy + 41 * S)}) rotate(${E.rot * 0.5}) scale(1.45)">${H.scarfWrap(c, [0, 0], 0, { ends: false })}</g>`;
    fig += g(H.head34(c, { expr, tilt: E.tilt, neck: false, bold: 1.25, beads: false, hatDy: E.hatDy, shadowDy: E.shDy, shadowRot: E.shRot, rings: 2, sheen: true }));
    if (expr === 'victory') fig += H.hand(c, [151, 93], -128, 'point', { scale: 1.1 });
    if (expr === 'hurt') fig += splat(108, 124, 5, 7, 12, K.ink, 1.2);
    let s = `<g clip-path="url(#${clip})">${bg}<g ${c.rough}>${fig}</g></g>`;
    if (opts.frame !== false) {
      s += `<circle cx="80" cy="80" r="74" fill="none" stroke="${K.ink}" stroke-width="6"/><circle cx="80" cy="80" r="78.5" fill="none" stroke="${K.p50}" stroke-width="2.4"/>`;
      if (expr === 'lowhp') s += `<circle cx="80" cy="80" r="74" fill="none" stroke="${K.hostileD}" stroke-width="2.4" stroke-dasharray="14 6"/>`;
      if (expr === 'awakened') s += `<circle cx="80" cy="80" r="74" fill="none" stroke="${K.ally}" stroke-width="2.2" stroke-dasharray="6 5"/>`;
    }
    return c.wrap(s);
  };
  PN.heroKit.PORTRAIT = PB;
  H.PORTRAIT_EX = EX;
})(window.PN);
// ---- placement helpers (pivot-anchored) ----
(function (PN) {
  'use strict';
  const HK = PN.heroKit, f = PN._hk.f;
  // sprite pivot (hitbox centre) lands on (x,y); s = display scale (1 = 64 px tall)
  HK.placeSprite = function (state, frame, x, y, s, opts) {
    s = s || 1; const P = HK.SPRITE.pivot;
    return `<g transform="translate(${f(x - P[0] * s)} ${f(y - P[1] * s)}) scale(${s})">${HK.sprite(state, frame, opts)}</g>`;
  };
  // full-body ground-contact pivot (200,600) lands on (x,y)
  HK.placeFull = function (pose, x, y, s, opts) {
    s = s || 1; const P = HK.FULL_BOX.pivot;
    return `<g transform="translate(${f(x - P[0] * s)} ${f(y - P[1] * s)}) scale(${s})">${HK.full(pose, Object.assign({ scaleHint: s }, opts || {}))}</g>`;
  };
  // portrait centred on (cx,cy) with outer diameter `size` px (frame included)
  HK.placePortrait = function (expr, cx, cy, size, opts) {
    const s = (size || 84) / 160;
    return `<g transform="translate(${f(cx - 80 * s)} ${f(cy - 80 * s)}) scale(${f(s)})">${HK.portrait(expr, opts)}</g>`;
  };
  HK.version = '2.0';
})(window.PN);
