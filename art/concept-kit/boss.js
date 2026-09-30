// Boss 종탑 간수 (Gaoler of the Bell Tower) — Ch1 final. Local box 320 x 360, feet y≈344
(function (PN) {
  const C = PN.C, T = PN.taper, TS = PN.tapers;
  const O = (w) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round" paint-order="stroke"`;
  const S = {
    coat: 'M 104,138 L 216,138 C 238,172 250,232 262,298 L 284,336 L 256,334 L 240,322 L 222,342 L 200,326 L 178,344 L 158,326 L 138,344 L 118,326 L 98,340 L 80,322 L 62,336 L 40,334 L 60,298 C 72,232 84,172 104,138 Z',
    bell: 'M 116,122 C 118,98 122,72 134,56 C 142,44 150,40 160,40 C 170,40 178,44 186,56 C 198,72 202,98 204,122 C 212,126 218,130 218,136 L 102,136 C 102,130 108,126 116,122 Z',
    padL: 'M 90,146 C 92,126 116,118 138,128 L 134,166 C 116,172 96,166 90,146 Z',
    padR: 'M 230,146 C 228,126 204,118 182,128 L 186,166 C 204,172 224,166 230,146 Z',
    cage: 'M 128,250 L 128,196 C 128,172 192,172 192,196 L 192,250 Z',
    armL: 'M 104,146 C 84,150 62,150 50,138 C 42,122 48,102 60,88 L 84,96 C 76,108 74,118 78,126 C 88,128 100,130 112,134 Z',
    armR: 'M 222,148 C 244,168 262,192 272,216 L 250,228 C 240,206 226,188 206,170 Z',
    key: 'M 60,88 L 72,80 L 30,20 L 18,28 Z'
  };
  const defs = Object.keys(S).map((k) => `<clipPath id="g-c-${k}"><path d="${S[k]}"/></clipPath>`).join('');
  const P = (k, fill, w = 6) => `<path d="${S[k]}" fill="${fill}" ${O(w)}/>`;
  const clip = (k, inner) => `<g clip-path="url(#g-c-${k})">${inner}</g>`;
  const ht = (d, pat) => `<path d="${d}" fill="url(#${pat})"/>`;
  function chain(x0, y0, x1, y1, n) {
    let o = ''; const a = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 14;
      o += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${i % 2 ? 6 : 6.5}" ry="${i % 2 ? 2.2 : 4}" transform="rotate(${a.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="none" stroke="${C.ink}" stroke-width="4.5"/>`;
      o += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${i % 2 ? 6 : 6.5}" ry="${i % 2 ? 2.2 : 4}" transform="rotate(${a.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="none" stroke="${C.env1Light}" stroke-width="1.8"/>`;
    }
    return o;
  }
  PN.bossDefs = defs;
  PN.gaoler = function () {
    return `
    <ellipse cx="160" cy="344" rx="136" ry="16" fill="${C.ink}" opacity="0.3"/>
    <!-- sound rings (bell toll) behind -->
    <g fill="none" stroke="${C.ink}" stroke-linecap="round">
      <path d="M 92,64 C 78,78 74,100 80,120" stroke-width="4"/><path d="M 70,48 C 50,70 46,104 56,130" stroke-width="3"/><path d="M 50,34 C 24,64 20,110 34,142" stroke-width="2"/>
      <path d="M 228,64 C 242,78 246,100 240,120" stroke-width="4"/><path d="M 250,48 C 270,70 274,104 264,130" stroke-width="3"/><path d="M 270,34 C 296,64 300,110 286,142" stroke-width="2"/>
    </g>
    <g filter="url(#rough)">
    <path d="M 128,330 L 152,330 L 156,348 L 118,348 Z M 170,330 L 194,330 L 204,348 L 166,348 Z" fill="${C.ink}" ${O(4)}/>
    <path d="M 122,345 L 150,345 M 170,345 L 200,345" stroke="${C.paper}" stroke-width="2"/>
    <!-- coat -->
    ${P('coat', C.ink)}
    ${clip('coat', TS([[110, 150, 92, 230, 70, 320, 3.5, 'mid'], [212, 150, 232, 230, 254, 318, 4, 'mid'], [140, 250, 136, 290, 128, 334, 3, 'mid'], [182, 250, 188, 290, 196, 336, 3, 'mid'], [160, 262, 160, 300, 160, 336, 2.4, 'mid']], C.paper, 'opacity="0.55"') +
      ht('M 214,140 C 240,180 252,240 266,300 L 290,340 L 230,340 C 226,290 220,220 206,150 Z', 'dotEnv') + T([218, 142, 244, 220, 270, 318], 3.2, 'mid', C.paper))}
    <!-- back arm (viewer left) + great key -->
    ${P('armL', C.ink)}
    ${clip('armL', T([100, 140, 70, 142, 56, 118], 2.6, 'mid', C.paper, 'opacity="0.6"'))}
    <circle cx="80" cy="106" r="15" fill="none" stroke="${C.ink}" stroke-width="11"/>
    <circle cx="80" cy="106" r="15" fill="none" stroke="${C.env1Light}" stroke-width="4.5"/>
    ${P('key', C.env1Light, 5)}
    ${clip('key', `<path d="M 60,88 L 66,84 L 24,24 L 18,28 Z" fill="url(#dotEnv)"/>`)}
    <path d="M 24,18 L 12,8 L 4,18 L 12,24 L 4,32 L 14,40 L 22,32 L 30,38 Z" fill="${C.env1Light}" ${O(4.5)}/>
    ${clip('key', '')}
    <path d="M 8,20 L 14,24 M 10,32 L 16,34" stroke="${C.ink}" stroke-width="2"/>
    <path d="M 56,80 C 62,70 80,70 86,80 L 88,100 C 80,108 64,108 58,100 Z" fill="${C.ink}" ${O(4)}/>
    ${T([62, 84, 70, 78, 80, 80], 2, 'mid', C.paper, 'opacity="0.75"')}
    <!-- strike arc (windup cue) -->
    <path d="M 30,6 C 70,-12 118,4 138,30" fill="none" stroke="${C.ink}" stroke-width="2" stroke-dasharray="6 5"/>
    <path d="M 132,22 L 140,32 L 128,32 Z" fill="${C.ink}"/>
    <!-- chest cage with captive glow -->
    ${P('cage', C.paper, 5)}
    ${clip('cage', `<ellipse cx="160" cy="218" rx="24" ry="30" fill="${C.env1Light}"/><path d="M 150,250 C 150,232 154,220 160,216 C 166,220 170,232 170,250 Z M 160,214 m -6,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0" fill="${C.inkSoft}" opacity="0.8"/>` + ht('M 120,170 L 200,170 L 200,196 L 120,206 Z', 'dotEnv') + [0, 1, 2, 3, 4].map((i) => `<path d="M ${136 + i * 12},170 L ${136 + i * 12},252" stroke="${C.ink}" stroke-width="5"/>`).join('') + `<path d="M 124,214 L 196,214" stroke="${C.ink}" stroke-width="4"/>`)}
    <!-- chain across chest -->
    ${chain(112, 160, 208, 262, 12)}
    <!-- key ring at hip -->
    <circle cx="214" cy="270" r="16" fill="none" stroke="${C.ink}" stroke-width="8"/>
    <circle cx="214" cy="270" r="16" fill="none" stroke="${C.env1Light}" stroke-width="3"/>
    ${[[200, 284, 196, 308], [210, 286, 210, 312], [222, 285, 228, 306]].map(([a, b, c, d]) => `<path d="M ${a},${b} L ${c},${d}" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><path d="M ${a},${b} L ${c},${d}" stroke="${C.env1Light}" stroke-width="3" stroke-linecap="round"/><path d="M ${c - 3},${d - 4} l 6,2" stroke="${C.ink}" stroke-width="2"/>`).join('')}
    <!-- front arm (viewer right) + lantern -->
    ${P('armR', C.ink)}
    ${clip('armR', T([230, 158, 252, 184, 266, 214], 3.4, 'mid', C.paper, 'opacity="0.75"'))}
    <path d="M 248,214 C 254,204 272,204 280,214 L 280,234 C 272,242 256,242 250,234 Z" fill="${C.ink}" ${O(4)}/>
    <path d="M 266,240 L 270,262" stroke="${C.ink}" stroke-width="3"/>
    <g transform="translate(20,-14)">
      <circle cx="252" cy="298" r="30" fill="${C.paper}" opacity="0.22"/>
      <path d="M 240,278 L 264,278 L 270,290 L 266,316 L 238,316 L 234,290 Z" fill="${C.paper}" ${O(4.5)}/>
      <path d="M 244,282 L 244,314 M 252,280 L 252,316 M 260,282 L 260,314" stroke="${C.ink}" stroke-width="2.4"/>
      <path d="M 238,276 L 266,276 L 262,270 L 242,270 Z M 236,316 L 268,316 L 264,322 L 240,322 Z" fill="${C.ink}" ${O(3)}/>
    </g>
    <!-- pauldrons -->
    ${P('padL', C.env1Deep)}
    ${clip('padL', ht('M 80,120 L 140,120 L 140,176 L 80,176 Z', 'dotL') + T([98, 138, 114, 128, 134, 130], 3, 'mid', C.paper, 'opacity="0.85"') + `<path d="M 88,150 C 104,164 120,166 136,160 L 136,180 L 88,180 Z" fill="${C.ink}"/>`)}
    ${P('padR', C.env1Deep)}
    ${clip('padR', ht('M 180,120 L 240,120 L 240,176 L 180,176 Z', 'dotS') + T([188, 130, 208, 126, 224, 138], 3.4, 'mid', C.paper) + `<path d="M 184,160 C 200,166 216,164 232,150 L 232,180 L 184,180 Z" fill="${C.ink}"/>`)}
    ${[[104, 138], [120, 132], [200, 132], [216, 138]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.5"/>`).join('')}
    <!-- BELL HEAD -->
    ${P('bell', C.ink)}
    ${clip('bell', ht('M 100,40 L 150,40 C 140,70 136,100 138,136 L 100,136 Z', 'dotEnv') +
      `<path d="M 100,108 L 220,108 L 220,116 L 100,116 Z" fill="${C.env1Deep}"/><path d="M 100,120 L 220,120 L 220,124 L 100,124 Z" fill="${C.env1Deep}"/>` +
      TS([[176, 52, 190, 80, 196, 120, 5, 'mid'], [168, 50, 176, 70, 180, 100, 2, 'mid']], C.paper) +
      `<path d="M 150,62 L 144,76 L 152,84 L 146,98" fill="none" stroke="${C.paper}" stroke-width="2.2"/>`)}
    <path d="M 150,42 C 146,20 174,20 170,42 L 164,42 C 166,30 154,30 156,42 Z" fill="${C.ink}" ${O(4)}/>
    <!-- bell mouth: darkness + single eye + clapper jaw -->
    <ellipse cx="160" cy="136" rx="56" ry="9" fill="${C.ink}" stroke="${C.ink}" stroke-width="4"/>
    <path d="M 108,134 A 56 9 0 0 0 212,134" fill="none" stroke="${C.env1Light}" stroke-width="2.4"/>
    <path d="M 146,136 Q 160,128 174,136 Q 160,142 146,136 Z" fill="${C.paper}"/>
    <circle cx="160" cy="135.5" r="3" fill="${C.ink}"/>
    <path d="M 160,142 L 160,162" stroke="${C.ink}" stroke-width="6"/>
    <circle cx="160" cy="172" r="12" fill="${C.env1Light}" ${O(5)}/>
    ${T([154, 166, 160, 162, 167, 166], 2.2, 'mid', C.paper)}
    </g>
    `;
  };
})(window.PN);
