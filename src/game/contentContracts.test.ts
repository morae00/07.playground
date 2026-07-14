import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BOSS_PHASE_MOVE_SETS,
  CHAPTER_ENCOUNTER_GRAMMARS,
  CONTENT_SCHEMA_VERSION,
  BossPhaseMoveInvariantError,
  ContentCatalogInvariantError,
  EncounterGrammarInvariantError,
  assertBossPhaseMoveSets,
  assertContentCatalog,
  assertEncounterGrammars,
  bossMovesCrossed,
  bossPhaseMoveSetFor,
  defineContentCatalog,
  encounterGrammarForChapter,
  validateBossPhaseMoveSets,
  validateContentCatalog,
  validateEncounterGrammars,
  validateEncounterGrammarReferences,
  type BossContent,
  type BossPhaseMoveSet,
  type ChapterContent,
  type ContentCatalog,
  type SkillContent,
} from '../content/index.ts';

const chapters: ChapterContent[] = CHAPTER_ENCOUNTER_GRAMMARS.map((grammar) => ({
  id: grammar.chapter,
  name: `Chapter ${grammar.chapter}`,
  subtitle: '10 stages',
  difficulty: `tier-${grammar.chapter}`,
  encounterGrammarId: grammar.id,
  stages: Array.from({ length: 10 }, (_, index) => {
    const id = (index + 1) as ChapterContent['stages'][number]['id'];
    return {
      id,
      kind: id === 5 ? 'midBoss' : id === 10 ? 'finalBoss' : 'normal',
      objective: `Objective ${grammar.chapter}-${id}`,
    };
  }),
}));

const skills: SkillContent[] = [{
  id: 'starter',
  name: 'Starter',
  shortName: 'Start',
  rarity: 'common',
  active: true,
  chapterMin: 1,
  maxLevel: 5,
  copy: {
    summary: 'Starter summary',
    levelText: (level) => `Level ${level}`,
    awakeningText: 'Starter awakening',
  },
}];

const bosses: BossContent[] = [
  { id: 'field-1', name: 'Field', chapter: 1, role: 'field', pattern: 'dash', hp: 10, damage: 2, speed: 5 },
  ...BOSS_PHASE_MOVE_SETS.map((set) => ({
    id: set.bossId,
    name: set.bossId,
    chapter: set.chapter,
    role: set.role,
    pattern: set.moves[0].attackGrammar,
    hp: 100,
    damage: 10,
    speed: 20,
  })),
];

const validCatalog = (): ContentCatalog => ({
  schemaVersion: CONTENT_SCHEMA_VERSION,
  chapters,
  skills,
  bosses,
});

test('typed content catalog validates campaign shape, copy, stats, and freezes one source', () => {
  const catalog = defineContentCatalog(validCatalog());
  assert.deepEqual(validateContentCatalog(catalog), []);
  assert.equal(Object.isFrozen(catalog), true);
  assert.equal(Object.isFrozen(catalog.chapters), true);
  assert.equal(Object.isFrozen(catalog.chapters[0].stages), true);
  assert.throws(() => {
    (catalog.chapters as ChapterContent[]).push(chapters[0]);
  }, TypeError);
});

test('content catalog reports structural and presentation failures together', () => {
  const catalog = validCatalog();
  const invalid: ContentCatalog = {
    ...catalog,
    chapters: catalog.chapters.map((chapter) => chapter.id === 2
      ? { ...chapter, encounterGrammarId: '', stages: chapter.stages.slice(0, 9) }
      : chapter),
    skills: [{ ...catalog.skills[0], maxLevel: 0, copy: { ...catalog.skills[0].copy, summary: '' } }],
    bosses: catalog.bosses.map((boss, index) => index === 0 ? { ...boss, hp: Number.NaN } : boss),
  };
  const issues = validateContentCatalog(invalid);
  assert.ok(issues.some((issue) => issue.includes('chapter 2 expected 10 stages')));
  assert.ok(issues.some((issue) => issue.includes('encounterGrammarId is empty')));
  assert.ok(issues.some((issue) => issue.includes('maxLevel')));
  assert.ok(issues.some((issue) => issue.includes('summary is empty')));
  assert.ok(issues.some((issue) => issue.includes('hp must be a positive finite number')));
  assert.throws(() => assertContentCatalog(invalid), ContentCatalogInvariantError);
});

test('five chapter encounter grammars have authored rhythm and normal-stage landmarks', () => {
  assert.deepEqual(validateEncounterGrammars(CHAPTER_ENCOUNTER_GRAMMARS), []);
  assert.deepEqual(validateEncounterGrammarReferences(chapters, CHAPTER_ENCOUNTER_GRAMMARS), []);
  assert.equal(encounterGrammarForChapter(3).id, 'gray-canal');
  assert.equal(new Set(CHAPTER_ENCOUNTER_GRAMMARS.map((grammar) => grammar.movementAxis)).size, 5);
  assert.equal(new Set(CHAPTER_ENCOUNTER_GRAMMARS.flatMap((grammar) => grammar.landmarks.map((landmark) => landmark.id))).size, 10);
  for (const grammar of CHAPTER_ENCOUNTER_GRAMMARS) {
    assert.deepEqual(grammar.beats.map((beat) => beat.kind), ['opening', 'pressure', 'breather', 'elite']);
    assert.ok(grammar.landmarks.every((landmark) => Number(landmark.stage) !== 5 && Number(landmark.stage) !== 10));
  }
});

test('encounter grammar invariant rejects duplicate chapters, invalid beats, and boss-stage landmarks', () => {
  const first = CHAPTER_ENCOUNTER_GRAMMARS[0];
  const invalid = [
    { ...first, beats: [{ ...first.beats[0], intensity: 4 }], landmarks: [{ ...first.landmarks[0], stage: 5 as const }] },
    { ...CHAPTER_ENCOUNTER_GRAMMARS[1], chapter: 1 as const },
    ...CHAPTER_ENCOUNTER_GRAMMARS.slice(2),
  ];
  const issues = validateEncounterGrammars(invalid);
  assert.ok(issues.some((issue) => issue.includes('each chapter exactly once')));
  assert.ok(issues.some((issue) => issue.includes('must define 4 beats')));
  assert.ok(issues.some((issue) => issue.includes('intensity must be within 0..1')));
  assert.ok(issues.some((issue) => issue.includes('must target a normal stage')));
  assert.throws(() => assertEncounterGrammars(invalid), EncounterGrammarInvariantError);
});

test('ten campaign bosses own monotonic phase 2/3 moves and reduced-motion telegraphs', () => {
  assert.deepEqual(validateBossPhaseMoveSets(BOSS_PHASE_MOVE_SETS, bosses), []);
  assert.equal(BOSS_PHASE_MOVE_SETS.length, 10);
  assert.equal(new Set(BOSS_PHASE_MOVE_SETS.flatMap((set) => set.moves.map((move) => move.id))).size, 20);
  for (const set of BOSS_PHASE_MOVE_SETS) {
    assert.deepEqual(set.moves.map((move) => move.phase), [2, 3]);
    assert.deepEqual(set.moves.map((move) => move.triggerHealthRatio), [0.66, 0.33]);
    assert.ok(set.moves.every((move) => move.telegraph.reducedMotionCue.length > 0));
  }
  const first = bossPhaseMoveSetFor('s1-mid-dash');
  assert.deepEqual(bossMovesCrossed(first, 1, 2).map((move) => move.phase), [2]);
  assert.deepEqual(bossMovesCrossed(first, 1, 3).map((move) => move.phase), [2, 3]);
  assert.deepEqual(bossMovesCrossed(first, 3, 2), []);
});

test('boss phase invariant cross-checks phase metadata against the content catalog', () => {
  const first = BOSS_PHASE_MOVE_SETS[0];
  const invalid: readonly BossPhaseMoveSet[] = [{
    ...first,
    chapter: 2 as const,
    moves: [
      { ...first.moves[0], triggerHealthRatio: 0.5, telegraph: { ...first.moves[0].telegraph, reducedMotionCue: '' } },
      { ...first.moves[1], attackGrammar: first.moves[0].attackGrammar },
    ] as const,
  }, ...BOSS_PHASE_MOVE_SETS.slice(1)];
  const issues = validateBossPhaseMoveSets(invalid, bosses);
  assert.ok(issues.some((issue) => issue.includes('chapter 1 requires exactly one mid')));
  assert.ok(issues.some((issue) => issue.includes('trigger must be 0.66')));
  assert.ok(issues.some((issue) => issue.includes('reducedMotionCue is empty')));
  assert.ok(issues.some((issue) => issue.includes('phase attacks must differ')));
  assert.ok(issues.some((issue) => issue.includes('metadata does not match')));
  assert.throws(() => assertBossPhaseMoveSets(invalid, bosses), BossPhaseMoveInvariantError);
});
