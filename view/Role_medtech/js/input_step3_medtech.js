
/* ========================
   ดึงข้อมูลจาก sessionStorage
======================== */
const dnaType = sessionStorage.getItem("selectedDnaType") || "-";
const patientName = sessionStorage.getItem("patientName") || "-";
const patientId = sessionStorage.getItem("patientId") || sessionStorage.getItem("selectedPatientId") || "-";
const genotype = sessionStorage.getItem("genotype") || "-";
const phenotype = sessionStorage.getItem("phenotype") || "-";

document.getElementById("patientName").textContent = patientId + " " + patientName;
document.getElementById("dnaType").textContent = dnaType;
document.getElementById("genotype").textContent = genotype;

/* ========================
   แสดง Allele อัตโนมัติ
======================== */
const alleleHeader = document.getElementById("alleleHeader");
const alleleValues = document.getElementById("alleleValues");

function showAlleles(type) {
  let alleles = [];

  if (type === "CYP2D6") alleles = ["allele10","allele4","allele41","allele5"];
  else if (type === "CYP2C19") alleles = ["allele2","allele3","allele17"];
  else if (type === "CYP2C9") alleles = ["allele2","allele3"];

  alleleHeader.innerHTML = "";
  alleleValues.innerHTML = "";

  alleles.forEach(id => {
    const th = document.createElement("th");
    th.textContent = id.replace("allele", "*");
    const td = document.createElement("td");
    td.textContent = sessionStorage.getItem(id) || "-";
    alleleHeader.appendChild(th);
    alleleValues.appendChild(td);
  });
}
showAlleles(dnaType);

/* ========================
   แสดง Phenotype และ Recommendation จาก Rulebase
======================== */
function predictPhenotype(geno) {
  const g = geno.toLowerCase();
  if (g.includes("ultra")) return "Ultrarapid Metabolizer (เพิ่มการเผาผลาญยา)";
  if (g.includes("rapid")) return "Rapid Metabolizer (การเผาผลาญเร็ว)";
  if (g.includes("normal")) return "Normal Metabolizer (การเผาผลาญปกติ)";
  if (g.includes("intermediate")) return "Intermediate Metabolizer (การเผาผลาญลดลง)";
  if (g.includes("poor")) return "Poor Metabolizer (การเผาผลาญช้ามาก)";
  return "-";
}

// Display Phenotype Label (DNA type specific)
const phenotypeLabel = sessionStorage.getItem('phenotypeLabel') || 'Predicted Phenotype';
document.getElementById("phenotypeLabel").textContent = phenotypeLabel;

// Display Likely Phenotype
document.getElementById("phenotype").textContent = phenotype || predictPhenotype(genotype);

// Display Activity Score (if available)
const activityScore = sessionStorage.getItem('activityScore');
if (activityScore) {
  document.getElementById("activityScore").textContent = activityScore;
}

// Display Genotype Summary
const genotypeSummary = sessionStorage.getItem('genotypeSummary');
if (genotypeSummary) {
  document.getElementById("genotypeSummary").textContent = genotypeSummary;
} else {
  document.getElementById("genotypeSummary").textContent = `Genotype ${genotype} for ${dnaType}`;
}

// Display Therapeutic Recommendation
const recommendation = sessionStorage.getItem('recommendation');
if (recommendation) {
  document.getElementById("recommendation").textContent = recommendation;
} else {
  document.getElementById("recommendation").textContent = 'Please consult with clinical pharmacist for medication dosing.';
}

document.querySelector(".back-btn").addEventListener("click", () => {
  window.electronAPI.navigate('input_step2_medtech');
});

document.querySelector(".confirm-btn").addEventListener("click", async () => {
  try {

    if (!window.testRequestModule) {
      alert('โมดูลไม่ถูกโหลด กรุณารีเฟรชหน้าเว็บ');
      return;
    }

    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      await Swal.fire({
        icon: 'error',
        title: 'ไม่พบข้อมูลผู้ใช้',
        text: 'กรุณาเข้าสู่ระบบใหม่',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    const sessionData = window.testRequestModule.loadTestRequestFromSession();

    if (!sessionData.selectedPatientId || !sessionData.selectedDnaType || !sessionData.selectedSpecimen) {
      await Swal.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกข้อมูลให้ครบในทุกขั้นตอน',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    // Prepare test request data
    const doctorName = currentUser.doctor_name 
      || (currentUser.first_name && currentUser.last_name 
          ? `${currentUser.first_name} ${currentUser.last_name}`.trim() 
          : currentUser.username)
      || 'Unknown Doctor';
    
    const testRequestData = {
      patient_id: sessionData.selectedPatientId,
      test_target: sessionData.selectedDnaType,
      Specimen: sessionData.selectedSpecimen,
      request_date: new Date().toISOString().split('T')[0],
      status: 'need 2 confirmation',
      users_id: currentUser.user_id || null,
      Doc_Name: doctorName
    };

    // Save to database using the module
    const result = await window.testRequestModule.createTestRequest(testRequestData);
    
    if (result && result.request_id) {
      // Prepare complete test data for report generation
      const alleles = [];
      const alleleKeys = ['allele2', 'allele3', 'allele4', 'allele5', 'allele10', 'allele17', 'allele41'];
      alleleKeys.forEach(key => {
        const value = sessionStorage.getItem(key);
        if (value) {
          alleles.push({
            name: key.replace('allele', '*'),
            value: value
          });
        }
      });

      const completeTestData = {
        request_id: result.request_id,
        test_target: testRequestData.test_target,
        genotype: genotype,
        predicted_phenotype: document.getElementById('phenotype').textContent || phenotype,
        genotype_summary: sessionStorage.getItem('genotypeSummary') || 
                         `Genotype ${genotype} for ${testRequestData.test_target}`,
        recommendation: sessionStorage.getItem('recommendation') || 
                       'Please consult with clinical pharmacist for medication dosing.',
        patientId: testRequestData.patient_id,
        patientName: patientName,
        patientAge: sessionStorage.getItem('patientAge') || 'N/A',
        patientGender: sessionStorage.getItem('patientGender') || 'N/A',
        specimen: testRequestData.Specimen,
        patientNumber: sessionStorage.getItem('patientNumber') || result.request_id,
        hospital: currentUser.hospital_id || 'N/A',
        createDate: testRequestData.request_date,
        updateDate: new Date().toLocaleDateString('th-TH'),
        doctorName: doctorName,
        responsibleDoctor: doctorName,
        alleles: alleles
      };

      // Generate report with PDF
      console.log('🔄 Generating PGx report with data:', completeTestData);
      const reportResult = await window.electronAPI.createPgxReport(completeTestData);
      console.log('📊 Report result:', reportResult);
      
      if (reportResult.success) {
        await Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          html: `
            <p>บันทึกข้อมูลการตรวจเรียบร้อยแล้ว</p>
            <p><small>สร้างรายงาน PDF เรียบร้อยแล้ว</small></p>
          `,
          confirmButtonText: 'ตกลง'
        });
      } else {
        await Swal.fire({
          icon: 'warning',
          title: 'บันทึกข้อมูลสำเร็จ',
          text: 'แต่ไม่สามารถสร้างรายงาน PDF ได้: ' + (reportResult.message || 'Unknown error'),
          confirmButtonText: 'ตกลง'
        });
      }
      
      // Clear session data using the module
      window.testRequestModule.clearTestRequestSession();
      
      // Navigate back to patient page
      window.electronAPI.navigate('patient_medtech');
    }
  } catch (error) {
    console.error('❌ Error saving test request:', error);
    console.error('Error stack:', error.stack);
    await Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
      confirmButtonText: 'ตกลง'
    });
  }
});

document.querySelector(".print-btn").addEventListener("click", () => {
  window.print();
});

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
