// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  navigate: (page) => ipcRenderer.send('navigate', page),
  checkLogin: (username, password) => ipcRenderer.invoke('check-login', { username, password }),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  getPatients: () => ipcRenderer.invoke('get-patients'),
  addPatient: (data) => ipcRenderer.invoke('add-patient', data),
  searchPatient: (id) => ipcRenderer.invoke('search-patient', id),
  getAccountDetails: (userId) => ipcRenderer.invoke('get-account-details', userId),
});


try {
  // ถ้า window.electron ไม่มีอยู่ก่อน ให้สร้างใหม่
  if (!window.electron) {
    contextBridge.exposeInMainWorld('electron', {
      invoke: (channel, data) => ipcRenderer.invoke(channel, data),
      generatePDF: async (reportData) => await ipcRenderer.invoke('generate-pdf', reportData),
    });
  } else {
    // ถ้ามี window.electron อยู่แล้ว เช่นใช้กับระบบอื่น → เพิ่มเฉพาะฟังก์ชัน generatePDF
    window.electron.generatePDF = async (reportData) => await ipcRenderer.invoke('generate-pdf', reportData);
  }

  console.log("✅ preload.js: PDF bridge loaded successfully!");
} catch (err) {
  console.error("⚠️ preload PDF bridge error:", err);
}