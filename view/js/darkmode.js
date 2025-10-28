/* ============================================
   🌙 Persistent Dark Mode (Fixed)
   ============================================ */
const themeBtn = document.getElementById('themeToggle');
const DARK_KEY = 'theme-mode';

// 🟢 โหลดค่าที่เคยตั้งไว้
if (localStorage.getItem(DARK_KEY) === 'dark') {
  document.body.classList.add('dark');
  const icon = themeBtn?.querySelector('i');
  if (icon) icon.classList.replace('fa-moon', 'fa-sun');

  // ถ้ามีฟังก์ชัน updateCharts ให้เรียกทันที
  if (typeof updateChartsForTheme === 'function') updateChartsForTheme();
}

// 🌓 เมื่อผู้ใช้กดปุ่ม
themeBtn?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem(DARK_KEY, isDark ? 'dark' : 'light');

  // เปลี่ยน icon
  const icon = themeBtn?.querySelector('i');
  if (icon) {
    if (isDark) icon.classList.replace('fa-moon', 'fa-sun');
    else icon.classList.replace('fa-sun', 'fa-moon');
  }

  // อัปเดตกราฟ
  if (typeof updateChartsForTheme === 'function') updateChartsForTheme();
});
