import { clamp } from '../worldMath.ts';
import type { VisualDetail } from './visualRegistry';

export type RenderFrameSnapshot = Readonly<{
  chapter: 1 | 2 | 3 | 4 | 5;
  elapsed: number;
  alpha: number;
  reducedMotion: boolean;
  detail: VisualDetail;
  aimAngle: number;
  moving: boolean;
  bossEnraged: boolean;
  enemyCount: number;
}>;

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Level of detail from the enemies on screen (FX-01). Reduced motion never lowers it: that option only drops
 * shake, pulses, and spinning decorations.
 */
export function visualDetailFor(visibleEnemies: number): VisualDetail {
  if (visibleEnemies >= 160) return 'minimal';
  if (visibleEnemies >= 80) return 'reduced';
  return 'full';
}

export function createRenderFrameSnapshot(input: {
  chapter: number;
  elapsed: number;
  alpha: number;
  reducedMotion: boolean;
  aimAngle: number;
  moving: boolean;
  bossEnraged: boolean;
  enemyCount: number;
}): RenderFrameSnapshot {
  const chapter = Math.min(5, Math.max(1, Math.round(finiteOr(input.chapter, 1)))) as 1 | 2 | 3 | 4 | 5;
  const enemyCount = Math.max(0, Math.floor(finiteOr(input.enemyCount, 0)));
  return Object.freeze({
    chapter,
    elapsed: Math.max(0, finiteOr(input.elapsed, 0)),
    alpha: clamp(finiteOr(input.alpha, 1), 0, 1),
    reducedMotion: Boolean(input.reducedMotion),
    detail: visualDetailFor(enemyCount),
    aimAngle: finiteOr(input.aimAngle, 0),
    moving: Boolean(input.moving),
    bossEnraged: Boolean(input.bossEnraged),
    enemyCount,
  });
}
