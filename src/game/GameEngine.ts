import {
  FIXED_TIMESTEP,
  collectSegmentHits,
  consumeHitStopStep,
  createHitStopBudget,
  createSeededRandom,
  grantHitStop,
  tickHitStopBudget,
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
import { CAMPAIGN_CHAPTER_COUNT, FINAL_CHAPTER, FINAL_STAGE, STAGES_PER_CHAPTER, stageKind, type StageKind } from '../content/campaign';
import {
  CLASSIC_AWAKENING_TEXT,
  SKILL_AWAKENING_TEXT,
  SKILL_NUMBERS,
  frostLineSlow,
  mirrorCloneVolley,
  needleCount,
  scaleAt,
  skillLevelText,
} from './skillNumbers';
import { text, type StringKey, type Text } from '../i18n/text';
import { REMASTER_RULES, ruleSetFor, type RuleSet, type RuleSetId } from './rules';
import { EncounterDirector, type SpawnEdge } from './encounterDirector';
import { StageObjective, bonusGold, type BonusState, type ObjectiveId, type ObjectiveMark } from './stageObjective';
import { CHECK_CONTENT_AT_LOAD } from '../content/checks';
import CATALOG from '../content/data/catalog';
import { CHARGER, STALKER_FLOCK, SeparationGrid, WARDEN_SHIELD, enemyRole, flockSteer, leadAim, shieldCovers, turnToward } from './enemyBehaviors';
import { LOGICAL_VIEW, SPAWN_MARGIN, classicViewFrame, logicalViewFrame, spawnFrameOrigin, type ViewFrame } from './viewPolicy';
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
import {
  PICKUP_HARD_CAP,
  mergePickupValue,
  pickupSoftTtl,
  pickupTtl,
  selectPickupMergeTarget,
} from './pickupLifecycle';
import { WorldRenderer, type RenderWorld } from './render/worldRenderer';
import type { SpriteAtlas } from './render/assets/spriteAtlas';
import {
  bossPhaseForHealth,
  classifyImpact,
} from './visualContracts';
import {
  circleRectPush,
  clamp,
  distance,
  distancePointToSegment,
  normalize,
} from './worldMath';
import type {
  GameOptions,
  MetaState,
  MetaUpgradeId,
  PaceMode,
  PassiveId,
} from '../platform/save';
import { DEVELOPER_UI_AVAILABLE } from '../platform/developerAccess';
import type { EngineAction, EngineCommand } from './engine/contracts';
import type { GameEvent, GameEventListener, PlayerDamageSource } from './engine/events';
import { Presentation } from './presentation/presentation';
import { ViewCamera } from './presentation/viewCamera';
import { OBSTACLE_CATALOGUE } from './obstacleCatalogue';
import type { SoundOutput } from './audioPolicy';
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

import type {
  ArmedPattern,
  DashStep,
  BeamEffect,
  BossDef,
  BossPattern,
  BossProjectile,
  ChainEffect,
  DamageNumber,
  EffectOwner,
  EnemyTier,
  Entity,
  Hazard,
  ImpactRing,
  LaneTelegraph,
  Obstacle,
  Particle,
  PendingHostileShot,
  Pickup,
  Projectile,
  SkillId,
  SkillState,
} from './engine/worldTypes';

// World types live in engine/worldTypes.ts so renderers and presentation need not import the engine (TEC-02).
export type {
  BeamEffect,
  BossDef,
  BossPattern,
  BossProjectile,
  ChainEffect,
  DamageNumber,
  EffectOwner,
  EnemyTier,
  Entity,
  Hazard,
  ImpactRing,
  LaneTelegraph,
  Obstacle,
  Particle,
  PendingHostileShot,
  Pickup,
  Projectile,
  SkillId,
  SkillState,
} from './engine/worldTypes';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type { StageKind };
export type RunMode = 'campaign' | 'infinite';
export type DraftReason = 'level' | 'boss';

export type RunUpgradeId = 'attack' | 'maxHp' | 'moveSpeed' | 'attackSpeed' | 'magnet';

export type StatBlock = {
  attack: number;
  defense: number;
  maxHp: number;
  moveSpeed: number;
  critChance: number;
  critDamage: number;
  bossDamage: number;
  attackSpeed: number;
  hpRegen: number;
  magnet: number;
  coinGain: number;
};

/** Draft card chips (UI-03); each shows as the string tag.<id>. */
export type SkillTag =
  | 'projectile' | 'single' | 'fan' | 'chain' | 'instant' | 'line' | 'slow' | 'melee' | 'sustained' | 'area'
  | 'explosive' | 'pierce' | 'clone' | 'zone' | 'pull' | 'gravity' | 'crowdControl' | 'defense' | 'health'
  | 'pickup' | 'coin' | 'invulnerable' | 'recovery' | 'magnet' | 'attackSpeed' | 'crit' | 'boss';

/** A skill's rules. Its name and summary are the strings skill.<id> and skill.<id>.summary (UI-10). */
export type SkillDef = {
  id: SkillId;
  rarity: Rarity;
  active: boolean;
  chapterMin: number;
  /** Draft card chips after the active or passive chip (UI-03). */
  tags: readonly SkillTag[];
};

export type SkillOffer =
  | {
      kind: 'skill' | 'awakening';
      skillId: SkillId;
      rarity: Rarity;
      title: Text;
      body: Text;
      levelLine: Text;
      /** The skill's level before the pick: 0 for a new skill. */
      level: number;
    }
  | {
      kind: 'bonus';
      bonus: 'heal' | 'coins' | 'overdrive';
      rarity: Rarity;
      title: Text;
      body: Text;
      levelLine: Text;
    };

/** A draft card as presented; offerId ("<draft id>:<slot>") lets a command log pick it (TEC-07). */
export type DraftCard = SkillOffer & { offerId: string };

export type DraftState = {
  id: number;
  title: Text;
  reason: DraftReason;
  after: 'resume' | 'roundClear';
  cards: DraftCard[];
};

export type StageProgress = {
  chapter: number;
  stage: number;
};

export type ActiveStatusEffect = {
  id: string;
  kind: 'buff' | 'debuff';
  label: StringKey;
  value?: string;
  remaining?: number;
};

export type HudSnapshot = {
  runMode: RunMode;
  seed: number;
  chapter: number;
  stage: number;
  stageKind: StageKind;
  objective: Text;
  objectiveProgress: number;
  objectiveTarget: number;
  /** CON-03: the stage's bonus goal and how far along it is; null when the stage has none. */
  bonus: BonusState | null;
  /** CON-03: the landmark of a landmark stage (St3, St7), for its name card. */
  landmark: string | null;
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
  practice: boolean;
  /** The boss the HUD shows (UI-02): its name, id (the portrait key), phase, and enrage steps taken (0 while calm). */
  bossName?: StringKey;
  bossId?: string;
  bossPhase?: number;
  bossEnrage?: number;
  /** Enrage steps in all: 4 under stepped enrage (SYS-04), 1 under classic rules. */
  bossEnrageSteps?: number;
  bossMove?: string;
  /** SYS-04: the name of the boss's current phase move, shown under the boss bar. */
  bossMoveName?: StringKey;
  bossHp?: number;
  bossMaxHp?: number;
  skills: Partial<Record<SkillId, SkillState>>;
  /**
   * The share (0-1) of each active skill's current cooldown still to run, for the HUD slots (UI-02). Cooldowns
   * under half a second read 0: at the HUD's 8 Hz they would only flicker.
   */
  cooldowns: Partial<Record<SkillId, number>>;
  runUpgrades: Record<RunUpgradeId, number>;
  stats: StatBlock;
  activeEffects: ActiveStatusEffect[];
};

export type Settlement = {
  runMode: RunMode;
  seed: number;
  chapter: number;
  stage: number;
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
  /** A practice-pace run: no unlock, reduced rewards (CON-02). */
  practice: boolean;
  /** Simulated seconds the stage lasted (campaign records, TEC-08). */
  clearSeconds: number;
  /** UI-05: the player's level when the run ended. */
  level: number;
  /** UI-05: health the player lost over the run (hits and burns, after defence). */
  damageTaken: number;
  /** UI-05: the parts the gold is made of, in settlement order, after the practice scale; they sum to `gold` before its floor. */
  goldParts: Readonly<{ base: number; boss: number; kills: number; coins: number; stage: number; bonus: number }>;
  /** CON-03: the stage's bonus goal and whether the run met it (only a clear can). */
  bonus: Readonly<{ goal: Text; met: boolean }> | null;
  /** UI-05: health each skill took off enemies. A presentation tally: the simulation never reads it. */
  damageBySkill: Readonly<Partial<Record<SkillId, number>>>;
};

export type EngineCallbacks = {
  onSnapshot: (snapshot: HudSnapshot) => void;
  onDraft: (draft: DraftState) => void;
  onRoundClear: (settlement: Settlement) => void;
  onGameOver: (settlement: Settlement) => void;
  /** Called at the start of every animation frame, before simulation; input adapters poll gamepads here. */
  onFrameStart?: () => void;
  /**
   * Called when a frame throws (TEC-14). The loop has stopped and the run is paused; recoverFromFault()
   * restarts the loop, still paused.
   */
  onFault?: (error: unknown) => void;
};

/** A chapter. Its name, subtitle, and difficulty are the strings chapter.<id>, chapter.subtitle, and chapter.<id>.difficulty. */
export type StageDef = {
  id: number;
  encounterGrammarId: string;
  stages: Array<{
    id: number;
    kind: StageKind;
    objective: Text;
  }>;
};

export const WORLD_W = 4200;
export const WORLD_H = 3000;
const WORLD_SIZE = Object.freeze({ width: WORLD_W, height: WORLD_H });
const BOSS_PROJECTILE_HARD_CAP = 320;
/** Telegraphed boss dash (BUG-10): windup, straight-line travel time, and speed multiple. */
const DASH_WINDUP_SECONDS = 0.62;
const DASH_TRAVEL_SECONDS = 0.55;
const DASH_SPEED_MULTIPLE = 4.2;
/** Eclipse wall (BUG-11): lead time between the edge telegraph and the shots, shot speed, and lane spacing. */
const ECLIPSE_WALL_LEAD_SECONDS = 0.6;
const ECLIPSE_WALL_SPEED = 260;
const ECLIPSE_WALL_LANE_GAP = 115;
/** Fair terrain (BUG-13): a root zone binds once on entry, then cannot bind again for a while. */
const ROOT_BIND_SECONDS = 0.65;
const ROOT_IMMUNITY_SECONDS = ROOT_BIND_SECONDS + 1.5;
/** SYS-04: the phase-move attack grammars the engine runs (the others only speed the base pattern up). */
const IMPLEMENTED_GRAMMARS: ReadonlySet<string> = new Set([
  'tracked-dash-pair', 'crossing-dash-triple', 'alternating-ring-gap', 'contracting-ring-walls',
  // SYS-05: the Ch2-5 final bosses (the ones with kit art); the Ch2-5 mid bosses wait for theirs.
  'sequenced-fire-lanes', 'radial-flame-collapse', 'staggered-root-grid', 'closing-trap-cell',
  'counter-rotating-saws', 'cross-screen-saw-drop', 'paired-null-zones', 'contracting-safe-void',
]);
/** SYS-05 grammar geometry, in world units and seconds. */
const FIRE_LANES = Object.freeze({ gap: 220, length: 600, patches: 7, radius: 50, step: 0.3, life: 2.6 });
const FLAME_COLLAPSE = Object.freeze({ radius: 230, spots: 8, patch: 68, life: 3, warp: 430, core: 150, coreDelay: 0.9 });
const ROOT_GRID = Object.freeze({ spacing: 170, radius: 52, stagger: 0.6, life: 5 });
const TRAP_CELL = Object.freeze({ outer: 220, inner: 120, spacing: 110, radius: 50, close: 0.9, life: 5.5 });
const SAW_ORBITS = Object.freeze([{ radius: 130, saws: 3, spin: 1.7 }, { radius: 230, saws: 4, spin: -1.3 }]);
const SAW_ORBIT_LIFE = 3.4;
const SAW_DROP = Object.freeze({ lanes: 5, gap: 150, speed: 300 });
const NULL_PAIR = Object.freeze({ offset: 190, radius: 120, life: 5 });
const SAFE_VOID = Object.freeze({ wall: 470, void: 140, shots: 28, speed: 170, warp: 560 });
/** SYS-04 crossing-dash-triple: the cross lanes aim this far beside the player, with this pause between dashes. */
const CROSSCUT = Object.freeze({ offset: 110, pauseSeconds: 0.24 });
/** SYS-04 ring grammars: shots left out of a gapped ring, and the contracting wall. */
const RING_GAP_SHOTS = 5;
const RING_WALL = Object.freeze({ radius: 460, speed: 140, shots: 28, gateShots: 4 });
/**
 * SYS-04: whether shot `index` of an evenly spaced ring of `count` (rotated by `offset`) is one of the `width`
 * shots left out around the gap direction. Counted in whole shots, so a gap always removes exactly `width`.
 */
function inGap(index: number, count: number, gap: number, offset: number, width: number) {
  const step = (Math.PI * 2) / count;
  const center = Math.round((gap - offset) / step);
  const from = -Math.floor((width - 1) / 2);
  const relative = ((((index - center) % count) + count) % count);
  const signed = relative > count / 2 ? relative - count : relative;
  return signed >= from && signed < from + width;
}
/** SYS-05 closing-trap-cell: the four sides of a cell as outward directions (east, south, west, north). */
const CELL_SIDES: readonly (readonly [number, number])[] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
/**
 * The binding spots on a square of half-size `half` around (x, y), about `spacing` apart, with the side `gap` left
 * open. Spots sit half a step in from the corners: neighbouring circles still close the corners, and the open side
 * stays open end to end.
 */
function trapCell(x: number, y: number, half: number, spacing: number, gap: number) {
  const points: Array<{ x: number; y: number }> = [];
  const steps = Math.max(1, Math.round((half * 2) / spacing));
  CELL_SIDES.forEach(([sx, sy], side) => {
    if (side === gap) return;
    for (let step = 0; step < steps; step += 1) {
      const along = -half + ((step + 0.5) * half * 2) / steps;
      points.push({ x: x + sx * half - sy * along, y: y + sy * half + sx * along });
    }
  });
  return points;
}
/** SYS-04 anchor movement: how far an anchoring boss strays from its spot. */
const ANCHOR_RADIUS = 60;
/** SYS-05 fix: an anchoring boss holds its spot only while the player is this close (about the view's reach). */
const ANCHOR_LEASH = 720;
/** Bosses enter this far from the player; under bossSpacing never closer than the minimum (SYS-04). */
const BOSS_SPAWN_DISTANCE = 620;
const BOSS_MIN_SPAWN_DISTANCE = 420;
/** SYS-04: the speed a boss recoils at after a contact hit. */
const BOSS_CONTACT_RECOIL = 260;
/** SYS-04: enrage climbs one of four steps every 30 s of stage clock; its silence zone warns for 0.8 s. */
/** At or under this share of health the player gets the low-health heartbeat and vignette (FX-03). */
export const LOW_HEALTH_RATIO = 0.3;
const ENRAGE_STEPS = 4;
/** FX-02: global hit-stop lengths for the rare events that keep it under rareHitStop rules (rail: 0.045 s). */
const RARE_HIT_STOP = Object.freeze({ bossKill: 0.09, awakening: 0.06 });
/** A max-health upgrade bought while paused heals over this long after the run resumes (UI-04, G6). */
export const PAUSED_HEAL_SECONDS = 3;
const ENRAGE_STEP_SECONDS = 30;
const ENRAGE_ZONE_WARNING_SECONDS = 0.8;
/** SYS-04: how long each boss pattern is telegraphed before it fires (V3 timings: shots 0.44 s, shock 0.52 s). */
const PATTERN_LEAD_SECONDS: Partial<Record<BossPattern, number>> = {
  rings: 0.44,
  clock: 0.44,
  saw: 0.44,
  clones: 0.5,
  flame: 0.44,
  null: 0.44,
  tide: 0.5,
  traps: 0.5,
};
/** SYS-06 A/B: terrain acts on enemies at this share of its strength on the player. */
const TERRAIN_ENEMY_SCALE = 0.5;
/** SYS-04: a boss volley waits while it would push the shot count over this. */
const VOLLEY_SOFT_CAP = 300;
/** SYS-04: shots pushed over the hard cap fade out over this long, harmless. */
const SHOT_FADE_SECONDS = 0.3;
const SAW_SPEED = 250;
const SAW_LIFE = 3.6;
/** Boss-made terrain kinds the encounter director budgets (SYS-03). */
const DYNAMIC_TERRAIN: ReadonlySet<Hazard['kind']> = new Set(['fire', 'slow', 'root', 'null']);
const NO_MARKS: readonly ObjectiveMark[] = [];
/** CON-03: the ground the terrain goal counts time in. */
const TERRAIN_KINDS: ReadonlySet<Hazard['kind']> = new Set(['water', 'slow', 'trap', 'root', 'fire', 'null']);
/** SYS-11: after silence ends, ready skills fire one at a time this far apart instead of all at once. */
const SILENCE_RELEASE_STAGGER_SECONDS = 0.1;

// SYS-01 auto-aim: three straight misses push a target to the back of the queue for four seconds.
const AIM_MISS_LIMIT = 3;
const AIM_MISS_MEMORY_SECONDS = 4;
const AIM_MAX_LEAD_SECONDS = 1.2;

/** Nothing harmful is generated within this distance of the stage start (the world centre). */
const START_SAFE_RADIUS = 420;

/** Draft weights per rarity; each shows as the string rarity.<id>. */
export const RARITY: Record<Rarity, { weight: number; className: string }> = {
  common: { weight: RARITY_WEIGHTS.common, className: 'rarityCommon' },
  rare: { weight: RARITY_WEIGHTS.rare, className: 'rarityRare' },
  epic: { weight: RARITY_WEIGHTS.epic, className: 'rarityEpic' },
  legendary: { weight: RARITY_WEIGHTS.legendary, className: 'rarityLegendary' },
  mythic: { weight: RARITY_WEIGHTS.mythic, className: 'rarityMythic' },
};

export const BASE_STATS: StatBlock = CATALOG.baseStats;

export const SKILLS: Record<SkillId, SkillDef> = CATALOG.skills;

export const SKILL_IDS = Object.keys(SKILLS) as SkillId[];

/** Permanent upgrades; each shows as the strings upgrade.<id> and upgrade.<id>.line. */
export const META_UPGRADES: Record<MetaUpgradeId, { max: number; baseCost: number; growth: number }> = CATALOG.metaUpgrades;

/** Account-level passives; each shows as the strings passive.<id> and passive.<id>.line. */
export const META_PASSIVES: Record<PassiveId, { max: number }> = CATALOG.metaPassives;

/** Run shop upgrades; each shows as the string runUpgrade.<id>, and `line` is the gain per level. */
export const RUN_UPGRADES: Record<RunUpgradeId, { baseCost: number; line: string }> = CATALOG.runUpgrades;

export const CHAPTER_COUNT = CAMPAIGN_CHAPTER_COUNT;
export { STAGES_PER_CHAPTER };
export const TOTAL_STAGE_COUNT = CHAPTER_COUNT * STAGES_PER_CHAPTER;

/** Survival stage goals, in rotation; each shows as the string objective.<id>. */
export const OBJECTIVE_POOL = ['swarm', 'holdLine', 'traps', 'elites', 'salvage', 'giants', 'crossfire', 'vanguard'] as const;

export { stageKind };

/** The survival objective of a normal stage, in rotation. */
export function objectiveIdFor(chapter: number, stageNo: number): ObjectiveId {
  return OBJECTIVE_POOL[(stageNo + chapter - 2) % OBJECTIVE_POOL.length];
}

export function objectiveFor(chapter: number, stageNo: number): Text {
  const kind = stageKind(stageNo);
  if (kind === 'midBoss') return text('objective.midBoss', { chapter });
  if (kind === 'finalBoss') return text('objective.finalBoss', { chapter });
  return text('objective.survive', { goal: text(`objective.${objectiveIdFor(chapter, stageNo)}`) });
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

export const CHAPTERS: StageDef[] = CHAPTER_ENCOUNTER_GRAMMARS.map((grammar, index) => {
  const chapter = index + 1;
  return {
    id: chapter,
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

export const FIELD_BOSSES: BossDef[] = CATALOG.fieldBosses;

export const BOSS_ROUND_BOSSES: BossDef[] = CATALOG.roundBosses;

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
  })),
});

if (CHECK_CONTENT_AT_LOAD) {
  const encounterReferenceIssues = validateEncounterGrammarReferences(GAME_CONTENT_CATALOG.chapters, CHAPTER_ENCOUNTER_GRAMMARS);
  if (encounterReferenceIssues.length > 0) {
    throw new Error(`Encounter content references are invalid:\n- ${encounterReferenceIssues.join('\n- ')}`);
  }
  assertBossPhaseMoveSets(BOSS_PHASE_MOVE_SETS, GAME_CONTENT_CATALOG.bosses);
}

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

/** Stage lengths in seconds. Boss stages end when the boss dies; their timer is the enrage timer (G7). */
export const STAGE_PACING = Object.freeze({
  classic: { normal: 720, boss: 1020 },
  standard: { normal: 480, boss: 600, firstStage: 300 },
  practice: { normal: 150 },
  showcase: { normal: 90, boss: 135 },
});
/** Practice runs never unlock stages and pay this share of gold and XP, so short stages are not a farm. */
export const PRACTICE_REWARD_SCALE = 0.3;

export function stageDuration(
  kind: StageKind,
  paceMode: PaceMode,
  { chapter = 1, stage = 1, pacing = true }: { chapter?: number; stage?: number; pacing?: boolean } = {},
) {
  // Showcase pacing is a developer tool; shipped builds always use standard stage lengths (BUG-17).
  if (paceMode === 'showcase' && DEVELOPER_UI_AVAILABLE) return kind === 'normal' ? STAGE_PACING.showcase.normal : STAGE_PACING.showcase.boss;
  if (!pacing) return kind === 'normal' ? STAGE_PACING.classic.normal : STAGE_PACING.classic.boss;
  if (kind !== 'normal') return STAGE_PACING.standard.boss;
  if (paceMode === 'practice') return STAGE_PACING.practice.normal;
  // Ch1-St1 is the tutorial length (CON-02).
  return chapter === 1 && stage === 1 ? STAGE_PACING.standard.firstStage : STAGE_PACING.standard.normal;
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
    stats.defense += scaleAt(SKILL_NUMBERS.ironFrame.defense, ironFrame.level, ironFrame.awakened);
    stats.maxHp += scaleAt(SKILL_NUMBERS.ironFrame.maxHp, ironFrame.level, ironFrame.awakened);
  }

  const recoveryThread = skills.recoveryThread;
  if (recoveryThread) {
    stats.hpRegen += scaleAt(SKILL_NUMBERS.recoveryThread.regen, recoveryThread.level, recoveryThread.awakened);
    stats.magnet += scaleAt(SKILL_NUMBERS.recoveryThread.magnet, recoveryThread.level, recoveryThread.awakened);
  }

  const magnetSigil = skills.magnetSigil;
  if (magnetSigil) {
    stats.magnet += scaleAt(SKILL_NUMBERS.magnetSigil.magnet, magnetSigil.level, magnetSigil.awakened);
    stats.coinGain += scaleAt(SKILL_NUMBERS.magnetSigil.coinGain, magnetSigil.level, magnetSigil.awakened);
  }

  const paperWard = skills.paperWard;
  if (paperWard) {
    stats.defense += scaleAt(SKILL_NUMBERS.paperWard.defense, paperWard.level, paperWard.awakened);
  }

  const coinFever = skills.coinFever;
  if (coinFever) {
    stats.coinGain += scaleAt(SKILL_NUMBERS.coinFever.coinGain, coinFever.level);
    stats.attackSpeed *= 1 + scaleAt(SKILL_NUMBERS.coinFever.attackSpeed, coinFever.level);
  }

  const executionMark = skills.executionMark;
  if (executionMark) {
    stats.critChance += scaleAt(SKILL_NUMBERS.executionMark.critChance, executionMark.level, executionMark.awakened);
    stats.bossDamage += scaleAt(SKILL_NUMBERS.executionMark.bossDamage, executionMark.level, executionMark.awakened);
  }

  stats.critChance = clamp(stats.critChance, 0, 0.72);
  return stats;
}

// Members are protected rather than private so the test-only ProbedGameEngine (engine/probe.ts) can set up
// and read worlds through a typed API; the app never imports it, so production bundles do not ship it (TEC-07).
export class GameEngine {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected worldRenderer = new WorldRenderer();
  protected callbacks: EngineCallbacks;

  protected meta: MetaState;
  protected options: GameOptions;
  protected rules: RuleSet = REMASTER_RULES;
  protected raf = 0;
  protected lastTime = 0;
  protected accumulator = 0;
  protected running = false;
  protected paused = false;
  protected disposed = false;
  protected dpr = 1;
  protected viewW = 1280;
  protected viewH = 720;
  protected idSeed = 1;
  /** Ids for particles and damage numbers; kept apart from gameplay ids so cosmetics never shift outcomes (BUG-08). */
  protected cosmeticIdSeed = 1;
  protected runSeed = 1;
  protected gameplayRandom = createSeededRandom(1);
  protected resizeObserver?: ResizeObserver;

  protected chapter = 1;
  protected stage = 1;
  protected runMode: RunMode = 'campaign';
  protected kind: StageKind = 'normal';
  protected duration = 0;
  protected timeLeft = 0;
  protected timeScale = 1;
  protected spawnBudget = 0;
  protected fieldBossMarks = new Set<number>();
  /** CON-03: the normal stage's objective, under the stageObjectives rule. */
  protected stageObjective: StageObjective | null = null;
  protected stageFinished = false;
  protected rewardLock = false;
  protected bossEnraged = false;
  /** SYS-04: enrage step (1-4) and seconds since the boss stage clock ran out. */
  protected enrageStep = 0;
  /** Whether the last step reported low health; a new round reports it again (FX-03). */
  protected lowHealth = false;
  protected enrageSeconds = 0;
  /** SYS-04: a silence zone waiting behind its warning during enrage. */
  protected pendingEnrageZone: { x: number; y: number; at: number } | null = null;
  protected stageKills = 0;
  protected stageCoinsEarned = 0;
  /** UI-05 settlement tallies, per stage; presentation only, the simulation never reads them. */
  protected damageTakenTotal = 0;
  protected damageBySkill: Partial<Record<SkillId, number>> = {};
  protected infiniteEventScore = 0;
  protected infiniteBossKills = 0;
  protected infiniteBossRespawnTimer = 0;
  protected previousInfiniteBossId = '';
  protected scoreEligible = true;
  protected draftQueue: Array<{ reason: DraftReason; after: DraftState['after'] }> = [];
  protected activeDraftId: number | null = null;
  protected activeDraftAfter: DraftState['after'] | null = null;
  protected activeDraftCards: DraftCard[] = [];
  protected pendingRoundClear = false;
  protected objective: Text = text('objective.infinite');
  protected objectiveTarget = 0;
  protected cheatGodMode = false;
  /** This round runs at practice pace: no unlock and reduced rewards (CON-02). */
  protected practiceRun = false;
  /** SYS-11: casts are being released one by one after silence, with this much time left until the next. */
  protected releaseStagger = false;
  protected castGap = 0;
  /** The last thing that hurt the player, reported when the run is lost (CON-09). */
  protected lastDamageSource: PlayerDamageSource | 'unknown' = 'unknown';
  /** SYS-02 scratch space, reused every step. */
  protected readonly flockScratch: Entity[] = [];
  protected readonly separationGrid = new SeparationGrid({ minX: -120, minY: -120, maxX: WORLD_W + 120, maxY: WORLD_H + 120 });
  /** SYS-03: the encounter director of the current normal stage, or null (classic rules, boss stages, infinite). */
  protected director: EncounterDirector | null = null;
  /** The player's last movement direction; front and flank formations spawn relative to it (SYS-03). */
  protected playerHeading = { x: 1, y: 0 };
  /** Backing-store scale cap (TEC-04); 2 keeps the full device resolution up to DPR 2. */
  protected renderScale = 2;
  /** A frame threw and the loop stopped (TEC-14). */
  protected faulted = false;
  /** Developer cheat FAULT: the next frame throws, to exercise the fault path. */
  protected faultInjection = false;
  /** Set only by probes: stops the stage director from adding enemies so a test controls the whole world. */
  protected spawnsHalted = false;
  protected snapshotTimer = 0;
  /** HUD only (UI-02): each cooldown's length, taken when a cooldown is seen to start, and its last reading. */
  protected hudCooldownSpans: Partial<Record<SkillId, number>> = {};
  protected hudCooldownLast: Partial<Record<SkillId, number>> = {};
  protected hitStop = 0;
  protected hitStopBudget = createHitStopBudget();
  protected elapsed = 0;
  protected coinFeverRushTimer = 0;

  protected camera = { x: 0, y: 0, prevX: 0, prevY: 0 };
  /** What the screen shows under smoothCamera rules (FX-04); the simulation keeps `camera` for its own checks. */
  protected viewCamera = new ViewCamera();
  // Input arrives only as engine commands (TEC-07); adapters own keyboard, pointer, and gamepad devices.
  protected heldActions = new Set<EngineAction>();
  protected pointer = { active: false, x: 0, y: 0 };
  protected analogMove = { x: 0, y: 0, active: false };
  protected pendingAwakenings: SkillId[] = [];

  protected player = {
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
    rootImmunity: 0,
    stats: { ...BASE_STATS },
  };

  protected skills: Partial<Record<SkillId, SkillState>> = {};
  protected runUpgrades = makeRunUpgrades();
  protected skillCooldowns: Partial<Record<SkillId, number>> = {};
  protected enemies: Entity[] = [];
  protected projectiles: Projectile[] = [];
  protected bossProjectiles: BossProjectile[] = [];
  protected pickups: Pickup[] = [];
  protected hazards: Hazard[] = [];
  protected obstacles: Obstacle[] = [];
  protected beams: BeamEffect[] = [];
  protected laneTelegraphs: LaneTelegraph[] = [];
  protected pendingHostileShots: PendingHostileShot[] = [];
  /** SYS-05: boss-made terrain that appears on a schedule (sequenced lanes, closing cells). */
  protected pendingHazards: Array<{ at: number; hazard: Omit<Hazard, 'id'> }> = [];
  protected chains: ChainEffect[] = [];
  protected enemyIndex = new SpatialIndex<Entity>(96);
  protected deadEnemyScratch: Entity[] = [];
  protected projectilePool = new ObjectPool<Projectile>(
    () => ({ id: 0, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, radius: 0, damage: 0, life: 0, maxLife: 0, returning: false, pierce: 0, knockback: 0, skillId: 'needleStorm', blockedBySolid: false, hitEnemyIds: new Set(), aimTargetId: -1 }),
    (projectile) => { projectile.life = 0; projectile.hitEnemyIds.clear(); },
    384,
  );
  protected bossProjectilePool = new ObjectPool<BossProjectile>(
    () => ({ id: 0, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, radius: 0, damage: 0, life: 0, kind: 'ring' }),
    (projectile) => { projectile.life = 0; },
    320,
  );
  protected pickupPool = new ObjectPool<Pickup>(
    () => ({ id: 0, x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, radius: 0, kind: 'xp', value: 0, life: 0, maxLife: 0 }),
    (pickup) => { pickup.value = 0; pickup.life = 0; },
    PICKUP_HARD_CAP,
  );
  /** Cosmetic state (particles, damage numbers, rings, shake, sound) lives here and only consumes events (TEC-02). */
  protected presentation = new Presentation({ nextId: () => this.nextCosmeticId(), options: () => this.options, pan: (x) => this.screenPan(x), chapter: () => this.chapter });
  protected eventListeners = new Set<GameEventListener>();
  protected playerAimAngle = -Math.PI / 2;
  protected aimTargetId: number | null = null;
  protected systemReducedMotion = false;
  /** Health still owed by a max-health upgrade bought while paused, and the rate it comes back at (G6). */
  protected pausedHeal = 0;
  protected pausedHealRate = 0;

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
    this.onResize = this.onResize.bind(this);
    this.tick = this.tick.bind(this);
    window.addEventListener('resize', this.onResize);
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
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.worldRenderer.invalidateGrid();
    this.releaseInput();
    this.presentation.dispose();
  }

  /** Baked character art for the renderer (TEC-03); without it every visual draws with vectors. */
  setSprites(atlas: SpriteAtlas | null) {
    this.worldRenderer.setSprites(atlas);
  }

  /** The app's mixer (AUD-01): it outlives the engine, which only sends it cues. */
  setSound(sound: SoundOutput | null) {
    this.presentation.setSound(sound);
  }

  /** The operating system's reduced-motion preference; the app shell watches it and passes it in. */
  setSystemReducedMotion(reduced: boolean) {
    this.systemReducedMotion = reduced;
    if (reduced) this.presentation.shake = 0;
  }

  setOptions(options: GameOptions) {
    this.options = options;
    if (options.reducedMotion) this.presentation.shake = 0;
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

  protected startConfiguredRun(chapter: number, stageNo: number, seed: number | undefined, scoreEligible: boolean) {
    this.presentation.unlockSound();
    const randomSeed = seed ?? globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
    this.runSeed = randomSeed || 1;
    if (this.rules.isolatedCosmeticIds) {
      this.idSeed = 1;
      this.cosmeticIdSeed = 1;
    }
    this.gameplayRandom = createSeededRandom(this.runSeed);
    this.presentation.reseed(this.runSeed, !this.rules.isolatedCosmeticIds);
    this.hitStop = 0;
    this.hitStopBudget = createHitStopBudget();
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
    this.activeDraftCards = [];
    this.pendingRoundClear = false;
    this.stageKills = 0;
    this.stageCoinsEarned = 0;
    this.damageTakenTotal = 0;
    this.damageBySkill = {};
    this.infiniteEventScore = 0;
    this.infiniteBossKills = 0;
    this.infiniteBossRespawnTimer = 0;
    this.previousInfiniteBossId = '';
    this.scoreEligible = scoreEligible;
    this.coinFeverRushTimer = 0;
    this.pausedHeal = 0;
    this.pausedHealRate = 0;
    this.bossEnraged = false;
    this.enrageStep = 0;
    this.enrageSeconds = 0;
    this.pendingEnrageZone = null;
    this.lowHealth = false;
    this.cheatGodMode = false;
    this.lastDamageSource = 'unknown';
    this.releaseStagger = false;
    this.castGap = 0;
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
      rootImmunity: 0,
      stats: { ...BASE_STATS },
    };
    this.recalculateStats(true);
    this.player.hp = this.player.stats.maxHp;
    this.beginRound();
    this.running = true;
    this.paused = false;
    this.faulted = false;
    this.accumulator = 0;
    this.lastTime = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.tick);
  }

  resume() {
    if (this.faulted) return;
    this.paused = false;
    this.rewardLock = false;
    this.accumulator = 0;
    this.lastTime = performance.now();
  }

  /** After a fault, restarts the animation loop with the run paused so the player can get ready (TEC-14). */
  recoverFromFault() {
    if (!this.faulted || this.disposed || !this.running) return;
    this.faulted = false;
    this.paused = true;
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  get isFaulted() {
    return this.faulted;
  }

  pause() {
    this.paused = true;
    this.accumulator = 0;
  }

  /**
   * A max-health upgrade adds its health at once in play. Bought in the pause hub, it adds it over
   * PAUSED_HEAL_SECONDS once the run resumes, so pausing cannot be an instant heal in a tight spot (UI-04, G6).
   */
  buyRunUpgrade(id: RunUpgradeId) {
    const level = this.runUpgrades[id];
    const cost = runUpgradeCost(id, level);
    if (this.player.coins < cost) return false;
    this.player.coins -= cost;
    this.runUpgrades[id] += 1;
    const oldMax = this.player.stats.maxHp;
    this.recalculateStats(false);
    const gain = this.player.stats.maxHp - oldMax;
    if (gain > 0 && this.paused) {
      this.pausedHeal += gain;
      this.pausedHealRate = this.pausedHeal / PAUSED_HEAL_SECONDS;
    } else if (gain > 0) {
      this.player.hp += gain;
    }
    this.emit({ type: 'run/upgradeBought' });
    this.emitSnapshot(true);
    return true;
  }

  applyCheat(code: string) {
    if (!DEVELOPER_UI_AVAILABLE) return 'DISABLED';
    if (code === 'FAULT') {
      this.faultInjection = true;
      return 'LOOP FAULT ARMED';
    }
    if (['GOD', 'COIN', 'MAGNET', 'NUKE', 'DRAFT', 'CLEAR', 'KO'].includes(code)) {
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

    // FX-03: ends the run as a defeat on the next step, to check the death moment.
    if (code === 'KO') {
      this.cheatGodMode = false;
      this.player.shield = 0;
      this.player.hp = 0;
      return 'PLAYER DOWN';
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
    this.activeDraftCards = [];
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

  protected applyOffer(offer: SkillOffer) {
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
      this.emit({ type: 'draft/applied', kind: 'awakening', x: this.player.x, y: this.player.y });
      if (this.rules.rareHitStop) this.requestHitStop(RARE_HIT_STOP.awakening);
    } else {
      const nextLevel = clamp(state.level + 1, 1, MAX_SKILL_LEVEL);
      this.skills[offer.skillId] = { level: nextLevel, awakened: state.awakened };
      if (nextLevel >= 5 && !state.awakened && !this.pendingAwakenings.includes(offer.skillId)) {
        this.pendingAwakenings.push(offer.skillId);
      }
      this.emit({ type: 'draft/applied', kind: 'skill', x: this.player.x, y: this.player.y });
    }
    const oldMax = this.player.stats.maxHp;
    this.recalculateStats(false);
    if (this.player.stats.maxHp > oldMax) this.player.hp += (this.player.stats.maxHp - oldMax) * 0.7;
    this.rewardLock = false;
    this.emitSnapshot(true);
  }

  protected chooseBonusOffer(offer: Extract<SkillOffer, { kind: 'bonus' }>) {
    if (offer.bonus === 'heal') {
      this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + this.player.stats.maxHp * 0.5);
      this.emit({ type: 'draft/applied', kind: 'heal', x: this.player.x, y: this.player.y });
      return;
    }

    if (offer.bonus === 'coins') {
      const gained = 65 + this.chapter * 18 + this.stage * 9;
      this.player.coins += gained;
      this.stageCoinsEarned += gained;
      this.emit({ type: 'draft/applied', kind: 'coins', x: this.player.x, y: this.player.y });
      return;
    }

    this.runUpgrades.attack += 1;
    this.runUpgrades.attackSpeed += 1;
    this.recalculateStats(false);
    this.emit({ type: 'draft/applied', kind: 'overdrive', x: this.player.x, y: this.player.y });
  }

  /**
   * Caps the canvas resolution (TEC-04): the backing store uses min(devicePixelRatio, renderScale, 2) pixels per
   * CSS pixel. Game logic and layout work in CSS pixels, so only sharpness and fill cost change.
   */
  setRenderScale(scale: number) {
    const next = clamp(Number.isFinite(scale) ? scale : 2, 1, 2);
    if (next === this.renderScale) return;
    this.renderScale = next;
    this.onResize();
  }

  protected onResize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.max(1, Math.min(2, this.renderScale, window.devicePixelRatio || 1));
    this.viewW = Math.max(1, Math.floor(rect.width));
    this.viewH = Math.max(1, Math.floor(rect.height));
    this.canvas.width = Math.round(this.viewW * this.dpr);
    this.canvas.height = Math.round(this.viewH * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.worldRenderer.invalidateGrid();
  }

  /** Applies one engine command (TEC-07). Commands are the only way input reaches the simulation. */
  dispatch(command: EngineCommand) {
    switch (command.type) {
      case 'input/action':
        if (command.pressed) this.heldActions.add(command.action);
        else this.heldActions.delete(command.action);
        return;
      case 'input/pointer':
        this.pointer.active = command.active;
        this.pointer.x = command.worldX;
        this.pointer.y = command.worldY;
        return;
      case 'input/analog': {
        const x = Number.isFinite(command.x) ? clamp(command.x, -1, 1) : 0;
        const y = Number.isFinite(command.y) ? clamp(command.y, -1, 1) : 0;
        this.analogMove = { x, y, active: x !== 0 || y !== 0 };
        return;
      }
      case 'input/release':
        this.releaseInput();
        return;
      case 'draft/select':
        this.selectOffer(command.offerId);
        return;
      case 'control/pause':
        this.pause();
        return;
      case 'control/resume':
        this.resume();
        return;
    }
  }

  /** Maps a viewport point (CSS pixels) to world coordinates through the current view frame and camera. */
  screenToWorld(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const scaleX = this.viewW / rect.width;
    const scaleY = this.viewH / rect.height;
    const frame = this.viewFrame();
    return {
      x: ((clientX - rect.left) * scaleX - frame.offsetX) / frame.zoom + this.shownCamera().x,
      y: ((clientY - rect.top) * scaleY) / frame.zoom + this.shownCamera().y,
    };
  }

  protected selectOffer(offerId: string) {
    const card = this.activeDraftCards.find((candidate) => candidate.offerId === offerId);
    if (!card || this.activeDraftId === null) return 'ignored' as const;
    return this.completeDraft(card, this.activeDraftId);
  }

  protected releaseInput() {
    this.heldActions.clear();
    this.pointer.active = false;
    this.analogMove = { x: 0, y: 0, active: false };
  }

  protected tick(now: number) {
    if (!this.running || this.faulted) return;
    const frameDt = Math.min(0.05, Math.max(0, (now - this.lastTime) / 1000));
    this.lastTime = now;
    try {
      this.advanceFrame(frameDt, true);
    } catch (error) {
      // An exception used to stop the loop silently with enemies frozen mid-attack (TEC-14). Now the run
      // pauses, the loop stays stopped, and the app shows what happened.
      this.fault(error);
      return;
    }
    this.raf = requestAnimationFrame(this.tick);
  }

  protected fault(error: unknown) {
    this.faulted = true;
    this.paused = true;
    this.accumulator = 0;
    this.releaseInput();
    try {
      this.callbacks.onFault?.(error);
    } catch {
      // The app's own handler failed; the loop stays stopped and the error is not rethrown into rAF.
    }
  }

  advanceFrame(frameDt: number, renderFrame = true) {
    if (DEVELOPER_UI_AVAILABLE && this.faultInjection) {
      this.faultInjection = false;
      throw new Error('Injected loop fault (developer cheat FAULT)');
    }
    const safeFrameDt = Math.min(0.05, Math.max(0, frameDt));
    this.callbacks.onFrameStart?.();
    // Shake and sound spacing are presentation-only and follow wall-clock time, not hit-stop-scaled sim time.
    this.presentation.beginFrame(safeFrameDt, this.paused);
    this.snapshotTimer -= safeFrameDt;

    if (!this.paused) {
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
    this.presentation.endFrame(safeFrameDt, this.paused, !this.rules.isolatedCosmeticIds);
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
      particles: this.presentation.particles.length,
      damageNumbers: this.presentation.damageNumbers.length,
      gridCacheBuilds: this.worldRenderer.gridCacheBuilds,
      render: { ...this.worldRenderer.stats },
      pooled: {
        projectiles: this.projectilePool.retained,
        bossProjectiles: this.bossProjectilePool.retained,
        pickups: this.pickupPool.retained,
        particles: this.presentation.particlePool.retained,
        damageNumbers: this.presentation.damageNumberPool.retained,
      },
    };
  }

  protected beginRound() {
    this.releaseTransientObjects();
    this.kind = this.runMode === 'infinite' ? 'midBoss' : stageKind(this.stage);
    this.duration = this.runMode === 'infinite'
      ? 0
      : stageDuration(this.kind, this.options.paceMode, { chapter: this.chapter, stage: this.stage, pacing: this.rules.pacing });
    this.practiceRun = this.runMode === 'campaign' && this.rules.pacing && this.options.paceMode === 'practice';
    this.objective = this.runMode === 'infinite' ? text('objective.infinite') : objectiveFor(this.chapter, this.stage);
    this.objectiveTarget = this.runMode === 'infinite'
      ? 1
      : this.kind === 'normal'
        ? this.duration
        : 1;
    this.timeLeft = this.duration;
    this.spawnBudget = 0;
    this.fieldBossMarks.clear();
    // The director draws from its own stream so beat lengths never shift the gameplay rolls (SYS-03).
    this.director = this.rules.encounterDirector && this.runMode === 'campaign' && this.kind === 'normal'
      ? new EncounterDirector(encounterGrammarForChapter(this.chapter as ChapterId), this.duration, createSeededRandom(((this.runSeed ^ 0x5e03d1ec) >>> 0) || 1))
      : null;
    // CON-03: its placements draw from their own stream as well. The first stage teaches, so it keeps only the goal.
    this.stageObjective = this.rules.stageObjectives && this.runMode === 'campaign' && this.kind === 'normal'
      ? new StageObjective(
        objectiveIdFor(this.chapter, this.stage),
        this.chapter,
        createSeededRandom(((this.runSeed ^ 0x0b1ec7a5) >>> 0) || 1),
        !(this.chapter === 1 && this.stage === 1),
        !this.practiceRun,
      )
      : null;
    this.playerHeading = { x: 1, y: 0 };
    this.stageFinished = false;
    this.rewardLock = false;
    this.activeDraftId = null;
    this.activeDraftAfter = null;
    this.activeDraftCards = [];
    this.pendingRoundClear = false;
    this.bossEnraged = false;
    this.enrageStep = 0;
    this.enrageSeconds = 0;
    this.pendingEnrageZone = null;
    this.lowHealth = false;
    this.stageKills = 0;
    this.stageCoinsEarned = 0;
    this.damageTakenTotal = 0;
    this.damageBySkill = {};
    this.draftQueue = [];
    this.elapsed = 0;
    this.enemies = [];
    this.enemyIndex.clear();
    this.beams = [];
    this.laneTelegraphs = [];
    this.pendingHostileShots = [];
    this.pendingHazards = [];
    this.chains = [];
    this.presentation.clearRound();
    this.player.x = WORLD_W / 2;
    this.player.y = WORLD_H / 2;
    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;
    this.placeCamera();
    this.camera.prevX = this.camera.x;
    this.camera.prevY = this.camera.y;
    this.viewCamera.snap(this.camera.x, this.camera.y);
    this.player.root = 0;
    this.player.rootImmunity = 0;
    this.player.slow = 1;
    this.player.silence = 0;
    this.aimTargetId = null;
    this.generateMap();
    if (this.runMode === 'infinite') this.spawnInfiniteBoss();
    else if (this.kind !== 'normal') this.spawnBoss(this.kind, false);
    this.emitSnapshot(true);
  }

  protected releaseTransientObjects() {
    for (const projectile of this.projectiles) this.projectilePool.release(projectile);
    for (const projectile of this.bossProjectiles) this.bossProjectilePool.release(projectile);
    for (const pickup of this.pickups) this.pickupPool.release(pickup);
    this.projectiles.length = 0;
    this.bossProjectiles.length = 0;
    this.pickups.length = 0;
  }

  protected generateMap() {
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
      const kind = i % 4 === 0 ? 'pillar' : 'solid';
      const rollW = this.gameplayRandom();
      const rollH = this.gameplayRandom();
      // ART-05: the same two draws pick a kit module, so every other part of the map stays where it was.
      const modules = this.rules.kitProps ? OBSTACLE_CATALOGUE[this.chapter]?.[kind] : undefined;
      if (modules) {
        const variant = Math.min(modules.length - 1, Math.floor(rollW * modules.length));
        const [w, h] = modules[variant];
        this.obstacles.push({ id: this.nextId(), x, y, w, h, kind, art: `${kind}${variant}` });
      } else {
        this.obstacles.push({ id: this.nextId(), x, y, w: 90 + rollW * 220, h: 50 + rollH * 160, kind });
      }
    }

    const hazardCount = Math.round((8 + Math.floor(this.chapter * 2.4)) * (this.stageObjective?.terrainScale ?? 1));
    for (let i = 0; i < hazardCount; i += 1) {
      const authoredKind = grammar.hazards[i % grammar.hazards.length];
      const kind: Hazard['kind'] = authoredKind === 'null'
        ? 'slow'
        : authoredKind === 'root'
          ? 'trap'
          : authoredKind;
      const broad = kind === 'water' || kind === 'slow';
      let x = 220 + this.gameplayRandom() * (WORLD_W - 440);
      let y = 220 + this.gameplayRandom() * (WORLD_H - 440);
      const radius = broad ? 145 + this.gameplayRandom() * 125 : 60 + this.gameplayRandom() * 38;
      if (this.rules.fairTerrain) {
        // Hazards (fire, traps, slows) must not touch the start area either, like obstacles (BUG-13).
        for (let tries = 0; tries < 20 && Math.hypot(x - WORLD_W / 2, y - WORLD_H / 2) < START_SAFE_RADIUS + radius; tries += 1) {
          x = 220 + this.gameplayRandom() * (WORLD_W - 440);
          y = 220 + this.gameplayRandom() * (WORLD_H - 440);
        }
      }
      this.addStaticHazard(kind, x, y, radius);
    }
    if (landmark) this.addChapterLandmark(landmark.shape, landmark.obstacleDensity);
  }

  protected addChapterLandmark(shape: LandmarkShape, density: number) {
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

      const post = this.rules.kitProps ? OBSTACLE_CATALOGUE[this.chapter]?.landmark[0] : undefined;
      if (post) [width, height] = post;
      this.obstacles.push({
        id: this.nextId(),
        x: clamp(x - width / 2, 120, WORLD_W - width - 120),
        y: clamp(y - height / 2, 120, WORLD_H - height - 120),
        w: width,
        h: height,
        kind: index % 3 === 0 ? 'pillar' : 'solid',
        ...(post ? { art: 'landmark0' } : {}),
      });
    }
  }

  protected addStaticHazard(kind: Hazard['kind'], x: number, y: number, radius: number) {
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

  protected update(dt: number) {
    this.capturePreviousPositions();
    this.elapsed += dt;
    if (this.rules.hitStopBudget) this.hitStopBudget = tickHitStopBudget(this.hitStopBudget);
    // Budgeted rules count the stage clock in real steps so hit-stop never stretches a stage (BUG-07).
    const clockDelta = this.rules.hitStopBudget ? Math.max(dt, FIXED_TIMESTEP) : dt;
    if (this.runMode === 'campaign') this.timeLeft = Math.max(0, this.timeLeft - clockDelta);
    if (this.bossEnraged && this.rules.steppedEnrage) this.advanceEnrage(clockDelta);

    if (this.player.hp <= 0) {
      this.flushDeadEnemies(true);
      this.resolveRoundState();
      return;
    }
    this.flushDeadEnemies();
    if (this.endStepIfInterrupted()) return;
    this.updatePlayer(dt);
    if (this.endStepIfInterrupted()) return;
    this.stageObjective?.update(dt, this.player, (radius, random) => this.objectiveSpot(radius, random));
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
    this.trackLowHealth();
    this.resolveRoundState();
  }

  /** Reports the player crossing LOW_HEALTH_RATIO either way (FX-03); presentation only, nothing reads it back. */
  protected trackLowHealth() {
    const low = this.player.hp > 0 && this.player.hp <= this.player.stats.maxHp * LOW_HEALTH_RATIO;
    if (low === this.lowHealth) return;
    this.lowHealth = low;
    this.emit({ type: 'player/lowHealth', low });
  }

  protected capturePreviousPositions() {
    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;
    this.camera.prevX = this.camera.x;
    this.camera.prevY = this.camera.y;
    for (const enemy of this.enemies) { enemy.prevX = enemy.x; enemy.prevY = enemy.y; }
    for (const projectile of this.projectiles) { projectile.prevX = projectile.x; projectile.prevY = projectile.y; }
    for (const projectile of this.bossProjectiles) { projectile.prevX = projectile.x; projectile.prevY = projectile.y; }
    for (const pickup of this.pickups) { pickup.prevX = pickup.x; pickup.prevY = pickup.y; }
  }

  protected endStepIfInterrupted() {
    this.resolveRoundState();
    return this.paused || this.stageFinished;
  }

  protected resolveRoundState() {
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
      this.activeDraftCards = [];
      this.draftQueue = [];
      this.paused = true;
      this.emit({ type: 'player/died', source: this.lastDamageSource, bossEnraged: this.bossEnraged });
      this.callbacks.onGameOver(this.makeSettlement(false));
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

  /** SYS-04: one enrage step: 1 speed x1.2, 2 pattern density x1.3, 3 damage x1.5, 4 damage x2.0. */
  protected raiseEnrage() {
    if (this.enrageStep >= ENRAGE_STEPS) return;
    this.enrageStep += 1;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || !enemy.isBoss) continue;
      if (this.enrageStep === 1) {
        enemy.speed *= 1.2;
        enemy.patternTimer = Math.min(enemy.patternTimer, 0.65);
      } else if (this.enrageStep === 3) {
        enemy.damage *= 1.5;
      } else if (this.enrageStep === 4) {
        enemy.damage *= 2 / 1.5;
      }
      enemy.hitFlash = 0.4;
    }
  }

  /** The multiplier on boss pattern cadence from enrage step 2 on (SYS-04). */
  protected enrageCadence() {
    return this.rules.steppedEnrage && this.enrageStep >= 2 ? 1.3 : 1;
  }

  protected advanceEnrage(clockDelta: number) {
    this.enrageSeconds += clockDelta;
    while (this.enrageStep < ENRAGE_STEPS && this.enrageSeconds >= this.enrageStep * ENRAGE_STEP_SECONDS) this.raiseEnrage();
    const zone = this.pendingEnrageZone;
    if (zone && this.elapsed >= zone.at) {
      this.pendingEnrageZone = null;
      this.hazards.push({ id: this.nextId(), kind: 'null', x: zone.x, y: zone.y, radius: 170, life: 6, maxLife: 6, damage: 0, slow: 1, triggered: false });
    }
  }

  protected requestRoundClear() {
    if (this.stageFinished) return;
    if (this.rewardLock || this.activeDraftAfter !== null || this.draftQueue.length > 0) {
      this.pendingRoundClear = true;
      return;
    }
    this.finalizeRound();
  }

  protected finalizeRound() {
    if (this.stageFinished) return;
    this.pendingRoundClear = false;
    this.rewardLock = false;
    this.activeDraftId = null;
    this.activeDraftAfter = null;
    this.activeDraftCards = [];
    this.draftQueue = [];
    this.stageFinished = true;
    this.paused = true;
    this.accumulator = 0;
    this.callbacks.onRoundClear(this.makeSettlement(true));
  }

  protected updatePlayer(dt: number) {
    this.player.root = Math.max(0, this.player.root - dt);
    this.player.rootImmunity = Math.max(0, this.player.rootImmunity - dt);
    this.player.invuln = Math.max(0, this.player.invuln - dt);
    this.player.shield = Math.max(0, this.player.shield - dt);
    this.player.silence = Math.max(0, this.player.silence - dt);
    this.coinFeverRushTimer = advanceCoinFeverFrenzy(this.coinFeverRushTimer, dt);
    this.player.slow = 1;

    let inTerrain = false;
    for (const hazard of this.hazards) {
      if (distance(this.player, hazard) > hazard.radius) continue;
      if (TERRAIN_KINDS.has(hazard.kind)) inTerrain = true;
      if (hazard.kind === 'water' || hazard.kind === 'slow') this.player.slow = Math.min(this.player.slow, hazard.slow);
      if (hazard.kind === 'trap' && !hazard.triggered) {
        hazard.triggered = true;
        hazard.life = Math.min(hazard.life, 3.2);
        hazard.maxLife = Math.min(hazard.maxLife, 3.2);
        this.player.root = Math.max(this.player.root, 0.65);
        this.emit({ type: 'trap/sprung', x: hazard.x, y: hazard.y });
      }
      if (hazard.kind === 'root') {
        if (!this.rules.fairTerrain) {
          this.player.root = Math.max(this.player.root, 0.35);
        } else if (this.player.rootImmunity <= 0) {
          // Bind once, then grant immunity so the player can always walk out (BUG-13).
          this.player.root = Math.max(this.player.root, ROOT_BIND_SECONDS);
          this.player.rootImmunity = ROOT_IMMUNITY_SECONDS;
        }
      }
      if (hazard.kind === 'fire') this.damagePlayerOverTime(hazard.damage, dt, 'fire');
      // Null zones only silence; they never slowed, so their slow stays 1 (BUG-16, SYS-11 keeps one penalty).
      if (hazard.kind === 'null') this.player.silence = Math.max(this.player.silence, 0.4);
    }
    if (inTerrain) this.stageObjective?.onTerrainTime(dt);

    let mx = 0;
    let my = 0;
    if (this.heldActions.has('moveUp')) my -= 1;
    if (this.heldActions.has('moveDown')) my += 1;
    if (this.heldActions.has('moveLeft')) mx -= 1;
    if (this.heldActions.has('moveRight')) mx += 1;
    if (mx === 0 && my === 0 && this.analogMove.active) {
      mx = this.analogMove.x;
      my = this.analogMove.y;
    }
    if (mx === 0 && my === 0 && this.pointer.active) {
      const dx = this.pointer.x - this.player.x;
      const dy = this.pointer.y - this.player.y;
      if (Math.hypot(dx, dy) > 24) {
        mx = dx;
        my = dy;
      }
    }

    let moving = { x: 0, y: 0 };
    if (this.player.root <= 0 && (mx !== 0 || my !== 0)) {
      const dir = normalize(mx, my);
      moving = dir;
      const speed = this.player.stats.moveSpeed * this.player.slow;
      this.player.x += dir.x * speed * dt;
      this.player.y += dir.y * speed * dt;
      this.player.x = clamp(this.player.x, 42, WORLD_W - 42);
      this.player.y = clamp(this.player.y, 42, WORLD_H - 42);
      this.resolveEntityVsObstacles(this.player, HIT_RADIUS.playerVsObstacle);
    }

    this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + this.player.stats.hpRegen * dt);
    if (this.pausedHeal > 0) {
      const heal = Math.min(this.pausedHeal, this.pausedHealRate * dt);
      this.pausedHeal -= heal;
      this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + heal);
    }
    if (this.skills.recoveryThread?.awakened && this.player.hp >= this.player.stats.maxHp - 0.5) {
      this.skillCooldowns.recoveryThread = (this.skillCooldowns.recoveryThread ?? 0) - dt;
      if ((this.skillCooldowns.recoveryThread ?? 0) <= 0) {
        this.skillCooldowns.recoveryThread = SKILL_NUMBERS.recoveryThread.counterSeconds / this.effectiveAttackSpeed();
        for (let i = 0; i < 8; i += 1) {
          const angle = (Math.PI * 2 * i) / 8 + this.elapsed * 0.7;
          this.spawnProjectile('recoveryThread', this.player.x, this.player.y, Math.cos(angle) * 620, Math.sin(angle) * 620, 5, this.player.stats.attack * 0.7, 0.45, 0, 60, false);
        }
      }
    }

    this.placeCamera();
    if (this.rules.smoothCamera) {
      const frame = this.viewFrame();
      this.viewCamera.step(dt, this.camera.x, this.camera.y, moving.x, moving.y, Math.max(0, WORLD_W - frame.width), Math.max(0, WORLD_H - frame.height));
    }
  }

  /** The camera the screen shows: the view camera under smoothCamera rules (FX-04), the simulation's otherwise. */
  protected shownCamera() {
    return this.rules.smoothCamera ? this.viewCamera : this.camera;
  }

  /** Visible world frame: fixed 900-unit height with pillarboxing (remaster) or 1:1 canvas pixels (classic). */
  protected viewFrame(): ViewFrame {
    return this.rules.logicalSpawnFrame ? logicalViewFrame(this.viewW, this.viewH) : classicViewFrame(this.viewW, this.viewH);
  }

  /** Where a world x sits across the visible frame, -1 (left edge) to 1 (right edge). */
  protected screenPan(x: number) {
    const half = this.viewFrame().width / 2;
    return half > 0 ? clamp((x - this.camera.x - half) / half, -1, 1) : 0;
  }

  protected placeCamera() {
    const frame = this.viewFrame();
    this.camera.x = clamp(this.player.x - frame.width / 2, 0, Math.max(0, WORLD_W - frame.width));
    this.camera.y = clamp(this.player.y - frame.height / 2, 0, Math.max(0, WORLD_H - frame.height));
  }

  protected updateSkills(dt: number) {
    if (this.rules.skillLoopRework) {
      this.updateSkillsReworked(dt);
      return;
    }
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

  /**
   * SYS-11 (a). Silence blocks new casts only: cooldowns keep counting and the orbit blades and magnet pulse keep
   * working. When silence ends, the skills that became ready fire one at a time, 0.1 s apart, in the usual order.
   */
  protected updateSkillsReworked(dt: number) {
    const silenced = this.player.silence > 0;
    for (const id of Object.keys(this.skillCooldowns) as SkillId[]) {
      // The recovery thread's counter runs in updatePlayer while at full health; counting it here too halved it.
      if (id === 'recoveryThread') continue;
      this.skillCooldowns[id] = Math.max(0, (this.skillCooldowns[id] ?? 0) - dt);
    }
    this.castGap = Math.max(0, this.castGap - dt);
    if (silenced) {
      this.releaseStagger = true;
    } else {
      let fired = false;
      let waiting = false;
      for (const [id, cast] of this.castOrder()) {
        const skill = this.skills[id];
        if (!skill) continue;
        const ready = (this.skillCooldowns[id] ?? 0) <= 0;
        if (this.releaseStagger && (fired || this.castGap > 0)) {
          if (ready) waiting = true;
          continue;
        }
        cast(skill);
        if (ready && (this.skillCooldowns[id] ?? 0) > 0) {
          fired = true;
          if (this.releaseStagger) this.castGap = SILENCE_RELEASE_STAGGER_SECONDS;
        }
      }
      if (this.releaseStagger && !fired && !waiting && this.castGap <= 0) this.releaseStagger = false;
    }
    const orbit = this.skills.orbitScythes;
    if (orbit) this.updateOrbitScythes(orbit);
    if (this.skills.magnetSigil?.awakened) this.updateMagnetPulse();
  }

  /** Active skills in their firing order (the order classic rules call them in). */
  protected castOrder(): Array<[SkillId, (skill: SkillState) => void]> {
    return [
      ['needleStorm', (skill) => this.updateNeedleStorm(skill)],
      ['fanKnives', (skill) => this.updateFanKnives(skill)],
      ['chainSpark', (skill) => this.updateChainSpark(skill)],
      ['frostLine', (skill) => this.updateFrostLine(skill)],
      ['railSpear', (skill) => this.updateRailSpear(skill)],
      ['boneMortar', (skill) => this.updateBoneMortar(skill)],
      ['mirrorClone', (skill) => this.updateMirrorClone(skill)],
      ['voidMine', (skill) => this.updateVoidMine(skill)],
      ['blackSun', (skill) => this.updateBlackSun(skill)],
      ['eclipseStep', (skill) => this.updateEclipseStep(skill)],
    ];
  }

  protected updateNeedleStorm(skill: SkillState) {
    if ((this.skillCooldowns.needleStorm ?? 0) > 0) return;
    const target = this.acquireTarget(980, { projectileSpeed: 760, blockedBySolid: true, projectileRadius: 4.5 });
    if (!target) return;
    const baseCooldown = 0.72 / this.effectiveAttackSpeed();
    this.skillCooldowns.needleStorm = Math.max(0.16, baseCooldown - skill.level * 0.035);
    const count = needleCount(skill.level, skill.awakened);
    const baseAngle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const spread = skill.awakened ? 0.34 : 0.18;
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * spread;
      const angle = baseAngle + offset;
      const damage = this.player.stats.attack * scaleAt(SKILL_NUMBERS.needleStorm.damage, skill.level, skill.awakened);
      const tracked = i === Math.floor((count - 1) / 2) ? target.enemy.id : -1;
      this.spawnProjectile('needleStorm', this.player.x, this.player.y, Math.cos(angle) * 760, Math.sin(angle) * 760, 4.5, damage, 1.15, skill.awakened ? SKILL_NUMBERS.needleStorm.awakenedPierce : 0, 120, true, tracked);
    }
    this.emit({ type: 'skill/cast', skillId: 'needleStorm', x: this.player.x, y: this.player.y });
  }

  protected updateFanKnives(skill: SkillState) {
    if ((this.skillCooldowns.fanKnives ?? 0) > 0) return;
    const target = this.acquireTarget(760, { projectileSpeed: 680, blockedBySolid: true, projectileRadius: 5.2 });
    if (!target) return;
    this.skillCooldowns.fanKnives = Math.max(0.42, 1.05 / this.effectiveAttackSpeed() - skill.level * SKILL_NUMBERS.fanKnives.cooldownPerLevel);
    const count = scaleAt(SKILL_NUMBERS.fanKnives.knives, skill.level, skill.awakened);
    const baseAngle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle + (i - (count - 1) / 2) * 0.22;
      const tracked = i === Math.floor((count - 1) / 2) ? target.enemy.id : -1;
      this.spawnProjectile('fanKnives', this.player.x, this.player.y, Math.cos(angle) * 680, Math.sin(angle) * 680, 5.2, this.player.stats.attack * (0.55 + skill.level * 0.12), skill.awakened ? 1.35 : 0.82, skill.awakened ? 2 : 0, 80, true, tracked);
    }
    this.emit({ type: 'skill/cast', skillId: 'fanKnives', x: this.player.x, y: this.player.y });
  }

  protected updateChainSpark(skill: SkillState) {
    if ((this.skillCooldowns.chainSpark ?? 0) > 0) return;
    const first = this.acquireTarget(780)?.enemy;
    if (!first) return;
    this.skillCooldowns.chainSpark = Math.max(0.55, 1.48 / this.effectiveAttackSpeed() - skill.level * 0.055);
    const jumps = scaleAt(SKILL_NUMBERS.chainSpark.jumps, skill.level, skill.awakened);
    const damage = this.player.stats.attack * scaleAt(SKILL_NUMBERS.chainSpark.damage, skill.level, skill.awakened);
    const hit = new Set<number>();
    const points = [{ x: this.player.x, y: this.player.y }];
    let current: Entity | undefined = first;
    for (let i = 0; i < jumps && current; i += 1) {
      hit.add(current.id);
      points.push({ x: current.x, y: current.y });
      this.dealDamage(current, damage * (1 - i * 0.08), 'chainSpark', 80, skill.awakened && i === jumps - 1, points[points.length - 2]);
      if (skill.awakened && i === jumps - 1) {
        current.stun = Math.max(current.stun, SKILL_NUMBERS.chainSpark.stunSeconds);
        this.areaDamage(current.x, current.y, 78, damage * 0.7, 'chainSpark', 90);
      }
      current = this.findNearestEnemyFrom(current.x, current.y, 330, hit);
    }
    this.chains.push({ id: this.nextId(), points, life: 0.18, maxLife: 0.18 });
    this.emit({ type: 'skill/cast', skillId: 'chainSpark', x: this.player.x, y: this.player.y });
  }

  protected updateFrostLine(skill: SkillState) {
    if ((this.skillCooldowns.frostLine ?? 0) > 0) return;
    const target = this.acquireTarget(980, { preferBoss: true });
    if (!target) return;
    this.skillCooldowns.frostLine = Math.max(1.05, 2.35 / this.effectiveAttackSpeed() - skill.level * 0.06);
    const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const x2 = this.player.x + Math.cos(angle) * 980;
    const y2 = this.player.y + Math.sin(angle) * 980;
    const width = scaleAt(SKILL_NUMBERS.frostLine.width, skill.level, skill.awakened);
    const damage = this.player.stats.attack * (0.95 + skill.level * 0.2);
    this.beams.push({ id: this.nextId(), x1: this.player.x, y1: this.player.y, x2, y2, width, life: 0.28, maxLife: 0.28, owner: 'player' });
    for (const enemy of this.querySegmentEnemies(this.player.x, this.player.y, x2, y2, width)) {
      if (enemy.hp <= 0) continue;
      if (distancePointToSegment(enemy.x, enemy.y, this.player.x, this.player.y, x2, y2) < enemy.radius + width) {
        this.dealDamage(enemy, damage, 'frostLine', 110, false);
        const slow = applyTimedSlow(
          { multiplier: enemy.slowMultiplier ?? 1, remaining: enemy.slowTimer ?? 0 },
          1 - frostLineSlow(skill.level),
          1.25,
        );
        enemy.slowMultiplier = slow.multiplier;
        enemy.slowTimer = slow.remaining;
        if (skill.awakened) enemy.root = Math.max(enemy.root, SKILL_NUMBERS.frostLine.rootSeconds);
      }
    }
    this.emit({ type: 'skill/cast', skillId: 'frostLine', x: this.player.x, y: this.player.y });
  }

  protected updateRailSpear(skill: SkillState) {
    if ((this.skillCooldowns.railSpear ?? 0) > 0) return;
    const target = this.acquireTarget(1250, { preferBoss: true });
    if (!target) return;
    this.skillCooldowns.railSpear = Math.max(1.25, 3.8 / this.effectiveAttackSpeed() - skill.level * 0.12);
    const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const width = scaleAt(SKILL_NUMBERS.railSpear.width, skill.level, skill.awakened);
    const damage = this.player.stats.attack * scaleAt(SKILL_NUMBERS.railSpear.damage, skill.level, skill.awakened);
    const mirrorsRail = this.skills.mirrorClone?.awakened === true && this.gameplayRandom() < SKILL_NUMBERS.mirrorClone.railCopyChance;
    this.fireRailBeam(this.player.x, this.player.y, angle, width, damage, 'railSpear', 180, skill.awakened);
    if (mirrorsRail) {
      const sideX = Math.cos(angle + Math.PI / 2);
      const sideY = Math.sin(angle + Math.PI / 2);
      for (const sign of [-1, 1]) {
        this.fireRailBeam(
          this.player.x + sideX * sign * SKILL_NUMBERS.mirrorClone.cloneOffset,
          this.player.y + sideY * sign * SKILL_NUMBERS.mirrorClone.cloneOffset,
          angle,
          width,
          damage * SKILL_NUMBERS.mirrorClone.railCopyDamage,
          'mirrorClone',
          95,
          false,
        );
      }
    }
    this.requestHitStop(0.045);
    this.emit({ type: 'skill/cast', skillId: 'railSpear', x: this.player.x, y: this.player.y });
  }

  protected fireRailBeam(
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
          this.areaDamage(enemy.x, enemy.y, 58, damage * SKILL_NUMBERS.railSpear.fissureDamage, skillId, 120);
        }
      }
    }
  }

  protected updateBoneMortar(skill: SkillState) {
    if ((this.skillCooldowns.boneMortar ?? 0) > 0) return;
    const target = this.findClusterTarget();
    if (!target) return;
    this.skillCooldowns.boneMortar = Math.max(1.6, 3.4 / this.effectiveAttackSpeed() - skill.level * 0.08);
    const radius = scaleAt(SKILL_NUMBERS.boneMortar.radius, skill.level, skill.awakened);
    const damage = this.player.stats.attack * scaleAt(SKILL_NUMBERS.boneMortar.damage, skill.level, skill.awakened);
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
      collapseDamage: skill.awakened ? damage * SKILL_NUMBERS.boneMortar.aftershockDamage : 0,
    });
    this.emit({ type: 'skill/cast', skillId: 'boneMortar', x: this.player.x, y: this.player.y });
  }

  protected updateMirrorClone(skill: SkillState) {
    if ((this.skillCooldowns.mirrorClone ?? 0) > 0) return;
    const target = this.acquireTarget(1100, { preferBoss: true, projectileSpeed: 820, blockedBySolid: true, projectileRadius: 5.5 });
    if (!target) return;
    this.skillCooldowns.mirrorClone = Math.max(1.05, 2.7 / this.effectiveAttackSpeed() - skill.level * 0.08);
    const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const side = { x: Math.cos(angle + Math.PI / 2), y: Math.sin(angle + Math.PI / 2) };
    // Awakening used to do nothing without rail spear; the rework adds aimed shots and pierce (BUG-16).
    const volley = mirrorCloneVolley(skill.level, skill.awakened && this.rules.mirrorAwakeningRework);
    const offset = SKILL_NUMBERS.mirrorClone.cloneOffset;
    const damage = this.player.stats.attack * scaleAt(SKILL_NUMBERS.mirrorClone.damage, skill.level);
    for (let i = 0; i < volley.flankShots; i += 1) {
      const sign = i % 2 === 0 ? -1 : 1;
      const sx = this.player.x + side.x * sign * offset;
      const sy = this.player.y + side.y * sign * offset;
      const shotAngle = angle;
      this.spawnProjectile('mirrorClone', sx, sy, Math.cos(shotAngle) * 820, Math.sin(shotAngle) * 820, 5.5, damage, 1.15, volley.pierce, 95, true);
      this.chains.push({ id: this.nextId(), points: [{ x: this.player.x, y: this.player.y }, { x: sx, y: sy }], life: 0.16, maxLife: 0.16 });
    }
    for (let i = 0; i < volley.aimedShots; i += 1) {
      const sign = i % 2 === 0 ? -1 : 1;
      const sx = this.player.x + side.x * sign * offset;
      const sy = this.player.y + side.y * sign * offset;
      const shotAngle = Math.atan2(target.y - sy, target.x - sx);
      this.spawnProjectile('mirrorClone', sx, sy, Math.cos(shotAngle) * 820, Math.sin(shotAngle) * 820, 5.5, damage, 1.15, volley.pierce, 95, true, target.enemy.id);
    }
    this.emit({ type: 'skill/cast', skillId: 'mirrorClone', x: this.player.x, y: this.player.y });
  }

  protected updateVoidMine(skill: SkillState) {
    if ((this.skillCooldowns.voidMine ?? 0) > 0) return;
    this.skillCooldowns.voidMine = Math.max(2.1, 4.1 / this.effectiveAttackSpeed() - skill.level * 0.12);
    const radius = scaleAt(SKILL_NUMBERS.voidMine.radius, skill.level, skill.awakened);
    const life = scaleAt(SKILL_NUMBERS.voidMine.duration, skill.level, skill.awakened);
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
    this.emit({ type: 'skill/cast', skillId: 'voidMine', x: this.player.x, y: this.player.y });
  }

  protected updateBlackSun(skill: SkillState) {
    if ((this.skillCooldowns.blackSun ?? 0) > 0) return;
    const target = this.findClusterTarget();
    if (!target) return;
    this.skillCooldowns.blackSun = Math.max(2.6, 6.3 / this.effectiveAttackSpeed() - skill.level * 0.18);
    const radius = scaleAt(SKILL_NUMBERS.blackSun.radius, skill.level, skill.awakened);
    const life = scaleAt(SKILL_NUMBERS.blackSun.duration, skill.level, skill.awakened);
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
    this.emit({ type: 'skill/cast', skillId: 'blackSun', x: target.x, y: target.y });
  }

  protected updateEclipseStep(skill: SkillState) {
    if ((this.skillCooldowns.eclipseStep ?? 0) > 0) return;
    const nearby = this.enemies.filter((enemy) => enemy.hp > 0 && distance(enemy, this.player) < 260).length;
    if (nearby < 3 && this.player.hp / this.player.stats.maxHp > 0.45) return;
    this.skillCooldowns.eclipseStep = Math.max(2.7, 5.4 / this.effectiveAttackSpeed() - skill.level * 0.12);
    const radius = scaleAt(SKILL_NUMBERS.eclipseStep.radius, skill.level, skill.awakened);
    this.player.invuln = Math.max(this.player.invuln, scaleAt(SKILL_NUMBERS.eclipseStep.invulnerability, skill.level));
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
        skillDamage: damage * SKILL_NUMBERS.eclipseStep.afterimageDamage,
      });
    }
    this.emit({ type: 'skill/cast', skillId: 'eclipseStep', x: this.player.x, y: this.player.y });
  }

  protected updateOrbitScythes(skill: SkillState) {
    const forwardBlades = scaleAt(SKILL_NUMBERS.orbitScythes.blades, skill.level);
    const blades = forwardBlades + (skill.awakened ? SKILL_NUMBERS.orbitScythes.awakenedOuterBlades : 0);
    const baseRadius = scaleAt(SKILL_NUMBERS.orbitScythes.radius, skill.level);
    for (let i = 0; i < blades; i += 1) {
      const reverse = skill.awakened && i >= forwardBlades;
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
          this.dealDamage(enemy, this.player.stats.attack * (0.42 + skill.level * 0.075), 'orbitScythes', 55, false, { x: bx, y: by });
        }
      }
    }
  }

  protected updateMagnetPulse() {
    if ((this.skillCooldowns.magnetSigil ?? 0) > 0) return;
    this.skillCooldowns.magnetSigil = SKILL_NUMBERS.magnetSigil.pulseSeconds / this.effectiveAttackSpeed();
    for (const pickup of this.pickups) {
      const dir = normalize(this.player.x - pickup.x, this.player.y - pickup.y);
      pickup.vx += dir.x * 920;
      pickup.vy += dir.y * 920;
    }
    this.emit({ type: 'magnet/pulse', x: this.player.x, y: this.player.y });
  }

  protected spawnEnemies(dt: number) {
    if (this.stageFinished || this.spawnsHalted) return;
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
    const director = this.director;
    if (director) {
      // SYS-03: the opening ramp and the beat rhythm scale the rate; surround beats spawn one group per edge.
      const moved = Math.hypot(this.player.x - this.player.prevX, this.player.y - this.player.prevY);
      if (moved > 0.2) this.playerHeading = { x: (this.player.x - this.player.prevX) / moved, y: (this.player.y - this.player.prevY) / moved };
      const stageTime = this.duration - this.timeLeft;
      if (this.enemies.length < cap) {
        this.spawnBudget += dt * 1.8 * difficulty * director.rateFactor(stageTime) * (this.stageObjective?.spawnRate ?? 1);
        const burst = director.burstSize(stageTime);
        while (this.spawnBudget >= burst) {
          this.spawnBudget -= burst;
          for (let index = 0; index < burst; index += 1) this.spawnEnemy(difficulty, undefined, burst > 1 ? (index % 4) as SpawnEdge : undefined);
        }
      }
    } else if (this.enemies.length < cap) {
      const rate = (this.kind === 'normal' ? 1.8 : 2.25) * difficulty;
      this.spawnBudget += dt * rate;
      while (this.spawnBudget >= 1) {
        this.spawnBudget -= 1;
        this.spawnEnemy(difficulty);
      }
    }

    if (this.kind === 'normal') {
      (this.stageObjective?.fieldBossMarks ?? FIELD_BOSS_MARKS).forEach((mark, index) => {
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

  /** SYS-03: boss-made terrain (fire, slow, root, null) stays within the beat's hazard budget on normal stages. */
  protected terrainAllowed() {
    const director = this.director;
    if (!director) return true;
    let alive = 0;
    for (const hazard of this.hazards) {
      if (Number.isFinite(hazard.life) && DYNAMIC_TERRAIN.has(hazard.kind)) alive += 1;
    }
    return alive < director.terrainCap(this.duration - this.timeLeft) * (this.stageObjective?.terrainScale ?? 1);
  }

  protected enemyCap() {
    if (this.runMode === 'infinite') return infiniteDifficultyAt(this.elapsed, this.infiniteBossKills).enemyCap;
    return 90 + this.chapter * 18 + (this.kind === 'normal' ? 0 : 24);
  }

  protected spawnEnemy(difficulty: number, forcedTier?: EnemyTier, forcedEdge?: SpawnEdge) {
    const director = this.director;
    const stageTime = this.duration - this.timeLeft;
    // Under the director the edge and the point along it come from its stream and follow the beat's formation.
    const edge = director ? forcedEdge ?? director.pickEdge(stageTime, this.playerHeading) : Math.floor(this.gameplayRandom() * 4);
    const along = () => (director ? director.pickAlongEdge() : this.gameplayRandom());
    // Remaster rules spawn from the fixed logical frame so window size never changes a seeded run (BUG-09).
    const spawnFrame = this.rules.logicalSpawnFrame
      ? spawnFrameOrigin(this.player.x, this.player.y, WORLD_W, WORLD_H)
      : {
        left: clamp(this.player.x - this.viewW / 2, 40, WORLD_W - this.viewW - 40),
        top: clamp(this.player.y - this.viewH / 2, 40, WORLD_H - this.viewH - 40),
        width: this.viewW,
        height: this.viewH,
      };
    const { left, top, width: spawnWidth, height: spawnHeight } = spawnFrame;
    let x = this.player.x;
    let y = this.player.y;
    const margin = SPAWN_MARGIN;
    if (edge === 0) {
      x = left - margin;
      y = top + along() * spawnHeight;
    } else if (edge === 1) {
      x = left + spawnWidth + margin;
      y = top + along() * spawnHeight;
    } else if (edge === 2) {
      x = left + along() * spawnWidth;
      y = top - margin;
    } else {
      x = left + along() * spawnWidth;
      y = top + spawnHeight + margin;
    }
    x = clamp(x, -80, WORLD_W + 80);
    y = clamp(y, -80, WORLD_H + 80);
    const roll = this.gameplayRandom();
    const tierRoll = this.stageObjective?.tierRoll ?? TIER_ROLL;
    const tier = forcedTier ?? (roll < tierRoll.small ? 'small' : roll < tierRoll.medium ? 'medium' : 'large');
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
    const rangedCap = infiniteDifficulty?.rangedCap ?? this.stageObjective?.rangedCap(this.chapter) ?? Math.min(RANGED_ENEMY.maxConcurrent, 1 + Math.ceil(this.chapter / 2));
    const rangedChance = infiniteDifficulty?.rangedChance ?? 0.035 + this.chapter * 0.004;
    const attackStyle = tier !== 'large' && rangedCount < rangedCap && this.gameplayRandom() < rangedChance
      ? 'ranged'
      : 'contact';
    // Breathers pay more for each kill (SYS-03).
    const rewardScale = director ? director.rewardScale(stageTime) : 1;
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
      xp: Math.round((tier === 'small' ? 4 : tier === 'medium' ? 10 : 22) * rewardScale),
      coin: Math.round((tier === 'small' ? 1 : tier === 'medium' ? 3 : 7) * rewardScale),
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

  /**
   * Where a boss enters: 620 from the player at the rolled angle, kept inside the arena. Under bossSpacing
   * (SYS-04), a spot the edge clamps closer than 420 tries the opposite side, then the two sides across.
   */
  protected bossSpawnPoint(angle: number) {
    const place = (turn: number) => ({
      x: clamp(this.player.x + Math.cos(angle + turn) * BOSS_SPAWN_DISTANCE, 120, WORLD_W - 120),
      y: clamp(this.player.y + Math.sin(angle + turn) * BOSS_SPAWN_DISTANCE, 120, WORLD_H - 120),
    });
    const first = place(0);
    if (!this.rules.bossSpacing) return first;
    for (const turn of [0, Math.PI, Math.PI / 2, -Math.PI / 2]) {
      const spot = place(turn);
      if (Math.hypot(spot.x - this.player.x, spot.y - this.player.y) >= BOSS_MIN_SPAWN_DISTANCE) return spot;
    }
    return first;
  }

  protected landmarkId() {
    return encounterGrammarForChapter(this.chapter as ChapterId).landmarks.find((landmark) => landmark.stage === this.stage)?.id ?? null;
  }

  /** CON-03: a spot 420-680 from the player for a zone or cache, inside the arena and clear of obstacles. */
  protected objectiveSpot(radius: number, random: () => number) {
    let spot = { x: this.player.x, y: this.player.y };
    for (let tries = 0; tries < 12; tries += 1) {
      const angle = random() * Math.PI * 2;
      const reach = 420 + random() * 260;
      spot = {
        x: clamp(this.player.x + Math.cos(angle) * reach, 200, WORLD_W - 200),
        y: clamp(this.player.y + Math.sin(angle) * reach, 200, WORLD_H - 200),
      };
      const blocked = this.obstacles.some((obstacle) => spot.x > obstacle.x - radius && spot.x < obstacle.x + obstacle.w + radius
        && spot.y > obstacle.y - radius && spot.y < obstacle.y + obstacle.h + radius);
      if (!blocked) return spot;
    }
    return spot;
  }

  protected spawnBoss(kind: StageKind | 'normal', legacy: boolean) {
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

    const { x, y } = this.bossSpawnPoint(this.gameplayRandom() * Math.PI * 2);
    // CON-03: the elite hunt strengthens the stage's field bosses (not the legacy boss).
    const hunted = kind === 'normal' && !legacy ? this.stageObjective?.fieldBossScale : undefined;
    const scale = (kind === 'normal' ? (legacy ? 0.42 : 0.34) : 0.72) * (hunted?.hp ?? 1);
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
      damage: def.damage * stageScale * (kind === 'normal' ? 0.72 : 0.62) * (hunted?.damage ?? 1),
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
    this.emit({ type: 'boss/spawned', x, y, infinite: false });
  }

  protected spawnInfiniteBoss() {
    const pool = BOSS_ROUND_BOSSES.filter((boss) => boss.id !== this.previousInfiniteBossId);
    const candidates = pool.length > 0 ? pool : BOSS_ROUND_BOSSES;
    const def = candidates[Math.floor(this.gameplayRandom() * candidates.length)];
    const difficulty = infiniteDifficultyAt(this.elapsed, this.infiniteBossKills);
    const { x, y } = this.bossSpawnPoint(this.gameplayRandom() * Math.PI * 2);
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
    this.emit({ type: 'boss/spawned', x, y, infinite: true });
  }

  protected updateEnemies(dt: number) {
    const { chargerDash, stalkerFlocking, shooterLeadAim, wardenShield, enemySeparation } = this.rules;
    // SYS-02: at most three chargers wind up at once.
    let windups = 0;
    if (chargerDash) {
      for (const enemy of this.enemies) {
        if (enemy.hp > 0 && !enemy.isBoss && enemy.patternPhase === 'warn' && enemyRole(enemy.tier, enemy.attackStyle) === 'charger') windups += 1;
      }
    }
    const playerVelocity = dt > 0
      ? { x: (this.player.x - this.player.prevX) / dt, y: (this.player.y - this.player.prevY) / dt }
      : { x: 0, y: 0 };
    // Stalker packs look up neighbours in the flat grid, built once per step from positions before moving.
    if (stalkerFlocking) this.separationGrid.build(this.enemies);
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
      enemy.contactTimer = Math.max(0, enemy.contactTimer - dt);
      enemy.stun = Math.max(0, enemy.stun - dt);
      enemy.root = Math.max(0, enemy.root - dt);
      const slow = advanceTimedSlow({ multiplier: enemy.slowMultiplier ?? 1, remaining: enemy.slowTimer ?? 0 }, dt);
      enemy.slowMultiplier = slow.multiplier;
      enemy.slowTimer = slow.remaining;
      if (this.rules.terrainOnEnemies && !enemy.isBoss) this.applyTerrainToEnemy(enemy, dt);
      if (enemy.isBoss && enemy.boss) this.updateBossPattern(enemy, dt);
      if (enemy.stun > 0 || enemy.root > 0) continue;
      const role = enemy.isBoss ? null : enemyRole(enemy.tier, enemy.attackStyle);

      const dir = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
      const playerDistance = distance(enemy, this.player);
      if (wardenShield && role === 'warden') {
        // The shield turns toward the player no faster than 90 degrees a second, so circling gets past it.
        const toward = Math.atan2(dir.y, dir.x);
        enemy.shieldAngle = enemy.shieldAngle === undefined ? toward : turnToward(enemy.shieldAngle, toward, WARDEN_SHIELD.turnRadiansPerSecond * dt);
      }
      const phaseMove = enemy.isBoss ? this.activeBossPhaseMove(enemy) : undefined;
      const phaseSpeed = enemy.isBoss ? phaseMove?.movement.speedScale ?? 1 + ((enemy.bossPhase ?? 1) - 1) * 0.1 : 1;
      const speed = enemy.speed * phaseSpeed * (enemy.slowMultiplier ?? 1) * (enemy.patternPhase === 'dash' ? 3.8 : 1);
      let moveX = dir.x;
      let moveY = dir.y;
      const anchored = enemy.isBoss && enemy.anchorX !== undefined && enemy.anchorY !== undefined && this.bossGrammar(enemy)?.movement.mode === 'anchor';
      if (anchored && (playerDistance > ANCHOR_LEASH || this.bossEnraged)) {
        // SYS-05 fix: a player who leaves the fight is followed, and the boss plants again where it stops. Once
        // the stage clock runs out, enrage ends the hold, so an anchored boss can never be outwaited.
        enemy.anchorX = enemy.x;
        enemy.anchorY = enemy.y;
      } else if (anchored && enemy.anchorX !== undefined && enemy.anchorY !== undefined) {
        // SYS-04 anchor movement: hold near where the phase began and let the volleys do the work. Only a move
        // whose attack grammar runs anchors; the others keep chasing with their old patterns.
        const homeX = enemy.anchorX - enemy.x;
        const homeY = enemy.anchorY - enemy.y;
        const away = Math.hypot(homeX, homeY);
        moveX = away > ANCHOR_RADIUS ? homeX / away : 0;
        moveY = away > ANCHOR_RADIUS ? homeY / away : 0;
      } else if (enemy.isBoss) {
        // SYS-05 movement: orbit and sweep circle the player at a distance, lattice walks one axis at a time.
        const mode = this.bossGrammar(enemy)?.movement.mode;
        if (mode === 'orbit' || mode === 'sweep') {
          const keep = mode === 'orbit' ? 300 : 380;
          const radial = clamp((playerDistance - keep) / keep, -1, 1);
          moveX = -dir.y + dir.x * radial;
          moveY = dir.x + dir.y * radial;
        } else if (mode === 'lattice') {
          const horizontal = Math.abs(dir.x) >= Math.abs(dir.y);
          moveX = horizontal ? Math.sign(dir.x) : 0;
          moveY = horizontal ? 0 : Math.sign(dir.y);
        }
      }

      if (!enemy.isBoss && enemy.attackStyle === 'ranged') {
        let seekingSight = false;
        enemy.rangedCooldown = Math.max(0, enemy.rangedCooldown - dt);
        const projectileSpeed = Math.min(360, 220 * (this.runMode === 'infinite'
          ? infiniteDifficultyAt(this.elapsed, this.infiniteBossKills).enemySpeedScale
          : 1));
        if (enemy.rangedTelegraph > 0) {
          const previousTelegraph = enemy.rangedTelegraph;
          enemy.rangedTelegraph = Math.max(0, enemy.rangedTelegraph - dt);
          if (previousTelegraph > 0 && enemy.rangedTelegraph <= 0) {
            const shotDirection = normalize(enemy.patternX - enemy.x, enemy.patternY - enemy.y);
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
        } else if (enemy.rangedCooldown <= 0 && playerDistance <= 760 && !(seekingSight = this.rules.obstacleCover && !this.clearShot(enemy, this.player, 7))) {
          // SYS-02: the telegraph line points where a moving player will be when the shot arrives.
          const aim = shooterLeadAim ? leadAim(enemy, this.player, playerVelocity, RANGED_ENEMY.telegraphSeconds, projectileSpeed) : this.player;
          enemy.patternX = aim.x;
          enemy.patternY = aim.y;
          enemy.rangedTelegraph = RANGED_ENEMY.telegraphSeconds;
          const cadenceScale = this.runMode === 'infinite'
            ? Math.min(1.55, 1 + infiniteDifficultyAt(this.elapsed, this.infiniteBossKills).minute * 0.012)
            : 1;
          enemy.rangedCooldown = (2.25 + this.gameplayRandom() * 0.75) / cadenceScale;
        }

        const strafe = this.rules.isolatedCosmeticIds
          ? (enemy.variant % 2 === 0 ? 1 : -1)
          : (enemy.id % 2 === 0 ? 1 : -1);
        if (seekingSight) {
          // SYS-06: no clear line, so it circles the player while closing a little until one opens.
          const around = normalize(-dir.y * strafe + dir.x * 0.35, dir.x * strafe + dir.y * 0.35);
          moveX = around.x;
          moveY = around.y;
        } else if (playerDistance < 235) {
          moveX = -dir.x;
          moveY = -dir.y;
        } else if (playerDistance <= 410) {
          moveX = -dir.y * strafe;
          moveY = dir.x * strafe;
        }
      }

      if (stalkerFlocking && role === 'stalker') {
        const neighbours = this.flockScratch;
        neighbours.length = 0;
        this.separationGrid.forEachNear(this.enemies, enemy.x, enemy.y, STALKER_FLOCK.radius, (index) => {
          const other = this.enemies[index];
          if (other !== enemy && other.tier === 'small' && other.attackStyle === 'contact') neighbours.push(other);
          return neighbours.length >= STALKER_FLOCK.maxNeighbours;
        });
        const steer = flockSteer(enemy, dir, neighbours);
        moveX = steer.x;
        moveY = steer.y;
        neighbours.length = 0;
      }

      // SYS-02 chargers: stand and telegraph, then dash straight along the locked lane.
      let charging = false;
      let dashEnded = false;
      if (chargerDash && role === 'charger') {
        enemy.dashCooldown ??= CHARGER.firstCooldownSeconds[0] + this.gameplayRandom() * (CHARGER.firstCooldownSeconds[1] - CHARGER.firstCooldownSeconds[0]);
        if (enemy.patternPhase === 'warn') {
          charging = true;
          enemy.vx = 0;
          enemy.vy = 0;
          enemy.patternTimer -= dt;
          if (enemy.patternTimer <= 0) {
            enemy.patternPhase = 'dash';
            enemy.patternTimer = CHARGER.dashSeconds;
          }
        } else if (enemy.patternPhase === 'dash') {
          charging = true;
          enemy.vx = enemy.patternX;
          enemy.vy = enemy.patternY;
          enemy.patternTimer -= dt;
          if (enemy.patternTimer <= 0) dashEnded = true;
        } else {
          enemy.dashCooldown = Math.max(0, enemy.dashCooldown - dt);
          if (enemy.dashCooldown <= 0 && playerDistance <= CHARGER.range && windups < CHARGER.maxWindups) {
            const dashSpeed = enemy.speed * (enemy.slowMultiplier ?? 1) * CHARGER.speedMultiple;
            const reach = dashSpeed * CHARGER.dashSeconds;
            enemy.patternPhase = 'warn';
            enemy.patternTimer = CHARGER.windupSeconds;
            enemy.patternX = dir.x * dashSpeed;
            enemy.patternY = dir.y * dashSpeed;
            this.laneTelegraphs.push({
              id: this.nextId(),
              x1: enemy.x,
              y1: enemy.y,
              x2: enemy.x + dir.x * reach,
              y2: enemy.y + dir.y * reach,
              width: enemy.radius * 2 + 8,
              life: CHARGER.windupSeconds,
              maxLife: CHARGER.windupSeconds,
            });
            windups += 1;
            charging = true;
            enemy.vx = 0;
            enemy.vy = 0;
          }
        }
      }

      const telegraphedDash = this.rules.telegraphedDash && enemy.isBoss && enemy.boss?.pattern === 'dash';
      if (charging) {
        // Velocity was set by the charger state above.
      } else if (telegraphedDash && enemy.patternPhase === 'warn') {
        enemy.vx = 0;
        enemy.vy = 0;
      } else if (telegraphedDash && enemy.patternPhase === 'dash') {
        enemy.vx = enemy.patternX;
        enemy.vy = enemy.patternY;
      } else {
        enemy.vx = enemy.vx * 0.82 + moveX * speed * 0.18;
        enemy.vy = enemy.vy * 0.82 + moveY * speed * 0.18;
      }
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.x = clamp(enemy.x, -90, WORLD_W + 90);
      enemy.y = clamp(enemy.y, -90, WORLD_H + 90);
      const unresolvedX = enemy.x;
      const unresolvedY = enemy.y;
      this.resolveEntityVsObstacles(enemy, enemy.radius);
      if (charging && enemy.patternPhase === 'dash') {
        const hitWall = Math.hypot(enemy.x - unresolvedX, enemy.y - unresolvedY) > 0.5;
        if (hitWall || dashEnded) {
          enemy.patternPhase = 'idle';
          enemy.dashCooldown = CHARGER.cooldownSeconds[0] + this.gameplayRandom() * (CHARGER.cooldownSeconds[1] - CHARGER.cooldownSeconds[0]);
          enemy.vx *= hitWall ? 0 : 0.2;
          enemy.vy *= hitWall ? 0 : 0.2;
          if (hitWall) {
            enemy.stun = Math.max(enemy.stun, CHARGER.wallStunSeconds);
            this.emit({ type: 'enemy/stunned', x: enemy.x, y: enemy.y });
          }
        }
      }

      const touching = distance(enemy, this.player) < enemy.radius + HIT_RADIUS.playerContact;
      if (touching && enemy.contactTimer <= 0) {
        enemy.contactTimer = enemy.isBoss ? 0.78 : 1;
        this.damagePlayer(enemy.damage, true, enemy.isBoss ? 'bossContact' : 'contact', enemy);
        this.emit({ type: 'enemy/contact', isBoss: enemy.isBoss });
        if (enemy.isBoss && this.rules.bossSpacing && enemy.patternPhase !== 'dash' && enemy.patternPhase !== 'warn') {
          // SYS-04: the hit knocks the boss back so it does not stay on top of the player.
          const away = normalize(enemy.x - this.player.x, enemy.y - this.player.y);
          enemy.vx = away.x * BOSS_CONTACT_RECOIL;
          enemy.vy = away.y * BOSS_CONTACT_RECOIL;
        }
      }
      if (touching && enemy.isBoss && this.rules.bossSpacing) {
        // SYS-04: a boss never overlaps the player; it is pushed back out to touching distance.
        const gap = distance(enemy, this.player);
        const away = gap > 1e-6 ? { x: (enemy.x - this.player.x) / gap, y: (enemy.y - this.player.y) / gap } : { x: 1, y: 0 };
        const reach = enemy.radius + HIT_RADIUS.playerContact;
        enemy.x = this.player.x + away.x * reach;
        enemy.y = this.player.y + away.y * reach;
        this.resolveEntityVsObstacles(enemy, enemy.radius);
      }
    }
    if (enemySeparation) this.separateEnemies();
  }

  /** SYS-02: overlapping enemies push apart by hit radius, heavier bodies giving way less (see SeparationGrid). */
  protected separateEnemies() {
    const grid = this.separationGrid;
    grid.compute(this.enemies);
    for (let index = 0; index < this.enemies.length; index += 1) {
      const pushX = grid.pushX[index];
      const pushY = grid.pushY[index];
      if (pushX === 0 && pushY === 0) continue;
      const enemy = this.enemies[index];
      enemy.x += pushX;
      enemy.y += pushY;
      this.resolveEntityVsObstacles(enemy, enemy.radius);
    }
  }

  protected flushDeadEnemies(suppressBossDraft = false) {
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

  /** SYS-06 A/B: fire, water, and traps act on an enemy standing in them, at TERRAIN_ENEMY_SCALE of their strength. */
  protected applyTerrainToEnemy(enemy: Entity, dt: number) {
    for (const hazard of this.hazards) {
      if (distance(enemy, hazard) > hazard.radius) continue;
      if (hazard.kind === 'fire') {
        enemy.hp -= hazard.damage * TERRAIN_ENEMY_SCALE * dt;
      } else if (hazard.kind === 'water' || hazard.kind === 'slow' || hazard.kind === 'root') {
        // A binding zone slows enemies instead of holding them, since they get no immunity to walk out on.
        const strength = hazard.kind === 'root' ? 0 : hazard.slow;
        const slow = applyTimedSlow({ multiplier: enemy.slowMultiplier ?? 1, remaining: enemy.slowTimer ?? 0 }, 1 - (1 - strength) * TERRAIN_ENEMY_SCALE, dt * 2);
        enemy.slowMultiplier = slow.multiplier;
        enemy.slowTimer = slow.remaining;
      } else if (hazard.kind === 'trap' && !hazard.triggered) {
        // The enemy springs the trap, so it no longer waits for the player.
        hazard.triggered = true;
        hazard.life = Math.min(hazard.life, 3.2);
        hazard.maxLife = Math.min(hazard.maxLife, 3.2);
        enemy.root = Math.max(enemy.root, 0.65 * TERRAIN_ENEMY_SCALE);
        this.emit({ type: 'trap/sprung', x: hazard.x, y: hazard.y });
      }
    }
  }

  protected updateBossPattern(enemy: Entity, dt: number) {
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
      this.emit({ type: 'boss/phase', x: enemy.x, y: enemy.y, phase: nextPhase, chapter: this.chapter });
      if (phaseMove) this.drawPhaseTransitionTelegraph(enemy, phaseMove);
      if (this.rules.bossMoves) {
        // SYS-04: a new phase starts its move fresh; anchoring bosses hold where the phase began.
        enemy.dashChain = undefined;
        enemy.armedPattern = undefined;
        enemy.volleyIndex = 0;
        const anchors = this.bossGrammar(enemy)?.movement.mode === 'anchor';
        enemy.anchorX = anchors ? enemy.x : undefined;
        enemy.anchorY = anchors ? enemy.y : undefined;
      }
      return;
    }
    enemy.bossPhaseFlash = Math.max(0, (enemy.bossPhaseFlash ?? 0) - dt);
    if (enemy.bossPhaseFlash > 0) return;
    const phaseMove = this.activeBossPhaseMove(enemy);
    const cadenceMultiplier = (phaseMove ? 1 / phaseMove.cadenceScale : 1 + ((enemy.bossPhase ?? 1) - 1) * 0.22) * this.enrageCadence();
    enemy.patternTimer -= dt * cadenceMultiplier;
    if (this.rules.bossTelegraphs && PATTERN_LEAD_SECONDS[boss.pattern] !== undefined) {
      this.updateTelegraphedPattern(enemy, boss.pattern, cadenceMultiplier);
      return;
    }
    const dashMove = boss.pattern === 'dash' && this.rules.telegraphedDash ? this.bossGrammar(enemy) : undefined;
    if (dashMove) {
      this.updateDashGrammar(enemy, dashMove, cadenceMultiplier);
    } else if (boss.pattern === 'dash' && this.rules.telegraphedDash) {
      if (enemy.patternPhase === 'warn' && enemy.patternTimer <= 0) {
        // Launch along the direction locked when the windup began; no homing, so the lane shows the real path.
        enemy.patternPhase = 'dash';
        enemy.patternTimer = DASH_TRAVEL_SECONDS / cadenceMultiplier;
        enemy.vx = enemy.patternX;
        enemy.vy = enemy.patternY;
        this.emit({ type: 'boss/attack', x: enemy.x, y: enemy.y, pattern: 'dash' });
      } else if (enemy.patternPhase === 'dash' && enemy.patternTimer <= 0) {
        enemy.patternPhase = 'idle';
        enemy.patternTimer = 2.4;
        enemy.vx *= 0.2;
        enemy.vy *= 0.2;
      } else if (enemy.patternPhase !== 'dash' && enemy.patternPhase !== 'warn' && enemy.patternTimer <= 0) {
        const dir = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
        const phaseMove = this.activeBossPhaseMove(enemy);
        const phaseSpeed = phaseMove?.movement.speedScale ?? 1 + ((enemy.bossPhase ?? 1) - 1) * 0.1;
        const dashSpeed = enemy.speed * phaseSpeed * (enemy.slowMultiplier ?? 1) * DASH_SPEED_MULTIPLE;
        const windup = DASH_WINDUP_SECONDS / cadenceMultiplier;
        const travel = dashSpeed * (DASH_TRAVEL_SECONDS / cadenceMultiplier);
        enemy.patternPhase = 'warn';
        enemy.patternTimer = windup;
        enemy.patternX = dir.x * dashSpeed;
        enemy.patternY = dir.y * dashSpeed;
        enemy.vx = 0;
        enemy.vy = 0;
        this.laneTelegraphs.push({
          id: this.nextId(),
          x1: enemy.x,
          y1: enemy.y,
          x2: enemy.x + dir.x * travel,
          y2: enemy.y + dir.y * travel,
          width: enemy.radius * 2,
          life: windup,
          maxLife: windup,
        });
      }
    } else if (boss.pattern === 'dash') {
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
      this.emit({ type: 'boss/ringFired', x: enemy.x, y: enemy.y });
    }

    if (boss.pattern === 'shock' && enemy.patternTimer <= 0) {
      enemy.patternTimer = 3.1;
      if (this.rules.bossTelegraphs) this.emit({ type: 'boss/attack', x: enemy.x, y: enemy.y, pattern: 'shock' });
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
      this.emit({ type: 'boss/cloned', x: enemy.x, y: enemy.y });
    }

    if (boss.pattern === 'flame' && enemy.patternTimer <= 0) {
      enemy.patternTimer = 1.05;
      if (this.terrainAllowed()) this.hazards.push({ id: this.nextId(), kind: 'fire', x: enemy.x, y: enemy.y, radius: 74, life: 5.8, maxLife: 5.8, damage: enemy.damage * 0.26, slow: 1, triggered: false });
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
        if (this.terrainAllowed()) this.hazards.push({ id: this.nextId(), kind: 'slow', x: this.player.x + Math.cos(angle) * (120 + i * 42), y: this.player.y + Math.sin(angle) * (120 + i * 42), radius: 86, life: 5.5, maxLife: 5.5, damage: 0, slow: 0.34, triggered: false });
      }
    }

    if (boss.pattern === 'traps' && enemy.patternTimer <= 0) {
      enemy.patternTimer = 2.6;
      for (let i = 0; i < 3; i += 1) {
        const angle = this.gameplayRandom() * Math.PI * 2;
        const dist = 80 + this.gameplayRandom() * 220;
        if (this.terrainAllowed()) this.hazards.push({ id: this.nextId(), kind: 'root', x: this.player.x + Math.cos(angle) * dist, y: this.player.y + Math.sin(angle) * dist, radius: 52, life: 7, maxLife: 7, damage: 0, slow: 1, triggered: false });
      }
    }

    if (boss.pattern === 'clock' && enemy.patternTimer <= 0) {
      enemy.patternTimer = 3.2;
      if (this.terrainAllowed()) this.hazards.push({ id: this.nextId(), kind: 'slow', x: this.player.x, y: this.player.y, radius: 150, life: 4.6, maxLife: 4.6, damage: 0, slow: 0.28, triggered: false });
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

    if (boss.pattern === 'eclipse' && enemy.patternTimer <= 0 && this.rules.eclipseWallFromView) {
      enemy.patternTimer = 4.4;
      this.emit({ type: 'boss/attack', x: enemy.x, y: enemy.y, pattern: 'eclipse' });
      // The wall enters from the edge of the player's logical view, so it reaches the player wherever
      // they stand, and one lane is left open (BUG-11). Edge lanes flash for 0.6 s before the shots fly.
      const roll = this.gameplayRandom();
      const vertical = roll < 0.5;
      const forward = roll < 0.25 || (roll >= 0.5 && roll < 0.75) ? 1 : -1;
      const safeLane = Math.floor(this.gameplayRandom() * 7) - 3;
      const halfSpan = (vertical ? LOGICAL_VIEW.height : LOGICAL_VIEW.width) / 2 + 60;
      const origin = vertical
        ? clamp(this.player.y - forward * halfSpan, -120, WORLD_H + 120)
        : clamp(this.player.x - forward * halfSpan, -120, WORLD_W + 120);
      const travel = Math.abs((vertical ? this.player.y : this.player.x) - origin) + halfSpan + 60;
      const life = travel / ECLIPSE_WALL_SPEED;
      for (let lane = -3; lane <= 3; lane += 1) {
        if (lane === safeLane) continue;
        const offset = lane * ECLIPSE_WALL_LANE_GAP;
        const x = vertical ? this.player.x + offset : origin;
        const y = vertical ? origin : this.player.y + offset;
        const vx = vertical ? 0 : ECLIPSE_WALL_SPEED * forward;
        const vy = vertical ? ECLIPSE_WALL_SPEED * forward : 0;
        this.pendingHostileShots.push({ at: this.elapsed + ECLIPSE_WALL_LEAD_SECONDS, x, y, vx, vy, radius: 10, damage: enemy.damage * 0.5, life, kind: 'eclipse' });
        this.laneTelegraphs.push({
          id: this.nextId(),
          x1: x,
          y1: y,
          x2: x + (vx / ECLIPSE_WALL_SPEED) * 260,
          y2: y + (vy / ECLIPSE_WALL_SPEED) * 260,
          width: 24,
          life: ECLIPSE_WALL_LEAD_SECONDS,
          maxLife: ECLIPSE_WALL_LEAD_SECONDS,
        });
      }
    } else if (boss.pattern === 'eclipse' && enemy.patternTimer <= 0) {
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
      // The position rolls happen either way, so the cap never shifts the gameplay stream.
      const nullX = this.player.x + (this.gameplayRandom() - 0.5) * 160;
      const nullY = this.player.y + (this.gameplayRandom() - 0.5) * 160;
      if (this.terrainAllowed()) this.hazards.push({ id: this.nextId(), kind: 'null', x: nullX, y: nullY, radius: 130, life: 5.4, maxLife: 5.4, damage: 0, slow: 1, triggered: false });
      for (let i = 0; i < 16; i += 1) {
        const angle = (Math.PI * 2 * i) / 16 + this.elapsed * 0.2;
        this.spawnBossProjectile(enemy.x, enemy.y, Math.cos(angle) * 190, Math.sin(angle) * 190, 8, enemy.damage * 0.5, 4.8, 'eclipse');
      }
    }
  }

  /**
   * SYS-04: telegraphed boss patterns. When the pattern timer drops under the pattern's lead time the pattern is
   * armed (angles, spots, and rolls fixed) and its warning appears; at zero it fires exactly as warned.
   */
  protected updateTelegraphedPattern(enemy: Entity, pattern: BossPattern, cadence: number) {
    const lead = PATTERN_LEAD_SECONDS[pattern] ?? 0;
    // bossMoves keeps every warning at its real-time length whatever the phase cadence (V3), and a ring grammar
    // warns for its move's preview plus imminent time.
    const move = this.bossGrammar(enemy);
    const warnSeconds = !this.rules.bossMoves
      ? lead / cadence
      : move ? move.telegraph.previewSeconds + move.telegraph.imminentSeconds : lead;
    const armAt = this.rules.bossMoves ? warnSeconds * cadence : lead;
    if (!enemy.armedPattern && enemy.patternTimer <= armAt) this.armPattern(enemy, pattern, warnSeconds, move);
    if (enemy.patternTimer > 0 || !enemy.armedPattern) return;
    const armed = enemy.armedPattern;
    enemy.armedPattern = undefined;
    if (!this.fireArmedPattern(enemy, pattern, armed)) {
      // No room under the shot cap: try again shortly, with a fresh warning.
      enemy.patternTimer = lead + 0.3;
      return;
    }
    this.emit({ type: 'boss/attack', x: enemy.x, y: enemy.y, pattern });
  }

  protected armPattern(enemy: Entity, pattern: BossPattern, warnSeconds: number, move?: BossPhaseMove) {
    const fireAt = this.elapsed + warnSeconds;
    const armed: ArmedPattern = { x: enemy.x, y: enemy.y, offset: 0, points: [], burst: false };
    const ring = (x: number, y: number, radius: number) => this.emit({ type: 'telegraph/ring', x, y, radius, life: warnSeconds });
    switch (pattern) {
      case 'rings': {
        armed.offset = fireAt * 0.35;
        ring(enemy.x, enemy.y, enemy.radius * 1.9);
        const grammar = move?.attackGrammar;
        const volley = enemy.volleyIndex ?? 0;
        const lane = (x1: number, y1: number, x2: number, y2: number, width: number) => this.laneTelegraphs.push({ id: this.nextId(), x1, y1, x2, y2, width, life: warnSeconds, maxLife: warnSeconds });
        if (grammar === 'contracting-ring-walls' && volley % 2 === 0) {
          // A wall of shots closes in on the player; the one gate is marked as the way out.
          armed.wall = { x: this.player.x, y: this.player.y, radius: RING_WALL.radius };
          armed.gap = this.gameplayRandom() * Math.PI * 2;
          ring(this.player.x, this.player.y, RING_WALL.radius);
          const gx = Math.cos(armed.gap);
          const gy = Math.sin(armed.gap);
          lane(this.player.x + gx * (RING_WALL.radius - 140), this.player.y + gy * (RING_WALL.radius - 140), this.player.x + gx * (RING_WALL.radius + 60), this.player.y + gy * (RING_WALL.radius + 60), 110);
        } else if (grammar === 'alternating-ring-gap' || grammar === 'contracting-ring-walls') {
          // The ring leaves a gap, toward the player on one volley and away on the next; a keyline shows it.
          armed.gap = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x) + (volley % 2 === 0 ? 0 : Math.PI);
          const gx = Math.cos(armed.gap);
          const gy = Math.sin(armed.gap);
          lane(enemy.x + gx * (enemy.radius + 20), enemy.y + gy * (enemy.radius + 20), enemy.x + gx * 380, enemy.y + gy * 380, 70);
        }
        break;
      }
      case 'clock':
        armed.offset = Math.PI / 12;
        ring(enemy.x, enemy.y, enemy.radius * 1.9);
        ring(this.player.x, this.player.y, 150);
        armed.points.push({ x: this.player.x, y: this.player.y });
        break;
      case 'saw': {
        if (move?.attackGrammar === 'counter-rotating-saws') {
          // Two rings of saws orbit the boss in opposite directions; the rings are marked where they will run.
          armed.offset = fireAt;
          for (const orbit of SAW_ORBITS) ring(enemy.x, enemy.y, orbit.radius);
          break;
        }
        if (move?.attackGrammar === 'cross-screen-saw-drop') {
          // Saws drop down the player's view in five lanes, one left open.
          armed.gap = Math.floor(this.gameplayRandom() * SAW_DROP.lanes);
          const top = this.player.y - LOGICAL_VIEW.height / 2 - 60;
          const length = LOGICAL_VIEW.height + 120;
          for (let lane = 0; lane < SAW_DROP.lanes; lane += 1) {
            if (lane === armed.gap) continue;
            const x = this.player.x + (lane - (SAW_DROP.lanes - 1) / 2) * SAW_DROP.gap;
            armed.points.push({ x, y: top });
            this.laneTelegraphs.push({ id: this.nextId(), x1: x, y1: top, x2: x, y2: top + length, width: 36, life: warnSeconds, maxLife: warnSeconds });
          }
          break;
        }
        armed.offset = fireAt;
        const reach = SAW_SPEED * SAW_LIFE;
        for (let index = 0; index < 4; index += 1) {
          const angle = (Math.PI * 2 * index) / 4 + armed.offset;
          this.laneTelegraphs.push({
            id: this.nextId(),
            x1: enemy.x,
            y1: enemy.y,
            x2: enemy.x + Math.cos(angle) * reach,
            y2: enemy.y + Math.sin(angle) * reach,
            width: 36,
            life: warnSeconds,
            maxLife: warnSeconds,
          });
        }
        break;
      }
      case 'clones':
        for (let index = 0; index < 4; index += 1) {
          const angle = (Math.PI * 2 * index) / 4 + this.gameplayRandom() * 0.4;
          const point = { x: enemy.x + Math.cos(angle) * 95, y: enemy.y + Math.sin(angle) * 95 };
          armed.points.push(point);
          ring(point.x, point.y, 30);
        }
        break;
      case 'flame':
        if (move?.attackGrammar === 'sequenced-fire-lanes') {
          // Three fire lanes across the player light one after another; the aisles between them stay open.
          armed.offset = (enemy.volleyIndex ?? 0) % 2;
          for (let index = 0; index < 3; index += 1) {
            const point = this.fireLaneCentre(index, armed.offset);
            armed.points.push(point);
            const [dx, dy] = armed.offset ? [0, FIRE_LANES.length / 2] : [FIRE_LANES.length / 2, 0];
            this.laneTelegraphs.push({ id: this.nextId(), x1: point.x - dx, y1: point.y - dy, x2: point.x + dx, y2: point.y + dy, width: FIRE_LANES.radius * 2, life: warnSeconds + index * FIRE_LANES.step, maxLife: warnSeconds + index * FIRE_LANES.step });
          }
        } else if (move?.attackGrammar === 'radial-flame-collapse') {
          // A ring of fire falls around the player with one spot left out, and the boss lands across from that gap.
          const gap = Math.floor(this.gameplayRandom() * FLAME_COLLAPSE.spots);
          armed.gap = (Math.PI * 2 * gap) / FLAME_COLLAPSE.spots;
          for (let index = 0; index < FLAME_COLLAPSE.spots; index += 1) {
            if (index === gap) continue;
            const angle = (Math.PI * 2 * index) / FLAME_COLLAPSE.spots;
            const point = { x: this.player.x + Math.cos(angle) * FLAME_COLLAPSE.radius, y: this.player.y + Math.sin(angle) * FLAME_COLLAPSE.radius };
            armed.points.push(point);
            ring(point.x, point.y, FLAME_COLLAPSE.patch);
          }
          armed.wall = { x: this.player.x - Math.cos(armed.gap) * FLAME_COLLAPSE.warp, y: this.player.y - Math.sin(armed.gap) * FLAME_COLLAPSE.warp, radius: 0 };
          ring(armed.wall.x, armed.wall.y, enemy.radius * 1.4);
          // Then the vault's centre caves in too, so the gap is the only way out.
          armed.points.push({ x: this.player.x, y: this.player.y });
          this.emit({ type: 'telegraph/ring', x: this.player.x, y: this.player.y, radius: FLAME_COLLAPSE.core, life: warnSeconds + FLAME_COLLAPSE.coreDelay });
        } else {
          armed.burst = this.gameplayRandom() < 0.35;
          if (armed.burst) ring(enemy.x, enemy.y, enemy.radius * 1.7);
        }
        break;
      case 'null': {
        if (move?.attackGrammar === 'contracting-safe-void') {
          // A wall of shots closes on a blank circle near the player and stops at its edge: the void is the way out.
          const centre = { x: this.player.x + (this.gameplayRandom() - 0.5) * 160, y: this.player.y + (this.gameplayRandom() - 0.5) * 160 };
          const angle = this.gameplayRandom() * Math.PI * 2;
          armed.wall = { x: centre.x, y: centre.y, radius: SAFE_VOID.wall };
          armed.points.push({ x: centre.x + Math.cos(angle) * SAFE_VOID.warp, y: centre.y + Math.sin(angle) * SAFE_VOID.warp });
          ring(centre.x, centre.y, SAFE_VOID.void);
          ring(centre.x, centre.y, SAFE_VOID.wall);
          break;
        }
        const axis = move?.attackGrammar === 'paired-null-zones' ? this.gameplayRandom() * Math.PI : undefined;
        if (axis !== undefined) {
          // Two silence zones balance each other across the player.
          for (const side of [1, -1]) {
            const point = { x: this.player.x + Math.cos(axis) * NULL_PAIR.offset * side, y: this.player.y + Math.sin(axis) * NULL_PAIR.offset * side };
            armed.points.push(point);
            ring(point.x, point.y, NULL_PAIR.radius);
          }
        } else {
          const point = { x: this.player.x + (this.gameplayRandom() - 0.5) * 160, y: this.player.y + (this.gameplayRandom() - 0.5) * 160 };
          armed.points.push(point);
          ring(point.x, point.y, 130);
        }
        armed.offset = fireAt * 0.2;
        ring(enemy.x, enemy.y, enemy.radius * 1.9);
        break;
      }
      case 'tide':
        for (let index = 0; index < 5; index += 1) {
          const angle = (Math.PI * 2 * index) / 5 + fireAt;
          const point = { x: this.player.x + Math.cos(angle) * (120 + index * 42), y: this.player.y + Math.sin(angle) * (120 + index * 42) };
          armed.points.push(point);
          ring(point.x, point.y, 86);
        }
        break;
      case 'traps':
        if (move?.attackGrammar === 'staggered-root-grid') {
          // A 3x3 lattice of bindings around the player in two checkerboard waves; each wave leaves the other's cells.
          for (let row = -1; row <= 1; row += 1) {
            for (let column = -1; column <= 1; column += 1) {
              const point = { x: this.player.x + column * ROOT_GRID.spacing, y: this.player.y + row * ROOT_GRID.spacing };
              armed.points.push(point);
              this.emit({ type: 'telegraph/ring', x: point.x, y: point.y, radius: ROOT_GRID.radius, life: warnSeconds + ((row + column) & 1 ? ROOT_GRID.stagger : 0) });
            }
          }
        } else if (move?.attackGrammar === 'closing-trap-cell') {
          // The execution cell: a square of bindings around the player, then a smaller one inside; both open on
          // the same side, so the gate stays a straight corridor out (the Latch Empress's own variant).
          armed.gap = Math.floor(this.gameplayRandom() * 4);
          for (const [half, late] of [[TRAP_CELL.outer, 0], [TRAP_CELL.inner, TRAP_CELL.close]] as const) {
            for (const point of trapCell(this.player.x, this.player.y, half, TRAP_CELL.spacing, armed.gap)) {
              armed.points.push(point);
              this.emit({ type: 'telegraph/ring', x: point.x, y: point.y, radius: TRAP_CELL.radius, life: warnSeconds + late });
            }
          }
          const [gx, gy] = CELL_SIDES[armed.gap];
          this.laneTelegraphs.push({ id: this.nextId(), x1: this.player.x, y1: this.player.y, x2: this.player.x + gx * (TRAP_CELL.outer + 90), y2: this.player.y + gy * (TRAP_CELL.outer + 90), width: 90, life: warnSeconds + TRAP_CELL.close, maxLife: warnSeconds + TRAP_CELL.close });
        } else {
          for (let index = 0; index < 3; index += 1) {
            const angle = this.gameplayRandom() * Math.PI * 2;
            const dist = 80 + this.gameplayRandom() * 220;
            const point = { x: this.player.x + Math.cos(angle) * dist, y: this.player.y + Math.sin(angle) * dist };
            armed.points.push(point);
            ring(point.x, point.y, 52);
          }
        }
        break;
      default:
        break;
    }
    enemy.armedPattern = armed;
  }

  /** Fires an armed pattern; returns false when a volley has no room under the shot cap. */
  protected fireArmedPattern(enemy: Entity, pattern: BossPattern, armed: ArmedPattern) {
    const volley = (count: number) => this.bossProjectiles.length + count <= VOLLEY_SOFT_CAP;
    switch (pattern) {
      case 'rings': {
        const wall = armed.wall;
        if (wall) {
          if (!volley(RING_WALL.shots)) return false;
          enemy.patternTimer = enemy.legacyBoss ? 3.2 : 2.35;
          for (let index = 0; index < RING_WALL.shots; index += 1) {
            const angle = (Math.PI * 2 * index) / RING_WALL.shots;
            if (armed.gap !== undefined && inGap(index, RING_WALL.shots, armed.gap, 0, RING_WALL.gateShots)) continue;
            const x = wall.x + Math.cos(angle) * wall.radius;
            const y = wall.y + Math.sin(angle) * wall.radius;
            this.spawnBossProjectile(x, y, -Math.cos(angle) * RING_WALL.speed, -Math.sin(angle) * RING_WALL.speed, 7, enemy.damage * 0.62, (wall.radius + 60) / RING_WALL.speed, 'ring');
          }
          enemy.volleyIndex = (enemy.volleyIndex ?? 0) + 1;
          this.emit({ type: 'boss/ringFired', x: wall.x, y: wall.y });
          return true;
        }
        const count = enemy.legacyBoss ? 14 : 22;
        if (!volley(count)) return false;
        enemy.patternTimer = enemy.legacyBoss ? 3.2 : 2.35;
        for (let index = 0; index < count; index += 1) {
          const angle = (Math.PI * 2 * index) / count + armed.offset;
          if (armed.gap !== undefined && inGap(index, count, armed.gap, armed.offset, RING_GAP_SHOTS)) continue;
          this.spawnBossProjectile(armed.x, armed.y, Math.cos(angle) * 215, Math.sin(angle) * 215, 7, enemy.damage * 0.62, 5, 'ring');
        }
        enemy.volleyIndex = (enemy.volleyIndex ?? 0) + 1;
        this.emit({ type: 'boss/ringFired', x: armed.x, y: armed.y });
        return true;
      }
      case 'clock': {
        if (!volley(12)) return false;
        enemy.patternTimer = 3.2;
        const [zone] = armed.points;
        if (zone && this.terrainAllowed()) this.hazards.push({ id: this.nextId(), kind: 'slow', x: zone.x, y: zone.y, radius: 150, life: 4.6, maxLife: 4.6, damage: 0, slow: 0.28, triggered: false });
        for (let index = 0; index < 12; index += 1) {
          const angle = (Math.PI * 2 * index) / 12 + armed.offset;
          this.spawnBossProjectile(armed.x, armed.y, Math.cos(angle) * 150, Math.sin(angle) * 150, 6, enemy.damage * 0.45, 4.5, 'ring');
        }
        return true;
      }
      case 'saw': {
        const grammar = this.bossGrammar(enemy)?.attackGrammar;
        if (grammar === 'counter-rotating-saws') {
          const saws = SAW_ORBITS.reduce((sum, orbit) => sum + orbit.saws, 0);
          if (!volley(saws)) return false;
          enemy.patternTimer = SAW_ORBIT_LIFE + 0.6;
          for (const orbit of SAW_ORBITS) {
            for (let index = 0; index < orbit.saws; index += 1) {
              const angle = (Math.PI * 2 * index) / orbit.saws + armed.offset;
              this.spawnBossProjectile(enemy.x + Math.cos(angle) * orbit.radius, enemy.y + Math.sin(angle) * orbit.radius, 0, 0, 14, enemy.damage * 0.58, SAW_ORBIT_LIFE, 'saw');
              this.bossProjectiles[this.bossProjectiles.length - 1].orbit = { bossId: enemy.id, radius: orbit.radius, angle, spin: orbit.spin };
            }
          }
          return true;
        }
        if (grammar === 'cross-screen-saw-drop') {
          if (!volley(armed.points.length)) return false;
          enemy.patternTimer = 2.6;
          const life = (LOGICAL_VIEW.height + 120) / SAW_DROP.speed;
          for (const point of armed.points) this.spawnBossProjectile(point.x, point.y, 0, SAW_DROP.speed, 14, enemy.damage * 0.58, life, 'saw');
          return true;
        }
        if (!volley(4)) return false;
        enemy.patternTimer = 1.8;
        for (let index = 0; index < 4; index += 1) {
          const angle = (Math.PI * 2 * index) / 4 + armed.offset;
          this.spawnBossProjectile(armed.x, armed.y, Math.cos(angle) * SAW_SPEED, Math.sin(angle) * SAW_SPEED, 14, enemy.damage * 0.58, SAW_LIFE, 'saw');
        }
        return true;
      }
      case 'clones':
        enemy.patternTimer = 5.6;
        for (const point of armed.points) {
          this.spawnEnemy(1 + this.chapter * 0.5, 'medium');
          const clone = this.enemies[this.enemies.length - 1];
          clone.x = clone.prevX = point.x;
          clone.y = clone.prevY = point.y;
          this.resolveEntityVsObstacles(clone, clone.radius);
          clone.hp *= 1.35;
          clone.maxHp = clone.hp;
          clone.variant = 4;
        }
        this.emit({ type: 'boss/cloned', x: enemy.x, y: enemy.y });
        return true;
      case 'flame': {
        const grammar = this.bossGrammar(enemy)?.attackGrammar;
        if (grammar === 'sequenced-fire-lanes') {
          enemy.patternTimer = 2.8;
          enemy.volleyIndex = (enemy.volleyIndex ?? 0) + 1;
          armed.points.forEach((centre, lane) => {
            for (let index = 0; index < FIRE_LANES.patches; index += 1) {
              const along = (index - (FIRE_LANES.patches - 1) / 2) * (FIRE_LANES.length / (FIRE_LANES.patches - 1));
              this.pendingHazards.push({
                at: this.elapsed + lane * FIRE_LANES.step,
                hazard: { kind: 'fire', x: centre.x + (armed.offset ? 0 : along), y: centre.y + (armed.offset ? along : 0), radius: FIRE_LANES.radius, life: FIRE_LANES.life, maxLife: FIRE_LANES.life, damage: enemy.damage * 0.26, slow: 1, triggered: false },
              });
            }
          });
          return true;
        }
        if (grammar === 'radial-flame-collapse') {
          enemy.patternTimer = 3.2;
          const core = armed.points[armed.points.length - 1];
          for (const point of armed.points) {
            if (point === core) continue;
            this.hazards.push({ id: this.nextId(), kind: 'fire', x: point.x, y: point.y, radius: FLAME_COLLAPSE.patch, life: FLAME_COLLAPSE.life, maxLife: FLAME_COLLAPSE.life, damage: enemy.damage * 0.26, slow: 1, triggered: false });
          }
          this.pendingHazards.push({ at: this.elapsed + FLAME_COLLAPSE.coreDelay, hazard: { kind: 'fire', x: core.x, y: core.y, radius: FLAME_COLLAPSE.core, life: FLAME_COLLAPSE.life, maxLife: FLAME_COLLAPSE.life, damage: enemy.damage * 0.26, slow: 1, triggered: false } });
          if (armed.wall) this.warpBoss(enemy, armed.wall.x, armed.wall.y);
          return true;
        }
        if (armed.burst && !volley(9)) return false;
        enemy.patternTimer = 1.05;
        if (this.terrainAllowed()) this.hazards.push({ id: this.nextId(), kind: 'fire', x: enemy.x, y: enemy.y, radius: 74, life: 5.8, maxLife: 5.8, damage: enemy.damage * 0.26, slow: 1, triggered: false });
        if (armed.burst) {
          for (let index = 0; index < 9; index += 1) {
            const angle = (Math.PI * 2 * index) / 9;
            this.spawnBossProjectile(armed.x, armed.y, Math.cos(angle) * 180, Math.sin(angle) * 180, 8, enemy.damage * 0.5, 3.8, 'dot');
          }
        }
        return true;
      }
      case 'null': {
        const wall = armed.wall;
        if (wall) {
          // contracting-safe-void: the wall stops SAFE_VOID.void short of the centre; then the boss steps outside it.
          if (!volley(SAFE_VOID.shots)) return false;
          enemy.patternTimer = 4.6;
          for (let index = 0; index < SAFE_VOID.shots; index += 1) {
            const angle = (Math.PI * 2 * index) / SAFE_VOID.shots;
            this.spawnBossProjectile(wall.x + Math.cos(angle) * wall.radius, wall.y + Math.sin(angle) * wall.radius, -Math.cos(angle) * SAFE_VOID.speed, -Math.sin(angle) * SAFE_VOID.speed, 8, enemy.damage * 0.5, (wall.radius - SAFE_VOID.void) / SAFE_VOID.speed, 'eclipse');
          }
          const [landing] = armed.points;
          if (landing) this.warpBoss(enemy, landing.x, landing.y);
          return true;
        }
        if (!volley(16)) return false;
        enemy.patternTimer = 4.8;
        const paired = armed.points.length > 1;
        for (const zone of armed.points) {
          // The paired zones are the attack, so they skip the terrain budget that caps the plain drop.
          if (paired || this.terrainAllowed()) this.hazards.push({ id: this.nextId(), kind: 'null', x: zone.x, y: zone.y, radius: paired ? NULL_PAIR.radius : 130, life: paired ? NULL_PAIR.life : 5.4, maxLife: paired ? NULL_PAIR.life : 5.4, damage: 0, slow: 1, triggered: false });
        }
        for (let index = 0; index < 16; index += 1) {
          const angle = (Math.PI * 2 * index) / 16 + armed.offset;
          this.spawnBossProjectile(armed.x, armed.y, Math.cos(angle) * 190, Math.sin(angle) * 190, 8, enemy.damage * 0.5, 4.8, 'eclipse');
        }
        return true;
      }
      case 'tide':
        enemy.patternTimer = 4;
        for (const point of armed.points) {
          if (this.terrainAllowed()) this.hazards.push({ id: this.nextId(), kind: 'slow', x: point.x, y: point.y, radius: 86, life: 5.5, maxLife: 5.5, damage: 0, slow: 0.34, triggered: false });
        }
        return true;
      case 'traps': {
        const grammar = this.bossGrammar(enemy)?.attackGrammar;
        if (grammar === 'staggered-root-grid' || grammar === 'closing-trap-cell') {
          const grid = grammar === 'staggered-root-grid';
          const spec = grid ? ROOT_GRID : TRAP_CELL;
          enemy.patternTimer = grid ? 3.4 : 4.2;
          const outer = grid ? 0 : trapCell(0, 0, TRAP_CELL.outer, TRAP_CELL.spacing, armed.gap ?? 0).length;
          armed.points.forEach((point, index) => {
            // The lattice's second wave takes the other checkerboard cells; the cell's inner square closes later.
            const late = grid ? (Math.round((point.x - armed.points[4].x) / ROOT_GRID.spacing + (point.y - armed.points[4].y) / ROOT_GRID.spacing) & 1 ? ROOT_GRID.stagger : 0) : index >= outer ? TRAP_CELL.close : 0;
            this.pendingHazards.push({ at: this.elapsed + late, hazard: { kind: 'root', x: point.x, y: point.y, radius: spec.radius, life: spec.life, maxLife: spec.life, damage: 0, slow: 1, triggered: false } });
          });
          return true;
        }
        enemy.patternTimer = 2.6;
        for (const point of armed.points) {
          if (this.terrainAllowed()) this.hazards.push({ id: this.nextId(), kind: 'root', x: point.x, y: point.y, radius: 52, life: 7, maxLife: 7, damage: 0, slow: 1, triggered: false });
        }
        return true;
      }
      default:
        return true;
    }
  }

  /** SYS-05 sequenced-fire-lanes: the centre of lane `index` (0-2) across the player, horizontal or vertical. */
  protected fireLaneCentre(index: number, vertical: number) {
    const offset = (index - 1) * FIRE_LANES.gap;
    return vertical ? { x: this.player.x + offset, y: this.player.y } : { x: this.player.x, y: this.player.y + offset };
  }

  /** SYS-05 warp moves: the boss vanishes and lands where its warning ring stood. */
  protected warpBoss(enemy: Entity, x: number, y: number) {
    enemy.x = enemy.prevX = clamp(x, enemy.radius, WORLD_W - enemy.radius);
    enemy.y = enemy.prevY = clamp(y, enemy.radius, WORLD_H - enemy.radius);
    this.resolveEntityVsObstacles(enemy, enemy.radius);
    this.emit({ type: 'boss/cloned', x: enemy.x, y: enemy.y });
  }

  /** The phase move whose attack grammar runs under bossMoves (SYS-04), when that grammar is implemented. */
  protected bossGrammar(enemy: Entity) {
    if (!this.rules.bossMoves) return undefined;
    const move = this.activeBossPhaseMove(enemy);
    return move && IMPLEMENTED_GRAMMARS.has(move.attackGrammar) ? move : undefined;
  }

  protected dashSpeed(enemy: Entity) {
    const phaseSpeed = this.activeBossPhaseMove(enemy)?.movement.speedScale ?? 1 + ((enemy.bossPhase ?? 1) - 1) * 0.1;
    return enemy.speed * phaseSpeed * (enemy.slowMultiplier ?? 1) * DASH_SPEED_MULTIPLE;
  }

  /**
   * SYS-04 dash grammars. tracked-dash-pair: a second dash re-aimed at the player after the first, behind its own
   * 0.62 s lane. crossing-dash-triple: three lanes crossing around the player, all shown at the first windup,
   * then run back to back. Timers keep real-time lengths at any cadence, and every windup is at least 0.62 s
   * (V3) unless its lane has already been on screen for longer.
   */
  protected updateDashGrammar(enemy: Entity, move: BossPhaseMove, cadence: number) {
    const travelSeconds = move.telegraph.activeSeconds;
    if (enemy.patternPhase === 'warn') {
      if (enemy.patternTimer <= 0) {
        enemy.patternPhase = 'dash';
        enemy.patternTimer = travelSeconds * cadence;
        enemy.vx = enemy.patternX;
        enemy.vy = enemy.patternY;
        this.emit({ type: 'boss/attack', x: enemy.x, y: enemy.y, pattern: 'dash' });
      }
      return;
    }
    if (enemy.patternPhase === 'dash') {
      if (enemy.patternTimer > 0) return;
      const next = enemy.dashChain?.shift();
      if (next) {
        this.windDash(enemy, next, cadence, travelSeconds, next.tracked);
        return;
      }
      enemy.patternPhase = 'idle';
      enemy.patternTimer = 2.4;
      enemy.vx *= 0.2;
      enemy.vy *= 0.2;
      return;
    }
    if (enemy.patternTimer > 0) return;
    const warn = Math.max(DASH_WINDUP_SECONDS, move.telegraph.previewSeconds + move.telegraph.imminentSeconds);
    const toPlayer = normalize(this.player.x - enemy.x, this.player.y - enemy.y);
    const reach = this.dashSpeed(enemy) * travelSeconds;
    const chain: DashStep[] = [];
    if (move.attackGrammar === 'tracked-dash-pair') {
      chain.push({ tracked: true, dx: 0, dy: 0, windupSeconds: DASH_WINDUP_SECONDS });
    } else if (move.attackGrammar === 'crossing-dash-triple') {
      const side = { x: -toPlayer.y, y: toPlayer.x };
      let start = { x: enemy.x + toPlayer.x * reach, y: enemy.y + toPlayer.y * reach };
      let shownFor = warn + travelSeconds;
      for (const offset of [CROSSCUT.offset, -CROSSCUT.offset]) {
        const aim = normalize(this.player.x + side.x * offset - start.x, this.player.y + side.y * offset - start.y);
        const end = { x: start.x + aim.x * reach, y: start.y + aim.y * reach };
        shownFor += CROSSCUT.pauseSeconds + travelSeconds;
        this.laneTelegraphs.push({ id: this.nextId(), x1: start.x, y1: start.y, x2: end.x, y2: end.y, width: enemy.radius * 2, life: shownFor, maxLife: shownFor });
        chain.push({ tracked: false, dx: aim.x, dy: aim.y, windupSeconds: CROSSCUT.pauseSeconds });
        start = end;
      }
    }
    enemy.dashChain = chain;
    this.windDash(enemy, { tracked: false, dx: toPlayer.x, dy: toPlayer.y, windupSeconds: warn }, cadence, travelSeconds, true);
  }

  protected windDash(enemy: Entity, step: DashStep, cadence: number, travelSeconds: number, showLane: boolean) {
    const dir = step.tracked ? normalize(this.player.x - enemy.x, this.player.y - enemy.y) : { x: step.dx, y: step.dy };
    const speed = this.dashSpeed(enemy);
    enemy.patternPhase = 'warn';
    enemy.patternTimer = step.windupSeconds * cadence;
    enemy.patternX = dir.x * speed;
    enemy.patternY = dir.y * speed;
    enemy.vx = 0;
    enemy.vy = 0;
    if (!showLane) return;
    const reach = speed * travelSeconds;
    this.laneTelegraphs.push({
      id: this.nextId(),
      x1: enemy.x,
      y1: enemy.y,
      x2: enemy.x + dir.x * reach,
      y2: enemy.y + dir.y * reach,
      width: enemy.radius * 2,
      life: step.windupSeconds,
      maxLife: step.windupSeconds,
    });
  }

  protected activeBossPhaseMove(enemy: Entity): BossPhaseMove | undefined {
    if (!enemy.boss || (enemy.bossPhase ?? 1) === 1) return undefined;
    const set = BOSS_PHASE_MOVE_SETS.find((candidate) => candidate.bossId === enemy.boss?.id);
    return set?.moves.find((move) => move.phase === enemy.bossPhase);
  }

  protected drawPhaseTransitionTelegraph(enemy: Entity, move: BossPhaseMove) {
    const life = move.telegraph.previewSeconds + move.telegraph.imminentSeconds;
    if (move.telegraph.shape === 'circle' || move.telegraph.shape === 'ring') {
      this.emit({ type: 'telegraph/ring', x: enemy.x, y: enemy.y, radius: enemy.radius * (move.telegraph.shape === 'ring' ? 3.2 : 2.3), life });
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

  protected updateProjectiles(dt: number) {
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
        // The shot's own path, a tenth of a second back, tells a shield which way it came from (SYS-02).
        this.dealDamage(enemy, projectile.damage, projectile.skillId, projectile.knockback, false, {
          x: projectile.x - projectile.vx * 0.1,
          y: projectile.y - projectile.vy * 0.1,
        });
        projectile.pierce -= 1;
        if (projectile.skillId === 'needleStorm' && this.skills.needleStorm?.awakened) {
          const extra = this.findNearestEnemyFrom(enemy.x, enemy.y, SKILL_NUMBERS.needleStorm.shardRange, new Set([enemy.id]));
          if (extra) this.dealDamage(extra, projectile.damage * SKILL_NUMBERS.needleStorm.shardDamage, projectile.skillId, 40, false, enemy);
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
        this.emit({ type: 'shot/blocked', x: projectile.x, y: projectile.y });
      }
    }
    const inFlight = (projectile: Projectile) => projectile.life > 0 && projectile.x > -120 && projectile.x < WORLD_W + 120 && projectile.y > -120 && projectile.y < WORLD_H + 120;
    if (this.rules.reliableAim) this.recordAimResults(inFlight);
    recycleWhere(this.projectiles, inFlight, this.projectilePool);
  }

  protected updateBossProjectiles(dt: number) {
    if (this.pendingHostileShots.length > 0) {
      const due = this.pendingHostileShots.filter((shot) => shot.at <= this.elapsed);
      if (due.length > 0) {
        this.pendingHostileShots = this.pendingHostileShots.filter((shot) => shot.at > this.elapsed);
        for (const shot of due) this.spawnBossProjectile(shot.x, shot.y, shot.vx, shot.vy, shot.radius, shot.damage, shot.life, shot.kind);
      }
    }
    if (this.pendingHazards.length > 0) {
      const due = this.pendingHazards.filter((entry) => entry.at <= this.elapsed);
      if (due.length > 0) {
        this.pendingHazards = this.pendingHazards.filter((entry) => entry.at > this.elapsed);
        for (const { hazard } of due) this.hazards.push({ ...hazard, id: this.nextId() });
      }
    }
    for (const projectile of this.bossProjectiles) {
      const start = { x: projectile.x, y: projectile.y };
      projectile.life -= dt;
      const orbit = projectile.orbit;
      if (orbit) {
        // SYS-05 orbiting saws circle their boss wherever it goes; they fall away when it dies.
        const boss = this.enemies.find((enemy) => enemy.id === orbit.bossId && enemy.hp > 0);
        if (!boss) projectile.life = 0;
        orbit.angle += orbit.spin * dt;
        projectile.x = (boss?.x ?? projectile.x) + Math.cos(orbit.angle) * orbit.radius;
        projectile.y = (boss?.y ?? projectile.y) + Math.sin(orbit.angle) * orbit.radius;
      } else {
        projectile.x += projectile.vx * dt;
        projectile.y += projectile.vy * dt;
      }
      if (projectile.fading) continue;
      const hitsPlayer = segmentCircleHitTime(start, projectile, this.player, projectile.radius + HIT_RADIUS.playerVsHostileShot);
      // SYS-06: an ordinary enemy shot stops at the first obstacle it reaches before the player; boss shots fly over.
      if (this.rules.obstacleCover && projectile.kind === 'enemy') {
        let blockedAt: number | null = null;
        for (const obstacle of this.obstacles) {
          const time = segmentRectHitTime(start, projectile, obstacle, projectile.radius);
          if (time !== null && (blockedAt === null || time < blockedAt)) blockedAt = time;
        }
        if (blockedAt !== null && (hitsPlayer === null || blockedAt < hitsPlayer)) {
          projectile.x = start.x + (projectile.x - start.x) * blockedAt;
          projectile.y = start.y + (projectile.y - start.y) * blockedAt;
          projectile.life = 0;
          this.emit({ type: 'shot/blocked', x: projectile.x, y: projectile.y });
          continue;
        }
      }
      if (hitsPlayer !== null) {
        projectile.life = 0;
        this.damagePlayer(projectile.damage, true, projectile.kind === 'enemy' ? 'shot' : 'bossShot', projectile);
      }
    }
    recycleWhere(
      this.bossProjectiles,
      (projectile) => projectile.life > 0 && projectile.x > -180 && projectile.x < WORLD_W + 180 && projectile.y > -180 && projectile.y < WORLD_H + 180,
      this.bossProjectilePool,
    );
  }

  protected updatePickups(dt: number) {
    for (const pickup of this.pickups) {
      pickup.life -= dt;
      const d = distance(pickup, this.player);
      const aged = pickup.maxLife - pickup.life >= pickupSoftTtl(this.rules.patientPickups);
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
      const reached = distance(pickup, this.player) < pickup.radius + HIT_RADIUS.pickupReach;
      if (reached && pickup.value > 0) this.emit({ type: 'pickup/collected', kind: pickup.kind, x: pickup.x, y: pickup.y });
      if (pickup.life <= 0 || reached) this.collectPickup(pickup);
    }
    recycleWhere(this.pickups, (pickup) => pickup.value > 0, this.pickupPool);
  }

  protected collectPickup(pickup: Pickup) {
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

  protected updateHazards(dt: number) {
    const expiredVortexIds: number[] = [];
    for (const hazard of this.hazards) {
      const previousLife = hazard.life;
      if (Number.isFinite(hazard.life)) hazard.life -= dt;
      if (hazard.kind === 'shock' && !hazard.triggered && expiredThisStep(previousLife, hazard.life)) {
        hazard.triggered = true;
        if (shockHitsPlayer(hazard, hazard.radius, this.player, HIT_RADIUS.playerVsHostileShot)) this.damagePlayer(hazard.damage, false, 'shock', hazard);
        this.emit({ type: 'shock/burst', x: hazard.x, y: hazard.y });
      }
      if (hazard.kind === 'warning' && !hazard.triggered && expiredThisStep(previousLife, hazard.life)) {
        hazard.triggered = true;
        const sourceSkillId = hazard.sourceSkillId ?? 'boneMortar';
        this.areaDamage(hazard.x, hazard.y, hazard.radius, hazard.skillDamage ?? 0, sourceSkillId, 210, false);
        if ((hazard.collapseDamage ?? 0) > 0) {
          this.areaDamage(hazard.x, hazard.y, hazard.radius * 0.55, hazard.collapseDamage!, sourceSkillId, 260, true);
        }
        this.emit({ type: 'area/blast', x: hazard.x, y: hazard.y, radius: hazard.radius, source: sourceSkillId });
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
            this.dealDamage(enemy, hazard.skillDamage ?? this.player.stats.attack * 0.55, sourceSkillId, 40, false, hazard);
          }
        }
        if (!hazard.triggered && expiredThisStep(previousLife, hazard.life)) {
          hazard.triggered = true;
          if ((hazard.collapseDamage ?? 0) > 0) {
            if (sourceSkillId === 'blackSun' && this.skills.blackSun?.awakened) {
              for (const enemy of this.enemyIndex.queryCircle(hazard.x, hazard.y, hazard.radius + 30)) {
                if (enemy.hp <= 0 || distance(enemy, hazard) > hazard.radius + 30 + enemy.radius) continue;
                this.dealDamage(enemy, hazard.collapseDamage! + enemy.maxHp * 0.045, 'blackSun', 220, true, hazard);
                const slow = applyTimedSlow({ multiplier: enemy.slowMultiplier, remaining: enemy.slowTimer }, 0.52, 3.5);
                enemy.slowMultiplier = slow.multiplier;
                enemy.slowTimer = slow.remaining;
              }
            } else {
              this.areaDamage(hazard.x, hazard.y, hazard.radius + 30, hazard.collapseDamage!, sourceSkillId, 220, true);
            }
            this.emit({
              type: 'vortex/collapse',
              x: hazard.x,
              y: hazard.y,
              radius: hazard.radius,
              ring: sourceSkillId === 'blackSun' && this.skills.blackSun?.awakened === true,
            });
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

  protected updateEffects(dt: number) {
    for (const beam of this.beams) beam.life -= dt;
    for (const lane of this.laneTelegraphs) lane.life -= dt;
    for (const chain of this.chains) chain.life -= dt;
    compactWhere(this.beams, (beam) => beam.life > 0);
    compactWhere(this.laneTelegraphs, (lane) => lane.life > 0);
    compactWhere(this.chains, (chain) => chain.life > 0);
    this.presentation.step(dt);
  }

  protected resolveEntityVsObstacles(entity: { x: number; y: number }, radius: number) {
    for (const obstacle of this.obstacles) {
      const pushed = circleRectPush(entity.x, entity.y, radius, obstacle);
      entity.x = pushed.x;
      entity.y = pushed.y;
    }
  }

  protected spawnProjectile(
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
    aimTargetId = -1,
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
      aimTargetId,
    });
    this.projectiles.push(projectile);
  }

  protected spawnBossProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    damage: number,
    life: number,
    kind: BossProjectile['kind'],
  ) {
    if (this.rules.bossTelegraphs && this.bossProjectiles.length >= BOSS_PROJECTILE_HARD_CAP) {
      // SYS-04: over the cap the oldest live shot fades out harmlessly instead of vanishing mid-flight.
      const oldest = this.bossProjectiles.find((shot) => !shot.fading);
      if (oldest) {
        oldest.fading = true;
        oldest.life = Math.min(oldest.life, SHOT_FADE_SECONDS);
      }
      if (this.bossProjectiles.length >= BOSS_PROJECTILE_HARD_CAP + 64) {
        const dropped = this.bossProjectiles.shift();
        if (dropped) this.bossProjectilePool.release(dropped);
      }
    } else if (this.bossProjectiles.length >= BOSS_PROJECTILE_HARD_CAP) {
      const oldest = this.bossProjectiles.shift();
      if (oldest) this.bossProjectilePool.release(oldest);
    }
    const projectile = this.bossProjectilePool.acquire();
    Object.assign(projectile, { id: this.nextId(), x, y, prevX: x, prevY: y, vx, vy, radius, damage, life, kind, fading: false, orbit: undefined });
    this.bossProjectiles.push(projectile);
  }

  /**
   * Picks the target and aim point of an aimed skill. Classic rules aim at the nearest enemy in range. Remaster
   * rules (SYS-01) prefer enemies inside the fixed logical view (off-view ones only when none is in view), skip
   * targets a wall-blocked shot cannot reach, push a target back after three straight misses, and lead moving
   * targets for projectile skills. Boss preference is unchanged (G2).
   */
  protected acquireTarget(
    range: number,
    { preferBoss = false, projectileSpeed = 0, blockedBySolid = false, projectileRadius = 0 } = {},
  ): { enemy: Entity; x: number; y: number } | undefined {
    if (!this.rules.reliableAim) {
      const enemy = this.findNearestEnemy(range, preferBoss);
      return enemy ? { enemy, x: enemy.x, y: enemy.y } : undefined;
    }
    const view = spawnFrameOrigin(this.player.x, this.player.y, WORLD_W, WORLD_H);
    const candidates: Array<{ enemy: Entity; score: number }> = [];
    for (const enemy of this.enemyIndex.queryCircle(this.player.x, this.player.y, range)) {
      if (enemy.hp <= 0) continue;
      const d = distance(enemy, this.player);
      if (d >= range) continue;
      const inView = enemy.x + enemy.radius >= view.left
        && enemy.x - enemy.radius <= view.left + view.width
        && enemy.y + enemy.radius >= view.top
        && enemy.y - enemy.radius <= view.top + view.height;
      const shunned = (enemy.aimMisses ?? 0) >= AIM_MISS_LIMIT && this.elapsed - (enemy.aimMissedAt ?? -Infinity) < AIM_MISS_MEMORY_SECONDS;
      // Order: in view, then off view, then targets on a miss streak; distance and boss bonus within each group.
      const score = d - (preferBoss && enemy.isBoss ? 400 : 0) + (inView ? 0 : 50_000) + (shunned ? 1_000_000 : 0);
      candidates.push({ enemy, score });
    }
    candidates.sort((a, b) => a.score - b.score || a.enemy.id - b.enemy.id);
    for (const { enemy } of candidates) {
      const aim = projectileSpeed > 0 ? this.leadPoint(enemy, projectileSpeed) : { x: enemy.x, y: enemy.y };
      if (blockedBySolid && !this.clearShot(this.player, aim, projectileRadius)) continue;
      return { enemy, x: aim.x, y: aim.y };
    }
    return undefined;
  }

  /** Where a projectile of this speed meets the enemy if it keeps its current velocity (two refinement passes). */
  protected leadPoint(enemy: Entity, speed: number) {
    let x = enemy.x;
    let y = enemy.y;
    for (let pass = 0; pass < 2; pass += 1) {
      const time = Math.min(AIM_MAX_LEAD_SECONDS, Math.hypot(x - this.player.x, y - this.player.y) / speed);
      x = enemy.x + enemy.vx * time;
      y = enemy.y + enemy.vy * time;
    }
    return { x, y };
  }

  protected clearShot(from: { x: number; y: number }, to: { x: number; y: number }, radius: number) {
    for (const obstacle of this.obstacles) {
      if (segmentRectHitTime(from, to, obstacle, radius) !== null) return false;
    }
    return true;
  }

  /** Counts finished aimed shots: a hit clears the target's miss streak, a miss extends it (SYS-01). */
  protected recordAimResults(inFlight: (projectile: Projectile) => boolean) {
    for (const projectile of this.projectiles) {
      if (projectile.aimTargetId < 0 || inFlight(projectile)) continue;
      const target = this.enemies.find((enemy) => enemy.id === projectile.aimTargetId);
      projectile.aimTargetId = -1;
      if (!target || target.hp <= 0) continue;
      if (projectile.hitEnemyIds.has(target.id)) {
        target.aimMisses = 0;
        continue;
      }
      if (this.elapsed - (target.aimMissedAt ?? -Infinity) >= AIM_MISS_MEMORY_SECONDS) target.aimMisses = 0;
      target.aimMisses = (target.aimMisses ?? 0) + 1;
      target.aimMissedAt = this.elapsed;
    }
  }

  protected findNearestEnemy(maxDistance: number, preferBoss = false) {
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

  protected findNearestEnemyFrom(x: number, y: number, maxDistance: number, excluded: Set<number>) {
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

  protected findClusterTarget() {
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

  /** `source` is where the hit comes from (the player unless a projectile, blast, or chain carries it), for shields. */
  protected dealDamage(
    enemy: Entity,
    rawDamage: number,
    skillId: SkillId,
    knockback: number,
    forceCrit: boolean,
    source: Readonly<{ x: number; y: number }> = this.player,
  ) {
    if (enemy.hp <= 0) return;
    const hpRatio = enemy.hp / enemy.maxHp;
    const execution = this.skills.executionMark?.awakened && enemy.isBoss ? 1 + (1 - hpRatio) * SKILL_NUMBERS.executionMark.lowHpBossBonus : 1;
    const targetMultiplier = enemy.isBoss ? this.player.stats.bossDamage : 1;
    const crit = forceCrit || this.gameplayRandom() < this.player.stats.critChance;
    const critMultiplier = crit ? this.player.stats.critDamage : 1;
    let damage = Math.max(1, rawDamage * targetMultiplier * critMultiplier * execution);
    // SYS-02: a warden's front shield takes most of a hit that lands inside its arc.
    if (this.rules.wardenShield && enemy.shieldAngle !== undefined && !enemy.isBoss && shieldCovers(enemy.shieldAngle, enemy, source)) {
      damage = Math.max(1, damage * WARDEN_SHIELD.damageScale);
      this.emit({
        type: 'enemy/blocked',
        x: enemy.x + Math.cos(enemy.shieldAngle) * enemy.radius,
        y: enemy.y + Math.sin(enemy.shieldAngle) * enemy.radius,
      });
    }
    // UI-05: the health this hit actually took, for the settlement's damage bars (presentation only).
    this.damageBySkill[skillId] = (this.damageBySkill[skillId] ?? 0) + Math.min(damage, enemy.hp);
    enemy.hp -= damage;
    const impactTier = classifyImpact(damage, enemy.maxHp, crit, enemy.hp <= 0, {
      classification: this.rules.hitStopBudget ? 'budgeted' : 'classic',
      notableTarget: enemy.isBoss,
    });
    enemy.hitFlash = 0.08;
    if (knockback > 0 && !enemy.isBoss) {
      const dir = normalize(enemy.x - this.player.x, enemy.y - this.player.y);
      enemy.x += dir.x * knockback * 0.035;
      enemy.y += dir.y * knockback * 0.035;
    }
    const travel = normalize(enemy.x - source.x, enemy.y - source.y);
    this.emit({ type: 'enemy/hit', id: enemy.id, x: enemy.x, y: enemy.y, radius: enemy.radius, damage, crit, tier: impactTier, dx: travel.x, dy: travel.y });
    if (impactTier !== 'light' && !this.rules.rareHitStop) this.requestHitStop(impactTier === 'critical' ? 0.035 : 0.025);
  }

  protected requestHitStop(seconds: number) {
    if (!this.rules.hitStopBudget) {
      this.hitStop = Math.max(this.hitStop, seconds);
      return;
    }
    const grant = grantHitStop(this.hitStopBudget, seconds);
    this.hitStopBudget = grant.budget;
    if (grant.granted > 0) this.hitStop = Math.max(this.hitStop, grant.granted);
  }

  protected areaDamage(x: number, y: number, radius: number, damage: number, skillId: SkillId, knockback: number, forceCrit = false) {
    for (const enemy of this.enemyIndex.queryCircle(x, y, radius)) {
      if (enemy.hp <= 0) continue;
      if (distance(enemy, { x, y }) <= radius + enemy.radius) {
        this.dealDamage(enemy, damage, skillId, knockback, forceCrit, { x, y });
      }
    }
    this.emit({ type: 'area/damage', x, y });
  }

  protected damagePlayer(rawDamage: number, physical: boolean, source: PlayerDamageSource, from: Readonly<{ x: number; y: number }>) {
    if (this.cheatGodMode) {
      this.player.hp = this.player.stats.maxHp;
      return;
    }
    if (this.player.invuln > 0 || this.player.shield > 0) return;
    const reduced = Math.max(1, rawDamage - this.player.stats.defense * (physical ? 0.72 : 0.42));
    this.damageTakenTotal += Math.min(reduced, Math.max(0, this.player.hp));
    this.player.hp -= reduced;
    const paperWard = this.skills.paperWard;
    this.player.invuln = paperWardDirectHitInvulnerability(paperWard?.level ?? 0);
    if (this.skills.ironFrame?.awakened) this.player.shield = SKILL_NUMBERS.ironFrame.shieldSeconds;
    if (paperWard?.awakened) this.pushEnemiesFromPlayer(SKILL_NUMBERS.paperWard.pushRadius);
    this.lastDamageSource = source;
    this.emit({ type: 'player/hurt', x: this.player.x, y: this.player.y, damage: reduced, source, fromX: from.x, fromY: from.y });
    if (this.rules.smoothCamera) {
      const blow = normalize(this.player.x - from.x, this.player.y - from.y);
      this.viewCamera.kick(blow.x, blow.y);
    }
  }

  protected damagePlayerOverTime(damagePerSecond: number, dt: number, source: PlayerDamageSource) {
    if (this.cheatGodMode) {
      this.player.hp = this.player.stats.maxHp;
      return;
    }
    if (this.player.shield > 0) return;
    const burn = calculateFireDotDamage(damagePerSecond, dt, this.player.stats.defense);
    this.damageTakenTotal += Math.min(burn, Math.max(0, this.player.hp));
    this.player.hp -= burn;
    this.lastDamageSource = source;
  }

  protected pushEnemiesFromPlayer(radius: number) {
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

  protected onEnemyKilled(enemy: Entity, suppressBossDraft = false) {
    this.player.kills += 1;
    this.stageKills += 1;
    this.stageObjective?.onKill({ tier: enemy.tier, ranged: enemy.attackStyle === 'ranged', fieldBoss: enemy.isBoss && enemy.boss?.role === 'field' && !enemy.legacyBoss });
    if (this.runMode === 'infinite') {
      this.infiniteEventScore += infiniteKillScore(enemy.tier, this.elapsed, this.infiniteBossKills);
      if (enemy.isBoss) {
        this.infiniteBossKills += 1;
        this.infiniteBossRespawnTimer = 2.4;
        this.objectiveTarget = this.infiniteBossKills + 1;
      }
    }
    // FX-02: a boss kill is one of the rare events that still stop the whole simulation for a beat.
    if (enemy.isBoss && this.rules.rareHitStop) this.requestHitStop(RARE_HIT_STOP.bossKill);
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
    const away = normalize(enemy.x - this.player.x, enemy.y - this.player.y);
    this.emit({ type: 'enemy/killed', x: enemy.x, y: enemy.y, isBoss: enemy.isBoss, radius: enemy.radius, tier: enemy.tier, attackStyle: enemy.attackStyle, dx: away.x, dy: away.y });

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

  protected rebuildEnemyIndex() {
    this.enemyIndex.clear();
    for (const enemy of this.enemies) {
      if (enemy.hp > 0) this.enemyIndex.insert(enemy);
    }
  }

  protected querySegmentEnemies(x1: number, y1: number, x2: number, y2: number, padding: number) {
    return this.enemyIndex.queryRect(
      Math.min(x1, x2) - padding,
      Math.min(y1, y2) - padding,
      Math.abs(x2 - x1) + padding * 2,
      Math.abs(y2 - y1) + padding * 2,
    );
  }

  protected updatePlayerAim() {
    // The shown aim is the primary weapon's (needle) target, so the reticle marks what the needles will hit.
    const target = this.acquireTarget(980, { projectileSpeed: 760, blockedBySolid: true, projectileRadius: 4.5 });
    this.aimTargetId = target?.enemy.id ?? null;
    this.playerAimAngle = target
      ? Math.atan2(target.y - this.player.y, target.x - this.player.x)
      : -Math.PI / 2;
  }

  protected spawnPickup(kind: Pickup['kind'], x: number, y: number, vx: number, vy: number, radius: number, value: number) {
    const target = selectPickupMergeTarget(this.pickups, { x, y, kind });
    if (target) {
      mergePickupValue(target, value, this.rules.patientPickups);
      return;
    }

    const pickup = this.pickupPool.acquire();
    const maxLife = pickupTtl(kind, this.rules.patientPickups);
    Object.assign(pickup, { id: this.nextId(), x, y, prevX: x, prevY: y, vx, vy, radius, kind, value, life: maxLife, maxLife });
    if (this.pickups.length >= PICKUP_HARD_CAP) {
      this.collectPickup(pickup);
      this.pickupPool.release(pickup);
      return;
    }
    this.pickups.push(pickup);
  }

  protected openDraft(reason: DraftReason, after: DraftState['after']) {
    if (this.rewardLock) {
      this.draftQueue.push({ reason, after });
      return;
    }
    this.presentDraft(reason, after);
  }

  protected presentDraft(reason: DraftReason, after: DraftState['after']) {
    this.rewardLock = true;
    this.activeDraftAfter = after;
    this.paused = true;
    const offers = this.generateOffers(reason);
    const id = this.nextId();
    const cards = offers.map((offer, slot): DraftCard => ({ ...offer, offerId: `${id}:${slot}` }));
    this.activeDraftId = id;
    this.activeDraftCards = cards;
    this.emit({ type: 'draft/opened', reason, highlight: cards.some((card) => card.kind === 'awakening' || card.rarity === 'legendary' || card.rarity === 'mythic') });
    this.callbacks.onDraft({
      id,
      title: reason === 'boss' ? text('draft.title.boss') : text('draft.title.level', { level: this.player.level }),
      reason,
      after,
      cards,
    });
  }

  protected generateOffers(reason: DraftReason) {
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

  protected weightedSkillPick() {
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

  protected makeOffer(skillId: SkillId, kind: 'skill' | 'awakening'): SkillOffer {
    const def = SKILLS[skillId];
    const state = this.skills[skillId];
    const name = text(`skill.${skillId}`);
    if (kind === 'awakening') {
      return {
        kind,
        skillId,
        rarity: def.rarity,
        title: text('draft.awakening', { skill: name }),
        body: this.awakeningText(skillId),
        levelLine: text('draft.awakening.line'),
        level: state?.level ?? 0,
      };
    }
    const nextLevel = (state?.level ?? 0) + 1;
    return {
      kind,
      skillId,
      rarity: def.rarity,
      title: state ? text('draft.skillLevel', { skill: name, level: nextLevel }) : name,
      body: state ? skillLevelText(skillId, nextLevel) : text(`skill.${skillId}.summary`),
      levelLine: state ? text('draft.levelLine', { from: state.level, to: nextLevel }) : text('draft.newSkill'),
      level: state?.level ?? 0,
    };
  }

  protected awakeningText(skillId: SkillId): Text {
    const classic = this.rules.mirrorAwakeningRework ? undefined : CLASSIC_AWAKENING_TEXT[skillId];
    return classic ?? SKILL_AWAKENING_TEXT[skillId];
  }

  protected makeBonusOffers(reason: DraftReason): SkillOffer[] {
    const bonusRarity: Rarity = reason === 'boss' ? 'epic' : 'rare';
    return [
      { kind: 'bonus', bonus: 'overdrive', rarity: bonusRarity, title: text('bonus.overdrive'), body: text('bonus.overdrive.body'), levelLine: text('bonus.overdrive.line') },
      { kind: 'bonus', bonus: 'coins', rarity: 'rare', title: text('bonus.coins'), body: text('bonus.coins.body'), levelLine: text('bonus.coins.line') },
      { kind: 'bonus', bonus: 'heal', rarity: 'common', title: text('bonus.heal'), body: text('bonus.heal.body'), levelLine: text('bonus.heal.line') },
    ];
  }

  protected makeSettlement(cleared = this.stageFinished && this.player.hp > 0): Settlement {
    const infinite = this.runMode === 'infinite';
    const base = cleared ? 40 : 16;
    const bossBonus = infinite
      ? this.infiniteBossKills * 28
      : this.kind === 'normal'
        ? 0
        : 70 + this.chapter * 20;
    const rewardScale = this.practiceRun ? PRACTICE_REWARD_SCALE : 1;
    const bonusState = this.stageObjective?.state() ?? null;
    const bonusMet = this.stageObjective?.met(cleared) ?? false;
    const bonusPay = bonusMet ? bonusGold(this.chapter, this.stage) : 0;
    const gold = Math.floor((base + bossBonus + this.stageKills * 0.9 + this.stageCoinsEarned * 0.28 + this.chapter * 18 + this.stage * 8 + bonusPay) * rewardScale);
    const goldParts = {
      base: base * rewardScale,
      boss: bossBonus * rewardScale,
      kills: this.stageKills * 0.9 * rewardScale,
      coins: this.stageCoinsEarned * 0.28 * rewardScale,
      stage: (this.chapter * 18 + this.stage * 8) * rewardScale,
      bonus: bonusPay * rewardScale,
    };
    const xp = Math.floor((70 + this.stageKills * 1.1 + this.chapter * 24 + (infinite ? this.infiniteBossKills * 18 : this.kind === 'normal' ? 0 : 80)) * rewardScale);
    const gameComplete = !infinite && this.chapter === FINAL_CHAPTER && this.stage === FINAL_STAGE && cleared;
    return {
      runMode: this.runMode,
      seed: this.runSeed,
      chapter: this.chapter,
      stage: this.stage,
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
      practice: this.practiceRun,
      clearSeconds: this.elapsed,
      level: this.player.level,
      damageTaken: this.damageTakenTotal,
      goldParts,
      bonus: bonusState ? { goal: bonusState.goal, met: bonusMet } : null,
      damageBySkill: { ...this.damageBySkill },
    };
  }

  protected enrageBosses() {
    this.bossEnraged = true;
    if (this.rules.steppedEnrage) {
      this.enrageStep = 0;
      this.enrageSeconds = 0;
      this.raiseEnrage();
      const reinforcements = Math.min(14 + this.chapter * 3, Math.max(0, this.enemyCap() - this.enemies.length));
      for (let index = 0; index < reinforcements; index += 1) {
        this.spawnEnemy(1.4 + this.chapter * 0.55, index % 5 === 0 ? 'medium' : 'small');
      }
      // The silence zone warns first, so the player can step out of it (V3, SYS-11).
      this.pendingEnrageZone = { x: this.player.x, y: this.player.y, at: this.elapsed + ENRAGE_ZONE_WARNING_SECONDS };
      this.emit({ type: 'telegraph/ring', x: this.player.x, y: this.player.y, radius: 170, life: ENRAGE_ZONE_WARNING_SECONDS });
      this.emit({ type: 'boss/enraged', x: this.player.x, y: this.player.y });
      return;
    }
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
      slow: 1,
      triggered: false,
    });
    this.emit({ type: 'boss/enraged', x: this.player.x, y: this.player.y });
    this.emitSnapshot(true);
  }

  protected recalculateStats(fullHeal: boolean) {
    const previousMax = this.player.stats.maxHp;
    this.player.stats = buildStats(this.meta, this.runUpgrades, this.skills);
    if (fullHeal) {
      this.player.hp = this.player.stats.maxHp;
    } else if (previousMax > 0) {
      this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp);
    }
  }

  protected effectiveAttackSpeed() {
    return effectiveCoinFeverAttackSpeed(
      this.player.stats.attackSpeed,
      this.skills.coinFever?.awakened === true,
      this.coinFeverRushTimer,
    );
  }

  protected emitSnapshot(force: boolean) {
    if (!force && this.snapshotTimer > 0) return;
    this.snapshotTimer = 0.12;
    this.callbacks.onSnapshot(this.buildHudSnapshot());
  }

  protected buildHudSnapshot(): HudSnapshot {
    const boss = this.enemies.find((enemy) => enemy.isBoss && !enemy.legacyBoss && (this.kind !== 'normal' || enemy.boss?.role === 'field'));
    const bossMove = boss ? this.activeBossPhaseMove(boss) : undefined;
    const activeEffects: ActiveStatusEffect[] = [
      ...(this.player.invuln > 0 ? [{ id: 'invulnerable', kind: 'buff' as const, label: 'effect.invulnerable' as const, remaining: this.player.invuln }] : []),
      ...(this.player.shield > 0 ? [{ id: 'shield', kind: 'buff' as const, label: 'effect.shield' as const, remaining: this.player.shield }] : []),
      ...(this.coinFeverRushTimer > 0 ? [{ id: 'coin-fever', kind: 'buff' as const, label: 'effect.coinFever' as const, remaining: this.coinFeverRushTimer }] : []),
      ...(this.cheatGodMode ? [{ id: 'god', kind: 'buff' as const, label: 'effect.god' as const, value: 'ON' }] : []),
      ...(this.player.root > 0 ? [{ id: 'root', kind: 'debuff' as const, label: 'effect.root' as const, remaining: this.player.root }] : []),
      ...(this.player.slow < 0.99 ? [{ id: 'slow', kind: 'debuff' as const, label: 'effect.slow' as const, value: `-${Math.round((1 - this.player.slow) * 100)}%` }] : []),
      ...(this.player.silence > 0 ? [{ id: 'silence', kind: 'debuff' as const, label: 'effect.silence' as const, remaining: this.player.silence }] : []),
    ];
    const infiniteDifficulty = this.runMode === 'infinite'
      ? infiniteDifficultyAt(this.elapsed, this.infiniteBossKills)
      : null;
    return {
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
      bonus: this.stageObjective?.state() ?? null,
      landmark: this.stageObjective ? this.landmarkId() : null,
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
      practice: this.practiceRun,
      bossName: boss?.boss?.name,
      bossId: boss?.boss?.id,
      bossPhase: boss ? boss.bossPhase ?? 1 : undefined,
      bossEnrage: boss ? (this.bossEnraged ? (this.rules.steppedEnrage ? this.enrageStep : 1) : 0) : undefined,
      bossEnrageSteps: boss ? (this.rules.steppedEnrage ? ENRAGE_STEPS : 1) : undefined,
      bossMove: bossMove?.attackGrammar,
      bossMoveName: this.rules.bossMoves && bossMove && IMPLEMENTED_GRAMMARS.has(bossMove.attackGrammar) ? bossMove.name : undefined,
      bossHp: boss?.hp,
      bossMaxHp: boss?.maxHp,
      skills: { ...this.skills },
      cooldowns: this.hudCooldowns(),
      runUpgrades: { ...this.runUpgrades },
      stats: { ...this.player.stats, attackSpeed: this.effectiveAttackSpeed() },
      activeEffects,
    };
  }

  protected hudCooldowns() {
    const shares: Partial<Record<SkillId, number>> = {};
    for (const id of SKILL_IDS) {
      if (!this.skills[id] || !SKILLS[id].active) continue;
      const remaining = this.skillCooldowns[id] ?? 0;
      // A reading above the last one means a new cooldown started since the last snapshot.
      if (remaining > (this.hudCooldownLast[id] ?? 0) + 1e-6) this.hudCooldownSpans[id] = remaining;
      this.hudCooldownLast[id] = remaining;
      const span = this.hudCooldownSpans[id] ?? 0;
      shares[id] = span >= 0.5 ? clamp(remaining / span, 0, 1) : 0;
    }
    return shares;
  }

  protected render(alpha = 1) {
    this.worldRenderer.draw(this.ctx, this.buildRenderWorld(alpha));
  }

  /** Read-only view of this frame for the renderer (TEC-02). Arrays are live references, never copies. */
  protected buildRenderWorld(alpha: number): RenderWorld {
    return {
      alpha,
      view: { width: this.viewW, height: this.viewH, dpr: this.dpr, frame: this.viewFrame() },
      worldSize: WORLD_SIZE,
      chapter: this.chapter,
      elapsed: this.elapsed,
      paused: this.paused,
      bossEnraged: this.bossEnraged,
      jitterEveryFrame: !this.rules.isolatedCosmeticIds,
      airShots: this.rules.obstacleCover,
      reducedMotion: this.systemReducedMotion || this.options.reducedMotion,
      options: this.options,
      camera: this.shownCamera(),
      player: this.player,
      aim: { angle: this.playerAimAngle, targetId: this.aimTargetId },
      skills: this.skills,
      enemies: this.enemies,
      projectiles: this.projectiles,
      bossProjectiles: this.bossProjectiles,
      pickups: this.pickups,
      hazards: this.hazards,
      obstacles: this.obstacles,
      beams: this.beams,
      laneTelegraphs: this.laneTelegraphs,
      chains: this.chains,
      objectiveMarks: this.stageObjective?.marks() ?? NO_MARKS,
      effects: this.presentation,
    };
  }

  /** Reports a game event to presentation and subscribers; events never change the simulation. */
  protected emit(event: GameEvent) {
    this.presentation.handle(event);
    for (const listener of this.eventListeners) listener(event);
  }

  /** Subscribes to the game event stream (tools, replays, telemetry). Returns an unsubscribe function. */
  subscribe(listener: GameEventListener) {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  protected nextId() {
    this.idSeed += 1;
    return this.idSeed;
  }

  protected nextCosmeticId() {
    if (!this.rules.isolatedCosmeticIds) return this.nextId();
    this.cosmeticIdSeed += 1;
    return this.cosmeticIdSeed;
  }
}
