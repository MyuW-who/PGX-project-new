

// Toggle Language
const langToggle = document.getElementById("langToggle");
langToggle.addEventListener("click", () => {
  langToggle.textContent = langToggle.textContent === "TH" ? "EN" : "TH";
});

// Fetch patient data using patient ID from sessionStorage
const patientId = sessionStorage.getItem('selectedPatientId');

async function fetchPatientData(patientId) {
  try {
    const patients = await window.electronAPI.searchPatient(patientId);
    if (patients && patients.length > 0) {
      return patients[0]; // Return the first matching patient
    }
    return null; // No patient found
  } catch (err) {
    console.error('❌ Error fetching patient data:', err);
    return null; // Error occurred
  }
}

// Display patient data
(async () => {
  const patientData = await fetchPatientData(patientId);

  sessionStorage.setItem("patientName" , patientData ? `${patientData.first_name} ${patientData.last_name}` : "สมชาย ใจดี");

  const patientBox = document.getElementById('patient-info');
  if (patientData) {
    patientBox.innerHTML = `
      <table>
        <tr><td class="label">เลขประจำตัวผู้ป่วย:</td><td>${patientData.patient_id}</td></tr>
        <tr><td class="label">ชื่อ-สกุล:</td><td>${patientData.first_name} ${patientData.last_name}</td></tr>
        <tr><td class="label">อายุ:</td><td>${patientData.age} ปี</td></tr>
        <tr><td class="label">โรงพยาบาล:</td><td>${patientData.hospital_id}</td></tr>
        <tr><td class="label">เชื้อชาติ:</td><td>${patientData.ethnicity}</td></tr>
        <tr><td class="label">เพศ:</td><td>${patientData.gender}</td></tr>
        <tr><td class="label">เบอร์โทรศัพท์:</td><td>${patientData.phone}</td></tr>
        <tr><td class="label">กรุ๊ปเลือด:</td><td>${patientData.blood_type}</td></tr>
        <tr><td class="label">วันที่ส่งผลตรวจ:</td><td>${new Date().toLocaleDateString()}</td></tr>
      </table>
    `;
  } else {
    patientBox.innerHTML = '<p>ไม่พบข้อมูลผู้ป่วย</p>';
  }

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

// ปุ่ม Back
document.querySelector(".back-btn").addEventListener("click", () => {
  window.electronAPI.navigate('patient');
});

// User Menu
const userMenuToggle = document.getElementById("userMenuToggle");
const userMenu = document.getElementById("userMenu");

userMenuToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  userMenu?.classList.toggle("show");
});

document.addEventListener("click", (event) => {
  if (!userMenu?.contains(event.target) && event.target !== userMenuToggle) {
    userMenu?.classList.remove("show");
  }
});