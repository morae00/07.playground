// Achievements (CON-07): 30 goals over the save, checked after every settlement and when a save loads, so a save from
// before them earns what it already did (G17). Each unlocks one cosmetic (./cosmetics.ts). Data, not code (TEC-05).
// Each shows as the string achievement.<id>, and its goal as the string achievement.goal.<kind>. Kinds:
// - clears: distinct stages cleared; chapter: the chapter's tenth stage cleared; level: the account level
// - stars: stars over every stage; perfect: stages with all three stars
// - kills, bosses, runs: the career totals; noHit: a no-hit clear; swift: boss stages beaten before their bosses enraged
// - codex: entries found in a codex part, or in all of it (part omitted); survive: one infinite run lasting n seconds
import { deepFreeze } from '../deepFreeze.ts';
import type { CosmeticId } from './cosmetics.ts';

export type AchievementKind = 'clears' | 'chapter' | 'level' | 'stars' | 'perfect' | 'kills' | 'bosses' | 'runs' | 'noHit' | 'swift' | 'codex' | 'survive';
export type AchievementDef = { kind: AchievementKind; n: number; part?: 'skills' | 'enemies' | 'bosses' | 'terrain' | 'chapters'; reward: CosmeticId };

const achievements = {
  'first-clear': { kind: 'clears', n: 1, reward: 'title-scribe' },
  'chapter-1': { kind: 'chapter', n: 1, reward: 'title-alley' },
  'chapter-2': { kind: 'chapter', n: 2, reward: 'title-chapel' },
  'chapter-3': { kind: 'chapter', n: 3, reward: 'title-canal' },
  'chapter-4': { kind: 'chapter', n: 4, reward: 'title-clock' },
  'chapter-5': { kind: 'chapter', n: 5, reward: 'title-eclipse' },
  'all-stages': { kind: 'clears', n: 50, reward: 'frame-seal' },
  'level-10': { kind: 'level', n: 10, reward: 'outline-paper' },
  'level-25': { kind: 'level', n: 25, reward: 'outline-slate' },
  'stars-10': { kind: 'stars', n: 10, reward: 'trail-dots' },
  'stars-30': { kind: 'stars', n: 30, reward: 'title-stars' },
  'stars-60': { kind: 'stars', n: 60, reward: 'trail-chalk' },
  'stars-100': { kind: 'stars', n: 100, reward: 'frame-double' },
  'stars-150': { kind: 'stars', n: 150, reward: 'frame-ink-gold' },
  'perfect-1': { kind: 'perfect', n: 1, reward: 'trail-brush' },
  'perfect-10': { kind: 'perfect', n: 10, reward: 'frame-brush' },
  'kills-1k': { kind: 'kills', n: 1000, reward: 'outline-silver' },
  'kills-10k': { kind: 'kills', n: 10000, reward: 'title-hunter' },
  'kills-50k': { kind: 'kills', n: 50000, reward: 'outline-indigo' },
  'bosses-10': { kind: 'bosses', n: 10, reward: 'trail-ash' },
  'bosses-50': { kind: 'bosses', n: 50, reward: 'outline-rust' },
  'no-hit': { kind: 'noHit', n: 1, reward: 'title-flawless' },
  'swift-5': { kind: 'swift', n: 5, reward: 'trail-thread' },
  'codex-skills': { kind: 'codex', n: 17, part: 'skills', reward: 'frame-knot' },
  'codex-enemies': { kind: 'codex', n: 20, part: 'enemies', reward: 'trail-paper' },
  'codex-bosses': { kind: 'codex', n: 15, part: 'bosses', reward: 'outline-moss' },
  'codex-terrain': { kind: 'codex', n: 9, part: 'terrain', reward: 'frame-dashed' },
  'codex-all': { kind: 'codex', n: 66, reward: 'title-codex' },
  'survive-600': { kind: 'survive', n: 600, reward: 'title-endless' },
  'runs-100': { kind: 'runs', n: 100, reward: 'title-hundred' },
} satisfies Record<string, AchievementDef>;

export type AchievementId = keyof typeof achievements;

export default deepFreeze({ achievements: achievements as Record<AchievementId, AchievementDef> });
