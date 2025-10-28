// ===============================
// 🌐 Language Data
// ===============================
const langData = {
  en: {
    username: "Username",
    password: "Password",
    placeholderUser: "Enter your username",
    placeholderPass: "Enter your password",
    loginBtn: "Login",
  },
  th: {
    username: "ชื่อผู้ใช้",
    password: "รหัสผ่าน",
    placeholderUser: "กรอกชื่อผู้ใช้",
    placeholderPass: "กรอกรหัสผ่าน",
    loginBtn: "เข้าสู่ระบบ",
  },
};

// ===============================
// 🔧 Element References
// ===============================
const elements = {
  labelUsername: document.getElementById("label-username"),
  labelPassword: document.getElementById("label-password"),
  usernameInput: document.getElementById("username"),
  passwordInput: document.getElementById("password"),
  btnLogin: document.getElementById("btn-login"),
  popup: document.getElementById("popup"),
  btnEn: document.getElementById("lang-en"),
  btnTh: document.getElementById("lang-th"),
};

// ===============================
// 🌐 Language Switcher
// ===============================
function setLanguage(lang) {
  const text = langData[lang];
  elements.labelUsername.textContent = text.username;
  elements.labelPassword.textContent = text.password;
  elements.usernameInput.placeholder = text.placeholderUser;
  elements.passwordInput.placeholder = text.placeholderPass;
  elements.btnLogin.textContent = text.loginBtn;

  elements.btnEn.classList.toggle("active", lang === "en");
  elements.btnTh.classList.toggle("active", lang === "th");
}

// Default language = English
setLanguage("en");
elements.btnEn.addEventListener("click", () => setLanguage("en"));
elements.btnTh.addEventListener("click", () => setLanguage("th"));

// ===============================
// 🧩 Popup Utility Function
// ===============================
function showPopup(message) {
  const popup = elements.popup;
  popup.textContent = message;
  popup.classList.add("show");
  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.remove("show");
    popup.classList.add("hidden");
  }, 2200);
}

// ===============================
// 🔐 Login Event Handler
// ===============================
elements.btnLogin.addEventListener("click", async (e) => {
  e.preventDefault();

  const username = elements.usernameInput.value.trim();
  const password = elements.passwordInput.value.trim();

  // 🔸 Validation: Empty Fields
  if (!username || !password) {
    showPopup("Please fill in username and password");
    return;
  }

  try {
    // ✅ ตรวจสอบข้อมูลผ่าน Electron API
    const result = await window.electronAPI.checkLogin(username, password);

    if (!result.success) {
      showPopup(result.message || "Incorrect username or password");
      return;
    }

    // ✅ ตรวจสอบ role แล้วนำทางไปหน้า dashboard ที่ถูกต้อง
    const role = result.role;
    localStorage.setItem("userRole", role);

    if (role === "medtech") {
      window.electronAPI.navigate("dashboard1");
    } else if (role === "pharmacist") {
      window.electronAPI.navigate("dashboard2");
    } else if (role === "admin") {
      window.electronAPI.navigate("adminpage");
    } else {
      showPopup(`Role "${role}" is not assigned to any dashboard`);
      return;
    }

    // แสดงข้อความสำเร็จ (ชั่วคราว)
    showPopup("Login successful!");
  } catch (error) {
    console.error("Login error:", error);
    showPopup("Connection error. Please try again later.");
  }
});

// ===============================
// 🧪 (Optional) Local Testing Mode
// ใช้เมื่อไม่มี Electron API
// ===============================
if (!window.electronAPI) {
  window.electronAPI = {
    checkLogin: async (user, pass) => {
      // mock data สำหรับทดสอบ
      if (user === "admin" && pass === "1234")
        return { success: true, role: "admin" };
      if (user === "med" && pass === "1234")
        return { success: true, role: "medtech" };
      if (user === "pharma" && pass === "1234")
        return { success: true, role: "pharmacist" };
      return { success: false, message: "Invalid username or password" };
    },
    navigate: (page) => {
      console.log(`🧭 navigating to: ${page}`);
    },
  };
}
