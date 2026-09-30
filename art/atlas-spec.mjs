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

/** Filled from the kit's own metadata at bake time (box, pivot, feet, displayScale, walk frame count). */
function enemyFrames(chapter) {
  return Object.entries(ENEMY_ROLES).map(([role, { fit }]) => ({
    enemy: { chapter, role, fit },
    keyPrefix: `enemy/${chapter}/${role}`,
  }));
}

export const PACKS = Object.freeze({
  common: { page: 'assets/atlas/common', frames: heroFrames() },
  'chapter-01': { page: 'assets/packs/chapter-01/atlas', frames: enemyFrames(1) },
});
