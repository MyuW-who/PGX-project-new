/* ============================================
   👥 ADMIN PAGE - USER MANAGEMENT
   ============================================ */

let userForm;
let userTableBody;
let formMessage;
let logoutBtn;
let togglePasswordButtons;
let themeToggle;
let langToggle;
let dropdownBtn;
let dropdownMenu;

// Modal elements
let editModal;
let editForm;
let editFormMessage;
let closeModalBtn;
let cancelEditBtn;

let users = [];
let isEditing = false;
let editingUserId = null;

/* ============================================
   � USER FORM FUNCTIONS
   ============================================ */

function clearFormMessage() {
  formMessage.textContent = "";
  formMessage.className = "form-message";
}

function showFormMessage(msg, type = "success") {
  formMessage.textContent = msg;
  formMessage.className = `form-message ${type}`;
  setTimeout(clearFormMessage, 3000);
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
  userTableBody.innerHTML = users
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
    const result = await window.electron.invoke('fetch-all-accounts');
    users = result || [];
    renderUsers();
  } catch (error) {
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

/* ============================================
   🎯 EVENT LISTENERS INITIALIZATION
   ============================================ */

function initializeEventListeners() {
  // Add new user form submission
  userForm.addEventListener("submit", async (event) => {
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
  editForm.addEventListener("submit", async (event) => {
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

      if (password && password.trim()) {
        userData.password_hash = await hashPassword(password);
      }

      const result = await window.electronAPI.updateAccount(userData);
      
      if (result.success) {
        showEditMessage("แก้ไขผู้ใช้งานเรียบร้อยแล้ว");
        await loadUsers();
        setTimeout(() => {
          closeEditModal();
        }, 1500);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Edit form error:', error);
      showEditMessage(error.message || "เกิดข้อผิดพลาดในการดำเนินการ", "error");
    }
  });

  // Modal event listeners
  closeModalBtn.addEventListener('click', closeEditModal);
  cancelEditBtn.addEventListener('click', closeEditModal);

  // Close modal when clicking outside
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      closeEditModal();
    }
  });

  // Table row click handler
  userTableBody.addEventListener("click", async (event) => {
    const target = event.target;
    const action = target.dataset.action;
    const userId = target.dataset.id;

    if (!action || !userId) return;

    if (action === 'edit') {
      const user = users.find(u => u.user_id === parseInt(userId));
      if (user) {
        openEditModal(user);
      }
    } else if (action === 'delete') {
      if (confirm('คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่?')) {
        try {
          const result = await window.electron.invoke('delete-account', userId);
          if (result.success) {
            await loadUsers();
            showMessage(result.message);
          } else {
            showMessage(result.message, 'error');
          }
        } catch (error) {
          showMessage('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
        }
      }
    }
  });

  // Toggle password visibility
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
}

/* ============================================
   🔄 PAGE INITIALIZATION
   ============================================ */

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Initialize DOM elements
  userForm = document.getElementById("user-form");
  userTableBody = document.querySelector("#user-table tbody");
  formMessage = document.getElementById("form-message");
  logoutBtn = document.getElementById("logout");
  togglePasswordButtons = document.querySelectorAll(".toggle-password");
  themeToggle = document.getElementById("themeToggle");
  langToggle = document.getElementById("langToggle");
  dropdownBtn = document.getElementById("dropdownBtn");
  dropdownMenu = document.getElementById("dropdownMenu");
  
  // Modal elements
  editModal = document.getElementById("editModal");
  editForm = document.getElementById("edit-user-form");
  editFormMessage = document.getElementById("edit-form-message");
  closeModalBtn = document.getElementById("closeModal");
  cancelEditBtn = document.getElementById("cancelEdit");
  
  // Initialize user profile (from userProfile.js)
  if (!initializeUserProfile()) return;
  
  // Initialize event listeners
  initializeEventListeners();
  
  // Load users if authenticated
  loadUsers();
});

