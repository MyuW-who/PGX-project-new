/* ============================================
   📊 INFORMATION PAGE - PATIENT TRACKING
   ============================================ */

let specimenSlaMap = {};

/* ========= Bootstrap ========= */
window.addEventListener('DOMContentLoaded', async () => {
  // Initialize user profile (from userProfile.js)
  if (!initializeUserProfile()) return;
  
  try {
    // 1. ดึงข้อมูล SLA มาเก็บในตัวแปรที่สร้างไว้
    specimenSlaMap = await window.electronAPI.getSpecimenSLA();
    console.log('✅ Fetched SLA Map:', specimenSlaMap);
    console.log('🔍 SLA Map Keys:', Object.keys(specimenSlaMap));
    console.log('🔍 SLA Map Values:', Object.values(specimenSlaMap));

    // 2. ดึงข้อมูล Test Requests (เหมือนเดิม)
    const testRequests = await window.electronAPI.getTestRequests();
    console.log('📦 Test Requests:', testRequests);
    console.log('📦 Sample Request:', testRequests[0]);
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

/* ========= TAT Warning Calculation ========= */
function calculateTATWarning(requestDate, slaTime, status) {
  // Only calculate for non-done and non-reject cases
  const statusLower = status?.toLowerCase() || '';
  if (!requestDate || statusLower === 'done' || statusLower === 'reject') {
    return { warning: false, percentage: 0, overdue: false };
  }

  const startDate = new Date(requestDate);
  const now = new Date();
  
  // Check if date is valid
  if (isNaN(startDate.getTime())) {
    console.error('❌ Invalid date:', requestDate);
    return { warning: false, percentage: 0, overdue: false };
  }
  
  // Use provided SLA time in DAYS (not hours)
  let slaDays = parseFloat(slaTime);
  
  // If no valid SLA time provided, don't show warnings
  if (!slaDays || slaDays <= 0) {
    console.warn('⚠️ No valid SLA time:', slaTime);
    return { warning: false, percentage: 0, overdue: false };
  }
  
  // Calculate elapsed time in days
  const elapsedMs = now - startDate;
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  
  // Calculate percentage
  const percentage = (elapsedDays / slaDays) * 100;
  
  console.log('📊 TAT Calculation:', {
    requestDate,
    startDate: startDate.toISOString(),
    now: now.toISOString(),
    elapsedMs,
    elapsedDays: elapsedDays.toFixed(2),
    slaDays,
    percentage: percentage.toFixed(2),
    warning: percentage > 80 && percentage <= 100,
    overdue: percentage > 100
  });
  
  return {
    warning: percentage > 80 && percentage <= 100,
    overdue: percentage > 100,
    percentage: Math.round(percentage)
  };
}

function renderTestRequests(data) {
  const tbody = document.querySelector('#patientTable tbody');
  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr class="no-data-row"><td colspan="8">ไม่พบข้อมูลที่ตรงกับการค้นหา</td></tr>`;
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

    const specimen = req.Specimen || '-';

    // Get SLA time from map (case-insensitive lookup)
    const specimenKey = (specimen || '').toLowerCase();
    const slaTime = specimenSlaMap[specimenKey];
    
    // Display status as-is from database
    const statusDisplay = status;

    // Get dot class for color coding
    const dotClass = getTATBadgeClass(status);
    
    // Calculate TAT warning with actual SLA time from database
    const tatWarning = calculateTATWarning(requestDate, slaTime, status);
    
    // Debug logging
    if (req.request_id === 43) {
      console.log(`🔍 DEBUG Request ${req.request_id}:`, {
        specimen,
        specimenKey,
        slaTime,
        requestDate,
        requestDateType: typeof requestDate,
        status,
        tatWarning,
        fullRequest: req,
        specimenSlaMap
      });
    }

    const tr = document.createElement('tr');
    tr.setAttribute('data-request-id', req.request_id);

    // Add warning class to row if overdue or warning
    if (tatWarning.overdue) {
      tr.classList.add('tat-overdue');
    } else if (tatWarning.warning) {
      tr.classList.add('tat-warning');
    }
    
    tr.innerHTML = `
      <td>${req.request_id || '-'}</td>
      <td>${hospitalId}</td>
      <td>${patientName}</td>
      <td>${testTarget}</td>
      <td>${received}</td>
      <td>${specimen}</td>
      <td>
        <div class="tat-status">
          <span class="tat-dot ${dotClass}"></span>
          <span>${statusDisplay}</span>
          ${tatWarning.warning ? `<i class="fas fa-exclamation-triangle tat-warning-icon" title="TAT > 80% (${tatWarning.percentage}%)"></i>` : ''}
          ${tatWarning.overdue ? `<i class="fas fa-exclamation-circle tat-overdue-icon" title="TAT > 100% - Overdue! (${tatWarning.percentage}%)"></i>` : ''}
        </div>
      </td>
      <td>
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
        showPage('verify_pharmacy', req.request_id);
      }
    });
    tbody.appendChild(tr);
  });
}

/* ========= Stats (ดึงจาก API) ========= */
async function updateStatsFromAPI() {
  try {
    const stats = await window.electronAPI.getTestRequestStats('all');
    document.getElementById('statAll').textContent = stats.all || 0;
    document.getElementById('statPre').textContent = stats.need2 || stats.need2Confirmation || 0;
    document.getElementById('statAnalytic').textContent = stats.need1 || stats.need1Confirmation || 0;
    document.getElementById('statPost').textContent = stats.done || 0;
  } catch (e) {
    console.error('Error fetching stats:', e);
    // Set to 0 if error
    document.getElementById('statAll').textContent = 0;
    document.getElementById('statPre').textContent = 0;
    document.getElementById('statAnalytic').textContent = 0;
    document.getElementById('statPost').textContent = 0;
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

function showPage(pageName, requestId) {
  sessionStorage.setItem('selectedRequestId', requestId);
  window.electronAPI?.navigate(pageName);
}

/* ========= Light/Dark toggle (ตัวอย่าง) ========= */

document.getElementById('langToggle')?.addEventListener('click', (e) => {
  e.target.textContent = e.target.textContent === 'TH' ? 'EN' : 'TH';
});

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

