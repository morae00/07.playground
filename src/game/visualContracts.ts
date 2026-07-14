export type ChapterMotif = 'orthogonal' | 'radial' | 'flow' | 'clock' | 'eclipse';
export type TelegraphPhase = 'preview' | 'imminent' | 'active';
export type ImpactTier = 'light' | 'heavy' | 'critical';

export const CHAPTER_VISUALS: Record<number, { motif: ChapterMotif; accent: string; label: string }> = {
  1: { motif: 'orthogonal', accent: '#6d6d68', label: '먹선 골목' },
  2: { motif: 'radial', accent: '#54545d', label: '철문 예배당' },
  3: { motif: 'flow', accent: '#477783', label: '무채 운하' },
  4: { motif: 'clock', accent: '#7a6745', label: '시계 무덤' },
  5: { motif: 'eclipse', accent: '#493d58', label: '일식 관문' },
};

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function telegraphPhase(remaining: number, duration: number, triggered = false): TelegraphPhase {
  if (triggered || remaining <= 0) return 'active';
  const safeDuration = Math.max(0.001, finiteOr(duration, 0.001));
  const progress = 1 - Math.max(0, finiteOr(remaining, safeDuration)) / safeDuration;
  return progress >= 0.65 ? 'imminent' : 'preview';
}

export function bossPhaseForHealth(hp: number, maxHp: number, previousPhase: 1 | 2 | 3 = 1): 1 | 2 | 3 {
  const ratio = maxHp > 0 && Number.isFinite(hp) && Number.isFinite(maxHp) ? hp / maxHp : 1;
  const calculated = ratio <= 0.33 ? 3 : ratio <= 0.66 ? 2 : 1;
  return Math.max(previousPhase, calculated) as 1 | 2 | 3;
}

export function classifyImpact(damage: number, maxHp: number, crit: boolean, killed: boolean): ImpactTier {
  const ratio = maxHp > 0 ? Math.max(0, finiteOr(damage, 0)) / maxHp : 0;
  if (killed || crit || ratio >= 0.2) return 'critical';
  if (ratio >= 0.08) return 'heavy';
  return 'light';
}

export function motionPolicy(reducedOption: boolean, systemReducedMotion: boolean) {
  const reduced = reducedOption || systemReducedMotion;
  return {
    reduced,
    pulse: !reduced,
    invertFlash: !reduced,
    rotateDanger: !reduced,
  };
}
