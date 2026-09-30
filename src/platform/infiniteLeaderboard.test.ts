import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INFINITE_LEADERBOARD_KEY,
  LEGACY_INFINITE_LEADERBOARD_KEY,
  addInfiniteScore,
  loadInfiniteLeaderboard,
  normalizeInfinitePlayerName,
  rankInfiniteEntries,
  type InfiniteScoreEntry,
} from './infiniteLeaderboard.ts';
import { RULES_VERSION } from '../game/rules.ts';

function memoryStorage(initial?: string, legacy?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(INFINITE_LEADERBOARD_KEY, initial);
  if (legacy !== undefined) values.set(LEGACY_INFINITE_LEADERBOARD_KEY, legacy);
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

test('leaderboard normalizes player names and sorts the best ten scores', () => {
  assert.equal(normalizeInfinitePlayerName('   NIGHT   RUNNER   '), 'NIGHT RUNNER');
  assert.equal(normalizeInfinitePlayerName(''), 'PLAYER');
  const entries: InfiniteScoreEntry[] = Array.from({ length: 12 }, (_, index) => ({
    id: String(index),
    player: 'PLAYER',
    score: index * 100,
    survivedSeconds: index,
    kills: index,
    bosses: index,
    seed: index,
    endedAt: new Date(index * 1_000).toISOString(),
    rulesVersion: RULES_VERSION,
  }));
  const ranked = rankInfiniteEntries(entries);
  assert.equal(ranked.length, 10);
  assert.equal(ranked[0].score, 1_100);
});

test('leaderboard survives invalid storage and persists a sanitized score', () => {
  const broken = loadInfiniteLeaderboard(memoryStorage('{not-json'));
  assert.equal(broken.writable, false);
  assert.deepEqual(broken.entries, []);

  const storage = memoryStorage();
  const saved = addInfiniteScore(storage, '  ACE  ', [], {
    score: 12_345.9,
    survivedSeconds: 321.7,
    kills: 99,
    bosses: 4,
    seed: 42,
  });
  assert.equal(saved.writable, true);
  const loaded = loadInfiniteLeaderboard(storage);
  assert.equal(loaded.entries[0].player, 'ACE');
  assert.equal(loaded.entries[0].score, 12_345);
  assert.equal(loaded.entries[0].rulesVersion, RULES_VERSION);
});

test('records from the classic rules stay in a read-only legacy board', () => {
  const legacyBoard = JSON.stringify({
    playerName: 'VETERAN',
    entries: [{ id: 'old', player: 'VETERAN', score: 99_999, survivedSeconds: 1_800, kills: 3_000, bosses: 40, seed: 7, endedAt: '2026-07-20T00:00:00.000Z' }],
  });
  const storage = memoryStorage(undefined, legacyBoard);
  const loaded = loadInfiniteLeaderboard(storage);
  assert.equal(loaded.playerName, 'VETERAN', 'player name carries over from the legacy board');
  assert.deepEqual(loaded.entries, [], 'legacy scores never rank against current-rule scores');
  assert.equal(loaded.legacyEntries.length, 1);
  assert.equal(loaded.legacyEntries[0].rulesVersion, 1);

  const saved = addInfiniteScore(storage, loaded.playerName, [...loaded.entries, ...loaded.legacyEntries], {
    score: 10, survivedSeconds: 5, kills: 1, bosses: 0, seed: 1,
  });
  assert.equal(saved.entries.length, 1, 'legacy entries passed in by mistake are filtered out');
  assert.equal(storage.values.get(LEGACY_INFINITE_LEADERBOARD_KEY), legacyBoard, 'the legacy board is never rewritten');
});
