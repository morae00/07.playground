import assert from 'node:assert/strict';
import test from 'node:test';
import { kWeighting, measureLoudness, readWav, writeFloatWav } from './loudness.ts';

const RATE = 48_000;

/** A sine of `seconds` at `hz`, peak `dbfs`, with a phase offset in radians. */
function sine(seconds: number, hz: number, dbfs: number, phase = 0) {
  const samples = new Float32Array(Math.round(seconds * RATE));
  const amplitude = 10 ** (dbfs / 20);
  for (let i = 0; i < samples.length; i += 1) samples[i] = amplitude * Math.sin((2 * Math.PI * hz * i) / RATE + phase);
  return samples;
}

function join(...parts: Float32Array[]) {
  const out = new Float32Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

const near = (actual: number, expected: number, tolerance: number, what: string) => assert.ok(Math.abs(actual - expected) <= tolerance, `${what}: ${actual.toFixed(3)}, expected ${expected} ± ${tolerance}`);

test('AUD-05: the K-weighting filters match the coefficients printed in BS.1770-4 at 48 kHz', () => {
  const [shelf, highPass] = kWeighting(48_000);
  const printed = [[1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585], [1, -1.99004745483398, 0.99007225036621]];
  [shelf.b, shelf.a, highPass.a].forEach((row, index) => row.forEach((value, at) => near(value, printed[index][at], 1e-8, `row ${index} coefficient ${at}`)));
});

test('AUD-05: a full-scale 1 kHz sine reads −3.01 LUFS in one channel and 0 in two (the standard\'s calibration)', () => {
  const tone = sine(10, 997, 0);
  const mono = measureLoudness([tone], RATE);
  near(mono.integrated, -3.01, 0.05, 'mono integrated');
  near(mono.momentaryMax, -3.01, 0.05, 'mono momentary');
  near(mono.shortTermMax, -3.01, 0.05, 'mono short-term');
  near(mono.range, 0, 0.1, 'a steady tone has no range');
  near(measureLoudness([tone, tone], RATE).integrated, 0, 0.05, 'stereo integrated');
});

test('AUD-05: gating leaves out silence and passages more than 10 LU under the rest', () => {
  const steady = measureLoudness([sine(10, 997, -20)], RATE).integrated;
  near(steady, -23.01, 0.05, 'a −20 dBFS tone');
  // The blocks that straddle the edge pass both gates and pull it down a little, as the standard has it.
  near(measureLoudness([join(sine(10, 997, -20), new Float32Array(10 * RATE))], RATE).integrated, steady, 0.1, 'with 10 s of silence');
  near(measureLoudness([join(sine(10, 997, -20), sine(10, 997, -40))], RATE).integrated, steady, 0.15, 'with 10 s 20 dB quieter');
});

test('AUD-05: the loudness range of 20 s at −20 then 20 s at −30 LUFS is 10 LU (EBU Tech 3342 case 1)', () => {
  // A 1 kHz sine at x dBFS reads x − 3.01 LUFS in one channel, so x in two.
  const left = join(sine(20, 1000, -20), sine(20, 1000, -30));
  const result = measureLoudness([left, left], RATE);
  near(result.range, 10, 1, 'range');
  near(result.shortTermMax, -20, 0.2, 'the louder half');
});

test('AUD-05: the true peak finds a peak between samples that the sample peak misses', () => {
  // 12 kHz at 48 kHz, 45° off: every sample lands at ±0.707 of the wave's peak.
  const result = measureLoudness([sine(1, RATE / 4, -1, Math.PI / 4)], RATE);
  near(result.samplePeak, -1 - 3.01, 0.05, 'sample peak');
  near(result.truePeak, -1, 0.5, 'true peak');
});

test('AUD-05: a clip shorter than one block has a momentary value but no integrated loudness', () => {
  const click = measureLoudness([sine(0.1, 997, 0)], RATE);
  assert.equal(click.integrated, -Infinity);
  near(click.momentaryMax, -3.01 + 10 * Math.log10(0.1 / 0.4), 0.1, 'a quarter of a block');
  assert.equal(measureLoudness([new Float32Array(RATE)], RATE).integrated, -Infinity, 'silence');
});

test('AUD-05: WAV files read back the same samples, 16-bit PCM and 32-bit float', () => {
  const left = sine(0.05, 440, -6);
  const right = sine(0.05, 660, -12);
  const float = readWav(writeFloatWav([left, right], 44_100));
  assert.equal(float.rate, 44_100);
  assert.deepEqual(float.channels, [left, right]);
  // 16-bit mono, as the SFX baker writes it.
  const pcm = new Uint8Array(44 + 4);
  const view = new DataView(pcm.buffer);
  [...'RIFF'].forEach((c, i) => { pcm[i] = c.charCodeAt(0); });
  [...'WAVEfmt '].forEach((c, i) => { pcm[8 + i] = c.charCodeAt(0); });
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 22_050, true);
  view.setUint16(34, 16, true);
  [...'data'].forEach((c, i) => { pcm[36 + i] = c.charCodeAt(0); });
  view.setUint32(40, 4, true);
  view.setInt16(44, 16_384, true);
  view.setInt16(46, -32_768, true);
  const read = readWav(pcm);
  assert.equal(read.rate, 22_050);
  assert.deepEqual([...read.channels[0]], [0.5, -1]);
});
