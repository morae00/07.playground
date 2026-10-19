// Terrain hazard painter (K11): the kit's hazard stamps (PN.hazards, baked into the `hazards` pack) and its shapes
// (SPEC, baked into the atlas manifest as data), drawn on the canvas (API-hazards §4, §8-§10). The layouts and paths
// are ports of the kit's (API §8), tested against the kit's own vectors in the manifest, so the numbers stay data.
// Only the kinds in HAZARD_ART_KINDS draw here; the rest keep GameRenderer.drawHazard.
import type { Hazard, ShockBurst } from '../engine/worldTypes.ts';
import type { HazardManifest, HazardPart, SpriteAtlas } from './assets/spriteAtlas.ts';
import { HAZARDS_PACK, HAZARD_ART_KINDS, slotEnabled } from './assets/slots.ts';
import { NEUTRAL, SIGNAL } from './palette.ts';
import { jit } from './skillVfx.ts';
import type { VisualDetail } from './visualRegistry.ts';
import { circleVisible, type Viewport } from './viewport.ts';

/** SPEC token names to the palette (API §7.1). */
const TOKENS: Readonly<Record<string, string>> = {
  ink: NEUTRAL.ink, ink700: NEUTRAL.inkSoft, ink300: NEUTRAL.inkMuted, p50: NEUTRAL.paperBright, p100: NEUTRAL.paper, p300: NEUTRAL.paperShadow,
  voidPaper: NEUTRAL.voidPaper, hostile: SIGNAL.hostile, hostileGlow: SIGNAL.hostileGlow, warn: SIGNAL.warn, warnGlow: SIGNAL.warnGlow,
};
export const hazardTokenColor = (token: string) => TOKENS[token];

type N2 = readonly [number, number];
type N3 = readonly [number, number, number];
type P2 = [number, number];
/** A SPEC stroke row: [token, width, offset from r (inside −), alpha (1), dash]. */
type Row = readonly [string, number, number?, number?, (readonly number[])?];
/** [token, share of the crack's ink width] or [token, width]. */
type Layer = readonly [string, number];
type Disc = Readonly<{ token: string; alpha: number }>;
type Range = Readonly<{ frac: number; pad?: number; cap?: number }>;
type Inset = Readonly<{ min?: number; pad?: number; jitter?: number }>;
/** A scatter's numbers in SPEC (API §8.0-2), with its count rule. */
type Scatter = Readonly<{ tries: number; cand: number; reach: Range; gap: Range; squash: number; far?: number; mirror?: number; pool?: string; jit: Readonly<{ base: number; stride: number; small?: number }> }>;
type Counted = Scatter & Readonly<{ per: number; area: number; min: number; max: number; minimal: number; spread: N2 }>;

/** The parts of the kit's SPEC this painter reads (API-hazards §7). */
export type HazardSpec = Readonly<{
  jit: Readonly<{ kron: readonly number[] }>;
  caps: Readonly<{ stamps: N3 }>;
  fire: Readonly<{
    base: Disc;
    rim: readonly Row[];
    size: Readonly<{ m: number }>;
    windows: Readonly<{ ignite: number; gutter: number }>;
    ignite: Readonly<{ flash: Readonly<{ layers: readonly Row[]; seconds: number }> }>;
    gutter: Readonly<{ coldCross: number }>;
    soot: Readonly<{ seconds: number; base: Disc; caps: N3 }>;
    layout: Readonly<{
      cluster: Scatter & Readonly<{ area: number; min: number; max: number; maxBig: number; big: number; minimal: number; far: number; fallbackY: number }>;
      rim: Readonly<{ parts: readonly string[]; countInset: number; pitch: N2; big: number; skip: number; angleJitter: number; inset: Readonly<{ min: number; pad: number; jitter: number }>; far: number; farIn: number; jit: Readonly<Record<'skip' | 'angle' | 'dist' | 'variant' | 'flip' | 'phase', number>> }>;
      char: Readonly<{ per: number; min: number; max: number; maxBig: number; big: number; minimal: number; tries: number; inset: number; gap: number; jit: Readonly<Record<'angle' | 'dist' | 'variant' | 'flip', number>> }>;
      caps: N3;
      prio: Readonly<{ cluster: number; char: number; rim: number }>;
      cut: Readonly<{ even: number; keep: number }>;
    }>;
    embers: Readonly<{ per: number; min: number; max: number; cycle: number; jitter: number; rise: number; drift: number; origin: Readonly<{ dx: N2; dy: N2 }>; jit: Readonly<Record<'dx' | 'dy' | 'period' | 'phase' | 'sign', number>> }>;
    smoke: Readonly<{ max: number; cycle: number; jitter: number; start: number; stagger: number; until: number; origin: Readonly<{ dy: number }>; rise: number; drift: number; jit: Readonly<Record<'period' | 'start' | 'sign', number>> }>;
    caps: Readonly<{ stamps: N3; embers: N3 }>;
  }>;
  hero: Readonly<{
    tint: Readonly<{ alpha: N2; step: number; steady: number; fadeIn: number; fadeOut: number }>;
    embers: Readonly<{ origins: readonly N2[]; cycle: number; jitter: number; rise: number; drift: number; outward: boolean; seed: number; jit: Readonly<{ period: number; phase: number }> }>;
  }>;
  mob: Readonly<{ radii: readonly number[]; caps: N3 }>;
  shock: Readonly<{
    cracks: Readonly<{ arms: number; start: number; seg: number; segJitter: number; turn: number; push: N2; reach: number; branchAt: number; branchLen: number; branchTurn: number; branchSegs: number; grow: Readonly<{ full: number; power: number }>; width: N2; jit: Readonly<Record<'arm' | 'seg' | 'segStride' | 'side' | 'branch', number>> }>;
    coreLayers: Readonly<Record<'telegraph' | 'imminent' | 'burst' | 'decal', readonly Layer[]>>;
    burst: Readonly<{
      seconds: number;
      fill: Disc & Readonly<{ seconds: number }>;
      edge: Readonly<{ token: string; dots: number; pitch: number; rows: readonly N2[] }>;
      flash: Readonly<{ layers: readonly Row[]; seconds: number }>;
      shards: Readonly<{ count: number; from: number; to: number; out: number; hop: number; seconds: number; jit: number }>;
      dust: Readonly<{ count: number; at: number; seconds: number; jit: number }>;
    }>;
    decal: Readonly<{ seconds: number; alpha: N2; crater: Disc & Readonly<{ r: number }> }>;
    layout: Readonly<{ pebble: Readonly<{ count: number; arms: readonly number[]; from: number; span: number; jit: Readonly<Record<'at' | 'variant' | 'phase' | 'flip', number>> }>; caps: N3 }>;
  }>;
  slow: Readonly<{
    rim: readonly Row[];
    end: Readonly<{ seconds: number }>;
    dial: Readonly<{ ticks: number; r0: number; r1: number; long: number; every: number; on: readonly Row[]; off: readonly Row[]; hand: Readonly<{ len: number; layers: readonly Layer[]; hub: Layer }>; period: number }>;
    layout: Readonly<{
      mire: Scatter & Readonly<{ tiers: readonly (readonly [number, string, string, number])[]; fill: Readonly<Record<string, number>>; target: number; min: number; max: number; minimal: number; sep: number }>;
      bubble: Readonly<{ per: number; min: number; max: number; spread: N2; jit: number }>;
      caps: N3;
    }>;
  }>;
  root: Readonly<{ rim: readonly Row[]; windows: Readonly<{ emerge: number; wither: number }>; faded: Readonly<{ alpha: number }>; layout: Readonly<{ vine: Counted; caps: N3 }> }>;
  water: Readonly<{
    base: Disc;
    rim: readonly Row[];
    layout: Readonly<{ wave: Counted; ripple: Counted; flow: Counted; glint: Readonly<{ angle: number; spread: number; at: number; jit: number }>; prio: Readonly<Record<'wave' | 'ripple' | 'flow' | 'glint', number>>; caps: N3; cut: Readonly<{ even: number; keep: number }> }>;
  }>;
  trap: Readonly<{
    plate: Disc;
    rim: readonly Row[];
    groove: readonly Row[];
    spokes: Readonly<{ count: number; from: number; to: number; layers: readonly Row[] }>;
    rivets: Readonly<{ per: number; min: number; at: number; size: number; token: string }>;
    windows: Readonly<{ spring: number; fadeLast: number; sprungAlpha: number; fallback: Readonly<Record<number, number>> }>;
  }>;
  null: Readonly<{
    base: Disc;
    ghost: Readonly<{ lines: N2; split: number; dash: readonly number[]; layers: readonly Row[]; inset: number; minOffset: number; jit: Readonly<{ base: number }> }>;
    rim: readonly Row[];
    active: Readonly<{ on: boolean; layers: readonly Layer[]; at: number }>;
    erase: Readonly<{ seconds: number; jag: Readonly<{ points: number; depth: number; jit: number }> }>;
    restore: Readonly<{ seconds: number; line: Layer }>;
    layout: Readonly<{ crumb: Readonly<{ per: number; min: number; max: number; inset: Inset; jit: Readonly<{ base: number }> }>; caps: N3 }>;
  }>;
}>;

type Parts = Readonly<Record<string, HazardPart>>;
type Groups = Readonly<Record<string, Parts>>;
/** A layout item (API §8): placement, and its class (prio) and order of placement (gen); `rank` is its place in its class. */
export type FireItem = { part: string; x: number; y: number; flip: boolean; phase: number; z: string; prio: number; gen: number; ring?: number; rank?: number };
/** A fire's layout before the per-hazard cap, kept per hazard id; `lods` caches each level's capped output. */
export type FireLayout = { r: number; nc: number; nch: number; clusters: FireItem[]; ring: FireItem[]; chars: FireItem[]; lods: (FireItem[] | undefined)[]; counts: (N3 | undefined)[] };
export type Slot = Readonly<{ part: string; x: number; y: number; frame: number }>;

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const frac = (v: number) => v - Math.floor(v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const item = (part: string, x: number, y: number, flip: boolean, phase: number, z: string, prio: number, gen: number): FireItem => ({ part, x, y, flip, phase, z, prio, gen });
/** A variant letter from a draw. */
const ab = (v: number) => (v < 0.5 ? 'a' : 'b');
/** A count by radius (`per` units each), kept within its bounds. */
const count = (o: Readonly<{ per: number; min: number; max: number }>, v: number) => clamp(Math.round(v / o.per), o.min, o.max);
/** A slot `u` of the way through its cycle: its frame of the six. */
const slot = (part: string, x: number, y: number, u: number): Slot => ({ part, x, y, frame: Math.min(5, Math.floor(6 * u)) });
export const LODS: readonly VisualDetail[] = ['full', 'reduced', 'minimal'];

/** API §8.0-0: the Kronecker run kr(t, n) = frac(J(base + t) + n·kron[t]) every 2D draw of the delivery-2 kinds uses. */
export function kron(spec: HazardSpec, seed: number, base: number) {
  const K = spec.jit.kron;
  const k0 = K.map((_, t) => jit(seed, base + t));
  return (t: number, n: number) => frac(k0[t] + n * K[t]);
}

/** API §8.0-1, 'rise': the centre distance of a stamp rising toward angle a, inset from the rim by its half width. */
export function rimDist(r: number, a: number, box: N2, u: number, o: Inset) {
  return r - (Math.max(o.min!, (box[0] - 6) / 2 * Math.abs(Math.cos(a)) + o.pad!) + o.jitter! * u);
}
/** API §8.0-1, 'ground': the centre distance at which a flat stamp's inscribed ellipse (box − 6) stays inside r − 2. */
export function groundDist(r: number, a: number, box: N2, u: number, o?: Inset) {
  const ex = (box[0] - 6) / 2, ey = (box[1] - 6) / 2;
  let d = r - 2 - Math.hypot(ex * Math.cos(a), ey * Math.sin(a));
  for (let k = 0; k < 2; k += 1) {
    let m = 0;
    for (let t = 0; t < 16; t += 1) {
      const A = t * Math.PI / 8;
      m = Math.max(m, Math.hypot(d * Math.cos(a) + ex * Math.cos(A), d * Math.sin(a) + ey * Math.sin(A)));
    }
    if (m > r - 2) d -= m - (r - 2);
  }
  return d - (o?.pad ?? 0) - (o?.jitter ?? 0) * u;
}
const farOK = (r: number, x: number, y: number, tip: number, far: number) => !(y - tip < -Math.sqrt(Math.max(0, r * r - x * x)) - far);

type ScatterOptions = Scatter & Readonly<{ n: number; mode: 'rise' | 'ground'; box: N2; tip?: number; inset?: Inset; fixed?: readonly Readonly<{ x: number; y: number }>[] }>;
/**
 * API §8.0-2: best-candidate scatter. The fire pool draws (J(ix), J(ix + 1)); pool 'kr' draws the Kronecker run, and its
 * n-th placed point carries w = three more draws (variant, flip, phase). A mirror inset scores the rim as a neighbour.
 */
export function scatter(spec: HazardSpec, r: number, seed: number, o: ScatterOptions) {
  const out: { x: number; y: number; ix: number; gen: number; w: number[] }[] = [];
  const sq = o.squash || 1, fixed = o.fixed ?? [];
  const reach = Math.max(o.reach.frac * r, r - o.reach.pad!), gap = Math.min(o.gap.frac * r, o.gap.cap!);
  const kr = o.pool === 'kr' ? kron(spec, seed, o.jit.base) : null;
  for (let k = 0; k < o.tries && out.length < o.n; k += 1) {
    let best: { x: number; y: number; ix: number } | null = null;
    let bestS = -Infinity;
    for (let c = 0; c < o.cand; c += 1) {
      const q = k * o.cand + c, ix = o.jit.base + q * o.jit.stride;
      const a = TAU * (kr ? kr(0, q) : jit(seed, ix)), d = reach * Math.sqrt(kr ? kr(1, q) : jit(seed, ix + 1)), x = Math.cos(a) * d, y = Math.sin(a) * d;
      if (o.mode === 'ground' ? d > groundDist(r, a, o.box, 0, o.inset) : !farOK(r, x, y, o.tip!, o.far!) || d > rimDist(r, a, o.box, 0, o.inset ?? spec.fire.layout.rim.inset)) continue;
      let s = -Math.hypot(x, y);
      if (out.length || fixed.length) {
        let dp = Infinity;
        for (const p of out) dp = Math.min(dp, Math.hypot(p.x - x, sq * (p.y - y)));
        for (const p of fixed) dp = Math.min(dp, Math.hypot(p.x - x, sq * (p.y - y)));
        if (dp < gap) continue;
        s = o.mirror == null ? dp : Math.min(dp, 2 * (r - o.mirror - d) * Math.hypot(Math.cos(a), sq * Math.sin(a)));
      }
      if (s > bestS) {
        bestS = s;
        best = { x, y, ix };
      }
    }
    if (!best) continue;
    const n = out.length;
    out.push({ ...best, gen: k, w: kr ? [kr(2, n), kr(3, n), kr(4, n)] : [] });
  }
  return out;
}

/** API §8.0-4 (S3): the per-hazard cap. The ring (prio even) goes first and evenly, then the rest latest first, keeping `keep` bodies. */
export function capCut(items: readonly FireItem[], cap: number, even: number, keep: number) {
  let over = items.length - cap;
  if (over <= 0) return items.slice();
  const drop = new Set<FireItem>();
  const ring = items.filter((q) => q.prio === even).sort((p, q) => p.gen - q.gen);
  const n = ring.length;
  const nd = Math.min(n, over);
  for (let j = 0; j < nd; j += 1) drop.add(ring[Math.floor(((j + 0.5) * n) / nd)]);
  over -= nd;
  if (over > 0) {
    let body = items.filter((q) => q.prio === 0).length;
    const rest = items.filter((q) => q.prio !== even).sort((p, q) => q.prio - p.prio || q.gen - p.gen);
    for (let j = 0; j < rest.length && over > 0; j += 1) {
      if (rest[j].prio === 0) {
        if (body <= keep) continue;
        body -= 1;
      }
      drop.add(rest[j]);
      over -= 1;
    }
  }
  return items.filter((q) => !drop.has(q));
}

/** Layout output order (API §8): ground items by y (then placement), then the rest. */
const byY = (p: FireItem, q: FireItem) => p.y - q.y || p.gen - q.gen;
const sortItems = (items: readonly FireItem[]) => items.filter((q) => q.z === 'ground').sort(byY).concat(items.filter((q) => q.z !== 'ground').sort(byY));

/** API §8.1: a fire's body clusters (best-candidate scatter), rim ring, and char, before the LOD filters and the cap. */
export function layoutFire(spec: HazardSpec, parts: Parts, r: number, seed: number): FireLayout {
  const L = spec.fire.layout;
  const J = (i: number) => jit(seed, i);
  const C = L.cluster;
  const size = r < spec.fire.size.m ? 'm' : 'l';
  const P = parts[`cluster-${size}-a`];
  const nc = clamp(Math.round((r * r) / C.area), C.min, r >= C.big ? C.maxBig : C.max);
  const clusters = scatter(spec, r, seed, { ...C, n: nc, mode: 'rise', box: P.box, tip: P.anchor[1] })
    .map((p) => item(`cluster-${size}-${J(p.ix + 2) < 0.5 ? 'a' : 'b'}`, p.x, p.y, J(p.ix + 3) < 0.5, J(p.ix + 4), 'flame', L.prio.cluster, p.gen));
  if (!clusters.length) clusters.push(item(`cluster-${size}-a`, 0, C.fallbackY * r, false, 0, 'flame', L.prio.cluster, 0));
  const G = L.rim;
  const ns = Math.round((TAU * (r - G.countInset)) / (r >= G.big ? G.pitch[1] : G.pitch[0]));
  const ring: FireItem[] = [];
  for (let i = 0; i < ns; i += 1) {
    if (J(i + G.jit.skip) < G.skip) continue;
    const a = (TAU * (i + 0.5 + (J(i + G.jit.angle) - 0.5) * G.angleJitter)) / ns, u = J(i + G.jit.dist);
    const part = G.parts[J(i + G.jit.variant) < 0.5 ? 0 : 1];
    const Q = parts[part];
    // rimPlace (API §8.0-3, S2): step inward from the rim until the far-rim rule holds, down to r − farIn.
    const ca = Math.cos(a), sa = Math.sin(a), d0 = rimDist(r, a, Q.box, u, G.inset);
    let d: number | null = null;
    for (let k = 0; d0 - k >= r - G.farIn - 1e-9; k += 1) {
      if (farOK(r, ca * (d0 - k), sa * (d0 - k), Q.anchor[1], G.far)) {
        d = d0 - k;
        break;
      }
    }
    if (d !== null) ring.push({ ...item(part, Math.cos(a) * d, Math.sin(a) * d, J(i + G.jit.flip) < 0.5, J(i + G.jit.phase), 'flame', L.prio.rim, 100 + i), ring: i });
  }
  const H = L.char;
  const nch = clamp(Math.round((r * r) / H.per), H.min, r >= H.big ? H.maxBig : H.max);
  const chars: FireItem[] = [];
  for (let k = 0; k < H.tries && chars.length < nch; k += 1) {
    const a = TAU * J(k + H.jit.angle), d = Math.max(0, r - H.inset) * Math.sqrt(J(k + H.jit.dist)), x = Math.cos(a) * d, y = Math.sin(a) * d;
    if (chars.some((q) => Math.hypot(q.x - x, q.y - y) < r * H.gap)) continue;
    chars.push(item(`char-${'abcd'[Math.min(3, Math.floor(J(k + H.jit.variant) * 4))]}`, x, y, J(k + H.jit.flip) < 0.5, 0, 'ground', L.prio.char, 200 + k));
  }
  return { r, nc, nch, clusters, ring, chars, lods: [], counts: [] };
}

/** Each item's rank within its class in placement order; returns the class sizes (for the screen cap). */
function rank(items: readonly FireItem[]) {
  const counts = [0, 0, 0];
  for (const q of items.slice().sort((p, q) => p.gen - q.gen)) q.rank = counts[q.prio]++;
  return counts as unknown as N3;
}

/**
 * A fire's items at LOD li (0 full, 1 reduced, 2 minimal) as the kit's layout() gives them: the cached lists filtered for
 * the level (minimal: the first bodies, no ring, two chars; reduced: the even ring, half the chars), then capped, ground
 * before flame, each by y. Filtering the full lists, not the full output, matters at r 150 (delivery §6-2). Each item
 * gets its rank within its class in placement order, and `counts` its class sizes, for the screen cap.
 */
export function fireItems(spec: HazardSpec, layout: FireLayout, li: number) {
  const cached = layout.lods[li];
  if (cached) return cached;
  const L = spec.fire.layout;
  const bodies = li === 2 ? layout.clusters.slice(0, Math.min(layout.nc, L.cluster.minimal)) : layout.clusters;
  const ring = li === 2 ? [] : li === 1 ? layout.ring.filter((q) => q.ring! % 2 === 0) : layout.ring;
  const chars = li === 0 ? layout.chars : layout.chars.slice(0, li === 1 ? Math.ceil(layout.nch / 2) : L.char.minimal);
  // Copies: an item's rank is its level's own (the reduced ring skips the odd clusters).
  const out = sortItems(capCut(bodies.concat(ring, chars), L.caps[li], L.cut.even, L.cut.keep).map((q) => ({ ...q })));
  layout.counts[li] = rank(out);
  layout.lods[li] = out;
  return out;
}

/** The point and segment at length fraction u of a polyline (kit `along`). */
function along(pts: readonly P2[], u: number) {
  const L: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i += 1) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    L.push(l);
    total += l;
  }
  let want = clamp(u, 0, 1) * total;
  for (let i = 0; i < L.length; i += 1) {
    if (want <= L[i] || i === L.length - 1) {
      const k = L[i] ? Math.min(1, want / L[i]) : 0;
      return { p: [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)] as P2, i, total };
    }
    want -= L[i];
  }
  return { p: pts[0], i: 0, total };
}
const polyLen = (pts: readonly P2[]) => pts.reduce((sum, p, i) => (i ? sum + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
/** The first `len` units of a polyline. */
function cutPolyline(pts: readonly P2[], len: number) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length && len > 0; i += 1) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    out.push(l <= len ? pts[i] : [lerp(pts[i - 1][0], pts[i][0], len / l), lerp(pts[i - 1][1], pts[i][1], len / l)]);
    len -= l;
  }
  return out;
}
/** Where a polyline first reaches radius R (or its end). */
function atRadius(pts: readonly P2[], R: number): P2 {
  for (let i = 1; i < pts.length; i += 1) {
    const a = Math.hypot(pts[i - 1][0], pts[i - 1][1]), b = Math.hypot(pts[i][0], pts[i][1]);
    if (b >= R) {
      const k = b > a ? clamp((R - a) / (b - a), 0, 1) : 1;
      return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
    }
  }
  return pts[pts.length - 1];
}

/** API §8.6: the shock's crack arms and branches, full length (the renderer cuts them by the growth). */
export function shockCracks(spec: HazardSpec, r: number, seed: number) {
  const C = spec.shock.cracks, J = (i: number) => jit(seed, i), R = C.reach * r;
  const arms: P2[][] = [], branches: P2[][] = [];
  // A segment end past R is cut on that circle, and the line stops there.
  const walk = (p: P2, n: number, next: (k: number, p: P2) => P2) => {
    const pts = [p];
    for (let k = 0; k < n; k += 1) {
      const q = next(k, p);
      if (Math.hypot(q[0], q[1]) >= R) {
        const dx = q[0] - p[0], dy = q[1] - p[1], A = dx * dx + dy * dy, B = 2 * (p[0] * dx + p[1] * dy), Cc = p[0] * p[0] + p[1] * p[1] - R * R;
        const t = clamp((-B + Math.sqrt(Math.max(0, B * B - 4 * A * Cc))) / (2 * A || 1), 0, 1);
        pts.push([p[0] + dx * t, p[1] + dy * t]);
        break;
      }
      pts.push(q);
      p = q;
    }
    return pts;
  };
  for (let i = 0; i < C.arms; i += 1) {
    const a0 = TAU * (i + (J(C.jit.arm + i) - 0.5) * 0.6) / C.arms, nx = -Math.sin(a0), ny = Math.cos(a0);
    arms.push(walk([Math.cos(a0) * C.start, Math.sin(a0) * C.start], 60, (k, p) => {
      const ix = C.jit.seg + i * C.jit.segStride + 3 * k;
      const len = C.seg * (1 - C.segJitter + 2 * C.segJitter * J(ix)), dir = a0 + (J(ix + 1) - 0.5) * 2 * C.turn;
      const push = (k % 2 ? 1 : -1) * (C.push[0] + (C.push[1] - C.push[0]) * J(ix + 2));
      return [p[0] + Math.cos(dir) * len + nx * push, p[1] + Math.sin(dir) * len + ny * push];
    }));
  }
  arms.forEach((pts, i) => {
    const at = along(pts, C.branchAt), a = pts[at.i], b = pts[at.i + 1], side = J(C.jit.side + i) < 0.5 ? -1 : 1;
    const dir = Math.atan2(b[1] - a[1], b[0] - a[0]) + side * C.branchTurn, L = C.branchLen * at.total / C.branchSegs, nx = -Math.sin(dir), ny = Math.cos(dir);
    branches.push(walk(at.p, C.branchSegs, (k, p) => {
      const ix = C.jit.branch + 10 * i + 2 * k, d2 = dir + (J(ix) - 0.5) * 0.6, push = (k % 2 ? 1 : -1) * (1.5 + J(ix + 1));
      return [p[0] + Math.cos(d2) * L + nx * push, p[1] + Math.sin(d2) * L + ny * push];
    }));
  });
  return { arms, branches };
}

/** API §8.6: a null zone's ghost lines (chords of r − inset, clear of the centre, N1) and its erase edge (one closed line). */
export function nullPaths(spec: HazardSpec, r: number, seed: number) {
  const G = spec.null.ghost, E = spec.null.erase.jag, R0 = r - G.inset, kr = kron(spec, seed, G.jit.base);
  const ghost = Array.from({ length: r < G.split ? G.lines[0] : G.lines[1] }, (_, i): P2[] => {
    const v = kr(1, i), c = (v < 0.5 ? -1 : 1) * (G.minOffset + 1.1 * Math.abs(v - 0.5)) * r;
    const th = Math.PI * kr(0, i), h = Math.sqrt(Math.max(0, R0 * R0 - c * c)), dx = Math.cos(th), dy = Math.sin(th);
    return [[c * -dy - h * dx, c * dx - h * dy], [c * -dy + h * dx, c * dx + h * dy]];
  });
  const jag = Array.from({ length: E.points }, (_, k): P2 => {
    const a = TAU * k / E.points, f0 = 1 - (E.depth / r) * jit(seed, E.jit + k);
    return [Math.cos(a) * r * f0, Math.sin(a) * r * f0];
  });
  return { ghost, jag: [jag] };
}

/** A closed Catmull-Rom spline through pts, k samples per span (the erase edge). */
function smoothClosed(pts: readonly P2[], k: number) {
  const n = pts.length, out: P2[] = [];
  for (let i = 0; i < n; i += 1) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]];
    for (let j = 0; j < k; j += 1) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) => 0.5 * ((2 * b) + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

/**
 * API §8.7-§8.12: the items of a kind other than fire at each LOD [full, reduced, minimal], capped per hazard and sorted
 * as the kit's layout() gives them. `ch` is the chapter (slow draws the dial in 4; traps draw their chapter's machine).
 */
export function layoutZone(spec: HazardSpec, groups: Groups, kind: string, r: number, seed: number, ch: number): FireItem[][] {
  const J = (i: number) => jit(seed, i);
  const box = (group: string, part: string) => groups[group][part].box;
  const lods = (caps: N3, even: number, keep: number, make: (li: number) => FireItem[]) => [0, 1, 2].map((li) => sortItems(capCut(make(li), caps[li], even, keep)));
  // A flat scatter of one part's variants (pool 'kr': w = variant, flip, phase).
  const pick = (o: Scatter, n: number, name: string, prio: number, gen: number, fixed?: readonly FireItem[], flip = true, phase = true) =>
    scatter(spec, r, seed, { ...o, n, mode: 'ground', box: box(kind, `${name}-a`), fixed }).map((p, i) => item(`${name}-${ab(p.w[0])}`, p.x, p.y, flip && p.w[1] < 0.5, phase ? p.w[2] : 0, 'ground', prio, gen + i));
  if (kind === 'shock') {
    const L = spec.shock.layout, B = L.pebble, arms = shockCracks(spec, r, seed).arms;
    const pebbles = Array.from({ length: B.count }, (_, j) => {
      const p = along(arms[B.arms[j % B.arms.length]], B.from + B.span * J(B.jit.at + j)).p;
      return item(`pebble-${ab(J(B.jit.variant + j))}`, p[0], p[1], J(B.jit.flip + j) < 0.5, J(B.jit.phase + j), 'ground', 1, j);
    });
    return lods(L.caps, -1, 0, (li) => (li ? [] : pebbles));
  }
  if (kind === 'slow') {
    const L = spec.slow.layout, M = L.mire, B = L.bubble;
    if (ch === 4) return [[], [], []];
    // mirePlan: the radius's tier [from, big, small, area]; the big count aims the puddles at `target` of the disc.
    const T = M.tiers.filter((q) => r >= q[0]).pop() ?? M.tiers[0];
    const n = clamp(Math.round(r * r / T[3]), M.min, M.max);
    const nBig = clamp(Math.round((M.target * Math.PI * r * r - n * M.fill[T[2]]) / (M.fill[T[1]] - M.fill[T[2]])), 0, n);
    const hw = (k: number) => (box(kind, `mire-${T[k]}-a`)[0] - 6) / 2;
    // Puddles keep 0 phases; the small pass keeps clear of the big puddles.
    const pass = (k: number, fixed: readonly FireItem[]) => pick({ ...M, gap: { frac: 99, cap: M.sep * (hw(1) + hw(k)) }, jit: { base: k > 1 ? M.jit.small! : M.jit.base, stride: M.jit.stride } }, k > 1 ? n - nBig : nBig, `mire-${T[k]}`, 0, k * 100 - 100, fixed, true, false);
    const big = pass(1, []), mire = big.concat(pass(2, big));
    const kr = kron(spec, seed, B.jit);
    const bubbles = mire.length ? Array.from({ length: count(B, r) }, (_, b) => {
      const q = mire[b % mire.length], [w, h] = box(kind, q.part);
      return item(`bubble-${ab(b % 2)}`, q.x + (kr(0, b) - 0.5) * 0.8 * ((w - 6) / 2), q.y + (kr(1, b) - 0.5) * 0.6 * ((h - 6) / 2) + 1, false, kr(2, b), 'flame', 2, 300 + b);
    }) : [];
    return lods(L.caps, 2, 1, (li) => (li ? mire.slice(0, li === 1 ? Math.ceil(mire.length / 2) : M.minimal) : mire.concat(bubbles)));
  }
  if (kind === 'water') {
    const L = spec.water.layout, PR = L.prio, G = L.glint;
    const nw = clamp(Math.round(r * r / L.wave.area), L.wave.min, L.wave.max), nr = count(L.ripple, r);
    const wave = pick(L.wave, nw, 'wave', PR.wave, 0);
    const ripple = pick(L.ripple, nr, 'ripple', PR.ripple, 100, wave);
    const flow = pick(L.flow, count(L.flow, r), 'flow', PR.flow, 200, wave.concat(ripple), false);
    const ga = G.angle + (J(G.jit) - 0.5) * 2 * G.spread, glint = item('glint', Math.cos(ga) * G.at * r, Math.sin(ga) * G.at * r, false, J(G.jit + 1), 'ground', PR.glint, 300);
    return lods(L.caps, L.cut.even, L.cut.keep, (li) => (li === 0 ? wave.concat(ripple, flow, [glint]) : li === 1 ? wave.slice(0, Math.ceil(nw / 2)).concat(ripple.slice(0, Math.ceil(nr / 2))) : wave.slice(0, L.wave.minimal).concat(ripple.slice(0, 1))));
  }
  if (kind === 'root') {
    const L = spec.root.layout, V = L.vine, P = groups.root['vine-a'];
    const vines = scatter(spec, r, seed, { ...V, n: count(V, r), mode: 'rise', box: P.box, tip: P.anchor[1] })
      .map((p) => item(`vine-${'abc'[Math.min(2, Math.floor(3 * p.w[0]))]}`, p.x, p.y, p.x > 0, p.w[2], 'flame', 0, p.gen));
    return lods(L.caps, -1, 1, () => vines);
  }
  if (kind === 'trap') {
    const machine = [item(`armed-ch${ch >= 1 && ch <= 4 ? ch : spec.trap.windows.fallback[5] ?? 1}`, 0, 0, false, 0, 'ground', 0, 0)];
    return [machine, machine, machine];
  }
  if (kind === 'null') {
    const C = spec.null.layout.crumb, kr = kron(spec, seed, C.jit.base), n = count(C, r);
    const crumbs = Array.from({ length: n }, (_, i) => {
      const a = TAU * (i + kr(0, i)) / n, d = groundDist(r, a, box(kind, 'crumb-a'), kr(1, i), C.inset);
      return item(`crumb-${'abc'[Math.min(2, Math.floor(3 * kr(2, i)))]}`, Math.cos(a) * d, Math.sin(a) * d, kr(3, i) < 0.5, 0, 'ground', 0, i);
    });
    return lods(spec.null.layout.caps, -1, 0, (li) => (li ? [] : crumbs));
  }
  return [[], [], []];
}

/**
 * The screen cap on stamps (SPEC caps, review 2 §8-4), by class: every hazard keeps one prio-0 item, then the other
 * prio-0 items, then prio 1, nearest hazard first; prio 2 (the fire's rim rings, the zones' deco) shares what is left in
 * proportion and is thinned evenly in each hazard. `counts` are per hazard, nearest first; returns the kept counts.
 */
export function screenCut(counts: readonly N3[], cap: number) {
  const keep = counts.map((c) => [Math.min(1, c[0]), 0, 0]);
  let left = cap - keep.reduce((sum, k) => sum + k[0], 0);
  for (let cls = 0; cls < 2; cls += 1) {
    keep.forEach((k, f) => {
      const n = clamp(counts[f][cls] - k[cls], 0, Math.max(0, left));
      k[cls] += n;
      left -= n;
    });
  }
  const total = counts.reduce((sum, c) => sum + c[2], 0);
  left = Math.max(0, left);
  keep.forEach((k, f) => (k[2] = total <= left ? counts[f][2] : Math.floor((left * counts[f][2]) / total)));
  let rest = total <= left ? 0 : left - keep.reduce((sum, k) => sum + k[2], 0);
  keep.forEach((k, f) => {
    if (rest > 0 && k[2] < counts[f][2]) {
      k[2] += 1;
      rest -= 1;
    }
  });
  return keep;
}

/** API §8.3: the ember slots of a fire's body clusters at time t; a slot whose cycle began after `gutterStart` is not drawn. */
export function emberSlots(spec: HazardSpec, clusters: readonly FireItem[], r: number, seed: number, t: number, li: number, gutterStart: number | null) {
  const E = spec.fire.embers;
  const J = (i: number) => jit(seed, i);
  const out: Slot[] = [];
  let n = clamp(Math.round(r / E.per), E.min, E.max);
  if (li === 1) n = Math.ceil(n / 2);
  if (li === 2 || !clusters.length) return out;
  for (let j = 0; j < n; j += 1) {
    const c = clusters[j % clusters.length];
    const sx = c.x + lerp(E.origin.dx[0], E.origin.dx[1], J(j + E.jit.dx)), sy = c.y + lerp(E.origin.dy[1], E.origin.dy[0], J(j + E.jit.dy));
    const T = E.cycle * (1 + E.jitter * (J(j + E.jit.period) - 0.5)), u = frac(t / T + J(j + E.jit.phase));
    if (gutterStart !== null && t - u * T > gutterStart) continue;
    const sg = J(j + E.jit.sign) < 0.5 ? -1 : 1;
    out.push(slot(j % 2 ? 'ember-b' : 'ember-a', sx + sg * E.drift * u, sy - E.rise * u, u));
  }
  return out;
}

/** API §8.4: smoke over the first body clusters, `tau` seconds after the gutter began (gutter, then the start of soot). */
export function smokeSlots(spec: HazardSpec, clusters: readonly FireItem[], seed: number, tau: number, li: number) {
  const S = spec.fire.smoke;
  const J = (i: number) => jit(seed, i);
  const out: Slot[] = [];
  if (li === 2 || tau > spec.fire.windows.gutter + S.until) return out;
  for (let k = 0; k < Math.min(clusters.length, S.max); k += 1) {
    if (li === 1 && k % 2) continue;
    const c = clusters[k], t0 = S.start + S.stagger * J(k + S.jit.start), T = S.cycle * (1 + S.jitter * (J(k + S.jit.period) - 0.5)), u = (tau - t0) / T;
    if (u < 0 || u >= 1) continue;
    const sg = J(k + S.jit.sign) < 0.5 ? -1 : 1;
    out.push(slot(k % 2 ? 'smoke-b' : 'smoke-a', c.x + sg * S.drift * u, c.y + S.origin.dy - S.rise * u, u));
  }
  return out;
}

/** API §8.5: the embers rising off the hero's body at time t, facing right (mirror x to face left). */
export function heroEmberSlots(spec: HazardSpec, t: number): Slot[] {
  const E = spec.hero.embers;
  return E.origins.map((o, j) => {
    const T = E.cycle * (1 + E.jitter * (jit(E.seed, j + E.jit.period) - 0.5)), u = frac(t / T + jit(E.seed, j + E.jit.phase));
    const side = E.outward ? (o[0] < 0 ? -1 : 1) : 0;
    return slot(j % 2 ? 'ember-b' : 'ember-a', o[0] + side * E.drift * u, o[1] - E.rise * u, u);
  });
}

/** API §8.7: the shards, then the dust, of a shock `age` seconds after it went off; none at minimal detail, every other one at reduced. */
export function shockSlots(spec: HazardSpec, arms: readonly (readonly P2[])[], r: number, seed: number, age: number, li: number) {
  const B = spec.shock.burst, H = B.shards, D = B.dust, out: Slot[] = [];
  for (let j = 0; li < 2 && age < H.seconds && j < H.count; j += li + 1) {
    const u = age / H.seconds, base = atRadius(arms[j % arms.length], (H.from + (H.to - H.from) * jit(seed, H.jit + j)) * r), d = Math.hypot(base[0], base[1]) || 1;
    out.push({ part: `shard-${'abc'[j % 3]}`, x: base[0] + base[0] / d * H.out * u, y: base[1] + base[1] / d * H.out * u - 4 * H.hop * u * (1 - u), frame: Math.min(3, Math.floor(u * 4)) });
  }
  for (let j = 0; li < 2 && age < D.seconds && j < D.count; j += li + 1) {
    const a = TAU * (j + 0.5 + (jit(seed, D.jit + j) - 0.5) * 0.5) / D.count;
    out.push({ part: `dust-${j % 2 ? 'b' : 'a'}`, x: Math.cos(a) * (r + D.at), y: Math.sin(a) * (r + D.at), frame: Math.min(3, Math.floor((age / D.seconds) * 4)) });
  }
  return out;
}

/** API §4.1: a fire's state and the progress through it; map fires (no end) always burn. `age` is the gutter's own age. */
export function fireState(spec: HazardSpec, hazard: Readonly<Pick<Hazard, 'life' | 'maxLife'>>) {
  const W = spec.fire.windows;
  const age = hazard.maxLife - hazard.life;
  if (Number.isFinite(hazard.maxLife) && age < W.ignite) return { state: 'ignite', p: age / W.ignite, age };
  if (Number.isFinite(hazard.maxLife) && hazard.life < W.gutter) return { state: 'gutter', p: 1 - hazard.life / W.gutter, age: W.gutter - hazard.life };
  return { state: 'burn', p: 0, age: 0 };
}

/**
 * API §4.3-§4.7: where a timed hazard stands: its first `begin` seconds (emerge, erase), its last `end` seconds (wither,
 * restore, the slow's fade), or between, with the progress through the window. Hazards with no end stand between.
 */
export function windowOf(hazard: Readonly<Pick<Hazard, 'life' | 'maxLife'>>, begin: number, end: number): readonly [-1 | 0 | 1, number] {
  if (!Number.isFinite(hazard.maxLife)) return [0, 0];
  const age = hazard.maxLife - hazard.life;
  return age < begin ? [-1, age / begin] : hazard.life < end ? [1, 1 - hazard.life / end] : [0, 0];
}

/**
 * API §4.6: a trap's state: armed until sprung, then the spring for its first moment and shut, fading over its last
 * moment (`k` is what is left of it). A sprung trap's life and length are both cut to the same few seconds when it shuts.
 */
export function trapState(spec: HazardSpec, hazard: Readonly<Pick<Hazard, 'life' | 'maxLife' | 'triggered'>>) {
  const W = spec.trap.windows;
  const age = hazard.maxLife - hazard.life;
  if (!hazard.triggered) return { state: 'armed', p: 0, k: 1 };
  if (age < W.spring) return { state: 'spring', p: age / W.spring, k: 1 };
  const p = hazard.life < W.fadeLast ? 1 - hazard.life / W.fadeLast : 0;
  return { state: 'shut', p, k: 1 - p };
}

/** The shape of the field the renderer draws for these kinds: zone grounds (slow, root) and the shock's current telegraph. */
export type TerrainHost = Readonly<{
  ground(ctx: CanvasRenderingContext2D, hazard: Readonly<Hazard>, alpha: number): void;
  telegraph(ctx: CanvasRenderingContext2D, hazard: Readonly<Hazard>): void;
}>;

/** A fire seen last frame, and a gone one leaving soot (API §4.1 soot): where it stood and when it went out. */
type Seen = { x: number; y: number; r: number; life: number; tick: number };
type Soot = { id: number; x: number; y: number; r: number; at: number };
/** A hazard drawn this frame: its items, and what the screen cap keeps of them (null: everything). */
type Entry = { h: Readonly<Hazard>; items: readonly FireItem[]; counts: N3; keep: number[] | null; drop: Set<number> | null };
type Fire = Entry & { layout: FireLayout; state: string; p: number; age: number; bodies: FireItem[] };
type Shape = { r: number; arms: P2[][]; branches: P2[][]; ghost: P2[][]; jag: P2[] };
/** A fire whose last seen life was this short went out (not cleared or carried away); it leaves soot. */
const SOOT_LIFE = 0.25;
/** The shock crater's fixed wobble (kit drawShock: ellPts of 16 points, seed 9, ±12 %), from the kit's mulberry32. */
const CRATER = (() => {
  let a = 9;
  return Array.from({ length: 16 }, () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return 1 + (((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5) * 2 * 0.12;
  });
})();

/** The screen cap over hazards nearest first (screenCut); returns how many stamps it keeps. */
function share(entries: Entry[], cap: number) {
  const total = entries.reduce((sum, e) => sum + e.items.length, 0);
  if (total <= cap) return total;
  const keep = screenCut(entries.map((e) => e.counts), cap);
  entries.forEach((e, index) => {
    e.keep = keep[index];
    const n = e.counts[2];
    const nd = n - e.keep[2];
    if (nd > 0) e.drop = new Set(Array.from({ length: nd }, (_, j) => Math.floor(((j + 0.5) * n) / nd)));
  });
  return keep.reduce((sum, k) => sum + k[0] + k[1] + k[2], 0);
}
const kept = (e: Entry, q: FireItem) => !e.keep || (q.prio === 2 ? !e.drop?.has(q.rank!) : q.rank! < e.keep[q.prio]);

export class HazardPainter {
  spec: HazardSpec | null = null;
  private data: HazardManifest | undefined;
  private atlas: SpriteAtlas | null = null;
  private time = 0;
  private reduced = false;
  private flash = 1;
  /** Level of detail: 0 full, 1 reduced, 2 minimal. */
  lod = 0;
  private tick = 0;
  private readonly layouts = new Map<number, FireLayout>();
  private readonly zoneLayouts = new Map<number, { r: number; ch: number; lods: FireItem[][]; counts: N3[] }>();
  private readonly shapes = new Map<number, Shape>();
  private readonly seen = new Map<number, Seen>();
  private readonly soots: Soot[] = [];
  private readonly fires: Fire[] = [];
  private readonly zones: Entry[] = [];
  private readonly flames: { f: Fire; q: FireItem; y: number }[] = [];

  /** Picks up the frame's settings; false while the hazard art or its data is missing (callers keep their fallback). */
  begin(atlas: SpriteAtlas | null, time: number, reduced: boolean, flashStrength: number, detail: VisualDetail) {
    this.atlas = atlas;
    this.data = atlas?.status(HAZARDS_PACK) === 'ready' && slotEnabled('hazard') ? atlas.hazards() : undefined;
    this.spec = (this.data?.spec as HazardSpec | undefined) ?? null;
    if (time < this.time) {
      // A new run: its hazards and ids are new.
      this.seen.clear();
      this.soots.length = 0;
      this.layouts.clear();
      this.zoneLayouts.clear();
      this.shapes.clear();
    }
    this.time = time;
    this.reduced = reduced;
    this.flash = flashStrength;
    this.lod = Math.max(0, LODS.indexOf(detail));
    return this.spec !== null;
  }

  /** Whether a hazard kind draws from the kit this frame. */
  drawn(kind: string) {
    return this.spec !== null && HAZARD_ART_KINDS.has(kind);
  }

  private part(group: string, part: string) {
    return this.data?.parts[group]?.[part];
  }

  /** A loop's frame (API §8.2): half rate at reduced detail, held on its phase frame at minimal detail, under reduced motion, or when held. */
  private loop(P: HazardPart, phase: number, hold = false) {
    const F = P.frames;
    if (hold || this.reduced || this.lod === 2) return Math.min(F - 1, Math.floor(phase * F));
    return ((Math.floor(this.time * (this.lod === 1 ? P.fps / 2 : P.fps) + phase * F) % F) + F) % F;
  }

  /** A prog part's frame `p` of the way through it. */
  private prog(P: HazardPart, p: number) {
    return Math.min(P.frames - 1, Math.floor(clamp(p, 0, 1) * P.frames));
  }

  /** A cycle part's frame (API §8.2): its period from its own phase; its still frame under reduced motion. */
  private cycle(P: HazardPart, phase: number, spread: N2) {
    if (this.reduced) return P.still!;
    return Math.min(P.frames - 1, Math.floor(P.frames * frac(this.time / (P.seconds! * (spread[0] + spread[1] * frac(7.919 * phase))) + phase)));
  }

  /** Draws a stamp with its anchor on (x, y), mirrored about the anchor when flipped. */
  stamp(ctx: CanvasRenderingContext2D, group: string, part: string, frame: number, x: number, y: number, flip = false, alpha = 1) {
    const f = this.atlas?.frame(`hazard/${group}/${part}/${frame}`);
    if (!f || alpha <= 0) return;
    const u = 1 / f.scale;
    const base = ctx.globalAlpha;
    ctx.globalAlpha = base * Math.min(1, alpha);
    if (flip) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.drawImage(f.image, f.sx, f.sy, f.sw, f.sh, -f.ax * u, -f.ay * u, f.sw * u, f.sh * u);
      ctx.restore();
    } else {
      ctx.drawImage(f.image, f.sx, f.sy, f.sw, f.sh, x - f.ax * u, y - f.ay * u, f.sw * u, f.sh * u);
    }
    ctx.globalAlpha = base;
  }

  private disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, token: string, alpha: number) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = TOKENS[token];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  /** SPEC stroke rows as circles round (x, y), bottom up; a dashed row has round ends (dots). */
  private rows(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rows: readonly Row[], alpha = 1) {
    for (const [token, width, offset = 0, a = 1, dash] of rows) {
      ctx.globalAlpha = a * alpha;
      ctx.strokeStyle = TOKENS[token];
      ctx.lineWidth = width;
      ctx.setLineDash(dash ?? []);
      ctx.lineCap = dash ? 'round' : 'butt';
      ctx.beginPath();
      ctx.arc(x, y, r + offset, 0, TAU);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineCap = 'butt';
  }

  /** Straight strokes [x0, y0, x1, y1], one path per row. */
  private lines(ctx: CanvasRenderingContext2D, rows: readonly Row[], alpha: number, segments: readonly (readonly number[])[]) {
    for (const [token, width, , a = 1] of rows) {
      ctx.globalAlpha = a * alpha;
      ctx.strokeStyle = TOKENS[token];
      ctx.lineWidth = width;
      ctx.beginPath();
      for (const [x0, y0, x1, y1] of segments) {
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
      }
      ctx.stroke();
    }
  }

  private layout(id: number, r: number) {
    let layout = this.layouts.get(id);
    if (!layout || layout.r !== r) {
      if (this.layouts.size > 256) this.layouts.clear();
      layout = layoutFire(this.spec!, this.data!.parts.fire, r, id);
      this.layouts.set(id, layout);
    }
    return layout;
  }

  /** A zone's items at every LOD, ranked, kept per hazard id (they depend on its radius and the chapter only). */
  private zoneLayout(h: Readonly<Hazard>, ch: number) {
    let layout = this.zoneLayouts.get(h.id);
    if (!layout || layout.r !== h.radius || layout.ch !== ch) {
      if (this.zoneLayouts.size > 256) this.zoneLayouts.clear();
      const lods = layoutZone(this.spec!, this.data!.parts, h.kind, h.radius, h.id, ch).map((items) => items.map((q) => ({ ...q })));
      layout = { r: h.radius, ch, lods, counts: lods.map(rank) };
      this.zoneLayouts.set(h.id, layout);
    }
    return layout;
  }

  /** A shock's cracks or a null zone's lines (API §8.6), by hazard id; a shock's burst finds its own by the same id. */
  private shape(id: number, r: number, kind: string) {
    let shape = this.shapes.get(id);
    if (!shape || shape.r !== r) {
      if (this.shapes.size > 64) this.shapes.clear();
      const paths = kind === 'null' ? nullPaths(this.spec!, r, id) : null;
      shape = { r, ...(paths ? { arms: [], branches: [] } : shockCracks(this.spec!, r, id)), ghost: paths?.ghost ?? [], jag: paths ? smoothClosed(paths.jag[0], 4) : [] };
      this.shapes.set(id, shape);
    }
    return shape;
  }

  /** Remembers the fires on the field; one that went out leaves its soot for SPEC fire.soot seconds (API §4.1). */
  track(hazards: readonly Readonly<Hazard>[]) {
    const tick = (this.tick += 1);
    for (const h of hazards) {
      if (h.kind !== 'fire') continue;
      const seen = this.seen.get(h.id);
      if (seen) {
        seen.life = h.life;
        seen.tick = tick;
      } else this.seen.set(h.id, { x: h.x, y: h.y, r: h.radius, life: h.life, tick });
    }
    for (const [id, seen] of this.seen) {
      if (seen.tick === tick) continue;
      if (seen.life <= SOOT_LIFE) this.soots.push({ id, x: seen.x, y: seen.y, r: seen.r, at: this.time });
      this.seen.delete(id);
    }
    const S = this.spec!.fire.soot;
    while (this.soots.length && (this.time - this.soots[0].at > S.seconds || this.soots.length > S.caps[0])) this.soots.shift();
  }

  /**
   * The decal layer: the soot of fires that went out (a fading ink disc and cold char, the newest first up to the cap),
   * and the marks shocks leave after their burst (a faint crater and pale cracks, API §4.2), none at minimal detail.
   */
  drawDecals(ctx: CanvasRenderingContext2D, view: Viewport, shocks: readonly Readonly<ShockBurst>[]) {
    const S = this.spec!.fire.soot;
    let left = S.caps[this.lod];
    ctx.save();
    for (let i = this.soots.length - 1; i >= 0 && left > 0; i -= 1) {
      const soot = this.soots[i];
      const age = this.time - soot.at;
      const k = 1 - age / S.seconds;
      if (!circleVisible(view, soot.x, soot.y, soot.r + 40)) continue;
      left -= 1;
      const items = fireItems(this.spec!, this.layout(soot.id, soot.r), this.lod);
      this.disc(ctx, soot.x, soot.y, soot.r, S.base.token, S.base.alpha * k);
      ctx.globalAlpha = 1;
      for (const q of items) if (q.z === 'ground') this.stamp(ctx, 'fire', q.part.replace('char-', 'char-cold-'), 0, soot.x + q.x, soot.y + q.y, q.flip, k);
      if (!this.reduced) {
        const bodies = items.filter((q) => q.prio === 0);
        for (const s of smokeSlots(this.spec!, bodies, soot.id, this.spec!.fire.windows.gutter + age, this.lod)) this.stamp(ctx, 'fire', s.part, s.frame, soot.x + s.x, soot.y + s.y);
      }
    }
    if (this.lod < 2) this.drawShocks(ctx, view, shocks, true);
    ctx.restore();
  }

  /**
   * A shock's burst (the first SPEC burst seconds after it went off, under bodies) or its decal (the decal seconds after):
   * the coral fill, a halftone edge, the paper flash, the lit cracks, and the core; then the pale cracks over a faint
   * crater. Shards and dust fly for their own seconds over both (API §4.2, §8.7).
   */
  drawShocks(ctx: CanvasRenderingContext2D, view: Viewport, shocks: readonly Readonly<ShockBurst>[], decal = false) {
    const S = this.spec!.shock, B = S.burst;
    ctx.save();
    for (const b of shocks) {
      const age = b.maxLife - b.life, { x, y, radius: r, id } = b;
      if (age < B.seconds === decal || age >= B.seconds + S.decal.seconds || !circleVisible(view, x, y, r + 20)) continue;
      const shape = this.shape(id, r, 'shock');
      if (decal) {
        const p = (age - B.seconds) / S.decal.seconds, C = S.decal.crater;
        ctx.globalAlpha = C.alpha * (1 - p);
        ctx.fillStyle = TOKENS[C.token];
        ctx.beginPath();
        CRATER.forEach((k, i) => ctx.lineTo(x + Math.cos((TAU * i) / 16) * C.r * r * k, y + Math.sin((TAU * i) / 16) * C.r * r * 0.5 * k));
        ctx.fill();
        this.cracks(ctx, x, y, shape, 1, S.coreLayers.decal, lerp(S.decal.alpha[0], S.decal.alpha[1], p), false);
      } else {
        const fa = age < B.fill.seconds ? B.fill.alpha : B.fill.alpha * Math.max(0, 1 - (age - B.fill.seconds) / (B.seconds - B.fill.seconds));
        this.disc(ctx, x, y, r, B.fill.token, fa * this.flash);
        ctx.globalAlpha = fa / B.fill.alpha;
        ctx.fillStyle = TOKENS[B.edge.token];
        ctx.beginPath();
        B.edge.rows.forEach(([offset, dot], row) => {
          const n = Math.max(B.edge.dots, Math.round((TAU * (r + offset)) / B.edge.pitch));
          for (let j = 0; j < n; j += 1) {
            const a = (TAU * (j + 0.5 * (row % 2))) / n, cx = x + Math.cos(a) * (r + offset), cy = y + Math.sin(a) * (r + offset);
            ctx.moveTo(cx + dot, cy);
            ctx.arc(cx, cy, dot, 0, TAU);
          }
        });
        ctx.fill();
        if (age < B.flash.seconds) this.rows(ctx, x, y, r, B.flash.layers, this.flash);
        this.cracks(ctx, x, y, shape, 1, S.coreLayers.burst, 1);
        ctx.globalAlpha = 1;
        this.stamp(ctx, 'shock', 'core', this.prog(this.part('shock', 'core')!, age / B.seconds), x, y, false, this.flash);
      }
      ctx.globalAlpha = 1;
      for (const s of shockSlots(this.spec!, shape.arms, r, id, age, this.lod)) this.stamp(ctx, 'shock', s.part, s.frame, x + s.x, y + s.y);
    }
    ctx.restore();
  }

  /**
   * The shock's cracks (SPEC shock.cracks) grown to g: the arms, then the branches once g passes branchAt, each segment
   * thinner toward the tip; an ink line (unless `ink` is false) with the core layers over it as shares of its width.
   */
  private cracks(ctx: CanvasRenderingContext2D, x: number, y: number, shape: Shape, g: number, layers: readonly Layer[], alpha: number, ink = true) {
    const C = this.spec!.shock.cracks;
    const segs: [P2, P2, number][] = [];
    const add = (lines: readonly P2[][], f: number, w0: number, w1: number) => {
      for (const pts of lines) {
        const vis = cutPolyline(pts, polyLen(pts) * f), n = pts.length - 1;
        for (let k = 1; k < vis.length; k += 1) segs.push([vis[k - 1], vis[k], lerp(w0, w1, (k - 1) / Math.max(1, n - 1))]);
      }
    };
    add(shape.arms, g, C.width[0], C.width[1]);
    const gb = clamp((g - C.branchAt) / (1 - C.branchAt), 0, 1);
    if (gb > 0) add(shape.branches, gb, lerp(C.width[0], C.width[1], C.branchAt) * 0.8, 1.2);
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    for (const [token, share] of ink ? [['ink', 1] as const, ...layers] : layers) {
      ctx.strokeStyle = TOKENS[token];
      for (const [a, b, w] of segs) {
        ctx.lineWidth = w * share;
        ctx.beginPath();
        ctx.moveTo(x + a[0], y + a[1]);
        ctx.lineTo(x + b[0], y + b[1]);
        ctx.stroke();
      }
    }
    ctx.lineCap = 'butt';
  }

  /**
   * The visible hazards drawn from the kit (API §9): every kind but fire whole, hazard by hazard; then the fires: their
   * discs, char, and rims, every flame of every fire by world y, then embers and smoke, so fires that overlap (the fire
   * lanes) read as one burning floor. The screen cap (SPEC caps) goes to the fires first (render.fireStamps, by class,
   * nearest first), and the other kinds share what the fires leave the same way.
   */
  drawTerrain(ctx: CanvasRenderingContext2D, hazards: readonly Readonly<Hazard>[], px: number, py: number, chapter: number, rootFaded: boolean, host: TerrainHost) {
    const spec = this.spec!;
    const li = this.lod;
    const fires = this.fires;
    const zones = this.zones;
    fires.length = 0;
    zones.length = 0;
    for (const h of hazards) {
      if (h.kind === 'fire') {
        const layout = this.layout(h.id, h.radius);
        const items = fireItems(spec, layout, li);
        fires.push({ h, items, counts: layout.counts[li]!, keep: null, drop: null, layout, ...fireState(spec, h), bodies: [] });
      } else {
        const layout = this.zoneLayout(h, chapter);
        zones.push({ h, items: layout.lods[li], counts: layout.counts[li], keep: null, drop: null });
      }
    }
    const near = (a: Entry, b: Entry) => Math.hypot(a.h.x - px, a.h.y - py) - Math.hypot(b.h.x - px, b.h.y - py);
    fires.sort(near);
    zones.sort(near);
    const used = share(fires, this.data!.render?.fireStamps?.[li] ?? spec.fire.caps.stamps[li]);
    share(zones, Math.max(0, spec.caps.stamps[li] - used));
    ctx.save();
    for (const z of zones) this.zone(ctx, z, chapter, rootFaded, host);
    if (fires.length) this.drawFires(ctx, fires);
    ctx.restore();
  }

  /** A zone's kept items at the frames `frame` gives (−1: not drawn this frame), at `alpha`; `suffix` picks a state's part. */
  private place(ctx: CanvasRenderingContext2D, z: Entry, frame: (P: HazardPart, q: FireItem) => number, alpha = 1, suffix = '') {
    const { x, y, kind } = z.h;
    ctx.globalAlpha = 1;
    for (const q of z.items) {
      const P = this.part(kind, q.part + suffix);
      const f = P && kept(z, q) ? frame(P, q) : -1;
      if (f >= 0) this.stamp(ctx, kind, q.part + suffix, f, x + q.x, y + q.y, q.flip, alpha);
    }
  }

  /**
   * A kit zone (API §4.2-§4.7, §9):
   * - water: an ink wash, the surface strokes, ripples, flows and the glint by y, the wet rim; ripples hold their still
   *   frame at minimal detail, and flows and the glint go under reduced motion while the strokes stay;
   * - slow: the renderer's fill and hatch, the ink puddles and their bubbles (fading over the last moment), the amber rim;
   *   chapter 4 draws the clock dial instead of puddles;
   * - root: the same ground, the vines emerging, swaying, and withering, the amber rim; all at SPEC root.faded, the vines
   *   held still, while the hero cannot be bound again;
   * - trap: the iron plate, its groove, spokes, and square rivets, the chapter's machine, the ink rim;
   * - null: the erased paper spreading from the centre with a jagged edge, then the void with its dashed ghost lines and
   *   crumbs; over its last moment the lines are redrawn as solid strokes while the void lifts;
   * - shock: the cracks growing from the centre under the renderer's own telegraph rim, pebbles once imminent.
   */
  private zone(ctx: CanvasRenderingContext2D, z: Entry, chapter: number, faded: boolean, host: TerrainHost) {
    const spec = this.spec!;
    const h = z.h;
    const { x, y, radius: r, kind } = h;
    if (kind === 'water') {
      const W = spec.water;
      this.disc(ctx, x, y, r, W.base.token, W.base.alpha);
      this.place(ctx, z, (P, q) => (P.drive === 'cycle' ? (this.lod === 2 ? P.still! : this.cycle(P, q.phase, W.layout.ripple.spread)) : P.lod === 'info' || !this.reduced ? this.loop(P, q.phase) : -1));
      this.rows(ctx, x, y, r, W.rim);
    } else if (kind === 'slow') {
      const S = spec.slow;
      host.ground(ctx, h, 1);
      if (chapter === 4) this.dial(ctx, h);
      const [end, p] = windowOf(h, 0, S.end.seconds);
      this.place(ctx, z, (P, q) => (P.drive === 'cycle' ? this.cycle(P, q.phase, S.layout.bubble.spread) : 0), end ? 1 - p : 1);
      this.rows(ctx, x, y, r, S.rim);
    } else if (kind === 'root') {
      const S = spec.root;
      const alpha = faded ? S.faded.alpha : 1;
      const [at, p] = windowOf(h, S.windows.emerge, S.windows.wither);
      host.ground(ctx, h, alpha);
      this.place(ctx, z, (P, q) => (at ? this.prog(P, p) : this.loop(P, q.phase, faded)), alpha, at ? (at < 0 ? '-emerge' : '-wither') : '');
      this.rows(ctx, x, y, r, S.rim, alpha);
    } else if (kind === 'trap') {
      const T = spec.trap;
      const { state, p, k } = trapState(spec, h);
      this.disc(ctx, x, y, r, T.plate.token, T.plate.alpha * (state === 'shut' ? T.windows.sprungAlpha : 1) * k);
      this.rows(ctx, x, y, r, T.groove, k);
      const S = T.spokes;
      const R = T.rivets;
      this.lines(ctx, S.layers, k, Array.from({ length: S.count }, (_, i) => {
        const a = (TAU * i) / S.count + Math.PI / S.count;
        return [x + Math.cos(a) * S.to, y + Math.sin(a) * S.to, x + Math.cos(a) * (r + S.from), y + Math.sin(a) * (r + S.from)];
      }));
      const n = Math.max(R.min, Math.round((TAU * r) / R.per));
      ctx.globalAlpha = k;
      ctx.fillStyle = TOKENS[R.token];
      for (let i = 0; i < n; i += 1) {
        const a = (TAU * (i + 0.5)) / n;
        ctx.fillRect(x + Math.cos(a) * (r + R.at) - R.size / 2, y + Math.sin(a) * (r + R.at) - R.size / 2, R.size, R.size);
      }
      // The layout's armed machine, in its state.
      this.place(ctx, { ...z, items: z.items.map((q) => ({ ...q, part: q.part.replace('armed', state) })) }, (P) => (state === 'spring' ? this.prog(P, p) : 0), k);
      this.rows(ctx, x, y, r, T.rim, k);
    } else if (kind === 'null') {
      const N = spec.null;
      const shape = this.shape(h.id, r, kind);
      const [at, q] = windowOf(h, N.erase.seconds, N.restore.seconds);
      if (at < 0) {
        const g = 1 - (1 - q) ** 2;
        ctx.globalAlpha = N.base.alpha;
        ctx.fillStyle = TOKENS[N.base.token];
        ctx.beginPath();
        for (const [px, py] of shape.jag) ctx.lineTo(x + px * g, y + py * g);
        ctx.fill();
      } else {
        const p = at ? q : 0;
        const line = (f: number) => shape.ghost.map(([a, b]) => [x + a[0], y + a[1], x + lerp(a[0], b[0], f), y + lerp(a[1], b[1], f)]);
        this.disc(ctx, x, y, r, N.base.token, N.base.alpha * (1 - p));
        ctx.lineCap = 'round';
        if (p > 0) this.lines(ctx, [N.restore.line], 1, line(p));
        ctx.lineCap = 'butt';
        ctx.setLineDash(N.ghost.dash);
        this.lines(ctx, N.ghost.layers, 1 - p, line(1));
        ctx.setLineDash([]);
        this.place(ctx, z, () => 0, 1 - p);
      }
      if (N.active.on) this.rows(ctx, x, y, r * N.active.at, N.active.layers);
      this.rows(ctx, x, y, r, N.rim);
    } else if (kind === 'shock') {
      const C = spec.shock.cracks;
      const p = clamp(1 - h.life / h.maxLife, 0, 1);
      const imminent = p >= 0.65;
      this.cracks(ctx, x, y, this.shape(h.id, r, kind), Math.min(1, p / C.grow.full) ** C.grow.power, spec.shock.coreLayers[imminent ? 'imminent' : 'telegraph'], 1);
      if (imminent) this.place(ctx, z, (P, q) => this.loop(P, q.phase));
      host.telegraph(ctx, h);
    }
  }

  /** Chapter 4's slow (SPEC slow.dial): ticks fill clockwise as its time runs, and one hand sweeps (tick by tick under reduced motion). */
  private dial(ctx: CanvasRenderingContext2D, h: Readonly<Hazard>) {
    const D = this.spec!.slow.dial;
    const { x, y, radius: r } = h;
    const prog = Number.isFinite(h.maxLife) ? clamp(1 - h.life / h.maxLife, 0, 1) : frac(this.time / D.period);
    const on = Math.floor(prog * D.ticks);
    const ticks: number[][][] = [[], []];
    for (let i = 0; i < D.ticks; i += 1) {
      const a = -Math.PI / 2 + (TAU * i) / D.ticks, r1 = r + (i % D.every ? D.r1 : D.long);
      ticks[i < on ? 0 : 1].push([x + Math.cos(a) * (r + D.r0), y + Math.sin(a) * (r + D.r0), x + Math.cos(a) * r1, y + Math.sin(a) * r1]);
    }
    const a = -Math.PI / 2 + TAU * (this.reduced ? on / D.ticks : prog), len = D.hand.len * (r + D.r0);
    ctx.lineCap = 'round';
    this.lines(ctx, D.on, 1, ticks[0]);
    this.lines(ctx, D.off, 1, ticks[1]);
    this.lines(ctx, D.hand.layers, 1, [[x, y, x + Math.cos(a) * len, y + Math.sin(a) * len]]);
    ctx.lineCap = 'butt';
    this.disc(ctx, x, y, D.hand.hub[1], D.hand.hub[0], 1);
  }

  /** The fires of drawTerrain, capped. */
  private drawFires(ctx: CanvasRenderingContext2D, fires: Fire[]) {
    const spec = this.spec!;
    const F = spec.fire;
    const li = this.lod;
    for (const f of fires) {
      const { x, y, radius } = f.h;
      this.disc(ctx, x, y, radius, F.base.token, F.base.alpha);
      const cross = f.state === 'gutter' ? (f.age - (F.windows.gutter - F.gutter.coldCross)) / F.gutter.coldCross : 0;
      ctx.globalAlpha = 1;
      for (const q of f.items) {
        if (q.z !== 'ground' || !kept(f, q)) continue;
        this.stamp(ctx, 'fire', q.part, 0, x + q.x, y + q.y, q.flip, 1 - Math.max(0, cross));
        if (cross > 0) this.stamp(ctx, 'fire', q.part.replace('char-', 'char-cold-'), 0, x + q.x, y + q.y, q.flip, cross);
      }
      this.rows(ctx, x, y, radius, F.rim);
      if (f.state === 'ignite' && f.age < F.ignite.flash.seconds) this.rows(ctx, x, y, radius, F.ignite.flash.layers, this.flash);
    }
    ctx.globalAlpha = 1;
    const flames = this.flames;
    flames.length = 0;
    for (const f of fires) {
      for (const q of f.items) {
        if (q.z !== 'flame' || !kept(f, q)) continue;
        flames.push({ f, q, y: f.h.y + q.y });
        if (q.prio === 0) f.bodies.push(q);
      }
    }
    flames.sort((a, b) => a.y - b.y);
    for (const { f, q } of flames) {
      if (f.state === 'burn') this.stamp(ctx, 'fire', q.part, this.loop(this.part('fire', q.part)!, q.phase), f.h.x + q.x, f.h.y + q.y, q.flip);
      else {
        const part = `${q.part}-${f.state}`;
        const P = this.part('fire', part);
        if (P) this.stamp(ctx, 'fire', part, this.prog(P, f.p), f.h.x + q.x, f.h.y + q.y, q.flip);
      }
    }
    if (!this.reduced) {
      let embers = F.caps.embers[li];
      for (const f of fires) {
        const { x, y, radius, id } = f.h;
        if (f.state !== 'ignite' && embers > 0) {
          for (const s of emberSlots(spec, f.bodies, radius, id, this.time, li, f.state === 'gutter' ? this.time - f.age : null)) {
            if (embers-- <= 0) break;
            this.stamp(ctx, 'fire', s.part, s.frame, x + s.x, y + s.y);
          }
        }
        if (f.state === 'gutter') for (const s of smokeSlots(spec, f.bodies, id, f.age, li)) this.stamp(ctx, 'fire', s.part, s.frame, x + s.x, y + s.y);
      }
    }
  }

  /** The hero's feet flames (API §9): `back` before the body, `front` after it, on the feet and mirrored by facing. */
  heroFlames(ctx: CanvasRenderingContext2D, layer: 'back' | 'front', x: number, y: number, facing: number, alpha = 1) {
    const P = this.part('hero', layer);
    if (P) this.stamp(ctx, 'hero', layer, this.loop(P, 0), x, y, facing < 0, alpha);
  }

  /** The hero's bind (API §4.5): `since` seconds into it the vines wrap over the part's seconds and hold; mirrored by facing. */
  heroBind(ctx: CanvasRenderingContext2D, layer: 'back' | 'front', x: number, y: number, facing: number, since: number, alpha = 1) {
    const part = `bind-${layer}`;
    const P = this.part('hero', part);
    if (P) this.stamp(ctx, 'hero', part, this.prog(P, since / P.seconds!), x, y, facing < 0, alpha);
  }

  /** Embers rising off the hero (API §8.5); none under reduced motion or at minimal detail. */
  heroEmbers(ctx: CanvasRenderingContext2D, x: number, y: number, facing: number) {
    if (this.reduced || this.lod === 2) return;
    for (const s of heroEmberSlots(this.spec!, this.time)) this.stamp(ctx, 'fire', s.part, s.frame, x + s.x * facing, y + s.y, facing < 0);
  }

  /**
   * The hero's coral multiply tint (SPEC hero.tint), `since` seconds after the burn began with `burn` seconds of it left:
   * 2 Hz between its two strengths, steady when flashes or motion are reduced, rising and falling at the edges.
   */
  tintAlpha(since: number, burn: number, steady: boolean) {
    const T = this.spec!.hero.tint;
    return (steady ? T.steady : T.alpha[Math.floor(since / T.step) % 2]) * Math.min(1, since / T.fadeIn, burn / T.fadeOut);
  }

  /** How many burning enemies get feet flames (nearest the hero first). */
  mobCap() {
    return this.spec!.mob.caps[this.lod];
  }

  /** An enemy's feet flames (API §3.5): the size nearest its radius, after its body. */
  mobFlames(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, facing: number) {
    const size = this.spec!.mob.radii.reduce((best, v) => (Math.abs(v - radius) < Math.abs(best - radius) ? v : best));
    const P = this.part('mob', `front-${size}`);
    if (P) this.stamp(ctx, 'mob', `front-${size}`, this.loop(P, 0), x, y, facing < 0);
  }
}
