// Elites (SYS-10, eliteAffixes rule): an ordinary enemy of any tier with one affix. Its radius, tier, and role stay
// the tier's (G9, V4, V6). It wears an elite purple outline and its affix's mark (V2 keeps purple for elites), and its
// health bar always shows. Data, not code (TEC-05); each affix shows as the string elite.<id>.
// - Elite beats (SYS-03) promote `beatChance` of their spawns; the elite hunt objective (CON-03) promotes
//   `objectiveChance` of every spawn. At most `maxAlive` elites are alive at once.
// - An elite has `hp` times the health and pays `xp` times the XP; a kill drops a coin chest worth `chest` times the
//   enemy's coins.
// - haste: moves `speed` times as fast. split: on death it splits into `children` of the next tier down (small stays
//   small) with `childHp` of their usual health. shield: a barrier worth `share` of its max health takes hits first
//   and comes back after `regenSeconds` without a hit. drain: enemies within `radius` regain `healShare` of their max
//   health a second.
import { deepFreeze } from '../deepFreeze.ts';

export type EliteAffix = 'haste' | 'split' | 'shield' | 'drain';

export default deepFreeze({
  beatChance: 0.12,
  objectiveChance: 0.06,
  maxAlive: 3,
  hp: 2.5,
  xp: 3,
  chest: 12,
  affixes: ['haste', 'split', 'shield', 'drain'] as EliteAffix[],
  haste: { speed: 1.5 },
  split: { children: 2, childHp: 0.5 },
  shield: { share: 0.6, regenSeconds: 4 },
  drain: { radius: 150, healShare: 0.04 },
});
