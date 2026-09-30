const noop = () => {};

class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};

  createOscillator() {
    return {
      frequency: { value: 0 },
      connect: noop,
      disconnect: noop,
      start: noop,
      stop: noop,
      addEventListener: noop,
    };
  }

  createGain() {
    return {
      gain: { value: 0, exponentialRampToValueAtTime: noop },
      connect: noop,
      disconnect: noop,
    };
  }

  resume() { return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}

function createContext() {
  const target = {
    measureText: () => ({ width: 0 }),
    createPattern: () => ({}),
  };
  return new Proxy(target, {
    get(object, property) {
      if (property in object) return object[property];
      return noop;
    },
    set(object, property, value) {
      object[property] = value;
      return true;
    },
  });
}

export function installHeadlessPlatform() {
  const tileContext = createContext();
  globalThis.window = { devicePixelRatio: 1, addEventListener: noop, removeEventListener: noop };
  globalThis.document = {
    visibilityState: 'visible',
    addEventListener: noop,
    removeEventListener: noop,
    createElement(tagName) {
      if (tagName !== 'canvas') throw new Error(`Unexpected element request: ${tagName}`);
      return { width: 0, height: 0, getContext: () => tileContext };
    },
  };
  globalThis.ResizeObserver = class FakeResizeObserver { observe() {} disconnect() {} };
  globalThis.HTMLElement = class HTMLElement {};
  globalThis.AudioContext = FakeAudioContext;
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = noop;
}

const MOVE_ACTIONS = Object.freeze(['moveUp', 'moveDown', 'moveLeft', 'moveRight']);
export const KEY_DIRECTIONS = Object.freeze({ w: 'moveUp', s: 'moveDown', a: 'moveLeft', d: 'moveRight' });

/** Holds exactly one movement direction ('w' | 'a' | 's' | 'd') through engine commands, releasing the others. */
export function holdDirection(engine, key) {
  const held = KEY_DIRECTIONS[key];
  if (!held) throw new RangeError(`Unknown direction key ${key}`);
  for (const action of MOVE_ACTIONS) engine.dispatch({ type: 'input/action', action, pressed: action === held });
}

export function createHeadlessCanvas(width = 1280, height = 720) {
  const context = createContext();
  return {
    width: 0,
    height: 0,
    getContext: () => context,
    getBoundingClientRect: () => ({ width, height, left: 0, top: 0 }),
    addEventListener: noop,
    removeEventListener: noop,
    setPointerCapture: noop,
    releasePointerCapture: noop,
    hasPointerCapture: () => false,
  };
}

export function maxMeta() {
  return {
    gold: 0,
    xp: 0,
    level: 1,
    passivePoints: 0,
    progress: { chapter: 5, stage: 10 },
    upgrades: { attack: 30, defense: 25, maxHp: 30, moveSpeed: 20, crit: 20, regen: 20, magnet: 25 },
    passives: { rareLuck: 5, bossHunter: 5, coinMagnet: 5 },
  };
}

export function standardOptions() {
  return {
    healthBars: 'elite',
    volume: 0,
    effects: 0.6,
    damageNumbers: false,
    screenShake: false,
    reducedFlash: true,
    paceMode: 'standard',
  };
}
