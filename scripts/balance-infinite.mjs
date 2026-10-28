// Endless pilot (CON-08): how long square-walking striker bots last in infinite runs, and what they score.
// Usage: npm run test:balance:infinite
//   BALANCE_INFINITE_SEEDS   seeds, comma separated (six fixed seeds by default)
//   BALANCE_INFINITE_MINUTES the longest run, in minutes of frames at 60 fps (30 by default)
//   BALANCE_INFINITE_METAS   max (every upgrade and passive at its cap, the maxed persona's account), mid (half its
//                            upgrades and passives), or both (default)
//   BALANCE_RULE_PATCH       rule flags over the remaster rules, as JSON, e.g. {"infiniteRotation":false}
import { cappedMeta, createHeadlessCanvas, holdDirection, installHeadlessPlatform, standardOptions } from './lib/headless-engine.mjs';
import { resolveEngineBundle } from './lib/engine-bundle.mjs';
import { selectBalanceOffer } from './lib/full-balance-runner.mjs';

installHeadlessPlatform();
const { ProbedGameEngine } = await import(resolveEngineBundle());
const seeds = (process.env.BALANCE_INFINITE_SEEDS ?? '101,997,4099,104729,524287,999983').split(',').map(Number);
const maxFrames = 60 * 60 * Number(process.env.BALANCE_INFINITE_MINUTES ?? 30);
const metas = (process.env.BALANCE_INFINITE_METAS ?? 'max,mid').split(',');
const patch = process.env.BALANCE_RULE_PATCH ? JSON.parse(process.env.BALANCE_RULE_PATCH) : null;
const persona = { id: 'striker', skillPriority: ['blackSun', 'railSpear', 'boneMortar', 'chainSpark', 'needleStorm', 'fanKnives'], movePeriod: 150 };

function metaFor(kind) {
  const meta = cappedMeta();
  if (kind === 'mid') {
    for (const id of Object.keys(meta.upgrades)) meta.upgrades[id] = Math.floor(meta.upgrades[id] / 2);
    for (const id of Object.keys(meta.passives)) meta.passives[id] = Math.floor(meta.passives[id] / 2);
  }
  return meta;
}

function play(kind, seed) {
  let over = false;
  let snapshot;
  let turns = 0;
  let fieldBosses = 0;
  const engine = new ProbedGameEngine(createHeadlessCanvas(), metaFor(kind), standardOptions(), {
    onSnapshot(next) { snapshot = next; },
    onDraft(draft) { engine.completeDraft(selectBalanceOffer(draft.cards, persona, snapshot), draft.id); },
    onRoundClear() { over = true; },
    onGameOver() { over = true; },
  });
  try {
    engine.setRuleSet('remaster');
    if (patch) engine.probe.patchRules(patch);
    engine.subscribe((event) => {
      if (event.type === 'chapter/turned') turns += 1;
      if (event.type === 'boss/spawned' && engine.probe.read().enemies.at(-1)?.boss?.role === 'field') fieldBosses += 1;
    });
    engine.startInfiniteRun(seed, true);
    const directions = ['d', 's', 'a', 'w'];
    let frame = 0;
    for (; frame < maxFrames && !over; frame += 1) {
      if (frame % persona.movePeriod === 0) holdDirection(engine, directions[Math.floor(frame / persona.movePeriod) % 4]);
      engine.advanceFrame(1 / 60, false);
    }
    const { elapsed, score, bossKills } = engine.getDiagnostics();
    return { seed, survived: Math.round(elapsed), died: over, score, bossKills, turns, fieldBosses };
  } finally {
    engine.dispose();
  }
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const report = { rules: 'remaster', patch, maxMinutes: maxFrames / 3600, metas: {} };
for (const kind of metas) {
  const runs = seeds.map((seed) => play(kind, seed));
  report.metas[kind] = {
    median: { survived: median(runs.map((run) => run.survived)), score: median(runs.map((run) => run.score)), bossKills: median(runs.map((run) => run.bossKills)) },
    deaths: runs.filter((run) => run.died).length,
    runs,
  };
}
console.log(JSON.stringify(report, null, 2));
