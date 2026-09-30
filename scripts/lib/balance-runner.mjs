import { createHash } from 'node:crypto';
import { createHeadlessCanvas, holdDirection, installHeadlessPlatform, maxMeta, standardOptions } from './headless-engine.mjs';

export const DEFAULT_STAGE_ADDRESSES = Object.freeze(
  Array.from({ length: 5 }, (_, index) => index + 1)
    .flatMap((chapter) => Array.from({ length: 10 }, (_, index) => ({ chapter, stage: index + 1 }))),
);
export const DEFAULT_SEEDS = Object.freeze([17, 1_337, 65_537]);

function round(value, digits = 3) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function percentile(values, ratio) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor((sorted.length - 1) * ratio)];
}

function scenarioSeed(chapter, stage, seed) {
  return ((((chapter * 100_000) + (stage * 1_000) + seed) >>> 0) || 1);
}

function updateMovement(engine, frame) {
  const directions = ['d', 's', 'a', 'w'];
  holdDirection(engine, directions[Math.floor(frame / 180) % directions.length]);
}

function assertFiniteScenario(result) {
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error(`Non-finite balance metric ${key} for Ch${result.chapter} St${result.stage} seed ${result.seed}`);
    }
  }
}

export async function runBalanceBatch({
  bundlePath = '/tmp/blackline-survivor-p0/testing.mjs',
  frames = 1_200,
  seeds = DEFAULT_SEEDS,
  stages = DEFAULT_STAGE_ADDRESSES,
} = {}) {
  if (!Number.isInteger(frames) || frames <= 0) throw new RangeError('frames must be a positive integer');
  if (!Array.isArray(seeds) || seeds.length === 0 || seeds.some((seed) => !Number.isInteger(seed))) {
    throw new TypeError('seeds must be a non-empty integer array');
  }
  installHeadlessPlatform();
  const { ProbedGameEngine } = await import(bundlePath);
  const scenarios = [];

  for (const address of stages) {
    for (const baseSeed of seeds) {
      let engine;
      let cleared = false;
      let gameOver = false;
      let latestSnapshot;
      engine = new ProbedGameEngine(createHeadlessCanvas(), maxMeta(), standardOptions(), {
        onSnapshot(snapshot) { latestSnapshot = snapshot; },
        onDraft(draft) {
          const offer = draft.cards[0];
          if (!offer) throw new Error(`Draft ${draft.id} contained no offer`);
          engine.completeDraft(offer, draft.id);
        },
        onRoundClear() { cleared = true; },
        onGameOver() { gameOver = true; },
      });

      const seed = scenarioSeed(address.chapter, address.stage, baseSeed);
      engine.startRun(address.chapter, address.stage, seed);
      engine.probe.setPlayer({ stats: { maxHp: 1_000_000_000, hpRegen: 0 }, hp: 1_000_000_000, nextXp: 1_000_000_000 });
      const initialHp = engine.probe.read().player.hp;
      const highWater = { enemies: 0, projectiles: 0, bossProjectiles: 0, pickups: 0 };

      for (let frame = 0; frame < frames && !cleared && !gameOver; frame += 1) {
        updateMovement(engine, frame);
        engine.advanceFrame(1 / 60, false);
        const diagnostics = engine.getDiagnostics();
        for (const key of Object.keys(highWater)) highWater[key] = Math.max(highWater[key], diagnostics[key]);
      }

      const world = engine.probe.read();
      const mainBoss = world.enemies.find((enemy) => enemy.isBoss && !enemy.legacyBoss);
      const result = {
        chapter: address.chapter,
        stage: address.stage,
        kind: latestSnapshot?.stageKind ?? 'unknown',
        seed,
        elapsed: round(engine.getDiagnostics().elapsed),
        kills: world.player.kills,
        coins: world.player.coins,
        damageTaken: round(initialHp - world.player.hp),
        bossHpRatio: mainBoss ? round(mainBoss.hp / mainBoss.maxHp, 5) : null,
        highWaterEnemies: highWater.enemies,
        highWaterProjectiles: highWater.projectiles,
        highWaterBossProjectiles: highWater.bossProjectiles,
        highWaterPickups: highWater.pickups,
        cleared,
        gameOver,
      };
      assertFiniteScenario(result);
      scenarios.push(result);
      engine.dispose();
    }
  }

  const summary = {
    scenarioCount: scenarios.length,
    stageCount: stages.length,
    seedCount: seeds.length,
    framesPerScenario: frames,
    simulatedSecondsPerScenario: round(frames / 60),
    kills: {
      p10: percentile(scenarios.map((item) => item.kills), 0.1),
      p50: percentile(scenarios.map((item) => item.kills), 0.5),
      p90: percentile(scenarios.map((item) => item.kills), 0.9),
    },
    damageTaken: {
      p50: round(percentile(scenarios.map((item) => item.damageTaken), 0.5)),
      p90: round(percentile(scenarios.map((item) => item.damageTaken), 0.9)),
    },
    highWater: {
      enemies: Math.max(...scenarios.map((item) => item.highWaterEnemies)),
      projectiles: Math.max(...scenarios.map((item) => item.highWaterProjectiles)),
      bossProjectiles: Math.max(...scenarios.map((item) => item.highWaterBossProjectiles)),
      pickups: Math.max(...scenarios.map((item) => item.highWaterPickups)),
    },
    gameOvers: scenarios.filter((item) => item.gameOver).length,
  };
  const fingerprint = createHash('sha256').update(JSON.stringify({ summary, scenarios })).digest('hex').slice(0, 16);
  return { version: 1, fingerprint, summary, scenarios };
}
