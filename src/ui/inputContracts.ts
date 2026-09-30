export type GamepadButtonLike = {
  pressed: boolean;
  value?: number;
};

export type GamepadLike = {
  connected?: boolean;
  /** The browser's pad name; it tells the PlayStation family apart (UI-07 glyphs). */
  id?: string;
  axes: readonly number[];
  buttons: readonly GamepadButtonLike[];
};

export type GamepadIntent = {
  x: number;
  y: number;
  active: boolean;
  pauseHeld: boolean;
  pauseJustPressed: boolean;
};

export type RovingKey = 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

type ReducedMotionQueryLike = {
  matches: boolean;
  addEventListener?: (type: 'change', listener: (event: { matches: boolean }) => void) => void;
  removeEventListener?: (type: 'change', listener: (event: { matches: boolean }) => void) => void;
  addListener?: (listener: (event: { matches: boolean }) => void) => void;
  removeListener?: (listener: (event: { matches: boolean }) => void) => void;
};

function buttonPressed(button: GamepadButtonLike | undefined) {
  return Boolean(button?.pressed || (button?.value ?? 0) > 0.5);
}

export function normalizeGamepadAxis(value: number, deadzone = 0.18) {
  if (!Number.isFinite(value)) return 0;
  const magnitude = Math.abs(value);
  if (magnitude <= deadzone) return 0;
  const normalized = (magnitude - deadzone) / (1 - deadzone);
  return Math.sign(value) * Math.min(1, normalized);
}

export function readGamepadIntent(
  gamepads: readonly (GamepadLike | null | undefined)[],
  previousPauseHeld: boolean,
): GamepadIntent {
  const pad = gamepads.find((candidate) => candidate && candidate.connected !== false);
  if (!pad) {
    return { x: 0, y: 0, active: false, pauseHeld: false, pauseJustPressed: false };
  }

  let x = normalizeGamepadAxis(pad.axes[0] ?? 0);
  let y = normalizeGamepadAxis(pad.axes[1] ?? 0);
  if (buttonPressed(pad.buttons[14])) x = -1;
  if (buttonPressed(pad.buttons[15])) x = 1;
  if (buttonPressed(pad.buttons[12])) y = -1;
  if (buttonPressed(pad.buttons[13])) y = 1;

  const magnitude = Math.hypot(x, y);
  if (magnitude > 1) {
    x /= magnitude;
    y /= magnitude;
  }

  const pauseHeld = buttonPressed(pad.buttons[9]);
  return {
    x,
    y,
    active: x !== 0 || y !== 0,
    pauseHeld,
    pauseJustPressed: pauseHeld && !previousPauseHeld,
  };
}

export type NavDirection = 'up' | 'down' | 'left' | 'right';
export type GamepadNavAction = NavDirection | 'confirm' | 'back' | 'tabPrevious' | 'tabNext';

export type GamepadNavState = {
  confirmHeld: boolean;
  backHeld: boolean;
  tabPreviousHeld: boolean;
  tabNextHeld: boolean;
  direction: NavDirection | null;
  nextRepeatAt: number;
};

export const INITIAL_GAMEPAD_NAV_STATE: GamepadNavState = Object.freeze({
  confirmHeld: false,
  backHeld: false,
  tabPreviousHeld: false,
  tabNextHeld: false,
  direction: null,
  nextRepeatAt: 0,
});

const NAV_AXIS_THRESHOLD = 0.6;
const NAV_REPEAT_DELAY_MS = 380;
const NAV_REPEAT_INTERVAL_MS = 160;
/** A stick past this, or any pressed button, counts as using the pad (UI-07 glyphs). */
const PAD_ACTIVITY_AXIS = 0.3;

/** Which way the D-pad or the left stick points (the D-pad wins), when it clearly points one way. */
function navDirection(pad: GamepadLike): NavDirection | null {
  if (buttonPressed(pad.buttons[12])) return 'up';
  if (buttonPressed(pad.buttons[13])) return 'down';
  if (buttonPressed(pad.buttons[14])) return 'left';
  if (buttonPressed(pad.buttons[15])) return 'right';
  const x = pad.axes[0] ?? 0;
  const y = pad.axes[1] ?? 0;
  if (Math.max(Math.abs(x), Math.abs(y)) < NAV_AXIS_THRESHOLD) return null;
  if (Math.abs(x) > Math.abs(y)) return x < 0 ? 'left' : 'right';
  return y < 0 ? 'up' : 'down';
}

/** Whether a pad is being used at all: a pressed button or a stick off centre. */
export function padActive(pad: GamepadLike) {
  return pad.buttons.some((button) => buttonPressed(button)) || pad.axes.some((axis) => Math.abs(axis) > PAD_ACTIVITY_AXIS);
}

/**
 * Reads UI navigation from a gamepad (BUG-06, UI-07): the D-pad or left stick moves focus in four directions, with
 * hold-to-repeat; A (button 0) confirms, B (button 1) goes back, and LB / RB (buttons 4 and 5) switch tabs. Start
 * stays with the pause handling, and none of these buttons are ever mapped to attacks (G1).
 */
export function readGamepadNavigation(
  gamepads: readonly (GamepadLike | null | undefined)[],
  previous: GamepadNavState,
  now: number,
): { actions: GamepadNavAction[]; state: GamepadNavState } {
  const pad = gamepads.find((candidate) => candidate && candidate.connected !== false);
  if (!pad) return { actions: [], state: { ...INITIAL_GAMEPAD_NAV_STATE } };
  const actions: GamepadNavAction[] = [];

  const direction = navDirection(pad);
  let nextRepeatAt = previous.nextRepeatAt;
  if (direction && direction !== previous.direction) {
    actions.push(direction);
    nextRepeatAt = now + NAV_REPEAT_DELAY_MS;
  } else if (direction && now >= previous.nextRepeatAt) {
    actions.push(direction);
    nextRepeatAt = now + NAV_REPEAT_INTERVAL_MS;
  }

  const confirmHeld = buttonPressed(pad.buttons[0]);
  const backHeld = buttonPressed(pad.buttons[1]);
  const tabPreviousHeld = buttonPressed(pad.buttons[4]);
  const tabNextHeld = buttonPressed(pad.buttons[5]);
  if (confirmHeld && !previous.confirmHeld) actions.push('confirm');
  if (backHeld && !previous.backHeld) actions.push('back');
  if (tabPreviousHeld && !previous.tabPreviousHeld) actions.push('tabPrevious');
  if (tabNextHeld && !previous.tabNextHeld) actions.push('tabNext');

  return { actions, state: { confirmHeld, backHeld, tabPreviousHeld, tabNextHeld, direction, nextRepeatAt } };
}

export function nextRovingId<T extends string>(ids: readonly T[], current: T, key: RovingKey) {
  if (ids.length === 0) return current;
  if (key === 'Home') return ids[0];
  if (key === 'End') return ids[ids.length - 1];
  const currentIndex = Math.max(0, ids.indexOf(current));
  const direction = key === 'ArrowRight' ? 1 : -1;
  return ids[(currentIndex + direction + ids.length) % ids.length];
}

export function watchReducedMotion(
  matchMedia: ((query: string) => ReducedMotionQueryLike) | undefined,
  onChange: (reduced: boolean) => void,
) {
  if (!matchMedia) {
    onChange(false);
    return () => undefined;
  }

  const query = matchMedia('(prefers-reduced-motion: reduce)');
  const listener = (event: { matches: boolean }) => onChange(event.matches);
  onChange(query.matches);
  if (query.addEventListener) query.addEventListener('change', listener);
  else query.addListener?.(listener);

  return () => {
    if (query.removeEventListener) query.removeEventListener('change', listener);
    else query.removeListener?.(listener);
  };
}
