import assert from 'node:assert/strict';
import test from 'node:test';
import { circleRectPush, clamp, distance, distancePointToSegment, normalize, pointInRect } from './worldMath.ts';

test('world math clamps and normalizes finite movement inputs', () => {
  assert.equal(clamp(12, 0, 10), 10);
  assert.deepEqual(normalize(0, 0), { x: 0, y: 0 });
  assert.deepEqual(normalize(3, 4), { x: 0.6, y: 0.8 });
  assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.equal(pointInRect(11, 11, { x: 0, y: 0, w: 10, h: 10 }), false);
});

test('circle rectangle resolution covers every occupied edge and shallow overlap', () => {
  const rect = { x: 10, y: 20, w: 100, h: 60 };
  assert.deepEqual(circleRectPush(108, 50, 8, rect), { x: 118, y: 50 });
  assert.deepEqual(circleRectPush(60, 22, 8, rect), { x: 60, y: 12 });
  assert.deepEqual(circleRectPush(60, 78, 8, rect), { x: 60, y: 88 });
  const shallowPush = circleRectPush(6, 50, 8, rect);
  assert.ok(Math.abs(shallowPush.x - 1.8) < Number.EPSILON * 2);
  assert.equal(shallowPush.y, 50);
  assert.deepEqual(circleRectPush(2, 50, 8, rect), { x: 2, y: 50 });
});

test('circle rectangle resolution pushes from the nearest occupied edge', () => {
  const rect = { x: 10, y: 20, w: 100, h: 60 };
  assert.equal(pointInRect(10, 20, rect), true);
  assert.deepEqual(circleRectPush(12, 50, 8, rect), { x: 2, y: 50 });
  assert.deepEqual(circleRectPush(200, 200, 8, rect), { x: 200, y: 200 });
});

test('point to segment distance clamps to segment endpoints', () => {
  assert.equal(distancePointToSegment(5, 4, 0, 0, 10, 0), 4);
  assert.equal(distancePointToSegment(15, 0, 0, 0, 10, 0), 5);
  assert.equal(distancePointToSegment(3, 4, 0, 0, 0, 0), 5);
});
