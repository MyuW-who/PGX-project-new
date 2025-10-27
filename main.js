const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const bcrypt = require('bcryptjs');
const supabase = require('./supabase');
const { handleLogin } = require('./controllers/loginController');
const { generatePDF } = require('./controllers/pdfController');
const { fetchPatients, addPatient, searchPatientById, getPatientById, updatePatient, deletePatient } = require('./controllers/add_patient_controller');
const { 
  fetchAccountDetails, 
  fetchAllAccounts, 
  createAccount, 
  updateAccount 
} = require('./controllers/accountController');

// Password hashing configuration
const SALT_ROUNDS = 10;


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
  mainWindow.loadFile(path.join(__dirname, 'view', 'login.html'));
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

// 👤 Patient CRUD - get by id
ipcMain.handle('get-patient-by-id', async (event, patientId) => {
  try {
    return await getPatientById(patientId);
  } catch (err) {
    console.error('❌ Get Patient Error:', err.message);
    return null;
  }
});

// 👤 Patient CRUD - update
ipcMain.handle('update-patient', async (event, payload) => {
  try {
    const { patientId, data } = payload || {};
    const result = await updatePatient(patientId, data);
    return { success: true, data: result, message: 'อัปเดตข้อมูลสำเร็จ!' };
  } catch (err) {
    console.error('❌ Update Patient Error:', err.message);
    return { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ป่วย' };
  }
});

// 👤 Patient CRUD - delete
ipcMain.handle('delete-patient', async (event, patientId) => {
  try {
    const ok = await deletePatient(patientId);
    return { success: ok, message: ok ? 'ลบข้อมูลสำเร็จ!' : 'ไม่สามารถลบข้อมูลได้' };
  } catch (err) {
    console.error('❌ Delete Patient Error:', err.message);
    return { success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูลผู้ป่วย' };
  }
});

// 👥 Account Management Handlers
ipcMain.handle('fetch-account-details', async (event, userId) => {
  try {
    return await fetchAccountDetails(userId);
  } catch (err) {
    console.error('❌ Account Fetch Error:', err.message);
    return null;
  }
});

ipcMain.handle('fetch-all-accounts', async () => {
  try {
    return await fetchAllAccounts();
  } catch (err) {
    console.error('❌ Accounts Fetch Error:', err.message);
    return [];
  }
});

// Password hashing handler
ipcMain.handle('hash-password', async (event, password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (err) {
    console.error('❌ Password Hash Error:', err.message);
    throw err;
  }
});

ipcMain.handle('create-account', async (event, userData) => {
  try {
    const result = await createAccount(userData);
    return { success: true, data: result, message: 'บันทึกข้อมูลผู้ใช้สำเร็จ!' };
  } catch (err) {
    console.error('❌ Account Creation Error:', err.message);
    return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้' };
  }
});

ipcMain.handle('update-account', async (event, userData) => {
  try {
    const result = await updateAccount(userData);
    return { success: true, data: result, message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ!' };
  } catch (err) {
    console.error('❌ Account Update Error:', err.message);
    return { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตบัญชีผู้ใช้' };
  }
});

ipcMain.handle('delete-account', async (event, userId) => {
  try {
    await supabase
      .from('system_users')
      .delete()
      .eq('user_id', userId);
    return { success: true, message: 'ลบบัญชีผู้ใช้สำเร็จ!' };
  } catch (err) {
    console.error('❌ Account Deletion Error:', err.message);
    return { success: false, message: 'เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้' };
  }
});

// 🚀 เริ่มต้น
app.whenReady().then(createWindow);

// ❌ ปิดโปรแกรมเมื่อปิดหน้าต่าง (Windows/Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
