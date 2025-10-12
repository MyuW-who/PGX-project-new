// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  navigate: (page) => ipcRenderer.send('navigate', page),
  checkLogin: (username, password) => ipcRenderer.invoke('check-login', { username, password })
});
