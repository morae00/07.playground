import assert from 'node:assert/strict';
import test from 'node:test';
import type { EngineCommand } from '../game/engine/contracts.ts';
import { InputAdapter } from './inputAdapter.ts';
import { DEFAULT_MOVE_KEYS, bindMoveKey, type MoveKeys } from '../platform/moveKeys.ts';

class FakeElement {
  tagName: string;
  isContentEditable = false;
  private readonly attributes: Record<string, string>;
  constructor(tagName: string, attributes: Record<string, string> = {}) {
    this.tagName = tagName;
    this.attributes = attributes;
  }
  getAttribute(name: string) {
    return this.attributes[name] ?? null;
  }
}
(globalThis as { HTMLElement?: unknown }).HTMLElement = FakeElement;

type Listener = (event: never) => void;
function host() {
  const listeners = new Map<string, Set<Listener>>();
  return {
    listeners,
    addEventListener(type: string, listener: Listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener(type: string, listener: Listener) {
      listeners.get(type)?.delete(listener);
    },
    fire(type: string, event: object = {}) {
      for (const listener of listeners.get(type) ?? []) listener(event as never);
    },
  };
}

function setup(moveKeys?: () => MoveKeys) {
  const commands: EngineCommand[] = [];
  const windowHost = host();
  const documentHost = host();
  const captured = new Set<number>();
  const canvas = {
    ...host(),
    setPointerCapture: (id: number) => { captured.add(id); },
    releasePointerCapture: (id: number) => { captured.delete(id); },
    hasPointerCapture: (id: number) => captured.has(id),
  };
  let pads: Array<{ connected: boolean; axes: number[]; buttons: Array<{ pressed: boolean }> } | null> = [null];
  let pauses = 0;
  const adapter = new InputAdapter({
    window: windowHost as never,
    document: documentHost as never,
    canvas: canvas as never,
    target: {
      dispatch: (command) => { commands.push(command); },
      screenToWorld: (x, y) => ({ x: x * 2, y: y * 2 }),
    },
    onPauseIntent: () => { pauses += 1; },
    getGamepads: () => pads,
    moveKeys,
  });
  const key = (type: 'keydown' | 'keyup', keyName: string, target: object = new FakeElement('DIV')) => {
    let prevented = false;
    windowHost.fire(type, { key: keyName, target, preventDefault: () => { prevented = true; } });
    return prevented;
  };
  /** A real keyboard event: the physical key's code, and the character the layout or input source gives it. */
  const physical = (type: 'keydown' | 'keyup', code: string, keyName = '') => {
    windowHost.fire(type, { key: keyName, code, target: new FakeElement('DIV'), preventDefault: () => {} });
  };
  return {
    adapter,
    commands,
    physical,
    windowHost,
    documentHost,
    canvas,
    key,
    setPads: (next: typeof pads) => { pads = next; },
    pauses: () => pauses,
  };
}

test('keyboard keys become move actions, with overlapping keys held until the last one lifts', () => {
  const input = setup();
  input.key('keydown', 'w');
  input.key('keydown', 'ArrowUp');
  input.key('keydown', 'w');
  assert.deepEqual(input.commands, [{ type: 'input/action', action: 'moveUp', pressed: true }], 'one press, no repeats');
  input.key('keyup', 'w');
  assert.equal(input.commands.length, 1, 'ArrowUp still holds moveUp');
  input.key('keyup', 'ArrowUp');
  assert.deepEqual(input.commands.at(-1), { type: 'input/action', action: 'moveUp', pressed: false });
  input.key('keydown', 'x');
  assert.equal(input.commands.length, 2, 'unmapped keys send nothing');
  input.adapter.dispose();
});

test('UI-08: the physical key decides, so WASD moves whatever the layout or input source types', () => {
  const input = setup();
  input.physical('keydown', 'KeyW', 'ㅈ');
  input.physical('keydown', 'ArrowUp', 'ArrowUp');
  input.physical('keyup', 'KeyW', 'ㅈ');
  assert.deepEqual(input.commands, [{ type: 'input/action', action: 'moveUp', pressed: true }], 'held by the arrow');
  input.physical('keyup', 'ArrowUp', 'ArrowUp');
  assert.deepEqual(input.commands.at(-1), { type: 'input/action', action: 'moveUp', pressed: false });
  input.physical('keydown', 'KeyQ', 'w');
  assert.equal(input.commands.length, 2, 'a key that only types "w" on another layout does not move');
  input.adapter.dispose();
});

test('UI-08: chosen movement keys move, the old ones stop, the arrows stay, and a change applies at once', () => {
  let keys: MoveKeys = DEFAULT_MOVE_KEYS;
  const input = setup(() => keys);
  keys = ['KeyI', 'KeyJ', 'KeyK', 'KeyL'].reduce((acc, code, index) => bindMoveKey(acc, (['moveUp', 'moveLeft', 'moveDown', 'moveRight'] as const)[index], code), keys);
  input.physical('keydown', 'KeyW', 'w');
  assert.equal(input.commands.length, 0, 'W no longer moves');
  input.physical('keydown', 'KeyI', 'i');
  input.physical('keydown', 'ArrowLeft', 'ArrowLeft');
  assert.deepEqual(input.commands, [
    { type: 'input/action', action: 'moveUp', pressed: true },
    { type: 'input/action', action: 'moveLeft', pressed: true },
  ]);
  input.adapter.dispose();
});

test('text fields keep the keyboard, tabs keep arrows, and buttons keep Space (BUG-04)', () => {
  const input = setup();
  const field = new FakeElement('INPUT');
  assert.equal(input.key('keydown', 'd', field), false);
  const tab = new FakeElement('BUTTON', { role: 'tab' });
  assert.equal(input.key('keydown', 'ArrowRight', tab), false);
  assert.equal(input.commands.length, 0);
  assert.equal(input.key('keydown', ' ', new FakeElement('BUTTON')), false, 'Space still activates a focused button');
  assert.equal(input.key('keydown', ' '), true, 'Space elsewhere does not scroll the page');
  assert.equal(input.key('keydown', 'ArrowLeft'), true, 'arrow keys do not scroll the page');
  assert.deepEqual(input.commands, [{ type: 'input/action', action: 'moveLeft', pressed: true }]);
  input.adapter.dispose();
});

test('focus loss releases everything and forgets held keys', () => {
  const input = setup();
  input.key('keydown', 'd');
  input.windowHost.fire('blur');
  assert.deepEqual(input.commands.at(-1), { type: 'input/release' });
  input.key('keyup', 'd');
  assert.equal(input.commands.length, 2, 'the stale keyup sends nothing');
  input.key('keydown', 'd');
  assert.deepEqual(input.commands.at(-1), { type: 'input/action', action: 'moveRight', pressed: true });
  input.documentHost.fire('visibilitychange');
  assert.deepEqual(input.commands.at(-1), { type: 'input/release' });
  input.adapter.dispose();
});

test('pointer drags send world targets and release on pointer up', () => {
  const input = setup();
  input.canvas.fire('pointerdown', { pointerId: 3, clientX: 10, clientY: 20 });
  input.canvas.fire('pointermove', { pointerId: 3, clientX: 15, clientY: 25 });
  input.canvas.fire('pointerup', { pointerId: 3, clientX: 15, clientY: 25 });
  input.canvas.fire('pointermove', { pointerId: 3, clientX: 99, clientY: 99 });
  assert.deepEqual(input.commands, [
    { type: 'input/pointer', active: true, worldX: 20, worldY: 40 },
    { type: 'input/pointer', active: true, worldX: 30, worldY: 50 },
    { type: 'input/pointer', active: false, worldX: 30, worldY: 50 },
  ]);
  assert.equal(input.canvas.hasPointerCapture(3), false);
  input.adapter.dispose();
});

test('gamepad polling sends analog movement on change and Start as a pause intent', () => {
  const input = setup();
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false }));
  input.setPads([{ connected: true, axes: [1, 0], buttons }]);
  input.adapter.poll();
  input.adapter.poll();
  assert.deepEqual(input.commands, [{ type: 'input/analog', x: 1, y: 0 }], 'unchanged sticks send nothing');
  buttons[9] = { pressed: true };
  input.adapter.poll();
  input.adapter.poll();
  assert.equal(input.pauses(), 1, 'holding Start pauses once');
  input.setPads([null]);
  input.adapter.poll();
  assert.deepEqual(input.commands.at(-1), { type: 'input/analog', x: 0, y: 0 });
  input.adapter.dispose();
});

test('CON-04: the stick moves in 1/32 steps and the pointer on a 2-unit grid, so a held stick that jitters sends nothing', () => {
  const input = setup();
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false }));
  for (const axes of [[0.6, -0.4], [0.6005, -0.4003], [0.5995, -0.3998]]) {
    input.setPads([{ connected: true, axes, buttons }]);
    input.adapter.poll();
  }
  assert.deepEqual(input.commands, [{ type: 'input/analog', x: 0.5, y: -0.28125 }]);
  input.canvas.fire('pointerdown', { pointerId: 3, clientX: 10.3, clientY: 20.7 });
  assert.deepEqual(input.commands.at(-1), { type: 'input/pointer', active: true, worldX: 20, worldY: 42 });
  input.adapter.dispose();
});

test('dispose releases input and detaches every listener', () => {
  const input = setup();
  input.key('keydown', 's');
  input.adapter.dispose();
  assert.deepEqual(input.commands.at(-1), { type: 'input/release' });
  const count = input.commands.length;
  input.key('keydown', 'a');
  input.canvas.fire('pointerdown', { pointerId: 1, clientX: 0, clientY: 0 });
  input.adapter.poll();
  assert.equal(input.commands.length, count);
  for (const listeners of [input.windowHost.listeners, input.documentHost.listeners, input.canvas.listeners]) {
    for (const set of listeners.values()) assert.equal(set.size, 0);
  }
});
