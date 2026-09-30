import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { createVortexProfile } from './p0Core.ts';
import {
  CLASSIC_AWAKENING_TEXT,
  SKILL_AWAKENING_TEXT,
  SKILL_LEVEL_TEXT,
  SKILL_NUMBERS,
  formatNumber,
  frostLineSlow,
  mirrorCloneVolley,
  needleCount,
  scaleAt,
} from './skillNumbers.ts';

// Skill number snapshot (BUG-16): any change to a skill number or its card copy shows up here as a diff.
// After an intended balance change, review the diff and refresh with UPDATE_SKILL_SNAPSHOT=1 npm run test:unit.
const SNAPSHOT = new URL('./skillNumbers.snapshot.json', import.meta.url);

function currentSnapshot() {
  const levelText = Object.fromEntries(
    Object.entries(SKILL_LEVEL_TEXT).map(([id, text]) => [id, [1, 2, 3, 4, 5].map((level) => text(level))]),
  );
  return {
    numbers: JSON.parse(JSON.stringify(SKILL_NUMBERS)),
    levelText,
    awakeningText: SKILL_AWAKENING_TEXT,
    classicAwakeningText: CLASSIC_AWAKENING_TEXT,
  };
}

test('skill numbers and card copy match the reviewed snapshot', () => {
  const current = currentSnapshot();
  if (process.env.UPDATE_SKILL_SNAPSHOT === '1') writeFileSync(SNAPSHOT, `${JSON.stringify(current, null, 2)}\n`);
  const expected = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  assert.deepEqual(current, expected, 'skill numbers changed: review the diff, then rerun with UPDATE_SKILL_SNAPSHOT=1');
});

test('card copy never prints float noise', () => {
  const lines = [
    ...Object.values(SKILL_LEVEL_TEXT).flatMap((text) => [1, 2, 3, 4, 5].map((level) => text(level))),
    ...Object.values(SKILL_AWAKENING_TEXT),
  ];
  for (const line of lines) assert.doesNotMatch(line, /\d\.\d{3,}/, line);
  assert.equal(formatNumber(3 * 0.35), '1.05');
  assert.equal(formatNumber(3 * 1.2), '3.6');
  assert.equal(formatNumber(0.25), '0.25');
});

test('copy states the numbers the skills use', () => {
  assert.equal(SKILL_LEVEL_TEXT.railSpear(3), `폭 +${3 * SKILL_NUMBERS.railSpear.width.perLevel}, 피해 +96%`);
  assert.match(SKILL_LEVEL_TEXT.voidMine(1), /흡입력 \+19%/, 'void mine pull grows 14 on a base of 74 per level');
  assert.match(SKILL_LEVEL_TEXT.blackSun(3), /지속 \+1\.05s, 흡입력 \+65%/);
  assert.equal(createVortexProfile('voidMine', 3, false).pull, scaleAt(SKILL_NUMBERS.voidMine.pull, 3));
  assert.equal(createVortexProfile('blackSun', 5, true).pull, 74 + 5 * 16 + 55);
  assert.equal(needleCount(5, true), 5);
  assert.equal(frostLineSlow(9), 0.7);
});

test('the reworked mirror clone awakening always adds shots and pierce', () => {
  assert.deepEqual(mirrorCloneVolley(5, false), { flankShots: 2, aimedShots: 0, pierce: 3 });
  assert.deepEqual(mirrorCloneVolley(5, true), { flankShots: 2, aimedShots: 2, pierce: 4 });
  assert.doesNotMatch(SKILL_AWAKENING_TEXT.mirrorClone, /가끔/);
  assert.match(CLASSIC_AWAKENING_TEXT.mirrorClone ?? '', /레일이 없으면 효과가 없습니다/);
});
