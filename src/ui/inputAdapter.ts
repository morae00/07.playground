// Input adapter (TEC-07): turns keyboard, pointer, and gamepad devices into engine commands.
// The engine only sees commands, so a seed plus the command log reproduces a run (G14).
import type { EngineAction, EngineCommand } from '../game/engine/contracts.ts';
import { readGamepadIntent, type GamepadLike } from './inputContracts.ts';

export const KEYBOARD_ACTIONS: Readonly<Record<string, EngineAction>> = Object.freeze({
  w: 'moveUp',
  arrowup: 'moveUp',
  s: 'moveDown',
  arrowdown: 'moveDown',
  a: 'moveLeft',
  arrowleft: 'moveLeft',
  d: 'moveRight',
  arrowright: 'moveRight',
});

export type InputCommandTarget = {
  dispatch(command: EngineCommand): void;
  screenToWorld(clientX: number, clientY: number): { x: number; y: number } | null;
};

type ListenerHost = Pick<Window, 'addEventListener' | 'removeEventListener'>;

export type InputAdapterOptions = {
  window: ListenerHost;
  document: ListenerHost;
  canvas: Pick<HTMLCanvasElement, 'addEventListener' | 'removeEventListener' | 'setPointerCapture' | 'releasePointerCapture' | 'hasPointerCapture'>;
  target: InputCommandTarget;
  /** Gamepad Start was pressed (a UI navigation event, not a simulation command). */
  onPauseIntent?: () => void;
  getGamepads?: () => readonly (GamepadLike | null | undefined)[];
};

function isTextEntry(target: EventTarget | null) {
  return typeof HTMLElement !== 'undefined'
    && target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName));
}

function hasRole(target: EventTarget | null, role: string) {
  return typeof HTMLElement !== 'undefined' && target instanceof HTMLElement && target.getAttribute('role') === role;
}

function isButton(target: EventTarget | null) {
  return typeof HTMLElement !== 'undefined' && target instanceof HTMLElement && target.tagName === 'BUTTON';
}

/**
 * CON-04: a suspended run logs every input change, so the stick moves in 1/32 steps and the pointer on a 2-unit grid.
 * A held stick's jitter then sends nothing, and the log stays short. Movement only uses the direction.
 */
function snap(value: number, step: number) {
  return Math.round(value / step) * step || 0;
}

function defaultGamepads() {
  return typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function'
    ? Array.from(navigator.getGamepads())
    : [];
}

export class InputAdapter {
  private readonly options: InputAdapterOptions;
  /** Physical keys held per action, so releasing W while ArrowUp is still down keeps moving up. */
  private readonly keysByAction = new Map<EngineAction, Set<string>>();
  private pointerActive = false;
  private pointerWorld = { x: 0, y: 0 };
  private analog = { x: 0, y: 0 };
  private pauseHeld = false;
  private disposed = false;

  constructor(options: InputAdapterOptions) {
    this.options = options;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.release = this.release.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    options.window.addEventListener('keydown', this.onKeyDown as EventListener);
    options.window.addEventListener('keyup', this.onKeyUp as EventListener);
    options.window.addEventListener('blur', this.release);
    options.document.addEventListener('visibilitychange', this.release);
    options.canvas.addEventListener('pointerdown', this.onPointerDown as EventListener);
    options.canvas.addEventListener('pointermove', this.onPointerMove as EventListener);
    options.canvas.addEventListener('pointerup', this.onPointerUp as EventListener);
    options.canvas.addEventListener('pointercancel', this.onPointerUp as EventListener);
  }

  /** Reads gamepads once; call at the start of every frame (EngineCallbacks.onFrameStart). */
  poll() {
    if (this.disposed) return;
    const intent = readGamepadIntent((this.options.getGamepads ?? defaultGamepads)(), this.pauseHeld);
    this.pauseHeld = intent.pauseHeld;
    const x = snap(intent.x, 1 / 32);
    const y = snap(intent.y, 1 / 32);
    if (x !== this.analog.x || y !== this.analog.y) {
      this.analog = { x, y };
      this.options.target.dispatch({ type: 'input/analog', x, y });
    }
    if (intent.pauseJustPressed) this.options.onPauseIntent?.();
  }

  dispose() {
    if (this.disposed) return;
    this.release();
    this.disposed = true;
    const { window, document, canvas } = this.options;
    window.removeEventListener('keydown', this.onKeyDown as EventListener);
    window.removeEventListener('keyup', this.onKeyUp as EventListener);
    window.removeEventListener('blur', this.release);
    document.removeEventListener('visibilitychange', this.release);
    canvas.removeEventListener('pointerdown', this.onPointerDown as EventListener);
    canvas.removeEventListener('pointermove', this.onPointerMove as EventListener);
    canvas.removeEventListener('pointerup', this.onPointerUp as EventListener);
    canvas.removeEventListener('pointercancel', this.onPointerUp as EventListener);
  }

  private onKeyDown(event: KeyboardEvent) {
    // Only text-entry controls own the keyboard. A focused HUD button must not freeze movement (BUG-04).
    if (isTextEntry(event.target)) return;
    const key = event.key.toLowerCase();
    const arrow = key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright';
    // Roving tab lists use arrow keys to change tabs; letting them also steer the player would do both at once.
    if (arrow && hasRole(event.target, 'tab')) return;
    const action = KEYBOARD_ACTIONS[key];
    if (action) this.press(action, key);
    if (arrow || (key === ' ' && !isButton(event.target))) event.preventDefault();
  }

  private onKeyUp(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    const action = KEYBOARD_ACTIONS[key];
    if (action) this.lift(action, key);
  }

  private press(action: EngineAction, key: string) {
    const keys = this.keysByAction.get(action) ?? new Set<string>();
    const wasHeld = keys.size > 0;
    keys.add(key);
    this.keysByAction.set(action, keys);
    if (!wasHeld && !this.disposed) this.options.target.dispatch({ type: 'input/action', action, pressed: true });
  }

  private lift(action: EngineAction, key: string) {
    const keys = this.keysByAction.get(action);
    if (!keys?.delete(key) || keys.size > 0) return;
    if (!this.disposed) this.options.target.dispatch({ type: 'input/action', action, pressed: false });
  }

  /** Focus loss: forget every held key, the pointer, and stick state. */
  private release() {
    this.keysByAction.clear();
    this.pointerActive = false;
    this.analog = { x: 0, y: 0 };
    this.pauseHeld = false;
    if (!this.disposed) this.options.target.dispatch({ type: 'input/release' });
  }

  private onPointerDown(event: PointerEvent) {
    this.options.canvas.setPointerCapture(event.pointerId);
    this.pointerActive = true;
    this.sendPointer(event);
  }

  private onPointerMove(event: PointerEvent) {
    if (this.pointerActive) this.sendPointer(event);
  }

  private onPointerUp(event: PointerEvent) {
    if (this.options.canvas.hasPointerCapture(event.pointerId)) this.options.canvas.releasePointerCapture(event.pointerId);
    this.pointerActive = false;
    this.options.target.dispatch({ type: 'input/pointer', active: false, worldX: this.pointerWorld.x, worldY: this.pointerWorld.y });
  }

  private sendPointer(event: PointerEvent) {
    const world = this.options.target.screenToWorld(event.clientX, event.clientY);
    if (world) this.pointerWorld = { x: snap(world.x, 2), y: snap(world.y, 2) };
    this.options.target.dispatch({ type: 'input/pointer', active: true, worldX: this.pointerWorld.x, worldY: this.pointerWorld.y });
  }
}
