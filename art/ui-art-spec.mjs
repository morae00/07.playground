// UI art spec (ART-09): the concept-kit drawings the DOM shows (draft cards, HUD skill slots, portraits, pickups).
// scripts/build-ui-art.mjs bakes every sheet into a grid of equal cells at @2x of its CSS size, as WebP, and writes
// a stylesheet that shows one cell per element through percentage background positions, so one sheet serves every
// display size. Art from the concept kit is provisional (style bible §15), like the atlas: hand-cleaned art
// replaces a sheet without code changes.

export const UI_ART_DENSITY = 2;
/** WebP quality. The kit's paper grain makes PNG cells about six times larger with no visible gain. */
export const UI_ART_QUALITY = 0.85;

/** The game's skill ids, in SKILL_IDS order (uiArt.test.ts checks the match). */
export const SKILL_ART = Object.freeze([
  'needleStorm', 'fanKnives', 'chainSpark', 'frostLine', 'orbitScythes', 'boneMortar', 'railSpear', 'mirrorClone',
  'voidMine', 'blackSun', 'ironFrame', 'magnetSigil', 'paperWard', 'recoveryThread', 'coinFever', 'eclipseStep',
  'executionMark',
]);

/**
 * Arsenal weapons the kit has drawn (SYS-15, K9; PN.arsenal META `done`), in arsenal.ts order. The rest wear their
 * look's tile and a two-syllable badge (scripts/build-arsenal-art.mjs) until their delivery is accepted.
 */
export const ARSENAL_ART = Object.freeze([
  'inkDarts', 'brushQuills', 'sealArrows', 'frostNeedles', 'thunderNeedles', 'twinBlades', 'ghostVolley', 'headsmanDarts',
  'paperStorm', 'inkBloom', 'thornHalo', 'starShards', 'sunNeedles', 'inkDrizzle', 'pinHail', 'tailGuard', 'smokeTail',
  'gravePins', 'trackingSeals', 'huntersMarks', 'crowFeathers', 'bossbane',
]);

/** Bonus draft cards (makeBonusOffers) have no skill icon: a kit glyph on the frame of the rarity they come in. */
export const BONUS_ART = Object.freeze([
  { bonus: 'heal', rarity: 'common' },
  { bonus: 'coins', rarity: 'rare' },
  { bonus: 'overdrive', rarity: 'rare' },
  { bonus: 'overdrive', rarity: 'epic' },
]);

/** CON-10 (K8): the other characters, whose portraits sit in a keyed sheet of their own (`<id>-<expr>`). */
export const CHARACTER_PORTRAITS = Object.freeze(['dan', 'noeul', 'seori', 'dok', 'hwi', 'ryeong', 'wol']);

/** HUD portrait expressions of the hero (API-hero §3). */
export const HERO_EXPRESSIONS = Object.freeze(['calm', 'focus', 'hurt', 'lowhp', 'awakened', 'victory']);

/**
 * Boss portraits for the boss bar, keyed by the game's boss id: kit round bosses (API-bosses1, API-bosses2) framed
 * like the hero portrait, with the face anchor near the disc centre. `center` is the kit point on the disc centre
 * and `scale` the disc diameter's share of the drawing; `module` picks the kit (bossesA by default). Bosses without
 * a kit drawing (the field bosses, the Ch2-5 mid bosses) show the plain disc.
 */
export const BOSS_PORTRAITS = Object.freeze({
  's1-mid-dash': { kit: 'butcher', center: [262, 146], scale: 0.5 },
  's1-final-rings': { kit: 'gaoler', center: [230, 128], scale: 0.54 },
  's2-final-flame': { kit: 'maw', center: [204, 236], scale: 0.5 },
  's3-final-traps': { kit: 'empress', module: 'bossesB', center: [196, 112], scale: 0.36 },
  's4-final-saw': { kit: 'herald', module: 'bossesB', center: [306, 168], scale: 0.34 },
  's5-final-null': { kit: 'balance', module: 'bossesB', center: [330, 158], scale: 0.34 },
  // Ch2-5 mid bosses (ART-07, ART-08): framing from PN.bossesC META[id].portrait, game detail like the round bosses.
  's2-mid-clones': { kit: 'bishop', module: 'bossesC', center: [205, 134], scale: 0.36 },
  's3-mid-tide': { kit: 'tide-king', module: 'bossesC', center: [220, 124], scale: 0.44 },
  's4-mid-clock': { kit: 'tyrant', module: 'bossesC', center: [212, 102], scale: 0.36 },
  's5-mid-eclipse': { kit: 'director', module: 'bossesC', center: [210, 94], scale: 0.38 },
  // Field bosses (ART-04): the framing comes from PN.fieldBosses.anchors(id).portrait. Art detail, because the
  // portrait scale makes game outlines the heaviest lines on the sheet (K2 review, user decision 2026-10-02).
  'field-shock': { kit: 'commander', module: 'fieldBosses', center: [208, 169], scale: 0.27, detail: 'art' },
  'field-rings': { kit: 'reliquary', module: 'fieldBosses', center: [164, 193], scale: 0.3, detail: 'art' },
  'field-trap': { kit: 'architect', module: 'fieldBosses', center: [236, 185], scale: 0.2, detail: 'art' },
  'field-clock': { kit: 'executioner', module: 'fieldBosses', center: [214, 153], scale: 0.23, detail: 'art' },
  'field-null': { kit: 'judge', module: 'fieldBosses', center: [205, 171], scale: 0.22, detail: 'art' },
});

export const PICKUP_ART = Object.freeze(['xp', 'coin', 'magnet', 'heal']);

/** Menu art (UI-06): chapter thumbnails from each chapter's landmark vignette, and each chapter's four enemy roles. */
export const MENU_CHAPTERS = Object.freeze([1, 2, 3, 4, 5]);
export const ENEMY_ROLES = Object.freeze(['stalker', 'charger', 'shooter', 'warden']);
/** Codex art (CON-07): the nine terrain kinds as the kit draws them in play (API-env hazard), at rest. */
export const TERRAIN_KINDS = Object.freeze(['water', 'trap', 'fire', 'slow', 'root', 'null', 'shock', 'warning', 'vortex']);

function skillTiles() {
  const items = [];
  for (const id of SKILL_ART) {
    items.push({ key: id, recipe: 'tile', args: [id, false] });
    items.push({ key: `${id}-awakened`, recipe: 'tile', args: [id, true] });
  }
  for (const { bonus, rarity } of BONUS_ART) items.push({ key: `bonus-${bonus}-${rarity}`, recipe: 'bonusTile', args: [bonus, rarity] });
  return items;
}

const arsenalCells = (recipe) => ARSENAL_ART.flatMap((id) => [
  { key: id, recipe, args: [id, false] },
  { key: `${id}-awakened`, recipe, args: [id, true] },
]);

function hudSlots() {
  return SKILL_ART.flatMap((id) => [
    { key: id, recipe: 'slot', args: [id, false] },
    { key: `${id}-awakened`, recipe: 'slot', args: [id, true] },
  ]);
}

function portraits() {
  const items = HERO_EXPRESSIONS.map((expr) => ({ key: `hero-${expr}`, recipe: 'heroPortrait', args: [expr] }));
  for (const [bossId, spec] of Object.entries(BOSS_PORTRAITS)) {
    items.push({ key: bossId, recipe: 'bossPortrait', args: [spec, false] });
    items.push({ key: `${bossId}-enraged`, recipe: 'bossPortrait', args: [spec, true] });
  }
  return items;
}

/**
 * Sheets. `cell` is the CSS size of one cell, `origin` the drawing's point at the cell's top-left, both in CSS
 * pixels of the drawing as the recipe returns it.
 * - arsenalTiles, arsenalSlots (keyed): the drawn arsenal weapons (ARSENAL_ART) on the tiles' and slots' cells, in
 *   sheets of their own (brief K9 Q1) that share the tiles' and slots' classes: each key names its sheet itself.
 * - tiles: the 160 kit card drawn at 150 (a 120 icon, the draft card size in UI-03), with room for the 4 unit
 *   offset shadow and the awakened ink blots. The card sits 8 px inside the cell.
 * - slots: the kit's 52×56 HUD slot at 40 (API-icons hudSlot) without the level pips, which the HUD draws, so one
 *   cell serves every level. The slot sits 2 px inside the cell.
 * - portraits: the 160 kit portrait drawn at 96 (HUD portrait 84, boss bar smaller), 1 px inside the cell.
 * - pickups: the 48 kit box drawn at 24 (HUD chips), 2 px inside the cell for the magnet's pull dashes.
 * - keyart: the hero's full-body three-quarter view (API-hero §1, 400×640) at 0.9 for the menu (UI-06).
 * - chapters: the kit landmark vignette (API-env, 280×150, full bleed with its own floor) at 0.6, for chapter cards.
 * - enemies: each chapter's four roles in the game LOD, fitted to the cell by their drawn bounds, 3 px inside.
 * - terrain: the kit hazard circle (API-env hazard) at a 22 radius for the codex (shock 16, for its spikes).
 * `bleed` sheets fill their cells edge to edge, so the bake skips its edge check for them.
 */
export const UI_SHEETS = Object.freeze({
  tiles: { file: 'skill-tiles', className: 'artTile', columns: 8, cell: [166, 166], origin: [-8, -8], items: skillTiles() },
  slots: { file: 'hud-slots', className: 'artSlot', columns: 9, cell: [56, 60], origin: [-2, -2], items: hudSlots() },
  arsenalTiles: { file: 'arsenal-tiles', className: 'artTile', keyed: true, columns: 8, cell: [166, 166], origin: [-8, -8], items: arsenalCells('arsenalTile') },
  arsenalSlots: { file: 'arsenal-slots', className: 'artSlot', keyed: true, columns: 9, cell: [56, 60], origin: [-2, -2], items: arsenalCells('arsenalSlot') },
  portraits: { file: 'portraits', className: 'artPortrait', columns: 5, cell: [98, 98], origin: [-1, -1], items: portraits() },
  characterPortraits: {
    file: 'character-portraits',
    className: 'artPortrait',
    keyed: true,
    columns: 6,
    cell: [98, 98],
    origin: [-1, -1],
    items: CHARACTER_PORTRAITS.flatMap((id) => HERO_EXPRESSIONS.map((expr) => ({ key: `${id}-${expr}`, recipe: 'characterPortrait', args: [id, expr] }))),
  },
  pickups: { file: 'pickups', className: 'artPickup', columns: 4, cell: [28, 28], origin: [-2, -2], items: PICKUP_ART.map((kind) => ({ key: kind, recipe: 'pickup', args: [kind] })) },
  keyart: { file: 'keyart', className: 'artKeyart', columns: 1, cell: [360, 576], origin: [0, 0], items: [{ key: 'hero', recipe: 'keyart', args: ['threeQuarter'] }] },
  chapters: { file: 'chapter-thumbs', className: 'artChapter', columns: 5, cell: [168, 90], origin: [0, 0], bleed: true, items: MENU_CHAPTERS.map((ch) => ({ key: `chapter-${ch}`, recipe: 'landmark', args: [ch] })) },
  enemies: {
    file: 'enemy-icons',
    className: 'artEnemy',
    columns: 10,
    cell: [48, 48],
    origin: [0, 0],
    items: MENU_CHAPTERS.flatMap((ch) => ENEMY_ROLES.map((role) => ({ key: `${ch}-${role}`, recipe: 'enemyIcon', args: [ch, role] }))),
  },
  terrain: { file: 'terrain-icons', className: 'artTerrain', columns: 9, cell: [64, 64], origin: [-32, -32], items: TERRAIN_KINDS.map((kind) => ({ key: kind, recipe: 'hazard', args: [kind] })) },
});

/**
 * Story panels (CON-06): the prologue, the chapter intros and outros, and the ending, composed from the kit's
 * landmark vignettes, the hero, the chapter's enemies, and its ruler (the final boss). Each panel is a 16:9 scene of
 * `size` CSS px baked at `density`, written to its own file in public/assets/packs/story/, and loaded only when a
 * story beat plays (it is not part of the first screen). The words stay in the DOM (public/assets/content/story.json),
 * never in the art. A scene is:
 * - `ch`: the chapter's landmark vignette, widened to the panel (API-env), or `paper` for plain paper;
 * - `blank`: the white void eating the scene from x `from` rightwards, with a ragged ink fringe (lore bible §1.1);
 *   `margin`: the void become a margin, ruled off with a double ink line (§7.2); `seam`: stitches down x;
 * - `hero`: a full-body pose (API-hero §1) standing on `ground` at x, scaled; `enemies`: [role, x, scale, flip];
 * - `boss`: the chapter's ruler, `fallen` (its fall's second frame, faded) after its defeat; `drop`: one ink drop at [x, y].
 * The six beats D-15 (b) gave hand-drawn panels (the prologue and ending-2, ending-4) are instead `kit: 'story'`: the
 * kit's own panel (K6, art/concept-kit/k-story.js), with its paper grain when `grain` is set.
 */
export const STORY_PANEL = Object.freeze({ size: [480, 270], density: 2.5, ground: 252 });

const storyHero = (pose, x, scale = 0.34, flip = false) => ({ pose, x, scale, flip });
const RULERS = Object.freeze({
  1: { kit: 'gaoler' },
  2: { kit: 'maw' },
  3: { kit: 'empress', module: 'bossesB' },
  4: { kit: 'herald', module: 'bossesB' },
  5: { kit: 'balance', module: 'bossesB' },
});
const outro = (ch) => ({ ch, boss: { ...RULERS[ch], x: 340, scale: ch >= 3 ? 0.56 : 0.52, fallen: true }, hero: storyHero('threeQuarter', 118, 0.32) });

export const STORY_PANELS = Object.freeze({
  'prologue-1': { kit: 'story', grain: true },
  'prologue-2': { kit: 'story', grain: true },
  'prologue-3': { kit: 'story', grain: true },
  'prologue-4': { kit: 'story', grain: true },
  'intro-2': { ch: 2, hero: storyHero('run', 104, 0.3), enemies: [['warden', 400, 0.48, true]] },
  'intro-3': { ch: 3, hero: storyHero('run', 104, 0.3), enemies: [['charger', 404, 0.56, true]] },
  'intro-4': { ch: 4, hero: storyHero('run', 104, 0.3), enemies: [['shooter', 404, 0.56, true]] },
  'intro-5': { ch: 5, hero: storyHero('run', 104, 0.3), enemies: [['stalker', 392, 0.66, true], ['warden', 446, 0.46, true]] },
  'outro-1': outro(1),
  'outro-2': outro(2),
  'outro-3': outro(3),
  'outro-4': outro(4),
  'outro-5': outro(5),
  'ending-1': { ch: 5, blank: { from: 228 }, hero: storyHero('back', 118) },
  'ending-2': { kit: 'story', grain: true },
  'ending-3': { ch: 5, margin: 262, hero: storyHero('front', 144, 0.34) },
  'ending-4': { kit: 'story', grain: true },
  'ending-5': { paper: true, hero: storyHero('front', 240, 0.4) },
  'ending-6': { ch: 1 },
  'ending-7': { paper: true, drop: [392, 66] },
});
