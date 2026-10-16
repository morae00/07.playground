// k-story.js — PN.story · 이야기 패널 6장 (D-15 (b)): prologue-1~4, ending-2, ending-4 · v1.0 (K6 3차: 검수 2차 M1~M5·R1·R2 반영)
// 먹극화 · Paper Noir Ink. 지시서 docs/art/briefs/story-panels.md (B4). 로컬 박스 1200×675 = 굽힌 WebP 1 px.
// Reads lib.js, k-hero.js (PN._hk, PN.heroKit), k-enemies.js (PN.enemies) and k-env.js (PN.env) ONLY when a function
// runs, never at load time, so their id counters and outputs do not move (brief §1.1, C12). Ids: kst<n>_ per call.
// One camera per panel (horizon + vanishing point), key light upper-left, the void is where the drawing ends.
window.PN = window.PN || {};
(function (PN) {
  'use strict';
  const S = (PN.story = PN.story || {});
  const W = 1200, H = 675;
  const IDS = ['prologue-1', 'prologue-2', 'prologue-3', 'prologue-4', 'ending-2', 'ending-4'];
  // kit tokens (the bake's COLOR_MAP turns them into the implemented palette) + chapter materials (brief §1.7)
  const K = {
    ink: '#121110', ink7: '#2B2926', ink5: '#46423D', ink3: '#8C8579', ink1: '#BCB4A5',
    p50: '#FAF6EC', paper: '#F3EEE2', p300: '#D8D0C0',
    ally: '#00A8C6', allyD: '#007C94', allyG: '#CFF6FF'
  };
  const C1 = { light: '#D4CAB4', base: '#B8AC93', deep: '#8F836C', spot: '#7E6A4E' };
  const C5 = { light: '#C8C3C9', base: '#ABA5AC', deep: '#8A848C', spot: '#3E3747' };
  const GUIDE = '#E83E8C'; // review overlay only (opts.guides)
  let UID = 0;

  // ---------------------------------------------------------------- 0. numbers, points, curves
  const f = (n) => Math.round(n * 100) / 100;
  const pt = (p) => f(p[0]) + ',' + f(p[1]);
  const P = (pts, closed) => 'M' + pts.map(pt).join(' L') + (closed === false ? '' : ' Z');
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, s) => [a[0] * s, a[1] * s], len: (a) => Math.hypot(a[0], a[1]),
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    norm: (a) => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; },
    perp: (a) => [-a[1], a[0]],
    rot: (a, deg) => { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [a[0] * c - a[1] * s, a[0] * s + a[1] * c]; }
  };
  // Park–Miller, same family as lib.js PN.rng (pure, no shared state)
  function rng(seed) { let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    return '#' + [16, 8, 0].map((sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  // Catmull-Rom → dense polyline
  function cr(pts, closed, per) {
    per = per || 8;
    const n = pts.length, out = [], m = closed ? n : n - 1;
    if (n < 2) return pts.map((p) => p.slice(0, 2));
    const Q = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
    for (let i = 0; i < m; i++) {
      const p0 = Q(i - 1), p1 = Q(i), p2 = Q(i + 1), p3 = Q(i + 2);
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    if (!closed) out.push(pts[n - 1].slice(0, 2));
    return out;
  }
  // Catmull-Rom → compact cubic path (fills)
  function bz(pts, closed, k) {
    k = k == null ? 1 / 6 : k;
    const n = pts.length, g = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
    let d = 'M' + pt(pts[0]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      d += ' C' + pt([p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k]) + ' ' + pt([p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k]) + ' ' + pt(p2);
    }
    return d + (closed ? ' Z' : '');
  }
  function arcLen(Sm) { const c = [0]; for (let i = 1; i < Sm.length; i++) c.push(c[i - 1] + Math.hypot(Sm[i][0] - Sm[i - 1][0], Sm[i][1] - Sm[i - 1][1])); return c; }
  function normalsOf(Sm) {
    return Sm.map((p, i) => { const a = Sm[Math.max(0, i - 1)], b = Sm[Math.min(Sm.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
  }
  // variable-width ribbon along a dense polyline; wfn(t, dist) → full width
  function ribbonD(Sm, wfn) {
    const cum = arcLen(Sm), tot = cum[cum.length - 1] || 1, N = normalsOf(Sm), L = [], R = [];
    Sm.forEach((p, i) => { const h = Math.max(0.06, wfn(cum[i] / tot, cum[i]) / 2); L.push([p[0] + N[i][0] * h, p[1] + N[i][1] * h]); R.push([p[0] - N[i][0] * h, p[1] - N[i][1] * h]); });
    return P(L.concat(R.reverse()));
  }
  const TP = {
    mid: (t) => Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.62),
    start: (t) => Math.pow(Math.max(0, 1 - t), 0.8),
    end: (t) => Math.pow(Math.max(0, t), 0.8),
    soft: (t) => Math.min(1, t / 0.14, (1 - t) / 0.14),
    band: (t) => Math.min(1, 0.62 + (t / 0.07) * 0.38, 0.62 + ((1 - t) / 0.07) * 0.38),
    none: () => 1
  };
  // brush stroke through control points. o: {taper, color, wob, seed, per, op}
  function stroke(pts, w, o) {
    o = o || {};
    const Sm = pts.length > 2 ? cr(pts, false, o.per || 8) : cr([pts[0], V.lerp(pts[0], pts[1], 0.5), pts[1]], false, 8);
    const tp = TP[o.taper || 'mid'], r = rng(o.seed || 5), ph = r() * 6.3, wob = o.wob == null ? 0.08 : o.wob;
    return `<path d="${ribbonD(Sm, (t) => w * tp(t) * (1 + wob * Math.sin(t * 11 + ph)))}" fill="${o.color || K.ink}"${o.op != null ? ` opacity="${o.op}"` : ''}/>`;
  }
  // dry brush (비백): strands across the width that thin and break toward the dry end. o: {taper, dryFrom, strands, seed, color}
  function dryStroke(pts, w, o) {
    o = o || {};
    const Sm = cr(pts, false, 12), n = Sm.length, cum = arcLen(Sm), tot = cum[n - 1] || 1, N = normalsOf(Sm);
    const tp = TP[o.taper || 'start'], r = rng(o.seed || 9), ns = o.strands || 4, dryFrom = o.dryFrom == null ? 0.35 : o.dryFrom;
    const idx = (t) => { let i = 0; while (i < n - 1 && cum[i + 1] / tot < t) i++; return i; };
    let out = '';
    for (let k = 0; k < ns; k++) {
      const u = ns === 1 ? 0 : (k / (ns - 1) - 0.5) * 0.78, sw = (w / ns) * (1.15 + 0.55 * r());
      let t = r() * 0.03;
      while (t < 0.995) {
        const dry = clamp((t - dryFrom) / (1 - dryFrom), 0, 1), len = (0.1 + r() * 0.45) * (1 - 0.72 * dry) + 0.02;
        const t1 = Math.min(1, t + len), i0 = idx(t), i1 = Math.max(i0 + 1, idx(t1)), seg = [];
        for (let i = i0; i <= Math.min(n - 1, i1); i++) { const ww = w * tp(cum[i] / tot); seg.push([Sm[i][0] + N[i][0] * u * ww, Sm[i][1] + N[i][1] * u * ww]); }
        const ta = t, tb = t1;
        if (seg.length > 1) out += `<path d="${ribbonD(seg, (tt) => sw * tp(ta + (tb - ta) * tt) * (0.5 + 0.5 * Math.pow(Math.sin(Math.PI * clamp(tt, 0.02, 0.98)), 0.5)))}" fill="${o.color || K.ink}"/>`;
        t = t1 + (0.012 + r() * 0.05) * (0.25 + 3.2 * dry);
      }
    }
    return out;
  }
  // bilinear point in a screen quad [tl, tr, br, bl]
  const quadAt = (q, u, v) => V.lerp(V.lerp(q[0], q[1], u), V.lerp(q[3], q[2], u), v);

  // ---------------------------------------------------------------- 1. per-call context
  function ctx() {
    const id = 'kst' + (++UID) + '_', defs = [], cache = {};
    let n = 0;
    const c = {
      id, defs,
      uid: (p) => id + (p || 'u') + (n++),
      // 45° halftone; pitch in the user units of the element that uses it (panel px for backgrounds)
      dot(cov, col, pitch) {
        col = col || K.ink; pitch = pitch || 8;
        const key = 'd' + cov + col + pitch;
        if (cache[key]) return cache[key];
        const pid = c.uid('p'), r = pitch * Math.sqrt(cov / Math.PI);
        defs.push(`<pattern id="${pid}" width="${f(pitch)}" height="${f(pitch)}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="${f(pitch / 2)}" cy="${f(pitch / 2)}" r="${f(r)}" fill="${col}"/></pattern>`);
        return (cache[key] = `url(#${pid})`);
      },
      clip(d, evenodd) { const cid = c.uid('c'); defs.push(`<clipPath id="${cid}"><path d="${d}"${evenodd ? ' clip-rule="evenodd"' : ''}/></clipPath>`); return `url(#${cid})`; },
      clipG(d, inner, evenodd) { return `<g clip-path="${c.clip(d, evenodd)}">${inner}</g>`; },
      mask(inner, box) {
        const b = box || [-60, -60, W + 120, H + 120], mid = c.uid('m');
        defs.push(`<mask id="${mid}" maskUnits="userSpaceOnUse" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}">${inner}</mask>`);
        return `url(#${mid})`;
      },
      // silhouette strengthening for small figures (brief §1.7): ink dilation r + a copy pushed 0.6 to the lower right
      sil(r) {
        r = r || 1.6;
        const key = 's' + r;
        if (cache[key]) return cache[key];
        const fid = c.uid('f');
        defs.push(`<filter id="${fid}" x="-8%" y="-8%" width="116%" height="116%"><feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="a"/><feOffset in="a" dx="0.6" dy="0.6" result="b"/><feMerge result="m"><feMergeNode in="a"/><feMergeNode in="b"/></feMerge><feFlood flood-color="${K.ink}"/><feComposite in2="m" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
        return (cache[key] = `url(#${fid})`);
      }
    };
    return c;
  }

  // ---------------------------------------------------------------- 2. camera (brief §1.6): x = vx + f·X/Z, y = hz + f·(h − Y)/Z
  function camera(vx, hz, fl, h) {
    return {
      vx, hz, f: fl, h,
      p: (X, Z, Y) => [vx + fl * X / Z, hz + fl * (h - (Y || 0)) / Z],
      Z: (y, Y) => fl * (h - (Y || 0)) / (y - hz),
      X: (x, Z) => (x - vx) * Z / fl,
      s: (Z) => fl / Z
    };
  }

  // ---------------------------------------------------------------- 3. shared grammar (brief §2)
  // §2.6 thread / stitch thread: ink 5 · teal 2.8 · allyG 0.9 (kit needle-tail ratio). o: {tip:'end'|'start'|'both'}
  function thread(pts, tw, o) {
    o = o || {};
    const Sm = cr(pts, false, 10);
    const tp = o.tip === 'end' ? (t) => Math.min(1, (1 - t) / 0.12 + 0.25) : o.tip === 'both' ? (t) => Math.min(1, t / 0.1 + 0.35, (1 - t) / 0.1 + 0.35) : () => 1;
    return `<path d="${ribbonD(Sm, (t) => tw * tp(t))}" fill="${K.ink}"/><path d="${ribbonD(Sm, (t) => tw * 0.56 * tp(t))}" fill="${K.ally}"/><path d="${ribbonD(Sm, (t) => tw * 0.18 * tp(t))}" fill="${K.allyG}"/>`;
  }
  // §2.4 needle, eye end a → tip b, body width w. o: {state:'named'|'empty'|'filling', fill, thread:[pts after the eye], tw, seed}
  // Paper body + ink outline, ink front 30 %, teal eye (ink rim + teal + allyG core), name band 22–48 % from the eye end.
  function needle(a, b, w, o) {
    o = o || {};
    const L = V.len(V.sub(b, a)), u = V.norm(V.sub(b, a)), nn = V.perp(u), hw = w / 2, r = rng(o.seed || 17);
    const Q = (s, off) => [a[0] + u[0] * s + nn[0] * off, a[1] + u[1] * s + nn[1] * off];
    const deg = f(Math.atan2(u[1], u[0]) * 180 / Math.PI), ow = Math.max(1.05, w * 0.15);
    const cap = [-60, -30, 0, 30, 60].map((g) => { const ph = g * Math.PI / 180; return Q(hw - hw * Math.cos(ph), hw * Math.sin(ph)); });
    let s = `<path d="${P([Q(hw, hw), Q(0.66 * L, hw * 0.86), Q(L, 0), Q(0.66 * L, -hw * 0.86), Q(hw, -hw)].concat(cap))}" fill="${K.p50}" stroke="${K.ink}" stroke-width="${f(ow * 2)}" stroke-linejoin="round" paint-order="stroke"/>`;
    s += `<path d="${P([Q(0.7 * L, hw * 0.76), Q(L, 0), Q(0.7 * L, -hw * 0.76)])}" fill="${K.ink}"/>`;
    const b0 = 0.22 * L, b1 = 0.48 * L, bh = Math.max(w * 0.3, 1.2), state = o.state || 'named';
    if (state === 'named') {
      // one ink stroke whose weight wavers a little — never letter shapes
      s += stroke([Q(b0 + bh * 0.5, 0), Q(b0 + (b1 - b0) * 0.45, (r() - 0.5) * bh * 0.2), Q(b1 - bh * 0.5, 0)], bh * 1.9, { taper: 'band', wob: 0.1, seed: (o.seed || 3) + 1 });
    } else {
      const arc = (cs, a0, a1, k) => { const q = []; for (let i = 0; i <= k; i++) { const ph = a0 + (a1 - a0) * i / k; q.push(Q(cs + bh * Math.cos(ph), bh * Math.sin(ph))); } return q; };
      const ring = [Q(b0 + bh, bh), Q((b0 + b1) / 2, bh), Q(b1 - bh, bh)].concat(arc(b1 - bh, Math.PI / 2, -Math.PI / 2, 8), [Q((b0 + b1) / 2, -bh)], arc(b0 + bh, -Math.PI / 2, -Math.PI * 1.5, 8));
      s += `<path d="${P(ring)}" fill="${K.p300}"/>`;
      if (state === 'filling') {
        const sf = b0 + (b1 - b0) * (o.fill == null ? 0.68 : o.fill);
        const wet = [Q(b0 + bh, bh)].concat(arc(sf - bh * 0.95, Math.PI / 2, -Math.PI / 2, 8).map((p, i, A) => p), arc(b0 + bh, -Math.PI / 2, -Math.PI * 1.5, 8));
        s += `<path d="${P(wet)}" fill="${K.ink}"/>`;
      }
      // the groove rim: ink, broken in 2–3 places on an empty needle (where the name was erased)
      const loop = cr(ring, true, 3), cum = arcLen(loop), tot = cum[cum.length - 1];
      const gaps = state === 'empty' ? [0.13 + r() * 0.06, 0.47 + r() * 0.08, 0.78 + r() * 0.06] : [];
      const rw = Math.max(0.85, w * 0.12);
      let seg = [];
      const flush = () => { if (seg.length > 1) s += `<path d="${ribbonD(seg, (t) => rw * Math.min(1, t / 0.2 + 0.3, (1 - t) / 0.2 + 0.3))}" fill="${K.ink}"/>`; seg = []; };
      loop.forEach((p, i) => { const t = cum[i] / tot; if (gaps.some((g) => Math.abs(t - g) < 0.035)) flush(); else seg.push(p); });
      seg.push(loop[0]); flush();
    }
    const es = Math.max(hw * 1.7, 0.09 * L), erx = Math.max(hw * 0.85, 0.042 * L), ery = Math.max(0.7, hw * 0.5), E0 = Q(es, 0);
    if (o.thread) s += thread([E0].concat(o.thread), o.tw || Math.max(2.2, w * 0.42), { tip: 'end' });
    s += `<ellipse cx="${f(E0[0])}" cy="${f(E0[1])}" rx="${f(erx)}" ry="${f(ery)}" transform="rotate(${deg} ${f(E0[0])} ${f(E0[1])})" fill="${K.ally}" stroke="${K.ink}" stroke-width="${f(Math.max(0.8, w * 0.13))}"/>`;
    s += `<ellipse cx="${f(E0[0])}" cy="${f(E0[1])}" rx="${f(erx * 0.5)}" ry="${f(ery * 0.34)}" transform="rotate(${deg} ${f(E0[0])} ${f(E0[1])})" fill="${K.allyG}"/>`;
    return s;
  }
  // bandolier strap a → b (width sw) with loops at fractions T. items[i] = {state, len, w, dir:[x,y] (eye end out)} or null (empty loop)
  function strapBelt(a, b, sw, T, items, o) {
    o = o || {};
    const u = V.norm(V.sub(b, a)), nn = V.perp(u);
    let back = '', mid = '', top = '';
    back += `<path d="${P([V.add(a, V.mul(nn, sw / 2)), V.add(b, V.mul(nn, sw / 2)), V.sub(b, V.mul(nn, sw / 2)), V.sub(a, V.mul(nn, sw / 2))])}" fill="${K.ink}" stroke="${K.ink}" stroke-width="${f(Math.max(2, sw * 0.14))}" stroke-linejoin="round"/>`;
    back += stroke([V.add(a, V.mul(nn, sw * 0.28)), V.lerp(V.add(a, V.mul(nn, sw * 0.28)), V.add(b, V.mul(nn, sw * 0.28)), 0.5), V.add(b, V.mul(nn, sw * 0.28))], Math.max(1, sw * 0.08), { color: K.p50, op: 0.5, taper: 'mid' });
    T.forEach((t, i) => {
      const p = V.lerp(a, b, t), it = items && items[i];
      if (it) {
        const d = V.norm(it.dir), L = it.len;
        mid += needle(V.add(p, V.mul(d, L * (it.out == null ? 0.7 : it.out))), V.sub(p, V.mul(d, L * (1 - (it.out == null ? 0.7 : it.out)))), it.w, { state: it.state, fill: it.fill, seed: 31 + i * 7, thread: it.thread, tw: it.tw });
      }
      // loop band across the strap (paper + ink edge), a little wider than the strap
      const lw = sw * 0.62, q = [V.add(V.add(p, V.mul(u, -lw / 2)), V.mul(nn, sw * 0.66)), V.add(V.add(p, V.mul(u, lw / 2)), V.mul(nn, sw * 0.66)), V.add(V.add(p, V.mul(u, lw / 2)), V.mul(nn, -sw * 0.66)), V.add(V.add(p, V.mul(u, -lw / 2)), V.mul(nn, -sw * 0.66))];
      top += `<path d="${P(q)}" fill="${o.loop || K.p50}" stroke="${K.ink}" stroke-width="${f(Math.max(1.2, sw * 0.12))}" stroke-linejoin="round"/>` +
        `<path d="${P([V.add(p, V.mul(nn, sw * 0.6)), V.add(p, V.mul(nn, -sw * 0.6))], false)}" stroke="${K.ink}" stroke-width="${f(Math.max(0.9, sw * 0.1))}"/>`;
    });
    return back + mid + top;
  }
  // §2.6 knot (結) at c with scale s (1 ≈ 1 px): a figure-eight knot in the thread's teal sandwich — two loops that
  // cross over-under at the waist — and two loose ends hanging down (review 1 B2: no round ball, no leg-like ends)
  function knot(cx, cy, s, rot) {
    const ring = (c0, rx, ry, deg, a0, a1) => { const q = [], n = 14; for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n, p = V.rot([rx * Math.cos(a), ry * Math.sin(a)], deg); q.push([c0[0] + p[0], c0[1] + p[1]]); } return q; };
    const TAU = Math.PI * 2;
    return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot || 0)}) scale(${f(s)})">` +
      thread([[2, 7.6], [0.4, 13], [2.2, 19], [0.6, 24.6]], 3.6, { tip: 'end' }) + thread([[6.4, 6.6], [8.8, 12.4], [7.6, 18.4]], 3.4, { tip: 'end' }) +
      // (each loop starts and ends under the over-crossing, so its seam is hidden)
      thread(ring([-3.6, -3.4], 6, 4.4, -38, 0.2 * TAU, 1.2 * TAU), 4.2) + thread(ring([3.6, 3.4], 6, 4.4, -38, 0.725 * TAU, 1.725 * TAU), 4.2) +
      // the over-crossing: a short run of the upper loop laid back over the lower one
      thread(ring([-3.6, -3.4], 6, 4.4, -38, 0.05 * TAU, 0.32 * TAU), 4.2, { tip: 'both' }) + '</g>';
  }
  // §2.6 whip stitches across a vertical boundary between x0 and x1, from y1 (bottom) up to y0: one slanted loop each,
  // 35–50°, 34–42 long, spacing 40 ± 6 (uneven). Returns {s, list:[[a, b]]}
  function stitches(x0, x1, y0, y1, o) {
    o = o || {};
    const r = rng(o.seed || 23), list = [];
    let y = y1 - (o.first || 18), s = '';
    while (y > y0 + 6) {
      const ang = (35 + r() * 15) * Math.PI / 180, len = 34 + r() * 8, dx = Math.cos(ang) * len, dy = Math.sin(ang) * len;
      const cx = (x0 + x1) / 2 + (r() - 0.5) * 2.4, a = [cx - dx / 2, y + dy / 2], b = [cx + dx / 2, y - dy / 2];
      const bend = V.mul(V.perp(V.norm(V.sub(b, a))), -0.9);
      // the holes where the thread goes into the paper (small ink nicks), then the slanted loop over the edge
      s += `<path d="${P([V.add(a, [-2.2, 1.2]), V.add(a, [1.2, -0.6])], false)}" stroke="${K.ink}" stroke-width="2.2" stroke-linecap="round"/><path d="${P([V.add(b, [-1.2, 0.6]), V.add(b, [2.2, -1.2])], false)}" stroke="${K.ink}" stroke-width="2.2" stroke-linecap="round"/>`;
      s += thread([V.add(a, V.mul(V.norm(V.sub(b, a)), 1.5)), V.add(V.lerp(a, b, 0.5), bend), V.sub(b, V.mul(V.norm(V.sub(b, a)), 1.5))], o.tw || 5, { tip: 'both' });
      list.push([a, b]);
      y -= 40 + (r() - 0.5) * 12;
    }
    return { s, list };
  }
  // §2.2 margin: clean double rule (left 5.5, right 4, 17 apart) and a quiet p50 plane to its right
  function margin(x, y0, y1, o) {
    o = o || {};
    return (o.plane === false ? '' : `<rect x="${f(x + 17)}" y="${f(y0)}" width="${f((o.right || W) - x - 17)}" height="${f(y1 - y0)}" fill="${K.p50}"/>`) +
      `<path d="M${f(x)},${f(y0)} V${f(y1)}" stroke="${K.ink}" stroke-width="5.5"/><path d="M${f(x + 17)},${f(y0)} V${f(y1)}" stroke="${K.ink}" stroke-width="4"/>`;
  }
  // §2.5 ink puddle: flat perspective blob (never an ellipse), one thin paper sliver on the lit upper-left rim
  function puddle(cx, cy, rx, ry, seed) {
    const r = rng(seed || 13), N = 15, pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, k = 0.72 + 0.4 * r() + (i % 4 === 1 ? 0.22 : 0);
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * (0.8 + 0.35 * r())]);
    }
    const sl = [[cx - rx * 0.62, cy - ry * 0.32], [cx - rx * 0.3, cy - ry * 0.62], [cx + rx * 0.05, cy - ry * 0.7]];
    return `<path d="${bz(pts, true, 0.14)}" fill="${K.ink}"/>` + stroke(sl, Math.max(1.2, ry * 0.12), { color: K.p50, taper: 'mid', op: 0.9 });
  }
  // §2.5 drip: a thin ink trail falling straight down from an erased line end into a puddle
  function drip(x, y0, y1, w, seed) {
    const r = rng(seed || 3), mx = x + (r() - 0.5) * 2.2, len = y1 - y0;
    // a liquid trail: thick where it leaves the line, a bead or two on the way, a foot where it meets the floor
    let s = stroke([[x, y0], [mx, y0 + len * 0.4], [x + (r() - 0.5) * 1.6, y1]], w, { taper: 'none', wob: 0.3, seed: seed || 3 });
    s += `<path d="M${f(x - w * 1.1)},${f(y0)} C${f(x - w)},${f(y0 + w * 3)} ${f(x - w * 0.5)},${f(y0 + w * 4)} ${f(x)},${f(y0 + w * 5)} C${f(x + w * 0.5)},${f(y0 + w * 4)} ${f(x + w)},${f(y0 + w * 3)} ${f(x + w * 1.1)},${f(y0)} Z" fill="${K.ink}"/>`;
    const nb = len > 60 ? 2 : 1;
    for (let i = 0; i < nb; i++) {
      const yb = y0 + len * (0.35 + 0.3 * i + r() * 0.12), xb = x + (mx - x) * 0.6;
      s += `<path d="M${f(xb)},${f(yb - w * 2.4)} C${f(xb + w * 0.4)},${f(yb - w * 1.2)} ${f(xb + w * 0.95)},${f(yb + w * 0.2)} ${f(xb)},${f(yb + w * 1.1)} C${f(xb - w * 0.95)},${f(yb + w * 0.2)} ${f(xb - w * 0.4)},${f(yb - w * 1.2)} ${f(xb)},${f(yb - w * 2.4)} Z" fill="${K.ink}"/>`;
    }
    return s + `<path d="M${f(x - w * 1.2)},${f(y1 + 0.5)} C${f(x - w)},${f(y1 - w * 1.8)} ${f(x + w)},${f(y1 - w * 1.8)} ${f(x + w * 1.2)},${f(y1 + 0.5)} Z" fill="${K.ink}"/>`;
  }
  // §2.1 the void edge. edge = top → bottom points, void to the right. Returns the clip + mask for the scene and the ink
  // chips that fly off. Band 14–30 px: flat → 40 % → 20 % → none. No outline on the edge.
  // o.close: the scene side's closing points after the edge's last point (default: back along the left border)
  function voidEdge(c, edge, o) {
    o = o || {};
    const r = rng(o.seed || 41), E = cr(edge, false, 5);
    const bw = E.map((p, i) => 14 + 16 * (0.5 + 0.5 * Math.sin(i * 0.29 + (o.phase || 1.3)) * Math.cos(i * 0.083 + 0.4)));
    const N = normalsOf(E); // left of the direction of travel = toward the drawing
    const shift = (k) => E.map((p, i) => [p[0] + N[i][0] * bw[i] * k, p[1] + N[i][1] * bw[i] * k]);
    const close = o.close || [[-80, E[E.length - 1][1]], [-80, E[0][1]]];
    const left = (line) => P(line.concat(close));
    const band = (A, B) => P(A.concat(B.slice().reverse()));
    const e1 = shift(1), e2 = shift(0.5);
    const mask = c.mask(`<path d="${left(e1)}" fill="#FFFFFF"/><path d="${band(e1, e2)}" fill="${c.dot(0.42, '#FFFFFF', 6)}"/><path d="${band(e2, E)}" fill="${c.dot(0.2, '#FFFFFF', 6)}"/>`);
    const clip = c.clip(left(E));
    // ink chips: 3–12 px stroke bits within 60 px of the edge, smaller further out; uneven spacing, size and angle
    let chips = '';
    const nChip = o.chips == null ? Math.round(E.length * 0.55) : o.chips, flow = o.flow == null ? 0.15 : o.flow;
    for (let k = 0; k < nChip; k++) {
      const i = Math.floor(r() * E.length), p = E[i];
      if (p[1] < (o.yMin == null ? -10 : o.yMin) || p[1] > (o.yMax == null ? H + 10 : o.yMax)) continue;
      const d = 60 * Math.pow(r(), 1.7), size = (12 - 9 * d / 60) * (0.45 + 0.55 * r());
      if (size < 2.6) continue;
      const out = d - bw[i] * 0.3, tj = (r() - 0.5) * 10;
      const q = [p[0] - N[i][0] * out - N[i][1] * tj, p[1] - N[i][1] * out + N[i][0] * tj + d * flow];
      const ang = (r() - 0.5) * 2.4 + flow, a = [q[0] - Math.cos(ang) * size / 2, q[1] - Math.sin(ang) * size / 2], b = [q[0] + Math.cos(ang) * size / 2, q[1] + Math.sin(ang) * size / 2];
      chips += stroke([a, b], Math.max(1.1, size * (0.22 + r() * 0.2)), { taper: r() > 0.5 ? 'start' : 'mid', color: o.chipColor ? o.chipColor(q) : K.ink, seed: k + 3, wob: 0.2 });
    }
    return { mask, clip, chips, E, bw, e1 };
  }
  // dry tail of a line running into the void: from p along dir, the brush thins and breaks (§2.1)
  function dryTail(p, dir, w, len, seed) {
    const d = V.norm(dir), q = V.add(p, V.mul(d, len));
    return dryStroke([p, V.add(V.lerp(p, q, 0.5), V.mul(V.perp(d), (rng(seed || 1)() - 0.5) * 3)), q], w, { taper: 'start', dryFrom: 0.1, strands: 3, seed: seed || 5 });
  }
  // §2.3 manuscript sheet on a screen quad [tl, tr, br, bl]: ruled vertical lines (ink1, ±10 %), greeking columns written
  // top → bottom, placed right → left; o.cols full columns from the right, then one column written to o.half
  function manuscript(q, o) {
    o = o || {};
    const r = rng(o.seed || 7), at = (u, v) => quadAt(q, u, v);
    let s = `<path d="${P(q)}" fill="${o.paper || K.p50}"/>`;
    const n = o.rules || 10, us = [];
    let u = 0.05;
    for (let i = 0; i <= n; i++) { us.push(u); u += (0.9 / n) * (0.9 + r() * 0.2); }
    const rw = o.rule || 0.9, gw = o.gw || 1.5;
    us.forEach((uu) => { if (uu < 0.97) s += `<path d="${P([at(uu, 0.05), at(uu, 0.95)], false)}" stroke="${K.ink1}" stroke-width="${rw}"/>`; });
    let tip = null;
    const written = Math.min(o.cols == null ? n - 2 : o.cols, us.length - 2);
    for (let k = 0; k <= written; k++) {
      const i = us.length - 2 - k; if (i < 0) break;
      const uc = (us[i] + us[i + 1]) / 2, last = k === written, vEnd = last ? 0.07 + 0.86 * (o.half == null ? 0.5 : o.half) : 0.9 - r() * 0.25;
      let v = 0.08 + r() * 0.03;
      const segs = 2 + Math.floor(r() * 3);
      for (let j = 0; j < segs && v < vEnd - 0.04; j++) {
        const v1 = Math.min(vEnd, v + (vEnd - 0.08) / segs * (0.7 + r() * 0.6)), wob = (us[i + 1] - us[i]) * 0.12;
        s += stroke([at(uc + (r() - 0.5) * wob, v), at(uc + (r() - 0.5) * wob, (v + v1) / 2), at(uc + (r() - 0.5) * wob, v1)], gw * (0.8 + r() * 0.4), { taper: 'soft', wob: 0.25, seed: k * 11 + j });
        v = v1 + 0.03 + r() * 0.05;
      }
      if (last) tip = at(uc, Math.min(vEnd, v));
    }
    return { s, tip };
  }

  // ---------------------------------------------------------------- 4. 결 (k-hero.js rig as it is; head attached here, brief §3.1)
  // pose P = kit pose object (API-hero §1) without 'head' in its order. o: {s, x, y (panel position of the box pivot 200,600),
  // head:{expr, hat, hatDy, shadowDy, tilt, bold, fine, rot, under}, pitch, extra:{after:{part:markup}}, sil}
  function heroFig(c, Pz, o) {
    const Hk = PN._hk, sc = o.s, pitch = o.pitch || Math.max(3.4, (sc >= 1 ? 9 : 6.5) / sc);
    const hc = Hk.Ctx({ pitch, rough: o.rough == null ? 0.7 : o.rough, seed: 7, fine: !!(o.head && o.head.fine) });
    const order = (Pz.order || Hk.ORDER).filter((k) => k !== 'head');
    const ex = o.extra || {};
    let body = '';
    order.forEach((k) => { body += Hk.side(hc, Object.assign({}, Pz, { order: [k] })) + (ex[k] ? ex[k](hc) : ''); });
    const hd = Pz.head, hs = hd.s || 1.04, hg = (m) => `<g transform="translate(${f(hd.p[0])} ${f(hd.p[1])}) rotate(${f(hd.rot || 0)}) scale(${hs})">${m}</g>`;
    const ho = o.head || {};
    let head = '';
    if (ho.lost) head = hg(headLost(hc, ho));
    else {
      head = hg(Hk.neck34(hc)) + Hk.scarfWrap(hc, Pz.wrap ? Pz.wrap.p : [Pz.neck[0] + 4, Pz.neck[1] - 10], Pz.wrap ? Pz.wrap.rot : 0, Pz.wrap || {}) +
        hg(Hk.head34(hc, { expr: ho.expr || 'calm', hat: ho.hat, hatDy: ho.hatDy, shadowDy: ho.shadowDy, shadowRot: ho.shadowRot, tilt: ho.tilt, bold: ho.bold, fine: ho.fine, neck: false }) + (ho.under ? ho.under : ''));
    }
    const fig = `<g ${hc.rough}>${body}${head}</g>` + (ex.top ? ex.top(hc) : '');
    const placed = `<g transform="translate(${f(o.x - 200 * sc)} ${f(o.y - 600 * sc)}) scale(${f(sc)})">${hc.wrap(fig)}</g>`;
    return o.sil ? `<g filter="${c.sil(o.sil)}">${placed}</g>` : placed;
  }
  // §3.3 결 without the hat, back three-quarter (lost profile). Head-local units as head34 (origin = skull centre, the
  // face turned away to the right): crown mass (top ≈ −52), hair swept back and tied low at the nape, one ear (paper +
  // ink rim), a thin cheek strip along the right edge from the ear to the jaw. No eye, brow, nose or lashes.
  const LOST = {
    // hair swept back from the temple over the crown and gathered low at the nape; the face is turned away
    HAIR: 'M -4,-53 C 10,-52.4 21,-46 26,-36.4 C 28.4,-30.6 28.2,-22.6 27,-17 C 25,-14 21.4,-12.8 18.6,-11 C 15,-6 14.6,3 15.6,10.4 C 13.4,17.6 8.4,23.6 2.6,28 C -5.6,32.6 -16,31.8 -24.4,27 C -34.4,19.4 -40.8,4.6 -41,-13.6 C -41.2,-31.6 -30.6,-47.4 -14.4,-52.6 C -11,-53.4 -7.4,-53.6 -4,-53 Z',
    SKIN: 'M 24,-37 C 29,-30 32,-19 32.8,-6.4 C 33.4,5.6 31.6,15.8 27.8,23.4 C 24.8,29.4 19.2,33.2 12,34.2 L 3,30 C 11,23 17,9 19,-5 C 20.4,-17 21.6,-28 24,-37 Z',
    EAR: 'M 18.6,-11 C 23.4,-13 27.2,-9.6 27.6,-3.6 C 28,2.4 25.2,8.4 21,10.2 C 17.8,11.4 15,9.6 15,6 C 15,0 15.6,-7 18.6,-11 Z',
    NECK: 'M -16,20 C -12,34 -11,48 -13,64 L 22,64 C 19.6,50 19.6,40 22.6,29 C 14,33.4 0,32 -16,20 Z'
  };
  function headLost(hc, o) {
    const B = o.bold || 1;
    let s = `<path d="${LOST.NECK}" fill="${K.paper}" stroke="${K.ink}" stroke-width="4" stroke-linejoin="round" paint-order="stroke"/>` +
      `<path d="M 10,31.6 C 15,33 19,31 22.6,29 C 19.6,40 19.6,50 22,64 L 13,64 C 14,52 13.4,42 10,31.6 Z" fill="${K.p300}"/>`;
    // skin behind the hair: only a 2–4 px strip shows between the hairline / ear / jaw and the cheek contour
    s += `<path d="${LOST.SKIN}" fill="${K.p300}"/>`;
    s += stroke([[26.6, -34], [30.8, -20], [32.6, -6], [31.8, 7], [28.6, 19], [23, 28], [13, 33.6]], 2.7 * B, { taper: 'end', wob: 0.05, seed: 21 });
    s += `<path d="${LOST.HAIR}" fill="${K.ink}" stroke="${K.ink}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += `<path d="${LOST.EAR}" fill="${K.paper}" stroke="${K.ink}" stroke-width="${f(1.9 * B)}" stroke-linejoin="round"/>` + stroke([[23.6, -6.6], [22.6, -0.6], [19.8, 5]], 1.3 * B, { seed: 4 });
    // the hair is combed back from the temple into the low tie: a few locks lift off the crown and the nape (so the
    // skull is not one smooth helmet), ink5 flow lines inside, paper sheen on the lit upper-left (no dots, no rim)
    s += `<path d="M -16,-52 C -12,-57 -4,-57.4 2,-53.6 C -4,-54.6 -10,-54 -16,-52 Z" fill="${K.ink}"/><path d="M -38,-26 C -42,-21 -42.6,-14 -41,-8 C -40.6,-14 -40,-20 -38,-26 Z" fill="${K.ink}"/>`;
    s += stroke([[-27, 20], [-31, 28], [-29, 36]], 2.2, { seed: 14 });
    [[[20, -40], [4, -42], [-10, -32], [-12, -10], [-8, 14], [-6, 24]], [[24, -26], [10, -28], [0, -16], [-2, 6], [-4, 24]], [[-28, -40], [-34, -24], [-30, 0], [-18, 22]]].forEach((q, i) => { s += stroke(q, 1.3, { color: K.ink5, seed: 15 + i, op: 0.9 }); });
    s += stroke([[2, -50], [-18, -44], [-30, -28], [-30, -8]], 2.6, { color: K.p50, op: 0.85, seed: 8 }) + stroke([[12, -47], [-6, -40], [-18, -24], [-18, 0]], 1.6, { color: K.p50, op: 0.65, seed: 9 }) +
      stroke([[-36, -10], [-33, 6], [-24, 18]], 1.2, { color: K.p50, op: 0.5, seed: 10 });
    // two loose strands at the nape, then the low tie (paper band + ink line)
    s += stroke([[-22, 24], [-26, 32], [-25, 40]], 1.4, { seed: 12 }) + stroke([[6, 25], [9, 32], [8, 38]], 1.1, { seed: 13 });
    s += `<path d="M -20,22.4 C -13,26.4 -5,27.2 2,25 L 1.6,33 C -5.6,35 -14.6,34.2 -21.4,30.4 Z" fill="${K.paper}" stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"/><path d="M -18,27.4 C -12,29.6 -5,30 0,29" fill="none" stroke="${K.ink}" stroke-width="1.3"/>`;
    return s;
  }
  // 결 seen from behind, three-quarter (P1 kneeling at the desk, P2 half risen). Box like full(): ground y 600, facing
  // right-away. Built from kit parts (coatPart, arm, hand, hemLine, scarfWrap, scarfTails, pony) + headLost.
  function heroBack(c, Q, o) {
    const Hk = PN._hk, sc = o.s, hc = Hk.Ctx({ pitch: Math.max(6, 6.5 / sc), rough: 0.6, seed: 7 });
    let s = '';
    if (Q.tails) s += Hk.scarfTails(hc, Q.tails[0], Q.tails[1], 22, { twA: [0.42], twB: [0.58] });
    if (Q.under) s += Q.under(hc);
    s += Hk.coatPart(hc, Q.coat, 9);
    if (Q.back) s += Hk.coatPart(hc, Q.back, 17);
    if (Q.belt) s += `<path d="${bz(Q.belt, true, 0.2)}" fill="${K.ink}"/>`;
    if (Q.cape) s += Hk.coatPart(hc, Q.cape, 21);
    s += `<g transform="translate(${f(Q.head.p[0])} ${f(Q.head.p[1])}) rotate(${f(Q.head.rot || 0)}) scale(${Q.head.s || 1.04})">${headLost(hc, { bold: Q.head.bold })}</g>`;
    s += Hk.scarfWrap(hc, Q.wrap.p, Q.wrap.rot || 0, { ends: false, knot: false });
    if (Q.pony) s += Hk.pony(hc, Q.pony, 14);
    if (Q.tailsOver) s += Hk.scarfTails(hc, Q.tailsOver[0], Q.tailsOver[1], 26, { twA: [0.44], twB: [0.6] });
    if (Q.arm) s += Hk.arm(hc, Q.arm, Q.hand || {}, { w0: Q.armW || 28, pref: Q.armPref || 1 });
    if (Q.over) s += Q.over(hc);
    const placed = `<g transform="translate(${f(o.x - 200 * sc)} ${f(o.y - 600 * sc)}) scale(${f(sc)})">${hc.wrap(`<g ${hc.rough}>${s}</g>`)}</g>`;
    return o.sil ? `<g filter="${c.sil(o.sil)}">${placed}</g>` : placed;
  }

  // ---------------------------------------------------------------- 5. 스승 (brief §4): old scribe, 탕건 + 도포, never a face
  // Box like full(): ground y 600, centre x 200; height ≈ 481 (탕건 top y ≈ 119), bent so the head leans 8–12° forward.
  // pose 'back' = P1 (back three-quarter facing right, hands behind the back with the brush);
  // pose 'turn' = P2 (three-quarter facing left toward 결, near arm reaching, the other hand losing the brush, face erased).
  function teacher(c, pose, o) {
    o = o || {};
    const T = PN.taper, ink = K.ink;
    const seep = (pts, h, seed, up) => PN._hk.hemLine(o.hc, pts, h, seed, up);
    let s = '';
    if (pose === 'back') {
      // robe (도포) over a hunched back: the shoulders round down from a hump, the head hangs forward of it
      const robe = [[204, 206], [176, 214], [152, 236], [138, 270], [130, 330], [124, 410], [116, 490], [106, 556], [100, 590], [152, 596], [210, 599], [268, 595], [314, 586], [304, 520], [294, 440], [288, 360], [284, 292], [276, 246], [258, 222], [232, 210]];
      s += `<path d="${bz(robe, true, 0.16)}" fill="${K.paper}" stroke="${ink}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>`;
      if (o.hc) s += `<g clip-path="url(#${o.hc.clip(bz(robe, true, 0.16))})"><path d="M 236,204 C 250,300 246,430 238,604 L 330,604 L 330,200 Z" fill="${K.p300}"/>${seep([[96, 590], [152, 597], [210, 600], [268, 596], [318, 586]], 15, 5)}<path d="M 205,474 C 206,520 207,560 207,604 L 216,604 C 216,560 215,520 214,474 Z" fill="${ink}"/></g>`;
      s += T([212, 216, 210, 360, 210, 476], 2.2, 'mid', ink) + T([180, 226, 196, 214, 222, 212], 2.6, 'mid', ink);
      // arms folded behind: upper arms down the sides, elbows out, the wide sleeves hang under the forearms
      const slL = [[152, 244], [134, 296], [130, 350], [138, 410], [156, 432], [190, 426], [206, 396], [198, 366], [170, 346], [164, 300]];
      const slR = [[272, 240], [288, 296], [290, 352], [282, 410], [262, 432], [228, 428], [212, 398], [222, 366], [252, 346], [262, 300]];
      s += `<path d="${bz(slL, true, 0.18)}" fill="${K.paper}" stroke="${ink}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/>`;
      s += `<path d="${bz(slR, true, 0.18)}" fill="${K.p300}" stroke="${ink}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/>`;
      if (o.hc) s += seep([[140, 410], [156, 430], [190, 426], [204, 400]], 11, 7, [0.25, -1]) + seep([[214, 400], [228, 428], [262, 432], [280, 412]], 11, 9, [-0.25, -1]);
      s += T([166, 300, 172, 340, 196, 362], 2.4, 'mid', ink) + T([258, 300, 252, 340, 226, 362], 2.4, 'mid', ink);
      // the big brush held across the small of the back: bamboo handle with nodes, pointed ink bristles out to the right
      s += bigBrush([144, 354], [302, 400], 8);
      s += `<path d="M 196,356 C 202,348 218,348 224,356 C 228,366 220,374 208,374 C 198,374 192,366 196,356 Z" fill="${K.paper}" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke"/>` + T([202, 364, 210, 360, 218, 364], 1.2, 'mid', ink);
      // 세조대 cord across the back, between the arms
      s += `<path d="M 164,268 C 190,276 236,276 262,266" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`;
      // 버선 toes under the hem
      s += `<path d="M 232,588 C 246,582 268,584 278,592 C 274,598 246,601 232,599 Z" fill="${K.p50}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke"/>`;
      // neck out of the hump, head forward-down (12°), 탕건 low two-tier with the topknot, grey at the temple
      s += `<path d="M 214,214 C 222,200 236,190 248,188 L 262,200 C 250,206 240,216 234,226 Z" fill="${K.paper}" stroke="${ink}" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/><path d="M 238,214 C 244,206 252,200 262,200 L 258,206 C 250,210 244,216 240,222 Z" fill="${K.p300}"/>`;
      s += `<g transform="rotate(12 248 168)"><path d="M 214,152 C 213,130 230,120 248,121 C 268,122 281,138 280,158 C 279,178 266,192 248,194 C 230,195 215,182 214,164 Z" fill="${ink}" stroke="${ink}" stroke-width="3"/>` +
        T([220, 172, 224, 156, 232, 144], 1.8, 'mid', K.p300) + T([224, 180, 230, 164, 238, 154], 1.4, 'mid', K.p300) + T([272, 172, 268, 158, 262, 148], 1.4, 'mid', K.p300) +
        `<path d="M 278,160 C 285,164 286,176 280,182" fill="none" stroke="${K.p300}" stroke-width="2.6"/>` +
        `<path d="M 213,142 L 217,126 L 279,126 L 283,142 C 262,136 236,136 213,142 Z" fill="${ink}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M 229,126 L 232,110 L 265,110 L 268,126 Z" fill="${K.ink7}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M 239,112 L 238,124 M 249,112 L 249,124 M 258,112 L 259,124" stroke="${K.ink5}" stroke-width="1.2"/><path d="M 219,130 L 277,130" stroke="${K.ink5}" stroke-width="1.4"/></g>`;
    } else {
      // 'turn' — facing left, three-quarter front: crossed collar + paper 동정, 세조대 knot with two tassels to the knees
      const robe = [[150, 208], [124, 230], [112, 280], [108, 360], [102, 450], [94, 540], [92, 588], [140, 594], [200, 597], [258, 594], [298, 586], [292, 520], [282, 440], [276, 360], [272, 290], [258, 236], [226, 212], [190, 204]];
      s += `<path d="${bz(robe, true, 0.16)}" fill="${K.paper}" stroke="${ink}" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>`;
      if (o.hc) s += `<g clip-path="url(#${o.hc.clip(bz(robe, true, 0.16))})"><path d="M 214,206 C 230,300 236,420 230,600 L 320,600 L 320,200 Z" fill="${K.p300}"/>${seep([[88, 586], [140, 594], [200, 598], [258, 594], [302, 586]], 15, 6)}</g>`;
      // collar: ink band from the far side of the neck across to the near hip line, paper trim
      s += T([172, 214, 186, 262, 214, 318], 13, 'flat', ink) + T([168, 216, 182, 262, 210, 316], 3, 'start', K.p50);
      s += T([214, 318, 214, 450, 212, 586], 2.4, 'mid', ink);
      // 세조대: cord across the chest, knot and two tassels down to the knees
      s += `<path d="M 116,268 C 160,276 220,276 270,266" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`;
      s += `<path d="M 188,264 C 194,258 204,260 204,268 C 204,276 194,278 189,273 Z" fill="${ink}"/>` + T([192, 274, 186, 380, 190, 470], 3.4, 'start', ink) + T([200, 274, 204, 382, 210, 466], 3, 'start', ink);
      // far arm (front, screen-left) reaching toward 결: wide sleeve, bare hand at o.reach (local)
      const rh = o.reach || [50, 325];
      const sl = [[156, 232], [120, 262], [90, 296], [66, 318], [56, 336], [74, 352], [104, 338], [136, 312], [160, 282]];
      s += `<path d="${bz(sl, true, 0.18)}" fill="${K.paper}" stroke="${ink}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/>`;
      if (o.hc) s += seep([[60, 334], [70, 348], [80, 352]], 8, 11, [1, -0.3]);
      s += `<path d="M ${f(rh[0] + 18)},${f(rh[1] - 4)} C ${f(rh[0] + 8)},${f(rh[1] - 12)} ${f(rh[0] - 6)},${f(rh[1] - 10)} ${f(rh[0] - 12)},${f(rh[1] - 4)} C ${f(rh[0] - 16)},${f(rh[1])} ${f(rh[0] - 12)},${f(rh[1] + 6)} ${f(rh[0] - 4)},${f(rh[1] + 6)} C ${f(rh[0] + 6)},${f(rh[1] + 8)} ${f(rh[0] + 16)},${f(rh[1] + 6)} ${f(rh[0] + 20)},${f(rh[1] + 2)} Z" fill="${K.paper}" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke"/>`;
      // near arm (screen-right) hanging, the hand opening; the brush slips out below it
      const sr = [[262, 236], [282, 300], [290, 370], [292, 420], [270, 436], [256, 420], [254, 350], [246, 290]];
      s += `<path d="${bz(sr, true, 0.18)}" fill="${K.p300}" stroke="${ink}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/>`;
      if (o.hc) s += seep([[256, 426], [272, 434], [290, 424]], 9, 13, [-0.1, -1]);
      // the brush slipping out of the opening hand: its end still at the fingers, hanging down-left in the air, ≥ 50° off
      // the vertical so it never lines up with the drips at the void's edge (review 1 A6)
      s += bigBrush([279, 450], [181, 517], 6.5);
      s += `<path d="M 264,432 C 270,426 282,428 286,436 C 290,446 284,456 274,456 C 266,456 260,448 264,432 Z" fill="${K.paper}" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke"/>`;
      // 버선
      s += `<path d="M 118,588 C 130,580 152,580 164,588 C 160,596 132,600 118,597 Z" fill="${K.p50}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke"/>`;
      // head turned left; the face is erased (§4, erasedHead)
      s += o.face || '';
    }
    return s;
  }
  // the teacher's big brush (review 1 B4): bamboo handle (ink7) with three nodes, a dull lit streak, pointed ink bristles
  // (the last 30 % of the length, ≈ 43 % of the handle). From the handle end a to the bristle tip b, handle width w.
  // o.erased: no bristles — the handle runs the whole length and the ferrule end dries out (P3: the brush the teacher
  // left, its bristles erased)
  function bigBrush(a, b, w, o) {
    o = o || {};
    const L = V.len(V.sub(b, a)), u = V.norm(V.sub(b, a)), n = V.perp(u), hl = o.erased ? L : L * 0.7;
    const Q = (s, o2) => V.add(V.add(a, V.mul(u, s)), V.mul(n, o2));
    let s = `<path d="${P([Q(0, w / 2), Q(hl, w * 0.46), Q(hl, -w * 0.46), Q(0, -w / 2)])}" fill="${K.ink7}" stroke="${K.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
    s += stroke([Q(hl * 0.05, -w * 0.16), Q(hl * 0.5, -w * 0.18), Q(hl * 0.95, -w * 0.14)], Math.max(0.8, w * 0.16), { color: K.ink3, op: 0.9, seed: 4 });
    [0.24, 0.52, 0.8].forEach((t) => { s += `<path d="${P([Q(hl * t, w * 0.64), Q(hl * t, -w * 0.64)], false)}" stroke="${K.ink}" stroke-width="${f(w * 0.34)}" stroke-linecap="round"/>`; });
    if (o.erased) return s + dryTail(Q(hl, 0), u, w * 1.1, w * 4.5, 12);
    s += `<path d="${bz([Q(hl - 1, w * 0.6), Q(hl + (L - hl) * 0.3, w * 0.92), Q(hl + (L - hl) * 0.72, w * 0.5), Q(L, 0), Q(hl + (L - hl) * 0.72, -w * 0.46), Q(hl + (L - hl) * 0.3, -w * 0.86), Q(hl - 1, -w * 0.6)], true, 0.14)}" fill="${K.ink}"/>`;
    return s;
  }
  // teacher placed with the box ground point (200, 600) on (x, y) at scale sc; o.chips = erased-face fragments (P2)
  function teacherFig(c, pose, x, y, sc, o) {
    o = o || {};
    const hc = PN._hk.Ctx({ pitch: Math.max(6, 6.5 / sc), rough: 0.6, seed: 9 });
    let face = '', chips = '';
    if (pose === 'turn') {
      const eh = erasedHead({ seed: o.seed, c, sc });
      face = eh.s;
      // 10–16 stroke fragments of the face flow over the cheek and the ear toward the void, smaller as they go
      const r = rng(o.seed || 67), n = o.nChips || 14, reach = o.chipReach == null ? 120 : o.chipReach;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), src = eh.flow[i % eh.flow.length], d = reach * Math.pow(t, 1.15) + r() * 6;
        const q = [src[0] + 12 + d, src[1] - 6 + (r() - 0.5) * 18 + d * 0.12], size = 13 - 9 * t + r() * 2, ang = (r() - 0.5) * 1.6;
        const a = [q[0] - Math.cos(ang) * size / 2, q[1] - Math.sin(ang) * size / 2], b = [q[0] + Math.cos(ang) * size / 2, q[1] + Math.sin(ang) * size / 2];
        chips += stroke([a, b], Math.max(1.6, size * (0.24 + 0.12 * r())), { taper: i % 3 ? 'start' : 'mid', seed: i + 40, wob: 0.2 });
      }
    }
    const body = teacher(c, pose, Object.assign({ hc }, o));
    const tf = `translate(${f(x - 200 * sc)} ${f(y - 600 * sc)}) scale(${f(sc)})`;
    // the body takes the silhouette filter; the erased head stays outside it so no ink rim closes the open face (§4)
    const placed = `<g transform="${tf}">${hc.wrap(`<g ${hc.rough}>${body}</g>`)}</g>`;
    const head = face ? `<g transform="${tf}">${face}${chips}</g>` : '';
    return (o.sil ? `<g filter="${c.sil(o.sil)}">${placed}</g>` : placed) + head;
  }
  // the erased face of the teacher (P2), head-local to the 'turn' pose. Returns {s, flow:[[x,y]…] chip sources}
  // The head stays (탕건, hair with grey at the temple, ear, neck); the face place from the brow line to the chin is
  // gone: p50 with NO rim, open to the wall on the facing side (no contour), its edge against the hair torn and deeper
  // on the right (toward the void). Only two contour stubs remain, attached to the cap and to the neck band, drying out.
  function erasedHead(o) {
    o = o || {};
    const ink = K.ink;
    let s = '';
    // neck (paper, its shadow side p300) and the ink band under the jaw that parts the white face from the white collar
    s += `<path d="M 160,212 C 164,222 166,232 166,244 L 206,244 C 204,232 206,220 212,210 Z" fill="${K.paper}" stroke="${ink}" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/><path d="M 196,214 L 212,210 C 206,220 204,232 206,244 L 196,244 Z" fill="${K.p300}"/>`;
    s += `<path d="M 156,218 C 170,226 192,226 214,214 L 214,226 C 194,238 172,240 156,232 Z" fill="${ink}"/>`;
    // hair mass (back of the head, ink) whose front edge — the hairline toward the face — is eaten raggedly: bites of
    // uneven depth and spacing (deeper toward the void side), not a staircase (review 1 B5)
    const tear = [[160, 144], [163, 147], [170, 148], [172, 154], [180, 152], [182, 159], [181, 165], [188, 163], [194, 168], [191, 172], [194, 177], [201, 176], [199, 183], [197, 189], [204, 190], [206, 196], [200, 199], [202, 204], [208, 206], [205, 213]];
    const hair = [[168, 130], [188, 122], [210, 124], [228, 134], [239, 150], [242, 170], [238, 190], [228, 206], [214, 216]].concat(tear.slice().reverse());
    s += `<path d="${P(hair)}" fill="${ink}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`;
    s += PN.taper([222, 146, 230, 162, 230, 180], 2, 'mid', K.p300) + PN.taper([214, 150, 222, 166, 220, 184], 1.5, 'mid', K.p300) + PN.taper([232, 186, 230, 196, 224, 206], 1.3, 'mid', K.p300);
    // the ear sits on the head's outline (its outer rim is the silhouette edge, so no white island inside the hair, A7);
    // its front half under the hair
    s += `<path d="M 233,167 C 240,162 248,168 248.6,180 C 249,191 243,199 235,198 C 237.6,190 237.4,175 233,167 Z" fill="${K.paper}"/>` +
      stroke([[235, 165], [244.6, 166.6], [249.4, 180], [245, 194], [236, 199.4]], 2, { taper: 'mid', seed: 6 }) + stroke([[241, 172], [243.4, 180], [241, 189]], 1.2, { seed: 7 });
    // 탕건 sitting on the crown: a low front tier and a higher back tier, straight sides, mesh hinted by thin ink5
    // lines — a cap, not a bun; height ≤ 0.3 × head
    s += `<g transform="rotate(-8 200 136)"><path d="M 162,146 C 164,136 168,130 176,128 L 238,128 C 244,132 246,140 246,150 C 222,140 188,140 162,146 Z" fill="${ink}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<path d="M 196,129 L 199,115 L 234,115 L 238,129 Z" fill="${K.ink7}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<path d="M 207,117 L 206,127 M 217,117 L 217,127 M 227,117 L 228,127" stroke="${K.ink5}" stroke-width="1.2"/>` +
      `<path d="M 172,135 C 196,131 222,131 242,137" fill="none" stroke="${K.ink5}" stroke-width="1.3"/></g>`;
    // the white face place: torn edge against the hair (follows the hair's bites), open on the facing side (no line)
    const face = [[158, 145]].concat(tear.slice(1), [[190, 219], [172, 221], [161, 218], [155, 211], [150, 208], [148, 199], [142, 196], [145, 188], [139, 182], [143, 176], [141, 168], [147, 163], [144, 156], [151, 151]]);
    // on the open (facing) side the wall's paint scatters into the white the way it does at the void's edge (§2.1):
    // two rings of paper dots, 46 % then 22 %, so the face place has no clean outline to read as a mask
    if (o.c) {
      const cx = 174, cy = 184, grow = (k) => face.map((q) => [cx + (q[0] - cx) * k, cy + (q[1] - cy) * k]);
      const ring = (A, B) => P(A) + ' ' + P(B.slice().reverse());
      const open = o.c.clip('M 96,150 L 186,150 L 180,213 L 96,213 Z'), pit = 6 / (o.sc || 0.8);
      s += `<g clip-path="${open}"><path d="${ring(grow(1.17), face)}" fill="${o.c.dot(0.46, K.p50, pit)}" fill-rule="evenodd"/><path d="${ring(grow(1.34), grow(1.17))}" fill="${o.c.dot(0.22, K.p50, pit)}" fill-rule="evenodd"/></g>`;
    }
    s += `<path d="${P(face)}" fill="${K.p50}"/>`;
    // a few hairs broken off at the torn edge, sticking a little into the white (attached to the edge, never floating)
    [[[183, 161], [178.4, 163.2], [175.2, 166.4]], [[196, 180], [191.4, 181.4]], [[203, 194], [198.2, 196.8], [195, 197.4]]].forEach((q, i) => { s += stroke(q, 1.3, { taper: 'start', seed: 50 + i }); });
    // two contour stubs that dry out where the face was: down from the cap's front edge, up from the neck band
    s += dryStroke([[160, 141], [151, 147], [145, 156], [142, 166]], 3.6, { taper: 'start', dryFrom: 0.05, strands: 3, seed: 3 });
    s += dryStroke([[162, 227], [153, 221], [147, 211], [145, 201]], 3.8, { taper: 'start', dryFrom: 0.05, strands: 3, seed: 5 });
    const flow = [[200, 176], [206, 194], [204, 208], [196, 168], [210, 186]];
    return { s, flow };
  }

  // ---------------------------------------------------------------- 6. 먹귀 born of erased lines (§2.5): kit art LOD as it is
  // feet point of the kit box lands on (x, y) at scale sc; the body below `cut` (fraction of the drawn height from the
  // feet, wavy) is replaced by a liquid ink column that pours into a puddle.
  // o.span = [x0, x1]: fractions of the box width the cut (and so the top of the ink column) spans, so the column is no
  // wider than the creature (review 1 A5); o.slant: the cut runs higher at the rear (left) than at the front, so a
  // creature crawls out head first (the dog: head and front legs whole, the rear still ink)
  function wraith(c, role, x, y, sc, o) {
    o = o || {};
    const E = PN.enemies, m = E.meta(1, role), feet = m.feet, box = m.box;
    const art = E.draw(1, role, { lod: 'art', halo: false, shadow: false });
    const r = rng(o.seed || 9), hgt = feet[1] - (o.top || 0), sp = o.span || [-0.1, 1.1], sl = o.slant || 0;
    const wave = [];
    for (let i = 0; i <= 12; i++) {
      const u = sp[0] + (sp[1] - sp[0]) * i / 12, xx = u * box[0], cutY = feet[1] - ((o.cut || 0.45) + sl * (0.5 - u)) * hgt;
      wave.push([xx, cutY + Math.sin(i * 1.7 + r() * 2) * 6 + (r() - 0.5) * 5]);
    }
    const keep = P([[-40, -80]].concat([[box[0] + 40, -80], [box[0] + 40, wave[12][1]]], wave.slice().reverse(), [[-40, wave[0][1]]]));
    let col = `<path d="${bz(wave.concat(o.column || [[box[0] * 0.7, feet[1] + 6], [box[0] * 0.3, feet[1] + 6]]), true, 0.12)}" fill="${K.ink}"/>`;
    const cutAt = (xx) => { let k = 0; while (k < 11 && wave[k + 1][0] < xx) k++; const a = wave[k], b = wave[k + 1]; return a[1] + (b[1] - a[1]) * clamp((xx - a[0]) / ((b[0] - a[0]) || 1), 0, 1); };
    (o.drips || []).forEach((d, i) => { col += drip(d[0], cutAt(d[0]) + 4, feet[1] + 2, d[1] || 3, i + 2); });
    const body = `<g clip-path="${c.clip(keep)}">${art}</g>`;
    const inner = col + body;
    return `<g transform="translate(${f(x - feet[0] * sc)} ${f(y - feet[1] * sc)}) scale(${f(sc)})">${o.sil ? `<g filter="${c.sil(o.sil / sc)}">${inner}</g>` : inner}</g>`;
  }

  // paper grain (brief §1.7 / §13-4, review 2 M5): over the background only (never the figures, faces, needles, the void
  // or the margin). The grain matches the composed panels: PN.env.landmark lays grainDef(…, 0.9) at 0.055 on its 480 × 270
  // units, i.e. 2.5 px grains in the bake, so on this 1200 × 675 box the frequency is 0.9 / 2.5 = 0.36 at α 0.055. Off
  // unless opts.grain — the main session turns it on for all six only if every baked panel stays ≤ 400 KiB.
  // pointer-events none keeps it out of the C7 census.
  function grain(c, o, w) {
    if (!o || !o.grain) return '';
    const gid = c.uid('g');
    c.defs.push(PN.env.grainDef(gid, 4, 0.36));
    return `<rect x="0" y="0" width="${w || W}" height="${H}" filter="url(#${gid})" opacity="0.055" pointer-events="none"/>`;
  }

  // ---------------------------------------------------------------- 7. panels (brief §5)
  const PANELS = {};
  const LAYERS = ['bg', 'mid', 'fig', 'fx'];
  const META = {};
  const poly3 = (cam, pts) => pts.map((q) => cam.p(q[0], q[2], q[1]));   // [X, Y, Z] → screen
  // an axis-aligned box [X0, X1] × [Y0, Y1] × [Z0, Z1] → its visible faces (front z0, top, the side toward the vp)
  function box3(cam, X0, X1, Y0, Y1, Z0, Z1) {
    const front = poly3(cam, [[X0, Y1, Z0], [X1, Y1, Z0], [X1, Y0, Z0], [X0, Y0, Z0]]);
    const top = poly3(cam, [[X0, Y1, Z0], [X1, Y1, Z0], [X1, Y1, Z1], [X0, Y1, Z1]]);
    const sideX = (X0 + X1) / 2 < 0 ? X1 : X0;   // left of the vp we see the right side and vice versa
    const side = poly3(cam, [[sideX, Y1, Z0], [sideX, Y1, Z1], [sideX, Y0, Z1], [sideX, Y0, Z0]]);
    const under = cam.h > Y1;
    return { front, top: under ? top : null, side, bottom: under ? null : poly3(cam, [[X0, Y0, Z0], [X1, Y0, Z0], [X1, Y0, Z1], [X0, Y0, Z1]]) };
  }
  // P1/P2 room (1장 필방): one camera, back wall x 180–1000 / y 90–420, door in the right wall (brief §5.1)
  const ROOM = { cam: camera(790, 300, 950, 325), Zb: 2573, XL: -1652, XR: 569, Hc: 894 };
  const DESK = { X0: -700, X1: -200, Y: 120, Z0: 1350, Z1: 1550 };
  const POST = { X0: -858, X1: -808, Z0: 1267, Z1: 1317 };
  function room(c, st) {
    const cam = ROOM.cam, R = ROOM, p = (X, Y, Z) => cam.p(X, Z, Y);
    const out = { bg: '', mid: '', recede: [] };
    // ceiling (ink), back wall (plaster in timber bays, one value step under the paper of the figures, review 1 A8),
    // left wall + window, right wall + door, floor (장판, mid)
    const wallTone = mix(C1.light, C1.base, 0.5);
    let s = `<rect x="-2" y="-2" width="${W + 4}" height="${H + 4}" fill="${K.ink7}"/>`;
    const bw = [p(R.XL, R.Hc, R.Zb), p(R.XR, R.Hc, R.Zb), p(R.XR, 0, R.Zb), p(R.XL, 0, R.Zb)];
    const Zl = 1700, Zr = 1180;
    const lw = [p(R.XL, R.Hc, Zl), p(R.XL, R.Hc, R.Zb), p(R.XL, 0, R.Zb), p(R.XL, 0, Zl)];
    const rw = [p(R.XR, R.Hc, R.Zb), p(R.XR, R.Hc, Zr), p(R.XR, 0, Zr), p(R.XR, 0, R.Zb)];
    const floor = [p(R.XL, 0, 760), p(R.XR + 600, 0, 760), p(R.XR, 0, Zr), p(R.XR, 0, R.Zb), p(R.XL, 0, R.Zb), p(R.XL, 0, Zl)];
    s += `<path d="${P(floor)}" fill="${C1.base}"/>`;
    // floor seams (장판 sheets): long seams to the vp, cross seams at growing depth — brush lines, the long ones drying
    // out (비백) as they near the back wall (2차)
    let seams = '';
    for (let X = -1500, i = 0; X <= 560; X += 340, i++) {
      const a = p(X, 0, 780), b = p(X, 0, R.Zb), m = V.lerp(a, b, 0.62);
      seams += stroke([a, V.lerp(a, m, 0.5), m], 2.2, { color: C1.deep, taper: 'none', wob: 0.12, seed: 200 + i }) + dryStroke([m, V.lerp(m, b, 0.5), b], 1.7, { color: C1.deep, taper: 'start', dryFrom: 0.2, strands: 2, seed: 210 + i });
      out.recede.push([a, b]);
    }
    [900, 1040, 1220, 1460, 1780, 2200].forEach((Z, i) => {
      const a = p(R.XL, 0, Z), b = p(R.XR, 0, Z), k = 0.3 + 0.4 * ((i * 37) % 10) / 10;
      // each cross seam in two strokes with a small gap, as a brush would lay it
      seams += stroke([a, V.lerp(a, b, k * 0.5), V.lerp(a, b, k)], i < 2 ? 1.9 : 1.4, { color: C1.deep, taper: 'soft', wob: 0.15, seed: 220 + i }) + stroke([V.lerp(a, b, k + 0.012), V.lerp(a, b, (k + 1) / 2), b], i < 2 ? 1.9 : 1.4, { color: C1.deep, taper: 'soft', wob: 0.15, seed: 230 + i });
    });
    s += seams;
    s += `<path d="${P(bw)}" fill="${wallTone}"/>`;
    s += `<path d="${P(lw)}" fill="${C1.base}"/><path d="${P(rw)}" fill="${C1.base}"/>`;
    // the back wall in two bays (review 2 M3): the window bay a little lighter (X −1652…−600, behind 결's ink head in
    // both P1 and P2), the rest in C1 base (behind the teacher, so the paper robe parts from it). The timber posts stand
    // where no head is: at the manuscript cabinet's right end (X −600, x ≈ 568, hidden below the cabinet top) and in the
    // corner by the door (X 549, x ≈ 993) — ≥ 25 px clear of every head (head–background rule, brief §13-3)
    const bay = (Xa, Xb, Ya, Yb, col) => `<path d="${P([p(Xa, Yb, R.Zb), p(Xb, Yb, R.Zb), p(Xb, Ya, R.Zb), p(Xa, Ya, R.Zb)])}" fill="${col}"/>`;
    s += bay(R.XL, -600, 260, R.Hc, mix(C1.light, C1.base, 0.25)) + bay(-600, R.XR, 260, R.Hc, C1.base);
    // the lower wall stays in the room's shade (wainscot), only the upper plaster takes the window light; skirting
    s += bay(R.XL, -600, 0, 260, C1.base) + bay(-600, R.XR, 0, 260, mix(C1.base, C1.deep, 0.35));
    s += stroke([p(R.XL, 260, R.Zb), p(-600, 260, R.Zb), p(R.XR, 260, R.Zb)], 2.4, { color: C1.deep, taper: 'soft', wob: 0.1, seed: 240 });
    // the timber posts, a dry grain stroke down each (2차)
    [-600, 549].forEach((X, i) => { s += bay(X - 20, X + 20, 0, R.Hc, K.ink7) + dryStroke([p(X - 4, R.Hc - 40, R.Zb), p(X - 6, R.Hc / 2, R.Zb), p(X - 3, 40, R.Zb)], 2, { color: K.ink5, taper: 'mid', dryFrom: 0.3, strands: 2, seed: 241 + i }); });
    s += `<path d="${P([p(R.XL, 0, R.Zb), p(R.XR, 0, R.Zb), p(R.XR, 30, R.Zb), p(R.XL, 30, R.Zb)])}" fill="${C1.deep}"/>`;
    s += `<path d="${P([p(R.XL, 0, Zl), p(R.XL, 0, R.Zb)], false)}" stroke="${K.ink}" stroke-width="2.4"/><path d="${P([p(R.XR, 0, Zr), p(R.XR, 0, R.Zb)], false)}" stroke="${K.ink}" stroke-width="2.4"/>`;
    out.recede.push([p(R.XL, 0, Zl), p(R.XL, 0, R.Zb)], [p(R.XR, 0, Zr), p(R.XR, 0, R.Zb)], [p(R.XL, R.Hc, Zl), p(R.XL, R.Hc, R.Zb)], [p(R.XR, R.Hc, Zr), p(R.XR, R.Hc, R.Zb)]);
    // high lattice window (띠살): paper panes between uneven bars, the source of the light
    const wq = (X, Y, Z) => p(X, Y, Z);
    const win = [wq(R.XL, 890, 2038), wq(R.XL, 890, 2414), wq(R.XL, 477, 2414), wq(R.XL, 477, 2038)];
    s += `<path d="${P(win)}" fill="${K.p50}"/>`;
    // 띠살: dense uprights 14–18 px apart (uneven), two cross rails at different heights — never an even grid
    let bars = '';
    const zs = [2038, 2068, 2101, 2128, 2160, 2196, 2224, 2262, 2296, 2330, 2370, 2414];
    zs.forEach((Z, i) => { const a = wq(R.XL, 890, Z), b = wq(R.XL, 477, Z); bars += `<path d="${P([a, b], false)}" stroke="${K.ink7}" stroke-width="${i === 0 || i === zs.length - 1 ? 7 : 2.4}"/>`; });
    [[586, 4.4], [808, 3.2], [890, 7], [477, 7]].forEach(([Y, w]) => { const a = wq(R.XL, Y, 2038), b = wq(R.XL, Y, 2414); bars += `<path d="${P([a, b], false)}" stroke="${K.ink7}" stroke-width="${w}"/>`; out.recede.push([a, b]); });
    s += bars;
    // ceiling beams: one cross beam near the top, long beams running to the vp
    let beams = '';
    [-1150, -380, 320].forEach((X) => {
      const sx = X < 0 ? 26 : -26;
      const q = [p(X - 26, R.Hc, 1250), p(X + 26, R.Hc, 1250), p(X + 26, R.Hc, R.Zb), p(X - 26, R.Hc, R.Zb)];
      const sideQ = [p(X + sx, R.Hc, 1250), p(X + sx, R.Hc, R.Zb), p(X + sx, R.Hc - 48, R.Zb), p(X + sx, R.Hc - 48, 1250)];
      const bot = [p(X - 26, R.Hc - 48, 1250), p(X + 26, R.Hc - 48, 1250), p(X + 26, R.Hc - 48, R.Zb), p(X - 26, R.Hc - 48, R.Zb)];
      beams += `<path d="${P(q)}" fill="${K.ink}"/><path d="${P(sideQ)}" fill="${K.ink}"/><path d="${P(bot)}" fill="${K.ink}"/>`;
      out.recede.push([p(X, R.Hc - 48, 900), p(X, R.Hc - 48, R.Zb)]);
    });
    beams += `<path d="${P([p(R.XL - 300, R.Hc, 2150), p(R.XR + 300, R.Hc, 2150), p(R.XR + 300, R.Hc - 70, 2150), p(R.XL - 300, R.Hc - 70, 2150)])}" fill="${K.ink}"/>`;
    s += beams;
    // back wall furniture: a low manuscript cabinet (left; its top stays under 결's head, which reads on lit plaster)
    // and the brush rack with five brushes (between the cabinet and the teacher)
    let shelf = '';
    const sh = { X0: -1560, X1: -560, Z: R.Zb - 30 };
    shelf += `<path d="${P([p(sh.X0, 236, sh.Z), p(sh.X1, 236, sh.Z), p(sh.X1, 0, sh.Z), p(sh.X0, 0, sh.Z)])}" fill="${K.ink7}"/>`;
    shelf += `<path d="${P([p(sh.X0, 236, sh.Z), p(sh.X1, 236, sh.Z), p(sh.X1, 236, sh.Z - 140), p(sh.X0, 236, sh.Z - 140)])}" fill="${C1.deep}"/>`;
    [120].forEach((Y, i) => {
      const r = rng(31 + i);
      let X = sh.X0 + 20;
      while (X < sh.X1 - 50) {
        const w = 36 + r() * 52, h = 50 + r() * 40;
        // bundles that touch 결's coat (x ≥ 215 in P1, behind the risen figure in P2) one value step down (review 1 B10)
        const near = p(X + w, 0, sh.Z)[0] > 215, k = r();
        if (r() > 0.18) shelf += `<path d="${P([p(X, Y - 6 + h, sh.Z), p(X + w, Y - 6 + h, sh.Z), p(X + w, Y - 6, sh.Z), p(X, Y - 6, sh.Z)])}" fill="${near ? (k > 0.5 ? C1.light : mix(C1.light, C1.base, 0.45)) : (k > 0.5 ? K.paper : K.p300)}" stroke="${K.ink}" stroke-width="1.2"/>`;
        X += w + 8 + r() * 16;
      }
      shelf += `<path d="${P([p(sh.X0, Y - 6, sh.Z), p(sh.X1, Y - 6, sh.Z)], false)}" stroke="${K.ink}" stroke-width="3"/>`;
    });
    // bundles tied on the cabinet top
    const rb = rng(77);
    let X = sh.X0 + 60;
    while (X < sh.X1 - 120) {
      const w = 70 + rb() * 70, h = 26 + rb() * 34, Zc = sh.Z - 40 - rb() * 60;
      // (the ones right behind 결's shoulders and the P2 scarf tails one step down, B10; the rest stay paper so the ink
      // hair still reads against light)
      const xa = p(X, 236, Zc)[0], xb = p(X + w, 236, Zc)[0], behind = xb > 300 && xa < 480;
      shelf += `<path d="${P([p(X, 236 + h, Zc), p(X + w, 236 + h, Zc), p(X + w, 236, Zc), p(X, 236, Zc)])}" fill="${behind ? C1.light : K.paper}" stroke="${K.ink}" stroke-width="1.6"/><path d="${P([p(X + w * 0.5, 236 + h, Zc), p(X + w * 0.5, 236, Zc)], false)}" stroke="${K.ink}" stroke-width="1.4"/>`;
      X += w + 40 + rb() * 60;
    }
    s += shelf;
    let rack = '';
    // the brush rack moved left of the teacher (X −480…−220, x ≈ 613–709, review 2 M3): five brushes at uneven gaps and
    // lengths, their tips ending by y ≈ 262 — ≥ 30 px above P2's gap between the hands and 결's glove
    const rk = { X0: -480, X1: -220, Y: 660, Z: R.Zb - 6 };
    rack += `<path d="${P([p(rk.X0, rk.Y + 12, rk.Z), p(rk.X1, rk.Y + 12, rk.Z), p(rk.X1, rk.Y - 12, rk.Z), p(rk.X0, rk.Y - 12, rk.Z)])}" fill="${K.ink}"/>`;
    [[-452, 150], [-398, 118], [-352, 172], [-290, 132], [-244, 160]].forEach(([X, len], i) => {
      const a = p(X, rk.Y - 10, rk.Z), b = p(X, rk.Y - len, rk.Z), tipB = p(X, rk.Y - len - 60, rk.Z);
      rack += `<path d="${P([a, b], false)}" stroke="${K.ink7}" stroke-width="${i % 3 ? 3 : 4}"/>` + stroke([b, V.lerp(b, tipB, 0.5), tipB], i % 2 ? 7 : 9, { taper: 'end', seed: i + 2 });
    });
    s += rack;
    // right wall sliding door (창호): ink frame, paper panes, open 30–50 px onto the alley (plaster + torn poster end)
    const dz0 = 1330, dz1 = 2280, dH = 560;
    const door = [p(R.XR, dH, dz0), p(R.XR, dH, dz1), p(R.XR, 0, dz1), p(R.XR, 0, dz0)];
    s += `<path d="${P(door)}" fill="${K.ink}"/>`;
    const gapZ0 = 1560, gapZ1 = 1790;
    const pane = (Za, Zb) => `<path d="${P([p(R.XR, dH - 26, Za), p(R.XR, dH - 26, Zb), p(R.XR, 26, Zb), p(R.XR, 26, Za)])}" fill="${K.paper}"/>`;
    s += pane(dz0 + 40, gapZ0 - 24) + pane(gapZ1 + 24, dz1 - 40);
    // the gap (≈ 40 px): the alley outside — a slice of plaster in the dawn and the end of a torn poster
    s += `<path d="${P([p(R.XR, dH - 26, gapZ0), p(R.XR, dH - 26, gapZ1), p(R.XR, 26, gapZ1), p(R.XR, 26, gapZ0)])}" fill="${C1.deep}"/>`;
    s += `<path d="${P([p(R.XR + 30, dH - 26, gapZ0), p(R.XR + 30, dH - 26, gapZ1), p(R.XR + 30, 80, gapZ1), p(R.XR + 30, 80, gapZ0)])}" fill="${C1.light}"/>`;
    s += `<path d="${P([p(R.XR + 30, 400, gapZ0 + 40), p(R.XR + 30, 420, gapZ1), p(R.XR + 30, 250, gapZ1), p(R.XR + 30, 290, gapZ0 + 80), p(R.XR + 30, 330, gapZ0 + 50)])}" fill="${K.p300}" stroke="${K.ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
    // door lattice: a few uprights and two rails at different heights per leaf (no even grid, no crosses of equal bars)
    let lat = '';
    [dz0 + 130, gapZ1 + 150, gapZ1 + 330].forEach((Z) => { lat += `<path d="${P([p(R.XR, dH - 26, Z), p(R.XR, 26, Z)], false)}" stroke="${K.ink7}" stroke-width="2"/>`; });
    [[430, dz0 + 40, gapZ0 - 24], [190, dz0 + 40, gapZ0 - 24], [380, gapZ1 + 24, dz1 - 40], [120, gapZ1 + 24, dz1 - 40]].forEach(([Y, Za, Zb], i) => { const a = p(R.XR, Y, Za), b = p(R.XR, Y, Zb); lat += `<path d="${P([a, b], false)}" stroke="${K.ink7}" stroke-width="${i % 2 ? 1.8 : 2.4}"/>`; out.recede.push([a, b]); });
    s += lat;
    out.bg = s;
    out.door = { gap: [p(R.XR, 300, (gapZ0 + gapZ1) / 2)] };
    return out;
  }
  // P1/P2 furniture in front of the back wall: the post with the peg (흑립 + empty bandolier), the desk
  function postAndPeg(c, hc) {
    const cam = ROOM.cam, p = (X, Y, Z) => cam.p(X, Z, Y), Q = POST;
    let s = '';
    const front = [p(Q.X0, 1200, Q.Z0), p(Q.X1, 1200, Q.Z0), p(Q.X1, 0, Q.Z0), p(Q.X0, 0, Q.Z0)];
    const side = [p(Q.X1, 1200, Q.Z0), p(Q.X1, 1200, Q.Z1), p(Q.X1, 0, Q.Z1), p(Q.X1, 0, Q.Z0)];
    s += `<path d="${P(side)}" fill="${K.ink5}"/><path d="${P(front)}" fill="${C1.deep}" stroke="${K.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    s += stroke([V.add(front[0], [6, 40]), V.add(front[3], [8, -60])], 2.2, { color: C1.light, op: 0.6, seed: 4 });
    // wood grain: two dry strokes down the lit face (2차)
    s += dryStroke([V.add(front[0], [22, 90]), V.lerp(V.add(front[0], [21, 90]), V.add(front[3], [22, -40]), 0.5), V.add(front[3], [24, -40])], 2.2, { color: K.ink5, taper: 'mid', dryFrom: 0.25, strands: 2, seed: 6 }) +
      dryStroke([V.add(front[0], [32, 300]), V.add(front[0], [33, 420]), V.add(front[0], [31, 520])], 1.6, { color: K.ink5, taper: 'mid', dryFrom: 0.3, strands: 2, seed: 8 });
    // peg (못걸이) and the empty bandolier hanging from it in a long U (loops only, no needles)
    const peg = p(Q.X1 + 4, 440, Q.Z0 + 20);
    s += `<path d="M${pt(V.add(peg, [-6, -3]))} L${pt(V.add(peg, [16, -6]))} L${pt(V.add(peg, [17, 1]))} L${pt(V.add(peg, [-6, 4]))} Z" fill="${K.ink}"/>`;
    const u0 = V.add(peg, [10, 0]), uL = V.add(peg, [-2, 150]), uR = V.add(peg, [26, 144]);
    s += stroke([u0, V.add(peg, [0, 70]), uL, V.add(uL, [14, 12]), V.add(uR, [0, 8]), uR, V.add(peg, [24, 70]), V.add(u0, [4, 0])], 7, { taper: 'none', wob: 0.04, seed: 7 });
    [0.18, 0.34, 0.5, 0.62, 0.8].forEach((t, i) => {
      const a = i < 3 ? V.lerp(u0, uL, t * 1.6) : V.lerp(uR, V.add(u0, [4, 0]), (t - 0.5) * 2);
      s += `<path d="M${pt(V.add(a, [-6, -2]))} L${pt(V.add(a, [6, -2]))} L${pt(V.add(a, [6, 3]))} L${pt(V.add(a, [-6, 3]))} Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.2"/>`;
    });
    // 흑립 on the peg: the kit hat34 at head scale 0.78, crown up, brim ellipse readable against the plaster
    s += `<g transform="translate(190 ${f(255 + 34 * 0.78)}) scale(0.78)">${PN._hk.hat34(hc, 7)}</g>`;
    return s;
  }
  function desk(c) {
    const cam = ROOM.cam, D = DESK, b = box3(cam, D.X0, D.X1, D.Y - 14, D.Y, D.Z0, D.Z1), p = (X, Y, Z) => cam.p(X, Z, Y);
    let s = '';
    // shadow under the desk and its legs (ink), the front apron (ink7), the top (ink5 wood) with paper on it
    s += `<path d="${P([p(D.X0 - 10, 0, D.Z0 + 10), p(D.X1 + 40, 0, D.Z0 + 10), p(D.X1 + 80, 0, D.Z1 + 30), p(D.X0, 0, D.Z1 + 30)])}" fill="${K.ink}" opacity="0.55"/>`;
    [[D.X0 + 10, D.Z0 + 10], [D.X1 - 30, D.Z0 + 10], [D.X1 - 30, D.Z1 - 20]].forEach(([X, Z]) => { s += `<path d="${P([p(X, D.Y - 14, Z), p(X + 22, D.Y - 14, Z), p(X + 22, 0, Z), p(X, 0, Z)])}" fill="${K.ink}"/>`; });
    s += `<path d="${P([p(D.X0 + 30, D.Y - 14, D.Z0), p(D.X1 - 20, D.Y - 14, D.Z0), p(D.X1 - 20, D.Y - 50, D.Z0), p(D.X0 + 30, D.Y - 50, D.Z0)])}" fill="${K.ink7}"/>`;
    s += `<path d="${P(b.side)}" fill="${K.ink}"/><path d="${P(b.front)}" fill="${K.ink}"/><path d="${P(b.top)}" fill="${K.ink5}"/>`;
    return { s, top: b.top, p };
  }
  function deskItems(c, o) {
    o = o || {};
    const p = (X, Y, Z) => ROOM.cam.p(X, Z, Y), Y = DESK.Y + 1;
    let s = '';
    // the original sheets (stack, right) and the copy under the brush (left)
    s += `<path d="${P([p(-330, Y, 1365), p(-205, Y, 1372), p(-215, Y, 1530), p(-340, Y, 1520)])}" fill="${K.paper}" stroke="${K.ink}" stroke-width="1"/>`;
    s += `<path d="${P([p(-322, Y + 2, 1375), p(-212, Y + 2, 1380), p(-222, Y + 2, 1525), p(-332, Y + 2, 1516)])}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1"/>`;
    const copy = [p(-500, Y, 1500), p(-350, Y, 1500), p(-350, Y, 1362), p(-500, Y, 1362)];
    const ms = manuscript(copy, { rules: 9, cols: o.cols == null ? 6 : o.cols, half: 0.6, seed: 5, gw: 1.3, rule: 0.8 });
    s += ms.s;
    // inkstone (ink, a thin lit lip) and the water dropper; the needle case with its lid open (5 teal eyes)
    if (o.inkstone !== false) {
      s += `<path d="${P([p(-195, Y, 1420), p(-150, Y, 1420), p(-150, Y, 1500), p(-195, Y, 1500)])}" fill="${K.ink}"/>` + `<path d="${P([p(-195, Y + 12, 1420), p(-150, Y + 12, 1420)], false)}" stroke="${K.ink5}" stroke-width="1.4"/>`;
    }
    s += `<path d="${P([p(-260, Y, 1376), p(-226, Y, 1376), p(-226, Y + 26, 1376), p(-260, Y + 26, 1376)])}" fill="${K.p300}" stroke="${K.ink}" stroke-width="1.2"/>`;
    return { s, tip: ms.tip };
  }
  // needle case on the desk (review 1 B3): a flat lacquer box with its lid propped open behind; five needles pinned
  // upright in the lid's p300 lining, so their paper bodies (21 px, ink tips) read at 0.6× and the teal eyes stay small
  // (r ≤ 1.2) at the top ends
  function needleCase(x, y) {
    let s = `<path d="${P([[x - 29, y - 1], [x + 29, y - 2], [x + 31, y + 5], [x - 30, y + 6]])}" fill="${K.ink7}" stroke="${K.ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
    s += `<path d="${P([[x - 30, y + 6], [x + 31, y + 5], [x + 31, y + 9], [x - 30, y + 10]])}" fill="${K.ink}"/>`;
    // the lid: ink7 frame, p300 lining facing us and the window light
    s += `<path d="${P([[x - 28, y - 31], [x + 28, y - 32], [x + 29, y - 2], [x - 29, y - 1]])}" fill="${K.ink7}" stroke="${K.ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
    s += `<path d="${P([[x - 25, y - 28], [x + 25, y - 29], [x + 26, y - 5], [x - 26, y - 4]])}" fill="${K.p300}"/>`;
    const r = rng(19);
    for (let i = 0; i < 5; i++) {
      const xx = x - 18 + i * 9 + (r() - 0.5) * 1.6, tilt = (r() - 0.5) * 8, d = V.rot([0, 1], tilt), top = [xx, y - 27], tip = V.add(top, V.mul(d, 21));
      const nn = V.perp(d), Q = (t, o) => V.add(V.lerp(top, tip, t), V.mul(nn, o));
      s += `<path d="${P([Q(0, 1.1), Q(0.66, 1), Q(1, 0), Q(0.66, -1), Q(0, -1.1)])}" fill="${K.p50}" stroke="${K.ink}" stroke-width="0.8" stroke-linejoin="round" paint-order="stroke"/>`;
      s += `<path d="${P([Q(0.7, 0.85), Q(1, 0), Q(0.7, -0.85)])}" fill="${K.ink}"/>`;
      s += `<ellipse cx="${f(Q(0.1, 0)[0])}" cy="${f(Q(0.1, 0)[1])}" rx="0.7" ry="1.15" fill="${K.ally}" stroke="${K.ink}" stroke-width="0.5"/>`;
    }
    return s;
  }

  PANELS['prologue-1'] = function (c, o) {
    const R = room(c), hc = PN._hk.Ctx({ pitch: 8, rough: 0.5, seed: 3 }), dk = desk(c), di = deskItems(c);
    const L = { bg: R.bg + grain(c, o), mid: '', fig: '', fx: '' };
    L.mid += hc.wrap(postAndPeg(c, hc));
    L.mid += dk.s + di.s + needleCase(600, 438);
    // 결 kneeling at the desk, seen from behind (lost profile), the near hand's brush on the copy
    const tip = [492, 440];
    L.fig += heroBack(c, P1Q(tip), { x: 332, y: 544, s: 0.75, sil: 1.4 });
    // the teacher by the door, from behind, hands at the small of the back with the brush
    L.fig += teacherFig(c, 'back', 875, 560, 0.8, { sil: 1.4 });
    // the brush tip: the focus (paper under it is the brightest small contrast)
    L.fx += '';
    return L;
  };
  // P2 — same camera; the void comes in from the right edge (x ≈ 880 top → 930 bottom), the teacher's face is gone
  const P2EDGE = [[884, -40], [880, 0], [893, 52], [874, 104], [902, 160], [917, 214], [905, 262], [928, 318], [921, 372], [938, 430], [924, 488], [940, 546], [928, 604], [944, 660], [936, 720]];
  PANELS['prologue-2'] = function (c, o) {
    const R = room(c), hc = PN._hk.Ctx({ pitch: 8, rough: 0.5, seed: 3 }), dk = desk(c), di = deskItems(c, { inkstone: false });
    const ve = voidEdge(c, P2EDGE, { seed: 29, yMin: 0, yMax: 600, flow: 0.25 });
    let scene = R.bg + grain(c, o) + hc.wrap(postAndPeg(c, hc)) + dk.s + di.s + needleCase(600, 438);
    // the overturned inkstone: ink tongues over the desk edge and falls to the floor (the biggest new ink mass)
    const pp = (X, Y, Z) => ROOM.cam.p(X, Z, Y);
    scene += `<path d="${bz([pp(-250, 121, 1500), pp(-150, 121, 1470), pp(-200, 121, 1360), pp(-260, 121, 1352), pp(-330, 121, 1356), pp(-380, 121, 1400)], true, 0.2)}" fill="${K.ink}"/>`;
    scene += `<path d="${bz([[560, 446], [584, 444], [612, 446], [640, 446], [636, 468], [626, 492], [618, 520], [606, 528], [600, 506], [592, 484], [578, 470], [560, 462]], true, 0.18)}" fill="${K.ink}"/>`;
    scene += puddle(612, 556, 64, 16, 21) + drip(612, 520, 548, 3.4, 5) + drip(632, 470, 552, 2.6, 7);
    scene += `<g transform="rotate(-24 560 470)"><path d="M 548,474 L 598,474 L 598,479 L 548,479 Z" fill="${K.ink7}" stroke="${K.ink}" stroke-width="1.6"/><path d="M 598,472 C 606,472 616,475 621,476.5 C 616,478 606,481 598,481 Z" fill="${K.ink}"/></g>`;
    scene += `<path d="${P([pp(-196, 121, 1440), pp(-150, 121, 1440), pp(-150, 121, 1500), pp(-196, 121, 1500)])}" fill="${K.ink}" transform="rotate(-38 ${pt(pp(-172, 121, 1470))})"/>`;
    // the teacher turned toward 결, reaching; the brush slipping from the other hand; the face erased (§4)
    const teach = teacherFig(c, 'turn', 822, 560, 0.8, { sil: 1.4, chipReach: 110, seed: 61 });
    const L = { bg: '', mid: '', fig: '', fx: '' };
    const cutG = (m) => `<g mask="${ve.mask}"><g clip-path="${ve.clip}">${m}</g></g>`;
    L.bg = `<rect x="-2" y="-2" width="${W + 4}" height="${H + 4}" fill="${K.p50}"/>` + cutG(scene);
    L.fig = cutG(heroBack(c, P2Q(), { x: 407, y: 544, s: 0.77, sil: 1.4 }) + teach);
    // the erased lines dry out into the void, ink chips fly, drips fall from the cut lines to a puddle below the edge
    let fx = ve.chips;
    const cut = (yy) => { let best = ve.e1[0]; ve.e1.forEach((q) => { if (Math.abs(q[1] - yy) < Math.abs(best[1] - yy)) best = q; }); return best[0]; };
    [[52, 34], [86, 30], [420, 3], [511, 2.6]].forEach(([yy, w], i) => { fx += dryTail([cut(yy) - 4, yy], [1, 0.05], w, 36 + i * 4, 11 + i); });
    // the drips leave the ends of the erased wall-base line (y 420) and floor seam (y 511), ≥ 30 px right of the brush
    fx += drip(cut(420) - 6, 421, 616, 3, 9) + drip(cut(511) - 8, 512, 622, 2.4, 13) + puddle(cut(600) - 26, 628, 46, 10, 17);
    L.fx = fx;
    return L;
  };
  // 결 half risen (P2): far knee up, near knee down, leaning toward the teacher, near glove open at panel (620, 330)
  function P2Q() {
    return {
      head: { p: [284, 280], rot: 4, s: 1.04 },
      wrap: { p: [270, 330], rot: 4 },
      // the tails drag back-left against the rising move (review 1 A6): over the far shoulder, one S, the ends at
      // shoulder–chest height (panel x 300–335, y 334–360), never above the head
      tailsOver: [[[256, 334], [230, 322], [200, 318], [170, 330], [142, 348], [112, 352], [84, 340], [62, 328]], [[258, 336], [234, 330], [206, 334], [180, 346], [154, 360], [128, 366], [104, 360]]],
      pony: [[266, 306], [262, 334], [256, 362], [252, 390], [250, 414]],
      coat: {
        pts: [[226, 352], [208, 384], [198, 420], [192, 446], [176, 480], [150, 520], [128, 556], [110, 584], [100, 600], [180, 606], [262, 606], [332, 600], [388, 588], [400, 556], [394, 520], [372, 488], [346, 462], [336, 430], [344, 392], [338, 360], [290, 340]],
        tone: [[300, 300], [420, 300], [420, 620], [300, 620]],
        tone40: [[[360, 470], [394, 520], [398, 580], [370, 590], [350, 530]]],
        folds: [[226, 480, 206, 540, 184, 598, 2.6], [282, 490, 312, 546, 330, 600, 2.2]],
        hem: [[100, 600], [180, 606], [262, 606], [332, 600], [388, 588]], hemH: 13
      },
      belt: [[190, 438], [266, 450], [338, 434], [338, 450], [266, 466], [188, 454]],
      cape: { pts: [[218, 356], [252, 334], [292, 334], [336, 352], [348, 378], [322, 402], [272, 406], [228, 398], [210, 376]], tone: [[300, 310], [360, 310], [360, 420], [300, 420]], hem: [[210, 376], [228, 398], [272, 406], [322, 402], [348, 378]], hemH: 9 },
      arm: [[336, 358], [396, 346], [452, 326]], hand: { type: 'open', rot: -6 }, armW: 26
    };
  }
  // ---- P3 — low and close (horizon 380, vp 900,380): 결 from the waist up under the brim, the last (empty) needle going
  // into the fifth loop; behind, wraiths rise from the ink that ran off the erased lines (upper right is the void)
  const P3CAM = camera(900, 380, 950, 370);
  const P3EDGE = [[832, -40], [836, 0], [818, 52], [840, 104], [806, 160], [794, 214], [782, 262], [800, 310], [834, 346], [890, 366], [944, 360], [990, 370], [1036, 342], [1084, 324], [1130, 290], [1176, 274], [1240, 246]];
  // a 3/4 pose for the near-shoulder → far-hip strap (story panels), in the full() box; P = kit pose object
  function strapLocal(a, b, sw, items, T) {
    return strapBelt(a, b, sw, T || KIT_T, items);
  }
  // the bandolier exactly where the kit wears it (k-hero.js:945, :634-637): far shoulder F.at(0.04, 26) → near hip
  // F.at(0.9, -27), loops at t 0.14–0.78, needles along the strap normal turned 14°, eye end outward (review 1 A1)
  const KIT_T = [0.14, 0.30, 0.46, 0.62, 0.78];
  function kitStrap(Pz) {
    const F = PN._hk.frame(Pz), a = F.at(0.04, 26), b = F.at(0.9, -27), u = V.norm(V.sub(b, a)), up = V.rot(V.mul(V.perp(u), -1), 14);
    return { a, b, u, up, T: KIT_T, at: (t) => V.lerp(a, b, t) };
  }
  PANELS['prologue-3'] = function (c, o) {
    const cam = P3CAM, p = (X, Y, Z) => cam.p(X, Z, Y);
    const L = { bg: '', mid: '', fig: '', fx: '' };
    // the room toward its erased right side: dark shelves behind 결 keep the coat's silhouette, floor in perspective
    let bg = `<rect x="-2" y="-2" width="${W + 4}" height="${H + 4}" fill="${C1.deep}"/>`;
    const Zw = 3000, wallY = cam.p(0, Zw, 0)[1];
    bg += `<path d="M-2,${f(wallY)} H${W + 2} V${H + 2} H-2 Z" fill="${C1.base}"/>`;
    for (let X = -2600; X <= 1800; X += 330) { const a = p(X, 0, 760), b = p(X, 0, Zw); bg += `<path d="${P([a, b], false)}" stroke="${C1.deep}" stroke-width="1.8"/>`; }
    [900, 1150, 1500, 2050].forEach((Z) => { const y = cam.p(0, Z, 0)[1]; bg += `<path d="M-2,${f(y)} H${W + 2}" stroke="${C1.deep}" stroke-width="1.6"/>`; });
    // shelves: ink planks, the cavities in shadow. Around 결 and along the look from 결 to the wraiths (x 560–800) the
    // bundles stay in the room's shade (C1 deep / base, ink3) so the paper coat is the one light shape and nothing as
    // bright stands between it and the wraiths (review 1 A4); only the strip at the left edge (x < 56) catches the dawn
    bg += `<path d="M-2,40 H780 V${f(wallY)} H-2 Z" fill="${K.ink7}"/><path d="M56,40 H590 V${f(wallY)} H56 Z" fill="${K.ink3}"/>`;
    // (review 2 M1, head–background rule §13-3) no ink plank or bundle top passes the face band: everything between
    // y 58 and 278 (the face y 70–215 and the scarf's edges at y ≈ 196 / 262, each with 12 px to spare) stays one tall
    // compartment in deep shadow, empty behind the head (x 90–480). Planks at y 292 and 410; the lit paper stacks of the
    // left strip (x < 90) stand tall, their tops above the face band (y 44–52); the rest keep A4's shade.
    [{ y: 292, hMax: 46, tall: true }, { y: 410, hMax: 100 }, { y: wallY, hMax: 72, floor: true }].forEach((row, i) => {
      const r = rng(50 + i), y = row.y;
      let x = 4;
      while (x < 772) {
        const open = x < 66, w = open ? Math.min(30 + r() * 40, 90 - x) : 40 + r() * 70, k = r();
        const h = open ? (row.tall ? y - 44 - r() * 8 : Math.min(row.hMax, 88 + r() * 24)) : Math.min(row.hMax, 50 + r() * 50);
        const shade = x > 590 ? (k > 0.62 ? C1.base : k > 0.3 ? C1.deep : K.ink3) : (k > 0.5 ? C1.deep : C1.base);
        const emptySlot = !open && row.tall && x < 480;
        if (!emptySlot && (open || r() > 0.2)) bg += `<rect x="${f(x)}" y="${f(y - h)}" width="${f(Math.min(w, 778 - x))}" height="${f(h)}" fill="${open ? (k > 0.45 ? K.paper : K.p300) : shade}" stroke="${K.ink}" stroke-width="2"/>`;
        x += w + (open ? 4 + r() * 6 : 10 + r() * 20);
      }
      if (!row.floor) bg += `<path d="M-2,${f(y)} H780" stroke="${K.ink}" stroke-width="9"/>`;
    });
    bg += `<path d="M780,-2 V${f(wallY)}" stroke="${K.ink}" stroke-width="12"/><path d="M-2,-2 H780 V40 H-2 Z" fill="${K.ink7}"/>`;
    // the shelving went on along the wall to the right: its top frame runs into the void and dries out there
    bg += `<path d="M780,-2 H1240 V40 H780 Z" fill="${K.ink7}"/>`;
    const ve = voidEdge(c, P3EDGE, { seed: 53, flow: 0.1, yMin: -20, yMax: 420, close: [[1240, 760], [-80, 760], [-80, -40]] });
    const cutG = (m) => `<g mask="${ve.mask}"><g clip-path="${ve.clip}">${m}</g></g>`;
    // ink puddles where the erased lines' ink pooled, the teacher's brush (bristles erased, the handle left)
    // three separate puddles with floor between them (review 1 A5): the bull's at the back left, the warden's under the
    // void, the dog's at the right
    let floorM = puddle(884, 604, 96, 18, 31) + puddle(1110, 592, 56, 11, 33) + puddle(650, 530, 58, 9, 35);
    // the teacher's brush on the floor: the same bamboo handle as in P1–P2, its bristles erased into a dry end
    floorM += bigBrush([560, 610], [668, 599], 8, { erased: true });
    L.bg = `<rect x="-2" y="-2" width="${W + 4}" height="${H + 4}" fill="${K.p50}"/>` + cutG(bg + grain(c, o) + floorM);
    // wraiths (kit art LOD, as they are) stand in front of the void like cut-outs; the bottom of each is still a column of
    // ink pouring into its puddle (born of the erased lines only, brief §2.5 / Q5)
    // the bull stands back left, clear of the warden (feet x ≈ 650); the dog's head and eye come out over the floor
    let mid = wraith(c, 'charger', 650, 528, 0.98, { cut: 0.36, top: 30, span: [0.1, 0.9], drips: [[56, 3], [132, 3.4]], column: [[128, 160], [78, 160]], seed: 3 });
    mid += wraith(c, 'warden', 884, 606, 1.6, { cut: 0.46, top: 6, span: [0.14, 0.86], drips: [[36, 4], [186, 4.4], [70, 3]], column: [[142, 212], [84, 212]], seed: 5 });
    mid += wraith(c, 'stalker', 1110, 590, 0.82, { cut: 0.3, slant: 0.8, top: 20, span: [0.05, 0.95], drips: [[46, 3]], column: [[96, 152], [40, 150]], seed: 7, sil: 1.2 });
    L.mid = mid;
    // drips from the void's lower edge into the warden's puddle (the dog's stays free of falling ink); chips into the void
    const cut = (xx) => { let best = ve.E[0]; ve.E.forEach((q) => { if (Math.abs(q[0] - xx) < Math.abs(best[0] - xx) && q[1] > 300) best = q; }); return best; };
    let fx = ve.chips;
    [[952, 3.4, 600], [870, 2.6, 596]].forEach(([x, w, y1], i) => { const q = cut(x); fx += drip(x, q[1] - 6, y1, w, 21 + i); });
    // the cut end of the shelving's top frame dries out into the void (비백, 2차)
    const cutAtY = (yy) => { let best = ve.e1[0]; ve.e1.forEach((q) => { if (q[1] < 200 && Math.abs(q[1] - yy) < Math.abs(best[1] - yy)) best = q; }); return best[0]; };
    [[6, 12], [19, 14], [32, 12]].forEach(([yy, w], i) => { fx += dryTail([cutAtY(yy) - 4, yy], [1, 0.03], w, 34 + (i % 2) * 10, 31 + i); });
    // 결 waist-up under the brim
    L.fig = P3Hero(c);
    L.fx = fx;
    return L;
  };
  function P3Hero(c) {
    const s = 2.3, ox = 256.3, oy = 1192; // head (219,134) → panel (300,120)
    const Pz = {
      neck: [212, 186], hip: [204, 342], bow: 4, shTilt: 4, hipTilt: -4,
      head: { p: [219, 134], rot: 0, s: 1.04 },
      scarf: [[198, 192], [180, 204], [168, 222], [160, 246], [156, 270]], scarfW: [26, 13], scarf2: [[200, 194], [186, 210], [178, 228], [174, 246]],
      pony: [[190, 170], [172, 196], [160, 226], [152, 258], [150, 290]],
      sword: { p: [160, 326], deg: -146, len: 66 },
      order: ['behind', 'scarf', 'pony', 'coat', 'front', 'torso', 'belt', 'spool', 'aF', 'aN', 'cape'],
      coat: POSE34.coat, front: POSE34.front
    };
    // the kit's strap (far shoulder → near hip); four named needles (≈ 85 px) in loops 1–4, the bottom loop (near hip,
    // t 0.78) takes the empty one: the near hand pushes it in, its eye end and blank band out toward the lower right,
    // pointing at the puddles and the wraiths (review 1 A1)
    const K3 = kitStrap(Pz), up = K3.up;
    const items = K3.T.map((t, i) => (i < 4 ? { state: 'named', len: 37, w: 2.7, dir: up, out: 0.74 } : null));
    const p5 = K3.at(0.78), L5 = 66, E5 = V.add(p5, V.mul(up, L5 * 0.8));
    const emptyNeedle = needle(E5, V.sub(p5, V.mul(up, L5 * 0.2)), 3.95, { state: 'empty', seed: 9, tw: 2.2, thread: [V.add(E5, V.mul(up, 8)), V.add(E5, [up[0] * 12 - 4, up[1] * 12 + 14]), V.add(E5, [up[0] * 6 - 8, up[1] * 6 + 30])] });
    const strap = () => strapLocal(K3.a, K3.b, 9.5, items, K3.T) + emptyNeedle;
    // near hand: pinches the shaft just outside the loop, fingers across the needle (grip axis along it)
    const pinch = V.add(p5, V.mul(up, 11)), fingers = V.norm([-up[1], up[0]]).map((v) => -v);
    const rotN = Math.atan2(fingers[1], fingers[0]) * 180 / Math.PI, wristN = V.sub(pinch, V.mul(fingers, 13));
    // far hand (review 1 A1): the upper arm hangs behind the far side of the torso; the forearm comes round the torso's
    // edge and across the chest (below the chin), the fist closing on the strap between loops 2 and 3 to pull it taut
    const gripF = K3.at(0.38), elbowF = [268, 280], fDir = V.norm(V.sub(gripF, elbowF)), wristF = V.sub(gripF, V.mul(fDir, 13));
    // (kit arm() turns the glove by the forearm's angle + rot, so rot = the wanted angle − the forearm's)
    Pz.aN = [[184, 214], [176, 262], wristN]; Pz.hN = { type: 'grip', rot: rotN - degOf(V.sub(wristN, [176, 262])) }; Pz.aNpref = -1; Pz.aNw = 30;
    Pz.aF = [[252, 212], elbowF, wristF]; Pz.hF = { type: 'fist', rot: 0 }; Pz.aFpref = 1; Pz.aFw = 26;
    Pz.order = ['behind', 'scarf', 'pony', 'aF', 'coat', 'front', 'torso', 'belt', 'spool', 'aN', 'cape'];
    // the gloves would sink into the ink strap: paper cuffs at the sleeve ends and paper rims on the gloves' lit edges
    // part them (review 1 B6)
    const nearCuff = () => gloveParts(wristN, V.norm(V.sub(wristN, [176, 262])), rotN, 30 * 0.55);
    const farFore = (hc) => foreArm(hc, elbowF, wristF, 26, 'fist', degOf(fDir)) + gloveParts(wristF, fDir, degOf(fDir), 26 * 0.55);
    return heroFig(c, Pz, { s, x: ox, y: oy, rough: 0.3, head: { expr: 'focus', fine: true, under: underBrim(-3, 0) }, extra: { belt: strap, spool: farFore, aN: nearCuff } });
  }
  const degOf = (v) => Math.atan2(v[1], v[0]) * 180 / Math.PI;
  // a kit forearm alone (elbow → wrist, as in k-hero.js arm(): paper sleeve, d20 + ink crescents on the shadow side,
  // heavy shadow contour) with its glove — for a forearm that comes round in front of the body while its upper arm
  // stays behind
  function foreArm(hc, el, wr, w0, type, deg) {
    const Hk = PN._hk, G = Hk.limbPath([el, wr], [w0 * 0.8, w0 * 0.55], { bulge: [[0.16, 0.05]], endCap: 0.02, baseCap: 0.35 });
    const inner = Hk.crescent(G, 0, 0.56, hc.pat('d20')) + Hk.crescent(G, 0, 0.36, K.ink);
    return hc.part(G.d, K.paper, 6, inner) + Hk.contourStrokes(G, 3.8, 0) + Hk.hand(hc, wr, deg, type, {});
  }
  // a paper cuff across the sleeve end (forearm direction u, sleeve width w) and a paper rim along the lit edge of a
  // kit glove whose fingers point at `deg` (its frame: origin = wrist, +x = fingers, −y = back of the hand)
  function gloveParts(wr, u, deg, w) {
    const n = V.perp(u), c0 = V.sub(wr, V.mul(u, 3.5)), h = w / 2 + 2.2;
    let s = `<path d="${P([V.add(V.add(c0, V.mul(n, h)), V.mul(u, -2.6)), V.add(V.add(c0, V.mul(n, h)), V.mul(u, 2.6)), V.add(V.sub(c0, V.mul(n, h)), V.mul(u, 2.6)), V.add(V.sub(c0, V.mul(n, h)), V.mul(u, -2.6))])}" fill="${K.paper}" stroke="${K.ink}" stroke-width="1.8" stroke-linejoin="round" paint-order="stroke"/>`;
    const r = deg * Math.PI / 180, R = (q) => V.add(wr, [q[0] * Math.cos(r) - q[1] * Math.sin(r), q[0] * Math.sin(r) + q[1] * Math.cos(r)]);
    const back = [Math.sin(r), -Math.cos(r)], lit = back[0] * -0.656 + back[1] * -0.754 >= -0.15;
    const edge = lit ? [[3, -9.6], [10, -11.8], [18, -11], [24.6, -8]] : [[3, 9.4], [10, 11.2], [18, 13.2], [25, 11]];
    s += stroke(edge.map(R), 1.7, { color: K.p50, op: 0.95, seed: 8 });
    return s;
  }
  // ---- P4 — standing eye level (horizon 165, vp 860,165), metres: 결 steps out of the 필방 door into the alley and
  // pulls the brim down; low wall left (the sky stays behind the hat), plaster wall with torn posters right, the void at the vp
  const P4CAM = camera(860, 165, 950, 1.55);
  // the void at P4's vanishing point: an uneven place ≈ 68 × 44 around (860, 163)
  const P4VC = [860, 163];
  function p4Void() {
    const vr = rng(43), q = [];
    for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2, rr = 1 + 0.16 * Math.sin(3 * a + 1) + 0.09 * Math.sin(7 * a + 2) + (vr() - 0.5) * 0.12; q.push([P4VC[0] + 34 * rr * Math.cos(a), P4VC[1] + 22 * rr * Math.sin(a)]); }
    return q;
  }
  PANELS['prologue-4'] = function (c, o) {
    const cam = P4CAM, p = (X, Y, Z) => cam.p(X, Z, Y);
    const L = { bg: '', mid: '', fig: '', fx: '' };
    // capH 1.0 m (review 2 M2): the low wall's cap runs past 결's head below the chin (y ≈ 231–246 at x ≈ 420, hidden by
    // the scarf wrap and knot) instead of through the face; more sky behind the hat
    const XL = -3.0, XR = 2.2, capH = 1.0, eaveH = 2.65, sky = mix(K.p300, K.paper, 0.35), wet = mix(C1.base, C1.deep, 0.32);
    const litWall = mix(K.p300, C1.light, 0.25), shadeWall = C1.base;
    let s = `<rect x="-2" y="-2" width="${W + 4}" height="${H + 4}" fill="${sky}"/>`;
    // sky: flat paper-shadow band with a few ink1 cloud strokes (no gradient)
    s += stroke([[300, 34], [420, 26], [560, 40]], 3, { color: K.ink1, taper: 'mid', seed: 3 }) + stroke([[620, 70], [700, 62], [770, 74]], 2.4, { color: K.ink1, seed: 4 }) + stroke([[170, 92], [240, 84], [300, 96]], 2, { color: K.ink1, seed: 5 });
    // floor: the 1장 irregular flagstones (PN.env.rectSlabs) laid out on the ground plane and projected; wet, so the
    // stones run from the base tone to one step darker (deep); joints darker still; a small puddle holding the sky
    s += `<path d="M-2,165 H${W + 2} V${H + 2} H-2 Z" fill="${wet}"/>`;
    // (generated in centimetres: the helper's corner jitter is in absolute units)
    const slabs = PN.env.rectSlabs(-320, 120, 240, 7000, { mw: 150, mh: 125, bias: 1.1, min: 42, maxD: 3, seed: 7 });
    slabs.forEach((sl) => {
      const q = sl.pts.map((v) => p(clamp(v[0] / 100, XL, XR), 0, Math.max(1.25, v[1] / 100)));
      const tone = sl.h < 0.38 ? C1.deep : sl.h < 0.72 ? wet : mix(C1.base, C1.light, 0.25);
      s += `<path d="${P(q)}" fill="${tone}" stroke="${mix(C1.deep, K.ink5, 0.45)}" stroke-width="1.5" stroke-linejoin="round"/>`;
    });
    s += `<path d="${bz([p(0.3, 0, 7.2), p(0.8, 0, 7.0), p(1.15, 0, 7.6), p(0.95, 0, 8.6), p(0.5, 0, 8.8), p(0.2, 0, 8.0)], true, 0.16)}" fill="${sky}"/>` + stroke([p(0.42, 0, 7.4), p(0.7, 0, 7.3), p(0.9, 0, 7.4)], 1.4, { color: K.p50, op: 0.8, seed: 9 });
    // right wall: faces the key light (upper left), so it is the lit plaster; tiles along the eave (ink); gutter at its foot
    const rw = [p(XR, eaveH, 6.2), p(XR, eaveH, 60), p(XR, 0, 60), p(XR, 0, 6.2)];
    s += `<path d="${P([p(XR, eaveH, 6.2), p(XR + 3, eaveH, 6.2), p(XR + 3, 0, 6.2), p(XR, 0, 6.2)])}" fill="${litWall}"/><path d="${P(rw)}" fill="${litWall}"/>`;
    s += `<path d="${P([p(XR, eaveH, 6.2), p(XR, eaveH, 60), p(XR, eaveH + 0.45, 60), p(XR + 0.8, eaveH + 0.45, 6.2)])}" fill="${K.ink}"/>`;
    s += `<path d="${P([p(XR, 0, 6.2), p(XR, 0, 60), p(XR, 0.32, 60), p(XR, 0.32, 6.2)])}" fill="${C1.deep}"/>`;
    // left: the low neighbouring wall (its cap a little under the eye line) so the sky stays behind the whole hat
    const lw = [p(XL, capH, 3.0), p(XL, capH, 60), p(XL, 0, 60), p(XL, 0, 3.0)];
    s += `<path d="${P(lw)}" fill="${shadeWall}"/><path d="${P([p(XL, capH, 3.0), p(XL, capH, 60), p(XL, capH + 0.1, 60), p(XL, capH + 0.1, 3.0)])}" fill="${K.ink}"/>`;
    s += `<path d="${P([p(XL, capH + 0.1, 3.0), p(XL, capH + 0.1, 60), p(XL + 0.3, capH + 0.1, 60), p(XL + 0.3, capH + 0.1, 3.0)])}" fill="${K.ink5}"/>`;
    s += `<path d="${P([p(XL, 0, 3.0), p(XL, 0, 60), p(XL, 0.26, 60), p(XL, 0.26, 3.0)])}" fill="${C1.deep}"/>`;
    // the 필방 door frame we step out of (x 0–150): ink posts and lintel, dark inside
    s += `<path d="M-2,-2 H150 V${H + 2} H-2 Z" fill="${K.ink7}"/><path d="M118,-2 H150 V${H + 2} H118 Z" fill="${K.ink}"/><path d="M-2,-2 H160 V40 H-2 Z" fill="${K.ink}"/>`;
    s += stroke([[126, 60], [128, 300], [124, 600]], 2, { color: K.ink5, seed: 7 });
    // posters on the right wall: blank ones and one wanted portrait whose portrait block is torn away (no lettering)
    const X = PN.env.ctx(1, 5);
    let post = '';
    [[1112, 150, 46, 62, -0.04, 'blank'], [1036, 160, 34, 46, 0.03, 'portrait'], [985, 166, 24, 32, -0.06, 'blank'], [948, 166, 16, 22, 0.05, 'blank']].forEach(([x, y, w, h, a, lay]) => { post += PN.env.poster(X, x, y, w, h, a, { layout: lay, tone: 'paper', curl: 0.2 }); });
    // the portrait block of the wanted poster torn out (review 1 B8): a ragged hole showing the wall, a paper fibre edge
    // where the light catches the tear, the paper's own shadow on the upper-left inner edge, two corners of the old ink
    // frame left on the paper
    const hole = [[1021, 145], [1023, 139], [1029, 141], [1033, 137.6], [1040, 140], [1047, 138], [1049.4, 145], [1046, 151], [1050, 157], [1047, 163], [1041, 167.4], [1036, 164], [1031, 168], [1025, 165], [1022, 158], [1025, 151]];
    post += `<path d="${P(hole)}" fill="${litWall}"/>` + stroke(hole.slice(6, 13), 1.3, { color: K.p50, wob: 0.2, seed: 12 }) +
      stroke([[1023, 147], [1025, 141.4], [1030, 143], [1034, 140], [1040, 142.4]], 1.5, { color: K.ink5, seed: 13 }) +
      `<path d="M1021.6,159 L1023.4,165.6 L1029.6,167.4" fill="none" stroke="${K.ink}" stroke-width="2.4" stroke-linecap="round"/><path d="M1043.6,138.6 L1048.4,138.4 L1048.8,143" fill="none" stroke="${K.ink}" stroke-width="2.2" stroke-linecap="round"/>`;
    s += `<g><defs>${X.defs.join('')}</defs>${post}</g>`;
    // broken lines (선이 끊겼다, B8): the eave, the gutter, the low wall's cap and foot each stop and start again; at each
    // break the band dries out into strands from both sides (비백) over what was behind it
    const bandBreak = (edges, Za, Zb, col, ink, seed) => {
      const [ta, ba] = edges(Za), [tb, bb] = edges(Zb), ma = V.lerp(ta, ba, 0.5), mb = V.lerp(tb, bb, 0.5), d = V.sub(mb, ma);
      const wa = V.len(V.sub(ta, ba)), wb = V.len(V.sub(tb, bb));
      return `<path d="${P([V.add(ta, [0, -1.5]), V.add(tb, [0, -1.5]), V.add(bb, [0, 1.5]), V.add(ba, [0, 1.5])])}" fill="${col}"/>` +
        dryStroke([ma, V.add(ma, V.mul(d, 0.2)), V.add(ma, V.mul(d, 0.38))], wa, { taper: 'start', dryFrom: 0.05, strands: wa > 12 ? 5 : 3, seed, color: ink }) +
        dryStroke([mb, V.sub(mb, V.mul(d, 0.14)), V.sub(mb, V.mul(d, 0.26))], wb, { taper: 'start', dryFrom: 0.05, strands: wb > 12 ? 4 : 3, seed: seed + 1, color: ink });
    };
    const eaveTop = (Z) => { const A = p(XR + 0.8, eaveH + 0.45, 6.2), B = p(XR, eaveH + 0.45, 60), x = p(XR, eaveH, Z)[0], t = (x - A[0]) / (B[0] - A[0]); return [x, A[1] + (B[1] - A[1]) * t]; };
    // round tile ends (수막새) hanging under the eave, closer together with depth (2차); none where the eave is broken
    for (let Z = 6.5; Z < 26; Z += 0.34) {
      if ((Z > 8.8 && Z < 12.7) || (Z > 18.8 && Z < 24.2)) continue;
      const c0 = p(XR, eaveH, Z), rt = 950 * 0.08 / Z;
      s += `<path d="M${f(c0[0] - rt)},${f(c0[1] - 0.5)} A${f(rt)} ${f(rt)} 0 0 1 ${f(c0[0] + rt)},${f(c0[1] - 0.5)} Z" fill="${K.ink}"/>`;
    }
    s += bandBreak((Z) => [eaveTop(Z), p(XR, eaveH, Z)], 9, 12.5, sky, K.ink, 21) + bandBreak((Z) => [eaveTop(Z), p(XR, eaveH, Z)], 19, 24, sky, K.ink, 23);
    s += bandBreak((Z) => [p(XR, 0.32, Z), p(XR, 0, Z)], 7.4, 9.6, litWall, C1.deep, 25);
    // the cap broken (the wall face carries on up over the gap); with the cap at 1.0 m it would also run just under the
    // flying scarf tails between the door post and the coat (x 129–290), so that stretch is erased too (review 2 M2)
    const capBand = (Z) => [V.add(p(XL, capH + 0.1, Z), [0, -3]), p(XL, capH, Z)];
    s += bandBreak(capBand, 10.5, 12.8, shadeWall, K.ink, 27) + bandBreak(capBand, 3.9, 5.0, shadeWall, K.ink, 33);
    s += bandBreak((Z) => [p(XL, 0.26, Z), p(XL, 0, Z)], 11, 13.6, shadeWall, C1.deep, 29);
    s += grain(c, o);
    // the void at the vanishing point (B8): not a blob but the place where the alley's lines end — an uneven paper
    // place (~68 × 44), its edge scattering into the drawing as paper dots (42 % → 20 %), the four long lines drying out
    // into it, a few ink chips flying off
    const vr = rng(44), vc = P4VC, vpts = p4Void();
    const vgrow = (k) => vpts.map((q) => V.add(vc, V.mul(V.sub(q, vc), k)));
    const vring = (A, B) => P(A) + ' ' + P(B.slice().reverse());
    s += `<path d="${vring(vgrow(1.5), vgrow(1.24))}" fill="${c.dot(0.2, K.p50, 6)}" fill-rule="evenodd"/><path d="${vring(vgrow(1.24), vpts)}" fill="${c.dot(0.42, K.p50, 6)}" fill-rule="evenodd"/>`;
    s += `<path d="${bz(vpts, true, 0.14)}" fill="${K.p50}"/>`;
    [[(Z) => V.lerp(eaveTop(Z), p(XR, eaveH, Z), 0.5), (Z) => V.len(V.sub(eaveTop(Z), p(XR, eaveH, Z))), K.ink], [(Z) => p(XR, 0.16, Z), (Z) => V.len(V.sub(p(XR, 0.32, Z), p(XR, 0, Z))), C1.deep],
      [(Z) => p(XL, capH + 0.05, Z), () => 2.2, K.ink], [(Z) => p(XL, 0.13, Z), (Z) => V.len(V.sub(p(XL, 0.26, Z), p(XL, 0, Z))), C1.deep]].forEach(([at, wd, col], i) => {
      s += dryStroke([at(40), at(64), at(100)], Math.max(1.6, wd(40)), { taper: 'start', dryFrom: 0.05, strands: 3, seed: 61 + i, color: col });
    });
    for (let k = 0; k < 9; k++) {
      const a = vr() * Math.PI * 2, d = 0.55 + vr() * 0.35, q = [vc[0] + Math.cos(a) * 34 * d, vc[1] + Math.sin(a) * 22 * d], sz = 2.6 + vr() * 3.4, an = vr() * 3;
      s += stroke([V.add(q, [-Math.cos(an) * sz / 2, -Math.sin(an) * sz / 2]), V.add(q, [Math.cos(an) * sz / 2, Math.sin(an) * sz / 2])], 1.1 + vr() * 0.6, { taper: 'start', seed: 70 + k });
    }
    L.bg = s;
    // optional: two small poster-dogs creeping out of the far end (kit art LOD), left below the void
    L.mid = wraith(c, 'stalker', 772, 318, 0.3, { cut: 0.4, top: 20, column: [[96, 152], [44, 150]], seed: 11 }) + wraith(c, 'stalker', 838, 304, 0.24, { cut: 0.4, top: 20, column: [[96, 152], [44, 150]], seed: 13 });
    L.fig = P4Hero(c);
    return L;
  };
  function P4Hero(c) {
    const s = 1.55, ox = 340.6, oy = 890.3; // head (219,134) → panel (370,168)
    const hd = { p: [219, 134], rot: 2, s: 1.04 };
    const hx = (q) => V.add(hd.p, V.mul(V.rot(q, hd.rot), hd.s));
    const Pz = {
      neck: [212, 186], hip: [201, 342], bow: 5, shTilt: 4, hipTilt: -4,
      head: hd,
      scarf: [[196, 190], [160, 186], [118, 192], [78, 204], [36, 198], [-4, 190], [-44, 196]], scarfW: [30, 15], scarfO: { swing: 14 },
      pony: [[190, 170], [168, 194], [148, 220], [128, 244], [110, 262]],
      aN: [[184, 212], [158, 268], [152, 318]], hN: { type: 'grip', rot: 8 }, aNpref: 1,
      sword: { p: [158, 324], deg: -146, len: 66 },
      order: ['behind', 'scarf', 'pony', 'coat', 'front', 'torso', 'belt', 'spool', 'aN', 'cape'],
      coat: POSE34.coat, front: POSE34.front
    };
    // the kit's strap; the empty needle rides in the bottom loop it was pushed into in P3 (review 1 A1)
    const K4 = kitStrap(Pz);
    const items = K4.T.map((t, i) => ({ state: i === 4 ? 'empty' : 'named', len: 30, w: 2.6, dir: K4.up, out: 0.74 }));
    const strap = () => strapLocal(K4.a, K4.b, 9.5, items, K4.T);
    // far glove ON the brim's front edge, fingers pressing it down, thumb under (A9); the forearm rises on the far
    // side of the face (head x ≥ 44); a paper glint on the brim edge beside the fingers parts glove from brim
    const knuckle = hx([72, -22]), fDir = V.norm([-0.34, 1]), wrist = V.sub(knuckle, V.mul(fDir, 13));
    const farArm = (hc) => PN._hk.arm(hc, [[252, 200], [300, 160], wrist], { type: 'relax', rot: Math.atan2(fDir[1], fDir[0]) * 180 / Math.PI }, { w0: 26, pref: 1 }) +
      stroke([hx([50, -16.6]), hx([57, -16.2]), hx([64, -15.6])], 1.8, { color: K.p50, seed: 31, op: 0.95 }) +
      stroke([V.add(knuckle, [-7, -5]), V.add(knuckle, [-2, -9]), V.add(knuckle, [5, -10])], 1.5, { color: K.p50, seed: 32, op: 0.9 });
    return heroFig(c, Pz, { s, x: ox, y: oy, rough: 0.45, head: { expr: 'focus', hatDy: 3.4, shadowDy: 3.4, tilt: -1, fine: true }, extra: { belt: strap, top: farArm } });
  }
  // ---- E2 — low, looking up (horizon 500): the boundary is a vertical line in the picture plane (§1.6). Below y 300 it is
  // sewn into the margin's double rule (655 / 672); above, still frayed (x 590–670). Left: eclipse sky and obsidian ground.
  const E2CAM = camera(520, 500, 950, 1.0);
  // (review 2 M4: the three points beside the brim moved ≈ 20 px right, so the brim tip stays > 12 px from the first dots
  // and > 20 px from the flat void; the frayed edge stays within x 590–670)
  const E2EDGE = [[618, -40], [622, 0], [604, 34], [630, 66], [598, 98], [626, 128], [612, 160], [644, 190], [648, 222], [670, 252], [660, 278], [655, 300]];
  PANELS['ending-2'] = function (c, o) {
    const cam = E2CAM, L = { bg: '', mid: '', fig: '', fx: '' };
    const ve = voidEdge(c, E2EDGE, { seed: 71, flow: 0.05, yMin: -20, yMax: 300, close: [[655, 300], [655, 760], [-80, 760], [-80, -40]], chips: 44 });
    const cutG = (m) => `<g mask="${ve.mask}"><g clip-path="${ve.clip}">${m}</g></g>`;
    // sky in four flat bands lying parallel to the horizon (review 1 A2): ink7 → ink5 → ch5 deep → ch5 base down to the
    // horizon, no gradient and no rings. Each boundary waves gently (≤ 10 px) and rises a little toward the boundary
    // (≤ 60 px lower on the left); the hat sits in front of the ch5 deep band
    let s = `<rect x="-2" y="-2" width="${W + 4}" height="${H + 4}" fill="${C5.base}"/>`;
    const edge = (y0, y1, amp, ph) => { const q = []; for (let k = 0; k <= 24; k++) { const x = -4 + 670 * k / 24, u = x / 655; q.push([x, y0 + (y1 - y0) * u + amp * (0.65 * Math.sin(u * Math.PI * 1.4 + ph) + 0.35 * Math.sin(u * Math.PI * 3.3 + ph * 2))]); } return q; };
    const bandTo = (q) => P([[-4, -4], [666, -4]].concat(q.slice().reverse()));
    s += `<path d="${bandTo(edge(400, 342, 8, 0.7))}" fill="${C5.deep}"/><path d="${bandTo(edge(258, 198, 9, 2.1))}" fill="${K.ink5}"/><path d="${bandTo(edge(150, 92, 7, 1.2))}" fill="${K.ink7}"/>`;
    // the eclipse disc, half outside the frame, one step darker than its band: ink; only broken paper arcs on its
    // lower-right rim (never a whole ring)
    s += `<circle cx="70" cy="40" r="120" fill="${K.ink}"/>`;
    [[0.22, 0.52, 3.6], [0.62, 0.86, 2.8], [1.0, 1.12, 2]].forEach(([a0, a1, w], i) => { const pts = []; for (let k = 0; k <= 10; k++) { const a = a0 + (a1 - a0) * k / 10; pts.push([70 + 121 * Math.cos(a), 40 + 121 * Math.sin(a)]); } s += stroke(pts, w, { color: K.p50, taper: 'mid', seed: 30 + i }); });
    // obsidian ground (5장 facets projected from the ground plane), mid value, one or two moon slivers
    s += `<path d="M-2,500 H${W + 2} V${H + 2} H-2 Z" fill="${C5.base}"/>`;
    const cells = PN.env.voronoi(-6, 1.6, 4, 40, { cell: 1.5, sx: 1, sy: 1.3, jit: 0.8, seed: 19 });
    cells.forEach((cl, i) => {
      const q = cl.pts.map((v) => cam.p(v[0], Math.max(1.2, v[1]), 0));
      const tone = cl.h < 0.33 ? mix(C5.base, C5.deep, 0.5) : cl.h < 0.7 ? C5.base : mix(C5.base, C5.light, 0.5);
      s += `<path d="${P(q)}" fill="${tone}" stroke="${C5.deep}" stroke-width="1.4" stroke-linejoin="round"/>`;
    });
    s += stroke([[150, 560], [196, 552], [236, 556]], 2.6, { color: K.p50, op: 0.9, seed: 41 }) + stroke([[420, 612], [452, 606]], 2, { color: K.p50, op: 0.85, seed: 42 });
    L.bg = `<rect x="-2" y="-2" width="${W + 4}" height="${H + 4}" fill="${K.p50}"/>` + cutG(s + grain(c, o, 660));
    // the double rule (sewn part) and its quiet margin; whip stitches; the knot at the foot
    let mid = margin(655, 300, H + 2, { plane: false });
    const st = stitches(655, 672, 288, 640, { seed: 29, first: 16 }); // 9 stitches from just above the knot up to y ≈ 300
    mid += st.s + knot(663, 646, 1.05, -8);
    L.mid = mid;
    L.fig = E2Hero(c, st.list[st.list.length - 1]);
    L.fx = ve.chips;
    return L;
  };
  function E2Hero(c, topStitch) {
    const s = 0.77, ox = 511.1, oy = 644.2; // head (244,140) → panel (545, 290)
    const loc = (q) => [(q[0] - ox) / s + 200, (q[1] - oy) / s + 600];
    // the empty needle in the far fist, tip into the boundary; its thread runs back down to the stitch below
    const tip = loc([676, 298]), eye = loc([622, 334]);
    const ts = topStitch ? loc(topStitch[1]) : loc([672, 330]);
    const ndl = (hc) => needle(eye, tip, 3.4, { state: 'empty', seed: 13, tw: 4.4, thread: [V.add(eye, [10, 18]), V.add(ts, [-6, -2]), ts] });
    const Pz = {
      neck: [236, 190], hip: [204, 342], bow: 6, shTilt: 8, hipTilt: -4,
      head: { p: [244, 140], rot: -8, s: 1.04 },
      scarf: [[218, 196], [184, 190], [146, 196], [106, 210], [66, 214], [26, 206], [-16, 212], [-58, 226]], scarfW: [30, 15], scarfO: { swing: 14 },
      pony: [[214, 176], [192, 198], [172, 222], [154, 246], [140, 270]],
      // the near hand open, flat on the sewn double rule (fingers reach x ≈ 650, brief §5.5)
      aN: [[206, 216], [256, 272], loc([623, 413])], hN: { type: 'open', rot: -4 }, aNpref: -1, aNw: 28,
      aF: [[270, 212], [322, 204], [loc([640, 322])[0], loc([640, 322])[1]]], hF: { type: 'grip', rot: -30 }, aFpref: -1, aFw: 26,
      lN: [[188, 346], [178, 462], [166, 572], [202, 588]],
      lF: [[220, 342], [240, 460], [252, 566], [290, 578]],
      sword: { p: [160, 324], deg: -146, len: 66 },
      order: ['behind', 'scarf', 'pony', 'lN', 'lF', 'coat', 'front', 'torso', 'belt', 'spool', 'aN', 'cape'],
      coat: POSE34.coat, front: POSE34.front
    };
    // the kit's strap; the bottom loop is the empty one the needle was drawn from (review 1 A1)
    const K2 = kitStrap(Pz);
    const items = K2.T.map((t, i) => (i === 4 ? null : { state: 'named', len: 30, w: 2.6, dir: K2.up, out: 0.74 }));
    const strap = () => strapLocal(K2.a, K2.b, 9.5, items, K2.T);
    const farArm = (hc) => ndl(hc) + PN._hk.arm(hc, Pz.aF, Pz.hF, { w0: 26, pref: -1 });
    return heroFig(c, Pz, { s, x: ox, y: oy, sil: 1.5, head: { expr: 'focus', bold: 1.25 }, extra: { belt: strap, top: farArm } });
  }
  // ---- E4 — kneeling 결's chest height (horizon 330): the margin on the right (1080 / 1097), the world redrawn as thin
  // lines on the horizon, ink running from four planted needles; 결 lifts the brim and watches the empty needle fill
  const E4CAM = camera(600, 330, 950, 0.8);
  PANELS['ending-4'] = function (c, o) {
    const cam = E4CAM, L = { bg: '', mid: '', fig: '', fx: '' };
    // the sky is a quiet flat p300 (brief §5.6) with one flat haze step at the horizon (a mid band the redrawn world
    // stands on); the paper coat and the lit face stay the lightest things
    const sky = K.p300, haze = mix(K.p300, C5.light, 0.75), line = K.ink3;
    // (the haze step's top edge at y ≥ 255, well under the chin at y ≈ 231 — review 2 R2)
    let s = `<rect x="-2" y="-2" width="${W + 4}" height="${H + 4}" fill="${sky}"/><path d="M-2,262 C300,257 700,255 1080,258 L1080,331 L-2,331 Z" fill="${haze}"/>`;
    // obsidian ground (ch5 base / deep facets projected), the ink lines will read sharp on it
    s += `<path d="M-2,330 H1080 V${H + 2} H-2 Z" fill="${C5.base}"/>`;
    const cells = PN.env.voronoi(-8, 1.3, 6, 46, { cell: 1.3, sx: 1, sy: 1.25, jit: 0.8, seed: 23 });
    let g = '';
    cells.forEach((cl) => {
      const q = cl.pts.map((v) => cam.p(v[0], Math.max(1.0, v[1]), 0));
      const tone = cl.h < 0.35 ? C5.deep : cl.h < 0.75 ? C5.base : mix(C5.base, C5.light, 0.45);
      g += `<path d="${P(q)}" fill="${tone}" stroke="${mix(C5.deep, K.ink5, 0.4)}" stroke-width="1.3" stroke-linejoin="round"/>`;
    });
    s += `<g clip-path="${c.clip('M-2,330 H1080 V680 H-2 Z')}">${g}</g>`;
    // the world drawn back on the horizon, lines only, lighter than the figure: alley walls with tiled eaves, poster
    // rectangles (print / portrait shapes, no letters), a bell tower
    let w = '';
    const ln = (pts, wd) => `<path d="${P(pts, false)}" fill="none" stroke="${line}" stroke-width="${wd || 2}" stroke-linejoin="round" stroke-linecap="round"/>`;
    w += ln([[0, 300], [120, 304], [120, 334]], 2.2) + ln([[0, 292], [130, 297]], 2.4) + ln([[18, 286], [40, 282], [62, 286], [84, 282], [106, 286], [128, 284]], 1.6);
    w += ln([[150, 312], [150, 334]], 2) + ln([[150, 312], [262, 316], [262, 334]], 2) + ln([[140, 306], [272, 310]], 2.2);
    w += `<path d="M 176,318 L 192,318 L 192,330 L 176,330 Z" fill="none" stroke="${line}" stroke-width="1.6"/>` + ln([[198, 320], [214, 320]], 1.4) + ln([[198, 325], [208, 325]], 1.4);
    w += ln([[300, 334], [300, 262], [314, 248], [328, 262], [328, 334]], 2) + ln([[296, 270], [332, 270]], 1.6) + ln([[308, 286], [320, 286]], 1.4);
    w += ln([[870, 318], [980, 314], [980, 334]], 2) + ln([[862, 310], [988, 306]], 2.2) + ln([[880, 300], [900, 296], [920, 300], [940, 296], [960, 300], [978, 297]], 1.5);
    w += `<path d="M 1002,316 L 1020,316 L 1020,332 L 1002,332 Z" fill="none" stroke="${line}" stroke-width="1.6"/>` + ln([[1028, 322], [1060, 320], [1060, 334]], 2);
    s += w;
    s += grain(c, o, 1080);
    // the margin: quiet plane right of the double rule, a few of E2's whip stitches still on it
    s += margin(1080, -2, H + 2);
    s += stitches(1080, 1097, 380, 640, { seed: 37, first: 30 }).s;
    L.bg = s;
    // four needles planted in the ground left of 결 (x 120–380, y 545–585, review 1 A3 b). The ink of their bands runs into
    // the ground and along the cracks of the obsidian — a fine voronoi net built ON the ground plane (X, Z) and projected
    // with cam.p (A3 a): from each foot three runs (one with a fork) go back-left, mostly sideways, thinning with depth
    // (w0 · Z0/Z, never under 1) and drying out (비백); three of them reach the horizon and rise into vertical edges of the
    // redrawn world (the wall end x 120, the shed corner x 262, the bell tower x 300)
    const net = crackNet(211);
    let m = '', top = '';
    const planted = [[150, 560, -7, 112], [232, 585, 5, 118], [300, 548, -4, 104], [352, 574, 6, 108]];
    // per needle: runs = {aim: ground direction [dX, dZ], n: edges, fork: at edge} or {lead: [x, yTop]}
    const plan = [
      [{ aim: [-1, 0.22], n: 8, fork: 3 }, { aim: [-0.78, 0.62], n: 7 }, { aim: [-0.45, 0.9], n: 5 }],
      [{ aim: [-1, 0.1], n: 7 }, { lead: [120, 304], fork: 4 }, { aim: [-0.7, 0.7], n: 7, fork: 3 }],
      [{ aim: [-1, 0.2], n: 7, fork: 2 }, { lead: [300, 270] }, { aim: [-0.5, 0.86], n: 5 }],
      [{ aim: [-1, 0.06], n: 6 }, { lead: [262, 316], fork: 3 }, { aim: [-0.74, 0.68], n: 7 }]
    ];
    planted.forEach(([x, y, tilt, len], i) => {
      const Z0 = cam.Z(y), X0 = cam.X(x, Z0), rr = rng(80 + i * 13);
      plan[i].forEach((b, k) => { m += crackRun(cam, net, [X0, Z0], b, b.lead ? 7.4 + rr() * 1.2 : 4.6 + rr() * 2.6, rng(90 + i * 9 + k)); });
      const d = V.rot([0, -1], tilt), tp = V.add([x, y], V.mul(d, len));
      // a small puddle at the foot, a short shadow to the lower right (key light upper left)
      top += `<path d="${P([[x + 2, y + 2], [x + 34, y + 9], [x + 38, y + 13], [x + 3, y + 7]])}" fill="${mix(C5.deep, K.ink5, 0.55)}"/>` + puddle(x + 2, y + 4, 18, 4.4, 140 + i);
      top += needle(tp, [x, y + 4], 7, { state: 'named', seed: 60 + i }) + stroke([V.sub(tp, V.mul(d, len * 0.46)), V.sub(tp, V.mul(d, len * 0.72)), [x, y + 2]], 3.4, { taper: 'end', seed: 70 + i });
    });
    L.mid = m + top;
    L.fig = E4Hero(c);
    return L;
  };
  // E4's crack net: PN.env.voronoi on the ground plane left of 결 (X −6.5…0.3 m, Z 2.6…9 m, cells ≈ 0.24 × 0.29 m), its
  // cell edges as a graph (shared corners merged at 0.5 mm)
  function crackNet(seed) {
    const cells = PN.env.voronoi(-6.5, 2.6, 0.3, 9, { cell: 0.24, sx: 1, sy: 1.2, jit: 0.85, seed });
    const G = [], idx = new Map();
    const vid = (q) => { const k = Math.round(q[0] * 2000) + ':' + Math.round(q[1] * 2000); let i = idx.get(k); if (i == null) { i = G.length; idx.set(k, i); G.push({ p: q, nb: [] }); } return i; };
    cells.forEach((cl) => {
      const n = cl.pts.length;
      for (let i = 0; i < n; i++) { const a = vid(cl.pts[i]), b = vid(cl.pts[(i + 1) % n]); if (a !== b && G[a].nb.indexOf(b) < 0) { G[a].nb.push(b); G[b].nb.push(a); } }
    });
    return G;
  }
  // one run of ink along the crack net from a needle's foot B = [X, Z] (review 1 A3 a). b.aim: ground direction it prefers
  // at every corner (with some chance), b.n: edges, b.fork: the edge where a second run splits off; b.lead = [x, yTop]:
  // the run keeps aiming at the horizon under x, leaves the net at its far side, goes straight on to the horizon and rises
  // up the redrawn-world edge there. Width w0 · Z0/Z (never under 1); a run's last third dries out (비백).
  function crackRun(cam, G, B, b, w0, r, depth) {
    const Z0 = B[1], lead = b.lead, ZE = 58.5, XE = lead ? (lead[0] - cam.vx) * ZE / cam.f : 0;
    const aimAt = (q) => (lead ? V.norm([XE - q[0], ZE - q[1]]) : V.norm(b.aim));
    // the first corner: one of the nearest corners behind the foot, toward the aim
    let v = -1, best = 1e9;
    G.forEach((g, i) => {
      const d = V.sub(g.p, B), dist = Math.hypot(d[0], d[1] * 0.6);
      if (g.p[1] < B[1] - 0.02 || dist > 0.5) return;
      const a = aimAt(B), sc = dist - 0.12 * (d[0] * a[0] + d[1] * a[1]) / (dist || 1) + r() * 0.06;
      if (sc < best) { best = sc; v = i; }
    });
    if (v < 0) return '';
    const path = [B, G[v].p], seen = new Set([v]);
    let s = '';
    const nMax = lead ? 40 : b.n;
    for (let k = 0; k < nMax; k++) {
      let nx = -1, bs = -1e9;
      const a = aimAt(G[v].p);
      G[v].nb.forEach((u) => {
        if (seen.has(u)) return;
        const d = V.norm(V.sub(G[u].p, G[v].p)), sc = d[0] * a[0] + d[1] * a[1] + (r() - 0.5) * 0.55;
        if (sc > bs) { bs = sc; nx = u; }
      });
      if (nx < 0 || bs < 0.05) break;
      seen.add(nx); v = nx; path.push(G[v].p);
      if (k === b.fork && !depth) {
        const fa = V.rot(a, r() > 0.4 ? -38 : 34);
        s += crackRun(cam, G, G[v].p, { aim: fa, n: 4 }, w0 * 0.62 * Z0 / G[v].p[1], r, 1);
      }
    }
    const S = path.map((q) => cam.p(q[0], q[1], 0)), Wd = path.map((q) => Math.max(1, w0 * Z0 / q[1]));
    if (lead) {
      // off the net on to the horizon (review 2 R1): two small turns at the facets' scale, the last third dry-brushed
      // (비백) so it reads as ink spreading, not a wire; then up the redrawn world's edge
      const last = S[S.length - 1], foot = [lead[0], cam.p(0, ZE, 0)[1]], nn = V.norm(V.perp(V.sub(foot, last))), wl = Wd[Wd.length - 1];
      const k1 = V.add(V.lerp(last, foot, 0.34), V.mul(nn, 5 + r() * 3)), k2 = V.add(V.lerp(last, foot, 0.66), V.mul(nn, -(3 + r() * 2)));
      S.push(k1, k2); Wd.push(Math.max(1, wl * 0.8), Math.max(1, wl * 0.6));
      s += ribbonW(S, Wd) + dryStroke([k2, V.lerp(k2, foot, 0.5), foot], Math.max(1.3, wl * 0.7), { taper: 'start', dryFrom: 0.1, strands: 2, seed: 17 + Math.floor(r() * 40) });
      s += stroke([foot, [lead[0], foot[1] - 5], V.lerp(foot, lead, 0.55), lead], 2, { taper: 'end', wob: 0.04, seed: 7 });
      return s;
    }
    const cut = Math.max(1, Math.round((S.length - 1) * 0.64));
    s += ribbonW(S.slice(0, cut + 1), Wd.slice(0, cut + 1));
    if (S.length - cut > 1) s += dryStroke(S.slice(cut), Math.max(1.3, Wd[cut] * 1.1), { taper: 'start', dryFrom: 0.05, strands: Wd[cut] > 2.4 ? 3 : 2, seed: 11 + Math.floor(r() * 50) });
    return s;
  }
  // a ribbon through screen points S with full widths Wd (per point)
  function ribbonW(S, Wd) {
    if (S.length < 2) return '';
    const N = normalsOf(S), L = [], R = [];
    S.forEach((p, i) => { const h = Wd[i] / 2; L.push([p[0] + N[i][0] * h, p[1] + N[i][1] * h]); R.push([p[0] - N[i][0] * h, p[1] - N[i][1] * h]); });
    return `<path d="${P(L.concat(R.reverse()))}" fill="${K.ink}"/>`;
  }
  function E4Hero(c) {
    const s = 1.49, ox = 562.3, oy = 670.8; // head (232,284) → panel (610, 200); ground (local 600) → panel 671
    const loc = (q) => [(q[0] - ox) / s + 200, (q[1] - oy) / s + 600];
    // the empty needle stood up in front at eye height (x ≈ 805, band y 217–262) by the far hand, elbow bent ≈ 62°, the
    // eye end in the fist and the thread hanging under it (review 1 B7, Q-C)
    const eye = loc([802, 300]), tip = loc([808, 128]);
    const ndl = () => needle(eye, tip, 6.4, { state: 'filling', fill: 0.68, seed: 15, tw: 3.2, thread: [V.add(eye, [-5, 14]), V.add(eye, [-1, 28]), V.add(eye, [-9, 42])] });
    const wristF = V.add(eye, [-14, 22]), elbowF = [304, 396], fa = V.sub(wristF, elbowF), faDeg = Math.atan2(fa[1], fa[0]) * 180 / Math.PI;
    // kneeling on the near knee (review 1 A3 c): the near thigh goes forward-down, the knee on the ground (panel y ≈ 641),
    // the shin and boot lie back to the left with the sole up; the far knee is up, its foot planted forward (right). The
    // coat parts: the back skirt and the swept-back near panel pool behind, the far front panel drapes over the raised
    // thigh, so the near knee and shin show. The near hand rests on the raised knee.
    const knee = [262, 562];
    const Pz = {
      neck: [222, 334], hip: [200, 486], bow: 4, shTilt: 3, hipTilt: -3,
      head: { p: [232, 284], rot: -4, s: 1.04 },
      // resting tails: over the near shoulder and down the back (against the haze, clear of the near arm)
      scarf: [[200, 338], [178, 348], [158, 366], [144, 394], [136, 428], [134, 462], [138, 494]], scarfW: [28, 14], scarf2: [[202, 340], [184, 354], [168, 374], [158, 400], [154, 426]],
      pony: [[204, 318], [188, 342], [178, 370], [172, 400], [170, 428]],
      aN: [[192, 352], [236, 402], [294, 428]], hN: { type: 'relax', rot: 34 }, aNpref: -1, aNw: 28,
      aF: [[256, 350], elbowF, wristF], hF: { type: 'fist', rot: -83 - faDeg }, aFpref: -1, aFw: 26,
      lF: [[214, 484], [312, 452], [320, 566], [358, 584]], lFpref: -1,
      sword: { p: [156, 470], deg: -160, len: 66 },
      // the far arm goes over the torso but under the near arm (which is nearer) and the cape; the needle under its fist
      order: ['behind', 'scarf', 'pony', 'coat', 'lF', 'front', 'kneel', 'torso', 'belt', 'spool', 'aF', 'aN', 'cape'],
      coat: {
        pts: [[188, 442], [172, 470], [158, 508], [140, 546], [118, 574], [94, 594], [84, 602], [128, 607], [176, 605], [212, 600], [236, 592], [234, 566], [220, 536], [210, 504], [214, 474], [232, 452]],
        tone: [[196, 430], [262, 430], [262, 620], [196, 620]],
        folds: [[184, 474, 166, 526, 140, 584, 2.6], [200, 486, 190, 540, 176, 600, 2.2]],
        hem: [[84, 602], [128, 607], [176, 605], [212, 600], [236, 592]], hemH: 13,
        lining: [[[84, 602], [100, 584], [110, 598], [126, 592], [122, 606]], [[236, 592], [229, 566], [222, 586], [213, 600]]]
      },
      front: {
        pts: [[236, 446], [270, 440], [302, 436], [324, 444], [325, 462], [312, 480], [303, 516], [293, 550], [279, 566], [262, 556], [252, 520], [242, 486]],
        tone: [[268, 430], [340, 430], [340, 580], [268, 580]],
        tone40: [[[292, 470], [312, 480], [303, 516], [293, 550], [283, 548], [289, 510]]],
        folds: [[258, 456, 270, 502, 276, 548, 2.2]],
        hem: [[262, 556], [279, 566], [293, 550]], hemH: 10,
        edge: [238, 452, 246, 500, 260, 552, 3.2],
        lining: [[[325, 462], [313, 470], [311, 486], [319, 474]]]
      }
    };
    // the kit's strap (far shoulder → near hip, review 1 A1); every needle has been used, so all five loops are empty
    const K4e = kitStrap(Pz);
    const strap = () => strapLocal(K4e.a, K4e.b, 9.5, [null, null, null, null, null], K4e.T);
    const kneel = (hc) => kneelLeg(hc, [192, 490], knee, [160, 568], [122, 584]);
    return heroFig(c, Pz, { s, x: ox, y: oy, rough: 0.45, head: { expr: 'victory', hatDy: -3, tilt: -10, fine: true }, extra: { belt: strap, kneel, spool: ndl } });
  }
  // 결's near leg kneeling (E4): the kit leg's look (k-hero.js leg(): ink7 trouser, three paper 행전 wraps, ink boot
  // shaft and foot, paper rim on the lit side) in two kit limb outlines — one outline folds over itself at a 150° knee.
  // The boot lies on its instep with the sole turned up to the light: an ink3 sole band, the heel step, a paper edge.
  function kneelLeg(hc, hip, knee, ankle, toe) {
    const Hk = PN._hk;
    const Gs = Hk.limbPath([knee, ankle], [33, 22], { bulge: [[0.14, 0.04]], endCap: 0.05, baseCap: 0.3 });
    const u = Gs.U[0], n = Gs.N[0], at = (t, off) => V.add(V.lerp(knee, ankle, t), V.mul(n, off));
    const band = (t0, th) => {
      const a = at(t0, 30), b = at(t0, -30), a2 = at(t0 + th, 30), b2 = at(t0 + th, -30), sag = V.mul(u, 4);
      return `<path d="M ${pt(a)} Q ${pt(V.add(V.lerp(a, b, 0.5), sag))} ${pt(b)} L ${pt(b2)} Q ${pt(V.add(V.lerp(a2, b2, 0.5), sag))} ${pt(a2)} Z" fill="${K.paper}" stroke="${K.ink}" stroke-width="2"/>`;
    };
    let inS = band(0.3, 0.1) + band(0.46, 0.1) + band(0.62, 0.1) + `<path d="${P([at(0.8, 30), at(1.1, 30), at(1.1, -30), at(0.8, -30)])}" fill="${K.ink}"/>`;
    inS += Hk.crescent(Gs, 0, 0.3, K.ink);
    let s = hc.part(Gs.d, K.ink7, 6, inS) + Hk.rim(Gs, 0, 3, 1.6, K.p50, 0.6);
    // the boot (kit foot) and its sole, turned up
    const d = V.norm(V.sub(toe, ankle)), nn = V.perp(d), Lf = V.len(V.sub(toe, ankle)), F = (x, y) => V.add(ankle, V.add(V.mul(d, x), V.mul(nn, y)));
    s += Hk.foot(hc, ankle, toe);
    s += `<path d="${bz([F(-9.6, 8.4), F(Lf * 0.5, 9.4), F(Lf + 0.4, 7), F(Lf + 1.4, 10.2), F(Lf * 0.5, 13.2), F(-9.2, 12.4)], true, 0.12)}" fill="${K.ink3}"/>` +
      `<path d="${P([F(6, 7.6), F(6.6, 13.4)], false)}" stroke="${K.ink}" stroke-width="1.8"/>` + stroke([F(-7, 12.6), F(Lf * 0.45, 13.4), F(Lf, 10.4)], 1.3, { color: K.p50, op: 0.8, seed: 5 });
    // the thigh over the shin's knee end: its rounded cap is the knee on the ground
    const Gt = Hk.limbPath([hip, knee], [40, 33], { bulge: [[0.05, 0.1]], endCap: 0.34, baseCap: 0.2 });
    s += hc.part(Gt.d, K.ink7, 6, Hk.crescent(Gt, 0, 0.34, K.ink)) + Hk.rim(Gt, 0, 3.2, 1.8, K.p50, 0.7) + Hk.contourStrokes(Gt, 3.4, 0);
    return s;
  }
  // the kit's threeQuarter coat and front flap (API-hero §1), reused so the coat reads the same in every panel
  const POSE34 = {
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
  // 결 kneeling, from behind (P1); brush tip at panel `tip` (panel → local through x 332, y 544, s 0.75)
  function P1Q(tip) {
    const loc = (q) => [(q[0] - 332) / 0.75 + 200, 600 - (544 - q[1]) / 0.75];
    const t = loc(tip);
    return {
      head: { p: [262, 266], rot: 14, s: 1.04 },
      wrap: { p: [252, 318], rot: 10 },
      tailsOver: [[[240, 322], [220, 338], [204, 364], [192, 398], [186, 436], [186, 476], [192, 514]], [[242, 324], [226, 344], [212, 372], [204, 404], [200, 436], [202, 462]]],
      pony: [[245, 293], [241, 322], [237, 350], [234, 378], [233, 404]],
      // seated on the heels, leaning toward the desk: narrow waist, the hips wide on the heels, the near thigh going
      // forward-right under the coat, the skirt spread flat on the floor
      coat: {
        pts: [[196, 338], [180, 372], [172, 410], [168, 436], [156, 468], [134, 506], [118, 542], [104, 574], [94, 596], [160, 604], [240, 606], [318, 602], [374, 590], [372, 562], [356, 528], [334, 490], [316, 458], [316, 420], [320, 378], [306, 346], [254, 326]],
        tone: [[276, 300], [400, 300], [400, 620], [276, 620]],
        tone40: [[[330, 480], [366, 540], [372, 586], [340, 596], [320, 540]]],
        folds: [[204, 470, 190, 530, 170, 594, 2.6], [262, 476, 290, 536, 300, 600, 2.2], [176, 500, 150, 548, 128, 590, 2]],
        hem: [[94, 596], [160, 604], [240, 606], [318, 602], [374, 590]], hemH: 13
      },
      belt: [[164, 428], [244, 440], [318, 426], [318, 442], [244, 456], [162, 444]],
      cape: { pts: [[190, 342], [224, 322], [262, 320], [306, 338], [320, 364], [296, 390], [248, 394], [204, 386], [184, 364]], tone: [[276, 300], [340, 300], [340, 410], [276, 410]], hem: [[184, 364], [204, 386], [248, 394], [296, 390], [320, 364]], hemH: 9 },
      arm: [[306, 350], [356, 398], [t[0] - 22, t[1] - 52]], hand: { type: 'grip', rot: 58 }, armW: 26,
      over: () => `<path d="M${pt([t[0] - 10, t[1] - 46])} L${pt([t[0] - 2, t[1] - 12])}" stroke="${K.ink7}" stroke-width="4.4" stroke-linecap="round"/>` + stroke([[t[0] - 3, t[1] - 16], [t[0] - 1.4, t[1] - 7], t], 6, { taper: 'end', seed: 3 })
    };
  }

  // ---------------------------------------------------------------- 8. review sheets
  // §2 parts at 1x: needles (named / empty / filling × 170 and 90 long), whip stitches + knot, the void edge,
  // the margin double rule, puddle + drips, manuscript lines. Box 1200 × 760, read top-left → bottom-right.
  S.partsSheet = function () {
    const c = ctx();
    let s = `<rect width="1200" height="760" fill="${C1.light}"/>`;
    // A. needles: rows named / empty / filling, 170 long (E4 size) then 90 long (bandolier size)
    const st = ['named', 'empty', 'filling'];
    st.forEach((state, i) => {
      const y = 46 + i * 58;
      s += `<rect x="16" y="${y - 24}" width="404" height="48" fill="${i % 2 ? C1.base : C1.light}"/>`;
      s += needle([40, y], [210, y], 10, { state, fill: 0.68, seed: 11 + i, thread: i === 0 ? [[24, y + 10], [18, y + 22]] : null, tw: 4 });
      s += needle([260, y - 8], [350, y + 8], 6.4, { state, fill: 0.7, seed: 21 + i });
    });
    // P3 size (150 long, 9 wide, band 38 × 5) on the dark of a bandolier strap
    s += `<rect x="16" y="208" width="404" height="70" fill="${K.ink7}"/>` + needle([40, 244], [190, 244], 9, { state: 'empty', seed: 5 }) + needle([230, 244], [310, 244], 6, { state: 'named', seed: 6 }) + needle([330, 244], [410, 244], 6, { state: 'named', seed: 7 });
    // B. whip stitches over a double rule, knot at the foot
    s += `<rect x="440" y="16" width="230" height="430" fill="${C5.base}"/><rect x="${555 + 17}" y="16" width="${670 - 572}" height="430" fill="${K.p50}"/>`;
    s += margin(555, 16, 446, { plane: false });
    const sw = stitches(555, 572, 30, 420, { seed: 23 });
    s += sw.s + knot(562, 428, 1.1, 0);
    // C. the void edge on a wall patch: lines dry out and break, fill scatters 40 → 20 % → none, chips fly 0–60 px
    const patch = c.uid('vp');
    const edge = [];
    for (let i = 0; i <= 12; i++) { const y = -10 + i * 40; edge.push([980 + Math.sin(i * 1.9) * 16 + Math.cos(i * 0.7) * 12, 16 + (y < 0 ? 0 : y)]); }
    edge[0][1] = -30; edge[edge.length - 1][1] = 500;
    const ve = voidEdge(c, edge.map((p) => [p[0], p[1]]), { seed: 7, chips: 38, yMin: 20, yMax: 440 });
    let scene = `<rect x="690" y="16" width="490" height="430" fill="${C1.light}"/><rect x="690" y="300" width="490" height="146" fill="${C1.base}"/>`;
    scene += `<path d="M690,40 L1180,52 L1180,82 L690,74 Z" fill="${K.ink}"/><rect x="760" y="110" width="140" height="150" fill="${K.p300}" stroke="${K.ink}" stroke-width="3"/>`;
    scene += `<path d="M690,300 L1180,300" stroke="${K.ink}" stroke-width="3"/><path d="M700,330 L1180,346 M700,380 L1180,404" stroke="${C1.deep}" stroke-width="2"/>`;
    s += `<rect x="690" y="16" width="490" height="430" fill="${K.p50}"/><g mask="${ve.mask}"><g clip-path="${ve.clip}">${scene}</g></g>`;
    // the dry tails of the lines that ran into the void, the drip that falls from the cut beam
    const cut = (yy) => { let best = ve.e1[0]; ve.e1.forEach((p) => { if (Math.abs(p[1] - yy) < Math.abs(best[1] - yy)) best = p; }); return best[0]; };
    s += dryTail([cut(300) - 4, 300], [1, 0.02], 3.2, 46, 3) + dryTail([cut(62) - 4, 63], [1, 0.03], 26, 40, 5) + dryTail([cut(110) - 4, 110], [1, 0], 3, 30, 7);
    s += ve.chips;
    s += drip(cut(78) - 10, 78, 292, 2.6, 4) + puddle(cut(78) - 12, 300, 26, 6, 3);
    // D. puddle with drips from erased line ends (perspective-flat, irregular, one paper sliver upper-left)
    s += `<rect x="16" y="300" width="404" height="146" fill="${C1.base}"/><path d="M16,330 L300,330" stroke="${K.ink}" stroke-width="3"/>` + dryTail([300, 330], [1, 0], 3, 40, 9);
    s += drip(296, 332, 404, 2.6, 2) + drip(250, 331, 410, 2, 6) + puddle(280, 414, 70, 15, 9);
    // E. margin double rule (5.5 / 4, 17 apart) and the quiet plane
    s += `<rect x="16" y="470" width="404" height="270" fill="${C5.base}"/>` + margin(230, 470, 740, { right: 420 });
    // F. manuscript: ruled lines, greeking columns right → left, the last one half-written with the brush tip at its end
    s += `<rect x="440" y="470" width="740" height="270" fill="${C1.deep}"/>`;
    const ms = manuscript([[470, 490], [800, 490], [800, 720], [470, 720]], { rules: 12, cols: 8, half: 0.55, seed: 3, gw: 1.6 });
    // (the brush stays inside its cell, review 1 B9)
    s += ms.s + c.clipG('M440,470 H1180 V740 H440 Z', stroke([ms.tip, V.add(ms.tip, [-18, -34]), V.add(ms.tip, [-40, -80])], 6, { taper: 'end', seed: 2 }) + `<path d="M${pt(V.add(ms.tip, [-40, -80]))} L${pt(V.add(ms.tip, [-90, -170]))}" stroke="${K.ink7}" stroke-width="7" stroke-linecap="round"/>`);
    const ms2 = manuscript([[840, 520], [1150, 500], [1170, 600], [830, 640]], { rules: 12, cols: 11, half: 0.3, seed: 9, gw: 1.3, rule: 0.8 });
    s += ms2.s;
    return boxed('pn-story-parts', `<defs>${c.defs.join('')}</defs>${s}`, 1200, 760);
  };

  // 결 head studies exactly as §3.2 calls them, at each panel's head scale; the hatless lost profile large; the teacher
  // from behind (P1) and turned with the erased face (P2), and that face enlarged. Box 1600 × 860.
  const HEADS = {
    // panel: [head34 options, head scale (u → px), head rot, label-free note]
    'prologue-3': [{ expr: 'focus', fine: true, under: true }, 2.4, 0],
    'prologue-4': [{ expr: 'focus', hatDy: 3.4, shadowDy: 3.4, tilt: -1, fine: true }, 1.6, 0],
    'ending-2': [{ expr: 'focus', bold: 1.25 }, 0.8, -8],
    'ending-4': [{ expr: 'victory', hatDy: -3, tilt: -10, fine: true }, 1.55, -4]
  };
  // the brim seen from below (P3's low camera): the underside is a plain ink ellipse with a thin lit edge, no rings
  function underBrim(tilt, hatDy) {
    return `<g transform="translate(0 ${f(hatDy || 0)}) rotate(${f(tilt == null ? -3 : tilt)} 0 -34)"><ellipse cx="0" cy="-34" rx="106" ry="20" fill="${K.ink}" stroke="${K.ink}" stroke-width="4"/>` +
      `<path d="M -102,-38 A 106 20 0 0 1 -40,-52.6" fill="none" stroke="${K.p50}" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/></g>`;
  }
  // a 3/4 head study: neck + scarf wrap + head34 at head scale hs, origin at (x, y)
  function headStudy(hc, opts, hs, rot, x, y) {
    const Hk = PN._hk, g = (m) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(hs)})">${m}</g>`;
    const ho = Object.assign({}, opts, { neck: false });
    const under = ho.under ? underBrim(ho.tilt, ho.hatDy) : '';
    delete ho.under;
    return g(Hk.neck34(hc)) + `<g transform="translate(${f(x - 3 * hs)} ${f(y + 41 * hs)}) scale(${f(hs / 1.04)})">${Hk.scarfWrap(hc, [0, 0], 0, {})}</g>` + g(Hk.head34(hc, ho) + under);
  }
  S.studies = function () {
    const c = ctx(), Hk = PN._hk;
    let s = `<rect width="1600" height="860" fill="${C1.light}"/>`;
    // row A — the faces that show: P3 (2.4, the panel's top-left frame), P4 (1.6), E4 (1.55), E2 (0.8, and ×2.75)
    const hc = Hk.Ctx({ pitch: 6, rough: 0.6, seed: 7, fine: true });
    let a = '';
    a += `<rect x="16" y="16" width="420" height="300" fill="${K.ink5}"/>`;
    a += `<g clip-path="${c.clip('M16,16 H436 V316 H16 Z')}"><g transform="translate(-24 26)">${headStudy(hc, HEADS['prologue-3'][0], 2.4, 0, 300, 120)}</g></g>`;
    a += `<rect x="452" y="16" width="380" height="300" fill="${C1.base}"/>` + headStudy(hc, HEADS['prologue-4'][0], 1.6, 0, 640, 170);
    a += `<rect x="848" y="16" width="390" height="300" fill="${K.p300}"/>` + headStudy(hc, HEADS['ending-4'][0], 1.55, -4, 1042, 186);
    a += `<rect x="1254" y="16" width="330" height="300" fill="${C5.deep}"/><g clip-path="${c.clip('M1254,16 H1584 V316 H1254 Z')}">` + headStudy(hc, HEADS['ending-2'][0], 0.8, -8, 1290, 110) + headStudy(hc, HEADS['ending-2'][0], 2.2, -8, 1450, 206) + '</g>';
    s += hc.wrap(a);
    // row B — hatless 결 from behind (lost profile): P1 0.78 and P2 0.8 at panel size, and ×3.2; then the teacher
    const hb = Hk.Ctx({ pitch: 6, rough: 0.6, seed: 7 });
    const lost = (x, y, sc, rot) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sc)})">` +
      Hk.scarfTails(hb, [[-2, 44], [-24, 60], [-46, 86], [-60, 118], [-66, 150], [-64, 182]], [[0, 46], [-18, 70], [-34, 98], [-42, 126], [-44, 150]], 20, { twA: [0.46], twB: [0.6] }) +
      `<path d="M -70,70 C -40,46 30,44 66,64 L 90,150 L -92,150 Z" fill="${K.paper}" stroke="${K.ink}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"/>` +
      `<g transform="rotate(${f(rot || 0)}) scale(1.04)">${headLost(hb, {})}</g>` + Hk.scarfWrap(hb, [2, 46], 0, { ends: false, knot: false }) +
      Hk.pony(hb, [[-8, 32], [-10, 60], [-12, 90], [-13, 118], [-12, 142]], 13) + Hk.scarfTails(hb, [[-2, 50], [-26, 64], [-48, 90], [-62, 122], [-68, 156]], [[0, 52], [-20, 70], [-36, 96], [-44, 124]], 20, { twA: [0.5], twB: [0.62] }) + '</g>';
    let b = `<rect x="16" y="332" width="560" height="512" fill="${C1.base}"/>`;
    b += `<g clip-path="${c.clip('M16,332 H576 V844 H16 Z')}">${lost(76, 400, 0.78, 14) + lost(160, 400, 0.8, 4) + lost(400, 560, 3.2, 8)}</g>`;
    s += hb.wrap(b);
    // the teacher: P1 back view, P2 turned with the erased face (0.8 = the panel scale), and the face ×2.4
    s += `<rect x="592" y="332" width="992" height="512" fill="${C1.light}"/>`;
    s += teacherFig(c, 'back', 720, 830, 0.8, {}) + teacherFig(c, 'turn', 960, 830, 0.8, { chipReach: 90 });
    s += `<rect x="1104" y="348" width="464" height="480" fill="${K.p300}"/><g clip-path="${c.clip('M1104,348 H1568 V828 H1104 Z')}">${teacherFig(c, 'turn', 1324, 1608, 2.4, { chipReach: 90 })}</g>`;
    return boxed('pn-story-studies', `<defs>${c.defs.join('')}</defs>${s}`, 1600, 860);
  };
  // a review sheet cut to its box (pattern tile filling one rect): clipped drawing never widens the rendered bounds
  function boxed(cls, markup, w, h) {
    const pid = 'kst' + (++UID) + '_box';
    return `<g class="${cls}"><defs><pattern id="${pid}" patternUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}">${markup}</pattern></defs><rect width="${w}" height="${h}" fill="url(#${pid})"/></g>`;
  }

  // ---------------------------------------------------------------- 8b. META (brief §1.5): measured from the drawing code
  const r2 = (q) => [Math.round(q[0]), Math.round(q[1])];
  function roomRecede() {
    const cam = ROOM.cam, R = ROOM, p = (X, Y, Z) => r2(cam.p(X, Z, Y)), L = [];
    [-1500, -820, -140, 540].forEach((X) => L.push([p(X, 0, 820), p(X, 0, R.Zb)]));
    L.push([p(R.XL, 0, 1700), p(R.XL, 0, R.Zb)], [p(R.XR, 0, 1180), p(R.XR, 0, R.Zb)], [p(R.XL, R.Hc, 1700), p(R.XL, R.Hc, R.Zb)], [p(R.XR, R.Hc, 1180), p(R.XR, R.Hc, R.Zb)]);
    L.push([p(-380, R.Hc - 70, 900), p(-380, R.Hc - 70, R.Zb)], [p(320, R.Hc - 70, 900), p(320, R.Hc - 70, R.Zb)]);
    L.push([p(DESK.X1, DESK.Y, DESK.Z0), p(DESK.X1, DESK.Y, DESK.Z1)], [p(R.XL, 477, 2038), p(R.XL, 477, 2414)], [p(R.XL, 890, 2038), p(R.XL, 890, 2414)]);
    return L;
  }
  META['prologue-1'] = {
    horizon: 300, vp: [[790, 300]],
    focus: [[492, 440], [878, 330]],
    eyePath: [[80, 150], [190, 252], [360, 290], [330, 360], [440, 395], [492, 440], [660, 430], [860, 330], [1090, 330], [930, 600], [420, 640], [60, 655]],
    hero: { box: [250, 250, 236, 300], headScale: 0.78, head: [378, 294], view: 'lost', hat: 'peg', expr: null },
    crops: { face: [328, 244, 100, 100], hands: [430, 380, 110, 80], needle: [560, 398, 90, 58], brim: [100, 200, 190, 100] },
    teal: ['scarf-tails', 'needle-case-eyes'],
    void: null, margin: null,
    beat: '필방에서 결이 등을 보이고 앉아 원고를 베끼고, 스승이 문가에 등을 돌리고 서 있다. 벽에는 흑립과 빈 탄띠가 걸려 있다.',
    recede: roomRecede()
  };

  const camLines = (cam, pts) => pts.map(([a, b]) => [r2(cam.p(a[0], a[2], a[1])), r2(cam.p(b[0], b[2], b[1]))]);
  META['prologue-2'] = {
    horizon: 300, vp: [[790, 300]],
    focus: [[800, 226], [665, 332]],
    eyePath: [[190, 252], [472, 298], [560, 330], [665, 332], [740, 342], [800, 226], [866, 214], [960, 250], [930, 470], [612, 520], [300, 640], [60, 655]],
    hero: { box: [326, 152, 330, 400], headScale: 0.8, head: [472, 298], view: 'lost', hat: 'peg', expr: null },
    crops: { face: [430, 250, 90, 100], hands: [590, 295, 160, 80], teacherFace: [756, 176, 100, 100], brim: [100, 200, 190, 100] },
    teal: ['scarf-tails', 'needle-case-eyes'],
    void: { side: 'right', edge: P2EDGE.slice(1, -1) }, margin: null,
    beat: '같은 방의 오른쪽이 하얗게 지워져 들어오고, 돌아선 스승의 얼굴이 이미 없다. 결이 일어나 손을 뻗는다.',
    recede: roomRecede()
  };
  META['prologue-3'] = {
    horizon: 380, vp: [[900, 380]],
    // (kit strap: far shoulder (340, 267) → near hip (202, 569); 5th loop (232, 502), the empty needle's band (286, 545)
    // and eye end (327, 578); the far fist on the strap (288, 382))
    focus: [[240, 508], [882, 355], [1172, 540]],
    eyePath: [[150, 40], [300, 150], [296, 222], [326, 290], [288, 382], [262, 450], [240, 508], [327, 578], [650, 530], [882, 355], [1000, 150], [1172, 540], [900, 640], [300, 655], [80, 662]],
    hero: { box: [120, -10, 440, 685], headScale: 2.4, head: [300, 120], view: '34', hat: 'on', expr: 'focus' },
    crops: { face: [240, 70, 160, 150], hands: [200, 330, 180, 270], needle: [200, 470, 150, 125], wraiths: [540, 250, 660, 400], brim: [40, -10, 520, 110] },
    teal: ['scarf-knot', 'scarf-tail-tips', 'needle-eyes', 'thread'],
    void: { side: 'right', edge: P3EDGE.slice(1, -1) }, margin: null,
    beat: '흑립을 쓴 결이 가슴의 탄띠에 마지막 빈 바늘을 꽂는다. 뒤에서는 지워진 자리에서 흘러내린 먹이 먹귀로 일어선다.',
    recede: camLines(P3CAM, [[[-2600, 0, 900], [-2600, 0, 3000]], [[-950, 0, 900], [-950, 0, 3000]], [[370, 0, 800], [370, 0, 3000]], [[1690, 0, 900], [1690, 0, 3000]]])
  };
  META['prologue-4'] = {
    horizon: 165, vp: [[860, 165]],
    focus: [[390, 185], [486, 129], [860, 165]],
    eyePath: [[370, 60], [486, 129], [390, 185], [600, 150], [800, 160], [860, 165], [920, 370], [600, 560], [200, 650]],
    hero: { box: [180, 30, 380, 645], headScale: 1.6, head: [370, 168], view: '34', hat: 'pulled', expr: 'focus' },
    crops: { face: [320, 120, 140, 120], hands: [440, 100, 100, 80], brim: [200, 40, 360, 120] },
    teal: ['scarf-tails', 'scarf-knot', 'needle-eyes'],
    void: { side: 'vp', edge: p4Void().map(r2) }, margin: null,
    beat: '결이 필방 문을 나서며 흑립을 눌러쓴다. 비 그친 새벽 골목은 선이 군데군데 끊겼고, 골목 끝은 하얗게 비었다.',
    recede: camLines(P4CAM, [[[-3.0, 1.0, 3.2], [-3.0, 1.0, 60]], [[2.2, 2.65, 6.4], [2.2, 2.65, 60]], [[2.2, 0, 6.4], [2.2, 0, 60]], [[-3.0, 0, 3.2], [-3.0, 0, 60]], [[-0.62, 0, 2], [-0.62, 0, 60]], [[1.34, 0, 2], [1.34, 0, 60]]])
  };
  META['ending-2'] = {
    horizon: 500, vp: [],
    focus: [[652, 300]],
    eyePath: [[60, 60], [545, 270], [600, 320], [652, 300], [664, 400], [664, 520], [663, 646], [450, 650], [100, 640]],
    hero: { box: [400, 215, 240, 430], headScale: 0.8, head: [545, 290], view: '34', hat: 'on', expr: 'focus' },
    crops: { face: [505, 250, 90, 90], hands: [590, 290, 90, 140], needle: [600, 280, 100, 70], seam: [630, 290, 70, 380], brim: [460, 215, 180, 60] },
    teal: ['scarf-tails', 'scarf-knot', 'stitches', 'knot', 'needle-eye', 'thread'],
    void: { side: 'right', edge: E2EDGE.slice(1).concat([[655, 675]]) }, margin: 655,
    beat: '결이 원고와 공백의 경계에 서서 빈 바늘로 꿰맨다. 꿰맨 아래는 깨끗한 여백선이 되었고, 위는 아직 해지며 흩어진다.',
    recede: []
  };
  META['ending-4'] = {
    horizon: 330, vp: [],
    // (the empty needle: eye end (802, 300) in the far fist, tip (808, 128), band centre (804, 240); the near hand on the
    // raised knee ≈ (715, 435); the near knee on the ground ≈ (655, 641))
    focus: [[804, 240], [650, 195]],
    eyePath: [[60, 300], [120, 336], [110, 470], [150, 560], [232, 585], [352, 574], [450, 640], [600, 560], [715, 435], [650, 195], [804, 240], [808, 130], [1140, 200]],
    hero: { box: [436, 70, 380, 605], headScale: 1.55, head: [610, 200], view: '34', hat: 'lifted', expr: 'victory' },
    crops: { face: [550, 140, 140, 130], hands: [690, 280, 140, 190], needle: [770, 110, 70, 230], seam: [1060, 0, 60, 675], brim: [440, 60, 340, 140] },
    teal: ['scarf-tails', 'scarf-knot', 'needle-thread', 'planted-needle-eyes', 'stitches'],
    void: null, margin: 1080,
    beat: '여백 앞에 무릎 꿇은 결이 챙을 올리고, 손에 든 빈 바늘에 먹이 차오르는 것을 본다. 땅에 꽂은 바늘들에서 먹선이 번져 세상이 다시 그려진다.',
    recede: []
  };

  // ---------------------------------------------------------------- 9. guides (review overlay, one colour, never in the bake)
  function arrowLine(pts, w) {
    let s = `<path d="${P(pts, false)}" fill="none" stroke="${GUIDE}" stroke-width="${w}" stroke-dasharray="10 7" stroke-linecap="round"/>`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], m = V.lerp(a, b, 0.62), u = V.norm(V.sub(b, a)), n = V.perp(u);
      s += `<path d="${P([V.add(m, V.mul(u, 9)), V.add(V.sub(m, V.mul(u, 5)), V.mul(n, 6)), V.sub(V.sub(m, V.mul(u, 5)), V.mul(n, 6))])}" fill="${GUIDE}"/>`;
    }
    return s;
  }
  function guides(id) {
    const M = META[id], g = GUIDE;
    let s = `<g class="pn-story-guides" pointer-events="none" fill="none">`;
    s += `<path d="M400,0 V${H} M800,0 V${H} M0,225 H${W} M0,450 H${W}" stroke="${g}" stroke-width="1" stroke-dasharray="4 6" opacity="0.7"/>`;
    s += `<rect x="24" y="24" width="${W - 48}" height="${H - 48}" stroke="${g}" stroke-width="1" stroke-dasharray="2 5"/>`;
    s += `<rect x="0" y="585" width="${W}" height="90" fill="${g}" fill-opacity="0.12" stroke="${g}" stroke-width="1.4" stroke-dasharray="8 5"/>`;
    s += `<path d="M0,${M.horizon} H${W}" stroke="${g}" stroke-width="2"/>`;
    (M.recede || []).forEach((l) => { s += `<path d="${P(l, false)}" stroke="${g}" stroke-width="1" opacity="0.55"/>`; });
    (M.vp || []).forEach((v) => {
      (M.recede || []).forEach((l) => { const far = V.len(V.sub(l[0], v)) > V.len(V.sub(l[1], v)) ? l[0] : l[1]; s += `<path d="${P([far, v], false)}" stroke="${g}" stroke-width="0.8" stroke-dasharray="3 4" opacity="0.6"/>`; });
      s += `<circle cx="${f(v[0])}" cy="${f(v[1])}" r="9" stroke="${g}" stroke-width="2.4"/><path d="M${f(v[0] - 16)},${f(v[1])} H${f(v[0] + 16)} M${f(v[0])},${f(v[1] - 16)} V${f(v[1] + 16)}" stroke="${g}" stroke-width="2"/>`;
    });
    (M.focus || []).forEach((q, i) => { s += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${i ? 22 : 30}" stroke="${g}" stroke-width="${i ? 2 : 3.4}"${i ? ' stroke-dasharray="6 4"' : ''}/>`; });
    if (M.eyePath) s += arrowLine(M.eyePath, 2.2);
    return s + '</g>';
  }

  // ---------------------------------------------------------------- 10. public API
  S.panel = function (id, opts) {
    opts = opts || {};
    const fn = PANELS[id];
    if (!fn) throw new Error('story: unknown panel ' + id);
    const c = ctx(), L = fn(c, opts), layer = opts.layer || 'all';
    if (layer !== 'all' && LAYERS.indexOf(layer) < 0) throw new Error('story: unknown layer ' + layer);
    const body = layer === 'all' ? LAYERS.map((k) => L[k] || '').join('') : (L[layer] || '');
    return `<g class="pn-story" data-id="${id}"><defs>${c.defs.join('')}</defs>${body}${opts.guides ? guides(id) : ''}</g>`;
  };
  // A panel cut to its own box for review sheets: drawn as the tile of a pattern that fills one rect, so the sheet's bounds
  // are the rects alone (drawings that run past the panel edge are trimmed exactly as the 1200 × 675 bake trims them).
  function tile(id, opts, x, y, k) {
    const pid = 'kst' + (++UID) + '_tile';
    return `<defs><pattern id="${pid}" patternUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">${S.panel(id, opts)}</pattern></defs>` +
      `<g transform="translate(${f(x)} ${f(y)}) scale(${k})"><rect width="${W}" height="${H}" fill="url(#${pid})"/></g>`;
  }
  // 6 panels at 0.4: row 1 P1 P2 P3, row 2 P4 E2 E4, gap 16 → 1472 × 556
  S.sheet = function (opts) {
    let s = `<rect width="1472" height="556" fill="${K.ink}"/>`;
    IDS.forEach((id, i) => { s += tile(id, opts, (i % 3) * 496, Math.floor(i / 3) * 286, 0.4); });
    return `<g class="pn-story-sheet">${s}</g>`;
  };
  // story order in one row at 0.25, gap 12: 'prologue' (4) | 'ending' (2)
  S.strip = function (which, opts) {
    const list = which === 'ending' ? ['ending-2', 'ending-4'] : ['prologue-1', 'prologue-2', 'prologue-3', 'prologue-4'];
    let s = `<rect width="${list.length * 312 - 12}" height="168.75" fill="${K.ink}"/>`;
    list.forEach((id, i) => { s += tile(id, opts, i * 312, 0, 0.25); });
    return `<g class="pn-story-strip">${s}</g>`;
  };

  S.ids = IDS.slice();
  S.SIZE = [W, H];
  S.version = '1.0';
  S.META = META;
  S._K = K;
  S._P = PANELS;
  S._h = { f, pt, P, bz, cr, V, rng, mix, stroke, dryStroke, thread, needle, strapBand: strapBelt, knot, stitches, margin, puddle, drip, voidEdge, dryTail, manuscript, ctx, camera, heroFig, headLost, heroBack, teacher, erasedHead, wraith, C1, C5, LAYERS };
})(window.PN);
