import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { BOSS_TITLES_URL } from './bossTitles.ts';

// The boss title cards (FX-05) read public/assets/content/boss-titles.json, copied from the lore bible's boss
// tables (docs/lore/lore-bible.md §4.1-4.2). The two must not drift apart.
const root = new URL('../../', import.meta.url);

function loreTables() {
  const text = readFileSync(new URL('docs/lore/lore-bible.md', root), 'utf8');
  const section = text.slice(text.indexOf('### 4.1'), text.indexOf('### 4.3'));
  const rows: Record<string, { name: string; title: string; line: string }> = {};
  for (const line of section.split('\n')) {
    if (!line.startsWith('| ') || line.startsWith('| 이름') || line.startsWith('|---')) continue;
    const [name, id, title, oneLine] = line.slice(1).split('|').map((cell) => cell.trim());
    rows[id.split('·')[0].trim()] = { name, title, line: oneLine };
  }
  return rows;
}

test('every boss title card matches the lore bible, for all fifteen bosses', () => {
  const data = JSON.parse(readFileSync(new URL(`public/${BOSS_TITLES_URL}`, root), 'utf8'));
  const lore = loreTables();
  assert.equal(Object.keys(lore).length, 15);
  assert.deepEqual(data.bosses, lore);
});
