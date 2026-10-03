import assert from 'node:assert/strict';
import test from 'node:test';
import { MUSIC_RULES } from './musicDirector.ts';
import { MUSIC_LEVEL, MusicPlayer, barTimes, type MusicPack } from './musicPlayer.ts';

// A Web Audio graph that keeps its automation: each parameter holds a timeline of events, as Web Audio does, and
// reads its value from it at the context's current time (ramps interpolate; a cancel drops events from its time on).
type Event = { kind: 'set' | 'linear' | 'exp'; value: number; at: number };

class FakeParam {
  private base: number;
  events: Event[] = [];
  private readonly clock: () => number;
  constructor(value: number, clock: () => number) {
    this.base = value;
    this.clock = clock;
  }
  get value() {
    return this.at(this.clock());
  }
  set value(value: number) {
    this.base = value;
  }
  setValueAtTime(value: number, at: number) {
    this.events.push({ kind: 'set', value, at });
  }
  linearRampToValueAtTime(value: number, at: number) {
    this.events.push({ kind: 'linear', value, at });
  }
  exponentialRampToValueAtTime(value: number, at: number) {
    assert.ok(value > 0, 'exponential ramps need a positive target');
    this.events.push({ kind: 'exp', value, at });
  }
  cancelScheduledValues(at: number) {
    this.events = this.events.filter((event) => event.at < at);
  }
  /** The automation's value at `at`. */
  at(at: number) {
    const events = [...this.events].sort((a, b) => a.at - b.at);
    let value = this.base;
    let time = 0;
    for (const event of events) {
      if (event.at <= at + 1e-9) {
        value = event.value;
        time = event.at;
        continue;
      }
      if (event.kind === 'set') break;
      const x = (at - time) / (event.at - time);
      return event.kind === 'linear' ? value + (event.value - value) * x : value * (event.value / value) ** x;
    }
    return value;
  }
}

class FakeNode {
  readonly outputs: FakeNode[] = [];
  disconnected = false;
  readonly kind: string;
  constructor(kind: string) {
    this.kind = kind;
  }
  connect(node: FakeNode) {
    this.outputs.push(node);
    return node;
  }
  disconnect() {
    this.disconnected = true;
  }
}

class FakeSource extends FakeNode {
  constructor(clock: () => number) {
    super('source');
    this.playbackRate = new FakeParam(1, clock);
  }
  readonly playbackRate: FakeParam;
  buffer: { duration: number; name: string } | null = null;
  loop = false;
  started?: { when: number; offset: number };
  stops: number[] = [];
  private ended?: () => void;
  addEventListener(_name: string, callback: () => void) {
    this.ended = callback;
  }
  start(when: number, offset = 0) {
    this.started = { when, offset };
  }
  stop(when = 0) {
    this.stops.push(when);
  }
  end() {
    this.ended?.();
  }
}

class FakeContext {
  currentTime = 0;
  readonly nodes: FakeNode[] = [];
  readonly durations = new Map<string, number>();
  private readonly clock = () => this.currentTime;
  createGain() {
    const node = Object.assign(new FakeNode('gain'), { gain: new FakeParam(1, this.clock) });
    this.nodes.push(node);
    return node;
  }
  createBiquadFilter() {
    const node = Object.assign(new FakeNode('filter'), { type: '', frequency: new FakeParam(350, this.clock) });
    this.nodes.push(node);
    return node;
  }
  createBufferSource() {
    const source = new FakeSource(this.clock);
    this.nodes.push(source);
    return source;
  }
  decodeAudioData(data: ArrayBuffer) {
    const name = new TextDecoder().decode(data);
    if (name.includes('broken')) return Promise.reject(new Error('undecodable'));
    return Promise.resolve({ duration: this.durations.get(name.split('/').pop()!) ?? 60, name });
  }
}

type Source = FakeSource;
type Gain = FakeNode & { gain: FakeParam };

// ch1: 120 bpm in 4/4, 2 s bars, 64 s (32 bars); boss-mid alternates 4/4 and 7/8 (3.5 beats).
const PACK: MusicPack = {
  id: 'test-music',
  base: 'music/',
  tracks: {
    menu: { file: 'menu.webm', bpm: 90 },
    ch1: { file: 'ch1.webm', bpm: 120, meter: [4], stems: { dense: { file: 'ch1-dense.webm' } } },
    ch2: { file: 'ch2.webm', bpm: 120 },
    'boss-mid': { file: 'boss-mid.webm', bpm: 120, meter: [4, 3.5], stems: { phase: { file: 'boss-mid-phase.webm' } } },
    'enrage-sting': { file: 'sting.webm', loop: false, cutAt: 3.6 },
    ending: { file: 'ending.webm', loop: false },
    ch3: { file: 'broken.webm' },
  },
};

function setup() {
  const context = new FakeContext();
  context.durations.set('ch1.webm', 64);
  context.durations.set('ch1-dense.webm', 16);
  context.durations.set('sting.webm', 4);
  context.durations.set('ending.webm', 90);
  const output = new FakeNode('music bus');
  const fetched: string[] = [];
  const errors: string[] = [];
  const player = new MusicPlayer({
    context: context as unknown as BaseAudioContext,
    output: output as unknown as AudioNode,
    pack: PACK,
    fetchFile: async (url) => {
      fetched.push(url);
      return new TextEncoder().encode(url).buffer as ArrayBuffer;
    },
    onError: (message) => errors.push(message),
  });
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
  const sources = () => context.nodes.filter((node): node is Source => node instanceof FakeSource);
  const named = (file: string) => sources().filter((source) => source.buffer?.name === `music/${file}`);
  const gains = () => context.nodes.filter((node): node is Gain => node.kind === 'gain');
  const [level, duck] = [gains()[0], gains()[1]];
  const filter = context.nodes.find((node) => node.kind === 'filter') as FakeNode & { frequency: FakeParam };
  return { context, output, player, fetched, errors, settle, sources, named, gains, level, duck, filter };
}

test('the music sits on its bus behind the duck and the low-pass, at its level', () => {
  const { output, level, duck, filter } = setup();
  assert.equal(level.gain.value, MUSIC_LEVEL);
  assert.deepEqual(level.outputs, [output]);
  assert.deepEqual(filter.outputs, [level]);
  assert.deepEqual(duck.outputs, [filter]);
  assert.equal(filter.frequency.value, 20_000);
});

test('a track starts with its stems at the same moment, silent stems included, and fades in', async () => {
  const { context, player, settle, named, duck } = setup();
  context.currentTime = 5;
  player.run({ type: 'play', track: 'ch1', fade: 1, crossfade: false, resume: false });
  await settle();
  const [base] = named('ch1.webm');
  const [dense] = named('ch1-dense.webm');
  assert.deepEqual(base.started, { when: 5, offset: 0 });
  assert.deepEqual(dense.started, { when: 5, offset: 0 });
  assert.equal(base.loop, true);
  const deckGain = base.outputs[0] as Gain;
  assert.deepEqual(deckGain.outputs, [duck]);
  assert.equal((dense.outputs[0] as Gain).gain.value, 0, 'the dense stem waits silent');
  assert.equal(deckGain.gain.at(6), 1);
  assert.deepEqual(player.stats(), { track: 'ch1', fading: 0, buffers: 2, duckDb: 0 });
});

test('a crossfade is equal power: the two decks keep the sum of their squares near one', async () => {
  const { context, player, settle, named } = setup();
  player.run({ type: 'play', track: 'ch1', fade: 0.01, crossfade: false, resume: false });
  await settle();
  context.currentTime = 10;
  player.run({ type: 'play', track: 'ch2', fade: MUSIC_RULES.chapterTurnCrossfade, crossfade: true, resume: false });
  await settle();
  const out = named('ch1.webm')[0].outputs[0] as Gain;
  const into = named('ch2.webm')[0].outputs[0] as Gain;
  for (const t of [10, 10.5, 11, 11.5, 12]) {
    const power = out.gain.at(t) ** 2 + into.gain.at(t) ** 2;
    assert.ok(Math.abs(power - 1) < 0.01, `power ${power} at ${t}`);
  }
  assert.ok(named('ch1.webm')[0].stops.every((when) => when <= 12.05), 'the old deck stops after its fade');
  assert.equal(player.stats().fading, 1);
});

test('a third deck cuts the oldest fading one short', async () => {
  const { context, player, settle, named } = setup();
  player.run({ type: 'play', track: 'ch1', fade: 1, crossfade: false, resume: false });
  await settle();
  context.currentTime = 1;
  player.run({ type: 'play', track: 'ch2', fade: 2, crossfade: true, resume: false });
  await settle();
  context.currentTime = 1.5;
  player.run({ type: 'play', track: 'menu', fade: 2, crossfade: true, resume: false });
  await settle();
  assert.ok(named('ch1.webm')[0].stops.some((when) => Math.abs(when - 1.62) < 1e-9), 'ch1 is cut in 0.1 s');
  assert.equal(player.stats().fading, 1);
});

test('a play overtaken while decoding never starts', async () => {
  const { player, settle, named } = setup();
  player.run({ type: 'play', track: 'ch1', fade: 1, crossfade: false, resume: false });
  player.run({ type: 'stop', fade: 1, remember: false });
  player.run({ type: 'play', track: 'ch2', fade: 1, crossfade: false, resume: false });
  await settle();
  assert.equal(named('ch1.webm').length, 0);
  assert.equal(named('ch2.webm').length, 1);
  assert.equal(player.stats().track, 'ch2');
});

test('a remembered track resumes at its 4-bar group, or from the top near its end', async () => {
  const { context, player, settle, named } = setup();
  player.run({ type: 'play', track: 'ch1', fade: 1, crossfade: false, resume: true });
  await settle();
  // 21 s into ch1 is bar 10 (2 s bars); its 4-bar group starts at bar 8, 16 s.
  context.currentTime = 21;
  player.run({ type: 'stop', fade: 1, remember: true });
  context.currentTime = 30;
  player.run({ type: 'play', track: 'ch1', fade: 1.5, crossfade: false, resume: true });
  await settle();
  assert.equal(named('ch1.webm')[1].started?.offset, 16);
  assert.equal(named('ch1-dense.webm')[1].started?.offset, 0, 'the 16 s stem joins at 16 mod 16');
  // 51 s is bar 25: 7 bars remain, so it starts over.
  context.currentTime = 30 + 35;
  player.run({ type: 'stop', fade: 1, remember: true });
  player.run({ type: 'play', track: 'ch1', fade: 1.5, crossfade: false, resume: true });
  await settle();
  assert.equal(named('ch1.webm')[2].started?.offset, 0);
  // A track not asked to resume always starts at the top, and a stop without remember forgets.
  context.currentTime = 80;
  player.run({ type: 'stop', fade: 1, remember: false });
  player.run({ type: 'play', track: 'ch1', fade: 1, crossfade: false, resume: true });
  await settle();
  assert.equal(named('ch1.webm')[3].started?.offset, 0);
});

test('a stem comes in at the next bar line and ramps over one bar, even in 7/8', async () => {
  const { context, player, settle, named } = setup();
  player.run({ type: 'play', track: 'ch1', fade: 1, crossfade: false, resume: false });
  await settle();
  context.currentTime = 3.2;
  player.run({ type: 'stem', stem: 'dense', db: 0 });
  const dense = named('ch1-dense.webm')[0].outputs[0] as Gain;
  assert.equal(dense.gain.at(3.9), 0, 'silent until the bar line at 4 s');
  assert.equal(dense.gain.at(6), 1, 'up by the end of that bar');
  // boss-mid: bars of 2 s and 1.75 s; at 2.5 s the next line is 3.75 s and the bar after it is 2 s long.
  context.currentTime = 100;
  player.run({ type: 'play', track: 'boss-mid', fade: 0.3, crossfade: false, resume: false });
  await settle();
  context.currentTime = 102.5;
  player.run({ type: 'stem', stem: 'phase', db: -6 });
  const phase = named('boss-mid-phase.webm')[0].outputs[0] as Gain;
  const ramp = phase.gain.events.filter((event) => event.kind === 'linear');
  assert.deepEqual(ramp.map((event) => [event.at, Math.round(event.value * 1000) / 1000]), [[105.75, 0.501]]);
  assert.deepEqual(barTimes({ bpm: 120, meter: [4, 3.5] }, 8), [0, 2, 3.75, 5.75, 7.5]);
});

test('a stem level carries to the next deck of the run', async () => {
  const { player, settle, named } = setup();
  player.run({ type: 'stem', stem: 'dense', db: 0 });
  player.run({ type: 'play', track: 'ch1', fade: 1, crossfade: false, resume: false });
  await settle();
  assert.equal((named('ch1-dense.webm')[0].outputs[0] as Gain).gain.value, 1);
});

test('ducks: the deepest wins, a lifted duck gives way to the next, and the phase dip lifts itself', () => {
  const { context, player, duck } = setup();
  const db = (gain: number) => Math.round(20 * Math.log10(gain) * 10) / 10;
  player.run({ type: 'duck', id: 'draft', db: -4, seconds: 0.2 });
  player.run({ type: 'duck', id: 'pause', db: -8, seconds: 0.3 });
  assert.equal(db(duck.gain.at(1)), -8);
  assert.equal(player.stats().duckDb, -8);
  context.currentTime = 2;
  player.run({ type: 'duck', id: 'pause', db: null, seconds: 0.3 });
  assert.equal(db(duck.gain.at(2.3)), -4);
  player.run({ type: 'duck', id: 'draft', db: null, seconds: 0.3 });
  context.currentTime = 5;
  player.run({ type: 'duck', id: 'phase', db: -4, seconds: 0.05, hold: 0.45, release: 0.3 });
  assert.equal(db(duck.gain.at(5.05)), -4);
  assert.equal(db(duck.gain.at(5.5)), -4);
  assert.equal(db(duck.gain.at(5.8)), 0);
  assert.equal(player.stats().duckDb, 0);
});

test('the pause low-pass closes and opens; the tape stop sinks the pitch and darkens, then restores', async () => {
  const { context, player, settle, named, filter } = setup();
  player.run({ type: 'lowpass', hz: 1500, seconds: 0.3 });
  assert.equal(filter.frequency.at(0.3), 1500);
  player.run({ type: 'lowpass', hz: null, seconds: 0.3 });
  assert.equal(filter.frequency.at(0.3), 20_000);
  player.run({ type: 'play', track: 'ch1', fade: 1, crossfade: false, resume: false });
  await settle();
  context.currentTime = 10;
  player.run({ type: 'stop', fade: 0.7, remember: false, tape: true });
  const base = named('ch1.webm')[0];
  assert.equal(base.playbackRate.at(10.7), 0.25);
  assert.equal(filter.frequency.at(10.7), 400);
  assert.equal(filter.frequency.at(10.8), 20_000);
  assert.ok(base.stops.some((when) => Math.abs(when - 10.72) < 1e-9));
});

test('the sting skips the ducks and ducks the deck 10 dB until its cut, then lets it back', async () => {
  const { context, player, settle, named, filter, duck } = setup();
  player.run({ type: 'play', track: 'boss-mid', fade: 0.3, crossfade: false, resume: false });
  await settle();
  context.currentTime = 20;
  player.run({ type: 'sting' });
  await settle();
  const [sting] = named('sting.webm');
  assert.deepEqual(sting.outputs, [filter]);
  assert.equal(sting.loop, false);
  assert.equal(Math.round(20 * Math.log10(duck.gain.at(23.6))), -10);
  assert.equal(duck.gain.at(25.2), 1);
});

test('decoding follows need: preloads decode ahead, a boss track brings the sting, others are let go', async () => {
  const { player, fetched, settle } = setup();
  player.run({ type: 'preload', tracks: ['boss-mid'] });
  await settle();
  assert.deepEqual(fetched.sort(), ['music/boss-mid-phase.webm', 'music/boss-mid.webm', 'music/sting.webm']);
  assert.equal(player.stats().buffers, 3);
  player.run({ type: 'play', track: 'ch1', fade: 1, crossfade: false, resume: false });
  player.run({ type: 'preload', tracks: [] });
  await settle();
  assert.equal(player.stats().buffers, 2, 'the boss stage is over: only ch1 and its stem stay');
});

test('a track that fails to decode stays silent and is reported once', async () => {
  const { player, settle, errors, named } = setup();
  player.run({ type: 'play', track: 'ch3', fade: 1, crossfade: false, resume: false });
  await settle();
  assert.equal(named('broken.webm').length, 0);
  assert.equal(player.stats().track, null);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /broken\.webm/);
});

test('a track that plays once ends by itself and lets go of its nodes', async () => {
  const { player, settle, named } = setup();
  player.run({ type: 'play', track: 'ending', fade: 1.5, crossfade: false, resume: false });
  await settle();
  const [ending] = named('ending.webm');
  assert.equal(ending.loop, false);
  ending.end();
  assert.equal(ending.disconnected, true);
  assert.equal(player.stats().track, null);
});
