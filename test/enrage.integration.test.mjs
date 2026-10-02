import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Stepped enrage (SYS-04): when a boss stage's clock runs out, enrage climbs a step every 30 s (speed, pattern
// density, damage x1.5, damage x2.0) instead of x4.5 damage at once, and its silence zone lands after a warning.
// Overtime (D-02): every 30 s after the fourth step the bosses deal 25% more damage and move 8% faster.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const meta = () => ({
  gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 5, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});

function enragedBoss(rules, patch = null) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  if (patch) engine.probe.patchRules(patch);
  engine.startRun(1, 5, 6060);
  const { probe } = engine;
  probe.setSkills({});
  probe.setGodMode();
  probe.setPlayer({ nextXp: 1e12 });
  const boss = probe.read().enemies.find((enemy) => enemy.isBoss);
  probe.patchEnemy(boss.id, { hp: 1e9, maxHp: 1e9 });
  probe.clear('hazards');
  const base = { damage: boss.damage, speed: boss.speed };
  probe.setClock({ timeLeft: 0.01 });
  probe.step(2);
  const read = () => probe.read().enemies.find((enemy) => enemy.id === boss.id);
  return { engine, probe, base, read };
}

test('classic enrage still multiplies damage by 4.5 and drops silence on the player at once', () => {
  const { engine, probe, base, read } = enragedBoss('classic');
  try {
    assert.equal(probe.read().bossEnraged, true);
    assert.ok(Math.abs(read().damage / base.damage - 4.5) < 1e-9);
    assert.ok(probe.read().hazards.some((hazard) => hazard.kind === 'null'), 'the silence zone is there immediately');
  } finally {
    engine.dispose();
  }
});

test('stepped enrage climbs every 30 s and, without overtime, caps at double damage', () => {
  const { engine, probe, base, read } = enragedBoss('remaster', { enrageOvertime: false });
  try {
    let world = probe.read();
    assert.equal(world.bossEnraged, true);
    assert.equal(world.enrageStep, 1);
    assert.ok(Math.abs(read().speed / base.speed - 1.2) < 1e-9, 'step 1 is speed');
    assert.equal(read().damage, base.damage, 'no damage bonus yet');
    assert.equal(world.hazards.some((hazard) => hazard.kind === 'null'), false, 'the silence zone waits behind its warning');
    assert.ok(probe.effects().impactRings.some((ring) => ring.owner === 'hostile' && Math.abs(ring.radius - 170) < 1e-6), 'a warning ring shows where it lands');
    probe.step(60);
    assert.ok(probe.read().hazards.some((hazard) => hazard.kind === 'null'), 'the zone lands after 0.8 s');

    probe.step(60 * 29);
    world = probe.read();
    assert.equal(world.enrageStep, 2, 'step 2 at 30 s');
    assert.equal(read().damage, base.damage, 'step 2 is pattern density, not damage');
    probe.step(60 * 30);
    assert.equal(probe.read().enrageStep, 3);
    assert.ok(Math.abs(read().damage / base.damage - 1.5) < 1e-9, 'step 3 is x1.5 damage');
    probe.step(60 * 30);
    assert.equal(probe.read().enrageStep, 4);
    assert.ok(Math.abs(read().damage / base.damage - 2) < 1e-9, 'step 4 is x2.0 damage');
    probe.step(60 * 40);
    assert.equal(probe.read().enrageStep, 4, 'it stops at step 4');
    assert.ok(Math.abs(read().damage / base.damage - 2) < 1e-9);
    assert.equal(probe.hud().bossEnrage, 4, 'the HUD shows the fourth step');
    assert.equal(probe.hud().bossEnrageSteps, 4);
  } finally {
    engine.dispose();
  }
});

test('D-02: past the fourth step, overtime adds 25% damage and 8% speed every 30 s, and the HUD counts it', () => {
  const { engine, probe, base, read } = enragedBoss('remaster');
  try {
    probe.step(60 * 91);
    assert.deepEqual([probe.read().enrageStep, probe.read().overtimeStep], [4, 0], 'step 4 at 90 s, no overtime yet');
    probe.step(60 * 30);
    assert.equal(probe.read().overtimeStep, 1, 'the first overtime step at 120 s');
    assert.ok(Math.abs(read().damage / base.damage - 2 * 1.25) < 1e-9, `x2.5 damage (${(read().damage / base.damage).toFixed(3)})`);
    assert.ok(Math.abs(read().speed / base.speed - 1.2 * 1.08) < 1e-9, 'and 8% faster');
    probe.step(60 * 60);
    assert.equal(probe.read().overtimeStep, 3);
    assert.ok(Math.abs(read().damage / base.damage - 2 * 1.25 ** 3) < 1e-9, 'it keeps climbing');
    assert.equal(probe.hud().bossOvertime, 3, 'the HUD shows the overtime steps');
  } finally {
    engine.dispose();
  }
  const classic = enragedBoss('classic');
  try {
    classic.probe.step(60 * 200);
    assert.equal(classic.probe.read().overtimeStep, 0, 'classic rules have no overtime');
  } finally {
    classic.engine.dispose();
  }
});
