import assert from 'node:assert/strict';
import test from 'node:test';
import { comparePngBuffers, encodePng, inspectPng } from '../scripts/lib/visual-evidence.mjs';

function solidPng(width, height, color) {
  const data = Buffer.alloc(width * height * 4);
  for (let offset = 0; offset < data.length; offset += 4) {
    data[offset] = color[0];
    data[offset + 1] = color[1];
    data[offset + 2] = color[2];
    data[offset + 3] = color[3];
  }
  return encodePng({ width, height, data });
}

test('PNG comparison produces a deterministic red diff for changed pixels', () => {
  const expected = solidPng(2, 2, [244, 244, 241, 255]);
  const changed = Buffer.from(expected);
  const decoded = solidPng(2, 2, [10, 10, 10, 255]);
  const comparison = comparePngBuffers(decoded, changed, { pixelTolerance: 0 });
  assert.equal(comparison.sizeMismatch, false);
  assert.equal(comparison.mismatchedPixels, 4);
  assert.equal(comparison.mismatchRatio, 1);
  assert.ok(comparison.diff.length > 0);
});

test('PNG comparison tolerates bounded channel noise', () => {
  const expected = solidPng(3, 2, [100, 100, 100, 255]);
  const actual = solidPng(3, 2, [112, 108, 110, 255]);
  const comparison = comparePngBuffers(actual, expected, { pixelTolerance: 12 });
  assert.equal(comparison.mismatchedPixels, 0);
});

test('PNG inspection distinguishes a blank frame from a varied frame', () => {
  const blank = inspectPng(solidPng(8, 8, [244, 244, 241, 255]));
  const data = Buffer.alloc(8 * 8 * 4);
  for (let offset = 0; offset < data.length; offset += 4) {
    const value = offset % 16 === 0 ? 0 : 244;
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
    data[offset + 3] = 255;
  }
  const varied = inspectPng(encodePng({ width: 8, height: 8, data }));
  assert.equal(blank.colorBuckets, 1);
  assert.ok(varied.colorBuckets > blank.colorBuckets);
  assert.ok(varied.luminanceRange > 200);
});
