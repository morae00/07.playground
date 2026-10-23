// The desktop app's save move (TEC-15, BUG-22; electron/saveMigration.cjs) tells the game page what the player must
// know through one localStorage key, outside the game's prefix, set before the page loads:
// - failed: the move failed; the app tries again at the next launch.
// - kept: the save from the earlier build was set aside, because this one already has progress.
// - unreadable: the old saves could not be read, and now they are gone from the old origin; only the raw copy has them.
// Each comes with where the copies of the old data are. The page reads it once and removes it; the web build never
// has it.
export const SAVE_MOVE_NOTICE_KEY = 'blackline-desktop-save-move';
const STATUSES = ['failed', 'kept', 'unreadable'] as const;

export type SaveMoveNotice = {
  status: (typeof STATUSES)[number];
  /** The byte-for-byte copy of the old localStorage folder, if one was made. */
  rawCopy: string | null;
  /** The backup file in the save export format, if the old saves could be read. */
  backup: string | null;
};

type NoticeStorage = Pick<Storage, 'getItem' | 'removeItem'>;

const shownPath = (value: unknown) => (typeof value === 'string' && value.length > 0 && value.length <= 1024 ? value : null);

/** The notice the move left, or null (none, unreadable, or storage that cannot be read). */
export function readSaveMoveNotice(storage: NoticeStorage): SaveMoveNotice | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(SAVE_MOVE_NOTICE_KEY) ?? 'null');
    if (typeof value !== 'object' || value === null) return null;
    const { status, rawCopy, backup } = value as Record<string, unknown>;
    const known = STATUSES.find((candidate) => candidate === status);
    return known ? { status: known, rawCopy: shownPath(rawCopy), backup: shownPath(backup) } : null;
  } catch {
    return null;
  }
}

/** Removes the notice once the page holds it, so it shows once; a failed move leaves a new one at every launch. */
export function clearSaveMoveNotice(storage: NoticeStorage) {
  try {
    storage.removeItem(SAVE_MOVE_NOTICE_KEY);
  } catch {
    // Storage that refuses writes keeps the notice for the next launch, which is harmless.
  }
}
