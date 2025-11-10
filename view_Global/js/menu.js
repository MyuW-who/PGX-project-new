/* ============================================================
   🧭 NAVIGATION BUTTONS
   ------------------------------------------------------------
   ▶️ Page navigation handlers
============================================================ */

// Medtech navigation
const patient_btn = document.getElementById('patient-btn');
patient_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('patient_medtech');
});

const information_btn = document.getElementById('information-btn');
information_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('information_medtech');
});

const dashboard_btn = document.getElementById('dashboard-btn');
dashboard_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('dashboard_medtech');
});

// Pharmacy navigation
const information_btn1 = document.getElementById('information-btn1');
information_btn1?.addEventListener('click', () => {
  window.electronAPI.navigate('information_pharmacy');
});

const dashboard_btn1 = document.getElementById('dashboard-btn1');
dashboard_btn1?.addEventListener('click', () => {
  window.electronAPI.navigate('dashboard_pharmacy');
});

const verify_btn = document.getElementById('verify-btn');
verify_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('verify_pharmacy');
});

// Admin navigation
const admin_btn = document.getElementById('admin-btn');
admin_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('adminpage');
});

const auditlog_btn = document.getElementById('auditlog-btn');
auditlog_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('auditlog');
});

const admin_settings_btn = document.getElementById('admin-settings-btn');
admin_settings_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('admin-settings');
});
