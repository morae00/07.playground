export const INFINITE_LEADERBOARD_KEY = 'blackline-survivor-infinite-leaderboard-v1';
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
};

export type InfiniteLeaderboard = {
  playerName: string;
  entries: InfiniteScoreEntry[];
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

function normalizeEntry(value: unknown): InfiniteScoreEntry | null {
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
  return { id, player, score, survivedSeconds, kills, bosses, seed, endedAt };
}

export function rankInfiniteEntries(entries: readonly InfiniteScoreEntry[]) {
  return [...entries]
    .sort((a, b) => b.score - a.score || b.survivedSeconds - a.survivedSeconds || b.bosses - a.bosses || a.endedAt.localeCompare(b.endedAt))
    .slice(0, INFINITE_LEADERBOARD_LIMIT);
}

export function loadInfiniteLeaderboard(storage: StorageLike): InfiniteLeaderboard {
  try {
    const raw = storage.getItem(INFINITE_LEADERBOARD_KEY);
    if (!raw) return { playerName: 'PLAYER', entries: [], writable: true };
    const parsed = JSON.parse(raw) as { playerName?: unknown; entries?: unknown };
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries.map(normalizeEntry).filter((entry): entry is InfiniteScoreEntry => entry !== null)
      : [];
    return {
      playerName: normalizeInfinitePlayerName(parsed.playerName),
      entries: rankInfiniteEntries(entries),
      writable: true,
    };
  } catch {
    return { playerName: 'PLAYER', entries: [], writable: false };
  }
}

function persist(storage: StorageLike, playerName: string, entries: readonly InfiniteScoreEntry[]) {
  try {
    storage.setItem(INFINITE_LEADERBOARD_KEY, JSON.stringify({
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
  entry: Omit<InfiniteScoreEntry, 'id' | 'player' | 'endedAt'>,
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
  };
  const next = rankInfiniteEntries([...entries, normalized]);
  return { entries: next, writable: persist(storage, playerName, next), entry: normalized };
}
