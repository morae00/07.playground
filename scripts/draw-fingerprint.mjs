// Draw-call fingerprint (TEC-06): records every Canvas 2D call and style assignment in scripted, seeded runs
// and hashes the stream. A renderer refactor that changes no pixels yields identical hashes, so it is the
// regression check for render work until committed goldens exist.
// Usage:
//   npm run build:test-bundles && node scripts/draw-fingerprint.mjs [bundle.mjs] > before.json
//   node scripts/draw-fingerprint.mjs --compare before.json after.json
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { installHeadlessPlatform, maxMeta, standardOptions } from './lib/headless-engine.mjs';

if (process.argv[2] === '--compare') {
  const [before, after] = process.argv.slice(3).map((file) => JSON.parse(readFileSync(file, 'utf8')).scenarios);
  let same = true;
  for (const [name, reference] of Object.entries(before)) {
    const current = after[name];
    const equal = current?.total === reference.total;
    same &&= equal;
    const firstDiff = current ? reference.frameHashes.findIndex((hash, index) => hash !== current.frameHashes[index]) : -1;
    console.log(`${equal ? 'SAME' : 'DIFF'} ${name}${equal ? '' : ` (calls ${reference.calls} -> ${current?.calls ?? 'missing'}, first differing 150-frame chunk ${firstDiff})`}`);
  }
  process.exit(same ? 0 : 1);
}

const [bundlePath = '/tmp/blackline-survivor-p0/testing.mjs', label = 'run'] = process.argv.slice(2);
installHeadlessPlatform();
globalThis.performance ??= { now: () => 0 };
const mod = await import(bundlePath);
const Engine = mod.ProbedGameEngine ?? mod.GameEngine;

const fmt = (value) => typeof value === 'number' ? (Number.isFinite(value) ? Math.round(value * 1000) / 1000 : String(value)) : typeof value === 'string' ? value : typeof value;
function recordingCanvas(width, height, sink) {
  const target = {};
  const context = new Proxy(target, {
    get(object, property) {
      if (property === 'measureText') return (text) => ({ width: String(text).length * 7 });
      if (property === 'createPattern') return () => ({ setTransform() {} });
      if (property === 'createLinearGradient' || property === 'createRadialGradient') return () => ({ addColorStop(offset, color) { sink.push(`grad.stop ${fmt(offset)} ${color}`); } });
      if (property === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
      if (property in object) return object[property];
      return (...args) => { sink.push(`${String(property)}(${args.map(fmt).join(',')})`); };
    },
    set(object, property, value) {
      object[property] = value;
      sink.push(`${String(property)}=${fmt(value)}`);
      return true;
    },
  });
  return {
    width: 0, height: 0,
    getContext: () => context,
    getBoundingClientRect: () => ({ width, height, left: 0, top: 0 }),
    addEventListener() {}, removeEventListener() {},
    setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => false,
  };
}
const fresh = () => ({ ...maxMeta(), upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 }, passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 } });
function move(engine, key) {
  if (typeof engine.dispatch === 'function') {
    const held = { w: 'moveUp', s: 'moveDown', a: 'moveLeft', d: 'moveRight' }[key];
    for (const action of ['moveUp', 'moveDown', 'moveLeft', 'moveRight']) engine.dispatch({ type: 'input/action', action, pressed: action === held });
  } else {
    engine.keys.clear();
    engine.keys.add(key);
  }
}
function run({ chapter, stage, seed, frames, meta, options = {}, rules = 'remaster', infinite = false, viewport = [1440, 900] }) {
  const sink = [];
  let pending = null;
  const engine = new Engine(recordingCanvas(viewport[0], viewport[1], sink), meta, { ...standardOptions(), effects: 0.9, damageNumbers: true, screenShake: true, reducedFlash: false, ...options }, {
    onSnapshot() {}, onDraft(draft) { pending = draft; }, onRoundClear() {}, onGameOver() {},
  });
  engine.setRuleSet?.(rules);
  if (infinite) engine.startInfiniteRun(seed, true); else engine.startRun(chapter, stage, seed);
  const hashes = [];
  const directions = ['d', 's', 'a', 'w'];
  const all = createHash('sha256');
  let calls = 0;
  for (let frame = 0; frame < frames; frame += 1) {
    if (pending) { const draft = pending; pending = null; engine.completeDraft(draft.cards[0], draft.id); }
    move(engine, directions[Math.floor(frame / 150) % directions.length]);
    sink.length = 0;
    engine.advanceFrame(1 / 60, true);
    calls += sink.length;
    const chunk = sink.join('\n');
    all.update(chunk);
    if ((frame + 1) % 150 === 0) hashes.push(createHash('sha256').update(chunk).digest('hex').slice(0, 10));
  }
  engine.dispose();
  return { total: all.digest('hex').slice(0, 16), calls, frameHashes: hashes };
}
const scenarios = {
  'c1s1-fresh': { chapter: 1, stage: 1, seed: 17, frames: 900, meta: fresh() },
  'c1s5-boss': { chapter: 1, stage: 5, seed: 505, frames: 900, meta: fresh() },
  'c3s10-max': { chapter: 3, stage: 10, seed: 3310, frames: 900, meta: maxMeta() },
  'c5s1-max-reduced': { chapter: 5, stage: 1, seed: 5501, frames: 600, meta: maxMeta(), options: { reducedFlash: true, screenShake: false } },
  'infinite-max': { infinite: true, seed: 777, frames: 600, meta: maxMeta() },
  'c2s4-classic': { chapter: 2, stage: 4, seed: 2404, frames: 600, meta: maxMeta(), rules: 'classic' },
  'c1s1-1024': { chapter: 1, stage: 1, seed: 17, frames: 300, meta: fresh(), viewport: [1024, 720] },
};
const out = {};
for (const [name, scenario] of Object.entries(scenarios)) out[name] = run(scenario);
console.log(JSON.stringify({ label, scenarios: out }, null, 1));
