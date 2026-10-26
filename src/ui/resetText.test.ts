import assert from 'node:assert/strict';
import test from 'node:test';
import { localeTable } from '../i18n/localeFile.ts';
import { createDefaultMeta, createDefaultProfile } from '../platform/save.ts';

// UI-17: the reset confirmation names everything the reset erases (App confirmResetMeta: a default meta and profile)
// and what it keeps. A new part of the save fails this until the text says what becomes of it.
const ERASED: Record<string, readonly string[]> = {
  gold: ['금'],
  xp: ['계정 XP'],
  level: ['계정 레벨'],
  passivePoints: ['계정 레벨 패시브'],
  passives: ['계정 레벨 패시브'],
  upgrades: ['영구 강화'],
  progress: ['Stage 해금'],
  stageRecords: ['기록·별'],
  characters: ['캐릭터 해금과 강화'],
  codex: ['도감'],
  achievements: ['업적'],
  cosmetics: ['꾸밈'],
  stats: ['누적 기록'],
  storySeen: ['이야기'],
  hintsSeen: ['안내'],
  runSuspend: ['중단한 런'],
};

test('UI-17: the reset confirmation names every part of the save it erases, what it keeps, and that it is final', () => {
  const body = localeTable('ko')['reset.body'];
  const parts = [...Object.keys(createDefaultMeta()), ...Object.keys(createDefaultProfile())];
  assert.deepEqual(parts.filter((part) => !ERASED[part]), [], 'every part of the save has its words here');
  for (const part of parts) for (const words of ERASED[part]) assert.ok(body.includes(words), `${part}: ${words}`);
  for (const words of ['설정', '무한 경쟁 순위표', '되돌릴 수 없', '내보내']) assert.ok(body.includes(words), words);
});
