import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { BOSS_SLOTS, FIELD_BOSS_KITS } from '../game/render/assets/slots.ts';
import { SKILL_NUMBERS } from '../game/skillNumbers.ts';
import CODEX from '../content/data/codex.ts';

// The baked UI art (ART-09): art/ui-art-spec.mjs -> scripts/build-ui-art.mjs -> src/ui/art.
const artDir = new URL('./art/', import.meta.url);
const css = readFileSync(new URL('uiArt.generated.css', artDir), 'utf8');

type Sheet = { file: string; cell: [number, number]; size: [number, number]; keys: string[]; positions: string[] };

function sheet(className: string): Sheet {
  const block = new RegExp(`\\.${className} \\{([^}]*)\\}`).exec(css);
  assert.ok(block, `${className} has a base rule`);
  const [, width, height] = /aspect-ratio: (\d+) \/ (\d+);/.exec(block[1]) ?? [];
  const [, file] = /url\("\.\/([\w-]+\.webp)"\)/.exec(block[1]) ?? [];
  const [, columns, rows] = /background-size: (\d+)% (\d+)%;/.exec(block[1]) ?? [];
  const cells = [...css.matchAll(new RegExp(`\\.${className}\\[data-art="([\\w-]+)"\\] \\{ background-position: ([\\d.]+%) ([\\d.]+%); \\}`, 'g'))];
  return {
    file,
    cell: [Number(width), Number(height)],
    size: [Number(columns) / 100, Number(rows) / 100],
    keys: cells.map((match) => match[1]),
    positions: cells.map((match) => `${match[2]} ${match[3]}`),
  };
}

/** Canvas size of a WebP file (Chromium writes VP8X, the extended format, for images with alpha). */
function webpSize(file: string): [number, number] {
  const bytes = readFileSync(new URL(file, artDir));
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 16), 'WEBPVP8X', `${file} is an extended WebP with alpha`);
  return [bytes.readUIntLE(24, 3) + 1, bytes.readUIntLE(27, 3) + 1];
}

const skills = Object.keys(SKILL_NUMBERS);
const withAwakened = skills.flatMap((id) => [id, `${id}-awakened`]);

test('every sheet is a grid of equal @2x cells, and each key shows its own cell', () => {
  for (const className of ['artTile', 'artSlot', 'artPortrait', 'artPickup', 'artKeyart', 'artChapter', 'artEnemy', 'artTerrain']) {
    const { file, cell, size: [columns, rows], keys, positions } = sheet(className);
    const [width, height] = webpSize(file);
    assert.equal(width, cell[0] * 2 * columns, `${className}: ${columns} columns of ${cell[0]} CSS px at @2x`);
    assert.equal(height, cell[1] * 2 * rows, `${className}: ${rows} rows of ${cell[1]} CSS px at @2x`);
    assert.ok(keys.length > (rows - 1) * columns && keys.length <= rows * columns, `${className}: the last row is in use`);
    assert.equal(new Set(keys).size, keys.length, `${className}: keys are unique`);
    assert.equal(new Set(positions).size, positions.length, `${className}: every key has its own cell`);
  }
});

test('draft tiles and HUD slots cover every skill, plain and awakened, and every bonus card', () => {
  assert.deepEqual(sheet('artTile').keys, [...withAwakened, 'bonus-heal-common', 'bonus-coins-rare', 'bonus-overdrive-rare', 'bonus-overdrive-epic']);
  assert.deepEqual(sheet('artSlot').keys, withAwakened);
});

test('portraits cover the hero expressions and every boss the kit draws; pickups the four kinds', () => {
  // The bosses with baked sprites (ART-07, ART-04) are the ones with kit art, so each gets a boss bar portrait too.
  // Field bosses have no enraged drawing; their enraged cell is the calm portrait in the coral ring.
  const bosses = [...Object.keys(BOSS_SLOTS), ...Object.keys(FIELD_BOSS_KITS)];
  assert.deepEqual(bosses, ['s1-mid-dash', 's1-final-rings', 's2-final-flame', 's3-final-traps', 's4-final-saw', 's5-final-null', 's2-mid-clones', 's3-mid-tide', 's4-mid-clock', 's5-mid-eclipse', 'field-shock', 'field-rings', 'field-trap', 'field-clock', 'field-null']);
  assert.deepEqual(sheet('artPortrait').keys, [
    ...['calm', 'focus', 'hurt', 'lowhp', 'awakened', 'victory'].map((expr) => `hero-${expr}`),
    ...bosses.flatMap((id) => [id, `${id}-enraged`]),
  ]);
  assert.deepEqual(sheet('artPickup').keys, ['xp', 'coin', 'magnet', 'heal']);
});

test('the menu sheets (UI-06) cover the key art, the five chapters, and every chapter role', () => {
  assert.deepEqual(sheet('artKeyart').keys, ['hero']);
  assert.deepEqual(sheet('artChapter').keys, [1, 2, 3, 4, 5].map((chapter) => `chapter-${chapter}`));
  assert.deepEqual(sheet('artEnemy').keys, [1, 2, 3, 4, 5].flatMap((chapter) => ['stalker', 'charger', 'shooter', 'warden'].map((role) => `${chapter}-${role}`)));
});

test('the codex sheet (CON-07) covers the nine terrain kinds the codex lists', () => {
  assert.deepEqual(sheet('artTerrain').keys, [...CODEX.terrain]);
});
