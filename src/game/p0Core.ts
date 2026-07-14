export const FIXED_TIMESTEP = 1 / 60;
export const MAX_FRAME_DELTA = 0.05;
export const MAX_FIXED_STEPS = 6;

export type Point = {
  x: number;
  y: number;
};

export type CircleTarget = Point & {
  id: number;
  radius: number;
};

export type DraftAfter = 'resume' | 'roundClear';
export type DraftResolution = 'draft' | 'roundClear' | 'resume';
export type VortexSource = 'voidMine' | 'blackSun';
export type TerminalEvent = 'gameOver' | 'roundClear' | 'continue';

export function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function planFixedSteps(accumulator: number, frameDelta: number, timeScale: number) {
  const boundedDelta = Math.min(MAX_FRAME_DELTA, Math.max(0, frameDelta));
  const available = Math.max(0, accumulator) + boundedDelta * Math.max(0, timeScale);
  const steps = Math.min(MAX_FIXED_STEPS, Math.floor((available + Number.EPSILON) / FIXED_TIMESTEP));
  return {
    steps,
    remainder: Math.max(0, available - steps * FIXED_TIMESTEP),
  };
}

export function segmentCircleHitTime(start: Point, end: Point, center: Point, radius: number) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const fx = start.x - center.x;
  const fy = start.y - center.y;
  const a = dx * dx + dy * dy;
  const radiusSq = radius * radius;

  if (fx * fx + fy * fy <= radiusSq) return 0;
  if (a === 0) return null;

  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radiusSq;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;

  const root = Math.sqrt(discriminant);
  const first = (-b - root) / (2 * a);
  const second = (-b + root) / (2 * a);
  if (first >= 0 && first <= 1) return first;
  if (second >= 0 && second <= 1) return second;
  return null;
}

export function segmentRectHitTime(
  start: Point,
  end: Point,
  rect: { x: number; y: number; w: number; h: number },
  padding = 0,
) {
  const minX = rect.x - padding;
  const maxX = rect.x + rect.w + padding;
  const minY = rect.y - padding;
  const maxY = rect.y + rect.h + padding;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  let near = 0;
  let far = 1;

  for (const [origin, delta, min, max] of [[start.x, dx, minX, maxX], [start.y, dy, minY, maxY]] as const) {
    if (delta === 0) {
      if (origin < min || origin > max) return null;
      continue;
    }
    const first = (min - origin) / delta;
    const second = (max - origin) / delta;
    near = Math.max(near, Math.min(first, second));
    far = Math.min(far, Math.max(first, second));
    if (near > far) return null;
  }

  return near >= 0 && near <= 1 ? near : null;
}

export function collectSegmentHits<T extends CircleTarget>(
  start: Point,
  end: Point,
  movingRadius: number,
  targets: T[],
  excludedIds: ReadonlySet<number>,
) {
  return targets
    .filter((target) => !excludedIds.has(target.id))
    .map((target) => ({
      target,
      time: segmentCircleHitTime(start, end, target, movingRadius + target.radius),
    }))
    .filter((hit): hit is { target: T; time: number } => hit.time !== null)
    .sort((a, b) => a.time - b.time || a.target.id - b.target.id);
}

export function resolveDraftTransition(
  activeAfter: DraftAfter,
  pendingRoundClear: boolean,
  hasQueuedDraft: boolean,
) {
  const shouldClear = pendingRoundClear || activeAfter === 'roundClear';
  const resolution: DraftResolution = hasQueuedDraft ? 'draft' : shouldClear ? 'roundClear' : 'resume';
  return {
    resolution,
    pendingRoundClear: hasQueuedDraft && shouldClear,
  };
}

export function createVortexProfile(sourceSkillId: VortexSource, level: number, awakened: boolean) {
  if (sourceSkillId === 'voidMine') {
    return {
      sourceSkillId,
      pull: 74 + level * 14 + (awakened ? 36 : 0),
      collapseDamageMultiplier: awakened ? 1.6 : 0,
    };
  }

  return {
    sourceSkillId,
    pull: 74 + level * 16 + (awakened ? 55 : 0),
    collapseDamageMultiplier: awakened ? 2.4 : 0,
  };
}

export function expiredThisStep(previousLife: number, nextLife: number) {
  return previousLife > 0 && nextLife <= 0;
}

export function consumeHitStopStep(hitStop: number) {
  const active = hitStop > 0;
  return {
    simulationDelta: FIXED_TIMESTEP * (active ? 0.18 : 1),
    hitStop: active ? Math.max(0, hitStop - FIXED_TIMESTEP) : 0,
  };
}

export function shockHitsPlayer(shock: Point, radius: number, player: Point, playerRadius: number) {
  return Math.hypot(shock.x - player.x, shock.y - player.y) <= radius + playerRadius;
}

export function resolveTerminalEvent(playerHp: number, roundShouldClear: boolean): TerminalEvent {
  if (playerHp <= 0) return 'gameOver';
  if (roundShouldClear) return 'roundClear';
  return 'continue';
}

export function partitionAlive<T extends { hp: number }>(entities: T[]) {
  const alive: T[] = [];
  const dead: T[] = [];
  for (const entity of entities) {
    (entity.hp > 0 ? alive : dead).push(entity);
  }
  return { alive, dead };
}
