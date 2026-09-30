import { CHECK_CONTENT_AT_LOAD } from './checks.ts';
import { CAMPAIGN_CHAPTER_IDS, type ChapterId } from './schema.ts';

export type BossPhase = 2 | 3;
export type BossPhaseRole = 'mid' | 'final';
export type BossMovementMode = 'rush' | 'anchor' | 'orbit' | 'mirror' | 'flow' | 'lattice' | 'sweep' | 'warp';
export type TelegraphShape = 'line' | 'circle' | 'ring' | 'lane' | 'grid' | 'cone';

export type BossPhaseMove = {
  id: string;
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

export const BOSS_PHASE_MOVE_SETS = [
  {
    bossId: 's1-mid-dash', chapter: 1, role: 'mid', moves: [
      { id: 'ink-rush', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.82, movement: { mode: 'rush', speedScale: 1.14 }, attackGrammar: 'tracked-dash-pair', telegraph: { shape: 'line', previewSeconds: 0.7, imminentSeconds: 0.22, activeSeconds: 0.5, reducedMotionCue: 'double-dashed-lane' } },
      { id: 'crosscut-alley', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.66, movement: { mode: 'rush', speedScale: 1.28 }, attackGrammar: 'crossing-dash-triple', telegraph: { shape: 'grid', previewSeconds: 0.76, imminentSeconds: 0.24, activeSeconds: 0.58, reducedMotionCue: 'crosshatched-intersection' } },
    ],
  },
  {
    bossId: 's1-final-rings', chapter: 1, role: 'final', moves: [
      { id: 'split-belltower-ring', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.84, movement: { mode: 'anchor', speedScale: 0.92 }, attackGrammar: 'alternating-ring-gap', telegraph: { shape: 'ring', previewSeconds: 0.82, imminentSeconds: 0.26, activeSeconds: 0.6, reducedMotionCue: 'ring-gap-keyline' } },
      { id: 'closing-alley-gate', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.68, movement: { mode: 'anchor', speedScale: 1 }, attackGrammar: 'contracting-ring-walls', telegraph: { shape: 'ring', previewSeconds: 0.9, imminentSeconds: 0.28, activeSeconds: 0.7, reducedMotionCue: 'dense-concentric-hatch' } },
    ],
  },
  {
    bossId: 's2-mid-clones', chapter: 2, role: 'mid', moves: [
      { id: 'mirror-procession', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.84, movement: { mode: 'mirror', speedScale: 1.08 }, attackGrammar: 'clone-cardinal-lock', telegraph: { shape: 'cone', previewSeconds: 0.74, imminentSeconds: 0.24, activeSeconds: 0.56, reducedMotionCue: 'four-cardinal-glyphs' } },
      { id: 'false-bishop-lock', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.65, movement: { mode: 'mirror', speedScale: 1.2 }, attackGrammar: 'clone-feint-and-lane', telegraph: { shape: 'lane', previewSeconds: 0.84, imminentSeconds: 0.26, activeSeconds: 0.64, reducedMotionCue: 'alternating-solid-lanes' } },
    ],
  },
  {
    bossId: 's2-final-flame', chapter: 2, role: 'final', moves: [
      { id: 'furnace-aisles', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.8, movement: { mode: 'anchor', speedScale: 0.96 }, attackGrammar: 'sequenced-fire-lanes', telegraph: { shape: 'lane', previewSeconds: 0.86, imminentSeconds: 0.26, activeSeconds: 0.72, reducedMotionCue: 'striped-aisle-fill' } },
      { id: 'ash-vault-collapse', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.63, movement: { mode: 'warp', speedScale: 1.12 }, attackGrammar: 'radial-flame-collapse', telegraph: { shape: 'circle', previewSeconds: 0.92, imminentSeconds: 0.3, activeSeconds: 0.78, reducedMotionCue: 'dense-ash-disc' } },
    ],
  },
  {
    bossId: 's3-mid-tide', chapter: 3, role: 'mid', moves: [
      { id: 'current-reversal', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.82, movement: { mode: 'flow', speedScale: 1.1 }, attackGrammar: 'alternating-current-lanes', telegraph: { shape: 'lane', previewSeconds: 0.88, imminentSeconds: 0.28, activeSeconds: 0.74, reducedMotionCue: 'opposed-chevron-lanes' } },
      { id: 'flood-crest', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.64, movement: { mode: 'flow', speedScale: 1.22 }, attackGrammar: 'sweeping-tide-wall', telegraph: { shape: 'line', previewSeconds: 0.96, imminentSeconds: 0.3, activeSeconds: 0.82, reducedMotionCue: 'triple-wave-keyline' } },
    ],
  },
  {
    bossId: 's3-final-traps', chapter: 3, role: 'final', moves: [
      { id: 'chain-lattice', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.8, movement: { mode: 'lattice', speedScale: 1.05 }, attackGrammar: 'staggered-root-grid', telegraph: { shape: 'grid', previewSeconds: 0.9, imminentSeconds: 0.28, activeSeconds: 0.72, reducedMotionCue: 'open-grid-to-crosshatch' } },
      { id: 'execution-cell', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.62, movement: { mode: 'lattice', speedScale: 1.18 }, attackGrammar: 'closing-trap-cell', telegraph: { shape: 'grid', previewSeconds: 1, imminentSeconds: 0.32, activeSeconds: 0.84, reducedMotionCue: 'boxed-safe-cell' } },
    ],
  },
  {
    bossId: 's4-mid-clock', chapter: 4, role: 'mid', moves: [
      { id: 'second-hand-sweep', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.78, movement: { mode: 'sweep', speedScale: 1.12 }, attackGrammar: 'rotating-hand-pair', telegraph: { shape: 'line', previewSeconds: 0.82, imminentSeconds: 0.24, activeSeconds: 0.66, reducedMotionCue: 'numbered-sweep-sector' } },
      { id: 'time-fracture', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.6, movement: { mode: 'warp', speedScale: 1.24 }, attackGrammar: 'segmented-clock-burst', telegraph: { shape: 'ring', previewSeconds: 0.94, imminentSeconds: 0.28, activeSeconds: 0.76, reducedMotionCue: 'broken-dial-segments' } },
    ],
  },
  {
    bossId: 's4-final-saw', chapter: 4, role: 'final', moves: [
      { id: 'gear-orbit', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.76, movement: { mode: 'orbit', speedScale: 1.16 }, attackGrammar: 'counter-rotating-saws', telegraph: { shape: 'ring', previewSeconds: 0.86, imminentSeconds: 0.26, activeSeconds: 0.7, reducedMotionCue: 'toothed-orbit-outline' } },
      { id: 'guillotine-gear', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.58, movement: { mode: 'sweep', speedScale: 1.3 }, attackGrammar: 'cross-screen-saw-drop', telegraph: { shape: 'lane', previewSeconds: 0.98, imminentSeconds: 0.3, activeSeconds: 0.82, reducedMotionCue: 'toothed-drop-lanes' } },
    ],
  },
  {
    bossId: 's5-mid-eclipse', chapter: 5, role: 'mid', moves: [
      { id: 'penumbra-lanes', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.74, movement: { mode: 'warp', speedScale: 1.14 }, attackGrammar: 'alternating-eclipse-lanes', telegraph: { shape: 'lane', previewSeconds: 0.92, imminentSeconds: 0.28, activeSeconds: 0.76, reducedMotionCue: 'white-crack-lanes' } },
      { id: 'totality-crossing', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.56, movement: { mode: 'sweep', speedScale: 1.26 }, attackGrammar: 'orthogonal-totality-walls', telegraph: { shape: 'grid', previewSeconds: 1.02, imminentSeconds: 0.32, activeSeconds: 0.86, reducedMotionCue: 'negative-space-cross' } },
    ],
  },
  {
    bossId: 's5-final-null', chapter: 5, role: 'final', moves: [
      { id: 'silence-balance', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.72, movement: { mode: 'anchor', speedScale: 1.08 }, attackGrammar: 'paired-null-zones', telegraph: { shape: 'circle', previewSeconds: 0.96, imminentSeconds: 0.3, activeSeconds: 0.8, reducedMotionCue: 'paired-empty-discs' } },
      { id: 'blank-collapse', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.54, movement: { mode: 'warp', speedScale: 1.22 }, attackGrammar: 'contracting-safe-void', telegraph: { shape: 'ring', previewSeconds: 1.08, imminentSeconds: 0.34, activeSeconds: 0.9, reducedMotionCue: 'inverse-safe-ring' } },
    ],
  },
] as const satisfies readonly BossPhaseMoveSet[];

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
