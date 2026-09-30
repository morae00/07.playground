// Desktop smoke check (TEC-01, TEC-03, TEC-14): launches the built app in Electron with a throwaway data folder,
// so the player's own save is never touched, and checks the window's content size, sprite loading under
// file://, a short run, the local error log, and recovery after a renderer crash.
// Usage: npm run build && npm run test:electron-smoke
import { mkdir, mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { _electron as electron } from 'playwright';

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

await mkdir(outputDir, { recursive: true });
const app = await electron.launch({ args: [root, `--user-data-dir=${userDataDir}`], cwd: root });
try {
  const page = await app.firstWindow();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor({ timeout: 20_000 });

  const paths = await app.evaluate(({ app: electronApp, crashReporter }) => ({
    userData: electronApp.getPath('userData'),
    crashDumps: electronApp.getPath('crashDumps'),
    uploads: crashReporter.getUploadToServer(),
  }));
  record('the app runs on a throwaway data folder', paths.userData === userDataDir, paths.userData);
  record('TEC-14 crash dumps stay on this machine', paths.uploads === false && paths.crashDumps.startsWith(userDataDir), `upload ${paths.uploads}`);

  const size = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  record('TEC-01 the page is 1440x900 inside the window frame', size.width === 1440 && size.height === 900, `${size.width}x${size.height}`);

  const sprites = await until(() => page.evaluate(() => document.documentElement.dataset.sprites));
  record('TEC-03 sprite packs load under file://', sprites === 'ready', String(sprites));

  await page.getByRole('button', { name: 'Ch.1 / St.1 시작' }).click();
  const timer = page.locator('.hudClock .timer');
  await timer.waitFor({ timeout: 5_000 });
  const startClock = await timer.innerText();
  await page.waitForTimeout(2_200);
  const laterClock = await timer.innerText();
  await page.screenshot({ path: path.join(outputDir, 'electron-run.png') });
  record('a stage runs in the desktop window', startClock !== laterClock, `${startClock} -> ${laterClock}`);
  record('no console errors during start and play', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '));

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
} catch (error) {
  record('electron smoke (error)', false, error instanceof Error ? error.message.split('\n')[0] : String(error));
} finally {
  await app.close().catch(() => undefined);
  await rm(userDataDir, { recursive: true, force: true });
}

const failed = results.filter((result) => !result.passed);
console.log(`${results.length - failed.length}/${results.length} desktop checks passed`);
if (failed.length > 0) process.exitCode = 1;
