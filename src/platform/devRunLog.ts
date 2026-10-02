// Developer run log (decision D-07): the numbers of every settled run, kept in developer builds so playtests can
// export what the bots cannot measure, such as the R3 coin target (the median end balance at most 30% of the coins
// earned). Shipped builds never write or show it: callers test DEVELOPER_UI_AVAILABLE themselves.
import type { StorageLike } from './save.ts';

export const DEV_RUN_LOG_KEY = 'blackline-survivor-dev-runlog';
const DEV_RUN_LOG_LIMIT = 500;

export type DevRunEntry = {
  at: number;
  mode: 'campaign' | 'infinite';
  rules: number;
  chapter: number;
  stage: number;
  outcome: 'clear' | 'defeat';
  practice: boolean;
  assisted: boolean;
  seconds: number;
  kills: number;
  level: number;
  coinsEarned: number;
  coinsLeft: number;
  damageTaken: number;
  maxHp: number;
  bonus: boolean | null;
  skills: number;
};

type SettledRun = {
  runMode: 'campaign' | 'infinite';
  rulesVersion: number;
  chapter: number;
  stage: number;
  cleared: boolean;
  practice: boolean;
  assisted: boolean;
  clearSeconds: number;
  survivedSeconds: number;
  kills: number;
  level: number;
  coinsEarned: number;
  coins: number;
  damageTaken: number;
  maxHp: number;
  bonus: { met: boolean } | null;
  found: { skills: readonly string[] };
};

export function devRunEntry(run: SettledRun, at: number): DevRunEntry {
  return {
    at,
    mode: run.runMode,
    rules: run.rulesVersion,
    chapter: run.chapter,
    stage: run.stage,
    outcome: run.cleared ? 'clear' : 'defeat',
    practice: run.practice,
    assisted: run.assisted,
    seconds: Math.round((run.runMode === 'infinite' ? run.survivedSeconds : run.clearSeconds) * 10) / 10,
    kills: run.kills,
    level: run.level,
    coinsEarned: run.coinsEarned,
    coinsLeft: run.coins,
    damageTaken: Math.round(run.damageTaken),
    maxHp: Math.round(run.maxHp),
    bonus: run.bonus ? run.bonus.met : null,
    skills: run.found.skills.length,
  };
}

export function readDevRunLog(storage: Pick<StorageLike, 'getItem'> | null): DevRunEntry[] {
  try {
    const value: unknown = JSON.parse(storage?.getItem(DEV_RUN_LOG_KEY) ?? '[]');
    return Array.isArray(value) ? (value as DevRunEntry[]) : [];
  } catch {
    return [];
  }
}

/** Adds a run, keeping the newest DEV_RUN_LOG_LIMIT; a storage that refuses the write keeps the log as it was. */
export function appendDevRunLog(storage: StorageLike | null, entry: DevRunEntry): DevRunEntry[] {
  const entries = [...readDevRunLog(storage), entry].slice(-DEV_RUN_LOG_LIMIT);
  try {
    storage?.setItem(DEV_RUN_LOG_KEY, JSON.stringify(entries));
  } catch {
    return readDevRunLog(storage);
  }
  return entries;
}

export function clearDevRunLog(storage: StorageLike | null) {
  try {
    storage?.setItem(DEV_RUN_LOG_KEY, '[]');
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

/** The median share of the coins earned that a run ended with, over runs that earned any; null without one. */
export function devRunCoinShare(entries: readonly DevRunEntry[]) {
  const shares = entries.filter((entry) => entry.coinsEarned > 0).map((entry) => entry.coinsLeft / entry.coinsEarned).sort((a, b) => a - b);
  if (shares.length === 0) return null;
  const middle = Math.floor(shares.length / 2);
  return shares.length % 2 ? shares[middle] : (shares[middle - 1] + shares[middle]) / 2;
}
