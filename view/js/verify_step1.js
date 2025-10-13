// Toggle Theme
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Toggle Language
const langToggle = document.getElementById("langToggle");
langToggle.addEventListener("click", () => {
  langToggle.textContent = langToggle.textContent === "TH" ? "EN" : "TH";
});

// จำลองข้อมูลผู้ป่วย (ภายหลังจะดึงจาก Supabase หรือ localStorage)
const patientData = {
  fullname: "สมชาย ใจดี",
  age: 45,
  department: "แผนกเวชศาสตร์ชันสูตร",
  sentDate: "2025-10-10",
  resultDate: "2025-10-12",
  phone: "081-234-5678",
  race: "ไทย",
  hospital: "โรงพยาบาลนพรัตน์ราชธานี",
  citizenId: "1234567890123",
};

// แสดงข้อมูลผู้ป่วย
const patientBox = document.getElementById("patient-info");
patientBox.innerHTML = `
  <table>
    <tr><td class="label">ชื่อ-สกุล:</td><td>${patientData.fullname}</td></tr>
    <tr><td class="label">อายุ:</td><td>${patientData.age} ปี</td></tr>
    <tr><td class="label">หน่วยงานที่ส่งตรวจ:</td><td>${patientData.department}</td></tr>
    <tr><td class="label">วันที่ส่งตรวจ:</td><td>${patientData.sentDate}</td></tr>
    <tr><td class="label">วันที่ผลออก:</td><td>${patientData.resultDate}</td></tr>
    <tr><td class="label">เบอร์โทร:</td><td>${patientData.phone}</td></tr>
    <tr><td class="label">เชื้อชาติ:</td><td>${patientData.race}</td></tr>
    <tr><td class="label">โรงพยาบาล:</td><td>${patientData.hospital}</td></tr>
    <tr><td class="label">บัตรประชาชน:</td><td>${patientData.citizenId}</td></tr>
  </table>
`;

// ปุ่ม Next
document.querySelector(".next-btn").addEventListener("click", () => {
  const dnaType = document.getElementById("dnaType").value;
  if (!dnaType) {
    alert("กรุณาเลือกประเภท DNA ก่อนดำเนินการต่อ");
    return;
  }
  alert(`ข้อมูลถูกต้อง → ไปยังขั้นตอนถัดไป (DNA Type: ${dnaType})`);
  // ภายหลังจะใช้ window.location.href = "verify_step2.html";
});

// ปุ่ม Next
document.querySelector(".next-btn").addEventListener("click", () => {
  const dnaType = document.getElementById("dnaType").value;
  if (!dnaType) {
    alert("กรุณาเลือกประเภท DNA ก่อนดำเนินการต่อ");
    return;
  }

  // เก็บค่าที่เลือกไว้
  localStorage.setItem("dnaType", dnaType);
  localStorage.setItem("patientName", "สมชาย ใจดี"); // ตัวอย่างชื่อผู้ป่วย

  // ไปยังหน้า step2
  window.location.href = "verify_step2.html";
});
