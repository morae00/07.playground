// Window mode (TEC-09): the game window opens in the mode it was left in, and the page can switch it through one
// narrow bridge (preload.cjs). The mode is one small file in the app's data folder; a missing or unreadable file
// means a window.
const fs = require('node:fs');
const path = require('node:path');
const { isAllowedAppNavigation } = require('./security.cjs');

const WINDOW_STATE_FILE = 'window-state.json';

/** The saved mode: { fullScreen }. */
function readWindowState(directory, fileSystem = fs) {
  try {
    const value = JSON.parse(fileSystem.readFileSync(path.join(directory, WINDOW_STATE_FILE), 'utf8'));
    return { fullScreen: value?.fullScreen === true };
  } catch {
    return { fullScreen: false };
  }
}

function writeWindowState(directory, state, fileSystem = fs) {
  try {
    fileSystem.mkdirSync(directory, { recursive: true });
    fileSystem.writeFileSync(path.join(directory, WINDOW_STATE_FILE), `${JSON.stringify({ fullScreen: state.fullScreen === true })}\n`);
    return true;
  } catch {
    return false;
  }
}

/** Only the game's own top frame on its entry page may change the window, never a subframe or another page. */
function isGameFrame(event, entry) {
  const frame = event?.senderFrame;
  if (!frame || !event.sender || frame !== event.sender.mainFrame) return false;
  return isAllowedAppNavigation(frame.url, entry);
}

module.exports = { WINDOW_STATE_FILE, isGameFrame, readWindowState, writeWindowState };
