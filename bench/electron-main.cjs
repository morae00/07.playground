// Render benchmark window (TEC-04): the product's window size and renderer settings, loading the bench page.
// Launched by scripts/render-bench.mjs; not part of the packaged app.
const { app, BrowserWindow } = require('electron');
const path = require('node:path');

app.whenReady().then(() => {
  const window = new BrowserWindow({
    useContentSize: true,
    width: 1440,
    height: 900,
    backgroundColor: '#f4f4f1',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });
  const query = JSON.parse(process.env.BENCH_QUERY ?? '{}');
  void window.loadFile(path.join(__dirname, '..', 'dist-bench', 'index.html'), { query });
});

app.on('window-all-closed', () => app.quit());
