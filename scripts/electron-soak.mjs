// Desktop soak (TEC-09): the real app in Electron on a throwaway data folder (never the player's save), played for
// SOAK_CAMPAIGN_MINUTES (default 15) of 5-10 at double speed and SOAK_INFINITE_MINUTES (default 30) of the infinite
// run. It uses the developer build for its cheats: GOD keeps the hero alive, drafts take their first card, and a
// cleared or lost stage starts again. It records every animation frame's interval, long tasks, the JS heap after a
// garbage collection, and any renderer crash, and fails unless (TEC-04 D-3, R4 exit): at most 1% of frames miss a
// vsync (an interval over 25 ms), the interval p99 is at most 33 ms, the heap grows at most 20 MiB over each phase,
// and nothing crashes.
// Usage: npm run build:developer && npm run test:electron-soak   (about 45 minutes; the window must stay open)
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { _electron as electron } from 'playwright';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const reportPath = path.resolve(process.env.SOAK_REPORT ?? path.join(root, 'artifacts/performance/electron-soak.json'));
const minutes = { campaign: Number(process.env.SOAK_CAMPAIGN_MINUTES ?? 15), infinite: Number(process.env.SOAK_INFINITE_MINUTES ?? 30) };
const GATE = Object.freeze({ missedShare: 0.01, p99Ms: 33, heapGrowthMiB: 20 });
const WARMUP_MS = 60_000;

const userDataDir = await realpath(await mkdtemp(path.join(os.tmpdir(), 'blackline-electron-soak-')));
const app = await electron.launch({
  // Throttling flags off: an occluded or background window must not slow its frames during the soak.
  args: [root, `--user-data-dir=${userDataDir}`, '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'],
  cwd: root,
  env: { ...process.env, BLACKLINE_DEVELOPER_BUILD: '1' },
});
const crashes = [];
// Other work on the machine skews frame times, so the report keeps the load average at the start and the end.
const report = { startedAt: new Date().toISOString(), loadAverage: { start: os.loadavg() }, minutes, gate: GATE, phases: [], crashes, failures: [] };

async function gameWindow() {
  for (let tries = 0; tries < 200; tries += 1) {
    const page = app.windows().find((candidate) => candidate.url().startsWith('app://game/index.html'));
    if (page) return page;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('the game window did not open');
}

async function cheat(page, code) {
  const opener = page.getByRole('button', { name: '개발 패널 열기' });
  if (await opener.count()) await opener.click();
  const input = page.getByPlaceholder('CODE', { exact: true });
  await input.fill(code);
  await input.press('Enter');
  const closer = page.getByRole('button', { name: '개발 패널 닫기' });
  if (await closer.count()) await closer.click();
}

/** Starts collecting frame intervals and long tasks in the page; the next call returns and resets them. */
const startFrames = (page) => page.evaluate(() => {
  const state = { intervals: [], longTasks: 0, last: performance.now() };
  window.__soak = state;
  const tick = (now) => {
    state.intervals.push(now - state.last);
    state.last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  try {
    new PerformanceObserver((list) => { state.longTasks += list.getEntries().length; }).observe({ type: 'longtask', buffered: false });
  } catch {
    state.longTasks = null;
  }
});
const takeFrames = (page) => page.evaluate(() => {
  const state = window.__soak;
  const intervals = state.intervals;
  state.intervals = [];
  const longTasks = state.longTasks;
  if (state.longTasks !== null) state.longTasks = 0;
  return { intervals, longTasks };
});

async function heapMiB(page) {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('HeapProfiler.collectGarbage');
    const { usedSize } = await cdp.send('Runtime.getHeapUsage');
    return usedSize / 1024 / 1024;
  } finally {
    await cdp.detach().catch(() => undefined);
  }
}

/** Keeps a run going: skips a story beat, takes a draft's first card, and starts a settled stage again. */
async function keepPlaying(page) {
  if (await page.locator('.storyPanels').count()) {
    await page.keyboard.press('Escape');
    return;
  }
  const draft = page.locator('.draftCard').first();
  if (await draft.count()) {
    await page.waitForTimeout(400);
    await page.keyboard.press('1');
    return;
  }
  const retry = page.getByRole('button', { name: '다시 도전', exact: true });
  if (await retry.count()) {
    await page.waitForTimeout(900);
    await retry.click();
    await page.waitForTimeout(600);
    await cheat(page, 'GOD');
    await setDoubleSpeed(page);
  }
}

async function setDoubleSpeed(page) {
  const faster = page.getByRole('button', { name: '게임 속도 2배속으로 변경' });
  if (await faster.count()) await faster.click();
}

async function phase(page, name, length) {
  const deadline = Date.now() + length * 60_000;
  await page.waitForTimeout(Math.min(WARMUP_MS, length * 60_000 / 4));
  const heapStart = await heapMiB(page);
  await startFrames(page);
  const intervals = [];
  let longTasks = 0;
  while (Date.now() < deadline) {
    await keepPlaying(page);
    await page.waitForTimeout(1_000);
    const batch = await takeFrames(page);
    intervals.push(...batch.intervals.slice(intervals.length === 0 ? 1 : 0));
    longTasks = batch.longTasks === null ? null : (longTasks ?? 0) + batch.longTasks;
  }
  const heapEnd = await heapMiB(page);
  const sorted = [...intervals].sort((a, b) => a - b);
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? null;
  const diagnostics = await page.evaluate(() => window.__blacklineDiagnostics?.() ?? null);
  const result = {
    name,
    minutes: length,
    frames: intervals.length,
    missedShare: intervals.length ? intervals.filter((value) => value > 25).length / intervals.length : null,
    p50: at(0.5),
    p95: at(0.95),
    p99: at(0.99),
    max: sorted.at(-1) ?? null,
    longTasks,
    heapStartMiB: heapStart,
    heapEndMiB: heapEnd,
    heapGrowthMiB: heapEnd - heapStart,
    enemies: diagnostics?.enemies ?? null,
    particles: diagnostics?.particles ?? null,
  };
  report.phases.push(result);
  const round = (value) => (value === null ? 'n/a' : value.toFixed(1));
  console.log(`${name}: ${result.frames} frames, missed ${(100 * (result.missedShare ?? 0)).toFixed(2)}%, p50 ${round(result.p50)} p95 ${round(result.p95)} p99 ${round(result.p99)} max ${round(result.max)} ms, long tasks ${result.longTasks}, heap ${round(heapStart)} -> ${round(heapEnd)} MiB`);
  if (result.missedShare === null || result.missedShare > GATE.missedShare) report.failures.push(`${name}: ${(100 * (result.missedShare ?? 1)).toFixed(2)}% missed frames (gate 1%)`);
  if (result.p99 === null || result.p99 > GATE.p99Ms) report.failures.push(`${name}: p99 ${round(result.p99)} ms (gate 33)`);
  if (result.heapGrowthMiB > GATE.heapGrowthMiB) report.failures.push(`${name}: heap grew ${round(result.heapGrowthMiB)} MiB (gate 20)`);
}

try {
  const page = await gameWindow();
  page.on('crash', () => crashes.push(`renderer crash at ${new Date().toISOString()}`));
  app.process().on('exit', (code) => { if (code) crashes.push(`app exited with ${code}`); });
  await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor({ timeout: 30_000 });
  const devToggle = page.getByRole('checkbox', { name: '개발자 모드: 모든 Stage 접근' });
  if (!(await devToggle.isChecked())) await devToggle.check();

  if (minutes.campaign > 0) {
    await page.locator('.chapterCard', { hasText: '5 ·' }).first().click();
    await page.locator('.stageNode').filter({ has: page.locator('span', { hasText: /^Stage 10$/ }) }).click();
    await page.getByRole('button', { name: 'Ch.5 / St.10 출정' }).click();
    const story = page.locator('.storyPanels');
    if (await story.waitFor({ timeout: 3_000 }).then(() => true, () => false)) await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    await cheat(page, 'GOD');
    await setDoubleSpeed(page);
    await phase(page, '5-10 x2', minutes.campaign);
    await page.keyboard.press('p');
    await page.getByRole('button', { name: 'Stage 메뉴' }).click();
    await page.getByRole('button', { name: '포기하고 정산' }).click();
    await page.waitForTimeout(2_000);
    await page.getByRole('button', { name: '메뉴로' }).click();
  }

  if (minutes.infinite > 0) {
    await page.getByRole('tab', { name: '무한 경쟁' }).click();
    await page.getByRole('button', { name: '무한 모드 시작' }).click();
    await page.waitForTimeout(800);
    await cheat(page, 'GOD');
    await phase(page, 'infinite', minutes.infinite);
  }
} catch (error) {
  report.failures.push(`soak error: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  report.crashes = crashes;
  if (crashes.length) report.failures.push(`${crashes.length} crash(es)`);
  report.endedAt = new Date().toISOString();
  report.loadAverage.end = os.loadavg();
  await app.close().catch(() => undefined);
  await rm(userDataDir, { recursive: true, force: true });
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(report.failures.length ? `soak failed:\n  ${report.failures.join('\n  ')}` : 'soak passed');
  console.log(`report: ${path.relative(process.cwd(), reportPath)}`);
  process.exitCode = report.failures.length ? 1 : 0;
}
