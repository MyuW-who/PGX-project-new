/* ============================================================
   🩺 PATIENT DASHBOARD SCRIPT
   Description:
   - Theme Switcher (Dark / Light)
   - Language Toggle (TH / EN)
   - Add Patient Popup
   - Table Search
   - Inspect Popup
   - User Dropdown Menu
============================================================ */


/* ============================================================
   1️⃣ THEME SWITCHER (โหมดสว่าง / โหมดมืด)
   ------------------------------------------------------------
   ▶️ เปลี่ยนธีมของหน้าเว็บทั้งหมดระหว่าง Light ↔ Dark
============================================================ */
const themeBtn = document.getElementById("themeToggle");
themeBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});


/* ============================================================
   2️⃣ LANGUAGE TOGGLE (สลับภาษา TH / EN)
   ------------------------------------------------------------
   ▶️ ปุ่มเปลี่ยนข้อความใน UI ระหว่างภาษาไทย ↔ อังกฤษ
============================================================ */
const langBtn = document.getElementById("langToggle");
langBtn?.addEventListener("click", () => {
  langBtn.textContent = langBtn.textContent === "TH" ? "EN" : "TH";
});


/* ============================================================
   3️⃣ POPUP: ADD PATIENT (เพิ่มข้อมูลผู้ป่วย)
   ------------------------------------------------------------
   ▶️ เปิดฟอร์มเพิ่มข้อมูลผู้ป่วย
============================================================ */
const addBtn = document.getElementById("addBtn");
const popupAdd = document.getElementById("popupAdd");
const closeAdd = document.getElementById("closeAdd");


// 🔹 เปิด popup เมื่อกด “เพิ่มข้อมูลผู้ป่วย”
addBtn?.addEventListener("click", () => {
  popupAdd.style.display = "flex";
});

// 🔹 ปิด popup เมื่อกด “ยกเลิก”
closeAdd?.addEventListener("click", () => {
  popupAdd.style.display = "none";
  addForm.reset();
});



/* ============================================================
   6️⃣ USER DROPDOWN MENU (เมนูผู้ใช้)
   ------------------------------------------------------------
   ▶️ เปิด/ปิดเมนูผู้ใช้ (Profile / Setting / Logout)
============================================================ */
const dropdownBtn = document.getElementById("dropdownBtn");
const dropdownMenu = document.getElementById("dropdownMenu");

// 🔹 เปิด/ปิด dropdown เมื่อกดปุ่ม
dropdownBtn?.addEventListener("click", (e) => {
  e.stopPropagation(); // ป้องกัน event ปิด dropdown ซ้อนกัน
  dropdownMenu.classList.toggle("show");
});

// 🔹 ปิด dropdown เมื่อคลิกนอกพื้นที่
window.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown")) {
    dropdownMenu?.classList.remove("show");
  }
});



// -------- Logout ------------
document.getElementById('logout').addEventListener('click', (e) => {
  e.preventDefault();
  window.electronAPI.navigate('login');
});





const dashboard_btn = document.getElementById('dashboard-btn');

dashboard_btn.addEventListener('click', () => {
  window.electronAPI.navigate('dashboard1');
});