import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

async function collectArtifacts(root) {
  const artifacts = [];
  async function visit(current) {
    const info = await stat(current);
    if (info.isDirectory() && current.endsWith('.app')) {
      artifacts.push({ kind: 'app', path: current });
      return;
    }
    if (info.isDirectory()) {
      for (const entry of await readdir(current)) await visit(path.join(current, entry));
      return;
    }
    if (current.endsWith('.dmg')) artifacts.push({ kind: 'dmg', path: current });
    if (current.endsWith('.zip')) artifacts.push({ kind: 'zip', path: current });
  }
  await visit(root);
  return artifacts;
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: 'pipe' });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
}

async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

const releaseRoot = path.resolve(process.argv[2] ?? 'release');
let artifacts;
try {
  artifacts = await collectArtifacts(releaseRoot);
} catch (error) {
  throw new Error(`Release directory is unavailable: ${releaseRoot}`, { cause: error });
}
if (artifacts.length === 0) throw new Error(`No .app, .dmg, or .zip artifacts found under ${releaseRoot}`);

for (const artifact of artifacts.sort((left, right) => left.path.localeCompare(right.path))) {
  if (artifact.kind === 'app') {
    run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', artifact.path]);
    run('spctl', ['--assess', '--type', 'execute', '--verbose=4', artifact.path]);
    continue;
  }
  if (artifact.kind === 'dmg') run('xcrun', ['stapler', 'validate', artifact.path]);
  process.stdout.write(`${await sha256(artifact.path)}  ${artifact.path}\n`);
}

if (artifacts.some((artifact) => artifact.kind === 'app')) {
  run(process.execPath, [path.join(import.meta.dirname, 'verify-electron-fuses.mjs'), releaseRoot]);
}

if (artifacts.some((artifact) => artifact.kind === 'dmg' || artifact.kind === 'zip')) {
  run(process.execPath, [path.join(import.meta.dirname, 'create-release-evidence.mjs'), releaseRoot]);
} else {
  process.stdout.write('Release evidence skipped: no distributable DMG or ZIP was found.\n');
}
