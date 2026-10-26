// Desktop smoke check (TEC-01, TEC-03, TEC-09, TEC-14, TEC-15, CON-04): launches the built app in Electron with a throwaway
// data folder, so the player's own save is never touched. It checks the window's content size, the app:// origin, the
// first-launch move of file:// saves (seeded into that folder first) with its backup and raw copy (BUG-22), sprite
// loading, a short run, the local error log, recovery after a renderer crash, a second launch that keeps the moved
// saves, and a run that survives a crash, a quit, and a force-quit.
// Usage: npm run build && npm run test:electron-smoke
import { mkdir, mkdtemp, readFile, readdir, realpath, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { _electron as electron } from 'playwright';
import { seedFileStorage } from './lib/seed-file-storage.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outputDir = path.resolve(process.env.ELECTRON_SMOKE_ARTIFACTS ?? 'artifacts/electron-smoke');
// realpath: on macOS the temp folder is reached through the /var -> /private/var link.
const userDataDir = await realpath(await mkdtemp(path.join(os.tmpdir(), 'blackline-electron-smoke-')));
const errorLogFile = path.join(userDataDir, 'logs', 'errors.log');

const results = [];
const record = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

/** Rejects if a step hangs, e.g. a call into a renderer that is restarting. */
function withTimeout(promise, timeoutMs) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs} ms`)), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function until(check, timeoutMs = 10_000, intervalMs = 100) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const value = await withTimeout(check(), 2_000);
      if (value) return value;
    } catch {
      // Not ready yet (for example the renderer is restarting).
    }
    if (Date.now() > deadline) return null;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

const readErrorLog = () => readFile(errorLogFile, 'utf8').catch(() => '');

/** The game's window: the migration opens hidden windows of its own first, so it is not always the first one. */
async function gameWindow(electronApp) {
  const page = await until(async () => electronApp.windows().find((candidate) => candidate.url().startsWith('app://game/index.html')) ?? null, 20_000);
  if (!page) throw new Error('the game window did not open');
  return page;
}

// TEC-15: what a player of a file:// build has in localStorage: a played save with its backup, a board, and a key
// that is not the game's. The first app:// launch must move every game entry (G17).
const SAVE_KEY = 'blackline-survivor-save-v2';
const BOARD_KEY = 'blackline-survivor-infinite-leaderboard-r2';
const playedSave = (gold) => JSON.stringify({
  version: 3,
  savedAt: Date.UTC(2026, 8, 30),
  meta: { gold, xp: 40, level: 6, passivePoints: 1, progress: { chapter: 1, stage: 3 }, upgrades: { attack: 5, maxHp: 2 }, passives: { bossHunter: 2 } },
  options: { volume: 0.5, uiScale: 1.2, reducedMotion: true },
  profile: { stageRecords: { '1-1': { attempts: 3, clears: 2, bestKills: 210, bestClearSeconds: 301 } }, hintsSeen: ['move'] },
});
const fileOriginStorage = {
  [SAVE_KEY]: playedSave(4321),
  [`${SAVE_KEY}.backup`]: playedSave(4000),
  [BOARD_KEY]: JSON.stringify({ rulesVersion: 2, playerName: 'KANG', entries: [{ id: 'smoke-1', player: 'KANG', score: 991, survivedSeconds: 412, kills: 830, bosses: 1, seed: 7, endedAt: '2026-09-30T00:00:00.000Z', rulesVersion: 2 }] }),
  'another-app-key': 'not ours',
};
const readStorage = (page) => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)])));
const savedMeta = (storage) => JSON.parse(storage[SAVE_KEY] ?? '{}').meta ?? {};
/** CON-04: the suspended run in the save, if any. */
const savedRun = (storage) => JSON.parse(storage[SAVE_KEY] ?? '{}').profile?.runSuspend ?? null;
const sameRun = (a, b) => Boolean(a && b) && a.state.ticks === b.state.ticks && JSON.stringify(a.state.log) === JSON.stringify(b.state.log);

async function settleDrafts(page) {
  for (let attempt = 0; attempt < 5 && (await page.getByRole('dialog').filter({ has: page.locator('.draftGrid') }).count()) > 0; attempt += 1) {
    await page.waitForTimeout(450);
    await page.keyboard.press('1');
    await page.waitForTimeout(150);
  }
}

/** Pauses the run and waits for the save to hold it, newer than `after` if given. */
async function pauseAndSave(page, after = null) {
  await settleDrafts(page);
  await page.keyboard.press('p');
  await page.getByRole('dialog', { name: '일시정지' }).waitFor({ timeout: 5_000 });
  return until(async () => {
    const run = savedRun(await readStorage(page));
    return run && (!after || run.savedAt > after.savedAt) ? run : null;
  }, 5_000);
}

/** Resumes the run the menu offers and waits for the save to hold the resumed run. */
async function resumeOffered(page, saved) {
  await page.getByRole('region', { name: '중단한 런' }).getByRole('button', { name: '이어하기' }).click({ timeout: 5_000 });
  await page.getByRole('dialog', { name: '일시정지' }).waitFor({ timeout: 20_000 });
  return until(async () => {
    const run = savedRun(await readStorage(page));
    return run && run.savedAt > saved.savedAt ? run : null;
  }, 5_000);
}
let pausedRun = null;
let killedRun = null;

await mkdir(outputDir, { recursive: true });
// ELECTRON_SMOKE_EXECUTABLE runs another Electron binary, such as a copy with the release fuses flipped
// (scripts/electron-fuse-smoke.mjs).
const executablePath = process.env.ELECTRON_SMOKE_EXECUTABLE || undefined;
// A file: build's saves, written by the stock Electron before the app under test first launches.
seedFileStorage(userDataDir, fileOriginStorage);
const app = await electron.launch({
  executablePath,
  args: [root, `--user-data-dir=${userDataDir}`],
  cwd: root,
});
try {
  const page = await gameWindow(app);
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor({ timeout: 20_000 });

  const origin = await page.evaluate(() => ({ origin: location.origin, secure: window.isSecureContext }));
  record('TEC-15 the game loads from app://game, a secure origin', origin.origin === 'app://game' && origin.secure, `${origin.origin} secure ${origin.secure}`);

  // The game saves once on start, so the moved save becomes its backup and the save a fresh write of it.
  const settled = (storage) => (storage[`${SAVE_KEY}.backup`] === fileOriginStorage[SAVE_KEY] ? storage : null);
  const moved = (await until(async () => settled(await readStorage(page)), 5_000)) ?? (await readStorage(page));
  const meta = savedMeta(moved);
  const wallet = (await page.locator('.wallet strong').first().innerText()).replace(/,/g, '');
  const intact = moved[`${SAVE_KEY}.backup`] === fileOriginStorage[SAVE_KEY]
    && moved[BOARD_KEY] === fileOriginStorage[BOARD_KEY]
    && meta.gold === 4321 && meta.upgrades?.attack === 5 && meta.passives?.bossHunter === 2 && meta.progress?.stage === 3
    && JSON.parse(moved[SAVE_KEY]).options?.uiScale === 1.2
    && JSON.parse(moved[SAVE_KEY]).profile?.stageRecords?.['1-1']?.clears === 2
    && !('another-app-key' in moved) && wallet === '4321';
  record('TEC-15 the first launch moves every file:// save entry to app:// (G17)', intact, `gold ${meta.gold}, wallet ${wallet}, board ${moved[BOARD_KEY] === fileOriginStorage[BOARD_KEY]}`);
  const dataFiles = await readdir(userDataDir);
  const backupFile = dataFiles.find((name) => name.startsWith('save-backup-file-origin-') && name.endsWith('.json'));
  const backup = backupFile ? JSON.parse(await readFile(path.join(userDataDir, backupFile), 'utf8')).entries ?? {} : {};
  record(
    'TEC-15 the move leaves a backup file (a save export) and a marker',
    dataFiles.includes('storage-migrated.json') && backup[SAVE_KEY] === fileOriginStorage[SAVE_KEY] && Object.keys(backup).length === 3,
    backupFile ?? 'no backup file',
  );
  // BUG-22: the old localStorage folder is copied as it was before it is read, and a move that worked tells the page nothing.
  const rawCopy = dataFiles.find((name) => /^save-raw-copy-file-origin-\d+$/.test(name));
  const rawFiles = rawCopy ? await readdir(path.join(userDataDir, rawCopy)) : [];
  const notices = await page.evaluate(() => ({ key: localStorage.getItem('blackline-desktop-save-move'), shown: document.querySelectorAll('.noticePath').length }));
  record(
    'BUG-22 the move keeps a raw copy of the old localStorage folder, and a move that worked shows no notice',
    rawFiles.includes('CURRENT') && !dataFiles.includes('storage-migration-pending.json') && notices.key === null && notices.shown === 0,
    `${rawCopy ?? 'no raw copy'}: ${rawFiles.length} files; notice ${notices.key ?? 'none'}`,
  );

  const paths = await app.evaluate(({ app: electronApp, crashReporter }) => ({
    userData: electronApp.getPath('userData'),
    crashDumps: electronApp.getPath('crashDumps'),
    uploads: crashReporter.getUploadToServer(),
  }));
  record('the app runs on a throwaway data folder', paths.userData === userDataDir, paths.userData);
  record('TEC-14 crash dumps stay on this machine', paths.uploads === false && paths.crashDumps.startsWith(userDataDir), `upload ${paths.uploads}`);

  const size = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  record('TEC-01 the page is 1440x900 inside the window frame', size.width === 1440 && size.height === 900, `${size.width}x${size.height}`);

  // TEC-09: the page's only desktop bridge is the window mode, it starts as a window, and the settings show it. The
  // smoke does not switch to full screen, which would take over the screen of the machine running it.
  const bridge = await page.evaluate(async () => {
    const api = window.blacklineDesktop;
    return api ? { keys: Object.keys(api).sort().join(','), node: typeof window.require, fullScreen: await api.fullScreen() } : null;
  });
  record('TEC-09 the page gets the window-mode bridge and nothing else from the desktop app', bridge?.keys === 'fullScreen,onFullScreen,setFullScreen' && bridge.node === 'undefined' && bridge.fullScreen === false, JSON.stringify(bridge));
  await page.getByRole('tab', { name: '설정' }).click();
  const modeSetting = await page.getByRole('combobox', { name: '화면 모드' }).inputValue().catch(() => null);
  record('TEC-09 the settings offer the window mode in the desktop app', modeSetting === 'window', String(modeSetting));
  await page.getByRole('tab', { name: '출정' }).click();

  const sprites = await until(() => page.evaluate(() => document.documentElement.dataset.sprites));
  record('TEC-03 sprite packs load under app://', sprites === 'ready', String(sprites));

  // UI-14: the menu opens on the stage the moved save plays next.
  const launch = page.getByRole('button', { name: 'Ch.1 / St.3 출정' });
  record('UI-14 the menu opens on the moved save\'s next stage', (await launch.count()) === 1);
  await launch.click();
  const timer = page.locator('.hudClock .timer');
  await timer.waitFor({ timeout: 5_000 });
  // CON-06: the moved save played chapter 1 before the story existed, so it has passed the prologue (G17).
  record('CON-06 a save from before the story starts its run without the prologue', (await page.locator('.storyPanels').count()) === 0);
  const startClock = await timer.innerText();
  await page.waitForTimeout(2_200);
  const laterClock = await timer.innerText();
  await page.screenshot({ path: path.join(outputDir, 'electron-run.png') });
  record('a stage runs in the desktop window', startClock !== laterClock, `${startClock} -> ${laterClock}`);
  record('no console errors during start and play', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '));

  // CON-04: a pause keeps the run in the save.
  pausedRun = await pauseAndSave(page);
  record('CON-04 pausing keeps the run in the save', Boolean(pausedRun), pausedRun ? `tick ${pausedRun.state.ticks}, ${pausedRun.state.log.length} commands` : 'no run saved');

  await page.evaluate(() => console.error('[blackline:error] {"source":"smoke","message":"electron smoke check"}'));
  const logged = await until(async () => (await readErrorLog()).includes('electron smoke check'), 5_000);
  record('TEC-14 renderer error lines reach the local error log', Boolean(logged), errorLogFile.replace(os.homedir(), '~'));

  // Crash on the next tick so this call returns before the renderer goes away.
  await app.evaluate(({ BrowserWindow }) => {
    const { webContents } = BrowserWindow.getAllWindows()[0];
    setTimeout(() => webContents.forcefullyCrashRenderer(), 50);
  });
  const recovered = await until(() => app.evaluate(async ({ BrowserWindow }) => {
    const { webContents } = BrowserWindow.getAllWindows()[0];
    if (webContents.isCrashed()) return null;
    const title = await webContents.executeJavaScript('document.querySelector("h1")?.textContent ?? ""');
    return title === '흑백 타격 생존전' ? title : null;
  }), 20_000, 250);
  const crashLine = (await readErrorLog()).split('\n').find((line) => line.includes('renderer-gone'));
  record('TEC-14 a renderer crash is logged and the window reloads to the menu', Boolean(recovered) && Boolean(crashLine), crashLine?.split(' ').slice(1).join(' ') ?? 'not logged');
  const offered = await until(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.executeJavaScript('document.getElementById("resume-title")?.textContent ?? ""')), 5_000, 250);
  record('CON-04 after a renderer crash the menu offers the run', offered === '중단한 런', offered || 'not offered');
} catch (error) {
  record('electron smoke (error)', false, error instanceof Error ? error.message.split('\n')[0] : String(error));
} finally {
  await app.close().catch(() => undefined);
}

// TEC-15: a second launch skips the move (the marker is there) and keeps what the app:// origin holds.
const again = await electron.launch({ executablePath, args: [root, `--user-data-dir=${userDataDir}`], cwd: root });
try {
  const page = await gameWindow(again);
  await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor({ timeout: 20_000 });
  const gold = savedMeta(await readStorage(page)).gold;
  const windows = await again.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length);
  record('TEC-15 a second launch keeps the moved saves without moving again', gold === 4321 && windows === 1, `gold ${gold}, windows ${windows}`);

  // CON-04: the run paused before the quit comes back at the tick it was saved at, with the same commands.
  const resumed = await resumeOffered(page, pausedRun);
  record('CON-04 after a quit the run resumes where it was saved', sameRun(pausedRun, resumed), `tick ${pausedRun?.state.ticks} -> ${resumed?.state.ticks}`);
  // Play on, pause, and force-quit 1.5 s later. The app flushes storage to disk every second, so the pause's save is
  // there to come back to.
  await page.getByRole('button', { name: '계속하기' }).click();
  await page.waitForTimeout(1_500);
  killedRun = await pauseAndSave(page, resumed);
  await page.waitForTimeout(1_500);
  again.process().kill('SIGKILL');
} catch (error) {
  record('electron smoke, second launch (error)', false, error instanceof Error ? error.message.split('\n')[0] : String(error));
} finally {
  await withTimeout(again.close(), 10_000).catch(() => undefined);
}

// CON-04: after the force-quit, the next launch offers the run as it was at the last pause, and resumes it there.
const third = await electron.launch({ executablePath, args: [root, `--user-data-dir=${userDataDir}`], cwd: root });
try {
  const page = await gameWindow(third);
  await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor({ timeout: 20_000 });
  const kept = savedRun(await readStorage(page));
  const resumed = kept && (await resumeOffered(page, kept));
  record(
    'CON-04 a force-quit keeps the run saved at the last pause, and it resumes there',
    Boolean(killedRun) && sameRun(killedRun, kept) && sameRun(kept, resumed),
    `tick ${killedRun?.state.ticks} -> kept ${kept?.state.ticks} -> resumed ${resumed?.state.ticks}`,
  );
} catch (error) {
  record('electron smoke, third launch (error)', false, error instanceof Error ? error.message.split('\n')[0] : String(error));
} finally {
  await third.close().catch(() => undefined);
  await rm(userDataDir, { recursive: true, force: true });
}

const failed = results.filter((result) => !result.passed);
console.log(`${results.length - failed.length}/${results.length} desktop checks passed`);
if (failed.length > 0) process.exitCode = 1;
