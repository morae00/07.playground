// Atlas spec (TEC-03): which concept-kit drawings are baked into which atlas pack.
// Every frame is a kit call rendered at @2x. `anchor` is the point, in the kit's local box units, that sits
// on the entity position: the feet (style bible §2.3 and §16: kit feet = kit pivot + r becomes the pivot).
// `scale` is world units per box unit. Art from the concept kit is provisional (AI-assisted concept work,
// style bible §15): final hand-cleaned art replaces these frames slot by slot without code changes.

export const ATLAS_SCALE = 2;
export const PAGE_SIZE = 2048;
export const FRAME_PADDING = 2;
/** Extra room around each kit box, in @2x pixels, for tails, horns, barrels, and claws outside the box. */
export const BAKE_MARGIN = 16;

/** Kit v1.0 tokens -> implemented palette tokens (style bible §5.1, §16). */
export const COLOR_MAP = Object.freeze([
  ['#121110', '#101312'],
  ['#0E0E10', '#101312'],
  ['#2B2926', '#343936'],
  ['#FAF6EC', '#fffff8'],
  ['#F3EEE2', '#f4f4ef'],
  ['#D8D0C0', '#d8dad3'],
]);

/** Hero sprite states (API-hero §2): frames and playback rate. */
export const HERO_STATES = Object.freeze({
  idle: { frames: 6, fps: 8 },
  run: { frames: 8, fps: 14 },
  throw: { frames: 4, fps: 16 },
  hurt: { frames: 3, fps: 12 },
});

/**
 * The shooter windup's dotted aim line (two dashed strokes, API-enemies). The sprite only faces left or right, and
 * the game draws the real aim toward its target (worldRenderer drawTelegraphs), so the bake drops it and keeps the
 * amber muzzle ring.
 */
export const AIM_LINE = '<path d="[^"]*" stroke="[^"]*" stroke-width="[^"]*" stroke-dasharray="[^"]*" stroke-linecap="round"/>';

/**
 * Enemy roles (API-enemies): walk frames, and a size fit that brings the kit's display size inside the style
 * bible's §7.1 ranges (hit radii never change). Values above 1 are not allowed. `pad` is extra cell room in box
 * units, [top, right, bottom, left], for poses that reach past the box: the charger's hit recoil and the shooter's
 * muzzle ring reach right, and the warden's windup rises. A top or left pad moves the drawing by whole pixels only,
 * so frames that already fitted bake the same. `strip` removes markup from one state's drawing.
 */
export const ENEMY_ROLES = Object.freeze({
  stalker: { walkFps: 8, fit: 36 / 40, pad: [0, 40, 0, 0] },
  charger: { walkFps: 10, fit: 52 / 54, pad: [0, 60, 0, 0] },
  shooter: { walkFps: 4, fit: 36 / 46, pad: [0, 60, 0, 0], strip: { windup: AIM_LINE } },
  warden: { walkFps: 6, fit: 1, pad: [40, 20, 0, 0] },
});

function heroFrames() {
  const frames = [];
  for (const [state, { frames: count }] of Object.entries(HERO_STATES)) {
    for (let frame = 0; frame < count; frame += 1) {
      frames.push({
        key: `hero/${state}/${frame}`,
        call: ['PN.heroKit.sprite', state, frame, { ring: false, shadow: false, halo: true }],
        box: [96, 96],
        anchor: [48, 75],
        scale: 1,
      });
    }
  }
  return frames;
}

/**
 * Round bosses with kit art, facing right, every phase (1-3) in idle and windup, calm and enraged. Both kit
 * modules draw the r54 hit circle, so the figure stands about 156 world units tall:
 * - PN.bossesA (API-bosses1): 400x400 box, feet at y 392, 0.4 world units per box unit. The gaoler's windup key
 *   bow rises 132 units above the box, so its cells get 150 units of extra room on top.
 * - PN.bossesB (API-bosses2): 384x384 box, feet at y 360, 0.5 world units per box unit, game detail.
 * `pad` is extra room in box units, [top, right, bottom, left]; the bake fails if a drawing still reaches its cell edge.
 * The mid and field bosses of Ch2-5 have no kit drawing yet and keep their vector bodies.
 */
export const BOSS_SPRITES = Object.freeze({
  'boss/1/butcher': { kit: 'butcher', module: 'bossesA', bossId: 's1-mid-dash', chapter: 1, pad: [150, 0, 60, 0] },
  'boss/1/gaoler': { kit: 'gaoler', module: 'bossesA', bossId: 's1-final-rings', chapter: 1, pad: [150, 0, 60, 0] },
  'boss/2/maw': { kit: 'maw', module: 'bossesA', bossId: 's2-final-flame', chapter: 2, pad: [150, 80, 40, 80] },
  'boss/3/empress': { kit: 'empress', module: 'bossesB', bossId: 's3-final-traps', chapter: 3, pad: [80, 60, 30, 60] },
  'boss/4/herald': { kit: 'herald', module: 'bossesB', bossId: 's4-final-saw', chapter: 4, pad: [80, 80, 30, 60] },
  'boss/5/balance': { kit: 'balance', module: 'bossesB', bossId: 's5-final-null', chapter: 5, pad: [80, 80, 30, 60] },
});

const BOSS_MODULES = Object.freeze({
  bossesA: { box: [400, 400], anchor: [200, 392], scale: 0.4, options: { lod: 'game', halo: true, shadow: false, fx: true } },
  bossesB: { box: [384, 384], anchor: [192, 360], scale: 0.5, options: { detail: 'game', shadow: false } },
});

export function bossStates() {
  const states = [];
  for (const phase of [1, 2, 3]) {
    for (const windup of [false, true]) {
      for (const enraged of [false, true]) {
        states.push({ key: `phase${phase}${windup ? '-windup' : ''}${enraged ? '-enraged' : ''}`, phase, windup, enraged });
      }
    }
  }
  return states;
}

const chapterBosses = (chapter) => Object.entries(BOSS_SPRITES).filter(([, boss]) => boss.chapter === chapter);

function bossFrames(chapter) {
  const frames = [];
  for (const [slot, { kit, module, pad }] of chapterBosses(chapter)) {
    const { box, anchor, scale, options } = BOSS_MODULES[module];
    for (const state of bossStates()) {
      frames.push({
        key: `${slot}/${state.key}/0`,
        call: [`PN.${module}.draw`, kit, { phase: state.phase, windup: state.windup, enraged: state.enraged, ...options }],
        box,
        anchor,
        scale,
        extraPad: pad,
      });
    }
  }
  return frames;
}

function bossAnimations(chapter) {
  return Object.fromEntries(chapterBosses(chapter).map(([slot]) => [slot, Object.fromEntries(bossStates().map((state) => [state.key, { frames: 1, fps: 1 }]))]));
}

/**
 * Kit VFX (PN.vfx, API-icons): the hit star, and for each Ch1 role the six-frame kill burst and its dried decal.
 * VFX are drawn in world units. The hit star is baked facing +x and turned to the blow at runtime. Kill bursts
 * are the enemy slot's `death` pose and decals its `decal` stages, baked at the role's sprite fit and anchored on
 * the feet like the sprites, so they land on the body (FX-03).
 */
export const HIT_FRAMES = 4;
export const KILL_FRAMES = 6;
/** Decal ages baked, in seconds: wet with glint and eyes, glint dry, eyes gone, dry, scrap gone. */
export const DECAL_AGES = Object.freeze([0, 1, 1.5, 3, 15]);
/** Hit radius of each role in the kit, the same in every chapter, in world units (PN._ki.SIL r). */
const ROLE_RADIUS = Object.freeze({ stalker: 12, charger: 19, shooter: 12, warden: 28 });

function hitFrames() {
  const frames = [];
  for (const crit of [false, true]) {
    for (let frame = 0; frame < HIT_FRAMES; frame += 1) {
      frames.push({
        key: `fx/hit${crit ? '-crit' : ''}/${frame}`,
        call: ['PN.vfx.hit', frame, { angle: 0, crit, seed: 0 }],
        box: [48, 48],
        anchor: [0, 0],
        scale: 1,
        extraPad: [48, 0, 0, 48],
      });
    }
  }
  return frames;
}

function killFrames(chapter) {
  const frames = [];
  for (const [role, { fit }] of Object.entries(ENEMY_ROLES)) {
    const r = ROLE_RADIUS[role];
    for (let frame = 0; frame < KILL_FRAMES; frame += 1) {
      // Kill frames are drawn around the pivot (the hit circle's centre); the feet are r below it.
      frames.push({ key: `enemy/${chapter}/${role}/death/${frame}`, call: ['PN.vfx.kill', frame, { role, seed: 0 }], box: [120, 120], anchor: [0, r], scale: fit, extraPad: [120, 0, 0, 120] });
    }
    DECAL_AGES.forEach((age, stage) => {
      // Decals are drawn around the ground point, 0.55 r below the pivot, so the feet are 0.45 r below it.
      frames.push({ key: `enemy/${chapter}/${role}/decal/${stage}`, call: ['PN.vfx.decal', age, { role, seed: 0 }], box: [120, 120], anchor: [0, r * 0.45], scale: fit, extraPad: [120, 0, 0, 120] });
    });
  }
  return frames;
}

/**
 * Pickups (ART-06): the kit's XP jade in three sizes and the 엽전 coin (API-icons pickup). The kit's 48 box is twice
 * the in-game size, so it is baked at half scale; the anchor is the pickup's centre. The game picks the XP size from
 * the pickup's value (slots.ts pickupState).
 */
export const PICKUP_STATES = Object.freeze([['xp1', 'xp', 1], ['xp2', 'xp', 2], ['xp3', 'xp', 3], ['coin', 'coin', 1]]);

function pickupFrames() {
  return PICKUP_STATES.map(([state, kind, tier]) => ({
    key: `pickup/${state}/0`,
    call: ['PN.icons.pickup', kind, { tier }],
    box: [48, 48],
    anchor: [24, 24],
    scale: 0.5,
  }));
}

/** Animation specs: the hit star (4 frames in 0.16 s), and per Ch1 role the death burst and decal stages. */
function fxAnimations(chapter) {
  if (chapter === undefined) {
    return {
      fx: { hit: { frames: HIT_FRAMES, fps: 25 }, 'hit-crit': { frames: HIT_FRAMES, fps: 25 } },
      pickup: Object.fromEntries(PICKUP_STATES.map(([state]) => [state, { frames: 1, fps: 1 }])),
    };
  }
  return Object.fromEntries(Object.keys(ENEMY_ROLES).map((role) => [
    `enemy/${chapter}/${role}`,
    { death: { frames: KILL_FRAMES, fps: 24 }, decal: { frames: DECAL_AGES.length, fps: 0 } },
  ]));
}

/**
 * Chapter environments (ART-05, ART-07, API-env): the obstacle catalogue, each module baked at its exact footprint
 * with the pivot on the footprint's centre, which is the collision rect's centre. Remaster rules build maps from
 * these footprints (rules.ts kitProps), so outline and hit box agree. The kit draws props at 1x: the top face rises
 * H (≤ 28) above the footprint.
 * - Solid obstacles are the chapter's block prop in the same three footprints in every chapter, so obstacle
 *   geometry stays the same across chapters and difficulty comes from enemies and bosses.
 * - Pillars are the chapter's small props at their own sizes. Round props scale evenly, so their depth follows
 *   their width. Flat or walk-through props (Ch2 glass, Ch3 reeds) are not obstacles.
 * - Landmark posts line the chapter's landmark stages (St3, St7).
 */
const SOLID_FOOTPRINTS = Object.freeze([[120, 70], [200, 130], [280, 190]]);
const solids = (prop) => Object.freeze(SOLID_FOOTPRINTS.map(([w, d]) => [prop, w, d]));

export const OBSTACLE_CATALOGUE = Object.freeze({
  1: Object.freeze({
    solid: solids('wall'),
    pillar: Object.freeze([['pole', 34, 34], ['jars', 92, 60], ['cart', 124, 60]]),
    // Corridor posts: the St3 poster crossing and the St7 ink blockade.
    landmark: Object.freeze([['wall', 70, 132]]),
  }),
  2: Object.freeze({
    solid: solids('gate'),
    pillar: Object.freeze([['pillar', 50, 32], ['pillar', 76, 49], ['gate', 104, 30]]),
    // Broken drums in a ring: the St3 ribbed nave and the St7 locked rose window.
    landmark: Object.freeze([['pillar', 66, 42]]),
  }),
  3: Object.freeze({
    solid: solids('embank'),
    pillar: Object.freeze([['bollard', 28, 28], ['bollard', 40, 40], ['sluice', 124, 30]]),
    // Sluice gates along the canal: the St3 split sluice and the St7 floodgate basin.
    landmark: Object.freeze([['sluice', 170, 54]]),
  }),
  4: Object.freeze({
    solid: solids('clock'),
    pillar: Object.freeze([['tomb', 40, 25], ['tomb', 56, 35], ['gears', 96, 56]]),
    // Dial headstones in a ring: the St3 broken minute dial and the St7 gear ossuary.
    landmark: Object.freeze([['tomb', 66, 41]]),
  }),
  5: Object.freeze({
    solid: solids('stele'),
    pillar: Object.freeze([['pillar', 46, 30], ['pillar', 60, 39], ['stele', 76, 28]]),
    // Obsidian stumps in a ring: the St3 penumbra ring and the St7 cracked totality.
    landmark: Object.freeze([['pillar', 92, 60]]),
  }),
});

/** Seamless ground tile per chapter (API-env ground, tile: true), in world units; baked at ATLAS_SCALE as WebP. */
export const GROUND_TILE = 512;

/**
 * Seamless ground per chapter (API-env ground, tile: true), without the one-off plaza pieces a repeat would copy.
 * The kit turns Ch4's slab frame by -0.26 rad about the world origin, which cannot wrap in a square tile, so its
 * tile is the same slab layer unturned with the wrap period (build-atlas turnedSlabs) and the renderer turns the
 * repeating pattern by `angle` instead.
 */
const GROUNDS = Object.freeze({
  1: { call: ['PN.env.ground', 1, GROUND_TILE, GROUND_TILE, 3, { tile: true }] },
  2: { call: ['PN.env.ground', 2, GROUND_TILE, GROUND_TILE, 3, { tile: true, rose: null, center: null }] },
  3: { call: ['PN.env.ground', 3, GROUND_TILE, GROUND_TILE, 3, { tile: true, canalY: false }] },
  4: { call: ['bake.turnedSlabs', 4, GROUND_TILE, 3], angle: -0.26 },
  5: { call: ['PN.env.ground', 5, GROUND_TILE, GROUND_TILE, 3, { tile: true, center: null, ringC: null }] },
});

/** The world edge strip (API-env boundary): edge line at y = 0, outside above it; drawn along every edge. */
export const BOUNDARY_WIDTH = 300;


function envFrames(chapter) {
  const frames = [];
  for (const [kind, modules] of Object.entries(OBSTACLE_CATALOGUE[chapter] ?? {})) {
    modules.forEach(([prop, w, d], index) => {
      frames.push({
        key: `env/${chapter}/${kind}${index}/0`,
        call: ['PN.env.prop', chapter, prop, { w, d, seed: index + 1 }],
        // Room for the raised top face and the lower-right cast shadow; the pivot sits at `translate`.
        box: [w + 120, d + 140],
        translate: [w / 2 + 50, d / 2 + 80],
        anchor: [w / 2 + 50, d / 2 + 80],
        scale: 1,
      });
    });
  }
  return frames;
}

function boundaryFrame(chapter) {
  return {
    key: `env/${chapter}/boundary/0`,
    call: ['PN.env.boundary', chapter, BOUNDARY_WIDTH],
    box: [BOUNDARY_WIDTH, 120],
    translate: [0, 90],
    anchor: [0, 90],
    scale: 1,
  };
}

function envAnimations(chapter) {
  const states = Object.entries(OBSTACLE_CATALOGUE[chapter] ?? {}).flatMap(([kind, modules]) => modules.map((_, index) => `${kind}${index}`));
  return { [`env/${chapter}`]: Object.fromEntries([...states, 'boundary'].map((state) => [state, { frames: 1, fps: 1 }])) };
}

/** Filled from the kit's own metadata at bake time (box, pivot, feet, displayScale, walk frame count). */
function enemyFrames(chapter) {
  return Object.entries(ENEMY_ROLES).map(([role, { fit }]) => ({
    enemy: { chapter, role, fit },
    keyPrefix: `enemy/${chapter}/${role}`,
  }));
}

/** One pack per chapter: its enemy roles, round bosses with kit art, kill bursts and decals, props, edge, and ground. */
function chapterPack(chapter) {
  const dir = `assets/packs/chapter-${String(chapter).padStart(2, '0')}`;
  return {
    page: `${dir}/atlas`,
    frames: [...enemyFrames(chapter), ...bossFrames(chapter), ...killFrames(chapter), ...envFrames(chapter), boundaryFrame(chapter)],
    animations: { ...bossAnimations(chapter), ...fxAnimations(chapter), ...envAnimations(chapter) },
    ground: { ...GROUNDS[chapter], file: `${dir}/ground-0.webp` },
  };
}

export const PACKS = Object.freeze({
  common: { page: 'assets/atlas/common', frames: [...heroFrames(), ...hitFrames(), ...pickupFrames()], animations: fxAnimations() },
  'chapter-01': chapterPack(1),
  'chapter-02': chapterPack(2),
  'chapter-03': chapterPack(3),
  'chapter-04': chapterPack(4),
  'chapter-05': chapterPack(5),
});
