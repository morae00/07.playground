// Chapter pack bench (ART-07, R2 exit): in the built desktop app, how long switching chapters takes to bring the
// chapter's sprite pack in, how much texture memory stays resident, and how big each pack is on disk.
// Budgets (docs/QUALITY_GATES.md): transition load <= 1.5 s, resident textures <= 96 MiB, pack <= 12 MiB.
// It launches Electron on the production build with a throwaway data folder (the player's save is never touched) and
// a seeded save that has every chapter open.
// Usage: npm run build && node scripts/pack-bench.mjs   (PACK_BENCH_ROUNDS, PACK_BENCH_REPORT)
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { _electron as electron } from 'playwright';
import { seedFileStorage } from './lib/seed-file-storage.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rounds = Number(process.env.PACK_BENCH_ROUNDS ?? '4');
const reportPath = path.resolve(process.env.PACK_BENCH_REPORT ?? path.join(root, 'artifacts/performance/pack-bench.json'));
const LIMITS = { transitionMs: 1500, residentMiB: 96, packMiB: 12 };

const manifest = JSON.parse(await readFile(path.join(root, 'dist/assets/atlas/manifest.json'), 'utf8'));

/** Width and height of a PNG or WebP (VP8, VP8L, VP8X) from its header. */
function imageSize(buffer) {
  if (buffer.readUInt32BE(0) === 0x89504e47) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  throw new Error('unknown image format');
}

/** A pack's images (its atlas pages and ground tile): bytes on disk, and decoded RGBA bytes as the GPU holds them. */
async function packSize(packId) {
  const pack = manifest.packs[packId];
  let disk = 0;
  let decoded = 0;
  for (const image of [...pack.pages, ...(pack.ground ? [pack.ground.file] : [])]) {
    const file = path.join(root, 'dist', image);
    disk += (await stat(file)).size;
    const { width, height } = imageSize(await readFile(file));
    decoded += width * height * 4;
  }
  return { diskMiB: +(disk / MiB).toFixed(2), decodedMiB: +(decoded / MiB).toFixed(2) };
}

const MiB = 2 ** 20;
const packs = {};
for (const packId of Object.keys(manifest.packs)) packs[packId] = await packSize(packId);
// The UI art sheets (ART-09, UI-06) are DOM images the page keeps decoded as well, whatever the chapter.
let uiDecoded = 0;
for (const name of await readdir(path.join(root, 'dist/assets'))) {
  if (!/\.(webp|png)$/.test(name)) continue;
  const { width, height } = imageSize(await readFile(path.join(root, 'dist/assets', name)));
  uiDecoded += width * height * 4;
}
const uiArtMiB = +(uiDecoded / MiB).toFixed(2);

const SAVE_KEY = 'blackline-survivor-save-v2';
const openSave = JSON.stringify({
  version: 3,
  savedAt: Date.UTC(2026, 9, 1),
  meta: { gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 5, stage: 10 } },
  options: {},
  profile: { hintsSeen: ['move', 'draft', 'pause', 'boss', 'shop', 'hazard'] },
});
const userDataDir = await realpath(await mkdtemp(path.join(os.tmpdir(), 'blackline-pack-bench-')));
// The open save goes in as a file: build's save, and the first launch moves it (TEC-15).
seedFileStorage(userDataDir, { [SAVE_KEY]: openSave });
const app = await electron.launch({
  args: [root, `--user-data-dir=${userDataDir}`],
  cwd: root,
});
const transitions = {};
try {
  let page = null;
  for (let tries = 0; tries < 200 && !page; tries += 1) {
    page = app.windows().find((candidate) => candidate.url().startsWith('app://game/index.html')) ?? null;
    if (!page) await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!page) throw new Error('the game window did not open');
  await page.locator('.chapterStrip .chapterCard').first().waitFor({ timeout: 20_000 });
  await page.waitForFunction(() => document.documentElement.dataset.sprites === 'ready', null, { timeout: 20_000 });
  // Times every change of the sprites marker: removed when a chapter's packs start to load, 'ready' when they are in.
  await page.evaluate(() => {
    const marks = [];
    window.__packMarks = marks;
    new MutationObserver(() => marks.push({ at: performance.now(), value: document.documentElement.dataset.sprites ?? null }))
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-sprites'] });
  });
  const cards = page.locator('.chapterStrip .chapterCard');
  const count = await cards.count();
  // Each round walks Ch2 to Ch5 and back to Ch1, so every chapter loads after another one was released.
  for (let round = 0; round < rounds; round += 1) {
    for (const index of [...Array.from({ length: count - 1 }, (_, i) => i + 1), 0]) {
      await page.evaluate(() => { window.__packMarks.length = 0; });
      const clicked = await page.evaluate(() => performance.now());
      await cards.nth(index).click();
      await page.waitForFunction(() => window.__packMarks.some((mark) => mark.value === 'ready' || mark.value === 'fallback'), null, { timeout: 10_000 });
      const marks = await page.evaluate(() => window.__packMarks);
      const done = marks.find((mark) => mark.value === 'ready' || mark.value === 'fallback');
      if (done.value !== 'ready') throw new Error(`chapter ${index + 1}: packs fell back`);
      (transitions[`chapter-0${index + 1}`] ??= []).push(+(done.at - clicked).toFixed(1));
    }
  }
} finally {
  await app.close().catch(() => undefined);
  await rm(userDataDir, { recursive: true, force: true });
}

const common = packs.common;
// The skill VFX stamps (FX-06, FX-07) and the terrain hazard stamps (K11) load with the common pack and stay for the session.
const skills = packs.skills ?? { decodedMiB: 0 };
const hazards = packs.hazards ?? { decodedMiB: 0 };
const chapters = Object.keys(transitions).sort().map((chapter) => {
  const times = [...transitions[chapter]].sort((a, b) => a - b);
  const pack = packs[chapter] ?? { diskMiB: 0, decodedMiB: 0 };
  const residentMiB = +(common.decodedMiB + skills.decodedMiB + hazards.decodedMiB + pack.decodedMiB + uiArtMiB).toFixed(2);
  return {
    chapter,
    transitionMs: { first: transitions[chapter][0], median: times[Math.floor((times.length - 1) / 2)], max: times.at(-1) },
    packDiskMiB: pack.diskMiB,
    residentMiB,
    passed: times.at(-1) <= LIMITS.transitionMs && residentMiB <= LIMITS.residentMiB && pack.diskMiB <= LIMITS.packMiB,
  };
});
const report = {
  version: 1,
  recordedAt: new Date().toISOString(),
  machine: { platform: process.platform, arch: process.arch, cpus: os.cpus()[0]?.model ?? 'unknown', memoryGiB: Math.round(os.totalmem() / 2 ** 30) },
  limits: LIMITS,
  rounds,
  packs,
  uiArtMiB,
  chapters,
  passed: chapters.every((chapter) => chapter.passed),
};
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
for (const chapter of chapters) {
  console.log(`${chapter.chapter}  load first ${chapter.transitionMs.first} ms, median ${chapter.transitionMs.median}, max ${chapter.transitionMs.max} | pack ${chapter.packDiskMiB} MiB on disk | resident ${chapter.residentMiB} MiB | ${chapter.passed ? 'PASS' : 'FAIL'}`);
}
console.log(`resident = common pack ${common.decodedMiB} MiB + skills pack ${skills.decodedMiB} MiB + hazards pack ${hazards.decodedMiB} MiB + UI art ${uiArtMiB} MiB + the chapter's pack (decoded RGBA)`);
console.log(`report: ${path.relative(root, reportPath)}`);
if (!report.passed) process.exitCode = 1;
