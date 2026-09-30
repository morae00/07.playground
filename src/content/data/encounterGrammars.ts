// Chapter encounter grammars (SYS-03): each chapter's movement axis, hazards, beat rhythm, and landmarks. Data, not
// code: built apps read it from assets/content/tables.json, and tests and tools import this module (see ./index.ts).
import type { ChapterEncounterGrammar } from '../encounters.ts';
import { deepFreeze } from '../deepFreeze.ts';

const ENCOUNTER_GRAMMARS = [
  {
    id: 'ink-alley',
    chapter: 1,
    signature: '직교 골목을 따라 짧게 압박하고 교차로에서 숨을 돌립니다.',
    movementAxis: 'orthogonal',
    hazards: ['trap', 'fire'],
    beats: [
      { kind: 'opening', durationSeconds: [14, 20], intensity: 0.34, tiers: ['small'], formation: 'front', hazardBudget: 0 },
      { kind: 'pressure', durationSeconds: [18, 26], intensity: 0.62, tiers: ['small', 'medium'], formation: 'flank', hazardBudget: 1 },
      { kind: 'breather', durationSeconds: [8, 12], intensity: 0.22, tiers: ['small'], formation: 'lane', hazardBudget: 0 },
      { kind: 'elite', durationSeconds: [16, 22], intensity: 0.78, tiers: ['medium', 'large'], formation: 'front', hazardBudget: 2 },
    ],
    landmarks: [
      { id: 'torn-poster-crossing', stage: 3, shape: 'corridor', obstacleDensity: 0.48 },
      { id: 'ink-blockade', stage: 7, shape: 'corridor', obstacleDensity: 0.64 },
    ],
  },
  {
    id: 'iron-chapel',
    chapter: 2,
    signature: '방사형 리브가 중앙을 잠그고 측면 복제 무리가 진입합니다.',
    movementAxis: 'radial',
    hazards: ['trap', 'root'],
    beats: [
      { kind: 'opening', durationSeconds: [14, 19], intensity: 0.38, tiers: ['small', 'medium'], formation: 'ring', hazardBudget: 0 },
      { kind: 'pressure', durationSeconds: [20, 28], intensity: 0.66, tiers: ['medium'], formation: 'flank', hazardBudget: 1 },
      { kind: 'breather', durationSeconds: [8, 11], intensity: 0.24, tiers: ['small'], formation: 'front', hazardBudget: 0 },
      { kind: 'elite', durationSeconds: [17, 24], intensity: 0.82, tiers: ['medium', 'large'], formation: 'surround', hazardBudget: 2 },
    ],
    landmarks: [
      { id: 'ribbed-nave', stage: 3, shape: 'radial', obstacleDensity: 0.52 },
      { id: 'locked-rose-window', stage: 7, shape: 'radial', obstacleDensity: 0.68 },
    ],
  },
  {
    id: 'gray-canal',
    chapter: 3,
    signature: '수평 수로가 이동축을 만들고 조류가 전열 방향을 반전시킵니다.',
    movementAxis: 'horizontal',
    hazards: ['water', 'slow', 'root'],
    beats: [
      { kind: 'opening', durationSeconds: [15, 21], intensity: 0.4, tiers: ['small', 'medium'], formation: 'lane', hazardBudget: 1 },
      { kind: 'pressure', durationSeconds: [21, 29], intensity: 0.7, tiers: ['medium', 'large'], formation: 'front', hazardBudget: 2 },
      { kind: 'breather', durationSeconds: [9, 13], intensity: 0.26, tiers: ['small'], formation: 'lane', hazardBudget: 1 },
      { kind: 'elite', durationSeconds: [18, 25], intensity: 0.85, tiers: ['medium', 'large'], formation: 'flank', hazardBudget: 2 },
    ],
    landmarks: [
      { id: 'split-sluice', stage: 3, shape: 'channel', obstacleDensity: 0.44 },
      { id: 'floodgate-basin', stage: 7, shape: 'channel', obstacleDensity: 0.6 },
    ],
  },
  {
    id: 'clock-grave',
    chapter: 4,
    signature: '회전축을 따라 압박 방향이 바뀌고 눈금마다 정예가 끼어듭니다.',
    movementAxis: 'rotating',
    hazards: ['slow', 'trap'],
    beats: [
      { kind: 'opening', durationSeconds: [13, 18], intensity: 0.44, tiers: ['small', 'medium'], formation: 'ring', hazardBudget: 1 },
      { kind: 'pressure', durationSeconds: [19, 27], intensity: 0.74, tiers: ['medium', 'large'], formation: 'surround', hazardBudget: 2 },
      { kind: 'breather', durationSeconds: [7, 11], intensity: 0.28, tiers: ['small'], formation: 'ring', hazardBudget: 0 },
      { kind: 'elite', durationSeconds: [17, 23], intensity: 0.89, tiers: ['large'], formation: 'ring', hazardBudget: 2 },
    ],
    landmarks: [
      { id: 'broken-minute-dial', stage: 3, shape: 'dial', obstacleDensity: 0.5 },
      { id: 'gear-ossuary', stage: 7, shape: 'dial', obstacleDensity: 0.66 },
    ],
  },
  {
    id: 'eclipse-gate',
    chapter: 5,
    signature: '동심원 안전 공간이 수축하며 공백 지대가 이동 선택을 제한합니다.',
    movementAxis: 'concentric',
    hazards: ['null', 'slow', 'fire'],
    beats: [
      { kind: 'opening', durationSeconds: [12, 17], intensity: 0.48, tiers: ['medium'], formation: 'ring', hazardBudget: 1 },
      { kind: 'pressure', durationSeconds: [19, 26], intensity: 0.8, tiers: ['medium', 'large'], formation: 'surround', hazardBudget: 2 },
      { kind: 'breather', durationSeconds: [7, 10], intensity: 0.3, tiers: ['small', 'medium'], formation: 'lane', hazardBudget: 1 },
      { kind: 'elite', durationSeconds: [16, 22], intensity: 0.94, tiers: ['large'], formation: 'surround', hazardBudget: 3 },
    ],
    landmarks: [
      { id: 'penumbra-ring', stage: 3, shape: 'void', obstacleDensity: 0.42 },
      { id: 'cracked-totality', stage: 7, shape: 'void', obstacleDensity: 0.58 },
    ],
  },
] as const satisfies readonly ChapterEncounterGrammar[];

export default deepFreeze(ENCOUNTER_GRAMMARS);
