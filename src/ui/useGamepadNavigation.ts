// Gamepad control of menus and dialogs (BUG-06, UI-07). Outside active play the D-pad or left stick moves the focus
// ring to the nearest control in that direction, A confirms, B goes back, and LB / RB switch the tabs in view; on a
// slider or a select, left and right change its value. The pad in use also sets the glyphs prompts show.
import { useEffect, useRef } from 'react';
import { INITIAL_GAMEPAD_NAV_STATE, padActive, readGamepadNavigation, type GamepadNavAction, type NavDirection } from './inputContracts';
import { padFamily, setInputDevice, trackKeyboardAndPointer } from './inputDevice';

const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** The control the first press lands on when nothing in view has focus: a draft card, the primary action, or a start button. */
const PREFERRED = '.draftCard, .modalActions .primary, .launch';

/** Pad focus always shows the ring, even right after a mouse click (which normally hides focus-visible). */
function focusRing(element: HTMLElement) {
  element.focus({ focusVisible: true } as FocusOptions);
}

function visible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && !element.closest('[hidden], [inert]');
}

/** The UI area a gamepad drives right now: the open dialog, else the menu. Gameplay keeps the pad for movement. */
function navigationScope(): HTMLElement | null {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'));
  const dialog = dialogs.at(-1);
  if (dialog) return dialog;
  return document.querySelector<HTMLElement>('.menuLayer');
}

/** Sets a control's value the way a user would, so React sees the change. */
function setValue(element: HTMLInputElement | HTMLSelectElement, value: string) {
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set?.call(element, value);
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
}

/** Left and right on a slider move it one step, and on a select pick the neighbouring option. */
function adjust(element: HTMLElement, step: -1 | 1) {
  if (element instanceof HTMLInputElement && element.type === 'range') {
    const unit = Number(element.step) || 1;
    const decimals = (element.step.split('.')[1] ?? '').length;
    const value = Math.min(Number(element.max), Math.max(Number(element.min), Number(element.value) + step * unit));
    setValue(element, String(Number(value.toFixed(decimals))));
    return true;
  }
  if (element instanceof HTMLSelectElement) {
    const index = element.selectedIndex + step;
    if (index >= 0 && index < element.options.length) setValue(element, element.options[index].value);
    return true;
  }
  return false;
}

/** The nearest control in a direction: the least distance along it, with sideways offset counting double. */
function nearest(items: readonly HTMLElement[], from: HTMLElement, direction: NavDirection) {
  const origin = from.getBoundingClientRect();
  const x = origin.left + origin.width / 2;
  const y = origin.top + origin.height / 2;
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const item of items) {
    if (item === from) continue;
    const rect = item.getBoundingClientRect();
    const dx = rect.left + rect.width / 2 - x;
    const dy = rect.top + rect.height / 2 - y;
    const along = direction === 'left' ? -dx : direction === 'right' ? dx : direction === 'up' ? -dy : dy;
    if (along <= 1) continue;
    const score = along + 2 * (direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx));
    if (score < bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

function switchTab(scope: HTMLElement, step: -1 | 1) {
  const tabs = Array.from(scope.querySelectorAll<HTMLElement>('[role="tab"]')).filter(visible);
  if (tabs.length === 0) return;
  const current = Math.max(0, tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'));
  const next = tabs[(current + step + tabs.length) % tabs.length];
  next.click();
  focusRing(next);
}

function applyAction(action: GamepadNavAction) {
  const scope = navigationScope();
  if (!scope) return;
  if (action === 'back') {
    scope.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    return;
  }
  if (action === 'tabPrevious' || action === 'tabNext') {
    switchTab(scope, action === 'tabPrevious' ? -1 : 1);
    return;
  }
  const items = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(visible);
  const active = document.activeElement instanceof HTMLElement && scope.contains(document.activeElement) && document.activeElement !== scope
    ? document.activeElement
    : null;
  // The first press only shows which control is selected, so a stray A cannot pick an unseen card (BUG-05).
  if (!active) {
    const first = items.find((item) => item.matches(PREFERRED)) ?? items[0];
    if (first) focusRing(first);
    return;
  }
  if (action === 'confirm') {
    active.click();
    return;
  }
  if ((action === 'left' || action === 'right') && adjust(active, action === 'left' ? -1 : 1)) return;
  const next = nearest(items, active, action);
  if (!next) return;
  focusRing(next);
  next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/** Polls connected gamepads for menu and dialog navigation outside of active play, and tracks the device in use. */
export function useGamepadNavigation(enabled: boolean) {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => trackKeyboardAndPointer(window), []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return;
    let state = { ...INITIAL_GAMEPAD_NAV_STATE };
    let frame = 0;
    const poll = (now: number) => {
      const pads = Array.from(navigator.getGamepads());
      const pad = pads.find((candidate) => candidate && candidate.connected !== false);
      if (pad && padActive(pad)) setInputDevice(padFamily(pad.id));
      const result = readGamepadNavigation(pads, state, now);
      state = result.state;
      if (enabledRef.current) for (const action of result.actions) applyAction(action);
      frame = requestAnimationFrame(poll);
    };
    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  }, []);
}
