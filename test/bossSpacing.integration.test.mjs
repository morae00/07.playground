import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Boss spacing (SYS-04): bosses enter at least 420 away even beside a world edge, and a boss that touches the
// player is pushed back out instead of sitting on top of them (the root of BUG-12).

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const meta = () => ({
  gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 5, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});

function arena(rules, seed = 9090) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.startRun(1, 2, seed);
  const { probe } = engine;
  probe.haltSpawns();
  probe.setSkills({});
  probe.setGodMode();
  probe.setPlayer({ nextXp: 1e12 });
  probe.clear('enemies', 'hazards', 'obstacles', 'hostileShots');
  return { engine, probe };
}

test('bosses enter at least 420 away, even with the player in a corner', () => {
  for (const [rules, minimum] of [['remaster', 420], ['classic', 0]]) {
    let closest = Infinity;
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const { engine, probe } = arena(rules, 9090 + attempt * 7919);
      try {
        probe.setPlayer({ x: 140, y: 140 });
        probe.spawnBoss('field');
        const boss = probe.read().enemies.find((enemy) => enemy.isBoss);
        closest = Math.min(closest, Math.hypot(boss.x - 140, boss.y - 140));
      } finally {
        engine.dispose();
      }
    }
    if (minimum > 0) assert.ok(closest >= minimum, `${rules}: closest entry ${closest}`);
    else assert.ok(closest < 420, `${rules}: the corner clamps some entries close (${closest})`);
  }
});

test('a boss touching the player is pushed back out under remaster rules, and stays on top under classic', () => {
  for (const [rules, expectApart] of [['remaster', true], ['classic', false]]) {
    const { engine, probe } = arena(rules);
    try {
      const { player } = probe.read();
      const id = probe.spawnBoss('mid', { x: player.x + 5, y: player.y, hp: 1e9 });
      probe.patchEnemy(id, { patternTimer: 99 });
      probe.step(30);
      const boss = probe.read().enemies.find((enemy) => enemy.id === id);
      const gap = Math.hypot(boss.x - probe.read().player.x, boss.y - probe.read().player.y);
      const touching = boss.radius + 15;
      if (expectApart) assert.ok(gap >= touching - 0.5, `${rules}: gap ${gap}`);
      else assert.ok(gap < touching - 10, `${rules}: overlapping (${gap})`);
    } finally {
      engine.dispose();
    }
  }
});
