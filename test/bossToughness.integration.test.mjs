import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Boss toughness (SYS-12, bossToughness rule; remaster on, classic off): boss stage and field bosses take more health
// and hit harder; the infinite run's bosses take a factor by the minute they arrive and a floor from the pace the
// player felled the last ones at, and pay for the longer fight in XP and coins.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, BOSS_TOUGHNESS, byMinute } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function engineWith(rules) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(), maxMeta(), standardOptions(), {
    onSnapshot() {},
    onDraft(draft) { engine.completeDraft(draft.cards[0], draft.id); },
    onRoundClear() {},
    onGameOver() {},
  });
  engine.setRuleSet(rules);
  return engine;
}

const stageBoss = (engine) => engine.probe.read().enemies.find((enemy) => enemy.isBoss && enemy.hp > 0);

test('SYS-12: byMinute draws straight lines between its points and holds flat outside them', () => {
  const points = [[0, 1], [5, 2], [15, 4]];
  assert.equal(byMinute(points, -1), 1);
  assert.equal(byMinute(points, 2.5), 1.5);
  assert.equal(byMinute(points, 10), 3);
  assert.equal(byMinute(points, 40), 4);
  assert.equal(byMinute([], 3), 1);
});

test('SYS-12: a boss stage boss takes its chapter\'s campaign factors under the remaster rules, and the classic boss does not', () => {
  const boss = (rules, chapter, patch) => {
    const engine = engineWith(rules);
    try {
      if (patch) engine.probe.patchRules(patch);
      engine.startRun(chapter, 10, 77);
      const found = stageBoss(engine);
      return { hp: found.maxHp, damage: found.damage };
    } finally {
      engine.dispose();
    }
  };
  for (const chapter of [1, 2, 4]) {
    // The remaster rules move other numbers too (difficultyCurve), so compare against the same rules with the flag off.
    const on = boss('remaster', chapter);
    const off = boss('remaster', chapter, { bossToughness: false });
    assert.ok(Math.abs(on.hp / off.hp - BOSS_TOUGHNESS.campaign.roundHp[chapter - 1]) < 1e-9, `Ch${chapter} health`);
    assert.ok(Math.abs(on.damage / off.damage - BOSS_TOUGHNESS.campaign.roundDamage[chapter - 1]) < 1e-9, `Ch${chapter} damage`);
  }
  assert.ok(BOSS_TOUGHNESS.campaign.roundHp[0] < BOSS_TOUGHNESS.campaign.roundHp[4], 'later chapters\' bosses are tougher');
  const classic = boss('classic', 2);
  const classicOff = boss('classic', 2, { bossToughness: false });
  assert.deepEqual(classic, classicOff, 'the classic rules leave the boss alone');
});

test('SYS-12: an infinite boss felled fast sets a floor for the next: it lasts the target fight at that pace, and pays more', () => {
  const engine = engineWith('remaster');
  try {
    engine.startInfiniteRun(4242, true);
    engine.probe.setGodMode();
    const first = stageBoss(engine);
    assert.equal(first.bossAt, 0, 'the first boss carries its arrival time');
    // Fell it 4 s in: a pace of maxHp / 4 a second.
    engine.probe.step(60 * 4);
    const pace = first.maxHp / engine.probe.read().elapsed;
    engine.probe.patchEnemy(first.id, { hp: 0 });
    let next;
    for (let step = 0; step < 60 * 5 && !(next && next.id !== first.id); step += 1) {
      engine.probe.removeEnemies(engine.probe.read().enemies.filter((enemy) => !enemy.isBoss).map((enemy) => enemy.id));
      engine.probe.step(1);
      next = stageBoss(engine);
    }
    assert.ok(next && next.id !== first.id, 'the next round boss came');
    const { focus, rewardCap } = BOSS_TOUGHNESS.infinite;
    assert.ok(next.maxHp >= pace * focus.seconds * 0.99, `${Math.round(next.maxHp)} health against a floor of ${Math.round(pace * focus.seconds)}`);
    assert.ok(next.xp > 220 * 1.5 && next.xp <= (220 + 18) * rewardCap + 1e-6, `it pays ${next.xp} XP for the longer fight`);
  } finally {
    engine.dispose();
  }
});

test('SYS-12: the minute factor rises over the first 25 minutes and never shrinks a boss', () => {
  const points = BOSS_TOUGHNESS.infinite.roundHp;
  let last = 0;
  for (let minute = 0; minute <= 30; minute += 1) {
    const factor = byMinute(points, minute);
    assert.ok(factor >= 1 && factor >= last, `minute ${minute}: ${factor}`);
    last = factor;
  }
});
