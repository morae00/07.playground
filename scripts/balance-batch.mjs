import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runBalanceBatch } from './lib/balance-runner.mjs';
import { resolveEngineBundle } from './lib/engine-bundle.mjs';

function parseIntegerList(value) {
  if (!value) return undefined;
  const values = value.split(',').map((item) => Number.parseInt(item.trim(), 10));
  if (values.some((item) => !Number.isInteger(item))) throw new TypeError(`Invalid BALANCE_SEEDS: ${value}`);
  return values;
}

const frames = Number.parseInt(process.env.BALANCE_FRAMES ?? '1200', 10);
const report = await runBalanceBatch({
  bundlePath: resolveEngineBundle(),
  frames,
  seeds: parseIntegerList(process.env.BALANCE_SEEDS),
});
const output = `${JSON.stringify(report, null, 2)}\n`;

if (process.env.BALANCE_REPORT) {
  const reportPath = path.resolve(process.env.BALANCE_REPORT);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, output, 'utf8');
}
process.stdout.write(output);

const gates = {
  scenarios: report.summary.scenarioCount === report.summary.stageCount * report.summary.seedCount,
  noGameOvers: report.summary.gameOvers === 0,
  enemyCap: report.summary.highWater.enemies <= 204,
  pickupCap: report.summary.highWater.pickups <= 240,
};
if (Object.values(gates).some((passed) => !passed)) process.exitCode = 1;
