import { CHECK_CONTENT_AT_LOAD } from './checks.ts';
import BOSS_PHASE_MOVES from './data/bossPhaseMoves.ts';
import { CAMPAIGN_CHAPTER_IDS, type ChapterId } from './schema.ts';
import type { StringKey } from '../i18n/text.ts';

export type BossPhase = 2 | 3;
export type BossPhaseRole = 'mid' | 'final';
export type BossMovementMode = 'rush' | 'anchor' | 'orbit' | 'mirror' | 'flow' | 'lattice' | 'sweep' | 'warp';
export type TelegraphShape = 'line' | 'circle' | 'ring' | 'lane' | 'grid' | 'cone';

export type BossPhaseMove = {
  id: string;
  /** The string key of its name for the HUD pattern preview (SYS-04, UI-10); moves without one are not announced. */
  name?: StringKey;
  phase: BossPhase;
  triggerHealthRatio: number;
  cadenceScale: number;
  movement: {
    mode: BossMovementMode;
    speedScale: number;
  };
  attackGrammar: string;
  telegraph: {
    shape: TelegraphShape;
    previewSeconds: number;
    imminentSeconds: number;
    activeSeconds: number;
    reducedMotionCue: string;
  };
};

export type BossPhaseMoveSet = {
  bossId: string;
  chapter: ChapterId;
  role: BossPhaseRole;
  moves: readonly [phaseTwo: BossPhaseMove, phaseThree: BossPhaseMove];
};

export const BOSS_PHASE_MOVE_SETS = BOSS_PHASE_MOVES;

export class BossPhaseMoveInvariantError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Boss phase move invariant failed:\n- ${issues.join('\n- ')}`);
    this.name = 'BossPhaseMoveInvariantError';
    this.issues = Object.freeze([...issues]);
  }
}

const MOVEMENT_MODES = new Set<BossMovementMode>(['rush', 'anchor', 'orbit', 'mirror', 'flow', 'lattice', 'sweep', 'warp']);
const TELEGRAPH_SHAPES = new Set<TelegraphShape>(['line', 'circle', 'ring', 'lane', 'grid', 'cone']);

type BossReference = { id: string; chapter: number; role: string };

export function validateBossPhaseMoveSets(
  sets: readonly BossPhaseMoveSet[],
  knownBosses?: readonly BossReference[],
) {
  const issues: string[] = [];
  const bossIds = new Set<string>();
  const moveIds = new Set<string>();

  for (const chapter of CAMPAIGN_CHAPTER_IDS) {
    for (const role of ['mid', 'final'] as const) {
      const count = sets.filter((set) => set.chapter === chapter && set.role === role).length;
      if (count !== 1) issues.push(`chapter ${chapter} requires exactly one ${role} phase move set`);
    }
  }

  for (const set of sets) {
    if (bossIds.has(set.bossId)) issues.push(`duplicate boss phase set ${set.bossId}`);
    bossIds.add(set.bossId);
    if (!CAMPAIGN_CHAPTER_IDS.includes(set.chapter)) issues.push(`boss ${set.bossId} has invalid chapter`);
    if (set.role !== 'mid' && set.role !== 'final') issues.push(`boss ${set.bossId} has invalid role`);
    if (set.moves.length !== 2) issues.push(`boss ${set.bossId} must define phase 2 and phase 3 moves`);
    set.moves.forEach((move, index) => {
      const expectedPhase = (index + 2) as BossPhase;
      const expectedRatio = expectedPhase === 2 ? 0.66 : 0.33;
      if (move.phase !== expectedPhase) issues.push(`boss ${set.bossId} move ${index} must be phase ${expectedPhase}`);
      if (move.triggerHealthRatio !== expectedRatio) {
        issues.push(`boss ${set.bossId} phase ${expectedPhase} trigger must be ${expectedRatio}`);
      }
      if (moveIds.has(move.id)) issues.push(`duplicate boss move id ${move.id}`);
      moveIds.add(move.id);
      if (!Number.isFinite(move.cadenceScale) || move.cadenceScale < 0.4 || move.cadenceScale > 1) {
        issues.push(`move ${move.id} cadenceScale must be within 0.4..1`);
      }
      if (!Number.isFinite(move.movement.speedScale) || move.movement.speedScale < 0.5 || move.movement.speedScale > 2) {
        issues.push(`move ${move.id} speedScale must be within 0.5..2`);
      }
      if (!MOVEMENT_MODES.has(move.movement.mode)) issues.push(`move ${move.id} movement mode is invalid`);
      if (move.attackGrammar.trim().length === 0) issues.push(`move ${move.id} attackGrammar is empty`);
      const telegraph = move.telegraph;
      if (!TELEGRAPH_SHAPES.has(telegraph.shape)) issues.push(`move ${move.id} telegraph shape is invalid`);
      if (!Number.isFinite(telegraph.previewSeconds) || telegraph.previewSeconds < 0.5) {
        issues.push(`move ${move.id} previewSeconds must be at least 0.5`);
      }
      if (!Number.isFinite(telegraph.imminentSeconds) || telegraph.imminentSeconds < 0.18) {
        issues.push(`move ${move.id} imminentSeconds must be at least 0.18`);
      }
      if (!Number.isFinite(telegraph.activeSeconds) || telegraph.activeSeconds <= 0) {
        issues.push(`move ${move.id} activeSeconds must be positive`);
      }
      if (telegraph.reducedMotionCue.trim().length === 0) {
        issues.push(`move ${move.id} reducedMotionCue is empty`);
      }
    });
    if (set.moves[0]?.attackGrammar === set.moves[1]?.attackGrammar) {
      issues.push(`boss ${set.bossId} phase attacks must differ`);
    }
  }

  if (knownBosses) {
    const required = knownBosses.filter((boss) => boss.role === 'mid' || boss.role === 'final');
    for (const boss of required) {
      const match = sets.find((set) => set.bossId === boss.id);
      if (!match) issues.push(`boss ${boss.id} is missing a phase move set`);
      else if (match.chapter !== boss.chapter || match.role !== boss.role) {
        issues.push(`boss ${boss.id} phase move metadata does not match the content catalog`);
      }
    }
    for (const set of sets) {
      if (!required.some((boss) => boss.id === set.bossId)) {
        issues.push(`phase move set ${set.bossId} has no matching content boss`);
      }
    }
  }

  return issues;
}

export function assertBossPhaseMoveSets(
  sets: readonly BossPhaseMoveSet[],
  knownBosses?: readonly BossReference[],
) {
  const issues = validateBossPhaseMoveSets(sets, knownBosses);
  if (issues.length > 0) throw new BossPhaseMoveInvariantError(issues);
}

export function bossPhaseMoveSetFor(
  bossId: string,
  sets: readonly BossPhaseMoveSet[] = BOSS_PHASE_MOVE_SETS,
) {
  const set = sets.find((candidate) => candidate.bossId === bossId);
  if (!set) throw new BossPhaseMoveInvariantError([`missing phase move set for boss ${bossId}`]);
  return set;
}

export function bossMovesCrossed(
  set: BossPhaseMoveSet,
  previousPhase: 1 | BossPhase,
  nextPhase: 1 | BossPhase,
) {
  if (nextPhase <= previousPhase) return [];
  return set.moves.filter((move) => move.phase > previousPhase && move.phase <= nextPhase);
}

if (CHECK_CONTENT_AT_LOAD) assertBossPhaseMoveSets(BOSS_PHASE_MOVE_SETS);
