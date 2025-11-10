  /* --------------------------------------------
    ✅ โหลดข้อมูลผู้ป่วยเมื่อหน้าเปิดขึ้น
  -------------------------------------------- */
  window.addEventListener('DOMContentLoaded', async () => {
    // เรียกใช้ฟังก์ชันหลักจาก userProfile.js
    // ฟังก์ชันนี้จะจัดการ checkAuthentication และ updateUserDisplay ให้เอง
    if (!initializeUserProfile()) { 
      return; // หยุดทำงานถ้าไม่ผ่านการยืนยันตัวตน
    }
    
    // Load patients data
    try {
      const patients = await window.electronAPI.getPatients();
      console.log("📦 Renderer got patients:", patients);
      renderPatients(patients);
    } catch (err) {
      console.error("❌ Error fetching patients:", err);
    }
  });
  /* --------------------------------------------
    📝 Form handler supports Add and Edit modes
  --------------------------------------------- */
  const form = document.getElementById('addForm');
  let isEditMode = false;
  let editingPatientId = null;

  async function handleFormSubmit(e) {
    e.preventDefault();

    // collect common fields
    const patientData = {
      patient_id: parseInt(document.getElementById('patient_id').value),
      hospital_id: document.getElementById('hospital').value.trim(),
      first_name: document.getElementById('first_name').value.trim(),
      last_name: document.getElementById('last_name').value.trim(),
      age: parseInt(document.getElementById('age').value),
      gender: document.getElementById('gender').value,
      ethnicity: document.getElementById('ethnicity').value.trim(),
      blood_type: document.getElementById('blood_type').value,
      phone: document.getElementById('phone').value.trim(),
    };

    // Get current user for audit logging
    const currentUser = getCurrentUser();
    
    try {
      if (isEditMode) {
        // Edit existing patient
        await window.electronAPI.updatePatient(editingPatientId, patientData, currentUser);
        await Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          text: 'ข้อมูลผู้ป่วยได้รับการอัปเดตแล้ว',
          confirmButtonColor: '#3b82f6',
          customClass: {
            popup: 'swal-dark'
          }
        });
      } else {
        // Add new patient
        await window.electronAPI.addPatient(patientData, currentUser);
        await Swal.fire({
          icon: 'success',
          title: 'เพิ่มสำเร็จ!',
          text: 'เพิ่มข้อมูลผู้ป่วยเรียบร้อยแล้ว',
          confirmButtonColor: '#3b82f6',
          customClass: {
            popup: 'swal-dark'
          }
        });
      }

      // รีโหลดหน้าเว็บหลังจากกด OK
      location.reload();

    } catch (err) {
      console.error('❌ Error saving patient data:', err);
      Swal.fire({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        confirmButtonColor: '#3b82f6', 
        cancelButtonColor: '#ef4444',
        customClass: {
          popup: 'swal-dark'
        }
      });
    }
  }  form?.addEventListener('submit', handleFormSubmit);

  /* --------------------------------------------
    🔍 ระบบค้นหาผู้ป่วยด้วย patient_id, ชื่อ, หรือนามสกุล
  -------------------------------------------- */
  document.getElementById('searchInput')?.addEventListener('input', async (e) => {
    const keyword = e.target.value.trim();
    try {
      if (keyword.length === 0) {
        // ถ้าไม่มีคำค้นหา แสดงผู้ป่วยทั้งหมด
        const patients = await window.electronAPI.getPatients();
        renderPatients(patients);
      } else if (keyword.length >= 1) {
        // ค้นหาเมื่อพิมพ์อย่างน้อย 1 ตัวอักษร
        const patients = await window.electronAPI.searchPatient(keyword);
        renderPatients(patients);
        
        // แสดงจำนวนผลลัพธ์
        const resultCount = patients.length;
        console.log(`🔍 พบผลการค้นหา ${resultCount} รายการสำหรับ "${keyword}"`);
      }
    } catch (err) {
      console.error("❌ Error searching patient:", err);
      // แสดงข้อความข้อผิดพลาดให้ผู้ใช้เห็น
      const tbody = document.querySelector('#patientTable tbody');
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">เกิดข้อผิดพลาดในการค้นหา: ${err.message}</td></tr>`;
    }
  });

  /* --------------------------------------------
    📋 ฟังก์ชันแสดงข้อมูลในตาราง
  -------------------------------------------- */

  function renderPatients(data) {
    const tbody = document.querySelector('#patientTable tbody');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
      const searchInput = document.getElementById('searchInput');
      const searchTerm = searchInput?.value.trim();
      const message = searchTerm 
        ? `ไม่พบข้อมูลผู้ป่วยที่ตรงกับ "${searchTerm}"` 
        : 'ไม่พบข้อมูลผู้ป่วย';
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">${message}</td></tr>`;
      return;
    }

    data.forEach((p, index) => {
      const row = `
        <tr onclick="showPage('verify_step1', '${p.patient_id}')" data-patient-id="${p.patient_id}">
          <td>${p.patient_id ?? '-'}</td>
          <td>${p.first_name ?? ''} ${p.last_name ?? ''}</td>
          <td>${p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '-'}</td>
          <td>${p.hospital_id ?? '-'}</td>
          <td><button class="Edit-btn" onclick="event.stopPropagation(); editPatient(${p.patient_id})"><i class="fas fa-edit"></i></button></td>
          <td><button class="delete-btn" onclick="event.stopPropagation(); deletePatient(${p.patient_id})"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`;
      tbody.insertAdjacentHTML('beforeend', row);
    });

    // 🔗 เพิ่ม Event ให้ทุกปุ่ม Inspect
    attachInspectButtons();
  }

  /* --------------------------------------------
    🪟 Popup Add Patient
  -------------------------------------------- */
  const popupAdd = document.getElementById('popupAdd');
  const addBtn = document.getElementById('addBtn');
  const closeAdd = document.getElementById('closeAdd');
  const popupTitle = popupAdd?.querySelector('h3');

  addBtn?.addEventListener('click', () => {
    // switch to add mode
    isEditMode = false;
    editingPatientId = null;
    popupTitle && (popupTitle.textContent = 'เพิ่มข้อมูลผู้ป่วย');
    // reset form and allow changing patient_id
    form?.reset();
    const idEl = document.getElementById('patient_id');
    if (idEl) idEl.readOnly = false;
    popupAdd.style.display = 'flex';
  });

  closeAdd?.addEventListener('click', closePopup);

  function closePopup() {
    popupAdd.style.display = 'none';
    // reset state back to add mode
    isEditMode = false;
    editingPatientId = null;
    popupTitle && (popupTitle.textContent = 'เพิ่มข้อมูลผู้ป่วย');
    const idEl = document.getElementById('patient_id');
    if (idEl) idEl.readOnly = false;
  }


  // ▶️ ปุ่ม Inspect (ทุกปุ่ม)
  function attachInspectButtons() {
    document.querySelectorAll('.inspect-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.electronAPI.navigate('verify_step1');
      });
    });
  }





  /* --------------------------------------------
    ✏️ Edit Patient Function
  -------------------------------------------- */
  async function editPatient(patientId) {
    try {
      // Get patient data
      const patient = await window.electronAPI.getPatientById(patientId);
      if (!patient) {
        alert('ไม่พบข้อมูลผู้ป่วย');
        return;
      }

      // Populate form with patient data
      document.getElementById('patient_id').value = patient.patient_id;
      document.getElementById('first_name').value = patient.first_name;
      document.getElementById('last_name').value = patient.last_name;
      document.getElementById('age').value = patient.age;
      document.getElementById('gender').value = patient.gender;
      document.getElementById('ethnicity').value = patient.ethnicity;
      document.getElementById('blood_type').value = patient.blood_type;
      document.getElementById('hospital').value = patient.hospital_id;
      document.getElementById('phone').value = patient.phone;

      // Switch to edit mode
      isEditMode = true;
      editingPatientId = patientId;
      popupTitle && (popupTitle.textContent = 'แก้ไขผู้ป่วย');
      const idEl = document.getElementById('patient_id');
      if (idEl) idEl.readOnly = true; // lock primary key during edit
      // Show popup
      popupAdd.style.display = 'flex';
    } catch (err) {
      console.error('❌ Error fetching patient details:', err);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย');
    }
  }







  /* --------------------------------------------
    🗑️ Delete Patient Function (Improved with SweetAlert2)
  -------------------------------------------- */
  async function deletePatient(patientId) {
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      
      // --- Custom Styles for Dark Theme ---
      confirmButtonColor: '#3b82f6', // สีปุ่มยืนยัน (สีน้ำเงิน)
      cancelButtonColor: '#ef4444',   // สีปุ่มยกเลิก (สีแดง)
      customClass: { // 👈 เพิ่ม/แทนที่ด้วยส่วนนี้
        popup: 'swal-dark'
      }

    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Get current user for audit logging
          const currentUser = getCurrentUser();
          const response = await window.electronAPI.deletePatient(patientId, currentUser);
          
          if (response.success) {
            // แสดง Pop-up แจ้งว่าลบสำเร็จ
            Swal.fire({
              title: 'ลบสำเร็จ!',
              text: response.message || 'ข้อมูลผู้ป่วยถูกลบเรียบร้อยแล้ว',
              icon: 'success',
              confirmButtonColor: '#3b82f6',
              customClass: {
                popup: 'swal-dark'
              }
            }).then(() => {
              location.reload(); // รีโหลดหน้าเว็บหลังกด OK
            });
          } else {
            // แสดง Pop-up แจ้งเตือนถ้าลบไม่สำเร็จ
            Swal.fire({
              title: 'เกิดข้อผิดพลาด!',
              text: response.message || 'ไม่สามารถลบข้อมูลผู้ป่วยได้',
              icon: 'error',
              confirmButtonColor: '#3b82f6',
              customClass: {
                popup: 'swal-dark'
              }
            });
          }

        } catch (err) {
          console.error('❌ Error deleting patient:', err);
          
          // แสดง Pop-up แจ้งเตือนข้อผิดพลาด
          Swal.fire({
            title: 'เกิดข้อผิดพลาด!',
            text: 'ไม่สามารถลบข้อมูลผู้ป่วยได้',
            icon: 'error',
            confirmButtonColor: '#3b82f6',
            customClass: {
              popup: 'swal-dark'
            }
          });
        }
      }
    });
  }



