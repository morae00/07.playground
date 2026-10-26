import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_MOVE_KEYS } from './moveKeys.ts';
import CATALOG from '../content/data/catalog.ts';
import {
  LEGACY_META_KEY,
  SAVE_BACKUP_KEY,
  SAVE_KEY,
  SAVE_VERSION,
  chapterFinished,
  createDefaultMeta,
  createDefaultOptions,
  createDefaultProfile,
  loadGameSave,
  loadNotice,
  recordCareer,
  recordCodex,
  recordStageResult,
  stageBossId,
  stageStars,
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
      passives: { rareLuck: 14 },
    }),
  });
  const loaded = loadGameSave(storage);
  assert.equal(loaded.status, 'migrated');
  assert.equal(loaded.data.meta.gold, 0);
  assert.equal(loaded.data.meta.xp, 12);
  assert.deepEqual(loaded.data.meta.progress, { chapter: 5, stage: 1 });
  assert.equal(loaded.data.meta.upgrades.attack, 30);
  assert.equal(loaded.data.meta.passives.rareLuck, 10, 'a branch of the passive tree holds ten points (CON-07)');
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

test('a load the player must hear about says which: newer build, restored, or started over; a first launch says nothing (UI-18)', () => {
  const current = JSON.stringify({ version: SAVE_VERSION, savedAt: 1, meta: createDefaultMeta(), options: createDefaultOptions(), profile: createDefaultProfile() });
  const v2 = JSON.stringify({ version: 2, savedAt: 1, meta: createDefaultMeta(), options: createDefaultOptions() });
  const notice = (entries: Record<string, string>) => loadNotice(loadGameSave(createStorage(entries)));
  assert.equal(notice({}), null, 'a first launch');
  assert.equal(notice({ [SAVE_KEY]: current }), null);
  assert.equal(notice({ [SAVE_KEY]: v2 }), null, 'a 0.1.0 save moving up');
  assert.equal(notice({ [SAVE_KEY]: JSON.stringify({ version: 999 }) }), 'future');
  assert.equal(notice({ [SAVE_KEY]: '{broken', [SAVE_BACKUP_KEY]: current }), 'recovered');
  assert.equal(notice({ [SAVE_BACKUP_KEY]: current }), 'recovered', 'the save itself is gone');
  assert.equal(notice({ [SAVE_KEY]: '{broken', [LEGACY_META_KEY]: JSON.stringify(createDefaultMeta()) }), 'recovered', 'from the oldest copy');
  assert.equal(notice({ [SAVE_KEY]: '{broken' }), 'reset');
  assert.equal(notice({ [SAVE_KEY]: '[]', [SAVE_BACKUP_KEY]: '{broken' }), 'reset');
  const unreadable = { getItem() { throw new Error('denied'); }, setItem() {} };
  assert.equal(loadNotice(loadGameSave(unreadable)), 'reset');
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
  assert.deepEqual(sanitizeOptions(legacy).moveKeys, DEFAULT_MOVE_KEYS, 'WASD until the keys are chosen (UI-08)');
  const ijkl = { moveUp: 'KeyI', moveDown: 'KeyK', moveLeft: 'KeyJ', moveRight: 'KeyL' };
  assert.deepEqual({ ...sanitizeOptions({ ...legacy, moveKeys: ijkl }).moveKeys }, ijkl);
  assert.deepEqual(sanitizeOptions({ ...legacy, moveKeys: { ...ijkl, moveUp: 'KeyP' } }).moveKeys, DEFAULT_MOVE_KEYS, 'a reserved key falls back to WASD');
  assert.equal(sanitizeOptions({ ...legacy, hitReaction: 3 }).hitReaction, 1);
});

test('profiles saved before onboarding hints load with none seen (UI-09, G17)', () => {
  const legacy = { ...createDefaultProfile() } as Partial<ReturnType<typeof createDefaultProfile>>;
  delete legacy.hintsSeen;
  assert.deepEqual(sanitizeProfile(legacy).hintsSeen, []);
  assert.deepEqual(sanitizeProfile({ ...legacy, hintsSeen: ['move', 'move', 7, 'xp'] }).hintsSeen, ['move', 'xp']);
});

test('profiles saved before the story have seen what their records passed, so a returning player is not stopped (CON-06, G17)', () => {
  const record = (clears: number) => ({ attempts: Math.max(1, clears), clears, bestKills: 0, bestClearSeconds: clears ? 300 : null, bonus: false, assisted: false, bestSurvivalSeconds: 300, noHit: false, lowDamage: false, swift: false });
  const legacy = { ...createDefaultProfile(), stageRecords: { '1-3': record(1), '1-10': record(1), '2-1': record(0) } } as Partial<ReturnType<typeof createDefaultProfile>>;
  delete legacy.storySeen;
  assert.deepEqual(sanitizeProfile(legacy).storySeen, ['prologue', 'outro-1', 'intro-2']);
  assert.deepEqual(sanitizeProfile({ stageRecords: { '5-10': record(2) } }).storySeen, ['intro-5', 'outro-5', 'ending']);
  assert.deepEqual(sanitizeProfile({}).storySeen, [], 'a new save plays the prologue');
  assert.deepEqual(sanitizeProfile({ ...legacy, storySeen: ['prologue', 'prologue', 3] }).storySeen, ['prologue'], 'a save with the list keeps it');
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

test('a chapter is finished by its tenth stage\'s record, or by progress past it, as a migrated 0.1.0 save has (UI-15)', () => {
  const migrated = { ...createDefaultMeta(), progress: { chapter: 3, stage: 4 } };
  const profile = createDefaultProfile();
  assert.deepEqual([1, 2, 3, 4].map((chapter) => chapterFinished(profile, migrated, chapter)), [true, true, false, false]);
  const fresh = createDefaultMeta();
  const cleared = recordStageResult(profile, { chapter: 1, stage: 10, cleared: true, kills: 10, clearSeconds: 300, practice: false });
  assert.equal(chapterFinished(profile, fresh, 1), false);
  assert.equal(chapterFinished(cleared, fresh, 1), true, 'a record alone counts too');
  const lost = recordStageResult(profile, { chapter: 1, stage: 10, cleared: false, kills: 10, clearSeconds: 300, practice: false });
  assert.equal(chapterFinished(lost, { ...fresh, progress: { chapter: 1, stage: 10 } }, 1), false, 'reaching the tenth stage is not clearing it');
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
  assert.deepEqual(clean.characters, { selected: 'gyeol', unlocked: ['gyeol', 'other'], levels: {} });
  // CON-10: upgrade levels keep whole numbers in range.
  assert.deepEqual(sanitizeProfile({ ...profile, characters: { selected: 'dan', unlocked: ['dan'], levels: { dan: 3.6, gyeol: 99, bad: 'x' } } }).characters, { selected: 'dan', unlocked: ['gyeol', 'dan'], levels: { dan: 3, gyeol: 10, bad: 0 } });
  // A codex from before CON-07 also gets what the 1-1 record shows (G17): its chapter and that chapter's enemies.
  assert.deepEqual(clean.codex, { enemies: ['a', '1-stalker', '1-charger', '1-shooter', '1-warden'], bosses: [], skills: ['needleStorm'], terrain: [], chapters: ['1'] });
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
  assert.deepEqual(profile.stageRecords['1-2'], { attempts: 3, clears: 2, bestKills: 90, bestClearSeconds: 470, bonus: false, assisted: false, bestSurvivalSeconds: 480, noHit: false, lowDamage: false, swift: false });
});

test('a stage keeps three stars: the clear, its bonus goal or a swift boss, and a clear under max health in damage (CON-07)', () => {
  let profile = createDefaultProfile();
  assert.deepEqual(stageStars(profile.stageRecords['1-5']), [false, false, false]);
  const bossRun = { chapter: 1, stage: 5, kills: 200, clearSeconds: 400, practice: false, stageKind: 'midBoss', maxHp: 300 } as const;
  profile = recordStageResult(profile, { ...bossRun, cleared: false, damageTaken: 0, enraged: false });
  assert.deepEqual(stageStars(profile.stageRecords['1-5']), [false, false, false], 'a defeat earns nothing, however clean');
  assert.equal(profile.stageRecords['1-5'].bestSurvivalSeconds, 400);
  profile = recordStageResult(profile, { ...bossRun, cleared: true, damageTaken: 420, enraged: true });
  assert.deepEqual(stageStars(profile.stageRecords['1-5']), [true, false, false]);
  profile = recordStageResult(profile, { ...bossRun, cleared: true, damageTaken: 120, enraged: false });
  assert.deepEqual(stageStars(profile.stageRecords['1-5']), [true, true, true], 'beaten before it enraged, with less damage than max health');
  assert.equal(profile.stageRecords['1-5'].noHit, false);
  profile = recordStageResult(profile, { ...bossRun, cleared: true, damageTaken: 0, enraged: true });
  assert.equal(profile.stageRecords['1-5'].noHit, true, 'a clear without a hit');
  // A normal stage's second star is its bonus goal; a swift flag does not apply to it.
  profile = recordStageResult(profile, { chapter: 1, stage: 4, cleared: true, kills: 300, clearSeconds: 480, practice: false, stageKind: 'normal', enraged: false, damageTaken: 50, maxHp: 300 });
  assert.deepEqual(stageStars(profile.stageRecords['1-4']), [true, false, true]);
});

test('career totals add up every run, and a save from before them starts from its stage records (CON-07, G17)', () => {
  let profile = createDefaultProfile();
  profile = recordCareer(profile, { cleared: true, kills: 300, bossKills: 2, clearSeconds: 480.6 });
  profile = recordCareer(profile, { cleared: false, kills: 40, bossKills: 0, clearSeconds: 61 });
  assert.deepEqual(profile.stats, { runs: 2, clears: 1, kills: 340, bossKills: 2, playSeconds: 541 });
  const older = sanitizeProfile({ stageRecords: { '1-4': { attempts: 3, clears: 2, bestKills: 210, bestClearSeconds: 470 }, '1-5': { attempts: 2, clears: 1, bestKills: 150, bestClearSeconds: 600 } } });
  assert.deepEqual(older.stats, { runs: 5, clears: 3, kills: 360, bossKills: 1, playSeconds: 1540 });
  assert.equal(older.stageRecords['1-4'].bestSurvivalSeconds, 470, 'a clear lasted at least its best time');
  assert.deepEqual(sanitizeProfile({ ...older, stats: { runs: 9, clears: -1, kills: 'x' } }).stats, { runs: 9, clears: 0, kills: 0, bossKills: 0, playSeconds: 0 });
});

test('assists load clamped and off by default, and an assisted run marks its stage record (SYS-07, G16)', () => {
  assert.deepEqual(
    [createDefaultOptions().assistDamage, createDefaultOptions().assistEnemySpeed, createDefaultOptions().assistSlowGame],
    [1, 1, false],
  );
  const loaded = sanitizeOptions({ assistDamage: 0.1, assistEnemySpeed: 2, assistSlowGame: 'yes' });
  assert.deepEqual([loaded.assistDamage, loaded.assistEnemySpeed, loaded.assistSlowGame], [0.5, 1, false]);
  let profile = recordStageResult(createDefaultProfile(), { chapter: 1, stage: 2, cleared: true, kills: 10, clearSeconds: 300, practice: false });
  assert.equal(profile.stageRecords['1-2'].assisted, false);
  profile = recordStageResult(profile, { chapter: 1, stage: 2, cleared: false, kills: 5, clearSeconds: 60, practice: false, assisted: true });
  profile = recordStageResult(profile, { chapter: 1, stage: 2, cleared: true, kills: 20, clearSeconds: 280, practice: false });
  assert.equal(profile.stageRecords['1-2'].assisted, true, 'the record keeps saying an assisted run is in it');
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

test('the codex keeps what runs found, and an older save finds what its records show once (CON-07, G17)', () => {
  const records = {
    '1-5': { attempts: 2, clears: 1, bestKills: 150, bestClearSeconds: 600 },
    '2-10': { attempts: 1, clears: 1, bestKills: 400, bestClearSeconds: 610 },
    '3-2': { attempts: 1, clears: 0, bestKills: 0, bestClearSeconds: null },
  };
  const older = sanitizeProfile({ stageRecords: records, codex: { skills: ['fanKnives'] } });
  assert.deepEqual(older.codex.chapters, ['1', '2', '3']);
  assert.deepEqual(older.codex.bosses, ['s1-mid-dash', 's2-final-flame']);
  assert.equal(older.codex.enemies.length, 8, 'the two chapters with kills; 3-2 had none');
  assert.deepEqual(older.codex.skills, ['fanKnives', 'needleStorm']);
  const later = sanitizeProfile({ stageRecords: records, codex: { ...older.codex, enemies: ['1-stalker'] } });
  assert.deepEqual(later.codex.enemies, ['1-stalker'], 'a codex from CON-07 on is kept as saved');
  const found = recordCodex(later, { enemies: ['1-stalker', '2-warden', '2-warden'], terrain: ['fire'] });
  assert.deepEqual([found.codex.enemies, found.codex.terrain], [['1-stalker', '2-warden'], ['fire']]);
});

test('boss stage keys name the catalog\'s round bosses (CON-07)', () => {
  for (const boss of CATALOG.roundBosses) assert.equal(stageBossId(`${boss.chapter}-${boss.role === 'mid' ? 5 : 10}`), boss.id);
});
