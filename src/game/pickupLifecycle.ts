export const PICKUP_MERGE_THRESHOLD = 160;
export const PICKUP_HARD_CAP = 240;
export const PICKUP_MERGE_RADIUS = 54;
export const PICKUP_SOFT_TTL = 30;
export const PICKUP_HARD_TTL = 45;

export type PickupLifecycleItem = {
  id: number;
  x: number;
  y: number;
  kind: 'xp' | 'coin';
  value: number;
  life: number;
};

export function pickupTtl(kind: PickupLifecycleItem['kind']) {
  void kind;
  return PICKUP_HARD_TTL;
}

export function selectPickupMergeTarget<T extends PickupLifecycleItem>(
  pickups: readonly T[],
  incoming: Pick<T, 'x' | 'y' | 'kind'>,
) {
  if (pickups.length < PICKUP_MERGE_THRESHOLD) return undefined;
  let nearest: T | undefined;
  let nearestDistanceSq = Number.POSITIVE_INFINITY;
  for (const pickup of pickups) {
    if (pickup.value <= 0 || pickup.kind !== incoming.kind) continue;
    const dx = pickup.x - incoming.x;
    const dy = pickup.y - incoming.y;
    const distanceSq = dx * dx + dy * dy;
    const withinMergeRadius = distanceSq <= PICKUP_MERGE_RADIUS * PICKUP_MERGE_RADIUS;
    if (!withinMergeRadius && pickups.length < PICKUP_HARD_CAP) continue;
    if (distanceSq < nearestDistanceSq || (distanceSq === nearestDistanceSq && pickup.id < (nearest?.id ?? Number.POSITIVE_INFINITY))) {
      nearest = pickup;
      nearestDistanceSq = distanceSq;
    }
  }
  return nearest;
}

export function mergePickupValue<T extends PickupLifecycleItem>(target: T, value: number) {
  target.value += Math.max(0, Number.isFinite(value) ? value : 0);
  target.life = Math.min(target.life, pickupTtl(target.kind));
  return target;
}
