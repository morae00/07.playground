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
export type HeroState = 'idle' | 'run' | 'throw' | 'hurt';

export const slotEnabled = (slot: string) => !DISABLED_SLOTS.has(slot);
export const frameKey = (slot: string, state: string, frame: number) => `${slot}/${state}/${frame}`;

/** Atlas packs per chapter; chapters without a pack draw with vectors. */
export const CHAPTER_PACKS: Readonly<Record<number, string>> = Object.freeze({ 1: 'chapter-01' });
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
