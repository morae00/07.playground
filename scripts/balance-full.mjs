import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { DEFAULT_STAGE_ADDRESSES } from './lib/balance-runner.mjs';
import { BALANCE_PERSONAS, DEFAULT_FULL_SEEDS, createFullBalanceReport, runFullBalanceBatch } from './lib/full-balance-runner.mjs';

function parseIntegerList(value) {
  if (!value) return undefined;
  const values = value.split(',').map((item) => Number.parseInt(item.trim(), 10));
  if (values.some((item) => !Number.isInteger(item))) throw new TypeError(`Invalid integer list: ${value}`);
  return values;
}

function parseStages(value) {
  if (!value) return DEFAULT_STAGE_ADDRESSES;
  return value.split(',').map((item) => {
    const [chapter, stage] = item.trim().split(':').map(Number);
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > 5 || !Number.isInteger(stage) || stage < 1 || stage > 10) {
      throw new TypeError(`Invalid stage address: ${item}`);
    }
    return { chapter, stage };
  });
}

function runSeedWorker({ bundlePath, seed, stages, maxFrames }) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./balance-full-worker.mjs', import.meta.url), {
      workerData: { bundlePath, seed, stages, maxFrames },
    });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Balance worker for seed ${seed} exited with code ${code}`));
    });
  });
}

async function runSeedWorkers({ bundlePath, seeds, stages, maxFrames, concurrency }) {
  const results = new Array(seeds.length);
  let cursor = 0;
  async function consume() {
    while (cursor < seeds.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await runSeedWorker({ bundlePath, seed: seeds[index], stages, maxFrames });
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, seeds.length) }, consume));
  return results;
}

const bundlePath = process.env.BLACKLINE_ENGINE_BUNDLE;
const seeds = parseIntegerList(process.env.BALANCE_FULL_SEEDS) ?? DEFAULT_FULL_SEEDS;
const stages = parseStages(process.env.BALANCE_FULL_STAGES);
const maxFrames = Number.parseInt(process.env.BALANCE_FULL_MAX_FRAMES ?? '72000', 10);
const parallel = process.env.BALANCE_FULL_PARALLEL !== '0' && seeds.length > 1;
const concurrency = Number.parseInt(process.env.BALANCE_FULL_WORKERS ?? '4', 10);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16) {
  throw new RangeError('BALANCE_FULL_WORKERS must be an integer within 1..16');
}
const report = parallel
  ? createFullBalanceReport({
      scenarios: (await runSeedWorkers({ bundlePath, seeds, stages, maxFrames, concurrency })).flat(),
      seeds,
      stages,
      personas: BALANCE_PERSONAS,
      maxFrames,
    })
  : await runFullBalanceBatch({ bundlePath, seeds, stages, maxFrames });
const outputPath = path.resolve(process.env.BALANCE_FULL_REPORT ?? 'artifacts/balance-full-report.json');
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ fingerprint: report.fingerprint, summary: report.summary, gates: report.gates, report: outputPath }, null, 2));
if (Object.values(report.gates).some((passed) => !passed)) process.exitCode = 1;
