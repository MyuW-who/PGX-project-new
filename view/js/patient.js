/* ============================================
   🧬 PATIENT MANAGEMENT SCRIPT (Electron Bridge)
   ============================================ */

/* --------------------------------------------
   ✅ โหลดข้อมูลผู้ป่วยเมื่อหน้าเปิดขึ้น
-------------------------------------------- */
window.addEventListener('DOMContentLoaded', async () => {
  // 1. 🔑 เรียกใช้สคริปต์หลัก (จาก userProfile.js)
  if (!window.initializeUserProfile()) {
    return; // หยุดถ้าไม่ผ่านการตรวจสอบสิทธิ์
  }
  
  // 2. 📊 โหลดข้อมูลเฉพาะของหน้านี้
  try {
    const patients = await window.electronAPI.getPatients();
    console.log("📦 Renderer got patients:", patients);
    renderPatients(patients);
  } catch (err) {
    console.error("❌ Error fetching patients:", err);
  }
});

/* --------------------------------------------
   📝 Form handler (โค้ดเดิมของหน้านี้)
--------------------------------------------- */
const form = document.getElementById('addForm');
let isEditMode = false;
let editingPatientId = null;

async function handleFormSubmit(e) {
  e.preventDefault();

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
    // โค้ดส่วนนี้ดูเหมือนจะเป็นการ "แก้ไข" เสมอ (ไม่มีการเช็ค isEditMode)
    // ถ้าต้องการให้รองรับ "เพิ่ม" ด้วย อาจจะต้องปรับ logic ตรงนี้
    
    // await window.electronAPI.updatePatient(editingPatientId, baseData); // (สมมติว่าใช้ editingPatientId)

    await Swal.fire({
      icon: 'success',
      title: 'บันทึกสำเร็จ!',
      text: 'ข้อมูลผู้ป่วยได้รับการอัปเดตแล้ว',
      background: '#1f2937',
      color: '#f9fafb',
      confirmButtonColor: '#3b82f6'
    });
    location.reload();

  } catch (err) {
    console.error('❌ Error saving patient data:', err);
    Swal.fire({
      icon: 'error',
      title: 'บันทึกไม่สำเร็จ',
      text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
      background: '#1f2937',
      color: '#f9fafb',
      confirmButtonColor: '#3b82f6'
    });
  }
}

form?.addEventListener('submit', handleFormSubmit);

/* --------------------------------------------
   🔍 ระบบค้นหาผู้ป่วย (โค้ดเดิมของหน้านี้)
-------------------------------------------- */
document.getElementById('searchInput')?.addEventListener('input', async (e) => {
  const keyword = e.target.value.trim();
  try {
    if (keyword.length === 0) {
      const patients = await window.electronAPI.getPatients();
      renderPatients(patients);
    } else if (keyword.length >= 1) {
      const patients = await window.electronAPI.searchPatient(keyword);
      renderPatients(patients);
      console.log(`🔍 พบผลการค้นหา ${patients.length} รายการสำหรับ "${keyword}"`);
    }
  } catch (err) {
    console.error("❌ Error searching patient:", err);
    const tbody = document.querySelector('#patientTable tbody');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">เกิดข้อผิดพลาดในการค้นหา: ${err.message}</td></tr>`;
  }
});

/* --------------------------------------------
   📋 ฟังก์ชันแสดงข้อมูลในตาราง (โค้ดเดิมของหน้านี้)
-------------------------------------------- */
function renderPatients(data) {
  const tbody = document.querySelector('#patientTable tbody');
  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput?.value.trim();
    const message = searchTerm 
      ? `ไม่พบข้อมูลผู้ป่วยที่ตรงกับ "${searchTerm}"` 
      : 'ไม่พบข้อมูลผู้ป่วย';
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">${message}</td></tr>`;
    return;
  }

  data.forEach((p, index) => {
    const row = `
      <tr onclick="window.showPage('verify_step1', '${p.patient_id}')" data-patient-id="${p.patient_id}">
        <td>${p.patient_id ?? '-'}</td>
        <td>${p.first_name ?? ''} ${p.last_name ?? ''}</td>
        <td>${p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '-'}</td>
        <td>${p.hospital_id ?? '-'}</td>
        <td><button class="Edit-btn" onclick="event.stopPropagation(); editPatient(${p.patient_id})"><i class="fas fa-edit"></i></button></td>
        <td><button class="delete-btn" onclick="event.stopPropagation(); deletePatient(${p.patient_id})"><i class="fas fa-trash-alt"></i></button></td>
      </tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

/* --------------------------------------------
   🪟 Popup Add Patient (โค้ดเดิมของหน้านี้)
-------------------------------------------- */
const popupAdd = document.getElementById('popupAdd');
const addBtn = document.getElementById('addBtn');
const closeAdd = document.getElementById('closeAdd');
const popupTitle = popupAdd?.querySelector('h3');

addBtn?.addEventListener('click', () => {
  isEditMode = false;
  editingPatientId = null;
  popupTitle && (popupTitle.textContent = 'เพิ่มข้อมูลผู้ป่วย');
  form?.reset();
  const idEl = document.getElementById('patient_id');
  if (idEl) idEl.readOnly = false;
  popupAdd.style.display = 'flex';
});

closeAdd?.addEventListener('click', closePopup);

function closePopup() {
  popupAdd.style.display = 'none';
  isEditMode = false;
  editingPatientId = null;
  popupTitle && (popupTitle.textContent = 'เพิ่มข้อมูลผู้ป่วย');
  const idEl = document.getElementById('patient_id');
  if (idEl) idEl.readOnly = false;
}

/* --------------------------------------------
   ✏️ Edit Patient Function (โค้ดเดิมของหน้านี้)
-------------------------------------------- */
async function editPatient(patientId) {
  try {
    const patient = await window.electronAPI.getPatientById(patientId);
    if (!patient) {
      alert('ไม่พบข้อมูลผู้ป่วย');
      return;
    }

    document.getElementById('patient_id').value = patient.patient_id;
    document.getElementById('first_name').value = patient.first_name;
    document.getElementById('last_name').value = patient.last_name;
    document.getElementById('age').value = patient.age;
    document.getElementById('gender').value = patient.gender;
    document.getElementById('ethnicity').value = patient.ethnicity;
    document.getElementById('blood_type').value = patient.blood_type;
    document.getElementById('hospital').value = patient.hospital_id;
    document.getElementById('phone').value = patient.phone;

    isEditMode = true;
    editingPatientId = patientId;
    popupTitle && (popupTitle.textContent = 'แก้ไขผู้ป่วย');
    const idEl = document.getElementById('patient_id');
    if (idEl) idEl.readOnly = true; // lock primary key
    popupAdd.style.display = 'flex';
  } catch (err) {
    console.error('❌ Error fetching patient details:', err);
    alert('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย');
  }
}

/* --------------------------------------------
   🗑️ Delete Patient Function (โค้ดเดิมของหน้านี้)
-------------------------------------------- */
async function deletePatient(patientId) {
  Swal.fire({
    title: 'คุณแน่ใจหรือไม่?',
    text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ใช่, ลบเลย!',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    background: '#1f2937',
    color: '#f9fafb',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await window.electronAPI.deletePatient(patientId);
        Swal.fire({
          title: 'ลบสำเร็จ!',
          text: response.message || 'ข้อมูลผู้ป่วยถูกลบเรียบร้อยแล้ว',
          icon: 'success',
          background: '#1f2937',
          color: '#f9fafb',
          confirmButtonColor: '#3b82f6'
        }).then(() => {
          location.reload();
        });
      } catch (err) {
        console.error('❌ Error deleting patient:', err);
        Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: 'ไม่สามารถลบข้อมูลผู้ป่วยได้',
          icon: 'error',
          background: '#1f2937',
          color: '#f9fafb',
          confirmButtonColor: '#3b82f6'
        });
      }
    }
  });
}

/* Session, Logout, showPage, Scanner (ถูกย้ายไปไฟล์หลักแล้ว)
*/