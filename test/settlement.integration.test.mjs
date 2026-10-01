import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Settlement (UI-05): the engine hands the screen what a result is made of (the gold's parts, each skill's damage,
// the level reached, the damage taken), and settlementNotes works out new records and account level-ups.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, settlementNotes } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function playedStage() {
  let settlement = null;
  let draft = null;
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), {
    onSnapshot() {}, onDraft(next) { draft = next; }, onRoundClear(result) { settlement = result; }, onGameOver(result) { settlement = result; },
  });
  engine.setRuleSet('remaster');
  engine.startRun(1, 3, 8181);
  const { probe } = engine;
  probe.haltSpawns();
  probe.clear('enemies', 'hazards', 'obstacles');
  probe.setSkills({ needleStorm: { level: 3 }, chainSpark: { level: 2 } });
  const { player } = probe.read();
  for (let index = 0; index < 12; index += 1) probe.spawnEnemy({ tier: 'small', x: player.x + 120 + index * 14, y: player.y - 60 + (index % 3) * 60, speed: 0, damage: 0, hp: 40 });
  probe.spawnHostileShot({ x: player.x - 60, y: player.y, vx: 300, vy: 0, damage: 20, life: 2 });
  probe.step(360);
  // The kills level the player up; the stage settles once those drafts are taken.
  probe.requestRoundClear();
  for (let guard = 0; draft && !settlement && guard < 20; guard += 1) {
    const open = draft;
    draft = null;
    engine.completeDraft(open.cards[0], open.id);
  }
  return { engine, settlement };
}

test('UI-05: a settlement carries the gold parts, the damage per skill, the level, and the damage taken', () => {
  const { engine, settlement } = playedStage();
  try {
    assert.ok(settlement, 'the stage settled');
    const parts = settlement.goldParts;
    const sum = parts.base + parts.boss + parts.kills + parts.coins + parts.stage + parts.bonus;
    assert.equal(Math.floor(sum + 1e-9), settlement.gold, 'the parts add up to the gold');
    assert.ok(parts.kills > 0 && parts.stage > 0);
    assert.ok((settlement.damageBySkill.needleStorm ?? 0) > 0, 'the needles did damage');
    const dealt = Object.values(settlement.damageBySkill).reduce((total, value) => total + value, 0);
    assert.ok(dealt <= 12 * 40 + 1e-6, `damage never counts past the health it took (${dealt})`);
    assert.ok(settlement.damageTaken > 0, 'the shot that hit is counted');
    assert.ok(settlement.level >= 1);
  } finally {
    engine.dispose();
  }
});

test('UI-05: settlement notes flag new stage records, the stage a clear opens, and the account level the XP reaches', () => {
  const meta = { ...maxMeta(), level: 3, xp: 0, progress: { chapter: 1, stage: 3 } };
  const result = { runMode: 'campaign', practice: false, cleared: true, chapter: 1, stage: 3, kills: 90, clearSeconds: 280, xp: 10 };
  assert.deepEqual(settlementNotes(result, undefined, meta, true), { newKills: false, newTime: false, unlocked: { chapter: 1, stage: 4 }, levelUp: null, passivePoints: 0, stars: [true, false, false], newStars: 1 }, 'a first attempt has no record to beat, and its clear opens 1-4');
  const record = { attempts: 2, clears: 1, bestKills: 80, bestClearSeconds: 300 };
  const beaten = settlementNotes(result, record, meta, true);
  assert.equal(beaten.newKills, true);
  assert.equal(beaten.newTime, true);
  assert.equal(settlementNotes({ ...result, kills: 70, clearSeconds: 320 }, record, meta, true).newTime, false);
  assert.equal(settlementNotes({ ...result, cleared: false }, record, meta, true).newTime, false, 'a defeat sets no time');
  assert.equal(settlementNotes({ ...result, practice: true }, record, meta, true).newKills, false, 'practice keeps no records');
  assert.equal(settlementNotes(result, record, { ...meta, progress: { chapter: 2, stage: 1 } }, true).unlocked, null, 'a stage already open is not news');
  assert.equal(settlementNotes(result, record, meta, false).unlocked, null, 'developer access opens nothing');
  assert.deepEqual(settlementNotes({ ...result, stage: 10 }, record, { ...meta, progress: { chapter: 1, stage: 10 } }, true).unlocked, { chapter: 2, stage: 1 }, 'the last stage of a chapter opens the next chapter');
  const levelled = settlementNotes({ ...result, xp: 100_000 }, record, meta, true);
  assert.ok(levelled.levelUp > 3 && levelled.passivePoints === levelled.levelUp - 3, 'enough XP lifts the account level');
  // CON-07: the stars the stage holds once the result counts, and how many it adds.
  const starred = settlementNotes({ ...result, damageTaken: 10, maxHp: 300, bonus: { goal: { key: 'bonus.goal.small', params: { n: 1 } }, met: true } }, record, meta, true);
  assert.deepEqual([starred.stars, starred.newStars], [[true, true, true], 2]);
  assert.deepEqual([settlementNotes({ ...result, practice: true }, record, meta, true).stars, settlementNotes({ ...result, runMode: 'infinite' }, record, meta, true).newStars], [null, 0]);
});

test('CON-07: a settlement says the stage kind, the max health, whether a boss enraged, and how many bosses fell', async () => {
  const { engine, settlement } = playedStage();
  try {
    assert.equal(settlement.stageKind, 'normal');
    assert.ok(settlement.maxHp > 0);
    assert.equal(settlement.enraged, false);
    assert.equal(settlement.bossesDefeated, 0);
  } finally {
    engine.dispose();
  }
  const settlements = [];
  // The boss's reward draft comes first; it is picked at once.
  const boss = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), {
    onSnapshot() {},
    onDraft(draft) { queueMicrotask(() => boss.completeDraft(draft.cards[0], draft.id)); },
    onRoundClear(result) { settlements.push(result); },
    onGameOver(result) { settlements.push(result); },
  });
  try {
    boss.setRuleSet('remaster');
    boss.startRun(1, 5, 77);
    boss.probe.setGodMode();
    boss.probe.haltSpawns();
    boss.probe.clear('enemies');
    const id = boss.probe.spawnBoss('mid', { hp: 1 });
    boss.probe.setSkills({ chainSpark: { level: 5 } });
    for (let frame = 0; frame < 600 && settlements.length === 0; frame += 1) {
      boss.probe.step(1);
      await Promise.resolve();
    }
    const [result] = settlements;
    assert.ok(result && result.cleared, `the mid boss stage clears (${id})`);
    assert.deepEqual([result.stageKind, result.enraged, result.bossesDefeated], ['midBoss', false, 1]);
  } finally {
    boss.dispose();
  }
});
