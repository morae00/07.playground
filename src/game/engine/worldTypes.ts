// World types shared by the simulation, the renderers, and the presentation layer (TEC-02).
// Types only: nothing here runs, so any layer may import it without depending on the engine.
import type { StringKey } from '../../i18n/text.ts';

/** Which side an effect belongs to; signal colours follow ownership (BUG-14). */
export type EffectOwner = 'player' | 'hostile';

export type SkillId =
  | 'needleStorm'
  | 'fanKnives'
  | 'chainSpark'
  | 'frostLine'
  | 'orbitScythes'
  | 'boneMortar'
  | 'railSpear'
  | 'mirrorClone'
  | 'voidMine'
  | 'blackSun'
  | 'ironFrame'
  | 'magnetSigil'
  | 'paperWard'
  | 'recoveryThread'
  | 'coinFever'
  | 'eclipseStep'
  | 'executionMark';

export type SkillState = {
  level: number;
  awakened: boolean;
};

export type EnemyTier = 'small' | 'medium' | 'large' | 'boss';

export type BossPattern =
  | 'dash'
  | 'rings'
  | 'clones'
  | 'flame'
  | 'tide'
  | 'traps'
  | 'clock'
  | 'saw'
  | 'eclipse'
  | 'null'
  | 'shock';

export type BossDef = {
  id: string;
  /** The string key of its name (UI-10). */
  name: StringKey;
  chapter: number;
  role: 'field' | 'mid' | 'final';
  pattern: BossPattern;
  hp: number;
  damage: number;
  speed: number;
};

export type Entity = {
  id: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xp: number;
  coin: number;
  tier: EnemyTier;
  variant: number;
  isBoss: boolean;
  attackStyle: 'contact' | 'ranged';
  rangedCooldown: number;
  rangedTelegraph: number;
  boss?: BossDef;
  legacyBoss?: boolean;
  contactTimer: number;
  hitFlash: number;
  stun: number;
  root: number;
  slowMultiplier: number;
  slowTimer: number;
  patternTimer: number;
  patternPhase: string;
  patternX: number;
  patternY: number;
  damageCooldowns: Record<string, number>;
  bossPhase: 1 | 2 | 3;
  bossPhaseFlash: number;
  /** CON-03, D-04: the stage time a stage objective's field boss appeared at (timed field boss goals). */
  fieldBossAt?: number;
  /** SYS-10: an elite's affix; its shield, and when it was last hit (the shield comes back after a while untouched). */
  elite?: 'haste' | 'split' | 'shield' | 'drain';
  eliteShield?: number;
  eliteHitAt?: number;
  /**
   * FX-06: the stage time the chalk cut's chill and root on this enemy end. Drawing only: terrain slows and roots
   * use the same slowTimer and root, so the renderer tells the cut's marks apart by these.
   */
  frostUntil?: number;
  frostRootUntil?: number;
  /** SYS-01: consecutive aimed shots that missed this enemy, and when the last one missed. */
  aimMisses?: number;
  aimMissedAt?: number;
  /** SYS-02: seconds until a charger may wind up again. */
  dashCooldown?: number;
  /** SYS-02: the direction a warden's front shield faces, in radians. */
  shieldAngle?: number;
  /** SYS-04: a telegraphed boss pattern, fixed when its warning appeared and fired as shown. */
  armedPattern?: ArmedPattern;
  /** SYS-04: dashes still to come in a phase move's chain. */
  dashChain?: DashStep[];
  /** SYS-04: volleys fired so far, for patterns that alternate. */
  volleyIndex?: number;
  /** SYS-04: where an anchoring boss holds. */
  anchorX?: number;
  anchorY?: number;
};

/** SYS-04: one more dash in a chain: re-aimed at the player (tracked) or along a lane shown in advance. */
export type DashStep = { tracked: boolean; dx: number; dy: number; windupSeconds: number };

/** SYS-04: what a boss pattern will do when its telegraph runs out. */
export type ArmedPattern = {
  x: number;
  y: number;
  /** Angle offset of a volley, in radians. */
  offset: number;
  /** Clone spots or zone centres. */
  points: Array<{ x: number; y: number }>;
  /** Flame: whether the fire drop also bursts. */
  burst: boolean;
  /** Ring grammars: the direction of the gap left open, in radians. */
  gap?: number;
  /** Contracting ring walls: the wall's centre and starting radius. */
  wall?: { x: number; y: number; radius: number };
};

export type Projectile = {
  id: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  maxLife: number;
  returning: boolean;
  pierce: number;
  knockback: number;
  skillId: SkillId;
  blockedBySolid: boolean;
  hitEnemyIds: Set<number>;
  /** SYS-01: the enemy this shot was aimed at (-1 for spread or flank shots); a miss counts against it. */
  aimTargetId: number;
};

export type BossProjectile = {
  id: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  kind: 'dot' | 'ring' | 'saw' | 'eclipse' | 'enemy';
  /** SYS-04: pushed over the shot cap; fading out and harmless. */
  fading?: boolean;
  /** SYS-05 orbiting saws: they circle their boss at `radius`, `spin` radians a second, instead of flying straight. */
  orbit?: { bossId: number; radius: number; angle: number; spin: number };
};

export type PendingHostileShot = {
  at: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  kind: BossProjectile['kind'];
};

export type Pickup = {
  id: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  kind: 'xp' | 'coin';
  value: number;
  life: number;
  maxLife: number;
};

export type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
};

/**
 * A fallen enemy (FX-03): presentation only, with no gameplay id. It bursts or falls for CORPSE_FALL_SECONDS, then
 * its ink stain dries and fades for the rest of its life.
 */
export type Corpse = {
  x: number;
  y: number;
  radius: number;
  tier: EnemyTier;
  attackStyle: 'contact' | 'ranged';
  isBoss: boolean;
  /** 1 falls to the right (away from a player on the left), -1 to the left. */
  fall: 1 | -1;
  life: number;
  maxLife: number;
};

/** The comic hit star at an impact (FX-03, kit PN.vfx.hit): presentation only. */
/** FX-02: a struck body's recoil along the blow, drawn by the presentation layer only (G14). */
export type Recoil = {
  id: number;
  dx: number;
  dy: number;
  /** Peak offset in world units. */
  size: number;
  life: number;
  maxLife: number;
};

export type HitStamp = {
  x: number;
  y: number;
  radius: number;
  /** Direction the blow travelled, in radians. */
  angle: number;
  crit: boolean;
  life: number;
  maxLife: number;
};

export type DamageNumber = {
  id: number;
  x: number;
  y: number;
  value: number;
  crit: boolean;
  life: number;
  maxLife: number;
  owner: EffectOwner;
  /** The enemy the number belongs to, or -1 (FX-07: hits on one target merge into one number). */
  target: number;
  /** life when the number last popped (it pops again when a hit merges into it). */
  popAt: number;
};

export type Hazard = {
  id: number;
  kind: 'water' | 'trap' | 'fire' | 'slow' | 'root' | 'null' | 'warning' | 'vortex' | 'shock';
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  damage: number;
  slow: number;
  triggered: boolean;
  skillDamage?: number;
  sourceSkillId?: SkillId;
  pull?: number;
  collapseDamage?: number;
};

export type Obstacle = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'solid' | 'pillar';
  /** ART-05: the catalogue module drawn for it (`solid1`, `landmark0`, ...); absent for a random block. */
  art?: string;
};

export type BeamEffect = {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  life: number;
  maxLife: number;
  owner: EffectOwner;
  /** FX-06: the skill that cast a player's beam, for its art; hostile beams have none. */
  skillId?: SkillId;
};

/** A hostile area the player can read before it activates (lane = rectangle from start to end). */
export type LaneTelegraph = {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  life: number;
  maxLife: number;
};

export type ChainEffect = {
  id: number;
  points: Array<{ x: number; y: number }>;
  life: number;
  maxLife: number;
  /** FX-06: the white chain's bolt, or the thread from the hero to a mirror clone. */
  skillId: SkillId;
};

/**
 * FX-06: a skill ring or mark for the renderer: the rings no game event sizes (the white chain's last burst, the
 * black rail's fissures, the bone mortar's aftershock), the blast and collapse rings, the eclipse step's slash, a
 * needle shard, the magnet's pulse, a coin's glint, and the execution mark over a struck enemy. Drawing only.
 */
export type SkillMark = {
  kind: 'ring' | 'slash' | 'shard' | 'pulse' | 'glint' | 'mark';
  skillId: SkillId;
  x: number;
  y: number;
  radius: number;
  heavy: boolean;
  /** Where a shard flies to. */
  x2: number;
  y2: number;
  /** The enemy an execution mark hangs over (-1 for none). */
  target: number;
  life: number;
  maxLife: number;
};

export type ImpactRing = {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  tier: 'heavy' | 'critical';
  owner: EffectOwner;
};
