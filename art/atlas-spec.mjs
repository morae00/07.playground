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
 * Enemy roles (API-enemies): walk frames, and a size fit that brings the kit's display size inside the style
 * bible's §7.1 ranges (hit radii never change). Values above 1 are not allowed.
 */
export const ENEMY_ROLES = Object.freeze({
  stalker: { walkFps: 8, fit: 36 / 40 },
  charger: { walkFps: 10, fit: 52 / 54 },
  shooter: { walkFps: 4, fit: 36 / 46 },
  warden: { walkFps: 6, fit: 1 },
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
 * Ch1 round bosses from PN.bossesA (API-bosses1): 400x400 box facing right, feet at y 392, 0.4 world units per
 * box unit. Every phase (1-3) comes in idle and windup, calm and enraged. The windup key bow rises 132 units
 * above the box, so the cells get 150 units of extra room on top.
 */
export const BOSS_SPRITES = Object.freeze({
  'boss/1/butcher': { kit: 'butcher', bossId: 's1-mid-dash' },
  'boss/1/gaoler': { kit: 'gaoler', bossId: 's1-final-rings' },
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

function bossFrames() {
  const frames = [];
  for (const [slot, { kit }] of Object.entries(BOSS_SPRITES)) {
    for (const state of bossStates()) {
      frames.push({
        key: `${slot}/${state.key}/0`,
        call: ['PN.bossesA.draw', kit, { phase: state.phase, windup: state.windup, enraged: state.enraged, lod: 'game', halo: true, shadow: false, fx: true }],
        box: [400, 400],
        anchor: [200, 392],
        scale: 0.4,
        extraPad: [150, 0, 0, 0],
      });
    }
  }
  return frames;
}

function bossAnimations() {
  return Object.fromEntries(Object.keys(BOSS_SPRITES).map((slot) => [slot, Object.fromEntries(bossStates().map((state) => [state.key, { frames: 1, fps: 1 }]))]));
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
/** Hit radius of each Ch1 role in the kit, in world units (PN._ki.SIL r). */
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

/** Filled from the kit's own metadata at bake time (box, pivot, feet, displayScale, walk frame count). */
function enemyFrames(chapter) {
  return Object.entries(ENEMY_ROLES).map(([role, { fit }]) => ({
    enemy: { chapter, role, fit },
    keyPrefix: `enemy/${chapter}/${role}`,
  }));
}

export const PACKS = Object.freeze({
  common: { page: 'assets/atlas/common', frames: [...heroFrames(), ...hitFrames(), ...pickupFrames()], animations: fxAnimations() },
  'chapter-01': { page: 'assets/packs/chapter-01/atlas', frames: [...enemyFrames(1), ...bossFrames(), ...killFrames(1)], animations: { ...bossAnimations(), ...fxAnimations(1) } },
});
