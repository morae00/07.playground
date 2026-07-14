import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  collectReleaseFiles,
  createReleaseEvidence,
  describeFiles,
  formatSha256Manifest,
  inferGateStatus,
  sha256File,
} from './lib/release-evidence.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const releaseRoot = path.resolve(projectRoot, process.argv[2] ?? 'release');
const outputRoot = path.resolve(
  projectRoot,
  process.env.RELEASE_EVIDENCE_DIR ?? 'artifacts/release-evidence',
);

async function readPackage() {
  return JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
}

async function describeOptionalEvidence(name, relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  try {
    const info = await stat(absolutePath);
    let status = 'captured';
    if (absolutePath.endsWith('.json')) {
      const payload = JSON.parse(await readFile(absolutePath, 'utf8'));
      status = inferGateStatus(payload);
    }
    return {
      name,
      path: relativePath,
      bytes: info.size,
      sha256: await sha256File(absolutePath),
      status,
    };
  } catch (error) {
    if (error?.code === 'ENOENT') return { name, path: relativePath, status: 'missing' };
    throw error;
  }
}

function generateSbom() {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(
    command,
    ['sbom', '--package-lock-only', '--sbom-format=cyclonedx'],
    { cwd: projectRoot, encoding: 'utf8', stdio: 'pipe' },
  );
  if (result.status !== 0) {
    throw new Error(`SBOM generation failed:\n${result.stderr || result.stdout}`);
  }
  const parsed = JSON.parse(result.stdout);
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

const releaseFiles = await collectReleaseFiles(releaseRoot).catch((error) => {
  throw new Error(`Release directory is unavailable: ${releaseRoot}`, { cause: error });
});
if (releaseFiles.length === 0) {
  throw new Error(`No distributable .dmg, .zip, .blockmap, or update metadata found under ${releaseRoot}`);
}

await mkdir(outputRoot, { recursive: true });
const packageJson = await readPackage();
const artifacts = await describeFiles(releaseFiles, projectRoot);

const checksumPath = path.join(outputRoot, 'checksums.sha256');
await writeFile(checksumPath, formatSha256Manifest(artifacts), 'utf8');

const sbomPath = path.join(outputRoot, 'sbom.cdx.json');
await writeFile(sbomPath, generateSbom(), 'utf8');

const gates = await Promise.all([
  describeOptionalEvidence('production-bundle', 'artifacts/release-evidence/production-bundle-audit.json'),
  describeOptionalEvidence('bundle-budget', 'artifacts/release-evidence/bundle-budget.json'),
  describeOptionalEvidence('balance-smoke', 'artifacts/balance-report.json'),
  describeOptionalEvidence('balance-full', 'artifacts/balance-full-report.json'),
  describeOptionalEvidence('performance-soak', 'artifacts/soak-report.json'),
  describeOptionalEvidence('visual', 'artifacts/visual/report.json'),
]);
const sbomInfo = await stat(sbomPath);
const checksumInfo = await stat(checksumPath);

const evidence = createReleaseEvidence({
  generatedAt: new Date().toISOString(),
  product: packageJson.productName ?? packageJson.name,
  version: packageJson.version,
  commit: process.env.GITHUB_SHA ?? process.env.CI_COMMIT_SHA ?? null,
  artifacts,
  gates,
  sbom: {
    format: 'CycloneDX JSON',
    path: path.relative(projectRoot, sbomPath).split(path.sep).join('/'),
    bytes: sbomInfo.size,
    sha256: await sha256File(sbomPath),
  },
  checksumManifest: {
    algorithm: 'SHA-256',
    path: path.relative(projectRoot, checksumPath).split(path.sep).join('/'),
    bytes: checksumInfo.size,
    sha256: await sha256File(checksumPath),
  },
});

const evidencePath = path.join(outputRoot, 'release-evidence.json');
await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
console.log(`Release evidence written: ${path.relative(projectRoot, evidencePath)}`);
console.log(`Checksummed ${artifacts.length} distributable artifact(s); captured ${gates.filter((gate) => gate.status !== 'missing').length}/${gates.length} gates.`);
