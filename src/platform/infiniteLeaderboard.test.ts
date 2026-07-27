import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INFINITE_LEADERBOARD_KEY,
  addInfiniteScore,
  loadInfiniteLeaderboard,
  normalizeInfinitePlayerName,
  rankInfiniteEntries,
  type InfiniteScoreEntry,
} from './infiniteLeaderboard.ts';

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(INFINITE_LEADERBOARD_KEY, initial);
  return {
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
});
