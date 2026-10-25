// Boss stage warm-up (CON-02, bossWarmup rule; user decision 2026-10-23). A boss stage put its boss and a boss stage's
// crowd on the field at once, while every stage starts at level 1: in 1-10 the team personas died about half a minute
// in at level 3 (0 of 30 clears at 216de64), and a 45 s spawn ramp with the boss already there cleared 2 of 30. Now a
// campaign boss stage first sends the crowd alone for its chapter's `seconds` (Ch1 first; 0 keeps the boss there from
// the start), at a spawn rate going in a straight line from `rate.from` to `rate.to` times the boss stage's. Then the
// boss enters and the stage clock, the enrage timer, starts as before. Data, not code (TEC-05).
// - Ch1: 60 s before the mid boss, 75 s before the final boss. 1-10 went from 0 to 5 of 30 team clears and the novice
//   from 1 to 3 of 10. A longer wait only adds time at the full crowd rate, and in 1-5 every second of it cost the
//   novice clears (7 of 10 without it, 6 at 60 s, 4 at 75 s), so the mid boss keeps the shortest wait.
// - Ch2-5: none. Their personas meet the boss after 5-9 drafts and the same 75 s raised Ch2's and Ch3's boss stages by
//   17 and 20 points; they are not walls (docs/QUALITY_GATES.md, CON-02 boss warm-up).
import { deepFreeze } from '../deepFreeze.ts';

export default deepFreeze({
  seconds: {
    midBoss: [60, 0, 0, 0, 0] as number[],
    finalBoss: [75, 0, 0, 0, 0] as number[],
  },
  rate: { from: 0.4, to: 1 },
});
