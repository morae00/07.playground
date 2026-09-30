import assert from 'node:assert/strict';
import test from 'node:test';
import { CRASH_LOG_PREFIX, ErrorLog, crashLogLine, describeError, formatErrorReport, installGlobalErrorHandlers, redactPaths } from './errorReport.ts';

const fixedClock = () => new Date('2026-09-30T12:00:00.000Z');

test('the log keeps recent errors, folds repeats, and skips harmless browser noise', () => {
  const log = new ErrorLog(3, fixedClock);
  const seen: string[] = [];
  const stop = log.subscribe((entry) => seen.push(`${entry.source}:${entry.count}`));
  log.record('loop', new TypeError('boom'));
  log.record('loop', new TypeError('boom'));
  assert.equal(log.entries().length, 1);
  assert.equal(log.entries()[0].count, 2);
  assert.equal(log.entries()[0].message, 'TypeError: boom');
  assert.equal(log.record('window', 'ResizeObserver loop completed with undelivered notifications.'), null);
  log.record('asset', 'pack common failed');
  log.record('promise', { reason: 1 });
  log.record('render', new Error('last'));
  assert.deepEqual(log.entries().map((entry) => entry.source), ['asset', 'promise', 'render'], 'oldest entries drop out');
  stop();
  log.record('render', new Error('after stop'));
  assert.deepEqual(seen, ['loop:1', 'loop:2', 'asset:1', 'promise:1', 'render:1']);
});

test('reports name the version and scene, and never carry the home folder', () => {
  const log = new ErrorLog(5, fixedClock);
  const error = new Error('draw failed');
  error.stack = 'Error: draw failed\n    at render (file:///Users/somebody/Apps/Blackline.app/dist/assets/index.js:1:2)';
  log.record('loop', error, 'while drawing');
  const report = formatErrorReport(log.entries(), { version: '0.2.0', scene: 'Ch.1 / St.3', userAgent: 'test', time: fixedClock() });
  assert.match(report, /Blackline Survivor 0\.2\.0 error report/);
  assert.match(report, /scene: Ch\.1 \/ St\.3/);
  assert.match(report, /loop: Error: draw failed/);
  assert.match(report, /while drawing/);
  assert.doesNotMatch(report, /somebody/);
  assert.match(report, /\/Users\/~\/Apps/);
  assert.equal(redactPaths('C:\\Users\\Kim\\AppData\\x'), 'C:\\Users\\~\\AppData\\x');
  assert.equal(redactPaths('/home/kim/x'), '/home/~/x');
  const line = crashLogLine(log.entries()[0]);
  assert.ok(line.startsWith(`${CRASH_LOG_PREFIX} {`));
  assert.doesNotMatch(line, /somebody/);
  assert.equal(describeError(42).message, '42');
});

test('global handlers record uncaught errors and unhandled rejections until uninstalled', () => {
  const handlers = new Map<string, (event: Event) => void>();
  const target = {
    addEventListener: (type: string, handler: (event: Event) => void) => handlers.set(type, handler),
    removeEventListener: (type: string) => handlers.delete(type),
  } as unknown as Window;
  const log = new ErrorLog(5, fixedClock);
  const uninstall = installGlobalErrorHandlers(target, log);
  handlers.get('error')?.({ error: new RangeError('bad index'), message: 'bad index' } as unknown as Event);
  handlers.get('unhandledrejection')?.({ reason: new Error('lost promise') } as unknown as Event);
  assert.deepEqual(log.entries().map((entry) => `${entry.source} ${entry.message}`), ['window RangeError: bad index', 'promise Error: lost promise']);
  uninstall();
  assert.equal(handlers.size, 0);
});
