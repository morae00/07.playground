import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHAPTER_VISUALS,
  bossPhaseForHealth,
  classifyImpact,
  motionPolicy,
  telegraphPhase,
} from './visualContracts.ts';

test('five chapters expose distinct visual motifs', () => {
  assert.deepEqual(Object.keys(CHAPTER_VISUALS).map(Number), [1, 2, 3, 4, 5]);
  assert.equal(new Set(Object.values(CHAPTER_VISUALS).map((visual) => visual.motif)).size, 5);
});

test('telegraph advances through preview, imminent, and active boundaries', () => {
  assert.equal(telegraphPhase(1, 1), 'preview');
  assert.equal(telegraphPhase(0.35, 1), 'imminent');
  assert.equal(telegraphPhase(0, 1), 'active');
  assert.equal(telegraphPhase(1, 1, true), 'active');
});

test('boss phases cross 66 and 33 percent without regressing after healing', () => {
  assert.equal(bossPhaseForHealth(67, 100), 1);
  assert.equal(bossPhaseForHealth(66, 100), 2);
  assert.equal(bossPhaseForHealth(33, 100), 3);
  assert.equal(bossPhaseForHealth(90, 100, 3), 3);
});

test('impact classification is monotonic and critical for crit or kill', () => {
  assert.equal(classifyImpact(2, 100, false, false), 'light');
  assert.equal(classifyImpact(10, 100, false, false), 'heavy');
  assert.equal(classifyImpact(20, 100, false, false), 'critical');
  assert.equal(classifyImpact(1, 100, true, false), 'critical');
  assert.equal(classifyImpact(1, 100, false, true), 'critical');
});

test('motion policy preserves information while disabling rapid motion signals', () => {
  assert.deepEqual(motionPolicy(false, false), { reduced: false, pulse: true, invertFlash: true, rotateDanger: true });
  assert.deepEqual(motionPolicy(true, false), { reduced: true, pulse: false, invertFlash: false, rotateDanger: false });
  assert.equal(motionPolicy(false, true).reduced, true);
});
