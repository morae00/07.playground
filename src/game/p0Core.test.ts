import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FIXED_TIMESTEP,
  collectSegmentHits,
  consumeHitStopStep,
  createHitStopBudget,
  grantHitStop,
  tickHitStopBudget,
  createSeededRandom,
  createVortexProfile,
  expiredThisStep,
  partitionAlive,
  planFixedSteps,
  resolveDraftTransition,
  resolveTerminalEvent,
  segmentCircleHitTime,
  segmentRectHitTime,
  shockHitsPlayer,
} from './p0Core.ts';

test('fixed step planner makes 2x consume twice the simulation steps', () => {
  const normal = planFixedSteps(0, 1 / 60, 1);
  const double = planFixedSteps(0, 1 / 60, 2);
  assert.equal(normal.steps, 1);
  assert.equal(double.steps, 2);
  assert.ok(normal.remainder < FIXED_TIMESTEP);
  assert.ok(double.remainder < FIXED_TIMESTEP);
});

test('fixed step planner caps long frames without changing step size', () => {
  const result = planFixedSteps(0, 1, 2);
  assert.equal(result.steps, 6);
  assert.ok(result.remainder < FIXED_TIMESTEP);
});

test('fixed step planner contains negative clocks and an empty frame', () => {
  assert.deepEqual(planFixedSteps(-1, -1, -2), { steps: 0, remainder: 0 });
});

test('one second at 2x matches two seconds at 1x', () => {
  const countSteps = (frames: number, timeScale: number) => {
    let accumulator = 0;
    let steps = 0;
    for (let frame = 0; frame < frames; frame += 1) {
      const plan = planFixedSteps(accumulator, 1 / 60, timeScale);
      accumulator = plan.remainder;
      steps += plan.steps;
    }
    return steps;
  };
  assert.equal(countSteps(60, 2), countSteps(120, 1));
});

test('hit stop is consumed in fixed simulation steps', () => {
  let hitStop = 0.035;
  const deltas: number[] = [];
  for (let step = 0; step < 3; step += 1) {
    const result = consumeHitStopStep(hitStop);
    hitStop = result.hitStop;
    deltas.push(result.simulationDelta);
  }
  assert.deepEqual(deltas, [FIXED_TIMESTEP * 0.18, FIXED_TIMESTEP * 0.18, FIXED_TIMESTEP * 0.18]);
  assert.equal(hitStop, 0);
});

test('gameplay and effect random streams do not contaminate each other', () => {
  const gameplayA = createSeededRandom(1234);
  const gameplayB = createSeededRandom(1234);
  const effects = createSeededRandom(9876);
  const first = gameplayA();
  for (let index = 0; index < 20; index += 1) effects();
  const second = gameplayA();
  assert.equal(first, gameplayB());
  assert.equal(second, gameplayB());
});

test('swept collision detects a small target between frame endpoints', () => {
  const hit = segmentCircleHitTime({ x: 0, y: 0 }, { x: 82, y: 0 }, { x: 41, y: 0 }, 16);
  assert.notEqual(hit, null);
  assert.ok(hit! > 0 && hit! < 1);
});

test('circle sweep covers contained, stationary, missed, and past intersections', () => {
  assert.equal(segmentCircleHitTime({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 0 }, 2), 0);
  assert.equal(segmentCircleHitTime({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 2), null);
  assert.equal(segmentCircleHitTime({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 5 }, 2), null);
  assert.equal(segmentCircleHitTime({ x: 10, y: 0 }, { x: 20, y: 0 }, { x: 0, y: 0 }, 2), null);
});

test('segment hits are ordered and already-hit targets are excluded', () => {
  const targets = [
    { id: 2, x: 65, y: 0, radius: 5 },
    { id: 1, x: 25, y: 0, radius: 5 },
    { id: 3, x: 45, y: 0, radius: 5 },
  ];
  const hits = collectSegmentHits({ x: 0, y: 0 }, { x: 80, y: 0 }, 3, targets, new Set([3]));
  assert.deepEqual(hits.map((hit) => hit.target.id), [1, 2]);
});

test('a projectile cannot hit the same target on the next step', () => {
  const target = { id: 7, x: 10, y: 0, radius: 8 };
  const hitIds = new Set<number>();
  const first = collectSegmentHits({ x: 0, y: 0 }, { x: 12, y: 0 }, 3, [target], hitIds);
  assert.equal(first.length, 1);
  hitIds.add(first[0].target.id);
  const second = collectSegmentHits({ x: 12, y: 0 }, { x: 16, y: 0 }, 3, [target], hitIds);
  assert.equal(second.length, 0);
});

test('swept rectangle collision blocks a projectile between endpoints', () => {
  const hit = segmentRectHitTime(
    { x: 0, y: 10 },
    { x: 100, y: 10 },
    { x: 45, y: 0, w: 10, h: 20 },
    3,
  );
  assert.notEqual(hit, null);
  assert.ok(hit! > 0 && hit! < 1);
});

test('rectangle sweep handles parallel, separating, and out-of-segment paths', () => {
  const rect = { x: 10, y: 10, w: 10, h: 10 };
  assert.equal(segmentRectHitTime({ x: 0, y: 0 }, { x: 0, y: 20 }, rect), null);
  assert.equal(segmentRectHitTime({ x: 15, y: 0 }, { x: 15, y: 30 }, rect), 1 / 3);
  assert.equal(segmentRectHitTime({ x: 0, y: 25 }, { x: 30, y: 25 }, rect), null);
  assert.equal(segmentRectHitTime({ x: 30, y: 15 }, { x: 40, y: 15 }, rect), null);
});

test('round clear waits until every queued draft is consumed', () => {
  const first = resolveDraftTransition('resume', true, true);
  assert.deepEqual(first, { resolution: 'draft', pendingRoundClear: true });
  const last = resolveDraftTransition('resume', first.pendingRoundClear, false);
  assert.deepEqual(last, { resolution: 'roundClear', pendingRoundClear: false });
});

test('boss reward requests round clear after its final draft', () => {
  assert.deepEqual(resolveDraftTransition('roundClear', false, false), {
    resolution: 'roundClear',
    pendingRoundClear: false,
  });
});

test('draft transition resumes when no reward or clear remains', () => {
  assert.deepEqual(resolveDraftTransition('resume', false, false), {
    resolution: 'resume',
    pendingRoundClear: false,
  });
});

test('vortex profiles remain isolated by source skill', () => {
  const mine = createVortexProfile('voidMine', 5, true);
  const sun = createVortexProfile('blackSun', 5, true);
  assert.equal(mine.sourceSkillId, 'voidMine');
  assert.equal(mine.collapseDamageMultiplier, 1.6);
  assert.equal(sun.sourceSkillId, 'blackSun');
  assert.equal(sun.collapseDamageMultiplier, 2.4);
  assert.notEqual(mine.pull, sun.pull);
});

test('unawakened vortex profiles do not collapse', () => {
  assert.equal(createVortexProfile('voidMine', 0, false).collapseDamageMultiplier, 0);
  assert.equal(createVortexProfile('blackSun', 0, false).collapseDamageMultiplier, 0);
});

test('shock range targets the player and terminal priority favors game over', () => {
  assert.equal(shockHitsPlayer({ x: 0, y: 0 }, 20, { x: 24, y: 0 }, 5), true);
  assert.equal(shockHitsPlayer({ x: 0, y: 0 }, 20, { x: 30, y: 0 }, 5), false);
  assert.equal(resolveTerminalEvent(0, true), 'gameOver');
  assert.equal(resolveTerminalEvent(1, true), 'roundClear');
  assert.equal(resolveTerminalEvent(1, false), 'continue');
});

test('expiry and death partitioning are edge-triggered and stable', () => {
  assert.equal(expiredThisStep(0.1, 0), true);
  assert.equal(expiredThisStep(0, -0.1), false);
  const result = partitionAlive([{ id: 1, hp: 0 }, { id: 2, hp: 4 }, { id: 3, hp: -1 }]);
  assert.deepEqual(result.alive.map((item) => item.id), [2]);
  assert.deepEqual(result.dead.map((item) => item.id), [1, 3]);
  assert.deepEqual(partitionAlive([]), { alive: [], dead: [] });
  assert.equal(expiredThisStep(0.1, 0.05), false);
  assert.deepEqual(consumeHitStopStep(0), { simulationDelta: FIXED_TIMESTEP, hitStop: 0 });
});

test('hit-stop budget caps slowed steps at 80 ms per second with a 120 ms minimum gap (BUG-07)', () => {
  let budget = createHitStopBudget();
  assert.equal(grantHitStop(budget, 0.035).granted, 0, 'the bucket starts empty');
  for (let step = 0; step < 60; step += 1) budget = tickHitStopBudget(budget);
  const first = grantHitStop(budget, 0.035);
  assert.equal(first.steps, 3, '0.035 s of hit-stop slows three fixed steps');
  let remaining = first.granted;
  let active = 0;
  while (remaining > 0) {
    const step = consumeHitStopStep(remaining);
    remaining = step.hitStop;
    active += 1;
  }
  assert.equal(active, 3, 'the granted duration keeps exactly the charged number of steps active');
  budget = first.budget;
  assert.equal(grantHitStop(budget, 0.035).granted, 0, 'a second hit-stop within 120 ms is refused');
  for (let step = 0; step < 8; step += 1) budget = tickHitStopBudget(budget);
  assert.ok(grantHitStop(budget, 0.025).steps >= 1, 'granted again after the gap');

  let slowedSteps = 0;
  budget = createHitStopBudget();
  for (let step = 0; step < 600; step += 1) {
    budget = tickHitStopBudget(budget);
    const grant = grantHitStop(budget, 0.045);
    budget = grant.budget;
    slowedSteps += grant.steps;
  }
  assert.ok(slowedSteps <= Math.ceil(0.08 * 60 * 10) + 5, `at most 80 ms of slowed steps per second, got ${slowedSteps} steps in 10 s`);
  assert.ok(slowedSteps / 600 <= 0.08 + 1e-9, `slowed share ${slowedSteps / 600}`);
  assert.equal(grantHitStop({ tokens: 1, secondsSinceGrant: 1 }, 0).granted, 0);
  assert.equal(grantHitStop({ tokens: 1, secondsSinceGrant: 1 }, Number.NaN).granted, 0);
  assert.equal(grantHitStop({ tokens: 0, secondsSinceGrant: 1 }, 0.03).granted, 0, 'an empty bucket grants nothing');
});
