export const BASE_DIRECT_HIT_INVULNERABILITY = 0.18;
export const PAPER_WARD_INVULNERABILITY_PER_LEVEL = 0.04;
export const MAX_SKILL_LEVEL = 5;
export const FIRE_DOT_DEFENSE_FACTOR = 0.42;
export const COIN_FEVER_FRENZY_DURATION = 2.4;
export const COIN_FEVER_FRENZY_ATTACK_SPEED_MULTIPLIER = 1.3;
import { CAMPAIGN_CHAPTER_COUNT, STAGES_PER_CHAPTER } from '../content/campaign.ts';

export { CAMPAIGN_CHAPTER_COUNT, STAGES_PER_CHAPTER };

export type TimedSlow = {
  multiplier: number;
  remaining: number;
};

export type StageKind = 'normal' | 'midBoss' | 'finalBoss';
export type BossRole = 'field' | 'mid' | 'final';

export type BossSelectionContext = {
  chapter: number;
  role: BossRole;
  legacy?: boolean;
};

export type BossContract = {
  id: string;
  chapter: number;
  role: BossRole;
};

export type SkillUnlockContract = {
  id: string;
  chapterMin: number;
};

export type CampaignStageContract = {
  id: number;
  kind: StageKind;
};

export type CampaignChapterContract = {
  id: number;
  stages: readonly CampaignStageContract[];
};

export type CampaignContentContract = {
  chapters: readonly CampaignChapterContract[];
  bosses: readonly BossContract[];
  skills: readonly SkillUnlockContract[];
};

export class MissingBossCandidateError extends Error {
  readonly context: Readonly<BossSelectionContext>;

  constructor(context: BossSelectionContext) {
    const legacy = context.legacy ? ', legacy=true' : '';
    super(`Missing required boss candidate (chapter=${context.chapter}, role=${context.role}${legacy})`);
    this.name = 'MissingBossCandidateError';
    this.context = Object.freeze({ ...context });
  }
}

export class CampaignContentInvariantError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Campaign content invariant failed:\n- ${issues.join('\n- ')}`);
    this.name = 'CampaignContentInvariantError';
    this.issues = [...issues];
  }
}

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, finiteOr(value, min)));
}

function normalizeTimedSlow(slow: TimedSlow): TimedSlow {
  const remaining = Math.max(0, finiteOr(slow.remaining, 0));
  return {
    multiplier: remaining > 0 ? clamp(slow.multiplier, 0, 1) : 1,
    remaining,
  };
}

export function applyTimedSlow(current: TimedSlow, multiplier: number, duration: number): TimedSlow {
  const active = normalizeTimedSlow(current);
  const incomingDuration = Math.max(0, finiteOr(duration, 0));
  if (incomingDuration === 0) return active;

  return {
    multiplier: Math.min(active.multiplier, clamp(multiplier, 0, 1)),
    remaining: Math.max(active.remaining, incomingDuration),
  };
}

export function advanceTimedSlow(slow: TimedSlow, deltaSeconds: number): TimedSlow {
  const active = normalizeTimedSlow(slow);
  const remaining = Math.max(0, active.remaining - Math.max(0, finiteOr(deltaSeconds, 0)));
  return {
    multiplier: remaining > 0 ? active.multiplier : 1,
    remaining,
  };
}

export function paperWardDirectHitInvulnerability(level: number) {
  const safeLevel = Math.floor(clamp(level, 0, MAX_SKILL_LEVEL));
  return BASE_DIRECT_HIT_INVULNERABILITY + safeLevel * PAPER_WARD_INVULNERABILITY_PER_LEVEL;
}

export function calculateFireDotDamage(
  damagePerSecond: number,
  deltaSeconds: number,
  defense: number,
) {
  const safeDps = Math.max(0, finiteOr(damagePerSecond, 0));
  const safeDelta = Math.max(0, finiteOr(deltaSeconds, 0));
  const safeDefense = Math.max(0, finiteOr(defense, 0));
  const defendedDps = Math.max(0, safeDps - safeDefense * FIRE_DOT_DEFENSE_FACTOR);
  return defendedDps * safeDelta;
}

export function refreshCoinFeverFrenzy(awakened: boolean) {
  return awakened ? COIN_FEVER_FRENZY_DURATION : 0;
}

export function advanceCoinFeverFrenzy(remaining: number, deltaSeconds: number) {
  return Math.max(0, finiteOr(remaining, 0) - Math.max(0, finiteOr(deltaSeconds, 0)));
}

export function effectiveCoinFeverAttackSpeed(
  baseAttackSpeed: number,
  awakened: boolean,
  frenzyRemaining: number,
) {
  const safeBase = Math.max(0, finiteOr(baseAttackSpeed, 0));
  return awakened && finiteOr(frenzyRemaining, 0) > 0
    ? safeBase * COIN_FEVER_FRENZY_ATTACK_SPEED_MULTIPLIER
    : safeBase;
}

export function filterSkillsForChapter<T extends SkillUnlockContract>(
  skills: readonly T[],
  chapter: number,
  ownedSkillIds: ReadonlySet<string> = new Set(),
) {
  const safeChapter = Math.floor(finiteOr(chapter, 0));
  return skills.filter((skill) => ownedSkillIds.has(skill.id) || skill.chapterMin <= safeChapter);
}

export function selectRequiredBoss<T>(
  candidates: readonly T[],
  context: BossSelectionContext,
  random: () => number,
) {
  if (candidates.length === 0) throw new MissingBossCandidateError(context);
  const roll = random();
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
    throw new RangeError(`Boss selection random value must be within [0, 1); received ${roll}`);
  }
  return candidates[Math.floor(roll * candidates.length)];
}

function expectedStageKind(stage: number): StageKind {
  if (stage === 5) return 'midBoss';
  if (stage === 10) return 'finalBoss';
  return 'normal';
}

function duplicateIds(ids: readonly (string | number)[]) {
  const seen = new Set<string | number>();
  const duplicates = new Set<string | number>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}

export function validateCampaignContent(content: CampaignContentContract) {
  const issues: string[] = [];
  if (content.chapters.length !== CAMPAIGN_CHAPTER_COUNT) {
    issues.push(`expected ${CAMPAIGN_CHAPTER_COUNT} chapters, received ${content.chapters.length}`);
  }

  const duplicateChapterIds = duplicateIds(content.chapters.map((chapter) => chapter.id));
  if (duplicateChapterIds.length > 0) issues.push(`duplicate chapter ids: ${duplicateChapterIds.join(', ')}`);

  for (let chapterId = 1; chapterId <= CAMPAIGN_CHAPTER_COUNT; chapterId += 1) {
    const chapter = content.chapters.find((candidate) => candidate.id === chapterId);
    if (!chapter) {
      issues.push(`missing chapter ${chapterId}`);
      continue;
    }
    if (chapter.stages.length !== STAGES_PER_CHAPTER) {
      issues.push(`chapter ${chapterId} expected ${STAGES_PER_CHAPTER} stages, received ${chapter.stages.length}`);
    }
    const duplicateStageIds = duplicateIds(chapter.stages.map((stage) => stage.id));
    if (duplicateStageIds.length > 0) {
      issues.push(`chapter ${chapterId} duplicate stage ids: ${duplicateStageIds.join(', ')}`);
    }
    for (let stageId = 1; stageId <= STAGES_PER_CHAPTER; stageId += 1) {
      const stage = chapter.stages.find((candidate) => candidate.id === stageId);
      if (!stage) {
        issues.push(`chapter ${chapterId} missing stage ${stageId}`);
        continue;
      }
      const expectedKind = expectedStageKind(stageId);
      if (stage.kind !== expectedKind) {
        issues.push(`chapter ${chapterId} stage ${stageId} expected ${expectedKind}, received ${stage.kind}`);
      }
    }
  }

  const duplicateBossIds = duplicateIds(content.bosses.map((boss) => boss.id));
  if (duplicateBossIds.length > 0) issues.push(`duplicate boss ids: ${duplicateBossIds.join(', ')}`);
  for (const boss of content.bosses) {
    if (!Number.isInteger(boss.chapter) || boss.chapter < 1 || boss.chapter > CAMPAIGN_CHAPTER_COUNT) {
      issues.push(`boss ${boss.id} has invalid chapter ${boss.chapter}`);
    }
  }
  for (let chapter = 1; chapter <= CAMPAIGN_CHAPTER_COUNT; chapter += 1) {
    for (const role of ['mid', 'final'] as const) {
      const count = content.bosses.filter((boss) => boss.chapter === chapter && boss.role === role).length;
      if (count !== 1) issues.push(`chapter ${chapter} requires exactly one ${role} boss, received ${count}`);
    }
    const fieldCount = content.bosses.filter((boss) => boss.chapter <= chapter && boss.role === 'field').length;
    if (fieldCount === 0) issues.push(`chapter ${chapter} requires at least one eligible field boss`);
  }

  const duplicateSkillIds = duplicateIds(content.skills.map((skill) => skill.id));
  if (duplicateSkillIds.length > 0) issues.push(`duplicate skill ids: ${duplicateSkillIds.join(', ')}`);
  for (const skill of content.skills) {
    if (!Number.isInteger(skill.chapterMin) || skill.chapterMin < 1 || skill.chapterMin > CAMPAIGN_CHAPTER_COUNT) {
      issues.push(`skill ${skill.id} has invalid chapterMin ${skill.chapterMin}`);
    }
  }

  return issues;
}

export function assertCampaignContent(content: CampaignContentContract) {
  const issues = validateCampaignContent(content);
  if (issues.length > 0) throw new CampaignContentInvariantError(issues);
}
