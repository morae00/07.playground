// World renderer (TEC-02): draws one frame from a read-only RenderWorld. It never sees the engine, so drawing
// cannot change outcomes and a test can render any hand-built world.
import type {
  BeamEffect,
  BossProjectile,
  ChainEffect,
  Corpse,
  DamageNumber,
  Entity,
  Hazard,
  ImpactRing,
  LaneTelegraph,
  Obstacle,
  Particle,
  Pickup,
  Projectile,
  SkillId,
  SkillState,
} from '../engine/worldTypes.ts';
import type { GameOptions } from '../../platform/save.ts';
import { HIT_RADIUS } from '../grammar.ts';
import { SKILL_NUMBERS, scaleAt } from '../skillNumbers.ts';
import type { ViewFrame } from '../viewPolicy.ts';
import { motionPolicy } from '../visualContracts.ts';
import { clamp, distance } from '../worldMath.ts';
import { CORPSE_FALL_SECONDS, DEATH_MOMENT_SECONDS, HEARTBEAT_SECONDS, HURT_VIGNETTE_SECONDS } from '../presentation/presentation.ts';
import { WARDEN_SHIELD } from '../enemyBehaviors.ts';
import { AnimationBook, SPAWN_SECONDS, enemyPoses, heroPoses, poseFrame, stepBossAnim, stepEnemyAnim, stepPlayerAnim, type AnimState, type EnemyAnim } from './animation.ts';
import { phaseFor, type SpriteAtlas, type SpriteFrame } from './assets/spriteAtlas.ts';
import { BOSS_SLOTS, CHAPTER_PACKS, HERO_SLOT, bossState, enemyDrawScale, enemySlot, frameKey, slotEnabled } from './assets/slots.ts';
import { GameRenderer } from './GameRenderer.ts';
import { NEUTRAL, SIGNAL, rgba } from './palette.ts';
import { createRenderFrameSnapshot } from './renderSnapshot.ts';
import { CHAPTER_VISUALS, enemyRoleFor, type VisualDetail } from './visualRegistry.ts';
import {
  circleVisible,
  interpolatePosition,
  makeViewport,
  rectVisible,
  segmentVisible,
  visibleGridLineRange,
  type Viewport,
} from './viewport.ts';

const TARGET_COLOR = SIGNAL.allyDeep;
/** Enemy ids start at 1, so the hero's animation state never collides with one. */
const HERO_ANIM_ID = -1;

/** The hit flash fades in three steps over its 0.08 s (FX-03): bright, half, faint. */
function hitFlashAlpha(hitFlash: number) {
  if (hitFlash <= 0) return 0;
  return hitFlash > 0.054 ? 0.85 : hitFlash > 0.027 ? 0.5 : 0.22;
}

/** Where a vector body points: its shield, its dash, its aim, or the way it walks; null keeps the last heading. */
function enemyHeading(enemy: Readonly<Entity>): number | null {
  if (enemy.shieldAngle !== undefined) return enemy.shieldAngle;
  if (enemy.patternPhase === 'warn' || enemy.patternPhase === 'dash') return Math.atan2(enemy.patternY, enemy.patternX);
  if (enemy.attackStyle === 'ranged' && enemy.rangedTelegraph > 0) return Math.atan2(enemy.patternY - enemy.y, enemy.patternX - enemy.x);
  if (Math.hypot(enemy.vx, enemy.vy) > 5) return Math.atan2(enemy.vy, enemy.vx);
  return null;
}

/**
 * World layer contract (TEC-12), bottom to top. Bodies (enemies, bosses, the player, mirror clones, obstacle
 * blocks) are sorted by the y of their feet, obstacles by their bottom edge, so nearer bodies overlap farther
 * ones. Enemy shots and telegraphs sit above every body, so no sprite hides a threat (V3). Particles and damage
 * numbers sit above bodies so hits read on enemies. The player x-ray pass comes last: whenever a nearer body or
 * an effect covers the player, it redraws the hero and its hit ring on top (V4, BUG-12).
 */
export const WORLD_LAYERS = [
  'ground', // floor grid and chapter motif
  'hazards',
  'groundMarks', // foot shadows, the player's foot ring, ranged-enemy rings
  'pickups',
  'targetGuide',
  'obstacleShadows',
  'bodies', // depth-sorted
  'overheads', // health bars and ranged markers, in one batch above every body
  'allyAttacks', // beams, chains, orbit blades, friendly projectiles, the aim reticle
  'hostileShots',
  'telegraphs', // lane telegraphs, ranged windups, boss ring warnings
  'effects', // player impact rings, particles, damage numbers
  'playerXray',
] as const;
export type WorldLayer = (typeof WORLD_LAYERS)[number];

/** Share of the player's body box that must be covered before the x-ray pass draws. */
export const XRAY_COVERAGE = 0.05;

type EnemySprite = { frame: SpriteFrame; facing: 1 | -1; scale: number };

/** One depth-sorted body for this frame. Pooled: fields are overwritten every frame. */
type BodyDraw = {
  /** Draw order at equal depth: obstacle blocks, then enemies, then clones, then the player. */
  rank: 0 | 1 | 2 | 3;
  depth: number;
  id: number;
  x: number;
  y: number;
  /** Axis-aligned box of what is drawn, in world units (overheads and occlusion use it). */
  left: number;
  right: number;
  top: number;
  bottom: number;
  enemy: Readonly<Entity> | null;
  /** The enemy's animation state (FX-01): its pose, facing, and heading. */
  anim: AnimState | null;
  obstacle: Readonly<Obstacle> | null;
  sprite: EnemySprite | null;
  cloneSide: -1 | 1;
};

/** What the last frame drew, for diagnostics and the visual gate (TEC-12). */
export type RenderFrameStats = {
  bodies: number;
  /** Share (0..1) of the player's body box covered by nearer bodies or effects. */
  playerCoverage: number;
  /** Whether the player x-ray pass drew this frame. */
  xray: boolean;
  /** Level of detail, from the enemies on screen (FX-01). */
  detail: VisualDetail;
};

export type RenderPlayer = Readonly<{
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  hp: number;
  shield: number;
  silence: number;
  root: number;
  rootImmunity: number;
}>;

/** Cosmetic state from the presentation layer; random() is its cosmetic stream (shake jitter). */
export type RenderEffects = {
  readonly particles: readonly Readonly<Particle>[];
  readonly damageNumbers: readonly Readonly<DamageNumber>[];
  readonly impactRings: readonly Readonly<ImpactRing>[];
  /** Fallen enemies (FX-03): falling bodies and their fading ink stains. */
  readonly corpses: readonly Readonly<Corpse>[];
  readonly shake: number;
  /** Seconds left on the hero's hurt, burst, and cast poses. */
  readonly playerHurt: number;
  readonly playerBurst: number;
  readonly playerCast: number;
  /** Player feedback (FX-03): the hurt vignette and the hit's angle, low health, and the death moment. */
  readonly hurtVignette: number;
  readonly hurtAngle: number;
  readonly lowHealth: boolean;
  readonly deathMoment: number;
  random(): number;
};

/**
 * Everything one frame draws. The engine fills it with live, read-only references every frame (no copies);
 * tests can build one by hand. alpha interpolates positions between the previous and current fixed step.
 */
export type RenderWorld = {
  readonly alpha: number;
  readonly view: Readonly<{ width: number; height: number; dpr: number; frame: ViewFrame }>;
  readonly worldSize: Readonly<{ width: number; height: number }>;
  readonly chapter: number;
  readonly elapsed: number;
  readonly paused: boolean;
  readonly bossEnraged: boolean;
  /** Classic rules draw shake jitter every frame, as 0.1.0 did; remaster rules only while shaking. */
  readonly jitterEveryFrame: boolean;
  /** The operating system's reduced-motion preference (the option lives in options.reducedFlash). */
  readonly reducedMotion: boolean;
  readonly options: Readonly<GameOptions>;
  readonly camera: Readonly<{ x: number; y: number; prevX: number; prevY: number }>;
  readonly player: RenderPlayer;
  readonly aim: Readonly<{ angle: number; targetId: number | null }>;
  readonly skills: Readonly<Partial<Record<SkillId, Readonly<SkillState>>>>;
  readonly enemies: readonly Readonly<Entity>[];
  readonly projectiles: readonly Readonly<Projectile>[];
  readonly bossProjectiles: readonly Readonly<BossProjectile>[];
  readonly pickups: readonly Readonly<Pickup>[];
  readonly hazards: readonly Readonly<Hazard>[];
  readonly obstacles: readonly Readonly<Obstacle>[];
  readonly beams: readonly Readonly<BeamEffect>[];
  readonly laneTelegraphs: readonly Readonly<LaneTelegraph>[];
  readonly chains: readonly Readonly<ChainEffect>[];
  readonly effects: RenderEffects;
};

export class WorldRenderer {
  readonly visual = new GameRenderer();
  /** How many times the grid tile was built; stays at one until the canvas is resized. */
  gridCacheBuilds = 0;
  private gridPattern?: CanvasPattern;
  private viewport: Viewport = makeViewport(0, 0, 1280, 720, 160);
  private world!: RenderWorld;
  /** Baked character art (TEC-03); null or not yet loaded means every slot draws with vectors. */
  private sprites: SpriteAtlas | null = null;
  /** Animation states by character id (FX-01); the hero is kept under HERO_ANIM_ID. */
  private readonly anims = new AnimationBook();
  private heroAnim: AnimState | null = null;
  /** White cut-outs of sprite frames for the hit flash (FX-03), built once per frame on first use. */
  private readonly silhouettes = new Map<SpriteFrame, SpriteFrame | null>();
  private readonly bodyPool: BodyDraw[] = [];
  private readonly sortedBodies: BodyDraw[] = [];
  private bodyCount = 0;
  private hero: SpriteFrame | undefined;
  private heroMoving = false;
  private playerBody: BodyDraw | null = null;
  /** Statistics of the last drawn frame. */
  readonly stats: RenderFrameStats = { bodies: 0, playerCoverage: 0, xray: false, detail: 'full' };
  /** Called as each world layer starts drawing; tests use it to check the layer contract. */
  onLayer: ((layer: WorldLayer) => void) | null = null;

  setSprites(atlas: SpriteAtlas | null) {
    this.sprites = atlas;
    this.anims.clear();
    this.silhouettes.clear();
  }

  /** Forget cached patterns (the canvas was resized or its context reset). */
  invalidateGrid() {
    this.gridPattern = undefined;
  }

  private interpolated(item: { x: number; y: number; prevX?: number; prevY?: number }) {
    return interpolatePosition(
      { x: item.prevX ?? item.x, y: item.prevY ?? item.y },
      item,
      this.world.alpha,
    );
  }

  /** Draws one frame. The world is read-only; the renderer keeps only its own caches between frames. */
  draw(ctx: CanvasRenderingContext2D, world: RenderWorld) {
    this.world = world;
    const alpha = world.alpha;
    const camera = this.interpolated(this.world.camera);
    const frame = this.world.view.frame;
    this.viewport = makeViewport(camera.x, camera.y, frame.width, frame.height, 160);
    const policy = motionPolicy(this.world.options.reducedFlash, this.world.reducedMotion);
    const snapshot = createRenderFrameSnapshot({
      chapter: this.world.chapter,
      elapsed: this.world.elapsed,
      alpha,
      reducedMotion: policy.reduced,
      aimAngle: this.world.aim.angle,
      moving: this.playerMoved(),
      bossEnraged: this.world.bossEnraged,
      // Detail follows what is on screen (FX-01): a crowd off screen costs nothing to draw.
      enemyCount: this.visibleEnemies(),
    });
    this.visual.beginFrame(snapshot);
    this.stats.detail = snapshot.detail;
    const shakeEnabled = this.world.options.screenShake && !policy.reduced;
    // Classic rules draw the shake jitter every frame like 0.1.0 did, because under them cosmetic random draws
    // still reach gameplay through particle ids; remaster rules draw only while actually shaking.
    const { shake } = this.world.effects;
    const drawJitter = !this.world.jitterEveryFrame ? shakeEnabled && !this.world.paused && shake > 0.01 : shakeEnabled;
    const shakeX = drawJitter ? (this.world.effects.random() - 0.5) * shake : 0;
    const shakeY = drawJitter ? (this.world.effects.random() - 0.5) * shake : 0;
    ctx.setTransform(this.world.view.dpr, 0, 0, this.world.view.dpr, 0, 0);
    ctx.clearRect(0, 0, this.world.view.width, this.world.view.height);
    ctx.fillStyle = NEUTRAL.paper;
    ctx.fillRect(0, 0, this.world.view.width, this.world.view.height);
    ctx.save();
    ctx.setTransform(this.world.view.dpr * frame.zoom, 0, 0, this.world.view.dpr * frame.zoom, this.world.view.dpr * frame.offsetX, 0);
    ctx.translate(-camera.x + shakeX, -camera.y + shakeY);
    this.collectBodies();
    for (const layer of WORLD_LAYERS) {
      this.onLayer?.(layer);
      this.drawLayer(ctx, layer);
    }
    ctx.restore();
    this.drawPlayerFeedback(ctx, policy.pulse);
    if (frame.offsetX > 0) {
      // Pillarbox bars keep windows wider than 16:9 from seeing past the logical frame (and its spawns).
      ctx.fillStyle = NEUTRAL.ink;
      ctx.fillRect(0, 0, frame.offsetX, this.world.view.height);
      ctx.fillRect(this.world.view.width - frame.offsetX, 0, frame.offsetX, this.world.view.height);
    }
  }

  private drawLayer(ctx: CanvasRenderingContext2D, layer: WorldLayer) {
    switch (layer) {
      case 'ground':
        this.drawWorld(ctx);
        this.drawCorpseStains(ctx);
        return;
      case 'hazards':
        this.drawHazards(ctx);
        return;
      case 'groundMarks':
        this.drawGroundMarks(ctx);
        return;
      case 'pickups':
        this.drawPickups(ctx);
        return;
      case 'targetGuide':
        this.drawTargetGuide(ctx);
        return;
      case 'obstacleShadows':
        for (const body of this.sortedBodies) if (body.obstacle) this.visual.drawObstacleShadow(ctx, body.obstacle);
        return;
      case 'bodies':
        for (const body of this.sortedBodies) this.drawBody(ctx, body);
        return;
      case 'overheads':
        this.drawOverheads(ctx);
        return;
      case 'allyAttacks':
        this.drawBeams(ctx);
        this.drawOrbitScythes(ctx);
        this.drawFriendlyProjectiles(ctx);
        this.drawTargetReticle(ctx);
        return;
      case 'hostileShots':
        this.drawHostileProjectiles(ctx);
        return;
      case 'telegraphs':
        this.drawTelegraphs(ctx);
        return;
      case 'effects':
        this.drawImpactRings(ctx, 'player');
        this.drawParticles(ctx);
        this.drawDamageNumbers(ctx);
        return;
      case 'playerXray':
        this.measurePlayerCoverage();
        if (this.stats.xray) this.drawPlayerXray(ctx);
        return;
    }
  }

  private acquireBody(): BodyDraw {
    let body = this.bodyPool[this.bodyCount];
    if (!body) {
      body = { rank: 1, depth: 0, id: 0, x: 0, y: 0, left: 0, right: 0, top: 0, bottom: 0, enemy: null, anim: null, obstacle: null, sprite: null, cloneSide: 1 };
      this.bodyPool.push(body);
    }
    this.bodyCount += 1;
    body.enemy = null;
    body.anim = null;
    body.obstacle = null;
    body.sprite = null;
    return body;
  }

  private visibleEnemies() {
    let count = 0;
    for (const enemy of this.world.enemies) {
      if (circleVisible(this.viewport, enemy.x, enemy.y, enemy.radius)) count += 1;
    }
    return count;
  }

  /** Gathers this frame's visible bodies and sorts them by depth (TEC-12); every character's animation steps. */
  private collectBodies() {
    this.bodyCount = 0;
    this.playerBody = null;
    this.anims.beginFrame(this.world.elapsed);
    for (const obstacle of this.world.obstacles) {
      if (!rectVisible(this.viewport, obstacle.x - 12, obstacle.y - 12, obstacle.w + 28, obstacle.h + 30)) continue;
      const body = this.acquireBody();
      body.rank = 0;
      body.depth = obstacle.y + obstacle.h;
      body.id = obstacle.id;
      body.x = obstacle.x + obstacle.w / 2;
      body.y = obstacle.y + obstacle.h;
      body.left = obstacle.x;
      body.right = obstacle.x + obstacle.w + 10;
      body.top = obstacle.y - 8;
      body.bottom = obstacle.y + obstacle.h;
      body.obstacle = obstacle;
    }
    for (const enemy of this.world.enemies) {
      const point = this.interpolated(enemy);
      // Off-screen characters step too, so one walking into view is not mistaken for a new spawn.
      const anim = this.animate(enemy);
      const sprite = this.enemySprite(enemy, anim);
      // Sprites stand on the hit circle's centre and rise above it; vectors are centred on it.
      const top = sprite ? point.y - (sprite.frame.ay / sprite.frame.scale) * sprite.scale : point.y - enemy.radius;
      const reach = sprite ? Math.max(enemy.radius + 24, point.y - top + 8) : enemy.radius + 24;
      if (!circleVisible(this.viewport, point.x, point.y, reach)) continue;
      const body = this.acquireBody();
      const halfWidth = sprite ? Math.max(enemy.radius, ((sprite.frame.sw / sprite.frame.scale) * sprite.scale) / 2) : enemy.radius;
      body.rank = 1;
      body.depth = point.y;
      body.id = enemy.id;
      body.x = point.x;
      body.y = point.y;
      body.left = point.x - halfWidth;
      body.right = point.x + halfWidth;
      body.top = top;
      body.bottom = sprite ? point.y + enemy.radius * 0.42 : point.y + enemy.radius;
      body.enemy = enemy;
      body.anim = anim;
      body.sprite = sprite ?? null;
    }
    this.heroMoving = this.playerMoved();
    this.hero = this.heroFrame(this.heroMoving);
    const player = this.interpolated(this.world.player);
    const heroTop = this.hero ? player.y - this.hero.ay / this.hero.scale : player.y - 36;
    const clone = this.world.skills.mirrorClone;
    if (clone) {
      const sideAngle = this.world.aim.angle + Math.PI / 2;
      const policy = motionPolicy(this.world.options.reducedFlash, this.world.reducedMotion);
      // Both clones fire every volley, so both are drawn, at the offset the shots start from (BUG-16).
      for (const side of [-1, 1] as const) {
        const drift = policy.reduced ? 0 : Math.sin(this.world.elapsed * 4.2 + side) * 3;
        const x = player.x + Math.cos(sideAngle) * SKILL_NUMBERS.mirrorClone.cloneOffset * side + Math.cos(this.world.aim.angle) * drift;
        const y = player.y + Math.sin(sideAngle) * SKILL_NUMBERS.mirrorClone.cloneOffset * side + Math.sin(this.world.aim.angle) * drift;
        const body = this.acquireBody();
        body.rank = 2;
        body.depth = y;
        body.id = side;
        body.x = x;
        body.y = y;
        body.left = x - 18;
        body.right = x + 18;
        body.top = y - (player.y - heroTop);
        body.bottom = y + 6;
        body.cloneSide = side;
      }
    }
    const body = this.acquireBody();
    body.rank = 3;
    body.depth = player.y;
    body.id = 0;
    body.x = player.x;
    body.y = player.y;
    body.left = player.x - 18;
    body.right = player.x + 18;
    body.top = heroTop;
    body.bottom = player.y + 6;
    this.playerBody = body;

    this.anims.endFrame();
    const sorted = this.sortedBodies;
    sorted.length = this.bodyCount;
    for (let index = 0; index < this.bodyCount; index += 1) sorted[index] = this.bodyPool[index];
    sorted.sort((a, b) => a.depth - b.depth || a.rank - b.rank || a.id - b.id);
    this.stats.bodies = this.bodyCount;
  }

  private drawBody(ctx: CanvasRenderingContext2D, body: BodyDraw) {
    if (body.obstacle) {
      this.visual.drawObstacleBlock(ctx, body.obstacle);
      return;
    }
    if (body.enemy) {
      this.drawEnemyBody(ctx, body.enemy, body);
      return;
    }
    if (body.rank === 2) {
      this.drawMirrorClone(ctx, body.x, body.y);
      return;
    }
    this.drawPlayerBody(ctx, body);
  }

  private drawWorld(ctx: CanvasRenderingContext2D) {
    this.ensureGridPattern(ctx);
    const viewport = this.viewport;
    if (this.gridPattern) {
      ctx.fillStyle = this.gridPattern;
      ctx.fillRect(viewport.left, viewport.top, viewport.right - viewport.left, viewport.bottom - viewport.top);
    } else {
      ctx.strokeStyle = NEUTRAL.gridLine;
      ctx.lineWidth = 1;
      const xs = visibleGridLineRange(viewport.left, viewport.right, 120, 0, this.world.worldSize.width);
      const ys = visibleGridLineRange(viewport.top, viewport.bottom, 120, 0, this.world.worldSize.height);
      if (xs) {
        for (let x = xs.first; x <= xs.last; x += xs.step) {
          ctx.beginPath();
          ctx.moveTo(x, Math.max(0, viewport.top));
          ctx.lineTo(x, Math.min(this.world.worldSize.height, viewport.bottom));
          ctx.stroke();
        }
      }
      if (ys) {
        for (let y = ys.first; y <= ys.last; y += ys.step) {
          ctx.beginPath();
          ctx.moveTo(Math.max(0, viewport.left), y);
          ctx.lineTo(Math.min(this.world.worldSize.width, viewport.right), y);
          ctx.stroke();
        }
      }
    }
    this.drawChapterMotif(ctx);
    if (rectVisible(viewport, -4, -4, this.world.worldSize.width + 8, this.world.worldSize.height + 8)) {
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, this.world.worldSize.width, this.world.worldSize.height);
    }
  }

  private drawChapterMotif(ctx: CanvasRenderingContext2D) {
    const viewport = this.viewport;
    const visual = CHAPTER_VISUALS[this.world.chapter] ?? CHAPTER_VISUALS[1];
    const centerX = Math.round(((viewport.left + viewport.right) / 2) / 480) * 480;
    const centerY = Math.round(((viewport.top + viewport.bottom) / 2) / 480) * 480;
    ctx.save();
    ctx.strokeStyle = visual.accent;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 2;

    if (visual.motif === 'orthogonal') {
      const xs = visibleGridLineRange(viewport.left, viewport.right, 480, 0, this.world.worldSize.width);
      const ys = visibleGridLineRange(viewport.top, viewport.bottom, 480, 0, this.world.worldSize.height);
      if (xs) for (let x = xs.first; x <= xs.last; x += xs.step) ctx.strokeRect(x - 12, Math.max(0, viewport.top), 24, Math.min(this.world.worldSize.height, viewport.bottom) - Math.max(0, viewport.top));
      if (ys) for (let y = ys.first; y <= ys.last; y += ys.step) ctx.strokeRect(Math.max(0, viewport.left), y - 8, Math.min(this.world.worldSize.width, viewport.right) - Math.max(0, viewport.left), 16);
    } else if (visual.motif === 'radial') {
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * 54, centerY + Math.sin(angle) * 54);
        ctx.lineTo(centerX + Math.cos(angle) * 310, centerY + Math.sin(angle) * 310);
        ctx.stroke();
      }
    } else if (visual.motif === 'flow') {
      for (let offset = -240; offset <= 240; offset += 120) {
        ctx.beginPath();
        ctx.moveTo(viewport.left, centerY + offset);
        for (let x = viewport.left; x <= viewport.right; x += 120) {
          ctx.quadraticCurveTo(x + 60, centerY + offset - 32, x + 120, centerY + offset);
        }
        ctx.stroke();
      }
    } else if (visual.motif === 'clock') {
      for (const radius of [80, 160, 240]) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * 210, centerY + Math.sin(angle) * 210);
        ctx.lineTo(centerX + Math.cos(angle) * 240, centerY + Math.sin(angle) * 240);
        ctx.stroke();
      }
    } else {
      ctx.lineWidth = 4;
      for (const radius of [72, 128, 210, 300]) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI * 0.12, Math.PI * 1.88);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private ensureGridPattern(ctx: CanvasRenderingContext2D) {
    if (this.gridPattern || typeof document.createElement !== 'function') return;
    const tile = document.createElement('canvas');
    tile.width = 120;
    tile.height = 120;
    const tileCtx = tile.getContext('2d');
    if (!tileCtx) return;
    tileCtx.strokeStyle = NEUTRAL.gridLine;
    tileCtx.lineWidth = 1;
    tileCtx.beginPath();
    tileCtx.moveTo(0.5, 0);
    tileCtx.lineTo(0.5, 120);
    tileCtx.moveTo(0, 0.5);
    tileCtx.lineTo(120, 0.5);
    tileCtx.stroke();
    this.gridPattern = ctx.createPattern(tile, 'repeat') ?? undefined;
    if (this.gridPattern) this.gridCacheBuilds += 1;
  }

  private drawHazards(ctx: CanvasRenderingContext2D) {
    for (const hazard of this.world.hazards) {
      if (!circleVisible(this.viewport, hazard.x, hazard.y, hazard.radius * 1.25 + 8)) continue;
      const fadedRoot = hazard.kind === 'root' && this.world.player.rootImmunity > 0;
      this.visual.drawHazard(ctx, hazard, fadedRoot ? 0.35 : 1);
    }
  }

  /** Threat warnings above every body (V3): lane telegraphs, ranged windups, and boss ring warnings. */
  private drawTelegraphs(ctx: CanvasRenderingContext2D) {
    for (const lane of this.world.laneTelegraphs) {
      if (!segmentVisible(this.viewport, lane.x1, lane.y1, lane.x2, lane.y2, lane.width + 40)) continue;
      this.visual.drawLaneTelegraph(ctx, lane);
    }
    for (const body of this.sortedBodies) {
      const enemy = body.enemy;
      if (!enemy || enemy.isBoss || enemy.attackStyle !== 'ranged' || enemy.rangedTelegraph <= 0) continue;
      ctx.save();
      ctx.strokeStyle = SIGNAL.hostile;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.78;
      ctx.setLineDash([8, 7]);
      ctx.beginPath();
      ctx.moveTo(body.x, body.y);
      ctx.lineTo(enemy.patternX, enemy.patternY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(body.x, body.y, enemy.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    this.drawImpactRings(ctx, 'hostile');
  }

  /** Marks on the floor under every body: foot shadows, the player's foot ring, and ranged-enemy rings. */
  private drawGroundMarks(ctx: CanvasRenderingContext2D) {
    this.drawFallingBodies(ctx);
    for (const body of this.sortedBodies) {
      const enemy = body.enemy;
      if (!enemy) continue;
      if (body.anim?.state === 'spawn') this.drawSpawnBloom(ctx, body.x, body.y, enemy.radius, this.spawnProgress(body.anim));
      if (body.sprite) {
        ctx.save();
        ctx.fillStyle = rgba(NEUTRAL.ink, 0.3);
        ctx.beginPath();
        ctx.ellipse(body.x, body.y, enemy.radius, enemy.radius * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (enemy.shieldAngle !== undefined && !enemy.isBoss) {
        // The warden's shield front (SYS-02): an ink arc on the floor, so a flank is readable at a glance.
        ctx.save();
        ctx.lineCap = 'round';
        for (const [color, width] of [[rgba(NEUTRAL.paperBright, 0.9), 7], [rgba(NEUTRAL.ink, 0.78), 4]] as const) {
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.arc(body.x, body.y, enemy.radius + 9, enemy.shieldAngle - WARDEN_SHIELD.halfArcRadians, enemy.shieldAngle + WARDEN_SHIELD.halfArcRadians);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (enemy.isBoss || enemy.attackStyle !== 'ranged' || enemy.rangedTelegraph > 0) continue;
      ctx.save();
      ctx.strokeStyle = SIGNAL.hostile;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.62;
      ctx.beginPath();
      ctx.arc(body.x, body.y, enemy.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    const player = this.playerBody;
    if (!player) return;
    if (this.hero) this.drawHeroGround(ctx, player.x, player.y);
    else this.visual.drawPlayerGround(ctx, this.playerInput(player));
  }

  /** Health bars and ranged markers for every body in one pass, so no body covers another's bar (TEC-12). */
  private drawOverheads(ctx: CanvasRenderingContext2D) {
    const bars = this.world.options.healthBars;
    for (const body of this.sortedBodies) {
      const enemy = body.enemy;
      if (!enemy) continue;
      if (!enemy.isBoss && enemy.attackStyle === 'ranged') {
        ctx.save();
        ctx.fillStyle = SIGNAL.hostile;
        ctx.globalAlpha = enemy.rangedTelegraph > 0 ? 0.78 : 0.62;
        ctx.beginPath();
        ctx.moveTo(body.x, body.top - 12);
        ctx.lineTo(body.x + 5, body.top - 4);
        ctx.lineTo(body.x - 5, body.top - 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      const showHealth = bars === 'all' || (bars === 'elite' && (enemy.isBoss || enemy.tier === 'large'));
      if (showHealth) this.drawHealthBar(ctx, body.x, body.top - 14, enemy.radius * 2.1, 6, enemy.hp / enemy.maxHp);
      if (enemy.stun > 0 && !enemy.isBoss) this.drawStunMark(ctx, body.x, body.top - (showHealth ? 26 : 12), enemy.id);
    }
  }

  /** Three ink dots circling over a stunned enemy's head (SYS-02 wall stun, chain spark stun). */
  private drawStunMark(ctx: CanvasRenderingContext2D, x: number, y: number, id: number) {
    const policy = motionPolicy(this.world.options.reducedFlash, this.world.reducedMotion);
    const spin = policy.reduced ? 0 : this.world.elapsed * 5 + phaseFor(id) * Math.PI * 2;
    ctx.save();
    ctx.fillStyle = NEUTRAL.ink;
    for (let index = 0; index < 3; index += 1) {
      const angle = spin + (index * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * 9, y + Math.sin(angle) * 3.5, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawPickups(ctx: CanvasRenderingContext2D) {
    for (const pickup of this.world.pickups) {
      const point = this.interpolated(pickup);
      if (!circleVisible(this.viewport, point.x, point.y, pickup.radius + 10)) continue;
      this.visual.drawPickup(ctx, pickup, point.x, point.y);
    }
  }

  private currentAimTarget() {
    if (this.world.aim.targetId === null) return undefined;
    return this.world.enemies.find((enemy) => enemy.id === this.world.aim.targetId && enemy.hp > 0);
  }

  private drawTargetGuide(ctx: CanvasRenderingContext2D) {
    const target = this.currentAimTarget();
    if (!target) return;
    const player = this.interpolated(this.world.player);
    const point = this.interpolated(target);
    if (!segmentVisible(this.viewport, player.x, player.y, point.x, point.y, 24)) return;
    const angle = Math.atan2(point.y - player.y, point.x - player.x);
    const distanceToTarget = Math.hypot(point.x - player.x, point.y - player.y);

    ctx.save();
    const gradient = ctx.createLinearGradient?.(player.x, player.y, point.x, point.y);
    if (gradient && typeof gradient.addColorStop === 'function') {
      gradient.addColorStop(0, rgba(TARGET_COLOR, 0));
      gradient.addColorStop(0.18, rgba(TARGET_COLOR, 0.22));
      gradient.addColorStop(0.5, rgba(TARGET_COLOR, 0.04));
      gradient.addColorStop(0.82, rgba(TARGET_COLOR, 0.38));
      gradient.addColorStop(1, rgba(TARGET_COLOR, 0.72));
      ctx.strokeStyle = gradient;
    } else {
      ctx.strokeStyle = rgba(TARGET_COLOR, 0.36);
    }
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 10]);
    ctx.beginPath();
    ctx.moveTo(
      player.x + Math.cos(angle) * 48,
      player.y + Math.sin(angle) * 48,
    );
    ctx.lineTo(
      point.x - Math.cos(angle) * (target.radius + 18),
      point.y - Math.sin(angle) * (target.radius + 18),
    );
    ctx.stroke();

    if (distanceToTarget > 150) {
      const arrowDistance = Math.max(86, distanceToTarget - target.radius - 44);
      const arrowX = player.x + Math.cos(angle) * arrowDistance;
      const arrowY = player.y + Math.sin(angle) * arrowDistance;
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.68;
      ctx.fillStyle = TARGET_COLOR;
      ctx.beginPath();
      ctx.moveTo(arrowX + Math.cos(angle) * 8, arrowY + Math.sin(angle) * 8);
      ctx.lineTo(arrowX + Math.cos(angle + 2.45) * 7, arrowY + Math.sin(angle + 2.45) * 7);
      ctx.lineTo(arrowX + Math.cos(angle - 2.45) * 7, arrowY + Math.sin(angle - 2.45) * 7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawTargetReticle(ctx: CanvasRenderingContext2D) {
    const target = this.currentAimTarget();
    if (!target) return;
    const point = this.interpolated(target);
    const outerRadius = target.radius + (target.isBoss ? 22 : 14);
    if (!circleVisible(this.viewport, point.x, point.y, outerRadius + 12)) return;
    const policy = motionPolicy(this.world.options.reducedFlash, this.world.reducedMotion);
    const rotation = policy.rotateDanger ? this.world.elapsed * 0.9 : 0;

    ctx.save();
    ctx.translate(point.x, point.y);
    // The aim reticle is the player's information, so it keeps the ally colour even on a boss (BUG-14).
    ctx.strokeStyle = TARGET_COLOR;
    ctx.fillStyle = TARGET_COLOR;
    ctx.lineWidth = target.isBoss ? 3 : 2;
    ctx.globalAlpha = 0.9;
    for (let index = 0; index < 4; index += 1) {
      const start = rotation + index * Math.PI / 2 - 0.28;
      ctx.beginPath();
      ctx.arc(0, 0, outerRadius, start, start + 0.56);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.42;
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(0, -outerRadius - 7, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBeams(ctx: CanvasRenderingContext2D) {
    for (const beam of this.world.beams) {
      if (!segmentVisible(this.viewport, beam.x1, beam.y1, beam.x2, beam.y2, beam.width)) continue;
      this.visual.drawBeam(ctx, beam);
    }

    for (const chain of this.world.chains) {
      if (!chain.points.some((point, index) => index > 0 && segmentVisible(this.viewport, chain.points[index - 1].x, chain.points[index - 1].y, point.x, point.y, 5))) continue;
      this.visual.drawChain(ctx, chain.points, chain.life, chain.maxLife);
    }
  }

  private drawFriendlyProjectiles(ctx: CanvasRenderingContext2D) {
    for (const projectile of this.world.projectiles) {
      const point = this.interpolated(projectile);
      if (!circleVisible(this.viewport, point.x, point.y, projectile.radius * 8)) continue;
      this.visual.drawFriendlyProjectile(ctx, {
        x: point.x,
        y: point.y,
        vx: projectile.vx,
        vy: projectile.vy,
        radius: projectile.radius,
        life: projectile.life,
        maxLife: projectile.maxLife,
        returning: projectile.returning,
        skillId: projectile.skillId,
      });
    }
  }

  private drawHostileProjectiles(ctx: CanvasRenderingContext2D) {
    for (const projectile of this.world.bossProjectiles) {
      const point = this.interpolated(projectile);
      if (!circleVisible(this.viewport, point.x, point.y, projectile.radius * 2.2)) continue;
      this.visual.drawHostileProjectile(ctx, {
        x: point.x,
        y: point.y,
        vx: projectile.vx,
        vy: projectile.vy,
        radius: projectile.radius,
        life: projectile.life,
        kind: projectile.kind,
        alpha: projectile.fading ? Math.max(0, Math.min(1, projectile.life / 0.3)) : 1,
      });
    }
  }

  private drawEnemyBody(ctx: CanvasRenderingContext2D, enemy: Readonly<Entity>, body: BodyDraw) {
    // A new enemy rises out of its ink bloom (FX-03); hit and contact rules do not change meanwhile.
    const rise = body.anim?.state === 'spawn' ? 0.35 + 0.65 * this.spawnProgress(body.anim) : 1;
    if (body.sprite) {
      const { frame, facing, scale } = body.sprite;
      this.blit(ctx, frame, body.x, body.y, facing, scale, rise);
      const flash = hitFlashAlpha(enemy.hitFlash);
      const silhouette = flash > 0 ? this.silhouette(frame) : null;
      if (silhouette) this.blit(ctx, silhouette, body.x, body.y, facing, scale, flash * rise);
      return;
    }
    if (rise < 1) {
      ctx.save();
      ctx.globalAlpha *= rise;
    }
    this.drawVectorEnemy(ctx, enemy, body);
    if (rise < 1) ctx.restore();
  }

  private drawVectorEnemy(ctx: CanvasRenderingContext2D, enemy: Readonly<Entity>, body: BodyDraw) {
    this.visual.drawEnemy(ctx, {
      id: enemy.id,
      x: body.x,
      y: body.y,
      vx: enemy.vx,
      vy: enemy.vy,
      radius: enemy.radius,
      tier: enemy.tier,
      variant: enemy.variant,
      isBoss: enemy.isBoss,
      attackStyle: enemy.attackStyle,
      hitFlash: enemy.hitFlash,
      bossId: enemy.boss?.id,
      bossPattern: enemy.boss?.pattern,
      bossPhase: enemy.bossPhase,
      legacyBoss: enemy.legacyBoss === true,
      patternPhase: enemy.patternPhase,
      heading: body.anim?.heading ?? 0,
    });
  }

  /** Hostile rings are boss attack warnings (telegraph layer); the player's are hit feedback (effects layer). */
  private drawImpactRings(ctx: CanvasRenderingContext2D, owner: 'player' | 'hostile') {
    for (const ring of this.world.effects.impactRings) {
      if ((ring.owner === 'hostile') !== (owner === 'hostile')) continue;
      if (!circleVisible(this.viewport, ring.x, ring.y, ring.radius * 1.5)) continue;
      this.visual.drawImpactRing(ctx, ring);
    }
  }

  private drawOrbitScythes(ctx: CanvasRenderingContext2D) {
    const skill = this.world.skills.orbitScythes;
    if (!skill) return;
    const forwardBlades = scaleAt(SKILL_NUMBERS.orbitScythes.blades, skill.level);
    const blades = forwardBlades + (skill.awakened ? SKILL_NUMBERS.orbitScythes.awakenedOuterBlades : 0);
    const baseRadius = scaleAt(SKILL_NUMBERS.orbitScythes.radius, skill.level);
    const player = this.interpolated(this.world.player);
    for (let i = 0; i < blades; i += 1) {
      const reverse = skill.awakened && i >= forwardBlades;
      const speed = reverse ? -2.6 : 3.2;
      const bladeRadius = reverse ? baseRadius + 52 : baseRadius;
      // Blades hit where the simulation puts them, so reduced motion must not freeze their drawn position (BUG-15).
      const angle = this.world.elapsed * speed + (Math.PI * 2 * i) / blades;
      const x = player.x + Math.cos(angle) * bladeRadius;
      const y = player.y + Math.sin(angle) * bladeRadius;
      this.visual.drawOrbitBlade(ctx, x, y, angle, reverse);
    }
  }

  private drawMirrorClone(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const skill = this.world.skills.mirrorClone;
    if (!skill) return;
    if (this.hero) {
      this.blit(ctx, this.hero, x, y, (this.heroAnim?.facing ?? 1), 0.94, skill.awakened ? 0.3 : 0.38);
      return;
    }
    this.visual.drawMirrorClone(ctx, {
      x,
      y,
      aimAngle: this.world.aim.angle,
      moving: this.heroMoving,
      shield: 0,
      silence: 0,
      alpha: skill.awakened ? 0.28 : 0.36,
    });
  }

  /** Walk cycles follow actual movement (keys held while rooted or paused must not animate) (BUG-15). */
  private playerMoved() {
    return !this.world.paused && Math.hypot(this.world.player.x - this.world.player.prevX, this.world.player.y - this.world.player.prevY) > 0.01;
  }

  private playerInput(body: BodyDraw) {
    return {
      x: body.x,
      y: body.y,
      aimAngle: this.world.aim.angle,
      moving: this.heroMoving,
      shield: this.world.player.shield,
      silence: this.world.player.silence,
    };
  }

  private drawPlayerBody(ctx: CanvasRenderingContext2D, body: BodyDraw) {
    if (this.hero) {
      const tilt = this.heroTilt();
      if (tilt !== 0) {
        this.blitTilted(ctx, this.hero, body.x, body.y, tilt, 1);
        return;
      }
      this.blit(ctx, this.hero, body.x, body.y, this.heroAnim?.facing ?? 1, 1);
      this.drawHeroMarks(ctx, body.x, body.y, this.hero);
      return;
    }
    this.visual.drawPlayerBody(ctx, this.playerInput(body));
  }

  /** The hero falls back over the death moment (FX-03) and lies still until the settlement; upright otherwise. */
  private heroTilt() {
    if (this.heroAnim?.state !== 'death' || motionPolicy(this.world.options.reducedFlash, this.world.reducedMotion).reduced) return 0;
    const progress = 1 - this.world.effects.deathMoment / DEATH_MOMENT_SECONDS;
    return -(this.heroAnim.facing) * progress * progress * Math.PI * 0.44;
  }

  private blitTilted(ctx: CanvasRenderingContext2D, frame: SpriteFrame, x: number, y: number, tilt: number, alpha: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    this.blit(ctx, frame, 0, 0, this.heroAnim?.facing ?? 1, 1, alpha);
    ctx.restore();
  }

  /**
   * Player feedback in screen space, over the world (FX-03): a coral glow on the side a hit came from, fading over
   * HURT_VIGNETTE_SECONDS, and a coral edge while health is low that beats with the heartbeat unless motion is
   * reduced. Reduced flash halves both.
   */
  private drawPlayerFeedback(ctx: CanvasRenderingContext2D, pulse: boolean) {
    const { effects, view, options } = this.world;
    if (effects.hurtVignette <= 0 && !effects.lowHealth) return;
    const left = view.frame.offsetX;
    const width = view.width - left * 2;
    const height = view.height;
    const cx = left + width / 2;
    const cy = height / 2;
    const reach = Math.hypot(width, height) / 2;
    const strength = options.reducedFlash ? 0.5 : 1;
    const glow = (x: number, y: number, inner: number, outer: number, innerAlpha: number, outerAlpha: number) => {
      const gradient = ctx.createRadialGradient?.(x, y, inner, x, y, outer);
      if (!gradient || typeof gradient.addColorStop !== 'function') return;
      gradient.addColorStop(0, rgba(SIGNAL.hostile, innerAlpha));
      gradient.addColorStop(1, rgba(SIGNAL.hostile, outerAlpha));
      ctx.fillStyle = gradient;
      ctx.fillRect(left, 0, width, height);
    };
    ctx.save();
    if (effects.lowHealth) {
      const beat = pulse ? 0.07 * Math.max(0, Math.sin((this.world.elapsed / HEARTBEAT_SECONDS) * Math.PI * 2)) : 0;
      glow(cx, cy, reach * 0.55, reach, 0, (0.2 + beat) * strength);
    }
    if (effects.hurtVignette > 0) {
      const x = cx + Math.cos(effects.hurtAngle) * width * 0.62;
      const y = cy + Math.sin(effects.hurtAngle) * height * 0.62;
      glow(x, y, 0, reach * 0.9, 0.42 * (effects.hurtVignette / HURT_VIGNETTE_SECONDS) * strength, 0);
    }
    ctx.restore();
  }

  /**
   * How much of the player's body box is covered by anything drawn after it: nearer bodies, obstacle blocks
   * in front, particles, and damage numbers. Sampled on a 5 x 7 grid. The x-ray pass draws when that share
   * reaches XRAY_COVERAGE (TEC-12) or when the player stands on a boss or large body (BUG-12).
   */
  private measurePlayerCoverage() {
    const player = this.playerBody;
    this.stats.playerCoverage = 0;
    this.stats.xray = this.playerOnDarkBody();
    if (!player) return;
    const covers: Array<readonly [number, number, number, number]> = [];
    const overlaps = (left: number, top: number, right: number, bottom: number) =>
      right > player.left && left < player.right && bottom > player.top && top < player.bottom;
    let behind = true;
    for (const body of this.sortedBodies) {
      if (body === player) {
        behind = false;
        continue;
      }
      if (behind || body.rank === 2) continue;
      if (overlaps(body.left, body.top, body.right, body.bottom)) covers.push([body.left, body.top, body.right, body.bottom]);
    }
    for (const particle of this.world.effects.particles) {
      const size = particle.size;
      if (overlaps(particle.x - size, particle.y - size, particle.x + size, particle.y + size)) {
        covers.push([particle.x - size, particle.y - size, particle.x + size, particle.y + size]);
      }
    }
    if (this.world.options.damageNumbers) {
      for (const number of this.world.effects.damageNumbers) {
        if (overlaps(number.x - 18, number.y - 18, number.x + 18, number.y + 2)) covers.push([number.x - 18, number.y - 18, number.x + 18, number.y + 2]);
      }
    }
    if (covers.length === 0) return;
    let covered = 0;
    const columns = 5;
    const rows = 7;
    for (let column = 0; column < columns; column += 1) {
      const x = player.left + ((column + 0.5) / columns) * (player.right - player.left);
      for (let row = 0; row < rows; row += 1) {
        const y = player.top + ((row + 0.5) / rows) * (player.bottom - player.top);
        if (covers.some(([left, top, right, bottom]) => x >= left && x <= right && y >= top && y <= bottom)) covered += 1;
      }
    }
    this.stats.playerCoverage = covered / (columns * rows);
    this.stats.xray = this.stats.xray || this.stats.playerCoverage >= XRAY_COVERAGE;
  }

  /** A boss or large body under or over the player: same-ink bodies swallow the hero's silhouette (BUG-12). */
  private playerOnDarkBody() {
    for (const enemy of this.world.enemies) {
      if (enemy.hp <= 0 || !(enemy.isBoss || enemy.tier === 'large')) continue;
      if (distance(enemy, this.world.player) < enemy.radius + 34) return true;
    }
    return false;
  }

  private drawPlayerXray(ctx: CanvasRenderingContext2D) {
    const player = this.playerBody;
    if (!player) return;
    if (this.hero) {
      // The hero is redrawn half-transparent over whatever covers it, with the hit circle (BUG-12).
      const tilt = this.heroTilt();
      if (tilt !== 0) this.blitTilted(ctx, this.hero, player.x, player.y, tilt, 0.6);
      else this.blit(ctx, this.hero, player.x, player.y, this.heroAnim?.facing ?? 1, 1, 0.6);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = SIGNAL.ally;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, HIT_RADIUS.playerContact, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    this.visual.drawPlayerXray(ctx, { x: player.x, y: player.y, hitRadius: HIT_RADIUS.playerContact });
  }

  /**
   * The hero's state (FX-01) and atlas frame for this moment, or undefined to draw with vectors. The hero faces its
   * target, or the way it walks without one.
   */
  private heroFrame(moving: boolean): SpriteFrame | undefined {
    const { effects, aim, player } = this.world;
    const now = this.world.elapsed;
    const anim = this.anims.touch(HERO_ANIM_ID, now, 1, 0);
    this.heroAnim = anim;
    const lateral = aim.targetId !== null ? Math.cos(aim.angle) : player.x - player.prevX;
    if (Math.abs(lateral) > 0.01) anim.facing = lateral < 0 ? -1 : 1;
    const state = stepPlayerAnim(anim, player, effects, moving, now);
    const sprites = this.sprites;
    if (!sprites || !slotEnabled(HERO_SLOT)) return undefined;
    for (const pose of heroPoses(state)) {
      const spec = sprites.animation(HERO_SLOT, pose);
      if (spec) return sprites.frame(frameKey(HERO_SLOT, pose, poseFrame(spec, pose, anim.startedAt, now, 0))) ?? sprites.frame(frameKey(HERO_SLOT, 'idle', 0));
    }
    return undefined;
  }

  /** Foot shadow (the hit circle, style bible §2.3) and the cyan four-part foot ring turned toward the aim. */
  private drawHeroGround(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const r = HIT_RADIUS.playerContact;
    ctx.save();
    ctx.fillStyle = rgba(NEUTRAL.ink, 0.3);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    const aim = this.world.aim.angle;
    for (const [color, width] of [[rgba(NEUTRAL.ink, 0.8), 5.2], [SIGNAL.allyDeep, 4.2], [SIGNAL.ally, 2.6], [SIGNAL.allyGlow, 0.7]] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      for (let index = 0; index < 4; index += 1) {
        const start = aim + (index * Math.PI) / 2 - 0.35;
        ctx.beginPath();
        ctx.ellipse(x, y, 24, 10.3, 0, start, start + 0.7);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** Shield ring around the body and the silence mark above the head (SYS-11 keeps it overhead). */
  private drawHeroMarks(ctx: CanvasRenderingContext2D, x: number, y: number, sprite: SpriteFrame) {
    const { shield, silence } = this.world.player;
    if (shield <= 0 && silence <= 0) return;
    const top = y - sprite.ay / sprite.scale;
    ctx.save();
    if (shield > 0) {
      ctx.strokeStyle = SIGNAL.ally;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.ellipse(x, (top + y) / 2, 30, (y - top) / 2 + 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (silence > 0) {
      ctx.setLineDash([]);
      ctx.strokeStyle = SIGNAL.elite;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, top - 12, 8, 0, Math.PI * 2);
      ctx.moveTo(x - 5.6, top - 17.6);
      ctx.lineTo(x + 5.6, top - 6.4);
      ctx.stroke();
    }
    ctx.restore();
  }

  private spawnProgress(anim: AnimState) {
    return clamp((this.world.elapsed - anim.startedAt) / SPAWN_SECONDS, 0, 1);
  }

  /** The ink pool a new enemy rises from: it spreads and dries within the spawn window. */
  private drawSpawnBloom(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, progress: number) {
    ctx.save();
    ctx.fillStyle = rgba(NEUTRAL.ink, 0.42 * (1 - progress));
    ctx.beginPath();
    ctx.ellipse(x, y, radius * (0.5 + 0.9 * progress), radius * (0.22 + 0.4 * progress), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Ink stains of fallen enemies, part of the floor under hazards; none at minimal detail (style bible P6). */
  private drawCorpseStains(ctx: CanvasRenderingContext2D) {
    if (this.stats.detail === 'minimal') return;
    for (const corpse of this.world.effects.corpses) {
      const radius = corpse.radius * (corpse.isBoss ? 1.4 : 1.1);
      if (!circleVisible(this.viewport, corpse.x, corpse.y, radius * 1.6)) continue;
      const age = corpse.maxLife - corpse.life;
      // The stain soaks out while the body falls, then dries away.
      const spread = 0.55 + 0.45 * clamp(age / CORPSE_FALL_SECONDS, 0, 1);
      const fade = clamp(corpse.life / (corpse.maxLife - CORPSE_FALL_SECONDS), 0, 1);
      const r = radius * spread;
      ctx.save();
      ctx.fillStyle = rgba(NEUTRAL.ink, 0.3 * fade);
      ctx.beginPath();
      ctx.ellipse(corpse.x + corpse.fall * r * 0.35, corpse.y, r, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(corpse.x - corpse.fall * r * 0.3, corpse.y + r * 0.08, r * 0.55, r * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Bodies falling over for the first quarter second (FX-03). A baked death pose plays as drawn; until one exists
   * the hit pose tips away from the player and fades. Vector bodies and bosses leave only their stain.
   */
  private drawFallingBodies(ctx: CanvasRenderingContext2D) {
    const sprites = this.sprites;
    const pack = CHAPTER_PACKS[this.world.chapter];
    if (!sprites || !pack || sprites.status(pack) !== 'ready' || this.stats.detail === 'minimal') return;
    for (const corpse of this.world.effects.corpses) {
      const age = corpse.maxLife - corpse.life;
      if (corpse.isBoss || age >= CORPSE_FALL_SECONDS) continue;
      if (!circleVisible(this.viewport, corpse.x, corpse.y, corpse.radius + 60)) continue;
      const slot = enemySlot(this.world.chapter, corpse.tier, corpse.attackStyle);
      if (!slotEnabled(slot)) continue;
      const pose = sprites.animation(slot, 'death') ? 'death' : 'hit';
      const spec = sprites.animation(slot, pose);
      const frame = spec ? sprites.frame(frameKey(slot, pose, poseFrame(spec, pose, 0, age, 0))) : undefined;
      if (!frame) continue;
      const progress = age / CORPSE_FALL_SECONDS;
      ctx.save();
      ctx.translate(corpse.x, corpse.y);
      if (pose === 'hit') ctx.rotate(corpse.fall * progress * progress * Math.PI * 0.45);
      this.blit(ctx, frame, 0, 0, corpse.fall > 0 ? -1 : 1, enemyDrawScale(enemyRoleFor(corpse.tier, corpse.attackStyle), corpse.tier), 1 - 0.7 * progress);
      ctx.restore();
    }
  }

  /** A frame's white cut-out (source-in fill), cached; null where no offscreen canvas can be made. */
  private silhouette(frame: SpriteFrame): SpriteFrame | null {
    let cutout = this.silhouettes.get(frame);
    if (cutout === undefined) {
      cutout = null;
      const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
      const context = canvas?.getContext('2d');
      if (canvas && context) {
        canvas.width = frame.sw;
        canvas.height = frame.sh;
        context.drawImage(frame.image, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, frame.sw, frame.sh);
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = NEUTRAL.paperBright;
        context.fillRect(0, 0, frame.sw, frame.sh);
        cutout = { ...frame, image: canvas, sx: 0, sy: 0 };
      }
      this.silhouettes.set(frame, cutout);
    }
    return cutout;
  }

  /** Draws an atlas frame with its anchor on (x, y); scale multiplies the baked size, facing -1 mirrors it. */
  private blit(ctx: CanvasRenderingContext2D, sprite: SpriteFrame, x: number, y: number, facing: 1 | -1, scale: number, alpha = 1) {
    const unit = scale / sprite.scale;
    ctx.save();
    if (alpha !== 1) ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    if (facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(sprite.image, sprite.sx, sprite.sy, sprite.sw, sprite.sh, -sprite.ax * unit, -sprite.ay * unit, sprite.sw * unit, sprite.sh * unit);
    ctx.restore();
  }

  /**
   * Steps a character's animation state (FX-01) and where it faces: sprites turn left or right, vector bodies turn
   * to their heading. Bosses face their dash, or the player; enemies face their shield (wardens), their locked
   * dash (chargers), or the way they walk, and keep facing that way when they stop.
   */
  private animate(enemy: Readonly<Entity>): AnimState {
    const now = this.world.elapsed;
    const { player } = this.world;
    const anim = this.anims.touch(enemy.id, now, player.x < enemy.x ? -1 : 1, Math.atan2(player.y - enemy.y, player.x - enemy.x));
    let lateral: number;
    if (enemy.isBoss) {
      stepBossAnim(anim, enemy, now, this.world.bossEnraged);
      // Classic rules keep a target point in patternX during the windup, so only the dash itself reads velocity.
      lateral = enemy.patternPhase === 'dash' ? enemy.vx : player.x - enemy.x;
    } else {
      stepEnemyAnim(anim, enemy, now);
      const heading = enemyHeading(enemy);
      if (heading !== null) anim.heading = heading;
      lateral = enemy.shieldAngle !== undefined
        ? Math.cos(enemy.shieldAngle) * 100
        : enemy.patternPhase === 'warn' || enemy.patternPhase === 'dash' ? enemy.patternX : enemy.vx;
    }
    if (Math.abs(lateral) > 5) anim.facing = lateral < 0 ? -1 : 1;
    return anim;
  }

  /** An enemy's atlas frame, facing, and scale for its animation state, or undefined to draw it with vectors. */
  private enemySprite(enemy: Readonly<Entity>, anim: AnimState) {
    const sprites = this.sprites;
    if (!sprites) return undefined;
    if (enemy.isBoss) return this.bossSprite(enemy, anim, sprites);
    const pack = CHAPTER_PACKS[this.world.chapter];
    if (!pack || sprites.status(pack) !== 'ready') return undefined;
    const slot = enemySlot(this.world.chapter, enemy.tier, enemy.attackStyle);
    if (!slotEnabled(slot)) return undefined;
    for (const pose of enemyPoses(anim.state as EnemyAnim, Math.hypot(enemy.vx, enemy.vy) > 5)) {
      const spec = sprites.animation(slot, pose);
      if (!spec) continue;
      const frame = sprites.frame(frameKey(slot, pose, poseFrame(spec, pose, anim.startedAt, this.world.elapsed, phaseFor(enemy.id), this.stats.detail)));
      if (!frame) return undefined;
      return { frame, facing: anim.facing, scale: enemyDrawScale(enemyRoleFor(enemy.tier, enemy.attackStyle), enemy.tier) };
    }
    return undefined;
  }

  /**
   * A round boss's frame (TEC-03b): its phase art, the windup pose while a dash winds up or a volley is armed,
   * and the enraged variant. The kit draws bosses facing right.
   */
  private bossSprite(enemy: Readonly<Entity>, anim: AnimState, sprites: SpriteAtlas) {
    const entry = enemy.boss ? BOSS_SLOTS[enemy.boss.id] : undefined;
    if (!entry || !slotEnabled(entry.slot) || sprites.status(entry.pack) !== 'ready') return undefined;
    const frame = sprites.frame(frameKey(entry.slot, bossState(enemy.bossPhase ?? 1, anim.state === 'windup', this.world.bossEnraged), 0));
    if (!frame) return undefined;
    return { frame, facing: anim.facing, scale: 1 };
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const particle of this.world.effects.particles) {
      if (!circleVisible(this.viewport, particle.x, particle.y, particle.size)) continue;
      this.visual.drawParticle(ctx, particle);
    }
  }

  private drawDamageNumbers(ctx: CanvasRenderingContext2D) {
    if (!this.world.options.damageNumbers) return;
    for (const number of this.world.effects.damageNumbers) {
      if (!circleVisible(this.viewport, number.x, number.y, 52)) continue;
      this.visual.drawDamageNumber(ctx, number);
    }
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ratio: number) {
    this.visual.drawHealthBar(ctx, x, y, w, h, ratio);
  }
}
