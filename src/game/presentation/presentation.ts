// Presentation layer (TEC-02): turns game events into particles, damage numbers, impact rings, screen shake,
// and sound. It owns only cosmetic state; the simulation never reads it back.
import type { DamageNumber, EffectOwner, ImpactRing, Particle } from '../engine/worldTypes.ts';
import type { GameOptions } from '../../platform/save.ts';
import { impactCue, toneGain } from '../audioPolicy.ts';
import type { GameEvent, ImpactTier } from '../engine/events.ts';
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
};

const PARTICLE_CAP_FULL = 520;
const PARTICLE_CAP_REDUCED = 260;
const DAMAGE_NUMBER_CAP = 160;
const IMPACT_RING_CAP = 32;

type Tone = readonly [frequency: number, duration: number, oscillator: OscillatorType];

const CAST_EFFECTS: Partial<Record<string, { shake?: number; tone?: Tone }>> = {
  fanKnives: { tone: [390, 0.025, 'triangle'] },
  chainSpark: { tone: [660, 0.025, 'square'] },
  frostLine: { tone: [510, 0.04, 'sine'] },
  railSpear: { shake: 9, tone: [95, 0.055, 'sawtooth'] },
  boneMortar: { tone: [120, 0.055, 'sawtooth'] },
  mirrorClone: { tone: [470, 0.035, 'square'] },
  voidMine: { tone: [82, 0.055, 'sine'] },
  blackSun: { shake: 5, tone: [70, 0.06, 'sine'] },
  eclipseStep: { shake: 12 },
};

export class Presentation {
  readonly particles: Particle[] = [];
  readonly damageNumbers: DamageNumber[] = [];
  readonly impactRings: ImpactRing[] = [];
  shake = 0;
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
  private soundCooldown = 0;
  private audio?: AudioContext;
  private disposed = false;

  constructor(host: PresentationHost) {
    this.host = host;
  }

  /** A new run: reseed the cosmetic stream (the value 0.1.0 derived from the run seed). */
  reseed(runSeed: number) {
    this.random = createSeededRandom(runSeed ^ 0x9e3779b9);
  }

  /** A new round: drop particles and damage numbers (rings clear with the round's other effects). */
  clearRound() {
    for (const particle of this.particles) this.particlePool.release(particle);
    for (const number of this.damageNumbers) this.damageNumberPool.release(number);
    this.particles.length = 0;
    this.damageNumbers.length = 0;
    this.impactRings.length = 0;
  }

  handle(event: GameEvent) {
    const effects = this.host.options().effects;
    switch (event.type) {
      case 'run/upgradeBought':
        this.tone(180, 0.03, 'triangle');
        return;
      case 'draft/applied':
        if (event.kind === 'awakening') {
          this.burst(event.x, event.y, 36, '#050505', 260);
          this.addShake(14);
          this.tone(110, 0.09, 'sawtooth');
        } else if (event.kind === 'skill') {
          this.tone(420, 0.05, 'square');
        } else if (event.kind === 'heal') {
          this.burst(event.x, event.y, 28, '#111111', 180);
          this.tone(520, 0.045, 'sine');
        } else if (event.kind === 'coins') {
          this.burst(event.x, event.y, 22, '#222222', 160);
          this.tone(360, 0.05, 'triangle');
        } else {
          this.burst(event.x, event.y, 36, '#000000', 260);
          this.addShake(10);
          this.tone(130, 0.08, 'sawtooth');
        }
        return;
      case 'skill/cast': {
        const cast = CAST_EFFECTS[event.skillId];
        if (cast?.shake !== undefined) this.addShake(cast.shake);
        if (cast?.tone) this.tone(...cast.tone);
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
        this.hit(event.tier);
        return;
      }
      case 'enemy/killed':
        this.burst(event.x, event.y, event.isBoss ? 42 : 16, '#050505', event.isBoss ? 340 : 190);
        this.addShake(event.isBoss ? 18 : 4);
        this.tone(event.isBoss ? 80 : 240, event.isBoss ? 0.09 : 0.035, event.isBoss ? 'sawtooth' : 'square');
        return;
      case 'enemy/contact':
        this.addShake(event.isBoss ? 12 : 5);
        return;
      case 'player/hurt':
        if (this.host.options().damageNumbers) this.addDamageNumber(event.x, event.y - 38, event.damage, false, 0.72, 'hostile');
        this.burst(event.x, event.y, 12, '#000000', 160);
        this.tone(140, 0.025, 'triangle');
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
        this.tone(65, 0.12, 'sawtooth');
        return;
      case 'telegraph/ring':
        // Warnings are never dropped by the ring cap.
        this.impactRings.push({ x: event.x, y: event.y, radius: event.radius, life: event.life, maxLife: event.life, tier: 'heavy', owner: 'hostile' });
        return;
    }
  }

  /** Start of an animation frame: sound spacing always runs; shake decays in wall time unless paused. */
  beginFrame(frameDt: number, paused: boolean) {
    this.soundCooldown = Math.max(0, this.soundCooldown - frameDt);
    if (!paused) this.shake = Math.max(0, this.shake - frameDt * 12);
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
  ensureAudio() {
    if (this.disposed) return;
    if (!this.audio) {
      try {
        this.audio = new AudioContext();
      } catch {
        this.audio = undefined;
      }
    }
    if (this.audio?.state === 'suspended') void this.audio.resume().catch(() => undefined);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const audio = this.audio;
    this.audio = undefined;
    if (audio && audio.state !== 'closed') void audio.close().catch(() => undefined);
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

  private hit(tier: ImpactTier) {
    if (this.soundCooldown > 0) return;
    const cue = impactCue(tier, this.random());
    this.soundCooldown = cue.cooldown;
    this.tone(cue.frequency, cue.duration, cue.oscillator, cue.gain);
  }

  private tone(frequency: number, duration: number, type: OscillatorType, gainScale = 1) {
    if (this.disposed || this.host.options().volume <= 0.001) return;
    this.ensureAudio();
    if (!this.audio) return;
    const osc = this.audio.createOscillator();
    const gain = this.audio.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(toneGain(this.host.options().volume, gainScale), this.audio.currentTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audio.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.audio.destination);
    osc.addEventListener('ended', () => {
      osc.disconnect();
      gain.disconnect();
    }, { once: true });
    osc.start();
    osc.stop(this.audio.currentTime + duration + 0.01);
  }
}
