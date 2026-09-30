import assert from 'node:assert/strict';
import test from 'node:test';
import { HIT_KICK, VIEW_LEAD, ViewCamera, shakeOffset } from './viewCamera.ts';

const STEP = 1 / 60;
const run = (camera: ViewCamera, steps: number, x: number, y: number, mx = 0, my = 0) => {
  for (let index = 0; index < steps; index += 1) camera.step(STEP, x, y, mx, my, 5000, 5000);
};

test('the view settles on the camera position without overshooting it', () => {
  const camera = new ViewCamera();
  camera.snap(1000, 1000);
  let furthest = 1000;
  for (let index = 0; index < 90; index += 1) {
    camera.step(STEP, 1200, 1000, 0, 0, 5000, 5000);
    furthest = Math.max(furthest, camera.x);
  }
  assert.ok(Math.abs(camera.x - 1200) < 1, `settled at ${camera.x}`);
  assert.ok(furthest <= 1200 + 1e-6, 'critically damped: no overshoot');
});

test('moving leans the view ahead, and stopping brings it back', () => {
  const camera = new ViewCamera();
  camera.snap(1000, 1000);
  run(camera, 180, 1000, 1000, 1, 0);
  assert.ok(Math.abs(camera.x - (1000 + VIEW_LEAD)) < 2, `leads by ${camera.x - 1000}`);
  run(camera, 180, 1000, 1000);
  assert.ok(Math.abs(camera.x - 1000) < 2);
});

test('the view stays inside the world, and a hit kicks it along the blow, then it returns', () => {
  const camera = new ViewCamera();
  camera.snap(0, 0);
  run(camera, 60, 0, 0, -1, -1);
  assert.deepEqual([camera.x, camera.y], [0, 0], 'no leaning past the world edge');
  camera.snap(1000, 1000);
  camera.kick(1, 0);
  run(camera, 6, 1000, 1000);
  assert.ok(camera.x > 1000 + HIT_KICK * 0.02, `kicked to ${camera.x}`);
  run(camera, 120, 1000, 1000);
  assert.ok(Math.abs(camera.x - 1000) < 1);
});

test('shake grows with trauma squared, draws nothing random, and is zero without trauma', () => {
  const still = shakeOffset(0, 1.23);
  assert.ok(still.x === 0 && still.y === 0, 'no trauma, no offset');
  const peak = (level: number) => Math.max(...Array.from({ length: 200 }, (_, index) => Math.hypot(shakeOffset(level, index / 60).x, shakeOffset(level, index / 60).y)));
  const half = peak(10);
  const full = peak(20);
  assert.ok(Math.abs(full / half - 4) < 0.5, `half trauma shakes a quarter as far (${(full / half).toFixed(2)}x)`);
  assert.deepEqual(shakeOffset(12, 0.5), shakeOffset(12, 0.5), 'the same moment shakes the same way');
});
