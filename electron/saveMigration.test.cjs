const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  FRESH_META,
  FRESH_PROFILE,
  MARKER_FILE,
  NOTICE_KEY,
  PENDING_FILE,
  RAW_COPY_PREFIX,
  isFreshBoard,
  isFreshSave,
  keepRawCopy,
  migrateStorage,
} = require('./saveMigration.cjs');

// BUG-22: a first-launch move that fails must not cost a 0.1.0 player their progress. The game starts anyway and writes
// a new player's save; the next launch tries again and replaces that save, but never one with progress in it.
const SAVE = 'blackline-survivor-save-v2';
const BACKUP = `${SAVE}.backup`;
const LEGACY = 'blackline-survivor-meta-v1';
const BOARD = 'blackline-survivor-infinite-leaderboard-r2';
const OLD_BOARD = 'blackline-survivor-infinite-leaderboard-v1';

const oldSave = (gold) => JSON.stringify({ version: 2, savedAt: 1785841620000 + gold, meta: { gold, xp: 253, level: 40, passivePoints: 2, progress: { chapter: 3, stage: 4 } }, options: { volume: 0.4 } });
/** A 0.1.0 player's file:// storage. */
const OLD = { [SAVE]: oldSave(99999), [BACKUP]: oldSave(99000), [OLD_BOARD]: '{"entries":[{"score":991}]}', 'another-app': 'not ours' };
/** What the game writes when it starts with no save (src/platform/save.ts; saveMove.test.ts checks it against the real write). */
const freshSave = (savedAt, options = { volume: 0.8 }, seen = []) => JSON.stringify({ version: 3, savedAt, meta: FRESH_META, options, profile: { ...FRESH_PROFILE, hintsSeen: seen, storySeen: [] } });
const withProfile = (changes) => JSON.stringify({ ...JSON.parse(freshSave(5)), profile: { ...FRESH_PROFILE, hintsSeen: [], storySeen: [], ...changes } });

/** A throwaway data folder with an old localStorage folder in it, and `~` standing for its parent. */
function dataFolder() {
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'blackline-save-move-')));
  const dir = path.join(home, 'data');
  const oldFolder = path.join(dir, 'Local Storage', 'leveldb');
  fs.mkdirSync(oldFolder, { recursive: true });
  fs.writeFileSync(path.join(oldFolder, 'CURRENT'), 'MANIFEST-000001\n');
  fs.writeFileSync(path.join(oldFolder, 'LOCK'), '');
  fs.writeFileSync(path.join(oldFolder, '000003.log'), Buffer.from([0xde, 0xad, 0xbe, 0xef, 0, 1, 2, 3]));
  return { home, dir, oldFolder, cleanup: () => fs.rmSync(home, { recursive: true, force: true }) };
}

/** The app:// origin's localStorage, written the way main.cjs does it (a null value removes the key). */
function origin(initial = {}) {
  const values = { ...initial };
  return {
    values,
    readNew: async () => ({ ...values }),
    writeNew: async (entries) => {
      for (const [key, value] of Object.entries(entries)) {
        if (value === null) delete values[key];
        else values[key] = value;
      }
    },
  };
}

/** The game page after a failed move (App.tsx): it takes the notice, then saves on mount and again after a change. */
function gameStartsFresh(store) {
  const notice = store.values[NOTICE_KEY];
  delete store.values[NOTICE_KEY];
  store.values[SAVE] = freshSave(10);
  store.values[BACKUP] = store.values[SAVE];
  store.values[SAVE] = freshSave(11, { volume: 0.3 }, ['move']);
  return notice === undefined ? null : JSON.parse(notice);
}

/** app:// saves that hold progress, or might: none may be overwritten. */
const PROGRESS = {
  'a stage played': withProfile({ stageRecords: { '1-1': { attempts: 1, clears: 0, bestKills: 12, bestClearSeconds: null } }, stats: { runs: 1, clears: 0, kills: 12, bossKills: 0, playSeconds: 40 } }),
  'gold': JSON.stringify({ ...JSON.parse(freshSave(5)), meta: { ...FRESH_META, gold: 340 } }),
  'an upgrade': JSON.stringify({ ...JSON.parse(freshSave(5)), meta: { ...FRESH_META, upgrades: { ...FRESH_META.upgrades, attack: 1 } } }),
  'an achievement': withProfile({ achievements: { 'survive-300': { unlockedAt: 9 } } }),
  'a suspended run': withProfile({ runSuspend: { savedAt: 9, rulesVersion: 2, state: {} } }),
  'a character level': withProfile({ characters: { selected: 'gyeol', unlocked: ['gyeol'], levels: { gyeol: 1 } } }),
  'a codex entry': withProfile({ codex: { ...FRESH_PROFILE.codex, enemies: ['1-stalker'] } }),
  'an unknown field': withProfile({ arsenal: ['x'] }),
  'a field outside the envelope': JSON.stringify({ ...JSON.parse(freshSave(5)), extra: 1 }),
  'a newer build\'s save': JSON.stringify({ ...JSON.parse(freshSave(5)), version: 4 }),
  'a 0.1.0 save': oldSave(120),
  'damaged text': '{"version":3,"meta":',
};

const rawCopies = (dir) => fs.readdirSync(dir).filter((name) => name.startsWith(RAW_COPY_PREFIX));
const exists = (dir, name) => fs.existsSync(path.join(dir, name));

test('BUG-22: a read that throws leaves a raw copy, a notice, and no marker; the next launch restores the old saves over the new player\'s save', async () => {
  const { home, dir, oldFolder, cleanup } = dataFolder();
  try {
    const store = origin();
    const launch = (readOld, at) => migrateStorage({ readOld, readNew: store.readNew, writeNew: store.writeNew, fs, dir, oldFolder, home, now: () => at });
    let copiedBeforeRead = null;
    const first = await launch(async () => {
      copiedBeforeRead = rawCopies(dir);
      throw new Error('leveldb: unknown block compression 2');
    }, 1);
    assert.deepEqual(copiedBeforeRead, [`${RAW_COPY_PREFIX}1`], 'the raw copy is made before the old folder is parsed');
    assert.equal(first.status, 'failed');
    assert.equal(first.reason, 'read');
    assert.equal(exists(dir, MARKER_FILE), false, 'a failed move is not marked done');
    assert.ok(exists(dir, PENDING_FILE));
    const copy = path.join(dir, `${RAW_COPY_PREFIX}1`);
    assert.equal(first.rawCopy, copy);
    for (const name of fs.readdirSync(oldFolder)) assert.deepEqual(fs.readFileSync(path.join(copy, name)), fs.readFileSync(path.join(oldFolder, name)), `${name} is copied byte for byte`);
    assert.deepEqual(gameStartsFresh(store), { status: 'failed', rawCopy: path.join('~', 'data', `${RAW_COPY_PREFIX}1`), backup: null }, 'the page is told, with where the copy is');

    const second = await launch(async () => OLD, 2);
    assert.equal(second.status, 'migrated');
    assert.equal(second.replaced, true);
    assert.equal(second.keptSave, false);
    assert.deepEqual(store.values, { [SAVE]: OLD[SAVE], [BACKUP]: OLD[BACKUP], [OLD_BOARD]: OLD[OLD_BOARD] }, 'the old saves replace the new player\'s save, and the notice is gone');
    assert.ok(exists(dir, MARKER_FILE));
    assert.equal(exists(dir, PENDING_FILE), false);
    assert.deepEqual(rawCopies(dir), [`${RAW_COPY_PREFIX}1`], 'the first raw copy is kept, and no second one is made');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'save-backup-file-origin-2.json'), 'utf8')).entries, { [SAVE]: OLD[SAVE], [BACKUP]: OLD[BACKUP], [OLD_BOARD]: OLD[OLD_BOARD] });

    const third = await launch(async () => assert.fail('no read once the move is done'), 3);
    assert.equal(third.status, 'skipped');
  } finally {
    cleanup();
  }
});

test('BUG-22: only a save with no progress counts as fresh', () => {
  assert.equal(isFreshSave(freshSave(1)), true);
  assert.equal(isFreshSave(freshSave(2, { volume: 0, uiScale: 1.3 }, ['move', 'upgrade'])), true, 'settings and hints seen are not progress');
  assert.equal(isFreshSave(withProfile({ storySeen: ['prologue'] })), true, 'nor are story beats seen');
  const older = '{"version":3,"savedAt":1,"meta":{"gold":120,"xp":0,"level":1,"passivePoints":0,"progress":{"chapter":1,"stage":1}},"options":{},"profile":{"stageRecords":{},"characters":{"selected":"gyeol","unlocked":["gyeol"]},"codex":{"enemies":[],"bosses":[],"skills":[]},"achievements":{},"runSuspend":null,"hintsSeen":[]}}';
  assert.equal(isFreshSave(older), true, 'a field an older build did not write loads as the new player\'s');
  assert.equal(isFreshSave('{"version":3,"savedAt":1}'), true, 'so does a save with no meta or profile at all');
  for (const [name, text] of Object.entries(PROGRESS)) assert.equal(isFreshSave(text), false, name);
  assert.equal(isFreshBoard('{"rulesVersion":2,"playerName":"KANG","entries":[]}'), true);
  for (const text of ['{"entries":[{"score":1}]}', '{}', '[]', 'nope']) assert.equal(isFreshBoard(text), false, text);
});

test('BUG-22: a save with progress on app:// is never overwritten; the old save is set aside, the page told, and the move done', async () => {
  for (const [name, progress] of Object.entries(PROGRESS)) {
    const { home, dir, cleanup } = dataFolder();
    try {
      const store = origin({ [SAVE]: progress, [BACKUP]: freshSave(4) });
      const result = await migrateStorage({ readOld: async () => OLD, readNew: store.readNew, writeNew: store.writeNew, fs, dir, home, now: () => 7 });
      assert.equal(result.status, 'migrated', name);
      assert.equal(result.keptSave, true, name);
      assert.equal(store.values[SAVE], progress, `${name}: never overwritten`);
      assert.equal(store.values[BACKUP], freshSave(4), `${name}: the save's own backup is not mixed with the old one`);
      assert.equal(store.values[OLD_BOARD], OLD[OLD_BOARD], `${name}: entries the new origin lacks still move`);
      assert.ok(exists(dir, MARKER_FILE), name);
      assert.deepEqual(JSON.parse(store.values[NOTICE_KEY]), { status: 'kept', rawCopy: null, backup: path.join('~', 'data', 'save-backup-file-origin-7.json') }, name);
      assert.deepEqual(JSON.parse(fs.readFileSync(result.backup, 'utf8')).entries[SAVE], OLD[SAVE], `${name}: the old save is in the backup file`);
    } finally {
      cleanup();
    }
  }
});

test('BUG-22: the marker is written only when every entry arrived', async () => {
  const cases = {
    'the read throws': { readOld: async () => { throw new Error('EIO'); } },
    'the writes do not stick': { writeNew: async () => {} },
    'the new origin cannot be reached': { readNew: async () => { throw new Error('the bridge page did not load'); } },
    'a removal does not stick': {
      initial: { [SAVE]: freshSave(1) },
      readOld: async () => ({ [LEGACY]: '{"gold":900}' }),
      writeNew: async function keepsKeys(entries) { Object.assign(this.values, Object.fromEntries(Object.entries(entries).filter(([, value]) => value !== null))); },
    },
  };
  for (const [name, faults] of Object.entries(cases)) {
    const { dir, cleanup } = dataFolder();
    try {
      const store = origin(faults.initial);
      const result = await migrateStorage({
        readOld: faults.readOld ?? (async () => OLD),
        readNew: faults.readNew ?? store.readNew,
        writeNew: faults.writeNew ? faults.writeNew.bind(store) : store.writeNew,
        fs,
        dir,
        now: () => 3,
      });
      assert.equal(result.status, 'failed', name);
      assert.equal(exists(dir, MARKER_FILE), false, `${name}: no marker`);
      assert.ok(exists(dir, PENDING_FILE), `${name}: the next launch tries again`);
    } finally {
      cleanup();
    }
  }
  const { dir, cleanup } = dataFolder();
  try {
    fs.writeFileSync(path.join(dir, PENDING_FILE), '{"at":1,"reason":"read","delivered":[]}');
    const store = origin();
    const result = await migrateStorage({ readOld: async () => OLD, readNew: store.readNew, writeNew: store.writeNew, fs, dir, now: () => 4 });
    assert.equal(result.status, 'migrated');
    assert.ok(exists(dir, MARKER_FILE));
    assert.equal(exists(dir, PENDING_FILE), false, 'a finished move clears the failed one\'s record');
  } finally {
    cleanup();
  }
});

test('BUG-22: a 0.1.0 legacy meta replaces a fresh save, which would otherwise hide it', async () => {
  const { dir, cleanup } = dataFolder();
  try {
    const store = origin({ [SAVE]: freshSave(2), [BACKUP]: freshSave(1), [NOTICE_KEY]: '{"status":"failed"}' });
    const legacy = '{"gold":900,"level":8}';
    const result = await migrateStorage({ readOld: async () => ({ [LEGACY]: legacy }), readNew: store.readNew, writeNew: store.writeNew, fs, dir, now: () => 5 });
    assert.equal(result.status, 'migrated');
    assert.deepEqual(store.values, { [LEGACY]: legacy }, 'the game loads the legacy meta when no save is in front of it; a notice left over is cleared');
  } finally {
    cleanup();
  }
});

test('BUG-22: a save that already arrived in a failed attempt and was played on is not reported as set aside', async () => {
  const { dir, cleanup } = dataFolder();
  try {
    const store = origin();
    const dropsBoard = async (entries) => store.writeNew(Object.fromEntries(Object.entries(entries).filter(([key]) => key !== OLD_BOARD)));
    const first = await migrateStorage({ readOld: async () => OLD, readNew: store.readNew, writeNew: dropsBoard, fs, dir, now: () => 1 });
    assert.equal(first.status, 'failed');
    assert.deepEqual(first.lost, [OLD_BOARD]);
    // The game loads the moved save and plays on: two writes later neither save entry is the old text.
    delete store.values[NOTICE_KEY];
    store.values[BACKUP] = withProfile({ stats: { runs: 1, clears: 1, kills: 50, bossKills: 0, playSeconds: 300 } });
    store.values[SAVE] = withProfile({ stats: { runs: 2, clears: 1, kills: 80, bossKills: 0, playSeconds: 500 } });
    const played = { ...store.values };
    const second = await migrateStorage({ readOld: async () => OLD, readNew: store.readNew, writeNew: store.writeNew, fs, dir, now: () => 2 });
    assert.equal(second.status, 'migrated');
    assert.equal(second.keptSave, false);
    assert.deepEqual(store.values, { ...played, [OLD_BOARD]: OLD[OLD_BOARD] }, 'the board arrives, the save played on stays, and no notice is left');
  } finally {
    cleanup();
  }
});

test('BUG-22: a leaderboard with no runs is replaced by the old one; one with runs is kept', async () => {
  const { dir, cleanup } = dataFolder();
  try {
    const old = { [BOARD]: '{"rulesVersion":2,"playerName":"KANG","entries":[{"score":5}]}', 'blackline-survivor-infinite-leaderboard-r1': '{"entries":[{"score":3}]}' };
    const store = origin({ [BOARD]: '{"rulesVersion":2,"playerName":"PLAYER","entries":[]}', 'blackline-survivor-infinite-leaderboard-r1': '{"entries":[{"score":8}]}' });
    const result = await migrateStorage({ readOld: async () => old, readNew: store.readNew, writeNew: store.writeNew, fs, dir, now: () => 6 });
    assert.equal(result.status, 'migrated');
    assert.equal(store.values[BOARD], old[BOARD]);
    assert.equal(store.values['blackline-survivor-infinite-leaderboard-r1'], '{"entries":[{"score":8}]}');
  } finally {
    cleanup();
  }
});

test('BUG-22: a raw copy cut short is replaced, a whole one is kept, and a copy that fails does not stop the move', async () => {
  const { dir, oldFolder, cleanup } = dataFolder();
  try {
    fs.mkdirSync(path.join(dir, `${RAW_COPY_PREFIX}1.partial`));
    const run = (fileSystem, at) => {
      const store = origin();
      return migrateStorage({ readOld: async () => { throw new Error('EIO'); }, readNew: store.readNew, writeNew: store.writeNew, fs: fileSystem, dir, oldFolder, now: () => at });
    };
    const failing = { ...fs, cpSync: () => { throw new Error('ENOSPC'); } };
    const noCopy = await run(failing, 2);
    assert.equal(noCopy.rawCopy, null);
    assert.equal(noCopy.rawCopyError, 'ENOSPC');
    assert.equal(noCopy.reason, 'read', 'the move still runs');
    assert.deepEqual(rawCopies(dir), [], 'the copy cut short is gone');
    assert.equal((await run(fs, 3)).rawCopy, path.join(dir, `${RAW_COPY_PREFIX}3`));
    assert.equal((await run(fs, 4)).rawCopy, path.join(dir, `${RAW_COPY_PREFIX}3`));
    assert.deepEqual(rawCopies(dir), [`${RAW_COPY_PREFIX}3`]);
    fs.rmSync(oldFolder, { recursive: true });
    fs.rmSync(path.join(dir, `${RAW_COPY_PREFIX}3`), { recursive: true });
    const store = origin();
    const empty = await migrateStorage({ readOld: async () => ({}), readNew: store.readNew, writeNew: store.writeNew, fs, dir, oldFolder, now: () => 5 });
    assert.deepEqual([empty.status, empty.rawCopy], ['empty', null], 'no old folder, nothing to copy');
  } finally {
    cleanup();
  }
});

test('BUG-22: old saves that could not be read and are then gone end the move, and the player is told where the raw copy is', async () => {
  const { home, dir, oldFolder, cleanup } = dataFolder();
  try {
    const store = origin();
    const launch = (readOld, at) => migrateStorage({ readOld, readNew: store.readNew, writeNew: store.writeNew, fs, dir, oldFolder, home, now: () => at });
    await launch(async () => { throw new Error('leveldb: not a table'); }, 1);
    gameStartsFresh(store);
    // Chromium could not open the folder either, so it started an empty one: the old origin has nothing left.
    const second = await launch(async () => ({}), 2);
    assert.deepEqual([second.status, second.unreadable], ['empty', true]);
    assert.ok(exists(dir, MARKER_FILE), 'nothing is left to try again');
    assert.deepEqual(JSON.parse(store.values[NOTICE_KEY]), { status: 'unreadable', rawCopy: path.join('~', 'data', `${RAW_COPY_PREFIX}1`), backup: null });
    assert.equal(store.values[SAVE], freshSave(11, { volume: 0.3 }, ['move']), 'the save the game started stays');
  } finally {
    cleanup();
  }
});

test('BUG-22: a marker that cannot be written leaves the move to the next launch without alarming the player', async () => {
  const { dir, cleanup } = dataFolder();
  try {
    const store = origin();
    const noMarker = { ...fs, writeFileSync: (file, ...rest) => (path.basename(file) === MARKER_FILE ? (() => { throw new Error('EACCES'); })() : fs.writeFileSync(file, ...rest)) };
    const result = await migrateStorage({ readOld: async () => OLD, readNew: store.readNew, writeNew: store.writeNew, fs: noMarker, dir, now: () => 8 });
    assert.equal(result.status, 'failed');
    assert.equal(NOTICE_KEY in store.values, false, 'every entry arrived, so the page has nothing to say');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, PENDING_FILE), 'utf8')).delivered.sort(), [BACKUP, OLD_BOARD, SAVE].sort());
  } finally {
    cleanup();
  }
});

test('BUG-22: the raw copy taken before the app is ready is the one the move keeps, and none is taken once the move is done', async () => {
  const { dir, oldFolder, cleanup } = dataFolder();
  try {
    const early = keepRawCopy({ fs, dir, oldFolder, now: () => 1 });
    assert.deepEqual(early, { rawCopy: path.join(dir, `${RAW_COPY_PREFIX}1`), error: null });
    // Chromium then opens the folder and drops what it does not reference, before the move reads it.
    fs.rmSync(path.join(oldFolder, '000003.log'));
    const store = origin();
    const result = await migrateStorage({ readOld: async () => OLD, readNew: store.readNew, writeNew: store.writeNew, fs, dir, oldFolder, now: () => 2 });
    assert.equal(result.rawCopy, early.rawCopy);
    assert.ok(fs.existsSync(path.join(early.rawCopy, '000003.log')), 'the copy holds the folder as it was before the app started');
    assert.deepEqual(keepRawCopy({ fs, dir, oldFolder, now: () => 3 }), { rawCopy: null, error: null }, 'the move is done');
    assert.deepEqual(rawCopies(dir), [`${RAW_COPY_PREFIX}1`]);
    fs.rmSync(path.join(dir, MARKER_FILE));
    fs.rmSync(early.rawCopy, { recursive: true });
    assert.deepEqual(keepRawCopy({ fs: { ...fs, cpSync: () => { throw new Error('ENOSPC'); } }, dir, oldFolder, now: () => 4 }), { rawCopy: null, error: 'ENOSPC' }, 'it never throws');
  } finally {
    cleanup();
  }
});

test('BUG-22: an old save with no progress is left out without a notice', async () => {
  const { dir, cleanup } = dataFolder();
  try {
    const store = origin({ [SAVE]: PROGRESS.gold });
    const result = await migrateStorage({ readOld: async () => ({ [SAVE]: freshSave(1) }), readNew: store.readNew, writeNew: store.writeNew, fs, dir, now: () => 9 });
    assert.deepEqual([result.status, result.keptSave], ['migrated', false]);
    assert.deepEqual(store.values, { [SAVE]: PROGRESS.gold });
  } finally {
    cleanup();
  }
});
