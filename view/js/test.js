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
   ▶️ เมื่อกดบันทึก → เพิ่มแถวใหม่ในตาราง
============================================================ */
const addBtn = document.getElementById("addBtn");
const popupAdd = document.getElementById("popupAdd");
const closeAdd = document.getElementById("closeAdd");
const addForm = document.getElementById("addForm");
const tableBody = document.querySelector("#patientTable tbody");

// 🔹 เปิด popup เมื่อกด “เพิ่มข้อมูลผู้ป่วย”
addBtn?.addEventListener("click", () => {
  popupAdd.style.display = "flex";
});

// 🔹 ปิด popup เมื่อกด “ยกเลิก”
closeAdd?.addEventListener("click", () => {
  popupAdd.style.display = "none";
  addForm.reset();
});

// 🔹 เมื่อกด “บันทึก” ในฟอร์ม
addForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("fullname").value;
  const dept = document.getElementById("department").value;
  const sentDate = document.getElementById("sentDate").value;

  // ✅ เพิ่มข้อมูลใหม่ในตาราง
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td>${tableBody.children.length + 1}</td>
    <td>${name}</td>
    <td>${sentDate}</td>
    <td>${dept}</td>
    <td><button class="inspect-btn">Inspect</button></td>
  `;
  tableBody.appendChild(newRow);

  // ✅ ปิด popup และเคลียร์ฟอร์ม
  popupAdd.style.display = "none";
  addForm.reset();
});


/* ============================================================
   4️⃣ SEARCH FUNCTION (ค้นหาผู้ป่วยในตาราง)
   ------------------------------------------------------------
   ▶️ กรองชื่อผู้ป่วยตามข้อความที่พิมพ์ในช่องค้นหา
============================================================ */
const searchInput = document.getElementById("searchInput");
searchInput?.addEventListener("keyup", () => {
  const keyword = searchInput.value.toLowerCase();
  const rows = tableBody.querySelectorAll("tr");

  rows.forEach(row => {
    const name = row.children[1].textContent.toLowerCase();
    row.style.display = name.includes(keyword) ? "" : "none";
  });
});


/* ============================================================
   5️⃣ POPUP: INSPECT DATA (ตรวจสอบข้อมูลผู้ป่วย)
   ------------------------------------------------------------
   ▶️ เมื่อคลิก “Inspect” จะเปิด popup รายละเอียด
============================================================ */
const popupInspect = document.getElementById("popupInspect");
if (popupInspect) {
  const popupInfo = document.getElementById("popup-info");
  const closeInspect = document.getElementById("closeInspect");

  // 🔹 เปิด popup เมื่อกดปุ่ม Inspect
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("inspect-btn")) {
      const name = e.target.closest("tr").children[1].textContent;
      popupInfo.textContent = "คุณกำลังตรวจสอบข้อมูลของ " + name;
      popupInspect.style.display = "flex";
    }
  });

  // 🔹 ปิด popup ตรวจสอบ
  closeInspect.addEventListener("click", () => {
    popupInspect.style.display = "none";
  });
}


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
