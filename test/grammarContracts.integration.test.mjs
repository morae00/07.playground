import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform } from '../scripts/lib/headless-engine.mjs';

// Grammar contract (TEC-11): the real engine must keep the preserved game grammar. A failure here means a
// change altered core rules; update the preserved-grammar list and RULES_VERSION together with the code.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { GameEngine } = await import('/tmp/blackline-survivor-p0/App.mjs');

const meta = () => ({
  gold: 120,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 1, stage: 1 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});
const options = () => ({ healthBars: 'elite', volume: 0, effects: 0.9, damageNumbers: true, screenShake: false, reducedFlash: false, paceMode: 'standard' });

function createEngine(onDraft = () => {}) {
  return new GameEngine(createHeadlessCanvas(1440, 900), meta(), options(), {
    onSnapshot() {},
    onDraft,
    onRoundClear() {},
    onGameOver() {},
  });
}

test('G7: Stage 5 is a mid boss, Stage 10 a chapter boss, the rest survival stages', () => {
  const engine = createEngine();
  try {
    const kinds = [];
    for (let stage = 1; stage <= 10; stage += 1) {
      engine.startRun(1, stage, 1000 + stage);
      kinds.push(engine.kind);
    }
    assert.deepEqual(kinds, ['normal', 'normal', 'normal', 'normal', 'midBoss', 'normal', 'normal', 'normal', 'normal', 'finalBoss']);
  } finally {
    engine.dispose();
  }
});

test('G4: level-up drafts show three cards and boss rewards four', () => {
  const drafts = [];
  const engine = createEngine((draft) => drafts.push(draft));
  try {
    engine.startRun(1, 1, 42);
    engine.openDraft('level', 'resume');
    assert.equal(drafts.at(-1).cards.length, 3);
    engine.completeDraft(drafts.at(-1).cards[0], drafts.at(-1).id);
    engine.openDraft('boss', 'resume');
    assert.equal(drafts.at(-1).cards.length, 4);
  } finally {
    engine.dispose();
  }
});

test('G9/V4: spawned enemies keep their tier radii and the 58/30/12 tier mix', () => {
  const engine = createEngine();
  try {
    engine.startRun(2, 3, 7);
    const counts = { small: 0, medium: 0, large: 0 };
    const radii = { small: new Set(), medium: new Set(), large: new Set() };
    for (let index = 0; index < 6000; index += 1) {
      engine.enemies = [];
      engine.spawnEnemy(1);
      const enemy = engine.enemies[0];
      counts[enemy.tier] += 1;
      radii[enemy.tier].add(enemy.radius);
    }
    assert.deepEqual([...radii.small], [12]);
    assert.deepEqual([...radii.medium], [19]);
    assert.deepEqual([...radii.large], [28]);
    assert.ok(Math.abs(counts.small / 6000 - 0.58) < 0.02, `small share ${counts.small / 6000}`);
    assert.ok(Math.abs(counts.medium / 6000 - 0.30) < 0.02, `medium share ${counts.medium / 6000}`);
    assert.ok(Math.abs(counts.large / 6000 - 0.12) < 0.02, `large share ${counts.large / 6000}`);
  } finally {
    engine.dispose();
  }
});

test('G8/G10: main bosses use radius 54, field bosses radius 38 and appear at the 36% mark', () => {
  const engine = createEngine();
  try {
    engine.startRun(1, 5, 11);
    assert.equal(engine.enemies.find((enemy) => enemy.isBoss).radius, 54);

    engine.startRun(1, 2, 12);
    engine.enemies = [];
    engine.timeLeft = engine.duration * (1 - 0.35);
    engine.spawnEnemies(1 / 60);
    assert.equal(engine.enemies.some((enemy) => enemy.isBoss), false, 'no field boss before 36%');
    engine.timeLeft = engine.duration * (1 - 0.361);
    engine.spawnEnemies(1 / 60);
    const fieldBoss = engine.enemies.find((enemy) => enemy.isBoss);
    assert.ok(fieldBoss, 'a field boss appears once progress passes 36%');
    assert.equal(fieldBoss.radius, 38);
    assert.equal(fieldBoss.boss.role, 'field');
  } finally {
    engine.dispose();
  }
});

test('G14: the same seed gives the same run under both rule sets when replayed', () => {
  for (const ruleSet of ['classic', 'remaster']) {
    const snapshots = [];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const engine = createEngine();
      try {
        engine.setRuleSet(ruleSet);
        engine.startRun(1, 1, 0x5eed);
        for (let frame = 0; frame < 600; frame += 1) engine.advanceFrame(1 / 60, false);
        snapshots.push(JSON.stringify({ player: engine.player, enemies: engine.enemies.map((enemy) => [enemy.x, enemy.y, enemy.hp]) }));
      } finally {
        engine.dispose();
      }
    }
    assert.equal(snapshots[0], snapshots[1], `${ruleSet} rules must replay identically`);
  }
});

function runSteps({ ruleSet, options: overrides = {}, viewport = [1440, 900], hz = 60, chapter = 1, stage = 5, seed = 99, steps = 1800 }) {
  let pendingDraft = null;
  let executed = 0;
  let captured = null;
  const engine = new GameEngine(createHeadlessCanvas(viewport[0], viewport[1]), meta(), { ...options(), screenShake: true, ...overrides }, {
    onSnapshot() {},
    onDraft(draft) { pendingDraft = draft; },
    onRoundClear() {},
    onGameOver() {},
  });
  const directions = ['d', 's', 'a', 'w'];
  const update = engine.update.bind(engine);
  engine.update = (dt) => {
    engine.keys.clear();
    engine.keys.add(directions[Math.floor(executed / 180) % directions.length]);
    update(dt);
    executed += 1;
    if (executed === steps) captured = JSON.stringify({ player: engine.player, enemies: engine.enemies.map((enemy) => [enemy.tier, enemy.x, enemy.y, enemy.hp]), kills: engine.stageKills });
  };
  try {
    engine.setRuleSet(ruleSet);
    engine.startRun(chapter, stage, seed);
    for (let frame = 0; frame < steps * 4 && !captured && !engine.stageFinished; frame += 1) {
      if (pendingDraft) {
        const draft = pendingDraft;
        pendingDraft = null;
        engine.completeDraft(draft.cards[0], draft.id);
      }
      engine.advanceFrame(1 / hz, true);
    }
    return captured ?? `ended:${executed}:${JSON.stringify(engine.player)}`;
  } finally {
    engine.dispose();
  }
}

test('G14/BUG-08: cosmetic options and frame rate never change a seeded run under remaster rules', () => {
  const reference = runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400 });
  assert.equal(runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400, options: { damageNumbers: false } }), reference, 'damage numbers');
  assert.equal(runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400, options: { effects: 0.3 } }), reference, 'effects density');
  assert.equal(runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400, options: { screenShake: false, reducedFlash: true } }), reference, 'shake and reduced motion');
  assert.equal(runSteps({ ruleSet: 'remaster', stage: 1, seed: 17, steps: 2400, hz: 30 }), reference, '30 Hz frames');
});

test('BUG-08: the gameplay id stream ignores damage numbers and effect density (classic rules still leak)', () => {
  const idsAfter = (ruleSet, overrides) => {
    const engine = new GameEngine(createHeadlessCanvas(1440, 900), meta(), { ...options(), ...overrides }, {
      onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {},
    });
    try {
      engine.setRuleSet(ruleSet);
      engine.startRun(2, 4, 31337);
      engine.cheatGodMode = true;
      for (let frame = 0; frame < 900; frame += 1) {
        if (engine.activeDraftId !== null) engine.completeDraft({ kind: 'bonus', bonus: 'heal', rarity: 'common', title: '', body: '', levelLine: '' }, engine.activeDraftId);
        engine.advanceFrame(1 / 60, false);
      }
      return engine.idSeed;
    } finally {
      engine.dispose();
    }
  };
  const remaster = idsAfter('remaster', { damageNumbers: true, effects: 1 });
  assert.equal(idsAfter('remaster', { damageNumbers: false, effects: 1 }), remaster);
  assert.equal(idsAfter('remaster', { damageNumbers: true, effects: 0.25 }), remaster);
  assert.notEqual(idsAfter('classic', { damageNumbers: false, effects: 1 }), idsAfter('classic', { damageNumbers: true, effects: 1 }), 'classic rules keep the 0.1.0 coupling for A/B runs');
});
