import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  collectReleaseFiles,
  createReleaseEvidence,
  describeFiles,
  formatSha256Manifest,
  inferGateStatus,
} from '../scripts/lib/release-evidence.mjs';

test('release artifacts and checksums are stable and sorted', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'blackline-release-'));
  await mkdir(path.join(root, 'nested'));
  await writeFile(path.join(root, 'z.zip'), 'zip payload');
  await writeFile(path.join(root, 'nested', 'a.dmg'), 'dmg payload');
  await writeFile(path.join(root, 'ignored.txt'), 'not a release artifact');

  const files = await collectReleaseFiles(root);
  const entries = await describeFiles(files, root);
  assert.deepEqual(entries.map((entry) => entry.path), ['nested/a.dmg', 'z.zip']);
  assert.match(formatSha256Manifest(entries), /^[a-f0-9]{64}  nested\/a\.dmg\n[a-f0-9]{64}  z\.zip\n$/);
});

test('release evidence preserves provenance without hidden defaults', () => {
  const evidence = createReleaseEvidence({
    generatedAt: '2026-07-14T00:00:00.000Z',
    product: 'Blackline Survivor',
    version: '0.1.0',
    commit: 'abc123',
    artifacts: [{ path: 'release/game.zip', bytes: 3, sha256: 'hash' }],
    gates: [{ name: 'production-bundle', status: 'passed' }],
    sbom: { format: 'CycloneDX JSON', sha256: 'sbom-hash' },
    checksumManifest: { algorithm: 'SHA-256', sha256: 'manifest-hash' },
    runtime: 'v22.6.0',
    platform: 'darwin',
    arch: 'arm64',
  });

  assert.equal(evidence.schemaVersion, 1);
  assert.deepEqual(evidence.release, {
    product: 'Blackline Survivor',
    version: '0.1.0',
    commit: 'abc123',
    runtime: 'v22.6.0',
    platform: 'darwin',
    arch: 'arm64',
  });
  assert.equal(evidence.artifacts[0].path, 'release/game.zip');
});

test('visual runtime failures cannot be recorded as captured evidence', () => {
  assert.equal(inferGateStatus({ passed: true }), 'passed');
  assert.equal(inferGateStatus({ passed: false }), 'failed');
  assert.equal(inferGateStatus({ gates: { completeMatrix: true, noTimeouts: true } }), 'passed');
  assert.equal(inferGateStatus({ gates: { completeMatrix: true, noTimeouts: false } }), 'failed');
  assert.equal(inferGateStatus({ runtimeFailures: ['capture count mismatch'], summary: { failed: 0 } }), 'failed');
  assert.equal(inferGateStatus({ runtimeFailures: [], summary: { failed: 1 } }), 'failed');
  assert.equal(inferGateStatus({ runtimeFailures: [], summary: { failed: 0 } }), 'passed');
  assert.equal(inferGateStatus({ summary: { scenarioCount: 50 } }), 'captured');
});
