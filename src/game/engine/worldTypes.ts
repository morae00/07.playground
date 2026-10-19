// World types shared by the simulation, the renderers, and the presentation layer (TEC-02).
// Types only: nothing here runs, so any layer may import it without depending on the engine.
import type { StringKey } from '../../i18n/text.ts';

/** Which side an effect belongs to; signal colours follow ownership (BUG-14). */
export type EffectOwner = 'player' | 'hostile';

/** The 17 skills of 0.1.0 (11 active, 6 passive). */
export type CoreSkillId =
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

/** SYS-15: the arsenal's 44 weapons (src/content/data/arsenal.ts), active skills fired from data. */
export type ArsenalId =
  | 'inkDarts'
  | 'brushQuills'
  | 'sealArrows'
  | 'frostNeedles'
  | 'thunderNeedles'
  | 'twinBlades'
  | 'ghostVolley'
  | 'headsmanDarts'
  | 'paperStorm'
  | 'inkBloom'
  | 'thornHalo'
  | 'starShards'
  | 'sunNeedles'
  | 'inkDrizzle'
  | 'pinHail'
  | 'tailGuard'
  | 'smokeTail'
  | 'gravePins'
  | 'trackingSeals'
  | 'huntersMarks'
  | 'crowFeathers'
  | 'bossbane'
  | 'inkLightning'
  | 'brushDownpour'
  | 'fallingScroll'
  | 'seventhSeal'
  | 'inkPulse'
  | 'frostRing'
  | 'thunderclap'
  | 'silenceBell'
  | 'inkPots'
  | 'clusterPots'
  | 'tarJar'
  | 'meteorBrush'
  | 'sparkThread'
  | 'stormThread'
  | 'frostChainlet'
  | 'inkLance'
  | 'wideBrush'
  | 'crossStrokes'
  | 'judgmentLine'
  | 'inkOrbit'
  | 'wardRing'
  | 'eclipseHalo';

export type SkillId = CoreSkillId | ArsenalId;

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
  /** Seconds this body still shows burning (it stood in fire); looks only. */
  burn?: number;
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
  /** SYS-12: the run time an infinite boss arrived, for the pace boss toughness measures. */
  bossAt?: number;
  /** SYS-14: a bomber's kind, when a fuse bomber was planted (run time), its blast damage, and whether it went off. */
  bomber?: 'fuse' | 'burst';
  fuseAt?: number;
  blastDamage?: number;
  detonated?: boolean;
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
  /** SYS-16: what awakened weapons left on this enemy. */
  awk?: AwakenedMarks;
};

/**
 * SYS-16: what awakened weapons (src/content/data/awakenings.ts) left on an enemy. Times are the run time a state ends
 * (or its next tick comes); counts are stacks. Statuses that hold an enemy back never land on bosses.
 */
export type AwakenedMarks = {
  /** inkDarts: ink stains and when they dry; frostNeedles: frost hits and when their count began. */
  stain?: number;
  stainUntil?: number;
  frost?: number;
  frostAt?: number;
  /** sealArrows: pushed, a touch topples another; inkPulse: pushed, a wall stuns. */
  domino?: number;
  bump?: number;
  /** headsmanDarts: runs away; smokeTail: wanders lost; silenceBell: starts no shot, dash, or fuse. */
  fear?: number;
  wander?: number;
  silence?: number;
  /** wardRing: deals less to the player; huntersMarks: takes more from everything. */
  weak?: number;
  prey?: number;
  /** inkBloom: spreads its slow (next spread at pollenAt); thornHalo: hurts as it moves (run: distance so far). */
  pollen?: number;
  pollenAt?: number;
  thorn?: number;
  run?: number;
  /** crowFeathers: a crow circles until `crow`, pecking at crowAt, `pecks` more times. */
  crow?: number;
  crowAt?: number;
  pecks?: number;
  /** K10 looks only (the simulation reads neither): when frostNeedles' freeze ends, and when the crow last pecked. */
  freeze?: number;
  peckAt?: number;
  /** bossbane: cracks on a boss. */
  crack?: number;
  /** frostChainlet: the enemies one chain linked, which share what each takes until `until`. */
  link?: { until: number; members: Entity[]; flashAt: number };
};

/** SYS-16: ground an awakened weapon leaves: it acts on enemies (never on the player) and draws as the player's. */
export type AwakeningZone = {
  weapon: ArsenalId;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  /** Damage per hit or tick, and the run time of the next tick. */
  damage: number;
  next: number;
  /** Enemies it already acted on once. */
  hit: number[];
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
  /** SYS-15: the skill whose art draws this shot (an arsenal weapon's look; otherwise its own skill). */
  look: SkillId;
  blockedBySolid: boolean;
  hitEnemyIds: Set<number>;
  /** SYS-01: the enemy this shot was aimed at (-1 for spread or flank shots); a miss counts against it. */
  aimTargetId: number;
  /** SYS-16: an awakening gimmick fired it (a bounce, a follow-up, a turned shot): it runs no gimmick of its own. */
  echo: boolean;
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
  /** K10 looks only: an awakening gimmick's line (a fork, a sweep back, an unrolling scroll), drawn as the gimmick's. */
  echo?: true;
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
  /** K10 looks only: `r` is the radius of the enemy a weapon's chain reached there (its ice comes in that size). */
  points: Array<{ x: number; y: number; r?: number }>;
  life: number;
  maxLife: number;
  /** FX-06: the white chain's bolt, or the thread from the hero to a mirror clone. */
  skillId: SkillId;
  /** K10 looks only: an awakening gimmick's chain (a thread running back, a leap, a shared hit's flash). */
  echo?: true;
};

/**
 * SYS-15: a lobbed blast on its way down: when and where it lands, how hard. K10 looks only (the simulation reads none of
 * these): where it was thrown from (x0, y0), when (born) and for how long (delay), its place in the cast (k), and
 * whether its weapon is awakened, for the flight art.
 */
export type ArsenalLob = { at: number; x: number; y: number; radius: number; damage: number; id: ArsenalId; x0: number; y0: number; born: number; delay: number; k: number; awakened: boolean };

/**
 * K10 looks only (the simulation reads none of it): an awakening gimmick waiting to go off, for its pending art: the
 * seventh seal's eighth, where it will strike (the centre of the cast's seals), when it was cast and how long it waits,
 * and the seals it gathers from.
 */
export type ArsenalPending = { id: ArsenalId; x: number; y: number; born: number; delay: number; points: readonly Readonly<{ x: number; y: number }>[] };

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
  /** K10: the mark's cosmetic serial (the presentation's own counter, never a game id), the seed of its jitter. */
  seed?: number;
  /** K10: an awakening gimmick's blast, and the way the lob flew that ended in this one (see `area/blast`). */
  echo?: true;
  dir?: -1 | 1;
};

/** SYS-14 (K7): a bomber's blast drawing, shown for a moment where it went off. */
/** K11: a shock that went off (API-hazards §4.2): its burst, then the mark it leaves; `id` is the shock's own. */
export type ShockBurst = {
  id: number;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
};

export type BlastFlash = {
  x: number;
  y: number;
  kind: 'fuse' | 'burst';
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
