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


/* --------------------------------------------
   ✅ ดึงข้อมูลทั้งหมดเมื่อหน้าโหลด
-------------------------------------------- */
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const patients = await window.electronAPI.getPatients();
    console.log("📦 Renderer got patients:", patients);
    renderPatients(patients);
  } catch (err) {
    console.error("❌ Error fetching patients:", err);
  }
});

/* --------------------------------------------
   ➕ เมื่อกดปุ่ม "บันทึก" ใน popup form
-------------------------------------------- */
document.getElementById('addForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  

  const patientData = {
    patient_id: parseInt(document.getElementById('patient_id').value),
    hospital_id: document.getElementById('hospital').value.trim(),
    first_name: document.getElementById('first_name').value.trim(),
    last_name: document.getElementById('last_name').value.trim(),
    age: parseInt(document.getElementById('age').value),
    gender: document.getElementById('gender').value,
    ethnicity: document.getElementById('ethnicity').value.trim(),
    blood_type: document.getElementById('blood_type').value,
    phone: document.getElementById('phone').value.trim(),
    created_at: new Date().toISOString()
  };

  try {
    const result = await window.electronAPI.addPatient(patientData);
    alert(result.message || "บันทึกข้อมูลสำเร็จ!");
    closePopup();
    location.reload();
  } catch (err) {
    console.error("❌ Error adding patient:", err);
    alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
  }
});


/* --------------------------------------------
   🔍 ระบบค้นหาผู้ป่วยด้วย patient_id
-------------------------------------------- */
document.getElementById('searchInput')?.addEventListener('input', async (e) => {
  const keyword = e.target.value.trim();
  try {
    const patients = keyword
      ? await window.electronAPI.searchPatient(parseInt(keyword))
      : await window.electronAPI.getPatients();
    renderPatients(patients);
  } catch (err) {
    console.error("❌ Error searching patient:", err);
  }
});

/* --------------------------------------------
   📋 แสดงข้อมูลในตาราง
-------------------------------------------- */
function renderPatients(data) {
  const tbody = document.querySelector('#patientTable tbody');
  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">ไม่พบข้อมูลผู้ป่วย</td></tr>`;
    return;
  }

  data.forEach((p) => {
    const row = `
      <tr>
        <td>${p.patient_id}</td>
        <td>${p.first_name ?? ''} ${p.last_name ?? ''}</td>
        <td>${p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '-'}</td>
        <td>${p.hospital_id ?? '-'}</td>
        <td><button class="inspect-btn">Inspect</button></td>
      </tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

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

window.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser) {
    document.getElementById('userNameDisplay').textContent = currentUser.username;
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