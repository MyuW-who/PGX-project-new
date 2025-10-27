const userForm = document.getElementById("user-form");
const userTableBody = document.querySelector("#user-table tbody");
const formMessage = document.getElementById("form-message");

let users = [];
let isEditing = false;
let editingUserId = null;

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

  if (!userData.username || (!isEditing && !userData.password) || !userData.hospital_id || !userData.role) {
    showMessage("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
    return;
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

// Initialize the page
loadUsers();

