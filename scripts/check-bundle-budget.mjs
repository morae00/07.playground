import { gzipSync } from 'node:zlib';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { evaluateBundleBudget } from './lib/bundle-budget.mjs';

const assetsRoot = path.resolve(process.env.BUNDLE_ASSETS_ROOT ?? 'dist/assets');
const outputPath = path.resolve(process.env.BUNDLE_BUDGET_REPORT ?? 'artifacts/release-evidence/bundle-budget.json');
const warningBytes = Number.parseInt(process.env.BUNDLE_WARNING_BYTES ?? `${105 * 1024}`, 10);
const hardLimitBytes = Number.parseInt(process.env.BUNDLE_HARD_LIMIT_BYTES ?? `${120 * 1024}`, 10);
const growthLimitRatio = Number.parseFloat(process.env.BUNDLE_GROWTH_LIMIT_RATIO ?? '0.1');
const baselinePath = path.resolve(process.env.BUNDLE_BASELINE_REPORT ?? 'config/bundle-baseline.json');
let baselineBytes = null;
try {
  const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
  baselineBytes = baseline.gzipBytes;
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
const files = (await readdir(assetsRoot)).filter((file) => file.endsWith('.js')).sort();
if (files.length === 0) throw new Error(`No JavaScript bundles found under ${assetsRoot}`);

const bundles = [];
let gzipBytes = 0;
for (const file of files) {
  const source = await readFile(path.join(assetsRoot, file));
  const compressedBytes = gzipSync(source, { level: 9 }).byteLength;
  gzipBytes += compressedBytes;
  bundles.push({ file, sourceBytes: source.byteLength, gzipBytes: compressedBytes });
}

const budget = evaluateBundleBudget(gzipBytes, { warningBytes, hardLimitBytes, baselineBytes, growthLimitRatio });
const report = { version: 1, ...budget, bundles };
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Bundle budget ${budget.status}: ${budget.kib} KiB gzip (warning ${warningBytes / 1024} KiB, hard ${hardLimitBytes / 1024} KiB)`);
if (budget.growthRatio !== null) console.log(`Bundle growth ${(budget.growthRatio * 100).toFixed(2)}% (limit ${(growthLimitRatio * 100).toFixed(0)}%)`);
if (!budget.passed) process.exitCode = 1;
