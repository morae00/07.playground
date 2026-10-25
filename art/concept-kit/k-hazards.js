// k-hazards.js — 흑백 타격 생존전 먹극화 · PAPER NOIR INK — terrain hazards → window.PN.hazards
// Work order K11: docs/art/briefs/terrain-hazards.md (B6, with §12 main-session corrections, §13 review-1 and §14 review-2
// corrections). API: art/concept-kit/API-hazards.md.
// Delivery 1 (revision 2 accepted as 1.0-d1r2; its fire output is unchanged here): the common frame (tokens K, SPEC, jit,
// parts/stamp, layout/paths, draw, overlay),
// fire in its four states (ignite · burn · gutter · soot), the hero overlays (back · front · embers) and the enemy feet
// flames (mob front-*). Revision 1 (review 1, R1–R8): m/l body clusters only, an s-cluster rim ring in place of the
// skirts, low flames redrawn in the small-cluster grammar, larger embers, a coral heat band inside the rim, more char.
// Revision 2 (review 2, S1–S5): body clusters by area with a best-candidate scatter, ring items step inward on the far
// rim (skirt-low removed), the per-hazard cap thins the ring evenly; the common helpers scatter() · rimPlace() · capCut()
// and the coverage measure areaOf() (cover, holes) are shared by every kind.
// Delivery 2 (v1.0) adds the other six kinds in the work order's order — shock (cracks, pebbles, burst core, shards,
// dust), slow (ink mire by area, bubbles; the chapter-4 dial is SPEC), water (ripples, flow streaks, a glint), root
// (bramble vines; emerge · wither), trap (the chapter machines; armed · spring · shut), null (erased ground, ghost lines,
// eraser crumbs) — and the hero bind overlays (bind-back · bind-front). kinds · groups · states now equal `planned`.
// Revision d2r1 (review 3, work order §15): long water surface strokes wave-a/-b (W1; water cap 20/10/3), the bind
// overlays redrawn as a root clump + climbing tendrils + one helix strand per leg with a p300 lit edge (B1), six vines
// at the root radii (R1), and every 2D draw of the six kinds from a Kronecker run (R2; fire stays the approved jit-pair
// exception and its output is unchanged). Revision d2r2 (review 4 N1): null ghost lines keep |d| ≥ 0.15r from the
// centre, so no two cross there as a '十 / X' (paths('null').ghost only).
// Every kind places its things with the common helpers (§13-10, §14-7): rising stamps keep rimDist 'rise' + farOK
// (scatter 'rise'; rimPlace for a rim ring), ground stamps keep rimDist 'ground' (their inscribed ellipse inside r − 2),
// every scattered thing goes through scatter(), every per-hazard cap through capCut(), and MASKS feed areaOf().
// Mixed method, as the skill VFX: what follows the radius (disc, rim, heat and flash bands, cracks, hatch, dial, spokes,
// ghost lines) is numbers in SPEC that the renderer draws; things (flame clusters, char, embers, smoke, feet flames,
// puddles, ripples, vines, trap machines, crumbs, stones) are fixed-size stamps baked at @2x and placed by layout().
// Stamps are never stretched. Units are world units (1440x900 at zoom 1.0, 1x px).
// Deterministic: no Math.random/Date. layout() uses SPEC.jit only (the renderer ports it to TypeScript); stamps are
// fixed geometry (their few jagged edges use a fixed-seed mulberry32). Reads only PN.env.CH (trap machine materials, and
// the floor tone of the codex icons).
// Codex icons (2026-10-26, art/kit audit P2-2): icon(kind, {ch}) — additive; every stamp, layout, path, draw, overlay and
// SPEC value is unchanged (the version string stays '1.0-d2r2', so the atlas manifest does not move).
// Every call returns one <g class="hzd …"> with its own <defs>; ids, when a drawing needs any, are 'hzd<N>_' per call.
window.PN = window.PN || {};
(function (PN) {
  'use strict';
  // ==== 1. tokens & helpers ====
  /** Kit v1.0 tokens. SPEC names (left) map to palette.ts in the renderer; the short names are the work order's table. */
  const K = Object.freeze({
    ink: '#121110', ink700: '#2B2926', ink500: '#46423D', ink300: '#8C8579', ink100: '#BCB4A5',
    p50: '#FAF6EC', p100: '#F3EEE2', p300: '#D8D0C0', voidPaper: '#E2DBCB',
    hostile: '#EF5B4F', hostileDeep: '#B8352B', hostileGlow: '#FFE4DF', warn: '#D88D16', warnGlow: '#FFF0C9',
    ink7: '#2B2926', ink5: '#46423D', ink3: '#8C8579', ink1: '#BCB4A5', voidp: '#E2DBCB',
    host: '#EF5B4F', hostD: '#B8352B', hostG: '#FFE4DF', warnG: '#FFF0C9'
  });
  const TAU = Math.PI * 2;
  let UID = 0;
  const f = (n) => Math.round(n * 100) / 100;
  const P2 = (p) => f(p[0]) + ',' + f(p[1]);
  const polyD = (pts) => 'M' + pts.map(P2).join(' L') + ' Z';
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const frac = (v) => v - Math.floor(v);
  const colour = (t) => K[t] || t;
  const op = (a) => (a != null && a < 0.999 ? ` opacity="${f(Math.max(0, a))}"` : '');
  /** Jitter 0..1 (SPEC.jit): the same hash as the skill VFX and worldRenderer, so the renderer can reproduce it. */
  const jit = (seed, i) => ((Math.imul(seed * 31 + i, 2654435761) >>> 0) % 1000) / 1000;
  /** mulberry32, for the fixed jagged edges inside baked stamps only (never for layout). */
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function warn(msg) {
    if (typeof console !== 'undefined' && console.warn) console.warn('PN.hazards: ' + msg);
    return '<g/>';
  }
  /** Per-call context: an id prefix that never rewinds, and the call's own <defs>. */
  function Ctx(cls) {
    const id = 'hzd' + (++UID) + '_', defs = [];
    let n = 0;
    return { id, defs, uid: (tag) => id + (tag || 'u') + (n++), out: (body) => `<g class="hzd ${cls}"><defs>${defs.join('')}</defs>${body}</g>` };
  }
  const area = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
  /** Same winding for every sub-path, so one nonzero path paints the union of its polygons. */
  const orient = (pts) => (area(pts) < 0 ? pts.slice().reverse() : pts);
  const fillPolys = (list, t, a) => {
    const d = list.filter((q) => q && q.length > 2).map((q) => polyD(orient(q))).join(' ');
    return d ? `<path d="${d}" fill="${colour(t)}"${op(a)}/>` : '';
  };
  /** Convex polygon moved inward by d on every edge (d may be one number or one per edge). Null if it collapses. */
  function insetConvex(pts, d) {
    const n = pts.length, s = area(pts) > 0 ? 1 : -1, lines = [];
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const dd = Array.isArray(d) ? d[i] : d;
      lines.push([a[0] - dy / L * s * dd, a[1] + dx / L * s * dd, dx, dy]);
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const p = lines[(i + n - 1) % n], q = lines[i], den = p[2] * q[3] - p[3] * q[2];
      if (Math.abs(den) < 1e-9) return null;
      const u = ((q[0] - p[0]) * q[3] - (q[1] - p[1]) * q[2]) / den;
      out.push([p[0] + p[2] * u, p[1] + p[3] * u]);
    }
    return area(out) * s > 0.05 ? out : null;
  }
  /** Pointed lens (both ends sharp) centred at cx, cy. */
  function lens(cx, cy, hw, hh, n) {
    n = n || 8;
    const top = [], bot = [];
    for (let i = 0; i <= n; i++) { const u = i / n, x = cx - hw + 2 * hw * u, y = Math.sin(Math.PI * u) * hh; top.push([x, cy - y]); bot.push([x, cy + y]); }
    return top.concat(bot.slice(1, -1).reverse());
  }
  /** Ellipse polygon with a fixed radial wobble (amp = ± fraction). */
  function ellPts(cx, cy, rx, ry, n, seed, amp) {
    const rnd = rng(seed || 1), pts = [];
    for (let i = 0; i < n; i++) { const a = TAU * i / n, k = 1 + (rnd() - 0.5) * 2 * (amp || 0); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return pts;
  }
  /** Filled ribbon along a polyline; wf(s) = full width at s = 0..1 by length. */
  function ribbon(pts, wf) {
    const n = pts.length, acc = [0];
    for (let i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = acc[n - 1] || 1, Lf = [], Rt = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      const w = Math.max(0.05, wf(acc[i] / tot)) / 2;
      Lf.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); Rt.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    return Lf.concat(Rt.reverse());
  }
  const rot = (pts, deg, cx, cy) => { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return pts.map((p) => [cx + (p[0] - cx) * c - (p[1] - cy) * s, cy + (p[0] - cx) * s + (p[1] - cy) * c]); };
  const mirror = (pts) => pts.map((p) => [-p[0], p[1]]);

  // ==== 2. data: kinds, states, META, SPEC ====
  /** The whole contract (work order §1.2). READY lists what is drawn: since delivery 2 all of it (= `planned`). */
  const ALL_KINDS = ['fire', 'shock', 'slow', 'water', 'root', 'trap', 'null'];
  const ALL_STATES = {
    fire: ['burn', 'ignite', 'gutter', 'soot'], shock: ['telegraph', 'burst', 'decal'], slow: ['static'], water: ['static'],
    root: ['emerge', 'static', 'wither', 'faded'], trap: ['armed', 'spring', 'shut'], null: ['erase', 'static', 'restore']
  };
  const READY = { kinds: ALL_KINDS.slice(), groups: ALL_KINDS.concat(['hero', 'mob']), heroLayers: ['back', 'front', 'embers', 'bind-back', 'bind-front'] };
  const KINDS = READY.kinds.slice();
  const GROUPS = READY.groups.slice();
  const STATES = {};
  KINDS.forEach((k) => { STATES[k] = ALL_STATES[k].slice(); });

  /** Owner, game radii (work order §1.3) and state windows in seconds, per kind. `delivery` = which delivery draws it. */
  const META = {
    fire: { owner: 'hostile', radii: [50, 60, 68, 74, 98, 150], range: [50, 150], windows: { ignite: 0.25, gutter: 0.5, soot: 1.5 }, delivery: 1 },
    shock: { owner: 'hostile', radii: [190], range: [190, 190], windows: { burst: 0.25, decal: 1.2 }, delivery: 2 },
    slow: { owner: 'hostile', radii: [86, 150], range: [86, 270], windows: { end: 0.5 }, delivery: 2 },
    water: { owner: 'neutral', radii: [], range: [145, 270], windows: {}, delivery: 2 },
    root: { owner: 'hostile', radii: [50, 52], range: [50, 52], windows: { emerge: 0.25, wither: 0.4 }, delivery: 2 },
    trap: { owner: 'neutral', radii: [], range: [60, 98], windows: { spring: 0.15, fadeLast: 0.6 }, delivery: 2 },
    null: { owner: 'hostile', radii: [120, 130, 170], range: [120, 170], windows: { erase: 0.3, restore: 0.5 }, delivery: 2 }
  };

  /**
   * Shapes the renderer draws itself, and the layout constants it ports (work order §1.5, §1.6). Token names and
   * numbers only (the manifest carries this object as it is). Layer rows are [token, width, offset from r (inside −), alpha].
   */
  const SPEC = {
    // kron: Kronecker steps of scatter's pool 'kr' (delivery 2 kinds): the R2 pair (angle, radius) and three more
    // (variant, flip, phase). jit(seed, i + 1) is frac(jit(seed, i) + 0.761) or frac(… + 0.465), so two consecutive
    // draws are one point on two lines, and the fire pool (a = 2πJ(ix), d = √J(ix + 1)) can only reach two spirals.
    jit: { mul: 31, hash: 2654435761, mod: 1000, kron: [0.7548776662466927, 0.5698402909980532, 0.6287067210378087, 0.5385972572236101, 0.4614032426986125] },
    caps: { stamps: [160, 90, 40] },
    fire: {
      base: { token: 'ink', alpha: 0.30 },
      // R5: a coral heat band (α 0.35) under the ink rim, so the disc edge reads as hot; drawn in every state but soot
      rim: [['hostile', 6, -9, 0.35], ['ink', 5, 0], ['hostile', 2.4, -3.6], ['hostileGlow', 0.8, -3.6]],
      // R1: body clusters are m when r < 56 and l from 56 up; s only rings the rim (R2)
      size: { m: 56 },
      windows: { ignite: 0.25, gutter: 0.5 },
      ignite: { flash: { layers: [['hostileGlow', 3, -7]], seconds: 0.12, flash: true } },
      gutter: { coldCross: 0.2 },
      soot: { seconds: 1.5, base: { token: 'ink', alpha: 0.16 }, chars: 'char-cold', caps: [12, 6, 0] },
      layout: {
        // S1 (review 2): count by area, best-candidate scatter (scatter()); jit indices base + (k·cand + c)·stride (+0..4)
        cluster: { area: 1000, min: 3, max: 10, maxBig: 16, big: 100, minimal: 3, tries: 60, cand: 6, reach: { frac: 0.6, pad: 30 }, gap: { frac: 0.48, cap: 28 }, far: 6, squash: 1.3, fallbackY: 0.2, jit: { base: 3000, stride: 5 } },
        // S2: no skirt-low; a ring item that breaks the far-rim rule moves inward 1 unit at a time down to r − farIn (rimPlace())
        rim: { parts: ['cluster-s-a', 'cluster-s-b'], countInset: 9, pitch: [32, 40], big: 100, skip: 0.15, angleJitter: 0.6, inset: { min: 12, pad: 4, jitter: 3 }, far: 6, farIn: 24, reduced: 'even', jit: { skip: 500, angle: 540, dist: 580, variant: 620, flip: 660, phase: 700 } },
        // S3: at most 4 chars from r ≥ 100
        char: { per: 1400, min: 2, max: 10, maxBig: 4, big: 100, minimal: 2, tries: 40, inset: 24, gap: 0.35, jit: { angle: 1000, dist: 1040, variant: 1080, flip: 1120 } },
        caps: [36, 22, 5],
        prio: { cluster: 0, char: 1, rim: 2 },
        // S3: over the cap, the rim ring goes first and evenly (capCut()), then char → body (latest first, one body kept)
        cut: { even: 2, keep: 1 }
      },
      embers: { per: 12, min: 3, max: 8, cycle: 0.7, jitter: 0.4, rise: 34, drift: 8, origin: { dx: [-8, 8], dy: [-12, -4] }, jit: { dx: 1200, dy: 1240, period: 1280, phase: 1320, sign: 1360 } },
      smoke: { max: 3, cycle: 1.0, jitter: 0.3, start: 0.25, stagger: 0.25, until: 0.6, origin: { dy: -8 }, rise: 10, drift: 4, jit: { period: 1500, start: 1540, sign: 1580 } },
      caps: { stamps: [72, 40, 20], embers: [32, 16, 0] }
    },
    hero: {
      tint: { token: 'hostile', composite: 'multiply', alpha: [0.30, 0.12], step: 0.25, steady: 0.20, fadeIn: 0.1, fadeOut: 0.15 },
      embers: { origins: [[-18, -12], [-22, -28], [24, -10], [22, -24]], cycle: 0.6, jitter: 0.3, rise: 30, drift: 6, outward: true, seed: 1, jit: { period: 1400, phase: 1440 } },
      faceZone: [-8, -58, 18, -34],
      clear: { ring: [24, 10.3], back: [-22, -26, 22, 2], front: [-18, -15, 18, 3], bindBack: [-20, -16, 20, 2], bindFront: [-18, -15, 18, 3] }
    },
    mob: { radii: [12, 19, 28], rects: { 12: [-12, -11, 12, 2], 19: [-17, -14, 17, 2], 28: [-25, -18, 25, 2] }, caps: [24, 12, 0] },
    // ---- delivery 2 kinds: the work order's numbers (§1.5, §4) with the §13 · §14 corrections ----
    shock: {
      rim: {
        preview: { drawn: [['ink', 5, 0]], rest: { layers: [['ink', 1.5, 0]], dash: [2, 6] }, inner: [['warn', 2.6, -3.5]] },
        imminent: { layers: [['ink', 7, 0]], inner: { layers: [['warn', 3.5, -3.5]], dash: [10, 5] }, ticks: { count: 8, layers: [['ink', 3]], from: -12, to: 6 } },
        renderer: 'current-without-glyph'
      },
      // jit: arm i start angle J(arm + i); segment k of arm i reads J(seg + i·segStride + 3k + 0..2) (length, turn, push);
      // branch side J(side + i); branch segment k reads J(branch + 10i + 2k + 0..1) (turn, push)
      cracks: { arms: 7, start: 10, seg: 22, segJitter: 0.3, turn: 0.5, push: [3, 5], reach: 0.88, branchAt: 0.55, branchLen: 0.3, branchTurn: 0.6, branchSegs: 3, grow: { full: 0.85, power: 0.7 }, width: [3.6, 1.6], jit: { arm: 2000, seg: 2100, segStride: 40, side: 2090, branch: 2400 } },
      // burst: glow + paper cores (the work order's coral core vanished on the coral fill; the cracks must read as lit)
      coreLayers: { telegraph: [['warn', 0.4]], imminent: [['warn', 0.5], ['warnGlow', 0.17]], burst: [['hostileGlow', 0.5], ['p50', 0.18]], decal: [['ink300', 0.6]] },
      burst: {
        seconds: 0.25, fill: { token: 'hostile', alpha: 0.55, seconds: 0.1 },
        // edge: three rows of ink dots in the band [r − 14, r] (offset, dot radius), max(dots, round(2π(r + offset)/pitch))
        // dots per row, rows offset by half a pitch — a halftone band that thins inward
        edge: { token: 'ink', dots: 40, band: 14, pitch: 6, rows: [[-2.5, 2.2], [-7, 1.6], [-11.5, 1.0]] },
        flash: { layers: [['p50', 3, -5]], seconds: 0.1, flash: true },
        // shard j: arm (j mod 7), at radius (from + (to − from)·J(jit + j))·r on that arm; moves out·u radially, hops −4·hop·u(1 − u)
        shards: { count: 8, from: 0.3, to: 0.9, out: 14, hop: 10, seconds: 0.3, jit: 7100 },
        // dust j: angle 2π(j + 0.5 + (J(jit + j) − 0.5)·0.5)/count at r + at
        dust: { count: 8, at: -6, seconds: 0.3, jit: 7200 }
      },
      decal: { seconds: 1.2, alpha: [0.6, 0], crater: { token: 'ink', alpha: 0.2, r: 0.18 } },
      // pebble j (imminent only): arm arms[j mod 4], at length fraction from + span·J(at + j) of that arm
      layout: { pebble: { count: 6, arms: [0, 2, 4, 6], from: 0.4, span: 0.3, jit: { at: 7000, variant: 7010, phase: 7020, flip: 7030 } }, caps: [6, 0, 0] }
    },
    slow: {
      rim: [['ink', 5.6, 0], ['warn', 3, 0], ['p50', 0.8, 0]],
      hatch: { renderer: 'current' },
      end: { seconds: 0.5 },
      dial: { ticks: 24, r0: -14, r1: -6, long: -3, every: 6, on: [['ink', 3.6], ['warn', 1.6]], off: [['ink', 2, 0, 0.45]], hand: { len: 0.78, layers: [['ink', 3.4], ['warn', 1.4]], hub: ['ink', 4] }, period: 12 },
      // mire: count by area (one class per pass, big first; the small pass keeps clear of the big puddles), scatter 'ground'
      layout: {
        // tiers [from r, big class, small class, area per puddle]: n = clamp(round(r²/area), min, max); the big class's
        // count aims the puddles at `target` of the disc with the painted areas `fill` (units², measured on the stamps)
        mire: { tiers: [[0, 'm', 's', 410], [100, 'l', 'm', 1000], [160, 'xl', 'l', 1000]], fill: { s: 220, m: 524, l: 1220, xl: 3900 }, target: 0.3, min: 3, max: 18, minimal: 3, tries: 120, cand: 10, reach: { frac: 1, pad: 2 }, sep: 0.75, squash: 2.2, mirror: 2, pool: 'kr', jit: { base: 3000, stride: 5, small: 6000 } },
        // bubble b on mire[b mod n]: offset (kr(0, b), kr(1, b)), phase kr(2, b), kr = kron(seed, jit) (review 3 R2)
        bubble: { per: 30, min: 2, max: 6, cycle: 0.9, spread: [0.7, 0.6], still: 2, jit: 3200 },
        caps: [24, 12, 3]
      }
    },
    root: {
      rim: [['ink', 5.6, 0], ['warn', 3, 0], ['p50', 0.8, 0]], hatch: { renderer: 'current' }, windows: { emerge: 0.25, wither: 0.4 }, faded: { alpha: 0.35 },
      // review 3 R1: n = clamp(round(r/8.5), 3, 6) — six vines at the game radii 50 · 52
      layout: { vine: { per: 8.5, min: 3, max: 6, tries: 40, cand: 6, reach: { frac: 0.72, pad: 99 }, gap: { frac: 0.5, cap: 24 }, squash: 1.2, far: 6, mirror: 6, pool: 'kr', jit: { base: 5000, stride: 5 } }, caps: [6, 6, 6] }
    },
    water: {
      base: { token: 'ink', alpha: 0.24 }, rim: [['ink', 2.6, 0], ['p300', 1.2, -2.4, 0.8]],
      layout: {
        // review 3 W1: long surface strokes first (prio 0); ripples and flows keep clear of them (scatter `fixed`)
        wave: { area: 6000, min: 2, max: 10, minimal: 2, tries: 60, cand: 8, reach: { frac: 0, pad: 28 }, gap: { frac: 1, cap: 46 }, squash: 3, mirror: 2, pool: 'kr', jit: { base: 4400, stride: 5 } },
        ripple: { per: 40, min: 3, max: 7, still: 3, cycle: 1.6, spread: [0.7, 0.6], tries: 40, cand: 6, reach: { frac: 0, pad: 24 }, gap: { frac: 1, cap: 36 }, squash: 2, mirror: 2, pool: 'kr', jit: { base: 4000, stride: 5 } },
        flow: { per: 60, min: 2, max: 5, tries: 40, cand: 6, reach: { frac: 0, pad: 30 }, gap: { frac: 1, cap: 30 }, squash: 3, mirror: 2, pool: 'kr', jit: { base: 4100, stride: 5 } },
        glint: { angle: -2.356, spread: 0.3, at: 0.45, jit: 4300 },
        prio: { wave: 0, ripple: 1, flow: 2, glint: 2 },
        // over the cap: prio 2 first, latest first (no even thinning), one prio-0 item always kept
        caps: [20, 10, 3], cut: { even: -1, keep: 1 }
      }
    },
    trap: {
      plate: { token: 'ink700', alpha: 0.5 },
      rim: [['ink', 3.4, 0]],
      groove: [['ink', 1.6, -6, 0.7]],
      spokes: { count: 6, from: -6, to: 38, layers: [['ink', 1.4, 0, 0.5]] },
      rivets: { per: 40, min: 8, at: -11, size: 2, token: 'p300', shape: 'square' },
      windows: { spring: 0.15, fadeLast: 0.6, sprungAlpha: 0.7, fallback: { 5: 1 } },
      layout: { caps: [1, 1, 1] }
    },
    null: {
      base: { token: 'voidPaper', alpha: 1 },
      // ghost line i: angle π·kr(0, i), centre distance d = s·(minOffset + 1.1·|v − 0.5|)·r, v = kr(1, i), s = v < 0.5 ? −1
      // : +1 (|d| ∈ [0.15r, 0.7r], review 4 N1) — a chord of the circle r − 6 (kr = kron(seed, jit.base), review 3 R2)
      ghost: { lines: [4, 6], split: 150, dash: [4, 3], layers: [['ink300', 1, 0, 0.6]], inset: 6, minOffset: 0.15, jit: { base: 2200 } },
      rim: [['ink', 5.4, 0, 1, [0.1, 9]], ['warn', 3, 0, 1, [0.1, 9]]],
      active: { on: false, layers: [['ink', 3.2], ['hostile', 1.5]], at: 0.9 },
      // jag point k: radius factor 1 − (depth/r)·J(jit + k)
      erase: { seconds: 0.3, jag: { points: 12, depth: 6, jit: 2280 } },
      restore: { seconds: 0.5, line: ['ink300', 1.4] },
      // crumb i: angle 2π(i + kr(0, i))/n, distance rimDist(r, a, box, 'ground', kr(1, i), inset), variant ⌊3·kr(2, i)⌋,
      // flip kr(3, i) < 0.5 (kr = kron(seed, jit.base), review 3 R2)
      layout: { crumb: { per: 16, min: 5, max: 9, inset: { pad: 2, jitter: 4 }, jit: { base: 6000 } }, caps: [9, 0, 0] }
    }
  };

  // ==== 3. flame geometry ====
  // A tongue is a sweep: centre line c(u) = bx + lean·u^1.6 + bend·sin(πu), half-width
  // w(u) = w·(1 − u)^p·(1 + b·sin(π·min(1, u/0.62))), y(u) = by − h·u, u = 0 (base) … 1 (tip). The ink silhouette is the
  // sweep; the coral body is the same sweep moved in square to each edge (dl on the light left side, dr on the shadow
  // right side), cut where the two moved edges meet, so it is ≥ dl/dr inside the ink on the sides and well below the
  // ink tip. Every layer paints the union of its tongues in one path: no seam inside a merged cluster.
  const NE = 18, TIP_GAP = 3.2;
  function sweep(t, u0) {
    u0 = u0 || 0;
    const L = [], R = [], p = t.p || 1.25, b = t.b == null ? 0.22 : t.b;
    for (let i = 0; i <= NE; i++) {
      const u = u0 + (1 - u0) * i / NE;
      const c = t.bx + t.lean * Math.pow(u, 1.6) + (t.bend || 0) * Math.sin(Math.PI * u);
      // t.q: "wide body, short pointed tip" profile (1 − u^q)^p for low flames; otherwise the tapering cluster tongue
      const w = Math.max(0, t.q ? t.w * Math.pow(1 - Math.pow(u, t.q), p) : t.w * Math.pow(1 - u, p) * (1 + b * Math.sin(Math.PI * Math.min(1, u / 0.62))));
      const y = t.by - t.h * u;
      L.push([c - w, y]); R.push([c + w, y]);
    }
    return { L, R };
  }
  /** Ink silhouette of a tongue; `round` > 0 closes the base with an arc that deep (× w) below the base line. */
  function outerPts(t) {
    const e = sweep(t), pts = e.L.concat(e.R.slice(0, -1).reverse());
    const k = t.round || 0;
    if (k > 0) { for (let j = 1; j < 8; j++) { const th = Math.PI * j / 8; pts.push([t.bx + t.w * Math.cos(th), t.by + k * t.w * Math.sin(th)]); } }
    return pts;
  }
  /** Coral body of a tongue: {L, R, tip} or null. `from` lifts its base (stamps without an ember bed keep ink under it). */
  function innerEdges(t, dl, dr, from, gap) {
    const u0 = from > 0 ? Math.min(0.95, from / t.h) : 0, e = sweep(t, u0), L = [], R = [];
    const sl = (A, i) => { const a = A[Math.max(0, i - 1)], b = A[Math.min(NE, i + 1)], dy = b[1] - a[1]; return dy ? (b[0] - a[0]) / dy : 0; };
    const yc = t.by - t.h + (gap || TIP_GAP); // the coral never reaches closer than the tip gap to the ink tip
    let prev = null;
    for (let i = 0; i <= NE; i++) {
      const y = e.L[i][1];
      const xl = e.L[i][0] + dl * Math.sqrt(1 + sl(e.L, i) ** 2), xr = e.R[i][0] - dr * Math.sqrt(1 + sl(e.R, i) ** 2), g = xr - xl;
      if (y < yc && g > 0) {
        if (!prev) return null;
        const k = (prev.y - yc) / (prev.y - y);
        return { L, R, tip: [lerp((prev.xl + prev.xr) / 2, (xl + xr) / 2, k), yc] };
      }
      if (g <= 0) {
        if (!prev) return null;
        let k = prev.g / (prev.g - g);
        if (lerp(prev.y, y, k) < yc) k = (prev.y - yc) / (prev.y - y);
        return { L, R, tip: [lerp((prev.xl + prev.xr) / 2, (xl + xr) / 2, k), lerp(prev.y, y, k)] };
      }
      L.push([xl, y]); R.push([xr, y]); prev = { xl, xr, y, g };
    }
    return { L, R, tip: L[L.length - 1] };
  }
  const innerPts = (ie) => (ie && ie.L.length > 1 ? ie.L.concat([ie.tip], ie.R.slice().reverse()) : null);
  /** hostD shadow wedge along the right inside edge of a coral body, between heights u0..u1 of its own samples. */
  function wedgePts(ie, u0, u1, k) {
    if (!ie || ie.R.length < 5) return null;
    const n = ie.R.length, i0 = Math.max(1, Math.floor(n * u0)), i1 = Math.min(n - 1, Math.ceil(n * u1));
    if (i1 - i0 < 3) return null;
    const out = [], back = [];
    for (let i = i0; i <= i1; i++) {
      const s = (i - i0) / (i1 - i0), wide = (ie.R[i][0] - ie.L[i][0]) * k * Math.sin(Math.PI * s);
      out.push(ie.R[i]); back.push([ie.R[i][0] - wide, ie.R[i][1]]);
    }
    return out.concat(back.reverse());
  }
  /** Small angular spark: ink kite, coral inside, optional glow fleck (ignite sparks). */
  function spark(cx, cy, s, deg) {
    const kite = rot([[0.15 * s, -1.5 * s], [1 * s, -0.15 * s], [0.1 * s, 1.4 * s], [-0.95 * s, 0.2 * s]].map((p) => [p[0] + cx, p[1] + cy]), deg || 0, cx, cy);
    return { ink: kite, coral: insetConvex(kite, 0.55 * s) };
  }
  /** Coal: an ink wedge (irregular quad) — never a round dot. */
  const coal = (cx, cy, s, deg) => rot([[cx - s, cy + 0.25 * s], [cx - 0.25 * s, cy - 0.7 * s], [cx + 0.95 * s, cy - 0.35 * s], [cx + 0.55 * s, cy + 0.6 * s]], deg || 0, cx, cy);

  /**
   * Paint a set of tongues: ink union → coral union → hostD wedge → glow → paper hot spot → coals (top).
   * o: {tongues, ins [dl, dr], from, bed {cx, cy, rx, ry, rim, seed}, glow {t: sweep|null}, hot [hw, hh]|null,
   *     coals [[x, y, s, deg]], wedge bool, extra {ink: [], coral: [], glow: []}, smudge pts|null}
   */
  function paintFlames(o) {
    const ink = [], coral = [], glow = [], deep = [], hot = [];
    (o.bed ? [].concat(o.bed) : []).forEach((B) => {
      const outer = ellPts(B.cx, B.cy, B.rx, B.ry, 28, B.seed, 0.035);
      ink.push(outer);
      const rim = B.rim == null ? 2 : B.rim;
      if (B.rx > rim + 0.6 && B.ry > rim + 0.4) coral.push(outer.map((p) => [B.cx + (p[0] - B.cx) * (B.rx - rim) / B.rx, B.cy + (p[1] - B.cy) * (B.ry - rim) / B.ry]));
      // inner glow: two short uneven streaks in the front of the bed (one long lens read as an eye slit). A small bed
      // with no flames on it (ignite 0, gutter 2–3: B.single) keeps only the left one: two glints in a red oval read as eyes
      if (B.line && B.rx - rim > 3) {
        const ix = B.rx - rim, iy = B.ry - rim;
        glow.push(lens(B.cx - 0.42 * ix, B.cy + 0.3 * iy, 0.26 * ix, B.line, 6));
        if (!B.single) glow.push(lens(B.cx + 0.38 * ix, B.cy + 0.14 * iy, 0.2 * ix, B.line * 0.8, 6));
      }
    });
    let main = null;
    (o.tongues || []).forEach((t, i) => {
      ink.push(outerPts(t));
      const ie = innerEdges(t, o.ins[0], o.ins[1], o.from || 0, o.tipGap);
      if (ie) { coral.push(innerPts(ie)); if (i === 0) main = ie; }
    });
    if (o.wedge && main) { const w = wedgePts(main, 0.12, 0.55, 0.34); if (w) deep.push(w); }
    (o.glow ? [].concat(o.glow) : []).forEach((g) => glow.push(outerPts(g)));
    if (o.hot) hot.push(lens(o.hot[0], o.hot[1], o.hot[2], o.hot[3], 6));
    if (o.extra) { (o.extra.ink || []).forEach((q) => ink.push(q)); (o.extra.coral || []).forEach((q) => coral.push(q)); (o.extra.glow || []).forEach((q) => glow.push(q)); }
    let s = o.smudge ? fillPolys([o.smudge], 'ink700') : '';
    s += fillPolys(ink, 'ink') + fillPolys(coral, 'hostile') + fillPolys(deep, 'hostileDeep') + fillPolys(glow, 'hostileGlow') + fillPolys(hot, 'p50');
    if (o.coals && o.coals.length) s += fillPolys(o.coals.map((c) => coal(c[0], c[1], c[2], c[3])), 'ink');
    return s;
  }

  // ---- fire clusters (work order §2.3) ----
  // Per size: box, anchor, `below` (how far the ember bed may reach under the anchor), bed [rx, ry] of its ink outline,
  // side insets [light, shadow], glow core [height, share of the main coral width at the base], paper hot spot
  // [half-width, half-height], coal [size, count], detached flame tip [half-width, height]. Tongue rows:
  // [bx, w, h, lean, bend, pulse phase]; row 0 is the main (tallest) tongue. Variant a: tallest left of centre;
  // variant b: two peaks. Neighbour heights differ ≥ 15% in every loop frame (checked by PN.hazards._.check()).
  const CL = {
    s: {
      box: [28, 32], anchor: [14, 28], below: 1, bed: [10.4, 4.3], ins: [2.0, 2.4], glow: [4.2, 1.0], gk: { a: 1, b: 1.15 }, hot: [1.3, 0.55], coal: [1.6, 2], piece: [1.5, 2.9], spark: 1.5,
      a: [[-1.0, 5.8, 17.5, -0.8, 0.35, 0.5], [4.4, 4.4, 10.5, 1.4, -0.3, 1.0], [-5.8, 3.8, 7.2, -2.8, 0.1, 1.5]],
      b: [[-3.0, 5.2, 17, -0.6, 0.3, 0.5], [3.8, 4.6, 13.2, 0.8, -0.2, 0.8], [0.4, 3.2, 6.6, 0.2, 0, 1.2], [-7.0, 3.0, 5.6, -1.6, 0, 1.7]]
    },
    m: {
      box: [36, 44], anchor: [18, 39], below: 2, bed: [14.2, 5.8], ins: [2.0, 2.8], glow: [6.2, 1.0], gk: { a: 0.76, b: 0.84 }, hot: [1.9, 0.7], coal: [2.2, 3], piece: [2.2, 4.8], spark: 2,
      a: [[-1.6, 7.3, 27, -1.2, 0.6, 0.5], [5.8, 6.0, 16.6, 2.2, -0.4, 1.0], [-7.6, 5.0, 11.8, -4.0, 0.2, 1.5], [10.3, 3.6, 7.6, 2.2, 0, 2.1]],
      b: [[-4.4, 6.7, 26.5, -0.8, 0.4, 0.5], [4.9, 6.5, 21.2, 1.2, -0.3, 0.8], [0.3, 4.3, 10.2, 0.3, 0, 1.2], [-9.8, 3.6, 9.1, -2.8, 0, 1.6], [10.4, 3.4, 6.8, 2.2, 0, 2.0]]
    },
    l: {
      box: [48, 58], anchor: [24, 52], below: 2, bed: [19.8, 7.2], ins: [2.4, 3.2], glow: [8.4, 1.0], gk: { a: 0.86, b: 1.04 }, hot: [2.6, 0.9], coal: [3.4, 4], piece: [2.8, 6.2], spark: 2.6,
      a: [[-2.2, 8.5, 36.5, -1.6, 0.8, 0.5], [7.8, 6.7, 22.4, 3.0, -0.6, 1.0], [-10.4, 5.6, 16.2, -5.0, 0.3, 1.5], [14.4, 4.0, 10.4, 3.0, 0, 2.0], [-15.6, 3.2, 7.3, -2.6, 0, 2.5]],
      b: [[-5.8, 7.0, 36, -1.2, 0.6, 0.5], [6.6, 6.8, 28.7, 1.6, -0.4, 0.8], [0.4, 4.7, 14.1, 0.3, 0, 1.2], [-13.4, 4.2, 12.5, -4.2, 0, 1.6], [14.4, 3.8, 9.0, 3.0, 0, 2.0]]
    }
  };
  /** Ignite frame k: tongue scale, bed scale, glow scale; one tongue shoots up in frame 2 (row index). */
  const IGNITE = { tongue: [0, 0.4, 0.8, 1.1], bed: [0.6, 0.85, 1, 1], glow: [0, 0.6, 0.9, 1.1], shoot: { a: 2, b: 3 } };
  /** Gutter frame k: tongue scale, spread (tongues part), width, bed scale, glow, smoke stage. */
  const GUTTER = { tongue: [0.8, 0.5, 0.25, 0], spread: [1.1, 1.06, 1, 1], width: [0.78, 0.8, 0.85, 1], bed: [1, 0.85, 0.62, 0.52], glow: [0.8, 0, 0, 0], smoke: [0, 0, 1, 2] };

  /** Tongue list for one frame of a cluster (also used by the checks). */
  function clusterTongues(size, v, mode, fr) {
    const C = CL[size], rows = C[v], out = [];
    const bedS = mode === 'ignite' ? IGNITE.bed[fr] : mode === 'gutter' ? GUTTER.bed[fr] : 1;
    const ry = C.bed[1] * bedS, by = C.below - ry * 1.05;
    rows.forEach((r, i) => {
      let k = 1, lean = r[3], bx = r[0], w = r[1];
      if (mode === 'loop') {
        const ph = TAU * fr / 6;
        k = 1 + 0.12 * Math.sin(ph + r[5]);
        lean = r[3] + 2 * Math.sin(ph + r[5] + 1.3);
        if (i === 0 && (fr === 2 || fr === 3)) k *= fr === 2 ? 0.8 : 0.84; // the tip has broken off (detached piece above)
      } else if (mode === 'ignite') {
        k = IGNITE.tongue[fr] * (fr === 2 && i === IGNITE.shoot[v] ? 1.45 : 1);
      } else if (mode === 'gutter') {
        k = GUTTER.tongue[fr]; bx = r[0] * GUTTER.spread[fr]; w = r[1] * GUTTER.width[fr];
        lean = r[3] * (fr === 0 ? 1.3 : 1);
      }
      if (k > 0.01) out.push({ bx, by, w, h: r[2] * k, lean, bend: r[4], p: 1.3, b: 0.4, i });
    });
    return { tongues: out, by, bedS };
  }

  function clusterStamp(size, v, mode, fr) {
    const C = CL[size], T = clusterTongues(size, v, mode, fr), by = T.by, bedS = T.bedS;
    const rows = C[v], main = T.tongues[0] && T.tongues[0].i === 0 ? T.tongues[0] : null;
    const bed = { cx: 0, cy: by, rx: C.bed[0] * bedS, ry: C.bed[1] * bedS, rim: bedS >= 0.8 ? 2 : 1.4, seed: 17 + (v === 'b' ? 5 : 0), line: { s: 0.8, m: 1.0, l: 1.25 }[size], single: bedS < 0.8 };
    // glow core at the base of the main tongue: pulses ±10 % per side (±20 % area) in the loop
    let gS = 1;
    if (mode === 'loop') gS = 1 + 0.1 * Math.sin(TAU * fr / 6 + 0.3);
    else if (mode === 'ignite') gS = IGNITE.glow[fr];
    else if (mode === 'gutter') gS = GUTTER.glow[fr];
    let glow = null, hot = null;
    if (main && gS > 0) {
      const ie = innerEdges(main, C.ins[0], C.ins[1], 0);
      const hw0 = ie ? (ie.R[0][0] - ie.L[0][0]) / 2 : 0;
      if (hw0 > 0.8) {
        // the core stays inside the lowest 35 % of this frame's height (bed bottom → main tongue tip)
        const Hf = C.below - (by - main.h), hc = Math.min(C.glow[0] * gS, main.h * 0.45, 0.35 * Hf - C.below + by + 1 - 0.3);
        if (hc >= 1) {
          const w = hw0 * C.glow[1] * (C.gk ? C.gk[v] : 1) * gS;
          // the core's rounded bottom stays inside the bed's coral (never over its ink rim)
          glow = { bx: main.bx + 0.3, by: by + 1, w, h: hc, lean: 0.12 * main.lean, bend: 0, p: 0.9, b: 0.45, round: Math.max(0, Math.min(0.5, (bed.ry - bed.rim - 1.5) / w)) };
          if (gS >= 0.8) hot = [main.bx + 0.3, by + 0.6, C.hot[0], C.hot[1]];
        }
      }
    }
    if (mode === 'ignite' && fr === 0) glow = null;
    const extra = { ink: [], coral: [], glow: [] };
    // a second, smaller core at the base of the next tongue (glow 8–14 % of the cluster, §13-9)
    const t2 = T.tongues.find((q) => q.i === 1);
    if (glow && t2) {
      const ie2 = innerEdges(t2, C.ins[0], C.ins[1], 0), hw2 = ie2 ? (ie2.R[0][0] - ie2.L[0][0]) / 2 : 0, w2 = hw2 * 0.8 * (C.gk ? C.gk[v] : 1) * gS;
      if (hw2 > 0.8) extra.glow.push(outerPts({ bx: t2.bx + 0.2, by: by + 0.8, w: w2, h: glow.h * 0.75, lean: 0.1 * t2.lean, bend: 0, p: 0.9, b: 0.45, round: Math.max(0, Math.min(0.5, (bed.ry - bed.rim - 1.3) / w2)) }));
    }
    // detached flame tip: loop frames 2 and 3 (gap ≥ 3 above the main tongue)
    if (mode === 'loop' && main && (fr === 2 || fr === 3)) {
      // a curved flame shard, pointed at both ends (a round-bottomed drop read as a water drop)
      const tipX = main.bx + main.lean, top = main.by - main.h;
      const gap = fr === 2 ? 3.2 : 5, ps = fr === 2 ? 1 : 0.75, len = C.piece[1] * ps, wd = C.piece[0] * 1.5 * ps;
      const x0 = tipX + (fr === 2 ? 0.2 : 0.9), y0 = top - gap, cl = [];
      for (let i = 0; i <= 8; i++) { const u = i / 8; cl.push([x0 + 0.9 * ps * Math.sin(Math.PI * u) - 0.6 * ps * u, y0 - len * u]); }
      extra.ink.push(ribbon(cl, (u) => wd * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.8)));
      if (wd > 2.6) extra.coral.push(ribbon(cl.slice(2, 6), (u) => (wd - 2.2) * Math.sin(Math.PI * u)));
    }
    // ignite sparks (frames 0-1) above the young bed
    if (mode === 'ignite' && fr <= 1) {
      const H = rows[0][2], W = C.bed[0];
      [[-0.32, 0.42, 20], [0.18, 0.7, -25], [0.46, 0.3, 40]].slice(0, size === 's' ? 2 : 3).forEach((q, j) => {
        const sp = spark(q[0] * W, by - q[1] * H * (fr === 0 ? 0.55 : 0.85), C.spark * (j === 1 ? 0.8 : 1), q[2]);
        extra.ink.push(sp.ink); if (sp.coral) extra.coral.push(sp.coral);
      });
    }
    const n = C.coal[1], cr = bed.rx - bed.rim, cy = by + 0.45 * (bed.ry - bed.rim);
    const coals = bedS >= 0.8 ? [[-0.62 * cr, cy, C.coal[0], 15], [0.64 * cr, cy - 0.1, C.coal[0] * 0.85, -20], [0.08 * cr, cy + 0.25 * (bed.ry - bed.rim), C.coal[0] * 0.75, 40], [-0.3 * cr, cy + 0.3 * (bed.ry - bed.rim), C.coal[0] * 0.6, -35]].slice(0, n) : [];
    let s = paintFlames({ tongues: T.tongues, ins: C.ins, from: 0, bed, glow, hot: hot ? hot : null, coals, wedge: size !== 's', extra });
    // gutter smoke wisp (ink.300 flat, α 0.6)
    const sm = mode === 'gutter' ? GUTTER.smoke[fr] : 0;
    if (sm) {
      const H = rows[0][2], x0 = (main ? main.bx : rows[0][0]) + 0.5;
      const pts = [];
      const y0 = sm === 1 ? by - 2 : by - H * 0.3, len = sm === 1 ? H * 0.38 : H * 0.55;
      for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([x0 + 1.4 * Math.sin(Math.PI * u * 1.3 + (v === 'b' ? 1 : 0)), y0 - len * u]); }
      s += fillPolys([ribbon(pts, (u) => (sm === 1 ? lerp(1.4, 2.8, u) : lerp(1.2, 2.4, Math.sin(Math.PI * Math.min(1, u * 1.1)))) * (size === 's' ? 0.8 : size === 'l' ? 1.3 : 1))], 'ink300', 0.6);
    }
    return s;
  }

  // ---- low flames (R3, §13-3): the small-cluster grammar ----
  // Hero back/front and enemy fronts (the far-rim strip skirt-low was removed, §14-5). Each clump: 3–5 tongues of different
  // heights (neighbours ≥ 15 % apart, PN.hazards._.check()) rising out of a coral ember strip with an ink rim of 1.5–1.6,
  // and one glow core at the main tongue's base. Ink is 1.4 on the light (left) side and 2.0 on the shadow side; the coral
  // stops 3.2 below each ink tip, as in the clusters. No dome body and no black base band: the strip's own rim is the only
  // ink under the flames. Clump: bed [cx, rx, ry] (outer ink size), rows [bx, w, h, lean, bend, pulse phase]; row 0 is the
  // clump's main tongue. Per stamp: `below` = how far the strip may reach under the anchor (the box's 3-unit margin),
  // `prof` = the "wide body, short tip" profile {q, p} (else the cluster taper), `rim`, `glow` [share of the main coral
  // width, share of its height] override LOW. Clumps never overlap, and one paint pass draws them all (no seams).
  const LOW = { ins: [1.4, 2.0], rim: 1.6, p: 1.25, b: 0.4, glow: [0.6, 0.3], tip: 3.2 };
  /** Feet flames: hero back/front (§3.3) and enemy fronts (§3.5). */
  const FEET = {
    // back (R3): tall clumps at both sides that rise beside the coat, and a low one behind the boots
    // fuller "wide body, short tip" tongues (prof), so the tops that peek out beside the coat stay wide
    'hero/back': { box: [50, 34], anchor: [25, 29], frames: 6, below: 2, prof: { q: 2.0, p: 1.0 }, clumps: [
      // left: the coat hem flares to x −24, so the flames stand at the outer edge and their tops peek out beside the coat
      { bed: [-17.0, 4.8, 3.4], rows: [[-17.4, 3.7, 21.5, -1.6, -0.3, 0.5], [-14.2, 3.2, 12.0, -2.0, 0.4, 1.1], [-11.0, 2.6, 7.4, 0.6, 0, 1.7]] },
      // right: the open side (the coat ends near x 14) — a full clump in the window x 14–22
      { bed: [18.0, 3.8, 3.4], rows: [[18.2, 3.6, 19.0, 1.0, -0.6, 1.0], [15.6, 2.6, 10.0, -0.6, 0.3, 1.6], [12.0, 2.4, 6.0, 0.4, 0, 2.1]] },
      { bed: [1.0, 6.2, 3.0], rows: [[1.4, 4.2, 10.0, 0.4, 0.4, 2.4], [-3.0, 2.8, 6.0, -0.6, 0, 1.4], [5.2, 2.6, 4.8, 0.8, 0, 0.9]] }] },
    // front: two clumps flank the boots (idle·throw·hurt boots ≥ 60 % in view, §13-7); nothing above y −15. The main
    // tongues use the height up to y −15 (coral grows with height; the boots end at y −6) instead of widening over the boots
    'hero/front': { box: [42, 24], anchor: [21, 18], frames: 6, below: 3, prof: { q: 1.8, p: 1.1 }, rim: 1.5, glow: [0.55, 0.26], clumps: [
      { bed: [-13.3, 4.3, 3.4], rows: [[-13.5, 4.2, 12.8, -1.0, 0.1, 0.5], [-10.9, 2.1, 6.6, 0.2, -0.3, 1.2], [-15.8, 1.6, 4.2, 0, 0, 1.8]] },
      { bed: [13.2, 4.4, 3.3], rows: [[13.4, 4.4, 11.4, 1.0, -0.5, 1.1], [10.4, 2.4, 5.6, -0.6, 0.2, 1.7], [15.6, 1.6, 4.0, 0, 0, 2.2]] }] },
    'mob/front-12': { box: [30, 19], anchor: [15, 14], frames: 4, below: 2, clumps: [{ bed: [0.3, 10.8, 3.0], rows: [[0.6, 4.4, 8.4, 0.6, 0.4, 0.5], [-5.4, 3.4, 6.0, -1.4, 0.2, 1.0], [5.8, 3.2, 5.0, 1.2, -0.2, 1.6], [-9.2, 2.2, 3.6, -0.6, 0, 2.0]] }] },
    'mob/front-19': { box: [40, 22], anchor: [20, 17], frames: 4, below: 2, clumps: [{ bed: [0, 15.6, 3.4], rows: [[-2.6, 5.8, 11.0, -0.6, 0.6, 0.5], [5.2, 5.0, 7.8, 1.4, -0.4, 0.9], [-10.0, 4.0, 6.4, -1.6, 0.4, 1.3], [11.4, 3.4, 4.6, 1.0, -0.2, 1.8]] }] },
    'mob/front-28': { box: [56, 26], anchor: [28, 21], frames: 4, below: 2, clumps: [{ bed: [0, 23.2, 4.0], rows: [[8.0, 6.8, 14.0, 1.0, -0.6, 0.5], [-9.0, 6.6, 12.0, -1.0, 0.6, 0.9], [-0.4, 5.2, 8.0, 0.3, 0.2, 1.4], [-17.0, 4.4, 7.4, -1.6, 0.4, 1.8], [16.8, 4.0, 6.0, 1.6, -0.3, 2.2]] }] }
  };
  /** Tongues of a low-flame stamp in one loop frame (also used by the checks). Tongue bases sit on the strip's centre line. */
  function lowTongues(spec, fr, frames) {
    const ph = TAU * fr / frames, out = [];
    spec.clumps.forEach((c, ci) => {
      const by = spec.below - c.bed[2] * 1.05;
      c.rows.forEach((r, i) => out.push({ bx: r[0], by, w: r[1], h: r[2] * (1 + 0.12 * Math.sin(ph + r[5])), lean: r[3] + 2 * Math.sin(ph + r[5] + 1.3), bend: r[4], q: spec.prof ? spec.prof.q : 0, p: spec.prof ? spec.prof.p : LOW.p, b: LOW.b, i, ci }));
    });
    return out;
  }
  function lowFlames(spec, fr, frames) {
    const gS = 1 + 0.1 * Math.sin(TAU * fr / frames + 0.3), all = lowTongues(spec, fr, frames), beds = [], glows = [];
    spec.clumps.forEach((c, ci) => {
      const by = spec.below - c.bed[2] * 1.05, main = all.find((t) => t.ci === ci && t.i === 0);
      beds.push({ cx: c.bed[0], cy: by, rx: c.bed[1], ry: c.bed[2], rim: spec.rim || LOW.rim, seed: 29 + ci * 7, line: 0 });
      // one glow core per clump on the main tongue's base: 30 % of its height, the round bottom inside the strip
      const ins = spec.ins || LOW.ins, G = spec.glow || LOW.glow, ie = innerEdges(main, ins[0], ins[1], 0), hw0 = ie ? (ie.R[0][0] - ie.L[0][0]) / 2 : 0;
      if (hw0 > 0.8) {
        const w = hw0 * G[0] * gS, h = Math.max(1.2, main.h * G[1]) * gS;
        glows.push({ bx: main.bx + 0.2, by: by + 0.5, w, h, lean: 0.1 * main.lean, bend: 0, p: 0.95, b: 0.3, round: Math.max(0, Math.min(0.5, (c.bed[2] - (spec.rim || LOW.rim) - 0.9) / w)) });
      }
    });
    return paintFlames({ tongues: all, ins: spec.ins || LOW.ins, from: 0, tipGap: LOW.tip, bed: beds, glow: glows, wedge: false });
  }

  // ---- char (work order §2.2): flat jagged blotch, coals, long glowing cracks, few ash crumbs ----
  // crack: the long glowing fissure (uneven steps, not a regular zigzag that reads as a lightning glyph); branch: a spur
  const CHAR = {
    a: { seed: 11, rx: 18.4, ry: 7.4, notch: 2, crack: [[-15.4, 0.6], [-12.6, -0.8], [-10.8, -0.5], [-7.4, 1.4], [-4.0, 0.2], [-1.6, -1.5], [2.2, -0.7], [4.4, 0.9], [8.6, 0.1], [11.0, -1.3], [14.2, -0.4]], branch: [[2.2, -0.7], [3.6, -2.6], [5.2, -4.2]], coals: [[-8.5, 3.6, 2.2, 10], [1.2, -3.8, 2.6, -30], [9.6, 3.4, 2.0, 50]], ash: [[-16.2, -3.4, 1.2], [15.8, 3.2, 1.0]] },
    b: { seed: 23, rx: 17.6, ry: 7.6, notch: 3, crack: [[-14.6, -0.2], [-11.4, 1.2], [-9.2, 0.6], [-5.8, -1.0], [-2.6, 0.4], [0.2, 1.8], [3.8, 0.8], [6.6, -0.9], [10.4, -0.3], [13.8, 1.0]], branch: [[-5.8, -1.0], [-4.4, -3.2], [-2.0, -4.4]], coals: [[-11, -3.4, 2.4, 25], [5.6, 3.8, 2.2, -15]], ash: [[-15.4, 3.6, 1.1], [12.6, -4.6, 1.3], [16.2, 1.6, 1.0]] },
    c: { seed: 37, rx: 18.2, ry: 7.0, notch: 2, crack: [[-13.8, 1.4], [-10.6, 0.2], [-8.0, 0.9], [-4.6, -0.6], [-1.2, 0.2], [1.8, -1.1], [5.4, -0.2], [8.2, 1.2], [12.4, -0.6]], branch: [[1.8, -1.1], [3.0, -3.0], [6.0, -4.2], [7.8, -4.0]], coals: [[-6.2, -3.6, 2.4, -10], [-1.0, 3.8, 2.0, 35], [10.4, 3.2, 2.4, 5], [13.8, -1.8, 1.8, 60]], ash: [[-16.4, 0.2, 1.1]] },
    d: { seed: 51, rx: 17.8, ry: 7.6, notch: 3, crack: [[-15.0, -1.0], [-12.0, 0.4], [-8.6, -0.3], [-6.4, 1.2], [-2.8, 0.0], [0.6, -1.4], [4.2, -0.6], [7.0, 1.0], [10.8, 0.4], [14.4, -0.8]], branch: null, coals: [[-12.2, 2.8, 2.2, 40], [-2.6, -3.6, 2.6, -25], [8.0, 3.8, 2.2, 15]], ash: [[15.6, -3.8, 1.2], [-6.0, 5.6, 1.0], [-16.6, -1.6, 1.1]] }
  };
  /** Glowing fissure as filled tapered ribbons: ink 2.6 / coral 1.2 / glow 0.5 at the widest, thin at the ends. */
  function fissure(L, spur, cold) {
    const tp = spur ? (u) => 1 - 0.75 * u : (u) => 0.3 + 0.7 * Math.pow(Math.sin(Math.PI * u), 0.6);
    if (cold) return fillPolys([ribbon(L, (u) => 1.2 * tp(u))], 'ink300');
    return fillPolys([ribbon(L, (u) => 2.6 * tp(u))], 'ink') + fillPolys([ribbon(L, (u) => 1.2 * tp(u))], 'hostile') +
      fillPolys([ribbon(L.slice(spur ? 0 : 2, spur ? 2 : -2), (u) => 0.5 * (spur ? 1 - 0.5 * u : Math.sin(Math.PI * u)))], 'hostileGlow');
  }
  // fuller than the first delivery (exponent 3.2, shallower teeth and notches) so the scorch covers more of the disc (R6)
  function blotchPts(C) {
    const rnd = rng(C.seed), n = 34, pts = [], e = 3.2;
    for (let i = 0; i < n; i++) {
      const a = TAU * i / n, ca = Math.cos(a), sa = Math.sin(a);
      const k = Math.pow(Math.pow(Math.abs(ca), e) + Math.pow(Math.abs(sa), e), -1 / e);
      let m = (i % 2 ? 0.93 : 0.98) + 0.02 * rnd();
      if (i % 11 === C.notch) m *= 0.82;
      pts.push([ca * k * C.rx * m, sa * k * C.ry * m]);
    }
    return pts;
  }
  function charStamp(v, cold) {
    const C = CHAR[v], plate = blotchPts(C);
    let s = fillPolys([plate], 'ink700', cold ? 0.55 : 1);
    if (!cold) {
      s += fillPolys(C.coals.map((c) => coal(c[0], c[1], c[2], c[3])), 'ink');
      s += fissure(C.crack, false, false) + (C.branch ? fissure(C.branch, true, false) : '');
      s += fillPolys(C.ash.slice(0, 3).map((q, i) => coal(q[0], q[1], q[2], i * 47 + 20)), 'ink300');
    } else {
      s += fillPolys(C.coals.map((c) => coal(c[0], c[1], c[2] * 0.9, c[3])), 'ink500', 0.8);
      s += fissure(C.crack, false, true) + (C.branch ? fissure(C.branch, true, true) : '');
      const ash = C.ash.concat([[-4.2, -4.6, 1.1], [6.4, 4.4, 1.2], [10.8, -3.8, 0.9], [-11.6, 4.2, 1.0]]);
      s += fillPolys(ash.map((q, i) => coal(q[0], q[1], q[2], i * 53 + 10)), 'ink300');
    }
    return s;
  }

  // ---- ember (work order §2.5, R4): spark → tumbling coral bit → drop → comma → dark → ash. Never a round disc ----
  // Painted ≤ 5×7 around the anchor. The ink rim is 0.45 on the light (upper-left) edges and up to 0.78 on the shadow
  // edges: inside 5×7 that is what leaves frames 0–3 ≥ 55 % coral + glow with a glow core ≥ 1 u² in frames 0–1 (§13-4).
  // With the 1.0–1.2 rim of the first delivery the same shapes are 30–33 % coral + glow (measured; API §13).
  // Inset rows follow the polygon's edges: [up-right, right, down-right, down-left, left, up-left].
  const EMBER_IN = [0.55, 0.72, 0.78, 0.6, 0.45, 0.45];
  function emberFrame(v, fr) {
    const M = (pts) => (v === 'b' ? mirror(pts) : pts);
    let ink = null, coralP = null, glowP = null, fillT = 'hostile';
    if (fr === 0) { // bright spark: fat, slightly tilted hexagon, broad glow core
      ink = M([[0.4, -3.5], [2.3, -1.5], [2.5, 1.1], [0.7, 3.4], [-1.8, 2.1], [-2.4, -0.9]]);
      coralP = insetConvex(ink, EMBER_IN); glowP = insetConvex(ink, EMBER_IN.map((d) => d + 0.75));
    } else if (fr === 1) { // tumbling bit, turned the other way, smaller core
      ink = M(rot([[0.2, -3.3], [2.2, -1.2], [2.1, 1.5], [0.3, 3.2], [-2.0, 1.5], [-2.2, -1.4]], 24, 0, 0));
      coralP = insetConvex(ink, EMBER_IN); glowP = insetConvex(ink, EMBER_IN.map((d) => d + 0.95));
    } else if (fr === 2) { // angular drop
      ink = M([[-0.8, -3.3], [2.0, -1.1], [2.3, 1.4], [0.7, 3.1], [-1.8, 2.2], [-2.3, -0.5]]);
      coralP = insetConvex(ink, EMBER_IN.map((d) => d * 0.92));
    } else if (fr === 3) { // comma: a fat head bending into a short tail
      const c = M([[-0.45, -2.2], [0.85, -0.95], [1.05, 0.65], [0.2, 1.9], [-0.8, 2.65]]);
      ink = ribbon(c, (u) => lerp(3.8, 1.4, u));
      coralP = ribbon(c, (u) => lerp(2.9, 0.45, Math.pow(u, 0.9)));
    } else if (fr === 4) { // dying: dark heart
      ink = M(rot([[-0.2, -2.6], [1.7, -0.6], [1.5, 1.6], [-0.3, 2.5], [-1.7, 0.9], [-1.6, -1.2]], -18, 0, 0));
      coralP = insetConvex(ink, 0.85); fillT = 'hostileDeep';
    } else {
      return fillPolys([M([[-1.2, 0.8], [0.1, -1.3], [1.3, 1.0], [0.2, 0.5]])], 'ink300'); // ash fleck, no ink rim
    }
    return fillPolys([ink], 'ink') + fillPolys([coralP], fillT) + fillPolys([glowP], 'hostileGlow');
  }

  // ---- smoke (work order §2.5): one ink.300 wisp rises, widens, splits in two and thins out ----
  function smokeFrame(v, fr) {
    const sg = v === 'b' ? -1 : 1, ph = v === 'b' ? 0.8 : 0;
    const wisp = (y0, len, amp, w0, w1, dx) => {
      const pts = [];
      for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([(dx || 0) + sg * amp * Math.sin(Math.PI * u * 1.25 + ph), y0 - len * u]); }
      return ribbon(pts, (u) => lerp(w0, w1, Math.sin(Math.PI * 0.5 * Math.min(1, u * 1.3))) * (u > 0.85 ? (1 - u) / 0.15 * 0.7 + 0.3 : 1));
    };
    const A = [0.7, 0.7, 0.68, 0.65, 0.6, 0.55][fr];
    let list;
    if (fr === 0) list = [wisp(-1, 9, 0.8, 1.6, 3.0)];
    else if (fr === 1) list = [wisp(-1, 15, 1.3, 1.4, 4.0)];
    else if (fr === 2) list = [wisp(-2, 20, 1.9, 1.2, 5.0)];
    else if (fr === 3) list = [wisp(-4, 18, 2.2, 1.0, 5.2), wisp(-17, 8, 1.0, 2.4, 3.2, sg * 2.2)];
    else if (fr === 4) list = [wisp(-6, 9, 1.0, 1.4, 3.2, -sg * 0.6), wisp(-17.5, 9, 1.4, 3.6, 4.4, sg * 2.0)];
    else list = [wisp(-11, 5, 0.6, 1.0, 2.2, -sg * 1.2), wisp(-20.5, 5.6, 0.8, 2.4, 3.0, sg * 2.6)];
    return fillPolys(list, 'ink300', A);
  }

  // ==== 3b. delivery 2 stamps (work order §4, §3.6) ====
  /** Closed Catmull-Rom spline through pts, k samples per span (fills only, no curves in the markup). */
  function smoothClosed(pts, k) {
    k = k || 6;
    const n = pts.length, out = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      for (let j = 0; j < k; j++) out.push(crPoint(p0, p1, p2, p3, j / k));
    }
    return out;
  }
  /** Open Catmull-Rom spline through pts (ends clamped), k samples per span, last point included. */
  function smoothOpen(pts, k) {
    k = k || 6;
    const n = pts.length, out = [];
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
      for (let j = 0; j < k; j++) out.push(crPoint(p0, p1, p2, p3, j / k));
    }
    out.push(pts[n - 1].slice());
    return out;
  }
  function crPoint(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t, c = (a, b, cc, d) => 0.5 * ((2 * b) + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
    return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
  }
  /** Vertices moved inward (d > 0) along their averaged normals; for smooth, gently curved outlines. */
  function offsetPoly(pts, d) {
    const n = pts.length, s = area(pts) > 0 ? 1 : -1, out = [];
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      out.push([pts[i][0] - dy / L * s * d, pts[i][1] + dx / L * s * d]);
    }
    return out;
  }
  const shiftPts = (pts, dx, dy) => pts.map((p) => [p[0] + dx, p[1] + dy]);
  const scalePts = (pts, k, cx, cy, ky) => pts.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * (ky == null ? k : ky)]);
  /** Point and segment index at length fraction u of a polyline. */
  function along(pts, u) {
    let tot = 0;
    const L = [];
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
    let want = clamp(u, 0, 1) * tot;
    for (let i = 0; i < L.length; i++) {
      if (want <= L[i] || i === L.length - 1) { const k = L[i] ? Math.min(1, want / L[i]) : 0; return { p: [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)], i, total: tot }; }
      want -= L[i];
    }
    return { p: pts[0].slice(), i: 0, total: tot };
  }
  /** The first `len` units of a polyline. */
  function cutPolyline(pts, len) {
    const out = [pts[0]];
    let left = len;
    for (let i = 1; i < pts.length && left > 0; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (l <= left) { out.push(pts[i]); left -= l; } else { const k = left / l; out.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]); left = 0; }
    }
    return out;
  }
  const polyLen = (pts) => { let t = 0; for (let i = 1; i < pts.length; i++) t += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return t; };
  /** A stone chip: irregular ink polygon, its face (inset) and a sheen sliver on the upper-left (light side). */
  function chip(cx, cy, w, h, deg, seed, rimW) {
    const rnd = rng(seed), n = 6, base = [];
    for (let i = 0; i < n; i++) { const a = TAU * (i + 0.15 * (rnd() - 0.5)) / n, k = 0.78 + 0.28 * rnd(); base.push([cx + Math.cos(a) * w / 2 * k, cy + Math.sin(a) * h / 2 * k]); }
    const ink = rot(base, deg, cx, cy), face = insetConvex(ink, rimW || 0.7) || scalePts(ink, 0.6, cx, cy);
    const sheen = face ? [face[3], face[4], scalePts([face[4]], 0.55, cx, cy)[0], scalePts([face[3]], 0.55, cx, cy)[0]] : null;
    return { ink, face, sheen };
  }

  // ---- shock (§4.1): pebbles that jump on the cracks, burst core, flying shards, dust ----
  /** Pebble: a small chip sitting at the anchor (frame 0) and hopping 1.8 up (frame 1) over a shadow dash. */
  function pebbleFrame(v, fr) {
    const c = chip(0, fr ? -3.7 : -2.3, 3.6, 2.2, v === 'b' ? 28 : -12, v === 'b' ? 71 : 43, 0.55);
    let s = fr ? fillPolys([[[-1.5, -1.45], [1.5, -1.45], [1.3, -1.05], [-1.3, -1.05]]], 'ink', 0.55) : '';
    s += fillPolys([c.ink], 'ink') + fillPolys([c.face], 'ink500') + fillPolys([c.sheen], 'ink300');
    return s;
  }
  /** Shard: a stone chip turning as it flies (the renderer moves it); the last frame is smaller. */
  const SHARD = { a: { w: 7.2, h: 4.6, deg: [0, 65, 140, 215], seed: 13 }, b: { w: 6.2, h: 5.2, deg: [20, 95, 175, 250], seed: 29 }, c: { w: 8, h: 3.8, deg: [-15, 50, 120, 200], seed: 41 } };
  function shardFrame(v, fr) {
    const S = SHARD[v], k = fr === 3 ? 0.8 : 1, c = chip(0, -6, S.w * k, S.h * k, S.deg[fr], S.seed, 0.9);
    return fillPolys([c.ink], 'ink') + fillPolys([c.face], 'ink500') + fillPolys([c.sheen], 'ink300');
  }
  /** Burst core (≤ 66×66): an irregular paper flash, lifted flagstones, a crater with coral-lit fissures. Not a star. */
  const CORE_SLABS = [[-19, -3, 13, 7, -14], [17, -5, 12, 6, 18], [-4, -15, 10, 6, 6], [8, 8, 11, 6, -8], [-14, 9, 8, 5, 24]];
  const CORE_CRACKS = [[[-2, 0], [-8, -1.5], [-12, 1], [-19, 0.5]], [[1, -1], [6, -3], [9, -2], [15, -5]], [[0, 1], [2, 4.5], [-1, 7], [1, 10]], [[-1, -1], [-3, -4.5], [0, -7], [-2, -10]], [[2, 1], [7, 3], [12, 2.5]]];
  function coreFrame(fr) {
    const lift = [9, 13, 7, 1.5][fr], glowOn = fr <= 1, rnd = rng(77);
    let s = '';
    // crater: an irregular ink.700 pit with an ink rim
    const pit = ellPts(0, 0, 21, 8.4, 22, 5, 0.08);
    s += fillPolys([pit], 'ink') + fillPolys([scalePts(pit, 0.86, 0, 0, 0.78)], 'ink700');
    // fissures from the pit: ink / coral / glow while burning, ink / hostD at the end
    CORE_CRACKS.forEach((cp, i) => {
      const L = cp.map((p) => [p[0] * 1.2, p[1] * 1.1]);
      s += fillPolys([ribbon(L, (u) => 3 * (1 - 0.6 * u))], 'ink');
      s += fillPolys([ribbon(L, (u) => 1.4 * (1 - 0.6 * u))], fr === 3 ? 'hostileDeep' : 'hostile');
      if (glowOn) s += fillPolys([ribbon(L.slice(0, 3), (u) => 0.6 * (1 - u))], 'hostileGlow');
    });
    // paper flash: an irregular blob (frame 0 large, frame 1 small) ringed with glow
    if (fr <= 1) {
      const k = fr ? 0.5 : 1, R = [1, 0.62, 0.9, 0.7, 0.96, 0.58, 0.84, 0.66, 0.92, 0.6, 0.78];
      const blob = R.map((rr, i) => { const a = TAU * (i + 0.3 * (rnd() - 0.5)) / R.length; return [Math.cos(a) * 23 * rr * k, -8 + Math.sin(a) * 15 * rr * k]; });
      s += fillPolys([scalePts(blob, 1.18, 0, -8)], 'hostileGlow') + fillPolys([blob], 'p50');
    }
    // flagstones: top face p300, side ink.500, ink outline; they rise in frames 0–1 and settle by frame 3
    CORE_SLABS.forEach((q, i) => {
      const lf = lift * (0.6 + 0.4 * ((i * 37) % 5) / 4), deg = q[4] * (fr === 3 ? 0.4 : 1), cx = q[0], cy = q[1] - lf;
      const top = rot([[cx - q[2] / 2, cy - q[3] / 2], [cx + q[2] / 2, cy - q[3] / 2 + 1], [cx + q[2] / 2 - 1, cy + q[3] / 2], [cx - q[2] / 2 + 1, cy + q[3] / 2 - 0.5]], deg, cx, cy);
      const side = [top[3], top[2], [top[2][0], top[2][1] + 2.4], [top[3][0], top[3][1] + 2.4]];
      s += fillPolys([[top[0], top[1], top[2], side[2], side[3], top[3]]], 'ink') + fillPolys([insetConvex(side, 0.5)], 'ink500') + fillPolys([insetConvex(top, 0.7)], 'p300');
    });
    return s;
  }
  /** Dust: an ink.300 puff that spreads, splits and thins (flat, α 0.7 → 0.3). */
  function dustFrame(v, fr) {
    const sg = v === 'b' ? -1 : 1, A = [0.7, 0.6, 0.45, 0.3][fr];
    const P = [[[0, -2.5, 4.5, 2.2]], [[0, -4, 7.5, 3.2], [sg * 6.5, -2.5, 2.6, 1.4]], [[-sg * 4.5, -5, 5.2, 2.8], [sg * 5, -6.5, 4.4, 2.4]], [[-sg * 6, -7, 3.6, 1.6], [sg * 6.5, -8.5, 3.2, 1.4], [0, -5, 2, 1]]][fr];
    return fillPolys(P.map((q, i) => ellPts(q[0], q[1], q[2], q[3], 14, 31 + i * 7 + fr, 0.12)), 'ink300', A);
  }

  // ---- slow (§4.2): ink mire puddles and their bubbles ----
  // Puddle: a lobed flat blob (3/4 view) with 1–2 droplets; ink rim 2, ink.700 body, an ink.500 crescent sheen on the
  // upper-left inner edge (1.5–2). No dots or paper highlights inside (they read as eyes). [rx, ry, lobes, droplets]
  // xl (r ≥ 160, the map's large slow zones up to 270): the same puddle grammar at the size the 25–35 % rule needs there
  // within the per-hazard cap (18 puddles); its sheen band is a little wider (inset 2 → 4.6).
  const MIRE = {
    s: { box: [36, 20], body: [12.2, 5.6], drops: [[13.4, 1.4, 1.5, 1.0]] },
    m: { box: [52, 28], body: [19, 8.6], drops: [[20.4, 3.0, 2.0, 1.3], [-20.6, -2.8, 1.4, 0.9]] },
    l: { box: [76, 40], body: [29, 13.2], drops: [[31.2, 4.2, 2.6, 1.6], [-31.4, -3.6, 1.8, 1.1]] },
    xl: { box: [132, 60], body: [52, 23.6], drops: [[55.4, 7.6, 3.6, 2.2], [-55.8, -6.4, 2.6, 1.6]], sheen: 4.6 }
  };
  const MIRE_LOBES = { a: [[2, 0.07, 0.6], [3, 0.1, 2.1], [5, 0.06, 0.4]], b: [[2, 0.06, 2.4], [3, 0.11, 0.9], [4, 0.07, 1.7]] };
  function mireOutline(sz, v) {
    const M = MIRE[sz], L = MIRE_LOBES[v], pts = [];
    for (let i = 0; i < 40; i++) {
      const a = TAU * i / 40;
      let k = 1;
      L.forEach((q) => { k += q[1] * Math.sin(q[0] * a + q[2]); });
      pts.push([Math.cos(a) * M.body[0] * k, Math.sin(a) * M.body[1] * k]);
    }
    return pts;
  }
  function mireStamp(sz, v) {
    const M = MIRE[sz], outer = mireOutline(sz, v), body = offsetPoly(outer, 2), sg = v === 'b' ? -1 : 1;
    const drops = M.drops.map((q) => ellPts(q[0] * sg, q[1], q[2], q[3], 12, 3, 0.05));
    // crescent sheen: the band between insets 2 and 3.8 along the upper-left (angles 3.3–4.6 rad)
    const i0 = Math.round(40 * 3.3 / TAU), i1 = Math.round(40 * 4.6 / TAU), inner = offsetPoly(outer, M.sheen || 3.8), band = [];
    for (let i = i0; i <= i1; i++) band.push(body[i]);
    for (let i = i1; i >= i0; i--) { const t = (i - i0) / (i1 - i0), w = Math.sin(Math.PI * t); band.push([lerp(body[i][0], inner[i][0], w), lerp(body[i][1], inner[i][1], w)]); }
    return fillPolys([outer].concat(drops), 'ink') + fillPolys([body].concat(drops.map((d) => scalePts(d, 0.55, d.reduce((s, p) => s + p[0], 0) / d.length, d.reduce((s, p) => s + p[1], 0) / d.length))), 'ink700') + fillPolys([band], 'ink500');
  }
  /** Bubble on a puddle: bump → swelling dome (ink.500 crescent, never a dot) → stretched → burst ring + 3 drops → fading ring. */
  function bubbleFrame(v, fr) {
    const sg = v === 'b' ? -1 : 1;
    const dome = (w, h) => { const pts = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; pts.push([Math.cos(a) * w / 2, -0.2 - Math.sin(a) * h]); } return pts; };
    // the sheen stays on the upper-left (light side) for both variants
    const crescent = (w, h) => { const pts = [], back = []; for (let i = 7; i <= 11; i++) { const a = Math.PI * i / 12; pts.push([Math.cos(a) * w / 2 * 0.78, -Math.sin(a) * h * 0.78]); back.push([Math.cos(a) * w / 2 * 0.5, -Math.sin(a) * h * 0.55]); } return pts.concat(back.reverse()); };
    if (fr <= 3) {
      const D = [[4, 1.6], [5.6, 3], [7, 4.4], [6, 6]][fr], d = dome(D[0], D[1]);
      let s = fillPolys([d], 'ink') + fillPolys([insetConvex(d, 0.8) || scalePts(d, 0.7, 0, -D[1] / 2)], 'ink700');
      if (fr >= 1) s += fillPolys([crescent(D[0], D[1])], 'ink500');
      return s;
    }
    const ringPts = (rx, ry, w) => { const o = ellPts(0, -2.2, rx + w / 2, ry + w / 2, 20, 1, 0), i = ellPts(0, -2.2, rx - w / 2, ry - w / 2, 20, 1, 0); return [o.slice(0, 11).concat(i.slice(0, 11).reverse()), o.slice(10).concat([o[0]], [i[0]], i.slice(10).reverse())]; };
    if (fr === 4) return fillPolys(ringPts(3.1, 1.2, 0.9), 'ink') + fillPolys([[-3, -5, 0.8], [0.4 * sg, -7, 0.7], [2.9 * sg, -5.6, 0.7]].map((q) => ellPts(q[0], q[1], q[2], q[2] * 0.8, 8, 2, 0)), 'ink');
    return fillPolys(ringPts(3.3, 1.3, 0.7), 'ink300');
  }

  // ---- water (§4.3): ripples, flow streaks, a glint. Neutral: paper and ink only, never cyan ----
  /** A filled ring (or arcs of it) along an ellipse: [from, to] fractions of the turn. */
  function ellRibbon(cx, cy, rx, ry, w, arcs) {
    return arcs.map((q) => { const pts = []; const n = Math.max(4, Math.round(28 * (q[1] - q[0]))); for (let i = 0; i <= n; i++) { const a = TAU * lerp(q[0], q[1], i / n); pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return ribbon(pts, () => w); });
  }
  function rippleFrame(v, fr) {
    const sg = v === 'b' ? -1 : 1, t = fr / 7, ro = lerp(3, 16, Math.pow(t, 0.8)), wo = lerp(1.6, 0.8, t);
    const arcs = fr <= 5 ? [[0, 0.5], [0.48, 1.02]] : fr === 6 ? [[0.04, 0.3], [0.38, 0.62], [0.7, 0.94]] : [[0.1, 0.24], [0.46, 0.58], [0.76, 0.86]];
    const rings = [[0, ro, wo]];
    if (fr >= 2) rings.push([sg * 0.8, lerp(3, 12, Math.pow((fr - 2) / 5, 0.8)), lerp(1.4, 0.8, (fr - 2) / 5)]);
    // ry 0.3·rx: the 40×18 box (paint 34×12) holds rx 16 only that flat
    let s = '';
    rings.forEach((q) => { s += fillPolys(ellRibbon(q[0], 0.6, q[1], q[1] * 0.3, 0.8, arcs.map((a) => [a[0] + 0.02, Math.min(a[1], a[0] + 0.5)]).filter((a) => a[1] > a[0])), 'ink300'); });
    rings.forEach((q) => { s += fillPolys(ellRibbon(q[0], 0, q[1], q[1] * 0.3, q[2], arcs), 'p300'); });
    return s;
  }
  function flowFrame(v, fr) {
    const S = v === 'b' ? [[-16, -0.9, 13], [-4, 1.0, 10]] : [[-17, -1.0, 14], [-6, 1.0, 11]];
    return fillPolys(S.map((q) => { const x0 = q[0] + 2 * fr, pts = []; for (let i = 0; i <= 8; i++) pts.push([x0 + q[2] * i / 8, q[1] + 0.25 * Math.sin(Math.PI * i / 8)]); return ribbon(pts, (u) => 1.4 * Math.pow(Math.sin(Math.PI * u), 0.6)); }), 'p300');
  }
  const glintFrame = (fr) => fillPolys([lens(0, 0, fr ? 3 : 2, fr ? 0.8 : 0.6, 6)], 'p50');
  /**
   * Long surface strokes (review 3 W1): two broken horizontal lines per stamp (top 58–60 long, bottom 44 long, their
   * centres 14–29 apart, 3 apart vertically), gently waving (amplitude ≤ 0.55, wavelength 30–36). Row [x0, x1, yc, amp,
   * wavelength, phase, slots]. Each line has two break slots [c, φ] at least 18 apart: the break of slot (c, φ) at frame
   * f has age a = (f + φ) mod 6, sits at c − 6 + 2a and is [0, 4, 6, 6, 4, 0][a] wide — it flows right 2 per frame while
   * it opens and closes. The two slots of a line run 3 frames apart, so a line always has 1–2 breaks (2–3 segments, every
   * segment ≥ 6), the segments flow and the breaks move while the line's ends stay (not a rigid push), and from the last
   * frame to the first every visible break also moves by 2. p300 1.6 tapering to 0.8 at every segment end over an ink300
   * 0.8 shadow line 0.6 below (the ripple tokens). No closed shapes, no dots (segments < 5 would be dropped; none are).
   */
  const WAVE = {
    a: [[-38, 22, -1.5, 0.55, 34, 0.3, [[-22, 0], [2, 3]]], [-16, 28, 1.5, 0.5, 30, 1.9, [[-2, 1], [16, 4]]]],
    b: [[-22, 36, -1.5, 0.5, 36, 2.4, [[-8, 2], [16, 5]]], [-44, 0, 1.5, 0.55, 30, 0.7, [[-30, 0], [-12, 3]]]]
  };
  const WAVE_GAP = [0, 4, 6, 6, 4, 0];
  function waveFrame(v, fr) {
    let shadow = [], light = [];
    WAVE[v].forEach((L) => {
      const y = (x) => L[2] + L[3] * Math.sin(TAU * (x - L[0]) / L[4] + L[5]);
      const cuts = L[6].map((sl) => { const a = (fr + sl[1]) % 6, c = sl[0] - 6 + 2 * a, w = WAVE_GAP[a]; return [c - w / 2, c + w / 2, w]; }).filter((q) => q[2] > 0).sort((p, q) => p[0] - q[0]);
      let x = L[0];
      const segs = [];
      cuts.forEach((q) => { segs.push([x, q[0]]); x = q[1]; });
      segs.push([x, L[1]]);
      segs.filter((q) => q[1] - q[0] >= 5).forEach((q) => {
        const n = Math.max(4, Math.ceil((q[1] - q[0]) / 1.5)), pts = [];
        for (let i = 0; i <= n; i++) { const xx = lerp(q[0], q[1], i / n); pts.push([xx, y(xx)]); }
        light.push(ribbon(pts, (u) => 0.8 + 0.8 * Math.pow(Math.sin(Math.PI * u), 0.5)));
        shadow.push(ribbon(pts.slice(1, -1).map((p) => [p[0], p[1] + 0.6]), () => 0.8));
      });
    });
    return fillPolys(shadow, 'ink300') + fillPolys(light, 'p300');
  }

  // ---- root (§4.4): an ink vine from a ground crack, creeping low, its tip rising and curling inward (+x) ----
  // line: centre line from the crack; thorns [u along the line, side (+1 = outer/upper-left)]; no round tips, no paper,
  // no signal colour. Height ≤ 16 above the anchor.
  // A bramble, not a single fat hook (that read as a seahorse or a tadpole at 1x): a long low main stem ending in a small
  // inward hook, a short second stem the other way, thin (2.2 / 1.8) with small thorns, out of a wide ground crack.
  const VINE = {
    a: { line: [[-4.6, -0.6], [-1.4, -1.6], [2, -2], [4.6, -3.8], [6, -7], [6, -10.2], [7.4, -12], [9.2, -11.2], [9.2, -9.4]], thorns: [[0.18, 1], [0.38, 1], [0.55, -1], [0.7, 1]], second: [[-5, -0.6], [-7.4, -1.8], [-9, -4], [-8.4, -6]], crack: [[-9.8, 0.6], [-6, -1.3], [-1, -1], [1.6, 0.4], [-3.6, 1.3]] },
    b: { line: [[-3.6, -0.6], [-0.4, -1.4], [3, -1.6], [5.8, -3], [7.4, -6], [8, -9], [9.6, -10.4]], thorns: [[0.2, 1], [0.42, 1], [0.6, 1], [0.78, -1]], second: [[-4.4, -0.6], [-7, -2.6], [-8, -5.4], [-6.6, -7.4]], crack: [[-9.4, 0.5], [-5.6, -1.2], [-0.4, -1], [1.8, 0.4], [-3, 1.3]] },
    c: { line: [[-3.6, -0.6], [-1.2, -2.6], [1.4, -4.6], [2.6, -8], [2.4, -11.4], [4, -13.6], [6.6, -13.6], [7.6, -11.6], [6.6, -10.2]], thorns: [[0.22, 1], [0.42, 1], [0.58, -1], [0.72, 1]], second: [[-4.2, -0.6], [-6.8, -1.6], [-9.2, -1.8]], crack: [[-9.8, 0.5], [-6.4, -1.1], [-1.6, -0.9], [0.4, 0.5], [-4.4, 1.2]] }
  };
  /** Vine geometry: ink ribbon (w0 → 0.15, pointed), thorn wedges on the line, an ink.500 sheen on the upper-left. */
  function vineShape(line, thorns, w0) {
    const pts = smoothOpen(line, 5), W = (u) => (w0 || 2.2) * Math.pow(1 - u, 0.7) + 0.15;
    const ink = [ribbon(pts, W)], sheen = [];
    const at = (u) => { const q = along(pts, u), a = pts[q.i], b = pts[Math.min(pts.length - 1, q.i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return { p: q.p, t: [dx / L, dy / L], n: [dy / L, -dx / L] }; };
    thorns.forEach((th) => {
      const q = at(th[0]), w = W(th[0]) / 2, sd = th[1], base = [q.p[0] + q.n[0] * w * sd, q.p[1] + q.n[1] * w * sd];
      ink.push([[base[0] - q.t[0] * 0.8, base[1] - q.t[1] * 0.8], [base[0] + q.t[0] * 0.8, base[1] + q.t[1] * 0.8], [base[0] + q.n[0] * 1.7 * sd - q.t[0] * 1.1, base[1] + q.n[1] * 1.7 * sd - q.t[1] * 1.1]]);
    });
    const sh = [];
    for (let i = 0; i <= 8; i++) { const q = at(0.3 + 0.5 * i / 8), w = W(0.3 + 0.5 * i / 8) / 2; sh.push([q.p[0] + q.n[0] * w * 0.45, q.p[1] + q.n[1] * w * 0.45]); }
    sheen.push(ribbon(sh, (u) => 0.8 * Math.sin(Math.PI * u)));
    return { ink, sheen };
  }
  /** One vine frame: mode loop (sway), emerge (crack → spike → half → full with an extra curl), wither (droop → break → sink). */
  /** Move a point list so its x stays in [−9.4, 9.4] and its y ≤ 0.4 (the vine box's paint area, with the ribbon). */
  function fitVine(pts) {
    let x0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach((p) => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    const dx = x1 > 8.6 ? 8.6 - x1 : x0 < -8.6 ? -8.6 - x0 : 0, dy = y1 > -0.6 ? -0.6 - y1 : 0;
    return shiftPts(pts, dx, dy);
  }
  function vineFrame(v, mode, fr) {
    const V0 = VINE[v], sx = (pts) => pts.map((p) => [p[0] * 0.95, p[1]]);
    const V = { line: sx(V0.line), thorns: V0.thorns, second: sx(V0.second), crack: V0.crack.map((p) => [p[0] * 0.95, p[1] * 0.58]) };
    let s = fillPolys([V.crack], 'ink');
    const sway = (pts, dx) => pts.map((p) => [p[0] + dx * clamp(-p[1] / 12, 0, 1), p[1]]);
    const draw = (line, thorns, w0) => { const sh = vineShape(line, thorns, w0); return fillPolys(sh.ink, 'ink') + fillPolys(sh.sheen, 'ink500'); };
    // the second stem runs leftward, so its outer (upper) side is the −1 normal
    const second = (k) => draw(k == null ? V.second : cutPolyline(smoothOpen(V.second, 4), polyLen(smoothOpen(V.second, 4)) * k), [[0.45, -1]], 1.8);
    // the tip travels 2 (§4.4 "±2"), leaning inward: the hook already sits at the box's right margin
    if (mode === 'loop') return s + second() + draw(sway(V.line, [0.3, -0.8, -1.7, -0.8][fr]), V.thorns);
    if (mode === 'emerge') {
      if (fr === 0) return s + fillPolys([[-6, -1.9, 0.8], [-2.4, -2.1, 0.7], [-8.4, -1.5, 0.6]].map((q, i) => coal(q[0], q[1], q[2], i * 50)), 'ink300');
      if (fr === 1) return s + draw([[-3.6, -0.6], [-3, -3.4], [-2, -6]], [], 2.2) + draw([[-5, -0.6], [-6.4, -2.6], [-7.2, -4.4]], [], 1.6);
      const pts = smoothOpen(V.line, 5);
      if (fr === 2) { const half = cutPolyline(pts, polyLen(pts) * 0.62); return s + second(0.7) + draw(half.filter((p, i) => i % 5 === 0 || i === half.length - 1), V.thorns.filter((t) => t[0] < 0.55 && t[1] > 0).map((t) => [t[0] / 0.62, t[1]])); }
      // the extra curl lengthens the line: thorns keep their places along it (u scaled by the length ratio), so the
      // top thorn of vine c stays inside the 16-unit height like the loop frames
      const end = V.line[V.line.length - 1], curl = V.line.slice(0, -1).concat([[end[0] - 0.8, end[1] + 1.4], [end[0] - 2.2, end[1] + 1.8]]);
      const kL = polyLen(pts) / polyLen(smoothOpen(curl, 5));
      return s + second() + draw(curl, V.thorns.map((t) => [t[0] * kL, t[1]]));
    }
    // wither: the hook droops, the stem breaks in two, the pieces sink into the crack
    const pivot = V.line[3], droop = (pts, deg, k) => pts.map((p, i) => (i <= 3 ? p : scalePts(rot([p], deg, pivot[0], pivot[1]), k || 0.72, pivot[0], pivot[1])[0]));
    if (fr <= 1) return s + second(fr ? 0.7 : 1) + draw(droop(V.line, fr ? 52 : 30, fr ? 0.54 : 0.64), V.thorns, fr ? 1.9 : 2.1);
    const a = V.line.slice(0, 4), b = droop(V.line, 95).slice(3), k = fr === 2 ? 1 : 0.55;
    return s + draw(scalePts(a, k, a[0][0], a[0][1]), [[0.4, 1]], 2 * k + 0.4) + draw(fitVine(shiftPts(scalePts(b, k, b[0][0], b[0][1]), 1.5, fr === 2 ? 1 : 2.4)), [], 1.6 * k + 0.4);
  }

  // ---- hero bind (§3.6, review 3 B1): vines come out of the ground at the feet, climb and wind round each leg ----
  // Back layer (behind the hero): a low thorny root clump under and beside the feet (x ±19, y ≤ +1.7, its top edge lit in
  // p300) that rises with the frames, and one tendril per side climbing from it at x ±17 up the outside of the silhouette
  // to y −13.8 (ink 3.6 → 2.4) — the climb reads at 1x beside the coat in every pose. Front layer: one helix strand per
  // leg, the same handedness on both legs (a spiral, not a chevron): it grows from the ground just right of the leg's
  // right edge and winds up across the front of the leg to its left edge at y −12.8 (ink 3.4 → 2.4), plus a short
  // root arching over each toe that pins the boot (ink 2.8 → 2.0). Every vine has a p300 0.8 edge on its lit (upper-left)
  // side, so it stays readable on the black boots and the hurt pose's black coat. Frames grow 0.3 / 0.6 / 0.85 / 1 (the
  // clump and climb first, then the wrap); thorns on the shadow side from frame 2. Back paints in [−20, −16]–[20, 2],
  // front in [−18, −15]–[18, 3] (the foot ring stays clear below y +3).
  const BIND = {
    leg: 6.5, R: 6.2, top: -12.8, bot: -4.2, sag: 1.6, edge: 0.8, light: [-0.6, -0.8],
    // the climb keeps to the outside of the silhouette and its paper halo (x 14–17) as long as it can
    tendril: [[17.0, -1.4], [17.2, -4.8], [16.4, -8.6], [14.6, -11.6], [12.2, -13.4], [10.0, -13.8]],
    // the front strand starts on the ground just right of the leg's right edge: the vine visibly comes out of the ground
    riser: [[1.0, 0.6], [0.5, -1.8]],
    // the root mass the vines come out of: a low thorny clump under and beside the feet (both sides show past the boots
    // in every pose), its top edge lit in p300
    mass: [[-19, 1.0], [-18.4, -1.2], [-16.8, -2.2], [-15.4, -4.8], [-14.0, -2.2], [-11.6, -1.8], [-10.2, -4.4], [-8.8, -1.6],
      [-4, -1.0], [0, -0.8], [4, -1.0], [8.8, -1.6], [10.2, -4.4], [11.6, -1.8], [14.0, -2.2], [15.4, -4.8], [16.8, -2.2],
      [18.4, -1.2], [19, 1.0], [12, 1.7], [0, 1.5], [-12, 1.7]],
    // short roots arching over the toes in front (they pin the boots to the ground)
    toe: [[2.6, 1.4], [4.6, -1.2], [7.4, -2.6], [10.2, -1.4], [11.6, 1.2]]
  };
  /**
   * Front half of one turn around the leg on side sd (−1 left, +1 right), ordered from the ground up: the riser just
   * right of the leg's right edge, then up across the front to the left edge at the top. Both legs use the same
   * handedness, so the two strands read as one spiral winding each leg (mirrored legs read as a chevron). The turn
   * continues behind the leg in the back layer.
   */
  function bindStrand(sd) {
    // grown from the ground up: riser at the outer foot of the right edge, then up-left across the front of the leg
    const pts = [], x1 = BIND.leg * sd + BIND.R;
    BIND.riser.forEach((q) => pts.push([x1 + q[0], q[1]]));
    for (let i = 16; i >= 0; i--) { const t = i / 16; pts.push([BIND.leg * sd - BIND.R * Math.cos(Math.PI * t), lerp(BIND.top, BIND.bot, t) + BIND.sag * Math.sin(Math.PI * t)]); }
    return smoothOpen(pts.filter((p, i) => i < 2 || i % 2 === 0 || i === pts.length - 1), 3);
  }
  /** Ink ribbon with a p300 edge along its lit side (the side whose normal faces the upper-left light). */
  function litVine(pts, wf) {
    if (pts.length < 2) return '';
    const n = pts.length, A = pts[0], B = pts[n - 1], tx = B[0] - A[0], ty = B[1] - A[1];
    const sg = (ty * BIND.light[0] - tx * BIND.light[1]) >= 0 ? 1 : -1, acc = [0], edge = [];
    for (let i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = acc[n - 1] || 1;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, d = wf(acc[i] / tot) / 2 + BIND.edge / 2;
      edge.push([pts[i][0] + sg * dy / L * d, pts[i][1] - sg * dx / L * d]);
    }
    return fillPolys([ribbon(edge, () => BIND.edge)], 'p300') + fillPolys([ribbon(pts, wf)], 'ink');
  }
  /** A thorn on the shadow side of a vine at length fraction u (size h). */
  function bindThorn(pts, u, h) {
    const q = along(pts, u), p = q.p, a = pts[q.i], b = pts[Math.min(pts.length - 1, q.i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const A = pts[0], B = pts[pts.length - 1], sg = ((B[1] - A[1]) * BIND.light[0] - (B[0] - A[0]) * BIND.light[1]) >= 0 ? -1 : 1, n = [sg * dy / L, -sg * dx / L];
    return fillPolys([[[p[0] - dx / L * 1.2, p[1] - dy / L * 1.2], [p[0] + dx / L * 1.2, p[1] + dy / L * 1.2], [p[0] + n[0] * (h || 2.6) + dx / L * 0.7, p[1] + n[1] * (h || 2.6) + dy / L * 0.7]]], 'ink');
  }
  function bindFrame(layer, fr) {
    const g = [0.3, 0.6, 0.85, 1][fr];
    let s = '';
    if (layer === 'back') {
      // the root mass rises first (scaled up from the ground line), then the climbs
      const kM = Math.min(1, 0.45 + g * 0.55), mass = BIND.mass.map((p) => [p[0] * Math.min(1, 0.7 + g * 0.3), 1.0 + (p[1] - 1.0) * kM]);
      s += fillPolys([ribbon(mass.slice(1, 18).map((p) => [p[0], p[1] - 0.45]), () => BIND.edge)], 'p300') + fillPolys([mass], 'ink');
    }
    [-1, 1].forEach((sd) => {
      if (layer === 'back') {
        const tl = smoothOpen(BIND.tendril.map((p) => [p[0] * sd, p[1]]), 4), climb = cutPolyline(tl, polyLen(tl) * Math.min(1, g * 1.25));
        s += litVine(climb, (u) => lerp(3.6, 2.4, u));
        if (fr >= 2) [0.36, 0.66].forEach((u) => { s += bindThorn(tl, u, 2.8); });
      } else {
        const st = bindStrand(sd), k = clamp((g - 0.45) / 0.55, 0, 1);
        if (k > 0) s += litVine(cutPolyline(st, polyLen(st) * k), (u) => lerp(3.4, 2.4, u));
        if (fr >= 2) [0.34, 0.56, 0.8].forEach((u) => { s += bindThorn(st, u, 2.8); });
        const toe = smoothOpen(BIND.toe.map((p) => [p[0] * sd, p[1]]), 4);
        s += litVine(cutPolyline(toe, polyLen(toe) * Math.min(1, g * 1.4)), (u) => 2.8 - 0.8 * u);
      }
    });
    return s;
  }

  // ---- trap (§4.5): the centre machine per chapter (1 rat-trap jaws, 2 chain snare, 3 wet iron net, 4 saw gear) ----
  // Paint ≤ 76×56 around the anchor (the plate itself is SPEC). Neutral: ink, paper and the chapter's own material colours
  // (PN.env.CH[ch] light/base/deep/spot, read only). States: armed · spring (3 frames: bite, close, settle + dust) · shut.
  const chColor = (ch, key) => (PN.env && PN.env.CH && PN.env.CH[ch] ? PN.env.CH[ch][key] : K.ink500);
  const ellLoop = (cx, cy, rx, ry, n, a0, a1) => { const pts = []; for (let i = 0; i <= n; i++) { const a = lerp(a0 == null ? 0 : a0, a1 == null ? TAU : a1, i / n); pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return pts; };
  /** Ink ring band (two half-annuli, so one nonzero path keeps the hole). */
  function ringBand(cx, cy, rx, ry, w) {
    const o = ellLoop(cx, cy, rx + w / 2, ry + w / 2, 24), i = ellLoop(cx, cy, rx - w / 2, ry - w / 2, 24);
    return [o.slice(0, 13).concat(i.slice(0, 13).reverse()), o.slice(12).concat(i.slice(12).reverse())];
  }
  function dustPuffs(list, a) { return fillPolys(list.map((q, i) => ellPts(q[0], q[1], q[2], q[2] * 0.5, 12, 61 + i, 0.15)), 'ink300', a == null ? 0.7 : a); }
  function trapStamp(ch, state, fr) {
    const light = chColor(ch, 'light'), deep = chColor(ch, 'deep'), spot = chColor(ch, 'spot');
    let s = '';
    if (ch === 1) {
      // rat trap: iron base, toothed jaw ring (p300 teeth), spring coil, pressure pad
      const base = ellPts(0, 2, 34, 22, 28, 3, 0.02);
      s += fillPolys([base], 'ink') + fillPolys([scalePts(base, 0.94, 0, 2)], deep);
      s += fillPolys([ribbon(ellLoop(0, 2, 30, 19.5, 16, Math.PI * 1.05, Math.PI * 1.6), () => 1.4)], light, 0.8);
      if (state === 'armed') {
        s += fillPolys(ringBand(0, 0, 24, 15, 4.4), 'ink');
        const teeth = [];
        for (let i = 0; i < 16; i++) { const a = TAU * i / 16, a1 = a - 0.13, a2 = a + 0.13; teeth.push([[Math.cos(a1) * 22, Math.sin(a1) * 13.8], [Math.cos(a) * 17, Math.sin(a) * 10.4], [Math.cos(a2) * 22, Math.sin(a2) * 13.8]]); }
        s += fillPolys(teeth.map((t) => offsetPoly(t, -0.6)), 'ink') + fillPolys(teeth, 'p300');
        const pad = ellPts(0, 0, 9.5, 6, 18, 7, 0);
        s += fillPolys([pad], 'ink') + fillPolys([scalePts(pad, 0.82, 0, 0)], 'ink500') + fillPolys([lens(-1.5, 0.6, 4.4, 0.5, 6)], 'p300', 0.8);
      } else {
        // the jaws meet on the centre line: two bars with interlocked teeth
        const k = state === 'spring' ? [0.55, 1, 1][fr] : 1, dy = state === 'spring' ? [6, 0, 0][fr] : 0, jolt = state === 'spring' && fr === 2 ? 1.2 : 0;
        const bar = (sg) => [[-25, sg * (2.6 + dy) - jolt], [25, sg * (2.6 + dy) - jolt], [24, sg * (7.8 + dy * k) - jolt], [-24, sg * (7.8 + dy * k) - jolt]];
        s += fillPolys([bar(-1), bar(1)], 'ink');
        const teeth = [];
        for (let i = 0; i < 11; i++) { const x = -22 + i * 4.4, sg = i % 2 ? 1 : -1; teeth.push([[x - 1.6, sg * (2.6 + dy) - jolt], [x + 1.6, sg * (2.6 + dy) - jolt], [x, -sg * (0.4 - dy) - jolt]]); }
        s += fillPolys(teeth, 'p300');
        if (state === 'shut') s += fillPolys([ribbon([[-30, 10], [-24, 8.4], [-19, 11], [-13, 9.6]], () => 0.9), ribbon([[18, -12], [23, -10], [28, -12.6]], () => 0.9)], 'ink');
      }
      // spring coil on the left
      const coil = [];
      for (let i = 0; i < 3; i++) coil.push(ringBand(-30 + i * 3, -3 - i * 1.2, 2.4, 4.2, 1.2));
      s += fillPolys([].concat.apply([], coil), 'ink');
    } else if (ch === 2) {
      // chain snare: a noose of links, a chain to a stake
      const rr = state === 'armed' ? 1 : state === 'spring' ? [0.62, 0.38, 0.32][fr] : 0.3, links = [];
      const n = Math.max(8, Math.round(22 * rr + 6));
      for (let i = 0; i < n; i++) {
        const a = TAU * i / n, x = Math.cos(a) * 26 * rr - 4, y = Math.sin(a) * 16 * rr, deg = a * 180 / Math.PI + 90;
        links.push(rot(ellLoop(x, y, i % 2 ? 1.6 : 3.4, i % 2 ? 3 : 2, 12), deg, x, y));
      }
      s += fillPolys(links.map((l) => ribbon(l, () => 1.5)), 'ink') + fillPolys(links.filter((l, i) => i % 2 === 0).map((l) => ribbon(l.slice(2, 6), () => 0.5)), 'p300');
      const slack = state === 'armed' ? [[22 * rr - 4, 2], [27, 6], [31, 3]] : [[26 * rr - 4, 1], [16, 8], [26, 9], [31, 3]];
      s += fillPolys([ribbon(smoothOpen(slack, 4), () => 2)], 'ink');
      // stake: an ink spike driven into the ground, p300 sheen on its left
      s += fillPolys([[[31, 4], [35.5, -2], [36.5, -18], [34, -22], [32, -18], [30.5, -1]]], 'ink') + fillPolys([[[32.4, -2], [33.2, -17], [33.9, -17], [33.4, -2]]], 'p300');
      if (state !== 'armed') s += fillPolys([ellPts(-4, 0, 6, 3, 12, 5, 0.1)], deep, 0.6);
    } else if (ch === 3) {
      // wet iron net: an iron ring, an uneven mesh (no three parallel lines) and water drops
      const k = state === 'armed' ? 1 : state === 'spring' ? [0.75, 0.5, 0.42][fr] : 0.38, lift = state === 'armed' ? 0 : state === 'spring' ? [4, 8, 6][fr] : 3;
      const rnd = rng(37), nodes = [];
      for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) {
        const u = (i + 0.5) / 6 * 2 - 1, v = (j + 0.5) / 4 * 2 - 1;
        if (u * u + v * v > 1.05) continue;
        nodes.push([u * 25 * k + (rnd() - 0.5) * 4, v * 15 * k + (rnd() - 0.5) * 3 - lift]);
      }
      const mesh = [];
      nodes.forEach((p, i) => nodes.forEach((q, j) => { if (j > i && Math.hypot(p[0] - q[0], (p[1] - q[1]) * 1.5) < 13 * k + 2 && ((i * 7 + j * 3) % 4)) mesh.push(ribbon([p, [lerp(p[0], q[0], 0.5) + 0.8, lerp(p[1], q[1], 0.5) + 0.6], q], () => 1)); }));
      s += fillPolys(ringBand(0, -lift * 0.5, 28 * Math.max(k, 0.45), 18 * Math.max(k, 0.45), 4), 'ink') + fillPolys(ringBand(0, -lift * 0.5, 28 * Math.max(k, 0.45), 18 * Math.max(k, 0.45), 1.4), deep);
      s += fillPolys(mesh, 'ink');
      const drops = [[-14, 6], [9, -8], [18, 7], [-4, -12], [2, 10]].slice(0, state === 'shut' ? 3 : 5);
      s += fillPolys(drops.map((d) => [[d[0], d[1] - 2.2], [d[0] + 1.1, d[1]], [d[0], d[1] + 1], [d[0] - 1.1, d[1]]]), light);
    } else {
      // saw gear: ink.700 gear, a spot-coloured hub, p300 blade edges
      const spin = state === 'spring' ? [10, 22, 30][fr] : state === 'shut' ? 34 : 0, tilt = state === 'shut' ? 0.9 : 1, teeth = 18, pts = [];
      for (let i = 0; i < teeth * 2; i++) { const a = TAU * i / (teeth * 2) + spin * Math.PI / 180, rr = i % 2 ? 25 : 29.5; pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.66 * tilt]); }
      s += fillPolys([pts], 'ink') + fillPolys([scalePts(pts, 0.92, 0, 0)], 'ink700');
      const edges = [];
      for (let i = 0; i < teeth; i += 2) { const a = TAU * (i * 2 + 1) / (teeth * 2) + spin * Math.PI / 180; edges.push(lens(Math.cos(a) * 26.5, Math.sin(a) * 26.5 * 0.66 * tilt, 1.6, 0.5, 4)); }
      s += fillPolys(edges, 'p300');
      s += fillPolys(ringBand(0, 0, 13, 8.6 * tilt, 1.6), 'ink500');
      s += fillPolys([ellPts(0, 0, 6.4, 4.4 * tilt, 16, 3, 0)], 'ink') + fillPolys([ellPts(0, 0, 5, 3.3 * tilt, 16, 3, 0)], spot);
      if (state === 'spring') s += fillPolys([ribbon(ellLoop(0, 0, 33, 22, 10, -1.2, -0.3), () => 0.8), ribbon(ellLoop(0, 0, 33, 22, 10, 1.9, 2.8), () => 0.8)], 'ink300');
    }
    if (state === 'spring') s += dustPuffs(fr === 0 ? [[-26, 8, 4], [24, -6, 3.6]] : fr === 1 ? [[-30, 6, 6], [28, -8, 5.4], [-6, 14, 4.4]] : [[-31.6, 4, 5], [31.6, -10, 4.6], [-8, 17, 3.6], [12, 14, 3]], fr === 2 ? 0.45 : 0.7);
    if (state === 'shut') {
      s += dustPuffs([[-30, 12, 3], [26, 14, 2.6]], 0.45);
      s += fillPolys([ribbon([[-6, 16], [-1, 14.6], [3, 17], [8, 15.8]], () => 0.9)], 'ink', 0.7);
    }
    return s;
  }

  // ---- null (§4.6): eraser crumbs at the rim (voidp + ink300 0.8 outline, curled flakes) ----
  const CRUMB = { a: [[-2.6, 0.8], [-1.2, -1.6], [1.2, -1.8], [2.6, -0.2], [0.8, 0.4], [-0.6, 1.6]], b: [[-2.4, -0.6], [-0.4, -1.8], [2.6, -1], [2.2, 1.2], [-0.6, 1.6], [-2.2, 0.8]], c: [[-2.2, 1.4], [0.2, -1.8], [2.6, 1.2], [0.4, 0.6]] };
  function crumbStamp(v) {
    const P = CRUMB[v], inner = insetConvex(P, 0.8) || scalePts(P, 0.6, 0, 0);
    let s = fillPolys([P], 'ink300') + fillPolys([inner], 'voidPaper');
    if (v === 'b') s += fillPolys([ribbon([[-1.6, -0.4], [0, -0.9], [1.6, -0.4]], () => 0.4)], 'ink300');
    return s;
  }

  // ==== 4. baked parts (work order §1.4) ====
  // row: [part, frames, drive, fps, seconds, still, box, anchor, layer, z, lod, flash]
  const PARTS_RAW = { fire: [], hero: [], mob: [], shock: [], slow: [], water: [], root: [], trap: [], null: [] };
  ['s', 'm', 'l'].forEach((sz) => ['a', 'b'].forEach((v) => PARTS_RAW.fire.push(['cluster-' + sz + '-' + v, 6, 'loop', 12, null, null, CL[sz].box, CL[sz].anchor, 'hazard', 'flame', 'info', false])));
  ['s', 'm', 'l'].forEach((sz) => ['a', 'b'].forEach((v) => PARTS_RAW.fire.push(['cluster-' + sz + '-' + v + '-ignite', 4, 'prog', 0, 0.25, null, CL[sz].box, CL[sz].anchor, 'hazard', 'flame', 'info', false])));
  ['s', 'm', 'l'].forEach((sz) => ['a', 'b'].forEach((v) => PARTS_RAW.fire.push(['cluster-' + sz + '-' + v + '-gutter', 4, 'prog', 0, 0.5, null, CL[sz].box, CL[sz].anchor, 'hazard', 'flame', 'info', false])));
  // the rim ring uses cluster-s-* above (R2); its far-rim strip skirt-low is gone (§14-5)
  ['a', 'b', 'c', 'd'].forEach((v) => PARTS_RAW.fire.push(['char-' + v, 1, 'idx', 0, null, null, [44, 22], [22, 11], 'hazard', 'ground', 'info', false]));
  ['a', 'b', 'c', 'd'].forEach((v) => PARTS_RAW.fire.push(['char-cold-' + v, 1, 'idx', 0, null, null, [44, 22], [22, 11], 'ground', 'ground', 'deco', false]));
  ['a', 'b'].forEach((v) => PARTS_RAW.fire.push(['ember-' + v, 6, 'cycle', 0, 0.7, null, [12, 14], [6, 7], 'hazard', 'air', 'deco', false]));
  ['a', 'b'].forEach((v) => PARTS_RAW.fire.push(['smoke-' + v, 6, 'cycle', 0, 1.0, null, [18, 34], [9, 30], 'hazard', 'air', 'deco', false]));
  // overlay parts sit in the body layers, not in the hazard layer, so their z is 'body' (no hazard-layer order)
  PARTS_RAW.hero.push(['back', 6, 'loop', 12, null, null, FEET['hero/back'].box, FEET['hero/back'].anchor, 'body-back', 'body', 'info', false]);
  PARTS_RAW.hero.push(['front', 6, 'loop', 12, null, null, FEET['hero/front'].box, FEET['hero/front'].anchor, 'body-front', 'body', 'info', false]);
  [12, 19, 28].forEach((r) => PARTS_RAW.mob.push(['front-' + r, 4, 'loop', 12, null, null, FEET['mob/front-' + r].box, FEET['mob/front-' + r].anchor, 'body-front', 'body', 'deco', false]));
  // shock (§4.1)
  ['a', 'b'].forEach((v) => PARTS_RAW.shock.push(['pebble-' + v, 2, 'loop', 12, null, null, [10, 10], [5, 8], 'hazard', 'ground', 'deco', false]));
  ['a', 'b', 'c'].forEach((v) => PARTS_RAW.shock.push(['shard-' + v, 4, 'prog', 0, 0.3, null, [20, 20], [10, 16], 'hazard', 'air', 'deco', false]));
  PARTS_RAW.shock.push(['core', 4, 'prog', 0, 0.25, null, [72, 72], [36, 44], 'hazard', 'flame', 'info', true]);
  ['a', 'b'].forEach((v) => PARTS_RAW.shock.push(['dust-' + v, 4, 'prog', 0, 0.3, null, [28, 18], [14, 14], 'hazard', 'air', 'deco', false]));
  // slow (§4.2)
  ['s', 'm', 'l', 'xl'].forEach((sz) => ['a', 'b'].forEach((v) => PARTS_RAW.slow.push(['mire-' + sz + '-' + v, 1, 'idx', 0, null, null, MIRE[sz].box, [MIRE[sz].box[0] / 2, MIRE[sz].box[1] / 2], 'hazard', 'ground', 'info', false])));
  ['a', 'b'].forEach((v) => PARTS_RAW.slow.push(['bubble-' + v, 6, 'cycle', 0, 0.9, 2, [14, 14], [7, 11], 'hazard', 'flame', 'deco', false]));
  // water (§4.3)
  ['a', 'b'].forEach((v) => PARTS_RAW.water.push(['ripple-' + v, 8, 'cycle', 0, 1.6, 3, [40, 18], [20, 9], 'hazard', 'ground', 'info', false]));
  ['a', 'b'].forEach((v) => PARTS_RAW.water.push(['flow-' + v, 6, 'loop', 6, null, null, [44, 10], [22, 5], 'hazard', 'ground', 'deco', false]));
  PARTS_RAW.water.push(['glint', 2, 'loop', 2, null, null, [14, 8], [7, 4], 'hazard', 'ground', 'deco', false]);
  // review 3 W1: the long surface strokes that make the disc read as water at 1x
  ['a', 'b'].forEach((v) => PARTS_RAW.water.push(['wave-' + v, 6, 'loop', 6, null, null, [100, 14], [50, 7], 'hazard', 'ground', 'info', false]));
  // root (§4.4) and the hero bind overlays (§3.6)
  ['a', 'b', 'c'].forEach((v) => PARTS_RAW.root.push(['vine-' + v, 4, 'loop', 6, null, null, [26, 24], [13, 20], 'hazard', 'flame', 'info', false]));
  ['a', 'b', 'c'].forEach((v) => PARTS_RAW.root.push(['vine-' + v + '-emerge', 4, 'prog', 0, 0.25, null, [26, 24], [13, 20], 'hazard', 'flame', 'info', false]));
  ['a', 'b', 'c'].forEach((v) => PARTS_RAW.root.push(['vine-' + v + '-wither', 4, 'prog', 0, 0.4, null, [26, 24], [13, 20], 'hazard', 'flame', 'info', false]));
  PARTS_RAW.hero.push(['bind-back', 4, 'prog', 0, 0.2, null, [46, 24], [23, 19], 'body-back', 'body', 'info', false]);
  PARTS_RAW.hero.push(['bind-front', 4, 'prog', 0, 0.2, null, [42, 24], [21, 18], 'body-front', 'body', 'info', false]);
  // trap (§4.5): chapters 1–4 (5 uses 1)
  [1, 2, 3, 4].forEach((c) => {
    PARTS_RAW.trap.push(['armed-ch' + c, 1, 'idx', 0, null, null, [82, 62], [41, 33], 'hazard', 'ground', 'info', false, c]);
    PARTS_RAW.trap.push(['spring-ch' + c, 3, 'prog', 0, 0.15, null, [82, 62], [41, 33], 'hazard', 'ground', 'info', false, c]);
    PARTS_RAW.trap.push(['shut-ch' + c, 1, 'idx', 0, null, null, [82, 62], [41, 33], 'hazard', 'ground', 'info', false, c]);
  });
  // null (§4.6)
  ['a', 'b', 'c'].forEach((v) => PARTS_RAW.null.push(['crumb-' + v, 1, 'idx', 0, null, null, [12, 10], [6, 5], 'hazard', 'ground', 'deco', false]));
  const PARTS = {};
  Object.keys(PARTS_RAW).forEach((g) => {
    PARTS[g] = PARTS_RAW[g].map((r) => Object.freeze({
      part: r[0], frames: r[1], drive: r[2], fps: r[3], seconds: r[4], still: r[5], box: Object.freeze(r[6].slice()), anchor: Object.freeze(r[7].slice()),
      layer: r[8], z: r[9], lod: r[10], flash: r[11], ch: r[12] == null ? null : r[12]
    }));
  });
  const partOf = (group, part) => (PARTS[group] || []).find((q) => q.part === part) || null;
  const copyPart = (p) => Object.assign({}, p, { box: p.box.slice(), anchor: p.anchor.slice() });

  /** Body of one stamp frame, in the stamp's local box (anchor already applied). */
  function stampBody(group, part, frame) {
    let m;
    if (group === 'fire') {
      if ((m = /^cluster-([sml])-([ab])(?:-(ignite|gutter))?$/.exec(part))) return clusterStamp(m[1], m[2], m[3] || 'loop', frame);
      if ((m = /^char-(cold-)?([abcd])$/.exec(part))) return charStamp(m[2], !!m[1]);
      if ((m = /^ember-([ab])$/.exec(part))) return emberFrame(m[1], frame);
      if ((m = /^smoke-([ab])$/.exec(part))) return smokeFrame(m[1], frame);
    }
    if (group === 'hero' && (part === 'bind-back' || part === 'bind-front')) return bindFrame(part === 'bind-back' ? 'back' : 'front', frame);
    if (group === 'hero' || group === 'mob') { const F = FEET[group + '/' + part]; if (F) return lowFlames(F, frame, F.frames); }
    if (group === 'root' && (m = /^vine-([abc])(?:-(emerge|wither))?$/.exec(part))) return vineFrame(m[1], m[2] || 'loop', frame);
    if (group === 'trap' && (m = /^(armed|spring|shut)-ch([1-4])$/.exec(part))) return trapStamp(+m[2], m[1], frame);
    if (group === 'null' && (m = /^crumb-([abc])$/.exec(part))) return crumbStamp(m[1]);
    if (group === 'shock') {
      if ((m = /^pebble-([ab])$/.exec(part))) return pebbleFrame(m[1], frame);
      if ((m = /^shard-([abc])$/.exec(part))) return shardFrame(m[1], frame);
      if (part === 'core') return coreFrame(frame);
      if ((m = /^dust-([ab])$/.exec(part))) return dustFrame(m[1], frame);
    }
    if (group === 'slow') {
      if ((m = /^mire-(s|m|l|xl)-([ab])$/.exec(part))) return mireStamp(m[1], m[2]);
      if ((m = /^bubble-([ab])$/.exec(part))) return bubbleFrame(m[1], frame);
    }
    if (group === 'water') {
      if ((m = /^ripple-([ab])$/.exec(part))) return rippleFrame(m[1], frame);
      if ((m = /^flow-([ab])$/.exec(part))) return flowFrame(m[1], frame);
      if ((m = /^wave-([ab])$/.exec(part))) return waveFrame(m[1], frame);
      if (part === 'glint') return glintFrame(frame);
    }
    return '';
  }
  function stamp(group, part, o) {
    const p = partOf(group, part);
    if (!p) return warn(`unknown stamp ${group}/${part}`);
    const frame = clamp(Math.floor((o && o.frame) || 0), 0, p.frames - 1);
    const c = Ctx(`hzd-${group} hzd-${group}-${part}`);
    return c.out(`<g transform="translate(${p.anchor[0]} ${p.anchor[1]})">${stampBody(group, part, frame)}</g>`);
  }
  /** A stamp placed with its anchor on (x, y), mirrored about the anchor when flip. */
  function place(group, part, frame, x, y, flip, a) {
    const p = partOf(group, part);
    const tr = flip ? `translate(${f(x)} ${f(y)}) scale(-1 1) translate(${-p.anchor[0]} ${-p.anchor[1]})` : `translate(${f(x - p.anchor[0])} ${f(y - p.anchor[1])})`;
    return `<g transform="${tr}"${op(a)}>${stamp(group, part, { frame })}</g>`;
  }
  /** Loop frame of an instance (drive rule §1.4): reduced LOD at half fps, minimal and reduced motion still on phase. */
  function loopFrame(p, t, phase, lod, reduced) {
    if (reduced || lod === 'minimal') return Math.min(p.frames - 1, Math.floor(phase * p.frames));
    const fps = lod === 'reduced' ? p.fps / 2 : p.fps;
    return ((Math.floor(t * fps + phase * p.frames) % p.frames) + p.frames) % p.frames;
  }

  // ==== 5. layout (work order §1.6) ====
  const LODS = ['full', 'reduced', 'minimal'];
  /** Body cluster size (R1): m when r < 56, l from 56 up. The s cluster only rings the rim (R2). */
  function fireSize(r) { return r < SPEC.fire.size.m ? 'm' : 'l'; }
  /**
   * Distance from the hazard centre for a stamp placed toward angle a near the rim (§13-2, §13-10): one helper for all
   * kinds, so the renderer ports it once. `box` is the stamp's box, u = 0..1 its jitter draw.
   * - 'rise' (flames, vines; anchor at the base): inset from the rim = max(min, hw·|cos a| + pad) + jitter·u,
   *   hw = (box w − 6)/2. A wide stamp at the left or right of the circle no longer reaches the near rim.
   * - 'ground' (puddles, ripples, crumbs; anchor at the box centre): the inscribed ellipse (box − 6) stays inside r − 2:
   *   d = r − 2 − √((ex cos a)² + (ey sin a)²), then two corrections over its 16 sample points, then − pad − jitter·u
   *   (o.pad, o.jitter, default 0).
   * o: {min, pad, jitter}; 'rise' defaults to SPEC.fire.layout.rim.inset {min 12, pad 4, jitter 3}.
   */
  function rimDist(r, a, box, mode, u, o) {
    if (mode === 'ground') {
      const ex = (box[0] - 6) / 2, ey = (box[1] - 6) / 2;
      let d = r - 2 - Math.hypot(ex * Math.cos(a), ey * Math.sin(a));
      for (let k = 0; k < 2; k++) {
        let m = 0;
        for (let t = 0; t < 16; t++) { const A = t * Math.PI / 8; m = Math.max(m, Math.hypot(d * Math.cos(a) + ex * Math.cos(A), d * Math.sin(a) + ey * Math.sin(A))); }
        if (m > r - 2) d -= m - (r - 2);
      }
      return d - ((o && o.pad) || 0) - ((o && o.jitter) || 0) * (u || 0);
    }
    o = o || SPEC.fire.layout.rim.inset;
    return r - (Math.max(o.min, (box[0] - 6) / 2 * Math.abs(Math.cos(a)) + o.pad) + o.jitter * (u || 0));
  }
  /** Far-rim rule: a stamp whose top is `tip` above its base point (x, y) may reach at most `far` above the far rim. */
  const farOK = (r, x, y, tip, far) => !(y - tip < -Math.sqrt(Math.max(0, r * r - x * x)) - far);

  // ---- common frame (review 2 §7): the three placement helpers every kind uses; the renderer ports each once ----
  /**
   * scatter(r, seed, o) — best-candidate scatter (§14-1, S1). For k = 0..o.tries−1 while fewer than o.n are placed:
   * draw o.cand candidates c = 0..cand−1, q = k·cand + c, ix = o.jit.base + q·o.jit.stride,
   *   a = 2π·u, d = reach·√v, (x, y) = (d cos a, d sin a), reach = max(o.reach.frac·r, r − o.reach.pad), with
   *   (u, v) = (J(ix), J(ix + 1)) — the fire pool, frozen with the accepted fire layout (it lies on two spirals) — or,
   *   with o.pool 'kr', (u, v) = (kr(0), kr(1)), kr(t) = frac(J(o.jit.base + t) + q·SPEC.jit.kron[t]) (an R2 lattice
   *   turned by the seed: an even pool);
   * a candidate is valid when
   *   'rise' (anchor at the base): farOK(x, y, o.tip, o.far) and d ≤ rimDist(r, a, o.box, 'rise', 0, o.inset),
   *   'ground' (anchor at the box centre): d ≤ rimDist(r, a, o.box, 'ground', 0, o.inset);
   * its distance dp = the smallest hypot(q.x − x, o.squash·(q.y − y)) to the placed points and to o.fixed (points of an
   * earlier pass, kept clear but not returned); a candidate with dp < gap = min(o.gap.frac·r, o.gap.cap) is dropped.
   * Score s = dp, or with o.mirror (an edge inset) s = min(dp, 2·(r − o.mirror − d)·hypot(cos a, o.squash·sin a)): the
   * candidate's mirror image across the circle r − o.mirror counts as a neighbour, so the rim is no longer the emptiest
   * place and the inside fills as evenly (farthest-point sampling otherwise piles points on the rim). With no placed or
   * fixed points s = −hypot(x, y), so the first point is the candidate nearest the centre. The best-scoring candidate is
   * placed (ties: the earlier one). Returns [{x, y, ix, gen: k, w}] in placement order; the fire caller draws its own
   * variant/flip/phase from J(ix + 2), J(ix + 3), J(ix + 4); with pool 'kr', w = [kr(2, n), kr(3, n), kr(4, n)] for the
   * n-th placed point (n = 0, 1, …) are those three draws — a Kronecker run in placement order, so neighbours in the list
   * differ (J(ix + t) of nearby candidates step by ≈ 0.083 and repeat). w is null for the fire pool. Without o.pool and
   * o.mirror this is exactly the fire rule of S1.
   */
  /**
   * kron(seed, base) — the Kronecker run every 2D draw of the delivery-2 kinds uses (review 3 R2): kr(t, n) =
   * frac(J(base + t) + n·SPEC.jit.kron[t]), t = 0..4. Two jit values are never paired into a 2D position (they lie on
   * two lines); the pair (kr(0, n), kr(1, n)) is an R2 lattice point, kr(2..4, n) are further independent draws.
   */
  const kron = (seed, base) => { const KR = SPEC.jit.kron, k0 = KR.map((_, t) => jit(seed, base + t)); return (t, n) => frac(k0[t] + n * KR[t]); };
  function scatter(r, seed, o) {
    const J = (i) => jit(seed, i), out = [], sq = o.squash || 1, fixed = o.fixed || [];
    const reach = Math.max(o.reach.frac * r, r - o.reach.pad), gap = Math.min(o.gap.frac * r, o.gap.cap);
    const k0 = o.pool === 'kr', kr = k0 ? kron(seed, o.jit.base) : null;
    for (let k = 0; k < o.tries && out.length < o.n; k++) {
      let best = null, bestS = -Infinity;
      for (let c = 0; c < o.cand; c++) {
        const q = k * o.cand + c, ix = o.jit.base + q * o.jit.stride;
        const u = k0 ? kr(0, q) : J(ix), v = k0 ? kr(1, q) : J(ix + 1);
        const a = TAU * u, d = reach * Math.sqrt(v), x = Math.cos(a) * d, y = Math.sin(a) * d;
        if (o.mode === 'ground') {
          if (d > rimDist(r, a, o.box, 'ground', 0, o.inset)) continue;
        } else {
          if (!farOK(r, x, y, o.tip, o.far)) continue;
          if (d > rimDist(r, a, o.box, 'rise', 0, o.inset)) continue;
        }
        let s = -Math.hypot(x, y);
        if (out.length || fixed.length) {
          let dp = Infinity;
          for (let j = 0; j < out.length; j++) dp = Math.min(dp, Math.hypot(out[j].x - x, sq * (out[j].y - y)));
          for (let j = 0; j < fixed.length; j++) dp = Math.min(dp, Math.hypot(fixed[j].x - x, sq * (fixed[j].y - y)));
          if (dp < gap) continue;
          s = o.mirror == null ? dp : Math.min(dp, 2 * (r - o.mirror - d) * Math.hypot(Math.cos(a), sq * Math.sin(a)));
        }
        if (s > bestS) { bestS = s; best = { x, y, ix }; }
      }
      if (!best) continue;
      const nth = out.length;
      out.push({ x: best.x, y: best.y, ix: best.ix, gen: k, w: k0 ? [kr(2, nth), kr(3, nth), kr(4, nth)] : null });
    }
    return out;
  }
  /**
   * rimPlace(r, a, box, tip, u, o) — distance for a rising stamp on a rim ring (§14-2, S2). d0 = rimDist(r, a, box, 'rise',
   * u, o.inset); the first d = d0 − k (k = 0, 1, 2, …, while d ≥ r − o.farIn) that keeps farOK(d cos a, d sin a, tip, o.far)
   * is used; null when none does (the item is dropped).
   */
  function rimPlace(r, a, box, tip, u, o) {
    const ca = Math.cos(a), sa = Math.sin(a), d0 = rimDist(r, a, box, 'rise', u, o.inset);
    for (let k = 0; ; k++) {
      const d = d0 - k;
      if (d < r - o.farIn - 1e-9) return null;
      if (farOK(r, ca * d, sa * d, tip, o.far)) return d;
    }
  }
  /**
   * capCut(items, cap, o) — the per-hazard cap (§14-3, S3). Items carry prio and gen. Over the cap, items of prio o.even
   * (the rim ring) go first and evenly: in gen order (n items, nd = min(n, over)) drop index ⌊(j + 0.5)·n/nd⌋, j = 0..nd−1.
   * Still over: drop the rest by (prio desc, gen desc), never below o.keep items of prio 0. Returns the kept items in
   * their input order.
   */
  function capCut(items, cap, o) {
    let over = items.length - cap;
    if (over <= 0) return items.slice();
    const drop = new Set();
    const even = items.filter((q) => q.prio === o.even).sort((p, q) => p.gen - q.gen), n = even.length, nd = Math.min(n, over);
    for (let j = 0; j < nd; j++) drop.add(even[Math.floor((j + 0.5) * n / nd)]);
    over -= nd;
    if (over > 0) {
      let body = items.filter((q) => q.prio === 0).length;
      const rest = items.filter((q) => q.prio !== o.even).sort((p, q) => q.prio - p.prio || q.gen - p.gen);
      for (let j = 0; j < rest.length && over > 0; j++) {
        if (rest[j].prio === 0) { if (body <= o.keep) continue; body--; }
        drop.add(rest[j]); over--;
      }
    }
    return items.filter((q) => !drop.has(q));
  }

  function layoutFire(r, seed, lod) {
    const L = SPEC.fire.layout, li = Math.max(0, LODS.indexOf(lod)), size = fireSize(r);
    const J = (i) => jit(seed, i);
    // body clusters (S1): count by area, best-candidate scatter, kept inside the side rim like the ring
    const CC = L.cluster, P = partOf('fire', 'cluster-' + size + '-a');
    const nc = clamp(Math.round(r * r / CC.area), CC.min, r >= CC.big ? CC.maxBig : CC.max);
    const clusters = scatter(r, seed, { n: nc, tries: CC.tries, cand: CC.cand, reach: CC.reach, gap: CC.gap, squash: CC.squash, mode: 'rise', box: P.box, tip: P.anchor[1], far: CC.far, jit: CC.jit })
      .map((p) => ({ part: 'cluster-' + size + '-' + (J(p.ix + 2) < 0.5 ? 'a' : 'b'), x: p.x, y: p.y, flip: J(p.ix + 3) < 0.5, phase: J(p.ix + 4), z: 'flame', prio: L.prio.cluster, gen: p.gen }));
    if (!clusters.length) clusters.push({ part: 'cluster-' + size + '-a', x: 0, y: CC.fallbackY * r, flip: false, phase: 0, z: 'flame', prio: L.prio.cluster, gen: 0 });
    const keepC = li === 2 ? clusters.slice(0, Math.min(nc, CC.minimal)) : clusters;
    // rim ring (R2, S2): s clusters; on the far rim they step inward (rimPlace) instead of switching part
    const RG = L.rim, pitch = r >= RG.big ? RG.pitch[1] : RG.pitch[0], ns = Math.round(TAU * (r - RG.countInset) / pitch), ring = [];
    if (li < 2) {
      for (let i = 0; i < ns; i++) {
        if (li === 1 && i % 2) continue;
        if (J(i + RG.jit.skip) < RG.skip) continue;
        const a = TAU * (i + 0.5 + (J(i + RG.jit.angle) - 0.5) * RG.angleJitter) / ns, u = J(i + RG.jit.dist);
        const part = RG.parts[J(i + RG.jit.variant) < 0.5 ? 0 : 1], Q = partOf('fire', part);
        const d = rimPlace(r, a, Q.box, Q.anchor[1], u, RG);
        if (d == null) continue;
        ring.push({ part, x: Math.cos(a) * d, y: Math.sin(a) * d, flip: J(i + RG.jit.flip) < 0.5, phase: J(i + RG.jit.phase), z: 'flame', prio: L.prio.rim, gen: 100 + i });
      }
    }
    // char (R6; S3: at most maxBig from r ≥ big)
    const CH = L.char, nch = clamp(Math.round(r * r / CH.per), CH.min, r >= CH.big ? CH.maxBig : CH.max), chars = [];
    for (let k = 0; k < CH.tries && chars.length < nch; k++) {
      const a = TAU * J(k + CH.jit.angle), d = Math.max(0, r - CH.inset) * Math.sqrt(J(k + CH.jit.dist)), x = Math.cos(a) * d, y = Math.sin(a) * d;
      if (chars.some((q) => Math.hypot(q.x - x, q.y - y) < r * CH.gap)) continue;
      chars.push({ part: 'char-' + 'abcd'[Math.min(3, Math.floor(J(k + CH.jit.variant) * 4))], x, y, flip: J(k + CH.jit.flip) < 0.5, phase: 0, z: 'ground', prio: L.prio.char, gen: 200 + k });
    }
    const keepCh = li === 0 ? chars : li === 1 ? chars.slice(0, Math.ceil(nch / 2)) : chars.slice(0, CH.minimal);
    // per-hazard cap (S3): the ring thinned evenly first, then char → body, latest first, one body kept
    const all = capCut(keepC.concat(ring, keepCh), L.caps[li], L.cut);
    const byY = (p, q) => p.y - q.y || p.gen - q.gen;
    const ground = all.filter((q) => q.z === 'ground').sort(byY), flame = all.filter((q) => q.z === 'flame').sort(byY);
    return ground.concat(flame).map((q) => ({ part: q.part, x: q.x, y: q.y, flip: q.flip, phase: q.phase, z: q.z, prio: q.prio }));
  }
  /** Layout items sorted for output: ground (y, gen) then the rest (y, gen); gen is not exported. */
  function sortItems(all) {
    const byY = (p, q) => p.y - q.y || p.gen - q.gen;
    const ground = all.filter((q) => q.z === 'ground').sort(byY), rest = all.filter((q) => q.z !== 'ground').sort(byY);
    return ground.concat(rest).map((q) => ({ part: q.part, x: q.x, y: q.y, flip: q.flip, phase: q.phase, z: q.z, prio: q.prio }));
  }

  // ---- shock (§4.1, §1.6): cracks (paths) and pebbles (layout) ----
  /**
   * Crack polylines. Arm i starts at radius `start` toward a0 = 2π(i + (J(arm + i) − 0.5)·0.6)/7; each segment k is
   * seg·(1 − segJitter + 2·segJitter·J) long, turned a0 ± turn, and its end pushed along the arm normal by ±(push0 + (push1 −
   * push0)·J), the sign alternating; the arm stops at reach·r (the last segment is cut on that circle). Branch i leaves
   * arm i at length fraction branchAt, turned ±branchTurn (side J(side + i)), branchLen of the arm long in branchSegs
   * segments (turn ±0.3, push ±(1.5 + J)), also kept inside reach·r.
   */
  function shockCracks(r, seed) {
    const C = SPEC.shock.cracks, J = (i) => jit(seed, i), R = C.reach * r, arms = [], branches = [];
    const clipTo = (p, q) => { // point on p→q at radius R
      const dx = q[0] - p[0], dy = q[1] - p[1], A = dx * dx + dy * dy, B = 2 * (p[0] * dx + p[1] * dy), Cc = p[0] * p[0] + p[1] * p[1] - R * R;
      const t = clamp((-B + Math.sqrt(Math.max(0, B * B - 4 * A * Cc))) / (2 * A || 1), 0, 1);
      return [p[0] + dx * t, p[1] + dy * t];
    };
    for (let i = 0; i < C.arms; i++) {
      const a0 = TAU * (i + (J(C.jit.arm + i) - 0.5) * 0.6) / C.arms, nx = -Math.sin(a0), ny = Math.cos(a0);
      let p = [Math.cos(a0) * C.start, Math.sin(a0) * C.start];
      const pts = [p];
      for (let k = 0; k < 60; k++) {
        const ix = C.jit.seg + i * C.jit.segStride + 3 * k;
        const len = C.seg * (1 - C.segJitter + 2 * C.segJitter * J(ix)), dir = a0 + (J(ix + 1) - 0.5) * 2 * C.turn;
        const push = (k % 2 ? 1 : -1) * (C.push[0] + (C.push[1] - C.push[0]) * J(ix + 2));
        const q = [p[0] + Math.cos(dir) * len + nx * push, p[1] + Math.sin(dir) * len + ny * push];
        if (Math.hypot(q[0], q[1]) >= R) { pts.push(clipTo(p, q)); break; }
        pts.push(q); p = q;
      }
      arms.push(pts);
    }
    arms.forEach((pts, i) => {
      const at = along(pts, C.branchAt), a = pts[at.i], b = pts[at.i + 1], side = J(C.jit.side + i) < 0.5 ? -1 : 1;
      const dir = Math.atan2(b[1] - a[1], b[0] - a[0]) + side * C.branchTurn, L = C.branchLen * at.total / C.branchSegs, nx = -Math.sin(dir), ny = Math.cos(dir);
      let p = at.p;
      const bp = [p];
      for (let k = 0; k < C.branchSegs; k++) {
        const ix = C.jit.branch + 10 * i + 2 * k, d2 = dir + (J(ix) - 0.5) * 0.6, push = (k % 2 ? 1 : -1) * (1.5 + J(ix + 1));
        const q = [p[0] + Math.cos(d2) * L + nx * push, p[1] + Math.sin(d2) * L + ny * push];
        if (Math.hypot(q[0], q[1]) >= R) { bp.push(clipTo(p, q)); break; }
        bp.push(q); p = q;
      }
      branches.push(bp);
    });
    return { arms, branches };
  }
  /** Pebbles (imminent only, full LOD): pebble j on arm arms[j mod 4] at length fraction from + span·J(at + j). */
  function layoutShock(r, seed, lod) {
    const L = SPEC.shock.layout, PB = L.pebble, li = Math.max(0, LODS.indexOf(lod)), J = (i) => jit(seed, i), out = [];
    if (li === 0) {
      const cr = shockCracks(r, seed);
      for (let j = 0; j < PB.count; j++) {
        const arm = cr.arms[PB.arms[j % PB.arms.length]], p = along(arm, PB.from + PB.span * J(PB.jit.at + j)).p;
        out.push({ part: 'pebble-' + (J(PB.jit.variant + j) < 0.5 ? 'a' : 'b'), x: p[0], y: p[1], flip: J(PB.jit.flip + j) < 0.5, phase: J(PB.jit.phase + j), z: 'ground', prio: 1, gen: j });
      }
    }
    return sortItems(capCut(out, L.caps[li], { even: -1, keep: 0 }));
  }

  function layout(kind, r, seed, o) {
    o = o || {};
    if (ALL_KINDS.indexOf(kind) < 0) { warn(`unknown kind ${kind}`); return []; }
    if (!(r > 0)) { warn(`radius must be > 0 (${r})`); return []; }
    if (KINDS.indexOf(kind) < 0) { warn(`layout(${kind}) is not drawn in this delivery`); return []; }
    const lod = LODS.indexOf(o.lod) >= 0 ? o.lod : 'full', sd = seed == null ? 1 : seed;
    if (kind === 'fire') return layoutFire(r, sd, lod);
    if (kind === 'shock') return layoutShock(r, sd, lod);
    if (LAYOUTS[kind]) return LAYOUTS[kind](r, sd, lod, o);
    return [];
  }
  /** Layout functions of the other kinds (filled in by their sections below). */
  const LAYOUTS = {};
  function paths(kind, r, seed) {
    if (ALL_KINDS.indexOf(kind) < 0) { warn(`unknown kind ${kind}`); return {}; }
    if (!(r > 0)) { warn(`radius must be > 0 (${r})`); return {}; }
    const sd = seed == null ? 1 : seed;
    if (kind === 'shock' && KINDS.indexOf('shock') >= 0) { const c = shockCracks(r, sd); return { cracks: c.arms.concat(c.branches) }; }
    if (kind === 'null' && PATHS.null && KINDS.indexOf('null') >= 0) return PATHS.null(r, sd);
    return {};
  }
  const PATHS = {};

  // ---- slow (§1.6, §14-7): mire by area in two passes (big class first), bubbles on puddles ----
  /**
   * Mire count and classes. Tier = the last row of mire.tiers with from ≤ r: classes [big, small], n = clamp(round(r²/area),
   * min, max); nBig = clamp(round((target·π r² − n·fill[small]) / (fill[big] − fill[small])), 0, n), so the puddles paint
   * about `target` of the disc at every radius (the 25–35 % rule, §1.9) with stamps that are never stretched.
   */
  function mirePlan(r) {
    const M = SPEC.slow.layout.mire, T = M.tiers.filter((q) => r >= q[0]).pop() || M.tiers[0], big = T[1], small = T[2];
    const n = clamp(Math.round(r * r / T[3]), M.min, M.max);
    const nBig = clamp(Math.round((M.target * Math.PI * r * r - n * M.fill[small]) / (M.fill[big] - M.fill[small])), 0, n);
    return { n, sizes: [big, small], nBig, nSmall: n - nBig };
  }
  LAYOUTS.slow = (r, seed, lod, o) => {
    const L = SPEC.slow.layout, M = L.mire, BB = L.bubble, li = Math.max(0, LODS.indexOf(lod)), J = (i) => jit(seed, i);
    if (o && o.ch === 4) return []; // chapter 4 draws the dial (SPEC) instead of puddles
    const plan = mirePlan(r), hw = plan.sizes.map((sz) => (MIRE[sz].box[0] - 6) / 2);
    const pass = (k, n, base, fixed) => scatter(r, seed, { n, tries: M.tries, cand: M.cand, reach: M.reach, gap: { frac: 99, cap: M.sep * (hw[0] + hw[k]) }, squash: M.squash, mirror: M.mirror, pool: M.pool, mode: 'ground', box: MIRE[plan.sizes[k]].box, fixed, jit: { base, stride: M.jit.stride } })
      .map((p, i) => ({ part: 'mire-' + plan.sizes[k] + '-' + (p.w[0] < 0.5 ? 'a' : 'b'), x: p.x, y: p.y, flip: p.w[1] < 0.5, phase: 0, z: 'ground', prio: 0, gen: k * 100 + i, size: plan.sizes[k] }));
    const big = pass(0, plan.nBig, M.jit.base, null), small = pass(1, plan.nSmall, M.jit.small, big), mire = big.concat(small);
    // reduced: the first half in placement order (big class first, spread evenly); minimal: the first three (biggest)
    const keep = li === 0 ? mire : li === 1 ? mire.slice(0, Math.ceil(mire.length / 2)) : mire.slice(0, M.minimal);
    const bubbles = [];
    if (li === 0 && mire.length) {
      // the offset on the puddle is a 2D draw: Kronecker run (R2), not a jit pair
      const nb = clamp(Math.round(r / BB.per), BB.min, BB.max), kr = kron(seed, BB.jit);
      for (let b = 0; b < nb; b++) {
        const q = mire[b % mire.length], hx = (MIRE[q.size].box[0] - 6) / 2, hy = (MIRE[q.size].box[1] - 6) / 2;
        bubbles.push({ part: 'bubble-' + (b % 2 ? 'b' : 'a'), x: q.x + (kr(0, b) - 0.5) * 0.8 * hx, y: q.y + (kr(1, b) - 0.5) * 0.6 * hy + 1, flip: false, phase: kr(2, b), z: 'flame', prio: 2, gen: 300 + b });
      }
    }
    return sortItems(capCut(keep.concat(bubbles), L.caps[li], { even: 2, keep: 1 }));
  };

  // ---- water (§1.6, §14-7): ripples and flows scattered 'ground', one glint up-left ----
  LAYOUTS.water = (r, seed, lod) => {
    const L = SPEC.water.layout, li = Math.max(0, LODS.indexOf(lod)), J = (i) => jit(seed, i);
    const WV = L.wave, RP = L.ripple, FL = L.flow, G = L.glint, PR = L.prio;
    const nw = clamp(Math.round(r * r / WV.area), WV.min, WV.max);
    const nr = clamp(Math.round(r / RP.per), RP.min, RP.max), nf = clamp(Math.round(r / FL.per), FL.min, FL.max);
    const wave = scatter(r, seed, { n: nw, tries: WV.tries, cand: WV.cand, reach: WV.reach, gap: WV.gap, squash: WV.squash, mirror: WV.mirror, pool: WV.pool, mode: 'ground', box: [100, 14], jit: WV.jit })
      .map((p, i) => ({ part: 'wave-' + (p.w[0] < 0.5 ? 'a' : 'b'), x: p.x, y: p.y, flip: p.w[1] < 0.5, phase: p.w[2], z: 'ground', prio: PR.wave, gen: i }));
    const ripple = scatter(r, seed, { n: nr, tries: RP.tries, cand: RP.cand, reach: RP.reach, gap: RP.gap, squash: RP.squash, mirror: RP.mirror, pool: RP.pool, mode: 'ground', box: [40, 18], fixed: wave, jit: RP.jit })
      .map((p, i) => ({ part: 'ripple-' + (p.w[0] < 0.5 ? 'a' : 'b'), x: p.x, y: p.y, flip: p.w[1] < 0.5, phase: p.w[2], z: 'ground', prio: PR.ripple, gen: 100 + i }));
    const flow = scatter(r, seed, { n: nf, tries: FL.tries, cand: FL.cand, reach: FL.reach, gap: FL.gap, squash: FL.squash, mirror: FL.mirror, pool: FL.pool, mode: 'ground', box: [44, 10], fixed: wave.concat(ripple), jit: FL.jit })
      .map((p, i) => ({ part: 'flow-' + (p.w[0] < 0.5 ? 'a' : 'b'), x: p.x, y: p.y, flip: false, phase: p.w[2], z: 'ground', prio: PR.flow, gen: 200 + i }));
    const ga = G.angle + (J(G.jit) - 0.5) * 2 * G.spread, glint = { part: 'glint', x: Math.cos(ga) * G.at * r, y: Math.sin(ga) * G.at * r, flip: false, phase: J(G.jit + 1), z: 'ground', prio: PR.glint, gen: 300 };
    // reduced: waves and ripples halved, no flows; minimal: two waves (held) and one ripple (still 3)
    const keep = li === 0 ? wave.concat(ripple, flow, [glint]) : li === 1 ? wave.slice(0, Math.ceil(nw / 2)).concat(ripple.slice(0, Math.ceil(nr / 2))) : wave.slice(0, WV.minimal).concat(ripple.slice(0, 1));
    return sortItems(capCut(keep, L.caps[li], L.cut));
  };
  // ---- root (§1.6, §14-7): vines scattered as rising stamps; flip when x > 0 so every curl faces the centre ----
  LAYOUTS.root = (r, seed, lod) => {
    const L = SPEC.root.layout, V = L.vine, li = Math.max(0, LODS.indexOf(lod)), J = (i) => jit(seed, i);
    const n = clamp(Math.round(r / V.per), V.min, V.max);
    const items = scatter(r, seed, { n, tries: V.tries, cand: V.cand, reach: V.reach, gap: V.gap, squash: V.squash, mirror: V.mirror, pool: V.pool, mode: 'rise', box: [26, 24], tip: 20, far: V.far, jit: V.jit })
      .map((p) => ({ part: 'vine-' + 'abc'[Math.min(2, Math.floor(3 * p.w[0]))], x: p.x, y: p.y, flip: p.x > 0, phase: p.w[2], z: 'flame', prio: 0, gen: p.gen }));
    return sortItems(capCut(items, L.caps[li], { even: -1, keep: 1 }));
  };
  // ---- trap (§1.6): one machine at the centre, chapter c = ch ≤ 4 ? ch : 1 (the renderer swaps armed/spring/shut) ----
  const trapCh = (ch) => (ch >= 1 && ch <= 4 ? ch : SPEC.trap.windows.fallback[5] || 1);
  LAYOUTS.trap = (r, seed, lod, o) => [{ part: 'armed-ch' + trapCh(o && o.ch), x: 0, y: 0, flip: false, phase: 0, z: 'ground', prio: 0 }];

  // ---- null (§1.6): crumbs inside the rim (rimDist 'ground' with pad 2, jitter 4), and the ghost lines / jag (paths) ----
  LAYOUTS.null = (r, seed, lod) => {
    const C = SPEC.null.layout.crumb, li = Math.max(0, LODS.indexOf(lod)), out = [];
    if (li === 0) {
      // slot i plus a Kronecker draw for (angle in slot, depth) and the variant/flip (R2: no jit pairs)
      const n = clamp(Math.round(r / C.per), C.min, C.max), kr = kron(seed, C.jit.base);
      for (let i = 0; i < n; i++) {
        const a = TAU * (i + kr(0, i)) / n, d = rimDist(r, a, [12, 10], 'ground', kr(1, i), C.inset);
        out.push({ part: 'crumb-' + 'abc'[Math.min(2, Math.floor(3 * kr(2, i)))], x: Math.cos(a) * d, y: Math.sin(a) * d, flip: kr(3, i) < 0.5, phase: 0, z: 'ground', prio: 0, gen: i });
      }
    }
    return sortItems(capCut(out, SPEC.null.layout.caps[li], { even: -1, keep: 0 }));
  };
  /**
   * Ghost lines: chords of the circle r − inset; jag: one closed line of 12 points of the erase edge at radius factor
   * 1 − (depth/r)·J (full size; the renderer scales it by the erase progress). Every paths() value is a list of lines.
   * Review 4 N1: no ghost line passes the centre — its distance from the centre is d = s·(minOffset + 1.1·|v − 0.5|)·r
   * with v = kr(1, i) and s = (v < 0.5 ? −1 : +1), so |d| ∈ [0.15r, 0.7r] and two lines never cross as a '十 / X' in the
   * middle (with the plain kron offset 16.5 % of r120·130 and 41 % of r170 did).
   */
  PATHS.null = (r, seed) => {
    const G = SPEC.null.ghost, E = SPEC.null.erase.jag, J = (i) => jit(seed, i), R0 = r - G.inset, ghost = [], jag = [];
    const n = r < G.split ? G.lines[0] : G.lines[1], kr = kron(seed, G.jit.base);
    for (let i = 0; i < n; i++) {
      // (angle, offset) of a line is a 2D draw: Kronecker run (R2); the offset keeps clear of the centre (N1)
      const v = kr(1, i), c = (v < 0.5 ? -1 : 1) * (G.minOffset + 1.1 * Math.abs(v - 0.5)) * r;
      const th = Math.PI * kr(0, i), h = Math.sqrt(Math.max(0, R0 * R0 - c * c));
      const dx = Math.cos(th), dy = Math.sin(th), nx = -dy, ny = dx;
      ghost.push([[c * nx - h * dx, c * ny - h * dy], [c * nx + h * dx, c * ny + h * dy]]);
    }
    for (let k = 0; k < E.points; k++) { const a = TAU * k / E.points, f0 = 1 - (E.depth / r) * J(E.jit + k); jag.push([Math.cos(a) * r * f0, Math.sin(a) * r * f0]); }
    return { ghost, jag: [jag] };
  };
  /** Cycle period of a ripple or bubble item: cycle·(spread0 + spread1·frac(7.919·phase)) — from its own phase. */
  const cyclePeriod = (base, spread, phase) => base * (spread[0] + spread[1] * frac(7.919 * phase));
  /** Cycle frame of an item at time t (drive 'cycle'): reduced motion holds `still` (or hides the item when null). */
  function cycleFrame(P, t, phase, T, reduced) {
    if (reduced) return P.still == null ? -1 : P.still;
    return Math.min(P.frames - 1, Math.floor(P.frames * frac(t / T + phase)));
  }

  // ==== 6. reference composite (draw) — the renderer's golden ====
  const disc = (r, t, a) => `<circle r="${f(r)}" fill="${colour(t)}"${op(a)}/>`;
  const ring = (r, t, w, a) => `<circle r="${f(r)}" fill="none" stroke="${colour(t)}" stroke-width="${f(w)}"${op(a)}/>`;
  const rimLayers = (r, layers, a) => layers.map((l) => ring(r + l[2], l[0], l[1], (l[3] == null ? 1 : l[3]) * (a == null ? 1 : a))).join('');

  /** Ember slots of a fire (§1.6): j mod clusters, start, period, phase, sign; null when the slot is not drawn. */
  function emberSlots(clusters, r, seed, t, lod, gutterStart) {
    const E = SPEC.fire.embers, J = (i) => jit(seed, i), out = [];
    let n = clamp(Math.round(r / E.per), E.min, E.max);
    if (lod === 'reduced') n = Math.ceil(n / 2);
    if (lod === 'minimal' || !clusters.length) return out;
    for (let j = 0; j < n; j++) {
      const c = clusters[j % clusters.length];
      const sx = c.x + lerp(E.origin.dx[0], E.origin.dx[1], J(j + E.jit.dx)), sy = c.y + lerp(E.origin.dy[1], E.origin.dy[0], J(j + E.jit.dy));
      const T = E.cycle * (1 + E.jitter * (J(j + E.jit.period) - 0.5)), u = frac(t / T + J(j + E.jit.phase));
      if (gutterStart != null && t - u * T > gutterStart) continue; // gutter: no new cycles
      const sg = J(j + E.jit.sign) < 0.5 ? -1 : 1;
      out.push({ part: j % 2 ? 'ember-b' : 'ember-a', x: sx + sg * E.drift * u, y: sy - E.rise * u, frame: Math.min(5, Math.floor(6 * u)) });
    }
    return out;
  }
  /** Smoke slots (gutter and the first 0.6 s of soot): τ = seconds since the gutter began. Each slot plays once. */
  function smokeSlots(clusters, seed, tau, lod) {
    const S = SPEC.fire.smoke, J = (i) => jit(seed, i), out = [];
    if (lod === 'minimal' || tau > SPEC.fire.windows.gutter + S.until) return out;
    const n = Math.min(clusters.length, S.max);
    for (let k = 0; k < n; k++) {
      if (lod === 'reduced' && k % 2) continue;
      const c = clusters[k], t0 = S.start + S.stagger * J(k + S.jit.start), T = S.cycle * (1 + S.jitter * (J(k + S.jit.period) - 0.5)), u = (tau - t0) / T;
      if (u < 0 || u >= 1) continue;
      const sg = J(k + S.jit.sign) < 0.5 ? -1 : 1;
      out.push({ part: k % 2 ? 'smoke-b' : 'smoke-a', x: c.x + sg * S.drift * u, y: c.y + S.origin.dy - S.rise * u, frame: Math.min(5, Math.floor(6 * u)) });
    }
    return out;
  }

  function drawFire(state, o) {
    const S = SPEC.fire, r = o.r, lod = o.lod, red = !!o.reduced, t = o.t, p = clamp(o.p, 0, 1), seed = o.seed;
    const items = layoutFire(r, seed, lod), grounds = items.filter((q) => q.z === 'ground'), flames = items.filter((q) => q.z === 'flame');
    // embers and smoke rise from the body clusters (prio 0) only; the rim ring's s clusters take ignite/gutter frames too
    const clusters = flames.filter((q) => q.prio === S.layout.prio.cluster);
    const flashA = o.flash == null ? 1 : o.flash;
    if (state === 'soot') {
      if (lod === 'minimal') return '';
      const age = p * S.soot.seconds, k = 1 - age / S.soot.seconds;
      let s = disc(r, S.soot.base.token, S.soot.base.alpha * k);
      grounds.forEach((q) => { s += place('fire', q.part.replace('char-', 'char-cold-'), 0, q.x, q.y, q.flip, k); });
      if (!red) smokeSlots(clusters, seed, S.windows.gutter + age, lod).forEach((q) => { s += place('fire', q.part, q.frame, q.x, q.y, false); });
      return s;
    }
    const age = state === 'ignite' ? p * S.windows.ignite : state === 'gutter' ? p * S.windows.gutter : 0;
    let s = disc(r, S.base.token, S.base.alpha);
    grounds.forEach((q) => {
      if (state === 'gutter' && age > S.windows.gutter - S.gutter.coldCross) {
        const x = (age - (S.windows.gutter - S.gutter.coldCross)) / S.gutter.coldCross;
        s += place('fire', q.part, 0, q.x, q.y, q.flip, 1 - x) + place('fire', q.part.replace('char-', 'char-cold-'), 0, q.x, q.y, q.flip, x);
      } else s += place('fire', q.part, 0, q.x, q.y, q.flip);
    });
    s += rimLayers(r, S.rim);
    if (state === 'ignite' && age < S.ignite.flash.seconds) s += rimLayers(r, S.ignite.flash.layers, flashA);
    // every flame item is a cluster (body or rim ring): loop frames in burn, prog frames in ignite and gutter
    flames.forEach((q) => {
      if (state === 'burn') { const P = partOf('fire', q.part); s += place('fire', q.part, loopFrame(P, t, q.phase, lod, red), q.x, q.y, q.flip); }
      else { const part = q.part + '-' + state, P = partOf('fire', part); s += place('fire', part, Math.min(P.frames - 1, Math.floor(p * P.frames)), q.x, q.y, q.flip); }
    });
    if (!red && state !== 'ignite') emberSlots(clusters, r, seed, t, lod, state === 'gutter' ? t - age : null).forEach((q) => { s += place('fire', q.part, q.frame, q.x, q.y, false); });
    if (!red && state === 'gutter') smokeSlots(clusters, seed, age, lod).forEach((q) => { s += place('fire', q.part, q.frame, q.x, q.y, false); });
    return s;
  }

  // ---- SPEC strokes of the reference composite (the renderer draws these with canvas lines) ----
  /** Arc from angle a0 clockwise to a1 on radius rr (SVG path data). */
  function arcD(rr, a0, a1) {
    const span = a1 - a0;
    if (span >= TAU - 1e-6) return `M${f(rr)},0 A${f(rr)},${f(rr)} 0 1 1 ${f(-rr)},0 A${f(rr)},${f(rr)} 0 1 1 ${f(rr)},0`;
    return `M${f(Math.cos(a0) * rr)},${f(Math.sin(a0) * rr)} A${f(rr)},${f(rr)} 0 ${span > Math.PI ? 1 : 0} 1 ${f(Math.cos(a1) * rr)},${f(Math.sin(a1) * rr)}`;
  }
  const strokeD = (d, t, w, a, dash, cap) => `<path d="${d}" fill="none" stroke="${colour(t)}" stroke-width="${f(w)}"${dash ? ` stroke-dasharray="${dash.join(' ')}"` : ''}${cap ? ` stroke-linecap="${cap}"` : ''}${op(a)}/>`;
  /** Crack layers at growth g: ink base (unless noInk) then core layers [token, share of the ink width]. */
  function crackLayers(cr, g, layers, noInk, a) {
    const C = SPEC.shock.cracks, segs = [];
    cr.arms.forEach((pts) => {
      const vis = cutPolyline(pts, polyLen(pts) * g), n = pts.length - 1;
      for (let k = 1; k < vis.length; k++) segs.push([vis[k - 1], vis[k], lerp(C.width[0], C.width[1], (k - 1) / Math.max(1, n - 1))]);
    });
    const gb = clamp((g - C.branchAt) / (1 - C.branchAt), 0, 1), w0 = lerp(C.width[0], C.width[1], C.branchAt) * 0.8;
    if (gb > 0) cr.branches.forEach((pts) => {
      const vis = cutPolyline(pts, polyLen(pts) * gb), n = pts.length - 1;
      for (let k = 1; k < vis.length; k++) segs.push([vis[k - 1], vis[k], lerp(w0, 1.2, (k - 1) / Math.max(1, n - 1))]);
    });
    const L = (noInk ? [] : [['ink', 1]]).concat(layers || []);
    return `<g${op(a)}>` + L.map((l) => segs.map((q) => `<path d="M${P2(q[0])} L${P2(q[1])}" stroke="${colour(l[0])}" stroke-width="${f(q[2] * l[1])}" stroke-linecap="round"/>`).join('')).join('') + '</g>';
  }
  /** Point where a polyline first reaches radius R (or its end). */
  function atRadius(pts, R) {
    for (let i = 1; i < pts.length; i++) {
      const a = Math.hypot(pts[i - 1][0], pts[i - 1][1]), b = Math.hypot(pts[i][0], pts[i][1]);
      if (b >= R) { const k = b > a ? clamp((R - a) / (b - a), 0, 1) : 1; return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; }
    }
    return pts[pts.length - 1].slice();
  }
  /** Shard slots of a burst at u = 0..1 (§4.1): shard j on arm (j mod 7) at radius (from + span·J)·r, flying out and up. */
  function shardSlots(cr, r, seed, u, lod) {
    const B = SPEC.shock.burst.shards, out = [];
    if (lod === 'minimal') return out;
    for (let j = 0; j < B.count; j++) {
      if (lod === 'reduced' && j % 2) continue;
      const base = atRadius(cr.arms[j % cr.arms.length], (B.from + (B.to - B.from) * jit(seed, B.jit + j)) * r), d = Math.hypot(base[0], base[1]) || 1;
      out.push({ part: 'shard-' + 'abc'[j % 3], x: base[0] + base[0] / d * B.out * u, y: base[1] + base[1] / d * B.out * u - 4 * B.hop * u * (1 - u), frame: Math.min(3, Math.floor(u * 4)) });
    }
    return out;
  }
  function dustSlots(r, seed, u, lod) {
    const D = SPEC.shock.burst.dust, out = [];
    if (lod === 'minimal') return out;
    for (let j = 0; j < D.count; j++) {
      if (lod === 'reduced' && j % 2) continue;
      const a = TAU * (j + 0.5 + (jit(seed, D.jit + j) - 0.5) * 0.5) / D.count;
      out.push({ part: 'dust-' + (j % 2 ? 'b' : 'a'), x: Math.cos(a) * (r + D.at), y: Math.sin(a) * (r + D.at), frame: Math.min(3, Math.floor(u * 4)) });
    }
    return out;
  }
  function drawShock(state, o) {
    const S = SPEC.shock, r = o.r, p = clamp(o.p, 0, 1), lod = o.lod, red = !!o.reduced, flashA = o.flash == null ? 1 : o.flash;
    const cr = shockCracks(r, o.seed), top = -Math.PI / 2;
    let s = '';
    if (state === 'telegraph') {
      // preview (p < 0.65) → imminent; the cracks grow under the rim
      const imm = p >= 0.65, g = Math.pow(Math.min(1, p / S.cracks.grow.full), S.cracks.grow.power);
      s += crackLayers(cr, g, imm ? S.coreLayers.imminent : S.coreLayers.telegraph);
      if (imm) layoutShock(r, o.seed, lod).forEach((q) => { const P = partOf('shock', q.part); s += place('shock', q.part, loopFrame(P, o.t, q.phase, lod, red), q.x, q.y, q.flip); });
      if (!imm) {
        const R = S.rim.preview, drawn = clamp(p / 0.65, 0, 1);
        s += strokeD(arcD(r, top, top + drawn * TAU), R.drawn[0][0], R.drawn[0][1]);
        if (drawn < 1) s += strokeD(arcD(r, top + drawn * TAU, top + TAU), R.rest.layers[0][0], R.rest.layers[0][1], null, R.rest.dash);
        s += strokeD(arcD(r + R.inner[0][2], top, top + drawn * TAU), R.inner[0][0], R.inner[0][1]);
      } else {
        const R = S.rim.imminent;
        s += ring(r, R.layers[0][0], R.layers[0][1]);
        s += strokeD(arcD(r + R.inner.layers[0][2], top, top + TAU), R.inner.layers[0][0], R.inner.layers[0][1], null, R.inner.dash);
        for (let i = 0; i < R.ticks.count; i++) {
          const a = TAU * i / R.ticks.count;
          s += strokeD(`M${f(Math.cos(a) * (r + R.ticks.from))},${f(Math.sin(a) * (r + R.ticks.from))} L${f(Math.cos(a) * (r + R.ticks.to))},${f(Math.sin(a) * (r + R.ticks.to))}`, R.ticks.layers[0][0], R.ticks.layers[0][1]);
        }
      }
      return s;
    }
    if (state === 'burst') {
      const B = S.burst, age = p * B.seconds, fa = age < B.fill.seconds ? B.fill.alpha : B.fill.alpha * Math.max(0, 1 - (age - B.fill.seconds) / (B.seconds - B.fill.seconds));
      s += disc(r, B.fill.token, fa * flashA);
      let dots = '';
      B.edge.rows.forEach((row, ri) => {
        const n = Math.max(B.edge.dots, Math.round(TAU * (r + row[0]) / B.edge.pitch));
        for (let j = 0; j < n; j++) { const a = TAU * (j + 0.5 * (ri % 2)) / n; dots += `<circle cx="${f(Math.cos(a) * (r + row[0]))}" cy="${f(Math.sin(a) * (r + row[0]))}" r="${f(row[1])}"/>`; }
      });
      s += `<g fill="${colour(B.edge.token)}"${op(fa / B.fill.alpha)}>${dots}</g>`;
      if (age < B.flash.seconds) s += rimLayers(r, B.flash.layers, flashA);
      s += crackLayers(cr, 1, S.coreLayers.burst);
      s += place('shock', 'core', Math.min(3, Math.floor(p * 4)), 0, 0, false, flashA);
      const u = Math.min(1, age / B.shards.seconds);
      shardSlots(cr, r, o.seed, u, lod).forEach((q) => { s += place('shock', q.part, q.frame, q.x, q.y, false); });
      dustSlots(r, o.seed, Math.min(1, age / B.dust.seconds), lod).forEach((q) => { s += place('shock', q.part, q.frame, q.x, q.y, false); });
      return s;
    }
    // decal: pale cracks and a faint crater, no rim; α 0.6 → 0. Shards and dust (0.3 s from the burst) finish their
    // last 0.05 s over the first moment of the decal.
    const D = S.decal, k = 1 - p, after = S.burst.seconds + p * D.seconds;
    s += fillPolys([ellPts(0, 0, D.crater.r * r, D.crater.r * r * 0.5, 16, 9, 0.12)], D.crater.token, D.crater.alpha * k);
    s += crackLayers(cr, 1, S.coreLayers.decal, true, D.alpha[0] * k);
    if (after < S.burst.shards.seconds) shardSlots(cr, r, o.seed, after / S.burst.shards.seconds, lod).forEach((q) => { s += place('shock', q.part, q.frame, q.x, q.y, false); });
    if (after < S.burst.dust.seconds) dustSlots(r, o.seed, after / S.burst.dust.seconds, lod).forEach((q) => { s += place('shock', q.part, q.frame, q.x, q.y, false); });
    return s;
  }

  /** Draw functions of the other kinds (filled in by their sections below). */
  const DRAWS = {};
  function draw(kind, state, opts) {
    const o = Object.assign({ r: 74, ch: 1, t: 0, p: 0, seed: 1, lod: 'full', reduced: false }, opts || {});
    if (ALL_KINDS.indexOf(kind) < 0) return warn(`unknown kind ${kind}`);
    if ((ALL_STATES[kind] || []).indexOf(state) < 0) return warn(`unknown state ${kind}/${state}`);
    if (!(o.ch >= 1 && o.ch <= 5 && Math.floor(o.ch) === o.ch)) return warn(`chapter must be 1-5 (${o.ch})`);
    if (!(o.r > 0)) return warn(`radius must be > 0 (${o.r})`);
    if (KINDS.indexOf(kind) < 0) return warn(`draw(${kind}) is not drawn in this delivery`);
    if (LODS.indexOf(o.lod) < 0) o.lod = 'full';
    const c = Ctx(`hzd-draw hzd-${kind} hzd-${kind}-${state}`);
    if (kind === 'fire') return c.out(drawFire(state, o));
    if (kind === 'shock') return c.out(drawShock(state, o));
    return c.out(DRAWS[kind] ? DRAWS[kind](state, o, c) : '');
  }

  // ---- control-zone ground (slow, root): the renderer keeps its current fill and hatch (§1.5 hatch 'current') ----
  // The reference composite stands in for the renderer's fill (#f3ead7 slow, #efe6d3 root) with p100 α 0.92 and copies
  // its 12-unit hatch tile: an ink hairline 0.8 (offset 1) under an amber line 2, both α 0.6, rising to the right.
  function zoneGround(r, c) {
    const id = c.uid('h');
    c.defs.push(`<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse">` +
      [['ink', 0.8, 1], ['warn', 2, 0]].map((q) => [-12, 0, 12].map((sh) => `<path d="M${sh + q[2]},12 L${sh + 12 + q[2]},0" stroke="${colour(q[0])}" stroke-width="${q[1]}" opacity="0.6"/>`).join('')).join('') + '</pattern>');
    return disc(r, 'p100', 0.92) + `<circle r="${f(r)}" fill="url(#${id})"/>`;
  }
  /** A sandwich rim (rows [token, width, offset, α, dash]) as circles. */
  const rimRows = (r, rows, a) => rows.map((l) => `<circle r="${f(r + l[2])}" fill="none" stroke="${colour(l[0])}" stroke-width="${f(l[1])}"${l[4] ? ` stroke-dasharray="${l[4].join(' ')}" stroke-linecap="round"` : ''}${op((l[3] == null ? 1 : l[3]) * (a == null ? 1 : a))}/>`).join('');

  DRAWS.slow = (state, o, c) => {
    const S = SPEC.slow, r = o.r, red = !!o.reduced, lod = o.lod;
    let s = zoneGround(r, c);
    if (o.ch === 4) {
      // the clock dial: ticks fill clockwise with progress p, one hand sweeps (jumps per tick in reduced motion)
      const D = S.dial, prog = clamp(o.p, 0, 1), on = Math.floor(prog * D.ticks);
      for (let i = 0; i < D.ticks; i++) {
        const a = -Math.PI / 2 + TAU * i / D.ticks, r1 = r + (i % D.every ? D.r1 : D.long), d = `M${f(Math.cos(a) * (r + D.r0))},${f(Math.sin(a) * (r + D.r0))} L${f(Math.cos(a) * r1)},${f(Math.sin(a) * r1)}`;
        s += (i < on ? D.on : D.off).map((l) => strokeD(d, l[0], l[1], l[3], null, 'round')).join('');
      }
      const ha = -Math.PI / 2 + TAU * (red ? on / D.ticks : prog), hd = `M0,0 L${f(Math.cos(ha) * D.hand.len * (r + D.r0))},${f(Math.sin(ha) * D.hand.len * (r + D.r0))}`;
      s += D.hand.layers.map((l) => strokeD(hd, l[0], l[1], null, null, 'round')).join('') + `<circle r="${f(D.hand.hub[1])}" fill="${colour(D.hand.hub[0])}"/>`;
      return s + rimRows(r, S.rim);
    }
    // puddles, then bubbles; the last 0.5 s (o.end 0..1) fades both
    const items = LAYOUTS.slow(r, o.seed, lod, o), fade = 1 - clamp(o.end || 0, 0, 1);
    items.filter((q) => q.z === 'ground').forEach((q) => { s += place('slow', q.part, 0, q.x, q.y, q.flip, fade); });
    items.filter((q) => q.z !== 'ground').forEach((q) => {
      const P = partOf('slow', q.part), fr = cycleFrame(P, o.t, q.phase, cyclePeriod(S.layout.bubble.cycle, S.layout.bubble.spread, q.phase), red);
      if (fr >= 0) s += place('slow', q.part, fr, q.x, q.y, false, fade);
    });
    return s + rimRows(r, S.rim);
  };

  DRAWS.root = (state, o, c) => {
    const S = SPEC.root, r = o.r, red = !!o.reduced, lod = o.lod, p = clamp(o.p, 0, 1);
    let s = zoneGround(r, c);
    LAYOUTS.root(r, o.seed, lod).forEach((q) => {
      let part = q.part, fr;
      if (state === 'emerge' || state === 'wither') { part += '-' + state; fr = Math.min(3, Math.floor(p * 4)); }
      else fr = loopFrame(partOf('root', part), state === 'faded' ? 0 : o.t, q.phase, lod, red || state === 'faded');
      s += place('root', part, fr, q.x, q.y, q.flip);
    });
    s += rimRows(r, S.rim);
    return state === 'faded' ? `<g${op(S.faded.alpha)}>${s}</g>` : s;
  };

  DRAWS.trap = (state, o) => {
    const S = SPEC.trap, r = o.r, p = clamp(o.p, 0, 1), c = trapCh(o.ch);
    // shut: the plate at sprungAlpha; o.p = progress through the last fadeLast seconds (0 = shut, 1 = gone)
    const k = state === 'shut' ? 1 - p : 1, plateA = (state === 'shut' ? S.windows.sprungAlpha : 1) * k;
    let s = disc(r, S.plate.token, S.plate.alpha * plateA);
    s += rimRows(r, S.groove, k);
    for (let i = 0; i < S.spokes.count; i++) {
      const a = TAU * i / S.spokes.count + Math.PI / S.spokes.count, d = `M${f(Math.cos(a) * S.spokes.to)},${f(Math.sin(a) * S.spokes.to)} L${f(Math.cos(a) * (r + S.spokes.from))},${f(Math.sin(a) * (r + S.spokes.from))}`;
      s += S.spokes.layers.map((l) => strokeD(d, l[0], l[1], (l[3] == null ? 1 : l[3]) * k)).join('');
    }
    const nr = Math.max(S.rivets.min, Math.round(TAU * r / S.rivets.per)), hs = S.rivets.size / 2;
    for (let i = 0; i < nr; i++) { const a = TAU * (i + 0.5) / nr, x = Math.cos(a) * (r + S.rivets.at), y = Math.sin(a) * (r + S.rivets.at); s += `<rect x="${f(x - hs)}" y="${f(y - hs)}" width="${S.rivets.size}" height="${S.rivets.size}" fill="${colour(S.rivets.token)}"${op(k)}/>`; }
    const part = state + '-ch' + c, P = partOf('trap', part), fr = state === 'spring' ? Math.min(P.frames - 1, Math.floor(p * P.frames)) : 0;
    s += place('trap', part, fr, 0, 0, false, k);
    return s + rimRows(r, S.rim, k);
  };

  DRAWS.null = (state, o) => {
    const S = SPEC.null, r = o.r, p = clamp(o.p, 0, 1), red = !!o.reduced, P = PATHS.null(r, o.seed);
    let s = '';
    if (state === 'erase') {
      // the eraser spreads from the centre: a jagged void that grows with p (smooth ease-out)
      const g = 1 - Math.pow(1 - p, 2), poly = smoothClosed(P.jag[0].map((q) => [q[0] * g, q[1] * g]), 4);
      s += fillPolys([poly], S.base.token, S.base.alpha);
    } else {
      const va = state === 'restore' ? 1 - p : 1;
      s += disc(r, S.base.token, S.base.alpha * va);
      // ghost lines: dashed ink300 on the void; in restore they are redrawn as solid brush lines (length × p)
      P.ghost.forEach((ln) => {
        const d = `M${P2(ln[0])} L${P2(ln[1])}`;
        if (state === 'restore') { const q = [ln[0], [lerp(ln[0][0], ln[1][0], p), lerp(ln[0][1], ln[1][1], p)]]; s += strokeD(`M${P2(q[0])} L${P2(q[1])}`, S.restore.line[0], S.restore.line[1], null, null, 'round') + strokeD(d, S.ghost.layers[0][0], S.ghost.layers[0][1], S.ghost.layers[0][3] * va, S.ghost.dash); }
        else s += strokeD(d, S.ghost.layers[0][0], S.ghost.layers[0][1], S.ghost.layers[0][3], S.ghost.dash);
      });
      LAYOUTS.null(r, o.seed, o.lod).forEach((q) => { s += place('null', q.part, 0, q.x, q.y, q.flip, va); });
    }
    if (S.active.on) s += S.active.layers.map((l) => ring(r * S.active.at, l[0], l[1])).join('');
    return s + rimRows(r, S.rim);
  };

  DRAWS.water = (state, o) => {
    const S = SPEC.water, r = o.r, red = !!o.reduced, lod = o.lod;
    let s = disc(r, S.base.token, S.base.alpha);
    LAYOUTS.water(r, o.seed, lod).forEach((q) => {
      const P = partOf('water', q.part);
      if (P.drive === 'cycle') {
        const fr = lod === 'minimal' ? P.still : cycleFrame(P, o.t, q.phase, cyclePeriod(S.layout.ripple.cycle, S.layout.ripple.spread, q.phase), red);
        if (fr >= 0) s += place('water', q.part, fr, q.x, q.y, q.flip);
      } else if (P.lod === 'info' || !red) s += place('water', q.part, loopFrame(P, o.t, q.phase, lod, red), q.x, q.y, q.flip); // waves hold their phase frame in reduced motion; flows and the glint are not drawn
    });
    return s + rimRows(r, S.rim);
  };

  // ==== 7. overlays: hero (back · front · embers) and enemy feet flames ====
  function heroEmberSlots(t) {
    const E = SPEC.hero.embers, out = [];
    E.origins.forEach((o, j) => {
      const T = E.cycle * (1 + E.jitter * (jit(E.seed, j + E.jit.period) - 0.5)), u = frac(t / T + jit(E.seed, j + E.jit.phase));
      const side = E.outward ? (o[0] < 0 ? -1 : 1) : 0;
      out.push({ part: j % 2 ? 'ember-b' : 'ember-a', x: o[0] + side * E.drift * u, y: o[1] - E.rise * u, frame: Math.min(5, Math.floor(6 * u)) });
    });
    return out;
  }
  function overlay(group, layer, opts) {
    const o = Object.assign({ t: 0, p: 0, r: 12, facing: 1, reduced: false, lod: 'full' }, opts || {});
    const mir = (body) => (o.facing < 0 ? `<g transform="scale(-1 1)">${body}</g>` : body);
    if (group === 'hero') {
      if (layer === 'back' || layer === 'front') {
        const P = partOf('hero', layer), fr = loopFrame(P, o.t, 0, o.lod, o.reduced);
        return Ctx(`hzd-overlay hzd-hero-${layer}`).out(mir(place('hero', layer, fr, 0, 0, false)));
      }
      if (layer === 'embers') {
        const c = Ctx('hzd-overlay hzd-hero-embers');
        if (o.reduced || o.lod === 'minimal') return c.out('');
        return c.out(mir(heroEmberSlots(o.t).map((q) => place('fire', q.part, q.frame, q.x, q.y, false)).join('')));
      }
      if (layer === 'bind-back' || layer === 'bind-front') {
        // prog 0.2 s, the last frame held (o.p = progress of the wrap, 0..1)
        const P = partOf('hero', layer), fr = Math.min(P.frames - 1, Math.floor(clamp(o.p, 0, 1) * P.frames));
        return Ctx(`hzd-overlay hzd-hero-${layer}`).out(mir(place('hero', layer, fr, 0, 0, false)));
      }
      return warn(`unknown hero layer ${layer}`);
    }
    if (group === 'mob') {
      if (layer !== 'front') return warn(`unknown mob layer ${layer}`);
      if (!(o.r > 0)) return warn(`enemy radius must be > 0 (${o.r})`);
      const size = SPEC.mob.radii.reduce((b, v) => (Math.abs(v - o.r) < Math.abs(b - o.r) ? v : b), SPEC.mob.radii[0]);
      const P = partOf('mob', 'front-' + size), fr = loopFrame(P, o.t, 0, o.lod, o.reduced);
      return Ctx(`hzd-overlay hzd-mob-front-${size}`).out(mir(place('mob', 'front-' + size, fr, 0, 0, false)));
    }
    return warn(`unknown overlay group ${group}`);
  }

  // ==== 7b. codex icons (art audit P2-2 · kit audit P2-2, 2026-10-26) ====
  /**
   * icon(kind, {ch}) — a still icon per kind for the codex terrain sheet (64 CSS px cells): the game's own picture at icon
   * size, so the codex and the field show the same thing. The hit circle (radius ICON.r) is filled with the chapter floor
   * (PN.env.CH[ch].base, read only), then drawn in the kind's draw() order (§9): base, the kind's ground, the same atlas
   * stamps (each scaled uniformly by its own factor — never stretched, no new drawing) and the kind's SPEC rim rows with
   * widths, offsets and dashes × ICON.rim[kind]. No centre glyph. Representative states: fire burn, shock imminent
   * (cracks + telegraph rim, no fill), slow and root static, water static, trap armed (the chapter machine), null static.
   * Local box −32…32 × −32…32, origin = the circle centre; paint stays inside ±30 (the sheet refuses paint on a cell edge).
   */
  const fz = (rows) => Object.freeze(rows.map((q) => Object.freeze(q)));
  const ICON = Object.freeze({
    box: Object.freeze([64, 64]), r: 25, ch: 1, hatch: 0.6,
    rim: Object.freeze({ fire: 0.6, shock: 0.45, slow: 0.55, water: 0.75, root: 0.55, trap: 0.6, null: 0.55 }),
    // the crack set of paths('shock', r, seed) shrunk to the icon: from r 120 its arms start 2.1 off the centre (an open
    // impact point, not a converging '✳'); line weights per arm / branch segment, first → last
    shock: Object.freeze({ r: 120, seed: 11, arm: Object.freeze([1.9, 0.9]), branch: Object.freeze([1.1, 0.7]) }),
    trap: Object.freeze({ hub: 16 }),
    // two of the four ghost lines of paths('null', 120, 164): they neither cross nor meet inside the disc and keep
    // ≥ 0.38 r off the centre. All four always make a '+' somewhere inside (their angles are 44° apart), and other
    // pairs meet as a 'V', 'Λ' or 'X' at icon size.
    null: Object.freeze({ r: 120, seed: 164, lines: Object.freeze([0, 3]), line: 0.8 }),
    // [group, part, frame, x, y, scale, flip]: `ground` is drawn before the rim, `top` after it (fire), or both before
    // it (the other kinds, as their draw order has the rim last). Trap 'armed-ch' takes the chapter (5 → 1).
    pieces: Object.freeze({
      fire: Object.freeze({ ground: fz([['fire', 'char-a', 0, -3, 10, 0.6, 0]]), top: fz([['fire', 'cluster-s-b', 0, -2, -12, 0.55, 0], ['fire', 'cluster-s-b', 0, 15, -1, 0.72, 1], ['fire', 'cluster-s-a', 0, -15, 1, 0.72, 0], ['fire', 'cluster-l-a', 0, 0, 15, 0.72, 0]]) }),
      shock: Object.freeze({ ground: fz([]), top: fz([]) }),
      slow: Object.freeze({ ground: fz([['slow', 'mire-m-a', 0, -3, 5, 0.6, 0], ['slow', 'mire-s-b', 0, 9, -10, 0.6, 0]]), top: fz([['slow', 'bubble-a', 2, -7, 6, 0.8, 0]]) }),
      water: Object.freeze({ ground: fz([['water', 'wave-a', 0, 3, -10, 0.55, 0], ['water', 'wave-b', 0, 2, 3, 0.55, 0], ['water', 'ripple-a', 3, -6, 14, 0.7, 0], ['water', 'glint', 0, -12, -16, 1, 0]]), top: fz([]) }),
      root: Object.freeze({ ground: fz([]), top: fz([['root', 'vine-a', 0, 10, -6, 0.85, 1], ['root', 'vine-b', 0, -10, -2, 0.85, 0], ['root', 'vine-c', 0, 2, 13, 0.85, 0]]) }),
      trap: Object.freeze({ ground: fz([['trap', 'armed-ch', 0, 0, 1, 0.55, 0]]), top: fz([]) }),
      null: Object.freeze({ ground: fz([['null', 'crumb-a', 0, -12, -13, 1.3, 0], ['null', 'crumb-b', 0, 13, 11, 1.3, 1]]), top: fz([]) })
    })
  });
  /** SPEC rim rows [token, width, offset, α, dash] at icon weight: width, offset and dash × k. */
  const iconRows = (rows, k) => rows.map((l) => [l[0], l[1] * k, l[2] * k, l[3], l[4] ? l[4].map((v) => f(v * k)) : undefined]);
  function iconPieces(list, ch) {
    return list.map((q) => {
      const part = q[1] === 'armed-ch' ? q[1] + trapCh(ch) : q[1];
      return `<g transform="translate(${f(q[3])} ${f(q[4])}) scale(${f(q[5])})">${place(q[0], part, q[2], 0, 0, !!q[6])}</g>`;
    }).join('');
  }
  function icon(kind, opts) {
    const o = Object.assign({ ch: ICON.ch }, opts || {});
    if (ALL_KINDS.indexOf(kind) < 0) return warn(`unknown icon kind ${kind}`);
    if (!(o.ch >= 1 && o.ch <= 5 && Math.floor(o.ch) === o.ch)) return warn(`chapter must be 1-5 (${o.ch})`);
    const c = Ctx(`hzd-icon hzd-icon-${kind}`), R = ICON.r, k = ICON.rim[kind], P = ICON.pieces[kind], top = -Math.PI / 2;
    const env = PN.env && PN.env.CH && PN.env.CH[o.ch];
    let s = `<circle r="${R}" fill="${env ? env.base : K.ink500}"/>`;
    if (kind === 'fire') {
      const S = SPEC.fire;
      s += disc(R, S.base.token, S.base.alpha) + iconPieces(P.ground, o.ch) + rimLayers(R, iconRows(S.rim, k)) + iconPieces(P.top, o.ch);
    } else if (kind === 'shock') {
      // the imminent telegraph: full-grown cracks of the C9 crack set (radius ICON.shock.r) shrunk to R with icon line
      // weights (ink, then the imminent core rows), the ink rim, the amber dashed inner rim and the eight ticks
      const S = SPEC.shock, IS = ICON.shock, cr = shockCracks(IS.r, IS.seed), sc = R / IS.r, segs = [];
      [[cr.arms, IS.arm], [cr.branches, IS.branch]].forEach((g) => g[0].forEach((pts) => {
        const n = pts.length - 1;
        for (let i = 1; i <= n; i++) segs.push([pts[i - 1], pts[i], lerp(g[1][0], g[1][1], (i - 1) / Math.max(1, n - 1))]);
      }));
      s += [['ink', 1]].concat(S.coreLayers.imminent).map((l) => segs.map((q) => `<path d="M${P2([q[0][0] * sc, q[0][1] * sc])} L${P2([q[1][0] * sc, q[1][1] * sc])}" stroke="${colour(l[0])}" stroke-width="${f(q[2] * l[1])}" stroke-linecap="round"/>`).join('')).join('');
      const I = S.rim.imminent, T = I.ticks;
      s += ring(R, I.layers[0][0], I.layers[0][1] * k);
      s += strokeD(arcD(R + I.inner.layers[0][2] * k, top, top + TAU), I.inner.layers[0][0], I.inner.layers[0][1] * k, null, I.inner.dash.map((v) => f(v * k)));
      for (let i = 0; i < T.count; i++) {
        const a = TAU * i / T.count, r0 = R + T.from * k, r1 = R + T.to * k;
        s += strokeD(`M${f(Math.cos(a) * r0)},${f(Math.sin(a) * r0)} L${f(Math.cos(a) * r1)},${f(Math.sin(a) * r1)}`, T.layers[0][0], T.layers[0][1] * k);
      }
    } else if (kind === 'slow' || kind === 'root') {
      // the renderer's zone ground (fill + hatch tile) at ICON.hatch, puddles / vines, then the rim
      s += `<g transform="scale(${ICON.hatch})">${zoneGround(R / ICON.hatch, c)}</g>` + iconPieces(P.ground, o.ch) + iconPieces(P.top, o.ch) + rimRows(R, iconRows(SPEC[kind].rim, k));
    } else if (kind === 'water') {
      s += disc(R, SPEC.water.base.token, SPEC.water.base.alpha) + iconPieces(P.ground, o.ch) + rimRows(R, iconRows(SPEC.water.rim, k));
    } else if (kind === 'trap') {
      const S = SPEC.trap, hub = ICON.trap.hub;
      s += disc(R, S.plate.token, S.plate.alpha) + rimRows(R, iconRows(S.groove, k));
      for (let i = 0; i < S.spokes.count; i++) {
        const a = TAU * i / S.spokes.count + Math.PI / S.spokes.count, r1 = R + S.spokes.from * k;
        s += S.spokes.layers.map((l) => strokeD(`M${f(Math.cos(a) * hub)},${f(Math.sin(a) * hub)} L${f(Math.cos(a) * r1)},${f(Math.sin(a) * r1)}`, l[0], l[1] * k, l[3])).join('');
      }
      const hs = S.rivets.size * k / 2, rr = R + S.rivets.at * k;
      for (let i = 0; i < S.rivets.min; i++) {
        const a = TAU * (i + 0.5) / S.rivets.min;
        s += `<rect x="${f(Math.cos(a) * rr - hs)}" y="${f(Math.sin(a) * rr - hs)}" width="${f(2 * hs)}" height="${f(2 * hs)}" fill="${colour(S.rivets.token)}"/>`;
      }
      s += iconPieces(P.ground, o.ch) + rimRows(R, iconRows(S.rim, k));
    } else if (kind === 'null') {
      const S = SPEC.null, IN = ICON.null, g = PATHS.null(IN.r, IN.seed), sc = R / IN.r, G = S.ghost;
      s += disc(R, S.base.token, S.base.alpha);
      IN.lines.map((i) => g.ghost[i]).forEach((ln) => { s += strokeD(`M${P2([ln[0][0] * sc, ln[0][1] * sc])} L${P2([ln[1][0] * sc, ln[1][1] * sc])}`, G.layers[0][0], IN.line, G.layers[0][3], G.dash.map((v) => f(v * IN.line))); });
      s += iconPieces(P.ground, o.ch) + rimRows(R, iconRows(S.rim, k));
    }
    return c.out(s);
  }

  // ==== 8. self-checks (review only; not baked) ====
  /**
   * Area rules (§13-3·4·9, §14-4). Painted fractions are counted on a grid with isPointInFill in the review page;
   * without a DOM the area part of check() is skipped. Coverage per kind comes from areaOf() and its fill mask (MASKS).
   * - fire.cover (definition B): (flame stamps ∪ char ∪ heat band [r − 12, r − 6]) / π r², full LOD, stamps on their t = 0
   *   frames, seeds 1·7·23; step 1 at the game radii 50·60·68·74·98, step 2 at the others; ≥ 45 %.
   * - fire.hole: the diameter of the largest circle inside r − 12 that no flame stamp (body or ring) paints; char counts as
   *   empty; step-2 mask; ≤ 44.
   * - fire.big (r ≥ 100, tolerance): cover ≥ 27 %, hole ≤ 84 (step 2).
   * - char alone 5–15 % at the cover radii. The strict cover (no band) is reported only.
   * - slow.mire: the ink.700 puddles cover 25–35 % of the disc at the game radii 86 · 145 · 150 · 200 · 270 (step 2, seeds
   *   1·5·9); 60 · 100 · 120 · 160 · 240 are reported only. root.vine: the vines paint ≤ 18 % at 50 · 52 (step 1).
   *   water: reported only (reach of ripples and flows). Hole numbers (the largest empty circle inside r − 6) are
   *   reported only (review 2 §7-4).
   */
  const AREA_RULES = {
    fire: {
      cover: { min: 0.45, radii: [50, 54, 58, 60, 62, 66, 68, 70, 74, 78, 82, 86, 90, 94, 98], seeds: [1, 7, 23], fine: [50, 60, 68, 74, 98], step: [1, 2] },
      hole: { max: 44, step: 2, inset: 12 },
      big: { radii: [150], cover: 0.27, hole: 84, step: 2 },
      char: [0.05, 0.15]
    },
    slow: { mire: [0.25, 0.35], radii: [86, 145, 150, 200, 270], seeds: [1, 5, 9], step: 2, report: [60, 100, 120, 160, 240] },   // ink.700 puddles
    root: { vine: [0, 0.18], radii: [50, 52], seeds: [1, 5, 9], step: 1 },                                        // vine ink
    water: { radii: [145, 200, 270], seeds: [1, 3, 7], step: 2 }                                                   // holes reported only
  };
  /**
   * Fill masks per kind (review 2 §7-4): fill(q) — the layout item fills the disc (holes are measured against fill items
   * only; the other items count for cover alone); band() — a SPEC rim row whose band counts for cover (definition B).
   * Delivery 2: slow (mire puddles), water (ripples and flows), root (vines). shock, trap and null have no scattered fill
   * (cracks are paths, the trap is one machine, the null void is the whole disc), so they have no mask.
   */
  const MASKS = {
    fire: { fill: (q) => q.z === 'flame', band: () => SPEC.fire.rim[0], inset: 12 },
    slow: { fill: (q) => /^mire-/.test(q.part), inset: 6 },     // ink.700 puddles (bubbles count as cover only)
    // ripples are thin rings that grow over their cycle: their reach (the inscribed ellipse of box − 6) is the fill
    water: { fill: (q) => /^(wave|ripple|flow)-/.test(q.part), inset: 6, extent: true },
    root: { fill: (q) => /^vine-/.test(q.part), inset: 6 }
  };
  const NAMES = { '#121110': 'ink', '#EF5B4F': 'cor', '#FFE4DF': 'glw', '#FAF6EC': 'p50', '#B8352B': 'dep', '#2B2926': 'ink7', '#8C8579': 'ink3', '#46423D': 'ink5' };
  function raster(markup) {
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.innerHTML = markup; document.body.appendChild(svg);
    const E = Array.prototype.slice.call(svg.querySelectorAll('path,circle'));
    const M = E.map((e) => { const m = e.getCTM(); return new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]).inverse(); });
    const F = E.map((e) => NAMES[(e.getAttribute('fill') || '').toUpperCase()] || 'other');
    return {
      top: (x, y) => { for (let i = E.length - 1; i >= 0; i--) if (E[i].isPointInFill(new DOMPoint(x, y).matrixTransform(M[i]))) return F[i]; return null; },
      done: () => svg.remove()
    };
  }
  /** Painted fractions of one stamp frame: {total (units²), ink, cor, glw, p50, dep, …} (fractions of total). */
  function stampArea(group, part, frame, step) {
    const p = partOf(group, part), R = raster(stamp(group, part, { frame })), cnt = {};
    let tot = 0;
    for (let y = step / 2; y < p.box[1]; y += step) for (let x = step / 2; x < p.box[0]; x += step) { const c = R.top(x, y); if (c) { cnt[c] = (cnt[c] || 0) + 1; tot++; } }
    R.done();
    const out = { total: tot * step * step };
    Object.keys(cnt).forEach((k) => { out[k] = cnt[k] / tot; });
    return out;
  }
  /**
   * Squared Euclidean distance transform of a 0/BIG grid (Felzenszwalb & Huttenlocher), in place: columns, then rows.
   * g: Float64Array(nx·ny), row-major (index = iy·nx + ix); returns g holding squared distances in cells.
   */
  const EDT_BIG = 1e12;
  function edt1(f) {
    const n = f.length, d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    let k = 0;
    v[0] = 0; z[0] = -1e30; z[1] = 1e30;
    for (let q = 1; q < n; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = 1e30;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
    return d;
  }
  function edt2(g, nx, ny) {
    const col = new Float64Array(ny), row = new Float64Array(nx);
    for (let ix = 0; ix < nx; ix++) {
      for (let iy = 0; iy < ny; iy++) col[iy] = g[iy * nx + ix];
      const d = edt1(col);
      for (let iy = 0; iy < ny; iy++) g[iy * nx + ix] = d[iy];
    }
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) row[ix] = g[iy * nx + ix];
      const d = edt1(row);
      for (let ix = 0; ix < nx; ix++) g[iy * nx + ix] = d[ix];
    }
    return g;
  }
  /**
   * areaOf(kind, r, seed, {step, holeStep, t}) — coverage of one hazard (review 2 §7-4). Its full-LOD layout items are
   * placed on their loop frame at time t (default 0; other drives frame 0) and rasterised with isPointInFill.
   * Fractions of π r² (cell centres inside r, grid `step`): cover = items ∪ band (definition B), strict = items only,
   * fill = fill items only, ground = the other items only. hole = the diameter of the largest circle inside r − inset that
   * no fill item paints: a `holeStep` mask over [−r, r]², squared EDT, 2 · max over cells p with |p| ≤ r − inset of
   * min(√D(p)·holeStep, (r − inset) − |p|). Also returns n (items) and body (prio-0 items). A mask with `extent`
   * counts its fill items by their reach (the inscribed ellipse of box − 6) instead of their paint (water ripples).
   */
  function areaOf(kind, r, seed, o) {
    o = o || {};
    const M = MASKS[kind];
    if (!M || typeof document === 'undefined') return null;
    const step = o.step || 1, hs = o.holeStep || 2, t = o.t || 0, inset = M.inset || 0;
    const list = layout(kind, r, seed, { lod: 'full', ch: o.ch });
    const items = list.map((q) => {
      const P = partOf(kind, q.part), fr = P.drive === 'loop' ? loopFrame(P, t, q.phase, 'full', false) : 0;
      const x0 = q.flip ? q.x - (P.box[0] - P.anchor[0]) : q.x - P.anchor[0], fill = M.fill(q);
      return { fill, ext: !!(M.extent && fill), x0, y0: q.y - P.anchor[1], w: P.box[0], h: P.box[1], R: raster(place(kind, q.part, fr, q.x, q.y, q.flip)) };
    });
    const inEll = (it, x, y) => Math.pow((x - it.x0 - it.w / 2) / ((it.w - 6) / 2), 2) + Math.pow((y - it.y0 - it.h / 2) / ((it.h - 6) / 2), 2) <= 1;
    const hits = (x, y, fillOnly) => {
      let hf = false, hg = false;
      for (let i = items.length - 1; i >= 0 && !(hf && (hg || fillOnly)); i--) {
        const it = items[i];
        if ((it.fill && hf) || (!it.fill && (hg || fillOnly))) continue;
        if (x < it.x0 || x > it.x0 + it.w || y < it.y0 || y > it.y0 + it.h) continue;
        if (it.ext ? inEll(it, x, y) : it.R.top(x, y)) { if (it.fill) hf = true; else hg = true; }
      }
      return [hf, hg];
    };
    const B = M.band ? M.band() : null, b0 = B ? r + B[2] - B[1] / 2 : 0, b1 = B ? r + B[2] + B[1] / 2 : -1;
    let n = 0, cov = 0, strict = 0, nf = 0, ng = 0;
    for (let y = -r + step / 2; y < r; y += step) for (let x = -r + step / 2; x < r; x += step) {
      const d = Math.hypot(x, y);
      if (d > r) continue;
      n++;
      const h = hits(x, y, false);
      if (h[0]) nf++;
      if (h[1]) ng++;
      if (h[0] || h[1]) strict++;
      if (h[0] || h[1] || (d >= b0 && d <= b1)) cov++;
    }
    const nx = Math.ceil(2 * r / hs), g = new Float64Array(nx * nx);
    for (let iy = 0; iy < nx; iy++) for (let ix = 0; ix < nx; ix++) {
      const x = -r + hs / 2 + ix * hs, y = -r + hs / 2 + iy * hs;
      g[iy * nx + ix] = hits(x, y, true)[0] ? 0 : EDT_BIG;
    }
    edt2(g, nx, nx);
    let best = 0;
    const lim = r - inset;
    for (let iy = 0; iy < nx; iy++) for (let ix = 0; ix < nx; ix++) {
      const x = -r + hs / 2 + ix * hs, y = -r + hs / 2 + iy * hs, d = Math.hypot(x, y);
      if (d > lim) continue;
      best = Math.max(best, Math.min(Math.sqrt(g[iy * nx + ix]) * hs, lim - d));
    }
    items.forEach((it) => it.R.done());
    return { cover: cov / n, strict: strict / n, fill: nf / n, ground: ng / n, hole: 2 * best, n: list.length, body: list.filter((q) => q.prio === 0).length };
  }
  /** Measured numbers for the delivery report (DOM only). o.area === false skips the coverage table. */
  function measure(o) {
    o = o || {};
    if (typeof document === 'undefined' || !document.createElementNS) return null;
    const step = o.step || 0.5, res = { clusters: {}, low: {}, embers: {}, area: {} };
    ['s', 'm', 'l'].forEach((sz) => ['a', 'b'].forEach((v) => { res.clusters[sz + '-' + v] = [0, 1, 2, 3, 4, 5].map((fr) => stampArea('fire', 'cluster-' + sz + '-' + v, fr, step)); }));
    [['hero', 'back', 6], ['hero', 'front', 6], ['mob', 'front-12', 4], ['mob', 'front-19', 4], ['mob', 'front-28', 4]].forEach((q) => {
      res.low[q[0] + '/' + q[1]] = Array.from({ length: q[2] }, (_, fr) => stampArea(q[0], q[1], fr, step));
    });
    ['ember-a', 'ember-b'].forEach((e) => { res.embers[e] = [0, 1, 2, 3].map((fr) => stampArea('fire', e, fr, 0.1)); });
    if (o.area !== false) {
      const A = AREA_RULES.fire;
      A.cover.radii.concat(A.big.radii).forEach((r) => A.cover.seeds.forEach((sd) => {
        const big = A.big.radii.indexOf(r) >= 0, st = o.coverStep || (big ? A.big.step : A.cover.fine.indexOf(r) >= 0 ? A.cover.step[0] : A.cover.step[1]);
        res.area['fire/r' + r + 's' + sd] = Object.assign({ kind: 'fire', r, seed: sd, big }, areaOf('fire', r, sd, { step: st, holeStep: A.hole.step }));
      }));
      // delivery 2 kinds: the checked radii, then report-only radii
      ['slow', 'root', 'water'].forEach((k) => {
        const R = AREA_RULES[k];
        R.radii.concat(R.report || []).forEach((r) => R.seeds.forEach((sd) => {
          res.area[k + '/r' + r + 's' + sd] = Object.assign({ kind: k, r, seed: sd, report: R.radii.indexOf(r) < 0 }, areaOf(k, r, sd, { step: R.step, holeStep: 2 }));
        }));
      });
    }
    return res;
  }
  /** Numbers the work order asks for that the renderer cannot see. Returns the list of breaches (empty = ok). */
  function check(o) {
    const out = [];
    // rim ring and body clusters stay inside rimDist 'rise' (R2, S1; C7 line 2)
    const radii = AREA_RULES.fire.cover.radii.concat(AREA_RULES.fire.big.radii);
    radii.forEach((r) => [1, 7, 23].forEach((sd) => ['full', 'reduced'].forEach((lod) => {
      layoutFire(r, sd, lod).filter((q) => q.z === 'flame').forEach((q) => {
        const a = Math.atan2(q.y, q.x), need = rimDist(r, a, partOf('fire', q.part).box, 'rise', 0) + 1e-6;
        if (Math.hypot(q.x, q.y) > need) out.push(`rim inset r${r} s${sd} ${lod} ${q.part} ${f(r - Math.hypot(q.x, q.y))} < ${f(r - need)}`);
        if (!farOK(r, q.x, q.y, partOf('fire', q.part).anchor[1], SPEC.fire.layout.rim.far)) out.push(`far rim r${r} s${sd} ${lod} ${q.part}`);
      });
    })));
    if (o && o.areas === false) return out.concat(tongueChecks());
    const m = measure(o);
    if (m) {
      Object.keys(m.clusters).forEach((k) => m.clusters[k].forEach((a, fr) => {
        if (!(a.ink >= 0.40)) out.push(`cluster-${k} f${fr} ink ${f(a.ink * 100)}%`);
        if (!((a.cor || 0) + (a.dep || 0) <= 0.45)) out.push(`cluster-${k} f${fr} coral ${f(((a.cor || 0) + (a.dep || 0)) * 100)}%`);
        if (!(a.glw >= 0.08 && a.glw <= 0.14)) out.push(`cluster-${k} f${fr} glow ${f((a.glw || 0) * 100)}%`);
        if (!((a.p50 || 0) <= 0.03)) out.push(`cluster-${k} f${fr} p50 ${f(a.p50 * 100)}%`);
      }));
      Object.keys(m.low).forEach((k) => m.low[k].forEach((a, fr) => {
        const min = k === 'mob/front-12' ? 0.25 : 0.30;
        if (!((a.cor || 0) >= min)) out.push(`${k} f${fr} coral ${f((a.cor || 0) * 100)}% < ${min * 100}`);
        if (!(a.ink <= 0.62)) out.push(`${k} f${fr} ink ${f(a.ink * 100)}% > 62`);
      }));
      Object.keys(m.embers).forEach((k) => m.embers[k].forEach((a, fr) => {
        if (!((a.cor || 0) + (a.glw || 0) >= 0.55)) out.push(`${k} f${fr} coral+glow ${f(((a.cor || 0) + (a.glw || 0)) * 100)}%`);
        if (fr <= 1 && !((a.glw || 0) * a.total >= 1)) out.push(`${k} f${fr} glow core ${f((a.glw || 0) * a.total)} u²`);
      }));
      Object.keys(m.area).forEach((k) => {
        const c = m.area[k], R = AREA_RULES.fire;
        if (c.kind === 'slow') { if (!c.report && (c.fill < AREA_RULES.slow.mire[0] || c.fill > AREA_RULES.slow.mire[1])) out.push(`slow mire ${k} ${f(c.fill * 100)}%`); return; }
        if (c.kind === 'root') { if (c.fill > AREA_RULES.root.vine[1]) out.push(`root vine ${k} ${f(c.fill * 100)}%`); return; }
        if (c.kind !== 'fire') return;
        if (c.big) {
          if (c.cover < R.big.cover) out.push(`fire cover(B) ${k} ${f(c.cover * 100)}% < ${R.big.cover * 100}`);
          if (c.hole > R.big.hole) out.push(`fire hole ${k} ${f(c.hole)} > ${R.big.hole}`);
          return;
        }
        if (c.cover < R.cover.min) out.push(`fire cover(B) ${k} ${f(c.cover * 100)}% < ${R.cover.min * 100}`);
        if (c.hole > R.hole.max) out.push(`fire hole ${k} ${f(c.hole)} > ${R.hole.max}`);
        if (c.ground < R.char[0] || c.ground > R.char[1]) out.push(`fire char ${k} ${f(c.ground * 100)}%`);
      });
    }
    return out.concat(tongueChecks());
  }
  /** Neighbour tongue heights ≥ 15 % apart and coral tips ≥ 3 below the ink tips, every loop frame. */
  function tongueChecks() {
    const out = [];
    ['s', 'm', 'l'].forEach((sz) => ['a', 'b'].forEach((v) => {
      for (let fr = 0; fr < 6; fr++) {
        const T = clusterTongues(sz, v, 'loop', fr).tongues.slice().sort((p, q) => p.bx - q.bx);
        for (let i = 1; i < T.length; i++) {
          const a = T[i - 1].h, b = T[i].h, d = 1 - Math.min(a, b) / Math.max(a, b);
          if (d < 0.15) out.push(`neighbour ${sz}-${v} f${fr} rows ${T[i - 1].i}/${T[i].i} ${f(d * 100)}%`);
        }
        clusterTongues(sz, v, 'loop', fr).tongues.forEach((t) => {
          const ie = innerEdges(t, CL[sz].ins[0], CL[sz].ins[1], 0);
          if (ie && ie.tip[1] - (t.by - t.h) < 3) out.push(`coral tip ${sz}-${v} f${fr} row ${t.i} ${f(ie.tip[1] - (t.by - t.h))}`);
        });
      }
    }));
    // low flames: neighbours inside each clump, and the coral tip depth
    Object.keys(FEET).map((k) => [k, FEET[k], FEET[k].frames]).forEach((q) => {
      for (let fr = 0; fr < q[2]; fr++) {
        const all = lowTongues(q[1], fr, q[2]);
        q[1].clumps.forEach((c, ci) => {
          const T = all.filter((t) => t.ci === ci).sort((p, r) => p.bx - r.bx);
          for (let i = 1; i < T.length; i++) {
            const d = 1 - Math.min(T[i - 1].h, T[i].h) / Math.max(T[i - 1].h, T[i].h);
            if (d < 0.15) out.push(`neighbour ${q[0]} f${fr} clump ${ci} ${f(d * 100)}%`);
          }
        });
        const ins = q[1].ins || LOW.ins;
        all.forEach((t) => {
          const ie = innerEdges(t, ins[0], ins[1], 0, LOW.tip);
          if (ie && ie.tip[1] - (t.by - t.h) < LOW.tip - 0.01) out.push(`coral tip ${q[0]} f${fr} row ${t.i} ${f(ie.tip[1] - (t.by - t.h))}`);
        });
      }
    });
    return out;
  }

  PN.hazards = {
    // 1.0 = delivery 2 (285 frames); 1.0-d2r1 = its review-3 revision (W1 waves, B1 bind, R1 vines, R2 kron draws);
    // 1.0-d2r2 = review-4 N1 (null ghost lines keep clear of the centre; paths('null') only)
    version: '1.0-d2r2',
    K,
    kinds: KINDS,
    groups: GROUPS,
    states: STATES,
    META,
    SPEC,
    jit,
    planned: { kinds: ALL_KINDS.slice(), states: ALL_STATES, groups: ALL_KINDS.concat(['hero', 'mob']), heroLayers: ['back', 'front', 'embers', 'bind-back', 'bind-front'] },
    parts: (group) => (PARTS[group] ? PARTS[group].map(copyPart) : (warn(`unknown group ${group}`), [])),
    stamp,
    layout,
    paths,
    draw,
    overlay,
    // codex terrain icons (art/kit audit P2-2, 2026-10-26): additive; no stamp, layout, draw or SPEC value changed
    icon,
    ICON,
    _: {
      check, measure, areaOf, rimDist, scatter, rimPlace, capCut, kron, AREA_RULES, clusterTongues, heroEmberSlots,
      emberSlots: (r, seed, t, lod) => emberSlots(layoutFire(r, seed, lod || 'full').filter((q) => q.prio === SPEC.fire.layout.prio.cluster), r, seed, t, lod || 'full', null)
    }
  };
})(window.PN);
