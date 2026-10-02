// Fuse smoke (TEC-09, D-25): the desktop smoke against a copy of Electron with the file: fuse
// (GrantFileProtocolExtraPrivileges) off, as the release build ships it. It shows the first-launch save move, which
// reads the old file: origin's localStorage through a file: page, still works without the fuse. The copy lives in a
// temporary folder and is ad hoc re-signed; node_modules is not touched. The other release fuses stay as they are,
// because the smoke drives the app over the Node inspector and runs it unpackaged.
// Usage: npm run build && npm run test:electron-fuse-smoke
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { FuseV1Options, FuseVersion, flipFuses, getCurrentFuseWire } from '@electron/fuses';

const require = createRequire(import.meta.url);
const { FuseState } = require('@electron/fuses/dist/constants');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
if (process.platform !== 'darwin') throw new Error('the fuse smoke copies the macOS Electron.app');

const folder = await mkdtemp(path.join(os.tmpdir(), 'blackline-fuse-smoke-'));
try {
  const appCopy = path.join(folder, 'Electron.app');
  await cp(path.join(root, 'node_modules/electron/dist/Electron.app'), appCopy, { recursive: true, verbatimSymlinks: true });
  const executable = path.join(appCopy, 'Contents/MacOS/Electron');
  await flipFuses(executable, {
    version: FuseVersion.V1,
    resetAdHocDarwinSignature: true,
    [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
  });
  const wire = await getCurrentFuseWire(executable);
  if (wire[FuseV1Options.GrantFileProtocolExtraPrivileges] !== FuseState.DISABLE) throw new Error('the file: fuse did not flip');
  console.log('file: fuse off in the copy');
  const smoke = spawnSync(process.execPath, [path.join(root, 'scripts/electron-smoke.mjs')], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_SMOKE_EXECUTABLE: executable },
  });
  process.exitCode = smoke.status ?? 1;
} finally {
  await rm(folder, { recursive: true, force: true });
}
