// World types shared by the simulation, the renderers, and the presentation layer (TEC-02).
// Types only: nothing here runs, so any layer may import it without depending on the engine.

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
  name: string;
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

export type DamageNumber = {
  id: number;
  x: number;
  y: number;
  value: number;
  crit: boolean;
  life: number;
  maxLife: number;
  owner: EffectOwner;
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
