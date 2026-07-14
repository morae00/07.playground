import assert from 'node:assert/strict';
import test from 'node:test';
import { SpatialIndex } from './spatialIndex.ts';

type TestBody = {
  id: string;
  x: number;
  y: number;
  radius: number;
};

test('queries include exact cell and shape boundaries, including negative coordinates', () => {
  const index = new SpatialIndex<TestBody>(10);
  const negative = { id: 'negative', x: -10, y: -10, radius: 0 };
  const origin = { id: 'origin', x: 0, y: 0, radius: 0 };
  const edge = { id: 'edge', x: 10, y: 0, radius: 0 };
  const outside = { id: 'outside', x: 10.01, y: 0, radius: 0 };
  for (const body of [negative, origin, edge, outside]) index.insert(body);

  assert.deepEqual(index.queryRect(0, 0, 10, 0).map(({ id }) => id), ['origin', 'edge']);
  assert.deepEqual(index.queryCircle(-5, -10, 5).map(({ id }) => id), ['negative']);
});

test('large-radius and multi-cell queries return each item once', () => {
  const index = new SpatialIndex<TestBody>(8);
  const spanning = { id: 'spanning', x: 16, y: 16, radius: 20 };
  const far = { id: 'far', x: 80, y: 16, radius: 2 };
  index.insert(spanning);
  index.insert(far);

  assert.deepEqual(index.queryCircle(16, 16, 64).map(({ id }) => id), ['spanning', 'far']);
  assert.equal(index.queryRect(-20, -20, 72, 72).filter(({ id }) => id === 'spanning').length, 1);
});

test('clear removes all entries and resets insertion ordering', () => {
  const index = new SpatialIndex<TestBody>(16);
  const first = { id: 'first', x: 4, y: 4, radius: 1 };
  const second = { id: 'second', x: 8, y: 8, radius: 1 };
  index.insert(first);
  index.insert(second);
  index.clear();

  assert.deepEqual(index.queryRect(0, 0, 20, 20), []);
  index.insert(second);
  index.insert(first);
  assert.deepEqual(index.queryRect(0, 0, 20, 20).map(({ id }) => id), ['second', 'first']);
});

test('result order is deterministic across cells, repeated queries, and item movement', () => {
  const index = new SpatialIndex<TestBody>(10);
  const first = { id: 'first', x: 29, y: 29, radius: 1 };
  const second = { id: 'second', x: 1, y: 1, radius: 1 };
  const third = { id: 'third', x: 15, y: 15, radius: 8 };
  index.insert(first);
  index.insert(second);
  index.insert(third);

  const ids = () => index.queryRect(0, 0, 30, 30).map(({ id }) => id);
  assert.deepEqual(ids(), ['first', 'second', 'third']);
  assert.deepEqual(ids(), ['first', 'second', 'third']);

  first.x = 5;
  first.y = 5;
  index.insert(first);
  assert.deepEqual(ids(), ['first', 'second', 'third']);
  assert.deepEqual(index.queryRect(20, 20, 10, 10).map(({ id }) => id), ['third']);
});

test('custom bounds resolvers support rectangular game objects', () => {
  type Box = { id: string; x: number; y: number; width: number; height: number };
  const index = new SpatialIndex<Box>(12, (box) => ({
    minX: box.x,
    minY: box.y,
    maxX: box.x + box.width,
    maxY: box.y + box.height,
  }));
  const wall = { id: 'wall', x: 10, y: 10, width: 30, height: 4 };
  const remote = { id: 'remote', x: 80, y: 80, width: 5, height: 5 };
  index.insert(wall);
  index.insert(remote);

  assert.deepEqual(index.queryCircle(25, 5, 5).map(({ id }) => id), ['wall']);
  assert.deepEqual(index.queryRect(39, 13, 2, 2).map(({ id }) => id), ['wall']);
});

test('invalid grid and query dimensions fail fast', () => {
  assert.throws(() => new SpatialIndex<TestBody>(0), /cellSize/);
  const index = new SpatialIndex<TestBody>(10);
  assert.throws(() => index.queryCircle(0, 0, -1), /non-negative/);
  assert.throws(() => index.queryRect(0, 0, -1, 1), /non-negative/);
});
