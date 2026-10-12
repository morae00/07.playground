// Characters (CON-10): the roster, a character's starting weapon level, and its perk on the stats. The menu, the
// engine, and the stats screen all read them from here.
import CHARACTER_TABLE from '../content/data/characters.ts';
import type { StatBlock } from './GameEngine.ts';

export const CHARACTERS = CHARACTER_TABLE.characters;
export const CHARACTER_IDS = CHARACTER_TABLE.order;
export const CHARACTER_COSTS = CHARACTER_TABLE.costs;
export const CHARACTER_MAX_LEVEL = CHARACTER_TABLE.costs.length;

/** A character on a run: who, and how far upgraded (0 to CHARACTER_MAX_LEVEL). */
export type CharacterLoadout = Readonly<{ id: string; level: number }>;

/** The level a character's weapon starts at. */
export const characterStartLevel = (level: number) => CHARACTER_TABLE.startLevels[Math.max(0, Math.min(CHARACTER_MAX_LEVEL, Math.floor(level)))];

/** A character's perk at a level: one step at level 0 and one more per level, as the stat's addend or factor. */
export function characterPerk(loadout: CharacterLoadout) {
  const def = CHARACTERS[loadout.id];
  if (!def) return null;
  const steps = Math.max(0, Math.min(CHARACTER_MAX_LEVEL, Math.floor(loadout.level))) + 1;
  return { stat: def.perk.stat, add: (def.perk.add ?? 0) * steps, scale: (def.perk.scale ?? 0) * steps };
}

/** Adds a character's perk to built stats. */
export function applyCharacterPerk(stats: StatBlock, loadout: CharacterLoadout | null | undefined) {
  const perk = loadout ? characterPerk(loadout) : null;
  if (!perk) return;
  stats[perk.stat] = stats[perk.stat] * (1 + perk.scale) + perk.add;
}
