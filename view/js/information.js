/* ========= Session & Auth ========= */
function getCurrentUser() {
  try { const s = sessionStorage.getItem('currentUser'); return s ? JSON.parse(s) : null; }
  catch { return null; }
}
function checkAuthentication() {
  const u = getCurrentUser();
  if (!u) { window.electronAPI?.navigate('login'); return false; }
  const dropdownBtn = document.getElementById('dropdownBtn');
  if (dropdownBtn) dropdownBtn.innerHTML =
    `<i class="fa fa-user-circle"></i> ${u.username} (${u.role}) <i class="fa fa-caret-down"></i>`;
  return true;
}

/* ========= Bootstrap ========= */
window.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuthentication()) return;
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
const dropdownBtn = document.getElementById("dropdownBtn");
const dropdownMenu = document.getElementById("dropdownMenu");
dropdownBtn?.addEventListener("click", e => { e.stopPropagation(); dropdownMenu.classList.toggle("show"); });
window.addEventListener("click", e => { if (!e.target.closest(".dropdown")) dropdownMenu?.classList.remove("show"); });

document.getElementById('logout')?.addEventListener('click', async (e) => {
  e.preventDefault();
  sessionStorage.clear(); localStorage.removeItem('userSession'); localStorage.removeItem('userRole');
  window.electronAPI?.navigate('login');
});

document.getElementById('dashboard-btn')?.addEventListener('click', () => {
  window.electronAPI?.navigate('dashboard1');
});

const dashboard_btn = document.getElementById('patient-btn');
dashboard_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('patient');
});

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
      <td>${patientId}</td>
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
        <button class="Edit-btn" onclick="editTestRequest(${req.request_id})"><i class="fas fa-edit"></i> แก้ไข</button>
        <button class="delete-btn" onclick="deleteTestRequest(${req.request_id})"><i class="fas fa-trash-alt"></i></button>
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
    console.log('📊 Stats received in frontend:', stats);
    document.getElementById('statAll').textContent = stats.all || 0;
    document.getElementById('statPre').textContent = stats.need2Confirmation || 0;
    document.getElementById('statAnalytic').textContent = stats.need1Confirmation || 0;
    document.getElementById('statPost').textContent = stats.done || 0;
  } catch (e) {
    console.error('Error fetching stats:', e);
  }
}

/* ========= Edit / Delete / Navigate ========= */
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

async function deleteTestRequest(requestId) {
  if (!confirm('คุณแน่ใจที่จะลบข้อมูล Test Request หรือไม่?')) return;
  try {
    const res = await window.electronAPI.deleteTestRequest(requestId);
    alert(res.message || 'ลบข้อมูลสำเร็จ');
    const data = await window.electronAPI.getTestRequests();
    renderTestRequests(data);
    await updateStatsFromAPI();
  } catch (e) { 
    console.error(e); 
    alert('เกิดข้อผิดพลาดในการลบข้อมูล'); 
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
