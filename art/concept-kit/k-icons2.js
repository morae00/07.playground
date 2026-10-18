// k-icons2.js — 흑백 타격 생존전 먹극화 · PAPER NOIR INK — the arsenal's 44 weapons → window.PN.arsenal
// Work order K9: docs/art/briefs/arsenal-icons.md. API: art/concept-kit/API-icons2.md.
// - Icons, tiles and HUD slots: a weapon's drawing lives in this module's own table and is lent to PN._ki.ICON only for
//   the length of one PN.icons.skill / tile / hudSlot call (brief §1.3). The rarity frames, knots and the awakened
//   grammar are k-icons' own; nothing is left behind in PN.icons or PN._ki.
// - Shots: stamps for the 22 weapons that fire projectiles (parts / stamp, the K4 PN.skillVfx contract), ids 'kar<N>_'.
// - Delivery 3 of 3: all 44 drawn — volley (8, delivery 1), burst · spray · rear · seeker (14, delivery 2, with all 22
//   shots) and strike · nova · lob · chain · beam · halo (22 icons, delivery 3; no projectiles, so no shots). META done is
//   true for all; the look-icon placeholder path in defOf is no longer reached. Fix round after 검수 6차: M1 meteorBrush,
//   M2 tarJar, M3 seventhSeal, R1 thunderNeedles · headsmanDarts (plain) · smokeTail, R2–R6 (API-icons2.md §9.7);
//   after 검수 7차: F1 thunderNeedles wedge, F2 awakened meteorBrush drops, R7 meteorBrush dry tine ends (§9.8).
// Deterministic: no Math.random / Date. Load after lib.js and k-icons.js.
window.PN = window.PN || {};
(function (PN) {
  'use strict';
  const KI = PN._ki;
  if (!KI || !PN.icons || !KI.ICON) { PN.arsenal = Object.freeze({ version: '1.0', error: 'load k-icons.js before k-icons2.js' }); return; }
  const { K, S, P, L, f, rng, taperPoly, taperFn, smooth, blob, drip } = KI;

  // ==== 1. data (src/content/data/arsenal.ts order; names from ko.json skill.<id>) ====
  // [id, name, rarity, kind, look, count, awakenedCount, r]   count: volley/burst/rear/seeker/strike/lob = L1 count,
  // chain = L1 jumps + 1 (targets), beam = directions, spray/nova/halo = null. r = projectile hit radius (size) or null.
  const ROWS = [
    ['inkDarts', '먹침', 'common', 'volley', 'needleStorm', 2, 3, 4],
    ['brushQuills', '붓깃', 'common', 'volley', 'fanKnives', 3, 4, 5],
    ['sealArrows', '인장 화살', 'rare', 'volley', 'needleStorm', 1, 2, 6],
    ['frostNeedles', '서리침', 'rare', 'volley', 'needleStorm', 2, 3, 4.5],
    ['thunderNeedles', '뇌침', 'rare', 'volley', 'needleStorm', 1, 2, 4.5],
    ['twinBlades', '쌍날', 'common', 'volley', 'fanKnives', 2, 3, 6],
    ['ghostVolley', '혼령 일제사격', 'epic', 'volley', 'mirrorClone', 4, 5, 5],
    ['headsmanDarts', '망나니 침', 'legendary', 'volley', 'needleStorm', 1, 2, 4.5],
    ['paperStorm', '종이 폭풍', 'rare', 'burst', 'fanKnives', 8, 10, 5],
    ['inkBloom', '먹꽃', 'rare', 'burst', 'needleStorm', 6, 7, 4.5],
    ['thornHalo', '가시 테', 'epic', 'burst', 'needleStorm', 12, 14, 4],
    ['starShards', '별조각', 'epic', 'burst', 'mirrorClone', 5, 6, 5.5],
    ['sunNeedles', '해바늘', 'mythic', 'burst', 'needleStorm', 16, 20, 5],
    ['inkDrizzle', '먹 이슬비', 'common', 'spray', 'needleStorm', null, null, 3.5],
    ['pinHail', '핀 우박', 'rare', 'spray', 'fanKnives', null, null, 4.5],
    ['tailGuard', '꼬리 방패', 'common', 'rear', 'fanKnives', 3, 4, 5],
    ['smokeTail', '연막 꼬리', 'rare', 'rear', 'needleStorm', 2, 3, 4.5],
    ['gravePins', '묘침', 'epic', 'rear', 'needleStorm', 5, 6, 4.5],
    ['trackingSeals', '추적 인장', 'rare', 'seeker', 'needleStorm', 3, 4, 4.5],
    ['huntersMarks', '사냥꾼 표식', 'epic', 'seeker', 'mirrorClone', 4, 5, 5],
    ['crowFeathers', '까마귀 깃', 'rare', 'seeker', 'fanKnives', 5, 6, 5],
    ['bossbane', '보스 사냥침', 'legendary', 'seeker', 'needleStorm', 1, 2, 5.5],
    ['inkLightning', '먹번개', 'rare', 'strike', 'chainSpark', 2, 3, null],
    ['brushDownpour', '붓 폭우', 'epic', 'strike', 'boneMortar', 4, 5, null],
    ['fallingScroll', '족자 낙하', 'epic', 'strike', 'boneMortar', 1, 2, null],
    ['seventhSeal', '일곱째 인장', 'mythic', 'strike', 'voidMine', 7, 8, null],
    ['inkPulse', '먹 파동', 'common', 'nova', 'boneMortar', null, null, null],
    ['frostRing', '서리 고리', 'rare', 'nova', 'blackSun', null, null, null],
    ['thunderclap', '천둥 박수', 'epic', 'nova', 'chainSpark', null, null, null],
    ['silenceBell', '침묵의 종', 'legendary', 'nova', 'voidMine', null, null, null],
    ['inkPots', '먹단지', 'common', 'lob', 'boneMortar', 1, 2, null],
    ['clusterPots', '송이 단지', 'rare', 'lob', 'boneMortar', 3, 4, null],
    ['tarJar', '타르 항아리', 'epic', 'lob', 'voidMine', 1, 2, null],
    ['meteorBrush', '유성 붓', 'legendary', 'lob', 'boneMortar', 1, 2, null],
    ['sparkThread', '불꽃실', 'common', 'chain', 'chainSpark', 4, 5, null],
    ['stormThread', '폭풍실', 'epic', 'chain', 'chainSpark', 7, 8, null],
    ['frostChainlet', '서리 사슬', 'rare', 'chain', 'chainSpark', 5, 6, null],
    ['inkLance', '먹창', 'rare', 'beam', 'railSpear', 1, 1, null],
    ['wideBrush', '넓은 붓', 'epic', 'beam', 'frostLine', 1, 1, null],
    ['crossStrokes', '십자 획', 'epic', 'beam', 'railSpear', 4, 4, null],
    ['judgmentLine', '심판선', 'mythic', 'beam', 'railSpear', 1, 1, null],
    ['inkOrbit', '먹 궤도', 'common', 'halo', 'orbitScythes', null, null, null],
    ['wardRing', '수호 고리', 'rare', 'halo', 'eclipseStep', null, null, null],
    ['eclipseHalo', '일식 테', 'legendary', 'halo', 'eclipseStep', null, null, null]
  ];
  // main mass (20 px test) and the one cyan element, brief §3.4 — documentation only
  const MASS = {
    inkDarts: ['오른쪽으로 가는 검은 쐐기 둘', '위 다트의 깃 한 장(먹 테)'],
    brushQuills: ['긴 흰 깃 셋의 좁은 다발', '가운데 깃의 펜촉 끝 점(먹 테)'],
    sealArrows: ['먹귀 셋을 꿴 굵은 가로 꼬치 + 네모 머리', '인장 앞면 테'],
    frostNeedles: ['오른쪽 먹귀를 덮은 흰 서릿발(검은 몸 위)', '침 끝 둘'],
    thunderNeedles: ['창을 가로지르는 굵은 꺾쇠 번개 + 바늘', '번개 심'],
    twinBlades: ['크게 휜 흰 초승 날 둘 + 회전 호', '위 날의 안쪽 날선'],
    ghostVolley: ['선만 있는 화살 넷의 부채 + 청록 불꽃 깃', '불꽃 깃 넷'],
    headsmanDarts: ['큰 외날 칼 머리 + 찢긴 먹귀', '칼 날선'],
    paperStorm: ['감겨 퍼지는 흰 종이 바람개비', '가운데에서 감겨 나오는 바람 획 한 줄'],
    inkBloom: ['검은 꽃잎 여섯', '꽃술 테 일부(반 바퀴 이하)'],
    thornHalo: ['끊긴 먹 덩굴 고리 + 휜 가시', '덩굴 한 토막 안쪽 실'],
    starShards: ['깨져 흩어지는 각진 흰 조각', '섬광 심'],
    sunNeedles: ['가운데 흰 바늘꽂이 + 흩어져 튀는 바늘', '누빔 실 한 줄'],
    inkDrizzle: ['오른쪽으로 흩뿌린 작은 먹 방울 원뿔', '맨 앞 방울 셋의 젖은 반짝 획'],
    pinHail: ['넓은 원뿔의 흰 핀 무리', '가장 큰 핀의 날 홈'],
    tailGuard: ['왼쪽으로 펼친 흰 단검 셋(방패꼴)', '목도리 꼬리'],
    smokeTail: ['왼쪽으로 길게 퍼진 먹 연기 덩어리', '목도리 꼬리'],
    gravePins: ['왼쪽 아래 땅에 박힌 긴 핀 다섯', '목도리 꼬리'],
    trackingSeals: ['갈라져 휘는 청록 실 셋 + 끝마다 작은 도장', '추적 실 셋'],
    huntersMarks: ['네 과녁에 꽂힌 흰 표식 패', '패를 묶은 끈'],
    crowFeathers: ['오른쪽 반원으로 짧게 흩어진 검은 깃 다섯', '한 깃의 깃대 심'],
    bossbane: ['오른쪽 40%를 차지한 큰 보스 먹 덩어리(흰 가면) + 작살 침', '침 꼬리 실(한 번 휨)'],
    inkLightning: ['위 먹구름 띠 + 내리꽂는 굵은 번개 둘', '번개 하나의 심'],
    brushDownpour: ['비스듬히 쏟아지는 굵은 붓 획 넷 + 바닥 붓자국', '붓 획 하나의 젖은 결'],
    fallingScroll: ['크게 떨어지는 세로 족자', '걸이 끈'],
    seventhSeal: ['위에서 내리찍는 큰 둥근 도장 + 바닥의 둥근 인영 일곱', '큰 도장 인면 테'],
    inkPulse: ['굵기가 들쭉날쭉한 먹 고리 + 튕겨지는 먹귀', '고리 앞선 한 호(1/3 바퀴 이하)'],
    frostRing: ['흰 서릿발 고리 + 고리에 얼어붙은 검은 먹귀', '고리 심'],
    thunderclap: ['맞부딪친 두 손 + 들쭉날쭉한 충격 고리', '섬광 심'],
    silenceBell: ['가운데 흰 손종 + 매끈한 종이 고리', '추를 묶은 실'],
    inkPots: ['꼭대기의 흰 단지 + 오른쪽 아래 먹 튐', '단지 목 끈'],
    clusterPots: ['끈으로 묶인 작은 단지 셋 + 세 갈래 착지', '송이 끈'],
    tarJar: ['오른쪽 아래 넓은 끈적 먹 웅덩이 + 검은 항아리', '항아리 봉인 끈'],
    meteorBrush: ['왼쪽 위 → 오른쪽 아래로 떨어지는 큰 붓 혜성', '꼬리 심'],
    sparkThread: ['먹귀 넷을 잇는 부드러운 실 호', '실'],
    stormThread: ['창 가운데를 도는 큰 나선 실 + 흩어진 작은 먹귀', '실 번개'],
    frostChainlet: ['먹귀 다섯을 잇는 흰 사슬 고리 줄', '고리 하나의 심'],
    inkLance: ['창 폭을 가로지르는 가는 수평 창', '술 매듭 띠'],
    wideBrush: ['수평으로 쓸고 간 넓은 흰 붓질 띠', '띠 앞선 테'],
    crossStrokes: ['가운데 결 매듭을 둘러싼 찢긴 먹귀 넷', '찢은 획 하나의 심'],
    judgmentLine: ['왼쪽 위 먹통 + 오른쪽 아래까지 팽팽한 먹줄', '먹줄 심'],
    inkOrbit: ['가운데가 빈 두꺼운 먹 타원 띠', '혜성 획 심'],
    wardRing: ['굵게 꼰 흰 줄 고리(작은 타원) + 튕겨지는 먹귀', '고리 바느질 1/3'],
    eclipseHalo: ['넓고 가는 타원 테 + 먹 초승 그림자', '리본 두 가닥']
  };
  const IDS = ROWS.map((r) => r[0]);
  const KINDS = ['volley', 'burst', 'spray', 'rear', 'seeker', 'strike', 'nova', 'lob', 'chain', 'beam', 'halo'];
  const SHOT_KINDS = ['volley', 'burst', 'spray', 'rear', 'seeker'];
  const DONE = new Set(['inkDarts', 'brushQuills', 'sealArrows', 'frostNeedles', 'thunderNeedles', 'twinBlades', 'ghostVolley', 'headsmanDarts',
    // delivery 2: burst · spray · rear · seeker
    'paperStorm', 'inkBloom', 'thornHalo', 'starShards', 'sunNeedles', 'inkDrizzle', 'pinHail', 'tailGuard', 'smokeTail', 'gravePins',
    'trackingSeals', 'huntersMarks', 'crowFeathers', 'bossbane',
    // delivery 3: strike · nova · lob · chain · beam · halo (icons only)
    'inkLightning', 'brushDownpour', 'fallingScroll', 'seventhSeal', 'inkPulse', 'frostRing', 'thunderclap', 'silenceBell',
    'inkPots', 'clusterPots', 'tarJar', 'meteorBrush', 'sparkThread', 'stormThread', 'frostChainlet',
    'inkLance', 'wideBrush', 'crossStrokes', 'judgmentLine', 'inkOrbit', 'wardRing', 'eclipseHalo']);
  const META = {};
  ROWS.forEach(([id, name, rarity, kind, look, count, awakenedCount, r]) => {
    META[id] = Object.freeze({ name, rarity, kind, look, count, awakenedCount, r, shot: SHOT_KINDS.indexOf(kind) >= 0, done: DONE.has(id), mass: MASS[id][0], cyan: MASS[id][1] });
  });
  Object.freeze(META);
  const SHOTS = IDS.filter((id) => META[id].shot);

  // ==== 2. shared drawing helpers (128 icon master, light from the top-left) ====
  const rad = (d) => d * Math.PI / 180;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const q = (p) => f(p[0]) + ',' + f(p[1]);
  const ptsD = (a, close) => 'M' + a.map(q).join(' L') + (close ? ' Z' : '');
  /** A frame along a direction: at(t, s) = O + u·t + n·s, n = u turned +90° (below the line for a rightward u). */
  function axis(O, deg) {
    const a = rad(deg), u = [Math.cos(a), Math.sin(a)], n = [-u[1], u[0]];
    const at = (t, s = 0) => [O[0] + u[0] * t + n[0] * s, O[1] + u[1] * t + n[1] * s];
    at.u = u; at.n = n; at.deg = deg; at.O = O;
    return at;
  }
  /** Closed body along an axis: t 0 (back) → 1 (front) over len; half widths above (top) and below (bot). */
  function bodyD(at, len, top, bot, n = 32, t0 = 0, t1 = 1) {
    const up = [], lo = [];
    for (let i = 0; i <= n; i++) { const t = lerp(t0, t1, i / n); up.push(at(t * len, -top(t))); lo.push(at(t * len, bot(t))); }
    return ptsD(up.concat(lo.reverse()), true);
  }
  /** Irregular paper splash / flash, n points (5–7), uneven angles and lengths (never an even star). */
  function splashD(cx, cy, r, n, seed, inner = 0.42, a0 = -Math.PI / 2) {
    const R = rng(seed), p = [];
    for (let i = 0; i < 2 * n; i++) {
      const a = a0 + i * Math.PI / n + (R() - 0.5) * 0.55;
      const rr = i % 2 ? r * inner * (0.8 + 0.4 * R()) : r * (0.5 + 0.5 * R());
      p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return ptsD(p, true);
  }
  const paperSplash = (cx, cy, r, n, seed, w = 2.2) => `<path d="${splashD(cx, cy, r, n, seed)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="${w}" stroke-linejoin="round"/>`;
  /** Ink-on-cyan sandwich line (bible §5.3): ink ≥ 2 under the cyan, a glow core on top. */
  const cyanLine = (d, w = 1.6, glow = true) => L(d, K.ink, w + 2.4) + L(d, K.ally, w) + (glow ? L(d, K.allyG, Math.max(0.4, w * 0.3), 'opacity="0.9"') : '');
  /** Target ghoul (1장 slit eyes) — PN._ki.inkDot as it is; one seed per ghoul per call. */
  const ghoul = (c, x, y, r, seed, eyes = true) => KI.inkDot(c, x, y, r, seed, eyes);

  /** Where a line through T along -u (backwards) first meets a circle (G, r): the entry point of a hit. */
  function entry(T, u, G, r) {
    const D = [T[0] - G[0], T[1] - G[1]], du = D[0] * u[0] + D[1] * u[1], disc = du * du - (D[0] * D[0] + D[1] * D[1]) + r * r;
    const s = du + Math.sqrt(Math.max(0, disc));
    return [T[0] - u[0] * s, T[1] - u[1] * s];
  }
  /** Tapered speed stroke, thick at p0, thin at p1. */
  const speed = (p0, p1, w, col) => taperPoly([p0, p1], w, 0.2, col);
  /** Stun mark (§3.2): one paper spiral stroke of 1.5 turns with an ink rim, above a ghoul's head. */
  function stunSpiral(cx, cy, r, a0 = 0.6) {
    // flattened (3/4 view, ry 0.38) and left open: the outer end runs off as a short tail, so it is no '@' or '6'
    const pts = [];
    for (let i = 0; i <= 34; i++) { const t = i / 34, a = a0 + t * Math.PI * 3, rr = r * (0.2 + 0.8 * t); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.38]); }
    const e = pts[pts.length - 1], g = pts[pts.length - 2], tl = [e[0] + (e[0] - g[0]) * 2.2, e[1] + (e[1] - g[1]) * 2.2];
    // a brush swirl: thin where it starts in the middle, full where it leaves (ink rim under a paper core)
    const all = pts.concat([tl]);
    return taperPoly(all, 2.2, 5.2, K.ink) + taperPoly(all, 0.5, 2.4, K.p50);
  }
  /** Frost (slow, §3.2): branched pointed paper shards with an ink rim, rooted on a black body. spikes: [x, y, deg, len]. */
  function frost(spikes, seed, rim = 2.2) {
    const R = rng(seed);
    let d = '';
    spikes.forEach(([x, y, deg, len]) => {
      // a straight crystal blade (faceted, not a flame): narrow base, one shoulder, a hard point; branches at ~55°
      const at = axis([x, y], deg), w = 1.5 + len * 0.075;
      d += ptsD([at(0, -w), at(len * 0.62, -w * 0.85), at(len, 0), at(len * 0.7, w * 0.7), at(0, w)], true) + ' ';
      const nb = len > 15 ? 2 : 1;
      for (let i = 0; i < nb; i++) {
        const t = len * (0.34 + 0.26 * i + 0.06 * R()), sg = (i + (R() > 0.5 ? 1 : 0)) % 2 ? 1 : -1, bl = len * (0.3 + 0.14 * R()), ba = deg + sg * (50 + 10 * R());
        const bat = axis(at(t, 0), ba), bwid = w * 0.6;
        d += ptsD([bat(-1, -bwid), bat(bl * 0.7, -bwid * 0.6), bat(bl, 0), bat(-1, bwid)], true) + ' ';
      }
    });
    return `<path d="${d}" fill="none" stroke="${K.ink}" stroke-width="${f(rim * 2)}" stroke-linejoin="round"/><path d="${d}" fill="${K.p50}"/>`;
  }
  /** Ice plate under the feet (§3.2): a flat paper ellipse with an ink rim and two ink.300 cracks. */
  const icePlate = (cx, cy, rx, ry) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${rx}" ry="${ry}" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.2"/>` +
    L(`M${f(cx - rx * 0.62)},${f(cy - ry * 0.1)} L${f(cx - rx * 0.3)},${f(cy + ry * 0.3)} L${f(cx - rx * 0.1)},${f(cy + ry * 0.05)} M${f(cx + rx * 0.2)},${f(cy - ry * 0.45)} L${f(cx + rx * 0.42)},${f(cy + ry * 0.2)}`, K.ink3, 1.2);
  /** Execute (§3.2): a ghoul torn like paper along one jagged stroke into two pieces, the upper piece opening obliquely;
   *  torn paper edges, ink flicks from the tear. Never a clean cut or an ✕. One ghoul body is drawn once and shown twice. */
  function tornGhoul(c, x, y, r, seed, key, o = {}) {
    const id = c.id('tg' + key);
    c.add(`<g id="${id}">${ghoul(c, x, y, r, seed)}</g>`);
    // below the eyes, few uneven steps (a regular zigzag with paper rims read as teeth)
    const a = rad(o.deg == null ? -16 : o.deg), u = [Math.cos(a), Math.sin(a)], n = [-u[1], u[0]], off = o.off == null ? r * 0.22 : o.off;
    const steps = [[-1.7, 0], [-0.95, 0.16], [-0.55, -0.06], [-0.05, 0.12], [0.38, -0.14], [0.85, 0.04], [1.7, -0.06]];
    const tear = steps.map(([t, j]) => [x + u[0] * t * r + n[0] * (off + j * r), y + u[1] * t * r + n[1] * (off + j * r)]);
    const far = 3 * r, last = tear[tear.length - 1];
    const side = (sg) => ptsD(tear.concat([[last[0] + n[0] * far * sg, last[1] + n[1] * far * sg], [tear[0][0] + n[0] * far * sg, tear[0][1] + n[1] * far * sg]]), true);
    // the upper piece hinges open about the far end of the tear (a wedge of paper shows where the blade went in)
    // no paper rims along the tear (with the jagged edge they read as teeth): the open gap itself shows the paper
    const op = o.open || [6, -8, -22], tr = `translate(${op[0]},${op[1]}) rotate(${op[2]} ${f(x + u[0] * r)} ${f(y + u[1] * r)})`;
    // ink flicks (검수 1차 F2): spread along the tear and roughly square to it, thrown down off the lower piece, lengths
    // differ, one ending in a drop. A fan from one end of the tear read as whiskers and a beak (a cat's face on the small
    // ghoul). Flicks thrown up off the upper piece left the body at the top of the head and read as horns or antennae
    // (a bug's face on the small ghoul), so the upper piece throws none: its opened gap shows the tear.
    const dg = o.deg == null ? -16 : o.deg, k = r / 16;
    // each flick leaves the body where its square-on line from the tear meets the outline (a flick drawn from inside the
    // black body only showed as a horn or a stray dot), thin at the body and swelling outward like a flung drop
    const flick = ([t, sd, l, w, da, dropAt]) => {
      const P0 = [x + u[0] * t * r + n[0] * (off + sd * 1.2), y + u[1] * t * r + n[1] * (off + sd * 1.2)], a2 = rad(dg + da), d = [Math.cos(a2), Math.sin(a2)];
      const D = [P0[0] - x, P0[1] - y], dd = D[0] * d[0] + D[1] * d[1], R2 = Math.pow(r * 1.06, 2);
      const s0 = -dd + Math.sqrt(Math.max(0, dd * dd - (D[0] * D[0] + D[1] * D[1]) + R2)) + 1.2 * k, L2 = l * k;
      const st = [P0[0] + d[0] * s0, P0[1] + d[1] * s0], end = [st[0] + d[0] * L2, st[1] + d[1] * L2];
      const mid = [st[0] + d[0] * L2 * 0.55 + u[0] * 0.7 * k, st[1] + d[1] * L2 * 0.55 + u[1] * 0.7 * k];
      return taperPoly([st, mid, end], 0.5 * k, w * k, K.ink) + `<circle cx="${f(end[0])}" cy="${f(end[1])}" r="${f(w * k * 0.5)}" fill="${K.ink}"/>` +
        (dropAt ? P(blob(end[0] + d[0] * 3 * k, end[1] + d[1] * 3 * k, 1.5 * k, 6, 0.4, seed + 21), K.ink) : '');
    };
    const down = [[-0.75, 1, 9, 3, 104, 0], [0.15, 1, 5.5, 2.6, 88, 0], [0.9, 1, 11, 3.4, 66, 1]];
    // o.flicks === false (검수 2차 F2b, the awakened icon): no flicks — the awakened paper halo ringed each loose flick
    // and its round end, and two ghouls with ringed sticks under them read as a bug with legs
    let s = `<g clip-path="${c.clip('tl' + key, side(1))}"><use href="#${id}"/></g>` + (o.flicks === false ? '' : down.map(flick).join(''));
    s += `<g transform="${tr}"><g clip-path="${c.clip('tu' + key, side(-1))}"><use href="#${id}"/></g></g>`;
    return s;
  }
  /** Dry-brush ink trail behind a moving thing: tapered from w at p0 to a point, one paper streak through it. */
  function inkTrail(p0, p1, w, col, streak = true) {
    const pts = [p0, [lerp(p0[0], p1[0], 0.5), lerp(p0[1], p1[1], 0.5)], p1];
    let s = taperFn(pts, (t) => w * Math.pow(1 - t, 0.7) + 0.3, col);
    if (streak) s += taperPoly([[lerp(p0[0], p1[0], 0.12), lerp(p0[1], p1[1], 0.12) - 0.4], [lerp(p0[0], p1[0], 0.55), lerp(p0[1], p1[1], 0.55) - 0.2]], w * 0.16, 0.1, K.p50, 'opacity="0.9"');
    return s;
  }
  /** Knockback (§3.2): the ghoul leans back by `lean`°, drag strokes of different lengths under it, a paper splash in front. */
  function knocked(c, x, y, r, seed, lean, o = {}) {
    const ln = o.ln || K.ink, drags = o.drags || [[1, 0]], dw = o.dw || 1;
    let s = drags.map(([k, dy], i) => speed([x - r * 0.3, y + r * 0.95 + dy], [x - r * (1.4 + 1.2 * k), y + r * 0.95 + dy + 1.5 * i], (3.4 - i * 0.8) * dw, ln)).join('');
    s += `<g transform="rotate(${lean} ${f(x)} ${f(y + r * 0.9)})">${ghoul(c, x, y, r, seed)}</g>`;
    if (o.splash !== false) s += paperSplash(x - r * 0.95, y - r * 0.15, r * 0.62, 6, seed + 40, 1.8);
    return s;
  }

  // ---- delivery 2 helpers (burst · spray · rear · seeker) ----
  /** Points turned by deg about c0. */
  const rotP = (pts, deg, c0 = [0, 0]) => {
    const a = rad(deg), cs = Math.cos(a), sn = Math.sin(a);
    return pts.map(([x, y]) => [c0[0] + (x - c0[0]) * cs - (y - c0[1]) * sn, c0[1] + (x - c0[0]) * sn + (y - c0[1]) * cs]);
  };
  const polyD = (pts) => ptsD(pts, true);
  /** Points along a cubic bezier p0 → p3 (n + 1 points). */
  const bez = (p0, c1, c2, p3, n = 8) => {
    const o = [];
    for (let i = 0; i <= n; i++) { const t = i / n, v = 1 - t; o.push([0, 1].map((j) => v * v * v * p0[j] + 3 * v * v * t * c1[j] + 3 * v * t * t * c2[j] + t * t * t * p3[j])); }
    return o;
  };
  /** A hanging drop: pointed top, round bottom (never a round ink ball with a paper dot, the enemy shot grammar). */
  const dropD = (x, y, h, w) => `M${f(x)},${f(y - h * 0.55)} C${f(x + w)},${f(y - h * 0.05)} ${f(x + w * 0.95)},${f(y + h * 0.45)} ${f(x)},${f(y + h * 0.45)} ` +
    `C${f(x - w * 0.95)},${f(y + h * 0.45)} ${f(x - w)},${f(y - h * 0.05)} ${f(x)},${f(y - h * 0.55)} Z`;
  /** Point at angle deg (screen degrees, y down) and radius r from c. */
  const polar = (c0, deg, r) => [c0[0] + Math.cos(rad(deg)) * r, c0[1] + Math.sin(rad(deg)) * r];
  /** Pierce (§3.2): the motif under the ghoul, the ghoul, a paper hole where it comes out, then the part that came out. */
  const pierced = (c, G, gr, seed, under, exit, out) => under + ghoul(c, G[0], G[1], gr, seed) +
    `<path d="${splashD(exit[0], exit[1], gr * 0.42, 5, seed + 30, 0.5)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.5" stroke-linejoin="round"/>` + out;

  // ==== 3. icon drawings (DRAW[id] = { draw(c, A) → {bg, fg, top}, halo? }) ====
  const DRAW = {};

  // ---- volley (§3.1): from the lower left, a narrow bundle rising 8–18° to the right, one target ghoul ----

  /** 먹침 dart, tail O → tip: paper body (bw), ink-dipped wedge on the front 45% (tw), two paper vanes; cyanVane makes
   *  the upper vane the cyan element (ink rim + glow line). */
  function dart(O, deg, len, o = {}) {
    const at = axis(O, deg), tw = (o.tw || 15) / 2, b = (o.bw || 7) / 2, M = (a) => a.map(([t, s]) => at(t * len, s));
    // paper body (rounded nock) → sharp shoulder → straight-sided ink wedge: a heavy dart point, not a nose cone
    const hw = (t) => (t < 0.52 ? b * (t < 0.04 ? 0.7 + 7.5 * t : 1) : t < 0.565 ? lerp(b, tw, (t - 0.52) / 0.045) : tw * Math.pow(Math.max(0, (1 - t) / 0.435), 0.92));
    const body = bodyD(at, len, hw, hw, 48);
    const tipPts = [];
    for (let i = 0; i <= 18; i++) { const t = lerp(0.54, 1, i / 18); tipPts.push(at(t * len, -hw(t))); }
    for (let i = 18; i >= 0; i--) { const t = lerp(0.54, 1, i / 18); tipPts.push(at(t * len, hw(t))); }
    // the dip line: ragged, two runs of ink down onto the paper body
    tipPts.push(...M([[0.535, b * 0.7], [0.47, b * 0.55], [0.468, b * 0.15], [0.52, b * 0.05], [0.5, -b * 0.35], [0.43, -b * 0.42], [0.428, -b * 0.75], [0.53, -b * 0.85]]));
    // feather flights: long, swept, notched — bigger (검수 1차 F4·R6: the cyan flight vanished at 32 px, and small fins
    // read as a missile); outer reach b + 8.5
    const vane = (sg) => ptsD(M(smooth([[0.32, sg * b * 0.8], [0.21, sg * (b + 3.2)], [0.08, sg * (b + 6.8)], [-0.06, sg * (b + 8.5)], [-0.02, sg * (b + 4.6)], [0.03, sg * (b + 5.6)], [0.07, sg * b * 0.8]], 5)), true);
    const upper = o.cyanVane
      ? S(vane(-1), K.ally, 1.6, 1) + L(ptsD(M([[0.23, -b - 1.6], [0.09, -b - 5]])), K.allyG, 1.2, 'opacity="0.9"')
      : S(vane(-1), K.p50, 2, 1.1);
    // one hand-wound thread binding (an even run of three bands read as a manufactured missile)
    const bind = P(bodyD(at, len, () => b + 0.6, () => b + 0.6, 4, 0.1, 0.17), K.ink) +
      L(ptsD(M([[0.118, -b - 0.2], [0.128, b + 0.2]])), K.p300, 0.8) + L(ptsD(M([[0.146, -b - 0.2], [0.152, b + 0.2]])), K.p300, 0.6);
    const shade = P(bodyD(at, len, () => 0, hw, 16, 0.05, 0.5), K.p300);
    // the light side of the wedge: one broken dry-brush stroke (not a ruled bevel line)
    const bevel = taperPoly(M([[0.6, -tw * 0.5], [0.71, -tw * 0.4]]), 1.8, 0.4, K.p300) + taperPoly(M([[0.76, -tw * 0.33], [0.9, -tw * 0.14]]), 1.3, 0.2, K.p300);
    return S(vane(1), K.p50, 2, 1.1) + upper + S(body, K.p50, 2.6, 1.4) + shade + bind + P(ptsD(tipPts, true), K.ink) + bevel;
  }
  DRAW.inkDarts = { draw(c, A) {
    // 검수 5차 N1: the awakened trails are p300 (the brief §2.4 rule for bg ink lines) — in ink7 they sank into the
    // awakened ink ground and the three volley needles' awakened icons swapped at 32 px; the black wedges stay
    const deg = -12, ax = axis([0, 0], deg), u = ax.u, n = ax.n, G = [103, 57], gr = 15, ln = A ? K.p300 : K.ink;
    const lead = A ? [97, 62] : [96, 64];
    const add = (p, a, b) => [p[0] + n[0] * a + u[0] * b, p[1] + n[1] * a + u[1] * b];
    // [tip, length, cyan vane]: the upper dart flies a little behind the lead one (staggered, never a row)
    const set = A ? [[add(lead, -20, -12), 66, true], [add(lead, 20, -19), 64, false], [lead, 70, false]] : [[add(lead, -21, -13), 66, true], [lead, 70, false]];
    let bg = '', fg = '';
    // dry-brush ink trails: each dart leaves the stroke it was flicked from (the black spot with the wedges)
    set.forEach(([Tp, len], i) => {
      const O = [Tp[0] - u[0] * len, Tp[1] - u[1] * len], k = i === set.length - 1 ? 1 : 0.75, B0 = add(O, 1.5, 14);
      bg += inkTrail(B0, add(B0, 3, -(38 + 30 * k)), 11 * k + 4, ln);
    });
    // ink flung off the struck ghoul, behind it (away from the seal corner)
    fg += P(blob(116, 68, 7, 7, 0.5, 21) + drip(122, 72, 9, 2), A ? K.ink7 : K.ink) + taperPoly([[112, 62], [126, 57]], 3.6, 0.4, A ? K.ink7 : K.ink);
    fg += ghoul(c, G[0], G[1], gr, 3);
    const E = entry(lead, u, G, gr);
    fg += paperSplash(E[0] + 1.5, E[1] - 0.5, 10.5, 6, 7);
    set.forEach(([Tp, len, cy]) => { fg += dart([Tp[0] - u[0] * len, Tp[1] - u[1] * len], deg, len, { cyanVane: cy, tw: 16, bw: 7 }); });
    return { bg, fg };
  } };

  /** 인장 화살: tail O → front: ink shaft (6, paper knock-out rim), a side-view seal block head (16 × 18: paper body, a
   *  groove, a front face band 8 — the cyan seal-ink face inside an ink rim — no glyph), two paper vanes. Returns
   *  {shaft, head}: the shaft goes under the skewered ghouls, the head and vanes over them. */
  function sealArrow(O, deg, len, o = {}) {
    // 검수 1차 F4: the front face is a band 8 wide — ink 1.6 | cyan seal ink 4.8 | ink 1.6 — so the cyan survives at 32 px
    const at = axis(O, deg), k = o.k || 1, sh = 3 * k, hb = 9 * k, xh = len - 16 * k, xf = len - 8 * k, M = (a) => a.map(([x, s]) => at(x, s * k));
    const shaft = `M${q(at(4 * k, 0))} L${q(at(xh - 4 * k, 0))}`;
    const block = ptsD([at(xh + 1.5, -hb), at(xf, -hb), at(xf, hb), at(xh + 1.5, hb), at(xh, hb - 1.5), at(xh, -hb + 1.5)], true);
    const face = ptsD([at(xf, -hb), at(len - 0.8, -hb + 0.8), at(len, -hb + 2.2), at(len, hb - 2.2), at(len - 0.8, hb - 0.8), at(xf, hb)], true);
    const vane = (sg) => ptsD(M(smooth([[20, sg * 2.6], [11, sg * 6.5], [1, sg * 10.6], [-4, sg * 10], [2, sg * 5.5], [5, sg * 2.6]], 4)), true);
    const ci = 1.6 * k, inkFace = ptsD([at(xf + ci, -hb + ci), at(len - ci, -hb + ci + 0.6), at(len - ci, hb - ci - 0.6), at(xf + ci, hb - ci)], true);
    const rimD = `M${q(at(xf + ci + 1.2 * k, -hb + ci + 1.4))} L${q(at(xf + ci + 1.2 * k, hb - ci - 1.4))}`;
    const shaftArt = L(shaft, K.p50, sh * 2 + 2.8) + L(shaft, K.ink, sh * 2) + L(`M${q(at(10 * k, -sh * 0.45))} L${q(at(xh - 8, -sh * 0.45))}`, K.ink5, 1.2);
    const head = S(vane(1), K.p50, 2.2, 1) + S(vane(-1), K.p50, 2.2, 1) + L(`M${q(at(xh - 9 * k, 0))} L${q(at(xh, 0))}`, K.ink, sh * 2) +
      S(block, K.p50, 2.6, 1.4) + L(`M${q(at(xh + 5.5 * k, -hb))} L${q(at(xh + 5.5 * k, hb))}`, K.ink, 1.2) +
      P(ptsD([at(xh + 1.5, hb * 0.35), at(xf, hb * 0.35), at(xf, hb), at(xh + 1.5, hb)], true), K.p300) +
      L(`M${q(at(xh + 3, -hb + 2.4))} L${q(at(xf - 2, -hb + 2.4))}`, K.ink3, 1) +
      `<path d="${face}" fill="${K.ink}" stroke="${K.ink}" stroke-width="1.6" stroke-linejoin="round"/>` + P(inkFace, K.ally) + L(rimD, K.allyG, 0.9, 'opacity="0.85"');
    return { shaft: shaftArt, head };
  }
  DRAW.sealArrows = { draw(c, A) {
    const ln = A ? K.ink7 : K.ink;
    // rows: [tail, deg, length, ghouls [t, offset, r, seed, lean]]; the shaft runs below the eyes
    const rows = [[[14, 69], -6, 110, [[22, -3, 9, 3, 0], [46, -4, 11, 5, 0], [72, -3.5, 13, 7, 16]]]];
    if (A) rows.unshift([[8, 101], -5, 82, [[50, -3, 10, 9, 14]]]);
    let bg = '', fg = '';
    rows.forEach(([O, deg, len, gs]) => {
      const at = axis(O, deg), ar = sealArrow(O, deg, len);
      // a heavier wake and heavier drag marks under the shoved ghoul (검수 1차 R1: the black spot was 13%); the wake stays
      // on the left middle, clear of the lower left
      bg += inkTrail(at(20, 0.5), at(-40, 2), A ? 15 : 34, ln);
      fg += ar.shaft;
      gs.forEach(([t, s, r, seed, lean]) => {
        const p = at(t, s), X = at(t + r * 0.9, 0);
        fg += lean ? knocked(c, p[0], p[1], r, seed, lean, { ln, splash: false, drags: [[1.2, 0], [0.5, 3]], dw: 2 }) : ghoul(c, p[0], p[1], r, seed);
        fg += P(splashD(X[0] - 0.5, X[1], 3.2, 5, seed + 11, 0.45), K.p50);   // torn paper where the shaft comes out
      });
      fg += ar.head;
    });
    return { bg, fg };
  } };

  /** 뇌침: one long needle (KI.slimNeedle) with a thick bolt wound round it — ink / cyan / paper core, sharp corners,
   *  uneven segments, thicker toward the front; two of its segments cross in front of the needle. */
  function boltAround(B, Tp, o = {}) {
    const len = Math.hypot(Tp[0] - B[0], Tp[1] - B[1]), at = axis(B, Math.atan2(Tp[1] - B[1], Tp[0] - B[0]) * 180 / Math.PI);
    // bends at uneven spacing and reach (consecutive segments differ by ≥ 30%), so never a regular Z / N / W
    const ts = o.ts || [0.02, 0.17, 0.26, 0.38, 0.56, 0.64, 0.86, 1.0], ss = o.ss || [0, -4.5, -8, 5.5, -17, -10, 3, 0.5];
    const pts = o.pts || ts.map((t, i) => at(t * len, ss[i])), w0 = o.w0 || 6, w1 = o.w1 || 13;
    // thicker toward the front in steps: each step strokes the rest of the bolt again, miter-joined (sharp corners)
    const steps = [0, Math.floor(pts.length * 0.4), Math.floor(pts.length * 0.7)];
    const bolt = (p, from) => {
      let s = '';
      [[K.ink, 1], [K.ally, 0.5], [K.p50, 0.17]].forEach(([col, k]) => steps.forEach((i, j) => {
        if (i >= p.length - 1) return;
        const w = lerp(w0, w1, j / (steps.length - 1)) * k;
        s += `<path d="${ptsD(p.slice(i))}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linejoin="miter" stroke-miterlimit="8" stroke-linecap="${from && i === 0 ? 'round' : 'butt'}"/>`;
      }));
      return s;
    };
    // o.shadow [dx, dy]: an offset ink copy on the shadow side (down-right), the k-icons brush-shape grammar
    const shade = o.shadow ? `<g transform="translate(${o.shadow[0]},${o.shadow[1]})">` + steps.map((i, j) => (i >= pts.length - 1 ? '' :
      `<path d="${ptsD(pts.slice(i))}" fill="none" stroke="${K.ink}" stroke-width="${f(lerp(w0, w1, j / (steps.length - 1)))}" stroke-linejoin="miter" stroke-miterlimit="8" stroke-linecap="${i === 0 ? 'round' : 'butt'}"/>`)).join('') + '</g>' : '';
    let full = shade + bolt(pts, true);
    if (o.fork !== false) {
      // one short fork off a bend, thinner, ending in a point
      const i = o.forkAt || 4, F = o.fork || [pts[i], at(ts[i] * len + 4, ss[i] - 7), at(ts[i] * len + 10, ss[i] - 11)];
      full = taperPoly(F, w0 * 0.9, 0.6, K.ink) + taperPoly(F, w0 * 0.42, 0.3, K.ally) + full;
    }
    // the jogs that pass in front (indexes into pts) are redrawn over the needle at the full front width
    const front = (o.front || [2, 4]).map((i) => {
      const seg = ptsD([pts[i], pts[i + 1]]), w = lerp(w0, w1, i / (pts.length - 1));
      return [[K.ink, 1], [K.ally, 0.5], [K.p50, 0.17]].map(([col, k]) => `<path d="${seg}" fill="none" stroke="${col}" stroke-width="${f(w * k)}" stroke-linecap="butt"/>`).join('');
    }).join('');
    return { back: full, front, pts };
  }
  DRAW.thunderNeedles = { draw(c, A) {
    const ln = A ? K.p300 : K.ink, G = [98, 66], gr = 14;
    let bg = speed([12, 92], [-6, 97], 2.6, ln) + speed([18, 99], [2, 104], 1.8, ln), fg = '';
    // the strike's burn blown out behind the target (검수 1차 R1: black spot 11%): a flattened, ragged splash off-centre
    // to the right with drops thrown on — below the seal corner, away from the lower left. (A round blob round the
    // ghoul swallowed its outline and read as a black ball.)
    bg += `<g transform="translate(115 72) scale(1 0.82) translate(-115 -72)">${P(splashD(115, 72, 30, 8, 51, 0.62, 0.3), A ? K.ink7 : K.ink)}</g>` +
      P(blob(124, 50, 2.4, 6, 0.5, 52) + blob(121, 92, 1.8, 6, 0.5, 53) + blob(108, 94, 1.4, 6, 0.5, 54), A ? K.ink7 : K.ink);
    const needles = A ? [[[10, 88], [104, 63]], [[6, 70], [80, 50]]] : [[[10, 90], [104, 65]]];
    if (A) {
      // the bolt leaps on to a second ghoul (short, two bends)
      const jump = [[106, 72], [112, 80], [107, 85], [114, 93]];
      const jd = ptsD(jump), js = (col, w) => `<path d="${jd}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="miter" stroke-miterlimit="8" stroke-linecap="round"/>`;
      fg += ghoul(c, 116, 96, 9, 9) + js(K.ink, 6.4) + js(K.ally, 3) + js(K.p50, 1);
    }
    // a paper knock-out arc keeps the ghoul's round back apart from the burn behind it (drawn under the ghoul, so only
    // the part outside its outline shows)
    const ko = (a) => q([G[0] + (gr + 1.3) * Math.cos(rad(a)), G[1] + (gr + 1.3) * Math.sin(rad(a))]);
    fg += `<path d="M${ko(-80)} A${gr + 1.3},${gr + 1.3} 0 0 1 ${ko(100)}" fill="none" stroke="${K.p50}" stroke-width="2.8" stroke-linecap="round"/>`;
    fg += ghoul(c, G[0], G[1], gr, 3) + stunSpiral(99, 42, 9.5, 2.4);
    // the main bolt in icon space: long, short jog, longest, one deep jog back down across the needle, medium, short —
    // every step ≥ 30% apart. 검수 6차 R1: the middle jog was 14 deep (70,58 → 66,72) and closed up at 20 px, where the
    // bolt and 망나니 침's dart both became 'a thin diagonal + an ink mass on the right'; it now drops 32 (76,46 → 70,78)
    // so a Z notch stays open at 20 px
    // 검수 7차 F1: the deep jog's two legs both crossed the paper needle, so the needle drew a bar inside the paper
    // triangle and the bolt read as 'A' (or '4') at 120 and 32 px. The inside of the jog — between its two legs, down to
    // the needle — is now a solid ink wedge drawn over the needle (the needle passes behind it), and both legs are
    // redrawn in front of it (front [1, 2, 3])
    const main0 = { pts: [[4, 100], [30, 80], [36, 90], [76, 46], [70, 78], [86, 62], [99, 66]], w0: 8, w1: 15.5, front: [1, 2, 3], fork: false, shadow: [2.1, 2.7] };
    needles.slice().reverse().forEach(([B, Tp], i) => {
      const main = i === needles.length - 1, bo = boltAround(B, Tp, main ? main0 : { ts: [0.05, 0.24, 0.36, 0.58, 0.7, 1], ss: [0, -6, 3, -7.5, 3.5, 0.5], w0: 4.6, w1: 9, front: [1], fork: false });
      let wedge = '';
      if (main) {
        const dl = Math.hypot(Tp[0] - B[0], Tp[1] - B[1]), nv = [-(Tp[1] - B[1]) / dl, (Tp[0] - B[0]) / dl];
        const side = (X) => (X[0] - B[0]) * nv[0] + (X[1] - B[1]) * nv[1];
        // where a leg crosses the needle's centre line, pushed 3.8 past it so the wedge also covers the needle's far half
        const cut = (Pp, Q) => { const t = side(Pp) / (side(Pp) - side(Q)); return [Pp[0] + (Q[0] - Pp[0]) * t + nv[0] * 3.8, Pp[1] + (Q[1] - Pp[1]) * t + nv[1] * 3.8]; };
        const p = main0.pts;
        wedge = P(polyD([cut(p[2], p[3]), p[3], cut(p[3], p[4])]), K.ink);
      }
      fg += bo.back + KI.slimNeedle(B, Tp, main ? 6.6 : 5.4, main ? 2.4 : 2) + wedge + bo.front;
    });
    return { bg, fg };
  } };

  /** 붓깃 quill pen, back O → nib tip, in a 78-unit design space: vane wide on the top side only (paper, ink.300 barbs,
   *  one split), rachis, calamus, ink-dipped nib (front 20%) with a paper slit. {all, front}: front = calamus + nib. */
  function quill(O, deg, len) {
    const at = axis(O, deg), k = len / 78, Q = (t, s) => at(t * k, s * k), M = (a) => a.map(([t, s]) => Q(t, s));
    const topE = [[0, -1.4], [5, -5.6], [15, -8.8], [29, -10], [39, -9.4], [43.5, -6.4], [46, -9.2], [53, -7.8], [58, -3.4], [61.5, -0.6]];
    const botE = [[61.5, 0.9], [52, 2.8], [36, 3.8], [18, 3.6], [6, 2.6], [0, 1.4]];
    const vane = ptsD(M(smooth(topE, 6)).concat(M(smooth(botE, 6))), true);
    const lower = ptsD(M(smooth([[1, 0.6], [20, 0.8], [40, 0.8], [58, 0.6]], 4)).concat(M(smooth(botE, 6)).reverse()), true);
    const barbs = [[20, 7.5], [32, 6.5], [50, 5.5]].map(([t, l]) => L(`M${q(Q(t, -1))} L${q(Q(t - 6, -l - 0.5))}`, K.ink3, 1.2)).join('');
    const calamus = ptsD(M([[60, -1.8], [65, -1.6], [65, 1.6], [60, 1.8]]), true);
    const nib = ptsD(M(smooth([[64, -2.5], [70, -2.1], [75, -1], [78, 0]], 4).concat(smooth([[78, 0], [75, 1], [70, 2.1], [64, 2.5]], 4))), true);
    const front = S(calamus, K.p50, 1.8, 0.8) + `<path d="${nib}" fill="${K.ink}" stroke="${K.ink}" stroke-width="1.6" stroke-linejoin="round"/>` + L(`M${q(Q(67.5, 0))} L${q(Q(74, 0))}`, K.p50, 0.9);
    const all = S(vane, K.p50, 2.4, 1.2) + P(lower, K.p300) + barbs + L(`M${q(Q(-3, 0.5))} L${q(Q(62, 0))}`, K.ink, 1.8) + front;
    return { all, front, tip: Q(78, 0), u: at.u };
  }
  DRAW.brushQuills = { draw(c, A) {
    const G = [95, 64], gr = 13;
    // the black spot: one heavy brush stroke the quills ride on, pressed at the left, dry (비백) toward the ghoul
    // (kept narrow and running under the bundle: a wide dark wedge at the left read like ghostVolley's fan at 20 px)
    const band = smooth([[6, 73], [30, 68], [56, 62], [86, 57]], 8);
    let bg = P(blob(11, 73, 11, 9, 0.28, 41), A ? K.ink7 : K.ink) +
      taperFn(band, (t) => (t < 0.12 ? 20 + 80 * t : 29.6 * Math.pow(1 - (t - 0.12) / 0.88, 0.9) + 2.5), A ? K.ink7 : K.ink);
    [[[28, 64], [70, 57], 1.8], [[18, 76], [50, 69], 1.4], [[44, 70], [76, 62], 1.2]].forEach(([a, b, w]) => { bg += taperPoly([a, b], w, 0.2, A ? K.ink5 : K.paper, 'opacity="0.85"'); });
    // [nib tip, deg, length, pierces]: a narrow bundle (14°); the middle quill runs through the ghoul and out 30%
    const qs = A ? [[[99, 41], -19, 72], [[86, 92], -4.5, 68], [[110, 53], -15, 74], [[121, 61], -11.5, 80, true]] : [[[100, 44], -19, 74], [[88, 91], -5, 70], [[120, 60], -12, 80, true]];
    let fg = '', main = null;
    qs.forEach(([Tp, deg, len, pierce]) => {
      const u = axis([0, 0], deg).u, qq = quill([Tp[0] - u[0] * len, Tp[1] - u[1] * len], deg, len);
      if (pierce) main = qq; else fg += qq.all;
    });
    fg += main.all + ghoul(c, G[0], G[1], gr, 3);
    const X = entry(main.tip, main.u, G, gr);
    fg += `<path d="${splashD(X[0], X[1], 5.4, 5, 13, 0.5)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.6" stroke-linejoin="round"/>` + main.front;
    // (r 3.6: the 3.0 dot was faint at 32 px, 검수 1차 §2.3)
    fg += `<circle cx="${f(main.tip[0])}" cy="${f(main.tip[1])}" r="3.6" fill="${K.ally}" stroke="${K.ink}" stroke-width="1.8"/>` + L(`M${f(main.tip[0] - 1.9)},${f(main.tip[1] - 0.7)} Q${f(main.tip[0] - 1)},${f(main.tip[1] - 2.1)} ${f(main.tip[0] + 0.7)},${f(main.tip[1] - 2)}`, K.allyG, 0.9);
    return { bg, fg };
  } };

  /** 서리침 (B2 §6.3): the core needle body (paper, ink outline, eye slot) with its point turned cyan inside an ink rim;
   *  no thread. */
  function frostNeedle(B, Tp, w) {
    const len = Math.hypot(Tp[0] - B[0], Tp[1] - B[1]), at = axis(B, Math.atan2(Tp[1] - B[1], Tp[0] - B[0]) * 180 / Math.PI);
    // 검수 1차 F4: the cyan point covers the front 45% (from t 0.55) of a 9-wide needle: its base is about 6, 7.4 with the rim
    const hw = (t) => (w / 2) * Math.max(0, 1 - Math.pow((t - 0.14) / 0.86, 1.5));
    const tip = bodyD(at, len, hw, hw, 14, 0.55, 1.03);
    return KI.slimNeedle(B, Tp, w, 2.3) + `<path d="${tip}" fill="${K.ally}" stroke="${K.ink}" stroke-width="1.4" stroke-linejoin="round"/>` +
      L(`M${q(at(len * 0.62, -hw(0.62) * 0.35))} L${q(at(len * 0.95, -0.2))}`, K.allyG, 0.9, 'opacity="0.9"');
  }
  DRAW.frostNeedles = { draw(c, A) {
    const G = [100, 66], gr = 16, ln = A ? K.p300 : K.ink;
    // the black spot: frozen ground spreading in from the lower right; the ghoul's frosted half stands on it. Awakened
    // (검수 5차 N1): the same wedge turned to bright ice — p300 with an ink rim and three ink.300 cracks — since in ink7
    // it vanished into the awakened ink ground and the icon swapped with 먹침 / 망나니 침 at 32 px
    const ground = 'M18,132 C34,110 60,92 82,80 C96,72 112,70 134,68 L134,134 L18,134 Z';
    let bg = (A ? `<path d="${ground}" fill="${K.p300}" stroke="${K.ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
      L('M50,112 L61,104 L66,108 L76,98 M84,124 L93,111 L100,113 L108,99 M104,84 L113,88 L124,82', K.ink3, 1.4) : `<path d="${ground}" fill="${K.ink}"/>`) +
      speed([30, 80], [4, 86], 2.2, ln) + speed([20, 61], [0, 65], 1.8, ln);
    let fg = icePlate(100, 89, 23, 5.5) + ghoul(c, G[0], G[1], gr, 3);
    // thin branched crystals off the lower half of the body (two of them lie on the black body itself)
    const spikes = [[86, 72, 168, 14], [89, 79, 140, 19], [96, 82, 108, 13], [104, 82, 70, 12], [110, 78, 36, 19], [114, 70, 6, 13], [99, 75, -68, 11], [92, 71, -118, 9]];
    if (A) spikes.push([87, 62, 196, 12], [112, 60, -22, 14], [104, 67, -58, 12]);
    fg += frost(spikes, 5);
    const nd = A ? [[[14, 101], [68, 92]], [[18, 65], [72, 53]], [[29, 84], [86, 72]]] : [[[18, 64], [72, 52]], [[29, 84], [86, 72]]];
    nd.forEach(([B, Tp]) => { fg += frostNeedle(B, Tp, 9); });
    return { bg, fg };
  } };

  /** 쌍날 thrown crescent blade (no handle): outer circle R minus an inner circle (offset d, radius R2); paper blade,
   *  ink back along the concave edge, optional cyan edge line just inside the convex edge. Local convex side = −x. */
  function crescentD(R, dk = 0.55, rk = 0.9) {
    const d = R * dk, R2 = R * rk, x = (R * R - R2 * R2 + d * d) / (2 * d), y = Math.sqrt(Math.max(0, R * R - x * x));
    return { d: `M${f(x)},${f(-y)} A${f(R)},${f(R)} 0 1 0 ${f(x)},${f(y)} A${f(R2)},${f(R2)} 0 0 1 ${f(x)},${f(-y)} Z`, cx2: d, R2 };
  }
  function crescentBlade(c, key, cx, cy, R, rot, o = {}) {
    const g = crescentD(R, 0.6, 0.86), tr = `translate(${f(cx)},${f(cy)}) rotate(${f(rot)})`;
    // a heavy cast shadow (down-right, in screen space) carries the black spot at small sizes
    const sh = rad(-rot), sx = 2.4 * Math.cos(sh) - 3 * Math.sin(sh), sy = 2.4 * Math.sin(sh) + 3 * Math.cos(sh);
    let s = `<g transform="${tr}"><path d="${g.d}" fill="${K.ink}" stroke="${K.ink}" stroke-width="3.4" stroke-linejoin="round" transform="translate(${f(sx)},${f(sy)})"/>` +
      `<path d="${g.d}" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.8" stroke-linejoin="round"/>` +
      // ink back along the concave edge (thin) and a paper-shadow band on the far side of the blade
      `<g clip-path="${c.clip('cb' + key, g.d)}"><circle cx="${f(g.cx2)}" cy="0" r="${f(g.R2)}" fill="none" stroke="${K.ink}" stroke-width="${f(R * 0.24)}"/>` +
      `<path d="M${f(-R * 0.1)},${f(R * 0.62)} A${f(R)},${f(R)} 0 0 0 ${f(R * 0.4)},${f(R * 0.95)}" fill="none" stroke="${K.p300}" stroke-width="${f(R * 0.3)}"/></g>`;
    const er = R - 3.6, ea = (a) => [Math.cos(rad(a)) * er, Math.sin(rad(a)) * er];
    const edge = `M${q(ea(o.cyan ? 125 : 138))} A${f(er)},${f(er)} 0 0 0 ${q(ea(o.cyan ? 228 : 210))}`;
    s += o.cyan ? cyanLine(edge, 2.4, false) : L(edge, K.ink3, 1.1);
    return s + '</g>';
  }
  /** A thrown blade's spin: one tapered paper/ink arc on its trailing side, thick where the blade has just been (part
   *  turns, never a closed C; long dark trails from the two blades met in a '<' at the left edge, so there are none).
   *  dir = flight direction in degrees. */
  function bladeSpin(cx, cy, R, dir) {
    // 검수 1차 R2: one arc per blade — paper 1.4 inside ink 0.8 a side, thinning away from the blade. Two arcs per blade
    // stacked into three or four concentric lines (an even run of parallels).
    const p = [], back = dir + 180;
    for (let i = 0; i <= 14; i++) { const t = rad(lerp(back + 30, back - 80, i / 14)); p.push([cx + Math.cos(t) * (R + 5), cy + Math.sin(t) * (R + 5)]); }
    return taperPoly(p, 3, 0.4, K.ink) + taperPoly(p, 1.4, 0.2, K.p50);
  }
  DRAW.twinBlades = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // [centre, R, rotation, flight°, cyan]: never a mirrored V — sizes, heights and turns differ
    // 검수 1차 R3: the awakened third blade sits back at the lower left — three white discs in a balanced triangle inside
    // the ensō could read as a crest (三つ巴)
    const bl = A ? [[[58, 37], 18, 200, -16, true], [[22, 93], 15, 150, 0, false], [[78, 87], 20, 25, 7, false]]
      : [[[59, 40], 18, 200, -16, true], [[77, 86], 20, 25, 7, false]];
    let bg = '', fg = '', arcs = '';
    bl.forEach(([p, R, , dir]) => { arcs += bladeSpin(p[0], p[1], R, dir); });
    bg += speed([22, 70], [2, 74], 2.2, A ? K.p300 : K.ink) + speed([34, 100], [16, 101], 1.8, A ? K.p300 : K.ink);
    fg += arcs + knocked(c, 108, 71, 13, 3, 15, { ln: col, drags: [[1, 0], [0.45, 3]] });
    bl.forEach(([p, R, rot, , cy], i) => { fg += crescentBlade(c, i, p[0], p[1], R, rot, { cyan: cy }); });
    return { bg, fg };
  } };

  /** 혼령 화살 (B2 §6.6): line only — ink.300 outline 2.2 over paper α0.35 with a paper inner line (α0.6 filled the leaf
   *  into a spoon at 120 px), willow-leaf head (never a triangle), a paper-line shaft with an ink.300 edge; the cyan
   *  two-tongued flame fletching (ink rim) is the cyan element. {back, front} for piercing. */
  function ghostArrow(O, deg, len, fl = 1) {
    const at = axis(O, deg), hb = len - 22, M = (a) => a.map(([x, s]) => at(x, s));
    // willow-leaf head: widest a third of the way from its back, long and narrow to the point (no spoon, no triangle)
    const up = smooth([[hb, 0], [hb + 4, -2.7], [hb + 9, -3.1], [hb + 16, -1.7], [len, 0]], 5);
    const lo = smooth([[len, 0], [hb + 16, 1.7], [hb + 9, 3.1], [hb + 4, 2.7], [hb, 0]], 5);
    const headD = ptsD(M(up).concat(M(lo)), true), shaftD = ptsD(M([[8, 0], [hb + 2, 0]]));
    const flame = ptsD(M(smooth([[20, -1.2], [12, -3.8], [3 - 11 * fl, -5.4 * fl], [0, -2], [3, 0.2], [0, 2], [4 - 8 * fl, 4.8 * fl], [10, 3.8], [20, 1.2]], 5)), true);
    // drawn in light lines: a paper line with an ink.300 edge for the shaft, an outlined leaf with a midrib for the head
    const head = `<path d="${headD}" fill="${K.p50}" fill-opacity="0.35" stroke="${K.ink3}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="${headD}" fill="none" stroke="${K.p50}" stroke-width="0.9" stroke-linejoin="round"/>` + L(ptsD(M([[hb + 3.5, 0], [len - 4, 0]])), K.ink3, 0.9);
    const shaft = L(shaftD, K.ink3, 3.4) + L(shaftD, K.p50, 1.5);
    const fire = `<path d="${flame}" fill="${K.ally}" stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"/>` + L(ptsD(M([[15, -2.2], [8, -3.6], [1 - 5 * fl, -4.4 * fl]])), K.allyG, 1, 'opacity="0.9"');
    return { back: shaft + fire + head, front: head, tip: at(len), u: at.u };
  }
  DRAW.ghostVolley = { halo: false, draw(c, A) {
    const G = [98, 64], gr = 14, O0 = [-10, 92], fl = A ? 1.35 : 1, col = A ? K.ink7 : K.ink;
    // the black spot: a dark fan of wash opening from the lower left behind the volley, ending ragged before the ghoul
    let bg = `<path d="M-12,86 C14,72 46,52 76,40 C80,46 78,52 84,56 C80,62 86,70 82,76 C86,84 80,92 82,98 C50,100 20,102 -12,104 Z" fill="${col}"/>` +
      [[[20, 82], [70, 60], 2], [[30, 92], [74, 84], 1.6], [[14, 96], [44, 95], 1.4]].map(([a, b, w]) => taperPoly([a, b], w, 0.2, A ? K.ink5 : K.ink3)).join('');
    // [deg, tip distance, length, role]: a fan of ±10°, staggered; one passes through the ghoul
    const ar = A ? [[-24.5, 92, 58], [-19, 104, 62], [-13.5, 98, 60], [-8.5, 124, 66, 'pierce'], [-2.5, 90, 56]]
      : [[-24, 92, 58], [-17, 104, 64], [-10, 124, 66, 'pierce'], [-3.5, 92, 56]];
    let fg = '', pierce = null;
    ar.forEach(([deg, D, len, role]) => {
      const u = axis([0, 0], deg).u, Tp = [O0[0] + u[0] * D, O0[1] + u[1] * D], a = ghostArrow([Tp[0] - u[0] * len, Tp[1] - u[1] * len], deg, len, fl);
      fg += a.back; if (role) pierce = a;
    });
    fg += ghoul(c, G[0], G[1], gr, 3);
    const X = entry(pierce.tip, pierce.u, G, gr);
    fg += `<path d="${splashD(X[0], X[1], 5.4, 5, 17, 0.5)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.5" stroke-linejoin="round"/>` + pierce.front;
    return { bg, fg };
  } };

  /** 망나니 침: a thick dart (ink shaft 6, paper knock-out) carrying a wide curved single-edged blade: paper blade, ink back
   *  along the spine, the cyan edge line. Blade space: x forward from the mount, s down; spine on top, belly edge below. */
  function headsmanDart(O, deg, len, k = 1, cyan = true, heavy = false) {
    const at = axis(O, deg), B = (x, s) => at(len + x * k, s * k), M = (a) => a.map(([x, s]) => B(x, s));
    // falchion head (검수 1차 F1): straight spine, the belly widest toward the point — widest at the heel it read as a
    // ladle — and a mitred point running past the spine; heel square to a tang collar on the shaft
    const belly = smooth([[37, -10.5], [34, -4], [28, 5], [19, 8.6], [9, 7], [1, 4.8], [-1, 4.2]], 6);
    const blade = ptsD(M([[-2, -6], [13, -8.4], [27, -9.4]]).concat(M(belly), M([[-2, 4.2]])), true);
    // the ink back is a band along the spine only (3–4 thick); the blade body stays paper. heavy (검수 6차 R1, the plain
    // icon's dart only): a black back about 6 thick over the paper face, so at 20 px the blade is a black-over-white mass
    // rather than an outline on paper (it and 뇌침 both shrank to 'a thin diagonal + an ink mass on the right')
    const back = ptsD(M(heavy ? [[-2, -6], [13, -8.4], [27, -9.4], [35, -10.2], [33.4, -7.8], [29, -4.6], [20, -3.2], [9, -2.2], [-2, -0.2]]
      : [[-2, -6], [13, -8.4], [27, -9.4], [35, -10.2], [31, -7.4], [20, -5.6], [9, -4.6], [-2, -2.6]]), true);
    // paper shade and the cyan edge line follow the new belly 2–3 inside it
    const shade = ptsD(M(smooth([[34.6, -3.6], [28.6, 3.8], [19.6, 6.6], [9.6, 5.2], [2.4, 3.4], [9, 2.4], [19, 3.4], [27.4, 1.2]], 5)), true);
    const eLine = ptsD(M(smooth([[33.8, -6.6], [31.4, -1.6], [26.4, 3.4], [18.8, 5.8], [10.4, 4.8]], 5)));
    const tip = ptsD(M([[33, -11.6], [40, -11], [34, -7.4]]), true), tipEdge = ptsD(M([[33, -11.6], [40, -11], [34, -7.4]]));
    const neck = ptsD(M([[-4, -7], [0, -7], [0, 5.5], [-4, 5.5]]), true);
    const shaft = `M${q(at(6))} L${q(at(len - 3 * k))}`;
    const vane = (sg) => ptsD(smooth([at(16, sg * 2.2), at(7, sg * 6), at(-2, sg * 8.6), at(1, sg * 4.6), at(4, sg * 2.2)], 4), true);
    return S(vane(1), K.p50, 2, 1) + S(vane(-1), K.p50, 2, 1) + L(shaft, K.p50, 8.6) + L(shaft, K.ink, 6) +
      S(blade, K.p50, 3, 1.6) + P(shade, K.p300) + P(back, K.ink) +
      P(tip, K.p50) + `<path d="${tipEdge}" fill="none" stroke="${K.ink}" stroke-width="2.6" stroke-linejoin="miter" stroke-miterlimit="12" stroke-linecap="round"/>` +
      `<path d="${neck}" fill="${K.ink}" stroke="${K.ink}" stroke-width="1.2" stroke-linejoin="round"/>` +
      (cyan ? cyanLine(eLine, 2.4, false) : L(eLine, K.ink3, 1.1));
  }
  DRAW.headsmanDarts = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // the black spot: the shaft, the torn ghoul and the ink spilled under it (a backdrop wash read as an egg, an ink burst
    // behind the ghoul as spiky hair, so neither is kept)
    let bg = speed([20, 90], [-4, 97], 2.6, A ? K.p300 : K.ink) + speed([28, 97], [6, 104], 1.8, A ? K.p300 : K.ink);
    // 검수 1차 F1-5·R1: the spill makes up the ink the slimmer blade back gave away — a ragged, flattened splat on the
    // ground a little right of the ghoul (the side the blade opened), with drops. (A smooth oval read as a plinth under
    // a bust, a lumpy pool as a slug, ball-ended fingers as a beetle's legs, long straight spikes as blades.) The
    // awakened icon lays the same splat in ink7 (검수 2차 F2b (b)) in place of the flicks.
    // (검수 6차 R1: the plain icon's splat is 0.5 high, from 0.32, so C10u clears 15 (it was 13.9 before R1); the
    // awakened splat stays 0.32)
    bg += `<g transform="translate(108 102) scale(1 ${A ? 0.32 : 0.5}) translate(-108 -102)">${P(splashD(108, 102, 32, 9, 46, 0.55, -0.2), col)}</g>` +
      P(blob(126, 95, 2.2, 6, 0.5, 44) + blob(121, 110, 1.6, 6, 0.5, 47) + blob(80, 105, 1.5, 6, 0.5, 45), col);
    let fg = '';
    // awakened (검수 2차 F2b): the second ghoul stands apart, down and to the left — centres 41.7 apart, silhouettes about
    // 10 apart even with its upper piece opened toward the first, so the paper halo does not bind the two into a head and
    // a body segment — and the small blade is aimed at it, its point at the outline; neither ghoul flicks
    // 검수 5차 N1 (awakened only): the big blade head is the largest bright mass — 1.2 × on a mount 4 further back, so
    // its belly still stops short of the torn ghoul's eyes — and the small blade rides a stub of shaft (same mount and
    // aim, its tail moved up 18), so no two long bars lie side by side; the ground splat stays dark (the bright lower
    // right is 서리침's cue)
    if (A) fg += tornGhoul(c, 71, 110, 11, 9, 'b', { deg: -10, open: [4, -5, -12], flicks: false }) + headsmanDart([14, 109.1], -6, 20.5, 0.72, false);
    fg += tornGhoul(c, 100, 80, 16, 5, 'a', A ? { flicks: false } : undefined) + (A ? headsmanDart([2, 88], -16, 54, 1.2) : headsmanDart([6, 89], -16, 56, 1.12, true, true));
    return { bg, fg };
  } };

  // ---- burst (§3.1): an origin at the centre (64, 66), the motif bursting outward at r 22–60 (lengths ±15%, angles ±6°).
  // Nothing long points into the seal corner: toward −45° motifs stop inside r 44. ----
  const BC = [64, 66];

  /** 종이 폭풍 blade: a folded paper triangle from its base centre B along deg (len, base wid): the folded half p300, the
   *  fold an ink.300 line; the base is skewed so no two blades match. */
  function foldBlade(B, deg, len, wid, flip) {
    const at = axis(B, deg), s = flip ? -1 : 1;
    const tip = at(len, 0), b1 = at(-len * 0.04, -wid * 0.5 * s), b2 = at(len * 0.12, wid * 0.5 * s), mid = at(len * 0.03, wid * 0.05 * s);
    return { s: S(polyD([tip, b1, b2]), K.p50, 2.2, 1.1) + P(polyD([tip, mid, b2]), K.p300) + L(ptsD([at(len * 0.9, 0), mid]), K.ink3, 1.2), tip };
  }
  DRAW.paperStorm = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, ln = A ? K.p300 : K.ink;
    // the black spot: the ink smudge at the centre (ragged, r about 15) and the wind's heavy brush sweeps between the blades,
    // of different lengths and radii (one continuous ink spiral read as '@')
    let bg = P(blob(64, 66, 15, 10, 0.5, 31), col);
    [[188, 296, 25, 13, col], [22, 118, 39, 10, col], [-120, -66, 46, 4, ln]].concat(A ? [[136, 206, 55, 3.4, ln]] : []).forEach(([a0, a1, r, w, cl]) => {
      const p = []; for (let i = 0; i <= 18; i++) { const t = i / 18; p.push(polar(BC, lerp(a0, a1, t), r + 7 * t)); }
      bg += taperFn(p, (t) => w * Math.pow(1 - t, 0.85) + 0.6, cl);
    });
    // the cyan wind stroke curling out of the centre (drawn over the blades): it starts inside the smudge and opens out
    // fast, so it is a spiral arm, never a ring round the centre
    const wind = []; for (let i = 0; i <= 18; i++) { const t = i / 18; wind.push(polar(BC, 160 + 140 * t, 4 + 38 * Math.pow(t, 1.3))); }
    let fg = '';
    // [base angle, base r, length, flip]: a pinwheel that spins open — inner blades leave the smudge tilted 40–55°
    // clockwise off the radius, the outer ones have already flown out; uneven sizes and steps, nothing long toward the
    // seal corner
    const bl = [[-170, 15, 27, 0, 48], [-96, 14, 27, 1, 44], [-22, 16, 26, 0, 52], [50, 15, 28, 1, 46], [118, 17, 25, 0, 54],
      [-134, 36, 21, 1, 50], [158, 38, 23, 0, 42], [84, 40, 20, 1, 50]];
    if (A) bl.push([-78, 34, 17, 0, 40], [10, 40, 22, 1, 44]);
    bl.forEach(([a, r, len, fl, pitch]) => { fg += foldBlade(polar(BC, a, r), a + pitch, len, len * 0.46, !!fl).s; });
    fg += cyanLine(ptsD(wind), 2.4, false);
    // 관통: a blade that went through a ghoul at the lower right and comes out of its paper hole
    const G = [100, 103], gr = 11, pd = 48, ex = polar(G, pd, gr * 0.62);
    fg += pierced(c, G, gr, 3, '', ex, foldBlade(polar(ex, pd + 180, 2), pd, 22, 10, true).s);
    // paper crumbs
    [[30, 32, 3.2, 41], [108, 54, 2.6, 42], [18, 78, 2.4, 43], [58, 114, 2.8, 44]].forEach(([x, y, r, s]) => { fg += `<path d="${splashD(x, y, r, 4, s, 0.7)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.2" stroke-linejoin="round"/>`; });
    return { bg, fg };
  } };

  /** 먹꽃 petal: an ink petal from O (round back) to the tip along deg, with one ink.500 light stroke; a drop hangs from its
   *  tip (pointing down whatever the petal's direction). bend (units at the tip, + = the n side) curves the petal's axis
   *  (검수 4차 R4: one petal bent). */
  function inkPetal(O, deg, len, wid, col, bend = 0) {
    const at = axis(O, deg), w = wid / 2, M = (a) => a.map(([t, s]) => at(t * len, s * w + bend * t * t));
    const top = smooth(M([[0, -0.45], [0.16, -0.95], [0.45, -1], [0.78, -0.55], [1, 0]]), 6);
    const bot = smooth(M([[1, 0], [0.8, 0.4], [0.47, 0.85], [0.17, 0.8], [0, 0.4]]), 6);
    const back = smooth(M([[0, 0.4], [-0.12, 0], [0, -0.45]]), 4);
    const d = ptsD(top.concat(bot.slice(1), back.slice(1)), true), tip = at(len, bend);
    return S(d, col, 2, 1.2) + L(ptsD(smooth(M([[0.2, -0.5], [0.42, -0.47], [0.64, -0.36]]), 3)), K.ink5, 1.8) + P(dropD(tip[0] + 0.4, tip[1] + 3.9, 7, 2.3), col);
  }
  DRAW.inkBloom = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // [deg, length, width, bend]: six petals at uneven angles (steps 37–84°) and lengths, the lower left one bent (the
    // upper right one short, clear of the seal corner). 검수 4차 R4: steps of 60° ± 4° read as '✻' at 20 px.
    const pe = [[-171, 27, 11, 0], [-109, 33, 12, 0], [-33, 24, 10, 0], [9, 31, 12, 0], [93, 28, 11, 0], [130, 30, 12, -9]];
    if (A) pe.push([51, 22, 9, 0]);
    let bg = '', fg = '';
    // 먹 감속: a ghoul at the lower right stands in ink up to its ankles and trails drops
    const G = [104, 100], gr = 11;
    fg += ghoul(c, G[0], G[1], gr, 5) + P(blob(G[0] + 1, G[1] + gr * 0.9, 15, 9, 0.35, 61, 0.3), col) +
      P(dropD(86, 107, 6, 2) + dropD(79, 102, 4.6, 1.6) + (A ? dropD(73, 108, 4, 1.4) : ''), col);
    pe.forEach(([deg, len, wid, bend]) => { fg += inkPetal(polar(BC, deg, 9), deg, len, wid, col, bend); });
    // scattered drops (awakened: more)
    (A ? [[40, 30], [86, 28], [24, 104], [64, 116], [114, 64]] : [[38, 32], [26, 106]]).forEach(([x, y]) => { fg += P(dropD(x, y, 5, 1.7), col); });
    // the stamen: an irregular paper blob (r about 10, no centre dot), the cyan part of its rim half a turn at most
    const R = rng(77), st = [];
    for (let i = 0; i < 10; i++) { const a = -90 + i * 36 + (R() - 0.5) * 14; st.push(polar(BC, a, 10 * (0.82 + 0.36 * R()))); }
    const stD = ptsD(smooth(st.concat([st[0]]), 5), true);
    // (the cyan part runs half the rim, about 30 long, cyan 3.4 in ink 5.8: at 32 px a four-tenths arc of 2.4 faded into
    // the ink petals, 검수 2차 §7-1)
    fg += `<path d="${stD}" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.4" stroke-linejoin="round"/>` + cyanLine(ptsD(smooth(st.slice(4, 10), 5)), 3.4, false);
    return { bg, fg };
  } };

  /** 가시 테 rose thorn standing on P0, pointing along deg: a wide base (len × 0.6), concave sides, the tip curled to the
   *  curl side (±1). */
  function roseThorn(P0, deg, len, curl) {
    const at = axis(P0, deg), b = len * 0.3;
    const a = smooth([at(-1.5, -b), at(len * 0.35, -b * 0.42 + curl * 0.04 * len), at(len * 0.72, curl * 0.12 * len), at(len, curl * 0.3 * len)], 5);
    const z = smooth([at(len, curl * 0.3 * len), at(len * 0.62, b * 0.32 + curl * 0.12 * len), at(len * 0.28, b * 0.62), at(-1.5, b)], 5);
    return polyD(a.concat(z.slice(1)));
  }
  DRAW.thornHalo = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, R0 = 38, k = A ? 1.2 : 1;
    // the vine: three uneven pieces (the gaps never close the ring; one gap sits on the seal corner); nothing at the
    // centre (a dot inside the ring read as an eye). 검수 4차 R7: the gaps open to 24·28·33° and one piece ends in a curling
    // tendril, so it reads as a rose vine and stays clear of a crown of thorns (16·18° gaps all but closed the ring)
    const segs = [[-29, 64], [88, 146], [174, 298]];
    const vr = (a) => R0 + 1.8 * Math.sin(rad(a) * 3 + 0.7);
    const vw = (t) => (t < 0.1 ? 2.4 + 80 * t : t > 0.9 ? 2.4 + 80 * (1 - t) : 9.6 + 2.6 * Math.sin(t * 7.3));
    let bg = '', fg = '';
    const arcs = segs.map(([a0, a1]) => { const p = []; for (let i = 0; i <= 24; i++) { const a = lerp(a0, a1, i / 24); p.push(polar(BC, a, vr(a))); } return p; });
    // [angle on the ring, length, curl]: thorns at uneven steps and lengths, curled the way the vine grows
    const th = [[-20, 15, 1], [6, 10, -1], [31, 19, 1], [54, 12, 1], [96, 17, -1], [118, 10, 1], [138, 15, 1], [182, 11, -1], [204, 19, 1], [231, 13, -1], [258, 17, 1], [286, 10, 1]];
    if (A) th.push([43, 11, -1], [192, 13, 1]);
    let thorns = '';
    th.forEach(([a, len, cu]) => { const r = vr(a) + 3.6; thorns += P(roseThorn(polar(BC, a, r), a + cu * 8, len * k * 1.15, cu), col); });
    // thorns torn loose and flying off (with a short speed stroke behind each)
    const fly = [[-72, 55, 13], [116, 57, 11], [214, 56, 14]].concat(A ? [[22, 59, 12]] : []);
    fly.forEach(([a, r, len]) => { const p = polar(BC, a, r); thorns += P(roseThorn(p, a + 10, len * k, 1), col) + speed(polar(BC, a - 3, r - 2), polar(BC, a - 6, r - 13), 2, A ? K.p300 : K.ink); });
    fg += thorns + arcs.map((p) => taperFn(p, vw, col)).join('');
    // the tendril off the second piece's end (146°): it leaves along the vine and curls out, away from the ring, in an
    // open hook of 250° (never a closed '@'), tapering 3.2 → 0.6
    const tp = [polar(BC, 145.5, vr(145.5))];
    for (let i = 1; i <= 14; i++) { const s = i / 14; tp.push(polar(tp[i - 1], 236 - 250 * Math.pow(s, 1.3), 2 * k * (1 - 0.55 * s))); }
    fg += taperFn(tp, (t) => 3.2 * (1 - t) + 0.6, col);
    // the cyan thread running inside one piece of the vine (clear of its tapered ends)
    const inner = []; for (let i = 0; i <= 16; i++) { const a = lerp(95, 139, i / 16); inner.push(polar(BC, a, vr(a) - 0.4)); }
    fg += cyanLine(ptsD(inner), 2.4, false);
    return { bg, fg };
  } };

  /** 별조각 shard: an irregular polygon (points around its own centre, turned by deg), thick rim, one face p300. */
  function shard(C0, deg, pts, faceTo) {
    const P0 = rotP(pts.map(([x, y]) => [C0[0] + x, C0[1] + y]), deg, C0), d = polyD(P0);
    return S(d, K.p50, 3, 1.4) + P(polyD([P0[0], P0[faceTo], C0]), K.p300);
  }
  DRAW.starShards = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // the black spot: the blast behind the shards, burst to one side (검수 4차 M1) — a ragged ink splat centred (60, 70),
    // a little left of and below the flash, squashed to 0.86: seven lobes at uneven steps, each torn with a side notch,
    // long and broad to the left and the lower left, short and blunt toward the seal corner and the ghoul. (An 8-spike
    // splash centred on the flash read as a star; clean triangle spikes read as a black star, thin streaks as a mine.)
    // [angle, radius] around the splat
    const BO = [60, 70];
    const sp = [[-178, 46], [-168, 30], [-160, 37], [-147, 22], [-133, 33], [-121, 21], [-105, 34], [-93, 20], [-70, 22], [-55, 27], [-41, 18],
      [-15, 21], [5, 33], [17, 20], [40, 22], [61, 27], [79, 20], [100, 23], [117, 22], [129, 45], [139, 30], [153, 40], [166, 25]];
    let bg = P(polyD(sp.map(([a, r]) => { const p = polar(BO, a, r); return [p[0], BO[1] + (p[1] - BO[1]) * 0.86]; })), col), fg = '';
    // shards of 4–5 sides, each with one sharp vertex (vertex 0) pointing out
    const SH = [
      [[13, 0], [2, -8], [-9, -7], [-11, 5], [1, 9]],
      [[12, 1], [-1, -9], [-10, -2], [-6, 8]],
      [[14, -1], [4, -9], [-8, -8], [-12, 3], [-2, 10]],
      [[11, 0], [0, -8], [-9, -1], [-3, 9]],
      [[13, 2], [3, -7], [-8, -6], [-10, 6], [3, 8]]
    ];
    // [angle, distance, shape, size, tilt]: five shards at uneven steps (56·44·66·94·100°) and distances (36–50), each
    // turned 16–26° off its radius, so they never settle into a regular five-pointed star (검수 4차 M1: 70–74° steps at
    // one distance, every shard pointing straight out, read as a star); the awakened sixth goes in the empty lower left
    const pos = [[-160, 36, 0, 1.2, 22], [-104, 50, 1, 0.85, -18], [-60, 36, 2, 1, -20], [6, 43, 3, 1.25, 16], [100, 40, 4, 0.95, -26]];
    if (A) pos.push([152, 52, 1, 0.8, -16]);
    pos.forEach(([a, r, s, kk, tl]) => { fg += shard(polar(BC, a, r), a + tl, SH[s].map(([x, y]) => [x * kk, y * kk]), 2); });
    // the centre: ink cracks, the irregular paper flash with its cyan core
    fg += L('M64,66 L56,58 L52,60 L46,54 M64,66 L72,74 L70,80 M64,66 L74,60 L80,61 M64,66 L60,76 L54,80', K.ink, 1.8) +
      `<path d="${splashD(64, 66, 19, 7, 83, 0.4)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<path d="${splashD(64, 66, 9, 6, 84, 0.5)}" fill="${K.ally}" stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"/>`;
    // 관통: a shard that tore through a ghoul at the lower right comes out of its paper hole
    const G = [104, 102], gr = 11, pd = 42, ex = polar(G, pd, gr * 0.6);
    fg += pierced(c, G, gr, 7, '', ex, shard(polar(ex, pd, 5), pd, [[10, 0], [1, -6], [-6, -1], [-2, 6]], 1));
    return { bg, fg };
  } };

  DRAW.sunNeedles = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // the cushion's shadow on the ground (the black spot with the ink points)
    let bg = `<ellipse cx="70" cy="88" rx="30" ry="7.5" fill="${col}"/>`, fg = '';
    // [angle, start r, length, width, tilt]: needles thrown out tumbling — uneven angles (±30%), start radii (24–46) and
    // lengths, tilted 15–35° off the radius so they never line up into rays (no rising-sun pattern); two still stuck
    // half way in the cushion (start inside it, the eye outward)
    const nd = [[-170, 30, 26, 5, 24], [-146, 42, 20, 4.4, -30], [-121, 26, 31, 5.2, 18], [-99, 40, 22, 4.4, -26], [-80, 27, 27, 5, 32], [-58, 36, 18, 4.2, -20],
      [-20, 28, 30, 5.2, 26], [3, 41, 21, 4.4, -32], [22, 27, 26, 5, 20], [44, 38, 19, 4.2, -24], [66, 29, 25, 5, 30], [100, 26, 30, 5.2, -18],
      [124, 39, 21, 4.4, 28], [148, 28, 27, 5, -22], [162, 13, 21, 4.6, 0], [-36, 13, 19, 4.4, 0]];
    if (A) nd.push([-110, 52, 16, 4, 34], [12, 54, 15, 4, -30], [82, 47, 17, 4, 26], [-158, 52, 15, 4, -28], [136, 52, 16, 4, 22], [-68, 50, 14, 4, -34]);
    let under = '';
    nd.forEach(([a, r0, len, w, tl]) => {
      const B = polar(BC, a, r0), Tp = polar(B, a + tl, len);
      // stuck: the eye outward, the point inside the cushion (drawn under it, so only the part outside shows)
      under += r0 < 20 ? KI.slimNeedle(Tp, B, w, 2) : KI.slimNeedle(B, Tp, w, 2.1);
    });
    // the cushion (3/4 view): paper with a heavy rim, a p300 underside, quilting seams; one seam is the cyan thread
    const cu = `M44,66 C44,52 54,46 64,46 C76,46 85,53 85,66 C85,79 76,86 64,86 C52,86 44,79 44,66 Z`;
    fg += under + S(cu, K.p50, 3, 1.8) + `<path d="M46,70 C50,82 78,84 83,70 C82,80 74,86 64,86 C54,86 47,80 46,70 Z" fill="${K.p300}"/>` +
      L('M58,47.4 C54,56 53,74 57,85 M71,47.6 C75,56 76,74 72,85', K.ink3, 1.4) + cyanLine('M64.6,46.6 C63,58 63.4,74 65,85.4', 2.4, false);
    // 관통: a needle through a ghoul at the lower left
    const G = [24, 102], gr = 10, pa = 152, B0 = polar(BC, pa, 24), T0 = polar(G, pa, gr + 9);
    fg += pierced(c, G, gr, 9, KI.slimNeedle(B0, T0, 5, 2), polar(G, pa, gr * 0.7), '');
    return { bg, fg };
  } };

  // ---- spray (§3.1): from an object at the lower left (6–20, 100–124), small things fan out in a cone, rising, smaller
  // the farther they go, the centre line wobbling (S); spaced at least their own length apart, never a single row ----

  /** 먹 이슬비 drop: an elongated ink drop flying along deg from its back point B (len, width len × 0.64), pointed front. */
  function flyDrop(B, deg, len, col) {
    const at = axis(B, deg), w = len * 0.35, M = (a) => a.map(([t, s]) => at(t * len, s * w));
    return S(ptsD(smooth(M([[1, 0], [0.62, -0.62], [0.24, -1], [0.02, -0.7], [0, 0], [0.02, 0.7], [0.24, 1], [0.62, 0.62], [1, 0]]), 5), true), col, 1.2, 0.8);
  }
  DRAW.inkDrizzle = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, O = [26, 104], u = axis(O, -16);
    let bg = '', fg = '';
    // the brush at the lower left (B2 §6.5: paper ferrule, heavy ink bristles, a fine point), flicking up and to the right;
    // a wet ink splash where the flick leaves the bristles (the black spot with the drops: 검수 R1 lower bound)
    const br = axis([-12, 122], -24), BM = (a) => a.map(([t, s]) => br(t, s));
    fg += S(ptsD(BM([[0, -6.6], [18, -6.6], [18, 6.6], [0, 6.6]]), true), K.p50, 2.6, 1.3) + L(ptsD(BM([[5, -6.6], [5, 6.6]])) + ' ' + ptsD(BM([[11, -6.6], [11, 6.6]])), K.ink3, 1.4) +
      S(ptsD(smooth(BM([[18, -10.4], [31, -11.4], [44, -6.4], [53, 0], [44, 5.2], [31, 9.8], [18, 10.4]]), 5), true), col, 2, 1.4) +
      L(ptsD(BM([[22, -4.2], [42, -2.2]])), K.ink5, 2.2) + P(splashD(O[0] + 3, O[1] - 1, 18.5, 7, 95, 0.52), col);
    // the flick itself: a short dry-brush stroke off the bristle tip under the first drops
    fg += inkTrail([O[0] + 4, O[1] + 2], [O[0] + 37, O[1] - 7], 13.5, col);
    // [distance along the S centre line, side offset, length]: twelve drops (fourteen and two outer branches awakened),
    // the near ones big, the far ones small, spaced at least their own length apart; the cone 34°, rising 16°
    const dr = [[20, 1, 17], [31, -11, 16], [37, 11, 15], [49, -1, 14.5], [56, -20, 13.5], [62, 17, 13], [73, 3, 12.5], [81, -16, 12], [88, 22, 11], [98, -4, 10.5], [104, 14, 10], [110, -18, 9.5]];
    if (A) dr.push([66, 31, 11], [92, 33, 10], [72, -31, 11.5], [98, -32, 9.5]);
    const front = dr.length - (A ? 4 : 0);
    // the front three's wet streaks [length, turn off the drop's axis, bow]: 26 / 14 / 20 long, splayed 11–13° apart and
    // bent different ways (검수 4차 R2: three straight streaks of 20–22 lying almost parallel read as '≡')
    const wet = [[26, -6, 2.2], [14, 3, -1.6], [20, 5, -2.6]];
    dr.forEach(([d, s, len], i) => {
      const wob = 4.5 * Math.sin(d / 22), p = u(d, s + wob), a = Math.atan2(p[1] - O[1], p[0] - O[0]) * 180 / Math.PI + (i % 3 - 1) * 4;
      // the front three: a wet cyan streak trailing each (ink under the cyan, §5.3; 32 px reading)
      if (i >= front - 3 && i < front) {
        const [sl, tw, bw] = wet[i - front + 3], s0 = polar(p, a + 180, len * 0.4), s1 = polar(s0, a + 180 + tw, sl), mc = polar(polar(s0, a + 180 + tw, sl / 2), a + 270 + tw, bw * 2);
        fg += cyanLine(`M${q(s0)} Q${q(mc)} ${q(s1)}`, 2.4, false);
      }
      fg += flyDrop(polar(p, a + 180, len / 2), a, len, col);
    });
    return { bg, fg };
  } };

  /** 핀 우박 pin: a kunai-like dagger pin from its ring end B along deg: a diamond paper blade and a hollow ink ring
   *  handle; groove = the cyan groove (largest pin only). */
  function daggerPin(B, deg, len, groove) {
    const at = axis(B, deg), w = len * 0.17, rr = len * 0.13;
    const blade = ptsD([at(len, 0), at(len * 0.56, -w), at(rr * 2 + 1, 0), at(len * 0.56, w)], true), rc = at(rr, 0);
    return `<ellipse cx="${f(rc[0])}" cy="${f(rc[1])}" rx="${f(rr * 1.05)}" ry="${f(rr * 0.75)}" transform="rotate(${f(deg)} ${f(rc[0])} ${f(rc[1])})" fill="none" stroke="${K.ink}" stroke-width="3"/>` +
      S(blade, K.p50, 2, 1) + P(ptsD([at(len, 0), at(len * 0.56, w), at(rr * 2 + 1, 0), at(len * 0.56, w * 0.3)], true), K.p300) +
      // the cyan groove (biggest pin only): about 20 long, full width (2.4 cyan in 4.8 ink) where the blade is wide,
      // tapering toward the point so it stays inside the blade
      (groove ? taperPoly([at(rr * 2 + 1.6, -0.2), at(len * 0.56, -0.2), at(len * 0.9, -0.1)], 4.8, 1.8, K.ink) + taperPoly([at(rr * 2 + 2.4, -0.2), at(len * 0.56, -0.2), at(len * 0.86, -0.1)], 2.4, 0.6, K.ally)
        : L(ptsD([at(rr * 2 + 3, 0), at(len - 4, 0)]), K.ink3, 1));
  }
  DRAW.pinHail = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, O = [26, 104];
    let bg = '', fg = '';
    // the pin tube: a big tilted ink cylinder at the lower left, its open mouth (paper rim) toward the cone, a burst of ink
    // flung from the mouth behind the first pins (the black spot: 검수 R1 lower bound)
    const tb = axis([-8, 126], -26), TM = (a) => a.map(([t, s]) => tb(t, s));
    const mo = tb(38, 0);
    fg += P(splashD(mo[0] + 8, mo[1] - 5, 19, 7, 97, 0.48, -0.5), col);
    fg += S(ptsD(TM([[0, -13], [38, -13], [38, 13], [0, 13]]), true), col, 2, 1.6) + L(ptsD(TM([[3, -8.4], [34, -8.4]])), K.ink5, 3.2);
    fg += `<ellipse cx="${f(mo[0])}" cy="${f(mo[1])}" rx="5" ry="13.4" transform="rotate(-26 ${f(mo[0])} ${f(mo[1])})" fill="${K.ink5}" stroke="${K.p50}" stroke-width="2.4"/>`;
    // [deg, distance, length]: dagger pins in a wide cone (−42° … +14°, 56°), nearer ones bigger, spaced apart;
    // [deg, distance, size]: paper hail grains
    const pins = [[-30, 37, 38], [-6, 30, 25], [12, 38, 23], [-24, 64, 24], [0, 64, 22], [-42, 76, 20], [-14, 88, 21], [8, 92, 19], [-30, 100, 18]];
    if (A) pins.push([-46, 46, 19], [22, 62, 18], [-4, 112, 16], [-20, 112, 15]);
    const grains = [[-18, 44, 4.6], [-38, 54, 3.8], [-6, 78, 4], [14, 70, 3.6], [-26, 82, 3.4]].concat(A ? [[22, 46, 3.4], [-44, 88, 3.2]] : []);
    grains.forEach(([a, d, r], i) => { const p = polar(O, a, d); fg += `<path d="${splashD(p[0], p[1], r * 1.5, 4, 90 + i, 0.75, i)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.8" stroke-linejoin="round"/>`; });
    pins.forEach(([a, d, len], i) => { const B = polar(O, a, d - len * 0.5); fg += daggerPin(B, a + (i % 2 ? 6 : -5), len, i === 0); });
    return { bg, fg };
  } };

  // ---- rear (§3.1): the 結 knot at the right middle (where the hero is), the cyan scarf tail waving off to the upper left
  // (the cyan element of all three), the motif flying behind (left / lower left) in a fan, its points to the LEFT ----
  const KN = [97, 60];
  /** The scarf knot (結, §3.3): paper, two loops and two ends, ink rim 2.4 — unlike the card's ink knots — and the long
   *  cyan scarf tail waving to the upper left (ink ≥ 2 under the cyan, a glow line on it). */
  function knotScarf(A) {
    const [x, y] = KN;
    const tail = smooth([[x - 4, y - 3], [x - 16, y - 11], [x - 30, y - 13], [x - 43, y - 22], [x - 59, y - 27]], 7);
    const wf = (t) => 9 * (1 - t) + 3.2;
    let s = taperFn(tail, (t) => wf(t) + 4.8, K.ink) + taperFn(tail, wf, K.ally) + taperPoly(tail.slice(4, 26), 1.2, 0.3, K.allyG, 'opacity="0.9"');
    const loop = (a, len, w) => { const at = axis([x, y], a), M = (q2) => q2.map(([t, sd]) => at(t * len, sd * w)); return ptsD(smooth(M([[0, -0.5], [0.5, -1], [1, -0.4], [1.05, 0.4], [0.5, 0.9], [0, 0.5]]), 5), true); };
    const end = (a, len) => { const at = axis([x, y], a); return ptsD([at(1, -2.2), at(len, -1.4), at(len + 1.5, 1.4), at(1, 2.2)], true); };
    // one fold line inside the left loop, following its outline (검수 4차 R8: two ink.300 strokes on the loops slanting
    // in toward the knot read as frowning brows — a small angry face — at 2x and up)
    const fold = (() => { const at = axis([x, y], -150); return ptsD(smooth([[0.3, 0.1], [0.55, -0.42], [0.86, -0.05]].map(([t, sd]) => at(t * 9, sd * 4.4)), 4)); })();
    s += S(end(70, 9) + ' ' + end(112, 7), K.p50, 2.4, 1) + S(loop(-150, 9, 4.4) + ' ' + loop(-38, 8, 4.2), K.p50, 2.4, 1.1) +
      `<path d="M${x - 3.2},${y - 2.8} L${x + 3.2},${y - 3.2} L${x + 3.4},${y + 2.8} L${x - 3},${y + 3.2} Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
      L(fold, K.ink3, 1.1);
    return s;
  }

  /** 꼬리 방패 dagger, grip end B → point along deg (len): a paper blade, a round paper guard seen a little edge-on (no
   *  centre dot), an ink grip. */
  function guardDagger(B, deg, len) {
    const at = axis(B, deg), g = len * 0.3, M = (a) => a.map(([t, s]) => at(t, s));
    const blade = ptsD(M([[g + 2, -3.8], [len * 0.72, -3.5], [len, 0], [len * 0.72, 3.5], [g + 2, 3.8]]), true);
    const gc = at(g, 0);
    const pm = at(-1.6, 0);
    return `<circle cx="${f(pm[0])}" cy="${f(pm[1])}" r="3.6" fill="${K.ink}"/>` +
      `<path d="${ptsD(M([[0, -3.1], [g, -3.4], [g, 3.4], [0, 3.1]]), true)}" fill="${K.ink}" stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"/>` +
      S(blade, K.p50, 2.3, 1.2) + P(ptsD(M([[g + 2, 0.8], [len * 0.72, 0.8], [len, 0], [len * 0.72, 3.5], [g + 2, 3.8]]), true), K.p300) +
      `<g transform="rotate(${f(deg)} ${f(gc[0])} ${f(gc[1])})"><ellipse cx="${f(gc[0])}" cy="${f(gc[1])}" rx="2.9" ry="6.6" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.4"/>` +
      `<path d="M${f(gc[0] - 1.2)},${f(gc[1] - 4)} A2,4.8 0 0 0 ${f(gc[0] - 1.2)},${f(gc[1] + 3)}" fill="none" stroke="${K.ink3}" stroke-width="1"/></g>`;
  }
  DRAW.tailGuard = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // [grip end, deg, length]: three daggers under the knot, grips stacked, fanned ±18° so the points spread to the LEFT
    // into a shield shape (one pivot bunched them into a shuttlecock); the lowest, the one that struck, flew farthest
    const dg = A ? [[[90, 70], 200, 48], [[92, 79], 188, 51], [[92, 88], 176, 53], [[90, 98], 163, 64]] : [[[90, 72], 198, 50], [[92, 84], 180, 54], [[90, 97], 163, 64]];
    let bg = '', fg = knotScarf(A);
    // speed strokes behind the grips, starting 3 past the round grip end (−5.2): 검수 4차 R5 — drawn from the grip end
    // itself, each stroke and its dagger read as one long pen or syringe
    dg.forEach(([B, deg]) => { bg += speed(polar(B, deg + 180, 8.2), polar(B, deg + 180, 21), 3.4, A ? K.p300 : K.ink); });
    // the ghoul they meet at the lower left: blocked and knocked back (leaning away, drag strokes behind its feet, its
    // shadow, ink flung on), the lowest dagger through its body and out (관통)
    const low = dg[dg.length - 1], lu = axis(low[0], low[1]), gr = 13, G = lu(low[2] - gr - 5, -1.5), ft = [G[0], G[1] + gr * 0.9];
    const tx = low[2] - 5 - gr + Math.sqrt(gr * gr - 2.25), ex = lu(tx, 0);
    dg.slice(0, -1).forEach(([B, deg, len]) => { fg += guardDagger(B, deg, len); });
    fg += `<ellipse cx="${f(G[0] + 4)}" cy="${f(ft[1] + 1.2)}" rx="21" ry="4.6" fill="${col}"/>` +
      speed([G[0] + 6, ft[1] - 0.4], [G[0] + 30, ft[1] - 0.6], 4.4, col) + speed([G[0] + 8, ft[1] + 2.8], [G[0] + 21, ft[1] + 3], 3, col) +
      P(blob(G[0] - gr - 4, G[1] - 3, 4.2, 6, 0.5, 161) + blob(G[0] - gr - 10, G[1] + 2.5, 3, 6, 0.5, 162) + blob(G[0] - gr - 2, G[1] - 11.5, 2.4, 6, 0.5, 163), col) +
      guardDagger(low[0], low[1], low[2]) + `<g transform="rotate(-12 ${f(ft[0])} ${f(ft[1])})">${ghoul(c, G[0], G[1], gr, 5)}</g>` +
      `<path d="${splashD(ex[0] + 0.6, ex[1] - 0.6, gr * 0.42, 5, 35, 0.5)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.5" stroke-linejoin="round"/>` +
      P(ptsD([lu(tx - 1, -2.6), lu(low[2], 0), lu(tx - 1, 2.6)], true), K.p50, `stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"`);
    return { bg, fg };
  } };

  /** One smoke silhouette over overlapping lumps [cx, cy, r] (검수 4차 M2): the lumps' upper envelope (the wavy top) and
   *  their lower envelope filled down to floor(x) and never below the ground line gy (a flat bottom along the ground,
   *  a smooth underside where the smoke comes down from the knot). Sampled every unit. */
  function smokeD(lumps, gy, floor) {
    const x0 = Math.min(...lumps.map(([x, , r]) => x - r)), x1 = Math.max(...lumps.map(([x, , r]) => x + r)), n = Math.ceil(x1 - x0), top = [], bot = [];
    for (let i = 0; i <= n; i++) {
      const x = lerp(x0, x1, i / n);
      let t = Infinity, b = -Infinity;
      lumps.forEach(([cx, cy, r]) => { const dx = x - cx; if (Math.abs(dx) <= r) { const h = Math.sqrt(r * r - dx * dx); t = Math.min(t, cy - h); b = Math.max(b, cy + h); } });
      if (t < Infinity) { top.push([x, t]); bot.push([x, Math.min(gy, Math.max(b, Math.min(floor(x), gy)))]); }
    }
    return ptsD(top.concat(bot.reverse()), true);
  }
  /** An open smoke curl: an arc of radius r from a0 to a1 (deg) about (x, y) that tightens at its end (never a closed
   *  '@'), thin → thick → thin. */
  function smokeCurl(x, y, r, a0, a1, col, w = 2.2) {
    const p = []; for (let i = 0; i <= 12; i++) { const t = i / 12; p.push(polar([x, y], lerp(a0, a1, t), r * (1 - 0.35 * t * t))); }
    return taperFn(p, (t) => 0.5 + w * Math.sin(Math.PI * Math.min(1, t * 1.15)), col);
  }
  DRAW.smokeTail = { draw(c, A) {
    const k = A ? 1.2 : 1, gy = 104;
    let bg = '', fg = '';
    // [start, deg, length]: paper smoke needles that leave the smoke bank's top to the LEFT, over the ghoul (three when
    // awakened); drawn first, so the smoke covers their backs
    const nd = A ? [[[66, 90], 204, 62], [[74, 92], 214, 50], [[80, 90], 224, 40]] : [[[66, 90], 204, 62], [[74, 92], 214, 50]];
    nd.forEach(([B, deg, len]) => { fg += KI.slimNeedle(B, polar(B, deg, len), 6.4, 2.3); });
    // the black spot: the smoke off the knot, ONE silhouette (검수 4차 M2: lumps with their own shadows in alternating
    // tones, growing evenly, read as a caterpillar / a row of pebbles). 검수 6차 R1: a wedge rising from the lower left
    // to the knot under the diagonal scarf read at 20 px as 혼령's black fan with the arrows over it, so the smoke now lies
    // low — a thin wisp drops from under the knot into a bank along the ground, its top billowing over lumps of uneven
    // sizes (6·8·9·10·8·6, each overlapping the next by about half), its bottom flat on the ground — with paper (≥ 10)
    // between its top and the scarf. ink.500 in one tone, ink.700 billows on the shadow sides, open ink.300 curls, one
    // ink.300 copy of the silhouette showing only along its lower edge (the shot's one-puff grammar).
    const lumps = [[9, 96, 6], [22, 92, 8], [36, 89, 9], [51, 88, 10], [65, 90, 8], [77, 94, 6], [84, 86, 4.4], [89, 78, 3.6], [93, 71, 3]].map(([x, y, r]) => [x, y, r * k]);
    const back = smokeD(lumps, gy, (x) => (x <= 70 ? gy : gy - 40 * Math.pow(Math.min(1, (x - 70) / 16), 0.8)));
    let sm = `<path d="${back}" fill="${K.ink3}" transform="translate(0.8,2.2)"/>` + P(back, K.ink5);
    const bc = c.clip('smk', back);
    sm += `<g clip-path="${bc}">${P(blob(60, 99, 8 * k, 9, 0.3, 111, 0.7) + blob(42, 98, 7 * k, 9, 0.3, 112, 0.7) + blob(80, 99, 4.6 * k, 8, 0.3, 113, 0.7), K.ink7)}</g>`;
    [[30, 92, 5, 200, 296], [53, 93, 6, 204, 300], [71, 95, 4, 200, 296]].forEach(([x, y, r, a0, a1]) => { sm += smokeCurl(x, y - (k - 1) * 8, r * k, a0, a1, K.ink3); });
    fg += sm;
    // 먹 감속 (검수 4차 M2: the ghoul was drawn under the smoke and lost its eyes): the ghoul stands at the bank's foot in
    // front of it — a paper rim parts it from the smoke behind — with only its feet in a front skirt of the same smoke,
    // its slit eyes and upper body clear, two ink drops dragging behind it (to the left)
    const G = [22, 88], gr = 11;
    fg += `<path d="${blob(G[0], G[1], gr, 9, 0.22, 7)}" fill="none" stroke="${K.p50}" stroke-width="5.6" stroke-linejoin="round"/>` + ghoul(c, G[0], G[1], gr, 7);
    const skirt = smokeD([[6, 100, 6], [19, 100, 8], [34, 100.5, 7], [44, 101, 5]].map(([x, y, r]) => [x, y, r * Math.min(k, 1.1)]), gy, () => gy);
    fg += `<path d="${skirt}" fill="${K.ink3}" transform="translate(0.8,2.2)"/>` + P(skirt, K.ink5) + smokeCurl(18, 97, 4.4, 205, 300, K.ink3, 1.6);
    fg += P(dropD(7.5, 86, 5, 1.7) + dropD(3.8, 80, 3.8, 1.3), A ? K.ink7 : K.ink);
    fg += knotScarf(A);
    return { bg, fg };
  } };

  /** 묘침 pin: point P (stuck in the ground) back along deg to a small headstone (round-topped paper plate with an ink
   *  rim and a base step; no glyph). */
  function gravePin(P0, deg, len) {
    const at = axis(P0, deg), M = (a) => a.map(([t, s]) => at(t, s)), h = len - 12;
    const shaft = ptsD(M([[0, -0.6], [h, -2], [h, 2], [0, 0.6]]), true);
    // headstone: a plate 13 long (along the pin) × 9.4, the far end a full half circle — taller than wide, so it reads as a
    // grave marker, not a block
    const arc = []; for (let i = 0; i <= 10; i++) { const a = -90 + 180 * i / 10; arc.push([h + 8.3 + Math.cos(rad(a)) * 4.7, Math.sin(rad(a)) * 4.7]); }
    const plate = ptsD(M([[h + 1.4, -4.7]].concat(arc, [[h + 1.4, 4.7]])), true);
    return S(shaft, K.p50, 2, 1) + `<path d="${ptsD(M([[h - 1, -6], [h + 1.4, -6], [h + 1.4, 6], [h - 1, 6]]), true)}" fill="${K.ink}"/>` +
      S(plate, K.p50, 2.4, 1.2) + P(ptsD(M([[h + 1.4, 1.2], [h + 8.3, 1.2], [h + 12.6, 2.2], [h + 8.3, 4.7], [h + 1.4, 4.7]]), true), K.p300);
  }
  DRAW.gravePins = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // the black spot: the ground band behind (lower left) the pins are thrown into, its top edge ragged
    let bg = `<path d="M-4,100 C12,96 26,101 40,97 C54,93 66,99 80,98 C86,98 92,104 96,112 L100,132 L-4,132 Z" fill="${col}"/>`, fg = knotScarf(A);
    // [point in the ground, deg back to the head, length]: five pins flung behind in a fan, stuck at different depths and
    // tilts (never a row); the head of each is a small headstone
    const pins = [[[14, 106], -52, 42], [[34, 112], -38, 46], [[54, 104], -64, 38], [[72, 110], -30, 40]];
    if (A) pins.push([[90, 116], -48, 34]);
    pins.forEach(([p, deg, len]) => { fg += P(splashD(p[0], p[1] - 1, 7, 6, 120 + p[0], 0.45), A ? K.p300 : K.p50) + gravePin(p, deg, len); });
    // one still flying (down to the left), its point through a ghoul at the far left (관통)
    const G = [18, 76], gr = 10, fd = 160, Tp = polar(G, fd, gr + 7), B0 = polar(Tp, fd - 180, 40);
    fg += speed(polar(B0, fd - 180, 2), polar(B0, fd - 180, 14), 2.4, A ? K.p300 : K.ink) + gravePin(Tp, fd - 180, 40) + ghoul(c, G[0], G[1], gr, 9) +
      `<path d="${splashD(G[0] - gr * 0.6, G[1] + 2, gr * 0.42, 5, 39, 0.5)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.5" stroke-linejoin="round"/>` +
      P(ptsD([polar(Tp, fd + 90, 1.2), Tp, polar(Tp, fd - 90, 1.2), polar(Tp, fd - 180, 5)], true), K.p50, `stroke="${K.ink}" stroke-width="1.6"`);
    return { bg, fg };
  } };

  // ---- seeker (§3.1): from the left middle (8–20, 60–76), `count` paths bending at least 15° part to different targets
  // (x 60–118, y 24–112, r 7–12, sizes different, never touching: 검수 2차 §10-2); the motif at each path's end ----
  const SO = [14, 68];
  /** A seeker path from a to b bulging sideways by bow (±), as points (quadratic bezier). */
  function seekPath(a, b, bow, n = 16) {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / d, ny = (b[0] - a[0]) / d;
    const cpt = [m[0] + nx * bow, m[1] + ny * bow], o = [];
    for (let i = 0; i <= n; i++) { const t = i / n, v = 1 - t; o.push([v * v * a[0] + 2 * v * t * cpt[0] + t * t * b[0], v * v * a[1] + 2 * v * t * cpt[1] + t * t * b[1]]); }
    return o;
  }
  const endDeg = (p) => Math.atan2(p[p.length - 1][1] - p[p.length - 3][1], p[p.length - 1][0] - p[p.length - 3][0]) * 180 / Math.PI;

  /** 추적 인장 seal, flying along deg with its face at F: a small cylinder seen from the side (paper body, an ink face band
   *  pressed on the target, a p300 underside) and a round ink knob behind. */
  function trackSeal(F, deg, s = 1) {
    const at = axis(F, deg), M = (a) => a.map(([t, sd]) => at(t * s, sd * s));
    return `<circle cx="${f(at(-17 * s)[0])}" cy="${f(at(-17 * s)[1])}" r="${f(3.6 * s)}" fill="${K.ink}"/>` + P(ptsD(M([[-17, -1.8], [-12, -2.2], [-12, 2.2], [-17, 1.8]]), true), K.ink) +
      S(ptsD(M([[-12.6, -5.4], [-2.6, -5.4], [-2.6, 5.4], [-12.6, 5.4]]), true), K.p50, 2.2, 1) + P(ptsD(M([[-12.6, 1.8], [-2.6, 1.8], [-2.6, 5.4], [-12.6, 5.4]]), true), K.p300) +
      `<path d="${ptsD(M([[-2.6, -5.4], [-0.6, -5], [0, -4], [0, 4], [-0.6, 5], [-2.6, 5.4]]), true)}" fill="${K.ink}" stroke="${K.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
  }
  DRAW.trackingSeals = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // [ghoul centre, r, seed, path bow]: three targets of different sizes (four awakened), a seal pressed on each
    const tg = [[[90, 47], 10.5, 3, -16], [[109, 80], 11.5, 5, 12], [[76, 106], 10, 7, 20]];
    if (A) tg.push([[52, 30], 8.5, 9, -14]);
    // the black spot: the ink pad the seals leapt from (with a drip), at the left middle
    let bg = P(blob(SO[0] - 1, SO[1], 15.5, 10, 0.4, 131, 0.86), col) + P(dropD(SO[0] - 5, SO[1] + 16.5, 6.4, 2.4) + blob(SO[0] + 10, SO[1] + 13, 2.2, 6, 0.5, 132), col), fg = '';
    tg.forEach(([G, r, seed, bow]) => {
      const a = Math.atan2(G[1] - SO[1], G[0] - SO[0]), E = [G[0] - Math.cos(a) * (r + 1), G[1] - Math.sin(a) * (r + 1)];
      const p = seekPath(polar(SO, a * 180 / Math.PI, 7), E, bow), d = endDeg(p);
      // the dotted cyan tracking thread (ink under the cyan, dashed) up to the seal's knob
      const th = ptsD(p.slice(0, p.length - 4));
      fg += L(th, K.ink, 4.8, 'stroke-dasharray="5.5 3.4"') + L(th, K.ally, 2.4, 'stroke-dasharray="5.5 3.4"');
      // the stamped ghoul: a hollow paper square on the lower back of its body, the side the seal came from (검수 4차 R6:
      // beside and under the slit eyes it read as an open mouth at 120 px)
      const sq = [G[0] - r * 0.5, G[1] + r * 0.5], sqs = r * 0.24;
      fg += ghoul(c, G[0], G[1], r, seed) + `<g transform="rotate(${f(d + 30)} ${f(sq[0])} ${f(sq[1])})"><rect x="${f(sq[0] - sqs)}" y="${f(sq[1] - sqs)}" width="${f(sqs * 2)}" height="${f(sqs * 2)}" fill="none" stroke="${K.p50}" stroke-width="1.3"/></g>` +
        trackSeal(polar(E, d + 180, 0.4), d, 0.92);
    });
    return { bg, fg };
  } };

  /** 사냥꾼 표식 dart stuck at T (its point) along deg, with a paper tag (8 × 6, one hole) on a cyan string from its tail:
   *  the string swings out to side sd (±1) and sags tagDrop to the tag, or blows UP when tagDrop < 0 (the tag above the
   *  string, its hole near its lower edge). */
  function markDart(T, deg, len, tagDrop, sd) {
    const at = axis(T, deg + 180), M = (a) => a.map(([t, s]) => at(t, s));
    const body = ptsD(M([[0, 0], [5, -2.4], [len - 3, -2.1], [len, -1.4], [len, 1.4], [len - 3, 2.1], [5, 2.4]]), true);
    const vane = (sg) => ptsD(M([[len - 9, sg * 2], [len - 3, sg * 6.4], [len + 1.5, sg * 6], [len - 1, sg * 2]]), true);
    // the string swings out behind the dart and to the tag in one curve, about 20–28 long (32 px reading); 검수 4차 R1:
    // the side alternates and the sag differs per dart (four equal J hooks repeated one sign at 32 px), one blown up
    const up = tagDrop < 0, S0 = at(len - 2, 0), H = [S0[0] + sd * 8, S0[1] + tagDrop], hole = [H[0], H[1] + (up ? -1.8 : 1.8)];
    const tag = `<g transform="rotate(${f(sd * (up ? 14 : -10))} ${f(H[0])} ${f(H[1])})"><rect x="${f(H[0] - 4)}" y="${f(up ? H[1] - 6.2 : H[1])}" width="8" height="6.2" rx="0.8" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.8"/>` +
      `<circle cx="${f(hole[0])}" cy="${f(hole[1])}" r="0.9" fill="${K.ink}"/></g>`;
    return S(vane(1) + ' ' + vane(-1), K.p50, 1.8, 0.8) + S(body, K.p50, 2.2, 1.1) + P(ptsD(M([[0, 0], [5, -2.4], [5, 2.4]]), true), K.ink) +
      cyanLine(`M${q(S0)} Q${f(S0[0] + sd * 15)},${f(S0[1] + tagDrop * 0.3)} ${q(hole)}`, 2.4, false) + tag;
  }
  DRAW.huntersMarks = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, ln = A ? K.p300 : K.ink;
    // [ghoul, r, seed, bow, dart length, tag drop (< 0: blown up), string side]: four targets of different sizes and
    // heights (five awakened); the nearest takes the critical flash. The strings swing to alternating sides and sag
    // 9–20, one tag blown up (검수 4차 R1)
    const tg = [[[50, 90], 12, 3, 10, 26, 12, 1], [[70, 34], 8, 5, -12, 22, 20, -1], [[104, 60], 11, 7, -14, 25, -12, 1], [[104, 100], 9, 9, 16, 23, 9, -1]];
    if (A) tg.push([[84, 80], 7, 11, 8, 20, -10, -1]);
    let bg = P(blob(SO[0], SO[1], 7, 9, 0.5, 141), col), fg = '';
    tg.forEach(([G, r, seed, bow, len, drop, side], i) => {
      const a = Math.atan2(G[1] - SO[1], G[0] - SO[0]), E = [G[0] - Math.cos(a) * r * 0.2, G[1] - Math.sin(a) * r * 0.2];
      const p = seekPath(polar(SO, a * 180 / Math.PI, 8), E, bow), d = endDeg(p);
      bg += taperPoly(p.slice(1, p.length - 6), 0.4, 2.4, ln);
      fg += ghoul(c, G[0], G[1], r, seed);
      // 치명 (§3.2): an irregular paper flash of 6–7 rays where the dart went in, over the ghoul's dark body, and ink
      // flung off behind
      if (i === 0) {
        const H = polar(G, d + 180, r * 0.55);
        fg += P(blob(G[0] + r * 1.05, G[1] + r * 0.6, 3, 6, 0.5, 148) + blob(G[0] + r * 1.3, G[1] - r * 0.5, 2.2, 6, 0.5, 149) + blob(G[0] + r * 0.3, G[1] + r * 1.35, 1.8, 6, 0.5, 150), col) +
          `<path d="${splashD(H[0], H[1], r * 1.5, 7, 147, 0.56)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
      }
      fg += markDart(polar(G, d + 180, r * 0.2), d, len, drop, side);
    });
    return { bg, fg };
  } };

  /** 까마귀 깃 feather dagger from its quill end B along deg (len): a long ink vane on a paper shaft (rachis) running its
   *  whole length, the point sharp as a blade, the edge split in two or three places (paper notches) and a p300 light edge
   *  on the upper side; cyan = the shaft core (one feather). */
  function crowFeather(B, deg, len, cyan, col) {
    const at = axis(B, deg), M = (a) => a.map(([t, s]) => at(t * len, s));
    // lopsided like a real flight feather: the vane wide on one side of the shaft, narrow on the other; a bare paper quill
    // sticks out behind it (a symmetric vane read as a leaf)
    const vane = ptsD(smooth(M([[0.2, -0.6], [0.3, -4.4], [0.56, -5.4], [0.82, -3.4], [1, 0], [0.84, 1.8], [0.56, 2.4], [0.3, 1.8], [0.2, 0.6]]), 5), true);
    const splits = [[0.5, -5.4, -2.8], [0.7, -4.4, -2.4], [0.46, 2.4, 2.2]].map(([t, s, dd]) => ptsD(M([[t, s * 0.6], [t - 0.06, s + dd], [t - 0.015, s * 1.08]]), true)).join(' ');
    return `<path d="${ptsD(M([[0, -1.1], [0.22, -1.4], [0.22, 1.4], [0, 1.1]]), true)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.6" stroke-linejoin="round"/>` +
      S(vane, col, 1.8, 1.1) + P(splits, K.p50) + L(ptsD(M([[0.34, -3.8], [0.74, -3.1]])), K.p300, 1.1) +
      (cyan ? cyanLine(ptsD(M([[0.2, -0.3], [0.9, -0.3]])), 2.4, false) : L(ptsD(M([[0.2, -0.3], [0.88, -0.3]])), K.p50, 1.8));
  }
  DRAW.crowFeathers = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, O = [36, 70];
    // [deg from the origin, ghoul distance, r, seed, feather length]: five near ghouls in a right half circle (six
    // awakened); each feather is caught mid-flight a little short of its ghoul, so black feather and black ghoul never merge
    const tg = [[-68, 50, 8, 3, 30], [-30, 56, 9, 5, 33], [5, 60, 10, 7, 33], [40, 52, 9, 9, 30], [74, 44, 8, 11, 28]];
    if (A) tg.push([-48, 32, 6, 13, 20]);
    let bg = P(blob(O[0], O[1], 6, 8, 0.5, 151), col), fg = '';
    tg.forEach(([a, dist, r, seed]) => { const G = polar(O, a, dist); fg += ghoul(c, G[0], G[1], r, seed); });
    tg.forEach(([a, dist, r, , len], i) => {
      const G = polar(O, a, dist), tip = polar(G, a + 180, r + 3.4), B = polar(tip, a + 180 + (i % 2 ? 5 : -5), len), d = Math.atan2(tip[1] - B[1], tip[0] - B[0]) * 180 / Math.PI;
      fg += speed(polar(B, d + 180, 1), polar(B, d + 180, 9), 2, A ? K.p300 : K.ink) + crowFeather(B, d, len, i === 1, col);
    });
    return { bg, fg };
  } };

  /** 보스 사냥침 harpoon from its tail B along deg (len): paper shaft, ink leaf head, one hooked barb swept back. */
  function harpoon(B, deg, len) {
    const at = axis(B, deg), M = (a) => a.map(([t, s]) => at(t, s)), h = len - 13;
    return S(ptsD(M([[0, -1.8], [h, -2.2], [h, 2.2], [0, 1.8]]), true), K.p50, 2.2, 1.1) +
      `<path d="${ptsD(M([[h - 1, -4.2], [h + 6, -4], [len, 0], [h + 6, 4], [h - 1, 4.2]]), true)}" fill="${K.ink}" stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="${ptsD(M([[h + 1, -3.6], [h - 7, -9.4], [h - 4.6, -4.2]]), true)}" fill="${K.ink}" stroke="${K.ink}" stroke-width="1.6" stroke-linejoin="round"/>` +
      L(ptsD(M([[h + 1, -1.6], [len - 3, -0.6]])), K.ink5, 1.4);
  }
  DRAW.bossbane = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // the black spot: the boss — a big ink mass filling the right 40%, the paper mask (§3.3: one three-quarter view
    // turned to the left, toward the harpoon — the far eye on the left 0.6 as wide as the near one, the mask's left side
    // narrower; a thick ink rim, a white glint in each eye, no nose or mouth; about 4.5% of the icon); everything stays
    // below the seal corner. 검수 4차 R3 (a hooded ghost, the No-Face silhouette): a plated pauldron bulges off the left
    // shoulder, the one great horn is its own piece — parted from the head by a paper groove, ringed in three segments,
    // curving back — and the mask has a cut, straight brow and an angular jaw in place of the egg outline. (Two upright
    // points read as cat ears.)
    const boss = 'M76,128 C74,118 74,110 77,104 C71,101 70,91 76,87 C79,84 84,83 87,84 C85,74 86,62 92,54 ' +
      'C97,48 104,45 111,45 C116,45 120,48 123,52 C127,57 130,62 132,68 L132,128 Z';
    let bg = '', fg = S(boss, col, 2.4, 2) + L('M76.6,100.8 C73.6,97.2 73.8,91.4 78.2,88.8 M77.4,104 C80.4,103 83,100.4 84.4,97', K.p300, 1.3);
    // the horn: a centre line from the head's upper right, curving up and back (tip 126.5, 37.6), width 10.6 → 0.6
    const hp = smooth([[112, 51], [115.4, 43.6], [120.4, 39.2], [126.5, 37.6]], 6), hw = (t) => 10 * Math.pow(1 - t, 0.9) + 0.6;
    fg += taperFn(hp, (t) => hw(t) + 3.2, K.p50) + taperFn(hp, hw, col);
    [0.24, 0.45, 0.64].forEach((t) => {
      const i = Math.round(t * (hp.length - 1)), a = hp[i - 1], b = hp[i + 1], dir = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, w = hw(t) / 2 - 0.5;
      fg += L(`M${q(polar(hp[i], dir + 90, w))} Q${q(polar(hp[i], dir, -1.4))} ${q(polar(hp[i], dir - 90, w))}`, K.p300, 1.2);
    });
    const mask = 'M91.6,55.8 L117.4,53.6 C118.4,57.6 119.2,61.6 119.2,66 L115.4,79 L101,86.5 L93.5,79 L90.8,66 C90.8,62.4 91,59 91.6,55.8 Z';
    fg += `<path d="${mask}" fill="${K.p50}" stroke="${K.ink}" stroke-width="3.4" stroke-linejoin="round"/>` +
      `<path d="M117.3,66.6 L113.9,77.9 L102,84 C105.2,82.2 109.8,79.6 112.4,76.8 C114.4,74 115.6,70.6 117.3,66.6 Z" fill="${K.p300}"/>` +
      `<path d="M95.2,62.8 C96.6,60.8 99.4,60.4 100.8,61.8 C99.6,64 97,64.8 95.2,62.8 Z" fill="${K.ink}"/>` +
      `<path d="M104.6,62.4 C106.6,59.4 111.2,58.8 113.8,61 C112,64.4 107.6,65.2 104.6,62.4 Z" fill="${K.ink}"/>` +
      `<circle cx="98.8" cy="62" r="0.7" fill="${K.p50}"/><circle cx="110.8" cy="61.4" r="1.05" fill="${K.p50}"/>`;
    // two small ghouls the harpoon passes between
    fg += ghoul(c, 40, 50, 8, 3) + ghoul(c, 54, 94, 9, 5);
    // [tail, bow, length]: the harpoon flies from the left middle on a bent path and sticks in the boss beside the mask;
    // its cyan line bends once behind it (two harpoons awakened)
    const hs = A ? [[[14, 64], -10, 74], [[12, 86], 12, 70]] : [[[14, 70], -10, 78]];
    hs.forEach(([B0, bow, len], i) => {
      const T = i ? [86, 96] : [90, 76], p = seekPath(B0, T, bow, 20), d = endDeg(p), tail = polar(T, d + 180, len);
      fg += cyanLine(ptsD(seekPath([2, B0[1] + 8], tail, 7, 12)), 2.4, false) + harpoon(tail, d, len + 3);
    });
    return { bg, fg };
  } };

  // ==== delivery 3: strike · nova · lob · chain · beam · halo — icons only (no projectiles; field effects are K10) ====

  /** The 結 knot alone (the rear knot's paper loops, ends, centre block and fold line; no scarf) at (x, y), scale k. */
  function knotAt(x, y, k = 1) {
    const at0 = (a) => axis([x, y], a);
    const loop = (a, len, w) => { const at = at0(a), M = (p) => p.map(([t, sd]) => at(t * len * k, sd * w * k)); return ptsD(smooth(M([[0, -0.5], [0.5, -1], [1, -0.4], [1.05, 0.4], [0.5, 0.9], [0, 0.5]]), 5), true); };
    const end = (a, len) => { const at = at0(a); return ptsD([at(k, -2.2 * k), at(len * k, -1.4 * k), at((len + 1.5) * k, 1.4 * k), at(k, 2.2 * k)], true); };
    const sq = [[-3.2, -2.8], [3.2, -3.2], [3.4, 2.8], [-3, 3.2]].map(([a, b]) => [x + a * k, y + b * k]);
    const fold = (() => { const at = at0(-150); return ptsD(smooth([[0.3, 0.1], [0.55, -0.42], [0.86, -0.05]].map(([t, sd]) => at(t * 9 * k, sd * 4.4 * k)), 4)); })();
    return S(end(70, 9) + ' ' + end(112, 7), K.p50, 2.4, 1) + S(loop(-150, 9, 4.4) + ' ' + loop(-38, 8, 4.2), K.p50, 2.4, 1.1) +
      `<path d="${polyD(sq)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.4" stroke-linejoin="round"/>` + L(fold, K.ink3, 1.1);
  }
  /** A jagged bolt through pts (sharp corners, never an even Z / N / W): ink w, the cyan w / 2 when cy, a paper core. */
  function zig(pts, w, cy) {
    const d = ptsD(pts), lay = cy ? [[K.ink, 1], [K.ally, 0.5], [K.p50, 0.17]] : [[K.ink, 1], [K.p50, 0.3]];
    return lay.map(([col, k]) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w * k)}" stroke-linejoin="miter" stroke-miterlimit="8" stroke-linecap="round"/>`).join('');
  }
  /** Ground band (bg): the top edge from y0 (left) to y1 (right), wobbling by amp (phase ph), filled to below the window. */
  function groundBand(y0, y1, amp, ph, col) {
    const p = []; for (let i = 0; i <= 16; i++) { const t = i / 16; p.push([lerp(-4, 132, t), lerp(y0, y1, t) + amp * Math.sin(t * 7.1 + ph) + amp * 0.5 * Math.sin(t * 15.3 + ph * 2)]); }
    return `<path d="${ptsD(smooth(p, 4).concat([[132, 134], [-4, 134]]), true)}" fill="${col}"/>`;
  }
  /** Knockback either way (§3.2): the ghoul thrown toward dir (±1) leans away about its feet, two drag strokes of
   *  different lengths behind its feet and a paper splash on the side the blow came from. */
  function pushed(c, x, y, r, seed, dir, o = {}) {
    const ln = o.ln || K.ink, b = -dir;
    let s = [[1, 0], [0.45, 3]].map(([k, dy], i) => speed([x + b * r * 0.3, y + r * 0.95 + dy], [x + b * r * (1.4 + 1.2 * k), y + r * 0.95 + dy + 1.5 * i], 3.4 - i * 0.8, ln)).join('');
    s += `<g transform="rotate(${f(dir * (o.lean || 15))} ${f(x)} ${f(y + r * 0.9)})">${ghoul(c, x, y, r, seed)}</g>`;
    if (o.splash !== false) s += paperSplash(x + b * r * 0.95, y - r * 0.15, r * 0.62, 6, seed + 40, 1.8);
    return s;
  }

  // ---- strike (§3.1): from above (a source band at y 0–24 may cross the seal corner: it is background), the motifs come
  // down nearly upright onto a ground band (bg, y 96–128) at different x ----

  DRAW.inkLightning = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // the main mass: an ink cloud bank along the top edge, its underside bulging in uneven billows (bg). Awakened (§12-1):
    // the same bank turned pale — p300 with an ink rim — since ink7 sinks into the awakened ink ground
    // (awakened, 검수 6차 R2: a tongue of cloud hangs lower in the middle, where the third, shorter bolt starts)
    const bot = [[132, 20], [121, 27], [109, 22], [91, 30], [79, 23], A ? [66, 40] : [64, 26], [49, 21], [35, 29], [17, 22], [6, 25], [-4, 21]];
    let cd = 'M-4,-6 L132,-6 L132,20';
    for (let i = 1; i < bot.length; i++) { const [x0, y0] = bot[i - 1], [x1, y1] = bot[i]; cd += ` Q${f((x0 + x1) / 2)},${f(Math.max(y0, y1) + [9, 4, 7, 5][i % 4])} ${f(x1)},${f(y1)}`; }
    cd += ' Z';
    let bg = (A ? `<path d="${cd}" fill="${K.p300}" stroke="${K.ink}" stroke-width="2.4"/>` : `<path d="${cd}" fill="${col}"/>`) +
      [[24, 12, 7, 200, 320], [62, 14, 8, 210, 330], [104, 11, 6, 205, 325]].map(([x, y, r, a0, a1]) => { const p = []; for (let i = 0; i <= 10; i++) p.push(polar([x, y], lerp(a0, a1, i / 10), r)); return taperPoly(p, 0.6, 2.2, A ? K.ink3 : K.ink5); }).join('');
    // a thin ground band the ghouls stand on (top-heavy, unlike 붓 폭우)
    bg += groundBand(110, 106, 2, 1.3, col);
    let fg = ghoul(c, 36, 99, 12, 3) + ghoul(c, 95, 95, 11, 5);
    // [points, ink width, cyan]: two thick bolts of different lengths, 4 bends each, segments 8–24 (three awakened)
    const bolts = [[[[30, 20], [20, 33], [37, 46], [27, 68], [38, 77], [33, 87]], 10, true], [[[84, 26], [96, 44], [89, 52], [99, 70], [92, 77], [95, 84]], 9, false]];
    // awakened third: 검수 6차 R2 — three near-parallel bolts at even spacing read as one sign repeated in a row, so the
    // middle one starts lower (from the cloud's hanging tongue), leans the other way (down to the left), is thinner and
    // shorter — it forks once and both prongs die out in the air above the ground, between the two struck ghouls
    if (A) bolts.push([[[66, 36], [60, 47], [67, 55], [58, 72], [62, 79], [57, 90]], 6.5, false]);
    bolts.forEach(([p, w, cy]) => { fg += zig(p, w, cy); });
    if (A) { const F = [[58, 72], [66, 82], [70, 90]]; fg += taperPoly(F, 4.6, 0.6, K.ink) + taperPoly(F, 1.6, 0.2, K.p50); }
    // paper splashes where the two strike
    fg += paperSplash(33, 87, 7, 6, 211, 2) + paperSplash(95, 84, 6.4, 6, 212, 2);
    // 기절: the paper spiral over the right ghoul, beside the bolt
    fg += stunSpiral(108, 78, 7.5, 2.2);
    return { bg, fg };
  } };

  /** 붓 폭우: a falling brush stroke, its pressed round head H leading (the lower end), the body running back up along
   *  deg for len and drying out toward the top (paper streaks inside its upper half, 비백); wet = the cyan streak down its
   *  middle. (A round head at the top read as rising tadpoles, prongs at the dry end as a rake, heads standing on the
   *  ground as spikes: the heads stop above the ground.) */
  function rainStroke(H, deg, len, w, col, wet) {
    const at = axis(H, deg), body = smooth([at(0, 0), at(len * 0.32, w * 0.07), at(len * 0.7, -w * 0.05), at(len, w * 0.04)], 5);
    let s = `<circle cx="${f(at(w * 0.15, 0)[0])}" cy="${f(at(w * 0.15, 0)[1])}" r="${f(w * 0.55)}" fill="${col}"/>` +
      taperFn(body, (t) => w * Math.pow(1 - t, 0.8) + 0.5, col);
    [[0.42, 0.92, -0.18, 0.13], [0.55, 0.86, 0.14, 0.1], [0.66, 0.97, -0.02, 0.07]].forEach(([t0, t1, sd, k]) => { s += taperPoly([at(len * t0, sd * w), at(len * t1, sd * w * 0.3)], w * k, 0.2, K.p50, 'opacity="0.92"'); });
    if (wet) s += cyanLine(ptsD([at(len * 0.08, 0.3), at(len * 0.5, -0.3)]), 2.4, false);
    return s;
  }
  DRAW.brushDownpour = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // the black spot: the ground band (bottom-heavy) with the four marks the strokes left: ink splats thrown up off its
    // edge and dry paper streaks (비백) in it
    let bg = groundBand(104, 101, 1.6, 0.4, col), fg = '';
    // [head (leading, lower end), deg back up the stroke, length, width, wet]: heavy brush rain leaning 20–24° off
    // upright; heads, lengths, widths and gaps all different (never an even '////'); every head stops short of the
    // ground (its lowest point 4–9 above it), where its mark already lies
    const st = [[[30, 88], -112, 50, 14], [[60, 92], -110, 66, 11, true], [[86, 86], -114, 42, 16], [[108, 91], -111, 58, 10]];
    if (A) st.push([[46, 80], -113, 40, 8]);
    st.forEach(([H, deg, len, w], i) => {
      bg += P(splashD(H[0] + 4, 103, w * 0.9, 6, 221 + i, 0.5, -1.4), col) + taperPoly([[H[0] - w * 0.6, 110 + i % 2 * 4], [H[0] + w * 1.4, 111 + i % 2 * 4]], 1.6, 0.3, A ? K.p300 : K.paper, 'opacity="0.9"');
    });
    st.forEach(([H, deg, len, w, wet]) => { fg += rainStroke(H, deg, len, w, K.ink, wet); });
    return { bg, fg };
  } };

  /** 족자: a hanging scroll centred at (cx, cy), height 80 × k, tilted by deg: ink rods with end caps top and bottom, a
   *  blank paper panel (p300 shade on the right), the hanging cord in a loop above (cyan when cy). */
  function scrollAt(cx, cy, k, deg, cy2) {
    const T = (x, y) => { const a = rad(deg), cs = Math.cos(a), sn = Math.sin(a); return [cx + (x * cs - y * sn) * k, cy + (x * sn + y * cs) * k]; };
    const R = (x0, y0, x1, y1) => polyD([T(x0, y0), T(x1, y0), T(x1, y1), T(x0, y1)]);
    const cap = (x, y, r) => { const p = T(x, y); return `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(r * k)}" fill="${K.ink}"/>`; };
    const cord = ptsD([T(-17, -39), T(0, -50), T(17, -39)]);
    return (cy2 ? cyanLine(cord, 2.4 * Math.min(1, k + 0.2), false) : L(cord, K.ink, 1.6)) +
      S(R(-17, -36, 17, 34), K.p50, 2.4, 1.4) + P(R(10, -36, 17, 34), K.p300) +
      `<path d="${R(-22, -41, 22, -35)}" fill="${K.ink}"/>` + cap(-23.5, -38, 3.2) + cap(23.5, -38, 3.2) +
      `<path d="${R(-21, 33, 21, 40)}" fill="${K.ink}"/>` + cap(-23, 36.5, 3.8) + cap(23, 36.5, 3.8) +
      L(ptsD([T(-15, 31), T(15, 31)]), K.ink3, 1.1);
  }
  DRAW.fallingScroll = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, ln = A ? K.p300 : K.ink;
    let bg = groundBand(101, 99, 1.4, 2.2, col), fg = '';
    // falling: speed strokes above it; the impact: two paper ripples on the band and ink thrown up
    bg += [[46, 16, 12], [58, 10, 16], [76, 14, 11]].map(([x, y, l]) => speed([x, y], [x - 1.6, y - l], 3, ln)).join('');
    bg += `<path d="M28,104 Q62,93 96,104" fill="none" stroke="${A ? K.p300 : K.p50}" stroke-width="2.4" stroke-linecap="round"/><path d="M12,112 Q62,98 112,111" fill="none" stroke="${A ? K.p300 : K.p50}" stroke-width="2" stroke-linecap="round"/>`;
    if (A) fg += scrollAt(28, 47, 0.6, -10, false);
    fg += pushed(c, 15, 86, 10, 3, -1, { ln: col }) + pushed(c, 107, 86, 11, 5, 1, { ln: col });
    fg += scrollAt(62, 55, 1, 8, true) + P(blob(52, 98, 3, 6, 0.5, 231) + blob(74, 97, 2.4, 6, 0.5, 232) + blob(44, 92, 1.8, 6, 0.5, 233), K.ink);
    return { bg, fg };
  } };

  DRAW.seventhSeal = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, ln = A ? K.p300 : K.ink;
    // the black spot: the ground band the seven imprints lie on, printed in paper (3/4 view, sizes and places uneven, never
    // a row or a ring). 검수 6차 M3: closed rings with the same knot stroke in the middle read as the 5장 eclipse eye at
    // 32 px and as one glyph repeated, so each imprint is now a different, partly printed stamp — its rim only 70–85%
    // printed (one or two arcs, the gaps in different places), its knot stroke off-centre and running into the rim (at
    // least half the imprint wide), the stroke's shape differing (open loop, ㄱ curl, S bend; turned up to ±40°, some
    // mirrored), and three printed heavily on one side as a solid half-moon of paper
    let bg = groundBand(82, 80, 1.6, 0.9, col), fg = '';
    // [x, y, r, rim arcs [from°, to°]…, stroke (null: none), turn°, mirror x, heavy side° of a half-moon (null: none)]
    // printed rim per imprint: 79 · 78 · 72 · 80 · 76 · 75 · 78 % (a half-moon's own edge counts as printed rim); strokes:
    // open loop · ㄱ curl · S · ㄱ curl · none · S · none (awakened eighth: open loop, mirrored)
    const im = [
      [16, 94, 8, [[230, 515]], 'loop', -20, 1, null],
      [38, 113, 10, [[350, 452]], 'hook', 14, -1, 235],
      [60, 98, 6.5, [[40, 300]], 'S', -30, 1, null],
      [81, 117, 8.5, [[120, 250], [272, 430]], 'hook', -22, 1, null],
      [102, 98, 9, [[115, 210]], null, 0, 1, 330],
      [113, 114, 6, [[10, 280]], 'S', 35, -1, null],
      [55, 121, 5.5, [[205, 306]], null, 0, 1, 100]
    ];
    if (A) im.push([82, 92, 5.5, [[90, 360]], 'loop', 18, -1, null]);
    const pc = A ? K.p300 : K.p50;
    // the knot strokes in the imprint's unit circle (rim radius 1), each kept off the centre (a stroke through the middle
    // of a half-printed disc reads as 태극) and reaching the rim: an open loop with its two legs run out to the rim (a
    // knot), a ㄱ bar curling in at its end, an S bend down one side
    const GL = {
      loop: (() => { const p = [[1.04, 0.14], [0.78, 0.1]]; for (let i = 0; i <= 12; i++) { const a = rad(60 - 300 * i / 12); p.push([0.38 + Math.cos(a) * 0.3, -0.3 + Math.sin(a) * 0.4]); } return p.concat([[-0.1, 0.3], [-0.45, 0.55], [-0.78, 0.6]]); })(),
      hook: [[-0.96, -0.3], [-0.4, -0.5], [0.28, -0.5], [0.56, -0.28], [0.6, 0.14], [0.46, 0.4], [0.24, 0.4], [0.2, 0.2]],
      S: [[-0.5, -0.86], [-0.28, -0.48], [-0.5, -0.08], [-0.32, 0.34], [0.02, 0.54], [0.36, 0.6], [0.64, 0.76]]
    };
    im.forEach(([x, y, r, arcs, gl, rot, mir, half]) => {
      const ry = r * 0.55, w = Math.max(1.6, r * 0.24), U = (u, v) => [x + u * r, y + v * ry];
      const E = (a) => U(Math.cos(rad(a)), Math.sin(rad(a)));
      // the rim: printed arcs, heavy in their middles and drying out toward their ends (uneven pressure)
      arcs.forEach(([a0, a1]) => { const p = []; for (let i = 0; i <= 18; i++) p.push(E(lerp(a0, a1, i / 18))); bg += taperFn(p, (t) => w * (0.3 + 0.9 * Math.pow(Math.sin(Math.PI * t), 0.7)), pc); });
      // the heavy side: a solid half-moon of paper, its inner edge bowed a little toward the rim
      if (half != null) {
        const p = []; for (let i = 0; i <= 16; i++) p.push(E(half - 90 + 180 * i / 16));
        const m = U(Math.cos(rad(half)) * 0.16, Math.sin(rad(half)) * 0.16);
        bg += P(`${ptsD(p)} Q${f(m[0])},${f(m[1])} ${f(p[0][0])},${f(p[0][1])} Z`, pc);
      }
      if (gl) {
        const cs = Math.cos(rad(rot)), sn = Math.sin(rad(rot));
        const pts = GL[gl].map(([u, v]) => { const uu = u * mir; return U(uu * cs - v * sn, uu * sn + v * cs); });
        bg += taperFn(smooth(pts, 3), (t) => w * (1 - 0.45 * t), pc);
      }
    });
    // striking down: speed strokes beside its shoulders, dust thrown off where its face meets the ground
    bg += speed([30, 52], [29, 34], 3, ln) + speed([90, 54], [89, 38], 2.6, ln);
    // the big round stamp (3/4 view), squat (a tall drum read as a tin): a ball knob on a neck, the top face, a paper body
    // with a p300 shade and a groove, the face rim in cyan, pressed onto the ground
    const body = 'M34,52 L34,73 A26,7 0 0 0 86,73 L86,52 Z';
    fg += S(body, K.p50, 2.6, 1.6) + P('M73,53 L73,79.4 A26,7 0 0 0 86,73 L86,52 Z', K.p300) +
      L('M34,61 A26,7 0 0 0 86,61', K.ink3, 1.4) +
      `<ellipse cx="60" cy="52" rx="26" ry="7" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.6"/>` +
      `<path d="M56.2,30 L63.8,30 L65,51 L55,51 Z" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.2" stroke-linejoin="round"/>` +
      P('M60.6,31 L63.8,31 L64.8,50 L61.2,50 Z', K.p300) +
      `<circle cx="60" cy="24" r="8" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.4"/><path d="M54.4,22.6 A6,6 0 0 1 58.8,18" fill="none" stroke="${K.p300}" stroke-width="1.6"/>` +
      cyanLine('M34.6,74 A26,7 0 0 0 85.4,74', 2.4, false);
    fg += paperSplash(30, 82, 5.4, 6, 241, 1.6) + paperSplash(91, 82, 4.8, 6, 242, 1.6);
    return { bg, fg };
  } };

  // ---- nova (§3.1): an origin at the centre (r ≤ 18), one TRUE circle round it (r 34–48, its weight changing 1:2), broken
  // where 2–3 things fly out of it; 1–3 ghouls on or outside it showing the effect ----
  const NC = [64, 66];
  /** A ring band about c0 from a0 to a1 (deg): mid radius R, width wf(a) (deg → units), tapered over the last tp° at
   *  both ends; a closed polygon. */
  function ringBand(c0, R, a0, a1, wf, tp = 10) {
    const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 3)), out = [], inn = [];
    for (let i = 0; i <= n; i++) {
      const a = lerp(a0, a1, i / n), e = Math.min(1, (a - a0) / tp, (a1 - a) / tp), w = wf(a) * (0.25 + 0.75 * Math.max(0, e));
      out.push(polar(c0, a, R + w / 2)); inn.push(polar(c0, a, R - w / 2));
    }
    return polyD(out.concat(inn.reverse()));
  }

  DRAW.inkPulse = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, k = A ? 1.2 : 1, R = 38 * k;
    // the main mass: an ink ring of uneven weight (8–18), dry-brushed on its outer edge, broken in three places at uneven
    // steps where things burst out of it — the breaks narrow (14°) and the arcs between them uneven (62 · 89 · 167°), so
    // it stays one ring and never three even arcs — never an even 'O' or an ensō; one break sits on the seal corner (the
    // awakened 1.2 × ring would pass under the 覺 seal there); the 結 knot at the centre (the hero). The ends are blunt
    // and torn (tapered ends left lens-shaped pieces that read as fins)
    const wf = (a) => 13 + 4.2 * Math.sin(rad(a) * 2.3 + 0.7) + 1.4 * Math.sin(rad(a) * 5.1);
    const segs = [[-38, 24], [38, 127], [141, 308]];
    let bg = '', fg = '';
    segs.forEach(([a0, a1]) => { fg += P(ringBand(NC, R, a0, a1, wf, 3), K.ink); });
    // dry brush on the outer edge: paper streaks along it
    [[-36, -6], [52, 96], [176, 214], [240, 276]].forEach(([a0, a1], i) => {
      const p = []; for (let j = 0; j <= 10; j++) { const a = lerp(a0, a1, j / 10); p.push(polar(NC, a, R + wf(a) / 2 - 1.6 - (i % 2) * 1.2)); }
      fg += taperPoly(p, 1.4, 0.3, K.p50, 'opacity="0.9"');
    });
    // the burst through the upper break: a short speed stroke (no ink lump: that corner is the seal's)
    fg += speed(polar(NC, -45, R + 4), polar(NC, -45, R - 6), 3.4, K.ink);
    // the cyan leading edge: one arc on the ring's outer edge, a quarter turn
    const ce = []; for (let j = 0; j <= 14; j++) { const a = lerp(185, 275, j / 14); ce.push(polar(NC, a, R + wf(a) / 2 - 2.6)); }
    fg += cyanLine(ptsD(ce), 2.4, false);
    if (A) { [[-30, 20], [60, 130], [176, 280]].forEach(([a0, a1]) => { fg += P(ringBand(NC, 26, a0, a1, () => 3.4, 8), K.ink); }); }
    // 밀침: two ghouls thrown out through the lower-right and lower-left breaks, clear of the ring
    fg += pushed(c, 22, 108, 9.5, 3, -1, { ln: col }) + pushed(c, 114, 97, 8, 5, 1, { ln: col });
    fg += knotAt(NC[0], NC[1], 1.3);
    return { bg, fg };
  } };

  DRAW.frostRing = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, k = A ? 1.2 : 1, R = 39 * k;
    // the main mass: a paper ring (band 12–18, ink rims 3 both sides) broken where ice bursts out, frost crystals growing
    // in and out of it at uneven steps, black ghouls frozen onto it; the inside stays paper (a black disc with white
    // spikes is the 검은 태양)
    const wf = (a) => 15 + 3 * Math.sin(rad(a) * 2 + 1.1);
    // awakened (§12-1): a pale disc keeps the ring's inside light on the awakened ink ground — a dark inside with white
    // spikes round it is the core 검은 태양 (the same look)
    let bg = A ? `<circle cx="${NC[0]}" cy="${NC[1]}" r="${f(R - 6)}" fill="${K.p300}"/>` : '', fg = '';
    [[-30, 112], [134, 302]].forEach(([a0, a1]) => { const d = ringBand(NC, R, a0, a1, wf, 6); fg += `<path d="${d}" fill="${K.p50}" stroke="${K.ink}" stroke-width="3" stroke-linejoin="round"/>`; });
    // frost: [angle, side (+1 out / −1 in), length]
    const fr = [[-20, 1, 14], [8, -1, 10], [40, 1, 17], [68, -1, 9], [96, 1, 12], [150, 1, 16], [178, -1, 11], [212, 1, 13], [246, -1, 8], [276, 1, 15]];
    fg += frost(fr.map(([a, sd, l]) => { const p = polar(NC, a, R + sd * (wf(a) / 2 + 1)); return [p[0], p[1], sd > 0 ? a : a + 180, l * (A ? 1.25 : 1)]; }), 31);
    // ice bursting out of the two breaks
    fg += paperSplash(...polar(NC, 123, R + 3), 6.4, 6, 261, 2) + paperSplash(...polar(NC, 318, R + 1), 4.6, 5, 262, 1.8);
    // the cyan core along one stretch of the band
    const cc = []; for (let j = 0; j <= 18; j++) cc.push(polar(NC, lerp(146, 214, j / 18), R));
    fg += cyanLine(ptsD(cc), 3, false);
    // 서리 감속: ghouls frozen on the ring — frost over their black bodies
    const gs = [[208, 11, 3], [62, 10, 5]].concat(A ? [[262, 8, 7]] : []);
    gs.forEach(([a, r, seed]) => { const G = polar(NC, a, R); fg += ghoul(c, G[0], G[1], r, seed) + frost([[G[0] - r * 0.5, G[1] + r * 0.3, 200, r * 0.9], [G[0] + r * 0.3, G[1] + r * 0.4, -20, r * 0.8]], seed + 50, 1.8); });
    return { bg, fg };
  } };

  /** 천둥 박수 hand seen from its back, wrist at W, the fingers along deg (0 = up, + = clockwise), the thumb on the +x
   *  side (m = 1) or −x (m = −1): a paper palm, four fingers held together (their tips just parted, uneven lengths), the
   *  thumb off the side, an ink cuff. tone = the paper (p300 for the hand behind). */
  function clapHand(W, deg, m, tone) {
    const a = rad(deg), cs = Math.cos(a), sn = Math.sin(a), T = (px, py) => [W[0] + px * m * cs - py * sn, W[1] + px * m * sn + py * cs];
    const out = smooth([[-9, 0], [-9.8, -15], [-9.4, -24], [-8.6, -33], [-6.8, -36.4], [-5, -34], [-4.6, -23], [-4.2, -38], [-2.2, -41.6], [0, -38.6], [0.2, -23],
      [0.6, -40.4], [2.8, -43.2], [4.8, -40], [4.8, -23], [5.4, -37], [7.6, -38.6], [9.4, -35], [9.4, -20], [12.4, -24], [16.4, -27], [18, -24], [14.6, -16], [10.4, -7], [8.6, 0]], 3).map(([x, y]) => T(x, y));
    const knuckle = L(ptsD(smooth([[-8.6, -21], [-3, -22.4], [3, -22.4], [8.6, -20.4]].map(([x, y]) => T(x, y)), 3)), K.ink3, 1.1);
    const cuff = [[-9.4, 0], [8.8, 0], [9.6, 9], [-10, 9]].map(([x, y]) => T(x, y));
    return `<path d="${polyD(cuff)}" fill="${K.ink}"/>` + S(polyD(out), tone, 2.4, 1.3) + knuckle;
  }
  DRAW.thunderclap = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, k = A ? 1.2 : 1, CL = [62, 70];
    let bg = '', fg = '';
    // the shock ring round the clap: a jagged bolt ring (bends at uneven steps 13–29° and reach, broken twice; never an
    // even saw) — two rings awakened
    const ring = (R, a0, a1, seed, w) => { const Rn = rng(seed), p = []; let a = a0; while (a < a1) { p.push(polar(CL, a, R + (Rn() - 0.5) * 9)); a += 13 + Rn() * 16; } p.push(polar(CL, a1, R)); return zig(p, w, false); };
    fg += ring(46 * k, -24, 128, 271, 7) + ring(46 * k, 150, 300, 272, 7);
    if (A) fg += ring(34, 6, 146, 273, 3.6) + ring(34, 166, 326, 274, 3.6);
    // 기절: a ghoul thrown off beyond the ring with the paper spiral over it
    fg += ghoul(c, 15, 109, 9.5, 3) + stunSpiral(15, 94, 7, 0.9);
    // the two hands meeting, overlapped and tilted (never an upright prayer): the far one (p300, thumb to the left) more
    // upright, the near one (paper, thumb to the right) leaning 38° across it; the flash bursts where their fingers meet
    fg += clapHand([50, 102], 14, -1, K.p300) + clapHand([52, 112], 38, 1, K.p50);
    // clap marks: short strokes off each side
    fg += speed([42, 58], [33, 52], 2.6, col) + speed([40, 68], [30, 66], 2.2, col) + speed([96, 82], [106, 80], 2.6, col);
    // the flash at the fingertips: 7 uneven rays, paper, with the cyan core
    fg += `<path d="${splashD(73, 64, 15, 7, 281, 0.46, -0.4)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="${splashD(73, 64, 7.6, 6, 282, 0.62)}" fill="${K.ally}" stroke="${K.ink}" stroke-width="1.8" stroke-linejoin="round"/>`;
    return { bg, fg };
  } };

  DRAW.silenceBell = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, k = A ? 1.2 : 1;
    let bg = '', fg = '';
    // smooth paper rings (ink rims, unbroken; their weight swelling 1:2 round the circle) spreading from the bell — one
    // more awakened; drawn first, so the bell and the ghouls cover parts of them
    const rings = [[28 * k, 4, 0.3], [44 * k, 6, 1.9]].concat(A ? [[56, 3.4, 2.6]] : []);
    rings.forEach(([R, w, ph]) => { const d = ringBand(NC, R, 0, 360, (a) => w + w * 0.5 * Math.sin(rad(a) + ph), 0.001); fg += `<path d="${d}" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.2" stroke-linejoin="round"/>`; });
    // 먹 감속: two ghouls outside the rings, feet in ink, drops dragging behind them
    [[16, 100, 10, 3, -1], [113, 98, 9, 5, 1]].forEach(([x, y, r, seed, dir]) => {
      fg += P(blob(x, y + r * 0.95, r * 1.3, 9, 0.3, seed + 290, 0.3), col) + ghoul(c, x, y, r, seed) + P(dropD(x + dir * (r + 5), y + 2, 4.6, 1.6) + dropD(x + dir * (r + 10), y + 6, 3.4, 1.2), col);
    });
    // the small paper handbell (34 tall: a dark wooden grip, a flared paper body with a p300 shade, ink rim 3)
    const bell = 'M54,52 C54,44 58,40 64,40 C70,40 74,44 74,52 C74,62 78,70 84,76 C84,80 44,80 44,76 C50,70 54,62 54,52 Z';
    fg += `<path d="M61,24 L67,24 L68,40 L60,40 Z" fill="${K.ink}"/><circle cx="64" cy="22" r="4.6" fill="${K.ink}"/>` +
      S(bell, K.p50, 3, 1.6) + P('M68,42 C72,46 72,54 72,58 C73,66 77,72 82,76 L76,77 C72,72 69,64 68,56 Z', K.p300) +
      L('M47,74 C56,76.6 72,76.6 81,74', K.ink3, 1.2);
    // the clapper, an ink ball under the mouth, tied fast to the rim with the cyan thread (the bell cannot ring)
    fg += `<circle cx="66" cy="86" r="4.6" fill="${K.ink}"/>` + cyanLine('M48,77 C50,86 58,90 64,89 C69,88.4 71,84 67,82.4 C63,81 60,86 63,89', 2.4, false);
    return { bg, fg };
  } };

  // ---- lob (§3.1): a dotted parabola from the lower left (8–16, 100–112) over a top (48–72, 16–30) down to a landing
  // (92–112, 94–108); the object big near the top or on the way down; ink splashed at the landing ----
  /** Points on the parabola p0 → apex → p1 (a quadratic through the apex at t 0.5). */
  function lobArc(p0, top, p1, n = 24) {
    const C = [2 * top[0] - (p0[0] + p1[0]) / 2, 2 * top[1] - (p0[1] + p1[1]) / 2], o = [];
    for (let i = 0; i <= n; i++) { const t = i / n, v = 1 - t; o.push([v * v * p0[0] + 2 * v * t * C[0] + t * t * p1[0], v * v * p0[1] + 2 * v * t * C[1] + t * t * p1[1]]); }
    return o;
  }
  /** The flight line: ink dots 2.4, dash 5/6 (p300 awakened: a bg ink line). */
  const lobLine = (pts, A, w = 2.4) => L(ptsD(pts), A ? K.p300 : K.ink, w, 'stroke-dasharray="5 6"');
  /** 먹단지 / 송이 단지 white jar (B2 §6.4), body centre at (x, y), height 36 × k, tilted deg: a porcelain jar — broad
   *  shoulder, a belly tapering to a narrow foot, a short neck — paper with a p300 shade, a flat ink lid (no knob: a knob
   *  on a round pot reads as a fuse), one ink run down the shoulder, a cord round the neck (cyan when cy). */
  function whiteJar(x, y, k, deg, cy) {
    const tr = `translate(${f(x)} ${f(y)}) rotate(${f(deg)}) scale(${f(k)})`;
    const body = 'M-7,-15 L7,-15 L6.2,-12 C13,-10.6 17,-6 16.4,0 C15.8,7 12,13 8.6,16.6 L9.2,19 L-9.2,19 L-8.6,16.6 C-12,13 -15.8,7 -16.4,0 C-17,-6 -13,-10.6 -6.2,-12 Z';
    const shade = 'M16.4,0 C15.8,7 12,13 8.6,16.6 L9.2,19 L2,19 C7,14.6 10.4,8 11,1.4 C11.4,-3 10.6,-6.6 9.2,-9.4 C13.4,-7.6 16.6,-4 16.4,0 Z';
    const cord = 'M-6.6,-11.6 C-2,-10.4 2,-10.4 6.6,-11.6';
    return `<g transform="${tr}">` + S(body, K.p50, 2.4 / k, 1.2 / k) + P(shade, K.p300) + L('M-8,16.6 L8,16.6', K.ink3, 1.1 / k) +
      `<path d="M-8.4,-15.4 L8.4,-15.4 L7.6,-19.2 C3.6,-20.4 -3.6,-20.4 -7.6,-19.2 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="${f(1.4 / k)}" stroke-linejoin="round"/>` +
      `<path d="M-4.6,-12.6 C-6,-7 -7,-1 -6,5 C-5.6,6.8 -7.4,8 -8.2,6.2 C-8.4,0 -7.2,-7 -6.2,-12 Z" fill="${K.ink}"/>` +
      (cy ? L(cord, K.ink, 4.4 / k) + L(cord, K.ally, 2.4 / k) + L('M5.6,-11.2 C7.8,-8 9,-5 8.4,-2', K.ink, 3.6 / k) + L('M5.6,-11.2 C7.8,-8 9,-5 8.4,-2', K.ally, 1.6 / k)
        : L(cord, K.ink, 1.6 / k)) + '</g>';
  }
  DRAW.inkPots = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // the flight: from the lower left over the top (62, 22) down to the landing (102, 100)
    const arc = lobArc([10, 106], [60, 18], [102, 100]);
    let bg = lobLine(arc.slice(0, 11), A) + lobLine(arc.slice(15, 22), A), fg = '';
    // the black spot: the ink splashed where the last jar landed (lower right), flattened, with drops thrown, and the
    // ink the flying jar sheds along its path
    bg += `<g transform="translate(100 106) scale(1 0.74) translate(-100 -106)">${P(splashD(100, 106, 44, 9, 301, 0.62, -0.3), col)}</g>` +
      P(blob(74, 94, 4, 6, 0.5, 302) + blob(124, 88, 3, 6, 0.5, 303) + blob(88, 118, 2.6, 6, 0.5, 304) + blob(66, 104, 2.6, 6, 0.5, 305), col) +
      taperPoly(lobArc([10, 106], [60, 18], [102, 100]).slice(11, 15), 1.2, 4.4, col);
    // the jar flying over the top, tilted forward (awakened: a second one has already burst at the landing)
    if (A) fg += P(splashD(104, 92, 9, 6, 305, 0.45), K.p50, `stroke="${K.ink}" stroke-width="1.8" stroke-linejoin="round"`) +
      `<g transform="rotate(28 104 92)">` + P('M96,92 L100,84 L104,90 Z M106,90 L111,86 L112,94 Z', K.p50, `stroke="${K.ink}" stroke-width="1.6" stroke-linejoin="round"`) + '</g>';
    fg += whiteJar(60, 34, 0.92, 24, true);
    return { bg, fg };
  } };

  DRAW.clusterPots = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // [jar centre, scale, tilt, landing]: small jars of different sizes (14–22 tall), their cord coming loose at the top,
    // each now on its own dotted path to its own place round the target (four awakened)
    // (spread apart a little so their lids and feet show: bunched round jars read as a bunch of grapes)
    const jars = [[[42, 32], 0.56, -16, [80, 106]], [[72, 22], 0.48, 22, [104, 100]], [[64, 50], 0.4, 40, [96, 116]]];
    if (A) jars.push([[88, 42], 0.37, 56, [118, 110]]);
    let bg = lobLine(lobArc([10, 108], [50, 26], [56, 30]).slice(0, 14), A), fg = '';
    // the black spot: three splashes round the target ghoul (lower right), of different sizes, never in a row
    jars.forEach(([J, k, deg, Ld], i) => {
      bg += lobLine(lobArc(J, [J[0] + (Ld[0] - J[0]) * 0.3, J[1] - 4], Ld, 12).slice(2, 11), A);
      bg += `<g transform="translate(${Ld[0]} ${Ld[1]}) scale(1 0.66) translate(${-Ld[0]} ${-Ld[1]})">${P(splashD(Ld[0], Ld[1], 18 + 4 * (i % 2), 7, 311 + i, 0.6, -0.2), col)}</g>`;
    });
    fg += ghoul(c, 104, 80, 11, 3);
    // the cluster cord: the cyan loop that held their necks, slipping off over the top, its ends flying
    fg += cyanLine('M38,18 C46,8 62,6 72,10 C78,12 78,18 72,18', 2.4, false) + cyanLine('M38,18 C33,22 30,28 32,34', 2.4, false);
    jars.forEach(([J, k, deg]) => { fg += whiteJar(J[0], J[1], k, deg, false); });
    return { bg, fg };
  } };

  DRAW.tarJar = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, k = A ? 1.2 : 1;
    let bg = lobLine(lobArc([10, 104], [52, 22], [84, 70]).slice(0, 17), A), fg = '';
    // the main mass: the wide sticky pool at the lower right (flattened, its rim sagging into strings and drops)
    const Pc = [86, 106];
    bg += `<g transform="translate(${Pc[0]} ${Pc[1]}) scale(${k} ${0.34 * k}) translate(${-Pc[0]} ${-Pc[1]})">${P(blob(Pc[0], Pc[1], 38, 12, 0.22, 321), col)}</g>`;
    [[56, 109, 7], [70, 112, 10], [104, 112, 6], [118, 110, 8]].forEach(([x, y, h], i) => { bg += L(`M${x},${y} C${x + 1},${y + h * 0.4} ${x - 1},${y + h * 0.7} ${x},${y + h}`, col, 1.6) + P(dropD(x, y + h + 1.8, 4, 1.5), col); });
    // 먹 감속: a ghoul stuck in it, feet in the tar, drops dragging behind
    fg += ghoul(c, 108, 92, 10, 3) + P(blob(108, 101, 13, 9, 0.3, 322, 0.32), col) + P(dropD(122, 96, 4.6, 1.6) + dropD(126, 102, 3.4, 1.2), col);
    // the black jar (big belly; ink with an ink.500 light face and a paper glint on the shoulder) lying where it fell: its
    // FOOT RING showing at the upper left, its open MOUTH (a dark opening in a paper lip) to the lower right with the tar
    // pouring out over the lip into the pool; the seal cord round its neck in cyan. 검수 6차 M2: a black round body with a
    // white zigzag crack and a square chip stuck on its shoulder read as the 폭탄병 bomb, so the crack is gone and the
    // broken pieces lie on the ground by the pool as curved potsherds
    // (a jar, not a ball: broad shoulders, the belly narrowing to a foot ring, a short neck and a flared lip)
    const jarBody = 'M-6.4,-13 C-14,-12 -18,-6 -18,1 C-18,9 -13,15.6 -9,18.4 L9,18.4 C13,15.6 18,9 18,1 C18,-6 14,-12 6.4,-13 Z';
    // (the seal cord: cyan 3 in ink 5.4 round the neck, its loose end trailing out over the paper, so it shows at 32 px)
    const cord = 'M-6.8,-12.2 C-2,-10.8 2,-10.8 6.8,-12.2 C11,-13.6 15,-12.6 18,-16.2';
    const blackJar = (glint, cy) => S(jarBody, K.ink, 2.4, 1.4) + P('M-15,-4 C-16.6,3 -13.6,10 -7.4,14.2 C-11.6,7.6 -12.6,0.6 -10.8,-6.4 Z', K.ink5) +
      (glint ? L('M-9.2,-9 C-6.6,-10.6 -3.2,-11.4 0,-11.4', K.p50, 1.6) : '') +
      // the foot ring at the far end (on top of the body): a band with a paper edge and a sliver of the base
      `<path d="M-9.6,17.2 L9.6,17.2 L8.8,23 L-8.8,23 Z" fill="${K.ink5}" stroke="${K.ink}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<ellipse cx="0" cy="23" rx="8.8" ry="2.2" fill="${K.ink}" stroke="${K.ink}" stroke-width="1.4"/>` + L('M-8.6,17.6 L8.6,17.6', K.p300, 1.2) +
      `<path d="M-6.4,-13.2 L-5.4,-16 L5.4,-16 L6.4,-13.2 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="1.6" stroke-linejoin="round"/>` +
      (cy ? L(cord, K.ink, 5.4) + L(cord, K.ally, 3) : '') +
      // the open mouth: a dark opening inside a paper lip (with an ink edge outside, so it shows on paper too)
      `<ellipse cx="0" cy="-17.2" rx="8.6" ry="3" fill="${K.ink}" stroke="${K.ink}" stroke-width="4.6"/><ellipse cx="0" cy="-17.2" rx="8.6" ry="3" fill="${K.ink}" stroke="${K.p50}" stroke-width="2"/>`;
    // (rotated 127°: the mouth at about (78, 86) faces down and to the right, the foot at about (47, 63)); the tar spills
    // over the lower lip and runs down into the pool
    fg += `<g transform="translate(64 76) rotate(127)">${blackJar(true, true)}</g>` +
      `<path d="M76.4,88.2 C80.6,90.4 85,94.2 86.6,99.6 C87.2,102.4 86.4,105.2 84.6,106 C82.8,105.2 82.6,102.2 82.2,99.8 C81,95.6 78.2,92.6 74.8,91 Z" fill="${K.ink}"/>`;
    // the broken pieces: two curved potsherds on the ground at the pool's left edge (ink with an ink.500 inner face)
    const sherd = (x, y, rot, s) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
      `<path d="M-6.4,0.6 C-4,-3.4 3,-3.8 6.4,-1 L4.6,1.6 C2,-0.2 -2.4,0 -4.6,2.4 Z" fill="${K.ink}" stroke="${K.ink}" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<path d="M-4.2,1.2 C-2,-0.6 2,-0.8 4.4,0.6" fill="none" stroke="${K.ink5}" stroke-width="1.2"/></g>`;
    fg += sherd(40, 103, -8, 1) + sherd(50, 114, 18, 0.8);
    if (A) fg += `<g transform="translate(40 30) rotate(-18) scale(0.6)">${blackJar(false, false)}</g>`;
    return { bg, fg };
  } };

  /** 유성 붓 brush, falling head first from its butt B along deg (len): a round ink cap on the butt with a small paper
   *  hanging loop, a paper handle, a paper ferrule with two ink bands, and swollen ink bristles CRUSHED where they hit —
   *  splayed into three prongs of different lengths (검수 6차 M1: a clean point read as a rocket's nose). */
  function meteorBrushD(B, deg, len) {
    const at = axis(B, deg), M = (a) => a.map(([t, s]) => at(t * len, s));
    const handle = ptsD(M([[0.02, -3.4], [0.42, -4], [0.42, 4], [0.02, 3.4]]), true);
    const ferrule = ptsD(M([[0.42, -5.4], [0.58, -6], [0.58, 6], [0.42, 5.4]]), true);
    // bristles: swelling past the ferrule, then pressed flat and splayed — three prongs (the middle one longest, the
    // outer two bent out and back), notches of paper between them
    const bristles = ptsD(smooth(M([[0.57, -6.2], [0.66, -9.8], [0.76, -10.6], [0.86, -12.4], [0.9, -15], [0.88, -9.6], [0.95, -6.2], [1.02, -1.4], [0.97, 0.6],
      [0.93, 4.4], [0.9, 9.6], [0.86, 13.6], [0.8, 11.6], [0.72, 9.8], [0.62, 8.6], [0.57, 6.2]]), 4), true);
    const cap = at(-0.6, 0), loopC = at(-4.6, 0);
    return `<ellipse cx="${f(loopC[0])}" cy="${f(loopC[1])}" rx="3.6" ry="2.4" transform="rotate(${f(deg)} ${f(loopC[0])} ${f(loopC[1])})" fill="none" stroke="${K.p50}" stroke-width="1.5"/>` +
      `<circle cx="${f(cap[0])}" cy="${f(cap[1])}" r="4.4" fill="${K.ink}" stroke="${K.p50}" stroke-width="1.3"/>` +
      S(handle, K.p50, 2.4, 1.2) + P(ptsD(M([[0.06, 1.2], [0.42, 1.4], [0.42, 4], [0.06, 3.5]]), true), K.p300) +
      S(bristles, K.ink, 2, 1.4) + L(ptsD(M([[0.64, -5], [0.82, -6.4]])), K.ink5, 2) +
      S(ferrule, K.p50, 2.2, 1) + L(ptsD(M([[0.46, -5.6], [0.46, 5.6]])) + ' ' + ptsD(M([[0.53, -5.8], [0.53, 5.8]])), K.ink, 1.6);
  }
  DRAW.meteorBrush = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // the main mass: the brush comet falling from the upper left to the lower right — a dry ink comet tail behind the
    // brush that WIDENS away from it (narrow as the handle at the butt, 28 at its far end, where it breaks into dry tines
    // of different lengths and broken ink dots), the paper handle with its ink cap and hanging loop showing inside the
    // tail's near end, the ink bristles crushed and splayed where they hit; at the landing a big ink splash, a paper
    // flash and a ghoul shoved away. 검수 6차 M1: a tail narrowing to a point far behind (with the cyan core out there)
    // and a clean pointed head read as a rocket launched to the upper left. The seal corner stays empty.
    const deg = 42, tip = [94, 96], len = 64, B = polar(tip, deg + 180, len);
    let bg = `<g transform="translate(${f(tip[0] + 4)} ${f(tip[1] + 6)}) scale(1 0.58) translate(${f(-tip[0] - 4)} ${f(-tip[1] - 6)})">${P(splashD(tip[0] + 4, tip[1] + 6, 36, 9, 331, 0.58, -0.4), col)}</g>`;
    bg += P(blob(tip[0] - 26, tip[1] + 8, 2.6, 6, 0.5, 332) + blob(tip[0] + 28, tip[1] - 4, 2.2, 6, 0.5, 333) + blob(tip[0] - 12, tip[1] + 18, 1.8, 6, 0.5, 335), col);
    let fg = '';
    /** a dry tine along pts (3 points), width w0 → we, its end split in two by a notch nd deep (검수 7차 R7: the tines
     *  tapered to points read as fletching at 32 px; a dry brush's end stays blunt and splits) */
    const dryTine = (pts, w0, we, nd) => {
      const Lf = [], Rt = [];
      pts.forEach((p, i) => {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const nx = -(b[1] - a[1]) / dl, ny = (b[0] - a[0]) / dl, hw = lerp(w0, we, i / (pts.length - 1)) / 2;
        Lf.push([p[0] + nx * hw, p[1] + ny * hw]); Rt.push([p[0] - nx * hw, p[1] - ny * hw]);
      });
      // the end: two blunt prongs (each with a short flat end) either side of a notch nd deep
      const e = pts[pts.length - 1], q = pts[pts.length - 2], el = Math.hypot(e[0] - q[0], e[1] - q[1]) || 1;
      const ux = (e[0] - q[0]) / el, uy = (e[1] - q[1]) / el, k = we * 0.18;
      return P(polyD(Lf.concat([[e[0] - uy * k, e[1] + ux * k], [e[0] - ux * nd, e[1] - uy * nd], [e[0] + uy * k, e[1] - ux * k]], Rt.reverse())), K.ink);
    };
    /** a comet tail behind a brush butt Bt along deg: length tl, width w0 at the butt widening to w1; its far end is the
     *  dry end of a brush stroke — n parallel dry tines of different lengths and weights (never converging to a point,
     *  never spikes: tines meeting at points read as fletching or flames) — with drops of ink left behind. drops = false
     *  leaves the drops out (검수 7차 F2: in the awakened icon the paper halo turned them into white-ringed dots beside
     *  the frame's corner diamond) */
    const comet = (Bt, tl, w0, w1, seed, n, drops = true) => {
      const at = axis(Bt, deg + 180), p = smooth([at(-6, 0), at(tl * 0.4, 0.6), at(tl * 0.75, -0.8), at(tl, 0.4)], 6);
      let s = taperFn(p, (t) => w0 + (w1 - w0) * Math.pow(t, 0.85), K.ink);
      const Rn = rng(seed);
      for (let i = 0; i < n; i++) {
        const sd = lerp(-w1 * 0.4, w1 * 0.4, i / (n - 1)) + (Rn() - 0.5) * 1.6, l = 4 + Rn() * 13, w = 1.8 + Rn() * 2.4, dr = (Rn() - 0.5) * 1.6;
        const we = Math.max(1.8, w * 0.75);
        s += dryTine([at(tl - 4, sd), at(tl + l * 0.6, sd + dr * 0.6), at(tl + l, sd + dr)], w, we, Math.min(we, l * 0.3));
      }
      [[tl + 18, -w1 * 0.3], [tl + 24, w1 * 0.16], [tl + 15, w1 * 0.44]].forEach(([d, sd], i) => { const r = 1.2 + Rn() * 1.1; if (drops) s += P(blob(...at(d, sd), r, 6, 0.5, seed + i), K.ink); });
      // dry streaks of paper running down the tail (비백), opening apart toward its far end
      [[0.26, 0.9, -0.24], [0.4, 1, 0.16], [0.52, 0.94, -0.04], [0.62, 1, 0.33]].forEach(([t0, t1, sk]) => {
        s += taperPoly([at(tl * t0, sk * (w0 + (w1 - w0) * t0)), at(tl * t1, sk * (w0 + (w1 - w0) * t1))], 0.4, 1.9, K.p50, 'opacity="0.9"');
      });
      return s;
    };
    fg += comet(B, 32, 9, 28, 336, 4, !A);
    // the cyan core runs down the middle of the tail from the brush's side
    fg += cyanLine(ptsD([polar(B, deg + 180, 8), polar(B, deg + 182, 30)]), 2.4, false);
    if (A) {
      const B2 = polar([46, 104], deg + 180, 34);
      fg += comet(B2, 18, 6, 15, 341, 4, false) + meteorBrushD(B2, deg, 34);
    }
    // 밀침: the ghoul thrown off the landing to the right
    fg += pushed(c, 114, 80, 9.5, 3, 1, { ln: col, splash: false });
    fg += meteorBrushD(B, deg, len) + `<path d="${splashD(tip[0] + 1, tip[1] + 1, 12, 7, 334, 0.42)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"/>`;
    return { bg, fg };
  } };

  // ---- chain (§3.1): from the left end (2–12, 70–90) to targets scattered in turn (never one line, heights ≥ 14 apart,
  // r 7–12); each weapon's own link joins them in order ----
  DRAW.sparkThread = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // [ghoul centre, r, seed, bow of the hop into it (× its span)]: four targets at different heights and sizes (five
    // awakened); the thread runs from the side of one ghoul to the side of the next in soft arcs of different heights
    // and spans (never three equal humps 'mmm'; tall loops read as 'M'), so it never crosses a body
    // 검수 6차 R3: heights 56 · 100 · 58 · 94 at even steps made an even W; now 50 · 100 · 72 · 92 at steps 36 · 22 · 26
    const tg = [[[26, 50], 12.5, 3, 0.2], [[62, 100], 13.5, 5, -0.14], [[84, 72], 11, 7, 0.26], [[110, 92], 13, 9, -0.1]];
    if (A) tg.push([[116, 56], 7.5, 11, 0.18]);
    // the black spot: the ghouls and the ink the thread was flicked out of at the left end
    let bg = '', fg = P(splashD(9, 84, 12, 7, 340, 0.55), col);
    const thr = [];
    let prev = [12, 80];
    tg.forEach(([G, r, , k], i) => {
      const u = [G[0] - prev[0], G[1] - prev[1]], d = Math.hypot(u[0], u[1]), E = [G[0] - u[0] / d * r * 0.85, G[1] - u[1] / d * r * 0.85];
      const span = Math.hypot(E[0] - prev[0], E[1] - prev[1]), m = [(prev[0] + E[0]) / 2, (prev[1] + E[1]) / 2], nn = [(E[1] - prev[1]) / span, -(E[0] - prev[0]) / span];
      const C = [m[0] + nn[0] * k * span * 2, m[1] + nn[1] * k * span * 2], p = [];
      for (let j = 0; j <= 16; j++) { const t = j / 16, v = 1 - t; p.push([v * v * prev[0] + 2 * v * t * C[0] + t * t * E[0], v * v * prev[1] + 2 * v * t * C[1] + t * t * E[1]]); }
      thr.push(p);
      const nx = tg[i + 1];
      if (nx) { const v = [nx[0][0] - G[0], nx[0][1] - G[1]], dv = Math.hypot(v[0], v[1]); prev = [G[0] + v[0] / dv * r * 0.85, G[1] + v[1] / dv * r * 0.85]; }
    });
    tg.forEach(([G, r, seed]) => { fg += ghoul(c, G[0], G[1], r, seed); });
    thr.forEach((p) => { fg += cyanLine(ptsD(p), 2.6, true); });
    // a small paper spark (5–6 uneven rays) where the thread touches each ghoul
    tg.forEach(([G, r], i) => { const p = thr[i][thr[i].length - 1]; fg += `<path d="${splashD(p[0], p[1], 5.4, 5 + (i % 2), 341 + i, 0.45)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.5" stroke-linejoin="round"/>`; });
    return { bg, fg };
  } };

  DRAW.stormThread = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // the main mass: a whirlwind funnel (3/4 view: a helix wide at the top, 84 across, narrowing to its foot) wound from two
    // twisted thread-bolts, kinked like lightning; small ghouls caught and pierced along it. (A flat spiral read as '6' /
    // 'G'; the funnel never closes into an '@'.)
    const hx = (t, ph) => { const y = 40 + 68 * t, rx = 38 * (1 - 0.78 * t), a = ph + t * Math.PI * 2 * 2.6; return [55 + Math.sin(t * 3) * 4 + Math.cos(a) * rx, y + Math.sin(a) * rx * 0.24]; };
    const strand = (ph, kink) => { const o = []; for (let i = 0; i <= 64; i++) { const p = hx(i / 64, ph); o.push(i % kink === 0 && i > 0 && i < 64 ? [p[0], p[1] - 2.6] : p); } return o; };
    let bg = '', fg = '';
    const a = strand(0, 5), b = strand(Math.PI * 0.85, 7);
    fg += `<path d="${ptsD(b)}" fill="none" stroke="${K.ink}" stroke-width="5" stroke-linejoin="miter" stroke-miterlimit="6"/><path d="${ptsD(b)}" fill="none" stroke="${K.p50}" stroke-width="1.6" stroke-linejoin="miter" stroke-miterlimit="6"/>`;
    fg += `<path d="${ptsD(a)}" fill="none" stroke="${K.ink}" stroke-width="5.6" stroke-linejoin="miter" stroke-miterlimit="6"/><path d="${ptsD(a)}" fill="none" stroke="${K.ally}" stroke-width="2.6" stroke-linejoin="miter" stroke-miterlimit="6"/>`;
    // [strand, position along it, x offset, r, seed]: seven small ghouls of different sizes caught on the whirl (eight
    // awakened); the third and fifth stunned. 검수 6차 R6: two at the upper right (and the awakened eighth against one of
    // them) touched; the places are now spread over both strands so every two silhouettes stay 10.4 apart or more (8.5
    // with the awakened eighth), the stun spirals clear of the others, never three in a row and at most three on the top
    // turn
    const SS = { a, b }, gs = [['b', 1, -1.6, 7.5, 3], ['b', 41, 1.6, 6.5, 5], ['a', 3, -1.6, 8.5, 7], ['b', 6, 1.6, 6, 9], ['a', 62, -1.6, 7, 11], ['b', 20, 1.6, 6, 13], ['b', 28, -1.6, 7.5, 15]];
    if (A) gs.push(['b', 62, 1.6, 5.6, 17]);
    gs.forEach(([s, i, dx, r, seed]) => { const p = SS[s][i]; fg += ghoul(c, p[0] + dx, p[1], r, seed); });
    [2, 4].forEach((j) => { const [s, i, dx, r] = gs[j], p = SS[s][i]; fg += stunSpiral(p[0] + dx + 1, p[1] - r - 5, 5.2, 0.4 + i * 0.1); });
    // the black spot: the dust the funnel drags at its foot (a ragged dark wash, wider than the foot)
    bg += `<g transform="translate(60 110) scale(1 0.4) translate(-60 -110)">${P(splashD(60, 110, 40, 9, 351, 0.6, 0.2), col)}</g>`;
    return { bg, fg };
  } };

  /** 서리 사슬: n paper ice links from a to b, alternating face-on ovals and edge-on bars, ink rims; link `cyan` has the
   *  cyan core. */
  function iceChain(a, b, n, cyan) {
    const deg = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, d = Math.hypot(b[0] - a[0], b[1] - a[1]), step = d / n;
    let s = '';
    for (let i = 0; i < n; i++) {
      // (the cyan link is a face-on one, bigger: cyan 3 inside ink 6, so it shows at 32 px)
      const C0 = polar(a, deg, step * (i + 0.5)), face = i % 2 === 0, cy = i === cyan, rx = step * (cy ? 0.72 : 0.62), ry = face ? (cy ? 5.6 : 4.6) : 1.6;
      s += `<ellipse cx="${f(C0[0])}" cy="${f(C0[1])}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(deg)} ${f(C0[0])} ${f(C0[1])})" fill="${face ? 'none' : K.p50}" stroke="${K.ink}" stroke-width="${face ? (cy ? 6 : 5) : 3.4}"/>`;
      s += `<ellipse cx="${f(C0[0])}" cy="${f(C0[1])}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(deg)} ${f(C0[0])} ${f(C0[1])})" fill="none" stroke="${cy ? K.ally : K.p50}" stroke-width="${face ? (cy ? 3 : 2.2) : 1.2}"/>`;
    }
    return s;
  }
  DRAW.frostChainlet = { draw(c, A) {
    const col = A ? K.ink7 : K.ink;
    // [ghoul centre, r, seed, links to it]: five ghouls at different heights and sizes (six awakened) standing on the ground
    // at different depths, along a lopsided arch (spans 14 · 30 · 38 · 14; never a W / zigzag, never a hanging chain),
    // each bound to the next by a short ice chain of 3–5 links; frost sprouting off a few links; ice plates underfoot
    const tg = [[[16, 98], 11, 3, 0], [[30, 66], 8.5, 5, 3], [[60, 48], 7, 7, 4], [[98, 70], 9, 9, 4], [[112, 98], 11.5, 11, 3]];
    if (A) tg.push([[80, 108], 8, 13, 3]);
    let bg = '', fg = '';
    // the black spot: frozen ground (bg), its top edge ragged
    bg += `<path d="M-4,104 C14,100 30,108 46,106 C62,104 78,111 96,107 C108,104 120,108 132,104 L132,132 L-4,132 Z" fill="${col}"/>`;
    tg.forEach(([G, r]) => { fg += icePlate(G[0], G[1] + r * 0.95, r * 1.4, 3.2); });
    tg.forEach(([G, r, seed]) => { fg += ghoul(c, G[0], G[1], r, seed); });
    tg.forEach(([G, r, , n], i) => {
      if (!n) return;
      const H = tg[i === 5 ? 4 : i - 1], dg = Math.atan2(G[1] - H[0][1], G[0] - H[0][0]) * 180 / Math.PI;
      fg += iceChain(polar(H[0], dg, H[1] * 0.85), polar(G, dg + 180, r * 0.85), n, i === 3 ? 2 : -1);
    });
    fg += frost([[20, 80, -150, 9], [44, 52, -100, 10], [80, 52, -40, 9], [106, 84, 10, 8]], 361, 1.8);
    return { bg, fg };
  } };

  // ---- beam (§3.1): one straight thing across 80%+ of the window; instant, so no speed strokes ----
  /** A ghoul thrown off a beam: tilted away (dir −1 up / +1 down), a paper tear on the side the beam passed, ink flung
   *  back toward the beam. */
  function tornOff(c, x, y, r, seed, dir, beamDeg) {
    const away = beamDeg + 90 * dir, back = polar([x, y], away + 180, r * 0.95);
    return `<g transform="rotate(${f(dir * 16)} ${f(x)} ${f(y)})">${ghoul(c, x, y, r, seed)}</g>` +
      `<path d="${splashD(back[0], back[1], r * 0.5, 6, seed + 40, 0.45)}" fill="${K.p50}" stroke="${K.ink}" stroke-width="1.5" stroke-linejoin="round"/>` +
      P(blob(...polar(back, away + 180, 4.6), 1.8, 6, 0.5, seed + 41) + blob(...polar(back, away + 160, 7.4), 1.3, 6, 0.5, seed + 42), K.ink);
  }
  DRAW.inkLance = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, deg = -3, at = axis([4, 66], deg), k = A ? 1.2 : 1;
    let bg = '', fg = '';
    // two ghouls the spear passed between, torn and thrown up and down (never skewered); the ink they shed on the ground
    bg += `<g transform="translate(72 112) scale(1 0.28) translate(-72 -112)">${P(blob(72, 112, 34, 10, 0.4, 411), col)}</g>`;
    fg += tornOff(c, 44, 40, 14, 3, -1, deg) + tornOff(c, 82, 92, 14.5, 5, 1, deg);
    if (A) fg += L(ptsD([at(20, 8), at(96, 8)]), K.p300, 2.4);
    // the spear across 94% of the window: an ink shaft 6.4 (a paper rim so it parts from the ghouls), a willow-leaf
    // paper blade with an ink rim and midrib at the right, an ink tassel at the back tied with the cyan band
    fg += L(ptsD([at(10, 0), at(96, 0)]), K.p50, 9.6) + L(ptsD([at(10, 0), at(96, 0)]), K.ink, 6.4);
    const bl = (x0, len, w) => ptsD(smooth([at(x0, 0), at(x0 + len * 0.3, -w), at(x0 + len * 0.7, -w * 0.7), at(x0 + len, 0), at(x0 + len * 0.7, w * 0.7), at(x0 + len * 0.3, w), at(x0, 0)], 5), true);
    fg += `<path d="${ptsD([at(93, -4), at(98, -4.6), at(98, 4.6), at(93, 4)], true)}" fill="${K.ink}"/>` +
      S(bl(97, 26 * k, 6.4 * k), K.p50, 2.4, 1.3) + P(ptsD([at(97 + 26 * k * 0.3, 0.6), at(97 + 26 * k, 0), at(97 + 26 * k * 0.3, 6.4 * k)], true), K.p300) + L(ptsD([at(100, 0), at(97 + 26 * k - 4, 0)]), K.ink3, 1.2);
    // the tassel: a fanned bundle of ink strands swept back from the butt
    [[-9, 22, 4.4], [-4, 26, 5], [1, 25, 4.6], [6, 21, 4.2], [10, 17, 3.4]].forEach(([s, l, w]) => { fg += taperPoly(smooth([at(10, s * 0.3), at(10 - l * 0.5, s * 0.8 + 1), at(10 - l, s * 1.3 + 2)], 3), w, 0.5, K.ink); });
    fg += cyanLine(ptsD([at(10, -5.4), at(10, 5.4)]), 2.6, false) + cyanLine(ptsD([at(14, -4.6), at(14, 4.6)]), 2, false);
    return { bg, fg };
  } };

  DRAW.wideBrush = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, k = A ? 1.2 : 1, y0 = 68 - 20 * k, y1 = 68 + 20 * k;
    let bg = '', fg = '';
    // the main mass: the wide paper band the brush swept across (31–38% of the window high): heavy ink edges broken by
    // dry gaps, dry streaks (비백) running its length, the left end frayed where the stroke began; its leading edge (at
    // the brush) in cyan
    const top = [], bot = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16, x = lerp(6, 92, t), fr = t < 0.12 ? (0.12 - t) * 60 : 0; top.push([x, y0 + 1.4 * Math.sin(i * 1.9) + fr]); bot.push([x, y1 + 1.6 * Math.sin(i * 1.3 + 1) - fr * 0.8]); }
    const band = ptsD(top.concat(bot.reverse()), true);
    fg += `<path d="${band}" fill="${K.p50}" stroke="${K.ink}" stroke-width="5" stroke-linejoin="round"/>`;
    // dry breaks in the edges and the streaks inside
    [[22, y0, 34], [58, y0, 66], [40, y1, 50], [74, y1, 80]].forEach(([x0, y, x1]) => { fg += L(`M${x0},${f(y)} L${x1},${f(y + 0.4)}`, K.p50, 1.6); });
    [[0.2, 8, 72, 2], [0.36, 16, 86, 1.4], [0.52, 4, 64, 2.2], [0.68, 20, 82, 1.4], [0.84, 10, 88, 1.8]].forEach(([t, x0, x1, w], i) => { const y = lerp(y0, y1, t); fg += taperPoly([[x0, y + (i % 2) * 0.6], [x1, y - (i % 2) * 0.4]], 0.3, w, i % 2 ? K.ink5 : K.ink3); });
    // 밀침: two ghouls shoved off ahead of the band (right), one above it, one below
    fg += pushed(c, 114, 47, 9, 3, 1, { ln: col, splash: false }) + pushed(c, 113, 102, 10, 5, 1, { ln: col, splash: false });
    // the big brush (B2 §6.5) leaning into the sweep: the paper handle up to the right, the ferrule, the heavy ink
    // bristles bent back flat along the band's end and drawn to a fine point (an upright brush read as a bottle)
    const ba = axis([94, y0 + 20], -62), BM = (a) => a.map(([t, s]) => ba(t, s));
    fg += S(ptsD(BM([[14, -3.6], [32, -3], [32, 3], [14, 3.6]]), true), K.p50, 2.2, 1) + P(ptsD(BM([[28, -3.1], [32, -3], [32, 3], [28, 3.1]]), true), K.ink) +
      S(ptsD(BM([[4, -6], [15, -5], [15, 5], [4, 6]]), true), K.p50, 2.2, 1) + L(ptsD(BM([[9, -5.6], [9, 5.6]])), K.ink, 1.4) +
      S(ptsD(smooth(BM([[5, -6.4], [-2, -8], [-12, -4], [-22, 6], [-26, 16], [-14, 10], [-4, 7], [5, 6.4]]), 4), true), K.ink, 2, 1.4) +
      L(ptsD(BM([[-2, -4], [-16, 4]])), K.ink5, 1.8);
    // the band's leading edge in cyan, over the bristle tips that lie on it (32 px reading)
    fg += cyanLine(`M${f(92.4)},${f(y0 + 2.4)} L${f(92.8)},${f(y1 - 2.4)}`, 2.6, false);
    return { bg, fg };
  } };

  DRAW.crossStrokes = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, k = A ? 1.2 : 1, C0 = [62, 66];
    let bg = '', fg = '';
    // [angle, distance, r, seed]: four ghouls on directions turned 30° (top and bottom pressed to 0.8 by the 3/4 view),
    // at different distances (30–54) and sizes; each torn across by a short paper brush stroke. Only thin dotted lines
    // join them to the knot (four heavy strokes meeting at the centre read as an '✕' at 20 px)
    const gs = [[-60, 32, 9, 3], [30, 48, 12, 5], [120, 40, 10.5, 7], [210, 52, 11, 9]];
    gs.forEach(([a, d, r]) => { const G = polar(C0, a, d * k); G[1] = C0[1] + (G[1] - C0[1]) * 0.8; fg += L(ptsD([polar(C0, a, 9), polar(G, a + 180, r + 2)].map(([x, y], i) => (i ? [x, y] : [x, C0[1] + (y - C0[1]) * 0.8]))), col, 2, 'stroke-dasharray="3 4"'); });
    gs.forEach(([a, d, r, seed], i) => {
      const G = polar(C0, a, d * k); G[1] = C0[1] + (G[1] - C0[1]) * 0.8;
      const sa = [-14, 10, -8, 16][i];
      // each ghoul torn across like paper (its upper piece lifted), and the stroke that tore it: a thin paper slash along
      // the tear, pressed at one end and tapering out past the body (a wide lens across a body read as a ringed planet,
      // a slash on one side only as a beak)
      fg += tornGhoul(c, G[0], G[1], r, seed, 'x' + i, { deg: sa, open: [2, -4, -10], flicks: false });
      const at = axis(G, sa), o = r * 0.22, sp = [at(-r * 1.5, o + 0.6), at(0, o - 0.4), at(r * 1.6, o)];
      fg += i === 1 ? cyanLine(ptsD(sp), 2.4, false) : taperPoly(sp, 4.6, 1.2, K.ink) + taperPoly(sp, 2.6, 0.3, K.p50);
    });
    fg += knotAt(C0[0], C0[1], 1.3);
    // the black spot: the ink shed by the four torn ghouls on the ground below them
    bg += `<g transform="translate(62 104) scale(1 0.3) translate(-62 -104)">${P(blob(62, 104, 50, 11, 0.4, 371), col)}</g>`;
    return { bg, fg };
  } };

  DRAW.judgmentLine = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, k = A ? 1.2 : 1;
    let bg = '', fg = '';
    // the line: snapped from the carpenter's ink pot at the upper left to the lower right (↘, never upright — a vertical
    // line over a figure reads as a gallows); a trembling afterimage beside it (two awakened), ink flicked off it
    const L0 = [30, 30], L1 = [118, 112], deg = Math.atan2(L1[1] - L0[1], L1[0] - L0[0]) * 180 / Math.PI;
    [3.4].concat(A ? [-3.2] : []).forEach((o) => { fg += L(ptsD([polar(L0, deg + 90, o), polar(L1, deg + 90, o)]), A ? K.p300 : K.ink3, 1.4); });
    fg += L(ptsD([L0, L1]), K.ink, 5.4 * k) + L(ptsD([polar(L0, deg, 8), polar(L1, deg, -4)]), K.ally, 2.4 * k) + L(ptsD([polar(L0, deg, 14), polar(L1, deg, -12)]), K.allyG, 0.6, 'opacity="0.9"');
    [[0.3, -6, 2.2], [0.47, 7, 1.8], [0.66, -7, 2.4], [0.82, 6, 1.6]].forEach(([t, o, r], i) => { const p = polar([lerp(L0[0], L1[0], t), lerp(L0[1], L1[1], t)], deg + 90, o); fg += P(blob(p[0], p[1], r, 6, 0.5, 381 + i), K.ink); });
    // 처형: two ghouls on the line, torn along it like paper
    fg += tornGhoul(c, 57, 55, 13, 3, 'j', { deg, open: [3, -5, -10], flicks: false }) + tornGhoul(c, 91, 85, 14.5, 5, 'k', { deg, open: [4, -6, -12], flicks: false });
    // the ink pot (sumitsubo): a wooden well (paper box, ink rim, ink inside) with the reel beside it, turned to the line.
    // 검수 6차 R5: the reel was a thick ring with a centre dot and three even ticks — a reticle — so it is now a spool seen
    // 3/4 from above (two flanges, the inked line wound on it bulging a little, one strand of it running up into the pot)
    // with a crank handle off the top flange's rim; no centre dot, no ticks
    const spool = `<ellipse cx="0" cy="8" rx="7.4" ry="2.8" fill="${K.p300}" stroke="${K.ink}" stroke-width="2"/>` +
      `<path d="M-4.6,-6 C-6.2,-1.4 -6.2,3.6 -4.6,8 L4.6,8 C6.2,3.6 6.2,-1.4 4.6,-6 Z" fill="${K.ink}"/>` + L('M-3.6,-2.8 C-1.4,-1.6 1.6,2.8 3.6,5.6', K.ink5, 1.6) +
      `<ellipse cx="0" cy="-6" rx="7.4" ry="2.8" fill="${K.p50}" stroke="${K.ink}" stroke-width="2.2"/>` +
      `<path d="M-5.4,-6.8 L-8.8,-9.6" fill="none" stroke="${K.ink}" stroke-width="2.4" stroke-linecap="round"/>` +
      `<path d="M-8.8,-9.6 L-9,-14" fill="none" stroke="${K.ink}" stroke-width="4" stroke-linecap="round"/><path d="M-8.85,-10.6 L-8.95,-13" fill="none" stroke="${K.p50}" stroke-width="1.1" stroke-linecap="round"/>`;
    fg += L('M16.8,39.6 L19.6,28.6', K.ink, 1.4) +
      `<g transform="rotate(${f(deg - 10)} 22 20)">` + S('M8,12 L36,12 L34,28 L10,28 Z', K.p50, 2.4, 1.3) + P('M12,14 L32,14 L31,20 L13,20 Z', K.ink) + P('M10,24 L34,24 L34,28 L10,28 Z', K.p300) + '</g>' +
      `<g transform="translate(12 45) rotate(-8)">${spool}</g>`;
    // the black spot: the ink the line threw off where it struck the ground at the lower right
    bg += `<g transform="translate(104 114) scale(1 0.46) translate(-104 -114)">${P(splashD(104, 114, 32, 9, 391, 0.6), col)}</g>`;
    return { bg, fg };
  } };

  // ---- halo (§3.1): a 3/4 view, FLAT ellipse band (ry 0.42–0.5 rx, rx 34–58), a tangent motion along it, ghouls at its
  // edge ----
  /** Points round an ellipse (cx, cy, rx, ry) from a0 to a1 (deg). */
  const ellP = (cx, cy, rx, ry, a0, a1, n = 48) => { const o = []; for (let i = 0; i <= n; i++) { const a = rad(lerp(a0, a1, i / n)); o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
  /** A flat ring band: outer ellipse (rx, ry) minus the inner one shrunk by w (the band thicker at the front/bottom by
   *  wf), even-odd. */
  function ellBand(cx, cy, rx, ry, w, wf = 1.4) {
    const out = ellP(cx, cy, rx, ry, 0, 360, 64), inn = ellP(cx, cy + w * (wf - 1) * 0.5, rx - w, ry - w * (wf + 1) * 0.5 * 0.5, 0, 360, 64);
    return ptsD(out, true) + ' ' + ptsD(inn.reverse(), true);
  }
  DRAW.inkOrbit = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, k = A ? 1.2 : 1, E0 = [62, 66], rx = 50 * Math.min(k, 1.12), ry = 21 * Math.min(k, 1.12);
    let bg = '', fg = '';
    // the main mass: a thick ink ellipse band (width about a third of rx, heavier at the front), the centre paper
    fg += `<path d="${ellBand(E0[0], E0[1], rx, ry, 17 * k, 1.5)}" fill="${K.ink}" fill-rule="evenodd"/>`;
    // the paper comet stroke riding a quarter turn of it (front right, sweeping to the right), its cyan core
    const cp = ellP(E0[0], E0[1] + 2, rx - 8, ry - 5, 30, 125, 20).reverse();
    fg += taperFn(cp, (t) => 1 + 7 * Math.pow(t, 0.8), K.p50) + cyanLine(ptsD(cp.slice(8)), 2.4, false);
    // ghouls at the band's edge, at different heights and sizes (two on top read as ears on a face): one at the lower
    // left, one at the right end being shaved, its chip flung off along the turn
    fg += ghoul(c, 16, 92, 10, 3) + ghoul(c, 112, 58, 9, 5);
    fg += P(blob(118, 80, 3.6, 6, 0.5, 401) + blob(123, 90, 2.4, 6, 0.5, 402), K.ink) + speed([112, 74], [124, 94], 2, col);
    return { bg, fg };
  } };

  /** 수호 고리: a twisted rope ring — paper with ink twist strokes along an ellipse, bound in places. 검수 6차 R4: twist
   *  marks every 12° as straight bars read as a ladder / hatched ring, so the spacing now wanders ±30% (seeded), each
   *  twist is an S stroke swelling in its middle, and the rope runs bare for a little on both sides of each binding
   *  (binds: the binding angles, deg). */
  function ropeRing(cx, cy, rx, ry, w, binds = [], seed = 421) {
    let s = `<path d="${ellBand(cx, cy, rx + w / 2, ry + w / 2, w, 1.3)}" fill="${K.p50}" fill-rule="evenodd" stroke="${K.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
    const R = rng(seed), E = (a, kx, ky) => [cx + Math.cos(rad(a)) * (rx + w * kx), cy + Math.sin(rad(a)) * (ry + w * ky)];
    for (let a = 4 * R(); a < 356; a += 12 * (0.7 + 0.6 * R())) {
      if (binds.some((b) => Math.abs(((a + 4 - b) % 360 + 540) % 360 - 180) < 13)) continue;
      // inner edge → outer edge, leaving and arriving along the turn so the stroke bends like an S
      const p = smooth([E(a, -0.38, -0.3), E(a + 3.4, -0.14, -0.11), E(a + 4.6, 0.18, 0.14), E(a + 8, 0.42, 0.35)], 4);
      s += taperFn(p, (t) => 0.7 + 2.3 * Math.sin(Math.PI * t), K.ink);
    }
    return s;
  }
  DRAW.wardRing = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, k = A ? 1.2 : 1, E0 = [62, 68], rx = 36 * k, ry = 16 * k;
    let bg = '', fg = '';
    // 밀침: three ghouls that came close bounced outward off the rope, at different places and sizes
    fg += pushed(c, 16, 52, 9.5, 3, -1, { ln: col }) + pushed(c, 110, 50, 8.5, 5, 1, { ln: col }) + pushed(c, 96, 102, 10.5, 7, 1, { ln: col });
    // the main mass: a thick twisted rope ring (paper and ink twists, about 12 thick) round the 結 knot, bound in three
    // places; the cyan stitching along a third of it (never the whole ring: a cyan ring on the ground is the hero's)
    fg += ropeRing(E0[0], E0[1], rx, ry, 12, [150, 262, 20]);
    [[150, 0], [262, 1], [20, 2]].forEach(([a]) => { const p = [E0[0] + Math.cos(rad(a)) * rx, E0[1] + Math.sin(rad(a)) * ry]; fg += `<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="4.6" ry="8.2" transform="rotate(${f(a + 90)} ${f(p[0])} ${f(p[1])})" fill="${K.ink}"/>`; });
    const st = ellP(E0[0], E0[1], rx, ry, 40, 140, 24);
    fg += L(ptsD(st), K.ink, 4.8, 'stroke-dasharray="5 3"') + L(ptsD(st), K.ally, 2.4, 'stroke-dasharray="5 3"');
    fg += knotAt(E0[0], E0[1], 1.3);
    // the black spot: the rope's shadow under it
    bg += `<ellipse cx="${E0[0] + 3}" cy="${E0[1] + ry + 9}" rx="${f(rx + 8)}" ry="${f(6 * k)}" fill="${col}"/>`;
    return { bg, fg };
  } };

  DRAW.eclipseHalo = { draw(c, A) {
    const col = A ? K.ink7 : K.ink, k = A ? 1.12 : 1, E0 = [64, 70], rx = 52 * k, ry = 22 * k;
    let bg = '', fg = '';
    // the black spot: the ink crescent shadow just behind the rim on its right quarter — thick in the middle, drawn to two
    // points (awakened: a thin one on the left too)
    const cres = (sg, w) => {
      const a0 = sg > 0 ? -72 : 108, a1 = sg > 0 ? 72 : 252, o = ellP(E0[0], E0[1], rx + 3, ry + 3, a0, a1, 28);
      const i2 = []; for (let i = 28; i >= 0; i--) { const t = i / 28, a = rad(lerp(a0, a1, t)), sw = w * Math.sin(Math.PI * t); i2.push([E0[0] + Math.cos(a) * (rx + 3 - sw * 1.1), E0[1] + Math.sin(a) * (ry + 3 - sw * 0.45)]); }
      return `<g transform="rotate(-8 ${E0[0]} ${E0[1]})">${P(ptsD(o.concat(i2), true), K.ink)}</g>`;
    };
    fg += cres(1, 44) + (A ? cres(-1, 9) : '');
    // the rim: a wide thin hollow ellipse — paper 1.8 inside an ink outline 3.6 — tilted a little (never an upright
    // circle or a halo over a head; nothing at its centre)
    const rim = ptsD(ellP(E0[0], E0[1], rx, ry, 0, 360, 72), true);
    fg += `<g transform="rotate(-8 ${E0[0]} ${E0[1]})"><path d="${rim}" fill="none" stroke="${K.ink}" stroke-width="5.4"/><path d="${rim}" fill="none" stroke="${K.p50}" stroke-width="1.8"/></g>`;
    // two ghouls caught on the rim's outer band (clear of the crescent)
    fg += ghoul(c, 22, 87, 11, 3) + ghoul(c, 82, 46, 9.5, 5);
    // the two cyan ribbons flying off the rim's left side: flat ribbons twisting (their width swelling and pinching)
    const r1 = smooth([[16, 66], [8, 56], [13, 46], [7, 36], [12, 26]], 5), r2 = smooth([[19, 70], [28, 62], [26, 52], [34, 44]], 5);
    const tw = (w0, n) => (t) => 0.8 + w0 * Math.abs(Math.cos(t * Math.PI * n)) * (1 - 0.4 * t);
    fg += taperFn(r1, (t) => tw(5.4, 2.2)(t) + 2.6, K.ink) + taperFn(r1, tw(5.4, 2.2), K.ally) + taperFn(r2, (t) => tw(4.6, 1.6)(t) + 2.6, K.ink) + taperFn(r2, tw(4.6, 1.6), K.ally);
    return { bg, fg };
  } };

  // ==== 4. lending the k-icons frame (brief §1.3) ====
  function defOf(id) {
    const m = META[id];
    if (!m) throw new Error(`unknown arsenal id ${id}`);
    const d = DRAW[id];
    if (d) return { rarity: m.rarity, kind: 'active', name: m.name, draw: d.draw, halo: d.halo };
    const core = KI.ICON[m.look];   // not drawn yet: the look's core icon, read only
    return { rarity: m.rarity, kind: 'active', name: m.name, draw: (c, A) => core.draw(c, A), halo: core.halo };
  }
  function borrow(id, fn) {
    const ICON = KI.ICON, def = defOf(id);
    if (Object.prototype.hasOwnProperty.call(ICON, id)) throw new Error(`${id} clashes with a core icon`);
    ICON[id] = def;
    try { return fn(); } finally { delete ICON[id]; }
  }
  const skill = (id, o = {}) => borrow(id, () => PN.icons.skill(id, o));
  const tile = (id, o = {}) => borrow(id, () => PN.icons.tile(id, o));
  const hudSlot = (id, o = {}) => borrow(id, () => {
    const core = PN.icons.skill;   // the awakened slot shows the awakened icon (as build-ui-art.mjs does)
    if (o.awakened) PN.icons.skill = (i, opts) => core(i, Object.assign({}, opts, { awakened: true }));
    try { return PN.icons.hudSlot(id, o); } finally { PN.icons.skill = core; }
  });

  // ==== 5. shots: parts + stamps (K4 contract, brief §4) ====
  // box / anchor by hit radius (brief §4.2); every painted shape stays 3 inside the box
  const BOX = { 3.5: [[40, 18], [31, 9]], 4: [[46, 20], [35, 10]], 4.5: [[50, 20], [39, 10]], 5: [[54, 22], [43, 11]], 5.5: [[60, 22], [47, 11]], 6: [[64, 24], [51, 12]] };
  const PART_ROWS = [
    ['start', 'prog', 0, '나이 0~0.06초'],
    ['travel', 'loop', 12, '비행 중'],
    ['end', 'prog', 0, '남은 수명 0.10→0초(수명이 다할 때만)'],
    ['start-awakened', 'prog', 0, '나이 0~0.06초'],
    ['travel-awakened', 'loop', 12, '비행 중'],
    ['end-awakened', 'prog', 0, '남은 수명 0.10→0초(수명이 다할 때만)']
  ];
  function partsOf(id) {
    const m = META[id];
    if (!m) throw new Error(`unknown arsenal id ${id}`);
    if (!m.shot) throw new Error(`${id} fires no projectile (kind ${m.kind})`);
    const [box, anchor] = BOX[m.r];
    return PART_ROWS.map(([part, drive, fps, win]) => ({
      part, frames: 2, drive, fps, window: win, box: box.slice(), anchor: anchor.slice(),
      rotate: 'vel', layer: 'ally', lod: 'info', still: drive === 'loop' ? 0 : null, flash: false, scale: 1
    }));
  }
  // per-call context for stamps and review helpers (a copy of the k-icons ctx without filters; prefix 'kar<N>_')
  let N = 0;
  function ctx(tag) {
    const p = 'kar' + (N++) + (tag || '') + '_', defs = [];
    const c = {
      p, defs,
      id: (n) => p + n,
      add: (s) => { defs.push(s); return c; },
      clip(n, d, tr) { const id = p + n; defs.push(`<clipPath id="${id}"><path d="${d}"${tr ? ` transform="${tr}"` : ''}/></clipPath>`); return `url(#${id})`; },
      out: (body, cls) => `<g class="kar kar-${cls}"><defs>${defs.join('')}</defs>${body}</g>`
    };
    return c;
  }
  // shot art: SHOT[id](part, frame, c, r) → markup around the anchor (0,0), +x = velocity
  const SHOT = {};

  // ---- shot helpers: world units, anchor (0,0) = the hit circle's centre, +x = velocity ----
  const SW = (d, layers, extra = '') => layers.map(([col, w]) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`).join('');
  const FP = (d, fill, line, lw = 1.5, extra = '') => `<path d="${d}" fill="${fill}"${line ? ` stroke="${line}" stroke-width="${f(lw)}" stroke-linejoin="round"` : ''}${extra}/>`;
  const taper = (p0, p1, w0, w1, col) => taperPoly([p0, p1], w0, w1, col);
  /** Frames and the awakened extras every shot shares (brief §4.3). art(o) → {art, outline, lw, front}.
   *  o: aw, fr, base (start | travel | end), tail (0.3 / 0.7 at start, ×1.25 awakened), ph (travel wobble), end (1 =
   *  drooping, cyan → allyD; 2 = faded: body p300, outline ink300, group α 0.6), ln / body / dark / cy colours. */
  function shot(art) {
    return (part, fr, c, r) => {
      const aw = /-awakened$/.test(part), base = part.replace(/-awakened$/, '');
      const o = { c, aw, fr, base, tail: (base === 'start' ? (fr ? 0.7 : 0.3) : 1) * (aw ? 1.25 : 1), ph: base === 'travel' ? fr : 0, end: base === 'end' ? fr + 1 : 0 };
      o.ln = o.end === 2 ? K.ink3 : K.ink; o.body = o.end === 2 ? K.p300 : K.p50; o.dark = o.end === 2 ? K.ink5 : K.ink; o.cy = o.end ? K.allyD : K.ally;
      const g = art(o);
      let s = '';
      if (aw) {
        // double rim (paper 1.0 + ink 0.8) round a copy of the body outline moved 3 back (검수 1차 R5): it follows the body's
        // own shape to its end and stops 0.45 short of the point, so the front does not grow. A vertical clip 3 behind the
        // point had left the rim cut flat across the blade and seal heads.
        const rim = SW(g.outline, [[o.end === 2 ? K.ink3 : K.ink, g.lw + 3.6], [K.p50, g.lw + 2]]);
        s += `<g transform="translate(-3,0)">${g.tr ? `<g transform="${g.tr}">${rim}</g>` : rim}</g>`;
      }
      s += g.art;
      if (aw && base === 'travel' && fr === 0) s += FP(splashD(g.front - 2.6, -Math.min(r * 0.86, r - 0.2), 2.5, 6, 23 + Math.round(r * 2), 0.42), K.p50, K.ink, 0.6);
      return o.end === 2 ? `<g opacity="0.6">${s}</g>` : s;
    };
  }

  // 먹침 r 4: short thick dart, front +5.5 … back −7.5; ink wedge on the front 30% only (+1.6…+5.5, ragged dip line;
  // 검수 1차 F3 — at 45% the body read dark at 1x), paper body half 2.4; tail = two paper vanes (−4.4…−9.2, reach 4.6;
  // the upper one cyan, ink rim) + one ink.300 speed stroke (−10…−18). No thread.
  SHOT.inkDarts = shot((o) => {
    const k = Math.min(1, o.tail), t = o.tail, sag = o.end ? 0.6 * o.end : 0;
    const body = 'M-7.5,-2 C-8.1,-1 -8.1,1 -7.5,2 L1.2,2.4 L1.6,3.2 C2.8,2.4 4.1,1.25 5.5,0 C4.1,-1.25 2.8,-2.4 1.6,-3.2 L1.2,-2.4 Z';
    const wedge = 'M1.6,-3.2 C2.8,-2.4 4.1,-1.25 5.5,0 C4.1,1.25 2.8,2.4 1.6,3.2 L1.3,2.4 L1.1,1.5 L1.6,0.7 L1.1,-0.2 L1.5,-1.3 L1.3,-2.4 Z';
    // the vanes reach 4.6 (was 3.6): the wider paper body (half 2–2.4 + outline) had swallowed all but a sliver of them,
    // and of the cyan one with them
    const vane = (sg) => `M-4.4,${f(sg * 2)} L${f(-6.6 - 0.9 * k)},${f(sg * (2 + 2.6 * k) + sag)} L${f(-5.2 - 4 * k)},${f(sg * (2 + 2.4 * k) + sag)} L-7.6,${f(sg * 2 + sag * 0.3)} Z`;
    const sl = 8 * t * (o.ph ? 1.35 : 1);
    const art = taper([-10, 0.4], [-10 - sl, 0.5 + sag * 2], 1.3, 0.2, K.ink3) +
      FP(vane(1), o.body, o.ln, 0.8) + FP(vane(-1), o.cy, K.ink, 0.8) +
      FP(body, o.body, o.ln, 1.5) + FP('M-7,0.9 L1,1.2 L1,2.2 L-7.2,1.8 Z', K.p300) + FP(wedge, o.dark) + L('M2.1,-1.7 L4.6,-0.45', K.p300, 1.1);
    return { art, outline: body, lw: 1.5, front: 5.5 };
  });

  // 붓깃 r 5: quill pen +6 … −12; vane wide on the top only (4.6 / 1.6), ink nib (front 4); the cyan dot (r 1.3, ink
  // rim) on the nib's point; tail = the vane's end split into two fibres (−12…−18).
  SHOT.brushQuills = shot((o) => {
    const t = o.tail, w = o.ph ? 0.45 : -0.35, sag = o.end ? 0.7 * o.end : 0;
    const vane = 'M-12,-0.7 C-10.5,-2.7 -8,-4.3 -5,-4.6 C-2.6,-4.6 -1.2,-3.4 -0.4,-0.7 L-0.4,0.7 C-2,1.3 -4.5,1.6 -8,1.6 C-10,1.5 -11.4,1.1 -12,0.7 Z';
    const lower = 'M-11.6,0.5 C-9,0.9 -5,0.9 -0.6,0.55 L-0.6,0.7 C-2,1.3 -4.5,1.6 -8,1.6 C-10,1.5 -11.2,1.05 -11.6,0.5 Z';
    const nib = 'M1.8,-1.15 C3.4,-1 4.8,-0.6 6,0 C4.8,0.6 3.4,1 1.8,1.15 Z';
    const fibres = `M-12,-0.45 Q${f(-12 - 3 * t)},${f(-1 + w)} ${f(-12 - 6 * t)},${f(-1.6 + w + sag)} M-12,0.35 Q${f(-12 - 2.4 * t)},${f(0.8 - w)} ${f(-12 - 4.6 * t)},${f(1.3 - w + sag)}`;
    const art = SW(fibres, [[K.ink3, 1.5], [o.body, 0.6]]) + FP(vane, o.body, o.ln, 1.5) + FP(lower, K.p300) +
      L(`M-8.6,-0.5 L${f(-10.2 + w)},-3.1 M-4.6,-0.5 L${f(-6 + w)},-3.9`, K.ink3, 0.7) +
      FP('M-0.6,-0.95 L2,-0.95 L2,0.95 L-0.6,0.95 Z', o.body, o.ln, 1) + L('M-13,0.1 L1.8,0', o.ln, 0.8) +
      FP(nib, o.dark) + L('M3,0 L4.6,0', K.p50, 0.4) + `<circle cx="4.9" cy="0" r="1.3" fill="${o.cy}" stroke="${K.ink}" stroke-width="0.6"/>`;
    return { art, outline: 'M-12,-0.7 C-10.5,-2.7 -8,-4.3 -5,-4.6 C-2.6,-4.6 -1.2,-3.4 -0.4,-0.95 L1.8,-1.15 C3.4,-1 4.8,-0.6 6,0 C4.8,0.6 3.4,1 1.8,1.15 L-0.4,0.95 C-2,1.3 -4.5,1.6 -8,1.6 C-10,1.5 -11.4,1.1 -12,0.7 Z', lw: 1.5, front: 6.2 };
  });

  // 인장 화살 r 6: the longest and thickest — seal-body head (−1.5…+7.5, half 3.8: paper, ink face, cyan line on the
  // face, a groove, no glyph) + shaft ink 2.4 with a paper core 0.9 (to −16) + two paper vanes (−13…−20); tail = two
  // speed strokes (−22…−40).
  SHOT.sealArrows = shot((o) => {
    const t = o.tail, fl = o.ph ? 0.55 : -0.45, sag = o.end ? 0.8 * o.end : 0;
    const vane = (sg) => `M-13,${f(sg * 1.2)} L${f(-16.4)},${f(sg * (3.7 + (sg > 0 ? -fl : fl)) + sag)} L-20,${f(sg * (3.4 + (sg > 0 ? -fl : fl)) + sag)} L-17.6,${f(sg * 1.2)} Z`;
    // 검수 1차 R4: the head is a stamp body, longer than tall (−1.5…+7.5, half 3.8) — 6 long × 9 tall flew like a mallet
    // when it turned upright — and the shaft carries a paper core (ink 2.4 + paper 0.9)
    const art = taper([-22, -1.4], [-22 - 18 * t, -2.4 + sag], 1.2, 0.2, K.ink3) + taper([-24, 1.5], [-24 - 12 * t, 2.4 + sag * 1.4], 1, 0.2, K.ink3) +
      FP(vane(1), o.body, o.ln, 0.9) + FP(vane(-1), o.body, o.ln, 0.9) + SW('M-16,0 L-1.5,0', [[o.dark, 2.4], [o.body, 0.9]]) +
      FP('M-1.5,-3.8 L6.3,-3.8 L6.3,3.8 L-1.5,3.8 Z', o.body, o.ln, 1.5) + FP('M-1.5,1.4 L6.3,1.4 L6.3,3.8 L-1.5,3.8 Z', K.p300) +
      L('M0.8,-3.8 L0.8,3.8', o.ln, 0.6) + FP('M6.3,-3.8 L7.1,-3.6 L7.5,-3 L7.5,3 L7.1,3.6 L6.3,3.8 Z', o.dark, o.ln, 0.6) +
      SW('M6.9,-2.6 L6.9,2.6', [[K.ink, 1.7], [o.cy, 0.9]]);
    return { art, outline: 'M-16,-1.2 L-1.5,-1.2 L-1.5,-3.8 L7.5,-3.8 L7.5,3.8 L-1.5,3.8 L-1.5,1.2 L-16,1.2 Z', lw: 1.5, front: 7.5 };
  });

  /** A plain paper needle +6 … −10 (half 2.2) with an eye; tip = the front 4 (cyan for 서리침, ink for 뇌침). */
  const NEEDLE_D = 'M-10,-1.5 C-10.7,-1.45 -10.7,1.45 -10,1.5 L-4,2.2 L2,1.4 L6,0 L2,-1.4 L-4,-2.2 Z';
  const needleShot = (o, tipFill) => FP(NEEDLE_D, o.body, o.ln, 1.5) + FP('M-4,1.1 L2,0.7 L2,1.4 L-4,2.2 Z', K.p300) +
    `<ellipse cx="-8" cy="0" rx="1.15" ry="0.42" fill="${o.ln}"/>` + FP('M2,-1.4 L6,0 L2,1.4 C2.5,0.5 2.5,-0.5 2,-1.4 Z', tipFill, K.ink, 0.6);

  // 서리침 r 4.5: paper needle with a cyan point (ink rim), no thread; tail = three paper ice chips (−12…−28, y ±3)
  SHOT.frostNeedles = shot((o) => {
    const t = o.tail, sag = o.end ? 0.9 * o.end : 0;
    const chips = (o.ph ? [[-14.5, 1.3, 2.2, 0], [-20, -2.1, 1.7, 1], [-26.5, 0.9, 2.5, 0]] : [[-12.8, -1.6, 2.3, 0], [-19, 1.9, 1.8, 1], [-25, -0.7, 2.6, 0]]).slice(0, t < 0.5 ? 1 : t < 0.9 ? 2 : 3);
    let art = '';
    chips.forEach(([x, y, s, sq], i) => {
      const cx = -10 + (x + 10) * Math.min(1.25, Math.max(0.6, t)), cy = y + sag * (i + 1) * 0.5;
      const d = sq ? `M${f(cx - s * 0.5)},${f(cy - s * 0.45)} L${f(cx + s * 0.55)},${f(cy - s * 0.5)} L${f(cx + s * 0.45)},${f(cy + s * 0.5)} L${f(cx - s * 0.5)},${f(cy + s * 0.4)} Z`
        : `M${f(cx - s * 0.6)},${f(cy + s * 0.45)} L${f(cx + s * 0.1)},${f(cy - s * 0.6)} L${f(cx + s * 0.6)},${f(cy + s * 0.35)} Z`;
      art += FP(d, o.body, o.ln, 0.6);
    });
    art += needleShot(o, o.cy);
    return { art, outline: NEEDLE_D, lw: 1.5, front: 6 };
  });

  // 뇌침 r 4.5: paper needle + a jagged bolt wound round its body (4–5 bends, ink 1.6 / cyan 1.0 / paper 0.4, y ±3.5,
  // x −16…+2); no tail; the bends jump between the two frames (the flicker)
  SHOT.thunderNeedles = shot((o) => {
    // uneven steps and reach (segments 4…7.6 long), so it never settles into a regular ^^^
    const P0 = o.ph ? [[-16, -0.3], [-12.2, 2.9], [-10.8, -1.6], [-6, 3.3], [-4.6, -2.8], [0.2, 1.4], [2, 0]] : [[-16, 0.4], [-14.6, -3.3], [-10.4, 1.8], [-9.4, -2.4], [-4.4, 3.2], [-2.6, -1.4], [2, 0]];
    const pts = o.base === 'start' ? P0.slice(Math.max(0, P0.length - 2 - Math.round(o.tail * 4))) : o.end ? P0.map(([x, y], i) => [x, y * (o.end === 1 ? 0.7 : 0.45) + (i % 2 ? 0.3 : 0)]) : P0;
    const d = ptsD(pts), miter = ' stroke-linejoin="miter" stroke-miterlimit="6"';
    const bolt = [[o.ln, 1.6], [o.cy, 1], [K.p50, 0.4]].map(([col, w]) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${miter}/>`).join('');
    return { art: needleShot(o, o.dark) + bolt, outline: NEEDLE_D, lw: 1.5, front: 6 };
  });

  // 쌍날 r 6: crescent blade (diameter 13, +6.5…−6.5; paper, ink back 0.9 along the inner edge, cyan edge line) that
  // turns 90° between the travel frames; tail = one spin arc (paper 1.0 + ink.300 0.6, radius 8, back to −15)
  SHOT.twinBlades = shot((o) => {
    // quarter turns only: a rotated group is measured by its turned local box, so 45° would push the front to 9.2
    const rot = o.base === 'end' ? (o.fr ? 180 : 270) : (o.fr ? 270 : 180), g = crescentD(6.5, 0.6, 0.86);
    // the spin arc leaves the blade's lower edge and curls back under it to −15, thinning (attached, so no '( )')
    const sweep = 160 * Math.min(1, o.tail), a0 = 30, cx = -7, cy = 0.3 + (o.end ? 0.25 * o.end : 0);
    // filled taper: its half width counts in the measured side, so the arc is flattened to ry 6.2 (side ≤ r + 2.5)
    const arcP = []; for (let i = 0; i <= 14; i++) { const a = rad(a0 + sweep * i / 14); arcP.push([cx + Math.cos(a) * 8, cy + Math.sin(a) * 6.2]); }
    const er = 4.9, ea = (a) => q([Math.cos(rad(a)) * er, Math.sin(rad(a)) * er]);
    // ink back 0.9 along the concave edge: an arc of the inner circle pushed 0.45 into the blade (inside the outline,
    // so it never widens the measured shape the way a clipped circle would)
    const ri = g.R2 + 0.45, xi = (6.5 * 6.5 - ri * ri + g.cx2 * g.cx2) / (2 * g.cx2), yi = Math.sqrt(Math.max(0, 6.5 * 6.5 - xi * xi));
    const blade = FP(g.d, o.body, o.ln, 1.5) + `<path d="M${f(xi)},${f(-yi)} A${f(ri)},${f(ri)} 0 0 0 ${f(xi)},${f(yi)}" fill="none" stroke="${o.dark}" stroke-width="0.9"/>` +
      SW(`M${ea(150)} A${er},${er} 0 0 0 ${ea(210)}`, [[K.ink, 1.6], [o.cy, 0.8]]);
    const art = taperPoly(arcP, 2.4, 0.5, K.ink3) + taperPoly(arcP, 1.1, 0.2, o.body) + `<g transform="rotate(${rot})">${blade}</g>`;
    return { art, outline: g.d, tr: `rotate(${rot})`, lw: 1.5, front: 6.5 };
  });

  // 혼령 일제사격 r 5: hollow willow-leaf arrow (ink.300 1.4 over paper α 0.6) + shaft to −10 drawn as a paper line 0.9
  // in an ink.300 edge 2.2 (a bare ink.300 1.2 line left the flame outweighing the paper body); tail = the cyan
  // two-tongued flame fletching (ink rim, −10…−22), its tongues lick between the frames
  SHOT.ghostVolley = shot((o) => {
    const t = o.tail, k = (x) => -10 + (x + 10) * t, sag = o.end ? 0.8 * o.end : 0, lk = o.ph ? 0.9 : -0.7;
    const head = 'M-1.2,-1.6 C1.4,-2.6 4.2,-1.9 6.5,0 C4.2,1.9 1.4,2.6 -1.2,1.6 C-1.8,0.8 -1.8,-0.8 -1.2,-1.6 Z';
    // two uneven, wavering tongues (a long one curling up, a short one curling down), never a straight '<'
    const flame = `M-9,-0.7 C${f(k(-11.5))},-1.9 ${f(k(-13))},${f(-0.6 + lk * 0.4)} ${f(k(-15.5))},${f(-1.9 + lk * 0.3)} C${f(k(-17.5))},${f(-3 + lk * 0.5)} ${f(k(-19))},${f(-2 + lk + sag)} ${f(k(-21.5))},${f(-3.1 + lk + sag)} ` +
      `C${f(k(-19))},${f(-0.9 + sag * 0.5)} ${f(k(-16.5))},-0.2 ${f(k(-14))},0.3 C${f(k(-15.5))},${f(1.3 - lk * 0.3)} ${f(k(-16.5))},${f(2.4 - lk * 0.4 + sag)} ${f(k(-17.6))},${f(2.1 - lk * 0.5 + sag)} C${f(k(-14))},2 ${f(k(-11.5))},1.4 -9,0.7 Z`;
    const art = FP(flame, o.cy, K.ink, 0.7) + L(`M-9.6,-0.3 L${f(k(-14.5))},${f(-1.3 + lk * 0.3)}`, K.allyG, 0.5, 'opacity="0.9"') +
      SW('M-10,0 L-1,0', [[K.ink3, 2.2], [K.p50, 0.9]]) + FP(head, K.p50, K.ink3, 1.4, ' fill-opacity="0.6"') + L('M0.4,0 L4.6,0', K.ink3, 0.5);
    return { art, outline: 'M-10,-0.8 L-1.2,-0.8 L-1.2,-1.6 C1.4,-2.6 4.2,-1.9 6.5,0 C4.2,1.9 1.4,2.6 -1.2,1.6 L-1.2,0.8 L-10,0.8 Z', lw: 1.4, front: 6.5 };
  });

  // 망나니 침 r 4.5: single-edged blade head (front +6, up 5.2 / down 2.5: paper blade, an ink spine band ~1.2) + shaft
  // ink 1.7 with a paper core 0.6 (to −12); tail = one speed stroke (−14…−22); cyan = the edge line
  SHOT.headsmanDarts = shot((o) => {
    const t = o.tail, sag = o.end ? 0.7 * o.end : 0;
    // a forward point where the spine meets the belly (a rounded front read as a 'D' / 'P' at 1x)
    const blade = 'M-2,-4.6 L2.8,-5.2 L6,-3.4 C5.3,-0.6 3.9,1.6 1.6,2.5 L-2,2.2 Z';
    // ink back = a spine band ~1.2 thick (검수 1차 F3: the 40% back read dark at 1x; same grammar as the icon, F1)
    const art = taper([-14, 0.2], [-14 - 8 * t * (o.ph ? 1.3 : 1), 0.5 + sag * 2], 1.3, 0.2, K.ink3) + SW('M-12,0 L-2,0', [[o.dark, 1.7], [o.body, 0.6]]) +
      FP(blade, o.body, o.ln, 1.5) + FP('M-2,-4.6 L2.8,-5.2 L6,-3.4 L5.2,-2.9 L2.6,-3.9 L-2,-3.3 Z', o.dark) + FP('M-2,0.6 L3.4,0.4 C2.8,1.3 2.2,1.8 1.6,2.1 L-2,1.9 Z', K.p300) +
      SW('M5,-2.1 C4.4,-0.2 3.3,1 1.6,1.7', [[K.ink, 1.7], [o.cy, 0.9]]);
    return { art, outline: blade, lw: 1.5, front: 6 };
  });

  // ---- delivery 2: the shots of burst · spray · rear · seeker ----
  // (turns are baked into the points with rotP: a rotated group is measured by its turned local box in C7)

  // 종이 폭풍 r 5: a folded paper blade (an uneven triangle +6.5 … −5.5, half 4.5) whose fold is the cyan line; the travel
  // frames show it flipped (the shaded flap changes sides, paper ↔ p300); tail = 1–2 paper crumbs (−8 … −16)
  SHOT.paperStorm = shot((o) => {
    const t = o.tail, sag = o.end ? 0.7 * o.end : 0, fl = o.ph === 1, k = clamp(t, 0.6, 1.25);
    const A0 = [6.5, fl ? -0.4 : 0.4], B0 = fl ? [-4.3, -4.3] : [-5.5, -4.5], C0 = fl ? [-5.5, 4.5] : [-4.2, 4.3], M0 = [-5, fl ? 0.6 : -0.6];
    const tri = polyD([A0, B0, C0]), flap = polyD(fl ? [A0, B0, M0] : [A0, M0, C0]);
    const cr = (fl ? [[-10, -1.8, 1.9], [-14.5, 1.2, 1.3]] : [[-9.5, 1.6, 1.8], [-14, -1.4, 1.4]]).slice(0, t < 0.5 ? 1 : 2);
    let art = '';
    cr.forEach(([x, y, s], i) => {
      const cx = -6 + (x + 6) * k, cy = y + sag * (i + 1) * 0.6;
      art += FP(polyD([[cx - s * 0.6, cy - s * 0.4], [cx + s * 0.5, cy - s * 0.55], [cx + s * 0.6, cy + s * 0.3], [cx - s * 0.3, cy + s * 0.55]]), o.body, o.ln, 0.6);
    });
    art += FP(tri, o.body, o.ln, 1.5) + FP(flap, K.p300) + SW(`M${f(A0[0] - 1.8)},${f(A0[1] * 0.8)} L${f(M0[0] + 0.9)},${f(M0[1])}`, [[K.ink, 1.7], [o.cy, 0.9]]);
    return { art, outline: tri, lw: 1.5, front: 6.5 };
  });

  // 먹꽃 r 4.5 (검수 4차 M3): a leaf-shaped petal with a split base — widest at x +1 (half 3.6 above, 3.3 below), its sides
  // drawn in toward a narrow base (half 1.0 at −8.5) where a V notch 1.3 deep splits it, pointed front +6 (14.5 long, at
  // least twice as long as wide, §4.3); paper with ink on the front 19% only (C9 ink 62%) and one ink.500 light stroke,
  // the cyan vein down the middle line; one ink drop hangs UNDER it on a short ink thread pulled back from its underside
  // (thread from x −2.6 … −4.4, drop centre x −4.4 … −5.8, y +4.4 … +5.0). (The round-backed petal with drops trailing
  // behind was the 먹 이슬비 drop at 1x — same look, so the two must differ; two drops under it read as legs, a
  // straight-down thread as a lollipop stick.) The travel frames move the drop, the start frames lower it, the end
  // frames stretch it.
  SHOT.inkBloom = shot((o) => {
    const t = o.tail, sag = o.end ? 0.35 * o.end : 0;
    const petal = 'M6,0 C4.6,-1.9 2.9,-3.6 1,-3.6 C-2.8,-3.6 -5.4,-1.7 -8.5,-1 L-7.2,0 L-8.5,1 C-5.4,1.6 -2.8,3.3 1,3.3 C2.9,3.3 4.6,1.8 6,0 Z';
    const inkF = 'M6,0 C5.2,-1.2 4.4,-2.2 3.3,-2.9 C3.7,-1.9 3.1,-1.1 3.6,-0.2 C3.1,0.7 3.8,1.7 3.3,2.65 C4.4,2.2 5.2,1.1 6,0 Z';
    // [thread top x, its y (the underside there), drop centre x, y, h, w]
    const [x0, y0, x, y, h, w] = o.ph ? [-4.4, 2.1, -5.8, 4.4, 2.2, 0.95] : [-2.6, 2.9, -4.4, 4.4 + 0.6 * Math.min(1, t), 2.4, 1.05];
    let art = L(`M${f(x0)},${f(y0)} Q${f(x0 - 0.3)},${f(y - h * 0.3 + sag)} ${f(x)},${f(y - h * 0.4 + sag)}`, o.dark, 0.75) + FP(dropD(x, y + sag, h + sag * 0.3, w), o.dark);
    art += FP(petal, o.body, o.ln, 1.5) + FP(inkF, o.dark) + L('M4.2,-1.25 L5.3,-0.55', K.ink5, 0.7) + SW('M-6.4,0.05 Q-3.6,0.2 -0.6,-0.25', [[K.ink, 1.3], [o.cy, 0.75]]);
    return { art, outline: petal, lw: 1.5, front: 6 };
  });

  // 가시 테 r 4: a curved rose thorn (wide base −5.6, sharp tip +5.8 hooking up, half 3.9 / 3.6): paper with a narrow ink
  // base band at the back (the brief's 35% ink base put this smallest shot at ink 82% in C9) and the cyan band just in
  // front of it; no tail (short range); the travel frames tilt it ±6°
  SHOT.thornHalo = shot((o) => {
    const a = o.base === 'travel' ? (o.ph ? -6 : 6) : o.end ? 4 * o.end : 0;
    const top = bez([-5.6, -3.9], [-1.6, -2.2], [2.6, -2], [5.8, -2.4], 8), bot = bez([5.8, -2.4], [3.2, 0.5], [-0.8, 2.8], [-5.6, 3.6], 8);
    const body = polyD(rotP(top.concat(bot.slice(1)), a));
    const base = rotP([[-5.6, -3.9], [-4.9, -3.6], [-4.9, 3.45], [-5.6, 3.6]], a);
    const art = FP(body, o.body, o.ln, 1.4) + FP(polyD(base), o.dark) + FP(polyD(rotP([[-4.6, 0.9], [1.4, 0.7], [-0.8, 2.75], [-4.6, 3.35]], a)), K.p300) +
      SW(ptsD(rotP([[-3.9, -2.8], [-3.9, 2.7]], a)), [[K.ink, 1.3], [o.cy, 0.8]]);
    return { art, outline: body, lw: 1.5, front: 5.8 };
  });

  // 별조각 r 5.5: an irregular five-sided shard (+7 … −5, half 5) with one p300 face and the cyan line along one edge; the
  // travel frames turn it 15°; tail = one short stroke (−8 … −16)
  SHOT.starShards = shot((o) => {
    const t = o.tail, sag = o.end ? 0.8 * o.end : 0, a = o.base === 'travel' ? (o.ph ? 15 : 0) : o.end ? 6 * o.end : 0;
    const pts = rotP([[7, -0.3], [1.8, -4.9], [-4.6, -3.4], [-5, 2.6], [0.4, 4.8]], a);
    const face = rotP([[7, -0.3], [0.4, 4.8], [-1.3, 0.5]], a), edge = rotP([[5.7, -0.75], [2.1, -3.95]], a);
    const art = taper([-8, 0.6], [-8 - 8 * t, 1 + sag * 2], 1.5, 0.2, K.ink3) + FP(polyD(pts), o.body, o.ln, 1.6) + FP(polyD(face), K.p300) +
      SW(ptsD(edge), [[K.ink, 1.7], [o.cy, 0.9]]);
    return { art, outline: polyD(pts), lw: 1.6, front: 7 };
  });

  // 해바늘 r 5: a paper needle (+6.5 … −11, eye, ink point) with the cyan core and a tuft of cushion cotton caught at its
  // eye (irregular lump r 2.2, ink rim); tail = two short light strokes of different lengths (−14 … −24)
  SHOT.sunNeedles = shot((o) => {
    const t = o.tail, sag = o.end ? 0.7 * o.end : 0, l1 = (o.ph ? 7 : 10) * t, l2 = (o.ph ? 10 : 6) * t;
    const body = 'M-11,-1.5 C-11.8,-1.45 -11.8,1.45 -11,1.5 L-4,2.3 L2.4,1.5 L6.5,0 L2.4,-1.5 L-4,-2.3 Z';
    const art = taper([-14, -1.5], [-14 - l1, -2.1 + sag], 1.3, 0.2, K.ink3) + taper([-14.5, 1.4], [-14.5 - l2, 1.9 + sag * 1.4], 1.1, 0.2, K.ink3) +
      FP(body, o.body, o.ln, 1.5) + FP('M-4,1.2 L2.4,0.8 L2.4,1.5 L-4,2.3 Z', K.p300) + FP('M2.4,-1.5 L6.5,0 L2.4,1.5 C2.9,0.5 2.9,-0.5 2.4,-1.5 Z', o.dark) +
      SW('M-6.6,-0.1 L0.6,-0.1', [[K.ink, 1.5], [o.cy, 0.8]]) +
      FP(blob(-11.4, 0.3, 2.2, 7, 0.45, o.ph ? 62 : 61), o.body, o.ln, 0.8) + `<ellipse cx="-9" cy="0" rx="1" ry="0.38" fill="${o.ln}"/>`;
    return { art, outline: body, lw: 1.5, front: 6.5 };
  });

  // 먹 이슬비 r 3.5: an elongated drop (pointed front +5.2, round back −7, half 2.7; the brief's 10.5 × 5.6 is stretched so
  // it stays twice as long as wide, and a rounder drop with its glint read as an eye): paper with an ink tip (the front
  // 25%; the brief's 40% put the body at ink 74% in C9) and a straight cyan glint stroke; tail = one small ink drop that
  // stretches and gathers between the travel frames (about −10)
  SHOT.inkDrizzle = shot((o) => {
    const t = o.tail, k = clamp(t, 0.6, 1.25), sag = o.end ? 0.6 * o.end : 0;
    const body = 'M5.2,0 C3.3,-1 0.6,-2.6 -2.8,-2.7 C-5.6,-2.7 -7,-1.5 -7,0 C-7,1.5 -5.6,2.7 -2.8,2.7 C0.6,2.6 3.3,1 5.2,0 Z';
    const inkF = 'M5.2,0 C4.1,-0.6 3.1,-1.2 2.1,-1.7 C2.5,-0.9 1.7,-0.3 2.3,0.4 C1.9,1 2.4,1.4 2.1,1.7 C3.1,1.2 4.1,0.6 5.2,0 Z';
    const dl = o.ph ? 2.2 : 3.2, dw = o.ph ? 1.15 : 0.85, dx = -7.5 + (o.ph ? -3.2 : -2.6) * k, dy = 0.2 + sag;
    const drop = `M${f(dx + dl * 0.5)},${f(dy)} C${f(dx)},${f(dy - dw)} ${f(dx - dl * 0.5)},${f(dy - dw * 0.8)} ${f(dx - dl * 0.5)},${f(dy)} ` +
      `C${f(dx - dl * 0.5)},${f(dy + dw * 0.8)} ${f(dx)},${f(dy + dw)} ${f(dx + dl * 0.5)},${f(dy)} Z`;
    const art = (t < 0.5 ? '' : FP(drop, o.dark)) + FP(body, o.body, o.ln, 1.5) + FP('M-6,1 C-4.6,2 -1.4,2.1 1.6,1.6 L1.2,2.3 C-1.6,2.6 -4.8,2.5 -6.2,1.6 Z', K.p300) +
      FP(inkF, o.dark) + SW('M-5,-1.25 L-1.4,-1.55', [[K.ink, 1.2], [o.cy, 0.7]]);
    return { art, outline: body, lw: 1.5, front: 5.2 };
  });

  // 핀 우박 r 4.5: a diamond pin blade (+6 … −3.4, half 2.9) with a fine cyan groove and a hollow oval loop handle (about
  // −5.4; an ink loop only — a paper ring round a dark hole read as the 5-장 eclipse eye); tail = one speed stroke; the
  // travel frames wobble it ±8°
  SHOT.pinHail = shot((o) => {
    const t = o.tail, sag = o.end ? 0.7 * o.end : 0, a = o.base === 'travel' ? (o.ph ? -8 : 8) : o.end ? 5 * o.end : 0;
    const blade = polyD(rotP([[6, 0], [1.4, -2.9], [-3.4, 0], [1.4, 2.9]], a));
    const loopP = []; for (let i = 0; i < 16; i++) { const b = i / 16 * Math.PI * 2; loopP.push([-5.5 + Math.cos(b) * 2.1, Math.sin(b) * 1.45]); }
    const loop = polyD(rotP(loopP, a));
    const art = taper([-8.9, 0.4], [-8.9 - 8 * t, 0.7 + sag * 2], 1.3, 0.2, K.ink3) + `<path d="${loop}" fill="none" stroke="${o.ln}" stroke-width="1.1" stroke-linejoin="round"/>` +
      FP(blade, o.body, o.ln, 1.4) + FP(polyD(rotP([[6, 0], [1.4, 2.9], [-3.4, 0], [1.4, 0.9]], a)), K.p300) + SW(ptsD(rotP([[-1.2, -0.2], [3.6, -0.2]], a)), [[K.ink, 1.1], [o.cy, 0.7]]);
    return { art, outline: blade + ' ' + loop, lw: 1.5, front: 6 };
  });

  // 꼬리 방패 r 5: a dagger — blade (+6.5 … −1.2, half 2.2) with the cyan edge line, a round guard behind it (paper disc
  // r 3.6 centred at −4.4, seen a little edge-on so 2.4 × 3.6; ink rim, no centre dot) and a short ink grip (to −9.4); no
  // tail; the guard's glint stroke moves between the travel frames. (A full round disc on the blade read as a lollipop.)
  SHOT.tailGuard = shot((o) => {
    const sag = o.end ? 0.5 * o.end : 0, gx = -4.4, gr = 3.6, gw = 2.4;
    const blade = 'M-1.2,-2.2 L3.2,-1.8 L6.5,0 L3.2,1.8 L-1.2,2.2 Z';
    const guard = `M${f(gx + gw)},0 A${gw},${gr} 0 1 0 ${f(gx - gw)},0 A${gw},${gr} 0 1 0 ${f(gx + gw)},0 Z`;
    const ga = o.ph ? [150, 200] : [205, 255], gp = (d) => [gx + Math.cos(rad(d)) * gw * 0.62, Math.sin(rad(d)) * gr * 0.66 + sag * 0.2];
    const art = FP('M-6.8,-1 L-8.8,-0.9 C-9.4,-0.85 -9.4,0.85 -8.8,0.9 L-6.8,1 Z', o.dark, o.ln, 0.8) + FP(blade, o.body, o.ln, 1.4) +
      FP('M-1.2,0.8 L3.2,0.6 L6.5,0 L3.2,1.8 L-1.2,2.2 Z', K.p300) + SW('M0.8,1.25 L5.2,0.45', [[K.ink, 1.2], [o.cy, 0.75]]) +
      FP(guard, o.body, o.ln, 1.2) + L(`M${q(gp(ga[0]))} A${f(gw * 0.62)},${f(gr * 0.66)} 0 0 1 ${q(gp(ga[1]))}`, K.ink3, 0.8);
    return { art, outline: blade + ' ' + guard, lw: 1.5, front: 6.5 };
  });

  // 연막 꼬리 r 4.5: the plain paper needle with the cyan point; tail = one puff of smoke built from three overlapping lumps
  // (r 2 → 4 toward the back, −10 … −27, staggered up and down) under one shared ink.300 outline: p300 with an ink.300
  // shadow along its underside; crisp edges, no gradient. (Separate round lumps read as pebbles in a row, and a dark
  // core inside one lump as an eye.)
  SHOT.smokeTail = shot((o) => {
    const t = o.tail, k = clamp(t, 0.6, 1.25), sag = o.end ? 0.8 * o.end : 0;
    const LU = (o.ph ? [[-11.2, -0.6, 2.1, 71], [-15.4, 1, 2.9, 72], [-21.6, -0.7, 3.7, 73]] : [[-11.4, 0.6, 2.2, 74], [-15.8, -0.9, 3, 75], [-22, 0.8, 3.8, 76]]).slice(0, t < 0.5 ? 1 : t < 0.9 ? 2 : 3);
    const ds = LU.map(([x, y, r, s], i) => blob(-10 + (x + 10) * k, y + sag * (i + 1) * 0.5, r, 7, 0.3, s));
    const art = ds.map((d) => `<path d="${d}" fill="${K.ink3}" stroke="${K.ink3}" stroke-width="1.4" stroke-linejoin="round"/>`).join('') +
      ds.map((d) => `<path d="${d}" fill="${K.p300}" transform="translate(0.3,-0.9)"/>`).join('');
    return { art: art + needleShot(o, o.cy), outline: NEEDLE_D, lw: 1.5, front: 6 };
  });

  // 묘침 r 4.5: a pin (paper shaft −3.6 … +3.4, half 1.3, cyan point to +6) with a small headstone at the back: an ink.300
  // base step and a round-topped plate 4 × 6 facing back (paper + ink rim, p300 lower half; no glyph); no tail; the
  // stone tilts between the travel frames
  SHOT.gravePins = shot((o) => {
    const a = o.base === 'travel' ? (o.ph ? -9 : 7) : o.end ? 6 * o.end : 0, c0 = [-4, 0];
    const shaft = 'M-3.6,-1.3 L3.4,-1.15 L3.4,1.15 L-3.6,1.3 Z';
    const step = polyD(rotP([[-3.5, -3.4], [-4.5, -3.4], [-4.5, 3.4], [-3.5, 3.4]], a, c0));
    const plate = polyD(rotP([[-4.5, -3], [-6.4, -3]].concat(bez([-6.4, -3], [-9.2, -3], [-9.2, 3], [-6.4, 3], 8).slice(1), [[-4.5, 3]]), a, c0));
    const low = polyD(rotP([[-4.5, 0.7], [-8.5, 0.7], [-8.1, 2.1], [-6.4, 3], [-4.5, 3]], a, c0));
    const art = FP(shaft, o.body, o.ln, 1.1) + FP('M3.4,-1.7 L6,0 L3.4,1.7 C3.9,0.6 3.9,-0.6 3.4,-1.7 Z', o.cy, K.ink, 0.6) +
      FP(plate, o.body, o.ln, 1.2) + FP(low, K.p300) + FP(step, K.ink3, o.ln, 0.5);
    return { art, outline: shaft + ' ' + plate, lw: 1.4, front: 6 };
  });

  // 추적 인장 r 4.5: a small seal seen from the side — paper body (−4 … +4.6, half 3.6) with the ink face band (+4.6 … +6)
  // and a round ink knob (−6, r 2); tail = the dotted cyan tracking thread (−8 … −30, one bend that flips between the travel
  // frames; the 1.25 × awakened thread ends at −35.5, inside 8r)
  SHOT.trackingSeals = shot((o) => {
    const t = o.tail, sag = o.end ? 0.8 * o.end : 0, sg = o.ph ? -1 : 1, x1 = -8 - 22 * t;
    const body = 'M-4,-3.3 Q-4,-3.6 -3.6,-3.6 L4.6,-3.6 L4.6,3.6 L-3.6,3.6 Q-4,3.6 -4,3.3 Z';
    const th = `M-7.6,0 Q${f(-8 - 11 * t)},${f(sg * 4.6 + sag)} ${f(x1)},${f(sg * 1.2 + sag * 1.5)}`;
    const art = SW(th, [[K.ink, 2.6], [o.cy, 1.6], [K.allyG, 0.5]], ' stroke-dasharray="2.6 1.8"') +
      `<circle cx="-6" cy="0" r="2" fill="${o.dark}"/>` + FP('M-6,-0.9 L-3.8,-1.2 L-3.8,1.2 L-6,0.9 Z', o.dark) +
      FP(body, o.body, o.ln, 1.5) + FP('M-4,1.3 L4.6,1.3 L4.6,3.6 L-3.6,3.6 Q-4,3.6 -4,3.3 Z', K.p300) + FP('M4.6,-3.6 L5.4,-3.4 L6,-2.8 L6,2.8 L5.4,3.4 L4.6,3.6 Z', o.dark, o.ln, 0.6);
    return { art, outline: body, lw: 1.5, front: 6 };
  });

  // 사냥꾼 표식 r 5: a marker dart (paper body +6.5 … −6, half 2.4, ink point) with a paper tag (4.5 × 3.5, one hole) on a
  // cyan string trailing behind; the tag flaps ±20° between the travel frames (−8 … −18)
  SHOT.huntersMarks = shot((o) => {
    const t = o.tail, k = clamp(t, 0.6, 1.25), sag = o.end ? 0.9 * o.end : 0, a = o.base === 'travel' ? (o.ph ? -20 : 20) : 10;
    const body = 'M-6,-1.3 C-6.4,-1.2 -6.4,1.2 -6,1.3 L-1,2.4 L3,1.9 L6.5,0 L3,-1.9 L-1,-2.4 Z';
    const H = [-6 - 6.4 * k, 2.2 + sag], tag = rotP([[0, -0.6], [-4.5, -0.6], [-4.5, 2.9], [0, 2.9]].map(([x, y]) => [H[0] + x, H[1] + y]), a, H);
    const hole = rotP([[H[0] - 0.9, H[1] + 0.4]], a, H)[0];
    const art = SW(`M-5.6,0.6 Q${f(-6 - 3 * k)},${f(2.4 + sag * 0.5)} ${f(H[0] + 0.3)},${f(H[1])}`, [[K.ink, 1.8], [o.cy, 1]]) +
      FP(polyD(tag), o.body, o.ln, 0.8) + `<circle cx="${f(hole[0])}" cy="${f(hole[1])}" r="0.55" fill="${o.ln}"/>` +
      FP(body, o.body, o.ln, 1.5) + FP('M-6,0.4 L-1,1 L3,0.8 L3,1.9 L-1,2.4 L-6,1.3 Z', K.p300) + FP('M3,-1.9 L6.5,0 L3,1.9 C3.6,0.6 3.6,-0.6 3,-1.9 Z', o.dark);
    return { art, outline: body, lw: 1.5, front: 6.5 };
  });

  // 까마귀 깃 r 5: a crow-feather blade (+6.5 … −12): a lopsided paper vane (3.8 above the shaft, 1.9 below) with an ink
  // upper edge and an ink point, the cyan shaft core; tail = two split fibres off the upper back edge (−12 … −20) that
  // wobble between the travel frames. (A symmetric vane with a forked tail read as a fish.)
  SHOT.crowFeathers = shot((o) => {
    const t = o.tail, sag = o.end ? 0.8 * o.end : 0, w = o.ph ? 0.6 : -0.5;
    const vane = 'M6.5,-0.2 C4.4,-2 0.6,-3.8 -3.4,-3.8 C-7.2,-3.6 -10.4,-2.6 -12,-1.6 L-11,-0.6 L-12.2,0.3 L-11.4,0.9 C-7.8,1.6 -3,1.9 0.6,1.5 C3,1.2 5,0.5 6.5,-0.2 Z';
    const fib =`M-10.8,-2.4 Q${f(-10.8 - 3.2 * t)},${f(-3 + w)} ${f(-10.8 - 7.2 * t)},${f(-3.4 + w + sag)} M-11.6,-1.2 Q${f(-11.6 - 2.8 * t)},${f(-1.4 - w)} ${f(-11.6 - 6 * t)},${f(-1.6 - w + sag)}`;
    const edgeThin = 'M6.5,-0.2 C4.4,-2 0.6,-3.8 -3.4,-3.8 C-7.2,-3.6 -10.4,-2.6 -12,-1.6 L-11.4,-1.1 C-9.9,-2 -6.9,-3 -3.4,-3 C0.2,-3 3.6,-1.6 5.8,-0.25 Z';
    const art = SW(fib, [[o.ln, 1.1]]) + FP(vane, o.body, o.ln, 1.4) + FP(edgeThin, o.dark) + FP('M6.5,-0.2 L4.2,-1.2 C4.5,-0.6 4.5,0.3 4.1,0.85 Z', o.dark) +
      L('M-2.6,0.9 L-8.4,0.7', K.p300, 1) + SW('M-10.6,-0.2 Q-4,-0.6 2.4,-0.3', [[K.ink, 1.2], [o.cy, 0.7]]);
    return { art, outline: vane, lw: 1.5, front: 6.5 };
  });

  // 보스 사냥침 r 5.5: a harpoon needle — paper shaft (−14 … +1, half 1.7, p300 underside), paper leaf head (+1 … +7, half
  // 2.6) and one ink barb swept back from the head; tail = the cyan line [ink 2.3, cyan 1.4, glow 0.5] (−14 … −38, one bend
  // that flips between the travel frames; the awakened 1.25 × is capped at −43, inside 8r = 44)
  SHOT.bossbane = shot((o) => {
    const t = o.tail, sag = o.end ? 0.9 * o.end : 0, sg = o.ph ? -1 : 1, L1 = Math.min(24 * t, 29.4);
    const head = 'M1,-2.2 C3,-2.6 5.4,-1.4 7,0 C5.4,1.4 3,2.6 1,2.2 C0.4,1.2 0.4,-1.2 1,-2.2 Z';
    const th = `M-13.6,0 C${f(-13.6 - L1 * 0.4)},0 ${f(-13.6 - L1 * 0.6)},${f(sg * 4.4 + sag)} ${f(-13.6 - L1)},${f(sg * 3.6 + sag * 1.5)}`;
    const art = SW(th, [[K.ink, 2.3], [o.cy, 1.4], [K.allyG, 0.5]]) + FP('M-14,-1.7 L1,-1.35 L1,1.35 L-14,1.7 Z', o.body, o.ln, 1.2) +
      FP('M-14,0.6 L1,0.45 L1,1.35 L-14,1.7 Z', K.p300) +
      FP(head, o.body, o.ln, 1.4) + FP('M2.4,-1.9 L-2.6,-4.4 L-1.6,-2.2 L0.6,-1.3 Z', o.dark, o.ln, 0.6) + L('M1.6,0.9 L5.6,0.2', K.p300, 0.9);
    return { art, outline: 'M-14,-1.7 L1,-1.35 L1,-2.2 C3,-2.6 5.4,-1.4 7,0 C5.4,1.4 3,2.6 1,2.2 L1,1.35 L-14,1.7 Z', lw: 1.5, front: 7 };
  });

  /** Placeholder shot (not drawn yet): a plain paper needle, front r + 1, ink 1.5, cyan eye (allyD when ending). */
  function placeholderShot(part, fr, c, r) {
    const x1 = r + 1, x0 = -2.4 * r - 4, w = 1.7, end = part.indexOf('end') === 0;
    const d = `M${f(x0)},0 C${f(x0)},${-w} ${f(x0 + 2)},${-w} ${f(x0 + 4)},${-w} L${f(x1 - 4)},${f(-w * 0.8)} L${f(x1)},0 L${f(x1 - 4)},${f(w * 0.8)} L${f(x0 + 4)},${w} C${f(x0 + 2)},${w} ${f(x0)},${w} ${f(x0)},0 Z`;
    const s = `<path d="${d}" fill="${end && fr ? K.p300 : K.p50}" stroke="${end && fr ? K.ink3 : K.ink}" stroke-width="1.5" stroke-linejoin="round"/>` +
      `<ellipse cx="${f(x0 + 3.2)}" cy="0" rx="1.3" ry="0.6" fill="${end ? K.allyD : K.ally}" stroke="${K.ink}" stroke-width="0.5"/>`;
    return end && fr ? `<g opacity="0.6">${s}</g>` : s;
  }
  function stamp(id, part, o = {}) {
    const ps = partsOf(id), P = ps.find((p) => p.part === part);
    if (!P) throw new Error(`unknown shot part ${id}/${part}`);
    const fr = clamp(Math.floor(o.frame || 0), 0, P.frames - 1), c = ctx();
    const fn = META[id].done && SHOT[id];
    const body = fn ? fn(part, fr, c, META[id].r) : placeholderShot(part, fr, c, META[id].r);
    return c.out(`<g transform="translate(${P.anchor[0]} ${P.anchor[1]})">${body}</g>`, id);
  }

  // ==== 6. review helpers (optional; not baked) ====
  /** One row of tiles for a kind: [normal, awakened] per weapon (or one state with {awakened}). */
  function sheet(o = {}) {
    const ids = IDS.filter((id) => !o.kind || META[id].kind === o.kind), both = o.awakened == null;
    let s = '', i = 0;
    ids.forEach((id) => (both ? [false, true] : [!!o.awakened]).forEach((aw) => { s += `<g transform="translate(${i * 166 + 8},8)">${tile(id, { awakened: aw, metal: true, size: 150 })}</g>`; i++; }));
    return `<g class="kar-sheet">${s}</g>`;
  }
  /** Every part and frame of a kind's shots at 1x: one column per weapon, rows = parts, two frames side by side. */
  function shotSheet(o = {}) {
    const ids = SHOTS.filter((id) => !o.kind || META[id].kind === o.kind);
    let s = '';
    ids.forEach((id, i) => partsOf(id).forEach((p, j) => { for (let fr = 0; fr < p.frames; fr++) s += `<g transform="translate(${i * 140 + fr * 68},${j * 28})">${stamp(id, p.part, { frame: fr })}</g>`; }));
    return `<g class="kar-shot-sheet">${s}</g>`;
  }

  PN.arsenal = {
    version: '1.0',
    K,
    ids: IDS.slice(),
    kinds: KINDS.slice(),
    META,
    shots: SHOTS.slice(),
    skill,
    tile,
    hudSlot,
    parts: partsOf,
    stamp,
    sheet,
    shotSheet
  };
})(window.PN);
