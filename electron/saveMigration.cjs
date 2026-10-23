// Save migration (TEC-15, BUG-22): on every launch until it is done, the saves and leaderboards that the file://
// origin kept in localStorage move to app://.
// - Before reading the old origin it copies Chromium's localStorage folder byte for byte into the app's data folder,
//   once, so the old data is kept even when it cannot be read. main.cjs takes that copy before the app is ready
//   (keepRawCopy), because Chromium opens the folder as the app starts.
// - What it reads goes to a backup file in the save export format, which can be pasted into 설정 > 세이브 > 가져오기.
// - It copies the entries, reads them back, and checks that every entry arrived intact (G17).
// - Progress already on app:// is never overwritten. A key the new origin has keeps its value, except a save or a
//   leaderboard that holds only what a new player starts with (isFreshSave, isFreshBoard). That is what the game
//   writes by itself when it starts after a move that failed, and the old entries replace it.
// - A marker file records a finished move, so later launches skip it. A move that fails (the read throws, or an
//   entry does not read back) writes no marker but a pending file, and the next launch tries again.
// - What the player must hear about (a failed move, an old save set aside, old saves that could not be read and are
//   gone) is left for the game page under NOTICE_KEY (src/platform/saveMove.ts).
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');

const STORAGE_PREFIX = 'blackline-survivor-';
/** The same format the game's export writes (src/platform/saveTransfer.ts; its test keeps the two equal). */
const EXPORT_FORMAT = 'blackline-survivor-export';
const MARKER_FILE = 'storage-migrated.json';
/** A failed move: when, why, and which entries did arrive. Removed when the move finishes. */
const PENDING_FILE = 'storage-migration-pending.json';
/** The byte-for-byte copy of the old localStorage folder, next to the backup files. */
const RAW_COPY_PREFIX = 'save-raw-copy-file-origin-';
/**
 * The save, its backup, and the 0.1.0 legacy meta (SAVE_KEY, SAVE_BACKUP_KEY, LEGACY_META_KEY in
 * src/platform/save.ts; saveMove.test.ts keeps them equal), in the order the game reads them. They move as one.
 */
const SAVE_KEYS = Object.freeze(['blackline-survivor-save-v2', 'blackline-survivor-save-v2.backup', 'blackline-survivor-meta-v1']);
const BOARD_PREFIX = 'blackline-survivor-infinite-leaderboard-';
/** The outcome for the game page, outside the game's prefix, so no export, import, or move carries it. */
const NOTICE_KEY = 'blackline-desktop-save-move';

/**
 * What src/platform/save.ts writes for a new player: createDefaultMeta() and createDefaultProfile() without hintsSeen
 * and storySeen (saveMove.test.ts keeps them equal). Options, hints and story beats seen are not progress.
 */
const FRESH_META = Object.freeze({
  gold: 120,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 1, stage: 1 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});
const FRESH_PROFILE = Object.freeze({
  stageRecords: {},
  characters: { selected: 'gyeol', unlocked: ['gyeol'], levels: {} },
  codex: { enemies: [], bosses: [], skills: [], terrain: [], chapters: [] },
  achievements: {},
  runSuspend: null,
  stats: { runs: 0, clears: 0, kills: 0, bossKills: 0, playSeconds: 0 },
  cosmetics: { owned: [], outline: null, trail: null, frame: null, title: null },
});
const ENVELOPE_FIELDS = ['version', 'savedAt', 'meta', 'options', 'profile'];

const ownKeys = (entries) => Object.fromEntries(Object.entries(entries ?? {}).filter(([key, value]) => key.startsWith(STORAGE_PREFIX) && typeof value === 'string'));
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const parse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};
const message = (error) => (error instanceof Error ? error.message : String(error));

/**
 * Whether `value` holds nothing beyond `fresh`: every field it has is one `fresh` has, with the same value (lists and
 * plain values equal, a map such as stageRecords empty). A missing field loads as the new player's value
 * (sanitizeMeta, sanitizeProfile), so it matches; an unknown field never does.
 */
function withinFresh(value, fresh) {
  if (value === undefined) return true;
  if (!isObject(fresh)) return isDeepStrictEqual(value, fresh);
  return isObject(value) && Object.entries(value).every(([field, inner]) => Object.hasOwn(fresh, field) && withinFresh(inner, fresh[field]));
}

/**
 * A save with no progress in it, which the move may replace: a version 3 envelope with only the envelope's fields,
 * whose meta and profile hold nothing beyond the new player's (withinFresh). Its options, hints seen, and story beats
 * seen may be anything: they are settings and what was shown, not progress. Every other value (another version,
 * damaged text, an unknown field, any progress at all) counts as progress and is never overwritten.
 */
function isFreshSave(text) {
  const save = parse(text);
  if (!isObject(save) || save.version !== 3 || !Object.keys(save).every((field) => ENVELOPE_FIELDS.includes(field))) return false;
  if (save.profile !== undefined && !isObject(save.profile)) return false;
  const profile = { ...save.profile };
  delete profile.hintsSeen;
  delete profile.storySeen;
  return withinFresh(save.meta, FRESH_META) && withinFresh(profile, FRESH_PROFILE);
}

/** A leaderboard with no runs on it (the game writes one when a name is typed before any endless run). */
function isFreshBoard(text) {
  const board = parse(text);
  return isObject(board) && Array.isArray(board.entries) && board.entries.length === 0;
}

/** Copies the old localStorage folder once; later attempts keep the first copy, taken before anything opened it. */
function copyRawFolder(fs, folder, dir, at) {
  if (!folder || !fs.existsSync(folder)) return null;
  const names = fs.readdirSync(dir).filter((name) => name.startsWith(RAW_COPY_PREFIX));
  const done = names.find((name) => !name.endsWith('.partial'));
  if (done) return path.join(dir, done);
  // A copy cut short by a crash is never mistaken for a whole one.
  for (const name of names) fs.rmSync(path.join(dir, name), { recursive: true, force: true });
  const copy = path.join(dir, `${RAW_COPY_PREFIX}${at}`);
  fs.cpSync(folder, `${copy}.partial`, { recursive: true });
  fs.renameSync(`${copy}.partial`, copy);
  return copy;
}

/**
 * The raw copy alone, for the main process to take before the app is ready: Chromium opens its localStorage folder
 * as the app starts, before any window loads, and may clean it up or, if it cannot open it, start it over. Nothing
 * once the move is done. Never throws; migrateStorage keeps a copy made here and tries again if this one failed.
 */
function keepRawCopy({ fs, dir, oldFolder, now = () => Date.now() }) {
  try {
    if (fs.existsSync(path.join(dir, MARKER_FILE))) return { rawCopy: null, error: null };
    return { rawCopy: copyRawFolder(fs, oldFolder, dir, now()), error: null };
  } catch (error) {
    return { rawCopy: null, error: message(error) };
  }
}

/**
 * What to write to the new origin (a null value removes the key). The save moves as one: the old one goes in whole
 * when the new origin has none, or only a fresh one; otherwise none of it moves, and keptSave says whether an old
 * save with progress was left out (not when it already arrived in an earlier attempt, or is already there).
 */
function planMove(old, current, delivered) {
  const writes = {};
  let keptSave = false;
  const oldSave = SAVE_KEYS.filter((key) => key in old);
  const newSave = SAVE_KEYS.filter((key) => key in current);
  if (oldSave.length > 0) {
    if (newSave.every((key) => isFreshSave(current[key]))) {
      for (const key of SAVE_KEYS) {
        if (key in old) {
          if (current[key] !== old[key]) writes[key] = old[key];
        } else if (key in current) {
          writes[key] = null;
        }
      }
    } else {
      const primary = old[oldSave[0]];
      const arrived = oldSave.every((key) => delivered.includes(key)) || newSave.some((key) => current[key] === primary);
      keptSave = !arrived && !oldSave.every((key) => isFreshSave(old[key]));
    }
  }
  for (const key of Object.keys(old)) {
    if (SAVE_KEYS.includes(key)) continue;
    const freshBoard = key.startsWith(BOARD_PREFIX) && key in current && current[key] !== old[key] && isFreshBoard(current[key]);
    if (!(key in current) || freshBoard) writes[key] = old[key];
  }
  return { writes, keptSave, replaced: Object.keys(writes).some((key) => key in current && current[key] !== writes[key]) };
}

/**
 * Reading and writing each origin's localStorage is injected: the app reads the old origin from disk
 * (levelDbReader.cjs) and the new one through a hidden app:// window; tests pass fakes. `oldFolder` is the folder
 * the old origin is read from, copied first; `home` shortens the paths shown to the player to ~.
 * Resolves with what happened: skipped, empty, migrated, or failed (reason read or write, and the keys that did
 * not arrive).
 */
async function migrateStorage({ readOld, readNew, writeNew, fs, dir, oldFolder = null, home = null, now = () => Date.now() }) {
  const marker = path.join(dir, MARKER_FILE);
  if (fs.existsSync(marker)) return { status: 'skipped' };
  fs.mkdirSync(dir, { recursive: true });
  const at = now();
  const pendingFile = path.join(dir, PENDING_FILE);
  let pending = null;
  try {
    pending = fs.existsSync(pendingFile) ? parse(fs.readFileSync(pendingFile, 'utf8')) : null;
  } catch {
    // An unreadable record only means no entry counts as already moved.
  }
  const delivered = Array.isArray(pending?.delivered) ? pending.delivered.filter((key) => typeof key === 'string') : [];
  let rawCopy = null;
  let rawCopyError = null;
  try {
    rawCopy = copyRawFolder(fs, oldFolder, dir, at);
  } catch (error) {
    rawCopyError = message(error);
  }
  const shown = (file) => (file && home && file.startsWith(`${home}${path.sep}`) ? `~${file.slice(home.length)}` : file ?? null);
  const tell = async (status, backup) => {
    try {
      await writeNew({ [NOTICE_KEY]: status ? JSON.stringify({ status, rawCopy: shown(rawCopy), backup: shown(backup) }) : null });
    } catch {
      // The page then shows nothing; the error log still has the outcome.
    }
  };
  const failed = async (details, arrived = [], { quiet = false } = {}) => {
    try {
      fs.writeFileSync(pendingFile, JSON.stringify({ at, reason: details.reason, error: details.error, lost: details.lost, delivered: [...new Set([...delivered, ...arrived])] }));
    } catch {
      // Without the record the next attempt still runs; it only may tell the player about a save it already moved.
    }
    if (!quiet) await tell('failed', details.backup ?? null);
    return { status: 'failed', ...details, rawCopy, rawCopyError };
  };

  let old;
  try {
    old = ownKeys(await readOld());
  } catch (error) {
    return failed({ reason: 'read', error: message(error) });
  }
  const keys = Object.keys(old);
  if (keys.length === 0) {
    fs.writeFileSync(marker, JSON.stringify({ at: now(), moved: 0, kept: 0 }));
    if (fs.existsSync(pendingFile)) fs.rmSync(pendingFile, { force: true });
    // An earlier attempt could not read the old origin, and now it is empty: Chromium dropped a folder it could not
    // open either. Only the raw copy still has the old saves, and the player is told where it is.
    const unreadable = pending?.reason === 'read';
    if (unreadable && rawCopy) await tell('unreadable', null);
    return { status: 'empty', unreadable, rawCopy, rawCopyError };
  }
  const backup = path.join(dir, `save-backup-file-origin-${at}.json`);
  let plan;
  let after;
  let staleNotice = false;
  try {
    fs.writeFileSync(backup, JSON.stringify({ format: EXPORT_FORMAT, version: 1, exportedAt: new Date(at).toISOString(), entries: old }));
    const present = await readNew();
    staleNotice = isObject(present) && Object.hasOwn(present, NOTICE_KEY);
    plan = planMove(old, ownKeys(present), delivered);
    if (Object.keys(plan.writes).length > 0) await writeNew(plan.writes);
    after = ownKeys(await readNew());
  } catch (error) {
    return failed({ reason: 'write', error: message(error), backup: fs.existsSync(backup) ? backup : null });
  }
  const { writes, keptSave, replaced } = plan;
  const lost = [
    ...keys.filter((key) => (key in writes ? after[key] !== writes[key] : !SAVE_KEYS.includes(key) && !(key in after))),
    ...Object.keys(writes).filter((key) => writes[key] === null && key in after),
  ];
  if (lost.length > 0) return failed({ reason: 'write', lost, backup }, keys.filter((key) => after[key] === old[key]));
  const moved = keys.filter((key) => key in writes).length;
  try {
    fs.writeFileSync(marker, JSON.stringify({ at: now(), moved, kept: keys.length - moved, replaced, keptSave, backup: path.basename(backup), rawCopy: rawCopy && path.basename(rawCopy) }));
    if (fs.existsSync(pendingFile)) fs.rmSync(pendingFile, { force: true });
  } catch (error) {
    // Every entry arrived, so there is nothing to tell the player; without the marker the next launch checks again.
    return failed({ reason: 'write', error: message(error), backup }, keys, { quiet: true });
  }
  // A notice from an earlier failed attempt that the page never took is cleared.
  if (keptSave || staleNotice) await tell(keptSave ? 'kept' : null, backup);
  return { status: 'migrated', moved, kept: keys.length - moved, replaced, keptSave, backup, rawCopy, rawCopyError };
}

module.exports = {
  EXPORT_FORMAT,
  FRESH_META,
  FRESH_PROFILE,
  MARKER_FILE,
  NOTICE_KEY,
  PENDING_FILE,
  RAW_COPY_PREFIX,
  SAVE_KEYS,
  STORAGE_PREFIX,
  isFreshBoard,
  isFreshSave,
  keepRawCopy,
  migrateStorage,
};
