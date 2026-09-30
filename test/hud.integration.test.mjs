import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform } from '../scripts/lib/headless-engine.mjs';

// In-run HUD (UI-02): what the HUD snapshot carries for the boss bar and the skill slots.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const meta = () => ({
  gold: 0,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 1, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});
const options = { healthBars: 'elite', volume: 0, effects: 0.9, damageNumbers: true, screenShake: false, reducedFlash: false, paceMode: 'standard' };

function withEngine(body) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), options, { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  try {
    body(engine);
  } finally {
    engine.dispose();
  }
}

test('UI-02: the boss bar gets the boss id for its portrait, its phase, and its enrage steps', () => {
  withEngine((engine) => {
    engine.startRun(1, 5, 5150);
    engine.probe.setGodMode();
    engine.probe.step(30);
    const hud = engine.probe.hud();
    assert.equal(hud.bossId, 's1-mid-dash');
    assert.equal(hud.bossName, '잉크 도살자', 'the name alone: phase and enrage are separate fields');
    assert.equal(hud.bossPhase, 1);
    assert.equal(hud.bossEnrage, 0);
    assert.equal(hud.bossEnrageSteps, 4, 'stepped enrage under remaster rules');

    engine.startRun(1, 1, 5150);
    assert.equal(engine.probe.hud().bossId, undefined, 'no boss bar on a survival stage');
  });
});

test('UI-02: active skills report the share of their cooldown still to run; passives report none', () => {
  withEngine((engine) => {
    engine.startRun(1, 1, 5150);
    engine.probe.haltSpawns();
    engine.probe.setGodMode();
    engine.probe.clear('enemies', 'hazards', 'pickups', 'projectiles', 'hostileShots');
    engine.probe.setSkills({ chainSpark: { level: 1 }, ironFrame: { level: 1 } });
    const { player } = engine.probe.read();
    engine.probe.spawnEnemy({ x: player.x + 160, y: player.y, hp: 1e9 });
    assert.deepEqual(engine.probe.hud().cooldowns, { chainSpark: 0 }, 'ready before the first cast');
    engine.probe.cast('chainSpark');
    const started = engine.probe.hud().cooldowns.chainSpark;
    assert.equal(started, 1, 'a cooldown seen starting reads full');
    engine.probe.step(30);
    const later = engine.probe.hud().cooldowns.chainSpark;
    assert.ok(later > 0 && later < started, `half a second later it has run down (${later})`);
    assert.equal('ironFrame' in engine.probe.hud().cooldowns, false);
  });
});

/** A canvas that records the arcs and fills the frame draws, so the tests can find the HUD marks. */
function markCanvas() {
  const arcs = [];
  const target = {
    measureText: () => ({ width: 0 }),
    createPattern: () => null,
    arc(x, y, radius, start, end) { arcs.push({ x, y, radius, sweep: end - start, strokeStyle: target.strokeStyle }); },
  };
  const context = new Proxy(target, {
    get(object, property) { return property in object ? object[property] : () => {}; },
    set(object, property, value) { object[property] = value; return true; },
  });
  return {
    arcs,
    canvas: {
      width: 0, height: 0,
      getContext: () => context,
      getBoundingClientRect: () => ({ width: 1440, height: 900, left: 0, top: 0 }),
      addEventListener() {}, removeEventListener() {},
      setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => false,
    },
  };
}

function arena(fixture) {
  const engine = new ProbedGameEngine(fixture.canvas, meta(), options, { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.startRun(1, 1, 5150);
  engine.probe.haltSpawns();
  engine.probe.setGodMode();
  engine.probe.clear('enemies', 'hazards', 'obstacles', 'pickups', 'projectiles', 'hostileShots', 'effects');
  engine.probe.setSkills({});
  return engine;
}

test('UI-02: elites and bosses off screen get an edge arrow each, bosses first, four at most', () => {
  const engine = arena(markCanvas());
  try {
    const { player } = engine.probe.read();
    engine.probe.spawnEnemy({ tier: 'large', x: player.x + 200, y: player.y, speed: 0, damage: 0 });
    engine.probe.render(1);
    assert.equal(engine.probe.renderStats().markers, 0, 'an elite on screen needs no arrow');
    for (let index = 0; index < 5; index += 1) engine.probe.spawnEnemy({ tier: 'large', x: player.x - 1400 - index * 60, y: player.y + index * 90, speed: 0, damage: 0 });
    engine.probe.spawnEnemy({ tier: 'small', x: player.x + 1500, y: player.y, speed: 0, damage: 0 });
    engine.probe.render(1);
    assert.equal(engine.probe.renderStats().markers, 4, 'five elites off screen, four arrows; small enemies get none');
  } finally {
    engine.dispose();
  }
});

test('UI-02: silence and root sit over the hero as timers that run down', () => {
  const fixture = markCanvas();
  const engine = arena(fixture);
  try {
    const rings = (color) => fixture.arcs.filter((arc) => arc.radius === 13 && arc.strokeStyle === color && arc.sweep > 0);
    engine.probe.setPlayer({ silence: 2 });
    engine.probe.render(1);
    const full = rings('#805ad5').at(-1);
    assert.ok(full && Math.abs(full.sweep - Math.PI * 2) < 1e-6, 'a silence just begun shows a full ring');
    engine.probe.setPlayer({ silence: 0.5, root: 1 });
    fixture.arcs.length = 0;
    engine.probe.render(1);
    assert.ok(Math.abs(rings('#805ad5').at(-1).sweep - Math.PI * 0.5) < 1e-6, 'a quarter of the silence left, a quarter of the ring');
    assert.equal(rings('#d88d16').length, 1, 'root gets its own amber timer beside it');
  } finally {
    engine.dispose();
  }
});

test('FX-05: a pickup that reaches the player reports it, one that expires into the total does not', () => {
  const engine = arena(markCanvas());
  try {
    const events = [];
    engine.subscribe((event) => { if (event.type === 'pickup/collected' || event.type === 'draft/opened') events.push(event); });
    const { player } = engine.probe.read();
    engine.probe.spawnPickup({ kind: 'coin', x: player.x + 4, y: player.y, value: 1 });
    engine.probe.spawnPickup({ kind: 'xp', x: player.x + 3000, y: player.y, value: 1, life: 0.01 });
    engine.probe.step(2);
    assert.deepEqual(events.map((event) => [event.type, event.kind]), [['pickup/collected', 'coin']]);
  } finally {
    engine.dispose();
  }
});

test('FX-05: a draft reports when it opens, and flags awakening, legendary, and mythic cards for the sting', () => {
  const drafts = [];
  const fixture = markCanvas();
  const engine = new ProbedGameEngine(fixture.canvas, meta(), options, { onSnapshot() {}, onDraft: (draft) => drafts.push(draft), onRoundClear() {}, onGameOver() {} });
  try {
    engine.startRun(3, 4, 7070);
    engine.probe.haltSpawns();
    engine.probe.setGodMode();
    const opened = [];
    engine.subscribe((event) => { if (event.type === 'draft/opened') opened.push(event); });
    for (let round = 0; round < 12; round += 1) {
      engine.probe.openDraft(round % 3 === 0 ? 'boss' : 'level', 'resume');
      engine.dispatch({ type: 'draft/select', offerId: drafts.at(-1).cards[0].offerId });
    }
    assert.equal(opened.length, 12);
    opened.forEach((event, index) => {
      const cards = drafts[index].cards;
      assert.equal(event.reason, drafts[index].reason);
      assert.equal(event.highlight, cards.some((card) => card.kind === 'awakening' || card.rarity === 'legendary' || card.rarity === 'mythic'), `draft ${index}`);
    });
  } finally {
    engine.dispose();
  }
});
