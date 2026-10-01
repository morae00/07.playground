import assert from 'node:assert/strict';
import test from 'node:test';
import { createHeadlessCanvas, installHeadlessPlatform, maxMeta, standardOptions } from '../scripts/lib/headless-engine.mjs';

// Menu, concept C (UI-06): what the campaign view shows about a stage without starting it.
installHeadlessPlatform();
Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
const {
  ProbedGameEngine, STAGE_PATH, chapterCleared, passiveEffect, smoothPath, stageBoss, stageRewardFloor, stageStatus, upgradeEffect,
} = await import(process.env.BLACKLINE_TEST_BUNDLE ?? '/tmp/blackline-survivor-p0/testing.mjs');

const meta = (progress, extra = {}) => ({ ...maxMeta(), progress, ...extra });

test('UI-06: the clear reward floor is what a clear with no kills and no coins pays', () => {
  for (const [chapter, stage] of [[1, 1], [2, 5], [3, 7], [5, 10]]) {
    let settlement = null;
    const engine = new ProbedGameEngine(createHeadlessCanvas(1440, 900), maxMeta(), standardOptions(), {
      onSnapshot() {}, onDraft() {}, onRoundClear(result) { settlement = result; }, onGameOver() {},
    });
    try {
      engine.startRun(chapter, stage, 4242);
      engine.probe.requestRoundClear();
      assert.ok(settlement, `${chapter}-${stage} settled`);
      assert.equal(settlement.kills, 0);
      assert.deepEqual(stageRewardFloor(chapter, stage, false), { gold: settlement.gold, xp: settlement.xp }, `${chapter}-${stage}`);
    } finally {
      engine.dispose();
    }
  }
  const full = stageRewardFloor(2, 5, false);
  const practice = stageRewardFloor(2, 5, true);
  assert.ok(practice.gold < full.gold && practice.xp < full.xp, 'practice pays less');
});

test('UI-06: boss stops, stage status and chapter progress follow the unlocked frontier', () => {
  assert.equal(stageBoss(1, 5).id, 's1-mid-dash');
  assert.equal(stageBoss(1, 10).id, 's1-final-rings');
  assert.equal(stageBoss(3, 4), undefined);
  const save = meta({ chapter: 2, stage: 4 });
  assert.equal(stageStatus(save, 1, 10, false), 'cleared');
  assert.equal(stageStatus(save, 2, 3, false), 'cleared');
  assert.equal(stageStatus(save, 2, 4, false), 'current');
  assert.equal(stageStatus(save, 2, 5, false), 'locked');
  assert.equal(stageStatus(save, 2, 5, true), 'open', 'developer access opens every stage');
  assert.equal(chapterCleared(save, 1), 10);
  assert.equal(chapterCleared(save, 2), 3);
  assert.equal(chapterCleared(save, 3), 0);
});

test('UI-06: an upgrade shows its stat now and after the next level', () => {
  const save = meta({ chapter: 1, stage: 1 }, { upgrades: { attack: 0, defense: 0, maxHp: 2, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 }, passives: { rareLuck: 0, bossHunter: 1, coinMagnet: 0 } });
  assert.deepEqual(upgradeEffect(save, 'attack'), { stat: 'stats.attack', from: '12.0', to: '13.0' });
  assert.deepEqual(upgradeEffect(save, 'maxHp'), { stat: 'stats.maxHp', from: '140', to: '150' });
  assert.deepEqual(passiveEffect(save, 'bossHunter'), { stat: 'stats.bossDamage', from: '104.5%', to: '109%' });
  assert.equal(passiveEffect(save, 'rareLuck'), null, 'luck has no stat, so the menu shows its level');
});

test('CON-07: past its first five points a passive grows its branch\'s second node', () => {
  const at = (passives) => meta({ chapter: 1, stage: 1 }, { upgrades: { attack: 0, defense: 0, maxHp: 0, moveSpeed: 0, crit: 0, regen: 0, magnet: 0 }, passives });
  assert.deepEqual(passiveEffect(at({ rareLuck: 5, bossHunter: 4, coinMagnet: 5 }), 'rareLuck'), { stat: 'stats.critDamage', from: '×1.65', to: '×1.67' });
  assert.deepEqual(passiveEffect(at({ rareLuck: 0, bossHunter: 5, coinMagnet: 0 }), 'bossHunter'), { stat: 'stats.crit', from: '8%', to: '8.4%' });
  assert.deepEqual(passiveEffect(at({ rareLuck: 0, bossHunter: 9, coinMagnet: 0 }), 'bossHunter'), { stat: 'stats.crit', from: '9.6%', to: '10%' });
  assert.deepEqual(passiveEffect(at({ rareLuck: 0, bossHunter: 0, coinMagnet: 6 }), 'coinMagnet'), { stat: 'stats.coinGain', from: '143%', to: '146%' });
  // The first nodes stop at five points: boss damage and coins stay where five points put them.
  const ten = at({ rareLuck: 10, bossHunter: 10, coinMagnet: 10 });
  assert.deepEqual(passiveEffect({ ...ten, passives: { ...ten.passives, bossHunter: 4 } }, 'bossHunter'), { stat: 'stats.bossDamage', from: '118%', to: '122.5%' });
});

test('UI-06: the path map runs through all ten stops', () => {
  assert.equal(STAGE_PATH.length, 10);
  const path = smoothPath(STAGE_PATH);
  assert.match(path, /^M5 64 C/);
  assert.equal((path.match(/C/g) ?? []).length, 9);
  assert.ok(path.endsWith(' 93 38'));
});
