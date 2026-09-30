import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Stage pacing (CON-02): 8-minute stages, a 10-minute boss enrage timer, a 5-minute Ch1-St1, and a practice
// pace that never unlocks and pays 30%. Classic rules keep the 12/17-minute 0.1.0 lengths for A/B runs.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function engineWith(rules, paceMode = 'standard') {
  const settlements = [];
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), { ...standardOptions(), paceMode }, {
    onSnapshot() {}, onDraft() {}, onRoundClear(result) { settlements.push(result); }, onGameOver(result) { settlements.push(result); },
  });
  engine.setRuleSet(rules);
  return { engine, settlements };
}

test('stage lengths follow the pacing rule', () => {
  const lengths = (rules, paceMode) => {
    const { engine } = engineWith(rules, paceMode);
    try {
      return [[1, 1], [1, 2], [2, 3], [1, 5], [3, 10]].map(([chapter, stage]) => {
        engine.startRun(chapter, stage, 1);
        return engine.probe.read().duration;
      });
    } finally {
      engine.dispose();
    }
  };
  assert.deepEqual(lengths('remaster', 'standard'), [300, 480, 480, 600, 600], 'tutorial 1-1, 8-minute stages, 10-minute boss enrage');
  assert.deepEqual(lengths('remaster', 'practice'), [150, 150, 150, 600, 600], 'practice shortens survival stages only');
  assert.deepEqual(lengths('classic', 'standard'), [720, 720, 720, 1020, 1020], 'classic keeps 0.1.0 lengths');
  assert.deepEqual(lengths('classic', 'practice'), [720, 720, 720, 1020, 1020], 'practice is a remaster pace');
});

test('practice runs are marked and pay 30% of the standard reward', () => {
  const clearWith = (paceMode) => {
    const { engine, settlements } = engineWith('remaster', paceMode);
    try {
      engine.startRun(1, 3, 77);
      engine.probe.setStageKills(40);
      engine.probe.setClock({ timeLeft: 0 });
      engine.probe.resolveRound();
      return settlements.at(-1);
    } finally {
      engine.dispose();
    }
  };
  const standard = clearWith('standard');
  const practice = clearWith('practice');
  assert.equal(standard.practice, false);
  assert.equal(practice.practice, true);
  assert.ok(practice.cleared);
  assert.ok(practice.gold <= Math.ceil(standard.gold * 0.3) && practice.gold >= Math.floor(standard.gold * 0.3) - 1);
  assert.ok(practice.xp <= Math.ceil(standard.xp * 0.3) && practice.xp >= Math.floor(standard.xp * 0.3) - 1);
});

test('field bosses keep their 36% and 72% marks on the shorter stages', () => {
  const { engine } = engineWith('remaster');
  try {
    engine.startRun(2, 2, 12);
    engine.probe.setSkills({});
    engine.probe.setGodMode();
    engine.probe.clear('enemies');
    const { duration } = engine.probe.read();
    assert.equal(duration, 480);
    engine.probe.setClock({ timeLeft: duration * (1 - 0.35) });
    engine.probe.step(1);
    assert.equal(engine.probe.read().enemies.some((enemy) => enemy.isBoss), false);
    engine.probe.setClock({ timeLeft: duration * (1 - 0.361) });
    engine.probe.step(1);
    assert.ok(engine.probe.read().enemies.some((enemy) => enemy.isBoss && enemy.boss.role === 'field'));
  } finally {
    engine.dispose();
  }
});
