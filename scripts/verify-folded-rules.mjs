// Checks that the engine with its rule flags folded to the remaster values (scripts/lib/fold-rules.mjs, as app
// builds use it) plays exactly as the unfolded engine under the remaster rules (TEC-05). It builds both engines as
// headless test bundles, then compares seeded balance runs (four bot personas through normal, mid-boss, and final
// boss stages, and every chapter's opening) and the draw-call fingerprints of the remaster scenarios.
// Usage: npm run test:folded-rules   (a few minutes)
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build } from 'esbuild';
import { foldRuleReads } from './lib/fold-rules.mjs';
import { runBalanceBatch } from './lib/balance-runner.mjs';
import { personasById, runFullBalanceBatch } from './lib/full-balance-runner.mjs';
import { REMASTER_RULES } from '../src/game/rules.ts';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const work = await mkdtemp(path.join(os.tmpdir(), 'blackline-folded-rules-'));
const failures = [];
let folds = 0;
const bundle = (outfile, folded) => build({
  entryPoints: [path.join(root, 'src/testing/engine.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  logLevel: 'warning',
  plugins: folded ? [{
    name: 'fold-rules',
    setup(builder) {
      builder.onLoad({ filter: /src[\\/]game[\\/]GameEngine\.ts$/ }, async (args) => {
        const result = foldRuleReads(await readFile(args.path, 'utf8'), REMASTER_RULES);
        folds = result.count;
        return { contents: result.code, loader: 'ts' };
      });
    },
  }] : [],
});

try {
  const plain = path.join(work, 'plain.mjs');
  const folded = path.join(work, 'folded.mjs');
  await bundle(plain, false);
  await bundle(folded, true);
  console.log(`folded ${folds} rule reads in GameEngine.ts`);
  if (folds === 0) failures.push('nothing was folded');

  const opening = { frames: 1_800, seeds: [11, 29], stages: [1, 2, 3, 4, 5].map((chapter) => ({ chapter, stage: 1 })) };
  const [plainOpening, foldedOpening] = [await runBalanceBatch({ ...opening, bundlePath: plain }), await runBalanceBatch({ ...opening, bundlePath: folded })];
  console.log(`openings: ${plainOpening.fingerprint} / ${foldedOpening.fingerprint}`);
  if (plainOpening.fingerprint !== foldedOpening.fingerprint) failures.push('chapter openings differ');

  const played = {
    seeds: [17],
    stages: [{ chapter: 1, stage: 5 }, { chapter: 2, stage: 10 }, { chapter: 3, stage: 4 }, { chapter: 4, stage: 5 }, { chapter: 5, stage: 10 }],
    personas: personasById(['striker', 'survivor', 'novice', 'maxed']),
    maxFrames: 9_000,
  };
  const plainPlayed = await runFullBalanceBatch({ ...played, bundlePath: plain });
  const foldedPlayed = await runFullBalanceBatch({ ...played, bundlePath: folded });
  console.log(`played stages: ${plainPlayed.fingerprint} / ${foldedPlayed.fingerprint}`);
  if (plainPlayed.fingerprint !== foldedPlayed.fingerprint) failures.push('played stages differ');

  const fingerprints = {};
  for (const [name, file] of [['plain', plain], ['folded', folded]]) {
    const json = execFileSync(process.execPath, [path.join(root, 'scripts/draw-fingerprint.mjs'), file, name], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
    fingerprints[name] = path.join(work, `${name}.json`);
    await writeFile(fingerprints[name], json);
  }
  let compare = '';
  try {
    compare = execFileSync(process.execPath, [path.join(root, 'scripts/draw-fingerprint.mjs'), '--compare', fingerprints.plain, fingerprints.folded], { cwd: root, encoding: 'utf8' });
  } catch (error) {
    compare = String(error.stdout ?? '');
  }
  for (const line of compare.trim().split('\n')) {
    console.log(`draw ${line}`);
    // A classic scenario switches rule sets, which a folded engine cannot; it is the only one allowed to differ.
    if (line.startsWith('DIFF') && !/classic/.test(line)) failures.push(`draw ${line}`);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}

console.log(failures.length ? `folded rules differ:\n  ${failures.join('\n  ')}` : 'the folded engine plays the remaster rules exactly as the unfolded one');
process.exitCode = failures.length ? 1 : 0;
