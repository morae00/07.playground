import { gzipSync } from 'node:zlib';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_BUDGET_POLICY, classifyBundleFile, evaluateBudgetPolicy } from './lib/bundle-budget.mjs';

const distRoot = path.resolve(process.env.BUNDLE_DIST_ROOT ?? 'dist');
const outputPath = path.resolve(process.env.BUNDLE_BUDGET_REPORT ?? 'artifacts/release-evidence/bundle-budget.json');
const baselinePath = path.resolve(process.env.BUNDLE_BASELINE_REPORT ?? 'config/bundle-baseline.json');

const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
if (baseline.version !== 2) throw new Error(`${baselinePath} must use bundle baseline version 2 (app/vendor split)`);
const policy = baseline.policy ?? DEFAULT_BUDGET_POLICY;

async function collectFiles(root) {
  const files = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile()) files.push(target);
    }
  }
  await visit(root);
  return files.sort();
}

const files = await collectFiles(distRoot);
const bundles = [];
const totals = { appJsGzip: 0, vendorJsGzip: 0, cssGzip: 0, initialAssetBytes: 0, installAssetBytes: 0 };
for (const file of files) {
  const relative = path.relative(distRoot, file);
  if (relative === 'index.html') continue;
  const category = classifyBundleFile(relative);
  const source = await readFile(file);
  const gzipBytes = gzipSync(source, { level: 9 }).byteLength;
  bundles.push({ file: relative, category, sourceBytes: source.byteLength, gzipBytes });
  if (category === 'appJs') totals.appJsGzip += gzipBytes;
  else if (category === 'vendorJs') totals.vendorJsGzip += gzipBytes;
  else if (category === 'css') totals.cssGzip += gzipBytes;
  else {
    // Chapter packs will live under assets/packs/; everything else loads with the first screen.
    totals.installAssetBytes += source.byteLength;
    if (!relative.split(path.sep).includes('packs')) totals.initialAssetBytes += source.byteLength;
  }
}
if (totals.appJsGzip === 0) throw new Error(`No application JavaScript found under ${distRoot}`);

const result = evaluateBudgetPolicy(totals, baseline, policy);
const report = { version: 2, baseline: { appJsGzip: baseline.appJsGzip, vendorJsGzip: baseline.vendorJsGzip, recordedAt: baseline.recordedAt }, ...result, bundles };
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

for (const [name, budget] of Object.entries(result.budgets)) {
  const growth = typeof budget.growthRatio === 'number' ? `, growth ${(budget.growthRatio * 100).toFixed(2)}%` : '';
  console.log(`Budget ${name} ${budget.status}: ${budget.kib} KiB (warning ${(budget.warningBytes / 1024).toFixed(1)} KiB, fail ${(budget.failBytes / 1024).toFixed(1)} KiB${growth})`);
}
if (!result.passed) process.exitCode = 1;
