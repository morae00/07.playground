import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import {
  LEGACY_META_KEY,
  SAVE_BACKUP_KEY,
  SAVE_KEY,
  createDefaultMeta,
  createDefaultOptions,
  createDefaultProfile,
  loadGameSave,
  recordCareer,
  recordStageResult,
  saveGameSave,
  type SaveData,
} from './save.ts';
import { SAVE_MOVE_NOTICE_KEY, clearSaveMoveNotice, readSaveMoveNotice } from './saveMove.ts';
import { STORAGE_PREFIX, importSave } from './saveTransfer.ts';

// BUG-22: the desktop app's save move (electron/saveMigration.cjs) against the game's own save module. A failed first
// move is tried again at the next launch; it replaces the save the game started fresh in between, never one with
// progress, and the page tells the player what happened.
type Migration = { status: string; reason?: string; replaced?: boolean; keptSave?: boolean; backup?: string };
const migration = createRequire(import.meta.url)('../../electron/saveMigration.cjs') as {
  FRESH_META: unknown;
  FRESH_PROFILE: unknown;
  NOTICE_KEY: string;
  SAVE_KEYS: readonly string[];
  isFreshSave: (text: string) => boolean;
  migrateStorage: (options: object) => Promise<Migration>;
};
type Sample = { name: string; entries: Record<string, string> };
const { samples } = JSON.parse(readFileSync(new URL('./fixtures/saves-0.1.0.json', import.meta.url), 'utf8')) as { samples: Sample[] };

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    get length() {
      return values.size;
    },
    key: (index: number) => [...values.keys()][index] ?? null,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}
type MemoryStorage = ReturnType<typeof createStorage>;

function memoryFs() {
  const files = new Map<string, string>();
  return {
    files,
    existsSync: (file: string) => files.has(file),
    readFileSync: (file: string) => files.get(file) ?? '',
    writeFileSync: (file: string, text: string) => files.set(file, text),
    rmSync: (file: string) => files.delete(file),
    mkdirSync() {},
  };
}

/** One desktop launch's move, reading the old origin with `readOld` and writing the new one the way main.cjs does. */
function launch(newOrigin: MemoryStorage, fs: ReturnType<typeof memoryFs>, readOld: () => Promise<Record<string, string>>, at: number) {
  return migration.migrateStorage({
    readOld,
    readNew: async () => Object.fromEntries(newOrigin.values),
    writeNew: async (entries: Record<string, string | null>) => {
      for (const [key, value] of Object.entries(entries)) {
        if (value === null) newOrigin.removeItem(key);
        else newOrigin.setItem(key, value);
      }
    },
    fs,
    dir: '/data',
    now: () => at,
  });
}

/** The game page starting (App.tsx): it takes the move's notice, loads the save, and saves on mount. */
function gameStarts(storage: MemoryStorage) {
  const notice = readSaveMoveNotice(storage);
  clearSaveMoveNotice(storage);
  const loaded = loadGameSave(storage);
  if (loaded.writable) saveGameSave(storage, loaded.data);
  return { notice, loaded };
}

const newPlayer = (): SaveData => ({ meta: createDefaultMeta(), options: createDefaultOptions(), profile: createDefaultProfile() });
const written = (data: SaveData) => {
  const storage = createStorage();
  saveGameSave(storage, data);
  return storage.getItem(SAVE_KEY) ?? '';
};

test('BUG-22: the desktop move and the game agree on the save keys, the notice key, and the new player\'s save', () => {
  assert.deepEqual(migration.SAVE_KEYS, [SAVE_KEY, SAVE_BACKUP_KEY, LEGACY_META_KEY]);
  assert.equal(migration.NOTICE_KEY, SAVE_MOVE_NOTICE_KEY);
  assert.equal(SAVE_MOVE_NOTICE_KEY.startsWith(STORAGE_PREFIX), false, 'no export, import, or move carries the notice');
  assert.deepEqual(migration.FRESH_META, createDefaultMeta());
  const { hintsSeen, storySeen, ...profile } = createDefaultProfile();
  assert.deepEqual([hintsSeen, storySeen], [[], []]);
  assert.deepEqual(migration.FRESH_PROFILE, profile);
});

test('BUG-22: the save the game writes for a new player counts as fresh, whatever its settings; any progress does not', () => {
  assert.equal(migration.isFreshSave(written(newPlayer())), true);
  const settled = newPlayer();
  const tuned = { ...settled, options: { ...settled.options, volume: 0.2, reducedMotion: true }, profile: { ...settled.profile, hintsSeen: ['move'], storySeen: ['prologue'] } };
  assert.equal(migration.isFreshSave(written(tuned)), true, 'settings, hints, and story beats seen are not progress');
  const fresh = newPlayer();
  const attempt = { chapter: 1, stage: 1, cleared: false, kills: 4, clearSeconds: 30, practice: false };
  const progress: Record<string, SaveData> = {
    'a stage attempt': { ...fresh, profile: recordStageResult(fresh.profile, attempt) },
    'a practice run': { ...fresh, profile: recordCareer(fresh.profile, { cleared: false, kills: 4, bossKills: 0, clearSeconds: 30 }) },
    'gold': { ...fresh, meta: { ...fresh.meta, gold: fresh.meta.gold + 1 } },
    'account XP': { ...fresh, meta: { ...fresh.meta, xp: 5 } },
    'an upgrade': { ...fresh, meta: { ...fresh.meta, upgrades: { ...fresh.meta.upgrades, regen: 1 } } },
    'a stage unlocked': { ...fresh, meta: { ...fresh.meta, progress: { chapter: 1, stage: 2 } } },
    'a character bought': { ...fresh, profile: { ...fresh.profile, characters: { ...fresh.profile.characters, unlocked: ['gyeol', 'noeul'] } } },
    'a cosmetic owned': { ...fresh, profile: { ...fresh.profile, cosmetics: { ...fresh.profile.cosmetics, owned: ['outline-paper'] } } },
    'an achievement': { ...fresh, profile: { ...fresh.profile, achievements: { 'level-10': { unlockedAt: 1 } } } },
    'a codex entry': { ...fresh, profile: { ...fresh.profile, codex: { ...fresh.profile.codex, skills: ['needleStorm'] } } },
    'a suspended run': { ...fresh, profile: { ...fresh.profile, runSuspend: { savedAt: 1, rulesVersion: 2, state: { ticks: 1 } } } },
  };
  for (const [name, data] of Object.entries(progress)) assert.equal(migration.isFreshSave(written(data)), false, name);
  for (const sample of samples) {
    for (const [key, value] of Object.entries(sample.entries)) if (migration.SAVE_KEYS.includes(key)) assert.equal(migration.isFreshSave(value), false, `0.1.0 ${sample.name} ${key}`);
  }
});

test('BUG-22: a 0.1.0 player whose first desktop launch could not read the old saves gets them back at the next launch', async () => {
  for (const sample of samples) {
    const newOrigin = createStorage();
    const fs = memoryFs();
    const first = await launch(newOrigin, fs, async () => { throw new Error('leveldb: unknown block compression 2'); }, 1);
    assert.deepEqual([first.status, first.reason], ['failed', 'read'], sample.name);
    const opened = gameStarts(newOrigin);
    assert.equal(opened.notice?.status, 'failed', `${sample.name}: the player is told`);
    assert.equal(opened.loaded.status, 'defaulted', `${sample.name}: the game starts with a new player's save`);
    // A change in the settings saves again, so the new player's save is both the save and its backup.
    saveGameSave(newOrigin, { ...opened.loaded.data, options: { ...opened.loaded.data.options, volume: 0.4 } });

    const second = await launch(newOrigin, fs, async () => ({ ...sample.entries }), 2);
    assert.equal(second.status, 'migrated', sample.name);
    const reopened = gameStarts(newOrigin);
    assert.equal(reopened.notice, null, `${sample.name}: nothing more to tell`);
    assert.deepEqual(reopened.loaded.data, loadGameSave(createStorage(sample.entries)).data, `${sample.name}: the 0.1.0 progress is back`);
  }
});

test('BUG-22: progress made after a failed move is never overwritten; the old save stays in the backup file the notice names', async () => {
  const sample = samples.find((candidate) => candidate.name === 'campaign-complete');
  assert.ok(sample);
  const newOrigin = createStorage();
  const fs = memoryFs();
  await launch(newOrigin, fs, async () => { throw new Error('EIO'); }, 1);
  const { loaded } = gameStarts(newOrigin);
  const played = { ...loaded.data, profile: recordStageResult(loaded.data.profile, { chapter: 1, stage: 1, cleared: true, kills: 90, clearSeconds: 300, practice: false }) };
  saveGameSave(newOrigin, played);
  const before = newOrigin.getItem(SAVE_KEY);

  const second = await launch(newOrigin, fs, async () => ({ ...sample.entries }), 2);
  assert.equal(second.status, 'migrated');
  assert.equal(second.keptSave, true);
  assert.equal(newOrigin.getItem(SAVE_KEY), before, 'the save played after the failed move stays');
  const reopened = gameStarts(newOrigin);
  assert.deepEqual(reopened.notice, { status: 'kept', rawCopy: null, backup: second.backup });
  assert.equal(reopened.loaded.data.profile.stageRecords['1-1']?.clears, 1);
  const third = await launch(newOrigin, fs, async () => assert.fail('the move is done'), 3);
  assert.equal(third.status, 'skipped');

  // The player chooses the old save: the backup file imports as an export.
  assert.deepEqual(importSave(newOrigin, fs.files.get(second.backup ?? '') ?? ''), { ok: true, count: Object.keys(sample.entries).length });
  assert.deepEqual(loadGameSave(newOrigin).data, loadGameSave(createStorage(sample.entries)).data);
});

test('BUG-22: the page reads the move\'s notice once and ignores anything malformed', () => {
  const storage = createStorage();
  assert.equal(readSaveMoveNotice(storage), null, 'the web build has none');
  for (const text of ['nope', '"failed"', '{"status":"done"}', 'null']) {
    storage.setItem(SAVE_MOVE_NOTICE_KEY, text);
    assert.equal(readSaveMoveNotice(storage), null, text);
  }
  storage.setItem(SAVE_MOVE_NOTICE_KEY, JSON.stringify({ status: 'failed', rawCopy: '~/Library/Application Support/Blackline Survivor/save-raw-copy-file-origin-1', backup: 7 }));
  assert.deepEqual(readSaveMoveNotice(storage), { status: 'failed', rawCopy: '~/Library/Application Support/Blackline Survivor/save-raw-copy-file-origin-1', backup: null });
  storage.setItem(SAVE_MOVE_NOTICE_KEY, JSON.stringify({ status: 'kept', rawCopy: 'x'.repeat(2000), backup: '/data/save-backup-file-origin-2.json' }));
  assert.deepEqual(readSaveMoveNotice(storage), { status: 'kept', rawCopy: null, backup: '/data/save-backup-file-origin-2.json' });
  storage.setItem(SAVE_MOVE_NOTICE_KEY, JSON.stringify({ status: 'unreadable', rawCopy: '/data/save-raw-copy-file-origin-1' }));
  assert.deepEqual(readSaveMoveNotice(storage), { status: 'unreadable', rawCopy: '/data/save-raw-copy-file-origin-1', backup: null });
  clearSaveMoveNotice(storage);
  assert.equal(storage.getItem(SAVE_MOVE_NOTICE_KEY), null);
  const refusing = { getItem: () => { throw new Error('denied'); }, removeItem: () => { throw new Error('denied'); } };
  assert.equal(readSaveMoveNotice(refusing), null);
  assert.doesNotThrow(() => clearSaveMoveNotice(refusing));
});
