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
