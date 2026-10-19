import assert from 'node:assert/strict';
import test from 'node:test';

const audioContexts = [];

class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};

  constructor() {
    audioContexts.push(this);
  }

  createOscillator() {
    let ended;
    return {
      type: 'sine',
      frequency: { value: 0 },
      connect() {},
      disconnect() {},
      start() {},
      stop() { ended?.(); },
      addEventListener(name, callback) {
        if (name === 'ended') ended = callback;
      },
    };
  }

  createGain() {
    return {
      gain: {
        value: 0,
        exponentialRampToValueAtTime() {},
      },
      connect() {},
      disconnect() {},
    };
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

globalThis.window = {
  devicePixelRatio: 1,
  addEventListener() {},
  removeEventListener() {},
};
globalThis.document = {
  addEventListener() {},
  removeEventListener() {},
};
globalThis.HTMLElement = class HTMLElement {};
globalThis.AudioContext = FakeAudioContext;
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });

const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const defaultMeta = () => ({
  gold: 120,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 1, stage: 1 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});

const defaultOptions = () => ({
  healthBars: 'elite',
  volume: 0,
  effects: 0.9,
  damageNumbers: true,
  screenShake: true,
  reducedFlash: false,
  paceMode: 'standard',
});

const createCanvas = () => {
  const context = new Proxy({
    measureText: () => ({ width: 0 }),
  }, {
    get(target, property) {
      if (property in target) return target[property];
      return () => {};
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });

  return {
    width: 0,
    height: 0,
    getContext: () => context,
    getBoundingClientRect: () => ({ width: 1440, height: 900, left: 0, top: 0 }),
    addEventListener() {},
    removeEventListener() {},
    setPointerCapture() {},
    releasePointerCapture() {},
    hasPointerCapture: () => false,
  };
};

// Tests reach the simulation only through public engine methods and the TEC-07 probe (docs/ARCHITECTURE.md rule 7).
function createEngine() {
  const events = [];
  let latestDraft = null;
  let latestSettlement = null;
  const engine = new ProbedGameEngine(createCanvas(), defaultMeta(), defaultOptions(), {
    onSnapshot() {},
    onDraft(draft) {
      latestDraft = draft;
      events.push('draft');
    },
    onRoundClear(settlement) {
      latestSettlement = settlement;
      events.push('roundClear');
    },
    onGameOver(settlement) {
      latestSettlement = settlement;
      events.push('gameOver');
    },
  });
  return {
    engine,
    probe: engine.probe,
    events,
    getDraft: () => latestDraft,
    getSettlement: () => latestSettlement,
  };
}

/** Empties the world so the test owns every entity: no director spawns, terrain, drops, shots, or skills. */
function isolateWorld(probe, loadout = {}) {
  probe.haltSpawns();
  probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots', 'effects');
  probe.setSkills(loadout);
  return probe.read();
}

/** Stationary zero-damage melee enemy; callers keep it off the player's body so only the tested system acts on it. */
const spawnDummy = (probe, x, y, hp) => probe.spawnEnemy({ x, y, hp, speed: 0, damage: 0, attackStyle: 'contact' });

const enemyById = (world, id) => world.enemies.find((enemy) => enemy.id === id);

function normalize(value) {
  return JSON.parse(JSON.stringify(value, (_key, item) => {
    if (typeof item === 'number') return Math.round(item * 1e9) / 1e9;
    return item;
  }));
}

function captureGameplay(engine) {
  const world = engine.probe.read();
  return normalize({
    timeLeft: world.timeLeft,
    elapsed: world.elapsed,
    spawnBudget: world.spawnBudget,
    player: world.player,
    enemies: world.enemies,
    projectiles: world.projectiles.map((projectile) => ({
      ...projectile,
      hitEnemyIds: [...projectile.hitEnemyIds].sort((a, b) => a - b),
    })),
    bossProjectiles: world.bossProjectiles,
    pickups: world.pickups,
    hazards: world.hazards,
    skillCooldowns: world.skillCooldowns,
    stageKills: world.stageKills,
    stageCoinsEarned: world.stageCoinsEarned,
  });
}

function runFrames(engine, frames, timeScale) {
  engine.startRun(1, 1, 0x12345678);
  engine.setTimeScale(timeScale);
  for (let frame = 1; frame <= frames; frame += 1) {
    engine.advanceFrame(1 / 60, true);
  }
  return captureGameplay(engine);
}

test('actual GameEngine reaches the same gameplay state at 1x and 2x with the same seed', () => {
  const first = createEngine().engine;
  const second = createEngine().engine;
  assert.deepEqual(runFrames(first, 120, 1), runFrames(second, 60, 2));
  first.dispose();
  second.dispose();
});

test('actual draft queue emits settlement only after the active draft resolves', () => {
  const { engine, probe, events, getDraft } = createEngine();
  engine.startRun(1, 1, 77);
  probe.openDraft('level', 'resume');
  probe.requestRoundClear();
  assert.deepEqual(events, ['draft']);
  const draft = getDraft();
  const resolution = engine.completeDraft(draft.cards[0], draft.id);
  assert.equal(resolution, 'roundClear');
  assert.deepEqual(events, ['draft', 'roundClear']);
  engine.dispose();
});

test('campaign normal stages only clear when the survival countdown reaches zero', () => {
  const { engine, probe, events, getSettlement } = createEngine();
  try {
    engine.startRun(1, 1, 78);
    probe.setStageKills(99_999);
    probe.setClock({ timeLeft: 1 });
    probe.resolveRound();
    assert.deepEqual(events, [], 'kill totals must never clear a survival stage');

    probe.setClock({ timeLeft: 0 });
    probe.resolveRound();
    assert.deepEqual(events, ['roundClear']);
    assert.equal(getSettlement().cleared, true);
  } finally {
    engine.dispose();
  }
});

test('campaign boss stages enter a single enrage phase when their countdown expires', () => {
  const { engine, probe, events } = createEngine();
  try {
    // The one-shot x4.5 enrage is the classic rule; remaster rules step it up (SYS-04, enrage.integration.test).
    engine.setRuleSet('classic');
    engine.startRun(1, 5, 79);
    const boss = probe.read().enemies.find((enemy) => enemy.isBoss && !enemy.legacyBoss);
    assert.ok(boss);
    const initialDamage = boss.damage;
    const initialSpeed = boss.speed;
    probe.setClock({ timeLeft: 0 });
    probe.resolveRound();
    assert.deepEqual(events, []);
    const enraged = probe.read();
    assert.equal(enraged.bossEnraged, true);
    const enragedBoss = enemyById(enraged, boss.id);
    assert.equal(enragedBoss.damage, initialDamage * 4.5);
    assert.equal(enragedBoss.speed, initialSpeed * 1.35);
    assert.ok(enraged.hazards.some((hazard) => hazard.kind === 'null' && hazard.life === 8));

    const enemyCount = enraged.enemies.length;
    probe.resolveRound();
    assert.equal(probe.read().enemies.length, enemyCount, 'enrage reinforcements must only spawn once');
  } finally {
    engine.dispose();
  }
});

test('simultaneous player and boss death emits only game over', () => {
  const { engine, probe, events } = createEngine();
  engine.startRun(1, 1, 99);
  const { player } = isolateWorld(probe);
  const bossId = probe.spawnBoss('field', { x: player.x, y: player.y });
  probe.patchEnemy(bossId, { hp: 0 });
  probe.setPlayer({ hp: 0 });
  probe.step(1);
  assert.deepEqual(events, ['gameOver']);
  assert.equal(probe.read().stageKills, 1);
  engine.dispose();
});

test('shock expires against the player without damaging enemies', () => {
  const { engine, probe } = createEngine();
  engine.startRun(1, 1, 101);
  const { player } = isolateWorld(probe);
  const startingHp = player.hp;
  // Inside the blast but off the player's body: a contact hit would grant invulnerability and block the shock.
  const enemyId = spawnDummy(probe, player.x + 40, player.y, 50);
  probe.addHazard({
    kind: 'shock',
    x: player.x,
    y: player.y,
    radius: 100,
    life: 0.01,
    maxLife: 0.52,
    damage: 20,
    slow: 1,
    triggered: false,
  });
  const shockId = probe.read().hazards.find((hazard) => hazard.kind === 'shock').id;
  probe.step(1);
  const world = probe.read();
  assert.ok(world.player.hp < startingHp);
  assert.equal(enemyById(world, enemyId).hp, 50);
  // K11: the burst is kept for its drawing by the shock's own id and size (looks only).
  assert.deepEqual(probe.effects().shocks.map((shock) => [shock.id, shock.radius]), [[shockId, 100]]);
  engine.dispose();
});

test('vortex hazards snapshot independent source profiles', () => {
  const { engine, probe } = createEngine();
  engine.startRun(1, 1, 202);
  const { player } = isolateWorld(probe, {
    voidMine: { level: 5, awakened: true },
    blackSun: { level: 5, awakened: true },
  });
  spawnDummy(probe, player.x + 50, player.y, 50);
  probe.cast('voidMine');
  probe.cast('blackSun');
  const { hazards } = probe.read();
  const mine = hazards.find((hazard) => hazard.sourceSkillId === 'voidMine');
  const sun = hazards.find((hazard) => hazard.sourceSkillId === 'blackSun');
  assert.ok(mine);
  assert.ok(sun);
  assert.notEqual(mine.pull, sun.pull);
  assert.notEqual(mine.collapseDamage, sun.collapseDamage);
  engine.dispose();
});

test('the engine never opens an audio context; it sends cues to the shared mixer until disposed (AUD-01)', () => {
  const { engine, probe } = createEngine();
  const played = [];
  let unlocks = 0;
  engine.setSound({ unlock() { unlocks += 1; }, play(cue, pan) { played.push({ cue, pan }); } });
  const opened = audioContexts.length;
  engine.startRun(1, 1, 303);
  probe.step(60 * 6);
  assert.equal(audioContexts.length, opened, 'no audio context of its own');
  assert.equal(unlocks, 1, 'a run start unlocks audio');
  assert.ok(played.some(({ cue }) => cue.startsWith('cast.') || cue.startsWith('hit.')), played.map(({ cue }) => cue).join(' '));
  assert.ok(played.every(({ pan }) => pan >= -1 && pan <= 1));
  engine.dispose();
  engine.dispose();
  const count = played.length;
  probe.step(60);
  assert.equal(played.length, count, 'a disposed engine sends nothing');
});

test('player aim tracks the nearest enemy without boss preference', () => {
  const { engine, probe } = createEngine();
  try {
    engine.startRun(1, 1, 80);
    const { player } = isolateWorld(probe);
    const fartherBossId = probe.spawnBoss('field', { x: player.x + 260, y: player.y });
    probe.patchEnemy(fartherBossId, { speed: 0 });
    const nearestId = spawnDummy(probe, player.x + 120, player.y, 1_000);
    probe.step(1);
    const { aim } = probe.read();
    assert.equal(aim.targetId, nearestId);
    assert.equal(aim.angle, 0);
  } finally {
    engine.dispose();
  }
});

test('HUD snapshots expose timed buffs and debuffs as structured effects', () => {
  const { engine, probe } = createEngine();
  try {
    engine.startRun(1, 1, 81);
    probe.setPlayer({ shield: 0.3, root: 0.6, slow: 0.58, silence: 0.4 });

    const effects = probe.hud().activeEffects;
    assert.deepEqual(effects.map((effect) => effect.id), ['shield', 'root', 'slow', 'silence']);
    assert.equal(effects.find((effect) => effect.id === 'shield').kind, 'buff');
    assert.equal(effects.find((effect) => effect.id === 'root').kind, 'debuff');
    assert.equal(effects.find((effect) => effect.id === 'slow').value, '-42%');
  } finally {
    engine.dispose();
  }
});

test('P4 awakened skills retain their visible delayed and returning contracts', () => {
  const { engine, probe } = createEngine();
  try {
    engine.startRun(5, 10, 404);
    isolateWorld(probe, { eclipseStep: { level: 4, awakened: true } });
    probe.setPlayer({ hp: 1 });
    probe.cast('eclipseStep');
    const afterimage = probe.read().hazards.find((hazard) => hazard.sourceSkillId === 'eclipseStep');
    assert.ok(afterimage, 'awakened Eclipse Step must leave a delayed afterimage strike');
    assert.equal(afterimage.kind, 'warning');
    assert.equal(afterimage.life, 0.24);
    assert.ok(afterimage.skillDamage > 0);

    const { player } = isolateWorld(probe, { fanKnives: { level: 5, awakened: true } });
    probe.setPlayer({ hp: player.stats.maxHp }); // the Eclipse Step check left the player at 1 hp
    const targetId = spawnDummy(probe, player.x + 180, player.y, 1_000);
    probe.cast('fanKnives');
    const outgoing = probe.read().projectiles.filter((projectile) => projectile.skillId === 'fanKnives');
    const volley = new Set(outgoing.map((knife) => knife.id));
    assert.ok(volley.size > 0);
    // Fly the volley out until it turns at half its life; it must have cut the target on the way out.
    let knives = [];
    let hitOnTheWayOut = false;
    for (let tick = 0; tick < 240; tick += 1) {
      probe.step(1);
      knives = probe.read().projectiles.filter((projectile) => volley.has(projectile.id));
      if (knives.some((knife) => knife.returning)) break;
      hitOnTheWayOut ||= knives.some((knife) => knife.hitEnemyIds.includes(targetId));
    }
    assert.ok(hitOnTheWayOut, 'the outgoing volley must hit the target before it turns');
    assert.ok(knives.length > 0);
    for (const knife of knives) {
      assert.equal(knife.returning, true);
      assert.ok(knife.vx < 0, 'returning knife must head back toward the player');
      assert.equal(knife.hitEnemyIds.length, 0);
    }
  } finally {
    engine.dispose();
  }
});

test('P4 Black Sun collapse applies max-health damage and a timed slow', () => {
  const { engine, probe } = createEngine();
  try {
    engine.startRun(4, 10, 505);
    const { player } = isolateWorld(probe, { blackSun: { level: 5, awakened: true } });
    const enemyId = spawnDummy(probe, player.x + 48, player.y, 1_000);
    // The collapse rule needs Black Sun equipped and awakened; silence keeps it from casting a vortex of its own.
    probe.setPlayer({ silence: 1 });
    probe.addHazard({
      kind: 'vortex',
      x: player.x + 48,
      y: player.y,
      radius: 120,
      life: 0.01,
      maxLife: 1,
      damage: 0,
      slow: 0.35,
      triggered: false,
      sourceSkillId: 'blackSun',
      pull: 0,
      skillDamage: 0,
      collapseDamage: 1,
    });
    probe.step(1);
    const enemy = enemyById(probe.read(), enemyId);
    assert.ok(enemy.hp <= 954, `expected 4.5% max-health collapse damage, got hp=${enemy.hp}`);
    assert.equal(enemy.slowMultiplier, 0.52);
    assert.equal(enemy.slowTimer, 3.5);
  } finally {
    engine.dispose();
  }
});

test('infinite mode rewards each random boss and respawns a different boss without a clock limit', () => {
  const { engine, probe, getDraft } = createEngine();
  try {
    engine.startInfiniteRun(0x1f1f2026, true);
    const start = probe.read();
    assert.equal(start.runMode, 'infinite');
    assert.equal(start.duration, 0);
    assert.equal(start.timeLeft, 0);
    const firstBoss = start.enemies.find((enemy) => enemy.isBoss);
    assert.ok(firstBoss);

    // Spawns stay on because the director owns the boss respawn. With no skills and god mode, nothing else can
    // die, level the player up, or end the run while the test waits.
    probe.setSkills({});
    probe.setGodMode();
    probe.patchEnemy(firstBoss.id, { hp: 0 });
    probe.step(1);
    const afterKill = engine.getDiagnostics();
    assert.equal(afterKill.bossKills, 1);
    // One 1/60 s step earns no survival points (elapsed * 10 rounds down to 0), so the score is the kill bounty.
    assert.ok(afterKill.score >= 2_500);
    const draft = getDraft();
    assert.equal(draft.reason, 'boss');
    assert.equal(draft.after, 'resume');
    assert.equal(engine.completeDraft(draft.cards[0], draft.id), 'resume');

    // Drop whatever the reward equipped and the boss's XP, so no level-up draft pauses the 2.4 s respawn wait.
    probe.setSkills({});
    probe.clear('pickups');
    let secondBoss;
    for (let tick = 0; tick < 4 * 60 && !secondBoss; tick += 1) {
      probe.step(1);
      secondBoss = probe.read().enemies.find((enemy) => enemy.isBoss);
    }
    assert.ok(secondBoss);
    assert.notEqual(secondBoss.boss.id, firstBoss.boss.id);
  } finally {
    engine.dispose();
  }
});

test('infinite normal waves keep ranged enemies sparse and fire a telegraphed projectile', () => {
  const { engine, probe } = createEngine();
  try {
    engine.startInfiniteRun(0x7072026, true);
    probe.clear('enemies');
    for (let index = 0; index < 114; index += 1) probe.spawnEnemy({ difficulty: 1.15, tier: 'rolled' });
    const ranged = probe.read().enemies.filter((enemy) => enemy.attackStyle === 'ranged');
    assert.ok(ranged.length > 0, 'seeded wave should contain a ranged enemy');
    assert.ok(ranged.length <= 2, `initial ranged cap must stay at two, received ${ranged.length}`);

    // A lone ranged enemy from the same spawner, in range with its cooldown spent.
    const { player } = isolateWorld(probe);
    const shooterId = probe.spawnEnemy({ x: player.x + 320, y: player.y, attackStyle: 'ranged' });
    probe.patchEnemy(shooterId, { rangedCooldown: 0 });
    probe.step(1);
    assert.ok(enemyById(probe.read(), shooterId).rangedTelegraph > 0);
    probe.step(30);
    assert.equal(probe.read().bossProjectiles.at(-1)?.kind, 'enemy');
  } finally {
    engine.dispose();
  }
});
