import assert from 'node:assert/strict';
import test from 'node:test';
import { createRenderFrameSnapshot, visualDetailFor } from './renderSnapshot.ts';

test('render snapshot normalizes transient visual state without gameplay mutation', () => {
  const snapshot = createRenderFrameSnapshot({
    chapter: 8,
    elapsed: -3,
    alpha: 4,
    reducedMotion: false,
    aimAngle: Number.NaN,
    moving: true,
    bossEnraged: true,
    enemyCount: 82,
  });
  assert.deepEqual(snapshot, {
    chapter: 5,
    elapsed: 0,
    alpha: 1,
    reducedMotion: false,
    detail: 'reduced',
    aimAngle: 0,
    moving: true,
    bossEnraged: true,
    enemyCount: 82,
  });
  assert.ok(Object.isFrozen(snapshot));
});

test('visual detail scales down with the enemies on screen, and reduced motion never lowers it', () => {
  assert.equal(visualDetailFor(79), 'full');
  assert.equal(visualDetailFor(80), 'reduced');
  assert.equal(visualDetailFor(160), 'minimal');
  const calm = createRenderFrameSnapshot({ chapter: 1, elapsed: 1, alpha: 1, reducedMotion: true, aimAngle: 0, moving: false, bossEnraged: false, enemyCount: 3 });
  assert.equal(calm.detail, 'full');
});
