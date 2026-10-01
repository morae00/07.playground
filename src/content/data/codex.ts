// Codex (CON-07): every entry the codex shows, in its order, one to one with the illustration slots
// (src/game/render/illustrationManifest.ts): 17 skills, 20 enemies (each chapter's four roles), 15 bosses, nine terrain
// kinds, and five chapters. Data, not code (TEC-05). The entries' text is lore draft data in
// public/assets/content/codex.json (docs/lore/lore-bible.md §4-6), fetched when the codex opens.
// - An entry is found in play: a skill when it is taken, an enemy or a boss when it is defeated, terrain when the hero
//   stands in it or casts it, a chapter when one of its stages starts. Saves from before the codex find what their
//   stage records show (G17).
import { deepFreeze } from '../deepFreeze.ts';

const roles = ['stalker', 'charger', 'shooter', 'warden'];

export default deepFreeze({
  skills: [
    'needleStorm', 'fanKnives', 'chainSpark', 'frostLine', 'orbitScythes', 'boneMortar', 'railSpear', 'mirrorClone', 'voidMine',
    'blackSun', 'eclipseStep', 'ironFrame', 'magnetSigil', 'paperWard', 'recoveryThread', 'coinFever', 'executionMark',
  ],
  enemies: [1, 2, 3, 4, 5].flatMap((chapter) => roles.map((role) => `${chapter}-${role}`)),
  bosses: [
    'field-shock', 's1-mid-dash', 's1-final-rings',
    'field-rings', 's2-mid-clones', 's2-final-flame',
    'field-trap', 's3-mid-tide', 's3-final-traps',
    'field-clock', 's4-mid-clock', 's4-final-saw',
    'field-null', 's5-mid-eclipse', 's5-final-null',
  ],
  terrain: ['water', 'trap', 'fire', 'slow', 'root', 'null', 'shock', 'warning', 'vortex'],
  chapters: ['1', '2', '3', '4', '5'],
});
