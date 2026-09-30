// Enemy role behaviours (SYS-02): the numbers and the pure steering math behind the four roles and enemy
// separation. The engine applies them behind one rule flag per behaviour, so each can be A/B-tested against the
// original straight-line chase. Tiers, radii, and the 58/30/12 mix never change here (G9, V4).
import type { EnemyTier } from './engine/worldTypes.ts';

/** Charger (medium contact): a visible windup, then a straight dash; a wall stops it cold. */
export const CHARGER = Object.freeze({
  /** Matches the dash telegraph time in the visual grammar (V3: dash 0.62 s). */
  windupSeconds: 0.62,
  dashSeconds: 0.5,
  speedMultiple: 3.6,
  /** Only dashes at a player this close. */
  range: 320,
  cooldownSeconds: [4, 6] as const,
  /** Newly spawned chargers wait this long before their first dash. */
  firstCooldownSeconds: [1.5, 3.5] as const,
  /** At most this many chargers wind up at once. */
  maxWindups: 3,
  wallStunSeconds: 0.8,
});

/** Warden (large contact): a front shield that turns slowly enough to flank. */
export const WARDEN_SHIELD = Object.freeze({
  halfArcRadians: (60 * Math.PI) / 180,
  /** Damage taken through the shield. */
  damageScale: 0.4,
  turnRadiansPerSecond: (90 * Math.PI) / 180,
});

/** Shooter (ranged): the aim leads a moving player by the windup plus the shot's travel time. */
export const SHOOTER_LEAD = Object.freeze({ maxLeadSeconds: 1.4 });

/** Stalker (small contact): chases in packs, steering by its nearest few pack mates. */
export const STALKER_FLOCK = Object.freeze({ radius: 110, alignment: 0.35, cohesion: 0.2, minNeighbours: 2, maxNeighbours: 10 });

/** Separation: overlapping enemies move apart by this share of the overlap each step, lighter ones more. */
export const SEPARATION = Object.freeze({ strength: 0.25 });

export type EnemyRole = 'stalker' | 'charger' | 'shooter' | 'warden';

/**
 * An enemy's role from its tier and attack style: ranged ones shoot, contact ones stalk, charge, or guard.
 * Bosses have their own patterns; callers skip them.
 */
export function enemyRole(tier: EnemyTier, attackStyle: 'contact' | 'ranged'): EnemyRole {
  if (attackStyle === 'ranged') return 'shooter';
  if (tier === 'large') return 'warden';
  if (tier === 'medium') return 'charger';
  return 'stalker';
}

type Point = Readonly<{ x: number; y: number }>;
type Mover = Readonly<{ x: number; y: number; vx: number; vy: number }>;

function unit(x: number, y: number): { x: number; y: number } {
  const length = Math.hypot(x, y);
  return length > 1e-9 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}

/**
 * The share of an overlap that body a takes when it separates from body b: split by mass (r^2), except that a boss
 * never gives way to an ordinary body, which takes the whole push. Crowds make room for a boss instead of
 * holding it off the player (a crowd of 150 used to shove bosses back faster than they walk).
 */
export function separationShare(ar: number, aBoss: boolean, br: number, bBoss: boolean) {
  if (aBoss !== bBoss) return aBoss ? 0 : 1;
  return (br * br) / (ar * ar + br * br);
}

/**
 * How far body a moves when it overlaps body b: along b->a, by the overlap times strength times a's share.
 * Writes into `out` when given, so the engine's per-step loop allocates nothing.
 */
export function separationPush(a: Point & { isBoss?: boolean }, ar: number, b: Point & { isBoss?: boolean }, br: number, strength = SEPARATION.strength, out = { x: 0, y: 0 }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const d = Math.hypot(dx, dy);
  const overlap = ar + br - d;
  out.x = 0;
  out.y = 0;
  if (overlap <= 0) return out;
  const share = separationShare(ar, a.isBoss === true, br, b.isBoss === true);
  const amount = overlap * strength * share;
  // Exactly stacked bodies part along a fixed axis so the result stays deterministic.
  if (d > 1e-6) {
    out.x = (dx / d) * amount;
    out.y = (dy / d) * amount;
  } else {
    out.x = amount;
  }
  return out;
}

/** The chase direction bent toward the pack: neighbours' mean heading (alignment) and their centre (cohesion). */
export function flockSteer(self: Point, chase: Point, neighbours: readonly Mover[]) {
  if (neighbours.length < STALKER_FLOCK.minNeighbours) return unit(chase.x, chase.y);
  let vx = 0;
  let vy = 0;
  let cx = 0;
  let cy = 0;
  for (const other of neighbours) {
    const heading = unit(other.vx, other.vy);
    vx += heading.x;
    vy += heading.y;
    cx += other.x;
    cy += other.y;
  }
  const alignment = unit(vx, vy);
  const cohesion = unit(cx / neighbours.length - self.x, cy / neighbours.length - self.y);
  return unit(
    chase.x + alignment.x * STALKER_FLOCK.alignment + cohesion.x * STALKER_FLOCK.cohesion,
    chase.y + alignment.y * STALKER_FLOCK.alignment + cohesion.y * STALKER_FLOCK.cohesion,
  );
}

/**
 * Where a shot fired after `windup` seconds at `speed` meets a target moving at a constant velocity (two passes,
 * lead capped at SHOOTER_LEAD.maxLeadSeconds).
 */
export function leadAim(shooter: Point, target: Point, velocity: Point, windup: number, speed: number) {
  let x = target.x;
  let y = target.y;
  for (let pass = 0; pass < 2; pass += 1) {
    const time = Math.min(SHOOTER_LEAD.maxLeadSeconds, windup + Math.hypot(x - shooter.x, y - shooter.y) / Math.max(1, speed));
    x = target.x + velocity.x * time;
    y = target.y + velocity.y * time;
  }
  return { x, y };
}

/** The smallest signed angle from a to b, in (-pi, pi]. */
export function angleDelta(a: number, b: number) {
  let delta = (b - a) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta <= -Math.PI) delta += Math.PI * 2;
  return delta;
}

/** Turns an angle toward a target by at most maxStep radians. */
export function turnToward(current: number, target: number, maxStep: number) {
  const delta = angleDelta(current, target);
  if (Math.abs(delta) <= maxStep) return target;
  return current + Math.sign(delta) * maxStep;
}

/** Whether a hit coming from `source` lands inside the shield's front arc. */
export function shieldCovers(shieldAngle: number, body: Point, source: Point, halfArc = WARDEN_SHIELD.halfArcRadians) {
  const incoming = Math.atan2(source.y - body.y, source.x - body.x);
  return Math.abs(angleDelta(shieldAngle, incoming)) <= halfArc;
}

type SeparationBody = { x: number; y: number; radius: number; hp: number; isBoss: boolean };

/**
 * Separation broad phase (SYS-02): a flat grid rebuilt per step, so a dense crowd costs no allocations. Each
 * overlapping pair is visited once and both bodies get their share of the push; pushes are summed first and
 * applied by the caller, so the result does not depend on visiting order. Bosses (a handful, radius up to 54)
 * are checked against the grid separately so ordinary cells stay small.
 */
export class SeparationGrid {
  private readonly cellSize: number;
  private readonly originX: number;
  private readonly originY: number;
  private readonly columns: number;
  private readonly rows: number;
  private readonly heads: Int32Array;
  private next = new Int32Array(256);
  private cellOf = new Int32Array(256);
  pushX = new Float64Array(256);
  pushY = new Float64Array(256);

  constructor(bounds: Readonly<{ minX: number; minY: number; maxX: number; maxY: number }>, cellSize = 56) {
    this.cellSize = cellSize;
    this.originX = bounds.minX;
    this.originY = bounds.minY;
    this.columns = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) / cellSize) + 1);
    this.rows = Math.max(1, Math.ceil((bounds.maxY - bounds.minY) / cellSize) + 1);
    this.heads = new Int32Array(this.columns * this.rows);
  }

  private column(x: number) {
    return Math.min(this.columns - 1, Math.max(0, Math.floor((x - this.originX) / this.cellSize)));
  }

  private row(y: number) {
    return Math.min(this.rows - 1, Math.max(0, Math.floor((y - this.originY) / this.cellSize)));
  }

  /** Buckets the live, non-boss bodies by cell. `compute` and `forEachNear` read the buckets. */
  build(bodies: readonly SeparationBody[]) {
    const count = bodies.length;
    if (this.next.length < count) {
      const size = Math.max(count, this.next.length * 2);
      this.next = new Int32Array(size);
      this.cellOf = new Int32Array(size);
      this.pushX = new Float64Array(size);
      this.pushY = new Float64Array(size);
    }
    this.heads.fill(-1);
    for (let index = 0; index < count; index += 1) {
      const body = bodies[index];
      this.cellOf[index] = -1;
      if (body.hp <= 0 || body.isBoss) continue;
      const cell = this.row(body.y) * this.columns + this.column(body.x);
      this.cellOf[index] = cell;
      this.next[index] = this.heads[cell];
      this.heads[cell] = index;
    }
  }

  /**
   * Calls `visit` with the index of bucketed bodies within `radius` (plus their own radius) of (x, y), nearest
   * cells first (the home cell, then ring by ring), until `visit` returns true. Uses the buckets from the last
   * `build`.
   */
  forEachNear(bodies: readonly SeparationBody[], x: number, y: number, radius: number, visit: (index: number) => boolean | void) {
    const reach = Math.ceil(radius / this.cellSize);
    const column = this.column(x);
    const row = this.row(y);
    for (let ring = 0; ring <= reach; ring += 1) {
      for (let cy = row - ring; cy <= row + ring; cy += 1) {
        if (cy < 0 || cy >= this.rows) continue;
        const edgeRow = cy === row - ring || cy === row + ring;
        for (let cx = column - ring; cx <= column + ring; cx += edgeRow ? 1 : ring * 2 || 1) {
          if (cx < 0 || cx >= this.columns) continue;
          for (let other = this.heads[cy * this.columns + cx]; other >= 0; other = this.next[other]) {
            const body = bodies[other];
            if (Math.hypot(body.x - x, body.y - y) < radius + body.radius && visit(other) === true) return;
          }
        }
      }
    }
  }

  /** Fills pushX/pushY (indexed like `bodies`) with each body's total separation push. */
  compute(bodies: readonly SeparationBody[], strength = SEPARATION.strength) {
    const count = bodies.length;
    this.build(bodies);
    this.pushX.fill(0, 0, count);
    this.pushY.fill(0, 0, count);
    for (let index = 0; index < count; index += 1) {
      const cell = this.cellOf[index];
      if (cell < 0) continue;
      const column = cell % this.columns;
      const row = (cell - column) / this.columns;
      this.visitNeighbours(bodies, index, column, row, 1, strength, true);
    }
    // Bosses against ordinary bodies (reach two cells) and against each other.
    for (let index = 0; index < count; index += 1) {
      const body = bodies[index];
      if (body.hp <= 0 || !body.isBoss) continue;
      this.visitNeighbours(bodies, index, this.column(body.x), this.row(body.y), 2, strength, false);
      for (let other = index + 1; other < count; other += 1) {
        if (bodies[other].isBoss && bodies[other].hp > 0) this.pair(bodies, index, other, strength);
      }
    }
  }

  private visitNeighbours(bodies: readonly SeparationBody[], index: number, column: number, row: number, reach: number, strength: number, laterOnly: boolean) {
    for (let y = Math.max(0, row - reach); y <= Math.min(this.rows - 1, row + reach); y += 1) {
      for (let x = Math.max(0, column - reach); x <= Math.min(this.columns - 1, column + reach); x += 1) {
        for (let other = this.heads[y * this.columns + x]; other >= 0; other = this.next[other]) {
          if (other === index || (laterOnly && other < index)) continue;
          this.pair(bodies, index, other, strength);
        }
      }
    }
  }

  private pair(bodies: readonly SeparationBody[], a: number, b: number, strength: number) {
    const first = bodies[a];
    const second = bodies[b];
    const dx = first.x - second.x;
    const dy = first.y - second.y;
    const d = Math.hypot(dx, dy);
    const overlap = first.radius + second.radius - d;
    if (overlap <= 0) return;
    const ux = d > 1e-6 ? dx / d : 1;
    const uy = d > 1e-6 ? dy / d : 0;
    const shareA = separationShare(first.radius, first.isBoss, second.radius, second.isBoss);
    const toA = overlap * strength * shareA;
    const toB = overlap * strength * (1 - shareA);
    this.pushX[a] += ux * toA;
    this.pushY[a] += uy * toA;
    this.pushX[b] -= ux * toB;
    this.pushY[b] -= uy * toB;
  }
}
