// Style frame board composition — 1600 x 1000
(function (PN) {
  const C = PN.C, T = PN.taper;
  const FONT = `font-family="'Apple SD Gothic Neo','AppleGothic','Helvetica Neue',sans-serif"`;
  const MONO = `font-family="'SF Mono','Menlo','Courier New',monospace"`;
  const txt = (x, y, s, size, fill, weight = 700, extra = '') => `<text x="${x}" y="${y}" ${FONT} font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${s}</text>`;

  function captionBox(x, y, w, lines, tx, ty) {
    const h = 10 + lines.length * 16;
    const lead = tx !== undefined ? `<path d="M ${x + w / 2},${y + h / 2} L ${tx},${ty}" stroke="${C.ink}" stroke-width="2.4"/><path d="M ${x + w / 2},${y + h / 2} L ${tx},${ty}" stroke="${C.paper}" stroke-width="0.9"/><circle cx="${tx}" cy="${ty}" r="4" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>` : '';
    return `${lead}<rect x="${x + 3}" y="${y + 3}" width="${w}" height="${h}" fill="${C.ink}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>` +
      lines.map((l, i) => txt(x + 8, y + 18 + i * 16, l, i === 0 ? 12.5 : 11.5, C.ink, i === 0 ? 800 : 600)).join('');
  }

  // ---------------- LEFT: hero panel ----------------
  function heroPanel() {
    const X = 24, Y = 112, W = 696, H = 864;
    const rnd = PN.rng(41);
    // background halftone falloff (env duotone)
    const dots = PN.halftone(X, Y, X + W, Y + H, 9, (x, y) => {
      const d = Math.hypot(x - 360, y - 430); return Math.min(2.9, Math.max(0, (d - 230) / 170) * 2.6);
    }, C.env1, 45);
    // left building silhouette
    const bldL = `<path d="M ${X},${Y} L ${X + 132},${Y} L ${X + 150},${Y + 40} L ${X + 138},${Y + 260} L ${X + 150},${Y + 262} L ${X + 132},${Y + 560} L ${X},${Y + 600} Z" fill="${C.ink}"/>
      <rect x="${X + 40}" y="${Y + 70}" width="34" height="46" fill="${C.env1Light}"/><rect x="${X + 40}" y="${Y + 70}" width="34" height="46" fill="url(#dotSep)"/>
      <path d="M ${X + 57},${Y + 70} v46 M ${X + 40},${Y + 93} h34" stroke="${C.ink}" stroke-width="4"/>
      <rect x="${X + 36}" y="${Y + 170}" width="30" height="40" fill="${C.env1Light}"/>
      <path d="M ${X + 51},${Y + 170} v40" stroke="${C.ink}" stroke-width="4"/>`;
    // hanging shop sign (먹)
    const sign = `<path d="M ${X + 138},${Y + 150} L ${X + 206},${Y + 150}" stroke="${C.ink}" stroke-width="6"/>
      <path d="M ${X + 176},${Y + 150} L ${X + 176},${Y + 168} M ${X + 196},${Y + 150} L ${X + 196},${Y + 168}" stroke="${C.ink}" stroke-width="2.4"/>
      <rect x="${X + 160}" y="${Y + 168}" width="52" height="84" fill="${C.paper}" stroke="${C.ink}" stroke-width="4" transform="rotate(4 ${X + 186} ${Y + 168})"/>
      <text x="${X + 186}" y="${Y + 226}" ${FONT} font-size="40" font-weight="900" fill="${C.ink}" text-anchor="middle" transform="rotate(4 ${X + 186} ${Y + 168})">먹</text>`;
    // right building + torn posters
    const bldR = `<path d="M ${X + W},${Y} L ${X + W - 96},${Y} L ${X + W - 110},${Y + 30} L ${X + W - 100},${Y + 520} L ${X + W - 118},${Y + 540} L ${X + W},${Y + 560} Z" fill="${C.ink}"/>
      <path d="M ${X + W - 86},${Y + 300} L ${X + W - 22},${Y + 296} L ${X + W - 18},${Y + 392} L ${X + W - 40},${Y + 386} L ${X + W - 52},${Y + 400} L ${X + W - 70},${Y + 388} L ${X + W - 84},${Y + 396} Z" fill="${C.env1Light}" stroke="${C.ink}" stroke-width="3"/>
      <rect x="${X + W - 74}" y="${Y + 312}" width="40" height="30" fill="${C.ink}"/>
      <path d="M ${X + W - 76},${Y + 352} h44 M ${X + W - 76},${Y + 362} h30 M ${X + W - 76},${Y + 372} h38" stroke="${C.ink}" stroke-width="3"/>`;
    // wires
    const wires = `<g fill="none" stroke="${C.ink}" stroke-width="2"><path d="M ${X + 140},${Y + 36} C ${X + 300},${Y + 110} ${X + 460},${Y + 96} ${X + W - 106},${Y + 40}"/><path d="M ${X + 146},${Y + 60} C ${X + 320},${Y + 150} ${X + 480},${Y + 120} ${X + W - 104},${Y + 76}"/></g>`;
    // ground plane
    const ground = `<path d="M ${X},${Y + 700} L ${X + W},${Y + 690} L ${X + W},${Y + H} L ${X},${Y + H} Z" fill="${C.env1}"/>
      <path d="M ${X},${Y + 700} L ${X + W},${Y + 690} L ${X + W},${Y + H} L ${X},${Y + H} Z" fill="url(#dotSep)" opacity="0.55"/>
      <g stroke="${C.ink}" stroke-width="2" opacity="0.55">${[-3, -2, -1, 0, 1, 2, 3, 4].map((k) => `<path d="M ${X + 360 + k * 60},${Y + 696} L ${X + 360 + k * 190},${Y + H}"/>`).join('')}
      <path d="M ${X},${Y + 752} L ${X + W},${Y + 744}"/><path d="M ${X},${Y + 820} L ${X + W},${Y + 812}"/></g>
      <path d="M ${X},${Y + 700} L ${X + W},${Y + 690}" stroke="${C.ink}" stroke-width="4"/>`;
    // speed lines behind hero (towards throw)
    const speed = PN.speedLines(X + 330, Y + 420, 250, 900, 70, 7, C.ink, -0.9, 0.9, 0.012);
    const speed2 = PN.speedLines(X + 330, Y + 420, 260, 900, 40, 19, C.ink, Math.PI - 0.7, Math.PI + 0.5, 0.01);
    const splats = PN.splat(X + 120, Y + 800, 16, 12, 5) + PN.splat(X + 560, Y + 780, 10, 10, 9) + PN.splat(X + 610, Y + 470, 8, 9, 13);
    // moon/lamp disk behind head
    const disk = `<circle cx="${X + 318}" cy="${Y + 300}" r="170" fill="${C.paper}"/><circle cx="${X + 318}" cy="${Y + 300}" r="170" fill="none" stroke="${C.ink}" stroke-width="3"/><circle cx="${X + 318}" cy="${Y + 300}" r="182" fill="none" stroke="${C.ink}" stroke-width="1.2" stroke-dasharray="2 6"/>`;
    const sfx = `<g transform="translate(${X + 540},${Y + 196}) rotate(-12)">
      <text x="0" y="0" ${FONT} font-size="58" font-weight="900" fill="${C.paper}" stroke="${C.ink}" stroke-width="9" paint-order="stroke" stroke-linejoin="round" letter-spacing="-2">슈슉</text>
      <text x="4" y="30" ${FONT} font-size="20" font-weight="900" fill="${C.ink}" letter-spacing="6">!!</text></g>`;
    const hero = `<g transform="translate(${X + 22},${Y + 150})">${PN.hero()}</g>`;
    const hx = X + 22, hy = Y + 150;
    const calls = [
      captionBox(X + 440, Y + 20, 232, ['흑립(갓) 실루엣', '탑다운에서도 원형 챙 = 정체성 1순위'], hx + 430, hy + 146),
      captionBox(X + 18, Y + 196, 190, ['청록 목도리', '몸에 단 하나뿐인 신호색'], hx + 66, hy + 128),
      captionBox(X + 18, Y + 440, 170, ['먹침검(바늘검) + 먹실', '각성·근접 스킬 궤적'], hx + 72, hy + 382),
      captionBox(X + 476, Y + 486, 200, ['먹선 바늘 탄띠', '자동 공격 = 바늘 투척 모션'], hx + 318, hy + 236),
      captionBox(X + 476, Y + 568, 200, ['종이 코트 = 밝은 몸통', '먹빛 적과 명도 반전 ≥ 4.5:1'], hx + 318, hy + 312),
      captionBox(X + 476, Y + 650, 200, ['행전(각반) 흰 띠', '달리기 리듬이 읽히는 표식'], hx + 342, hy + 500)
    ].join('');
    const nameBar = `<rect x="${X}" y="${Y + H - 78}" width="${W}" height="78" fill="${C.ink}"/>
      ${txt(X + 22, Y + H - 40, '결 <tspan font-size="18" font-weight="700" fill="' + C.env1 + '">GYEOL · 먹선 사냥꾼</tspan>', 34, C.paper, 900)}
      ${txt(X + 22, Y + H - 16, '지워지는 먹선 세계를 바늘과 실로 꿰매는 마지막 필경사 · 슬롯 game/player/hunter', 13, C.paperShade, 500)}
      <rect x="${X + W - 150}" y="${Y + H - 60}" width="128" height="40" fill="none" stroke="${C.player}" stroke-width="2"/>
      ${txt(X + W - 138, Y + H - 34, '신호색 = 목도리', 14, C.player, 800)}`;
    const head = `<rect x="${X}" y="${Y}" width="170" height="34" fill="${C.ink}"/>${txt(X + 12, Y + 23, '01 · HERO 키 일러스트', 14, C.paper, 800)}`;
    return `<g clip-path="url(#clipL)">
      <rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="${C.env1Light}"/>
      ${dots}${wires}${bldL}${sign}${bldR}${ground}${disk}
      <g opacity="0.16">${speed}${speed2}</g>
      ${splats}${hero}${sfx}${calls}${nameBar}${head}
    </g>
    <rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="none" stroke="${C.paper}" stroke-width="3"/>`;
  }

  // ---------------- RIGHT TOP: gameplay-scale strip ----------------
  function stripPanel() {
    const X = 744, Y = 112, W = 832, H = 440;
    const rnd = PN.rng(77);
    // paving
    let pave = '';
    let yy = 0;
    while (yy < H) {
      const h = 30 + rnd() * 16; let xx = -rnd() * 50;
      while (xx < W) {
        const w = 38 + rnd() * 58, shade = rnd();
        const fill = shade < 0.25 ? '#CFC4AD' : shade < 0.32 ? C.env1 : C.env1Light;
        const j = () => (rnd() - 0.5) * 4;
        pave += `<path d="M ${(xx + j()).toFixed(1)},${(yy + j()).toFixed(1)} L ${(xx + w + j()).toFixed(1)},${(yy + j()).toFixed(1)} L ${(xx + w + j()).toFixed(1)},${(yy + h + j()).toFixed(1)} L ${(xx + j()).toFixed(1)},${(yy + h + j()).toFixed(1)} Z" fill="${fill}" stroke="${C.env1}" stroke-width="1.5" stroke-linejoin="round"/>`;
        xx += w + 3;
      }
      yy += h + 3;
    }
    pave = `<rect width="${W}" height="${H}" fill="${C.env1}"/>` + pave;
    const cracks = `<g fill="none" stroke="${C.ink}" stroke-width="1.6" opacity="0.7"><path d="M 60,300 l 18,10 l 8,-6 l 20,14"/><path d="M 760,160 l -14,12 l 4,10 l -18,8"/><path d="M 380,400 l 12,-10 l 16,4"/></g>`;
    // wall obstacle (3/4): top face + front face + posters + cast shadow
    const wall = `
      <path d="M 40,122 L 270,122 L 300,150 L 70,150 Z" fill="${C.ink}" opacity="0.28"/>
      <path d="M 40,122 L 270,122 L 300,150 L 70,150 Z" fill="url(#dotL)" opacity="0.5"/>
      <path d="M 30,48 L 262,48 L 262,74 L 30,74 Z" fill="${C.env1Light}" stroke="${C.ink}" stroke-width="4"/>
      <path d="M 30,74 L 262,74 L 262,124 L 30,124 Z" fill="${C.env1}" stroke="${C.ink}" stroke-width="4"/>
      <path d="M 30,74 L 262,74 L 262,124 L 30,124 Z" fill="url(#dotEnv)" opacity="0.8"/>
      <path d="M 52,80 L 92,78 L 94,112 L 84,108 L 76,116 L 66,108 L 54,114 Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.4"/>
      <rect x="60" y="84" width="24" height="12" fill="${C.ink}"/>
      <path d="M 150,82 L 196,80 L 198,118 L 150,120 Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.4"/>
      <text x="173" y="110" ${FONT} font-size="22" font-weight="900" fill="${C.ink}" text-anchor="middle">禁</text>
      <path d="M 110,74 L 116,96 L 108,110 M 222,74 L 230,100" stroke="${C.ink}" stroke-width="2" fill="none"/>
      <path d="M 30,48 L 262,48" stroke="${C.paper}" stroke-width="1.4" opacity="0.8"/>`;
    // barrels (right top)
    const barrels = [[700, 36], [746, 44], [722, 70]].map(([x, y]) => `<ellipse cx="${x + 2}" cy="${y + 40}" rx="22" ry="7" fill="${C.ink}" opacity="0.3"/><path d="M ${x - 18},${y} L ${x + 18},${y} L ${x + 18},${y + 34} L ${x - 18},${y + 34} Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="3"/><ellipse cx="${x}" cy="${y}" rx="18" ry="6" fill="${C.env1Deep}" stroke="${C.ink}" stroke-width="3"/><ellipse cx="${x}" cy="${y}" rx="11" ry="3.4" fill="${C.ink}"/><path d="M ${x + 12},${y + 6} L ${x + 12},${y + 32}" stroke="${C.paper}" stroke-width="2" opacity="0.7"/><path d="M ${x - 18},${y + 17} L ${x + 18},${y + 17}" stroke="${C.env1Deep}" stroke-width="3"/>`).join('');
    // death splat decal
    const decal = `<g opacity="0.85">${PN.splat(470, 116, 14, 12, 23)}</g><circle cx="470" cy="116" r="30" fill="url(#dotS)" opacity="0.6"/>`;
    // fire hazard telegraph (imminent)
    const tele = `<g>
      <circle cx="146" cy="352" r="60" fill="url(#hatchWarnD)"/>
      <circle cx="146" cy="352" r="60" fill="none" stroke="${C.ink}" stroke-width="4.5"/>
      <circle cx="146" cy="352" r="60" fill="none" stroke="${C.warn}" stroke-width="2" stroke-dasharray="10 6"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = i * Math.PI / 4; return `<path d="M ${146 + Math.cos(a) * 60},${352 + Math.sin(a) * 60} L ${146 + Math.cos(a) * 70},${352 + Math.sin(a) * 70}" stroke="${C.ink}" stroke-width="4"/>`; }).join('')}
      <circle cx="146" cy="352" r="22" fill="${C.hostile}" stroke="${C.ink}" stroke-width="3"/>
      <circle cx="146" cy="352" r="22" fill="url(#dotS)" opacity="0.35"/>
    </g>`;
    // shooter aim lane (amber hatch) + hostile bullet
    const mx = 672, my = 283, tx = 420, ty = 238;
    const ang = Math.atan2(ty - my, tx - mx), len = Math.hypot(tx - mx, ty - my), deg = ang * 180 / Math.PI;
    const lane = `<g transform="translate(${mx},${my}) rotate(${deg})">
      <rect x="0" y="-9" width="${len - 26}" height="18" fill="url(#hatchWarn)"/>
      <path d="M 0,-9 L ${len - 26},-9 M 0,9 L ${len - 26},9" stroke="${C.ink}" stroke-width="2.4" stroke-dasharray="8 5"/>
      <path d="M ${len - 26},-15 L ${len - 6},0 L ${len - 26},15 Z" fill="${C.warn}" stroke="${C.ink}" stroke-width="2.4"/>
    </g>`;
    const bx = 590, by = 268;
    const bullet = `${T([bx + 40, by + 6, bx + 24, by + 3, bx + 6, by], 7, 'start', C.hostile, 'opacity="0.7"')}<circle cx="${bx}" cy="${by}" r="8.5" fill="${C.hostile}" stroke="${C.ink}" stroke-width="3.5"/><circle cx="${bx - 2}" cy="${by - 2}" r="2.6" fill="${C.paper}"/>`;
    // hero needles toward stalker + chain spark to charger
    const nd = (x, y, a) => `<g transform="translate(${x},${y}) rotate(${a})">${T([-30, 0, -16, 0, -2, 0], 5, 'start', C.player, 'opacity="0.8"')}<path d="M -4,-2.4 L 10,-2 L 17,0 L 10,2 L -4,2.4 Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.2" paint-order="stroke"/><path d="M 10,-2 L 17,0 L 10,2 Z" fill="${C.player}"/></g>`;
    const needles = nd(344, 262, 172) + nd(318, 280, 166);
    const chainPts = [[426, 214], [452, 196], [470, 206], [500, 184], [520, 192], [548, 170]];
    const cp = chainPts.map((p) => p.join(',')).join(' L ');
    const chain = `<path d="M ${cp}" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/><path d="M ${cp}" fill="none" stroke="${C.playerGlow}" stroke-width="3.2" stroke-linejoin="round"/><path d="M ${cp}" fill="none" stroke="${C.player}" stroke-width="1.2" stroke-linejoin="round"/>`;
    // hit star on stalker
    const star = (x, y, r) => { let d = ''; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ',' + (y + Math.sin(a) * rr).toFixed(1); } return `<path d="${d}Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`; };
    const hit = star(276, 278, 15) + `<text x="276" y="258" ${FONT} font-size="15" font-weight="900" fill="${C.ink}" stroke="${C.paper}" stroke-width="4" paint-order="stroke" text-anchor="middle">23</text>`;
    // xp gems
    const gem = (x, y) => `<path d="M ${x},${y - 8} L ${x + 6},${y} L ${x},${y + 8} L ${x - 6},${y} Z" fill="${C.reward}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/><path d="M ${x - 2},${y - 3} L ${x},${y - 6}" stroke="${C.paper}" stroke-width="1.6"/>`;
    const gems = gem(404, 346) + gem(420, 360) + gem(388, 364) + gem(350, 176) + gem(640, 380);
    // entities
    const hitR = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.75"/>`;
    const ents = `
      ${hitR(250, 300, 13.5)}${hitR(560, 196, 21.4)}${hitR(700, 300, 13.5)}${hitR(500, 392, 31.5)}${hitR(400, 262, 16.9)}
      <g transform="translate(220.3,262.2) scale(0.45)">${PN.stalker()}</g>
      <g transform="translate(597.6,142.9) scale(-0.47,0.47)">${PN.charger()}</g>
      <g transform="translate(720.2,252.1) scale(-0.36,0.36)">${PN.shooter(true)}</g>
      <g transform="translate(542.3,315.9) scale(-0.47,0.47)">${PN.warden()}</g>
      <g transform="translate(424,198.8) scale(-0.4,0.4)">${PN.heroSprite()}</g>`;
    const tag = (x, y, a, b, anchor = 'start') => `<g ${FONT}><text x="${x}" y="${y}" font-size="11.5" font-weight="800" fill="${C.ink}" stroke="${C.env1Light}" stroke-width="3.5" paint-order="stroke" text-anchor="${anchor}">${a}</text><text x="${x}" y="${y + 13}" font-size="10.5" font-weight="600" fill="${C.inkSoft}" stroke="${C.env1Light}" stroke-width="3" paint-order="stroke" text-anchor="${anchor}">${b}</text></g>`;
    const tags = tag(400, 302, '결 · 68px', '판정 r15', 'middle') + tag(232, 330, '들개 stalker · 40px', 'r12 · 낮고 빠른 네발') +
      tag(606, 226, '먹통 황소 charger · 56px', 'r19 · 앞쏠림 뿔', 'middle') + tag(760, 346, '붓대 포수 shooter · 48px', 'r12 · 포신+호박 예열', 'end') +
      tag(500, 420, '회벽 수문장 warden · 80px', 'r28 · 넓은 문짝 방패', 'middle') + tag(214, 372, '화염 지형 예고(imminent)', '호박 사선 → 산호 판정') +
      tag(470, 164, '백색 연쇄(아군)', '흰 심 + 청록', 'middle');
    const legend = `<g transform="translate(${W - 236},${H - 106})">
      <rect x="3" y="3" width="226" height="96" fill="${C.ink}"/><rect width="226" height="96" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>
      <rect x="10" y="10" width="26" height="14" fill="url(#hatchWarn)" stroke="${C.ink}" stroke-width="1.6"/>${txt(44, 22, '적 예고 = 호박 사선(해칭)', 11.5, C.ink, 700)}
      <circle cx="23" cy="39" r="7" fill="${C.hostile}" stroke="${C.ink}" stroke-width="3"/>${txt(44, 43, '적 판정·적탄 = 산호 + 굵은 먹테', 11.5, C.ink, 700)}
      <rect x="10" y="53" width="26" height="14" fill="${C.playerGlow}" stroke="${C.ink}" stroke-width="1.6"/><rect x="10" y="53" width="26" height="14" fill="url(#dotCy)"/>${txt(44, 65, '아군 공격 = 흰 심 + 청록 망점', 11.5, C.ink, 700)}
      <path d="M 23,74 L 29,81 L 23,88 L 17,81 Z" fill="${C.reward}" stroke="${C.ink}" stroke-width="2"/>${txt(44, 86, '보상(XP) = 연두 마름모', 11.5, C.ink, 700)}
    </g>`;
    const head = `<rect x="0" y="0" width="${W}" height="30" fill="${C.ink}"/>${txt(12, 21, '02 · 인게임 실제 크기 (1440×900 창, 카메라 1.125× · 월드 1280×800 고정 시야) — Ch.1 먹선 골목', 13.5, C.paper, 800)}
      ${txt(W - 12, 21, '점선 원 = 실제 판정(불변)', 12, C.env1, 700, 'text-anchor="end"')}`;
    return `<g transform="translate(${X},${Y})" clip-path="url(#clipS)">
      <rect width="${W}" height="${H}" fill="${C.env1Light}"/>
      <g transform="translate(0,30)">${pave}${cracks}${decal}${wall}${silInset()}${tele}${lane}${gems}${chain}${ents}${needles}${bullet}${hit}${tags}</g>
      ${legend}${head}
    </g><rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="none" stroke="${C.paper}" stroke-width="3"/>`;
  }

  function silInset() {
    const x = 530, y = 8, w = 290, h = 104;
    const items = [[PN.heroSprite(), 0.34, 10, 8], [PN.stalker(), 0.38, 58, 40], [PN.charger(), 0.4, 112, 26], [PN.shooter(false), 0.31, 176, 22], [PN.warden(), 0.38, 214, 10]];
    return `<g transform="translate(${x},${y})">
      <rect x="3" y="3" width="${w}" height="${h}" fill="${C.ink}"/><rect width="${w}" height="${h}" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>
      <g filter="url(#sil)">${items.map(([g, k, gx, gy]) => `<g transform="translate(${gx},${gy}) scale(${k})">${g}</g>`).join('')}</g>
      <rect x="0" y="${h - 22}" width="${w}" height="22" fill="${C.ink}"/>
      ${txt(8, h - 7, '색 제거 테스트 · 실루엣만으로 역할 구분', 11, C.paper, 800)}
    </g>`;
  }

  // ---------------- RIGHT BOTTOM: boss + palette ----------------
  function bossPanel() {
    const X = 744, Y = 568, W = 356, H = 408;
    const dots = PN.halftone(X, Y, X + W, Y + H, 8, (x, y) => { const d = Math.hypot(x - (X + 180), y - (Y + 170)); return Math.min(3.2, Math.max(0, (d - 90) / 120) * 3); }, C.env1Deep, 45);
    const bx = X + 50, by = Y + 38, k = 0.84;
    const badge = (n, lx, ly) => `<circle cx="${bx + lx * k}" cy="${by + ly * k}" r="11" fill="${C.ink}" stroke="${C.paper}" stroke-width="2.4"/><text x="${bx + lx * k}" y="${by + ly * k + 4.5}" ${FONT} font-size="13" font-weight="900" fill="${C.paper}" text-anchor="middle">${n}</text>`;
    const calls = badge(1, 4, 48) + badge(2, 132, 70) + badge(3, 160, 214) + badge(4, 300, 300);
    return `<g clip-path="url(#clipB)">
      <rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="${C.env1Light}"/>${dots}
      <circle cx="${X + 186}" cy="${Y + 150}" r="104" fill="${C.paper}" opacity="0.9"/><circle cx="${X + 186}" cy="${Y + 150}" r="104" fill="none" stroke="${C.ink}" stroke-width="2.4"/>
      <path d="M ${X},${Y + 318} L ${X + W},${Y + 312} L ${X + W},${Y + H} L ${X},${Y + H} Z" fill="${C.env1}"/><path d="M ${X},${Y + 318} L ${X + W},${Y + 312}" stroke="${C.ink}" stroke-width="3"/>
      <g transform="translate(${bx},${by}) scale(${k})">${PN.gaoler()}</g>
      ${calls}
      <rect x="${X}" y="${Y + H - 84}" width="${W}" height="84" fill="${C.ink}"/>
      ${txt(X + 14, Y + H - 60, '종탑 간수 <tspan font-size="12" fill="' + C.env1 + '">Ch.1 최종 · s1-final-rings · 화면 ≈160px / r54</tspan>', 20, C.paper, 900)}
      ${txt(X + 14, Y + H - 40, '① 열쇠를 치켜듦 = 링탄 예고 0.6s  ② 종 균열 = 2페이즈(66%)', 11.5, C.paperShade, 600)}
      ${txt(X + 14, Y + H - 24, '③ 철창 가슴 개방 = 3페이즈(33%)  ④ 랜턴 흑염 = 광폭화', 11.5, C.paperShade, 600)}
      ${txt(X + 14, Y + H - 8, '자전 금지 · 얼굴(종 입)이 항상 플레이어를 향함', 11, C.env1, 700)}
      <rect x="${X}" y="${Y}" width="150" height="30" fill="${C.ink}"/>${txt(X + 12, Y + 20, '03 · BOSS 언어', 13.5, C.paper, 800)}
    </g><rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="none" stroke="${C.paper}" stroke-width="3"/>`;
  }

  function palettePanel() {
    const X = 1116, Y = 568, W = 460, H = 408;
    const groups = [
      ['먹 · 종이 (세계)', [['ink.black', '#0E0E10', '외곽선·먹칠 그림자'], ['ink.soft', '#2A2A2E', '원경·먼 다리'], ['paper.base', '#F3EEE2', '주인공 코트·하이라이트'], ['paper.shade', '#D8D0C0', '종이 그림자'], ['tone.dot', 'pattern', '망점 20·40·60%']]],
      ['챕터 듀오톤 (환경만)', [['env.ch1', '#B3A68C', '먹선 골목·세피아'], ['env.ch2', '#8E97A8', '철문 예배당·납청'], ['env.ch3', '#97A396', '무채 운하·잿이끼'], ['env.ch4', '#A08C78', '시계 무덤·바랜 적동'], ['env.ch5', '#968DA0', '일식 관문·재 모브']]],
      ['신호색 (전투 정보만)', [['sig.player', '#00A8C6', '플레이어·아군 공격'], ['sig.player.deep', '#007C94', '발밑 링·아군 선'], ['sig.hostile', '#EF5B4F', '적 판정·적탄·받은 피해'], ['sig.warn', '#D88D16', '적 예고(preview)'], ['sig.reward', '#86B82D', 'XP·회복'], ['sig.elite', '#805AD5', '정예 테두리']]]
    ];
    let o = '';
    groups.forEach(([title, items], gi) => {
      const gx = X + 14 + gi * 150;
      o += txt(gx, Y + 52, title, 12, C.paper, 800);
      items.forEach(([tok, hex, role], i) => {
        const y = Y + 64 + i * 44;
        const fill = hex === 'pattern' ? 'url(#dotM)' : hex;
        o += `<rect x="${gx}" y="${y}" width="30" height="30" fill="${hex === 'pattern' ? C.paper : hex}" stroke="${C.paper}" stroke-width="1.5"/>${hex === 'pattern' ? `<rect x="${gx}" y="${y}" width="30" height="30" fill="${fill}"/>` : ''}
          <text x="${gx + 38}" y="${y + 11}" ${MONO} font-size="10.5" font-weight="700" fill="${C.paper}">${tok}</text>
          <text x="${gx + 38}" y="${y + 22}" ${MONO} font-size="9.5" fill="${C.env1}">${hex}</text>
          ${txt(gx + 38, y + 34, role, 9.5, C.paperShade, 500)}`;
      });
    });
    // rarity frames (shape, not color)
    const rx = X + 14, ry = Y + 330;
    const names = ['일반', '희귀', '영웅', '전설', '신화'];
    let fr = txt(rx, ry - 6, '등급 = 프레임 형태 · 먹점 수 (색 사용 금지)', 11.5, C.paper, 800);
    names.forEach((n, i) => {
      const x = rx + i * 88, y = ry, w = 78, h = 44, inv = i === 4;
      fr += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${inv ? C.ink : C.paper}" stroke="${inv ? C.paper : C.ink}" stroke-width="2"/>`;
      if (i >= 1) fr += `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" fill="none" stroke="${inv ? C.paper : C.ink}" stroke-width="1.2"/>`;
      if (i >= 2) fr += [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([cx, cy]) => `<path d="M ${cx - 7},${cy} L ${cx},${cy - 7} L ${cx + 7},${cy} L ${cx},${cy + 7} Z" fill="${inv ? C.paper : C.ink}"/>`).join('');
      if (i >= 3) fr += `<path d="M ${x + 10},${y + 1} L ${x + w - 10},${y + 1}" stroke="${inv ? C.ink : C.paper}" stroke-width="1" stroke-dasharray="2 2"/>`;
      for (let k = 0; k <= i; k++) fr += `<path d="M ${x + 12 + k * 9},${y + 30} l 3.5,-4 l 3.5,4 l -3.5,4 Z" fill="${inv ? C.paper : C.ink}"/>`;
      fr += txt(x + 12, y + 20, n, 11.5, inv ? C.paper : C.ink, 800);
    });
    return `<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="${C.ink}"/>
      <rect x="${X}" y="${Y}" width="150" height="30" fill="${C.paper}"/>${txt(X + 12, Y + 20, '04 · PALETTE 토큰', 13.5, C.ink, 800)}
      ${txt(X + W - 12, Y + 20, '환경 C≤0.04 · 신호 C≥0.12', 11, C.env1, 700, 'text-anchor="end"')}
      ${o}${fr}
      <rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="none" stroke="${C.paper}" stroke-width="3"/>`;
  }

  function titleBar() {
    return `${txt(28, 66, 'PAPER NOIR COMIC', 50, C.paper, 900, 'letter-spacing="1"')}
      ${txt(512, 64, '먹극화 墨劇畫', 30, C.env1, 900)}
      ${txt(30, 94, 'Blackline Survivor 리마스터 · 아트 디렉션 B — 검정으로 형태를 깎고, 색은 전투만 말한다', 15, C.paperShade, 600)}
      <g transform="translate(1576,40)">
        <rect x="-300" y="-18" width="300" height="30" fill="none" stroke="${C.paper}" stroke-width="2"/>
        ${txt(-288, 3, 'STYLE FRAME · Ch.1 먹선 골목', 14, C.paper, 800)}
        ${txt(-4, 36, '굵은 먹칠 · 망점/해칭 · 챕터 듀오톤 · 신호색 격리', 12.5, C.env1, 700, 'text-anchor="end"')}
        ${txt(-4, 56, 'Mignola 식 블랙 스팟 × 느와르 극화 · 3/4 탑다운', 12.5, C.env1, 700, 'text-anchor="end"')}
      </g>`;
  }

  PN.board = function () {
    return `<defs>${PN.defs()}${PN.heroDefs}${PN.bossDefs}
      <filter id="sil"><feColorMatrix type="matrix" values="0 0 0 0 0.055  0 0 0 0 0.055  0 0 0 0 0.063  0 0 0 1 0"/></filter>
      <clipPath id="clipL"><rect x="24" y="112" width="696" height="864"/></clipPath>
      <clipPath id="clipS"><rect x="0" y="0" width="832" height="440"/></clipPath>
      <clipPath id="clipB"><rect x="744" y="568" width="356" height="408"/></clipPath>
    </defs>
    <rect width="1600" height="1000" fill="#131315"/>
    ${PN.halftone(0, 0, 1600, 110, 10, (x, y) => Math.max(0, 1.6 - y / 70), '#26262a', 45)}
    ${titleBar()}${heroPanel()}${stripPanel()}${bossPanel()}${palettePanel()}
    <rect width="1600" height="1000" filter="url(#grain)" opacity="0.35" style="mix-blend-mode:multiply"/>`;
  };
})(window.PN);
