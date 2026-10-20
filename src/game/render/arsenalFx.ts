// Weapon field effects painter (K10, FX-08): the kit's weapon stamps (PN.arsenalFx, baked into the `arsenal-fx` pack)
// and its shapes (SPEC, baked into the atlas manifest as data), drawn on the canvas (API-arsenal-fx §7-§9, §14): the
// blasts of the strike, nova, and lob weapons, their decals, the chains, the beams, the halos, the lobs in flight, and
// the awakening gimmicks: P1 (delivery 3a: the gimmick zones, the enemy overlays, the triangle seal, the unrolling
// scroll, the eighth seal, and the total eclipse) and P2 (delivery 3b: the head marks and feet overlays, the event rings
// and bursts, the gimmicks' own chains, beams, and shots, the small pots, the hero's haste). The layout, the shapes'
// points, and the lob path are ports of the kit's (API §8, §14.6, §14.11), tested against the kit's own vectors in the
// manifest, so every number stays data.
import AWAKENINGS from '../../content/data/awakenings.ts';
import type { ArsenalLob, ArsenalPending, AwakenedMarks, AwakeningZone, BeamEffect, ChainEffect, Entity, Projectile, SkillId, SkillMark, SkillState } from '../engine/worldTypes.ts';
import type { ArsenalFxManifest, ArsenalFxPart, SpriteAtlas } from './assets/spriteAtlas.ts';
import { ARSENAL_FX_PACK, slotEnabled } from './assets/slots.ts';
import { jit, tokenColor, type Token } from './skillVfx.ts';
import type { VisualDetail } from './visualRegistry.ts';
import { circleVisible, segmentVisible, type Viewport } from './viewport.ts';

type N2 = readonly [number, number];
type P2 = [number, number];
/** A SPEC layer [token, width, alpha?], drawn bottom up (API §7). */
type Layer = readonly [string, number, number?];
type Ls = readonly Layer[];
type Gaps = Readonly<{ n: N2; deg: N2 }>;
type Grow = Readonly<{ from: number; seconds: number }>;
type Fade = Readonly<{ at: number; dash?: N2 }>;
type Punch = Readonly<{ scale: number; seconds: number; reducedMax: number }>;
type Core = Readonly<{ layers: Ls; span: N2; at?: string; dab?: boolean; arc?: number; pad?: number }>;
/** A blast ring (API §7.3). */
export type RingSpec = Readonly<{
  prim: 'stroke' | 'band' | 'ripple' | 'multi' | 'jag' | 'torn' | 'dashed';
  layers: Ls; gaps?: Gaps; punch?: Punch; grow?: Grow; fade?: Fade; core?: Core;
  wash?: Readonly<{ token: string; alpha: number; union?: boolean }>; inner?: Readonly<{ at: number; layers: Ls }>;
  token: string; alpha?: number; edge?: Ls; width: N2; knots: number; endTaper?: number;
  fringe?: Readonly<{ side: number; pitch: number; h: N2; skip: number; layers: Ls }>;
  awakened?: Readonly<{ widthScale?: number; inner?: Readonly<{ at: number; layers: Ls }>; fringeSides?: readonly number[]; ring?: MultiRing }>;
  arcs: readonly Readonly<{ at: number; span: N2; layers: Ls }>[]; full?: Readonly<{ layers: Ls }>;
  rings: readonly MultiRing[]; seg: number; amp: N2; forks: Readonly<{ n: number; len: N2 }>; flicker: Readonly<{ fps: number; seeds: N2 }>;
}>;
type MultiRing = Readonly<{ final: number; delay: number; alpha: number }>;
/** A chain or beam line (API §7.4). */
export type LineSpec = Readonly<{
  prim: 'sag' | 'twist' | 'links' | 'blade' | 'brushBand' | 'string';
  layers: Ls; sag: number; step: number; grow: Readonly<{ frac: number }>; fade?: Fade;
  amp: number; wave: number; strands: readonly [Ls, Ls]; kinkEvery: number; kinkAmp: number; kinkStrand: number; flicker: Readonly<{ fps: number; seeds: N2 }>;
  pitch: number; ellipse: Readonly<{ rx: number; ry: number; layers: Ls }>; bar: Readonly<{ len: number; h: number; fill: string; edge: Layer }>;
  core: Readonly<{ layers: Ls; from: number }>; nubs: Readonly<{ every: number; r: number; fill: string; edge: Layer }>; minimal: Readonly<{ layers: Ls }>;
  capsule: Readonly<{ fill?: Layer; edge?: Ls; dash?: N2 }>; shaft: Readonly<{ token: string; width: N2; grain: Layer }>;
  head: Readonly<{ len: number; half: number; fill: string; edge: Layer }>; thrust: number; retract: Readonly<{ at: number; to: number }>;
  fill: Layer; edge: Readonly<{ layers: Ls; ragged: Readonly<{ pitch: number; amp: N2 }>; sides: string }>; taper?: readonly N2[];
  streaks?: Readonly<{ n: N2; layers: Ls; len: N2 }>; front?: Readonly<{ layers: Ls }>;
  punch?: Punch; after: Readonly<{ n: number; bow: number; seconds: number; sign: readonly number[]; layers: Ls }>;
  awakened?: Readonly<{ headScale: number; shadow: Readonly<{ offset: number; layers: Ls }>; after: number; widthScale: number }>;
}>;
/** A halo (API §7.5). */
export type HaloSpec = Readonly<{
  wash?: Readonly<{ token: string; alpha: number }>; outer?: Readonly<{ layers: Ls; gaps?: Gaps }>; inner?: Readonly<{ layers: Ls; dash: N2 }>;
  comet?: Readonly<{ span: number; head: N2; rim: Layer; body: string; core: Readonly<{ layers: Ls; from: number; to: number }>; sweep: number }>;
  rope?: Readonly<{ width: number; body: string; edge: Layer; twist: Readonly<{ pitch: N2; angle: number; layers: Ls }> }>;
  core: Readonly<{ layers: Ls; dash: N2; pad: number; span: number; gap: number }>;
  crescent?: Readonly<{ token: string; alpha: number; span: number; thick: number; sweep: number; step: number }>;
  grow?: Grow; fade?: Fade; awakened?: Readonly<{ span?: number; width?: number; opposite?: Readonly<{ alpha: number; thick: number }> }>;
}>;
type Splash = Readonly<{ token: string; n: N2; awakenedN?: N2; from: number; to: N2; width: N2; jitter: number; fork: number; drop: Readonly<{ p: number; r: N2; gap: N2 }>; grow: Grow; fade: Fade; minimal: number }>;
/** A layout descriptor (API §7.6, §14.6). */
type Place = Readonly<{
  prim: string; parts: readonly string[]; awakened?: readonly string[]; z: string; pick?: number; flip?: number; by?: string; steps?: N2;
  count?: N2; awakenedCount?: N2; jitter?: number; skip?: number; dr?: number; inout?: boolean; info?: number; big?: number; offset?: number;
  per?: number; min?: number; max?: number; margin?: number; minGap?: number;
}>;
type Wash = Readonly<{ token: string; alpha: number }>;
type Stitch = Readonly<{ layers: Ls; dash: N2; pad: number }>;
/** An awakening gimmick's ground zone (API §14.3, SPEC.zone[id]); its radius and life are the data's. */
export type ZoneSpec = Readonly<{
  stage: string; life: number; rim: string; wash?: Wash; floor?: string;
  gloss?: Readonly<{ at: readonly number[]; span: N2; layers: Ls }>;
  arcs?: Readonly<{ n: number; at: number; span: number; layers: Ls; turns: number; start: number }>;
  start?: Readonly<{ part: string; seconds: number }>; end?: Readonly<{ part: string; seconds: number }>;
}>;
type Ridge = Readonly<{ humps: number; amp: number; base: number; layers: Ls }>;
/** The other P1 gimmicks' shapes (API §14.4, SPEC.gimmick). */
type Gimmicks = Readonly<{
  trackingSeals: Readonly<{ stage: string; delay: number; life: number; pre: Stitch; strike: Readonly<{ layers: Ls; fill: Wash; fillSeconds: number; fade: Fade }> }>;
  fallingScroll: Readonly<{ stage: string; length: number; width: number; life: number; grow: number; fade: Fade; band: Readonly<{ fill: Wash; edge: Ls; ridge: Ridge; head: Ls }> }>;
  seventhSeal: Readonly<{ stage: string; r: number; delay: number; life: number; shadow: Readonly<{ token: string; rx: N2; alpha: N2 }>; stitch: Stitch; ring: Readonly<{ layers: Ls; gaps: Gaps; wash: Wash; grow: Grow; fade: Fade }> }>;
  eclipseHalo: Readonly<{ stage: string; wash: Wash; band: Readonly<{ token: string; alpha: number; at: number }>; outer: Ls; layers: Readonly<Record<string, string>>; reducedFlash: number }>;
}>;
/** An event ring (API §14.11): SPEC.ring's prims plus torn (a paper band, its inner edge torn) and dashed. */
export type EventRing = RingSpec & Readonly<{ dash: N2; pad?: number; tear: Readonly<{ pitch: number; depth: N2; skip: number; end: number; layers: Ls }> }>;
/** The paper crack lines of a crack burst (API §14.11). */
export type Cracks = Readonly<{ n: N2; from: number; to: N2; jitter: number; steps: readonly number[]; bend: N2; layers: Ls; core: Readonly<{ layers: Ls }>; fork: Readonly<{ at: number; deg: number; len: number }>; grow: Grow }>;
/** A P2 gimmick's shapes and stamps (API §14.11, SPEC.gimmick[id]); each reads the keys its stage has. */
export type P2Spec = Readonly<{
  stage: string; life: number; delay: number; lift: number; alpha: number; seed: number; angle: number; head: number; width: number; amp: number;
  burst: string; dab: string; puff: string; hit: string; event: string; fork: string; mini: string; part: string; start: string; travel: string; end: string;
  ring: EventRing; cracks: Cracks; fade: Fade; big: Readonly<{ part: string; from: number }>; share: Readonly<{ seconds: number; alpha: number }>;
  line: LineSpec & Readonly<{ seg: number; n: N2; shift: number; push: N2; alpha: number; clear: number }>; scale: Readonly<{ max: number }>;
}>;
type Mark = Readonly<{ group: string; part: string; stack?: N2 }>;
type Sized = Mark & Readonly<{ r: readonly number[] }>;
type Flight = Readonly<{ parts: readonly string[]; awakened?: readonly string[]; by?: string; turn?: number; frame?: string; landMirror?: Readonly<{ when: string; parts: readonly string[] }> }>;

/** The parts of the kit's SPEC this painter reads (API-arsenal-fx §7). */
export type ArsenalFxSpec = Readonly<{
  version: string;
  headY: number; headLift: number; footClear: number;
  awakened: Readonly<{ inset: number; layers: Ls; coreScale: number }>;
  decal: Readonly<{ fadeAt: number }>;
  life: Readonly<Record<string, Readonly<{ mark: number; decal?: number }>>>;
  ring: Readonly<Record<string, RingSpec>>;
  splash: Readonly<Record<string, Splash>> & Readonly<{ shape: Readonly<{ shoulder: N2; bend: number; fork: Readonly<{ at: number; deg: number; short: number }>; drop: Readonly<{ stretch: number; clear: number }>; reducedIn: number }> }>;
  tilt: Readonly<Record<string, Readonly<{ parts: readonly string[]; deg: readonly number[]; sign: number }>>>;
  line: Readonly<Record<string, LineSpec>>;
  halo: Readonly<Record<string, HaloSpec>>;
  layout: Readonly<Record<string, Readonly<Record<string, readonly Place[]>>>>;
  zorder: readonly string[];
  lob: Readonly<Record<string, Readonly<{ H: readonly [number, number, number]; shadow: Readonly<{ rx: N2; alpha: N2 }> }>>>;
  lobMini: Readonly<{ h: number; shadow: Readonly<{ rx: N2 }> }>;
  flight: Readonly<Record<string, Flight>> & Readonly<{ phase: number; shadow: Readonly<{ token: string }> }>;
  caps: Readonly<Record<'stamps' | 'decals' | 'flights' | 'links' | 'splash' | 'feet' | 'heads' | 'crows' | 'events' | 'zoneStamps' | 'pending' | 'spores' | 'pollenRings', readonly number[]>>;
  // delivery 3a (API §14), 3b (§14.10, §14.11)
  rim: Readonly<{ ally: Stitch; pad: Readonly<{ layers: Ls; inside: Ls }> }>;
  zone: Readonly<{ fadeIn: number; fadeOut: number }>;
  gimmick: Gimmicks;
  overlay: Readonly<{
    head: Readonly<{ dy: number; parts: Readonly<Record<string, Mark>> }>;
    feet: Readonly<{ freeze: Readonly<{ group: string; back: string; front: string; r: readonly number[] }> }> & Readonly<Record<string, Sized>>;
    crow: Mark & Readonly<{ peck: string; sit: N2; dive: Readonly<{ crow: N2; peck: N2 }> }>;
    crack: Mark & Readonly<{ stack: N2; dy: number; beside: number }>;
    pollen: Readonly<{ group: string; parts: readonly string[]; at: readonly N2[]; phase: readonly number[] }>;
  }>;
  marks: Readonly<{ crow: Readonly<{ rx: number; ry: number; period: number; lift: number; dive: number }>; spores: Readonly<{ slots: number; rise: number; drift: number }> }>;
  priority: Readonly<{ heads: readonly string[]; feet: readonly string[] }>;
}>;

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (u: number) => 1 - (1 - u) * (1 - u);
const polar = (r: number, a: number, cx = 0, cy = 0): P2 => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
const color = (token: string) => tokenColor(token as Token) ?? token;
/** The kinds whose blast or sweep is a ring mark (strike, nova, lob landing, halo). */
const MARK_KINDS: ReadonlySet<string> = new Set(['strike', 'nova', 'lob', 'halo']);
export const LODS: readonly VisualDetail[] = ['full', 'reduced', 'minimal'];

// ---- the kit's shapes (API §7.3-§8.3); each is the kit function of the same name ----

/** A ring's gaps [a0, a1] (rad): n by J(10), centre 2π(k + J(20+k))/n, width by J(40+k). */
export function gapList(g: Gaps | undefined, seed: number): P2[] {
  if (!g || !g.n[1]) return [];
  const n = Math.min(g.n[1], g.n[0] + Math.floor(jit(seed, 10) * (g.n[1] - g.n[0] + 1)));
  return Array.from({ length: n }, (_, k) => {
    const c = (TAU * (k + jit(seed, 20 + k))) / n, w = lerp(g.deg[0], g.deg[1], jit(seed, 40 + k)) * RAD;
    return [c - w / 2, c + w / 2];
  });
}
/** The arcs between gaps, clockwise; overlapping gaps merge; one full turn from 12 o'clock if there are none. */
export function arcsBetween(gaps: readonly P2[]): P2[] {
  if (!gaps.length) return [[-Math.PI / 2, -Math.PI / 2 + TAU]];
  const g = gaps.map((q): P2 => [q[0], q[1]]).sort((a, b) => a[0] - b[0]), m = [g[0]];
  for (let i = 1; i < g.length; i += 1) {
    const last = m[m.length - 1];
    if (g[i][0] <= last[1]) last[1] = Math.max(last[1], g[i][1]);
    else m.push(g[i]);
  }
  const last = m[m.length - 1];
  if (m.length > 1 && last[1] - TAU >= m[0][0]) {
    m[0][0] = last[1] - TAU;
    m.pop();
  }
  const arcs: P2[] = [];
  m.forEach((q, i) => {
    const a0 = q[1], a1 = i + 1 < m.length ? m[i + 1][0] : m[0][0] + TAU;
    if (a1 - a0 > 1.5 * RAD) arcs.push([a0, a1]);
  });
  return arcs;
}
/** A core arc: from 2π·J(60), lerp(span, J(61))° long (× coreScale awakened, at most a turn). */
export function coreArc(S: ArsenalFxSpec, core: Core, seed: number, aw: boolean): P2 {
  const c0 = TAU * jit(seed, 60);
  return [c0, c0 + Math.min(360, lerp(core.span[0], core.span[1], jit(seed, 61)) * (aw ? S.awakened.coreScale : 1)) * RAD];
}
/** The parts of [c0, c1] on the arcs. */
export function clipToArcs(c: P2, arcs: readonly P2[]) {
  const out: P2[] = [];
  for (const [a0, a1] of arcs) {
    for (let k = -1; k <= 1; k += 1) {
      const s0 = Math.max(a0, c[0] + k * TAU), s1 = Math.min(a1, c[1] + k * TAU);
      if (s1 - s0 > 0.5 * RAD) out.push([s0, s1]);
    }
  }
  return out;
}
/** The radius `age` into `grow` (ease out); R at once under reduced motion. */
export const grownR = (R: number, grow: Grow | undefined, age: number, reduced: boolean) => (!grow || reduced ? R : R * (grow.from + (1 - grow.from) * easeOut(clamp(age / grow.seconds, 0, 1))));
/** Alpha: 1 until fade.at of the life, then down to 0; under reduced motion it also comes in over the grow time. */
export function fadeA(fade: Fade | undefined, age: number, life: number, grow?: Grow, reduced = false) {
  const u = clamp(age / life, 0, 1);
  let a = fade && u > fade.at ? clamp((1 - u) / (1 - fade.at), 0, 1) : 1;
  if (reduced && grow) a *= clamp(age / grow.seconds, 0, 1);
  return a;
}
/** Punch: a stroke or ripple ring's layer width factor, 1 + (s − 1)(1 − u)², s at most reducedMax under reduced motion. */
export function punchM(pu: Punch | undefined, age: number, reduced: boolean) {
  if (!pu) return 1;
  const v = 1 - clamp(age / pu.seconds, 0, 1);
  return 1 + ((reduced ? Math.min(pu.scale, pu.reducedMax) : pu.scale) - 1) * v * v;
}

export type BandSeg = { a0: number; a1: number; closed: boolean; outer: P2[]; inner: P2[]; fringeIn?: P2[]; fringeOut?: P2[] };
/**
 * A band ring at radius R (API §7.3 band): widths cosine-blended between the knots J(1100+k), points counted from the
 * full radius R0, the ends of an open arc tapered, and a fringe (J(1300+k) inside, J(1500+k) outside) in place of a side.
 */
export function bandGeo(rs: RingSpec, R: number, seed: number, R0 = R, scale = 1, sides?: readonly number[]) {
  const K = rs.knots, knots = Array.from({ length: K }, (_, k) => lerp(rs.width[0], rs.width[1], jit(seed, 1100 + k)) * scale);
  const wf = (th: number) => {
    const s = ((((th % TAU) + TAU) % TAU) / TAU) * K, k = Math.floor(s) % K, c = (1 - Math.cos(Math.PI * (s - Math.floor(s)))) / 2;
    return knots[k] + (knots[(k + 1) % K] - knots[k]) * c;
  };
  const gaps = gapList(rs.gaps, seed), arcs = arcsBetween(gaps), closed = !gaps.length, fr = rs.fringe;
  const segs = arcs.map(([a0, a1]): BandSeg => {
    const n = Math.max(6, Math.ceil(((a1 - a0) * R0) / 5)), outer: P2[] = [], inner: P2[] = [];
    for (let i = 0; i <= (closed ? n - 1 : n); i += 1) {
      const th = lerp(a0, a1, i / n);
      let w = wf(th);
      const d = rs.endTaper && !closed ? Math.min(th - a0, a1 - th) / (rs.endTaper * RAD) : 1;
      if (d < 1) w *= 0.3 + 0.7 * Math.sin((Math.PI / 2) * d);
      outer.push(polar(R + w / 2, th));
      inner.push(polar(R - w / 2, th));
    }
    const seg: BandSeg = { a0, a1, closed, outer, inner };
    for (const side of fr ? sides ?? [fr.side] : []) {
      const base = side < 0 ? 1300 : 1500, m = Math.max(8, Math.round(((a1 - a0) * (R0 + side * 6)) / fr!.pitch)), pts: P2[] = [];
      for (let k = 0; k < (closed ? m : m + 1); k += 1) {
        const th = lerp(a0, a1, k / m), h = k % 2 || jit(seed, base + k) < fr!.skip ? 0 : lerp(fr!.h[0], fr!.h[1], jit(seed, base + 100 + k));
        pts.push(polar(R + side * (wf(th) / 2 + h), th));
      }
      if (side < 0) seg.inner = seg.fringeIn = pts;
      else seg.outer = seg.fringeOut = pts;
    }
    return seg;
  });
  return { segs, gaps, arcs, wf, knots };
}
/** A band's core as drawn: a dab core re-centred in the longest dab, 2° inside its ends; 360° the whole ring; else on the arcs. */
export function bandCoreArcs(S: ArsenalFxSpec, rs: RingSpec, arcs: readonly P2[], seed: number, aw: boolean): P2[] {
  let c = coreArc(S, rs.core!, seed, aw);
  if (rs.core!.dab && arcs.length) {
    const dab = arcs.reduce((m, q) => (q[1] - q[0] > m[1] - m[0] + 1e-9 ? q : m), arcs[0]), span = Math.min(c[1] - c[0], dab[1] - dab[0] - 4 * RAD), mid = (dab[0] + dab[1]) / 2;
    c = [mid - span / 2, mid + span / 2];
  }
  return c[1] - c[0] >= TAU - 1e-3 ? [[c[0], c[0] + TAU]] : clipToArcs(c, arcs);
}
/** The ripple's core on its arc: centred in core.span, × coreScale awakened, inside the arc. */
export function rippleCoreArc(S: ArsenalFxSpec, rs: RingSpec, aw: boolean): P2 {
  const core = rs.core!, A = rs.arcs[core.arc!], span = (core.span[1] - core.span[0]) * (aw ? S.awakened.coreScale : 1), mid = (core.span[0] + core.span[1]) / 2;
  return [Math.max(A.span[0], mid - span / 2) * RAD, Math.min(A.span[1], mid + span / 2) * RAD];
}
/** The jag ring's vertices and forks at radius R (seed: the flicker seed). */
export function jagGeo(rs: RingSpec, R: number, seed: number) {
  const n = Math.max(8, Math.round((TAU * R) / rs.seg));
  const V = Array.from({ length: n }, (_, k) => polar(R + (jit(seed, 200 + k) < 0.5 ? -1 : 1) * lerp(rs.amp[0], rs.amp[1], jit(seed, 20 + k)), ((k + (jit(seed, k) - 0.5) * 0.5) * TAU) / n));
  const forks = Array.from({ length: rs.forks.n }, (_, f) => {
    const P = V[Math.floor(jit(seed, 500 + f) * n) % n], a = Math.atan2(P[1], P[0]) + (jit(seed, 510 + f) - 0.5) * 0.6;
    const len = lerp(rs.forks.len[0], rs.forks.len[1], jit(seed, 520 + f)), P1 = polar(len * 0.55, a, P[0], P[1]);
    return [P, P1, polar(len * 0.45, a + (jit(seed, 530 + f) < 0.5 ? -0.5 : 0.5), P1[0], P1[1])];
  });
  return { V, forks };
}

export type Spike = { k: number; th: number; rb: number; rt: number; L: number; h: number; bend: number; fork: boolean; drop: { c: number; r: number } | null };
/** A blast's ink spikes at full length (API §7.3a): J(1700) to J(1790+k). */
export function splashGeo(S: ArsenalFxSpec, sp: Splash, R0: number, seed: number, aw: boolean): Spike[] {
  const SH = S.splash.shape, N = aw && sp.awakenedN ? sp.awakenedN : sp.n, n = N[0] + Math.floor(jit(seed, 1700) * (N[1] - N[0] + 1)), a0 = TAU * jit(seed, 1701);
  return Array.from({ length: n }, (_, k) => {
    const th = a0 + ((k + 0.5 + (jit(seed, 1710 + k) - 0.5) * 2 * sp.jitter) * TAU) / n, rb = sp.from * R0, rt = lerp(sp.to[0], sp.to[1], jit(seed, 1730 + k)) * R0;
    const h = lerp(sp.width[0], sp.width[1], jit(seed, 1740 + k)) / 2;
    let drop = null;
    if (jit(seed, 1770 + k) < sp.drop.p) {
      const gap = lerp(sp.drop.gap[0], sp.drop.gap[1], jit(seed, 1780 + k)), r = lerp(sp.drop.r[0], sp.drop.r[1], jit(seed, 1790 + k));
      if (rt + gap + SH.drop.stretch * r <= R0 - SH.drop.clear) drop = { c: rt + gap, r };
    }
    return { k, th, rb, rt, L: rt - rb, h, bend: (jit(seed, 1750 + k) - 0.5) * SH.bend * h, fork: jit(seed, 1760 + k) < sp.fork, drop };
  });
}
/** The spikes kept at a LOD (0 full, 1 even k, 2 none or k = 0, ⌊n/3⌋, ⌊2n/3⌋). */
export function splashKeep(spikes: Spike[], sp: Splash, li: number) {
  const n = spikes.length;
  if (li === 1) return spikes.filter((q) => q.k % 2 === 0);
  if (li === 2) return sp.minimal ? spikes.filter((q) => q.k === 0 || q.k === Math.floor(n / 3) || q.k === Math.floor((2 * n) / 3)) : [];
  return spikes;
}
/** A spike's outline at length share g (a wedge, or two prongs ±deg about the blast's centre). */
export function spikeOutline(S: ArsenalFxSpec, q: Spike, g: number): P2[] {
  const SH = S.splash.shape, L = q.L * g, x = (t: number) => q.rb + t * L, h = q.h, b = q.bend, c = Math.cos(q.th), s = Math.sin(q.th);
  const [s0, s1] = SH.shoulder, fa = SH.fork.deg * RAD, rA = x(1), rB = x(SH.fork.short);
  const pts: P2[] = q.fork
    ? [[q.rb, -h], [x(s0), -s1 * h + b], [rB * Math.cos(fa), -rB * Math.sin(fa)], [x(SH.fork.at), b / 2], [rA * Math.cos(fa), rA * Math.sin(fa)], [x(s0), s1 * h + b], [q.rb, h]]
    : [[q.rb, -h], [x(s0), -s1 * h + b], [x(1), 0], [x(s0), s1 * h + b], [q.rb, h]];
  return pts.map(([px, py]) => [px * c - py * s, px * s + py * c]);
}
/** A spike's tip points (one, or a fork's two prongs) at full length (paths). */
export const spikeTips = (S: ArsenalFxSpec, q: Spike) => (q.fork ? [polar(q.rb + q.L, q.th + S.splash.shape.fork.deg * RAD), polar(q.rb + S.splash.shape.fork.short * q.L, q.th - S.splash.shape.fork.deg * RAD)] : [polar(q.rt, q.th)]);

/** A crescent (cosine lune) between R and R − d·cos(π(θ − φ)/span) over φ ± span/2. */
export function crescentPts(R: number, d: number, phi: number, span: number, step: number) {
  const n = Math.max(4, Math.ceil(span / (step * RAD))), out: P2[] = [], inn: P2[] = [];
  for (let i = 0; i <= n; i += 1) {
    const th = phi - span / 2 + (span * i) / n;
    out.push(polar(R, th));
    inn.push(polar(R - d * Math.cos((Math.PI * (th - phi)) / span), th));
  }
  return out.concat(inn.reverse().slice(1, -1));
}
/** A comet along radius rm with its head at θ: centre line C, edges L and R, and its rounded front. */
export function cometGeo(rm: number, th: number, spanDeg: number, head: number) {
  const span = spanDeg * RAD, n = Math.max(8, Math.ceil(span / (4 * RAD))), C: P2[] = [], L: P2[] = [], R: P2[] = [], cap: P2[] = [];
  for (let i = 0; i <= n; i += 1) {
    const s = i / n, a = th - span * s, w = head * (1 - s) ** 0.9 + 0.8 * s;
    C.push(polar(rm, a));
    L.push(polar(rm + w / 2, a));
    R.push(polar(rm - w / 2, a));
  }
  const [hx, hy] = polar(rm, th), c = Math.cos(th), s = Math.sin(th);
  for (let i = 1; i < 8; i += 1) {
    const b = (Math.PI * i) / 8, o = (Math.cos(b) * head) / 2, f = Math.sin(b) * head * 0.45;
    cap.push([hx + c * o - s * f, hy + s * o + c * f]);
  }
  return { C, L, R, cap };
}
/** The ward's rope: twist marks from 2π·J(800)·R every lerp(pitch, J(810+k)), the stitch from 2π·J(820). */
export function ropeGeo(S: ArsenalFxSpec, hs: HaloSpec, R: number, seed: number, aw: boolean) {
  const w = aw && hs.awakened?.width ? hs.awakened.width : hs.rope!.width, tw = hs.rope!.twist, marks: [P2, P2][] = [];
  let s = TAU * jit(seed, 800) * R;
  const end = s + TAU * R - tw.pitch[0], dt = (Math.tan(tw.angle * RAD) * w) / 2 / R;
  for (let k = 0; s < end && k < 400; k += 1) {
    marks.push([polar(R - w / 2, s / R - dt), polar(R + w / 2, s / R + dt)]);
    s += lerp(tw.pitch[0], tw.pitch[1], jit(seed, 810 + k));
  }
  const c0 = TAU * jit(seed, 820);
  return { w, marks, core: [c0, c0 + hs.core.span * RAD * (aw ? S.awakened.coreScale : 1)] as P2 };
}
/** The comet's and crescent's angle: 2π·J(700) plus sweep over the life (none under reduced motion). */
export const sweepAngle = (seed: number, sweep: number, age: number, life: number, reduced: boolean) => TAU * jit(seed, 700) + (reduced ? 0 : sweep * RAD * clamp(age / life, 0, 1));

/** Quadratics through the points, control = midpoint + normal·(±sag·length), alternating; sampled every `step`. */
export function sagCurves(pts: readonly P2[], sag: number, step: number) {
  const out: P2[] = [], ctrls: P2[] = [];
  for (let i = 0; i + 1 < pts.length; i += 1) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, sg = (i % 2 ? -1 : 1) * sag;
    const cx = (ax + bx) / 2 - dy * sg, cy = (ay + by) / 2 + dx * sg, m = Math.max(8, Math.round(L / step));
    ctrls.push([cx, cy]);
    for (let j = i ? 1 : 0; j <= m; j += 1) {
      const t = j / m, u = 1 - t;
      out.push([u * u * ax + 2 * u * t * cx + t * t * bx, u * u * ay + 2 * u * t * cy + t * t * by]);
    }
  }
  return { pts: out, ctrls };
}
/** A polyline without its part within `clear` of its first point (the hero's foot ring). */
export function clearStart(pts: readonly P2[], clear: number): P2[] {
  const [x0, y0] = pts[0];
  for (let i = 1; i < pts.length; i += 1) {
    const d1 = Math.hypot(pts[i][0] - x0, pts[i][1] - y0);
    if (d1 >= clear) {
      const d0 = Math.hypot(pts[i - 1][0] - x0, pts[i - 1][1] - y0), u = (clear - d0) / (d1 - d0 || 1);
      return [[lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)] as P2].concat(pts.slice(i));
    }
  }
  return pts.slice(-1);
}
/** The part of a polyline from its start to length share t. */
export function cutAlong(pts: readonly P2[], t: number): P2[] {
  let total = 0;
  for (let i = 1; i < pts.length; i += 1) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let left = total * t;
  const out: P2[] = [pts[0]];
  for (let i = 1; i < pts.length && left > 0; i += 1) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    out.push(l <= left ? pts[i] : [lerp(pts[i - 1][0], pts[i][0], left / l), lerp(pts[i - 1][1], pts[i][1], left / l)]);
    left -= l;
  }
  return out.length > 1 ? out : [pts[0], pts[0]];
}
/** Two twisted strands per jump; strand kinkStrand kinks every kinkEvery samples by ±kinkAmp (J(fseed, 1000i + j)). */
export function twistGeo(pts: readonly P2[], ls: LineSpec, fseed: number) {
  const A: P2[] = [], B: P2[] = [];
  for (let i = 0; i + 1 < pts.length; i += 1) {
    const [ax, ay] = pts[i], dx = pts[i + 1][0] - ax, dy = pts[i + 1][1] - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, m = Math.max(6, Math.round(L / ls.step));
    for (let j = i ? 1 : 0; j <= m; j += 1) {
      const t = j / m, env = Math.sin(Math.PI * t), ph = (TAU * t * L) / ls.wave;
      let oa = ls.amp * Math.sin(ph) * env;
      const ob = ls.amp * Math.sin(ph + Math.PI) * env;
      if (j % ls.kinkEvery === 0 && j > 0 && j < m) oa += 2 * ls.kinkAmp * (jit(fseed, 1000 * i + j) - 0.5);
      A.push([ax + dx * t + nx * oa, ay + dy * t + ny * oa]);
      B.push([ax + dx * t + nx * ob, ay + dy * t + ny * ob]);
    }
  }
  return ls.kinkStrand === 0 ? { A, B } : { A: B, B: A };
}
export type Link = { x: number; y: number; angle: number; ring: boolean; core: boolean; nub: number };
/** The chain's links every pitch (after the clear zone): rings and bars by turns, a cyan ring mid-jump, a nub every `every`. */
export function linksGeo(pts: readonly P2[], ls: LineSpec, clear: number) {
  const items: Link[] = [];
  for (let i = 0; i + 1 < pts.length; i += 1) {
    const [ax, ay] = pts[i], dx = pts[i + 1][0] - ax, dy = pts[i + 1][1] - ay, L = Math.hypot(dx, dy) || 1, s0 = i === 0 ? clear : 0;
    const n = Math.max(1, Math.floor((L - s0) / ls.pitch)), start = s0 + (L - s0 - n * ls.pitch) / 2 + ls.pitch / 2, first = items.length;
    for (let k = 0; k < n; k += 1) items.push({ x: ax + (dx / L) * (start + k * ls.pitch), y: ay + (dy / L) * (start + k * ls.pitch), angle: Math.atan2(dy, dx), ring: k % 2 === 0, core: false, nub: 0 });
    items[first + 2 * Math.floor(Math.ceil(n / 2) / 2)].core = true;
  }
  items.forEach((it, k) => (it.nub = k % ls.nubs.every === ls.nubs.every - 1 ? (k % 2 ? 1 : -1) : 0));
  return items;
}
/** A ragged band edge from x0 to x1 every pitch: sign·max(0.6, hw(x) ± amp), amp by J(base+k), its sign by J(base+50+k). */
export function raggedEdge(x0: number, x1: number, hw: (x: number) => number, rg: Readonly<{ pitch: number; amp: N2 }>, seed: number, base: number, sign: number) {
  const n = Math.max(2, Math.ceil((x1 - x0) / rg.pitch));
  return Array.from({ length: n + 1 }, (_, k): P2 => {
    const x = lerp(x0, x1, k / n);
    return [x, sign * Math.max(0.6, hw(x) + lerp(rg.amp[0], rg.amp[1], jit(seed, base + k)) * (jit(seed, base + 50 + k) < 0.5 ? -1 : 1))];
  });
}
export function taperRatio(tp: readonly N2[], t: number) {
  for (let i = 1; i < tp.length; i += 1) if (t <= tp[i][0]) return lerp(tp[i - 1][1], tp[i][1], (t - tp[i - 1][0]) / (tp[i][0] - tp[i - 1][0]));
  return tp[tp.length - 1][1];
}
/** Where a brush band's head is `age` in (it runs out over grow.frac of the life). */
export const bandHead = (S: ArsenalFxSpec, ls: LineSpec, L: number, age: number, life: number) => S.footClear + (L - S.footClear) * easeOut(clamp(age / (ls.grow.frac * life), 0, 1));
/** The dry-brush streaks in a band: n by J(300), y by J(310+j), length by J(320+j), start by J(330+j). */
export function streakList(S: ArsenalFxSpec, ls: LineSpec, x1: number, w: number, seed: number) {
  const st = ls.streaks!, n = st.n[0] + Math.floor(jit(seed, 300) * (st.n[1] - st.n[0] + 1)), span = x1 - S.footClear;
  return Array.from({ length: n }, (_, j) => {
    const len = lerp(st.len[0], st.len[1], jit(seed, 320 + j)) * span, x0 = S.footClear + jit(seed, 330 + j) * (span - len);
    return { x0, x1: x0 + len, y: (2 * jit(seed, 310 + j) - 1) * 0.7 * w };
  });
}
/**
 * The ink lance: its tip thrusts out from `from`, then draws back fading; the leaf head's eleven points. A branch lance
 * (API §14.11) thrusts from 4 with its head × hk, never longer than 0.8 of the reach.
 */
export function bladeGeo(S: ArsenalFxSpec, ls: LineSpec, L: number, age: number, life: number, aw: boolean, from = S.footClear + 8, hk = 0) {
  const u = clamp(age / life, 0, 1), hs = (aw ? ls.awakened!.headScale : 1) * (hk || 1);
  let tip = u < ls.thrust ? lerp(from, L, easeOut(u / ls.thrust)) : L, a = 1;
  if (u > ls.retract.at) {
    const v = (u - ls.retract.at) / (1 - ls.retract.at);
    tip = lerp(L, ls.retract.to * L, v);
    a = 1 - v;
  }
  const hl = hk ? Math.min(ls.head.len * hs, tip * 0.8) : ls.head.len * hs, hh = ls.head.half * hs, xb = tip - hl, side: P2[] = [[xb, 1.6], [xb + hl * 0.18, hh * 0.85], [xb + hl * 0.35, hh], [xb + hl * 0.62, hh * 0.62], [xb + hl * 0.86, hh * 0.22]];
  return { tip, xb, a, head: side.map(([x, y]): P2 => [x, -y]).concat([[tip, 0]], side.reverse()) };
}

export type LobPoint = Readonly<{ x: number; y: number; h: number; angle: number; rx: number; ry: number; alpha: number }>;
/** The lob path (API §8.4): ground lerp, h = 4H·t(1 − t), H = clamp(k·d, min, max) (mini: lobMini.h), the shadow. */
export function lobPath(S: ArsenalFxSpec, id: string, x0: number, y0: number, x1: number, y1: number, t: number, mini = false): LobPoint | null {
  const L = S.lob[id];
  if (!L) return null;
  const small = mini && id === 'clusterPots', dx = x1 - x0, dy = y1 - y0, u = clamp(t, 0, 1);
  const H = small ? S.lobMini.h : clamp(L.H[0] * Math.hypot(dx, dy), L.H[1], L.H[2]), [r0, r1] = small ? S.lobMini.shadow.rx : L.shadow.rx, rx = lerp(r0, r1, u);
  return { x: x0 + dx * u, y: y0 + dy * u, h: 4 * H * u * (1 - u), angle: Math.atan2(dy - 4 * H * (1 - 2 * u), dx), rx, ry: 0.42 * rx, alpha: lerp(L.shadow.alpha[0], L.shadow.alpha[1], u) };
}

// ---- delivery 3b2: the P2 follow-up effects' shapes (API §14.11) ----

/**
 * The torn paper band per arc a between gaps: n = max(6, round((a1 − a0)·R0 / pitch)) steps; the outer edge on R + w/2,
 * the inner on R − w/2, every even inner vertex but the ends pushed in by lerp(depth, J(2150 + 97a + k)) unless J(2100 +
 * 97a + k) < skip; each end torn across, the band's middle jutting `end` past it. `rest`: the inner edge and both ends.
 */
export function tornRing(R: number, rs: EventRing, seed: number, R0: number) {
  const w = rs.width as unknown as number, tr = rs.tear;
  return arcsBetween(gapList(rs.gaps, seed)).map(([a0, a1], ai) => {
    const n = Math.max(6, Math.round(((a1 - a0) * R0) / tr.pitch)), outer: P2[] = [], inner: P2[] = [];
    for (let k = 0; k <= n; k += 1) {
      const th = lerp(a0, a1, k / n), j = 97 * ai + k, d = k % 2 || !k || k === n || jit(seed, 2100 + j) < tr.skip ? 0 : lerp(tr.depth[0], tr.depth[1], jit(seed, 2150 + j));
      outer.push(polar(R + w / 2, th));
      inner.push(polar(R - w / 2 - d, th));
    }
    const e0 = polar(R, a0 - tr.end / R), e1 = polar(R, a1 + tr.end / R), back = inner.reverse();
    return { outer, fill: outer.concat([e1], back, [e0]), rest: [outer[n], e1].concat(back, [e0, outer[0]]) };
  });
}
/**
 * A crack burst's paper crack lines: n by J(1900); line k at 2π·J(1901) + (k + 0.5 + (J(1910 + k) − 0.5)·2·jitter)·2π/n
 * from from·R, L = lerp(to, J(1930 + k))·R long in steps, each turned ± lerp(bend, J(1980 + 4k + j))° (− when J(1950 + 4k
 * + j) < 0.5); line ⌊J(1902)·n⌋ forks at a vertex, lines ⌊J(1903)·n⌋ and the one half a turn on take the core layers.
 */
export function crackLines(R: number, cs: Cracks, seed: number) {
  const J = (i: number) => jit(seed, i), n = cs.n[0] + Math.floor(J(1900) * (cs.n[1] - cs.n[0] + 1)), a0 = TAU * J(1901), fk = Math.floor(J(1902) * n), c1 = Math.floor(J(1903) * n), c2 = (c1 + Math.floor(n / 2)) % n;
  return Array.from({ length: n }, (_, k) => {
    const th = a0 + ((k + 0.5 + (J(1910 + k) - 0.5) * 2 * cs.jitter) * TAU) / n, r0 = cs.from * R, L = lerp(cs.to[0], cs.to[1], J(1930 + k)) * R, pts = [polar(r0, th)];
    cs.steps.forEach((st, j) => pts.push(polar((L - r0) * st, th + (J(1950 + 4 * k + j) < 0.5 ? -1 : 1) * lerp(cs.bend[0], cs.bend[1], J(1980 + 4 * k + j)) * RAD, ...pts[j])));
    const p = pts[cs.fork.at];
    return { k, pts, fork: k === fk ? [p, polar(cs.fork.len * L, th + (J(1904) < 0.5 ? -1 : 1) * cs.fork.deg * RAD, ...p)] : null, core: k === c1 || k === c2 };
  });
}
/** The leap's kinked bolt from A to B: n = clamp(round(|AB| / seg), n) steps, inner vertex i at (i + (J(2000 + i) − 0.5)·shift)/n, pushed lerp(push, J(2020 + i)) across, sides by turns. */
export function kinkPts(A: P2, B: P2, sp: P2Spec['line'], js: number) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, n = clamp(Math.round(L / sp.seg), sp.n[0], sp.n[1]), out: P2[] = [A];
  for (let i = 1; i < n; i += 1) {
    const t = (i + (jit(js, 2000 + i) - 0.5) * sp.shift) / n, push = lerp(sp.push[0], sp.push[1], jit(js, 2020 + i)) * (i % 2 ? 1 : -1);
    out.push([A[0] + dx * t - (dy / L) * push, A[1] + dy * t + (dx / L) * push]);
  }
  return out.concat([B]);
}
/** A jag ring's vertices whose angle is on the arc [a0, a1], in angle order (an open line between two gaps). */
export const jagRun = (V: readonly P2[], [a0, a1]: P2) => V.map((p) => [a0 + ((((Math.atan2(p[1], p[0]) - a0) % TAU) + TAU) % TAU), p] as const).filter((q) => q[0] <= a1).sort((a, b) => a[0] - b[0]).map((q) => q[1]);

/** A part's frame `age` into its event (kit frameFor): prog by its own seconds or the data's window (`life`); loop by the
 *  clock, half rate at reduced detail (li 1), held on its phase frame under reduced motion and at minimal detail (li 2). */
export function partFrame(P: Readonly<{ frames: number; drive: string; fps: number; seconds: number | null }>, age: number, life: number, phase: number, time: number, reduced: boolean, li: number) {
  const F = P.frames;
  if (P.drive === 'prog') return clamp(Math.floor((P.seconds ? age / P.seconds : age / life) * F), 0, F - 1);
  if (P.drive !== 'loop' && P.drive !== 'cycle') return 0;
  if (reduced || li === 2) return Math.min(F - 1, Math.floor(phase * F));
  // A cycle (3a) rises once every `seconds`: ⌊frac(t / seconds + phase)·frames⌋.
  if (P.drive === 'cycle') return Math.floor((((time / P.seconds! + phase) % 1) + 1) % 1 * F) % F;
  return ((Math.floor(time * (li === 1 ? P.fps / 2 : P.fps) + phase * F) % F) + F) % F;
}
/** A flying object's frame (API §8.4): by the flight's progress t when SPEC flight says so (frame 0 at minimal detail);
 *  else a loop by the flight's age and the lob's phase, its still frame under reduced motion and at minimal detail. */
export function flightFrame(P: Readonly<{ frames: number; fps: number; still: number | null }>, progress: boolean, t: number, age: number, phase: number, reduced: boolean, li: number) {
  const F = P.frames;
  if (progress) return li === 2 ? 0 : Math.min(F - 1, Math.floor(t * F));
  if (reduced || li === 2) return P.still ?? 0;
  return ((Math.floor(age * (li === 1 ? P.fps / 2 : P.fps) + phase * F) % F) + F) % F;
}

export type Item = { part: string; x: number; y: number; angle: number; flip: boolean; phase: number; prio: number; z: string; index?: number; prim?: string };
/** What a layout reads: the radius or length and width, awakening, the event's seed, its age and life, and a chain's points. */
export type Shape = { R: number; L: number; w: number; aw: boolean; seed: number; age: number; life: number; reduced: boolean; points?: readonly Readonly<{ x: number; y: number; r?: number }>[] };
/** The stamps of a stage (API §8.2), ground first (SPEC.zorder), each group in descriptor order. */
export function layout(S: ArsenalFxSpec, id: string, stage: string, o: Shape): Item[] {
  if (isGimmick(S, id, stage)) return glayout(S, id, stage, o);
  const list = S.layout[id]?.[stage];
  if (!list) return [];
  const J = (i: number) => jit(o.seed, i), out: Item[] = [];
  const at = (parts: readonly string[], v: number) => parts[Math.min(parts.length - 1, Math.floor(v * parts.length))];
  const add = (part: string, x: number, y: number, z: string, angle = 0, flip = false, phase = 0, prio = 0, index?: number) => out.push({ part, x, y, angle, flip, phase, prio, z, ...(index ? { index } : {}) });
  for (const q of list) {
    const parts = o.aw && q.awakened ? q.awakened : q.parts;
    if (q.prim === 'center' || q.prim === 'head') {
      const part = q.by === 'radius' ? parts[o.R < q.steps![0] ? 0 : o.R < q.steps![1] ? 1 : 2] : q.pick ? at(parts, J(q.pick)) : parts[0];
      add(part, 0, q.prim === 'head' ? S.headY : 0, q.z, 0, q.flip ? J(q.flip) < 0.5 : false);
    } else if (q.prim === 'ring') {
      const c = (o.aw && q.awakenedCount) || q.count!, n = c[0] + Math.floor(J(900) * (c[1] - c[0] + 1));
      let placed = 0;
      for (let k = 0; k < n; k += 1) {
        if (J(k + 100) < (q.skip ?? 0)) continue;
        const a = -Math.PI / 2 + ((k + 0.5 + (J(k) - 0.5) * 2 * (q.jitter ?? 0)) * TAU) / n, dr = (q.dr ?? 0) * (q.inout && J(k + 300) < 0.5 ? -1 : 1);
        add(at(parts, J(k + 200)), Math.cos(a) * (o.R + dr), Math.sin(a) * (o.R + dr), q.z, dr < 0 ? a + Math.PI : a, false, J(k + 400), placed < (q.info ?? 99) ? 0 : 2);
        placed += 1;
      }
    } else if (q.prim === 'point') {
      o.points?.forEach((p, i) => {
        if (!i) return;
        const r = p.r || 19;
        add(q.by === 'r' ? parts[r <= 15.5 ? 0 : r <= 23.5 ? 1 : 2] : q.pick ? parts[J(q.pick + i - 1) < q.big! ? 1 : 0] : parts[0], p.x, p.y, q.z, 0, !!q.pick && J(q.pick + 49 + i) < 0.5, 0, 0, i);
      });
    } else if (q.prim === 'tip') {
      const ls = S.line[id];
      add(q.pick ? parts[Math.floor(J(q.pick) * parts.length) % parts.length] : parts[0], ls.grow ? bandHead(S, ls, o.L, o.age, o.life) : o.L, 0, q.z);
    } else if (q.prim === 'line') {
      const n = q.count![0] + Math.floor(J(900) * (q.count![1] - q.count![0] + 1)), x0 = S.footClear;
      for (let j = 0; j < n; j += 1) {
        const y = (2 * J(j + 50) - 1) * q.offset! * o.w;
        add(parts[J(j + 60) < 0.5 ? 0 : 1], x0 + ((o.L - x0) * (j + 0.5 + (J(j) - 0.5) * 0.6)) / n, y, q.z, 0, y < 0, 0, 2);
      }
    } else if (q.prim === 'tail') {
      const h = S.halo[id], cr = h.crescent!, th = sweepAngle(o.seed, cr.sweep, o.age, o.life, o.reduced) - (((o.aw && h.awakened?.span) || cr.span) * RAD) / 2;
      add(parts[Math.floor(J(q.pick!) * parts.length) % parts.length], Math.cos(th) * o.R, Math.sin(th) * o.R, q.z, th + Math.PI / 2, false, J(410));
    }
  }
  return out.map((it, i) => [it, i] as const).sort((a, b) => S.zorder.indexOf(a[0].z) - S.zorder.indexOf(b[0].z) || a[1] - b[1]).map((q) => q[0]);
}

// ---- delivery 3a: the awakening gimmicks, P1 (API §14) ----

/** A weapon's ground zone spec, or a P1 gimmick's shapes (the SPEC keeps the weapons' ids beside fadeIn and fadeOut). */
export const zoneOf = (S: ArsenalFxSpec, id: string) => (S.zone as unknown as Readonly<Record<string, ZoneSpec | undefined>>)[id];
const gimmickOf = (S: ArsenalFxSpec, id: string) => (S.gimmick as unknown as Readonly<Record<string, Readonly<{ stage: string }> | undefined>>)[id];
/** Whether a stage is an awakening gimmick's (placed by glayout, API §14.6). */
export const isGimmick = (S: ArsenalFxSpec, id: string, stage: string) => zoneOf(S, id)?.stage === stage || gimmickOf(S, id)?.stage === stage;
/** The triangle the reference draws when no three points are given (API §14.6 corner). */
const REF_TRIANGLE: readonly P2[] = [[-110, 40], [104, 56], [-6, -92]];
/** Where the unrolling scroll's head is `age` in: out to L over grow (ease out); at L under reduced motion. */
export const unrollHead = (g: Gimmicks['fallingScroll'], L: number, age: number, reduced: boolean) => (reduced ? L : L * easeOut(clamp(age / g.grow, 0, 1)));

/**
 * A gimmick stage's stamps (kit glayout, API §14.6): center (pick), disc (40 candidates at 2π·J(k), (R − margin)·√J(k + 40),
 * refused within minGap·R by hypot(dx, 1.3dy), n = clamp(round(R / per), min, max), variant J(k + 80), flip J(k + 120),
 * phase J(k + 160), the first `info` prio 0), ring (as the main layout's, +x always outward), corner and centroid (the
 * points or the reference triangle), tip (the unroll head), and tail (the eclipse ribbon at the crescent's span).
 */
export function glayout(S: ArsenalFxSpec, id: string, stage: string, o: Shape): Item[] {
  const list = S.layout[id]?.[stage];
  if (!list) return [];
  const R = o.R, J = (i: number) => jit(o.seed, i), out: Item[] = [];
  const at = (parts: readonly string[], v: number) => parts[Math.min(parts.length - 1, Math.floor(v * parts.length))];
  const add = (prim: string, part: string, x: number, y: number, z: string, angle = 0, flip = false, phase = 0, prio = 0) => out.push({ prim, part, x, y, angle, flip, phase, prio, z });
  const tri = o.points && o.points.length >= 3 ? o.points.slice(0, 3).map((p): P2 => [p.x, p.y]) : REF_TRIANGLE;
  for (const q of list) {
    const parts = q.parts;
    if (q.prim === 'center') add('center', q.pick ? at(parts, J(q.pick)) : parts[0], 0, 0, q.z);
    else if (q.prim === 'disc') {
      const n = clamp(Math.round(R / q.per!), q.min!, q.max!), got: { x: number; y: number; k: number }[] = [];
      for (let k = 0; k < 40 && got.length < n; k += 1) {
        const a = TAU * J(k), d = Math.max(0, R - (q.margin ?? 0)) * Math.sqrt(J(k + 40)), x = Math.cos(a) * d, y = Math.sin(a) * d;
        if (!got.some((g) => Math.hypot(g.x - x, 1.3 * (g.y - y)) < (q.minGap ?? 0) * R)) got.push({ x, y, k });
      }
      got.forEach((g, i) => add('disc', at(parts, J(g.k + 80)), g.x, g.y, q.z, 0, J(g.k + 120) < 0.5, J(g.k + 160), i < (q.info ?? 99) ? 0 : 2));
    } else if (q.prim === 'ring') {
      const n = q.count![0] + Math.floor(J(900) * (q.count![1] - q.count![0] + 1)), rr = R + (q.dr ?? 0);
      let placed = 0;
      for (let k = 0; k < n; k += 1) {
        if (J(k + 100) < (q.skip ?? 0)) continue;
        const a = -Math.PI / 2 + ((k + 0.5 + (J(k) - 0.5) * 2 * (q.jitter ?? 0)) * TAU) / n;
        add('ring', at(parts, J(k + 200)), Math.cos(a) * rr, Math.sin(a) * rr, q.z, a, false, J(k + 400), placed < (q.info ?? 99) ? 0 : 2);
        placed += 1;
      }
    } else if (q.prim === 'corner') tri.forEach((p) => add('corner', parts[0], p[0], p[1], q.z));
    else if (q.prim === 'centroid') add('centroid', parts[0], (tri[0][0] + tri[1][0] + tri[2][0]) / 3, (tri[0][1] + tri[1][1] + tri[2][1]) / 3, q.z);
    else if (q.prim === 'tip') add('tip', parts[0], unrollHead(S.gimmick.fallingScroll, o.L, o.age, o.reduced), 0, q.z);
    else if (q.prim === 'tail') {
      const cr = S.halo[id].crescent!, th = sweepAngle(o.seed, cr.sweep, o.age, o.life, o.reduced) - (cr.span * RAD) / 2;
      add('tail', parts[Math.floor(J(q.pick!) * parts.length) % parts.length], Math.cos(th) * R, Math.sin(th) * R, q.z, th + Math.PI / 2, false, J(410));
    }
  }
  return out.map((it, i) => [it, i] as const).sort((a, b) => S.zorder.indexOf(a[0].z) - S.zorder.indexOf(b[0].z) || a[1] - b[1]).map((q) => q[0]);
}

/** A zone's fill and stamps' alpha `age` into its life (API §14.3): in over fadeIn, out over fadeOut. */
export const zoneFade = (S: ArsenalFxSpec, age: number, life: number) => Math.min(clamp(age / S.zone.fadeIn, 0, 1), clamp((life - age) / S.zone.fadeOut, 0, 1));
/**
 * A zone stamp `age` into its life (API §14.3, review 5 F2): the centre object shows its start part over the first
 * start.seconds and its end part over the last end.seconds (played inside the life), both at alpha 1; its own frames
 * fade in and out only on a side with no start or end part. Every other stamp takes the zone's alpha. `progress` is
 * the start or end part's share played (null: the part's own drive).
 */
export function zonePiece(S: ArsenalFxSpec, Z: ZoneSpec, it: Readonly<Item>, age: number, life: number): { part: string; progress: number | null; alpha: number } {
  if (it.prim !== 'center') return { part: it.part, progress: null, alpha: zoneFade(S, age, life) };
  const { start, end } = Z;
  if (start && age < start.seconds) return { part: start.part, progress: age / start.seconds, alpha: 1 };
  if (end && age > life - end.seconds) return { part: end.part, progress: (age - life + end.seconds) / end.seconds, alpha: 1 };
  return { part: it.part, progress: null, alpha: Math.min(start ? 1 : clamp(age / S.zone.fadeIn, 0, 1), end ? 1 : clamp((life - age) / S.zone.fadeOut, 0, 1)) };
}
/** The spin's two paper arcs [a0, a1] (rad): from 2π·J(start), turning `turns` a second (still under reduced motion). */
export function spinArcs(Z: ZoneSpec, seed: number, age: number, reduced: boolean): P2[] {
  const A = Z.arcs!, th0 = TAU * jit(seed, A.start) + (reduced ? 0 : TAU * A.turns * age);
  return Array.from({ length: A.n }, (_, k): P2 => [th0 + (k * TAU) / A.n, th0 + (k * TAU) / A.n + A.span * RAD]);
}
/** The unroll's mountain ridge (25 points): `humps` humps of amp·w over the band, its base at base·w below the axis. */
export const ridgePts = (L: number, w: number, rg: Ridge) => Array.from({ length: 25 }, (_, i): P2 => {
  const x = lerp(0.06 * L, 0.96 * L, i / 24);
  return [x, rg.base * w - rg.amp * w * Math.abs(Math.sin((Math.PI * rg.humps * (x - 0.06 * L)) / (0.9 * L)))];
});
/** The nearest size class to an enemy radius. */
export const sizeClass = (r: number, list: readonly number[]) => list.reduce((m, q) => (Math.abs(q - r) < Math.abs(m - r) ? q : m), list[0]);
/** The head mark an enemy wears (API §14.5, §14.10): the first of priority.heads it has but `skip` (`lost` is the smoke's wander). */
export function headMark(S: ArsenalFxSpec, m: Readonly<AwakenedMarks> | undefined, t: number, skip?: string) {
  if (!m) return undefined;
  for (const key of S.priority.heads) {
    if (key === skip) continue;
    if (key === 'stain' ? (m.stainUntil ?? 0) > t && (m.stain ?? 0) > 0 : ((m[(key === 'lost' ? 'wander' : key) as keyof AwakenedMarks] as number | undefined) ?? 0) > t) return key;
  }
  return undefined;
}
/**
 * The crow over an enemy (API §14.5) `t` into its orbit, `top` its sprite's top: it circles (rx, top − lift + ry sin a),
 * a = 2π·t / period, facing the way it flies; `peck` seconds after a peck it dives to the head and back over dive seconds.
 * Under reduced motion it sits.
 */
export function crowAt(S: ArsenalFxSpec, t: number, top: number, peck: number, reduced: boolean) {
  const c = S.marks.crow, q = S.overlay.crow, pecking = peck >= 0 && peck < c.dive;
  if (reduced) return { x: q.sit[0], y: top + q.sit[1], flip: false, pecking };
  const a = (TAU * t) / c.period, flip = Math.sin(a) > 0, k = pecking ? Math.sin((Math.PI * peck) / c.dive) : 0;
  return { x: lerp(Math.cos(a) * c.rx, (flip ? 1 : -1) * q.dive.crow[0], k), y: lerp(top - c.lift + Math.sin(a) * c.ry, top + q.dive.crow[1], k), flip, pecking };
}

// ---- the painter ----

/** A ring mark the painter draws this frame: its age and life, and its layout. */
type Event = { m: Readonly<SkillMark>; id: string; st: string; age: number; life: number; aw: boolean; items: Item[] };
/** An awakening gimmick's zone this frame: its spec, age, alpha, cosmetic seed, and the stamps kept under the caps. */
type ZonePlan = { z: Readonly<AwakeningZone>; Z: ZoneSpec; age: number; life: number; A: number; seed: number; items: readonly Item[]; d: number; keep: Item[] };
/** A zone's standing piece (a grave, a pillar), sorted in among the bodies by its foot y; the box it covers. */
export type Stand = Readonly<{ p: ZonePlan; it: Item; x: number; y: number; left: number; top: number; right: number; bottom: number }>;
/**
 * What the kit draws on an enemy this frame (API §14.5, §14.10): its feet overlay (a priority.feet key), head mark, crow
 * and peck, a boss's crack plate (its stack), the pollen spores, and its overlay clock.
 */
export type Over = { feet: string | null; head: string | null; crow: boolean; peck: number; crack: number; spores: boolean; t: number };
/** What an enemy overlay needs of a body: where it stands, its sprite's top and facing, and its entity. */
export type OverlayBody = Readonly<{ x: number; y: number; top: number; enemy: Readonly<Entity> | null; sprite?: Readonly<{ facing: number }> | null }>;
/** The P2 stages a ring mark (an echo blast, or a gimmick's ring) draws as (API §14.11), beside the eighth seal. */
const EVENT_STAGES: ReadonlySet<string> = new Set(['eighth', 'stain', 'dab', 'crack', 'echo', 'split', 'fear', 'pollen', 'rear']);
/** The P2 stages of the gimmicks' own lines: echo beams, echo chains. */
const LINE_STAGES: ReadonlySet<string> = new Set(['unroll', 'branch', 'resweep', 'leap', 'rewind', 'link']);
/** A P2 gimmick's shapes (SPEC.gimmick[id]). */
const p2 = (S: ArsenalFxSpec, id: string) => (S.gimmick as unknown as Readonly<Record<string, P2Spec>>)[id];
/** A layer list `k` times as wide. */
const thick = (layers: Ls, k: number) => layers.map(([t, w, a]): Layer => [t, w * k, a]);
/** The ice under a frost chain's feet stays a moment longer than the chain (SPEC life decal). */
type Rime = { x: number; y: number; part: string; at: number };

export class ArsenalFxPainter {
  spec: ArsenalFxSpec | null = null;
  private data: ArsenalFxManifest | undefined;
  private atlas: SpriteAtlas | null = null;
  private time = 0;
  private reduced = false;
  private flash = 1;
  /** Level of detail: 0 full, 1 reduced, 2 minimal. */
  private lod = 0;
  private skills: Readonly<Partial<Record<SkillId, Readonly<SkillState>>>> = {};
  /** Stamps left this frame (SPEC caps.stamps); decoration stops when they run out, objects never do. */
  private left = 0;
  /** Chain links left this frame (SPEC caps.links); past them a frost chain is one bent line, as at minimal detail. */
  private links = 0;
  /** Cosmetic serials for beams, chains, and casts of lobs (BUG-08: never a game id). */
  private serial = 0;
  private readonly serials = new WeakMap<object, number>();
  private readonly rimes: Rime[] = [];
  private readonly seen = new WeakSet<object>();
  private readonly events: Event[] = [];
  private readonly zonePlans: ZonePlan[] = [];
  private readonly standList: Stand[] = [];
  /** Each zone's plan, kept from frame to frame (its stamps and standing pieces never move); refreshed by planZones. */
  private readonly zoneCache = new WeakMap<object, ZonePlan>();
  private readonly standCache = new WeakMap<Item, Stand>();
  private readonly over = new Map<object, Over>();
  /** Over records reused frame to frame. */
  private readonly overPool: Over[] = [];
  /** The nearest overlays of each kind this frame (distances and bodies), and the fires burning: reused frame to frame. */
  private readonly near = { fd: [] as number[], fb: [] as OverlayBody[], hd: [] as number[], hb: [] as OverlayBody[], cd: [] as number[], cb: [] as OverlayBody[], sd: [] as number[], sb: [] as OverlayBody[], fires: [] as Readonly<AwakeningZone>[] };
  /** The awakened marks whose kit art is in (their vector signs give way), as of the last spec read. */
  readonly kitMarks = new Set<string>();
  private kitFor: ArsenalFxSpec | null = null;
  /** Event stamps left this frame (SPEC caps.events: pecks and the deco moments), the deco seen (reduced keeps every other), pollen rings left. */
  private evs = 0;
  private deco = 0;
  private pollen = 0;
  /** The last weapon lance drawn this frame, whose tip the branches fork from (and whether its fork is drawn). */
  private lance: Readonly<BeamEffect> | null = null;
  private forked: object | null = null;
  private readonly links2 = new Set<object>();

  /** Picks up the frame's settings; false while the weapon art or its data is missing (callers keep their fallback). */
  begin(atlas: SpriteAtlas | null, time: number, reduced: boolean, flashStrength: number, detail: VisualDetail, skills: Readonly<Partial<Record<SkillId, Readonly<SkillState>>>>) {
    this.atlas = atlas;
    this.data = atlas?.status(ARSENAL_FX_PACK) === 'ready' && slotEnabled('arsenal') ? atlas.arsenalFx() : undefined;
    this.spec = (this.data?.spec as ArsenalFxSpec | undefined) ?? null;
    if (time < this.time) {
      // A new run: its effects are new.
      this.rimes.length = 0;
    }
    this.time = time;
    this.reduced = reduced;
    this.flash = flashStrength;
    this.lod = Math.max(0, LODS.indexOf(detail));
    this.skills = skills;
    const S = this.spec;
    if (!S) return false;
    this.left = S.caps.stamps[this.lod];
    this.links = S.caps.links[this.lod];
    this.evs = S.caps.events[this.lod];
    this.pollen = S.caps.pollenRings[this.lod];
    this.deco = 0;
    this.lance = this.forked = null;
    if (this.kitFor !== S) {
      // The marks the kit draws: each overlay key whose weapon's gimmick is done (the smoke's `lost` is its wander).
      const O = S.overlay, keys: [string, string][] = [...Object.entries(O.head.parts).map(([k, q]): [string, string] => [k === 'lost' ? 'wander' : k, q.group]), ['crow', O.crow.group], ['crack', O.crack.group], ['pollen', O.pollen.group], ['thorn', O.feet.thorn.group]];
      this.kitMarks.clear();
      for (const [key, group] of keys) if (this.done(group)) this.kitMarks.add(key);
      this.kitFor = S;
    }
    return true;
  }

  /**
   * How long a weapon's blast or sweep mark stays (its ring, then its decal), or a P1 gimmick's (the eighth seal through
   * its print, the total eclipse), when the kit draws it; else undefined.
   */
  markSeconds(id: SkillId, echo = false, heavy = false) {
    const st = this.markStage(id, echo, heavy);
    return st ? Math.max(this.stageLife(id, st), (st === this.data!.meta[id].main || st === 'eighth' ? this.spec!.life[id].decal : 0) ?? 0) : undefined;
  }

  /** How long a ring mark's stage plays: a weapon's own (and the eclipse's, and a split's plain cluster pot ring) its mark's life, a gimmick's its own. */
  private stageLife(id: string, st: string) {
    return st === this.data!.meta[id].main || st === 'total' || st === 'split' ? this.spec!.life[id].mark : p2(this.spec!, id).life;
  }

  private drawn(id: string) {
    const meta = this.data?.meta[id];
    return !!meta?.done.fx && MARK_KINDS.has(meta.kind);
  }

  /** Whether the kit has drawn a weapon's P1 gimmick (delivery 3a). */
  private done(id: string) {
    return !!this.data?.meta[id]?.done.gimmick;
  }

  /** The stage of a drawn P1 gimmick the kit shapes itself (a zone, or SPEC.gimmick's). */
  private gimmick(id: string) {
    return this.done(id) ? gimmickOf(this.spec!, id)?.stage ?? zoneOf(this.spec!, id)?.stage : undefined;
  }

  /**
   * The stage a ring mark draws as: the weapon's own blast or sweep, an eclipse's heavy sweep (total), or a gimmick's
   * echo blast or ring (the eighth seal, a stain's or a crack's burst, a late dab, the clap's echo, a cluster pot's
   * split, the fear, the pollen, the rear hit).
   */
  private markStage(id: string, echo: boolean, heavy: boolean) {
    if (!this.spec) return undefined;
    if (!echo && !heavy) return this.drawn(id) ? this.data!.meta[id].main ?? undefined : undefined;
    const st = this.gimmick(id);
    return (echo && EVENT_STAGES.has(st!)) || (heavy && st === 'total') ? st : undefined;
  }

  /** Whether the kit draws this ring mark (a weapon's own blast or sweep, the total eclipse, a drawn gimmick's echo or ring). */
  handles(mark: Readonly<SkillMark>) {
    return mark.kind === 'ring' && !!this.markStage(mark.skillId, !!mark.echo, mark.heavy);
  }

  /**
   * Whether the kit draws this beam or chain: a weapon's own, the tracking seals' triangle, and a drawn gimmick's own
   * line (the unrolling scroll, a lance's branches, the brush's sweep back, a leap, a rewound thread, a link's flash).
   */
  handlesLine(line: Readonly<BeamEffect | ChainEffect>) {
    const S = this.spec, id = line.skillId;
    if (!S || !id) return false;
    const st = this.gimmick(id);
    return line.echo ? LINE_STAGES.has(st!) : st === 'triangle' || (!!this.data!.meta[id]?.done.fx && !!S.line[id]);
  }

  private seedOf(thing: object) {
    let seed = this.serials.get(thing);
    if (seed === undefined) this.serials.set(thing, (seed = this.serial += 1));
    return seed;
  }

  private part(group: string, part: string): ArsenalFxPart | undefined {
    return this.data?.parts[group]?.[part];
  }

  /**
   * Draws a stamp with its anchor on (x, y), turned by `angle` and mirrored about the anchor; flash parts dim under
   * reduced flash. An upright stamp skips the save and transform (crowds of zone stamps and marks, review 5 perf).
   */
  private put(ctx: CanvasRenderingContext2D, group: string, part: string, frame: number, x: number, y: number, angle = 0, flip = false, alpha = 1) {
    const f = this.atlas?.frame(`afx/${group}/${part}/${frame}`);
    if (!f || alpha <= 0.01) return;
    const u = 1 / f.scale, base = ctx.globalAlpha;
    this.left -= 1;
    if (!angle && !flip) {
      ctx.globalAlpha = base * Math.min(1, alpha) * (this.part(group, part)?.flash ? this.flash : 1);
      ctx.drawImage(f.image, f.sx, f.sy, f.sw, f.sh, x - f.ax * u, y - f.ay * u, f.sw * u, f.sh * u);
      ctx.globalAlpha = base;
      return;
    }
    ctx.save();
    ctx.globalAlpha = base * Math.min(1, alpha) * (this.part(group, part)?.flash ? this.flash : 1);
    ctx.translate(x, y);
    if (angle) ctx.rotate(angle);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(f.image, f.sx, f.sy, f.sw, f.sh, -f.ax * u, -f.ay * u, f.sw * u, f.sh * u);
    ctx.restore();
  }

  /**
   * Layout items of one z at (x, y) (kit putItems): minimal drops decoration and prio-2 items, reduced every other one of
   * them, and decoration stops once the frame's stamps run out. Decals fade (SPEC decal); tilted parts turn by frame.
   */
  private place(ctx: CanvasRenderingContext2D, id: string, items: readonly Item[], z: string, x: number, y: number, age: number, life: number, seed: number, mirror?: readonly string[], lift = 0, alpha = 1) {
    const S = this.spec!, tl = S.tilt[id];
    let deco = 0;
    for (const it of items) {
      const P = it.z === z ? this.part(id, it.part) : undefined;
      if (!P) continue;
      if (P.lod === 'deco' || it.prio === 2) {
        deco += 1;
        if (this.lod === 2 || (this.lod === 1 && deco % 2 === 0) || this.left <= 0) continue;
      }
      const fr = partFrame(P, age, life, it.phase, this.time, this.reduced, this.lod);
      let angle = P.rotate === 'none' ? 0 : it.angle;
      if (tl?.parts.includes(it.part)) angle += (jit(seed, tl.sign) < 0.5 ? -1 : 1) * tl.deg[fr] * RAD;
      this.put(ctx, id, it.part, fr, x + it.x, y + it.y - (P.place === 'head' ? lift : 0), angle, it.flip !== !!mirror?.includes(it.part), (P.window === 'decal' ? this.decalAlpha(id, age) : 1) * alpha);
    }
  }

  private decalAlpha(id: string, age: number) {
    const S = this.spec!, Ld = S.life[id].decal ?? 1, fa = S.decal.fadeAt;
    return age <= fa * Ld ? 1 : clamp(1 - (age - fa * Ld) / ((1 - fa) * Ld), 0, 1);
  }

  /** Strokes the current path once per layer, bottom up, `m` times as wide; dashed layers have butt ends, the ink one padded. */
  private stroke(ctx: CanvasRenderingContext2D, layers: Ls, alpha: number, m = 1, dash?: N2, pad = 0, join: CanvasLineJoin = 'round', off = 0) {
    const base = ctx.globalAlpha;
    ctx.lineJoin = join;
    ctx.lineCap = dash ? 'butt' : 'round';
    layers.forEach(([token, width, a = 1], i) => {
      ctx.globalAlpha = base * a * alpha;
      ctx.strokeStyle = color(token);
      ctx.lineWidth = width * m;
      if (dash) {
        const p = i === 0 ? pad : 0;
        ctx.setLineDash([dash[0] + 2 * p, Math.max(0.05, dash[1] - 2 * p)]);
        ctx.lineDashOffset = p + off;
      }
      ctx.stroke();
    });
    ctx.globalAlpha = base;
    if (dash) ctx.setLineDash([]);
  }

  private fill(ctx: CanvasRenderingContext2D, token: string, alpha: number, rule: CanvasFillRule = 'nonzero') {
    const base = ctx.globalAlpha;
    ctx.globalAlpha = base * alpha;
    ctx.fillStyle = color(token);
    ctx.fill(rule);
    ctx.globalAlpha = base;
  }

  /** The current path becomes a polyline (closed: a polygon) offset by (x, y). */
  private poly(ctx: CanvasRenderingContext2D, pts: readonly P2[], close = false, x = 0, y = 0, fresh = true) {
    if (fresh) ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(x + px, y + py) : ctx.moveTo(x + px, y + py)));
    if (close) ctx.closePath();
  }

  private circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a0 = -Math.PI / 2, a1 = a0 + TAU, fresh = true) {
    if (fresh) ctx.beginPath();
    ctx.moveTo(x + Math.cos(a0) * r, y + Math.sin(a0) * r);
    ctx.arc(x, y, Math.max(0, r), a0, a1);
  }

  /** A closed Catmull-Rom spline through the points (kit smooth(…, true)). */
  private smooth(ctx: CanvasRenderingContext2D, p: readonly P2[], closed: boolean) {
    const n = p.length, g = (i: number) => p[closed ? (i + n) % n : clamp(i, 0, n - 1)];
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 0; i < (closed ? n : n - 1); i += 1) {
      const [a, b, c, d] = [g(i - 1), g(i), g(i + 1), g(i + 2)];
      ctx.bezierCurveTo(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6, c[0], c[1]);
    }
    if (closed) ctx.closePath();
  }

  /** The marks the kit draws this frame, within their life (`decals` keeps them through their decal's), on screen. */
  private collect(marks: readonly Readonly<SkillMark>[], view: Viewport, decals: boolean) {
    const S = this.spec!, out = this.events;
    out.length = 0;
    for (const m of marks) {
      const st = m.kind === 'ring' ? this.markStage(m.skillId, !!m.echo, m.heavy) : undefined;
      if (!st || !circleVisible(view, m.x, m.y, m.radius + 70)) continue;
      // A gimmick's ring is plain (no awakened line); only a weapon's own blast and the eighth seal leave a decal.
      const id = m.skillId, age = m.maxLife - m.life, life = this.stageLife(id, st), main = st === this.data!.meta[id].main, aw = main && this.skills[id]?.awakened === true;
      if (age < (decals ? (st === 'total' ? life : (main || st === 'eighth' ? S.life[id].decal : 0) ?? 0) : life)) out.push({ m, id, st, age, life, aw, items: layout(S, id, st, { R: m.radius, L: 0, w: 0, aw, seed: m.seed ?? 1, age, life, reduced: this.reduced }) });
    }
    return out;
  }

  /** Mirrors a lob's landing object when it came from the right (SPEC flight landMirror); unknown ways keep it as baked. */
  private mirror(e: Event) {
    const lm = this.spec!.flight[e.id]?.landMirror;
    return lm && lm.when === 'dx<0' && (e.m.dir ?? 0) < 0 ? lm.parts : undefined;
  }

  /**
   * The ground layer, under the bodies: the total eclipse's disc and band (review 5 ②: halved under reduced flash), then
   * the decals of the blasts and the eighth seal's print (newest first, SPEC caps.decals; none at minimal detail). A
   * meteor brush landing where its mark lies leaves no crater of its own (the mark's floor is the same stamp).
   */
  drawDecals(ctx: CanvasRenderingContext2D, marks: readonly Readonly<SkillMark>[], zones: readonly Readonly<AwakeningZone>[], view: Viewport) {
    const S = this.spec!;
    let left = S.caps.decals[this.lod];
    const events = this.collect(marks, view, true);
    ctx.save();
    for (const e of events) if (e.st === 'total' && e.age < e.life) this.total(ctx, e, 'ground');
    for (let i = events.length - 1; i >= 0 && left > 0; i -= 1) {
      const e = events[i];
      if (!e.items.some((it) => it.z === 'ground')) continue;
      left -= 1;
      const marked = e.id === 'meteorBrush' && zones.some((z) => z.weapon === e.id && Math.abs(z.x - e.m.x) < 1 && Math.abs(z.y - e.m.y) < 1 && !!this.zoneSpec(z.weapon));
      this.place(ctx, e.id, marked ? e.items.filter((it) => it.part !== zoneOf(S, e.id)!.floor) : e.items, 'ground', e.m.x, e.m.y, e.age, e.life, e.m.seed ?? 1);
    }
    ctx.restore();
  }

  /**
   * The weapons' blasts and sweeps (API §9.2): every splash (SPEC caps.splash), then every ring, band, and halo (a cast's
   * seal washes as one path), then the objects by the events' y. Objects over the hero's head rise past its debuff timers.
   */
  drawMarks(ctx: CanvasRenderingContext2D, marks: readonly Readonly<SkillMark>[], view: Viewport, lift: boolean) {
    const S = this.spec!, events = this.collect(marks, view, false);
    if (!events.length) return;
    ctx.save();
    let splashes = S.caps.splash[this.lod];
    const main = (e: Event) => e.st === this.data!.meta[e.id].main;
    for (const e of events) if (main(e) && S.splash[e.id] && splashes > 0 && this.splash(ctx, e)) splashes -= 1;
    events.forEach((e, i) => {
      if (e.st === 'eighth') return this.eighth(ctx, e);
      if (e.st === 'total') return this.total(ctx, e);
      if (!main(e)) return this.event(ctx, e);
      const rs = S.ring[e.id];
      if (rs?.wash?.union && events.findIndex((q) => main(q) && q.id === e.id && q.m.life === e.m.life) === i) {
        // One cast's washes are one path filled once (nonzero), so overlapping seals do not stack their paper.
        ctx.beginPath();
        for (const q of events) if (main(q) && q.id === e.id && q.m.life === e.m.life) this.circle(ctx, q.m.x, q.m.y, grownR(q.m.radius, rs.grow, q.age, this.reduced), 0, TAU, false);
        this.fill(ctx, rs.wash.token, rs.wash.alpha * fadeA(rs.fade, e.age, e.life, rs.grow, this.reduced));
      }
      if (rs) this.ring(ctx, e, rs);
      else this.halo(ctx, e, S.halo[e.id]);
    });
    events.sort((a, b) => a.m.y - b.m.y);
    for (const e of events) this.place(ctx, e.id, e.items, 'ally', e.m.x, e.m.y, e.age, e.life, e.m.seed ?? 1, main(e) ? this.mirror(e) : undefined, lift && main(e) ? S.headLift : 0, e.st === 'total' ? fadeA(S.halo[e.id].fade, e.age, e.life) : 1);
    ctx.restore();
  }

  /** The eighth seal's strike (API §14.4): its wash and heavy ring (gaps, grow, fade) round the seven seals' centre; the big seal is a stamp. */
  private eighth(ctx: CanvasRenderingContext2D, e: Event) {
    const rg = this.spec!.gimmick.seventhSeal.ring, { x, y } = e.m, R = grownR(e.m.radius, rg.grow, e.age, this.reduced), A = fadeA(rg.fade, e.age, e.life, rg.grow, this.reduced);
    if (A <= 0.01) return;
    this.circle(ctx, x, y, R);
    this.fill(ctx, rg.wash.token, rg.wash.alpha * A);
    for (const [a0, a1] of arcsBetween(gapList(rg.gaps, e.m.seed ?? 1))) {
      this.circle(ctx, x, y, R, a0, a1);
      this.stroke(ctx, rg.layers, A);
    }
  }

  /**
   * The total eclipse (API §14.4, §14.10 decision ②), its parts on the layer SPEC eclipseHalo.layers puts them: the disc
   * and the band (on the ground, × reducedFlash under reduced flash), the heavy outer rim and the awakened line (over the bodies).
   */
  private total(ctx: CanvasRenderingContext2D, e: Event, layer = 'ally') {
    const S = this.spec!, g = S.gimmick.eclipseHalo, on = g.layers, { x, y, radius: R } = e.m, A = fadeA(S.halo[e.id].fade, e.age, e.life), D = A * (this.flash < 1 ? g.reducedFlash : 1);
    if (on.wash === layer) {
      this.circle(ctx, x, y, R);
      this.fill(ctx, g.wash.token, g.wash.alpha * D);
    }
    if (on.band === layer) {
      this.circle(ctx, x, y, R);
      this.circle(ctx, x, y, R * g.band.at, -Math.PI / 2, 1.5 * Math.PI, false);
      this.fill(ctx, g.band.token, g.band.alpha * D, 'evenodd');
    }
    if (on.outer === layer) {
      this.circle(ctx, x, y, R);
      this.stroke(ctx, g.outer, A);
    }
    if (on.inset === layer) {
      this.circle(ctx, x, y, R - S.awakened.inset);
      this.stroke(ctx, S.awakened.layers, A);
    }
  }

  /**
   * A P2 gimmick's echo blast or ring (API §14.11), on R = the event's radius: a stain's or a crack's burst (the crack's
   * paper lines first), a late dab's burst, the fear's torn band, the pollen's dashes and puff (pollenRings a screen), the
   * clap's echo; a cluster pot's split bursts as a plain cluster pot ring at its own radius; the rear hit is a stamp.
   */
  private event(ctx: CanvasRenderingContext2D, e: Event) {
    const S = this.spec!, g = p2(S, e.id), { x, y } = e.m, { age, st } = e;
    if (st === 'rear') return this.stamp(ctx, e.id, g.hit, -1, age, x, y - g.lift);
    if (st === 'pollen' && this.pollen-- <= 0) return;
    if (st === 'crack') this.cracks(ctx, g, e);
    this.ring(ctx, e, st === 'split' ? S.ring[e.id] : g.ring);
    const burst = st === 'pollen' ? g.puff : g.burst;
    if (burst) this.stamp(ctx, e.id, burst, -1, age, x, y);
  }

  /** The crack burst's paper lines growing out (grow; whole under reduced motion), the fork once three quarters out, at the ring's alpha. */
  private cracks(ctx: CanvasRenderingContext2D, g: P2Spec, e: Event) {
    const cs = g.cracks, rs = g.ring, A = fadeA(rs.fade, e.age, e.life, rs.grow, this.reduced), k = this.reduced ? 1 : lerp(cs.grow.from, 1, easeOut(clamp(e.age / cs.grow.seconds, 0, 1)));
    if (A <= 0.01) return;
    ctx.miterLimit = 4;
    for (const q of crackLines(e.m.radius, cs, e.m.seed ?? 1)) {
      this.poly(ctx, k < 1 ? cutAlong(q.pts, k) : q.pts, false, e.m.x, e.m.y);
      this.stroke(ctx, q.core ? cs.core.layers : cs.layers, A, 1, undefined, 0, 'miter');
      if (q.fork && k >= 0.75) {
        this.poly(ctx, q.fork, false, e.m.x, e.m.y);
        this.stroke(ctx, cs.layers, A, 1, undefined, 0, 'miter');
      }
    }
  }

  /**
   * An event stamp at (x, y), `age` into its event: a prog part by its own seconds (gone after them) unless `frame` is
   * given (≥ 0). Decoration (deco parts) is dropped at minimal detail, every other one at reduced, and past SPEC
   * caps.events a screen (a chain's stamps: past the frame's stamps); the bursts are the events' centre objects and
   * always drawn.
   */
  private stamp(ctx: CanvasRenderingContext2D, group: string, part: string, frame: number, age: number, x: number, y: number, angle = 0, flip = false, chain = false) {
    const P = this.part(group, part);
    if (!P || (frame < 0 && P.seconds && age >= P.seconds)) return;
    if (P.lod === 'deco' && (this.lod === 2 || (this.lod === 1 && this.deco++ % 2) || (chain ? this.left <= 0 : this.evs-- <= 0))) return;
    this.put(ctx, group, part, frame >= 0 ? frame : clamp(Math.floor((age / P.seconds!) * P.frames), 0, P.frames - 1), x, y, angle, flip);
  }

  /** A blast's ink spikes growing with R (API §7.3a): one path, filled once; drops once grown, at full detail only. */
  private splash(ctx: CanvasRenderingContext2D, e: Event) {
    const S = this.spec!, sp = S.splash[e.id], SH = S.splash.shape, u = clamp(e.age / e.life, 0, 1);
    let A = u > sp.fade.at ? clamp((1 - u) / (1 - sp.fade.at), 0, 1) : 1, g = 1;
    if (this.reduced) A *= clamp(e.age / SH.reducedIn, 0, 1);
    else g = sp.grow.from + (1 - sp.grow.from) * easeOut(clamp(e.age / sp.grow.seconds, 0, 1));
    const spikes = A > 0.01 ? splashKeep(splashGeo(S, sp, e.m.radius, e.m.seed ?? 1, e.aw), sp, this.lod) : [];
    if (!spikes.length) return false;
    const { x, y } = e.m;
    ctx.beginPath();
    for (const q of spikes) {
      this.poly(ctx, spikeOutline(S, q, g), true, x, y, false);
      if (q.drop && !this.lod && g >= 1) {
        const [cx, cy] = polar(q.drop.c, q.th, x, y), rx = SH.drop.stretch * q.drop.r;
        ctx.moveTo(cx + Math.cos(q.th) * rx, cy + Math.sin(q.th) * rx);
        ctx.ellipse(cx, cy, rx, q.drop.r, q.th, 0, TAU);
      }
    }
    this.fill(ctx, sp.token, A);
    return true;
  }

  /**
   * A strike's, nova's, or lob's ring at its event (kit drawRing): stroke, band, ripple, multi, or jag, then the awakened
   * line; or a gimmick's event ring (kit eventRing, API §14.11: gaps, cyan only on the core, × its alpha): stroke, band,
   * torn, dashed, or jag (the vertices on each arc between gaps, an open line each).
   */
  private ring(ctx: CanvasRenderingContext2D, e: Event, ring: RingSpec | EventRing) {
    const S = this.spec!, rs = ring as EventRing, { x, y, radius: R0 } = e.m, seed = e.m.seed ?? 1, { age, life, aw } = e, red = this.reduced;
    const R = grownR(R0, rs.grow, age, red), A = fadeA(rs.fade, age, life, rs.grow, red), pm = punchM(rs.punch, age, red), Ae = A * (rs.alpha ?? 1);
    if (A <= 0.01) return;
    const thick = (layers: Ls) => layers.map(([t, w, a]): Layer => [t, w * pm, a]);
    const arc = (r: number, [a0, a1]: P2, layers: Ls, alpha = A) => {
      this.circle(ctx, x, y, r, a0, a1);
      this.stroke(ctx, layers, alpha);
    };
    const arcs = arcsBetween(gapList(rs.gaps, seed)), core = rs.core ? clipToArcs(coreArc(S, rs.core, seed, aw), arcs) : [];
    if (rs.prim === 'stroke') {
      if (rs.wash && !rs.wash.union) {
        this.circle(ctx, x, y, R);
        this.fill(ctx, rs.wash.token, rs.wash.alpha * A);
      }
      if (rs.inner) arc(R * rs.inner.at, [0, TAU], thick(rs.inner.layers));
      for (const a of arcs) arc(R, a, thick(rs.layers));
      for (const a of core) arc(R, a, thick(rs.core!.layers));
    } else if (rs.prim === 'torn') {
      for (const q of tornRing(R, rs, seed, R0)) {
        this.poly(ctx, q.fill, true, x, y);
        this.fill(ctx, rs.token, Ae);
        this.poly(ctx, q.outer, false, x, y);
        this.stroke(ctx, rs.edge!, Ae);
        this.poly(ctx, q.rest, false, x, y);
        this.stroke(ctx, rs.tear.layers, Ae);
      }
    } else if (rs.prim === 'dashed') {
      // Each arc between gaps starts its dashes afresh; the layers are one same-phase sandwich, the ink dash `pad` longer
      // at both ends; an older data's core lays its cyan dashes over the ink ones on the core alone.
      const per = rs.dash[0] + rs.dash[1], p = rs.core?.pad ?? 0;
      for (const [a0, a1] of arcs) {
        this.circle(ctx, x, y, R, a0, a1);
        this.stroke(ctx, rs.layers, Ae, 1, rs.dash, rs.pad);
        for (const [c0, c1] of core) {
          if (c0 < a0 - 1e-6 || c1 > a1 + 1e-6) continue;
          this.circle(ctx, x, y, R, c0, c1);
          this.stroke(ctx, rs.core!.layers.slice(1), Ae, 1, [rs.dash[0] - 2 * p, rs.dash[1] + 2 * p], 0, 'round', (((((c0 - a0) * R - p) % per) + per) % per));
        }
      }
    } else if (rs.prim === 'band') {
      const B = bandGeo(rs, R, seed, R0, (aw && rs.awakened?.widthScale) || 1, (aw && rs.awakened?.fringeSides) || undefined);
      if (aw && rs.awakened?.inner) arc(R * rs.awakened.inner.at, [0, TAU], rs.awakened.inner.layers);
      for (const sg of B.segs) {
        const edge = (pts: P2[], layers: Ls) => {
          this.poly(ctx, pts, sg.closed, x, y);
          this.stroke(ctx, layers, A);
        };
        this.poly(ctx, sg.closed ? sg.outer : sg.outer.concat(sg.inner.slice().reverse()), true, x, y);
        if (sg.closed) this.poly(ctx, sg.inner, true, x, y, false);
        this.fill(ctx, rs.token, (rs.alpha ?? 1) * A, sg.closed ? 'evenodd' : 'nonzero');
        if (rs.edge) {
          edge(sg.outer, rs.edge);
          edge(sg.inner, sg.fringeIn ? rs.fringe!.layers : rs.edge);
        }
      }
      if (rs.core) {
        for (const [a0, a1] of bandCoreArcs(S, rs, B.arcs, seed, aw)) {
          const n = Math.max(4, Math.ceil(((a1 - a0) * R) / 6)), full = a1 - a0 >= TAU - 1e-3;
          const pts = Array.from({ length: full ? n : n + 1 }, (_, i) => {
            const th = lerp(a0, a1, i / n);
            return polar(rs.core!.at === 'outer' ? R + B.wf(th) / 2 : R, th, x, y);
          });
          this.poly(ctx, pts, full);
          this.stroke(ctx, rs.core.layers, A);
        }
      }
    } else if (rs.prim === 'jag') {
      // Built once at the full radius and scaled while it grows; it flickers between two seeds (the first under reduced motion).
      const g = jagGeo(rs, R0, rs.flicker.seeds[red ? 0 : Math.floor(this.time * rs.flicker.fps) % 2]), k = R / R0, at = (p: readonly P2[], close = false) => this.poly(ctx, p.map(([px, py]): P2 => [x + px * k, y + py * k]), close);
      ctx.miterLimit = 6;
      if (rs.gaps) {
        for (const [ivs, layers] of [[arcs, rs.layers], [core, rs.core?.layers]] as const) {
          for (const iv of ivs) {
            const run = jagRun(g.V, iv);
            if (run.length < 2) continue;
            at(run);
            this.stroke(ctx, layers!, Ae, 1, undefined, 0, 'miter');
          }
        }
        return;
      }
      at(g.V, true);
      if (rs.fade?.dash && age / life > rs.fade.at) this.stroke(ctx, [['ink', rs.layers[0][1] * 0.6]], A, 1, rs.fade.dash, 0, 'miter');
      else {
        this.stroke(ctx, rs.layers, A, 1, undefined, 0, 'miter');
        for (const f of g.forks) {
          at(f);
          this.stroke(ctx, [[rs.layers[0][0], rs.layers[0][1] * 0.6], [rs.layers[1][0], rs.layers[1][1] * 0.55]], A, 1, undefined, 0, 'miter');
        }
      }
    } else if (rs.prim === 'multi') {
      for (const q of rs.rings.concat(aw && rs.awakened?.ring ? [rs.awakened.ring] : [])) {
        if (age >= q.delay) arc(grownR(R0 * q.final, rs.grow, age - q.delay, red), [0, TAU], rs.layers, q.alpha * A);
      }
    } else {
      if (rs.full) arc(R, [0, TAU], thick(rs.full.layers));
      for (const q of rs.arcs) arc(R * q.at, [q.span[0] * RAD, q.span[1] * RAD], thick(q.layers));
      arc(R * rs.arcs[rs.core!.arc!].at, rippleCoreArc(S, rs, aw), thick(rs.core!.layers));
    }
    if (aw) arc(R - S.awakened.inset, [0, TAU], S.awakened.layers);
  }

  /** A halo round the hero's feet (kit DRAW.halo): the band's wash, the crescent, the inner and outer lines, the comet, or the rope. */
  private halo(ctx: CanvasRenderingContext2D, e: Event, hs: HaloSpec) {
    const S = this.spec!, { x, y, radius: R } = e.m, seed = e.m.seed ?? 1, { age, life, aw } = e, inner = this.data!.meta[e.id].geo.inner ?? 0;
    const A = fadeA(hs.fade, age, life), span = (aw && hs.awakened?.span) || hs.crescent?.span || hs.comet?.span || 0;
    if (hs.wash) {
      this.circle(ctx, x, y, R);
      if (inner > 0) this.circle(ctx, x, y, inner, -Math.PI / 2, 1.5 * Math.PI, false);
      this.fill(ctx, hs.wash.token, hs.wash.alpha * A, 'evenodd');
    }
    const cr = hs.crescent;
    if (cr) {
      const phi = sweepAngle(seed, cr.sweep, age, life, this.reduced), lune = (d: number, a: number, at: number) => {
        this.poly(ctx, crescentPts(R, d * (R - inner), at, span * RAD, cr.step), true, x, y);
        this.fill(ctx, cr.token, a * A);
      };
      lune(cr.thick, cr.alpha, phi);
      if (aw && hs.awakened?.opposite) lune(hs.awakened.opposite.thick, hs.awakened.opposite.alpha, phi + Math.PI);
    }
    if (hs.inner && inner > 0) {
      this.circle(ctx, x, y, inner);
      this.stroke(ctx, hs.inner.layers, A, 1, hs.inner.dash);
    }
    if (hs.outer) {
      for (const a of hs.outer.gaps ? arcsBetween(gapList(hs.outer.gaps, seed)) : [[-Math.PI / 2, 1.5 * Math.PI] as P2]) {
        this.circle(ctx, x, y, R, a[0], a[1]);
        this.stroke(ctx, hs.outer.layers, A);
      }
    }
    const cm = hs.comet;
    if (cm) {
      const g = cometGeo((inner + R) / 2, sweepAngle(seed, cm.sweep, age, life, this.reduced), span, lerp(cm.head[0], cm.head[1], jit(seed, 710)));
      ctx.translate(x, y);
      this.poly(ctx, g.cap.slice().reverse().concat(g.L, g.R.slice().reverse()), true);
      this.fill(ctx, cm.body, A);
      this.stroke(ctx, [cm.rim], A);
      const n = g.C.length - 1, c0 = Math.floor(cm.core.from * n);
      this.smooth(ctx, g.C.slice(c0, Math.max(c0 + 2, Math.floor(cm.core.to * n)) + 1), false);
      this.stroke(ctx, cm.core.layers, A);
      ctx.translate(-x, -y);
    }
    if (hs.rope) {
      // The rope as a whole springs out from grow.from of R.
      const g = ropeGeo(S, hs, R, seed, aw), k = grownR(R, hs.grow, age, this.reduced) / R, w = g.w;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(k, k);
      this.circle(ctx, 0, 0, R + w / 2);
      this.circle(ctx, 0, 0, R - w / 2, -Math.PI / 2, 1.5 * Math.PI, false);
      this.fill(ctx, hs.rope.body, A, 'evenodd');
      for (const r of [R + w / 2, R - w / 2]) {
        this.circle(ctx, 0, 0, r);
        this.stroke(ctx, [hs.rope.edge], A);
      }
      ctx.beginPath();
      for (const [p, q] of g.marks) {
        ctx.moveTo(p[0], p[1]);
        ctx.quadraticCurveTo((p[0] + q[0]) / 2 + (q[1] - p[1]) * 0.12, (p[1] + q[1]) / 2 - (q[0] - p[0]) * 0.12, q[0], q[1]);
      }
      this.stroke(ctx, hs.rope.twist.layers, A);
      this.circle(ctx, 0, 0, R + w / 2 + hs.core.gap, g.core[0], g.core[1]);
      this.stroke(ctx, hs.core.layers, A, 1, hs.core.dash, hs.core.pad);
      ctx.restore();
    } else if (aw) {
      this.circle(ctx, x, y, R - S.awakened.inset);
      this.stroke(ctx, S.awakened.layers, A);
    }
  }

  /** The hit capsule from x0 (footClear) to L, round at its far end (API §8.3 capsule). */
  private capsule(ctx: CanvasRenderingContext2D, c: LineSpec['capsule'], L: number, w: number, a: number, x0 = this.spec!.footClear) {
    if (L <= x0 + 2) return;
    ctx.beginPath();
    ctx.moveTo(x0, -w);
    ctx.lineTo(L, -w);
    ctx.arc(L, 0, w, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(x0, w);
    ctx.closePath();
    if (c.fill) this.fill(ctx, c.fill[0], c.fill[1] * a);
    if (c.edge) this.stroke(ctx, c.edge, a, 1, c.dash);
  }

  /**
   * A weapon's beam in its own frame (x from its start, +x along it; API §8.3): its line, then its stamps. The tracking
   * seals' edges are drawn as their triangle (drawSeals); an echo beam is the falling scroll unrolling.
   */
  drawBeam(ctx: CanvasRenderingContext2D, beam: Readonly<BeamEffect>) {
    const S = this.spec!, id = beam.skillId!, ls = S.line[id];
    if (beam.echo) {
      const st = this.gimmick(id);
      return st === 'unroll' ? this.unroll(ctx, beam) : st === 'branch' ? this.branch(ctx, beam) : this.resweep(ctx, beam);
    }
    if (!ls) return;
    const seed = this.seedOf(beam), aw = this.skills[id]?.awakened === true, x0 = S.footClear;
    const L = Math.hypot(beam.x2 - beam.x1, beam.y2 - beam.y1), w = beam.width, life = beam.maxLife, age = life - beam.life, A = fadeA(ls.fade, age, life);
    ctx.save();
    ctx.translate(beam.x1, beam.y1);
    ctx.rotate(Math.atan2(beam.y2 - beam.y1, beam.x2 - beam.x1));
    const line = (x1: number, y1: number, x2: number, y2: number, layers: Ls, a = A, q?: number) => this.segment(ctx, x1, y1, x2, y2, layers, a, q);
    if (ls.prim === 'blade') {
      this.lance = beam;
      this.blade(ctx, ls, bladeGeo(S, ls, L, age, life, aw), L, w, x0, aw);
    } else if (ls.prim === 'brushBand') {
      if (ls.capsule) this.capsule(ctx, ls.capsule, L, w, A);
      const x1 = bandHead(S, ls, L, age, life), hw = (x: number) => (ls.taper ? w * taperRatio(ls.taper, (x - x0) / (L - x0)) : w);
      if (x1 > x0 + 2) {
        const top = raggedEdge(x0, x1, hw, ls.edge.ragged, seed, 100, -1), bottom = raggedEdge(x0, x1, hw, ls.edge.ragged, seed, 200, 1);
        this.poly(ctx, top.concat(bottom.slice().reverse()), true);
        this.fill(ctx, ls.fill[0], ls.fill[1] * A);
        for (const edge of ls.edge.sides === 'both' ? [top, bottom] : [bottom]) {
          this.poly(ctx, edge);
          this.stroke(ctx, ls.edge.layers, A);
        }
        if (ls.streaks) for (const q of streakList(S, ls, x1, w, seed)) line(q.x0, q.y, q.x1, q.y + 0.6, ls.streaks.layers);
        if (ls.front) {
          // The front edge bulges forward: Q (x1 + 3, 0).
          ctx.beginPath();
          ctx.moveTo(x1 - 4, -hw(x1));
          ctx.quadraticCurveTo(x1 + 3, 0, x1 - 4, hw(x1));
          this.stroke(ctx, ls.front.layers, A);
        }
        const xa = ls.core && x0 + (L - x0) * (aw ? 1 - (1 - ls.core.from) * S.awakened.coreScale : ls.core.from);
        if (xa && x1 > xa + 2) line(xa, 0, x1 - 2, 0, ls.core.layers);
      }
    } else {
      this.capsule(ctx, ls.capsule, L, w, A);
      const n = aw ? ls.awakened!.after : ls.after.n, k = 1 - clamp(age / ls.after.seconds, 0, 1);
      for (let j = 0; k > 0 && j < n; j += 1) line(x0, 0, L, 0, ls.after.layers, A, 2 * ls.after.bow * ls.after.sign[j] * k);
      line(x0, 0, L, 0, ls.layers.map(([t, wd]): Layer => [t, wd * (aw ? ls.awakened!.widthScale : 1) * punchM(ls.punch, age, this.reduced)]));
    }
    this.place(ctx, id, layout(S, id, 'stroke', { R: 0, L, w, aw, seed, age, life, reduced: this.reduced }), 'ally', 0, 0, age, life, seed);
    ctx.restore();
  }

  /** A straight (with q: bowed) stroke in the current frame. */
  private segment(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, layers: Ls, a: number, q?: number) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    if (q === undefined) ctx.lineTo(x2, y2);
    else ctx.quadraticCurveTo((x1 + x2) / 2, q, x2, y2);
    this.stroke(ctx, layers, a);
  }

  /** A lance in its beam's frame from x0 (API §8.3 blade): its hit capsule, its shaft (and its awakened shadow), and its leaf head. */
  private blade(ctx: CanvasRenderingContext2D, ls: LineSpec, g: ReturnType<typeof bladeGeo>, L: number, w: number, x0: number, shadow: boolean) {
    this.capsule(ctx, ls.capsule, L, w, g.a, x0);
    if (g.xb > x0 + 1) {
      if (shadow) this.segment(ctx, x0, ls.awakened!.shadow.offset, g.xb, ls.awakened!.shadow.offset, ls.awakened!.shadow.layers, g.a);
      const [w0, w1] = ls.shaft.width;
      this.poly(ctx, [[x0, -w0 / 2], [g.xb + 1, -w1 / 2], [g.xb + 1, w1 / 2], [x0, w0 / 2]], true);
      this.fill(ctx, ls.shaft.token, g.a);
      this.segment(ctx, x0 + 2, -0.9, g.xb - 2, -0.7, [ls.shaft.grain], g.a);
    }
    this.smooth(ctx, g.head, true);
    this.fill(ctx, ls.head.fill, g.a);
    this.stroke(ctx, [ls.head.edge], g.a);
    this.segment(ctx, g.xb + 3, -0.3, g.tip - 5, -0.2, [['ink300', 0.8]], g.a);
  }

  /**
   * A lance's branch (API §14.11) in its beam's frame from the lance's tip: once the lance has thrust (thrust of its
   * life), the lance's blade without its tassel thrusts and draws back over what is left of the beam's life, its head ×
   * head, its capsule from 0; the fork at the lance's tip (deco) once for the pair, turned with the lance.
   */
  private branch(ctx: CanvasRenderingContext2D, beam: Readonly<BeamEffect>) {
    const S = this.spec!, id = beam.skillId!, g = p2(S, id), ls = S.line[id], life = beam.maxLife, delay = ls.thrust * life, v = life - beam.life - delay, lance = this.lance;
    if (v < 0) return;
    ctx.save();
    ctx.translate(beam.x1, beam.y1);
    ctx.rotate(Math.atan2(beam.y2 - beam.y1, beam.x2 - beam.x1));
    const L = Math.hypot(beam.x2 - beam.x1, beam.y2 - beam.y1), b = bladeGeo(S, ls, L, v, life - delay, this.skills[id]?.awakened === true, 4, g.head);
    if (b.a > 0.01) this.blade(ctx, ls, b, L, beam.width, 0, false);
    ctx.restore();
    if (lance && this.forked !== lance && Math.hypot(lance.x2 - beam.x1, lance.y2 - beam.y1) < 1) {
      this.forked = lance;
      this.stamp(ctx, id, g.fork, -1, v, beam.x1, beam.y1, Math.atan2(lance.y2 - lance.y1, lance.x2 - lance.x1));
    }
  }

  /**
   * The brush sweeping back (API §14.11): the same ragged band at alpha × alpha, its head running back from the far end
   * to the hero's clear over grow (edges and streaks by the beam's seed + seed), the brush mirrored on its head.
   */
  private resweep(ctx: CanvasRenderingContext2D, beam: Readonly<BeamEffect>) {
    const S = this.spec!, id = beam.skillId!, g = p2(S, id), ls = S.line[id], st = ls.streaks!, L = Math.hypot(beam.x2 - beam.x1, beam.y2 - beam.y1), w = beam.width, life = beam.maxLife, age = life - beam.life;
    const seed = this.seedOf(beam) + g.seed, A = fadeA(ls.fade, age, life) * g.alpha, x1 = L - (L - S.footClear) * easeOut(clamp(age / (ls.grow.frac * life), 0, 1)), span = L - x1;
    ctx.save();
    ctx.translate(beam.x1, beam.y1);
    ctx.rotate(Math.atan2(beam.y2 - beam.y1, beam.x2 - beam.x1));
    if (span > 2 && A > 0.01) {
      const top = raggedEdge(x1, L, () => w, ls.edge.ragged, seed, 100, -1), bottom = raggedEdge(x1, L, () => w, ls.edge.ragged, seed, 200, 1), n = st.n[0] + Math.floor(jit(seed, 300) * (st.n[1] - st.n[0] + 1));
      this.poly(ctx, top.concat(bottom.slice().reverse()), true);
      this.fill(ctx, ls.fill[0], ls.fill[1] * A);
      for (const edge of [top, bottom]) {
        this.poly(ctx, edge);
        this.stroke(ctx, ls.edge.layers, A);
      }
      for (let j = 0; j < n; j += 1) {
        const len = lerp(st.len[0], st.len[1], jit(seed, 320 + j)) * span, xa = L - len - jit(seed, 330 + j) * (span - len), y = (2 * jit(seed, 310 + j) - 1) * 0.7 * w;
        this.segment(ctx, xa, y, xa + len, y + 0.6, st.layers, A);
      }
      ctx.beginPath();
      ctx.moveTo(x1 + 4, -w);
      ctx.quadraticCurveTo(x1 - 3, 0, x1 + 4, w);
      this.stroke(ctx, ls.front!.layers, A);
    }
    const tip = S.layout[id]?.stroke?.[0], part = tip && ((this.skills[id]?.awakened && tip.awakened) || tip.parts)[0], P = part && this.part(id, part);
    if (P) this.put(ctx, id, part, clamp(Math.floor((age / life) * P.frames), 0, P.frames - 1), x1, 0, 0, true, A);
    ctx.restore();
  }

  /**
   * The falling scroll unrolling (API §14.4) in its beam's frame from where it landed: the paper band at ±w (the hit
   * width) with straight ink edges and the mountain ridge unrolls over grow, the rod across its head, the roller on it.
   */
  private unroll(ctx: CanvasRenderingContext2D, beam: Readonly<BeamEffect>) {
    const g = this.spec!.gimmick.fallingScroll, id = beam.skillId!, L = Math.hypot(beam.x2 - beam.x1, beam.y2 - beam.y1), w = beam.width;
    const age = beam.maxLife - beam.life, x1 = unrollHead(g, L, age, this.reduced), A = fadeA(g.fade, age, beam.maxLife), b = g.band;
    if (x1 < 2 || A <= 0.01) return;
    ctx.save();
    ctx.translate(beam.x1, beam.y1);
    ctx.rotate(Math.atan2(beam.y2 - beam.y1, beam.x2 - beam.x1));
    this.poly(ctx, [[0, -w], [x1, -w], [x1, w], [0, w]], true);
    this.fill(ctx, b.fill.token, b.fill.alpha * A);
    for (const side of [-w, w]) {
      this.poly(ctx, [[0, side], [x1, side]]);
      this.stroke(ctx, b.edge, A);
    }
    const ridge = ridgePts(L, w, b.ridge).filter((p) => p[0] <= x1 - 3);
    if (ridge.length > 1) {
      this.smooth(ctx, ridge, false);
      this.stroke(ctx, b.ridge.layers, A);
    }
    this.poly(ctx, [[x1, -w], [x1, w]]);
    this.stroke(ctx, b.head, A);
    const P = this.part(id, 'roller');
    if (P) this.put(ctx, id, 'roller', partFrame(P, age, beam.maxLife, 0, this.time, this.reduced, this.lod), x1, 0, 0, false, A);
    ctx.restore();
  }

  /**
   * The tracking seals' triangles (API §14.4) from their three edge beams (the engine lays them a to b, b to c, c to a):
   * pending (width 2), the threads sew the edges corner to corner and the corner prints come in; struck (width 8), the
   * heavy edges, the paper fill for its first moment, and the strike print at the centroid. Pending ones: SPEC caps.pending.
   */
  drawSeals(ctx: CanvasRenderingContext2D, beams: readonly Readonly<BeamEffect>[], view: Viewport) {
    const S = this.spec!, g = S.gimmick.trackingSeals, id = 'trackingSeals';
    if (this.gimmick(id) !== 'triangle') return;
    let pending = S.caps.pending[this.lod];
    ctx.save();
    for (let i = 0; i < beams.length; i += 1) {
      const tri = beams.slice(i, i + 3);
      if (tri[0].skillId !== id) continue;
      if (tri.length < 3 || tri.some((b) => b.skillId !== id || b.life !== tri[0].life || b.width !== tri[0].width)) continue;
      i += 2;
      const P = tri.map((b): P2 => [b.x1, b.y1]), age = tri[0].maxLife - tri[0].life, strike = tri[0].width > 2;
      if (!P.some(([x, y]) => circleVisible(view, x, y, 60)) || (!strike && pending-- <= 0)) continue;
      if (!strike) {
        const u = this.reduced ? 1 : clamp(age / tri[0].maxLife, 0, 1);
        P.forEach((p, k) => {
          const q = P[(k + 1) % 3], gk = clamp(3 * u - k, 0, 1);
          if (gk <= 0.01) return;
          this.poly(ctx, [p, [lerp(p[0], q[0], gk), lerp(p[1], q[1], gk)]]);
          this.stroke(ctx, g.pre.layers, 1, 1, g.pre.dash, g.pre.pad);
        });
        for (const [x, y] of P) this.put(ctx, id, 'sealCorner', Math.min(2, Math.floor(u * 3)), x, y);
        continue;
      }
      if (age < g.strike.fillSeconds) {
        this.poly(ctx, P, true);
        this.fill(ctx, g.strike.fill.token, g.strike.fill.alpha);
      }
      this.poly(ctx, P, true);
      this.stroke(ctx, g.strike.layers, fadeA(g.strike.fade, age, tri[0].maxLife));
      for (const [x, y] of P) this.put(ctx, id, 'sealCorner', 2, x, y);
      const Q = this.part(id, 'sealStrike');
      if (Q) this.put(ctx, id, 'sealStrike', partFrame(Q, age, tri[0].maxLife, 0, this.time, this.reduced, this.lod), (P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3);
    }
    ctx.restore();
  }

  /**
   * The gimmicks waiting to go off, and their moments (API §14.4, §14.11; RenderWorld pending; SPEC caps.pending), by
   * layer: 0, first in the hazards, a late dab swelling where its quill struck; 1, on the ground, the eighth seal's
   * shadow growing at the centre and the small pots' shadows; 2, over the bodies, the stitches running in from the seven
   * seals (decoration: every other one at reduced detail, none at minimal), the small pots on their way (lobMini, SPEC
   * caps.flights), and a topple, a bump, or a caltrop's snap (deco, caps.events).
   */
  drawPending(ctx: CanvasRenderingContext2D, pending: readonly Readonly<ArsenalPending>[], view: Viewport, layer: 0 | 1 | 2) {
    const S = this.spec!, g8 = S.gimmick.seventhSeal;
    let left = S.caps.pending[this.lod], flights = S.caps.flights[this.lod];
    ctx.save();
    for (const p of pending) {
      const st = this.gimmick(p.id), age = this.time - p.born, u = clamp(age / p.delay, 0, 1), g = p2(S, p.id);
      if (!st || !circleVisible(view, p.x, p.y, 220) || ((st === 'eighth' || st === 'dab') && left-- <= 0)) continue;
      if (st === 'dab') {
        const P = layer === 0 && this.part(p.id, g.dab);
        if (P) this.put(ctx, p.id, g.dab, clamp(Math.floor(u * P.frames), 0, P.frames - 1), p.x, p.y);
      } else if (st === 'split') {
        const P = this.part(p.id, g.mini), seed = this.seedOf(p);
        p.points.forEach((q, k) => {
          const L = layer && P && u < 1 && flights-- > 0 && lobPath(S, p.id, p.x, p.y, q.x, q.y, u, true);
          if (!L) return;
          if (layer === 1) {
            ctx.beginPath();
            ctx.ellipse(L.x, L.y, L.rx, L.ry, 0, 0, TAU);
            this.fill(ctx, S.flight.shadow.token, L.alpha);
          } else this.put(ctx, p.id, g.mini, flightFrame(P!, false, u, age, jit(seed, S.flight.phase + k), this.reduced, this.lod), L.x, L.y - L.h);
        });
      } else if (st === 'eighth') {
        if (layer === 1) {
          const rx = lerp(g8.shadow.rx[0], g8.shadow.rx[1], u);
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, rx, 0.42 * rx, 0, 0, TAU);
          this.fill(ctx, g8.shadow.token, lerp(g8.shadow.alpha[0], g8.shadow.alpha[1], u));
        } else if (layer === 2) {
          p.points.forEach((q, k) => {
            if (this.lod === 2 || (this.lod === 1 && k % 2)) return;
            this.poly(ctx, [[q.x, q.y], [p.x + (q.x - p.x) * (1 - u), p.y + (q.y - p.y) * (1 - u)]]);
            this.stroke(ctx, g8.stitch.layers, 1, 1, g8.stitch.dash, g8.stitch.pad);
          });
        }
      } else if (layer === 2 && g.event) this.stamp(ctx, p.id, g.event, -1, age, p.x, p.y);
    }
    ctx.restore();
  }

  /** A weapon's ground zone spec when the kit draws its gimmick (delivery 3a). */
  zoneSpec(id: string) {
    return this.spec && this.data?.meta[id]?.done.gimmick ? zoneOf(this.spec, id) : undefined;
  }

  /**
   * Plans this frame's gimmick zones on screen (API §14.3, §14.8), nearest the hero first: their stamps (cached per
   * zone: their radius and cosmetic serial never change), minimal keeping the centre object alone, reduced every other
   * decoration, and the extras within SPEC caps.zoneStamps; the standing pieces go to the bodies (stands()).
   */
  planZones(zones: readonly Readonly<AwakeningZone>[], view: Viewport, hx: number, hy: number) {
    const S = this.spec!, plans = this.zonePlans;
    plans.length = 0;
    this.standList.length = 0;
    for (const z of zones) {
      const Z = this.zoneSpec(z.weapon);
      if (!Z || z.life <= 0 || !circleVisible(view, z.x, z.y, z.radius + 90)) continue;
      let p = this.zoneCache.get(z);
      if (!p) {
        const seed = this.seedOf(z);
        this.zoneCache.set(z, (p = { z, Z, age: 0, life: z.maxLife, A: 0, seed, items: glayout(S, z.weapon, Z.stage, { R: z.radius, L: 0, w: 0, aw: true, seed, age: 0, life: z.maxLife, reduced: false }), d: 0, keep: [] }));
      }
      p.age = z.maxLife - z.life;
      p.A = zoneFade(S, p.age, p.life);
      p.d = Math.hypot(z.x - hx, z.y - hy);
      p.keep.length = 0;
      plans.push(p);
    }
    plans.sort((a, b) => a.d - b.d);
    let left = S.caps.zoneStamps[this.lod];
    for (const p of plans) {
      let deco = 0;
      for (const it of p.items) {
        if (it.prim !== 'center') {
          if (this.lod === 2) continue;
          if ((this.part(p.z.weapon, it.part)?.lod === 'deco' || it.prio === 2) && (deco += 1) % 2 === 0 && this.lod === 1) continue;
          if (left <= 0) continue;
        }
        left -= 1;
        const P = it.z === 'stand' && this.part(p.z.weapon, it.part);
        if (!P) {
          p.keep.push(it);
          continue;
        }
        let stand = this.standCache.get(it);
        if (!stand) {
          const x = p.z.x + it.x, y = p.z.y + it.y;
          this.standCache.set(it, (stand = { p, it, x, y, left: x - P.anchor[0], top: y - P.anchor[1], right: x - P.anchor[0] + P.box[0], bottom: y - P.anchor[1] + P.box[1] }));
        }
        this.standList.push(stand);
      }
    }
  }

  /** The zones' standing pieces planned this frame (graves, pillars), for the bodies layer to sort in by their foot y. */
  stands(): readonly Stand[] {
    return this.standList;
  }

  /** One zone stamp: the centre object's start or end part (alpha 1) or its own frames, or a stamp at the zone's alpha. */
  private piece(ctx: CanvasRenderingContext2D, p: ZonePlan, it: Readonly<Item>, x: number, y: number) {
    if (it.prim !== 'center') {
      // The zone's other stamps: at its alpha, by their own drive (no end parts to look for).
      const P = this.part(p.z.weapon, it.part);
      if (P) this.put(ctx, p.z.weapon, it.part, partFrame(P, p.age, p.life, it.phase, this.time, this.reduced, this.lod), x, y, P.rotate === 'none' ? 0 : it.angle, it.flip, p.A);
      return;
    }
    const q = zonePiece(this.spec!, p.Z, it, p.age, p.life), P = this.part(p.z.weapon, q.part);
    if (!P) return;
    const frame = q.progress === null ? partFrame(P, p.age, p.life, it.phase, this.time, this.reduced, this.lod) : clamp(Math.floor(q.progress * P.frames), 0, P.frames - 1);
    this.put(ctx, p.z.weapon, q.part, frame, x, y, P.rotate === 'none' ? 0 : it.angle, it.flip, q.alpha);
  }

  /** A standing piece, in the bodies layer. */
  drawStand(ctx: CanvasRenderingContext2D, s: Stand) {
    this.piece(ctx, s.p, s.it, s.x, s.y);
  }

  /**
   * The zones' ground (API §14.3), first in the hazards layer: the floor (the meteor's crater), the wash and the tar's
   * gloss at the zone's alpha; the rims for the whole life (the sewn ally dashes, all in one path as each circle starts
   * its dashes afresh, or the meteor mark's solid rim, heavier with the hero inside); then the ground stamps.
   */
  drawZones(ctx: CanvasRenderingContext2D, hx: number, hy: number) {
    const S = this.spec!, plans = this.zonePlans;
    if (!plans.length) return;
    ctx.save();
    for (const { z, Z, A } of plans) {
      const R = z.radius;
      if (Z.floor) this.put(ctx, z.weapon, Z.floor, 0, z.x, z.y, 0, false, A);
      if (Z.wash) {
        this.circle(ctx, z.x, z.y, R);
        this.fill(ctx, Z.wash.token, Z.wash.alpha * A);
      }
      Z.gloss?.at.forEach((k, i) => {
        const a0 = (Z.gloss!.span[0] + 12 * i) * RAD;
        this.circle(ctx, z.x, z.y, R * k, a0, a0 + (Z.gloss!.span[1] - Z.gloss!.span[0]) * RAD);
        this.stroke(ctx, Z.gloss!.layers, A);
      });
      if (Z.rim === 'pad') {
        this.circle(ctx, z.x, z.y, R);
        this.stroke(ctx, Math.hypot(hx - z.x, hy - z.y) <= R ? S.rim.pad.inside : S.rim.pad.layers, 1);
      }
    }
    ctx.beginPath();
    let sewn = false;
    for (const { z, Z } of plans) {
      if (Z.rim !== 'ally') continue;
      this.circle(ctx, z.x, z.y, z.radius, -Math.PI / 2, 1.5 * Math.PI, false);
      sewn = true;
    }
    if (sewn) this.stroke(ctx, S.rim.ally.layers, 1, 1, S.rim.ally.dash, S.rim.ally.pad);
    for (const p of plans) for (const it of p.keep) if (it.z === 'ground') this.piece(ctx, p, it, p.z.x + it.x, p.z.y + it.y);
    ctx.restore();
  }

  /** The zones' pieces over the bodies, in the allyAttacks layer: the spin's turning arcs and blades, the meteor's motes. */
  drawZoneTops(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.zonePlans) {
      const { z, Z } = p;
      if (Z.arcs) {
        for (const [a0, a1] of spinArcs(Z, p.seed, p.age, this.reduced)) {
          this.circle(ctx, z.x, z.y, z.radius * Z.arcs.at, a0, a1);
          this.stroke(ctx, Z.arcs.layers, p.A);
        }
      }
      for (const it of p.keep) if (it.z === 'ally') this.piece(ctx, p, it, z.x + it.x, z.y + it.y);
    }
    ctx.restore();
  }

  /**
   * Plans the enemy overlays (API §14.5, §14.10), nearest the hero first: one feet overlay an enemy, the first of
   * priority.feet it has whose art is in (a freeze always, past the caps; a grave's bind, burning ink in an ink pots fire,
   * frost counted within its window, thorns: caps.feet), one head mark, the first of priority.heads it wears (the wander's
   * curl is decoration, so at minimal detail the next one shows: caps.heads), the pollen's spores (caps.spores, two an
   * enemy), a crow (caps.crows) with its peck (caps.events, none at minimal detail), and a boss's crack plate (never
   * dropped). Each enemy's overlays run on a clock offset by its cosmetic serial, so a crowd does not move in step.
   * Whether any enemy wears one.
   */
  planOverlays(bodies: readonly OverlayBody[], zones: readonly Readonly<AwakeningZone>[], hx: number, hy: number) {
    const S = this.spec!, t = this.time, over = this.over, O = S.overlay, F = O.feet, li = this.lod, pool = this.overPool, n = this.near, fires = n.fires;
    for (const o of over.values()) pool.push(o);
    over.clear();
    for (const list of [n.fd, n.fb, n.hd, n.hb, n.cd, n.cb, n.sd, n.sb, fires]) list.length = 0;
    const crows = this.done(O.crow.group), pollen = this.done(O.pollen.group), crack = this.done(O.crack.group), frozen: OverlayBody[] = [], bosses: OverlayBody[] = [], window = AWAKENINGS.frostNeedles.window;
    const heads = new Set(Object.keys(O.head.parts).filter((k) => this.done(O.head.parts[k].group)));
    const skip = li === 2 ? Object.keys(O.head.parts).find((k) => this.part(O.head.parts[k].group, O.head.parts[k].part)?.lod === 'deco') : undefined;
    if (this.zoneSpec(F.scorch.group)) for (const z of zones) if (z.weapon === F.scorch.group && z.life > 0) fires.push(z);
    // The feet keys whose art is in, by priority: [key, 1 burning ink / 2 frost (its count) / 0 a status until a time, count].
    const feetKeys = S.priority.feet.flatMap((key): [string, number, number][] => {
      const frost = key.startsWith('frost'), q = frost ? F.frost : F[key];
      return q && this.done(q.group) ? [[key, key === 'scorch' ? 1 : frost ? 2 : 0, frost ? +key.slice(5) : 0]] : [];
    });
    const feetOf = (e: Readonly<Entity>, m: Readonly<AwakenedMarks> | undefined) => {
      for (const [key, kind, count] of feetKeys) {
        if (kind === 1 ? fires.length > 0 && fires.some((z) => Math.hypot(e.x - z.x, e.y - z.y) <= z.radius + e.radius) : !!m && (kind === 2 ? (m.frost ?? 0) >= count && t - (m.frostAt ?? -1e9) <= window : ((m[key as 'bound'] as number | undefined) ?? 0) > t)) return key;
      }
      return null;
    };
    // The nearest `cap` of each kind (in order, ties first come), kept by insertion as the bodies go by: caps are small and crowds are not.
    const keep = (ds: number[], bs: OverlayBody[], cap: number, d: number, b: OverlayBody) => {
      let i = ds.length;
      if (i >= cap) {
        if (!cap || d >= ds[cap - 1]) return;
        i = cap - 1;
      } else {
        ds.push(d);
        bs.push(b);
      }
      for (; i > 0 && ds[i - 1] > d; i -= 1) {
        ds[i] = ds[i - 1];
        bs[i] = bs[i - 1];
      }
      ds[i] = d;
      bs[i] = b;
    };
    const capFeet = S.caps.feet[li];
    for (const b of bodies) {
      const e = b.enemy, m = e?.awk;
      if (!e || (!m && !fires.length)) continue;
      const d = (b.x - hx) ** 2 + (b.y - hy) ** 2, feet = feetOf(e, m);
      if (feet === 'freeze') frozen.push(b);
      else if (feet) keep(n.fd, n.fb, capFeet, d, b);
      if (!m) continue;
      const key = headMark(S, m, t, skip);
      if (key && heads.has(key)) keep(n.hd, n.hb, S.caps.heads[li], d, b);
      if (crows && (m.crow ?? 0) > t) keep(n.cd, n.cb, S.caps.crows[li], d, b);
      if (pollen && (m.pollen ?? 0) > t) keep(n.sd, n.sb, Math.floor(S.caps.spores[li] / S.marks.spores.slots), d, b);
      if (crack && e.isBoss && (m.crack ?? 0) > 0) bosses.push(b);
    }
    const get = (e: object) => {
      let o = over.get(e);
      if (o) return o;
      o = pool.pop() ?? { feet: null, head: null, crow: false, peck: -1, crack: 0, spores: false, t: Number.NaN };
      o.feet = o.head = null;
      o.crow = o.spores = false;
      o.peck = -1;
      o.crack = 0;
      o.t = Number.NaN;
      over.set(e, o);
      return o;
    };
    for (const b of frozen) get(b.enemy!).feet = 'freeze';
    n.fb.slice(0, Math.max(0, capFeet - frozen.length)).forEach((b) => (get(b.enemy!).feet = feetOf(b.enemy!, b.enemy!.awk)));
    for (const b of n.hb) get(b.enemy!).head = headMark(S, b.enemy!.awk, t, skip)!;
    for (const b of n.sb) get(b.enemy!).spores = true;
    for (const b of bosses) get(b.enemy!).crack = b.enemy!.awk!.crack!;
    for (const b of n.cb) {
      const o = get(b.enemy!), peck = t - (b.enemy!.awk?.peckAt ?? -1e9);
      o.crow = true;
      if (li < 2 && peck >= 0 && peck < S.marks.crow.dive && this.evs-- > 0) o.peck = peck;
    }
    return over.size > 0;
  }

  /** An enemy's overlay clock: the frame's, offset by a share of the crow's period from the enemy's cosmetic serial. */
  private clock(o: Over, e: object) {
    if (Number.isNaN(o.t)) o.t = this.time + this.spec!.marks.crow.period * jit(this.seedOf(e), 1970);
    return o.t;
  }

  /** What the kit draws on an enemy this frame (planOverlays), if anything. */
  overlayOf(enemy: object): Readonly<Over> | undefined {
    return this.over.get(enemy);
  }

  /** An enemy's feet overlay under its body (groundMarks): the freeze's ice and back crystals. */
  drawFeet(ctx: CanvasRenderingContext2D, b: OverlayBody, o = this.over.get(b.enemy!)) {
    const F = this.spec!.overlay.feet.freeze;
    if (o?.feet === 'freeze') this.put(ctx, F.group, F.back + sizeClass(b.enemy!.radius, F.r), 0, b.x, b.y);
  }

  /**
   * An enemy's feet overlay right after its body (API §14.10: in front, where the feet do not hide it), by the nearest
   * size class: the freeze's front crystals, a grave's bind, burning ink (8 fps, still under reduced motion), frost 1 or
   * 2, or thorns.
   */
  drawFront(ctx: CanvasRenderingContext2D, b: OverlayBody, o = this.over.get(b.enemy!)) {
    const f = o?.feet;
    if (!f) return;
    const F = this.spec!.overlay.feet, r = b.enemy!.radius, frost = f.startsWith('frost'), q = frost ? F.frost : F[f];
    const part = f === 'freeze' ? F.freeze.front + sizeClass(r, F.freeze.r) : q.part + (frost ? `${f.slice(5)}-` : '') + sizeClass(r, q.r), P = this.part(q.group, part);
    if (P) this.put(ctx, q.group, part, partFrame(P, 0, 1, 0, this.clock(o!, b.enemy!), this.reduced, this.lod === 2 ? 2 : 0), b.x, b.y);
  }

  /**
   * An enemy's overheads, `y` where its head mark sits (the sprite's top − 12, past its bar, elite mark, and stun): its
   * head mark (a stain by its count, the fear's drop mirrored with the enemy, the prey tag and the wander's curl on the
   * clock), a boss's crack plate (beside a head mark), the pollen's two spores rising, and the crow circling with its peck.
   */
  drawHead(ctx: CanvasRenderingContext2D, b: OverlayBody, y: number, o = this.over.get(b.enemy!)) {
    const S = this.spec!, O = S.overlay, e = b.enemy!;
    if (!o) return;
    const t = this.clock(o, e), top = y - O.head.dy;
    if (o.head) {
      const q = O.head.parts[o.head], part = q.part + (q.stack ? clamp(e.awk?.[o.head as 'stain'] ?? 1, q.stack[0], q.stack[1]) : ''), P = this.part(q.group, part);
      if (P) this.put(ctx, q.group, part, partFrame(P, 0, 1, 0, t, this.reduced, this.lod === 2 ? 2 : 0), b.x, y, 0, P.rotate === 'face' && (b.sprite?.facing ?? (e.vx < 0 ? -1 : 1)) < 0);
    }
    if (o.crack) {
      const q = O.crack;
      this.put(ctx, q.group, q.part + clamp(o.crack, q.stack[0], q.stack[1]), 0, b.x + (o.head ? q.beside : 0), top + q.dy);
    }
    if (o.spores) {
      const q = O.pollen, sp = S.marks.spores;
      q.parts.forEach((part, i) => {
        const P = this.part(q.group, part), [ax, ay] = q.at[i];
        if (!P) return;
        const u = this.reduced ? q.phase[i] : (((t / P.seconds! + q.phase[i]) % 1) + 1) % 1;
        this.put(ctx, q.group, part, Math.min(P.frames - 1, Math.floor(u * P.frames)), b.x + ax + (ax < 0 ? -1 : 1) * sp.drift * u, top + ay - sp.rise * u);
      });
    }
    if (!o.crow) return;
    const c = crowAt(S, t, top, o.peck, this.reduced), P = this.part(O.crow.group, O.crow.part);
    if (P) this.put(ctx, O.crow.group, O.crow.part, this.reduced ? P.still ?? 0 : Math.floor(t * P.fps) % P.frames, b.x + c.x, c.y, 0, c.flip);
    const K = this.part(O.crow.group, O.crow.peck);
    if (K && o.peck >= 0) this.put(ctx, O.crow.group, O.crow.peck, partFrame(K, o.peck, 1, 0, 0, false, 0), b.x + O.crow.dive.peck[0], top + O.crow.dive.peck[1]);
  }

  /**
   * A weapon's chain (API §8.3): its line drawn out along the jumps, the stamps at the points it has reached; or a
   * gimmick's (§14.11): a leap, a rewound thread, an amplifying storm thread (a link's flash is the links' own, drawLinks).
   */
  drawChain(ctx: CanvasRenderingContext2D, chain: Readonly<ChainEffect>) {
    const S = this.spec!, id = chain.skillId, ls = S.line[id], life = chain.maxLife, age = life - chain.life, u = clamp(age / life, 0, 1), seed = this.seedOf(chain), st = this.gimmick(id);
    if (chain.echo || (chain.gimmick && st === 'amplify')) {
      if (st === 'link') return;
      ctx.save();
      if (st === 'leap') this.leap(ctx, chain, p2(S, id), age, life, u, seed);
      else if (st === 'rewind') this.rewind(ctx, chain, p2(S, id), age, life, u);
      else this.amplify(ctx, chain, p2(S, id), age, life, u, seed);
      ctx.restore();
      return;
    }
    const P = chain.points.map((p): P2 => [p.x, p.y]), A = fadeA(ls.fade, age, life), g = clamp(u / ls.grow.frac, 0, 1), red = this.reduced;
    const cut = (pts: P2[]) => {
      const q = clearStart(pts, S.footClear);
      return g < 1 ? cutAlong(q, g) : q;
    };
    ctx.save();
    if (ls.prim === 'sag') {
      this.poly(ctx, cut(sagCurves(P, ls.sag, ls.step).pts));
      if (ls.fade?.dash && u > ls.fade.at) this.stroke(ctx, [['ink', ls.layers[0][1] * 0.7]], A, 1, ls.fade.dash);
      else this.stroke(ctx, ls.layers, 1);
    } else if (ls.prim === 'twist') {
      const t = twistGeo(P, ls, ls.flicker.seeds[red ? 0 : Math.floor(this.time * ls.flicker.fps) % 2]);
      this.poly(ctx, cut(t.B));
      this.stroke(ctx, ls.strands[1], A);
      ctx.miterLimit = 5;
      this.poly(ctx, cut(t.A));
      this.stroke(ctx, ls.strands[0], A, 1, undefined, 0, 'miter');
    } else this.linked(ctx, P, ls, S.footClear, A, g);
    // A point's stamp shows once the growing line has reached it.
    const items = layout(S, id, 'jump', { R: 0, L: 0, w: 0, aw: this.skills[id]?.awakened === true, seed, age, life, reduced: red, points: chain.points });
    let reach = 0;
    const cum = P.map((p, i) => (reach += i ? Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) : 0));
    this.place(ctx, id, items.filter((it) => (it.index ?? 0) && cum[it.index!] <= g * reach + 0.5), 'ally', 0, 0, age, life, seed);
    ctx.restore();
  }

  /**
   * A chain's links (API §8.3 links) from `clear` on, the share g of them grown, rings and bars by turns, a cyan ring
   * mid-jump, a nub now and then; past the frame's links (SPEC caps.links, none at minimal detail) one bent line.
   */
  private linked(ctx: CanvasRenderingContext2D, P: P2[], ls: LineSpec, clear: number, A: number, g = 1) {
    const items = linksGeo(P, ls, clear), { ellipse: el, bar, nubs } = ls;
    ctx.miterLimit = 5;
    if (this.links < items.length) {
      this.poly(ctx, clearStart(P, clear));
      this.stroke(ctx, ls.minimal.layers, A, 1, undefined, 0, 'miter');
      return;
    }
    this.links -= items.length;
    for (const it of items.slice(0, Math.ceil(items.length * g))) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.angle);
      ctx.beginPath();
      if (it.ring) {
        ctx.ellipse(0, 0, el.rx, el.ry, 0, 0, TAU);
        this.stroke(ctx, it.core ? ls.core.layers : el.layers, A);
      } else {
        ctx.rect(-bar.len / 2, -bar.h / 2, bar.len, bar.h);
        this.fill(ctx, bar.fill, A);
        this.stroke(ctx, [bar.edge], A);
      }
      if (it.nub) {
        this.circle(ctx, 0, it.nub * (el.ry + nubs.r), nubs.r, 0);
        this.fill(ctx, nubs.fill, A);
        this.stroke(ctx, [nubs.edge], A);
      }
      ctx.restore();
    }
  }

  /** The leap (API §14.11): a kinked bolt between the two bodies (lift over their feet) drawn out over grow, flickering, and the strike where it lands (deco). */
  private leap(ctx: CanvasRenderingContext2D, chain: Readonly<ChainEffect>, g: P2Spec, age: number, life: number, u: number, seed: number) {
    const ls = g.line, [a, b] = chain.points, B: P2 = [b.x, b.y - g.lift], gr = clamp(u / ls.grow.frac, 0, 1);
    const pts = kinkPts([a.x, a.y - g.lift], B, ls, seed * 13 + ls.flicker.seeds[this.reduced ? 0 : Math.floor(this.time * ls.flicker.fps) % 2]);
    ctx.miterLimit = 5;
    this.poly(ctx, gr < 1 ? cutAlong(pts, gr) : pts);
    this.stroke(ctx, ls.layers, fadeA(ls.fade, age, life), 1, undefined, 0, 'miter');
    if (gr >= 1) this.stamp(ctx, chain.skillId, g.hit, u < 0.6 ? 0 : 1, age, B[0], B[1]);
  }

  /**
   * The thread rewound (API §14.11): the whole thread (hero first) bowed the other way, run from the last enemy back to
   * the hero's clear, dashing as it fades; a spark on each enemy it has reached by the straight share from the tail.
   */
  private rewind(ctx: CanvasRenderingContext2D, chain: Readonly<ChainEffect>, g: P2Spec, age: number, life: number, u: number) {
    const ls = g.line, P = (chain.thread ?? chain.points).map((p): P2 => [p.x, p.y]), gr = clamp(u / ls.grow.frac, 0, 1), pts = clearStart(sagCurves(P, ls.sag, ls.step).pts, this.spec!.footClear).reverse();
    this.poly(ctx, gr < 1 ? cutAlong(pts, gr) : pts);
    if (u > ls.fade!.at) this.stroke(ctx, [['ink', ls.layers[0][1] * 0.7]], fadeA(ls.fade, age, life), 1, ls.fade!.dash);
    else this.stroke(ctx, ls.layers, 1);
    const reach = gr * P.reduce((sum, p, i) => sum + (i ? Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) : 0), 0);
    for (let i = P.length - 1, cum = 0; i > 0 && cum <= reach + 0.5; cum += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]), i -= 1) this.stamp(ctx, chain.skillId, g.hit, u < 0.5 ? 0 : 1, age, P[i][0], P[i][1], 0, false, true);
  }

  /**
   * The storm thread amplifying (API §14.11): jump i's strands (1 + width·i) wide, its twist (1 + amp·i) deep, drawn out
   * jump by jump; the gust at each point reached, the big one from big.from on.
   */
  private amplify(ctx: CanvasRenderingContext2D, chain: Readonly<ChainEffect>, g: P2Spec, age: number, life: number, u: number, seed: number) {
    const S = this.spec!, id = chain.skillId, ls = S.line[id], P = chain.points.map((p): P2 => [p.x, p.y]), A = fadeA(ls.fade, age, life), fs = ls.flicker.seeds[this.reduced ? 0 : Math.floor(this.time * ls.flicker.fps) % 2], cum = [0];
    for (let i = 1; i < P.length; i += 1) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const reach = clamp(u / ls.grow.frac, 0, 1) * cum[cum.length - 1];
    ctx.miterLimit = 5;
    for (let i = 0; i + 1 < P.length && reach > cum[i]; i += 1) {
      const tw = twistGeo([P[i], P[i + 1]], { ...ls, amp: ls.amp * (1 + g.amp * i) }, fs + 31 * i), k = 1 + g.width * i, gr = clamp((reach - cum[i]) / (cum[i + 1] - cum[i]), 0, 1);
      const cut = (q: P2[]) => {
        const r = i ? q : clearStart(q, S.footClear);
        return gr < 1 ? cutAlong(r, gr) : r;
      };
      this.poly(ctx, cut(tw.B));
      this.stroke(ctx, thick(ls.strands[1], k), A);
      this.poly(ctx, cut(tw.A));
      this.stroke(ctx, thick(ls.strands[0], k), A, 1, undefined, 0, 'miter');
    }
    P.forEach((p, j) => {
      if (j && cum[j] <= reach + 0.5) this.stamp(ctx, id, j > g.big.from ? g.big.part : 'gust-a', u < 0.5 ? 0 : 1, age, p[0], p[1], 0, jit(seed, 649 + j) < 0.5, true);
    });
  }

  /**
   * The links of the frost chainlet's linked enemies (API §14.11, awk.link): between the living members in order, light
   * for the link's seconds (fading at its end), whole for share.seconds after they shared a hit; one bent line past the
   * frame's links (none at minimal detail).
   */
  drawLinks(ctx: CanvasRenderingContext2D, enemies: readonly Readonly<Entity>[]) {
    const S = this.spec!, id = 'frostChainlet', g = p2(S, id), seen = this.links2, t = this.time;
    if (this.gimmick(id) !== 'link') return;
    seen.clear();
    ctx.save();
    for (const e of enemies) {
      const k = e.awk?.link;
      if (!k || k.until <= t || seen.has(k)) continue;
      seen.add(k);
      const P = k.members.filter((m) => m.hp > 0).map((m): P2 => [m.x, m.y]), A = (t - (k.sharedAt ?? -1e9) < g.share.seconds ? g.share.alpha : g.line.alpha) * fadeA(g.fade, t - k.until + g.life, g.life);
      if (P.length > 1 && A > 0.01) this.linked(ctx, P, { ...S.line[id], pitch: g.line.pitch }, g.line.clear, A);
    }
    ctx.restore();
  }

  /**
   * The hero's haste (API §14.11) right after its body, standing at its feet (12 fps, half at reduced detail, still under
   * reduced motion and at minimal detail), mirrored with it, while it stands in a gimmick's haste ground (the meteor's mark).
   */
  drawHaste(ctx: CanvasRenderingContext2D, x: number, y: number, facing: number) {
    const p = this.zonePlans.find((q) => this.gimmick(q.z.weapon) === 'haste' && q.d <= q.z.radius), id = p?.z.weapon, part = id && p2(this.spec!, id).part, P = part && this.part(id, part);
    if (P) this.put(ctx, id, part, partFrame(P, 0, 1, 0, this.time, this.reduced, this.lod), x, y, 0, facing < 0);
  }

  /**
   * A shot the kit draws (API §14.11): an enemy shot an ink orbit turned back, a paper comet along its velocity
   * (deflect-start over its first moment, deflect-end over its last, deflect-travel looping between). Whether it drew it.
   */
  drawShot(ctx: CanvasRenderingContext2D, shot: Readonly<Projectile>, x: number, y: number) {
    const id = shot.skillId, g = this.spec && shot.echo && this.gimmick(id) === 'deflect' ? p2(this.spec, id) : undefined;
    if (!g) return false;
    const age = shot.maxLife - shot.life, end = this.part(id, g.end), start = this.part(id, g.start), angle = Math.atan2(shot.vy, shot.vx);
    if (end && shot.life < end.seconds!) this.put(ctx, id, g.end, clamp(Math.floor((1 - shot.life / end.seconds!) * end.frames), 0, end.frames - 1), x, y, angle);
    else if (start && age < start.seconds!) this.put(ctx, id, g.start, clamp(Math.floor((age / start.seconds!) * start.frames), 0, start.frames - 1), x, y, angle);
    else {
      const P = this.part(id, g.travel);
      if (P) this.put(ctx, id, g.travel, partFrame(P, age, shot.maxLife, jit(this.seedOf(shot), 1), this.time, this.reduced, this.lod), x, y, angle);
    }
    return true;
  }

  /** How much bigger a shot's stamp is drawn (API §14.11, the sun needles): its radius over its weapon's size, 1 to max; 1 for every other. */
  shotScale(id: string, radius: number, size: number) {
    const q = this.spec && p2(this.spec, id)?.scale;
    return q ? clamp(radius / size, 1, q.max) : 1;
  }

  /**
   * The ground marks layer: the ice a frost chain leaves under each enemy it reached (SPEC life decal, the nearest feet
   * cap), and the lobs' shadows (SPEC flight shadow, where enemy shot shadows go).
   */
  drawGround(ctx: CanvasRenderingContext2D, chains: readonly Readonly<ChainEffect>[], lobs: readonly Readonly<ArsenalLob>[], view: Viewport) {
    const S = this.spec!;
    for (const c of chains) {
      if (this.seen.has(c) || !this.handlesLine(c) || S.layout[c.skillId]?.jump?.[0]?.z !== 'feet') continue;
      this.seen.add(c);
      const at = this.time - (c.maxLife - c.life);
      for (const it of layout(S, c.skillId, 'jump', { R: 0, L: 0, w: 0, aw: false, seed: 1, age: 0, life: 1, reduced: false, points: c.points })) this.rimes.push({ x: it.x, y: it.y, part: it.part, at });
    }
    while (this.rimes.length && (this.time - this.rimes[0].at > (S.life.frostChainlet?.decal ?? 0) || this.rimes.length > 64)) this.rimes.shift();
    ctx.save();
    let feet = S.caps.feet[this.lod];
    for (const r of this.rimes) {
      if (feet <= 0 || !circleVisible(view, r.x, r.y, 40)) continue;
      feet -= 1;
      this.put(ctx, 'frostChainlet', r.part, 0, r.x, r.y, 0, false, this.decalAlpha('frostChainlet', this.time - r.at));
    }
    this.lobs(ctx, lobs, view, true);
    ctx.restore();
  }

  /** The lobs in the air layer (API §8.4): each lob's object over its shadow, turned along the path where it says so. */
  drawLobs(ctx: CanvasRenderingContext2D, lobs: readonly Readonly<ArsenalLob>[], view: Viewport) {
    ctx.save();
    this.lobs(ctx, lobs, view, false);
    ctx.restore();
  }

  private lobs(ctx: CanvasRenderingContext2D, lobs: readonly Readonly<ArsenalLob>[], view: Viewport, shadows: boolean) {
    const S = this.spec!, FL = S.flight;
    let left = S.caps.flights[this.lod];
    for (const lob of lobs) {
      const t = (this.time - lob.born) / lob.delay, L = this.data!.meta[lob.id]?.done.lob && t < 1 ? lobPath(S, lob.id, lob.x0, lob.y0, lob.x, lob.y, t) : null;
      if (!L || !segmentVisible(view, lob.x0, lob.y0, lob.x, lob.y, 240) || left <= 0) continue;
      left -= 1;
      if (shadows) {
        ctx.beginPath();
        ctx.ellipse(L.x, L.y, L.rx, L.ry, 0, 0, TAU);
        this.fill(ctx, FL.shadow.token, L.alpha);
        continue;
      }
      const f = FL[lob.id], parts = lob.awakened && f.awakened ? f.awakened : f.parts, part = f.by === 'index' ? parts[lob.k % parts.length] : parts[0], P = this.part(lob.id, part);
      if (!P) continue;
      // A cast's lobs share a seed from the moment it threw them (never a game id); each takes its own phase of the loop.
      const frame = flightFrame(P, f.frame === 'progress', t, t * lob.delay, jit(Math.round(lob.born * 60), FL.phase + lob.k), this.reduced, this.lod);
      this.put(ctx, lob.id, part, frame, L.x, L.y - L.h, P.rotate === 'path' ? L.angle + (f.turn ?? 0) * RAD : 0);
    }
  }
}
