/* ============================================
   🌙 Unified Persistent Dark Mode System
   ============================================ */

const themeBtn = document.getElementById('themeToggle');
const DARK_KEY = 'theme-mode'; // ใช้ Key นี้เป็นหลักในการเก็บธีม
const icon = themeBtn?.querySelector('i');

// เปลี่ยนไอคอน
function updateIcon(isDark) {
  if (!icon) return;
  icon.classList.toggle('fa-sun', isDark);
  icon.classList.toggle('fa-moon', !isDark);
}

/**
 * @param {boolean} isDark
 */
function applyTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  updateIcon(isDark);
  
  // 🗃️ บันทึกธีมหลัก
  localStorage.setItem(DARK_KEY, isDark ? 'dark' : 'light');
  // 🗃️ บันทึกธีมสำหรับ popup (เพื่อให้ตรงกัน)
  localStorage.setItem('appTheme', isDark ? 'dark' : 'light');

  // 📡 ส่ง Event บอกสคริปต์อื่น (เช่น กราฟใน Dashboard)
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark } }));
}

// โหลดค่าจาก LocalStorage ตอนเริ่มต้น
document.addEventListener('DOMContentLoaded', () => {
  // ใช้ 'appTheme' ถ้ามี (จาก settings) หรือ 'theme-mode' เป็น fallback
  const savedTheme = localStorage.getItem('appTheme') || localStorage.getItem(DARK_KEY);
  const isDark = savedTheme === 'dark';
  applyTheme(isDark);
});

// เมื่อผู้ใช้กดปุ่ม toggle
themeBtn?.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark');
  applyTheme(isDark);
});

// ทำให้ฟังก์ชันนี้เป็น Global เพื่อให้ userProfile.js เรียกใช้ได้
window.applyTheme = applyTheme;