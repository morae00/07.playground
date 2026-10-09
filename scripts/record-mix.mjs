// Records the game's mix bus by bus and measures it (AUD-05, cue sheet §7): drives the developer build in Chromium
// through a few scenes with GOD on, taps each mixer bus (music, sfx, ui, ambience) before the master volume and the
// limiter's output after it, and reports the loudness of each (src/game/audio/loudness.ts). Bus levels include the
// default options (music 0.8, effects 1); master volume is left out, as it moves everything alike.
// Usage: npm run measure:mix   (builds dist-developer unless RECORD_SKIP_BUILD=1)
//   RECORD_SCENES="1-1:60,3-5:45" chapter-stage:seconds; RECORD_WARMUP=15 seconds of play before each recording;
//   RECORD_WAV=1 also writes each tap as a float WAV under artifacts/audio/.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import { measureLoudness, writeFloatWav } from '../src/game/audio/loudness.ts';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'dist-developer');
const reportDir = path.join(root, 'artifacts/audio');
const scenes = (process.env.RECORD_SCENES ?? '1-1:60,3-5:45').split(',').map((scene) => {
  const [stage, seconds] = scene.split(':');
  const [chapter, stageNo] = stage.split('-').map(Number);
  return { name: stage, chapter, stage: stageNo, seconds: Number(seconds) };
});
const warmup = Number(process.env.RECORD_WARMUP ?? 15);
const TAPS = ['music', 'sfx', 'ui', 'ambience', 'limiter'];

/**
 * Runs in the page before the app: the mixer builds limiter → destination, master → limiter, then its buses →
 * master in the order music, sfx, ui, ambience (src/game/audio/mixer.ts). Each one gets a recording tap.
 */
function installTaps(busNames) {
  const recorder = { recording: false, rate: 0, taps: {} };
  window.__mixRecorder = recorder;
  const connect = AudioNode.prototype.connect;
  let limiter = null;
  let master = null;
  let buses = 0;
  const tap = (node, name) => {
    const context = node.context;
    const processor = context.createScriptProcessor(4096, 2, 2);
    const store = { left: [], right: [] };
    recorder.taps[name] = store;
    processor.onaudioprocess = (event) => {
      if (!recorder.recording) return;
      store.left.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      store.right.push(new Float32Array(event.inputBuffer.getChannelData(1)));
    };
    const silent = context.createGain();
    silent.gain.value = 0;
    connect.call(node, processor);
    connect.call(processor, silent);
    connect.call(silent, context.destination);
  };
  AudioNode.prototype.connect = function patched(target, ...rest) {
    const result = connect.call(this, target, ...rest);
    if (!limiter && this instanceof DynamicsCompressorNode && target === this.context.destination) {
      limiter = this;
      recorder.rate = this.context.sampleRate;
      tap(this, 'limiter');
    } else if (limiter && !master && this instanceof GainNode && target === limiter) {
      master = this;
    } else if (master && this instanceof GainNode && target === master && buses < busNames.length) {
      tap(this, busNames[buses]);
      buses += 1;
    }
    return result;
  };
}

if (process.env.RECORD_SKIP_BUILD !== '1') {
  await build({ configFile: path.join(root, 'vite.config.ts'), mode: 'developer', logLevel: 'error', build: { outDir, emptyOutDir: true } });
}
const server = await preview({ configFile: path.join(root, 'vite.config.ts'), mode: 'developer', logLevel: 'error', build: { outDir }, preview: { host: '127.0.0.1', port: 5179, strictPort: true } });
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const report = { recordedAt: new Date().toISOString(), warmup, scenes: [] };
try {
  for (const scene of scenes) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.addInitScript(installTaps, TAPS.slice(0, 4));
    await page.goto('http://127.0.0.1:5179/');
    await page.getByRole('heading', { name: '흑백 타격 생존전' }).waitFor();
    const devToggle = page.getByRole('checkbox', { name: '개발자 모드: 모든 Stage 접근' });
    if (!(await devToggle.isChecked())) await devToggle.check();
    await page.locator('.chapterCard', { hasText: `${scene.chapter} ·` }).first().click();
    await page.locator('.stageNode').filter({ has: page.locator('span', { hasText: new RegExp(`^Stage ${scene.stage}$`) }) }).click();
    await page.getByRole('button', { name: `Ch.${scene.chapter} / St.${scene.stage} 출정` }).click();
    if (await page.locator('.storyPanels').waitFor({ timeout: 3000 }).then(() => true, () => false)) await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    const opener = page.getByRole('button', { name: '개발 패널 열기' });
    if (await opener.count()) await opener.click();
    await page.getByPlaceholder('CODE', { exact: true }).fill('GOD');
    await page.getByPlaceholder('CODE', { exact: true }).press('Enter');
    const closer = page.getByRole('button', { name: '개발 패널 닫기' });
    if (await closer.count()) await closer.click();
    // Drafts take their first card, so the run keeps going.
    const play = async (seconds) => {
      const end = Date.now() + seconds * 1000;
      while (Date.now() < end) {
        if (await page.locator('.draftCard').count()) {
          await page.waitForTimeout(500);
          await page.keyboard.press('1');
        }
        await page.waitForTimeout(500);
      }
    };
    await play(warmup);
    await page.evaluate(() => { window.__mixRecorder.recording = true; });
    await play(scene.seconds);
    await page.evaluate(() => { window.__mixRecorder.recording = false; });
    const rate = await page.evaluate(() => window.__mixRecorder.rate);
    const result = { name: scene.name, seconds: scene.seconds, rate, taps: {} };
    for (const name of TAPS) {
      // Float32 samples cross over as base64, one channel at a time.
      const channels = [];
      for (const side of ['left', 'right']) {
        const base64 = await page.evaluate(([tapName, channel]) => {
          const chunks = window.__mixRecorder.taps[tapName]?.[channel] ?? [];
          const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const joined = new Float32Array(length);
          let at = 0;
          for (const chunk of chunks) {
            joined.set(chunk, at);
            at += chunk.length;
          }
          const bytes = new Uint8Array(joined.buffer);
          let text = '';
          for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return btoa(text);
        }, [name, side]);
        const buffer = Buffer.from(base64, 'base64');
        channels.push(new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4));
      }
      if (channels[0].length === 0) {
        result.taps[name] = null;
        continue;
      }
      const loudness = measureLoudness(channels, rate);
      result.taps[name] = Object.fromEntries(Object.entries(loudness).map(([key, value]) => [key, Number.isFinite(value) ? Math.round(value * 10) / 10 : null]));
      if (process.env.RECORD_WAV === '1') {
        await mkdir(reportDir, { recursive: true });
        await writeFile(path.join(reportDir, `mix-${scene.name}-${name}.wav`), writeFloatWav(channels, rate));
      }
    }
    report.scenes.push(result);
    const row = (name) => {
      const tap = result.taps[name];
      return tap ? `${name.padEnd(8)} integrated ${String(tap.integrated).padStart(6)}  short-term max ${String(tap.shortTermMax).padStart(6)}  momentary max ${String(tap.momentaryMax).padStart(6)}  LRA ${String(tap.range).padStart(5)}  true peak ${String(tap.truePeak).padStart(6)}` : `${name.padEnd(8)} silent`;
    };
    console.log(`${scene.name} (${scene.seconds} s after ${warmup} s, ${rate} Hz)`);
    for (const name of TAPS) console.log(`  ${row(name)}`);
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
await mkdir(reportDir, { recursive: true });
await writeFile(path.join(reportDir, 'mix-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`report: ${path.relative(process.cwd(), path.join(reportDir, 'mix-report.json'))}`);
