// Cosmetics (CON-07): the looks achievements unlock, or gold buys (a gold sink for finished builds). Data, not code
// (TEC-05). Each shows as the string cosmetic.<id>.
// - outline: a thin line round the hero in play. None of the five signal colours (V2): ally, hostile, warning,
//   reward, and elite stay readable.
// - trail: ink the hero leaves behind as it moves, in paper and ink tones only (V2).
// - frame: the HUD portrait's frame.
// - title: a line under the account level in the menu.
import { deepFreeze } from '../deepFreeze.ts';

export type CosmeticKind = 'outline' | 'trail' | 'frame' | 'title';
export type CosmeticDef = { kind: CosmeticKind; price: number; color?: string };

const cosmetics = {
  'outline-paper': { kind: 'outline', price: 4000, color: '#f4f4ef' },
  'outline-slate': { kind: 'outline', price: 12000, color: '#3c4f5c' },
  'outline-silver': { kind: 'outline', price: 6000, color: '#9ea3a8' },
  'outline-indigo': { kind: 'outline', price: 20000, color: '#2e3f73' },
  'outline-rust': { kind: 'outline', price: 15000, color: '#7c4a32' },
  'outline-moss': { kind: 'outline', price: 15000, color: '#5b6b3a' },
  'trail-dots': { kind: 'trail', price: 3000, color: '#151515' },
  'trail-chalk': { kind: 'trail', price: 9000, color: '#f4f4ef' },
  'trail-brush': { kind: 'trail', price: 6000, color: '#2b2b2b' },
  'trail-ash': { kind: 'trail', price: 8000, color: '#8d8d86' },
  'trail-thread': { kind: 'trail', price: 12000, color: '#3a3a3a' },
  'trail-paper': { kind: 'trail', price: 10000, color: '#e7e3d6' },
  'frame-seal': { kind: 'frame', price: 30000 },
  'frame-double': { kind: 'frame', price: 12000 },
  'frame-ink-gold': { kind: 'frame', price: 40000 },
  'frame-brush': { kind: 'frame', price: 15000 },
  'frame-knot': { kind: 'frame', price: 8000 },
  'frame-dashed': { kind: 'frame', price: 6000 },
  'title-scribe': { kind: 'title', price: 1000 },
  'title-alley': { kind: 'title', price: 3000 },
  'title-chapel': { kind: 'title', price: 6000 },
  'title-canal': { kind: 'title', price: 9000 },
  'title-clock': { kind: 'title', price: 12000 },
  'title-eclipse': { kind: 'title', price: 15000 },
  'title-stars': { kind: 'title', price: 8000 },
  'title-hunter': { kind: 'title', price: 12000 },
  'title-flawless': { kind: 'title', price: 25000 },
  'title-codex': { kind: 'title', price: 25000 },
  'title-endless': { kind: 'title', price: 15000 },
  'title-hundred': { kind: 'title', price: 10000 },
} satisfies Record<string, CosmeticDef>;

export type CosmeticId = keyof typeof cosmetics;

export default deepFreeze({ cosmetics: cosmetics as Record<CosmeticId, CosmeticDef> });
