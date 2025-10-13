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



btn.addEventListener('click', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    popup.textContent = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน';
    popup.classList.remove('hidden');
    setTimeout(() => popup.classList.add('hidden'), 2000);
    return;
  }

  const result = await window.electronAPI.checkLogin(username, password);

  if (!result.success) {
    popup.textContent = result.message;
    popup.classList.remove('hidden');
    setTimeout(() => popup.classList.add('hidden'), 2000);
    return;
  }

  // ✅ ตรวจสอบ role แล้วเลือกหน้า dashboard
  const role = result.role;
  localStorage.setItem('userRole', role);

  if (role === 'medtech') {
    window.electronAPI.navigate('dashboard1'); 
  } else if (role === 'pharmacist') {
    window.electronAPI.navigate('dashboard2'); 
  } else {
    
    popup.textContent = `Role "${role}" ไม่มีหน้าที่กำหนด`;
    popup.classList.remove('hidden');
    setTimeout(() => popup.classList.add('hidden'), 2000);
  }
});
