import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BOSS_ART,
  HAZARD_ART,
  HOSTILE_PROJECTILE_ART,
  enemyRoleFor,
} from './visualRegistry.ts';
import { ILLUSTRATION_SLOTS, visualRegistryIssues } from './illustrationManifest.ts';

test('visual registry owns twenty chapter-role enemy slots and fifteen unique bosses', () => {
  assert.equal(ILLUSTRATION_SLOTS.filter((slot) => slot.category === 'enemy').length, 20);
  assert.equal(Object.keys(BOSS_ART).length, 15);
  assert.equal(new Set(Object.values(BOSS_ART).map((profile) => profile.body)).size, 15);
  assert.deepEqual(visualRegistryIssues(), []);
});

test('enemy role selection is stable and gameplay-semantic', () => {
  assert.equal(enemyRoleFor('small', 'contact'), 'stalker');
  assert.equal(enemyRoleFor('medium', 'contact'), 'charger');
  assert.equal(enemyRoleFor('large', 'contact'), 'warden');
  assert.equal(enemyRoleFor('large', 'ranged'), 'shooter');
});

test('every combat visual exposes a future illustration slot without collisions', () => {
  // The 17 skills of 0.1.0 and the arsenal's 44 weapons (SYS-15), each a future illustration.
  assert.equal(ILLUSTRATION_SLOTS.filter((slot) => slot.key.startsWith('game/projectile/skill-')).length, 17 + 44);
  assert.equal(Object.keys(HOSTILE_PROJECTILE_ART).length, 5);
  assert.equal(Object.keys(HAZARD_ART).length, 9);
  const slots = ILLUSTRATION_SLOTS.map((slot) => slot.key);
  assert.equal(new Set(slots).size, slots.length);
  assert.ok(slots.includes('game/player/hunter'));
  assert.ok(slots.includes('game/boss/s5-final-null'));
  assert.ok(slots.includes('game/chapter-05/environment'));
});
