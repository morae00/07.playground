// Test and tooling access to the engine (TEC-07).
// Tests and balance tools build worlds, step them, and read them through this typed API instead of writing
// engine fields, so a refactor of the simulation only has to keep the probe working. The app never imports
// this module; only the test bundle (src/testing/engine.ts) ships it.
import { FIXED_TIMESTEP } from '../p0Core';
import type { RuleSet } from '../rules';
import type { RenderEffects, RenderFrameStats, RenderWorld, WorldLayer } from '../render/worldRenderer';
import type { Corpse, HitStamp, Recoil, SkillMark } from './worldTypes';
import {
  GameEngine,
  type BeamEffect,
  type DamageNumber,
  type BlastFlash,
  type ImpactRing,
  type Particle,
  type BossProjectile,
  type ChainEffect,
  type DraftReason,
  type DraftState,
  type EnemyTier,
  type Entity,
  type Hazard,
  type HudSnapshot,
  type LaneTelegraph,
  type Obstacle,
  type PendingHostileShot,
  type Pickup,
  type Projectile,
  type SkillId,
  type SkillOffer,
  type SkillState,
  type StageKind,
  type StatBlock,
} from '../GameEngine';

export type ProbeWorldPart = 'enemies' | 'hazards' | 'obstacles' | 'pickups' | 'projectiles' | 'hostileShots' | 'effects';

export type ProbePlayer = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  hp: number;
  level: number;
  xp: number;
  nextXp: number;
  coins: number;
  kills: number;
  root: number;
  slow: number;
  invuln: number;
  silence: number;
  shield: number;
  rootImmunity: number;
  stats: StatBlock;
};

/** Plain-data copy of the simulation. Changing it changes nothing in the engine. */
export type ProbeWorld = {
  runMode: 'campaign' | 'infinite';
  rules: 'classic' | 'remaster';
  chapter: number;
  stage: number;
  kind: StageKind;
  paused: boolean;
  stageFinished: boolean;
  bossEnraged: boolean;
  /** SYS-04: the current enrage step, 0 before enrage. */
  enrageStep: number;
  /** D-02: overtime steps after the last enrage step. */
  overtimeStep: number;
  timeLeft: number;
  duration: number;
  elapsed: number;
  spawnBudget: number;
  stageKills: number;
  stageCoinsEarned: number;
  hitStop: number;
  player: ProbePlayer;
  aim: { angle: number; targetId: number | null };
  camera: { x: number; y: number };
  skills: Partial<Record<SkillId, SkillState>>;
  skillCooldowns: Partial<Record<SkillId, number>>;
  enemies: Entity[];
  projectiles: Array<Omit<Projectile, 'hitEnemyIds'> & { hitEnemyIds: number[] }>;
  bossProjectiles: BossProjectile[];
  pendingHostileShots: PendingHostileShot[];
  pickups: Pickup[];
  hazards: Hazard[];
  obstacles: Obstacle[];
  beams: BeamEffect[];
  laneTelegraphs: LaneTelegraph[];
  chains: ChainEffect[];
};

/** Moving the player also moves its previous position unless prevX/prevY are given (interpolation tests). */
/** Copies of the presentation layer's cosmetic state (particles, damage numbers, impact rings). */
export type ProbeEffects = {
  particles: Particle[];
  damageNumbers: DamageNumber[];
  impactRings: ImpactRing[];
  blasts: BlastFlash[];
  skillMarks: SkillMark[];
  corpses: Corpse[];
  hitStamps: HitStamp[];
  recoils: Recoil[];
  shake: number;
};

export type ProbeRenderWorld = Omit<RenderWorld, 'effects'> & { effects: Omit<RenderEffects, 'random'> };

export type ProbePlayerPatch = Partial<Omit<ProbePlayer, 'stats'>> & { stats?: Partial<StatBlock> };

export type ProbeEnemySpec = {
  /** 'small' by default; 'rolled' uses the regular tier roll (58/30/12). */
  tier?: EnemyTier | 'rolled';
  /** Difficulty passed to the regular spawner (scales hp and damage); 1 by default. */
  difficulty?: number;
  x?: number;
  y?: number;
  /** Sets both hp and maxHp. */
  hp?: number;
  speed?: number;
  damage?: number;
  attackStyle?: Entity['attackStyle'];
  /** SYS-14: a probe spawn is a plain enemy unless asked for a bomber ('rolled' keeps whatever the spawner rolled). */
  bomber?: Entity['bomber'] | 'rolled';
};

export type ProbeBossRole = 'field' | 'mid' | 'final';

export type ProbeLoadout = Partial<Record<SkillId, { level: number; awakened?: boolean }>>;

export interface EngineProbe {
  read(): ProbeWorld;
  effects(): ProbeEffects;
  /** Advances exactly `ticks` fixed steps the way the frame loop does (hit-stop aware), without drawing. */
  step(ticks?: number): void;
  /** Stops the stage director from adding enemies; enemies already present keep acting. */
  haltSpawns(halt?: boolean): void;
  setGodMode(enabled?: boolean): void;
  clear(...parts: ProbeWorldPart[]): void;
  setPlayer(patch: ProbePlayerPatch): void;
  setCamera(camera: { x: number; y: number; prevX?: number; prevY?: number }): void;
  /** Replaces the whole loadout, clears cooldowns and pending awakenings, and recalculates stats. */
  setSkills(loadout: ProbeLoadout): void;
  /** Fires an equipped active skill now, ignoring its cooldown (its other trigger conditions still apply). */
  cast(skillId: SkillId): void;
  spawnEnemy(spec?: ProbeEnemySpec): number;
  spawnBoss(role?: ProbeBossRole, spec?: Pick<ProbeEnemySpec, 'x' | 'y' | 'hp'>): number;
  patchEnemy(id: number, patch: Partial<Omit<Entity, 'id'>>): void;
  /** Takes enemies out of the world without killing them (no rewards, kills, or drafts). */
  removeEnemies(ids: readonly number[]): void;
  addHazard(spec: Omit<Hazard, 'id'> & { id?: number }): number;
  /** Removes every hazard of the given kinds, keeping the others in order. */
  removeHazards(kinds: readonly Hazard['kind'][]): void;
  /** Drops a pickup through the regular spawner (merging, caps, and lifetimes apply). */
  /** `life` shortens the pickup's lifetime, to reach its expiry without waiting for it. */
  spawnPickup(spec: { kind: Pickup['kind']; x: number; y: number; value: number; vx?: number; vy?: number; radius?: number; life?: number }): void;
  /** Adds a hostile shot directly (render benchmarks, TEC-04). */
  spawnHostileShot(spec: { x: number; y: number; vx?: number; vy?: number; radius?: number; damage?: number; life?: number; kind?: BossProjectile['kind'] }): void;
  /** Adds cosmetic particles and damage numbers through the presentation layer (render benchmarks, TEC-04). */
  burst(x: number, y: number, count: number): void;
  damageNumber(x: number, y: number, value: number, crit?: boolean): void;
  /** Called as each world layer starts drawing (TEC-12 layer contract tests); null removes it. */
  onRenderLayer(listener: ((layer: WorldLayer) => void) | null): void;
  /** Statistics of the last drawn frame: sorted bodies, player coverage, x-ray. */
  renderStats(): RenderFrameStats;
  /** The encounter director's view of the current stage time (SYS-03), or null when no director runs. */
  director(): { beat: string; formation: string; rateFactor: number; terrainCap: number; rewardScale: number; segments: number; stageTime: number } | null;
  /** Live entity and effect counts without copying the world (cheap enough to call every step). */
  counts(): { enemies: number; projectiles: number; hostileShots: number; particles: number; damageNumbers: number };
  addObstacle(spec: Omit<Obstacle, 'id'> & { id?: number }): number;
  setClock(patch: { timeLeft?: number; elapsed?: number }): void;
  setStageKills(count: number): void;
  /** Runs the round-state check now (timer expiry, enrage, clear, defeat). */
  resolveRound(): void;
  openDraft(reason: DraftReason, after: DraftState['after']): void;
  requestRoundClear(): void;
  /** Overrides rule flags for an experiment (the SYS-06 terrain A/B); setRuleSet puts the rule set back. */
  patchRules(patch: Partial<Omit<RuleSet, 'id' | 'version'>>): void;
  previewOffer(skillId: SkillId, kind: 'skill' | 'awakening'): SkillOffer;
  previewBonusOffers(reason: DraftReason): SkillOffer[];
  hud(): HudSnapshot;
  /** Draws one frame at the given interpolation alpha (renderer tests). */
  render(alpha?: number): void;
  /** Plain-data copy of what the renderer receives this frame (the cosmetic random stream left out). */
  renderWorld(alpha?: number): ProbeRenderWorld;
  /** Re-reads the canvas size as a window resize would. */
  resize(): void;
  /**
   * Calls `watcher` after every fixed simulation step with the step count since the run started, whatever the
   * frame rate. Commands dispatched inside apply from the next step. Returns an unsubscribe function.
   */
  onStep(watcher: (tick: number) => void): () => void;
}

const copy = <T>(value: T): T => structuredClone(value);

export class ProbedGameEngine extends GameEngine {
  readonly probe: EngineProbe = this.createProbe();
  private stepCount = 0;
  private readonly stepWatchers = new Set<(tick: number) => void>();

  override startRun(chapter: number, stageNo: number, seed?: number) {
    this.stepCount = 0;
    super.startRun(chapter, stageNo, seed);
  }

  override startInfiniteRun(seed?: number, scoreEligible = true) {
    this.stepCount = 0;
    super.startInfiniteRun(seed, scoreEligible);
  }

  protected override update(dt: number) {
    super.update(dt);
    this.stepCount += 1;
    for (const watcher of this.stepWatchers) watcher(this.stepCount);
  }

  private createProbe(): EngineProbe {
    const findEnemy = (id: number) => {
      const enemy = this.enemies.find((candidate) => candidate.id === id);
      if (!enemy) throw new RangeError(`No enemy with id ${id}`);
      return enemy;
    };
    const place = (enemy: Entity, spec: { x?: number; y?: number; hp?: number }) => {
      if (spec.x !== undefined) enemy.x = enemy.prevX = spec.x;
      if (spec.y !== undefined) enemy.y = enemy.prevY = spec.y;
      if (spec.hp !== undefined) enemy.hp = enemy.maxHp = spec.hp;
    };
    const casters: Partial<Record<SkillId, (skill: SkillState) => void>> = {
      needleStorm: (skill) => this.updateNeedleStorm(skill),
      fanKnives: (skill) => this.updateFanKnives(skill),
      chainSpark: (skill) => this.updateChainSpark(skill),
      frostLine: (skill) => this.updateFrostLine(skill),
      orbitScythes: (skill) => this.updateOrbitScythes(skill),
      boneMortar: (skill) => this.updateBoneMortar(skill),
      railSpear: (skill) => this.updateRailSpear(skill),
      mirrorClone: (skill) => this.updateMirrorClone(skill),
      voidMine: (skill) => this.updateVoidMine(skill),
      blackSun: (skill) => this.updateBlackSun(skill),
      eclipseStep: (skill) => this.updateEclipseStep(skill),
    };

    return {
      read: () => ({
        runMode: this.runMode,
        rules: this.rules.id,
        chapter: this.chapter,
        stage: this.stage,
        kind: this.kind,
        paused: this.paused,
        stageFinished: this.stageFinished,
        bossEnraged: this.bossEnraged,
        enrageStep: this.enrageStep,
        overtimeStep: this.overtimeStep,
        timeLeft: this.timeLeft,
        duration: this.duration,
        elapsed: this.elapsed,
        spawnBudget: this.spawnBudget,
        stageKills: this.stageKills,
        stageCoinsEarned: this.stageCoinsEarned,
        hitStop: this.hitStop,
        player: copy(this.player),
        aim: { angle: this.playerAimAngle, targetId: this.aimTargetId },
        camera: { x: this.camera.x, y: this.camera.y },
        skills: copy(this.skills),
        skillCooldowns: copy(this.skillCooldowns),
        enemies: copy(this.enemies),
        projectiles: this.projectiles.map(({ hitEnemyIds, ...rest }) => ({ ...copy(rest), hitEnemyIds: [...hitEnemyIds] })),
        bossProjectiles: copy(this.bossProjectiles),
        pendingHostileShots: copy(this.pendingHostileShots),
        pickups: copy(this.pickups),
        hazards: copy(this.hazards),
        obstacles: copy(this.obstacles),
        beams: copy(this.beams),
        laneTelegraphs: copy(this.laneTelegraphs),
        chains: copy(this.chains),
      }),
      effects: () => ({
        particles: copy(this.presentation.particles),
        damageNumbers: copy(this.presentation.damageNumbers),
        impactRings: copy(this.presentation.impactRings),
        blasts: copy(this.presentation.blasts),
        skillMarks: copy(this.presentation.skillMarks),
        corpses: copy(this.presentation.corpses),
        hitStamps: copy(this.presentation.hitStamps),
        recoils: copy(this.presentation.recoils),
        shake: this.presentation.shake,
      }),
      step: (ticks = 1) => {
        const scale = this.timeScale;
        this.timeScale = 1;
        try {
          for (let tick = 0; tick < ticks; tick += 1) this.advanceFrame(FIXED_TIMESTEP, false);
        } finally {
          this.timeScale = scale;
        }
      },
      haltSpawns: (halt = true) => {
        this.spawnsHalted = halt;
      },
      setGodMode: (enabled = true) => {
        this.cheatGodMode = enabled;
      },
      clear: (...parts) => {
        for (const part of parts) {
          if (part === 'enemies') {
            this.enemies = [];
            this.enemyIndex.clear();
          } else if (part === 'hazards') {
            this.hazards = [];
          } else if (part === 'obstacles') {
            this.obstacles = [];
          } else if (part === 'pickups') {
            for (const pickup of this.pickups) this.pickupPool.release(pickup);
            this.pickups = [];
          } else if (part === 'projectiles') {
            for (const projectile of this.projectiles) this.projectilePool.release(projectile);
            this.projectiles = [];
          } else if (part === 'hostileShots') {
            for (const shot of this.bossProjectiles) this.bossProjectilePool.release(shot);
            this.bossProjectiles = [];
            this.pendingHostileShots = [];
          } else {
            this.beams = [];
            this.laneTelegraphs = [];
            this.chains = [];
            this.presentation.clearRound();
          }
        }
      },
      setPlayer: ({ stats, ...patch }) => {
        Object.assign(this.player, patch);
        if (patch.x !== undefined && patch.prevX === undefined) this.player.prevX = patch.x;
        if (patch.y !== undefined && patch.prevY === undefined) this.player.prevY = patch.y;
        if (stats) Object.assign(this.player.stats, stats);
      },
      setCamera: ({ x, y, prevX = x, prevY = y }) => {
        this.camera = { x, y, prevX, prevY };
        // What the screen shows moves with it (FX-04 view camera), so a placed camera is also the drawn one.
        this.viewCamera.snap(x, y);
        this.viewCamera.prevX = prevX;
        this.viewCamera.prevY = prevY;
      },
      setSkills: (loadout) => {
        this.skills = Object.fromEntries(
          Object.entries(loadout).map(([id, state]) => [id, { level: state.level, awakened: state.awakened === true }]),
        ) as Partial<Record<SkillId, SkillState>>;
        this.skillCooldowns = {};
        this.pendingAwakenings = [];
        this.recalculateStats(false);
      },
      cast: (skillId) => {
        const skill = this.skills[skillId];
        if (!skill) throw new RangeError(`${skillId} is not equipped`);
        const caster = casters[skillId];
        if (!caster) throw new RangeError(`${skillId} is passive and cannot be cast`);
        this.skillCooldowns[skillId] = 0;
        this.rebuildEnemyIndex();
        caster(skill);
      },
      spawnEnemy: (spec = {}) => {
        this.spawnEnemy(spec.difficulty ?? 1, spec.tier === 'rolled' ? undefined : spec.tier ?? 'small');
        const enemy = this.enemies[this.enemies.length - 1];
        place(enemy, spec);
        if (spec.speed !== undefined) enemy.speed = spec.speed;
        if (spec.damage !== undefined) enemy.damage = spec.damage;
        if (spec.attackStyle !== undefined) enemy.attackStyle = spec.attackStyle;
        if (spec.bomber !== 'rolled') {
          delete enemy.bomber;
          delete enemy.blastDamage;
          if (spec.bomber) Object.assign(enemy, { bomber: spec.bomber, blastDamage: enemy.damage * 4 });
        }
        this.rebuildEnemyIndex();
        return enemy.id;
      },
      spawnBoss: (role = 'mid', spec = {}) => {
        this.spawnBoss(role === 'field' ? 'normal' : role === 'mid' ? 'midBoss' : 'finalBoss', false);
        const boss = this.enemies[this.enemies.length - 1];
        place(boss, spec);
        this.rebuildEnemyIndex();
        return boss.id;
      },
      removeEnemies: (ids) => {
        const drop = new Set(ids);
        this.enemies = this.enemies.filter((enemy) => !drop.has(enemy.id));
        this.rebuildEnemyIndex();
      },
      patchEnemy: (id, patch) => {
        const enemy = findEnemy(id);
        Object.assign(enemy, patch);
        if (patch.x !== undefined && patch.prevX === undefined) enemy.prevX = patch.x;
        if (patch.y !== undefined && patch.prevY === undefined) enemy.prevY = patch.y;
        this.rebuildEnemyIndex();
      },
      addHazard: ({ id, ...spec }) => {
        const hazard: Hazard = { ...spec, id: id ?? this.nextId() };
        this.hazards.push(hazard);
        return hazard.id;
      },
      spawnPickup: ({ kind, x, y, value, vx = 0, vy = 0, radius = kind === 'xp' ? 5 : 6, life }) => {
        this.spawnPickup(kind, x, y, vx, vy, radius, value);
        if (life !== undefined) this.pickups.at(-1)!.life = life;
      },
      spawnHostileShot: ({ x, y, vx = 0, vy = 0, radius = 7, damage = 0, life = 4, kind = 'enemy' }) => {
        this.spawnBossProjectile(x, y, vx, vy, radius, damage, life, kind);
      },
      burst: (x, y, count) => this.presentation.burst(x, y, count, '#111111', 180),
      director: () => {
        const director = this.director;
        if (!director) return null;
        const stageTime = this.duration - this.timeLeft;
        const beat = director.beatAt(stageTime);
        return {
          beat: beat.kind,
          formation: beat.formation,
          rateFactor: director.rateFactor(stageTime),
          terrainCap: director.terrainCap(stageTime),
          rewardScale: director.rewardScale(stageTime),
          segments: director.schedule.length,
          stageTime,
        };
      },
      onRenderLayer: (listener) => {
        this.worldRenderer.onLayer = listener;
      },
      renderStats: () => ({ ...this.worldRenderer.stats }),
      counts: () => ({
        enemies: this.enemies.length,
        projectiles: this.projectiles.length,
        hostileShots: this.bossProjectiles.length,
        particles: this.presentation.particles.length,
        damageNumbers: this.presentation.damageNumbers.length,
      }),
      damageNumber: (x, y, value, crit = false) => this.presentation.addDamageNumber(x, y, value, crit, 0.8, 'player'),
      removeHazards: (kinds) => {
        const drop = new Set(kinds);
        this.hazards = this.hazards.filter((hazard) => !drop.has(hazard.kind));
      },
      addObstacle: ({ id, ...spec }) => {
        const obstacle: Obstacle = { ...spec, id: id ?? this.nextId() };
        this.obstacles.push(obstacle);
        return obstacle.id;
      },
      setClock: ({ timeLeft, elapsed }) => {
        if (timeLeft !== undefined) this.timeLeft = timeLeft;
        if (elapsed !== undefined) this.elapsed = elapsed;
      },
      setStageKills: (count) => {
        this.stageKills = count;
      },
      resolveRound: () => this.resolveRoundState(),
      openDraft: (reason, after) => this.openDraft(reason, after),
      requestRoundClear: () => this.requestRoundClear(),
      patchRules: (patch) => {
        this.rules = Object.freeze({ ...this.rules, ...patch });
      },
      previewOffer: (skillId, kind) => this.makeOffer(skillId, kind),
      previewBonusOffers: (reason) => this.makeBonusOffers(reason),
      hud: () => this.buildHudSnapshot(),
      render: (alpha = 1) => this.render(alpha),
      renderWorld: (alpha = 1) => {
        const { effects, ...world } = this.buildRenderWorld(alpha);
        return copy({
          ...world,
          effects: {
            particles: effects.particles,
            damageNumbers: effects.damageNumbers,
            impactRings: effects.impactRings,
            blasts: effects.blasts,
            skillMarks: effects.skillMarks,
            corpses: effects.corpses,
            hitStamps: effects.hitStamps,
            recoils: effects.recoils,
            shake: effects.shake,
            playerHurt: effects.playerHurt,
            playerBurst: effects.playerBurst,
            playerCast: effects.playerCast,
            hurtVignette: effects.hurtVignette,
            hurtAngle: effects.hurtAngle,
            lowHealth: effects.lowHealth,
            deathMoment: effects.deathMoment,
          },
        });
      },
      resize: () => this.onResize(),
      onStep: (watcher) => {
        this.stepWatchers.add(watcher);
        return () => this.stepWatchers.delete(watcher);
      },
    };
  }
}
