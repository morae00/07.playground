import { parentPort, workerData } from 'node:worker_threads';
import { runFullBalanceBatch } from './lib/full-balance-runner.mjs';

if (!parentPort) throw new Error('The full balance worker requires a parent thread');

const report = await runFullBalanceBatch({
  bundlePath: workerData.bundlePath,
  seeds: [workerData.seed],
  stages: workerData.stages,
  maxFrames: workerData.maxFrames,
});
parentPort.postMessage(report.scenarios);
