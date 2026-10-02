import assert from 'node:assert/strict';
import test from 'node:test';
import { desktopWindow } from './desktopWindow.ts';

test('TEC-09: the window mode bridge is there only in the desktop app', () => {
  assert.equal(desktopWindow({}), null, 'the web build has no bridge');
  assert.equal(desktopWindow({ blacklineDesktop: { fullScreen: () => Promise.resolve(false) } }), null, 'a partial bridge is ignored');
  const bridge = { fullScreen: async () => false, setFullScreen: async () => true, onFullScreen: () => () => {} };
  assert.equal(desktopWindow({ blacklineDesktop: bridge }), bridge);
});
