import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, localeTable, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Elites (SYS-10, eliteAffixes rule; remaster on, classic off): an ordinary enemy with one affix (haste, split,
// shield, or drain), 2.5 times the health, an elite purple outline, its affix's mark, and a coin chest when it falls.
// Elite beats (SYS-03) promote some of their spawns; the elite hunt objective (CON-03) asks for elite kills.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, installStrings, tx } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');
installStrings(localeTable('ko'));

function run(chapter, stage, { rules = 'remaster', seed = 909 } = {}) {
  const settlements = [];
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), {
    onSnapshot() {},
    onDraft(draft) { engine.completeDraft(draft.cards[0], draft.id); },
    onRoundClear(result) { settlements.push(result); },
    onGameOver(result) { settlements.push(result); },
  });
  engine.setRuleSet(rules);
  engine.startRun(chapter, stage, seed);
  engine.probe.setGodMode();
  engine.probe.haltSpawns();
  return { engine, probe: engine.probe, settlements };
}

/** Steps a stage on until its director is in an elite beat. */
function toEliteBeat(r) {
  for (let tries = 0; tries < 400 && r.probe.director()?.beat !== 'elite'; tries += 1) {
    r.probe.clear('enemies');
    r.probe.step(30);
  }
  assert.equal(r.probe.director()?.beat, 'elite');
}

/** Spawns enemies one at a time, clearing them, and returns the elites among them. */
function sampleSpawns(r, count) {
  const elites = [];
  for (let index = 0; index < count; index += 1) {
    r.probe.clear('enemies');
    r.probe.spawnEnemy({ tier: 'rolled' });
    const [enemy] = r.probe.read().enemies;
    if (enemy.elite) elites.push(enemy);
  }
  return elites;
}

test('SYS-10: elite beats promote about 12% of their spawns, other beats none, and classic rules never', () => {
  const r = run(2, 2);
  try {
    assert.equal(sampleSpawns(r, 300).length, 0, 'the opening beat brings no elites');
    toEliteBeat(r);
    const elites = sampleSpawns(r, 1500);
    const share = elites.length / 1500;
    assert.ok(share > 0.09 && share < 0.15, `${(share * 100).toFixed(1)}% of an elite beat's spawns`);
    assert.deepEqual([...new Set(elites.map((enemy) => enemy.elite))].sort(), ['drain', 'haste', 'shield', 'split']);
    // An elite keeps its tier's radius (G9, V4) with 2.5 times the health.
    for (const enemy of elites.slice(0, 20)) assert.equal(enemy.radius, { small: 12, medium: 19, large: 28 }[enemy.tier]);
  } finally {
    r.engine.dispose();
  }
  const classic = run(2, 2, { rules: 'classic' });
  try {
    assert.equal(sampleSpawns(classic, 600).length, 0);
  } finally {
    classic.engine.dispose();
  }
});

test('SYS-10: at most three elites are alive at once', () => {
  const r = run(2, 2);
  try {
    toEliteBeat(r);
    r.probe.clear('enemies');
    for (let index = 0; index < 400; index += 1) r.probe.spawnEnemy({ tier: 'rolled', speed: 0, damage: 0 });
    assert.equal(r.probe.read().enemies.filter((enemy) => enemy.elite).length, 3);
  } finally {
    r.engine.dispose();
  }
});

test('SYS-10: a shield takes hits first and comes back; a drain aura heals; a split elite breaks in two; each pays a chest', () => {
  const r = run(2, 2);
  try {
    r.probe.clear('enemies', 'pickups');
    const { player } = r.probe.read();
    const make = (affix, patch = {}) => {
      const id = r.probe.spawnEnemy({ tier: 'large', x: player.x + 300, y: player.y, speed: 0, damage: 0 });
      r.probe.patchEnemy(id, { elite: affix, hp: 1000, maxHp: 1000, ...patch });
      return id;
    };
    const find = (id) => r.probe.read().enemies.find((enemy) => enemy.id === id);
    // Shield: 600 of barrier comes off before the health.
    const shielded = make('shield', { eliteShield: 600, eliteHitAt: 0 });
    r.probe.setSkills({ chainSpark: { level: 1 } });
    r.probe.cast('chainSpark');
    const struck = find(shielded);
    assert.ok(struck.eliteShield < 600 && struck.hp === 1000, `the shield took it (${struck.eliteShield.toFixed(0)} left, health ${struck.hp})`);
    r.probe.setSkills({});
    r.probe.step(60 * 4 + 5);
    assert.equal(find(shielded).eliteShield, 600, 'four seconds untouched bring it back');
    r.probe.clear('enemies');

    // Drain: a hurt neighbour regains 4% of its max health a second.
    make('drain');
    const neighbour = r.probe.spawnEnemy({ tier: 'small', x: player.x + 340, y: player.y, speed: 0, damage: 0 });
    r.probe.patchEnemy(neighbour, { hp: 10, maxHp: 100 });
    r.probe.step(60);
    assert.ok(Math.abs(find(neighbour).hp - 14) < 0.2, `healed to ${find(neighbour).hp.toFixed(2)}`);
    r.probe.clear('enemies', 'pickups');

    // Split: a large elite falls into two mediums at half their usual health, and drops its chest.
    const split = make('split', { hp: 1, x: player.x + 60, prevX: player.x + 60 });
    r.probe.setSkills({ chainSpark: { level: 1 } });
    r.probe.cast('chainSpark');
    r.probe.step(2);
    const children = r.probe.read().enemies.filter((enemy) => enemy.id !== split && enemy.tier === 'medium');
    assert.equal(children.length, 2);
    assert.ok(children.every((child) => !child.elite && child.radius === 19));
    const chest = r.probe.read().pickups.filter((pickup) => pickup.kind === 'coin').reduce((sum, pickup) => sum + pickup.value, 0);
    assert.ok(chest >= 12 * 7, `a chest of ${chest} coins`);
  } finally {
    r.engine.dispose();
  }
});

test('SYS-10: the elite hunt brings elites in every beat and asks for ten elite kills', () => {
  const r = run(1, 4);
  try {
    assert.equal(tx(r.probe.hud().bonus.goal), '정예 10마리 처치');
    const elites = sampleSpawns(r, 1000);
    assert.ok(elites.length > 30, `elites outside elite beats too (${elites.length} of 1000)`);
    r.probe.clear('enemies');
    const { player } = r.probe.read();
    r.probe.setSkills({ chainSpark: { level: 5 } });
    for (let index = 0; index < 3; index += 1) {
      const id = r.probe.spawnEnemy({ tier: 'small', x: player.x + 60 + index * 30, y: player.y, speed: 0, damage: 0 });
      r.probe.patchEnemy(id, { elite: 'haste', hp: 1, maxHp: 1 });
    }
    r.probe.spawnEnemy({ tier: 'small', x: player.x - 60, y: player.y, hp: 1, speed: 0, damage: 0 });
    r.probe.step(120);
    assert.equal(r.probe.hud().bonus.progress, 3, 'only the elites count');
  } finally {
    r.engine.dispose();
  }
});
