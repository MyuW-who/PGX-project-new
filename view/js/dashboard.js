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


// โหลดครั้งแรก
switchLanguage("th");

