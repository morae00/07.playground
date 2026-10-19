import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ATLAS_MANIFEST } from './assets/atlasManifest.generated.ts';
import { hazardTokenColor } from './hazardArt.ts';
import { tokenColor, type Token } from './skillVfx.ts';
import { NEUTRAL, SIGNAL, signalFamily } from './palette.ts';
import { BOSS_ART, CHAPTER_ART, HAZARD_ART, HOSTILE_PROJECTILE_ART, VISUAL_PALETTE } from './visualRegistry.ts';

// Signal-colour ownership (BUG-14, style bible P2): each signal hue belongs to one side of the fight.

const colorsOf = (profile: Record<string, unknown>) => Object.values(profile).filter((value): value is string => typeof value === 'string' && value.startsWith('#'));

test('signal families classify the palette and treat low-saturation materials as neutral', () => {
  assert.equal(signalFamily(SIGNAL.ally), 'ally');
  assert.equal(signalFamily(SIGNAL.hostile), 'hostile');
  assert.equal(signalFamily(SIGNAL.warn), 'warn');
  assert.equal(signalFamily(SIGNAL.reward), 'reward');
  assert.equal(signalFamily(SIGNAL.elite), 'elite');
  for (const value of Object.values(NEUTRAL)) assert.equal(signalFamily(value), null, `${value} must stay neutral`);
});

test('enemy damage shots use only hostile or neutral colours', () => {
  for (const [kind, profile] of Object.entries(HOSTILE_PROJECTILE_ART)) {
    for (const color of colorsOf(profile)) {
      const family = signalFamily(color);
      assert.ok(family === null || family === 'hostile', `${kind} shot uses ${color} (${family})`);
    }
  }
});

test('chapter materials and bosses never wear a signal colour', () => {
  for (const [chapter, art] of Object.entries(CHAPTER_ART)) {
    for (const color of colorsOf(art)) assert.equal(signalFamily(color), null, `chapter ${chapter} material ${color}`);
  }
  for (const [key, art] of Object.entries(BOSS_ART)) {
    for (const color of colorsOf(art)) assert.equal(signalFamily(color), null, `${key} ${color}`);
  }
});

test('hazards are coloured by owner: player skills cyan, enemy damage coral, enemy control amber', () => {
  const allowed: Record<string, Array<string | null>> = {
    warning: ['ally', null],
    vortex: ['ally', null],
    fire: ['hostile', null],
    shock: ['warn', 'hostile', null],
    slow: ['warn', null],
    root: ['warn', null],
    null: ['warn', 'elite', null],
    trap: [null],
    water: [null],
  };
  for (const [kind, profile] of Object.entries(HAZARD_ART)) {
    for (const color of colorsOf(profile)) {
      assert.ok(allowed[kind].includes(signalFamily(color)), `${kind} hazard uses ${color} (${signalFamily(color)})`);
    }
  }
  // K11 (style bible §5.1): a null zone is erased paper, the void paper token, in the vector fallback too.
  assert.equal(HAZARD_ART.null.fill, NEUTRAL.voidPaper);
});

test('K11: the kit SPEC of each hazard kind keeps its owner\'s colours (brief §9-6), every token a palette colour', () => {
  const spec = (ATLAS_MANIFEST.hazards.spec as unknown) as Record<string, Record<string, unknown>>;
  // fire coral; the shock telegraph amber and its burst coral; control zones amber; null amber (its coral ring is off,
  // Q3); water and traps neutral.
  const allowed: Record<string, Array<string | null>> = {
    fire: ['hostile', null],
    shock: ['warn', 'hostile', null],
    slow: ['warn', null],
    root: ['warn', null],
    null: spec.null.active && (spec.null.active as { on: boolean }).on ? ['warn', 'hostile', null] : ['warn', null],
    water: [null],
    trap: [null],
  };
  for (const [kind, families] of Object.entries(allowed)) {
    const tokens = new Set<string>();
    JSON.stringify({ ...spec[kind], ...(kind === 'fire' ? { hero: spec.hero } : {}), ...(kind === 'null' && !families.includes('hostile') ? { active: null } : {}) }, (key, value) => {
      if (Array.isArray(value) && typeof value[0] === 'string' && typeof value[1] === 'number') tokens.add(value[0]);
      if (key === 'token' && typeof value === 'string') tokens.add(value);
      return value;
    });
    assert.ok(tokens.size > 0, `${kind} has SPEC colours`);
    for (const token of tokens) {
      const color = hazardTokenColor(token);
      assert.ok(color, `${kind} token ${token} maps to the palette`);
      assert.ok(families.includes(signalFamily(color)), `${kind} ${token} reads as ${signalFamily(color)}`);
    }
  }
});

test('K10: the weapons\' field effects are the player\'s (brief §1.7): every SPEC token ally cyan or neutral, and a palette colour', () => {
  const tokens = new Set<string>();
  JSON.stringify(ATLAS_MANIFEST.arsenalFx.spec, (key, value) => {
    if (Array.isArray(value) && typeof value[0] === 'string' && typeof value[1] === 'number') tokens.add(value[0]);
    if (['token', 'body', 'fill'].includes(key) && typeof value === 'string') tokens.add(value);
    return value;
  });
  for (const name of ['ink', 'ink300', 'p50', 'p300', 'ally', 'allyG']) assert.ok(tokens.has(name), `the SPEC draws with ${name}`);
  for (const token of tokens) {
    if (/^(fills|lob)\./.test(token) || token.includes('.')) continue;
    const color = tokenColor(token as Token);
    assert.ok(color, `${token} maps to the palette`);
    assert.ok([null, 'ally'].includes(signalFamily(color)), `${token} reads as ${signalFamily(color)}`);
  }
});

test('K10 3a: the awakening gimmicks\' shapes are the player\'s too: every token of SPEC zone, gimmick, and rim ally cyan or neutral (no coral or amber burn, no violet silence)', () => {
  const spec = ATLAS_MANIFEST.arsenalFx.spec as unknown as Record<string, unknown>;
  const tokens = new Set<string>();
  JSON.stringify([spec.zone, spec.gimmick, spec.rim], (key, value) => {
    if (Array.isArray(value) && typeof value[0] === 'string' && typeof value[1] === 'number') tokens.add(value[0]);
    if (key === 'token' && typeof value === 'string') tokens.add(value);
    return value;
  });
  for (const name of ['ink', 'ink300', 'ink700', 'p50', 'p300', 'ally', 'allyG']) assert.ok(tokens.has(name), `the gimmicks draw with ${name}`);
  for (const token of tokens) {
    const color = tokenColor(token as Token);
    assert.ok(color, `${token} maps to the palette`);
    assert.ok([null, 'ally'].includes(signalFamily(color)), `${token} reads as ${signalFamily(color)}`);
  }
});

test('renderer and engine sources draw signal colours only through palette tokens', () => {
  for (const file of ['../GameEngine.ts', './GameRenderer.ts', './skillVfx.ts', './hazardArt.ts', './arsenalFx.ts']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    for (const [literal] of source.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
      assert.equal(signalFamily(literal), null, `${file} hardcodes signal colour ${literal}; use SIGNAL tokens`);
    }
    assert.doesNotMatch(source, /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+/, `${file} hardcodes an rgba colour; use rgba(token, alpha)`);
  }
  assert.equal(VISUAL_PALETTE.player, SIGNAL.ally);
  assert.equal(VISUAL_PALETTE.danger, SIGNAL.hostile);
});

test('CSS signal tokens match the canvas palette', () => {
  const css = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');
  const token = (name: string) => new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1]?.toLowerCase();
  assert.equal(token('ally'), SIGNAL.ally);
  assert.equal(token('player-keyline'), SIGNAL.allyDeep);
  assert.equal(token('alert'), SIGNAL.hostile);
  assert.equal(token('alert-deep'), SIGNAL.hostileDeep);
  assert.equal(token('reward'), SIGNAL.reward);
});
