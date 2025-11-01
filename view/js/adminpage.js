const userForm = document.getElementById("user-form");
const userTableBody = document.querySelector("#user-table tbody");
const formMessage = document.getElementById("form-message");
const logoutBtn = document.getElementById("logout");
const togglePasswordButtons = document.querySelectorAll(".toggle-password");
const langToggle = document.getElementById("langToggle");
const dropdownBtn = document.getElementById("dropdownBtn");
const dropdownMenu = document.getElementById("dropdownMenu");

// Modal elements
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("edit-user-form");
const editFormMessage = document.getElementById("edit-form-message");
const closeModalBtn = document.getElementById("closeModal");
const cancelEditBtn = document.getElementById("cancelEdit");

let users = [];
let isEditing = false;
let editingUserId = null;

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
    // Update dropdown button with user info
    const dropdownBtn = document.getElementById('dropdownBtn');
    if (dropdownBtn) {
      dropdownBtn.innerHTML = `
        <i class="fa fa-user-circle"></i> ${currentUser.username} (${currentUser.role}) <i class="fa fa-caret-down"></i>
      `;
    }
    
    // Log hospital info if available
    if (currentUser.hospital_id) {
      console.log('🏥 Hospital:', currentUser.hospital_id);
    }
  }
}

// Hash password using bcrypt through IPC
async function hashPassword(password) {
  return await window.electronAPI.invoke('hash-password', password);
}

const roleLabels = {
  pharmacist: "Pharmacist",
  medtech: "MedTech",
};

function renderUsers() {
  console.log('🎨 Rendering users:', users.length, 'users');
  
  // Get fresh reference to tbody element
  const tbody = document.querySelector("#user-table tbody");
  
  if (!tbody) {
    console.error('❌ Table tbody not found!');
    return;
  }
  
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#666;">ไม่มีข้อมูลผู้ใช้งาน</td></tr>';
    return;
  }
  
  tbody.innerHTML = users
    .map(
      (user) => `
      <tr data-id="${user.user_id}">
        <td>${user.username}</td>
        <td>${user.hospital_id}</td>
        <td>${roleLabels[user.role] ?? user.role}</td>
        <td>
          <div class="button-group">
            <button type="button" class="table-action edit" data-action="edit" data-id="${user.user_id}">
              แก้ไข
            </button>
            <button type="button" class="table-action delete" data-action="delete" data-id="${user.user_id}">
              ลบ
            </button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");
  
  console.log('✅ Users rendered successfully');
}

function showMessage(message, type = "success") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

function resetMessage() {
  formMessage.textContent = "";
  formMessage.className = "form-message";
}

async function loadUsers() {
  try {
    const result = await window.electronAPI.fetchAllAccounts();
    console.log('📦 Loaded users:', result);
    users = result || [];
    renderUsers();
  } catch (error) {
    console.error('❌ Error loading users:', error);
    showMessage('ไม่สามารถโหลดข้อมูลผู้ใช้ได้', 'error');
  }
}

function userExists(username, excludeUserId = null) {
  return users.some((user) => user.username === username && user.user_id !== excludeUserId);
}

// Show message in main form
function showMessage(message, type = "success") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

function resetMessage() {
  formMessage.textContent = "";
  formMessage.className = "form-message";
}

// Show message in edit modal
function showEditMessage(message, type = "success") {
  editFormMessage.textContent = message;
  editFormMessage.className = `form-message ${type}`;
}

function resetEditMessage() {
  editFormMessage.textContent = "";
  editFormMessage.className = "form-message";
}

// Modal functions
function openEditModal(user) {
  document.getElementById('edit-user-id').value = user.user_id;
  document.getElementById('edit-username').value = user.username;
  document.getElementById('edit-password').value = '';
  document.getElementById('edit-hospital-id').value = user.hospital_id;
  document.getElementById('edit-role').value = user.role;
  
  resetEditMessage();
  editModal.classList.add('show');
}

function closeEditModal() {
  editModal.classList.remove('show');
  editForm.reset();
  resetEditMessage();
}

// Add new user form submission
userForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetMessage();

  const formData = new FormData(userForm);
  const userData = {
    username: formData.get("username").trim(),
    password: formData.get("password"),
    hospital_id: parseInt(formData.get("hospital_id").trim(), 10),
    role: formData.get("role"),
  };

  if (!userData.username || !userData.password || !userData.hospital_id || !userData.role) {
    showMessage("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
    return;
  }

  if (userExists(userData.username)) {
    showMessage("มี Username นี้อยู่แล้ว", "error");
    return;
  }

  try {
    // Hash password
    userData.password_hash = await hashPassword(userData.password);
    delete userData.password;

    const result = await window.electronAPI.createAccount(userData);
    
    if (result.success) {
      showMessage("เพิ่มผู้ใช้งานเรียบร้อยแล้ว");
      await loadUsers();
      userForm.reset();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Form submission error:', error);
    showMessage(error.message || "เกิดข้อผิดพลาดในการดำเนินการ", "error");
  }
});

// Edit user form submission
editForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetEditMessage();

  const userId = document.getElementById('edit-user-id').value;
  const password = document.getElementById('edit-password').value;
  const hospital_id = parseInt(document.getElementById('edit-hospital-id').value, 10);
  const role = document.getElementById('edit-role').value;

  if (!hospital_id || !role) {
    showEditMessage("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
    return;
  }

  try {
    const userData = {
      user_id: userId,
      hospital_id: hospital_id,
      role: role
    };

    // If password is provided, hash it
    if (password && password.trim()) {
      userData.password_hash = await hashPassword(password);
    }

    const result = await window.electronAPI.updateAccount(userData);
    
    if (result.success) {
      showEditMessage("อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว", "success");
      await loadUsers();
      
      // Close modal after 1 second
      setTimeout(() => {
        closeEditModal();
      }, 1000);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Edit form submission error:', error);
    showEditMessage(error.message || "เกิดข้อผิดพลาดในการอัปเดต", "error");
  }
});

// Modal event listeners
closeModalBtn?.addEventListener('click', closeEditModal);
cancelEditBtn?.addEventListener('click', closeEditModal);

// Close modal when clicking outside
editModal?.addEventListener('click', (e) => {
  if (e.target === editModal) {
    closeEditModal();
  }
});

// Table row click handler - Use event delegation
document.addEventListener("click", async (event) => {
  const tableTarget = event.target;
  if (!tableTarget.closest('#user-table')) return;
  
  const action = tableTarget.dataset.action;
  const userId = tableTarget.dataset.id;

  if (!action || !userId) return;

  if (action === 'edit') {
    const user = users.find(u => u.user_id === parseInt(userId));
    if (user) {
      openEditModal(user);
    }
  } else if (action === 'delete') {
    if (confirm('คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่?')) {
      try {
        const result = await window.electronAPI.deleteAccount(userId);
        if (result.success) {
          await loadUsers();
          showMessage(result.message);
        } else {
          showMessage(result.message, 'error');
        }
      } catch (error) {
        console.error('❌ Delete error:', error);
        showMessage('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
      }
    }
  }
});

togglePasswordButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;
    const willShow = input.type === "password";
    input.type = willShow ? "text" : "password";
    button.classList.toggle("is-visible", willShow);
    button.setAttribute(
      "aria-label",
      willShow ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"
    );
  });
});

logoutBtn?.addEventListener("click", async () => {
  const confirmLogout = confirm('คุณต้องการออกจากระบบหรือไม่?');
  if (!confirmLogout) return;

  try {
    // Clear user session
    localStorage.removeItem('userSession');
    sessionStorage.clear();
    
    // Navigate to login
    window.electronAPI.navigate('login');
  } catch (error) {
    console.error("Logout error:", error);
    // Still redirect to login even if there's an error
    window.electronAPI.navigate('login');
  }
});

/* ============================================
   ⚙️ SETTINGS POPUP HANDLERS
   ============================================ */

const settingsPopup = document.getElementById('settingsPopup');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const cancelSettings = document.getElementById('cancelSettings');
const settingsBtn = document.getElementById('settingsBtn');

// Open settings popup
settingsBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  settingsPopup.style.display = 'flex';
  const dropdownMenuElement = document.getElementById("dropdownMenu");
  dropdownMenuElement?.classList.remove('show');
});

// Close settings popup
closeSettings?.addEventListener('click', () => {
  settingsPopup.style.display = 'none';
});

cancelSettings?.addEventListener('click', () => {
  settingsPopup.style.display = 'none';
});

// Save settings
saveSettings?.addEventListener('click', () => {
  const language = document.getElementById('languageSetting').value;
  const theme = document.getElementById('themeSetting').value;
  const notifications = document.getElementById('notificationsSetting').checked;
  
  console.log('Settings saved:', { language, theme, notifications });
  
  // Apply theme immediately if changed
  
  settingsPopup.style.display = 'none';
});

// Close popup when clicking outside
settingsPopup?.addEventListener('click', (e) => {
  if (e.target === settingsPopup) {
    settingsPopup.style.display = 'none';
  }
});

/* ============================================
   🎨 DROPDOWN & THEME HANDLERS
   ============================================ */

// Get fresh references to dropdown elements
const dropdownButton = document.getElementById("dropdownBtn");
const dropdownMenuElement = document.getElementById("dropdownMenu");

dropdownButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  dropdownMenuElement?.classList.toggle("show");
});

dropdownMenuElement?.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", () => {
  dropdownMenuElement?.classList.remove("show");
});



langToggle?.addEventListener("click", () => {
  const current = langToggle.textContent.trim();
  langToggle.textContent = current === "TH" ? "EN" : "TH";
});

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication first
  if (!checkAuthentication()) return;
  
  // Update user display in header
  updateUserDisplay();
  
  // Load users if authenticated
  loadUsers();
});

