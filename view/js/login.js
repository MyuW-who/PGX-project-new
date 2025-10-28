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


// renderer/login.js
const popup = document.getElementById('popup');
const btn = document.getElementById('btn-login');

/* ============================================
   � POPUP NOTIFICATION FUNCTIONS
   ============================================ */

// Show popup message
function showPopup(message, duration = 3000) {
  popup.textContent = message;
  popup.classList.remove('hidden');
  setTimeout(() => popup.classList.add('hidden'), duration);
}

// Hide popup
function hidePopup() {
  popup.classList.add('hidden');
}

/* ============================================
   �🔐 SESSION MANAGEMENT FUNCTIONS
   ============================================ */

// Store user session data
function storeUserSession(userData) {
  const sessionData = {
    user_id: userData.user_id,
    username: userData.username,
    role: userData.role,
    hospital_id: userData.hospital_id,
    loginTime: new Date().toISOString(),
    sessionId: generateSessionId()
  };
  
  // Store in localStorage for persistence
  localStorage.setItem('userSession', JSON.stringify(sessionData));
  
  // Store in sessionStorage for current tab only
  sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
  
  console.log('✅ User session stored:', sessionData.username, sessionData.role);
  return sessionData;
}

// Generate unique session ID
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get stored user session
function getUserSession() {
  try {
    const sessionData = localStorage.getItem('userSession');
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('❌ Error reading user session:', error);
    return null;
  }
}

// Clear user session
function clearUserSession() {
  localStorage.removeItem('userSession');
  localStorage.removeItem('userRole'); // Remove old role storage
  sessionStorage.removeItem('currentUser');
  console.log('🗑️ User session cleared');
}

// Check if user session is valid
function isSessionValid(sessionData) {
  if (!sessionData || !sessionData.loginTime) return false;
  
  const loginTime = new Date(sessionData.loginTime);
  const now = new Date();
  const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
  
  // Session expires after 24 hours
  return hoursSinceLogin < 24;
}

// Auto-login if valid session exists
function checkExistingSession() {
  const sessionData = getUserSession();
  
  if (sessionData && isSessionValid(sessionData)) {
    console.log('🔄 Valid session found, auto-login for:', sessionData.username);
    
    // Update session storage
    sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
    
    // Navigate to appropriate dashboard
    navigateBasedOnRole(sessionData.role);
    return true;
  } else if (sessionData) {
    console.log('⏰ Session expired, clearing...');
    clearUserSession();
  }
  
  return false;
}

// Navigate based on user role
function navigateBasedOnRole(role) {
  if (role === 'medtech') {
    window.electronAPI.navigate('dashboard1'); 
  } else if (role === 'pharmacist') {
    window.electronAPI.navigate('dashboard2'); 
  } else if (role === 'admin') {
    window.electronAPI.navigate('adminpage');
  } else {
    console.warn('❌ Unknown role:', role);
    popup.textContent = `Role "${role}" ไม่มีหน้าที่กำหนด`;
    popup.classList.remove('hidden');
    setTimeout(() => popup.classList.add('hidden'), 3000);
  }
}

/* ============================================
   🚪 LOGIN FORM HANDLER
   ============================================ */

btn.addEventListener('click', async (e) => {
  e.preventDefault();

  const username = elements.usernameInput.value.trim();
  const password = elements.passwordInput.value.trim();

  // 🔸 Validation: Empty Fields
  if (!username || !password) {
    showPopup("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
    return;
  }

  // Show loading state
  btn.disabled = true;
  btn.textContent = 'กำลังเข้าสู่ระบบ...';

  try {
    const result = await window.electronAPI.checkLogin(username, password);

    if (!result.success) {
      showPopup(result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      return;
    }

    // ✅ Store complete user session data
    const userData = result.data;
    
    storeUserSession(userData);
    
    // Navigate based on role
    navigateBasedOnRole(userData.role);
    
  } catch (error) {
    console.error('❌ Login error:', error);
    showPopup('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
  } finally {
    // Reset button state (only if login failed)
    btn.disabled = false;
    btn.textContent = 'เข้าสู่ระบบ';
  }
});

/* ============================================
   🔄 AUTO-LOGIN ON PAGE LOAD
   ============================================ */

// Check for existing session when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔍 Checking for existing user session...');
  
  // Check if URL has ?clear=true parameter to force clear session
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('clear') === 'true') {
    console.log('🗑️ Clearing session as requested...');
    clearUserSession();
    // Remove the parameter from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  if (!checkExistingSession()) {
    console.log('👋 No valid session found, showing login form');
    // Focus on username input for better UX
    setTimeout(() => {
      document.getElementById('username')?.focus();
    }, 100);
  }
});

// Add keyboard shortcut Ctrl+Shift+L to clear session (for development/testing)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'L') {
    console.log('🗑️ Keyboard shortcut detected - Clearing session...');
    clearUserSession();
    alert('Session cleared! Page will reload.');
    location.reload();
  }
});

/* ============================================
   🔧 UTILITY FUNCTIONS
   ============================================ */

// Get current user info (for other pages to use)
function getCurrentUser() {
  try {
    const sessionData = sessionStorage.getItem('currentUser');
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('❌ Error reading current user:', error);
    return null;
  }
}

// Update session data (for profile updates)
function updateUserSession(updates) {
  const currentSession = getUserSession();
  if (currentSession) {
    const updatedSession = { ...currentSession, ...updates };
    storeUserSession(updatedSession);
    return updatedSession;
  }
  return null;
}

// Export functions for use in other modules
window.userSession = {
  getCurrentUser,
  updateUserSession,
  clearUserSession,
  storeUserSession
};
