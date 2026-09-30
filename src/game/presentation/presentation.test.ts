import assert from 'node:assert/strict';
import test from 'node:test';
import type { CueId, SoundOutput } from '../audioPolicy.ts';
import { createDefaultOptions } from '../../platform/save.ts';
import { CORPSE_SECONDS, DEATH_MOMENT_SECONDS, HEARTBEAT_SECONDS, HURT_VIGNETTE_SECONDS, Presentation } from './presentation.ts';

function setup(overrides: Partial<ReturnType<typeof createDefaultOptions>> = {}) {
  let id = 0;
  const options = { ...createDefaultOptions(), volume: 0, ...overrides };
  // A 1000-unit-wide screen centred on x = 500.
  const presentation = new Presentation({ nextId: () => (id += 1), options: () => options, pan: (x) => Math.max(-1, Math.min(1, (x - 500) / 500)) });
  presentation.reseed(1234);
  return { presentation, ids: () => id };
}

function recorder() {
  const played: { cue: CueId; pan: number }[] = [];
  let unlocks = 0;
  const sound: SoundOutput = {
    unlock: () => { unlocks += 1; },
    play: (cue, pan = 0) => { played.push({ cue, pan }); },
  };
  return { sound, played, unlocks: () => unlocks };
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
  quiet.presentation.handle({ type: 'enemy/hit', x: 10, y: 20, radius: 12, damage: 30, crit: true, tier: 'critical', dx: 1, dy: 0 });
  assert.equal(quiet.presentation.damageNumbers.length, 0);
  assert.equal(quiet.presentation.impactRings.length, 1);
  assert.equal(quiet.presentation.shake, 4);
  const shown = setup({ damageNumbers: true, effects: 1 });
  shown.presentation.handle({ type: 'enemy/hit', x: 10, y: 20, radius: 12, damage: 30, crit: false, tier: 'light', dx: 1, dy: 0 });
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

test('events play their cues on the mixer, panned by screen position', () => {
  const { presentation } = setup();
  const { sound, played, unlocks } = recorder();
  presentation.setSound(sound);
  presentation.unlockSound();
  presentation.handle({ type: 'enemy/hit', x: 750, y: 0, radius: 12, damage: 30, crit: true, tier: 'critical', dx: 1, dy: 0 });
  presentation.handle({ type: 'enemy/killed', x: 0, y: 0, isBoss: false, radius: 14, tier: 'small', attackStyle: 'contact', dx: 1, dy: 0 });
  presentation.handle({ type: 'enemy/killed', x: 500, y: 0, isBoss: true, radius: 14, tier: 'boss', attackStyle: 'contact', dx: 1, dy: 0 });
  presentation.handle({ type: 'skill/cast', skillId: 'railSpear', x: 500, y: 0 });
  presentation.handle({ type: 'skill/cast', skillId: 'eclipseStep', x: 500, y: 0 });
  presentation.handle({ type: 'draft/applied', kind: 'coins', x: 500, y: 0 });
  presentation.handle({ type: 'run/upgradeBought' });
  assert.equal(unlocks(), 1);
  assert.deepEqual(played, [
    { cue: 'hit.critical', pan: 0.5 },
    { cue: 'enemy.kill', pan: -1 },
    { cue: 'boss.kill', pan: 0 },
    { cue: 'cast.railSpear', pan: 0 },
    { cue: 'draft.coins', pan: 0 },
    { cue: 'run.upgrade', pan: 0 },
  ]);
  presentation.dispose();
  presentation.handle({ type: 'enemy/killed', x: 0, y: 0, isBoss: false, radius: 14, tier: 'small', attackStyle: 'contact', dx: 1, dy: 0 });
  presentation.unlockSound();
  assert.equal(played.length, 6, 'a disposed presentation sends nothing');
  assert.equal(unlocks(), 1);
});

test('classic rules keep 0.1.0 drawing a hit pitch from the cosmetic stream, once per hit spacing', () => {
  const hit = { type: 'enemy/hit', x: 0, y: 0, radius: 12, damage: 5, crit: false, tier: 'heavy', dx: 1, dy: 0 } as const;
  const classic = setup({ effects: 1 }).presentation;
  classic.reseed(1234, true);
  // Heavy hits are 44 ms apart: the first and fourth hits draw; the others fall inside the spacing.
  classic.handle(hit);
  classic.handle(hit);
  classic.beginFrame(0.02, false);
  classic.handle(hit);
  classic.beginFrame(0.03, false);
  classic.handle(hit);
  classic.handle(hit);
  const remaster = setup({ effects: 1 }).presentation;
  remaster.handle(hit);
  remaster.random();
  remaster.handle(hit);
  remaster.handle(hit);
  remaster.handle(hit);
  remaster.random();
  remaster.handle(hit);
  assert.deepEqual(classic.particles.map((particle) => [particle.vx, particle.life]), remaster.particles.map((particle) => [particle.vx, particle.life]));
});

test('hit ink sprays out of the far side of the hit', () => {
  const { presentation } = setup({ effects: 1 });
  presentation.handle({ type: 'enemy/hit', x: 0, y: 0, radius: 12, damage: 30, crit: true, tier: 'critical', dx: 0, dy: -1 });
  assert.equal(presentation.particles.length, 14);
  assert.ok(presentation.particles.every((particle) => particle.vy < 0), 'every drop flies up, the way the hit travelled');
});

test('a kill leaves a corpse that falls away from the player and fades; the oldest stain goes at the cap', () => {
  const { presentation } = setup({ effects: 1 });
  const kill = (x: number, dx: number) => presentation.handle({ type: 'enemy/killed', x, y: 0, isBoss: false, radius: 14, tier: 'medium', attackStyle: 'ranged', dx, dy: 0 });
  kill(10, -1);
  assert.deepEqual([presentation.corpses[0].fall, presentation.corpses[0].tier, presentation.corpses[0].attackStyle], [-1, 'medium', 'ranged']);
  presentation.step(CORPSE_SECONDS - 0.01);
  assert.equal(presentation.corpses.length, 1);
  presentation.step(0.02);
  assert.equal(presentation.corpses.length, 0, 'gone once its stain has dried');
  for (let index = 0; index < 60; index += 1) kill(index, 1);
  assert.equal(presentation.corpses.length, 48);
  assert.equal(presentation.corpses[0].x, 12, 'the oldest stains went first');
  presentation.clearRound();
  assert.equal(presentation.corpses.length, 0);
  const reduced = setup({ effects: 0.4 }).presentation;
  for (let index = 0; index < 30; index += 1) reduced.handle({ type: 'enemy/killed', x: index, y: 0, isBoss: false, radius: 14, tier: 'small', attackStyle: 'contact', dx: 1, dy: 0 });
  assert.equal(reduced.corpses.length, 24);
});

test('a hit on the player sets a coral vignette toward its source that fades in simulated time', () => {
  const { presentation } = setup();
  presentation.handle({ type: 'player/hurt', x: 100, y: 100, damage: 9, source: 'contact', fromX: 100, fromY: 40 });
  assert.equal(presentation.hurtVignette, HURT_VIGNETTE_SECONDS);
  assert.ok(Math.abs(presentation.hurtAngle + Math.PI / 2) < 1e-9, 'the hit came from above');
  presentation.step(0.2);
  assert.ok(Math.abs(presentation.hurtVignette - (HURT_VIGNETTE_SECONDS - 0.2)) < 1e-9);
  presentation.step(0.2);
  assert.equal(presentation.hurtVignette, 0);
});

test('low health beats a heartbeat until health recovers', () => {
  const { presentation } = setup();
  const { sound, played } = recorder();
  presentation.setSound(sound);
  const beats = () => played.filter(({ cue }) => cue === 'player.heartbeat').length;
  presentation.step(1);
  assert.equal(beats(), 0);
  presentation.handle({ type: 'player/lowHealth', low: true });
  presentation.step(1 / 60);
  assert.equal(beats(), 1, 'the first beat comes at once');
  presentation.step(HEARTBEAT_SECONDS);
  assert.equal(beats(), 2);
  presentation.handle({ type: 'player/lowHealth', low: false });
  presentation.step(HEARTBEAT_SECONDS * 3);
  assert.equal(beats(), 2);
  assert.equal(presentation.lowHealth, false);
});

test('the death moment plays the fall, and ink drifts in slow motion while the ended run is paused', () => {
  const { presentation } = setup({ effects: 1 });
  const { sound, played } = recorder();
  presentation.setSound(sound);
  presentation.handle({ type: 'player/lowHealth', low: true });
  presentation.burst(0, 0, 1, '#000000', 100);
  const [drop] = presentation.particles;
  presentation.handle({ type: 'player/died', source: 'contact', bossEnraged: false });
  assert.equal(presentation.deathMoment, DEATH_MOMENT_SECONDS);
  assert.equal(presentation.lowHealth, false, 'the heartbeat stops');
  assert.ok(played.some(({ cue }) => cue === 'player.down'));
  const x = drop.x;
  presentation.beginFrame(0.1, true);
  presentation.endFrame(0.1, true, false);
  assert.ok(Math.abs(drop.x - (x + drop.vx / 0.96 * 0.025)) < 1e-6, 'a quarter of the frame time');
  presentation.beginFrame(0.5, true);
  const still = drop.x;
  presentation.endFrame(0.1, true, false);
  assert.equal(drop.x, still, 'after the moment the paused frame holds still');
});

test('sound never draws from the cosmetic stream that places particles', () => {
  const hits = (withSound: boolean) => {
    const { presentation } = setup({ effects: 1 });
    if (withSound) presentation.setSound(recorder().sound);
    for (let index = 0; index < 12; index += 1) presentation.handle({ type: 'enemy/hit', x: index * 40, y: 0, radius: 12, damage: 5, crit: false, tier: 'heavy', dx: 1, dy: 0 });
    return presentation.particles.map((particle) => [particle.vx, particle.vy]);
  };
  assert.deepEqual(hits(true), hits(false));
});
