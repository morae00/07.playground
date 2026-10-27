// Presentation layer (TEC-02): turns game events into particles, damage numbers, impact rings, screen shake,
// and sound cues for the app's mixer (AUD-01). It owns only cosmetic state; the simulation never reads it back.
import type { BlastFlash, Corpse, DamageNumber, EffectOwner, HitStamp, ImpactRing, Particle, Recoil, ShockBurst, SkillId, SkillMark, SkillState } from '../engine/worldTypes.ts';
import type { GameOptions } from '../../platform/save.ts';
import { CUES, HIT_CUES, KILL_CUES, type CueId, type SoundOutput } from '../audioPolicy.ts';
import type { GameEvent } from '../engine/events.ts';
import { ObjectPool, compactWhere, recycleWhere } from '../objectPool.ts';
import { createSeededRandom } from '../p0Core.ts';
import { CHAPTER_VISUALS } from '../render/visualRegistry.ts';
import { ARSENAL, isArsenal, lookOf } from '../arsenal.ts';

/** SYS-14 (K7): how long a bomber's blast drawing shows (API-bombers §3). */
const BLAST_SECONDS = 0.15;
/** K11: how long a shock's burst and the mark it leaves show (API-hazards §4.2: burst 0.25 s, decal 1.2 s). */
const SHOCK_SECONDS = 1.45;
/**
 * AUD-02 (P0-3): a planted fuse ticks at these simulation times after it is armed, the last just before its 1.15 s
 * blast (BOMBERS.fuse.seconds), so pauses, drafts, the slow game, and hit-stop hold the ticks back with the fuse.
 */
export const FUSE_TICKS: readonly number[] = Object.freeze([0, 0.45, 0.75, 0.95, 1.07]);
/** Each tick a step higher: 2500 Hz rising by 200 Hz, against the bomber.tick clack's 2900 Hz. */
export const FUSE_TICK_PITCHES: readonly number[] = Object.freeze(FUSE_TICKS.map((_, index) => (2500 + index * 200) / 2900));
/** Summed step lengths drift by rounding; a tick due within this is due now. */
const FUSE_TICK_SLACK = 1e-9;
/** AUD-06: a charger's windup plays the ranged aim's warning this much lower, so the two read apart. */
export const CHARGER_WARN_PITCH = 0.9;

/**
 * A planted fuse (S4, AUD-02): where it sounds, its sizzle's voice until that stops, the simulation seconds since it
 * was armed, and the next tick. fresh: armed during the current step, which has no simulated time behind it yet.
 */
type Fuse = { x: number; voice: number | undefined; age: number; next: number; fresh: boolean };

export type PresentationHost = {
  /**
   * Ids for particles and damage numbers. Remaster rules hand out a cosmetic counter; classic rules hand out
   * gameplay ids so 0.1.0 runs stay bit-identical (BUG-08 keeps that leak for A/B runs only).
   */
  nextId(): number;
  options(): GameOptions;
  /** Where a world x sits across the screen, -1 (left edge) to 1 (right edge), for stereo panning. */
  pan(x: number): number;
  /** The chapter on screen, for its material's sounds (AUD-04). */
  chapter(): number;
  /** The player's skills (FX-06): a coin's glint and the execution mark show only with their passive. */
  skills?(): Readonly<Partial<Record<SkillId, Readonly<SkillState>>>>;
  /**
   * K10: how long a weapon's blast or sweep shows when the kit draws it (its SPEC life: the ring, then its decal), or a
   * gimmick's echo blast or heavy sweep it draws (the eighth seal, the total eclipse), or undefined to keep
   * SKILL_MARK_SECONDS (the look's art). Looks only.
   */
  markSeconds?(skillId: SkillId, echo: boolean, heavy: boolean): number | undefined;
};

const PARTICLE_CAP_FULL = 520;
const PARTICLE_CAP_REDUCED = 260;
const DAMAGE_NUMBER_CAP = 160;
/** Hits on one enemy within this long add into its number instead of stacking new ones (FX-07). */
export const NUMBER_MERGE_SECONDS = 0.3;
/** The player's hit rings shown at once. Hostile rings (warnings, blast flashes) never count against it (BUG-20). */
const IMPACT_RING_CAP = 32;
/** FX-06: how long each skill mark shows (the kit's thread ring and collapse, the slash ring, a shard), and how many. */
export const SKILL_MARK_SECONDS = Object.freeze({ ring: 0.3, slash: 0.2, shard: 0.12, pulse: 0.55, glint: 0.12, mark: 0.3 });
/** K10: weapon blasts stay through their decals (up to 1.5 s), so a crowd of casts needs more room than the 48 of FX-06. */
const SKILL_MARK_CAP = 64;
/** The execution mark shows at most once per enemy per its 0.3 s, and this many at once. */
const EXECUTION_MARK_CAP = 12;
/** Ink stains on the floor (style bible P6): 48 at full effects, 24 at reduced; the renderer drops them at minimal detail. */
const CORPSE_CAP_FULL = 48;
const CORPSE_CAP_REDUCED = 24;
/**
 * A body bursts or falls over 6 frames at 24 fps, then its stain dries for 3 s and fades out between 25 and 30 s
 * (FX-03, kit PN.vfx.decal).
 */
export const CORPSE_FALL_SECONDS = 0.25;
export const STAIN_DRY_SECONDS = 3;
export const STAIN_FADE_SECONDS = 25;
export const STAIN_SECONDS = 30;
export const CORPSE_SECONDS = CORPSE_FALL_SECONDS + STAIN_SECONDS;
/** The hit star plays 4 frames at 25 fps (kit PN.vfx.hit); at most this many show at once. */
export const HIT_STAMP_SECONDS = 0.16;
/** FX-02: a struck body recoils along the blow and settles back within this long; the peak offset by impact tier. */
export const RECOIL_SECONDS = 0.12;
export const RECOIL_SIZE = Object.freeze({ light: 2, heavy: 5, critical: 8 });
const RECOIL_CAP = 64;
const HIT_STAMP_CAP = 32;
/** Hit ink sprays out of the far side of a hit, inside this cone. */
const SPLASH_CONE = Math.PI * 0.6;
/** Player feedback (FX-03): the coral vignette after a hit, the heartbeat interval at low health, and the death moment. */
export const HURT_VIGNETTE_SECONDS = 0.35;
export const HEARTBEAT_SECONDS = 0.85;
/** Wall-clock length of the death moment; particles drift at DEATH_SLOWMO_RATE meanwhile. */
export const DEATH_MOMENT_SECONDS = 0.4;
const DEATH_SLOWMO_RATE = 0.25;
/**
 * Pose lengths for the hero (FX-01): the hurt flash (3 frames at 12 fps), the throw (4 frames at 16 fps), and the
 * longer burst for the big actives and awakenings.
 */
/** FX-05: pickups within this long of the last one raise the tick's pitch a step, up to PICKUP_COMBO_MAX steps. */
export const PICKUP_COMBO_SECONDS = 0.6;
export const PICKUP_COMBO_STEP = 0.04;
export const PICKUP_COMBO_MAX = 12;

export const PLAYER_HURT_POSE_SECONDS = 0.25;
export const PLAYER_CAST_POSE_SECONDS = 0.25;
export const PLAYER_BURST_POSE_SECONDS = 0.4;

const CAST_EFFECTS: Partial<Record<SkillId, { shake?: number; sound?: CueId; burst?: boolean }>> = {
  fanKnives: { sound: 'cast.fanKnives' },
  chainSpark: { sound: 'cast.chainSpark' },
  frostLine: { sound: 'cast.frostLine' },
  railSpear: { shake: 9, sound: 'cast.railSpear' },
  boneMortar: { sound: 'cast.boneMortar' },
  mirrorClone: { sound: 'cast.mirrorClone' },
  voidMine: { sound: 'cast.voidMine' },
  blackSun: { shake: 5, sound: 'cast.blackSun', burst: true },
  eclipseStep: { shake: 12, sound: 'cast.eclipseStep', burst: true },
};

/** AUD-02 (P2-1): the boss's growl rises a whole tone with each later enrage step (art/audio/p2-cues.md). */
export const ENRAGE_STEP_PITCHES = [1, 1.12, 1.26, 1.41] as const;

export class Presentation {
  readonly particles: Particle[] = [];
  readonly damageNumbers: DamageNumber[] = [];
  readonly impactRings: ImpactRing[] = [];
  /** SYS-14 (K7): bombers' blast drawings, a moment each. */
  readonly blasts: BlastFlash[] = [];
  /** K11: shocks that went off, for their burst and mark. */
  readonly shocks: ShockBurst[] = [];
  /** S4, AUD-02: each planted bomber's fuse by enemy id; its ticks and sizzle stop if the bomber is felled first. */
  private readonly fuses = new Map<number, Fuse>();
  readonly skillMarks: SkillMark[] = [];
  /** K10: the marks' cosmetic serial, the seed of their jitter; its own counter, so it never moves a game id (BUG-08). */
  private markSerial = 0;
  readonly corpses: Corpse[] = [];
  readonly hitStamps: HitStamp[] = [];
  readonly recoils: Recoil[] = [];
  shake = 0;
  /** Seconds left on the player's hurt, burst, and cast poses (FX-01); they count down in simulated time. */
  playerHurt = 0;
  playerBurst = 0;
  playerCast = 0;
  /** Seconds left on the hurt vignette, and the angle from the player toward the hit (FX-03). */
  hurtVignette = 0;
  hurtAngle = 0;
  lowHealth = false;
  /** Wall-clock seconds left of the death moment (FX-03). */
  deathMoment = 0;
  private heartbeatIn = 0;
  /** Cosmetic random stream (particle spread, hit pitch, shake jitter); reseeded per run. */
  random = createSeededRandom(2);
  readonly particlePool = new ObjectPool<Particle>(
    () => ({ id: 0, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, color: '#000000' }),
    (particle) => { particle.life = 0; },
    PARTICLE_CAP_FULL,
  );
  readonly hitStampPool = new ObjectPool<HitStamp>(
    () => ({ x: 0, y: 0, radius: 0, angle: 0, crit: false, life: 0, maxLife: 0 }),
    (stamp) => { stamp.life = 0; },
    HIT_STAMP_CAP,
  );
  readonly corpsePool = new ObjectPool<Corpse>(
    () => ({ x: 0, y: 0, radius: 0, tier: 'small', attackStyle: 'contact', isBoss: false, fall: 1, life: 0, maxLife: 0 }),
    (corpse) => { corpse.life = 0; },
    CORPSE_CAP_FULL,
  );
  readonly damageNumberPool = new ObjectPool<DamageNumber>(
    () => ({ id: 0, x: 0, y: 0, value: 0, crit: false, life: 0, maxLife: 0, owner: 'player' as EffectOwner, target: -1, popAt: 0 }),
    (number) => { number.life = 0; },
    DAMAGE_NUMBER_CAP,
  );
  private readonly host: PresentationHost;
  private sound: SoundOutput | null = null;
  private disposed = false;
  /**
   * Classic rules only: cosmetic ids and draws feed gameplay ids, so 0.1.0's cosmetic behaviour stays. Each hit sound
   * drew its pitch from the cosmetic stream, at most once per hit spacing in wall time, and every hit made its own
   * damage number.
   */
  private legacyHitDraws = false;
  private legacyHitWait = 0;
  private pickupCombo = 0;
  private pickupComboWait = 0;

  constructor(host: PresentationHost) {
    this.host = host;
  }

  /** The app's mixer; without one (tools, tests) the game is silent. */
  setSound(sound: SoundOutput | null) {
    this.sound = sound;
  }

  /** A new run: reseed the cosmetic stream (the value 0.1.0 derived from the run seed). */
  reseed(runSeed: number, legacyHitDraws = false) {
    this.random = createSeededRandom(runSeed ^ 0x9e3779b9);
    this.legacyHitDraws = legacyHitDraws;
    this.legacyHitWait = 0;
    this.pickupCombo = 0;
    this.pickupComboWait = 0;
    this.hushFuses(true);
  }

  /** A new round: drop particles and damage numbers (rings clear with the round's other effects), and the fuses. */
  clearRound() {
    this.hushFuses(true);
    for (const particle of this.particles) this.particlePool.release(particle);
    for (const number of this.damageNumbers) this.damageNumberPool.release(number);
    for (const corpse of this.corpses) this.corpsePool.release(corpse);
    for (const stamp of this.hitStamps) this.hitStampPool.release(stamp);
    this.recoils.length = 0;
    this.particles.length = 0;
    this.damageNumbers.length = 0;
    this.corpses.length = 0;
    this.hitStamps.length = 0;
    this.impactRings.length = 0;
    this.blasts.length = 0;
    this.shocks.length = 0;
    this.skillMarks.length = 0;
    this.playerHurt = 0;
    this.playerBurst = 0;
    this.playerCast = 0;
    this.hurtVignette = 0;
    this.lowHealth = false;
    this.deathMoment = 0;
  }

  handle(event: GameEvent) {
    const effects = this.host.options().effects;
    switch (event.type) {
      case 'run/upgradeBought':
        this.play('run.upgrade');
        return;
      case 'pickup/collected':
        this.pickupCombo = this.pickupComboWait > 0 ? Math.min(PICKUP_COMBO_MAX, this.pickupCombo + 1) : 0;
        this.pickupComboWait = PICKUP_COMBO_SECONDS;
        this.play(event.kind === 'xp' ? 'pickup.xp' : 'pickup.coin', event.x, 1 + this.pickupCombo * PICKUP_COMBO_STEP);
        // The glint is new cosmetic work: classic rules draw nothing new, because their cosmetic draws feed gameplay ids.
        // A coin picked up under the coin fever glints with the kit's stamp instead (FX-06).
        if (event.kind === 'coin' && this.host.skills?.().coinFever && !this.legacyHitDraws) this.addSkillMark('glint', 'coinFever', event.x, event.y, 0, false, event.x, event.y);
        else if (!this.legacyHitDraws) this.burst(event.x, event.y, 4, event.kind === 'xp' ? '#86b82d' : '#111111', 90);
        return;
      case 'draft/opened':
        if (event.reason === 'level') this.play('run.levelUp');
        if (event.highlight) this.play('draft.sting');
        return;
      case 'draft/applied':
        if (event.kind === 'awakening') {
          this.burst(event.x, event.y, 36, '#050505', 260);
          this.addShake(14);
          this.playerBurst = PLAYER_BURST_POSE_SECONDS;
        } else if (event.kind === 'heal') {
          this.burst(event.x, event.y, 28, '#111111', 180);
        } else if (event.kind === 'coins') {
          this.burst(event.x, event.y, 22, '#222222', 160);
        } else if (event.kind === 'overdrive') {
          this.burst(event.x, event.y, 36, '#000000', 260);
          this.addShake(10);
        }
        this.play(`draft.${event.kind}`, event.x);
        return;
      case 'skill/cast': {
        this.playerCast = PLAYER_CAST_POSE_SECONDS;
        // SYS-15: an arsenal weapon shakes like its look and plays its own cast when the cue table has one (K10 Q7).
        const cast = CAST_EFFECTS[lookOf(event.skillId)];
        if (cast?.burst) this.playerBurst = PLAYER_BURST_POSE_SECONDS;
        if (cast?.shake !== undefined) this.addShake(cast.shake);
        const own = `cast.${event.skillId}`;
        const sound = isArsenal(event.skillId) && own in CUES ? (own as CueId) : cast?.sound;
        if (sound) this.play(sound, event.x);
        return;
      }
      case 'enemy/hit': {
        if (this.host.options().damageNumbers) {
          this.addDamageNumber(event.x, event.y - event.radius, event.damage, event.crit, event.crit ? 0.9 : 0.62, 'player', event.id);
        }
        const count = event.tier === 'critical' ? 14 : event.tier === 'heavy' ? 8 : 4;
        // Ink sprays out of the far side of the hit (FX-03).
        this.burst(event.x, event.y, Math.round(count * effects), event.tier === 'critical' ? '#000000' : '#222222', event.tier === 'critical' ? 240 : event.tier === 'heavy' ? 175 : 130, Math.atan2(event.dy, event.dx), SPLASH_CONE);
        if (event.tier !== 'light') this.addImpactRing(event.x, event.y, event.radius * (event.tier === 'critical' ? 1.8 : 1.35), event.tier);
        // Light hits skip the star at reduced effect density.
        if (event.tier !== 'light' || effects > 0.65) this.addHitStamp(event.x, event.y, event.radius, Math.atan2(event.dy, event.dx), event.tier === 'critical');
        if (event.tier === 'critical') this.addShake(4);
        if (event.crit && this.host.skills?.().executionMark) this.addExecutionMark(event.id, event.x, event.y);
        this.addRecoil(event.id, event.dx, event.dy, RECOIL_SIZE[event.tier] * (this.host.options().hitReaction ?? 1));
        if (this.legacyHitDraws && this.legacyHitWait <= 0) {
          this.random();
          this.legacyHitWait = CUES[HIT_CUES[event.tier]].spacing;
        }
        this.play(HIT_CUES[event.tier], event.x);
        return;
      }
      case 'enemy/killed':
        this.burst(event.x, event.y, event.isBoss ? 42 : 16, '#050505', event.isBoss ? 340 : 190);
        this.addShake(event.isBoss ? 18 : 4);
        this.addCorpse(event);
        this.play(event.isBoss ? 'boss.kill' : KILL_CUES[this.host.chapter() - 1] ?? 'enemy.kill', event.x);
        return;
      case 'enemy/contact':
        this.addShake(event.isBoss ? 12 : 5);
        return;
      case 'player/hurt':
        this.playerHurt = PLAYER_HURT_POSE_SECONDS;
        this.hurtVignette = HURT_VIGNETTE_SECONDS;
        this.hurtAngle = Math.atan2(event.fromY - event.y, event.fromX - event.x);
        if (this.host.options().damageNumbers) this.addDamageNumber(event.x, event.y - 38, event.damage, false, 0.72, 'hostile');
        this.burst(event.x, event.y, 12, '#000000', 160);
        this.play('player.hurt', event.x);
        return;
      case 'player/burn':
        // FX-03: a small coral number for what the fire took; no pose, vignette, or sound (K11 brief Q4).
        if (this.host.options().damageNumbers) this.addDamageNumber(event.x, event.y - 38, event.damage, false, 0.5, 'hostile');
        return;
      case 'player/lowHealth':
        this.lowHealth = event.low;
        this.heartbeatIn = 0;
        return;
      case 'player/died':
        this.lowHealth = false;
        this.deathMoment = DEATH_MOMENT_SECONDS;
        this.play('player.down');
        return;
      case 'area/damage':
        this.burst(event.x, event.y, Math.round(22 * effects), '#050505', 230);
        return;
      case 'area/blast':
        this.addSkillMark('ring', event.source, event.x, event.y, event.radius, false, event.x, event.y, -1, event.echo, event.dir);
        if (lookOf(event.source) === 'boneMortar') this.addShake(8);
        // AUD-02 (P2-1): a gimmick's echo taps softly; a lob or a mortar shell lands with a thud. They were silent.
        if (event.echo) this.play('gimmick.echo', event.x);
        else if (event.source === 'boneMortar' || (isArsenal(event.source) && ARSENAL[event.source].kind === 'lob')) this.play('land.lob', event.x);
        return;
      case 'vortex/collapse':
        // Only awakened vortices collapse; the ring flag marks the black sun's (FX-06: both collapse at R + 30).
        this.addSkillMark('ring', event.ring ? 'blackSun' : 'voidMine', event.x, event.y, event.radius + 30, false, event.x, event.y);
        this.addShake(12);
        this.play(event.ring ? 'cast.blackSun' : 'cast.voidMine', event.x, 0.85);
        return;
      case 'shock/burst':
        this.shocks.push({ id: event.id, x: event.x, y: event.y, radius: event.radius, life: SHOCK_SECONDS, maxLife: SHOCK_SECONDS });
        this.burst(event.x, event.y, Math.round(28 * effects), '#050505', 280);
        this.addShake(11);
        // The shock zone's damage moment; the warning sound already came with its telegraph (AUD-02, P2-1).
        this.play('bomber.blast', event.x, 1.2);
        return;
      case 'enemy/armed': {
        // AUD-02: the sizzle runs on its own; the first tick sounds now and the rest on simulation time (step).
        this.fuses.set(event.id, { x: event.x, voice: this.play('bomber.fuse', event.x), age: 0, next: 1, fresh: true });
        this.play('bomber.tick', event.x, FUSE_TICK_PITCHES[0]);
        return;
      }
      case 'enemy/defused': {
        // S4: a felled bomber's fuse stops ticking, so it does not warn of a blast that will not come.
        const voice = this.fuses.get(event.id)?.voice;
        this.fuses.delete(event.id);
        if (voice !== undefined) this.sound?.stop?.(voice);
        return;
      }
      case 'enemy/blast':
        this.fuses.delete(event.id);
        // SYS-14: the blast's reach flashes as a hostile ring, and a blast that caught the player shakes harder.
        this.impactRings.push({ x: event.x, y: event.y, radius: event.radius, life: 0.3, maxLife: 0.3, tier: 'heavy', owner: 'hostile' });
        this.blasts.push({ x: event.x, y: event.y, kind: event.kind, life: BLAST_SECONDS, maxLife: BLAST_SECONDS });
        this.burst(event.x, event.y, Math.round((event.kind === 'fuse' ? 30 : 18) * effects), '#050505', event.kind === 'fuse' ? 300 : 220);
        this.addShake(event.hit ? 14 : 6);
        this.play('bomber.blast', event.x);
        return;
      case 'enemy/windup':
        // AUD-06: an aim or a charger's windup clacks as it starts; the charger's a little lower.
        this.play('warn.ranged', event.x, event.role === 'charger' ? CHARGER_WARN_PITCH : 1);
        return;
      case 'boss/windup':
        this.play('warn.boss', event.x);
        return;
      case 'trap/sprung':
        this.burst(event.x, event.y, 12, '#111111', 120);
        return;
      case 'player/bound':
        this.play('hazard.trap', event.x);
        return;
      case 'shot/blocked':
        this.burst(event.x, event.y, 4, '#111111', 90);
        return;
      case 'enemy/blocked':
        // A glancing clink off the warden's shield (SYS-02).
        this.burst(event.x, event.y, 5, '#343936', 150);
        this.play('shield.block', event.x);
        return;
      case 'enemy/stunned':
        this.burst(event.x, event.y, 12, '#111111', 150);
        // The thud is a charger hitting a wall. A gimmick's stun (it names its weapon) is silent: freezes, lightning
        // pillars and ink waves stunned often enough to bury the hits under it and blur its meaning (AUD-02, P2-2).
        if (!event.source) this.play('enemy.stunned', event.x);
        return;
      case 'magnet/pulse':
        this.burst(event.x, event.y, 16, '#111111', 130);
        this.addSkillMark('pulse', 'magnetSigil', event.x, event.y, 0, false, event.x, event.y);
        return;
      case 'boss/spawned':
        this.play('boss.intro', event.x);
        if (event.infinite) {
          this.burst(event.x, event.y, 28, '#111111', 210);
          this.addShake(8);
        } else {
          this.burst(event.x, event.y, 24, '#111111', 190);
        }
        return;
      case 'boss/phase':
        this.burst(event.x, event.y, 18 + event.phase * 6, CHAPTER_VISUALS[event.chapter].accent, 240);
        this.addShake(8 + event.phase * 2);
        this.play('boss.phase', event.x);
        return;
      case 'boss/ringFired':
        this.addShake(4);
        return;
      case 'boss/attack':
        this.play(`boss.${event.pattern}`, event.x);
        return;
      case 'boss/cloned':
        this.burst(event.x, event.y, 18, '#111111', 170);
        return;
      case 'boss/enraged':
        this.addShake(22);
        this.burst(event.x, event.y, 60, '#000000', 320);
        this.play('boss.enraged', event.x);
        return;
      case 'boss/enrageStep':
        this.play('boss.enraged', event.x, ENRAGE_STEP_PITCHES[Math.min(ENRAGE_STEP_PITCHES.length, event.step) - 1]);
        return;
      case 'telegraph/ring':
        // Warnings are never dropped by the ring cap.
        this.impactRings.push({ x: event.x, y: event.y, radius: event.radius, life: event.life, maxLife: event.life, tier: 'heavy', owner: 'hostile' });
        return;
    }
  }

  /**
   * Start of an animation frame: shake decays in wall time unless paused; the death moment runs regardless. A paused
   * run silences its fuses' sizzles, which play in wall time; their ticks wait for the simulation.
   */
  beginFrame(frameDt: number, paused: boolean) {
    this.legacyHitWait = Math.max(0, this.legacyHitWait - frameDt);
    this.deathMoment = Math.max(0, this.deathMoment - frameDt);
    if (paused) {
      this.hushFuses(false);
      return;
    }
    this.pickupComboWait = Math.max(0, this.pickupComboWait - frameDt);
    this.shake = Math.max(0, this.shake - frameDt * 12);
  }

  /**
   * End of an animation frame. A paused run draws a still frame (BUG-03); classic rules keep 0.1.0's paused
   * particle decay because their particle ids feed the gameplay id stream.
   */
  endFrame(frameDt: number, paused: boolean, decayWhilePaused: boolean) {
    if (paused) this.shake = 0;
    if (!paused || decayWhilePaused) this.updateParticles(frameDt);
    // The run has ended: the last hit's ink drifts on in slow motion before the settlement (FX-03).
    else if (this.deathMoment > 0) this.updateParticles(frameDt * DEATH_SLOWMO_RATE);
  }

  /** Per fixed simulation step: rings, damage numbers, corpses, the hero's poses, and fuse ticks go by simulated time. */
  step(dt: number) {
    if (this.fuses.size > 0) this.tickFuses(dt);
    this.hurtVignette = Math.max(0, this.hurtVignette - dt);
    if (this.lowHealth) {
      this.heartbeatIn -= dt;
      if (this.heartbeatIn <= 0) {
        this.heartbeatIn = HEARTBEAT_SECONDS;
        this.play('player.heartbeat');
      }
    }
    for (const corpse of this.corpses) corpse.life -= dt;
    recycleWhere(this.corpses, (corpse) => corpse.life > 0, this.corpsePool);
    for (const stamp of this.hitStamps) stamp.life -= dt;
    recycleWhere(this.hitStamps, (stamp) => stamp.life > 0, this.hitStampPool);
    for (const recoil of this.recoils) recoil.life -= dt;
    for (let index = this.recoils.length - 1; index >= 0; index -= 1) if (this.recoils[index].life <= 0) this.recoils.splice(index, 1);
    this.playerHurt = Math.max(0, this.playerHurt - dt);
    this.playerBurst = Math.max(0, this.playerBurst - dt);
    this.playerCast = Math.max(0, this.playerCast - dt);
    for (const ring of this.impactRings) ring.life -= dt;
    for (const blast of this.blasts) blast.life -= dt;
    for (const shock of this.shocks) shock.life -= dt;
    for (const mark of this.skillMarks) mark.life -= dt;
    for (const number of this.damageNumbers) {
      number.life -= dt;
      number.y -= dt * 38;
    }
    compactWhere(this.impactRings, (ring) => ring.life > 0);
    compactWhere(this.blasts, (blast) => blast.life > 0);
    compactWhere(this.shocks, (shock) => shock.life > 0);
    compactWhere(this.skillMarks, (mark) => mark.life > 0);
    recycleWhere(this.damageNumbers, (number) => number.life > 0, this.damageNumberPool);
  }

  /** Throws particles all around, or inside a cone of the given width around direction. */
  burst(x: number, y: number, count: number, color: string, speed: number, direction = 0, cone = Math.PI * 2) {
    const maxParticles = this.particleCap();
    const safeCount = Math.min(90, Math.max(0, Math.floor(count)), Math.max(0, maxParticles - this.particles.length));
    for (let i = 0; i < safeCount; i += 1) {
      // One draw per angle either way, so the cosmetic stream (classic particle ids) stays in step.
      const angle = direction + (this.random() - 0.5) * cone;
      const velocity = speed * (0.25 + this.random() * 0.75);
      const life = 0.25 + this.random() * 0.45;
      const particle = this.particlePool.acquire();
      Object.assign(particle, {
        id: this.host.nextId(),
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life,
        maxLife: life,
        size: 2 + this.random() * 5,
        color,
      });
      this.particles.push(particle);
    }
  }

  addDamageNumber(x: number, y: number, value: number, crit: boolean, life: number, owner: EffectOwner, target = -1) {
    if (target >= 0 && !this.legacyHitDraws) {
      for (const recent of this.damageNumbers) {
        if (recent.target !== target || recent.owner !== owner || recent.maxLife - recent.life >= NUMBER_MERGE_SECONDS) continue;
        // Another hit on the same enemy: the number adds up, takes the crit look if either was one, and pops again
        // where the enemy is now, so a stream of hits does not float away from its target.
        recent.value += value;
        recent.x = x;
        recent.y = y;
        recent.crit ||= crit;
        recent.life = Math.max(recent.life, life);
        recent.maxLife = Math.max(recent.maxLife, life);
        recent.popAt = recent.life;
        return;
      }
    }
    let number: DamageNumber | undefined;
    if (this.damageNumbers.length >= DAMAGE_NUMBER_CAP) {
      if (!crit) return;
      const replaceIndex = this.damageNumbers.findIndex((candidate) => !candidate.crit);
      if (replaceIndex < 0) return;
      number = this.damageNumbers.splice(replaceIndex, 1)[0];
    }
    number ??= this.damageNumberPool.acquire();
    Object.assign(number, { id: this.host.nextId(), x, y, value, crit, life, maxLife: life, owner, target, popAt: life });
    this.damageNumbers.push(number);
  }

  /** A hit star; the oldest goes when the cap is reached. */
  addHitStamp(x: number, y: number, radius: number, angle: number, crit: boolean) {
    if (this.hitStamps.length >= HIT_STAMP_CAP) this.hitStampPool.release(this.hitStamps.shift()!);
    const stamp = this.hitStampPool.acquire();
    Object.assign(stamp, { x, y, radius, angle, crit, life: HIT_STAMP_SECONDS, maxLife: HIT_STAMP_SECONDS });
    this.hitStamps.push(stamp);
  }

  /** A fallen body; the oldest stain goes when the cap for the effect density is reached. */
  addCorpse(event: Extract<GameEvent, { type: 'enemy/killed' }>) {
    const cap = this.host.options().effects > 0.65 ? CORPSE_CAP_FULL : CORPSE_CAP_REDUCED;
    while (this.corpses.length >= cap) this.corpsePool.release(this.corpses.shift()!);
    const corpse = this.corpsePool.acquire();
    Object.assign(corpse, {
      x: event.x,
      y: event.y,
      radius: event.radius,
      tier: event.tier,
      attackStyle: event.attackStyle,
      isBoss: event.isBoss,
      fall: event.dx < 0 ? -1 : 1,
      life: CORPSE_SECONDS,
      maxLife: CORPSE_SECONDS,
    });
    this.corpses.push(corpse);
  }

  /**
   * A player hit ring; the oldest player ring goes when the cap is reached. Warnings share the array but are never
   * dropped for a hit ring (V3, BUG-20): they live longest, so evicting the oldest entry used to take them first.
   */
  addImpactRing(x: number, y: number, radius: number, tier: 'heavy' | 'critical') {
    let oldest = -1;
    let count = 0;
    for (let index = 0; index < this.impactRings.length; index += 1) {
      if (this.impactRings[index].owner !== 'player') continue;
      if (oldest < 0) oldest = index;
      count += 1;
    }
    if (count >= IMPACT_RING_CAP) this.impactRings.splice(oldest, 1);
    this.impactRings.push({ x, y, radius, life: 0.24, maxLife: 0.24, tier, owner: 'player' });
  }

  /**
   * FX-06: a skill ring or stroke from the engine; it draws no ids or cosmetic random numbers. K10: a weapon's own ring,
   * and the gimmick rings the kit draws, last as long as the kit's art for them; a blast carries the lob's way.
   */
  addSkillMark(kind: SkillMark['kind'], skillId: SkillId, x: number, y: number, radius: number, heavy: boolean, x2: number, y2: number, target = -1, echo?: true, dir?: -1 | 1) {
    if (this.skillMarks.length >= SKILL_MARK_CAP) this.skillMarks.shift();
    const life = (kind === 'ring' && this.host.markSeconds?.(skillId, !!echo, heavy)) || SKILL_MARK_SECONDS[kind];
    this.skillMarks.push({ kind, skillId, x, y, radius, heavy, x2, y2, target, life, maxLife: life, seed: (this.markSerial += 1), ...(echo ? { echo } : {}), ...(dir ? { dir } : {}) });
  }

  private addExecutionMark(target: number, x: number, y: number) {
    // Counted in place: crits come in crowds (TEC-04).
    let marks = 0;
    for (const mark of this.skillMarks) {
      if (mark.kind !== 'mark') continue;
      if (mark.target === target) return;
      marks += 1;
    }
    if (marks >= EXECUTION_MARK_CAP) return;
    this.addSkillMark('mark', 'executionMark', x, y, 0, false, x, y, target);
  }

  addShake(amount: number) {
    this.shake = Math.max(this.shake, amount);
  }

  /** Browsers only allow audio after a user gesture; a run start is one. */
  unlockSound() {
    if (!this.disposed) this.sound?.unlock();
  }

  /** The mixer outlives every run (AUD-01): a disposed presentation stops its fuses and sends it no more cues. */
  dispose() {
    this.hushFuses(true);
    this.disposed = true;
    this.sound = null;
  }

  /** AUD-02: each fuse's ticks fall due by the simulation time since it was armed. */
  private tickFuses(dt: number) {
    for (const fuse of this.fuses.values()) {
      if (fuse.fresh) {
        fuse.fresh = false;
        continue;
      }
      fuse.age += dt;
      while (fuse.next < FUSE_TICKS.length && fuse.age + FUSE_TICK_SLACK >= FUSE_TICKS[fuse.next]) {
        this.play('bomber.tick', fuse.x, FUSE_TICK_PITCHES[fuse.next]);
        fuse.next += 1;
      }
    }
  }

  /** Stops every fuse's sizzle (render audit 4), and with forget drops the fuses and their ticks too. */
  private hushFuses(forget: boolean) {
    for (const fuse of this.fuses.values()) {
      if (fuse.voice !== undefined) this.sound?.stop?.(fuse.voice);
      fuse.voice = undefined;
    }
    if (forget) this.fuses.clear();
  }

  private particleCap() {
    return this.host.options().effects > 0.65 ? PARTICLE_CAP_FULL : PARTICLE_CAP_REDUCED;
  }

  private updateParticles(dt: number) {
    for (const particle of this.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
    }
    const maxParticles = this.particleCap();
    recycleWhere(this.particles, (particle) => particle.life > 0, this.particlePool);
    while (this.particles.length > maxParticles) this.particlePool.release(this.particles.shift()!);
  }

  /**
   * Sends a cue to the mixer, panned by where x sits on screen. Pitch variation and voice limits live in the mixer,
   * so sound never draws from the cosmetic stream that places particles.
   */
  /** One recoil per body: a new hit restarts it along the new blow (FX-02). */
  addRecoil(id: number, dx: number, dy: number, size: number) {
    if (size <= 0) return;
    const current = this.recoils.find((recoil) => recoil.id === id);
    if (current) {
      Object.assign(current, { dx, dy, size, life: RECOIL_SECONDS });
      return;
    }
    if (this.recoils.length >= RECOIL_CAP) this.recoils.shift();
    this.recoils.push({ id, dx, dy, size, life: RECOIL_SECONDS, maxLife: RECOIL_SECONDS });
  }

  private play(cue: CueId, x?: number, pitch = 1): number | undefined {
    if (this.disposed || !this.sound) return undefined;
    const voice = this.sound.play(cue, x === undefined ? 0 : this.host.pan(x), pitch);
    return typeof voice === 'number' ? voice : undefined;
  }
}
