import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LEGACY_META_KEY,
  SAVE_BACKUP_KEY,
  SAVE_KEY,
  SAVE_VERSION,
  createDefaultMeta,
  createDefaultOptions,
  createDefaultProfile,
  loadGameSave,
  recordStageResult,
  sanitizeOptions,
  sanitizeProfile,
  saveGameSave,
} from './save.ts';

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    values,
  };
}

test('current save round-trips meta and options', () => {
  const storage = createStorage();
  const meta = createDefaultMeta();
  const options = createDefaultOptions();
  meta.gold = 987;
  options.reducedFlash = true;
  assert.equal(saveGameSave(storage, { meta, options, profile: createDefaultProfile() }).ok, true);
  const loaded = loadGameSave(storage);
  assert.equal(loaded.status, 'ok');
  assert.equal(loaded.data.meta.gold, 987);
  assert.equal(loaded.data.options.reducedFlash, true);
});

test('legacy raw meta migrates and invalid ranges are clamped', () => {
  const storage = createStorage({
    [LEGACY_META_KEY]: JSON.stringify({
      gold: -10,
      xp: 12.8,
      level: 0,
      passivePoints: 3,
      progress: { chapter: 99, stage: -2 },
      upgrades: { attack: 999 },
      passives: { rareLuck: 9 },
    }),
  });
  const loaded = loadGameSave(storage);
  assert.equal(loaded.status, 'migrated');
  assert.equal(loaded.data.meta.gold, 0);
  assert.equal(loaded.data.meta.xp, 12);
  assert.deepEqual(loaded.data.meta.progress, { chapter: 5, stage: 1 });
  assert.equal(loaded.data.meta.upgrades.attack, 30);
  assert.equal(loaded.data.meta.passives.rareLuck, 5);
});

test('corrupt primary recovers from backup', () => {
  const data = { version: SAVE_VERSION, savedAt: 1, meta: createDefaultMeta(), options: createDefaultOptions(), profile: createDefaultProfile() };
  data.meta.gold = 444;
  const storage = createStorage({
    [SAVE_KEY]: '{broken',
    [SAVE_BACKUP_KEY]: JSON.stringify(data),
  });
  const loaded = loadGameSave(storage);
  assert.equal(loaded.status, 'recovered');
  assert.equal(loaded.data.meta.gold, 444);
  assert.ok(loaded.warnings.includes('primary:corrupt'));
});

test('future or malformed saves fall back without throwing', () => {
  const future = createStorage({ [SAVE_KEY]: JSON.stringify({ version: 999 }) });
  const futureResult = loadGameSave(future);
  assert.equal(futureResult.status, 'defaulted');
  assert.equal(futureResult.writable, false);
  assert.ok(futureResult.warnings.includes('primary:future-version'));
  const malformed = createStorage({ [SAVE_KEY]: '[]' });
  assert.equal(loadGameSave(malformed).writable, true);
});

test('storage failures are contained', () => {
  const failing = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
  };
  assert.equal(loadGameSave(failing).status, 'defaulted');
  assert.equal(saveGameSave(failing, { meta: createDefaultMeta(), options: createDefaultOptions(), profile: createDefaultProfile() }).ok, false);
});

test('options saved before auto-pause existed load with auto-pause on', () => {
  const legacy = { ...createDefaultOptions() } as Partial<ReturnType<typeof createDefaultOptions>>;
  delete legacy.autoPause;
  assert.equal(sanitizeOptions(legacy).autoPause, true);
  assert.equal(sanitizeOptions({ ...legacy, autoPause: false }).autoPause, false);
});

test('options saved before the settings screen load with the new settings at their defaults (UI-04, G17)', () => {
  const legacy = { ...createDefaultOptions() } as Partial<ReturnType<typeof createDefaultOptions>>;
  delete legacy.uiScale;
  delete legacy.reducedMotion;
  delete legacy.hitReaction;
  assert.equal(sanitizeOptions(legacy).uiScale, 1);
  assert.equal(sanitizeOptions(legacy).reducedMotion, false);
  assert.equal(sanitizeOptions({ ...legacy, uiScale: 2 }).uiScale, 1.3, 'the HUD scale stays within 80-130%');
  assert.equal(sanitizeOptions({ ...legacy, uiScale: 0.5 }).uiScale, 0.8);
  assert.equal(sanitizeOptions({ ...legacy, reducedMotion: true }).reducedMotion, true);
  assert.equal(sanitizeOptions(legacy).hitReaction, 1, 'full hit reaction until set (FX-02)');
  assert.equal(sanitizeOptions({ ...legacy, hitReaction: 3 }).hitReaction, 1);
});

test('profiles saved before onboarding hints load with none seen (UI-09, G17)', () => {
  const legacy = { ...createDefaultProfile() } as Partial<ReturnType<typeof createDefaultProfile>>;
  delete legacy.hintsSeen;
  assert.deepEqual(sanitizeProfile(legacy).hintsSeen, []);
  assert.deepEqual(sanitizeProfile({ ...legacy, hintsSeen: ['move', 'move', 7, 'xp'] }).hintsSeen, ['move', 'xp']);
});

test('showcase pacing from older saves maps to standard outside developer builds', () => {
  const options = { ...createDefaultOptions(), paceMode: 'showcase' };
  assert.equal(sanitizeOptions(options, false).paceMode, 'standard');
  assert.equal(sanitizeOptions(options, true).paceMode, 'showcase');
  assert.equal(sanitizeOptions({ ...options, paceMode: 'turbo' }, true).paceMode, 'standard');
});

test('practice pace is a shipped option (CON-02)', () => {
  const options = { ...createDefaultOptions(), paceMode: 'practice' };
  assert.equal(sanitizeOptions(options, false).paceMode, 'practice');
});

test('a v2 save migrates to v3 with its progress and an empty profile, and is written back as v3 (TEC-08)', () => {
  const meta = { ...createDefaultMeta(), gold: 777, progress: { chapter: 3, stage: 4 } };
  const storage = createStorage({ [SAVE_KEY]: JSON.stringify({ version: 2, savedAt: 1, meta, options: { ...createDefaultOptions(), volume: 0.5 } }) });
  const loaded = loadGameSave(storage);
  assert.equal(loaded.status, 'migrated');
  assert.equal(loaded.writable, true);
  assert.equal(loaded.data.meta.gold, 777);
  assert.deepEqual(loaded.data.meta.progress, { chapter: 3, stage: 4 });
  assert.equal(loaded.data.options.volume, 0.5);
  assert.equal(loaded.data.options.musicVolume, createDefaultOptions().musicVolume, 'new options get defaults');
  assert.deepEqual(loaded.data.profile, createDefaultProfile());
  saveGameSave(storage, loaded.data);
  assert.equal(JSON.parse(storage.values.get(SAVE_KEY) ?? '{}').version, 3);
  assert.equal(JSON.parse(storage.values.get(SAVE_BACKUP_KEY) ?? '{}').version, 2, 'the v2 original stays as the backup');
  assert.equal(SAVE_VERSION, 3);
});

test('the v3 profile round-trips and rejects impossible records', () => {
  const profile = {
    stageRecords: {
      '1-1': { attempts: 3, clears: 5, bestKills: 40, bestClearSeconds: 212.5 },
      '9-1': { attempts: 1, clears: 1, bestKills: 1, bestClearSeconds: 10 },
      '2-12': { attempts: 1, clears: 0, bestKills: 1, bestClearSeconds: 10 },
      'x': { attempts: 1 },
    },
    characters: { selected: 'ghost', unlocked: ['other', 'other'] },
    codex: { enemies: ['a', 'a', 7], bosses: 'nope', skills: ['needleStorm'] },
    achievements: { first: { unlockedAt: 5 }, bad: 3 },
    runSuspend: { savedAt: 1, rulesVersion: 2, state: { tick: 9 } },
  };
  const clean = sanitizeProfile(profile);
  assert.deepEqual(Object.keys(clean.stageRecords), ['1-1']);
  assert.equal(clean.stageRecords['1-1'].clears, 3, 'clears never exceed attempts');
  assert.deepEqual(clean.characters, { selected: 'gyeol', unlocked: ['gyeol', 'other'] });
  assert.deepEqual(clean.codex, { enemies: ['a'], bosses: [], skills: ['needleStorm'] });
  assert.deepEqual(clean.achievements, { first: { unlockedAt: 5 } });
  assert.deepEqual(clean.runSuspend, { savedAt: 1, rulesVersion: 2, state: { tick: 9 } });
  const storage = createStorage();
  saveGameSave(storage, { meta: createDefaultMeta(), options: createDefaultOptions(), profile: clean });
  assert.deepEqual(loadGameSave(storage).data.profile, clean);
});

test('stage results fold into records; practice runs are not recorded', () => {
  let profile = createDefaultProfile();
  profile = recordStageResult(profile, { chapter: 1, stage: 2, cleared: false, kills: 30, clearSeconds: 120, practice: false });
  profile = recordStageResult(profile, { chapter: 1, stage: 2, cleared: true, kills: 25, clearSeconds: 480, practice: false });
  profile = recordStageResult(profile, { chapter: 1, stage: 2, cleared: true, kills: 90, clearSeconds: 470, practice: false });
  const unchanged = recordStageResult(profile, { chapter: 1, stage: 2, cleared: true, kills: 999, clearSeconds: 150, practice: true });
  assert.equal(unchanged, profile);
  assert.deepEqual(profile.stageRecords['1-2'], { attempts: 3, clears: 2, bestKills: 90, bestClearSeconds: 470, bonus: false });
});

test('a bonus goal met on a clear stars the stage for good; a defeat or a later miss never takes it away (CON-03)', () => {
  let profile = createDefaultProfile();
  profile = recordStageResult(profile, { chapter: 2, stage: 3, cleared: false, kills: 300, clearSeconds: 200, practice: false, bonus: true });
  assert.equal(profile.stageRecords['2-3'].bonus, false, 'a defeat cannot star the stage');
  profile = recordStageResult(profile, { chapter: 2, stage: 3, cleared: true, kills: 800, clearSeconds: 480, practice: false, bonus: true });
  profile = recordStageResult(profile, { chapter: 2, stage: 3, cleared: true, kills: 700, clearSeconds: 480, practice: false, bonus: false });
  assert.equal(profile.stageRecords['2-3'].bonus, true);
  // A save that claims a star without a clear is sanitized.
  const loaded = sanitizeProfile({ stageRecords: { '2-4': { attempts: 1, clears: 0, bestKills: 5, bestClearSeconds: null, bonus: true }, '2-3': profile.stageRecords['2-3'] } });
  assert.equal(loaded.stageRecords['2-4'].bonus, false);
  assert.equal(loaded.stageRecords['2-3'].bonus, true);
});
