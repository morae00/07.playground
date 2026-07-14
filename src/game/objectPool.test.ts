import assert from 'node:assert/strict';
import test from 'node:test';
import { ObjectPool, compactWhere, recycleWhere } from './objectPool.ts';

test('object pool reuses released values after resetting them', () => {
  let created = 0;
  const pool = new ObjectPool(
    () => ({ id: ++created, value: 0 }),
    (item) => { item.value = 0; },
    2,
  );
  const first = pool.acquire();
  first.value = 99;
  pool.release(first);
  const reused = pool.acquire();
  assert.equal(reused, first);
  assert.equal(reused.value, 0);
  assert.equal(created, 1);
});

test('object pool retains no more than its configured capacity', () => {
  const pool = new ObjectPool(() => ({ value: 0 }), () => {}, 2);
  const values = [pool.acquire(), pool.acquire(), pool.acquire()];
  values.forEach((value) => pool.release(value));
  assert.equal(pool.retained, 2);
  pool.clear();
  assert.equal(pool.retained, 0);
});

test('recycleWhere compacts the source array in place and returns rejected values', () => {
  const released: number[] = [];
  const pool = new ObjectPool(() => 0, (value) => { released.push(value); }, 4);
  const values = [1, 2, 3, 4];
  const result = recycleWhere(values, (value) => value % 2 === 0, pool);
  assert.equal(result, values);
  assert.deepEqual(values, [2, 4]);
  assert.deepEqual(released, [1, 3]);
});

test('compactWhere preserves order without allocating a replacement array', () => {
  const values = [1, 2, 3, 4, 5];
  assert.equal(compactWhere(values, (value) => value >= 3), values);
  assert.deepEqual(values, [3, 4, 5]);
});
