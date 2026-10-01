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

test('CON-07: the trail cosmetic leaves fading ink marks behind the moving hero, and nothing without it', () => {
  const marksDrawn = (trail) => {
    const fills = [];
    // A canvas whose context records the colours it fills with; everything else is a no-op.
    const context = new Proxy({}, {
      get: (target, property) => (property in target ? target[property] : property === 'measureText' ? () => ({ width: 0 }) : property.startsWith('create') ? () => ({ addColorStop() {}, setTransform() {} }) : () => {}),
      set: (target, property, value) => {
        target[property] = value;
        if (property === 'fillStyle' && value === '#123456') fills.push(value);
        return true;
      },
    });
    const canvas = { ...createHeadlessCanvas(1440, 900), getContext: () => context };
    const engine = new ProbedGameEngine(canvas, maxMeta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
    try {
      engine.setRuleSet('remaster');
      engine.setCosmetics({ outline: null, trail });
      engine.startRun(1, 2, 9);
      engine.probe.haltSpawns();
      engine.probe.clear('enemies');
      engine.dispatch({ type: 'input/action', action: 'moveRight', pressed: true });
      for (let frame = 0; frame < 90; frame += 1) {
        engine.probe.step(1);
        engine.probe.render(1);
      }
    } finally {
      engine.dispose();
    }
    return fills.length;
  };
  assert.ok(marksDrawn({ id: 'trail-dots', color: '#123456' }) > 30, 'marks are drawn as the hero walks');
  assert.equal(marksDrawn(null), 0);
});
