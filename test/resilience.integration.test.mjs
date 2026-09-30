import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Error resilience (TEC-14): a frame that throws inside the animation loop pauses the run and reports the
// error, instead of silently stopping the loop with enemies frozen mid-attack.

installHeadlessPlatform();
let clock = 0;
Object.defineProperty(globalThis, 'performance', { value: { now: () => clock }, configurable: true });
const frames = new Map();
let nextFrameId = 0;
globalThis.requestAnimationFrame = (callback) => {
  nextFrameId += 1;
  frames.set(nextFrameId, callback);
  return nextFrameId;
};
globalThis.cancelAnimationFrame = (id) => {
  frames.delete(id);
};
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

/** Runs the animation frames the engine has scheduled, one browser frame (16 ms) at a time. */
function runFrames(count) {
  for (let index = 0; index < count; index += 1) {
    const pending = [...frames.values()];
    frames.clear();
    clock += 16;
    for (const callback of pending) callback(clock);
  }
}

function launch() {
  const faults = [];
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), {
    onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {},
    onFault: (error) => faults.push(error),
  });
  engine.setRuleSet('remaster');
  frames.clear();
  engine.startRun(1, 1, 2024);
  engine.probe.haltSpawns();
  engine.probe.setGodMode();
  return { engine, faults };
}

test('an exception in a frame pauses the run, stops the loop, and reports once', () => {
  const { engine, faults } = launch();
  try {
    runFrames(10);
    const before = engine.probe.read().elapsed;
    assert.ok(before > 0.1, 'the loop runs');
    let armed = true;
    engine.probe.onStep(() => {
      if (!armed) return;
      armed = false;
      throw new Error('probe fault');
    });
    runFrames(3);
    assert.equal(faults.length, 1, 'the fault is reported once');
    assert.match(String(faults[0]), /probe fault/);
    assert.equal(engine.isFaulted, true);
    assert.equal(engine.getDiagnostics().paused, true, 'the run is paused');
    assert.equal(frames.size, 0, 'no further frame is scheduled');
    engine.resume();
    assert.equal(engine.getDiagnostics().paused, true, 'resume does nothing until the fault is cleared');

    engine.recoverFromFault();
    assert.equal(engine.isFaulted, false);
    assert.equal(frames.size, 1, 'the loop is scheduled again');
    runFrames(5);
    const pausedAt = engine.probe.read().elapsed;
    assert.equal(engine.getDiagnostics().paused, true, 'the run comes back paused');
    engine.resume();
    runFrames(10);
    assert.ok(engine.probe.read().elapsed > pausedAt + 0.1, 'the run continues after resuming');
    assert.equal(faults.length, 1);
  } finally {
    engine.dispose();
  }
});

test('a failing fault handler does not escape into the animation frame', () => {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), {
    onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {},
    onFault: () => {
      throw new Error('handler broke too');
    },
  });
  try {
    frames.clear();
    engine.startRun(1, 1, 7);
    engine.probe.onStep(() => {
      throw new Error('probe fault');
    });
    assert.doesNotThrow(() => runFrames(3));
    assert.equal(engine.isFaulted, true);
  } finally {
    engine.dispose();
  }
});

test('starting a new run clears a fault and keeps a single loop', () => {
  const { engine } = launch();
  try {
    let armed = true;
    engine.probe.onStep(() => {
      if (!armed) return;
      armed = false;
      throw new Error('probe fault');
    });
    runFrames(3);
    assert.equal(engine.isFaulted, true);
    engine.startRun(1, 2, 99);
    engine.startRun(1, 2, 99);
    assert.equal(engine.isFaulted, false);
    assert.equal(frames.size, 1, 'restarting replaces the loop instead of adding a second one');
    runFrames(3);
    assert.equal(frames.size, 1);
    assert.equal(engine.getDiagnostics().paused, false);
  } finally {
    engine.dispose();
  }
});
