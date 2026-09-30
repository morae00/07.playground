// The input device used last (UI-07): the keyboard and mouse, or a gamepad of the Xbox or PlayStation family.
// Prompts show that device's glyphs, and switch as soon as the player picks up another device.
import { useSyncExternalStore } from 'react';

export type InputDevice = 'keyboard' | 'xbox' | 'ps';

let device: InputDevice = 'keyboard';
const listeners = new Set<() => void>();

export function setInputDevice(next: InputDevice) {
  if (next === device) return;
  device = next;
  for (const listener of listeners) listener();
}

export const currentInputDevice = () => device;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useInputDevice() {
  return useSyncExternalStore(subscribe, currentInputDevice, currentInputDevice);
}

/** Sony pads report vendor 054c or name themselves; every other pad reads as the Xbox layout of the standard mapping. */
export function padFamily(id: string): 'xbox' | 'ps' {
  return /054c|playstation|dualshock|dualsense/i.test(id) ? 'ps' : 'xbox';
}

/** Keys and pointer presses mark the keyboard as the device in use. Returns the cleanup. */
export function trackKeyboardAndPointer(target: Window) {
  const onInput = () => setInputDevice('keyboard');
  target.addEventListener('keydown', onInput, true);
  target.addEventListener('pointerdown', onInput, true);
  return () => {
    target.removeEventListener('keydown', onInput, true);
    target.removeEventListener('pointerdown', onInput, true);
  };
}
