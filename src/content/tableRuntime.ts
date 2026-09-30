// Content tables in built apps (TEC-05). The build replaces each module in src/content/data with a read from here,
// and this module fetches the tables once, before any game module that uses them runs (top-level await). A failed
// fetch fails the app module, and main.tsx shows the boot recovery screen (TEC-14).
import { deepFreeze } from './deepFreeze.ts';
import type { ContentTables } from './data/index.ts';

export const CONTENT_TABLES_URL = 'assets/content/tables.json';

const response = await fetch(CONTENT_TABLES_URL);
if (!response.ok) throw new Error(`Could not load ${CONTENT_TABLES_URL} (${response.status})`);
const tables = deepFreeze((await response.json()) as ContentTables);

export function table<Name extends keyof ContentTables>(name: Name): ContentTables[Name] {
  return tables[name];
}
