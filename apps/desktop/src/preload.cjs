const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('agentShieldDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: '1.0.0',
  sendNotification: (title, body) => {
    ipcRenderer.send('desktop-notify', { title, body });
  },
  openExternal: (url) => {
    shell.openExternal(url);
  },
  checkEngineStatus: () => ipcRenderer.invoke('check-engine-status'),
  startEngine: () => ipcRenderer.invoke('start-engine')
});

