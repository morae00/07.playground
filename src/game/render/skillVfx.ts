// Skill VFX painter (FX-06, FX-07): the kit's skill stamps (PN.skillVfx, baked into the `skills` pack) and its
// shapes (SPEC, baked into the atlas manifest as data), drawn on the canvas (API-skills-vfx §6-§8). Every number
// comes from the manifest, so the shapes follow the kit without code changes. Colours are SPEC token names resolved
// to the palette, and ally cyan always rides on ink (the sandwich, style bible §5.3).
import { loopFrame, type SkillVfxManifest, type SkillVfxPart, type SpriteAtlas } from './assets/spriteAtlas.ts';
import { SKILLS_PACK, slotEnabled } from './assets/slots.ts';
import { NEUTRAL, SIGNAL } from './palette.ts';

export type Token = 'ink' | 'ink700' | 'ink300' | 'p50' | 'paper' | 'p300' | 'ally' | 'allyD' | 'allyG';
type Layers = readonly (readonly [Token, number])[];
type Pair = readonly [number, number];

const TOKENS: Readonly<Record<Token, string>> = {
  ink: NEUTRAL.ink,
  ink700: NEUTRAL.inkSoft,
  ink300: NEUTRAL.inkMuted,
  p50: NEUTRAL.paperBright,
  paper: NEUTRAL.paper,
  p300: NEUTRAL.paperShadow,
  ally: SIGNAL.ally,
  allyD: SIGNAL.allyDeep,
  allyG: SIGNAL.allyGlow,
};
export const tokenColor = (token: Token) => TOKENS[token];

/** The kit's SPEC as baked into the manifest (API-skills-vfx §6). */
export type SkillSpec = Readonly<{
  stitch: Readonly<{ layers: Layers; dash: Pair }>;
  thread: Readonly<{ layers: Layers; seconds: number; fade: number }>;
  threadHeavy: Readonly<{ layers: Layers }>;
  fill: Readonly<{ token: Token; alpha: number }>;
  band: Readonly<{ frostLine: Readonly<{ edge: Layers; inner: readonly [Token, number, number] }>; railSpear: Readonly<{ edge: Layers }> }>;
  chalk: Readonly<{
    edge: Pair; step: number; fill: Token; line: readonly [Token, number]; core: readonly [Token, number]; grow: number;
    dust: Readonly<{ every: number; r: Pair; fill: Token; line: readonly [Token, number]; inset: number }>;
  }>;
  bolt: Readonly<{ layers: Layers; awakened: Layers; miter: number; seg: number; push: Pair; seeds: Pair; start: number; end: number; fade: Readonly<{ token: Token; dash: Pair }> }>;
  pulse: Readonly<{ rings: Layers; r: Pair; seconds: number; ease: number; alpha: Pair; delay: number; reducedR: number }>;
  aura: Readonly<{ stitchR: number; seconds: number; centerY: number }>;
}>;

export type SkillVfxRender = SkillVfxManifest['render'];

/** The kit's jitter (SPEC.jit): 0..1 from a seed and an index, the same hash the crit tag uses. */
export const jit = (seed: number, index: number) => ((Math.imul(seed * 31 + index, 2654435761) >>> 0) % 1000) / 1000;
const TAU = Math.PI * 2;
const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

/** A thread ring's alpha `age` seconds after it appears: full, then the last `fade` of its life fades out. */
export function threadAlpha(spec: SkillSpec, age: number) {
  const u = clamp01(age / spec.thread.seconds);
  return u <= 1 - spec.thread.fade ? 1 : clamp01((1 - u) / spec.thread.fade);
}

/** Stitch dashes scaled so a whole number of stitches runs round a circle of radius R (SPEC.stitch fit). */
export function stitchDash(spec: SkillSpec, radius: number, gapScale = 1): [number, number] {
  const [dash, gap] = spec.stitch.dash;
  const per = dash + gap * gapScale;
  const count = Math.max(3, Math.round((TAU * radius) / per));
  const k = (TAU * radius) / (count * per);
  return [dash * k, gap * gapScale * k];
}

/** The white chain's points pushed into small alternating kinks (SPEC.bolt): k parts per jump, ±(3 + 3·jit). */
export function boltPoints(spec: SkillSpec, points: readonly Readonly<{ x: number; y: number }>[], seed: number) {
  const { seg, push } = spec.bolt;
  const out = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const parts = Math.max(1, Math.round(length / seg));
    for (let j = 1; j < parts; j += 1) {
      const t = j / parts;
      const side = (j % 2 ? 1 : -1) * (push[0] + push[1] * jit(seed, i * 64 + j));
      out.push({ x: a.x + dx * t - (dy / length) * side, y: a.y + dy * t + (dx / length) * side });
    }
    out.push(b);
  }
  return out;
}

/** A polyline cut to its first `length` units. */
function cutPoints(points: readonly Readonly<{ x: number; y: number }>[], length: number) {
  const out = [points[0]];
  let left = length;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const step = Math.hypot(b.x - a.x, b.y - a.y);
    if (step >= left) {
      out.push({ x: a.x + ((b.x - a.x) * left) / step, y: a.y + ((b.y - a.y) * left) / step });
      return out;
    }
    out.push(b);
    left -= step;
  }
  return out;
}

const polylineLength = (points: readonly Readonly<{ x: number; y: number }>[]) => points.reduce((total, point, i) => (i ? total + Math.hypot(point.x - points[i - 1].x, point.y - points[i - 1].y) : 0), 0);

function capsule(ctx: CanvasRenderingContext2D, length: number, half: number) {
  ctx.beginPath();
  ctx.moveTo(0, -half);
  ctx.lineTo(length, -half);
  ctx.arc(length, 0, half, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(0, half);
  ctx.arc(0, 0, half, Math.PI / 2, (Math.PI * 3) / 2);
  ctx.closePath();
}

export class SkillVfxPainter {
  spec: SkillSpec | null = null;
  render: SkillVfxRender | null = null;
  private data: SkillVfxManifest | undefined;
  private atlas: SpriteAtlas | null = null;
  /** The frame's clock and settings: loops hold still under reduced motion; decoration drops at minimal detail. */
  private time = 0;
  reduced = false;
  private flashStrength = 1;
  minimal = false;

  /** Picks up the frame's settings; false while the skill art or its data is missing (callers keep their fallback). */
  begin(atlas: SpriteAtlas | null, time: number, reduced: boolean, flashStrength: number, minimal: boolean) {
    this.atlas = atlas;
    this.data = atlas?.status(SKILLS_PACK) === 'ready' && slotEnabled('skill') ? atlas.skillVfx() : undefined;
    this.spec = (this.data?.spec as SkillSpec | undefined) ?? null;
    this.render = this.data?.render ?? null;
    this.time = time;
    this.reduced = reduced;
    this.flashStrength = flashStrength;
    this.minimal = minimal;
    return this.spec !== null;
  }

  part(group: string, part: string): SkillVfxPart | undefined {
    return this.data?.parts[group]?.[part];
  }

  /**
   * Draws a stamp with its anchor on (x, y), turned by `angle` and mirrored by `facing`. `value` picks the frame:
   * progress 0..1 for a timed part, a frame number for an indexed one. Looping parts run on the clock (`phase` 0..1
   * staggers them) and hold their still frame under reduced motion or minimal detail. Decoration drops at minimal
   * detail, and a flash part is dimmed under reduced flash. False when the stamp is not drawn.
   */
  stamp(ctx: CanvasRenderingContext2D, group: string, name: string, x: number, y: number, angle = 0, value = 0, alpha = 1, facing: 1 | -1 = 1, phase = 0) {
    const part = this.part(group, name);
    const spec = part && this.atlas?.animation(`skill/${group}`, name);
    if (!part || !spec || (part.lod === 'deco' && this.minimal)) return false;
    let index = Math.round(value);
    if (part.drive === 'prog') index = Math.min(spec.frames - 1, Math.floor(clamp01(value) * spec.frames));
    else if (part.drive === 'loop') index = this.reduced || this.minimal ? (part.still ?? 0) : loopFrame(spec, this.time, phase);
    const frame = this.atlas?.frame(`skill/${group}/${name}/${index}`);
    if (!frame) return false;
    const unit = 1 / frame.scale;
    ctx.save();
    ctx.globalAlpha *= alpha * (part.flash ? this.flashStrength : 1);
    ctx.translate(x, y);
    if (angle) ctx.rotate(angle);
    if (facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(frame.image, frame.sx, frame.sy, frame.sw, frame.sh, -frame.ax * unit, -frame.ay * unit, frame.sw * unit, frame.sh * unit);
    ctx.restore();
    return true;
  }

  /**
   * Strokes the current path once per layer, bottom up. A dashed sandwich gives the ink layer dashes longer by `pad`
   * at each end, so the cyan dash on top never touches the ground.
   */
  layers(ctx: CanvasRenderingContext2D, layers: Layers, alpha = 1, dash?: Pair, pad = 0, cap: CanvasLineCap = dash ? 'butt' : 'round') {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.lineCap = cap;
    ctx.lineJoin = 'round';
    layers.forEach(([token, width], index) => {
      ctx.strokeStyle = TOKENS[token];
      ctx.lineWidth = width;
      if (dash) {
        const grow = index === 0 ? pad : 0;
        ctx.setLineDash([dash[0] + grow * 2, Math.max(0, dash[1] - grow * 2)]);
        ctx.lineDashOffset = grow;
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  /** A closed thread ring (or the heavy one) of a fixed size, fading by its age. */
  thread(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, age: number, heavy = false) {
    const spec = this.spec;
    if (!spec || radius <= 0) return;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    this.layers(ctx, (heavy ? spec.threadHeavy : spec.thread).layers, threadAlpha(spec, age));
  }

  /**
   * A running stitch on a circle, sewn clockwise from 12 o'clock up to `progress`; returns where its head is and the
   * way it faces, for the stitch-head stamp.
   */
  stitch(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, progress: number, alpha = 1, gapScale = 1) {
    const spec = this.spec;
    const end = -Math.PI / 2 + TAU * clamp01(progress);
    if (spec && progress > 0.001) {
      ctx.beginPath();
      ctx.arc(x, y, radius, -Math.PI / 2, end);
      this.layers(ctx, spec.stitch.layers, alpha, stitchDash(spec, radius, gapScale), 0, 'round');
    }
    return { x: x + Math.cos(end) * radius, y: y + Math.sin(end) * radius, angle: end + Math.PI / 2 };
  }

  /**
   * The chalk cut (SPEC.band frostLine + chalk) from (x1, y1) along `angle`: the hit band of half-width `half` at
   * once, the chalk core drawn out over the first `grow` of its life, the band and core fading over the last 35%.
   */
  chalkCut(ctx: CanvasRenderingContext2D, x1: number, y1: number, angle: number, length: number, half: number, life: number, maxLife: number, seed: number) {
    const spec = this.spec;
    if (!spec) return;
    const { chalk } = spec;
    const age = maxLife - life;
    const drawn = length * clamp01(age / (chalk.grow * maxLife));
    const fade = 1 - clamp01((age / maxLife - 0.65) / 0.35);
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    ctx.globalAlpha *= fade;
    capsule(ctx, length, half);
    ctx.fillStyle = TOKENS[spec.fill.token];
    ctx.save();
    ctx.globalAlpha *= spec.fill.alpha;
    ctx.fill();
    ctx.restore();
    const { edge, inner } = spec.band.frostLine;
    this.layers(ctx, edge);
    capsule(ctx, length, half - inner[2]);
    this.layers(ctx, [[inner[0], inner[1]]]);
    if (drawn >= 2) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let k = 0, x = 0; ; k += 1, x += chalk.step) {
        const at = Math.min(x, drawn);
        ctx.lineTo(at, -(chalk.edge[0] + chalk.edge[1] * jit(seed, k)));
        if (at >= drawn) break;
      }
      ctx.lineTo(drawn + 2, 0);
      for (let k = Math.ceil(drawn / chalk.step); k >= 0; k -= 1) ctx.lineTo(Math.min(k * chalk.step, drawn), chalk.edge[0] + chalk.edge[1] * jit(seed, k + 500));
      ctx.closePath();
      ctx.fillStyle = TOKENS[chalk.fill];
      ctx.fill();
      this.layers(ctx, [chalk.line]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(drawn, 0);
      this.layers(ctx, [chalk.core]);
    }
    ctx.restore();
    if (this.minimal || drawn < chalk.dust.every / 2) return;
    // Chalk dust (decoration) stays after the band has faded.
    const { dust } = chalk;
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    ctx.fillStyle = TOKENS[dust.fill];
    ctx.strokeStyle = TOKENS[dust.line[0]];
    ctx.lineWidth = dust.line[1];
    ctx.beginPath();
    for (let j = 0, x = dust.every / 2; x < drawn; j += 1, x += dust.every) {
      const r = dust.r[0] + (dust.r[1] - dust.r[0]) * jit(seed, j + 1300);
      const px = x + (jit(seed, j + 1700) - 0.5) * 6;
      const py = (2 * jit(seed, j + 900) - 1) * (half - dust.inset);
      ctx.moveTo(px + r, py);
      ctx.arc(px, py, r, 0, TAU);
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * The white chain's bolt (SPEC.bolt): drawn out along its length over the first `start` of its life, flickering
   * between two seeds (one under reduced motion), and leaving only ink dashes over the last `end`.
   */
  bolt(ctx: CanvasRenderingContext2D, points: readonly Readonly<{ x: number; y: number }>[], life: number, maxLife: number, awakened: boolean) {
    const spec = this.spec;
    if (!spec || points.length < 2) return;
    const { bolt } = spec;
    const flicker = this.reduced ? 0 : Math.floor(this.time * (this.render?.boltFps ?? 12)) % 2;
    let kinked = boltPoints(spec, points, bolt.seeds[flicker]);
    const u = 1 - life / maxLife;
    if (u < bolt.start) kinked = cutPoints(kinked, polylineLength(kinked) * (u / bolt.start));
    ctx.beginPath();
    kinked.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
    const layers = awakened ? bolt.awakened : bolt.layers;
    ctx.save();
    ctx.lineJoin = 'miter';
    ctx.miterLimit = bolt.miter;
    if (u > 1 - bolt.end) {
      ctx.strokeStyle = TOKENS[bolt.fade.token];
      ctx.lineWidth = layers[0][1];
      ctx.lineCap = 'butt';
      ctx.setLineDash([...bolt.fade.dash]);
      ctx.stroke();
    } else {
      layers.forEach(([token, width]) => {
        ctx.strokeStyle = TOKENS[token];
        ctx.lineWidth = width;
        ctx.stroke();
      });
    }
    ctx.restore();
  }

  /** The magnet's pulse rings `age` seconds in (SPEC.pulse); `rings` 1 draws the first ring only (the aura). */
  pulse(ctx: CanvasRenderingContext2D, x: number, y: number, age: number, rings = 2) {
    const spec = this.spec;
    if (!spec) return;
    const { pulse } = spec;
    for (let ring = 0; ring < rings; ring += 1) {
      const t = age - ring * pulse.delay;
      if (t < 0) continue;
      const u = clamp01(t / pulse.seconds);
      const radius = this.reduced ? pulse.reducedR : pulse.r[0] + (pulse.r[1] - pulse.r[0]) * (1 - (1 - u) ** pulse.ease);
      const alpha = pulse.alpha[0] + (pulse.alpha[1] - pulse.alpha[0]) * u;
      if (alpha <= 0.01) continue;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      this.layers(ctx, pulse.rings, alpha);
    }
  }
}
