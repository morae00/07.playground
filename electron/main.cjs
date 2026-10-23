const { app, BrowserWindow, Menu, crashReporter, ipcMain, net, protocol, session, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { APP_ENTRY, APP_ORIGIN, registerAppScheme, serveAppFiles } = require('./appProtocol.cjs');
const { keepRawCopy, migrateStorage } = require('./saveMigration.cjs');
const { readLocalStorage } = require('./levelDbReader.cjs');
const { createCrashLog, createReloadGate, rendererErrorLine } = require('./crashLog.cjs');
const { isGameFrame, readWindowState, writeWindowState } = require('./windowState.cjs');
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

// macOS needs role-based app and edit menus for Cmd+Q, Cmd+H, and Cmd+C/V (e.g. pasting a Challenge Seed), and the
// full-screen toggle (Ctrl+Cmd+F, TEC-09). No custom items or navigation live here, and no reload or developer tools;
// other platforms keep the menu bar hidden (BUG-17).
function applicationMenu() {
  if (process.platform !== 'darwin') return null;
  return Menu.buildFromTemplate([
    { role: 'appMenu' },
    { role: 'editMenu' },
    { label: 'View', submenu: [{ role: 'togglefullscreen' }] },
    { role: 'windowMenu' },
  ]);
}

function openExternal(url) {
  if (!isAllowedExternalUrl(url)) return;
  void shell.openExternal(url).catch(() => undefined);
}

/** Hidden, sandboxed windows on an empty bridge page, to reach the app:// origin's localStorage during the save migration. */
const storageWindows = new WeakSet();
async function storageWindow(url) {
  const window = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  storageWindows.add(window);
  await window.loadURL(url);
  return window;
}

const READ_STORAGE = 'Object.fromEntries(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)]))';
/** Sets each entry; a null value removes the key. */
const writeStorage = (entries) => `Object.entries(${JSON.stringify(entries)}).forEach(([key, value]) => (value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value))); true`;

/** One error-log line for the move's outcome (saveMigration.cjs), or null when there is nothing to note. */
function migrationLogLine(result) {
  const files = `backup ${result.backup ?? 'none'}, raw copy ${result.rawCopy ?? `none${result.rawCopyError ? ` (${result.rawCopyError})` : ''}`}`;
  if (result.status === 'failed') {
    const what = result.lost ? `not every entry arrived (${result.lost.join(', ')})` : `${result.reason === 'read' ? 'could not read the old saves' : 'could not write the saves'}: ${result.error}`;
    return `${what}; tried again at the next launch; ${files}`;
  }
  if (result.status === 'migrated') {
    const notes = [result.replaced && 'replaced a new player\'s save or board', result.keptSave && 'kept the old save aside, the new one has progress'].filter(Boolean);
    return `moved ${result.moved}, kept ${result.kept}${notes.length > 0 ? ` (${notes.join('; ')})` : ''}; ${files}`;
  }
  return result.rawCopyError ? `raw copy failed (${result.rawCopyError})` : null;
}

/** Chromium's localStorage folder, where the file:// origin's saves are read from (D-25). */
const oldStorageFolder = () => path.join(app.getPath('userData'), 'Local Storage', 'leveldb');

/**
 * TEC-15, BUG-22: moves the saves and leaderboards the file:// origin kept to app:// (saveMigration.cjs), on every
 * launch until the move is done, logging the outcome. The old origin is read from Chromium's localStorage folder on
 * disk (D-25): with the file: fuse off a file: page cannot reach its localStorage. This runs before any page loads;
 * the raw copy of that folder was taken before the app was ready (keepRawCopy, below). The game page learns what the
 * player must know from one localStorage key the move leaves it.
 */
async function migrateSaves() {
  const bridge = 'storage-bridge.html';
  let newWindow = null;
  const newOrigin = async () => (newWindow ??= await storageWindow(`${APP_ORIGIN}/${bridge}`));
  const oldFolder = oldStorageFolder();
  try {
    const result = await migrateStorage({
      readOld: async () => readLocalStorage(oldFolder, 'file://'),
      readNew: async () => (await newOrigin()).webContents.executeJavaScript(READ_STORAGE),
      writeNew: async (entries) => (await newOrigin()).webContents.executeJavaScript(writeStorage(entries)),
      fs,
      dir: app.getPath('userData'),
      oldFolder,
      home: process.platform === 'win32' ? null : app.getPath('home'),
    });
    const line = migrationLogLine(result);
    if (line) localLog().append('storage-migration', line);
  } catch (error) {
    localLog().append('storage-migration', error instanceof Error ? error.message : String(error));
  } finally {
    newWindow?.destroy();
  }
}

function createWindow() {
  const stateDirectory = app.getPath('userData');
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
    // TEC-09: back in the mode it was left in.
    fullscreen: readWindowState(stateDirectory).fullScreen,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });
  // Whichever way the mode changes (the settings, the menu, the green button), it is kept and the page told.
  for (const event of ['enter-full-screen', 'leave-full-screen']) {
    window.on(event, () => {
      writeWindowState(stateDirectory, { fullScreen: window.isFullScreen() });
      if (!window.webContents.isDestroyed()) window.webContents.send('window:full-screen-changed', window.isFullScreen());
    });
  }

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

  // The window mode bridge (TEC-09): only the game's own top frame may read or switch it.
  const gameWindowOf = (event) => (isGameFrame(event, APP_ENTRY) ? BrowserWindow.fromWebContents(event.sender) : null);
  ipcMain.handle('window:full-screen', (event) => gameWindowOf(event)?.isFullScreen() ?? false);
  ipcMain.handle('window:set-full-screen', (event, on) => {
    const window = gameWindowOf(event);
    if (!window || typeof on !== 'boolean') return false;
    window.setFullScreen(on);
    return true;
  });

  // BUG-22: until the save move is done, the old localStorage folder is copied byte for byte now, before the app is
  // ready: Chromium opens that database as it starts, and may clean it up or start it over if it cannot open it.
  const rawCopy = keepRawCopy({ fs, dir: app.getPath('userData'), oldFolder: oldStorageFolder() });
  if (rawCopy.error) localLog().append('storage-migration', `raw copy failed (${rawCopy.error})`);

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
