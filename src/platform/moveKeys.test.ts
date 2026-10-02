import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_MOVE_KEYS, bindMoveKey, canBindMoveKey, moveKeyLabel, moveKeyMap, moveKeysLabel, sanitizeMoveKeys } from './moveKeys.ts';

test('UI-08: the default movement keys are WASD, and the arrows always move too', () => {
  assert.equal(moveKeysLabel(DEFAULT_MOVE_KEYS), 'WASD');
  const map = moveKeyMap(DEFAULT_MOVE_KEYS);
  assert.equal(map.KeyW, 'moveUp');
  assert.equal(map.KeyD, 'moveRight');
  assert.equal(map.ArrowUp, 'moveUp');
  assert.equal(map.ArrowLeft, 'moveLeft');
});

test('UI-08: keys with another job, the arrows, and modifiers cannot be chosen', () => {
  for (const code of ['KeyP', 'KeyR', 'Digit1', 'Digit4', 'ArrowUp', 'Escape', 'Enter', 'Space', 'Tab', 'ShiftLeft', 'MetaLeft', 'F5', '']) {
    assert.equal(canBindMoveKey(code), false, code);
  }
  for (const code of ['KeyI', 'KeyJ', 'Digit5', 'Numpad8', 'Semicolon', 'Comma']) assert.equal(canBindMoveKey(code), true, code);
});

test('UI-08: choosing a key another action holds swaps the two', () => {
  const keys = bindMoveKey(DEFAULT_MOVE_KEYS, 'moveUp', 'KeyA');
  assert.deepEqual({ ...keys }, { moveUp: 'KeyA', moveDown: 'KeyS', moveLeft: 'KeyW', moveRight: 'KeyD' });
  assert.equal(bindMoveKey(DEFAULT_MOVE_KEYS, 'moveUp', 'KeyP'), DEFAULT_MOVE_KEYS, 'a reserved key changes nothing');
  const ijkl = ['KeyI', 'KeyJ', 'KeyK', 'KeyL'].reduce((acc, code, index) => bindMoveKey(acc, (['moveUp', 'moveLeft', 'moveDown', 'moveRight'] as const)[index], code), DEFAULT_MOVE_KEYS);
  assert.equal(moveKeysLabel(ijkl), 'IJKL');
  const map = moveKeyMap(ijkl);
  assert.equal(map.KeyW, undefined, 'the old key no longer moves');
  assert.equal(map.KeyI, 'moveUp');
});

test('UI-08: key names follow the keycap', () => {
  assert.equal(moveKeyLabel('KeyQ'), 'Q');
  assert.equal(moveKeyLabel('Digit7'), '7');
  assert.equal(moveKeyLabel('Numpad8'), 'Num 8');
  assert.equal(moveKeyLabel('Semicolon'), ';');
  const numpad = { moveUp: 'Numpad8', moveDown: 'Numpad5', moveLeft: 'Numpad4', moveRight: 'Numpad6' };
  assert.equal(moveKeysLabel(sanitizeMoveKeys(numpad)), 'Num 8 · Num 4 · Num 5 · Num 6');
});

test('UI-08: a saved choice that is missing, unbindable, or uses a key twice loads as the defaults (G17)', () => {
  assert.equal(sanitizeMoveKeys(undefined), DEFAULT_MOVE_KEYS);
  assert.equal(sanitizeMoveKeys({ moveUp: 'KeyP', moveDown: 'KeyS', moveLeft: 'KeyA', moveRight: 'KeyD' }), DEFAULT_MOVE_KEYS);
  assert.equal(sanitizeMoveKeys({ moveUp: 'KeyS', moveDown: 'KeyS', moveLeft: 'KeyA', moveRight: 'KeyD' }), DEFAULT_MOVE_KEYS);
  assert.deepEqual({ ...sanitizeMoveKeys({ moveUp: 'KeyI', moveDown: 'KeyK', moveLeft: 'KeyJ', moveRight: 'KeyL' }) }, { moveUp: 'KeyI', moveDown: 'KeyK', moveLeft: 'KeyJ', moveRight: 'KeyL' });
});
