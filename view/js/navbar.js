/* ============================================
   🔧 NAVBAR + DROPDOWN + SETTINGS (FIXED)
   ============================================ */

/* ---------- เอา element มาก่อน เพื่อเลี่ยงสโคปหลุด ---------- */
const dropdownBtn = document.getElementById("dropdownBtn");
const dropdownMenu = document.getElementById("dropdownMenu");

const navbarSettingsPopup = document.getElementById('settingsPopup');
const navbarCloseSettings = document.getElementById('closeSettings');
const navbarSaveSettings = document.getElementById('saveSettings');
const navbarCancelSettings = document.getElementById('cancelSettings');
const navbarSettingsBtn = document.getElementById('settingsBtn');

const langBtn = document.getElementById('langToggle');

/* ---------- ฟังก์ชันช่วย: จัดตำแหน่ง dropdown ให้ตรงปุ่ม ---------- */
function positionDropdown() {
  if (!dropdownBtn || !dropdownMenu) return;
  const btnRect = dropdownBtn.getBoundingClientRect();
  // วัดความกว้างเมนู (เผื่อ style ยังไม่วัด ให้บังคับแสดงชั่วคราวแล้ววัด)
  dropdownMenu.style.visibility = 'hidden';
  dropdownMenu.style.display = 'block';
  const menuWidth = dropdownMenu.offsetWidth || 220;
  dropdownMenu.style.display = '';
  dropdownMenu.style.visibility = '';

  // วางเป็น fixed ใต้ปุ่ม + ยึดขอบขวาไม่ให้ออกนอกจอ
  const top = Math.round(btnRect.bottom + 8); // ห่างจากปุ่ม 8px
  // เอาให้เมนูอยู่ฝั่งขวาของปุ่ม แต่ไม่ล้นขวาสุดของจอ
  const leftIdeal = Math.round(btnRect.right - menuWidth);
  const left = Math.max(8, Math.min(leftIdeal, window.innerWidth - menuWidth - 8));

  dropdownMenu.style.position = 'fixed';
  dropdownMenu.style.top = `${top}px`;
  dropdownMenu.style.left = `${left}px`;
}

/* ---------- DROPDOWN: เปิด/ปิด + ป้องกันปิดเอง ---------- */
dropdownBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  positionDropdown();
  dropdownMenu?.classList.toggle("show");
});

// ปิดเมื่อคลิกนอกเมนู
window.addEventListener("click", (e) => {
  if (!dropdownMenu) return;
  if (!dropdownMenu.contains(e.target) && !dropdownBtn?.contains(e.target)) {
    dropdownMenu.classList.remove("show");
  }
});

// ปรับตำแหน่งเมื่อรีไซส์/สกอร์ล (ถ้าเมนูเปิดอยู่)
["resize", "scroll"].forEach(evt => {
  window.addEventListener(evt, () => {
    if (dropdownMenu?.classList.contains("show")) positionDropdown();
  }, { passive: true });
});

/* ---------- SETTINGS POPUP ---------- */
navbarSettingsBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  navbarSettingsPopup.style.display = 'flex';
  // ปิด dropdown ถ้าเปิดอยู่
  dropdownMenu?.classList.remove('show');
});

navbarCloseSettings?.addEventListener('click', () => {
  navbarSettingsPopup.style.display = 'none';
});
navbarCancelSettings?.addEventListener('click', () => {
  navbarSettingsPopup.style.display = 'none';
});

navbarSaveSettings?.addEventListener('click', () => {
  const language = document.getElementById('languageSetting')?.value;
  const theme = document.getElementById('themeSetting')?.value;
  const notifications = document.getElementById('notificationsSetting')?.checked;

  localStorage.setItem('appLanguage', language ?? 'th');
  localStorage.setItem('appTheme', theme ?? 'light');
  localStorage.setItem('appNotifications', String(!!notifications));

  // sync กับ darkmode
  if (theme === 'dark') {
    document.body.classList.add('dark');
    localStorage.setItem('theme-mode', 'dark');
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('theme-mode', 'light');
  }

  // กันเคสไม่มี SweetAlert2
  if (typeof window.Swal?.fire === 'function') {
    Swal.fire({ icon: 'success', title: 'Saved', timer: 1200, showConfirmButton: false });
  } else {
    alert('Settings saved successfully!');
  }

  navbarSettingsPopup.style.display = 'none';
});

// ปิด popup เมื่อคลิกนอกกล่อง
navbarSettingsPopup?.addEventListener('click', (e) => {
  if (e.target === navbarSettingsPopup) {
    navbarSettingsPopup.style.display = 'none';
  }
});

/* ---------- LANGUAGE TOGGLE ---------- */
langBtn?.addEventListener('click', () => {
  langBtn.textContent = langBtn.textContent === 'TH' ? 'EN' : 'TH';
});

/* ---------- LOGOUT (กันไม่มี Swal) ---------- */
const logoutEl = document.getElementById('logout');
logoutEl?.addEventListener('click', async (e) => {
  e.preventDefault();

  const confirmWithSwal = typeof window.Swal?.fire === 'function';

  const proceed = confirmWithSwal
    ? (await Swal.fire({
        title: 'คุณแน่ใจหรือไม่?',
        text: 'ต้องการออกจากระบบใช่ไหม',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ใช่',
        cancelButtonText: 'ยกเลิก',
        background: document.body.classList.contains('dark') ? '#1f2937' : '#fff',
        color: document.body.classList.contains('dark') ? '#f9fafb' : '#111827',
      })).isConfirmed
    : window.confirm('ต้องการออกจากระบบใช่ไหม?');

  if (!proceed) return;

  try {
    const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const username = currentUser?.username ?? 'Unknown';

    if (window.electronAPI?.handleLogout) {
      await window.electronAPI.handleLogout({ username });
    }
  } catch (err) {
    console.error('Logout IPC error:', err);
  } finally {
    sessionStorage.clear();
    localStorage.removeItem('userSession');
    localStorage.removeItem('userRole');
    window.electronAPI?.navigate?.('login');
  }
});

/* ---------- LOAD SAVED SETTINGS + USER NAME ---------- */
window.addEventListener('DOMContentLoaded', () => {
  try {
    if (typeof updateUserDisplay === 'function') updateUserDisplay();
  } catch {}

  const savedTheme = localStorage.getItem('appTheme');
  const savedLanguage = localStorage.getItem('appLanguage');
  const savedNotifications = localStorage.getItem('appNotifications');

  if (savedTheme === 'dark') document.body.classList.add('dark');
  if (document.getElementById('themeSetting')) {
    document.getElementById('themeSetting').value = savedTheme ?? 'light';
  }
  if (document.getElementById('languageSetting')) {
    document.getElementById('languageSetting').value = savedLanguage ?? 'th';
  }
  if (document.getElementById('notificationsSetting')) {
    document.getElementById('notificationsSetting').checked = (savedNotifications ?? 'true') === 'true';
  }
});
