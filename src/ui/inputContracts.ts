export type GamepadButtonLike = {
  pressed: boolean;
  value?: number;
};

export type GamepadLike = {
  connected?: boolean;
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

export type GamepadNavAction = 'previous' | 'next' | 'confirm' | 'back';

export type GamepadNavState = {
  confirmHeld: boolean;
  backHeld: boolean;
  direction: -1 | 0 | 1;
  nextRepeatAt: number;
};

export const INITIAL_GAMEPAD_NAV_STATE: GamepadNavState = Object.freeze({
  confirmHeld: false,
  backHeld: false,
  direction: 0,
  nextRepeatAt: 0,
});

const NAV_AXIS_THRESHOLD = 0.6;
const NAV_REPEAT_DELAY_MS = 380;
const NAV_REPEAT_INTERVAL_MS = 160;

/**
 * Reads UI navigation from a gamepad (BUG-06): D-pad or left stick moves focus (up/left = previous,
 * down/right = next, with hold-to-repeat), A (button 0) confirms, B (button 1) goes back. Start stays with
 * the engine's pause handling, and none of these buttons are ever mapped to attacks (G1).
 */
export function readGamepadNavigation(
  gamepads: readonly (GamepadLike | null | undefined)[],
  previous: GamepadNavState,
  now: number,
): { actions: GamepadNavAction[]; state: GamepadNavState } {
  const pad = gamepads.find((candidate) => candidate && candidate.connected !== false);
  if (!pad) return { actions: [], state: { ...INITIAL_GAMEPAD_NAV_STATE } };
  const actions: GamepadNavAction[] = [];

  const axisX = pad.axes[0] ?? 0;
  const axisY = pad.axes[1] ?? 0;
  let direction: -1 | 0 | 1 = 0;
  if (buttonPressed(pad.buttons[12]) || buttonPressed(pad.buttons[14]) || axisY <= -NAV_AXIS_THRESHOLD || axisX <= -NAV_AXIS_THRESHOLD) direction = -1;
  if (buttonPressed(pad.buttons[13]) || buttonPressed(pad.buttons[15]) || axisY >= NAV_AXIS_THRESHOLD || axisX >= NAV_AXIS_THRESHOLD) direction = 1;

  let nextRepeatAt = previous.nextRepeatAt;
  if (direction !== 0 && direction !== previous.direction) {
    actions.push(direction < 0 ? 'previous' : 'next');
    nextRepeatAt = now + NAV_REPEAT_DELAY_MS;
  } else if (direction !== 0 && now >= previous.nextRepeatAt) {
    actions.push(direction < 0 ? 'previous' : 'next');
    nextRepeatAt = now + NAV_REPEAT_INTERVAL_MS;
  }

  const confirmHeld = buttonPressed(pad.buttons[0]);
  const backHeld = buttonPressed(pad.buttons[1]);
  if (confirmHeld && !previous.confirmHeld) actions.push('confirm');
  if (backHeld && !previous.backHeld) actions.push('back');

  return { actions, state: { confirmHeld, backHeld, direction, nextRepeatAt } };
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
