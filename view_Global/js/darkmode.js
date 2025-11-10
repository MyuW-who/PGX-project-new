/* ============================================
   🌙 Unified Persistent Dark Mode System
   ============================================ */

const themeBtn = document.getElementById('themeToggle');
const DARK_KEY = 'theme-mode';

// โหลดค่าจาก LocalStorage ตอนเริ่มต้น
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem(DARK_KEY);
  const isDark = savedTheme === 'dark';

  if (isDark) document.body.classList.add('dark');

  if (typeof updateChartsForTheme === 'function') {
    updateChartsForTheme();
  }
});

// เมื่อผู้ใช้กดปุ่ม toggle
themeBtn?.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem(DARK_KEY, isDark ? 'dark' : 'light');

  if (typeof updateChartsForTheme === 'function') {
    updateChartsForTheme();
  }
});

