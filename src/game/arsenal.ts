// The arsenal's numbers at a level (SYS-15): the engine fires them and the draft cards print them from here.
import ARSENAL_TABLE, { type ArsenalWeapon } from '../content/data/arsenal.ts';
import type { ArsenalId, SkillId } from './engine/worldTypes.ts';

export const ARSENAL = ARSENAL_TABLE.weapons;
export const ARSENAL_IDS = Object.keys(ARSENAL) as ArsenalId[];
/** Content tables reach the app as their default export only (TEC-05), so the awakening numbers come through here. */
export const ARSENAL_AWAKENING = ARSENAL_TABLE.awakening;
/** The balance audit's P2-1 proposals (each under its rule flag, off in both rule sets). */
export const ARSENAL_RETUNE = ARSENAL_TABLE.retune;

export const isArsenal = (id: SkillId): id is ArsenalId => id in ARSENAL;

/** The active skill whose art draws a skill: an arsenal weapon's look, or the skill itself. */
export const lookOf = (id: SkillId) => (isArsenal(id) ? ARSENAL[id].look : id);

const at = ([base, perLevel]: readonly [number, number], level: number) => base + perLevel * (level - 1);

/** P2-1: which of the proposals' rule flags apply to a weapon's numbers (GameEngine.arsenalTuning). */
export type ArsenalTuning = Readonly<{ id: ArsenalId; lobSingle: boolean; awakeningScale: boolean; rarityDamage: boolean }>;

/** The kinds that fire `count` of something; a chain grows by its hops, and novas, halos, and beams by neither. */
const COUNTED: ReadonlySet<ArsenalWeapon['kind']> = new Set(['volley', 'burst', 'spray', 'rear', 'seeker', 'strike', 'lob']);

/**
 * A weapon's numbers at a level: damage (times attack), cooldown (before attack speed), counts, and reach. `tuning`
 * applies the P2-1 proposals whose rule flags are on; without it the numbers are the arsenal rule's own.
 */
export function arsenalStats(weapon: ArsenalWeapon, level: number, awakened: boolean, tuning?: ArsenalTuning) {
  const awakening = ARSENAL_AWAKENING;
  const reach = awakened ? awakening.reach : 1;
  const extra = awakened ? awakening.count : 0;
  const base = Math.floor(at(weapon.count ?? [1, 0], level));
  const baseJumps = Math.floor(at(weapon.jumps ?? [0, 0], level));
  let damage = at(weapon.damage, level) * (awakened ? awakening.damage : 1);
  let count = base + extra;
  let jumps = baseJumps + extra;
  if (tuning) {
    const retune = ARSENAL_RETUNE;
    if (tuning.rarityDamage) damage *= retune.rarityDamage[weapon.rarity];
    // What the count would be before rounding: one blast of a single lob carries this many.
    let throws = count;
    if (tuning.awakeningScale && awakened) {
      const share = 1 + retune.awakeningCount;
      if (weapon.kind === 'chain') {
        jumps = Math.max(baseJumps, Math.round((baseJumps + 1) * share) - 1);
        damage *= ((baseJumps + 1) * share) / (jumps + 1);
        count = base;
      } else if (COUNTED.has(weapon.kind)) {
        throws = base * share;
        count = Math.max(base, Math.round(throws));
        damage *= throws / count;
      } else {
        count = base;
        damage *= share;
      }
    }
    if (tuning.lobSingle && retune.lobScatter[tuning.id] !== undefined) {
      damage *= (count / throws) * (1 + retune.lobFold * (throws - 1));
      count = 1;
    }
  }
  return {
    damage,
    cooldown: Math.max(weapon.cooldown[2], weapon.cooldown[0] - weapon.cooldown[1] * (level - 1)),
    count,
    jumps,
    radius: at(weapon.radius ?? [0, 0], level) * reach,
    length: at(weapon.length ?? [0, 0], level) * reach,
  };
}
