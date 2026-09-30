import { stageKind } from './campaign.ts';
import { CHECK_CONTENT_AT_LOAD } from './checks.ts';
import ENCOUNTER_GRAMMARS from './data/encounterGrammars.ts';
import {
  CAMPAIGN_CHAPTER_IDS,
  CAMPAIGN_STAGE_IDS,
  type ChapterId,
  type StageId,
} from './schema.ts';

export type EncounterBeatKind = 'opening' | 'pressure' | 'breather' | 'elite';
export type EnemyTierGrammar = 'small' | 'medium' | 'large';
export type SpawnFormation = 'front' | 'flank' | 'ring' | 'lane' | 'surround';
export type EncounterHazard = 'water' | 'trap' | 'fire' | 'slow' | 'root' | 'null';
export type LandmarkShape = 'corridor' | 'radial' | 'channel' | 'dial' | 'void';

export type EncounterBeat = {
  kind: EncounterBeatKind;
  durationSeconds: readonly [min: number, max: number];
  intensity: number;
  tiers: readonly EnemyTierGrammar[];
  formation: SpawnFormation;
  hazardBudget: number;
};

export type ChapterLandmark = {
  id: string;
  stage: StageId;
  shape: LandmarkShape;
  obstacleDensity: number;
};

export type ChapterEncounterGrammar = {
  id: string;
  chapter: ChapterId;
  signature: string;
  movementAxis: 'orthogonal' | 'radial' | 'horizontal' | 'rotating' | 'concentric';
  hazards: readonly EncounterHazard[];
  beats: readonly EncounterBeat[];
  landmarks: readonly ChapterLandmark[];
};

const STANDARD_BEAT_ORDER: readonly EncounterBeatKind[] = ['opening', 'pressure', 'breather', 'elite'];

export const CHAPTER_ENCOUNTER_GRAMMARS = ENCOUNTER_GRAMMARS;

export class EncounterGrammarInvariantError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Encounter grammar invariant failed:\n- ${issues.join('\n- ')}`);
    this.name = 'EncounterGrammarInvariantError';
    this.issues = Object.freeze([...issues]);
  }
}

const MOVEMENT_AXES = new Set<ChapterEncounterGrammar['movementAxis']>(['orthogonal', 'radial', 'horizontal', 'rotating', 'concentric']);
const HAZARDS = new Set<EncounterHazard>(['water', 'trap', 'fire', 'slow', 'root', 'null']);
const TIERS = new Set<EnemyTierGrammar>(['small', 'medium', 'large']);
const FORMATIONS = new Set<SpawnFormation>(['front', 'flank', 'ring', 'lane', 'surround']);
const LANDMARK_SHAPES = new Set<LandmarkShape>(['corridor', 'radial', 'channel', 'dial', 'void']);

export function validateEncounterGrammars(grammars: readonly ChapterEncounterGrammar[]) {
  const issues: string[] = [];
  const chapterIds = new Set(grammars.map((grammar) => grammar.chapter));
  const grammarIds = new Set(grammars.map((grammar) => grammar.id));
  if (grammars.length !== CAMPAIGN_CHAPTER_IDS.length || chapterIds.size !== CAMPAIGN_CHAPTER_IDS.length) {
    issues.push('encounter grammars must define each chapter exactly once');
  }
  if (grammarIds.size !== grammars.length) issues.push('encounter grammar ids must be unique');

  const landmarkIds = new Set<string>();
  for (const grammar of grammars) {
    if (!CAMPAIGN_CHAPTER_IDS.includes(grammar.chapter)) issues.push(`grammar ${grammar.id} has invalid chapter`);
    if (grammar.signature.trim().length === 0) issues.push(`grammar ${grammar.id} signature is empty`);
    if (!MOVEMENT_AXES.has(grammar.movementAxis)) issues.push(`grammar ${grammar.id} movementAxis is invalid`);
    if (grammar.hazards.length < 2 || new Set(grammar.hazards).size !== grammar.hazards.length) {
      issues.push(`grammar ${grammar.id} must define at least two unique hazards`);
    }
    if (grammar.hazards.some((hazard) => !HAZARDS.has(hazard))) issues.push(`grammar ${grammar.id} contains an invalid hazard`);
    if (grammar.beats.length !== STANDARD_BEAT_ORDER.length) {
      issues.push(`grammar ${grammar.id} must define ${STANDARD_BEAT_ORDER.length} beats`);
    }
    grammar.beats.forEach((beat, index) => {
      if (beat.kind !== STANDARD_BEAT_ORDER[index]) {
        issues.push(`grammar ${grammar.id} beat ${index} must be ${STANDARD_BEAT_ORDER[index]}`);
      }
      const [min, max] = beat.durationSeconds;
      if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) {
        issues.push(`grammar ${grammar.id} ${beat.kind} duration is invalid`);
      }
      if (!Number.isFinite(beat.intensity) || beat.intensity < 0 || beat.intensity > 1) {
        issues.push(`grammar ${grammar.id} ${beat.kind} intensity must be within 0..1`);
      }
      if (beat.tiers.length === 0 || new Set(beat.tiers).size !== beat.tiers.length) {
        issues.push(`grammar ${grammar.id} ${beat.kind} tiers must be non-empty and unique`);
      }
      if (beat.tiers.some((tier) => !TIERS.has(tier))) issues.push(`grammar ${grammar.id} ${beat.kind} contains an invalid tier`);
      if (!FORMATIONS.has(beat.formation)) issues.push(`grammar ${grammar.id} ${beat.kind} formation is invalid`);
      if (!Number.isInteger(beat.hazardBudget) || beat.hazardBudget < 0 || beat.hazardBudget > 3) {
        issues.push(`grammar ${grammar.id} ${beat.kind} hazardBudget must be within 0..3`);
      }
    });
    for (let index = 1; index < grammar.beats.length; index += 1) {
      if (grammar.beats[index].intensity === grammar.beats[index - 1].intensity) {
        issues.push(`grammar ${grammar.id} adjacent beat intensities must differ`);
      }
    }

    if (grammar.landmarks.length !== 2) issues.push(`grammar ${grammar.id} must define two landmarks`);
    const stages = new Set<StageId>();
    for (const landmark of grammar.landmarks) {
      if (landmarkIds.has(landmark.id)) issues.push(`duplicate landmark id ${landmark.id}`);
      landmarkIds.add(landmark.id);
      if (!CAMPAIGN_STAGE_IDS.includes(landmark.stage) || stageKind(landmark.stage) !== 'normal') {
        issues.push(`landmark ${landmark.id} must target a normal stage`);
      }
      if (!LANDMARK_SHAPES.has(landmark.shape)) issues.push(`landmark ${landmark.id} shape is invalid`);
      if (stages.has(landmark.stage)) issues.push(`grammar ${grammar.id} repeats landmark stage ${landmark.stage}`);
      stages.add(landmark.stage);
      if (!Number.isFinite(landmark.obstacleDensity) || landmark.obstacleDensity < 0 || landmark.obstacleDensity > 1) {
        issues.push(`landmark ${landmark.id} obstacleDensity must be within 0..1`);
      }
    }
  }
  return issues;
}

export function assertEncounterGrammars(grammars: readonly ChapterEncounterGrammar[]) {
  const issues = validateEncounterGrammars(grammars);
  if (issues.length > 0) throw new EncounterGrammarInvariantError(issues);
}

type ChapterGrammarReference = { id: number; encounterGrammarId: string };

export function validateEncounterGrammarReferences(
  chapters: readonly ChapterGrammarReference[],
  grammars: readonly ChapterEncounterGrammar[],
) {
  const issues: string[] = [];
  for (const chapter of chapters) {
    const grammar = grammars.find((candidate) => candidate.id === chapter.encounterGrammarId);
    if (!grammar) issues.push(`chapter ${chapter.id} references missing grammar ${chapter.encounterGrammarId}`);
    else if (grammar.chapter !== chapter.id) issues.push(`chapter ${chapter.id} references grammar for chapter ${grammar.chapter}`);
  }
  for (const grammar of grammars) {
    if (!chapters.some((chapter) => chapter.id === grammar.chapter && chapter.encounterGrammarId === grammar.id)) {
      issues.push(`grammar ${grammar.id} is not referenced by its chapter`);
    }
  }
  return issues;
}

export function encounterGrammarForChapter(
  chapter: ChapterId,
  grammars: readonly ChapterEncounterGrammar[] = CHAPTER_ENCOUNTER_GRAMMARS,
) {
  const grammar = grammars.find((candidate) => candidate.chapter === chapter);
  if (!grammar) throw new EncounterGrammarInvariantError([`missing grammar for chapter ${chapter}`]);
  return grammar;
}

if (CHECK_CONTENT_AT_LOAD) assertEncounterGrammars(CHAPTER_ENCOUNTER_GRAMMARS);
