import assert from 'node:assert/strict';
import test from 'node:test';
import { effectAnnouncement } from './effectAnnouncement.ts';

test('UI-08: the spoken effect line names the effects and says when the last one ends', () => {
  assert.equal(effectAnnouncement([], false), null, 'nothing to say before any effect');
  assert.deepEqual(effectAnnouncement(['보호막', '둔화'], true), { key: 'hud.effects.list', params: { list: '보호막, 둔화' } });
  assert.deepEqual(effectAnnouncement([], true), { key: 'hud.effects.none' });
});

test('UI-08: the line carries no timer, so ticking timers leave it unchanged', () => {
  const first = effectAnnouncement(['보호막'], true);
  const later = effectAnnouncement(['보호막'], true);
  assert.deepEqual(first, later);
});
