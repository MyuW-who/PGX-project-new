/* ============================================
   👤 USER PROFILE & SESSION MANAGEMENT (MASTER SCRIPT)
   ============================================
   สคริปต์หลักสำหรับจัดการ Session, Auth, Profile Display,
   Dropdown, Settings, Logout, และ Lang Toggle
   ============================================ */

/* --------------------------------------------
   🔐 SESSION MANAGEMENT
-------------------------------------------- */

// Get current user session (ตรวจสอบ sessionStorage ก่อน, แล้วไป localStorage)
function getCurrentUser() {
  try {
    let sessionData = sessionStorage.getItem('currentUser');
    if (sessionData) return JSON.parse(sessionData);
    
    sessionData = localStorage.getItem('userSession');
    if (sessionData) {
      const userData = JSON.parse(sessionData);
      sessionStorage.setItem('currentUser', sessionData); // เก็บใน session เพื่อความเร็ว
      return userData;
    }
    return null;
  } catch (error) {
    console.error('❌ Error reading current user:', error);
    return null;
  }
}

// Check if user is authenticated
function checkAuthentication() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.warn('⚠️ No user session found, redirecting to login');
    try {
      window.electronAPI.navigate('login');
    } catch (e) {
      console.error('electronAPI not available for redirect');
    }
    return false;
  }
  console.log('✅ User authenticated:', currentUser.username, currentUser.role);
  return true;
}

// Update user display in header
function updateUserDisplay() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    const dropdownBtn = document.getElementById('dropdownBtn');
    if (dropdownBtn) {
      dropdownBtn.innerHTML = `
        <i class="fa fa-user-circle"></i> ${currentUser.username} (${currentUser.role}) <i class="fa fa-caret-down"></i>
      `;
    }
  }
}

// Clear user session
function clearUserSession() {
  localStorage.removeItem('userSession');
  localStorage.removeItem('userRole');
  sessionStorage.clear();
  console.log('🗑️ User session cleared');
}

/* --------------------------------------------
   🚪 LOGOUT HANDLER (ใช้เวอร์ชันที่ดีที่สุดจาก patient.js)
-------------------------------------------- */

async function handleLogout(e) {
  if (e) e.preventDefault();
  const currentUser = getCurrentUser();
  const username = currentUser ? currentUser.username : 'Unknown';
  
  if (confirm(`คุณต้องการออกจากระบบหรือไม่?\n(${username})`)) {
    try {
      if (window.electronAPI && window.electronAPI.handleLogout) {
        await window.electronAPI.handleLogout({ username });
      }
      clearUserSession();
      console.log('👋 User logged out:', username);
      window.electronAPI.navigate('login');
    } catch (error) {
      console.error('❌ Logout error:', error);
      clearUserSession();
      window.electronAPI.navigate('login');
    }
  }
}

/* --------------------------------------------
   📱 DROPDOWN MENU HANDLER
-------------------------------------------- */

function initializeDropdown() {
  const dropdownBtn = document.getElementById("dropdownBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");

  dropdownBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu?.classList.toggle("show");
  });

  // ปิด dropdown เมื่อคลิกนอกพื้นที่
  window.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      dropdownMenu?.classList.remove("show");
    }
  });
}

/* --------------------------------------------
   ⚙️ SETTINGS POPUP HANDLER
-------------------------------------------- */

function initializeSettingsPopup() {
  const settingsPopup = document.getElementById('settingsPopup');
  const closeSettings = document.getElementById('closeSettings');
  const saveSettings = document.getElementById('saveSettings');
  const cancelSettings = document.getElementById('cancelSettings');
  const settingsBtn = document.getElementById('settingsBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');

  settingsBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    settingsPopup.style.display = 'flex';
    dropdownMenu?.classList.remove('show');
  });

  closeSettings?.addEventListener('click', () => { settingsPopup.style.display = 'none'; });
  cancelSettings?.addEventListener('click', () => { settingsPopup.style.display = 'none'; });

  saveSettings?.addEventListener('click', () => {
    const language = document.getElementById('languageSetting')?.value;
    const theme = document.getElementById('themeSetting')?.value;
    const notifications = document.getElementById('notificationsSetting')?.checked;
    
    if (language) localStorage.setItem('appLanguage', language);
    if (theme) localStorage.setItem('appTheme', theme);
    if (notifications !== undefined) localStorage.setItem('appNotifications', notifications);
    
    // ❗ สั่งให้ darkmode.js ทำงานทันที
    if (theme && window.applyTheme) {
      window.applyTheme(theme === 'dark');
    }
    
    alert('Settings saved successfully!');
    settingsPopup.style.display = 'none';
  });

  settingsPopup?.addEventListener('click', (e) => {
    if (e.target === settingsPopup) settingsPopup.style.display = 'none';
  });
}

// โหลดค่าที่บันทึกไว้ (สำหรับ Popup)
function loadSavedSettings() {
  // darkmode.js จะจัดการโหลดธีมหลักเอง
  // ส่วนนี้แค่ตั้งค่า <select> ใน popup ให้ตรงกัน
  const savedTheme = localStorage.getItem('appTheme') || localStorage.getItem('theme-mode');
  const savedLanguage = localStorage.getItem('appLanguage');
  const savedNotifications = localStorage.getItem('appNotifications');
  
  if (savedTheme && document.getElementById('themeSetting')) {
    document.getElementById('themeSetting').value = savedTheme;
  }
  if (savedLanguage && document.getElementById('languageSetting')) {
    document.getElementById('languageSetting').value = savedLanguage;
  }
  if (savedNotifications !== null && document.getElementById('notificationsSetting')) {
    document.getElementById('notificationsSetting').checked = savedNotifications === 'true';
  }
}

/* --------------------------------------------
   🌐 LANGUAGE TOGGLE
-------------------------------------------- */

function initializeLangToggle() {
  const langBtn = document.getElementById('langToggle');
  langBtn?.addEventListener('click', (e) => {
    const current = e.target.textContent.trim();
    e.target.textContent = current === 'TH' ? 'EN' : 'TH';
  });
}

/* --------------------------------------------
   🚀 INITIALIZATION (ฟังก์ชันหลักที่ทุกหน้าจะเรียกใช้)
-------------------------------------------- */

window.initializeUserProfile = function() {
  // 1. ตรวจสอบสิทธิ์ก่อน
  if (!checkAuthentication()) {
    return false; // หยุดทำงานถ้าไม่ผ่าน
  }
  
  // 2. แสดงข้อมูลผู้ใช้
  updateUserDisplay();
  
  // 3. เริ่มการทำงานของ Dropdown
  initializeDropdown();
  
  // 4. เริ่มการทำงานของ Settings Popup
  initializeSettingsPopup();
  loadSavedSettings();
  
  // 5. เริ่มการทำงานของปุ่ม Logout
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // 6. เริ่มการทำงานของ Lang Toggle
  initializeLangToggle();
  
  return true;
}