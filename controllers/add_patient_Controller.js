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

// ค้นหาผู้ป่วย
async function searchPatientById(patientId) {
  const { data, error } = await supabase.from('patient').select('*').eq('patient_id', patientId);
  if (error) console.error('❌ Search Error:', error.message);
  return data;
}

module.exports = { fetchPatients, addPatient, searchPatientById };
