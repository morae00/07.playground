import assert from 'node:assert/strict';
import test from 'node:test';

class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};

  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 0 },
      connect() {},
      disconnect() {},
      start() {},
      stop() {},
      addEventListener() {},
    };
  }

  createGain() {
    return {
      gain: { value: 0, exponentialRampToValueAtTime() {} },
      connect() {},
      disconnect() {},
    };
  }

  resume() { return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}

function createCountingContext() {
  let commandCount = 0;
  const translations = [];
  const counts = new Map();
  const record = (name, args = []) => {
    commandCount += 1;
    counts.set(name, (counts.get(name) ?? 0) + 1);
    if (name === 'translate') translations.push([...args]);
  };
  const target = {
    measureText: () => ({ width: 0 }),
    createPattern() {
      record('createPattern');
      return {};
    },
  };
  const context = new Proxy(target, {
    get(object, property) {
      if (property in object) return object[property];
      return (...args) => record(String(property), args);
    },
    set(object, property, value) {
      object[property] = value;
      return true;
    },
  });
  return {
    context,
    get commandCount() { return commandCount; },
    get translations() { return translations; },
    count(name) { return counts.get(name) ?? 0; },
    reset() {
      commandCount = 0;
      translations.length = 0;
      counts.clear();
    },
  };
}

function createTileCanvas() {
  const recorder = createCountingContext();
  return { width: 0, height: 0, getContext: () => recorder.context };
}

globalThis.window = {
  devicePixelRatio: 1,
  addEventListener() {},
  removeEventListener() {},
};
globalThis.document = {
  addEventListener() {},
  removeEventListener() {},
  createElement(tagName) {
    if (tagName !== 'canvas') throw new Error(`Unexpected element request: ${tagName}`);
    return createTileCanvas();
  },
};
globalThis.ResizeObserver = class FakeResizeObserver {
  observe() {}
  disconnect() {}
};
globalThis.HTMLElement = class HTMLElement {};
globalThis.AudioContext = FakeAudioContext;
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });

const { GameEngine } = await import('/tmp/blackline-survivor-p0/App.mjs');

const defaultMeta = () => ({
  gold: 120,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 1, stage: 1 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});

const defaultOptions = () => ({
  healthBars: 'elite',
  volume: 0,
  effects: 0.9,
  damageNumbers: true,
  screenShake: false,
  reducedFlash: false,
  paceMode: 'standard',
});

function createCanvas(rect = { width: 800, height: 600, left: 0, top: 0 }) {
  const recorder = createCountingContext();
  let currentRect = { ...rect };
  return {
    recorder,
    canvas: {
      width: 0,
      height: 0,
      getContext: () => recorder.context,
      getBoundingClientRect: () => ({ ...currentRect }),
      addEventListener() {},
      removeEventListener() {},
      setPointerCapture() {},
      releasePointerCapture() {},
      hasPointerCapture: () => false,
    },
    setRect(next) { currentRect = { ...next }; },
  };
}

function createEngine() {
  const canvasFixture = createCanvas();
  const engine = new GameEngine(canvasFixture.canvas, defaultMeta(), defaultOptions(), {
    onSnapshot() {},
    onDraft() {},
    onRoundClear() {},
    onGameOver() {},
  });
  engine.startRun(1, 1, 2001);
  return { engine, ...canvasFixture };
}

function enemyAt(id, x, y) {
  return {
    id,
    x,
    y,
    prevX: x,
    prevY: y,
    vx: 0,
    vy: 0,
    radius: 12,
    hp: 20,
    maxHp: 20,
    speed: 0,
    damage: 0,
    xp: 0,
    coin: 0,
    tier: 'small',
    variant: 0,
    isBoss: false,
    contactTimer: 0,
    hitFlash: 0,
    stun: 0,
    root: 0,
    slowMultiplier: 1,
    slowTimer: 0,
    patternTimer: 0,
    patternPhase: 'idle',
    patternX: 0,
    patternY: 0,
    damageCooldowns: {},
  };
}

function pickupAt(id, x, y) {
  return { id, x, y, prevX: x, prevY: y, vx: 0, vy: 0, radius: 6, kind: 'coin', value: 1, life: 45, maxLife: 45 };
}

function particleAt(id, x, y) {
  return { id, x, y, vx: 0, vy: 0, life: 1, maxLife: 1, size: 4, color: '#000000' };
}

test('viewport culling makes offscreen entities draw-neutral while onscreen objects add commands', () => {
  const { engine, recorder } = createEngine();
  try {
    engine.enemies = [];
    engine.pickups = [];
    engine.particles = [];
    engine.render(1);
    recorder.reset();
    engine.render(1);
    const baseline = recorder.commandCount;

    engine.enemies = Array.from({ length: 120 }, (_, index) => enemyAt(10_000 + index, -1_000 - index, -1_000));
    engine.pickups = Array.from({ length: 120 }, (_, index) => pickupAt(20_000 + index, -1_000 - index, -1_000));
    engine.particles = Array.from({ length: 120 }, (_, index) => particleAt(30_000 + index, -1_000 - index, -1_000));
    recorder.reset();
    engine.render(1);
    const offscreenCommands = recorder.commandCount;
    assert.ok(Math.abs(offscreenCommands - baseline) <= 1, `offscreen draw delta must be negligible; baseline=${baseline}, actual=${offscreenCommands}`);

    const { x, y } = engine.player;
    engine.enemies.push(enemyAt(40_001, x + 80, y));
    engine.pickups.push(pickupAt(40_002, x + 40, y));
    engine.particles.push(particleAt(40_003, x, y + 40));
    recorder.reset();
    engine.render(1);
    assert.ok(recorder.commandCount > offscreenCommands + 10, 'onscreen objects must issue visible draw commands');
  } finally {
    engine.dispose();
  }
});

test('render alpha interpolates camera and player at 0, 0.5, and 1', () => {
  const { engine, recorder } = createEngine();
  try {
    engine.enemies = [];
    engine.pickups = [];
    engine.particles = [];
    engine.hazards = [];
    engine.obstacles = [];
    engine.beams = [];
    engine.chains = [];
    engine.projectiles = [];
    engine.bossProjectiles = [];
    engine.damageNumbers = [];
    engine.skills = {};
    engine.player = { ...engine.player, prevX: 100, prevY: 100, x: 300, y: 300 };
    engine.camera = { prevX: 20, prevY: 0, x: 80, y: 60 };

    for (const [alpha, expectedCamera, expectedPlayer] of [
      [0, [-20, 0], [100, 100]],
      [0.5, [-50, -30], [200, 200]],
      [1, [-80, -60], [300, 300]],
    ]) {
      recorder.reset();
      engine.render(alpha);
      assert.deepEqual(recorder.translations[0], expectedCamera, `camera alpha=${alpha}`);
      assert.deepEqual(recorder.translations.at(-1), expectedPlayer, `player alpha=${alpha}`);
    }
  } finally {
    engine.dispose();
  }
});

test('grid cache builds once across 100 renders and exactly once more after resize', () => {
  const { engine, setRect } = createEngine();
  try {
    for (let index = 0; index < 100; index += 1) engine.render(1);
    assert.equal(engine.gridCacheBuilds, 1);

    setRect({ width: 1024, height: 720, left: 0, top: 0 });
    engine.onResize();
    for (let index = 0; index < 100; index += 1) engine.render(1);
    assert.equal(engine.gridCacheBuilds, 2);
  } finally {
    engine.dispose();
  }
});

test('runtime diagnostics enforce pickup TTL and hard effect caps', () => {
  const { engine } = createEngine();
  try {
    engine.pickups = [];
    for (let index = 0; index < 400; index += 1) {
      engine.spawnPickup('coin', index * 100, -500, 0, 0, 5, 1);
    }
    assert.equal(engine.getDiagnostics().pickups, 240, 'pickup count must stop at the hard cap');

    for (const pickup of engine.pickups) engine.pickupPool.release(pickup);
    engine.pickups = [];
    engine.spawnPickup('coin', 0, 0, 0, 0, 5, 7);
    assert.equal(engine.pickups[0].maxLife, 45);
    for (let step = 0; step < 45 * 60; step += 1) engine.updatePickups(1 / 60);
    assert.equal(engine.getDiagnostics().pickups, 0, 'pickup must be collected no later than 45 seconds');

    for (let burst = 0; burst < 20; burst += 1) engine.burst(engine.player.x, engine.player.y, 90, '#000000', 100);
    for (let index = 0; index < 320; index += 1) engine.emitDamageNumber(engine.player.x, engine.player.y, 10, index % 3 === 0, 1);
    const diagnostics = engine.getDiagnostics();
    assert.ok(diagnostics.particles <= 520, `particles exceeded cap: ${diagnostics.particles}`);
    assert.ok(diagnostics.damageNumbers <= 160, `damage numbers exceeded cap: ${diagnostics.damageNumbers}`);
  } finally {
    engine.dispose();
  }
});
