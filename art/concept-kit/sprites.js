// In-game scale sprites (drawn big in local boxes, scaled down on the board). All face RIGHT.
(function (PN) {
  const C = PN.C, T = PN.taper;
  const O = (w) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round" paint-order="stroke"`;
  let uid = 0;
  function clipOf(d) { const id = 'sc' + (uid++); return { id, def: `<clipPath id="${id}"><path d="${d}"/></clipPath>` }; }
  function shaded(d, fill, w, inner) { const c = clipOf(d); return `<defs>${c.def}</defs><path d="${d}" fill="${fill}" ${O(w)}/><g clip-path="url(#${c.id})">${inner}</g>`; }

  // ---------- HERO sprite: box 120 x 170, feet at (60,158) ----------
  PN.heroSprite = function () {
    const coat = 'M 44,64 L 80,62 C 86,84 90,104 96,126 C 80,132 62,132 46,130 C 36,134 22,134 10,128 C 22,116 32,104 38,90 C 40,80 42,72 44,64 Z';
    return `
      <ellipse cx="60" cy="158" rx="46" ry="11" fill="${C.ink}" opacity="0.28"/>
      <path d="M 16,158 A 44 15 0 0 1 36,145" fill="none" stroke="${C.player}" stroke-width="5" stroke-linecap="round"/>
      <path d="M 84,145 A 44 15 0 0 1 104,158" fill="none" stroke="${C.player}" stroke-width="5" stroke-linecap="round"/>
      <path d="M 100,166 A 44 15 0 0 1 60,173" fill="none" stroke="${C.player}" stroke-width="5" stroke-linecap="round"/>
      <path d="M 44,172 A 44 15 0 0 1 18,164" fill="none" stroke="${C.player}" stroke-width="5" stroke-linecap="round"/>
      <!-- scarf tail -->
      <path d="M 50,62 C 36,58 24,50 6,50 L 14,58 L 2,64 C 20,68 34,70 52,72 Z" fill="${C.player}" ${O(5)}/>
      <!-- legs -->
      <path d="M 46,124 L 38,152 L 50,154 L 58,126 Z" fill="${C.ink}" ${O(4)}/>
      <path d="M 68,124 L 80,150 L 92,150 L 80,122 Z" fill="${C.ink}" ${O(4)}/>
      <path d="M 36,150 L 52,150 L 54,158 L 32,158 Z M 78,148 L 94,148 L 100,156 L 78,156 Z" fill="${C.ink}" ${O(4)}/>
      <path d="M 41,140 L 53,142 M 76,136 L 86,134" stroke="${C.paper}" stroke-width="3"/>
      <!-- coat -->
      ${shaded(coat, C.paper, 6, `<path d="M 10,60 L 52,60 C 50,90 52,110 58,134 L 0,134 Z" fill="url(#dotL)"/><path d="M 0,110 L 40,100 C 44,114 46,124 48,134 L 0,134 Z" fill="${C.ink}"/>`)}
      <path d="M 60,66 L 70,66 L 66,104 L 58,104 Z" fill="${C.ink}"/>
      <path d="M 78,66 L 50,102" stroke="${C.ink}" stroke-width="5"/>
      <!-- arm + needle -->
      <path d="M 76,70 C 88,72 98,76 106,72 L 108,82 C 98,86 86,84 74,82 Z" fill="${C.paper}" ${O(5)}/>
      <circle cx="109" cy="77" r="5" fill="${C.ink}"/>
      <!-- head -->
      <path d="M 52,44 C 50,56 54,64 62,68 C 70,70 76,66 78,58 L 80,50 L 76,44 Z" fill="${C.paper}" ${O(5)}/>
      <path d="M 50,42 L 80,44 L 80,52 C 74,54 68,52 62,56 L 52,54 Z" fill="${C.ink}"/>
      <path d="M 66,50 L 74,49" stroke="${C.paper}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M 48,62 C 52,66 60,70 66,70 L 80,64 L 82,72 C 70,78 56,78 46,70 Z" fill="${C.player}" ${O(4)}/>
      <!-- gat -->
      <ellipse cx="62" cy="40" rx="46" ry="12" transform="rotate(6 62 40)" fill="${C.ink}" ${O(3)}/>
      <path d="M 50,38 L 53,16 C 60,12 70,13 76,17 L 76,40 Z" fill="${C.ink}" ${O(3)}/>
      <path d="M 70,18 L 73,19 L 73,38 L 70,38 Z" fill="${C.paper}" opacity="0.8"/>
      <path d="M 82,32 A 46 12 6 0 1 104,44" fill="none" stroke="${C.paper}" stroke-width="2.4" stroke-linecap="round"/>
    `;
  };

  // ---------- STALKER · 찢긴 벽보 들개 : box 130 x 90, feet y≈82 ----------
  PN.stalker = function () {
    const body = 'M 16,50 C 18,34 36,24 58,24 C 76,24 88,28 96,34 L 100,22 L 106,33 L 112,24 L 114,37 C 122,40 128,42 134,46 L 120,50 L 132,56 L 116,58 C 108,62 98,66 88,64 L 40,64 C 28,64 18,60 16,50 Z';
    return `
      <ellipse cx="66" cy="84" rx="50" ry="8" fill="${C.ink}" opacity="0.3"/>
      <!-- far legs -->
      <path d="M 42,60 L 50,82 L 58,82 L 52,60 Z M 94,58 L 108,80 L 116,80 L 104,56 Z" fill="${C.inkSoft}" ${O(4)}/>
      <!-- tail streamers -->
      <path d="M 20,44 L 2,30 L 10,42 L 0,48 L 12,50 L 4,58 L 20,54 Z" fill="${C.env1Light}" ${O(4)}/>
      ${shaded(body, C.ink, 5, `
        <path d="M 28,38 L 36,28 L 42,33 L 50,24 L 56,31 L 64,25 L 70,32 L 78,27 L 80,40 L 66,46 L 44,48 L 30,46 Z" fill="${C.env1Light}" stroke="${C.ink}" stroke-width="2.5"/>
        <path d="M 30,38 L 80,34 L 80,48 L 30,48 Z" fill="url(#dotEnv)"/>
        <path d="M 40,34 h10 v4 h-10 Z M 54,30 h4 v10 h-4 Z M 62,33 h9 v3 h-9 Z" fill="${C.ink}"/>
        ${T([30, 58, 60, 62, 96, 60], 2.4, 'mid', C.paper, 'opacity="0.6"')}`)}
      <!-- back spikes (torn paper) -->
      <path d="M 34,30 L 30,14 L 42,27 Z M 50,25 L 52,8 L 60,24 Z M 66,25 L 74,10 L 76,27 Z" fill="${C.env1Light}" ${O(3.5)}/>
      <!-- near legs -->
      <path d="M 30,56 L 20,80 L 32,82 L 42,60 Z" fill="${C.ink}" ${O(4)}/>
      <path d="M 84,58 L 96,80 L 108,82 L 96,56 Z" fill="${C.ink}" ${O(4)}/>
      <!-- jaw + eye -->
      <path d="M 112,50 L 116,54 L 120,50 L 124,54 L 128,51" fill="none" stroke="${C.paper}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M 102,40 Q 109,35 116,39 Q 109,43 102,40 Z" fill="${C.paper}"/>
      <circle cx="110" cy="39.5" r="1.7" fill="${C.ink}"/>
      ${T([98, 26, 101, 30, 103, 34], 1.6, 'mid', C.paper, 'opacity="0.7"')}
    `;
  };

  // ---------- CHARGER · 먹통 황소 : box 150 x 120, feet y≈112 ----------
  PN.charger = function () {
    const body = 'M 22,92 C 12,70 18,42 40,28 C 58,16 88,14 106,26 C 116,32 122,42 124,52 L 124,86 C 116,94 104,96 94,94 L 52,96 C 34,98 26,96 22,92 Z';
    const bucket = 'M 102,42 L 138,46 L 144,84 L 106,90 Z';
    return `
      <ellipse cx="80" cy="113" rx="62" ry="10" fill="${C.ink}" opacity="0.3"/>
      <path d="M 40,90 L 36,112 L 52,112 L 56,92 Z M 86,90 L 92,112 L 108,112 L 100,88 Z" fill="${C.inkSoft}" ${O(4)}/>
      ${shaded(body, C.ink, 6, `
        <path d="M 36,34 L 50,22 L 62,28 L 74,18 L 88,24 L 80,40 L 60,44 L 42,44 Z" fill="${C.env1Light}" stroke="${C.ink}" stroke-width="3"/>
        <path d="M 36,34 L 88,30 L 88,46 L 36,46 Z" fill="url(#dotEnv)"/>
        <path d="M 52,30 L 58,40 M 66,26 L 70,36" stroke="${C.ink}" stroke-width="2.5"/>
        ${T([28, 80, 60, 88, 100, 80], 3, 'mid', C.paper, 'opacity="0.55"')}
        ${T([108, 30, 118, 40, 122, 58], 3, 'mid', C.paper, 'opacity="0.7"')}`)}
      <path d="M 26,72 L 18,110 L 36,112 L 44,76 Z M 70,82 L 76,112 L 94,112 L 88,80 Z" fill="${C.ink}" ${O(4)}/>
      <path d="M 18,110 h20 M 76,110 h18" stroke="${C.paper}" stroke-width="2"/>
      <!-- bucket helmet -->
      ${shaded(bucket, C.env1Deep, 5, `
        <path d="M 100,40 L 146,40 L 146,52 L 100,50 Z" fill="${C.ink}"/>
        <path d="M 100,76 L 146,74 L 146,92 L 100,92 Z" fill="${C.ink}"/>
        <path d="M 100,60 L 146,58 L 146,70 L 100,72 Z" fill="${C.ink}"/>
        <path d="M 112,62 Q 118,59 124,62 Q 118,65 112,62 Z M 128,61.5 Q 134,58.5 140,61 Q 134,64 128,61.5 Z" fill="${C.paper}"/>
        ${T([136, 48, 140, 64, 141, 80], 2.4, 'mid', C.paper, 'opacity="0.8"')}`)}
      <!-- pipe horns -->
      <path d="M 110,46 C 104,30 112,16 130,12 L 132,21 C 120,24 118,34 120,46 Z" fill="${C.paper}" ${O(4)}/>
      <path d="M 130,48 C 132,34 140,26 150,26 L 149,35 C 142,35 139,40 139,50 Z" fill="${C.paper}" ${O(4)}/>
      <path d="M 113,40 L 122,38 M 134,38 L 140,37" stroke="${C.ink}" stroke-width="2"/>
      <!-- nose ring + drips -->
      <circle cx="128" cy="92" r="6" fill="none" stroke="${C.paper}" stroke-width="3"/>
      <circle cx="128" cy="92" r="6" fill="none" stroke="${C.ink}" stroke-width="1" opacity="0.6"/>
      <path d="M 110,90 q -3,8 0,11 q 3,-3 0,-11 Z M 140,86 q -3,9 0,12 q 3,-3 0,-12 Z" fill="${C.ink}"/>
    `;
  };

  // ---------- SHOOTER · 붓대 포수 : box 130 x 140, feet y≈132, muzzle at (126,84) ----------
  PN.shooter = function (windup = true) {
    const lantern = 'M 46,22 C 36,26 32,38 34,50 C 36,60 44,66 54,66 C 64,66 72,60 74,50 C 76,38 72,26 62,22 Z';
    return `
      <ellipse cx="56" cy="133" rx="36" ry="7" fill="${C.ink}" opacity="0.3"/>
      <!-- stilt legs -->
      <path d="M 50,100 L 38,132 M 60,100 L 72,132" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
      <path d="M 50,100 L 38,132 M 60,100 L 72,132" stroke="${C.inkSoft}" stroke-width="2.4" stroke-linecap="round"/>
      <!-- robe -->
      <path d="M 42,64 L 68,64 C 72,80 76,94 78,106 L 32,106 C 34,92 38,78 42,64 Z" fill="${C.ink}" ${O(5)}/>
      ${T([64, 68, 70, 86, 74, 104], 2.4, 'mid', C.paper, 'opacity="0.7"')}
      <!-- brush-tube cannon -->
      <path d="M 18,64 L 118,80 L 116,92 L 16,76 Z" fill="${C.env1Light}" ${O(5)}/>
      <path d="M 18,72 L 116,88 L 116,92 L 16,76 Z" fill="url(#dotEnv)"/>
      <path d="M 40,66 L 38,80 M 64,70 L 62,84 M 88,74 L 86,88" stroke="${C.ink}" stroke-width="3"/>
      <path d="M 116,78 L 132,80 L 136,86 L 130,92 L 116,92 Z" fill="${C.ink}" ${O(3)}/>
      ${windup ? `<circle cx="134" cy="86" r="11" fill="${C.warn}" opacity="0.35"/><circle cx="134" cy="86" r="7" fill="none" stroke="${C.warn}" stroke-width="3"/><circle cx="134" cy="86" r="3" fill="${C.paper}"/>` : ''}
      <!-- arms -->
      <path d="M 50,72 L 44,84 L 60,86" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 60,70 L 78,80 L 90,82" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- lantern head -->
      ${shaded(lantern, C.env1Light, 5, `
        <path d="M 30,20 L 50,20 C 44,34 44,52 50,68 L 30,68 Z" fill="url(#dotEnv)"/>
        <path d="M 38,34 C 46,32 64,32 72,34 M 36,46 C 46,44 64,44 74,46 M 38,58 C 46,56 64,56 72,58" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`)}
      <path d="M 44,18 L 64,18 L 62,24 L 46,24 Z M 46,64 L 62,64 L 60,70 L 48,70 Z" fill="${C.ink}" ${O(3)}/>
      <path d="M 54,18 L 54,8" stroke="${C.ink}" stroke-width="3"/>
      <path d="M 56,42 Q 64,38 72,41 Q 64,46 56,42 Z" fill="${C.ink}"/>
      <circle cx="66" cy="41.5" r="1.8" fill="${C.paper}"/>
    `;
  };

  // ---------- WARDEN · 회벽 수문장 : box 170 x 170, feet y≈162 ----------
  PN.warden = function () {
    const torso = 'M 34,54 C 40,36 66,26 90,28 C 116,30 136,42 142,62 L 146,112 C 130,122 110,126 88,126 C 64,126 44,120 30,110 Z';
    const door = 'M 96,60 L 158,54 L 162,136 L 100,142 Z';
    return `
      <ellipse cx="90" cy="162" rx="72" ry="11" fill="${C.ink}" opacity="0.3"/>
      <!-- legs -->
      <path d="M 50,116 L 44,160 L 72,160 L 74,118 Z M 96,118 L 100,160 L 126,160 L 122,116 Z" fill="${C.ink}" ${O(5)}/>
      <path d="M 44,158 h28 M 100,158 h26" stroke="${C.paper}" stroke-width="2.4"/>
      <!-- back arm -->
      <path d="M 36,62 C 20,72 14,92 16,114 L 34,118 C 34,100 38,86 46,76 Z" fill="${C.ink}" ${O(5)}/>
      <circle cx="24" cy="120" r="11" fill="${C.ink}" ${O(4)}/>
      <!-- plaster torso -->
      ${shaded(torso, C.env1, 6, `
        <path d="M 20,20 L 70,20 C 58,50 56,90 66,130 L 20,130 Z" fill="url(#dotEnv)"/>
        <path d="M 20,96 C 50,104 90,108 150,98 L 150,130 L 20,130 Z" fill="${C.ink}"/>
        <path d="M 60,40 L 70,58 L 62,74 L 74,92 M 104,36 L 98,52 L 110,64" fill="none" stroke="${C.ink}" stroke-width="2.6"/>
        <path d="M 40,66 L 66,62 L 70,84 L 44,88 Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.4"/>
        <path d="M 46,70 h14 v3 h-14 Z M 48,76 h8 v8 h-8 Z" fill="${C.ink}"/>
        ${T([56, 34, 90, 30, 124, 40], 3, 'mid', C.paper, 'opacity="0.8"')}`)}
      <!-- rebar spikes -->
      <path d="M 52,40 L 40,12 M 78,30 L 76,4 M 120,38 L 138,14" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
      <path d="M 52,40 L 40,12 M 78,30 L 76,4 M 120,38 L 138,14" stroke="${C.env1Deep}" stroke-width="2" stroke-linecap="round"/>
      <!-- sunk head -->
      <path d="M 72,34 C 72,22 84,16 96,18 C 108,20 112,30 110,40 C 100,46 82,46 72,34 Z" fill="${C.ink}" ${O(4)}/>
      <path d="M 84,31 Q 89,28 94,31 Q 89,34 84,31 Z M 98,30 Q 103,27 107,30 Q 103,33 98,30 Z" fill="${C.paper}"/>
      <!-- door shield -->
      ${shaded(door, C.ink, 6, `
        <path d="M 106,66 L 150,62 L 152,98 L 108,102 Z" fill="${C.env1Light}" stroke="${C.ink}" stroke-width="2.4"/>
        <path d="M 110,70 L 128,68 L 126,80 L 110,82 Z" fill="${C.ink}"/>
        <path d="M 132,72 h14 M 132,78 h10 M 114,88 h30 M 114,94 h22" stroke="${C.ink}" stroke-width="2.4"/>
        <path d="M 124,98 L 132,108 L 140,100 L 150,112" fill="none" stroke="${C.env1Light}" stroke-width="2"/>
        ${T([154, 58, 158, 96, 160, 132], 3, 'mid', C.paper, 'opacity="0.75"')}`)}
      ${[[104, 62], [154, 58], [106, 136], [158, 132]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.6"/>`).join('')}
      <!-- front hand gripping door -->
      <path d="M 120,50 C 110,58 104,70 106,84 L 124,84 C 124,72 128,64 134,58 Z" fill="${C.ink}" ${O(5)}/>
    `;
  };
})(window.PN);
