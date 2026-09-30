import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DRAFT_SIZE,
  ENEMY_RADIUS,
  FIELD_BOSS_MARKS,
  HIT_RADIUS,
  LEGACY_BOSS_MARK,
  LEGACY_BOSS_MIN_CHAPTER,
  MAX_SKILL_LEVEL,
  RANGED_ENEMY,
  RARITY_WEIGHTS,
  STAGE_STRUCTURE,
  TIER_ROLL,
} from './grammar.ts';
import { FIXED_TIMESTEP, MAX_FIXED_STEPS, MAX_FRAME_DELTA } from './p0Core.ts';
import { ENGINE_ACTIONS } from './engine/contracts.ts';
import { CLASSIC_RULES, REMASTER_RULES, RULES_VERSION } from './rules.ts';

// Each assertion names the preserved-grammar rule it protects (artifacts/remaster/backlog-roadmap.json → preserve).

test('G1: the simulation accepts movement as its only player action', () => {
  assert.deepEqual([...ENGINE_ACTIONS], ['moveUp', 'moveDown', 'moveLeft', 'moveRight']);
});

test('G3/G4: drafts offer 3 cards on level-up and 4 on boss rewards, skills cap at Lv5', () => {
  assert.deepEqual({ ...DRAFT_SIZE }, { level: 3, boss: 4 });
  assert.equal(MAX_SKILL_LEVEL, 5);
  assert.deepEqual({ ...RARITY_WEIGHTS }, { common: 52, rare: 25, epic: 14, legendary: 7, mythic: 2 });
});

test('G7/G8: five chapters of ten stages with Stage 5 and Stage 10 bosses and fixed field-boss marks', () => {
  assert.deepEqual({ ...STAGE_STRUCTURE }, { chapters: 5, stagesPerChapter: 10, midBossStage: 5, finalBossStage: 10 });
  assert.deepEqual([...FIELD_BOSS_MARKS], [0.36, 0.72]);
  assert.equal(LEGACY_BOSS_MARK, 0.55);
  assert.equal(LEGACY_BOSS_MIN_CHAPTER, 3);
});

test('G9/V4: hit radii and tier mix are fixed regardless of sprite size', () => {
  assert.deepEqual({ ...HIT_RADIUS }, { playerContact: 15, playerVsHostileShot: 13, pickupReach: 18, playerVsObstacle: 16 });
  assert.deepEqual({ ...ENEMY_RADIUS }, { small: 12, medium: 19, large: 28, fieldBoss: 38, boss: 54 });
  assert.deepEqual({ ...TIER_ROLL }, { small: 0.58, medium: 0.88 });
  assert.deepEqual({ ...RANGED_ENEMY }, { telegraphSeconds: 0.44, maxConcurrent: 3 });
});

test('G14: fixed 60 Hz step, at most 6 steps per frame, 50 ms frame clamp', () => {
  assert.equal(FIXED_TIMESTEP, 1 / 60);
  assert.equal(MAX_FIXED_STEPS, 6);
  assert.equal(MAX_FRAME_DELTA, 0.05);
});

test('rule versions: remaster rules are the default and classic rules keep every original behavior', () => {
  assert.equal(REMASTER_RULES.version, RULES_VERSION);
  assert.ok(RULES_VERSION > CLASSIC_RULES.version);
  for (const [flag, value] of Object.entries(CLASSIC_RULES)) {
    if (typeof value === 'boolean') assert.equal(value, false, `classic rules must disable ${flag}`);
  }
  // Experiments the team has not decided yet stay off in both rule sets; tools switch them on (SYS-06 terrain A/B).
  const experiments = new Set(['terrainOnEnemies']);
  for (const [flag, value] of Object.entries(REMASTER_RULES)) {
    if (typeof value === 'boolean') assert.equal(value, !experiments.has(flag), `remaster rules must ${experiments.has(flag) ? 'leave off' : 'enable'} ${flag}`);
  }
});
