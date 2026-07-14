import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PNG } = require('playwright-core/lib/utilsBundle');

export function decodePng(buffer) {
  const image = PNG.sync.read(buffer);
  return { width: image.width, height: image.height, data: image.data };
}

export function encodePng(image) {
  return PNG.sync.write(image);
}

export function inspectPng(buffer) {
  const image = decodePng(buffer);
  const sampleStride = Math.max(1, Math.ceil((image.width * image.height) / 50_000));
  const buckets = new Set();
  let opaque = 0;
  let sampled = 0;
  let minLuminance = 255;
  let maxLuminance = 0;
  let mean = 0;
  let squaredDelta = 0;

  for (let pixel = 0; pixel < image.width * image.height; pixel += sampleStride) {
    const offset = pixel * 4;
    const red = image.data[offset];
    const green = image.data[offset + 1];
    const blue = image.data[offset + 2];
    const alpha = image.data[offset + 3];
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    sampled += 1;
    if (alpha >= 250) opaque += 1;
    minLuminance = Math.min(minLuminance, luminance);
    maxLuminance = Math.max(maxLuminance, luminance);
    const delta = luminance - mean;
    mean += delta / sampled;
    squaredDelta += delta * (luminance - mean);
    buckets.add(`${red >> 5}:${green >> 5}:${blue >> 5}:${alpha >> 6}`);
  }

  return {
    width: image.width,
    height: image.height,
    samples: sampled,
    opaqueRatio: opaque / sampled,
    luminanceRange: maxLuminance - minLuminance,
    luminanceStdDev: Math.sqrt(squaredDelta / Math.max(1, sampled - 1)),
    colorBuckets: buckets.size,
  };
}

export function comparePngBuffers(actualBuffer, expectedBuffer, { pixelTolerance = 24 } = {}) {
  const actual = decodePng(actualBuffer);
  const expected = decodePng(expectedBuffer);
  const width = Math.max(actual.width, expected.width);
  const height = Math.max(actual.height, expected.height);
  const diff = new PNG({ width, height });
  let mismatchedPixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const targetOffset = (y * width + x) * 4;
      const actualInside = x < actual.width && y < actual.height;
      const expectedInside = x < expected.width && y < expected.height;
      let mismatch = !actualInside || !expectedInside;
      const actualOffset = actualInside ? (y * actual.width + x) * 4 : 0;
      const expectedOffset = expectedInside ? (y * expected.width + x) * 4 : 0;
      if (!mismatch) {
        for (let channel = 0; channel < 4; channel += 1) {
          if (Math.abs(actual.data[actualOffset + channel] - expected.data[expectedOffset + channel]) > pixelTolerance) {
            mismatch = true;
            break;
          }
        }
      }

      if (mismatch) {
        mismatchedPixels += 1;
        diff.data[targetOffset] = 224;
        diff.data[targetOffset + 1] = 32;
        diff.data[targetOffset + 2] = 48;
        diff.data[targetOffset + 3] = 255;
      } else {
        const luminance = Math.round(
          expected.data[expectedOffset] * 0.2126
          + expected.data[expectedOffset + 1] * 0.7152
          + expected.data[expectedOffset + 2] * 0.0722,
        );
        diff.data[targetOffset] = luminance;
        diff.data[targetOffset + 1] = luminance;
        diff.data[targetOffset + 2] = luminance;
        diff.data[targetOffset + 3] = 96;
      }
    }
  }

  return {
    width,
    height,
    sizeMismatch: actual.width !== expected.width || actual.height !== expected.height,
    mismatchedPixels,
    mismatchRatio: mismatchedPixels / (width * height),
    diff: encodePng(diff),
  };
}
