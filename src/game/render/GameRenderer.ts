import type {
  BossPattern,
  BossProjectile,
  EnemyTier,
  Hazard,
  Obstacle,
  Pickup,
  SkillId,
} from '../engine/worldTypes.ts';
import { clamp } from '../worldMath.ts';
import { telegraphPhase } from '../visualContracts.ts';
import { motionWave, normalizedLifetime } from './animationClock.ts';
import { NEUTRAL, SIGNAL } from './palette.ts';
import type { RenderFrameSnapshot } from './renderSnapshot.ts';
import {
  CHAPTER_ART,
  HAZARD_ART,
  HOSTILE_PROJECTILE_ART,
  SKILL_PROJECTILE_ART,
  VISUAL_PALETTE,
  bossArtFor,
  enemyArtFor,
  type BossArtProfile,
  type EnemyArtProfile,
  type ProjectileArtProfile,
} from './visualRegistry.ts';

export type PlayerVisualInput = {
  x: number;
  y: number;
  aimAngle: number;
  moving: boolean;
  shield: number;
  silence: number;
};

export type CloneVisualInput = PlayerVisualInput & {
  alpha: number;
};

export type EnemyVisualInput = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  tier: EnemyTier;
  variant: number;
  isBoss: boolean;
  attackStyle: 'contact' | 'ranged';
  hitFlash: number;
  bossId?: string;
  bossPattern?: BossPattern;
  bossPhase: 1 | 2 | 3;
  legacyBoss: boolean;
  /** Boss attack state; 'warn' is a windup that must be visible before the attack lands (BUG-10). */
  patternPhase?: string;
};

export type FriendlyProjectileVisualInput = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  returning: boolean;
  skillId: SkillId;
};

/** Which side an effect belongs to; it decides the signal colour (BUG-14). */
import type { EffectOwner } from '../engine/worldTypes.ts';

export type { EffectOwner };

export type HostileProjectileVisualInput = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  kind: BossProjectile['kind'];
};

const DEFAULT_FRAME: RenderFrameSnapshot = Object.freeze({
  chapter: 1,
  elapsed: 0,
  alpha: 1,
  reducedMotion: false,
  detail: 'full',
  aimAngle: 0,
  moving: false,
  bossEnraged: false,
  enemyCount: 0,
});

const PLAYER_BODY_POINTS: ReadonlyArray<readonly [number, number]> = [
  [-14, -12],
  [14, -12],
  [18, 7],
  [10, 25],
  [2, 18],
  [-3, 29],
  [-17, 16],
  [-15, 1],
];
const PLAYER_HEAD = { x: 0, y: -25, radius: 10.5 };

function pathPolygon(
  ctx: CanvasRenderingContext2D,
  points: ReadonlyArray<readonly [number, number]>,
) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function pathStar(
  ctx: CanvasRenderingContext2D,
  points: number,
  outerRadius: number,
  innerRadius: number,
  rotation = 0,
) {
  const count = Math.max(2, points * 2);
  ctx.beginPath();
  for (let index = 0; index < count; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / count;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawPaperCut(
  ctx: CanvasRenderingContext2D,
  fill: string,
  stroke: string = VISUAL_PALETTE.ink,
  lineWidth: number = 3,
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.fill();
  ctx.stroke();
}

export class GameRenderer {
  private frame = DEFAULT_FRAME;

  beginFrame(frame: RenderFrameSnapshot) {
    this.frame = frame;
  }

  drawPlayer(ctx: CanvasRenderingContext2D, input: PlayerVisualInput) {
    ctx.save();
    ctx.translate(input.x, input.y);
    this.drawPlayerSignal(ctx, input);
    this.drawPlayerFigure(ctx, input, 1, false);
    ctx.restore();
  }

  drawMirrorClone(ctx: CanvasRenderingContext2D, input: CloneVisualInput) {
    ctx.save();
    ctx.translate(input.x, input.y);
    ctx.globalAlpha = clamp(input.alpha, 0.18, 0.42);
    this.drawPlayerFigure(ctx, input, 0.94, true);
    ctx.globalAlpha = clamp(input.alpha * 0.72, 0.12, 0.32);
    ctx.strokeStyle = VISUAL_PALETTE.player;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.ellipse(0, 3, 31, 38, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawPlayerSignal(ctx: CanvasRenderingContext2D, input: PlayerVisualInput) {
    const pulse = this.frame.reducedMotion
      ? 0
      : motionWave(this.frame.elapsed, 4.8, 1.8);
    ctx.save();
    ctx.strokeStyle = VISUAL_PALETTE.player;
    ctx.lineWidth = 5;
    ctx.globalAlpha = 0.92;
    for (let index = 0; index < 4; index += 1) {
      const start = input.aimAngle + index * Math.PI / 2 - 0.48;
      ctx.beginPath();
      ctx.arc(0, 3, 41 + pulse, start, start + 0.74);
      ctx.stroke();
    }
    ctx.strokeStyle = VISUAL_PALETTE.playerCore;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.arc(0, 3, 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawPlayerFigure(
    ctx: CanvasRenderingContext2D,
    input: PlayerVisualInput,
    scale: number,
    clone: boolean,
  ) {
    const walk = input.moving
      ? motionWave(this.frame.elapsed, 11, this.frame.reducedMotion ? 0 : 1)
      : 0;
    const aimX = Math.cos(input.aimAngle);
    const aimY = Math.sin(input.aimAngle);
    const sideX = -aimY;
    const sideY = aimX;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (!clone && this.frame.detail !== 'minimal') {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = VISUAL_PALETTE.ink;
      ctx.beginPath();
      ctx.ellipse(-aimX * 4, 23 - aimY * 2, 21, 9, input.aimAngle * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = clone ? VISUAL_PALETTE.player : VISUAL_PALETTE.ink;
    ctx.fillStyle = clone ? VISUAL_PALETTE.paperBright : VISUAL_PALETTE.ink;
    ctx.lineWidth = clone ? 3 : 3.5;
    if (clone) ctx.setLineDash([6, 3]);

    pathPolygon(ctx, PLAYER_BODY_POINTS);
    drawPaperCut(ctx, clone ? VISUAL_PALETTE.paperBright : VISUAL_PALETTE.ink, clone ? VISUAL_PALETTE.player : VISUAL_PALETTE.ink, 3.5);

    ctx.setLineDash([]);
    ctx.fillStyle = clone ? VISUAL_PALETTE.playerCore : VISUAL_PALETTE.paperBright;
    ctx.strokeStyle = clone ? VISUAL_PALETTE.player : VISUAL_PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(PLAYER_HEAD.x, PLAYER_HEAD.y, PLAYER_HEAD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = clone ? VISUAL_PALETTE.player : VISUAL_PALETTE.ink;
    ctx.beginPath();
    ctx.moveTo(aimX * 11, -25 + aimY * 8);
    ctx.lineTo(aimX * 18 + sideX * 4, -25 + aimY * 12 + sideY * 4);
    ctx.lineTo(aimX * 18 - sideX * 4, -25 + aimY * 12 - sideY * 4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = clone ? VISUAL_PALETTE.player : VISUAL_PALETTE.player;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-sideX * 8, -13 - sideY * 8);
    ctx.quadraticCurveTo(
      -aimX * 13 - sideX * 8,
      -6 - aimY * 9 - sideY * 8,
      -aimX * (30 + Math.abs(walk) * 3),
      2 - aimY * 20,
    );
    ctx.stroke();

    ctx.strokeStyle = clone ? VISUAL_PALETTE.player : VISUAL_PALETTE.paperBright;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-9, -7);
    ctx.lineTo(9, -7);
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 14);
    ctx.stroke();

    ctx.strokeStyle = clone ? VISUAL_PALETTE.player : VISUAL_PALETTE.ink;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-6, 20);
    ctx.lineTo(-13 - walk * 3, 36);
    ctx.moveTo(6, 20);
    ctx.lineTo(14 + walk * 3, 35);
    ctx.stroke();

    const handX = aimX * 20;
    const handY = -3 + aimY * 18;
    ctx.strokeStyle = clone ? VISUAL_PALETTE.player : VISUAL_PALETTE.ink;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(sideX * 8, -7 + sideY * 8);
    ctx.lineTo(handX, handY);
    ctx.moveTo(-sideX * 8, -7 - sideY * 8);
    ctx.lineTo(handX - aimX * 5, handY - aimY * 5);
    ctx.stroke();

    ctx.strokeStyle = clone ? VISUAL_PALETTE.player : VISUAL_PALETTE.paperBright;
    ctx.lineWidth = clone ? 4 : 7;
    ctx.beginPath();
    ctx.moveTo(handX - aimX * 8, handY - aimY * 8);
    ctx.lineTo(handX + aimX * 28, handY + aimY * 28);
    ctx.stroke();
    ctx.strokeStyle = clone ? VISUAL_PALETTE.playerCore : VISUAL_PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (input.shield > 0) {
      ctx.strokeStyle = VISUAL_PALETTE.player;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.arc(0, 3, 46, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (input.silence > 0) {
      ctx.setLineDash([]);
      ctx.strokeStyle = VISUAL_PALETTE.elite;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-24, -35);
      ctx.lineTo(24, 38);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Top-layer player keyline (BUG-12): when a large dark body covers the player, their outline and hit
   * circle are redrawn above everything so the player never vanishes into a boss silhouette.
   */
  drawPlayerXray(ctx: CanvasRenderingContext2D, input: { x: number; y: number; hitRadius: number }) {
    ctx.save();
    ctx.translate(input.x, input.y);
    ctx.lineJoin = 'round';
    for (const [color, width] of [[VISUAL_PALETTE.paperBright, 5], [VISUAL_PALETTE.player, 2.5]] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      pathPolygon(ctx, PLAYER_BODY_POINTS);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(PLAYER_HEAD.x, PLAYER_HEAD.y, PLAYER_HEAD.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = VISUAL_PALETTE.player;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, input.hitRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawEnemy(ctx: CanvasRenderingContext2D, input: EnemyVisualInput) {
    ctx.save();
    ctx.translate(input.x, input.y);
    if (input.isBoss && input.bossPattern) {
      this.drawBoss(ctx, input);
    } else {
      this.drawMob(ctx, input);
    }
    ctx.restore();
    if (input.isBoss && input.patternPhase === 'warn') this.drawWindupMarker(ctx, input.x, input.y - input.radius * 1.55);
  }

  /** Amber "!" above a boss whose windup has started (style bible §10.1 rule 3). */
  private drawWindupMarker(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = SIGNAL.warn;
    ctx.strokeStyle = VISUAL_PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-5, -16);
    ctx.lineTo(5, -16);
    ctx.lineTo(3, 4);
    ctx.lineTo(-3, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 11, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Hostile lane telegraph (BUG-10): an amber hatched rectangle along the exact path an attack will take.
   * During preview the brush draws the lane out to its end; at imminent (65%) the rim thickens and the far
   * end gains an arrow head, so progress is readable without colour alone.
   */
  drawLaneTelegraph(
    ctx: CanvasRenderingContext2D,
    lane: { x1: number; y1: number; x2: number; y2: number; width: number; life: number; maxLife: number },
  ) {
    const phase = telegraphPhase(lane.life, lane.maxLife);
    const progress = clamp(1 - lane.life / Math.max(0.001, lane.maxLife), 0, 1);
    const length = Math.hypot(lane.x2 - lane.x1, lane.y2 - lane.y1);
    const drawn = length * clamp(progress / 0.65, 0, 1);
    const half = lane.width / 2;
    ctx.save();
    ctx.translate(lane.x1, lane.y1);
    ctx.rotate(Math.atan2(lane.y2 - lane.y1, lane.x2 - lane.x1));
    ctx.globalAlpha = phase === 'imminent' ? 0.34 : 0.2;
    ctx.fillStyle = SIGNAL.warnGlow;
    ctx.fillRect(0, -half, length, lane.width);
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = SIGNAL.warn;
    ctx.lineWidth = phase === 'imminent' ? 4.5 : 2.5;
    if (phase === 'preview') ctx.setLineDash([12, 8]);
    ctx.strokeRect(0, -half, drawn, lane.width);
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x + half < drawn; x += 22) {
      ctx.moveTo(x, half);
      ctx.lineTo(x + half, -half);
    }
    ctx.stroke();
    if (phase === 'imminent') {
      ctx.fillStyle = SIGNAL.warn;
      ctx.beginPath();
      ctx.moveTo(length + 18, 0);
      ctx.lineTo(length - 6, -half * 0.55);
      ctx.lineTo(length - 6, half * 0.55);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawMob(ctx: CanvasRenderingContext2D, input: EnemyVisualInput) {
    const profile = enemyArtFor(this.frame.chapter, input.tier, input.attackStyle);
    const direction = input.attackStyle === 'ranged' || profile.role === 'charger'
      ? Math.atan2(input.vy, input.vx)
      : input.variant * 0.45 + (
        this.frame.reducedMotion ? 0 : this.frame.elapsed * profile.rotationRate
      );
    const hit = input.hitFlash > 0;

    if (this.frame.detail === 'full') {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = VISUAL_PALETTE.ink;
      ctx.beginPath();
      ctx.ellipse(3, input.radius * 0.7, input.radius * 0.9, input.radius * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.rotate(direction);
    ctx.lineJoin = 'round';
    ctx.fillStyle = hit ? VISUAL_PALETTE.paperBright : profile.fill;
    ctx.strokeStyle = VISUAL_PALETTE.ink;
    ctx.lineWidth = input.tier === 'large' ? 4 : 3;

    this.drawMobHull(ctx, profile, input.radius, input.variant);
    ctx.fill();
    ctx.stroke();
    this.drawMobRoleMark(ctx, profile, input.radius);
    this.drawChapterMaterial(ctx, profile, input.radius, input.variant);

    if (input.attackStyle === 'ranged') {
      ctx.fillStyle = profile.core;
      ctx.strokeStyle = VISUAL_PALETTE.paperBright;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(input.radius * 0.58, 0, Math.max(3.5, input.radius * 0.18), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawMobHull(
    ctx: CanvasRenderingContext2D,
    profile: EnemyArtProfile,
    radius: number,
    variant: number,
  ) {
    if (profile.role === 'stalker') {
      pathPolygon(ctx, [
        [radius * 1.15, 0],
        [radius * 0.12, -radius * 0.78],
        [-radius * 0.72, -radius * 0.48],
        [-radius, 0],
        [-radius * 0.62, radius * 0.58],
        [radius * 0.12, radius * 0.82],
      ]);
    } else if (profile.role === 'charger') {
      pathPolygon(ctx, [
        [radius * 1.25, 0],
        [radius * 0.35, -radius * 0.88],
        [-radius * 0.78, -radius * 0.68],
        [-radius, 0],
        [-radius * 0.78, radius * 0.68],
        [radius * 0.35, radius * 0.88],
      ]);
    } else if (profile.role === 'shooter') {
      pathPolygon(ctx, [
        [radius, 0],
        [radius * 0.28, -radius * 0.78],
        [-radius * 0.74, -radius * 0.62],
        [-radius * 1.02, 0],
        [-radius * 0.74, radius * 0.62],
        [radius * 0.28, radius * 0.78],
      ]);
    } else {
      const inset = variant % 2 === 0 ? 0.72 : 0.62;
      pathPolygon(ctx, [
        [radius * 0.92, -radius * 0.72],
        [radius * 1.05, radius * 0.28],
        [radius * 0.5, radius],
        [-radius * 0.5, radius],
        [-radius * 1.05, radius * 0.28],
        [-radius * 0.92, -radius * 0.72],
        [0, -radius * inset],
      ]);
    }
  }

  private drawMobRoleMark(
    ctx: CanvasRenderingContext2D,
    profile: EnemyArtProfile,
    radius: number,
  ) {
    ctx.save();
    ctx.strokeStyle = VISUAL_PALETTE.paperBright;
    ctx.fillStyle = profile.core;
    ctx.lineWidth = Math.max(1.5, radius * 0.08);
    if (profile.role === 'stalker') {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.3, -radius * 0.2);
      ctx.lineTo(radius * 0.5, radius * 0.2);
      ctx.stroke();
    } else if (profile.role === 'charger') {
      pathPolygon(ctx, [
        [radius * 0.42, 0],
        [-radius * 0.18, -radius * 0.32],
        [-radius * 0.18, radius * 0.32],
      ]);
      ctx.fill();
      ctx.stroke();
    } else if (profile.role === 'shooter') {
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(radius * 0.24, 0);
      ctx.lineTo(radius * 0.72, 0);
      ctx.stroke();
    } else {
      ctx.strokeRect(-radius * 0.44, -radius * 0.34, radius * 0.88, radius * 0.68);
      ctx.beginPath();
      ctx.moveTo(-radius * 0.32, 0);
      ctx.lineTo(radius * 0.32, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawChapterMaterial(
    ctx: CanvasRenderingContext2D,
    profile: EnemyArtProfile,
    radius: number,
    variant: number,
  ) {
    if (this.frame.detail === 'minimal') return;
    ctx.save();
    ctx.strokeStyle = profile.accent;
    ctx.lineWidth = Math.max(1.5, radius * 0.07);
    ctx.globalAlpha = 0.96;
    if (profile.material === 'scrap') {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.6, -radius * 0.5);
      ctx.lineTo(radius * 0.42, radius * 0.54);
      ctx.moveTo(-radius * 0.12, -radius * 0.62);
      ctx.lineTo(radius * 0.62, radius * 0.08);
      ctx.stroke();
    } else if (profile.material === 'iron') {
      ctx.beginPath();
      ctx.arc(0, radius * 0.2, radius * 0.48, Math.PI, Math.PI * 2);
      ctx.moveTo(-radius * 0.48, radius * 0.2);
      ctx.lineTo(-radius * 0.48, radius * 0.52);
      ctx.moveTo(radius * 0.48, radius * 0.2);
      ctx.lineTo(radius * 0.48, radius * 0.52);
      ctx.stroke();
    } else if (profile.material === 'water') {
      for (let index = -1; index <= 1; index += 1) {
        ctx.beginPath();
        ctx.moveTo(-radius * 0.62, index * radius * 0.25);
        ctx.quadraticCurveTo(0, index * radius * 0.25 - radius * 0.2, radius * 0.62, index * radius * 0.25);
        ctx.stroke();
      }
    } else if (profile.material === 'clockwork') {
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(variant) * radius * 0.4, Math.sin(variant) * radius * 0.4);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-radius * 0.08, 0, radius * 0.5, Math.PI * 0.25, Math.PI * 1.75);
      ctx.arc(radius * 0.18, 0, radius * 0.4, Math.PI * 0.25, Math.PI * 1.75);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBoss(ctx: CanvasRenderingContext2D, input: EnemyVisualInput) {
    const profile = bossArtFor(input.bossId, this.frame.chapter);
    const radius = input.radius;
    const hit = input.hitFlash > 0;
    const rotation = this.frame.reducedMotion
      ? 0
      : this.frame.elapsed * (profile.body === 'herald' ? 0.5 : 0.08);

    if (this.frame.detail !== 'minimal') {
      ctx.save();
      ctx.globalAlpha = 0.24;
      ctx.fillStyle = VISUAL_PALETTE.ink;
      ctx.beginPath();
      ctx.ellipse(5, radius * 0.64, radius, radius * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.rotate(rotation);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fillStyle = hit ? VISUAL_PALETTE.paperBright : profile.fill;
    ctx.strokeStyle = VISUAL_PALETTE.ink;
    ctx.lineWidth = 5;
    this.drawBossHull(ctx, profile, radius);
    ctx.fill();
    ctx.stroke();
    this.drawBossArchitecture(ctx, profile, radius);
    this.drawBossState(ctx, profile, radius, input.bossPhase, input.legacyBoss);
  }

  private drawBossHull(
    ctx: CanvasRenderingContext2D,
    profile: BossArtProfile,
    radius: number,
  ) {
    if (profile.body === 'commander') {
      pathPolygon(ctx, [[0, -radius], [radius, -radius * 0.4], [radius * 0.72, radius * 0.82], [0, radius], [-radius * 0.72, radius * 0.82], [-radius, -radius * 0.4]]);
    } else if (profile.body === 'reliquary') {
      pathStar(ctx, 8, radius * 1.08, radius * 0.82, Math.PI / 8);
    } else if (profile.body === 'architect') {
      pathPolygon(ctx, [[-radius, -radius * 0.72], [radius, -radius * 0.72], [radius * 0.82, radius], [-radius * 0.82, radius]]);
    } else if (profile.body === 'executioner') {
      pathPolygon(ctx, [[0, -radius * 1.18], [radius * 0.7, -radius * 0.42], [radius, radius * 0.92], [0, radius * 0.64], [-radius, radius * 0.92], [-radius * 0.7, -radius * 0.42]]);
    } else if (profile.body === 'judge') {
      pathPolygon(ctx, [[0, -radius], [radius * 0.74, -radius * 0.62], [radius * 1.06, radius * 0.22], [radius * 0.52, radius], [-radius * 0.52, radius], [-radius * 1.06, radius * 0.22], [-radius * 0.74, -radius * 0.62]]);
    } else if (profile.body === 'butcher') {
      pathPolygon(ctx, [[-radius * 0.82, -radius], [radius * 0.5, -radius * 0.7], [radius, -radius * 0.12], [radius * 0.68, radius], [-radius * 0.94, radius * 0.72]]);
    } else if (profile.body === 'gaoler') {
      pathPolygon(ctx, [[0, -radius * 1.08], [radius * 0.9, -radius * 0.72], [radius, radius * 0.76], [0, radius], [-radius, radius * 0.76], [-radius * 0.9, -radius * 0.72]]);
    } else if (profile.body === 'bishop') {
      pathPolygon(ctx, [[0, -radius * 1.2], [radius * 0.3, -radius * 0.54], [radius, -radius * 0.24], [radius * 0.62, radius], [0, radius * 0.72], [-radius * 0.62, radius], [-radius, -radius * 0.24], [-radius * 0.3, -radius * 0.54]]);
    } else if (profile.body === 'maw') {
      pathStar(ctx, 7, radius * 1.1, radius * 0.72, -Math.PI / 2);
    } else if (profile.body === 'tide-king') {
      pathPolygon(ctx, [[-radius * 1.12, -radius * 0.3], [-radius * 0.38, -radius], [radius * 0.38, -radius], [radius * 1.12, -radius * 0.3], [radius * 0.72, radius * 0.76], [0, radius], [-radius * 0.72, radius * 0.76]]);
    } else if (profile.body === 'empress') {
      pathPolygon(ctx, [[0, -radius * 1.2], [radius * 0.62, -radius * 0.68], [radius * 0.48, -radius * 0.12], [radius, radius], [-radius, radius], [-radius * 0.48, -radius * 0.12], [-radius * 0.62, -radius * 0.68]]);
    } else if (profile.body === 'tyrant') {
      pathStar(ctx, 12, radius * 1.08, radius * 0.82, -Math.PI / 2);
    } else if (profile.body === 'herald') {
      pathStar(ctx, 10, radius * 1.14, radius * 0.66, rotationOffset(this.frame.elapsed, this.frame.reducedMotion));
    } else if (profile.body === 'director') {
      pathPolygon(ctx, [[0, -radius * 1.25], [radius * 0.58, -radius * 0.72], [radius * 0.86, radius * 0.82], [0, radius], [-radius * 0.86, radius * 0.82], [-radius * 0.58, -radius * 0.72]]);
    } else {
      pathPolygon(ctx, [[-radius * 1.12, -radius * 0.74], [radius * 1.12, -radius * 0.74], [radius * 0.62, radius * 0.88], [0, radius * 0.6], [-radius * 0.62, radius * 0.88]]);
    }
  }

  private drawBossArchitecture(
    ctx: CanvasRenderingContext2D,
    profile: BossArtProfile,
    radius: number,
  ) {
    ctx.save();
    ctx.strokeStyle = profile.accent;
    ctx.fillStyle = profile.core;
    ctx.lineWidth = 3;

    if (profile.body === 'commander') {
      ctx.beginPath();
      ctx.moveTo(-radius, -radius * 0.35);
      ctx.lineTo(-radius * 1.34, radius * 0.08);
      ctx.moveTo(radius, -radius * 0.35);
      ctx.lineTo(radius * 1.34, radius * 0.08);
      ctx.stroke();
    } else if (profile.body === 'reliquary' || profile.body === 'gaoler') {
      for (let x = -2; x <= 2; x += 1) {
        ctx.beginPath();
        ctx.moveTo(x * radius * 0.24, -radius * 0.72);
        ctx.lineTo(x * radius * 0.24, radius * 0.76);
        ctx.stroke();
      }
    } else if (profile.body === 'architect') {
      ctx.strokeRect(-radius * 0.68, -radius * 0.5, radius * 1.36, radius * 1.16);
      ctx.beginPath();
      ctx.moveTo(-radius * 0.68, -radius * 0.5);
      ctx.lineTo(radius * 0.68, radius * 0.66);
      ctx.moveTo(radius * 0.68, -radius * 0.5);
      ctx.lineTo(-radius * 0.68, radius * 0.66);
      ctx.stroke();
    } else if (profile.body === 'executioner' || profile.body === 'butcher') {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.78, -radius * 0.76);
      ctx.lineTo(radius * 0.72, radius * 0.72);
      ctx.stroke();
      pathPolygon(ctx, [[radius * 0.56, radius * 0.48], [radius * 1.22, radius * 0.72], [radius * 0.72, radius * 1.04]]);
      ctx.fill();
      ctx.stroke();
    } else if (profile.body === 'judge' || profile.body === 'balance') {
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.64);
      ctx.lineTo(0, radius * 0.62);
      ctx.moveTo(-radius * 0.76, -radius * 0.18);
      ctx.lineTo(radius * 0.76, -radius * 0.18);
      ctx.stroke();
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(side * radius * 0.62, radius * 0.22, radius * 0.22, 0, Math.PI);
        ctx.stroke();
      }
    } else if (profile.body === 'bishop') {
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.95);
      ctx.lineTo(0, radius * 0.72);
      ctx.moveTo(-radius * 0.62, -radius * 0.28);
      ctx.lineTo(radius * 0.62, -radius * 0.28);
      ctx.stroke();
    } else if (profile.body === 'maw') {
      ctx.beginPath();
      ctx.ellipse(0, radius * 0.08, radius * 0.66, radius * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (let tooth = -2; tooth <= 2; tooth += 1) {
        ctx.beginPath();
        ctx.moveTo(tooth * radius * 0.2, -radius * 0.18);
        ctx.lineTo((tooth + 0.35) * radius * 0.17, radius * 0.16);
        ctx.stroke();
      }
    } else if (profile.body === 'tide-king') {
      for (let line = -1; line <= 1; line += 1) {
        ctx.beginPath();
        ctx.moveTo(-radius * 0.78, line * radius * 0.28);
        ctx.bezierCurveTo(-radius * 0.25, line * radius * 0.28 - radius * 0.3, radius * 0.25, line * radius * 0.28 + radius * 0.3, radius * 0.78, line * radius * 0.28);
        ctx.stroke();
      }
    } else if (profile.body === 'empress') {
      pathPolygon(ctx, [[0, -radius], [radius * 0.45, -radius * 0.58], [radius * 0.18, -radius * 0.32], [-radius * 0.18, -radius * 0.32], [-radius * 0.45, -radius * 0.58]]);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-radius * 0.66, radius * 0.72);
      ctx.lineTo(radius * 0.66, radius * 0.72);
      ctx.stroke();
    } else if (profile.body === 'tyrant') {
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.64, 0, Math.PI * 2);
      ctx.stroke();
      for (let hand = 0; hand < 4; hand += 1) {
        const angle = hand * Math.PI / 2 + this.frame.elapsed * (this.frame.reducedMotion ? 0 : 0.45);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * radius * 0.58, Math.sin(angle) * radius * 0.58);
        ctx.stroke();
      }
    } else if (profile.body === 'herald') {
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-radius * 0.4, -radius * 0.4);
      ctx.lineTo(radius * 0.4, radius * 0.4);
      ctx.moveTo(radius * 0.4, -radius * 0.4);
      ctx.lineTo(-radius * 0.4, radius * 0.4);
      ctx.stroke();
    } else if (profile.body === 'director') {
      ctx.beginPath();
      ctx.arc(-radius * 0.08, 0, radius * 0.62, Math.PI * 0.25, Math.PI * 1.75);
      ctx.arc(radius * 0.2, 0, radius * 0.52, Math.PI * 0.25, Math.PI * 1.75);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.23, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = VISUAL_PALETTE.paperBright;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  private drawBossState(
    ctx: CanvasRenderingContext2D,
    profile: BossArtProfile,
    radius: number,
    phase: 1 | 2 | 3,
    legacyBoss: boolean,
  ) {
    if (phase > 1) {
      ctx.save();
      ctx.strokeStyle = phase === 3 ? VISUAL_PALETTE.danger : profile.accent;
      ctx.lineWidth = phase === 3 ? 5 : 3;
      if (phase === 2) ctx.setLineDash([9, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.frame.bossEnraged) {
      ctx.save();
      ctx.strokeStyle = VISUAL_PALETTE.danger;
      ctx.fillStyle = VISUAL_PALETTE.danger;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.96;
      const spikeRotation = this.frame.reducedMotion ? 0 : this.frame.elapsed * 0.65;
      pathStar(ctx, 10, radius * 1.58, radius * 1.38, spikeRotation);
      ctx.stroke();
      for (let index = 0; index < 4; index += 1) {
        const angle = index * Math.PI / 2 + spikeRotation;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * radius * 1.08, Math.sin(angle) * radius * 1.08);
        ctx.lineTo(Math.cos(angle) * radius * 1.5, Math.sin(angle) * radius * 1.5);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (legacyBoss) {
      ctx.save();
      ctx.strokeStyle = profile.accent;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawFriendlyProjectile(
    ctx: CanvasRenderingContext2D,
    input: FriendlyProjectileVisualInput,
  ) {
    const profile = SKILL_PROJECTILE_ART[input.skillId];
    const angle = Math.atan2(input.vy, input.vx) + (input.returning ? Math.PI : 0);
    const alpha = normalizedLifetime(input.life, input.maxLife);
    ctx.save();
    ctx.translate(input.x, input.y);
    ctx.rotate(angle);
    if (this.frame.detail !== 'minimal') {
      ctx.globalAlpha = 0.18 + alpha * 0.18;
      ctx.strokeStyle = profile.trail;
      ctx.lineWidth = Math.max(2, input.radius * 0.7);
      ctx.beginPath();
      ctx.moveTo(-input.radius * 7, 0);
      ctx.lineTo(-input.radius * 1.2, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    this.drawProjectileShape(ctx, profile, input.radius, false);
    ctx.restore();
  }

  drawBeam(
    ctx: CanvasRenderingContext2D,
    input: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      life: number;
      maxLife: number;
      owner?: EffectOwner;
    },
  ) {
    const alpha = normalizedLifetime(input.life, input.maxLife);
    const hostile = input.owner === 'hostile';
    ctx.save();
    ctx.globalAlpha = hostile ? Math.max(0.55, alpha) : alpha;
    ctx.lineCap = 'round';
    ctx.strokeStyle = VISUAL_PALETTE.ink;
    ctx.lineWidth = input.width;
    ctx.beginPath();
    ctx.moveTo(input.x1, input.y1);
    ctx.lineTo(input.x2, input.y2);
    ctx.stroke();
    if (hostile) {
      // Enemy lanes are amber telegraph hatching, never the player's cyan beam style.
      ctx.setLineDash([10, 7]);
      ctx.strokeStyle = SIGNAL.warn;
      ctx.lineWidth = Math.max(3, input.width * 0.62);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = VISUAL_PALETTE.player;
      ctx.lineWidth = Math.max(3, input.width * 0.42);
      ctx.stroke();
      ctx.strokeStyle = VISUAL_PALETTE.paperBright;
      ctx.lineWidth = Math.max(1.5, input.width * 0.16);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawChain(
    ctx: CanvasRenderingContext2D,
    points: ReadonlyArray<{ x: number; y: number }>,
    life: number,
    maxLife: number,
  ) {
    if (points.length < 2) return;
    const alpha = normalizedLifetime(life, maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = VISUAL_PALETTE.ink;
    ctx.lineWidth = 6;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.strokeStyle = VISUAL_PALETTE.player;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = VISUAL_PALETTE.paperBright;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  drawHostileProjectile(
    ctx: CanvasRenderingContext2D,
    input: HostileProjectileVisualInput,
  ) {
    const profile = HOSTILE_PROJECTILE_ART[input.kind];
    const angle = Math.atan2(input.vy, input.vx);
    ctx.save();
    ctx.translate(input.x, input.y);
    ctx.rotate(angle);
    if (this.frame.detail === 'full') {
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = profile.trail;
      ctx.beginPath();
      ctx.arc(0, 0, input.radius * 1.72, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const rotation = input.kind === 'saw' && !this.frame.reducedMotion
      ? this.frame.elapsed * 5
      : 0;
    ctx.rotate(rotation);
    this.drawProjectileShape(ctx, profile, input.radius, true);
    ctx.restore();
  }

  private drawProjectileShape(
    ctx: CanvasRenderingContext2D,
    profile: ProjectileArtProfile,
    radius: number,
    hostile: boolean,
  ) {
    ctx.fillStyle = profile.fill;
    ctx.strokeStyle = hostile ? VISUAL_PALETTE.ink : profile.core;
    ctx.lineWidth = hostile ? 3 : 2.5;
    if (profile.shape === 'needle') {
      pathPolygon(ctx, [
        [radius * 2.4, 0],
        [-radius * 1.2, -radius * 0.75],
        [-radius * 0.62, 0],
        [-radius * 1.2, radius * 0.75],
      ]);
    } else if (profile.shape === 'knife') {
      pathPolygon(ctx, [
        [radius * 1.7, 0],
        [radius * 0.2, -radius],
        [-radius * 1.3, -radius * 0.32],
        [-radius * 0.5, radius * 0.82],
      ]);
    } else if (profile.shape === 'spark') {
      pathStar(ctx, 4, radius * 1.55, radius * 0.46, 0);
    } else if (profile.shape === 'spear') {
      pathPolygon(ctx, [
        [radius * 2.2, 0],
        [radius * 0.2, -radius * 0.72],
        [-radius * 1.4, -radius * 0.38],
        [-radius * 0.9, 0],
        [-radius * 1.4, radius * 0.38],
        [radius * 0.2, radius * 0.72],
      ]);
    } else if (profile.shape === 'sigil') {
      pathStar(ctx, 6, radius * 1.2, radius * 0.88, Math.PI / 6);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = profile.core;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(2, radius * 0.34), 0, Math.PI * 2);
    ctx.stroke();
  }

  /** @param opacity extra fade, e.g. a root zone the player is currently immune to (BUG-13). */
  drawHazard(ctx: CanvasRenderingContext2D, hazard: Hazard, opacity = 1) {
    const profile = HAZARD_ART[hazard.kind];
    const alpha = Number.isFinite(hazard.life)
      ? normalizedLifetime(hazard.life, hazard.maxLife)
      : 1;
    const phase = telegraphPhase(hazard.life, hazard.maxLife, hazard.triggered);
    const pulse = this.frame.reducedMotion ? 0 : motionWave(this.frame.elapsed, 14, 4);

    ctx.save();
    ctx.strokeStyle = profile.color;
    ctx.fillStyle = profile.fill;
    ctx.lineWidth = phase === 'imminent' ? 5 : 3;
    ctx.globalAlpha = (hazard.kind === 'warning' ? 0.34 : 0.22 + alpha * 0.42) * clamp(opacity, 0, 1);

    if (hazard.kind === 'warning' || hazard.kind === 'shock') {
      if (phase === 'preview') ctx.setLineDash([12, 9]);
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
      if (phase === 'active') ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      const ticks = hazard.kind === 'shock' ? 12 : 8;
      for (let index = 0; index < ticks; index += 1) {
        const angle = (Math.PI * 2 * index) / ticks;
        const inner = hazard.radius - (phase === 'imminent' ? 10 + pulse : 5);
        ctx.beginPath();
        ctx.moveTo(hazard.x + Math.cos(angle) * inner, hazard.y + Math.sin(angle) * inner);
        ctx.lineTo(hazard.x + Math.cos(angle) * hazard.radius, hazard.y + Math.sin(angle) * hazard.radius);
        ctx.stroke();
      }
    } else if (profile.edge === 'flow') {
      ctx.beginPath();
      ctx.ellipse(hazard.x, hazard.y, hazard.radius * 1.18, hazard.radius * 0.82, this.frame.chapter * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      for (let index = -2; index <= 2; index += 1) {
        const y = hazard.y + index * hazard.radius * 0.22;
        ctx.beginPath();
        ctx.moveTo(hazard.x - hazard.radius * 0.78, y);
        ctx.quadraticCurveTo(hazard.x, y - hazard.radius * 0.26, hazard.x + hazard.radius * 0.78, y);
        ctx.stroke();
      }
    } else if (profile.edge === 'square') {
      ctx.fillRect(
        hazard.x - hazard.radius,
        hazard.y - hazard.radius,
        hazard.radius * 2,
        hazard.radius * 2,
      );
      ctx.strokeRect(
        hazard.x - hazard.radius,
        hazard.y - hazard.radius,
        hazard.radius * 2,
        hazard.radius * 2,
      );
      ctx.beginPath();
      ctx.moveTo(hazard.x - hazard.radius, hazard.y - hazard.radius);
      ctx.lineTo(hazard.x + hazard.radius, hazard.y + hazard.radius);
      ctx.moveTo(hazard.x + hazard.radius, hazard.y - hazard.radius);
      ctx.lineTo(hazard.x - hazard.radius, hazard.y + hazard.radius);
      ctx.stroke();
    } else if (profile.edge === 'spiral') {
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
      ctx.fill();
      for (let ring = 20; ring < hazard.radius; ring += 22) {
        const rotation = this.frame.reducedMotion ? 0 : this.frame.elapsed * 1.6;
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, ring, rotation, rotation + Math.PI * 1.5);
        ctx.stroke();
      }
    } else if (profile.edge === 'burst') {
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        ctx.beginPath();
        ctx.moveTo(hazard.x + Math.cos(angle) * hazard.radius * 0.2, hazard.y + Math.sin(angle) * hazard.radius * 0.2);
        ctx.lineTo(hazard.x + Math.cos(angle) * hazard.radius, hazard.y + Math.sin(angle) * hazard.radius);
        ctx.stroke();
      }
    } else {
      ctx.setLineDash(hazard.kind === 'null' ? [10, 10] : []);
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
    const art = CHAPTER_ART[this.frame.chapter];
    const inset = clamp(Math.min(obstacle.w, obstacle.h) * 0.11, 6, 14);
    const centerX = obstacle.x + obstacle.w / 2;
    const centerY = obstacle.y + obstacle.h / 2;
    const left = obstacle.x + inset;
    const top = obstacle.y + inset;
    const width = Math.max(1, obstacle.w - inset * 2);
    const height = Math.max(1, obstacle.h - inset * 2);

    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = VISUAL_PALETTE.ink;
    ctx.fillRect(obstacle.x + 9, obstacle.y + 12, obstacle.w, obstacle.h);
    ctx.globalAlpha = 1;

    ctx.fillStyle = art.accent;
    pathPolygon(ctx, [
      [obstacle.x, obstacle.y],
      [obstacle.x + 10, obstacle.y - 8],
      [obstacle.x + obstacle.w + 10, obstacle.y - 8],
      [obstacle.x + obstacle.w, obstacle.y],
    ]);
    drawPaperCut(ctx, art.accent, VISUAL_PALETTE.ink, 3);

    ctx.fillStyle = obstacle.kind === 'pillar' ? VISUAL_PALETTE.inkSoft : art.surface;
    ctx.strokeStyle = VISUAL_PALETTE.ink;
    ctx.lineWidth = 3.5;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    ctx.strokeRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    ctx.strokeStyle = obstacle.kind === 'pillar' ? art.surface : VISUAL_PALETTE.paperBright;
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, width, height);

    ctx.fillStyle = VISUAL_PALETTE.ink;
    for (const [x, y] of [
      [obstacle.x + 7, obstacle.y + 7],
      [obstacle.x + obstacle.w - 7, obstacle.y + 7],
      [obstacle.x + 7, obstacle.y + obstacle.h - 7],
      [obstacle.x + obstacle.w - 7, obstacle.y + obstacle.h - 7],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.frame.detail !== 'minimal') {
      this.drawObstacleMaterial(ctx, art.obstacleMaterial, {
        left,
        top,
        width,
        height,
        centerX,
        centerY,
        accent: art.accent,
        id: obstacle.id,
      });
    }
    ctx.restore();
  }

  private drawObstacleMaterial(
    ctx: CanvasRenderingContext2D,
    material: (typeof CHAPTER_ART)[1]['obstacleMaterial'],
    geometry: {
      left: number;
      top: number;
      width: number;
      height: number;
      centerX: number;
      centerY: number;
      accent: string;
      id: number;
    },
  ) {
    const { left, top, width, height, centerX, centerY, accent, id } = geometry;
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.9;

    if (material === 'plaster') {
      const spacing = Math.max(16, Math.min(28, height / 3));
      for (let y = top + spacing; y < top + height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(left + 3, y);
        ctx.lineTo(left + width - 3, y - 5);
        ctx.stroke();
      }
      if (width > 54 && height > 42) {
        ctx.fillStyle = VISUAL_PALETTE.paperBright;
        ctx.fillRect(centerX - 18, centerY - 22, 36, 44);
        ctx.strokeStyle = VISUAL_PALETTE.ink;
        ctx.strokeRect(centerX - 18, centerY - 22, 36, 44);
        ctx.beginPath();
        ctx.moveTo(centerX - 11, centerY - 13);
        ctx.lineTo(centerX + 11, centerY + 13);
        ctx.moveTo(centerX + 11, centerY - 13);
        ctx.lineTo(centerX - 11, centerY + 13);
        ctx.stroke();
      }
    } else if (material === 'iron') {
      const arch = Math.max(10, Math.min(width * 0.38, height * 0.42));
      ctx.beginPath();
      ctx.arc(centerX, top + height * 0.62, arch, Math.PI, Math.PI * 2);
      ctx.lineTo(centerX + arch, top + height * 0.88);
      ctx.moveTo(centerX - arch, top + height * 0.62);
      ctx.lineTo(centerX - arch, top + height * 0.88);
      ctx.stroke();
      for (let x = centerX - arch * 0.6; x <= centerX + arch * 0.6; x += Math.max(8, arch * 0.4)) {
        ctx.beginPath();
        ctx.moveTo(x, top + height * 0.38);
        ctx.lineTo(x, top + height * 0.84);
        ctx.stroke();
      }
    } else if (material === 'stone') {
      for (let index = -1; index <= 1; index += 1) {
        const y = centerY + index * Math.min(18, height * 0.22);
        ctx.beginPath();
        ctx.moveTo(left + 3, y);
        ctx.bezierCurveTo(left + width * 0.28, y - 10, left + width * 0.68, y + 10, left + width - 3, y);
        ctx.stroke();
      }
    } else if (material === 'brass') {
      const radius = Math.max(10, Math.min(width, height) * 0.3);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      for (let index = 0; index < 8; index += 1) {
        const angle = index * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * radius * 0.72, centerY + Math.sin(angle) * radius * 0.72);
        ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + radius * 0.14, centerY - radius * 0.72);
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + radius * 0.58, centerY + radius * 0.2);
      ctx.stroke();
    } else {
      const radius = Math.max(10, Math.min(width, height) * 0.3);
      ctx.fillStyle = '#18151c';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius * 1.24, radius, id * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.42, Math.PI * 0.12, Math.PI * 1.88);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = VISUAL_PALETTE.ink;
    ctx.lineWidth = 1.5;
    const crack = ((id % 5) - 2) * Math.min(9, width * 0.08);
    ctx.beginPath();
    ctx.moveTo(centerX + crack, top + 3);
    ctx.lineTo(centerX + crack - 7, centerY - 3);
    ctx.lineTo(centerX + crack + 5, centerY + 7);
    ctx.lineTo(centerX + crack - 3, top + height - 3);
    ctx.stroke();
    ctx.restore();
  }

  drawPickup(ctx: CanvasRenderingContext2D, pickup: Pickup, x: number, y: number) {
    const pulse = this.frame.reducedMotion ? 0 : motionWave(this.frame.elapsed + pickup.id, 4, 1.5);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(pickup.kind === 'xp' && !this.frame.reducedMotion ? this.frame.elapsed * 0.6 : 0);
    ctx.strokeStyle = VISUAL_PALETTE.ink;
    ctx.fillStyle = pickup.kind === 'xp' ? SIGNAL.rewardGlow : NEUTRAL.coin;
    ctx.lineWidth = 2.5;
    if (pickup.kind === 'xp') {
      pathPolygon(ctx, [[0, -9 - pulse], [8 + pulse, 0], [0, 9 + pulse], [-8 - pulse, 0]]);
    } else {
      pathStar(ctx, 6, pickup.radius + pulse, pickup.radius * 0.86 + pulse, Math.PI / 6);
    }
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = pickup.kind === 'xp' ? SIGNAL.reward : VISUAL_PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(3, 0);
    ctx.stroke();
    ctx.restore();
  }

  drawOrbitBlade(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    awakened: boolean,
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = VISUAL_PALETTE.paperBright;
    ctx.strokeStyle = awakened ? VISUAL_PALETTE.inkSoft : VISUAL_PALETTE.ink;
    ctx.lineWidth = awakened ? 3.5 : 3;
    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.quadraticCurveTo(18, 0, 0, 19);
    ctx.quadraticCurveTo(7, 0, 0, -19);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = VISUAL_PALETTE.player;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(10, 0, 0, 12);
    ctx.stroke();
    ctx.restore();
  }

  drawImpactRing(
    ctx: CanvasRenderingContext2D,
    input: {
      x: number;
      y: number;
      radius: number;
      life: number;
      maxLife: number;
      tier: 'heavy' | 'critical';
      owner?: EffectOwner;
    },
  ) {
    const alpha = normalizedLifetime(input.life, input.maxLife);
    const expansion = this.frame.reducedMotion ? 1 : 1 + (1 - alpha) * 0.45;
    ctx.save();
    ctx.translate(input.x, input.y);
    ctx.globalAlpha = this.frame.reducedMotion ? 0.82 : alpha;
    ctx.strokeStyle = input.owner === 'hostile'
      ? SIGNAL.warn
      : input.tier === 'critical'
        ? VISUAL_PALETTE.ink
        : CHAPTER_ART[this.frame.chapter].accent;
    ctx.lineWidth = input.tier === 'critical' ? 4 : 2;
    if (this.frame.reducedMotion) ctx.setLineDash([7, 5]);
    const radius = input.radius * expansion;
    const segments = input.tier === 'critical' ? 8 : 4;
    for (let index = 0; index < segments; index += 1) {
      const start = index * Math.PI * 2 / segments;
      ctx.beginPath();
      ctx.arc(0, 0, radius, start, start + Math.PI / segments);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawParticle(
    ctx: CanvasRenderingContext2D,
    input: {
      id: number;
      x: number;
      y: number;
      size: number;
      color: string;
      life: number;
      maxLife: number;
    },
  ) {
    const alpha = normalizedLifetime(input.life, input.maxLife);
    ctx.save();
    ctx.translate(input.x, input.y);
    ctx.rotate(this.frame.reducedMotion ? input.id * 0.31 : input.id * 0.31 + this.frame.elapsed * 2.2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = input.color;
    if (this.frame.detail === 'minimal' || input.size < 3) {
      ctx.fillRect(-input.size / 2, -input.size / 2, input.size, input.size);
    } else {
      pathPolygon(ctx, [
        [input.size * 0.85, 0],
        [0, input.size * 0.42],
        [-input.size * 0.85, 0],
        [0, -input.size * 0.42],
      ]);
      ctx.fill();
    }
    ctx.restore();
  }

  drawDamageNumber(
    ctx: CanvasRenderingContext2D,
    input: {
      x: number;
      y: number;
      value: number;
      crit: boolean;
      life: number;
      maxLife?: number;
      owner?: EffectOwner;
    },
  ) {
    // Fade relative to each number's own lifetime so every number starts fully opaque (BUG-15).
    const alpha = clamp(input.life / Math.max(0.001, input.maxLife ?? (input.crit ? 0.9 : 0.72)), 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${input.crit ? 900 : 800} ${input.crit ? 17 : 14}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Coral marks damage the player takes; damage the player deals stays ink (crits are larger with "!").
    ctx.fillStyle = input.owner === 'hostile' ? VISUAL_PALETTE.danger : VISUAL_PALETTE.ink;
    ctx.strokeStyle = VISUAL_PALETTE.paperBright;
    ctx.lineWidth = input.crit ? 5 : 4;
    const text = input.crit ? `${Math.round(input.value)}!` : `${Math.round(input.value)}`;
    ctx.strokeText(text, input.x, input.y);
    ctx.fillText(text, input.x, input.y);
    ctx.restore();
  }

  drawHealthBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    ratio: number,
  ) {
    const safeRatio = clamp(ratio, 0, 1);
    ctx.save();
    ctx.fillStyle = VISUAL_PALETTE.paperBright;
    ctx.strokeStyle = VISUAL_PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.fillRect(x - width / 2, y, width, height);
    ctx.strokeRect(x - width / 2, y, width, height);
    ctx.fillStyle = safeRatio <= 0.25 ? VISUAL_PALETTE.danger : VISUAL_PALETTE.ink;
    ctx.fillRect(x - width / 2, y, width * safeRatio, height);
    ctx.restore();
  }
}

function rotationOffset(elapsed: number, reducedMotion: boolean) {
  return reducedMotion ? -Math.PI / 2 : elapsed * 0.7 - Math.PI / 2;
}
