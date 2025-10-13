const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const bcrypt = require('bcryptjs');
const supabase = require('./supabase');
const { handleLogin } = require('./controllers/loginController');
const { generatePDF } = require('./controllers/pdfController');
const { fetchPatients, addPatient, searchPatientById } = require('./controllers/add_patient_Controller');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  // เริ่มต้นที่หน้า login
  mainWindow.loadFile(path.join(__dirname, 'view', 'patient.html'));
}

// 📩 ฟัง event จาก renderer เพื่อเปลี่ยนหน้า
ipcMain.on('navigate', (event, page) => {
  console.log(` Navigate to: ${page}`);
  mainWindow.loadFile(path.resolve(__dirname, 'view', `${page}.html`));
});

// 🔑 ฟังก์ชันตรวจสอบ Login (เรียกจาก controller)
ipcMain.handle('check-login', handleLogin);
// 📄 ฟังก์ชันสร้าง PDF (เรียกจาก controller)
ipcMain.handle('generate-pdf', async (event, reportData) => {
  return await generatePDF(reportData);
});

ipcMain.handle('get-patients', async () => {
  try {
    return await fetchPatients();
  } catch (err) {
    console.error('❌ Fetch Error:', err.message);
    return [];
  }
});

ipcMain.handle('add-patient', async (event, patientData) => {
  try {
    await addPatient(patientData);
    return { success: true, message: 'บันทึกข้อมูลสำเร็จ!' };
  } catch (err) {
    console.error('❌ Insert Error:', err.message);
    return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
  }
});

ipcMain.handle('search-patient', async (event, patientId) => {
  try {
    return await searchPatientById(patientId);
  } catch (err) {
    console.error('❌ Search Error:', err.message);
    return [];
  }
});
// 🚀 เริ่มต้น
app.whenReady().then(createWindow);

// ❌ ปิดโปรแกรมเมื่อปิดหน้าต่าง (Windows/Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
