import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export const PRODUCTION_BANNED_MARKERS = Object.freeze([
  '개발자 모드: 모든 Stage 접근',
  'Cheat Code',
  '개발 도구',
  'DEV MODE ON',
  'DEV MODE OFF',
  'GOLD999',
  'METAUP',
  'GOD ON',
  'GOD OFF',
  'COIN +999',
  'MAGNET +5',
  'NUKE',
  'DRAFT OPEN',
  'ENEMIES CLEARED',
  'OBJECTIVE CLEARED',
  'UNKNOWN CODE',
]);

async function collectTextFiles(root) {
  const files = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(target);
      if (entry.isFile() && /\.(?:css|html|js|mjs)$/.test(entry.name)) files.push(target);
    }
  }
  await visit(root);
  return files.sort();
}

export async function auditProductionBundle(root, markers = PRODUCTION_BANNED_MARKERS) {
  const absoluteRoot = path.resolve(root);
  const files = await collectTextFiles(absoluteRoot);
  if (files.length === 0) throw new Error(`Production bundle contains no auditable text assets: ${absoluteRoot}`);
  const findings = [];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const marker of markers) {
      if (content.includes(marker)) findings.push({ file: path.relative(absoluteRoot, file), marker });
    }
  }
  return {
    version: 1,
    root: absoluteRoot,
    files: files.map((file) => path.relative(absoluteRoot, file)),
    markersChecked: markers.length,
    findings,
    passed: findings.length === 0,
  };
}
