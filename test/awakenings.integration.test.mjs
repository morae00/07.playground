import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, localeTable, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Awakening gimmicks (SYS-16, awakeningGimmicks rule; remaster on, classic off): each of the 44 arsenal weapons, once
// awakened, does one thing of its own (docs/decisions/SYS-16-awakening-gimmicks.md). Every weapon is played three ways
// on the same little field: awakened under the rule, awakened with the rule patched off, and at Lv5 not yet awakened.
// Its gimmick shows only the first way.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, ARSENAL, ARSENAL_IDS, arsenalStats, installStrings, tx } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const MODES = ['on', 'off', 'asleep'];

function arena(rules = 'remaster') {
  const events = [];
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.subscribe((event) => events.push(event));
  engine.startRun(1, 3, 8080);
  const probe = engine.probe;
  probe.haltSpawns();
  probe.clear('enemies', 'obstacles', 'hazards');
  // Probe spawns stay plain enemies: no elite shields in the way.
  probe.patchRules({ eliteAffixes: false });
  probe.setGodMode();
  probe.setPlayer({ nextXp: 1e12 });
  return { engine, probe, events, player: probe.read().player };
}

const blasts = (r, id) => r.events.filter((event) => event.type === 'area/blast' && event.source === id);
const stuns = (r, id) => r.events.filter((event) => event.type === 'enemy/stunned' && event.source === id).length;
const hits = (r, id) => r.events.filter((event) => event.type === 'enemy/hit' && event.id === id);
const zone = (world, id) => world.zones.some((piece) => piece.weapon === id);
const marked = (world, key) => world.enemies.some((enemy) => (enemy.awk?.[key] ?? 0) > world.elapsed);
const hurt = (r, id) => r.probe.read().enemies.some((enemy) => enemy.id === id && enemy.hp < enemy.maxHp);
const echoShot = (world, id) => world.projectiles.some((shot) => shot.echo && shot.skillId === id);
const mark = (r, id, kind = 'ring') => r.probe.effects().skillMarks.some((m) => m.skillId === id && m.kind === kind);

/**
 * One scenario per weapon. `setup` places sturdy, still enemies around the player (x right, y down) and returns what
 * the checks need; `watch` sees the world every few steps; `check` looks once at the end. A `strip` world drops every
 * weapon once it holds, so whatever hits after it is the gimmick alone (thorns, crows).
 */
const SCENARIOS = {
  inkDarts: { setup: (f) => f(150, 0), steps: 180, check: (r) => blasts(r, 'inkDarts').length > 0 },
  // An even fan leaves its middle open: a large enemy fills it.
  brushQuills: { setup: (f) => f(150, 0, { tier: 'large' }), steps: 120, check: (r) => blasts(r, 'brushQuills').length > 0 },
  sealArrows: { setup: (f) => [f(150, 0), f(170, 0)], steps: 150, check: (r) => stuns(r, 'sealArrows') > 0 },
  frostNeedles: { setup: (f) => f(150, 0), steps: 240, check: (r) => stuns(r, 'frostNeedles') > 0 },
  thunderNeedles: {
    // The first is stunned already; the second stands off the needles' line, within the leap.
    setup: (f, r) => {
      const first = f(150, 0);
      r.probe.patchEnemy(first, { stun: 100 });
      return f(150, 150);
    },
    steps: 120,
    check: (r, off) => hurt(r, off),
  },
  twinBlades: { setup: (f) => f(250, 0), steps: 120, watch: (world) => zone(world, 'twinBlades') },
  ghostVolley: { setup: (f) => [f(120, 0, { hp: 1 }), f(-200, 120)], steps: 90, watch: (world) => echoShot(world, 'ghostVolley') },
  headsmanDarts: {
    setup: (f, r) => {
      const doomed = f(200, 0);
      r.probe.patchEnemy(doomed, { hp: 1e6 * 0.17 });
      f(200, 60);
      f(260, 0);
    },
    steps: 60,
    watch: (world) => marked(world, 'fear'),
  },
  paperStorm: {
    setup: (f) => f(150, 0),
    steps: 40,
    watch: (world, seen) => world.projectiles.some((shot) => {
      const angle = Math.atan2(shot.vy, shot.vx);
      const before = seen.get(shot.id);
      seen.set(shot.id, angle);
      return shot.skillId === 'paperStorm' && before !== undefined && Math.abs(angle - before) > 0.01;
    }),
    context: () => new Map(),
  },
  inkBloom: { setup: (f) => [f(150, 0), f(150, 40)], steps: 120, watch: (world, _, r) => mark(r, 'inkBloom') },
  thornHalo: { setup: (f) => f(320, 0, { speed: 260 }), steps: 240, strip: (world) => marked(world, 'thorn') },
  starShards: { setup: (f) => [f(150, 0), f(150, 200)], steps: 90, watch: (world) => echoShot(world, 'starShards') },
  sunNeedles: { setup: (f) => f(400, 0), steps: 60, watch: (world) => world.projectiles.some((shot) => shot.skillId === 'sunNeedles' && shot.radius > ARSENAL.sunNeedles.size * 1.1) },
  inkDrizzle: { setup: (f) => [f(150, 0), f(0, 250)][1], steps: 120, check: (r, off) => hurt(r, off) },
  pinHail: { setup: (f) => f(200, 0), steps: 90, watch: (world) => zone(world, 'pinHail') },
  // Shots behind the way the player last moved (right, until it moves).
  tailGuard: { setup: (f) => f(-120, 0, { tier: 'large' }), steps: 90, watch: (world, _, r) => mark(r, 'tailGuard') },
  smokeTail: { setup: (f) => f(-150, 0), steps: 90, watch: (world) => zone(world, 'smokeTail') },
  gravePins: { setup: (f) => f(-150, 0), steps: 90, watch: (world) => zone(world, 'gravePins') },
  trackingSeals: { setup: (f) => [f(150, -80), f(150, 80), f(260, 0), f(200, 0)], steps: 120, watch: (world) => world.beams.some((beam) => beam.skillId === 'trackingSeals') },
  huntersMarks: { setup: (f) => f(150, 0), crit: 1, steps: 120, watch: (world) => marked(world, 'prey') },
  crowFeathers: { setup: (f) => f(150, 0), steps: 120, strip: (world) => world.enemies.some((enemy) => enemy.awk?.pecks > 0) },
  bossbane: {
    setup: (f, r) => r.probe.spawnBoss('mid', { x: r.player.x + 300, y: r.player.y, hp: 1e9 }),
    steps: 480,
    check: (r) => blasts(r, 'bossbane').length > 0,
  },
  inkLightning: { setup: (f) => [f(150, 0), f(250, 60)], steps: 120, check: (r) => stuns(r, 'inkLightning') > 0 },
  brushDownpour: {
    setup: (f) => [[150, 0], [-150, 0], [0, 150], [0, -150], [200, 200], [-200, -200]].forEach(([x, y]) => f(x, y)),
    steps: 60,
    check: (r) => new Set(blasts(r, 'brushDownpour').map((blast) => Math.round(blast.radius))).size > 1,
  },
  fallingScroll: { setup: (f) => f(200, 0), steps: 60, watch: (world) => world.beams.some((beam) => beam.skillId === 'fallingScroll') },
  seventhSeal: { setup: (f) => [f(150, 0), f(-150, 0), f(0, 200)], steps: 120, check: (r) => blasts(r, 'seventhSeal').some((blast) => blast.radius === 120) },
  inkPulse: {
    // A wall just behind the enemy.
    setup: (f, r) => {
      r.probe.addObstacle({ x: r.player.x + 116, y: r.player.y - 60, w: 40, h: 120, kind: 'solid' });
      f(100, 0);
    },
    steps: 150,
    check: (r) => stuns(r, 'inkPulse') > 0,
  },
  frostRing: {
    // Already slowed, no crits: the first hit is the awakened hit, doubled only by the gimmick.
    setup: (f, r) => {
      const id = f(100, 0);
      r.probe.patchEnemy(id, { slowMultiplier: 0.5, slowTimer: 100 });
      return id;
    },
    crit: 0,
    steps: 60,
    check: (r, id) => {
      const [first] = hits(r, id);
      return first !== undefined && first.damage > 1.5 * r.probe.read().player.stats.attack * arsenalStats(ARSENAL.frostRing, 5, true).damage;
    },
  },
  thunderclap: { setup: (f) => f(100, 0), steps: 120, check: (r) => new Set(blasts(r, 'thunderclap').map((blast) => Math.round(blast.radius))).size > 1 },
  silenceBell: { setup: (f) => f(150, 0, { attackStyle: 'ranged' }), steps: 60, watch: (world) => marked(world, 'silence') },
  // The burning ink is the player's: it hurts what stands in it but paints no coral burn on them (K10 brief §12).
  inkPots: { setup: (f) => f(200, 0), steps: 120, watch: (world) => zone(world, 'inkPots') && !world.enemies.some((enemy) => enemy.burn > 0) },
  clusterPots: { setup: (f) => f(200, 0), steps: 150, check: (r) => new Set(blasts(r, 'clusterPots').map((blast) => Math.round(blast.radius))).size > 1 },
  tarJar: {
    // The jar lands on the nearer enemy and gathers the farther one in.
    setup: (f) => [f(200, 0), f(300, 0)][1],
    steps: 150,
    check: (r, far) => r.probe.read().enemies.some((enemy) => enemy.id === far && enemy.x < r.player.x + 290),
  },
  meteorBrush: { setup: (f) => f(200, 0), steps: 150, watch: (world) => zone(world, 'meteorBrush') },
  sparkThread: { setup: (f) => [f(150, 0), f(260, 0), f(370, 0)], steps: 60, watch: (world, _, r) => world.chains.some((chain) => chain.skillId === 'sparkThread' && Math.hypot(chain.points[0].x - r.player.x, chain.points[0].y - r.player.y) > 100) },
  stormThread: {
    setup: (f) => [f(150, 0), f(260, 0), f(370, 0)],
    crit: 0,
    steps: 30,
    check: (r, ids) => {
      const [a, b, c] = ids.map((id) => hits(r, id)[0]?.damage ?? 0);
      return a > 0 && b > a && c > b;
    },
  },
  frostChainlet: { setup: (f) => [f(150, 0), f(260, 0), f(370, 0)], steps: 60, watch: (world) => world.enemies.some((enemy) => enemy.awk?.link) },
  inkLance: { setup: (f) => f(150, 0), steps: 60, watch: (world) => world.beams.filter((beam) => beam.skillId === 'inkLance').length >= 3 },
  wideBrush: { setup: (f) => f(150, 0), steps: 90, watch: (world) => world.beams.some((beam) => beam.skillId === 'wideBrush' && beam.x2 < beam.x1 - 10) },
  crossStrokes: {
    // An enemy at 45 degrees: aimed strokes lie on the diagonals; the turning cross starts square.
    setup: (f) => f(150, 150),
    steps: 60,
    watch: (world) => world.beams.some((beam) => beam.skillId === 'crossStrokes' && Math.abs(Math.sin(2 * Math.atan2(beam.y2 - beam.y1, beam.x2 - beam.x1))) < 0.5),
  },
  judgmentLine: {
    setup: (f, r) => {
      const id = f(200, 0);
      r.probe.patchEnemy(id, { hp: 1e6 * 0.1 });
      return r.probe.read().enemies.find((enemy) => enemy.id === id).xp;
    },
    steps: 120,
    check: (r, xp) => {
      const world = r.probe.read();
      const earned = world.player.xp + world.pickups.filter((pickup) => pickup.kind === 'xp').reduce((sum, pickup) => sum + pickup.value, 0);
      return xp > 0 && earned >= 2 * xp;
    },
  },
  inkOrbit: {
    setup: (f, r) => {
      f(100, 0);
      r.probe.spawnHostileShot({ x: r.player.x - 100, y: r.player.y, vx: 40, vy: 0, damage: 5, life: 4, kind: 'enemy' });
    },
    steps: 60,
    watch: (world) => echoShot(world, 'inkOrbit'),
  },
  wardRing: { setup: (f) => f(60, 0), steps: 90, watch: (world) => marked(world, 'weak') },
  eclipseHalo: {
    // The near one stands in the halo's hollow middle; the far one keeps it sweeping.
    setup: (f) => [f(50, 0), f(180, 0)][0],
    steps: 420,
    check: (r, inside) => hurt(r, inside),
  },
};

/** Plays one weapon's scenario one way; whether its gimmick showed. */
function play(id, mode) {
  const scenario = SCENARIOS[id];
  const r = arena();
  try {
    r.probe.setSkills({ [id]: { level: 5, awakened: mode !== 'asleep' } });
    if (mode === 'off') r.probe.patchRules({ awakeningGimmicks: false });
    if (scenario.crit !== undefined) r.probe.setPlayer({ stats: { critChance: scenario.crit } });
    const foe = (dx, dy, extra = {}) => r.probe.spawnEnemy({ tier: 'small', x: r.player.x + dx, y: r.player.y + dy, hp: 1e6, speed: 0, damage: 0, ...extra });
    const found = scenario.setup(foe, r);
    const context = scenario.context?.();
    let seen = false;
    let stripped = -1;
    for (let tick = 0; tick < scenario.steps && !seen; tick += 1) {
      r.probe.step(1);
      if ((scenario.watch || (scenario.strip && stripped < 0)) && tick % 2 === 0) {
        const world = r.probe.read();
        if (scenario.watch?.(world, context, r)) seen = true;
        if (scenario.strip?.(world)) {
          r.probe.setSkills({});
          stripped = r.events.length;
        }
      }
    }
    if (stripped >= 0) seen ||= r.events.slice(stripped).some((event) => event.type === 'enemy/hit');
    return seen || (scenario.check?.(r, found) ?? false);
  } finally {
    r.engine.dispose();
  }
}

test('SYS-16: every arsenal weapon has a scenario', () => {
  assert.deepEqual(Object.keys(SCENARIOS).sort(), [...ARSENAL_IDS].sort());
});

const KINDS = [...new Set(ARSENAL_IDS.map((id) => ARSENAL[id].kind))];
for (const kind of KINDS) {
  test(`SYS-16: ${kind} weapons show their gimmick only awakened, and only under the rule`, () => {
    const wrong = [];
    for (const id of ARSENAL_IDS.filter((weapon) => ARSENAL[weapon].kind === kind)) {
      for (const mode of MODES) {
        const seen = play(id, mode);
        if (seen !== (mode === 'on')) wrong.push(`${id} ${mode}: ${seen ? 'seen' : 'not seen'}`);
      }
    }
    assert.deepEqual(wrong, []);
  });
}

test('SYS-16: a meteor mark hastens every cooldown of the player standing in it', () => {
  const pace = (awakened) => {
    const r = arena();
    try {
      r.probe.setSkills({ meteorBrush: { level: 5, awakened }, frostRing: { level: 1 } });
      r.probe.spawnEnemy({ tier: 'small', x: r.player.x + 40, y: r.player.y, hp: 1e9, speed: 0, damage: 0 });
      r.probe.step(150);
      const before = r.probe.read();
      r.probe.step(1);
      const after = r.probe.read();
      return { zone: before.zones.some((piece) => piece.weapon === 'meteorBrush'), drop: before.skillCooldowns.frostRing - after.skillCooldowns.frostRing };
    } finally {
      r.engine.dispose();
    }
  };
  const fast = pace(true);
  const plain = pace(false);
  assert.ok(fast.zone, 'the mark lies under the player');
  assert.ok(Math.abs(fast.drop - 1.3 / 60) < 1e-6, `a step takes ${fast.drop} off`);
  assert.ok(Math.abs(plain.drop - 1 / 60) < 1e-6, `a step takes ${plain.drop} off`);
});

test('SYS-16: bosses are never held back, and gimmick damage still reaches them', () => {
  const r = arena();
  try {
    r.probe.setSkills({ silenceBell: { level: 5, awakened: true }, wardRing: { level: 5, awakened: true }, inkDarts: { level: 5, awakened: true } });
    const boss = r.probe.spawnBoss('mid', { x: r.player.x + 120, y: r.player.y, hp: 1e9 });
    r.probe.step(300);
    const world = r.probe.read();
    const marks = world.enemies.find((enemy) => enemy.id === boss)?.awk ?? {};
    assert.equal(marks.silence, undefined, 'no silence on a boss');
    assert.equal(marks.weak, undefined, 'no weakness on a boss');
    assert.ok(blasts(r, 'inkDarts').length > 0, 'ink stains still burst on a boss');
  } finally {
    r.engine.dispose();
  }
});

test('SYS-16: the awakening card adds the weapon\'s gimmick under the rule, and only then', () => {
  installStrings(localeTable('ko'), 'ko');
  for (const rules of ['remaster', 'classic']) {
    const r = arena(rules);
    try {
      r.probe.setSkills({ inkDarts: { level: 5 } });
      const body = r.probe.previewOffer('inkDarts', 'awakening').body;
      if (rules === 'remaster') {
        assert.equal(body.key, 'skill.arsenal.awakening.gimmick');
        assert.match(tx(body), /^피해 \+35%, 투사체 \+1, 범위·사거리 \+20%\. 먹 얼룩: .*3겹.*반경 70에 피해 120%\.$/);
      } else {
        assert.equal(body.key, 'skill.arsenal.awakening');
      }
    } finally {
      r.engine.dispose();
    }
  }
});

test('SYS-16: classic rules fire nothing new: no ground, marks, echoes, or gimmick events', () => {
  const r = arena('classic');
  try {
    r.probe.setSkills(Object.fromEntries(ARSENAL_IDS.map((id) => [id, { level: 5, awakened: true }])));
    for (const [dx, dy] of [[150, 0], [-150, 0], [0, 150], [0, -150], [100, 100]]) {
      r.probe.spawnEnemy({ tier: 'small', x: r.player.x + dx, y: r.player.y + dy, hp: 1e6, speed: 0, damage: 0 });
    }
    for (let tick = 0; tick < 240; tick += 20) {
      r.probe.step(20);
      const world = r.probe.read();
      assert.deepEqual(world.zones, []);
      assert.ok(world.enemies.every((enemy) => enemy.awk === undefined), 'no marks');
      assert.ok(world.projectiles.every((shot) => !shot.echo), 'no echo shots');
    }
    assert.ok(!r.events.some((event) => (event.type === 'area/blast' && ARSENAL_IDS.includes(event.source)) || (event.type === 'enemy/stunned' && event.source)));
  } finally {
    r.engine.dispose();
  }
});

test('SYS-16: frightened enemies run, lost ones wander, silenced ones start no shot, and weakened ones hit softer', () => {
  const r = arena();
  try {
    r.probe.setSkills({});
    const { x, y } = r.player;
    const chaser = r.probe.spawnEnemy({ tier: 'small', x: x + 300, y, hp: 1e6, speed: 120, damage: 0 });
    const scared = r.probe.spawnEnemy({ tier: 'small', x, y: y + 300, hp: 1e6, speed: 120, damage: 0 });
    const lost = r.probe.spawnEnemy({ tier: 'small', x: x - 300, y, hp: 1e6, speed: 120, damage: 0 });
    const quiet = r.probe.spawnEnemy({ tier: 'small', x, y: y - 300, hp: 1e6, speed: 0, damage: 10, attackStyle: 'ranged' });
    const weak = r.probe.spawnEnemy({ tier: 'small', x: x + 250, y: y + 250, hp: 1e6, speed: 0, damage: 10, attackStyle: 'ranged' });
    r.probe.patchEnemy(scared, { awk: { fear: 999 } });
    r.probe.patchEnemy(lost, { awk: { wander: 999 } });
    r.probe.patchEnemy(quiet, { awk: { silence: 999 } });
    r.probe.patchEnemy(weak, { awk: { weak: 999 } });
    let telegraphed = false;
    for (let tick = 0; tick < 240; tick += 1) {
      r.probe.step(1);
      telegraphed ||= r.probe.read().enemies.find((enemy) => enemy.id === quiet).rangedTelegraph > 0;
    }
    const world = r.probe.read();
    const gap = (id) => {
      const enemy = world.enemies.find((candidate) => candidate.id === id);
      return Math.hypot(enemy.x - world.player.x, enemy.y - world.player.y);
    };
    assert.ok(gap(chaser) < 120, `the chaser closed in (${gap(chaser)})`);
    assert.ok(gap(scared) > 300, `the frightened one ran (${gap(scared)})`);
    assert.ok(gap(lost) > gap(chaser) + 60, `the lost one wandered (${gap(lost)})`);
    assert.equal(telegraphed, false, 'the silenced shooter never aimed');
    // Their signs draw over their heads.
    r.probe.render();
    const weakShot = world.bossProjectiles.find((shot) => shot.kind === 'enemy');
    assert.ok(weakShot, 'the weakened shooter fired');
    assert.ok(Math.abs(weakShot.damage - 10 * 0.72 * 0.7) < 1e-9, `its shot carries ${weakShot.damage}`);
  } finally {
    r.engine.dispose();
  }
});

test('SYS-16: ground pieces act on enemies that step in: caltrops hurt and graves bind the first, smoke loses, tar gathers', () => {
  const ground = (weapon, place) => {
    const r = arena();
    try {
      r.probe.setSkills({ [weapon]: { level: 5, awakened: true } });
      r.probe.spawnEnemy({ tier: 'large', x: r.player.x + place[0], y: r.player.y + place[1], hp: 1e6, speed: 0, damage: 0 });
      let piece;
      for (let tick = 0; tick < 120 && !piece; tick += 1) {
        r.probe.step(1);
        piece = r.probe.read().zones.find((zone) => zone.weapon === weapon);
      }
      assert.ok(piece, `${weapon} left ground`);
      r.probe.setSkills({});
      r.probe.clear('enemies');
      const walker = r.probe.spawnEnemy({ tier: 'small', x: piece.x + 4, y: piece.y, hp: 1e6, speed: 0, damage: 0 });
      // The ground draws as the player's, under the bodies.
      r.probe.setCamera({ x: piece.x - 720, y: piece.y - 450 });
      r.probe.render();
      assert.equal(r.probe.renderWorld().zones.length > 0, true);
      const before = r.events.length;
      r.probe.step(2);
      const world = r.probe.read();
      return { r, world, walker: world.enemies.find((enemy) => enemy.id === walker), piece, events: r.events.slice(before), left: world.zones.filter((zone) => zone.weapon === weapon && zone.x === piece.x && zone.y === piece.y).length };
    } finally {
      r.engine.dispose();
    }
  };
  const caltrop = ground('pinHail', [200, 0]);
  assert.ok(caltrop.events.some((event) => event.type === 'enemy/hit' && event.id === caltrop.walker.id), 'a caltrop hurts the first to step on it');
  assert.equal(caltrop.left, 0, 'and is gone');
  const grave = ground('gravePins', [-150, 0]);
  assert.ok(grave.walker.root > 0, 'a grave binds the first to step on it');
  assert.equal(grave.left, 0, 'and is gone');
  const smoke = ground('smokeTail', [-150, 0]);
  assert.ok(smoke.walker.awk.wander > smoke.world.elapsed, 'smoke loses an enemy in it');
  const tar = ground('tarJar', [200, 0]);
  assert.ok(tar.walker.x < tar.piece.x + 4, 'tar gathers an enemy to its middle');
});

test('SYS-16: a frost chain links its enemies, who then share what any of them takes', () => {
  const run = (gimmicks) => {
    const r = arena();
    try {
      if (!gimmicks) r.probe.patchRules({ awakeningGimmicks: false });
      r.probe.setSkills({ frostChainlet: { level: 5, awakened: true } });
      const ids = [150, 260, 370].map((dx) => r.probe.spawnEnemy({ tier: 'small', x: r.player.x + dx, y: r.player.y, hp: 1e6, speed: 0, damage: 0 }));
      r.probe.step(3);
      // Then one bossbane shot strikes the nearest enemy alone.
      r.probe.setSkills({ bossbane: { level: 1 } });
      const before = r.events.length;
      r.probe.step(20);
      const struck = new Set(r.events.slice(before).filter((event) => event.type === 'enemy/hit').map((event) => event.id));
      return ids.map((id) => struck.has(id));
    } finally {
      r.engine.dispose();
    }
  };
  assert.deepEqual(run(true), [true, true, true]);
  assert.deepEqual(run(false), [true, false, false]);
});

test('SYS-16: prey takes a quarter more from every source, and pollen slows those near its carrier', () => {
  const hit = (prey) => {
    const r = arena();
    try {
      r.probe.setSkills({ frostRing: { level: 1 } });
      r.probe.setPlayer({ stats: { critChance: 0 } });
      const id = r.probe.spawnEnemy({ tier: 'small', x: r.player.x + 80, y: r.player.y, hp: 1e6, speed: 0, damage: 0 });
      if (prey) r.probe.patchEnemy(id, { awk: { prey: 999 } });
      r.probe.step(10);
      return hits(r, id)[0].damage;
    } finally {
      r.engine.dispose();
    }
  };
  assert.ok(Math.abs(hit(true) / hit(false) - 1.25) < 1e-9);
  const r = arena();
  try {
    r.probe.setSkills({});
    const carrier = r.probe.spawnEnemy({ tier: 'small', x: r.player.x + 300, y: r.player.y, hp: 1e6, speed: 0, damage: 0 });
    const near = r.probe.spawnEnemy({ tier: 'small', x: r.player.x + 330, y: r.player.y, hp: 1e6, speed: 0, damage: 0 });
    const far = r.probe.spawnEnemy({ tier: 'small', x: r.player.x + 500, y: r.player.y, hp: 1e6, speed: 0, damage: 0 });
    r.probe.patchEnemy(carrier, { awk: { pollen: 999, pollenAt: 0 } });
    r.probe.step(2);
    const slowed = (id) => r.probe.read().enemies.find((enemy) => enemy.id === id).slowTimer > 0;
    assert.ok(slowed(near), 'the neighbour is slowed');
    assert.ok(!slowed(far) && !slowed(carrier), 'no one else');
    assert.equal(r.probe.read().enemies.find((enemy) => enemy.id === near).awk?.pollen, undefined, 'and does not carry it on');
  } finally {
    r.engine.dispose();
  }
});
