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

/**
 * Global hit-stop budget (BUG-07): every tier together may slow the simulation for at most 80 ms per second,
 * and a new hit-stop needs 120 ms since the last one. A token bucket refills one step at a time.
 */
export const HIT_STOP_BUDGET = Object.freeze({
  perSecond: 0.08,
  minIntervalSeconds: 0.12,
});

export type HitStopBudget = {
  tokens: number;
  secondsSinceGrant: number;
};

/** The bucket starts empty so the long-run slowed share never exceeds perSecond (no opening burst). */
export function createHitStopBudget(): HitStopBudget {
  return { tokens: 0, secondsSinceGrant: HIT_STOP_BUDGET.minIntervalSeconds };
}

export function tickHitStopBudget(budget: HitStopBudget, stepSeconds = FIXED_TIMESTEP): HitStopBudget {
  return {
    tokens: Math.min(HIT_STOP_BUDGET.perSecond, budget.tokens + HIT_STOP_BUDGET.perSecond * stepSeconds),
    secondsSinceGrant: budget.secondsSinceGrant + stepSeconds,
  };
}

/**
 * Grants hit-stop in whole fixed steps, because consumeHitStopStep slows every step while any hit-stop remains.
 * The bucket is charged for the steps actually slowed, and the returned duration keeps exactly that many
 * steps active (half a step short of the boundary so float error cannot add one more).
 */
export function grantHitStop(budget: HitStopBudget, requested: number) {
  const wanted = Math.max(0, Number.isFinite(requested) ? requested : 0);
  if (wanted <= 0 || budget.secondsSinceGrant + 1e-9 < HIT_STOP_BUDGET.minIntervalSeconds) {
    return { granted: 0, steps: 0, budget };
  }
  const wantedSteps = Math.ceil(wanted / FIXED_TIMESTEP - 1e-9);
  const affordableSteps = Math.floor(budget.tokens / FIXED_TIMESTEP + 1e-9);
  const steps = Math.min(wantedSteps, affordableSteps);
  if (steps <= 0) return { granted: 0, steps: 0, budget };
  return {
    granted: (steps - 0.5) * FIXED_TIMESTEP,
    steps,
    budget: { tokens: budget.tokens - steps * FIXED_TIMESTEP, secondsSinceGrant: 0 },
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
