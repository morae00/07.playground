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

function openExternal(url) {
  if (!isAllowedExternalUrl(url)) return;
  void shell.openExternal(url).catch(() => undefined);
}

function createWindow() {
  const window = new BrowserWindow({
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
    Menu.setApplicationMenu(null);
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
