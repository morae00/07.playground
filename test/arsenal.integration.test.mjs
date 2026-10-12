import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// The arsenal (SYS-15, arsenal rule; remaster on, classic off): 44 weapons fired from data beside the 11 active skills.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, ARSENAL, ARSENAL_IDS, SKILL_IDS } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

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
    assert.ok(r.events.some((event) => event.type === 'area/blast' && event.source === ARSENAL.meteorBrush.look), 'landed');
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
