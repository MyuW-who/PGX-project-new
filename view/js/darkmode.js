/* ============================================
   🌙 Unified Persistent Dark Mode System
   ============================================ */

const themeBtn = document.getElementById('themeToggle');
const DARK_KEY = 'theme-mode';
const icon = themeBtn?.querySelector('i');

// เปลี่ยนไอคอนตามสถานะ
function updateIcon(isDark) {
  if (!icon) return;
  icon.classList.toggle('fa-sun', isDark);
  icon.classList.toggle('fa-moon', !isDark);
}

// โหลดค่าจาก LocalStorage ตอนเริ่มต้น
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem(DARK_KEY);
  const isDark = savedTheme === 'dark';

  if (isDark) document.body.classList.add('dark');
  updateIcon(isDark);

  // 🔽 สั่งอัปเดตกราฟ (ถ้ามี) 🔽
  if (typeof updateChartsForTheme === 'function') {
    updateChartsForTheme();
  }
});

// เมื่อผู้ใช้กดปุ่ม toggle
themeBtn?.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem(DARK_KEY, isDark ? 'dark' : 'light');
  updateIcon(isDark);

  // 🔽 สั่งอัปเดตกราฟ (ถ้ามี) 🔽
  if (typeof updateChartsForTheme === 'function') {
    updateChartsForTheme();
  }
});
