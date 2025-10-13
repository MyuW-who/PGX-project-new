/* ========================
   🔹 Theme & Language Toggle
======================== */
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

const langToggle = document.getElementById("langToggle");
langToggle.addEventListener("click", () => {
  langToggle.textContent = langToggle.textContent === "TH" ? "EN" : "TH";
});

/* ========================
   🧬 ดึงข้อมูลจาก Step 1
======================== */
const patientName = localStorage.getItem("patientName") || "สมชาย ใจดี";
const dnaType = localStorage.getItem("dnaType") || "-";
document.getElementById("patientName").textContent = patientName;
document.getElementById("dnaType").textContent = dnaType;

// พื้นที่สร้าง dropdown
const selectArea = document.getElementById("selectArea");

/* ========================
   🧩 ฟังก์ชันสร้าง dropdown ตาม DNA Type
======================== */
function renderDNAForm(type) {
  let html = "";

  if (type === "CYP2D6") {
    html = `
      <div class="select-row">
        <label for="allele10">*10:</label>
        <select id="allele10">
          <option value="" disabled selected>เลือกประเภท DNA</option>
          <option value="C/C">C/C</option>
          <option value="C/T">C/T</option>
          <option value="T/T">T/T</option>
        </select>

        <label for="allele41">*41:</label>
        <select id="allele41">
          <option value="" disabled selected>เลือกประเภท DNA</option>
          <option value="G/G">G/G</option>
          <option value="G/A">G/A</option>
          <option value="A/A">A/A</option>
        </select>
      </div>

      <div class="select-row">
        <label for="allele4">*4:</label>
        <select id="allele4">
          <option value="" disabled selected>เลือกประเภท DNA</option>
          <option value="G/G">G/G</option>
          <option value="G/A">G/A</option>
          <option value="A/A">A/A</option>
        </select>

        <label for="allele5">*5:</label>
        <select id="allele5">
          <option value="" disabled selected>เลือกประเภท DNA</option>
          <option value="Negative">Negative</option>
          <option value="Positive">Positive</option>
        </select>
      </div>

      <div class="select-row">
        <label for="genotype">Genotype:</label>
        <select id="genotype">
          <option value="" disabled selected>เลือกประเภท DNA</option>
          <option value="Ultrarapid Metabolizer">Ultrarapid Metabolizer</option>
          <option value="Normal Metabolizer">Normal Metabolizer</option>
          <option value="Intermediate Metabolizer">Intermediate Metabolizer</option>
          <option value="Poor Metabolizer">Poor Metabolizer</option>
        </select>
      </div>`;
  } 
  else if (type === "CYP2C19") {
    html = `
      <div class="select-row">
        <label for="allele2">*2:</label>
        <select id="allele2">
          <option value="" disabled selected>เลือกประเภท DNA</option>
          <option value="Normal">Normal</option>
          <option value="Loss of Function">Loss of Function</option>
        </select>

        <label for="allele3">*3:</label>
        <select id="allele3">
          <option value="" disabled selected>เลือกประเภท DNA</option>
          <option value="Normal">Normal</option>
          <option value="Loss of Function">Loss of Function</option>
        </select>
      </div>

      <div class="select-row">
        <label for="allele17">*17:</label>
        <select id="allele17">
          <option value="" disabled selected>เลือกประเภท DNA</option>
          <option value="Normal">Normal</option>
          <option value="Gain of Function">Gain of Function</option>
        </select>
      </div>

      <div class="select-row">
        <label for="genotype">Genotype:</label>
        <select id="genotype">
          <option value="" disabled selected>เลือกประเภท DNA</option>
          <option value="Rapid Metabolizer">Rapid Metabolizer</option>
          <option value="Normal Metabolizer">Normal Metabolizer</option>
          <option value="Intermediate Metabolizer">Intermediate Metabolizer</option>
          <option value="Poor Metabolizer">Poor Metabolizer</option>
        </select>
      </div>`;
  } 
  else if (type === "CYP2C9") {
    html = `
      <div class="select-row">
        <label for="allele2">*2:</label>
        <select id="allele2">
          <option value="" disabled selected>เลือกประเภท DNA</option>
          <option value="C/C">C/C</option>
          <option value="C/T">C/T</option>
          <option value="T/T">T/T</option>
        </select>

        <label for="allele3">*3:</label>
        <select id="allele3">
          <option value="" disabled selected>เลือกประเภท DNA</option>
          <option value="A/A">A/A</option>
          <option value="A/C">A/C</option>
          <option value="C/C">C/C</option>
        </select>
      </div>

      <div class="select-row">
        <label for="genotype">Genotype:</label>
        <select id="genotype">
          <option value="" disabled selected>เลือกประเภท DNA</option>
          <option value="Normal Metabolizer">Normal Metabolizer</option>
          <option value="Intermediate Metabolizer">Intermediate Metabolizer</option>
          <option value="Poor Metabolizer">Poor Metabolizer</option>
        </select>
      </div>`;
  } 
  else {
    html = `<p style="color:gray;">ยังไม่มีข้อมูลสำหรับ DNA Type นี้</p>`;
  }

  selectArea.innerHTML = html;
}

// เรียกฟังก์ชันตอนโหลดหน้า
renderDNAForm(dnaType);

/* ========================
   🔙 ปุ่ม Back / ✅ Confirm
======================== */
document.querySelector(".back-btn").addEventListener("click", () => {
  window.location.href = "verify_step1.html";
});

document.querySelector(".confirm-btn").addEventListener("click", () => {
  // ดึงค่าที่เลือกทั้งหมดโดยใช้ querySelectorAll
  const selects = selectArea.querySelectorAll("select");
  selects.forEach((sel) => {
    localStorage.setItem(sel.id, sel.value || "-");
  });

  // ไปหน้า Step 3
  window.location.href = "verify_step3.html";
});
