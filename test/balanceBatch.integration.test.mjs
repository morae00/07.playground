import assert from 'node:assert/strict';
import test from 'node:test';
import { runBalanceBatch } from '../scripts/lib/balance-runner.mjs';

const smokeConfig = {
  frames: 180,
  seeds: [41, 43],
  stages: [{ chapter: 1, stage: 1 }, { chapter: 5, stage: 10 }],
};

test('seed batch balance output is deterministic and bounded', async () => {
  const first = await runBalanceBatch(smokeConfig);
  const second = await runBalanceBatch(smokeConfig);

  assert.deepEqual(second, first);
  assert.match(first.fingerprint, /^[a-f0-9]{16}$/);
  assert.equal(first.summary.scenarioCount, 4);
  assert.equal(first.summary.gameOvers, 0);
  assert.ok(first.summary.highWater.enemies <= 204);
  assert.ok(first.summary.highWater.pickups <= 240);
  assert.ok(first.scenarios.every((scenario) => scenario.elapsed > 0 && scenario.elapsed <= 3));
});

test('different seeds produce separately traceable scenarios', async () => {
  const report = await runBalanceBatch({
    frames: 180,
    seeds: [7, 8],
    stages: [{ chapter: 3, stage: 5 }],
  });

  assert.equal(new Set(report.scenarios.map((scenario) => scenario.seed)).size, 2);
  assert.ok(report.scenarios.every((scenario) => scenario.kind === 'midBoss'));
});
