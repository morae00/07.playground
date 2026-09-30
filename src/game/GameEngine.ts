import {
  FIXED_TIMESTEP,
  collectSegmentHits,
  consumeHitStopStep,
  createSeededRandom,
  createVortexProfile,
  expiredThisStep,
  planFixedSteps,
  resolveDraftTransition,
  resolveTerminalEvent,
  segmentCircleHitTime,
  segmentRectHitTime,
  shockHitsPlayer,
} from './p0Core';
import {
  advanceCoinFeverFrenzy,
  advanceTimedSlow,
  applyTimedSlow,
  assertCampaignContent,
  calculateFireDotDamage,
  effectiveCoinFeverAttackSpeed,
  filterSkillsForChapter,
  paperWardDirectHitInvulnerability,
  refreshCoinFeverFrenzy,
  selectRequiredBoss,
} from './p1Core';
import { SpatialIndex } from './spatialIndex';
import { REMASTER_RULES, ruleSetFor, type RuleSet, type RuleSetId } from './rules';
import {
  DRAFT_SIZE,
  ENEMY_RADIUS,
  FIELD_BOSS_MARKS,
  HIT_RADIUS,
  LEGACY_BOSS_MARK,
  LEGACY_BOSS_MIN_CHAPTER,
  MAX_SKILL_LEVEL,
  RANGED_ENEMY,
  RARITY_WEIGHTS,
  TIER_ROLL,
} from './grammar';
import { ObjectPool, compactWhere, recycleWhere } from './objectPool';
import { impactCue, toneGain } from './audioPolicy';
import {
  PICKUP_HARD_CAP,
  PICKUP_SOFT_TTL,
  mergePickupValue,
  pickupTtl,
  selectPickupMergeTarget,
} from './pickupLifecycle';
import {
  circleVisible,
  interpolatePosition,
  makeViewport,
  rectVisible,
  segmentVisible,
  visibleGridLineRange,
  type Viewport,
} from './render/viewport';
import { GameRenderer, type EffectOwner } from './render/GameRenderer';
import { NEUTRAL, SIGNAL, rgba } from './render/palette';
import { createRenderFrameSnapshot } from './render/renderSnapshot';
import {
  CHAPTER_VISUALS,
  bossPhaseForHealth,
  classifyImpact,
  motionPolicy,
} from './visualContracts';
import {
  circleRectPush,
  clamp,
  distance,
  distancePointToSegment,
  normalize,
  pointInRect,
} from './worldMath';
import type {
  GameOptions,
  MetaState,
  MetaUpgradeId,
  PaceMode,
  PassiveId,
} from '../platform/save';
import { DEVELOPER_UI_AVAILABLE } from '../platform/developerAccess';
import { readGamepadIntent, watchReducedMotion } from '../ui/inputContracts';
import {
  INFINITE_BASELINE,
  infiniteDifficultyAt,
  infiniteKillScore,
  infiniteScoreWithSurvival,
} from './infiniteMode';
import {
  BOSS_PHASE_MOVE_SETS,
  CHAPTER_ENCOUNTER_GRAMMARS,
  CONTENT_SCHEMA_VERSION,
  assertBossPhaseMoveSets,
  defineContentCatalog,
  encounterGrammarForChapter,
  validateEncounterGrammarReferences,
  type BossPhaseMove,
  type ChapterId,
  type LandmarkShape,
  type StageId,
} from '../content';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type StageKind = 'normal' | 'midBoss' | 'finalBoss';
export type RunMode = 'campaign' | 'infinite';
export type DraftReason = 'level' | 'boss';

export type SkillId =
  | 'needleStorm'
  | 'fanKnives'
  | 'chainSpark'
  | 'frostLine'
  | 'orbitScythes'
  | 'boneMortar'
  | 'railSpear'
  | 'mirrorClone'
  | 'voidMine'
  | 'blackSun'
  | 'ironFrame'
  | 'magnetSigil'
  | 'paperWard'
  | 'recoveryThread'
  | 'coinFever'
  | 'eclipseStep'
  | 'executionMark';

export type RunUpgradeId = 'attack' | 'maxHp' | 'moveSpeed' | 'attackSpeed' | 'magnet';

export type StatBlock = {
  attack: number;
  defense: number;
  maxHp: number;
  moveSpeed: number;
  critChance: number;
  critDamage: number;
  bossDamage: number;
  normalDamage: number;
  attackSpeed: number;
  hpRegen: number;
  magnet: number;
  coinGain: number;
};

export type SkillDef = {
  id: SkillId;
  name: string;
  shortName: string;
  rarity: Rarity;
  active: boolean;
  chapterMin: number;
  summary: string;
  levelText: (level: number) => string;
  awakeningText: string;
};

export type SkillState = {
  level: number;
  awakened: boolean;
};

export type SkillOffer =
  | {
      kind: 'skill' | 'awakening';
      skillId: SkillId;
      rarity: Rarity;
      title: string;
      body: string;
      levelLine: string;
    }
  | {
      kind: 'bonus';
      bonus: 'heal' | 'coins' | 'overdrive';
      rarity: Rarity;
      title: string;
      body: string;
      levelLine: string;
    };

export type DraftState = {
  id: number;
  title: string;
  reason: DraftReason;
  after: 'resume' | 'roundClear';
  cards: SkillOffer[];
};

export type StageProgress = {
  chapter: number;
  stage: number;
};

export type ActiveStatusEffect = {
  id: string;
  kind: 'buff' | 'debuff';
  label: string;
  value?: string;
  remaining?: number;
};

export type HudSnapshot = {
  runMode: RunMode;
  seed: number;
  chapter: number;
  stage: number;
  stageKind: StageKind;
  objective: string;
  objectiveProgress: number;
  objectiveTarget: number;
  timeLeft: number;
  duration: number;
  timeScale: number;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  nextXp: number;
  coins: number;
  kills: number;
  enemyCount: number;
  elapsed: number;
  score: number;
  bossKills: number;
  dangerRank: number;
  scoreEligible: boolean;
  rulesVersion: number;
  bossName?: string;
  bossMove?: string;
  bossHp?: number;
  bossMaxHp?: number;
  skills: Partial<Record<SkillId, SkillState>>;
  runUpgrades: Record<RunUpgradeId, number>;
  stats: StatBlock;
  activeEffects: ActiveStatusEffect[];
  cc: string;
};

export type Settlement = {
  runMode: RunMode;
  seed: number;
  chapter: number;
  stage: number;
  title: string;
  kills: number;
  coins: number;
  /** Coins earned during the stage; settlement gold converts these at ×0.28. */
  coinsEarned: number;
  gold: number;
  xp: number;
  cleared: boolean;
  gameComplete: boolean;
  score: number;
  survivedSeconds: number;
  bossKills: number;
  scoreEligible: boolean;
  rulesVersion: number;
};

export type EngineCallbacks = {
  onSnapshot: (snapshot: HudSnapshot) => void;
  onDraft: (draft: DraftState) => void;
  onRoundClear: (settlement: Settlement) => void;
  onGameOver: (settlement: Settlement) => void;
  onPauseIntent?: () => void;
};

export type EnemyTier = 'small' | 'medium' | 'large' | 'boss';
export type BossPattern =
  | 'dash'
  | 'rings'
  | 'clones'
  | 'flame'
  | 'tide'
  | 'traps'
  | 'clock'
  | 'saw'
  | 'eclipse'
  | 'null'
  | 'shock';

export type BossDef = {
  id: string;
  name: string;
  chapter: number;
  role: 'field' | 'mid' | 'final';
  pattern: BossPattern;
  hp: number;
  damage: number;
  speed: number;
};

export type StageDef = {
  id: number;
  name: string;
  subtitle: string;
  difficulty: string;
  encounterGrammarId: string;
  stages: Array<{
    id: number;
    kind: StageKind;
    objective: string;
  }>;
};

export type Entity = {
  id: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xp: number;
  coin: number;
  tier: EnemyTier;
  variant: number;
  isBoss: boolean;
  attackStyle: 'contact' | 'ranged';
  rangedCooldown: number;
  rangedTelegraph: number;
  boss?: BossDef;
  legacyBoss?: boolean;
  contactTimer: number;
  hitFlash: number;
  stun: number;
  root: number;
  slowMultiplier: number;
  slowTimer: number;
  patternTimer: number;
  patternPhase: string;
  patternX: number;
  patternY: number;
  damageCooldowns: Record<string, number>;
  bossPhase: 1 | 2 | 3;
  bossPhaseFlash: number;
};

export type Projectile = {
  id: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  maxLife: number;
  returning: boolean;
  pierce: number;
  knockback: number;
  skillId: SkillId;
  blockedBySolid: boolean;
  hitEnemyIds: Set<number>;
};

export type BossProjectile = {
  id: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  kind: 'dot' | 'ring' | 'saw' | 'eclipse' | 'enemy';
};

export type Pickup = {
  id: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  kind: 'xp' | 'coin';
  value: number;
  life: number;
  maxLife: number;
};

export type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
};

export type DamageNumber = {
  id: number;
  x: number;
  y: number;
  value: number;
  crit: boolean;
  life: number;
  maxLife: number;
  owner: EffectOwner;
};

export type Hazard = {
  id: number;
  kind: 'water' | 'trap' | 'fire' | 'slow' | 'root' | 'null' | 'warning' | 'vortex' | 'shock';
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  damage: number;
  slow: number;
  triggered: boolean;
  skillDamage?: number;
  sourceSkillId?: SkillId;
  pull?: number;
  collapseDamage?: number;
};

export type Obstacle = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'solid' | 'pillar';
};

export type BeamEffect = {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  life: number;
  maxLife: number;
  owner: EffectOwner;
};

export type ChainEffect = {
  id: number;
  points: Array<{ x: number; y: number }>;
  life: number;
  maxLife: number;
};

export type ImpactRing = {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  tier: 'heavy' | 'critical';
  owner: EffectOwner;
};

export const WORLD_W = 4200;
export const WORLD_H = 3000;
const BOSS_PROJECTILE_HARD_CAP = 320;
const TARGET_COLOR = SIGNAL.allyDeep;

export const RARITY: Record<Rarity, { label: string; weight: number; className: string }> = {
  common: { label: '일반', weight: RARITY_WEIGHTS.common, className: 'rarityCommon' },
  rare: { label: '희귀', weight: RARITY_WEIGHTS.rare, className: 'rarityRare' },
  epic: { label: '영웅', weight: RARITY_WEIGHTS.epic, className: 'rarityEpic' },
  legendary: { label: '전설', weight: RARITY_WEIGHTS.legendary, className: 'rarityLegendary' },
  mythic: { label: '신화', weight: RARITY_WEIGHTS.mythic, className: 'rarityMythic' },
};

export const BASE_STATS: StatBlock = {
  attack: 12,
  defense: 2,
  maxHp: 120,
  moveSpeed: 212,
  critChance: 0.08,
  critDamage: 1.65,
  bossDamage: 1,
  normalDamage: 1,
  attackSpeed: 1,
  hpRegen: 1.1,
  magnet: 115,
  coinGain: 1,
};

export const SKILLS: Record<SkillId, SkillDef> = {
  needleStorm: {
    id: 'needleStorm',
    name: '먹선 바늘',
    shortName: '바늘',
    rarity: 'common',
    active: true,
    chapterMin: 1,
    summary: '가장 가까운 적에게 벽에 막히는 고속 투사체를 발사합니다.',
    levelText: (level) => `피해 +${level * 18}%, 투사체 ${(level >= 3 ? 2 : 1) + (level >= 5 ? 1 : 0)}개`,
    awakeningText: '부채꼴 난사로 변해 타격 시 파편이 튀며 가장 가까운 적을 추가로 찌릅니다.',
  },
  fanKnives: {
    id: 'fanKnives',
    name: '부채 단검',
    shortName: '단검',
    rarity: 'common',
    active: true,
    chapterMin: 1,
    summary: '전방 부채꼴로 얇은 단검을 흩뿌립니다.',
    levelText: (level) => `단검 ${level + 3}개, 재사용 대기 -${level * 4}%`,
    awakeningText: '단검이 되돌아오며 후방의 적도 베어냅니다.',
  },
  chainSpark: {
    id: 'chainSpark',
    name: '백색 연쇄',
    shortName: '연쇄',
    rarity: 'rare',
    active: true,
    chapterMin: 1,
    summary: '적 사이를 튀는 번개선을 즉시 꽂습니다.',
    levelText: (level) => `연쇄 ${level + 2}회, 피해 +${level * 14}%`,
    awakeningText: '마지막 연쇄가 폭발하고 짧은 기절을 남깁니다.',
  },
  frostLine: {
    id: 'frostLine',
    name: '백묵 절단',
    shortName: '백묵',
    rarity: 'rare',
    active: true,
    chapterMin: 1,
    summary: '가장 가까운 적 방향으로 감속 절단선을 긋습니다.',
    levelText: (level) => `폭 +${level * 3}, 감속 ${Math.min(70, 25 + level * 7)}%`,
    awakeningText: '절단선이 남긴 서리가 적을 짧게 속박합니다.',
  },
  orbitScythes: {
    id: 'orbitScythes',
    name: '초승 궤도',
    shortName: '궤도',
    rarity: 'epic',
    active: true,
    chapterMin: 2,
    summary: '몸 주위를 도는 날이 근접한 적을 계속 갈아냅니다.',
    levelText: (level) => `날 ${level + 1}개, 궤도 반경 +${level * 10}`,
    awakeningText: '반대 방향 외곽 궤도가 추가되어 보스에게 연속 타격을 넣습니다.',
  },
  boneMortar: {
    id: 'boneMortar',
    name: '골분 박격',
    shortName: '박격',
    rarity: 'epic',
    active: true,
    chapterMin: 2,
    summary: '적이 가장 많이 몰린 지점에 묵직한 낙하 폭발을 일으킵니다.',
    levelText: (level) => `폭발 반경 +${level * 12}, 피해 +${level * 22}%`,
    awakeningText: '폭발 중심에 충격파가 한 번 더 터집니다.',
  },
  railSpear: {
    id: 'railSpear',
    name: '흑선 레일',
    shortName: '레일',
    rarity: 'legendary',
    active: true,
    chapterMin: 3,
    summary: '화면을 가르는 관통 직선을 충전 후 발사합니다.',
    levelText: (level) => `폭 +${level * 2}, 피해 +${level * 28}%`,
    awakeningText: '레일이 지나간 자리에 균열 폭발이 이어집니다.',
  },
  mirrorClone: {
    id: 'mirrorClone',
    name: '거울 분신',
    shortName: '분신',
    rarity: 'legendary',
    active: true,
    chapterMin: 3,
    summary: '좌우 잔상이 보조 사격을 합니다.',
    levelText: (level) => `분신 사격 피해 +${level * 18}%, 관통 +${Math.floor(level / 2)}`,
    awakeningText: '분신이 가끔 레일 사격을 복제합니다.',
  },
  voidMine: {
    id: 'voidMine',
    name: '무음 지뢰',
    shortName: '지뢰',
    rarity: 'epic',
    active: true,
    chapterMin: 3,
    summary: '발밑에 끌어당기는 지뢰장을 남깁니다.',
    levelText: (level) => `지속 +${(level * 0.25).toFixed(1)}s, 흡입력 +${level * 10}%`,
    awakeningText: '지뢰장이 사라질 때 처형 폭발을 일으킵니다.',
  },
  blackSun: {
    id: 'blackSun',
    name: '검은 태양',
    shortName: '태양',
    rarity: 'mythic',
    active: true,
    chapterMin: 4,
    summary: '적 밀집 지점에 끌어당기는 중력장을 엽니다.',
    levelText: (level) => `지속 +${level * 0.35}s, 흡입력 +${level * 12}%`,
    awakeningText: '붕괴 순간 최대 체력 비례 피해와 긴 감속을 겹칩니다.',
  },
  ironFrame: {
    id: 'ironFrame',
    name: '철골 프레임',
    shortName: '철골',
    rarity: 'common',
    active: false,
    chapterMin: 1,
    summary: '방어력과 최대 체력을 올립니다.',
    levelText: (level) => `방어 +${level * 1.2}, 최대 체력 +${level * 18}`,
    awakeningText: '방어 +3.5, 최대 체력 +40. 피격 직후 0.36초 보호막을 만듭니다.',
  },
  magnetSigil: {
    id: 'magnetSigil',
    name: '수거 자석',
    shortName: '자석',
    rarity: 'common',
    active: false,
    chapterMin: 1,
    summary: '경험치와 코인을 더 먼 거리에서 끌어옵니다.',
    levelText: (level) => `획득 반경 +${level * 36}, 코인 획득 +${level * 4}%`,
    awakeningText: '획득 반경 +180, 코인 +15%. 4.8초마다 맵 위 보상을 강하게 당깁니다.',
  },
  paperWard: {
    id: 'paperWard',
    name: '종이 갑주',
    shortName: '갑주',
    rarity: 'rare',
    active: false,
    chapterMin: 2,
    summary: '방어력과 피격 후 무적 시간을 올립니다.',
    levelText: (level) => `방어 +${level}, 피격 무적 +${(level * 0.04).toFixed(2)}s`,
    awakeningText: '방어 +2.5. 피격 시 반경 140의 적을 밀쳐내는 종이 파열이 발생합니다.',
  },
  recoveryThread: {
    id: 'recoveryThread',
    name: '회복 실',
    shortName: '회복',
    rarity: 'rare',
    active: false,
    chapterMin: 1,
    summary: '체력 회복과 획득 반경을 올립니다.',
    levelText: (level) => `초당 회복 +${(level * 0.65).toFixed(1)}, 자석 +${level * 14}`,
    awakeningText: '체력이 가득 찬 동안 2.2초마다 주변으로 반격선을 뿌립니다.',
  },
  coinFever: {
    id: 'coinFever',
    name: '동전 열병',
    shortName: '열병',
    rarity: 'rare',
    active: false,
    chapterMin: 4,
    summary: '코인 획득량과 공격속도를 함께 올립니다.',
    levelText: (level) => `코인 +${level * 9}%, 공격속도 +${level * 4}%`,
    awakeningText: '코인을 먹을 때 짧은 공격속도 폭주가 발동합니다.',
  },
  eclipseStep: {
    id: 'eclipseStep',
    name: '일식 보법',
    shortName: '보법',
    rarity: 'mythic',
    active: true,
    chapterMin: 5,
    summary: '위협이 몰릴 때 순간적으로 그림자 베기를 펼칩니다.',
    levelText: (level) => `베기 반경 +${level * 16}, 무적 +${(level * 0.05).toFixed(2)}s`,
    awakeningText: '베기 후 검은 잔상이 한 번 더 전장을 훑습니다.',
  },
  executionMark: {
    id: 'executionMark',
    name: '집행 표식',
    shortName: '집행',
    rarity: 'legendary',
    active: false,
    chapterMin: 2,
    summary: '치명타와 보스 피해량을 올립니다.',
    levelText: (level) => `치명타 +${level * 3}%, 보스 피해 +${level * 7}%`,
    awakeningText: '치명타 +10%, 보스 피해 +20%. 낮은 체력의 보스에게 최대 45% 추가 피해를 줍니다.',
  },
};

export const SKILL_IDS = Object.keys(SKILLS) as SkillId[];

export const META_UPGRADES: Record<
  MetaUpgradeId,
  { label: string; max: number; baseCost: number; growth: number; line: string }
> = {
  attack: { label: '공격 훈련', max: 30, baseCost: 35, growth: 1.22, line: '공격력' },
  defense: { label: '방어 자세', max: 25, baseCost: 30, growth: 1.2, line: '방어력' },
  maxHp: { label: '체력 단련', max: 30, baseCost: 32, growth: 1.21, line: '체력' },
  moveSpeed: { label: '이동 보폭', max: 20, baseCost: 40, growth: 1.24, line: '이동속도' },
  crit: { label: '치명 감각', max: 20, baseCost: 48, growth: 1.26, line: '치명타' },
  regen: { label: '회복 호흡', max: 20, baseCost: 36, growth: 1.23, line: '회복속도' },
  magnet: { label: '자석 코어', max: 25, baseCost: 34, growth: 1.2, line: '획득 반경' },
};

export const META_PASSIVES: Record<PassiveId, { label: string; max: number; line: string }> = {
  rareLuck: { label: '희귀 감각', max: 5, line: '고등급 스킬 등장률' },
  bossHunter: { label: '보스 사냥꾼', max: 5, line: '보스 피해량' },
  coinMagnet: { label: '동전 회수', max: 5, line: '코인 획득량과 자석' },
};

export const RUN_UPGRADES: Record<RunUpgradeId, { label: string; baseCost: number; line: string }> = {
  attack: { label: '공격력', baseCost: 34, line: '+12%' },
  maxHp: { label: '체력', baseCost: 28, line: '+20' },
  moveSpeed: { label: '속도', baseCost: 30, line: '+6%' },
  attackSpeed: { label: '공속', baseCost: 38, line: '+8%' },
  magnet: { label: '자석', baseCost: 24, line: '+36' },
};

export const CHAPTER_THEME = [
  '먹선 골목',
  '철문 예배당',
  '무채 운하',
  '시계 무덤',
  '일식 관문',
];

export const CHAPTER_COUNT = 5;
export const STAGES_PER_CHAPTER = 10;
export const TOTAL_STAGE_COUNT = CHAPTER_COUNT * STAGES_PER_CHAPTER;

export const OBJECTIVE_POOL = [
  '소형 무리 압박전',
  '중형 경계선 유지',
  '지형 함정 구역',
  '정예 추격전',
  '자원 회수 압박전',
  '대형 개체 회피전',
  '투사체 포위망',
  '보스 전초 압박전',
];

export function stageKind(stageNo: number): StageKind {
  if (stageNo === 5) return 'midBoss';
  if (stageNo === 10) return 'finalBoss';
  return 'normal';
}

export function objectiveFor(chapter: number, stageNo: number) {
  const kind = stageKind(stageNo);
  if (kind === 'midBoss') return `${chapter}챕터 중간보스 처치 · 시간 종료 시 광폭화`;
  if (kind === 'finalBoss') return `${chapter}챕터 보스 처치 · 시간 종료 시 광폭화`;
  return `제한시간 생존 · ${OBJECTIVE_POOL[(stageNo + chapter - 2) % OBJECTIVE_POOL.length]}`;
}

export function stageIndex(chapter: number, stageNo: number) {
  return (chapter - 1) * STAGES_PER_CHAPTER + stageNo;
}

export function stageFromIndex(index: number): StageProgress {
  const safe = Math.max(1, Math.min(TOTAL_STAGE_COUNT, index));
  return {
    chapter: Math.floor((safe - 1) / STAGES_PER_CHAPTER) + 1,
    stage: ((safe - 1) % STAGES_PER_CHAPTER) + 1,
  };
}

export function nextStageProgress(chapter: number, stageNo: number) {
  return stageFromIndex(stageIndex(chapter, stageNo) + 1);
}

export function isStageUnlocked(meta: MetaState, chapter: number, stageNo: number) {
  return stageIndex(chapter, stageNo) <= stageIndex(meta.progress.chapter, meta.progress.stage);
}

export const CHAPTERS: StageDef[] = CHAPTER_THEME.map((theme, index) => {
  const chapter = index + 1;
  const grammar = CHAPTER_ENCOUNTER_GRAMMARS[index];
  const labels = ['입문', '보통', '위험', '고난', '최종'];
  return {
    id: chapter,
    name: `Chapter ${chapter}: ${theme}`,
    subtitle: '10개 Stage · St5 중간보스 · St10 챕터보스',
    difficulty: labels[index],
    encounterGrammarId: grammar.id,
    stages: Array.from({ length: 10 }, (_, stageIndex) => {
      const stageNo = stageIndex + 1;
      return {
        id: stageNo,
        kind: stageKind(stageNo),
        objective: objectiveFor(chapter, stageNo),
      };
    }),
  };
});

export const FIELD_BOSSES: BossDef[] = [
  { id: 'field-shock', name: '균열 장교', chapter: 1, role: 'field', pattern: 'shock', hp: 720, damage: 15, speed: 92 },
  { id: 'field-rings', name: '백환 관리자', chapter: 2, role: 'field', pattern: 'rings', hp: 980, damage: 17, speed: 78 },
  { id: 'field-trap', name: '덫 설계자', chapter: 3, role: 'field', pattern: 'traps', hp: 1260, damage: 19, speed: 88 },
  { id: 'field-clock', name: '초침 집행관', chapter: 4, role: 'field', pattern: 'clock', hp: 1580, damage: 22, speed: 92 },
  { id: 'field-null', name: '무음 심판관', chapter: 5, role: 'field', pattern: 'null', hp: 1960, damage: 24, speed: 82 },
];

export const BOSS_ROUND_BOSSES: BossDef[] = [
  { id: 's1-mid-dash', name: '잉크 도살자', chapter: 1, role: 'mid', pattern: 'dash', hp: 2400, damage: 20, speed: 112 },
  { id: 's1-final-rings', name: '종탑 간수', chapter: 1, role: 'final', pattern: 'rings', hp: 3600, damage: 24, speed: 74 },
  { id: 's2-mid-clones', name: '유리 주교', chapter: 2, role: 'mid', pattern: 'clones', hp: 4200, damage: 27, speed: 82 },
  { id: 's2-final-flame', name: '용광의 입', chapter: 2, role: 'final', pattern: 'flame', hp: 5800, damage: 31, speed: 78 },
  { id: 's3-mid-tide', name: '무채 조수왕', chapter: 3, role: 'mid', pattern: 'tide', hp: 6700, damage: 34, speed: 86 },
  { id: 's3-final-traps', name: '걸쇠 여제', chapter: 3, role: 'final', pattern: 'traps', hp: 8300, damage: 38, speed: 94 },
  { id: 's4-mid-clock', name: '시계 폭군', chapter: 4, role: 'mid', pattern: 'clock', hp: 9400, damage: 42, speed: 100 },
  { id: 's4-final-saw', name: '톱니 전령', chapter: 4, role: 'final', pattern: 'saw', hp: 11600, damage: 46, speed: 104 },
  { id: 's5-mid-eclipse', name: '일식 원장', chapter: 5, role: 'mid', pattern: 'eclipse', hp: 13200, damage: 50, speed: 92 },
  { id: 's5-final-null', name: '공백 천칭', chapter: 5, role: 'final', pattern: 'null', hp: 17000, damage: 56, speed: 98 },
];

assertCampaignContent({
  chapters: CHAPTERS,
  bosses: [...FIELD_BOSSES, ...BOSS_ROUND_BOSSES].map((boss) => ({
    id: boss.id,
    chapter: boss.chapter,
    role: boss.role,
  })),
  skills: SKILL_IDS.map((id) => ({ id, chapterMin: SKILLS[id].chapterMin })),
});

export const GAME_CONTENT_CATALOG = defineContentCatalog({
  schemaVersion: CONTENT_SCHEMA_VERSION,
  chapters: CHAPTERS.map((chapter) => ({
    ...chapter,
    id: chapter.id as ChapterId,
    stages: chapter.stages.map((stage) => ({ ...stage, id: stage.id as StageId })),
  })),
  bosses: [...FIELD_BOSSES, ...BOSS_ROUND_BOSSES].map((boss) => ({
    ...boss,
    chapter: boss.chapter as ChapterId,
  })),
  skills: SKILL_IDS.map((id) => ({
    ...SKILLS[id],
    chapterMin: SKILLS[id].chapterMin as ChapterId,
    maxLevel: 5,
    copy: {
      summary: SKILLS[id].summary,
      levelText: SKILLS[id].levelText,
      awakeningText: SKILLS[id].awakeningText,
    },
  })),
});

const encounterReferenceIssues = validateEncounterGrammarReferences(GAME_CONTENT_CATALOG.chapters, CHAPTER_ENCOUNTER_GRAMMARS);
if (encounterReferenceIssues.length > 0) {
  throw new Error(`Encounter content references are invalid:\n- ${encounterReferenceIssues.join('\n- ')}`);
}
assertBossPhaseMoveSets(BOSS_PHASE_MOVE_SETS, GAME_CONTENT_CATALOG.bosses);

export const makeRunUpgrades = (): Record<RunUpgradeId, number> => ({
  attack: 0,
  maxHp: 0,
  moveSpeed: 0,
  attackSpeed: 0,
  magnet: 0,
});

export function xpForMetaLevel(level: number) {
  return 140 + level * 55 + Math.floor(level ** 1.45 * 18);
}

export function metaUpgradeCost(id: MetaUpgradeId, level: number) {
  const def = META_UPGRADES[id];
  return Math.floor(def.baseCost * def.growth ** level);
}

export function runUpgradeCost(id: RunUpgradeId, level: number) {
  return Math.floor(RUN_UPGRADES[id].baseCost * 1.42 ** level);
}

export function stageDuration(kind: StageKind, paceMode: PaceMode) {
  // Showcase pacing is a developer tool; shipped builds always use standard stage lengths (BUG-17).
  if (paceMode === 'showcase' && DEVELOPER_UI_AVAILABLE) return kind === 'normal' ? 90 : 135;
  return kind === 'normal' ? 720 : 1020;
}

export function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function buildStats(
  meta: MetaState,
  runUpgrades: Record<RunUpgradeId, number>,
  skills: Partial<Record<SkillId, SkillState>>,
) {
  const stats: StatBlock = { ...BASE_STATS };
  stats.attack *= 1 + meta.upgrades.attack * 0.08 + runUpgrades.attack * 0.12;
  stats.defense += meta.upgrades.defense * 0.9;
  stats.maxHp += meta.upgrades.maxHp * 10 + runUpgrades.maxHp * 20;
  stats.moveSpeed *= 1 + meta.upgrades.moveSpeed * 0.025 + runUpgrades.moveSpeed * 0.06;
  stats.critChance += meta.upgrades.crit * 0.012;
  stats.critDamage += meta.upgrades.crit * 0.018;
  stats.attackSpeed *= 1 + runUpgrades.attackSpeed * 0.08;
  stats.hpRegen += meta.upgrades.regen * 0.2;
  stats.magnet += meta.upgrades.magnet * 12 + runUpgrades.magnet * 36;
  stats.bossDamage += meta.passives.bossHunter * 0.045;
  stats.coinGain += meta.passives.coinMagnet * 0.08;
  stats.magnet += meta.passives.coinMagnet * 18;

  const ironFrame = skills.ironFrame;
  if (ironFrame) {
    stats.defense += ironFrame.level * 1.2 + (ironFrame.awakened ? 3.5 : 0);
    stats.maxHp += ironFrame.level * 18 + (ironFrame.awakened ? 40 : 0);
  }

  const recoveryThread = skills.recoveryThread;
  if (recoveryThread) {
    stats.hpRegen += recoveryThread.level * 0.65 + (recoveryThread.awakened ? 2.4 : 0);
    stats.magnet += recoveryThread.level * 14 + (recoveryThread.awakened ? 60 : 0);
  }

  const magnetSigil = skills.magnetSigil;
  if (magnetSigil) {
    stats.magnet += magnetSigil.level * 36 + (magnetSigil.awakened ? 180 : 0);
    stats.coinGain += magnetSigil.level * 0.04 + (magnetSigil.awakened ? 0.15 : 0);
  }

  const paperWard = skills.paperWard;
  if (paperWard) {
    stats.defense += paperWard.level + (paperWard.awakened ? 2.5 : 0);
  }

  const coinFever = skills.coinFever;
  if (coinFever) {
    stats.coinGain += coinFever.level * 0.09;
    stats.attackSpeed *= 1 + coinFever.level * 0.04;
  }

  const executionMark = skills.executionMark;
  if (executionMark) {
    stats.critChance += executionMark.level * 0.03 + (executionMark.awakened ? 0.1 : 0);
    stats.bossDamage += executionMark.level * 0.07 + (executionMark.awakened ? 0.2 : 0);
  }

  stats.critChance = clamp(stats.critChance, 0, 0.72);
  return stats;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private visualRenderer = new GameRenderer();
  private callbacks: EngineCallbacks;

  private meta: MetaState;
  private options: GameOptions;
  private rules: RuleSet = REMASTER_RULES;
  private raf = 0;
  private lastTime = 0;
  private accumulator = 0;
  private running = false;
  private paused = false;
  private disposed = false;
  private dpr = 1;
  private viewW = 1280;
  private viewH = 720;
  private idSeed = 1;
  private runSeed = 1;
  private gameplayRandom = createSeededRandom(1);
  private effectRandom = createSeededRandom(2);
  private audio?: AudioContext;
  private soundCooldown = 0;
  private resizeObserver?: ResizeObserver;

  private chapter = 1;
  private stage = 1;
  private runMode: RunMode = 'campaign';
  private kind: StageKind = 'normal';
  private duration = 0;
  private timeLeft = 0;
  private timeScale = 1;
  private spawnBudget = 0;
  private fieldBossMarks = new Set<number>();
  private stageFinished = false;
  private rewardLock = false;
  private bossEnraged = false;
  private stageKills = 0;
  private stageCoinsEarned = 0;
  private infiniteEventScore = 0;
  private infiniteBossKills = 0;
  private infiniteBossRespawnTimer = 0;
  private previousInfiniteBossId = '';
  private scoreEligible = true;
  private draftQueue: Array<{ reason: DraftReason; after: DraftState['after'] }> = [];
  private activeDraftId: number | null = null;
  private activeDraftAfter: DraftState['after'] | null = null;
  private pendingRoundClear = false;
  private objective = '';
  private objectiveTarget = 0;
  private cheatGodMode = false;
  private snapshotTimer = 0;
  private hitStop = 0;
  private shake = 0;
  private elapsed = 0;
  private coinFeverRushTimer = 0;

  private camera = { x: 0, y: 0, prevX: 0, prevY: 0 };
  private keys = new Set<string>();
  private pointer = { active: false, x: 0, y: 0 };
  private gamepadIntent = { x: 0, y: 0, active: false };
  private gamepadPauseHeld = false;
  private pendingAwakenings: SkillId[] = [];

  private player = {
    x: WORLD_W / 2,
    y: WORLD_H / 2,
    prevX: WORLD_W / 2,
    prevY: WORLD_H / 2,
    hp: BASE_STATS.maxHp,
    level: 1,
    xp: 0,
    nextXp: 28,
    coins: 0,
    kills: 0,
    root: 0,
    slow: 1,
    invuln: 0,
    silence: 0,
    shield: 0,
    stats: { ...BASE_STATS },
  };

  private skills: Partial<Record<SkillId, SkillState>> = {};
  private runUpgrades = makeRunUpgrades();
  private skillCooldowns: Partial<Record<SkillId, number>> = {};
  private enemies: Entity[] = [];
  private projectiles: Projectile[] = [];
  private bossProjectiles: BossProjectile[] = [];
  private pickups: Pickup[] = [];
  private particles: Particle[] = [];
  private damageNumbers: DamageNumber[] = [];
  private hazards: Hazard[] = [];
  private obstacles: Obstacle[] = [];
  private beams: BeamEffect[] = [];
  private chains: ChainEffect[] = [];
  private impactRings: ImpactRing[] = [];
  private enemyIndex = new SpatialIndex<Entity>(96);
  private deadEnemyScratch: Entity[] = [];
  private projectilePool = new ObjectPool<Projectile>(
    () => ({ id: 0, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, radius: 0, damage: 0, life: 0, maxLife: 0, returning: false, pierce: 0, knockback: 0, skillId: 'needleStorm', blockedBySolid: false, hitEnemyIds: new Set() }),
    (projectile) => { projectile.life = 0; projectile.hitEnemyIds.clear(); },
    384,
  );
  private bossProjectilePool = new ObjectPool<BossProjectile>(
    () => ({ id: 0, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, radius: 0, damage: 0, life: 0, kind: 'ring' }),
    (projectile) => { projectile.life = 0; },
    320,
  );
  private pickupPool = new ObjectPool<Pickup>(
    () => ({ id: 0, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, radius: 0, kind: 'xp', value: 0, life: 0, maxLife: 0 }),
    (pickup) => { pickup.value = 0; pickup.life = 0; },
    PICKUP_HARD_CAP,
  );
  private particlePool = new ObjectPool<Particle>(
    () => ({ id: 0, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, color: '#000000' }),
    (particle) => { particle.life = 0; },
    520,
  );
  private damageNumberPool = new ObjectPool<DamageNumber>(
    () => ({ id: 0, x: 0, y: 0, value: 0, crit: false, life: 0, maxLife: 0, owner: 'player' as EffectOwner }),
    (number) => { number.life = 0; },
    160,
  );
  private renderAlpha = 1;
  private renderViewport: Viewport = makeViewport(0, 0, 1280, 720, 160);
  private gridPattern?: CanvasPattern;
  private gridCacheBuilds = 0;
  private playerAimAngle = -Math.PI / 2;
  private aimTargetId: number | null = null;
  private systemReducedMotion = false;
  private releaseReducedMotion?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    meta: MetaState,
    options: GameOptions,
    callbacks: EngineCallbacks,
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context unavailable');
    this.canvas = canvas;
    this.ctx = context;
    this.meta = meta;
    this.options = options;
    this.callbacks = callbacks;
    this.releaseReducedMotion = watchReducedMotion(
      typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : undefined,
      (reduced) => {
        this.systemReducedMotion = reduced;
        if (reduced) this.shake = 0;
      },
    );
    this.onResize = this.onResize.bind(this);
    this.tick = this.tick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.clearInput = this.clearInput.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.clearInput);
    document.addEventListener('visibilitychange', this.clearInput);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.onResize);
      this.resizeObserver.observe(canvas);
    }
    this.onResize();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.running = false;
    this.paused = true;
    this.accumulator = 0;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.clearInput);
    document.removeEventListener('visibilitychange', this.clearInput);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.releaseReducedMotion?.();
    this.releaseReducedMotion = undefined;
    this.gridPattern = undefined;
    this.clearInput();
    const audio = this.audio;
    this.audio = undefined;
    if (audio && audio.state !== 'closed') void audio.close().catch(() => undefined);
  }

  setOptions(options: GameOptions) {
    this.options = options;
  }

  setMeta(meta: MetaState) {
    this.meta = meta;
    this.recalculateStats(false);
  }

  /** Selects the simulation rule set for the next started run (classic reproduces the 0.1.0 rules for A/B runs). */
  setRuleSet(id: RuleSetId) {
    this.rules = ruleSetFor(id);
  }

  get ruleSet() {
    return this.rules;
  }

  setTimeScale(scale: number) {
    this.timeScale = scale;
    this.accumulator = 0;
    this.emitSnapshot(true);
  }

  startRun(chapter: number, stageNo: number, seed?: number) {
    this.runMode = 'campaign';
    this.startConfiguredRun(chapter, stageNo, seed, true);
  }

  startInfiniteRun(seed?: number, scoreEligible = true) {
    this.runMode = 'infinite';
    this.startConfiguredRun(INFINITE_BASELINE.chapter, INFINITE_BASELINE.stage, seed, scoreEligible);
  }

  invalidateInfiniteScore() {
    if (this.runMode !== 'infinite' || !this.scoreEligible) return;
    this.scoreEligible = false;
    this.emitSnapshot(true);
  }

  private startConfiguredRun(chapter: number, stageNo: number, seed: number | undefined, scoreEligible: boolean) {
    this.ensureAudio();
    const randomSeed = seed ?? globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
    this.runSeed = randomSeed || 1;
    this.gameplayRandom = createSeededRandom(this.runSeed);
    this.effectRandom = createSeededRandom(this.runSeed ^ 0x9e3779b9);
    this.chapter = chapter;
    this.stage = stageNo;
    this.skills = {
      needleStorm: { level: 1, awakened: false },
    };
    this.runUpgrades = makeRunUpgrades();
    this.skillCooldowns = {};
    this.pendingAwakenings = [];
    this.draftQueue = [];
    this.activeDraftId = null;
    this.activeDraftAfter = null;
    this.pendingRoundClear = false;
    this.stageKills = 0;
    this.stageCoinsEarned = 0;
    this.infiniteEventScore = 0;
    this.infiniteBossKills = 0;
    this.infiniteBossRespawnTimer = 0;
    this.previousInfiniteBossId = '';
    this.scoreEligible = scoreEligible;
    this.coinFeverRushTimer = 0;
    this.bossEnraged = false;
    this.cheatGodMode = false;
    this.player = {
      x: WORLD_W / 2,
      y: WORLD_H / 2,
      prevX: WORLD_W / 2,
      prevY: WORLD_H / 2,
      hp: BASE_STATS.maxHp,
      level: 1,
      xp: 0,
      nextXp: 28,
      coins: 0,
      kills: 0,
      root: 0,
      slow: 1,
      invuln: 0,
      silence: 0,
      shield: 0,
      stats: { ...BASE_STATS },
    };
    this.recalculateStats(true);
    this.player.hp = this.player.stats.maxHp;
    this.beginRound();
    this.running = true;
    this.paused = false;
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  resume() {
    this.paused = false;
    this.rewardLock = false;
    this.accumulator = 0;
    this.lastTime = performance.now();
  }

  pause() {
    this.paused = true;
    this.accumulator = 0;
  }

  buyRunUpgrade(id: RunUpgradeId) {
    const level = this.runUpgrades[id];
    const cost = runUpgradeCost(id, level);
    if (this.player.coins < cost) return false;
    this.player.coins -= cost;
    this.runUpgrades[id] += 1;
    const oldMax = this.player.stats.maxHp;
    this.recalculateStats(false);
    if (this.player.stats.maxHp > oldMax) this.player.hp += this.player.stats.maxHp - oldMax;
    this.playTone(180, 0.03, 'triangle');
    this.emitSnapshot(true);
    return true;
  }

  applyCheat(code: string) {
    if (!DEVELOPER_UI_AVAILABLE) return 'DISABLED';
    if (['GOD', 'COIN', 'MAGNET', 'NUKE', 'DRAFT', 'CLEAR'].includes(code)) {
      this.invalidateInfiniteScore();
    }
    if (code === 'GOD') {
      this.cheatGodMode = !this.cheatGodMode;
      this.player.hp = this.player.stats.maxHp;
      this.emitSnapshot(true);
      return this.cheatGodMode ? 'GOD ON' : 'GOD OFF';
    }

    if (code === 'COIN') {
      this.player.coins += 999;
      this.stageCoinsEarned += 999;
      this.emitSnapshot(true);
      return 'COIN +999';
    }

    if (code === 'MAGNET') {
      this.runUpgrades.magnet += 5;
      this.recalculateStats(false);
      this.emitSnapshot(true);
      return 'MAGNET +5';
    }

    if (code === 'NUKE') {
      for (const enemy of this.enemies) enemy.hp = 0;
      this.flushDeadEnemies();
      this.resolveRoundState();
      this.emitSnapshot(true);
      return 'ENEMIES CLEARED';
    }

    if (code === 'DRAFT') {
      this.openDraft('level', 'resume');
      return 'DRAFT OPEN';
    }

    if (code === 'CLEAR') {
      if (this.kind === 'normal') {
        this.timeLeft = 0;
        this.requestRoundClear();
      } else {
        for (const enemy of this.enemies) {
          if (enemy.isBoss && !enemy.legacyBoss) enemy.hp = 0;
        }
        this.flushDeadEnemies();
        this.resolveRoundState();
      }
      return 'OBJECTIVE CLEARED';
    }

    return 'UNKNOWN CODE';
  }

  completeDraft(offer: SkillOffer, draftId: number) {
    if (!this.rewardLock || this.activeDraftAfter === null || this.activeDraftId !== draftId) return 'ignored' as const;
    const activeAfter = this.activeDraftAfter;
    this.activeDraftId = null;
    this.activeDraftAfter = null;
    this.applyOffer(offer);

    const transition = resolveDraftTransition(activeAfter, this.pendingRoundClear, this.draftQueue.length > 0);
    this.pendingRoundClear = transition.pendingRoundClear;
    if (transition.resolution === 'draft') {
      const next = this.draftQueue.shift();
      if (!next) return 'ignored' as const;
      this.presentDraft(next.reason, next.after);
      return 'draft' as const;
    }
    if (transition.resolution === 'roundClear') {
      this.finalizeRound();
      return 'roundClear' as const;
    }

    this.resume();
    return 'resume' as const;
  }

  private applyOffer(offer: SkillOffer) {
    if (offer.kind === 'bonus') {
      this.chooseBonusOffer(offer);
      this.rewardLock = false;
      this.emitSnapshot(true);
      return;
    }
    const state = this.skills[offer.skillId] ?? { level: 0, awakened: false };
    if (offer.kind === 'awakening') {
      this.skills[offer.skillId] = { level: Math.max(5, state.level), awakened: true };
      this.pendingAwakenings = this.pendingAwakenings.filter((id) => id !== offer.skillId);
      this.burst(this.player.x, this.player.y, 36, '#050505', 260);
      this.shake = Math.max(this.shake, 14);
      this.playTone(110, 0.09, 'sawtooth');
    } else {
      const nextLevel = clamp(state.level + 1, 1, MAX_SKILL_LEVEL);
      this.skills[offer.skillId] = { level: nextLevel, awakened: state.awakened };
      if (nextLevel >= 5 && !state.awakened && !this.pendingAwakenings.includes(offer.skillId)) {
        this.pendingAwakenings.push(offer.skillId);
      }
      this.playTone(420, 0.05, 'square');
    }
    const oldMax = this.player.stats.maxHp;
    this.recalculateStats(false);
    if (this.player.stats.maxHp > oldMax) this.player.hp += (this.player.stats.maxHp - oldMax) * 0.7;
    this.rewardLock = false;
    this.emitSnapshot(true);
  }

  private chooseBonusOffer(offer: Extract<SkillOffer, { kind: 'bonus' }>) {
    if (offer.bonus === 'heal') {
      this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + this.player.stats.maxHp * 0.5);
      this.burst(this.player.x, this.player.y, 28, '#111111', 180);
      this.playTone(520, 0.045, 'sine');
      return;
    }

    if (offer.bonus === 'coins') {
      const gained = 65 + this.chapter * 18 + this.stage * 9;
      this.player.coins += gained;
      this.stageCoinsEarned += gained;
      this.burst(this.player.x, this.player.y, 22, '#222222', 160);
      this.playTone(360, 0.05, 'triangle');
      return;
    }

    this.runUpgrades.attack += 1;
    this.runUpgrades.attackSpeed += 1;
    this.recalculateStats(false);
    this.burst(this.player.x, this.player.y, 36, '#000000', 260);
    this.shake = Math.max(this.shake, 10);
    this.playTone(130, 0.08, 'sawtooth');
  }

  private onResize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.viewW = Math.max(1, Math.floor(rect.width));
    this.viewH = Math.max(1, Math.floor(rect.height));
    this.canvas.width = Math.round(this.viewW * this.dpr);
    this.canvas.height = Math.round(this.viewH * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.gridPattern = undefined;
  }

  private onKeyDown(event: KeyboardEvent) {
    const target = event.target;
    // Only text-entry controls own the keyboard. A focused HUD button must not freeze movement (BUG-04).
    if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))) {
      return;
    }
    const key = event.key.toLowerCase();
    const arrow = key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright';
    // Roving tab lists use arrow keys to change tabs; letting them also steer the player would do both at once.
    if (arrow && target instanceof HTMLElement && target.getAttribute('role') === 'tab') return;
    this.keys.add(key);
    const onButton = target instanceof HTMLElement && target.tagName === 'BUTTON';
    if (arrow || (key === ' ' && !onButton)) {
      event.preventDefault();
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    this.keys.delete(event.key.toLowerCase());
  }

  private clearInput() {
    this.keys.clear();
    this.pointer.active = false;
    this.gamepadIntent = { x: 0, y: 0, active: false };
    this.gamepadPauseHeld = false;
  }

  private pollGamepadIntent() {
    const pads = typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function'
      ? Array.from(navigator.getGamepads())
      : [];
    const intent = readGamepadIntent(pads, this.gamepadPauseHeld);
    this.gamepadIntent = { x: intent.x, y: intent.y, active: intent.active };
    this.gamepadPauseHeld = intent.pauseHeld;
    if (intent.pauseJustPressed) this.callbacks.onPauseIntent?.();
  }

  private onPointerDown(event: PointerEvent) {
    this.canvas.setPointerCapture(event.pointerId);
    this.pointer.active = true;
    this.setPointer(event);
  }

  private onPointerMove(event: PointerEvent) {
    if (this.pointer.active) this.setPointer(event);
  }

  private onPointerUp(event: PointerEvent) {
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
    this.pointer.active = false;
  }

  private setPointer(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const scaleX = this.viewW / rect.width;
    const scaleY = this.viewH / rect.height;
    this.pointer.x = (event.clientX - rect.left) * scaleX + this.camera.x;
    this.pointer.y = (event.clientY - rect.top) * scaleY + this.camera.y;
  }

  private tick(now: number) {
    if (!this.running) return;
    const frameDt = Math.min(0.05, Math.max(0, (now - this.lastTime) / 1000));
    this.lastTime = now;
    this.advanceFrame(frameDt, true);
    this.raf = requestAnimationFrame(this.tick);
  }

  advanceFrame(frameDt: number, renderFrame = true) {
    const safeFrameDt = Math.min(0.05, Math.max(0, frameDt));
    this.pollGamepadIntent();
    this.soundCooldown = Math.max(0, this.soundCooldown - safeFrameDt);
    this.snapshotTimer -= safeFrameDt;

    if (!this.paused) {
      // Shake is presentation-only, so it decays in wall-clock time rather than with hit-stop-scaled sim time.
      this.shake = Math.max(0, this.shake - safeFrameDt * 12);
      const plan = planFixedSteps(this.accumulator, safeFrameDt, this.timeScale);
      this.accumulator = plan.remainder;
      for (let step = 0; step < plan.steps; step += 1) {
        const hitStopStep = consumeHitStopStep(this.hitStop);
        this.hitStop = hitStopStep.hitStop;
        this.update(hitStopStep.simulationDelta);
        if (this.paused || this.stageFinished) {
          this.accumulator = 0;
          break;
        }
      }
    } else {
      this.accumulator = 0;
    }
    // A paused run draws a still frame: no particle drift, no shake, no cosmetic random draws (BUG-03).
    if (this.paused) this.shake = 0;
    else this.updateParticles(safeFrameDt);
    if (this.snapshotTimer <= 0) this.emitSnapshot(false);
    if (renderFrame) this.render(this.paused ? 1 : clamp(this.accumulator / FIXED_TIMESTEP, 0, 1));
  }

  getDiagnostics() {
    return {
      runMode: this.runMode,
      elapsed: this.elapsed,
      paused: this.paused,
      player: { x: this.player.x, y: this.player.y, hp: this.player.hp },
      score: this.runMode === 'infinite' ? infiniteScoreWithSurvival(this.infiniteEventScore, this.elapsed) : 0,
      bossKills: this.infiniteBossKills,
      scoreEligible: this.runMode === 'infinite' && this.scoreEligible,
      enemies: this.enemies.length,
      rangedEnemies: this.enemies.filter((enemy) => enemy.attackStyle === 'ranged').length,
      projectiles: this.projectiles.length,
      bossProjectiles: this.bossProjectiles.length,
      pickups: this.pickups.length,
      particles: this.particles.length,
      damageNumbers: this.damageNumbers.length,
      gridCacheBuilds: this.gridCacheBuilds,
      pooled: {
        projectiles: this.projectilePool.retained,
        bossProjectiles: this.bossProjectilePool.retained,
        pickups: this.pickupPool.retained,
        particles: this.particlePool.retained,
        damageNumbers: this.damageNumberPool.retained,
      },
    };
  }

  private beginRound() {
    this.releaseTransientObjects();
    this.kind = this.runMode === 'infinite' ? 'midBoss' : stageKind(this.stage);
    this.duration = this.runMode === 'infinite' ? 0 : stageDuration(this.kind, this.options.paceMode);
    this.objective = this.runMode === 'infinite' ? '랜덤 보스 연속 처치' : objectiveFor(this.chapter, this.stage);
    this.objectiveTarget = this.runMode === 'infinite'
      ? 1
      : this.kind === 'normal'
        ? this.duration
        : 1;
    this.timeLeft = this.duration;
    this.spawnBudget = 0;
    this.fieldBossMarks.clear();
    this.stageFinished = false;
    this.rewardLock = false;
    this.activeDraftId = null;
    this.activeDraftAfter = null;
    this.pendingRoundClear = false;
    this.bossEnraged = false;
    this.stageKills = 0;
    this.stageCoinsEarned = 0;
    this.draftQueue = [];
    this.elapsed = 0;
    this.enemies = [];
    this.enemyIndex.clear();
    this.beams = [];
    this.chains = [];
    this.impactRings = [];
    this.player.x = WORLD_W / 2;
    this.player.y = WORLD_H / 2;
    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;
    this.camera.x = clamp(this.player.x - this.viewW / 2, 0, Math.max(0, WORLD_W - this.viewW));
    this.camera.y = clamp(this.player.y - this.viewH / 2, 0, Math.max(0, WORLD_H - this.viewH));
    this.camera.prevX = this.camera.x;
    this.camera.prevY = this.camera.y;
    this.player.root = 0;
    this.player.slow = 1;
    this.player.silence = 0;
    this.aimTargetId = null;
    this.generateMap();
    if (this.runMode === 'infinite') this.spawnInfiniteBoss();
    else if (this.kind !== 'normal') this.spawnBoss(this.kind, false);
    this.emitSnapshot(true);
  }

  private releaseTransientObjects() {
    for (const projectile of this.projectiles) this.projectilePool.release(projectile);
    for (const projectile of this.bossProjectiles) this.bossProjectilePool.release(projectile);
    for (const pickup of this.pickups) this.pickupPool.release(pickup);
    for (const particle of this.particles) this.particlePool.release(particle);
    for (const number of this.damageNumbers) this.damageNumberPool.release(number);
    this.projectiles.length = 0;
    this.bossProjectiles.length = 0;
    this.pickups.length = 0;
    this.particles.length = 0;
    this.damageNumbers.length = 0;
  }

  private generateMap() {
    this.obstacles = [];
    this.hazards = [];
    const grammar = encounterGrammarForChapter(this.chapter as ChapterId);
    const landmark = grammar.landmarks.find((candidate) => candidate.stage === this.stage);
    const centerSafe = (x: number, y: number) => Math.hypot(x - WORLD_W / 2, y - WORLD_H / 2) < 420;
    const densityScale = landmark ? 0.8 + landmark.obstacleDensity : 1;
    const rects = Math.round((12 + this.chapter * 2) * densityScale);
    for (let i = 0; i < rects; i += 1) {
      let x = 0;
      let y = 0;
      for (let tries = 0; tries < 20; tries += 1) {
        x = 240 + this.gameplayRandom() * (WORLD_W - 520);
        y = 240 + this.gameplayRandom() * (WORLD_H - 520);
        if (!centerSafe(x, y)) break;
      }
      const w = 90 + this.gameplayRandom() * 220;
      const h = 50 + this.gameplayRandom() * 160;
      this.obstacles.push({ id: this.nextId(), x, y, w, h, kind: i % 4 === 0 ? 'pillar' : 'solid' });
    }

    const hazardCount = 8 + Math.floor(this.chapter * 2.4);
    for (let i = 0; i < hazardCount; i += 1) {
      const authoredKind = grammar.hazards[i % grammar.hazards.length];
      const kind: Hazard['kind'] = authoredKind === 'null'
        ? 'slow'
        : authoredKind === 'root'
          ? 'trap'
          : authoredKind;
      const broad = kind === 'water' || kind === 'slow';
      this.addStaticHazard(
        kind,
        220 + this.gameplayRandom() * (WORLD_W - 440),
        220 + this.gameplayRandom() * (WORLD_H - 440),
        broad ? 145 + this.gameplayRandom() * 125 : 60 + this.gameplayRandom() * 38,
      );
    }
    if (landmark) this.addChapterLandmark(landmark.shape, landmark.obstacleDensity);
  }

  private addChapterLandmark(shape: LandmarkShape, density: number) {
    const count = 4 + Math.round(density * 8);
    const centerX = WORLD_W / 2;
    const centerY = WORLD_H / 2;
    for (let index = 0; index < count; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const lane = Math.floor(index / 2) - Math.floor(count / 4);
      let x = centerX + side * (520 + Math.abs(lane) * 46);
      let y = centerY + lane * 180;
      let width = 70;
      let height = 132;

      if (shape === 'radial' || shape === 'dial' || shape === 'void') {
        const angle = (Math.PI * 2 * index) / count + (shape === 'dial' ? Math.PI / count : 0);
        const radius = shape === 'void' ? 720 - (index % 2) * 130 : 610;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
        width = shape === 'void' ? 92 : 66;
        height = shape === 'dial' ? 118 : 84;
      } else if (shape === 'channel') {
        x = centerX + lane * 220;
        y = centerY + side * 520;
        width = 170;
        height = 54;
      }

      this.obstacles.push({
        id: this.nextId(),
        x: clamp(x - width / 2, 120, WORLD_W - width - 120),
        y: clamp(y - height / 2, 120, WORLD_H - height - 120),
        w: width,
        h: height,
        kind: index % 3 === 0 ? 'pillar' : 'solid',
      });
    }
  }

  private addStaticHazard(kind: Hazard['kind'], x: number, y: number, radius: number) {
    this.hazards.push({
      id: this.nextId(),
      kind,
      x,
      y,
      radius,
      life: Number.POSITIVE_INFINITY,
      maxLife: Number.POSITIVE_INFINITY,
      damage: kind === 'fire' ? 6 + this.chapter * 1.5 : 0,
      slow: kind === 'water' ? 0.58 : kind === 'slow' ? 0.42 : 1,
      triggered: false,
    });
  }

  private update(dt: number) {
    this.capturePreviousPositions();
    this.elapsed += dt;
    if (this.runMode === 'campaign') this.timeLeft = Math.max(0, this.timeLeft - dt);

    if (this.player.hp <= 0) {
      this.flushDeadEnemies(true);
      this.resolveRoundState();
      return;
    }
    this.flushDeadEnemies();
    if (this.endStepIfInterrupted()) return;
    this.updatePlayer(dt);
    if (this.endStepIfInterrupted()) return;
    this.rebuildEnemyIndex();
    this.updateSkills(dt);
    this.flushDeadEnemies();
    if (this.endStepIfInterrupted()) return;
    this.spawnEnemies(dt);
    this.updateEnemies(dt);
    this.rebuildEnemyIndex();
    this.updatePlayerAim();
    this.flushDeadEnemies();
    if (this.endStepIfInterrupted()) return;
    this.updateProjectiles(dt);
    this.flushDeadEnemies();
    if (this.endStepIfInterrupted()) return;
    this.updateBossProjectiles(dt);
    if (this.endStepIfInterrupted()) return;
    this.updatePickups(dt);
    if (this.endStepIfInterrupted()) return;
    this.updateHazards(dt);
    if (this.player.hp <= 0) {
      this.flushDeadEnemies(true);
      this.resolveRoundState();
      return;
    }
    this.flushDeadEnemies();
    if (this.endStepIfInterrupted()) return;
    this.updateEffects(dt);
    this.resolveRoundState();
  }

  private capturePreviousPositions() {
    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;
    this.camera.prevX = this.camera.x;
    this.camera.prevY = this.camera.y;
    for (const enemy of this.enemies) { enemy.prevX = enemy.x; enemy.prevY = enemy.y; }
    for (const projectile of this.projectiles) { projectile.prevX = projectile.x; projectile.prevY = projectile.y; }
    for (const projectile of this.bossProjectiles) { projectile.prevX = projectile.x; projectile.prevY = projectile.y; }
    for (const pickup of this.pickups) { pickup.prevX = pickup.x; pickup.prevY = pickup.y; }
  }

  private endStepIfInterrupted() {
    this.resolveRoundState();
    return this.paused || this.stageFinished;
  }

  private resolveRoundState() {
    if (this.stageFinished) return;
    const stageShouldClear = this.runMode === 'campaign'
      && this.kind === 'normal'
      && this.timeLeft <= 0;
    const terminalEvent = resolveTerminalEvent(this.player.hp, stageShouldClear);
    if (terminalEvent === 'gameOver') {
      this.player.hp = 0;
      this.stageFinished = true;
      this.pendingRoundClear = false;
      this.rewardLock = false;
      this.activeDraftId = null;
      this.activeDraftAfter = null;
      this.draftQueue = [];
      this.paused = true;
      this.callbacks.onGameOver(this.makeSettlement('정산', false));
      return;
    }

    if (terminalEvent === 'roundClear') {
      this.requestRoundClear();
      return;
    }

    if (this.runMode === 'campaign' && this.kind !== 'normal' && this.timeLeft <= 0 && !this.bossEnraged) {
      this.enrageBosses();
    }
  }

  private requestRoundClear() {
    if (this.stageFinished) return;
    if (this.rewardLock || this.activeDraftAfter !== null || this.draftQueue.length > 0) {
      this.pendingRoundClear = true;
      return;
    }
    this.finalizeRound();
  }

  private finalizeRound() {
    if (this.stageFinished) return;
    this.pendingRoundClear = false;
    this.rewardLock = false;
    this.activeDraftId = null;
    this.activeDraftAfter = null;
    this.draftQueue = [];
    this.stageFinished = true;
    this.paused = true;
    this.accumulator = 0;
    this.callbacks.onRoundClear(this.makeSettlement(this.kind === 'normal' ? 'Stage 클리어' : 'Boss Stage 클리어', true));
  }

  private updatePlayer(dt: number) {
    this.player.root = Math.max(0, this.player.root - dt);
    this.player.invuln = Math.max(0, this.player.invuln - dt);
    this.player.shield = Math.max(0, this.player.shield - dt);
    this.player.silence = Math.max(0, this.player.silence - dt);
    this.coinFeverRushTimer = advanceCoinFeverFrenzy(this.coinFeverRushTimer, dt);
    this.player.slow = 1;

    for (const hazard of this.hazards) {
      if (distance(this.player, hazard) > hazard.radius) continue;
      if (hazard.kind === 'water' || hazard.kind === 'slow') this.player.slow = Math.min(this.player.slow, hazard.slow);
      if (hazard.kind === 'trap' && !hazard.triggered) {
        hazard.triggered = true;
        hazard.life = Math.min(hazard.life, 3.2);
        hazard.maxLife = Math.min(hazard.maxLife, 3.2);
        this.player.root = Math.max(this.player.root, 0.65);
        this.burst(hazard.x, hazard.y, 12, '#111111', 120);
      }
      if (hazard.kind === 'root') this.player.root = Math.max(this.player.root, 0.35);
      if (hazard.kind === 'fire') this.damagePlayerOverTime(hazard.damage, dt);
      if (hazard.kind === 'null') this.player.silence = Math.max(this.player.silence, 0.4);
    }

    let mx = 0;
    let my = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) my -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) my += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) mx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) mx += 1;
    if (mx === 0 && my === 0 && this.gamepadIntent.active) {
      mx = this.gamepadIntent.x;
      my = this.gamepadIntent.y;
    }
    if (mx === 0 && my === 0 && this.pointer.active) {
      const dx = this.pointer.x - this.player.x;
      const dy = this.pointer.y - this.player.y;
      if (Math.hypot(dx, dy) > 24) {
        mx = dx;
        my = dy;
      }
    }

    if (this.player.root <= 0 && (mx !== 0 || my !== 0)) {
      const dir = normalize(mx, my);
      const speed = this.player.stats.moveSpeed * this.player.slow;
      this.player.x += dir.x * speed * dt;
      this.player.y += dir.y * speed * dt;
      this.player.x = clamp(this.player.x, 42, WORLD_W - 42);
      this.player.y = clamp(this.player.y, 42, WORLD_H - 42);
      this.resolveEntityVsObstacles(this.player, HIT_RADIUS.playerVsObstacle);
    }

    this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + this.player.stats.hpRegen * dt);
    if (this.skills.recoveryThread?.awakened && this.player.hp >= this.player.stats.maxHp - 0.5) {
      this.skillCooldowns.recoveryThread = (this.skillCooldowns.recoveryThread ?? 0) - dt;
      if ((this.skillCooldowns.recoveryThread ?? 0) <= 0) {
        this.skillCooldowns.recoveryThread = 2.2 / this.effectiveAttackSpeed();
        for (let i = 0; i < 8; i += 1) {
          const angle = (Math.PI * 2 * i) / 8 + this.elapsed * 0.7;
          this.spawnProjectile('recoveryThread', this.player.x, this.player.y, Math.cos(angle) * 620, Math.sin(angle) * 620, 5, this.player.stats.attack * 0.7, 0.45, 0, 60, false);
        }
      }
    }

    this.camera.x = clamp(this.player.x - this.viewW / 2, 0, Math.max(0, WORLD_W - this.viewW));
    this.camera.y = clamp(this.player.y - this.viewH / 2, 0, Math.max(0, WORLD_H - this.viewH));
  }

  private updateSkills(dt: number) {
    if (this.player.silence > 0) return;
    for (const id of Object.keys(this.skillCooldowns) as SkillId[]) {
      this.skillCooldowns[id] = Math.max(0, (this.skillCooldowns[id] ?? 0) - dt);
    }

    const needle = this.skills.needleStorm;
    if (needle) this.updateNeedleStorm(needle);

    const fanKnives = this.skills.fanKnives;
    if (fanKnives) this.updateFanKnives(fanKnives);

    const chain = this.skills.chainSpark;
    if (chain) this.updateChainSpark(chain);

    const frostLine = this.skills.frostLine;
    if (frostLine) this.updateFrostLine(frostLine);

    const rail = this.skills.railSpear;
    if (rail) this.updateRailSpear(rail);

    const boneMortar = this.skills.boneMortar;
    if (boneMortar) this.updateBoneMortar(boneMortar);

    const mirrorClone = this.skills.mirrorClone;
    if (mirrorClone) this.updateMirrorClone(mirrorClone);

    const voidMine = this.skills.voidMine;
    if (voidMine) this.updateVoidMine(voidMine);

    const blackSun = this.skills.blackSun;
    if (blackSun) this.updateBlackSun(blackSun);

    const eclipseStep = this.skills.eclipseStep;
    if (eclipseStep) this.updateEclipseStep(eclipseStep);

    const orbit = this.skills.orbitScythes;
    if (orbit) this.updateOrbitScythes(orbit);

    if (this.skills.magnetSigil?.awakened) this.updateMagnetPulse();
  }

  private updateNeedleStorm(skill: SkillState) {
    if ((this.skillCooldowns.needleStorm ?? 0) > 0) return;
    const target = this.findNearestEnemy(980);
    if (!target) return;
    const baseCooldown = 0.72 / this.effectiveAttackSpeed();
    this.skillCooldowns.needleStorm = Math.max(0.16, baseCooldown - skill.level * 0.035);
    const count = 1 + (skill.level >= 3 ? 1 : 0) + (skill.level >= 5 ? 1 : 0) + (skill.awakened ? 2 : 0);
    const baseAngle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const spread = skill.awakened ? 0.34 : 0.18;
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * spread;
      const angle = baseAngle + offset;
      const damage = this.player.stats.attack * (0.85 + skill.level * 0.18 + (skill.awakened ? 0.4 : 0));
      this.spawnProjectile('needleStorm', this.player.x, this.player.y, Math.cos(angle) * 760, Math.sin(angle) * 760, 4.5, damage, 1.15, skill.awakened ? 1 : 0, 120, true);
    }
  }

  private updateFanKnives(skill: SkillState) {
    if ((this.skillCooldowns.fanKnives ?? 0) > 0) return;
    const target = this.findNearestEnemy(760);
    if (!target) return;
    this.skillCooldowns.fanKnives = Math.max(0.42, 1.05 / this.effectiveAttackSpeed() - skill.level * 0.04);
    const count = skill.level + 3 + (skill.awakened ? 3 : 0);
    const baseAngle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle + (i - (count - 1) / 2) * 0.22;
      this.spawnProjectile('fanKnives', this.player.x, this.player.y, Math.cos(angle) * 680, Math.sin(angle) * 680, 5.2, this.player.stats.attack * (0.55 + skill.level * 0.12), skill.awakened ? 1.35 : 0.82, skill.awakened ? 2 : 0, 80, true);
    }
    this.playTone(390, 0.025, 'triangle');
  }

  private updateChainSpark(skill: SkillState) {
    if ((this.skillCooldowns.chainSpark ?? 0) > 0) return;
    const first = this.findNearestEnemy(780);
    if (!first) return;
    this.skillCooldowns.chainSpark = Math.max(0.55, 1.48 / this.effectiveAttackSpeed() - skill.level * 0.055);
    const jumps = skill.level + 2 + (skill.awakened ? 2 : 0);
    const damage = this.player.stats.attack * (0.95 + skill.level * 0.14 + (skill.awakened ? 0.28 : 0));
    const hit = new Set<number>();
    const points = [{ x: this.player.x, y: this.player.y }];
    let current: Entity | undefined = first;
    for (let i = 0; i < jumps && current; i += 1) {
      hit.add(current.id);
      points.push({ x: current.x, y: current.y });
      this.dealDamage(current, damage * (1 - i * 0.08), 'chainSpark', 80, skill.awakened && i === jumps - 1);
      if (skill.awakened && i === jumps - 1) {
        current.stun = Math.max(current.stun, 0.45);
        this.areaDamage(current.x, current.y, 78, damage * 0.7, 'chainSpark', 90);
      }
      current = this.findNearestEnemyFrom(current.x, current.y, 330, hit);
    }
    this.chains.push({ id: this.nextId(), points, life: 0.18, maxLife: 0.18 });
    this.playTone(660, 0.025, 'square');
  }

  private updateFrostLine(skill: SkillState) {
    if ((this.skillCooldowns.frostLine ?? 0) > 0) return;
    const target = this.findNearestEnemy(980, true);
    if (!target) return;
    this.skillCooldowns.frostLine = Math.max(1.05, 2.35 / this.effectiveAttackSpeed() - skill.level * 0.06);
    const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const x2 = this.player.x + Math.cos(angle) * 980;
    const y2 = this.player.y + Math.sin(angle) * 980;
    const width = 12 + skill.level * 3 + (skill.awakened ? 8 : 0);
    const damage = this.player.stats.attack * (0.95 + skill.level * 0.2);
    this.beams.push({ id: this.nextId(), x1: this.player.x, y1: this.player.y, x2, y2, width, life: 0.28, maxLife: 0.28, owner: 'player' });
    for (const enemy of this.querySegmentEnemies(this.player.x, this.player.y, x2, y2, width)) {
      if (enemy.hp <= 0) continue;
      if (distancePointToSegment(enemy.x, enemy.y, this.player.x, this.player.y, x2, y2) < enemy.radius + width) {
        this.dealDamage(enemy, damage, 'frostLine', 110, false);
        const slow = applyTimedSlow(
          { multiplier: enemy.slowMultiplier ?? 1, remaining: enemy.slowTimer ?? 0 },
          1 - Math.min(0.7, 0.25 + skill.level * 0.07),
          1.25,
        );
        enemy.slowMultiplier = slow.multiplier;
        enemy.slowTimer = slow.remaining;
        if (skill.awakened) enemy.root = Math.max(enemy.root, 0.26);
      }
    }
    this.playTone(510, 0.04, 'sine');
  }

  private updateRailSpear(skill: SkillState) {
    if ((this.skillCooldowns.railSpear ?? 0) > 0) return;
    const target = this.findNearestEnemy(1250, true);
    if (!target) return;
    this.skillCooldowns.railSpear = Math.max(1.25, 3.8 / this.effectiveAttackSpeed() - skill.level * 0.12);
    const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const width = 18 + skill.level * 3 + (skill.awakened ? 12 : 0);
    const damage = this.player.stats.attack * (2.15 + skill.level * 0.32 + (skill.awakened ? 0.8 : 0));
    const mirrorsRail = this.skills.mirrorClone?.awakened === true && this.gameplayRandom() < 0.3;
    this.fireRailBeam(this.player.x, this.player.y, angle, width, damage, 'railSpear', 180, skill.awakened);
    if (mirrorsRail) {
      const sideX = Math.cos(angle + Math.PI / 2);
      const sideY = Math.sin(angle + Math.PI / 2);
      for (const sign of [-1, 1]) {
        this.fireRailBeam(
          this.player.x + sideX * sign * 42,
          this.player.y + sideY * sign * 42,
          angle,
          width,
          damage * 0.35,
          'mirrorClone',
          95,
          false,
        );
      }
    }
    this.hitStop = Math.max(this.hitStop, 0.045);
    this.shake = Math.max(this.shake, 9);
    this.playTone(95, 0.055, 'sawtooth');
  }

  private fireRailBeam(
    x1: number,
    y1: number,
    angle: number,
    width: number,
    damage: number,
    skillId: 'railSpear' | 'mirrorClone',
    knockback: number,
    explode: boolean,
  ) {
    const x2 = x1 + Math.cos(angle) * 1500;
    const y2 = y1 + Math.sin(angle) * 1500;
    this.beams.push({
      id: this.nextId(),
      x1,
      y1,
      x2,
      y2,
      width,
      life: 0.22,
      maxLife: 0.22,
      owner: 'player',
    });
    for (const enemy of this.querySegmentEnemies(x1, y1, x2, y2, width)) {
      if (enemy.hp <= 0) continue;
      if (distancePointToSegment(enemy.x, enemy.y, x1, y1, x2, y2) < enemy.radius + width) {
        this.dealDamage(enemy, damage, skillId, knockback, false);
        if (explode) {
          this.areaDamage(enemy.x, enemy.y, 58, damage * 0.42, skillId, 120);
        }
      }
    }
  }

  private updateBoneMortar(skill: SkillState) {
    if ((this.skillCooldowns.boneMortar ?? 0) > 0) return;
    const target = this.findClusterTarget();
    if (!target) return;
    this.skillCooldowns.boneMortar = Math.max(1.6, 3.4 / this.effectiveAttackSpeed() - skill.level * 0.08);
    const radius = 86 + skill.level * 12 + (skill.awakened ? 34 : 0);
    const damage = this.player.stats.attack * (1.35 + skill.level * 0.22 + (skill.awakened ? 0.55 : 0));
    this.hazards.push({
      id: this.nextId(),
      kind: 'warning',
      x: target.x,
      y: target.y,
      radius,
      life: 0.48,
      maxLife: 0.48,
      damage: 0,
      slow: 1,
      triggered: false,
      sourceSkillId: 'boneMortar',
      skillDamage: damage,
      collapseDamage: skill.awakened ? damage * 0.65 : 0,
    });
    this.playTone(120, 0.055, 'sawtooth');
  }

  private updateMirrorClone(skill: SkillState) {
    if ((this.skillCooldowns.mirrorClone ?? 0) > 0) return;
    const target = this.findNearestEnemy(1100, true);
    if (!target) return;
    this.skillCooldowns.mirrorClone = Math.max(1.05, 2.7 / this.effectiveAttackSpeed() - skill.level * 0.08);
    const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const side = { x: Math.cos(angle + Math.PI / 2), y: Math.sin(angle + Math.PI / 2) };
    const count = 2;
    for (let i = 0; i < count; i += 1) {
      const sign = i % 2 === 0 ? -1 : 1;
      const sx = this.player.x + side.x * sign * 42;
      const sy = this.player.y + side.y * sign * 42;
      const shotAngle = angle;
      this.spawnProjectile('mirrorClone', sx, sy, Math.cos(shotAngle) * 820, Math.sin(shotAngle) * 820, 5.5, this.player.stats.attack * (0.72 + skill.level * 0.18), 1.15, 1 + Math.floor(skill.level / 2), 95, true);
      this.chains.push({ id: this.nextId(), points: [{ x: this.player.x, y: this.player.y }, { x: sx, y: sy }], life: 0.16, maxLife: 0.16 });
    }
    this.playTone(470, 0.035, 'square');
  }

  private updateVoidMine(skill: SkillState) {
    if ((this.skillCooldowns.voidMine ?? 0) > 0) return;
    this.skillCooldowns.voidMine = Math.max(2.1, 4.1 / this.effectiveAttackSpeed() - skill.level * 0.12);
    const radius = 92 + skill.level * 11 + (skill.awakened ? 30 : 0);
    const life = 2.4 + skill.level * 0.25 + (skill.awakened ? 0.9 : 0);
    const profile = createVortexProfile('voidMine', skill.level, skill.awakened);
    this.hazards.push({
      id: this.nextId(),
      kind: 'vortex',
      x: this.player.x,
      y: this.player.y,
      radius,
      life,
      maxLife: life,
      damage: 0,
      slow: 0.42,
      triggered: false,
      skillDamage: this.player.stats.attack * (0.42 + skill.level * 0.08 + (skill.awakened ? 0.16 : 0)),
      sourceSkillId: profile.sourceSkillId,
      pull: profile.pull,
      collapseDamage: this.player.stats.attack * profile.collapseDamageMultiplier,
    });
    this.playTone(82, 0.055, 'sine');
  }

  private updateBlackSun(skill: SkillState) {
    if ((this.skillCooldowns.blackSun ?? 0) > 0) return;
    const target = this.findClusterTarget();
    if (!target) return;
    this.skillCooldowns.blackSun = Math.max(2.6, 6.3 / this.effectiveAttackSpeed() - skill.level * 0.18);
    const radius = 116 + skill.level * 14 + (skill.awakened ? 42 : 0);
    const life = 3.2 + skill.level * 0.35 + (skill.awakened ? 1.2 : 0);
    const profile = createVortexProfile('blackSun', skill.level, skill.awakened);
    this.hazards.push({
      id: this.nextId(),
      kind: 'vortex',
      x: target.x,
      y: target.y,
      radius,
      life,
      maxLife: life,
      damage: 0,
      slow: 0.35,
      triggered: false,
      skillDamage: this.player.stats.attack * (0.55 + skill.level * 0.08 + (skill.awakened ? 0.18 : 0)),
      sourceSkillId: profile.sourceSkillId,
      pull: profile.pull,
      collapseDamage: this.player.stats.attack * profile.collapseDamageMultiplier,
    });
    this.shake = Math.max(this.shake, 5);
    this.playTone(70, 0.06, 'sine');
  }

  private updateEclipseStep(skill: SkillState) {
    if ((this.skillCooldowns.eclipseStep ?? 0) > 0) return;
    const nearby = this.enemies.filter((enemy) => enemy.hp > 0 && distance(enemy, this.player) < 260).length;
    if (nearby < 3 && this.player.hp / this.player.stats.maxHp > 0.45) return;
    this.skillCooldowns.eclipseStep = Math.max(2.7, 5.4 / this.effectiveAttackSpeed() - skill.level * 0.12);
    const radius = 128 + skill.level * 16 + (skill.awakened ? 55 : 0);
    this.player.invuln = Math.max(this.player.invuln, 0.28 + skill.level * 0.05);
    for (let i = 0; i < 5 + skill.level; i += 1) {
      const angle = (Math.PI * 2 * i) / (5 + skill.level) + this.elapsed;
      this.beams.push({
        id: this.nextId(),
        x1: this.player.x + Math.cos(angle) * 22,
        y1: this.player.y + Math.sin(angle) * 22,
        x2: this.player.x + Math.cos(angle) * radius,
        y2: this.player.y + Math.sin(angle) * radius,
        width: 10 + skill.level,
        life: 0.2,
        maxLife: 0.2,
        owner: 'player',
      });
    }
    const damage = this.player.stats.attack * (1.25 + skill.level * 0.22);
    this.areaDamage(this.player.x, this.player.y, radius, damage, 'eclipseStep', 230, skill.awakened);
    if (skill.awakened) {
      const afterimageRadius = Math.round(radius * 0.82);
      this.hazards.push({
        id: this.nextId(),
        kind: 'warning',
        x: this.player.x,
        y: this.player.y,
        radius: afterimageRadius,
        life: 0.24,
        maxLife: 0.24,
        damage: 0,
        slow: 1,
        triggered: false,
        sourceSkillId: 'eclipseStep',
        skillDamage: damage * 0.72,
      });
    }
    this.shake = Math.max(this.shake, 12);
  }

  private updateOrbitScythes(skill: SkillState) {
    const blades = skill.level + 1 + (skill.awakened ? 3 : 0);
    const baseRadius = 72 + skill.level * 10;
    for (let i = 0; i < blades; i += 1) {
      const reverse = skill.awakened && i >= skill.level + 1;
      const speed = reverse ? -2.6 : 3.2;
      const bladeRadius = reverse ? baseRadius + 52 : baseRadius;
      const angle = this.elapsed * speed + (Math.PI * 2 * i) / blades;
      const bx = this.player.x + Math.cos(angle) * bladeRadius;
      const by = this.player.y + Math.sin(angle) * bladeRadius;
      for (const enemy of this.enemyIndex.queryCircle(bx, by, 17)) {
        if (enemy.hp <= 0) continue;
        if (distance(enemy, { x: bx, y: by }) > enemy.radius + 17) continue;
        const key = `orbit-${i}`;
        if ((enemy.damageCooldowns[key] ?? 0) <= this.elapsed) {
          enemy.damageCooldowns[key] = this.elapsed + 0.22;
          this.dealDamage(enemy, this.player.stats.attack * (0.42 + skill.level * 0.075), 'orbitScythes', 55, false);
        }
      }
    }
  }

  private updateMagnetPulse() {
    if ((this.skillCooldowns.magnetSigil ?? 0) > 0) return;
    this.skillCooldowns.magnetSigil = 4.8 / this.effectiveAttackSpeed();
    for (const pickup of this.pickups) {
      const dir = normalize(this.player.x - pickup.x, this.player.y - pickup.y);
      pickup.vx += dir.x * 920;
      pickup.vy += dir.y * 920;
    }
    this.burst(this.player.x, this.player.y, 16, '#111111', 130);
  }

  private spawnEnemies(dt: number) {
    if (this.stageFinished) return;
    if (this.runMode === 'infinite') {
      const difficulty = infiniteDifficultyAt(this.elapsed, this.infiniteBossKills);
      const cap = difficulty.enemyCap;
      if (this.enemies.length < cap) {
        this.spawnBudget += dt * 2.25 * INFINITE_BASELINE.mobDifficulty * difficulty.spawnRateScale;
        while (this.spawnBudget >= 1 && this.enemies.length < cap) {
          this.spawnBudget -= 1;
          this.spawnEnemy(INFINITE_BASELINE.mobDifficulty);
        }
      }

      const activeBoss = this.enemies.some((enemy) => enemy.isBoss && enemy.hp > 0);
      if (!activeBoss) {
        this.infiniteBossRespawnTimer = Math.max(0, this.infiniteBossRespawnTimer - dt);
        if (this.infiniteBossRespawnTimer <= 0) this.spawnInfiniteBoss();
      }
      return;
    }

    const progress = 1 - this.timeLeft / this.duration;
    const stagePressure = this.kind === 'normal' ? (this.stage - 1) * 0.2 : this.kind === 'finalBoss' ? 0.35 : 0.15;
    const difficulty = 1 + (this.chapter - 1) * 0.45 + stagePressure + progress * 0.85 + (this.bossEnraged ? 0.85 : 0);
    const cap = this.enemyCap();
    if (this.enemies.length < cap) {
      const rate = (this.kind === 'normal' ? 1.8 : 2.25) * difficulty;
      this.spawnBudget += dt * rate;
      while (this.spawnBudget >= 1) {
        this.spawnBudget -= 1;
        this.spawnEnemy(difficulty);
      }
    }

    if (this.kind === 'normal') {
      FIELD_BOSS_MARKS.forEach((mark, index) => {
        if (progress >= mark && !this.fieldBossMarks.has(index)) {
          this.fieldBossMarks.add(index);
          this.spawnBoss('normal', false);
        }
      });
      if (this.chapter >= LEGACY_BOSS_MIN_CHAPTER && progress >= LEGACY_BOSS_MARK && !this.fieldBossMarks.has(8)) {
        this.fieldBossMarks.add(8);
        this.spawnBoss('normal', true);
      }
    } else if (progress > 0.55 && !this.fieldBossMarks.has(5)) {
      this.fieldBossMarks.add(5);
      const waveSize = Math.min(10 + this.chapter * 3, Math.max(0, cap - this.enemies.length));
      for (let i = 0; i < waveSize; i += 1) this.spawnEnemy(difficulty * 1.2, i % 3 === 0 ? 'medium' : 'small');
    }
  }

  private enemyCap() {
    if (this.runMode === 'infinite') return infiniteDifficultyAt(this.elapsed, this.infiniteBossKills).enemyCap;
    return 90 + this.chapter * 18 + (this.kind === 'normal' ? 0 : 24);
  }

  private spawnEnemy(difficulty: number, forcedTier?: EnemyTier) {
    const edge = Math.floor(this.gameplayRandom() * 4);
    const left = clamp(this.player.x - this.viewW / 2, 40, WORLD_W - this.viewW - 40);
    const top = clamp(this.player.y - this.viewH / 2, 40, WORLD_H - this.viewH - 40);
    let x = this.player.x;
    let y = this.player.y;
    const margin = 110;
    if (edge === 0) {
      x = left - margin;
      y = top + this.gameplayRandom() * this.viewH;
    } else if (edge === 1) {
      x = left + this.viewW + margin;
      y = top + this.gameplayRandom() * this.viewH;
    } else if (edge === 2) {
      x = left + this.gameplayRandom() * this.viewW;
      y = top - margin;
    } else {
      x = left + this.gameplayRandom() * this.viewW;
      y = top + this.viewH + margin;
    }
    x = clamp(x, -80, WORLD_W + 80);
    y = clamp(y, -80, WORLD_H + 80);
    const roll = this.gameplayRandom();
    const tier = forcedTier ?? (roll < TIER_ROLL.small ? 'small' : roll < TIER_ROLL.medium ? 'medium' : 'large');
    const infiniteDifficulty = this.runMode === 'infinite'
      ? infiniteDifficultyAt(this.elapsed, this.infiniteBossKills)
      : null;
    const effectiveDifficulty = infiniteDifficulty
      ? INFINITE_BASELINE.mobDifficulty * infiniteDifficulty.enemyHealthScale
      : difficulty;
    const hpBase = tier === 'small' ? 22 : tier === 'medium' ? 62 : 150;
    const radius = tier === 'small' ? ENEMY_RADIUS.small : tier === 'medium' ? ENEMY_RADIUS.medium : ENEMY_RADIUS.large;
    const speed = (tier === 'small' ? 128 : tier === 'medium' ? 96 : 62)
      * (0.9 + this.gameplayRandom() * 0.22)
      * (infiniteDifficulty?.enemySpeedScale ?? 1);
    const rangedCount = this.enemies.reduce((count, candidate) => count + (candidate.attackStyle === 'ranged' ? 1 : 0), 0);
    const rangedCap = infiniteDifficulty?.rangedCap ?? Math.min(RANGED_ENEMY.maxConcurrent, 1 + Math.ceil(this.chapter / 2));
    const rangedChance = infiniteDifficulty?.rangedChance ?? 0.035 + this.chapter * 0.004;
    const attackStyle = tier !== 'large' && rangedCount < rangedCap && this.gameplayRandom() < rangedChance
      ? 'ranged'
      : 'contact';
    const baseDamage = (tier === 'small' ? 8 : tier === 'medium' ? 14 : 22)
      * (0.8 + (infiniteDifficulty ? INFINITE_BASELINE.mobDifficulty : difficulty) * 0.14);
    const enemy: Entity = {
      id: this.nextId(),
      x,
      y,
      prevX: x,
      prevY: y,
      vx: 0,
      vy: 0,
      radius,
      hp: hpBase * effectiveDifficulty,
      maxHp: hpBase * effectiveDifficulty,
      speed,
      damage: baseDamage * (infiniteDifficulty?.enemyDamageScale ?? 1),
      xp: tier === 'small' ? 4 : tier === 'medium' ? 10 : 22,
      coin: tier === 'small' ? 1 : tier === 'medium' ? 3 : 7,
      tier,
      variant: Math.floor(this.gameplayRandom() * 5),
      isBoss: false,
      attackStyle,
      rangedCooldown: attackStyle === 'ranged' ? 1.1 + this.gameplayRandom() * 1.1 : 0,
      rangedTelegraph: 0,
      contactTimer: 0,
      hitFlash: 0,
      stun: 0,
      root: 0,
      slowMultiplier: 1,
      slowTimer: 0,
      patternTimer: 0,
      patternPhase: 'idle',
      patternX: 0,
      patternY: 0,
      damageCooldowns: {},
      bossPhase: 1,
      bossPhaseFlash: 0,
    };
    this.enemies.push(enemy);
  }

  private spawnBoss(kind: StageKind | 'normal', legacy: boolean) {
    let def: BossDef;
    if (kind === 'normal') {
      if (legacy) {
        const candidates = BOSS_ROUND_BOSSES.filter((boss) => boss.chapter < this.chapter);
        def = selectRequiredBoss(candidates, { chapter: this.chapter, role: 'field', legacy: true }, this.gameplayRandom);
      } else {
        const candidates = FIELD_BOSSES.filter((boss) => boss.chapter <= this.chapter);
        def = selectRequiredBoss(candidates, { chapter: this.chapter, role: 'field' }, this.gameplayRandom);
      }
    } else {
      const role = kind === 'midBoss' ? 'mid' : 'final';
      const candidates = BOSS_ROUND_BOSSES.filter((boss) => boss.chapter === this.chapter && boss.role === role);
      def = selectRequiredBoss(candidates, { chapter: this.chapter, role }, this.gameplayRandom);
    }

    const angle = this.gameplayRandom() * Math.PI * 2;
    const distanceFromPlayer = 620;
    const x = clamp(this.player.x + Math.cos(angle) * distanceFromPlayer, 120, WORLD_W - 120);
    const y = clamp(this.player.y + Math.sin(angle) * distanceFromPlayer, 120, WORLD_H - 120);
    const scale = kind === 'normal' ? (legacy ? 0.42 : 0.34) : 0.72;
    const stageScale = kind === 'normal' ? 1 + (this.chapter - 1) * 0.18 + (this.stage - 1) * 0.08 : 1;
    const boss: Entity = {
      id: this.nextId(),
      x,
      y,
      prevX: x,
      prevY: y,
      vx: 0,
      vy: 0,
      radius: kind === 'normal' ? ENEMY_RADIUS.fieldBoss : ENEMY_RADIUS.boss,
      hp: def.hp * stageScale * scale,
      maxHp: def.hp * stageScale * scale,
      speed: def.speed * (kind === 'normal' ? 1.06 : 1),
      damage: def.damage * stageScale * (kind === 'normal' ? 0.72 : 0.62),
      xp: kind === 'normal' ? 90 : 220 + this.chapter * 45,
      coin: kind === 'normal' ? 24 + this.chapter * 5 : 80 + this.chapter * 18,
      tier: 'boss',
      variant: Math.floor(this.gameplayRandom() * 5),
      isBoss: true,
      attackStyle: 'contact',
      rangedCooldown: 0,
      rangedTelegraph: 0,
      boss: def,
      legacyBoss: legacy,
      contactTimer: 0,
      hitFlash: 0,
      stun: 0,
      root: 0,
      slowMultiplier: 1,
      slowTimer: 0,
      patternTimer: 1.2,
      patternPhase: 'idle',
      patternX: 0,
      patternY: 0,
      damageCooldowns: {},
      bossPhase: 1,
      bossPhaseFlash: 0,
    };
    this.enemies.push(boss);
    this.burst(x, y, 24, '#111111', 190);
  }

  private spawnInfiniteBoss() {
    const pool = BOSS_ROUND_BOSSES.filter((boss) => boss.id !== this.previousInfiniteBossId);
    const candidates = pool.length > 0 ? pool : BOSS_ROUND_BOSSES;
    const def = candidates[Math.floor(this.gameplayRandom() * candidates.length)];
    const difficulty = infiniteDifficultyAt(this.elapsed, this.infiniteBossKills);
    const angle = this.gameplayRandom() * Math.PI * 2;
    const distanceFromPlayer = 620;
    const x = clamp(this.player.x + Math.cos(angle) * distanceFromPlayer, 120, WORLD_W - 120);
    const y = clamp(this.player.y + Math.sin(angle) * distanceFromPlayer, 120, WORLD_H - 120);
    const patternHealth = 1 + (def.role === 'final' ? 0.12 : 0) + (def.chapter - 1) * 0.025;
    const patternDamage = 1 + (def.role === 'final' ? 0.08 : 0) + (def.chapter - 1) * 0.015;
    const hp = INFINITE_BASELINE.bossHp * difficulty.bossHealthScale * patternHealth;
    const boss: Entity = {
      id: this.nextId(),
      x,
      y,
      prevX: x,
      prevY: y,
      vx: 0,
      vy: 0,
      radius: ENEMY_RADIUS.boss,
      hp,
      maxHp: hp,
      speed: Math.min(178, def.speed * difficulty.enemySpeedScale),
      damage: INFINITE_BASELINE.bossDamage * difficulty.bossDamageScale * patternDamage,
      xp: 220 + this.infiniteBossKills * 18,
      coin: 80 + this.infiniteBossKills * 6,
      tier: 'boss',
      variant: Math.floor(this.gameplayRandom() * 5),
      isBoss: true,
      attackStyle: 'contact',
      rangedCooldown: 0,
      rangedTelegraph: 0,
      boss: def,
      legacyBoss: false,
      contactTimer: 0,
      hitFlash: 0,
      stun: 0,
      root: 0,
      slowMultiplier: 1,
      slowTimer: 0,
      patternTimer: 1.2,
      patternPhase: 'idle',
      patternX: 0,
      patternY: 0,
      damageCooldowns: {},
      bossPhase: 1,
      bossPhaseFlash: 0,
    };
    this.previousInfiniteBossId = def.id;
    this.objectiveTarget = this.infiniteBossKills + 1;
    this.enemies.push(boss);
    this.burst(x, y, 28, '#111111', 210);
    this.shake = Math.max(this.shake, 8);
  }

  private updateEnemies(dt: number) {
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
      enemy.contactTimer = Math.max(0, enemy.contactTimer - dt);
      enemy.stun = Math.max(0, enemy.stun - dt);
      enemy.root = Math.max(0, enemy.root - dt);
      const slow = advanceTimedSlow({ multiplier: enemy.slowMultiplier ?? 1, remaining: enemy.slowTimer ?? 0 }, dt);
      enemy.slowMultiplier = slow.multiplier;
      enemy.slowTimer = slow.remaining;
      if (enemy.isBoss && enemy.boss) this.updateBossPattern(enemy, dt);
      if (enemy.stun > 0 || enemy.root > 0) continue;

      const dir = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
      const playerDistance = distance(enemy, this.player);
      const phaseMove = enemy.isBoss ? this.activeBossPhaseMove(enemy) : undefined;
      const phaseSpeed = enemy.isBoss ? phaseMove?.movement.speedScale ?? 1 + ((enemy.bossPhase ?? 1) - 1) * 0.1 : 1;
      const speed = enemy.speed * phaseSpeed * (enemy.slowMultiplier ?? 1) * (enemy.patternPhase === 'dash' ? 3.8 : 1);
      let moveX = dir.x;
      let moveY = dir.y;

      if (!enemy.isBoss && enemy.attackStyle === 'ranged') {
        enemy.rangedCooldown = Math.max(0, enemy.rangedCooldown - dt);
        if (enemy.rangedTelegraph > 0) {
          const previousTelegraph = enemy.rangedTelegraph;
          enemy.rangedTelegraph = Math.max(0, enemy.rangedTelegraph - dt);
          if (previousTelegraph > 0 && enemy.rangedTelegraph <= 0) {
            const shotDirection = normalize(enemy.patternX - enemy.x, enemy.patternY - enemy.y);
            const projectileSpeed = Math.min(360, 220 * (this.runMode === 'infinite'
              ? infiniteDifficultyAt(this.elapsed, this.infiniteBossKills).enemySpeedScale
              : 1));
            this.spawnBossProjectile(
              enemy.x,
              enemy.y,
              shotDirection.x * projectileSpeed,
              shotDirection.y * projectileSpeed,
              7,
              enemy.damage * 0.72,
              4.2,
              'enemy',
            );
          }
        } else if (enemy.rangedCooldown <= 0 && playerDistance <= 760) {
          enemy.patternX = this.player.x;
          enemy.patternY = this.player.y;
          enemy.rangedTelegraph = RANGED_ENEMY.telegraphSeconds;
          const cadenceScale = this.runMode === 'infinite'
            ? Math.min(1.55, 1 + infiniteDifficultyAt(this.elapsed, this.infiniteBossKills).minute * 0.012)
            : 1;
          enemy.rangedCooldown = (2.25 + this.gameplayRandom() * 0.75) / cadenceScale;
        }

        if (playerDistance < 235) {
          moveX = -dir.x;
          moveY = -dir.y;
        } else if (playerDistance <= 410) {
          const strafe = enemy.id % 2 === 0 ? 1 : -1;
          moveX = -dir.y * strafe;
          moveY = dir.x * strafe;
        }
      }

      enemy.vx = enemy.vx * 0.82 + moveX * speed * 0.18;
      enemy.vy = enemy.vy * 0.82 + moveY * speed * 0.18;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.x = clamp(enemy.x, -90, WORLD_W + 90);
      enemy.y = clamp(enemy.y, -90, WORLD_H + 90);
      this.resolveEntityVsObstacles(enemy, enemy.radius);

      if (distance(enemy, this.player) < enemy.radius + HIT_RADIUS.playerContact && enemy.contactTimer <= 0) {
        enemy.contactTimer = enemy.isBoss ? 0.78 : 1;
        this.damagePlayer(enemy.damage, true);
        this.shake = Math.max(this.shake, enemy.isBoss ? 12 : 5);
      }
    }

  }

  private flushDeadEnemies(suppressBossDraft = false) {
    this.deadEnemyScratch.length = 0;
    let writeIndex = 0;
    for (const enemy of this.enemies) {
      if (enemy.hp > 0) {
        this.enemies[writeIndex] = enemy;
        writeIndex += 1;
      } else {
        this.deadEnemyScratch.push(enemy);
      }
    }
    if (this.deadEnemyScratch.length === 0) return;
    this.enemies.length = writeIndex;
    for (const enemy of this.deadEnemyScratch) this.onEnemyKilled(enemy, suppressBossDraft);
    this.deadEnemyScratch.length = 0;
  }

  private updateBossPattern(enemy: Entity, dt: number) {
    const boss = enemy.boss!;
    const previousPhase = enemy.bossPhase ?? 1;
    const nextPhase = bossPhaseForHealth(enemy.hp, enemy.maxHp, enemy.bossPhase ?? 1);
    if (nextPhase > previousPhase) {
      enemy.bossPhase = nextPhase;
      const phaseMove = this.activeBossPhaseMove(enemy);
      enemy.bossPhaseFlash = 0.45;
      enemy.patternTimer = Math.max(
        enemy.patternTimer,
        phaseMove ? phaseMove.telegraph.previewSeconds + phaseMove.telegraph.imminentSeconds : 0.45,
      );
      this.burst(enemy.x, enemy.y, 18 + nextPhase * 6, CHAPTER_VISUALS[this.chapter].accent, 240);
      if (phaseMove) this.drawPhaseTransitionTelegraph(enemy, phaseMove);
      this.shake = Math.max(this.shake, 8 + nextPhase * 2);
      return;
    }
    enemy.bossPhaseFlash = Math.max(0, (enemy.bossPhaseFlash ?? 0) - dt);
    if (enemy.bossPhaseFlash > 0) return;
    const phaseMove = this.activeBossPhaseMove(enemy);
    const cadenceMultiplier = phaseMove ? 1 / phaseMove.cadenceScale : 1 + ((enemy.bossPhase ?? 1) - 1) * 0.22;
    enemy.patternTimer -= dt * cadenceMultiplier;
    if (boss.pattern === 'dash') {
      if (enemy.patternPhase === 'warn' && enemy.patternTimer <= 0) {
        const dir = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
        enemy.vx = dir.x * enemy.speed * (enemy.slowMultiplier ?? 1) * 4.6;
        enemy.vy = dir.y * enemy.speed * (enemy.slowMultiplier ?? 1) * 4.6;
        enemy.patternPhase = 'dash';
        enemy.patternTimer = 0.55;
        this.beams.push({ id: this.nextId(), x1: enemy.x, y1: enemy.y, x2: enemy.x + dir.x * 720, y2: enemy.y + dir.y * 720, width: 10, life: 0.24, maxLife: 0.24, owner: 'hostile' });
      } else if (enemy.patternPhase === 'dash' && enemy.patternTimer <= 0) {
        enemy.patternPhase = 'idle';
        enemy.patternTimer = 2.4;
      } else if (enemy.patternTimer <= 0) {
        enemy.patternPhase = 'warn';
        enemy.patternTimer = 0.62;
        enemy.patternX = this.player.x;
        enemy.patternY = this.player.y;
      }
    }

    if (boss.pattern === 'rings' && enemy.patternTimer <= 0) {
      enemy.patternTimer = enemy.legacyBoss ? 3.2 : 2.35;
      const count = enemy.legacyBoss ? 14 : 22;
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + this.elapsed * 0.35;
        this.spawnBossProjectile(enemy.x, enemy.y, Math.cos(angle) * 215, Math.sin(angle) * 215, 7, enemy.damage * 0.62, 5, 'ring');
      }
      this.shake = Math.max(this.shake, 4);
    }

    if (boss.pattern === 'shock' && enemy.patternTimer <= 0) {
      enemy.patternTimer = 3.1;
      this.hazards.push({
        id: this.nextId(),
        kind: 'shock',
        x: enemy.x,
        y: enemy.y,
        radius: 190,
        life: 0.52,
        maxLife: 0.52,
        damage: enemy.damage * 1.8,
        slow: 1,
        triggered: false,
      });
    }

    if (boss.pattern === 'clones' && enemy.patternTimer <= 0) {
      enemy.patternTimer = 5.6;
      for (let i = 0; i < 4; i += 1) {
        const angle = (Math.PI * 2 * i) / 4 + this.gameplayRandom() * 0.4;
        this.spawnEnemy(1 + this.chapter * 0.5, 'medium');
        const clone = this.enemies[this.enemies.length - 1];
        clone.x = enemy.x + Math.cos(angle) * 95;
        clone.y = enemy.y + Math.sin(angle) * 95;
        clone.hp *= 1.35;
        clone.maxHp = clone.hp;
        clone.variant = 4;
      }
      this.burst(enemy.x, enemy.y, 18, '#111111', 170);
    }

    if (boss.pattern === 'flame' && enemy.patternTimer <= 0) {
      enemy.patternTimer = 1.05;
      this.hazards.push({ id: this.nextId(), kind: 'fire', x: enemy.x, y: enemy.y, radius: 74, life: 5.8, maxLife: 5.8, damage: enemy.damage * 0.26, slow: 1, triggered: false });
      if (this.gameplayRandom() < 0.35) {
        for (let i = 0; i < 9; i += 1) {
          const angle = (Math.PI * 2 * i) / 9;
          this.spawnBossProjectile(enemy.x, enemy.y, Math.cos(angle) * 180, Math.sin(angle) * 180, 8, enemy.damage * 0.5, 3.8, 'dot');
        }
      }
    }

    if (boss.pattern === 'tide' && enemy.patternTimer <= 0) {
      enemy.patternTimer = 4;
      for (let i = 0; i < 5; i += 1) {
        const angle = (Math.PI * 2 * i) / 5 + this.elapsed;
        this.hazards.push({ id: this.nextId(), kind: 'slow', x: this.player.x + Math.cos(angle) * (120 + i * 42), y: this.player.y + Math.sin(angle) * (120 + i * 42), radius: 86, life: 5.5, maxLife: 5.5, damage: 0, slow: 0.34, triggered: false });
      }
    }

    if (boss.pattern === 'traps' && enemy.patternTimer <= 0) {
      enemy.patternTimer = 2.6;
      for (let i = 0; i < 3; i += 1) {
        const angle = this.gameplayRandom() * Math.PI * 2;
        const dist = 80 + this.gameplayRandom() * 220;
        this.hazards.push({ id: this.nextId(), kind: 'root', x: this.player.x + Math.cos(angle) * dist, y: this.player.y + Math.sin(angle) * dist, radius: 52, life: 7, maxLife: 7, damage: 0, slow: 1, triggered: false });
      }
    }

    if (boss.pattern === 'clock' && enemy.patternTimer <= 0) {
      enemy.patternTimer = 3.2;
      this.hazards.push({ id: this.nextId(), kind: 'slow', x: this.player.x, y: this.player.y, radius: 150, life: 4.6, maxLife: 4.6, damage: 0, slow: 0.28, triggered: false });
      for (let i = 0; i < 12; i += 1) {
        const angle = (Math.PI * 2 * i) / 12 + Math.PI / 12;
        this.spawnBossProjectile(enemy.x, enemy.y, Math.cos(angle) * 150, Math.sin(angle) * 150, 6, enemy.damage * 0.45, 4.5, 'ring');
      }
    }

    if (boss.pattern === 'saw' && enemy.patternTimer <= 0) {
      enemy.patternTimer = 1.8;
      for (let i = 0; i < 4; i += 1) {
        const angle = (Math.PI * 2 * i) / 4 + this.elapsed;
        this.spawnBossProjectile(enemy.x, enemy.y, Math.cos(angle) * 250, Math.sin(angle) * 250, 14, enemy.damage * 0.58, 3.6, 'saw');
      }
    }

    if (boss.pattern === 'eclipse' && enemy.patternTimer <= 0) {
      enemy.patternTimer = 4.4;
      const vertical = this.gameplayRandom() < 0.5;
      for (let i = -3; i <= 3; i += 1) {
        const offset = i * 115;
        const x = vertical ? this.player.x + offset : -60;
        const y = vertical ? -60 : this.player.y + offset;
        const vx = vertical ? 0 : 260;
        const vy = vertical ? 260 : 0;
        this.spawnBossProjectile(x, y, vx, vy, 10, enemy.damage * 0.5, 7, 'eclipse');
      }
    }

    if (boss.pattern === 'null' && enemy.patternTimer <= 0) {
      enemy.patternTimer = 4.8;
      this.hazards.push({ id: this.nextId(), kind: 'null', x: this.player.x + (this.gameplayRandom() - 0.5) * 160, y: this.player.y + (this.gameplayRandom() - 0.5) * 160, radius: 130, life: 5.4, maxLife: 5.4, damage: 0, slow: 0.65, triggered: false });
      for (let i = 0; i < 16; i += 1) {
        const angle = (Math.PI * 2 * i) / 16 + this.elapsed * 0.2;
        this.spawnBossProjectile(enemy.x, enemy.y, Math.cos(angle) * 190, Math.sin(angle) * 190, 8, enemy.damage * 0.5, 4.8, 'eclipse');
      }
    }
  }

  private activeBossPhaseMove(enemy: Entity) {
    if (!enemy.boss || (enemy.bossPhase ?? 1) === 1) return undefined;
    const set = BOSS_PHASE_MOVE_SETS.find((candidate) => candidate.bossId === enemy.boss?.id);
    return set?.moves.find((move) => move.phase === enemy.bossPhase);
  }

  private drawPhaseTransitionTelegraph(enemy: Entity, move: BossPhaseMove) {
    const life = move.telegraph.previewSeconds + move.telegraph.imminentSeconds;
    if (move.telegraph.shape === 'circle' || move.telegraph.shape === 'ring') {
      this.impactRings.push({
        x: enemy.x,
        y: enemy.y,
        radius: enemy.radius * (move.telegraph.shape === 'ring' ? 3.2 : 2.3),
        life,
        maxLife: life,
        tier: 'heavy',
        owner: 'hostile',
      });
      return;
    }

    const direction = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
    const lanes = move.telegraph.shape === 'grid' ? 3 : move.telegraph.shape === 'cone' ? 2 : 1;
    for (let index = 0; index < lanes; index += 1) {
      const offset = (index - (lanes - 1) / 2) * 90;
      this.beams.push({
        id: this.nextId(),
        x1: enemy.x - direction.y * offset,
        y1: enemy.y + direction.x * offset,
        x2: enemy.x + direction.x * 760 - direction.y * offset,
        y2: enemy.y + direction.y * 760 + direction.x * offset,
        width: move.telegraph.shape === 'lane' ? 14 : 8,
        life,
        maxLife: life,
        owner: 'hostile',
      });
    }
  }

  private updateProjectiles(dt: number) {
    for (const projectile of this.projectiles) {
      const start = { x: projectile.x, y: projectile.y };
      projectile.life -= dt;
      if (projectile.skillId === 'fanKnives' && this.skills.fanKnives?.awakened && !projectile.returning && projectile.life <= projectile.maxLife * 0.5) {
        projectile.returning = true;
        projectile.hitEnemyIds.clear();
        projectile.pierce = Math.max(projectile.pierce, 2);
      }
      if (projectile.returning) {
        const direction = normalize(this.player.x - projectile.x, this.player.y - projectile.y);
        projectile.vx = direction.x * 720;
        projectile.vy = direction.y * 720;
      }
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      let obstacleHitTime: number | null = null;
      if (projectile.blockedBySolid) {
        for (const obstacle of this.obstacles) {
          const time = segmentRectHitTime(start, projectile, obstacle, projectile.radius);
          if (time !== null && (obstacleHitTime === null || time < obstacleHitTime)) obstacleHitTime = time;
        }
      }
      const hits = collectSegmentHits(
        start,
        projectile,
        projectile.radius,
        this.enemyIndex.queryRect(
          Math.min(start.x, projectile.x) - projectile.radius,
          Math.min(start.y, projectile.y) - projectile.radius,
          Math.abs(projectile.x - start.x) + projectile.radius * 2,
          Math.abs(projectile.y - start.y) + projectile.radius * 2,
        ).filter((enemy) => enemy.hp > 0),
        projectile.hitEnemyIds,
      );
      for (const { target: enemy, time } of hits) {
        if (obstacleHitTime !== null && obstacleHitTime <= time) break;
        projectile.hitEnemyIds.add(enemy.id);
        this.dealDamage(enemy, projectile.damage, projectile.skillId, projectile.knockback, false);
        projectile.pierce -= 1;
        if (projectile.skillId === 'needleStorm' && this.skills.needleStorm?.awakened) {
          const extra = this.findNearestEnemyFrom(enemy.x, enemy.y, 220, new Set([enemy.id]));
          if (extra) this.dealDamage(extra, projectile.damage * 0.35, projectile.skillId, 40, false);
        }
        if (projectile.pierce < 0) {
          projectile.life = 0;
          break;
        }
      }
      if (projectile.life > 0 && obstacleHitTime !== null) {
        projectile.x = start.x + (projectile.x - start.x) * obstacleHitTime;
        projectile.y = start.y + (projectile.y - start.y) * obstacleHitTime;
        projectile.life = 0;
        this.burst(projectile.x, projectile.y, 4, '#111111', 90);
      }
    }
    recycleWhere(
      this.projectiles,
      (projectile) => projectile.life > 0 && projectile.x > -120 && projectile.x < WORLD_W + 120 && projectile.y > -120 && projectile.y < WORLD_H + 120,
      this.projectilePool,
    );
  }

  private updateBossProjectiles(dt: number) {
    for (const projectile of this.bossProjectiles) {
      const start = { x: projectile.x, y: projectile.y };
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      if (segmentCircleHitTime(start, projectile, this.player, projectile.radius + HIT_RADIUS.playerVsHostileShot) !== null) {
        projectile.life = 0;
        this.damagePlayer(projectile.damage, true);
      }
    }
    recycleWhere(
      this.bossProjectiles,
      (projectile) => projectile.life > 0 && projectile.x > -180 && projectile.x < WORLD_W + 180 && projectile.y > -180 && projectile.y < WORLD_H + 180,
      this.bossProjectilePool,
    );
  }

  private updatePickups(dt: number) {
    for (const pickup of this.pickups) {
      pickup.life -= dt;
      const d = distance(pickup, this.player);
      const aged = pickup.maxLife - pickup.life >= PICKUP_SOFT_TTL;
      if (aged || d < this.player.stats.magnet) {
        const dir = normalize(this.player.x - pickup.x, this.player.y - pickup.y);
        const pull = aged ? 1_650 : 280 + (1 - d / this.player.stats.magnet) * 720;
        pickup.vx = pickup.vx * 0.86 + dir.x * pull * 0.14;
        pickup.vy = pickup.vy * 0.86 + dir.y * pull * 0.14;
      }
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;
      pickup.vx *= 0.98;
      pickup.vy *= 0.98;
      if (pickup.life <= 0 || distance(pickup, this.player) < pickup.radius + HIT_RADIUS.pickupReach) this.collectPickup(pickup);
    }
    recycleWhere(this.pickups, (pickup) => pickup.value > 0, this.pickupPool);
  }

  private collectPickup(pickup: Pickup) {
    if (pickup.value <= 0) return;
    if (pickup.kind === 'xp') {
      this.player.xp += pickup.value;
      while (this.player.xp >= this.player.nextXp) {
        this.player.xp -= this.player.nextXp;
        this.player.level += 1;
        this.player.nextXp = Math.floor(28 + this.player.level * 13 + this.player.level ** 1.35 * 4);
        this.openDraft('level', 'resume');
      }
    } else {
      const gained = Math.ceil(pickup.value * this.player.stats.coinGain);
      this.player.coins += gained;
      this.stageCoinsEarned += gained;
      if (this.skills.coinFever?.awakened) this.coinFeverRushTimer = refreshCoinFeverFrenzy(true);
    }
    pickup.value = 0;
  }

  private updateHazards(dt: number) {
    const expiredVortexIds: number[] = [];
    for (const hazard of this.hazards) {
      const previousLife = hazard.life;
      if (Number.isFinite(hazard.life)) hazard.life -= dt;
      if (hazard.kind === 'shock' && !hazard.triggered && expiredThisStep(previousLife, hazard.life)) {
        hazard.triggered = true;
        if (shockHitsPlayer(hazard, hazard.radius, this.player, HIT_RADIUS.playerVsHostileShot)) this.damagePlayer(hazard.damage, false);
        this.burst(hazard.x, hazard.y, Math.round(28 * this.options.effects), '#050505', 280);
        this.shake = Math.max(this.shake, 11);
      }
      if (hazard.kind === 'warning' && !hazard.triggered && expiredThisStep(previousLife, hazard.life)) {
        hazard.triggered = true;
        const sourceSkillId = hazard.sourceSkillId ?? 'boneMortar';
        this.areaDamage(hazard.x, hazard.y, hazard.radius, hazard.skillDamage ?? 0, sourceSkillId, 210, false);
        if ((hazard.collapseDamage ?? 0) > 0) {
          this.areaDamage(hazard.x, hazard.y, hazard.radius * 0.55, hazard.collapseDamage!, sourceSkillId, 260, true);
        }
        this.addImpactRing(hazard.x, hazard.y, hazard.radius, 'critical');
        if (sourceSkillId === 'boneMortar') this.shake = Math.max(this.shake, 8);
      }
      if (hazard.kind === 'vortex') {
        const sourceSkillId = hazard.sourceSkillId ?? 'voidMine';
        const cooldownKey = `vortex:${hazard.id}`;
        for (const enemy of this.enemyIndex.queryCircle(hazard.x, hazard.y, hazard.radius)) {
          if (enemy.hp <= 0) continue;
          const d = distance(enemy, hazard);
          if (d > hazard.radius) continue;
          if (d >= 4) {
            const dir = normalize(hazard.x - enemy.x, hazard.y - enemy.y);
            enemy.x += dir.x * (hazard.pull ?? 74) * dt * (1 - d / hazard.radius);
            enemy.y += dir.y * (hazard.pull ?? 74) * dt * (1 - d / hazard.radius);
          }
          if ((enemy.damageCooldowns[cooldownKey] ?? 0) <= this.elapsed) {
            enemy.damageCooldowns[cooldownKey] = this.elapsed + 0.35;
            this.dealDamage(enemy, hazard.skillDamage ?? this.player.stats.attack * 0.55, sourceSkillId, 40, false);
          }
        }
        if (!hazard.triggered && expiredThisStep(previousLife, hazard.life)) {
          hazard.triggered = true;
          if ((hazard.collapseDamage ?? 0) > 0) {
            if (sourceSkillId === 'blackSun' && this.skills.blackSun?.awakened) {
              for (const enemy of this.enemyIndex.queryCircle(hazard.x, hazard.y, hazard.radius + 30)) {
                if (enemy.hp <= 0 || distance(enemy, hazard) > hazard.radius + 30 + enemy.radius) continue;
                this.dealDamage(enemy, hazard.collapseDamage! + enemy.maxHp * 0.045, 'blackSun', 220, true);
                const slow = applyTimedSlow({ multiplier: enemy.slowMultiplier, remaining: enemy.slowTimer }, 0.52, 3.5);
                enemy.slowMultiplier = slow.multiplier;
                enemy.slowTimer = slow.remaining;
              }
              this.addImpactRing(hazard.x, hazard.y, hazard.radius + 30, 'critical');
            } else {
              this.areaDamage(hazard.x, hazard.y, hazard.radius + 30, hazard.collapseDamage!, sourceSkillId, 220, true);
            }
            this.shake = Math.max(this.shake, 12);
          }
          expiredVortexIds.push(hazard.id);
        }
      }
    }
    if (expiredVortexIds.length > 0) {
      for (const enemy of this.enemies) {
        for (const id of expiredVortexIds) delete enemy.damageCooldowns[`vortex:${id}`];
      }
    }
    compactWhere(this.hazards, (hazard) => hazard.life > 0);
  }

  private updateEffects(dt: number) {
    for (const beam of this.beams) beam.life -= dt;
    for (const chain of this.chains) chain.life -= dt;
    for (const ring of this.impactRings) ring.life -= dt;
    for (const number of this.damageNumbers) {
      number.life -= dt;
      number.y -= dt * 38;
    }
    compactWhere(this.beams, (beam) => beam.life > 0);
    compactWhere(this.chains, (chain) => chain.life > 0);
    compactWhere(this.impactRings, (ring) => ring.life > 0);
    recycleWhere(this.damageNumbers, (number) => number.life > 0, this.damageNumberPool);
  }

  private updateParticles(dt: number) {
    for (const particle of this.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
    }
    const maxParticles = this.options.effects > 0.65 ? 520 : 260;
    recycleWhere(this.particles, (particle) => particle.life > 0, this.particlePool);
    while (this.particles.length > maxParticles) this.particlePool.release(this.particles.shift()!);
  }

  private resolveEntityVsObstacles(entity: { x: number; y: number }, radius: number) {
    for (const obstacle of this.obstacles) {
      const pushed = circleRectPush(entity.x, entity.y, radius, obstacle);
      entity.x = pushed.x;
      entity.y = pushed.y;
    }
  }

  private spawnProjectile(
    skillId: SkillId,
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    damage: number,
    life: number,
    pierce: number,
    knockback: number,
    blockedBySolid: boolean,
  ) {
    const projectile = this.projectilePool.acquire();
    projectile.hitEnemyIds.clear();
    Object.assign(projectile, {
      id: this.nextId(),
      x,
      y,
      prevX: x,
      prevY: y,
      vx,
      vy,
      radius,
      damage,
      life,
      maxLife: life,
      returning: false,
      pierce,
      knockback,
      skillId,
      blockedBySolid,
    });
    this.projectiles.push(projectile);
  }

  private spawnBossProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    damage: number,
    life: number,
    kind: BossProjectile['kind'],
  ) {
    if (this.bossProjectiles.length >= BOSS_PROJECTILE_HARD_CAP) {
      const oldest = this.bossProjectiles.shift();
      if (oldest) this.bossProjectilePool.release(oldest);
    }
    const projectile = this.bossProjectilePool.acquire();
    Object.assign(projectile, { id: this.nextId(), x, y, prevX: x, prevY: y, vx, vy, radius, damage, life, kind });
    this.bossProjectiles.push(projectile);
  }

  private findNearestEnemy(maxDistance: number, preferBoss = false) {
    let selected: Entity | undefined;
    let best = Number.POSITIVE_INFINITY;
    for (const enemy of this.enemyIndex.queryCircle(this.player.x, this.player.y, maxDistance)) {
      if (enemy.hp <= 0) continue;
      const d = distance(enemy, this.player);
      const score = d - (preferBoss && enemy.isBoss ? 400 : 0);
      if (d < maxDistance && score < best) {
        best = score;
        selected = enemy;
      }
    }
    return selected;
  }

  private findNearestEnemyFrom(x: number, y: number, maxDistance: number, excluded: Set<number>) {
    let selected: Entity | undefined;
    let best = Number.POSITIVE_INFINITY;
    for (const enemy of this.enemyIndex.queryCircle(x, y, maxDistance)) {
      if (enemy.hp <= 0 || excluded.has(enemy.id)) continue;
      const d = Math.hypot(enemy.x - x, enemy.y - y);
      if (d < maxDistance && d < best) {
        best = d;
        selected = enemy;
      }
    }
    return selected;
  }

  private findClusterTarget() {
    let selected: Entity | undefined;
    let best = 0;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      let score = enemy.isBoss ? 4 : 1;
      for (const other of this.enemyIndex.queryCircle(enemy.x, enemy.y, 180)) {
        if (other.hp > 0 && enemy.id !== other.id && distance(enemy, other) < 180) score += other.isBoss ? 3 : 1;
      }
      const playerDistance = distance(enemy, this.player);
      score -= playerDistance / 900;
      if (score > best) {
        best = score;
        selected = enemy;
      }
    }
    return selected;
  }

  private dealDamage(enemy: Entity, rawDamage: number, skillId: SkillId, knockback: number, forceCrit: boolean) {
    if (enemy.hp <= 0) return;
    const hpRatio = enemy.hp / enemy.maxHp;
    const execution = this.skills.executionMark?.awakened && enemy.isBoss ? 1 + (1 - hpRatio) * 0.45 : 1;
    const targetMultiplier = enemy.isBoss ? this.player.stats.bossDamage : this.player.stats.normalDamage;
    const crit = forceCrit || this.gameplayRandom() < this.player.stats.critChance;
    const critMultiplier = crit ? this.player.stats.critDamage : 1;
    const damage = Math.max(1, rawDamage * targetMultiplier * critMultiplier * execution);
    enemy.hp -= damage;
    const impactTier = classifyImpact(damage, enemy.maxHp, crit, enemy.hp <= 0);
    enemy.hitFlash = 0.08;
    if (knockback > 0 && !enemy.isBoss) {
      const dir = normalize(enemy.x - this.player.x, enemy.y - this.player.y);
      enemy.x += dir.x * knockback * 0.035;
      enemy.y += dir.y * knockback * 0.035;
    }
    if (this.options.damageNumbers) {
      this.emitDamageNumber(enemy.x, enemy.y - enemy.radius, damage, crit, crit ? 0.9 : 0.62, 'player');
    }
    const particleCount = impactTier === 'critical' ? 14 : impactTier === 'heavy' ? 8 : 4;
    this.burst(enemy.x, enemy.y, Math.round(particleCount * this.options.effects), impactTier === 'critical' ? '#000000' : '#222222', impactTier === 'critical' ? 240 : impactTier === 'heavy' ? 175 : 130);
    if (impactTier !== 'light') this.addImpactRing(enemy.x, enemy.y, enemy.radius * (impactTier === 'critical' ? 1.8 : 1.35), impactTier);
    if (impactTier !== 'light') this.hitStop = Math.max(this.hitStop, impactTier === 'critical' ? 0.035 : 0.025);
    if (impactTier === 'critical') this.shake = Math.max(this.shake, 4);
    this.playHit(impactTier);
  }

  private areaDamage(x: number, y: number, radius: number, damage: number, skillId: SkillId, knockback: number, forceCrit = false) {
    for (const enemy of this.enemyIndex.queryCircle(x, y, radius)) {
      if (enemy.hp <= 0) continue;
      if (distance(enemy, { x, y }) <= radius + enemy.radius) {
        this.dealDamage(enemy, damage, skillId, knockback, forceCrit);
      }
    }
    this.burst(x, y, Math.round(22 * this.options.effects), '#050505', 230);
  }

  private addImpactRing(x: number, y: number, radius: number, tier: 'heavy' | 'critical') {
    if (this.impactRings.length >= 32) this.impactRings.shift();
    this.impactRings.push({ x, y, radius, life: 0.24, maxLife: 0.24, tier, owner: 'player' });
  }

  private damagePlayer(rawDamage: number, physical: boolean) {
    if (this.cheatGodMode) {
      this.player.hp = this.player.stats.maxHp;
      return;
    }
    if (this.player.invuln > 0 || this.player.shield > 0) return;
    const reduced = Math.max(1, rawDamage - this.player.stats.defense * (physical ? 0.72 : 0.42));
    this.player.hp -= reduced;
    const paperWard = this.skills.paperWard;
    this.player.invuln = paperWardDirectHitInvulnerability(paperWard?.level ?? 0);
    if (this.skills.ironFrame?.awakened) this.player.shield = 0.36;
    if (paperWard?.awakened) this.pushEnemiesFromPlayer(140);
    if (this.options.damageNumbers) {
      this.emitDamageNumber(this.player.x, this.player.y - 38, reduced, false, 0.72, 'hostile');
    }
    this.burst(this.player.x, this.player.y, 12, '#000000', 160);
    this.playTone(140, 0.025, 'triangle');
  }

  private damagePlayerOverTime(damagePerSecond: number, dt: number) {
    if (this.cheatGodMode) {
      this.player.hp = this.player.stats.maxHp;
      return;
    }
    if (this.player.shield > 0) return;
    this.player.hp -= calculateFireDotDamage(damagePerSecond, dt, this.player.stats.defense);
  }

  private pushEnemiesFromPlayer(radius: number) {
    for (const enemy of this.enemyIndex.queryCircle(this.player.x, this.player.y, radius)) {
      if (enemy.hp <= 0 || enemy.isBoss) continue;
      const d = distance(enemy, this.player);
      if (d > radius + enemy.radius) continue;
      const dir = normalize(enemy.x - this.player.x, enemy.y - this.player.y);
      const push = 12 + 20 * (1 - clamp(d / (radius + enemy.radius), 0, 1));
      enemy.x = clamp(enemy.x + dir.x * push, -90, WORLD_W + 90);
      enemy.y = clamp(enemy.y + dir.y * push, -90, WORLD_H + 90);
      this.resolveEntityVsObstacles(enemy, enemy.radius);
    }
  }

  private onEnemyKilled(enemy: Entity, suppressBossDraft = false) {
    this.player.kills += 1;
    this.stageKills += 1;
    if (this.runMode === 'infinite') {
      this.infiniteEventScore += infiniteKillScore(enemy.tier, this.elapsed, this.infiniteBossKills);
      if (enemy.isBoss) {
        this.infiniteBossKills += 1;
        this.infiniteBossRespawnTimer = 2.4;
        this.objectiveTarget = this.infiniteBossKills + 1;
      }
    }
    const xpCount = enemy.isBoss ? 7 : enemy.tier === 'large' ? 4 : enemy.tier === 'medium' ? 2 : 1;
    for (let i = 0; i < xpCount; i += 1) {
      this.spawnPickup(
        'xp',
        enemy.x + (this.gameplayRandom() - 0.5) * enemy.radius,
        enemy.y + (this.gameplayRandom() - 0.5) * enemy.radius,
        (this.gameplayRandom() - 0.5) * 90,
        (this.gameplayRandom() - 0.5) * 90,
        6,
        Math.ceil(enemy.xp / xpCount),
      );
    }
    const coinCount = enemy.isBoss ? 9 : enemy.tier === 'large' ? 3 : this.gameplayRandom() < 0.42 ? 1 : 0;
    for (let i = 0; i < coinCount; i += 1) {
      this.spawnPickup(
        'coin',
        enemy.x + (this.gameplayRandom() - 0.5) * enemy.radius,
        enemy.y + (this.gameplayRandom() - 0.5) * enemy.radius,
        (this.gameplayRandom() - 0.5) * 110,
        (this.gameplayRandom() - 0.5) * 110,
        5,
        Math.ceil(enemy.coin / Math.max(1, coinCount)),
      );
    }
    this.burst(enemy.x, enemy.y, enemy.isBoss ? 42 : 16, '#050505', enemy.isBoss ? 340 : 190);
    this.shake = Math.max(this.shake, enemy.isBoss ? 18 : 4);
    this.playTone(enemy.isBoss ? 80 : 240, enemy.isBoss ? 0.09 : 0.035, enemy.isBoss ? 'sawtooth' : 'square');

    if (enemy.isBoss && !suppressBossDraft) {
      if (this.runMode === 'infinite') {
        this.openDraft('boss', 'resume');
      } else if (this.kind === 'normal' || enemy.legacyBoss || enemy.boss?.role === 'field') {
        this.openDraft('boss', 'resume');
      } else {
        this.openDraft('boss', 'roundClear');
      }
    }
  }

  private rebuildEnemyIndex() {
    this.enemyIndex.clear();
    for (const enemy of this.enemies) {
      if (enemy.hp > 0) this.enemyIndex.insert(enemy);
    }
  }

  private querySegmentEnemies(x1: number, y1: number, x2: number, y2: number, padding: number) {
    return this.enemyIndex.queryRect(
      Math.min(x1, x2) - padding,
      Math.min(y1, y2) - padding,
      Math.abs(x2 - x1) + padding * 2,
      Math.abs(y2 - y1) + padding * 2,
    );
  }

  private updatePlayerAim() {
    const target = this.findNearestEnemy(980);
    this.aimTargetId = target?.id ?? null;
    this.playerAimAngle = target
      ? Math.atan2(target.y - this.player.y, target.x - this.player.x)
      : -Math.PI / 2;
  }

  private spawnPickup(kind: Pickup['kind'], x: number, y: number, vx: number, vy: number, radius: number, value: number) {
    const target = selectPickupMergeTarget(this.pickups, { x, y, kind });
    if (target) {
      mergePickupValue(target, value);
      return;
    }

    const pickup = this.pickupPool.acquire();
    const maxLife = pickupTtl(kind);
    Object.assign(pickup, { id: this.nextId(), x, y, prevX: x, prevY: y, vx, vy, radius, kind, value, life: maxLife, maxLife });
    if (this.pickups.length >= PICKUP_HARD_CAP) {
      this.collectPickup(pickup);
      this.pickupPool.release(pickup);
      return;
    }
    this.pickups.push(pickup);
  }

  private emitDamageNumber(x: number, y: number, value: number, crit: boolean, life: number, owner: EffectOwner) {
    let number: DamageNumber | undefined;
    if (this.damageNumbers.length >= 160) {
      if (!crit) return;
      const replaceIndex = this.damageNumbers.findIndex((candidate) => !candidate.crit);
      if (replaceIndex < 0) return;
      number = this.damageNumbers.splice(replaceIndex, 1)[0];
    }
    number ??= this.damageNumberPool.acquire();
    Object.assign(number, { id: this.nextId(), x, y, value, crit, life, maxLife: life, owner });
    this.damageNumbers.push(number);
  }

  private openDraft(reason: DraftReason, after: DraftState['after']) {
    if (this.rewardLock) {
      this.draftQueue.push({ reason, after });
      return;
    }
    this.presentDraft(reason, after);
  }

  private presentDraft(reason: DraftReason, after: DraftState['after']) {
    this.rewardLock = true;
    this.activeDraftAfter = after;
    this.paused = true;
    const cards = this.generateOffers(reason);
    const id = this.nextId();
    this.activeDraftId = id;
    this.callbacks.onDraft({
      id,
      title: reason === 'boss' ? '보스 보상' : `Lv.${this.player.level} 스킬 선택`,
      reason,
      after,
      cards,
    });
  }

  private generateOffers(reason: DraftReason) {
    const offers: SkillOffer[] = [];
    const pending = this.pendingAwakenings.find((id) => {
      const skill = this.skills[id];
      return skill && skill.level >= 5 && !skill.awakened;
    });
    if (pending) offers.push(this.makeOffer(pending, 'awakening'));

    const wanted = reason === 'boss' ? DRAFT_SIZE.boss : DRAFT_SIZE.level;
    let guard = 0;
    while (offers.length < wanted && guard < 80) {
      guard += 1;
      const id = this.weightedSkillPick();
      if (offers.some((offer) => offer.kind !== 'bonus' && offer.skillId === id)) continue;
      const state = this.skills[id];
      if (state?.awakened) continue;
      if (state && state.level >= 5) continue;
      offers.push(this.makeOffer(id, 'skill'));
    }
    for (const offer of this.makeBonusOffers(reason)) {
      if (offers.length >= wanted) break;
      offers.push(offer);
    }
    return offers;
  }

  private weightedSkillPick() {
    const luck = this.meta.passives.rareLuck;
    const difficultyBias = this.runMode === 'infinite'
      ? clamp(this.elapsed / 1_800, 0, 1)
      : (stageIndex(this.chapter, this.stage) - 1) / (TOTAL_STAGE_COUNT - 1);
    const skillChapter = this.runMode === 'infinite' ? CHAPTER_COUNT : this.chapter;
    const availableSkills = filterSkillsForChapter(SKILL_IDS.map((id) => SKILLS[id]), skillChapter);
    const entries = availableSkills.map(({ id }) => {
      const rarity = SKILLS[id].rarity;
      const luckBonus =
        rarity === 'rare' ? luck * 1.4 :
        rarity === 'epic' ? luck * 1.8 :
        rarity === 'legendary' ? luck * 2.2 :
        rarity === 'mythic' ? luck * 2.8 :
        -luck * 1.4;
      const difficultyBonus =
        rarity === 'rare' ? difficultyBias * 0.6 :
        rarity === 'epic' ? difficultyBias * 1 :
        rarity === 'legendary' ? difficultyBias * 1.4 :
        rarity === 'mythic' ? difficultyBias * 1.8 :
        -difficultyBias;
      return { id, weight: Math.max(1, RARITY[rarity].weight + luckBonus + difficultyBonus) };
    });
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = this.gameplayRandom() * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) return entry.id;
    }
    return entries[0].id;
  }

  private makeOffer(skillId: SkillId, kind: 'skill' | 'awakening'): SkillOffer {
    const def = SKILLS[skillId];
    const state = this.skills[skillId];
    if (kind === 'awakening') {
      return {
        kind,
        skillId,
        rarity: def.rarity,
        title: `${def.name} 각성`,
        body: def.awakeningText,
        levelLine: 'Lv.5 이후 확정 등장',
      };
    }
    const nextLevel = (state?.level ?? 0) + 1;
    return {
      kind,
      skillId,
      rarity: def.rarity,
      title: state ? `${def.name} Lv.${nextLevel}` : def.name,
      body: state ? def.levelText(nextLevel) : def.summary,
      levelLine: state ? `현재 Lv.${state.level} -> Lv.${nextLevel}` : `${RARITY[def.rarity].label} 신규 스킬`,
    };
  }

  private makeBonusOffers(reason: DraftReason): SkillOffer[] {
    const bonusRarity: Rarity = reason === 'boss' ? 'epic' : 'rare';
    return [
      {
        kind: 'bonus',
        bonus: 'overdrive',
        rarity: bonusRarity,
        title: '임시 과부하',
        body: '이번 세트 동안 공격력과 공격속도 라운드 강화가 1단계씩 즉시 상승합니다.',
        levelLine: '스킬 풀이 모두 막혔을 때 등장',
      },
      {
        kind: 'bonus',
        bonus: 'coins',
        rarity: 'rare',
        title: '압축 코인 상자',
        body: '즉시 코인을 획득합니다. 획득량은 현재 단계와 라운드에 따라 증가합니다.',
        levelLine: '라운드 내 강화 재료',
      },
      {
        kind: 'bonus',
        bonus: 'heal',
        rarity: 'common',
        title: '응급 봉합',
        body: '최대 체력의 50%를 즉시 회복합니다.',
        levelLine: '생존 보정 보상',
      },
    ];
  }

  private makeSettlement(title: string, cleared = this.stageFinished && this.player.hp > 0): Settlement {
    const infinite = this.runMode === 'infinite';
    const base = cleared ? 40 : 16;
    const bossBonus = infinite
      ? this.infiniteBossKills * 28
      : this.kind === 'normal'
        ? 0
        : 70 + this.chapter * 20;
    const gold = Math.floor(base + bossBonus + this.stageKills * 0.9 + this.stageCoinsEarned * 0.28 + this.chapter * 18 + this.stage * 8);
    const xp = Math.floor(70 + this.stageKills * 1.1 + this.chapter * 24 + (infinite ? this.infiniteBossKills * 18 : this.kind === 'normal' ? 0 : 80));
    const gameComplete = !infinite && this.chapter === 5 && this.stage === 10 && cleared;
    return {
      runMode: this.runMode,
      seed: this.runSeed,
      chapter: this.chapter,
      stage: this.stage,
      title: infinite ? '무한 기록 정산' : title,
      kills: this.stageKills,
      coins: this.player.coins,
      coinsEarned: this.stageCoinsEarned,
      gold,
      xp,
      cleared,
      gameComplete,
      score: infinite ? infiniteScoreWithSurvival(this.infiniteEventScore, this.elapsed) : 0,
      survivedSeconds: infinite ? this.elapsed : 0,
      bossKills: infinite ? this.infiniteBossKills : 0,
      scoreEligible: infinite ? this.scoreEligible : false,
      rulesVersion: this.rules.version,
    };
  }

  private enrageBosses() {
    this.bossEnraged = true;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || !enemy.isBoss) continue;
      enemy.damage *= 4.5;
      enemy.speed *= 1.35;
      enemy.patternTimer = Math.min(enemy.patternTimer, 0.65);
      enemy.hitFlash = 0.4;
    }
    const reinforcements = Math.min(14 + this.chapter * 3, Math.max(0, this.enemyCap() - this.enemies.length));
    for (let index = 0; index < reinforcements; index += 1) {
      this.spawnEnemy(1.4 + this.chapter * 0.55, index % 5 === 0 ? 'medium' : 'small');
    }
    this.hazards.push({
      id: this.nextId(),
      kind: 'null',
      x: this.player.x,
      y: this.player.y,
      radius: 170,
      life: 8,
      maxLife: 8,
      damage: 0,
      slow: 0.62,
      triggered: false,
    });
    this.shake = Math.max(this.shake, 22);
    this.burst(this.player.x, this.player.y, 60, '#000000', 320);
    this.playTone(65, 0.12, 'sawtooth');
    this.emitSnapshot(true);
  }

  private recalculateStats(fullHeal: boolean) {
    const previousMax = this.player.stats.maxHp;
    this.player.stats = buildStats(this.meta, this.runUpgrades, this.skills);
    if (fullHeal) {
      this.player.hp = this.player.stats.maxHp;
    } else if (previousMax > 0) {
      this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp);
    }
  }

  private effectiveAttackSpeed() {
    return effectiveCoinFeverAttackSpeed(
      this.player.stats.attackSpeed,
      this.skills.coinFever?.awakened === true,
      this.coinFeverRushTimer,
    );
  }

  private emitSnapshot(force: boolean) {
    if (!force && this.snapshotTimer > 0) return;
    this.snapshotTimer = 0.12;
    const boss = this.enemies.find((enemy) => enemy.isBoss && !enemy.legacyBoss && (this.kind !== 'normal' || enemy.boss?.role === 'field'));
    const bossMove = boss ? this.activeBossPhaseMove(boss) : undefined;
    const activeEffects: ActiveStatusEffect[] = [
      ...(this.player.invuln > 0 ? [{ id: 'invulnerable', kind: 'buff' as const, label: '피격 무적', remaining: this.player.invuln }] : []),
      ...(this.player.shield > 0 ? [{ id: 'shield', kind: 'buff' as const, label: '보호막', remaining: this.player.shield }] : []),
      ...(this.coinFeverRushTimer > 0 ? [{ id: 'coin-fever', kind: 'buff' as const, label: '공격속도 폭주', remaining: this.coinFeverRushTimer }] : []),
      ...(this.cheatGodMode ? [{ id: 'god', kind: 'buff' as const, label: 'GOD', value: 'ON' }] : []),
      ...(this.player.root > 0 ? [{ id: 'root', kind: 'debuff' as const, label: '이동 불가', remaining: this.player.root }] : []),
      ...(this.player.slow < 0.99 ? [{ id: 'slow', kind: 'debuff' as const, label: '감속', value: `-${Math.round((1 - this.player.slow) * 100)}%` }] : []),
      ...(this.player.silence > 0 ? [{ id: 'silence', kind: 'debuff' as const, label: '스킬 침묵', remaining: this.player.silence }] : []),
    ];
    const cc = [
      ...activeEffects.map((effect) => effect.label),
      this.runMode === 'infinite' && !this.scoreEligible ? '기록 제외' : '',
    ].filter(Boolean).join(' / ');
    const infiniteDifficulty = this.runMode === 'infinite'
      ? infiniteDifficultyAt(this.elapsed, this.infiniteBossKills)
      : null;
    this.callbacks.onSnapshot({
      runMode: this.runMode,
      seed: this.runSeed,
      chapter: this.chapter,
      stage: this.stage,
      stageKind: this.kind,
      objective: this.objective,
      objectiveProgress: this.runMode === 'infinite'
        ? this.infiniteBossKills
        : this.kind === 'normal'
          ? Math.min(this.duration - this.timeLeft, this.objectiveTarget)
          : this.enemies.some((enemy) => enemy.isBoss && !enemy.legacyBoss)
            ? 0
            : 1,
      objectiveTarget: this.objectiveTarget,
      timeLeft: this.timeLeft,
      duration: this.duration,
      timeScale: this.timeScale,
      hp: this.player.hp,
      maxHp: this.player.stats.maxHp,
      level: this.player.level,
      xp: this.player.xp,
      nextXp: this.player.nextXp,
      coins: this.player.coins,
      kills: this.player.kills,
      enemyCount: this.enemies.length,
      elapsed: this.elapsed,
      score: this.runMode === 'infinite' ? infiniteScoreWithSurvival(this.infiniteEventScore, this.elapsed) : 0,
      bossKills: this.infiniteBossKills,
      dangerRank: infiniteDifficulty?.rank ?? stageIndex(this.chapter, this.stage),
      scoreEligible: this.runMode === 'infinite' && this.scoreEligible,
      rulesVersion: this.rules.version,
      bossName: boss?.boss?.name ? `${boss.boss.name} · PHASE ${boss.bossPhase ?? 1}${this.bossEnraged ? ' [광폭화]' : ''}` : undefined,
      bossMove: bossMove?.attackGrammar,
      bossHp: boss?.hp,
      bossMaxHp: boss?.maxHp,
      skills: { ...this.skills },
      runUpgrades: { ...this.runUpgrades },
      stats: { ...this.player.stats, attackSpeed: this.effectiveAttackSpeed() },
      activeEffects,
      cc,
    });
  }

  private interpolated(item: { x: number; y: number; prevX?: number; prevY?: number }) {
    return interpolatePosition(
      { x: item.prevX ?? item.x, y: item.prevY ?? item.y },
      item,
      this.renderAlpha,
    );
  }

  private render(alpha = 1) {
    const ctx = this.ctx;
    this.renderAlpha = alpha;
    const camera = this.interpolated(this.camera);
    this.renderViewport = makeViewport(camera.x, camera.y, this.viewW, this.viewH, 160);
    const policy = motionPolicy(this.options.reducedFlash, this.systemReducedMotion);
    this.visualRenderer.beginFrame(createRenderFrameSnapshot({
      chapter: this.chapter,
      elapsed: this.elapsed,
      alpha,
      reducedMotion: policy.reduced,
      aimAngle: this.playerAimAngle,
      moving: this.playerMoved(),
      bossEnraged: this.bossEnraged,
      enemyCount: this.enemies.length,
    }));
    const shaking = !this.paused && this.options.screenShake && !policy.reduced && this.shake > 0.01;
    const shakeX = shaking ? (this.effectRandom() - 0.5) * this.shake : 0;
    const shakeY = shaking ? (this.effectRandom() - 0.5) * this.shake : 0;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.viewW, this.viewH);
    ctx.fillStyle = NEUTRAL.paper;
    ctx.fillRect(0, 0, this.viewW, this.viewH);
    ctx.save();
    ctx.translate(-camera.x + shakeX, -camera.y + shakeY);
    // Layer order (BUG-12 / TEC-12): effects never cover the player body, enemy shots stay above every
    // body so an incoming hit is always visible, and the player keyline sits on top of everything.
    this.drawWorld(ctx);
    this.drawHazards(ctx);
    this.drawObstacles(ctx);
    this.drawTargetGuide(ctx);
    this.drawPickups(ctx);
    this.drawBeams(ctx);
    this.drawEnemies(ctx);
    this.drawTargetReticle(ctx);
    this.drawImpactRings(ctx);
    this.drawParticles(ctx);
    this.drawDamageNumbers(ctx);
    this.drawOrbitScythes(ctx);
    this.drawMirrorClone(ctx);
    this.drawPlayer(ctx);
    this.drawFriendlyProjectiles(ctx);
    this.drawHostileProjectiles(ctx);
    this.drawPlayerXray(ctx);
    ctx.restore();
  }

  private drawWorld(ctx: CanvasRenderingContext2D) {
    this.ensureGridPattern();
    const viewport = this.renderViewport;
    if (this.gridPattern) {
      ctx.fillStyle = this.gridPattern;
      ctx.fillRect(viewport.left, viewport.top, viewport.right - viewport.left, viewport.bottom - viewport.top);
    } else {
      ctx.strokeStyle = NEUTRAL.gridLine;
      ctx.lineWidth = 1;
      const xs = visibleGridLineRange(viewport.left, viewport.right, 120, 0, WORLD_W);
      const ys = visibleGridLineRange(viewport.top, viewport.bottom, 120, 0, WORLD_H);
      if (xs) {
        for (let x = xs.first; x <= xs.last; x += xs.step) {
          ctx.beginPath();
          ctx.moveTo(x, Math.max(0, viewport.top));
          ctx.lineTo(x, Math.min(WORLD_H, viewport.bottom));
          ctx.stroke();
        }
      }
      if (ys) {
        for (let y = ys.first; y <= ys.last; y += ys.step) {
          ctx.beginPath();
          ctx.moveTo(Math.max(0, viewport.left), y);
          ctx.lineTo(Math.min(WORLD_W, viewport.right), y);
          ctx.stroke();
        }
      }
    }
    this.drawChapterMotif(ctx);
    if (rectVisible(viewport, -4, -4, WORLD_W + 8, WORLD_H + 8)) {
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, WORLD_W, WORLD_H);
    }
  }

  private drawChapterMotif(ctx: CanvasRenderingContext2D) {
    const viewport = this.renderViewport;
    const visual = CHAPTER_VISUALS[this.chapter] ?? CHAPTER_VISUALS[1];
    const centerX = Math.round(((viewport.left + viewport.right) / 2) / 480) * 480;
    const centerY = Math.round(((viewport.top + viewport.bottom) / 2) / 480) * 480;
    ctx.save();
    ctx.strokeStyle = visual.accent;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 2;

    if (visual.motif === 'orthogonal') {
      const xs = visibleGridLineRange(viewport.left, viewport.right, 480, 0, WORLD_W);
      const ys = visibleGridLineRange(viewport.top, viewport.bottom, 480, 0, WORLD_H);
      if (xs) for (let x = xs.first; x <= xs.last; x += xs.step) ctx.strokeRect(x - 12, Math.max(0, viewport.top), 24, Math.min(WORLD_H, viewport.bottom) - Math.max(0, viewport.top));
      if (ys) for (let y = ys.first; y <= ys.last; y += ys.step) ctx.strokeRect(Math.max(0, viewport.left), y - 8, Math.min(WORLD_W, viewport.right) - Math.max(0, viewport.left), 16);
    } else if (visual.motif === 'radial') {
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * 54, centerY + Math.sin(angle) * 54);
        ctx.lineTo(centerX + Math.cos(angle) * 310, centerY + Math.sin(angle) * 310);
        ctx.stroke();
      }
    } else if (visual.motif === 'flow') {
      for (let offset = -240; offset <= 240; offset += 120) {
        ctx.beginPath();
        ctx.moveTo(viewport.left, centerY + offset);
        for (let x = viewport.left; x <= viewport.right; x += 120) {
          ctx.quadraticCurveTo(x + 60, centerY + offset - 32, x + 120, centerY + offset);
        }
        ctx.stroke();
      }
    } else if (visual.motif === 'clock') {
      for (const radius of [80, 160, 240]) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * 210, centerY + Math.sin(angle) * 210);
        ctx.lineTo(centerX + Math.cos(angle) * 240, centerY + Math.sin(angle) * 240);
        ctx.stroke();
      }
    } else {
      ctx.lineWidth = 4;
      for (const radius of [72, 128, 210, 300]) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI * 0.12, Math.PI * 1.88);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private ensureGridPattern() {
    if (this.gridPattern || typeof document.createElement !== 'function') return;
    const tile = document.createElement('canvas');
    tile.width = 120;
    tile.height = 120;
    const tileCtx = tile.getContext('2d');
    if (!tileCtx) return;
    tileCtx.strokeStyle = NEUTRAL.gridLine;
    tileCtx.lineWidth = 1;
    tileCtx.beginPath();
    tileCtx.moveTo(0.5, 0);
    tileCtx.lineTo(0.5, 120);
    tileCtx.moveTo(0, 0.5);
    tileCtx.lineTo(120, 0.5);
    tileCtx.stroke();
    this.gridPattern = this.ctx.createPattern(tile, 'repeat') ?? undefined;
    if (this.gridPattern) this.gridCacheBuilds += 1;
  }

  private drawHazards(ctx: CanvasRenderingContext2D) {
    for (const hazard of this.hazards) {
      if (!circleVisible(this.renderViewport, hazard.x, hazard.y, hazard.radius * 1.25 + 8)) continue;
      this.visualRenderer.drawHazard(ctx, hazard);
    }
  }

  private drawObstacles(ctx: CanvasRenderingContext2D) {
    for (const obstacle of this.obstacles) {
      if (!rectVisible(this.renderViewport, obstacle.x - 12, obstacle.y - 12, obstacle.w + 28, obstacle.h + 30)) continue;
      this.visualRenderer.drawObstacle(ctx, obstacle);
    }
  }

  private drawPickups(ctx: CanvasRenderingContext2D) {
    for (const pickup of this.pickups) {
      const point = this.interpolated(pickup);
      if (!circleVisible(this.renderViewport, point.x, point.y, pickup.radius + 10)) continue;
      this.visualRenderer.drawPickup(ctx, pickup, point.x, point.y);
    }
  }

  private currentAimTarget() {
    if (this.aimTargetId === null) return undefined;
    return this.enemies.find((enemy) => enemy.id === this.aimTargetId && enemy.hp > 0);
  }

  private drawTargetGuide(ctx: CanvasRenderingContext2D) {
    const target = this.currentAimTarget();
    if (!target) return;
    const player = this.interpolated(this.player);
    const point = this.interpolated(target);
    if (!segmentVisible(this.renderViewport, player.x, player.y, point.x, point.y, 24)) return;
    const angle = Math.atan2(point.y - player.y, point.x - player.x);
    const distanceToTarget = Math.hypot(point.x - player.x, point.y - player.y);

    ctx.save();
    const gradient = ctx.createLinearGradient?.(player.x, player.y, point.x, point.y);
    if (gradient && typeof gradient.addColorStop === 'function') {
      gradient.addColorStop(0, rgba(TARGET_COLOR, 0));
      gradient.addColorStop(0.18, rgba(TARGET_COLOR, 0.22));
      gradient.addColorStop(0.5, rgba(TARGET_COLOR, 0.04));
      gradient.addColorStop(0.82, rgba(TARGET_COLOR, 0.38));
      gradient.addColorStop(1, rgba(TARGET_COLOR, 0.72));
      ctx.strokeStyle = gradient;
    } else {
      ctx.strokeStyle = rgba(TARGET_COLOR, 0.36);
    }
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 10]);
    ctx.beginPath();
    ctx.moveTo(
      player.x + Math.cos(angle) * 48,
      player.y + Math.sin(angle) * 48,
    );
    ctx.lineTo(
      point.x - Math.cos(angle) * (target.radius + 18),
      point.y - Math.sin(angle) * (target.radius + 18),
    );
    ctx.stroke();

    if (distanceToTarget > 150) {
      const arrowDistance = Math.max(86, distanceToTarget - target.radius - 44);
      const arrowX = player.x + Math.cos(angle) * arrowDistance;
      const arrowY = player.y + Math.sin(angle) * arrowDistance;
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.68;
      ctx.fillStyle = TARGET_COLOR;
      ctx.beginPath();
      ctx.moveTo(arrowX + Math.cos(angle) * 8, arrowY + Math.sin(angle) * 8);
      ctx.lineTo(arrowX + Math.cos(angle + 2.45) * 7, arrowY + Math.sin(angle + 2.45) * 7);
      ctx.lineTo(arrowX + Math.cos(angle - 2.45) * 7, arrowY + Math.sin(angle - 2.45) * 7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawTargetReticle(ctx: CanvasRenderingContext2D) {
    const target = this.currentAimTarget();
    if (!target) return;
    const point = this.interpolated(target);
    const outerRadius = target.radius + (target.isBoss ? 22 : 14);
    if (!circleVisible(this.renderViewport, point.x, point.y, outerRadius + 12)) return;
    const policy = motionPolicy(this.options.reducedFlash, this.systemReducedMotion);
    const rotation = policy.rotateDanger ? this.elapsed * 0.9 : 0;

    ctx.save();
    ctx.translate(point.x, point.y);
    // The aim reticle is the player's information, so it keeps the ally colour even on a boss (BUG-14).
    ctx.strokeStyle = TARGET_COLOR;
    ctx.fillStyle = TARGET_COLOR;
    ctx.lineWidth = target.isBoss ? 3 : 2;
    ctx.globalAlpha = 0.9;
    for (let index = 0; index < 4; index += 1) {
      const start = rotation + index * Math.PI / 2 - 0.28;
      ctx.beginPath();
      ctx.arc(0, 0, outerRadius, start, start + 0.56);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.42;
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(0, -outerRadius - 7, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBeams(ctx: CanvasRenderingContext2D) {
    for (const beam of this.beams) {
      if (!segmentVisible(this.renderViewport, beam.x1, beam.y1, beam.x2, beam.y2, beam.width)) continue;
      this.visualRenderer.drawBeam(ctx, beam);
    }

    for (const chain of this.chains) {
      if (!chain.points.some((point, index) => index > 0 && segmentVisible(this.renderViewport, chain.points[index - 1].x, chain.points[index - 1].y, point.x, point.y, 5))) continue;
      this.visualRenderer.drawChain(ctx, chain.points, chain.life, chain.maxLife);
    }
  }

  private drawFriendlyProjectiles(ctx: CanvasRenderingContext2D) {
    for (const projectile of this.projectiles) {
      const point = this.interpolated(projectile);
      if (!circleVisible(this.renderViewport, point.x, point.y, projectile.radius * 8)) continue;
      this.visualRenderer.drawFriendlyProjectile(ctx, {
        x: point.x,
        y: point.y,
        vx: projectile.vx,
        vy: projectile.vy,
        radius: projectile.radius,
        life: projectile.life,
        maxLife: projectile.maxLife,
        returning: projectile.returning,
        skillId: projectile.skillId,
      });
    }
  }

  private drawHostileProjectiles(ctx: CanvasRenderingContext2D) {
    for (const projectile of this.bossProjectiles) {
      const point = this.interpolated(projectile);
      if (!circleVisible(this.renderViewport, point.x, point.y, projectile.radius * 2.2)) continue;
      this.visualRenderer.drawHostileProjectile(ctx, {
        x: point.x,
        y: point.y,
        vx: projectile.vx,
        vy: projectile.vy,
        radius: projectile.radius,
        life: projectile.life,
        kind: projectile.kind,
      });
    }
  }

  private drawEnemies(ctx: CanvasRenderingContext2D) {
    for (const enemy of this.enemies) {
      const point = this.interpolated(enemy);
      if (!circleVisible(this.renderViewport, point.x, point.y, enemy.radius + 24)) continue;
      this.visualRenderer.drawEnemy(ctx, {
        id: enemy.id,
        x: point.x,
        y: point.y,
        vx: enemy.vx,
        vy: enemy.vy,
        radius: enemy.radius,
        tier: enemy.tier,
        variant: enemy.variant,
        isBoss: enemy.isBoss,
        attackStyle: enemy.attackStyle,
        hitFlash: enemy.hitFlash,
        bossId: enemy.boss?.id,
        bossPattern: enemy.boss?.pattern,
        bossPhase: enemy.bossPhase,
        legacyBoss: enemy.legacyBoss === true,
      });

      if (!enemy.isBoss && enemy.attackStyle === 'ranged') {
        ctx.save();
        ctx.strokeStyle = SIGNAL.hostile;
        ctx.lineWidth = enemy.rangedTelegraph > 0 ? 3 : 2;
        ctx.globalAlpha = enemy.rangedTelegraph > 0 ? 0.78 : 0.62;
        if (enemy.rangedTelegraph > 0) {
          ctx.setLineDash([8, 7]);
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(enemy.patternX, enemy.patternY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.beginPath();
        ctx.arc(point.x, point.y, enemy.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = SIGNAL.hostile;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y - enemy.radius - 12);
        ctx.lineTo(point.x + 5, point.y - enemy.radius - 4);
        ctx.lineTo(point.x - 5, point.y - enemy.radius - 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      const showHealth =
        this.options.healthBars === 'all' ||
        (this.options.healthBars === 'elite' && (enemy.isBoss || enemy.tier === 'large'));
      if (showHealth) this.drawHealthBar(ctx, point.x, point.y - enemy.radius - 14, enemy.radius * 2.1, 6, enemy.hp / enemy.maxHp);
    }
  }

  private drawImpactRings(ctx: CanvasRenderingContext2D) {
    for (const ring of this.impactRings) {
      if (!circleVisible(this.renderViewport, ring.x, ring.y, ring.radius * 1.5)) continue;
      this.visualRenderer.drawImpactRing(ctx, ring);
    }
  }

  private drawOrbitScythes(ctx: CanvasRenderingContext2D) {
    const skill = this.skills.orbitScythes;
    if (!skill) return;
    const blades = skill.level + 1 + (skill.awakened ? 3 : 0);
    const baseRadius = 72 + skill.level * 10;
    const player = this.interpolated(this.player);
    for (let i = 0; i < blades; i += 1) {
      const reverse = skill.awakened && i >= skill.level + 1;
      const speed = reverse ? -2.6 : 3.2;
      const bladeRadius = reverse ? baseRadius + 52 : baseRadius;
      // Blades hit where the simulation puts them, so reduced motion must not freeze their drawn position (BUG-15).
      const angle = this.elapsed * speed + (Math.PI * 2 * i) / blades;
      const x = player.x + Math.cos(angle) * bladeRadius;
      const y = player.y + Math.sin(angle) * bladeRadius;
      this.visualRenderer.drawOrbitBlade(ctx, x, y, angle, reverse);
    }
  }

  private drawMirrorClone(ctx: CanvasRenderingContext2D) {
    const skill = this.skills.mirrorClone;
    if (!skill) return;
    const player = this.interpolated(this.player);
    const sideAngle = this.playerAimAngle + Math.PI / 2;
    const offsets = skill.awakened ? [-1, 1] : [1];
    const policy = motionPolicy(this.options.reducedFlash, this.systemReducedMotion);

    for (const side of offsets) {
      const distanceFromPlayer = 48 + skill.level * 2;
      const drift = policy.reduced ? 0 : Math.sin(this.elapsed * 4.2 + side) * 3;
      const x = player.x + Math.cos(sideAngle) * distanceFromPlayer * side + Math.cos(this.playerAimAngle) * drift;
      const y = player.y + Math.sin(sideAngle) * distanceFromPlayer * side + Math.sin(this.playerAimAngle) * drift;
      this.visualRenderer.drawMirrorClone(ctx, {
        x,
        y,
        aimAngle: this.playerAimAngle,
        moving: this.playerMoved(),
        shield: 0,
        silence: 0,
        alpha: skill.awakened ? 0.28 : 0.36,
      });
    }
  }

  /** Walk cycles follow actual movement (keys held while rooted or paused must not animate) (BUG-15). */
  private playerMoved() {
    return !this.paused && Math.hypot(this.player.x - this.player.prevX, this.player.y - this.player.prevY) > 0.01;
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const moving = this.playerMoved();
    const player = this.interpolated(this.player);
    this.visualRenderer.drawPlayer(ctx, {
      x: player.x,
      y: player.y,
      aimAngle: this.playerAimAngle,
      moving,
      shield: this.player.shield,
      silence: this.player.silence,
    });
  }

  private playerCovered() {
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || !(enemy.isBoss || enemy.tier === 'large')) continue;
      if (distance(enemy, this.player) < enemy.radius + 34) return true;
    }
    return false;
  }

  private drawPlayerXray(ctx: CanvasRenderingContext2D) {
    if (!this.playerCovered()) return;
    const player = this.interpolated(this.player);
    this.visualRenderer.drawPlayerXray(ctx, { x: player.x, y: player.y, hitRadius: HIT_RADIUS.playerContact });
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const particle of this.particles) {
      if (!circleVisible(this.renderViewport, particle.x, particle.y, particle.size)) continue;
      this.visualRenderer.drawParticle(ctx, particle);
    }
  }

  private drawDamageNumbers(ctx: CanvasRenderingContext2D) {
    if (!this.options.damageNumbers) return;
    for (const number of this.damageNumbers) {
      if (!circleVisible(this.renderViewport, number.x, number.y, 52)) continue;
      this.visualRenderer.drawDamageNumber(ctx, number);
    }
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ratio: number) {
    this.visualRenderer.drawHealthBar(ctx, x, y, w, h, ratio);
  }

  private burst(x: number, y: number, count: number, color: string, speed: number) {
    const maxParticles = this.options.effects > 0.65 ? 520 : 260;
    const safeCount = Math.min(90, Math.max(0, Math.floor(count)), Math.max(0, maxParticles - this.particles.length));
    for (let i = 0; i < safeCount; i += 1) {
      const angle = this.effectRandom() * Math.PI * 2;
      const velocity = speed * (0.25 + this.effectRandom() * 0.75);
      const life = 0.25 + this.effectRandom() * 0.45;
      const particle = this.particlePool.acquire();
      Object.assign(particle, {
        id: this.nextId(),
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life,
        maxLife: life,
        size: 2 + this.effectRandom() * 5,
        color,
      });
      this.particles.push(particle);
    }
  }

  private playHit(tier: 'light' | 'heavy' | 'critical') {
    if (this.soundCooldown > 0) return;
    const cue = impactCue(tier, this.effectRandom());
    this.soundCooldown = cue.cooldown;
    this.playTone(cue.frequency, cue.duration, cue.oscillator, cue.gain);
  }

  private playTone(frequency: number, duration: number, type: OscillatorType, gainScale = 1) {
    if (this.disposed || this.options.volume <= 0.001) return;
    this.ensureAudio();
    if (!this.audio) return;
    const osc = this.audio.createOscillator();
    const gain = this.audio.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(toneGain(this.options.volume, gainScale), this.audio.currentTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audio.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.audio.destination);
    osc.addEventListener('ended', () => {
      osc.disconnect();
      gain.disconnect();
    }, { once: true });
    osc.start();
    osc.stop(this.audio.currentTime + duration + 0.01);
  }

  private ensureAudio() {
    if (this.disposed) return;
    if (!this.audio) {
      try {
        this.audio = new AudioContext();
      } catch {
        this.audio = undefined;
      }
    }
    if (this.audio?.state === 'suspended') void this.audio.resume().catch(() => undefined);
  }

  private nextId() {
    this.idSeed += 1;
    return this.idSeed;
  }
}
