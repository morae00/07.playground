import { useEffect, useRef } from 'react';
import { INITIAL_GAMEPAD_NAV_STATE, readGamepadNavigation, type GamepadNavAction } from './inputContracts';

const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

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

function applyAction(action: GamepadNavAction) {
  const scope = navigationScope();
  if (!scope) return;
  const items = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(visible);
  const active = document.activeElement instanceof HTMLElement && scope.contains(document.activeElement) ? document.activeElement : null;
  const index = active ? items.indexOf(active) : -1;
  if (action === 'previous' || action === 'next') {
    if (items.length === 0) return;
    const step = action === 'previous' ? -1 : 1;
    const next = index < 0 ? (step > 0 ? 0 : items.length - 1) : (index + step + items.length) % items.length;
    items[next].focus();
    return;
  }
  if (action === 'confirm') {
    // The first press only shows which control is selected, so a stray A cannot pick an unseen card.
    if (!active || active === scope) {
      const preferred = scope.querySelector<HTMLElement>('.draftCard, .modalActions .primary') ?? items[0];
      preferred?.focus();
      return;
    }
    active.click();
    return;
  }
  scope.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
}

/** Polls connected gamepads for menu and dialog navigation outside of active play (BUG-06). */
export function useGamepadNavigation(enabled: boolean) {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return;
    let state = { ...INITIAL_GAMEPAD_NAV_STATE };
    let frame = 0;
    const poll = (now: number) => {
      const result = readGamepadNavigation(Array.from(navigator.getGamepads()), state, now);
      state = result.state;
      if (enabledRef.current) for (const action of result.actions) applyAction(action);
      frame = requestAnimationFrame(poll);
    };
    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  }, []);
}
