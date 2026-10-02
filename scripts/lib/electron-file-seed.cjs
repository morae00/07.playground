// Electron main script for the desktop tools: writes entries into the file: origin's localStorage of a data folder,
// the way a 0.1.0 (file:) build kept its saves, then flushes them to disk and quits. It runs on the stock Electron in
// node_modules, whose file: fuse is on, so the app under test can then be any binary (scripts/lib/seed-file-storage.mjs).
const { app, BrowserWindow, session } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

app.setPath('userData', process.env.SEED_USER_DATA);
// Closing the page must not end the app before the entries are flushed and the note is written.
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  await window.loadFile(process.env.SEED_PAGE);
  const entries = JSON.parse(process.env.SEED_ENTRIES);
  const count = await window.webContents.executeJavaScript(`(() => { const entries = ${JSON.stringify(entries)}; for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value); return Object.keys(localStorage).length; })()`);
  window.destroy();
  session.defaultSession.flushStorageData();
  // The caller reads this note to know the entries are on disk, then removes it.
  setTimeout(() => {
    fs.writeFileSync(path.join(process.env.SEED_USER_DATA, 'file-seed.json'), JSON.stringify({ count }));
    app.quit();
  }, 500);
});
