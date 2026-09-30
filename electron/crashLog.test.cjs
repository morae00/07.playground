const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { CRASH_LOG_PREFIX, createCrashLog, createReloadGate, rendererErrorLine } = require('./crashLog.cjs');

test('the crash log appends one line per event and rotates once it grows past its limit', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'blackline-crashlog-'));
  try {
    const log = createCrashLog(path.join(directory, 'logs'), { now: () => new Date('2026-09-30T00:00:00.000Z'), maxBytes: 120 });
    assert.equal(log.append('renderer-error', '{"message":"boom"}\n  at line 2'), true);
    const first = fs.readFileSync(log.file, 'utf8');
    assert.equal(first, '2026-09-30T00:00:00.000Z renderer-error {"message":"boom"} at line 2\n');
    for (let index = 0; index < 4; index += 1) log.append('renderer-gone', `crashed (exit ${index})`);
    assert.ok(fs.existsSync(path.join(directory, 'logs', 'errors.1.log')), 'the old log is kept once');
    assert.ok(fs.statSync(log.file).size <= 240);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('logging failures never throw', () => {
  const broken = { mkdirSync() { throw new Error('read-only'); } };
  assert.equal(createCrashLog('/nowhere', { fsImpl: broken }).append('x', 'y'), false);
});

test('only prefixed renderer lines are logged, from either console-message signature', () => {
  assert.equal(rendererErrorLine({ message: `${CRASH_LOG_PREFIX} {"a":1}`, level: 'error' }), '{"a":1}');
  assert.equal(rendererErrorLine({}, 3, `${CRASH_LOG_PREFIX} legacy`), 'legacy');
  assert.equal(rendererErrorLine({ message: 'plain log line' }), null);
  assert.equal(rendererErrorLine(undefined), null);
});

test('automatic reloads stop after three crashes in five minutes', () => {
  let clock = 0;
  const allow = createReloadGate({ now: () => clock });
  assert.deepEqual([allow(), allow(), allow(), allow()], [true, true, true, false]);
  clock += 5 * 60 * 1000 + 1;
  assert.equal(allow(), true);
});
