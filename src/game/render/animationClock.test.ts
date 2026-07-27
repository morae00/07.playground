import assert from 'node:assert/strict';
import test from 'node:test';
import { animationFrameAt, motionWave, normalizedLifetime } from './animationClock.ts';

test('animation frames are deterministic and freeze under reduced motion', () => {
  assert.equal(animationFrameAt(0, 8, 4), 0);
  assert.equal(animationFrameAt(0.25, 8, 4), 2);
  assert.equal(animationFrameAt(1.25, 8, 4), 2);
  assert.equal(animationFrameAt(4, 8, 4, true), 0);
});

test('motion wave and lifetime helpers contain malformed render input', () => {
  assert.equal(motionWave(1, 2, 5, true), 0);
  assert.equal(motionWave(Number.NaN, 2, 5), 0);
  assert.equal(normalizedLifetime(5, 10), 0.5);
  assert.equal(normalizedLifetime(20, 10), 1);
  assert.equal(normalizedLifetime(-1, 0), 0);
});
