import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ENGINE_CONTRACT_VERSION,
  ReplayInvariantError,
  appendReplayCommand,
  assertEngineStartRequest,
  canonicalJson,
  createReplayFixture,
  extendReplayDuration,
  fingerprintReplay,
  fingerprintValue,
  runReplay,
  validateReplayFixture,
  type EngineCommand,
  type EngineHarness,
  type EngineStartRequest,
} from './engine/index.ts';

type FakeSnapshot = {
  tick: number;
  x: number;
  paused: boolean;
  draftPicks: string[];
};

type FakeEvent = {
  sequence: number;
  tick: number;
  type: 'draft-picked';
  offerId: string;
};

class FakeHarness implements EngineHarness<FakeSnapshot, FakeEvent> {
  private tick = 0;
  private x = 0;
  private paused = false;
  private movingRight = false;
  private picks: string[] = [];
  private events: FakeEvent[] = [];

  reset(_request: EngineStartRequest) {
    this.tick = 0;
    this.x = 0;
    this.paused = false;
    this.movingRight = false;
    this.picks = [];
    this.events = [];
  }

  dispatch(command: EngineCommand) {
    if (command.type === 'input/action' && command.action === 'moveRight') this.movingRight = command.pressed;
    if (command.type === 'control/pause') this.paused = true;
    if (command.type === 'control/resume') this.paused = false;
    if (command.type === 'draft/select') {
      this.picks.push(command.offerId);
      this.events.push({ sequence: this.picks.length - 1, tick: this.tick, type: 'draft-picked', offerId: command.offerId });
    }
  }

  step(ticks = 1) {
    for (let index = 0; index < ticks; index += 1) {
      if (!this.paused && this.movingRight) this.x += 1;
      this.tick += 1;
    }
  }

  readSnapshot(): FakeSnapshot {
    return { tick: this.tick, x: this.x, paused: this.paused, draftPicks: [...this.picks] };
  }

  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }
}

const startRequest = (): EngineStartRequest => ({
  contractVersion: ENGINE_CONTRACT_VERSION,
  seed: 441,
  address: { chapter: 3, stage: 7 },
  fixedStepHz: 60,
  paceMode: 'standard',
});

test('public engine start contract rejects invalid seeds, addresses, and clocks', () => {
  assert.doesNotThrow(() => assertEngineStartRequest(startRequest()));
  assert.throws(() => assertEngineStartRequest({ ...startRequest(), seed: -1 }), /unsigned 32-bit/);
  assert.throws(() => assertEngineStartRequest({ ...startRequest(), address: { chapter: 3, stage: 99 } as never }), /Invalid engine address/);
  assert.throws(() => assertEngineStartRequest({ ...startRequest(), fixedStepHz: 10 }), /30..240/);
});

test('replay builder preserves stable command order and grows duration without mutation', () => {
  const empty = createReplayFixture('engine-test', startRequest(), 0);
  const moving = appendReplayCommand(empty, 0, { type: 'input/action', action: 'moveRight', pressed: true });
  const drafted = appendReplayCommand(moving, 2, { type: 'draft/select', offerId: 'offer-1' });
  const stopped = appendReplayCommand(drafted, 3, { type: 'input/action', action: 'moveRight', pressed: false });
  const replay = extendReplayDuration(stopped, 5);

  assert.equal(empty.commands.length, 0);
  assert.equal(replay.durationTicks, 5);
  assert.deepEqual(replay.commands.map((entry) => [entry.tick, entry.order]), [[0, 0], [2, 1], [3, 2]]);
  assert.deepEqual(validateReplayFixture(replay), []);
  assert.throws(
    () => appendReplayCommand(replay, 1, { type: 'control/pause' }),
    ReplayInvariantError,
  );
});

test('canonical fingerprints ignore object key insertion order and reject unstable values', () => {
  assert.equal(canonicalJson({ z: 1, a: { d: 2, b: 3 } }), '{"a":{"b":3,"d":2},"z":1}');
  assert.equal(fingerprintValue({ a: 1, b: 2 }), fingerprintValue({ b: 2, a: 1 }));
  assert.notEqual(fingerprintValue({ a: 1 }), fingerprintValue({ a: 2 }));
  assert.throws(() => fingerprintValue({ invalid: Number.NaN }), /finite numbers/);
  const cyclic: { self?: unknown } = {};
  cyclic.self = cyclic;
  assert.throws(() => fingerprintValue(cyclic), /cyclic/);
});

test('replay validation aggregates ordering, duration, and serializable command failures', () => {
  const replay = createReplayFixture('engine-test', startRequest(), 4);
  const invalid = {
    ...replay,
    commands: [
      { tick: 3, order: 4, command: { type: 'input/pointer', active: true, worldX: Number.NaN, worldY: 2 } as const },
      { tick: 1, order: 1, command: { type: 'draft/select', offerId: '' } as const },
    ],
  };
  const issues = validateReplayFixture(invalid);
  assert.ok(issues.some((issue) => issue.includes('order must equal')));
  assert.ok(issues.some((issue) => issue.includes('not ordered by tick')));
  assert.ok(issues.some((issue) => issue.includes('coordinates must be finite')));
  assert.ok(issues.some((issue) => issue.includes('offerId is empty')));
});

test('same replay produces the same public harness result and fingerprint', () => {
  let replay = createReplayFixture('engine-test', startRequest());
  replay = appendReplayCommand(replay, 0, { type: 'input/action', action: 'moveRight', pressed: true });
  replay = appendReplayCommand(replay, 1, { type: 'control/pause' });
  replay = appendReplayCommand(replay, 2, { type: 'draft/select', offerId: 'rare-needle' });
  replay = appendReplayCommand(replay, 2, { type: 'control/resume' });
  replay = appendReplayCommand(replay, 4, { type: 'input/action', action: 'moveRight', pressed: false });
  replay = extendReplayDuration(replay, 6);

  const first = runReplay(new FakeHarness(), replay);
  const second = runReplay(new FakeHarness(), replay);
  assert.deepEqual(first, second);
  assert.deepEqual(first.snapshot, { tick: 6, x: 3, paused: false, draftPicks: ['rare-needle'] });
  assert.deepEqual(first.events, [{ sequence: 0, tick: 2, type: 'draft-picked', offerId: 'rare-needle' }]);
  assert.match(first.fingerprint, /^[0-9a-f]{16}$/);
  assert.equal(fingerprintReplay(replay), fingerprintReplay(replay));
});
