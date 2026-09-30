import assert from 'node:assert/strict';
import test from 'node:test';
import { SEPARATION, STALKER_FLOCK, SeparationGrid, WARDEN_SHIELD, angleDelta, flockSteer, leadAim, separationPush, shieldCovers, turnToward } from './enemyBehaviors.ts';

const near = (actual: number, expected: number, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} is not ${expected}`);

test('separation parts overlapping bodies, the lighter one more, and leaves apart ones alone', () => {
  assert.deepEqual(separationPush({ x: 0, y: 0 }, 12, { x: 40, y: 0 }, 12), { x: 0, y: 0 });
  const small = separationPush({ x: 0, y: 0 }, 12, { x: 10, y: 0 }, 28);
  const large = separationPush({ x: 10, y: 0 }, 28, { x: 0, y: 0 }, 12);
  assert.ok(small.x < 0 && large.x > 0, 'they move apart');
  assert.ok(Math.abs(small.x) > Math.abs(large.x) * 4, 'the small body gives way');
  const overlap = 12 + 28 - 10;
  near(Math.abs(small.x) + Math.abs(large.x), overlap * SEPARATION.strength);
  const stacked = separationPush({ x: 5, y: 5 }, 12, { x: 5, y: 5 }, 12);
  assert.ok(stacked.x > 0 && stacked.y === 0, 'stacked bodies part along a fixed axis');
});

test('stalkers bend their chase toward the pack only with enough neighbours', () => {
  const chase = { x: 1, y: 0 };
  assert.deepEqual(flockSteer({ x: 0, y: 0 }, chase, [{ x: 0, y: 50, vx: 0, vy: 1 }]), { x: 1, y: 0 });
  const pack = [
    { x: 0, y: 60, vx: 0, vy: 10 },
    { x: 20, y: 70, vx: 0, vy: 10 },
  ];
  const steer = flockSteer({ x: 0, y: 0 }, chase, pack);
  assert.ok(steer.y > 0.2 && steer.x > 0.5, `pulled toward the pack and its heading: ${JSON.stringify(steer)}`);
  near(Math.hypot(steer.x, steer.y), 1);
  assert.ok(STALKER_FLOCK.minNeighbours === 2);
});

test('shooters lead a moving player by the windup plus travel time, capped', () => {
  // 150 units away: 0.44 s windup plus about 0.85 s of travel.
  const aim = leadAim({ x: 0, y: 0 }, { x: 150, y: 0 }, { x: 0, y: 100 }, 0.44, 220);
  assert.ok(aim.y > 115 && aim.y < 135, `leads downward by about 1.3 s: ${aim.y}`);
  assert.deepEqual(leadAim({ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 0, y: 0 }, 0.44, 220), { x: 300, y: 0 }, 'a still player is aimed at directly');
  const far = leadAim({ x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 0, y: 100 }, 0.44, 220);
  near(far.y, 140);
});

test('the warden shield turns at 90 degrees per second and covers a 120-degree front', () => {
  near(angleDelta(0, Math.PI * 1.5), -Math.PI / 2);
  near(turnToward(0, Math.PI, WARDEN_SHIELD.turnRadiansPerSecond * 0.5), Math.PI / 4);
  near(turnToward(0, 0.1, 1), 0.1);
  const body = { x: 0, y: 0 };
  assert.equal(shieldCovers(0, body, { x: 100, y: 0 }), true, 'straight ahead');
  assert.equal(shieldCovers(0, body, { x: 100, y: 150 }), true, 'inside 60 degrees');
  assert.equal(shieldCovers(0, body, { x: 0, y: 100 }), false, 'from the side');
  assert.equal(shieldCovers(0, body, { x: -100, y: 0 }), false, 'from behind');
  assert.ok(WARDEN_SHIELD.damageScale > 0 && WARDEN_SHIELD.damageScale < 1);
});

test('the separation grid finds every overlapping pair and matches the brute-force sum', () => {
  let seed = 99;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const radii = [12, 12, 12, 19, 19, 28];
  const bodies = Array.from({ length: 220 }, (_, index) => ({
    x: 500 + random() * 400,
    y: 400 + random() * 300,
    radius: index < 2 ? 54 : radii[index % radii.length],
    hp: index % 37 === 5 ? 0 : 10,
    isBoss: index < 2,
  }));
  const grid = new SeparationGrid({ minX: -120, minY: -120, maxX: 4320, maxY: 3120 });
  grid.compute(bodies);
  const out = { x: 0, y: 0 };
  for (let index = 0; index < bodies.length; index += 1) {
    let x = 0;
    let y = 0;
    const body = bodies[index];
    if (body.hp > 0) {
      for (let other = 0; other < bodies.length; other += 1) {
        if (other === index || bodies[other].hp <= 0) continue;
        separationPush(body, body.radius, bodies[other], bodies[other].radius, SEPARATION.strength, out);
        x += out.x;
        y += out.y;
      }
    }
    near(grid.pushX[index], x, 1e-9);
    near(grid.pushY[index], y, 1e-9);
  }
  // Visiting order does not matter: the same body gets the same push from a reversed list.
  const reversed = [...bodies].reverse();
  grid.compute(reversed);
  const fromReversed = grid.pushX[reversed.length - 1 - 10];
  grid.compute(bodies);
  near(fromReversed, grid.pushX[10], 1e-9);
});
