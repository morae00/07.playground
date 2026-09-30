const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
