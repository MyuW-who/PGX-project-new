/* ============================================================
   1️⃣ THEME SWITCHER (โหมดสว่าง / โหมดมืด)
   ------------------------------------------------------------
   ▶️ เปลี่ยนธีมของหน้าเว็บทั้งหมดระหว่าง Light ↔ Dark
============================================================ */
let chartInstances = {};



/* ============================================================
   2️⃣ LANGUAGE TOGGLE (สลับภาษา TH / EN)
   ------------------------------------------------------------
   ▶️ ปุ่มเปลี่ยนข้อความใน UI ระหว่างภาษาไทย ↔ อังกฤษ
============================================================ */
const langBtn = document.getElementById("langToggle");
langBtn?.addEventListener("click", () => {
  langBtn.textContent = langBtn.textContent === "TH" ? "EN" : "TH";
});

/* ============================================================
   6️⃣ USER DROPDOWN MENU (เมนูผู้ใช้)
   ------------------------------------------------------------
   ▶️ เปิด/ปิดเมนูผู้ใช้ (Profile / Setting / Logout)
============================================================ */
const dropdownBtn = document.getElementById("dropdownBtn");
const dropdownMenu = document.getElementById("dropdownMenu");

// 🔹 เปิด/ปิด dropdown เมื่อกดปุ่ม
dropdownBtn?.addEventListener("click", (e) => {
  e.stopPropagation(); // ป้องกัน event ปิด dropdown ซ้อนกัน
  dropdownMenu.classList.toggle("show");
});

// 🔹 ปิด dropdown เมื่อคลิกนอกพื้นที่
window.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown")) {
    dropdownMenu?.classList.remove("show");
  }
});


// -------- Logout ------------
document.getElementById('logout')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.electronAPI.navigate('login');
});

const patientPageBtn = document.getElementById('patient-btn');
patientPageBtn?.addEventListener('click', () => {
  window.electronAPI.navigate('patient');
});



/* ============================================================
   7️⃣ MOCK DATA & DASHBOARD WIDGETS (ยังคงสไตล์เดิม)
   ------------------------------------------------------------
   ▶️ ข้อมูลจำลอง + วาดกราฟ 3 แบบ: Line, Donut TAT, Gauge KPI
============================================================ */

const isDark = document.body.classList.contains('dark');

// ฟังก์ชันอัปเดตสีกราฟ
function updateChartsForTheme() {
  const isDark = document.body.classList.contains('dark');
  const textColor = isDark ? '#f1f5f9' : '#111827';
  const gridColor = isDark ? '#334155' : '#e5e7eb';
  const bgCard = isDark ? '#2f2f40' : '#ffffff';

  Object.values(chartInstances).forEach(chart => {

    // ✅ 1. ตรวจสอบก่อนว่ากราฟมีแกน (scales) หรือไม่
    if (chart.options.scales && chart.options.scales.x && chart.options.scales.y) {
      // ✅ 2. ถ้ามี ค่อยเข้าไปเปลี่ยนสีของแกน
      chart.options.scales.x.grid.color = gridColor;
      chart.options.scales.y.grid.color = gridColor;
      chart.options.scales.x.ticks.color = textColor;
      chart.options.scales.y.ticks.color = textColor;
    }

    // ✅ 3. เปลี่ยนสีของ Legend (ถ้ามี)
    if (chart.options.plugins && chart.options.plugins.legend) {
      chart.options.plugins.legend.labels.color = textColor;
    }

    

  });

  

  // เปลี่ยนพื้นหลังการ์ด (กรณีใช้ canvas อยู่บน card)
  document.querySelectorAll('.stat-card, .metric-card').forEach(el => {
    el.style.background = bgCard;
  });

  
  
  // อัปเดต TAT Donut
  if (chartInstances.tatChart) {
    chartInstances.tatChart.update();
  }
  
  // อัปเดต Gauge
  if (chartInstances.gaugeChart) {
    chartInstances.gaugeChart.data.datasets[0].backgroundColor[1] = isDark ? '#3b3b4a' : '#e9eef6';
    chartInstances.gaugeChart.update();
  }

  // อัปเดต Error Rate Chart
  if (chartInstances.errorRateChart) {
    chartInstances.errorRateChart.update();
  }

  // อัปเดต Top Rejects Chart
  if (chartInstances.topRejectsChart) {
    chartInstances.topRejectsChart.update();
  }

  // อัปเดต Top DNA Chart
  if (chartInstances.topDnaChart) {
    chartInstances.topDnaChart.update();
  }

  // อัปเดต Top Hospitals Chart
  if (chartInstances.topHospitalsChart) {
    chartInstances.topHospitalsChart.update();
  }

  Object.values(chartInstances).forEach(chart => {
    chart.update();
  });
}




// ใช้เฉพาะในหน้า Dashboard เท่านั้น (กัน error ถ้า element ไม่มี)
const hasDashboard = !!document.getElementById('usageChart') || !!document.getElementById('tatDonut') || !!document.getElementById('kpiGauge');

if (hasDashboard) {
  // Current time filter
  let currentTimeFilter = 'today';
  
  // ── Function to fetch and calculate real data ───────────────────
  async function fetchRealData(timeFilter = 'today') {
    try {
      const testRequests = await window.electronAPI.getTestRequests();
      const stats = await window.electronAPI.getTestRequestStats(timeFilter);
      const specimenSLA = await window.electronAPI.getSpecimenSLA();
      
      console.log('📊 Dashboard Data:', { testRequests, stats, specimenSLA });
      
      // Calculate totals
      const allCases = stats.all || 0;
      const doneCases = stats.done || 0;
      const rejectedCases = stats.reject || 0;
      const need1 = stats.need1 || 0;
      const need2 = stats.need2 || 0;
      const inProgressCases = need1 + need2;
      
      // Calculate TAT breakdown based on specimen-specific SLA
      // Green: Done cases + cases under 80% SLA
      // Blue: 80-100% SLA (warning zone)
      // Red: >100% SLA (overdue)
      let doneInSLA = 0, warning80to100 = 0, overdue100 = 0;
      
      testRequests.forEach(req => {
        const statusLower = (req.status || '').toLowerCase();
        
        // Skip rejected cases
        if (statusLower === 'reject') {
          return;
        }
        
        // Done cases count as in SLA
        if (statusLower === 'done') {
          doneInSLA++;
          return;
        }
        
        // Get SLA hours for this specimen type
        const specimenName = (req.Specimen || '').toLowerCase();
        const slaHours = specimenSLA[specimenName] || specimenSLA[req.Specimen] || 72; // Default 72 hours
        const warning80Threshold = slaHours * 0.8;
        
        // For in-progress cases, check TAT
        const requestDate = new Date(req.request_date || req.created_at);
        const now = new Date();
        const elapsedHours = (now - requestDate) / (1000 * 60 * 60);
        
        if (elapsedHours > slaHours) {
          // Over 100% SLA - RED
          overdue100++;
        } else if (elapsedHours > warning80Threshold) {
          // 80-100% SLA - BLUE
          warning80to100++;
        } else {
          // Under 80% SLA - GREEN
          doneInSLA++;
        }
      });
      
      // Calculate rejection rate (as number, not string)
      const rejectionRate = allCases > 0 ? parseFloat(((rejectedCases / allCases) * 100).toFixed(2)) : 0;
      
      return {
        totals: {
          today: allCases,
          inProgress: inProgressCases,
          done: doneCases,
          error: rejectedCases
        },
        tat: {
          doneInSLA: doneInSLA,
          warning80to100: warning80to100,
          overdue100: overdue100
        },
        kpi: {
          rejectionRate: parseFloat(rejectionRate)
        },
        testRequests: testRequests
      };
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      return null;
    }
  }
  
  // ── 1) Real Data from API ───────────────────────────────────────
  let realData = {
    totals: { today: 0, inProgress: 0, done: 0, error: 0 },
    line: {
      daily: {
        labels: ['00:00','04:00','08:00','12:00','16:00','20:00'],
        values: [0, 0, 0, 0, 0, 0]
      },
      weekly: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        values: [0, 0, 0, 0, 0, 0, 0]
      }
    },
    tat: { doneInSLA: 0, warning80to100: 0, overdue100: 0 },
    kpi: { rejectionRate: 0 }, // %
    errorRate: {
      week: {
        labels: ['วันนี้-6','วันนี้-5','วันนี้-4','วันนี้-3','วันนี้-2','เมื่อวาน','วันนี้'],
        values: [3.2, 2.8, 4.1, 3.5, 2.9, 3.8, 2.4]
      },
      month: {
        labels: ['สัปดาห์ 1','สัปดาห์ 2','สัปดาห์ 3','สัปดาห์ 4'],
        values: [3.5, 3.2, 4.0, 2.8]
      }
    },
    topRejects: {
      labels: ['เลือด EDTA', 'Serum', 'ปัสสาวะ', 'Swab (NP/OP)', 'น้ำลาย'],
      values: [34, 27, 19, 15, 11]
    },
    topDNA: {
      labels: ['BRCA1', 'BRCA2', 'EGFR', 'KRAS', 'TP53'],
      values: [125, 112, 98, 87, 76]
    },
    topHospitals: {
      labels: ['โรงพยาบาลศูนย์ A', 'โรงพยาบาลมหาวิทยาลัย B', 'โรงพยาบาลจังหวัด C', 'โรงพยาบาลเอกชน D', 'โรงพยาบาลชุมชน E'],
      values: [320, 295, 244, 210, 188]
    }
  };

  // ── 2) กล่องตัวเลขด้านบน ────────────────────────────────
  function renderMetrics(data = realData) {
    const elTotal = document.getElementById('m-total');
    const elProg  = document.getElementById('m-progress');
    const elDone  = document.getElementById('m-done');
    const elErr   = document.getElementById('m-error');
    
    const elPercentTotal = document.getElementById('percent-total');
    const elPercentProg  = document.getElementById('percent-progress');
    const elPercentDone  = document.getElementById('percent-done');
    const elPercentErr   = document.getElementById('percent-error');
    
    const total = data.totals.today;
    const progress = data.totals.inProgress;
    const done = data.totals.done;
    const error = data.totals.error;
    
    if (elTotal) elTotal.textContent = total;
    if (elProg)  elProg.textContent  = progress;
    if (elDone)  elDone.textContent  = done;
    if (elErr)   elErr.textContent   = error;
    
    // คำนวณและแสดงเปอร์เซ็นต์
    if (elPercentTotal) elPercentTotal.textContent = '100.00%';
    if (elPercentProg)  elPercentProg.textContent  = total > 0 ? ((progress / total) * 100).toFixed(2) + '%' : '0.00%';
    if (elPercentDone)  elPercentDone.textContent  = total > 0 ? ((done / total) * 100).toFixed(2) + '%' : '0.00%';
    if (elPercentErr)   elPercentErr.textContent   = total > 0 ? ((error / total) * 100).toFixed(2) + '%' : '0.00%';
  }

  // ── 3) กราฟเส้น Usage (รายวัน/รายสัปดาห์) ───────────────
  const usageCanvas = document.getElementById('usageChart');
  if (usageCanvas && window.Chart) {
    const ctx = usageCanvas.getContext('2d');
    chartInstances.usageChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: realData.line.daily.labels,
        datasets: [{
          label: 'จำนวนเคส',
          data: realData.line.daily.values,
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

    // ปุ่มสลับกรอบเวลา (จำกัดเฉพาะปุ่มที่มี data-range และสcope ภายในกลุ่มเดียวกัน)
    document.querySelectorAll('[data-range]').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.closest('.toggle-group');
        group?.querySelectorAll('[data-range]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const range = btn.dataset.range;
        if (!range) return;
        const data = realData.line[range];
        if (!data) return;
        chartInstances.usageChart.data.labels = data.labels;
        chartInstances.usageChart.data.datasets[0].data = data.values;
        chartInstances.usageChart.update();
        const subtitle = document.getElementById('usage-subtitle');
        if (subtitle) subtitle.textContent = `สรุป: ราย${range === 'daily' ? 'วัน' : 'สัปดาห์'}`;
      });
    });
  }

  // ── 4) Donut ติดตาม TAT ─────────────────────────────────
  const tatCanvas = document.getElementById('tatDonut');
  if (tatCanvas && window.Chart) {
    
    // Plugin แสดงตัวเลขตรงกลาง
    const tatCenterText = {
      id: 'tatCenterText',
      afterDraw(chart) {
        const meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data || meta.data.length === 0) return;
        
        const {ctx, chartArea} = chart;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;
        
        const isDark = document.body.classList.contains('dark');
        
        // Calculate total from actual data
        const total = chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
        
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // ตัวเลขใหญ่
        ctx.font = 'bold 28px "Noto Sans Thai", sans-serif';
        ctx.fillStyle = isDark ? '#ecf0f1' : '#333';
        ctx.fillText(total, centerX, centerY - 8);
        
        // ข้อความเล็ก
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
        labels: ['ปกติ (ใน SLA)', 'กำลังดำเนินการ (80% SLA)', 'เสี่ยงเกิน SLA (>100%)'],
        datasets: [{
          data: [realData.tat.doneInSLA, realData.tat.warning80to100, realData.tat.overdue100],
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

  // ── 5) Gauge KPI (Semi Donut) ────────────────────────────
  const gaugeCanvas = document.getElementById('kpiGauge');
  if (gaugeCanvas && window.Chart) {
    const rate = realData.kpi.rejectionRate; // 0-100
    const rateText = document.getElementById('rejectionRateText');
    if (rateText) rateText.textContent = rate + '%';

    const centerText = {
      id: 'centerText',
      afterDraw(chart) {
        const meta = chart.getDatasetMeta(0);
        const arc = meta?.data?.[0];
        if (!arc) return;
        
        // Get current rate from chart data dynamically
        const currentRate = chart.data.datasets[0].data[0] || 0;
        
        const isDark = document.body.classList.contains('dark');
        const {ctx} = chart;
        
        ctx.save();
        ctx.font = 'bold 24px "Noto Sans Thai", sans-serif';
        ctx.fillStyle = isDark ? '#ecf0f1' : '#333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${currentRate.toFixed(1)}%`, arc.x, arc.y + 5);
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

  // ── 6) Error Rate Line Chart (อัตราการปฏิเสธสิ่งส่งตรวจรายวัน) ──
  const errorCanvas = document.getElementById('errorRateChart');
  if (errorCanvas && window.Chart) {
    const ctx = errorCanvas.getContext('2d');
    chartInstances.errorRateChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: realData.errorRate.week.labels,
        datasets: [{
          label: 'อัตราการปฏิเสธ (%)',
          data: realData.errorRate.week.values,
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
        scales: { 
          y: { 
            beginAtZero: true,
            ticks: {
              callback: function(value) { return value + '%'; }
            }
          } 
        }
      }
    });

    // ปุ่มสลับช่วงเวลา
    document.querySelectorAll('[data-error-range]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-error-range]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const range = btn.dataset.errorRange;
        const data = realData.errorRate[range];
        chartInstances.errorRateChart.data.labels = data.labels;
        chartInstances.errorRateChart.data.datasets[0].data = data.values;
        chartInstances.errorRateChart.update();
        const subtitle = document.getElementById('error-subtitle');
        if (subtitle) subtitle.textContent = `สรุป: ${range === 'week' ? '7 วันล่าสุด' : '30 วันล่าสุด'}`;
      });
    });
  }

  // ── 7) Top 5 Rejected Specimens (Horizontal Bar) ────────
  const topRejectsCanvas = document.getElementById('topRejectsChart');
  if (topRejectsCanvas && window.Chart) {
    const ctx = topRejectsCanvas.getContext('2d');
    const colors = realData.topRejects.values.map(() => 'rgba(220, 38, 38, 0.9)');
    const bgColors = realData.topRejects.values.map(() => 'rgba(220, 38, 38, 0.18)');

    chartInstances.topRejectsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: realData.topRejects.labels,
        datasets: [{
          label: 'จำนวนที่ถูกปฏิเสธ',
          data: realData.topRejects.values,
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
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.x} เคส`
            }
          }
        },
        scales: {
          x: { beginAtZero: true },
          y: { ticks: { font: { weight: '600' } } }
        }
      }
    });
  }

  // ── 8) Top 5 DNA Most Found (Horizontal Bar) ────────────
  const topDnaCanvas = document.getElementById('topDnaChart');
  if (topDnaCanvas && window.Chart) {
    const ctx = topDnaCanvas.getContext('2d');
    const colors = realData.topDNA.values.map(() => 'rgba(34, 197, 94, 0.9)'); // green
    const bgColors = realData.topDNA.values.map(() => 'rgba(34, 197, 94, 0.18)');

    chartInstances.topDnaChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: realData.topDNA.labels,
        datasets: [{
          label: 'จำนวนครั้งที่พบ',
          data: realData.topDNA.values,
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
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.x} ครั้ง`
            }
          }
        },
        scales: {
          x: { beginAtZero: true },
          y: { ticks: { font: { weight: '600' } } }
        }
      }
    });
  }

  // ── 9) Top 5 Hospitals by Submissions (Horizontal Bar) ─
  const topHospitalsCanvas = document.getElementById('topHospitalsChart');
  if (topHospitalsCanvas && window.Chart) {
    const ctx = topHospitalsCanvas.getContext('2d');
    const colors = realData.topHospitals.values.map(() => 'rgba(37, 99, 235, 0.9)'); // blue
    const bgColors = realData.topHospitals.values.map(() => 'rgba(37, 99, 235, 0.18)');

    chartInstances.topHospitalsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: realData.topHospitals.labels,
        datasets: [{
          label: 'จำนวนส่งตรวจ',
          data: realData.topHospitals.values,
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
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.x} เคส`
            }
          }
        },
        scales: {
          x: { beginAtZero: true },
          y: { ticks: { font: { weight: '600' } } }
        }
      }
    });
  }
  
  // ── Initialize dashboard with real data (after all charts are created) ───
  (async function initDashboard() {
    const data = await fetchRealData();
    if (data) {
      // Update realData with fetched data
      realData.totals = data.totals;
      realData.tat = data.tat;
      realData.kpi = data.kpi;
      
      // Render metrics with real data
      renderMetrics(realData);
      
      // Update TAT chart
      if (chartInstances.tatChart) {
        chartInstances.tatChart.data.datasets[0].data = [data.tat.doneInSLA, data.tat.warning80to100, data.tat.overdue100];
        chartInstances.tatChart.update();
        console.log('✅ TAT Chart updated:', data.tat);
      }
      
      // Update KPI gauge
      if (chartInstances.gaugeChart) {
        const rejectionValue = data.kpi.rejectionRate;
        const remainingValue = 100 - rejectionValue;
        chartInstances.gaugeChart.data.datasets[0].data = [rejectionValue, remainingValue];
        
        // Update center text
        const gaugeText = document.querySelector('.gauge-text h2');
        if (gaugeText) gaugeText.textContent = rejectionValue.toFixed(1) + '%';
        
        chartInstances.gaugeChart.update();
        console.log('✅ KPI Gauge updated:', rejectionValue + '%');
      }
      
      console.log('✅ Dashboard initialized with real data');
    } else {
      console.error('❌ Failed to fetch dashboard data');
    }
  })();
  
  // ── Time Filter Button Handlers ───────────────────
  document.querySelectorAll('.time-filter-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      // Update active button
      document.querySelectorAll('.time-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.color = 'var(--text-secondary)';
      });
      btn.classList.add('active');
      btn.style.background = 'var(--primary)';
      btn.style.color = '#fff';
      
      // Get time filter
      const timeFilter = btn.dataset.time;
      currentTimeFilter = timeFilter;
      
      // Update label
      const totalLabel = document.getElementById('total-label');
      if (totalLabel) {
        const labels = {
          'today': 'จำนวนเคสทั้งหมดวันนี้',
          'week': 'จำนวนเคส 7 วันล่าสุด',
          'month': 'จำนวนเคสเดือนนี้'
        };
        totalLabel.textContent = labels[timeFilter] || 'จำนวนเคสทั้งหมดวันนี้';
      }
      
      // Fetch and update data
      const data = await fetchRealData(timeFilter);
      if (data) {
        realData.totals = data.totals;
        realData.tat = data.tat;
        realData.kpi = data.kpi;
        
        renderMetrics(realData);
        
        if (chartInstances.tatChart) {
          chartInstances.tatChart.data.datasets[0].data = [data.tat.doneInSLA, data.tat.warning80to100, data.tat.overdue100];
          chartInstances.tatChart.update();
        }
        
        if (chartInstances.gaugeChart) {
          const rejectionValue = data.kpi.rejectionRate;
          const remainingValue = 100 - rejectionValue;
          chartInstances.gaugeChart.data.datasets[0].data = [rejectionValue, remainingValue];
          const gaugeText = document.querySelector('.gauge-text h2');
          if (gaugeText) gaugeText.textContent = rejectionValue.toFixed(1) + '%';
          chartInstances.gaugeChart.update();
        }
      }
    });
  });
  
  // Style active button on load
  document.querySelector('.time-filter-btn.active')?.setAttribute('style', 
    'padding: 10px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s; background: var(--primary); color: #fff;');
}

