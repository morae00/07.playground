import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const RELEASE_FILE_SUFFIXES = ['.dmg', '.zip', '.blockmap', '.yml', '.yaml'];

export async function sha256File(filePath) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
}

export async function collectReleaseFiles(root) {
  const files = [];

  async function visit(current) {
    const info = await stat(current);
    if (info.isDirectory()) {
      const entries = await readdir(current);
      for (const entry of entries.sort()) await visit(path.join(current, entry));
      return;
    }

    if (RELEASE_FILE_SUFFIXES.some((suffix) => current.toLowerCase().endsWith(suffix))) {
      files.push(current);
    }
  }

  await visit(root);
  return files.sort((left, right) => left.localeCompare(right));
}

export async function describeFiles(files, displayRoot = process.cwd()) {
  const descriptions = [];
  for (const filePath of files) {
    const info = await stat(filePath);
    descriptions.push({
      path: path.relative(displayRoot, filePath).split(path.sep).join('/'),
      bytes: info.size,
      sha256: await sha256File(filePath),
    });
  }
  return descriptions.sort((left, right) => left.path.localeCompare(right.path));
}

export function formatSha256Manifest(entries) {
  return `${entries.map((entry) => {
    if (entry.path.includes('\n') || entry.path.includes('\r')) {
      throw new Error(`Checksum path contains a newline: ${JSON.stringify(entry.path)}`);
    }
    return `${entry.sha256}  ${entry.path}`;
  }).join('\n')}\n`;
}

export function inferGateStatus(payload) {
  if (typeof payload?.passed === 'boolean') return payload.passed ? 'passed' : 'failed';
  if (payload?.gates && typeof payload.gates === 'object') {
    const statuses = Object.values(payload.gates);
    if (statuses.length > 0 && statuses.every((status) => typeof status === 'boolean')) {
      return statuses.every(Boolean) ? 'passed' : 'failed';
    }
  }
  if (Array.isArray(payload?.failures)) return payload.failures.length === 0 ? 'passed' : 'failed';
  if (Array.isArray(payload?.runtimeFailures)) {
    const failedCaptures = Number(payload?.summary?.failed ?? 0);
    return payload.runtimeFailures.length === 0 && failedCaptures === 0 ? 'passed' : 'failed';
  }
  return 'captured';
}

export function createReleaseEvidence({
  generatedAt,
  product,
  version,
  commit,
  artifacts,
  gates,
  sbom,
  checksumManifest,
  runtime = process.version,
  platform = process.platform,
  arch = process.arch,
}) {
  return {
    schemaVersion: 1,
    generatedAt,
    release: { product, version, commit, runtime, platform, arch },
    artifacts,
    gates,
    sbom,
    checksumManifest,
  };
}
