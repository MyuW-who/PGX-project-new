const addBtn = document.getElementById("addBtn");
const popupForm = document.getElementById("popupForm");
const cancelBtn = document.getElementById("cancelBtn");
const form = document.getElementById("patientForm");
const tbody = document.querySelector("#patientTable tbody");

let patients = JSON.parse(localStorage.getItem("patients")) || [];
let editIndex = null;

// แสดง popup
addBtn.addEventListener("click", () => {
  editIndex = null;
  form.reset();
  document.getElementById("formTitle").textContent = "เพิ่มข้อมูลผู้ป่วย";
  popupForm.style.display = "flex";
});

// ปิด popup
cancelBtn.addEventListener("click", () => {
  popupForm.style.display = "none";
});

// ปิด popup เมื่อคลิกนอกกรอบ
window.addEventListener("click", (e) => {
  if (e.target === popupForm) popupForm.style.display = "none";
});

// แสดงข้อมูลในตาราง
function renderTable() {
  tbody.innerHTML = "";
  patients.forEach((p, i) => {
    const row = `
      <tr>
        <td>${p.fullname}</td>
        <td>${p.age}</td>
        <td>${p.hospital}</td>
        <td>${p.dnaType}</td>
        <td>${p.sentDate}</td>
        <td>${p.resultDate}</td>
        <td>
          <button onclick="editPatient(${i})">แก้ไข</button>
          <button onclick="deletePatient(${i})">ลบ</button>
        </td>
      </tr>`;
    tbody.insertAdjacentHTML("beforeend", row);
  });
}

// เพิ่มหรือแก้ไขข้อมูล
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = {
    fullname: fullname.value,
    age: age.value,
    department: department.value,
    sentDate: sentDate.value,
    resultDate: resultDate.value,
    dnaType: dnaType.value,
    phone: phone.value,
    nationality: nationality.value,
    hospital: hospital.value,
    idcard: idcard.value
  };

  if (editIndex !== null) {
    patients[editIndex] = data;
  } else {
    patients.push(data);
  }

  localStorage.setItem("patients", JSON.stringify(patients));
  renderTable();
  popupForm.style.display = "none";
});

// ฟังก์ชันแก้ไข
window.editPatient = (i) => {
  const p = patients[i];
  editIndex = i;
  document.getElementById("formTitle").textContent = "แก้ไขข้อมูลผู้ป่วย";
  for (const key in p) {
    if (document.getElementById(key)) document.getElementById(key).value = p[key];
  }
  popupForm.style.display = "flex";
};

// ลบข้อมูล
window.deletePatient = (i) => {
  if (confirm("ต้องการลบข้อมูลนี้หรือไม่?")) {
    patients.splice(i, 1);
    localStorage.setItem("patients", JSON.stringify(patients));
    renderTable();
  }
};

renderTable();

const themeToggle = document.getElementById("themeToggle");
const langToggle = document.getElementById("langToggle");
const pageTitle = document.getElementById("pageTitle");

// สลับธีม Light/Dark
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "🌞 โหมดสว่าง" : "🌓 เปลี่ยนธีม";
});

// สลับภาษา UI ไทย ↔ อังกฤษ
let lang = "th";
langToggle.addEventListener("click", () => {
  lang = lang === "th" ? "en" : "th";
  updateLanguage();
});

function updateLanguage() {
  if (lang === "en") {
    langToggle.textContent = "TH";
    pageTitle.textContent = "Patient Management System";
    document.getElementById("search").placeholder = "Search patient...";
    document.getElementById("addBtn").textContent = "+ Add Patient";
    document.querySelector("th:nth-child(1)").textContent = "Full Name";
    document.querySelector("th:nth-child(2)").textContent = "Age";
    document.querySelector("th:nth-child(3)").textContent = "Hospital";
    document.querySelector("th:nth-child(4)").textContent = "DNA Type";
    document.querySelector("th:nth-child(5)").textContent = "Sent Date";
    document.querySelector("th:nth-child(6)").textContent = "Result Date";
    document.querySelector("th:nth-child(7)").textContent = "Action";
  } else {
    langToggle.textContent = "EN";
    pageTitle.textContent = "ระบบจัดการข้อมูลผู้ป่วย";
    document.getElementById("search").placeholder = "ค้นหาผู้ป่วย...";
    document.getElementById("addBtn").textContent = "+ เพิ่มข้อมูลผู้ป่วย";
    document.querySelector("th:nth-child(1)").textContent = "ชื่อ-สกุล";
    document.querySelector("th:nth-child(2)").textContent = "อายุ";
    document.querySelector("th:nth-child(3)").textContent = "โรงพยาบาล";
    document.querySelector("th:nth-child(4)").textContent = "ประเภท DNA";
    document.querySelector("th:nth-child(5)").textContent = "วันที่ส่งตรวจ";
    document.querySelector("th:nth-child(6)").textContent = "วันที่ผลออก";
    document.querySelector("th:nth-child(7)").textContent = "การจัดการ";
  }
}
