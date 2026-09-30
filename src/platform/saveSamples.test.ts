import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { loadInfiniteLeaderboard } from './infiniteLeaderboard.ts';
import { loadGameSave } from './save.ts';
import { gameEntries, importSave } from './saveTransfer.ts';

// TEC-15 / G17: the save samples (saveSamples.json) through the desktop app's first-launch move, then back through
// the manual import of its backup file. Nothing a player owns may be lost: progress, gold, upgrades, options,
// records, and both infinite boards.
type Sample = { name: string; note: string; entries: Record<string, string> };
type Migration = { status: string; backup?: string };
const { samples } = JSON.parse(readFileSync(new URL('./saveSamples.json', import.meta.url), 'utf8')) as { samples: Sample[] };
const { migrateStorage } = createRequire(import.meta.url)('../../electron/saveMigration.cjs') as { migrateStorage: (options: object) => Promise<Migration> };

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

function memoryFs() {
  const files = new Map<string, string>();
  return { files, existsSync: (file: string) => files.has(file), writeFileSync: (file: string, text: string) => files.set(file, text), mkdirSync() {} };
}

/** What the game shows from a storage: the save as it loads, and the boards. */
function view(entries: Record<string, string>) {
  const storage = createStorage(entries);
  const save = loadGameSave(storage);
  return { status: save.status, writable: save.writable, data: save.data, boards: loadInfiniteLeaderboard(storage) };
}

test('the ten save samples cover every save generation and load outcome', () => {
  assert.equal(samples.length, 10);
  const statuses = new Set(samples.map((sample) => view(sample.entries).status));
  assert.deepEqual([...statuses].sort(), ['defaulted', 'migrated', 'ok', 'recovered']);
});

for (const sample of samples) {
  test(`G17 ${sample.name}: the first app:// launch moves it with nothing lost, and its backup imports back`, async () => {
    const oldOrigin = createStorage({ ...sample.entries, 'another-app': 'not ours' });
    const newOrigin = createStorage();
    const fs = memoryFs();
    const result = await migrateStorage({
      readOld: async () => Object.fromEntries(oldOrigin.values),
      readNew: async () => Object.fromEntries(newOrigin.values),
      writeNew: async (entries: Record<string, string>) => Object.entries(entries).forEach(([key, value]) => newOrigin.setItem(key, value)),
      fs,
      dir: '/data',
      now: () => 1,
    });
    assert.equal(result.status, 'migrated');
    assert.deepEqual(Object.fromEntries(newOrigin.values), sample.entries, 'every game entry arrives byte for byte, and nothing else');
    assert.deepEqual(view(Object.fromEntries(newOrigin.values)), view(sample.entries), 'the game loads the same save and boards');

    const restored = createStorage();
    const imported = importSave(restored, fs.files.get(result.backup ?? '') ?? '');
    if (view(sample.entries).writable) {
      assert.deepEqual(imported, { ok: true, count: Object.keys(sample.entries).length });
      assert.deepEqual(gameEntries(restored), sample.entries, 'the backup file restores every entry');
    } else {
      assert.deepEqual(imported, { ok: false, reason: 'future' }, 'a newer build\'s save is never imported over');
      assert.equal(restored.values.size, 0);
    }
  });
}
