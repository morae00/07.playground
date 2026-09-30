// Save export and import (TEC-15): every entry the game keeps in localStorage (the save, its backup, the
// infinite-mode boards) as one text the player can keep and paste back. It is the manual path beside the desktop
// app's automatic move from file:// to app://: moving to another machine, or recovering a move that could not
// finish. An import is checked before anything is written (G17). The text must be an export, its save must load in
// this build, and only the game's own keys change. The import replaces the game's entries, so what loads afterwards
// is exactly what was exported; if a write fails, the entries from before come back.
import { LEGACY_META_KEY, SAVE_BACKUP_KEY, SAVE_KEY, loadGameSave } from './save.ts';

export const STORAGE_PREFIX = 'blackline-survivor-';
export const EXPORT_FORMAT = 'blackline-survivor-export';

export type StorageArea = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;
/** format: not an export; save: no save in it, or one that does not load; future: from a newer build; storage: a write failed. */
export type ImportRefusal = 'format' | 'save' | 'future' | 'storage';
export type ImportResult = { ok: true; count: number } | { ok: false; reason: ImportRefusal };

/** The game's own entries: every key under the prefix. */
export function gameEntries(storage: StorageArea) {
  const entries: Record<string, string> = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    const value = key?.startsWith(STORAGE_PREFIX) ? storage.getItem(key) : null;
    if (key && value !== null) entries[key] = value;
  }
  return entries;
}

export const exportSave = (storage: StorageArea, now = Date.now()) =>
  JSON.stringify({ format: EXPORT_FORMAT, version: 1, exportedAt: new Date(now).toISOString(), entries: gameEntries(storage) });

function readExport(text: string) {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { format, entries } = parsed as { format?: unknown; entries?: unknown };
    if (format !== EXPORT_FORMAT || typeof entries !== 'object' || entries === null || Array.isArray(entries)) return null;
    return Object.fromEntries(Object.entries(entries).filter((entry): entry is [string, string] => entry[0].startsWith(STORAGE_PREFIX) && typeof entry[1] === 'string'));
  } catch {
    return null;
  }
}

function replaceEntries(storage: StorageArea, entries: Record<string, string>) {
  for (const key of Object.keys(gameEntries(storage))) if (!(key in entries)) storage.removeItem(key);
  for (const [key, value] of Object.entries(entries)) storage.setItem(key, value);
}

export function importSave(storage: StorageArea, text: string): ImportResult {
  const entries = readExport(text.trim());
  if (!entries) return { ok: false, reason: 'format' };
  if (![SAVE_KEY, SAVE_BACKUP_KEY, LEGACY_META_KEY].some((key) => key in entries)) return { ok: false, reason: 'save' };
  const check = loadGameSave({ getItem: (key) => entries[key] ?? null, setItem: () => undefined });
  if (!check.writable) return { ok: false, reason: 'future' };
  if (check.status === 'defaulted') return { ok: false, reason: 'save' };
  const previous = gameEntries(storage);
  try {
    replaceEntries(storage, entries);
    const after = gameEntries(storage);
    if (Object.keys(entries).some((key) => after[key] !== entries[key])) throw new Error('read-back');
    return { ok: true, count: Object.keys(entries).length };
  } catch {
    try {
      replaceEntries(storage, previous);
    } catch {
      // The storage refuses writes altogether; there is nothing more to put back.
    }
    return { ok: false, reason: 'storage' };
  }
}
