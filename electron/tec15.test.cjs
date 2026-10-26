const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { APP_ENTRY, appFilePath } = require('./appProtocol.cjs');
const { MARKER_FILE, migrateStorage } = require('./saveMigration.cjs');
const { DEVELOPER_APP_NAME, developerDataFolder } = require('./developerData.cjs');

test('app:// serves files from the build folder only', () => {
  const root = path.resolve('/app/dist');
  assert.equal(APP_ENTRY, 'app://game/index.html');
  assert.equal(appFilePath('app://game/index.html', root), path.join(root, 'index.html'));
  assert.equal(appFilePath('app://game/', root), path.join(root, 'index.html'));
  assert.equal(appFilePath('app://game/assets/atlas/manifest.json', root), path.join(root, 'assets/atlas/manifest.json'));
  assert.equal(appFilePath('app://game/assets/packs/sfx-common/hit%2Elight-0.wav', root), path.join(root, 'assets/packs/sfx-common/hit.light-0.wav'));
  // The URL parser folds dot segments, plain or percent-encoded, before we see them, so they cannot climb out.
  assert.equal(appFilePath('app://game/../secret.txt', root), path.join(root, 'secret.txt'));
  assert.equal(appFilePath('app://game/%2e%2e/secret.txt', root), path.join(root, 'secret.txt'));
  for (const outside of ['app://game/..%2fsecret.txt', 'app://game/assets/..%2f..%2fsecret.txt', 'app://other/index.html', 'file:///app/dist/index.html', 'app://game/%E0%A4%A']) {
    assert.equal(appFilePath(outside, root), null, outside);
  }
});

function memoryFs() {
  const files = new Map();
  return {
    files,
    existsSync: (file) => files.has(file),
    writeFileSync: (file, text) => files.set(file, text),
    mkdirSync() {},
  };
}

test('the first launch backs up the file:// saves, copies them, checks them, and marks the move', async () => {
  const fs = memoryFs();
  const oldStore = { 'blackline-survivor-save-v2': '{"gold":120}', 'blackline-survivor-infinite-leaderboard-v2': '[1]', 'unrelated': 'x' };
  const newStore = { 'blackline-survivor-infinite-leaderboard-v2': '[9]' };
  const result = await migrateStorage({
    readOld: async () => oldStore,
    readNew: async () => ({ ...newStore }),
    writeNew: async (entries) => Object.assign(newStore, entries),
    fs,
    dir: '/data',
    now: () => 7,
  });
  assert.equal(result.status, 'migrated');
  assert.deepEqual([result.moved, result.kept], [1, 1], 'the new origin keeps its own leaderboard');
  assert.equal(newStore['blackline-survivor-save-v2'], '{"gold":120}');
  assert.equal(newStore['blackline-survivor-infinite-leaderboard-v2'], '[9]');
  assert.equal('unrelated' in newStore, false, 'only the game\'s own keys move');
  const backup = JSON.parse(fs.files.get(path.join('/data', 'save-backup-file-origin-7.json')));
  assert.equal(backup.format, 'blackline-survivor-export', 'the backup is a save export, ready for a manual import');
  assert.deepEqual(backup.entries, { 'blackline-survivor-save-v2': '{"gold":120}', 'blackline-survivor-infinite-leaderboard-v2': '[1]' });
  assert.ok(fs.files.has(path.join('/data', MARKER_FILE)));
  const again = await migrateStorage({ readOld: async () => oldStore, readNew: async () => newStore, writeNew: async () => assert.fail('no second move'), fs, dir: '/data' });
  assert.equal(again.status, 'skipped');
});

test('a copy that does not read back intact leaves no marker, so the next launch tries again', async () => {
  const fs = memoryFs();
  const result = await migrateStorage({
    readOld: async () => ({ 'blackline-survivor-save-v2': '{"gold":120}' }),
    readNew: async () => ({}),
    writeNew: async () => {},
    fs,
    dir: '/data',
    now: () => 3,
  });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.lost, ['blackline-survivor-save-v2']);
  assert.equal(fs.files.has(path.join('/data', MARKER_FILE)), false);
  assert.ok(fs.files.has(path.join('/data', 'save-backup-file-origin-3.json')), 'the backup stays for a manual import');
});

test('a developer run keeps its own data folder, never the release app\'s, unless given a temporary one', () => {
  const appData = path.resolve('/Users/someone/Library/Application Support');
  assert.equal(developerDataFolder({ developerBuild: true, appData, userDataSwitch: false }), path.join(appData, 'Blackline Survivor Dev'));
  assert.equal(developerDataFolder({ developerBuild: false, appData, userDataSwitch: false }), null, 'the release app keeps Electron\'s folder');
  assert.equal(developerDataFolder({ developerBuild: true, appData, userDataSwitch: true }), null, 'an explicit --user-data-dir wins');
  // The packaged developer app is named the same, so both developer runs share one folder, apart from the release app.
  assert.equal(require('../electron-builder.developer.cjs').productName, DEVELOPER_APP_NAME);
  assert.notEqual(require('../package.json').productName, DEVELOPER_APP_NAME);
  // main.cjs moves the folder before anything reads it.
  const main = require('node:fs').readFileSync(path.join(__dirname, 'main.cjs'), 'utf8');
  const moved = main.indexOf("app.setPath('userData'");
  for (const reader of ['requestSingleInstanceLock(', 'crashReporter.start(', "getPath('userData')", 'keepRawCopy(']) {
    assert.ok(moved > 0 && moved < main.indexOf(reader), `the folder is set before ${reader}`);
  }
});
