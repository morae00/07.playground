const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { readLevelDb, readLocalStorage, snappyDecompress } = require('./levelDbReader.cjs');

// Written by Chromium itself (Electron 43, a file: page, two launches): the first launch's records were compacted
// into a Snappy-compressed table (000005.ldb, with 90 large filler keys set and then removed), and the second
// launch's records are in the log (000004.log): one key overwritten, one removed, one added.
const FIXTURE = path.join(__dirname, '..', 'test', 'fixtures', 'chromium-local-storage');

test('D-25: the file: origin localStorage reads back from Chromium\'s own files', () => {
  assert.deepEqual(readLocalStorage(FIXTURE, 'file://'), {
    'blackline-survivor-save': JSON.stringify({ version: 2, meta: { gold: 9999, note: '덮어씀 ✓' } }),
    'blackline-survivor-save-backup': 'x'.repeat(5000),
    'blackline-survivor-infinite-leaderboard': JSON.stringify([{ name: '결', score: 12345 }]),
    'blackline-survivor-meta': 'latin only ascii',
    'other-app-key': 'not ours',
  }, 'the newest value of each key; removed keys and the removed fillers are gone');
  assert.deepEqual(readLocalStorage(FIXTURE, 'app://game'), {}, 'another origin has nothing here');
  assert.deepEqual(readLocalStorage(path.join(FIXTURE, 'missing'), 'file://'), {}, 'no folder, no entries');
});

test('D-25: a log cut short by a crash keeps the records before the cut', () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'blackline-leveldb-'));
  try {
    for (const name of fs.readdirSync(FIXTURE)) fs.copyFileSync(path.join(FIXTURE, name), path.join(folder, name));
    const log = path.join(folder, '000004.log');
    fs.truncateSync(log, fs.statSync(log).size - 9);
    const entries = readLocalStorage(folder, 'file://');
    assert.ok(entries['blackline-survivor-save'], 'the save is still there, from the table or the earlier records');
    assert.equal(entries['blackline-survivor-save-backup'], 'x'.repeat(5000));
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});

test('D-25: a damaged table fails the read instead of returning half a save', () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'blackline-leveldb-'));
  try {
    fs.writeFileSync(path.join(folder, '000009.ldb'), Buffer.alloc(64, 7));
    assert.throws(() => readLevelDb(folder), /not a table/);
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});

test('D-25: Snappy literals and overlapping copies decode', () => {
  // 12 bytes: the literal "abcd", then a copy of 8 bytes from 4 back, which overlaps what it writes.
  const compressed = Buffer.from([0x0c, 0x0c, 0x61, 0x62, 0x63, 0x64, 0x11, 0x04]);
  assert.equal(snappyDecompress(compressed).toString(), 'abcdabcdabcd');
  assert.throws(() => snappyDecompress(Buffer.from([0x04, 0x11, 0x04])), /bad copy/, 'a copy before any output');
});
