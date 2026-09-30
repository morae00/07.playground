import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Enemy roles (SYS-02): enemies push apart, chargers telegraph and dash, shooters lead a moving player, and
// wardens carry a slow-turning front shield. Classic rules keep the straight-line chase for A/B runs.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const meta = () => ({
  gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 5, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});

function arena(rules = 'remaster') {
  const events = [];
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.startRun(1, 5, 5151);
  engine.subscribe((event) => events.push(event));
  const { probe } = engine;
  probe.haltSpawns();
  probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots', 'effects');
  probe.setSkills({});
  probe.setGodMode();
  probe.setPlayer({ nextXp: 1e12 });
  const enemy = (id) => probe.read().enemies.find((candidate) => candidate.id === id);
  return { engine, probe, events, player: probe.read().player, enemy };
}

test('overlapping enemies push apart under remaster rules and stay stacked under classic', () => {
  for (const [rules, expectApart] of [['remaster', true], ['classic', false]]) {
    const { engine, probe, player, enemy } = arena(rules);
    try {
      const a = probe.spawnEnemy({ tier: 'small', x: player.x + 300, y: player.y, speed: 0, damage: 0, hp: 1e6 });
      const b = probe.spawnEnemy({ tier: 'small', x: player.x + 302, y: player.y + 1, speed: 0, damage: 0, hp: 1e6 });
      probe.step(90);
      const gap = Math.hypot(enemy(a).x - enemy(b).x, enemy(a).y - enemy(b).y);
      if (expectApart) assert.ok(gap > 22, `${rules}: ${gap}`);
      else assert.ok(gap < 5, `${rules}: ${gap}`);
    } finally {
      engine.dispose();
    }
  }
});

test('a charger winds up in place behind a lane telegraph, then dashes straight along it', () => {
  const { engine, probe, player, enemy } = arena();
  try {
    const id = probe.spawnEnemy({ tier: 'medium', x: player.x + 220, y: player.y, hp: 1e6, damage: 0 });
    let steps = 0;
    while (enemy(id).patternPhase !== 'warn' && steps < 60 * 5) {
      probe.step(1);
      steps += 1;
    }
    const start = enemy(id);
    assert.equal(start.patternPhase, 'warn', 'the charger winds up within five seconds');
    assert.ok(Math.hypot(start.x - player.x, start.y - player.y) <= 320, 'only within range');
    const lane = probe.read().laneTelegraphs.at(-1);
    assert.ok(lane && Math.abs(lane.x1 - start.x) < 1e-6 && lane.x2 < lane.x1, 'a lane telegraph points at the player');
    probe.step(30);
    const held = enemy(id);
    assert.ok(Math.hypot(held.x - start.x, held.y - start.y) < 1, 'it stands still during the 0.62 s windup');
    probe.step(20);
    const dashing = enemy(id);
    assert.equal(dashing.patternPhase, 'dash', 'the dash starts after 0.62 s');
    assert.ok(Math.abs(dashing.y - start.y) < 2, 'straight, no homing');
    probe.step(40);
    const after = enemy(id);
    // 0.5 s at 3.6x a charger's speed (about 96): roughly 170 units along the lane.
    const travelled = start.x - after.x;
    assert.ok(travelled > 130 && travelled < 230, `it dashes along the lane: ${travelled}`);
    assert.equal(after.patternPhase, 'idle');
    assert.ok(after.dashCooldown >= 3.3 && after.dashCooldown <= 6, `cooldown ${after.dashCooldown}`);
  } finally {
    engine.dispose();
  }
});

test('at most three chargers wind up at once, and far ones wait', () => {
  const { engine, probe, player, enemy } = arena();
  try {
    const near = [];
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      const id = probe.spawnEnemy({ tier: 'medium', x: player.x + Math.cos(angle) * 200, y: player.y + Math.sin(angle) * 200, hp: 1e6, damage: 0, speed: 0 });
      probe.patchEnemy(id, { dashCooldown: 0 });
      near.push(id);
    }
    const far = probe.spawnEnemy({ tier: 'medium', x: player.x + 700, y: player.y, hp: 1e6, damage: 0, speed: 0 });
    probe.patchEnemy(far, { dashCooldown: 0 });
    probe.step(1);
    const warns = near.filter((id) => enemy(id).patternPhase === 'warn').length;
    assert.equal(warns, 3);
    assert.equal(enemy(far).patternPhase, 'idle', 'out of range');
  } finally {
    engine.dispose();
  }
});

test('a charger that dashes into a wall is stunned for 0.8 s', () => {
  const { engine, probe, player, enemy, events } = arena();
  try {
    probe.addObstacle({ x: player.x - 150, y: player.y - 60, w: 40, h: 120, kind: 'solid' });
    const id = probe.spawnEnemy({ tier: 'medium', x: player.x - 260, y: player.y, hp: 1e6, damage: 0 });
    probe.patchEnemy(id, { dashCooldown: 0 });
    let stunned = false;
    for (let step = 0; step < 90 && !stunned; step += 1) {
      probe.step(1);
      stunned = enemy(id).stun > 0.7;
    }
    assert.ok(stunned, 'the wall stops the dash');
    assert.equal(enemy(id).patternPhase, 'idle');
    assert.ok(events.some((event) => event.type === 'enemy/stunned'));
  } finally {
    engine.dispose();
  }
});

test('shooters aim ahead of a moving player under remaster rules, at the player under classic', () => {
  for (const [rules, expectLead] of [['remaster', true], ['classic', false]]) {
    const { engine, probe, player, enemy } = arena(rules);
    try {
      const id = probe.spawnEnemy({ tier: 'small', attackStyle: 'ranged', x: player.x + 420, y: player.y, hp: 1e6, damage: 0, speed: 0 });
      probe.patchEnemy(id, { rangedCooldown: 0.3 });
      engine.dispatch({ type: 'input/action', action: 'moveDown', pressed: true });
      let aimAt = null;
      for (let step = 0; step < 60 && !aimAt; step += 1) {
        probe.step(1);
        const shooter = enemy(id);
        if (shooter.rangedTelegraph > 0) aimAt = { x: shooter.patternX, y: shooter.patternY, player: probe.read().player };
      }
      assert.ok(aimAt, `${rules}: the shooter aimed`);
      const lead = aimAt.y - aimAt.player.y;
      if (expectLead) assert.ok(lead > 60, `${rules}: leads by ${lead}`);
      else assert.ok(Math.abs(lead) < 12, `${rules}: aims at the player (${lead})`);
    } finally {
      engine.dispose();
    }
  }
});

test('the warden shield turns at 90 degrees a second and takes 60% of a frontal hit', () => {
  const { engine, probe, player, enemy, events } = arena();
  try {
    const id = probe.spawnEnemy({ tier: 'large', x: player.x + 200, y: player.y, hp: 1e6, damage: 0, speed: 0 });
    probe.step(1);
    assert.ok(Math.abs(Math.abs(enemy(id).shieldAngle) - Math.PI) < 0.05, 'the shield faces the player');
    probe.patchEnemy(id, { shieldAngle: 0 });
    probe.step(30);
    const turned = Math.abs(enemy(id).shieldAngle);
    assert.ok(Math.abs(turned - Math.PI / 4) < 0.05, `turned ${(turned * 180) / Math.PI} degrees in half a second`);

    probe.setPlayer({ stats: { critChance: 0 } });
    probe.setSkills({ railSpear: { level: 1 } });
    probe.patchEnemy(id, { hp: 1e6, shieldAngle: Math.PI });
    probe.cast('railSpear');
    const frontal = 1e6 - enemy(id).hp;
    probe.patchEnemy(id, { hp: 1e6, shieldAngle: 0 });
    probe.cast('railSpear');
    const exposed = 1e6 - enemy(id).hp;
    assert.ok(exposed > 0 && frontal > 0);
    assert.ok(Math.abs(frontal / exposed - 0.4) < 0.02, `frontal ${frontal} vs exposed ${exposed}`);
    assert.ok(events.some((event) => event.type === 'enemy/blocked'));
  } finally {
    engine.dispose();
  }
});
