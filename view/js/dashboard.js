// -------- ภาษา UI --------
const uiLang = {
  th: {
    logo: "แดชบอร์ด",
    home: "หน้าหลัก",
    report: "รายงาน",
    settings: "การตั้งค่า",
    profile: "โปรไฟล์",
    welcome: "สวัสดี, ผู้ใช้",
    overview: "ข้อมูลภาพรวม",
    sales: "ยอดขาย",
    users: "ผู้ใช้งาน",
    tasks: "งานที่ค้าง",
    theme: "เปลี่ยนธีม"
  },
  en: {
    logo: "Dashboard",
    home: "Home",
    report: "Reports",
    settings: "Settings",
    profile: "Profile",
    welcome: "Welcome, User",
    overview: "Overview",
    sales: "Sales",
    users: "Users",
    tasks: "Pending Tasks",
    theme: "Theme"
  },
};

let currentLang = "th";

// ฟังก์ชันเปลี่ยนภาษาเฉพาะ UI
function switchLanguage(lang) {
  currentLang = lang;
  const texts = uiLang[lang];

  for (const key in texts) {
    const el = document.querySelector(`[data-key="${key}"]`) || document.getElementById(key);
    if (el) el.textContent = texts[key];
  }

  document.getElementById("themeToggle").textContent = texts.theme;
  document.getElementById("langToggle").textContent = lang === "th" ? "EN" : "TH";
}

// -------- ปุ่มธีม --------
const btnTheme = document.getElementById("themeToggle");
btnTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// -------- ปุ่มสลับภาษา --------
const btnLang = document.getElementById("langToggle");
btnLang.addEventListener("click", () => {
  const newLang = currentLang === "th" ? "en" : "th";
  switchLanguage(newLang);
});

document.getElementById('logout').addEventListener('click', (e) => {
  e.preventDefault();
  window.electronAPI.navigate('login');
});


// โหลดครั้งแรก
switchLanguage("th");

