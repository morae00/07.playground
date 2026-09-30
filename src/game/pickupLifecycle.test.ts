import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PATIENT_PICKUP_HARD_TTL,
  PATIENT_PICKUP_SOFT_TTL,
  PICKUP_HARD_CAP,
  PICKUP_HARD_TTL,
  PICKUP_MERGE_THRESHOLD,
  PICKUP_SOFT_TTL,
  mergePickupValue,
  pickupSoftTtl,
  pickupTtl,
  selectPickupMergeTarget,
  type PickupLifecycleItem,
} from './pickupLifecycle.ts';

function pickups(count: number, kind: PickupLifecycleItem['kind'] = 'xp') {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    x: index * 100,
    y: 0,
    kind,
    value: 1,
    life: pickupTtl(kind),
  }));
}

test('pickup merging stays disabled below the pressure threshold', () => {
  const values = pickups(PICKUP_MERGE_THRESHOLD - 1);
  assert.equal(selectPickupMergeTarget(values, { x: 0, y: 0, kind: 'xp' }), undefined);
});

test('pickup merging chooses the nearest same-kind target deterministically', () => {
  const values = pickups(PICKUP_MERGE_THRESHOLD);
  values[4].x = 10;
  values[4].id = 7;
  values[8].x = 10;
  values[8].id = 3;
  const target = selectPickupMergeTarget(values, { x: 12, y: 0, kind: 'xp' });
  assert.equal(target?.id, 3);
});

test('hard cap collapses a distant incoming pickup without losing value', () => {
  const values = pickups(PICKUP_HARD_CAP);
  const before = values.reduce((total, pickup) => total + pickup.value, 0);
  const target = selectPickupMergeTarget(values, { x: 99_999, y: 0, kind: 'xp' });
  assert.ok(target);
  mergePickupValue(target, 17);
  assert.equal(values.reduce((total, pickup) => total + pickup.value, 0), before + 17);
  assert.equal(target.life, pickupTtl('xp'));
});

test('pickup lifetime has a soft magnet window before hard collection', () => {
  assert.equal(pickupTtl('coin'), PICKUP_HARD_TTL);
  assert.equal(pickupTtl('xp'), PICKUP_HARD_TTL);
  assert.equal(pickupSoftTtl(), PICKUP_SOFT_TTL);
  assert.ok(PICKUP_SOFT_TTL < PICKUP_HARD_TTL);
});

test('patient pickups (SYS-09) fly home at 60 s and are banked at 75 s, keeping the same 15 s window', () => {
  assert.deepEqual([pickupSoftTtl(true), pickupTtl('coin', true), pickupTtl('xp', true)], [60, 75, 75]);
  assert.equal(PATIENT_PICKUP_HARD_TTL - PATIENT_PICKUP_SOFT_TTL, PICKUP_HARD_TTL - PICKUP_SOFT_TTL);
  const [target] = pickups(1);
  target.life = PATIENT_PICKUP_HARD_TTL;
  mergePickupValue(target, 3, true);
  assert.equal(target.life, PATIENT_PICKUP_HARD_TTL, 'a merge never adds life beyond the patient limit');
  mergePickupValue(target, 3);
  assert.equal(target.life, PICKUP_HARD_TTL, 'nor beyond the classic one');
});
