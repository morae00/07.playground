// Game events (TEC-02): the simulation reports what happened and consumers decide how it looks and sounds.
// Presentation (particles, damage numbers, impact rings, shake, sound), tools, and replays read this stream;
// nothing here feeds back into the simulation.
import type { BossPattern, EnemyTier, SkillId } from './worldTypes.ts';

export type ImpactTier = 'light' | 'heavy' | 'critical';
/** What hurt the player: enemy bodies, ranged enemy shots, boss shots, shock zones, or fire ground. */
export type PlayerDamageSource = 'contact' | 'bossContact' | 'shot' | 'bossShot' | 'shock' | 'fire' | 'blast';
export type AppliedOfferKind = 'skill' | 'awakening' | 'heal' | 'coins' | 'overdrive';

export type GameEvent =
  | { type: 'run/upgradeBought' }
  /** FX-05: a pickup reached the player (not one that expired into the total). */
  | { type: 'pickup/collected'; kind: 'xp' | 'coin'; x: number; y: number }
  /** FX-05: a draft opened; highlight when it offers a legendary, mythic, or awakening card. */
  | { type: 'draft/opened'; reason: 'level' | 'boss'; highlight: boolean }
  | { type: 'draft/applied'; kind: AppliedOfferKind; x: number; y: number }
  | { type: 'skill/cast'; skillId: SkillId; x: number; y: number }
  /** A skill hit an enemy; x/y are the enemy position after knockback, dx/dy the unit direction the hit travelled. */
  | { type: 'enemy/hit'; id: number; x: number; y: number; radius: number; damage: number; crit: boolean; tier: ImpactTier; dx: number; dy: number }
  /** dx/dy point from the player to the body (FX-03 corpses fall away from the player). */
  | { type: 'enemy/killed'; x: number; y: number; isBoss: boolean; radius: number; tier: EnemyTier; attackStyle: 'contact' | 'ranged'; dx: number; dy: number }
  | { type: 'enemy/contact'; isBoss: boolean }
  /** fromX/fromY: where the hit came from (the enemy, shot, or shock zone), for the directional vignette (FX-03). */
  | { type: 'player/hurt'; x: number; y: number; damage: number; source: PlayerDamageSource; fromX: number; fromY: number }
  /** The player's health crossed LOW_HEALTH_RATIO, either way (FX-03 heartbeat and vignette). */
  | { type: 'player/lowHealth'; low: boolean }
  /** The run ended in defeat; source is the last thing that hurt the player (CON-09 telemetry). */
  | { type: 'player/died'; source: PlayerDamageSource | 'unknown'; bossEnraged: boolean }
  /** Area damage landed at a point (mortar shockwave, vortex collapse, rail fissure). */
  | { type: 'area/damage'; x: number; y: number }
  /** A delayed skill blast (bone mortar, eclipse afterimage) went off. */
  | { type: 'area/blast'; x: number; y: number; radius: number; source: SkillId }
  | { type: 'vortex/collapse'; x: number; y: number; radius: number; ring: boolean }
  | { type: 'shock/burst'; x: number; y: number }
  /** SYS-14: a fuse bomber planted itself (its blast reach and fuse length), and a bomber went off. */
  | { type: 'enemy/armed'; x: number; y: number; radius: number; seconds: number }
  | { type: 'enemy/blast'; x: number; y: number; radius: number; kind: 'fuse' | 'burst'; hit: boolean }
  | { type: 'trap/sprung'; x: number; y: number }
  | { type: 'shot/blocked'; x: number; y: number }
  /** SYS-02: a warden's shield took a hit, and a charger ran into a wall. */
  | { type: 'enemy/blocked'; x: number; y: number }
  | { type: 'enemy/stunned'; x: number; y: number }
  | { type: 'magnet/pulse'; x: number; y: number }
  | { type: 'boss/spawned'; x: number; y: number; infinite: boolean }
  /** CON-08: an infinite run turned to the next chapter's look. */
  | { type: 'chapter/turned'; chapter: number }
  | { type: 'boss/phase'; x: number; y: number; phase: number; chapter: number }
  | { type: 'boss/ringFired'; x: number; y: number }
  /** AUD-04: a boss pattern fired (the telegraphed patterns, dashes, shocks, and eclipse walls). */
  | { type: 'boss/attack'; x: number; y: number; pattern: BossPattern }
  | { type: 'boss/cloned'; x: number; y: number }
  | { type: 'boss/enraged'; x: number; y: number }
  /** A boss phase move shows a circle or ring warning around the boss before it starts. */
  | { type: 'telegraph/ring'; x: number; y: number; radius: number; life: number };

export type GameEventType = GameEvent['type'];
export type GameEventListener = (event: GameEvent) => void;
