import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { NEUTRAL, SIGNAL, signalFamily } from './palette.ts';
import { BOSS_ART, CHAPTER_ART, ENEMY_ART, HAZARD_ART, HOSTILE_PROJECTILE_ART, SKILL_PROJECTILE_ART, VISUAL_PALETTE } from './visualRegistry.ts';

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

test('player skill visuals use only ally or neutral colours', () => {
  for (const [skill, profile] of Object.entries(SKILL_PROJECTILE_ART)) {
    for (const color of colorsOf(profile)) {
      const family = signalFamily(color);
      assert.ok(family === null || family === 'ally', `${skill} uses ${color} (${family})`);
    }
  }
});

test('enemy damage shots use only hostile or neutral colours', () => {
  for (const [kind, profile] of Object.entries(HOSTILE_PROJECTILE_ART)) {
    for (const color of colorsOf(profile)) {
      const family = signalFamily(color);
      assert.ok(family === null || family === 'hostile', `${kind} shot uses ${color} (${family})`);
    }
  }
});

test('chapter materials, enemies, and bosses never wear a signal colour', () => {
  for (const [chapter, art] of Object.entries(CHAPTER_ART)) {
    for (const color of colorsOf(art)) assert.equal(signalFamily(color), null, `chapter ${chapter} material ${color}`);
  }
  for (const [key, art] of Object.entries(ENEMY_ART)) {
    for (const color of colorsOf(art)) assert.equal(signalFamily(color), null, `${key} ${color}`);
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
});

test('renderer and engine sources draw signal colours only through palette tokens', () => {
  for (const file of ['../GameEngine.ts', './GameRenderer.ts']) {
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
