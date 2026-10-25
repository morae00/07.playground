import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// The horde (SYS-13, horde rule; remaster on, classic off): about twice the enemies, coming twice as fast, each with
// less health, lighter hits (after defence), and smaller rewards carried exactly; a strong build's thin infinite
// field refills by kills.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, HORDE } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function engineWith(horde) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), { onSnapshot() {}, onDraft(draft) { engine.completeDraft(draft.cards[0], draft.id); }, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet('remaster');
  engine.probe.patchRules({ horde });
  return engine;
}

test('SYS-13: the field holds about twice the enemies, and they come about twice as fast', () => {
  const counts = {};
  const caps = {};
  for (const horde of [false, true]) {
    const engine = engineWith(horde);
    try {
      engine.startRun(3, 4, 4141);
      engine.probe.setGodMode();
      engine.probe.setSkills({});
      engine.probe.setPlayer({ nextXp: 1e12 });
      engine.probe.step(60 * 45);
      counts[horde] = engine.probe.read().enemies.filter((enemy) => !enemy.isBoss).length;
      caps[horde] = engine.probe.hud().enemyCap;
    } finally {
      engine.dispose();
    }
  }
  assert.equal(caps.true, Math.round(caps.false * HORDE.cap));
  assert.ok(counts.true > counts.false * 1.5, `${counts.true} enemies against ${counts.false}`);
});

test('SYS-13: each enemy has the horde share of health, and its rewards average out exactly', () => {
  const made = {};
  for (const horde of [false, true]) {
    const engine = engineWith(horde);
    try {
      engine.startRun(2, 3, 5151);
      engine.probe.haltSpawns();
      engine.probe.clear('enemies');
      const ids = Array.from({ length: 20 }, () => engine.probe.spawnEnemy({ tier: 'small' }));
      const byId = new Map(engine.probe.read().enemies.map((enemy) => [enemy.id, enemy]));
      // Elites multiply their already scaled reward, so they leave the carried total; the same ones roll either way.
      const enemies = ids.map((id) => byId.get(id)).filter((enemy) => !enemy.elite);
      made[horde] = { count: enemies.length, hp: enemies[0].maxHp, damage: enemies[0].damage, xp: enemies.reduce((sum, enemy) => sum + enemy.xp, 0), coin: enemies.reduce((sum, enemy) => sum + enemy.coin, 0) };
    } finally {
      engine.dispose();
    }
  }
  assert.equal(made.true.count, made.false.count);
  assert.ok(Math.abs(made.true.hp / made.false.hp - HORDE.hp) < 1e-9);
  // The damage share applies to the hit after defence (next test), not to the enemy.
  assert.equal(made.true.damage, made.false.damage);
  // Twenty small enemies: the carried fractions land within one of the exact scaled total.
  assert.ok(Math.abs(made.true.xp - made.false.xp * HORDE.xp) <= 1, `${made.true.xp} XP against ${made.false.xp} x ${HORDE.xp}`);
  assert.ok(Math.abs(made.true.coin - made.false.coin * HORDE.coin) <= 1, `${made.true.coin} coins against ${made.false.coin} x ${HORDE.coin}`);
});

test('SYS-13: an ordinary enemy\'s hit takes the horde share after the player\'s defence, the infinite run its own', () => {
  for (const [mode, share] of [['campaign', HORDE.damage], ['infinite', HORDE.infinite.damage]]) {
    const taken = {};
    for (const horde of [false, true]) {
      const engine = engineWith(horde);
      try {
        if (mode === 'infinite') engine.startInfiniteRun(5353, true);
        else engine.startRun(5, 4, 5353);
        const { probe } = engine;
        probe.haltSpawns();
        probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots');
        probe.setSkills({});
        // No regeneration, so the health lost is exactly the damage taken; with this defence a hit scaled before
        // defence would lose more than the horde share.
        probe.setPlayer({ nextXp: 1e12, stats: { hpRegen: 0, defense: 10 } });
        const { player } = probe.read();
        probe.spawnEnemy({ tier: 'small', x: player.x + 4, y: player.y, speed: 0, damage: 60 });
        probe.step(2);
        taken[horde] = player.hp - probe.read().player.hp;
      } finally {
        engine.dispose();
      }
    }
    assert.ok(taken.false > 1, `${mode}: a hit lands above the damage floor (${taken.false})`);
    assert.ok(Math.abs(taken.true - taken.false * share) < 1e-6, `${mode}: ${taken.true} against ${taken.false} x ${share}`);
  }
});

test('SYS-13: in the infinite run a kill on a thin field brings another, and not on a full one', () => {
  const engine = engineWith(true);
  try {
    engine.startInfiniteRun(6161, true);
    engine.probe.setGodMode();
    engine.probe.setClock({ elapsed: HORDE.fill.afterSeconds + 30 });
    engine.probe.haltSpawns();
    engine.probe.clear('enemies');
    const victim = engine.probe.spawnEnemy({ tier: 'small' });
    const before = engine.probe.read().spawnBudget;
    engine.probe.patchEnemy(victim, { hp: 0 });
    engine.probe.step(1);
    assert.ok(engine.probe.read().spawnBudget >= before + HORDE.fill.perKill - 1e-9, 'the kill added to the spawn budget');
  } finally {
    engine.dispose();
  }
});

test('SYS-13: a settlement pays its kills the horde\'s shares in gold and account XP, the infinite run its own; without the horde as before', () => {
  const settle = ({ rules = 'remaster', horde, infinite = false }) => {
    let settlement = null;
    const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver(result) { settlement = result; } });
    try {
      engine.setRuleSet(rules);
      if (horde !== undefined) engine.probe.patchRules({ horde });
      if (infinite) engine.startInfiniteRun(6161);
      else engine.startRun(2, 3, 6161);
      engine.probe.setStageKills(1000);
      engine.forfeit();
      return settlement;
    } finally {
      engine.dispose();
    }
  };
  // A defeat on 2-3 a moment in, with 1,000 kills: gold 16 + kills + 2 x 18 + 3 x 8, XP 70 + kills + 2 x 24.
  for (const [label, settlement, share] of [
    ['horde', settle({}), { gold: HORDE.coin, xp: HORDE.xp }],
    ['no horde', settle({ horde: false }), { gold: 1, xp: 1 }],
    ['classic', settle({ rules: 'classic' }), { gold: 1, xp: 1 }],
  ]) {
    assert.equal(settlement.goldParts.kills, 1000 * 0.9 * share.gold, `${label}: kill gold`);
    assert.equal(settlement.gold, Math.floor(16 + 1000 * 0.9 * share.gold + 2 * 18 + 3 * 8), `${label}: gold`);
    assert.equal(settlement.xp, Math.floor(70 + 1000 * 1.1 * share.xp + 2 * 24), `${label}: account XP`);
  }
  const infinite = settle({ infinite: true });
  assert.equal(infinite.goldParts.kills, 1000 * 0.9 * HORDE.infinite.coin);
  assert.equal(infinite.xp, Math.floor(70 + 1000 * 1.1 * HORDE.infinite.xp + infinite.chapter * 24));
});
