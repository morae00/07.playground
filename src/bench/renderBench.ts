// Render benchmark page (TEC-04): the real engine and renderer drawing a fixed stress scene, so the Canvas2D
// versus WebGL2 decision rests on measured frames. Built and driven by scripts/render-bench.mjs; the app never
// imports this file.
//
// Scenes: `stress` (backlog TEC-04) keeps 204 enemies of the four Ch1 roles, 240 hostile shots, 520 particles,
// and 160 damage numbers around the player, topped up every simulation step. `game` plays a real stage late in
// its clock (spawns, boss, hazards, and a mid-game build) in god mode. Query: scene, chapter, stage, progress,
// scale (render scale cap), sprites (on/off), warmup and seconds (measurement window).
import { ProbedGameEngine } from '../game/engine/probe';
import type { GameOptions, MetaState } from '../platform/save';
import { SpriteAtlas } from '../game/render/assets/spriteAtlas';
import { CHAPTER_PACKS, COMMON_PACK } from '../game/render/assets/slots';

export type RenderBenchResult = {
  config: { scene: string; scale: number; sprites: boolean; devicePixelRatio: number; backingStore: string; warmupSeconds: number; measureSeconds: number };
  frames: number;
  /** Intervals between animation frames: what the player sees. */
  /** slowFrames missed at least one 60 Hz vsync (> 17.5 ms); verySlowFrames missed two or more (> 34.2 ms). */
  intervalMs: { p50: number; p95: number; p99: number; max: number; slowFrames: number; verySlowFrames: number };
  /** Main-thread time inside one frame (simulation + render), and the render part alone. */
  frameWorkMs: { p50: number; p95: number; p99: number };
  renderWorkMs: { p50: number; p95: number; p99: number };
  longTasks: number;
  counts: { enemies: number; hostileShots: number; particles: number; damageNumbers: number; enemiesInView: number };
  /** Mean live counts over the measurement window. */
  meanCounts: { enemies: number; projectiles: number; hostileShots: number; particles: number; damageNumbers: number };
  spritesReady: boolean;
};

const TARGET = { enemies: 204, hostileShots: 240, particles: 520, damageNumbers: 160 };

const params = new URLSearchParams(window.location.search);
const scene = params.get('scene') === 'game' ? 'game' : 'stress';
const gameChapter = Number(params.get('chapter') ?? '5');
const gameStage = Number(params.get('stage') ?? '10');
const gameProgress = Number(params.get('progress') ?? '0.85');
/** Optional boss health share (for example 0.3 to watch phase 3 moves); the boss then takes no damage. */
const bossHealth = params.has('bossHp') ? Number(params.get('bossHp')) : null;
const renderScale = Number(params.get('scale') ?? '2');
const useSprites = params.get('sprites') !== 'off';
const warmupSeconds = Number(params.get('warmup') ?? '4');
const measureSeconds = Number(params.get('seconds') ?? '12');

// A seeded stream for scene layout, separate from the game's own random streams.
let seed = 0x7ec04;
const random = () => {
  seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
  return seed / 0x1_0000_0000;
};

function percentile(values: number[], ratio: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return Math.round(sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))] * 100) / 100;
}

const meta: MetaState = {
  gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 1, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
};
const options: GameOptions = {
  healthBars: 'elite', volume: 0, effects: 1, damageNumbers: true, screenShake: false, reducedFlash: false, paceMode: 'standard',
  autoPause: false, musicVolume: 0, sfxVolume: 0, uiScale: 1, reducedMotion: false, hitReaction: 1,
  assistDamage: 1, assistEnemySpeed: 1, assistSlowGame: false,
};

function setUpStressScene(probe: ProbedGameEngine['probe']) {
  const { player } = probe.read();
  // Enemies spread over the fixed 900-unit-tall view (BUG-09), all four roles, standing still so the scene holds.
  const tiers = ['small', 'small', 'small', 'medium', 'medium', 'large'] as const;
  for (let index = 0; index < TARGET.enemies; index += 1) {
    const angle = random() * Math.PI * 2;
    const reach = 110 + Math.sqrt(random()) * 560;
    const x = player.x + Math.cos(angle) * reach * 1.25;
    const y = player.y + Math.sin(angle) * reach * 0.72;
    probe.spawnEnemy({ tier: tiers[index % tiers.length], x, y, hp: 1e9, speed: 0, damage: 0, attackStyle: index % 5 === 0 ? 'ranged' : 'contact' });
  }

  probe.onStep(() => {
    const counts = probe.counts();
    for (let shot = counts.hostileShots; shot < TARGET.hostileShots; shot += 1) {
      const angle = random() * Math.PI * 2;
      const speed = 90 + random() * 140;
      probe.spawnHostileShot({
        x: player.x + (random() - 0.5) * 1_300,
        y: player.y + (random() - 0.5) * 820,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 6 + random() * 5,
        life: 1.5 + random() * 2,
      });
    }
    let missing = TARGET.particles - counts.particles;
    while (missing > 0) {
      const count = Math.min(40, missing);
      probe.burst(player.x + (random() - 0.5) * 1_200, player.y + (random() - 0.5) * 760, count);
      missing -= count;
    }
    for (let number = counts.damageNumbers; number < TARGET.damageNumbers; number += 1) {
      probe.damageNumber(player.x + (random() - 0.5) * 1_200, player.y + (random() - 0.5) * 760, Math.floor(20 + random() * 900), random() < 0.15);
    }
  });
}

async function run(): Promise<RenderBenchResult> {
  const canvas = document.querySelector('canvas');
  if (!canvas) throw new Error('bench page has no canvas');
  const atlas = new SpriteAtlas();
  // The chapter on screen has its pack loaded, as in the game (ART-07); the stress scene uses Ch1 bodies.
  const chapterPack = CHAPTER_PACKS[scene === 'game' ? gameChapter : 1];
  const spritesReady = useSprites ? (await Promise.all([atlas.load(COMMON_PACK), atlas.load(chapterPack)])).every(Boolean) : false;

  // Record every animation-frame timestamp the engine receives.
  const stamps: number[] = [];
  const nativeFrame = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => nativeFrame((time) => {
    stamps.push(time);
    callback(time);
  });

  const engine = new ProbedGameEngine(canvas, meta, options, { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet('remaster');
  engine.setRenderScale(renderScale);
  engine.setSprites(useSprites ? atlas : null);
  const { probe } = engine;
  if (scene === 'game') {
    engine.startRun(gameChapter, gameStage, 20_261);
    probe.setGodMode();
    probe.setSkills({ needleStorm: { level: 5 }, chainSpark: { level: 5 }, orbitScythes: { level: 5 }, frostLine: { level: 3 }, fanKnives: { level: 3 } });
    // No level-up drafts, and bosses take no damage, so the stage cannot end during the measurement.
    probe.setPlayer({ nextXp: 1e12, stats: { bossDamage: 0 } });
    const { duration } = probe.read();
    probe.setClock({ timeLeft: duration * (1 - gameProgress), elapsed: duration * gameProgress });
    if (bossHealth !== null) {
      const boss = probe.read().enemies.find((enemy) => enemy.isBoss);
      if (boss) probe.patchEnemy(boss.id, { hp: boss.maxHp * bossHealth });
    }
    // Walk a slow circle like a player kiting the swarm, which also steps out of silence and root zones.
    probe.onStep((tick) => {
      const angle = (tick / 420) * Math.PI * 2;
      engine.dispatch({ type: 'input/analog', x: Math.cos(angle), y: Math.sin(angle) });
    });
  } else {
    engine.startRun(1, 4, 20_261);
    probe.haltSpawns();
    probe.setGodMode();
    probe.clear('enemies', 'hazards', 'pickups', 'projectiles', 'hostileShots', 'effects');
    probe.setClock({ timeLeft: 9_999 });
    setUpStressScene(probe);
  }

  // Main-thread time per frame, and the render part alone.
  const frameWork: number[] = [];
  const renderWork: number[] = [];
  let measuring = false;
  const hooks = engine as unknown as { render: (alpha: number) => void };
  const render = hooks.render.bind(engine);
  hooks.render = (alpha: number) => {
    const started = performance.now();
    render(alpha);
    renderWork.push(performance.now() - started);
  };
  const sums = { enemies: 0, projectiles: 0, hostileShots: 0, particles: 0, damageNumbers: 0, samples: 0 };
  const advance = engine.advanceFrame.bind(engine);
  engine.advanceFrame = (frameDt: number, renderFrame?: boolean) => {
    const started = performance.now();
    advance(frameDt, renderFrame);
    frameWork.push(performance.now() - started);
    if (!measuring) return;
    const live = probe.counts();
    sums.enemies += live.enemies;
    sums.projectiles += live.projectiles;
    sums.hostileShots += live.hostileShots;
    sums.particles += live.particles;
    sums.damageNumbers += live.damageNumbers;
    sums.samples += 1;
  };

  let longTasks = 0;
  try {
    new PerformanceObserver((list) => {
      if (measuring) longTasks += list.getEntries().length;
    }).observe({ type: 'longtask', buffered: false });
  } catch {
    // Long-task timing is optional.
  }

  await new Promise((resolve) => setTimeout(resolve, warmupSeconds * 1_000));
  stamps.length = 0;
  frameWork.length = 0;
  renderWork.length = 0;
  measuring = true;
  await new Promise((resolve) => setTimeout(resolve, measureSeconds * 1_000));
  measuring = false;

  const intervals = stamps.slice(1).map((time, index) => time - stamps[index]);
  const counts = probe.counts();
  // Screen to world: x = (screenX - offsetX) / zoom + camera.x, y = screenY / zoom + camera.y.
  const { view } = probe.renderWorld();
  const world = probe.read();
  const left = world.camera.x - view.frame.offsetX / view.frame.zoom;
  const right = world.camera.x + (view.width - view.frame.offsetX) / view.frame.zoom;
  const top = world.camera.y;
  const bottom = world.camera.y + view.height / view.frame.zoom;
  const enemiesInView = world.enemies.filter((enemy) => enemy.x > left && enemy.x < right && enemy.y > top && enemy.y < bottom).length;
  engine.dispose();
  return {
    config: {
      scene,
      scale: renderScale,
      sprites: useSprites,
      devicePixelRatio: window.devicePixelRatio,
      backingStore: `${canvas.width}x${canvas.height}`,
      warmupSeconds,
      measureSeconds,
    },
    frames: intervals.length,
    intervalMs: {
      p50: percentile(intervals, 0.5),
      p95: percentile(intervals, 0.95),
      p99: percentile(intervals, 0.99),
      max: Math.round(Math.max(0, ...intervals) * 100) / 100,
      slowFrames: intervals.filter((interval) => interval > 17.5).length,
      verySlowFrames: intervals.filter((interval) => interval > 34.2).length,
    },
    frameWorkMs: { p50: percentile(frameWork, 0.5), p95: percentile(frameWork, 0.95), p99: percentile(frameWork, 0.99) },
    renderWorkMs: { p50: percentile(renderWork, 0.5), p95: percentile(renderWork, 0.95), p99: percentile(renderWork, 0.99) },
    longTasks,
    counts: { enemies: counts.enemies, hostileShots: counts.hostileShots, particles: counts.particles, damageNumbers: counts.damageNumbers, enemiesInView },
    meanCounts: {
      enemies: Math.round(sums.enemies / Math.max(1, sums.samples)),
      projectiles: Math.round(sums.projectiles / Math.max(1, sums.samples)),
      hostileShots: Math.round(sums.hostileShots / Math.max(1, sums.samples)),
      particles: Math.round(sums.particles / Math.max(1, sums.samples)),
      damageNumbers: Math.round(sums.damageNumbers / Math.max(1, sums.samples)),
    },
    spritesReady,
  };
}

const target = window as typeof window & { __benchResult?: RenderBenchResult; __benchError?: string };
run().then(
  (result) => {
    target.__benchResult = result;
  },
  (error: unknown) => {
    target.__benchError = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
  },
);
