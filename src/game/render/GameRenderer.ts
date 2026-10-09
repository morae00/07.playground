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
import { NEUTRAL, SIGNAL, rgba } from './palette.ts';
import type { RenderFrameSnapshot } from './renderSnapshot.ts';
import {
  CHAPTER_ART,
  HAZARD_ART,
  HOSTILE_PROJECTILE_ART,
  VISUAL_PALETTE,
  enemyRoleFor,
  type HazardArtProfile,
  type HazardGlyph,
  type ProjectileArtProfile,
} from './visualRegistry.ts';

export type PlayerVisualInput = {
  x: number;
  y: number;
  aimAngle: number;
  moving: boolean;
  shield: number;
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
  /** Where the body points, in radians (FX-01: its shield, dash, aim, or walk; no spinning). */
  heading: number;
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
  /** 0..1; shots pushed over the cap fade out (SYS-04). */
  alpha?: number;
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

/** Radius of the hero's load-failure silhouette (TEC-10), a little larger than its hit circle so it reads. */
const PLAYER_SILHOUETTE_RADIUS = 20;

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

export class GameRenderer {
  private frame = DEFAULT_FRAME;
  /** Hazard ground textures by owner and colour; undefined where no pattern canvas can be made (headless). */
  private readonly hazardTextures = new Map<string, CanvasPattern | undefined>();

  beginFrame(frame: RenderFrameSnapshot) {
    this.frame = frame;
  }

  drawPlayer(ctx: CanvasRenderingContext2D, input: PlayerVisualInput) {
    this.drawPlayerGround(ctx, input);
    this.drawPlayerBody(ctx, input);
  }

  /** The cyan foot signal, drawn on the ground layer under every body (TEC-12). */
  drawPlayerGround(ctx: CanvasRenderingContext2D, input: PlayerVisualInput) {
    ctx.save();
    ctx.translate(input.x, input.y);
    this.drawPlayerSignal(ctx, input);
    ctx.restore();
  }

  /** The figure, drawn in the depth-sorted body layer (TEC-12). */
  drawPlayerBody(ctx: CanvasRenderingContext2D, input: PlayerVisualInput) {
    ctx.save();
    ctx.translate(input.x, input.y);
    this.drawPlayerSilhouette(ctx, input, false);
    ctx.restore();
  }

  drawMirrorClone(ctx: CanvasRenderingContext2D, input: CloneVisualInput) {
    ctx.save();
    ctx.translate(input.x, input.y);
    ctx.globalAlpha = clamp(input.alpha, 0.18, 0.42);
    this.drawPlayerSilhouette(ctx, input, true);
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

  /**
   * The hero when its sprite is missing (TEC-10): a paper disc in the ally rim on the hit circle, with an ink chevron
   * toward the aim. The mirror clone is the same disc with a dashed rim; a shield adds the dashed outer ring.
   */
  private drawPlayerSilhouette(ctx: CanvasRenderingContext2D, input: PlayerVisualInput, clone: boolean) {
    const radius = PLAYER_SILHOUETTE_RADIUS;
    const aimX = Math.cos(input.aimAngle);
    const aimY = Math.sin(input.aimAngle);
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.fillStyle = VISUAL_PALETTE.paperBright;
    ctx.strokeStyle = VISUAL_PALETTE.player;
    ctx.lineWidth = 4;
    if (clone) ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = VISUAL_PALETTE.ink;
    pathPolygon(ctx, [
      [aimX * radius * 0.7, aimY * radius * 0.7],
      [(-aimY * 0.45 - aimX * 0.3) * radius, (aimX * 0.45 - aimY * 0.3) * radius],
      [(aimY * 0.45 - aimX * 0.3) * radius, (-aimX * 0.45 - aimY * 0.3) * radius],
    ]);
    ctx.fill();
    if (input.shield > 0) {
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, radius + 12, 0, Math.PI * 2);
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
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_SILHOUETTE_RADIUS, 0, Math.PI * 2);
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

  /**
   * An enemy when its sprite is missing (TEC-10): the hit circle in ink with the hostile rim and its role's glyph,
   * turned to the heading: the stalker a small wedge, the charger a long one, the shooter a barrel on a stock, the
   * warden a square. A hit flashes it paper, so a strike still reads.
   */
  private drawMob(ctx: CanvasRenderingContext2D, input: EnemyVisualInput) {
    const role = enemyRoleFor(input.tier, input.attackStyle);
    const hit = input.hitFlash > 0;
    const glyph = input.radius * 0.5;
    ctx.lineJoin = 'round';
    ctx.fillStyle = hit ? VISUAL_PALETTE.paperBright : VISUAL_PALETTE.ink;
    ctx.strokeStyle = VISUAL_PALETTE.danger;
    ctx.lineWidth = input.tier === 'large' ? 4 : 3;
    ctx.beginPath();
    ctx.arc(0, 0, input.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(input.heading);
    ctx.fillStyle = hit ? VISUAL_PALETTE.ink : VISUAL_PALETTE.paperBright;
    if (role === 'stalker') {
      pathPolygon(ctx, [[glyph, 0], [-glyph * 0.6, -glyph * 0.8], [-glyph * 0.6, glyph * 0.8]]);
    } else if (role === 'charger') {
      pathPolygon(ctx, [[glyph * 1.3, 0], [-glyph * 0.8, -glyph * 0.6], [-glyph * 0.35, 0], [-glyph * 0.8, glyph * 0.6]]);
    } else if (role === 'shooter') {
      ctx.beginPath();
      ctx.rect(-glyph * 0.7, -glyph * 0.8, glyph * 0.45, glyph * 1.6);
      ctx.rect(-glyph * 0.3, -glyph * 0.2, glyph * 1.5, glyph * 0.4);
    } else {
      ctx.beginPath();
      ctx.rect(-glyph * 0.7, -glyph * 0.7, glyph * 1.4, glyph * 1.4);
    }
    ctx.fill();
  }

  /**
   * A boss when its sprite is missing (TEC-10): every boss has kit art now, so this draws only while its pack is
   * missing. Like an enemy, the hit circle in ink with the hostile rim, heavier, and an upright paper crown; the
   * phase rings and the enraged spikes still show what the boss bar says. A hit inverts it to paper.
   */
  private drawBoss(ctx: CanvasRenderingContext2D, input: EnemyVisualInput) {
    const radius = input.radius;
    const hit = input.hitFlash > 0;
    const crown = radius * 0.5;
    ctx.lineJoin = 'round';
    ctx.fillStyle = hit ? VISUAL_PALETTE.paperBright : VISUAL_PALETTE.ink;
    ctx.strokeStyle = VISUAL_PALETTE.danger;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hit ? VISUAL_PALETTE.ink : VISUAL_PALETTE.paperBright;
    pathPolygon(ctx, [[-crown, crown * 0.5], [-crown, -crown * 0.5], [-crown * 0.5, 0], [0, -crown * 0.7], [crown * 0.5, 0], [crown, -crown * 0.5], [crown, crown * 0.5]]);
    ctx.fill();
    this.drawBossState(ctx, radius, input.bossPhase, input.legacyBoss);
  }

  private drawBossState(ctx: CanvasRenderingContext2D, radius: number, phase: 1 | 2 | 3, legacyBoss: boolean) {
    if (phase > 1) {
      ctx.save();
      ctx.strokeStyle = VISUAL_PALETTE.danger;
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
      ctx.strokeStyle = VISUAL_PALETTE.paperBright;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /** A player's shot while the skill art is missing (FX-06): a cyan bead on ink at its hit size. */
  drawFriendlyProjectile(ctx: CanvasRenderingContext2D, input: FriendlyProjectileVisualInput) {
    ctx.save();
    ctx.fillStyle = VISUAL_PALETTE.player;
    ctx.strokeStyle = VISUAL_PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(input.x, input.y, input.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
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
    // A player's beam hits `width` either side of its axis (FX-06), so its ink band is twice that wide.
    ctx.lineWidth = hostile ? input.width : input.width * 2;
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
      ctx.lineWidth = Math.max(3, input.width * 0.84);
      ctx.stroke();
      ctx.strokeStyle = VISUAL_PALETTE.paperBright;
      ctx.lineWidth = Math.max(1.5, input.width * 0.32);
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
    const alpha = input.alpha ?? 1;
    ctx.save();
    ctx.translate(input.x, input.y);
    ctx.rotate(angle);
    if (this.frame.detail === 'full') {
      ctx.globalAlpha = 0.2 * alpha;
      ctx.fillStyle = profile.trail;
      ctx.beginPath();
      ctx.arc(0, 0, input.radius * 1.72, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = alpha;
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
  /**
   * Hazards in the kit's ownership language (ART-06, PN.env.hazard), always the circle they hit with. Hostile ground
   * is hatched in its signal colour inside an ink ring with an amber rim; ally ground is dotted inside a cyan running
   * stitch; neutral ground is an ink wash. A glyph at the centre names the effect. Timed hazards (shock, and the
   * ally landing warning) draw their outline as it fills: a dashed arc during preview, a heavy ring with ticks once
   * imminent, and a coral (or ally) fill when active.
   */
  drawHazard(ctx: CanvasRenderingContext2D, hazard: Hazard, opacity = 1) {
    const profile = HAZARD_ART[hazard.kind];
    const timed = Number.isFinite(hazard.maxLife) && (hazard.kind === 'shock' || hazard.kind === 'warning');
    const phase = timed ? telegraphPhase(hazard.life, hazard.maxLife, hazard.triggered) : 'active';
    const progress = timed ? clamp(1 - hazard.life / hazard.maxLife, 0, 1) : 1;
    const { x, y, radius } = hazard;
    const ally = profile.owner === 'ally';
    ctx.save();
    ctx.globalAlpha = clamp(opacity, 0, 1) * (Number.isFinite(hazard.life) && !timed ? 0.4 + 0.6 * normalizedLifetime(hazard.life, hazard.maxLife) : 1);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (phase === 'active') {
      ctx.fillStyle = timed && !ally ? rgba(SIGNAL.hostile, 0.5) : profile.fill;
      ctx.fill();
      // A null zone is an erased plane (kit): no texture inside, only its dotted rim and mark.
      const texture = hazard.kind === 'null' ? undefined : this.hazardTexture(ctx, profile);
      if (texture) {
        ctx.fillStyle = texture;
        ctx.fill();
      }
    }
    // The rim: ink under the owner's colour, a running stitch for the player's own ground.
    const drawn = phase === 'preview' ? progress / 0.65 : 1;
    const start = -Math.PI / 2;
    ctx.lineWidth = phase === 'imminent' ? 7 : 5;
    ctx.strokeStyle = NEUTRAL.ink;
    ctx.beginPath();
    ctx.arc(x, y, radius, start, start + drawn * Math.PI * 2);
    ctx.stroke();
    if (phase === 'preview') {
      // The part the brush has not reached yet: a dotted guide.
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.arc(x, y, radius, start + drawn * Math.PI * 2, start + Math.PI * 2);
      ctx.stroke();
    }
    if (profile.owner !== 'neutral') {
      ctx.strokeStyle = profile.color;
      ctx.lineWidth = phase === 'imminent' ? 3.5 : 2.6;
      ctx.setLineDash(ally ? [8, 5] : hazard.kind === 'null' ? [3, 5] : phase === 'imminent' ? [10, 5] : []);
      ctx.beginPath();
      ctx.arc(x, y, radius - (ally ? 0 : 3.5), start, start + drawn * Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    if (phase === 'imminent') {
      const pulse = this.frame.reducedMotion ? 0 : motionWave(this.frame.elapsed, 14, 3);
      ctx.strokeStyle = NEUTRAL.ink;
      ctx.lineWidth = 3;
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * (radius - 12 - pulse), y + Math.sin(angle) * (radius - 12 - pulse));
        ctx.lineTo(x + Math.cos(angle) * (radius + 6), y + Math.sin(angle) * (radius + 6));
        ctx.stroke();
      }
    }
    this.drawHazardGlyph(ctx, profile.glyph, x, y, Math.min(18, radius * 0.32), phase === 'active' ? 1 : 0.55);
    ctx.restore();
  }

  /** The hatch (hostile) or dot (ally) texture for a hazard's ground, made once per owner and colour. */
  private hazardTexture(ctx: CanvasRenderingContext2D, profile: HazardArtProfile) {
    if (profile.owner === 'neutral') return undefined;
    const key = `${profile.owner}:${profile.color}`;
    if (this.hazardTextures.has(key)) return this.hazardTextures.get(key);
    let pattern: CanvasPattern | undefined;
    const tile = typeof document !== 'undefined' && typeof document.createElement === 'function' ? document.createElement('canvas') : null;
    const tileCtx = tile?.getContext('2d');
    if (tile && tileCtx) {
      tile.width = 12;
      tile.height = 12;
      if (profile.owner === 'hostile') {
        // Diagonal hatch, each colour line over an ink hairline so it still prints on light ground.
        for (const [color, width, offset] of [[NEUTRAL.ink, 0.8, 1], [profile.color, 2, 0]] as const) {
          tileCtx.strokeStyle = color;
          tileCtx.lineWidth = width;
          tileCtx.globalAlpha = 0.6;
          tileCtx.beginPath();
          for (const shift of [-12, 0, 12]) {
            tileCtx.moveTo(shift + offset, 12);
            tileCtx.lineTo(shift + 12 + offset, 0);
          }
          tileCtx.stroke();
        }
      } else {
        tileCtx.fillStyle = profile.color;
        tileCtx.globalAlpha = 0.35;
        tileCtx.beginPath();
        tileCtx.arc(3, 3, 1.6, 0, Math.PI * 2);
        tileCtx.arc(9, 9, 1.6, 0, Math.PI * 2);
        tileCtx.fill();
      }
      pattern = ctx.createPattern(tile, 'repeat') ?? undefined;
    }
    this.hazardTextures.set(key, pattern);
    return pattern;
  }

  /** The effect's mark at the centre, ink on a paper disc so it reads over any texture. */
  private drawHazardGlyph(ctx: CanvasRenderingContext2D, glyph: HazardGlyph, x: number, y: number, size: number, alpha: number) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = NEUTRAL.paperBright;
    ctx.strokeStyle = NEUTRAL.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const k = size / 10;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (glyph === 'wave') {
      for (const row of [-3, 3]) {
        ctx.moveTo(x - 6 * k, y + row * k);
        ctx.quadraticCurveTo(x - 3 * k, y + (row - 3) * k, x, y + row * k);
        ctx.quadraticCurveTo(x + 3 * k, y + (row + 3) * k, x + 6 * k, y + row * k);
      }
    } else if (glyph === 'chain') {
      ctx.ellipse(x - 2.6 * k, y, 4 * k, 2.6 * k, -0.5, 0, Math.PI * 2);
      ctx.moveTo(x + 7 * k, y);
      ctx.ellipse(x + 2.6 * k, y, 4 * k, 2.6 * k, -0.5, 0, Math.PI * 2);
    } else if (glyph === 'null') {
      ctx.arc(x, y, 5.5 * k, 0, Math.PI * 2);
      ctx.moveTo(x - 4 * k, y - 4 * k);
      ctx.lineTo(x + 4 * k, y + 4 * k);
    } else if (glyph === 'flame') {
      ctx.moveTo(x, y + 6 * k);
      ctx.quadraticCurveTo(x - 6 * k, y + 2 * k, x - 1 * k, y - 6 * k);
      ctx.quadraticCurveTo(x + 1 * k, y - 1 * k, x + 3 * k, y - 3 * k);
      ctx.quadraticCurveTo(x + 6 * k, y + 3 * k, x, y + 6 * k);
    } else if (glyph === 'shatter') {
      for (let spike = 0; spike < 5; spike += 1) {
        const angle = -Math.PI / 2 + (spike * Math.PI * 2) / 5;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * 6.5 * k, y + Math.sin(angle) * 6.5 * k);
      }
    } else if (glyph === 'spiral') {
      ctx.arc(x, y, 5.5 * k, 0, Math.PI * 1.5);
      ctx.moveTo(x + 2.5 * k, y);
      ctx.arc(x, y, 2.5 * k, 0, Math.PI * 1.5);
    } else {
      for (let spike = 0; spike < 4; spike += 1) {
        const angle = (spike * Math.PI) / 2;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * 6 * k, y + Math.sin(angle) * 6 * k);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  /** The cast shadow on the floor, drawn under every body (TEC-12). */
  drawObstacleShadow(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = VISUAL_PALETTE.ink;
    ctx.fillRect(obstacle.x + 9, obstacle.y + 12, obstacle.w, obstacle.h);
    ctx.restore();
  }

  /**
   * The block, depth-sorted with characters by its bottom edge (TEC-12). Kit props draw from the chapter pack; this is
   * their load-failure fallback and classic rules' random block (TEC-10): a plain inked block with a lighter top face.
   */
  drawObstacleBlock(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
    ctx.save();
    ctx.fillStyle = VISUAL_PALETTE.paperShadow;
    ctx.fillRect(obstacle.x, obstacle.y - 8, obstacle.w, 8);
    ctx.fillStyle = obstacle.kind === 'pillar' ? VISUAL_PALETTE.inkSoft : CHAPTER_ART[this.frame.chapter].surface;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    ctx.strokeStyle = VISUAL_PALETTE.ink;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(obstacle.x, obstacle.y - 8, obstacle.w, obstacle.h + 8);
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
    // The player's rings keep the size they hit (V4, FX-06); a hostile ring still swells as it fades.
    const expansion = this.frame.reducedMotion || input.owner !== 'hostile' ? 1 : 1 + (1 - alpha) * 0.45;
    ctx.save();
    ctx.translate(input.x, input.y);
    ctx.globalAlpha = this.frame.reducedMotion ? 0.82 : alpha;
    ctx.strokeStyle = input.owner === 'hostile'
      ? SIGNAL.warn
      : input.tier === 'critical'
        ? VISUAL_PALETTE.ink
        : NEUTRAL.inkSoft;
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
