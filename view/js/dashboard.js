/* ============================================================
   📊 DASHBOARD SCRIPT
   ============================================================ */

let chartInstances = {};

/* ============================================================
   🚀 INITIALIZATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // 1. 🔑 เรียกใช้สคริปต์หลัก (จาก userProfile.js)
  //    (Dashboard อาจไม่ต้องการ Auth แต่ต้องใช้ Header/Dropdown/Settings)
  window.initializeUserProfile();

  // 2. 📊 วาดกราฟและ Metrics (โค้ดเฉพาะของหน้านี้)
  if (hasDashboard) {
    renderMetrics();
    initializeUsageChart();
    initializeTatDonut();
    initializeKpiGauge();
    initializeErrorRateChart();
    initializeTopRejectsChart();
    initializeTopDnaChart();
    initializeTopHospitalsChart();
    
    // 3. 🎨 อัปเดตธีมกราฟครั้งแรกตอนโหลด
    updateChartsForTheme();
  }
});

// 4. 🌙 เพิ่ม Listener รอรับ Event จาก darkmode.js
window.addEventListener('themeChanged', (e) => {
  console.log('Theme changed, updating charts...');
  updateChartsForTheme();
});


/* ============================================================
   7️⃣ MOCK DATA & DASHBOARD WIDGETS (โค้ดเดิมของหน้านี้)
   ------------------------------------------------------------
   ▶️ ข้อมูลจำลอง + วาดกราฟ 3 แบบ: Line, Donut TAT, Gauge KPI
============================================================ */

// ฟังก์ชันอัปเดตสีกราฟ
function updateChartsForTheme() {
  const isDark = document.body.classList.contains('dark');
  const textColor = isDark ? '#f1f5f9' : '#111827';
  const gridColor = isDark ? '#334155' : '#e5e7eb';
  const bgCard = isDark ? '#2f2f40' : '#ffffff';

  Object.values(chartInstances).forEach(chart => {
    if (chart.options.scales && chart.options.scales.x && chart.options.scales.y) {
      chart.options.scales.x.grid.color = gridColor;
      chart.options.scales.y.grid.color = gridColor;
      chart.options.scales.x.ticks.color = textColor;
      chart.options.scales.y.ticks.color = textColor;
    }
    if (chart.options.plugins && chart.options.plugins.legend) {
      chart.options.plugins.legend.labels.color = textColor;
    }
  });

  document.querySelectorAll('.stat-card, .metric-card').forEach(el => {
    el.style.background = bgCard;
  });
  
  if (chartInstances.gaugeChart) {
    chartInstances.gaugeChart.data.datasets[0].backgroundColor[1] = isDark ? '#3b3b4a' : '#e9eef6';
  }

  // อัปเดตกราฟทั้งหมด
  Object.values(chartInstances).forEach(chart => {
    chart.update();
  });
}

// ใช้เฉพาะในหน้า Dashboard เท่านั้น
const hasDashboard = !!document.getElementById('usageChart') || !!document.getElementById('tatDonut') || !!document.getElementById('kpiGauge');

// ── 1) ข้อมูลจำลอง ───────────────────────────────────────
const mockData = {
  totals: { today: 128, inProgress: 23, done: 98, error: 7 },
  line: {
    daily: { labels: ['00:00','04:00','08:00','12:00','16:00','20:00'], values: [12, 25, 40, 60, 50, 30] },
    weekly: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], values: [120, 150, 170, 160, 180, 90, 140] }
  },
  tat: { inSLA: 68, inProgress: 23, overSLA: 9 },
  kpi: { rejectionRate: 2.4 }, // %
  errorRate: {
    week: { labels: ['วันนี้-6','วันนี้-5','วันนี้-4','วันนี้-3','วันนี้-2','เมื่อวาน','วันนี้'], values: [3.2, 2.8, 4.1, 3.5, 2.9, 3.8, 2.4] },
    month: { labels: ['สัปดาห์ 1','สัปดาห์ 2','สัปดาห์ 3','สัปดาห์ 4'], values: [3.5, 3.2, 4.0, 2.8] }
  },
  topRejects: { labels: ['เลือด EDTA', 'Serum', 'ปัสสาวะ', 'Swab (NP/OP)', 'น้ำลาย'], values: [34, 27, 19, 15, 11] },
  topDNA: { labels: ['BRCA1', 'BRCA2', 'EGFR', 'KRAS', 'TP53'], values: [125, 112, 98, 87, 76] },
  topHospitals: { labels: ['โรงพยาบาลศูนย์ A', 'โรงพยาบาลมหาวิทยาลัย B', 'โรงพยาบาลจังหวัด C', 'โรงพยาบาลเอกชน D', 'โรงพยาบาลชุมชน E'], values: [320, 295, 244, 210, 188] }
};

// ── 2) กล่องตัวเลขด้านบน ────────────────────────────────
function renderMetrics() {
  const elTotal = document.getElementById('m-total');
  const elProg  = document.getElementById('m-progress');
  const elDone  = document.getElementById('m-done');
  const elErr   = document.getElementById('m-error');
  const elPercentTotal = document.getElementById('percent-total');
  const elPercentProg  = document.getElementById('percent-progress');
  const elPercentDone  = document.getElementById('percent-done');
  const elPercentErr   = document.getElementById('percent-error');
  
  const total = mockData.totals.today;
  const progress = mockData.totals.inProgress;
  const done = mockData.totals.done;
  const error = mockData.totals.error;
  
  if (elTotal) elTotal.textContent = total;
  if (elProg)  elProg.textContent  = progress;
  if (elDone)  elDone.textContent  = done;
  if (elErr)   elErr.textContent   = error;
  
  if (elPercentTotal) elPercentTotal.textContent = '100.00%';
  if (elPercentProg)  elPercentProg.textContent  = total > 0 ? ((progress / total) * 100).toFixed(2) + '%' : '0.00%';
  if (elPercentDone)  elPercentDone.textContent  = total > 0 ? ((done / total) * 100).toFixed(2) + '%' : '0.00%';
  if (elPercentErr)   elPercentErr.textContent   = total > 0 ? ((error / total) * 100).toFixed(2) + '%' : '0.00%';
}

// ── 3) กราฟเส้น Usage (รายวัน/รายสัปดาห์) ───────────────
function initializeUsageChart() {
  const usageCanvas = document.getElementById('usageChart');
  if (usageCanvas && window.Chart) {
    const ctx = usageCanvas.getContext('2d');
    chartInstances.usageChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: mockData.line.daily.labels,
        datasets: [{
          label: 'จำนวนเคส',
          data: mockData.line.daily.values,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          tension: 0.3,
          fill: true,
          pointRadius: 3
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    document.querySelectorAll('[data-range]').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.closest('.toggle-group');
        group?.querySelectorAll('[data-range]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const range = btn.dataset.range;
        if (!range) return;
        const data = mockData.line[range];
        if (!data) return;
        chartInstances.usageChart.data.labels = data.labels;
        chartInstances.usageChart.data.datasets[0].data = data.values;
        chartInstances.usageChart.update();
        const subtitle = document.getElementById('usage-subtitle');
        if (subtitle) subtitle.textContent = `สรุป: ราย${range === 'daily' ? 'วัน' : 'สัปดาห์'}`;
      });
    });
  }
}

// ── 4) Donut ติดตาม TAT ─────────────────────────────────
function initializeTatDonut() {
  const tatCanvas = document.getElementById('tatDonut');
  if (tatCanvas && window.Chart) {
    const total = mockData.tat.inSLA + mockData.tat.inProgress + mockData.tat.overSLA;
    const tatCenterText = {
      id: 'tatCenterText',
      afterDraw(chart) {
        const {ctx, chartArea} = chart;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;
        const isDark = document.body.classList.contains('dark');
        
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 28px "Noto Sans Thai", sans-serif';
        ctx.fillStyle = isDark ? '#ecf0f1' : '#333';
        ctx.fillText(total, centerX, centerY - 8);
        ctx.font = '13px "Noto Sans Thai", sans-serif';
        ctx.fillStyle = isDark ? '#94a3b8' : '#666';
        ctx.fillText('เคสทั้งหมด', centerX, centerY + 14);
        ctx.restore();
      }
    };

    const ctx = tatCanvas.getContext('2d');
    chartInstances.tatChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['ปกติ (ใน SLA)', 'กำลังดำเนินการ', 'เสี่ยงเกิน SLA'],
        datasets: [{
          data: [mockData.tat.inSLA, mockData.tat.inProgress, mockData.tat.overSLA],
          backgroundColor: ['#16a34a', '#2563eb', '#dc2626'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.label}: ${c.parsed}` } }
        }
      },
      plugins: [tatCenterText]
    });
  }
}

// ── 5) Gauge KPI (Semi Donut) ────────────────────────────
function initializeKpiGauge() {
  const gaugeCanvas = document.getElementById('kpiGauge');
  if (gaugeCanvas && window.Chart) {
    const rate = mockData.kpi.rejectionRate;
    const rateText = document.getElementById('rejectionRateText');
    if (rateText) rateText.textContent = rate + '%';

    const centerText = {
      id: 'centerText',
      afterDraw(chart) {
        const arc = chart.getDatasetMeta(0)?.data?.[0];
        if (!arc) return;
        const isDark = document.body.classList.contains('dark');
        const {ctx} = chart;
        ctx.save();
        ctx.font = 'bold 24px "Noto Sans Thai", sans-serif';
        ctx.fillStyle = isDark ? '#ecf0f1' : '#333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${rate}%`, arc.x, arc.y + 5);
        ctx.restore();
      }
    };

    const isDark = document.body.classList.contains('dark');
    const ctx = gaugeCanvas.getContext('2d');
    chartInstances.gaugeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['อัตราปฏิเสธ', 'ส่วนที่เหลือ'],
        datasets: [{
          data: [rate, 100 - rate],
          backgroundColor: ['#dc2626', isDark ? '#3b3b4a' : '#e9eef6'],
          borderWidth: 0
        }]
      },
      options: {
        circumference: 180,
        rotation: -90,
        cutout: '70%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      },
      plugins: [centerText]
    });
  }
}

// ── 6) Error Rate Line Chart ──────────────────────────
function initializeErrorRateChart() {
  const errorCanvas = document.getElementById('errorRateChart');
  if (errorCanvas && window.Chart) {
    const ctx = errorCanvas.getContext('2d');
    chartInstances.errorRateChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: mockData.errorRate.week.labels,
        datasets: [{
          label: 'อัตราการปฏิเสธ (%)',
          data: mockData.errorRate.week.values,
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#dc2626'
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: (value) => value + '%' } } }
      }
    });

    document.querySelectorAll('[data-error-range]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-error-range]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const range = btn.dataset.errorRange;
        const data = mockData.errorRate[range];
        chartInstances.errorRateChart.data.labels = data.labels;
        chartInstances.errorRateChart.data.datasets[0].data = data.values;
        chartInstances.errorRateChart.update();
        const subtitle = document.getElementById('error-subtitle');
        if (subtitle) subtitle.textContent = `สรุป: ${range === 'week' ? '7 วันล่าสุด' : '30 วันล่าสุด'}`;
      });
    });
  }
}

// ── 7) Top 5 Rejected Specimens (Horizontal Bar) ────────
function initializeTopRejectsChart() {
  const topRejectsCanvas = document.getElementById('topRejectsChart');
  if (topRejectsCanvas && window.Chart) {
    const ctx = topRejectsCanvas.getContext('2d');
    const colors = mockData.topRejects.values.map(() => 'rgba(220, 38, 38, 0.9)');
    const bgColors = mockData.topRejects.values.map(() => 'rgba(220, 38, 38, 0.18)');

    chartInstances.topRejectsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: mockData.topRejects.labels,
        datasets: [{
          label: 'จำนวนที่ถูกปฏิเสธ',
          data: mockData.topRejects.values,
          backgroundColor: bgColors,
          borderColor: colors,
          borderWidth: 1.5,
          borderRadius: 8,
          barPercentage: 0.7,
          categoryPercentage: 0.7
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x} เคส` } } },
        scales: { x: { beginAtZero: true }, y: { ticks: { font: { weight: '600' } } } }
      }
    });
  }
}

// ── 8) Top 5 DNA Most Found (Horizontal Bar) ────────────
function initializeTopDnaChart() {
  const topDnaCanvas = document.getElementById('topDnaChart');
  if (topDnaCanvas && window.Chart) {
    const ctx = topDnaCanvas.getContext('2d');
    const colors = mockData.topDNA.values.map(() => 'rgba(34, 197, 94, 0.9)');
    const bgColors = mockData.topDNA.values.map(() => 'rgba(34, 197, 94, 0.18)');

    chartInstances.topDnaChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: mockData.topDNA.labels,
        datasets: [{
          label: 'จำนวนครั้งที่พบ',
          data: mockData.topDNA.values,
          backgroundColor: bgColors,
          borderColor: colors,
          borderWidth: 1.5,
          borderRadius: 8,
          barPercentage: 0.7,
          categoryPercentage: 0.7
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x} ครั้ง` } } },
        scales: { x: { beginAtZero: true }, y: { ticks: { font: { weight: '600' } } } }
      }
    });
  }
}

// ── 9) Top 5 Hospitals by Submissions (Horizontal Bar) ─
function initializeTopHospitalsChart() {
  const topHospitalsCanvas = document.getElementById('topHospitalsChart');
  if (topHospitalsCanvas && window.Chart) {
    const ctx = topHospitalsCanvas.getContext('2d');
    const colors = mockData.topHospitals.values.map(() => 'rgba(37, 99, 235, 0.9)');
    const bgColors = mockData.topHospitals.values.map(() => 'rgba(37, 99, 235, 0.18)');

    chartInstances.topHospitalsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: mockData.topHospitals.labels,
        datasets: [{
          label: 'จำนวนส่งตรวจ',
          data: mockData.topHospitals.values,
          backgroundColor: bgColors,
          borderColor: colors,
          borderWidth: 1.5,
          borderRadius: 8,
          barPercentage: 0.7,
          categoryPercentage: 0.7
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x} เคส` } } },
        scales: { x: { beginAtZero: true }, y: { ticks: { font: { weight: '600' } } } }
      }
    });
  }
}