// Characters (CON-10, characters rule; user request 2026-10-12): each starts the run with its own weapon and carries a
// perk, and upgrading a character starts its weapon at a higher level. Not every weapon has a character. Data, not
// code (TEC-05).
// - weapon: the skill the run starts with (a core skill or an arsenal weapon), at `startLevels[level]`.
// - perk: a stat the character adds (`add`) or multiplies by 1 + n (`scale`), for each step: one step at level 0
//   and one more per level.
// - unlock: gold to spend, or a chapter whose tenth stage must be cleared; null for the first character.
// - Upgrades cost `costs[level]` gold, up to level `costs.length`.
import type { SkillId } from '../../game/engine/worldTypes.ts';
import type { StatBlock } from '../../game/GameEngine.ts';
import { deepFreeze } from '../deepFreeze.ts';

export type CharacterDef = { weapon: SkillId; perk: { stat: keyof StatBlock; add?: number; scale?: number }; unlock: { gold?: number; clear?: number } | null };

export default deepFreeze({
  order: ['gyeol', 'dan', 'noeul', 'seori', 'dok', 'hwi', 'ryeong', 'wol'],
  characters: {
    gyeol: { weapon: 'needleStorm', perk: { stat: 'attack', scale: 0.03 }, unlock: null },
    dan: { weapon: 'fanKnives', perk: { stat: 'attackSpeed', scale: 0.03 }, unlock: { gold: 600 } },
    noeul: { weapon: 'chainSpark', perk: { stat: 'critChance', add: 0.02 }, unlock: { clear: 1 } },
    seori: { weapon: 'frostNeedles', perk: { stat: 'moveSpeed', scale: 0.03 }, unlock: { gold: 1200 } },
    dok: { weapon: 'inkPots', perk: { stat: 'maxHp', scale: 0.06 }, unlock: { clear: 2 } },
    hwi: { weapon: 'wideBrush', perk: { stat: 'defense', add: 2 }, unlock: { gold: 2500 } },
    ryeong: { weapon: 'ghostVolley', perk: { stat: 'bossDamage', add: 0.04 }, unlock: { clear: 3 } },
    wol: { weapon: 'eclipseHalo', perk: { stat: 'hpRegen', add: 0.3 }, unlock: { clear: 4 } },
  } as Record<string, CharacterDef>,
  costs: [400, 900, 1800, 3500, 6000],
  startLevels: [1, 2, 2, 3, 3, 4],
});
