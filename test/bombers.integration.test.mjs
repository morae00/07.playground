import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Bombers (SYS-14, bombers rule; remaster on, classic off): from Ch1 St4 some small contact enemies blow themselves
// up. A fuse bomber plants itself on touch and blows its shown circle after a fuse; a burst bomber blows on touch.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, BOMBERS } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function stage(chapter, stageNo, { rules = 'remaster', seed = 2424 } = {}) {
  const events = [];
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), { onSnapshot() {}, onDraft(draft) { engine.completeDraft(draft.cards[0], draft.id); }, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.subscribe((event) => events.push(event));
  engine.startRun(chapter, stageNo, seed);
  return { engine, probe: engine.probe, events };
}

/** Counts bombers among the enemies spawned over `seconds`, clearing the field as it fills. */
function sample(probe, seconds) {
  const seen = new Map();
  for (let step = 0; step < seconds * 60; step += 1) {
    probe.step(1);
    for (const enemy of probe.read().enemies) if (!enemy.isBoss && !seen.has(enemy.id)) seen.set(enemy.id, enemy.bomber ?? null);
    if (step % 60 === 0) probe.removeEnemies(probe.read().enemies.filter((enemy) => !enemy.isBoss).map((enemy) => enemy.id));
  }
  const kinds = [...seen.values()];
  return { total: kinds.length, fuse: kinds.filter((kind) => kind === 'fuse').length, burst: kinds.filter((kind) => kind === 'burst').length };
}

test('SYS-14: no bombers before Ch1 St4 or under the classic rules; more of them later, fuses the more common kind', () => {
  const counts = {};
  for (const [label, chapter, stageNo, rules] of [['1-3', 1, 3, 'remaster'], ['1-4', 1, 4, 'remaster'], ['5-8', 5, 8, 'remaster'], ['5-8 classic', 5, 8, 'classic']]) {
    const r = stage(chapter, stageNo, { rules });
    try {
      r.probe.setGodMode();
      counts[label] = sample(r.probe, 90);
    } finally {
      r.engine.dispose();
    }
  }
  assert.equal(counts['1-3'].fuse + counts['1-3'].burst, 0);
  assert.equal(counts['5-8 classic'].fuse + counts['5-8 classic'].burst, 0);
  const share = (c) => (c.fuse + c.burst) / c.total;
  assert.ok(share(counts['1-4']) > 0 && share(counts['5-8']) > share(counts['1-4']) * 2, `1-4 ${share(counts['1-4']).toFixed(3)}, 5-8 ${share(counts['5-8']).toFixed(3)}`);
  assert.ok(counts['5-8'].fuse > counts['5-8'].burst, `fuse ${counts['5-8'].fuse}, burst ${counts['5-8'].burst}`);
  assert.ok(share(counts['5-8']) <= 0.25, 'the other roles keep most of the field');
});

function bomberBeside(probe, kind, dx) {
  const { player } = probe.read();
  const id = probe.spawnEnemy({ tier: 'small', x: player.x + dx, y: player.y, damage: 5 });
  // Too tough for the player's own weapon to fell in the test, unless the test fells it.
  probe.patchEnemy(id, { bomber: kind, blastDamage: 40, speed: 0, hp: 1e9, maxHp: 1e9 });
  return id;
}

test('SYS-14: a fuse bomber plants itself on touch, shows its reach for the fuse, then hits what is inside', () => {
  const r = stage(3, 2);
  try {
    r.probe.haltSpawns();
    r.probe.clear('enemies');
    r.probe.setPlayer({ hp: 500, invuln: 0 });
    const id = bomberBeside(r.probe, 'fuse', 20);
    r.probe.step(1);
    const planted = r.probe.read().enemies.find((enemy) => enemy.id === id);
    assert.ok(planted.fuseAt !== undefined, 'planted on touch');
    assert.deepEqual(r.events.filter((event) => event.type === 'enemy/armed').map((event) => [event.id, event.radius]), [[id, BOMBERS.fuse.radius]]);
    const hpBefore = r.probe.read().player.hp;
    r.probe.step(Math.floor(BOMBERS.fuse.seconds * 60) - 5);
    assert.ok(r.probe.read().enemies.some((enemy) => enemy.id === id), 'still burning');
    assert.equal(r.probe.read().player.hp, hpBefore, 'no contact damage while it burns');
    const kills = r.probe.read().player.kills;
    r.probe.step(10);
    const blast = r.events.find((event) => event.type === 'enemy/blast');
    assert.ok(blast && blast.kind === 'fuse' && blast.hit, 'it went off with the player inside');
    assert.ok(r.probe.read().player.hp < hpBefore, 'and hit the player');
    assert.equal(r.probe.read().player.kills, kills, 'a blast is not a kill');
    assert.ok(!r.probe.read().enemies.some((enemy) => enemy.id === id));
  } finally {
    r.engine.dispose();
  }
});

test('SYS-14: stepping out of the circle dodges the blast, and killing a planted bomber defuses it', () => {
  const r = stage(3, 2);
  try {
    r.probe.haltSpawns();
    r.probe.clear('enemies');
    r.probe.setGodMode(false);
    r.probe.setPlayer({ hp: 500, invuln: 0 });
    const dodged = bomberBeside(r.probe, 'fuse', 20);
    r.probe.step(1);
    const { player } = r.probe.read();
    r.probe.setPlayer({ x: player.x + BOMBERS.fuse.radius + 80 });
    const hp = r.probe.read().player.hp;
    r.probe.step(Math.ceil(BOMBERS.fuse.seconds * 60) + 2);
    assert.ok(r.events.some((event) => event.type === 'enemy/blast' && !event.hit), 'it went off with the player outside');
    assert.equal(r.probe.read().player.hp, hp);
    assert.ok(!r.probe.read().enemies.some((enemy) => enemy.id === dodged));

    r.events.length = 0;
    const defused = bomberBeside(r.probe, 'fuse', 20);
    r.probe.step(1);
    r.probe.patchEnemy(defused, { hp: 0 });
    r.probe.step(Math.ceil(BOMBERS.fuse.seconds * 60) + 2);
    assert.ok(!r.events.some((event) => event.type === 'enemy/blast'), 'a felled bomber never goes off');
    assert.deepEqual(r.events.filter((event) => event.type === 'enemy/defused').map((event) => event.id), [defused], 'and says so, for its fuse sound');
  } finally {
    r.engine.dispose();
  }
});

test('SYS-14: a burst bomber goes off the moment it touches', () => {
  const r = stage(3, 2);
  try {
    r.probe.haltSpawns();
    r.probe.clear('enemies');
    r.probe.setPlayer({ hp: 500, invuln: 0 });
    const id = bomberBeside(r.probe, 'burst', 20);
    const hp = r.probe.read().player.hp;
    r.probe.step(1);
    const blast = r.events.find((event) => event.type === 'enemy/blast');
    assert.ok(blast && blast.kind === 'burst' && blast.radius === BOMBERS.burst.radius && blast.hit);
    assert.ok(r.probe.read().player.hp < hp);
    assert.ok(!r.probe.read().enemies.some((enemy) => enemy.id === id));
  } finally {
    r.engine.dispose();
  }
});

test('AUD-02: a fuse ticks on the simulation clock, through a pause and at the slow game, the last tick just before the blast', () => {
  const FUSE_TICKS = [0, 0.45, 0.75, 0.95, 1.07];
  const spans = {};
  for (const slow of [false, true]) {
    const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), { ...standardOptions(), assistSlowGame: slow }, { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
    engine.setRuleSet('remaster');
    const sounds = [];
    let frame = 0;
    // A recorder in place of the mixer, noting the wall frame and the simulation clock of every cue.
    engine.setSound({ unlock() {}, play(cue, _pan, pitch = 1) { sounds.push({ cue, frame, pitch, elapsed: engine.probe.read().elapsed }); return sounds.length; }, stop() {} });
    engine.startRun(3, 2, 2424);
    const { probe } = engine;
    try {
      probe.haltSpawns();
      probe.clear('enemies');
      probe.setSkills({});
      probe.setPlayer({ hp: 500, invuln: 0, nextXp: 1e12 });
      bomberBeside(probe, 'fuse', 20);
      for (; frame < 260; frame += 1) {
        // One second in the pause hub (or a draft) while the fuse burns.
        if (frame === 20) engine.pause();
        if (frame === 80) engine.resume();
        engine.advanceFrame(1 / 60, false);
      }
      const armed = sounds.find((sound) => sound.cue === 'bomber.fuse');
      const ticks = sounds.filter((sound) => sound.cue === 'bomber.tick');
      const blast = sounds.find((sound) => sound.cue === 'bomber.blast');
      assert.ok(armed && blast, `${slow ? 'slow' : 'normal'}: armed, then went off`);
      assert.equal(ticks.length, 5);
      ticks.forEach((tick, index) => {
        assert.ok(Math.abs(tick.elapsed - armed.elapsed - FUSE_TICKS[index]) <= 1 / 60 + 1e-9, `tick ${index} at ${(tick.elapsed - armed.elapsed).toFixed(3)} s of simulation`);
        assert.ok(tick.frame < 20 || tick.frame >= 80, 'no tick while paused');
      });
      assert.deepEqual(ticks.map((tick) => Math.round(tick.pitch * 2900)), [2500, 2700, 2900, 3100, 3300]);
      assert.ok(ticks[4].frame <= blast.frame && blast.elapsed - ticks[4].elapsed < 0.1, 'the last tick comes just before the blast');
      spans[slow] = ticks[4].frame - ticks[0].frame;
    } finally {
      engine.dispose();
    }
  }
  // In wall time the slow game stretches the fuse by 1 / 0.8; the pause adds its 60 frames to both.
  assert.ok(Math.abs(spans.false - (1.07 * 60 + 60)) <= 2, `normal: ${spans.false} frames from the first tick to the last`);
  assert.ok(Math.abs(spans.true - ((1.07 / 0.8) * 60 + 60)) <= 2, `slow game: ${spans.true} frames`);
});
