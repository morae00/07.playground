// Replay harness over the real engine (TEC-07): seed + command log -> the same snapshot and fingerprint.
// Only the test bundle ships this module.
import type { DraftState, EngineCallbacks, Settlement } from '../GameEngine';
import {
  assertEngineStartRequest,
  type EngineCommand,
  type EngineEventContract,
  type EngineHarness,
  type EngineRunState,
  type EngineStartRequest,
} from './contracts';
import { ProbedGameEngine, type ProbeWorld } from './probe';

const round = (value: number) => Math.round(value * 1e6) / 1e6;

export type ReplaySnapshot = {
  tick: number;
  runState: EngineRunState;
  timeLeft: number;
  elapsed: number;
  stageKills: number;
  player: number[];
  skills: Array<[string, number, boolean]>;
  enemies: Array<[number, string, number, number, number]>;
  hostileShots: number;
  pickups: Array<[string, number, number, number]>;
};

/** Compact, rounded view of the gameplay state; cosmetic state is left out on purpose. */
export function replaySnapshot(world: ProbeWorld, tick: number, runState: EngineRunState): ReplaySnapshot {
  const { player } = world;
  return {
    tick,
    runState,
    timeLeft: round(world.timeLeft),
    elapsed: round(world.elapsed),
    stageKills: world.stageKills,
    player: [round(player.x), round(player.y), round(player.hp), player.level, round(player.xp), player.kills, player.coins],
    skills: Object.entries(world.skills)
      .map(([id, state]): [string, number, boolean] => [id, state?.level ?? 0, state?.awakened === true])
      .sort((a, b) => a[0].localeCompare(b[0])),
    enemies: world.enemies.map((enemy) => [enemy.id, enemy.boss?.id ?? enemy.tier, round(enemy.x), round(enemy.y), round(enemy.hp)]),
    hostileShots: world.bossProjectiles.length,
    pickups: world.pickups.map((pickup) => [pickup.kind, round(pickup.x), round(pickup.y), pickup.value]),
  };
}

export type EngineFactory = (callbacks: EngineCallbacks) => ProbedGameEngine;

export type RealEngineHarness = EngineHarness<ReplaySnapshot, EngineEventContract> & {
  /** The engine of the current run (null before the first reset). */
  readonly engine: ProbedGameEngine | null;
  readonly tick: number;
  /** The draft waiting for a draft/select command, if any. */
  readonly openDraft: DraftState | null;
};

export function createEngineHarness(createEngine: EngineFactory): RealEngineHarness {
  let engine: ProbedGameEngine | null = null;
  let tick = 0;
  let sequence = 0;
  let runState: EngineRunState = 'idle';
  let openDraft: DraftState | null = null;
  let events: EngineEventContract[] = [];

  const emit = (type: string, payload: unknown) => {
    events.push({ sequence: sequence++, tick, type, payload });
  };
  const settle = (type: 'round/cleared' | 'round/lost', settlement: Settlement) => {
    runState = 'settled';
    openDraft = null;
    emit(type, { kills: settlement.kills, coins: settlement.coins, gold: settlement.gold, cleared: settlement.cleared });
  };
  const callbacks: EngineCallbacks = {
    onSnapshot() {},
    onDraft(draft) {
      openDraft = draft;
      runState = 'draft';
      emit('draft/opened', { draftId: draft.id, reason: draft.reason, offerIds: draft.cards.map((card) => card.offerId) });
    },
    onRoundClear: (settlement) => settle('round/cleared', settlement),
    onGameOver: (settlement) => settle('round/lost', settlement),
  };
  const current = () => {
    if (!engine) throw new Error('Engine harness used before reset()');
    return engine;
  };

  return {
    get engine() { return engine; },
    get tick() { return tick; },
    get openDraft() { return openDraft; },
    reset(request: EngineStartRequest) {
      assertEngineStartRequest(request);
      if (request.fixedStepHz !== 60) throw new RangeError('The engine simulates at 60 Hz only');
      engine?.dispose();
      tick = 0;
      sequence = 0;
      events = [];
      openDraft = null;
      engine = createEngine(callbacks);
      // Game events join the replay record, so a fingerprint covers what happened, not only where it ended (TEC-02).
      engine.subscribe(({ type, ...payload }) => emit(type, payload));
      engine.setRuleSet(request.rules ?? 'remaster');
      runState = 'running';
      engine.startRun(request.address.chapter, request.address.stage, request.seed);
    },
    dispatch(command: EngineCommand) {
      const target = current();
      if (command.type === 'draft/select' && openDraft?.cards.some((card) => card.offerId === command.offerId)) {
        openDraft = null;
        runState = 'running';
      }
      target.dispatch(command);
      if (command.type === 'control/pause' && runState === 'running') runState = 'paused';
      if (command.type === 'control/resume' && runState === 'paused') runState = 'running';
    },
    step(ticks = 1) {
      const target = current();
      for (let index = 0; index < ticks; index += 1) {
        target.probe.step(1);
        tick += 1;
      }
    },
    readSnapshot() {
      return replaySnapshot(current().probe.read(), tick, runState);
    },
    drainEvents() {
      const drained = events;
      events = [];
      return drained;
    },
    dispose() {
      engine?.dispose();
      engine = null;
    },
  };
}
