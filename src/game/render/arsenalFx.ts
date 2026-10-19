// Weapon field effects painter (K10, FX-08): the kit's weapon stamps (PN.arsenalFx, baked into the `arsenal-fx` pack)
// and its shapes (SPEC, baked into the atlas manifest as data), drawn on the canvas (API-arsenal-fx §7-§9): the blasts
// of the strike, nova, and lob weapons, their decals, the chains, the beams, the halos, and the lobs in flight. The
// layout, the shapes' points, and the lob path are ports of the kit's (API §8), tested against the kit's own vectors in
// the manifest, so every number stays data. The awakening gimmicks (delivery 3) are not drawn here yet: their marks,
// lines, and blasts carry `echo` and keep the renderer's own drawing.
import type { ArsenalLob, BeamEffect, ChainEffect, SkillId, SkillMark, SkillState } from '../engine/worldTypes.ts';
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
type Core = Readonly<{ layers: Ls; span: N2; at?: string; dab?: boolean; arc?: number }>;
/** A blast ring (API §7.3). */
export type RingSpec = Readonly<{
  prim: 'stroke' | 'band' | 'ripple' | 'multi' | 'jag';
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
/** A layout descriptor (API §7.6). */
type Place = Readonly<{
  prim: string; parts: readonly string[]; awakened?: readonly string[]; z: string; pick?: number; flip?: number; by?: string; steps?: N2;
  count?: N2; awakenedCount?: N2; jitter?: number; skip?: number; dr?: number; inout?: boolean; info?: number; big?: number; offset?: number;
}>;
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
  caps: Readonly<Record<'stamps' | 'decals' | 'flights' | 'links' | 'splash' | 'feet', readonly number[]>>;
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
/** The ink lance: its tip thrusts out, then draws back fading; the leaf head's eleven points. */
export function bladeGeo(S: ArsenalFxSpec, ls: LineSpec, L: number, age: number, life: number, aw: boolean) {
  const u = clamp(age / life, 0, 1), hs = aw ? ls.awakened!.headScale : 1;
  let tip = u < ls.thrust ? lerp(S.footClear + 8, L, easeOut(u / ls.thrust)) : L, a = 1;
  if (u > ls.retract.at) {
    const v = (u - ls.retract.at) / (1 - ls.retract.at);
    tip = lerp(L, ls.retract.to * L, v);
    a = 1 - v;
  }
  const hl = ls.head.len * hs, hh = ls.head.half * hs, xb = tip - hl, side: P2[] = [[xb, 1.6], [xb + hl * 0.18, hh * 0.85], [xb + hl * 0.35, hh], [xb + hl * 0.62, hh * 0.62], [xb + hl * 0.86, hh * 0.22]];
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

/** A part's frame `age` into its event (kit frameFor): prog by its own seconds or the data's window (`life`); loop by the
 *  clock, half rate at reduced detail (li 1), held on its phase frame under reduced motion and at minimal detail (li 2). */
export function partFrame(P: Readonly<{ frames: number; drive: string; fps: number; seconds: number | null }>, age: number, life: number, phase: number, time: number, reduced: boolean, li: number) {
  const F = P.frames;
  if (P.drive === 'prog') return clamp(Math.floor((P.seconds ? age / P.seconds : age / life) * F), 0, F - 1);
  if (P.drive !== 'loop') return 0;
  if (reduced || li === 2) return Math.min(F - 1, Math.floor(phase * F));
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

export type Item = { part: string; x: number; y: number; angle: number; flip: boolean; phase: number; prio: number; z: string; index?: number };
/** What a layout reads: the radius or length and width, awakening, the event's seed, its age and life, and a chain's points. */
export type Shape = { R: number; L: number; w: number; aw: boolean; seed: number; age: number; life: number; reduced: boolean; points?: readonly Readonly<{ x: number; y: number; r?: number }>[] };
/** The stamps of a stage (API §8.2), ground first (SPEC.zorder), each group in descriptor order. */
export function layout(S: ArsenalFxSpec, id: string, stage: string, o: Shape): Item[] {
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

// ---- the painter ----

/** A ring mark the painter draws this frame: its age and life, and its layout. */
type Event = { m: Readonly<SkillMark>; id: string; age: number; life: number; aw: boolean; items: Item[] };
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
    this.left = this.spec?.caps.stamps[this.lod] ?? 0;
    this.links = this.spec?.caps.links[this.lod] ?? 0;
    return this.spec !== null;
  }

  /** How long a weapon's blast or sweep mark stays (its ring, then its decal), when the kit draws it; else undefined. */
  markSeconds(id: SkillId) {
    const life = this.spec && this.drawn(id) ? this.spec.life[id] : undefined;
    return life && Math.max(life.mark, life.decal ?? 0);
  }

  private drawn(id: string) {
    const meta = this.data?.meta[id];
    return !!meta?.done.fx && MARK_KINDS.has(meta.kind);
  }

  /** Whether the kit draws this ring mark (a weapon's own blast or sweep; a gimmick's echo and the total eclipse keep theirs). */
  handles(mark: Readonly<SkillMark>) {
    return this.spec !== null && mark.kind === 'ring' && !mark.echo && !mark.heavy && this.drawn(mark.skillId);
  }

  /** Whether the kit draws this beam or chain (a weapon's own; a gimmick's lines keep theirs). */
  handlesLine(line: Readonly<BeamEffect | ChainEffect>) {
    return this.spec !== null && !!line.skillId && !line.echo && !!this.data?.meta[line.skillId]?.done.fx && !!this.spec.line[line.skillId];
  }

  private seedOf(thing: object) {
    let seed = this.serials.get(thing);
    if (seed === undefined) this.serials.set(thing, (seed = this.serial += 1));
    return seed;
  }

  private part(group: string, part: string): ArsenalFxPart | undefined {
    return this.data?.parts[group]?.[part];
  }

  /** Draws a stamp with its anchor on (x, y), turned by `angle` and mirrored about the anchor; flash parts dim under reduced flash. */
  private put(ctx: CanvasRenderingContext2D, group: string, part: string, frame: number, x: number, y: number, angle = 0, flip = false, alpha = 1) {
    const f = this.atlas?.frame(`afx/${group}/${part}/${frame}`);
    if (!f || alpha <= 0.01) return;
    const u = 1 / f.scale;
    this.left -= 1;
    ctx.save();
    ctx.globalAlpha *= Math.min(1, alpha) * (this.part(group, part)?.flash ? this.flash : 1);
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
  private place(ctx: CanvasRenderingContext2D, id: string, items: readonly Item[], z: string, x: number, y: number, age: number, life: number, seed: number, mirror?: readonly string[], lift = 0) {
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
      this.put(ctx, id, it.part, fr, x + it.x, y + it.y - (P.place === 'head' ? lift : 0), angle, it.flip !== !!mirror?.includes(it.part), P.window === 'decal' ? this.decalAlpha(id, age) : 1);
    }
  }

  private decalAlpha(id: string, age: number) {
    const S = this.spec!, Ld = S.life[id].decal ?? 1, fa = S.decal.fadeAt;
    return age <= fa * Ld ? 1 : clamp(1 - (age - fa * Ld) / ((1 - fa) * Ld), 0, 1);
  }

  /** Strokes the current path once per layer, bottom up, `m` times as wide; dashed layers have butt ends, the ink one padded. */
  private stroke(ctx: CanvasRenderingContext2D, layers: Ls, alpha: number, m = 1, dash?: N2, pad = 0, join: CanvasLineJoin = 'round') {
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
        ctx.lineDashOffset = p;
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
      if (!this.handles(m) || !circleVisible(view, m.x, m.y, m.radius + 70)) continue;
      const id = m.skillId, age = m.maxLife - m.life, { mark: life, decal = 0 } = S.life[id], aw = this.skills[id]?.awakened === true;
      if (age < (decals ? decal : life)) out.push({ m, id, age, life, aw, items: layout(S, id, this.data!.meta[id].main, { R: m.radius, L: 0, w: 0, aw, seed: m.seed ?? 1, age, life, reduced: this.reduced }) });
    }
    return out;
  }

  /** Mirrors a lob's landing object when it came from the right (SPEC flight landMirror); unknown ways keep it as baked. */
  private mirror(e: Event) {
    const lm = this.spec!.flight[e.id]?.landMirror;
    return lm && lm.when === 'dx<0' && (e.m.dir ?? 0) < 0 ? lm.parts : undefined;
  }

  /** The ground layer: the decals of the blasts (newest first, SPEC caps.decals), under the bodies; none at minimal detail. */
  drawDecals(ctx: CanvasRenderingContext2D, marks: readonly Readonly<SkillMark>[], view: Viewport) {
    let left = this.spec!.caps.decals[this.lod];
    const events = this.collect(marks, view, true);
    ctx.save();
    for (let i = events.length - 1; i >= 0 && left > 0; i -= 1) {
      const e = events[i];
      if (!e.items.some((it) => it.z === 'ground')) continue;
      left -= 1;
      this.place(ctx, e.id, e.items, 'ground', e.m.x, e.m.y, e.age, e.life, e.m.seed ?? 1);
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
    for (const e of events) if (S.splash[e.id] && splashes > 0 && this.splash(ctx, e)) splashes -= 1;
    events.forEach((e, i) => {
      const rs = S.ring[e.id];
      if (rs?.wash?.union && events.findIndex((q) => q.id === e.id && q.m.life === e.m.life) === i) {
        // One cast's washes are one path filled once (nonzero), so overlapping seals do not stack their paper.
        ctx.beginPath();
        for (const q of events) if (q.id === e.id && q.m.life === e.m.life) this.circle(ctx, q.m.x, q.m.y, grownR(q.m.radius, rs.grow, q.age, this.reduced), 0, TAU, false);
        this.fill(ctx, rs.wash.token, rs.wash.alpha * fadeA(rs.fade, e.age, e.life, rs.grow, this.reduced));
      }
      if (rs) this.ring(ctx, e, rs);
      else this.halo(ctx, e, S.halo[e.id]);
    });
    events.sort((a, b) => a.m.y - b.m.y);
    for (const e of events) this.place(ctx, e.id, e.items, 'ally', e.m.x, e.m.y, e.age, e.life, e.m.seed ?? 1, this.mirror(e), lift ? S.headLift : 0);
    ctx.restore();
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

  /** A strike's, nova's, or lob's ring at its event (kit drawRing): stroke, band, ripple, multi, or jag, then the awakened line. */
  private ring(ctx: CanvasRenderingContext2D, e: Event, rs: RingSpec) {
    const S = this.spec!, { x, y, radius: R0 } = e.m, seed = e.m.seed ?? 1, { age, life, aw } = e, red = this.reduced;
    const R = grownR(R0, rs.grow, age, red), A = fadeA(rs.fade, age, life, rs.grow, red), pm = punchM(rs.punch, age, red);
    if (A <= 0.01) return;
    const thick = (layers: Ls) => layers.map(([t, w, a]): Layer => [t, w * pm, a]);
    const arc = (r: number, [a0, a1]: P2, layers: Ls, alpha = A) => {
      this.circle(ctx, x, y, r, a0, a1);
      this.stroke(ctx, layers, alpha);
    };
    if (rs.prim === 'stroke') {
      if (rs.wash && !rs.wash.union) {
        this.circle(ctx, x, y, R);
        this.fill(ctx, rs.wash.token, rs.wash.alpha * A);
      }
      if (rs.inner) arc(R * rs.inner.at, [0, TAU], thick(rs.inner.layers));
      const arcs = arcsBetween(gapList(rs.gaps, seed));
      for (const a of arcs) arc(R, a, thick(rs.layers));
      if (rs.core) for (const a of clipToArcs(coreArc(S, rs.core, seed, aw), arcs)) arc(R, a, thick(rs.core.layers));
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

  /** The hit capsule from footClear to L, round at its far end (API §8.3 capsule). */
  private capsule(ctx: CanvasRenderingContext2D, c: LineSpec['capsule'], L: number, w: number, a: number) {
    const x0 = this.spec!.footClear;
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

  /** A weapon's beam in its own frame (x from its start, +x along it; API §8.3): its line, then its stamps. */
  drawBeam(ctx: CanvasRenderingContext2D, beam: Readonly<BeamEffect>) {
    const S = this.spec!, id = beam.skillId!, ls = S.line[id], seed = this.seedOf(beam), aw = this.skills[id]?.awakened === true, x0 = S.footClear;
    const L = Math.hypot(beam.x2 - beam.x1, beam.y2 - beam.y1), w = beam.width, life = beam.maxLife, age = life - beam.life, A = fadeA(ls.fade, age, life);
    ctx.save();
    ctx.translate(beam.x1, beam.y1);
    ctx.rotate(Math.atan2(beam.y2 - beam.y1, beam.x2 - beam.x1));
    const line = (x1: number, y1: number, x2: number, y2: number, layers: Ls, a = A, q?: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      if (q === undefined) ctx.lineTo(x2, y2);
      else ctx.quadraticCurveTo((x1 + x2) / 2, q, x2, y2);
      this.stroke(ctx, layers, a);
    };
    if (ls.prim === 'blade') {
      const g = bladeGeo(S, ls, L, age, life, aw);
      this.capsule(ctx, ls.capsule, L, w, g.a);
      if (g.xb > x0 + 1) {
        if (aw) line(x0, ls.awakened!.shadow.offset, g.xb, ls.awakened!.shadow.offset, ls.awakened!.shadow.layers, g.a);
        const [w0, w1] = ls.shaft.width;
        this.poly(ctx, [[x0, -w0 / 2], [g.xb + 1, -w1 / 2], [g.xb + 1, w1 / 2], [x0, w0 / 2]], true);
        this.fill(ctx, ls.shaft.token, g.a);
        line(x0 + 2, -0.9, g.xb - 2, -0.7, [ls.shaft.grain], g.a);
      }
      this.smooth(ctx, g.head, true);
      this.fill(ctx, ls.head.fill, g.a);
      this.stroke(ctx, [ls.head.edge], g.a);
      line(g.xb + 3, -0.3, g.tip - 5, -0.2, [['ink300', 0.8]], g.a);
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

  /** A weapon's chain (API §8.3): its line drawn out along the jumps, the stamps at the points it has reached. */
  drawChain(ctx: CanvasRenderingContext2D, chain: Readonly<ChainEffect>) {
    const S = this.spec!, id = chain.skillId, ls = S.line[id], life = chain.maxLife, age = life - chain.life, u = clamp(age / life, 0, 1), seed = this.seedOf(chain);
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
    } else {
      const items = linksGeo(P, ls, S.footClear);
      if (this.links < items.length) {
        ctx.miterLimit = 5;
        this.poly(ctx, clearStart(P, S.footClear));
        this.stroke(ctx, ls.minimal.layers, A, 1, undefined, 0, 'miter');
      } else {
        this.links -= items.length;
        const { ellipse: el, bar, nubs } = ls;
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
    }
    // A point's stamp shows once the growing line has reached it.
    const items = layout(S, id, 'jump', { R: 0, L: 0, w: 0, aw: this.skills[id]?.awakened === true, seed, age, life, reduced: red, points: chain.points });
    let reach = 0;
    const cum = P.map((p, i) => (reach += i ? Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) : 0));
    this.place(ctx, id, items.filter((it) => (it.index ?? 0) && cum[it.index!] <= g * reach + 0.5), 'ally', 0, 0, age, life, seed);
    ctx.restore();
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
