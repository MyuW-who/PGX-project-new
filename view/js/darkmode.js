/* ============================================
   🌙 Persistent Dark Mode (Fixed)
   ============================================ */
const themeBtn = document.getElementById('themeToggle');
const DARK_KEY = 'theme-mode';
const icon = themeBtn?.querySelector('i'); // ย้ายมาประกาศตรงนี้เพื่อใช้ซ้ำ

// ฟังก์ชันสำหรับอัปเดตไอคอน
function updateIcon(isDark) {
  if (icon) {
    if (isDark) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  }
}

// 🟢 โหลดค่าที่เคยตั้งไว้เมื่อเปิดหน้า
// ใช้ document.addEventListener เพื่อให้แน่ใจว่า DOM พร้อมใช้งาน
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem(DARK_KEY);
  const isDark = savedTheme === 'dark';

  if (isDark) {
    document.body.classList.add('dark');
  }
  updateIcon(isDark); // อัปเดตไอคอนตามธีมที่โหลด

  // ถ้ามีฟังก์ชัน updateCharts ให้เรียกทันที
  if (typeof updateChartsForTheme === 'function') {
    updateChartsForTheme();
  }
});


// 🌓 เมื่อผู้ใช้กดปุ่ม
themeBtn?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  
  // บันทึกค่าลง Local Storage
  localStorage.setItem(DARK_KEY, isDark ? 'dark' : 'light');

  // เปลี่ยน icon
  updateIcon(isDark);

  // อัปเดตกราฟ (ถ้ามี)
  if (typeof updateChartsForTheme === 'function') {
    updateChartsForTheme();
  }
});