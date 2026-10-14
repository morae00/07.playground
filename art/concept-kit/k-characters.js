// k-characters.js — the seven playable characters besides 결 → window.PN.characters (K8, CON-10)
// Brief: docs/art/briefs/characters.md (B2). API: art/concept-kit/API-characters.md.
// Load order: lib.js → k-hero.js → k-characters.js. PN._hk is read at call time only, never at load time; of its general
// tools this module uses Ctx, smooth, spriteRing, negate (hurt f0 · f1), splat and brushArc. Nothing of 결's look
// (head34, hat34, neck34, FACE, sHead, sCoat, sRibbon, sArm, sBody, scarf*, bandolier, spool, hand) is called. 결's FACE
// point run and his edge() brush method are copied below (brief §2, §5.1).
// 2nd delivery (brief §9, §13): all four states (idle 6 · run 8 · throw 4 · hurt 3) and all six expressions are drawn;
// an unknown id, state or expression throws.
window.PN = window.PN || {};
(function (PN) {
  'use strict';
  // ---- v1.0 tokens: the only colours this module writes (brief §2; the bakes' COLOR_MAP and hurt negate know these) ----
  const K = Object.freeze({
    ink: '#121110', ink7: '#2B2926', p50: '#FAF6EC', paper: '#F3EEE2', p300: '#D8D0C0',
    ally: '#00A8C6', allyD: '#007C94', allyG: '#CFF6FF', hostileD: '#B8352B',
    // ink.100: the portrait background vignette ONLY (as 결 and the boss portraits; brief §13-1). Never on a figure.
    ink1: '#BCB4A5'
  });
  const IDS = Object.freeze(['dan', 'noeul', 'seori', 'dok', 'hwi', 'ryeong', 'wol']);
  const ALL = Object.freeze(['gyeol', ...IDS]);
  const STATES = Object.freeze(['idle', 'run', 'throw', 'hurt']);
  const EXPRS = Object.freeze(['calm', 'focus', 'hurt', 'lowhp', 'awakened', 'victory']);
  const DRAWN_STATES = STATES;
  const DRAWN_EXPRS = EXPRS;
  const SPRITE = Object.freeze({
    w: 96, h: 96, pivot: Object.freeze([48, 60]), r: 15, height: 64, top: -49, feet: 15,
    shadow: Object.freeze({ cy: 8.25, rx: 15, ry: 6.5 }), ring: Object.freeze({ cy: 8.25, rx: 24, ry: 10.3 }),
    frames: Object.freeze({ idle: 6, run: 8, throw: 4, hurt: 3 }), fps: Object.freeze({ idle: 8, run: 14, throw: 16, hurt: 12 })
  });
  const PORTRAIT = Object.freeze({ w: 160, h: 160, pivot: Object.freeze([80, 80]), r: 74, exprs: EXPRS });
  const TAU = Math.PI * 2;
  const f = (n) => Math.round(n * 100) / 100;
  const pt = (p) => f(p[0]) + ',' + f(p[1]);
  const sp = (p) => f(p[0]) + ' ' + f(p[1]);
  const hk = () => {
    const H = PN._hk;
    if (!H || !PN.heroKit || !H.Ctx) throw new Error('PN.characters: load k-hero.js before k-characters.js');
    return H;
  };
  const T = (p, w, mode, fill, extra) => PN.taper(p, w, mode || 'mid', fill || K.ink, extra || '');
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, s) => [a[0] * s, a[1] * s];
  const norm = (a) => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
  const perp = (a) => [-a[1], a[0]];
  const rot = (p, deg, o) => {
    o = o || [0, 0];
    const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), x = p[0] - o[0], y = p[1] - o[1];
    return [o[0] + x * c - y * s, o[1] + x * s + y * c];
  };
  const polar = (o, r, deg) => [o[0] + r * Math.cos(deg * Math.PI / 180), o[1] + r * Math.sin(deg * Math.PI / 180)];
  const poly = (P) => 'M ' + P.map(pt).join(' L ') + ' Z';
  const sm = (P, closed, k) => hk().smooth(P, closed, k);
  const fillP = (d, fill, extra) => `<path d="${d}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
  const line = (P, w, col, extra) => `<path d="M ${P.map(pt).join(' L ')}" fill="none" stroke="${col || K.ink}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${extra ? ' ' + extra : ''}/>`;
  const IL = `stroke="${K.ink}" stroke-width="0.6" stroke-linejoin="round"`;
  // mono: every fill and stroke one ink (the silhouette the bakes cut); ids never start with a hex digit run after '#'
  const mono = (m) => m.replace(/#[0-9A-Fa-f]{6}(?![0-9A-Za-z_])/g, K.ink);

  // ======================================================================================================
  // SPRITE RIG (1x px, origin = pivot = hit-circle centre, feet y +15, facing +x; brief §3)
  // ======================================================================================================

  // tapered strip along a spine: widths W[i]; o.tip = extra point past the end (pointed ribbon), o.sharp = polygon
  function strip(P, W, o) {
    o = o || {};
    const n = P.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], nn = perp(norm(sub(b, a))), w = W[i] / 2;
      L.push(add(P[i], mul(nn, w))); R.push(sub(P[i], mul(nn, w)));
    }
    const pts = L.concat(o.tip ? o.tip : [], R.reverse());
    return o.sharp ? poly(pts) : sm(pts, true, o.k == null ? 0.12 : o.k);
  }
  // shadow side of a normal: the key light is upper-left, so the half facing +x+y is the shade
  const shadeSign = (nn) => (nn[0] + nn[1] > 0 ? 1 : -1);
  // cyan cloth (signature): ink edge · ally · allyD underside · allyG core (bible §5.3 sandwich). end: 'point' | 'fork' | 'flat'
  function ribbon(P, w0, w1, o) {
    o = o || {};
    const n = P.length, W = P.map((_, i) => w0 + (w1 - w0) * i / (n - 1));
    const e = P[n - 1], u = norm(sub(e, P[n - 2])), nn = perp(u), we = W[n - 1] / 2;
    let tip = null;
    if (o.end === 'fork') tip = [add(add(e, mul(nn, we)), mul(u, 1.8)), add(e, mul(u, 0.1)), add(sub(e, mul(nn, we)), mul(u, 1.3))];
    else if (o.end !== 'flat') tip = [add(e, mul(u, o.tipLen == null ? Math.max(1, we * 2.4) : o.tipLen))];
    const d = strip(P, W, { tip, k: 0.1 });
    // underside strip on the shade half, inside the outline
    const D1 = [], D2 = [], G = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], m = perp(norm(sub(b, a))), s = shadeSign(m);
      D1.push(add(P[i], mul(m, s * W[i] * 0.06))); D2.push(add(P[i], mul(m, s * W[i] * 0.44)));
      G.push(add(P[i], mul(m, -s * W[i] * 0.2)));
    }
    let out = `<path d="${d}" fill="${K.ally}" ${IL}/><path d="${poly(D1.concat(D2.reverse()))}" fill="${K.allyD}"/>`;
    const gk = Math.max(2, Math.round(n * 0.7));
    if (o.glow !== false && gk >= 2) out += line(G.slice(0, gk), 0.55, K.allyG);
    return out;
  }
  // a cyan knot, the sandwich in miniature: ink rim, ally, allyD lower-right crescent, allyG catch stroke
  function knot(c, r) {
    return `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="${K.ally}" ${IL}/>` +
      fillP(`M ${pt([c[0] + r * 0.9, c[1] - r * 0.35])} A ${f(r)} ${f(r)} 0 0 1 ${pt([c[0] - r * 0.35, c[1] + r * 0.9])} C ${pt([c[0] + r * 0.1, c[1] + r * 0.3])} ${pt([c[0] + r * 0.4, c[1] + r * 0.1])} ${pt([c[0] + r * 0.9, c[1] - r * 0.35])} Z`, K.allyD) +
      line([[c[0] - r * 0.55, c[1] - r * 0.1], [c[0] - r * 0.1, c[1] - r * 0.55]], Math.max(0.4, r * 0.35), K.allyG);
  }
  // ink soaking up from a cloth edge (bible §6-7): a 1–1.5 px band along the bottom edge P, ragged top, no halftone
  function hem(P, h, up, seed) {
    const U = norm(up || [0, -1]), r = PN.rng(seed || 7), top = [], bot = [];
    P.forEach((p) => { top.push(add(p, mul(U, h * (0.7 + 0.6 * r())))); bot.push(sub(p, mul(U, 0.25))); });
    return fillP(sm(top, false, 0.15) + ' L ' + bot.reverse().map(pt).join(' L ') + ' Z', K.ink);
  }
  // 2-bone IK; side +1 bends the knee toward +x
  function ik(hp, an, L, side) {
    const dx = an[0] - hp[0], dy = an[1] - hp[1], d = Math.min(L[0] + L[1] - 0.01, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
    const k = Math.acos(Math.max(-1, Math.min(1, (L[0] * L[0] + d * d - L[1] * L[1]) / (2 * L[0] * d)))) * (side || 1);
    return [hp[0] + Math.cos(a - k) * L[0], hp[1] + Math.sin(a - k) * L[0]];
  }
  // shoe with a small upturned toe (ink), sole on the feet line when the ankle is at y 12.6
  function shoe(an, toe) {
    const r = (toe || 0) * Math.PI / 180, c = Math.cos(r), si = Math.sin(r), P = (x, y) => pt([an[0] + x * c - y * si, an[1] + x * si + y * c]);
    return `<path d="M ${P(-2.2, -1.1)} L ${P(1.5, -1.1)} C ${P(2.8, -0.8)} ${P(3.9, -0.1)} ${P(4.6, 0.8)} L ${P(5.5, 0.2)} L ${P(5.4, 2.4)} L ${P(-2.6, 2.4)} Z" fill="${K.ink}"/>`;
  }
  // leg: trouser (paper; far leg paper shade) with a 0.5 px ink edge, wraps, shoe.
  // wrap: 'daenim' ink ankle tie · 'haengjeon' paper legging + one ink tie · 'ink' ink legging · 'boot' ink boot
  function leg(hp, an, o) {
    o = o || {};
    const kn = o.knee || ik(hp, an, o.L || [8, 7.8], o.side || 1), w = o.w || 4;
    // the trouser stroke stops short of the ankle so its round cap never pokes under the sole (feet line y +15)
    const fill = o.fill || (o.far ? K.p300 : K.paper), cap = Math.max(0, (w + 1) / 2 - 2);
    const d = `M ${pt(hp)} L ${pt(kn)} L ${pt(sub(an, mul(norm(sub(an, kn)), cap)))}`;
    let s = `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="${f(w + 1)}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const seg = (t0, t1, col, ww) => `<path d="M ${pt(lerp(kn, an, t0))} L ${pt(lerp(kn, an, t1))}" stroke="${col}" stroke-width="${f(ww)}"/>`;
    if (o.wrap === 'daenim') s += seg(0.72, 0.9, K.ink, w + 0.7);
    else if (o.wrap === 'haengjeon') s += seg(0.34, 0.97, K.ink, w + 1.1) + seg(0.36, 0.95, o.far ? K.p300 : K.p50, w + 0.1) + seg(0.5, 0.58, K.ink, w + 0.3);
    else if (o.wrap === 'ink') s += seg(0.3, 0.98, K.ink, w + 0.9) + `<path d="M ${pt(lerp(kn, an, 0.5))} L ${pt(add(lerp(kn, an, 0.62), [0.2, 0]))}" stroke="${o.far ? K.p300 : K.p50}" stroke-width="0.5"/>`;
    else if (o.wrap === 'boot') s += seg(0.44, 0.98, K.ink, w + 0.7) + seg(0.44, 0.5, o.far ? K.p300 : K.p50, w - 0.6);
    if (o.shoe !== false) s += shoe(an, o.toe);
    return s;
  }
  // tapered sleeve shoulder → elbow → wrist, ink-soaked cuff
  function sleeve(J, W, o) {
    o = o || {};
    let s = `<path d="${strip(J, W, { k: 0.1 })}" fill="${o.fill || K.paper}" ${IL}/>`;
    if (o.cuff !== false) {
      const n = J.length, u = norm(sub(J[n - 1], J[n - 2])), m = perp(u), w = W[n - 1] / 2 + 0.05, e = J[n - 1];
      s += fillP(poly([add(e, mul(m, w)), sub(e, mul(m, w)), add(sub(e, mul(m, w)), mul(u, -(o.cuff || 1.3))), add(add(e, mul(m, w)), mul(u, -(o.cuff || 1.3) - 0.3))]), K.ink);
    }
    return s;
  }
  // bare paper hand (all seven work bare-handed; 결's black glove is his alone, brief §4.2)
  function hand(p, deg, k) {
    k = k || 1;
    return `<g transform="translate(${sp(p)}) rotate(${f(deg || 0)}) scale(${f(k)})"><path d="M -1.3,-1.5 C 0.3,-2 2.1,-1.4 2.5,-0.1 C 2.7,1.2 1.5,1.9 0.1,1.8 C -0.9,1.7 -1.7,1 -1.7,0 Z" fill="${K.paper}" ${IL}/><path d="M 0.4,-1.7 L 1.6,-2.4" stroke="${K.ink}" stroke-width="0.5" stroke-linecap="round"/></g>`;
  }
  // B-type (lit) sprite face, brief §5.4: one ink eye mark, the nose as a bump of the contour, a level 1 px mouth on the
  // contour end, no far-eye dot, no scar. A-type (령) adds the fringe shadow round a 2×2 paper glint.
  function face(o) {
    const [ex, ey] = o.eye, cy = o.chin, nd = o.nose || [4.7, 1.1], N = [ex + nd[0], ey + nd[1]];
    const my = ey + (o.mouth == null ? 3.3 : o.mouth), cx = o.chinX || 0, jx = o.jawX || 0, jy = o.jawY || 0;
    const A = [ex - 6.4, ey - 5.8], B = [ex + 2.4, ey - 5.9], C = [ex + 3.1, ey - 2.6], D = [ex + 2.4, ey - 0.9];
    const F = [N[0] - 1.1, N[1] + 0.9], G = [ex + 3.6 + (o.lipX || 0), my - 0.6], M = [ex + 3.2 + (o.lipX || 0), my];
    const I = [ex + 3.4 + (o.lipX || 0), my + 0.8], J = [ex + 2.7 + cx, cy - 1], Kc = [ex + 1 + cx, cy];
    const L = [ex - 3 - jx, cy - 1.5 + jy * 0.5], Mj = [ex - 5 - jx, ey + 2.7 + jy], O = [ex - 6.4 - jx * 0.5, ey - 0.6];
    const d = `M ${pt(A)} L ${pt(B)} C ${pt([B[0] + 0.6, B[1] + 1])} ${pt([C[0], C[1] - 1.2])} ${pt(C)} L ${pt(D)} L ${pt(N)} L ${pt(F)} L ${pt(G)} L ${pt(M)} L ${pt(I)} ` +
      `C ${pt([I[0] - 0.1, I[1] + 0.8])} ${pt([J[0] + 0.3, J[1] - 0.6])} ${pt(J)} C ${pt([J[0] - 0.4, J[1] + 0.6])} ${pt([Kc[0] + 0.8, Kc[1]])} ${pt(Kc)} ` +
      `C ${pt([Kc[0] - 1.6, Kc[1] - 0.2])} ${pt([L[0] + 1, L[1] + 0.2])} ${pt(L)} C ${pt([L[0] - 1, L[1] - 0.4])} ${pt([Mj[0] + 0.6, Mj[1] + 1])} ${pt(Mj)} L ${pt(O)} Z`;
    // neck in paper shade under the jaw: a value edge, not a stroke, separates the chin from the neck
    let skin = fillP(poly([[ex - 4.4 - jx * 0.5, ey + 2.6], [ex + 0.6 + cx, cy - 1.6], [ex + 0.8 + cx, cy + 2.6], [ex - 4.8 - jx * 0.5, cy + 2.4]]), K.p300);
    skin += fillP(d, K.paper);
    let marks = '';
    if (o.shade) {
      // A-type: fringe shadow wraps the glint with ≥ 1 px of ink on every side, its lower edge falling toward the back
      // like 결's brim shadow (k-hero.js:1433) — never level, never a cup under the eye (review 1, F1)
      marks += fillP(`M ${pt([ex - 7.6, ey - 6])} L ${pt([ex + 3.6, ey - 6])} L ${pt([ex + 3.6, ey - 1.8])} L ${pt([ex + 2.9, ey + 0.2])} L ${pt([ex + 1.6, ey + 2.2])} L ${pt([ex - 1.6, ey + 3.2])} L ${pt([ex - 4.6, ey + 3.8])} L ${pt([ex - 7.6, ey + 4.4])} Z`, K.ink);
      marks += `<rect x="${f(ex - 1)}" y="${f(ey - 1)}" width="2" height="2" fill="${K.p50}"/>`;
    } else {
      marks += `<rect x="${f(ex - 0.7)}" y="${f(ey - 0.8)}" width="1.4" height="1.6" fill="${K.ink}"/>`;
      if (o.flick === 'up') marks += `<path d="M ${pt([ex - 0.5, ey - 0.6])} L ${pt([ex - 1.5, ey - 1.5])}" stroke="${K.ink}" stroke-width="0.6" stroke-linecap="round"/>`;
      if (o.flick === 'down') marks += `<path d="M ${pt([ex - 0.5, ey + 0.4])} L ${pt([ex - 1.5, ey + 1.2])}" stroke="${K.ink}" stroke-width="0.6" stroke-linecap="round"/>`;
      // brow (독 · 휘 only): y0 at the back end, y1 at the nose end, its lower edge ≥ 1 px above the eye mark
      if (o.brow) marks += `<path d="M ${pt([ex - 1.7, ey + o.brow.y0])} L ${pt([ex + 2.3, ey + o.brow.y1])}" stroke="${K.ink}" stroke-width="${f(o.brow.w || 1)}" stroke-linecap="butt"/>`;
    }
    // nose underside and the level mouth on the contour end
    marks += `<path d="M ${pt([N[0] - 0.2, N[1] + 0.55])} L ${pt([N[0] - 1.2, N[1] + 0.85])}" stroke="${K.ink}" stroke-width="0.55"/>`;
    marks += `<path d="M ${pt([M[0] - 1.8, M[1]])} L ${pt([M[0] + 0.15, M[1]])}" stroke="${K.ink}" stroke-width="0.75"/>`;
    return { skin, marks, N, M, chin: Kc, top: A };
  }

  // per-state pose: bob, squash, lean, hips and ankles (world, un-leaned). Run legs follow 결's cycle (k-hero.js:1481-1487)
  const RUN_A = [[11.6, 12.4, -6], [7.4, 12.6, 0], [2.4, 12.6, 0], [-3.6, 12, 16], [-11.4, 11, 32], [-12.6, 8, 42], [-7, 5.4, 18], [4.4, 6.4, -14]];
  const RUN_BOB = [0, 0.6, -1.5, -1, 0, 0.6, -1.5, -1];
  const RUN_SY = [0.94, 1, 1.04, 1, 0.94, 1, 1.04, 1], RUN_SX = [1.03, 1, 0.98, 1, 1.03, 1, 0.98, 1];
  function pose(id, state, fr) {
    const R = CHARS[id].rig, N = SPRITE.frames[state], i = ((fr % N) + N) % N, ph = i / N * TAU;
    const P = { id, state, i, N, ph, bob: 0, sx: 1, sy: 1, lean: 0, lag: 0, run: state === 'run' };
    if (P.run) {
      const k = R.stride || 1, near = RUN_A[i], far = RUN_A[(i + 4) % 8], q = R.squashK == null ? 1 : R.squashK;
      P.bob = RUN_BOB[i] * (R.bobK || 1);
      P.sy = 1 + (RUN_SY[i] - 1) * q; P.sx = 1 + (RUN_SX[i] - 1) * q;
      P.lean = R.runLean;
      P.hipN = [1.6, -2.6 + P.bob]; P.hipF = [-1.6, -2.6 + P.bob];
      P.ankN = [near[0] * k + (R.runDx || 0), near[1]]; P.toeN = near[2];
      P.ankF = [far[0] * k - 0.6 + (R.runDx || 0), far[1] - 0.3]; P.toeF = far[2];
      P.legL = R.runLegL || [9.2, 9];
      // cloth lags the legs by one frame (k-hero.js:1487); arms swing against the near leg
      P.lag = Math.sin((i - 1) / 8 * TAU * 2) * 3;
      P.swing = Math.cos(ph);
      P.flut = Math.sin(ph * 2);
    } else if (state === 'throw') {
      // draw → wind → snap (release) → follow; 결's throw leans (k-hero.js:1493) on the idle stance
      P.thr = true; P.mode = ['draw', 'wind', 'snap', 'follow'][i];
      P.lean = [2, -2, 6, 5][i] + (R.idleLean || 0);
      P.hipN = [1.8, 0]; P.hipF = [-1.8, 0];
      P.sway = [0.2, -0.8, 0.9, 0.5][i]; P.sway2 = [0.5, -0.4, 0.6, 1][i]; P.swing = 0; P.flut = [0.2, -0.8, 1, 0.6][i];
    } else if (state === 'hurt') {
      // f0 · f1 negative flash (the assembler negates them), f2 own colours with ink splashes; body −9/−6/−3°, hats and
      // hair ornaments −14/−10/−5° (k-hero.js:1493-1494)
      P.hurt = true; P.neg = i < 2;
      P.lean = [-9, -6, -3][i]; P.tilt = [-14, -10, -5][i];
      P.hipN = [1.8, 0]; P.hipF = [-1.8, 0];
      P.sway = [-1, -0.6, -0.2][i]; P.sway2 = [-0.8, -0.4, 0][i]; P.swing = 0; P.flut = [-1, -0.6, -0.2][i];
    } else {
      P.bob = -(1 - Math.cos(ph)) * 0.5 * (R.idleBobK || 1);
      P.lean = R.idleLean || 0;
      P.hipN = [1.8, P.bob]; P.hipF = [-1.8, P.bob];
      P.sway = Math.sin(ph); P.sway2 = Math.sin(ph - 1.2); P.swing = 0; P.flut = Math.sin(ph);
    }
    return P;
  }
  // rotate a head ornament (hat, topknot, pin, ponytail…) about its base while hurt
  const tiltG = (P, s, o, k) => (P.hurt ? `<g transform="rotate(${f(P.tilt * (k == null ? 1 : k))} ${f(o[0])} ${f(o[1])})">${s}</g>` : s);
  // hurt legs: the near foot skids forward onto its heel (결's hurt legs, k-hero.js:1496)
  const skid = (P, an) => (P.hurt ? [an[0] + 1.6, an[1] - 0.2] : an);
  // projectiles and strokes, drawn inside the figure so they share the outline (as 결's snap needle)
  function dagger(cn, deg, L) {
    const u = [Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180)], n = perp(u), a = sub(cn, mul(u, L / 2)), b = add(cn, mul(u, L / 2)), m = lerp(a, b, 0.62);
    return fillP(poly([add(a, mul(n, 0.8)), add(m, mul(n, 1.3)), b, sub(m, mul(n, 1.3)), sub(a, mul(n, 0.8))]), K.p50, IL) + fillP(poly([add(m, mul(n, 1.3)), b, sub(m, mul(n, 1.3))]), K.ink);
  }
  // a closed (folded) fan: ink guard sticks with the paper fold edge between them
  function foldedFan(piv, r, deg) {
    const u = [Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180)], n = perp(u), e = add(piv, mul(u, r));
    return fillP(poly([add(piv, mul(n, 0.7)), add(e, mul(n, 1.4)), add(e, mul(u, 0.6)), sub(e, mul(n, 1.4)), sub(piv, mul(n, 0.7))]), K.ink) + line([add(piv, mul(u, 2)), add(e, mul(u, -0.4))], 0.45, K.p50);
  }
  // sandwich thread (ink · cyan · glow), optionally broken into dashes (the thread left behind)
  function thread(P, w, dash) {
    const d = `M ${P.map(pt).join(' L ')}`, da = dash ? ` stroke-dasharray="${dash}"` : '';
    return `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="${f(w * 1.7)}" stroke-linecap="round" stroke-linejoin="round"${da}/>` +
      `<path d="${d}" fill="none" stroke="${K.ally}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${da}/>` +
      `<path d="${d}" fill="none" stroke="${K.allyG}" stroke-width="${f(w * 0.35)}" stroke-linecap="round" stroke-linejoin="round"${da}/>`;
  }
  // short motion streaks (ink, tapering away from the motion)
  const streak = (a, b, w) => T([a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, b[0], b[1]], w || 1.2, 'start');
  // frost needle (서리침): paper body, cyan point (ink edge · ally · allyD · allyG), no thread tail (결's needle has one).
  // Flying needles trail a short frost tail: a paper streak with a thin ink · cyan · glow thread
  function frostNeedle(cn, deg, L, held) {
    const u = [Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180)], n = perp(u), a = sub(cn, mul(u, L / 2)), b = add(cn, mul(u, L / 2)), m = lerp(a, b, 0.62);
    let s = '';
    if (!held) s += T([...sub(a, mul(u, 0.3)), ...sub(a, mul(u, 3)), ...sub(a, mul(u, 6))], 1.6, 'start', K.p50) + thread([sub(a, mul(u, 5)), sub(a, mul(u, 0.8))], 0.5);
    s += fillP(poly([add(a, mul(n, 0.55)), add(m, mul(n, 0.75)), sub(m, mul(n, 0.75)), sub(a, mul(n, 0.55))]), K.p50, IL);
    s += fillP(poly([add(m, mul(n, 0.75)), b, sub(m, mul(n, 0.75))]), K.ally, IL) + fillP(poly([m, b, sub(m, mul(n, 0.75))]), K.allyD) +
      line([add(lerp(m, b, 0.1), mul(n, 0.25)), add(lerp(m, b, 0.5), mul(n, 0.15))], 0.3, K.allyG);
    return s;
  }
  // a world point (un-leaned) expressed in the leaned upper-body frame, so cloth can reach the ground while it leans
  function toUp(P, p) { return rot([p[0], p[1] - P.bob], -P.lean, [0, 1]); }
  // wrap with only the defs the body references: Ctx also defines halftone patterns and a blur filter that the sprites and
  // portraits here never use (no halftone on sprites, no blur anywhere), so they are left out of the markup
  function wrapUsed(c, body) {
    const keep = c.defs.filter((d) => { const m = d.match(/\sid="([^"]+)"/); return !m || body.includes(`#${m[1]})`) || body.includes(`#${m[1]}"`); });
    c.defs.length = 0;
    keep.forEach((d) => c.defs.push(d));
    return c.wrap(body);
  }

  // ======================================================================================================
  // CHARACTERS · sprite (draw → { world: legs and ground-anchored parts, up: the leaned upper body })
  // ======================================================================================================
  const CHARS = {};

  // ---- 단 dan · 칼잡이 · 부채 단검 (fanKnives) ------------------------------------------------------------
  // keys: knife fan opened in front (rivet (12,−13), r 14, 7 knife-tip teeth), small head with a topknot and two short
  // split band tails, hip-length jacket over bent legs. Cyan: the headband and its two pointed tails (head).
  function danFan(piv, r, a0, a1, o) {
    o = o || {};
    const n = 7, tips = [], edge = [];
    for (let k = 0; k < n; k++) tips.push(a1 + (a0 - a1) * k / (n - 1));
    // notches at 0.76 r (brief 11.6 of 14, deepened 1.0 inside the ±1.5 range): the outline's dilation fills 1.1–1.5 px of
    // every notch, and at 0.83 r the teeth vanished from the silhouette
    tips.forEach((a, k) => { edge.push(polar(piv, r, a)); if (k < n - 1) edge.push(polar(piv, r * (o.notch || 0.76), (a + tips[k + 1]) / 2)); });
    let s = fillP(poly([piv].concat(edge)), K.paper, IL);
    // sticks: ink ribs from the gathered base to each knife tip, heavier guard sticks at both edges
    tips.forEach((a, k) => { s += line([polar(piv, 2.2, a), polar(piv, r - 1.4, a)], k === 0 || k === n - 1 ? 0.9 : 0.5); });
    s += fillP(poly([piv, polar(piv, 3.6, a1 - 4), polar(piv, 3.8, (a0 + a1) / 2), polar(piv, 3.6, a0 + 4)]), K.ink);
    return s;
  }
  CHARS.dan = {
    weapon: 'fanKnives', eye: [7, -30.2], face: 'lit', cyan: 'head',
    rig: { idleLean: 3, runLean: 16, runLegL: [9, 8.8], stride: 1 },
    draw(P) {
      const run = P.run, E = this.eye;
      let world = '';
      if (run) {
        world += leg(P.hipF, P.ankF, { L: P.legL, w: 4, far: true, wrap: 'daenim', toe: P.toeF }) +
          leg(P.hipN, P.ankN, { L: P.legL, w: 4.3, wrap: 'daenim', toe: P.toeN });
      } else {
        world += leg(P.hipF, [-6.4, 12.6], { knee: [-7, 6 + P.bob * 0.5], w: 4, far: true, wrap: 'daenim' }) +
          leg(P.hipN, skid(P, [7.2, 12.6]), { knee: [9, 5 + P.bob * 0.5], w: 4.3, wrap: 'daenim', toe: P.hurt ? -8 : 0 });
      }
      let up = '';
      const thr = P.thr, M = P.mode;
      // far arm swings behind the body when running
      if (run) {
        const sw = -P.swing, el = [-2.6 + sw * 2.4, -15.8], wr = [-0.4 + sw * 5.6, -11.4 - Math.abs(sw) * 1.2];
        up += sleeve([[-1.6, -22], el, wr], [3.8, 3.2, 2.6], { fill: K.p300 }) + hand(add(wr, mul(norm(sub(wr, el)), 1.2)), Math.atan2(wr[1] - el[1], wr[0] - el[0]) * 180 / Math.PI);
      }
      // jacket (paper, hip length), ink vest over the back half, belt, folded fans at the back hip, soaked hem
      const lg = run ? P.lag : P.sway * 0.4, hb = [-9.8 - lg * 0.35, 2.2 - lg * 0.45];
      up += fillP(sm([[-6, -24.8], [-8.6, -22.2], [-9.2, -15], [-9.5, -6], hb, [-3, 3], [4, 3.1], [9.4, 2.2], [9.3, -6], [8.6, -14], [8.2, -20.4], [6.6, -24.4], [1.8, -25.6]], true, 0.14), K.paper);
      up += fillP(sm([[-6, -24.8], [-8.6, -22.2], [-9.2, -15], [-9.4, -9.4], [-3.4, -9.4], [-3, -16], [-2, -23.6], [-3.6, -25.2]], true, 0.12), K.ink);
      up += fillP('M -9.5,-9.8 C -3,-9.2 3,-9.2 9.4,-9.8 L 9.4,-8.4 C 3,-7.8 -3,-7.8 -9.5,-8.4 Z', K.ink);
      // one folded fan tucked through the belt at the back hip: an ink wedge with a paper guard-stick stroke along its
      // whole front edge (three short parallel slants read as hatching, review 1 F6; brief §13-6)
      up += fillP('M -2,-11 L -3.8,-11.2 L -6.8,-3.4 L -5.8,-3.1 Z', K.ink) + line([[-2.5, -10.8], [-6, -3.5]], 0.4, K.p50);
      up += hem([hb, [-3, 3], [4, 3.1], [9.4, 2.2]], 1.2, [0, -1], 11);
      // collar: ink 깃 band with the paper 동정 strip
      up += T([2, -25.4, 4.4, -23, 6.4, -20.6], 1.6, 'end') + line([[2.6, -25.2], [4.6, -23.2]], 0.5, K.p50);
      // head: tails behind, face, hair cap, topknot, cyan band over the hair, knot
      const fl = run ? P.flut : P.sway;
      const t1 = run ? [[-4.8, -34.6], [-7.8, -35.6], [-10.8, -36.2 + fl * 0.5], [-14, -36.4 + fl * 0.8]] : [[-4.8, -34.6], [-7.6, -36.2], [-10.6, -37.4 + fl * 0.4], [-13.8, -38.2 + fl * 0.7]];
      const t2 = run ? [[-4.8, -34], [-7.8, -33.4], [-10.8, -32.4 - fl * 0.5], [-14, -32 - fl * 0.8]] : [[-4.8, -34], [-7.8, -33.2], [-10.8, -32 - fl * 0.4], [-13.8, -30.8 - fl * 0.7]];
      up += tiltG(P, ribbon(t2, 2.3, 0.7, { tipLen: 1.6 }) + ribbon(t1, 2.3, 0.7, { tipLen: 1.6 }), [-4.8, -34.3]);
      const F = face({ eye: E, chin: -24.6, nose: [4.7, 1.1], chinX: 0.3, jawX: -0.4 });
      up += F.skin + F.marks;
      up += fillP('M 9.8,-33.6 C 9.6,-36.6 7,-38.6 3,-38.6 C -0.8,-38.6 -3.9,-36.5 -4.3,-33.2 C -4.5,-30.8 -3.5,-28.6 -1.9,-27.4 L 0.7,-28.2 C 0.7,-29.8 1.1,-31.3 2.1,-32.4 L 9.8,-32.8 Z', K.ink);
      up += tiltG(P, `<ellipse cx="1.3" cy="-39.4" rx="2.3" ry="2.1" transform="rotate(-12 1.3 -39.4)" fill="${K.ink}"/>`, [1.6, -37.6]);
      up += ribbon([[10, -34.3], [7, -34.9], [3.6, -35.1], [0, -34.8], [-3.2, -34.4], [-4.8, -34.2]], 2, 2, { end: 'flat' });
      up += knot([-4.9, -34.3], 1.35);
      // near arm, the fan in front of it, the hand on the rivet. idle: rivet (16.5, −12), front edge at +5° (+ flick), so
      // every knife tip keeps ≥ 1 px of ground from nose, mouth and chin with the outline on (brief §13-6, review 1 F3)
      if (thr) {
        // throw (fan daggers): draw — fan folded before the chest; wind — arm cocked back, fan closed behind; snap — the
        // fan flicks open and three paper daggers fly in a ±15° fan; follow — fan wide open (150°), dagger trails
        const A = { draw: [[6.8, -15.2], [9.4, -17.6]], wind: [[-1.6, -18.8], [-5.4, -22.6]], snap: [[8.6, -18.4], [15.2, -15.4]], follow: [[9.4, -15], [17, -10.6]] }[M];
        up += sleeve([[2.6, -22.2], A[0], A[1]], [4.3, 3.5, 2.9]);
        if (M === 'draw') up += foldedFan([10.4, -17.8], 12, -35) + hand([10.2, -17.6], -30);
        else if (M === 'wind') up += foldedFan([-6.2, -23.2], 11, -150) + hand([-6, -23.2], -150);
        else if (M === 'snap') {
          up += danFan([17, -14], 14, -90, 5) + hand([16.8, -13.8], 10);
          [-15, 0, 15].forEach((a) => { up += dagger(polar([17, -14], 18.6, a), a, 7); });
        } else {
          up += danFan([19, -9], 14, -130, 20) + hand([18.8, -8.8], 30);
          up += streak([40, -19.4], [27, -16.6], 1.3) + streak([42, -13], [29, -11.4], 1.3) + streak([39.4, -6.6], [27.4, -6.2], 1.1);
        }
      } else {
        // (idle rivet 1 u right of the review's (15.5, −12): the outline filter dilates with a square kernel, so the
        // top knife tip and the nose tip came within 0.4 u diagonally; at 16.5 ≥ 1 u of ground stays between them)
        const piv = run ? [9.8, -10.6] : [16.5, -12];
        const wr = run ? [8.6, -11.4] : [15.2, -12.7], el = run ? [5, -15.4] : [9.4, -16.2];
        up += sleeve([[2.6, -22.2], el, wr], [4.3, 3.5, 2.9]);
        const flick = run || P.hurt ? 0 : (1 - Math.cos(P.ph)) * 2;
        // hurt: the fan snaps half shut (45°)
        const spread = run ? 62 : P.hurt ? 45 : 82.5 + 12.5 * Math.cos(P.ph);
        const front = run ? -6 : 5 + flick;
        up += danFan(piv, run ? 12 : 14, front - spread, front);
        up += hand(add(piv, [-0.2, 0.2]), run ? 20 : 10);
      }
      return { world, up };
    }
  };

  // ---- shared cloth helpers ----
  // paper cloth band (towel, ties): ink edge, optional middle fold
  function cloth(P, w0, w1, o) {
    o = o || {};
    const n = P.length, W = P.map((_, i) => w0 + (w1 - w0) * i / (n - 1)), e = P[n - 1], u = norm(sub(e, P[n - 2]));
    const tip = o.end === 'flat' ? null : [add(e, mul(u, o.tipLen == null ? 1 : o.tipLen))];
    return fillP(strip(P, W, { tip, k: 0.1 }), o.fill || K.paper, IL) + (o.fold ? line(P.slice(0, Math.max(2, n - 1)), 0.35) : '');
  }
  // wide sleeve hanging under a forearm el → wr (paper, ink-soaked lower edge)
  function drape(el, wr, depth, o) {
    o = o || {};
    const a = lerp(el, wr, 0.05), b = lerp(el, wr, 0.9), dn = norm(o.dir || [0.12, 1]);
    const lo = add(lerp(a, b, o.at == null ? 0.7 : o.at), mul(dn, depth)), lo2 = add(lerp(a, b, 0.2), mul(dn, depth * 0.55));
    return fillP(sm([a, b, add(b, mul(dn, depth * 0.5)), lo, lo2], true, 0.14), o.fill || K.paper, IL) + hem([lo2, lerp(lo2, lo, 0.5), lo], 1.1, mul(dn, -1), o.seed || 5);
  }
  // collar: ink 깃 band from the nape side of the neck down to the chest, paper 동정 strip along its upper part
  const collar = (a, b, c2) => T([a[0], a[1], b[0], b[1], c2[0], c2[1]], 1.6) + line([lerp(a, b, 0.15), lerp(a, b, 0.95)], 0.45, K.p50);

  // ---- 노을 noeul · 번개 무녀 · 백색 연쇄 (chainSpark) ------------------------------------------------------
  // keys: a folded paper 고깔 sitting on the crown, its tip folded BACK into a hook (brow, ears and face stay clear,
  // nothing hangs at the sides: the hood reading is designed out, brief §6.2 / team Q4); a floor-length bell coat
  // (16 → 35, hem y 12.5); a raised bell staff with ONE bunch of bells. Cyan: the chest band and its two front ends (T).
  function bells(c) {
    const L = [[-1, 0.4], [1, 0.3], [0, -1.2]].map((d) => add(c, d));
    return L.map((p) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="1.5" fill="${K.paper}" ${IL}/>`).join('') +
      L.map((p) => `<path d="M ${pt(add(p, [-0.6, 0.5]))} L ${pt(add(p, [0.6, 0.5]))}" stroke="${K.ink}" stroke-width="0.45"/>`).join('');
  }
  CHARS.noeul = {
    weapon: 'chainSpark', eye: [7.3, -30.3], face: 'lit', cyan: 'chest',
    rig: { idleLean: 0, runLean: 8, runLegL: [8.6, 8.4], stride: 0.75, squashK: 0.6 },
    draw(P) {
      const run = P.run, E = this.eye, lg = run ? P.lag : P.sway * 0.6;
      const world = run ? leg(P.hipF, P.ankF, { L: P.legL, w: 3.6, far: true, toe: P.toeF }) + leg(P.hipN, P.ankN, { L: P.legL, w: 3.8, toe: P.toeN })
        : leg(P.hipF, [-3.8, 12.6], { L: [8, 7.8], w: 3.6, far: true }) + leg(P.hipN, [4.8, 12.6], { L: [8, 7.8], w: 3.8 });
      let up = '';
      // bell coat (장옷): the hem is held on the ground in world space while the body leans
      const hb = toUp(P, [-17.6 - lg * 0.7 - (run ? 2.6 : 0), run ? 9.4 - lg * 0.5 : 11.6]);
      const h1 = toUp(P, [-8, 13]), h2 = toUp(P, [6, 13.2]), hf = toUp(P, [17.4 - (run ? 1.6 : 0) + lg * 0.2, 12]);
      const bm = lerp([-9.2, -15], hb, 0.5), fm = lerp([8.8, -15], hf, 0.5);
      up += fillP(sm([[-4.4, -25.2], [-7.6, -23.2], [-9.2, -15], bm, hb, h1, h2, hf, fm, [8.8, -15], [7.6, -23], [3, -25.6]], true, 0.1), K.paper);
      up += fillP(sm([[6.6, -20.6], [8.8, -15], fm, hf, lerp(h2, hf, 0.6), lerp([5.4, -10], lerp(h2, hf, 0.6), 0.5), [5.4, -10]], true, 0.1), K.p300);
      up += line([[-2.4, -8], lerp(h1, hb, 0.25)], 0.5) + line([[2.2, -6], lerp(h1, h2, 0.55)], 0.5);
      // the hem turns back on its ink lining (a designed black spot when it lifts)
      up += fillP(poly([hb, lerp(hb, h1, run ? 0.42 : 0.2), lerp(hb, bm, run ? 0.26 : 0.1)]), K.ink, IL);
      up += hem([hb, h1, h2, hf], 1.3, [0, -1], 13);
      // braid down the back to the waist (ink), a paper tie crossing it near the end
      const bt = [-8.4 - lg * 0.4, -10];
      up += fillP(strip([[-4.6, -29.6], [-6.4, -24], [-7.6, -17], bt], [3, 3, 2.6, 1.8], { tip: [add(bt, [-0.4, 1.8])] }), K.ink);
      up += line([add(lerp([-7.6, -17], bt, 0.5), [-1.9, -0.3]), add(lerp([-7.6, -17], bt, 0.5), [1.7, 0.3])], 0.6, K.p50);
      up += collar([1.6, -25.6], [3.6, -23.4], [5.4, -21]);
      // chest band (cyan) with its two straight front ends down to the knees: the T
      const e1 = toUp(P, [4.2 - lg * 0.3 - (run ? 1.2 : 0), 3.6]), e2 = toUp(P, [6.4 - lg * 0.4 - (run ? 1.6 : 0), 3]);
      up += ribbon([[4.4, -17], lerp([4.4, -17], e1, 0.5), e1], 1.6, 1.4, { end: 'fork' }) + ribbon([[6, -17], lerp([6, -17], e2, 0.5), e2], 1.6, 1.4, { end: 'fork' });
      up += ribbon([[-9, -17.4], [-3, -18.1], [2.6, -18.1], [9, -17.3]], 2.8, 2.8, { end: 'flat' });
      up += knot([5.2, -17.6], 1.3);
      // head: lit face, centre-parted hair over the ears
      const F = face({ eye: E, chin: -24.7, nose: [4.4, 0.7], chinX: -0.1, flick: 'up' });
      up += F.skin + F.marks;
      up += fillP('M 9.9,-33.6 C 9.7,-36.4 7,-38.2 3.2,-38.2 C -0.8,-38.2 -4.4,-36.2 -5,-32.6 C -5.4,-29.6 -4.6,-26.8 -3.2,-25.2 L -0.2,-25.8 C 0,-28 0.2,-30.4 1.2,-32 C 3.6,-33.2 6.8,-33.4 9.9,-33.2 Z', K.ink);
      const hk2 = run ? -P.flut * 0.4 : P.sway2 * 0.3;
      // the folded tip is a flap hanging BACK and down (a clear hook in silhouette), not a point;
      // the flap reaches back to x −8.6 so ≥ 2 u of ground stays open under it after the outline (review 1 F7, §13-10);
      // hat width 19.4 (≤ 20)
      // hurt: the hat rocks back −12° (brief §6.2) about its base
      up += tiltG(P, fillP(`M -5.6,-34.6 C -4.4,-37.8 -3.4,-40.6 -2,-43.4 C -4,-43.2 -6.4,-42.6 -8.6,${f(-41.6 + hk2)} C -6,-45 -2,-47 1.8,-46.4 C 5,-43.2 8.2,-39.8 10.8,-36.4 C 7,-34.8 1,-34 -5.6,-34.6 Z`, K.paper, IL) +
        fillP('M 1.8,-46.4 C 5,-43.2 8.2,-39.8 10.8,-36.4 C 9.4,-35.9 8.2,-35.6 7,-35.4 C 6,-38.8 4.2,-42.6 1.8,-46.4 Z', K.p300) +
        line([[1.8, -34.5], [-0.6, -42]], 0.5) + line([[6.2, -35.3], [2.2, -44.6]], 0.5) + line([[-2, -43.4], [1.4, -45.8]], 0.5) +
        ribbon([[-5.2, -35.2], [-0.6, -34.7], [4.4, -35.1], [10.6, -36.8]], 1.4, 1.3, { end: 'flat' }), [2.6, -35.2], 12 / 14);
      // raised near arm: the wide sleeve falls from the forearm; the staff carries ONE bunch of bells
      const sw = run ? P.flut * 0.6 : P.sway * 1.5, M = P.mode;
      const staffArm = (el, wr, top) => sleeve([[3.2, -22], el, wr], [4.4, 3.8, 3]) +
        fillP(`M ${pt(add(wr, [-0.6, 1.2]))} C ${pt(add(wr, [1, 3.2]))} ${pt(add(wr, [1.2, 5.4]))} ${pt(add(wr, [0.2, 7.4]))} C ${pt(add(wr, [-1, 8.4]))} ${pt(add(wr, [-3, 8.2]))} ${pt(add(el, [-0.8, 2.6]))} L ${pt(el)} Z`, K.paper, IL) +
        hem([add(el, [-0.8, 2.6]), add(wr, [-2, 8.3]), add(wr, [0.2, 7.4])], 1.1, [0, -1], 9) +
        line([add(wr, mul(norm(sub(wr, top)), 2)), top], 1.1) + bells(add(top, mul(norm(sub(top, wr)), 2.4))) + hand(add(wr, [0.5, -0.6]), Math.atan2(top[1] - wr[1], top[0] - wr[0]) * 180 / Math.PI);
      // the other hand forward with two fingers out (throw): a paper-shade sleeve in front of the chest
      const fingers = (wr) => sleeve([[-0.6, -22.4], [5, -18.8], wr], [3.8, 3.2, 2.6], { fill: K.p300 }) + hand(add(wr, [0.8, -0.2]), -6) +
        fillP(strip([add(wr, [2, -0.9]), add(wr, [4.6, -1.4])], [0.8, 0.6], { sharp: true }), K.paper, IL) + fillP(strip([add(wr, [2.1, 0.2]), add(wr, [4.4, 0.4])], [0.8, 0.6], { sharp: true }), K.paper, IL);
      if (P.thr) {
        // throw (instant white chain): draw — staff held high, two tremble strokes; wind — staff back, two fingers forward;
        // snap — a 3-segment zigzag thread (ink · cyan · glow) leaps forward from the fingertips; follow — broken thread
        if (M === 'draw') {
          up += staffArm([10, -22.6], [16.4, -32.2], [19, -46.4]);
          up += T([22.4, -49.8, 23.6, -48, 22.8, -46], 0.8) + T([24.6, -48.6, 25.8, -46.8, 25, -44.8], 0.7);
        } else {
          up += staffArm([-0.6, -17.6], [-4.2, -20.8], [-9.4, -37.6]);
          const fw = M === 'follow' ? [9.6, -17.2] : [11.2, -19.6];
          up += fingers(fw);
          // ends at x 39.6 before the 6° snap lean, so the leaned frame stays inside x ≤ 44 (brief §3)
          const Z = [add(fw, [5.2, -1.2]), [23.4, -26], [30.2, -15.6], [39.6, -21.2]];
          if (M === 'snap') up += thread(Z, 1.4);
          if (M === 'follow') up += thread(Z.slice(1), 1.2, '2.4 2');
        }
      } else {
        // the grip sits low on the staff, clear of the chin (staff (13.2, −21.6) → (15, −40), brief ±1.5)
        const el = run ? [9.2, -18] : [9.6, -18.4], wr = run ? [12.2, -21.8] : [12.6, -22.6];
        up += sleeve([[3.2, -22], el, wr], [4.4, 3.8, 3]);
        up += fillP(`M ${pt(add(wr, [-0.6, 1.2]))} C ${pt(add(wr, [1, 3.2]))} ${pt(add(wr, [1.2, 5.4]))} ${pt(add(wr, [0.2, 7.4]))} C ${pt(add(wr, [-1, 8.4]))} ${pt(add(wr, [-3, 8.2]))} ${pt(add(el, [-0.8, 2.6]))} L ${pt(el)} Z`, K.paper, IL);
        up += hem([add(el, [-0.8, 2.6]), add(wr, [-2, 8.3]), add(wr, [0.2, 7.4])], 1.1, [0, -1], 9);
        const top = [15 + sw * 0.5, -40];
        up += line([add(wr, [0.4, 1.8]), top], 1.1) + bells(add(top, [sw * 0.5, -2.2]));
        up += hand(add(wr, [0.5, -0.6]), -75);
      }
      return { world, up };
    }
  };

  // ---- 서리 seori · 서리 서생 · 서리침 (frostNeedles) -----------------------------------------------------
  // keys: a stepped 정자관 (three low steps, obtuse peaks, team Q5: stylized), a square cyan bundle on the back, a long
  // slim 도포 on the widest stride (feet (10, 12.5) · (−8, 12.5)), its split back skirt flying. Cyan: the bundle + strap.
  CHARS.seori = {
    weapon: 'frostNeedles', eye: [7.6, -31.2], face: 'lit', cyan: 'back',
    rig: { idleLean: 0, runLean: 10, runLegL: [9.6, 9.4], stride: 1.15 },
    draw(P) {
      const run = P.run, E = this.eye, lg = run ? P.lag : P.sway * 0.5;
      const world = run ? leg(P.hipF, P.ankF, { L: P.legL, w: 3.5, far: true, wrap: 'haengjeon', toe: P.toeF }) + leg(P.hipN, P.ankN, { L: P.legL, w: 3.7, wrap: 'haengjeon', toe: P.toeN })
        : leg(P.hipF, [-8, 12.6], { L: [8.2, 8], w: 3.5, far: true, wrap: 'haengjeon' }) + leg(P.hipN, skid(P, [10, 12.6]), { L: [8.2, 8], w: 3.7, wrap: 'haengjeon', toe: P.hurt ? -8 : 0 });
      let up = '';
      // bundle (cyan cloth box, allyD top face, two knot ears), behind the robe; bobs 1 px when running
      const bb = run ? (P.i % 4 < 2 ? -0.5 : 0.5) : 0;
      const Q = [[-15, -26.2 + bb], [-6.8, -27.6 + bb], [-6, -15.8 + bb], [-14.2, -14.6 + bb]];
      const ear = (t, dx) => { const b = lerp(Q[0], Q[1], t); return fillP(poly([add(b, [-0.9, 0.2]), add(b, [dx, -2.4]), add(b, [0.9, -0.1])]), K.ally, IL); };
      up += ear(0.38, -1) + ear(0.58, 1);
      up += fillP(poly(Q), K.ally, IL);
      up += fillP(poly([Q[0], Q[1], lerp(Q[1], Q[2], 0.16), lerp(Q[0], Q[3], 0.16)]), K.allyD);
      up += line([add(lerp(Q[3], Q[0], 0.08), [0.8, 0]), add(lerp(Q[3], Q[0], 0.8), [0.8, 0])], 0.5, K.allyG);
      // robe (도포): long and slim, split back skirt with its ink lining at the flying tip
      const flap = [-16.5 - lg * 0.6 - (run ? 2 : 0), 6 - (run ? 2.6 + lg * 0.4 : 0)], hb = [-10.6 - lg * 0.4, 7.8];
      up += fillP(sm([[-4.2, -25.4], [-7.2, -23.4], [-7.8, -14], [-8.4, -3.6], flap, [-12.4, 7.8], hb, [-3, 8.6], [5.6, 8.8], [9.2, 8.3], [8.8, -2], [8.2, -12], [8, -19], [6.8, -23.6], [2.8, -25.6]], true, 0.1), K.paper);
      up += fillP(sm([[6.2, -20.4], [8, -19], [8.2, -12], [8.8, -2], [9.2, 8.3], [6.8, 8.6], [6.2, -2], [5.8, -12]], true, 0.1), K.p300);
      up += line([[-7.6, -3.2], lerp([-12.4, 7.8], hb, 0.4)], 0.5) + fillP(poly([flap, add(flap, [3.2, 1.3]), add(flap, [2.4, -1.2])]), K.ink, IL);
      up += hem([[-12.4, 7.8], hb, [-3, 8.6], [5.6, 8.8], [9.2, 8.3]], 1.2, [0, -1], 17);
      // thin ink sash (세조대) with two short tassels
      up += fillP('M -8,-11 C -2,-10.4 4,-10.4 8.4,-10.9 L 8.4,-10 C 4,-9.5 -2,-9.5 -8,-10.1 Z', K.ink);
      up += line([[6.2, -10.2], [6.6, -6.6]], 0.6) + line([[7.3, -10.2], [7.9, -7]], 0.6) + `<circle cx="6.8" cy="-10.4" r="0.9" fill="${K.ink}"/>`;
      up += collar([2.2, -25.6], [4.4, -22.6], [6.4, -19.8]);
      // strap (cyan) from the bundle over the shoulder to the chest knot (6, −18)
      up += ribbon([add(Q[1], [0.2, 1]), [-2, -25.4], [2.4, -23.4], [5.6, -19.2]], 1.3, 1.2, { end: 'flat' }) + knot([6, -18.4], 1.05);
      // head: long lit face, short hair under the hat
      const F = face({ eye: E, chin: -24.2, nose: [4.8, 1.3], chinX: 0.2, mouth: 3.7 });
      up += F.skin + F.marks;
      up += fillP('M 9.2,-35 L -5,-34.8 C -5.4,-32.4 -4.8,-30 -3.4,-28.2 C -2.4,-27 -1,-26.6 0.6,-26.8 L 1.6,-28.6 C 1.6,-30.4 2,-32 2.8,-33.2 C 5,-33.8 7.4,-33.8 9.2,-33.6 Z', K.ink);
      const tl = run ? -P.flut * 0.5 : P.hurt ? P.tilt : 0;
      up += `<g transform="rotate(${f(tl)} 2 -35)">` + fillP('M -5,-34.8 L -4.4,-38.2 L -2.8,-38.4 L -2.6,-41.6 L -1,-41.9 L -0.8,-44.6 L 2.2,-45.4 L 5,-44.6 L 5.2,-41.9 L 7,-41.6 L 7.2,-38.6 L 8.8,-38.4 L 9.4,-35.2 Z', K.ink) +
        fillP('M 2.2,-45.4 L 5,-44.6 L 5.2,-41.9 L 7,-41.6 L 7.2,-38.6 L 8.8,-38.4 L 9.4,-35.2 L 6.6,-35.2 L 6.2,-38 L 4.4,-38.4 L 4.2,-41.4 L 2.8,-41.8 Z', K.ink7) +
        line([[-5, -35.4], [9.4, -35.9]], 0.6, K.p50) + '</g>';  // rim stroke runs to the fill edge at both ends (F8)
      // near arm with the small brush (a = brush angle from the hand, deg)
      const brushArm = (el, wr, a) => {
        const hp = add(wr, mul(norm(sub(wr, el)), 1)), u = [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)];
        const b0 = sub(hp, mul(u, 0.8)), b1 = add(hp, mul(u, 8.9));
        return sleeve([[2.8, -21.6], el, wr], [4.2, 3.6, 3]) + drape(el, wr, 3.6, { at: 0.75, seed: 21 }) +
          line([b0, lerp(b0, b1, 0.78)], 0.9) + T([...lerp(b0, b1, 0.7), ...lerp(b0, b1, 0.85), ...b1], 1.8, 'start') + hand(hp, a + 10);
      };
      if (P.thr) {
        // throw (two frost needles): draw — brush before the chin, two needles in the fingers; wind — wrist cocked back;
        // snap — the brush flicks and two needles fly side by side (±4°) with short frost tails; follow — arm across the body
        const M = P.mode;
        if (M === 'draw') up += brushArm([7, -17], [13.4, -21], -30) + frostNeedle([18.2, -19.6], 8, 5.6, true) + frostNeedle([18, -22.2], -4, 5.6, true);
        else if (M === 'wind') up += brushArm([4, -15.6], [5, -19.4], -165) + frostNeedle([0.6, -18.6], -172, 5.6, true) + frostNeedle([0.8, -20.8], 178, 5.6, true);
        else if (M === 'snap') up += brushArm([8.6, -17.6], [14.6, -16.4], -20) + frostNeedle(polar([17, -17.6], 14, -4), -4, 6.4) + frostNeedle(polar([17, -15.2], 14.4, 4), 4, 6.4);
        else up += brushArm([4.6, -14.8], [0.2, -11.6], 160);
      } else {
        // flicked in idle; hurt holds the idle arm
        const fk = run ? -8 : P.hurt ? -6 : Math.sin(P.ph) * 6;
        const sh = [2.8, -21.6], el = run ? [5.4, -15.4] : [5.8, -14.8], wr = run ? [9.8, -12] : [10.6, -11.6];
        up += sleeve([sh, el, wr], [4.2, 3.6, 3]) + drape(el, wr, 3.6, { at: 0.75, seed: 21 });
        const hp = add(wr, [1, 0.5]), b0 = rot(add(hp, [-0.4, 0.6]), fk, hp), b1 = rot(add(hp, [4, -8]), fk, hp);
        up += line([b0, lerp(b0, b1, 0.78)], 0.9) + T([...lerp(b0, b1, 0.7), ...lerp(b0, b1, 0.85), ...b1], 1.8, 'start');
        up += hand(hp, -60);
      }
      return { world, up };
    }
  };

  // ---- 독 dok · 먹단지 장수 · 먹단지 (inkPots) ----------------------------------------------------------
  // keys: an A-frame (지게) taller than the head with three stacked white porcelain jars; a wide stocky body with the
  // belly forward to x 15.5; legs set wide, a small jar in hand. Jars are paper with ink lids (never black, never a
  // fuse). Cyan: a cord round each jar's neck + the shoulder part of the straps (pack).
  function jar(c, r, o) {
    o = o || {};
    const [x, y] = c;
    // body with shoulders, a short neck and a broad ink lid that steps the stack's silhouette (jars, not a snowman)
    let s = fillP(`M ${pt([x - 0.44 * r, y - 0.62 * r])} C ${pt([x - 1.18 * r, y - 0.5 * r])} ${pt([x - 1.12 * r, y + 0.86 * r])} ${pt([x, y + 0.9 * r])} C ${pt([x + 1.12 * r, y + 0.86 * r])} ${pt([x + 1.18 * r, y - 0.5 * r])} ${pt([x + 0.44 * r, y - 0.62 * r])} Z`, K.paper, IL);
    s += fillP(`M ${pt([x + 0.62 * r, y - 0.42 * r])} C ${pt([x + 1.06 * r, y - 0.04 * r])} ${pt([x + 0.96 * r, y + 0.7 * r])} ${pt([x + 0.1 * r, y + 0.86 * r])} C ${pt([x + 0.62 * r, y + 0.5 * r])} ${pt([x + 0.78 * r, y])} ${pt([x + 0.62 * r, y - 0.42 * r])} Z`, K.p300);
    s += fillP(poly([[x - 0.4 * r, y - 0.84 * r], [x + 0.4 * r, y - 0.84 * r], [x + 0.44 * r, y - 0.6 * r], [x - 0.44 * r, y - 0.6 * r]]), K.paper, IL);
    s += fillP(poly([[x - 0.64 * r, y - 0.8 * r], [x - 0.5 * r, y - r], [x + 0.5 * r, y - r], [x + 0.64 * r, y - 0.8 * r]]), K.ink);
    // one ink run from the lid down the shoulder
    s += T([x + 0.26 * r, y - 0.82 * r, x + 0.36 * r, y - 0.52 * r, x + 0.3 * r, y - 0.18 * r], Math.max(0.6, 0.12 * r), 'start');
    if (o.cord !== false) {
      const cw = Math.max(1.2, 0.3 * r);
      s += ribbon([[x - 0.48 * r, y - 0.72 * r], [x, y - 0.68 * r], [x + 0.48 * r, y - 0.72 * r]], cw, cw, { end: 'flat' });
      s += ribbon([[x - 0.42 * r, y - 0.7 * r], [x - 0.7 * r, y - 0.42 * r], [x - 0.8 * r, y - 0.08 * r]], Math.max(1, 0.18 * r), 0.8, { tipLen: 0.7 });
    }
    return s;
  }
  CHARS.dok = {
    weapon: 'inkPots', eye: [8.4, -29.8], face: 'lit', cyan: 'pack',
    rig: { idleLean: 0, runLean: 8, runLegL: [8.8, 8.6], stride: 0.9, bobK: 1.33, idleBobK: 1.5 },
    draw(P) {
      // jars rattle: run alternates them, hurt shakes them hard against each other (brief §6.4)
      const run = P.run, E = this.eye, w = run ? P.flut : P.hurt ? [1.6, -1.2, 0.6][P.i] : P.sway;
      const hN = add(P.hipN, [0.8, 0]), hF = add(P.hipF, [-0.8, 0]);
      const world = run ? leg(hF, P.ankF, { L: P.legL, w: 4.6, far: true, wrap: 'ink', toe: P.toeF }) + leg(hN, P.ankN, { L: P.legL, w: 4.9, wrap: 'ink', toe: P.toeN })
        : leg(hF, [-7.2, 12.6], { knee: [-5.8, 6.2 + P.bob * 0.5], w: 4.6, far: true, wrap: 'ink' }) + leg(hN, skid(P, [9, 12.6]), { knee: [6.6, 6 + P.bob * 0.5], w: 4.9, wrap: 'ink', toe: P.hurt ? -8 : 0 });
      let up = '';
      // A-frame: ink posts and crossbars (y −6, −24); three jars rattle against each other
      up += line([[-16, 6], [-14, -42]], 1.7) + line([[-15.4, -6], [-8.6, -6]], 1.4) + line([[-14.8, -24], [-8, -24]], 1.4);
      // the middle jar sits 1 u back so the stack zigzags instead of stacking like a snowman (R4)
      up += jar([-14.6 + w * 0.4, -14], 7.6) + jar([-13.6 - w * 0.6, -29], 6.2) + jar([-11 + w, -39.4], 4.4);
      up += line([[-9, 8], [-7.5, -44]], 1.7);
      // body: wide jacket, belly forward, ink 전대, soaked hem
      const hb = [-10 - (run ? P.lag * 0.3 : 0), 2.6];
      up += fillP(sm([[-4.2, -25.4], [-8.6, -23], [-9.8, -14], [-9.9, -4], hb, [0, 3.4], [11.2, 2.4], [14.4, -1.6], [15.5, -8], [14.2, -14.4], [10.6, -20.2], [8, -23.6], [3.8, -25.8]], true, 0.12), K.paper);
      up += fillP(sm([[12.6, -15], [15.3, -8.4], [14.2, -2], [11.2, 1.8], [12.6, -4], [13.2, -9.6]], true, 0.14), K.p300);
      up += fillP('M -9.9,-7.4 C -2,-6.8 6,-6.6 15.4,-7.2 L 15.2,-5.2 C 6,-4.6 -2,-4.8 -9.9,-5.4 Z', K.ink);
      up += hem([hb, [0, 3.4], [11.2, 2.4]], 1.2, [0, -1], 19);
      up += collar([2.6, -25.6], [5, -23], [7, -20.4]);
      // straps: only the shoulder part shows, ending above the chest (not down the front like 노을's T)
      up += ribbon([[-8, -21.6], [-4, -25.2], [1.2, -26], [5.6, -23.8], [8, -20.2]], 3.4, 2.8, { end: 'flat' });
      // head: low, paper towel tied round it, two short ends sticking out
      const F = face({ eye: E, chin: -24.3, nose: [5.1, 1.3], chinX: 0.7, jawX: 0.8, jawY: 0.6, brow: { y0: -2.4, y1: -2.4, w: 1.2 } });
      up += F.skin + F.marks;
      up += fillP('M 10.6,-34.4 C 10.2,-36.6 7.8,-38 3.8,-38 C 0,-38 -3.2,-36.2 -3.8,-33 C -4.2,-30.6 -3.4,-27.8 -2,-26.4 L 1.8,-26.8 C 1.6,-28.8 2,-31 3,-32.6 L 10.6,-33.6 Z', K.ink);
      // towel band sits above the brow with ≥ 1 px of forehead between them
      const tw = run ? P.flut * 0.4 : P.sway * 0.3;
      up += cloth([[-3.8, -35.2], [-6, -36.6 + tw], [-7.6, -38.2 + tw]], 1.8, 0.9, { tipLen: 0.8 }) + cloth([[-3.8, -34.8], [-6.2, -33.8 - tw], [-7.8, -32.8 - tw]], 1.8, 0.9, { tipLen: 0.8 });
      up += cloth([[10.8, -35.2], [7, -35.8], [3, -36], [-1, -35.5], [-3.8, -35]], 2.4, 2.2, { end: 'flat', fold: true });
      up += `<circle cx="-3.9" cy="-35.1" r="1.4" fill="${K.paper}" ${IL}/>`;
      const sh = [3.8, -21.6];
      if (P.thr) {
        // throw (lobbed jar, bursts 0.55 s later where it lands): draw — the jar back over the shoulder; wind — high behind
        // the head (y ≥ −56); snap — the arm swings forward-up and the jar leaves on a short rising arc; follow — arm down.
        // No fuse, spark or flame on the jar (bomber marks, brief §6.4); the A-frame keeps its three jars.
        const M = P.mode;
        if (M === 'draw') up += sleeve([sh, [2.6, -15.4], [-3.2, -17.4]], [4.8, 4, 3.3]) + jar([-5.2, -21.8], 3.8, { cord: false }) + hand([-4.2, -18], -110);
        else if (M === 'wind') up += sleeve([sh, [-1.2, -27], [-2.4, -36.4]], [4.8, 4, 3.3]) + jar([-3, -41.2], 3.8, { cord: false }) + hand([-2.6, -37.6], -100);
        else if (M === 'snap') {
          up += sleeve([sh, [10, -22.4], [16.2, -24.4]], [4.8, 4, 3.3]) + hand([17.6, -24.8], -20);
          up += T([18.4, -27.4, 20.4, -31.6, 22.6, -33.6], 1, 'end') + T([20.4, -24.6, 23.6, -27.8, 26.4, -29.2], 0.9, 'end') + jar([25.2, -34.6], 3.8, { cord: false });
        } else up += sleeve([sh, [9, -15.8], [15, -10.6]], [4.8, 4, 3.3]) + hand([16.2, -9.8], 40);
      } else {
        // near arm: the small jar hangs from the hand by its neck
        const el = run ? [7.4 + P.swing, -15.4] : [8, -15.2], wr = run ? [12.8 + P.swing, -12.6] : [13.4, -12.2];
        up += sleeve([sh, el, wr], [4.8, 4, 3.3]);
        up += jar(add(wr, [2.2, 4.6 + (run ? Math.abs(P.flut) * 0.3 : 0)]), 3.8, { cord: false });
        up += hand(add(wr, [1.2, 0.2]), 70);
      }
      return { world, up };
    }
  };

  // ---- 휘 hwi · 붓춤꾼 · 넓은 붓 (wideBrush) ------------------------------------------------------------
  // keys: the big brush slanting across the body (≥ 50°: butt (18, 6), end (−15, −41)) with a paper ferrule, a pointed
  // ink head (tip (−23.6, −49)) and a drop; the mane swept back into brush-tip ends; a thick dance robe flaring back to
  // (−21, 9), low wide stance (the defence perk, team Q8). Cyan: 한삼 from both wrists (hands · arms).
  function bigBrush(deg, piv) {
    return brushDraw(rot([18, 6], deg, piv), rot([-15, -41], deg, piv), rot([-23.6, -49], deg, piv));
  }
  // the same brush placed by its grip: shaft direction deg (butt → ferrule), ferrule `toEnd` ahead of the hand, butt
  // `toButt` behind it (57.5 in all), the hair bent 12° as in the carried brush
  function brushGrip(hand, deg, toEnd) {
    const u = [Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180)], Es = add(hand, mul(u, toEnd));
    return brushDraw(sub(hand, mul(u, 57.5 - toEnd)), Es, polar(Es, 11.75, deg - 12));
  }
  function brushDraw(A, Es, tip) {
    const u = norm(sub(Es, A)), m = perp(u);
    let s = line([A, Es], 2.2);
    const f0 = sub(Es, mul(u, 0.4)), f1 = add(Es, mul(u, 1.8));
    s += fillP(poly([add(f0, mul(m, 1.7)), add(f1, mul(m, 1.6)), sub(f1, mul(m, 1.6)), sub(f0, mul(m, 1.7))]), K.paper, IL);
    const v = norm(sub(tip, f1)), n2 = perp(v), Lb = Math.hypot(tip[0] - f1[0], tip[1] - f1[1]), sg = shadeSign(n2);
    const prof = [[0, 3.2], [0.22, 5.6], [0.42, 6], [0.66, 4.2], [0.86, 1.8]];
    const Lp = prof.map(([t, wd]) => add(add(f1, mul(v, Lb * t)), mul(n2, wd / 2))), Rp = prof.map(([t, wd]) => sub(add(f1, mul(v, Lb * t)), mul(n2, wd / 2)));
    s += fillP(sm(Lp.concat([tip], Rp.reverse()), true, 0.12), K.ink);
    // a paper split in the hair, running out of the ferrule (not a floating mark)
    s += line([add(f1, mul(n2, -sg * 1.2)), add(add(f1, mul(v, Lb * 0.6)), mul(n2, -sg * 0.9))], 0.4, K.p50);
    const dp = add(add(f1, mul(v, Lb * 0.45)), mul(n2, sg * 4.4));
    s += fillP(`M ${pt(add(dp, [0, -1.4]))} C ${pt(add(dp, [0.8, -0.2]))} ${pt(add(dp, [0.8, 0.9]))} ${pt(add(dp, [0, 0.9]))} C ${pt(add(dp, [-0.8, 0.9]))} ${pt(add(dp, [-0.8, -0.2]))} ${pt(add(dp, [0, -1.4]))} Z`, K.ink);
    return s;
  }
  CHARS.hwi = {
    weapon: 'wideBrush', eye: [7.7, -30.7], face: 'lit', cyan: 'arms',
    rig: { idleLean: 2, runLean: 10, runLegL: [9.2, 9], stride: 1 },
    draw(P) {
      const run = P.run, E = this.eye, lg = run ? P.lag : P.sway * 0.6;
      const world = run ? leg(P.hipF, P.ankF, { L: P.legL, w: 4, fill: K.ink, toe: P.toeF }) + leg(P.hipN, P.ankN, { L: P.legL, w: 4.2, fill: K.ink7, toe: P.toeN })
        : leg(P.hipF, [-7.6, 12.6], { knee: [-6.4, 6.2 + P.bob * 0.5], w: 4, fill: K.ink }) + leg(P.hipN, skid(P, [8.6, 12.6]), { knee: [7.4, 5.6 + P.bob * 0.5], w: 4.2, fill: K.ink7, toe: P.hurt ? -8 : 0 });
      let up = '';
      // far arm thrown back in the dance; its 한삼 trails
      const fs = [-3, -22], fe = run ? [-7.2 + P.swing * 1.6, -17.6] : [-7.6, -17.6], fw = run ? [-11 + P.swing * 2.4, -14.6] : [-11.6, -14.2];
      up += sleeve([fs, fe, fw], [4, 3.4, 2.8], { fill: K.p300 });
      up += ribbon([add(fw, [-0.6, 0.6]), add(fw, [-2.2, 4.2 + lg * 0.3]), add(fw, [-3.8, 7.8 - lg * 0.3]), add(fw, [-5.4 - (run ? 2 : 0), 11 + lg * 0.4 - (run ? 2 : 0)])], 3.6, 3, { end: 'fork' });
      // thick dance robe (장삼) flaring back, ink lining where it turns, belt, soaked hem
      const hb = [-21 - lg * 0.8 - (run ? 1.6 : 0), 9 - (run ? 1.6 + lg * 0.4 : 0)];
      up += fillP(sm([[-4.2, -25.2], [-8, -23], [-9.6, -14], [-12, -4], [-16.4, 3.6], hb, [-13, 9.8], [-4, 9.6], [9.6, 8.8], [10.4, 0], [9.2, -10], [8.4, -18], [7.4, -23.4], [3.4, -25.6]], true, 0.12), K.paper);
      up += fillP(sm([[6, -21], [8.4, -18], [9.2, -10], [10.4, 0], [9.6, 8.8], [6.8, 9.2], [6.8, 0], [6.2, -10]], true, 0.1), K.p300);
      up += line([[-6.6, -6], lerp(hb, [-13, 9.8], 0.4)], 0.5) + line([[-3, -4], [-6, 9.4]], 0.5);
      up += fillP(poly([hb, add(hb, [3.6, 0.5]), add(hb, [2.4, -2])]), K.ink, IL);
      up += hem([hb, [-13, 9.8], [-4, 9.6], [9.6, 8.8]], 1.1, [0, -1], 23);
      up += fillP('M -9.8,-10.2 C -3,-9.6 4,-9.6 9.4,-10.2 L 9.6,-8.8 C 4,-8.2 -3,-8.2 -10,-8.8 Z', K.ink);
      up += collar([2.4, -25.6], [4.6, -22.8], [6.6, -20]);
      // the big brush across the body, its tip swaying ±1.5; running, it tilts back 10° so lean + bob + squash keep its tip
      // under the y −52 prop limit; hurt knocks it back. Throw re-grips it (below, after the head)
      const T4 = P.thr ? {
        // draw — brush raised behind the head; wind — body twisted, hair down and back; snap — swept level forward (tip
        // x ≤ 44, y ≈ −14) with a short straight ink stroke ahead; follow — forward and down, the 한삼 wraps forward
        // (draw: the elbow goes behind the head and the shaft clears the forehead, so nothing crosses the face)
        draw: { hand: [-1.6, -39.6], deg: 195, end: 24, el: [-4, -28], wr: [-2, -37.4], hs: [[0, 0], [-1.6, 3.4], [-2.8, 6.8], [-3.4, 10.2]] },
        wind: { hand: [4, -16], deg: 165, end: 24, el: [7.4, -18], wr: [5, -15.4], hs: [[0, 0], [0.4, 3.6], [0.2, 7.2], [-0.4, 10.6]] },
        // (snap: drawn 3 u high so the 8° lean brings the tip to y ≈ −14 at x ≈ 42)
        snap: { hand: [10.4, -17], deg: 0, end: 18, el: [6.6, -19.6], wr: [9.2, -17.4], hs: [[0, 0], [-3.4, 1.6], [-6.8, 2.4], [-10, 2]] },
        follow: { hand: [9, -11], deg: 30, end: 20, el: [6.4, -15.6], wr: [8.2, -11.6], hs: [[0, 0], [3, 1], [5.6, 3.2], [7, 6.4]] }
      }[P.mode] : null;
      if (!T4) up += bigBrush(run ? -10 + P.flut * 0.4 : P.hurt ? P.tilt * 0.6 : P.sway * 1.7, [8.2, -7.9]);
      // head: mane swept back into brush-tip ends, drawn over the shaft
      const F = face({ eye: E, chin: -24.5, nose: [5, 1.2], chinX: 0.4, jawX: 0.2, brow: { y0: -2.9, y1: -2.3, w: 1 } });
      up += F.skin + F.marks;
      const mw = run ? P.flut * 0.8 : P.sway * 0.6, mr = run ? 1.4 : 0;
      // hairline high enough to leave paper above the 1 px brow (brow · eye · forehead each ≥ 1 px apart)
      up += fillP(`M 9.8,-35.2 C 9.6,-37 6.8,-38.6 2.6,-38.4 C -1.4,-38.2 -5.6,-37.4 -9.6,-36.6 L ${f(-19 - mr)},${f(-35.8 + mw)} L -13.4,-34.2 L ${f(-18.2 - mr)},${f(-32.2 + mw * 0.8)} L -12.2,-31.4 L ${f(-16.6 - mr)},${f(-28.8 + mw * 0.6 + mr * 0.6)} C -12,-28.6 -6.8,-27.6 -3.2,-26.6 L 0.6,-27.4 C 0.8,-30 1.4,-32.2 2.6,-33.6 C 5.4,-34.6 7.6,-34.8 9.8,-34.6 Z`, K.ink);
      if (T4) {
        // throw: the re-gripped brush in front of the head, the near arm and its 한삼 following the swing
        up += brushGrip(T4.hand, T4.deg, T4.end);
        up += sleeve([[3, -21.8], T4.el, T4.wr], [4.4, 3.8, 3.1]);
        up += ribbon(T4.hs.map((d) => add(T4.wr, d)), 3.6, 3, { end: 'fork' }) + hand(T4.hand, T4.deg - 60);
        // the short straight ink stroke ahead of the tip (≤ 8 long, 3 thick), inside x ≤ 44 after the 6° lean
        if (P.mode === 'snap') up += T([35.6, -17.4, 38.8, -17.6, 42, -17.4], 3);
      } else {
        // near arm grips the shaft low in front; its 한삼 hangs from the wrist
        const sh = [3, -21.8], el = [5.4, -14.4], wr = [7.3, -9.4];
        up += sleeve([sh, el, wr], [4.4, 3.8, 3.1]) + drape(el, wr, 3.8, { dir: [0.4, 1], at: 0.8, seed: 27 });
        // the near 한삼 hangs against the robe (x ≤ 9) so the triangle between shaft, hand and robe stays open (R2)
        up += ribbon([[8.2, -7.2], [8.4, -3.8], [8.2 + lg * 0.2, -0.4], [7.8 + lg * 0.3 - (run ? 1 : 0), 3]], 3.6, 3, { end: 'fork' });
        up += hand([8.2, -7.9], -55);
      }
      return { world, up };
    }
  };

  // ---- 령 ryeong · 혼령 사수 · 혼령 일제사격 (ghostVolley) ------------------------------------------------
  // keys: the big D-shaped horn bow in front (grip (21, −16), limbs to x 15, forward-curled ears, ≥ 3 px clear of the
  // body), a high ponytail swept back, an ink quiver with three cyan spirit fletchings over the shoulder. A-type face:
  // the fringe and its shadow hide the near eye but its glint. Cyan: the fletchings + the bow-arm guard (shoulder).
  // the horn bow; pull = the string drawn to that point, twang = the string shivering just after the release
  function hornBow(grip, tilt, pull, twang) {
    const B = [[16.2, -41.6], [15, -38.6], [17.4, -31], [20.2, -22.4], [21, -16], [20.2, -9.6], [17.4, -1], [15, 6.6], [16.2, 9.6]].map((p) => add(rot(p, tilt, [21, -16]), sub(grip, [21, -16])));
    const W = [0.7, 1.4, 1.8, 2, 2.2, 2, 1.8, 1.4, 0.7], s0 = lerp(B[0], B[1], 0.7), s1 = lerp(B[8], B[7], 0.7), mid = lerp(s0, s1, 0.5);
    const str = pull ? line([s0, pull, s1], 0.7, K.p300) : twang ? line([s0, add(mid, [-1, 0]), s1], 0.6, K.p300) + line([s0, add(mid, [0.8, 0]), s1], 0.5, K.p300) : line([s0, s1], 0.7, K.p300);
    return str + fillP(strip(B, W, { k: 0.12 }), K.ink);
  }
  // spirit arrow: ink shaft and head, a cyan flame fletching at the nock (sandwich)
  function spiritArrow(a, b) {
    const u = norm(sub(b, a)), n = perp(u);
    return line([add(a, mul(u, 2)), sub(b, mul(u, 1.6))], 0.8) + fillP(poly([b, add(sub(b, mul(u, 2.4)), mul(n, 1.1)), sub(sub(b, mul(u, 2.4)), mul(n, 1.1))]), K.ink) +
      ribbon([add(a, mul(u, 3.6)), add(a, mul(u, 1.8)), sub(a, mul(u, 0.2))], 2.2, 1, { tipLen: 1.2 });
  }
  CHARS.ryeong = {
    weapon: 'ghostVolley', eye: [7.4, -30.8], face: 'shade', cyan: 'shoulder',
    rig: { idleLean: 0, runLean: 11, runLegL: [9.4, 9.2], stride: 1.05 },
    draw(P) {
      const run = P.run, E = this.eye, lg = run ? P.lag : P.sway * 0.4;
      const world = run ? leg(P.hipF, P.ankF, { L: P.legL, w: 3.4, far: true, wrap: 'boot', toe: P.toeF }) + leg(P.hipN, P.ankN, { L: P.legL, w: 3.6, wrap: 'boot', toe: P.toeN })
        : leg(P.hipF, [-4.2, 12.6], { L: [8.4, 8.2], w: 3.4, far: true, wrap: 'boot' }) + leg(P.hipN, skid(P, [5.8, 12.6]), { L: [8.4, 8.2], w: 3.6, wrap: 'boot', toe: P.hurt ? -8 : 0 });
      let up = '';
      // ponytail tied high, swept back (level when running), slim so it stays apart from the quiver; the paper tie
      // crosses it clear of the head. Hurt flings it forward over the crown (brief §6.6)
      const pw = run ? P.flut * 0.6 : P.sway * 0.8, hf = P.hurt ? [1, 0.7, 0.3][P.i] : 0;
      const PT = run ? [[-1.6, -37.4], [-7.6, -36.8], [-14, -35.4 + pw * 0.5], [-20.4, -33 + pw]]
        : P.hurt ? [[-1.6, -37.4], [-4.6 + 3 * (1 - hf), -40.6], [1 - 9 * (1 - hf), -43.4 + 6 * (1 - hf)], [8.6 - 22 * (1 - hf), -42.4 + 14 * (1 - hf)]]
          : [[-1.6, -37.4], [-8.4, -35.8], [-15.6, -31 + pw * 0.4], [-17.6, -22.6 + pw]];
      up += fillP(strip(PT, [2.8, 2.6, 1.8, 0.8], { tip: [add(PT[3], mul(norm(sub(PT[3], PT[2])), 1.4))] }), K.ink);
      // the paper tie: left out while hurt, when the tail flies over the crown and the tie would end inside the black
      // head mass as a stray white slit (review 2, B4)
      if (!P.hurt) {
        const tp = lerp(PT[0], PT[1], 0.66), tn = perp(norm(sub(PT[1], PT[0])));
        up += line([add(tp, mul(tn, 2)), sub(tp, mul(tn, 2))], 0.8, K.p50);
      }
      // quiver (ink) tucked behind the back; three spirit fletchings (cyan flames) rise over the shoulder
      const qw = run ? P.flut * 0.5 : 0;
      // quiver kept narrow (2.6) so the ink stays ≤ 40 % — the face shadow is never trimmed for area (review 1, F1)
      up += fillP(strip([[-10 + qw, -9.6], [-7.6, -25]], [2.6, 2.6], { sharp: true }), K.ink) + line([[-8.9, -25.3], [-6.3, -24.7]], 0.6, K.p300);
      const fl = (k) => (run ? Math.sin(P.ph * 2 + k) : Math.sin(P.ph + k * 2.1)) * 0.9;
      up += ribbon([[-9, -25.6], [-10.2, -29.4], [-10.6, -33.4], [-11.8, -36.8 + fl(0)]], 3, 1.2, { tipLen: 1.6 });
      up += ribbon([[-7.6, -26], [-8, -30.4], [-7.8, -34.6], [-8.6, -38.6 + fl(1)]], 3.2, 1.2, { tipLen: 1.6 });
      up += ribbon([[-6.2, -25.6], [-5.6, -29.6], [-5.2, -33.2], [-5.8, -36.4 + fl(2)]], 2.8, 1.1, { tipLen: 1.5 });
      // thigh-length archery coat, belt, soaked hem
      const hb = [-10.8 - lg * 0.5, 5.6];
      up += fillP(sm([[-4.4, -25.2], [-7.8, -23], [-8.6, -14], [-9.4, -4], hb, [0, 6.6], [8.6, 5.8], [8.8, -4], [8.4, -14], [8, -20], [6.6, -23.8], [2.8, -25.6]], true, 0.12), K.paper);
      up += fillP(sm([[5.8, -21.4], [8, -20], [8.4, -14], [8.8, -4], [8.6, 5.8], [6, 6.2], [6, -4], [5.6, -14]], true, 0.1), K.p300);
      up += fillP('M -8.8,-10 C -2,-9.4 4,-9.4 8.6,-10 L 8.7,-8.7 C 4,-8.1 -2,-8.1 -8.9,-8.7 Z', K.ink);
      up += hem([hb, [0, 6.6], [8.6, 5.8]], 1.1, [0, -1], 29) + collar([2.4, -25.6], [4.4, -23], [6.2, -20.6]);
      // head (A-type): fringe and its cast shadow over the near eye, one 2×2 paper glint inside
      const F = face({ eye: E, chin: -24.6, nose: [4.8, 1.2], chinX: 0.2, shade: true });
      up += F.skin + F.marks;
      // throw (four-arrow fan, piercing): draw — bow upright, a spirit arrow nocked; wind — full draw, the string hand under
      // the jaw beside the cheek (never over the face); snap — release: four cyan lines fan out ±12°, the string shivers;
      // follow — bow arm held out. The string hand is the far arm (review 2, B3): in wind only its forearm shows, ONE
      // stroke coming out from under the hair at the back of the neck (upper arm hidden behind the body, no folded
      // sleeve on the chest); after the release (snap · follow) the string hand drops behind the body and is not drawn
      const M = P.thr ? P.mode : null;
      const pullAt = { draw: [15.6, -17.2], wind: [6.4, -20.6] }[M];
      if (M === 'wind') up += sleeve([[-1.8, -26.6], [5.8, -20.6]], [3, 2.5], { fill: K.p300 });
      up += fillP('M 10.4,-33.4 C 10,-36.2 7.4,-38 3.4,-38 C -0.6,-38 -3.8,-36 -4.4,-32.8 C -4.8,-30.4 -4,-27.6 -2.6,-26.4 L 0.4,-27 C 0.6,-28.6 0.8,-30 1.4,-31.4 L 3,-33.6 L 4.4,-32.2 L 5.8,-34 L 7.2,-32.8 L 8.6,-34.4 L 10.4,-33.4 Z', K.ink);
      if (M === 'draw') up += sleeve([[-1, -22.6], [6, -17.4], [15, -17.2]], [3.6, 3, 2.5], { fill: K.p300 }) + hand([15.6, -17.2], 0);
      // bow arm with its cyan guard, the bow in front, the hand on the grip
      const grip = run ? [17.6, -12.6] : [21, -16];
      const sh = [4.4, -21.8], el = run ? [10.4, -17.2] : [12, -19.6], wr = add(grip, [-1.6, 0.6]);
      up += sleeve([sh, el, wr], [4, 3.3, 2.7]);
      up += ribbon([lerp(el, wr, 0.15), lerp(el, wr, 0.5), lerp(el, wr, 0.86)], 3.4, 3.2, { end: 'flat' });
      // wind: the string hand sits over the join of its forearm and the bow-arm shoulder, so no two sleeve edges cross there
      if (M === 'wind') up += hand([6.4, -20.6], 0);
      up += hornBow(grip, run ? 20 : 0, pullAt, M === 'snap');
      if (M === 'draw') up += spiritArrow([15.6, -17.2], [28, -17.2]);
      if (M === 'wind') up += spiritArrow([6.4, -20.6], [29.4, -18]);
      // four lines end at x 39.6 before the 6° snap lean, so the leaned frame stays inside x ≤ 44
      if (M === 'snap') [-12, -4, 4, 12].forEach((a) => { up += thread([polar([22.6, -17.6], 2, a), polar([22.6, -17.6], 17 / Math.cos(a * Math.PI / 180), a)], 1); });
      up += hand(add(grip, [0.2, 0.2]), -90);
      return { world, up };
    }
  };

  // ---- 월 wol · 일식 무희 · 일식 테 (eclipseHalo) --------------------------------------------------------
  // keys: a hollow ring round the waist (centre (0, −11), rx 21, ry 6.5; back half behind the body, front half in front;
  // paper 1.8 on ink 3.6) with an ink crescent on the back-right quarter, the eclipse, travelling once round in idle; a
  // floor-length bell skirt (hem 32); a bun high at the back crossed by a long pin. Never a black disc (5th-chapter eye)
  // and never behind the head (the director's halo). Cyan: two ribbons from the ring's left (waist ring) + small 댕기.
  const ellPt = (c, rx, ry, deg, tilt) => rot([c[0] + rx * Math.cos(deg * Math.PI / 180), c[1] + ry * Math.sin(deg * Math.PI / 180)], tilt || 0, c);
  function halo(R, half, thc) {
    const [a0, a1] = half === 'back' ? [180, 360] : [0, 180], P = [];
    for (let k = 0; k <= 30; k++) P.push(ellPt(R.c, R.rx, R.ry, a0 + (a1 - a0) * k / 30, R.tilt));
    let s = line(P, 3.6, K.ink) + line(P, 1.8, K.paper);
    // the eclipse: an ink crescent over the paper core, 90° long, thickest in the middle
    let run = [];
    const flush = () => { if (run.length > 1) s += fillP(poly(run.map((q) => q[0]).concat(run.map((q) => q[1]).reverse())), K.ink); run = []; };
    for (let k = 0; k <= 36; k++) {
      const t = k / 36, a = thc - 45 + 90 * t, am = ((a % 360) + 360) % 360;
      if (half === 'back' ? am < 180 : am >= 180) { flush(); continue; }
      const p = ellPt(R.c, R.rx, R.ry, a, R.tilt), r = a * Math.PI / 180;
      const nn = norm(rot([Math.cos(r) / R.rx, Math.sin(r) / R.ry], R.tilt || 0)), w = Math.pow(Math.sin(Math.PI * t), 0.8);
      run.push([add(p, mul(nn, w)), sub(p, mul(nn, w))]);
    }
    flush();
    return s;
  }
  CHARS.wol = {
    weapon: 'eclipseHalo', eye: [6.9, -30.7], face: 'lit', cyan: 'waist',
    rig: { idleLean: 0, runLean: 6, runLegL: [8.6, 8.4], stride: 0.6, squashK: 0.5 },
    draw(P) {
      const run = P.run, E = this.eye, lg = run ? P.lag : P.sway * 0.5, M = P.thr ? P.mode : null;
      const world = run ? leg(P.hipF, P.ankF, { L: P.legL, w: 3.4, far: true, toe: P.toeF }) + leg(P.hipN, P.ankN, { L: P.legL, w: 3.6, toe: P.toeN })
        : leg(P.hipF, [-3.4, 12.6], { L: [8, 7.8], w: 3.4, far: true }) + leg(P.hipN, skid(P, [4.4, 12.6]), { L: [8, 7.8], w: 3.6, toe: P.hurt ? -8 : 0 });
      let up = '';
      // the ring: throw — chest height (draw), raised overhead and tilted, held at its back so no arm crosses the face
      // (wind, top ≥ y −56), flung out at the waist to rx 28 · ry 9 (snap), back to rx 21 (follow); hurt tilts it
      // (wind: centre y −43 keeps the ring's top edge, stroke included, under the y −52 prop limit)
      const R = M === 'draw' ? { c: [0, -18], rx: 20, ry: 6, tilt: -4 } : M === 'wind' ? { c: [-2, -43], rx: 16, ry: 5.6, tilt: -16 }
        : M === 'snap' ? { c: [0, -11], rx: 28, ry: 9, tilt: 0 } : { c: [0, -11 - (run ? 0.6 : 0)], rx: 21, ry: 6.5, tilt: run ? 4.5 : P.hurt ? P.tilt * 0.8 : 0 };
      const thc = 315 + P.i * (run ? 45 : 60);
      up += halo(R, 'back', thc);
      // ribbons (cyan) flying from the ring's left; in follow they wrap round the ring
      const s1 = run ? P.flut * 0.6 : P.sway * 0.9, s2 = run ? -P.flut * 0.6 : P.sway2 * 0.9, rl = ellPt(R.c, R.rx, R.ry, 180, R.tilt);
      const r1 = M === 'follow' ? [rl, add(rl, [0.6, 3.4]), add(rl, [3.6, 5.8]), add(rl, [7.6, 6.6])]
        : run || M === 'snap' ? [rl, add(rl, [-3.6, 0.6 + s1 * 0.3]), add(rl, [-7.2, 1 + s1 * 0.6]), add(rl, [-10.8, 1.2 + s1])] : [add(rl, [0, -0.4]), add(rl, [-3.4, 0.6 + s1 * 0.3]), add(rl, [-6.8, 2.8 + s1 * 0.6]), add(rl, [-10, 5 + s1])];
      const r2 = M === 'follow' ? [add(rl, [0, 0.6]), add(rl, [-1.6, 3.6]), add(rl, [0.4, 7.4]), add(rl, [3.8, 9.4])]
        : run || M === 'snap' ? [add(rl, [0, 0.6]), add(rl, [-3.2, 2.2 + s2 * 0.3]), add(rl, [-6.6, 4.2 + s2 * 0.6]), add(rl, [-9.8, 5.6 + s2])] : [add(rl, [0, 0.6]), add(rl, [-2.4, 3.6 + s2 * 0.3]), add(rl, [-4.6, 7.2 + s2 * 0.6]), add(rl, [-7, 10 + s2])];
      up += ribbon(r1, 3.8, 2.8, { end: 'fork' }) + ribbon(r2, 3.6, 2.6, { end: 'fork' });
      // bell skirt to the floor (hem held in world space), soaked hem
      const hb = toUp(P, [-16 - lg * 0.6 - (run ? 2 : 0), run ? 10.2 : 11.4]), h1 = toUp(P, [-6, 13.2]), h2 = toUp(P, [6, 13.2]), hf = toUp(P, [16 - (run ? 1.2 : 0), 11.4]);
      const bm = lerp([-8.4, -14], hb, 0.5), fm = lerp([8.4, -14], hf, 0.5);
      up += fillP(sm([[-7.4, -19], [-8.4, -14], bm, hb, h1, h2, hf, fm, [8.4, -14], [7.6, -19.2]], true, 0.1), K.paper);
      up += fillP(sm([[6, -17], [8.4, -14], fm, hf, lerp(h2, hf, 0.55), lerp([5, -8], lerp(h2, hf, 0.55), 0.5), [5, -8]], true, 0.1), K.p300);
      up += line([[-3, -12], lerp(h1, hb, 0.3)], 0.5) + line([[1.6, -10], lerp(h1, h2, 0.5)], 0.5);
      up += hem([hb, h1, h2, hf], 1.3, [0, -1], 31);
      // short jacket (저고리)
      up += fillP(sm([[-4, -25.2], [-7.2, -23.2], [-8, -19.4], [-7.6, -16.8], [0, -16.2], [7.8, -16.8], [8, -19.8], [7, -23.6], [2.8, -25.6]], true, 0.12), K.paper);
      up += hem([[-7.6, -16.8], [0, -16.2], [7.8, -16.8]], 1, [0, -1], 33) + collar([1.8, -25.6], [3.8, -23], [5.6, -20.4]);
      // head: soft lit face, centre-parted hair, small cyan 댕기 under the bun, the bun and its long pin
      const F = face({ eye: E, chin: -24.8, nose: [4.4, 1], chinX: -0.2, flick: 'down' });
      up += F.skin + F.marks;
      up += ribbon([[-6.6, -31.8], [-7.4, -28.8], [-8 - lg * 0.3, -25.6]], 1.5, 1.3, { end: 'fork' }) + ribbon([[-5.2, -31.6], [-5.6, -28.6], [-5.8 - lg * 0.3, -25.2]], 1.5, 1.3, { end: 'fork' });
      up += fillP('M 9.4,-33.6 C 9.2,-36.6 6.6,-38.4 2.8,-38.4 C -1,-38.4 -4,-36.4 -4.6,-33 C -5,-30.4 -4.2,-27.6 -2.8,-26.2 L 0.2,-26.6 C 0,-28.6 0.2,-30.6 1,-32 C 3.6,-33.2 6.6,-33.4 9.4,-33.2 Z', K.ink);
      // the bun and its pin (the pin's back end a solid paper knob at sprite size, F8); hurt rocks them back
      up += tiltG(P, `<circle cx="-5" cy="-36" r="4.9" fill="${K.ink}"/>` + fillP(strip([[-13.4, -38.2], [2.8, -34.6]], [1.1, 1.1], { sharp: true }), K.paper, IL) +
        `<circle cx="-13.6" cy="-38.3" r="0.9" fill="${K.paper}" ${IL}/>`, [-2, -33]);
      const sh = [2.6, -22];
      if (M === 'wind') {
        // both hands up at the back of the raised ring, the near arm passing behind the head
        const hp = ellPt(R.c, R.rx, R.ry, 150, R.tilt);
        up += halo(R, 'front', thc) + sleeve([sh, [-4.4, -26], add(hp, [0.8, 1.6])], [4, 3.4, 2.8]) + hand(add(hp, [0.4, 0.6]), -110);
      } else if (M === 'snap') {
        // released: the arm swings out forward-down, two speed arcs ride the flung ring
        up += sleeve([sh, [7.6, -17.6], [13.2, -12.6]], [4, 3.4, 2.8]) + hand([14.4, -12], 20);
        up += halo(R, 'front', thc);
        const H = hk();
        up += fillP(H.brushArc(0, -11, 31.4, 11.6, 0.2, 1.2, (t) => 1.6 * Math.sin(Math.PI * t), 24), K.ink) + fillP(H.brushArc(0, -11, 34.4, 13.4, 0.35, 1.05, (t) => 1.2 * Math.sin(Math.PI * t), 24), K.ink);
      } else {
        // near hand on the ring's front (idle, run, hurt, draw, follow)
        const hp = ellPt(R.c, R.rx, R.ry, M === 'draw' ? 70 : 64, R.tilt), el = run ? [5.2, -16] : M === 'draw' ? [7.4, -18.6] : [5.6, -15.6];
        up += sleeve([sh, el, add(hp, [-0.6, -1.4])], [4, 3.4, 2.8]);
        up += halo(R, 'front', thc);
        up += hand(add(hp, [0, -0.6]), 60);
      }
      return { world, up };
    }
  };

  // ======================================================================================================
  // SPRITE ASSEMBLY
  // ======================================================================================================
  const hitboxOverlay = () => `<g fill="none" stroke="${K.ink}" stroke-width="0.5"><circle cx="0" cy="0" r="${SPRITE.r}" stroke-dasharray="2 1.4"/><path d="M -3,0 L 3,0 M 0,-3 L 0,3"/><path d="M -20,${SPRITE.feet} L 20,${SPRITE.feet}" stroke-dasharray="1 1.4"/></g>`;
  function outlineFilters(c, halo) {
    const id = c.id;
    // 결's outline (k-hero.js:1540-1541): light side dilate 1.1, shade side 1.5 + (0.75, 0.75), paper.50 白邊 1.5 outside
    c.defs.push(`<filter id="${id}ol" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.1" result="a"/><feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="b0"/><feOffset in="b0" dx="0.75" dy="0.75" result="b"/><feMerge result="ol"><feMergeNode in="a"/><feMergeNode in="b"/></feMerge><feFlood flood-color="${K.ink}"/><feComposite in2="ol" operator="in" result="ink"/>` +
      (halo ? `<feMorphology in="ol" operator="dilate" radius="1.5" result="h"/><feFlood flood-color="${K.p50}"/><feComposite in2="h" operator="in" result="paper"/><feMerge><feMergeNode in="paper"/><feMergeNode in="ink"/><feMergeNode in="SourceGraphic"/></feMerge>` : `<feMerge><feMergeNode in="ink"/><feMergeNode in="SourceGraphic"/></feMerge>`) + `</filter>`);
    c.defs.push(`<filter id="${id}xr" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="d"/><feMorphology in="SourceAlpha" operator="dilate" radius="0.4" result="e"/><feComposite in="d" in2="e" operator="out" result="r"/><feFlood flood-color="${K.ally}"/><feComposite in2="r" operator="in"/></filter>`);
  }
  function checkId(fn, id) { if (!ALL.includes(id)) throw new Error(`PN.characters.${fn}: unknown character "${id}"`); }
  function gyeolSprite(state, frame, opts) {
    const o = Object.assign({}, opts);
    if (o.mono) o.halo = false;
    let s = PN.heroKit.sprite(state, frame, o);
    if (o.hitbox) s = s.replace(/<\/g>$/, `<g transform="translate(${SPRITE.pivot[0]} ${SPRITE.pivot[1]})">${hitboxOverlay()}</g></g>`);
    return o.mono ? mono(s) : s;
  }

  const NS = PN.characters = PN.characters || {};
  // sprite(id, state, frame, opts) → 96×96 box SVG. opts as PN.heroKit.sprite (ring, aim, flip, shadow, halo, xray, xrayOnly,
  // noOutline) + mono (one ink, no 白邊, outline kept) + hitbox (dev overlay: r 15 circle, pivot cross, feet line).
  // aim turns the ring only: the seven's arms and weapons are part of each pose (the bakes use aim 0, as 결's)
  NS.sprite = function (id, state, frame, opts) {
    opts = opts || {};
    state = state == null ? 'idle' : state;
    frame = frame | 0;
    checkId('sprite', id);
    if (!STATES.includes(state)) throw new Error(`PN.characters.sprite: unknown state "${state}"`);
    if (id === 'gyeol') return gyeolSprite(state, frame, opts);
    if (!DRAWN_STATES.includes(state)) throw new Error(`PN.characters.sprite: "${state}" is not drawn`);
    const H = hk(), c = H.Ctx({ pitch: 3 }), halo = opts.halo !== false && !opts.mono;
    outlineFilters(c, halo);
    const P = pose(id, state, frame), D = CHARS[id].draw(P, c);
    // hurt f2: five ink splashes on the body (결's method, k-hero.js:1531)
    const splash = P.hurt && P.i === 2 ? `<g fill="${K.ink}"><circle cx="4" cy="-14" r="1.3"/><circle cx="6.6" cy="-11.6" r="0.8"/><circle cx="-2" cy="-2" r="1.1"/><circle cx="1" cy="1.4" r="0.6"/><circle cx="-7" cy="3" r="0.9"/></g>` : '';
    let fig = D.world + `<g transform="translate(0 ${f(P.bob)}) rotate(${f(P.lean)} 0 1)">${D.up}${splash}</g>` + (D.over || '');
    if (P.sx !== 1 || P.sy !== 1) fig = `<g transform="translate(0 15) scale(${f(P.sx)} ${f(P.sy)}) translate(0 -15)">${fig}</g>`;
    // hurt f0 · f1: ink ↔ paper negative, cyan kept (PN._hk.negate, as 결)
    if (P.hurt && P.neg) fig = H.negate(fig);
    let aim = opts.aim || 0;
    if (opts.flip) { aim = Math.PI - aim; aim = Math.atan2(Math.sin(aim), Math.cos(aim)); }
    let s = '';
    if (opts.shadow !== false) s += `<ellipse cx="0" cy="${SPRITE.shadow.cy}" rx="${SPRITE.shadow.rx}" ry="${SPRITE.shadow.ry}" fill="${K.ink}" opacity="0.3"/>`;
    if (opts.ring !== false) s += H.spriteRing(aim);
    if (!opts.xrayOnly) s += opts.noOutline ? fig : `<g filter="url(#${c.id}ol)">${fig}</g>`;
    if (opts.xray || opts.xrayOnly) s += `<g filter="url(#${c.id}xr)">${fig}</g>`;
    if (opts.mono) s = mono(s);
    if (opts.hitbox) s += hitboxOverlay();
    return wrapUsed(c, `<g transform="translate(${SPRITE.pivot[0]} ${SPRITE.pivot[1]})${opts.flip ? ' scale(-1 1)' : ''}">${s}</g>`);
  };

  // ======================================================================================================
  // PORTRAIT · 160 box, pivot (80, 80), disc r 74, ink rim 6, paper ring r 78.5 (as 결, k-hero.js:1568, 1612-1616).
  // Head-local coords are 결's 3/4 head: origin = skull centre, facing +x, ONE ~45° turn for every feature, level lines
  // brow −8 · eye −3.5 · nose base 10 · mouth 17.5 · chin 32.5, midline x 20 at the eyes (brief §5.1). Framed at
  // hx = 64.08 + dx, hy = 72 + dy, scale headScale (brief §5.5).
  // ======================================================================================================
  // 결's FACE point run (k-hero.js:176-178), copied; each character overrides a few points (brief §6)
  const FACE0 = Object.freeze([[-13, -28], [-4, -33], [14, -35], [22, -31], [31, -20], [31.4, -12.5], [31.6, -8.6], [29.8, -3.6], [32.2, 3.2],
    [34, 6.4], [34.4, 7.8], [32, 9.6], [29.6, 11.2], [30.6, 13.8], [29.2, 16.8], [29.8, 19], [27.6, 23.6], [27.2, 29], [25.4, 30.8],
    [17.6, 32.4], [8, 30.4], [-8.6, 15], [-13.6, 1], [-13.6, -14]]);
  const facePts = (over) => FACE0.map((p, i) => (over && over[i] ? over[i].slice() : p.slice()));
  // 결's edge() method (k-hero.js:199-215), copied: a variable-width brush along P[i0..i1] on the same Catmull-Rom as the
  // fill, so the stroke sits on the fill edge. wfn(t, p) → full width at arc fraction t
  function edge(P, i0, i1, wfn) {
    const n = P.length, g = (i) => P[((i % n) + n) % n], C = [];
    for (let i = i0; i < i1; i++) {
      for (let k = 0; k < 10; k++) {
        const t = k / 10, a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2), t2 = t * t, t3 = t2 * t;
        C.push([0, 1].map((j) => 0.5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * t3)));
      }
    }
    C.push(g(i1));
    const cum = [0];
    for (let i = 1; i < C.length; i++) cum.push(cum[i - 1] + Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]));
    const tot = cum[cum.length - 1] || 1, L = [], R = [];
    C.forEach((p, i) => {
      const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      const h = Math.max(0.1, wfn(cum[i] / tot, p) / 2);
      L.push([p[0] - dy / l * h, p[1] + dx / l * h]); R.push([p[0] + dy / l * h, p[1] - dx / l * h]);
    });
    return fillP(`M ${L.concat(R.reverse()).map(pt).join(' L ')} Z`, K.ink);
  }
  const ramp = (t, a, b) => Math.max(0, Math.min(1, t / a, (1 - t) / b));
  // three strokes (brief §5.1): forehead → cheekbone → nose tip (thinned to 0.62 at the far socket so the far eye keeps
  // ≥ 1 u of paper), nose base → lips → chin front 2.2 → 4.2, the chin tip fading along the jaw. Nothing under the jaw.
  function contour(P, w) {
    const y7 = P[7][1];
    return edge(P, 3, 10, (t, p) => w[0] * ramp(t, 0.08, 0.12) * (1 - 0.38 * Math.max(0, 1 - Math.abs(p[1] - y7) / 4.5))) +
      edge(P, 9, 18, (t) => (2.2 + 2.0 * t) * ramp(t, 0.12, 0.1)) +
      edge(P, 17, 20, (t) => w[1] * Math.min(1, t / 0.08) * Math.pow(Math.max(0, 1 - t / 0.8), 0.9));
  }
  // paper-shadow planes (flat, no halftone in the face): 결's far-cheek band and nose side plane (k-hero.js:193, 196),
  // and the lit face's near side plane — a curved edge swelling at the cheekbone and tucking in at the jaw angle (brief
  // §5.2), carried up under the hair and down past the jaw so neither end shows a straight cut
  const FAR_TONE = 'M 29.2,-1.6 C 30.4,0 31.4,1.6 31.8,3.6 L 30.2,4.4 C 29.8,2.6 29.2,0.6 28.4,-0.8 Z';
  const NOSE_TONE = 'M 19,-0.8 C 21,0.6 22.6,2.4 23.8,4.6 C 24.6,6 25.4,7.2 26.2,8.2 C 27.6,7.6 29.4,7.2 31,6.2 C 29.4,4.8 27.4,3 25.4,1.2 C 23.6,-0.4 21.8,-2.4 19.8,-4.4 Z';
  const SIDE_B = 'M -5.6,-30 C -4.8,-23 -3.9,-17.4 -3.4,-14 C -2.2,-10 -1.4,-7 -1.2,-5 C -0.6,-1.6 0.6,0.6 0.4,2.6 C 0.2,5.4 -0.6,7.4 -1.6,9 C -3,11.6 -4.8,14 -6.6,16 C -8.6,18.6 -10.6,21.4 -12.6,24.4 L -24,24.4 L -24,-30 Z';
  const ACCENT = 'M 28.6,10.4 L 32,9.8 L 30.6,12.4 Z';
  // lit almond with the iris clipped by the lids; lid strokes follow the almond's own two cubics
  const almond = (c, d, inner) => `<path d="${d}" fill="${K.p50}"/><g clip-path="url(#${c.clip(d)})">${inner}</g>`;
  const cubics = (d) => { const n = d.match(/-?\d*\.?\d+/g).map(Number); return { up: n.slice(0, 8), lo: n.slice(6, 14) }; };
  // ---- expressions (brief §5.5; head angles as 결's EX table, k-hero.js:1571-1578) ----
  // one lit eye in an expression shape. d: almond path (near eye: outer → inner corner; far eye: inner → outer).
  // kind: open · narrow (focus: lid down to the iris centre) · half (lowhp far eye) · shut (hurt: near '>', far '<', both
  // pointing at the nose) · arc (closed smile) · crescent (smile: the lower lid rises). wake: cyan iris (awakened)
  function litEye(c, d, iris, lidW, B, kind, far, wake, low) {
    const E = cubics(d), x0 = E.up[0], y0 = E.up[1], x1 = E.up[6], y1 = E.up[7], mid = (x0 + x1) / 2;
    const top = Math.min(E.up[3], E.up[5]), bot = Math.max(E.lo[3], E.lo[5]), [ix, iy, irx, iry] = iris;
    const gr = far ? 0.45 : low ? 0.4 : 0.55, gx = far ? ix + 0.4 : ix + 0.6, gy = far ? iy - 0.6 : low ? iy + 0.5 : iy + 0.05;
    const content = `<ellipse cx="${f(ix)}" cy="${f(iy)}" rx="${f(irx)}" ry="${f(iry)}" fill="${wake ? (far ? K.allyD : K.ally) : K.ink}"/><circle cx="${f(gx)}" cy="${f(gy)}" r="${gr}" fill="${wake ? K.allyG : K.p50}"/>`;
    if (kind === 'shut') {
      const v = far ? [x0, y0] : [x1, y1], o = far ? [x1, y1] : [x0, y0];
      return T([o[0], o[1] - 1.8, (o[0] + v[0]) / 2, v[1] - 1.2, v[0], v[1]], 1.8 * B) + T([o[0], o[1] + 1.4, (o[0] + v[0]) / 2, v[1] + 0.9, v[0], v[1]], 1.8 * B);
    }
    if (kind === 'arc') return T([x0, y0 + 0.6, mid, top - 0.4, x1, y1 + 0.6], lidW * B, 'mid');
    let s = almond(c, d, content);
    if (kind === 'narrow' || kind === 'half') {
      const yc = iy - (kind === 'half' ? 0.1 : 0);
      s += fillP(poly([[x0 - 0.8, yc + 0.3], [x1 + 0.8, yc + 0.1], [x1 + 0.8, top - 2.4], [x0 - 0.8, top - 2.4]]), K.paper);
      return s + T([x0 - 0.2, yc + 0.4, mid, yc - 0.3, x1 + 0.2, yc + 0.2], lidW * B * 1.05, kind === 'half' ? (far ? 'end' : 'start') : 'mid') +
        T(E.lo.map((v, i) => (i % 2 ? v - 0.5 : v)), 0.7 * B, 'mid');
    }
    if (kind === 'crescent') {
      // skin covers the eye below the raised lower lid; the eye is left as a crescent under the upper lid
      s += fillP(`M ${f(x1)},${f(y1)} Q ${f(mid)},${f(iy - 0.6)} ${f(x0)},${f(y0)} L ${f(x0)},${f(bot + 3)} L ${f(x1)},${f(bot + 3)} Z`, K.paper);
      return s + T([x1, y1, mid, iy - 0.6, x0, y0], 0.9 * B, 'mid') + T(E.up, lidW * B, far ? 'end' : 'mid');
    }
    return s + T(E.up, lidW * B, far ? 'end' : 'mid') + T(E.lo, 0.6 * B, 'mid');
  }
  const farIris = (d) => { const F = cubics(d); return [F.up[6] - 2.3, (F.up[1] + F.up[7]) / 2 - 0.1, 1.2, 1.7]; };
  function eyesLit(c, pf, B, expr) {
    const k = { focus: ['narrow', 'narrow'], hurt: ['shut', 'shut'], lowhp: ['open', 'half'], victory: pf.vEyes || ['open', 'open'] }[expr] || ['open', 'open'];
    const wake = expr === 'awakened';
    let s = litEye(c, pf.near, pf.iris, pf.lid, B, k[0], false, wake, expr === 'lowhp') + litEye(c, pf.far, farIris(pf.far), 2, B, k[1], true, wake);
    if (wake) {
      // the near glint bleeds back into a cyan thread: ink · cyan · glow strokes over the lit face, no blur (brief §5.5)
      const g = [pf.iris[0] + 0.6, pf.iris[1] + 0.05], p = [g[0], g[1], 1, g[1] - 3.4, -12, g[1] + 0.8];
      s += T(p, 3.4, 'start') + T(p, 2.2, 'start', K.ally) + T([g[0], g[1], 0, g[1] - 2, -10, g[1] + 2.4], 0.9, 'start', K.allyG);
    }
    return s;
  }
  // brows: the first point of each stroke is its nose-side end. focus: kinked down toward the nose; hurt / lowhp: the
  // inner ends lift; victory: raised a touch; awakened: set a little lower
  function browsExpr(pf, B, expr) {
    const dy = { focus: [1.4, 0.6, 0], hurt: [-1, -0.4, 0.2], lowhp: [-1.2, -0.5, 0], awakened: [0.4, 0.2, 0], victory: [-0.5, -0.6, -0.5] }[expr] || [0, 0, 0];
    return (pf.brows || []).map((b) => T([b[0], b[1] + dy[0], b[2], b[3] + dy[1], b[4], b[5] + dy[2]], b[6] * B * (expr === 'focus' ? 1.15 : 1))).join('');
  }
  // mouths. pf.ml = [near corner x, y, far corner x, y] (the far corner sits on the far contour)
  function mouthExpr(pf, B, fine, expr) {
    const [x0, y0, x1, y1] = pf.ml, my = (y0 + y1) / 2, d = f(my - 17.2);
    if (expr === 'focus') return T([x0 + 0.6, y0 + 0.2, (x0 + x1) / 2, my + 0.3, x1, y1 + 0.1], 1.6 * B);   // level, no tails
    if (expr === 'hurt') return `<g transform="translate(0 ${d})"><path d="M 18.4,17.4 C 21.4,16.2 26.4,15.8 29.4,16.4 C 28.8,21.4 22.4,22.8 18.4,17.4 Z" fill="${K.ink}"/><path d="M 20.2,17.6 L 28.2,16.9" stroke="${K.p50}" stroke-width="${f(B)}"/></g>`;
    if (expr === 'lowhp') return `<path d="M 20.6,18 C 23,17.2 26.6,17 28.6,17.4 C 27.6,20.4 23.2,21 20.6,18 Z" fill="${K.ink}" transform="translate(0 ${d})"/>`;
    if (expr === 'victory') return pf.smile(B, fine);
    return pf.mouth(B, fine);
  }
  // lowhp: the worn paper-shadow plane under the near eye (lit face) and one temple sweat drop in the light on the far
  // contour (nothing white below the far eye, k-hero.js:357)
  const WORN_B = 'M 3.2,-0.4 C 6.4,1 10.2,1.2 13.4,-0.2 L 13.6,1.4 C 10.2,3.2 6.4,3 3,1.4 Z';
  const sweat = (x, y, h) => `<path d="M ${f(x)},${f(y)} C ${f(x - 0.34 * h)},${f(y + 0.57 * h)} ${f(x - 0.31 * h)},${f(y + 0.94 * h)} ${f(x)},${f(y + h)} C ${f(x + 0.31 * h)},${f(y + 0.94 * h)} ${f(x + 0.34 * h)},${f(y + 0.57 * h)} ${f(x)},${f(y)} Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.1"/>`;
  // the face: fill, ≤ 6 paper-shadow planes, ONE ink accent (under the nose tip), the brush contour, nose, eyes, brows,
  // mouth. pf: {over, nose:[dx,dy], near, iris, lid, far, brows, ml, mouth(B, fine), smile(B, fine), vEyes, planes,
  // shade (A-type mass), worn (A-type worn plane), w, bridge, extra, eyes (A-type)}
  function faceP(c, pf, B, fine, expr) {
    expr = expr || 'calm';
    const P = facePts(pf.over), FACE = sm(P, true), cl = c.clip(FACE), ns = pf.nose || [0, 0], nt = `translate(${f(ns[0])} ${f(ns[1])})`;
    let inner = fillP(FAR_TONE, K.p300) + `<path d="${NOSE_TONE}" fill="${K.p300}" transform="${nt}"/>`;
    // A-type victory: the fringe blows up, its shadow lifts off both eyes (as 결's victory shadowDy −11, rot −5)
    if (pf.shade) inner += expr === 'victory' ? `<g transform="translate(0 -11) rotate(-5 10 -10)">${fillP(pf.shade, K.ink)}</g>` : fillP(pf.shade, K.ink);
    else inner += fillP(SIDE_B, K.p300);
    (pf.planes || []).forEach((d) => { inner += fillP(d, K.p300); });
    if (expr === 'lowhp') inner += fillP(pf.shade ? pf.worn : WORN_B, K.p300);
    inner += `<path d="${ACCENT}" fill="${K.ink}" transform="${nt}"/>`;
    let s = fillP(FACE, K.paper) + `<g clip-path="url(#${cl})">${inner}</g>` + contour(P, pf.w || [3, 5]);
    s += `<g transform="${nt}">${pf.bridge ? pf.bridge(B) : T([25.4, 1.2, 29, 4, 32.4, 6.4], 0.9 * B, 'end')}${T([26.2, 8.2, 27.2, 10.2, 29.6, 10.6], B)}${T([29.8, 9.4, 31, 9.6, 32.2, 9.4], B)}</g>`;
    s += pf.eyes ? pf.eyes(c, B, expr) : eyesLit(c, pf, B, expr);
    s += browsExpr(pf, B, expr);
    s += mouthExpr(pf, B, fine, expr) + (pf.extra ? pf.extra(B, fine, expr) : '');
    // hurt: an ink splash on the lower near cheek, clear of the features (k-hero.js:359)
    if (expr === 'hurt') s += hk().splat(9, 20, 5, 7, 31, K.ink, 2.4);
    if (expr === 'lowhp') s += sweat(30.4, -11.8, 5.2);
    return { s, P };
  }
  // the shoulders turn only a fifth as far as the head (결 keeps his collar still, k-hero.js:1602)
  const bodyG = (X, m) => (X && X.rot ? `<g transform="rotate(${f(-0.8 * X.rot)} ${f(11 / X.S)} ${f(4 / X.S)})">${m}</g>` : m);
  // hurt shakes a hat or hair ornament about its base
  const shake = (X, m, o) => (X && X.expr === 'hurt' ? `<g transform="rotate(-6 ${f(o[0])} ${f(o[1])})">${m}</g>` : m);
  // neck behind the face: paper with an ink edge; the jaw's cast-shadow band starts right on the jawline (its top edge
  // sits inside the face, which covers it) over a paper-shadow plane — 결's neck34 method, k-hero.js:319-324
  function neckP(P) {
    const up = (p, d) => [p[0], p[1] - d], fx = P[19][0] + 0.6, j0 = P[21], j1 = P[20], j2 = P[19];
    const jaw = `M ${pt(up(j0, 4))} C ${pt(up(lerp(j0, j1, 0.45), 3))} ${pt(up(lerp(j1, j0, 0.25), 3))} ${pt(up(j1, 3))} C ${pt(up(lerp(j1, j2, 0.4), 3))} ${pt(up(lerp(j2, j1, 0.2), 3))} ${pt(up(j2, 3))}`;
    // a lit face keeps the band thin: 3.6 under the chin, about 8 at the back of the jaw
    const band = `C ${pt([fx - 8, j2[1] + 4.6])} ${pt([j0[0] + 6, j0[1] + 9])} ${pt([-22, j0[1] + 8])}`;
    return fillP(`M ${pt(up(j0, 4))} L ${pt(up(j2, 3))} L ${pt([fx, j2[1]])} L ${pt([fx, 66])} L -21,66 L -22,${f(j0[1] + 2)} Z`, K.paper, `stroke="${K.ink}" stroke-width="4.4" stroke-linejoin="round" paint-order="stroke"`) +
      fillP(`${jaw} L ${pt([fx, j2[1]])} L ${pt([fx, 66])} L -22,66 L -22,${f(j0[1] - 2)} Z`, K.p300) +
      fillP(`${jaw} L ${pt([fx, j2[1]])} L ${pt([fx, j2[1] + 3.6])} ${band} L -22,${f(j0[1] - 2)} Z`, K.ink);
  }
  // portrait-scale cyan cloth (sandwich: ink edge · ally · allyD underside · allyG core)
  function ribbonP(P, w0, w1, o) {
    o = o || {};
    const n = P.length, W = P.map((_, i) => w0 + (w1 - w0) * i / (n - 1)), e = P[n - 1], u = norm(sub(e, P[n - 2])), nn = perp(u), we = W[n - 1] / 2;
    let tip = null;
    if (o.end === 'fork') tip = [add(add(e, mul(nn, we)), mul(u, we * 1.2)), add(e, mul(u, we * 0.1)), add(sub(e, mul(nn, we)), mul(u, we * 0.9))];
    else if (o.end !== 'flat') tip = [add(e, mul(u, o.tipLen == null ? we * 2.6 : o.tipLen))];
    const d = strip(P, W, { tip, k: 0.1 }), D1 = [], D2 = [], G = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], m = perp(norm(sub(b, a))), s = shadeSign(m);
      D1.push(add(P[i], mul(m, s * W[i] * 0.08))); D2.push(add(P[i], mul(m, s * W[i] * 0.42))); G.push(add(P[i], mul(m, -s * W[i] * 0.22)));
    }
    return `<path d="${d}" fill="${K.ally}" stroke="${K.ink}" stroke-width="${f(o.edge || 2)}" stroke-linejoin="round" paint-order="stroke"/>` +
      `<path d="${poly(D1.concat(D2.reverse()))}" fill="${K.allyD}"/>` + line(G.slice(0, Math.max(2, n - 1)), o.glow || 1.2, K.allyG);
  }
  // shoulders under the neck with the crossed collar (ink 깃 + paper 동정) and a paper-shadow far shoulder
  function garment(o) {
    o = o || {};
    const OLs = `stroke="${K.ink}" stroke-width="4.4" stroke-linejoin="round" paint-order="stroke"`;
    // shoulder line at y ≈ 37 so the collar shows above the disc's lower edge for every framing (dy 0 … +12)
    let s = fillP('M -80,96 C -76,60 -58,42 -32,37 C -20,35 -8,37.6 2,40 L 26,38.4 C 48,39.6 66,54 80,96 Z', o.fill || K.paper, OLs);
    s += fillP('M 36,41 C 54,46 68,60 80,96 L 52,96 C 50,72 44,54 36,41 Z', K.p300);
    if (o.under) s += o.under;
    // far collar under the near one, then the near collar crossing to the chest
    s += fillP('M 16,39.4 L 27,38.8 C 28,45 27,52 24,59 L 16,59 Z', K.ink) + fillP('M -18,37 L -9,37.8 C -2,45 8,55 22,67 L 10,71 C -1,59 -10,48 -18,37 Z', K.ink);
    s += T([-14.6, 38, -5, 46.4, 12, 64], 2.6, 'mid', K.p50);
    return s + (o.over || '');
  }

  // ---- per-character portrait heads (calm). Each returns head-local markup, back to front ----
  CHARS.dan.portrait = { headScale: 1.72, dx: 0, dy: 4 };
  CHARS.dan.pf = {
    over: { 8: [32.4, 2.6], 9: [33.4, 6.2], 10: [33.8, 7.4], 11: [31.6, 9.2], 16: [27.2, 22.8], 17: [26.6, 27.6], 18: [25, 29.6], 19: [19, 31], 20: [9, 28.6], 21: [-7.4, 12.6] },
    nose: [-0.5, -0.2], w: [3, 5],
    near: 'M 3,-3.4 C 5.6,-5.6 10.6,-5.9 13.4,-4 C 10.6,-2.4 5.6,-2 3,-3.4 Z', iris: [9.6, -3.8, 1.6, 1.8], lid: 2.4,
    far: 'M 21.8,-3.4 C 23.4,-4.8 26,-5 27.8,-3.8 C 26.4,-2.6 23.8,-2.2 21.8,-3.4 Z',
    brows: [[14, -9.4, 8, -10.4, 1.4, -12.2, 1.5], [21.4, -9.2, 25.6, -10.2, 30.6, -11, 1.3]],
    // thin mouth, only the near corner lifted 0.8
    ml: [17.4, 17.2, 29.2, 16.8],
    mouth: (B, fine) => T([17.4, 17.2, 21.4, 17.9, 26.4, 17.9, 29.2, 16.8], 1.3 * B) + T([21.8, 20.8, 24.4, 21.2, 26.8, 20.6], 0.7 * B) + (fine ? T([25.4, 10.8, 25.5, 12.2, 25.8, 13.6], 0.5 * B) : ''),
    // victory: a sharp grin, the near corner hooked up
    smile: (B) => T([17.2, 16.2, 20.6, 18.8, 25.8, 18.9, 29.2, 16.8], 1.6 * B) + T([17.8, 16.4, 16.6, 15.2, 16.2, 13.8], 1 * B) + T([21.8, 21.2, 24.4, 21.6, 26.8, 21], 0.7 * B)
  };
  CHARS.dan.head = function (c, B, fine, X) {
    // band tails behind the head (cyan, pointed), from the knot at the back
    let s = ribbonP([[-32, -25], [-40, -30.6], [-48, -35.6], [-56, -38.4]], 7, 3, { tipLen: 6 }) + ribbonP([[-32, -19], [-40, -15.4], [-48, -11], [-56, -8]], 7, 3, { tipLen: 6 });
    s += neckP(facePts(this.pf.over));
    s += bodyG(X, garment({ under: fillP('M -80,96 C -76,60 -58,42 -32,37 L -24,36.4 C -27,52 -27,74 -24,96 Z', K.ink) }));
    const F = faceP(c, this.pf, B, fine, X && X.expr);
    s += F.s;
    // short hair: crown cap, sideburn in front of the ear, back of the head behind it
    s += fillP('M 32.6,-20.4 C 31.4,-32 21.6,-41.4 6,-43.2 C -10,-45 -26,-40.4 -35,-28 C -41,-18 -42,-2 -37,10 C -34,18 -29,24 -23,29 L -13.4,23 C -14.8,16 -15.2,9 -14.4,3 C -13.8,-2 -13,-6 -11.8,-8.4 L -6.4,-8.2 C -5.6,-12 -4.6,-16 -3.2,-19.2 C 0,-23.2 6.4,-25.2 14,-25.6 C 22,-26 28.4,-24.4 32.6,-20.4 Z', K.ink);
    s += T([-22, -36, -34, -18, -30, 12], 3, 'mid', K.p50) + T([-12, -40, -24, -24, -22, 4], 1.9, 'mid', K.p50);
    // ear (paper, in the light) with the helix line and a small paper-shadow bowl
    s += fillP('M -5.8,-7.8 C -8.8,-9.6 -12.4,-8 -12.6,-2 C -12.8,4 -10.6,9.6 -6.6,10.2 C -5.8,6 -5.2,0 -5.8,-7.8 Z', K.paper, `stroke="${K.ink}" stroke-width="2.2" stroke-linejoin="round" paint-order="stroke"`) +
      fillP('M -7.4,-4 C -9.4,-3.6 -10.2,0 -9,3.6 C -8,1.6 -7.4,-1 -7.4,-4 Z', K.p300) + T([-7.4, -6.2, -11, -3, -9.6, 5], 1.2);
    // topknot with its pin crossing it and running out on both sides (no paper mark floating in the ink)
    s += shake(X, `<ellipse cx="-3" cy="-44.6" rx="8" ry="6.4" fill="${K.ink}"/>` + fillP(strip([[-15, -46], [9, -43.4]], [2.4, 2.4], { sharp: true }), K.paper, `stroke="${K.ink}" stroke-width="1.2" paint-order="stroke"`), [-3, -39]);
    // the cyan headband over the hairline (7 u and more above the brows), its knot at the back
    s += ribbonP([[31.6, -22.6], [24, -23.4], [12, -23.2], [1, -22], [-10, -21], [-22, -21.2], [-31, -22]], 8.6, 7.4, { end: 'flat' });
    s += `<ellipse cx="-32" cy="-22" rx="4.6" ry="5.4" fill="${K.ally}" stroke="${K.ink}" stroke-width="2" paint-order="stroke"/>` +
      fillP('M -27.6,-23.4 A 4.6 5.4 0 0 1 -33.8,-16.9 C -31.2,-18.8 -29.4,-20.6 -27.6,-23.4 Z', K.allyD) + line([[-34, -24.6], [-31, -25.4]], 1.1, K.allyG);
    return s;
  };

  const OL2 = (w) => `stroke="${K.ink}" stroke-width="${w}" stroke-linejoin="round" paint-order="stroke"`;
  // lit ear on the near side plane: paper with an ink rim, helix line, a small paper-shadow bowl
  const earLit = (dx, dy) => `<g transform="translate(${f(dx || 0)} ${f(dy || 0)})">` + fillP('M -5.8,-7.8 C -8.8,-9.6 -12.4,-8 -12.6,-2 C -12.8,4 -10.6,9.6 -6.6,10.2 C -5.8,6 -5.2,0 -5.8,-7.8 Z', K.paper, OL2(2.2)) +
    fillP('M -7.4,-4 C -9.4,-3.6 -10.2,0 -9,3.6 C -8,1.6 -7.4,-1 -7.4,-4 Z', K.p300) + T([-7.4, -6.2, -11, -3, -9.6, 5], 1.2) + '</g>';

  // 노을: S 1.56, dx +2, dy +12 — the 고깔's lower part, its folds and cyan base band show at the top of the disc
  CHARS.noeul.portrait = { headScale: 1.56, dx: 2, dy: 12 };
  CHARS.noeul.pf = {
    over: { 8: [31.8, 3.4], 9: [33.2, 6], 10: [33.6, 7.2], 11: [31.6, 8.6], 13: [30.8, 13.6], 15: [30, 19.2], 17: [26.8, 28], 18: [25.2, 30], 19: [18.4, 31.6], 20: [8.6, 29.6], 21: [-8, 14] },
    nose: [-0.8, -0.4], w: [2.7, 4.4],
    near: 'M 2.4,-4 C 5,-6.6 10.6,-6.9 13.4,-4 C 10.6,-1.8 5.6,-1.6 2.4,-4 Z', iris: [9.4, -4, 1.8, 2.1], lid: 2.4,
    far: 'M 21.8,-3.6 C 23.4,-5.4 26.2,-5.6 28,-4.2 C 26.6,-2.6 23.8,-2.2 21.8,-3.6 Z',
    brows: [[14.2, -9.6, 8.6, -12.6, 1, -11.2, 1.4], [21, -9.6, 25, -11.8, 30.4, -10.8, 1.2]],
    planes: ['M 21,19.2 C 23.6,21.4 26.6,21.2 28.6,19.2 L 28.2,20.6 C 26.4,22.6 23,22.8 21,19.2 Z'],
    // eyeliner flick from the outer (back) corner
    extra: (B) => T([2.6, -4.2, 0.6, -5.4, -1.2, -7], 1.3 * B, 'start'),
    ml: [19, 17.8, 29.2, 16.9],
    mouth: (B, fine) => T([19, 17.8, 22.2, 18.4, 26.4, 18.3, 29.2, 16.9], 1.2 * B) + (fine ? T([25, 10.4, 25.1, 11.8, 25.4, 13.4], 0.5 * B) : ''),
    // victory: a closed-mouth smile, the near eye a crescent (lower lid up)
    vEyes: ['crescent', 'crescent'],
    smile: (B) => T([19, 17.2, 22.4, 18.8, 26.4, 18.6, 29.2, 16.9], 1.2 * B)
  };
  CHARS.noeul.head = function (c, B, fine, X) {
    // braid falling down the back (ink) with a paper tie crossing it, the back hair behind the face
    let s = fillP(strip([[-30, -8], [-36, 14], [-40, 34], [-42, 60]], [12, 11, 9.6, 8]), K.ink) + line([[-47, 30], [-33, 36.4]], 2.4, K.p50);
    s += fillP('M 28,-26 C 22,-38 6,-44 -10,-43 C -26,-41 -38,-30 -41,-14 C -43,0 -40,16 -34,28 C -30,36 -24,42 -18,46 L -12,40 C -14,30 -15,18 -14,6 L -13.6,-14 Z', K.ink);
    s += neckP(facePts(this.pf.over)) + bodyG(X, garment());
    s += faceP(c, this.pf, B, fine, X && X.expr).s;
    // centre-parted front hair; the near side falls over the ear and frames the face
    s += fillP('M 31.6,-19.4 C 30.4,-24 27.6,-26.6 24,-27.8 C 21.6,-28.6 19.8,-30 18.8,-32 C 17,-29.4 13.6,-27.4 9,-26.6 C 2.6,-25.6 -2.6,-22 -5.4,-16 C -7.6,-11 -7.4,-5 -7,1 C -6.8,8 -8.6,16 -12.4,22 C -14,24.4 -16,26 -18,27 L -22,26 L -22,-44 L 28,-44 Z', K.ink);
    s += T([-6, -22, -10, -4, -12, 20], 2, 'mid', K.p50) + T([14, -30, 4, -28, -4, -20], 1.9, 'mid', K.p50);
    // the folded paper 고깔 sits on the crown above the hairline (brow, ears and face clear); its hooked tip is out of frame
    s += shake(X, fillP('M -50,-27.4 C -40,-44 -28,-66 -14,-90 C -4,-70 12,-52 26,-36.6 C 8,-30.4 -16,-25 -50,-27.4 Z', K.paper, OL2(2.6)) +
      fillP('M -14,-90 C -4,-70 12,-52 26,-36.6 C 22,-35 18,-33.8 14,-32.8 C 6,-50 -4,-70 -14,-90 Z', K.p300) +
      T([-6, -26.4, -9, -50, -12, -80], 1.4) + T([10, -31.6, 0, -54, -10, -82], 1.4) +
      ribbonP([[-49, -29.8], [-30, -27], [-8, -27.8], [12, -32], [25.6, -37.6]], 5.4, 5, { end: 'flat' }), [-12, -28]);
    return s;
  };

  // 서리: S 1.60, dy +10 — the 정자관's first tier shows at the top; the bundle strap (cyan) crosses the collar low left
  CHARS.seori.portrait = { headScale: 1.6, dx: 0, dy: 10 };
  CHARS.seori.pf = {
    over: { 9: [34.2, 7], 10: [34.4, 8.4], 11: [32, 10.2], 12: [29.6, 11.8], 13: [30.6, 14.6], 14: [29.2, 17.6], 15: [29.6, 19.8], 16: [27.6, 25], 17: [27.2, 31], 18: [25.6, 33], 19: [18, 34.6], 20: [8, 32.4], 21: [-8.4, 16.6] },
    nose: [0.2, 0.6], w: [2.8, 4.8],
    near: 'M 3,-3.4 C 5.4,-7 10.8,-7.4 13.2,-4 C 10.8,-1 5.6,-0.6 3,-3.4 Z', iris: [9.4, -3.9, 2, 2.4], lid: 2.2,
    far: 'M 21.8,-3.4 C 23.4,-5.8 26.2,-6 28,-4 C 26.6,-2.2 23.8,-1.8 21.8,-3.4 Z',
    brows: [[13, -10.6, 8.6, -11.6, 4.4, -11.2, 1.1], [21.6, -10.2, 25, -11, 28.6, -10.4, 1]],
    // small closed mouth, its level line 0.8 lower (long face)
    ml: [19.6, 18.6, 29.2, 17.6],
    mouth: (B, fine) => T([19.6, 18.6, 22.8, 19.1, 26.2, 19, 29.2, 17.6], 1.3 * B) + T([22.4, 21.8, 24.6, 22.2, 26.8, 21.6], 0.7 * B) + (fine ? T([25.8, 11.6, 25.9, 13, 26.2, 14.4], 0.5 * B) : ''),
    // victory: a shy small smile, the near eye a crescent
    vEyes: ['crescent', 'open'],
    smile: (B) => T([19.8, 18, 22.8, 19.4, 26.2, 19.3, 29.2, 17.6], 1.2 * B) + T([22.4, 21.8, 24.6, 22.2, 26.8, 21.6], 0.7 * B)
  };
  CHARS.seori.head = function (c, B, fine, X) {
    let s = fillP('M 30,-24 L -40,-24 C -42,-8 -38,8 -32,18 C -28,24 -24,28 -18,32 L -12.6,24 C -14.4,16 -15,9 -14.2,3 C -13.6,-2 -12.8,-6 -11.6,-8.6 L -6.4,-8.4 C -5.6,-12 -4.8,-15.6 -3.6,-18.6 C -1,-21.6 4,-23 10,-23.4 Z', K.ink);
    s += neckP(facePts(this.pf.over));
    // the bundle strap crosses the near collar inside the disc (review 1, F5)
    s += bodyG(X, garment({ over: ribbonP([[-18, 36], [-9, 39], [0, 42.5], [9, 46]], 5.2, 4.8, { end: 'flat' }) }));
    s += faceP(c, this.pf, B, fine, X && X.expr).s + earLit();
    // hair under the hat: sideburn in front of the ear, a narrow band over the forehead
    s += fillP('M 31,-21.6 C 26,-23.4 18,-23.8 10,-23 C 3,-22.2 -1.6,-20 -3.6,-17.4 C -4.8,-14.4 -5.6,-11.6 -6.4,-8.4 L -11.6,-8.6 L -12,-28 L 31,-28 Z', K.ink);
    // 정자관 (stylized, team Q5): first tier with a low obtuse gable, its far plane in ink.700, one paper rim stroke
    s += shake(X, fillP('M -46,-20 C -30,-17.8 -10,-18 4,-20.8 C 14,-22.8 24,-25.2 31.6,-27.8 L 29.6,-44 L 10,-46.4 L -8,-48.6 L -26,-46.4 L -44,-43 Z', K.ink, OL2(1.6)) +
      fillP('M 4,-20.8 C 14,-22.8 24,-25.2 31.6,-27.8 L 29.6,-44 L 10,-46.4 L 8,-44 Z', K.ink7) +
      T([-40, -19.4, -14, -18.4, 4, -21.4, 28, -27.2], 1.6, 'mid', K.p50) +
      fillP('M -32,-46.2 L -8,-48.6 L 14,-46 L 14,-66 L -6,-70 L -28,-66 Z', K.ink, OL2(1.6)) + fillP('M -8,-48.6 L 14,-46 L 14,-66 L -6,-70 Z', K.ink7), [-8, -20]);
    return s;
  };

  // 독: S 1.72, dy +2 — towel band (y −26 … −13) and its knot ends, the cyan strap on the shoulder low left
  CHARS.dok.portrait = { headScale: 1.72, dx: 0, dy: 2 };
  CHARS.dok.pf = {
    over: { 5: [31.8, -12.4], 6: [32, -8.4], 7: [30, -3.6], 8: [32.6, 3.4], 9: [34.8, 6.8], 10: [35, 8.6], 11: [32.4, 10.4], 12: [29.8, 12], 16: [28.2, 24.4], 17: [28, 29.6], 18: [26.4, 32.4], 19: [17, 34.4], 20: [6, 33.4], 21: [-11, 19], 22: [-14.4, 2] },
    nose: [0.6, 0.6], w: [3, 5.2],
    near: 'M 3.6,-3 C 6,-5 10.4,-5.2 12.6,-3.4 C 10.4,-1.8 6,-1.6 3.6,-3 Z', iris: [9, -3.4, 1.5, 1.6], lid: 2.6,
    far: 'M 22.2,-3.2 C 23.6,-4.6 26,-4.8 27.6,-3.6 C 26.2,-2.4 23.8,-2 22.2,-3.2 Z',
    brows: [[14.2, -7.6, 8.4, -10, 1.4, -9, 3], [21.2, -8, 25.6, -9.6, 30.8, -8.2, 2.6]],
    // beard areas as paper-shadow planes (upper lip, chin), never stipple
    planes: ['M 17.6,13.4 C 21,12.2 26,12.2 29.6,13.6 C 30,14.8 29.8,15.8 29.2,16.6 C 25.6,16 21.4,16.6 17.4,18 C 16.6,16.4 16.8,14.6 17.6,13.4 Z',
      'M 13,22.6 C 18,21.4 23.6,21.8 28.4,23.4 C 28.6,27.4 27.8,31 26,33.4 C 20,35 12,34.6 5,33.4 C 7,29 9.6,25.2 13,22.6 Z'],
    extra: (B) => T([4, -0.6, 8, 0.6, 12, -0.6], 0.7 * B) + T([2.8, -2.4, 1, -1.8, -1, -0.6], 0.7 * B) + T([3, -3.8, 1, -4.6, -1, -5.2], 0.7 * B) + T([25.6, 10, 20.6, 13.8, 16.4, 20.4], 1 * B),
    ml: [15.8, 18.8, 29.6, 17.6],
    mouth: (B) => T([15.8, 18.8, 20.6, 19.6, 26, 19.4, 29.6, 17.6], 1.7 * B) + T([20.4, 22.4, 23.4, 23, 26.6, 22.2], 0.8 * B),
    // victory: head thrown back laughing — open ink mouth with the upper teeth as a paper band, both eyes closed crescents
    vEyes: ['arc', 'arc'],
    smile: (B) => fillP('M 15.6,18 C 20,17.2 26,17 29.8,17 C 29.2,23.6 24,25.4 19.6,23.2 C 17.6,22 16.2,20.2 15.6,18 Z', K.ink) +
      fillP('M 16.8,18.4 C 21,17.8 26,17.6 29.2,17.6 L 29,19 C 25.6,19.2 21,19.4 17.2,19.8 Z', K.p50)
  };
  CHARS.dok.vRot = -6;
  CHARS.dok.head = function (c, B, fine, X) {
    let s = fillP('M 31,-20 C 30,-32 20,-42 4,-43.4 C -14,-45 -30,-38 -38,-24 C -43,-12 -42,4 -37,14 C -34,20 -30,25 -25,29 L -15,24 C -16.4,16 -16.8,9 -16,3 C -15.4,-2 -14.6,-6 -13.4,-8.6 L -7.4,-8.4 C -6.4,-11 -5.4,-13 -4,-14.6 L 30,-14 Z', K.ink);
    s += T([-14, -38, -30, -26, -32, -6], 2.4, 'mid', K.p50);
    s += neckP(facePts(this.pf.over));
    // the strap over the near shoulder, its centre line inside the disc (review 1, F5)
    s += bodyG(X, garment({ over: ribbonP([[-24, 30], [-16, 36], [-7, 41], [3, 45]], 7.4, 6.8, { end: 'flat' }) }));
    s += faceP(c, this.pf, B, fine, X && X.expr).s + earLit(-1.2, 0.6);
    // the towel: paper band round the head, folds, knot on the near side behind the temple with two short ends
    s += shake(X, fillP('M -16,-18.6 L -26.6,-27.6 L -28,-22 Z', K.paper, OL2(2)) + fillP('M -16,-17.4 L -28.6,-11 L -25.4,-16.4 Z', K.paper, OL2(2)), [-16, -18]);
    s += fillP(strip([[31.6, -19.6], [20, -20.4], [8, -20], [-4, -17.8], [-14, -17.4]], [13, 13, 12.6, 11.6, 10.6]), K.paper, OL2(2.2));
    s += T([31, -16.4, 12, -16.2, -10, -14.6], 1) + T([30, -22.8, 10, -23.2, -10, -20.4], 1);
    s += `<ellipse cx="-16.4" cy="-17.6" rx="4.6" ry="5.4" fill="${K.paper}" ${OL2(2)}/>` + T([-18, -20, -16, -17.6, -17.4, -14.6], 0.9);
    return s;
  };

  // 휘: S 1.66, dx +4, dy +2 — the mane swept back with long paper sheen strokes, gathered by a cyan cord at the back
  CHARS.hwi.portrait = { headScale: 1.66, dx: 4, dy: 2 };
  CHARS.hwi.pf = {
    over: { 8: [32.8, 2.8], 9: [34.4, 7.4], 10: [34.2, 9], 11: [31.8, 10.4], 17: [27.8, 29.6], 18: [26.2, 31.8], 19: [18, 33.4], 20: [8, 31.6], 21: [-9, 16] },
    nose: [0.4, 0.8], w: [3, 5.2],
    near: 'M 3,-3 C 5.6,-5.4 10.6,-5.6 13.2,-3.6 C 10.6,-1.8 5.6,-1.4 3,-3 Z', iris: [9.4, -3.6, 1.6, 1.8], lid: 2.6,
    far: 'M 21.8,-3.2 C 23.4,-4.8 26,-5 27.8,-3.6 C 26.4,-2.2 23.8,-1.8 21.8,-3.2 Z',
    brows: [[14.6, -7.2, 8.4, -10.6, 1.6, -11.6, 2.4], [20.8, -7.8, 25.6, -10.6, 30.8, -11, 2.2]],
    // cheek shade: a wedge growing out of the side plane under the cheekbone and closing to a point ≈ 7 u short of the
    // near mouth corner — never an even band (review 1, F2; brief §13-7)
    planes: ['M -2.8,3.6 C 2.4,5 7.4,8.4 12.6,13.4 C 8.6,12 3.4,11.6 -3.4,12.6 Z'],
    // hooked bridge: a hump on the lower bridge line
    bridge: (B) => T([25.4, 1.2, 28.4, 1.2, 30.6, 3.2, 32.6, 6.6], 1 * B),
    // double-lid line and one frown line at the glabella
    // the frown crease is a thin line rising from the near brow's inner end (a short dab read as a dot on the brow)
    extra: (B) => T([2.2, -4.8, 7.6, -7.8, 13.8, -5.6], 1 * B) + T([15.6, -7.6, 16.8, -10, 16.6, -12.8], 0.7 * B),
    ml: [17.6, 18.2, 29.2, 16.8],
    mouth: (B, fine) => T([17.6, 18.2, 21.6, 18.4, 26.4, 18.2, 29.2, 16.8], 1.8 * B) + T([21.6, 21.4, 24.4, 21.8, 27, 21], 0.8 * B) + (fine ? T([25.8, 11.8, 25.9, 13.2, 26.2, 14.6], 0.5 * B) : ''),
    // victory: head back −8°, eyes shut, a proud closed smile with the near corner up
    vEyes: ['arc', 'arc'],
    smile: (B) => T([17.6, 17.2, 21.6, 18.6, 26.4, 18.4, 29.2, 16.8], 1.8 * B) + T([18.2, 17.3, 17.2, 16.4, 16.8, 15.2], 1 * B) + T([21.6, 21.4, 24.4, 21.8, 27, 21], 0.8 * B)
  };
  CHARS.hwi.vRot = -8;
  CHARS.hwi.head = function (c, B, fine, X) {
    // mane behind the face: swept back, gathered at the back of the head, splitting into brush-tip ends out of frame
    let s = fillP('M 30,-22 C 26,-36 12,-45 -6,-45 C -24,-45 -38,-38 -48,-28 L -70,-36 L -58,-22 L -78,-18 L -58,-8 L -74,0 L -52,2 C -44,12 -36,22 -26,30 L -12,24 C -14,16 -14.6,8 -14,0 L -13.6,-14 Z', K.ink);
    s += T([-8, -40, -32, -34, -60, -26], 3.2, 'mid', K.p50) + T([-10, -32, -30, -22, -54, -14], 2.2, 'mid', K.p50) + T([-14, -24, -28, -10, -48, -2], 1.9, 'mid', K.p50);
    s += neckP(facePts(this.pf.over)) + bodyG(X, garment());
    s += faceP(c, this.pf, B, fine, X && X.expr).s;
    // front locks sweeping back off the forehead, covering the ear
    s += fillP('M 31.4,-19 C 30,-26 24,-30.4 16,-30.8 C 8,-31 2,-28.2 -2,-23 C -5,-18 -7,-10 -8,-2 C -8.6,4 -10,10 -12,14 L -20,14 L -20,-44 L 30,-44 Z', K.ink);
    s += T([10, -32, -2, -26, -8, -10], 2, 'mid', K.p50) + T([22, -32, 8, -36, -6, -34], 1.9, 'mid', K.p50);
    // the cyan cord wrapping the gathered mane at the back of the head, over the mane and clear of the front locks
    // (x ≤ −20) so both turns sit inside the disc (review 1, F5)
    s += ribbonP([[-25, -22], [-26, -10], [-25.6, 2]], 6, 6, { end: 'flat' }) + ribbonP([[-30.6, -21], [-31.6, -9.6], [-31, 1.4]], 5, 5, { end: 'flat' });
    return s;
  };

  // 령 (A-type): S 1.72, dx +4 — the fringe's cast shadow wraps the form; cyan fletchings rise at the lower left
  CHARS.ryeong.portrait = { headScale: 1.72, dx: 4, dy: 0 };
  const RYEONG_FAR = 'M 21.8,-3.2 C 23.4,-4.6 26,-4.8 27.8,-3.6 C 26.4,-2.4 23.8,-2 21.8,-3.2 Z';
  CHARS.ryeong.pf = {
    over: { 8: [32.6, 2.6], 9: [34, 6.6], 10: [34.2, 7.8], 17: [27, 28], 18: [25.6, 30.2], 19: [18.6, 31.8], 20: [9, 29.2], 21: [-8, 13.4] },
    w: [2.8, 4.6],
    // ONE shadow mass: its lower edge turns at the nasal root, under the near eye and at the cheekbone (≤ 8 u straight runs)
    shade: 'M -40,-50 L 46,-50 L 46,-24 L 26,-24 C 24.6,-19.6 23,-14 21.6,-9.4 C 21,-7.6 20.4,-6.2 19.6,-5 C 18.4,-2.8 17,-0.9 15.4,0.4 C 11.4,1.8 7,2.6 3,3.2 C 0.6,4 -1.6,5.4 -3.6,7.2 C -5.6,9.6 -7.4,12.2 -9,15 L -40,18 Z',
    far: RYEONG_FAR,
    brows: [[22, -8.8, 25.8, -9.4, 30.6, -9, 1.8]],
    // the worn plane of lowhp runs along the shadow's lower edge (as 결's WORN_TONE)
    worn: 'M 15.4,0.4 C 11.4,1.8 7,2.6 3,3.2 C 0.6,4 -1.6,5.4 -3.6,7.2 L -0.8,7.4 C 1.2,6 3.6,5.2 6.8,4.8 C 10.4,4.4 13.4,3.2 16.4,1.6 Z',
    // A-type eyes (as 결's eyes34): in the shadow the near eye is a paper lower-lid stroke and one glint; victory lifts the
    // fringe and its shadow so the near eye shows as a lit almond (brief §6.6)
    eyes: (c, B, expr) => {
      let near;
      if (expr === 'victory') near = litEye(c, 'M 2.6,-3.6 C 5.4,-6.6 10.6,-7 13.4,-4.2 C 10.8,-1.8 5.6,-1.4 2.6,-3.6 Z', [9.6, -4, 1.8, 2.2], 2.2, B, 'open');
      else if (expr === 'focus') near = T([2.8, -1.6, 7.6, -0.6, 13.2, -2.4], 1.4 * B, 'mid', K.p50) + `<ellipse cx="9.2" cy="-2.5" rx="2.4" ry="0.6" fill="${K.p50}"/>`;
      else if (expr === 'hurt') near = T([3, -2.4, 8, -0.6, 13.4, -3.4], 1.8 * B, 'mid', K.p50) + T([3.6, -5, 8.2, -4, 13, -4.2], 1.1 * B, 'mid', K.p50);
      else {
        const low = expr === 'lowhp', wake = expr === 'awakened', gx = 9.4, gy = low ? -2.3 : -2.8, rx = low ? 0.9 : wake ? 1.3 : 1.1, ry = low ? 1 : wake ? 1.6 : 1.4;
        near = T([2.8, low ? -1.2 : -1.6, 7.6, low ? -0.2 : -0.6, 13.2, low ? -2 : -2.4], 1.1 * B, 'mid', K.p50);
        // awakened, in the shadow: the glint bleeds back as a cyan · glow thread (the shadow is its ink), no blur
        if (wake) near += T([gx, gy, 0, gy - 3, -14, gy + 1], 2.2, 'start', K.ally) + T([gx, gy, -2, gy + 2, -12, gy + 8], 1.4, 'start', K.allyG);
        near += `<ellipse cx="${gx}" cy="${gy}" rx="${rx}" ry="${ry}" transform="rotate(-20 ${gx} ${gy})" fill="${wake ? K.ally : K.p50}"/>`;
      }
      const fk = { focus: 'narrow', hurt: 'shut', lowhp: 'half' }[expr] || 'open';
      return near + litEye(c, RYEONG_FAR, [25.4, -3.4, 1.1, 1.5], 2.2, B, fk, true, expr === 'awakened');
    },
    ml: [18, 18, 29.2, 16.9],
    mouth: (B, fine) => T([18, 18, 22, 18.3, 26.4, 18.2, 29.2, 16.9], 1.3 * B) + T([22, 21, 24.4, 21.3, 26.8, 20.8], 0.7 * B) + (fine ? T([25.6, 11.4, 25.7, 12.8, 26, 14.2], 0.5 * B) : ''),
    // victory: only the near corner lifts
    smile: (B) => T([18, 17.6, 22, 18.4, 26.4, 18.2, 29.2, 16.9], 1.3 * B) + T([18.4, 17.7, 17.4, 16.8, 17.1, 15.6], 0.9 * B) + T([22, 21, 24.4, 21.3, 26.8, 20.8], 0.7 * B)
  };
  CHARS.ryeong.head = function (c, B, fine, X) {
    // three spirit fletchings (cyan flames) rising from the quiver behind the shoulder, then the hair pulled back tight
    // two of them stand in the window left of the neck (x −31 … −22, y 14 … 36), the third further back
    let s = bodyG(X, ribbonP([[-35.4, 62], [-36, 36], [-35, 12], [-39, -4]], 7, 3, { tipLen: 7 }) + ribbonP([[-30, 62], [-30.6, 36], [-30, 14], [-33.6, -10]], 8, 3, { tipLen: 8 }) +
      ribbonP([[-24.6, 62], [-25.6, 36], [-25, 16], [-28, -6]], 8, 3, { tipLen: 8 }));
    // the hair is pulled up into the high ponytail: the back hair ends at the nape (y ≈ 16), not on the shoulder
    s += fillP('M 30,-24 C 26,-38 10,-45 -8,-45 C -26,-45 -38,-34 -41,-18 C -42,-6 -39,4 -32,12 C -27,16 -20,18 -14,16 L -13.6,-14 Z', K.ink);
    s += T([-12, -40, -30, -30, -36, -8], 2.2, 'mid', K.p50);
    s += neckP(facePts(this.pf.over)) + bodyG(X, garment());
    s += faceP(c, this.pf, B, fine, X && X.expr).s;
    // fringe: pointed locks ending above y −6, merging into their cast shadow (one ink mass); victory: blown up off the eye
    s += X && X.expr === 'victory'
      ? fillP('M 31.4,-19.6 C 30,-28 22,-33 12,-33.6 C 2,-34 -6,-30 -10,-24 C -12,-20 -13,-16 -13.6,-12 L -8,-16 L -6,-19 L -1,-20 L 3,-24.4 L 7,-21.6 L 11,-26 L 15,-23.4 L 18.6,-27.6 L 22,-25.4 L 26,-26.4 C 28,-24 30,-21.6 31.4,-19.6 Z', K.ink)
      : fillP('M 31.4,-19.6 C 30,-28 22,-33 12,-33.6 C 2,-34 -6,-30 -10,-24 C -12,-20 -13,-16 -13.6,-12 L -8,-14 L -4,-8.4 L 0,-15 L 4.4,-6.6 L 8,-14.6 L 12.6,-7.4 L 15,-15.6 L 19.4,-9 L 21,-18 L 25,-14 L 26,-24 C 28,-22.4 30,-21 31.4,-19.6 Z', K.ink);
    return s;
  };

  // 월: S 1.66, dx +6, dy +1 (brief dy 0 put the near eye 14.5 above the disc centre, past the ±14 limit) — bun high at
  // the back crossed by a long pin (small crescent at its end), two cyan 댕기
  CHARS.wol.portrait = { headScale: 1.66, dx: 6, dy: 1 };
  CHARS.wol.pf = {
    over: { 8: [31.6, 3.6], 9: [33.2, 6.4], 10: [33.4, 7.6], 11: [31.4, 9], 13: [30.6, 13.6], 15: [29.8, 18.8], 16: [27, 23], 17: [26.2, 27.6], 18: [24.6, 29.6], 19: [18.4, 30.8], 20: [9, 29], 21: [-8.8, 13.6] },
    nose: [-0.8, -0.2], w: [2.6, 4.4],
    near: 'M 2.4,-2.6 C 4.8,-5.8 10.4,-6.4 13.2,-4 C 10.6,-2 5.4,-1.2 2.4,-2.6 Z', iris: [9.2, -3.8, 1.8, 2.1], lid: 2.2,
    far: 'M 21.8,-3.4 C 23.4,-5.2 26.2,-5.4 28,-3.6 C 26.6,-2.2 23.8,-2 21.8,-3.4 Z',
    brows: [[13.8, -10, 8, -12, 2, -10.4, 1.1], [21.6, -9.8, 25.2, -11, 29.6, -10, 1]],
    planes: ['M 21.4,19.4 C 23.8,21.4 26.4,21.2 28.4,19 L 28,20.6 C 26.2,22.8 23,22.8 21.4,19.4 Z'],
    // drooping outer corner flicked down
    extra: (B) => T([2.2, -2.4, 0.8, -1.2, 0, 0.4], 1 * B, 'start'),
    ml: [19.6, 17.8, 29.2, 16.9],
    mouth: (B, fine) => T([19.6, 17.8, 22.6, 18.6, 26, 18.4, 29.2, 16.9], 1.3 * B) + T([22.4, 16.4, 24.6, 15.8, 27.2, 16.2], 0.6 * B) + (fine ? T([25, 10.8, 25.1, 12.2, 25.4, 13.8], 0.5 * B) : ''),
    // victory: both eyes closed as crescent moons, a still smile
    vEyes: ['arc', 'arc'],
    smile: (B) => T([19.6, 17.4, 22.6, 18.8, 26, 18.6, 29.2, 16.9], 1.3 * B) + T([22.4, 16.2, 24.6, 15.6, 27.2, 16], 0.6 * B)
  };
  CHARS.wol.head = function (c, B, fine, X) {
    // 댕기 (cyan) hanging under the bun behind the neck, the bun and the back hair
    let s = ribbonP([[-30, -14], [-33, 8], [-36, 30], [-38, 50]], 5, 4.4, { end: 'fork' }) + ribbonP([[-22, -12], [-23.4, 10], [-24.4, 32], [-25, 50]], 5, 4.4, { end: 'fork' });
    s += fillP('M 29,-24 C 24,-38 8,-44 -8,-43.4 C -24,-42.6 -36,-34 -40,-20 C -42,-8 -40,4 -34,14 C -30,20 -24,24 -18,26 L -12,22 C -14,14 -14.6,8 -14,0 L -13.6,-14 Z', K.ink);
    s += `<circle cx="-30" cy="-26" r="12.4" fill="${K.ink}"/>` + T([-38, -32, -32, -38, -22, -34], 1.8, 'mid', K.p50);
    s += neckP(facePts(this.pf.over)) + bodyG(X, garment());
    s += faceP(c, this.pf, B, fine, X && X.expr).s;
    // centre-parted front hair, the near side swept over the ear back to the bun
    s += fillP('M 31.4,-19.4 C 30,-24 27,-26.8 23.6,-28 C 21.4,-28.8 19.8,-30.4 18.8,-32.4 C 16.8,-29.4 13.4,-27.6 8.6,-26.8 C 2.4,-25.6 -2.4,-21.4 -5.2,-14.6 C -7,-9.6 -8,-3.6 -9.6,2 C -11,6 -13,9 -16,11 L -26,0 L -24,-44 L 28,-44 Z', K.ink);
    s += T([-4, -22, -12, -12, -20, -2], 2, 'mid', K.p50) + T([14, -30, 4, -28, -4, -21], 1.9, 'mid', K.p50);
    // the long pin crossing the bun and running out on both sides; a small paper crescent on its back end only
    s += shake(X, fillP(strip([[-50, -34], [-8, -20.6]], [3, 2.4], { sharp: true }), K.paper, OL2(1.4)) +
      fillP('M -50,-40.4 C -56,-38.6 -56.6,-30.4 -51,-28.4 C -53.4,-31 -53.6,-37 -50,-40.4 Z', K.paper, OL2(1.4)), [-30, -26]);
    return s;
  };

  // ---- victory gestures, in the 160 box (drawn over the head; every part ≥ 8 u from temple, brow, nose tip and chin,
  // nothing crosses the face; R4 K0 F3). The head sits 13 further left for victory, as 결's (k-hero.js:1577) ----
  // 단 flicks the knife fan wide open (160°) from the lower right: the rivet and the hand stay behind the rim, the seven
  // knife teeth fan up over the collar, every tip ≥ 8 u (× S) off the mouth corner, the chin and the jaw
  CHARS.dan.victory = () => {
    // rivet (135, 141): every knife tip stays ≥ 8 u × 1.72 = 13.76 from the turned chin front (≈ (97.1, 125.1)) (review 2, B2)
    const piv = [135, 141], r = 27, n = 7, tips = [], edge = [];
    for (let k = 0; k < n; k++) tips.push(-40 + (-200 + 40) * k / (n - 1));
    tips.forEach((a, k) => { edge.push(polar(piv, r, a)); if (k < n - 1) edge.push(polar(piv, r * 0.79, (a + tips[k + 1]) / 2)); });
    let s = fillP(poly([piv].concat(edge)), K.paper, OL2(2.4));
    // pleats: every other panel in paper shade, ink ribs to each knife tip, heavier guard sticks at both edges
    for (let k = 1; k < n - 1; k += 2) s += fillP(poly([piv, polar(piv, r - 1.2, tips[k]), polar(piv, r * 0.79 - 1, (tips[k] + tips[k + 1]) / 2), polar(piv, r - 1.2, tips[k + 1])]), K.p300);
    tips.forEach((a, k) => { s += line([polar(piv, 4, a), polar(piv, r - 2.4, a)], k === 0 || k === n - 1 ? 2.2 : 1.1); });
    return s;
  };
  // 노을 raises two fingers held together (검결, never a V) from the lower right; a short cyan thread curls up from the
  // joined fingertips away from the face (review 2, B1). Fist, fingers and thread stay ≥ 8 u (× S) off the nose tip, the
  // mouth corner and the chin
  CHARS.noeul.victory = () => {
    let s = fillP(strip([[134, 132], [150, 150], [168, 170]], [15, 21, 27]), K.paper, OL2(2.4)) + fillP('M 131.4,140.6 L 141.6,130.2 L 145,133.6 L 134.8,144.2 Z', K.ink);
    // middle finger behind, index in front: the index's own edge is the only line between them (no gap, tips gather)
    s += fillP(strip([[131.4, 121], [130.9, 109.9], [130.4, 98.8]], [5.6, 5, 4.4], { tip: [[130.3, 97.1]] }), K.paper, OL2(2.2));
    s += fillP(strip([[126.6, 121], [126.4, 109.8], [126.2, 98.6]], [5.6, 5, 4.4], { tip: [[126.2, 96.9]] }), K.paper, OL2(2.2));
    s += fillP('M 122,125 C 121.8,120.8 124.6,118.4 128.6,118.4 L 134,118.6 C 137.8,118.8 139.6,121.6 139.2,125.4 C 138.8,130 136,134.4 131,135 C 126,135.6 122.2,131.6 122,125 Z', K.paper, OL2(2.2));
    // the curled fingers' knuckles and the thumb laid across them
    s += T([126.4, 127.6, 130, 126.6, 134, 127.4], 1.1) + T([123, 129.8, 126.8, 125.6, 131, 124.4], 1.4, 'end');
    return s + thread([[128.3, 96], [127.4, 91.4], [130.6, 88], [134.6, 88.6], [136, 92]], 2);
  };
  // 서리: the corner of a bound book rises at the lower right: its top page block in paper shade, the paper cover with an
  // empty title slip at its upper left (no writing), corner ≥ 8 u (× S) off the chin and the mouth corner
  CHARS.seori.victory = () => {
    const C = [113, 116], u = [0.97, -0.243], v = [-0.2, 0.98], at = (a, b) => add(C, add(mul(u, a), mul(v, b)));
    return fillP(poly([at(0, 0), at(70, 0), at(70, 75), at(0, 75)]), K.paper, OL2(2.4)) + fillP(poly([at(0, 0), at(70, 0), at(70, 5), at(0, 5)]), K.p300) +
      line([at(1.4, 1.8), at(70, 1.8)], 0.7) + line([at(1, 3.5), at(70, 3.5)], 0.7) + line([at(0, 5), at(70, 5)], 1.4) +
      fillP(poly([at(5, 10), at(13, 10), at(13, 36), at(5, 36)]), K.p50, `stroke="${K.ink}" stroke-width="1.2" stroke-linejoin="round"`);
  };
  // 휘: the big brush has just swept an arc over the top right of the disc: a swelling ink stroke with two dry-brush
  // streaks, split at its end, a few drops flung on along the swing. Start ≥ 8 u (× S) off the forehead, the whole arc
  // clear of brow and nose tip
  CHARS.hwi.victory = () => {
    const H = hk(), r0 = 62, a0 = -64, a1 = 4, A = (t) => (a0 + (a1 - a0) * t) * Math.PI / 180, rad = Math.PI / 180;
    const w = (t) => 1.4 + 9 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.75);
    let s = fillP(H.brushArc(80, 80, r0, r0, A(0), A(0.87), w, 40), K.ink);
    // the dry, split end: two thin tails carry the arc on to a1
    s += fillP(H.brushArc(80, 80, r0 + 2.2, r0 + 2.2, A(0.84), A(1), (t) => 2.6 * (1 - t) + 0.3, 12), K.ink) + fillP(H.brushArc(80, 80, r0 - 2.4, r0 - 2.4, A(0.84), A(0.97), (t) => 2.4 * (1 - t) + 0.3, 12), K.ink);
    // one dry-brush streak (paper) inside the thick middle, along the stroke
    s += fillP(H.brushArc(80, 80, r0 + 1.2, r0 + 1.2, A(0.46), A(0.84), (t) => 0.9 * Math.sin(Math.PI * t), 16), K.p50);
    return s + H.splat(80 + 63 * Math.cos(10 * rad), 80 + 63 * Math.sin(10 * rad) + 4, 3, 5, 9, K.ink, Math.PI / 2 + 0.2);
  };
  // 월: the ring rises into the disc from the lower right, seen face on (its centre and the hands behind the rim): paper
  // core on ink, the eclipse crescent swelling on the middle of the visible arc; ≥ 8 u (× S) off the chin
  CHARS.wol.victory = () => {
    const O = [156, 160], R = 48, P = []; for (let k = 0; k <= 24; k++) P.push(polar(O, R, 176 + 98 * k / 24));
    const C = P.slice(7, 17), w = (i) => 0.5 + 2.6 * Math.pow(Math.sin(Math.PI * i / 9), 0.8), nn = (i) => norm(sub(C[i], O));
    return line(P, 11, K.ink) + line(P, 6, K.paper) + fillP(poly(C.map((p, i) => add(p, mul(nn(i), w(i)))).concat(C.map((p, i) => sub(p, mul(nn(i), w(i)))).reverse())), K.ink);
  };

  // head angle and offset per expression: 결's EX table (k-hero.js:1571-1578); victory turns 독 −6° and 휘 −8° (§6)
  const EXPR = Object.freeze({
    calm: { rot: 0, dx: 0, dy: 0 }, focus: { rot: 7, dx: 2, dy: 2 }, hurt: { rot: -10, dx: -6, dy: -2 },
    lowhp: { rot: 8, dx: 0, dy: 4 }, awakened: { rot: -3, dx: 0, dy: -1 }, victory: { rot: -4, dx: -13, dy: 0 }
  });
  // portrait(id, expr, opts) → 160×160 box SVG. opts: {frame:true, bg:true, mono:false}
  NS.portrait = function (id, expr, opts) {
    opts = opts || {};
    expr = expr == null ? 'calm' : expr;
    checkId('portrait', id);
    if (!EXPRS.includes(expr)) throw new Error(`PN.characters.portrait: unknown expression "${expr}"`);
    if (id === 'gyeol') { const s = PN.heroKit.portrait(expr, opts); return opts.mono ? mono(s) : s; }
    if (!DRAWN_EXPRS.includes(expr)) throw new Error(`PN.characters.portrait: "${expr}" is not drawn`);
    const H = hk(), C = CHARS[id], M = C.portrait, E = EXPR[expr], S = M.headScale;
    const rotE = expr === 'victory' && C.vRot != null ? C.vRot : E.rot, X = { expr, rot: rotE, S };
    // halftone pitch 6 (≥ 3 px at the 84 px HUD); the face and neck use flat tones only
    const c = H.Ctx({ pitch: 6, rough: 0.6, seed: 11 }), clip = c.clip('M 80,6 A 74 74 0 1 1 79.9,6 Z');
    let bg = '';
    if (opts.bg !== false) {
      // backgrounds read the same as 결's (k-hero.js:1588-1596; brief §5.5): paper and the ink.100 halftone vignette (§13-2)
      bg = `<rect width="160" height="160" fill="${K.paper}"/>` + PN.halftone(0, 0, 160, 160, 6, (x, y) => { const d = Math.hypot(x - 96, y - 70); return Math.max(0, Math.min(1.9, (d - 40) / 30)); }, K.ink1, 45);
      if (expr === 'awakened') bg += [0, 1, 2].map((i) => `<path d="${H.brushArc(80, 88, 60 + i * 8, 60 + i * 8, -2.6 + i * 0.7, -0.4 + i * 0.9, (t) => 1 + 5 * Math.sin(Math.PI * t))}" fill="${K.ally}" stroke="${K.ink}" stroke-width="1.6"/>`).join('');
      if (expr === 'hurt') bg = `<rect width="160" height="160" fill="${K.ink}"/>` + H.splat(136, 36, 9, 10, 7, K.p50) + H.splat(20, 112, 8, 8, 3, K.p50) + `<path d="M 160,40 L 136,62 L 146,68 L 128,90 M 0,60 L 30,76 L 22,84 L 48,100" fill="none" stroke="${K.p50}" stroke-width="2.4"/>`;
      if (expr === 'focus') bg += PN.speedLines(104, 90, 56, 130, 60, 13, K.ink, 0, Math.PI * 2, 0.012);
      if (expr === 'lowhp') bg += `<rect width="160" height="160" fill="${c.pat('d20')}"/>`;
      if (expr === 'victory') {
        const r = PN.rng(5);
        for (let i = 0; i < 12; i++) {
          const x = 16 + r() * 60, y = 16 + r() * 60, q = 2 + r() * 3;
          bg += `<path d="M ${f(x)},${f(y - q * 2)} L ${f(x + q * 0.6)},${f(y - q * 0.6)} L ${f(x + q * 2)},${f(y)} L ${f(x + q * 0.6)},${f(y + q * 0.6)} L ${f(x)},${f(y + q * 2)} L ${f(x - q * 0.6)},${f(y + q * 0.6)} L ${f(x - q * 2)},${f(y)} L ${f(x - q * 0.6)},${f(y - q * 0.6)} Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.2"/>`;
        }
      }
    }
    const hx = 64.08 + M.dx + E.dx, hy = 72 + M.dy + E.dy;
    let fig = `<g transform="translate(${f(hx)} ${f(hy)}) rotate(${rotE} 11 4) scale(${S})">${C.head(c, 1.25, true, X)}</g>`;
    if (expr === 'victory' && C.victory) fig += C.victory(c);
    if (expr === 'hurt') fig += H.splat(108, 124, 5, 7, 12, K.ink, 1.2);
    let s = `<g clip-path="url(#${clip})">${bg}<g ${c.rough}>${fig}</g></g>`;
    if (opts.frame !== false) {
      s += `<circle cx="80" cy="80" r="74" fill="none" stroke="${K.ink}" stroke-width="6"/><circle cx="80" cy="80" r="78.5" fill="none" stroke="${K.p50}" stroke-width="2.4"/>`;
      if (expr === 'lowhp') s += `<circle cx="80" cy="80" r="74" fill="none" stroke="${K.hostileD}" stroke-width="2.4" stroke-dasharray="14 6"/>`;
      if (expr === 'awakened') s += `<circle cx="80" cy="80" r="74" fill="none" stroke="${K.ally}" stroke-width="2.2" stroke-dasharray="6 5"/>`;
    }
    if (opts.mono) s = mono(s);
    return wrapUsed(c, s);
  };
  NS.placePortrait = function (id, expr, cx, cy, size, opts) {
    const s = (size || 84) / 160;
    return `<g transform="translate(${f(cx - 80 * s)} ${f(cy - 80 * s)}) scale(${f(s)})">${NS.portrait(id, expr, opts)}</g>`;
  };
  const exprsOf = (id) => (id === 'gyeol' ? EXPRS : DRAWN_EXPRS);
  // portraitSheet(id, opts) → every drawn expression in one row of 160 cells. opts as portrait
  NS.portraitSheet = function (id, opts) {
    checkId('portraitSheet', id);
    return `<g>${exprsOf(id).map((e, i) => `<g transform="translate(${i * 160} 0)">${NS.portrait(id, e, opts)}</g>`).join('')}</g>`;
  };
  // portraitLineup(expr, opts) → 결 + the seven, one row of 160 cells (1280 × 160)
  NS.portraitLineup = function (expr, opts) {
    return `<g>${ALL.map((id, i) => `<g transform="translate(${i * 160} 0)">${NS.portrait(id, expr || 'calm', opts)}</g>`).join('')}</g>`;
  };

  // ---- review sheets ----
  const statesOf = (id) => (id === 'gyeol' ? STATES : DRAWN_STATES);
  // sheet(id, opts) → every drawn state, one row each (idle 6 · run 8 · …), 96 cells. opts: {mono, ground, hitbox}
  NS.sheet = function (id, opts) {
    opts = opts || {};
    checkId('sheet', id);
    const rows = statesOf(id), W = 8 * 96, Hh = rows.length * 96;
    let s = opts.ground ? `<rect x="0" y="0" width="${W}" height="${Hh}" fill="${opts.ground}"/>` : '';
    rows.forEach((state, r) => {
      for (let i = 0; i < SPRITE.frames[state]; i++) {
        s += `<g transform="translate(${i * 96} ${r * 96})">${NS.sprite(id, state, i, { ring: false, shadow: false, mono: opts.mono, hitbox: opts.hitbox })}</g>`;
      }
    });
    return `<g>${s}</g>`;
  };
  // lineup(opts) → 결 + the seven in one row (96 cells, 768×96). opts: {mono, state:'idle', frame:0, ground:'#hex'|null,
  // enemies: chapter|null (that chapter's stalker and warden in the game LOD to the right, for value contrast)}
  NS.lineup = function (opts) {
    opts = opts || {};
    const state = opts.state || 'idle', frame = opts.frame || 0, en = opts.enemies && PN.enemies ? opts.enemies : null;
    const W = 768 + (en ? 150 : 0);
    let s = opts.ground ? `<rect x="0" y="0" width="${W}" height="96" fill="${opts.ground}"/>` : '';
    ALL.forEach((id, i) => { s += `<g transform="translate(${i * 96} 0)">${NS.sprite(id, state, frame, { ring: false, shadow: false, mono: opts.mono, hitbox: opts.hitbox })}</g>`; });
    if (en) {
      // feet on the same ground line (y 75): stalker pivot (100, 98) feet 146 at 0.25, warden pivot (110, 136) feet 206 at 0.4
      let e = `<g transform="translate(${f(768 + 34 - 100 * 0.25)} ${f(75 - 146 * 0.25)}) scale(0.25)">${PN.enemies.draw(en, 'stalker', { lod: 'game', shadow: false })}</g>`;
      e += `<g transform="translate(${f(768 + 104 - 110 * 0.4)} ${f(75 - 206 * 0.4)}) scale(0.4)">${PN.enemies.draw(en, 'warden', { lod: 'game', shadow: false })}</g>`;
      s += opts.mono ? mono(e) : e;
    }
    return `<g>${s}</g>`;
  };
  // pivot-anchored placement, as PN.heroKit.placeSprite / placePortrait
  NS.placeSprite = function (id, state, frame, x, y, s, opts) {
    s = s || 1;
    return `<g transform="translate(${f(x - SPRITE.pivot[0] * s)} ${f(y - SPRITE.pivot[1] * s)}) scale(${f(s)})">${NS.sprite(id, state, frame, opts)}</g>`;
  };
  // measure(id, state, frame) → review only (needs a page: it hit-tests the drawing with document.elementFromPoint).
  // Area shares of the fill (noOutline, no ring, no shadow, as API-hero §2): paper · ink · cyan · other, in %, plus the
  // painted bounds in pivot units. Nothing calls it at load time and no bake uses it.
  NS.measure = function (id, state, frame, opts) {
    opts = opts || {};
    const S = opts.scale || 4, svgNS = 'http://www.w3.org/2000/svg';
    const m = NS.sprite(id, state || 'idle', frame || 0, { ring: false, shadow: false, halo: false, noOutline: !opts.outline });
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:0;top:0;margin:0;padding:0;z-index:2147483647;line-height:0';
    host.innerHTML = `<svg xmlns="${svgNS}" width="${96 * S}" height="${96 * S}" viewBox="0 0 96 96" style="display:block">${m}</svg>`;
    document.body.appendChild(host);
    const cls = {};
    [[K.paper, 'paper'], [K.p50, 'paper'], [K.p300, 'paper'], [K.ink, 'ink'], [K.ink7, 'ink'], [K.ally, 'cyan'], [K.allyD, 'cyan'], [K.allyG, 'cyan']].forEach(([hex, k]) => {
      const n = parseInt(hex.slice(1), 16); cls[`rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`] = k;
    });
    const count = { paper: 0, ink: 0, cyan: 0, other: 0 }, cache = new Map();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let py = 0; py < 96 * S; py++) {
      for (let px = 0; px < 96 * S; px++) {
        const el = document.elementFromPoint(px + 0.5, py + 0.5);
        if (!el || !(el instanceof SVGGeometryElement)) continue;
        let e = cache.get(el);
        if (!e) { const cs = getComputedStyle(el); e = { fill: cs.fill, stroke: cs.stroke, inv: el.getScreenCTM().inverse() }; cache.set(el, e); }
        const p = new DOMPoint(px + 0.5, py + 0.5).matrixTransform(e.inv);
        const col = e.fill !== 'none' && el.isPointInFill(p) ? e.fill : e.stroke;
        count[cls[col] || 'other']++;
        const x = px / S - SPRITE.pivot[0], y = py / S - SPRITE.pivot[1];
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + 1 / S); y1 = Math.max(y1, y + 1 / S);
      }
    }
    host.remove();
    const tot = count.paper + count.ink + count.cyan + count.other || 1, pc = (n) => Math.round(n / tot * 1000) / 10;
    return { paper: pc(count.paper), ink: pc(count.ink), cyan: pc(count.cyan), other: pc(count.other), px: Math.round(tot / S / S), bounds: [f(x0), f(y0), f(x1), f(y1)] };
  };

  // ---- META[id] (brief §2), pivot units unless noted ----
  // eye: the sprite eye mark (A-type: the glint) centre. headTop: the highest painted point at idle f0 (fill, no outline).
  // extent: [x0, y0, x1, y1] union of the painted fill over all 21 frames (the outline adds ≈ 1.1 light side, ≈ 2.25
  // shade side, the 白邊 1.5 more). muzzle: the release point at throw f2 (below).
  // portrait: framing and faceBox [x, y, w, h] in the 160 box (head-local x −18 … 40, y −16 … 38) for the face crop.
  // measured with NS.measure (0.5 px grid, scale 2) over idle 6 · run 8 · throw 4 · hurt 3 (2nd delivery)
  const EXTENT = {
    dan: [-22, -43.5, 43.5, 15.5], noeul: [-22.5, -51, 43, 15.5], seori: [-20, -48, 36.5, 16], dok: [-25, -50, 32.5, 16],
    hwi: [-36, -51.5, 44, 15.5], ryeong: [-19, -46, 42.5, 16], wol: [-39.5, -52, 32, 16]
  };
  const HEAD_TOP = { dan: -41.5, noeul: -46.75, seori: -45.5, dok: -44.75, hwi: -49.75, ryeong: -42, wol: -41 };
  // muzzle: the release point at throw f2 (snap), given per character in the upper-body frame and carried through that
  // frame's pose (lean about (0, 1), bob), so it always matches the drawing:
  // 단 the fan rivet the daggers leave from · 노을 the fingertips the thread leaves · 서리 the brush hand the needles
  // leave · 독 the hand the jar leaves · 휘 the brush tip · 령 the bow's arrow pass · 월 the flung ring's leading edge
  const RELEASE = { dan: [17, -14], noeul: [16.4, -20.8], seori: [17, -16.4], dok: [19, -27], hwi: [39.9, -19.4], ryeong: [22.6, -17.6], wol: [28, -11] };
  const muzzleOf = (id) => { const P = pose(id, 'throw', 2), p = rot(RELEASE[id], P.lean, [0, 1]); return [f(p[0]), f(p[1] + P.bob)]; };
  NS.META = {};
  IDS.forEach((id) => {
    const C = CHARS[id], M = C.portrait, S = M.headScale, hx = 64.08 + M.dx, hy = 72 + M.dy;
    NS.META[id] = Object.freeze({
      weapon: C.weapon, eye: Object.freeze(C.eye.slice()), headTop: HEAD_TOP[id], extent: Object.freeze(EXTENT[id].slice()), muzzle: Object.freeze(muzzleOf(id)), cyan: C.cyan, face: C.face,
      portrait: Object.freeze({ headScale: S, dx: M.dx, dy: M.dy, faceBox: Object.freeze([f(hx - 18 * S), f(hy - 16 * S), f(58 * S), f(54 * S)]) })
    });
  });
  Object.freeze(NS.META);

  NS.ids = IDS;
  NS.all = ALL;
  NS.SPRITE = SPRITE;
  NS.PORTRAIT = PORTRAIT;
  NS.version = '1.0';
})(window.PN);
