import { createHash } from 'node:crypto';
import { createHeadlessCanvas, installHeadlessPlatform, standardOptions } from './headless-engine.mjs';
import { DEFAULT_SEEDS, DEFAULT_STAGE_ADDRESSES } from './balance-runner.mjs';

export const DEFAULT_FULL_SEEDS = Object.freeze([
  ...DEFAULT_SEEDS,
  101,
  997,
  4_099,
  104_729,
  524_287,
  999_983,
  2_147_483_647,
]);

export const BALANCE_PERSONAS = Object.freeze([
  Object.freeze({ id: 'striker', skillPriority: ['blackSun', 'railSpear', 'boneMortar', 'chainSpark', 'needleStorm', 'fanKnives'], movePeriod: 150 }),
  Object.freeze({ id: 'survivor', skillPriority: ['ironFrame', 'paperWard', 'recoveryThread', 'frostLine', 'orbitScythes'], movePeriod: 210 }),
  Object.freeze({ id: 'collector', skillPriority: ['coinFever', 'needleStorm', 'mirrorClone', 'magnetSigil', 'recoveryThread'], movePeriod: 120 }),
]);

const ACTIVE_SKILLS = new Set([
  'needleStorm', 'fanKnives', 'chainSpark', 'frostLine', 'orbitScythes',
  'boneMortar', 'railSpear', 'mirrorClone', 'voidMine', 'blackSun', 'eclipseStep',
]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function percentile(values, ratio) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor((sorted.length - 1) * ratio)];
}

function round(value, digits = 3) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function scenarioSeed(chapter, stage, personaIndex, baseSeed) {
  return ((((chapter * 100_000) + (stage * 1_000) + (personaIndex + 1) * 97 + baseSeed) >>> 0) || 1);
}

function progressionMeta(chapter, persona) {
  const tier = chapter - 1;
  const attackBias = persona.id === 'striker' ? 3 : 0;
  const defenseBias = persona.id === 'survivor' ? 3 : 0;
  const utilityBias = persona.id === 'collector' ? 3 : 0;
  return {
    gold: 0,
    xp: 0,
    level: 1,
    passivePoints: 0,
    progress: { chapter: 5, stage: 10 },
    upgrades: {
      attack: clamp(3 + tier * 6 + attackBias, 0, 30),
      defense: clamp(2 + tier * 5 + defenseBias, 0, 25),
      maxHp: clamp(3 + tier * 6 + defenseBias, 0, 30),
      moveSpeed: clamp(2 + tier * 4, 0, 20),
      crit: clamp(1 + tier * 4 + attackBias, 0, 20),
      regen: clamp(2 + tier * 4 + defenseBias, 0, 20),
      magnet: clamp(3 + tier * 5 + utilityBias, 0, 25),
    },
    passives: {
      rareLuck: clamp(tier + (persona.id === 'striker' ? 1 : 0), 0, 5),
      bossHunter: clamp(tier + (persona.id === 'striker' ? 1 : 0), 0, 5),
      coinMagnet: clamp(tier + (persona.id === 'collector' ? 1 : 0), 0, 5),
    },
  };
}

export function selectBalanceOffer(cards, persona, snapshot) {
  const ownedActiveSkills = Object.keys(snapshot?.skills ?? {}).filter((skillId) => ACTIVE_SKILLS.has(skillId));
  const viableCards = ownedActiveSkills.length < 3
    ? cards.filter((card) => card.kind !== 'bonus' && ACTIVE_SKILLS.has(card.skillId))
    : cards;
  const candidates = viableCards.length > 0 ? viableCards : cards;
  const ranked = [...candidates].sort((left, right) => {
    const leftIndex = left.kind === 'bonus'
      ? persona.id === 'survivor' && left.bonus === 'heal' ? 2 : 100
      : persona.skillPriority.indexOf(left.skillId);
    const rightIndex = right.kind === 'bonus'
      ? persona.id === 'survivor' && right.bonus === 'heal' ? 2 : 100
      : persona.skillPriority.indexOf(right.skillId);
    const safeLeft = leftIndex < 0 ? 80 : leftIndex;
    const safeRight = rightIndex < 0 ? 80 : rightIndex;
    return safeLeft - safeRight;
  });
  return ranked[0];
}

function updateMovement(engine, frame, personaIndex, persona) {
  engine.keys.clear();
  const directions = persona.id === 'survivor' ? ['a', 'w', 'd', 's'] : persona.id === 'collector' ? ['w', 'd', 's', 'a'] : ['d', 's', 'a', 'w'];
  engine.keys.add(directions[(Math.floor(frame / persona.movePeriod) + personaIndex) % directions.length]);
}

function summarizeGroup(scenarios) {
  const total = scenarios.length || 1;
  return {
    scenarios: scenarios.length,
    clearRate: round(scenarios.filter((item) => item.outcome === 'clear').length / total, 4),
    deathRate: round(scenarios.filter((item) => item.outcome === 'death').length / total, 4),
    timeoutRate: round(scenarios.filter((item) => item.outcome === 'timeout').length / total, 4),
    elapsed: {
      p10: round(percentile(scenarios.map((item) => item.elapsed), 0.1)),
      p50: round(percentile(scenarios.map((item) => item.elapsed), 0.5)),
      p90: round(percentile(scenarios.map((item) => item.elapsed), 0.9)),
    },
    kills: {
      p10: percentile(scenarios.map((item) => item.kills), 0.1),
      p50: percentile(scenarios.map((item) => item.kills), 0.5),
      p90: percentile(scenarios.map((item) => item.kills), 0.9),
    },
    coins: {
      p10: percentile(scenarios.map((item) => item.coins), 0.1),
      p50: percentile(scenarios.map((item) => item.coins), 0.5),
      p90: percentile(scenarios.map((item) => item.coins), 0.9),
    },
  };
}

export function createFullBalanceReport({ scenarios, seeds, stages, personas, maxFrames, ruleSet = 'remaster' }) {
  const personaOrder = new Map(personas.map((persona, index) => [persona.id, index]));
  const seedOrder = new Map(seeds.map((seed, index) => [seed, index]));
  const orderedScenarios = [...scenarios].sort((left, right) => (
    left.chapter - right.chapter
    || left.stage - right.stage
    || (personaOrder.get(left.persona) ?? Number.MAX_SAFE_INTEGER) - (personaOrder.get(right.persona) ?? Number.MAX_SAFE_INTEGER)
    || (seedOrder.get(left.baseSeed) ?? Number.MAX_SAFE_INTEGER) - (seedOrder.get(right.baseSeed) ?? Number.MAX_SAFE_INTEGER)
    || left.seed - right.seed
  ));
  const byPersona = Object.fromEntries(personas.map((persona) => [persona.id, summarizeGroup(orderedScenarios.filter((item) => item.persona === persona.id))]));
  const byKind = Object.fromEntries(['normal', 'midBoss', 'finalBoss'].map((kind) => [kind, summarizeGroup(orderedScenarios.filter((item) => item.kind === kind))]));
  const summary = {
    ruleSet,
    scenarioCount: orderedScenarios.length,
    stageCount: stages.length,
    seedCount: seeds.length,
    personaCount: personas.length,
    maxFrames,
    overall: summarizeGroup(orderedScenarios),
    byPersona,
    byKind,
  };
  const gates = {
    completeMatrix: orderedScenarios.length === stages.length * seeds.length * personas.length,
    noInvalidOutcomes: orderedScenarios.every((item) => ['clear', 'death', 'timeout'].includes(item.outcome)),
    noTimeouts: orderedScenarios.every((item) => item.outcome !== 'timeout'),
    buildGrowthObserved: orderedScenarios.some((item) => item.skillCount > 1),
    personaClearsObserved: personas.every((persona) => orderedScenarios.some((item) => item.persona === persona.id && item.outcome === 'clear')),
    stageKindClearsObserved: [...new Set(orderedScenarios.map((item) => item.kind))].every((kind) => orderedScenarios.some((item) => item.kind === kind && item.outcome === 'clear')),
  };
  const outliers = [...orderedScenarios]
    .sort((left, right) => (right.outcome === 'timeout') - (left.outcome === 'timeout') || right.elapsed - left.elapsed)
    .slice(0, 20);
  const fingerprint = createHash('sha256').update(JSON.stringify({ summary, scenarios: orderedScenarios })).digest('hex').slice(0, 16);
  return { version: 1, fingerprint, summary, gates, outliers, scenarios: orderedScenarios };
}

export async function runFullBalanceBatch({
  bundlePath = '/tmp/blackline-survivor-p0/App.mjs',
  seeds = DEFAULT_FULL_SEEDS,
  stages = DEFAULT_STAGE_ADDRESSES,
  personas = BALANCE_PERSONAS,
  maxFrames = 72_000,
  ruleSet = process.env.BALANCE_RULES ?? 'remaster',
} = {}) {
  installHeadlessPlatform();
  const { GameEngine } = await import(bundlePath);
  const scenarios = [];

  for (const address of stages) {
    for (let personaIndex = 0; personaIndex < personas.length; personaIndex += 1) {
      const persona = personas[personaIndex];
      for (const baseSeed of seeds) {
        let engine;
        let outcome = 'timeout';
        let latestSnapshot;
        let settlement;
        engine = new GameEngine(createHeadlessCanvas(), progressionMeta(address.chapter, persona), standardOptions(), {
          onSnapshot(snapshot) { latestSnapshot = snapshot; },
          onDraft(draft) {
            const offer = selectBalanceOffer(draft.cards, persona, latestSnapshot);
            if (!offer) throw new Error(`Draft ${draft.id} contained no offer`);
            engine.completeDraft(offer, draft.id);
          },
          onRoundClear(result) { outcome = 'clear'; settlement = result; },
          onGameOver(result) { outcome = 'death'; settlement = result; },
        });

        const seed = scenarioSeed(address.chapter, address.stage, personaIndex, baseSeed);
        engine.setRuleSet?.(ruleSet);
        engine.startRun(address.chapter, address.stage, seed);
        let frame = 0;
        for (; frame < maxFrames && outcome === 'timeout'; frame += 1) {
          updateMovement(engine, frame, personaIndex, persona);
          engine.advanceFrame(1 / 60, false);
        }
        const diagnostics = engine.getDiagnostics();
        const mainBoss = engine.enemies.find((enemy) => enemy.isBoss && !enemy.legacyBoss);
        const scenario = {
          chapter: address.chapter,
          stage: address.stage,
          kind: latestSnapshot?.stageKind ?? 'unknown',
          persona: persona.id,
          baseSeed,
          seed,
          outcome,
          frames: frame,
          elapsed: round(diagnostics.elapsed),
          kills: settlement?.kills ?? engine.player.kills,
          coins: settlement?.coins ?? engine.player.coins,
          hpRatio: round(engine.player.hp / Math.max(1, engine.player.stats.maxHp), 5),
          bossHpRatio: mainBoss ? round(mainBoss.hp / mainBoss.maxHp, 5) : null,
          skillCount: latestSnapshot ? Object.keys(latestSnapshot.skills).length : 0,
          skills: latestSnapshot ? Object.keys(latestSnapshot.skills).sort() : [],
        };
        for (const [key, value] of Object.entries(scenario)) {
          if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`Non-finite ${key} in ${JSON.stringify(scenario)}`);
        }
        scenarios.push(scenario);
        engine.dispose();
      }
    }
  }

  return createFullBalanceReport({ scenarios, seeds, stages, personas, maxFrames, ruleSet });
}
