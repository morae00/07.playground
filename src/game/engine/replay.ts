import {
  ENGINE_CONTRACT_VERSION,
  assertEngineStartRequest,
  type EngineCommand,
  type EngineHarness,
  type EngineStartRequest,
  type HarnessReplayResult,
} from './contracts.ts';

export const REPLAY_SCHEMA_VERSION = 1 as const;

export type ReplayCommandEntry = {
  tick: number;
  order: number;
  command: EngineCommand;
};

export type ReplayFixture = {
  schemaVersion: typeof REPLAY_SCHEMA_VERSION;
  engineVersion: string;
  start: EngineStartRequest;
  durationTicks: number;
  commands: readonly ReplayCommandEntry[];
};

export class ReplayInvariantError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Replay invariant failed:\n- ${issues.join('\n- ')}`);
    this.name = 'ReplayInvariantError';
    this.issues = Object.freeze([...issues]);
  }
}

function validateCommand(command: EngineCommand, label: string, issues: string[]) {
  if (command.type === 'input/pointer') {
    if (!Number.isFinite(command.worldX) || !Number.isFinite(command.worldY)) {
      issues.push(`${label} pointer coordinates must be finite`);
    }
  }
  if (command.type === 'input/analog') {
    if (!Number.isFinite(command.x) || !Number.isFinite(command.y) || Math.hypot(command.x, command.y) > 1 + 1e-9) {
      issues.push(`${label} analog movement must be finite with magnitude at most 1`);
    }
  }
  if (command.type === 'draft/select' && command.offerId.trim().length === 0) {
    issues.push(`${label} draft offerId is empty`);
  }
}

export function validateReplayFixture(replay: ReplayFixture) {
  const issues: string[] = [];
  if (replay.schemaVersion !== REPLAY_SCHEMA_VERSION) {
    issues.push(`unsupported schemaVersion ${String(replay.schemaVersion)}`);
  }
  if (replay.engineVersion.trim().length === 0) issues.push('engineVersion is empty');
  try {
    assertEngineStartRequest(replay.start);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : 'invalid engine start request');
  }
  if (!Number.isInteger(replay.durationTicks) || replay.durationTicks < 0 || replay.durationTicks > 10_000_000) {
    issues.push('durationTicks must be an integer within 0..10000000');
  }

  let previousTick = -1;
  replay.commands.forEach((entry, index) => {
    if (!Number.isInteger(entry.tick) || entry.tick < 0 || entry.tick >= replay.durationTicks) {
      issues.push(`command ${index} tick must be within replay duration`);
    }
    if (entry.tick < previousTick) issues.push(`command ${index} is not ordered by tick`);
    previousTick = entry.tick;
    if (entry.order !== index) issues.push(`command ${index} order must equal its stable array index`);
    validateCommand(entry.command, `command ${index}`, issues);
  });
  return issues;
}

export function assertReplayFixture(replay: ReplayFixture) {
  const issues = validateReplayFixture(replay);
  if (issues.length > 0) throw new ReplayInvariantError(issues);
}

export function createReplayFixture(
  engineVersion: string,
  start: Omit<EngineStartRequest, 'contractVersion'> & Partial<Pick<EngineStartRequest, 'contractVersion'>>,
  durationTicks = 0,
): ReplayFixture {
  const replay: ReplayFixture = {
    schemaVersion: REPLAY_SCHEMA_VERSION,
    engineVersion,
    start: {
      ...start,
      contractVersion: start.contractVersion ?? ENGINE_CONTRACT_VERSION,
    },
    durationTicks,
    commands: [],
  };
  assertReplayFixture(replay);
  return replay;
}

export function appendReplayCommand(
  replay: ReplayFixture,
  tick: number,
  command: EngineCommand,
) {
  const previous = replay.commands.at(-1);
  if (previous && tick < previous.tick) {
    throw new ReplayInvariantError(['commands must be appended in non-decreasing tick order']);
  }
  const next: ReplayFixture = {
    ...replay,
    durationTicks: Math.max(replay.durationTicks, tick + 1),
    commands: [...replay.commands, { tick, order: replay.commands.length, command }],
  };
  assertReplayFixture(next);
  return next;
}

export function extendReplayDuration(replay: ReplayFixture, durationTicks: number) {
  const next = { ...replay, durationTicks };
  assertReplayFixture(next);
  return next;
}

function canonicalize(value: unknown, ancestors: Set<object>): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Replay fingerprints require finite numbers');
    return Object.is(value, -0) ? '0' : JSON.stringify(value);
  }
  if (typeof value !== 'object') {
    throw new TypeError(`Replay fingerprints cannot serialize ${typeof value}`);
  }
  if (ancestors.has(value)) throw new TypeError('Replay fingerprints cannot serialize cyclic values');

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((item) => canonicalize(item, ancestors)).join(',')}]`;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Replay fingerprints only accept plain objects and arrays');
    }
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record).sort().map((key) => {
      if (record[key] === undefined) throw new TypeError(`Replay fingerprints cannot serialize undefined at ${key}`);
      return `${JSON.stringify(key)}:${canonicalize(record[key], ancestors)}`;
    });
    return `{${entries.join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalJson(value: unknown) {
  return canonicalize(value, new Set());
}

export function fingerprintValue(value: unknown) {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  let hash = 0xcbf29ce484222325n;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, '0');
}

export function fingerprintReplay(replay: ReplayFixture) {
  assertReplayFixture(replay);
  return fingerprintValue(replay);
}

export function runReplay<Snapshot, Event>(
  harness: EngineHarness<Snapshot, Event>,
  replay: ReplayFixture,
): HarnessReplayResult<Snapshot, Event> {
  assertReplayFixture(replay);
  harness.reset(replay.start);
  const events: Event[] = [];
  let commandIndex = 0;
  for (let tick = 0; tick < replay.durationTicks; tick += 1) {
    while (replay.commands[commandIndex]?.tick === tick) {
      harness.dispatch(replay.commands[commandIndex].command);
      commandIndex += 1;
    }
    harness.step(1);
    events.push(...harness.drainEvents());
  }
  const snapshot = harness.readSnapshot();
  return {
    snapshot,
    events,
    fingerprint: fingerprintValue({ snapshot, events }),
  };
}
