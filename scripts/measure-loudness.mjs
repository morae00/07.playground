// Measures the loudness of sound files (AUD-05): integrated loudness, momentary and short-term maxima, loudness range,
// and peaks (src/game/audio/loudness.ts), and for the game's packs also the level as the game plays them, with each
// cue's playback gain and the bus at its default option (master volume left out; it moves everything alike).
// Usage: npm run measure:loudness [-- <files or folders>] [--json]
//   With no paths it measures the SFX pack and, when there is one, the music pack.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { CUES, SAMPLE_PEAK, SYNTH_PEAK } from '../src/game/audioPolicy.ts';
import { AMBIENCE_LEVEL } from '../src/game/audio/mixer.ts';
import { MUSIC_LEVEL } from '../src/game/audio/musicPlayer.ts';
import { measureLoudness, readWav } from '../src/game/audio/loudness.ts';
import { createDefaultOptions } from '../src/platform/save.ts';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const json = args.includes('--json');
const targets = args.filter((arg) => !arg.startsWith('--'));
const DEFAULT_OPTIONS = createDefaultOptions();
const dB = (gain) => 20 * Math.log10(gain);
const fixed = (value) => (Number.isFinite(value) ? value.toFixed(1) : '—');

/** The gain a file plays at, from the pack's cue (or the music level) and the bus's default option. */
function playbackGain(pack, file) {
  if (pack.tracks) return MUSIC_LEVEL * DEFAULT_OPTIONS.musicVolume;
  const cue = Object.entries(pack.cues).find(([, files]) => files.includes(file))?.[0];
  const spec = cue ? CUES[cue] : null;
  if (!spec) return null;
  if (spec.bus === 'ambience') return AMBIENCE_LEVEL * DEFAULT_OPTIONS.musicVolume;
  return spec.synth.gain * (SYNTH_PEAK / SAMPLE_PEAK) * (spec.bus === 'music' ? DEFAULT_OPTIONS.musicVolume : DEFAULT_OPTIONS.sfxVolume);
}

function measureFile(file, pack = null) {
  const { rate, channels } = readWav(readFileSync(file));
  const result = measureLoudness(channels, rate);
  const name = path.basename(file);
  const gain = pack ? playbackGain(pack, name) : null;
  const cue = pack?.cues ? Object.entries(pack.cues).find(([, files]) => files.includes(name))?.[0] ?? null : null;
  return { file: path.relative(root, file), cue, bus: cue ? CUES[cue]?.bus ?? null : pack?.tracks ? 'music' : null, ...result, playedDb: gain === null ? null : dB(gain) };
}

function measureFolder(folder) {
  const manifest = path.join(folder, 'pack.json');
  const pack = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')) : null;
  return readdirSync(folder).filter((name) => name.toLowerCase().endsWith('.wav')).sort().map((name) => measureFile(path.join(folder, name), pack));
}

const defaults = ['public/assets/packs/sfx-common', 'public/assets/packs/music'].map((dir) => path.join(root, dir)).filter((dir) => existsSync(dir));
const rows = (targets.length ? targets.map((target) => path.resolve(target)) : defaults).flatMap((target) => (statSync(target).isDirectory() ? measureFolder(target) : [measureFile(target)]));

if (json) {
  console.log(JSON.stringify(rows, (key, value) => (typeof value === 'number' && !Number.isFinite(value) ? null : value), 1));
} else {
  console.log('| file | bus | s | integrated LUFS | momentary max | short-term max | LRA | true peak dBTP | played gain dB | played momentary max | played integrated |');
  console.log('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const row of rows) {
    const played = (value) => (row.playedDb === null ? '—' : fixed(value + row.playedDb));
    console.log(`| ${path.basename(row.file)} | ${row.bus ?? '—'} | ${row.seconds.toFixed(2)} | ${fixed(row.integrated)} | ${fixed(row.momentaryMax)} | ${fixed(row.shortTermMax)} | ${fixed(row.range)} | ${fixed(row.truePeak)} | ${row.playedDb === null ? '—' : fixed(row.playedDb)} | ${played(row.momentaryMax)} | ${played(row.integrated)} |`);
  }
}
