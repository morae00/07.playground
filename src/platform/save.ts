import { DEVELOPER_UI_AVAILABLE } from './developerAccess.ts';

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
};

export type SaveData = {
  meta: MetaState;
  options: GameOptions;
};

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export const SAVE_VERSION = 2;
export const SAVE_KEY = 'blackline-survivor-save-v2';
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

const PASSIVE_LIMITS: Record<PassiveId, number> = {
  rareLuck: 5,
  bossHunter: 5,
  coinMagnet: 5,
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
      chapter: finiteNumber(progress.chapter, 1, 1, 5, true),
      stage: finiteNumber(progress.stage, 1, 1, 10, true),
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
  };
}

function parseEnvelope(raw: string): SaveData | null {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== SAVE_VERSION) return null;
  return {
    meta: sanitizeMeta(parsed.meta),
    options: sanitizeOptions(parsed.options),
  };
}

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
          data: { meta: createDefaultMeta(), options: createDefaultOptions() },
          status: 'defaulted',
          warnings: [...warnings, 'primary:future-version'],
          writable: false,
        };
      }
      const data = parseEnvelope(primary);
      if (data) return { data, status: 'ok', warnings, writable: true };
      warnings.push('primary:unsupported');
    } catch {
      warnings.push('primary:corrupt');
    }
  }

  const backup = read(SAVE_BACKUP_KEY);
  if (backup) {
    try {
      const data = parseEnvelope(backup);
      if (data) return { data, status: 'recovered', warnings, writable: true };
      warnings.push('backup:unsupported');
    } catch {
      warnings.push('backup:corrupt');
    }
  }

  const legacy = read(LEGACY_META_KEY);
  if (legacy) {
    try {
      return {
        data: { meta: sanitizeMeta(JSON.parse(legacy)), options: createDefaultOptions() },
        status: 'migrated',
        warnings,
        writable: true,
      };
    } catch {
      warnings.push('legacy:corrupt');
    }
  }

  return {
    data: { meta: createDefaultMeta(), options: createDefaultOptions() },
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
