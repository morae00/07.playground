import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ATTACK_SECONDS,
  AnimationBook,
  BOSS_INTRO_SECONDS,
  ENRAGE_POSE_SECONDS,
  PHASE_POSE_SECONDS,
  SPAWN_SECONDS,
  enemyPoses,
  heroPoses,
  poseFrame,
  stepBossAnim,
  stepEnemyAnim,
  stepPlayerAnim,
  type AnimState,
  type EnemyAnimInput,
} from './animation.ts';

const fresh = (now = 0): AnimState => ({ state: '', startedAt: now, bornAt: now, facing: 1, heading: 0, phase: 0, enraged: false, seen: 0 });
const still: EnemyAnimInput = { vx: 0, vy: 0, stun: 0, hitFlash: 0, attackStyle: 'contact', rangedTelegraph: 0 };

test('loops cycle on simulation time with a per-id phase; one-shot poses play once and hold', () => {
  const walk = { frames: 4, fps: 8 };
  assert.deepEqual([0, 0.125, 0.25, 0.5].map((now) => poseFrame(walk, 'walk', 0, now, 0)), [0, 1, 2, 0]);
  assert.equal(poseFrame(walk, 'walk', 0, 0, 0.5), 2, 'a half phase starts two frames in');
  const hurt = { frames: 3, fps: 12 };
  assert.deepEqual([1, 1.09, 1.17, 1.5, 9].map((now) => poseFrame(hurt, 'hurt', 1, now, 0.7)), [0, 1, 2, 2, 2]);
  assert.equal(poseFrame({ frames: 1, fps: 1 }, 'windup', 0, 5, 0.3), 0);
  assert.deepEqual([0, 0.125, 0.25, 0.5].map((now) => poseFrame(walk, 'walk', 0, now, 0, 'reduced')), [0, 0, 1, 2], 'reduced detail plays at half rate');
  assert.equal(poseFrame(walk, 'walk', 0, 0.3, 0.5, 'minimal'), 0, 'minimal detail holds a still frame');
});

test('a new enemy rises, then walks or stands; windups, dashes, shots, stuns, and hits each take the pose', () => {
  const entry = fresh(10);
  assert.equal(stepEnemyAnim(entry, still, 10), 'spawn');
  assert.equal(stepEnemyAnim(entry, still, 10 + SPAWN_SECONDS + 1e-6), 'idle');
  assert.equal(stepEnemyAnim(entry, { ...still, vx: 40 }, 11), 'move');
  assert.equal(stepEnemyAnim(entry, { ...still, attackStyle: 'ranged', rangedTelegraph: 0.3 }, 12), 'windup');
  assert.equal(stepEnemyAnim(entry, { ...still, attackStyle: 'ranged' }, 12.4), 'attack', 'the shot just left');
  assert.equal(entry.startedAt, 12.4);
  assert.equal(stepEnemyAnim(entry, { ...still, attackStyle: 'ranged' }, 12.4 + ATTACK_SECONDS - 0.01), 'attack');
  assert.equal(stepEnemyAnim(entry, { ...still, attackStyle: 'ranged' }, 12.4 + ATTACK_SECONDS + 1e-6), 'idle');
  assert.equal(stepEnemyAnim(entry, { ...still, patternPhase: 'dash', vx: 300 }, 13), 'attack', 'a charger dash');
  assert.equal(stepEnemyAnim(entry, { ...still, hitFlash: 0.08, patternPhase: 'warn' }, 14), 'windup', 'a windup holds through hits (V3)');
  assert.equal(stepEnemyAnim(entry, { ...still, hitFlash: 0.08 }, 14.8), 'hurt');
  assert.equal(stepEnemyAnim(entry, { ...still, stun: 0.8, hitFlash: 0.08 }, 15), 'stunned');
});

test('a boss makes an entrance, marks phase changes and enrage, and always shows its windups and dashes', () => {
  const entry = fresh(0);
  const boss = { ...still, bossPhase: 1 };
  assert.equal(stepBossAnim(entry, boss, 0, false), 'intro');
  assert.equal(stepBossAnim(entry, { ...boss, armedPattern: {} }, 0.5, false), 'windup', 'a threat outranks the entrance');
  assert.equal(stepBossAnim(entry, boss, BOSS_INTRO_SECONDS + 1e-6, false), 'idle');
  assert.equal(stepBossAnim(entry, { ...boss, bossPhase: 2 }, 5, false), 'phase');
  assert.equal(stepBossAnim(entry, { ...boss, bossPhase: 2 }, 5 + PHASE_POSE_SECONDS - 0.01, false), 'phase');
  assert.equal(stepBossAnim(entry, { ...boss, bossPhase: 2, armedPattern: {} }, 5 + PHASE_POSE_SECONDS - 0.005, false), 'windup', 'and the phase pose');
  assert.equal(stepBossAnim(entry, { ...boss, bossPhase: 2, patternPhase: 'dash', vx: 400 }, 5.6, false), 'attack');
  assert.equal(stepBossAnim(entry, { ...boss, bossPhase: 2 }, 8, true), 'enrage');
  assert.equal(stepBossAnim(entry, { ...boss, bossPhase: 2, vx: 60 }, 8 + ENRAGE_POSE_SECONDS + 1e-6, true), 'move');
  const enragedAtSight = fresh(3);
  assert.equal(stepBossAnim(enragedAtSight, boss, 3, true), 'intro', 'a boss seen already enraged does not replay it');
});

test('the hero state follows death, hurt, burst, cast, root, movement, and silence in that order', () => {
  const entry = fresh();
  const poses = { playerHurt: 0, playerBurst: 0, playerCast: 0 };
  const body = { hp: 100, root: 0, silence: 0 };
  assert.equal(stepPlayerAnim(entry, body, poses, false, 0), 'idle');
  assert.equal(stepPlayerAnim(entry, { ...body, silence: 2 }, poses, false, 0), 'silenced');
  assert.equal(stepPlayerAnim(entry, { ...body, silence: 2 }, poses, true, 0), 'run', 'silence does not stop the legs');
  assert.equal(stepPlayerAnim(entry, { ...body, root: 1 }, poses, true, 0), 'rooted');
  assert.equal(stepPlayerAnim(entry, body, { ...poses, playerCast: 0.2 }, true, 0), 'cast');
  assert.equal(stepPlayerAnim(entry, body, { ...poses, playerCast: 0.2, playerBurst: 0.3 }, true, 0), 'skillBurst');
  assert.equal(stepPlayerAnim(entry, body, { ...poses, playerBurst: 0.3, playerHurt: 0.2 }, true, 0), 'hurt');
  assert.equal(stepPlayerAnim(entry, { ...body, hp: 0 }, { ...poses, playerHurt: 0.2 }, false, 0), 'death');
});

test('states without their own art borrow the nearest baked pose', () => {
  assert.deepEqual(heroPoses('skillBurst'), ['skillBurst', 'throw']);
  assert.deepEqual(heroPoses('rooted'), ['rooted', 'idle']);
  assert.deepEqual(enemyPoses('spawn', false), ['spawn', 'idle']);
  assert.deepEqual(enemyPoses('spawn', true), ['spawn', 'walk']);
  assert.deepEqual(enemyPoses('attack', false), ['attack', 'windup']);
  assert.deepEqual(enemyPoses('stunned', false), ['stunned', 'hit']);
});

test('the book forgets characters not drawn in a frame and starts over when the clock runs backwards', () => {
  const book = new AnimationBook();
  book.beginFrame(1);
  const first = book.touch(7, 1, -1, 2);
  book.touch(8, 1, 1, 0);
  book.endFrame();
  book.beginFrame(1.5);
  assert.equal(book.touch(7, 1.5, 1, 0), first, 'the same state carries over');
  assert.equal(first.facing, -1, 'facing and heading are only seeded on first sight');
  book.endFrame();
  assert.equal(book.size, 1, 'id 8 was not drawn');
  book.beginFrame(0.2);
  assert.equal(book.size, 0, 'a new run');
});
