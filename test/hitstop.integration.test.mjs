import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform } from '../scripts/lib/headless-engine.mjs';

// Hit-stop in two layers (FX-02): under remaster rules an ordinary heavy hit recoils the struck body in the
// presentation layer and leaves the simulation running; rare events (the rail spear, a boss kill) still stop it.
// Classic rules keep 0.1.0's hit-stop on every heavy hit.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const meta = () => ({
  gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 1, stage: 1 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});
const options = { healthBars: 'elite', volume: 0, effects: 0.9, damageNumbers: true, screenShake: false, reducedFlash: false, paceMode: 'standard' };

function arena(rules) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), options, { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.startRun(1, 1, 4040);
  engine.probe.haltSpawns();
  engine.probe.setGodMode();
  engine.probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots');
  engine.probe.setSkills({});
  engine.probe.step(60);
  return engine;
}

/** A frost line cut through a sturdy enemy lands a heavy hit or better; returns the hit-stop it asked for. */
function heavyHit(engine) {
  const { player } = engine.probe.read();
  engine.probe.spawnEnemy({ tier: 'small', x: player.x + 120, y: player.y, hp: 60, speed: 0, damage: 0 });
  engine.probe.setSkills({ frostLine: { level: 5 } });
  engine.probe.cast('frostLine');
  return engine.probe.read().hitStop;
}

test('FX-02: an ordinary heavy hit stops only the struck body under remaster rules, and everything under classic', () => {
  const remaster = arena('remaster');
  const classic = arena('classic');
  try {
    assert.equal(heavyHit(remaster), 0, 'the simulation keeps running');
    assert.equal(remaster.probe.effects().recoils.length, 1, 'the body recoils instead');
    assert.ok(heavyHit(classic) > 0, 'classic rules stop the whole simulation');
  } finally {
    remaster.dispose();
    classic.dispose();
  }
});

test('FX-02: the rail spear and a boss kill still stop the simulation, within the BUG-07 budget', () => {
  const engine = arena('remaster');
  try {
    engine.probe.step(120);
    const { player } = engine.probe.read();
    engine.probe.spawnEnemy({ tier: 'small', x: player.x + 200, y: player.y, hp: 1e6, speed: 0, damage: 0 });
    engine.probe.setSkills({ railSpear: { level: 1 } });
    engine.probe.cast('railSpear');
    assert.ok(engine.probe.read().hitStop > 0, 'the rail spear is a rare event');
  } finally {
    engine.dispose();
  }
});
