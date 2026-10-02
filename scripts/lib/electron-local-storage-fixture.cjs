// Electron main script for scripts/make-local-storage-fixture.mjs: writes file: origin localStorage the way a 0.1.0
// build did, in two launches (GEN_STEP 1 and 2). The first sets the entries and 90 large fillers, waits for Chromium
// to commit them, and removes the fillers, so the folder gets a compacted Snappy table; the second overwrites one
// entry, removes one, and adds one, which stay in the log.
const { app, BrowserWindow, session } = require('electron');
const step = process.env.GEN_STEP;
app.setPath('userData', process.env.GEN_USER_DATA);
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true } });
  await window.loadFile(process.env.GEN_PAGE);
  const script = step === '1'
    ? `(async () => {localStorage.setItem('blackline-survivor-save', JSON.stringify({ version: 2, meta: { gold: 4321, note: '먹선 골목 — 결' } }));
       localStorage.setItem('blackline-survivor-save-backup', 'x'.repeat(5000));
       localStorage.setItem('blackline-survivor-infinite-leaderboard', JSON.stringify([{ name: '결', score: 12345 }]));
       localStorage.setItem('blackline-survivor-gone', 'removed later');
       localStorage.setItem('other-app-key', 'not ours');
       for (let i = 0; i < 90; i += 1) localStorage.setItem('filler-' + i, ('먹선' + i + ' ').repeat(9000) + Math.random());
       await new Promise((resolve) => setTimeout(resolve, 8000));
       for (let i = 0; i < 90; i += 1) localStorage.removeItem('filler-' + i);
       await new Promise((resolve) => setTimeout(resolve, 8000));
       return JSON.stringify(Object.keys(localStorage)); })()`
    : `localStorage.setItem('blackline-survivor-save', JSON.stringify({ version: 2, meta: { gold: 9999, note: '덮어씀 ✓' } }));
       localStorage.removeItem('blackline-survivor-gone');
       localStorage.setItem('blackline-survivor-meta', 'latin only ascii');
       JSON.stringify(Object.keys(localStorage))`;
  console.log('keys', await window.webContents.executeJavaScript(script));
  window.destroy();
  session.defaultSession.flushStorageData();
  setTimeout(() => app.quit(), 500);
});
