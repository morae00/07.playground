import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, localeTable, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Boss phase moves for the Ch2-5 final bosses (SYS-05): each phase runs its attack grammar, warned for the move's
// preview and imminent time, and every one leaves a way out. The Ch2-5 mid bosses wait for their kit art.

installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, installStrings, t } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');
installStrings(localeTable('ko'));

const STEP = 1 / 60;
const meta = () => ({
  gold: 0, xp: 0, level: 1, passivePoints: 0, progress: { chapter: 5, stage: 10 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});

/** A chapter's final boss stage with only the boss, pushed into the given phase. */
function finalBossInPhase(chapter, phase, rules = 'remaster') {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.startRun(chapter, 10, 8484);
  const { probe } = engine;
  probe.haltSpawns();
  probe.setSkills({});
  probe.setGodMode();
  probe.setPlayer({ nextXp: 1e12 });
  probe.clear('obstacles');
  const boss = probe.read().enemies.find((enemy) => enemy.isBoss);
  probe.removeEnemies(probe.read().enemies.filter((enemy) => !enemy.isBoss).map((enemy) => enemy.id));
  const read = () => probe.read().enemies.find((enemy) => enemy.id === boss.id);
  for (let entered = 1; entered < phase; entered += 1) {
    probe.patchEnemy(boss.id, { hp: boss.maxHp * (entered === 1 ? 0.6 : 0.3) });
    probe.step(31);
  }
  assert.equal(read().bossPhase, phase, `the boss is in phase ${phase}`);
  // A new phase arms its first volley at once, so its warnings stay; only older terrain and shots go.
  probe.clear('hazards', 'hostileShots');
  return { engine, probe, read, boss };
}

/** Steps until `found(world)` holds, up to `limit` steps; returns the world then and the steps it took. */
function until(probe, found, limit = 60 * 12) {
  for (let step = 1; step <= limit; step += 1) {
    probe.step(1);
    const world = probe.read();
    if (found(world)) return { world, step };
  }
  assert.fail('the move never came');
}

const near = (a, b, tolerance) => Math.abs(a - b) <= tolerance;
const byKind = (world, kind) => world.hazards.filter((hazard) => hazard.kind === kind);

test('Ch2 Furnace Maw, phase 2: three fire lanes light 0.3 s apart and leave the aisles between them', () => {
  const arena = finalBossInPhase(2, 2);
  try {
    assert.equal(t(arena.probe.hud().bossMoveName), '용광로 회랑');
    const first = until(arena.probe, (world) => byKind(world, 'fire').length >= 7);
    const counts = [byKind(first.world, 'fire').length];
    arena.probe.step(20);
    counts.push(byKind(arena.probe.read(), 'fire').length);
    arena.probe.step(20);
    const lit = byKind(arena.probe.read(), 'fire');
    counts.push(lit.length);
    assert.deepEqual(counts, [7, 14, 21], 'the lanes light one after another');
    const vertical = new Set(lit.map((hazard) => Math.round(hazard.x))).size === 3;
    const lanes = [...new Set(lit.map((hazard) => Math.round(vertical ? hazard.x : hazard.y)))].sort((a, b) => a - b);
    assert.equal(lanes.length, 3);
    assert.ok(near(lanes[1] - lanes[0], 220, 1) && near(lanes[2] - lanes[1], 220, 1), `lanes ${lanes}`);
    assert.ok(220 - 2 * lit[0].radius >= 100, 'the aisles are wider than the hero');
  } finally {
    arena.engine.dispose();
  }
});

test('Ch2 Furnace Maw, phase 3: a ring of fire with one gap falls, the boss lands across from it, then the centre caves in', () => {
  const arena = finalBossInPhase(2, 3);
  try {
    assert.equal(t(arena.probe.hud().bossMoveName), '잿빛 궁륭 붕괴');
    const before = arena.read();
    const { world } = until(arena.probe, (next) => byKind(next, 'fire').length >= 7);
    const ring = byKind(world, 'fire');
    assert.equal(ring.length, 7, 'eight spots, one left out');
    const centre = { x: ring.reduce((sum, hazard) => sum + hazard.x, 0) / 7, y: ring.reduce((sum, hazard) => sum + hazard.y, 0) / 7 };
    const boss = world.enemies.find((enemy) => enemy.isBoss);
    assert.ok(Math.hypot(boss.x - before.x, boss.y - before.y) > 100, 'the boss warped');
    arena.probe.step(56);
    const core = byKind(arena.probe.read(), 'fire').find((hazard) => hazard.radius === 150);
    assert.ok(core, 'the centre caves in 0.9 s later');
    assert.ok(Math.hypot(core.x - centre.x, core.y - centre.y) < 60, 'at the ring centre');
  } finally {
    arena.engine.dispose();
  }
});

test('Ch3 Latch Empress, phase 2: a 3x3 lattice of bindings in two checkerboard waves', () => {
  const arena = finalBossInPhase(3, 2);
  try {
    assert.equal(t(arena.probe.hud().bossMoveName), '사슬 격자');
    const { world } = until(arena.probe, (next) => byKind(next, 'root').length > 0);
    const wave = byKind(world, 'root');
    assert.equal(wave.length, 5, 'the centre and the corners first');
    arena.probe.step(37);
    const all = byKind(arena.probe.read(), 'root');
    assert.equal(all.length, 9, 'then the edges, 0.6 s later');
    const xs = [...new Set(all.map((hazard) => Math.round(hazard.x)))].sort((a, b) => a - b);
    assert.ok(near(xs[1] - xs[0], 170, 1) && near(xs[2] - xs[1], 170, 1), `columns ${xs}`);
  } finally {
    arena.engine.dispose();
  }
});

test('Ch3 Latch Empress, phase 3: the execution cell closes in two squares, both open on the same side', () => {
  const arena = finalBossInPhase(3, 3);
  try {
    assert.equal(t(arena.probe.hud().bossMoveName), '처형 감방');
    const armed = until(arena.probe, (next) => next.laneTelegraphs.some((lane) => lane.width === 90));
    const gate = armed.world.laneTelegraphs.find((lane) => lane.width === 90);
    const { world } = until(arena.probe, (next) => byKind(next, 'root').length > 0);
    const outer = byKind(world, 'root');
    assert.equal(outer.length, 12, 'three sides of four');
    arena.probe.step(55);
    const both = byKind(arena.probe.read(), 'root');
    assert.equal(both.length, 18, 'the inner square closes 0.9 s later');
    const out = { x: gate.x2 - gate.x1, y: gate.y2 - gate.y1 };
    const open = both.every((hazard) => ((hazard.x - gate.x1) * out.x + (hazard.y - gate.y1) * out.y) / Math.hypot(out.x, out.y) < 200);
    assert.ok(open, 'no binding stands on the gate side');
  } finally {
    arena.engine.dispose();
  }
});

test('Ch4 Cog Herald, phase 2: two rings of saws orbit the boss in opposite directions while it circles the player', () => {
  const arena = finalBossInPhase(4, 2);
  try {
    assert.equal(t(arena.probe.hud().bossMoveName), '톱니 궤도');
    const { world } = until(arena.probe, (next) => next.bossProjectiles.some((shot) => shot.orbit));
    const saws = world.bossProjectiles.filter((shot) => shot.orbit);
    assert.equal(saws.length, 7);
    const boss = world.enemies.find((enemy) => enemy.isBoss);
    for (const saw of saws) assert.ok(near(Math.hypot(saw.x - boss.x, saw.y - boss.y), saw.orbit.radius, 1), 'on its ring');
    const inner = saws.find((saw) => saw.orbit.radius === 130);
    const outer = saws.find((saw) => saw.orbit.radius === 230);
    arena.probe.step(30);
    const later = arena.probe.read().bossProjectiles;
    assert.ok(later.find((shot) => shot.id === inner.id).orbit.angle > inner.orbit.angle, 'inner ring turns one way');
    assert.ok(later.find((shot) => shot.id === outer.id).orbit.angle < outer.orbit.angle, 'outer ring the other');
    const turned = arena.read();
    const player = arena.probe.read().player;
    assert.ok(Math.hypot(turned.x - player.x, turned.y - player.y) < 520, 'the boss keeps to its orbit around the player');
  } finally {
    arena.engine.dispose();
  }
});

test('Ch4 Cog Herald, phase 3: saws drop down the view in four of five lanes, warned for the whole preview', () => {
  const arena = finalBossInPhase(4, 3);
  try {
    assert.equal(t(arena.probe.hud().bossMoveName), '단두 톱니');
    const warned = until(arena.probe, (next) => next.laneTelegraphs.filter((lane) => lane.x1 === lane.x2).length === 4);
    const lanes = warned.world.laneTelegraphs.filter((lane) => lane.x1 === lane.x2);
    assert.ok(lanes[0].maxLife >= 0.98 + 0.3 - 1e-9, `warned ${lanes[0].maxLife} s`);
    const { world } = until(arena.probe, (next) => next.bossProjectiles.filter((shot) => shot.kind === 'saw' && shot.vy > 0).length === 4);
    const xs = world.bossProjectiles.filter((shot) => shot.kind === 'saw' && shot.vy > 0).map((shot) => shot.x).sort((a, b) => a - b);
    const gaps = xs.slice(1).map((x, index) => Math.round(x - xs[index]));
    assert.ok(gaps.every((gap) => gap === 150 || gap === 300) && gaps.filter((gap) => gap === 300).length <= 1, `gaps ${gaps}`);
  } finally {
    arena.engine.dispose();
  }
});

test('Ch5 Void Balance, phase 2: two silence zones balance across the player', () => {
  const arena = finalBossInPhase(5, 2);
  try {
    assert.equal(t(arena.probe.hud().bossMoveName), '침묵의 저울');
    const { world } = until(arena.probe, (next) => byKind(next, 'null').length === 2);
    const [a, b] = byKind(world, 'null');
    assert.ok(near(Math.hypot(a.x - b.x, a.y - b.y), 380, 1), 'mirrored 190 either side');
    assert.equal(a.radius, 120);
  } finally {
    arena.engine.dispose();
  }
});

test('Ch5 Void Balance, phase 3: the wall closes on the blank void and stops at its edge; the boss steps outside', () => {
  const arena = finalBossInPhase(5, 3);
  try {
    assert.equal(t(arena.probe.hud().bossMoveName), '공백 붕괴');
    const { world } = until(arena.probe, (next) => next.bossProjectiles.filter((shot) => shot.kind === 'eclipse').length === 28);
    const wall = world.bossProjectiles.filter((shot) => shot.kind === 'eclipse');
    const centre = { x: wall.reduce((sum, shot) => sum + shot.x, 0) / 28, y: wall.reduce((sum, shot) => sum + shot.y, 0) / 28 };
    for (const shot of wall) assert.ok(near(Math.hypot(shot.x - centre.x, shot.y - centre.y), 470, 4), 'the wall starts at 470');
    const reach = Math.max(...wall.map((shot) => shot.life)) * 170;
    assert.ok(near(470 - reach, 140, 3), `it stops ${470 - reach} short of the centre`);
    const boss = world.enemies.find((enemy) => enemy.isBoss);
    assert.ok(Math.hypot(boss.x - centre.x, boss.y - centre.y) > 470, 'the boss waits outside the wall');
  } finally {
    arena.engine.dispose();
  }
});

test('classic rules keep the Ch2-5 final bosses on their original patterns', () => {
  const arena = finalBossInPhase(4, 2, 'classic');
  try {
    arena.probe.step(60 * 4);
    assert.equal(arena.probe.read().bossProjectiles.some((shot) => shot.orbit), false);
    assert.equal(arena.probe.hud().bossMoveName, undefined);
  } finally {
    arena.engine.dispose();
  }
});
