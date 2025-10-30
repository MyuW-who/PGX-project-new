/* ============================================
   📊 INFORMATION PAGE - PATIENT TRACKING
   ============================================ */

/* ========= Bootstrap ========= */
window.addEventListener('DOMContentLoaded', async () => {
  // Initialize user profile (from userProfile.js)
  if (!initializeUserProfile()) return;
  
  try {
    const testRequests = await window.electronAPI.getTestRequests();
    console.log('📦 Test Requests:', testRequests);
    renderTestRequests(testRequests);
    await updateStatsFromAPI();
  } catch (e) {
    console.error('fetch test requests error', e);
    renderTestRequests([]);
  }
});

/* ========= Elements & Events ========= */



document.getElementById('searchInput')?.addEventListener('input', async e => {
  const kw = e.target.value.trim();
  try {
    const data = kw ? await window.electronAPI.searchTestRequests(kw) : await window.electronAPI.getTestRequests();
    renderTestRequests(data);
    await updateStatsFromAPI();
  } catch (err) {
    console.error('search error', err);
    renderTestRequests([]);
  }
});

document.getElementById('tatFilter')?.addEventListener('change', async e => {
  const all = await window.electronAPI.getTestRequests();
  const v = e.target.value;
  const filtered = v === 'all' ? all : all.filter(r => r.status === v);
  renderTestRequests(filtered);
  await updateStatsFromAPI();
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

/* ========= Table Renderer (แสดงข้อมูล Test Requests) ========= */

// Helper function to determine TAT badge status and color
function getTATBadgeClass(status) {
  // Normalize status to lowercase for comparison
  const statusLower = (status || '').toLowerCase().trim();
  
  // 🟢 Green - Done (Completed)
  if (statusLower === 'done') {
    return 'status-done';
  }
  
  // 🟡 Yellow - Needs 1 confirmation
  if (statusLower === 'need 1 confirmation') {
    return 'status-pending-1';
  }
  
  // 🟠 Orange - Needs 2 confirmations
  if (statusLower === 'need 2 confirmation') {
    return 'status-pending-2';
  }
  
  // Default for reject or other statuses
  return 'status-default';
}

function renderTestRequests(data) {
  const tbody = document.querySelector('#patientTable tbody');
  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr class="no-data-row"><td colspan="6">ไม่พบข้อมูลที่ตรงกับการค้นหา</td></tr>`;
    return;
  }

  data.forEach(req => {
    const patient = req.patient || {};
    const patientName = `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim() || '-';
    const patientId = patient.patient_id || req.patient_id || '-';
    const hospitalId = patient.hospital_id || '-';
    const requestDate = req.request_date || req.created_at;
    const received = requestDate ? new Date(requestDate).toLocaleDateString('th-TH') : '-';
    const testTarget = req.test_target || '-';
    const status = req.status || '-';
    
    // Display status as-is from database (already in the format we want)
    const statusDisplay = status;
    
    // Get dot class for color coding
    const dotClass = getTATBadgeClass(status);

    const tr = document.createElement('tr');
    tr.setAttribute('data-request-id', req.request_id);
    tr.innerHTML = `
      <td>${req.request_id || '-'}</td>
      <td>${hospitalId}</td>
      <td>${patientName} </td>
      <td>${testTarget}</td>
      <td>${received}</td>
      <td>${req.Specimen || '-'}</td>
      <td>
        <div class="tat-status">
          <span class="tat-dot ${dotClass}"></span>
          <span>${statusDisplay}</span>
        </div>
      </td>
      <td>
        </button>
        ${status?.toLowerCase() === 'done' ? `
          <button class="pdf-btn" onclick="viewPDF(${req.request_id}, '${patientName}')">
            <i class="fas fa-file-pdf"></i> ดู PDF
          </button>
        ` : ''}
      </td>
    `;
    tr.addEventListener('click', (e) => {
      // ไม่ให้คลิกที่ปุ่มทำให้เปลี่ยนหน้า
      if (!e.target.closest('button')) {
         showPage('verify_step1', patientId);
      }
    });
    tbody.appendChild(tr);
  });
}

/* ========= Stats (ดึงจาก API) ========= */
async function updateStatsFromAPI() {
  try {
    const stats = await window.electronAPI.getTestRequestStats();
    document.getElementById('statAll').textContent = stats.all || 0;
    document.getElementById('statPre').textContent = stats.need2Confirmation || 0;
    document.getElementById('statAnalytic').textContent = stats.need1Confirmation || 0;
    document.getElementById('statPost').textContent = stats.done || 0;
  } catch (e) {
    console.error('Error fetching stats:', e);
  }
}

/* ========= Edit / View PDF / Navigate ========= */
async function editTestRequest(requestId) {
  try {
    const req = await window.electronAPI.getTestRequestById(requestId);
    if (!req) return alert('ไม่พบข้อมูล Test Request');
    
    // TODO: เปิด modal หรือฟอร์มแก้ไข (ต้องสร้างเพิ่ม)
    alert(`แก้ไข Request ID: ${requestId}\nPatient: ${req.patient?.first_name || ''}\nStatus: ${req.status}`);
  } catch (e) { 
    console.error(e); 
    alert('เกิดข้อผิดพลาดในการดึงข้อมูล'); 
  }
}

async function viewPDF(requestId, patientName) {
  try {
    // Get the test request details
    const req = await window.electronAPI.getTestRequestById(requestId);
    if (!req) {
      alert('ไม่พบข้อมูล Test Request');
      return;
    }
    
    // Check if PDF exists (you can add a field in database to track this)
    if (req.Doc_Name) {
      // If there's a PDF file path in the database
      alert(`เปิดไฟล์ PDF: ${req.Doc_Name}`);
      // TODO: Implement actual PDF viewing/opening
      // window.electronAPI.openPDF(req.Doc_Name);
    } else {
      // Generate PDF if it doesn't exist
      const reportData = {
        name: patientName,
        age: req.patient?.age || '-',
        gender: req.patient?.gender || '-',
        hn: req.patient?.patient_id || '-',
        hospital: req.patient?.hospital_id || '-',
        testTarget: req.test_target || '-',
        specimen: req.Specimen || '-'
      };
      
      const pdfPath = await window.electron.generatePDF(reportData);
      alert(`สร้าง PDF สำเร็จ: ${pdfPath}`);
    }
  } catch (e) {
    console.error('❌ Error viewing PDF:', e);
    alert('เกิดข้อผิดพลาดในการดู PDF');
  }
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
