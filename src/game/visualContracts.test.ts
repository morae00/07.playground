import assert from 'node:assert/strict';
import test from 'node:test';
import { CHAPTER_VISUALS } from './render/visualRegistry.ts';
import {
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

test('budgeted impact classification keeps critical for boss kills and big hits only (BUG-07)', () => {
  const budgeted = { classification: 'budgeted' as const };
  assert.equal(classifyImpact(2, 100, false, false, budgeted), 'light');
  assert.equal(classifyImpact(10, 100, false, false, budgeted), 'heavy');
  assert.equal(classifyImpact(1, 100, true, false, budgeted), 'heavy', 'a small crit is heavy');
  assert.equal(classifyImpact(1, 100, false, true, budgeted), 'heavy', 'an ordinary kill is heavy');
  assert.equal(classifyImpact(1, 100, false, true, { ...budgeted, notableTarget: true }), 'critical', 'a boss kill is critical');
  assert.equal(classifyImpact(25, 100, false, false, budgeted), 'critical', 'a hit for 20% or more is critical');
});

test('impact classification is monotonic and critical for crit or kill', () => {
  assert.equal(classifyImpact(2, 100, false, false), 'light');
  assert.equal(classifyImpact(10, 100, false, false), 'heavy');
  assert.equal(classifyImpact(20, 100, false, false), 'critical');
  assert.equal(classifyImpact(1, 100, true, false), 'critical');
  assert.equal(classifyImpact(1, 100, false, true), 'critical');
});

test('motion policy preserves information while disabling rapid motion signals', () => {
  assert.deepEqual(motionPolicy(false, false), { reduced: false, pulse: true, invertFlash: true, rotateDanger: true, flashStrength: 1, beat: true, shake: true });
  assert.deepEqual(motionPolicy(true, true), { reduced: true, pulse: false, invertFlash: false, rotateDanger: false, flashStrength: 0.5, beat: false, shake: false });
});

test('UI-08: reduced flash and reduced motion are separate settings', () => {
  const flash = motionPolicy(true, false);
  assert.equal(flash.reduced, false, 'reduced flash alone keeps motion: pulses, rotation, and pose cycles run');
  assert.ok(flash.pulse && flash.rotateDanger);
  assert.equal(flash.invertFlash, false, 'a struck body keeps its pose instead of turning negative');
  assert.equal(flash.flashStrength, 0.5, 'white cut-outs and the hurt glow draw at half strength');
  const motion = motionPolicy(false, true);
  assert.equal(motion.reduced, true);
  assert.ok(!motion.pulse && !motion.rotateDanger);
  assert.equal(motion.invertFlash, true, 'reduced motion alone keeps flashes as they are');
  assert.equal(motion.flashStrength, 1);
  for (const policy of [flash, motion]) {
    assert.equal(policy.shake, false, 'either stops the screen shake, as reduced flash did in 0.1.0');
    assert.equal(policy.beat, false, 'either holds the heartbeat glow still');
  }
});
