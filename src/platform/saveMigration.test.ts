import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { LEGACY_INFINITE_LEADERBOARD_KEY, loadInfiniteLeaderboard } from './infiniteLeaderboard.ts';
import {
  LEGACY_META_KEY,
  SAVE_BACKUP_KEY,
  SAVE_KEY,
  SAVE_VERSION,
  createDefaultOptions,
  createDefaultProfile,
  loadGameSave,
  saveGameSave,
  type GameOptions,
  type StorageLike,
} from './save.ts';

// TEC-08 (R3 exit): saves written by the 0.1.0 build itself move to v3 with nothing lost, and when that build runs
// again after the move, it never writes over the v3 save. fixtures/saves-0.1.0.json holds ten localStorage snapshots
// from player journeys replayed through the 0.1.0 code; fixtures/save-0.1.0.mjs is that build's save module.
type Sample = { name: string; journey: string; entries: Record<string, string> };
type OldLoad = { data: unknown; status: string; warnings: string[]; writable: boolean };
type OldSaveModule = {
  loadGameSave: (storage: StorageLike) => OldLoad;
  saveGameSave: (storage: StorageLike, data: unknown) => unknown;
};
const { samples } = JSON.parse(readFileSync(new URL('./fixtures/saves-0.1.0.json', import.meta.url), 'utf8')) as { samples: Sample[] };
const oldBuild = (await import(new URL('./fixtures/save-0.1.0.mjs', import.meta.url).href)) as OldSaveModule;

function createStorage(initial: Record<string, string>) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

const envelope = (sample: Sample) => JSON.parse(sample.entries[SAVE_KEY]) as { version: number; meta: unknown; options: Record<string, unknown> };

test('the ten 0.1.0 saves span the campaign and every setting the old build could write', () => {
  assert.equal(samples.length, 10);
  assert.ok(samples.every((sample) => envelope(sample).version === 2), 'all are v2 envelopes');
  const options = samples.map((sample) => envelope(sample).options);
  const chapters = new Set(samples.map((sample) => (envelope(sample).meta as { progress: { chapter: number } }).progress.chapter));
  assert.deepEqual([...chapters].sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual(new Set(options.map((option) => option.healthBars)), new Set(['all', 'elite', 'off']));
  assert.deepEqual(new Set(options.map((option) => option.paceMode)), new Set(['standard', 'showcase']));
  for (const key of ['damageNumbers', 'screenShake', 'reducedFlash']) {
    assert.deepEqual(new Set(options.map((option) => option[key])), new Set([true, false]), key);
  }
  assert.ok(options.some((option) => option.volume === 0) && options.some((option) => option.effects === 0.25));
  assert.ok(samples.filter((sample) => sample.entries[SAVE_BACKUP_KEY]).length >= 8, 'the old build keeps its previous write as the backup');
  assert.ok(samples.some((sample) => sample.entries[LEGACY_META_KEY]), 'one player came from before v2');
  assert.ok(samples.some((sample) => sample.entries[LEGACY_INFINITE_LEADERBOARD_KEY]), 'one player has an infinite board');
});

for (const sample of samples) {
  test(`TEC-08 ${sample.name}: moves to v3 with nothing lost, and the 0.1.0 build then leaves it alone`, () => {
    const storage = createStorage(sample.entries);
    const original = envelope(sample);
    const loaded = loadGameSave(storage);
    assert.equal(loaded.status, 'migrated');
    assert.equal(loaded.writable, true);
    assert.deepEqual(loaded.warnings, []);
    assert.deepEqual(loaded.data.meta, original.meta, 'progress, gold, XP, level, upgrades, and passives carry over exactly');
    const options: GameOptions = {
      ...createDefaultOptions(),
      ...original.options,
      // Showcase pacing was a shipped option in 0.1.0; release builds now keep it for developers (G17).
      paceMode: original.options.paceMode === 'showcase' ? 'standard' : (original.options.paceMode as GameOptions['paceMode']),
      // 0.1.0's reduced flash also stilled motion, and it is two settings now (UI-08).
      reducedMotion: original.options.reducedFlash === true,
    };
    assert.deepEqual(loaded.data.options, options, 'the original settings carry over, and the new ones start at their defaults');
    assert.deepEqual(loaded.data.profile, createDefaultProfile(), 'the v3 profile starts empty');

    saveGameSave(storage, loaded.data);
    assert.equal(JSON.parse(storage.getItem(SAVE_KEY) ?? '{}').version, SAVE_VERSION);
    assert.equal(storage.getItem(SAVE_BACKUP_KEY), sample.entries[SAVE_KEY], 'the v2 original becomes the backup');
    assert.deepEqual(loadGameSave(storage), { data: loaded.data, status: 'ok', warnings: [], writable: true });

    // Rolling back to 0.1.0: its loader sees a future version and starts fresh, and its App saves only when the
    // load is writable (App.tsx 0.1.0), so the v3 save and its backup survive untouched.
    const before = new Map(storage.values);
    const rolledBack = oldBuild.loadGameSave(storage);
    assert.deepEqual([rolledBack.status, rolledBack.writable, rolledBack.warnings], ['defaulted', false, ['primary:future-version']]);
    if (rolledBack.writable) oldBuild.saveGameSave(storage, rolledBack.data);
    assert.deepEqual(storage.values, before);

    const oldBoard = sample.entries[LEGACY_INFINITE_LEADERBOARD_KEY];
    if (oldBoard) {
      const stored = JSON.parse(oldBoard) as { playerName: string; entries: { score: number }[] };
      const board = loadInfiniteLeaderboard(storage);
      assert.equal(board.playerName, stored.playerName);
      assert.deepEqual(board.legacyEntries.map((entry) => entry.score), stored.entries.map((entry) => entry.score), 'old scores stay as legacy records');
    }
  });
}
