// Hero "결 (GYEOL)" — full-body illustration, local box 480 x 640 (feet ground y≈580)
(function (PN) {
  const C = PN.C, T = PN.taper, TS = PN.tapers;
  const OL = `stroke="${C.ink}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"`;
  const OLt = `stroke="${C.ink}" stroke-width="4" stroke-linejoin="round" paint-order="stroke"`;

  // ---- shape library (ids used for fill + clip) ----
  const S = {
    tailA: 'M 246,204 C 220,192 196,170 162,174 C 132,178 116,158 84,156 C 66,155 54,148 38,136 L 50,158 L 22,164 C 48,180 70,184 92,182 C 120,180 136,200 166,200 C 198,200 222,216 248,224 Z',
    tailB: 'M 242,218 C 214,232 190,254 160,260 C 134,266 116,284 86,290 L 102,300 L 76,310 C 108,314 132,302 158,290 C 188,276 216,254 248,234 Z',
    flare: 'M 214,336 C 190,356 150,374 96,380 C 76,382 58,378 38,370 L 70,398 C 60,420 44,440 18,456 C 66,458 108,470 150,466 C 180,462 206,470 240,480 L 254,346 Z',
    lining: 'M 18,456 C 42,436 80,432 114,450 C 84,450 56,452 18,456 Z M 38,370 C 58,378 78,384 98,380 C 88,388 80,394 70,398 Z',
    bshin: 'M 190,430 C 170,462 150,492 132,524 L 102,510 C 118,482 138,452 160,422 Z',
    bfoot: 'M 128,512 L 104,502 C 96,512 88,524 80,536 L 66,552 L 96,558 C 104,546 116,530 128,512 Z',
    barmU: 'M 216,228 C 196,244 180,264 166,286 L 190,300 C 200,280 212,264 226,252 Z',
    barmF: 'M 166,282 C 156,298 146,312 136,324 L 158,340 C 168,326 180,312 192,296 Z',
    fthigh: 'M 252,354 C 284,370 322,398 352,432 L 328,466 C 300,436 270,414 240,394 Z',
    fshin: 'M 330,438 L 356,444 C 354,480 350,514 350,548 L 322,550 C 322,514 326,478 330,438 Z',
    ffoot: 'M 318,540 L 350,540 C 366,548 384,556 394,566 L 392,580 L 314,580 Z',
    torso: 'M 238,210 C 220,212 200,218 190,232 C 182,258 184,290 194,318 C 198,336 204,352 214,366 L 290,368 C 296,346 304,322 310,300 C 316,272 322,248 318,228 C 304,214 288,208 270,210 Z',
    vest: 'M 256,214 L 288,214 C 282,250 278,300 274,340 L 250,340 C 250,300 252,252 256,214 Z',
    lapelL: 'M 238,212 L 258,212 C 256,240 252,262 246,284 C 240,262 238,236 238,212 Z',
    lapelR: 'M 286,212 L 300,216 C 296,238 290,258 280,276 C 282,254 284,232 286,212 Z',
    fpanel: 'M 262,344 C 282,378 302,420 322,466 C 302,480 276,484 250,478 C 248,440 248,390 250,344 Z',
    belt: 'M 202,324 C 232,334 270,336 302,328 L 302,346 C 270,354 232,352 204,342 Z',
    band: 'M 294,214 L 312,226 L 224,340 L 206,328 Z',
    farmU: 'M 296,216 C 318,208 344,218 368,230 L 362,266 C 340,260 318,258 298,262 Z',
    farmF: 'M 352,234 C 370,226 390,218 408,210 L 417,240 C 398,247 380,257 363,268 Z',
    cuff: 'M 400,214 L 413,209 L 420,237 L 407,242 Z',
    hand: 'M 413,210 C 422,202 434,200 444,204 L 450,212 L 468,204 L 471,211 L 452,220 L 472,222 L 471,230 L 451,230 L 465,240 L 460,246 L 444,236 C 436,244 424,246 418,240 Z',
    thumb: 'M 426,206 L 434,188 L 441,190 L 438,208 Z',
    collar: 'M 230,188 L 242,216 L 300,216 L 306,192 C 292,200 270,204 252,200 Z',
    wrap: 'M 234,194 C 252,208 284,210 306,196 L 310,214 C 292,230 254,230 232,216 Z',
    knot: 'M 236,206 C 244,200 256,204 258,214 C 256,224 244,228 236,222 C 232,216 232,210 236,206 Z',
    hair: 'M 240,128 C 226,146 214,170 196,190 C 208,186 218,182 228,178 C 220,192 214,204 206,214 C 224,204 238,190 246,172 L 250,134 Z',
    face: 'M 238,134 C 234,152 236,170 244,184 L 256,198 C 266,205 278,206 288,200 C 293,196 295,190 294,185 L 298,182 L 295,179 L 297,177 L 301,173 C 306,171 306,166 302,161 L 298,150 C 296,144 294,138 292,134 Z',
    brim: 'M 391,127 A 150 36 8 1 1 91,85 A 150 36 8 1 1 391,127 Z',
    crown: 'M 200.5,91.6 L 215,31 A 40 10 8 0 1 294.2,42.2 L 291.5,104.4 A 46 11 8 0 1 200.5,91.6 Z',
    blade: 'M 133,347.5 L 55,444 L 24,488 L 61.5,450 L 143,356.5 Z'
  };
  const clipDefs = Object.keys(S).map((k) => `<clipPath id="h-c-${k}"><path d="${S[k]}"/></clipPath>`).join('');
  const P = (k, fill, extra = OL) => `<path d="${S[k]}" fill="${fill}" ${extra}/>`;
  const clip = (k, inner) => `<g clip-path="url(#h-c-${k})">${inner}</g>`;
  const ht = (d, pat) => `<path d="${d}" fill="url(#${pat})"/>`;

  // chin-strap beads
  function beads(p0, p1, p2, n, r) {
    let o = '';
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
      o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${C.ink}"/><circle cx="${(x + r * 0.35).toFixed(1)}" cy="${(y - r * 0.35).toFixed(1)}" r="${(r * 0.32).toFixed(2)}" fill="${C.paper}"/>`;
    }
    return o;
  }

  // needle projectile (flying) from back (x0,y0) to tip (x1,y1)
  function needle(x0, y0, x1, y1, w) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const b1 = [x0 + nx * w, y0 + ny * w], b2 = [x0 - nx * w, y0 - ny * w];
    const m1 = [x0 + ux * L * 0.72 + nx * w * 0.9, y0 + uy * L * 0.72 + ny * w * 0.9], m2 = [x0 + ux * L * 0.72 - nx * w * 0.9, y0 + uy * L * 0.72 - ny * w * 0.9];
    const eye = [x0 + ux * w * 2.2, y0 + uy * w * 2.2];
    const q = (p) => p[0].toFixed(1) + ',' + p[1].toFixed(1);
    // motion streaks behind
    const s1 = T([x0 - ux * 8, y0 - uy * 8, x0 - ux * 24 + nx * 2, y0 - uy * 24 + ny * 2, x0 - ux * 52 + nx * 4, y0 - uy * 52 + ny * 4], w * 1.5, 'start', C.player, 'opacity="0.85"');
    const s2 = T([x0 - ux * 6 + nx * 7, y0 - uy * 6 + ny * 7, x0 - ux * 20 + nx * 8, y0 - uy * 20 + ny * 8, x0 - ux * 38 + nx * 10, y0 - uy * 38 + ny * 10], w * 0.45, 'start', C.ink);
    const s3 = T([x0 - ux * 6 - nx * 7, y0 - uy * 6 - ny * 7, x0 - ux * 18 - nx * 8, y0 - uy * 18 - ny * 8, x0 - ux * 34 - nx * 9, y0 - uy * 34 - ny * 9], w * 0.4, 'start', C.ink);
    return `${s1}${s2}${s3}
      <path d="M${q(b1)} L${q(m1)} L${x1},${y1} L${q(m2)} L${q(b2)} Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"/>
      <path d="M${q(m1)} L${x1},${y1} L${q(m2)} Z" fill="${C.player}"/>
      <ellipse cx="${eye[0].toFixed(1)}" cy="${eye[1].toFixed(1)}" rx="${(w * 1.1).toFixed(1)}" ry="${(w * 0.45).toFixed(1)}" transform="rotate(${(Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1)} ${eye[0].toFixed(1)} ${eye[1].toFixed(1)})" fill="${C.ink}"/>
      <circle cx="${x1}" cy="${y1}" r="${w * 2.4}" fill="${C.playerGlow}" opacity="0.55" filter="url(#glowC)"/>`;
  }


  function ringArcs(cx, cy, rx, ry, off, span, w, col) {
    let o = '';
    for (let k = 0; k < 4; k++) {
      const a0 = (off + k * 90 - span / 2) * Math.PI / 180, a1 = (off + k * 90 + span / 2) * Math.PI / 180;
      const p0 = [cx + rx * Math.cos(a0), cy + ry * Math.sin(a0)], p1 = [cx + rx * Math.cos(a1), cy + ry * Math.sin(a1)];
      o += `<path d="M ${p0[0].toFixed(1)},${p0[1].toFixed(1)} A ${rx} ${ry} 0 0 1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}"/>`;
    }
    return `<g fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round">${o}</g>`;
  }
  function fingers() {
    const F = [[444, 214, 476, 198], [446, 220, 482, 212], [446, 226, 480, 228], [442, 232, 470, 244]];
    let o = '';
    F.forEach(([x0, y0, x1, y1]) => { o += `<path d="M ${x0},${y0} L ${x1},${y1}" stroke="${C.ink}" stroke-width="10" stroke-linecap="round"/>`; });
    F.forEach(([x0, y0, x1, y1]) => { o += `<path d="M ${x0},${y0} L ${x1},${y1}" stroke="${C.ink}" stroke-width="6.5" stroke-linecap="round"/><path d="M ${x0 + 4},${y0 - 3} L ${x1 - 1},${y1 - 3}" stroke="${C.paper}" stroke-width="1.1" stroke-linecap="round" opacity="0.85"/>`; });
    return o;
  }

  PN.heroDefs = clipDefs;
  PN.hero = function () {
    const head = `
      ${P('hair', C.ink, OLt)}
      ${T([236, 150, 220, 176, 204, 204], 1.4, 'mid', C.paper, 'opacity="0.55"')}
      ${P('face', C.paper)}
      ${clip('face', ht('M 266,168 L 276,170 C 274,182 276,196 284,210 L 272,210 C 266,204 262,198 264,192 C 262,184 263,176 266,168 Z', 'dotM') + ht('M 284,166 L 300,156 L 304,160 C 296,166 290,170 282,172 Z', 'dotS') +
        `<path d="M 226,126 L 310,126 L 310,150 L 300,154 C 296,160 291,163 285,166 C 279,164 274,170 268,169 C 264,176 262,184 264,192 C 262,198 266,204 272,210 L 226,210 Z" fill="${C.ink}"/>` +
        `<path d="M 246,172 C 252,182 260,192 270,200 C 258,198 250,190 244,184 Z" fill="${C.ink}"/>` +
        T([278, 196, 286, 198, 292, 192], 1.5, 'mid', C.ink) + T([299, 162, 304, 166, 302, 172], 1.4, 'mid', C.ink))}
      <path d="M 274,158 Q 283,151.5 293,155.5 Q 284,161 274,158 Z" fill="${C.paper}"/>
      <circle cx="286.5" cy="156.5" r="2.2" fill="${C.ink}"/>
      ${T([284, 187, 291, 186.5, 297.5, 184], 2, 'mid', C.ink)}
      ${T([240, 166, 244, 186, 262, 202], 1.8, "mid", C.paper, 'opacity="0.55"')}`;
    const hat = `
      ${P('brim', C.ink)}
      <g clip-path="url(#h-c-brim)" fill="none" stroke="${C.paper}" stroke-width="1.1" opacity="0.2">
        <ellipse cx="240" cy="106" rx="124" ry="29" transform="rotate(8 240 106)"/>
        <ellipse cx="240" cy="106" rx="100" ry="23" transform="rotate(8 240 106)"/>
        <ellipse cx="240" cy="106" rx="76" ry="18" transform="rotate(8 240 106)"/>
      </g>
      <path d="M 318.6,85.5 A 150 36 8 0 1 387.1,120.3" fill="none" stroke="${C.paper}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M 120,128 A 150 36 8 0 0 240,142" fill="none" stroke="${C.paper}" stroke-width="1.5" opacity="0.45"/>
      ${P('crown', C.ink)}
      <ellipse cx="254.6" cy="36.6" rx="40" ry="10" transform="rotate(8 254.6 36.6)" fill="${C.inkSoft}" stroke="${C.ink}" stroke-width="3"/>
      <path d="M 277,40 L 287,42 L 284,100 L 275,98 Z" fill="${C.paper}" opacity="0.9"/>
      <path d="M 266,39 L 270,39.5 L 268,98 L 264,97.5 Z" fill="${C.paper}" opacity="0.45"/>
      <path d="M 202,86 A 46 11 8 0 0 290,99" fill="none" stroke="${C.paper}" stroke-width="2" opacity="0.55"/>`;
    return `
    <!-- ground: cast shadow + player signal ring (in-game identity) -->
    <ellipse cx="238" cy="584" rx="178" ry="25" fill="${C.ink}" opacity="0.2"/>
    ${ringArcs(238, 584, 150, 26, 25, 46, 6, C.player)}
    <ellipse cx="238" cy="584" rx="118" ry="15" fill="${C.ink}" opacity="0.5"/>

    <g filter="url(#rough)">
    <!-- coat back flare + black lining -->
    ${P('flare', C.paper)}
    ${clip('flare', ht('M 214,352 Q 150,378 60,392 L 60,446 Q 160,420 226,372 Z', 'dotS') + ht('M 226,372 Q 160,420 60,446 L 10,460 L 150,470 Q 200,446 238,396 Z', 'dotM') + `<path d="M 238,396 Q 204,442 150,468 L 252,484 L 256,346 Z" fill="${C.ink}"/>` + ht('M 232,380 Q 190,430 140,462 L 150,468 Q 204,442 238,396 Z', 'dotL') +
      TS([[214, 352, 150, 378, 66, 394, 7, 'mid'], [226, 372, 160, 420, 56, 448, 6.5, 'mid'], [238, 396, 200, 446, 150, 466, 5, 'mid'], [248, 420, 236, 450, 226, 474, 3, 'mid']], C.ink) + T([214, 340, 150, 368, 44, 372], 2.6, 'mid', C.paper))}
    ${P('lining', C.ink, OLt)}
    ${T([30, 452, 70, 440, 110, 450], 1.6, 'mid', C.paper, 'opacity="0.8"')}

    <!-- back leg -->
    ${P('bshin', C.ink)}
    ${clip('bshin', [0, 1, 2, 3].map((i) => `<path d="M ${170 - i * 14},${444 + i * 20} L ${196 - i * 14},${454 + i * 20} L ${188 - i * 14},${466 + i * 20} L ${160 - i * 14},${456 + i * 20} Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="2"/>`).join('') + ht('M 90,420 L 200,420 L 200,540 L 90,540 Z', 'dotM'))}
    ${P('bfoot', C.ink)}
    ${T([100, 506, 90, 526, 80, 546], 1.8, 'mid', C.paper, 'opacity="0.7"')}

    <!-- front leg -->
    ${P('fthigh', C.ink)}
    ${P('fshin', C.ink)}
    ${clip('fshin', [0, 1, 2, 3].map((i) => `<path d="M 318,${466 + i * 20} L 360,${454 + i * 20} L 360,${466 + i * 20} L 318,${478 + i * 20} Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.2"/>`).join('') + ht('M 316,440 L 332,440 L 330,560 L 316,560 Z', 'dotM') + T([353, 448, 351, 498, 348, 544], 2.6, 'mid', C.paper))}
    ${P('ffoot', C.ink)}
    ${T([346, 546, 372, 552, 390, 568], 2.4, 'mid', C.paper)}
    <path d="M 316,573 L 392,573" stroke="${C.paper}" stroke-width="1.6" opacity="0.6"/>
    </g>

    <!-- UPPER BODY (leans into the throw) -->
    <g transform="rotate(9 236 352)">
    <g filter="url(#rough)">
    <!-- ink thread from the needle-sword eye: calligraphic line behind the figure -->
    ${T([168, 316, 110, 296, 40, 352, 18, 290], 7, 'mid', C.paper)}${T([18, 290, -2, 236, 44, 210, 14, 160], 6.4, 'mid', C.paper)}${T([14, 160, -10, 120, 6, 84, 40, 70], 5.2, 'start', C.paper)}
    ${T([168, 316, 110, 296, 40, 352, 18, 290], 3.4, 'mid', C.ink)}
    ${T([18, 290, -2, 236, 44, 210, 14, 160], 3.0, 'mid', C.ink)}
    ${T([14, 160, -10, 120, 6, 84, 40, 70], 2.2, 'start', C.ink)}
    <!-- scarf tails (behind) -->
    ${P('tailB', C.player)}
    ${clip('tailB', `<path d="M 70,300 C 120,296 170,280 250,238 L 250,330 L 60,330 Z" fill="${C.playerDeep}"/>` + ht('M 60,280 C 120,286 180,262 250,226 L 250,250 L 60,300 Z', 'dotCy') + T([236, 226, 190, 250, 110, 284], 3, 'start', C.playerGlow))}
    ${P('tailA', C.player)}
    ${clip('tailA', `<path d="M 20,168 C 60,186 110,186 150,192 C 190,198 222,212 250,222 L 250,240 L 20,240 Z" fill="${C.playerDeep}"/>` + ht('M 20,160 C 70,176 120,176 160,184 C 200,190 226,206 250,214 L 250,222 L 20,190 Z', 'dotCy') + T([240, 200, 180, 174, 60, 150], 3.4, 'start', C.playerGlow) + T([206, 206, 150, 194, 96, 176], 2, 'mid', C.ink))}

    <!-- back arm + needle-sword -->
    ${P('barmU', C.paper)}
    ${clip('barmU', `<path d="M 150,220 L 240,220 L 240,320 L 150,320 Z" fill="${C.ink}"/>` + T([214, 232, 196, 250, 174, 282], 2.6, 'mid', C.paper))}
    ${P('blade', C.paper)}
    ${clip('blade', `<path d="M 138,352 L 24,488 L 60.8,449.4 L 141.8,355.2 Z" fill="url(#dotM)"/>`)}
    ${T([138, 352, 90, 409, 42, 466], 1.8, 'start', C.ink)}
    ${T([133, 347.5, 96, 393, 58, 440], 1.6, 'mid', C.paper)}
    <path d="M 26,470 L 29,482 L 41,485 L 29,488 L 26,500 L 23,488 L 11,485 L 23,482 Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M 126,350 L 142,338 L 150,346 L 134,360 Z" fill="${C.ink}"/>
    ${P('barmF', C.paper)}
    ${clip('barmF', `<path d="M 130,270 L 200,270 L 200,350 L 130,350 Z" fill="${C.ink}"/>` + T([170, 288, 158, 304, 142, 322], 2.4, 'mid', C.paper))}
    <path d="M 134,322 L 158,338 L 152,348 L 128,334 Z" fill="${C.ink}" ${OLt}/>
    <circle cx="146" cy="344" r="13" fill="${C.ink}" ${OLt}/>
    ${T([139, 337, 147, 333, 155, 339], 2, 'mid', C.paper, 'opacity="0.75"')}
    <path d="M 150,330 L 164,314 L 172,320 L 158,336 Z" fill="${C.ink}" ${OLt}/>
    <ellipse cx="168" cy="316" rx="6" ry="3" transform="rotate(-48 168 316)" fill="${C.paper}"/>
    <path d="M 168,316 C 200,294 200,352 208,352" fill="none" stroke="${C.ink}" stroke-width="1.8"/>
    <path d="M 20,498 q -4,8 0,12 q 4,-4 0,-12 Z M 27,518 q -3,6 0,9 q 3,-3 0,-9 Z" fill="${C.ink}"/>

    <!-- torso coat -->
    ${P('torso', C.paper)}
    ${clip('torso', ht('M 180,206 L 238,212 C 232,252 226,296 232,344 L 180,380 Z', 'dotM') + `<path d="M 180,206 L 214,212 C 210,234 204,250 210,266 C 202,282 206,300 214,318 C 206,330 210,346 216,372 L 180,380 Z" fill="${C.ink}"/>` + `<path d="M 298,254 C 310,258 316,266 320,278 L 312,304 C 308,286 302,270 292,260 Z" fill="${C.ink}"/>` + TS([[296, 266, 282, 296, 272, 328, 3, 'mid'], [210, 246, 218, 282, 214, 322, 2.6, 'mid'], [300, 228, 312, 238, 318, 252, 2.2, 'mid']], C.ink))}
    ${P('vest', C.ink, OLt)}
    ${T([282, 222, 278, 280, 272, 334], 2.4, 'mid', C.paper, 'opacity="0.9"')}
    ${P('lapelL', C.paper, OLt)}${clip('lapelL', ht('M 236,210 L 250,210 L 246,290 L 236,290 Z', 'dotM'))}
    ${P('lapelR', C.paper, OLt)}
    ${[0.12, 0.27, 0.42, 0.57, 0.72].map((t) => {
      const x = 303 - t * 88, y = 220 + t * 114; const tx = x + 16, ty = y - 22;
      return `<path d="M ${x},${y} L ${tx},${ty}" stroke="${C.ink}" stroke-width="5.5" stroke-linecap="round"/><path d="M ${x},${y} L ${tx},${ty}" stroke="${C.paper}" stroke-width="2.4" stroke-linecap="round"/><circle cx="${tx}" cy="${ty}" r="1.7" fill="${C.player}"/>`;
    }).join('')}
    ${P('band', C.ink, OLt)}
    ${[0.12, 0.27, 0.42, 0.57, 0.72].map((t) => `<rect x="${300 - t * 88}" y="${218 + t * 114}" width="7" height="5" transform="rotate(-52 ${303 - t * 88} ${220 + t * 114})" fill="${C.paper}" opacity="0.85"/>`).join('')}
    ${P('fpanel', C.paper)}
    ${clip('fpanel', ht('M 246,340 L 266,340 C 272,390 270,440 262,486 L 246,486 Z', 'dotM') + ht('M 290,420 L 330,470 L 250,490 Z', 'dotS') + TS([[262, 356, 272, 410, 264, 472, 3.2, 'mid'], [284, 362, 298, 414, 306, 464, 2.6, 'mid']], C.ink))}
    ${P('belt', C.ink, OLt)}
    <rect x="258" y="330" width="16" height="18" rx="2" fill="${C.paper}" stroke="${C.ink}" stroke-width="3"/>
    <rect x="263" y="335" width="6" height="8" fill="${C.ink}"/>
    <rect x="196" y="340" width="16" height="22" rx="3" fill="${C.paper}" stroke="${C.ink}" stroke-width="3"/>
    ${[0, 1, 2, 3].map((i) => `<path d="M 198,${346 + i * 4} L 210,${345 + i * 4}" stroke="${C.ink}" stroke-width="1.6"/>`).join('')}

    <!-- front arm (throwing) -->
    ${P('farmU', C.paper)}
    ${clip('farmU', ht('M 296,244 C 320,244 344,248 368,254 L 368,270 L 296,270 Z', 'dotM') + T([318, 230, 336, 236, 352, 248], 2.4, 'mid', C.ink))}
    ${P('farmF', C.paper)}
    ${clip('farmF', ht('M 356,248 C 376,240 396,232 420,226 L 420,270 L 356,270 Z', 'dotM') + TS([[362, 244, 372, 240, 382, 250, 2.4, 'mid'], [380, 236, 392, 232, 398, 240, 2, 'mid']], C.ink))}
    ${T([300, 216, 334, 212, 366, 230], 2.6, 'mid', C.playerGlow)}${T([366, 232, 390, 220, 408, 212], 2.2, 'mid', C.playerGlow)}
    ${P('cuff', C.ink, OLt)}
    <path d="M 414,212 C 424,204 438,204 448,212 L 450,232 C 440,242 426,244 418,240 Z" fill="${C.ink}" ${OLt}/>
    ${fingers()}
    <path d="M 428,208 L 436,188" stroke="${C.ink}" stroke-width="11" stroke-linecap="round"/><path d="M 428,208 L 436,188" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
    ${T([434, 210, 442, 208, 448, 214], 1.6, 'mid', C.paper, 'opacity="0.8"')}

    <!-- collar, scarf wrap, knot -->
    ${P('collar', C.paper, OLt)}${clip('collar', ht('M 228,186 L 256,186 L 256,220 L 228,220 Z', 'dotM'))}
    ${P('wrap', C.player)}
    ${clip('wrap', `<path d="M 228,210 C 252,222 286,222 312,206 L 312,240 L 228,240 Z" fill="${C.playerDeep}"/>` + ht('M 228,200 L 250,200 L 250,240 L 228,240 Z', 'dotCy') + T([262, 207, 282, 208, 302, 200], 3, 'mid', C.playerGlow))}
    ${P('knot', C.player, OLt)}${clip('knot', `<path d="M 230,214 L 262,214 L 262,232 L 230,232 Z" fill="${C.playerDeep}"/>`)}

    <!-- head (scaled up for proportion) -->
    <g transform="translate(262 200) scale(1.35) translate(-262 -200)">${head}</g>
    </g>
    <!-- hat (gat) -->
    <g filter="url(#roughS)" transform="translate(262 95) scale(0.86) translate(-240 -106)">${hat}</g>
    ${beads([276, 210], [262, 232], [240, 256], 7, 2.5)}
    ${beads([280, 211], [274, 236], [258, 262], 7, 2.3)}
    <circle cx="278" cy="209" r="4" fill="${C.ink}"/>
    <!-- needles in flight + ink threads -->
    <g fill="none" stroke="${C.ink}" stroke-width="1.5">
      <path d="M 474,198 C 490,190 494,184 506,178"/><path d="M 480,212 C 496,212 504,212 520,212"/><path d="M 478,230 C 492,240 498,248 512,250"/>
    </g>
    ${needle(506, 178, 590, 128, 4.2)}
    ${needle(520, 212, 614, 196, 4.4)}
    ${needle(512, 250, 596, 262, 4)}
    </g>
    `;
  };
})(window.PN);
