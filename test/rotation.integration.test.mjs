import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, holdDirection, installHeadlessPlatform, localeTable, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// The infinite run's rotation (CON-08, infiniteRotation rule; remaster on, classic off): once a chapter has lasted five
// minutes, the next round boss to fall turns the run to the next chapter's look without rebuilding the map. Round
// bosses come from the chapter on screen, and its field boss joins them 150 s in. The daily and weekly challenge
// seeds come from the local date, and their runs are as deterministic as any seed (G14).
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, OBSTACLE_CATALOGUE, BOSS_TOUGHNESS, INFINITE_ROTATION, dailySeed, infiniteKillScore, installStrings, weeklySeed } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');
installStrings(localeTable('ko'));

function run({ rules = 'remaster', seed = 4242, viewport = [1440, 900], options = {}, god = true } = {}) {
  const results = [];
  const events = [];
  const engine = new ProbedGameEngine(createHeadlessCanvas(viewport[0], viewport[1]), maxMeta(), { ...standardOptions(), ...options }, {
    onSnapshot() {},
    onDraft(draft) { engine.completeDraft(draft.cards[0], draft.id); },
    onRoundClear(result) { results.push(result); },
    onGameOver(result) { results.push(result); },
  });
  engine.setRuleSet(rules);
  engine.subscribe((event) => events.push(event));
  engine.startInfiniteRun(seed, true);
  if (god) engine.probe.setGodMode();
  return { engine, probe: engine.probe, results, events };
}

const roundBoss = (probe) => probe.read().enemies.find((enemy) => enemy.isBoss && enemy.hp > 0 && enemy.boss.role !== 'field');
const fieldBoss = (probe) => probe.read().enemies.find((enemy) => enemy.isBoss && enemy.hp > 0 && enemy.boss.role === 'field');

/** Fells the round boss and steps on until the next one has come (2.4 s later), keeping the crowd thin. */
function fellRoundBoss(probe) {
  const fallen = roundBoss(probe).id;
  probe.patchEnemy(fallen, { hp: 0 });
  for (let step = 0; step < 60 * 4 && (roundBoss(probe)?.id ?? fallen) === fallen; step += 1) {
    probe.removeEnemies(probe.read().enemies.filter((enemy) => !enemy.isBoss).map((enemy) => enemy.id));
    probe.step(1);
  }
  assert.notEqual(roundBoss(probe)?.id ?? fallen, fallen, 'the next round boss came');
}

test('CON-08: five minutes on, the next round boss to fall turns the run to the next chapter; the map stays', () => {
  const r = run();
  try {
    const { probe } = r;
    assert.deepEqual([probe.hud().lookChapter, probe.renderWorld().chapter, roundBoss(probe).boss.chapter], [1, 1, 1]);
    const before = probe.read().obstacles.map((obstacle) => ({ ...obstacle }));
    assert.ok(before.some((obstacle) => obstacle.art?.startsWith('pillar')) && before.some((obstacle) => obstacle.art?.startsWith('solid')));

    // A boss that falls before the chapter's time is up leaves it as it is.
    probe.setClock({ elapsed: 270 });
    fellRoundBoss(probe);
    assert.deepEqual([probe.hud().lookChapter, probe.hud().nextLookChapter, roundBoss(probe).boss.chapter], [1, null, 1]);
    // The next chapter's art loads 20 s ahead, and the turn waits for the round boss.
    probe.setClock({ elapsed: INFINITE_ROTATION.chapterSeconds - INFINITE_ROTATION.preloadSeconds + 1 });
    probe.step(1);
    assert.equal(probe.hud().nextLookChapter, 2);
    probe.setClock({ elapsed: 330 });
    probe.step(1);
    assert.equal(probe.hud().lookChapter, 1);
    fellRoundBoss(probe);
    assert.deepEqual([probe.hud().lookChapter, probe.hud().nextLookChapter, probe.renderWorld().chapter], [2, null, 2]);
    assert.equal(roundBoss(probe).boss.chapter, 2, 'round bosses come from the chapter on screen');
    assert.deepEqual(r.events.filter((event) => event.type === 'chapter/turned').map((event) => event.chapter), [2]);

    // Blocks keep their footprints and pillars take the new chapter's, about the same centres.
    const after = probe.read().obstacles;
    assert.equal(after.length, before.length);
    after.forEach((obstacle, index) => {
      const old = before[index];
      assert.equal(obstacle.id, old.id);
      assert.ok(Math.abs(obstacle.x + obstacle.w / 2 - (old.x + old.w / 2)) < 1e-9 && Math.abs(obstacle.y + obstacle.h / 2 - (old.y + old.h / 2)) < 1e-9);
      const size = old.art?.startsWith('pillar') ? OBSTACLE_CATALOGUE[2].pillar[Number(old.art.slice(6))] : [old.w, old.h];
      assert.deepEqual([obstacle.w, obstacle.h], [...size], old.art);
    });

    // Every chapter in turn, and the fifth wraps to the first.
    for (const chapter of [3, 4, 5, 1]) {
      probe.setClock({ elapsed: probe.read().elapsed + INFINITE_ROTATION.chapterSeconds });
      fellRoundBoss(probe);
      assert.deepEqual([probe.hud().lookChapter, roundBoss(probe).boss.chapter], [chapter, chapter]);
    }
  } finally {
    r.engine.dispose();
  }
});

test('CON-08: 150 s into a chapter its field boss comes beside the round boss, and does not count as one', () => {
  const r = run();
  try {
    const { probe } = r;
    probe.setClock({ elapsed: INFINITE_ROTATION.fieldBossAt - 1 });
    probe.step(30);
    assert.equal(fieldBoss(probe), undefined);
    probe.step(60);
    const field = fieldBoss(probe);
    assert.equal(field?.boss.id, 'field-shock', 'the chapter on screen sends its own');
    assert.equal(probe.hud().bossId, roundBoss(probe).boss.id, 'the boss bar keeps to the round boss');

    // The round bosses keep coming while it lives, and it stands at a share of one that came at the same minute
    // (SYS-12 toughens field bosses by their own factor, round bosses by at least 1).
    fellRoundBoss(probe);
    assert.ok(fieldBoss(probe));
    const share = fieldBoss(probe).maxHp / roundBoss(probe).maxHp;
    assert.ok(share > 0.35 && share < INFINITE_ROTATION.fieldBossHp * BOSS_TOUGHNESS.infinite.fieldHp + 0.01, `${(share * 100).toFixed(1)}% of a round boss`);
    const before = probe.hud();
    probe.removeEnemies(probe.read().enemies.filter((enemy) => !enemy.isBoss).map((enemy) => enemy.id));
    probe.patchEnemy(fieldBoss(probe).id, { hp: 0 });
    probe.step(1);
    const after = probe.hud();
    const bounty = infiniteKillScore('fieldBoss', before.elapsed);
    assert.equal(after.bossKills, before.bossKills, 'not a round boss kill');
    assert.ok(after.score - before.score >= bounty && after.score - before.score < bounty + 400, `scored ${after.score - before.score}, its bounty ${bounty}`);
    // One a chapter.
    for (let step = 0; step < 60 * 20; step += 30) {
      probe.removeEnemies(probe.read().enemies.filter((enemy) => !enemy.isBoss).map((enemy) => enemy.id));
      probe.step(30);
    }
    assert.equal(fieldBoss(probe), undefined);
  } finally {
    r.engine.dispose();
  }
});

test('CON-08: classic rules keep the infinite run in the first chapter, with any round boss and no field boss', () => {
  const r = run({ rules: 'classic' });
  try {
    const { probe } = r;
    const chapters = [roundBoss(probe).boss.chapter];
    probe.setClock({ elapsed: 330 });
    for (let kill = 0; kill < 6; kill += 1) {
      fellRoundBoss(probe);
      chapters.push(roundBoss(probe).boss.chapter);
    }
    assert.deepEqual([probe.hud().lookChapter, probe.hud().nextLookChapter, probe.renderWorld().chapter], [1, null, 1]);
    assert.equal(fieldBoss(probe), undefined);
    assert.ok(chapters.some((chapter) => chapter > 1), `round bosses from chapters ${chapters.join(', ')}`);
  } finally {
    r.engine.dispose();
  }
});

test('CON-08: a run finds the chapters it turned to, and its enemies by the chapter on screen', () => {
  const r = run();
  try {
    const { probe } = r;
    probe.setClock({ elapsed: INFINITE_ROTATION.chapterSeconds });
    fellRoundBoss(probe);
    const { player } = probe.read();
    const id = probe.spawnEnemy({ tier: 'small', x: player.x + 300, y: player.y, speed: 0, damage: 0 });
    probe.patchEnemy(id, { hp: 0 });
    probe.step(1);
    probe.setGodMode(false);
    probe.setPlayer({ hp: 0 });
    probe.step(1);
    const result = r.results.at(-1);
    assert.equal(result?.runMode, 'infinite');
    assert.deepEqual([...result.found.chapters].sort(), ['1', '2']);
    assert.ok(result.found.enemies.includes('2-stalker'), result.found.enemies.join(', '));
  } finally {
    r.engine.dispose();
  }
});

/** A scripted daily-seed run: steered in a square, with the clock moved on to a field boss and a turn. */
function dailyRun(seed, viewport, options) {
  const r = run({ seed, viewport, options });
  const { engine, probe } = r;
  const directions = ['d', 's', 'a', 'w'];
  try {
    for (let tick = 0; tick < 2400; tick += 1) {
      if (tick % 180 === 0) holdDirection(engine, directions[(tick / 180) % 4]);
      if (tick === 300) probe.setClock({ elapsed: INFINITE_ROTATION.fieldBossAt - 2 });
      if (tick === 900) {
        probe.setClock({ elapsed: INFINITE_ROTATION.chapterSeconds - 1 });
        probe.patchEnemy(roundBoss(probe).id, { hp: 1 });
      }
      probe.step(1);
    }
    const world = probe.read();
    return JSON.stringify({
      look: probe.hud().lookChapter,
      score: probe.hud().score,
      player: [world.player.x, world.player.y, world.player.hp, world.player.kills, world.player.level],
      enemies: world.enemies.map((enemy) => [enemy.tier, enemy.boss?.id ?? '', enemy.x, enemy.y, enemy.hp]),
      obstacles: world.obstacles.map((obstacle) => [obstacle.x, obstacle.y, obstacle.w, obstacle.h]),
    });
  } finally {
    engine.dispose();
  }
}

test('CON-08/G14: the daily and weekly seeds hold for their date, and their runs play the same in any window', () => {
  const day = new Date(2026, 9, 1, 8, 30);
  // Pinned: a build that changed these would hand its players a different day's run.
  assert.equal(dailySeed(day), 1_235_909_805);
  assert.equal(weeklySeed(day), 3_618_577_389);
  assert.equal(dailySeed(new Date(2026, 9, 1, 23, 59)), dailySeed(day), 'all day long');
  assert.notEqual(dailySeed(new Date(2026, 9, 2)), dailySeed(day));
  assert.equal(weeklySeed(new Date(2026, 8, 28)), weeklySeed(day), 'from Monday');
  assert.equal(weeklySeed(new Date(2026, 9, 4, 23, 59)), weeklySeed(day), 'to Sunday');
  assert.notEqual(weeklySeed(new Date(2026, 9, 5)), weeklySeed(day));

  const reference = dailyRun(dailySeed(day), [1440, 900], {});
  assert.equal(JSON.parse(reference).look, 2, 'the scripted run turned to the next chapter');
  for (const [label, viewport, options] of [
    ['again', [1440, 900], {}],
    ['1024x720 window', [1024, 720], {}],
    ['damage numbers off, low effects', [1440, 900], { damageNumbers: false, effects: 0.3 }],
  ]) {
    assert.equal(dailyRun(dailySeed(day), viewport, options), reference, label);
  }
});
