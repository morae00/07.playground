import assert from 'node:assert/strict';
import test from 'node:test';
import {
  circleVisible,
  interpolateInto,
  interpolatePosition,
  makeViewport,
  rectVisible,
  segmentVisible,
  visibleGridLineRange,
  type Viewport,
} from './viewport.ts';

test('makeViewport expands by padding and normalizes unsafe dimensions', () => {
  assert.deepEqual(makeViewport(100, 50, 320, 180, 24), {
    left: 76,
    top: 26,
    right: 444,
    bottom: 254,
  });
  assert.deepEqual(makeViewport(Number.NaN, Number.POSITIVE_INFINITY, -20, Number.NaN, -8), {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
});

test('circleVisible includes tangent boundaries and rejects invalid coordinates', () => {
  const viewport = makeViewport(100, 100, 200, 100);
  assert.equal(circleVisible(viewport, 90, 150, 10), true);
  assert.equal(circleVisible(viewport, 310, 150, 10), true);
  assert.equal(circleVisible(viewport, 311, 150, 10), false);
  assert.equal(circleVisible(viewport, 150, 99, -10), false);
  assert.equal(circleVisible(viewport, Number.NaN, 150, 10), false);
});

test('viewport padding keeps projectile trails visible before their center enters the screen', () => {
  const unpadded = makeViewport(100, 100, 200, 100);
  const trailPadded = makeViewport(100, 100, 200, 100, 40);
  assert.equal(circleVisible(unpadded, 65, 150, 5), false);
  assert.equal(circleVisible(trailPadded, 65, 150, 5), true);
});

test('rectVisible accepts reversed dimensions and edge contact', () => {
  const viewport = makeViewport(100, 100, 200, 100);
  assert.equal(rectVisible(viewport, 300, 130, 40, 40), true);
  assert.equal(rectVisible(viewport, 340, 180, -40, -40), true);
  assert.equal(rectVisible(viewport, 301, 130, 20, 20), false);
  assert.equal(rectVisible(viewport, 150, 150, Number.NaN, 20), false);
});

test('segmentVisible retains long beams crossing the viewport with offscreen endpoints', () => {
  const viewport = makeViewport(100, 100, 200, 100);
  assert.equal(segmentVisible(viewport, -500, 150, 800, 150, 8), true);
  assert.equal(segmentVisible(viewport, -500, 40, 800, 40, 8), false);
  assert.equal(segmentVisible(viewport, -500, 95, 800, 95, 10), true);
  assert.equal(segmentVisible(viewport, -500, 95, 800, 95, -10), false);
  assert.equal(segmentVisible(viewport, Number.NaN, 150, 800, 150, 8), false);
});

test('visibility rejects malformed viewport bounds', () => {
  const malformed = { left: 100, top: 100, right: 20, bottom: 20 } satisfies Viewport;
  assert.equal(circleVisible(malformed, 50, 50, 10), false);
  assert.equal(rectVisible(malformed, 40, 40, 20, 20), false);
  assert.equal(segmentVisible(malformed, 0, 0, 100, 100, 4), false);
});

test('interpolatePosition handles endpoints, midpoint, and clamped alpha', () => {
  const previous = { x: 10, y: -20 };
  const current = { x: 30, y: 40 };
  assert.deepEqual(interpolatePosition(previous, current, 0), previous);
  assert.deepEqual(interpolatePosition(previous, current, 0.5), { x: 20, y: 10 });
  assert.deepEqual(interpolatePosition(previous, current, 1), current);
  assert.deepEqual(interpolatePosition(previous, current, -4), previous);
  assert.deepEqual(interpolatePosition(previous, current, 8), current);
});

test('interpolatePosition recovers from non-finite render inputs', () => {
  assert.deepEqual(
    interpolatePosition({ x: Number.NaN, y: 4 }, { x: 12, y: Number.POSITIVE_INFINITY }, Number.NaN),
    { x: 12, y: 4 },
  );
  assert.deepEqual(
    interpolatePosition(
      { x: Number.NaN, y: Number.NEGATIVE_INFINITY },
      { x: Number.POSITIVE_INFINITY, y: Number.NaN },
      0.5,
    ),
    { x: 0, y: 0 },
  );
});

test('TEC-04: interpolateInto writes the same point into the object it is given', () => {
  const out = { x: -1, y: -1 };
  for (const [previous, current, alpha] of [[{ x: 10, y: -20 }, { x: 30, y: 40 }, 0.25], [{ x: Number.NaN, y: 4 }, { x: 12, y: Number.POSITIVE_INFINITY }, Number.NaN], [{ x: 3, y: 4 }, { x: 5, y: 6 }, 9]] as const) {
    assert.equal(interpolateInto(previous.x, previous.y, current.x, current.y, alpha, out), out);
    assert.deepEqual(out, interpolatePosition(previous, current, alpha));
  }
});

test('visibleGridLineRange returns only world-aligned lines inside the viewport', () => {
  assert.deepEqual(visibleGridLineRange(130, 399, 120, 0, 4200), {
    first: 240,
    last: 360,
    step: 120,
    count: 2,
  });
  assert.deepEqual(visibleGridLineRange(399, 130, 120, 0, 4200), {
    first: 240,
    last: 360,
    step: 120,
    count: 2,
  });
  assert.deepEqual(visibleGridLineRange(-110, 110, 50, -200, 200), {
    first: -100,
    last: 100,
    step: 50,
    count: 5,
  });
});

test('visibleGridLineRange handles empty and invalid ranges safely', () => {
  assert.equal(visibleGridLineRange(-200, -1, 120, 0, 4200), null);
  assert.equal(visibleGridLineRange(121, 239, 120, 0, 4200), null);
  assert.equal(visibleGridLineRange(0, 100, 0, 0, 4200), null);
  assert.equal(visibleGridLineRange(0, 100, Number.NaN, 0, 4200), null);
  assert.equal(visibleGridLineRange(0, 100, 20, 200, 100), null);
  assert.equal(visibleGridLineRange(Number.NEGATIVE_INFINITY, 100, 20, 0, 200), null);
});
