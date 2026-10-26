import assert from 'node:assert/strict';
import test from 'node:test';
import { CHARACTERS, CHARACTER_IDS } from '../game/characters.ts';
import { localeTable } from '../i18n/localeFile.ts';

// CON-10: a character card's line speaks of the weapon the same card says it starts with, never of another skill.
test('CON-10: no character card line names a skill other than its starting weapon', () => {
  for (const locale of ['ko', 'en'] as const) {
    const table = localeTable(locale);
    const skills = Object.keys(table).filter((key) => /^skill\.\w+$/.test(key));
    for (const id of CHARACTER_IDS) {
      const line = table[`character.${id}.line`];
      const others = skills.filter((key) => key !== `skill.${CHARACTERS[id].weapon}` && line.toLowerCase().includes(table[key].toLowerCase()));
      assert.deepEqual(others, [], `${locale} ${id}: ${line}`);
    }
  }
});
