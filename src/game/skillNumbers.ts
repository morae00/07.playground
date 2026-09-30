// Skill numbers and the draft-card copy generated from them (BUG-16).
// The engine reads every number a player can see on a card from SKILL_NUMBERS, and the level and awakening
// lines below are rendered from the same entries, so a description can no longer drift from what the skill does.
// Damage entries are coefficients of the player's attack; per-level entries are the total at that level.
import type { SkillId } from './GameEngine.ts';
import {
  COIN_FEVER_FRENZY_ATTACK_SPEED_MULTIPLIER,
  COIN_FEVER_FRENZY_DURATION,
  PAPER_WARD_INVULNERABILITY_PER_LEVEL,
} from './p1Core.ts';

/** base + perLevel × level, plus a flat bonus once awakened. */
export type Scaling = Readonly<{ base: number; perLevel: number; awakened?: number }>;

export function scaleAt(scaling: Scaling, level: number, awakened = false) {
  return scaling.base + level * scaling.perLevel + (awakened ? (scaling.awakened ?? 0) : 0);
}

export const SKILL_NUMBERS = Object.freeze({
  needleStorm: {
    damage: { base: 0.85, perLevel: 0.18, awakened: 0.4 },
    extraNeedleLevels: [3, 5],
    awakenedNeedles: 2,
    awakenedPierce: 1,
    shardDamage: 0.35,
    shardRange: 220,
  },
  fanKnives: {
    knives: { base: 3, perLevel: 1, awakened: 3 },
    cooldownPerLevel: 0.04,
  },
  chainSpark: {
    jumps: { base: 2, perLevel: 1, awakened: 2 },
    damage: { base: 0.95, perLevel: 0.14, awakened: 0.28 },
    stunSeconds: 0.45,
  },
  frostLine: {
    width: { base: 12, perLevel: 3, awakened: 8 },
    slow: { base: 0.25, perLevel: 0.07 },
    slowCap: 0.7,
    rootSeconds: 0.26,
  },
  orbitScythes: {
    blades: { base: 1, perLevel: 1 },
    awakenedOuterBlades: 3,
    radius: { base: 72, perLevel: 10 },
  },
  boneMortar: {
    radius: { base: 86, perLevel: 12, awakened: 34 },
    damage: { base: 1.35, perLevel: 0.22, awakened: 0.55 },
    aftershockDamage: 0.65,
  },
  railSpear: {
    width: { base: 18, perLevel: 3, awakened: 12 },
    damage: { base: 2.15, perLevel: 0.32, awakened: 0.8 },
    fissureDamage: 0.42,
  },
  mirrorClone: {
    damage: { base: 0.72, perLevel: 0.18 },
    basePierce: 1,
    cloneOffset: 42,
    awakenedShots: 2,
    awakenedPierce: 1,
    railCopyChance: 0.3,
    railCopyDamage: 0.35,
  },
  voidMine: {
    radius: { base: 92, perLevel: 11, awakened: 30 },
    duration: { base: 2.4, perLevel: 0.25, awakened: 0.9 },
    pull: { base: 74, perLevel: 14, awakened: 36 },
    collapseDamage: 1.6,
  },
  blackSun: {
    radius: { base: 116, perLevel: 14, awakened: 42 },
    duration: { base: 3.2, perLevel: 0.35, awakened: 1.2 },
    pull: { base: 74, perLevel: 16, awakened: 55 },
    collapseDamage: 2.4,
  },
  ironFrame: {
    defense: { base: 0, perLevel: 1.2, awakened: 3.5 },
    maxHp: { base: 0, perLevel: 18, awakened: 40 },
    shieldSeconds: 0.36,
  },
  magnetSigil: {
    magnet: { base: 0, perLevel: 36, awakened: 180 },
    coinGain: { base: 0, perLevel: 0.04, awakened: 0.15 },
    pulseSeconds: 4.8,
  },
  paperWard: {
    defense: { base: 0, perLevel: 1, awakened: 2.5 },
    pushRadius: 140,
  },
  recoveryThread: {
    regen: { base: 0, perLevel: 0.65, awakened: 2.4 },
    magnet: { base: 0, perLevel: 14, awakened: 60 },
    counterSeconds: 2.2,
  },
  coinFever: {
    coinGain: { base: 0, perLevel: 0.09 },
    attackSpeed: { base: 0, perLevel: 0.04 },
  },
  eclipseStep: {
    radius: { base: 128, perLevel: 16, awakened: 55 },
    invulnerability: { base: 0.28, perLevel: 0.05 },
    afterimageDamage: 0.72,
  },
  executionMark: {
    critChance: { base: 0, perLevel: 0.03, awakened: 0.1 },
    bossDamage: { base: 0, perLevel: 0.07, awakened: 0.2 },
    lowHpBossBonus: 0.45,
  },
});

const N = SKILL_NUMBERS;

export function needleCount(level: number, awakened: boolean) {
  const extra = N.needleStorm.extraNeedleLevels.filter((threshold) => level >= threshold).length;
  return 1 + extra + (awakened ? N.needleStorm.awakenedNeedles : 0);
}

export function frostLineSlow(level: number) {
  return Math.min(N.frostLine.slowCap, scaleAt(N.frostLine.slow, level));
}

/** Mirror clone volley: two parallel flank shots; the reworked awakening adds aimed shots and pierce. */
export function mirrorCloneVolley(level: number, reworkedAwakening: boolean) {
  const m = N.mirrorClone;
  return {
    flankShots: 2,
    aimedShots: reworkedAwakening ? m.awakenedShots : 0,
    pierce: m.basePierce + Math.floor(level / 2) + (reworkedAwakening ? m.awakenedPierce : 0),
  };
}

/** Up to two decimals without float noise: 1.0499999999999998 -> "1.05", 3.5999999999999996 -> "3.6". */
export function formatNumber(value: number, digits = 2) {
  return String(Number(value.toFixed(digits)));
}

export function formatPercent(ratio: number, digits = 0) {
  return formatNumber(ratio * 100, digits);
}

const num = formatNumber;
const pct = formatPercent;
const gain = (scaling: Scaling, level: number) => level * scaling.perLevel;
/** Growth relative to the level-0 value, for stats that have no natural unit on screen (pull strength). */
const relative = (scaling: Scaling, level: number) => gain(scaling, level) / scaling.base;

export const SKILL_LEVEL_TEXT: Record<SkillId, (level: number) => string> = {
  needleStorm: (level) => `피해 +${pct(gain(N.needleStorm.damage, level))}%, 투사체 ${needleCount(level, false)}개`,
  fanKnives: (level) => `단검 ${num(scaleAt(N.fanKnives.knives, level))}개, 재사용 대기 -${num(level * N.fanKnives.cooldownPerLevel)}s`,
  chainSpark: (level) => `연쇄 ${num(scaleAt(N.chainSpark.jumps, level))}회, 피해 +${pct(gain(N.chainSpark.damage, level))}%`,
  frostLine: (level) => `폭 +${num(gain(N.frostLine.width, level))}, 감속 ${pct(frostLineSlow(level))}%`,
  orbitScythes: (level) => `날 ${num(scaleAt(N.orbitScythes.blades, level))}개, 궤도 반경 +${num(gain(N.orbitScythes.radius, level))}`,
  boneMortar: (level) => `폭발 반경 +${num(gain(N.boneMortar.radius, level))}, 피해 +${pct(gain(N.boneMortar.damage, level))}%`,
  railSpear: (level) => `폭 +${num(gain(N.railSpear.width, level))}, 피해 +${pct(gain(N.railSpear.damage, level))}%`,
  mirrorClone: (level) => `분신 사격 피해 +${pct(gain(N.mirrorClone.damage, level))}%, 관통 +${Math.floor(level / 2)}`,
  voidMine: (level) => `지속 +${num(gain(N.voidMine.duration, level))}s, 흡입력 +${pct(relative(N.voidMine.pull, level))}%`,
  blackSun: (level) => `지속 +${num(gain(N.blackSun.duration, level))}s, 흡입력 +${pct(relative(N.blackSun.pull, level))}%`,
  ironFrame: (level) => `방어 +${num(scaleAt(N.ironFrame.defense, level))}, 최대 체력 +${num(scaleAt(N.ironFrame.maxHp, level))}`,
  magnetSigil: (level) => `획득 반경 +${num(scaleAt(N.magnetSigil.magnet, level))}, 코인 획득 +${pct(scaleAt(N.magnetSigil.coinGain, level))}%`,
  paperWard: (level) => `방어 +${num(scaleAt(N.paperWard.defense, level))}, 피격 무적 +${num(level * PAPER_WARD_INVULNERABILITY_PER_LEVEL)}s`,
  recoveryThread: (level) => `초당 회복 +${num(scaleAt(N.recoveryThread.regen, level))}, 자석 +${num(scaleAt(N.recoveryThread.magnet, level))}`,
  coinFever: (level) => `코인 +${pct(scaleAt(N.coinFever.coinGain, level))}%, 공격속도 +${pct(scaleAt(N.coinFever.attackSpeed, level))}%`,
  eclipseStep: (level) => `베기 반경 +${num(gain(N.eclipseStep.radius, level))}, 무적 +${num(gain(N.eclipseStep.invulnerability, level))}s`,
  executionMark: (level) => `치명타 +${pct(scaleAt(N.executionMark.critChance, level))}%, 보스 피해 +${pct(scaleAt(N.executionMark.bossDamage, level))}%`,
};

const bonus = (scaling: Scaling) => scaling.awakened ?? 0;

export const SKILL_AWAKENING_TEXT: Record<SkillId, string> = {
  needleStorm: `바늘 +${N.needleStorm.awakenedNeedles}개 부채꼴 난사, 피해 +${pct(bonus(N.needleStorm.damage))}%, 관통 ${N.needleStorm.awakenedPierce}회. 적중 시 파편이 주변 적 하나를 ${pct(N.needleStorm.shardDamage)}% 피해로 추가로 찌릅니다.`,
  fanKnives: `단검 +${num(bonus(N.fanKnives.knives))}개. 단검이 되돌아오며 후방의 적도 베어냅니다.`,
  chainSpark: `연쇄 +${num(bonus(N.chainSpark.jumps))}회, 피해 +${pct(bonus(N.chainSpark.damage))}%. 마지막 연쇄가 폭발하고 ${num(N.chainSpark.stunSeconds)}초 기절을 남깁니다.`,
  frostLine: `폭 +${num(bonus(N.frostLine.width))}. 절단선이 남긴 서리가 적을 ${num(N.frostLine.rootSeconds)}초 속박합니다.`,
  orbitScythes: `반대 방향으로 도는 외곽 날 ${N.orbitScythes.awakenedOuterBlades}개가 추가됩니다.`,
  boneMortar: `폭발 반경 +${num(bonus(N.boneMortar.radius))}, 피해 +${pct(bonus(N.boneMortar.damage))}%. 폭발 중심에 ${pct(N.boneMortar.aftershockDamage)}% 충격파가 한 번 더 터집니다.`,
  railSpear: `폭 +${num(bonus(N.railSpear.width))}, 피해 +${pct(bonus(N.railSpear.damage))}%. 레일이 지나간 자리에 ${pct(N.railSpear.fissureDamage)}% 균열 폭발이 이어집니다.`,
  mirrorClone: `분신이 목표를 조준하는 사격 +${N.mirrorClone.awakenedShots}발, 관통 +${N.mirrorClone.awakenedPierce}. 흑선 레일 보유 시 ${pct(N.mirrorClone.railCopyChance)}% 확률로 레일을 ${pct(N.mirrorClone.railCopyDamage)}% 피해로 복제합니다.`,
  voidMine: `반경 +${num(bonus(N.voidMine.radius))}, 지속 +${num(bonus(N.voidMine.duration))}s. 지뢰장이 사라질 때 처형 폭발을 일으킵니다.`,
  blackSun: `반경 +${num(bonus(N.blackSun.radius))}, 지속 +${num(bonus(N.blackSun.duration))}s. 붕괴 순간 최대 체력 비례 피해와 긴 감속을 겹칩니다.`,
  ironFrame: `방어 +${num(bonus(N.ironFrame.defense))}, 최대 체력 +${num(bonus(N.ironFrame.maxHp))}. 피격 직후 ${num(N.ironFrame.shieldSeconds)}초 보호막을 만듭니다.`,
  magnetSigil: `획득 반경 +${num(bonus(N.magnetSigil.magnet))}, 코인 +${pct(bonus(N.magnetSigil.coinGain))}%. 기본 ${num(N.magnetSigil.pulseSeconds)}초마다 맵 위 보상을 강하게 당깁니다.`,
  paperWard: `방어 +${num(bonus(N.paperWard.defense))}. 피격 시 반경 ${N.paperWard.pushRadius}의 적을 밀쳐내는 종이 파열이 발생합니다.`,
  recoveryThread: `초당 회복 +${num(bonus(N.recoveryThread.regen))}, 자석 +${num(bonus(N.recoveryThread.magnet))}. 체력이 가득 찬 동안 기본 ${num(N.recoveryThread.counterSeconds)}초마다 주변으로 반격선을 뿌립니다.`,
  coinFever: `코인을 먹으면 ${num(COIN_FEVER_FRENZY_DURATION)}초 동안 공격속도가 ${pct(COIN_FEVER_FRENZY_ATTACK_SPEED_MULTIPLIER - 1)}% 폭주합니다.`,
  eclipseStep: `베기 반경 +${num(bonus(N.eclipseStep.radius))}. 베기 후 검은 잔상이 ${pct(N.eclipseStep.afterimageDamage)}% 피해로 한 번 더 전장을 훑습니다.`,
  executionMark: `치명타 +${pct(bonus(N.executionMark.critChance))}%, 보스 피해 +${pct(bonus(N.executionMark.bossDamage))}%. 낮은 체력의 보스에게 최대 ${pct(N.executionMark.lowHpBossBonus)}% 추가 피해를 줍니다.`,
};

/** Classic rules (0.1.0) keep the old mirror clone awakening, which only copies rail shots. */
export const CLASSIC_AWAKENING_TEXT: Partial<Record<SkillId, string>> = {
  mirrorClone: `흑선 레일 보유 시 분신이 ${pct(N.mirrorClone.railCopyChance)}% 확률로 레일을 ${pct(N.mirrorClone.railCopyDamage)}% 피해로 복제합니다. 레일이 없으면 효과가 없습니다.`,
};
