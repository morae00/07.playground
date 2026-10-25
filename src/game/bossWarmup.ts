// Boss stage warm-up (CON-02, bossWarmup rule): how long a campaign boss stage sends its crowd alone before the boss
// enters, and how fast that crowd comes meanwhile. The numbers are in src/content/data/bossWarmup.ts.
import type { StageKind } from '../content/campaign.ts';
import BOSS_WARMUP from '../content/data/bossWarmup.ts';

export type BossWarmupTable = typeof BOSS_WARMUP;

/** Seconds of crowd before the boss of a `kind` stage in `chapter` enters: 0 on normal stages and where none is set. */
export function bossWarmupSeconds(kind: StageKind, chapter: number, table: BossWarmupTable = BOSS_WARMUP) {
  if (kind === 'normal') return 0;
  const row = table.seconds[kind];
  return row[Math.min(Math.max(1, Math.floor(chapter)), row.length) - 1] ?? 0;
}

/** The share of the boss stage's spawn rate the crowd comes at with `left` of the warm-up's `total` seconds to go. */
export function bossWarmupRate(left: number, total: number, table: BossWarmupTable = BOSS_WARMUP) {
  if (left <= 0 || total <= 0) return 1;
  const done = Math.min(1, Math.max(0, 1 - left / total));
  return table.rate.from + (table.rate.to - table.rate.from) * done;
}
