// What the menu shows about a stage and the account (UI-06), worked out from the game's rules without starting a run:
// the stage's boss, the least a clear pays, how far a chapter is cleared, and what the next upgrade level gives.
import {
  BOSS_ROUND_BOSSES,
  META_PASSIVES,
  PRACTICE_REWARD_SCALE,
  STAGES_PER_CHAPTER,
  buildStats,
  isStageUnlocked,
  makeRunUpgrades,
  stageIndex,
  stageKind,
  type StatBlock,
} from '../game/GameEngine';
import type { BossDef } from '../game/engine/worldTypes';
import { objectiveIdFor } from '../game/GameEngine';
import { bonusGoal, bonusTarget, objectiveDef, rangedCapFor } from '../game/stageObjective';
import { text, type StringKey, type Text } from '../i18n/text';
import type { MetaState, MetaUpgradeId, PassiveId } from '../platform/save';

export type StageStatus = 'cleared' | 'current' | 'open' | 'locked';

/** The boss a boss stage brings: the chapter's mid boss at St5, its final boss at St10. */
export function stageBoss(chapter: number, stage: number): BossDef | undefined {
  const kind = stageKind(stage);
  if (kind === 'normal') return undefined;
  return BOSS_ROUND_BOSSES.find((boss) => boss.chapter === chapter && boss.role === (kind === 'midBoss' ? 'mid' : 'final'));
}

/**
 * The least a clear pays: the settlement's gold and XP with no kills and no coins (GameEngine.makeSettlement's terms).
 * Practice pays PRACTICE_REWARD_SCALE of it. menuStage.test.ts checks this against a real settlement.
 */
export function stageRewardFloor(chapter: number, stage: number, practice: boolean) {
  const boss = stageKind(stage) !== 'normal';
  const scale = practice ? PRACTICE_REWARD_SCALE : 1;
  return {
    gold: Math.floor((40 + (boss ? 70 + chapter * 20 : 0) + chapter * 18 + stage * 8) * scale),
    xp: Math.floor((70 + chapter * 24 + (boss ? 80 : 0)) * scale),
  };
}

/**
 * A normal stage's objective on its card (CON-03): what the stage changes, which G9 asks the card to say, and its
 * bonus goal. The campaign's first stage keeps its goal without the changes (GameEngine.beginRound).
 */
export function stageObjective(chapter: number, stage: number): { goal: Text; changes: Text[] } | null {
  if (stageKind(stage) !== 'normal') return null;
  const def = objectiveDef(objectiveIdFor(chapter, stage));
  const changes: Text[] = [];
  if (!(chapter === 1 && stage === 1)) {
    if (def.mix?.small) changes.push(text('objective.mod.small', { n: Math.round(def.mix.small * 100) }));
    if (def.mix?.large) changes.push(text('objective.mod.large', { n: Math.round(def.mix.large * 100) }));
    if (def.spawnRate) changes.push(text('objective.mod.spawnRate', { x: def.spawnRate }));
    if (def.terrain) changes.push(text('objective.mod.terrain', { x: def.terrain }));
    if (def.rangedCap) changes.push(text('objective.mod.rangedCap', { n: rangedCapFor(def, chapter) }));
    if (def.fieldBoss) changes.push(text('objective.mod.fieldBoss', { x: def.fieldBoss.hp }));
    if (def.extraFieldBossMarks?.length) changes.push(text('objective.mod.extraFieldBoss', { n: def.extraFieldBossMarks.length }));
  }
  return { goal: bonusGoal(def.bonus, bonusTarget(def.bonus, chapter, def)), changes };
}

/** A stage before the unlocked frontier is cleared; the frontier itself is the one to play next. */
export function stageStatus(meta: MetaState, chapter: number, stage: number, developerAccess: boolean): StageStatus {
  const index = stageIndex(chapter, stage);
  const frontier = stageIndex(meta.progress.chapter, meta.progress.stage);
  if (index < frontier) return 'cleared';
  if (index === frontier) return 'current';
  return developerAccess || isStageUnlocked(meta, chapter, stage) ? 'open' : 'locked';
}

export function chapterCleared(meta: MetaState, chapter: number) {
  const frontier = stageIndex(meta.progress.chapter, meta.progress.stage);
  return Math.max(0, Math.min(STAGES_PER_CHAPTER, frontier - stageIndex(chapter, 1)));
}

type Effect = Readonly<{ stat: StringKey; from: string; to: string }>;

const percent = (value: number) => `${Math.round(value * 1000) / 10}%`;
const STAT_EFFECT: Record<MetaUpgradeId, readonly [StringKey, (stats: StatBlock) => string]> = {
  attack: ['stats.attack', (stats) => stats.attack.toFixed(1)],
  defense: ['stats.defense', (stats) => stats.defense.toFixed(1)],
  maxHp: ['stats.maxHp', (stats) => String(Math.round(stats.maxHp))],
  moveSpeed: ['stats.moveSpeed', (stats) => String(Math.round(stats.moveSpeed))],
  crit: ['stats.crit', (stats) => percent(stats.critChance)],
  regen: ['stats.regen', (stats) => `${stats.hpRegen.toFixed(1)}/s`],
  magnet: ['stats.magnet', (stats) => String(Math.round(stats.magnet))],
};
const PASSIVE_EFFECT: Partial<Record<PassiveId, readonly [StringKey, (stats: StatBlock) => string]>> = {
  bossHunter: ['stats.bossDamage', (stats) => percent(stats.bossDamage)],
  coinMagnet: ['stats.coinGain', (stats) => percent(stats.coinGain)],
};

function effect(meta: MetaState, next: MetaState, [stat, show]: readonly [StringKey, (stats: StatBlock) => string]): Effect {
  const run = makeRunUpgrades();
  return { stat, from: show(buildStats(meta, run, {})), to: show(buildStats(next, run, {})) };
}

/** What the next level of a permanent upgrade changes: its stat now and after the purchase. */
export function upgradeEffect(meta: MetaState, id: MetaUpgradeId): Effect {
  return effect(meta, { ...meta, upgrades: { ...meta.upgrades, [id]: meta.upgrades[id] + 1 } }, STAT_EFFECT[id]);
}

/** CON-07: the stats the passive tree's second nodes add to. */
const SECOND_NODE_EFFECT: Record<(typeof META_PASSIVES)[PassiveId]['next']['stat'], readonly [StringKey, (stats: StatBlock) => string]> = {
  critDamage: ['stats.critDamage', (stats) => `×${stats.critDamage.toFixed(2)}`],
  critChance: ['stats.crit', (stats) => percent(stats.critChance)],
  coinGain: ['stats.coinGain', (stats) => percent(stats.coinGain)],
};

/**
 * The same for a passive: its own effect for its first points, then its branch's second node (CON-07). The rare-skill
 * luck has no stat, so its first points show the level instead (null).
 */
export function passiveEffect(meta: MetaState, id: PassiveId): Effect | null {
  const { tier, next } = META_PASSIVES[id];
  const shown = meta.passives[id] >= tier ? SECOND_NODE_EFFECT[next.stat] : PASSIVE_EFFECT[id];
  return shown ? effect(meta, { ...meta, passives: { ...meta.passives, [id]: meta.passives[id] + 1 } }, shown) : null;
}

/** The stage path on the map, in percent of its box: a winding brush line with the boss stops (5, 10) lower and last. */
export const STAGE_PATH: readonly (readonly [number, number])[] = [
  [5, 64], [14, 34], [23, 40], [32, 62], [42, 72], [53, 42], [62, 22], [71, 44], [80, 66], [93, 38],
];

/** A smooth SVG path through points (Catmull-Rom as cubic Béziers), in a 100 × 100 box. */
export function smoothPath(points: readonly (readonly [number, number])[]) {
  if (points.length === 0) return '';
  const at = (index: number) => points[Math.max(0, Math.min(points.length - 1, index))];
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const [p0, p1, p2, p3] = [at(index - 1), at(index), at(index + 1), at(index + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}
