// Rebuilds test/fixtures/chromium-local-storage (D-25): a localStorage folder that this project's Electron (its
// Chromium) wrote for a file: page, which electron/levelDbReader.test.cjs reads back. Run it after an Electron
// upgrade; the test's expected entries do not change.
// Usage: npm run build && node scripts/make-local-storage-fixture.mjs
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const target = path.join(root, 'test/fixtures/chromium-local-storage');
const userData = mkdtempSync(path.join(os.tmpdir(), 'blackline-fixture-'));
try {
  for (const step of ['1', '2']) {
    const result = spawnSync(require('electron'), [path.join(root, 'scripts/lib/electron-local-storage-fixture.cjs')], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, GEN_STEP: step, GEN_USER_DATA: userData, GEN_PAGE: path.join(root, 'dist/storage-bridge.html') },
    });
    if (result.status !== 0) throw new Error(`launch ${step} failed`);
  }
  const source = path.join(userData, 'Local Storage', 'leveldb');
  const files = readdirSync(source).filter((name) => /^(\d+\.(log|ldb|sst)|CURRENT|MANIFEST-\d+)$/.test(name));
  if (!files.some((name) => name.endsWith('.ldb') || name.endsWith('.sst'))) throw new Error('no table was written; the fillers did not reach the disk');
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  for (const name of files) copyFileSync(path.join(source, name), path.join(target, name));
  console.log(`fixture: ${files.join(', ')}`);
} finally {
  rmSync(userData, { recursive: true, force: true });
}
