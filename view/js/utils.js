/* ============================================
   🛠️ UTILS.JS - Shared Helper Functions
   ============================================ */

/**
 * Stores patientId in session and navigates to a new page.
 * @param {string} pageName - The name of the HTML page to navigate to.
 * @param {string | number} patientId - The patient ID to store in session.
 */
window.showPage = function(pageName, patientId) {
  if (patientId) {
    sessionStorage.setItem('selectedPatientId', patientId);
  }
  if (window.electronAPI && typeof window.electronAPI.navigate === 'function') {
    window.electronAPI.navigate(pageName);
  } else {
    console.error('electronAPI.navigate is not available.');
  }
}