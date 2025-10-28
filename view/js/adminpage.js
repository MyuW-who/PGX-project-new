const userForm = document.getElementById("user-form");
const userTableBody = document.querySelector("#user-table tbody");
const formMessage = document.getElementById("form-message");
const logoutBtn = document.getElementById("logout-btn");
const togglePasswordButtons = document.querySelectorAll(".toggle-password");
const themeToggle = document.getElementById("themeToggle");
const langToggle = document.getElementById("langToggle");
const dropdownBtn = document.getElementById("dropdownBtn");
const dropdownMenu = document.getElementById("dropdownMenu");

let users = [];
let isEditing = false;
let editingUserId = null;

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

function userExists(username) {
  return users.some((user) => user.username === username && user.user_id !== editingUserId);
}

function setFormMode(mode, userData = null) {
  const submitBtn = userForm.querySelector('button[type="submit"]');
  isEditing = mode === 'edit';
  editingUserId = isEditing ? userData.user_id : null;

  if (isEditing && userData) {
    userForm.username.value = userData.username;
    userForm.hospital_id.value = userData.hospital_id;
    userForm.role.value = userData.role;
    userForm.password.required = false;
    submitBtn.textContent = 'บันทึกการแก้ไข';
  } else {
    userForm.reset();
    userForm.password.required = true;
    submitBtn.textContent = 'เพิ่มผู้ใช้งาน';
  }
}

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
  
  if (isEditing) {
    userData.user_id = editingUserId;
  }

  if (!userData.username || (!isEditing && !userData.password) || !userData.hospital_id || !userData.role) {
    showMessage("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
    return;
  }

  try {
    // If it's a new user or password is being changed, hash it
    if (userData.password) {
      userData.password_hash = await hashPassword(userData.password);
      delete userData.password; // Remove plain text password
    }

    let result;
    if (isEditing) {
      result = await window.electronAPI.updateAccount(userData);
      if (result.success) {
        showMessage("อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว");
      } else {
        throw new Error(result.message);
      }
    } else {
      result = await window.electronAPI.createAccount(userData);
      if (result.success) {
        showMessage("เพิ่มผู้ใช้งานเรียบร้อยแล้ว");
      } else {
        throw new Error(result.message);
      }
    }

    await loadUsers();
    setFormMode('add');
  } catch (error) {
    console.error('Form submission error:', error);
    showMessage(error.message || "เกิดข้อผิดพลาดในการดำเนินการ", "error");
  }

  if (userExists(userData.username)) {
    showMessage("มี Username นี้อยู่แล้ว", "error");
    return;
  }

  try {
    let result;
    if (isEditing) {
      result = await window.electron.invoke('update-account', {
        userId: editingUserId,
        userData: {
          username: userData.username,
          hospital_id: userData.hospital_id,
          role: userData.role
        }
      });
    } else {
      result = await window.electron.invoke('create-account', userData);
    }

    if (result.success) {
      await loadUsers();
      setFormMode('add');
      showMessage(result.message);
    } else {
      showMessage(result.message, 'error');
    }
  } catch (error) {
    showMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
  }
});

userTableBody.addEventListener("click", async (event) => {
  const target = event.target;
  const action = target.dataset.action;
  const userId = target.dataset.id;

  if (!action || !userId) return;

  if (action === 'edit') {
    const user = users.find(u => u.user_id === parseInt(userId));
    if (user) {
      setFormMode('edit', user);
      showMessage('กำลังแก้ไขข้อมูลผู้ใช้');
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
  try {
    if (window.electronAPI?.invoke) {
      await window.electronAPI.invoke("logout");
    } else if (window.electronAPI?.logout) {
      await window.electronAPI.logout();
    }
  } catch (error) {
    console.error("Logout error:", error);
  }
});

dropdownBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  dropdownMenu?.classList.toggle("show");
});

dropdownMenu?.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", () => {
  dropdownMenu?.classList.remove("show");
});

themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
});

langToggle?.addEventListener("click", () => {
  const current = langToggle.textContent.trim();
  langToggle.textContent = current === "TH" ? "EN" : "TH";
});

// Initialize the page
loadUsers();

