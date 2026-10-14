// k-icons2.js — 흑백 타격 생존전 먹극화 · PAPER NOIR INK — the arsenal's 44 weapons → window.PN.arsenal
// Work order K9: docs/art/briefs/arsenal-icons.md. API: art/concept-kit/API-icons2.md.
// - Icons, tiles and HUD slots: a weapon's drawing lives in this module's own table and is lent to PN._ki.ICON only for
//   the length of one PN.icons.skill / tile / hudSlot call (brief §1.3). The rarity frames, knots and the awakened
//   grammar are k-icons' own; nothing is left behind in PN.icons or PN._ki.
// - Shots: stamps for the 22 weapons that fire projectiles (parts / stamp, the K4 PN.skillVfx contract), ids 'kar<N>_'.
// - Delivery 1 of 3: skeleton, META for all 44, the volley weapons (8) drawn. The rest wear placeholders (META done:
//   false): the look's core icon, and a plain paper needle for shots.
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
  const DONE = new Set(['inkDarts', 'brushQuills', 'sealArrows', 'frostNeedles', 'thunderNeedles', 'twinBlades', 'ghostVolley', 'headsmanDarts']);
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

  // (deliveries 2–3: helpers for the other kinds go here)

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
    const deg = -12, ax = axis([0, 0], deg), u = ax.u, n = ax.n, G = [103, 57], gr = 15, ln = A ? K.ink7 : K.ink;
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
    // the main bolt in icon space: long, short jog, longer, short jog back, medium, short — every step ≥ 30% apart
    const main0 = { pts: [[4, 100], [30, 80], [36, 90], [70, 58], [66, 72], [86, 62], [99, 66]], w0: 8, w1: 15.5, front: [1, 3], fork: false, shadow: [2.1, 2.7] };
    needles.slice().reverse().forEach(([B, Tp], i) => {
      const main = i === needles.length - 1, bo = boltAround(B, Tp, main ? main0 : { ts: [0.05, 0.24, 0.36, 0.58, 0.7, 1], ss: [0, -6, 3, -7.5, 3.5, 0.5], w0: 4.6, w1: 9, front: [1], fork: false });
      fg += bo.back + KI.slimNeedle(B, Tp, main ? 6.6 : 5.4, main ? 2.4 : 2) + bo.front;
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
    // the black spot: frozen ground spreading in from the lower right; the ghoul's frosted half stands on it
    let bg = `<path d="M18,132 C34,110 60,92 82,80 C96,72 112,70 134,68 L134,134 L18,134 Z" fill="${A ? K.ink7 : K.ink}"/>` +
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
  function headsmanDart(O, deg, len, k = 1, cyan = true) {
    const at = axis(O, deg), B = (x, s) => at(len + x * k, s * k), M = (a) => a.map(([x, s]) => B(x, s));
    // falchion head (검수 1차 F1): straight spine, the belly widest toward the point — widest at the heel it read as a
    // ladle — and a mitred point running past the spine; heel square to a tang collar on the shaft
    const belly = smooth([[37, -10.5], [34, -4], [28, 5], [19, 8.6], [9, 7], [1, 4.8], [-1, 4.2]], 6);
    const blade = ptsD(M([[-2, -6], [13, -8.4], [27, -9.4]]).concat(M(belly), M([[-2, 4.2]])), true);
    // the ink back is a band along the spine only (3–4 thick); the blade body stays paper
    const back = ptsD(M([[-2, -6], [13, -8.4], [27, -9.4], [35, -10.2], [31, -7.4], [20, -5.6], [9, -4.6], [-2, -2.6]]), true);
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
    bg += `<g transform="translate(108 102) scale(1 0.32) translate(-108 -102)">${P(splashD(108, 102, 32, 9, 46, 0.55, -0.2), col)}</g>` +
      P(blob(126, 95, 2.2, 6, 0.5, 44) + blob(121, 110, 1.6, 6, 0.5, 47) + blob(80, 105, 1.5, 6, 0.5, 45), col);
    let fg = '';
    // awakened (검수 2차 F2b): the second ghoul stands apart, down and to the left — centres 41.7 apart, silhouettes about
    // 10 apart even with its upper piece opened toward the first, so the paper halo does not bind the two into a head and
    // a body segment — and the small blade is aimed at it, its point at the outline; neither ghoul flicks
    if (A) fg += tornGhoul(c, 71, 110, 11, 9, 'b', { deg: -10, open: [4, -5, -12], flicks: false }) + headsmanDart([-4, 111], -6, 38.6, 0.72, false);
    fg += tornGhoul(c, 100, 80, 16, 5, 'a', A ? { flicks: false } : undefined) + headsmanDart([6, 89], -16, 56, 1.12);
    return { bg, fg };
  } };

  // (delivery 2: burst · spray · rear · seeker; delivery 3: strike · nova · lob · chain · beam · halo)

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

  // (delivery 2: the shots of burst · spray · rear · seeker go here)

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
