import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { DEFAULT_BUDGET_POLICY, classifyBundleFile, evaluateBudgetPolicy, evaluateBundleBudget } from '../scripts/lib/bundle-budget.mjs';
import { auditProductionBundle, PRODUCTION_BANNED_MARKERS } from '../scripts/lib/production-integrity.mjs';

test('production bundle audit accepts ordinary game assets', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'blackline-production-safe-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'assets'));
  await writeFile(path.join(root, 'index.html'), '<main>Blackline Survivor</main>');
  await writeFile(path.join(root, 'assets', 'app.js'), 'console.log("Stage ready")');

  const report = await auditProductionBundle(root);
  assert.equal(report.passed, true);
  assert.deepEqual(report.findings, []);
  assert.equal(report.markersChecked, PRODUCTION_BANNED_MARKERS.length);
});

test('production bundle audit reports every leaked debug marker and file', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'blackline-production-leak-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'index.html'), '<label>개발자 모드: 모든 Stage 접근</label>');
  await writeFile(path.join(root, 'app.js'), 'const command = "GOLD999"; const result = "GOD ON";');

  const report = await auditProductionBundle(root);
  assert.equal(report.passed, false);
  assert.deepEqual(report.findings, [
    { file: 'app.js', marker: 'GOLD999' },
    { file: 'app.js', marker: 'GOD ON' },
    { file: 'index.html', marker: '개발자 모드: 모든 Stage 접근' },
  ]);
});

test('production bundle audit fails closed when no assets exist', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'blackline-production-empty-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(() => auditProductionBundle(root), /no auditable text assets/);
});

test('bundle budget warns before its hard release limit', () => {
  assert.equal(evaluateBundleBudget(104 * 1024).status, 'passed');
  assert.equal(evaluateBundleBudget(110 * 1024).status, 'warning');
  assert.equal(evaluateBundleBudget(121 * 1024).status, 'failed');
  assert.equal(evaluateBundleBudget(121 * 1024).passed, false);
});

test('bundle budget blocks growth above the release baseline', () => {
  const passed = evaluateBundleBudget(109, { warningBytes: 105, hardLimitBytes: 120, baselineBytes: 100, growthLimitRatio: 0.1 });
  const failed = evaluateBundleBudget(111, { warningBytes: 105, hardLimitBytes: 120, baselineBytes: 100, growthLimitRatio: 0.1 });
  assert.equal(passed.growthPassed, true);
  assert.equal(passed.passed, true);
  assert.equal(failed.growthPassed, false);
  assert.equal(failed.passed, false);
});

test('bundle files are classified into app, vendor, style, and asset budgets', () => {
  assert.equal(classifyBundleFile('assets/index-DjfSWYE6.js'), 'appJs');
  assert.equal(classifyBundleFile('assets/vendor-sXpfDjey.js'), 'vendorJs');
  assert.equal(classifyBundleFile('assets/index-Df9yCSvW.css'), 'css');
  assert.equal(classifyBundleFile('assets/packs/ch1/atlas-hero.webp'), 'image');
  assert.equal(classifyBundleFile('assets/sfx/hit.ogg'), 'audio');
  assert.equal(classifyBundleFile('assets/fonts/body.woff2'), 'font');
  assert.equal(classifyBundleFile('assets/packs/ch1/atlas-hero.json'), 'data');
});

test('three-way budget warns at 15% app growth and fails at 25%', () => {
  const baseline = { appJsGzip: 100_000, vendorJsGzip: 60_000 };
  const measured = { appJsGzip: 100_000, vendorJsGzip: 60_000, cssGzip: 5_000, initialAssetBytes: 0, installAssetBytes: 0 };
  assert.equal(evaluateBudgetPolicy(measured, baseline, DEFAULT_BUDGET_POLICY).status, 'passed');
  assert.equal(evaluateBudgetPolicy({ ...measured, appJsGzip: 116_000 }, baseline, DEFAULT_BUDGET_POLICY).status, 'warning');
  const failed = evaluateBudgetPolicy({ ...measured, appJsGzip: 126_000 }, baseline, DEFAULT_BUDGET_POLICY);
  assert.equal(failed.passed, false);
  assert.equal(failed.budgets.appJs.status, 'failed');
});

test('three-way budget caps vendor JavaScript and initial asset bytes absolutely', () => {
  const baseline = { appJsGzip: 100_000, vendorJsGzip: 60_000 };
  const measured = { appJsGzip: 100_000, vendorJsGzip: 60_000, cssGzip: 5_000, initialAssetBytes: 0, installAssetBytes: 0 };
  assert.equal(evaluateBudgetPolicy({ ...measured, vendorJsGzip: 99 * 1024 }, baseline, DEFAULT_BUDGET_POLICY).budgets.vendorJs.status, 'failed');
  const heavy = evaluateBudgetPolicy({ ...measured, initialAssetBytes: 5 * 1024 * 1024, installAssetBytes: 5 * 1024 * 1024 }, baseline, DEFAULT_BUDGET_POLICY);
  assert.equal(heavy.budgets.initialAssets.status, 'failed');
  assert.equal(heavy.budgets.installAssets.status, 'passed');
});

test('production bundle audit also scans JSON data files for leaked markers', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'blackline-production-json-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'index.html'), '<main>Blackline Survivor</main>');
  await writeFile(path.join(root, 'manifest.json'), '{"label":"DEV MODE ON"}');
  const report = await auditProductionBundle(root);
  assert.deepEqual(report.findings, [{ file: 'manifest.json', marker: 'DEV MODE ON' }]);
});
