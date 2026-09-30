import assert from 'node:assert/strict';
import test from 'node:test';
import { currentInputDevice, padFamily, setInputDevice, trackKeyboardAndPointer } from './inputDevice.ts';

// Input device glyphs (UI-07): the last device used picks the glyphs, and pads are told apart by their names.
test('UI-07: Sony pads read as PlayStation, every other pad as the Xbox layout', () => {
  assert.equal(padFamily('Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)'), 'ps');
  assert.equal(padFamily('DualSense Wireless Controller'), 'ps');
  assert.equal(padFamily('Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)'), 'xbox');
  assert.equal(padFamily('8BitDo Pro 2'), 'xbox');
});

test('UI-07: a key or pointer press hands the glyphs back to the keyboard', () => {
  const listeners = new Map<string, () => void>();
  const target = {
    addEventListener: (type: string, listener: () => void) => listeners.set(type, listener),
    removeEventListener: (type: string) => listeners.delete(type),
  } as unknown as Window;
  const stop = trackKeyboardAndPointer(target);
  setInputDevice('ps');
  assert.equal(currentInputDevice(), 'ps');
  listeners.get('keydown')?.();
  assert.equal(currentInputDevice(), 'keyboard');
  setInputDevice('xbox');
  listeners.get('pointerdown')?.();
  assert.equal(currentInputDevice(), 'keyboard');
  stop();
  assert.equal(listeners.size, 0);
});
