// Pure visual policy shared by simulation and presentation (no colours, no render imports; TEC-02).
export type TelegraphPhase = 'preview' | 'imminent' | 'active';
export type ImpactTier = 'light' | 'heavy' | 'critical';

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

export type ImpactClassification = 'classic' | 'budgeted';

/**
 * Impact tier for a hit. Classic (0.1.0) rules made every kill and every crit critical, which saturated
 * hit-stop late in a run. Budgeted rules (BUG-07) reserve critical for boss and elite kills and for hits
 * that remove at least 20% of the target's health; ordinary kills and small crits are heavy.
 */
export function classifyImpact(
  damage: number,
  maxHp: number,
  crit: boolean,
  killed: boolean,
  { classification = 'classic', notableTarget = false }: { classification?: ImpactClassification; notableTarget?: boolean } = {},
): ImpactTier {
  const ratio = maxHp > 0 ? Math.max(0, finiteOr(damage, 0)) / maxHp : 0;
  if (classification === 'classic') {
    if (killed || crit || ratio >= 0.2) return 'critical';
    if (ratio >= 0.08) return 'heavy';
    return 'light';
  }
  if (ratio >= 0.2 || (killed && notableTarget)) return 'critical';
  if (killed || crit || ratio >= 0.08) return 'heavy';
  return 'light';
}

/**
 * What the two accessibility settings change (UI-08). They are separate: reduced motion (the setting or the system
 * preference) stills movement, so pulses, rotation, bobbing, pose cycles, and pops stop; reduced flash dims what
 * flashes, so a struck body keeps its pose instead of turning negative and its white cut-out and the hurt glow draw
 * at half strength. Both keep the information (V5): a strike still reads, and a telegraph keeps its shape. Either one
 * stops the screen shake, as reduced flash did in 0.1.0.
 */
export function motionPolicy(reducedFlash: boolean, reducedMotion: boolean) {
  return {
    reduced: reducedMotion,
    pulse: !reducedMotion,
    invertFlash: !reducedFlash,
    rotateDanger: !reducedMotion,
    flashStrength: reducedFlash ? 0.5 : 1,
    /** A light that keeps changing (the low-health heartbeat glow) holds still under either. */
    beat: !reducedFlash && !reducedMotion,
    shake: !reducedFlash && !reducedMotion,
  };
}
