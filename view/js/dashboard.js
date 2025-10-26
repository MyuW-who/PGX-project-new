/* ============================================================
   1️⃣ THEME SWITCHER (โหมดสว่าง / โหมดมืด)
   ------------------------------------------------------------
   ▶️ เปลี่ยนธีมของหน้าเว็บทั้งหมดระหว่าง Light ↔ Dark
============================================================ */
const themeBtn = document.getElementById("themeToggle");
themeBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});


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

const dashboard_btn = document.getElementById('patient-btn');

dashboard_btn?.addEventListener('click', () => {
  window.electronAPI.navigate('patient');
});


/* ============================================================
   7️⃣ MOCK DATA & DASHBOARD WIDGETS (ยังคงสไตล์เดิม)
   ------------------------------------------------------------
   ▶️ ข้อมูลจำลอง + วาดกราฟ 3 แบบ: Line, Donut TAT, Gauge KPI
============================================================ */

// ใช้เฉพาะในหน้า Dashboard เท่านั้น (กัน error ถ้า element ไม่มี)
const hasDashboard = !!document.getElementById('usageChart') || !!document.getElementById('tatDonut') || !!document.getElementById('kpiGauge');

if (hasDashboard) {
  // ── 1) ข้อมูลจำลอง ───────────────────────────────────────
  const mockData = {
    totals: { today: 128, inProgress: 23, done: 98, error: 7 },
    line: {
      daily: {
        labels: ['00:00','04:00','08:00','12:00','16:00','20:00'],
        values: [12, 25, 40, 60, 50, 30]
      },
      weekly: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        values: [120, 150, 170, 160, 180, 90, 140]
      }
    },
    tat: { inSLA: 68, inProgress: 23, overSLA: 9 },
    kpi: { rejectionRate: 2.4 } // %
  };

  // ── 2) กล่องตัวเลขด้านบน ────────────────────────────────
  function renderMetrics() {
    const elTotal = document.getElementById('m-total');
    const elProg  = document.getElementById('m-progress');
    const elDone  = document.getElementById('m-done');
    const elErr   = document.getElementById('m-error');
    if (elTotal) elTotal.textContent = mockData.totals.today;
    if (elProg)  elProg.textContent  = mockData.totals.inProgress;
    if (elDone)  elDone.textContent  = mockData.totals.done;
    if (elErr)   elErr.textContent   = mockData.totals.error;
  }
  renderMetrics();

  // ── 3) กราฟเส้น Usage (รายวัน/รายสัปดาห์) ───────────────
  let usageChart;
  const usageCanvas = document.getElementById('usageChart');
  if (usageCanvas && window.Chart) {
    const ctx = usageCanvas.getContext('2d');
    usageChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: mockData.line.daily.labels,
        datasets: [{
          label: 'จำนวนเคส',
          data: mockData.line.daily.values,
          borderColor: '#0b72ff',
          backgroundColor: 'rgba(11,114,255,0.12)',
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

    // ปุ่มสลับกรอบเวลา
    document.querySelectorAll('.toggle-group .small-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.toggle-group .small-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const range = btn.dataset.range;
        const data = mockData.line[range];
        usageChart.data.labels = data.labels;
        usageChart.data.datasets[0].data = data.values;
        usageChart.update();
        const subtitle = document.getElementById('usage-subtitle');
        if (subtitle) subtitle.textContent = `สรุป: ราย${range === 'daily' ? 'วัน' : 'สัปดาห์'}`;
      });
    });
  }

  // ── 4) Donut ติดตาม TAT ─────────────────────────────────
  let tatChart;
  const tatCanvas = document.getElementById('tatDonut');
  if (tatCanvas && window.Chart) {
    const ctx = tatCanvas.getContext('2d');
    tatChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['ปกติ (ใน SLA)', 'กำลังดำเนินการ', 'เสี่ยงเกิน SLA'],
        datasets: [{
          data: [mockData.tat.inSLA, mockData.tat.inProgress, mockData.tat.overSLA],
          backgroundColor: ['#2ecc71', '#0b72ff', '#ff6b6b'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.label}: ${c.parsed}` } }
        }
      }
    });
  }

  // ── 5) Gauge KPI (Semi Donut) ────────────────────────────
  let gaugeChart;
  const gaugeCanvas = document.getElementById('kpiGauge');
  if (gaugeCanvas && window.Chart) {
    const rate = mockData.kpi.rejectionRate; // 0-100
    const rateText = document.getElementById('rejectionRateText');
    if (rateText) rateText.textContent = rate + '%';

    const centerText = {
      id: 'centerText',
      afterDraw(chart) {
        const meta = chart.getDatasetMeta(0);
        const arc = meta?.data?.[0];
        if (!arc) return;
        const {ctx} = chart;
        ctx.save();
        ctx.font = 'bold 18px Poppins, sans-serif';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${rate}%`, arc.x, arc.y);
        ctx.restore();
      }
    };

    const ctx = gaugeCanvas.getContext('2d');
    gaugeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['อัตราปฏิเสธ', 'ส่วนที่เหลือ'],
        datasets: [{
          data: [rate, 100 - rate],
          backgroundColor: ['#ff6b6b', '#e9eef6'],
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

