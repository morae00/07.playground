import { CHECK_CONTENT_AT_LOAD } from './checks.ts';
import {
  validateCampaignContent,
  type BossRole,
  type StageKind,
} from '../game/p1Core.ts';

export const CONTENT_SCHEMA_VERSION = 1 as const;
import { CAMPAIGN_CHAPTER_IDS, CAMPAIGN_STAGE_IDS } from './campaign.ts';

export { CAMPAIGN_CHAPTER_IDS, CAMPAIGN_STAGE_IDS };

export type ChapterId = (typeof CAMPAIGN_CHAPTER_IDS)[number];
export type StageId = (typeof CAMPAIGN_STAGE_IDS)[number];
export type SkillRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type StageContent = {
  id: StageId;
  kind: StageKind;
  objective: string;
};

export type ChapterContent = {
  id: ChapterId;
  name: string;
  subtitle: string;
  difficulty: string;
  encounterGrammarId: string;
  stages: readonly StageContent[];
};

export type SkillCopy = {
  summary: string;
  levelText: (level: number) => string;
  awakeningText: string;
};

export type SkillContent<SkillId extends string = string> = {
  id: SkillId;
  name: string;
  shortName: string;
  rarity: SkillRarity;
  active: boolean;
  chapterMin: ChapterId;
  maxLevel: number;
  copy: SkillCopy;
};

export type BossContent<BossId extends string = string, PatternId extends string = string> = {
  id: BossId;
  name: string;
  chapter: ChapterId;
  role: BossRole;
  pattern: PatternId;
  hp: number;
  damage: number;
  speed: number;
};

export type ContentCatalog<
  SkillId extends string = string,
  BossId extends string = string,
  PatternId extends string = string,
> = {
  schemaVersion: typeof CONTENT_SCHEMA_VERSION;
  chapters: readonly ChapterContent[];
  skills: readonly SkillContent<SkillId>[];
  bosses: readonly BossContent<BossId, PatternId>[];
};

export class ContentCatalogInvariantError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Content catalog invariant failed:\n- ${issues.join('\n- ')}`);
    this.name = 'ContentCatalogInvariantError';
    this.issues = Object.freeze([...issues]);
  }
}

function isNonEmpty(value: string) {
  return value.trim().length > 0;
}

function duplicateStrings(values: readonly string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function validatePositiveStat(value: number, label: string, issues: string[]) {
  if (!Number.isFinite(value) || value <= 0) issues.push(`${label} must be a positive finite number`);
}

const SKILL_RARITIES = new Set<SkillRarity>(['common', 'rare', 'epic', 'legendary', 'mythic']);

export function validateContentCatalog(catalog: ContentCatalog) {
  const issues: string[] = [];
  if (catalog.schemaVersion !== CONTENT_SCHEMA_VERSION) {
    issues.push(`unsupported schemaVersion ${String(catalog.schemaVersion)}`);
  }

  issues.push(...validateCampaignContent({
    chapters: catalog.chapters,
    bosses: catalog.bosses,
    skills: catalog.skills,
  }));

  const grammarIds = duplicateStrings(catalog.chapters.map((chapter) => chapter.encounterGrammarId));
  if (grammarIds.length > 0) issues.push(`duplicate encounter grammar ids: ${grammarIds.join(', ')}`);

  for (const chapter of catalog.chapters) {
    if (!isNonEmpty(chapter.name)) issues.push(`chapter ${chapter.id} name is empty`);
    if (!isNonEmpty(chapter.subtitle)) issues.push(`chapter ${chapter.id} subtitle is empty`);
    if (!isNonEmpty(chapter.difficulty)) issues.push(`chapter ${chapter.id} difficulty is empty`);
    if (!isNonEmpty(chapter.encounterGrammarId)) {
      issues.push(`chapter ${chapter.id} encounterGrammarId is empty`);
    }
    for (const stage of chapter.stages) {
      if (!isNonEmpty(stage.objective)) issues.push(`chapter ${chapter.id} stage ${stage.id} objective is empty`);
    }
  }

  for (const skill of catalog.skills) {
    if (!isNonEmpty(skill.name)) issues.push(`skill ${skill.id} name is empty`);
    if (!isNonEmpty(skill.shortName)) issues.push(`skill ${skill.id} shortName is empty`);
    if (!SKILL_RARITIES.has(skill.rarity)) issues.push(`skill ${skill.id} rarity is invalid`);
    if (typeof skill.active !== 'boolean') issues.push(`skill ${skill.id} active must be boolean`);
    if (!Number.isInteger(skill.maxLevel) || skill.maxLevel < 1 || skill.maxLevel > 10) {
      issues.push(`skill ${skill.id} maxLevel must be an integer within 1..10`);
    }
    if (!isNonEmpty(skill.copy.summary)) issues.push(`skill ${skill.id} summary is empty`);
    if (!isNonEmpty(skill.copy.awakeningText)) issues.push(`skill ${skill.id} awakeningText is empty`);
    if (Number.isInteger(skill.maxLevel) && skill.maxLevel >= 1 && skill.maxLevel <= 10) {
      for (let level = 1; level <= skill.maxLevel; level += 1) {
        try {
          if (!isNonEmpty(skill.copy.levelText(level))) {
            issues.push(`skill ${skill.id} levelText(${level}) is empty`);
          }
        } catch {
          issues.push(`skill ${skill.id} levelText(${level}) threw`);
        }
      }
    }
  }

  for (const boss of catalog.bosses) {
    if (!isNonEmpty(boss.name)) issues.push(`boss ${boss.id} name is empty`);
    if (!isNonEmpty(boss.pattern)) issues.push(`boss ${boss.id} pattern is empty`);
    if (boss.role !== 'field' && boss.role !== 'mid' && boss.role !== 'final') {
      issues.push(`boss ${boss.id} role is invalid`);
    }
    validatePositiveStat(boss.hp, `boss ${boss.id} hp`, issues);
    validatePositiveStat(boss.damage, `boss ${boss.id} damage`, issues);
    validatePositiveStat(boss.speed, `boss ${boss.id} speed`, issues);
  }

  return issues;
}

export function assertContentCatalog(catalog: ContentCatalog) {
  const issues = validateContentCatalog(catalog);
  if (issues.length > 0) throw new ContentCatalogInvariantError(issues);
}

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

function deepFreeze<T>(value: T, visited = new WeakSet<object>()): DeepReadonly<T> {
  if (typeof value !== 'object' || value === null || visited.has(value)) return value as DeepReadonly<T>;
  visited.add(value);
  for (const item of Object.values(value)) deepFreeze(item, visited);
  return Object.freeze(value) as DeepReadonly<T>;
}

export function defineContentCatalog<const Catalog extends ContentCatalog>(catalog: Catalog) {
  if (CHECK_CONTENT_AT_LOAD) assertContentCatalog(catalog);
  return deepFreeze(catalog);
}

export function stageAddress(chapter: ChapterId, stage: StageId) {
  return Object.freeze({ chapter, stage });
}
