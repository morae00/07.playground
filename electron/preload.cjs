// The page's only bridge into the desktop app (TEC-09): reading and switching the window mode. It hands the page
// three functions and no Node access, ipcRenderer, or other channel; the main process checks every call's sender.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('blacklineDesktop', Object.freeze({
  fullScreen: () => ipcRenderer.invoke('window:full-screen'),
  setFullScreen: (on) => ipcRenderer.invoke('window:set-full-screen', on === true),
  onFullScreen: (listener) => {
    const handler = (_event, on) => listener(on === true);
    ipcRenderer.on('window:full-screen-changed', handler);
    return () => ipcRenderer.removeListener('window:full-screen-changed', handler);
  },
}));
