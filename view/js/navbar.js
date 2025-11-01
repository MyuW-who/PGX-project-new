/* ============================================================
   
   🧭 NAVBAR.JS (GLOBAL SCRIPT)
   ------------------------------------------------------------
   สคริปต์กลางสำหรับจัดการ Navbar และ Logout
   
============================================================ */

/* ============================================
   🔐 USER SESSION MANAGEMENT
   (ย้ายมาจาก patient.js)
============================================ */

// Get current user session
function getCurrentUser() {
  try {
    const sessionData = sessionStorage.getItem('currentUser');
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('❌ Error reading current user:', error);
    return null;
  }
}

// Update user display in header
function updateUserDisplay() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    // Update dropdown button with user info
    const dropdownBtn = document.getElementById('dropdownBtn');
    if (dropdownBtn) {
      dropdownBtn.innerHTML = `
        <i class="fa fa-user-circle"></i> ${currentUser.username} (${currentUser.role}) <i class="fa fa-caret-down"></i>
      `;
    }
  }
}

/* ============================================
   👤 USER DROPDOWN & LOGOUT
   (ส่วน Logout ย้ายมาจาก patient.js)
   (ส่วน Dropdown click สร้างขึ้นใหม่แทน menu.js)
============================================ */

const dropdownBtn = document.getElementById('dropdownBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const logoutBtn = document.getElementById('logout');

// 🔹 จัดการการคลิกเพื่อเปิด/ปิด Dropdown
dropdownBtn?.addEventListener('click', (e) => {
  e.stopPropagation(); // ป้องกันไม่ให้ window click ทำงานทันที
  dropdownMenu?.classList.toggle('show');
});

// 🔹 ปิด Dropdown เมื่อคลิกที่อื่น
window.addEventListener('click', (e) => {
  if (dropdownMenu?.classList.contains('show') && !dropdownBtn.contains(e.target)) {
    dropdownMenu.classList.remove('show');
  }
});

// 🔹 จัดการการ Logout
logoutBtn?.addEventListener('click', async (e) => {
  e.preventDefault();
  
  const currentUser = getCurrentUser();
  const username = currentUser ? currentUser.username : 'Unknown';
  
  if (confirm(`คุณต้องการออกจากระบบหรือไม่?\n(${username})`)) {
    try {
      if (window.electronAPI && window.electronAPI.handleLogout) {
        await window.electronAPI.handleLogout({ username });
      }
      
      localStorage.removeItem('userSession');
      localStorage.removeItem('userRole');
      sessionStorage.clear();
      
      console.log('👋 User logged out:', username);
      window.electronAPI.navigate('login');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      sessionStorage.clear();
      localStorage.removeItem('userSession');
      window.electronAPI.navigate('login');
    }
  }
});





/* ============================================
   🌐 LANGUAGE TOGGLE
   (มาจาก navbar.js เดิม)
============================================ */
const langBtn = document.getElementById('langToggle');
langBtn?.addEventListener('click', () => {
  langBtn.textContent = langBtn.textContent === 'TH' ? 'EN' : 'TH';
});


/* ============================================
   ⚙️ SETTINGS POPUP
   (มาจาก navbar.js เดิม)
============================================ */
const navbarSettingsPopup = document.getElementById('settingsPopup');
const navbarCloseSettings = document.getElementById('closeSettings');
const navbarSaveSettings = document.getElementById('saveSettings');
const navbarCancelSettings = document.getElementById('cancelSettings');
const navbarSettingsBtn = document.getElementById('settingsBtn');

// 🔹 เปิด Settings Popup
navbarSettingsBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  navbarSettingsPopup.style.display = 'flex';
  dropdownMenu?.classList.remove('show'); // ซ่อน dropdown
});

// 🔹 ปิด Settings Popup
navbarCloseSettings?.addEventListener('click', () => {
  navbarSettingsPopup.style.display = 'none';
});
navbarCancelSettings?.addEventListener('click', () => {
  navbarSettingsPopup.style.display = 'none';
});

// 🔹 บันทึก Settings
navbarSaveSettings?.addEventListener('click', () => {
  const language = document.getElementById('languageSetting')?.value;
  const theme = document.getElementById('themeSetting')?.value;
  const notifications = document.getElementById('notificationsSetting')?.checked;

  localStorage.setItem('appLanguage', language);
  localStorage.setItem('appTheme', theme);
  localStorage.setItem('appNotifications', notifications);

  

  alert('Settings saved successfully!');
  navbarSettingsPopup.style.display = 'none';
});

// 🔹 ปิด popup เมื่อคลิกนอกกรอบ
navbarSettingsPopup?.addEventListener('click', (e) => {
  if (e.target === navbarSettingsPopup) {
    navbarSettingsPopup.style.display = 'none';
  }
});


/* ============================================
   🚀 INITIALIZATION ON PAGE LOAD
   (รวม DOMContentLoaded ทั้งหมดไว้ที่เดียว)
============================================ */

window.addEventListener('DOMContentLoaded', () => {
  
  // --- 1. โหลด User Display ---
  updateUserDisplay();

  // --- 2. โหลด Theme ที่บันทึกไว้ ---
 

  // --- 3. โหลดค่า Settings ที่บันทึกไว้ (สำหรับ Popup) ---
  const savedLanguage = localStorage.getItem('appLanguage');
  const savedNotifications = localStorage.getItem('appNotifications');

  // ตั้งค่าใน <select> ของ Popup
  if (document.getElementById('themeSetting')) {
    document.getElementById('themeSetting').value = savedTheme;
  }
  if (savedLanguage && document.getElementById('languageSetting')) {
    document.getElementById('languageSetting').value = savedLanguage;
  }
  if (savedNotifications !== null && document.getElementById('notificationsSetting')) {
    document.getElementById('notificationsSetting').checked = savedNotifications === 'true';
  }
});