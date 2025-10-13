const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const bcrypt = require('bcryptjs');
const supabase = require('./supabase');
const { handleLogin } = require('./controllers/loginController');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });

  // เริ่มต้นที่หน้า login
  mainWindow.loadFile(path.join(__dirname, 'view', 'verify_step1.html'));
}

// 📩 ฟัง event จาก renderer เพื่อเปลี่ยนหน้า
ipcMain.on('navigate', (event, page) => {
  console.log(` Navigate to: ${page}`);
  mainWindow.loadFile(path.resolve(__dirname, 'view', `${page}.html`));
});

// 🔑 ฟังก์ชันตรวจสอบ Login (เรียกจาก controller)
ipcMain.handle('check-login', handleLogin);

// 🚀 เริ่มต้น
app.whenReady().then(createWindow);

// ❌ ปิดโปรแกรมเมื่อปิดหน้าต่าง (Windows/Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
