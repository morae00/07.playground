// Paper Noir Comic — shared helpers (hand-authored SVG generation helpers)
window.PN = window.PN || {};
(function (PN) {
  PN.C = {
    ink: '#0E0E10', inkSoft: '#2A2A2E', paper: '#F3EEE2', paperShade: '#D8D0C0',
    env1: '#B3A68C', env1Light: '#D9CFBA', env1Deep: '#857863',
    env2: '#8E97A8', env3: '#97A396', env4: '#A08C78', env5: '#968DA0',
    player: '#00A8C6', playerDeep: '#007C94', playerGlow: '#CFF6FF',
    hostile: '#EF5B4F', warn: '#D88D16', reward: '#86B82D', elite: '#805AD5'
  };
  const f = (n) => Math.round(n * 100) / 100;

  // Tapered brush stroke along a quadratic/cubic Bezier. mode: mid | start | end | flat
  PN.taper = function (p, w, mode = 'mid', fill = PN.C.ink, extra = '') {
    const N = 18, L = [], R = [];
    const cubic = p.length === 8;
    for (let i = 0; i <= N; i++) {
      const t = i / N; let x, y, dx, dy;
      if (cubic) {
        const [x0, y0, x1, y1, x2, y2, x3, y3] = p, u = 1 - t;
        x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
        y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
        dx = 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2);
        dy = 3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2);
      } else {
        const [x0, y0, x1, y1, x2, y2] = p, u = 1 - t;
        x = u * u * x0 + 2 * u * t * x1 + t * t * x2; y = u * u * y0 + 2 * u * t * y1 + t * t * y2;
        dx = 2 * u * (x1 - x0) + 2 * t * (x2 - x1); dy = 2 * u * (y1 - y0) + 2 * t * (y2 - y1);
      }
      const len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
      let k = mode === 'mid' ? Math.pow(Math.sin(Math.PI * t), 0.7) : mode === 'start' ? (1 - t) : mode === 'end' ? t : 1;
      if (mode === 'start') k = Math.pow(1 - t, 0.8);
      const hw = Math.max(0.15, w * k / 2);
      L.push([x + nx * hw, y + ny * hw]); R.push([x - nx * hw, y - ny * hw]);
    }
    const pts = L.concat(R.reverse());
    return `<path d="M${pts.map((q) => f(q[0]) + ',' + f(q[1])).join(' L')} Z" fill="${fill}" ${extra}/>`;
  };
  PN.tapers = function (list, fill, extra) { return list.map((s) => PN.taper(s.slice(0, -2), s[s.length - 2], s[s.length - 1], fill, extra)).join(''); };

  // Variable-size halftone dots over a box. rfn(x,y)-> radius (0 = none)
  PN.halftone = function (x0, y0, x1, y1, pitch, rfn, fill = PN.C.ink, angle = 45) {
    const out = []; const a = angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + pitch;
    for (let u = -R; u <= R; u += pitch) for (let v = -R; v <= R; v += pitch) {
      const x = cx + u * ca - v * sa, y = cy + u * sa + v * ca;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const r = rfn(x, y); if (r > 0.25) out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`);
    }
    return `<g fill="${fill}">${out.join('')}</g>`;
  };

  // Radial speed lines (wedges) from a focus
  PN.speedLines = function (cx, cy, r0, r1, n, seed, fill = PN.C.ink, a0 = 0, a1 = Math.PI * 2, wMax = 0.018) {
    let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = a0 + (a1 - a0) * rnd(), w = wMax * (0.3 + rnd()), ri = r0 + (r1 - r0) * 0.35 * rnd();
      const p1 = [cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1], p2 = [cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1];
      const p0 = [cx + Math.cos(a) * ri, cy + Math.sin(a) * ri];
      out.push(`<path d="M${f(p0[0])},${f(p0[1])} L${f(p1[0])},${f(p1[1])} L${f(p2[0])},${f(p2[1])} Z"/>`);
    }
    return `<g fill="${fill}">${out.join('')}</g>`;
  };

  // Ink splatter blob cluster
  PN.splat = function (cx, cy, r, n, seed, fill = PN.C.ink) {
    let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const out = [`<circle cx="${cx}" cy="${cy}" r="${r * 0.5}"/>`];
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = r * (0.5 + rnd() * 1.4), rr = r * (0.06 + rnd() * 0.22);
      out.push(`<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d)}" r="${f(rr)}"/>`);
      if (rnd() > 0.5) out.push(PN.taper([cx, cy, cx + Math.cos(a) * d * 0.6, cy + Math.sin(a) * d * 0.6, cx + Math.cos(a) * d, cy + Math.sin(a) * d], rr * 1.6, 'end', fill));
    }
    return `<g fill="${fill}">${out.join('')}</g>`;
  };

  PN.rng = function (seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

  // Shared <defs>: patterns & filters
  PN.defs = function () {
    const C = PN.C;
    return `
    <filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="roughS" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.4" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="4"/><feColorMatrix type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.07  0 0 0 0 0.06  1.3 0 0 0 -0.52"/></filter>
    <filter id="glowC" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    <pattern id="dotS" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.5" cy="2.5" r="1.0" fill="${C.ink}"/></pattern>
    <pattern id="dotM" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.5" cy="2.5" r="1.55" fill="${C.ink}"/></pattern>
    <pattern id="dotL" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.5" cy="2.5" r="2.05" fill="${C.ink}"/></pattern>
    <pattern id="dotCy" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.5" cy="2.5" r="1.5" fill="${C.playerDeep}"/></pattern>
    <pattern id="dotSep" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3" cy="3" r="1.6" fill="${C.env1Deep}"/></pattern>
    <pattern id="dotEnv" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.5" cy="2.5" r="1.5" fill="${C.env1Deep}"/></pattern>
    <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)"><rect width="5" height="1.3" fill="${C.ink}"/></pattern>
    <pattern id="hatchW" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)"><rect width="5" height="1.1" fill="${C.paper}"/></pattern>
    <pattern id="xhatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)"><rect width="5" height="1.2" fill="${C.ink}"/><rect width="1.2" height="5" fill="${C.ink}"/></pattern>
    <pattern id="hatchWarn" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="9" height="3.6" fill="${C.warn}"/></pattern>
    <pattern id="hatchWarnD" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="7" height="3.8" fill="${C.warn}"/></pattern>
    `;
  };
})(window.PN);
