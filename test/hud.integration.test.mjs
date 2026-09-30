import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform } from '../scripts/lib/headless-engine.mjs';

// In-run HUD (UI-02): what the HUD snapshot carries for the boss bar and the skill slots.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const meta = () => ({
  gold: 0,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 1, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});
const options = { healthBars: 'elite', volume: 0, effects: 0.9, damageNumbers: true, screenShake: false, reducedFlash: false, paceMode: 'standard' };

function withEngine(body) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), options, { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  try {
    body(engine);
  } finally {
    engine.dispose();
  }
}

test('UI-02: the boss bar gets the boss id for its portrait, its phase, and its enrage steps', () => {
  withEngine((engine) => {
    engine.startRun(1, 5, 5150);
    engine.probe.setGodMode();
    engine.probe.step(30);
    const hud = engine.probe.hud();
    assert.equal(hud.bossId, 's1-mid-dash');
    assert.equal(hud.bossName, '잉크 도살자', 'the name alone: phase and enrage are separate fields');
    assert.equal(hud.bossPhase, 1);
    assert.equal(hud.bossEnrage, 0);
    assert.equal(hud.bossEnrageSteps, 4, 'stepped enrage under remaster rules');

    engine.startRun(1, 1, 5150);
    assert.equal(engine.probe.hud().bossId, undefined, 'no boss bar on a survival stage');
  });
});

test('UI-02: active skills report the share of their cooldown still to run; passives report none', () => {
  withEngine((engine) => {
    engine.startRun(1, 1, 5150);
    engine.probe.haltSpawns();
    engine.probe.setGodMode();
    engine.probe.clear('enemies', 'hazards', 'pickups', 'projectiles', 'hostileShots');
    engine.probe.setSkills({ chainSpark: { level: 1 }, ironFrame: { level: 1 } });
    const { player } = engine.probe.read();
    engine.probe.spawnEnemy({ x: player.x + 160, y: player.y, hp: 1e9 });
    assert.deepEqual(engine.probe.hud().cooldowns, { chainSpark: 0 }, 'ready before the first cast');
    engine.probe.cast('chainSpark');
    const started = engine.probe.hud().cooldowns.chainSpark;
    assert.equal(started, 1, 'a cooldown seen starting reads full');
    engine.probe.step(30);
    const later = engine.probe.hud().cooldowns.chainSpark;
    assert.ok(later > 0 && later < started, `half a second later it has run down (${later})`);
    assert.equal('ironFrame' in engine.probe.hud().cooldowns, false);
  });
});
