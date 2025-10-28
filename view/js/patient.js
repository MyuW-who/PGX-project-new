/* ============================================
   🧬 PATIENT MANAGEMENT SCRIPT (Electron Bridge)
   ============================================ */

/* --------------------------------------------
   ✅ โหลดข้อมูลผู้ป่วยเมื่อหน้าเปิดขึ้น
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
   📝 Form handler supports Add and Edit modes
--------------------------------------------- */
const form = document.getElementById('addForm');
let isEditMode = false;
let editingPatientId = null;

async function handleFormSubmit(e) {
  e.preventDefault();

  // collect common fields
  const baseData = {
    patient_id: parseInt(document.getElementById('patient_id').value),
    hospital_id: document.getElementById('hospital').value.trim(),
    first_name: document.getElementById('first_name').value.trim(),
    last_name: document.getElementById('last_name').value.trim(),
    age: parseInt(document.getElementById('age').value),
    gender: document.getElementById('gender').value,
    ethnicity: document.getElementById('ethnicity').value.trim(),
    blood_type: document.getElementById('blood_type').value,
    phone: document.getElementById('phone').value.trim(),
  };

  try {
    if (isEditMode && editingPatientId) {
      const result = await window.electronAPI.updatePatient(editingPatientId, baseData);
      alert(result.message || 'อัพเดทข้อมูลสำเร็จ!');
    } else {
      const payload = { ...baseData, created_at: new Date().toISOString() };
      const result = await window.electronAPI.addPatient(payload);
      alert(result.message || 'บันทึกข้อมูลสำเร็จ!');
    }
    closePopup();
    location.reload();
  } catch (err) {
    console.error('❌ Error saving patient:', err);
    alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
  }
}

form?.addEventListener('submit', handleFormSubmit);

/* --------------------------------------------
   🔍 ระบบค้นหาผู้ป่วยด้วย patient_id
-------------------------------------------- */
document.getElementById('searchInput')?.addEventListener('input', async (e) => {
  const keyword = e.target.value.trim();
  try {
    const patients = keyword
      ? await window.electronAPI.searchPatient(keyword)
      : await window.electronAPI.getPatients();
    renderPatients(patients);
  } catch (err) {
    console.error("❌ Error searching patient:", err);
  }
});

/* --------------------------------------------
   📋 ฟังก์ชันแสดงข้อมูลในตาราง
-------------------------------------------- */
function renderPatients(data) {
  const tbody = document.querySelector('#patientTable tbody');
  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">ไม่พบข้อมูลผู้ป่วย</td></tr>`;
    return;
  }

  data.forEach((p, index) => {
    const row = `
      <tr onclick="showPage('verify_step1', '${p.patient_id}')" data-patient-id="${p.patient_id}">
        <td>${p.patient_id ?? '-'}</td>
        <td>${p.first_name ?? ''} ${p.last_name ?? ''}</td>
        <td>${p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '-'}</td>
        <td>${p.hospital_id ?? '-'}</td>
        <td><button class="Edit-btn" onclick="event.stopPropagation(); editPatient(${p.patient_id})">Edit</button></td>
        <td><button class="delete-btn" onclick="event.stopPropagation(); deletePatient(${p.patient_id})">Delete</button></td>
      </tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  });

  // 🔗 เพิ่ม Event ให้ทุกปุ่ม Inspect
  attachInspectButtons();
}

/* --------------------------------------------
   🪟 Popup Add Patient
-------------------------------------------- */
const popupAdd = document.getElementById('popupAdd');
const addBtn = document.getElementById('addBtn');
const closeAdd = document.getElementById('closeAdd');
const popupTitle = popupAdd?.querySelector('h3');

addBtn?.addEventListener('click', () => {
  // switch to add mode
  isEditMode = false;
  editingPatientId = null;
  popupTitle && (popupTitle.textContent = 'เพิ่มข้อมูลผู้ป่วย');
  // reset form and allow changing patient_id
  form?.reset();
  const idEl = document.getElementById('patient_id');
  if (idEl) idEl.readOnly = false;
  popupAdd.style.display = 'flex';
});

closeAdd?.addEventListener('click', closePopup);

function closePopup() {
  popupAdd.style.display = 'none';
  // reset state back to add mode
  isEditMode = false;
  editingPatientId = null;
  popupTitle && (popupTitle.textContent = 'เพิ่มข้อมูลผู้ป่วย');
  const idEl = document.getElementById('patient_id');
  if (idEl) idEl.readOnly = false;
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

/* --------------------------------------------
   👤 Dropdown Menu (Settings / Logout)
-------------------------------------------- */
const dropdownBtn = document.getElementById("dropdownBtn");
const dropdownMenu = document.getElementById("dropdownMenu");

dropdownBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdownMenu.classList.toggle("show");
});

window.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown")) {
    dropdownMenu?.classList.remove("show");
  }
});

/* --------------------------------------------
   🧭 Navigation Buttons
-------------------------------------------- */

// ▶️ ปุ่มไปหน้า Dashboard
const dashboardBtn = document.getElementById('dashboard-btn');
dashboardBtn?.addEventListener('click', () => {
  window.electronAPI.navigate('dashboard1');
});

// ▶️ ปุ่ม Inspect (ทุกปุ่ม)
function attachInspectButtons() {
  document.querySelectorAll('.inspect-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.electronAPI.navigate('verify_step1');
    });
  });
}

document.getElementById('logout').addEventListener('click', (e) => {
  e.preventDefault();
  sessionStorage.clear();
  window.electronAPI.navigate('login');
});

function showPage(pageName, patientId) {
  // Store patientId in sessionStorage for use in verify_step1.html
  sessionStorage.setItem('selectedPatientId', patientId);
  window.electronAPI.navigate(pageName); // Navigate to the specified page
}

/* --------------------------------------------
   ✏️ Edit Patient Function
-------------------------------------------- */
async function editPatient(patientId) {
  try {
    // Get patient data
    const patient = await window.electronAPI.getPatientById(patientId);
    if (!patient) {
      alert('ไม่พบข้อมูลผู้ป่วย');
      return;
    }

    // Populate form with patient data
    document.getElementById('patient_id').value = patient.patient_id;
    document.getElementById('first_name').value = patient.first_name;
    document.getElementById('last_name').value = patient.last_name;
    document.getElementById('age').value = patient.age;
    document.getElementById('gender').value = patient.gender;
    document.getElementById('ethnicity').value = patient.ethnicity;
    document.getElementById('blood_type').value = patient.blood_type;
    document.getElementById('hospital').value = patient.hospital_id;
    document.getElementById('phone').value = patient.phone;

    // Switch to edit mode
    isEditMode = true;
    editingPatientId = patientId;
    popupTitle && (popupTitle.textContent = 'แก้ไขผู้ป่วย');
    const idEl = document.getElementById('patient_id');
    if (idEl) idEl.readOnly = true; // lock primary key during edit
    // Show popup
    popupAdd.style.display = 'flex';
  } catch (err) {
    console.error('❌ Error fetching patient details:', err);
    alert('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย');
  }
}







/* --------------------------------------------
   🗑️ Delete Patient Function
-------------------------------------------- */
async function deletePatient(patientId) {
  if (confirm('คุณแน่ใจที่จะลบข้อมูลผู้ป่วยหรือไม่?')) {
    try {
      const result = await window.electronAPI.deletePatient(patientId);
      alert(result.message || 'ลบข้อมูลสำเร็จ!');
      location.reload();
    } catch (err) {
      console.error('❌ Error deleting patient:', err);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  }
}

