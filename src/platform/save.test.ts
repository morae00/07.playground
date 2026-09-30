import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LEGACY_META_KEY,
  SAVE_BACKUP_KEY,
  SAVE_KEY,
  SAVE_VERSION,
  createDefaultMeta,
  createDefaultOptions,
  loadGameSave,
  sanitizeOptions,
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
  assert.equal(saveGameSave(storage, { meta, options }).ok, true);
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
  const data = { version: SAVE_VERSION, savedAt: 1, meta: createDefaultMeta(), options: createDefaultOptions() };
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
  assert.equal(saveGameSave(failing, { meta: createDefaultMeta(), options: createDefaultOptions() }).ok, false);
});

test('options saved before auto-pause existed load with auto-pause on', () => {
  const legacy = { ...createDefaultOptions() } as Partial<ReturnType<typeof createDefaultOptions>>;
  delete legacy.autoPause;
  assert.equal(sanitizeOptions(legacy).autoPause, true);
  assert.equal(sanitizeOptions({ ...legacy, autoPause: false }).autoPause, false);
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
