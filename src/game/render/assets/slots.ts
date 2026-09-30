// Slot system v2 (TEC-03): which game visuals are drawn from the sprite atlas instead of vector shapes.
// A slot is used as soon as its frames are baked and its pack is loaded; listing it in DISABLED_SLOTS rolls
// it back to the vector renderer in one line. Missing or failed packs always fall back to vectors.
import type { EnemyTier } from '../../engine/worldTypes.ts';
import { enemyRoleFor, type EnemyVisualRole } from '../visualRegistry.ts';

export const DISABLED_SLOTS: ReadonlySet<string> = new Set<string>([
  // 'hero',
  // 'enemy/1/shooter',
]);

export const HERO_SLOT = 'hero';
/** Shared effects in the common pack: the hit star (FX-03). */
export const FX_SLOT = 'fx';
/** Pickups in the common pack (ART-06): the XP jade in three sizes and the coin. */
export const PICKUP_SLOT = 'pickup';
/** XP values from which a pickup (merged drops add up) shows the middle and the large jade. */
export const XP_JADE_STEPS = Object.freeze([8, 24]);

export function pickupState(kind: 'xp' | 'coin', value: number) {
  if (kind === 'coin') return 'coin';
  return value >= XP_JADE_STEPS[1] ? 'xp3' : value >= XP_JADE_STEPS[0] ? 'xp2' : 'xp1';
}
export type HeroState = 'idle' | 'run' | 'throw' | 'hurt';

export const slotEnabled = (slot: string) => !DISABLED_SLOTS.has(slot);
export const frameKey = (slot: string, state: string, frame: number) => `${slot}/${state}/${frame}`;

/**
 * Round bosses with baked art (TEC-03b, ART-07): boss definition id -> slot and the pack that holds it. Bosses not
 * listed (field bosses, and the Ch2-5 mid bosses the kit has not drawn yet) keep their vector drawing.
 */
export const BOSS_SLOTS: Readonly<Record<string, Readonly<{ slot: string; pack: string }>>> = Object.freeze({
  's1-mid-dash': { slot: 'boss/1/butcher', pack: 'chapter-01' },
  's1-final-rings': { slot: 'boss/1/gaoler', pack: 'chapter-01' },
  's2-final-flame': { slot: 'boss/2/maw', pack: 'chapter-02' },
  's3-final-traps': { slot: 'boss/3/empress', pack: 'chapter-03' },
});

/** A boss frame's state key: its phase, whether it winds up, whether it is enraged (atlas-spec bossStates). */
export function bossState(phase: number, windup: boolean, enraged: boolean) {
  return `phase${Math.min(3, Math.max(1, phase))}${windup ? '-windup' : ''}${enraged ? '-enraged' : ''}`;
}

/** Atlas packs per chapter; chapters without a pack draw with vectors. Only the chapter on screen stays loaded. */
export const CHAPTER_PACKS: Readonly<Record<number, string>> = Object.freeze({ 1: 'chapter-01', 2: 'chapter-02', 3: 'chapter-03' });
export const COMMON_PACK = 'common';

export function enemySlot(chapter: number, tier: EnemyTier, attackStyle: 'contact' | 'ranged') {
  return `enemy/${chapter}/${enemyRoleFor(tier, attackStyle)}`;
}

/**
 * Extra draw scale on top of the baked role size. Shooters come in several tiers from one drawing: the kit
 * places the medium shooter at x1.26 so its feet land on the r19 hit circle (API-enemies).
 */
export function enemyDrawScale(role: EnemyVisualRole, tier: EnemyTier) {
  if (role !== 'shooter') return 1;
  return tier === 'small' ? 1 : tier === 'medium' ? 1.26 : 1.6;
}
