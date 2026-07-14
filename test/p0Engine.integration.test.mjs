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

const { GameEngine } = await import('/tmp/blackline-survivor-p0/App.mjs');

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

function createEngine() {
  const events = [];
  let latestDraft = null;
  const engine = new GameEngine(createCanvas(), defaultMeta(), defaultOptions(), {
    onSnapshot() {},
    onDraft(draft) {
      latestDraft = draft;
      events.push('draft');
    },
    onRoundClear() {
      events.push('roundClear');
    },
    onGameOver() {
      events.push('gameOver');
    },
  });
  return { engine, events, getDraft: () => latestDraft };
}

function normalize(value) {
  return JSON.parse(JSON.stringify(value, (_key, item) => {
    if (item instanceof Set) return [...item].sort((a, b) => a - b);
    if (typeof item === 'number') return Math.round(item * 1e9) / 1e9;
    return item;
  }));
}

function captureGameplay(engine) {
  return normalize({
    timeLeft: engine.timeLeft,
    elapsed: engine.elapsed,
    spawnBudget: engine.spawnBudget,
    player: engine.player,
    enemies: engine.enemies,
    projectiles: engine.projectiles,
    bossProjectiles: engine.bossProjectiles,
    pickups: engine.pickups,
    hazards: engine.hazards,
    skillCooldowns: engine.skillCooldowns,
    stageKills: engine.stageKills,
    stageCoinsEarned: engine.stageCoinsEarned,
  });
}

function runFrames(engine, frames, timeScale) {
  engine.startRun(1, 1, 0x12345678);
  engine.setTimeScale(timeScale);
  for (let frame = 1; frame <= frames; frame += 1) {
    engine.tick((frame * 1000) / 60);
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
  const { engine, events, getDraft } = createEngine();
  engine.startRun(1, 1, 77);
  engine.openDraft('level', 'resume');
  engine.requestRoundClear();
  assert.deepEqual(events, ['draft']);
  const draft = getDraft();
  const resolution = engine.completeDraft(draft.cards[0], draft.id);
  assert.equal(resolution, 'roundClear');
  assert.deepEqual(events, ['draft', 'roundClear']);
  engine.dispose();
});

test('simultaneous player and boss death emits only game over', () => {
  const { engine, events } = createEngine();
  engine.startRun(1, 1, 99);
  engine.player.hp = 0;
  engine.enemies = [{
    id: 900,
    x: engine.player.x,
    y: engine.player.y,
    vx: 0,
    vy: 0,
    radius: 30,
    hp: 0,
    maxHp: 100,
    speed: 0,
    damage: 0,
    xp: 10,
    coin: 1,
    tier: 'boss',
    variant: 0,
    isBoss: true,
    contactTimer: 0,
    hitFlash: 0,
    stun: 0,
    root: 0,
    patternTimer: 0,
    patternPhase: 'idle',
    patternX: 0,
    patternY: 0,
    damageCooldowns: {},
  }];
  engine.update(1 / 60);
  assert.deepEqual(events, ['gameOver']);
  assert.equal(engine.stageKills, 1);
  engine.dispose();
});

test('shock expires against the player without damaging enemies', () => {
  const { engine } = createEngine();
  engine.startRun(1, 1, 101);
  const startingHp = engine.player.hp;
  engine.enemies = [{ id: 1, x: engine.player.x, y: engine.player.y, radius: 10, hp: 50 }];
  engine.hazards = [{
    id: 50,
    kind: 'shock',
    x: engine.player.x,
    y: engine.player.y,
    radius: 100,
    life: 0.01,
    maxLife: 0.52,
    damage: 20,
    slow: 1,
    triggered: false,
  }];
  engine.updateHazards(0.02);
  assert.ok(engine.player.hp < startingHp);
  assert.equal(engine.enemies[0].hp, 50);
  engine.dispose();
});

test('vortex hazards snapshot independent source profiles', () => {
  const { engine } = createEngine();
  engine.startRun(1, 1, 202);
  engine.hazards = [];
  engine.enemies = [{ id: 3, x: engine.player.x + 50, y: engine.player.y, radius: 10, hp: 50, isBoss: false }];
  engine.updateVoidMine({ level: 5, awakened: true });
  engine.updateBlackSun({ level: 5, awakened: true });
  const mine = engine.hazards.find((hazard) => hazard.sourceSkillId === 'voidMine');
  const sun = engine.hazards.find((hazard) => hazard.sourceSkillId === 'blackSun');
  assert.ok(mine);
  assert.ok(sun);
  assert.notEqual(mine.pull, sun.pull);
  assert.notEqual(mine.collapseDamage, sun.collapseDamage);
  engine.dispose();
});

test('dispose closes the run audio context exactly once', async () => {
  const { engine } = createEngine();
  engine.startRun(1, 1, 303);
  const audio = audioContexts.at(-1);
  engine.dispose();
  engine.dispose();
  await Promise.resolve();
  assert.equal(audio.state, 'closed');
});

function combatEnemy(id, x, y, overrides = {}) {
  return {
    id,
    x,
    y,
    prevX: x,
    prevY: y,
    vx: 0,
    vy: 0,
    radius: 14,
    hp: 1_000,
    maxHp: 1_000,
    speed: 0,
    damage: 0,
    xp: 0,
    coin: 0,
    tier: 'small',
    variant: 0,
    isBoss: false,
    contactTimer: 0,
    hitFlash: 0,
    stun: 0,
    root: 0,
    slowMultiplier: 1,
    slowTimer: 0,
    patternTimer: 0,
    patternPhase: 'idle',
    patternX: 0,
    patternY: 0,
    damageCooldowns: {},
    bossPhase: 1,
    bossPhaseFlash: 0,
    ...overrides,
  };
}

test('P4 awakened skills retain their visible delayed and returning contracts', () => {
  const { engine } = createEngine();
  try {
    engine.startRun(5, 10, 404);
    engine.player.hp = 1;
    engine.updateEclipseStep({ level: 4, awakened: true });
    const afterimage = engine.hazards.find((hazard) => hazard.sourceSkillId === 'eclipseStep');
    assert.ok(afterimage, 'awakened Eclipse Step must leave a delayed afterimage strike');
    assert.equal(afterimage.kind, 'warning');
    assert.equal(afterimage.life, 0.24);
    assert.ok(afterimage.skillDamage > 0);

    engine.skills = { fanKnives: { level: 5, awakened: true } };
    engine.projectiles = [{
      id: 901,
      x: engine.player.x + 180,
      y: engine.player.y,
      prevX: engine.player.x + 180,
      prevY: engine.player.y,
      vx: 680,
      vy: 0,
      radius: 5,
      damage: 12,
      life: 0.5,
      maxLife: 1,
      returning: false,
      pierce: 0,
      knockback: 0,
      skillId: 'fanKnives',
      blockedBySolid: false,
      hitEnemyIds: new Set([1]),
    }];
    engine.updateProjectiles(1 / 60);
    assert.equal(engine.projectiles[0].returning, true);
    assert.ok(engine.projectiles[0].vx < 0, 'returning knife must head back toward the player');
    assert.equal(engine.projectiles[0].hitEnemyIds.size, 0);
  } finally {
    engine.dispose();
  }
});

test('P4 Black Sun collapse applies max-health damage and a timed slow', () => {
  const { engine } = createEngine();
  try {
    engine.startRun(4, 10, 505);
    const enemy = combatEnemy(902, engine.player.x + 48, engine.player.y);
    engine.enemies = [enemy];
    engine.enemyIndex.clear();
    engine.enemyIndex.insert(enemy);
    engine.skills = { blackSun: { level: 5, awakened: true } };
    engine.hazards = [{
      id: 903,
      kind: 'vortex',
      x: enemy.x,
      y: enemy.y,
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
    }];
    engine.updateHazards(0.02);
    assert.ok(enemy.hp <= 954, `expected 4.5% max-health collapse damage, got hp=${enemy.hp}`);
    assert.equal(enemy.slowMultiplier, 0.52);
    assert.equal(enemy.slowTimer, 3.5);
  } finally {
    engine.dispose();
  }
});
