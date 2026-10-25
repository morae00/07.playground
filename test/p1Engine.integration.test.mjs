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

const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

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
  const drawCalls = [];
  const context = new Proxy({
    measureText: () => ({ width: 0 }),
  }, {
    get(target, property) {
      if (property in target) return target[property];
      return (...args) => { drawCalls.push({ name: property, args }); };
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });

  return {
    width: 0,
    height: 0,
    drawCalls,
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
  const engine = new ProbedGameEngine(canvas, defaultMeta(), defaultOptions(), {
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

function assertFiniteCoordinates(engine, world, label) {
  assertFinitePoint(world.player, `${label}.player`);
  assertFinitePoint(world.camera, `${label}.camera`);

  for (const [collectionName, collection] of [
    ['enemies', world.enemies],
    ['projectiles', world.projectiles],
    ['bossProjectiles', world.bossProjectiles],
    ['pickups', world.pickups],
    ['hazards', world.hazards],
    ['particles', engine.probe.effects().particles],
    ['damageNumbers', engine.probe.effects().damageNumbers],
  ]) {
    collection.forEach((item, index) => assertFinitePoint(item, `${label}.${collectionName}[${index}]`));
  }

  world.obstacles.forEach((obstacle, index) => {
    assertFinitePoint(obstacle, `${label}.obstacles[${index}]`);
    assertFiniteNumber(obstacle.w, `${label}.obstacles[${index}].w`);
    assertFiniteNumber(obstacle.h, `${label}.obstacles[${index}].h`);
  });

  world.beams.forEach((beam, index) => {
    for (const key of ['x1', 'y1', 'x2', 'y2']) {
      assertFiniteNumber(beam[key], `${label}.beams[${index}].${key}`);
    }
  });

  world.chains.forEach((chain, chainIndex) => {
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
        engine.probe.step(1);

        const world = engine.probe.read();
        assert.equal(world.chapter, chapter, `${label} chapter must be retained`);
        assert.equal(world.stage, stage, `${label} stage must be retained`);
        assertFiniteCoordinates(engine, world, label);
        // The engine emits a HUD snapshot on start and then every 0.12 s; the post-step HUD comes from the probe.
        assertFiniteSnapshot(getSnapshot(), `${label}.snapshot`);
        assertFiniteSnapshot(engine.probe.hud(), `${label}.hud`);
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
        // The boss from the start, as before the boss warm-up (CON-02).
        engine.probe.bringBoss();
        engine.probe.step(1);

        const world = engine.probe.read();
        const mainBosses = world.enemies.filter((enemy) => enemy.isBoss && !enemy.legacyBoss);
        assert.equal(world.kind, expectedKind, `${label} must use ${expectedKind}`);
        assert.equal(mainBosses.length, 1, `${label} must spawn exactly one main boss`);
        assert.ok(mainBosses[0].boss, `${label} boss definition must exist`);
        assert.equal(mainBosses[0].boss.chapter, chapter, `${label} boss must belong to its chapter`);
        assert.equal(mainBosses[0].boss.role, expectedRole, `${label} boss must have role ${expectedRole}`);
        assert.ok(getSnapshot()?.bossName, `${label} snapshot must expose the boss name`);
        assert.ok(engine.probe.hud().bossName, `${label} HUD must still expose the boss name after the step`);
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
    // An isolated run, so only the pointer can move the player below.
    engine.startRun(1, 1, 1001);
    engine.probe.haltSpawns();
    engine.probe.clear('enemies', 'hazards', 'obstacles');
    engine.probe.setSkills({});

    // Every frame starts by clearing the whole logical viewport, so the cleared rectangle is the logical size.
    canvas.drawCalls.length = 0;
    engine.probe.render();
    const clear = canvas.drawCalls.find((call) => call.name === 'clearRect');
    assert.ok(clear, 'a rendered frame must clear the canvas');
    assert.equal(clear.args[2], 320, 'logical width must match the CSS canvas width');
    assert.equal(clear.args[3], 568, 'logical height must match the CSS canvas height');
    assert.equal(canvas.width, 640, 'backing width must include DPR');
    assert.equal(canvas.height, 1136, 'backing height must include DPR');

    // A 640×1136 logical canvas inside a 320×568 CSS box (the box shrank after the last resize), so screen
    // points must scale CSS → canvas before the camera zoom.
    Object.assign(rect, { width: 640, height: 1136 });
    engine.probe.resize();
    Object.assign(rect, { width: 320, height: 568 });
    engine.probe.setCamera({ x: 900, y: 500 });
    const pointer = engine.screenToWorld(rect.left + 160, rect.top + 284);

    // The camera shows 900 world units vertically (BUG-09) and at least 1200 across (D-28), so this portrait canvas
    // zooms to fit 1200 units across and is letterboxed above and below; screen pixels lose the bar, then divide by
    // the zoom.
    const zoom = 640 / 1200;
    const offsetY = (1136 - 900 * zoom) / 2;
    assert.ok(Math.abs(pointer.x - (900 + 320 / zoom)) < 1e-9, 'pointer x scales CSS → canvas → world before adding the camera');
    assert.ok(Math.abs(pointer.y - (500 + (568 - offsetY) / zoom)) < 1e-9, 'pointer y scales CSS → canvas, leaves the letterbox, then → world');

    // Dispatched as the input adapter does, the mapped point becomes the target the player walks toward.
    const start = { x: pointer.x + 300, y: pointer.y + 400 };
    engine.probe.setPlayer(start);
    engine.dispatch({ type: 'input/pointer', active: true, worldX: pointer.x, worldY: pointer.y });
    engine.probe.step(1);
    const { player } = engine.probe.read();
    assert.ok(Math.hypot(player.x - start.x, player.y - start.y) > 0, 'an active pointer must move the player');
    const heading = Math.atan2(player.y - start.y, player.x - start.x);
    assert.ok(Math.abs(heading - Math.atan2(pointer.y - start.y, pointer.x - start.x)) < 1e-9, 'the player must head for the dispatched world point');

    engine.probe.setCamera({ x: 900, y: 500 });
    engine.setRuleSet('classic');
    const classicPointer = engine.screenToWorld(rect.left + 160, rect.top + 284);
    assert.equal(classicPointer.x, 900 + 320, 'classic rules keep the 1:1 pointer mapping');
    assert.equal(classicPointer.y, 500 + 568, 'classic rules keep the 1:1 pointer mapping');
  } finally {
    engine.dispose();
    window.devicePixelRatio = previousDpr;
  }
});
