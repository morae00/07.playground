// Campaign shape (TEC-08): the one place that says how many chapters and stages exist. Content, engine,
// saves, and art registries derive their limits from here, so adding a chapter is a content change.
export const CAMPAIGN_CHAPTER_IDS = [1, 2, 3, 4, 5] as const;
export const CAMPAIGN_STAGE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const CAMPAIGN_CHAPTER_COUNT = CAMPAIGN_CHAPTER_IDS.length;
export const STAGES_PER_CHAPTER = CAMPAIGN_STAGE_IDS.length;
export const FINAL_CHAPTER = CAMPAIGN_CHAPTER_IDS[CAMPAIGN_CHAPTER_IDS.length - 1];
export const FINAL_STAGE = CAMPAIGN_STAGE_IDS[CAMPAIGN_STAGE_IDS.length - 1];
