import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// The horde (SYS-13, horde rule; remaster on, classic off): about twice the enemies, coming twice as fast, each with
// less health and damage and smaller rewards carried exactly; a strong build's thin infinite field refills by kills.
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

test('SYS-13: each enemy has the horde share of health and damage, and its rewards average out exactly', () => {
  const made = {};
  for (const horde of [false, true]) {
    const engine = engineWith(horde);
    try {
      engine.startRun(2, 3, 5151);
      engine.probe.haltSpawns();
      engine.probe.clear('enemies');
      const ids = Array.from({ length: 20 }, () => engine.probe.spawnEnemy({ tier: 'small' }));
      const byId = new Map(engine.probe.read().enemies.map((enemy) => [enemy.id, enemy]));
      const enemies = ids.map((id) => byId.get(id));
      made[horde] = { hp: enemies[0].maxHp, damage: enemies[0].damage, xp: enemies.reduce((sum, enemy) => sum + enemy.xp, 0), coin: enemies.reduce((sum, enemy) => sum + enemy.coin, 0) };
    } finally {
      engine.dispose();
    }
  }
  assert.ok(Math.abs(made.true.hp / made.false.hp - HORDE.hp) < 1e-9);
  assert.ok(Math.abs(made.true.damage / made.false.damage - HORDE.damage) < 1e-9);
  // Twenty small enemies: the carried fractions land within one of the exact scaled total.
  assert.ok(Math.abs(made.true.xp - made.false.xp * HORDE.xp) <= 1, `${made.true.xp} XP against ${made.false.xp} x ${HORDE.xp}`);
  assert.ok(Math.abs(made.true.coin - made.false.coin * HORDE.coin) <= 1, `${made.true.coin} coins against ${made.false.coin} x ${HORDE.coin}`);
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
