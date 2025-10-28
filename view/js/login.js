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

// Helper function to save user data
function saveUserToStorage(user, role) {
  try {
    if (user) localStorage.setItem('currentUser', JSON.stringify(user));
    if (role) localStorage.setItem('userRole', role);
  } catch (err) {
    console.warn('Failed to save user to localStorage', err);
  }
}

const elements = {
  labelUsername: document.getElementById("label-username"),
  labelPassword: document.getElementById("label-password"),
  usernameInput: document.getElementById("username"),
  passwordInput: document.getElementById("password"),
  btnLogin: document.getElementById("btn-login"),
};

const btnEn = document.getElementById("lang-en");
const btnTh = document.getElementById("lang-th");

function setLanguage(lang) {
  const text = langData[lang];
  elements.labelUsername.textContent = text.username;
  elements.labelPassword.textContent = text.password;
  elements.usernameInput.placeholder = text.placeholderUser;
  elements.passwordInput.placeholder = text.placeholderPass;
  elements.btnLogin.textContent = text.loginBtn;

  // update button state
  btnEn.classList.toggle("active", lang === "en");
  btnTh.classList.toggle("active", lang === "th");
}

// default: English
setLanguage("en");

btnEn.addEventListener("click", () => setLanguage("en"));
btnTh.addEventListener("click", () => setLanguage("th"));


// renderer/login.js
const popup = document.getElementById('popup');
const btn = document.getElementById('btn-login');



function showPopup(text, ms = 2000) {
  if (!popup) return;
  popup.textContent = text;
  popup.classList.remove('hidden');
  setTimeout(() => popup.classList.add('hidden'), ms);
}

btn.addEventListener('click', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    showPopup('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
    return;
  }

  btn.disabled = true;
  try {
    const checkFn = window.api?.checkLogin || window.electronAPI?.checkLogin;
    if (!checkFn) throw new Error('IPC checkLogin not available');

    const result = await checkFn({ username, password });

    if (!result || !result.success) {
      showPopup(result?.message || 'Login failed');
      return;
    }

    // Extract and normalize user data
    const user = result.user || result.data?.user || null;
    const role = user?.role || result.role || null;

    // Save user data
    saveUserToStorage(user, role);

    // Navigate based on role
    const navigate = window.api?.navigate || window.electronAPI?.navigate;
    if (role === 'medtech') {
      navigate ? navigate('dashboard1') : window.location.href = '../dashboard1.html';
    } else if (role === 'pharmacist') {
      navigate ? navigate('dashboard2') : window.location.href = '../dashboard2.html';
    } else if (role === 'admin') {
      navigate ? navigate('adminpage') : window.location.href = '../adminpage.html';
    } else {
      showPopup(`Role "${role}" ไม่มีหน้าที่กำหนด`);
    }
  } catch (err) {
    console.error('Login error:', err);
    showPopup(err.message || 'เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ');
  } finally {
    btn.disabled = false;
  }
});
