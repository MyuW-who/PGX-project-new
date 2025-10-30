/* ========================
   Theme & Language
======================== */
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});
const langToggle = document.getElementById("langToggle");
langToggle.addEventListener("click", () => {
  langToggle.textContent = langToggle.textContent === "TH" ? "EN" : "TH";
});

/* ========================
   ดึงข้อมูลจาก localStorage
======================== */
const dnaType = sessionStorage.getItem("selectedDnaType") || "-";
const patientName = sessionStorage.getItem("patientName") || "-";
const genotype = localStorage.getItem("genotype") || "-";

document.getElementById("patientName").textContent = patientName;
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
    td.textContent = localStorage.getItem(id) || "-";
    alleleHeader.appendChild(th);
    alleleValues.appendChild(td);
  });
}
showAlleles(dnaType);

/* ========================
   คำนวณ Predicted Phenotype
======================== */
function predictPhenotype(geno) {
  const g = geno.toLowerCase();
  if (g.includes("ultra")) return "Ultrarapid Metabolizer (เพิ่มการเผาผลาญยา)";
  if (g.includes("normal")) return "Normal Metabolizer (การเผาผลาญปกติ)";
  if (g.includes("intermediate")) return "Intermediate Metabolizer (การเผาผลาญลดลง)";
  if (g.includes("poor")) return "Poor Metabolizer (การเผาผลาญช้ามาก)";
  return "-";
}
document.getElementById("phenotype").textContent = predictPhenotype(genotype);

/* ========================
   ปุ่มต่าง ๆ
======================== */
document.querySelector(".back-btn").addEventListener("click", () => {
  window.electronAPI.navigate('verify_step2');
});

document.querySelector(".confirm-btn").addEventListener("click", () => {
  alert("✅ ยืนยันข้อมูลเรียบร้อยแล้ว!");
  window.electronAPI.navigate('patient');
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
