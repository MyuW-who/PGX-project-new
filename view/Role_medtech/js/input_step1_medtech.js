initializeUserProfile();

// 🧬 Load Specimens from Database
async function loadSpecimens() {
  try {
    console.log('🔄 Loading specimens from database...');
    const response = await window.electronAPI.getSpecimens();
    
    if (response.success && response.data) {
      const specimenSelect = document.getElementById('specimenType');
      
      // Clear existing options except the placeholder
      specimenSelect.innerHTML = '<option value="">-- เลือกชนิดของสิ่งส่งตรวจ --</option>';
      
      // Add options from database
      response.data.forEach(specimen => {
        const option = document.createElement('option');
        option.value = specimen.specimen_name;
        option.textContent = specimen.specimen_name;
        specimenSelect.appendChild(option);
      });
      
      console.log('✅ Loaded', response.data.length, 'specimens');
    } else {
      console.error('❌ Failed to load specimens:', response);
    }
  } catch (error) {
    console.error('❌ Error loading specimens:', error);
  }
}

// Load specimens on page load
loadSpecimens();

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

  if (patientData) {
    // Store all patient data in sessionStorage
    sessionStorage.setItem("patientName", `${patientData.first_name} ${patientData.last_name}`);
    sessionStorage.setItem("patientAge", patientData.age || 'N/A');
    sessionStorage.setItem("patientGender", patientData.gender || 'N/A');
    sessionStorage.setItem("patientId", patientData.patient_id || patientId);
    sessionStorage.setItem("patientHospital", patientData.hospital_id || 'N/A');
    sessionStorage.setItem("patientEthnicity", patientData.ethnicity || 'N/A');
    sessionStorage.setItem("patientPhone", patientData.phone || 'N/A');
    sessionStorage.setItem("patientBloodType", patientData.blood_type || 'N/A');
  } else {
    sessionStorage.setItem("patientName", "สมชาย ใจดี");
  }

  const patientBox = document.getElementById('patient-info');
  if (patientData) {
    patientBox.innerHTML = `
      <table>
        <tr><td class="label">เลขประจำตัวผู้ป่วย:</td><td class="value">${patientData.patient_id}</td></tr>
        <tr><td class="label">ชื่อ-สกุล:</td><td class="value">${patientData.first_name} ${patientData.last_name}</td></tr>
        <tr><td class="label">อายุ:</td><td class="value">${patientData.age} ปี</td></tr>
        <tr><td class="label">โรงพยาบาล:</td><td class="value">${patientData.hospital_id}</td></tr>
        <tr><td class="label">เชื้อชาติ:</td><td class="value">${patientData.ethnicity}</td></tr>
        <tr><td class="label">เพศ:</td><td class="value">${patientData.gender}</td></tr>
        <tr><td class="label">เบอร์โทรศัพท์:</td><td class="value">${patientData.phone}</td></tr>
        <tr><td class="label">กรุ๊ปเลือด:</td><td class="value">${patientData.blood_type}</td></tr>
        <tr><td class="label">วันที่ส่งผลตรวจ:</td><td class="value">${new Date().toLocaleDateString()}</td></tr>
      </table>
    `;
  } else {
    patientBox.innerHTML = '<p>ไม่พบข้อมูลผู้ป่วย</p>';
  }

})(); 


// Back Button
const backBtn = document.querySelector(".back-btn");
backBtn.addEventListener("click", () => {
  window.electronAPI.navigate('patient_medtech'); // Navigate back to the patient page
});

// Next Button
const nextBtn = document.querySelector(".next-btn");
nextBtn.addEventListener("click", () => {
  const dnaType = document.getElementById("dnaType").value;
  const specimenType = document.getElementById("specimenType").value;
  
  if (!dnaType) {
    alert("กรุณาเลือกประเภท DNA ก่อนดำเนินการต่อ");
    return;
  }
  
  if (!specimenType) {
    alert("กรุณาเลือกประเภทสิ่งส่งตรวจก่อนดำเนินการต่อ");
    return;
  }

  // Store selected DNA type and Specimen in sessionStorage
  sessionStorage.setItem("selectedDnaType", dnaType);
  sessionStorage.setItem("selectedSpecimen", specimenType);

  // Navigate to the next step
  window.electronAPI.navigate('input_step2_medtech');
});

// ปุ่ม Back
