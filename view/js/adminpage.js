const userForm = document.getElementById("user-form");
const userTableBody = document.querySelector("#user-table tbody");
const formMessage = document.getElementById("form-message");

let users = [];

const roleLabels = {
  pharmacist: "Pharmacist",
  medtech: "MedTech",
};

function renderUsers() {
  userTableBody.innerHTML = users
    .map(
      (user) => `
      <tr data-username="${user.username}">
        <td>${user.username}</td>
        <td>${user.hospital_id}</td>
        <td>${roleLabels[user.role] ?? user.role}</td>
        <td>
          <button type="button" class="table-action" data-action="delete" data-username="${user.username}">
            ลบ
          </button>
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

function userExists(username) {
  return users.some((user) => user.username === username);
}

userForm.addEventListener("submit", (event) => {
  event.preventDefault();
  resetMessage();

  const formData = new FormData(userForm);
  const newUser = {
    username: formData.get("username").trim(),
    password: formData.get("password"),
    hospital_id: formData.get("hospital_id").trim(),
    role: formData.get("role"),
  };

  if (!newUser.username || !newUser.password || !newUser.hospital_id || !newUser.role) {
    showMessage("กรุณากรอกข้อมูลให้ครบถ้วน", "error");
    return;
  }

  if (userExists(newUser.username)) {
    showMessage("มี Username นี้อยู่แล้ว", "error");
    return;
  }

  users.push(newUser);
  renderUsers();
  userForm.reset();
  showMessage("เพิ่มผู้ใช้งานเรียบร้อยแล้ว");
  // TODO: เชื่อมต่อ API ฝั่งเซิร์ฟเวอร์เพื่อบันทึกข้อมูลจริง
});

userTableBody.addEventListener("click", (event) => {
  const target = event.target;
  if (target.matches("[data-action='delete']")) {
    const username = target.dataset.username;
    users = users.filter((user) => user.username !== username);
    renderUsers();
    showMessage(`ลบผู้ใช้งาน ${username} แล้ว`);
    // TODO: เชื่อมต่อ API ฝั่งเซิร์ฟเวอร์เพื่ออัปเดตข้อมูลจริง
  }
});

// TODO: ดึงรายชื่อผู้ใช้งานจาก API เมื่อเชื่อมต่อกับ backend
// async function loadUsers() {
//   const response = await fetch("/api/users");
//   users = await response.json();
//   renderUsers();
// }
// loadUsers();

renderUsers();

