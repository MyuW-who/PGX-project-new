// controllers/add_patient_controller.js
const supabase = require('../supabase');

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
async function addPatient(patientData) {
  const { data, error } = await supabase.from('patient').insert([patientData]).select();
  if (error) console.error('❌ Insert Error:', error.message);
  return data;
}

// ค้นหาผู้ป่วย (ด้วยคำค้นบางส่วนของ patient_id)
async function searchPatientById(patientId) {
  const { data, error } = await supabase
    .from('patient')
    .select('*')
    .like('patient_id', `%${patientId}%`); // Use 'like' for partial matching
  if (error) console.error('❌ Search Error:', error.message);
  return data;
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
async function updatePatient(patientId, updatedData) {
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
  return data;
}

// ลบข้อมูลผู้ป่วย
async function deletePatient(patientId) {
  const { error } = await supabase
    .from('patient')
    .delete()
    .eq('patient_id', patientId);

  if (error) {
    console.error('❌ Delete Error:', error.message);
    return false;
  }
  return true;
}

module.exports = { fetchPatients, addPatient, searchPatientById, getPatientById, updatePatient, deletePatient };
