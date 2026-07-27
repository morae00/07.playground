import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BOSS_ART,
  ENEMY_ART,
  ENEMY_VISUAL_ROLES,
  HAZARD_ART,
  HOSTILE_PROJECTILE_ART,
  SKILL_PROJECTILE_ART,
  enemyArtFor,
  enemyRoleFor,
} from './visualRegistry.ts';
import { ILLUSTRATION_SLOTS, visualRegistryIssues } from './illustrationManifest.ts';

test('visual registry owns twenty chapter-role enemies and fifteen unique bosses', () => {
  assert.equal(Object.keys(ENEMY_ART).length, 20);
  assert.equal(Object.keys(BOSS_ART).length, 15);
  assert.equal(new Set(Object.values(BOSS_ART).map((profile) => profile.body)).size, 15);
  assert.deepEqual(visualRegistryIssues(), []);
});

test('enemy role selection is stable and gameplay-semantic', () => {
  assert.equal(enemyRoleFor('small', 'contact'), 'stalker');
  assert.equal(enemyRoleFor('medium', 'contact'), 'charger');
  assert.equal(enemyRoleFor('large', 'contact'), 'warden');
  assert.equal(enemyRoleFor('large', 'ranged'), 'shooter');
  assert.equal(enemyArtFor(99, 'small', 'contact').chapter, 5);
  assert.equal(enemyArtFor(-4, 'medium', 'contact').chapter, 1);
  assert.deepEqual(new Set(Object.values(ENEMY_ART).map((profile) => profile.role)), new Set(ENEMY_VISUAL_ROLES));
});

test('every combat visual exposes a future illustration slot without collisions', () => {
  assert.equal(Object.keys(SKILL_PROJECTILE_ART).length, 17);
  assert.equal(Object.keys(HOSTILE_PROJECTILE_ART).length, 5);
  assert.equal(Object.keys(HAZARD_ART).length, 9);
  const slots = ILLUSTRATION_SLOTS.map((slot) => slot.key);
  assert.equal(new Set(slots).size, slots.length);
  assert.ok(slots.includes('game/player/hunter'));
  assert.ok(slots.includes('game/boss/s5-final-null'));
  assert.ok(slots.includes('game/chapter-05/environment'));
});
