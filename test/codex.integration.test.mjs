import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Codex (CON-07): a run reports what it found: the skills it took, the enemies ("<chapter>-<role>") and bosses it
// defeated, and the terrain the hero stood in or cast. The app adds it to the save's codex at the settlement.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

test('CON-07: a settlement lists the skills taken, the enemies and bosses defeated, and the terrain met', () => {
  const settlements = [];
  // The field boss's reward draft is picked at once, so play goes on.
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), {
    onSnapshot() {},
    onDraft(draft) { engine.completeDraft(draft.cards[0], draft.id); },
    onRoundClear(result) { settlements.push(result); },
    onGameOver(result) { settlements.push(result); },
  });
  try {
    engine.setRuleSet('remaster');
    engine.startRun(2, 5, 4242);
    const { probe } = engine;
    probe.setGodMode();
    probe.haltSpawns();
    probe.clear('enemies', 'hazards', 'obstacles');
    probe.setSkills({ needleStorm: { level: 3 }, boneMortar: { level: 2 } });
    const { player } = probe.read();
    // A stalker (small, contact) and a charger (medium, contact) fall to the needles, and the field boss to one hit.
    probe.spawnEnemy({ tier: 'small', x: player.x + 120, y: player.y, hp: 1, speed: 0, damage: 0 });
    probe.spawnEnemy({ tier: 'medium', x: player.x - 120, y: player.y, hp: 1, speed: 0, damage: 0 });
    const bossId = probe.spawnBoss('field', { x: player.x, y: player.y + 140, hp: 1 });
    const bossDef = probe.read().enemies.find((enemy) => enemy.id === bossId).boss.id;
    probe.addHazard({ kind: 'water', x: player.x, y: player.y, radius: 60, life: 1e6, maxLife: 1e6, damage: 0, slow: 0.6, triggered: false });
    for (let tries = 0; tries < 20 && probe.read().enemies.length > 0; tries += 1) probe.step(30);
    probe.spawnEnemy({ tier: 'small', x: player.x + 300, y: player.y + 300, hp: 1e6, speed: 0, damage: 0 });
    probe.cast('boneMortar');
    engine.forfeit();
    const [result] = settlements;
    assert.ok(['boneMortar', 'needleStorm'].every((id) => result.found.skills.includes(id)), result.found.skills.join(', '));
    assert.deepEqual(result.found.enemies.sort(), ['2-charger', '2-stalker']);
    assert.deepEqual(result.found.bosses, [bossDef]);
    assert.ok(result.found.terrain.includes('water') && result.found.terrain.includes('warning'), result.found.terrain.join(', '));
  } finally {
    engine.dispose();
  }
});
