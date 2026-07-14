import assert from 'node:assert/strict';
import test from 'node:test';
import { impactCue, toneGain } from './audioPolicy.ts';

test('impact audio separates light, heavy, and critical cues', () => {
  const light = impactCue('light', 0.5);
  const heavy = impactCue('heavy', 0.5);
  const critical = impactCue('critical', 0.5);
  assert.ok(light.frequency > heavy.frequency);
  assert.ok(heavy.frequency > critical.frequency);
  assert.ok(light.duration < heavy.duration);
  assert.ok(heavy.duration < critical.duration);
  assert.ok(light.gain < heavy.gain);
  assert.ok(heavy.gain < critical.gain);
});

test('tone gain contains invalid or excessive volume inputs', () => {
  assert.equal(toneGain(-1), 0.0001);
  assert.equal(toneGain(Number.NaN), 0.0001);
  assert.equal(toneGain(2, 1), 0.055);
});
