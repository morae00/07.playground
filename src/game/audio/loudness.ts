// Loudness meter (AUD-05), so the mix can be measured without downloading a tool (cue sheet §7 A): ITU-R BS.1770-4
// K-weighting and gating for integrated loudness, momentary (400 ms) and short-term (3 s) maxima, the EBU Tech 3342
// loudness range, and a 4x oversampled true peak, plus WAV reading and writing. A tool for scripts/measure-loudness.mjs
// and scripts/record-mix.mjs; the game never imports it.

export type Channels = readonly Float32Array[];
export type Loudness = {
  seconds: number;
  /** Gated integrated loudness, LUFS; -Infinity for a clip shorter than one 400 ms block or all silence. */
  integrated: number;
  momentaryMax: number;
  shortTermMax: number;
  /** Loudness range, LU (0 for a clip shorter than 3 s). */
  range: number;
  /** Sample and true peaks, dBFS / dBTP. */
  samplePeak: number;
  truePeak: number;
};

type Biquad = { b: readonly number[]; a: readonly number[] };

const ABSOLUTE_GATE = -70;
const RELATIVE_GATE = -10;
const RANGE_RELATIVE_GATE = -20;
const OVERSAMPLE = 4;
const TAPS_PER_PHASE = 12;

const toDb = (value: number) => (value > 0 ? 20 * Math.log10(value) : -Infinity);
const loudnessOf = (power: number) => (power > 0 ? -0.691 + 10 * Math.log10(power) : -Infinity);
const mean = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

/**
 * The two K-weighting biquads for a sample rate (BS.1770-4, derived as libebur128 does): a high shelf of about +4 dB
 * above 1.5 kHz, then the RLB high-pass at 38 Hz. At 48 kHz they give the coefficients printed in the standard.
 */
export function kWeighting(rate: number): [Biquad, Biquad] {
  const shelfGain = 10 ** (3.999843853973347 / 20);
  const shelfBand = shelfGain ** 0.4996667741545416;
  let q = 0.7071752369554196;
  let k = Math.tan((Math.PI * 1681.974450955533) / rate);
  let a0 = 1 + k / q + k * k;
  const shelf = {
    b: [(shelfGain + (shelfBand * k) / q + k * k) / a0, (2 * (k * k - shelfGain)) / a0, (shelfGain - (shelfBand * k) / q + k * k) / a0],
    a: [1, (2 * (k * k - 1)) / a0, (1 - k / q + k * k) / a0],
  };
  q = 0.5003270373238773;
  k = Math.tan((Math.PI * 38.13547087602444) / rate);
  a0 = 1 + k / q + k * k;
  return [shelf, { b: [1, -2, 1], a: [1, (2 * (k * k - 1)) / a0, (1 - k / q + k * k) / a0] }];
}

function filter(input: ArrayLike<number>, { b, a }: Biquad) {
  const output = new Float64Array(input.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < input.length; i += 1) {
    const x = input[i];
    const y = b[0] * x + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    output[i] = y;
  }
  return output;
}

/** Running sums of squares of a K-weighted channel, padded with silence to `length`, so a window costs two reads. */
function squareSums(channel: Float32Array, rate: number, length = channel.length) {
  let samples = channel;
  if (channel.length < length) {
    samples = new Float32Array(length);
    samples.set(channel);
  }
  const [shelf, highPass] = kWeighting(rate);
  const weighted = filter(filter(samples, shelf), highPass);
  const sums = new Float64Array(weighted.length + 1);
  for (let i = 0; i < weighted.length; i += 1) sums[i + 1] = sums[i] + weighted[i] * weighted[i];
  return sums;
}

/** Mean-square power of windows of `length` samples every `hop` samples, summed over channels (weight 1 each). */
function windowPowers(sums: readonly Float64Array[], length: number, hop: number) {
  const frames = sums[0].length - 1;
  const powers: number[] = [];
  for (let start = 0; start + length <= frames; start += hop) {
    let power = 0;
    for (const channel of sums) power += (channel[start + length] - channel[start]) / length;
    powers.push(power);
  }
  return powers;
}

function gatedLoudness(powers: readonly number[]) {
  const above = powers.filter((power) => loudnessOf(power) > ABSOLUTE_GATE);
  if (above.length === 0) return -Infinity;
  const threshold = loudnessOf(mean(above)) + RELATIVE_GATE;
  const kept = above.filter((power) => loudnessOf(power) > threshold);
  return kept.length > 0 ? loudnessOf(mean(kept)) : -Infinity;
}

function percentile(sorted: readonly number[], q: number) {
  const position = (sorted.length - 1) * q;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

/** EBU Tech 3342: short-term values every second, gated at −70 LUFS and 20 LU under their mean, 95th less 10th. */
function loudnessRange(powers: readonly number[]) {
  const above = powers.filter((power) => loudnessOf(power) > ABSOLUTE_GATE);
  if (above.length === 0) return 0;
  const threshold = loudnessOf(mean(above)) + RANGE_RELATIVE_GATE;
  const kept = above.map(loudnessOf).filter((value) => value > threshold).sort((a, b) => a - b);
  return kept.length > 0 ? percentile(kept, 0.95) - percentile(kept, 0.1) : 0;
}

/** A Hann-windowed sinc interpolator: one row of taps for each in-between phase of the 4x oversampling. */
const PHASES = Array.from({ length: OVERSAMPLE }, (_, phase) => Array.from({ length: TAPS_PER_PHASE }, (_, tap) => {
  const x = tap - TAPS_PER_PHASE / 2 + 1 - phase / OVERSAMPLE;
  const sinc = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
  return sinc * (0.5 + 0.5 * Math.cos((Math.PI * x) / (TAPS_PER_PHASE / 2 + 1)));
}));

/** The highest absolute value, between samples too (BS.1770-4 Annex 2, 4x oversampling). */
export function truePeak(channels: Channels) {
  const half = TAPS_PER_PHASE / 2;
  let peak = 0;
  for (const channel of channels) {
    for (let i = 0; i < channel.length; i += 1) {
      peak = Math.max(peak, Math.abs(channel[i]));
      for (let phase = 1; phase < OVERSAMPLE; phase += 1) {
        const taps = PHASES[phase];
        let value = 0;
        for (let tap = 0; tap < TAPS_PER_PHASE; tap += 1) {
          const index = i + tap - half + 1;
          if (index >= 0 && index < channel.length) value += channel[index] * taps[tap];
        }
        peak = Math.max(peak, Math.abs(value));
      }
    }
  }
  return peak;
}

/**
 * Measures channels of -1..1 samples (mono, or left and right). The momentary and short-term maxima pad a clip
 * shorter than their window with silence, so a short effect still gets a momentary value.
 */
export function measureLoudness(channels: Channels, rate: number): Loudness {
  const frames = channels[0]?.length ?? 0;
  const block = Math.round(0.4 * rate);
  const shortTerm = Math.round(3 * rate);
  const hop = Math.round(0.1 * rate);
  const sums = channels.map((channel) => squareSums(channel, rate));
  const momentary = frames >= block ? windowPowers(sums, block, hop) : windowPowers(channels.map((channel) => squareSums(channel, rate, block)), block, hop);
  const short = frames >= shortTerm ? windowPowers(sums, shortTerm, hop) : windowPowers(channels.map((channel) => squareSums(channel, rate, shortTerm)), shortTerm, hop);
  let samplePeak = 0;
  for (const channel of channels) for (const value of channel) samplePeak = Math.max(samplePeak, Math.abs(value));
  return {
    seconds: frames / rate,
    integrated: frames >= block ? gatedLoudness(momentary) : -Infinity,
    momentaryMax: Math.max(-Infinity, ...momentary.map(loudnessOf)),
    shortTermMax: Math.max(-Infinity, ...short.map(loudnessOf)),
    range: frames >= shortTerm ? loudnessRange(windowPowers(sums, shortTerm, rate)) : 0,
    samplePeak: toDb(samplePeak),
    truePeak: toDb(truePeak(channels)),
  };
}

/** Reads a WAV file (PCM 8/16/24/32-bit or 32/64-bit float, any channel count) into channels of -1..1 samples. */
export function readWav(bytes: Uint8Array): { rate: number; channels: Float32Array[] } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (at: number) => String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]);
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('not a WAV file');
  let format: { code: number; count: number; rate: number; bits: number } | null = null;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const id = tag(offset);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === 'fmt ') {
      const code = view.getUint16(body, true);
      // WAVE_FORMAT_EXTENSIBLE keeps the real format at the head of its sub-format GUID.
      format = { code: code === 0xfffe ? view.getUint16(body + 24, true) : code, count: view.getUint16(body + 2, true), rate: view.getUint32(body + 4, true), bits: view.getUint16(body + 14, true) };
    } else if (id === 'data') {
      if (!format) throw new Error('WAV data before its format');
      const { code, count, rate, bits } = format;
      const width = bits / 8;
      const frames = Math.floor(Math.min(size, bytes.length - body) / (width * count));
      const channels = Array.from({ length: count }, () => new Float32Array(frames));
      const read = code === 3
        ? (at: number) => (bits === 64 ? view.getFloat64(at, true) : view.getFloat32(at, true))
        : bits === 8 ? (at: number) => (view.getUint8(at) - 128) / 128
          : bits === 16 ? (at: number) => view.getInt16(at, true) / 32768
            : bits === 24 ? (at: number) => (((view.getInt8(at + 2) << 16) | (view.getUint8(at + 1) << 8) | view.getUint8(at)) / 8388608)
              : bits === 32 ? (at: number) => view.getInt32(at, true) / 2147483648
                : null;
      if (!read) throw new Error(`unsupported ${bits}-bit WAV`);
      for (let frame = 0; frame < frames; frame += 1) {
        for (let channel = 0; channel < count; channel += 1) channels[channel][frame] = read(body + (frame * count + channel) * width);
      }
      return { rate, channels };
    }
    offset = body + size + (size % 2);
  }
  throw new Error('WAV without a data chunk');
}

/** Writes channels of -1..1 samples as a 32-bit float WAV (recorded mixes keep their headroom this way). */
export function writeFloatWav(channels: Channels, rate: number) {
  const frames = channels[0].length;
  const count = channels.length;
  const bytes = new Uint8Array(44 + frames * count * 4);
  const view = new DataView(bytes.buffer);
  const tag = (at: number, text: string) => { for (let i = 0; i < 4; i += 1) bytes[at + i] = text.charCodeAt(i); };
  tag(0, 'RIFF');
  view.setUint32(4, 36 + frames * count * 4, true);
  tag(8, 'WAVE');
  tag(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 3, true);
  view.setUint16(22, count, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * count * 4, true);
  view.setUint16(32, count * 4, true);
  view.setUint16(34, 32, true);
  tag(36, 'data');
  view.setUint32(40, frames * count * 4, true);
  for (let frame = 0; frame < frames; frame += 1) {
    for (let channel = 0; channel < count; channel += 1) view.setFloat32(44 + (frame * count + channel) * 4, channels[channel][frame], true);
  }
  return bytes;
}
