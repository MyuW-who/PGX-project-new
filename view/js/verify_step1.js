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

// Fetch patient name using patient ID from sessionStorage
const patientId = sessionStorage.getItem('selectedPatientId');

async function fetchPatientName(patientId) {
  try {
    const patients = await window.electronAPI.searchPatient(patientId);
    if (patients && patients.length > 0) {
      return `${patients[0].first_name} ${patients[0].last_name}`;
    }
    return 'ไม่พบข้อมูลผู้ป่วย'; // Patient not found
  } catch (err) {
    console.error('❌ Error fetching patient name:', err);
    return 'เกิดข้อผิดพลาด'; // Error occurred
  }
}

// Display patient name
(async () => {
  const patientName = await fetchPatientName(patientId);
  const patientBox = document.getElementById('patient-info');
  patientBox.innerHTML = `
    <table>
      <tr><td class="label">ชื่อ-สกุล:</td><td>${patientName}</td></tr>
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
})(); 


// Back Button
const backBtn = document.querySelector(".back-btn");
backBtn.addEventListener("click", () => {
  window.electronAPI.navigate('patient'); // Navigate back to the patient page
});

// Next Button
const nextBtn = document.querySelector(".next-btn");
nextBtn.addEventListener("click", () => {
  const dnaType = document.getElementById("dnaType").value;
  if (!dnaType) {
    alert("กรุณาเลือกประเภท DNA ก่อนดำเนินการต่อ");
    return;
  }

  // Store selected DNA type in sessionStorage
  sessionStorage.setItem("selectedDnaType", dnaType);

  // Navigate to the next step
  window.electronAPI.navigate('verify_step2');
});
