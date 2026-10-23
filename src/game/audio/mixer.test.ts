import assert from 'node:assert/strict';
import test from 'node:test';
import { LIMITER_MAKEUP, MAX_VOICES, PAN_SPREAD, SYNTH_PEAK } from '../audioPolicy.ts';
import { AudioMixer } from './mixer.ts';

// A minimal Web Audio graph: nodes remember what they connect to and how their parameters were set.
class FakeParam {
  value: number;
  readonly calls: string[] = [];
  constructor(value = 0) {
    this.value = value;
  }
  setTargetAtTime(value: number) {
    this.value = value;
    this.calls.push('target');
  }
  setValueAtTime(value: number) {
    this.value = value;
    this.calls.push('set');
  }
  exponentialRampToValueAtTime(value: number) {
    this.calls.push(`ramp ${value}`);
  }
  cancelScheduledValues() {
    this.calls.push('cancel');
  }
}

class FakeNode {
  readonly kind: string;
  readonly outputs: FakeNode[] = [];
  disconnected = false;
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
  readonly frequency = new FakeParam();
  readonly playbackRate = new FakeParam(1);
  type = 'sine';
  buffer: unknown = null;
  startedAt = -1;
  stops: number[] = [];
  private ended?: () => void;
  addEventListener(_name: string, callback: () => void) {
    this.ended = callback;
  }
  start(when: number) {
    this.startedAt = when;
  }
  stop(when: number) {
    this.stops.push(when);
  }
  end() {
    this.ended?.();
  }
}

class FakeContext {
  state: AudioContextState = 'suspended';
  currentTime = 0;
  readonly destination = new FakeNode('destination');
  readonly nodes: FakeNode[] = [];
  decoded: string[] = [];
  private make<T extends FakeNode>(node: T) {
    this.nodes.push(node);
    return node;
  }
  createGain() {
    return Object.assign(this.make(new FakeNode('gain')), { gain: new FakeParam(1) });
  }
  createDynamicsCompressor() {
    return Object.assign(this.make(new FakeNode('limiter')), { threshold: new FakeParam(), knee: new FakeParam(), ratio: new FakeParam(), attack: new FakeParam(), release: new FakeParam() });
  }
  createStereoPanner() {
    return Object.assign(this.make(new FakeNode('panner')), { pan: new FakeParam() });
  }
  createOscillator() {
    return this.make(new FakeSource('oscillator'));
  }
  createBufferSource() {
    return this.make(new FakeSource('sample'));
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  decodeAudioData(data: ArrayBuffer) {
    const name = new TextDecoder().decode(data);
    if (name.includes('broken')) return Promise.reject(new Error('undecodable'));
    this.decoded.push(name);
    return Promise.resolve({ duration: 0.2, name });
  }
}

type Gain = FakeNode & { gain: FakeParam };

function setup(levels = { volume: 0.5, musicVolume: 0.8, sfxVolume: 1 }, random = () => 0.5) {
  const contexts: FakeContext[] = [];
  const mixer = new AudioMixer({
    createContext: () => {
      const context = new FakeContext();
      contexts.push(context);
      return context as unknown as AudioContext;
    },
    fetchFile: async (url) => new TextEncoder().encode(url).buffer as ArrayBuffer,
    random,
  });
  mixer.setLevels(levels);
  const open = async () => {
    mixer.unlock();
    await Promise.resolve();
    return contexts[0];
  };
  return { mixer, contexts, open };
}

const sources = (context: FakeContext) => context.nodes.filter((node): node is FakeSource => node instanceof FakeSource);

test('muted, the mixer never opens an audio context', () => {
  const { mixer, contexts } = setup({ volume: 0, musicVolume: 1, sfxVolume: 1 });
  mixer.unlock();
  mixer.play('boss.kill');
  assert.equal(contexts.length, 0);
});

test('one context for the session: buses feed the master gain, then the limiter, then the speakers', async () => {
  const { mixer, contexts, open } = setup();
  const context = await open();
  mixer.unlock();
  mixer.unlock();
  assert.equal(contexts.length, 1);
  const limiter = context.nodes.find((node) => node.kind === 'limiter')!;
  assert.deepEqual(limiter.outputs, [context.destination]);
  const master = context.nodes.find((node) => node.outputs[0] === limiter) as Gain;
  assert.ok(Math.abs(master.gain.value - 0.5 / LIMITER_MAKEUP) < 1e-9);
  const buses = context.nodes.filter((node) => node.outputs[0] === master) as Gain[];
  assert.deepEqual(buses.map((bus) => bus.gain.value), [0.8, 1, 1, 0.8], 'music, sfx, ui, ambience');
  mixer.setLevels({ volume: 0.25, musicVolume: 0.5, sfxVolume: 0.4 });
  assert.deepEqual(buses.map((bus) => bus.gain.value), [0.5, 0.4, 0.4, 0.5]);
  assert.ok(Math.abs(master.gain.value - 0.25 / LIMITER_MAKEUP) < 1e-9);
  assert.equal(mixer.stats().limiter, true);
});

test('a synth voice keeps the 0.1.0 tone, pitch spread, and envelope on its bus', async () => {
  const { mixer, open } = setup();
  const context = await open();
  mixer.play('hit.critical');
  const [tone] = sources(context);
  assert.equal(tone.type, 'sawtooth');
  assert.equal(tone.frequency.value, 118 + 0.5 * 34);
  const gain = tone.outputs[0] as Gain;
  assert.deepEqual(gain.gain.calls, [`ramp ${SYNTH_PEAK * 1.35}`, 'ramp 0.0001']);
  const sfx = gain.outputs[0] as Gain;
  const master = sfx.outputs[0];
  assert.equal(master.outputs[0].kind, 'limiter');
  assert.ok(Math.abs(tone.stops[0] - 0.065) < 1e-9);
});

test('sounds off to the side pan toward that speaker, and centred ones skip the panner', async () => {
  const { mixer, open } = setup();
  const context = await open();
  mixer.play('enemy.kill', -1);
  context.currentTime = 1;
  mixer.play('enemy.kill', 0.01);
  const [left, centre] = sources(context);
  const panner = left.outputs[0].outputs[0] as FakeNode & { pan: FakeParam };
  assert.equal(panner.kind, 'panner');
  assert.equal(panner.pan.value, -PAN_SPREAD);
  assert.notEqual(centre.outputs[0].outputs[0].kind, 'panner');
});

test('thirty kills at once start one voice, and voices never pass the cap', async () => {
  const { mixer, open } = setup();
  const context = await open();
  for (let index = 0; index < 30; index += 1) mixer.play('enemy.kill');
  assert.equal(sources(context).length, 1);
  assert.equal(mixer.stats().spaced, 29);
  const cues = ['cast.fanKnives', 'cast.chainSpark', 'cast.frostLine', 'cast.railSpear', 'cast.boneMortar', 'cast.mirrorClone', 'cast.voidMine', 'cast.blackSun'] as const;
  for (let round = 0; round < 4; round += 1) {
    context.currentTime += 0.031;
    for (const cue of cues) mixer.play(cue);
    mixer.play('enemy.kill');
  }
  assert.ok(mixer.stats().voices <= MAX_VOICES, `${mixer.stats().voices} voices`);
  assert.ok(mixer.stats().stolen > 0);
});

test('a voice cut for a newer one fades out instead of clicking off', async () => {
  const { mixer, open } = setup();
  const context = await open();
  mixer.play('boss.enraged');
  context.currentTime = 0.05;
  mixer.play('boss.enraged');
  const [first] = sources(context);
  const gain = first.outputs[0] as Gain;
  assert.deepEqual(gain.gain.calls.slice(-3), ['cancel', 'set', 'ramp 0.0001']);
  assert.ok(Math.abs(first.stops.at(-1)! - 0.062) < 1e-9);
  first.end();
  assert.ok(first.disconnected && gain.disconnected, 'finished voices release their nodes');
  assert.equal(mixer.stats().nodes, 1);
});

test('a suspended context plays nothing until a gesture wakes it', async () => {
  const { mixer, open } = setup();
  const context = await open();
  context.state = 'suspended';
  mixer.play('player.hurt');
  assert.equal(sources(context).length, 0, 'no sounds pile up to burst out on resume');
  mixer.unlock();
  assert.equal(context.state, 'running');
  mixer.play('player.hurt');
  assert.equal(sources(context).length, 1);
});

test('sound pack samples replace the synth tone once decoded, and a broken file falls back', async () => {
  const { mixer, open } = setup();
  const loaded = mixer.loadPack({ id: 'test', base: 'assets/sfx/', cues: { 'enemy.kill': ['kill-0.webm', 'kill-1.webm'], 'player.hurt': ['broken.webm'] } });
  const context = await open();
  assert.equal(await loaded, false, 'one file failed');
  assert.deepEqual(context.decoded, ['assets/sfx/kill-0.webm', 'assets/sfx/kill-1.webm']);
  mixer.play('enemy.kill');
  mixer.play('player.hurt');
  const [kill, hurt] = sources(context);
  assert.equal(kill.kind, 'sample');
  assert.equal((kill.buffer as { name: string }).name, 'assets/sfx/kill-1.webm');
  assert.ok(Math.abs(kill.stops[0] - 0.2) < 1e-9, 'the voice lasts as long as its sample');
  assert.equal(hurt.kind, 'oscillator', 'no sample, so the synth plays');
  assert.equal(mixer.stats().samples, 1);
});

test('AUD-02: samples vary their pitch a little each play, except a cue that turns it off (the fuse ticks)', async () => {
  const { mixer, open } = setup(undefined, () => 0.9);
  const loaded = mixer.loadPack({ id: 'test', base: 'assets/sfx/', cues: { 'enemy.kill': ['kill-0.wav'], 'bomber.tick': ['tick-0.wav'] } });
  const context = await open();
  await loaded;
  mixer.play('enemy.kill', 0, 1.1);
  mixer.play('bomber.tick', 0, 2700 / 2900);
  const [kill, tick] = sources(context);
  assert.ok(Math.abs(kill.playbackRate.value - (1 + 0.8 * 0.04) * 1.1) < 1e-12, 'up to 4% around the asked pitch');
  assert.equal(tick.playbackRate.value, 2700 / 2900, 'exactly the asked pitch');
  assert.ok(Math.abs(tick.stops[0] - 0.2 / (2700 / 2900)) < 1e-12, 'and the voice lasts as long as the sample at that pitch');
});

test('without Web Audio the mixer stays silent and stops trying', () => {
  let attempts = 0;
  const mixer = new AudioMixer({ createContext: () => { attempts += 1; throw new Error('no audio'); } });
  mixer.setLevels({ volume: 1, musicVolume: 1, sfxVolume: 1 });
  mixer.unlock();
  mixer.unlock();
  mixer.play('boss.kill');
  assert.equal(attempts, 1);
  assert.equal(mixer.stats().state, 'closed');
});

test('AUD-04: a chapter ambience bed loops on the ambience bus once decoded, fades into the next, and stops on null', async () => {
  const { mixer, open } = setup();
  const loaded = mixer.loadPack({ id: 'test', base: 'assets/sfx/', cues: { 'ambience.ch1': ['alley.wav'], 'ambience.ch2': ['chapel.wav'] } });
  mixer.ambience('ambience.ch1');
  const context = await open();
  await loaded;
  const beds = () => sources(context).filter((source) => (source.buffer as { name?: string } | null)?.name?.startsWith('assets/sfx/'));
  const [alley] = beds();
  assert.ok(alley, 'the bed asked for before decoding starts once it decodes');
  assert.equal((alley as FakeSource & { loop?: boolean }).loop, true);
  const ambienceBus = context.nodes.find((node) => node.kind === 'gain' && (node as Gain).gain.value === 0.8 * 1 && node.outputs.length === 1 && node !== alley.outputs[0]);
  assert.ok(ambienceBus, 'there is an ambience bus at the music level');
  mixer.ambience('ambience.ch1');
  assert.equal(beds().length, 1, 'asking for the bed already playing changes nothing');
  mixer.ambience('ambience.ch2');
  const [, chapel] = beds();
  assert.equal((chapel.buffer as { name: string }).name, 'assets/sfx/chapel.wav');
  assert.equal(alley.stops.length, 1, 'the old bed fades out and stops');
  mixer.ambience(null);
  assert.equal(chapel.stops.length, 1);
  assert.equal(beds().length, 2, 'null starts nothing new');
});

test('AUD-03: music commands wait for audio to open, then reach the player built on the music bus', async () => {
  const { mixer, open } = setup();
  mixer.music({ type: 'play', track: 'menu', fade: 2, crossfade: false, resume: true });
  const ran: unknown[] = [];
  let built: { output: unknown } | null = null;
  const pack = { id: 'music-test', base: 'music/', tracks: {} };
  mixer.setMusic(pack, (options) => {
    built = options;
    return { run: (command: unknown) => ran.push(command), stats: () => ({ track: null, fading: 0, buffers: 0, duckDb: 0 }) } as never;
  });
  mixer.music({ type: 'play', track: 'menu', fade: 2, crossfade: false, resume: true });
  mixer.music({ type: 'duck', id: 'pause', db: -8, seconds: 0.3 });
  assert.equal(built, null, 'no player before audio opens');
  const context = await open();
  const musicBus = context.nodes.find((node) => node.kind === 'gain' && node.outputs[0]?.kind === 'gain' && (node as Gain).gain.value === 0.8);
  assert.equal(built!.output, musicBus);
  assert.deepEqual(ran.map((command) => (command as { type: string }).type), ['play', 'duck'], 'the command before the pack is dropped');
  mixer.music({ type: 'sting' });
  assert.equal(ran.length, 3);
  assert.deepEqual(mixer.stats().music, { track: null, fading: 0, buffers: 0, duckDb: 0 });
});
