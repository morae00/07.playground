// Encounter director (SYS-03): drives normal-stage spawns from the chapter's authored encounter grammar
// (src/content/encounters.ts). It only sets the spawn rate, spawn direction, formation bursts, the dynamic
// terrain count, and breather rewards. The tier mix (G9), field boss marks (G8), and stage kinds (G7) stay with
// the engine. Beat lengths come from the director's own seeded stream, so the schedule never moves other rolls.
import type { ChapterEncounterGrammar, EncounterBeat } from '../content/encounters.ts';

/** The opening ramps the spawn rate from 0.4x to 1.0x over the first 45 seconds of a stage. */
export const OPENING_RAMP_SECONDS = 45;
export const OPENING_RAMP_START = 0.4;
/** Enemies spawned during a breather drop this much more XP and coin. */
export const BREATHER_REWARD_SCALE = 1.5;
/** Surround beats release spawns in groups, one per edge. */
export const SURROUND_BURST = 4;

/** Spawn edges of the logical frame: 0 left (-x), 1 right (+x), 2 top (-y), 3 bottom (+y). */
export type SpawnEdge = 0 | 1 | 2 | 3;

export type BeatSegment = Readonly<{ index: number; start: number; end: number; beat: number }>;

/** Beats after the opening repeat in the authored order: pressure, breather, elite. */
const CYCLE_START = 1;

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

/**
 * Spawn-rate factor per beat: intensity divided by the duration-weighted mean intensity of one cycle, so a full
 * cycle spawns as much as before and only the rhythm changes. The opening itself is handled by the ramp.
 */
export function beatRateFactors(grammar: ChapterEncounterGrammar): number[] {
  const cycle = grammar.beats.slice(CYCLE_START);
  let weighted = 0;
  let total = 0;
  for (const beat of cycle) {
    const mid = (beat.durationSeconds[0] + beat.durationSeconds[1]) / 2;
    weighted += beat.intensity * mid;
    total += mid;
  }
  const mean = total > 0 ? weighted / total : 1;
  return grammar.beats.map((beat, index) => (index < CYCLE_START ? 1 : beat.intensity / mean));
}

/** The beat schedule for a stage: the opening once, then the cycle until the stage clock runs out. */
export function buildBeatSchedule(grammar: ChapterEncounterGrammar, stageSeconds: number, random: () => number): BeatSegment[] {
  const segments: BeatSegment[] = [];
  let start = 0;
  let beat = 0;
  const horizon = Math.max(stageSeconds, 1) + 60;
  while (start < horizon && segments.length < 400) {
    const [min, max] = grammar.beats[beat].durationSeconds;
    const end = start + lerp(min, max, random());
    segments.push({ index: segments.length, start, end, beat });
    start = end;
    beat = beat + 1 >= grammar.beats.length ? CYCLE_START : beat + 1;
  }
  return segments;
}

export class EncounterDirector {
  readonly grammar: ChapterEncounterGrammar;
  readonly schedule: readonly BeatSegment[];
  private readonly factors: readonly number[];
  private readonly random: () => number;
  private cursor = 0;

  constructor(grammar: ChapterEncounterGrammar, stageSeconds: number, random: () => number) {
    this.grammar = grammar;
    this.random = random;
    this.schedule = buildBeatSchedule(grammar, stageSeconds, random);
    this.factors = beatRateFactors(grammar);
  }

  /** The segment playing at stage time t (seconds since the stage started). */
  segmentAt(t: number): BeatSegment {
    const { schedule } = this;
    if (this.cursor >= schedule.length || schedule[this.cursor].start > t) this.cursor = 0;
    while (this.cursor < schedule.length - 1 && schedule[this.cursor].end <= t) this.cursor += 1;
    return schedule[this.cursor];
  }

  beatAt(t: number): EncounterBeat {
    return this.grammar.beats[this.segmentAt(t).beat];
  }

  /** Multiplier on the engine's spawn rate: the opening ramp times the beat's rhythm factor. */
  rateFactor(t: number) {
    const ramp = t >= OPENING_RAMP_SECONDS ? 1 : lerp(OPENING_RAMP_START, 1, Math.max(0, t) / OPENING_RAMP_SECONDS);
    return ramp * this.factors[this.segmentAt(t).beat];
  }

  rewardScale(t: number) {
    return this.beatAt(t).kind === 'breather' ? BREATHER_REWARD_SCALE : 1;
  }

  /** Spawns released at once: surround beats come from every edge together. */
  burstSize(t: number) {
    return this.beatAt(t).formation === 'surround' ? SURROUND_BURST : 1;
  }

  /** Concurrent boss-made terrain pieces (fire, slow, root, null) allowed during the beat. */
  terrainCap(t: number) {
    return 1 + 2 * this.beatAt(t).hazardBudget;
  }

  /**
   * Relative weights of the four spawn edges for the beat's formation, turned by the player's heading, then
   * biased by the chapter's movement axis. front: the edge the player runs toward; flank: the two side edges;
   * lane: the axis pair; ring and surround: every edge alike.
   */
  edgeWeights(t: number, heading: Readonly<{ x: number; y: number }>): [number, number, number, number] {
    const segment = this.segmentAt(t);
    const beat = this.grammar.beats[segment.beat];
    const weights: [number, number, number, number] = [1, 1, 1, 1];
    const horizontalHeading = Math.abs(heading.x) >= Math.abs(heading.y);
    const front: SpawnEdge = horizontalHeading ? (heading.x >= 0 ? 1 : 0) : heading.y >= 0 ? 3 : 2;
    const sides: readonly SpawnEdge[] = horizontalHeading ? [2, 3] : [0, 1];
    const axisPair = this.axisPair(t, segment);
    if (beat.formation === 'front') weights[front] += 3;
    else if (beat.formation === 'flank') for (const edge of sides) weights[edge] += 2;
    else if (beat.formation === 'lane') for (const edge of axisPair ?? [0, 1]) weights[edge] += 2;
    if (axisPair && beat.formation !== 'lane') for (const edge of axisPair) weights[edge] *= 1.5;
    return weights;
  }

  /** Draws a spawn edge from the director's stream. */
  pickEdge(t: number, heading: Readonly<{ x: number; y: number }>): SpawnEdge {
    const weights = this.edgeWeights(t, heading);
    const total = weights[0] + weights[1] + weights[2] + weights[3];
    let roll = this.random() * total;
    for (let edge = 0; edge < 4; edge += 1) {
      roll -= weights[edge];
      if (roll < 0) return edge as SpawnEdge;
    }
    return 3;
  }

  /** A 0..1 position along the chosen edge, from the director's stream. */
  pickAlongEdge() {
    return this.random();
  }

  /** The edge pair the chapter's movement axis favours now, or null when it favours none. */
  private axisPair(t: number, segment: BeatSegment): readonly SpawnEdge[] | null {
    switch (this.grammar.movementAxis) {
      case 'horizontal':
        return [0, 1];
      case 'orthogonal':
        // Alleys: pressure runs along one street at a time, alternating with each beat.
        return segment.index % 2 === 0 ? [0, 1] : [2, 3];
      case 'rotating':
        // The clock face turns: the favoured pair swaps every 15 seconds.
        return Math.floor(t / 15) % 2 === 0 ? [2, 3] : [0, 1];
      default:
        return null;
    }
  }
}
