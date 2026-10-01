// Achievements (CON-07): how far a save is toward each goal, and which goals it has just met. Worked out from the save
// alone (stage records, career totals, codex, account level), so a save from before achievements earns what it
// already did (G17). Infinite survival reads the longest run on the local board too.
import ACHIEVEMENTS, { type AchievementDef, type AchievementId } from '../content/data/achievements.ts';
import CODEX from '../content/data/codex.ts';
import { stageStars, type MetaState, type ProfileData } from '../platform/save.ts';

export const ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENTS.achievements) as AchievementId[];

const inCodex = (profile: ProfileData, part: keyof typeof CODEX) => profile.codex[part].filter((id) => (CODEX[part] as readonly string[]).includes(id)).length;

/** A goal's count so far and its target; a yes-or-no goal counts to 1. */
export function achievementProgress(def: AchievementDef, profile: ProfileData, meta: MetaState, bestInfiniteSeconds: number) {
  const records = Object.values(profile.stageRecords);
  const count = (value: number, goal = def.n) => ({ value: Math.min(value, goal), goal });
  switch (def.kind) {
    case 'clears': return count(records.filter((record) => record.clears > 0).length);
    case 'chapter': return count((profile.stageRecords[`${def.n}-10`]?.clears ?? 0) > 0 ? 1 : 0, 1);
    case 'level': return count(meta.level);
    case 'stars': return count(records.reduce((sum, record) => sum + stageStars(record).filter(Boolean).length, 0));
    case 'perfect': return count(records.filter((record) => stageStars(record).every(Boolean)).length);
    case 'kills': return count(profile.stats.kills);
    case 'bosses': return count(profile.stats.bossKills);
    case 'runs': return count(profile.stats.runs);
    case 'noHit': return count(records.some((record) => record.noHit) ? 1 : 0, 1);
    case 'swift': return count(records.filter((record) => record.swift).length);
    case 'codex': return count(def.part ? inCodex(profile, def.part) : (Object.keys(CODEX) as (keyof typeof CODEX)[]).reduce((sum, part) => sum + inCodex(profile, part), 0));
    case 'survive': return count(Math.floor(bestInfiniteSeconds));
  }
}

/** Goals met that the save has not recorded yet. */
export function newlyMet(profile: ProfileData, meta: MetaState, bestInfiniteSeconds: number) {
  return ACHIEVEMENT_IDS.filter((id) => {
    if (profile.achievements[id]) return false;
    const { value, goal } = achievementProgress(ACHIEVEMENTS.achievements[id], profile, meta, bestInfiniteSeconds);
    return value >= goal;
  });
}

/** Records the goals as met at `now` and gives their cosmetics. */
export function unlockAchievements(profile: ProfileData, ids: readonly AchievementId[], now: number): ProfileData {
  if (ids.length === 0) return profile;
  const achievements = { ...profile.achievements };
  const owned = [...profile.cosmetics.owned];
  for (const id of ids) {
    achievements[id] = { unlockedAt: now };
    const reward = ACHIEVEMENTS.achievements[id].reward;
    if (!owned.includes(reward)) owned.push(reward);
  }
  return { ...profile, achievements, cosmetics: { ...profile.cosmetics, owned } };
}
