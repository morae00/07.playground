import { CLASSIC_RULES_VERSION, RULES_VERSION } from '../game/rules.ts';

/** Records made before rule versioning (classic rules, 0.1.0). Read-only; kept for display as legacy. */
export const LEGACY_INFINITE_LEADERBOARD_KEY = 'blackline-survivor-infinite-leaderboard-v1';
export const infiniteLeaderboardKey = (rulesVersion: number) => `blackline-survivor-infinite-leaderboard-r${rulesVersion}`;
export const INFINITE_LEADERBOARD_KEY = infiniteLeaderboardKey(RULES_VERSION);
export const INFINITE_LEADERBOARD_LIMIT = 10;

export type InfiniteScoreEntry = {
  id: string;
  player: string;
  score: number;
  survivedSeconds: number;
  kills: number;
  bosses: number;
  seed: number;
  endedAt: string;
  rulesVersion: number;
};

export type InfiniteLeaderboard = {
  playerName: string;
  entries: InfiniteScoreEntry[];
  /** Top records from an older rule version. They are never merged into the current ranking. */
  legacyEntries: InfiniteScoreEntry[];
  writable: boolean;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function finiteInteger(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function normalizeInfinitePlayerName(value: unknown) {
  if (typeof value !== 'string') return 'PLAYER';
  const normalized = value.replace(/\s+/g, ' ').trim().slice(0, 16);
  return normalized || 'PLAYER';
}

function normalizeEntry(value: unknown, rulesVersion: number): InfiniteScoreEntry | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Partial<InfiniteScoreEntry>;
  const endedAt = typeof source.endedAt === 'string' && Number.isFinite(Date.parse(source.endedAt))
    ? source.endedAt
    : new Date(0).toISOString();
  const seed = finiteInteger(source.seed) >>> 0;
  const score = finiteInteger(source.score);
  const survivedSeconds = finiteInteger(source.survivedSeconds);
  const kills = finiteInteger(source.kills);
  const bosses = finiteInteger(source.bosses);
  const player = normalizeInfinitePlayerName(source.player);
  const id = typeof source.id === 'string' && source.id.trim()
    ? source.id.slice(0, 96)
    : `${endedAt}-${seed}-${score}`;
  return { id, player, score, survivedSeconds, kills, bosses, seed, endedAt, rulesVersion };
}

export function rankInfiniteEntries(entries: readonly InfiniteScoreEntry[]) {
  return [...entries]
    .sort((a, b) => b.score - a.score || b.survivedSeconds - a.survivedSeconds || b.bosses - a.bosses || a.endedAt.localeCompare(b.endedAt))
    .slice(0, INFINITE_LEADERBOARD_LIMIT);
}

type StoredBoard = { playerName?: unknown; entries?: unknown };

function readBoard(storage: StorageLike, key: string): StoredBoard | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw) as StoredBoard;
}

function boardEntries(board: StoredBoard | null, rulesVersion: number) {
  if (!board || !Array.isArray(board.entries)) return [];
  return rankInfiniteEntries(board.entries
    .map((entry) => normalizeEntry(entry, rulesVersion))
    .filter((entry): entry is InfiniteScoreEntry => entry !== null));
}

export function loadInfiniteLeaderboard(storage: StorageLike): InfiniteLeaderboard {
  let legacy: StoredBoard | null = null;
  try {
    legacy = readBoard(storage, LEGACY_INFINITE_LEADERBOARD_KEY);
  } catch {
    legacy = null;
  }
  const legacyEntries = boardEntries(legacy, CLASSIC_RULES_VERSION);
  try {
    const current = readBoard(storage, INFINITE_LEADERBOARD_KEY);
    return {
      playerName: normalizeInfinitePlayerName(current?.playerName ?? legacy?.playerName),
      entries: boardEntries(current, RULES_VERSION),
      legacyEntries,
      writable: true,
    };
  } catch {
    return { playerName: 'PLAYER', entries: [], legacyEntries, writable: false };
  }
}

function persist(storage: StorageLike, playerName: string, entries: readonly InfiniteScoreEntry[]) {
  try {
    storage.setItem(INFINITE_LEADERBOARD_KEY, JSON.stringify({
      rulesVersion: RULES_VERSION,
      playerName: normalizeInfinitePlayerName(playerName),
      entries: rankInfiniteEntries(entries),
    }));
    return true;
  } catch {
    return false;
  }
}

export function saveInfinitePlayerName(storage: StorageLike, playerName: string, entries: readonly InfiniteScoreEntry[]) {
  return persist(storage, playerName, entries);
}

export function addInfiniteScore(
  storage: StorageLike,
  playerName: string,
  entries: readonly InfiniteScoreEntry[],
  entry: Omit<InfiniteScoreEntry, 'id' | 'player' | 'endedAt' | 'rulesVersion'>,
) {
  const endedAt = new Date().toISOString();
  const normalized: InfiniteScoreEntry = {
    ...entry,
    id: `${endedAt}-${entry.seed >>> 0}-${Math.max(0, Math.floor(entry.score))}`,
    player: normalizeInfinitePlayerName(playerName),
    score: finiteInteger(entry.score),
    survivedSeconds: finiteInteger(entry.survivedSeconds),
    kills: finiteInteger(entry.kills),
    bosses: finiteInteger(entry.bosses),
    seed: finiteInteger(entry.seed) >>> 0,
    endedAt,
    rulesVersion: RULES_VERSION,
  };
  const next = rankInfiniteEntries([...entries.filter((candidate) => candidate.rulesVersion === RULES_VERSION), normalized]);
  return { entries: next, writable: persist(storage, playerName, next), entry: normalized };
}
