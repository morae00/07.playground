import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const REQUIRED_DEVELOPER_MARKERS = Object.freeze([
  'DEV APP',
  '개발자 모드: 모든 Stage 접근',
  'Cheat Code',
  '개발 도구',
  'DEV MODE ON',
  'GOLD999',
  'GOD ON',
  'COIN +999',
  'MAGNET +5',
  'DRAFT OPEN',
  'OBJECTIVE CLEARED',
  // Player-facing controls live in the string table (UI-10), which the scan reads too.
  'ENDLESS SCORE ATTACK',
  '무한 모드 시작',
  '연습 · 기록 제외',
  'LOOP FAULT ARMED',
  'UI FAULT ARMED',
  'PLAYER DOWN',
  'BUILD DEPTH ON',
  'CHAPTER TURN',
]);

async function collectText(root) {
  const contents = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(target);
      if (entry.isFile() && /\.(?:css|html|js|mjs|json)$/.test(entry.name)) {
        contents.push(await readFile(target, 'utf8'));
      }
    }
  }
  await visit(root);
  return contents.join('\n');
}

const distRoot = path.resolve(process.env.DEVELOPER_DIST ?? 'dist-developer');
const content = await collectText(distRoot);
const missing = REQUIRED_DEVELOPER_MARKERS.filter((marker) => !content.includes(marker));

if (missing.length > 0) {
  throw new Error(`Developer bundle is missing required controls:\n${missing.map((marker) => `- ${marker}`).join('\n')}`);
}

console.log(`Developer bundle passed: ${REQUIRED_DEVELOPER_MARKERS.length} required controls found`);
