// Settlement notes (UI-05): what a result means beyond its numbers, worked out before the result is applied: whether
// it set a new stage record, which stage it opens, and which account level its XP reaches, by the rules the app applies.
import { nextStageProgress, stageIndex, xpForMetaLevel, type Settlement, type StageProgress } from '../game/GameEngine';
import { createDefaultProfile, recordStageResult, stageStars, type MetaState, type StageRecord } from '../platform/save';

export type SettlementNotes = Readonly<{
  /** More kills than the stage's best so far (not on a first attempt, which has nothing to beat). */
  newKills: boolean;
  /** A clear faster than the stage's best, or its first clear after earlier attempts. */
  newTime: boolean;
  /** The stage this clear opens for the first time, else null. */
  unlocked: StageProgress | null;
  /** The account level reached when the XP lifts it, else null. */
  levelUp: number | null;
  passivePoints: number;
  /** CON-07: the stage's stars once this result counts (null when it does not), and how many it adds. */
  stars: readonly [boolean, boolean, boolean] | null;
  newStars: number;
}>;

export const NO_SETTLEMENT_NOTES: SettlementNotes = { newKills: false, newTime: false, unlocked: null, levelUp: null, passivePoints: 0, stars: null, newStars: 0 };

/** `unlockProgress` is whether this result may open stages at all (not practice, not developer access). */
export function settlementNotes(result: Settlement, record: StageRecord | undefined, meta: MetaState, unlockProgress: boolean): SettlementNotes {
  const counted = result.runMode === 'campaign' && !result.practice;
  const newKills = counted && record !== undefined && result.kills > record.bestKills;
  const newTime = counted && record !== undefined && result.cleared && (record.bestClearSeconds === null || result.clearSeconds < record.bestClearSeconds);
  const opened = nextStageProgress(result.chapter, result.stage);
  const unlocked = counted && unlockProgress && result.cleared && stageIndex(opened.chapter, opened.stage) > stageIndex(meta.progress.chapter, meta.progress.stage) ? opened : null;
  let level = meta.level;
  let xp = meta.xp + result.xp;
  while (xp >= xpForMetaLevel(level)) {
    xp -= xpForMetaLevel(level);
    level += 1;
  }
  const key = `${result.chapter}-${result.stage}`;
  // The record this result makes, the way the app folds it in (App onRoundClear, onGameOver).
  const next = counted ? recordStageResult({ ...createDefaultProfile(), stageRecords: record ? { [key]: record } : {} }, { ...result, bonus: result.bonus?.met ?? false }).stageRecords[key] : undefined;
  const stars = next ? stageStars(next) : null;
  const newStars = stars ? stars.filter(Boolean).length - stageStars(record).filter(Boolean).length : 0;
  return { newKills, newTime, unlocked, levelUp: level > meta.level ? level : null, passivePoints: level - meta.level, stars, newStars };
}
