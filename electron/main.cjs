const { app, BrowserWindow, Menu, crashReporter, net, protocol, session, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { APP_ENTRY, APP_ORIGIN, registerAppScheme, serveAppFiles } = require('./appProtocol.cjs');
const { migrateStorage } = require('./saveMigration.cjs');
const { createCrashLog, createReloadGate, rendererErrorLine } = require('./crashLog.cjs');
const {
  CONTENT_SECURITY_POLICY,
  focusPrimaryWindow,
  isAllowedAppNavigation,
  isAllowedExternalUrl,
  withContentSecurityPolicy,
} = require('./security.cjs');

const developerBuild = process.env.BLACKLINE_DEVELOPER_BUILD === '1';
const entryDirectory = developerBuild ? 'dist-developer' : 'dist';
const buildRoot = path.join(__dirname, '..', entryDirectory);
// TEC-15: the game loads from app://game/, a real secure origin; the scheme must be registered before ready.
registerAppScheme(protocol);
const windowTitle = developerBuild ? 'Blackline Survivor Dev' : 'Blackline Survivor';
const hasSingleInstanceLock = app.requestSingleInstanceLock();
// CON-04: the game keeps the run in play in localStorage, which Chromium writes to disk seconds later. Flushing every
// second keeps a force-quit, or a crash of the whole app, from losing more than about a second of it.
const STORAGE_FLUSH_MS = 1_000;

// Error resilience (TEC-14): native crash dumps and the error log stay in this app's data folder. Nothing is
// uploaded anywhere.
crashReporter.start({ uploadToServer: false });
let crashLog = null;
const localLog = () => {
  crashLog ??= createCrashLog(path.join(app.getPath('userData'), 'logs'));
  return crashLog;
};
const allowAutomaticReload = createReloadGate();

function watchForFailures(window) {
  const { webContents } = window;
  webContents.on('console-message', (details, level, message) => {
    const line = rendererErrorLine(details, level, message);
    if (line) localLog().append('renderer-error', line);
  });
  webContents.on('render-process-gone', (_event, details) => {
    localLog().append('renderer-gone', `${details.reason} (exit ${details.exitCode})`);
    // Bring the player back to the menu instead of leaving a blank window, unless it keeps crashing.
    if (details.reason !== 'clean-exit' && !window.isDestroyed() && allowAutomaticReload()) window.reload();
  });
  webContents.on('unresponsive', () => localLog().append('renderer-unresponsive', 'the page stopped responding'));
  webContents.on('responsive', () => localLog().append('renderer-responsive', 'the page responds again'));
}

// macOS needs role-based app and edit menus for Cmd+Q, Cmd+H, and Cmd+C/V (e.g. pasting a Challenge Seed).
// No custom items or navigation live here; other platforms keep the menu bar hidden (BUG-17).
function applicationMenu() {
  if (process.platform !== 'darwin') return null;
  return Menu.buildFromTemplate([
    { role: 'appMenu' },
    { role: 'editMenu' },
    { role: 'windowMenu' },
  ]);
}

function openExternal(url) {
  if (!isAllowedExternalUrl(url)) return;
  void shell.openExternal(url).catch(() => undefined);
}

/** Hidden, sandboxed windows on an empty bridge page, to reach one origin's localStorage during the save migration. */
const storageWindows = new WeakSet();
async function storageWindow(url) {
  const window = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  storageWindows.add(window);
  await window.loadURL(url);
  return window;
}

const READ_STORAGE = 'Object.fromEntries(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)]))';
const writeStorage = (entries) => `Object.entries(${JSON.stringify(entries)}).forEach(([key, value]) => localStorage.setItem(key, value)); true`;

/**
 * TEC-15: moves the saves and leaderboards the file:// origin kept to app:// on the first launch (saveMigration.cjs),
 * logging the outcome. In an unpackaged run, BLACKLINE_SEED_FILE_STORAGE (JSON) seeds the old origin first, for the
 * desktop smoke test.
 */
async function migrateSaves() {
  const bridge = 'storage-bridge.html';
  let oldWindow = null;
  let newWindow = null;
  const oldOrigin = async () => (oldWindow ??= await storageWindow(pathToFileURL(path.join(buildRoot, bridge)).href));
  const newOrigin = async () => (newWindow ??= await storageWindow(`${APP_ORIGIN}/${bridge}`));
  try {
    const seed = app.isPackaged ? undefined : process.env.BLACKLINE_SEED_FILE_STORAGE;
    if (seed) await (await oldOrigin()).webContents.executeJavaScript(writeStorage(JSON.parse(seed)));
    const result = await migrateStorage({
      readOld: async () => (await oldOrigin()).webContents.executeJavaScript(READ_STORAGE),
      readNew: async () => (await newOrigin()).webContents.executeJavaScript(READ_STORAGE),
      writeNew: async (entries) => (await newOrigin()).webContents.executeJavaScript(writeStorage(entries)),
      fs,
      dir: app.getPath('userData'),
    });
    if (result.status === 'failed') localLog().append('storage-migration', `not every entry arrived (${result.lost.join(', ')}); backup ${result.backup}`);
    else if (result.status === 'migrated') localLog().append('storage-migration', `moved ${result.moved}, kept ${result.kept}; backup ${result.backup}`);
  } catch (error) {
    localLog().append('storage-migration', error instanceof Error ? error.message : String(error));
  } finally {
    oldWindow?.destroy();
    newWindow?.destroy();
  }
}

function createWindow() {
  const window = new BrowserWindow({
    // Sizes are the page (canvas) size, not the outer frame: the 1440x900 reference view and the 1024x720
    // minimum from TEC-01 are what the game draws into.
    useContentSize: true,
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#f4f4f1',
    title: windowTitle,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false,
    },
  });

  window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({ responseHeaders: withContentSecurityPolicy(details.responseHeaders) });
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (isAllowedAppNavigation(url, APP_ENTRY)) return;
    event.preventDefault();
    openExternal(url);
  });
  window.webContents.on('will-redirect', (event, url) => {
    if (isAllowedAppNavigation(url, APP_ENTRY)) return;
    event.preventDefault();
    openExternal(url);
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  watchForFailures(window);
  return window;
}

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    focusPrimaryWindow(BrowserWindow.getAllWindows().filter((window) => !storageWindows.has(window)));
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(applicationMenu());
    serveAppFiles(protocol, net, buildRoot, { 'Content-Security-Policy': CONTENT_SECURITY_POLICY });
    // The game window comes first, so it stays the app's first window; it loads once the saves are in place.
    const window = createWindow();
    setInterval(() => session.defaultSession.flushStorageData(), STORAGE_FLUSH_MS);
    await migrateSaves();
    if (!window.isDestroyed()) void window.loadURL(APP_ENTRY);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) void createWindow().loadURL(APP_ENTRY);
    });
  });
}

app.on('child-process-gone', (_event, details) => {
  if (details.reason === 'clean-exit') return;
  localLog().append('process-gone', `${details.type} ${details.reason} (exit ${details.exitCode})`);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
