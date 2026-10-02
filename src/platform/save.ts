import { CAMPAIGN_CHAPTER_COUNT, STAGES_PER_CHAPTER } from '../content/campaign.ts';
import { DEVELOPER_UI_AVAILABLE } from './developerAccess.ts';
import { DEFAULT_MOVE_KEYS, sanitizeMoveKeys, type MoveKeys } from './moveKeys.ts';

export type MetaUpgradeId = 'attack' | 'defense' | 'maxHp' | 'moveSpeed' | 'crit' | 'regen' | 'magnet';
export type PassiveId = 'rareLuck' | 'bossHunter' | 'coinMagnet';
/** standard; practice = short stages without unlocks (CON-02); showcase = developer builds only. */
export type PaceMode = 'standard' | 'practice' | 'showcase';

export type StageProgress = {
  chapter: number;
  stage: number;
};

export type MetaState = {
  gold: number;
  xp: number;
  level: number;
  passivePoints: number;
  progress: StageProgress;
  upgrades: Record<MetaUpgradeId, number>;
  passives: Record<PassiveId, number>;
};

export type GameOptions = {
  healthBars: 'all' | 'elite' | 'off';
  volume: number;
  effects: number;
  damageNumbers: boolean;
  screenShake: boolean;
  reducedFlash: boolean;
  paceMode: PaceMode;
  /** Pause the run when the window loses focus, is hidden, or the gamepad disconnects (BUG-03). */
  autoPause: boolean;
  /** Music and effects levels relative to the master volume (TEC-08); the mixer's buses apply them (AUD-01). */
  musicVolume: number;
  sfxVolume: number;
  /** Size of the in-run HUD, 0.8-1.3 (UI-04); each HUD cluster scales from its own corner. */
  uiScale: number;
  /** Reduced motion even when the system does not ask for it (UI-04); the system setting always applies too. */
  reducedMotion: boolean;
  /** UI-08: the keyboard keys that move the hero (key codes); the arrows always move too. */
  moveKeys: MoveKeys;
  /** How far a struck body recoils, 0-1 (FX-02). Presentation only: it never changes the simulation. */
  hitReaction: number;
  /**
   * Assists (SYS-07): the share of damage the player takes (0.5-1), enemy speed (0.8-1), and a 0.8 game speed. They
   * change the simulation, so an assisted run never counts on the infinite board and marks its stage record (G15, G16).
   */
  assistDamage: number;
  assistEnemySpeed: number;
  assistSlowGame: boolean;
};

/** Per-stage record, keyed "<chapter>-<stage>". Practice runs are not recorded. */
export type StageRecord = {
  attempts: number;
  clears: number;
  bestKills: number;
  /** Fastest clear in simulated seconds, or null before the first clear. */
  bestClearSeconds: number | null;
  /** The stage's bonus goal was met on a clear (CON-03); the menu shows a star. */
  bonus: boolean;
  /** A recorded run of this stage had assists on (SYS-07, G16); the record says so. */
  assisted: boolean;
  /** CON-07: the longest any attempt lasted, in simulated seconds. */
  bestSurvivalSeconds: number;
  /** CON-07: a clear that took no damage at all. */
  noHit: boolean;
  /** CON-07: a clear that took less damage than the hero's max health (the third star). */
  lowDamage: boolean;
  /** CON-07: a boss stage cleared before the boss enraged (a boss stage's second star, where a normal stage has its bonus goal). */
  swift: boolean;
};

/** CON-07: a stage's three stars: the clear, its bonus goal (a boss stage: the boss beaten before it enraged), and a clear that took less damage than max health. */
export function stageStars(record: StageRecord | undefined): readonly [boolean, boolean, boolean] {
  return record ? [record.clears > 0, record.bonus || record.swift, record.lowDamage] : [false, false, false];
}

/** CON-07: totals over every run, campaign and infinite. Saves from before CON-07 start from their stage records. */
export type CareerStats = { runs: number; clears: number; kills: number; bossKills: number; playSeconds: number };

/**
 * Save v3 profile (TEC-08): room for the systems R3 adds (characters, codex, achievements, run suspension),
 * so they arrive without another migration. Stage records are filled in now.
 */
export type ProfileData = {
  stageRecords: Record<string, StageRecord>;
  characters: { selected: string; unlocked: string[] };
  /** CON-07: codex entries found (src/content/data/codex.ts ids). */
  codex: { enemies: string[]; bosses: string[]; skills: string[]; terrain: string[]; chapters: string[] };
  achievements: Record<string, { unlockedAt: number }>;
  runSuspend: null | { savedAt: number; rulesVersion: number; state: unknown };
  /** Onboarding hints already shown (UI-09); each shows once per save. */
  hintsSeen: string[];
  /** CON-06: story beats already played (src/ui/story.ts); each plays once per save, and the codex plays them again. */
  storySeen: string[];
  stats: CareerStats;
  /** CON-07: cosmetics owned (unlocked by achievements or bought with gold) and the one worn of each kind. */
  cosmetics: { owned: string[]; outline: string | null; trail: string | null; frame: string | null; title: string | null };
};

export type SaveData = {
  meta: MetaState;
  options: GameOptions;
  profile: ProfileData;
};

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export const SAVE_VERSION = 3;
/**
 * The key keeps its old name on purpose: an older build reads version 3 here, sees a future version, and
 * refuses to write, so rolling back never overwrites newer progress.
 */
export const SAVE_KEY = 'blackline-survivor-save-v2';
export const DEFAULT_CHARACTER = 'gyeol';
export const SAVE_BACKUP_KEY = `${SAVE_KEY}.backup`;
export const LEGACY_META_KEY = 'blackline-survivor-meta-v1';

const UPGRADE_LIMITS: Record<MetaUpgradeId, number> = {
  attack: 30,
  defense: 25,
  maxHp: 30,
  moveSpeed: 20,
  crit: 20,
  regen: 20,
  magnet: 25,
};

/** Ten points a branch since the CON-07 passive tree (catalog metaPassives). */
const PASSIVE_LIMITS: Record<PassiveId, number> = {
  rareLuck: 10,
  bossHunter: 10,
  coinMagnet: 10,
};

export const createDefaultMeta = (): MetaState => ({
  gold: 120,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 1, stage: 1 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});

export const createDefaultOptions = (): GameOptions => ({
  healthBars: 'elite',
  volume: 0.32,
  effects: 0.9,
  damageNumbers: true,
  screenShake: true,
  reducedFlash: false,
  paceMode: 'standard',
  autoPause: true,
  musicVolume: 0.8,
  sfxVolume: 1,
  uiScale: 1,
  reducedMotion: false,
  moveKeys: DEFAULT_MOVE_KEYS,
  hitReaction: 1,
  assistDamage: 1,
  assistEnemySpeed: 1,
  assistSlowGame: false,
});

/** Any assist on (SYS-07). */
export const assistsOn = (options: GameOptions) => options.assistDamage < 1 || options.assistEnemySpeed < 1 || options.assistSlowGame;

export const createDefaultProfile = (): ProfileData => ({
  stageRecords: {},
  characters: { selected: DEFAULT_CHARACTER, unlocked: [DEFAULT_CHARACTER] },
  codex: { enemies: [], bosses: [], skills: [], terrain: [], chapters: [] },
  achievements: {},
  runSuspend: null,
  hintsSeen: [],
  storySeen: [],
  stats: { runs: 0, clears: 0, kills: 0, bossKills: 0, playSeconds: 0 },
  cosmetics: { owned: [], outline: null, trail: null, frame: null, title: null },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const normalized = Math.max(min, Math.min(max, value));
  return integer ? Math.floor(normalized) : normalized;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

export function sanitizeMeta(value: unknown): MetaState {
  const fallback = createDefaultMeta();
  if (!isRecord(value)) return fallback;
  const progress = isRecord(value.progress) ? value.progress : {};
  const upgrades = isRecord(value.upgrades) ? value.upgrades : {};
  const passives = isRecord(value.passives) ? value.passives : {};

  return {
    gold: finiteNumber(value.gold, fallback.gold, 0, Number.MAX_SAFE_INTEGER, true),
    xp: finiteNumber(value.xp, fallback.xp, 0, Number.MAX_SAFE_INTEGER, true),
    level: finiteNumber(value.level, fallback.level, 1, 10_000, true),
    passivePoints: finiteNumber(value.passivePoints, fallback.passivePoints, 0, 10_000, true),
    progress: {
      chapter: finiteNumber(progress.chapter, 1, 1, CAMPAIGN_CHAPTER_COUNT, true),
      stage: finiteNumber(progress.stage, 1, 1, STAGES_PER_CHAPTER, true),
    },
    upgrades: Object.fromEntries(
      (Object.keys(UPGRADE_LIMITS) as MetaUpgradeId[]).map((id) => [id, finiteNumber(upgrades[id], 0, 0, UPGRADE_LIMITS[id], true)]),
    ) as Record<MetaUpgradeId, number>,
    passives: Object.fromEntries(
      (Object.keys(PASSIVE_LIMITS) as PassiveId[]).map((id) => [id, finiteNumber(passives[id], 0, 0, PASSIVE_LIMITS[id], true)]),
    ) as Record<PassiveId, number>,
  };
}

export function sanitizeOptions(value: unknown, allowShowcase = DEVELOPER_UI_AVAILABLE): GameOptions {
  const fallback = createDefaultOptions();
  if (!isRecord(value)) return fallback;
  return {
    healthBars: value.healthBars === 'all' || value.healthBars === 'elite' || value.healthBars === 'off' ? value.healthBars : fallback.healthBars,
    volume: finiteNumber(value.volume, fallback.volume, 0, 1),
    effects: finiteNumber(value.effects, fallback.effects, 0.25, 1),
    damageNumbers: booleanValue(value.damageNumbers, fallback.damageNumbers),
    screenShake: booleanValue(value.screenShake, fallback.screenShake),
    reducedFlash: booleanValue(value.reducedFlash, fallback.reducedFlash),
    // Saves made while showcase pacing was selectable keep working but fall back to standard outside developer builds (G17).
    paceMode: value.paceMode === 'practice' ? 'practice' : value.paceMode === 'showcase' && allowShowcase ? 'showcase' : 'standard',
    autoPause: booleanValue(value.autoPause, fallback.autoPause),
    musicVolume: finiteNumber(value.musicVolume, fallback.musicVolume, 0, 1),
    sfxVolume: finiteNumber(value.sfxVolume, fallback.sfxVolume, 0, 1),
    uiScale: finiteNumber(value.uiScale, fallback.uiScale, 0.8, 1.3),
    reducedMotion: booleanValue(value.reducedMotion, fallback.reducedMotion),
    moveKeys: value.moveKeys === undefined ? fallback.moveKeys : sanitizeMoveKeys(value.moveKeys),
    hitReaction: finiteNumber(value.hitReaction, fallback.hitReaction, 0, 1),
    assistDamage: finiteNumber(value.assistDamage, fallback.assistDamage, 0.5, 1),
    assistEnemySpeed: finiteNumber(value.assistEnemySpeed, fallback.assistEnemySpeed, 0.8, 1),
    assistSlowGame: booleanValue(value.assistSlowGame, fallback.assistSlowGame),
  };
}

const STAGE_KEY = /^([1-9]\d?)-([1-9]\d?)$/;

function stringList(value: unknown, limit = 512) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0 && item.length <= 64))].slice(0, limit);
}

export function sanitizeProfile(value: unknown): ProfileData {
  const fallback = createDefaultProfile();
  if (!isRecord(value)) return fallback;
  const stageRecords: Record<string, StageRecord> = {};
  if (isRecord(value.stageRecords)) {
    for (const [key, record] of Object.entries(value.stageRecords)) {
      const match = STAGE_KEY.exec(key);
      if (!match || !isRecord(record)) continue;
      const [chapter, stage] = [Number(match[1]), Number(match[2])];
      if (chapter > CAMPAIGN_CHAPTER_COUNT || stage > STAGES_PER_CHAPTER) continue;
      const attempts = finiteNumber(record.attempts, 0, 0, Number.MAX_SAFE_INTEGER, true);
      const clears = Math.min(attempts, finiteNumber(record.clears, 0, 0, Number.MAX_SAFE_INTEGER, true));
      const best = record.bestClearSeconds;
      const bestClearSeconds = clears > 0 && typeof best === 'number' && Number.isFinite(best) && best > 0 ? best : null;
      stageRecords[key] = {
        attempts,
        clears,
        bestKills: finiteNumber(record.bestKills, 0, 0, Number.MAX_SAFE_INTEGER, true),
        bestClearSeconds,
        bonus: clears > 0 && record.bonus === true,
        assisted: record.assisted === true,
        // A clear lasted at least its best time, for records from before CON-07.
        bestSurvivalSeconds: finiteNumber(record.bestSurvivalSeconds, bestClearSeconds ?? 0, 0, 86_400),
        noHit: clears > 0 && record.noHit === true,
        lowDamage: clears > 0 && record.lowDamage === true,
        swift: clears > 0 && record.swift === true,
      };
    }
  }
  const characters = isRecord(value.characters) ? value.characters : {};
  const unlocked = stringList(characters.unlocked);
  if (!unlocked.includes(DEFAULT_CHARACTER)) unlocked.unshift(DEFAULT_CHARACTER);
  const selected = typeof characters.selected === 'string' && unlocked.includes(characters.selected) ? characters.selected : DEFAULT_CHARACTER;
  const codex = isRecord(value.codex) ? value.codex : {};
  const achievements: Record<string, { unlockedAt: number }> = {};
  if (isRecord(value.achievements)) {
    for (const [id, entry] of Object.entries(value.achievements)) {
      if (id.length > 64 || !isRecord(entry)) continue;
      achievements[id] = { unlockedAt: finiteNumber(entry.unlockedAt, 0, 0, Number.MAX_SAFE_INTEGER, true) };
    }
  }
  const suspend = value.runSuspend;
  const runSuspend = isRecord(suspend) && typeof suspend.savedAt === 'number' && typeof suspend.rulesVersion === 'number'
    ? { savedAt: suspend.savedAt, rulesVersion: suspend.rulesVersion, state: suspend.state ?? null }
    : null;
  return {
    stageRecords,
    characters: { selected, unlocked },
    codex: sanitizeCodex(codex, stageRecords),
    achievements,
    runSuspend,
    hintsSeen: stringList(value.hintsSeen, 64),
    storySeen: Array.isArray(value.storySeen) ? stringList(value.storySeen, 16) : passedStory(stageRecords),
    stats: sanitizeStats(value.stats, stageRecords),
    cosmetics: sanitizeCosmetics(value.cosmetics),
  };
}

/**
 * CON-06: the story beats a save from before them has already passed, so a returning player is not stopped for them
 * (G17): the intro of every chapter it played (the prologue for the first), and the outro of every chapter it finished
 * (and the ending after the last). The codex can still play them.
 */
function passedStory(records: Record<string, StageRecord>) {
  const passed: string[] = [];
  for (let chapter = 1; chapter <= CAMPAIGN_CHAPTER_COUNT; chapter += 1) {
    if (Object.keys(records).some((key) => key.startsWith(`${chapter}-`))) passed.push(chapter === 1 ? 'prologue' : `intro-${chapter}`);
    if ((records[`${chapter}-${STAGES_PER_CHAPTER}`]?.clears ?? 0) > 0) passed.push(`outro-${chapter}`, ...(chapter === CAMPAIGN_CHAPTER_COUNT ? ['ending'] : []));
  }
  return passed;
}

/** CON-07: only an owned cosmetic can be worn. */
function sanitizeCosmetics(value: unknown): ProfileData['cosmetics'] {
  const cosmetics = isRecord(value) ? value : {};
  const owned = stringList(cosmetics.owned, 128);
  const worn = (field: unknown) => (typeof field === 'string' && owned.includes(field) ? field : null);
  return { owned, outline: worn(cosmetics.outline), trail: worn(cosmetics.trail), frame: worn(cosmetics.frame), title: worn(cosmetics.title) };
}

/**
 * CON-07: the codex as saved. A codex from before CON-07 (it has no chapters list) is given what its stage records
 * show, once (G17): every chapter played, the four enemy roles of a chapter with kills, the boss of every boss stage
 * cleared, and the needles every run starts with.
 */
function sanitizeCodex(codex: Record<string, unknown>, records: Record<string, StageRecord>): ProfileData['codex'] {
  const found = { enemies: stringList(codex.enemies), bosses: stringList(codex.bosses), skills: stringList(codex.skills), terrain: stringList(codex.terrain), chapters: stringList(codex.chapters) };
  if (Array.isArray(codex.chapters)) return found;
  const played = Object.entries(records).filter(([, record]) => record.attempts > 0);
  const retro = {
    chapters: played.map(([key]) => key.split('-')[0]),
    enemies: played.filter(([, record]) => record.bestKills > 0).flatMap(([key]) => ['stalker', 'charger', 'shooter', 'warden'].map((role) => `${key.split('-')[0]}-${role}`)),
    bosses: played.filter(([key, record]) => record.clears > 0 && (key.endsWith('-5') || key.endsWith('-10'))).map(([key]) => stageBossId(key)),
    skills: played.length > 0 ? ['needleStorm'] : [],
    terrain: [],
  };
  return mergeCodex(found, retro);
}

/** The round boss of a boss stage key ("<chapter>-5" or "<chapter>-10"), as the catalog names them (roundBosses; save.test.ts checks). */
export function stageBossId(key: string) {
  const [chapter, stage] = key.split('-');
  return `s${chapter}-${stage === '5' ? 'mid' : 'final'}-${ROUND_BOSS_PATTERNS[`${chapter}-${stage}`] ?? ''}`;
}

const ROUND_BOSS_PATTERNS: Record<string, string> = {
  '1-5': 'dash', '1-10': 'rings', '2-5': 'clones', '2-10': 'flame', '3-5': 'tide',
  '3-10': 'traps', '4-5': 'clock', '4-10': 'saw', '5-5': 'eclipse', '5-10': 'null',
};

type CodexFinds = Partial<Record<keyof ProfileData['codex'], readonly string[]>>;

function mergeCodex(codex: ProfileData['codex'], found: CodexFinds): ProfileData['codex'] {
  const merged = { ...codex };
  for (const part of ['enemies', 'bosses', 'skills', 'terrain', 'chapters'] as const) {
    const more = (found[part] ?? []).filter((id, index, all) => !merged[part].includes(id) && all.indexOf(id) === index);
    if (more.length > 0) merged[part] = [...merged[part], ...more];
  }
  return merged;
}

/** CON-07: adds what a run found to the codex. */
export function recordCodex(profile: ProfileData, found: CodexFinds): ProfileData {
  return { ...profile, codex: mergeCodex(profile.codex, found) };
}

/** CON-07: a save from before the career totals starts from what its stage records show (G17). */
function sanitizeStats(value: unknown, records: Record<string, StageRecord>): CareerStats {
  const count = (field: unknown) => finiteNumber(field, 0, 0, Number.MAX_SAFE_INTEGER, true);
  if (isRecord(value)) return { runs: count(value.runs), clears: count(value.clears), kills: count(value.kills), bossKills: count(value.bossKills), playSeconds: count(value.playSeconds) };
  const all = Object.entries(records);
  return {
    runs: all.reduce((sum, [, record]) => sum + record.attempts, 0),
    clears: all.reduce((sum, [, record]) => sum + record.clears, 0),
    kills: all.reduce((sum, [, record]) => sum + record.bestKills, 0),
    bossKills: all.reduce((sum, [key, record]) => sum + (key.endsWith('-5') || key.endsWith('-10') ? record.clears : 0), 0),
    playSeconds: Math.floor(all.reduce((sum, [, record]) => sum + (record.bestClearSeconds ?? 0) * record.clears, 0)),
  };
}

/** Folds one campaign result into the stage records. Practice runs leave the records alone (CON-02). */
export type StageResult = {
  chapter: number;
  stage: number;
  cleared: boolean;
  kills: number;
  clearSeconds: number;
  practice: boolean;
  bonus?: boolean;
  assisted?: boolean;
  /** CON-07: for the no-hit and low-damage marks and a boss stage's swift clear. */
  damageTaken?: number;
  maxHp?: number;
  stageKind?: 'normal' | 'midBoss' | 'finalBoss';
  enraged?: boolean;
};

const EMPTY_RECORD: StageRecord = { attempts: 0, clears: 0, bestKills: 0, bestClearSeconds: null, bonus: false, assisted: false, bestSurvivalSeconds: 0, noHit: false, lowDamage: false, swift: false };

export function recordStageResult(profile: ProfileData, result: StageResult): ProfileData {
  if (result.practice) return profile;
  const key = `${result.chapter}-${result.stage}`;
  const previous = { ...EMPTY_RECORD, ...profile.stageRecords[key] };
  const bestClearSeconds = result.cleared
    ? Math.min(previous.bestClearSeconds ?? Number.POSITIVE_INFINITY, result.clearSeconds)
    : previous.bestClearSeconds;
  const taken = result.damageTaken ?? Number.POSITIVE_INFINITY;
  return {
    ...profile,
    stageRecords: {
      ...profile.stageRecords,
      [key]: {
        attempts: previous.attempts + 1,
        clears: previous.clears + (result.cleared ? 1 : 0),
        bestKills: Math.max(previous.bestKills, result.kills),
        bestClearSeconds: Number.isFinite(bestClearSeconds ?? Number.NaN) ? bestClearSeconds : null,
        bonus: previous.bonus || (result.cleared && result.bonus === true),
        assisted: previous.assisted || result.assisted === true,
        bestSurvivalSeconds: Math.max(previous.bestSurvivalSeconds, result.clearSeconds),
        noHit: previous.noHit || (result.cleared && taken === 0),
        lowDamage: previous.lowDamage || (result.cleared && taken < (result.maxHp ?? 0)),
        swift: previous.swift || (result.cleared && result.stageKind !== undefined && result.stageKind !== 'normal' && result.enraged === false),
      },
    },
  };
}

/** CON-07: adds a run to the career totals, whatever its mode. */
export function recordCareer(profile: ProfileData, result: { cleared: boolean; kills: number; bossKills: number; clearSeconds: number }): ProfileData {
  const { stats } = profile;
  return {
    ...profile,
    stats: {
      runs: stats.runs + 1,
      clears: stats.clears + (result.cleared ? 1 : 0),
      kills: stats.kills + result.kills,
      bossKills: stats.bossKills + result.bossKills,
      playSeconds: stats.playSeconds + Math.floor(result.clearSeconds),
    },
  };
}

/** Parses a v3 envelope, or migrates a v2 one (meta and options carry over; the profile starts empty). */
function parseEnvelope(raw: string): { data: SaveData; migrated: boolean } | null {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) return null;
  if (parsed.version === SAVE_VERSION) {
    return {
      data: { meta: sanitizeMeta(parsed.meta), options: sanitizeOptions(parsed.options), profile: sanitizeProfile(parsed.profile) },
      migrated: false,
    };
  }
  if (parsed.version === 2) {
    const options = sanitizeOptions(parsed.options);
    // 0.1.0's one setting, reduced flash, also stilled motion; a player who chose it keeps both now that they are two
    // settings (UI-08, G17).
    return {
      data: { meta: sanitizeMeta(parsed.meta), options: options.reducedFlash ? { ...options, reducedMotion: true } : options, profile: createDefaultProfile() },
      migrated: true,
    };
  }
  return null;
}

const defaultSave = (): SaveData => ({ meta: createDefaultMeta(), options: createDefaultOptions(), profile: createDefaultProfile() });

export type LoadSaveResult = {
  data: SaveData;
  status: 'ok' | 'migrated' | 'recovered' | 'defaulted';
  warnings: string[];
  writable: boolean;
};

export function loadGameSave(storage: StorageLike): LoadSaveResult {
  const warnings: string[] = [];
  const read = (key: string) => {
    try {
      return storage.getItem(key);
    } catch {
      warnings.push(`read:${key}`);
      return null;
    }
  };

  const primary = read(SAVE_KEY);
  if (primary) {
    try {
      const parsed: unknown = JSON.parse(primary);
      if (isRecord(parsed) && typeof parsed.version === 'number' && parsed.version > SAVE_VERSION) {
        return {
          data: defaultSave(),
          status: 'defaulted',
          warnings: [...warnings, 'primary:future-version'],
          writable: false,
        };
      }
      const envelope = parseEnvelope(primary);
      if (envelope) return { data: envelope.data, status: envelope.migrated ? 'migrated' : 'ok', warnings, writable: true };
      warnings.push('primary:unsupported');
    } catch {
      warnings.push('primary:corrupt');
    }
  }

  const backup = read(SAVE_BACKUP_KEY);
  if (backup) {
    try {
      const envelope = parseEnvelope(backup);
      if (envelope) return { data: envelope.data, status: 'recovered', warnings, writable: true };
      warnings.push('backup:unsupported');
    } catch {
      warnings.push('backup:corrupt');
    }
  }

  const legacy = read(LEGACY_META_KEY);
  if (legacy) {
    try {
      return {
        data: { meta: sanitizeMeta(JSON.parse(legacy)), options: createDefaultOptions(), profile: createDefaultProfile() },
        status: 'migrated',
        warnings,
        writable: true,
      };
    } catch {
      warnings.push('legacy:corrupt');
    }
  }

  return {
    data: defaultSave(),
    status: 'defaulted',
    warnings,
    writable: true,
  };
}

export function saveGameSave(storage: StorageLike, data: SaveData) {
  const envelope = JSON.stringify({
    version: SAVE_VERSION,
    savedAt: Date.now(),
    meta: sanitizeMeta(data.meta),
    options: sanitizeOptions(data.options),
    profile: sanitizeProfile(data.profile),
  });

  try {
    const previous = storage.getItem(SAVE_KEY);
    if (previous) storage.setItem(SAVE_BACKUP_KEY, previous);
    storage.setItem(SAVE_KEY, envelope);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : 'storage unavailable' };
  }
}
