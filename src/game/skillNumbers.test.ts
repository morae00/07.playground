import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { createVortexProfile } from './p0Core.ts';
import type { SkillId } from './engine/worldTypes.ts';
import { installLocaleFile } from '../i18n/localeFile.ts';
import { t, tp, tx } from '../i18n/strings.ts';
import {
  CLASSIC_AWAKENING_TEXT,
  SKILL_AWAKENING_TEXT,
  SKILL_LEVEL_STATS,
  SKILL_NUMBERS,
  formatNumber,
  frostLineSlow,
  mirrorCloneVolley,
  needleCount,
  scaleAt,
  skillLevelText,
} from './skillNumbers.ts';

// The copy is Korean templates filled with the numbers (UI-10); the snapshot pins the Korean text.
installLocaleFile('ko');
const SKILL_IDS = Object.keys(SKILL_LEVEL_STATS) as SkillId[];
const levelLine = (id: SkillId, level: number) => tx(skillLevelText(id, level));

// Skill number snapshot (BUG-16): any change to a skill number or its card copy shows up here as a diff.
// After an intended balance change, review the diff and refresh with UPDATE_SKILL_SNAPSHOT=1 npm run test:unit.
const SNAPSHOT = new URL('./skillNumbers.snapshot.json', import.meta.url);

function currentSnapshot() {
  const levelText = Object.fromEntries(SKILL_IDS.map((id) => [id, [1, 2, 3, 4, 5].map((level) => levelLine(id, level))]));
  const resolved = (copy: Partial<Record<SkillId, Parameters<typeof tx>[0]>>) =>
    Object.fromEntries(Object.entries(copy).map(([id, value]) => [id, tx(value!)]));
  return {
    numbers: JSON.parse(JSON.stringify(SKILL_NUMBERS)),
    levelText,
    awakeningText: resolved(SKILL_AWAKENING_TEXT),
    classicAwakeningText: resolved(CLASSIC_AWAKENING_TEXT),
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
    ...SKILL_IDS.flatMap((id) => [1, 2, 3, 4, 5].map((level) => levelLine(id, level))),
    ...Object.values(SKILL_AWAKENING_TEXT).map(tx),
  ];
  for (const line of lines) assert.doesNotMatch(line, /\d\.\d{3,}/, line);
  assert.equal(formatNumber(3 * 0.35), '1.05');
  assert.equal(formatNumber(3 * 1.2), '3.6');
  assert.equal(formatNumber(0.25), '0.25');
});

test('copy states the numbers the skills use', () => {
  assert.equal(levelLine('railSpear', 3), `폭 +${3 * SKILL_NUMBERS.railSpear.width.perLevel}, 피해 +96%`);
  assert.match(levelLine('voidMine', 1), /흡입력 \+19%/, 'void mine pull grows 14 on a base of 74 per level');
  assert.match(levelLine('blackSun', 3), /지속 \+1\.05s, 흡입력 \+65%/);
  assert.equal(createVortexProfile('voidMine', 3, false).pull, scaleAt(SKILL_NUMBERS.voidMine.pull, 3));
  assert.equal(createVortexProfile('blackSun', 5, true).pull, 74 + 5 * 16 + 55);
  assert.equal(needleCount(5, true), 5);
  assert.equal(frostLineSlow(9), 0.7);
});

test('a skill prints the same stat rows at every level, so a draft card can show each change (UI-03)', () => {
  for (const [id, stats] of Object.entries(SKILL_LEVEL_STATS)) {
    const labels = stats(1).map(([label]) => label);
    for (const level of [0, 2, 3, 4, 5]) assert.deepEqual(stats(level).map(([label]) => label), labels, `${id} Lv.${level}`);
  }
  assert.deepEqual(SKILL_LEVEL_STATS.needleStorm(3).map(([label, value]) => [t(label), tp(value)]), [['피해', '+54%'], ['투사체', '2개']]);
  assert.equal(levelLine('needleStorm', 3), '피해 +54%, 투사체 2개');
});

test('the reworked mirror clone awakening always adds shots and pierce', () => {
  assert.deepEqual(mirrorCloneVolley(5, false), { flankShots: 2, aimedShots: 0, pierce: 3 });
  assert.deepEqual(mirrorCloneVolley(5, true), { flankShots: 2, aimedShots: 2, pierce: 4 });
  assert.doesNotMatch(tx(SKILL_AWAKENING_TEXT.mirrorClone), /가끔/);
  assert.match(tx(CLASSIC_AWAKENING_TEXT.mirrorClone!), /레일이 없으면 효과가 없습니다/);
});
