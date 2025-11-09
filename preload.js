// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  checkLogin: (creds) => ipcRenderer.invoke('check-login', creds),
  getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
  logout: () => ipcRenderer.invoke('logout'),
});

contextBridge.exposeInMainWorld('electronAPI', {
  navigate: (page) => ipcRenderer.send('navigate', page),
  checkLogin: (creds) => ipcRenderer.invoke('check-login', creds),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  getPatients: () => ipcRenderer.invoke('get-patients'),
  addPatient: (data) => ipcRenderer.invoke('add-patient', data),
  searchPatient: (id) => ipcRenderer.invoke('search-patient', id),
  getPatientById: (id) => ipcRenderer.invoke('get-patient-by-id', id),
  updatePatient: (patientId, data) => ipcRenderer.invoke('update-patient', { patientId, data }),
  deletePatient: (patientId) => ipcRenderer.invoke('delete-patient', patientId),
  fetchAccountDetails: (userId) => ipcRenderer.invoke('fetch-account-details', userId),
  fetchAllAccounts: () => ipcRenderer.invoke('fetch-all-accounts'),
  createAccount: (userData) => ipcRenderer.invoke('create-account', userData),
  updateAccount: (data) => ipcRenderer.invoke('update-account', data),
  deleteAccount: (userId) => ipcRenderer.invoke('delete-account', userId),
  hashPassword: (password) => ipcRenderer.invoke('hash-password', password),
  getTestRequests: () => ipcRenderer.invoke('get-test-requests'),
  searchTestRequests: (searchTerm) => ipcRenderer.invoke('search-test-requests', searchTerm),
  getTestRequestById: (requestId) => ipcRenderer.invoke('get-test-request-by-id', requestId),
  addTestRequest: (data) => ipcRenderer.invoke('add-test-request', data),
  updateTestRequest: (requestId, data) => ipcRenderer.invoke('update-test-request', { requestId, data }),
  deleteTestRequest: (requestId) => ipcRenderer.invoke('delete-test-request', requestId),
  getTestRequestStats: (timeFilter) => ipcRenderer.invoke('get-test-request-stats',timeFilter),
  getSpecimenSLA: () => ipcRenderer.invoke('get-specimen-sla'),
  predictPhenotype: (dnaType, alleles) => ipcRenderer.invoke('predict-phenotype', dnaType, alleles),
  getAvailableAlleles: (dnaType) => ipcRenderer.invoke('get-available-alleles', dnaType),
  getAllelePossibleValues: (dnaType, alleleName) => ipcRenderer.invoke('get-allele-possible-values', dnaType, alleleName),
  getSupportedDnaTypes: () => ipcRenderer.invoke('get-supported-dna-types'),
  getRulebase: () => ipcRenderer.invoke('get-rulebase'),
  importExcelToSupabase: (excelFileName) => ipcRenderer.invoke('import-excel-to-supabase', excelFileName),
  refreshRulebase: () => ipcRenderer.invoke('refresh-rulebase'),
  // Dashboard Report APIs
  getDashboardSummary: (timeFilter) => ipcRenderer.invoke('get-dashboard-summary', timeFilter),
  getTopDNATypes: (limit, timeFilter) => ipcRenderer.invoke('get-top-dna-types', limit, timeFilter),
  getTopSpecimens: (limit, timeFilter) => ipcRenderer.invoke('get-top-specimens', limit, timeFilter),
  getRejectedSpecimens: (timeFilter) => ipcRenderer.invoke('get-rejected-specimens', timeFilter),
  getErrorRateSeries: (range) => ipcRenderer.invoke('get-error-rate-series', range),
  getUsageTimeSeries: (range, timeFilter) => ipcRenderer.invoke('get-usage-time-series', range, timeFilter),
  getTATStats: (timeFilter) => ipcRenderer.invoke('get-tat-stats', timeFilter),
  closeApp: () => ipcRenderer.send('window-close'),
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