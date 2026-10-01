import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, localeTable, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Build depth (SYS-08): an A/B experiment, off in both rule sets until the slot A/B decides. Under the buildDepth rule a
// build holds 6 active and 4 passive skills, owned skills weigh more, six fusion awakenings appear once both of their
// skills are awakened, account levels unlock reroll-or-banish tokens, and drafts opened together share one screen.
// Drafts keep 3 cards (4 for a boss), skills stop at Lv5, and the awakening card leads (G3, G4).
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, BUILD_DEPTH, SKILLS, installStrings } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');
installStrings(localeTable('ko'));

const ACTIVE = ['needleStorm', 'fanKnives', 'chainSpark', 'frostLine', 'orbitScythes', 'boneMortar'];
const PASSIVE = ['ironFrame', 'magnetSigil', 'paperWard', 'recoveryThread'];
const loadout = (ids, level = 1) => Object.fromEntries(ids.map((id) => [id, { level }]));
const awakened = (...ids) => Object.fromEntries(ids.map((id) => [id, { level: 5, awakened: true }]));

function run({ depth = true, level = 16, chapter = 5, stage = 4, seed = 808, rules = 'remaster' } = {}) {
  const drafts = [];
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), { ...maxMeta(), level }, standardOptions(), {
    onSnapshot() {},
    onDraft(draft) { drafts.push(draft); },
    onRoundClear() {},
    onGameOver() {},
  });
  engine.setRuleSet(rules);
  if (depth) engine.probe.patchRules({ buildDepth: true });
  engine.startRun(chapter, stage, seed);
  engine.probe.haltSpawns();
  engine.probe.clear('enemies', 'hazards', 'obstacles', 'pickups');
  return { engine, probe: engine.probe, drafts };
}

/** Opens a draft on a fixed build, takes a card that is not a fusion, and puts the build back. */
function sample(r, build, reason = 'level') {
  r.probe.setSkills(build);
  r.probe.openDraft(reason, 'resume');
  const draft = r.drafts.at(-1);
  r.engine.completeDraft(draft.cards.find((card) => card.kind !== 'fusion'), draft.id);
  r.probe.setSkills(build);
  return draft;
}

/** Takes a fusion through its draft card, keeping the build. */
function takeFusion(r, build, fusionId) {
  r.probe.setSkills(build);
  r.probe.openDraft('level', 'resume');
  const draft = r.drafts.at(-1);
  const card = draft.cards.find((candidate) => candidate.kind === 'fusion' && candidate.fusionId === fusionId);
  assert.ok(card, `${fusionId} is offered`);
  r.engine.completeDraft(card, draft.id);
  r.probe.setSkills(build);
}

test('SYS-08: off in both rule sets: no slots, tokens, or shared screens, and a reroll does nothing', () => {
  for (const rules of ['classic', 'remaster']) {
    const r = run({ depth: false, rules });
    try {
      assert.equal(r.probe.hud().slots, null);
      assert.equal(r.probe.hud().draftTokens, 0);
      r.probe.openDraft('level', 'resume');
      r.probe.openDraft('level', 'resume');
      assert.equal(r.drafts.length, 1, 'the second draft waits for the first');
      assert.equal(r.drafts[0].depth, undefined);
      assert.equal(r.engine.rerollDraft(), false);
    } finally {
      r.engine.dispose();
    }
  }
});

test('SYS-08: a build holds 6 active and 4 passive skills; a full kind is offered level-ups only', () => {
  const r = run();
  try {
    assert.deepEqual(r.probe.hud().slots, { active: 6, passive: 4 });
    const offeredNew = new Set();
    for (let index = 0; index < 60; index += 1) {
      for (const card of sample(r, loadout(ACTIVE)).cards) if (card.kind === 'skill' && card.level === 0) offeredNew.add(card.skillId);
    }
    assert.ok(offeredNew.size > 0 && [...offeredNew].every((id) => !SKILLS[id].active), `new skills are passive only: ${[...offeredNew]}`);
    for (let index = 0; index < 60; index += 1) {
      const draft = sample(r, loadout([...ACTIVE, ...PASSIVE]));
      assert.equal(draft.cards.length, 3);
      for (const card of draft.cards) assert.ok(card.kind !== 'skill' || card.level > 0, `${card.skillId} is new to a full build`);
    }
  } finally {
    r.engine.dispose();
  }
});

test('SYS-08: an owned skill weighs more than an unowned one of the same rarity', () => {
  const r = run();
  try {
    const counts = { needleStorm: 0, fanKnives: 0 };
    for (let index = 0; index < 1500; index += 1) {
      for (const card of sample(r, loadout(['needleStorm'])).cards) if (card.kind === 'skill' && card.skillId in counts) counts[card.skillId] += 1;
    }
    const ratio = counts.needleStorm / counts.fanKnives;
    assert.ok(ratio > 1.5 && ratio < BUILD_DEPTH.ownedWeight + 0.2, `owned needles ${counts.needleStorm}, unowned knives ${counts.fanKnives} (${ratio.toFixed(2)})`);
  } finally {
    r.engine.dispose();
  }
});

test('SYS-08: a fusion card takes the last place once both of its skills are awakened, after the awakening card', () => {
  const r = run();
  try {
    const half = { needleStorm: { level: 5, awakened: true }, executionMark: { level: 5 } };
    assert.ok(sample(r, half).cards.every((card) => card.kind !== 'fusion'), 'not before both are awakened');
    const both = awakened('needleStorm', 'executionMark');
    r.probe.setSkills(both);
    r.probe.openDraft('boss', 'resume');
    const boss = r.drafts.at(-1);
    assert.equal(boss.cards.length, 4, 'a boss draft keeps four cards');
    assert.deepEqual([boss.cards[3].kind, boss.cards[3].fusionId], ['fusion', 'executionRain']);
    r.engine.completeDraft(boss.cards[0], boss.id);

    // A skill that reaches Lv5 puts its awakening first; the fusion still takes the last place.
    r.probe.setSkills({ ...both, chainSpark: { level: 4 } });
    for (let tries = 0; tries < 60 && r.probe.read().skills.chainSpark.level < 5; tries += 1) {
      r.probe.openDraft('level', 'resume');
      const draft = r.drafts.at(-1);
      const pick = draft.cards.find((card) => card.kind === 'skill' && card.skillId === 'chainSpark') ?? draft.cards.find((card) => card.kind !== 'fusion');
      r.engine.completeDraft(pick, draft.id);
    }
    r.probe.openDraft('level', 'resume');
    const draft = r.drafts.at(-1);
    assert.equal(draft.cards.length, 3);
    assert.deepEqual([draft.cards[0].kind, draft.cards[0].skillId], ['awakening', 'chainSpark']);
    assert.deepEqual([draft.cards[2].kind, draft.cards[2].fusionId], ['fusion', 'executionRain']);
    r.engine.completeDraft(draft.cards.at(-1), draft.id);
    assert.deepEqual(r.probe.hud().fusions, ['executionRain']);
    assert.ok(sample(r, both).cards.every((card) => card.kind !== 'fusion'), 'a fusion is taken once');
  } finally {
    r.engine.dispose();
  }
});

test('SYS-08: fusions change their skills: more needles that finish, mirrored rails, chilling chains', () => {
  const needles = (fused) => {
    const r = run();
    try {
      const build = awakened('needleStorm', 'executionMark');
      if (fused) takeFusion(r, build, 'executionRain');
      else r.probe.setSkills(build);
      // Just over 15% of its health: any needle leaves it under.
      const { player } = r.probe.read();
      const id = r.probe.spawnEnemy({ tier: 'large', x: player.x + 160, y: player.y, hp: 1e6, speed: 0, damage: 0 });
      r.probe.patchEnemy(id, { hp: 150_001 });
      r.probe.cast('needleStorm');
      const count = r.probe.read().projectiles.filter((shot) => shot.skillId === 'needleStorm').length;
      r.probe.step(30);
      return { count, hp: r.probe.read().enemies.find((enemy) => enemy.id === id)?.hp ?? 0 };
    } finally {
      r.engine.dispose();
    }
  };
  const plain = needles(false);
  const fused = needles(true);
  assert.equal(fused.count, plain.count + BUILD_DEPTH.executionRain.extraNeedles, 'two more needles');
  assert.ok(plain.hp > 0 && fused.hp <= 0, `a needle finishes an enemy it leaves under 15% (${plain.hp.toFixed(0)} left without the fusion)`);

  const rails = (fused) => {
    const r = run();
    try {
      const build = awakened('railSpear', 'mirrorClone');
      if (fused) takeFusion(r, build, 'mirrorRail');
      else r.probe.setSkills(build);
      const { player } = r.probe.read();
      r.probe.spawnEnemy({ tier: 'large', x: player.x + 300, y: player.y, hp: 1e6, speed: 0, damage: 0 });
      let beams = 0;
      for (let cast = 0; cast < 6; cast += 1) {
        r.probe.clear('effects');
        r.probe.cast('railSpear');
        beams += r.probe.read().beams.length;
      }
      return beams;
    } finally {
      r.engine.dispose();
    }
  };
  assert.equal(rails(true), 6 * 3, 'every rail is copied by both clones');
  assert.ok(rails(false) < 6 * 3, 'without the fusion a rail is copied 30% of the time');

  const r = run();
  try {
    const build = awakened('chainSpark', 'frostLine');
    takeFusion(r, build, 'frostChain');
    const { player } = r.probe.read();
    const ids = [0, 1, 2].map((index) => r.probe.spawnEnemy({ tier: 'small', x: player.x + 120 + index * 60, y: player.y, hp: 1e6, speed: 0, damage: 0 }));
    r.probe.cast('chainSpark');
    const hit = r.probe.read().enemies.filter((enemy) => ids.includes(enemy.id));
    assert.ok(hit.every((enemy) => (enemy.slowMultiplier ?? 1) < 1), 'every jump chills');
    assert.ok(hit.some((enemy) => enemy.root > 0), 'the last jump roots');
  } finally {
    r.engine.dispose();
  }
});

test('SYS-08: fusions add voids and suns, and the iron ward hits back', () => {
  const vortices = (build, fusionId, skillId) => {
    const r = run();
    try {
      takeFusion(r, build, fusionId);
      const { player } = r.probe.read();
      for (let index = 0; index < 4; index += 1) r.probe.spawnEnemy({ tier: 'small', x: player.x + 40 + index * 20, y: player.y + 20, hp: 1e6, speed: 0, damage: 0 });
      r.probe.cast(skillId);
      return r.probe.read().hazards.filter((hazard) => hazard.kind === 'vortex');
    } finally {
      r.engine.dispose();
    }
  };
  const mortar = vortices(awakened('boneMortar', 'voidMine'), 'voidMortar', 'boneMortar');
  assert.equal(mortar.length, 1, 'a void where the shell lands');
  assert.equal(mortar[0].sourceSkillId, 'voidMine');
  const step = vortices(awakened('blackSun', 'eclipseStep'), 'eclipseSun', 'eclipseStep');
  assert.equal(step.length, 1, 'a sun where the step struck');
  assert.equal(step[0].sourceSkillId, 'blackSun');

  const r = run();
  try {
    const build = awakened('ironFrame', 'paperWard');
    takeFusion(r, build, 'ironWard');
    r.probe.setPlayer({ invuln: 0, shield: 0 });
    const { player } = r.probe.read();
    const id = r.probe.spawnEnemy({ tier: 'small', x: player.x + 20, y: player.y, hp: 1e6, speed: 0, damage: 20 });
    r.probe.step(1);
    const enemy = r.probe.read().enemies.find((candidate) => candidate.id === id);
    assert.ok(enemy.hp < 1e6 && enemy.stun > 0, `a hit is answered (${enemy.hp}, stun ${enemy.stun})`);
  } finally {
    r.engine.dispose();
  }
});

test('SYS-08: account levels 8 and 16 unlock a token each; a reroll redraws in place, a banish drops a skill for the run', () => {
  assert.deepEqual([1, 8, 16].map((level) => {
    const r = run({ level });
    const tokens = r.probe.hud().draftTokens;
    r.engine.dispose();
    return tokens;
  }), [0, 1, 2]);

  const r = run();
  try {
    r.probe.setSkills(loadout(['needleStorm']));
    r.probe.openDraft('level', 'resume');
    const first = r.drafts.at(-1);
    assert.equal(r.engine.rerollDraft(), true);
    const redrawn = r.drafts.at(-1);
    assert.ok(redrawn.depth.redraw && redrawn.depth.tokens === 1 && redrawn.cards.length === 3);
    assert.notEqual(redrawn.id, first.id, 'new cards, a new draft id');
    assert.equal(r.engine.completeDraft(first.cards[0], first.id), 'ignored', 'the old cards are gone');

    const banished = redrawn.cards.find((card) => card.kind === 'skill');
    assert.equal(r.engine.banishOffer(banished.offerId), true);
    const replaced = r.drafts.at(-1);
    assert.equal(replaced.depth.tokens, 0);
    assert.ok(replaced.cards.every((card) => card.kind !== 'skill' || card.skillId !== banished.skillId));
    assert.equal(r.engine.rerollDraft(), false, 'no tokens left');
    r.engine.completeDraft(replaced.cards.find((card) => card.kind !== 'fusion'), replaced.id);
    for (let index = 0; index < 40; index += 1) {
      assert.ok(sample(r, loadout(['needleStorm'])).cards.every((card) => card.kind !== 'skill' || card.skillId !== banished.skillId), `${banished.skillId} stays banished`);
    }
  } finally {
    r.engine.dispose();
  }
});

test('SYS-08: drafts opened together count through one screen, which opens once', () => {
  const r = run();
  try {
    for (let index = 0; index < 3; index += 1) r.probe.openDraft('level', 'resume');
    const seen = [];
    for (let index = 0; index < 3; index += 1) {
      const draft = r.drafts.at(-1);
      seen.push([draft.depth.index, draft.depth.total]);
      r.engine.completeDraft(draft.cards[0], draft.id);
    }
    assert.deepEqual(seen, [[1, 3], [2, 3], [3, 3]]);
    r.probe.openDraft('level', 'resume');
    assert.deepEqual([r.drafts.at(-1).depth.index, r.drafts.at(-1).depth.total], [1, 1], 'a new chain starts after play resumes');
  } finally {
    r.engine.dispose();
  }
});

test('SYS-08: the XP curve scales every level by xpScale and grows by xpGrowth per level', () => {
  const expected = (level) => Math.floor((level <= 1 ? 28 : 28 + level * 13 + level ** 1.35 * 4) * BUILD_DEPTH.xpScale * (1 + BUILD_DEPTH.xpGrowth * (level - 1)));
  const r = run();
  try {
    assert.equal(r.probe.hud().nextXp, expected(1));
    for (const level of [2, 10, 30]) {
      r.probe.setPlayer({ level: level - 1, xp: 0, nextXp: 1 });
      const { player } = r.probe.read();
      r.probe.spawnPickup({ kind: 'xp', x: player.x, y: player.y, value: 1 });
      r.probe.step(2);
      assert.equal(r.probe.hud().nextXp, expected(level), `level ${level}`);
      const draft = r.drafts.at(-1);
      if (draft) r.engine.completeDraft(draft.cards[0], draft.id);
    }
  } finally {
    r.engine.dispose();
  }
});

test('SYS-08: a run that spends tokens and takes drafts replays exactly from its suspended log (CON-04)', async () => {
  const engineFor = () => {
    const drafts = [];
    const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), { ...maxMeta(), level: 16 }, standardOptions(), {
      onSnapshot() {},
      onDraft(draft) { drafts.push(draft); },
      onRoundClear() {},
      onGameOver() {},
    });
    engine.setRuleSet('remaster');
    engine.probe.patchRules({ buildDepth: true });
    return { engine, drafts };
  };
  const fingerprint = ({ engine }) => {
    const world = engine.probe.read();
    const hud = engine.probe.hud();
    return JSON.stringify([world.player.x, world.player.y, world.player.hp, world.player.level, world.skills, hud.fusions, hud.draftTokens, world.enemies.map((enemy) => [enemy.id, enemy.x, enemy.y, enemy.hp]), world.elapsed]);
  };
  const original = engineFor();
  original.engine.startRun(2, 4, 4242);
  const moves = ['moveUp', 'moveRight', 'moveDown', 'moveLeft'];
  for (let frame = 0; frame < 2400; frame += 1) {
    const draft = original.drafts.at(-1);
    if (draft && original.engine.awaitingDraft) {
      const banish = draft.cards.find((card) => card.kind === 'skill');
      if (draft.depth.tokens === 2) original.engine.rerollDraft();
      else if (draft.depth.tokens === 1 && banish) original.engine.banishOffer(banish.offerId);
      else original.engine.completeDraft(draft.cards[0], draft.id);
      continue;
    }
    if (frame % 120 === 0) {
      for (const action of moves) original.engine.dispatch({ type: 'input/action', action, pressed: action === moves[(frame / 120) % 4] });
    }
    original.engine.advanceFrame(1 / 60, false);
  }
  const saved = JSON.parse(JSON.stringify(original.engine.suspendState()));
  assert.ok(saved.log.some(([, code]) => code === 'g') && saved.log.some(([, code]) => code === 'n'), 'the log has a reroll and a banish');
  const resumed = engineFor();
  await resumed.engine.resumeRun(saved, 700);
  assert.equal(fingerprint(resumed), fingerprint(original));
  original.engine.dispose();
  resumed.engine.dispose();
});
