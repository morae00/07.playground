import { performance } from 'node:perf_hooks';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_FRAME_COUNT = 54_000;
const FRAME_COUNT = Number.parseInt(process.env.P2_SOAK_FRAMES ?? `${DEFAULT_FRAME_COUNT}`, 10);
const WARMUP_FRAME_COUNT = Math.min(600, Math.max(60, Math.floor(FRAME_COUNT * 0.1)));
const FIXED_STEPS = FRAME_COUNT * 2;
const FRAME_DELTA = 1 / 60;
const SKILL_IDS = [
  'needleStorm', 'fanKnives', 'chainSpark', 'frostLine', 'orbitScythes',
  'boneMortar', 'railSpear', 'mirrorClone', 'voidMine', 'blackSun',
  'ironFrame', 'magnetSigil', 'paperWard', 'recoveryThread', 'coinFever',
  'eclipseStep', 'executionMark',
];

if (!Number.isInteger(FRAME_COUNT) || FRAME_COUNT <= 0) {
  throw new RangeError(`P2_SOAK_FRAMES must be a positive integer; received ${process.env.P2_SOAK_FRAMES}`);
}
if (typeof globalThis.gc !== 'function') {
  throw new Error('P2 soak requires Node --expose-gc so retained heap can be measured reliably');
}

class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  createOscillator() { return { frequency: { value: 0 }, connect() {}, disconnect() {}, start() {}, stop() {}, addEventListener() {} }; }
  createGain() { return { gain: { value: 0, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  resume() { return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}

const noop = () => {};
const tileContext = new Proxy({}, { get: () => noop, set: (target, property, value) => { target[property] = value; return true; } });
globalThis.window = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
globalThis.document = {
  addEventListener() {},
  removeEventListener() {},
  createElement(tagName) {
    if (tagName !== 'canvas') throw new Error(`Unexpected element request: ${tagName}`);
    return { width: 0, height: 0, getContext: () => tileContext };
  },
};
globalThis.ResizeObserver = class FakeResizeObserver { observe() {} disconnect() {} };
globalThis.HTMLElement = class HTMLElement {};
globalThis.AudioContext = FakeAudioContext;
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};

let drawCommands = 0;
const context = new Proxy({
  measureText: () => ({ width: 0 }),
  createPattern: () => ({}),
}, {
  get(target, property) {
    if (property in target) return target[property];
    return () => { drawCommands += 1; };
  },
  set(target, property, value) {
    target[property] = value;
    return true;
  },
});
const canvas = {
  width: 0,
  height: 0,
  getContext: () => context,
  getBoundingClientRect: () => ({ width: 1440, height: 900, left: 0, top: 0 }),
  addEventListener() {},
  removeEventListener() {},
  setPointerCapture() {},
  releasePointerCapture() {},
  hasPointerCapture: () => false,
};

const bundlePath = process.env.BLACKLINE_ENGINE_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs';
const { ProbedGameEngine } = await import(bundlePath);
const meta = {
  gold: 0,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 5, stage: 10 },
  upgrades: { attack: 30, defense: 25, maxHp: 30, moveSpeed: 20, crit: 20, regen: 20, magnet: 25 },
  passives: { rareLuck: 5, bossHunter: 5, coinMagnet: 5 },
};
const options = {
  healthBars: 'all',
  volume: 0,
  effects: 0.9,
  damageNumbers: true,
  screenShake: true,
  reducedFlash: false,
  paceMode: 'standard',
};

let engine;
engine = new ProbedGameEngine(canvas, meta, options, {
  onSnapshot() {},
  onDraft(draft) {
    const offer = draft.cards[0];
    if (!offer) throw new Error(`Draft ${draft.id} did not contain an offer`);
    engine.completeDraft(offer, draft.id);
  },
  onRoundClear() {},
  onGameOver() {},
});

function percentile(values, ratio) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor((sorted.length - 1) * ratio)];
}

function round(value, digits = 3) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

/** Silence would switch every skill off, so null zones are dropped and silence cleared before every fixed step. */
function neutralizeSilence() {
  engine.probe.removeHazards(['null']);
  engine.probe.setPlayer({ silence: 0 });
}

/**
 * Runs one 60 Hz frame as two 2x substeps (one fixed step each) and returns the engine's time for it.
 * The probe read in neutralizeSilence copies the whole world, so that harness work stays out of the frame budget.
 */
function advanceSoakFrame() {
  let engineMs = 0;
  for (let substep = 0; substep < 2; substep += 1) {
    neutralizeSilence();
    const substepStart = performance.now();
    engine.advanceFrame(FRAME_DELTA / 2, substep === 1);
    engineMs += performance.now() - substepStart;
  }
  return engineMs;
}

engine.startRun(5, 10, 0x5010_2026);
engine.setTimeScale(2);
engine.probe.setSkills(Object.fromEntries(SKILL_IDS.map((id) => [id, { level: 5, awakened: true }])));
// setSkills recalculates stats without healing; start at the new maximum as a full-heal recalculation did.
engine.probe.setPlayer({ hp: engine.probe.read().player.stats.maxHp });
for (const enemy of engine.probe.read().enemies) {
  if (enemy.isBoss && !enemy.legacyBoss) {
    engine.probe.patchEnemy(enemy.id, { hp: 1_000_000_000_000, maxHp: 1_000_000_000_000 });
  }
}
for (let frame = 0; frame < WARMUP_FRAME_COUNT; frame += 1) advanceSoakFrame();

const frameTimes = new Float64Array(FRAME_COUNT);
const highWater = {
  enemies: 0,
  projectiles: 0,
  bossProjectiles: 0,
  pickups: 0,
  particles: 0,
  damageNumbers: 0,
};
globalThis.gc();
const heapStart = process.memoryUsage().heapUsed;
const wallStart = performance.now();

for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
  frameTimes[frame] = advanceSoakFrame();

  const diagnostics = engine.getDiagnostics();
  for (const key of Object.keys(highWater)) highWater[key] = Math.max(highWater[key], diagnostics[key]);
}

const wallDurationMs = performance.now() - wallStart;
globalThis.gc();
const heapEnd = process.memoryUsage().heapUsed;
const heapDeltaMiB = (heapEnd - heapStart) / (1024 * 1024);
const rawTiming = {
  p50: percentile(frameTimes, 0.5),
  p95: percentile(frameTimes, 0.95),
  p99: percentile(frameTimes, 0.99),
};
const timing = {
  p50: round(rawTiming.p50),
  p95: round(rawTiming.p95),
  p99: round(rawTiming.p99),
};
const gates = {
  p95: rawTiming.p95 <= 20,
  p99: rawTiming.p99 <= 33,
  pickups: highWater.pickups <= 240,
  particles: highWater.particles <= 520,
  damageNumbers: highWater.damageNumbers <= 160,
  enemies: highWater.enemies <= 204,
  heap: heapDeltaMiB <= 20,
};
const result = {
  scenario: 'Ch5 St10 / 2x / max skills / max meta / auto-draft / silence-neutralized',
  renderer: 'headless no-op Canvas command proxy',
  warmupFrameCount: WARMUP_FRAME_COUNT,
  frameCount: FRAME_COUNT,
  expectedFixedSteps: FIXED_STEPS,
  wallEquivalentSeconds: round(FRAME_COUNT / 60),
  simulationSeconds: round(FIXED_STEPS / 60),
  executionMs: round(wallDurationMs, 1),
  frameMs: timing,
  highWater,
  heap: {
    startMiB: round(heapStart / (1024 * 1024), 2),
    endMiB: round(heapEnd / (1024 * 1024), 2),
    deltaMiB: round(heapDeltaMiB, 2),
  },
  drawCommands,
  gates,
};

const outputPath = path.resolve(process.env.P2_SOAK_REPORT ?? 'artifacts/soak-report.json');
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));
engine.dispose();
if (Object.values(gates).some((passed) => !passed)) process.exitCode = 1;
