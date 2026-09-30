import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, holdDirection, installHeadlessPlatform } from '../scripts/lib/headless-engine.mjs';

// View camera (FX-04): under remaster rules the screen follows a spring camera that leans ahead of the player's
// movement; spawns, aim, and off-screen checks keep the player-centred simulation camera (G14). Classic rules keep
// 0.1.0's hard lock.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const meta = () => ({
  gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 1, stage: 1 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});
const options = { healthBars: 'elite', volume: 0, effects: 0.9, damageNumbers: true, screenShake: true, reducedFlash: false, paceMode: 'standard' };

function followRun(rules) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), options, { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.startRun(1, 1, 3030);
  engine.probe.haltSpawns();
  engine.probe.setGodMode();
  engine.probe.clear('enemies', 'hazards', 'obstacles', 'pickups');
  const gap = () => engine.probe.renderWorld(1).camera.x - engine.probe.read().camera.x;
  holdDirection(engine, 'd');
  engine.probe.step(120);
  const moving = gap();
  engine.dispatch({ type: 'input/action', action: 'moveRight', pressed: false });
  engine.probe.step(180);
  const stopped = gap();
  engine.dispose();
  return { moving, stopped };
}

test('FX-04: the screen leans ahead of the movement and settles back when the player stops', () => {
  const { moving, stopped } = followRun('remaster');
  // The spring trails a moving target by about 2v/ω (47 units at base speed), so the 70-unit lead nets a little ahead.
  assert.ok(moving > 10 && moving < 70, `leads by ${moving.toFixed(1)} while moving right`);
  assert.ok(Math.abs(stopped) < 1, `back on the player after stopping (${stopped.toFixed(2)})`);
});

test('FX-04: classic rules keep the hard-locked camera', () => {
  const { moving, stopped } = followRun('classic');
  assert.equal(moving, 0);
  assert.equal(stopped, 0);
});
