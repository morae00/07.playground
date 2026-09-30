import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, localeTable, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Boss phase moves (SYS-04): phases 2 and 3 run their attack grammar and movement mode instead of only speeding
// up. Ch1: the Ink Butcher's tracked dash pair and crossing dash triple, the Bell-tower Warden's alternating ring
// gap and contracting ring walls, anchor movement, real-time warnings, and the HUD move name.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, installStrings, t } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');
installStrings(localeTable('ko'));

const STEP = 1 / 60;
const meta = () => ({
  gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 5, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});

/** A Ch1 boss stage with only the main boss, pushed into the given phase. */
function bossInPhase(stage, phase, rules = 'remaster') {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.startRun(1, stage, 7373);
  const { probe } = engine;
  probe.haltSpawns();
  probe.setSkills({});
  probe.setGodMode();
  probe.setPlayer({ nextXp: 1e12 });
  const boss = probe.read().enemies.find((enemy) => enemy.isBoss);
  probe.removeEnemies(probe.read().enemies.filter((enemy) => !enemy.isBoss).map((enemy) => enemy.id));
  probe.clear('hazards', 'hostileShots', 'effects');
  const read = () => probe.read().enemies.find((enemy) => enemy.id === boss.id);
  for (let entered = 1; entered < phase; entered += 1) {
    const ratio = entered === 1 ? 0.6 : 0.3;
    probe.patchEnemy(boss.id, { hp: boss.maxHp * ratio });
    probe.step(1);
    probe.step(30);
  }
  assert.equal(read().bossPhase, phase, `the boss is in phase ${phase}`);
  probe.clear('hostileShots', 'effects');
  return { engine, probe, read };
}

/** Steps and records every change of the boss's pattern phase with the step it happened on. */
function recordPhases({ probe, read }, steps) {
  const changes = [];
  let last = read().patternPhase;
  for (let step = 1; step <= steps; step += 1) {
    probe.step(1);
    const boss = read();
    if (boss.patternPhase !== last) {
      changes.push({ step, phase: boss.patternPhase, vx: boss.vx, vy: boss.vy, x: boss.x, y: boss.y, player: probe.read().player });
      last = boss.patternPhase;
    }
  }
  return changes;
}

test('the Ink Butcher dashes twice per cycle in phase 2, re-aiming the second dash after a 0.62 s lane', () => {
  const arena = bossInPhase(5, 2);
  try {
    const changes = recordPhases(arena, 60 * 8);
    const sequence = changes.map((change) => change.phase).join(' ');
    assert.match(sequence, /warn dash warn dash idle/, sequence);
    const start = changes.findIndex((change, index) => change.phase === 'warn' && changes[index + 2]?.phase === 'warn');
    const [firstWarn, firstDash, secondWarn, secondDash] = changes.slice(start, start + 4);
    assert.ok((firstDash.step - firstWarn.step) * STEP >= 0.91, `first windup ${(firstDash.step - firstWarn.step) * STEP}`);
    assert.ok((secondDash.step - secondWarn.step) * STEP >= 0.61, `second windup ${(secondDash.step - secondWarn.step) * STEP}`);
    const aim = Math.atan2(secondDash.vy, secondDash.vx);
    const toPlayer = Math.atan2(secondWarn.player.y - secondWarn.y, secondWarn.player.x - secondWarn.x);
    assert.ok(Math.abs(Math.atan2(Math.sin(aim - toPlayer), Math.cos(aim - toPlayer))) < 0.05, 'the second dash is re-aimed at the player');
    assert.equal(t(arena.probe.hud().bossMoveName), '먹물 돌진');
  } finally {
    arena.engine.dispose();
  }
});

test('in phase 3 the Ink Butcher shows three crossing lanes at once, then runs them back to back', () => {
  const arena = bossInPhase(5, 3);
  try {
    let lanes = [];
    let steps = 0;
    while (arena.read().patternPhase !== 'warn' && steps < 60 * 6) {
      arena.probe.step(1);
      steps += 1;
    }
    lanes = arena.probe.read().laneTelegraphs;
    assert.ok(lanes.length >= 3, `three lanes on screen at the first windup (${lanes.length})`);
    const changes = recordPhases(arena, 60 * 5);
    const sequence = changes.map((change) => change.phase).join(' ');
    assert.match(sequence, /^dash warn dash warn dash idle/, sequence);
    const dashes = changes.filter((change) => change.phase === 'dash');
    for (const [index, dash] of dashes.slice(1, 3).entries()) {
      const lane = lanes[lanes.length - 3 + index];
      const laneAngle = Math.atan2(lane.y2 - lane.y1, lane.x2 - lane.x1);
      const dashAngle = Math.atan2(dash.vy, dash.vx);
      assert.ok(Math.abs(Math.atan2(Math.sin(dashAngle - laneAngle), Math.cos(dashAngle - laneAngle))) < 0.05, `dash ${index + 2} follows its lane`);
    }
    assert.equal(t(arena.probe.hud().bossMoveName), '골목 가르기');
  } finally {
    arena.engine.dispose();
  }
});

/** Steps until the next ring volley lands and returns its shots. */
function nextVolley({ probe }, limit = 60 * 6) {
  const before = new Set(probe.read().bossProjectiles.map((shot) => shot.id));
  for (let step = 0; step < limit; step += 1) {
    probe.step(1);
    const fresh = probe.read().bossProjectiles.filter((shot) => !before.has(shot.id) && shot.kind === 'ring');
    if (fresh.length > 0) return fresh;
  }
  return [];
}

test('in phase 2 the Bell-tower Warden leaves a ring gap that swaps sides each volley, behind a keyline', () => {
  const arena = bossInPhase(10, 2);
  try {
    const first = nextVolley(arena);
    const second = nextVolley(arena);
    assert.equal(first.length, 17, '22 shots with five left out');
    assert.equal(second.length, 17);
    const gapOf = (shots) => {
      const angles = shots.map((shot) => Math.atan2(shot.vy, shot.vx)).sort((a, b) => a - b);
      let widest = { size: 0, middle: 0 };
      for (let index = 0; index < angles.length; index += 1) {
        const from = angles[index];
        const to = index + 1 < angles.length ? angles[index + 1] : angles[0] + Math.PI * 2;
        if (to - from > widest.size) widest = { size: to - from, middle: (from + to) / 2 };
      }
      return widest.middle;
    };
    const turn = Math.abs(Math.atan2(Math.sin(gapOf(first) - gapOf(second)), Math.cos(gapOf(first) - gapOf(second))));
    assert.ok(turn > 2.4, `the gap swaps sides (${turn.toFixed(2)} rad)`);
    assert.equal(t(arena.probe.hud().bossMoveName), '갈라진 종소리');
  } finally {
    arena.engine.dispose();
  }
});

test('in phase 3 a ring wall closes in on the player with one gate, alternating with gapped rings', () => {
  const arena = bossInPhase(10, 3);
  try {
    const { player } = arena.probe.read();
    const wall = nextVolley(arena);
    assert.equal(wall.length, 24, '28 wall shots with a four-shot gate');
    for (const shot of wall) {
      const distance = Math.hypot(shot.x - player.x, shot.y - player.y);
      assert.ok(Math.abs(distance - 460) < 20, `on the 460 circle (${distance.toFixed(1)})`);
      const inward = (player.x - shot.x) * shot.vx + (player.y - shot.y) * shot.vy;
      assert.ok(inward > 0, 'moving inward');
    }
    const ring = nextVolley(arena);
    assert.equal(ring.length, 17, 'then a gapped ring');
    assert.equal(t(arena.probe.hud().bossMoveName), '닫히는 골목문');
  } finally {
    arena.engine.dispose();
  }
});

test('an anchoring boss holds its spot while the player stays within its leash', () => {
  const arena = bossInPhase(10, 2);
  try {
    arena.probe.clear('obstacles');
    const anchor = arena.read();
    assert.ok(anchor.anchorX !== undefined);
    // Start 300 from the boss and walk away for a second and a half: farther, but inside the 720 leash.
    const side = anchor.x < 2100 ? 1 : -1;
    arena.probe.setPlayer({ x: anchor.x + side * 300, y: anchor.y, prevX: anchor.x + side * 300, prevY: anchor.y });
    const start = arena.probe.read().player;
    const toward = side > 0 ? 'moveRight' : 'moveLeft';
    arena.engine.dispatch({ type: 'input/action', action: toward, pressed: true });
    arena.probe.step(90);
    arena.engine.dispatch({ type: 'input/action', action: toward, pressed: false });
    arena.probe.step(60);
    const boss = arena.read();
    const player = arena.probe.read().player;
    const gap = Math.hypot(player.x - boss.x, player.y - boss.y);
    assert.ok(Math.abs(player.x - start.x) > 250 && gap < 720, `the player walked away inside the leash (${Math.abs(player.x - start.x).toFixed(0)}, gap ${gap.toFixed(0)})`);
    assert.ok(Math.hypot(boss.x - anchor.anchorX, boss.y - anchor.anchorY) < 90, 'the boss stays within reach of its anchor');
  } finally {
    arena.engine.dispose();
  }
});

test('SYS-05 fix: an anchoring boss follows a player who leaves its leash, plants again, and enrage ends the hold', () => {
  const arena = bossInPhase(10, 2);
  try {
    arena.probe.clear('obstacles');
    const anchor = arena.read();
    const { player } = arena.probe.read();
    // The player stands 1,400 away, twice the leash: the boss walks after them and stops at the leash.
    const away = normalizeTo(player, anchor, 1400);
    arena.probe.setPlayer({ x: away.x, y: away.y, prevX: away.x, prevY: away.y });
    arena.probe.step(60 * 16);
    const followed = arena.read();
    const gap = Math.hypot(followed.x - away.x, followed.y - away.y);
    assert.ok(gap <= 760 && gap > 600, `the boss came back within its leash and stopped there (${gap.toFixed(0)})`);
    assert.ok(Math.hypot(followed.anchorX - followed.x, followed.anchorY - followed.y) < 90, 'and holds its new spot');
    arena.probe.step(60 * 2);
    const held = arena.read();
    assert.ok(Math.hypot(held.x - followed.x, held.y - followed.y) < 90, 'without closing in');

    // The stage clock runs out: the enraged boss leaves its spot and comes for the player.
    arena.probe.setClock({ timeLeft: 0 });
    arena.probe.step(60 * 6);
    const enraged = arena.read();
    assert.ok(Math.hypot(enraged.x - away.x, enraged.y - away.y) < gap - 250, 'enrage ends the hold');
  } finally {
    arena.engine.dispose();
  }
});

/** A point `length` away from `from`, on the side away from `other`, kept inside the arena. */
function normalizeTo(from, other, length) {
  const dx = from.x - other.x;
  const dy = from.y - other.y;
  const d = Math.hypot(dx, dy) || 1;
  return { x: Math.max(120, Math.min(4080, other.x + (dx / d) * length)), y: Math.max(120, Math.min(2880, other.y + (dy / d) * length)) };
}

test('a boss whose phase grammar is not built yet keeps chasing instead of anchoring or sweeping', () => {
  // Ch4's mid boss authors a sweeping phase 2 (second-hand-sweep); its grammar waits for the boss's kit art (SYS-05).
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet('remaster');
  engine.startRun(4, 5, 7373);
  const { probe } = engine;
  try {
    probe.haltSpawns();
    probe.setSkills({});
    probe.setGodMode();
    probe.clear('obstacles', 'hazards');
    const boss = probe.read().enemies.find((enemy) => enemy.isBoss);
    probe.removeEnemies(probe.read().enemies.filter((enemy) => !enemy.isBoss).map((enemy) => enemy.id));
    probe.patchEnemy(boss.id, { hp: boss.maxHp * 0.6 });
    probe.step(31);
    const phase2 = probe.read().enemies.find((enemy) => enemy.id === boss.id);
    assert.equal(phase2.bossPhase, 2);
    assert.equal(phase2.anchorX, undefined, 'no anchor');
    const { player } = probe.read();
    const before = Math.hypot(phase2.x - player.x, phase2.y - player.y);
    probe.step(60);
    const later = probe.read().enemies.find((enemy) => enemy.id === boss.id);
    const after = Math.hypot(later.x - probe.read().player.x, later.y - probe.read().player.y);
    assert.ok(after < before - 40, `it closes in (${before.toFixed(0)} -> ${after.toFixed(0)})`);
  } finally {
    engine.dispose();
  }
});

test('warnings keep their real-time length at phase cadence', () => {
  const arena = bossInPhase(10, 2);
  try {
    let warning;
    for (let step = 0; step < 60 * 5 && !warning; step += 1) {
      arena.probe.step(1);
      warning = arena.probe.effects().impactRings.find((ring) => ring.owner === 'hostile');
    }
    assert.ok(warning, 'a warning appears');
    assert.ok(Math.abs(warning.maxLife - (0.82 + 0.26)) < 1e-6, `the move's preview plus imminent (${warning.maxLife})`);
  } finally {
    arena.engine.dispose();
  }
});

test('classic rules keep single dashes and no move name in phase 2', () => {
  const arena = bossInPhase(5, 2, 'classic');
  try {
    const sequence = recordPhases(arena, 60 * 8).map((change) => change.phase).join(' ');
    assert.doesNotMatch(sequence, /dash warn dash/, sequence);
    assert.equal(arena.probe.hud().bossMoveName, undefined);
  } finally {
    arena.engine.dispose();
  }
});
