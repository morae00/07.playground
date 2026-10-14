// Boss toughness (SYS-12, bossToughness rule): bosses fell in seconds. With a maxed build the infinite run's round
// bosses died in a median 2.8-3.7 s between minutes 5 and 20, and boss stages ended almost as they began. Data, not
// code (TEC-05).
// - campaign: boss stage bosses (round) take the `roundHp` and `roundDamage` factors of their chapter (Ch1 first) and
//   the field bosses of normal stages `fieldHp` and `fieldDamage`. Once the horde's hits and rewards were fixed
//   (SYS-13), the team personas still cleared boss stages more often than at the R4 baseline at 1.6 and 1.2, so the
//   later chapters' bosses take 2 and 1.5; at 2 and 1.5 in every chapter the Ch1 final boss stopped every team run
//   (0 of 30: a stage starts at level 1, and its shots killed at half a minute), so Ch1 keeps 1.6 and 1.2.
// - infinite: a round boss takes the `roundHp` factor of the minute it arrives (straight lines between the points,
//   flat after the last) and field bosses `fieldHp`; both deal `damage` times their damage. Neither can have less
//   health than `focus.seconds` of the pace the player felled the last bosses at (health per second of each fight,
//   each new fight weighing `blend`), times `fieldScale` for field bosses. So a strong build meets real fights and a
//   weaker one only the time factor; the first boss of a run has no pace yet. A boss pays its health over the
//   untoughened health in XP and coins (at most `rewardCap` times), so the run's levels keep their pace.
import { deepFreeze } from '../deepFreeze.ts';

export default deepFreeze({
  campaign: {
    roundHp: [1.6, 1.8, 2, 2, 2] as number[],
    roundDamage: [1.2, 1.35, 1.5, 1.5, 1.5] as number[],
    fieldHp: 2,
    fieldDamage: 1.15,
  },
  infinite: {
    roundHp: [[0, 1], [5, 1.2], [15, 1.4], [25, 1.5]] as [number, number][],
    fieldHp: 1.2,
    damage: 1.15,
    focus: { seconds: 25, fieldScale: 0.6, blend: 0.5 },
    rewardCap: 3,
  },
});
