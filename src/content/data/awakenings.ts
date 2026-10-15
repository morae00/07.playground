// Awakening gimmicks (SYS-16, awakeningGimmicks rule; user request 2026-10-15). Each of the 44 arsenal weapons, once
// awakened, does one thing of its own beside the common boost (arsenal.ts `awakening`); the design and the reasons are
// in docs/decisions/SYS-16-awakening-gimmicks.md. One row per weapon, read by GameEngine and printed on the awakening
// card (skill.<id>.awakeningGimmick, filled from the row by name).
// - `damage` is a share of the weapon's own awakened hit at its level (after the common boost); for sunNeedles and
//   stormThread it is the bonus share, for huntersMarks `prey` the extra damage a marked enemy takes from everything.
// - Times are seconds (`seconds` how long a mark, a push, or ground lasts, `delay` until it acts, `tick` between its
//   hits, `window` how long a count stays open); `radius`, `range`, `reach`, `length`, and `width` are world units
//   (`width` as the beams use it, out from the line); `area` and `branch` are shares of the weapon's own radius or
//   length; `times`, `push`, and `size` multiply; `cap` is how many of the ground pieces stand at once.
// - The card prints `damage`, `share`, `haste`, `growth`, `area`, `branch`, `weaken`, and `prey` as percents.
// Data, not code (TEC-05).
import type { ArsenalId } from '../../game/engine/worldTypes.ts';
import { deepFreeze } from '../deepFreeze.ts';

export default deepFreeze({
  // volley
  inkDarts: { stacks: 3, seconds: 4, radius: 70, damage: 1.2 },
  brushQuills: { delay: 0.6, radius: 50, damage: 0.6 },
  sealArrows: { seconds: 0.4, damage: 0.5, stun: 0.3 },
  frostNeedles: { hits: 3, window: 4, freeze: 1.2 },
  thunderNeedles: { range: 200, damage: 0.7 },
  twinBlades: { seconds: 0.5, radius: 60, tick: 0.1, damage: 0.3 },
  ghostVolley: { range: 600 },
  headsmanDarts: { radius: 160, seconds: 1 },
  // burst
  paperStorm: { turn: 2.4 },
  inkBloom: { seconds: 2, tick: 0.5, radius: 50 },
  thornHalo: { seconds: 2, step: 100, damage: 0.25 },
  starShards: { range: 260 },
  sunNeedles: { damage: 0.6, size: 1.6 },
  // spray
  inkDrizzle: {},
  pinHail: { seconds: 1.5, radius: 18, damage: 0.6, cap: 24 },
  // rear
  tailGuard: { reach: 200, arc: 70, times: 2 },
  smokeTail: { seconds: 2, radius: 70, wander: 1.5, cap: 12 },
  gravePins: { seconds: 3, radius: 22, root: 0.6, cap: 24 },
  // seeker
  trackingSeals: { seals: 3, delay: 0.6, damage: 1 },
  huntersMarks: { seconds: 4, prey: 0.25 },
  crowFeathers: { seconds: 1.5, tick: 0.5, damage: 0.2 },
  bossbane: { cracks: 5, radius: 90, damage: 3 },
  // strike
  inkLightning: { seconds: 1.2, radius: 40, stun: 0.4 },
  brushDownpour: { growth: 0.2 },
  fallingScroll: { length: 240, width: 50, damage: 0.5 },
  seventhSeal: { delay: 0.3, radius: 120, damage: 1.5 },
  // nova
  inkPulse: { push: 3, seconds: 0.5, stun: 0.8 },
  frostRing: { times: 2 },
  thunderclap: { delay: 0.5, reach: 1.4, damage: 0.5 },
  silenceBell: { seconds: 2 },
  // lob
  inkPots: { seconds: 2, area: 0.6, damage: 0.25, tick: 0.25 },
  clusterPots: { delay: 0.35, offset: 60, area: 0.6, damage: 0.5 },
  tarJar: { seconds: 1.5, pull: 140 },
  meteorBrush: { seconds: 4, area: 0.6, haste: 0.3 },
  // chain
  sparkThread: { damage: 0.6 },
  stormThread: { damage: 0.15 },
  frostChainlet: { seconds: 2, share: 0.3 },
  // beam
  inkLance: { angle: 35, branch: 0.4, damage: 0.6 },
  wideBrush: { delay: 0.3, damage: 0.5 },
  crossStrokes: { turn: 22.5 },
  judgmentLine: { bounty: 2 },
  // halo: a turned shot flies back `speed` times as fast, for `life` seconds
  inkOrbit: { speed: 2, life: 1.2 },
  wardRing: { seconds: 3, weaken: 0.3 },
  eclipseHalo: { every: 4, damage: 1.5 },
} satisfies Record<ArsenalId, Record<string, number>>);
