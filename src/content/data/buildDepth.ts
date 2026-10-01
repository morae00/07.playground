// Build depth (SYS-08, buildDepth rule): build slots, the owned-skill weight, fusion awakenings, draft tokens, and the
// XP curve. Data, not code: built apps read it from assets/content/tables.json, and tests and tools import this module
// (see ./index.ts).
// - slots: how many active and passive skills a build holds. Once a kind is full, drafts offer no new skill of it.
// - ownedWeight: multiplies an owned skill's draft weight, after its rarity weight and the luck and stage biases.
// - tokenLevels: the account levels that each unlock one reroll-or-banish token a stage (two at most).
// - xpScale, xpGrowth: level L needs the usual XP × xpScale × (1 + xpGrowth × (L - 1)), so an 8-minute stage opens
//   20-28 drafts while the first levels stay close to the usual.
// - fusions: once both of a fusion's skills are awakened, its card takes the last place in every draft until it is
//   picked. It adds to the two awakenings and never takes the first place, which stays the awakening card's (G3, G4).
import type { SkillId } from '../../game/engine/worldTypes.ts';
import type { Rarity } from '../../game/GameEngine.ts';
import { deepFreeze } from '../deepFreeze.ts';

export type FusionDef = { materials: readonly [SkillId, SkillId]; rarity: Rarity };

const fusions = {
  executionRain: { materials: ['needleStorm', 'executionMark'], rarity: 'legendary' },
  frostChain: { materials: ['chainSpark', 'frostLine'], rarity: 'epic' },
  voidMortar: { materials: ['boneMortar', 'voidMine'], rarity: 'epic' },
  mirrorRail: { materials: ['railSpear', 'mirrorClone'], rarity: 'legendary' },
  eclipseSun: { materials: ['blackSun', 'eclipseStep'], rarity: 'mythic' },
  ironWard: { materials: ['ironFrame', 'paperWard'], rarity: 'rare' },
} satisfies Record<string, FusionDef>;

export type FusionId = keyof typeof fusions;

export default deepFreeze({
  slots: { active: 6, passive: 4 },
  ownedWeight: 2,
  tokenLevels: [8, 16],
  xpScale: 0.6,
  xpGrowth: 0.1,
  fusions: fusions as Record<FusionId, FusionDef>,
  /** 집행 바늘비: extra needles a volley, and the health share under which a needle finishes an enemy (not a boss). */
  executionRain: { extraNeedles: 2, executeBelow: 0.15 },
  /** 공허 박격: a void opens where a shell will land, at this share of the shell's radius, for this long. */
  voidMortar: { radius: 0.9, seconds: 1.1 },
  /** 일식 흑점: a step leaves a black sun at this share of the black sun's radius and duration. */
  eclipseSun: { scale: 0.7 },
  /** 강철 부적: the ward's push on a hit also deals this share of attack and stuns. */
  ironWard: { damage: 1.2, stunSeconds: 0.6 },
});
