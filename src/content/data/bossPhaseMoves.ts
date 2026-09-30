// Boss phase moves (SYS-04, SYS-05): each round boss's phase 2 and phase 3 move, with its telegraph. Data, not code:
// built apps read it from assets/content/tables.json, and tests and tools import this module (see ./index.ts).
import type { BossPhaseMoveSet } from '../bossPhases.ts';
import { deepFreeze } from '../deepFreeze.ts';

const BOSS_PHASE_MOVES = [
  {
    bossId: 's1-mid-dash', chapter: 1, role: 'mid', moves: [
      { id: 'ink-rush', name: 'bossMove.ink-rush', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.82, movement: { mode: 'rush', speedScale: 1.14 }, attackGrammar: 'tracked-dash-pair', telegraph: { shape: 'line', previewSeconds: 0.7, imminentSeconds: 0.22, activeSeconds: 0.5, reducedMotionCue: 'double-dashed-lane' } },
      { id: 'crosscut-alley', name: 'bossMove.crosscut-alley', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.66, movement: { mode: 'rush', speedScale: 1.28 }, attackGrammar: 'crossing-dash-triple', telegraph: { shape: 'grid', previewSeconds: 0.76, imminentSeconds: 0.24, activeSeconds: 0.58, reducedMotionCue: 'crosshatched-intersection' } },
    ],
  },
  {
    bossId: 's1-final-rings', chapter: 1, role: 'final', moves: [
      { id: 'split-belltower-ring', name: 'bossMove.split-belltower-ring', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.84, movement: { mode: 'anchor', speedScale: 0.92 }, attackGrammar: 'alternating-ring-gap', telegraph: { shape: 'ring', previewSeconds: 0.82, imminentSeconds: 0.26, activeSeconds: 0.6, reducedMotionCue: 'ring-gap-keyline' } },
      { id: 'closing-alley-gate', name: 'bossMove.closing-alley-gate', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.68, movement: { mode: 'anchor', speedScale: 1 }, attackGrammar: 'contracting-ring-walls', telegraph: { shape: 'ring', previewSeconds: 0.9, imminentSeconds: 0.28, activeSeconds: 0.7, reducedMotionCue: 'dense-concentric-hatch' } },
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
      { id: 'furnace-aisles', name: 'bossMove.furnace-aisles', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.8, movement: { mode: 'anchor', speedScale: 0.96 }, attackGrammar: 'sequenced-fire-lanes', telegraph: { shape: 'lane', previewSeconds: 0.86, imminentSeconds: 0.26, activeSeconds: 0.72, reducedMotionCue: 'striped-aisle-fill' } },
      { id: 'ash-vault-collapse', name: 'bossMove.ash-vault-collapse', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.63, movement: { mode: 'warp', speedScale: 1.12 }, attackGrammar: 'radial-flame-collapse', telegraph: { shape: 'circle', previewSeconds: 0.92, imminentSeconds: 0.3, activeSeconds: 0.78, reducedMotionCue: 'dense-ash-disc' } },
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
      { id: 'chain-lattice', name: 'bossMove.chain-lattice', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.8, movement: { mode: 'lattice', speedScale: 1.05 }, attackGrammar: 'staggered-root-grid', telegraph: { shape: 'grid', previewSeconds: 0.9, imminentSeconds: 0.28, activeSeconds: 0.72, reducedMotionCue: 'open-grid-to-crosshatch' } },
      { id: 'execution-cell', name: 'bossMove.execution-cell', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.62, movement: { mode: 'lattice', speedScale: 1.18 }, attackGrammar: 'closing-trap-cell', telegraph: { shape: 'grid', previewSeconds: 1, imminentSeconds: 0.32, activeSeconds: 0.84, reducedMotionCue: 'boxed-safe-cell' } },
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
      { id: 'gear-orbit', name: 'bossMove.gear-orbit', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.76, movement: { mode: 'orbit', speedScale: 1.16 }, attackGrammar: 'counter-rotating-saws', telegraph: { shape: 'ring', previewSeconds: 0.86, imminentSeconds: 0.26, activeSeconds: 0.7, reducedMotionCue: 'toothed-orbit-outline' } },
      { id: 'guillotine-gear', name: 'bossMove.guillotine-gear', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.58, movement: { mode: 'sweep', speedScale: 1.3 }, attackGrammar: 'cross-screen-saw-drop', telegraph: { shape: 'lane', previewSeconds: 0.98, imminentSeconds: 0.3, activeSeconds: 0.82, reducedMotionCue: 'toothed-drop-lanes' } },
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
      { id: 'silence-balance', name: 'bossMove.silence-balance', phase: 2, triggerHealthRatio: 0.66, cadenceScale: 0.72, movement: { mode: 'anchor', speedScale: 1.08 }, attackGrammar: 'paired-null-zones', telegraph: { shape: 'circle', previewSeconds: 0.96, imminentSeconds: 0.3, activeSeconds: 0.8, reducedMotionCue: 'paired-empty-discs' } },
      { id: 'blank-collapse', name: 'bossMove.blank-collapse', phase: 3, triggerHealthRatio: 0.33, cadenceScale: 0.54, movement: { mode: 'warp', speedScale: 1.22 }, attackGrammar: 'contracting-safe-void', telegraph: { shape: 'ring', previewSeconds: 1.08, imminentSeconds: 0.34, activeSeconds: 0.9, reducedMotionCue: 'inverse-safe-ring' } },
    ],
  },
] as const satisfies readonly BossPhaseMoveSet[];

export default deepFreeze(BOSS_PHASE_MOVES);
