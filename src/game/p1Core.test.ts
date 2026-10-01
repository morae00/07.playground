import assert from 'node:assert/strict';
import test from 'node:test';
import { createSeededRandom } from './p0Core.ts';
import {
  BASE_DIRECT_HIT_INVULNERABILITY,
  COIN_FEVER_FRENZY_ATTACK_SPEED_MULTIPLIER,
  COIN_FEVER_FRENZY_DURATION,
  CampaignContentInvariantError,
  MissingBossCandidateError,
  advanceCoinFeverFrenzy,
  advanceTimedSlow,
  applyTimedSlow,
  assertCampaignContent,
  calculateFireDotDamage,
  hybridHitDamage,
  effectiveCoinFeverAttackSpeed,
  filterSkillsForChapter,
  paperWardDirectHitInvulnerability,
  refreshCoinFeverFrenzy,
  selectRequiredBoss,
  validateCampaignContent,
  type CampaignContentContract,
  type StageKind,
} from './p1Core.ts';

test('frost slow is temporary, keeps the strongest refresh, and expires to neutral', () => {
  const first = applyTimedSlow({ multiplier: 1, remaining: 0 }, 0.68, 1.2);
  assert.deepEqual(first, { multiplier: 0.68, remaining: 1.2 });

  const refreshed = applyTimedSlow(advanceTimedSlow(first, 0.7), 0.82, 1.2);
  assert.deepEqual(refreshed, { multiplier: 0.68, remaining: 1.2 });
  assert.deepEqual(advanceTimedSlow(refreshed, 1.2), { multiplier: 1, remaining: 0 });
});

test('frost slow clamps boundary values and ignores invalid time movement', () => {
  const clamped = applyTimedSlow({ multiplier: 1, remaining: 0 }, -4, Number.POSITIVE_INFINITY);
  assert.deepEqual(clamped, { multiplier: 1, remaining: 0 });
  const active = applyTimedSlow({ multiplier: 1, remaining: 0 }, 2, 0.5);
  assert.deepEqual(active, { multiplier: 1, remaining: 0.5 });
  assert.deepEqual(advanceTimedSlow(active, -1), active);
});

test('Paper Ward extends direct-hit invulnerability by four hundredths per level', () => {
  assert.equal(paperWardDirectHitInvulnerability(0), BASE_DIRECT_HIT_INVULNERABILITY);
  assert.equal(paperWardDirectHitInvulnerability(3), 0.3);
  assert.equal(paperWardDirectHitInvulnerability(5), 0.38);
  assert.equal(paperWardDirectHitInvulnerability(99), 0.38);
  assert.equal(paperWardDirectHitInvulnerability(-1), BASE_DIRECT_HIT_INVULNERABILITY);
});

test('fire DOT applies defense to DPS before multiplying by delta', () => {
  assert.equal(calculateFireDotDamage(12, 0.5, 10), 3.9);
  assert.equal(calculateFireDotDamage(4, 1 / 60, 20), 0);
  assert.equal(calculateFireDotDamage(12, 0, 0), 0);
  assert.equal(calculateFireDotDamage(-12, 1, -10), 0);
});

test('fire DOT produces the same damage across different fixed subdivisions', () => {
  const once = calculateFireDotDamage(18, 1, 7);
  const sixtyTicks = Array.from({ length: 60 }, () => calculateFireDotDamage(18, 1 / 60, 7))
    .reduce((sum, damage) => sum + damage, 0);
  assert.ok(Math.abs(once - sixtyTicks) < 1e-12);
});

test('Coin Fever frenzy refreshes for 2.4 seconds and only affects active awakening', () => {
  assert.equal(refreshCoinFeverFrenzy(false), 0);
  assert.equal(refreshCoinFeverFrenzy(true), COIN_FEVER_FRENZY_DURATION);
  assert.equal(advanceCoinFeverFrenzy(2.4, 0.9), 1.5);
  assert.equal(advanceCoinFeverFrenzy(0.2, 0.2), 0);
  assert.equal(effectiveCoinFeverAttackSpeed(1.25, false, 2), 1.25);
  assert.equal(effectiveCoinFeverAttackSpeed(1.25, true, 0), 1.25);
  assert.equal(
    effectiveCoinFeverAttackSpeed(1.25, true, 0.01),
    1.25 * COIN_FEVER_FRENZY_ATTACK_SPEED_MULTIPLIER,
  );
});

test('chapter filtering gates new skills while preserving owned upgrades', () => {
  const skills = [
    { id: 'starter', chapterMin: 1 },
    { id: 'orbit', chapterMin: 2 },
    { id: 'sun', chapterMin: 4 },
    { id: 'eclipse', chapterMin: 5 },
  ];
  assert.deepEqual(filterSkillsForChapter(skills, 1).map((skill) => skill.id), ['starter']);
  assert.deepEqual(filterSkillsForChapter(skills, 4).map((skill) => skill.id), ['starter', 'orbit', 'sun']);
  assert.deepEqual(
    filterSkillsForChapter(skills, 1, new Set(['sun'])).map((skill) => skill.id),
    ['starter', 'sun'],
  );
});

test('required boss selection is deterministic for a seed', () => {
  const bosses = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const firstRandom = createSeededRandom(4401);
  const secondRandom = createSeededRandom(4401);
  const first = Array.from({ length: 8 }, () => selectRequiredBoss(bosses, { chapter: 3, role: 'mid' }, firstRandom).id);
  const second = Array.from({ length: 8 }, () => selectRequiredBoss(bosses, { chapter: 3, role: 'mid' }, secondRandom).id);
  assert.deepEqual(first, second);
});

test('required boss selection throws with immutable context when candidates are empty', () => {
  const context = { chapter: 5, role: 'final' as const, legacy: true };
  assert.throws(
    () => selectRequiredBoss([], context, () => 0),
    (error: unknown) => {
      assert.ok(error instanceof MissingBossCandidateError);
      assert.deepEqual(error.context, context);
      assert.match(error.message, /chapter=5, role=final, legacy=true/);
      assert.equal(Object.isFrozen(error.context), true);
      return true;
    },
  );
});

test('required boss selection rejects random values outside the deterministic contract', () => {
  assert.throws(
    () => selectRequiredBoss([{ id: 'a' }], { chapter: 1, role: 'field' }, () => 1),
    /within \[0, 1\)/,
  );
});

const makeValidContent = (): CampaignContentContract => ({
  chapters: Array.from({ length: 5 }, (_, chapterIndex) => ({
    id: chapterIndex + 1,
    stages: Array.from({ length: 10 }, (_, stageIndex) => {
      const id = stageIndex + 1;
      const kind: StageKind = id === 5 ? 'midBoss' : id === 10 ? 'finalBoss' : 'normal';
      return { id, kind };
    }),
  })),
  bosses: Array.from({ length: 5 }, (_, chapterIndex) => {
    const chapter = chapterIndex + 1;
    return [
      { id: `field-${chapter}`, chapter, role: 'field' as const },
      { id: `mid-${chapter}`, chapter, role: 'mid' as const },
      { id: `final-${chapter}`, chapter, role: 'final' as const },
    ];
  }).flat(),
  skills: [
    { id: 'starter', chapterMin: 1 },
    { id: 'late', chapterMin: 5 },
  ],
});

test('5 by 10 campaign and required content pass their invariant', () => {
  const content = makeValidContent();
  assert.deepEqual(validateCampaignContent(content), []);
  assert.doesNotThrow(() => assertCampaignContent(content));
});

test('campaign invariant reports stage shape, boss coverage, ids, and unlock range together', () => {
  const valid = makeValidContent();
  const invalid: CampaignContentContract = {
    chapters: valid.chapters.map((chapter) => chapter.id === 2
      ? { ...chapter, stages: chapter.stages.filter((stage) => stage.id !== 10) }
      : chapter),
    bosses: [
      ...valid.bosses.filter((boss) => !(boss.chapter === 3 && boss.role === 'final')),
      { id: 'mid-1', chapter: 6, role: 'field' },
    ],
    skills: [...valid.skills, { id: 'late', chapterMin: 0 }],
  };

  const issues = validateCampaignContent(invalid);
  assert.ok(issues.some((issue) => issue.includes('chapter 2 expected 10 stages')));
  assert.ok(issues.some((issue) => issue.includes('chapter 2 missing stage 10')));
  assert.ok(issues.some((issue) => issue.includes('chapter 3 requires exactly one final boss')));
  assert.ok(issues.some((issue) => issue.includes('duplicate boss ids: mid-1')));
  assert.ok(issues.some((issue) => issue.includes('boss mid-1 has invalid chapter 6')));
  assert.ok(issues.some((issue) => issue.includes('duplicate skill ids: late')));
  assert.ok(issues.some((issue) => issue.includes('skill late has invalid chapterMin 0')));
  assert.throws(() => assertCampaignContent(invalid), CampaignContentInvariantError);
});

test('SYS-07 hybrid defence: about the flat rule at low defence, real hits at high defence, never below 15% or 1', () => {
  const curve = { flat: 0.35, flatOther: 0.2, ratio: 4, floor: 0.15 };
  const flatRule = (raw: number, defense: number) => Math.max(1, raw - defense * 0.72);
  // A fresh build (defence 2) takes within 8% of what the 0.1.0 rule gave.
  for (const raw of [8, 14, 22, 40]) {
    assert.ok(Math.abs(hybridHitDamage(raw, 2, true, curve) / flatRule(raw, 2) - 1) < 0.08, `raw ${raw}`);
  }
  // A maxed build (defence 24.5): the flat rule gave 1 to small and medium hits; the hybrid keeps them real.
  assert.equal(flatRule(10.5, 24.5), 1);
  assert.ok(hybridHitDamage(10.5, 24.5, true, curve) > 1.5);
  assert.ok(Math.abs(hybridHitDamage(18.5, 24.5, true, curve) - (18.5 - 24.5 * 0.35) * 100 / 198) < 1e-9);
  // The floor holds against any defence, and more defence never takes more damage.
  assert.equal(hybridHitDamage(40, 1000, true, curve), 40 * 0.15);
  assert.equal(hybridHitDamage(2, 50, true, curve), 1);
  let previous = Infinity;
  for (let defense = 0; defense <= 60; defense += 5) {
    const damage = hybridHitDamage(30, defense, true, curve);
    assert.ok(damage <= previous + 1e-12, `defence ${defense}`);
    previous = damage;
  }
  assert.ok(hybridHitDamage(30, 20, false, curve) > hybridHitDamage(30, 20, true, curve), 'non-physical hits keep less flat cut');
  assert.equal(hybridHitDamage(Number.NaN, 10, true, curve), 1);
});
