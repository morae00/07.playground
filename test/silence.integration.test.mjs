import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Silence (SYS-11, team decision: option a): silence blocks new casts only. Cooldowns keep counting, orbit
// blades and the magnet pulse keep working, and skills ready at release fire one by one 0.1 s apart.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function arena(rules, loadout) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), {
    onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {},
  });
  engine.setRuleSet(rules);
  engine.startRun(1, 3, 1111);
  engine.probe.haltSpawns();
  engine.probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots', 'effects');
  engine.probe.setGodMode();
  engine.probe.setSkills(loadout);
  engine.probe.setPlayer({ nextXp: 1e9 });
  return { engine, player: engine.probe.read().player };
}

test('silence blocks new casts but cooldowns keep counting (classic rules freeze them)', () => {
  for (const [rules, expectCounting] of [['remaster', true], ['classic', false]]) {
    const { engine, player } = arena(rules, { needleStorm: { level: 1 } });
    try {
      engine.probe.spawnEnemy({ x: player.x + 250, y: player.y, hp: 1e6, speed: 0, damage: 0 });
      engine.probe.cast('needleStorm');
      const before = engine.probe.read().skillCooldowns.needleStorm;
      engine.probe.clear('projectiles');
      engine.probe.setPlayer({ silence: 3 });
      engine.probe.step(30);
      const world = engine.probe.read();
      assert.equal(world.projectiles.length, 0, `${rules}: no needle is fired while silenced`);
      if (expectCounting) assert.ok(world.skillCooldowns.needleStorm < before - 0.4, `${rules}: the cooldown kept counting`);
      else assert.equal(world.skillCooldowns.needleStorm, before, `${rules}: the cooldown froze`);
    } finally {
      engine.dispose();
    }
  }
});

test('orbit blades keep cutting while silenced', () => {
  const { engine, player } = arena('remaster', { orbitScythes: { level: 1 } });
  try {
    const target = engine.probe.spawnEnemy({ x: player.x + 82, y: player.y, hp: 1e6, speed: 0, damage: 0 });
    engine.probe.setPlayer({ silence: 3 });
    engine.probe.step(120);
    const enemy = engine.probe.read().enemies.find((candidate) => candidate.id === target);
    assert.ok(enemy.hp < 1e6, 'the orbit blades hit during silence');
  } finally {
    engine.dispose();
  }
});

test('skills ready when silence ends fire one at a time, at least 0.1 s apart', () => {
  const { engine, player } = arena('remaster', { fanKnives: { level: 1 }, chainSpark: { level: 1 }, frostLine: { level: 1 }, railSpear: { level: 1 } });
  try {
    engine.probe.spawnEnemy({ x: player.x + 220, y: player.y, hp: 1e9, speed: 0, damage: 0 });
    const casts = [];
    let tick = 0;
    engine.probe.onStep((step) => { tick = step; });
    engine.subscribe((event) => { if (event.type === 'skill/cast') casts.push({ skillId: event.skillId, tick }); });
    engine.probe.setPlayer({ silence: 4 });
    engine.probe.step(4 * 60 + 60);
    const release = casts.filter((cast) => cast.tick > 4 * 60 - 2);
    const firstFour = [];
    for (const cast of release) if (!firstFour.some((seen) => seen.skillId === cast.skillId)) firstFour.push(cast);
    assert.equal(firstFour.length, 4, `every ready skill fired after release: ${JSON.stringify(release)}`);
    for (let index = 1; index < firstFour.length; index += 1) {
      assert.ok(firstFour[index].tick - firstFour[index - 1].tick >= 6, `casts are 0.1 s apart: ${JSON.stringify(firstFour)}`);
    }
    assert.ok(casts.every((cast) => cast.tick >= 4 * 60 - 1), 'nothing fired during the silence');
  } finally {
    engine.dispose();
  }
});

test('the awakened recovery thread fires every 2.2 s at full health, as its card says', () => {
  const volleys = (rules) => {
    const { engine } = arena(rules, { recoveryThread: { level: 5, awakened: true } });
    try {
      const seen = new Set();
      let count = 0;
      engine.probe.onStep(() => {
        const fresh = engine.probe.read().projectiles.filter((shot) => shot.skillId === 'recoveryThread' && !seen.has(shot.id));
        if (fresh.length > 0) count += 1;
        for (const shot of fresh) seen.add(shot.id);
      });
      engine.probe.step(11 * 60);
      return count;
    } finally {
      engine.dispose();
    }
  };
  assert.equal(volleys('remaster'), 5, 'remaster: one volley per 2.2 s over 11 s');
  assert.ok(volleys('classic') >= 9, 'classic rules keep the 0.1.0 double count (about 1.1 s)');
});
