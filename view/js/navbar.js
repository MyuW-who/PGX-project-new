/* ============================================
   ⚙️ SETTINGS POPUP (Navbar-safe version)
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
  dropdownMenu?.classList.remove('show');
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

  // 🔄 sync กับ darkmode.js
  if (theme === 'dark') {
    document.body.classList.add('dark');
    localStorage.setItem('theme-mode', 'dark');
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('theme-mode', 'light');
  }

  alert('Settings saved successfully!');
  navbarSettingsPopup.style.display = 'none';
});

// 🔹 ปิด popup เมื่อคลิกนอกกรอบ
navbarSettingsPopup?.addEventListener('click', (e) => {
  if (e.target === navbarSettingsPopup) {
    navbarSettingsPopup.style.display = 'none';
  }
});

// 🔹 โหลดค่าที่เคยบันทึกไว้
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('appTheme');
  const savedLanguage = localStorage.getItem('appLanguage');
  const savedNotifications = localStorage.getItem('appNotifications');

  if (savedTheme && document.getElementById('themeSetting')) {
    document.getElementById('themeSetting').value = savedTheme;
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    }
  }

  if (savedLanguage && document.getElementById('languageSetting')) {
    document.getElementById('languageSetting').value = savedLanguage;
  }

  if (savedNotifications !== null && document.getElementById('notificationsSetting')) {
    document.getElementById('notificationsSetting').checked = savedNotifications === 'true';
  }
});

/* ============================================
   🌐 LANGUAGE TOGGLE
   ============================================ */
const langBtn = document.getElementById('langToggle');
langBtn?.addEventListener('click', () => {
  langBtn.textContent = langBtn.textContent === 'TH' ? 'EN' : 'TH';
});
