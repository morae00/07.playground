// Save migration (TEC-15): the first launch on the app:// origin copies the saves and leaderboards that the file://
// origin kept in localStorage. Before copying it writes them to a backup file in the app's data folder, and after
// copying it reads them back and checks that every entry arrived intact (G17). A key the new origin already has is
// never overwritten. A marker file records the move so later launches skip it; a failed check writes no marker, so
// the next launch tries again. The backup is a save export, so its text can be pasted into 설정 > 세이브 > 가져오기.
const path = require('node:path');

const STORAGE_PREFIX = 'blackline-survivor-';
/** The same format the game's export writes (src/platform/saveTransfer.ts; its test keeps the two equal). */
const EXPORT_FORMAT = 'blackline-survivor-export';
const MARKER_FILE = 'storage-migrated.json';

const ownKeys = (entries) => Object.fromEntries(Object.entries(entries ?? {}).filter(([key, value]) => key.startsWith(STORAGE_PREFIX) && typeof value === 'string'));

/**
 * Reading and writing each origin's localStorage is injected: the app reads the old origin from disk
 * (levelDbReader.cjs) and the new one through a hidden app:// window; tests pass fakes.
 * Resolves with what happened: skipped, empty, migrated, or failed (with the keys that did not arrive).
 */
async function migrateStorage({ readOld, readNew, writeNew, fs, dir, now = () => Date.now() }) {
  const marker = path.join(dir, MARKER_FILE);
  if (fs.existsSync(marker)) return { status: 'skipped' };
  fs.mkdirSync(dir, { recursive: true });
  const old = ownKeys(await readOld());
  const keys = Object.keys(old);
  if (keys.length === 0) {
    fs.writeFileSync(marker, JSON.stringify({ at: now(), moved: 0, kept: 0 }));
    return { status: 'empty' };
  }
  const at = now();
  const backup = path.join(dir, `save-backup-file-origin-${at}.json`);
  fs.writeFileSync(backup, JSON.stringify({ format: EXPORT_FORMAT, version: 1, exportedAt: new Date(at).toISOString(), entries: old }));
  const current = ownKeys(await readNew());
  const moving = Object.fromEntries(keys.filter((key) => !(key in current)).map((key) => [key, old[key]]));
  await writeNew(moving);
  const after = ownKeys(await readNew());
  const lost = keys.filter((key) => !(key in after) || (key in moving && after[key] !== old[key]));
  if (lost.length > 0) return { status: 'failed', lost, backup };
  const moved = Object.keys(moving).length;
  fs.writeFileSync(marker, JSON.stringify({ at: now(), moved, kept: keys.length - moved, backup: path.basename(backup) }));
  return { status: 'migrated', moved, kept: keys.length - moved, backup };
}

module.exports = { EXPORT_FORMAT, MARKER_FILE, STORAGE_PREFIX, migrateStorage };
