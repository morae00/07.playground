// Presentation layer (TEC-02): turns game events into particles, damage numbers, impact rings, screen shake,
// and sound cues for the app's mixer (AUD-01). It owns only cosmetic state; the simulation never reads it back.
import type { DamageNumber, EffectOwner, ImpactRing, Particle, SkillId } from '../engine/worldTypes.ts';
import type { GameOptions } from '../../platform/save.ts';
import { CUES, HIT_CUES, type CueId, type SoundOutput } from '../audioPolicy.ts';
import type { GameEvent } from '../engine/events.ts';
import { ObjectPool, compactWhere, recycleWhere } from '../objectPool.ts';
import { createSeededRandom } from '../p0Core.ts';
import { CHAPTER_VISUALS } from '../render/visualRegistry.ts';

export type PresentationHost = {
  /**
   * Ids for particles and damage numbers. Remaster rules hand out a cosmetic counter; classic rules hand out
   * gameplay ids so 0.1.0 runs stay bit-identical (BUG-08 keeps that leak for A/B runs only).
   */
  nextId(): number;
  options(): GameOptions;
  /** Where a world x sits across the screen, -1 (left edge) to 1 (right edge), for stereo panning. */
  pan(x: number): number;
};

const PARTICLE_CAP_FULL = 520;
const PARTICLE_CAP_REDUCED = 260;
const DAMAGE_NUMBER_CAP = 160;
const IMPACT_RING_CAP = 32;
/** Pose lengths for the hero sprite: the hurt flash (3 frames at 12 fps) and the throw (4 frames at 16 fps). */
export const PLAYER_HURT_POSE_SECONDS = 0.25;
export const PLAYER_CAST_POSE_SECONDS = 0.25;

const CAST_EFFECTS: Partial<Record<SkillId, { shake?: number; sound?: CueId }>> = {
  fanKnives: { sound: 'cast.fanKnives' },
  chainSpark: { sound: 'cast.chainSpark' },
  frostLine: { sound: 'cast.frostLine' },
  railSpear: { shake: 9, sound: 'cast.railSpear' },
  boneMortar: { sound: 'cast.boneMortar' },
  mirrorClone: { sound: 'cast.mirrorClone' },
  voidMine: { sound: 'cast.voidMine' },
  blackSun: { shake: 5, sound: 'cast.blackSun' },
  eclipseStep: { shake: 12 },
};

export class Presentation {
  readonly particles: Particle[] = [];
  readonly damageNumbers: DamageNumber[] = [];
  readonly impactRings: ImpactRing[] = [];
  shake = 0;
  /** Seconds left on the player's hurt and cast poses (FX-01); they count down in wall time. */
  playerHurt = 0;
  playerCast = 0;
  /** Cosmetic random stream (particle spread, hit pitch, shake jitter); reseeded per run. */
  random = createSeededRandom(2);
  readonly particlePool = new ObjectPool<Particle>(
    () => ({ id: 0, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, color: '#000000' }),
    (particle) => { particle.life = 0; },
    PARTICLE_CAP_FULL,
  );
  readonly damageNumberPool = new ObjectPool<DamageNumber>(
    () => ({ id: 0, x: 0, y: 0, value: 0, crit: false, life: 0, maxLife: 0, owner: 'player' as EffectOwner }),
    (number) => { number.life = 0; },
    DAMAGE_NUMBER_CAP,
  );
  private readonly host: PresentationHost;
  private sound: SoundOutput | null = null;
  private disposed = false;
  /**
   * Classic rules only: 0.1.0 drew each hit sound's pitch from the cosmetic stream, at most once per hit spacing in
   * wall time. Classic particle ids feed gameplay ids, so that draw is kept to stay bit-identical.
   */
  private legacyHitDraws = false;
  private legacyHitWait = 0;

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
  }

  /** A new round: drop particles and damage numbers (rings clear with the round's other effects). */
  clearRound() {
    for (const particle of this.particles) this.particlePool.release(particle);
    for (const number of this.damageNumbers) this.damageNumberPool.release(number);
    this.particles.length = 0;
    this.damageNumbers.length = 0;
    this.impactRings.length = 0;
    this.playerHurt = 0;
    this.playerCast = 0;
  }

  handle(event: GameEvent) {
    const effects = this.host.options().effects;
    switch (event.type) {
      case 'run/upgradeBought':
        this.play('run.upgrade');
        return;
      case 'draft/applied':
        if (event.kind === 'awakening') {
          this.burst(event.x, event.y, 36, '#050505', 260);
          this.addShake(14);
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
        const cast = CAST_EFFECTS[event.skillId];
        if (cast?.shake !== undefined) this.addShake(cast.shake);
        if (cast?.sound) this.play(cast.sound, event.x);
        return;
      }
      case 'enemy/hit': {
        if (this.host.options().damageNumbers) {
          this.addDamageNumber(event.x, event.y - event.radius, event.damage, event.crit, event.crit ? 0.9 : 0.62, 'player');
        }
        const count = event.tier === 'critical' ? 14 : event.tier === 'heavy' ? 8 : 4;
        this.burst(event.x, event.y, Math.round(count * effects), event.tier === 'critical' ? '#000000' : '#222222', event.tier === 'critical' ? 240 : event.tier === 'heavy' ? 175 : 130);
        if (event.tier !== 'light') this.addImpactRing(event.x, event.y, event.radius * (event.tier === 'critical' ? 1.8 : 1.35), event.tier);
        if (event.tier === 'critical') this.addShake(4);
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
        this.play(event.isBoss ? 'boss.kill' : 'enemy.kill', event.x);
        return;
      case 'enemy/contact':
        this.addShake(event.isBoss ? 12 : 5);
        return;
      case 'player/hurt':
        this.playerHurt = PLAYER_HURT_POSE_SECONDS;
        if (this.host.options().damageNumbers) this.addDamageNumber(event.x, event.y - 38, event.damage, false, 0.72, 'hostile');
        this.burst(event.x, event.y, 12, '#000000', 160);
        this.play('player.hurt', event.x);
        return;
      case 'area/damage':
        this.burst(event.x, event.y, Math.round(22 * effects), '#050505', 230);
        return;
      case 'area/blast':
        this.addImpactRing(event.x, event.y, event.radius, 'critical');
        if (event.source === 'boneMortar') this.addShake(8);
        return;
      case 'vortex/collapse':
        if (event.ring) this.addImpactRing(event.x, event.y, event.radius + 30, 'critical');
        this.addShake(12);
        return;
      case 'shock/burst':
        this.burst(event.x, event.y, Math.round(28 * effects), '#050505', 280);
        this.addShake(11);
        return;
      case 'trap/sprung':
        this.burst(event.x, event.y, 12, '#111111', 120);
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
        this.play('enemy.stunned', event.x);
        return;
      case 'magnet/pulse':
        this.burst(event.x, event.y, 16, '#111111', 130);
        return;
      case 'boss/spawned':
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
        return;
      case 'boss/ringFired':
        this.addShake(4);
        return;
      case 'boss/cloned':
        this.burst(event.x, event.y, 18, '#111111', 170);
        return;
      case 'boss/enraged':
        this.addShake(22);
        this.burst(event.x, event.y, 60, '#000000', 320);
        this.play('boss.enraged', event.x);
        return;
      case 'telegraph/ring':
        // Warnings are never dropped by the ring cap.
        this.impactRings.push({ x: event.x, y: event.y, radius: event.radius, life: event.life, maxLife: event.life, tier: 'heavy', owner: 'hostile' });
        return;
    }
  }

  /** Start of an animation frame: shake and poses decay in wall time unless paused. */
  beginFrame(frameDt: number, paused: boolean) {
    this.legacyHitWait = Math.max(0, this.legacyHitWait - frameDt);
    if (paused) return;
    this.shake = Math.max(0, this.shake - frameDt * 12);
    this.playerHurt = Math.max(0, this.playerHurt - frameDt);
    this.playerCast = Math.max(0, this.playerCast - frameDt);
  }

  /**
   * End of an animation frame. A paused run draws a still frame (BUG-03); classic rules keep 0.1.0's paused
   * particle decay because their particle ids feed the gameplay id stream.
   */
  endFrame(frameDt: number, paused: boolean, decayWhilePaused: boolean) {
    if (paused) this.shake = 0;
    if (!paused || decayWhilePaused) this.updateParticles(frameDt);
  }

  /** Per fixed simulation step: rings and damage numbers age with simulated time. */
  step(dt: number) {
    for (const ring of this.impactRings) ring.life -= dt;
    for (const number of this.damageNumbers) {
      number.life -= dt;
      number.y -= dt * 38;
    }
    compactWhere(this.impactRings, (ring) => ring.life > 0);
    recycleWhere(this.damageNumbers, (number) => number.life > 0, this.damageNumberPool);
  }

  burst(x: number, y: number, count: number, color: string, speed: number) {
    const maxParticles = this.particleCap();
    const safeCount = Math.min(90, Math.max(0, Math.floor(count)), Math.max(0, maxParticles - this.particles.length));
    for (let i = 0; i < safeCount; i += 1) {
      const angle = this.random() * Math.PI * 2;
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

  addDamageNumber(x: number, y: number, value: number, crit: boolean, life: number, owner: EffectOwner) {
    let number: DamageNumber | undefined;
    if (this.damageNumbers.length >= DAMAGE_NUMBER_CAP) {
      if (!crit) return;
      const replaceIndex = this.damageNumbers.findIndex((candidate) => !candidate.crit);
      if (replaceIndex < 0) return;
      number = this.damageNumbers.splice(replaceIndex, 1)[0];
    }
    number ??= this.damageNumberPool.acquire();
    Object.assign(number, { id: this.host.nextId(), x, y, value, crit, life, maxLife: life, owner });
    this.damageNumbers.push(number);
  }

  addImpactRing(x: number, y: number, radius: number, tier: 'heavy' | 'critical') {
    if (this.impactRings.length >= IMPACT_RING_CAP) this.impactRings.shift();
    this.impactRings.push({ x, y, radius, life: 0.24, maxLife: 0.24, tier, owner: 'player' });
  }

  addShake(amount: number) {
    this.shake = Math.max(this.shake, amount);
  }

  /** Browsers only allow audio after a user gesture; a run start is one. */
  unlockSound() {
    if (!this.disposed) this.sound?.unlock();
  }

  /** The mixer outlives every run (AUD-01): a disposed presentation only stops sending it cues. */
  dispose() {
    this.disposed = true;
    this.sound = null;
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
  private play(cue: CueId, x?: number) {
    if (this.disposed || !this.sound) return;
    this.sound.play(cue, x === undefined ? 0 : this.host.pan(x));
  }
}
