import assert from 'node:assert/strict';
import test from 'node:test';
import {
  nextRovingId,
  normalizeGamepadAxis,
  readGamepadIntent,
  watchReducedMotion,
} from '../src/ui/inputContracts.ts';

const button = (pressed = false) => ({ pressed, value: pressed ? 1 : 0 });
const buttons = () => Array.from({ length: 16 }, () => button());

test('gamepad intent applies a deadzone and normalizes diagonals', () => {
  assert.equal(normalizeGamepadAxis(0.12), 0);
  const intent = readGamepadIntent([{ connected: true, axes: [0.9, -0.9], buttons: buttons() }], false);
  assert.equal(intent.active, true);
  assert.ok(Math.hypot(intent.x, intent.y) <= 1);
  assert.ok(intent.x > 0 && intent.y < 0);
});

test('D-pad overrides axes and Start emits one pause edge per press', () => {
  const padButtons = buttons();
  padButtons[14] = button(true);
  padButtons[12] = button(true);
  padButtons[9] = button(true);
  const first = readGamepadIntent([{ axes: [0.8, 0.8], buttons: padButtons }], false);
  assert.ok(first.x < 0 && first.y < 0);
  assert.equal(first.pauseJustPressed, true);
  const held = readGamepadIntent([{ axes: [0, 0], buttons: padButtons }], first.pauseHeld);
  assert.equal(held.pauseJustPressed, false);
});

test('roving tabs wrap and support Home and End', () => {
  const ids = ['play', 'growth', 'options'];
  assert.equal(nextRovingId(ids, 'play', 'ArrowLeft'), 'options');
  assert.equal(nextRovingId(ids, 'options', 'ArrowRight'), 'play');
  assert.equal(nextRovingId(ids, 'growth', 'Home'), 'play');
  assert.equal(nextRovingId(ids, 'growth', 'End'), 'options');
});

test('reduced-motion listener receives changes and is removed on cleanup', () => {
  let listener;
  let removed = false;
  const values = [];
  const cleanup = watchReducedMotion(
    () => ({
      matches: false,
      addEventListener: (_type, next) => { listener = next; },
      removeEventListener: (_type, next) => { removed = next === listener; },
    }),
    (reduced) => values.push(reduced),
  );
  listener({ matches: true });
  cleanup();
  assert.deepEqual(values, [false, true]);
  assert.equal(removed, true);
});
