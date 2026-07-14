import assert from 'node:assert/strict';
import test from 'node:test';
import { BALANCE_PERSONAS, DEFAULT_FULL_SEEDS, createFullBalanceReport, selectBalanceOffer } from '../scripts/lib/full-balance-runner.mjs';

test('release balance matrix owns ten unique deterministic seeds', () => {
  assert.equal(DEFAULT_FULL_SEEDS.length, 10);
  assert.equal(new Set(DEFAULT_FULL_SEEDS).size, 10);
});

test('balance personas secure three active skills before specialization', () => {
  const survivor = BALANCE_PERSONAS.find((persona) => persona.id === 'survivor');
  const cards = [
    { kind: 'skill', skillId: 'ironFrame' },
    { kind: 'skill', skillId: 'chainSpark' },
  ];
  assert.equal(selectBalanceOffer(cards, survivor, { skills: { needleStorm: { level: 1 }, frostLine: { level: 1 } } }).skillId, 'chainSpark');
  assert.equal(selectBalanceOffer(cards, survivor, { skills: { needleStorm: { level: 1 }, frostLine: { level: 1 }, orbitScythes: { level: 1 } } }).skillId, 'ironFrame');
});

test('full balance shards merge into canonical stage, persona, and seed order', () => {
  const personas = [{ id: 'first' }, { id: 'second' }];
  const stages = [{ chapter: 1, stage: 1 }];
  const seeds = [17, 1337];
  const scenario = (persona, baseSeed) => ({
    chapter: 1,
    stage: 1,
    persona,
    baseSeed,
    seed: baseSeed,
    kind: 'normal',
    outcome: 'clear',
    elapsed: 10,
    kills: 1,
    coins: 1,
    skillCount: 2,
  });
  const report = createFullBalanceReport({
    scenarios: [scenario('second', 1337), scenario('first', 1337), scenario('second', 17), scenario('first', 17)],
    seeds,
    stages,
    personas,
    maxFrames: 100,
  });

  assert.deepEqual(report.scenarios.map(({ persona, baseSeed }) => [persona, baseSeed]), [
    ['first', 17], ['first', 1337], ['second', 17], ['second', 1337],
  ]);
  assert.deepEqual(report.gates, {
    completeMatrix: true,
    noInvalidOutcomes: true,
    noTimeouts: true,
    buildGrowthObserved: true,
    personaClearsObserved: true,
    stageKindClearsObserved: true,
  });
  assert.equal(report.outliers.length, 4);
  assert.equal(report.outliers[0].elapsed, 10);
});
