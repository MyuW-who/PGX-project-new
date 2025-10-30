/* ============================================
   📊 INFORMATION PAGE - PATIENT TRACKING
   ============================================ */

/* ========= Bootstrap ========= */
window.addEventListener('DOMContentLoaded', async () => {
  // Initialize user profile (from userProfile.js)
  if (!initializeUserProfile()) return;
  
  try {
    const patients = await window.electronAPI.getPatients();
    renderPatients(patients);
    updateStats(patients);
  } catch (e) {
    console.error('fetch patients error', e);
    renderPatients([]);
  }
});

/* ========= Elements & Events ========= */



document.getElementById('searchInput')?.addEventListener('input', async e => {
  const kw = e.target.value.trim();
  try {
    const data = kw ? await window.electronAPI.searchPatient(kw) : await window.electronAPI.getPatients();
    renderPatients(data); updateStats(data);
  } catch (err) {
    console.error('search error', err);
    renderPatients([]);
  }
});

document.getElementById('tatFilter')?.addEventListener('change', async e => {
  // ตัวอย่าง filter ฝั่งหน้า (ถ้าฝั่ง main มีฟังก์ชัน filter จริงให้เรียกแทน)
  const all = await window.electronAPI.getPatients();
  const v = e.target.value;
  renderPatients(all.filter(p => v === 'all' ? true : (p.tat_status || 'analytic') === v));
  updateStats(all);
});

 
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

/* ========= Table Renderer (6 คอลัมน์ตรงหัวตาราง) ========= */
function renderPatients(data) {
  const tbody = document.querySelector('#patientTable tbody');
  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr class="no-data-row"><td colspan="6">ไม่พบข้อมูลที่ตรงกับการค้นหา</td></tr>`;
    return;
  }

  data.forEach(p => {
    const received = p.created_at ? new Date(p.created_at).toLocaleDateString('th-TH') : '-';
    const latest   = p.latest_result_type || '-';
    const tat      = p.tat_status || '-';
    const name     = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();

    const tr = document.createElement('tr');
    tr.setAttribute('data-patient-id', p.patient_id);
    tr.innerHTML = `
      <td>${p.patient_id ?? '-'}</td>
      <td>${name || '-'}</td>
      <td>${received}</td>
      <td>${latest}</td>
      <td>${tat}</td>
      <td>
        <button class="Edit-btn" onclick="editPatient(${p.patient_id})"><i class="fas fa-edit"></i> แก้ไข</button>
        <button class="delete-btn" onclick="deletePatient(${p.patient_id})"><i class="fas fa-trash-alt"></i></button>
      </td>
    `;
    tr.addEventListener('click', () => showPage('verify_step1', p.patient_id));
    tbody.appendChild(tr);
  });
}

/* ========= Stats (ตัวอย่างง่าย ๆ) ========= */
function updateStats(list) {
  const all = list?.length || 0;
  document.getElementById('statAll').textContent = all;
  // ถ้ามีฟิลด์สถานะจริง ให้คำนวณแยกตาม pre/analytic/post ได้
  document.getElementById('statPre').textContent = 0;
  document.getElementById('statAnalytic').textContent = all;
  document.getElementById('statPost').textContent = 0;
}

/* ========= Edit / Delete / Navigate ========= */
async function editPatient(id) {
  try {
    const p = await window.electronAPI.getPatientById(id);
    if (!p) return alert('ไม่พบข้อมูลผู้ป่วย');
    isEditMode = true; editingPatientId = id;
    document.getElementById('patient_id').value = p.patient_id;
    document.getElementById('first_name').value = p.first_name || '';
    document.getElementById('last_name').value  = p.last_name || '';
    document.getElementById('age').value        = p.age || '';
    document.getElementById('gender').value     = p.gender || 'U';
    document.getElementById('ethnicity').value  = p.ethnicity || '';
    document.getElementById('blood_type').value = p.blood_type || '';
    document.getElementById('hospital').value   = p.hospital_id || '';
    document.getElementById('phone').value      = p.phone || '';
    document.getElementById('patient_id').readOnly = true;
    popupAdd.classList.remove('hidden');
  } catch (e) { console.error(e); alert('เกิดข้อผิดพลาดในการดึงข้อมูล'); }
}

async function deletePatient(id) {
  if (!confirm('คุณแน่ใจที่จะลบข้อมูลผู้ป่วยหรือไม่?')) return;
  try {
    const res = await window.electronAPI.deletePatient(id);
    alert(res.message || 'ลบข้อมูลสำเร็จ');
    const data = await window.electronAPI.getPatients(); renderPatients(data); updateStats(data);
  } catch (e) { console.error(e); alert('เกิดข้อผิดพลาดในการลบข้อมูล'); }
}

function showPage(pageName, patientId) {
  sessionStorage.setItem('selectedPatientId', patientId);
  window.electronAPI?.navigate(pageName);
}

/* ========= Light/Dark toggle (ตัวอย่าง) ========= */

document.getElementById('langToggle')?.addEventListener('click', (e) => {
  e.target.textContent = e.target.textContent === 'TH' ? 'EN' : 'TH';
});

/* --------------------------------------------
   ⚙️ Settings Popup Handler
-------------------------------------------- */
const settingsPopup = document.getElementById('settingsPopup');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const cancelSettings = document.getElementById('cancelSettings');
const settingsBtn = document.getElementById('settingsBtn');

// Open settings popup
settingsBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  settingsPopup.style.display = 'flex';
  dropdownMenu?.classList.remove('show');
});

// Close settings popup
closeSettings?.addEventListener('click', () => {
  settingsPopup.style.display = 'none';
});

cancelSettings?.addEventListener('click', () => {
  settingsPopup.style.display = 'none';
});

// Save settings
saveSettings?.addEventListener('click', () => {
  const language = document.getElementById('languageSetting').value;
  const theme = document.getElementById('themeSetting').value;
  const notifications = document.getElementById('notificationsSetting').checked;
  
  localStorage.setItem('appLanguage', language);
  localStorage.setItem('appTheme', theme);
  localStorage.setItem('appNotifications', notifications);
  
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  
  alert('Settings saved successfully!');
  settingsPopup.style.display = 'none';
});

// Close popup when clicking outside
settingsPopup?.addEventListener('click', (e) => {
  if (e.target === settingsPopup) {
    settingsPopup.style.display = 'none';
  }
});

// Load saved settings
setTimeout(() => {
  const savedTheme = localStorage.getItem('appTheme');
  const savedLanguage = localStorage.getItem('appLanguage');
  const savedNotifications = localStorage.getItem('appNotifications');
  
  if (savedTheme && document.getElementById('themeSetting')) {
    document.getElementById('themeSetting').value = savedTheme;
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    }
  }
  
  if (savedLanguage && document.getElementById('languageSetting')) {
    document.getElementById('languageSetting').value = savedLanguage;
  }
  
  if (savedNotifications !== null && document.getElementById('notificationsSetting')) {
    document.getElementById('notificationsSetting').checked = savedNotifications === 'true';
  }
}, 100);
