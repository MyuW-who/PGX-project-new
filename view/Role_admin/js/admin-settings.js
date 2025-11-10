const categories = [
  { id: "ngs", name: "NGS Panel", code: "NGS-01", tat: 7 },
  { id: "qpcr", name: "qPCR", code: "QPCR-02", tat: 3 },
  { id: "histology", name: "Histology", code: "HIS-05", tat: 10 }
];

const categoryForm = document.getElementById("categoryForm");
const tatForm = document.getElementById("tatForm");
const specimenForm = document.getElementById("specimenForm");
const tatCategorySelect = document.getElementById("tatCategory");
const specimenCategorySelect = document.getElementById("specimenCategory");

function renderCategoryOptions() {
  if (!tatCategorySelect || !specimenCategorySelect) return;
  const options = categories
    .map(cat => `<option value="${cat.id}">${cat.name}</option>`)
    .join("");
  tatCategorySelect.innerHTML = `<option selected disabled value="">เลือกหมวดหมู่...</option>${options}`;
  specimenCategorySelect.innerHTML = `<option selected disabled value="">เลือกหมวดหมู่...</option>${options}`;
}

function handleCategorySubmit(event) {
  event.preventDefault();
  const formData = new FormData(categoryForm);
  const newCategory = {
    id: formData.get("code")?.toString().toLowerCase() || crypto.randomUUID(),
    name: formData.get("name"),
    code: formData.get("code"),
    tat: Number(formData.get("tat"))
  };
  categories.push(newCategory);
  renderCategoryOptions();
  alert("บันทึกหมวดหมู่สำเร็จ");
  categoryForm.reset();
}

function handleTatSubmit(event) {
  event.preventDefault();
  const formData = new FormData(tatForm);
  const selectedId = formData.get("category");
  const newTat = Number(formData.get("tat"));
  const target = categories.find(cat => cat.id === selectedId);
  if (target) {
    target.tat = newTat;
    alert(`อัปเดต TAT ของ ${target.name} เป็น ${newTat} วันแล้ว`);
    tatForm.reset();
  } else {
    alert("ไม่พบหมวดหมู่ที่เลือก");
  }
}

function handleSpecimenSubmit(event) {
  event.preventDefault();
  const formData = new FormData(specimenForm);
  const payload = {
    name: formData.get("name"),
    category: formData.get("category"),
    remark: formData.get("remark")
  };
  console.log("เพิ่มสิ่งส่งตรวจ:", payload);
  alert("เพิ่มข้อมูลสิ่งส่งตรวจเรียบร้อย");
  specimenForm.reset();
}

if (categoryForm) {
  categoryForm.addEventListener("submit", handleCategorySubmit);
}
if (tatForm) {
  tatForm.addEventListener("submit", handleTatSubmit);
}
if (specimenForm) {
  specimenForm.addEventListener("submit", handleSpecimenSubmit);
}

renderCategoryOptions();

const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    const icon = themeToggle.querySelector("i");
    if (!icon) return;
    const dark = document.body.classList.contains("dark-theme");
    icon.className = dark ? "fa-solid fa-sun" : "fa-solid fa-moon";
  });
}

const accountDropdown = document.getElementById("accountDropdown");
const accountToggle = accountDropdown?.querySelector(".dropdown-toggle");

if (accountDropdown && accountToggle) {
  accountToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    accountDropdown.classList.toggle("is-open");
  });

  document.addEventListener("click", (event) => {
    if (!accountDropdown.contains(event.target)) {
      accountDropdown.classList.remove("is-open");
    }
  });
}
