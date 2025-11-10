/* ============================================
   🔐 SESSION MANAGEMENT FUNCTIONS
   ============================================ */

// Get current user from session
function getCurrentUser() {
  try {
    const sessionData = sessionStorage.getItem('currentUser');
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    return null;
  }
}

// Check authentication and redirect if not logged in
function checkAuthentication() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log('🚫 No authenticated user found, redirecting to login...');
    window.electronAPI.navigate('login');
    return false;
  }
  return true;
}

// Update user display in header
function updateUserDisplay() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    const dropdownBtn = document.getElementById('dropdownBtn');
    if (dropdownBtn) {
      dropdownBtn.innerHTML = `
        <i class="fa fa-user-circle"></i> ${currentUser.username} (${currentUser.role}) <i class="fa fa-caret-down"></i>
      `;
    }
  }
}

/* ============================================
   🧭 NAVIGATION HANDLERS
   ============================================ */

// Logout handler
const logoutBtn = document.getElementById('logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear();
    console.log('🚪 User logged out');
    window.electronAPI.navigate('login');
  });
}

/* ============================================
   📋 SPECIMEN MANAGEMENT
   ============================================ */

const specimenForm = document.getElementById("specimenForm");
const specimenTableBody = document.querySelector("#specimen-table tbody");
const formMessage = document.getElementById("form-message");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");

let specimens = [];
let isEditMode = false;
let editingSpecimenId = null;

// Show message to user
function showMessage(message, type = 'success') {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
  formMessage.style.display = 'block';
  
  setTimeout(() => {
    formMessage.style.display = 'none';
  }, 3000);
}

// Fetch all specimens from database
async function fetchSpecimens() {
  try {
    const result = await window.electronAPI.getSpecimens();
    
    if (result.success) {
      specimens = result.data || [];
      renderSpecimens();
    } else {
      showMessage('ไม่สามารถโหลดข้อมูลได้', 'error');
    }
  } catch (error) {
    showMessage('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
  }
}

// Render specimens table
function renderSpecimens() {
  if (!specimenTableBody) {
    return;
  }
  
  if (!specimens || specimens.length === 0) {
    specimenTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:30px;color:#999;">ไม่มีข้อมูล</td></tr>';
    return;
  }
  
  specimenTableBody.innerHTML = specimens
    .map(specimen => `
      <tr data-id="${specimen.specimen_id}">
        <td><strong>${specimen.specimen_name}</strong></td>
        <td style="text-align: center;">${specimen.sla_time}</td>
        <td style="text-align: center;">
          <button class="btn-icon edit-btn" data-id="${specimen.specimen_id}" title="แก้ไข">
            <i class="fa fa-edit"></i>
          </button>
          <button class="btn-icon delete-btn" data-id="${specimen.specimen_id}" title="ลบ">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      </tr>
    `)
    .join('');
  
  // Attach event listeners to buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', handleEdit);
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', handleDelete);
  });
}

// Handle form submit (Add or Edit)
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(specimenForm);
  const specimenData = {
    specimen_name: formData.get('name'),
    sla_time: parseInt(formData.get('tat'))
  };
  
  try {
    let result;
    
    if (isEditMode && editingSpecimenId) {
      // Update existing specimen
      result = await window.electronAPI.updateSpecimen(editingSpecimenId, specimenData);
      
      if (result.success) {
        showMessage('แก้ไขข้อมูลสำเร็จ!', 'success');
      } else {
        showMessage(result.message || 'ไม่สามารถแก้ไขข้อมูลได้', 'error');
      }
    } else {
      // Add new specimen
      result = await window.electronAPI.addSpecimen(specimenData);
      
      if (result.success) {
        showMessage('เพิ่มข้อมูลสำเร็จ!', 'success');
      } else {
        showMessage(result.message || 'ไม่สามารถเพิ่มข้อมูลได้', 'error');
      }
    }
    
    // Reset form and reload data
    resetForm();
    await fetchSpecimens();
    
  } catch (error) {
    showMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
  }
}

// Handle edit button click
function handleEdit(e) {
  const specimenId = parseInt(e.currentTarget.dataset.id);
  const specimen = specimens.find(s => s.specimen_id === specimenId);
  
  if (!specimen) {
    return;
  }
  
  // Populate form with specimen data
  document.getElementById('specimenName').value = specimen.specimen_name;
  document.getElementById('specimenTat').value = specimen.sla_time;
  
  // Switch to edit mode
  isEditMode = true;
  editingSpecimenId = specimenId;
  
  // Update UI for edit mode
  submitBtn.innerHTML = '<i class="fa fa-save"></i> บันทึก';
  cancelBtn.style.display = 'inline-flex';
  specimenForm.classList.add('edit-mode');
  
  // Scroll to form
  specimenForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Handle delete button click
async function handleDelete(e) {
  const specimenId = parseInt(e.currentTarget.dataset.id);
  const specimen = specimens.find(s => s.specimen_id === specimenId);
  
  if (!specimen) {
    return;
  }
  
  // Confirm deletion
  const confirmed = await Swal.fire({
    title: 'ยืนยันการลบ',
    text: `คุณต้องการลบ "${specimen.specimen_name}" ใช่หรือไม่?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก'
  });
  
  if (!confirmed.isConfirmed) {
    return;
  }
  
  try {
    const result = await window.electronAPI.deleteSpecimen(specimenId);
    
    if (result.success) {
      showMessage('ลบข้อมูลสำเร็จ!', 'success');
      await fetchSpecimens();
    } else {
      showMessage(result.message || 'ไม่สามารถลบข้อมูลได้', 'error');
    }
  } catch (error) {
    showMessage('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
  }
}

// Reset form to add mode
function resetForm() {
  specimenForm.reset();
  isEditMode = false;
  editingSpecimenId = null;
  submitBtn.innerHTML = '<i class="fa fa-plus"></i> เพิ่ม';
  cancelBtn.style.display = 'none';
  specimenForm.classList.remove('edit-mode');
}

// Cancel button handler
cancelBtn.addEventListener('click', resetForm);

// Form submit handler
specimenForm.addEventListener("submit", handleFormSubmit);

/* ============================================
   🚀 INITIALIZATION
   ============================================ */

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Navigate to: admin-settings');
  
  if (!checkAuthentication()) {
    return;
  }
  
  updateUserDisplay();
  await fetchSpecimens();
});

/* ============================================
   📊 RULEBASE MANAGEMENT
   ============================================ */

// Handle file selection
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('excelFile');
  const filePathInput = document.getElementById('excelFilePath');
  
  if (fileInput && filePathInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        filePathInput.value = file.path;
      }
    });
  }
});

async function importExcel() {
  const fileInput = document.getElementById('excelFile');
  const filePathInput = document.getElementById('excelFilePath');
  const excelFile = filePathInput.value.trim();
  
  if (!excelFile) {
    showRulebaseMessage('กรุณาเลือกไฟล์ Excel', 'error');
    return;
  }
  
  showRulebaseMessage('กำลังนำเข้าข้อมูล...', 'info');
  
  try {
    const result = await window.electronAPI.importExcelToSupabase(excelFile);
    
    if (result.success) {
      let message = 'นำเข้าข้อมูลสำเร็จ! ';
      if (result.results) {
        const summary = result.results.map(r => `${r.dnaType}: ${r.action}`).join(', ');
        message += summary;
      }
      showRulebaseMessage(message, 'success');
      // Clear selection
      fileInput.value = '';
      filePathInput.value = '';
    } else {
      showRulebaseMessage(`ไม่สามารถนำเข้าข้อมูลได้: ${result.error}`, 'error');
    }
  } catch (error) {
    showRulebaseMessage(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
  }
}

async function refreshCache() {
  const messageDiv = document.getElementById('rulebase-message');
  showRulebaseMessage('กำลังรีเฟรช cache...', 'info');
  
  try {
    const result = await window.electronAPI.refreshRulebase();
    
    if (result.success) {
      const dnaTypes = result.data ? Object.keys(result.data) : [];
      showRulebaseMessage(`รีเฟรช cache สำเร็จ! โหลด ${dnaTypes.length} DNA types`, 'success');
    } else {
      showRulebaseMessage(`ไม่สามารถรีเฟรช cache ได้: ${result.error}`, 'error');
    }
  } catch (error) {
    showRulebaseMessage(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
  }
}

function showRulebaseMessage(message, type) {
  const messageDiv = document.getElementById('rulebase-message');
  messageDiv.textContent = message;
  messageDiv.className = `form-message ${type}`;
  messageDiv.style.display = 'block';
  
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
}