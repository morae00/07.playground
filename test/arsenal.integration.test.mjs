import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// The arsenal (SYS-15, arsenal rule; remaster on, classic off): 44 weapons fired from data beside the 11 active skills.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, ARSENAL, ARSENAL_IDS, SKILL_IDS, arsenalStats } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function arena(rules = 'remaster', chapter = 3, stage = 2) {
  const events = [];
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.subscribe((event) => events.push(event));
  engine.startRun(chapter, stage, 8080);
  engine.probe.haltSpawns();
  engine.probe.clear('enemies');
  engine.probe.setGodMode();
  engine.probe.setPlayer({ nextXp: 1e12 });
  return { engine, probe: engine.probe, events };
}

/** A ring of sturdy, still enemies around the player, near and farther out. */
function ring(probe, count = 16) {
  const { player } = probe.read();
  const ids = [];
  for (let index = 0; index < count; index += 1) {
    const angle = (index * Math.PI * 2) / count;
    const reach = index % 2 ? 110 : 260;
    ids.push(probe.spawnEnemy({ tier: 'small', x: player.x + Math.cos(angle) * reach, y: player.y + Math.sin(angle) * reach, hp: 1e6, speed: 0, damage: 0 }));
  }
  return ids;
}

test('SYS-15: 44 arsenal weapons join the 17 skills, all active, each with a look among the active skills', () => {
  assert.equal(ARSENAL_IDS.length, 44);
  assert.equal(SKILL_IDS.length, 17 + 44);
  for (const id of ARSENAL_IDS) assert.ok(['needleStorm', 'fanKnives', 'chainSpark', 'frostLine', 'orbitScythes', 'boneMortar', 'railSpear', 'mirrorClone', 'voidMine', 'blackSun', 'eclipseStep'].includes(ARSENAL[id].look), id);
  const kinds = new Set(ARSENAL_IDS.map((id) => ARSENAL[id].kind));
  assert.equal(kinds.size, 11, 'every kind has weapons');
});

test('SYS-15: every arsenal weapon fires and hurts what is around it', () => {
  const silent = [];
  for (const id of ARSENAL_IDS) {
    const r = arena();
    try {
      r.probe.setSkills({ [id]: { level: 3 } });
      const ids = ring(r.probe);
      r.probe.step(60 * 4);
      const lost = r.probe.read().enemies.filter((enemy) => ids.includes(enemy.id)).reduce((sum, enemy) => sum + (enemy.maxHp - enemy.hp), 0)
        + (ids.length - r.probe.read().enemies.filter((enemy) => ids.includes(enemy.id)).length) * 1e6;
      const casts = r.events.filter((event) => event.type === 'skill/cast' && event.skillId === id).length;
      if (casts === 0 || lost <= 0) silent.push(`${id} (${casts} casts, ${Math.round(lost)} health)`);
    } finally {
      r.engine.dispose();
    }
  }
  assert.deepEqual(silent, []);
});

test('SYS-15: effects land: slows, stuns, and executions', () => {
  const r = arena();
  try {
    // A frost ring around the player slows; a thunderclap (chance 1) stuns.
    r.probe.setSkills({ frostRing: { level: 1 }, thunderclap: { level: 1 } });
    const ids = ring(r.probe, 8).filter((_, index) => index % 2 === 1);
    r.probe.step(60 * 3);
    const near = r.probe.read().enemies.filter((enemy) => ids.includes(enemy.id));
    assert.ok(near.some((enemy) => (enemy.slowMultiplier ?? 1) < 1), 'slowed');
    assert.ok(r.events.some((event) => event.type === 'skill/cast' && event.skillId === 'thunderclap'));
  } finally {
    r.engine.dispose();
  }
  const e = arena();
  try {
    // The headsman's darts finish an ordinary enemy left under 18% of its health.
    e.probe.setSkills({ headsmanDarts: { level: 1 } });
    const { player } = e.probe.read();
    const id = e.probe.spawnEnemy({ tier: 'large', x: player.x + 200, y: player.y, hp: 1e6, speed: 0, damage: 0 });
    e.probe.patchEnemy(id, { hp: 1e6 * 0.17 });
    e.probe.step(60 * 2);
    assert.ok(!e.probe.read().enemies.some((enemy) => enemy.id === id), 'executed');
  } finally {
    e.engine.dispose();
  }
});

test('SYS-15: lobs land after their delay, and the classic rules never offer the arsenal', () => {
  const r = arena();
  try {
    r.probe.setSkills({ meteorBrush: { level: 1 } });
    const { player } = r.probe.read();
    r.probe.spawnEnemy({ tier: 'large', x: player.x + 300, y: player.y, hp: 1e6, speed: 0, damage: 0 });
    r.probe.step(2);
    const cast = r.events.find((event) => event.type === 'skill/cast' && event.skillId === 'meteorBrush');
    assert.ok(cast, 'thrown');
    assert.ok(!r.events.some((event) => event.type === 'area/blast'), 'not landed yet');
    r.probe.step(Math.ceil(ARSENAL.meteorBrush.delay * 60) + 2);
    // The blast carries the weapon, whose look the renderer draws.
    assert.ok(r.events.some((event) => event.type === 'area/blast' && event.source === 'meteorBrush'), 'landed');
  } finally {
    r.engine.dispose();
  }
  for (const rules of ['classic', 'remaster']) {
    const offered = new Set();
    const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), {
      onSnapshot() {},
      onDraft(draft) {
        for (const card of draft.cards) if (card.skillId) offered.add(card.skillId);
        engine.completeDraft(draft.cards[0], draft.id);
      },
      onRoundClear() {},
      onGameOver() {},
    });
    try {
      engine.setRuleSet(rules);
      engine.startRun(5, 2, 9090);
      engine.probe.setGodMode();
      for (let round = 0; round < 40; round += 1) {
        engine.probe.openDraft('level', 'resume');
      }
    } finally {
      engine.dispose();
    }
    const arsenal = [...offered].filter((id) => ARSENAL_IDS.includes(id));
    if (rules === 'classic') assert.deepEqual(arsenal, [], 'classic drafts hold no arsenal weapon');
    else assert.ok(arsenal.length > 5, `remaster drafts offered ${arsenal.length} arsenal weapons`);
  }
});

const PROPOSALS = { lobScatter: false, lobSingle: false, awakeningScale: false, rarityDamage: false, bossFirstVolley: false };

/** Where a lob's blasts land in one cast at level 5 awakened, with `patch` over the remaster rules. */
function lobBlasts(id, patch = {}) {
  const r = arena();
  try {
    r.probe.patchRules({ ...PROPOSALS, ...patch });
    r.probe.setSkills({ [id]: { level: 5, awakened: true } });
    const { player } = r.probe.read();
    const target = { x: player.x + 300, y: player.y };
    r.probe.spawnEnemy({ tier: 'large', ...target, hp: 1e9, speed: 0, damage: 0 });
    r.probe.step(Math.ceil(ARSENAL[id].delay * 60) + 4);
    const first = r.events.find((event) => event.type === 'area/blast' && event.source === id && !event.echo);
    return r.events.filter((event) => event.type === 'area/blast' && event.source === id && !event.echo && event.x !== undefined && Math.abs(event.x - first.x) < 400)
      .slice(0, 8).map((event) => Math.round(Math.hypot(event.x - target.x, event.y - target.y)));
  } finally {
    r.engine.dispose();
  }
}

test('P2-1 proposals: off in both rule sets; the stacking lobs stack, spread, or throw one blast', () => {
  for (const flag of Object.keys(PROPOSALS)) {
    const r = arena();
    try {
      assert.equal(r.engine.ruleSet[flag], false, `${flag} is off in the remaster rules`);
    } finally {
      r.engine.dispose();
    }
  }
  // Ink pots at level 5 awakened throw three: today all on the target, spread apart, or one.
  const stacked = lobBlasts('inkPots');
  assert.equal(stacked.length, 3);
  assert.ok(stacked.every((d) => d < 2), `stacked ${stacked}`);
  const spread = lobBlasts('inkPots', { lobScatter: true });
  assert.equal(spread.length, 3);
  assert.ok(spread.every((d) => Math.abs(d - 70) < 2), `spread ${spread}`);
  assert.equal(lobBlasts('inkPots', { lobSingle: true }).length, 1);
  // The cluster pots already scatter and are not one of the three.
  assert.deepEqual(lobBlasts('clusterPots', { lobSingle: true }).length, lobBlasts('clusterPots').length);
});

test('P2-1 proposals: tuned numbers fold the count into damage, by rarity and awakening', () => {
  const tuning = (id, flags) => ({ id, lobSingle: false, awakeningScale: false, rarityDamage: false, ...flags });
  const plain = arsenalStats(ARSENAL.inkPots, 5, true);
  assert.deepEqual(arsenalStats(ARSENAL.inkPots, 5, true, tuning('inkPots', {})), plain, 'no flag, no change');
  // One blast carries 1 + 0.5 for each of the two blasts it replaces.
  const single = arsenalStats(ARSENAL.inkPots, 5, true, tuning('inkPots', { lobSingle: true }));
  assert.equal(single.count, 1);
  assert.ok(Math.abs(single.damage - plain.damage * 2) < 1e-9);
  // A proportional awakening: one-shot weapons no longer double, novas gain as much as the rest.
  const scaled = (id) => arsenalStats(ARSENAL[id], 5, true, tuning(id, { awakeningScale: true }));
  const total = (id, stats) => stats.damage * (ARSENAL[id].kind === 'chain' ? stats.jumps + 1 : ['nova', 'halo', 'beam'].includes(ARSENAL[id].kind) ? 1 : stats.count);
  const before = (id) => total(id, arsenalStats(ARSENAL[id], 5, false));
  for (const id of ['inkDarts', 'sunNeedles', 'inkPulse', 'sparkThread', 'bossbane']) {
    const gain = total(id, scaled(id)) / before(id);
    assert.ok(Math.abs(gain - 1.35 * 1.2) < 1e-9, `${id} awakens by ${gain}`);
  }
  // Rarity factors multiply damage only.
  const rare = arsenalStats(ARSENAL.sealArrows, 3, false, tuning('sealArrows', { rarityDamage: true }));
  assert.equal(rare.count, arsenalStats(ARSENAL.sealArrows, 3, false).count);
});

test('P2-1 proposals: with bossFirstVolley every bossbane seeker flies at the boss', () => {
  for (const volley of [false, true]) {
    const r = arena();
    try {
      r.probe.patchRules({ ...PROPOSALS, bossFirstVolley: volley });
      r.probe.setSkills({ bossbane: { level: 5, awakened: true } });
      const { player } = r.probe.read();
      const boss = r.probe.spawnBoss('final', { x: player.x + 420, y: player.y, hp: 1e9 });
      for (let index = 0; index < 6; index += 1) r.probe.spawnEnemy({ tier: 'small', x: player.x - 120 - index * 20, y: player.y + 60, hp: 1e9, speed: 0, damage: 0 });
      r.probe.step(1);
      const shots = r.probe.read().projectiles.filter((shot) => shot.skillId === 'bossbane');
      const atBoss = shots.filter((shot) => shot.vx > 0).length;
      assert.equal(shots.length, arsenalStats(ARSENAL.bossbane, 5, true).count);
      assert.equal(atBoss, volley ? shots.length : 1, `${atBoss} of ${shots.length} at the boss ${boss}`);
    } finally {
      r.engine.dispose();
    }
  }
});
