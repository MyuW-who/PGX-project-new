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

  // Filter by patient_id or patient name
  const filtered = (data || []).filter(req => {
    const patientId = req.patient?.patient_id?.toString() || '';
    const firstName = req.patient?.first_name?.toLowerCase() || '';
    const lastName = req.patient?.last_name?.toLowerCase() || '';
    const searchLower = cleanSearchTerm.toLowerCase();
    
    return patientId.includes(cleanSearchTerm) || 
           firstName.includes(searchLower) || 
           lastName.includes(searchLower);
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

// ดึงสถิติตามสถานะ with time filter (today/week/month/all)
async function getTestRequestStats(timeFilter = 'today') {
  // Build query
  let query = supabase
    .from('test_request')
    .select('status, created_at');
  
  // Add time filter only if not 'all'
  if (timeFilter !== 'all') {
    let startDate;
    const now = new Date();
    
    switch(timeFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    query = query.gte('created_at', startDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Get Stats Error:', error.message);
    return { all: 0, need2Confirmation: 0, need1Confirmation: 0, done: 0, reject: 0 };
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
  
  const reject = data?.filter(r => {
    const status = r.status?.toLowerCase().trim();
    return status === 'reject';
  })?.length || 0;

  return { 
    all, 
    need2Confirmation, 
    need1Confirmation, 
    done,
    reject,
    // Aliases for compatibility
    need2: need2Confirmation,
    need1: need1Confirmation,
    timeFilter
  };
}

// ดึงข้อมูล SLA time ของแต่ละ specimen
async function getSpecimenSLA() {
  try {
    // Try to query the Specimen table
    const { data, error } = await supabase
      .from('Specimen')
      .select('*')
      .limit(10);

    // If table doesn't exist or has errors, use default values
    if (error) {
      console.log('⚠️ Specimen table not found, using default SLA values');
      return {
        'blood': 5,
        'hair': 7,
        'cheek septum': 3,
        'saliva': 2
      };
    }

    // If we got data, try to map it
    const slaMap = {};
    (data || []).forEach(spec => {
      const name = (spec.Specimen_Name || spec.specimen_name)?.toLowerCase();
      const slaHours = parseFloat(spec.SLA_time || spec.sla_time) || 72;
      const id = spec.Specimen_ID || spec.specimen_id || spec.id;
      
      if (name) {
        slaMap[name] = slaHours;
      }
      if (id) {
        slaMap[id] = slaHours;
      }
    });
    
    console.log('✅ Specimen SLA Map:', slaMap);
    return Object.keys(slaMap).length > 0 ? slaMap : {
      'blood': 5,
      'hair': 7,
      'cheek septum': 3,
      'saliva': 2
    };
  } catch (err) {
    console.log('⚠️ Error fetching specimen SLA, using defaults');
    return {
      'blood': 5,
      'hair': 7,
      'cheek septum': 3,
      'saliva': 2
    };
  }
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
