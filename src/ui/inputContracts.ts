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
