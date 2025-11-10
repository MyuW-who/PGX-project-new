/* ============================================
   🔐 SESSION MANAGEMENT FUNCTIONS
   ============================================ */

// Get current user from session
function getCurrentUser() {
  try {
    const sessionData = sessionStorage.getItem('currentUser');
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('❌ Error reading current user:', error);
    return null;
  }
}

// Check authentication and redirect if not logged in
function checkAuthentication() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log('🚫 No authenticated user found, redirecting to login...');
    window.electronAPI.navigate('login');
    return false;
  }
  return true;
}

// Update user display in header
function updateUserDisplay() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    const dropdownBtn = document.getElementById('dropdownBtn');
    if (dropdownBtn) {
      dropdownBtn.innerHTML = `
        <i class="fa fa-user-circle"></i> ${currentUser.username} (${currentUser.role}) <i class="fa fa-caret-down"></i>
      `;
    }
    
    if (currentUser.hospital_id) {
      console.log('🏥 Hospital:', currentUser.hospital_id);
    }
  }
}

/* ============================================
   🧭 NAVIGATION HANDLERS
   ============================================ */

// Logout handler
const logoutBtn = document.getElementById('logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear();
    console.log('🚪 User logged out');
    window.electronAPI.navigate('login');
  });
}

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

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Admin Settings page loaded');
  
  if (!checkAuthentication()) {
    return;
  }
  
  updateUserDisplay();
});

renderCategoryOptions();
categoryForm.addEventListener("submit", handleCategorySubmit);
tatForm.addEventListener("submit", handleTatSubmit);
specimenForm.addEventListener("submit", handleSpecimenSubmit);

const profileDropdown = document.querySelector('.dropdown');
const profileToggle = document.querySelector('.dropdown-toggle');

if (profileDropdown && profileToggle) {
  profileToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    profileDropdown.classList.toggle('open');
  });

  document.addEventListener('click', (event) => {
    if (!profileDropdown.contains(event.target)) {
      profileDropdown.classList.remove('open');
    }
  });
}

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