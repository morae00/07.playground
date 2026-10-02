const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { WINDOW_STATE_FILE, isGameFrame, readWindowState, writeWindowState } = require('./windowState.cjs');

const ENTRY = 'app://game/index.html';

test('TEC-09: the window mode is kept in the data folder, and anything unreadable means a window', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'blackline-window-state-'));
  try {
    assert.deepEqual(readWindowState(directory), { fullScreen: false }, 'no file yet');
    assert.equal(writeWindowState(directory, { fullScreen: true }), true);
    assert.deepEqual(readWindowState(directory), { fullScreen: true });
    fs.writeFileSync(path.join(directory, WINDOW_STATE_FILE), '{not json');
    assert.deepEqual(readWindowState(directory), { fullScreen: false });
    fs.writeFileSync(path.join(directory, WINDOW_STATE_FILE), '{"fullScreen":"yes"}');
    assert.deepEqual(readWindowState(directory), { fullScreen: false }, 'only true means full screen');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('TEC-09: only the game page in its own top frame may switch the window', () => {
  const sender = { mainFrame: { url: ENTRY } };
  assert.equal(isGameFrame({ sender, senderFrame: sender.mainFrame }, ENTRY), true);
  assert.equal(isGameFrame({ sender, senderFrame: { url: ENTRY } }, ENTRY), false, 'a subframe, even on the entry URL');
  const other = { mainFrame: { url: 'app://game/storage-bridge.html' } };
  assert.equal(isGameFrame({ sender: other, senderFrame: other.mainFrame }, ENTRY), false, 'another app page');
  const web = { mainFrame: { url: 'https://example.com/' } };
  assert.equal(isGameFrame({ sender: web, senderFrame: web.mainFrame }, ENTRY), false);
  assert.equal(isGameFrame({}, ENTRY), false);
});

test('TEC-09: the preload hands the page three window-mode functions and nothing else', async () => {
  const exposed = {};
  const calls = [];
  const listeners = new Map();
  const fakeElectron = {
    contextBridge: { exposeInMainWorld: (name, api) => { exposed[name] = api; } },
    ipcRenderer: {
      invoke: async (channel, ...args) => { calls.push([channel, ...args]); return true; },
      on: (channel, handler) => listeners.set(channel, handler),
      removeListener: (channel) => listeners.delete(channel),
    },
  };
  const load = Module._load;
  Module._load = function patched(request, ...rest) {
    return request === 'electron' ? fakeElectron : load.call(this, request, ...rest);
  };
  try {
    delete require.cache[require.resolve('./preload.cjs')];
    require('./preload.cjs');
  } finally {
    Module._load = load;
  }
  assert.deepEqual(Object.keys(exposed), ['blacklineDesktop']);
  const bridge = exposed.blacklineDesktop;
  assert.deepEqual(Object.keys(bridge).sort(), ['fullScreen', 'onFullScreen', 'setFullScreen']);
  assert.ok(Object.isFrozen(bridge));
  await bridge.setFullScreen('yes');
  await bridge.fullScreen();
  assert.deepEqual(calls, [['window:set-full-screen', false], ['window:full-screen']], 'anything but true asks for a window');
  const seen = [];
  const stop = bridge.onFullScreen((on) => seen.push(on));
  listeners.get('window:full-screen-changed')({}, true);
  stop();
  assert.deepEqual(seen, [true]);
  assert.equal(listeners.size, 0, 'unsubscribing removes the listener');
});
