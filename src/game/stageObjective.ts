// Stage objectives (CON-03). A normal stage keeps its survival clock, and its objective (OBJECTIVE_POOL) now changes
// the stage and sets a bonus goal, from src/content/data/objectives.ts. The engine asks this for the modifiers and
// reports kills, field bosses, and time in terrain to it. Placements draw from the objective's own random stream, so
// the rest of the stage keeps its draws. A bonus goal met on a clear pays gold and marks the stage record.
import OBJECTIVE_TABLE, { type ObjectiveBonus, type ObjectiveDef } from '../content/data/objectives.ts';
import { text, type Text } from '../i18n/text.ts';
import { FIELD_BOSS_MARKS, RANGED_ENEMY, TIER_ROLL } from './grammar.ts';

export type ObjectiveId = keyof typeof OBJECTIVE_TABLE.objectives;
export type BonusStatus = 'active' | 'done' | 'failed';
/** A place the bonus goal asks the player to stand: a zone to hold, or a cache to recover. */
export type ObjectiveMark = Readonly<{ kind: 'hold' | 'cache'; x: number; y: number; radius: number; progress: number }>;
export type BonusState = Readonly<{ goal: Text; progress: number; target: number; status: BonusStatus }>;
type Point = Readonly<{ x: number; y: number }>;
const NO_MARKS: readonly ObjectiveMark[] = [];

/** Seconds add up in 1/60 steps, so a 10 s stretch can land a hair short; timed goals allow for it. */
const EPSILON = 1e-6;
const TIER_SHARES = Object.freeze({ small: TIER_ROLL.small, medium: TIER_ROLL.medium - TIER_ROLL.small, large: 1 - TIER_ROLL.medium });

/**
 * Cumulative tier roll thresholds with one tier's share moved (G9 exception): the other two split what is left in
 * their usual proportion.
 */
export function shiftedTierRoll(mix: ObjectiveDef['mix']) {
  const moved = mix?.small !== undefined ? 'small' : mix?.large !== undefined ? 'large' : null;
  if (!moved) return { small: TIER_ROLL.small, medium: TIER_ROLL.medium };
  const share = TIER_SHARES[moved] + (mix?.[moved] ?? 0);
  const others = (Object.keys(TIER_SHARES) as (keyof typeof TIER_SHARES)[]).filter((tier) => tier !== moved);
  const rest = others.reduce((sum, tier) => sum + TIER_SHARES[tier], 0);
  const shares = { ...TIER_SHARES, [moved]: share } as Record<keyof typeof TIER_SHARES, number>;
  for (const tier of others) shares[tier] = (TIER_SHARES[tier] / rest) * (1 - share);
  return { small: shares.small, medium: shares.small + shares.medium };
}

/**
 * An objective as a stage plays it. With elites in play (SYS-10), the elite hunt brings elites and asks for elite
 * kills instead of strengthening the field bosses.
 */
export function objectiveDef(id: ObjectiveId, elites = false): ObjectiveDef {
  const def = OBJECTIVE_TABLE.objectives[id];
  return elites && def.eliteHunt ? { ...def, fieldBoss: undefined, bonus: def.eliteHunt.bonus } : def;
}

/** Ranged enemies alive at once on a chapter's stage (G9: 1-3), raised by the objective up to its maximum. */
export function rangedCapFor(def: ObjectiveDef | undefined, chapter: number) {
  const base = Math.min(RANGED_ENEMY.maxConcurrent, 1 + Math.ceil(chapter / 2));
  return def?.rangedCap ? Math.min(OBJECTIVE_TABLE.maxRanged, base * def.rangedCap) : base;
}

/**
 * P2-3 proposal (bonusGoalRetune rule): an objective's bonus goal with the retuned chapter's numbers, the kill target
 * or the field boss window. Other goals stay as they are.
 */
export function retunedBonus(id: ObjectiveId, bonus: ObjectiveBonus, chapter: number): ObjectiveBonus {
  const { kills, fieldBossWithin } = OBJECTIVE_TABLE.retune;
  const byChapter = kills[id];
  if (bonus.kind === 'kills' && byChapter) return { ...bonus, byChapter };
  if (bonus.kind === 'fieldBosses' && bonus.within !== undefined) return { ...bonus, within: fieldBossWithin[chapter - 1] ?? bonus.within };
  return bonus;
}

/** The goal's target on a stage: kills scale by chapter; field boss goals count the stage's field bosses. */
export function bonusTarget(bonus: ObjectiveBonus, chapter: number, def: ObjectiveDef) {
  if (bonus.kind === 'kills' && bonus.byChapter) return bonus.byChapter[chapter - 1] ?? bonus.count;
  // Elites come a few at a time in every chapter, so an elite goal does not grow with the crowds.
  if (bonus.kind === 'kills') return Math.round(bonus.count * (bonus.tier === 'elite' ? 1 : OBJECTIVE_TABLE.killScale[chapter - 1] ?? 1));
  if (bonus.kind === 'hold') return bonus.seconds;
  if (bonus.kind === 'salvage') return bonus.count;
  if (bonus.kind === 'fieldBosses') return FIELD_BOSS_MARKS.length + (def.extraFieldBossMarks?.length ?? 0);
  return bonus.seconds;
}

export function bonusGoal(bonus: ObjectiveBonus, target: number): Text {
  if (bonus.kind === 'kills') return text(`bonus.goal.${bonus.tier}`, { n: target });
  if (bonus.kind === 'terrain') return text('bonus.goal.terrain', { n: target });
  if (bonus.kind === 'fieldBosses' && bonus.within) return text('bonus.goal.fieldBossesWithin', { n: target, s: bonus.within });
  return text(`bonus.goal.${bonus.kind}`, { n: target });
}

/** Gold a met bonus goal pays: a share of the stage's floor gold (GameEngine.makeSettlement's base, chapter, and stage parts). */
export function bonusGold(chapter: number, stage: number) {
  return Math.floor((40 + chapter * 18 + stage * 8) * OBJECTIVE_TABLE.bonusGoldShare);
}

export class StageObjective {
  readonly def: ObjectiveDef;
  readonly tierRoll: Readonly<{ small: number; medium: number }>;
  readonly target: number;
  readonly goal: Text;
  readonly fieldBossMarks: readonly number[];
  /** SYS-10: the stage brings elites in every beat (ELITES.objectiveChance). */
  readonly eliteHunt: boolean;
  private progress = 0;
  private failed = false;
  private mark: { kind: ObjectiveMark['kind']; x: number; y: number; radius: number; progress: number } | null = null;
  private held = 0;
  private waiting = 0;
  private shown: ObjectiveMark[] = [];

  /**
   * `modifiers` is false for the campaign's first stage, which teaches the game: it keeps its bonus goal but not the
   * harder mix. `bonus` is false in practice runs, whose short clock cannot reach the goals. `retuned` takes the P2-3
   * proposal's goals (bonusGoalRetune rule).
   */
  constructor(
    readonly id: ObjectiveId,
    chapter: number,
    private readonly random: () => number,
    readonly modifiers = true,
    readonly bonus = true,
    elites = false,
    retuned = false,
  ) {
    const def = objectiveDef(id, elites);
    this.def = retuned ? { ...def, bonus: retunedBonus(id, def.bonus, chapter) } : def;
    this.eliteHunt = modifiers && elites && objectiveDef(id).eliteHunt !== undefined;
    this.tierRoll = modifiers ? shiftedTierRoll(this.def.mix) : { small: TIER_ROLL.small, medium: TIER_ROLL.medium };
    this.target = bonusTarget(this.def.bonus, chapter, this.def);
    this.goal = bonusGoal(this.def.bonus, this.target);
    this.fieldBossMarks = modifiers ? [...FIELD_BOSS_MARKS, ...(this.def.extraFieldBossMarks ?? [])] : FIELD_BOSS_MARKS;
  }

  get spawnRate() {
    return this.modifiers ? this.def.spawnRate ?? 1 : 1;
  }

  get terrainScale() {
    return this.modifiers ? this.def.terrain ?? 1 : 1;
  }

  rangedCap(chapter: number) {
    return rangedCapFor(this.modifiers ? this.def : undefined, chapter);
  }

  get fieldBossScale() {
    return this.modifiers ? this.def.fieldBoss : undefined;
  }

  onKill(kill: Readonly<{ tier: string; ranged: boolean; fieldBoss: boolean; elite?: boolean; aliveSeconds?: number }>) {
    const bonus = this.def.bonus;
    if (!this.bonus || this.status !== 'active') return;
    const counts = bonus.kind === 'kills' && (bonus.tier === 'ranged' ? kill.ranged : bonus.tier === 'elite' ? kill.elite === true : kill.tier === bonus.tier && !kill.fieldBoss);
    if (counts) this.progress += 1;
    if (bonus.kind === 'fieldBosses' && kill.fieldBoss && (bonus.within === undefined || (kill.aliveSeconds ?? 0) <= bonus.within)) this.progress += 1;
  }

  /** D-04: a timed field boss goal fails once a field boss has lived past its window. */
  get timesFieldBosses() {
    return this.bonus && this.def.bonus.kind === 'fieldBosses' && this.def.bonus.within !== undefined;
  }

  onFieldBossAlive(seconds: number) {
    const bonus = this.def.bonus;
    if (bonus.kind === 'fieldBosses' && bonus.within !== undefined && seconds > bonus.within && this.status === 'active') this.failed = true;
  }

  /** Time the player spent standing in terrain; the terrain goal fails once it passes its limit. */
  onTerrainTime(dt: number) {
    if (!this.bonus || this.def.bonus.kind !== 'terrain' || this.failed) return;
    this.progress += dt;
    if (this.progress > this.target) this.failed = true;
  }

  /** Moves the hold zone and the caches; `place` returns a free spot for a mark of that radius near the player. */
  update(dt: number, player: Point, place: (radius: number, random: () => number) => Point) {
    const bonus = this.def.bonus;
    if (!this.bonus || (bonus.kind !== 'hold' && bonus.kind !== 'salvage') || this.status !== 'active') return;
    if (!this.mark) {
      this.waiting = Math.max(0, this.waiting - dt);
      if (this.waiting > 0) return;
      const spot = place(bonus.radius, this.random);
      this.mark = { kind: bonus.kind === 'hold' ? 'hold' : 'cache', x: spot.x, y: spot.y, radius: bonus.radius, progress: 0 };
      this.held = 0;
      return;
    }
    const inside = Math.hypot(player.x - this.mark.x, player.y - this.mark.y) <= this.mark.radius;
    if (bonus.kind === 'hold') {
      if (inside) {
        this.progress = Math.min(this.target, this.progress + dt);
        this.held += dt;
      }
      this.mark.progress = this.held / bonus.moveEvery;
      // The zone moves on after each stretch held, so holding the line means moving with it.
      if (this.held >= bonus.moveEvery - EPSILON || this.progress >= this.target - EPSILON) this.mark = null;
      return;
    }
    this.held = inside ? this.held + dt : Math.max(0, this.held - dt * 2);
    this.mark.progress = this.held / bonus.seconds;
    if (this.held >= bonus.seconds - EPSILON) {
      this.progress += 1;
      this.mark = null;
      this.waiting = 3;
    }
  }

  get status(): BonusStatus {
    if (this.failed) return 'failed';
    if (this.def.bonus.kind === 'terrain') return 'active';
    return this.progress >= this.target - EPSILON ? 'done' : 'active';
  }

  /** Met at the end of a cleared stage: the terrain goal holds if it never failed. */
  met(cleared: boolean) {
    if (!this.bonus || !cleared) return false;
    return this.def.bonus.kind === 'terrain' ? !this.failed : this.progress >= this.target - EPSILON;
  }

  state(): BonusState | null {
    if (!this.bonus) return null;
    const timed = this.def.bonus.kind === 'hold' || this.def.bonus.kind === 'terrain';
    const progress = timed ? Math.min(this.target, Math.floor(this.progress + EPSILON)) : this.progress;
    return { goal: this.goal, progress, target: this.target, status: this.status };
  }

  /** The mark on the ground, if any; the renderer reads it every frame, so the list is kept rather than rebuilt. */
  marks(): readonly ObjectiveMark[] {
    if (!this.mark) return NO_MARKS;
    if (this.shown[0] !== this.mark) this.shown = [this.mark];
    return this.shown;
  }
}
