// World renderer (TEC-02): draws one frame from a read-only RenderWorld. It never sees the engine, so drawing
// cannot change outcomes and a test can render any hand-built world.
import type {
  BeamEffect,
  BossProjectile,
  ChainEffect,
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
import { distance } from '../worldMath.ts';
import { PLAYER_CAST_POSE_SECONDS, PLAYER_HURT_POSE_SECONDS } from '../presentation/presentation.ts';
import { loopFrame, phaseFor, type SpriteAtlas, type SpriteFrame } from './assets/spriteAtlas.ts';
import { CHAPTER_PACKS, HERO_SLOT, enemyDrawScale, enemySlot, frameKey, slotEnabled, type HeroState } from './assets/slots.ts';
import { GameRenderer } from './GameRenderer.ts';
import { NEUTRAL, SIGNAL, rgba } from './palette.ts';
import { createRenderFrameSnapshot } from './renderSnapshot.ts';
import { CHAPTER_VISUALS, enemyRoleFor } from './visualRegistry.ts';
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

export type RenderPlayer = Readonly<{
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  shield: number;
  silence: number;
  rootImmunity: number;
}>;

/** Cosmetic state from the presentation layer; random() is its cosmetic stream (shake jitter). */
export type RenderEffects = {
  readonly particles: readonly Readonly<Particle>[];
  readonly damageNumbers: readonly Readonly<DamageNumber>[];
  readonly impactRings: readonly Readonly<ImpactRing>[];
  readonly shake: number;
  /** Seconds left on the hero's hurt and cast poses. */
  readonly playerHurt: number;
  readonly playerCast: number;
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
  private heroFacing: 1 | -1 = 1;
  private readonly enemyFacing = new Map<number, 1 | -1>();

  setSprites(atlas: SpriteAtlas | null) {
    this.sprites = atlas;
    this.enemyFacing.clear();
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
    this.visual.beginFrame(createRenderFrameSnapshot({
      chapter: this.world.chapter,
      elapsed: this.world.elapsed,
      alpha,
      reducedMotion: policy.reduced,
      aimAngle: this.world.aim.angle,
      moving: this.playerMoved(),
      bossEnraged: this.world.bossEnraged,
      enemyCount: this.world.enemies.length,
    }));
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
    // Layer order (BUG-12 / TEC-12): effects never cover the player body, enemy shots stay above every
    // body so an incoming hit is always visible, and the player keyline sits on top of everything.
    this.drawWorld(ctx);
    this.drawHazards(ctx);
    this.drawObstacles(ctx);
    this.drawLaneTelegraphs(ctx);
    this.drawTargetGuide(ctx);
    this.drawPickups(ctx);
    this.drawBeams(ctx);
    this.drawEnemies(ctx);
    this.drawTargetReticle(ctx);
    this.drawImpactRings(ctx);
    this.drawParticles(ctx);
    this.drawDamageNumbers(ctx);
    this.drawOrbitScythes(ctx);
    this.drawMirrorClone(ctx);
    this.drawPlayer(ctx);
    this.drawFriendlyProjectiles(ctx);
    this.drawHostileProjectiles(ctx);
    this.drawPlayerXray(ctx);
    ctx.restore();
    if (frame.offsetX > 0) {
      // Pillarbox bars keep windows wider than 16:9 from seeing past the logical frame (and its spawns).
      ctx.fillStyle = NEUTRAL.ink;
      ctx.fillRect(0, 0, frame.offsetX, this.world.view.height);
      ctx.fillRect(this.world.view.width - frame.offsetX, 0, frame.offsetX, this.world.view.height);
    }
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

  private drawLaneTelegraphs(ctx: CanvasRenderingContext2D) {
    for (const lane of this.world.laneTelegraphs) {
      if (!segmentVisible(this.viewport, lane.x1, lane.y1, lane.x2, lane.y2, lane.width + 40)) continue;
      this.visual.drawLaneTelegraph(ctx, lane);
    }
  }

  private drawObstacles(ctx: CanvasRenderingContext2D) {
    for (const obstacle of this.world.obstacles) {
      if (!rectVisible(this.viewport, obstacle.x - 12, obstacle.y - 12, obstacle.w + 28, obstacle.h + 30)) continue;
      this.visual.drawObstacle(ctx, obstacle);
    }
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
      });
    }
  }

  private drawEnemies(ctx: CanvasRenderingContext2D) {
    for (const enemy of this.world.enemies) {
      const point = this.interpolated(enemy);
      const sprite = this.enemySprite(enemy);
      // Sprites stand on the hit circle's centre and rise above it; vectors are centred on it.
      const headY = sprite ? point.y - (sprite.frame.ay / sprite.frame.scale) * sprite.scale : point.y - enemy.radius;
      const reach = sprite ? Math.max(enemy.radius + 24, point.y - headY + 8) : enemy.radius + 24;
      if (!circleVisible(this.viewport, point.x, point.y, reach)) continue;
      if (sprite) {
        ctx.save();
        ctx.fillStyle = rgba(NEUTRAL.ink, 0.3);
        ctx.beginPath();
        ctx.ellipse(point.x, point.y, enemy.radius, enemy.radius * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        this.blit(ctx, sprite.frame, point.x, point.y, sprite.facing, sprite.scale);
      } else this.visual.drawEnemy(ctx, {
        id: enemy.id,
        x: point.x,
        y: point.y,
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
      });

      if (!enemy.isBoss && enemy.attackStyle === 'ranged') {
        ctx.save();
        ctx.strokeStyle = SIGNAL.hostile;
        ctx.lineWidth = enemy.rangedTelegraph > 0 ? 3 : 2;
        ctx.globalAlpha = enemy.rangedTelegraph > 0 ? 0.78 : 0.62;
        if (enemy.rangedTelegraph > 0) {
          ctx.setLineDash([8, 7]);
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(enemy.patternX, enemy.patternY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.beginPath();
        ctx.arc(point.x, point.y, enemy.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = SIGNAL.hostile;
        ctx.beginPath();
        ctx.moveTo(point.x, headY - 12);
        ctx.lineTo(point.x + 5, headY - 4);
        ctx.lineTo(point.x - 5, headY - 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      const showHealth =
        this.world.options.healthBars === 'all' ||
        (this.world.options.healthBars === 'elite' && (enemy.isBoss || enemy.tier === 'large'));
      if (showHealth) this.drawHealthBar(ctx, point.x, headY - 14, enemy.radius * 2.1, 6, enemy.hp / enemy.maxHp);
    }
  }

  private drawImpactRings(ctx: CanvasRenderingContext2D) {
    for (const ring of this.world.effects.impactRings) {
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

  private drawMirrorClone(ctx: CanvasRenderingContext2D) {
    const skill = this.world.skills.mirrorClone;
    if (!skill) return;
    const player = this.interpolated(this.world.player);
    const sideAngle = this.world.aim.angle + Math.PI / 2;
    const policy = motionPolicy(this.world.options.reducedFlash, this.world.reducedMotion);

    // Both clones fire every volley, so both are drawn, at the offset the shots start from (BUG-16).
    for (const side of [-1, 1]) {
      const distanceFromPlayer = SKILL_NUMBERS.mirrorClone.cloneOffset;
      const drift = policy.reduced ? 0 : Math.sin(this.world.elapsed * 4.2 + side) * 3;
      const x = player.x + Math.cos(sideAngle) * distanceFromPlayer * side + Math.cos(this.world.aim.angle) * drift;
      const y = player.y + Math.sin(sideAngle) * distanceFromPlayer * side + Math.sin(this.world.aim.angle) * drift;
      const sprite = this.heroFrame(this.playerMoved());
      if (sprite) {
        this.blit(ctx, sprite, x, y, this.heroFacing, 0.94, skill.awakened ? 0.3 : 0.38);
        continue;
      }
      this.visual.drawMirrorClone(ctx, {
        x,
        y,
        aimAngle: this.world.aim.angle,
        moving: this.playerMoved(),
        shield: 0,
        silence: 0,
        alpha: skill.awakened ? 0.28 : 0.36,
      });
    }
  }

  /** Walk cycles follow actual movement (keys held while rooted or paused must not animate) (BUG-15). */
  private playerMoved() {
    return !this.world.paused && Math.hypot(this.world.player.x - this.world.player.prevX, this.world.player.y - this.world.player.prevY) > 0.01;
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const moving = this.playerMoved();
    const player = this.interpolated(this.world.player);
    const sprite = this.heroFrame(moving);
    if (sprite) {
      this.drawHeroGround(ctx, player.x, player.y);
      this.blit(ctx, sprite, player.x, player.y, this.heroFacing, 1);
      this.drawHeroMarks(ctx, player.x, player.y, sprite);
      return;
    }
    this.visual.drawPlayer(ctx, {
      x: player.x,
      y: player.y,
      aimAngle: this.world.aim.angle,
      moving,
      shield: this.world.player.shield,
      silence: this.world.player.silence,
    });
  }

  private playerCovered() {
    for (const enemy of this.world.enemies) {
      if (enemy.hp <= 0 || !(enemy.isBoss || enemy.tier === 'large')) continue;
      if (distance(enemy, this.world.player) < enemy.radius + 34) return true;
    }
    return false;
  }

  private drawPlayerXray(ctx: CanvasRenderingContext2D) {
    if (!this.playerCovered()) return;
    const player = this.interpolated(this.world.player);
    const sprite = this.heroFrame(this.playerMoved());
    if (sprite) {
      // The hero is redrawn half-transparent over the covering body, with the hit circle (BUG-12).
      this.blit(ctx, sprite, player.x, player.y, this.heroFacing, 1, 0.6);
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

  /** The hero's atlas frame for this moment, or undefined to draw with vectors (FX-01 states, TEC-03). */
  private heroFrame(moving: boolean): SpriteFrame | undefined {
    const sprites = this.sprites;
    if (!sprites || !slotEnabled(HERO_SLOT)) return undefined;
    const { effects, aim, player } = this.world;
    const lateral = aim.targetId !== null ? Math.cos(aim.angle) : player.x - player.prevX;
    if (Math.abs(lateral) > 0.01) this.heroFacing = lateral < 0 ? -1 : 1;
    const state: HeroState = effects.playerHurt > 0 ? 'hurt' : effects.playerCast > 0 ? 'throw' : moving ? 'run' : 'idle';
    const spec = sprites.animation(HERO_SLOT, state);
    if (!spec) return undefined;
    let index: number;
    if (state === 'hurt') index = Math.floor((PLAYER_HURT_POSE_SECONDS - effects.playerHurt) * spec.fps);
    else if (state === 'throw') index = Math.floor((PLAYER_CAST_POSE_SECONDS - effects.playerCast) * spec.fps);
    else index = loopFrame(spec, this.world.elapsed);
    index = Math.max(0, Math.min(spec.frames - 1, index));
    return sprites.frame(frameKey(HERO_SLOT, state, index)) ?? sprites.frame(frameKey(HERO_SLOT, 'idle', 0));
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

  /** An enemy's atlas frame, facing, and scale, or undefined to draw it with vectors (bosses stay vector). */
  private enemySprite(enemy: Readonly<Entity>) {
    const sprites = this.sprites;
    if (!sprites || enemy.isBoss) return undefined;
    const pack = CHAPTER_PACKS[this.world.chapter];
    if (!pack || sprites.status(pack) !== 'ready') return undefined;
    const slot = enemySlot(this.world.chapter, enemy.tier, enemy.attackStyle);
    if (!slotEnabled(slot)) return undefined;
    const moving = Math.hypot(enemy.vx, enemy.vy) > 5;
    const state = enemy.hitFlash > 0 ? 'hit' : enemy.attackStyle === 'ranged' && enemy.rangedTelegraph > 0 ? 'windup' : moving ? 'walk' : 'idle';
    const spec = sprites.animation(slot, state);
    if (!spec) return undefined;
    const frame = sprites.frame(frameKey(slot, state, state === 'walk' ? loopFrame(spec, this.world.elapsed, phaseFor(enemy.id)) : 0));
    if (!frame) return undefined;
    const lateral = Math.abs(enemy.vx) > 5 ? enemy.vx : 0;
    const facing: 1 | -1 = lateral !== 0 ? (lateral < 0 ? -1 : 1) : this.enemyFacing.get(enemy.id) ?? (this.world.player.x < enemy.x ? -1 : 1);
    this.enemyFacing.set(enemy.id, facing);
    return { frame, facing, scale: enemyDrawScale(enemyRoleFor(enemy.tier, enemy.attackStyle), enemy.tier) };
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
