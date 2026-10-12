// Damage number glyphs (FX-07): each style's characters are drawn once into an offscreen canvas, then numbers are
// stamped glyph by glyph with drawImage instead of stroking text for every number every frame. Styles follow the
// kit (PN.vfx.damageNumber): dealt ink numerals with a paper outline, crit paper numerals on an ink tag, and taken
// coral numerals with an ink outline. The face is the kit's bold condensed stack, rendered from system fonts until
// an OFL face is bundled.
import { NEUTRAL, SIGNAL } from './palette.ts';

export type NumberStyle = 'dealt' | 'crit' | 'taken';

type StyleSpec = Readonly<{ size: number; fill: string; stroke: string | null; line: number }>;

const STYLES: Readonly<Record<NumberStyle, StyleSpec>> = {
  dealt: { size: 14, fill: NEUTRAL.ink, stroke: NEUTRAL.paperBright, line: 3.4 },
  crit: { size: 17, fill: NEUTRAL.paperBright, stroke: null, line: 0 },
  taken: { size: 15, fill: SIGNAL.hostile, stroke: NEUTRAL.ink, line: 3.6 },
};
const CHARS = '0123456789!−';
const FONT = '"Avenir Next Condensed", "DIN Condensed", "Arial Narrow", system-ui, sans-serif';
/** Glyph pixels per world unit: stays crisp at DPR 2 and 1.2x zoom. */
const SCALE = 3;
/** The kit's -8 degree italic skew. */
const SKEW = Math.tan((-8 * Math.PI) / 180);

type Cell = { x: number; width: number; advance: number };
type Sheet = { canvas: HTMLCanvasElement; cells: Map<string, Cell>; height: number; baseline: number };

export class NumberGlyphs {
  private readonly sheets = new Map<NumberStyle, Sheet | null>();

  /** Width of a string in world units at scale 1. */
  measure(text: string, style: NumberStyle) {
    const sheet = this.sheet(style);
    if (!sheet) return 0;
    let width = 0;
    for (const char of text) width += sheet.cells.get(char)?.advance ?? 0;
    return width / SCALE;
  }

  /** Stamps text centred on x with its baseline on y. False when no offscreen canvas is available (fall back). */
  draw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: NumberStyle, scale: number) {
    const sheet = this.sheet(style);
    if (!sheet) return false;
    const unit = scale / SCALE;
    let cursor = x - (this.measure(text, style) * scale) / 2;
    for (const char of text) {
      const cell = sheet.cells.get(char);
      if (!cell) continue;
      ctx.drawImage(sheet.canvas, cell.x, 0, cell.width, sheet.height, cursor - ((cell.width - cell.advance) / 2) * unit, y - sheet.baseline * unit, cell.width * unit, sheet.height * unit);
      cursor += cell.advance * unit;
    }
    return true;
  }

  private sheet(style: NumberStyle): Sheet | null {
    let sheet = this.sheets.get(style);
    if (sheet === undefined) {
      sheet = this.build(STYLES[style]);
      this.sheets.set(style, sheet);
    }
    return sheet;
  }

  private build(spec: StyleSpec): Sheet | null {
    const canvas = typeof document !== 'undefined' && typeof document.createElement === 'function' ? document.createElement('canvas') : null;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return null;
    const font = `800 ${spec.size * SCALE}px ${FONT}`;
    const pad = Math.ceil((spec.line + spec.size * 0.3) * SCALE);
    const height = Math.ceil(spec.size * 1.5 * SCALE) + pad * 2;
    const baseline = Math.ceil(spec.size * 1.1 * SCALE) + pad;
    context.font = font;
    const cells = new Map<string, Cell>();
    let x = 0;
    for (const char of CHARS) {
      const advance = context.measureText(char).width;
      const width = Math.ceil(advance) + pad * 2;
      cells.set(char, { x, width, advance });
      x += width;
    }
    canvas.width = Math.max(1, x);
    canvas.height = height;
    // Resizing resets the context, so the style is set after it.
    context.font = font;
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.lineJoin = 'round';
    context.fillStyle = spec.fill;
    context.strokeStyle = spec.stroke ?? spec.fill;
    context.lineWidth = spec.line * SCALE;
    for (const [char, cell] of cells) {
      context.setTransform(1, 0, SKEW, 1, cell.x + cell.width / 2 - SKEW * baseline, 0);
      if (spec.stroke) context.strokeText(char, 0, baseline);
      context.fillText(char, 0, baseline);
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    return { canvas, cells, height, baseline };
  }
}
