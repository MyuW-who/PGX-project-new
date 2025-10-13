/* ============================================
   🧬 ADD / VIEW PATIENT SCRIPT (Electron Bridge)
   ============================================ */

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

/* --------------------------------------------
   🪟 Popup จัดการแสดง/ปิดฟอร์ม
-------------------------------------------- */
const popupAdd = document.getElementById('popupAdd');
const addBtn = document.getElementById('addBtn');
const closeAdd = document.getElementById('closeAdd');

addBtn?.addEventListener('click', () => {
  popupAdd.style.display = 'flex';
});

closeAdd?.addEventListener('click', closePopup);

function closePopup() {
  popupAdd.style.display = 'none';
}

/* --------------------------------------------
   🌙 Toggle Theme
-------------------------------------------- */
const themeBtn = document.getElementById('themeToggle');
themeBtn?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

/* --------------------------------------------
   🌐 Toggle Language
-------------------------------------------- */
const langBtn = document.getElementById('langToggle');
langBtn?.addEventListener('click', () => {
  langBtn.textContent = langBtn.textContent === 'TH' ? 'EN' : 'TH';
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