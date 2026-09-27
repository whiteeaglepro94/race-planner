const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openIracingLogin: () => ipcRenderer.invoke('iracing-login'),
  iracingFetch: (endpoint) => ipcRenderer.invoke('iracing-fetch', endpoint),
  iracingLogout: () => ipcRenderer.invoke('iracing-logout'),
});
