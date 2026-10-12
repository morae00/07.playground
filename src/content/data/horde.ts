// The horde (SYS-13, horde rule; user request 2026-10-12: far more monsters on screen). The field holds `cap` times
// as many enemies (the infinite run at most `infiniteCapMax`) and they come `rate` times as fast. Each ordinary enemy
// has `hp` times the health, deals `damage` times the damage (twice the bodies should not mean twice the hits), and
// pays `xp` and `coin` times the XP and coins, carried over between kills so the averages are exact. Bosses and their rewards are not touched. A strong build empties the infinite run's field as
// fast as it fills, so after `fill.afterSeconds`, while the field holds under `fill.share` of its cap, each ordinary
// kill brings `fill.perKill` more enemies: the field refills as fast as the player clears it, and a build that clears
// slowly meets no more than before. Data, not code (TEC-05).
import { deepFreeze } from '../deepFreeze.ts';

export default deepFreeze({
  cap: 1.9,
  infiniteCapMax: 400,
  rate: 1.9,
  hp: 0.5,
  damage: 0.6,
  xp: 0.55,
  coin: 0.55,
  fill: { afterSeconds: 60, share: 0.35, perKill: 1 },
});
