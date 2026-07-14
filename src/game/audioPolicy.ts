import type { ImpactTier } from './visualContracts.ts';

export type ImpactCue = {
  frequency: number;
  duration: number;
  oscillator: OscillatorType;
  gain: number;
  cooldown: number;
};

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function impactCue(tier: ImpactTier, randomValue: number): ImpactCue {
  const random = Math.max(0, Math.min(0.999, finiteOr(randomValue, 0.5)));
  if (tier === 'critical') {
    return { frequency: 118 + random * 34, duration: 0.055, oscillator: 'sawtooth', gain: 1.35, cooldown: 0.055 };
  }
  if (tier === 'heavy') {
    return { frequency: 178 + random * 48, duration: 0.032, oscillator: 'triangle', gain: 1.1, cooldown: 0.044 };
  }
  return { frequency: 270 + random * 72, duration: 0.018, oscillator: 'square', gain: 0.72, cooldown: 0.035 };
}

export function toneGain(masterVolume: number, cueGain = 1) {
  const master = Math.max(0, Math.min(1, finiteOr(masterVolume, 0)));
  return Math.max(0.0001, master * 0.055 * Math.max(0, finiteOr(cueGain, 1)));
}
