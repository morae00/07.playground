import { CAMPAIGN_CHAPTER_IDS } from '../../content/campaign.ts';
import {
  BOSS_ART,
  ENEMY_VISUAL_ROLES,
  HAZARD_ART,
  HOSTILE_PROJECTILE_ART,
  SKILL_PROJECTILE_ART,
  type VisualChapter,
} from './visualRegistry.ts';

export type IllustrationSlot = Readonly<{
  key: string;
  category: 'player' | 'enemy' | 'boss' | 'projectile' | 'hazard' | 'environment';
  chapter?: VisualChapter;
}>;

export const ILLUSTRATION_SLOTS: readonly IllustrationSlot[] = Object.freeze([
  Object.freeze({ key: 'game/player/hunter', category: 'player' }),
  Object.freeze({ key: 'game/player/mirror-clone', category: 'player' }),
  ...CAMPAIGN_CHAPTER_IDS.flatMap((chapter) => ENEMY_VISUAL_ROLES.map((role) => Object.freeze({
    key: `game/chapter-${String(chapter).padStart(2, '0')}/enemy/${role}`,
    category: 'enemy' as const,
    chapter,
  }))),
  ...Object.entries(BOSS_ART).map(([id, profile]) => Object.freeze({
    key: `game/boss/${id}`,
    category: 'boss' as const,
    chapter: profile.chapter,
  })),
  ...Object.keys(SKILL_PROJECTILE_ART).map((skillId) => Object.freeze({
    key: `game/projectile/skill-${skillId}`,
    category: 'projectile' as const,
  })),
  ...Object.keys(HOSTILE_PROJECTILE_ART).map((kind) => Object.freeze({
    key: `game/projectile/hostile-${kind}`,
    category: 'projectile' as const,
  })),
  ...Object.keys(HAZARD_ART).map((kind) => Object.freeze({
    key: `game/hazard/${kind}`,
    category: 'hazard' as const,
  })),
  ...CAMPAIGN_CHAPTER_IDS.map((chapter) => Object.freeze({
    key: `game/chapter-${String(chapter).padStart(2, '0')}/environment`,
    category: 'environment' as const,
    chapter,
  })),
]);

export function visualRegistryIssues() {
  const issues: string[] = [];
  const enemySlots = ILLUSTRATION_SLOTS.filter((slot) => slot.category === 'enemy');
  const bossValues = Object.values(BOSS_ART);
  if (enemySlots.length !== 20) issues.push(`expected 20 enemy slots, received ${enemySlots.length}`);
  if (bossValues.length !== 15) issues.push(`expected 15 boss profiles, received ${bossValues.length}`);

  const slots = ILLUSTRATION_SLOTS.map((slot) => slot.key);
  const duplicateSlots = slots.filter((slot, index) => slots.indexOf(slot) !== index);
  if (duplicateSlots.length > 0) issues.push(`duplicate illustration slots: ${[...new Set(duplicateSlots)].join(', ')}`);

  for (const [id, profile] of Object.entries(BOSS_ART)) {
    if (!profile.accent || !profile.core) issues.push(`incomplete boss profile ${id}`);
  }
  return issues;
}
