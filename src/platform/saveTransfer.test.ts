import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { INFINITE_LEADERBOARD_KEY } from './infiniteLeaderboard.ts';
import { SAVE_BACKUP_KEY, SAVE_KEY, SAVE_VERSION, createDefaultMeta, createDefaultOptions, createDefaultProfile, loadGameSave, saveGameSave } from './save.ts';
import { EXPORT_FORMAT, exportSave, gameEntries, importSave } from './saveTransfer.ts';

function createStorage(initial: Record<string, string> = {}, failOnWrite = Infinity) {
  const values = new Map(Object.entries(initial));
  let writes = 0;
  return {
    values,
    get length() {
      return values.size;
    },
    key: (index: number) => [...values.keys()][index] ?? null,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      writes += 1;
      if (writes === failOnWrite) throw new Error('QuotaExceededError');
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

/** A played save: gold, upgrades, progress, options, stage records, and an infinite board (G17). */
function playedStorage() {
  const storage = createStorage({ 'other-app': 'keep me' });
  const meta = { ...createDefaultMeta(), gold: 4321, level: 7, progress: { chapter: 2, stage: 4 } };
  meta.upgrades.attack = 5;
  meta.passives.bossHunter = 2;
  const options = { ...createDefaultOptions(), volume: 0.5, uiScale: 1.2, reducedMotion: true };
  const profile = { ...createDefaultProfile(), stageRecords: { '1-1': { attempts: 3, clears: 2, bestKills: 210, bestClearSeconds: 301 } }, hintsSeen: ['move'] };
  saveGameSave(storage, { meta, options, profile });
  saveGameSave(storage, { meta: { ...meta, gold: 4400 }, options, profile });
  storage.setItem(INFINITE_LEADERBOARD_KEY, JSON.stringify({ version: 1, entries: [{ name: 'KANG', score: 991 }] }));
  return storage;
}

test('an export imports into another storage entry for entry, leaving other apps alone', () => {
  const source = playedStorage();
  const text = exportSave(source, Date.UTC(2026, 9, 1));
  assert.equal(JSON.parse(text).format, EXPORT_FORMAT);
  assert.equal('other-app' in JSON.parse(text).entries, false, 'only the game\'s keys are exported');

  const target = createStorage({ 'other-app': 'theirs', 'blackline-survivor-infinite-leaderboard-r1': 'stale board' });
  const result = importSave(target, `  ${text}\n`);
  assert.deepEqual(result, { ok: true, count: 3 });
  assert.deepEqual(gameEntries(target), gameEntries(source), 'the game\'s entries are exactly the export, the stale board is gone');
  assert.equal(target.getItem('other-app'), 'theirs');
  const loaded = loadGameSave(target);
  assert.equal(loaded.status, 'ok');
  assert.equal(loaded.data.meta.gold, 4400);
  assert.equal(loaded.data.meta.upgrades.attack, 5);
  assert.equal(loaded.data.options.uiScale, 1.2);
  assert.equal(loaded.data.profile.stageRecords['1-1']?.clears, 2);
  assert.ok(target.getItem(SAVE_BACKUP_KEY), 'the save\'s own backup comes along');
});

test('an import that is not an export, has no usable save, or comes from a newer build changes nothing', () => {
  const played = playedStorage();
  const before = new Map(played.values);
  const future = JSON.stringify({ format: EXPORT_FORMAT, entries: { [SAVE_KEY]: JSON.stringify({ version: SAVE_VERSION + 1 }) } });
  const cases: [string, string][] = [
    ['not json', 'format'],
    [JSON.stringify({ format: 'something-else', entries: {} }), 'format'],
    [JSON.stringify({ format: EXPORT_FORMAT, entries: [] }), 'format'],
    [JSON.stringify({ format: EXPORT_FORMAT, entries: { [INFINITE_LEADERBOARD_KEY]: '[]' } }), 'save'],
    [JSON.stringify({ format: EXPORT_FORMAT, entries: { [SAVE_KEY]: '{broken' } }), 'save'],
    [future, 'future'],
  ];
  for (const [text, reason] of cases) {
    assert.deepEqual(importSave(played, text), { ok: false, reason }, text);
    assert.deepEqual(played.values, before, `${reason}: storage untouched`);
  }
});

test('the desktop migration writes its backup in this export format', () => {
  const migration = createRequire(import.meta.url)('../../electron/saveMigration.cjs') as { EXPORT_FORMAT: string };
  assert.equal(migration.EXPORT_FORMAT, EXPORT_FORMAT);
});

test('a write that fails halfway puts the earlier entries back', () => {
  const text = exportSave(playedStorage());
  const target = createStorage({ [SAVE_KEY]: 'mine', 'blackline-survivor-infinite-leaderboard-r1': 'my board' }, 2);
  assert.deepEqual(importSave(target, text), { ok: false, reason: 'storage' });
  assert.deepEqual(gameEntries(target), { [SAVE_KEY]: 'mine', 'blackline-survivor-infinite-leaderboard-r1': 'my board' });
});
