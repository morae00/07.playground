import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Run suspension (CON-04): a run is saved as its seed, the meta and options it started with, and every command that
// changed the simulation at the tick it took effect, as [tick, code, ...values]. Replaying that in a new engine must
// land on the same state.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
// The animation loop runs only when a test calls the frame it asked for (the fault path, TEC-14).
let nextFrame = () => {};
globalThis.requestAnimationFrame = (callback) => {
  nextFrame = callback;
  return 1;
};
const { ProbedGameEngine, suspendedRunReward } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const OPTIONS = { ...standardOptions(), assistDamage: 1, assistEnemySpeed: 1, assistSlowGame: false };

function newEngine(meta = maxMeta()) {
  const drafts = [];
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta, OPTIONS, {
    onSnapshot() {},
    onDraft(draft) { drafts.push(draft); },
    onRoundClear() {},
    onGameOver() {},
  });
  engine.setRuleSet('remaster');
  return { engine, drafts };
}

/** What a player could see of the run: positions, health, build, drops, and the clock. */
function state(engine) {
  const world = engine.probe.read();
  const round = (value) => Math.round(value * 1e6) / 1e6;
  return createHash('sha256').update(JSON.stringify({
    player: [round(world.player.x), round(world.player.y), round(world.player.hp), world.player.level, round(world.player.xp), world.player.coins, world.player.kills],
    enemies: world.enemies.map((enemy) => [enemy.id, enemy.tier, round(enemy.x), round(enemy.y), round(enemy.hp)]),
    pickups: world.pickups.map((pickup) => [pickup.kind, round(pickup.x), round(pickup.y), pickup.value]),
    hazards: world.hazards.length,
    elapsed: round(world.elapsed),
    stageKills: world.stageKills,
    hud: engine.probe.hud().bonus,
  })).digest('hex');
}

/** A scripted player: uneven frames, keys, the stick, the pointer, drafts, a paused purchase, and an assist. */
function play(engine, drafts, frames, seed) {
  let roll = seed >>> 0;
  const random = () => {
    roll = (Math.imul(roll, 1_664_525) + 1_013_904_223) >>> 0;
    return roll / 0x1_0000_0000;
  };
  const actions = ['moveUp', 'moveDown', 'moveLeft', 'moveRight'];
  let bought = false;
  for (let frame = 0; frame < frames; frame += 1) {
    const draft = drafts.at(-1);
    if (draft && engine.probe.read().paused) {
      engine.completeDraft(draft.cards[Math.floor(random() * draft.cards.length)], draft.id);
      drafts.length = 0;
    }
    const pick = random();
    if (pick < 0.08) engine.dispatch({ type: 'input/action', action: actions[Math.floor(random() * 4)], pressed: random() < 0.6 });
    else if (pick < 0.1) engine.dispatch({ type: 'input/analog', x: random() * 2 - 1, y: random() * 2 - 1 });
    else if (pick < 0.11) engine.dispatch({ type: 'input/analog', x: 0, y: 0 });
    else if (pick < 0.12) engine.dispatch({ type: 'input/pointer', active: random() < 0.5, worldX: 1500 + random() * 1200, worldY: 1000 + random() * 900 });
    else if (pick < 0.125) engine.dispatch({ type: 'input/release' });
    // A purchase in the pause hub once the coins allow, never over an open draft.
    if (!bought && frame >= 1200 && frame % 50 === 0 && !engine.probe.read().paused) {
      engine.pause();
      bought = engine.buyRunUpgrade('magnet');
      engine.resume();
    }
    if (frame === 700) engine.setOptions({ ...OPTIONS, assistDamage: 0.8 });
    if (frame === 900) engine.setTimeScale(2);
    engine.advanceFrame(random() < 0.2 ? 1 / 30 : 1 / 60, false);
  }
}

test('CON-04: a suspended run, saved as JSON and replayed in a new engine, lands on exactly the same state', async () => {
  const original = newEngine();
  original.engine.startRun(2, 4, 90210);
  play(original.engine, original.drafts, 2400, 7);
  const saved = JSON.parse(JSON.stringify(original.engine.suspendState()));
  assert.ok(saved && saved.ticks > 1000 && saved.log.length > 50, `a real log (${saved?.log.length} commands over ${saved?.ticks} ticks)`);
  assert.ok(saved.log.some(([, code]) => code === 'd'), 'with drafts');
  assert.ok(saved.log.some(([, code, id, paused]) => code === 'b' && id === 'magnet' && paused === true), 'and a paused purchase');
  assert.ok(saved.log.some(([, code]) => code === 'x'), 'and an assist change');

  const resumed = newEngine();
  await resumed.engine.resumeRun(saved, 700);
  assert.equal(state(resumed.engine), state(original.engine), 'same state at the saved tick');
  assert.equal(resumed.engine.probe.read().paused, true, 'and it comes back paused');

  // Both go on with the same play and stay together; the resumed log carries on from the saved one. The time scale is
  // a view setting, not part of the run, so a resumed run starts at 1x; the original is set back to match.
  for (const { engine } of [original, resumed]) {
    engine.setTimeScale(1);
    engine.pause();
    engine.resume();
  }
  play(original.engine, original.drafts, 600, 99);
  play(resumed.engine, resumed.drafts, 600, 99);
  assert.equal(state(resumed.engine), state(original.engine), 'and stay the same after');
  assert.deepEqual(resumed.engine.suspendState().log, original.engine.suspendState().log);
  original.engine.dispose();
  resumed.engine.dispose();
});

test('BUG-23: meta the app hands over mid-run waits for the next run, so the run and its resume stay the same', async () => {
  const startMeta = { ...maxMeta(), upgrades: { ...maxMeta().upgrades, attack: 0, maxHp: 0 }, passives: { ...maxMeta().passives, rareLuck: 0 } };
  // The menu bought upgrades while the run was suspended; the app hands every meta change to the engine at once.
  const boughtMeta = { ...startMeta, level: 16, upgrades: { ...startMeta.upgrades, attack: 30, maxHp: 30 }, passives: { ...startMeta.passives, rareLuck: 5 } };
  const original = newEngine(startMeta);
  original.engine.startRun(1, 3, 4711);
  play(original.engine, original.drafts, 600, 11);
  const stats = { ...original.engine.probe.read().player.stats };
  original.engine.setMeta(boughtMeta);
  assert.deepEqual(original.engine.probe.read().player.stats, stats, 'the run keeps the meta it started with');
  play(original.engine, original.drafts, 900, 12);
  const saved = JSON.parse(JSON.stringify(original.engine.suspendState()));
  assert.deepEqual(saved.meta, startMeta);

  // The app builds the new engine with the account's meta as it is now; the run's own replaces it.
  const resumed = newEngine(boughtMeta);
  await resumed.engine.resumeRun(saved, 400);
  assert.equal(state(resumed.engine), state(original.engine), 'same state at the saved tick');
  resumed.engine.setMeta(boughtMeta);
  for (const { engine } of [original, resumed]) {
    engine.setTimeScale(1);
    engine.pause();
    engine.resume();
  }
  play(original.engine, original.drafts, 300, 13);
  play(resumed.engine, resumed.drafts, 300, 13);
  assert.equal(state(resumed.engine), state(original.engine), 'and stay the same after');

  // The next run starts with it.
  original.engine.startRun(1, 3, 4711);
  assert.ok(original.engine.probe.read().player.stats.attack > stats.attack, 'the next run takes the new meta');
  original.engine.dispose();
  resumed.engine.dispose();
});

test('BUG-23: input, pauses, purchases, options, and saves while a run replays change nothing; the options apply after', async () => {
  const original = newEngine();
  original.engine.startRun(2, 4, 31337);
  play(original.engine, original.drafts, 1500, 21);
  const saved = JSON.parse(JSON.stringify(original.engine.suspendState()));

  const resumed = newEngine();
  const replay = resumed.engine.resumeRun(saved, 50);
  let done = false;
  void replay.finally(() => {
    done = true;
  });
  // Meanwhile the app goes on: the input adapter sends keys, the stick, the pointer, and focus loss; focus loss pauses;
  // the pause hub buys; the settings effect sets options; and the 10 s autosave asks for the run.
  let calls = 0;
  const autosaves = [];
  const meanwhile = () => {
    if (done) return;
    const { engine } = resumed;
    engine.dispatch({ type: 'input/action', action: 'moveDown', pressed: calls % 2 === 0 });
    engine.dispatch({ type: 'input/analog', x: 0.5, y: -0.25 });
    engine.dispatch({ type: 'input/pointer', active: true, worldX: 1800, worldY: 1200 + calls });
    engine.dispatch({ type: 'input/release' });
    engine.pause();
    engine.resume();
    engine.buyRunUpgrade('magnet');
    engine.setOptions({ ...OPTIONS, assistDamage: 0.7 });
    autosaves.push(engine.suspendState());
    calls += 1;
    setTimeout(meanwhile, 0);
  };
  setTimeout(meanwhile, 0);
  await replay;
  assert.ok(calls >= 3, `calls arrived while the run replayed (${calls})`);
  assert.ok(autosaves.every((run) => run === null), 'an autosave meanwhile keeps nothing');
  assert.equal(state(resumed.engine), state(original.engine), 'same state at the saved tick');
  assert.equal(resumed.engine.probe.read().paused, true, 'and it comes back paused');
  const log = resumed.engine.suspendState().log;
  assert.deepEqual(log.slice(0, saved.log.length), saved.log, 'the replay logged the saved commands only');
  assert.deepEqual(log.slice(saved.log.length), [[saved.ticks, 'x', 0.7, 1]], 'the options set meanwhile take effect at the saved tick');
  original.engine.dispose();
  resumed.engine.dispose();
});

test('BUG-23: a fault lets go of the input through the log, so the resumed run lets go at the same tick', async () => {
  const original = newEngine();
  original.engine.startRun(1, 3, 31337);
  original.engine.dispatch({ type: 'input/action', action: 'moveRight', pressed: true });
  for (let frame = 0; frame < 60; frame += 1) original.engine.advanceFrame(1 / 60, false);
  // A step of the animation loop throws (TEC-14): the run pauses and lets go of every held input.
  let armed = true;
  const stop = original.engine.probe.onStep(() => {
    if (!armed) return;
    armed = false;
    throw new Error('probe fault');
  });
  nextFrame(50);
  stop();
  assert.equal(original.engine.isFaulted, true);
  original.engine.recoverFromFault();
  original.engine.resume();
  // The key comes up while the error shows; the engine had let go of it already, so nothing more is logged.
  original.engine.dispatch({ type: 'input/action', action: 'moveRight', pressed: false });
  for (let frame = 0; frame < 120; frame += 1) original.engine.advanceFrame(1 / 60, false);
  const saved = JSON.parse(JSON.stringify(original.engine.suspendState()));
  assert.ok(saved.log.some(([, code]) => code === 'r'), 'the fault logged the release');

  const resumed = newEngine();
  await resumed.engine.resumeRun(saved);
  assert.equal(state(resumed.engine), state(original.engine), 'same state at the saved tick');
  original.engine.dispose();
  resumed.engine.dispose();
});

test('CON-04: a resumed infinite run is practice, and a finished or cheated run cannot be suspended', async () => {
  const original = newEngine();
  original.engine.startInfiniteRun(4242, true);
  play(original.engine, original.drafts, 300, 3);
  const saved = original.engine.suspendState();
  assert.equal(saved.mode, 'infinite');
  const resumed = newEngine();
  await resumed.engine.resumeRun(saved);
  assert.equal(resumed.engine.probe.hud().scoreEligible, false);
  original.engine.dispose();
  resumed.engine.dispose();

  const ended = newEngine();
  ended.engine.startRun(1, 2, 1);
  ended.engine.probe.setClock({ timeLeft: 0.02 });
  ended.engine.probe.setGodMode();
  ended.engine.probe.step(5);
  assert.equal(ended.engine.suspendState(), null, 'a cleared stage has nothing to resume');
  ended.engine.dispose();
});

test('CON-04: a step keeps only the last pointer and stick position, and a run past the log limit is not kept', () => {
  const { engine } = newEngine();
  engine.startRun(1, 2, 5);
  engine.dispatch({ type: 'input/pointer', active: true, worldX: 1500.25, worldY: 1000 });
  engine.dispatch({ type: 'input/pointer', active: true, worldX: 1510.5, worldY: 1004 });
  engine.dispatch({ type: 'input/analog', x: 0.25, y: -0.5 });
  engine.dispatch({ type: 'input/analog', x: 0.25, y: -0.5 });
  engine.probe.step(1);
  engine.dispatch({ type: 'input/pointer', active: false, worldX: 1510.5, worldY: 1004 });
  assert.deepEqual(engine.suspendState().log, [[0, 'p', true, 1510.5, 1004], [0, 's', 0.25, -0.5], [1, 'p', false, 1510.5, 1004]]);
  // A run whose log outgrows a 10-minute boss stage is not saved; the last save that fit stays.
  for (let index = 0; index < 36_000; index += 1) engine.dispatch({ type: 'input/action', action: 'moveUp', pressed: index % 2 === 0 });
  assert.equal(engine.suspendState(), null);
  engine.dispose();
});

test('CON-04: a run the next build cannot replay is paid like a defeat', () => {
  const reward = suspendedRunReward({ mode: 'campaign', chapter: 2, stage: 4, kills: 300, coinsEarned: 200 });
  assert.deepEqual(reward, { gold: Math.floor(16 + 300 * 0.9 + 200 * 0.28 + 2 * 18 + 4 * 8), xp: Math.floor(70 + 300 * 1.1 + 2 * 24) });
});
