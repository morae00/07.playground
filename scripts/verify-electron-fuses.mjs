import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { FuseV1Options, getCurrentFuseWire } from '@electron/fuses';

const require = createRequire(import.meta.url);
const { FuseState } = require('@electron/fuses/dist/constants');
const expected = new Map([
  [FuseV1Options.RunAsNode, FuseState.DISABLE],
  [FuseV1Options.EnableCookieEncryption, FuseState.ENABLE],
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable, FuseState.DISABLE],
  [FuseV1Options.EnableNodeCliInspectArguments, FuseState.DISABLE],
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation, FuseState.ENABLE],
  [FuseV1Options.OnlyLoadAppFromAsar, FuseState.ENABLE],
  [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot, FuseState.ENABLE],
  [FuseV1Options.GrantFileProtocolExtraPrivileges, FuseState.ENABLE],
]);

async function findApps(root) {
  const apps = [];
  async function visit(current) {
    const info = await stat(current);
    if (info.isDirectory() && current.endsWith('.app')) {
      apps.push(current);
      return;
    }
    if (info.isDirectory()) {
      for (const entry of await readdir(current)) await visit(path.join(current, entry));
    }
  }
  await visit(root);
  return apps.sort();
}

async function executableForApp(appPath) {
  const executableDirectory = path.join(appPath, 'Contents', 'MacOS');
  const entries = await readdir(executableDirectory, { withFileTypes: true });
  const executable = entries.find((entry) => entry.isFile());
  if (!executable) throw new Error(`No Electron executable found in ${executableDirectory}`);
  return path.join(executableDirectory, executable.name);
}

const root = path.resolve(process.argv[2] ?? 'release');
const apps = await findApps(root);
if (apps.length === 0) throw new Error(`No packaged .app found under ${root}`);

for (const appPath of apps) {
  const executable = await executableForApp(appPath);
  const wire = await getCurrentFuseWire(executable);
  const failures = [];
  for (const [option, state] of expected) {
    if (wire[option] !== state) failures.push(`${FuseV1Options[option]}=${FuseState[wire[option]]}, expected ${FuseState[state]}`);
  }
  if (failures.length > 0) throw new Error(`Electron fuse mismatch in ${appPath}:\n${failures.join('\n')}`);
  console.log(`Electron fuses passed: ${path.relative(process.cwd(), appPath)}`);
}
