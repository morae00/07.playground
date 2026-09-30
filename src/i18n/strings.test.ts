import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { localeTable } from './localeFile.ts';
import { installStrings, t, tx } from './strings.ts';
import { text } from './text.ts';

// String checks (UI-10), the missing-translation gate in CI. Keys named in code are checked by the compiler
// (StringKey is the Korean table's keys, template keys included); these tests check the tables themselves and that
// no player-facing words are left in code.
const SRC = fileURLToPath(new URL('..', import.meta.url));
const ko = localeTable('ko');
const en = localeTable('en');
const HANGUL = /[가-힣]/;
const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

function sourceFiles(dir = SRC): string[] {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) return sourceFiles(file);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [file] : [];
  });
}

/** Code with comments blanked out, so words in comments do not count. */
function code(file: string) {
  return readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

test('UI-10: every locale has the same keys, every string is filled, and English is a translation', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ko).sort(), 'en and ko have the same keys');
  for (const [key, value] of Object.entries(ko)) assert.ok(value.trim().length > 0, `ko ${key} is empty`);
  for (const [key, value] of Object.entries(en)) {
    assert.ok(value.trim().length > 0, `en ${key} is empty`);
    assert.doesNotMatch(value, HANGUL, `en ${key} is still Korean`);
  }
});

test('UI-10: a translation keeps the placeholders of its Korean string', () => {
  for (const [key, value] of Object.entries(ko)) assert.deepEqual(placeholders(en[key]), placeholders(value), key);
});

test('UI-10: every key is used by code, directly or through a template key', () => {
  const sources = sourceFiles().map(code).join('\n');
  const literals = new Set([...sources.matchAll(/'([\w.-]+)'/g)].map((match) => match[1]));
  // Key-shaped templates such as `skill.${id}.summary` stand for every key their holes can fill.
  const templates = [...sources.matchAll(/`([\w.-]*(?:\$\{[^}`]*\}[\w.-]*)+)`/g)]
    .map((match) => new RegExp(`^${match[1].split(/\$\{[^}]*\}/).map((part) => part.replace(/[.-]/g, '\\$&')).join('[\\w-]+')}$`));
  const unused = Object.keys(ko).filter((key) => !literals.has(key) && !templates.some((pattern) => pattern.test(key)));
  assert.deepEqual(unused, [], 'strings nothing shows');
});

// Words that stay in code, and why: developer-only UI (never in shipped builds), the recovery screens (shown when
// the app or its string table failed to load), and internal descriptors no screen shows.
const ALLOWED: Record<string, readonly string[]> = {
  'main.tsx': ['게임을 불러오지 못했습니다', '게임 파일을 읽는 중 오류가 났습니다'],
  'ui/ErrorBoundary.tsx': ['오류 로그를 복사했습니다', '클립보드를 사용할 수 없어', '메뉴로 돌아가기', '로그 복사', '다시 불러오기', '화면을 그리다 문제가 생겼습니다', '진행 중이던 런은'],
  'ui/screens/DevPanel.tsx': ['개발 도구', '입력'],
  'ui/screens/HudLayer.tsx': ['적', '개발 패널'],
  'ui/screens/MenuScreen.tsx': ['개발자 모드: 모든 Stage 접근', '입력', '개발자 모드 Run은'],
  'ui/screens/SettingsPanel.tsx': ['쇼케이스'],
  'App.tsx': ['게임 중 사용 가능한 코드입니다'],
  'game/render/visualRegistry.ts': ['먹선 골목', '철문 예배당', '무채 운하', '시계 무덤', '일식 관문'],
  'content/encounters.ts': ['직교 골목을', '방사형 리브가', '수평 수로가', '회전축을 따라', '동심원 안전 공간이'],
};

test('UI-10: no player-facing Korean is left in code outside the strings files', () => {
  for (const file of sourceFiles()) {
    const relative = path.relative(SRC, file).split(path.sep).join('/');
    const lines = code(file).split('\n').filter((line) => HANGUL.test(line));
    const allowed = ALLOWED[relative] ?? [];
    for (const line of lines) {
      assert.ok(allowed.some((phrase) => line.includes(phrase)), `${relative}: ${line.trim().slice(0, 100)}`);
    }
  }
});

test('UI-10: t fills placeholders, resolves nested texts, and shows a missing key as itself', () => {
  installStrings(ko, 'ko');
  assert.equal(t('stage.address', { chapter: 2, stage: 7 }), 'Ch.2 / St.7');
  assert.equal(tx(text('draft.awakening', { skill: text('skill.railSpear') })), '흑선 레일 각성');
  assert.equal(t('draft.skillLevel', { skill: '먹선 바늘' }), '먹선 바늘 Lv.{level}', 'an unfilled placeholder stays visible');
  installStrings({}, 'ko');
  assert.equal(t('game.title'), 'game.title');
  installStrings(en, 'en');
  assert.equal(tx(text('draft.awakening', { skill: text('skill.railSpear') })), 'Awaken Black Rail');
});
