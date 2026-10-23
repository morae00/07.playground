import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Characters (CON-10, characters rule; remaster on, classic off): the run starts with the character's weapon at the
// level its upgrades give, and its perk joins the stats; a suspended run keeps its character.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, CHARACTERS, CHARACTER_IDS, SKILLS, characterStartLevel } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

function engineAs(rules, character) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), { onSnapshot() {}, onDraft(draft) { engine.completeDraft(draft.cards[0], draft.id); }, onRoundClear() {}, onGameOver() {} });
  engine.setRuleSet(rules);
  engine.setCharacter(character);
  return engine;
}

test('CON-10: eight characters, each starting with its own weapon; the first one is free', () => {
  assert.equal(CHARACTER_IDS.length, 8);
  assert.equal(new Set(CHARACTER_IDS.map((id) => CHARACTERS[id].weapon)).size, 8);
  assert.equal(CHARACTERS.gyeol.unlock, null);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(characterStartLevel), [1, 2, 2, 3, 3, 4]);
});

test('CON-10: a character starts the run with its weapon at its upgraded level, with its perk in the stats', () => {
  const plain = engineAs('remaster', null);
  const dok = engineAs('remaster', { id: 'dok', level: 3 });
  const classic = engineAs('classic', { id: 'dok', level: 3 });
  try {
    plain.startRun(2, 2, 3131);
    dok.startRun(2, 2, 3131);
    classic.startRun(2, 2, 3131);
    assert.deepEqual(Object.keys(plain.probe.read().skills), ['needleStorm'], 'no character: 0.1.0 start');
    assert.deepEqual(dok.probe.read().skills, { inkPots: { level: 3, awakened: false } });
    assert.ok(Math.abs(dok.probe.read().player.stats.maxHp / plain.probe.read().player.stats.maxHp - (1 + 0.06 * 4)) < 1e-9, 'max health +24% at level 3');
    assert.deepEqual(Object.keys(classic.probe.read().skills), ['needleStorm'], 'classic rules ignore characters');
  } finally {
    plain.dispose();
    dok.dispose();
    classic.dispose();
  }
});

test('CON-10: a suspended run keeps its character and replays to the same state', async () => {
  const first = engineAs('remaster', { id: 'wol', level: 5 });
  let state;
  let reference;
  try {
    first.startRun(3, 2, 4545);
    first.probe.setGodMode();
    for (let frame = 0; frame < 60 * 20; frame += 1) first.advanceFrame(1 / 60, false);
    state = first.suspendState();
    reference = first.probe.read();
  } finally {
    first.dispose();
  }
  assert.deepEqual(state.character, { id: 'wol', level: 5 });
  const second = engineAs('remaster', null);
  try {
    await second.resumeRun(JSON.parse(JSON.stringify(state)));
    const replayed = second.probe.read();
    assert.equal(replayed.skills.eclipseHalo?.level >= 4, true, 'the character weapon came back');
    assert.deepEqual([replayed.player.x, replayed.player.y, replayed.player.kills, replayed.elapsed], [reference.player.x, reference.player.y, reference.player.kills, reference.elapsed]);
  } finally {
    second.dispose();
  }
});

test('BUG-19: a character\'s weapon from a later chapter is offered in drafts below it, and levels to its awakening', () => {
  for (const [id, chapter] of [['hwi', 1], ['wol', 1], ['wol', 3]]) {
    const weapon = CHARACTERS[id].weapon;
    assert.ok(SKILLS[weapon].chapterMin > chapter, `${weapon} belongs to a later chapter than ${chapter}`);
    let offered = 0;
    // Takes the weapon's card whenever one is offered, and the first card otherwise.
    const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), {
      onSnapshot() {},
      onDraft(draft) {
        const card = draft.cards.find((offer) => (offer.kind === 'skill' || offer.kind === 'awakening') && offer.skillId === weapon);
        if (card) offered += 1;
        engine.completeDraft(card ?? draft.cards[0], draft.id);
      },
      onRoundClear() {},
      onGameOver() {},
    });
    engine.setRuleSet('remaster');
    engine.setCharacter({ id, level: 0 });
    try {
      engine.startRun(chapter, 2, 4242);
      engine.probe.haltSpawns();
      for (let draft = 0; draft < 40; draft += 1) engine.probe.openDraft('level', 'resume');
      assert.ok(offered >= 5, `${id} on chapter ${chapter}: ${weapon} offered in ${offered} of 40 drafts`);
      assert.deepEqual(engine.probe.read().skills[weapon], { level: 5, awakened: true });
    } finally {
      engine.dispose();
    }
  }
});
