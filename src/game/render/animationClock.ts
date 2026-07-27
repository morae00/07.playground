import { clamp } from '../worldMath.ts';

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function animationFrameAt(
  elapsed: number,
  framesPerSecond: number,
  frameCount: number,
  reducedMotion = false,
) {
  const safeCount = Math.max(1, Math.floor(finiteOr(frameCount, 1)));
  if (reducedMotion || safeCount === 1) return 0;
  const safeElapsed = Math.max(0, finiteOr(elapsed, 0));
  const safeRate = Math.max(0, finiteOr(framesPerSecond, 0));
  return Math.floor(safeElapsed * safeRate) % safeCount;
}

export function motionWave(
  elapsed: number,
  frequency: number,
  amplitude = 1,
  reducedMotion = false,
) {
  if (reducedMotion) return 0;
  const safeElapsed = Math.max(0, finiteOr(elapsed, 0));
  const safeFrequency = Math.max(0, finiteOr(frequency, 0));
  const safeAmplitude = Math.max(0, finiteOr(amplitude, 0));
  return Math.sin(safeElapsed * safeFrequency) * safeAmplitude;
}

export function normalizedLifetime(life: number, maxLife: number) {
  const safeMax = Math.max(0.001, finiteOr(maxLife, 0.001));
  return clamp(finiteOr(life, 0) / safeMax, 0, 1);
}
