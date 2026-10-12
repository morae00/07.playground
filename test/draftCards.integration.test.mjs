import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, localeTable } from '../scripts/lib/headless-engine.mjs';

// Draft cards (UI-03): a card reads its level pips and change rows from the offer, and every card a draft can
// show has baked art (ART-09).
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const { ProbedGameEngine, SKILLS, SKILL_IDS, installStrings, tx } = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');
// Offers carry string keys (UI-10); the Korean table resolves them.
installStrings(localeTable('ko'));

const meta = () => ({
  gold: 0,
  xp: 0,
  level: 1,
  passivePoints: 0,
  progress: { chapter: 1, stage: 1 },
  upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 },
  passives: { rareLuck: 0, bossHunter: 0, coinMagnet: 0 },
});
const options = { healthBars: 'elite', volume: 0, effects: 0.9, damageNumbers: true, screenShake: false, reducedFlash: false, paceMode: 'standard' };

function withEngine(body) {
  const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), meta(), options, { onSnapshot() {}, onDraft() {}, onRoundClear() {}, onGameOver() {} });
  try {
    engine.startRun(1, 1, 4242);
    body(engine);
  } finally {
    engine.dispose();
  }
}

test('UI-03: a skill card carries the level before the pick', () => {
  withEngine((engine) => {
    engine.probe.setSkills({ railSpear: { level: 3 } });
    const levelUp = engine.probe.previewOffer('railSpear', 'skill');
    assert.equal(levelUp.level, 3);
    assert.equal(tx(levelUp.levelLine), 'Lv.3 → 4');
    const fresh = engine.probe.previewOffer('chainSpark', 'skill');
    assert.equal(fresh.level, 0);
    assert.equal(tx(fresh.levelLine), '신규 · Lv.1');
    engine.probe.setSkills({ railSpear: { level: 5 } });
    assert.equal(engine.probe.previewOffer('railSpear', 'awakening').level, 5);
  });
});

test('UI-03: every card a draft can show has a baked tile, and skills have one or two tag chips', () => {
  // The arsenal's weapons (SYS-15) wear their look's tile through their own generated sheet.
  const css = ['uiArt', 'arsenalArt'].map((sheet) => readFileSync(new URL(`../src/ui/art/${sheet}.generated.css`, import.meta.url), 'utf8')).join('\n');
  const tiles = new Set([...css.matchAll(/\.artTile\[data-art="([\w-]+)"\]/g)].map((match) => match[1]));
  withEngine((engine) => {
    for (const reason of ['level', 'boss']) {
      for (const offer of engine.probe.previewBonusOffers(reason)) {
        assert.ok(tiles.has(`bonus-${offer.bonus}-${offer.rarity}`), `${reason} draft: ${offer.bonus} (${offer.rarity}) has a tile`);
      }
    }
  });
  for (const id of SKILL_IDS) {
    assert.ok(tiles.has(id) && tiles.has(`${id}-awakened`), `${id} has plain and awakened tiles`);
    assert.ok(SKILLS[id].tags.length >= 1 && SKILLS[id].tags.length <= 2, `${id} has one or two tags`);
  }
});
