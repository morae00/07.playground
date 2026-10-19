import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { ARSENAL_IDS } from '../arsenal.ts';
import { CUES, SAMPLE_PEAK } from '../audioPolicy.ts';

// The v0 SFX pack (AUD-02): scripts/build-sfx.mjs bakes art/sfx-spec.mjs into public/assets/packs/sfx-common.
const root = new URL('../../../', import.meta.url);
const pack = JSON.parse(readFileSync(new URL('public/assets/packs/sfx-common/pack.json', root), 'utf8'));

test('the pack gives every cue at least one sample, and names no cue the game does not have', () => {
  assert.deepEqual(Object.keys(pack.cues).sort(), Object.keys(CUES).sort());
  for (const [cue, files] of Object.entries(pack.cues) as [string, string[]][]) {
    assert.ok(files.length >= 1, cue);
    for (const file of files) assert.ok(existsSync(new URL(`public/${pack.base}${file}`, root)), `${cue}: ${file}`);
  }
  const hits = ['hit.light', 'hit.heavy', 'hit.critical'].map((cue) => pack.cues[cue].length);
  assert.ok(hits.every((count) => count >= 3), 'hits come in three or more variants');
});

test('pack files are 16-bit mono WAV normalized to the peak the mixer assumes', () => {
  const spec = readFileSync(new URL('art/sfx-spec.mjs', root), 'utf8');
  assert.equal(Number(/export const SFX_PEAK = ([\d.]+);/.exec(spec)?.[1]), SAMPLE_PEAK);
  for (const files of Object.values(pack.cues) as string[][]) {
    const data = readFileSync(new URL(`public/${pack.base}${files[0]}`, root));
    assert.equal(data.toString('ascii', 0, 4), 'RIFF');
    assert.equal(data.toString('ascii', 8, 12), 'WAVE');
    assert.deepEqual([data.readUInt16LE(20), data.readUInt16LE(22), data.readUInt16LE(34)], [1, 1, 16], `${files[0]}: PCM, mono, 16-bit`);
    let peak = 0;
    for (let offset = 44; offset < data.length; offset += 2) peak = Math.max(peak, Math.abs(data.readInt16LE(offset)));
    assert.ok(Math.abs(peak / 32767 - SAMPLE_PEAK) < 0.001, `${files[0]} peaks at ${SAMPLE_PEAK}`);
  }
});

test('every arsenal weapon has its own cast cue (K10 Q7)', () => {
  const missing = ARSENAL_IDS.filter((id) => !(`cast.${id}` in CUES));
  assert.deepEqual(missing, []);
});
