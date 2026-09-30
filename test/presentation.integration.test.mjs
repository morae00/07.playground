import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, holdDirection, installHeadlessPlatform } from '../scripts/lib/headless-engine.mjs';

// Presentation boundary (TEC-02): the simulation reports game events and exposes a read-only render world;
// particles, damage numbers, shake, and sound live in the presentation layer and never feed back.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const meta = () => ({
  gold: 120,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 1, stage: 1 },
  upgrades: { attack: 5, defense: 0, maxHp: 0, moveSpeed: 0, crit: 3, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});
const options = () => ({ healthBars: 'elite', volume: 0, effects: 0.9, damageNumbers: true, screenShake: true, reducedFlash: false, paceMode: 'standard' });

/** Plays a seeded stage with scripted input and returns the event log and sampled render worlds. */
function play({ overrides = {}, viewport = [1440, 900], ticks = 1500, sampleEvery = 150, chapter = 1, stage = 5, seed = 4242 }) {
  let pending = null;
  const engine = new ProbedGameEngine(createHeadlessCanvas(viewport[0], viewport[1]), meta(), { ...options(), ...overrides }, {
    onSnapshot() {}, onDraft(draft) { pending = draft; }, onRoundClear() {}, onGameOver() {},
  });
  const events = [];
  const worlds = [];
  try {
    engine.setRuleSet('remaster');
    engine.subscribe((event) => events.push(event));
    engine.startRun(chapter, stage, seed);
    const directions = ['d', 's', 'a', 'w'];
    for (let tick = 0; tick < ticks; tick += 1) {
      if (pending) {
        engine.dispatch({ type: 'draft/select', offerId: pending.cards[0].offerId });
        pending = null;
      }
      holdDirection(engine, directions[Math.floor(tick / 200) % directions.length]);
      engine.probe.step(1);
      if ((tick + 1) % sampleEvery === 0) {
        // The view and camera follow the window size by design; everything else must not.
        const { effects, view, camera, options: _options, ...world } = engine.probe.renderWorld(1);
        worlds.push(JSON.stringify(world));
      }
    }
    return { events: JSON.stringify(events), count: events.length, worlds };
  } finally {
    engine.dispose();
  }
}

test('the game event stream does not depend on cosmetic options or the window size', () => {
  const reference = play({});
  assert.ok(reference.count > 40, `a boss stage produces a real event stream (${reference.count} events)`);
  for (const [label, overrides, viewport] of [
    ['damage numbers off', { damageNumbers: false }, undefined],
    ['low effect density', { effects: 0.25 }, undefined],
    ['shake off, reduced flash', { screenShake: false, reducedFlash: true }, undefined],
    ['1024x720 window', {}, [1024, 720]],
  ]) {
    const run = play({ overrides, viewport });
    assert.equal(run.events, reference.events, `${label}: events`);
    assert.deepEqual(run.worlds, reference.worlds, `${label}: render worlds (gameplay part)`);
  }
});

test('the same seed and input give the same render world, effects included', () => {
  const first = play({ ticks: 900, sampleEvery: 90 });
  const second = play({ ticks: 900, sampleEvery: 90 });
  assert.deepEqual(second.worlds, first.worlds);
  const effectsOf = () => {
    const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), options(), {
      onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {},
    });
    try {
      engine.startRun(1, 5, 99);
      holdDirection(engine, 'd');
      engine.probe.step(600);
      return JSON.stringify(engine.probe.renderWorld(1).effects);
    } finally {
      engine.dispose();
    }
  };
  assert.equal(effectsOf(), effectsOf(), 'particles, numbers, rings, and shake are deterministic per seed too');
});

test('drawing a frame never changes the world it draws', () => {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), options(), {
    onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {},
  });
  try {
    engine.startRun(1, 5, 7);
    engine.probe.step(400);
    const before = JSON.stringify(engine.probe.read());
    const effectsBefore = JSON.stringify(engine.probe.effects());
    for (let frame = 0; frame < 30; frame += 1) engine.probe.render(frame / 30);
    assert.equal(JSON.stringify(engine.probe.read()), before, 'simulation state');
    assert.equal(JSON.stringify(engine.probe.effects()), effectsBefore, 'presentation state (only the jitter stream advances)');
  } finally {
    engine.dispose();
  }
});
