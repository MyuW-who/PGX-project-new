/* --------------------------------------------
   ⚙️ Settings Popup Handler
-------------------------------------------- */
const settingsPopup = document.getElementById('settingsPopup');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const cancelSettings = document.getElementById('cancelSettings');
const settingsBtn = document.getElementById('settingsBtn');

// Open settings popup
settingsBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  settingsPopup.style.display = 'flex';
  dropdownMenu?.classList.remove('show');
});

// Close settings popup
closeSettings?.addEventListener('click', () => {
  settingsPopup.style.display = 'none';
});

cancelSettings?.addEventListener('click', () => {
  settingsPopup.style.display = 'none';
});

// Save settings
saveSettings?.addEventListener('click', () => {
  const language = document.getElementById('languageSetting').value;
  const theme = document.getElementById('themeSetting').value;
  const notifications = document.getElementById('notificationsSetting').checked;
  
  localStorage.setItem('appLanguage', language);
  localStorage.setItem('appTheme', theme);
  localStorage.setItem('appNotifications', notifications);
  
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  
  alert('Settings saved successfully!');
  settingsPopup.style.display = 'none';
});

// Close popup when clicking outside
settingsPopup?.addEventListener('click', (e) => {
  if (e.target === settingsPopup) {
    settingsPopup.style.display = 'none';
  }
});

// Load saved settings on page load
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

/* --------------------------------------------
   🌐 Toggle Language
-------------------------------------------- */
const langBtn = document.getElementById('langToggle');
langBtn?.addEventListener('click', () => {
  langBtn.textContent = langBtn.textContent === 'TH' ? 'EN' : 'TH';
});