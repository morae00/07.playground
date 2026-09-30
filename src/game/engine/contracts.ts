import { CAMPAIGN_CHAPTER_COUNT, STAGES_PER_CHAPTER } from '../../content/campaign.ts';
import type { ChapterId, StageId } from '../../content/schema.ts';

export const ENGINE_CONTRACT_VERSION = 1 as const;

export type EngineRunState = 'idle' | 'running' | 'paused' | 'draft' | 'settled';
/** G1: the only player input the simulation accepts is movement. Attacks and skills are always automatic. */
export const ENGINE_ACTIONS = Object.freeze(['moveUp', 'moveDown', 'moveLeft', 'moveRight'] as const);
export type EngineAction = (typeof ENGINE_ACTIONS)[number];

export type EngineAddress = {
  chapter: ChapterId;
  stage: StageId;
};

export type EngineStartRequest = {
  contractVersion: typeof ENGINE_CONTRACT_VERSION;
  seed: number;
  address: EngineAddress;
  fixedStepHz: number;
  paceMode: 'standard' | 'showcase';
  /** Simulation rule set; remaster when omitted. */
  rules?: 'classic' | 'remaster';
};

/**
 * Everything the simulation accepts from the outside world (TEC-07). Input adapters translate keyboard,
 * pointer, and gamepad state into these commands, so a seed plus a command log reproduces a run.
 */
export type EngineCommand =
  | { type: 'input/action'; action: EngineAction; pressed: boolean }
  | { type: 'input/pointer'; active: boolean; worldX: number; worldY: number }
  /** Analog movement (gamepad stick or D-pad), already dead-zoned; magnitude at most 1. Zero releases it. */
  | { type: 'input/analog'; x: number; y: number }
  /** Drops every held action, the pointer, and analog movement (focus loss). */
  | { type: 'input/release' }
  | { type: 'draft/select'; offerId: string }
  | { type: 'control/pause' }
  | { type: 'control/resume' };

export type EngineSnapshotContract = {
  contractVersion: typeof ENGINE_CONTRACT_VERSION;
  tick: number;
  runState: EngineRunState;
  address: EngineAddress;
};

export type EngineEventContract<Payload = unknown> = {
  sequence: number;
  tick: number;
  type: string;
  payload: Payload;
};

export interface EngineHarness<Snapshot = EngineSnapshotContract, Event = EngineEventContract> {
  reset(request: EngineStartRequest): void;
  dispatch(command: EngineCommand): void;
  step(ticks?: number): void;
  readSnapshot(): Snapshot;
  drainEvents(): readonly Event[];
  dispose?(): void;
}

export type HarnessReplayResult<Snapshot, Event> = {
  snapshot: Snapshot;
  events: readonly Event[];
  fingerprint: string;
};

export function isEngineAddress(value: { chapter: number; stage: number }) {
  return Number.isInteger(value.chapter)
    && value.chapter >= 1
    && value.chapter <= CAMPAIGN_CHAPTER_COUNT
    && Number.isInteger(value.stage)
    && value.stage >= 1
    && value.stage <= STAGES_PER_CHAPTER;
}

export function assertEngineStartRequest(request: EngineStartRequest) {
  if (request.contractVersion !== ENGINE_CONTRACT_VERSION) {
    throw new RangeError(`Unsupported engine contract version ${String(request.contractVersion)}`);
  }
  if (!Number.isInteger(request.seed) || request.seed < 0 || request.seed > 0xffff_ffff) {
    throw new RangeError('Engine seed must be an unsigned 32-bit integer');
  }
  if (!isEngineAddress(request.address)) {
    throw new RangeError(`Invalid engine address ${request.address.chapter}:${request.address.stage}`);
  }
  if (!Number.isInteger(request.fixedStepHz) || request.fixedStepHz < 30 || request.fixedStepHz > 240) {
    throw new RangeError('fixedStepHz must be an integer within 30..240');
  }
}
