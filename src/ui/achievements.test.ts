import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ACHIEVEMENTS from '../content/data/achievements.ts';
import CODEX from '../content/data/codex.ts';
import COSMETICS from '../content/data/cosmetics.ts';
import { createDefaultMeta, createDefaultProfile, loadGameSave, sanitizeProfile, type ProfileData } from '../platform/save.ts';
import { ACHIEVEMENT_IDS, achievementProgress, newlyMet, unlockAchievements } from './achievements.ts';

// Achievements (CON-07): worked out from the save alone, so an older save earns what it already did (G17).
const record = (clears: number, extra: object = {}) => ({ attempts: clears, clears, bestKills: 100, bestClearSeconds: 300, bonus: false, assisted: false, bestSurvivalSeconds: 300, noHit: false, lowDamage: false, swift: false, ...extra });

test('30 achievements, each with its own cosmetic, and no outline or trail in a signal colour (V2)', () => {
  assert.equal(ACHIEVEMENT_IDS.length, 30);
  const rewards = ACHIEVEMENT_IDS.map((id) => ACHIEVEMENTS.achievements[id].reward);
  assert.equal(new Set(rewards).size, 30);
  for (const reward of rewards) assert.ok(COSMETICS.cosmetics[reward], `${reward} is a cosmetic`);
  const signals = ['#00a8c6', '#007c94', '#ef5b4f', '#b8352b', '#d88d16', '#86b82d', '#805ad5'];
  for (const cosmetic of Object.values(COSMETICS.cosmetics)) assert.ok(!cosmetic.color || !signals.includes(cosmetic.color.toLowerCase()));
  // The codex goals ask for exactly what the codex lists.
  for (const id of ACHIEVEMENT_IDS) {
    const def = ACHIEVEMENTS.achievements[id];
    if (def.kind === 'codex') assert.equal(def.n, def.part ? CODEX[def.part].length : Object.values(CODEX).reduce((sum, ids) => sum + ids.length, 0), id);
  }
});

test('progress counts clears, chapters, stars, career totals, the codex, and the longest endless run', () => {
  const profile: ProfileData = {
    ...createDefaultProfile(),
    stageRecords: { '1-1': record(1, { bonus: true, lowDamage: true }), '1-10': record(2, { noHit: true, swift: true }), '1-2': record(0) },
    stats: { runs: 120, clears: 3, kills: 12_000, bossKills: 4, playSeconds: 900 },
    codex: { ...createDefaultProfile().codex, skills: [...CODEX.skills], enemies: ['1-stalker', 'stale-id'] },
  };
  const meta = { ...createDefaultMeta(), level: 12 };
  const of = (id: keyof typeof ACHIEVEMENTS.achievements, best = 0) => achievementProgress(ACHIEVEMENTS.achievements[id], profile, meta, best);
  assert.deepEqual(of('first-clear'), { value: 1, goal: 1 });
  assert.deepEqual(of('all-stages'), { value: 2, goal: 50 });
  assert.deepEqual(of('chapter-1'), { value: 1, goal: 1 });
  assert.deepEqual(of('chapter-2'), { value: 0, goal: 1 });
  assert.deepEqual(of('level-10'), { value: 10, goal: 10 }, 'progress stops at the goal');
  assert.deepEqual(of('stars-10'), { value: 5, goal: 10 }, '1-1 has three stars, 1-10 two');
  assert.deepEqual(of('perfect-1'), { value: 1, goal: 1 });
  assert.deepEqual([of('kills-10k').value, of('runs-100').value, of('bosses-10').value], [10_000, 100, 4]);
  assert.deepEqual([of('no-hit').value, of('swift-5').value], [1, 1]);
  assert.deepEqual([of('codex-skills').value, of('codex-enemies').value], [17, 1], 'ids the codex does not list do not count');
  assert.deepEqual([of('survive-600', 412).value, of('survive-600', 640.5).value], [412, 600]);
  const met = newlyMet(profile, meta, 0);
  assert.deepEqual(met, ['first-clear', 'chapter-1', 'level-10', 'perfect-1', 'kills-1k', 'kills-10k', 'no-hit', 'codex-skills', 'runs-100']);

  const unlocked = unlockAchievements(profile, met, 1_790_000_000_000);
  assert.deepEqual(unlocked.achievements['no-hit'], { unlockedAt: 1_790_000_000_000 });
  assert.ok(unlocked.cosmetics.owned.includes('title-flawless') && unlocked.cosmetics.owned.length === met.length);
  assert.deepEqual(newlyMet(unlocked, meta, 0), [], 'met once');
});

test('UI-15: a 0.1.0 save earns the chapter goals its progress passed, though it migrates with no stage records', () => {
  const { samples } = JSON.parse(readFileSync(new URL('../platform/fixtures/saves-0.1.0.json', import.meta.url), 'utf8')) as { samples: { name: string; entries: Record<string, string> }[] };
  const storage = (entries: Record<string, string>) => ({ getItem: (key: string) => entries[key] ?? null, setItem() {} });
  let earned = 0;
  for (const sample of samples) {
    const { data } = loadGameSave(storage(sample.entries));
    const met = newlyMet(data.profile, data.meta, 0).filter((id) => id.startsWith('chapter-'));
    const passed = [1, 2, 3, 4, 5].filter((chapter) => data.meta.progress.chapter > chapter).map((chapter) => `chapter-${chapter}`);
    assert.deepEqual(met, passed, sample.name);
    earned += met.length;
  }
  assert.ok(earned >= 4, `the fixtures include chapters already finished (${earned})`);
});

test('only an owned cosmetic can be worn, whatever a save says', () => {
  const loaded = sanitizeProfile({ cosmetics: { owned: ['trail-dots', 'trail-dots', 7], trail: 'trail-dots', outline: 'outline-indigo', title: 42 } });
  assert.deepEqual(loaded.cosmetics, { owned: ['trail-dots'], outline: null, trail: 'trail-dots', frame: null, title: null });
});
