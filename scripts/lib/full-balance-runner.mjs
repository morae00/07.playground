import { createHash } from 'node:crypto';
import { createHeadlessCanvas, holdDirection, installHeadlessPlatform, standardOptions } from './headless-engine.mjs';
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
  // A new player: no permanent upgrades or passives at any chapter (CON-09).
  Object.freeze({ id: 'fresh', skillPriority: ['needleStorm', 'chainSpark', 'fanKnives', 'ironFrame', 'recoveryThread'], movePeriod: 180, freshMeta: true }),
]);

/**
 * Opt-in personas for focused questions, outside the default matrix so baselines stay comparable. Pick them with
 * BALANCE_FULL_PERSONAS (ids, comma separated).
 * - novice: a new player (fresh meta) who steers away from nearby threats instead of walking a fixed square. It is
 *   the proxy for the R1 new-player gate (CON-02); human playtests still decide it.
 */
export const EXTRA_PERSONAS = Object.freeze([
  Object.freeze({ id: 'novice', skillPriority: ['needleStorm', 'chainSpark', 'fanKnives', 'ironFrame', 'recoveryThread'], movePeriod: 180, freshMeta: true, evasive: true }),
  // SYS-07: every permanent upgrade and passive at its cap, the striker's picks; the R3 gate for a threatening Ch5.
  Object.freeze({ id: 'maxed', skillPriority: ['blackSun', 'railSpear', 'boneMortar', 'chainSpark', 'needleStorm', 'fanKnives'], movePeriod: 150, maxedMeta: true }),
]);

/** Personas by id from the default and opt-in lists, in the order given. */
export function personasById(ids) {
  const all = [...BALANCE_PERSONAS, ...EXTRA_PERSONAS];
  return ids.map((id) => {
    const persona = all.find((candidate) => candidate.id === id);
    if (!persona) throw new TypeError(`Unknown balance persona: ${id}`);
    return persona;
  });
}

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

/** The account level a meta's passives imply: one passive point a level (SYS-08 tokens unlock at 8 and 16). */
function withAccountLevel(meta) {
  return { ...meta, level: 1 + Object.values(meta.passives).reduce((sum, points) => sum + points, 0) };
}

function progressionMeta(chapter, persona) {
  return withAccountLevel(progressionBase(chapter, persona));
}

function progressionBase(chapter, persona) {
  if (persona.maxedMeta) {
    return {
      gold: 0,
      xp: 0,
      level: 1,
      passivePoints: 0,
      progress: { chapter: 5, stage: 10 },
      upgrades: { attack: 30, defense: 25, maxHp: 30, moveSpeed: 20, crit: 20, regen: 20, magnet: 25 },
      // Every point of the CON-07 passive tree (ten a branch).
      passives: { rareLuck: 10, bossHunter: 10, coinMagnet: 10 },
    };
  }
  if (persona.freshMeta) {
    return {
      gold: 0,
      xp: 0,
      level: 1,
      passivePoints: 0,
      progress: { chapter: 5, stage: 10 },
      upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
      passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
    };
  }
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

/** How much a persona wants a card: lower is better. A fusion awakening (SYS-08) comes first. */
function offerRank(card, persona) {
  if (card.kind === 'fusion') return -1;
  if (card.kind === 'bonus') return persona.id === 'survivor' && card.bonus === 'heal' ? 2 : 100;
  const index = persona.skillPriority.indexOf(card.skillId);
  return index < 0 ? 80 : index;
}

export function selectBalanceOffer(cards, persona, snapshot) {
  const ownedActiveSkills = Object.keys(snapshot?.skills ?? {}).filter((skillId) => ACTIVE_SKILLS.has(skillId));
  const viableCards = ownedActiveSkills.length < 3
    ? cards.filter((card) => card.kind !== 'bonus' && ACTIVE_SKILLS.has(card.skillId))
    : cards;
  const candidates = viableCards.length > 0 ? viableCards : cards;
  const ranked = [...candidates].sort((left, right) => offerRank(left, persona) - offerRank(right, persona));
  return ranked[0];
}

/** SYS-08: a persona spends a token to redraw a draft whose best card is outside its plan. */
function wantsRedraw(cards, persona) {
  return Math.min(...cards.map((card) => offerRank(card, persona))) >= 80;
}

function updateMovement(engine, frame, personaIndex, persona, context) {
  if (persona.evasive) {
    evasiveMovement(engine, frame, context);
    return;
  }
  const directions = persona.id === 'survivor' ? ['a', 'w', 'd', 's'] : persona.id === 'collector' ? ['w', 'd', 's', 'a'] : ['d', 's', 'a', 'w'];
  holdDirection(engine, directions[(Math.floor(frame / persona.movePeriod) + personaIndex) % directions.length]);
}

/**
 * The novice steers with the analog stick every 0.1 s: away from enemies within reach (bosses and dashing chargers
 * count more), away from hostile shots, circling the threat instead of backing straight off, and pulled back from
 * the walls. With nothing near it drifts round the arena centre.
 */
function evasiveMovement(engine, frame, context) {
  if (frame % 6 !== 0) return;
  const player = engine.player;
  let fx = 0;
  let fy = 0;
  const push = (x, y, reach, weight) => {
    const dx = player.x - x;
    const dy = player.y - y;
    const d = Math.hypot(dx, dy);
    if (d >= reach || d < 1e-6) return;
    const closeness = (reach - d) / reach;
    fx += (dx / d) * closeness * closeness * weight;
    fy += (dy / d) * closeness * closeness * weight;
  };
  for (const enemy of engine.enemies) {
    if (enemy.hp <= 0) continue;
    const dashing = enemy.patternPhase === 'warn' || enemy.patternPhase === 'dash';
    push(enemy.x, enemy.y, enemy.radius + (dashing ? 320 : 200), enemy.isBoss ? 3 : dashing ? 2 : 1);
  }
  for (const shot of engine.bossProjectiles) push(shot.x, shot.y, 150, 1.5);
  const threat = Math.hypot(fx, fy);
  let mx = fx;
  let my = fy;
  if (threat > 1e-6) {
    mx += (-fy / threat) * 0.7 * threat * context.turn;
    my += (fx / threat) * 0.7 * threat * context.turn;
  } else {
    const angle = frame * 0.004 * context.turn;
    mx = context.width / 2 + Math.cos(angle) * 450 - player.x;
    my = context.height / 2 + Math.sin(angle) * 450 - player.y;
  }
  const margin = 320;
  const scale = Math.max(1e-6, Math.hypot(mx, my));
  mx /= scale;
  my /= scale;
  if (player.x < margin) mx += ((margin - player.x) / margin) * 1.5;
  if (player.x > context.width - margin) mx -= ((player.x - (context.width - margin)) / margin) * 1.5;
  if (player.y < margin) my += ((margin - player.y) / margin) * 1.5;
  if (player.y > context.height - margin) my -= ((player.y - (context.height - margin)) / margin) * 1.5;
  const length = Math.hypot(mx, my);
  engine.dispatch({ type: 'input/analog', x: length > 1e-6 ? mx / length : 0, y: length > 1e-6 ? my / length : 0 });
}

function summarizeGroup(scenarios) {
  const total = scenarios.length || 1;
  const deaths = scenarios.filter((item) => item.outcome === 'death');
  const deathCauses = {};
  for (const item of deaths) {
    const cause = item.enraged ? `${item.deathCause}+enrage` : item.deathCause;
    deathCauses[cause] = (deathCauses[cause] ?? 0) + 1;
  }
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
    realSeconds: {
      p10: round(percentile(scenarios.map((item) => item.realSeconds), 0.1)),
      p50: round(percentile(scenarios.map((item) => item.realSeconds), 0.5)),
      p90: round(percentile(scenarios.map((item) => item.realSeconds), 0.9)),
    },
    drafts: { p50: percentile(scenarios.map((item) => item.drafts), 0.5) },
    // SYS-08: awakenings reached, and the share of bonus cards among the cards offered in the stage's second half.
    awakenings: { p50: percentile(scenarios.map((item) => item.awakenings), 0.5) },
    lateBonusShare: round(scenarios.reduce((sum, item) => sum + item.lateBonus, 0) / Math.max(1, scenarios.reduce((sum, item) => sum + item.lateCards, 0)), 4),
    deathCauses: Object.fromEntries(Object.entries(deathCauses).sort((left, right) => right[1] - left[1])),
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
  return { version: 2, fingerprint, summary, gates, outliers, scenarios: orderedScenarios };
}

export async function runFullBalanceBatch({
  bundlePath = '/tmp/blackline-survivor-p0/testing.mjs',
  seeds = DEFAULT_FULL_SEEDS,
  stages = DEFAULT_STAGE_ADDRESSES,
  personas = BALANCE_PERSONAS,
  maxFrames = 72_000,
  ruleSet = process.env.BALANCE_RULES ?? 'remaster',
} = {}) {
  installHeadlessPlatform();
  const { ProbedGameEngine } = await import(bundlePath);
  const scenarios = [];

  for (const address of stages) {
    for (let personaIndex = 0; personaIndex < personas.length; personaIndex += 1) {
      const persona = personas[personaIndex];
      for (const baseSeed of seeds) {
        let engine;
        let outcome = 'timeout';
        let latestSnapshot;
        let settlement;
        let drafts = 0;
        // SYS-08: cards offered in the second half of the stage clock, and how many of them were bonus cards.
        let lateCards = 0;
        let lateBonus = 0;
        let death = null;
        // SYS-07: the lowest health the run reached, and how many hits landed at the minimum 1.
        let lowestHp = 1;
        let hits = 0;
        let minimumHits = 0;
        engine = new ProbedGameEngine(createHeadlessCanvas(), progressionMeta(address.chapter, persona), standardOptions(), {
          onSnapshot(snapshot) {
            latestSnapshot = snapshot;
            lowestHp = Math.min(lowestHp, snapshot.hp / Math.max(1, snapshot.maxHp));
          },
          onDraft(draft) {
            // SYS-08: a redraw is the same draft again, so it is not counted twice.
            if (!draft.depth?.redraw) {
              drafts += 1;
              const { timeLeft, duration } = engine.probe.hud();
              if (duration > 0 && timeLeft <= duration / 2) {
                lateCards += draft.cards.length;
                lateBonus += draft.cards.filter((card) => card.kind === 'bonus').length;
              }
            }
            if (draft.depth?.tokens > 0 && wantsRedraw(draft.cards, persona) && engine.rerollDraft()) return;
            const offer = selectBalanceOffer(draft.cards, persona, latestSnapshot);
            if (!offer) throw new Error(`Draft ${draft.id} contained no offer`);
            engine.completeDraft(offer, draft.id);
          },
          onRoundClear(result) { outcome = 'clear'; settlement = result; },
          onGameOver(result) { outcome = 'death'; settlement = result; },
        });

        const seed = scenarioSeed(address.chapter, address.stage, personaIndex, baseSeed);
        engine.setRuleSet(ruleSet);
        // An experiment's rule flags on top of the rule set (the SYS-06 terrain A/B), as JSON.
        if (process.env.BALANCE_RULE_PATCH) engine.probe.patchRules(JSON.parse(process.env.BALANCE_RULE_PATCH));
        engine.subscribe((event) => {
          if (event.type === 'player/died') death = event;
          if (event.type === 'player/hurt') {
            hits += 1;
            if (event.damage <= 1 + 1e-9) minimumHits += 1;
          }
        });
        engine.startRun(address.chapter, address.stage, seed);
        const { worldSize } = engine.probe.renderWorld(1);
        const context = { turn: seed % 2 === 0 ? 1 : -1, width: worldSize.width, height: worldSize.height };
        let frame = 0;
        for (; frame < maxFrames && outcome === 'timeout'; frame += 1) {
          updateMovement(engine, frame, personaIndex, persona, context);
          engine.advanceFrame(1 / 60, false);
        }
        const diagnostics = engine.getDiagnostics();
        const world = engine.probe.read();
        const mainBoss = world.enemies.find((enemy) => enemy.isBoss && !enemy.legacyBoss);
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
          // Wall-clock seconds at 60 fps; elapsed is simulated time, which hit-stop slows (CON-09).
          realSeconds: round(frame / 60),
          drafts,
          deathCause: death?.source ?? null,
          enraged: death?.bossEnraged ?? false,
          kills: settlement?.kills ?? world.player.kills,
          coins: settlement?.coins ?? world.player.coins,
          hpRatio: round(world.player.hp / Math.max(1, world.player.stats.maxHp), 5),
          bossHpRatio: mainBoss ? round(mainBoss.hp / mainBoss.maxHp, 5) : null,
          // CON-03: whether the stage's bonus goal was met (null on stages without one).
          bonus: settlement?.bonus ? settlement.bonus.met : null,
          lowestHpRatio: round(Math.max(0, lowestHp), 4),
          hits,
          minimumHits,
          skillCount: latestSnapshot ? Object.keys(latestSnapshot.skills).length : 0,
          awakenings: latestSnapshot ? Object.values(latestSnapshot.skills).filter((skill) => skill?.awakened).length : 0,
          fusions: latestSnapshot?.fusions?.length ?? 0,
          level: latestSnapshot?.level ?? 1,
          lateCards,
          lateBonus,
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
