// Game events (TEC-02): the simulation reports what happened and consumers decide how it looks and sounds.
// Presentation (particles, damage numbers, impact rings, shake, sound), tools, and replays read this stream;
// nothing here feeds back into the simulation.
import type { SkillId } from './worldTypes.ts';

export type ImpactTier = 'light' | 'heavy' | 'critical';
/** What hurt the player: enemy bodies, ranged enemy shots, boss shots, shock zones, or fire ground. */
export type PlayerDamageSource = 'contact' | 'bossContact' | 'shot' | 'bossShot' | 'shock' | 'fire';
export type AppliedOfferKind = 'skill' | 'awakening' | 'heal' | 'coins' | 'overdrive';

export type GameEvent =
  | { type: 'run/upgradeBought' }
  | { type: 'draft/applied'; kind: AppliedOfferKind; x: number; y: number }
  | { type: 'skill/cast'; skillId: SkillId; x: number; y: number }
  /** A skill hit an enemy; x/y are the enemy position after knockback. */
  | { type: 'enemy/hit'; x: number; y: number; radius: number; damage: number; crit: boolean; tier: ImpactTier }
  | { type: 'enemy/killed'; x: number; y: number; isBoss: boolean }
  | { type: 'enemy/contact'; isBoss: boolean }
  | { type: 'player/hurt'; x: number; y: number; damage: number; source: PlayerDamageSource }
  /** The run ended in defeat; source is the last thing that hurt the player (CON-09 telemetry). */
  | { type: 'player/died'; source: PlayerDamageSource | 'unknown'; bossEnraged: boolean }
  /** Area damage landed at a point (mortar shockwave, vortex collapse, rail fissure). */
  | { type: 'area/damage'; x: number; y: number }
  /** A delayed skill blast (bone mortar, eclipse afterimage) went off. */
  | { type: 'area/blast'; x: number; y: number; radius: number; source: SkillId }
  | { type: 'vortex/collapse'; x: number; y: number; radius: number; ring: boolean }
  | { type: 'shock/burst'; x: number; y: number }
  | { type: 'trap/sprung'; x: number; y: number }
  | { type: 'shot/blocked'; x: number; y: number }
  /** SYS-02: a warden's shield took a hit, and a charger ran into a wall. */
  | { type: 'enemy/blocked'; x: number; y: number }
  | { type: 'enemy/stunned'; x: number; y: number }
  | { type: 'magnet/pulse'; x: number; y: number }
  | { type: 'boss/spawned'; x: number; y: number; infinite: boolean }
  | { type: 'boss/phase'; x: number; y: number; phase: number; chapter: number }
  | { type: 'boss/ringFired'; x: number; y: number }
  | { type: 'boss/cloned'; x: number; y: number }
  | { type: 'boss/enraged'; x: number; y: number }
  /** A boss phase move shows a circle or ring warning around the boss before it starts. */
  | { type: 'telegraph/ring'; x: number; y: number; radius: number; life: number };

export type GameEventType = GameEvent['type'];
export type GameEventListener = (event: GameEvent) => void;
