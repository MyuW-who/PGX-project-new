const state = {
  cases: [],
  filteredCases: [],
  selectedCaseId: null,
  isThai: true,
  darkMode: false
};

const el = {
  searchInput: document.getElementById('searchInput'),
  tatFilter: document.getElementById('tatFilter'),
  caseTableBody: document.getElementById('caseTableBody'),
  caseTableEmpty: document.getElementById('caseTableEmpty'),
  countTotal: document.getElementById('countTotal'),
  countPre: document.getElementById('countPre'),
  countAnalytic: document.getElementById('countAnalytic'),
  countPost: document.getElementById('countPost'),
  patientDetail: document.getElementById('patientDetail'),
  detailName: document.getElementById('detailName'),
  detailMeta: document.getElementById('detailMeta'),
  patientBasicInfo: document.getElementById('patientBasicInfo'),
  detailNotes: document.getElementById('detailNotes'),
  tatTimeline: document.getElementById('tatTimeline'),
  genotypeRows: document.getElementById('genotypeRows'),
  cdsContent: document.getElementById('cdsContent'),
  tdmRows: document.getElementById('tdmRows'),
  reportList: document.getElementById('reportList'),
  consentList: document.getElementById('consentList'),
  auditLog: document.getElementById('auditLog'),
  addBtn: document.getElementById('addBtn'),
  patientModal: document.getElementById('patientModal'),
  closePatientModal: document.getElementById('closePatientModal'),
  cancelPatientModal: document.getElementById('cancelPatientModal'),
  patientForm: document.getElementById('patientForm'),
  saveAndPrintBtn: document.getElementById('saveAndPrintBtn'),
  closeDetailBtn: document.getElementById('closeDetailBtn'),
  printLabelBtn: document.getElementById('printLabelBtn'),
  generateReportBtn: document.getElementById('generateReportBtn'),
  createReportBtn: document.getElementById('createReportBtn'),
  viewHtmlReportBtn: document.getElementById('viewHtmlReportBtn'),
  addTdmBtn: document.getElementById('addTdmBtn'),
  addConsentBtn: document.getElementById('addConsentBtn'),
  themeToggle: document.getElementById('themeToggle'),
  langToggle: document.getElementById('langToggle'),
  dropdownBtn: document.getElementById('dropdownBtn'),
  dropdownMenu: document.getElementById('dropdownMenu'),
  scanBarcodeBtn: document.getElementById('scanBarcodeBtn'),
  scannerOverlay: document.getElementById('scannerOverlay'),
  scannerPreview: document.getElementById('scannerPreview'),
  closeScannerBtn: document.getElementById('closeScannerBtn')
};

let quaggaRunning = false;

/* ---------- INITIALIZATION ---------- */
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  loadCases();
});

async function loadCases() {
  try {
    const result = await window.electronAPI.invoke('fetch-cases');
    const cases = Array.isArray(result) ? result.map(normalizeCaseRecord) : [];
    state.cases = cases;
    state.filteredCases = [...cases];
    renderAll();
  } catch (error) {
    console.error('loadCases error:', error);
    state.cases = [];
    state.filteredCases = [];
    renderAll();
    alert('ไม่สามารถดึงข้อมูลผู้ป่วยได้');
  }
}

function normalizeCaseRecord(raw) {
  return {
    id: raw.id ?? '',
    hn: raw.hn ?? '',
    firstName: raw.firstName ?? '',
    lastName: raw.lastName ?? '',
    gender: raw.gender ?? '',
    dob: raw.dob ?? '',
    phone: raw.phone ?? '',
    doctor: raw.doctor ?? '',
    diagnosis: raw.diagnosis ?? '',
    sampleType: raw.sampleType ?? '',
    collectedAt: raw.collectedAt ?? '',
    createdAt: raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? '',
    tatStatus: raw.tatStatus ?? 'pre-analytic',
    notes: raw.notes ?? '',
    genotype: raw.genotype ?? [],
    cds: raw.cds ?? [],
    tdm: raw.tdm ?? [],
    reports: raw.reports ?? [],
    consents: raw.consents ?? [],
    auditLog: raw.auditLog ?? [],
    timeline: raw.timeline ?? []
  };
}

function bindEvents() {
  el.searchInput?.addEventListener('input', handleFilter);
  el.tatFilter?.addEventListener('change', handleFilter);
  el.closePatientModal?.addEventListener('click', closePatientModal);
  el.cancelPatientModal?.addEventListener('click', closePatientModal);
  el.patientModal?.addEventListener('click', evt => {
    if (evt.target === el.patientModal) closePatientModal();
  });
  el.patientForm?.addEventListener('submit', handlePatientSubmit);
  el.saveAndPrintBtn?.addEventListener('click', handleSaveAndPrint);
  el.closeDetailBtn?.addEventListener('click', hidePatientDetail);
  el.printLabelBtn?.addEventListener('click', handlePrintLabel);
  el.generateReportBtn?.addEventListener('click', handleGenerateReport);
  el.createReportBtn?.addEventListener('click', () => alert('ฟีเจอร์กำลังพัฒนา'));
  el.viewHtmlReportBtn?.addEventListener('click', () => alert('ฟีเจอร์กำลังพัฒนา'));
  el.addTdmBtn?.addEventListener('click', () => alert('ฟีเจอร์กำลังพัฒนา'));
  el.addConsentBtn?.addEventListener('click', () => alert('ฟีเจอร์กำลังพัฒนา'));
  el.themeToggle?.addEventListener('click', toggleTheme);
  el.langToggle?.addEventListener('click', toggleLanguage);
  el.dropdownBtn?.addEventListener('click', () => {
    el.dropdownMenu?.classList.toggle('show');
  });
  el.scanBarcodeBtn?.addEventListener('click', openScanner);
  el.closeScannerBtn?.addEventListener('click', closeScanner);
  el.scannerOverlay?.addEventListener('click', evt => {
    if (evt.target === el.scannerOverlay) closeScanner();
  });
  document.addEventListener('click', evt => {
    if (!el.dropdownBtn?.contains(evt.target)) {
      el.dropdownMenu?.classList.remove('show');
    }
  });
}

function renderAll() {
  renderSummary();
  renderCaseTable();
  if (state.selectedCaseId) {
    const selected = state.cases.find(c => c.id === state.selectedCaseId);
    if (selected) renderPatientDetail(selected);
  }
}

/* ---------- FILTERING & SEARCH ---------- */
function handleFilter() {
  const keyword = el.searchInput?.value.trim().toLowerCase() || '';
  const tat = el.tatFilter?.value || 'all';

  state.filteredCases = state.cases.filter(item => {
    const text = `${item.id} ${item.hn} ${item.firstName} ${item.lastName} ${item.diagnosis}`.toLowerCase();
    const matchesKeyword = keyword === '' || text.includes(keyword);
    const matchesTat = tat === 'all' || item.tatStatus === tat;
    return matchesKeyword && matchesTat;
  });

  renderCaseTable();
}

/* ---------- SUMMARY CARDS ---------- */
function renderSummary() {
  const total = state.cases.length;
  const pre = state.cases.filter(c => c.tatStatus === 'pre-analytic').length;
  const analytic = state.cases.filter(c => c.tatStatus === 'analytic').length;
  const post = state.cases.filter(c => c.tatStatus === 'post-analytic').length;

  if (el.countTotal) el.countTotal.textContent = total;
  if (el.countPre) el.countPre.textContent = pre;
  if (el.countAnalytic) el.countAnalytic.textContent = analytic;
  if (el.countPost) el.countPost.textContent = post;
}

/* ---------- TABLE RENDERING ---------- */
function renderCaseTable() {
  if (!el.caseTableBody) return;

  el.caseTableBody.innerHTML = '';
  const items = state.filteredCases;

  if (!items.length) {
    el.caseTableEmpty?.classList.remove('hidden');
    return;
  }

  el.caseTableEmpty?.classList.add('hidden');

  items.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${item.id}</strong>
        <div class="muted">HN: ${item.hn || '-'}</div>
      </td>
      <td>
        <strong>${item.firstName} ${item.lastName}</strong>
        <div class="muted">${item.diagnosis || '-'}</div>
      </td>
      <td>${formatDate(item.collectedAt) || '-'}</td>
      <td>${formatDateTime(item.updatedAt) || '-'}</td>
      <td>
        <span class="badge badge-${item.tatStatus}">
          ${tatLabel(item.tatStatus)}
        </span>
      </td>
      <td class="table-actions">
        <button class="btn ghost btn-sm" data-action="view" data-id="${item.id}">
          <i class="fa fa-eye"></i>
          ดูรายละเอียด
        </button>
      </td>
    `;
    tr.addEventListener('click', evt => {
      const target = evt.target;
      if (target instanceof HTMLElement && target.dataset.action === 'view') {
        selectCase(item.id);
      } else if (target instanceof HTMLElement && target.closest('button[data-action="view"]')) {
        selectCase(item.id);
      }
    });
    el.caseTableBody.appendChild(tr);
  });
}

/* ---------- DETAIL PANEL ---------- */
function selectCase(caseId) {
  state.selectedCaseId = caseId;
  const selected = state.cases.find(c => c.id === caseId);
  if (!selected) return;
  renderPatientDetail(selected);
  el.patientDetail?.classList.remove('hidden');
  scrollIntoView(el.patientDetail);
}

function renderPatientDetail(item) {
  if (!el.detailName) return;

  el.detailName.textContent = `${item.firstName} ${item.lastName}`;
  el.detailMeta.textContent = `Case ID: ${item.id} • HN: ${item.hn} • ${tatLabel(item.tatStatus)}`;

  renderBasicInfo(item);
  renderTimeline(item.timeline);
  renderGenotype(item.genotype);
  renderCds(item.cds);
  renderTdm(item.tdm);
  renderReports(item.reports);
  renderConsents(item.consents);
  renderAuditLog(item.auditLog);
  el.detailNotes.textContent = item.notes || 'ไม่มีหมายเหตุ';
}

function hidePatientDetail() {
  state.selectedCaseId = null;
  el.patientDetail?.classList.add('hidden');
}

/* ---------- DETAIL SUB-SECTIONS ---------- */
function renderBasicInfo(item) {
  if (!el.patientBasicInfo) return;
  el.patientBasicInfo.innerHTML = `
    <li><span>HN</span><strong>${item.hn || '-'}</strong></li>
    <li><span>เพศ</span><strong>${item.gender || '-'}</strong></li>
    <li><span>วันเกิด</span><strong>${formatDate(item.dob) || '-'}</strong></li>
    <li><span>อายุ</span><strong>${calcAge(item.dob)}</strong></li>
    <li><span>แพทย์ผู้ดูแล</span><strong>${item.doctor || '-'}</strong></li>
    <li><span>เบอร์ติดต่อ</span><strong>${item.phone || '-'}</strong></li>
    <li><span>การวินิจฉัย</span><strong>${item.diagnosis || '-'}</strong></li>
    <li><span>ประเภทสิ่งส่งตรวจ</span><strong>${item.sampleType || '-'}</strong></li>
    <li><span>วันที่รับสิ่งส่งตรวจ</span><strong>${formatDate(item.collectedAt) || '-'}</strong></li>
  `;
}

function renderTimeline(timeline = []) {
  if (!el.tatTimeline) return;
  if (!timeline.length) {
    el.tatTimeline.innerHTML = `<li class="timeline-empty">ยังไม่มีข้อมูล Timeline</li>`;
    return;
  }

  el.tatTimeline.innerHTML = timeline
    .map(
      step => `
      <li class="timeline-item status-${step.status}">
        <header>
          <strong>${step.label}</strong>
          <span>${formatDate(step.date)}</span>
        </header>
        <p>${step.description || ''}</p>
      </li>
    `
    )
    .join('');
}

function renderGenotype(genotype = []) {
  if (!el.genotypeRows) return;
  if (!genotype.length) {
    el.genotypeRows.innerHTML = `
      <tr><td colspan="3" class="muted">ยังไม่มีผล Genotype</td></tr>
    `;
    return;
  }

  el.genotypeRows.innerHTML = genotype
    .map(
      row => `
      <tr>
        <td>${row.gene}</td>
        <td>${row.allele}</td>
        <td>${row.phenotype}</td>
      </tr>
    `
    )
    .join('');
}

function renderCds(cds = []) {
  if (!el.cdsContent) return;
  if (!cds.length) {
    el.cdsContent.innerHTML = `<p class="muted">ยังไม่มีคำแนะนำ</p>`;
    return;
  }

  el.cdsContent.innerHTML = cds
    .map(
      item => `
      <article class="cds-item">
        <header>
          <h5>${item.title}</h5>
        </header>
        <p><strong>คำแนะนำ:</strong> ${item.recommendation}</p>
        <p class="muted"><strong>เหตุผล:</strong> ${item.rationale}</p>
      </article>
    `
    )
    .join('');
}

function renderTdm(tdm = []) {
  if (!el.tdmRows) return;
  if (!tdm.length) {
    el.tdmRows.innerHTML = `<tr><td colspan="5" class="muted">ยังไม่มีข้อมูล TDM</td></tr>`;
    return;
  }

  el.tdmRows.innerHTML = tdm
    .map(
      row => `
      <tr>
        <td>${row.drug}</td>
        <td>${formatDate(row.date)}</td>
        <td>${row.value}</td>
        <td>${row.target || '-'}</td>
        <td>${row.action || '-'}</td>
      </tr>
    `
    )
    .join('');
}

function renderReports(reports = []) {
  if (!el.reportList) return;
  if (!reports.length) {
    el.reportList.innerHTML = `<li class="muted">ยังไม่มีรายงาน</li>`;
    return;
  }

  el.reportList.innerHTML = reports
    .map(
      report => `
      <li>
        <div>
          <strong>${report.title}</strong>
          <div class="muted">สร้างเมื่อ ${formatDateTime(report.createdAt)}</div>
        </div>
        <button class="btn ghost btn-sm" data-url="${report.url}">
          <i class="fa fa-download"></i>
          ดาวน์โหลด
        </button>
      </li>
    `
    )
    .join('');

  el.reportList.querySelectorAll('button[data-url]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      if (!url || url === '#') {
        alert('ยังไม่มีไฟล์รายงาน');
        return;
      }
      window.open(url, '_blank');
    });
  });
}

function renderConsents(consents = []) {
  if (!el.consentList) return;
  if (!consents.length) {
    el.consentList.innerHTML = `<li class="muted">ยังไม่มี e-Consent</li>`;
    return;
  }

  el.consentList.innerHTML = consents
    .map(
      consent => `
      <li>
        <div>
          <strong>${consent.title}</strong>
          <div class="muted">ลงนามเมื่อ ${formatDate(consent.signedAt)} • ${consent.status}</div>
        </div>
        <button class="btn ghost btn-sm" data-url="${consent.url}">
          <i class="fa fa-eye"></i>
          เปิดดู
        </button>
      </li>
    `
    )
    .join('');

  el.consentList.querySelectorAll('button[data-url]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      if (!url || url === '#') {
        alert('ยังไม่มีไฟล์ e-Consent');
        return;
      }
      window.open(url, '_blank');
    });
  });
}

function renderAuditLog(logs = []) {
  if (!el.auditLog) return;
  if (!logs.length) {
    el.auditLog.innerHTML = `<li class="muted">ยังไม่มี Log</li>`;
    return;
  }

  el.auditLog.innerHTML = logs
    .map(
      log => `
      <li>
        <strong>${log.actor}</strong> • ${log.action}
        <div class="muted">${formatDateTime(log.timestamp)}</div>
      </li>
    `
    )
    .join('');
}

/* ---------- PATIENT MODAL ---------- */
function openPatientModal() {
  el.patientModal?.classList.remove('hidden');
  el.patientModal?.setAttribute('aria-hidden', 'false');
  el.patientForm?.reset();
}

function closePatientModal() {
  el.patientModal?.classList.add('hidden');
  el.patientModal?.setAttribute('aria-hidden', 'true');
}

function handlePatientSubmit(evt) {
  evt.preventDefault();
  if (!el.patientForm) return;

  const formData = new FormData(el.patientForm);
  const now = new Date();
  const newCase = {
    id: generateCaseId(),
    hn: formData.get('hn') || '',
    firstName: formData.get('firstName') || '',
    lastName: formData.get('lastName') || '',
    gender: formData.get('gender') || '',
    dob: formData.get('dob') || '',
    phone: formData.get('phone') || '',
    doctor: formData.get('doctor') || '',
    diagnosis: formData.get('diagnosis') || '',
    sampleType: formData.get('sampleType') || '',
    collectedAt: formData.get('collectedAt') || '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    tatStatus: formData.get('tatStatus') || 'pre-analytic',
    notes: formData.get('notes') || '',
    genotype: [],
    cds: [],
    tdm: [],
    reports: [],
    consents: [],
    auditLog: [
      {
        id: `LOG-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        actor: 'Admin',
        action: 'สร้างเคสใหม่',
        timestamp: now.toISOString()
      }
    ],
    timeline: [
      {
        status: formData.get('tatStatus') || 'pre-analytic',
        label: tatLabel(formData.get('tatStatus') || 'pre-analytic'),
        date: formData.get('collectedAt') || formatISODate(now),
        description: 'สร้างรายการเคส'
      }
    ]
  };

  state.cases.unshift(newCase);
  state.filteredCases = [...state.cases];

  closePatientModal();
  renderAll();
  selectCase(newCase.id);
  alert('บันทึกข้อมูลผู้ป่วยสำเร็จ');
}

function handleSaveAndPrint() {
  alert('บันทึกและพิมพ์ใบสั่งตรวจ (PDF) จะพร้อมใช้งานเร็ว ๆ นี้');
}

function handlePrintLabel() {
  const selected = getSelectedCase();
  if (!selected) {
    alert('กรุณาเลือกผู้ป่วย');
    return;
  }
  alert(`กำลังพิมพ์ฉลากสำหรับ ${selected.id} / ${selected.firstName} ${selected.lastName}`);
}

function handleGenerateReport() {
  const selected = getSelectedCase();
  if (!selected) {
    alert('กรุณาเลือกผู้ป่วย');
    return;
  }
  alert(`สร้างรายงานสำหรับ ${selected.id}`);
}

function openScanner() {
  if (!window.Quagga) {
    alert('ไม่พบโมดูลสแกนบาร์โค้ด');
    return;
  }
  el.scannerOverlay?.classList.remove('hidden');
  el.scannerOverlay?.setAttribute('aria-hidden', 'false');
  startQuagga();
}

function closeScanner() {
  if (quaggaRunning && window.Quagga) {
    Quagga.offDetected(onBarcodeDetected);
    Quagga.stop();
  }
  quaggaRunning = false;
  el.scannerOverlay?.classList.add('hidden');
  el.scannerOverlay?.setAttribute('aria-hidden', 'true');
}

function startQuagga() {
  if (quaggaRunning) return;
  Quagga.init(
    {
      inputStream: {
        type: 'LiveStream',
        target: el.scannerPreview,
        constraints: { facingMode: 'environment' }
      },
      decoder: { readers: ['code_128_reader', 'code_39_reader', 'ean_reader', 'ean_13_reader'] }
    },
    err => {
      if (err) {
        console.error(err);
        alert('ไม่สามารถเปิดกล้องได้');
        closeScanner();
        return;
      }
      Quagga.start();
      quaggaRunning = true;
      Quagga.onDetected(onBarcodeDetected);
    }
  );
}

function onBarcodeDetected(result) {
  const code = result?.codeResult?.code?.trim();
  if (!code) return;
  closeScanner();
  const matched = state.cases.find(
    item =>
      item.id.toLowerCase() === code.toLowerCase() ||
      item.hn.toLowerCase() === code.toLowerCase()
  );
  if (!matched) {
    alert(`ไม่พบเคสที่ตรงกับบาร์โค้ด: ${code}`);
    return;
  }
  selectCase(matched.id);
  scrollIntoView(el.patientDetail);
}

/* ---------- THEME & LANGUAGE ---------- */
function toggleTheme() {
  state.darkMode = !state.darkMode;
  document.body.classList.toggle('dark-mode', state.darkMode);
  if (el.themeToggle) {
    el.themeToggle.innerHTML = state.darkMode
      ? '<i class="fa fa-sun"></i>'
      : '<i class="fa fa-moon"></i>';
  }
}

function toggleLanguage() {
  state.isThai = !state.isThai;
  if (el.langToggle) {
    el.langToggle.textContent = state.isThai ? 'TH' : 'EN';
  }
  alert('การสลับภาษายังอยู่ในระหว่างพัฒนา');
}

/* ---------- UTILITIES ---------- */
function tatLabel(status) {
  switch (status) {
    case 'pre-analytic':
      return 'Pre-analytic';
    case 'analytic':
      return 'Analytic';
    case 'post-analytic':
      return 'Post-analytic';
    default:
      return status;
  }
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function calcAge(dob) {
  if (!dob) return '-';
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return '-';
  const diff = Date.now() - birth.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970) + ' ปี';
}

function generateCaseId() {
  const prefix = 'PGX';
  const number = (state.cases.length + 1).toString().padStart(4, '0');
  return `${prefix}-${number}`;
}

function getSelectedCase() {
  if (!state.selectedCaseId) return null;
  return state.cases.find(c => c.id === state.selectedCaseId) || null;
}

function scrollIntoView(element) {
  if (!element) return;
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatISODate(date) {
  return date instanceof Date ? date.toISOString().slice(0, 10) : '';
}

