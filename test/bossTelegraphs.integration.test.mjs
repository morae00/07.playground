import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Boss telegraphs (SYS-04): every boss volley and zone is armed first and telegraphed, then fires exactly as
// shown. Volleys wait for room under the shot cap, and shots pushed over it fade out harmlessly.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const meta = () => ({
  gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 5, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});

/** A boss stage with only its main boss, frozen in place, and a player who cannot die. */
function bossArena(chapter, stage, rules = 'remaster') {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.startRun(chapter, stage, 8080);
  // The boss from the start, as before the boss warm-up (CON-02).
  engine.probe.bringBoss();
  const { probe } = engine;
  probe.haltSpawns();
  probe.setSkills({});
  probe.setGodMode();
  probe.setPlayer({ nextXp: 1e12 });
  const boss = probe.read().enemies.find((enemy) => enemy.isBoss);
  probe.removeEnemies(probe.read().enemies.filter((enemy) => !enemy.isBoss).map((enemy) => enemy.id));
  probe.clear('hazards', 'hostileShots', 'effects');
  probe.patchEnemy(boss.id, { speed: 0, hp: 1e9, maxHp: 1e9 });
  const read = () => probe.read().enemies.find((enemy) => enemy.id === boss.id);
  const warnings = () => probe.effects().impactRings.filter((ring) => ring.owner === 'hostile');
  return { engine, probe, boss: read(), read, warnings };
}

/** Steps until the boss arms its pattern; returns the armed state and the step count. */
function untilArmed({ probe, read }, limit = 60 * 8) {
  for (let step = 0; step < limit; step += 1) {
    probe.step(1);
    const boss = read();
    if (boss.armedPattern) return boss.armedPattern;
  }
  return null;
}

test('ring volleys are telegraphed at the muzzle, then fire from there at the armed angles', () => {
  const arena = bossArena(1, 10);
  try {
    assert.equal(arena.boss.boss.pattern, 'rings');
    arena.probe.clear('hostileShots', 'effects');
    const armed = untilArmed(arena);
    assert.ok(armed, 'the pattern arms');
    assert.equal(arena.probe.read().bossProjectiles.length, 0, 'nothing fires while the warning shows');
    const warning = arena.warnings().at(-1);
    assert.ok(warning && Math.abs(warning.x - armed.x) < 1e-6 && warning.life > 0.3, 'a warning ring sits on the muzzle');
    let shots = [];
    for (let step = 0; step < 60 && shots.length === 0; step += 1) {
      arena.probe.step(1);
      shots = arena.probe.read().bossProjectiles;
    }
    assert.equal(shots.length, 22);
    const angles = shots.map((shot) => Math.atan2(shot.vy, shot.vx));
    const expected = ((armed.offset % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    assert.ok(angles.some((angle) => Math.abs(Math.atan2(Math.sin(angle - expected), Math.cos(angle - expected))) < 1e-6), 'fired at the armed offset');
  } finally {
    arena.engine.dispose();
  }
});

test('classic rules still fire boss volleys without a warning', () => {
  const arena = bossArena(1, 10, 'classic');
  try {
    let fired = false;
    for (let step = 0; step < 60 * 5 && !fired; step += 1) {
      arena.probe.step(1);
      fired = arena.probe.read().bossProjectiles.length > 0;
    }
    assert.ok(fired);
    assert.equal(arena.warnings().length, 0);
  } finally {
    arena.engine.dispose();
  }
});

test('saws show their paths, clones their summoning circles, and zones their footprints before they land', () => {
  for (const [chapter, stage, pattern] of [[4, 10, 'saw'], [2, 5, 'clones'], [3, 5, 'tide'], [3, 10, 'traps'], [5, 10, 'null'], [4, 5, 'clock']]) {
    const arena = bossArena(chapter, stage);
    try {
      assert.equal(arena.boss.boss.pattern, pattern, `${chapter}-${stage}`);
      arena.probe.clear('hostileShots', 'effects', 'hazards');
      const lanesBefore = arena.probe.read().laneTelegraphs.length;
      const enemiesBefore = arena.probe.read().enemies.length;
      const armed = untilArmed(arena);
      assert.ok(armed, `${pattern} arms`);
      if (pattern === 'saw') assert.equal(arena.probe.read().laneTelegraphs.length - lanesBefore, 4, 'four saw paths');
      else assert.ok(arena.warnings().length >= Math.max(1, armed.points.length), `${pattern}: a warning for each spot`);
      for (let step = 0; step < 60 && arena.read().armedPattern; step += 1) arena.probe.step(1);
      const world = arena.probe.read();
      if (pattern === 'clones') {
        const clones = world.enemies.filter((enemy) => !enemy.isBoss);
        assert.equal(clones.length - enemiesBefore + 1, 4, 'four clones');
        for (const point of armed.points) assert.ok(clones.some((clone) => Math.hypot(clone.x - point.x, clone.y - point.y) < 30), 'each clone stands on its circle');
      } else if (pattern === 'tide' || pattern === 'traps') {
        for (const point of armed.points) assert.ok(world.hazards.some((hazard) => Math.hypot(hazard.x - point.x, hazard.y - point.y) < 1e-6), `${pattern}: the zone lands where it was shown`);
      } else {
        assert.ok(world.bossProjectiles.length > 0, `${pattern} fires`);
      }
    } finally {
      arena.engine.dispose();
    }
  }
});

test('a volley waits for room under the shot cap, and shots over the hard cap fade out harmlessly', () => {
  const arena = bossArena(1, 10);
  try {
    const { player } = arena.probe.read();
    for (let index = 0; index < 295; index += 1) arena.probe.spawnHostileShot({ x: player.x + 2000, y: player.y, life: 60 });
    const armed = untilArmed(arena);
    assert.ok(armed);
    for (let step = 0; step < 40; step += 1) arena.probe.step(1);
    assert.equal(arena.probe.read().bossProjectiles.filter((shot) => shot.kind === 'ring').length, 0, 'the ring volley waited');
    assert.ok(arena.read().patternTimer > 0, 'and will try again');

    arena.probe.clear('hostileShots');
    for (let index = 0; index < 330; index += 1) arena.probe.spawnHostileShot({ x: player.x + 2000, y: player.y, life: 60 });
    const shots = arena.probe.read().bossProjectiles;
    assert.equal(shots.filter((shot) => shot.fading).length, 10, 'the ten oldest fade');
    assert.ok(shots.filter((shot) => shot.fading).every((shot) => shot.life <= 0.3));
    // The oldest shot sits on the player; pushing the count over the cap turns it into a harmless fade.
    arena.probe.clear('hostileShots');
    arena.probe.spawnHostileShot({ x: player.x, y: player.y, life: 60, damage: 50 });
    for (let index = 0; index < 320; index += 1) arena.probe.spawnHostileShot({ x: player.x + 2000, y: player.y, life: 60 });
    const [onPlayer] = arena.probe.read().bossProjectiles;
    assert.equal(onPlayer.fading, true);
    arena.probe.patchEnemy(arena.boss.id, { patternTimer: 99 });
    arena.probe.setGodMode(false);
    const hp = arena.probe.read().player.hp;
    arena.probe.step(1);
    assert.equal(arena.probe.read().player.hp, hp, 'a fading shot does not hit');
  } finally {
    arena.engine.dispose();
  }
});
