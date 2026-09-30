import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultOptions } from '../../platform/save.ts';
import { Presentation } from './presentation.ts';

function setup(overrides: Partial<ReturnType<typeof createDefaultOptions>> = {}) {
  let id = 0;
  const options = { ...createDefaultOptions(), volume: 0, ...overrides };
  const presentation = new Presentation({ nextId: () => (id += 1), options: () => options });
  presentation.reseed(1234);
  return { presentation, ids: () => id };
}

test('bursts respect the particle cap for the effect density and draw ids from the host', () => {
  const full = setup({ effects: 0.9 });
  for (let burst = 0; burst < 20; burst += 1) full.presentation.burst(0, 0, 90, '#000000', 100);
  assert.equal(full.presentation.particles.length, 520);
  assert.equal(full.ids(), 520, 'one host id per particle actually created');
  const reduced = setup({ effects: 0.3 });
  for (let burst = 0; burst < 20; burst += 1) reduced.presentation.burst(0, 0, 90, '#000000', 100);
  assert.equal(reduced.presentation.particles.length, 260);
});

test('damage numbers stop at 160, and crits replace a plain number once full', () => {
  const { presentation } = setup();
  for (let index = 0; index < 200; index += 1) presentation.addDamageNumber(0, 0, index, false, 1, 'player');
  assert.equal(presentation.damageNumbers.length, 160);
  presentation.addDamageNumber(0, 0, 999, true, 1, 'player');
  assert.equal(presentation.damageNumbers.length, 160);
  assert.ok(presentation.damageNumbers.some((number) => number.crit && number.value === 999));
});

test('hit rings are capped at 32 but boss telegraph rings are never dropped', () => {
  const { presentation } = setup();
  for (let index = 0; index < 40; index += 1) presentation.addImpactRing(index, 0, 10, 'heavy');
  assert.equal(presentation.impactRings.length, 32);
  assert.equal(presentation.impactRings[0].x, 8, 'the oldest rings go first');
  presentation.handle({ type: 'telegraph/ring', x: 0, y: 0, radius: 90, life: 0.8 });
  assert.equal(presentation.impactRings.length, 33);
  assert.equal(presentation.impactRings.at(-1)?.owner, 'hostile');
});

test('events map to their effects: enemy hits respect the damage-number option and tiers', () => {
  const quiet = setup({ damageNumbers: false });
  quiet.presentation.handle({ type: 'enemy/hit', x: 10, y: 20, radius: 12, damage: 30, crit: true, tier: 'critical' });
  assert.equal(quiet.presentation.damageNumbers.length, 0);
  assert.equal(quiet.presentation.impactRings.length, 1);
  assert.equal(quiet.presentation.shake, 4);
  const shown = setup({ damageNumbers: true, effects: 1 });
  shown.presentation.handle({ type: 'enemy/hit', x: 10, y: 20, radius: 12, damage: 30, crit: false, tier: 'light' });
  assert.equal(shown.presentation.damageNumbers[0].y, 8, 'numbers float above the enemy');
  assert.equal(shown.presentation.particles.length, 4);
  assert.equal(shown.presentation.impactRings.length, 0, 'light hits leave no ring');
  shown.presentation.handle({ type: 'boss/enraged', x: 0, y: 0 });
  assert.equal(shown.presentation.shake, 22);
});

test('frames: shake decays in wall time, and a paused frame holds still unless classic decay is asked for', () => {
  const { presentation } = setup();
  presentation.burst(0, 0, 10, '#000000', 100);
  presentation.addShake(12);
  presentation.beginFrame(0.5, false);
  assert.equal(presentation.shake, 6);
  presentation.endFrame(0.5, true, false);
  assert.equal(presentation.shake, 0, 'a paused frame never shakes');
  const before = presentation.particles.map((particle) => [particle.x, particle.y, particle.life]);
  presentation.endFrame(1 / 60, true, false);
  assert.deepEqual(presentation.particles.map((particle) => [particle.x, particle.y, particle.life]), before);
  presentation.endFrame(1 / 60, true, true);
  assert.notDeepEqual(presentation.particles.map((particle) => [particle.x, particle.y, particle.life]), before, 'classic rules decay while paused');
});

test('rings and damage numbers age per simulation step and are recycled when done', () => {
  const { presentation } = setup();
  presentation.addImpactRing(0, 0, 10, 'critical');
  presentation.addDamageNumber(0, 100, 5, false, 0.5, 'hostile');
  presentation.step(0.2);
  assert.equal(presentation.impactRings.length, 1);
  assert.ok(Math.abs(presentation.damageNumbers[0].y - (100 - 0.2 * 38)) < 1e-9);
  presentation.step(0.4);
  assert.equal(presentation.impactRings.length, 0);
  assert.equal(presentation.damageNumbers.length, 0);
  assert.equal(presentation.damageNumberPool.retained, 1);
});

test('silent volume never opens an audio context', () => {
  const opened: unknown[] = [];
  const saved = (globalThis as { AudioContext?: unknown }).AudioContext;
  (globalThis as { AudioContext?: unknown }).AudioContext = class { constructor() { opened.push(this); } };
  try {
    const { presentation } = setup({ volume: 0 });
    presentation.handle({ type: 'enemy/killed', x: 0, y: 0, isBoss: true });
    presentation.handle({ type: 'run/upgradeBought' });
    assert.equal(opened.length, 0);
    presentation.dispose();
  } finally {
    (globalThis as { AudioContext?: unknown }).AudioContext = saved;
  }
});
