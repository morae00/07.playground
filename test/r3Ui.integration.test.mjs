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

test('gamepad navigation edges: D-pad and stick move focus four ways with hold repeat, A confirms, B goes back, LB/RB switch tabs', async () => {
  const { INITIAL_GAMEPAD_NAV_STATE, padActive, readGamepadNavigation } = await import('../src/ui/inputContracts.ts');
  const pad = (pressed = {}, axes = [0, 0]) => ({ connected: true, axes, buttons: Array.from({ length: 16 }, (_, index) => button(Boolean(pressed[index]))) });
  let result = readGamepadNavigation([pad({ 15: true })], INITIAL_GAMEPAD_NAV_STATE, 0);
  assert.deepEqual(result.actions, ['right']);
  result = readGamepadNavigation([pad({ 15: true })], result.state, 100);
  assert.deepEqual(result.actions, [], 'holding does not repeat before the delay');
  result = readGamepadNavigation([pad({ 15: true })], result.state, 400);
  assert.deepEqual(result.actions, ['right'], 'holding repeats after the delay');
  result = readGamepadNavigation([pad({}, [-0.9, 0])], result.state, 420);
  assert.deepEqual(result.actions, ['left'], 'the stick navigates too');
  result = readGamepadNavigation([pad({}, [0.5, 0.8])], result.state, 440);
  assert.deepEqual(result.actions, ['down'], 'a diagonal stick takes its stronger axis');
  result = readGamepadNavigation([pad({ 12: true }, [0.9, 0])], result.state, 460);
  assert.deepEqual(result.actions, ['up'], 'the D-pad wins over the stick');
  result = readGamepadNavigation([pad({ 0: true })], result.state, 500);
  assert.deepEqual(result.actions, ['confirm']);
  result = readGamepadNavigation([pad({ 0: true })], result.state, 520);
  assert.deepEqual(result.actions, [], 'A fires once per press');
  result = readGamepadNavigation([pad({ 1: true })], result.state, 540);
  assert.deepEqual(result.actions, ['back']);
  result = readGamepadNavigation([pad({ 5: true })], result.state, 560);
  assert.deepEqual(result.actions, ['tabNext'], 'RB switches to the next tab');
  result = readGamepadNavigation([pad({ 4: true })], result.state, 580);
  assert.deepEqual(result.actions, ['tabPrevious'], 'LB switches to the previous tab');
  result = readGamepadNavigation([], result.state, 600);
  assert.deepEqual(result.actions, []);
  assert.equal(padActive(pad()), false, 'a resting pad is not in use');
  assert.equal(padActive(pad({}, [0.4, 0])), true);
  assert.equal(padActive(pad({ 9: true })), true);
});
