import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Warnings (AUD-06, user decision 2026-10-23: bosses and ranged enemies): the engine says when a threat starts its
// windup, for its warning sound. A ranged enemy's aim and a charger's windup send enemy/windup; a boss's armed
// pattern and each dash windup that shows a lane send boss/windup, once per warning. lead is how long until the shot,
// dash, or pattern lands. Looks and sound only, under remaster rules only: classic event streams carry none.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const STEP = 1 / 60;
const meta = () => ({
  gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 5, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});
const WINDUPS = new Set(['enemy/windup', 'boss/windup']);

/** A stage with nothing on the field, or only its boss (frozen in place); every event with the step it came on. */
function arena(chapter, stage, { rules = 'remaster', keepBoss = false } = {}) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.startRun(chapter, stage, 6262);
  const { probe } = engine;
  probe.haltSpawns();
  probe.setSkills({});
  probe.setGodMode();
  probe.setPlayer({ nextXp: 1e12 });
  const boss = probe.read().enemies.find((enemy) => enemy.isBoss);
  probe.removeEnemies(probe.read().enemies.filter((enemy) => !(keepBoss && enemy.isBoss)).map((enemy) => enemy.id));
  probe.clear('hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots', 'effects');
  if (keepBoss) probe.patchEnemy(boss.id, { speed: 0, hp: 1e9, maxHp: 1e9 });
  const log = [];
  let now = 0;
  engine.subscribe((event) => log.push({ step: now, event }));
  const step = (count = 1) => {
    for (let index = 0; index < count; index += 1) {
      now += 1;
      probe.step(1);
    }
  };
  const of = (type, where = () => true) => log.filter((entry) => entry.event.type === type && where(entry.event));
  return { engine, probe, step, of, log, player: probe.read().player, boss, steps: () => now };
}

/** The windup's lead matches when its threat actually landed, to the step. */
function assertLead(windup, landedStep, label) {
  const waited = (landedStep - windup.step) * STEP;
  assert.ok(Math.abs(waited - windup.event.lead) <= STEP * 1.01, `${label}: lead ${windup.event.lead.toFixed(3)} s, landed after ${waited.toFixed(3)} s`);
}

test('AUD-06: a ranged enemy says once that it aims, as it aims, and its shot comes after the lead', () => {
  const r = arena(1, 2);
  try {
    const id = r.probe.spawnEnemy({ tier: 'small', attackStyle: 'ranged', x: r.player.x + 420, y: r.player.y, hp: 1e6, damage: 0, speed: 0 });
    r.probe.patchEnemy(id, { rangedCooldown: 0.3 });
    let aimed = -1;
    let shot = -1;
    for (let index = 0; index < 120 && shot < 0; index += 1) {
      r.step();
      const shooter = r.probe.read().enemies.find((enemy) => enemy.id === id);
      if (aimed < 0 && shooter.rangedTelegraph > 0) aimed = r.steps();
      if (aimed >= 0 && r.probe.read().bossProjectiles.length > 0) shot = r.steps();
    }
    assert.ok(aimed > 0 && shot > aimed, 'it aimed, then shot');
    const windups = r.of('enemy/windup');
    assert.equal(windups.length, 1);
    assert.equal(windups[0].step, aimed, 'on the step the aim began');
    assert.deepEqual([windups[0].event.role, Math.round(windups[0].event.x), Math.round(windups[0].event.y)], ['ranged', Math.round(r.player.x + 420), Math.round(r.player.y)]);
    assertLead(windups[0], shot, 'ranged');
    assert.equal(r.of('boss/windup').length, 0);
  } finally {
    r.engine.dispose();
  }
});

test('AUD-06: a charger says once that it winds up, and dashes after the lead', () => {
  const r = arena(1, 2);
  try {
    const id = r.probe.spawnEnemy({ tier: 'medium', x: r.player.x + 220, y: r.player.y, hp: 1e6, damage: 0 });
    let warned = -1;
    let dashed = -1;
    for (let index = 0; index < 60 * 6 && dashed < 0; index += 1) {
      r.step();
      const phase = r.probe.read().enemies.find((enemy) => enemy.id === id).patternPhase;
      if (warned < 0 && phase === 'warn') warned = r.steps();
      if (warned >= 0 && phase === 'dash') dashed = r.steps();
    }
    assert.ok(warned > 0 && dashed > warned, 'it wound up, then dashed');
    const windups = r.of('enemy/windup');
    assert.equal(windups.length, 1);
    assert.equal(windups[0].step, warned);
    assert.equal(windups[0].event.role, 'charger');
    assertLead(windups[0], dashed, 'charger');
  } finally {
    r.engine.dispose();
  }
});

test('AUD-06: a boss says once per armed pattern, not once per ring, and the pattern fires after the lead', () => {
  // 1-10 rings: one ring at the muzzle; 3-5 tide: five rings, one per pool.
  for (const [chapter, stage, pattern, rings] of [[1, 10, 'rings', 1], [3, 5, 'tide', 5]]) {
    const r = arena(chapter, stage, { keepBoss: true });
    try {
      assert.equal(r.boss.boss.pattern, pattern);
      r.step(60 * 10);
      const windups = r.of('boss/windup');
      const fired = r.of('boss/attack', (event) => event.pattern === pattern);
      assert.ok(windups.length >= 2, `${pattern}: ${windups.length} windups`);
      assert.ok(windups.every(({ event }) => event.pattern === pattern), pattern);
      for (const windup of windups) {
        const ringsThen = r.of('telegraph/ring').filter((entry) => entry.step === windup.step);
        assert.ok(ringsThen.length >= rings, `${pattern}: ${ringsThen.length} rings at the windup`);
        assert.equal(r.log.filter((entry) => entry.step === windup.step && entry.event.type === 'boss/windup').length, 1, `${pattern}: one windup for them`);
        assert.ok(ringsThen.some(({ event }) => Math.abs(event.life - windup.event.lead) < 1e-9), `${pattern}: the lead is the warning's life`);
        const landed = fired.find((entry) => entry.step > windup.step);
        if (landed) assertLead(windup, landed.step, pattern);
      }
      assert.ok(fired.length >= windups.length - 1, 'each warning was followed by its pattern');
    } finally {
      r.engine.dispose();
    }
  }
});

test('AUD-06: a boss dash warns at each windup that shows a lane: one a dash, two for the tracked pair, one for the crossing triple', () => {
  const dashes = (phase) => {
    const r = arena(1, 5, { keepBoss: true });
    try {
      assert.equal(r.boss.boss.pattern, 'dash');
      if (phase > 1) {
        // Into the phase (as bossMoves.integration does): the health thresholds, then the phase flash.
        const { maxHp } = r.probe.read().enemies.find((enemy) => enemy.id === r.boss.id);
        for (const ratio of [0.6, 0.3].slice(0, phase - 1)) {
          r.probe.patchEnemy(r.boss.id, { hp: maxHp * ratio });
          r.step(31);
        }
        assert.equal(r.probe.read().enemies.find((enemy) => enemy.id === r.boss.id).bossPhase, phase);
        r.log.length = 0;
      }
      const phaseNow = () => r.probe.read().enemies.find((enemy) => enemy.id === r.boss.id).patternPhase;
      let last = phaseNow();
      const windupsAt = [];
      for (let index = 0; index < 60 * 8; index += 1) {
        r.step();
        const now = phaseNow();
        if (now === 'warn' && last !== 'warn') windupsAt.push(r.steps());
        last = now;
      }
      const windups = r.of('boss/windup');
      const launches = r.of('boss/attack', (event) => event.pattern === 'dash');
      assert.ok(windupsAt.length >= 2 && launches.length >= 2, `phase ${phase}: the boss dashed`);
      assert.ok(windups.every(({ event }) => event.pattern === 'dash'));
      for (const windup of windups) assertLead(windup, launches.find((entry) => entry.step > windup.step)?.step ?? Infinity, `phase ${phase}`);
      // How many windups and launches each warning stood for, up to the next warning.
      const cycles = windups.map((windup, index) => {
        const until = windups[index + 1]?.step ?? Infinity;
        return {
          windups: windupsAt.filter((at) => at >= windup.step && at < until).length,
          launches: launches.filter((entry) => entry.step > windup.step && entry.step <= until).length,
          complete: index + 1 < windups.length,
        };
      });
      assert.ok(windupsAt.every((at) => windups.some((windup) => windup.step <= at)), `phase ${phase}: no windup before the first warning`);
      return cycles;
    } finally {
      r.engine.dispose();
    }
  };
  for (const [phase, label] of [[1, 'a dash'], [2, 'each of the tracked pair: the re-aimed second dash has its own lane']]) {
    const cycles = dashes(phase);
    assert.ok(cycles.length >= 2, `phase ${phase}: ${cycles.length} warnings`);
    for (const cycle of cycles) assert.equal(cycle.windups, 1, `phase ${phase}: one warning for ${label}`);
  }
  const triple = dashes(3);
  assert.ok(triple.some((cycle) => cycle.complete), 'phase 3: a whole crossing triple ran');
  for (const cycle of triple.filter((each) => each.complete)) assert.deepEqual([cycle.windups, cycle.launches], [3, 3], 'phase 3: one warning for the three crossing dashes, shown at once');
});

test('AUD-06: the shock and the eclipse wall, which sound at their telegraph, send no windup', () => {
  const shock = arena(1, 2);
  try {
    shock.probe.spawnBoss('field', { x: shock.player.x + 300, y: shock.player.y, hp: 1e9 });
    shock.step(60 * 8);
    assert.ok(shock.of('boss/attack', (event) => event.pattern === 'shock').length >= 1, 'the field boss shocked');
    assert.equal(shock.of('boss/windup').length, 0);
  } finally {
    shock.engine.dispose();
  }
  const eclipse = arena(5, 5, { keepBoss: true });
  try {
    assert.equal(eclipse.boss.boss.pattern, 'eclipse');
    eclipse.step(60 * 10);
    assert.ok(eclipse.of('boss/attack', (event) => event.pattern === 'eclipse').length >= 1, 'the wall came');
    assert.equal(eclipse.of('boss/windup').length, 0);
  } finally {
    eclipse.engine.dispose();
  }
});

test('AUD-06: classic rules send no windup events: their event streams stay 0.1.0\'s', () => {
  for (const [chapter, stage, setup] of [
    [1, 2, (r) => {
      r.probe.patchEnemy(r.probe.spawnEnemy({ tier: 'small', attackStyle: 'ranged', x: r.player.x + 420, y: r.player.y, hp: 1e6, damage: 0, speed: 0 }), { rangedCooldown: 0.3 });
      r.probe.spawnEnemy({ tier: 'medium', x: r.player.x - 220, y: r.player.y, hp: 1e6, damage: 0 });
    }],
    [1, 5, () => {}],
    [1, 10, () => {}],
    [3, 5, () => {}],
  ]) {
    const r = arena(chapter, stage, { rules: 'classic', keepBoss: stage === 5 || stage === 10 });
    try {
      setup(r);
      // The threats still wind up under classic rules: an aim, a dash windup, a volley, or a boss's pools.
      let threats = 0;
      for (let index = 0; index < 60 * 8; index += 1) {
        r.step();
        const world = r.probe.read();
        if (world.enemies.some((enemy) => enemy.rangedTelegraph > 0 || enemy.patternPhase === 'warn') || world.bossProjectiles.length > 0 || world.hazards.length > 0) threats += 1;
      }
      assert.ok(threats > 0, `${chapter}-${stage}: a threat wound up`);
      assert.deepEqual(r.log.filter((entry) => WINDUPS.has(entry.event.type)), [], `${chapter}-${stage}`);
    } finally {
      r.engine.dispose();
    }
  }
  // The same ranged aim under remaster rules does warn.
  const remaster = arena(1, 2);
  try {
    remaster.probe.patchEnemy(remaster.probe.spawnEnemy({ tier: 'small', attackStyle: 'ranged', x: remaster.player.x + 420, y: remaster.player.y, hp: 1e6, damage: 0, speed: 0 }), { rangedCooldown: 0.3 });
    remaster.step(60);
    assert.ok(remaster.of('enemy/windup').length >= 1);
  } finally {
    remaster.engine.dispose();
  }
});
