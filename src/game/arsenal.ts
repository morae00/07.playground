// The arsenal's numbers at a level (SYS-15): the engine fires them and the draft cards print them from here.
import ARSENAL_TABLE, { type ArsenalWeapon } from '../content/data/arsenal.ts';
import type { ArsenalId, SkillId } from './engine/worldTypes.ts';

export const ARSENAL = ARSENAL_TABLE.weapons;
export const ARSENAL_IDS = Object.keys(ARSENAL) as ArsenalId[];
/** Content tables reach the app as their default export only (TEC-05), so the awakening numbers come through here. */
export const ARSENAL_AWAKENING = ARSENAL_TABLE.awakening;

export const isArsenal = (id: SkillId): id is ArsenalId => id in ARSENAL;

/** The active skill whose art draws a skill: an arsenal weapon's look, or the skill itself. */
export const lookOf = (id: SkillId) => (isArsenal(id) ? ARSENAL[id].look : id);

const at = ([base, perLevel]: readonly [number, number], level: number) => base + perLevel * (level - 1);

/** A weapon's numbers at a level: damage (times attack), cooldown (before attack speed), counts, and reach. */
export function arsenalStats(weapon: ArsenalWeapon, level: number, awakened: boolean) {
  const awakening = ARSENAL_AWAKENING;
  const reach = awakened ? awakening.reach : 1;
  const extra = awakened ? awakening.count : 0;
  return {
    damage: at(weapon.damage, level) * (awakened ? awakening.damage : 1),
    cooldown: Math.max(weapon.cooldown[2], weapon.cooldown[0] - weapon.cooldown[1] * (level - 1)),
    count: Math.floor(at(weapon.count ?? [1, 0], level)) + extra,
    jumps: Math.floor(at(weapon.jumps ?? [0, 0], level)) + extra,
    radius: at(weapon.radius ?? [0, 0], level) * reach,
    length: at(weapon.length ?? [0, 0], level) * reach,
  };
}
