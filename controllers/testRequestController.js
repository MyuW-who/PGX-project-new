const supabase = require('../supabase');

// ดึงข้อมูล test request ทั้งหมดพร้อมข้อมูลผู้ป่วย
async function fetchAllTestRequests() {
  const { data, error } = await supabase
    .from('test_request')
    .select(`
      *,
      patient:patient_id (
        patient_id,
        first_name,
        last_name,
        hospital_id
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Fetch Test Requests Error:', error.message);
    return [];
  }
  
  return data || [];
}

// ค้นหา test request ด้วย patient_id หรือชื่อผู้ป่วย
async function searchTestRequests(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return await fetchAllTestRequests();
  }

  const cleanSearchTerm = searchTerm.trim();
  if (!cleanSearchTerm) {
    return await fetchAllTestRequests();
  }

  // First get all test requests
  const { data, error } = await supabase
    .from('test_request')
    .select(`
      *,
      patient:patient_id (
        patient_id,
        first_name,
        last_name,
        hospital_id
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Search Test Requests Error:', error.message);
    return [];
  }

  // Filter by request_id only (exact match)
  const filtered = (data || []).filter(req => {
    const requestId = req.request_id?.toString() || '';
    return requestId === cleanSearchTerm;
  });

  return filtered;
}

// ดึงข้อมูล test request รายบุคคล
async function getTestRequestById(requestId) {
  const { data, error } = await supabase
    .from('test_request')
    .select(`
      *,
      patient:patient_id (
        patient_id,
        first_name,
        last_name,
        hospital_id,
        age,
        gender,
        phone
      )
    `)
    .eq('request_id', requestId)
    .single();

  if (error) {
    console.error('❌ Get Test Request Error:', error.message);
    return null;
  }
  return data;
}

// เพิ่ม test request ใหม่
async function addTestRequest(requestData) {
  const { data, error } = await supabase
    .from('test_request')
    .insert([requestData])
    .select()
    .single();

  if (error) {
    console.error('❌ Add Test Request Error:', error.message);
    return null;
  }
  return data;
}

// อัปเดต test request
async function updateTestRequest(requestId, updateData) {
  const { data, error } = await supabase
    .from('test_request')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('request_id', requestId)
    .select()
    .single();

  if (error) {
    console.error('❌ Update Test Request Error:', error.message);
    return null;
  }
  return data;
}

// ลบ test request
async function deleteTestRequest(requestId) {
  const { error } = await supabase
    .from('test_request')
    .delete()
    .eq('request_id', requestId);

  if (error) {
    console.error('❌ Delete Test Request Error:', error.message);
    return false;
  }
  return true;
}

// ดึงสถิติตามสถานะ
async function getTestRequestStats() {
  const { data, error } = await supabase
    .from('test_request')
    .select('status');

  if (error) {
    console.error('❌ Get Stats Error:', error.message);
    return { all: 0, need2Confirmation: 0, need1Confirmation: 0, done: 0 };
  }

  const all = data?.length || 0;
  const need2Confirmation = data?.filter(r => {
    const status = r.status?.toLowerCase().trim();
    return status === 'need 2 confirmation';
  })?.length || 0;
  
  const need1Confirmation = data?.filter(r => {
    const status = r.status?.toLowerCase().trim();
    return status === 'need 1 confirmation';
  })?.length || 0;
  
  const done = data?.filter(r => {
    const status = r.status?.toLowerCase().trim();
    return status === 'done';
  })?.length || 0;

  return { all, need2Confirmation, need1Confirmation, done };
}

// ดึงข้อมูล SLA time ของแต่ละ specimen
async function getSpecimenSLA() {
  const { data, error } = await supabase
    .from('Specimen')
    .select('Specimen_ID, Specimen_Name, SLA_time');

  if (error) {
    console.error('❌ Fetch Specimen SLA Error:', error.message);
    return {};
  }

  // Convert to map for easy lookup
  const slaMap = {};
  (data || []).forEach(spec => {
    slaMap[spec.Specimen_Name?.toLowerCase()] = parseFloat(spec.SLA_time) || 72;
    slaMap[spec.Specimen_ID] = parseFloat(spec.SLA_time) || 72;
  });
  
  return slaMap;
}

module.exports = {
  fetchAllTestRequests,
  searchTestRequests,
  getTestRequestById,
  addTestRequest,
  updateTestRequest,
  deleteTestRequest,
  getTestRequestStats,
  getSpecimenSLA
};
