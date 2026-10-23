import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, localeTable, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Elites (SYS-10, eliteAffixes rule; remaster on, classic off): an ordinary enemy with one affix (haste, split,
// shield, or drain), 2.5 times the health, an elite purple outline, its affix's mark, and a coin chest when it falls.
// Elite beats (SYS-03) promote some of their spawns; the elite hunt objective (CON-03) asks for elite kills.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, HORDE, installStrings, tx } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');
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
  // The elites' own numbers, without the horde's reward scaling (SYS-13).
  if (rules === 'remaster') engine.probe.patchRules({ horde: false });
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

/** BUG-18: an empty arena on a remaster stage (the horde on), the player still and untouchable, nothing equipped. */
function splitArena() {
  const events = [];
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), {
    onSnapshot() {},
    onDraft(draft) { engine.completeDraft(draft.cards[0], draft.id); },
    onRoundClear() {},
    onGameOver() {},
  });
  engine.setRuleSet('remaster');
  engine.subscribe((event) => events.push(event));
  engine.startRun(2, 3, 777);
  const { probe } = engine;
  probe.setGodMode();
  probe.haltSpawns();
  probe.clear('enemies', 'obstacles', 'hazards', 'projectiles');
  probe.setSkills({});
  probe.setPlayer({ x: 2100, y: 1500, nextXp: 1e12 });
  /** Fells `id` as a split elite and returns its two children. */
  const split = (id) => {
    const before = new Set(probe.read().enemies.map((enemy) => enemy.id));
    probe.patchEnemy(id, { elite: 'split', eliteShield: undefined, hp: 0 });
    probe.step(1);
    const children = probe.read().enemies.filter((enemy) => !before.has(enemy.id));
    assert.equal(children.length, 2);
    return children;
  };
  return { engine, probe, events, split };
}

test('BUG-18: split children of a charger felled mid-dash walk instead of dashing for good', () => {
  const { engine, probe, split } = splitArena();
  try {
    const id = probe.spawnEnemy({ tier: 'medium', x: 2300, y: 1500, hp: 1e6 });
    probe.patchEnemy(id, { dashCooldown: 0 });
    const phase = () => probe.read().enemies.find((enemy) => enemy.id === id)?.patternPhase;
    for (let tick = 0; tick < 120 && phase() !== 'dash'; tick += 1) probe.step(1);
    assert.equal(phase(), 'dash', 'the parent is felled mid-dash');
    const children = split(id);
    assert.deepEqual(children.map((child) => [child.tier, child.patternPhase, child.patternTimer]), [['small', 'idle', 0], ['small', 'idle', 0]]);
    probe.setPlayer({ x: 3800, y: 2800 });
    probe.step(30);
    for (const child of children) {
      const now = probe.read().enemies.find((enemy) => enemy.id === child.id);
      const travel = Math.hypot(now.x - child.x, now.y - child.y);
      assert.equal(now.patternPhase, 'idle');
      assert.ok(travel < child.speed * 0.5 * 1.2, `travelled ${travel.toFixed(0)} in 0.5 s at speed ${child.speed.toFixed(0)}`);
    }
  } finally {
    engine.dispose();
  }
});

test('BUG-18: split children of a warden carry no frozen shield', () => {
  const { engine, probe, events, split } = splitArena();
  try {
    const id = probe.spawnEnemy({ tier: 'large', x: 2400, y: 1500, hp: 1000 });
    probe.step(5);
    assert.ok(probe.read().enemies.find((enemy) => enemy.id === id).shieldAngle !== undefined, 'the warden raised its shield');
    const children = split(id);
    assert.ok(children.every((child) => child.tier === 'medium' && child.shieldAngle === undefined));
    // Struck from the side the parent's shield faced: nothing is blocked.
    for (const child of children) probe.patchEnemy(child.id, { hp: 1e6, maxHp: 1e6 });
    probe.setPlayer({ x: children[0].x - 80, y: children[0].y });
    probe.setSkills({ chainSpark: { level: 5 } });
    probe.cast('chainSpark');
    probe.step(1);
    assert.ok(probe.read().enemies.some((enemy) => children.some((child) => child.id === enemy.id) && enemy.hp < 1e6), 'the chain struck a child');
    assert.equal(events.filter((event) => event.type === 'enemy/blocked').length, 0);
  } finally {
    engine.dispose();
  }
});

test('BUG-18: felling a planted fuse bomber that is a split elite defuses it; its children never go off', () => {
  const { engine, probe, events, split } = splitArena();
  try {
    const id = probe.spawnEnemy({ tier: 'small', x: 2120, y: 1500, hp: 1e6, bomber: 'fuse' });
    probe.step(2);
    assert.ok(probe.read().enemies.find((enemy) => enemy.id === id).fuseAt !== undefined, 'planted on touch');
    const children = split(id);
    assert.ok(children.every((child) => child.bomber === undefined && child.fuseAt === undefined && child.blastDamage === undefined));
    assert.deepEqual(events.filter((event) => event.type === 'enemy/defused').map((event) => event.id), [id]);
    // Well past the parent's fuse, with the children beside the player.
    probe.step(90);
    assert.equal(events.filter((event) => event.type === 'enemy/armed').length, 1, 'only the parent was armed');
    assert.equal(events.filter((event) => event.type === 'enemy/blast').length, 0, 'nothing went off');
  } finally {
    engine.dispose();
  }
});

test('BUG-18: split children are paid like spawns, through the horde\'s share', () => {
  const { engine, probe, split } = splitArena();
  try {
    const scale = probe.director()?.rewardScale ?? 1;
    const id = probe.spawnEnemy({ tier: 'large', x: 2400, y: 1500, hp: 1000 });
    // A medium enemy's XP and coins (TIER_STATS) at this beat's reward scale, times the horde's share.
    const xp = Math.round(10 * scale) * HORDE.xp;
    const coin = Math.round(3 * scale) * HORDE.coin;
    for (const child of split(id)) {
      assert.ok(child.xp >= Math.floor(xp) && child.xp <= Math.ceil(xp), `XP ${child.xp}, the horde pays ${xp}`);
      assert.ok(child.coin >= Math.floor(coin) && child.coin <= Math.ceil(coin), `coins ${child.coin}, the horde pays ${coin}`);
    }
  } finally {
    engine.dispose();
  }
});
