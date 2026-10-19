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

/**
 * CON-10 (K8): the seven other characters (PN.characters, API-characters), each with Gyeol's states and box, in a
 * pack of its own (brief Q6) that loads only for the character played. Gyeol stays the hero of the common pack.
 */
export const CHARACTER_ART = Object.freeze(['dan', 'noeul', 'seori', 'dok', 'hwi', 'ryeong', 'wol']);

function characterFrames(id) {
  return Object.entries(HERO_STATES).flatMap(([state, { frames }]) => Array.from({ length: frames }, (_, frame) => ({
    key: `hero/${id}/${state}/${frame}`,
    call: ['PN.characters.sprite', id, state, frame, { ring: false, shadow: false, halo: true }],
    box: [96, 96],
    anchor: [48, 75],
    scale: 1,
  })));
}

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
 * - PN.bossesC (API-bosses3): the Ch2-5 mid bosses in the bossesB box, with an attack pose and four death frames.
 *   Phase 2 and 3 bake the base move's windup and attack until their own moves run (SYS-05).
 * Field bosses are listed in FIELD_BOSSES below.
 */
export const BOSS_SPRITES = Object.freeze({
  'boss/1/butcher': { kit: 'butcher', module: 'bossesA', bossId: 's1-mid-dash', chapter: 1, pad: [150, 0, 60, 0] },
  'boss/1/gaoler': { kit: 'gaoler', module: 'bossesA', bossId: 's1-final-rings', chapter: 1, pad: [150, 0, 60, 0] },
  'boss/2/maw': { kit: 'maw', module: 'bossesA', bossId: 's2-final-flame', chapter: 2, pad: [150, 80, 40, 80] },
  'boss/3/empress': { kit: 'empress', module: 'bossesB', bossId: 's3-final-traps', chapter: 3, pad: [80, 60, 30, 60] },
  'boss/4/herald': { kit: 'herald', module: 'bossesB', bossId: 's4-final-saw', chapter: 4, pad: [80, 80, 30, 60] },
  'boss/5/balance': { kit: 'balance', module: 'bossesB', bossId: 's5-final-null', chapter: 5, pad: [80, 80, 30, 60] },
  'boss/2/bishop': { kit: 'bishop', module: 'bossesC', bossId: 's2-mid-clones', chapter: 2, pad: [100, 60, 20, 50] },
  'boss/3/tide-king': { kit: 'tide-king', module: 'bossesC', bossId: 's3-mid-tide', chapter: 3, pad: [20, 60, 20, 0] },
  'boss/4/tyrant': { kit: 'tyrant', module: 'bossesC', bossId: 's4-mid-clock', chapter: 4, pad: [100, 60, 20, 50] },
  'boss/5/director': { kit: 'director', module: 'bossesC', bossId: 's5-mid-eclipse', chapter: 5, pad: [40, 60, 20, 0] },
});

/**
 * Field bosses (ART-04, API-bosses4): PN.fieldBosses draws the r38 hit circle in a 384x384 box with the feet at
 * y 328, at 0.5 world units per box unit. A field boss also roams the chapters after its own (GameEngine spawnBoss),
 * so each chapter pack holds the field bosses of that chapter and the ones before, under that chapter's slot, each
 * with that chapter's ground colour for its knockout halo. The kit draws a phase-2 crack mark (phase 3 keeps it), no
 * enraged variant, idle, windup, and attack poses, and four death frames.
 */
export const FIELD_BOSSES = Object.freeze({
  'field-shock': { kit: 'commander', chapter: 1 },
  'field-rings': { kit: 'reliquary', chapter: 2 },
  'field-trap': { kit: 'architect', chapter: 3 },
  'field-clock': { kit: 'executioner', chapter: 4 },
  'field-null': { kit: 'judge', chapter: 5 },
});
/** Each chapter's ground base colour (kit env.chN.base), the halo of the field bosses in that chapter's pack. */
const CHAPTER_GROUND = Object.freeze({ 1: '#B8AC93', 2: '#ABADB4', 3: '#ADB4AA', 4: '#BBAE94', 5: '#ABA5AC' });
/** Box-unit room around field boss cells: the death puddle's halo reaches the bottom edge of the box (API-bosses4). */
const FIELD_BOSS_PAD = Object.freeze([8, 8, 8, 8]);
/** Boss death frames play in this many frames per second, then the stain takes over (worldRenderer drawBossFalls). */
export const BOSS_DEATH_FRAMES = 4;
export const BOSS_DEATH_FPS = 6;

const BOSS_MODULES = Object.freeze({
  bossesA: { box: [400, 400], anchor: [200, 392], scale: 0.4, options: { lod: 'game', halo: true, shadow: false, fx: true } },
  bossesB: { box: [384, 384], anchor: [192, 360], scale: 0.5, options: { detail: 'game', shadow: false } },
  bossesC: { box: [384, 384], anchor: [192, 360], scale: 0.5, options: { detail: 'game', shadow: false } },
  fieldBosses: { box: [384, 384], anchor: [192, 328], scale: 0.5, options: { detail: 'game', shadow: false } },
});

/**
 * A module's still states: phases x poses x calm/enraged. Keys match slots.ts bossState. Round and mid bosses draw
 * idle, windup, and attack in three phases, calm and enraged, and four death frames; field bosses draw idle, windup,
 * and attack in two phases.
 */
const BOSS_STATE_SETS = Object.freeze({
  bossesA: { phases: [1, 2, 3], poses: ['idle', 'windup', 'attack'], enraged: [false, true], death: true },
  bossesB: { phases: [1, 2, 3], poses: ['idle', 'windup', 'attack'], enraged: [false, true], death: true },
  bossesC: { phases: [1, 2, 3], poses: ['idle', 'windup', 'attack'], enraged: [false, true], death: true },
  fieldBosses: { phases: [1, 2], poses: ['idle', 'windup', 'attack'], enraged: [false], death: true },
});

export function bossStates(module = 'bossesA') {
  const set = BOSS_STATE_SETS[module];
  const states = [];
  for (const phase of set.phases) {
    for (const pose of set.poses) {
      for (const enraged of set.enraged) {
        states.push({ key: `phase${phase}${pose === 'idle' ? '' : `-${pose}`}${enraged ? '-enraged' : ''}`, phase, pose, enraged });
      }
    }
  }
  return states;
}

/**
 * The kit call for one state: bossesA and B only know `windup`; fieldBosses takes the pose itself; bossesC takes
 * `windup` or `pose: 'attack'` and the move, the base move for every phase until SYS-05 runs the phase moves.
 */
function stateOptions(module, state) {
  if (module === 'fieldBosses') return { phase: state.phase, pose: state.pose };
  const base = { phase: state.phase, windup: state.pose === 'windup', enraged: state.enraged };
  if (module === 'bossesC') return { ...base, pose: state.pose === 'attack' ? 'attack' : 'idle', move: 'base' };
  // bossesA and B (K3-2): idle and windup keep the calls they baked from before; only the attack names its pose.
  return state.pose === 'attack' ? { ...base, pose: 'attack' } : base;
}

/** Every boss drawn in a chapter's pack: its round bosses, then the field bosses of this chapter and the ones before. */
function chapterBosses(chapter) {
  const round = Object.entries(BOSS_SPRITES).filter(([, boss]) => boss.chapter === chapter);
  const field = Object.entries(FIELD_BOSSES)
    .filter(([, boss]) => boss.chapter <= chapter)
    .map(([bossId, { kit }]) => [`boss/${chapter}/${kit}`, { kit, module: 'fieldBosses', bossId, chapter, pad: FIELD_BOSS_PAD, halo: CHAPTER_GROUND[chapter] }]);
  return [...round, ...field];
}

function bossFrames(chapter) {
  const frames = [];
  for (const [slot, { kit, module, pad, halo }] of chapterBosses(chapter)) {
    const { box, anchor, scale, options } = BOSS_MODULES[module];
    const extra = halo ? { halo } : {};
    for (const state of bossStates(module)) {
      frames.push({ key: `${slot}/${state.key}/0`, call: [`PN.${module}.draw`, kit, { ...stateOptions(module, state), ...options, ...extra }], box, anchor, scale, extraPad: pad });
    }
    if (!BOSS_STATE_SETS[module].death) continue;
    for (let frame = 0; frame < BOSS_DEATH_FRAMES; frame += 1) {
      frames.push({ key: `${slot}/death/${frame}`, call: [`PN.${module}.draw`, kit, { pose: 'death', frame, ...options, ...extra }], box, anchor, scale, extraPad: pad });
    }
  }
  return frames;
}

function bossAnimations(chapter) {
  return Object.fromEntries(chapterBosses(chapter).map(([slot, { module }]) => {
    const states = Object.fromEntries(bossStates(module).map((state) => [state.key, { frames: 1, fps: 1 }]));
    if (BOSS_STATE_SETS[module].death) states.death = { frames: BOSS_DEATH_FRAMES, fps: BOSS_DEATH_FPS };
    return [slot, states];
  }));
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

/** SYS-14 (K7): the two bombers, drawn by the kit at the small contact size (API-bombers). */
export const BOMBER_KINDS = Object.freeze(['fuse', 'burst']);

/** Filled from the kit's own metadata at bake time (box, pivot, feet, displayScale, walk frame count). */
function enemyFrames(chapter) {
  return [
    ...Object.entries(ENEMY_ROLES).map(([role, { fit }]) => ({
      enemy: { chapter, role, fit },
      keyPrefix: `enemy/${chapter}/${role}`,
    })),
    ...BOMBER_KINDS.map((kind) => ({ bomber: { chapter, kind }, keyPrefix: `enemy/${chapter}/bomber-${kind}` })),
  ];
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

/**
 * Skill VFX (FX-06, FX-07; kit PN.skillVfx, API-skills-vfx): the bake expands every stamp of every group from the
 * kit's own parts(), into a pack of their own so the 188 stamps stay out of the initial download. Seconds for the
 * parts a fixed window times (API §5), by part name without `shot-` or `-awakened`; null for parts timed by game
 * data (a beam's or hazard's life, hit immunity, the iron frame's shield).
 */
export const SKILL_VFX_TIMING = Object.freeze({
  start: 0.06, end: 0.1, shard: 0.12, burst: 0.24, flash: 0.08, fissure: 0.24, blast: 0.24, collapse: 0.3,
  'core-start': 0.2, 'core-end': 0.3, glint: 0.12, mark: 0.3, markBoss: 0.3,
  origin: null, slash: null, shell: null, feet: null, plates: null, shield: null,
});
/** Drawing constants for the renderer (brief §9 defaults): clone opacity, pop rise and rate, the eclipse slash inset. */
export const SKILL_VFX_RENDER = Object.freeze({ cloneAlpha: 0.8, popRise: 4, popEvery: 1.5, rayInset: 2, boltFps: 12 });

/**
 * Terrain hazards (K11; kit PN.hazards, API-hazards): the bake expands every stamp of the nine groups (seven kinds, the
 * hero's and enemies' overlays) into a pack of their own, `hazard/<group>/<part>/<frame>`. The kit's SPEC, part rules,
 * and states go into the manifest as data (`manifest.hazards`), with the layout and ember vectors the renderer's port is
 * tested against (API §8.13, C9): [kind, r, seed, lod, chapter] and [r, seed, t]; `hero` is the hero's ember clock;
 * `paths` [kind, r, seed] are the shock cracks and the null ghost lines and jag (delivery 3 and its N1 fix).
 * `render.fireStamps` is the renderer's cap on fire stamps a screen (full, reduced, minimal). The kit's SPEC fire.caps
 * is 72 / 40 / 20; full detail is raised to 120 of the 160 terrain stamps (review 2 §8-5), measured on the bench's
 * terrain bundle (docs/QUALITY_GATES.md), so a screen of map fires keeps their rim rings.
 */
export const HAZARD_VECTORS = Object.freeze({
  layout: [
    ['fire', 50, 1], ['fire', 74, 7], ['fire', 98, 7], ['fire', 150, 23], ['fire', 150, 23, 'reduced'], ['fire', 150, 23, 'minimal'],
    ['shock', 190, 11], ['slow', 150, 5, 'full', 3], ['slow', 150, 5, 'reduced', 3], ['slow', 270, 2, 'minimal', 3], ['water', 200, 3, 'full', 3],
    ['water', 270, 1, 'reduced', 3], ['water', 270, 1, 'minimal', 3], ['root', 52, 9], ['trap', 80, 4, 'full', 3], ['null', 130, 11],
  ],
  embers: [[50, 1, 0.3], [74, 7, 0.3], [98, 7, 0.3], [150, 23, 0.3]],
  hero: 0.3,
  paths: [['shock', 190, 11], ['null', 130, 11]],
});
export const HAZARD_RENDER = Object.freeze({ fireStamps: [120, 40, 20] });

/**
 * The weapons' field effects (K10; kit PN.arsenalFx, API-arsenal-fx): the bake expands every stamp of every group the
 * kit has drawn into a pack of their own, `afx/<group>/<part>/<frame>`. The kit's SPEC, META (numbers and words only),
 * part rules, and the vectors the renderer's port is tested against go into the manifest (`manifest.arsenalFx`): the
 * C9 cases [id, stage, opts] of the brief's §7.2 the kit has drawn, review 1's three, and awakened, LOD, and reduced
 * motion cases, each run through the kit's layout() and paths(); and lobPath() at five points of a throw to (320, −120),
 * and the cluster pots' mini path to (±60, 0) (delivery 2). Delivery 3a adds the seven P1 gimmick cases of the C9
 * command and the other P1 stages the kit places (zones, the triangle, the eighth seal), with reduced motion cases.
 */
const AFX_POINTS = [{ x: 0, y: 0 }, { x: 220, y: -70 }, { x: 420, y: 20 }, { x: 640, y: -40 }, { x: 860, y: 30 }];
export const ARSENAL_FX_VECTORS = Object.freeze({
  cases: [
    ['inkPulse', 'burst', { radius: 151, seed: 7 }], ['frostRing', 'burst', { radius: 178, seed: 7 }], ['thunderclap', 'burst', { radius: 136, seed: 5 }],
    ['silenceBell', 'burst', { radius: 244, seed: 5 }], ['brushDownpour', 'impact', { radius: 46, seed: 3 }], ['meteorBrush', 'land', { radius: 160, seed: 3 }],
    ['eclipseHalo', 'sweep', { radius: 230, inner: 110, seed: 6, p: 0.5 }], ['inkOrbit', 'sweep', { radius: 132, inner: 40, seed: 6, p: 0.5 }],
    ['wardRing', 'sweep', { radius: 100, inner: 0, seed: 6, p: 0.5 }], ['sparkThread', 'jump', { points: AFX_POINTS, seed: 1 }],
    ['stormThread', 'jump', { points: AFX_POINTS, seed: 1 }], ['frostChainlet', 'jump', { points: AFX_POINTS, seed: 1 }],
    ['inkLance', 'stroke', { length: 640, width: 12, seed: 1 }], ['wideBrush', 'stroke', { length: 410, width: 34, seed: 1 }],
    ['crossStrokes', 'stroke', { length: 496, width: 14, seed: 1 }], ['judgmentLine', 'stroke', { length: 960, width: 18, seed: 1 }],
    ['inkPots', 'land', { radius: 92, seed: 9 }], ['clusterPots', 'land', { radius: 64, seed: 9 }], ['fallingScroll', 'impact', { radius: 110, seed: 4 }],
    ['inkPulse', 'burst', { radius: 162, seed: 3, awakened: true, p: 0.1 }], ['frostRing', 'burst', { radius: 192, seed: 2, awakened: true }],
    ['frostRing', 'burst', { radius: 178, seed: 7, lod: 'minimal' }], ['silenceBell', 'burst', { radius: 290, seed: 4, awakened: true, p: 0.6 }],
    ['thunderclap', 'burst', { radius: 150, seed: 2, t: 0.1, reduced: true }], ['brushDownpour', 'impact', { radius: 75, seed: 5, awakened: true }],
    ['seventhSeal', 'impact', { radius: 58, seed: 12 }], ['fallingScroll', 'impact', { radius: 132, seed: 7, awakened: true }],
    ['inkLightning', 'impact', { radius: 67, seed: 8, awakened: true }], ['tarJar', 'land', { radius: 114, seed: 9 }],
    ['meteorBrush', 'land', { radius: 192, seed: 11, awakened: true }], ['meteorBrush', 'land', { radius: 160, seed: 3, lod: 'reduced' }],
    ['inkPots', 'land', { radius: 92, seed: 9, lod: 'minimal' }], ['sparkThread', 'jump', { points: AFX_POINTS, seed: 1, awakened: true }],
    ['stormThread', 'jump', { points: AFX_POINTS, seed: 4, t: 0.1 }],
    ['frostChainlet', 'jump', { points: AFX_POINTS.map((p, i) => ({ ...p, r: [0, 12, 28, 19, 54][i] })), seed: 3 }],
    ['inkLance', 'stroke', { length: 760, width: 14.4, seed: 3, awakened: true, p: 0.8 }], ['wideBrush', 'stroke', { length: 480, width: 40.8, seed: 5, p: 0.1 }],
    ['crossStrokes', 'stroke', { length: 496, width: 16.8, seed: 2, awakened: true, p: 0.2 }], ['judgmentLine', 'stroke', { length: 1000, width: 21.6, seed: 2, awakened: true, p: 0.04 }],
    ['inkOrbit', 'sweep', { radius: 150, inner: 40, seed: 9, awakened: true, p: 0.7 }], ['wardRing', 'sweep', { radius: 110, inner: 0, seed: 3, awakened: true, p: 0.5 }],
    ['eclipseHalo', 'sweep', { radius: 250, inner: 110, seed: 2, awakened: true, p: 0.3 }], ['eclipseHalo', 'sweep', { radius: 230, inner: 110, seed: 6, p: 0.5, reduced: true }],
    // delivery 3a: the awakening gimmicks (P1)
    ['inkPots', 'fire', { radius: 75, seed: 9 }], ['tarJar', 'gather', { radius: 114, seed: 9 }], ['smokeTail', 'smoke', { radius: 70, seed: 2 }],
    ['meteorBrush', 'mark', { radius: 96, seed: 4 }], ['twinBlades', 'spin', { radius: 60, seed: 4 }], ['eclipseHalo', 'total', { radius: 230, inner: 0, seed: 6, p: 0.5 }],
    ['fallingScroll', 'unroll', { length: 240, width: 50, seed: 1 }],
    ['inkPots', 'fire', { radius: 110, seed: 4 }], ['tarJar', 'gather', { radius: 168, seed: 3 }], ['smokeTail', 'smoke', { radius: 70, seed: 11 }],
    ['meteorBrush', 'mark', { radius: 115, seed: 2 }], ['twinBlades', 'spin', { radius: 60, seed: 7, p: 0.6, reduced: true }], ['twinBlades', 'spin', { radius: 60, seed: 7, p: 0.9 }],
    ['pinHail', 'caltrop', { radius: 18, seed: 5 }], ['gravePins', 'grave', { radius: 22, seed: 8 }], ['inkLightning', 'pillar', { radius: 40, seed: 2 }],
    ['eclipseHalo', 'total', { radius: 276, inner: 0, seed: 3, p: 0.2 }], ['eclipseHalo', 'total', { radius: 276, inner: 0, seed: 3, p: 0.2, reduced: true }],
    ['fallingScroll', 'unroll', { length: 240, width: 50, seed: 3, p: 0.2 }], ['fallingScroll', 'unroll', { length: 240, width: 50, seed: 3, p: 0.1, reduced: true }],
    ['trackingSeals', 'triangle', { points: [{ x: -80, y: 30 }, { x: 120, y: 70 }, { x: 10, y: -110 }], seed: 2 }], ['trackingSeals', 'triangle', { seed: 2 }],
    ['seventhSeal', 'eighth', { radius: 120, seed: 5 }],
  ],
  lob: { to: [320, -120], t: [0, 0.25, 0.5, 0.75, 1], mini: [[60, 0], [-60, 0]] },
});

export const PACKS = Object.freeze({
  common: { page: 'assets/atlas/common', frames: [...heroFrames(), ...hitFrames(), ...pickupFrames()], animations: fxAnimations() },
  skills: { page: 'assets/packs/skills/atlas', frames: [{ skillVfx: true }] },
  hazards: { page: 'assets/packs/hazards/atlas', frames: [{ hazards: true }] },
  'arsenal-fx': { page: 'assets/packs/arsenal-fx/atlas', frames: [{ arsenalFx: true }] },
  'chapter-01': chapterPack(1),
  'chapter-02': chapterPack(2),
  'chapter-03': chapterPack(3),
  'chapter-04': chapterPack(4),
  'chapter-05': chapterPack(5),
  ...Object.fromEntries(CHARACTER_ART.map((id) => [`hero-${id}`, {
    page: `assets/packs/hero-${id}/atlas`,
    frames: characterFrames(id),
    animations: { [`hero/${id}`]: HERO_STATES },
  }])),
});
