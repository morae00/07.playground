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

/** Each rule with the at-rules around it, outermost first. */
function rules(css: string) {
  const found: { at: string[]; selectors: string[]; body: string }[] = [];
  const open: string[] = [];
  let mark = 0;
  for (let index = 0; index < css.length; index += 1) {
    if (css[index] === '{') {
      open.push(css.slice(mark, index).trim());
      mark = index + 1;
    } else if (css[index] === '}') {
      const prelude = open.pop() ?? '';
      if (!prelude.startsWith('@')) found.push({ at: open.filter((outer) => outer.startsWith('@')), selectors: prelude.split(',').map((part) => part.trim()), body: css.slice(mark, index) });
      mark = index + 1;
    }
  }
  return found;
}

// A burst that is meant to vanish as it ends.
const DECORATIVE_FADES = ['.draftBurst'];

test('UI-12: under reduced motion, whether the system or the option asks, nothing that fades out as it ends is hidden at once', () => {
  const all = rules(readFileSync(new URL('../styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''));
  const fading = new Set(all
    .filter((rule) => rule.at[0]?.startsWith('@keyframes') && /^(100%|to)$/.test(rule.selectors.at(-1) ?? '') && /opacity:\s*0\s*(;|$)/.test(rule.body))
    .map((rule) => rule.at[0].split(/\s+/)[1]));
  // Elements that keep the last frame (fill both or forwards) of such an animation.
  const kept = all.filter((rule) => rule.at.length === 0).flatMap((rule) => {
    const animation = /(?:^|;)\s*animation:\s*([^;]+)/.exec(rule.body)?.[1] ?? '';
    return fading.has(animation.split(/\s+/)[0]) && /\b(both|forwards)\b/.test(animation) ? rule.selectors : [];
  }).filter((selector) => !DECORATIVE_FADES.includes(selector));
  assert.deepEqual(kept.sort(), ['.bossIntro', '.bossNarration']);
  const still = (rule: { body: string }) => /animation:\s*none/.test(rule.body) && /opacity:\s*1\s*(;|$)/.test(rule.body);
  for (const selector of kept) {
    assert.ok(all.some((rule) => rule.at.some((at) => /prefers-reduced-motion:\s*reduce/.test(at)) && rule.selectors.includes(selector) && still(rule)), `${selector} under the system setting`);
    assert.ok(all.some((rule) => rule.at.length === 0 && rule.selectors.includes(`.appShell[data-reduced-motion="on"] ${selector}`) && still(rule)), `${selector} under the option`);
  }
});
