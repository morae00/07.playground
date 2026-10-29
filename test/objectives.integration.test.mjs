import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, localeTable, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';
import OBJECTIVES from '../src/content/data/objectives.ts';

// Stage objectives (CON-03): each normal stage's objective changes the stage and sets a bonus goal. Classic rules keep
// the objective a label. Objectives rotate (stage + chapter - 2) mod 8 through swarm, holdLine, traps, elites,
// salvage, giants, crossfire, and vanguard.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, installStrings, stageObjective, tx } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');
installStrings(localeTable('ko'));

function stageRun(chapter, stage, { rules = 'remaster', seed = 4711, options = {}, patch = null } = {}) {
  const settlements = [];
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), { ...standardOptions(), ...options }, {
    onSnapshot() {},
    onDraft() {},
    onRoundClear(result) { settlements.push(result); },
    onGameOver(result) { settlements.push(result); },
  });
  engine.setRuleSet(rules);
  if (patch) engine.probe.patchRules(patch);
  engine.startRun(chapter, stage, seed);
  const { probe } = engine;
  probe.setGodMode();
  probe.setPlayer({ nextXp: 1e12 });
  return { engine, probe, settlements };
}

function tierShares(run, draws = 6000) {
  const counts = { small: 0, medium: 0, large: 0 };
  for (let index = 0; index < draws; index += 1) {
    run.probe.clear('enemies');
    run.probe.spawnEnemy({ tier: 'rolled' });
    counts[run.probe.read().enemies[0].tier] += 1;
  }
  return Object.fromEntries(Object.entries(counts).map(([tier, count]) => [tier, count / draws]));
}

const near = (actual, expected, tolerance, label) => assert.ok(Math.abs(actual - expected) < tolerance, `${label}: ${actual.toFixed(3)}, expected ${expected}`);

test('CON-03: classic rules keep the objective a label, with no bonus goal and the usual tier mix', () => {
  const run = stageRun(1, 9, { rules: 'classic' });
  try {
    assert.equal(run.probe.hud().bonus, null);
    run.probe.haltSpawns();
    const shares = tierShares(run);
    near(shares.small, 0.58, 0.02, 'small');
    near(shares.large, 0.12, 0.02, 'large');
  } finally {
    run.engine.dispose();
  }
});

test('CON-03: the swarm and giant objectives move one tier by 15 points; the others keep their 58:30:12 proportion (G9)', () => {
  for (const [chapter, stage, expected] of [[1, 9, { small: 0.73, medium: 0.193, large: 0.077 }], [1, 6, { small: 0.481, medium: 0.249, large: 0.27 }]]) {
    const run = stageRun(chapter, stage);
    try {
      run.probe.haltSpawns();
      const shares = tierShares(run);
      for (const tier of ['small', 'medium', 'large']) near(shares[tier], expected[tier], 0.02, `${chapter}-${stage} ${tier}`);
      // The radii and the tier stats stay the grammar's: only the mix moves.
      run.probe.clear('enemies');
      const id = run.probe.spawnEnemy({ tier: 'small' });
      assert.equal(run.probe.read().enemies.find((enemy) => enemy.id === id).radius, 12);
    } finally {
      run.engine.dispose();
    }
  }
});

test('CON-03: the first stage of the campaign keeps its bonus goal without the harder mix', () => {
  const run = stageRun(1, 1);
  try {
    // P2-3 (bonusGoalRetune): Ch1's swarm goal is 700 small kills.
    assert.equal(tx(run.probe.hud().bonus.goal), '소형 700마리 처치');
    run.probe.haltSpawns();
    near(tierShares(run).small, 0.58, 0.02, '1-1 small');
  } finally {
    run.engine.dispose();
  }
});

test('CON-03: the trap zone doubles the static terrain', () => {
  const counts = {};
  for (const rules of ['classic', 'remaster']) {
    const run = stageRun(1, 3, { rules });
    counts[rules] = run.probe.read().hazards.length;
    run.engine.dispose();
  }
  assert.equal(counts.remaster, counts.classic * 2, `${counts.remaster} against ${counts.classic}`);
});

test('CON-03: the crossfire objective raises the ranged cap to 6 on a Ch1 stage (G9 allows it on this stage only)', () => {
  const run = stageRun(1, 7);
  try {
    run.probe.haltSpawns();
    run.probe.clear('enemies');
    for (let index = 0; index < 900; index += 1) run.probe.spawnEnemy({ tier: 'rolled' });
    const ranged = run.probe.read().enemies.filter((enemy) => enemy.attackStyle === 'ranged').length;
    assert.equal(ranged, 6);
  } finally {
    run.engine.dispose();
  }
});

test('CON-03: the vanguard objective calls a third field boss at 18%; without elites (SYS-10) the elite hunt strengthens its field bosses', () => {
  const vanguard = stageRun(1, 8);
  const plain = stageRun(1, 2);
  try {
    for (const run of [vanguard, plain]) {
      run.probe.haltSpawns(false);
      run.probe.clear('enemies');
      const { duration } = run.probe.hud();
      run.probe.setClock({ timeLeft: duration * (1 - 0.19) });
      run.probe.step(2);
    }
    assert.equal(vanguard.probe.read().enemies.filter((enemy) => enemy.isBoss).length, 1, 'vanguard: a field boss at 18%');
    assert.equal(plain.probe.read().enemies.filter((enemy) => enemy.isBoss).length, 0, 'the others wait for 36%');
    assert.equal(tx(vanguard.probe.hud().bonus.goal), '필드 보스 3마리를 각각 나타난 뒤 120초 안에 처치');
  } finally {
    vanguard.engine.dispose();
    plain.engine.dispose();
  }

  // With SYS-10's elites off, the elite hunt strengthens both field bosses instead of bringing elites.
  const hp = {};
  for (const [label, stage] of [['elites', 4], ['plain', 2]]) {
    const run = stageRun(1, stage, { patch: { eliteAffixes: false } });
    run.probe.clear('enemies');
    run.probe.setClock({ timeLeft: run.probe.hud().duration * (1 - 0.37) });
    run.probe.step(2);
    const boss = run.probe.read().enemies.find((enemy) => enemy.isBoss);
    // Field boss health grows with the stage number, so compare per stage.
    hp[label] = boss.maxHp / (1 + (stage - 1) * 0.08);
    run.engine.dispose();
  }
  near(hp.elites / hp.plain, 1.5, 0.001, 'elite field boss health');
});

test('D-04: a field boss goal counts only field bosses defeated within 60 s of arriving, and one that outlives it fails the goal', () => {
  // D-04's own window; the remaster rules widen it to 120 s since P2-3 (bonusGoalRetune, the test below).
  const d04 = { patch: { bonusGoalRetune: false } };
  const callBoss = (run) => {
    // No skills, so the boss lives until the test says.
    run.probe.setSkills({});
    run.probe.clear('enemies');
    run.probe.setClock({ timeLeft: run.probe.hud().duration * (1 - 0.19) });
    run.probe.step(2);
    return run.probe.read().enemies.find((enemy) => enemy.isBoss);
  };
  const quick = stageRun(1, 8, d04);
  try {
    const boss = callBoss(quick);
    quick.probe.haltSpawns();
    quick.probe.step(60 * 30);
    quick.probe.patchEnemy(boss.id, { hp: 0 });
    quick.probe.step(2);
    assert.deepEqual([quick.probe.hud().bonus.progress, quick.probe.hud().bonus.status], [1, 'active'], 'killed at 30 s, it counts');
  } finally {
    quick.engine.dispose();
  }
  const slow = stageRun(1, 8, d04);
  try {
    callBoss(slow);
    slow.probe.haltSpawns();
    slow.probe.step(60 * 61);
    assert.deepEqual([slow.probe.hud().bonus.progress, slow.probe.hud().bonus.status], [0, 'failed'], 'alive past 60 s, the goal fails');
  } finally {
    slow.engine.dispose();
  }
});

test('CON-03: holding the line: the zone fills while the player stands in it, moves on every 10 s, and a clear pays the bonus', () => {
  const run = stageRun(1, 2);
  try {
    run.probe.haltSpawns();
    run.probe.clear('enemies', 'hazards', 'obstacles');
    run.probe.step(2);
    const standIn = () => {
      const [mark] = run.probe.renderWorld(1).objectiveMarks;
      run.probe.setPlayer({ x: mark.x, y: mark.y, prevX: mark.x, prevY: mark.y });
      return mark;
    };
    const first = standIn();
    assert.equal(first.kind, 'hold');
    run.probe.step(60 * 5 + 1);
    assert.equal(run.probe.hud().bonus.progress, 5, 'whole seconds held');
    run.probe.step(60 * 5 + 1);
    run.probe.step(2);
    const second = run.probe.renderWorld(1).objectiveMarks[0];
    assert.ok(second && Math.hypot(second.x - first.x, second.y - first.y) > 100, 'the zone moved on after 10 s');
    for (let stretch = 0; stretch < 2; stretch += 1) {
      standIn();
      run.probe.step(60 * 10 + 2);
      run.probe.step(2);
    }
    assert.equal(run.probe.hud().bonus.status, 'done');

    run.probe.setClock({ timeLeft: 0.05 });
    run.probe.step(10);
    const [settlement] = run.settlements;
    assert.equal(settlement.cleared, true);
    assert.deepEqual(settlement.bonus && [tx(settlement.bonus.goal), settlement.bonus.met], ['점령 구역에서 30초 버티기', true]);
    assert.equal(settlement.goldParts.bonus, Math.floor((40 + 18 + 2 * 8) * 0.5));
  } finally {
    run.engine.dispose();
  }
});

test('CON-03: salvage caches are recovered by standing on them, one after another', () => {
  const run = stageRun(2, 4);
  try {
    run.probe.haltSpawns();
    run.probe.clear('enemies', 'hazards', 'obstacles');
    run.probe.step(2);
    for (let cache = 0; cache < 5; cache += 1) {
      for (let wait = 0; wait < 60 * 4 && run.probe.renderWorld(1).objectiveMarks.length === 0; wait += 1) run.probe.step(1);
      const [mark] = run.probe.renderWorld(1).objectiveMarks;
      assert.equal(mark.kind, 'cache');
      run.probe.setPlayer({ x: mark.x, y: mark.y, prevX: mark.x, prevY: mark.y });
      run.probe.step(60 * 1.6);
    }
    assert.deepEqual([run.probe.hud().bonus.progress, run.probe.hud().bonus.status], [5, 'done']);
  } finally {
    run.engine.dispose();
  }
});

test('CON-03: the terrain goal fails after 20 s in hazards, and a failed goal pays nothing', () => {
  const run = stageRun(1, 3);
  try {
    run.probe.haltSpawns();
    run.probe.clear('enemies', 'hazards');
    const { player } = run.probe.read();
    run.probe.addHazard({ kind: 'water', x: player.x, y: player.y, radius: 200, life: 1e6, maxLife: 1e6, damage: 0, slow: 0.6, triggered: false });
    run.probe.step(60 * 10);
    assert.deepEqual([run.probe.hud().bonus.progress, run.probe.hud().bonus.status], [10, 'active']);
    run.probe.step(60 * 11);
    assert.equal(run.probe.hud().bonus.status, 'failed');
    run.probe.clear('hazards');
    run.probe.setClock({ timeLeft: 0.05 });
    run.probe.step(10);
    const [settlement] = run.settlements;
    assert.equal(settlement.bonus.met, false);
    assert.equal(settlement.goldParts.bonus, 0);
  } finally {
    run.engine.dispose();
  }
});

test('CON-03: kill goals count their tier, practice runs have no bonus goal, and the HUD names landmark stages', () => {
  const run = stageRun(1, 9);
  try {
    run.probe.haltSpawns();
    run.probe.clear('enemies');
    const { player } = run.probe.read();
    run.probe.setSkills({ chainSpark: { level: 5 } });
    for (let index = 0; index < 6; index += 1) run.probe.spawnEnemy({ tier: 'small', x: player.x + 60 + index * 8, y: player.y, hp: 1, speed: 0, damage: 0 });
    run.probe.spawnEnemy({ tier: 'large', x: player.x - 80, y: player.y, hp: 1, speed: 0, damage: 0 });
    run.probe.step(90);
    assert.equal(run.probe.hud().bonus.progress, 6, 'six small kills; the large one does not count');
  } finally {
    run.engine.dispose();
  }
  const practice = stageRun(1, 9, { options: { paceMode: 'practice' } });
  assert.equal(practice.probe.hud().bonus, null);
  practice.engine.dispose();
  const landmark = stageRun(1, 3);
  assert.equal(landmark.probe.hud().landmark, 'torn-poster-crossing');
  landmark.engine.dispose();
});

test('P2-3 (decision 2026-10-28): under bonusGoalRetune the kill goals and the field boss window take their chapter\'s retuned numbers', () => {
  const { kills, fieldBossWithin } = OBJECTIVES.retune;
  // 1-9 swarm (small kills), 2-6 crossfire (ranged kills), 2-3 the elite hunt (elite kills).
  for (const [chapter, stage, id, now] of [[1, 9, 'swarm', 280], [2, 6, 'crossfire', 22], [2, 3, 'elites', 10]]) {
    for (const retuned of [false, true]) {
      const run = stageRun(chapter, stage, { patch: { bonusGoalRetune: retuned } });
      try {
        assert.equal(run.probe.hud().bonus.target, retuned ? kills[id][chapter - 1] : now, `${id} ${chapter}-${stage}`);
      } finally {
        run.engine.dispose();
      }
    }
  }
  // 1-8 vanguard: a field boss alive just under the window still counts, and just past it fails the goal.
  const within = fieldBossWithin[0];
  for (const [seconds, status] of [[within - 1, 'active'], [within + 1, 'failed']]) {
    const run = stageRun(1, 8, { patch: { bonusGoalRetune: true } });
    try {
      run.probe.setSkills({});
      run.probe.clear('enemies');
      run.probe.setClock({ timeLeft: run.probe.hud().duration * (1 - 0.19) });
      run.probe.step(2);
      run.probe.haltSpawns();
      run.probe.step(Math.round(60 * seconds));
      assert.equal(run.probe.hud().bonus.status, status, `alive ${seconds} s with a ${within} s window`);
    } finally {
      run.engine.dispose();
    }
  }
});

test('P2-3: the stage card states the goal the remaster rules play: retuned kills and the 120 s window', () => {
  const { kills, fieldBossWithin } = OBJECTIVES.retune;
  for (const [chapter, stage, goal] of [
    [1, 1, `소형 ${kills.swarm[0]}마리 처치`],
    [4, 6, `소형 ${kills.swarm[3]}마리 처치`],
    [5, 3, `원거리 적 ${kills.crossfire[4]}마리 처치`],
    [3, 2, `정예 ${kills.elites[2]}마리 처치`],
    [5, 4, `필드 보스 3마리를 각각 나타난 뒤 ${fieldBossWithin[4]}초 안에 처치`],
  ]) {
    assert.equal(tx(stageObjective(chapter, stage).goal), goal, `${chapter}-${stage}`);
    const run = stageRun(chapter, stage);
    try {
      assert.equal(tx(run.probe.hud().bonus.goal), goal, `${chapter}-${stage} HUD`);
    } finally {
      run.engine.dispose();
    }
  }
});
