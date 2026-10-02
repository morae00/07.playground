import assert from 'node:assert/strict';
import test from 'node:test';
import { DEV_RUN_LOG_KEY, appendDevRunLog, clearDevRunLog, devRunCoinShare, devRunEntry, readDevRunLog } from './devRunLog.ts';

// The developer run log (D-07): every settled run's numbers, for playtest export.
function memoryStorage() {
  const items = new Map<string, string>();
  return { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => { items.set(key, value); } };
}
const run = (coinsEarned: number, coins: number, extra: object = {}) => ({
  runMode: 'campaign' as const, rulesVersion: 2, chapter: 1, stage: 3, cleared: true, practice: false, assisted: false,
  clearSeconds: 480.04, survivedSeconds: 0, kills: 400, level: 12, coinsEarned, coins, damageTaken: 312.6, maxHp: 380,
  bonus: { met: true }, found: { skills: ['needleStorm', 'fanKnives'] }, ...extra,
});

test('a settled run becomes one entry with its coins earned and left', () => {
  assert.deepEqual(devRunEntry(run(900, 120), 7), {
    at: 7, mode: 'campaign', rules: 2, chapter: 1, stage: 3, outcome: 'clear', practice: false, assisted: false, seconds: 480,
    kills: 400, level: 12, coinsEarned: 900, coinsLeft: 120, damageTaken: 313, maxHp: 380, bonus: true, skills: 2,
  });
  assert.equal(devRunEntry(run(0, 0, { runMode: 'infinite', survivedSeconds: 912.3, cleared: false, bonus: null }), 8).seconds, 912.3);
});

test('the log keeps the newest 500 runs, survives a refused write, and reports the median coin share', () => {
  const storage = memoryStorage();
  for (let index = 0; index < 505; index += 1) appendDevRunLog(storage, devRunEntry(run(100, index % 2 ? 10 : 40), index));
  const entries = readDevRunLog(storage);
  assert.equal(entries.length, 500);
  assert.equal(entries[0].at, 5, 'the oldest drop off');
  assert.equal(devRunCoinShare(entries), 0.25, 'the median of 10% and 40% shares');
  assert.equal(devRunCoinShare([devRunEntry(run(0, 0), 1)]), null, 'runs that earned nothing do not count');
  const refusing = { getItem: storage.getItem, setItem() { throw new Error('quota'); } };
  assert.equal(appendDevRunLog(refusing, devRunEntry(run(1, 1), 9)).length, 500, 'a refused write keeps the log');
  storage.setItem(DEV_RUN_LOG_KEY, '{oops');
  assert.deepEqual(readDevRunLog(storage), []);
  clearDevRunLog(storage);
  assert.deepEqual(readDevRunLog(storage), []);
});
