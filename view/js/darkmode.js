/* --------------------------------------------
   🌙 Toggle Theme
-------------------------------------------- */
const themeBtn = document.getElementById('themeToggle');
let chartInstances = {};

themeBtn?.addEventListener('click', () => {
  document.body.classList.toggle('dark');

  // อัปเดตสีกราฟเมื่อสลับธีม
  updateChartsForTheme();
});

