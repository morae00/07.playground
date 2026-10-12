// Bombers (SYS-14, bombers rule; user request 2026-10-12): ordinary small enemies that blow themselves up. Two kinds:
// - fuse: touching the player plants it. It stands still and a circle shows the blast's reach filling over
//   `seconds`; then everything in the circle is hit. Killing it first defuses it. The more common kind.
// - burst: faster, and it goes off the moment it touches, over a small reach.
// They replace some of the small contact spawns, from `campaign.share` by stage index (chapter x 10 + stage - 10, so
// 1-4 is 4 and 5-10 is 50; straight lines between the points, none before the first) or `infinite.share` by minute,
// with at most `maxAlive` of them alive, so the other roles keep the field. `fuseShare` of them are fuses. A bomber
// has `hp` times a small enemy's health (times the `hp` factor of the stage or minute, so later ones live to reach the
// player) and `speed` times its speed. Its blast deals `damage` times the contact damage a small enemy would deal
// there, as a non-physical hit that defence cuts less. A blast pays no XP or coins. In the infinite run a bomber also
// has at least `paceSeconds` of the pace the player fells bosses at (SYS-12), so a strong build cannot melt every
// bomber at the edge of the screen. Data, not code (TEC-05).
import { deepFreeze } from '../deepFreeze.ts';

export default deepFreeze({
  campaign: {
    share: [[4, 0.04], [20, 0.1], [50, 0.18]] as [number, number][],
    maxAlive: [[4, 4], [20, 10], [50, 18]] as [number, number][],
    hp: [[4, 1], [50, 1.6]] as [number, number][],
  },
  infinite: {
    share: [[1.5, 0], [2, 0.04], [10, 0.1], [25, 0.2]] as [number, number][],
    maxAlive: [[2, 4], [10, 12], [25, 28]] as [number, number][],
    hp: [[2, 1], [10, 2], [25, 3.5]] as [number, number][],
    paceSeconds: 0.5,
  },
  fuseShare: 0.7,
  fuse: { hp: 2.5, speed: 1.1, seconds: 1.15, radius: 100, damage: 5 },
  burst: { hp: 1.6, speed: 1.4, radius: 60, damage: 3 },
});
