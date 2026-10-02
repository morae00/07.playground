// Seeds a data folder with file: origin localStorage before a desktop tool launches the app (TEC-09, TEC-15): the
// entries a player of a 0.1.0 (file:) build would have. The app then moves them on its first launch.
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');

export function seedFileStorage(userDataDir, entries) {
  const result = spawnSync(require('electron'), [path.join(root, 'scripts/lib/electron-file-seed.cjs')], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, SEED_USER_DATA: userDataDir, SEED_ENTRIES: JSON.stringify(entries), SEED_PAGE: path.join(root, 'dist', 'storage-bridge.html') },
    timeout: 60_000,
  });
  const note = path.join(userDataDir, 'file-seed.json');
  if (result.status !== 0 || !existsSync(note)) {
    throw new Error(`seeding the file: origin failed (${result.status}): ${result.stderr?.slice(-400) ?? ''}`);
  }
  rmSync(note);
}
