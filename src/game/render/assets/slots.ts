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
 * Round bosses with baked art (TEC-03b, ART-07, ART-08): boss definition id -> slot and the pack that holds it.
 * Bosses not listed keep their vector drawing.
 */
export const BOSS_SLOTS: Readonly<Record<string, Readonly<{ slot: string; pack: string }>>> = Object.freeze({
  's1-mid-dash': { slot: 'boss/1/butcher', pack: 'chapter-01' },
  's1-final-rings': { slot: 'boss/1/gaoler', pack: 'chapter-01' },
  's2-final-flame': { slot: 'boss/2/maw', pack: 'chapter-02' },
  's3-final-traps': { slot: 'boss/3/empress', pack: 'chapter-03' },
  's4-final-saw': { slot: 'boss/4/herald', pack: 'chapter-04' },
  's5-final-null': { slot: 'boss/5/balance', pack: 'chapter-05' },
  's2-mid-clones': { slot: 'boss/2/bishop', pack: 'chapter-02' },
  's3-mid-tide': { slot: 'boss/3/tide-king', pack: 'chapter-03' },
  's4-mid-clock': { slot: 'boss/4/tyrant', pack: 'chapter-04' },
  's5-mid-eclipse': { slot: 'boss/5/director', pack: 'chapter-05' },
});

/**
 * Field bosses with baked art (ART-04): boss definition id -> kit body and home chapter. A field boss also roams the
 * chapters after its own, so every chapter pack holds the field bosses of its chapter and the ones before, under
 * that chapter's slot (atlas-spec fieldBossSprites).
 */
export const FIELD_BOSS_KITS: Readonly<Record<string, Readonly<{ kit: string; chapter: number }>>> = Object.freeze({
  'field-shock': { kit: 'commander', chapter: 1 },
  'field-rings': { kit: 'reliquary', chapter: 2 },
  'field-trap': { kit: 'architect', chapter: 3 },
  'field-clock': { kit: 'executioner', chapter: 4 },
  'field-null': { kit: 'judge', chapter: 5 },
});

/** Bosses with kit art also have a boss bar portrait (art/ui-art-spec.mjs BOSS_PORTRAITS). */
export const hasBossArt = (bossId: string) => bossId in BOSS_SLOTS || bossId in FIELD_BOSS_KITS;

/** How a boss's frames are keyed: how many phases it draws and whether it has enraged frames. */
export type BossSlot = Readonly<{ slot: string; pack: string; phases: number; enraged: boolean }>;

/** The slot that draws a boss in the chapter on screen, or undefined when it has no baked art there. */
export function bossSlot(bossId: string, chapter: number): BossSlot | undefined {
  const round = BOSS_SLOTS[bossId];
  if (round) return { ...round, phases: 3, enraged: true };
  const field = FIELD_BOSS_KITS[bossId];
  const pack = CHAPTER_PACKS[chapter];
  if (!field || !pack || field.chapter > chapter) return undefined;
  // Field bosses draw a phase-2 crack mark that phase 3 keeps, and no enraged variant (API-bosses4).
  return { slot: `boss/${chapter}/${field.kit}`, pack, phases: 2, enraged: false };
}

export type BossPose = 'idle' | 'windup' | 'attack';

/**
 * A boss frame's state key: its phase, its pose, and whether it is enraged (atlas-spec bossStates). Bosses whose
 * kit has no attack pose fall back to the idle frame of the same phase (worldRenderer bossSprite).
 */
export function bossState(phase: number, pose: BossPose, enraged: boolean, phases = 3) {
  return `phase${Math.min(phases, Math.max(1, phase))}${pose === 'idle' ? '' : `-${pose}`}${enraged ? '-enraged' : ''}`;
}

/** Atlas packs per chapter; chapters without a pack draw with vectors. Only the chapter on screen stays loaded. */
export const CHAPTER_PACKS: Readonly<Record<number, string>> = Object.freeze({ 1: 'chapter-01', 2: 'chapter-02', 3: 'chapter-03', 4: 'chapter-04', 5: 'chapter-05' });
export const COMMON_PACK = 'common';
/** FX-06, FX-07: the skill VFX stamps, loaded with the common pack and kept for the whole session. */
export const SKILLS_PACK = 'skills';

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
