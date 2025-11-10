/* ============================================
   ⚙️ ADMIN SETTINGS PAGE
   ============================================
   Manage categories, specimens, and TAT settings
   Uses userProfile.js for session management
   ============================================ */

/* ============================================
   📋 CATEGORY MANAGEMENT
   ============================================ */

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

/* ============================================
   🚀 INITIALIZATION
   ============================================ */

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Admin Settings page loaded');
  
  // Initialize user profile (includes auth check and UI setup)
  if (!initializeUserProfile()) {
    return; // User not authenticated, redirected to login
  }
});

// Event listeners for forms
categoryForm.addEventListener("submit", handleCategorySubmit);
tatForm.addEventListener("submit", handleTatSubmit);
specimenForm.addEventListener("submit", handleSpecimenSubmit);

// Initialize category options
renderCategoryOptions();