import assert from 'node:assert/strict';
import test from 'node:test';
import { CHAPTER_ENCOUNTER_GRAMMARS, type ChapterEncounterGrammar, type EncounterBeatKind } from '../content/encounters.ts';
import { createSeededRandom } from './p0Core.ts';
import {
  BREATHER_REWARD_SCALE,
  EncounterDirector,
  OPENING_RAMP_SECONDS,
  type BeatSegment,
  OPENING_RAMP_START,
  beatRateFactors,
  buildBeatSchedule,
} from './encounterDirector.ts';

const grammars: readonly ChapterEncounterGrammar[] = CHAPTER_ENCOUNTER_GRAMMARS;
const [inkAlley, ironChapel, grayCanal] = grammars;

function found<T>(value: T | undefined, what: string): T {
  assert.ok(value !== undefined, `${what} exists`);
  return value;
}

test('the schedule plays the opening once, then cycles pressure, breather, and elite within authored lengths', () => {
  const schedule = buildBeatSchedule(inkAlley, 300, createSeededRandom(9));
  assert.equal(schedule[0].beat, 0);
  assert.equal(schedule[0].start, 0);
  assert.deepEqual(schedule.slice(1, 7).map((segment) => segment.beat), [1, 2, 3, 1, 2, 3]);
  for (const segment of schedule) {
    const [min, max] = inkAlley.beats[segment.beat].durationSeconds;
    const length = segment.end - segment.start;
    assert.ok(length >= min && length <= max, `beat ${segment.beat} lasts ${length}`);
  }
  for (let index = 1; index < schedule.length; index += 1) assert.equal(schedule[index].start, schedule[index - 1].end);
  assert.ok(found(schedule.at(-1), 'last segment').end >= 300, 'covers the whole stage');
  assert.deepEqual(buildBeatSchedule(inkAlley, 300, createSeededRandom(9)), schedule, 'same seed, same schedule');
});

test('beat factors keep a full cycle at the old average rate and only change its rhythm', () => {
  for (const grammar of CHAPTER_ENCOUNTER_GRAMMARS) {
    const factors = beatRateFactors(grammar);
    assert.equal(factors[0], 1, 'the opening is shaped by the ramp alone');
    let weighted = 0;
    let total = 0;
    for (let index = 1; index < grammar.beats.length; index += 1) {
      const [min, max] = grammar.beats[index].durationSeconds;
      weighted += factors[index] * ((min + max) / 2);
      total += (min + max) / 2;
    }
    assert.ok(Math.abs(weighted / total - 1) < 1e-9, `${grammar.id} cycle mean ${weighted / total}`);
    const breather = factors[grammar.beats.findIndex((beat) => beat.kind === 'breather')];
    const elite = factors[grammar.beats.findIndex((beat) => beat.kind === 'elite')];
    assert.ok(breather < 0.6 && elite > 1.2, `${grammar.id}: breather ${breather}, elite ${elite}`);
  }
});

test('the opening ramps from 0.4x to 1.0x over 45 seconds', () => {
  const director = new EncounterDirector(inkAlley, 300, createSeededRandom(3));
  assert.equal(director.rateFactor(0), OPENING_RAMP_START);
  assert.ok(Math.abs(director.rateFactor(director.schedule[0].end / 2) - (OPENING_RAMP_START + (1 - OPENING_RAMP_START) * (director.schedule[0].end / 2) / OPENING_RAMP_SECONDS)) < 1e-9);
  const later = found(director.schedule.find((segment) => segment.start > OPENING_RAMP_SECONDS && segment.beat === 1), 'a pressure beat after 45 s');
  assert.equal(director.rateFactor(later.start + 0.5), beatRateFactors(inkAlley)[1], 'no ramp after 45 s');
});

test('breathers pay more, surround beats burst, and hazard budgets cap boss-made terrain', () => {
  const director = new EncounterDirector(ironChapel, 400, createSeededRandom(5));
  const at = (kind: EncounterBeatKind) => {
    const segment = found(director.schedule.find((candidate) => ironChapel.beats[candidate.beat].kind === kind), kind);
    return (segment.start + segment.end) / 2;
  };
  assert.equal(director.rewardScale(at('breather')), BREATHER_REWARD_SCALE);
  assert.equal(director.rewardScale(at('pressure')), 1);
  assert.equal(director.burstSize(at('elite')), 4, 'the Iron Chapel elite beat surrounds the player');
  assert.equal(director.burstSize(at('pressure')), 1);
  assert.equal(director.terrainCap(at('breather')), 1);
  assert.equal(director.terrainCap(at('elite')), 5);
});

function edgeShares(director: EncounterDirector, t: number, heading: { x: number; y: number }, draws = 4000) {
  const counts = [0, 0, 0, 0];
  for (let index = 0; index < draws; index += 1) counts[director.pickEdge(t, heading)] += 1;
  return counts.map((count) => count / draws);
}

test('formations and movement axes move where enemies come from', () => {
  const alley = new EncounterDirector(inkAlley, 300, createSeededRandom(11));
  const opening = alley.schedule[0];
  // Ink Alley opens with a front formation: most enemies come from where the player runs.
  const right = edgeShares(alley, opening.start + 1, { x: 1, y: 0 });
  assert.ok(right[1] > 0.45, `front edge share ${right[1]}`);
  const down = edgeShares(alley, opening.start + 1, { x: 0, y: 1 });
  assert.ok(down[3] > 0.4, `front follows the heading: ${down[3]}`);
  const pressure = found(alley.schedule.find((segment: BeatSegment) => segment.beat === 1), 'pressure');
  const flank = edgeShares(alley, pressure.start + 1, { x: 1, y: 0 });
  assert.ok(flank[2] + flank[3] > 0.6, `flank share ${flank[2] + flank[3]}`);

  // The canal's horizontal axis favours the left and right edges whatever the formation.
  const canal = new EncounterDirector(grayCanal, 300, createSeededRandom(13));
  const canalPressure = found(canal.schedule.find((segment) => segment.beat === 1), 'canal pressure');
  const sides = edgeShares(canal, canalPressure.start + 1, { x: 0, y: 1 });
  assert.ok(sides[0] + sides[1] > 0.3, `left and right keep a share: ${sides[0] + sides[1]}`);
  const ringGrammar = found(grammars.find((grammar) => grammar.movementAxis === 'radial'), 'radial grammar');
  const ring = new EncounterDirector(ringGrammar, 300, createSeededRandom(17));
  const ringShares = edgeShares(ring, ring.schedule[0].start + 1, { x: 1, y: 0 });
  assert.ok(ringShares.every((share) => Math.abs(share - 0.25) < 0.04), `a radial ring spawns evenly: ${ringShares}`);
});
