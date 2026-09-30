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
  const calls = [];
  const translations = [];
  const counts = new Map();
  const record = (name, args = []) => {
    commandCount += 1;
    calls.push([name, [...args]]);
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
    get calls() { return calls; },
    get translations() { return translations; },
    count(name) { return counts.get(name) ?? 0; },
    reset() {
      commandCount = 0;
      calls.length = 0;
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

function createEngine({ options = defaultOptions(), stage = 1, seed = 2001 } = {}) {
  const canvasFixture = createCanvas();
  const engine = new ProbedGameEngine(canvasFixture.canvas, defaultMeta(), options, {
    onSnapshot() {},
    onDraft() {},
    onRoundClear() {},
    onGameOver() {},
  });
  engine.startRun(1, stage, seed);
  return { engine, probe: engine.probe, ...canvasFixture };
}

// Particles only exist as the presentation's answer to game events, so tests make them with real kills: an enemy
// spawned at each point dies on the next step and leaves its kill burst there.
function killAt(probe, points) {
  for (const [x, y] of points) probe.patchEnemy(probe.spawnEnemy({ x, y }), { hp: 0 });
  probe.step(1);
}

// Draws one frame at a fixed clock and returns the draw calls after the last translate (the player's, when no shots or
// keyline follow it), so two frames compare by pose alone wherever the player stands.
function playerPose(probe, recorder) {
  probe.setClock({ elapsed: 1.3 });
  recorder.reset();
  probe.render(1);
  return recorder.calls.slice(recorder.calls.findLastIndex(([name]) => name === 'translate') + 1);
}

test('mirror clone ownership draws both side silhouettes, one per clone shot (BUG-16)', () => {
  const { engine, probe, recorder } = createEngine();
  try {
    probe.clear('enemies');
    probe.setSkills({ needleStorm: { level: 1 } });
    recorder.reset();
    probe.render(1);
    const baseTranslations = recorder.count('translate');

    probe.setSkills({ needleStorm: { level: 1 }, mirrorClone: { level: 1 } });
    recorder.reset();
    probe.render(1);
    assert.equal(recorder.count('translate'), baseTranslations + 2, 'both clones fire, so both are drawn before awakening too');

    probe.setSkills({ needleStorm: { level: 1 }, mirrorClone: { level: 5, awakened: true } });
    recorder.reset();
    probe.render(1);
    assert.equal(recorder.count('translate'), baseTranslations + 2);
  } finally {
    engine.dispose();
  }
});

test('viewport culling makes offscreen entities draw-neutral while onscreen objects add commands', () => {
  const { engine, probe, recorder } = createEngine();
  try {
    probe.haltSpawns();
    probe.clear('enemies', 'pickups', 'effects');
    probe.render(1);
    recorder.reset();
    probe.render(1);
    const baseline = recorder.commandCount;

    // Kills far offscreen leave their bursts (and drops) there, in a row apart from the coins so nothing merges.
    killAt(probe, Array.from({ length: 10 }, (_, index) => [-1_000 - index * 60, -1_400]));
    for (let index = 0; index < 120; index += 1) {
      probe.spawnEnemy({ x: -1_000 - index, y: -1_000, speed: 0, damage: 0, attackStyle: 'contact' });
      probe.spawnPickup({ kind: 'coin', x: -1_000 - index * 60, y: -1_000, value: 1 });
    }
    const offscreen = probe.read();
    assert.equal(offscreen.enemies.length, 120, 'every offscreen enemy is in the world');
    assert.ok(offscreen.pickups.length >= 120, `offscreen pickups stay separate: ${offscreen.pickups.length}`);
    assert.ok(probe.effects().particles.length >= 120, `offscreen kills leave their bursts: ${probe.effects().particles.length}`);
    recorder.reset();
    probe.render(1);
    const offscreenCommands = recorder.commandCount;
    assert.ok(Math.abs(offscreenCommands - baseline) <= 1, `offscreen draw delta must be negligible; baseline=${baseline}, actual=${offscreenCommands}`);

    const { x, y } = probe.read().player;
    killAt(probe, [[x, y + 40]]);
    probe.spawnEnemy({ x: x + 80, y, speed: 0, damage: 0, attackStyle: 'contact' });
    probe.spawnPickup({ kind: 'coin', x: x + 40, y, value: 1 });
    recorder.reset();
    probe.render(1);
    assert.ok(recorder.commandCount > offscreenCommands + 10, 'onscreen objects must issue visible draw commands');
  } finally {
    engine.dispose();
  }
});

test('render alpha interpolates camera and player at 0, 0.5, and 1', () => {
  const { engine, probe, recorder } = createEngine();
  try {
    probe.clear('enemies', 'pickups', 'effects', 'hazards', 'obstacles', 'projectiles', 'hostileShots');
    probe.setSkills({});
    probe.setPlayer({ prevX: 100, prevY: 100, x: 300, y: 300 });
    probe.setCamera({ prevX: 20, prevY: 0, x: 80, y: 60 });

    for (const [alpha, expectedCamera, expectedPlayer] of [
      [0, [-20, 0], [100, 100]],
      [0.5, [-50, -30], [200, 200]],
      [1, [-80, -60], [300, 300]],
    ]) {
      recorder.reset();
      probe.render(alpha);
      assert.deepEqual(recorder.translations[0], expectedCamera, `camera alpha=${alpha}`);
      assert.deepEqual(recorder.translations.at(-1), expectedPlayer, `player alpha=${alpha}`);
    }
  } finally {
    engine.dispose();
  }
});

test('grid cache builds once across 100 renders and exactly once more after resize', () => {
  const { engine, probe, setRect } = createEngine();
  try {
    for (let index = 0; index < 100; index += 1) probe.render(1);
    assert.equal(engine.getDiagnostics().gridCacheBuilds, 1);

    setRect({ width: 1024, height: 720, left: 0, top: 0 });
    probe.resize();
    for (let index = 0; index < 100; index += 1) probe.render(1);
    assert.equal(engine.getDiagnostics().gridCacheBuilds, 2);
  } finally {
    engine.dispose();
  }
});

test('runtime diagnostics enforce pickup TTL and hard effect caps', () => {
  const { engine, probe } = createEngine();
  try {
    probe.haltSpawns();
    probe.setGodMode();
    probe.clear('enemies', 'pickups');
    for (let index = 0; index < 400; index += 1) {
      probe.spawnPickup({ kind: 'coin', x: index * 100, y: -500, radius: 5, value: 1 });
    }
    assert.equal(engine.getDiagnostics().pickups, 240, 'pickup count must stop at the hard cap');

    probe.clear('pickups');
    probe.spawnPickup({ kind: 'coin', x: 0, y: 0, radius: 5, value: 7 });
    assert.equal(probe.read().pickups[0].maxLife, 45);
    probe.step(45 * 60);
    assert.equal(engine.getDiagnostics().pickups, 0, 'pickup must be collected no later than 45 seconds');

    // Particles and damage numbers are presentation state now (the caps themselves are unit-tested in
    // presentation.test.ts): after every step of a fight that overruns both caps, the diagnostics stay within them.
    // The crowd never dies, so no level-up draft pauses the fight.
    const { x, y } = probe.read().player;
    probe.setSkills({
      needleStorm: { level: 5, awakened: true },
      chainSpark: { level: 5, awakened: true },
      orbitScythes: { level: 5, awakened: true },
      boneMortar: { level: 5 },
      voidMine: { level: 5 },
    });
    for (let index = 0; index < 150; index += 1) {
      const angle = (Math.PI * 2 * index) / 150;
      const reach = 70 + (index % 5) * 30;
      probe.spawnEnemy({ x: x + Math.cos(angle) * reach, y: y + Math.sin(angle) * reach, hp: 1e9, damage: 0 });
    }
    const peak = { particles: 0, damageNumbers: 0 };
    const stopWatching = probe.onStep(() => {
      const { particles, damageNumbers } = engine.getDiagnostics();
      assert.ok(particles <= 520, `particles exceeded cap: ${particles}`);
      assert.ok(damageNumbers <= 160, `damage numbers exceeded cap: ${damageNumbers}`);
      peak.particles = Math.max(peak.particles, particles);
      peak.damageNumbers = Math.max(peak.damageNumbers, damageNumbers);
    });
    probe.step(300);
    stopWatching();
    assert.equal(peak.particles, 520, 'the fight must fill the particle cap');
    assert.equal(peak.damageNumbers, 160, 'the fight must fill the damage-number cap');
  } finally {
    engine.dispose();
  }
});

test('a paused run draws a still frame: no shake, no particle drift (BUG-03)', () => {
  const { engine, probe, recorder } = createEngine({ options: { ...defaultOptions(), screenShake: true }, stage: 5, seed: 2002 });
  const particleState = () => probe.effects().particles.map((particle) => [particle.x, particle.y, particle.life]);
  try {
    const boss = probe.read().enemies.find((enemy) => enemy.isBoss);
    probe.patchEnemy(boss.id, { hp: 0 });
    engine.advanceFrame(1 / 60, false);
    assert.equal(probe.read().paused, true, 'killing the mid boss opens the reward draft');
    assert.equal(probe.effects().shake, 0, 'opening a dialog clears the screen shake');
    const particlesBefore = particleState();
    assert.ok(particlesBefore.length > 0, 'the kill burst leaves particles to freeze');
    for (let frame = 0; frame < 120; frame += 1) {
      recorder.reset();
      engine.advanceFrame(1 / 60, true);
      const { camera } = probe.read();
      assert.deepEqual(recorder.translations[0], [-camera.x, -camera.y], 'the camera never jitters while paused');
    }
    assert.deepEqual(particleState(), particlesBefore, 'particles hold still while paused');
  } finally {
    engine.dispose();
  }
});

test('bosses standing on the player trigger the top-layer player keyline (BUG-12)', () => {
  const { engine, probe, recorder } = createEngine();
  try {
    probe.clear('enemies');
    probe.render(1);
    recorder.reset();
    probe.render(1);
    const alone = recorder.count('translate');
    const { x, y } = probe.read().player;
    probe.spawnBoss('mid', { x: x + 10, y, hp: 500 });
    // The spawn burst lands where the boss entered the arena; this frame compares bodies only.
    probe.clear('effects');
    recorder.reset();
    probe.render(1);
    assert.equal(recorder.count('translate'), alone + 2, 'one translate for the boss body and one for the keyline');
  } finally {
    engine.dispose();
  }
});

test('reduced motion draws orbit blades where they hit, and the walk cycle follows real movement (BUG-15)', () => {
  const { engine, probe, recorder } = createEngine();
  try {
    engine.setSystemReducedMotion(true);
    probe.clear('enemies');
    probe.setSkills({ orbitScythes: { level: 1 } });
    probe.setClock({ elapsed: 1.3 });
    recorder.reset();
    probe.render(1);
    const { elapsed, player } = probe.read();
    const blades = 2;
    const expected = Array.from({ length: blades }, (_, index) => {
      const angle = elapsed * 3.2 + (Math.PI * 2 * index) / blades;
      return [player.x + Math.cos(angle) * 82, player.y + Math.sin(angle) * 82];
    });
    for (const [x, y] of expected) {
      assert.ok(recorder.translations.some(([tx, ty]) => Math.abs(tx - x) < 1e-6 && Math.abs(ty - y) < 1e-6), `blade drawn at simulated position ${x},${y}`);
    }

    // Reduced motion never animates the walk, so the walk cycle is read from full-motion poses.
    engine.setSystemReducedMotion(false);
    const standing = playerPose(probe, recorder);
    probe.setPlayer({ root: 5 });
    engine.dispatch({ type: 'input/action', action: 'moveRight', pressed: true });
    probe.step(1);
    assert.deepEqual(playerPose(probe, recorder), standing, 'a rooted player holding a key does not walk');
    probe.setPlayer({ root: 0 });
    probe.step(1);
    assert.notDeepEqual(playerPose(probe, recorder), standing, 'moving once free');
  } finally {
    engine.dispose();
  }
});
