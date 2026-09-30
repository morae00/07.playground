import assert from 'node:assert/strict';
import test from 'node:test';

class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};

  createOscillator() {
    let ended;
    return {
      type: 'sine',
      frequency: { value: 0 },
      connect() {},
      disconnect() {},
      start() {},
      stop() { ended?.(); },
      addEventListener(name, callback) {
        if (name === 'ended') ended = callback;
      },
    };
  }

  createGain() {
    return {
      gain: {
        value: 0,
        exponentialRampToValueAtTime() {},
      },
      connect() {},
      disconnect() {},
    };
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

globalThis.window = {
  devicePixelRatio: 1,
  addEventListener() {},
  removeEventListener() {},
};
globalThis.document = {
  addEventListener() {},
  removeEventListener() {},
};
class FakeResizeObserver {
  observe() {}
  disconnect() {}
}
globalThis.ResizeObserver = FakeResizeObserver;
window.ResizeObserver = FakeResizeObserver;
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

function createCanvas(rect = { width: 1440, height: 900, left: 0, top: 0 }) {
  const context = new Proxy({
    measureText: () => ({ width: 0 }),
  }, {
    get(target, property) {
      if (property in target) return target[property];
      return () => {};
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });

  return {
    width: 0,
    height: 0,
    getContext: () => context,
    getBoundingClientRect: () => ({ ...rect }),
    addEventListener() {},
    removeEventListener() {},
    setPointerCapture() {},
    releasePointerCapture() {},
    hasPointerCapture: () => false,
  };
}

function createEngine({ canvas = createCanvas() } = {}) {
  let latestSnapshot = null;
  const engine = new GameEngine(canvas, defaultMeta(), defaultOptions(), {
    onSnapshot(snapshot) {
      latestSnapshot = snapshot;
    },
    onDraft() {},
    onRoundClear() {},
    onGameOver() {},
  });
  return { engine, canvas, getSnapshot: () => latestSnapshot };
}

function assertFiniteNumber(value, label) {
  assert.equal(typeof value, 'number', `${label} must be a number`);
  assert.ok(Number.isFinite(value), `${label} must be finite, got ${value}`);
}

function assertFinitePoint(value, label) {
  assertFiniteNumber(value.x, `${label}.x`);
  assertFiniteNumber(value.y, `${label}.y`);
}

function assertFiniteCoordinates(engine, label) {
  assertFinitePoint(engine.player, `${label}.player`);
  assertFinitePoint(engine.camera, `${label}.camera`);

  for (const [collectionName, collection] of [
    ['enemies', engine.enemies],
    ['projectiles', engine.projectiles],
    ['bossProjectiles', engine.bossProjectiles],
    ['pickups', engine.pickups],
    ['hazards', engine.hazards],
    ['particles', engine.particles],
    ['damageNumbers', engine.damageNumbers],
  ]) {
    collection.forEach((item, index) => assertFinitePoint(item, `${label}.${collectionName}[${index}]`));
  }

  engine.obstacles.forEach((obstacle, index) => {
    assertFinitePoint(obstacle, `${label}.obstacles[${index}]`);
    assertFiniteNumber(obstacle.w, `${label}.obstacles[${index}].w`);
    assertFiniteNumber(obstacle.h, `${label}.obstacles[${index}].h`);
  });

  engine.beams.forEach((beam, index) => {
    for (const key of ['x1', 'y1', 'x2', 'y2']) {
      assertFiniteNumber(beam[key], `${label}.beams[${index}].${key}`);
    }
  });

  engine.chains.forEach((chain, chainIndex) => {
    chain.points.forEach((point, pointIndex) => {
      assertFinitePoint(point, `${label}.chains[${chainIndex}].points[${pointIndex}]`);
    });
  });
}

function assertFiniteSnapshot(snapshot, label) {
  assert.ok(snapshot, `${label} must emit a HUD snapshot`);
  const visit = (value, path) => {
    if (typeof value === 'number') {
      assertFiniteNumber(value, path);
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) visit(child, `${path}.${key}`);
  };
  visit(snapshot, label);
}

test('all 50 chapter stages start and survive a fixed simulation step with finite state', () => {
  for (let chapter = 1; chapter <= 5; chapter += 1) {
    for (let stage = 1; stage <= 10; stage += 1) {
      const label = `chapter ${chapter} stage ${stage}`;
      const { engine, getSnapshot } = createEngine();
      try {
        engine.startRun(chapter, stage, chapter * 1000 + stage);
        engine.update(1 / 60);
        engine.emitSnapshot(true);

        assert.equal(engine.chapter, chapter, `${label} chapter must be retained`);
        assert.equal(engine.stage, stage, `${label} stage must be retained`);
        assertFiniteCoordinates(engine, label);
        assertFiniteSnapshot(getSnapshot(), `${label}.snapshot`);
      } finally {
        engine.dispose();
      }
    }
  }
});

test('every chapter has its required Stage 5 mid boss and Stage 10 final boss', () => {
  for (let chapter = 1; chapter <= 5; chapter += 1) {
    for (const [stage, expectedKind, expectedRole] of [
      [5, 'midBoss', 'mid'],
      [10, 'finalBoss', 'final'],
    ]) {
      const label = `chapter ${chapter} stage ${stage}`;
      const { engine, getSnapshot } = createEngine();
      try {
        engine.startRun(chapter, stage, chapter * 10_000 + stage);
        engine.update(1 / 60);
        engine.emitSnapshot(true);

        const mainBosses = engine.enemies.filter((enemy) => enemy.isBoss && !enemy.legacyBoss);
        assert.equal(engine.kind, expectedKind, `${label} must use ${expectedKind}`);
        assert.equal(mainBosses.length, 1, `${label} must spawn exactly one main boss`);
        assert.ok(mainBosses[0].boss, `${label} boss definition must exist`);
        assert.equal(mainBosses[0].boss.chapter, chapter, `${label} boss must belong to its chapter`);
        assert.equal(mainBosses[0].boss.role, expectedRole, `${label} boss must have role ${expectedRole}`);
        assert.ok(getSnapshot()?.bossName, `${label} snapshot must expose the boss name`);
      } finally {
        engine.dispose();
      }
    }
  }
});

test('mobile canvas uses its CSS logical size, DPR backing store, and camera-scaled pointer coordinates', () => {
  const previousDpr = window.devicePixelRatio;
  window.devicePixelRatio = 2;
  const rect = { width: 320, height: 568, left: 12, top: 24 };
  const canvas = createCanvas(rect);
  const { engine } = createEngine({ canvas });

  try {
    assert.equal(engine.viewW, 320, 'logical width must match the CSS canvas width');
    assert.equal(engine.viewH, 568, 'logical height must match the CSS canvas height');
    assert.equal(canvas.width, 640, 'backing width must include DPR');
    assert.equal(canvas.height, 1136, 'backing height must include DPR');

    engine.camera = { x: 900, y: 500 };
    engine.viewW = 640;
    engine.viewH = 1136;
    engine.setPointer({
      clientX: rect.left + 160,
      clientY: rect.top + 284,
      isPrimary: true,
      pointerId: 1,
    });

    // The camera shows 900 world units vertically (BUG-09), so screen pixels divide by the camera zoom.
    const zoom = engine.viewH / 900;
    assert.ok(Math.abs(engine.pointer.x - (900 + 320 / zoom)) < 1e-9, 'pointer x scales CSS → canvas → world before adding the camera');
    assert.ok(Math.abs(engine.pointer.y - (500 + 568 / zoom)) < 1e-9, 'pointer y scales CSS → canvas → world before adding the camera');

    engine.setRuleSet('classic');
    engine.setPointer({ clientX: rect.left + 160, clientY: rect.top + 284, isPrimary: true, pointerId: 1 });
    assert.equal(engine.pointer.x, 900 + 320, 'classic rules keep the 1:1 pointer mapping');
    assert.equal(engine.pointer.y, 500 + 568, 'classic rules keep the 1:1 pointer mapping');
  } finally {
    engine.dispose();
    window.devicePixelRatio = previousDpr;
  }
});
