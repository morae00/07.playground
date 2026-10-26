import assert from 'node:assert/strict';
import test from 'node:test';
import { bossRageLine } from './bossBar.ts';

const boss = { runMode: 'campaign', stageKind: 'midBoss', bossEnrage: 0, bossEnrageSteps: 4, bossOvertime: 0 } as const;

test('UI-16: a boss stage counts down to its enrage, then names the step or the overtime', () => {
  assert.deepEqual(bossRageLine(boss, '01:20'), { key: 'hud.enrageIn', params: { time: '01:20' } });
  assert.deepEqual(bossRageLine({ ...boss, stageKind: 'finalBoss', bossEnrage: 2 }, '00:00'), { key: 'hud.enrage.step', params: { step: 2, steps: 4 } });
  assert.deepEqual(bossRageLine({ ...boss, bossEnrage: 4, bossOvertime: 3 }, '00:00'), { key: 'hud.enrage.overtime', params: { n: 3 } });
  assert.deepEqual(bossRageLine({ ...boss, bossEnrage: 1, bossEnrageSteps: 1 }, '00:00'), { key: 'hud.enrage' }, 'classic rules enrage in one step');
});

test('UI-16: a field boss on a normal stage never enrages, so its bar names no enrage; nor does an endless boss', () => {
  assert.equal(bossRageLine({ ...boss, stageKind: 'normal' }, '02:41'), null);
  assert.equal(bossRageLine({ ...boss, runMode: 'infinite', stageKind: 'normal' }, '02:41'), null);
});
