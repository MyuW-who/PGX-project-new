// controllers/add_patient_controller.js
const supabase = require('../supabase');
const { logAuditEvent } = require('./auditLogController');

// ดึงข้อมูลผู้ป่วยทั้งหมด
async function fetchPatients() {
  const { data, error } = await supabase
    .from('patient') // ✅ ใช้ชื่อ table เดียวกับใน DB
    .select('*')
    .order('patient_id', { ascending: true });

  if (error) {
    console.error('❌ Supabase Fetch Error:', error.message);
    return [];
  }
  //console.log('✅ Supabase Fetch Data:', data);
  return data;
}

// เพิ่มข้อมูลผู้ป่วย
async function addPatient(patientData, currentUser = null) {
  const { data, error } = await supabase.from('patient').insert([patientData]).select();
  if (error) {
    console.error('❌ Insert Error:', error.message);
    return data;
  }
  
  // ✅ Log audit event
  if (data && data[0] && currentUser) {
    await logAuditEvent({
      user_id: currentUser.user_id,
      username: currentUser.username,
      role: currentUser.role,
      action: 'create',
      table_name: 'patient',
      record_id: data[0].patient_id,
      new_data: data[0],
      description: `สร้างข้อมูลผู้ป่วย: ${data[0].first_name} ${data[0].last_name}`
    });
  }
  
  return data;
}

// ค้นหาผู้ป่วย (ด้วยคำค้นบางส่วนของ patient_id, ชื่อ, หรือนามสกุล)
async function searchPatientById(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return [];
  }

  const cleanSearchTerm = searchTerm.trim();
  if (!cleanSearchTerm) {
    return [];
  }

  const { data, error } = await supabase
    .from('patient')
    .select('*')
    .or(`patient_id.ilike.%${cleanSearchTerm}%,first_name.ilike.%${cleanSearchTerm}%,last_name.ilike.%${cleanSearchTerm}%`)
    .order('patient_id', { ascending: true })
    .limit(50); // Limit results for performance

  if (error) {
    console.error('❌ Search Error:', error.message);
    return [];
  }
  
  return data || [];
}

// ดึงข้อมูลผู้ป่วยรายบุคคล
async function getPatientById(patientId) {
  const { data, error } = await supabase
    .from('patient')
    .select('*')
    .eq('patient_id', patientId)
    .single();

  if (error) {
    console.error('❌ Get By ID Error:', error.message);
    return null;
  }
  return data;
}

// อัปเดตข้อมูลผู้ป่วย
async function updatePatient(patientId, updatedData, currentUser = null) {
  // Get old data first for audit log
  const oldData = await getPatientById(patientId);
  
  const { data, error } = await supabase
    .from('patient')
    .update(updatedData)
    .eq('patient_id', patientId)
    .select()
    .single();

  if (error) {
    console.error('❌ Update Error:', error.message);
    return null;
  }
  
  // ✅ Log audit event
  if (data && currentUser) {
    await logAuditEvent({
      user_id: currentUser.user_id,
      username: currentUser.username,
      role: currentUser.role,
      action: 'update',
      table_name: 'patient',
      record_id: patientId,
      old_data: oldData,
      new_data: data,
      description: `แก้ไขข้อมูลผู้ป่วย: ${data.first_name} ${data.last_name}`
    });
  }
  
  return data;
}



// ลบข้อมูลผู้ป่วย (with cascading delete for test_request)
async function deletePatient(patientId, currentUser = null) {
  try {
    // Get patient data before deletion for audit log
    const patientData = await getPatientById(patientId);
    
    // Step 1: Delete all test_request records for this patient first
    const { error: testRequestError } = await supabase
      .from('test_request')
      .delete()
      .eq('patient_id', patientId);

    if (testRequestError) {
      console.error('❌ Delete Test Request Error:', testRequestError.message);
      return { success: false, message: 'ไม่สามารถลบข้อมูลการตรวจที่เกี่ยวข้องได้' };
    }

    // Step 2: Now delete the patient
    const { error: patientError } = await supabase
      .from('patient')
      .delete()
      .eq('patient_id', patientId);

    if (patientError) {
      console.error('❌ Delete Patient Error:', patientError.message);
      return { success: false, message: 'ไม่สามารถลบข้อมูลผู้ป่วยได้' };
    }

    // ✅ Log audit event
    if (patientData && currentUser) {
      await logAuditEvent({
        user_id: currentUser.user_id,
        username: currentUser.username,
        role: currentUser.role,
        action: 'delete',
        table_name: 'patient',
        record_id: patientId,
        old_data: patientData,
        description: `ลบข้อมูลผู้ป่วย: ${patientData.first_name} ${patientData.last_name}`
      });
    }

    return { success: true, message: 'ลบข้อมูลผู้ป่วยและการตรวจที่เกี่ยวข้องสำเร็จ' };
  } catch (err) {
    console.error('❌ Delete Error:', err.message);
    return { success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' };
  }
}

module.exports = { fetchPatients, addPatient, searchPatientById, getPatientById, updatePatient, deletePatient };
