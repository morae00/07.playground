// Animation states (FX-01): the renderer keeps one AnimState per character, derived from the render world every
// frame. A state says what the character is doing; sprite slots pick a pose for it through a fallback chain, so
// baking art for a new state needs no code change, and vector bodies take their heading from it. One-shot poses
// run from the moment their state began, loops from simulation time with a per-id phase: crowds never march in
// step, and a paused frame holds still. Reduced motion keeps all of this (it only drops shake, pulses, and
// spinning decorations).
import type { AnimationSpec } from './assets/spriteAtlas.ts';
import type { VisualDetail } from './visualRegistry.ts';

export type PlayerAnim = 'idle' | 'run' | 'cast' | 'skillBurst' | 'hurt' | 'rooted' | 'silenced' | 'death';
/** Death belongs to the corpse effects (FX-03): dead enemies leave the world in the step that kills them. */
export type EnemyAnim = 'spawn' | 'idle' | 'move' | 'windup' | 'attack' | 'hurt' | 'stunned' | 'death';
export type BossAnim = 'intro' | 'idle' | 'move' | 'windup' | 'attack' | 'phase' | 'enrage' | 'death';

export type AnimState = {
  state: string;
  /** Simulation time the current state began. */
  startedAt: number;
  /** Simulation time the character was first seen. */
  bornAt: number;
  /** 1 faces right, -1 left; sprites are drawn facing right and mirrored. */
  facing: 1 | -1;
  /** Heading in radians for top-down vector bodies; kept while the body stands still. */
  heading: number;
  /** Boss phase and enrage last seen, to catch their changes. */
  phase: number;
  enraged: boolean;
  seen: number;
};

/** A new enemy rises for this long (the ink bloom of FX-03 uses the same window). */
export const SPAWN_SECONDS = 0.25;
export const BOSS_INTRO_SECONDS = 1;
/** A shooter holds its release pose this long after the shot leaves. */
export const ATTACK_SECONDS = 0.2;
/** The phase-change pause every boss telegraphs (grammar V3). */
export const PHASE_POSE_SECONDS = 0.45;
export const ENRAGE_POSE_SECONDS = 0.6;
const MOVING = 5;

/** Atlas poses that play once and hold their last frame; every other pose loops. */
const ONE_SHOT_POSES: ReadonlySet<string> = new Set(['throw', 'skillBurst', 'hurt', 'hit', 'death', 'spawn', 'attack', 'intro', 'phase', 'enrage']);

/**
 * Atlas states each animation state may use, best first. A state with its own baked animation plays it; until then
 * it borrows the nearest pose that exists.
 */
const HERO_POSES: Readonly<Record<PlayerAnim, readonly string[]>> = {
  idle: ['idle'],
  run: ['run'],
  cast: ['throw'],
  skillBurst: ['skillBurst', 'throw'],
  hurt: ['hurt'],
  rooted: ['rooted', 'idle'],
  silenced: ['silenced', 'idle'],
  death: ['death', 'hurt'],
};
const ENEMY_POSES: Readonly<Record<EnemyAnim, readonly string[]>> = {
  spawn: ['spawn', 'idle'],
  idle: ['idle'],
  move: ['walk'],
  windup: ['windup'],
  attack: ['attack', 'windup'],
  hurt: ['hit'],
  stunned: ['stunned', 'hit'],
  death: ['death', 'hit'],
};

export function heroPoses(state: PlayerAnim) {
  return HERO_POSES[state];
}

/** Pose chain for an enemy state; spawning and attacking bodies that are moving borrow the walk cycle. */
export function enemyPoses(state: EnemyAnim, moving: boolean): readonly string[] {
  if (moving && (state === 'spawn' || state === 'attack')) return [state, 'walk'];
  return ENEMY_POSES[state];
}

/**
 * The frame of a pose at simulation time now. One-shot poses play once from the start of the state and hold the
 * last frame; looping poses cycle with the id's phase, so a borrowed walk cycle keeps walking. Crowds follow the
 * level of detail (style bible §13): reduced detail plays at half rate, minimal detail holds a still frame.
 */
export function poseFrame(spec: AnimationSpec, pose: string, startedAt: number, now: number, phase: number, detail: VisualDetail = 'full') {
  if (spec.frames <= 1 || detail === 'minimal') return 0;
  const fps = detail === 'reduced' ? spec.fps / 2 : spec.fps;
  if (ONE_SHOT_POSES.has(pose)) return Math.min(spec.frames - 1, Math.max(0, Math.floor((now - startedAt) * fps)));
  return Math.floor(Math.max(0, now * fps + phase * spec.frames)) % spec.frames;
}

/** Moves a character into a state; the start time resets only when the state changes. */
export function enter<S extends string>(entry: AnimState, state: S, now: number): S {
  if (entry.state !== state) {
    entry.state = state;
    entry.startedAt = now;
  }
  return state;
}

export type EnemyAnimInput = {
  vx: number;
  vy: number;
  stun: number;
  hitFlash: number;
  attackStyle: 'contact' | 'ranged';
  rangedTelegraph: number;
  patternPhase?: string;
};

/** Threats come first (grammar V3): a windup or a dash holds its pose through hits and cosmetic poses. */
export function stepEnemyAnim(entry: AnimState, enemy: EnemyAnimInput, now: number): EnemyAnim {
  let state: EnemyAnim;
  if (enemy.stun > 0) state = 'stunned';
  else if (enemy.patternPhase === 'warn' || (enemy.attackStyle === 'ranged' && enemy.rangedTelegraph > 0)) state = 'windup';
  else if (enemy.patternPhase === 'dash') state = 'attack';
  else if (enemy.hitFlash > 0) state = 'hurt';
  else if (entry.state === 'windup' || (entry.state === 'attack' && now - entry.startedAt < ATTACK_SECONDS)) state = 'attack';
  else if (now - entry.bornAt < SPAWN_SECONDS) state = 'spawn';
  else state = Math.hypot(enemy.vx, enemy.vy) > MOVING ? 'move' : 'idle';
  return enter(entry, state, now);
}

export type BossAnimInput = EnemyAnimInput & { bossPhase: number; armedPattern?: unknown };

/** A boss's windup (its "!" pose) and dash always show; the entrance, phase, and enrage poses fill the gaps. */
export function stepBossAnim(entry: AnimState, boss: BossAnimInput, now: number, enraged: boolean): BossAnim {
  if (entry.phase === 0) {
    entry.phase = boss.bossPhase;
    entry.enraged = enraged;
  }
  const phaseChanged = entry.phase !== boss.bossPhase;
  const enrageBegan = enraged && !entry.enraged;
  entry.phase = boss.bossPhase;
  entry.enraged = enraged;
  let state: BossAnim;
  if (boss.patternPhase === 'warn' || boss.armedPattern !== undefined) state = 'windup';
  else if (boss.patternPhase === 'dash') state = 'attack';
  else if (phaseChanged || enrageBegan) {
    // Restart the pose even when the last one was the same kind.
    entry.state = '';
    state = phaseChanged ? 'phase' : 'enrage';
  } else if ((entry.state === 'phase' && now - entry.startedAt < PHASE_POSE_SECONDS) || (entry.state === 'enrage' && now - entry.startedAt < ENRAGE_POSE_SECONDS)) {
    state = entry.state;
  } else if (now - entry.bornAt < BOSS_INTRO_SECONDS) state = 'intro';
  else state = Math.hypot(boss.vx, boss.vy) > MOVING ? 'move' : 'idle';
  return enter(entry, state, now);
}

export type PlayerAnimInput = { hp: number; root: number; silence: number };
/** Seconds left on the presentation's hurt, burst, and cast poses. */
export type PlayerPoseTimers = { playerHurt: number; playerBurst: number; playerCast: number };

export function stepPlayerAnim(entry: AnimState, player: PlayerAnimInput, poses: PlayerPoseTimers, moving: boolean, now: number): PlayerAnim {
  let state: PlayerAnim;
  if (player.hp <= 0) state = 'death';
  else if (poses.playerHurt > 0) state = 'hurt';
  else if (poses.playerBurst > 0) state = 'skillBurst';
  else if (poses.playerCast > 0) state = 'cast';
  else if (player.root > 0) state = 'rooted';
  else if (moving) state = 'run';
  else if (player.silence > 0) state = 'silenced';
  else state = 'idle';
  return enter(entry, state, now);
}

/**
 * Animation states per character id. Every character is touched once per drawn frame; ids not touched in a
 * frame are forgotten, and a simulation clock that runs backwards (a new run) starts the book over.
 */
export class AnimationBook {
  private readonly entries = new Map<number, AnimState>();
  private frame = 0;
  private lastTime = 0;

  beginFrame(now: number) {
    if (now < this.lastTime) this.entries.clear();
    this.lastTime = now;
    this.frame += 1;
  }

  /** The character's state, created on first sight with the given facing and heading. */
  touch(id: number, now: number, facing: 1 | -1, heading: number): AnimState {
    let entry = this.entries.get(id);
    if (!entry) {
      entry = { state: '', startedAt: now, bornAt: now, facing, heading, phase: 0, enraged: false, seen: this.frame };
      this.entries.set(id, entry);
    }
    entry.seen = this.frame;
    return entry;
  }

  get(id: number) {
    return this.entries.get(id);
  }

  endFrame() {
    for (const [id, entry] of this.entries) {
      if (entry.seen !== this.frame) this.entries.delete(id);
    }
  }

  clear() {
    this.entries.clear();
  }

  get size() {
    return this.entries.size;
  }
}
