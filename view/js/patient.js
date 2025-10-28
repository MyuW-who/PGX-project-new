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
      <tr onclick="showPage('verify_step1', '${p.patient_id}')">
        <td>${p.patient_id ?? '-'}</td>
        <td>${p.first_name ?? ''} ${p.last_name ?? ''}</td>
        <td>${p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '-'}</td>
        <td>${p.hospital_id ?? '-'}</td>
        <td><button class="Edit-btn"><i class="fas fa-edit"></i></button></td>
        <td><button class="delete-btn"><i class="fas fa-trash-alt"></i></button></td>
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
  window.electronAPI.navigate('login');
});

function showPage(pageName, patientId) {
  // Store patientId in sessionStorage for use in verify_step1.html
  sessionStorage.setItem('selectedPatientId', patientId);
  window.electronAPI.navigate(pageName); // Navigate to the specified page
}

/* --------------------------------------------
   📷 Popup Scan Barcode (ใช้โค้ดใหม่ส่วนนี้)
-------------------------------------------- */
const scannerOverlay = document.getElementById('scannerOverlay');
const scanBtn = document.getElementById('scanBarcodeBtn');
const closeScannerBtn = document.getElementById('closeScannerBtn');

// เมื่อกดปุ่ม "สแกนบาร์โค้ด"
scanBtn?.addEventListener('click', () => {
  scannerOverlay.style.display = 'flex'; // ให้แสดง scanner popup
});

// เมื่อกดปุ่ม "ปิด" ใน scanner popup
closeScannerBtn?.addEventListener('click', () => {
  scannerOverlay.style.display = 'none'; // ให้ซ่อน scanner popup
});


