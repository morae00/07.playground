import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, holdDirection, installHeadlessPlatform } from '../scripts/lib/headless-engine.mjs';

// Grammar contract (TEC-11): the real engine must keep the preserved game grammar. A failure here means a
// change altered core rules; update the preserved-grammar list and RULES_VERSION together with the code.
// Tests drive the engine only through public commands and the test probe (TEC-07, ARCHITECTURE rule 7).

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const {
  ProbedGameEngine,
  createEngineHarness,
  appendReplayCommand,
  createReplayFixture,
  runReplay,
} = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const meta = () => ({
  gold: 120,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 1, stage: 1 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});
const options = () => ({ healthBars: 'elite', volume: 0, effects: 0.9, damageNumbers: true, screenShake: false, reducedFlash: false, paceMode: 'standard' });

function createEngine({ onDraft = () => {}, viewport = [1440, 900], overrides = {} } = {}) {
  return new ProbedGameEngine(createHeadlessCanvas(viewport[0], viewport[1]), meta(), { ...options(), ...overrides }, {
    onSnapshot() {},
    onDraft,
    onRoundClear() {},
    onGameOver() {},
  });
}

/** An isolated arena: nothing spawns, the player neither attacks nor dies, and the stage is empty. */
function isolate(engine, ...keep) {
  const parts = ['enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots', 'effects'].filter((part) => !keep.includes(part));
  engine.probe.haltSpawns();
  engine.probe.setSkills({});
  engine.probe.setGodMode();
  engine.probe.clear(...parts);
}

test('G7: Stage 5 is a mid boss, Stage 10 a chapter boss, the rest survival stages', () => {
  const engine = createEngine();
  try {
    const kinds = [];
    for (let stage = 1; stage <= 10; stage += 1) {
      engine.startRun(1, stage, 1000 + stage);
      kinds.push(engine.probe.read().kind);
    }
    assert.deepEqual(kinds, ['normal', 'normal', 'normal', 'normal', 'midBoss', 'normal', 'normal', 'normal', 'normal', 'finalBoss']);
  } finally {
    engine.dispose();
  }
});

test('G4: level-up drafts show three cards and boss rewards four', () => {
  const drafts = [];
  const engine = createEngine({ onDraft: (draft) => drafts.push(draft) });
  try {
    engine.startRun(1, 1, 42);
    engine.probe.openDraft('level', 'resume');
    assert.equal(drafts.at(-1).cards.length, 3);
    engine.dispatch({ type: 'draft/select', offerId: drafts.at(-1).cards[0].offerId });
    engine.probe.openDraft('boss', 'resume');
    assert.equal(drafts.at(-1).cards.length, 4);
  } finally {
    engine.dispose();
  }
});

test('G9/V4: spawned enemies keep their tier radii and the 58/30/12 tier mix', () => {
  const engine = createEngine();
  try {
    engine.startRun(2, 3, 7);
    const counts = { small: 0, medium: 0, large: 0 };
    const radii = { small: new Set(), medium: new Set(), large: new Set() };
    for (let index = 0; index < 6000; index += 1) {
      engine.probe.clear('enemies');
      engine.probe.spawnEnemy({ tier: 'rolled' });
      const [enemy] = engine.probe.read().enemies;
      counts[enemy.tier] += 1;
      radii[enemy.tier].add(enemy.radius);
    }
    assert.deepEqual([...radii.small], [12]);
    assert.deepEqual([...radii.medium], [19]);
    assert.deepEqual([...radii.large], [28]);
    assert.ok(Math.abs(counts.small / 6000 - 0.58) < 0.02, `small share ${counts.small / 6000}`);
    assert.ok(Math.abs(counts.medium / 6000 - 0.30) < 0.02, `medium share ${counts.medium / 6000}`);
    assert.ok(Math.abs(counts.large / 6000 - 0.12) < 0.02, `large share ${counts.large / 6000}`);
  } finally {
    engine.dispose();
  }
});

test('G8/G10: main bosses use radius 54, field bosses radius 38 and appear at the 36% mark', () => {
  const engine = createEngine();
  try {
    engine.startRun(1, 5, 11);
    assert.equal(engine.probe.read().enemies.find((enemy) => enemy.isBoss).radius, 54);

    engine.startRun(1, 2, 12);
    engine.probe.setSkills({});
    engine.probe.setGodMode();
    engine.probe.clear('enemies');
    const { duration } = engine.probe.read();
    engine.probe.setClock({ timeLeft: duration * (1 - 0.35) });
    engine.probe.step(1);
    assert.equal(engine.probe.read().enemies.some((enemy) => enemy.isBoss), false, 'no field boss before 36%');
    engine.probe.setClock({ timeLeft: duration * (1 - 0.361) });
    engine.probe.step(1);
    const fieldBoss = engine.probe.read().enemies.find((enemy) => enemy.isBoss);
    assert.ok(fieldBoss, 'a field boss appears once progress passes 36%');
    assert.equal(fieldBoss.radius, 38);
    assert.equal(fieldBoss.boss.role, 'field');
  } finally {
    engine.dispose();
  }
});

test('G14: the same seed gives the same run under both rule sets when replayed', () => {
  for (const ruleSet of ['classic', 'remaster']) {
    const snapshots = [];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const engine = createEngine();
      try {
        engine.setRuleSet(ruleSet);
        engine.startRun(1, 1, 0x5eed);
        for (let frame = 0; frame < 600; frame += 1) engine.advanceFrame(1 / 60, false);
        const world = engine.probe.read();
        snapshots.push(JSON.stringify({ player: world.player, enemies: world.enemies.map((enemy) => [enemy.x, enemy.y, enemy.hp]) }));
      } finally {
        engine.dispose();
      }
    }
    assert.equal(snapshots[0], snapshots[1], `${ruleSet} rules must replay identically`);
  }
});

const START = { seed: 17, address: { chapter: 1, stage: 1 }, fixedStepHz: 60, paceMode: 'standard', rules: 'remaster' };

/** Plays a scripted pilot for `ticks` fixed steps and returns the command log it produced (TEC-07). */
function recordPilotRun({ ticks, start = START, viewport = [1440, 900], overrides = {} }) {
  const harness = createEngineHarness((callbacks) => new ProbedGameEngine(createHeadlessCanvas(viewport[0], viewport[1]), meta(), { ...options(), ...overrides }, callbacks));
  let replay = createReplayFixture('grammar-contract', start);
  const send = (tick, command) => {
    replay = appendReplayCommand(replay, tick, command);
    harness.dispatch(command);
  };
  const directions = ['moveRight', 'moveDown', 'moveLeft', 'moveUp'];
  harness.reset(replay.start);
  let held = null;
  for (let tick = 0; tick < ticks; tick += 1) {
    const draft = harness.openDraft;
    if (draft) send(tick, { type: 'draft/select', offerId: draft.cards[0].offerId });
    const wanted = directions[Math.floor(tick / 180) % directions.length];
    if (wanted !== held) {
      if (held) send(tick, { type: 'input/action', action: held, pressed: false });
      send(tick, { type: 'input/action', action: wanted, pressed: true });
      held = wanted;
    }
    harness.step(1);
    harness.drainEvents();
  }
  const snapshot = harness.readSnapshot();
  harness.dispose();
  return { replay: { ...replay, durationTicks: ticks }, snapshot };
}

test('TEC-07/G14: a seed plus the command log reproduces the run, whatever the cosmetic options and window size', () => {
  const recorded = recordPilotRun({ ticks: 2400 });
  assert.ok(recorded.replay.commands.some((entry) => entry.command.type === 'draft/select'), 'the pilot picked at least one draft card');
  assert.ok(recorded.snapshot.player[5] > 0, 'the pilot killed something');
  const replayOn = (viewport, overrides) => {
    const harness = createEngineHarness((callbacks) => new ProbedGameEngine(createHeadlessCanvas(viewport[0], viewport[1]), meta(), { ...options(), ...overrides }, callbacks));
    try {
      return runReplay(harness, recorded.replay);
    } finally {
      harness.dispose();
    }
  };
  const reference = replayOn([1440, 900], {});
  assert.deepEqual(reference.snapshot, recorded.snapshot, 'replaying the log lands on the recorded state');
  for (const [label, viewport, overrides] of [
    ['damage numbers off', [1440, 900], { damageNumbers: false }],
    ['low effect density', [1440, 900], { effects: 0.3 }],
    ['shake on, reduced flash', [1440, 900], { screenShake: true, reducedFlash: true }],
    ['1024x720 window', [1024, 720], {}],
    ['1920x1080 window', [1920, 1080], {}],
  ]) {
    assert.equal(replayOn(viewport, overrides).fingerprint, reference.fingerprint, label);
  }
});

/** Runs a seeded stage at a given frame rate, steering and capturing per fixed step (not per frame). */
function runSteps({ ruleSet, overrides = {}, viewport = [1440, 900], hz = 60, chapter = 1, stage = 5, seed = 99, steps = 1800 }) {
  let pendingDraft = null;
  let captured = null;
  const engine = createEngine({ viewport, overrides: { screenShake: true, ...overrides }, onDraft: (draft) => { pendingDraft = draft; } });
  const directions = ['d', 's', 'a', 'w'];
  try {
    engine.setRuleSet(ruleSet);
    engine.startRun(chapter, stage, seed);
    holdDirection(engine, directions[0]);
    engine.probe.onStep((tick) => {
      holdDirection(engine, directions[Math.floor(tick / 180) % directions.length]);
      if (tick !== steps) return;
      const world = engine.probe.read();
      captured = JSON.stringify({ player: world.player, enemies: world.enemies.map((enemy) => [enemy.tier, enemy.x, enemy.y, enemy.hp]), kills: world.stageKills });
    });
    for (let frame = 0; frame < steps * 4 && !captured && !engine.probe.read().stageFinished; frame += 1) {
      if (pendingDraft) {
        engine.dispatch({ type: 'draft/select', offerId: pendingDraft.cards[0].offerId });
        pendingDraft = null;
      }
      engine.advanceFrame(1 / hz, true);
    }
    return captured ?? `ended:${JSON.stringify(engine.probe.read().player)}`;
  } finally {
    engine.dispose();
  }
}

test('G14/BUG-08: cosmetic options and frame rate never change a seeded run under remaster rules', () => {
  const reference = runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400 });
  assert.equal(runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400, overrides: { damageNumbers: false } }), reference, 'damage numbers');
  assert.equal(runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400, overrides: { effects: 0.3 } }), reference, 'effects density');
  assert.equal(runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400, overrides: { screenShake: false, reducedFlash: true } }), reference, 'shake and reduced motion');
  assert.equal(runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400, hz: 30 }), reference, '30 Hz frames');
  assert.equal(runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400, hz: 144 }), reference, '144 Hz frames');
});

test('BUG-08: the gameplay id stream ignores damage numbers and effect density (classic rules still leak)', () => {
  const idsAfter = (ruleSet, overrides) => {
    let pending = null;
    const engine = createEngine({ overrides, onDraft: (draft) => { pending = draft; } });
    try {
      engine.setRuleSet(ruleSet);
      engine.startRun(2, 4, 31337);
      engine.probe.setGodMode();
      for (let frame = 0; frame < 900; frame += 1) {
        if (pending) {
          engine.dispatch({ type: 'draft/select', offerId: pending.cards[0].offerId });
          pending = null;
        }
        engine.advanceFrame(1 / 60, false);
      }
      const world = engine.probe.read();
      return JSON.stringify([world.enemies.map((enemy) => enemy.id), world.projectiles.map((shot) => shot.id), world.pickups.map((pickup) => pickup.id)]);
    } finally {
      engine.dispose();
    }
  };
  const remaster = idsAfter('remaster', { damageNumbers: true, effects: 1 });
  assert.equal(idsAfter('remaster', { damageNumbers: false, effects: 1 }), remaster);
  assert.equal(idsAfter('remaster', { damageNumbers: true, effects: 0.25 }), remaster);
  assert.notEqual(idsAfter('classic', { damageNumbers: false, effects: 1 }), idsAfter('classic', { damageNumbers: true, effects: 1 }), 'classic rules keep the 0.1.0 coupling for A/B runs');
});

test('BUG-10: the Ink Butcher winds up in place behind a lane telegraph, then dashes exactly along it', () => {
  const engine = createEngine();
  try {
    engine.startRun(1, 5, 505);
    const bossId = engine.probe.read().enemies.find((enemy) => enemy.isBoss).id;
    isolate(engine, 'enemies');
    engine.probe.removeEnemies(engine.probe.read().enemies.filter((enemy) => enemy.id !== bossId).map((enemy) => enemy.id));
    const { player } = engine.probe.read();
    engine.probe.patchEnemy(bossId, { x: player.x - 500, y: player.y, patternTimer: 0, patternPhase: 'idle' });
    engine.probe.step(1);
    const bossOf = () => engine.probe.read().enemies.find((enemy) => enemy.id === bossId);
    assert.equal(bossOf().patternPhase, 'warn');
    const [lane, ...others] = engine.probe.read().laneTelegraphs;
    assert.equal(others.length, 0, 'the windup shows one lane');
    assert.ok(Math.abs(lane.maxLife - 0.62) < 1e-9, 'the lane lasts the whole windup');
    const start = { x: bossOf().x, y: bossOf().y };

    engine.probe.setPlayer({ y: player.y + 300 });
    let drift = 0;
    for (let step = 0; step < 45 && bossOf().patternPhase === 'warn'; step += 1) {
      engine.probe.step(1);
      const boss = bossOf();
      if (boss.patternPhase === 'warn') drift = Math.max(drift, Math.hypot(boss.x - start.x, boss.y - start.y));
    }
    assert.ok(drift < 1e-6, `the boss holds still while winding up (drifted ${drift})`);
    assert.equal(bossOf().patternPhase, 'dash');
    while (bossOf().patternPhase === 'dash') engine.probe.step(1);
    const boss = bossOf();
    const along = Math.hypot(boss.x - lane.x1, boss.y - lane.y1);
    const sideways = Math.abs((lane.y2 - lane.y1) * (boss.x - lane.x1) - (lane.x2 - lane.x1) * (boss.y - lane.y1)) / Math.hypot(lane.x2 - lane.x1, lane.y2 - lane.y1);
    assert.ok(sideways < 2, `the dash stays on the telegraphed line even though the player moved (off by ${sideways})`);
    assert.ok(Math.abs(along - Math.hypot(lane.x2 - lane.x1, lane.y2 - lane.y1)) < boss.radius, 'the dash ends where the lane ends');
  } finally {
    engine.dispose();
  }
});

test('BUG-11: the eclipse wall enters from the view edge, reaches the player anywhere, and leaves one lane open', () => {
  const engine = createEngine();
  try {
    engine.startRun(5, 5, 707);
    const boss = engine.probe.read().enemies.find((enemy) => enemy.isBoss);
    assert.equal(boss.boss.pattern, 'eclipse');
    isolate(engine, 'enemies');
    engine.probe.removeEnemies(engine.probe.read().enemies.filter((enemy) => enemy.id !== boss.id).map((enemy) => enemy.id));
    for (const [px, py] of [[3600, 1500], [2100, 2600], [600, 400]]) {
      engine.probe.clear('hostileShots', 'effects');
      engine.probe.setPlayer({ x: px, y: py });
      engine.probe.patchEnemy(boss.id, { x: px - 200, y: py, patternTimer: 0, bossPhaseFlash: 0, speed: 0 });
      engine.probe.step(1);
      const queued = engine.probe.read();
      assert.equal(queued.pendingHostileShots.length, 6, 'seven lanes minus one safe lane');
      assert.equal(queued.laneTelegraphs.length, 6, 'each lane is telegraphed before the shots fly');
      assert.equal(queued.bossProjectiles.filter((shot) => shot.kind === 'eclipse').length, 0, 'no shot flies during the 0.6 s lead');
      let shots = [];
      for (let step = 0; step < 60 && shots.length === 0; step += 1) {
        engine.probe.step(1);
        shots = engine.probe.read().bossProjectiles.filter((shot) => shot.kind === 'eclipse');
      }
      assert.equal(shots.length, 6);
      for (const shot of shots) {
        const vertical = shot.vx === 0;
        const toPlayer = vertical ? (py - shot.y) / shot.vy : (px - shot.x) / shot.vx;
        assert.ok(toPlayer > 0 && toPlayer < shot.life, `shot from ${shot.x},${shot.y} reaches the player's line within its life at ${px},${py}`);
      }
    }
  } finally {
    engine.dispose();
  }
});

test('BUG-13: a root zone binds once and then lets the player walk out; hazards spawn clear of the start', () => {
  const engine = createEngine();
  try {
    engine.startRun(3, 10, 808);
    isolate(engine);
    const startX = engine.probe.read().player.x;
    const { player } = engine.probe.read();
    engine.probe.addHazard({ kind: 'root', x: player.x, y: player.y, radius: 52, life: 7, maxLife: 7, damage: 0, slow: 1, triggered: false });
    holdDirection(engine, 'd');
    let rootedSteps = 0;
    for (let step = 0; step < 7 * 60 && engine.probe.read().player.x - startX < 60; step += 1) {
      engine.probe.step(1);
      if (engine.probe.read().player.root > 0) rootedSteps += 1;
    }
    assert.ok(engine.probe.read().player.x - startX >= 60, 'the player leaves the zone before it expires');
    assert.ok(rootedSteps <= Math.ceil(0.65 * 60) + 1, `bound for one short window only (${rootedSteps} steps)`);

    for (let seed = 1; seed <= 25; seed += 1) {
      for (const chapter of [1, 3, 5]) {
        engine.startRun(chapter, 2, seed * 17 + chapter);
        for (const hazard of engine.probe.read().hazards) {
          if (!Number.isFinite(hazard.life)) {
            const gap = Math.hypot(hazard.x - 2100, hazard.y - 1500) - hazard.radius;
            assert.ok(gap >= 420 - 1e-6, `static ${hazard.kind} hazard reaches ${gap.toFixed(0)} px from the start (Ch${chapter} seed ${seed})`);
          }
        }
      }
    }
  } finally {
    engine.dispose();
  }
});

test('BUG-16: skills do what their cards say, and the mirror clone awakening adds aimed shots and pierce', () => {
  const engine = createEngine();
  try {
    const volley = (rules, awakened) => {
      engine.setRuleSet(rules);
      engine.startRun(3, 2, 909);
      isolate(engine);
      const { player } = engine.probe.read();
      const targetId = engine.probe.spawnEnemy({ x: player.x + 320, y: player.y + 40, hp: 1e9 });
      engine.probe.setSkills({ mirrorClone: { level: 5, awakened } });
      engine.probe.cast('mirrorClone');
      const world = engine.probe.read();
      return {
        shots: world.projectiles.filter((shot) => shot.skillId === 'mirrorClone'),
        target: world.enemies.find((enemy) => enemy.id === targetId),
        card: engine.probe.previewOffer('mirrorClone', 'awakening').body,
      };
    };

    const plain = volley('remaster', false);
    assert.equal(plain.shots.length, 2, 'two clones, two shots');
    assert.ok(plain.shots.every((shot) => shot.pierce === 3), 'Lv5 pierce is 1 + floor(5 / 2)');
    const reworked = volley('remaster', true);
    assert.equal(reworked.shots.length, 4, 'awakening adds two shots');
    assert.ok(reworked.shots.every((shot) => shot.pierce === 4), 'awakening adds one pierce');
    for (const shot of reworked.shots.slice(2)) {
      const toTarget = Math.atan2(reworked.target.y - shot.y, reworked.target.x - shot.x);
      assert.ok(Math.abs(Math.atan2(shot.vy, shot.vx) - toTarget) < 1e-9, 'the added shots aim at the target');
    }
    assert.match(reworked.card, /사격 \+2발, 관통 \+1/);
    const classic = volley('classic', true);
    assert.equal(classic.shots.length, 2, 'classic rules keep the 0.1.0 awakening');
    assert.match(classic.card, /레일이 없으면 효과가 없습니다/);

    engine.setRuleSet('remaster');
    engine.startRun(3, 2, 910);
    isolate(engine);
    const { player } = engine.probe.read();
    engine.probe.spawnEnemy({ x: player.x + 300, y: player.y, hp: 1e9 });
    engine.probe.setSkills({ railSpear: { level: 3 }, voidMine: { level: 3 } });
    assert.equal(engine.probe.previewOffer('railSpear', 'skill').body, '폭 +12, 피해 +128%');
    engine.probe.setSkills({ railSpear: { level: 4 }, voidMine: { level: 3 } });
    engine.probe.cast('railSpear');
    assert.equal(engine.probe.read().beams.at(-1).width, 18 + 12, 'the Lv4 rail is as wide as its card says');
    assert.equal(engine.probe.previewOffer('railSpear', 'skill').title, '흑선 레일 Lv.5');
    assert.doesNotMatch(engine.probe.previewOffer('railSpear', 'skill').body, /충전/);

    engine.probe.cast('voidMine');
    assert.equal(engine.probe.read().hazards.at(-1).pull, 74 + 3 * 14, 'void mine pull matches the +19% per level on its card');

    const overdrive = engine.probe.previewBonusOffers('level').find((offer) => offer.bonus === 'overdrive');
    assert.equal(overdrive.title, '과부하');
    assert.match(overdrive.body, /이번 런이 끝날 때까지/);
  } finally {
    engine.dispose();
  }
});
