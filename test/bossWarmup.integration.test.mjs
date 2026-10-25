import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Boss stage warm-up (CON-02, bossWarmup rule; remaster on, classic off): a campaign boss stage first sends its crowd
// alone, at a spawn rate climbing from a share of the boss stage's, for its chapter's seconds (src/content/data/
// bossWarmup.ts). Then the boss enters and the stage clock, the enrage timer, starts. The HUD counts down to the boss.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, BOSS_WARMUP, bossWarmupRate, bossWarmupSeconds } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const freshMeta = () => ({
  gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 5, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});

function newEngine(rules = 'remaster', { meta = freshMeta(), options = standardOptions(), patch = null, drafts = null } = {}) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta, options, {
    onSnapshot() {},
    onDraft(draft) { if (drafts) drafts.push(draft); else engine.completeDraft(draft.cards[0], draft.id); },
    onRoundClear() {},
    onGameOver() {},
  });
  engine.setRuleSet(rules);
  if (patch) engine.probe.patchRules(patch);
  return engine;
}

const stageBoss = (engine) => engine.probe.read().enemies.find((enemy) => enemy.isBoss && !enemy.legacyBoss && enemy.boss?.role !== 'field');

test('CON-02: the warm-up table sets whole seconds within the decision\'s 60-90 s for every chapter it covers, and a climbing rate', () => {
  for (const kind of ['midBoss', 'finalBoss']) {
    assert.equal(BOSS_WARMUP.seconds[kind].length, 5, `${kind}: one entry per chapter`);
    for (const seconds of BOSS_WARMUP.seconds[kind]) {
      assert.ok(seconds === 0 || (Number.isInteger(seconds) && seconds >= 60 && seconds <= 90), `${kind}: ${seconds} s`);
    }
  }
  assert.ok(BOSS_WARMUP.seconds.midBoss[0] > 0 && BOSS_WARMUP.seconds.finalBoss[0] > 0, 'Ch1\'s boss stages have one');
  const { from, to } = BOSS_WARMUP.rate;
  assert.ok(from > 0 && from < to && to <= 1, `${from} to ${to}`);
  assert.equal(bossWarmupSeconds('normal', 1), 0, 'normal stages have none');
  assert.equal(bossWarmupRate(60, 60), from);
  assert.ok(Math.abs(bossWarmupRate(30, 60) - (from + to) / 2) < 1e-12);
  assert.equal(bossWarmupRate(0, 60), 1, 'over: the full rate');
});

test('CON-02: in 1-10 only the crowd comes, thinner, until the warm-up ends; then the boss enters and the enrage clock starts', () => {
  const engine = newEngine();
  const without = newEngine('remaster', { patch: { bossWarmup: false } });
  try {
    const warmup = bossWarmupSeconds('finalBoss', 1);
    engine.startRun(1, 10, 1010);
    without.startRun(1, 10, 1010);
    for (const run of [engine, without]) {
      run.probe.setGodMode();
      run.probe.setSkills({});
    }
    let world = engine.probe.read();
    assert.equal(world.kind, 'finalBoss');
    assert.equal(world.bossWarmupLeft, warmup);
    assert.equal(stageBoss(engine), undefined, 'no boss at the start');
    assert.ok(stageBoss(without), 'without the rule the boss is there from the start');
    let hud = engine.probe.hud();
    assert.equal(hud.bossArrival, warmup, 'the HUD counts down to the boss');
    assert.equal(hud.bossName, undefined, 'and shows no boss bar');
    assert.equal(hud.objectiveProgress, 0, 'the boss goal is not met by its absence');
    assert.equal(without.probe.hud().bossArrival, undefined);

    // Ten seconds in, with no weapons to thin it, the crowd is under 60% of the one without the warm-up.
    engine.probe.step(600);
    without.probe.step(600);
    const crowd = (run) => run.probe.read().enemies.filter((enemy) => !enemy.isBoss).length;
    assert.ok(crowd(engine) > 0, 'the crowd comes');
    assert.ok(crowd(engine) < crowd(without) * 0.6, `a gentle start: ${crowd(engine)} against ${crowd(without)}`);
    assert.equal(engine.probe.read().timeLeft, engine.probe.read().duration, 'the stage clock waits for the boss');

    const ticks = Math.round(warmup * 60);
    engine.probe.step(ticks - 600 - 1);
    world = engine.probe.read();
    assert.equal(stageBoss(engine), undefined, 'still no boss one step before the end');
    assert.ok(world.bossWarmupLeft > 0 && world.bossWarmupLeft < 0.05);
    assert.equal(world.timeLeft, world.duration);
    assert.equal(world.bossEnraged, false);

    engine.probe.step(1);
    world = engine.probe.read();
    const boss = stageBoss(engine);
    assert.ok(boss, 'the boss enters as the warm-up ends');
    assert.equal(boss.boss.role, 'final');
    assert.equal(world.bossWarmupLeft, 0);
    assert.ok(Math.hypot(boss.x - world.player.x, boss.y - world.player.y) >= 420 - 1e-6, 'at its usual distance from the player');
    hud = engine.probe.hud();
    assert.equal(hud.bossArrival, undefined);
    assert.equal(hud.bossId, boss.boss.id, 'the boss bar and its title card come with it');
    assert.equal(hud.bossEnrage, 0);

    engine.probe.step(60);
    world = engine.probe.read();
    assert.ok(Math.abs(world.duration - world.timeLeft - 1) < 1e-6, 'the enrage timer starts as the boss enters');
    engine.probe.setClock({ timeLeft: 0.01 });
    engine.probe.step(2);
    assert.equal(engine.probe.read().bossEnraged, true, 'and enrage comes when it runs out');
  } finally {
    engine.dispose();
    without.dispose();
  }
});

test('CON-02: felling the boss after the warm-up clears the stage; dying in it is a defeat with no boss met', () => {
  const settled = [];
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), freshMeta(), standardOptions(), {
    onSnapshot() {},
    onDraft(draft) { engine.completeDraft(draft.cards[0], draft.id); },
    onRoundClear(result) { settled.push(['clear', result]); },
    onGameOver(result) { settled.push(['death', result]); },
  });
  try {
    engine.setRuleSet('remaster');
    engine.startRun(1, 5, 55);
    engine.probe.setGodMode();
    engine.probe.step(Math.round(bossWarmupSeconds('midBoss', 1) * 60) + 1);
    const boss = stageBoss(engine);
    assert.ok(boss);
    engine.probe.patchEnemy(boss.id, { hp: 0 });
    for (let step = 0; step < 600 && settled.length === 0; step += 1) engine.probe.step(1);
    assert.equal(settled[0]?.[0], 'clear');
    assert.equal(settled[0][1].bossesDefeated, 1);
    assert.equal(settled[0][1].stageKind, 'midBoss');

    settled.length = 0;
    engine.startRun(1, 5, 56);
    engine.probe.step(60);
    engine.probe.setPlayer({ hp: 0 });
    engine.probe.step(2);
    assert.equal(settled[0]?.[0], 'death');
    assert.equal(settled[0][1].enraged, false);
    assert.equal(settled[0][1].bossesDefeated, 0);
  } finally {
    engine.dispose();
  }
});

test('CON-02: only campaign boss stages the table names wait; normal stages, the infinite run, and the classic rules do not', () => {
  const engine = newEngine();
  const classic = newEngine('classic');
  try {
    for (const chapter of [1, 2, 3, 4, 5]) {
      for (const [stage, kind] of [[5, 'midBoss'], [10, 'finalBoss']]) {
        engine.startRun(chapter, stage, 700 + chapter * 10 + stage);
        const seconds = bossWarmupSeconds(kind, chapter);
        assert.equal(engine.probe.read().bossWarmupLeft, seconds, `${chapter}-${stage}`);
        assert.equal(Boolean(stageBoss(engine)), seconds === 0, `${chapter}-${stage}: the boss waits only behind a warm-up`);
        classic.startRun(chapter, stage, 700 + chapter * 10 + stage);
        assert.equal(classic.probe.read().bossWarmupLeft, 0, `classic ${chapter}-${stage}`);
        assert.ok(stageBoss(classic), `classic ${chapter}-${stage}: the boss from the start`);
      }
    }
    engine.startRun(1, 4, 14);
    assert.equal(engine.probe.read().bossWarmupLeft, 0, 'a normal stage');
    engine.startInfiniteRun(4242, true);
    assert.equal(engine.probe.read().bossWarmupLeft, 0, 'the infinite run');
    assert.ok(engine.probe.read().enemies.some((enemy) => enemy.isBoss), 'keeps its round boss from the start');
  } finally {
    engine.dispose();
    classic.dispose();
  }
});

test('CON-02: bringing the boss in right after the start gives the stage as it began without the warm-up', () => {
  const engine = newEngine();
  const without = newEngine('remaster', { patch: { bossWarmup: false } });
  try {
    engine.startRun(1, 10, 31337);
    engine.probe.bringBoss();
    without.startRun(1, 10, 31337);
    const pick = (run) => {
      const boss = stageBoss(run);
      return { id: boss.id, x: boss.x, y: boss.y, hp: boss.maxHp, damage: boss.damage, def: boss.boss.id, variant: boss.variant };
    };
    assert.deepEqual(pick(engine), pick(without));
    assert.equal(engine.probe.read().bossWarmupLeft, 0);
    engine.probe.step(60);
    assert.ok(engine.probe.read().timeLeft < engine.probe.read().duration, 'the stage clock runs');
  } finally {
    engine.dispose();
    without.dispose();
  }
});

/** What a player could see of the run, as in the suspend test (CON-04). */
function state(engine) {
  const world = engine.probe.read();
  const round = (value) => Math.round(value * 1e6) / 1e6;
  return createHash('sha256').update(JSON.stringify({
    player: [round(world.player.x), round(world.player.y), round(world.player.hp), world.player.level, round(world.player.xp), world.player.kills],
    enemies: world.enemies.map((enemy) => [enemy.id, enemy.tier, round(enemy.x), round(enemy.y), round(enemy.hp)]),
    clock: [round(world.elapsed), round(world.timeLeft), round(world.bossWarmupLeft)],
  })).digest('hex');
}

test('CON-02: a run suspended after the boss entered replays exactly, warm-up and all (CON-04)', async () => {
  const options = { ...standardOptions(), assistDamage: 1, assistEnemySpeed: 1, assistSlowGame: false };
  const make = () => {
    const drafts = [];
    return { engine: newEngine('remaster', { meta: maxMeta(), options, drafts }), drafts };
  };
  const original = make();
  original.engine.startRun(1, 5, 90211);
  let roll = 11;
  const random = () => {
    roll = (Math.imul(roll, 1_664_525) + 1_013_904_223) >>> 0;
    return roll / 0x1_0000_0000;
  };
  const actions = ['moveUp', 'moveDown', 'moveLeft', 'moveRight'];
  const warmupTicks = Math.round(bossWarmupSeconds('midBoss', 1) * 60);
  for (let frame = 0; frame < warmupTicks + 900; frame += 1) {
    const draft = original.drafts.at(-1);
    if (draft && original.engine.probe.read().paused) {
      original.engine.completeDraft(draft.cards[Math.floor(random() * draft.cards.length)], draft.id);
      original.drafts.length = 0;
    }
    if (random() < 0.06) original.engine.dispatch({ type: 'input/action', action: actions[Math.floor(random() * 4)], pressed: random() < 0.6 });
    original.engine.advanceFrame(1 / 60, false);
  }
  assert.equal(original.engine.probe.read().stageFinished, false, 'the stage is still on');
  assert.ok(stageBoss(original.engine), 'the boss has entered');
  const saved = JSON.parse(JSON.stringify(original.engine.suspendState()));
  assert.ok(saved && saved.ticks > warmupTicks, `saved past the warm-up (${saved?.ticks} ticks)`);

  const resumed = make();
  await resumed.engine.resumeRun(saved, 700);
  assert.equal(state(resumed.engine), state(original.engine), 'the same state at the saved tick');
  assert.equal(stageBoss(resumed.engine).id, stageBoss(original.engine).id);
  original.engine.dispose();
  resumed.engine.dispose();
});
