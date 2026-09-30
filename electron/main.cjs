const { app, BrowserWindow, Menu, crashReporter, shell } = require('electron');
const path = require('node:path');
const { createCrashLog, createReloadGate, rendererErrorLine } = require('./crashLog.cjs');
const {
  focusPrimaryWindow,
  isAllowedAppNavigation,
  isAllowedExternalUrl,
  withContentSecurityPolicy,
} = require('./security.cjs');

const developerBuild = process.env.BLACKLINE_DEVELOPER_BUILD === '1';
const entryDirectory = developerBuild ? 'dist-developer' : 'dist';
const entryFile = path.join(__dirname, '..', entryDirectory, 'index.html');
const windowTitle = developerBuild ? 'Blackline Survivor Dev' : 'Blackline Survivor';
const hasSingleInstanceLock = app.requestSingleInstanceLock();

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
    if (isAllowedAppNavigation(url, entryFile)) return;
    event.preventDefault();
    openExternal(url);
  });
  window.webContents.on('will-redirect', (event, url) => {
    if (isAllowedAppNavigation(url, entryFile)) return;
    event.preventDefault();
    openExternal(url);
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  watchForFailures(window);
  void window.loadFile(entryFile);
}

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    focusPrimaryWindow(BrowserWindow.getAllWindows());
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(applicationMenu());
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
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
