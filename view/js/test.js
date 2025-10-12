/* ==========================
   DASHBOARD FUNCTION SCRIPT
   ========================== */

// ---- เปลี่ยนธีม (Dark / Light) ----
const themeBtn = document.getElementById("themeToggle");
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});


// ---- สลับภาษา (TH / EN) ----
const langBtn = document.getElementById("langToggle");
langBtn.addEventListener("click", () => {
  langBtn.textContent = langBtn.textContent === "TH" ? "EN" : "TH";
});


// ==========================
// ---- Popup: เพิ่มข้อมูลผู้ป่วย ----
// ==========================
const addBtn = document.getElementById("addBtn");
const popupAdd = document.getElementById("popupAdd");
const closeAdd = document.getElementById("closeAdd");
const addForm = document.getElementById("addForm");
const tableBody = document.querySelector("#patientTable tbody");

// เปิด popup เมื่อคลิก “เพิ่มข้อมูลผู้ป่วย”
addBtn.addEventListener("click", () => {
  popupAdd.style.display = "flex";
});

// ปิด popup เมื่อคลิก “ยกเลิก”
closeAdd.addEventListener("click", () => {
  popupAdd.style.display = "none";
  addForm.reset();
});

// บันทึกข้อมูลผู้ป่วยใหม่
addForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("fullname").value;
  const dept = document.getElementById("department").value;
  const sentDate = document.getElementById("sentDate").value;

  // สร้างแถวใหม่ในตาราง
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td>${tableBody.children.length + 1}</td>
    <td>${name}</td>
    <td>${sentDate}</td>
    <td>${dept}</td>
    <td><button class="inspect-btn">Inspect</button></td>
  `;
  tableBody.appendChild(newRow);

  // ปิด popup และล้างฟอร์ม
  popupAdd.style.display = "none";
  addForm.reset();
});


// ==========================
// ---- ค้นหาผู้ป่วยในตาราง ----
// ==========================
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("keyup", () => {
  const keyword = searchInput.value.toLowerCase();
  const rows = tableBody.querySelectorAll("tr");

  rows.forEach(row => {
    const name = row.children[1].textContent.toLowerCase();
    row.style.display = name.includes(keyword) ? "" : "none";
  });
});


// ==========================
// ---- Popup ตรวจสอบข้อมูล ----
// ==========================
// ถ้ามี popupInspect ในหน้าให้เปิดใช้งาน (ป้องกัน error)
const popupInspect = document.getElementById("popupInspect");
if (popupInspect) {
  const popupInfo = document.getElementById("popup-info");
  const closeInspect = document.getElementById("closeInspect");

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("inspect-btn")) {
      const name = e.target.closest("tr").children[1].textContent;
      popupInfo.textContent = "คุณกำลังตรวจสอบข้อมูลของ " + name;
      popupInspect.style.display = "flex";
    }
  });

  closeInspect.addEventListener("click", () => popupInspect.style.display = "none");
}
