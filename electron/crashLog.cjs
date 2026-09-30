// Local crash log (TEC-14): renderer error lines and process exits are appended to a file in the app's own data
// folder. Nothing is uploaded; crashReporter keeps native crash dumps on this machine as well.
const fs = require('node:fs');
const path = require('node:path');

/** Must match CRASH_LOG_PREFIX in src/platform/errorReport.ts. */
const CRASH_LOG_PREFIX = '[blackline:error]';
const MAX_LOG_BYTES = 512 * 1024;
const MAX_LINE_CHARS = 4000;

function createCrashLog(directory, { fsImpl = fs, now = () => new Date(), maxBytes = MAX_LOG_BYTES } = {}) {
  const file = path.join(directory, 'errors.log');
  const previous = path.join(directory, 'errors.1.log');
  return {
    file,
    /** Appends one line; returns false instead of throwing, because logging must never take the app down. */
    append(kind, text) {
      try {
        fsImpl.mkdirSync(directory, { recursive: true });
        let size = 0;
        try {
          size = fsImpl.statSync(file).size;
        } catch {
          size = 0;
        }
        if (size > maxBytes) fsImpl.renameSync(file, previous);
        const body = String(text).replace(/\s+/g, ' ').trim().slice(0, MAX_LINE_CHARS);
        fsImpl.appendFileSync(file, `${now().toISOString()} ${kind} ${body}\n`, 'utf8');
        return true;
      } catch {
        return false;
      }
    },
  };
}

/**
 * The payload of a renderer console line that reports an error, or null for any other line. Electron 35+
 * passes one details object; older versions passed (event, level, message).
 */
function rendererErrorLine(detailsOrEvent, legacyLevel, legacyMessage) {
  const message = typeof detailsOrEvent?.message === 'string' ? detailsOrEvent.message : legacyMessage;
  if (typeof message !== 'string' || !message.startsWith(CRASH_LOG_PREFIX)) return null;
  return message.slice(CRASH_LOG_PREFIX.length).trim();
}

/** Allows at most `limit` automatic reloads in a sliding window, so a renderer that keeps crashing stays down. */
function createReloadGate({ limit = 3, windowMs = 5 * 60 * 1000, now = () => Date.now() } = {}) {
  const times = [];
  return () => {
    const current = now();
    while (times.length > 0 && current - times[0] > windowMs) times.shift();
    if (times.length >= limit) return false;
    times.push(current);
    return true;
  };
}

module.exports = {
  CRASH_LOG_PREFIX,
  createCrashLog,
  createReloadGate,
  rendererErrorLine,
};
