/* ============================================
   📊 TEST REQUEST MANAGER - PENDING REQUESTS ONLY
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

    // 2. ดึงข้อมูล Test Requests - Filter for pending only
    const testRequests = await window.electronAPI.getTestRequests();
    const pendingRequests = testRequests.filter(r => r.status?.toLowerCase() === 'pending');
    console.log('📦 Pending Test Requests:', pendingRequests);
    renderTestRequests(pendingRequests);
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
  } catch (err) {
    console.error('search error', err);
    renderTestRequests([]);
  }
});

document.getElementById('tatFilter')?.addEventListener('change', async e => {
  const all = await window.electronAPI.getTestRequests();
  const v = e.target.value;
  
  let filtered;
  if (v === 'pending') {
    // Default: show only pending
    filtered = all.filter(r => r.status?.toLowerCase() === 'pending');
  } else if (v === 'all') {
    filtered = all;
  } else {
    filtered = all.filter(r => r.status === v);
  }
  
  renderTestRequests(filtered);
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

/* ========= TAT Calculation Helper ========= */
function calculateTAT(requestDate, specimen, status) {
  const statusLower = (status || '').toLowerCase();
  if (!requestDate || statusLower === 'done' || statusLower === 'reject') {
    return { percentage: 0, tatClass: '', tatIcon: '', showTAT: false };
  }

  const startDate = new Date(requestDate);
  const now = new Date();
  
  if (isNaN(startDate.getTime())) {
    return { percentage: 0, tatClass: '', tatIcon: '', showTAT: false };
  }
  
  const specimenKey = (specimen || '').toLowerCase();
  const slaDays = parseFloat(specimenSlaMap[specimenKey]);
  
  if (!slaDays || slaDays <= 0) {
    return { percentage: 0, tatClass: '', tatIcon: '', showTAT: false };
  }
  
  const elapsedMs = now - startDate;
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  const percentage = (elapsedDays / slaDays) * 100;
  
  let tatClass = '';
  let tatIcon = '';
  let priority = 0;
  
  if (percentage > 100) {
    tatClass = 'tat-overdue';
    tatIcon = 'fa-exclamation-circle';
    priority = 3;
  } else if (percentage >= 80) {
    tatClass = 'tat-warning';
    tatIcon = 'fa-exclamation-triangle';
    priority = 2;
  } else {
    tatClass = 'tat-normal';
    tatIcon = 'fa-clock';
    priority = 1;
  }
  
  return { 
    percentage: Math.round(percentage), 
    tatClass, 
    tatIcon, 
    showTAT: true,
    priority,
    elapsedDays: elapsedDays.toFixed(1),
    slaDays
  };
}

/* ========= Table Renderer (แสดงข้อมูล Test Requests as Cards) ========= */

function renderTestRequests(data) {
  const grid = document.getElementById('requestsGrid');
  if (!grid) return;
  
  grid.innerHTML = '';

  if (!data || data.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>ไม่พบคำขอตรวจที่รอดำเนินการ</h3>
        <p>ไม่มีข้อมูลที่ตรงกับการค้นหา</p>
      </div>
    `;
    // Update stats to show 0
    updateStatsDisplay(0, 0, 0, 0);
    return;
  }

  // Calculate TAT for each request and sort by priority
  const dataWithTAT = data.map(req => {
    const specimen = req.specimen || req.Specimen || '-';
    const requestDate = req.request_date || req.created_at;
    const tat = calculateTAT(requestDate, specimen, req.status);
    return { ...req, tat };
  });
  
  // Sort by TAT priority (overdue > warning > normal)
  dataWithTAT.sort((a, b) => b.tat.priority - a.tat.priority);

  // Calculate stats from current data
  const stats = {
    pending: dataWithTAT.filter(r => (r.status || '').toLowerCase() === 'pending').length,
    tatNormal: dataWithTAT.filter(r => r.tat.tatClass === 'tat-normal').length,
    tatWarning: dataWithTAT.filter(r => r.tat.tatClass === 'tat-warning').length,
    tatOverdue: dataWithTAT.filter(r => r.tat.tatClass === 'tat-overdue').length
  };
  
  updateStatsDisplay(stats.pending, stats.tatNormal, stats.tatWarning, stats.tatOverdue);

  dataWithTAT.forEach(req => {
    const patient = req.patient || {};
    const patientName = `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim() || '-';
    const patientId = patient.patient_id || req.patient_id || '-';
    const hospitalId = patient.hospital_id || '-';
    const requestDate = req.request_date || req.created_at;
    const received = requestDate ? new Date(requestDate).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : '-';
    const testTarget = req.test_target || '-';
    const status = req.status || '-';
    const specimen = req.specimen || req.Specimen || '-';

    // Get status class and badge
    const statusLower = status.toLowerCase();
    let statusClass = 'pending';
    let statusBadgeClass = 'pending';
    let statusIcon = 'fa-clock';
    let statusText = 'Pending';
    
    if (statusLower === 'pending') {
      statusClass = 'status-pending';
      statusBadgeClass = 'pending';
      statusIcon = 'fa-clock';
      statusText = 'Pending';
    } else if (statusLower === 'need_2_confirmation' || statusLower === 'need 2 confirmation') {
      statusClass = 'status-need2';
      statusBadgeClass = 'need2';
      statusIcon = 'fa-hourglass-half';
      statusText = 'Need 2 confirm';
    } else if (statusLower === 'need_1_confirmation' || statusLower === 'need 1 confirmation') {
      statusClass = 'status-need1';
      statusBadgeClass = 'need1';
      statusIcon = 'fa-hourglass-end';
      statusText = 'Need 1 confirm';
    } else if (statusLower === 'done') {
      statusClass = 'status-done';
      statusBadgeClass = 'done';
      statusIcon = 'fa-check-circle';
      statusText = 'Done';
    }

    const card = document.createElement('div');
    card.className = `request-card ${statusClass} ${req.tat.tatClass}`;
    card.innerHTML = `
      <div class="request-card-header">
        <div class="request-id-badge">
          <i class="fas fa-hashtag"></i>
          ${req.request_id || '-'}
        </div>
        <div class="header-badges">
          ${req.tat.showTAT ? `
            <span class="tat-badge ${req.tat.tatClass}">
              <i class="fas ${req.tat.tatIcon}"></i>
              TAT ${req.tat.percentage}%
            </span>
          ` : ''}
          <span class="status-badge ${statusBadgeClass}">
            <i class="fas ${statusIcon}"></i>
            ${statusText}
          </span>
        </div>
      </div>
      
      <div class="request-card-body">
        <div class="request-info-row">
          <div class="request-info-icon">
            <i class="fas fa-user"></i>
          </div>
          <div class="request-info-content">
            <div class="request-info-label">ชื่อ - นามสกุล</div>
            <div class="request-info-value">${patientId} ${patientName}</div>
          </div>
        </div>
        
        <div class="request-info-row">
          <div class="request-info-icon">
            <i class="fas fa-hospital"></i>
          </div>
          <div class="request-info-content">
            <div class="request-info-label">Hospital</div>
            <div class="request-info-value">${hospitalId}</div>
          </div>
        </div>
        
        <div class="request-info-row">
          <div class="request-info-icon">
            <i class="fas fa-dna"></i>
          </div>
          <div class="request-info-content">
            <div class="request-info-label">การวินิจฉัย</div>
            <div class="request-info-value">${testTarget}</div>
          </div>
        </div>
        
        <div class="request-info-row">
          <div class="request-info-icon">
            <i class="fas fa-vial"></i>
          </div>
          <div class="request-info-content">
            <div class="request-info-label">ชนิดสิ่งส่งตรวจ</div>
            <div class="request-info-value">${specimen}</div>
          </div>
        </div>
        
        <div class="request-info-row">
          <div class="request-info-icon">
            <i class="fas fa-calendar"></i>
          </div>
          <div class="request-info-content">
            <div class="request-info-label">วันที่รับสิ่งส่งตรวจ</div>
            <div class="request-info-value">${received}</div>
          </div>
        </div>
      </div>
      
      <div class="request-card-footer">
        ${statusLower === 'pending' ? `
          <button class="request-action-btn primary" onclick="fillAlleles(${req.request_id})">
            <i class="fas fa-dna"></i>
            กรอก Alleles
          </button>
        ` : `
          <button class="request-action-btn secondary" disabled>
            <i class="fas ${statusIcon}"></i>
            ${statusText}
          </button>
        `}
      </div>
    `;
    
    grid.appendChild(card);
  });
}

/* ========= Stats Display (from current data) ========= */
function updateStatsDisplay(pending, tatNormal, tatWarning, tatOverdue) {
  const statPendingElem = document.getElementById('statPending');
  const statNormalElem = document.getElementById('statNormal');
  const statWarningElem = document.getElementById('statWarning');
  const statOverdueElem = document.getElementById('statOverdue');
  
  if (statPendingElem) statPendingElem.textContent = pending || 0;
  if (statNormalElem) statNormalElem.textContent = tatNormal || 0;
  if (statWarningElem) statWarningElem.textContent = tatWarning || 0;
  if (statOverdueElem) statOverdueElem.textContent = tatOverdue || 0;
}

/* ========= Stats (ดึงจาก API) ========= */
async function updateStatsFromAPI() {
  try {
    const allRequests = await window.electronAPI.getTestRequests();
    const pendingRequests = allRequests.filter(r => r.status?.toLowerCase() === 'pending');
    
    // Calculate TAT for pending requests
    let tatNormal = 0, tatWarning = 0, tatOverdue = 0;
    
    pendingRequests.forEach(req => {
      const specimen = req.specimen || req.Specimen || '-';
      const requestDate = req.request_date || req.created_at;
      const tat = calculateTAT(requestDate, specimen, req.status);
      
      if (tat.tatClass === 'tat-normal') tatNormal++;
      else if (tat.tatClass === 'tat-warning') tatWarning++;
      else if (tat.tatClass === 'tat-overdue') tatOverdue++;
    });
    
    updateStatsDisplay(pendingRequests.length, tatNormal, tatWarning, tatOverdue);
  } catch (e) {
    console.error('Error fetching stats:', e);
    updateStatsDisplay(0, 0, 0, 0);
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
    // Get the test request details with report
    const req = await window.electronAPI.getTestRequestById(requestId);
    if (!req) {
      alert('ไม่พบข้อมูล Test Request');
      return;
    }
    
    // Check if report exists and has PDF path
    if (req.report?.pdf_path) {
      // If there's a PDF URL from Supabase Storage
      alert(`เปิดไฟล์ PDF: ${req.report.pdf_path}`);
      // TODO: Implement actual PDF viewing/opening in browser
      // window.open(req.report.pdf_path, '_blank');
    } else if (req.report) {
      // Report exists but no PDF, regenerate with full report data
      const reportData = {
        name: patientName,
        age: req.patient?.age || '-',
        gender: req.patient?.gender || '-',
        hn: req.patient?.patient_id || '-',
        hospital: req.patient?.hospital_id || '-',
        testTarget: req.test_target || '-',
        specimen: req.Specimen || '-',
        // Add rulebase data from report
        genotype: req.report.genotype,
        predicted_phenotype: req.report.predicted_phenotype,
        recommendation: req.report.recommendation,
        genotype_summary: req.report.genotype_summary,
        // Parse alleles if stored as JSON string
        alleles: typeof req.alleles === 'string' ? JSON.parse(req.alleles) : (req.alleles || []),
        activityScore: req.activity_score || 'N/A'
      };
      
      const pdfPath = await window.electron.generatePDF(reportData);
      alert(`สร้าง PDF สำเร็จ: ${pdfPath}`);
    } else {
      // No report yet, can't generate PDF
      alert('ยังไม่มีรายงานผลการตรวจสำหรับ Test Request นี้');
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

// Function to fill alleles for pending request
window.fillAlleles = async function(requestId) {
  try {
    // Get request details
    const req = await window.electronAPI.getTestRequestById(requestId);
    if (!req) {
      alert('ไม่พบข้อมูล Test Request');
      return;
    }
    
    // Store request data in sessionStorage
    sessionStorage.setItem('selectedRequestId', requestId);
    sessionStorage.setItem('selectedPatientId', req.patient_id);
    sessionStorage.setItem('patientId', req.patient_id);
    sessionStorage.setItem('selectedDnaType', req.test_target);
    sessionStorage.setItem('selectedSpecimen', req.specimen);
    
    // Store patient info
    if (req.patient) {
      sessionStorage.setItem('patientName', `${req.patient.first_name} ${req.patient.last_name}`);
      sessionStorage.setItem('patientAge', req.patient.age || 'N/A');
      sessionStorage.setItem('patientGender', req.patient.gender || 'N/A');
      sessionStorage.setItem('patientHospital', req.patient.hospital_id || 'N/A');
    }
    
    // Navigate to allele input page
    window.electronAPI.navigate('fill_alleles_pharmacy');
  } catch (error) {
    console.error('❌ Error preparing allele input:', error);
    alert('เกิดข้อผิดพลาดในการเตรียมข้อมูล');
  }
}

// Function to verify test request
window.verifyTestRequest = function(requestId) {
  showPage('verify_pharmacy', requestId);
}

/* ========= Light/Dark toggle (ตัวอย่าง) ========= */

document.getElementById('langToggle')?.addEventListener('click', (e) => {
  e.target.textContent = e.target.textContent === 'TH' ? 'EN' : 'TH';
});
