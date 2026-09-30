import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Accessibility baseline built into the tokens (UI-01, with the UI-08 values): no text under 13 px. Only decorative
// glyphs that carry no reading text (aria-hidden marks drawn by CSS) may be smaller.
const DECORATIVE = ['.killMark::before'];

test('no stylesheet rule sets text under 13 px', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const small = [];
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const [, size] of body.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) {
      if (Number(size) < 13 && !DECORATIVE.some((allowed) => selector.includes(allowed))) small.push(`${selector.trim()}: ${size}px`);
    }
  }
  assert.deepEqual(small, []);
});
