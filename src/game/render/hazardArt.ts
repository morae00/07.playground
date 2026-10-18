// Terrain hazard painter (K11): the kit's hazard stamps (PN.hazards, baked into the `hazards` pack) and its shapes
// (SPEC, baked into the atlas manifest as data), drawn on the canvas (API-hazards §4, §8-§10). The fire layout is a
// port of the kit's (API §8.0-§8.5), tested against the kit's own vectors in the manifest, so the numbers stay data.
// Only the kinds in HAZARD_ART_KINDS draw here; the rest keep GameRenderer.drawHazard.
import type { Hazard } from '../engine/worldTypes.ts';
import type { HazardManifest, HazardPart, SpriteAtlas } from './assets/spriteAtlas.ts';
import { HAZARDS_PACK, HAZARD_ART_KINDS, slotEnabled } from './assets/slots.ts';
import { NEUTRAL, SIGNAL } from './palette.ts';
import { jit } from './skillVfx.ts';
import type { VisualDetail } from './visualRegistry.ts';
import { circleVisible, type Viewport } from './viewport.ts';

/** SPEC token names to the palette (API §7.1); the kinds switched on later add theirs. */
const TOKENS: Readonly<Record<string, string>> = { ink: NEUTRAL.ink, hostile: SIGNAL.hostile, hostileGlow: SIGNAL.hostileGlow };
export const hazardTokenColor = (token: string) => TOKENS[token];

type N2 = readonly [number, number];
type N3 = readonly [number, number, number];
/** A SPEC stroke row: [token, width, offset from r (inside −), alpha (1)]. */
type Row = readonly [string, number, number, number?];
type Range = Readonly<{ frac: number; pad?: number; cap?: number }>;

/** The parts of the kit's SPEC this painter reads (API-hazards §7.3). */
export type HazardSpec = Readonly<{
  fire: Readonly<{
    base: Readonly<{ token: string; alpha: number }>;
    rim: readonly Row[];
    size: Readonly<{ m: number }>;
    windows: Readonly<{ ignite: number; gutter: number }>;
    ignite: Readonly<{ flash: Readonly<{ layers: readonly Row[]; seconds: number }> }>;
    gutter: Readonly<{ coldCross: number }>;
    soot: Readonly<{ seconds: number; base: Readonly<{ token: string; alpha: number }>; caps: N3 }>;
    layout: Readonly<{
      cluster: Readonly<{ area: number; min: number; max: number; maxBig: number; big: number; minimal: number; tries: number; cand: number; reach: Range; gap: Range; far: number; squash: number; fallbackY: number; jit: Readonly<{ base: number; stride: number }> }>;
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
}>;

export type FireParts = Readonly<Record<string, HazardPart>>;
/** A layout item (API §8): placement, and its class (prio 0 body, 1 char, 2 rim ring) and order of placement (gen). */
export type FireItem = { part: string; x: number; y: number; flip: boolean; phase: number; z: 'ground' | 'flame'; prio: number; gen: number; ring?: number; rank?: number };
/** A fire's layout before the per-hazard cap, kept per hazard id; `lods` caches each level's capped output. */
export type FireLayout = { r: number; nc: number; nch: number; clusters: FireItem[]; ring: FireItem[]; chars: FireItem[]; lods: (FireItem[] | undefined)[]; counts: (N3 | undefined)[] };
export type Slot = Readonly<{ part: string; x: number; y: number; frame: number }>;

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const frac = (v: number) => v - Math.floor(v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** A slot `u` of the way through its cycle: its frame of the six. */
const slot = (part: string, x: number, y: number, u: number): Slot => ({ part, x, y, frame: Math.min(5, Math.floor(6 * u)) });
export const LODS: readonly VisualDetail[] = ['full', 'reduced', 'minimal'];

/** API §8.0-1, 'rise': the centre distance of a stamp rising toward angle a, inset from the rim by its half width. */
export function rimDist(r: number, a: number, box: N2, u: number, o: Readonly<{ min: number; pad: number; jitter: number }>) {
  return r - (Math.max(o.min, (box[0] - 6) / 2 * Math.abs(Math.cos(a)) + o.pad) + o.jitter * u);
}
const farOK = (r: number, x: number, y: number, tip: number, far: number) => !(y - tip < -Math.sqrt(Math.max(0, r * r - x * x)) - far);

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

/** API §8.1: a fire's body clusters (best-candidate scatter), rim ring, and char, before the LOD filters and the cap. */
export function layoutFire(spec: HazardSpec, parts: FireParts, r: number, seed: number): FireLayout {
  const L = spec.fire.layout;
  const J = (i: number) => jit(seed, i);
  const C = L.cluster;
  const size = r < spec.fire.size.m ? 'm' : 'l';
  const P = parts[`cluster-${size}-a`];
  const nc = clamp(Math.round((r * r) / C.area), C.min, r >= C.big ? C.maxBig : C.max);
  const reach = Math.max(C.reach.frac * r, r - C.reach.pad!);
  const gap = Math.min(C.gap.frac * r, C.gap.cap!);
  const clusters: FireItem[] = [];
  for (let k = 0; k < C.tries && clusters.length < nc; k += 1) {
    let best: { x: number; y: number; ix: number } | null = null;
    let bestS = -Infinity;
    for (let c = 0; c < C.cand; c += 1) {
      const ix = C.jit.base + (k * C.cand + c) * C.jit.stride;
      const a = TAU * J(ix), d = reach * Math.sqrt(J(ix + 1)), x = Math.cos(a) * d, y = Math.sin(a) * d;
      if (!farOK(r, x, y, P.anchor[1], C.far) || d > rimDist(r, a, P.box, 0, L.rim.inset)) continue;
      let s = -Math.hypot(x, y);
      if (clusters.length) {
        let dp = Infinity;
        for (const q of clusters) dp = Math.min(dp, Math.hypot(q.x - x, C.squash * (q.y - y)));
        if (dp < gap) continue;
        s = dp;
      }
      if (s > bestS) {
        bestS = s;
        best = { x, y, ix };
      }
    }
    if (best) clusters.push({ part: `cluster-${size}-${J(best.ix + 2) < 0.5 ? 'a' : 'b'}`, x: best.x, y: best.y, flip: J(best.ix + 3) < 0.5, phase: J(best.ix + 4), z: 'flame', prio: L.prio.cluster, gen: k });
  }
  if (!clusters.length) clusters.push({ part: `cluster-${size}-a`, x: 0, y: C.fallbackY * r, flip: false, phase: 0, z: 'flame', prio: L.prio.cluster, gen: 0 });
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
    if (d !== null) ring.push({ part, x: Math.cos(a) * d, y: Math.sin(a) * d, flip: J(i + G.jit.flip) < 0.5, phase: J(i + G.jit.phase), z: 'flame', prio: L.prio.rim, gen: 100 + i, ring: i });
  }
  const H = L.char;
  const nch = clamp(Math.round((r * r) / H.per), H.min, r >= H.big ? H.maxBig : H.max);
  const chars: FireItem[] = [];
  for (let k = 0; k < H.tries && chars.length < nch; k += 1) {
    const a = TAU * J(k + H.jit.angle), d = Math.max(0, r - H.inset) * Math.sqrt(J(k + H.jit.dist)), x = Math.cos(a) * d, y = Math.sin(a) * d;
    if (chars.some((q) => Math.hypot(q.x - x, q.y - y) < r * H.gap)) continue;
    chars.push({ part: `char-${'abcd'[Math.min(3, Math.floor(J(k + H.jit.variant) * 4))]}`, x, y, flip: J(k + H.jit.flip) < 0.5, phase: 0, z: 'ground', prio: L.prio.char, gen: 200 + k });
  }
  return { r, nc, nch, clusters, ring, chars, lods: [], counts: [] };
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
  const kept = capCut(bodies.concat(ring, chars), L.caps[li], L.cut.even, L.cut.keep).map((q) => ({ ...q }));
  const counts = [0, 0, 0];
  for (const q of kept.slice().sort((p, q) => p.gen - q.gen)) q.rank = counts[q.prio]++;
  const byY = (p: FireItem, q: FireItem) => p.y - q.y || p.gen - q.gen;
  const out = kept.filter((q) => q.z === 'ground').sort(byY).concat(kept.filter((q) => q.z === 'flame').sort(byY));
  layout.counts[li] = counts as unknown as N3;
  layout.lods[li] = out;
  return out;
}

/**
 * The screen cap on fire stamps (SPEC fire.caps, review 2 §8-4), by class: every fire keeps one body, then the other
 * bodies, then char, nearest fire first; the rim rings share what is left in proportion and are thinned evenly in each
 * fire. `counts` are [bodies, chars, rings] per fire, nearest first; returns the kept counts.
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

/** API §4.1: a fire's state and the progress through it; map fires (no end) always burn. `age` is the gutter's own age. */
export function fireState(spec: HazardSpec, hazard: Readonly<Pick<Hazard, 'life' | 'maxLife'>>) {
  const W = spec.fire.windows;
  const age = hazard.maxLife - hazard.life;
  if (Number.isFinite(hazard.maxLife) && age < W.ignite) return { state: 'ignite', p: age / W.ignite, age };
  if (Number.isFinite(hazard.maxLife) && hazard.life < W.gutter) return { state: 'gutter', p: 1 - hazard.life / W.gutter, age: W.gutter - hazard.life };
  return { state: 'burn', p: 0, age: 0 };
}

/** A fire seen last frame, and a gone one leaving soot (API §4.1 soot): where it stood and when it went out. */
type Seen = { x: number; y: number; r: number; life: number; tick: number };
type Soot = { id: number; x: number; y: number; r: number; at: number };
type Fire = { h: Readonly<Hazard>; items: FireItem[]; layout: FireLayout; state: string; p: number; age: number; keep: number[] | null; drop: Set<number> | null; bodies: FireItem[] };
/** A fire whose last seen life was this short went out (not cleared or carried away); it leaves soot. */
const SOOT_LIFE = 0.25;

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
  private readonly seen = new Map<number, Seen>();
  private readonly soots: Soot[] = [];
  private readonly fires: Fire[] = [];
  private readonly flames: { f: Fire; q: FireItem; y: number }[] = [];

  /** Picks up the frame's settings; false while the hazard art or its data is missing (callers keep their fallback). */
  begin(atlas: SpriteAtlas | null, time: number, reduced: boolean, flashStrength: number, detail: VisualDetail) {
    this.atlas = atlas;
    this.data = atlas?.status(HAZARDS_PACK) === 'ready' && slotEnabled('hazard') ? atlas.hazards() : undefined;
    this.spec = (this.data?.spec as HazardSpec | undefined) ?? null;
    if (time < this.time) {
      // A new run: its fires and ids are new.
      this.seen.clear();
      this.soots.length = 0;
      this.layouts.clear();
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

  /** A loop's frame (API §8.2): half rate at reduced detail, held on its phase frame at minimal detail or under reduced motion. */
  private loop(P: HazardPart, phase: number) {
    const F = P.frames;
    if (this.reduced || this.lod === 2) return Math.min(F - 1, Math.floor(phase * F));
    return ((Math.floor(this.time * (this.lod === 1 ? P.fps / 2 : P.fps) + phase * F) % F) + F) % F;
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

  /** SPEC stroke rows as circles round (x, y), bottom up. */
  private rows(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rows: readonly Row[], alpha = 1) {
    for (const [token, width, offset, a = 1] of rows) {
      ctx.globalAlpha = a * alpha;
      ctx.strokeStyle = TOKENS[token];
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(x, y, r + offset, 0, TAU);
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

  /** The soot of fires that went out, on the decal layer: a fading ink disc and cold char, the newest first up to the cap. */
  drawSoot(ctx: CanvasRenderingContext2D, view: Viewport) {
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
    ctx.restore();
  }

  /**
   * The visible fires (API §9): their discs, char, and rims first, then every flame of every fire by world y, then
   * embers and smoke, so fires that overlap (the fire lanes) read as one burning floor. Fires nearest (px, py) keep
   * their stamps first under the screen caps (SPEC fire.caps, render.fireStamps).
   */
  drawFires(ctx: CanvasRenderingContext2D, hazards: readonly Readonly<Hazard>[], px: number, py: number) {
    const spec = this.spec!;
    const F = spec.fire;
    const li = this.lod;
    const fires = this.fires;
    fires.length = 0;
    for (const h of hazards) {
      const layout = this.layout(h.id, h.radius);
      const { state, p, age } = fireState(spec, h);
      fires.push({ h, items: fireItems(spec, layout, li), layout, state, p, age, keep: null, drop: null, bodies: [] });
    }
    fires.sort((a, b) => Math.hypot(a.h.x - px, a.h.y - py) - Math.hypot(b.h.x - px, b.h.y - py));
    const cap = this.data!.render?.fireStamps?.[li] ?? F.caps.stamps[li];
    if (fires.reduce((sum, f) => sum + f.items.length, 0) > cap) {
      const keep = screenCut(fires.map((f) => f.layout.counts[li]!), cap);
      fires.forEach((f, index) => {
        f.keep = keep[index];
        const n = f.layout.counts[li]![2];
        const nd = n - f.keep[2];
        if (nd > 0) f.drop = new Set(Array.from({ length: nd }, (_, j) => Math.floor(((j + 0.5) * n) / nd)));
      });
    }
    const kept = (f: Fire, q: FireItem) => !f.keep || (q.prio === 2 ? !f.drop?.has(q.rank!) : q.rank! < f.keep[q.prio]);
    ctx.save();
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
        const frames = this.part('fire', part)?.frames ?? 1;
        this.stamp(ctx, 'fire', part, Math.min(frames - 1, Math.floor(f.p * frames)), f.h.x + q.x, f.h.y + q.y, q.flip);
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
    ctx.restore();
  }

  /** The hero's feet flames (API §9): `back` before the body, `front` after it, on the feet and mirrored by facing. */
  heroFlames(ctx: CanvasRenderingContext2D, layer: 'back' | 'front', x: number, y: number, facing: number, alpha = 1) {
    const P = this.part('hero', layer);
    if (P) this.stamp(ctx, 'hero', layer, this.loop(P, 0), x, y, facing < 0, alpha);
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
