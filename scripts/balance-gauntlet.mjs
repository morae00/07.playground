// Weapon gauntlet (SYS-15 balance report): every active skill alone, at one level, with no permanent upgrades, in god
// mode, under the remaster rules. It is a report, not a gate: it ranks the weapons' raw power so a rarity that does not
// follow power shows up, which the persona runs cannot see (they hold several skills and take arsenal weapons only as
// fallbacks).
// - crowd: a normal stage's own spawns (4-6 by default), the striker's square walk, no drafts. After a 20 s warm-up,
//   the kills and the damage dealt over the next 60 s.
// - boss: spawns halted and the field cleared, one final boss of 10,000,000 health 300 away, 30 s: its damage per
//   second.
// Everything is seeded, so a rerun on the same build prints the same rows and fingerprint.
// Usage: npm run test:balance:gauntlet (or node scripts/balance-gauntlet.mjs with BLACKLINE_TEST_BUNDLE set)
//   BALANCE_GAUNTLET_LEVEL    the skills' level, 1-5 (5 by default)
//   BALANCE_GAUNTLET_AWAKENED 1 to awaken them (the default at level 5), 0 not to
//   BALANCE_GAUNTLET_STAGE    the stage whose spawns the crowd test uses, chapter:stage (4:6 by default)
//   BALANCE_GAUNTLET_SKILLS   skill ids, comma separated (every active skill and arsenal weapon by default)
//   BALANCE_GAUNTLET_REPORT   where the JSON report goes (artifacts/balance-gauntlet-report.json by default)
//   BALANCE_RULE_PATCH        rule flags over the remaster rules, as JSON
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveEngineBundle } from './lib/engine-bundle.mjs';
import { createHeadlessCanvas, holdDirection, installHeadlessPlatform, standardOptions } from './lib/headless-engine.mjs';

const SEED = 4242;
const MOVE_PERIOD = 150;
const WARMUP_SECONDS = 20;
const CROWD_SECONDS = 60;
const BOSS_SECONDS = 30;
const BOSS_HP = 10_000_000;
const RARITY_ORDER = Object.freeze({ core: 0, common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 });
// The passives a build can hold; every other skill is active (full-balance-runner.mjs).
const PASSIVE_SKILLS = new Set(['ironFrame', 'magnetSigil', 'paperWard', 'recoveryThread', 'coinFever', 'executionMark']);

const level = Number.parseInt(process.env.BALANCE_GAUNTLET_LEVEL ?? '5', 10);
const awakened = (process.env.BALANCE_GAUNTLET_AWAKENED ?? (level >= 5 ? '1' : '0')) === '1';
const [chapter, stage] = (process.env.BALANCE_GAUNTLET_STAGE ?? '4:6').split(':').map(Number);
const patch = process.env.BALANCE_RULE_PATCH ? JSON.parse(process.env.BALANCE_RULE_PATCH) : null;
if (!Number.isInteger(level) || level < 1 || level > 5) throw new RangeError('BALANCE_GAUNTLET_LEVEL must be 1-5');
if (!Number.isInteger(chapter) || chapter < 1 || chapter > 5 || !Number.isInteger(stage) || stage < 1 || stage > 10) {
  throw new RangeError('BALANCE_GAUNTLET_STAGE must be chapter:stage');
}

installHeadlessPlatform();
const { ProbedGameEngine, SKILL_IDS, ARSENAL } = await import(resolveEngineBundle());
const ids = process.env.BALANCE_GAUNTLET_SKILLS
  ? process.env.BALANCE_GAUNTLET_SKILLS.split(',').map((id) => id.trim()).filter(Boolean)
  : SKILL_IDS.filter((id) => !PASSIVE_SKILLS.has(id));
for (const id of ids) if (!SKILL_IDS.includes(id)) throw new TypeError(`Unknown skill: ${id}`);

/** A new player's account: no permanent upgrades or passives (attack 12). */
const freshMeta = () => ({
  gold: 0,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 5, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});

function startEngine(loadout) {
  let engine;
  engine = new ProbedGameEngine(createHeadlessCanvas(), freshMeta(), standardOptions(), {
    onSnapshot() {},
    // XP is held at 0, so a draft should never open; if one does, it changes nothing.
    onDraft(draft) {
      engine.completeDraft(draft.cards[0], draft.id);
      engine.probe.setSkills(loadout);
    },
    onRoundClear() {},
    onGameOver() {},
  });
  engine.setRuleSet('remaster');
  if (patch) engine.probe.patchRules(patch);
  engine.startRun(chapter, stage, SEED);
  engine.probe.setGodMode(true);
  engine.probe.setSkills(loadout);
  return engine;
}

const walk = (engine, frame) => {
  if (frame % MOVE_PERIOD === 0) holdDirection(engine, ['d', 's', 'a', 'w'][Math.floor(frame / MOVE_PERIOD) % 4]);
};
// A presentation tally the simulation never reads (UI-05), so reading it changes nothing.
const damageDealt = (engine) => Object.values(engine.damageBySkill ?? {}).reduce((sum, value) => sum + value, 0);

function crowd(loadout) {
  const engine = startEngine(loadout);
  try {
    let kills = 0;
    let damage = 0;
    const frames = (WARMUP_SECONDS + CROWD_SECONDS) * 60;
    for (let frame = 0; frame < frames; frame += 1) {
      walk(engine, frame);
      if (frame % 30 === 0) engine.probe.setPlayer({ xp: 0 });
      if (frame === WARMUP_SECONDS * 60) {
        kills = engine.probe.read().player.kills;
        damage = damageDealt(engine);
      }
      engine.advanceFrame(1 / 60, false);
    }
    return { kills: engine.probe.read().player.kills - kills, crowdDps: Math.round((damageDealt(engine) - damage) / CROWD_SECONDS) };
  } finally {
    engine.dispose();
  }
}

function boss(loadout) {
  const engine = startEngine(loadout);
  try {
    engine.probe.haltSpawns(true);
    engine.probe.clear('enemies', 'hazards');
    const { x, y } = engine.probe.read().player;
    const bossId = engine.probe.spawnBoss('final', { x: x + 300, y, hp: BOSS_HP });
    for (let frame = 0; frame < BOSS_SECONDS * 60; frame += 1) {
      walk(engine, frame);
      engine.advanceFrame(1 / 60, false);
    }
    const target = engine.probe.read().enemies.find((enemy) => enemy.id === bossId);
    return { bossDps: Math.round((target ? target.maxHp - target.hp : BOSS_HP) / BOSS_SECONDS) };
  } finally {
    engine.dispose();
  }
}

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length === 0 ? 0 : sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const rows = [];
for (const id of ids) {
  const loadout = { [id]: { level, awakened } };
  const weapon = ARSENAL[id];
  const row = { id, rarity: weapon?.rarity ?? 'core', chapter: weapon?.chapterMin ?? null, ...crowd(loadout), ...boss(loadout) };
  rows.push(row);
  console.error(`${id.padEnd(15)} ${row.rarity.padEnd(9)} kills ${String(row.kills).padStart(4)}  boss dps ${row.bossDps}`);
}

const rarities = Object.keys(RARITY_ORDER).filter((rarity) => rows.some((row) => row.rarity === rarity));
const byRarity = Object.fromEntries(rarities.map((rarity) => {
  const group = rows.filter((row) => row.rarity === rarity);
  return [rarity, {
    weapons: group.length,
    kills: { p50: median(group.map((row) => row.kills)), min: Math.min(...group.map((row) => row.kills)), max: Math.max(...group.map((row) => row.kills)) },
    bossDps: { p50: median(group.map((row) => row.bossDps)), min: Math.min(...group.map((row) => row.bossDps)), max: Math.max(...group.map((row) => row.bossDps)) },
  }];
}));
// An inversion: an arsenal weapon of lower rarity, from the same chapter or earlier, beats a rarer one by 10% or more
// on both crowd kills and boss damage. `gap` is how many rarity tiers apart they are; the summary lists gaps of two or
// more (a common over an epic, say), the JSON every pair.
const arsenalRows = rows.filter((row) => row.rarity !== 'core');
const inversions = arsenalRows.flatMap((weaker) => arsenalRows
  .filter((stronger) => RARITY_ORDER[stronger.rarity] < RARITY_ORDER[weaker.rarity] && stronger.chapter <= weaker.chapter
    && stronger.kills >= weaker.kills * 1.1 && stronger.bossDps >= weaker.bossDps * 1.1)
  .map((stronger) => ({ weapon: weaker.id, rarity: weaker.rarity, beatenBy: stronger.id, beatenByRarity: stronger.rarity, gap: RARITY_ORDER[weaker.rarity] - RARITY_ORDER[stronger.rarity] })));
const wide = inversions.filter((item) => item.gap >= 2);
// Whether the rarity medians rise with the rarity, on each axis.
const tiers = Object.entries(byRarity).filter(([rarity]) => rarity !== 'core').map(([, group]) => group);
const monotone = {
  kills: tiers.every((group, index) => index === 0 || group.kills.p50 >= tiers[index - 1].kills.p50),
  bossDps: tiers.every((group, index) => index === 0 || group.bossDps.p50 >= tiers[index - 1].bossDps.p50),
};
const fingerprint = createHash('sha256').update(JSON.stringify(rows)).digest('hex').slice(0, 16);
const report = {
  version: 1,
  fingerprint,
  setup: { level, awakened, chapter, stage, seed: SEED, warmupSeconds: WARMUP_SECONDS, crowdSeconds: CROWD_SECONDS, bossSeconds: BOSS_SECONDS, meta: 'fresh', rules: 'remaster', patch },
  byRarity,
  monotone,
  inversions,
  rows,
};
const outputPath = path.resolve(process.env.BALANCE_GAUNTLET_REPORT ?? 'artifacts/balance-gauntlet-report.json');
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const lines = [`gauntlet ${fingerprint}: level ${level}${awakened ? ' awakened' : ''}, crowd ${chapter}-${stage}, ${rows.length} skills`];
lines.push('rarity     n  kills p50 (min-max)   boss dps p50 (min-max)');
for (const [rarity, group] of Object.entries(byRarity)) {
  lines.push(`${rarity.padEnd(9)} ${String(group.weapons).padStart(2)}  ${String(group.kills.p50).padStart(5)} (${group.kills.min}-${group.kills.max})`.padEnd(37) + `${String(group.bossDps.p50).padStart(5)} (${group.bossDps.min}-${group.bossDps.max})`);
}
lines.push(`medians rise with rarity: kills ${monotone.kills ? 'yes' : 'no'}, boss dps ${monotone.bossDps ? 'yes' : 'no'}`);
const weaponsIn = (list) => new Set(list.map((item) => item.weapon)).size;
lines.push(`inversions: ${inversions.length} pairs (${weaponsIn(inversions)} weapons beaten by a lower rarity); two tiers or more apart: ${wide.length} pairs (${weaponsIn(wide)} weapons)`);
for (const weapon of [...new Set(wide.map((item) => item.weapon))]) {
  const row = rows.find((item) => item.id === weapon);
  const by = wide.filter((item) => item.weapon === weapon).map((item) => {
    const other = rows.find((candidate) => candidate.id === item.beatenBy);
    return `${item.beatenBy} (${item.beatenByRarity}, ${other.kills} / ${other.bossDps})`;
  });
  lines.push(`  ${weapon} (${row.rarity}, ${row.kills} / ${row.bossDps}) < ${by.join(', ')}`);
}
lines.push(`report: ${outputPath}`);
console.log(lines.join('\n'));
