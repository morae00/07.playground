// Single colour source for the canvas renderer and the CSS tokens (BUG-14, style bible §3).
// Signal colours carry combat meaning and belong to one side only:
//   ally (cyan) = the player and the player's skills, hostile (coral) = enemy damage,
//   warn (amber) = enemy telegraphs and control zones, reward (lime) = XP and healing, elite (violet) = elites and silence.
// Everything else on the battlefield uses low-saturation ink, paper, and chapter material colours.

export const SIGNAL = Object.freeze({
  ally: '#00a8c6',
  allyDeep: '#007c94',
  allyGlow: '#cff6ff',
  hostile: '#ef5b4f',
  hostileDeep: '#b8352b',
  hostileGlow: '#ffe4df',
  warn: '#d88d16',
  warnGlow: '#fff0c9',
  reward: '#86b82d',
  rewardGlow: '#dff5a5',
  elite: '#805ad5',
  eliteGlow: '#ddd1f5',
});

export const NEUTRAL = Object.freeze({
  paper: '#f4f4ef',
  paperBright: '#fffff8',
  paperShadow: '#d8dad3',
  gridLine: '#d7d7d2',
  ink: '#101312',
  inkSoft: '#343936',
  inkMuted: '#8c8579',
  coin: '#d8d0c0',
});

export type SignalFamily = 'ally' | 'hostile' | 'warn' | 'reward' | 'elite';

const FAMILY_HUES: Record<SignalFamily, number> = {
  ally: 189,
  hostile: 5,
  warn: 36,
  reward: 83,
  elite: 263,
};

function hexToHsl(hex: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new RangeError(`Expected #rrggbb colour, received ${hex}`);
  const value = Number.parseInt(match[1], 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { hue: 0, saturation: 0, lightness };
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  return { hue, saturation, lightness };
}

/**
 * Which signal family a colour reads as, or null for neutral colours. A colour counts as a signal when it
 * is saturated (> 0.3) and not near-white or near-black, and its hue lies within 25° of a signal hue.
 */
export function signalFamily(hex: string): SignalFamily | null {
  const { hue, saturation, lightness } = hexToHsl(hex);
  if (saturation <= 0.3 || lightness < 0.12 || lightness > 0.945) return null;
  let best: SignalFamily | null = null;
  let bestDistance = 26;
  for (const [family, familyHue] of Object.entries(FAMILY_HUES) as Array<[SignalFamily, number]>) {
    const distance = Math.min(Math.abs(hue - familyHue), 360 - Math.abs(hue - familyHue));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = family;
    }
  }
  return best;
}

export function rgba(hex: string, alpha: number) {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}
