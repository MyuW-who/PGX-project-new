/* ============================================
   📊 INFORMATION PAGE - PATIENT TRACKING
   ============================================ */

/* ========= Bootstrap ========= */
window.addEventListener('DOMContentLoaded', async () => {
  // 1. 🔑 เรียกใช้สคริปต์หลัก (จาก userProfile.js)
  if (!window.initializeUserProfile()) return;
  
  // 2. 📊 โหลดข้อมูลเฉพาะของหน้านี้
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

/* ========= Elements & Events (โค้ดเดิมของหน้านี้) ========= */
document.getElementById('searchInput')?.addEventListener('input', async e => {
  const kw = e.target.value.trim();
  try {
    const data = kw ? await window.electronAPI.searchTestRequests(kw) : await window.electronAPI.getTestRequests();
    renderTestRequests(data);
    await updateStatsFromAPI(); // อัปเดต stat ทุกครั้งที่ค้นหา/โหลดใหม่
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
  // ไม่ต้องอัปเดต stat ตอน filter เพราะ stat ควรแสดงยอดรวมทั้งหมด
});
 
/* 📷 Popup Scan Barcode (ถูกย้ายไป scanner.js แล้ว)
*/

/* ========= Table Renderer (แสดงข้อมูล Test Requests) ========= */

function getTATBadgeClass(status) {
  const statusLower = (status || '').toLowerCase().trim();
  if (statusLower === 'done') return 'status-done';
  if (statusLower === 'need 1 confirmation') return 'status-pending-1';
  if (statusLower === 'need 2 confirmation') return 'status-pending-2';
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
    const statusDisplay = status;
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
      if (!e.target.closest('button')) {
        // ❗ เรียกใช้ฟังก์ชัน showPage (Global) จาก utils.js
        window.showPage('verify_step1', patientId); 
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

/* ========= Edit / Delete (โค้ดเดิมของหน้านี้) ========= */
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

/* ฟังก์ชัน showPage (ถูกย้ายไป utils.js แล้ว)
   ปุ่ม langToggle (ถูกย้ายไป userProfile.js แล้ว)
*/