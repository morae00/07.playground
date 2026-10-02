// Render benchmark runner (TEC-04): builds the bench page (src/bench/renderBench.ts) and measures the real
// renderer in Electron at 1440x900 for each configuration: device pixel ratio, render scale, and sprites or
// vectors. Writes artifacts/performance/render-bench.json and prints a table.
// Usage: npm run bench:render   (desktop session; BENCH_SECONDS and BENCH_WARMUP override the window)
import { copyFile, cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';
import { _electron as electron } from 'playwright';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'dist-bench');
const reportPath = path.resolve(process.env.BENCH_REPORT ?? path.join(root, 'artifacts/performance/render-bench.json'));
const seconds = Number(process.env.BENCH_SECONDS ?? '12');
const warmup = Number(process.env.BENCH_WARMUP ?? '4');

// The stress scene is the backlog's fixed load; the game scenes are real stages late in their clock, which take
// longer to fill up with enemies.
const CONFIGS = [
  { name: 'stress DPR1 1.0 sprites', scene: 'stress', dpr: 1, scale: 1, sprites: true },
  { name: 'stress DPR2 2.0 sprites', scene: 'stress', dpr: 2, scale: 2, sprites: true },
  { name: 'stress DPR2 1.5 sprites', scene: 'stress', dpr: 2, scale: 1.5, sprites: true },
  { name: 'stress DPR2 2.0 vectors', scene: 'stress', dpr: 2, scale: 2, sprites: false },
  { name: 'stress DPR1 1.0 vectors', scene: 'stress', dpr: 1, scale: 1, sprites: false },
  // One final boss stage per chapter, each with its chapter pack (the R2 chapter gate).
  ...[1, 2, 3, 4, 5].flatMap((chapter) => [
    { name: `C${chapter}S10 DPR2 2.0 sprites`, scene: 'game', chapter, stage: 10, dpr: 2, scale: 2, sprites: true, warmup: 20 },
    { name: `C${chapter}S10 DPR1 1.0 sprites`, scene: 'game', chapter, stage: 10, dpr: 1, scale: 1, sprites: true, warmup: 20 },
  ]),
  // Frame rate unlocked (no vsync): intervals show the whole frame cost, GPU included, i.e. the headroom that a
  // 60 Hz vsync hides.
  { name: 'unlocked stress DPR2 2.0 sprites', scene: 'stress', dpr: 2, scale: 2, sprites: true, unlocked: true },
  { name: 'unlocked stress DPR2 2.0 vectors', scene: 'stress', dpr: 2, scale: 2, sprites: false, unlocked: true },
  { name: 'unlocked stress DPR1 1.0 sprites', scene: 'stress', dpr: 1, scale: 1, sprites: true, unlocked: true },
];
const only = process.env.BENCH_ONLY ? new RegExp(process.env.BENCH_ONLY) : null;

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await build({
  entryPoints: [path.join(root, 'src/bench/renderBench.ts')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  outfile: path.join(outDir, 'bench.js'),
  define: { __APP_VERSION__: '"bench"', __DEVELOPER_UI_AVAILABLE__: 'false', __DEVELOPER_UI_DEFAULT_ENABLED__: 'false' },
  logLevel: 'warning',
});
await copyFile(path.join(root, 'bench/render.html'), path.join(outDir, 'index.html'));
await copyFile(path.join(root, 'bench/bench.css'), path.join(outDir, 'bench.css'));
await cp(path.join(root, 'public/assets'), path.join(outDir, 'assets'), { recursive: true });

const results = [];
for (const config of CONFIGS.filter((item) => !only || only.test(item.name))) {
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), 'blackline-render-bench-'));
  const app = await electron.launch({
    args: [
      path.join(root, 'bench/electron-main.cjs'),
      `--force-device-scale-factor=${config.dpr}`,
      `--user-data-dir=${userDataDir}`,
      ...(config.unlocked ? ['--disable-frame-rate-limit', '--disable-gpu-vsync'] : []),
    ],
    cwd: root,
    env: {
      ...process.env,
      BENCH_QUERY: JSON.stringify({
        scene: config.scene,
        chapter: String(config.chapter ?? 5),
        stage: String(config.stage ?? 10),
        scale: String(config.scale),
        sprites: config.sprites ? 'on' : 'off',
        seconds: String(seconds),
        warmup: String(Math.max(warmup, config.warmup ?? 0)),
      }),
    },
  });
  try {
    const page = await app.firstWindow();
    const deadline = Date.now() + (seconds + Math.max(warmup, config.warmup ?? 0) + 40) * 1_000;
    let outcome = null;
    while (!outcome && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      outcome = await page.evaluate(() => (window.__benchResult ? { result: window.__benchResult } : window.__benchError ? { error: window.__benchError } : null)).catch(() => null);
    }
    if (!outcome) throw new Error(`${config.name}: no result before the deadline`);
    if (outcome.error) throw new Error(`${config.name}: ${outcome.error}`);
    results.push({ name: config.name, ...outcome.result });
    const { intervalMs, frameWorkMs, renderWorkMs, config: used, meanCounts } = outcome.result;
    console.log(`${config.name.padEnd(33)} ${used.backingStore.padEnd(9)} interval p50 ${intervalMs.p50} p95 ${intervalMs.p95} p99 ${intervalMs.p99} max ${intervalMs.max} | work p95 ${frameWorkMs.p95} render p95 ${renderWorkMs.p95} | slow ${intervalMs.slowFrames} very ${intervalMs.verySlowFrames}/${outcome.result.frames} | mean enemies ${meanCounts.enemies} shots ${meanCounts.hostileShots} own ${meanCounts.projectiles} particles ${meanCounts.particles} numbers ${meanCounts.damageNumbers}`);
  } finally {
    await app.close().catch(() => undefined);
    await rm(userDataDir, { recursive: true, force: true });
  }
}

// D-22: the release gate is TEC-04's D-3. With vsync, at most 1% of frames miss a vsync (an interval over 1.5 periods)
// and in-frame work p95 is at most 8 ms; with the frame rate unlocked, the frame interval p95 is at most 11 ms.
const GATE = Object.freeze({ missedShare: 0.01, workP95Ms: 8, unlockedP95Ms: 11 });
const failures = results.flatMap((result) => {
  const config = CONFIGS.find((item) => item.name === result.name);
  if (config?.unlocked) return result.intervalMs.p95 > GATE.unlockedP95Ms ? [`${result.name}: interval p95 ${result.intervalMs.p95} ms > ${GATE.unlockedP95Ms} ms`] : [];
  const missed = result.intervalMs.missedFrames / Math.max(1, result.frames);
  return [
    ...(missed > GATE.missedShare ? [`${result.name}: ${(missed * 100).toFixed(2)}% of frames missed a vsync > ${GATE.missedShare * 100}%`] : []),
    ...(result.frameWorkMs.p95 > GATE.workP95Ms ? [`${result.name}: work p95 ${result.frameWorkMs.p95} ms > ${GATE.workP95Ms} ms`] : []),
  ];
});

const report = {
  version: 1,
  recordedAt: new Date().toISOString(),
  machine: { platform: process.platform, arch: process.arch, cpus: os.cpus()[0]?.model ?? 'unknown', memoryGiB: Math.round(os.totalmem() / 2 ** 30) },
  gate: { viewport: '1440x900', ...GATE, failures },
  results,
};
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`report: ${path.relative(root, reportPath)}`);
if (process.env.BENCH_GATE === '1') {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  console.log(failures.length === 0 ? `performance gate passed (${results.length} configurations)` : `performance gate failed (${failures.length})`);
  if (failures.length > 0 || results.length === 0) process.exitCode = 1;
}
