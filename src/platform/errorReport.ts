// Error resilience (TEC-14): a small in-memory log of what went wrong, shared by the error boundary, the game
// loop guard, the asset loader, and the global handlers. Nothing leaves the machine: the player can copy the
// report, and the desktop app appends the same lines to a log file in its own data folder.

export type ErrorSource = 'render' | 'loop' | 'window' | 'promise' | 'asset' | 'boot';

export type ErrorEntry = Readonly<{
  source: ErrorSource;
  message: string;
  stack?: string;
  detail?: string;
  /** ISO time of the first occurrence. */
  at: string;
  /** Consecutive identical errors fold into one entry. */
  count: number;
}>;

/** Lines the desktop app picks out of the renderer console and appends to its local log (electron/crashLog.cjs). */
export const CRASH_LOG_PREFIX = '[blackline:error]';

// Browsers report this when a resize callback resizes again; it is harmless and not the game's fault.
const BENIGN_MESSAGES = [/ResizeObserver loop/i];

export function describeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: `${error.name}: ${error.message}`, stack: error.stack };
  if (typeof error === 'string') return { message: error };
  try {
    return { message: JSON.stringify(error) ?? String(error) };
  } catch {
    return { message: String(error) };
  }
}

/** Replaces the home folder in paths (file URLs, stack frames) so a copied report does not carry a user name. */
export function redactPaths(text: string) {
  return text
    .replace(/\/Users\/[^/\s)]+/g, '/Users/~')
    .replace(/\/home\/[^/\s)]+/g, '/home/~')
    .replace(/([A-Za-z]:[\\/]+Users[\\/]+)[^\\/\s)]+/g, '$1~');
}

export class ErrorLog {
  private readonly items: ErrorEntry[] = [];
  private readonly listeners = new Set<(entry: ErrorEntry) => void>();
  private readonly limit: number;
  private readonly now: () => Date;

  constructor(limit = 20, now: () => Date = () => new Date()) {
    this.limit = limit;
    this.now = now;
  }

  /** Records an error and returns its entry, or null for known harmless browser noise. */
  record(source: ErrorSource, error: unknown, detail?: string): ErrorEntry | null {
    const { message, stack } = describeError(error);
    if (BENIGN_MESSAGES.some((pattern) => pattern.test(message))) return null;
    const last = this.items.at(-1);
    let entry: ErrorEntry;
    if (last && last.source === source && last.message === message) {
      entry = { ...last, count: last.count + 1 };
      this.items[this.items.length - 1] = entry;
    } else {
      entry = { source, message, stack, detail, at: this.now().toISOString(), count: 1 };
      this.items.push(entry);
      if (this.items.length > this.limit) this.items.shift();
    }
    for (const listener of this.listeners) listener(entry);
    return entry;
  }

  entries(): readonly ErrorEntry[] {
    return this.items;
  }

  subscribe(listener: (entry: ErrorEntry) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export type ErrorReportContext = {
  version: string;
  userAgent?: string;
  /** What the player was doing, e.g. "Ch.1 / St.3 (remaster rules)". */
  scene?: string;
  time?: Date;
};

/** Plain-text report for the clipboard: app version, scene, and the recorded errors, newest last. */
export function formatErrorReport(entries: readonly ErrorEntry[], context: ErrorReportContext) {
  const lines = [
    `Blackline Survivor ${context.version} error report`,
    `time: ${(context.time ?? new Date()).toISOString()}`,
  ];
  if (context.userAgent) lines.push(`agent: ${context.userAgent}`);
  if (context.scene) lines.push(`scene: ${context.scene}`);
  lines.push(`errors: ${entries.length}`);
  for (const entry of entries) {
    lines.push('', `[${entry.at}] ${entry.source}${entry.count > 1 ? ` x${entry.count}` : ''}: ${entry.message}`);
    if (entry.detail) lines.push(entry.detail.trim());
    if (entry.stack) lines.push(entry.stack.trim());
  }
  return redactPaths(lines.join('\n'));
}

/** One console line per error for the desktop app's local log. */
export function crashLogLine(entry: ErrorEntry) {
  return `${CRASH_LOG_PREFIX} ${redactPaths(JSON.stringify({ source: entry.source, message: entry.message, count: entry.count, stack: entry.stack?.split('\n').slice(0, 6).join('\n') }))}`;
}

type ErrorTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>;

/** Routes uncaught errors and unhandled promise rejections into the log. Returns an uninstall function. */
export function installGlobalErrorHandlers(target: ErrorTarget, log: ErrorLog) {
  const onError = (event: Event) => {
    const errorEvent = event as ErrorEvent;
    log.record('window', errorEvent.error ?? errorEvent.message ?? 'Unknown error');
  };
  const onRejection = (event: Event) => {
    log.record('promise', (event as PromiseRejectionEvent).reason ?? 'Unhandled rejection');
  };
  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);
  return () => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
  };
}
