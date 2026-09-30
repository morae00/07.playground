// SFX baker (AUD-02 v0): renders the recipes in art/sfx-spec.mjs with a small synthesizer in plain JavaScript,
// normalizes every variant to SFX_PEAK, and writes 16-bit mono WAV files plus the pack manifest that
// AudioMixer.loadPack reads. Plain JavaScript (not Web Audio) keeps a rebake byte-identical: the browser's audio
// renderer rounds differently from run to run. Usage: node scripts/build-sfx.mjs
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { RECIPES, SFX_PACK, SFX_PEAK, SFX_RATE } from '../art/sfx-spec.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'public', SFX_PACK.dir);
const RATE = SFX_RATE;

/** mulberry32: seeded noise and variant jitter. */
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** PolyBLEP step correction: takes the alias edges off square and sawtooth waves. */
function blep(phase, step) {
  if (phase < step) {
    const t = phase / step;
    return t + t - t * t - 1;
  }
  if (phase > 1 - step) {
    const t = (phase - 1) / step;
    return t * t + t + t + 1;
  }
  return 0;
}

/** Frequency at time t of a layer that sweeps exponentially from hz to `to` over its length. */
const sweep = (hz, to, t, length) => (to ? hz * (to / hz) ** Math.min(1, t / length) : hz);

/**
 * Linear attack to the layer's gain, an optional hold, then an exponential fall to 0.0001, like Web Audio's ramps.
 * An LFO swells the level around its middle.
 */
function envelope(layer, t, decay) {
  if (t < 0) return 0;
  const swell = layer.lfo ? 1 - layer.lfo.depth / 2 + (layer.lfo.depth / 2) * Math.sin(2 * Math.PI * layer.lfo.hz * t) : 1;
  if (t < layer.attack) return ((layer.gain * t) / layer.attack) * swell;
  const held = t - layer.attack - (layer.hold ?? 0);
  if (held < 0) return layer.gain * swell;
  const fall = held / decay;
  return fall >= 1 ? 0 : layer.gain * swell * (0.0001 / layer.gain) ** fall;
}

/** An RBJ biquad; coefficients follow the sweep every 32 samples. */
function biquad(type, q) {
  let b0 = 0, b1 = 0, b2 = 0, a1 = 0, a2 = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return {
    tune(hz) {
      const w = (2 * Math.PI * Math.min(hz, RATE * 0.45)) / RATE;
      const alpha = Math.sin(w) / (2 * q);
      const cos = Math.cos(w);
      const a0 = 1 + alpha;
      if (type === 'lowpass') [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
      else if (type === 'highpass') [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
      else [b0, b1, b2] = [alpha, 0, -alpha];
      [b0, b1, b2, a1, a2] = [b0 / a0, b1 / a0, b2 / a0, (-2 * cos) / a0, (1 - alpha) / a0];
    },
    run(x) {
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      [x2, x1, y2, y1] = [x1, x, y1, y];
      return y;
    },
  };
}

function renderLayer(samples, layer, random, detune, stretch) {
  const start = layer.at ?? 0;
  const decay = layer.decay * stretch;
  const length = layer.attack + (layer.hold ?? 0) + decay;
  const first = Math.floor(start * RATE);
  const count = Math.ceil(length * RATE);
  let phase = 0;
  let gate = 1;
  let nextGate = 0;
  const filter = layer.noise ? biquad(layer.filter, layer.q ?? 0.7) : null;
  for (let index = 0; index < count && first + index < samples.length; index += 1) {
    const t = index / RATE;
    const hz = sweep(layer.hz * detune, layer.to ? layer.to * detune : 0, t, length);
    let value;
    if (layer.tone) {
      const step = hz / RATE;
      if (layer.tone === 'sine') value = Math.sin(2 * Math.PI * phase);
      else if (layer.tone === 'triangle') value = 1 - 4 * Math.abs(phase - 0.5);
      else if (layer.tone === 'sawtooth') value = 2 * phase - 1 - blep(phase, step);
      else value = (phase < 0.5 ? 1 : -1) + blep(phase, step) - blep((phase + 0.5) % 1, step);
      phase = (phase + step) % 1;
    } else {
      // Crackle: noise gated on and off in 2-8 ms grains, like paper tearing.
      if (layer.noise === 'crackle' && index >= nextGate) {
        gate = random() < 0.45 ? 1 : 0.08;
        nextGate = index + Math.floor(RATE * (0.002 + random() * 0.006));
      }
      if (index % 32 === 0) filter.tune(hz);
      value = filter.run((random() * 2 - 1) * gate);
    }
    samples[first + index] += value * envelope(layer, t, decay);
  }
}

/** Ambience beds render this much past their loop; the extra folds back over the start. */
const LOOP_FOLD = 1;

/** Crossfades the tail past `length` into the head (equal power), so the file loops without a seam. */
function foldLoop(samples, length) {
  const fold = samples.length - length;
  const loop = samples.slice(0, length);
  for (let index = 0; index < fold; index += 1) {
    const t = index / fold;
    loop[index] = loop[index] * Math.sin((Math.PI / 2) * t) + samples[length + index] * Math.cos((Math.PI / 2) * t);
  }
  return loop;
}

function wav(samples, scale) {
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write('RIFF', 0, 'ascii');
  data.writeUInt32LE(36 + samples.length * 2, 4);
  data.write('WAVEfmt ', 8, 'ascii');
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(RATE, 24);
  data.writeUInt32LE(RATE * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write('data', 36, 'ascii');
  data.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((sample, index) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample * scale)) * 32767), 44 + index * 2));
  return data;
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const cues = {};
let seed = 1;
let bytes = 0;
let files = 0;
for (const [cue, recipe] of Object.entries(RECIPES)) {
  for (let variant = 0; variant < recipe.variants; variant += 1) {
    const random = seeded((seed += 1) * 7919);
    const detune = recipe.variants > 1 ? 1 + (random() - 0.5) * 0.12 : 1;
    const stretch = recipe.variants > 1 ? 1 + (random() - 0.5) * 0.16 : 1;
    const length = recipe.loop ? recipe.loop + LOOP_FOLD : Math.max(...recipe.layers.map((layer) => (layer.at ?? 0) + layer.attack + (layer.hold ?? 0) + layer.decay * stretch)) + 0.02;
    let samples = new Float64Array(Math.ceil(length * RATE));
    for (const layer of recipe.layers) renderLayer(samples, layer, random, detune, stretch);
    if (recipe.loop) samples = foldLoop(samples, Math.round(recipe.loop * RATE));
    const loudest = samples.reduce((peak, sample) => Math.max(peak, Math.abs(sample)), 0);
    if (loudest < 1e-4) throw new Error(`${cue} variant ${variant} rendered silent`);
    const name = `${cue}-${variant}.wav`;
    const data = wav(samples, SFX_PEAK / loudest);
    writeFileSync(path.join(outDir, name), data);
    (cues[cue] ??= []).push(name);
    bytes += data.length;
    files += 1;
  }
}
writeFileSync(path.join(outDir, 'pack.json'), `${JSON.stringify({ id: SFX_PACK.id, base: `${SFX_PACK.dir}/`, cues }, null, 1)}\n`);
console.log(`${Object.keys(cues).length} cues, ${files} files, ${Math.round(bytes / 1024)} KiB`);
