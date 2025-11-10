/* ============================================================
   🧭 NAVIGATION BUTTONS
   ------------------------------------------------------------
   ▶️ Page navigation handlers
============================================================ */

const patient_btn = document.getElementById('patient-btn');
patient_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('patient');
});

const information_btn = document.getElementById('information-btn');
information_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('information');
});

const information_btn1 = document.getElementById('information-btn1');
information_btn1?.addEventListener('click', () => {
  window.electronAPI.navigate('information1');
});

const dashboard_btn = document.getElementById('dashboard-btn');
dashboard_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('dashboard1');
});

const dashboard_btn1 = document.getElementById('dashboard-btn1');
dashboard_btn1?.addEventListener('click', () => {
  window.electronAPI.navigate('dashboard2');
});

const admin_btn = document.getElementById('admin-btn');
admin_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('adminpage');
});

const auditlog_btn = document.getElementById('auditlog-btn');
auditlog_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('auditlog');
});

