// The 0.1.0 build's save module, verbatim from 174eb99 src/platform/save.ts with the types stripped (esbuild).
// Test fixture only (saveMigration.test.ts): it lets the tests run the old build's loader against a migrated save.
// Do not edit; it stands for code that is already on players' machines.

const SAVE_VERSION = 2;
const SAVE_KEY = "blackline-survivor-save-v2";
const SAVE_BACKUP_KEY = `${SAVE_KEY}.backup`;
const LEGACY_META_KEY = "blackline-survivor-meta-v1";
const UPGRADE_LIMITS = {
  attack: 30,
  defense: 25,
  maxHp: 30,
  moveSpeed: 20,
  crit: 20,
  regen: 20,
  magnet: 25
};
const PASSIVE_LIMITS = {
  rareLuck: 5,
  bossHunter: 5,
  coinMagnet: 5
};
const createDefaultMeta = () => ({
  gold: 120,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 1, stage: 1 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 }
});
const createDefaultOptions = () => ({
  healthBars: "elite",
  volume: 0.32,
  effects: 0.9,
  damageNumbers: true,
  screenShake: true,
  reducedFlash: false,
  paceMode: "standard"
});
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function finiteNumber(value, fallback, min, max, integer = false) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const normalized = Math.max(min, Math.min(max, value));
  return integer ? Math.floor(normalized) : normalized;
}
function booleanValue(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}
function sanitizeMeta(value) {
  const fallback = createDefaultMeta();
  if (!isRecord(value)) return fallback;
  const progress = isRecord(value.progress) ? value.progress : {};
  const upgrades = isRecord(value.upgrades) ? value.upgrades : {};
  const passives = isRecord(value.passives) ? value.passives : {};
  return {
    gold: finiteNumber(value.gold, fallback.gold, 0, Number.MAX_SAFE_INTEGER, true),
    xp: finiteNumber(value.xp, fallback.xp, 0, Number.MAX_SAFE_INTEGER, true),
    level: finiteNumber(value.level, fallback.level, 1, 1e4, true),
    passivePoints: finiteNumber(value.passivePoints, fallback.passivePoints, 0, 1e4, true),
    progress: {
      chapter: finiteNumber(progress.chapter, 1, 1, 5, true),
      stage: finiteNumber(progress.stage, 1, 1, 10, true)
    },
    upgrades: Object.fromEntries(
      Object.keys(UPGRADE_LIMITS).map((id) => [id, finiteNumber(upgrades[id], 0, 0, UPGRADE_LIMITS[id], true)])
    ),
    passives: Object.fromEntries(
      Object.keys(PASSIVE_LIMITS).map((id) => [id, finiteNumber(passives[id], 0, 0, PASSIVE_LIMITS[id], true)])
    )
  };
}
function sanitizeOptions(value) {
  const fallback = createDefaultOptions();
  if (!isRecord(value)) return fallback;
  return {
    healthBars: value.healthBars === "all" || value.healthBars === "elite" || value.healthBars === "off" ? value.healthBars : fallback.healthBars,
    volume: finiteNumber(value.volume, fallback.volume, 0, 1),
    effects: finiteNumber(value.effects, fallback.effects, 0.25, 1),
    damageNumbers: booleanValue(value.damageNumbers, fallback.damageNumbers),
    screenShake: booleanValue(value.screenShake, fallback.screenShake),
    reducedFlash: booleanValue(value.reducedFlash, fallback.reducedFlash),
    paceMode: value.paceMode === "standard" || value.paceMode === "showcase" ? value.paceMode : fallback.paceMode
  };
}
function parseEnvelope(raw) {
  const parsed = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== SAVE_VERSION) return null;
  return {
    meta: sanitizeMeta(parsed.meta),
    options: sanitizeOptions(parsed.options)
  };
}
function loadGameSave(storage) {
  const warnings = [];
  const read = (key) => {
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
      const parsed = JSON.parse(primary);
      if (isRecord(parsed) && typeof parsed.version === "number" && parsed.version > SAVE_VERSION) {
        return {
          data: { meta: createDefaultMeta(), options: createDefaultOptions() },
          status: "defaulted",
          warnings: [...warnings, "primary:future-version"],
          writable: false
        };
      }
      const data = parseEnvelope(primary);
      if (data) return { data, status: "ok", warnings, writable: true };
      warnings.push("primary:unsupported");
    } catch {
      warnings.push("primary:corrupt");
    }
  }
  const backup = read(SAVE_BACKUP_KEY);
  if (backup) {
    try {
      const data = parseEnvelope(backup);
      if (data) return { data, status: "recovered", warnings, writable: true };
      warnings.push("backup:unsupported");
    } catch {
      warnings.push("backup:corrupt");
    }
  }
  const legacy = read(LEGACY_META_KEY);
  if (legacy) {
    try {
      return {
        data: { meta: sanitizeMeta(JSON.parse(legacy)), options: createDefaultOptions() },
        status: "migrated",
        warnings,
        writable: true
      };
    } catch {
      warnings.push("legacy:corrupt");
    }
  }
  return {
    data: { meta: createDefaultMeta(), options: createDefaultOptions() },
    status: "defaulted",
    warnings,
    writable: true
  };
}
function saveGameSave(storage, data) {
  const envelope = JSON.stringify({
    version: SAVE_VERSION,
    savedAt: Date.now(),
    meta: sanitizeMeta(data.meta),
    options: sanitizeOptions(data.options)
  });
  try {
    const previous = storage.getItem(SAVE_KEY);
    if (previous) storage.setItem(SAVE_BACKUP_KEY, previous);
    storage.setItem(SAVE_KEY, envelope);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "storage unavailable" };
  }
}
export {
  LEGACY_META_KEY,
  SAVE_BACKUP_KEY,
  SAVE_KEY,
  SAVE_VERSION,
  createDefaultMeta,
  createDefaultOptions,
  loadGameSave,
  sanitizeMeta,
  sanitizeOptions,
  saveGameSave
};
