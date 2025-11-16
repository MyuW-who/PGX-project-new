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
  try {
    // First, get the test request
    const { data: requestData, error: requestError } = await supabase
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

    if (requestError) {
      console.error('❌ Get Test Request Error:', requestError.message);
      return null;
    }

    // Then, get the report separately using request_id
    const { data: reportData, error: reportError } = await supabase
      .from('report')
      .select('*')
      .eq('request_id', requestId)
      .maybeSingle(); // Use maybeSingle to handle cases where report doesn't exist

    if (reportError && reportError.code !== 'PGRST116') {
      console.error('❌ Get Report Error:', reportError.message);
    }

    // Combine the data
    return {
      ...requestData,
      report: reportData
    };
  } catch (error) {
    console.error('❌ Exception in getTestRequestById:', error);
    return null;
  }
}

// เพิ่ม test request ใหม่
async function addTestRequest(requestData) {
  try {
    // Remove request_id if it exists (let database auto-increment)
    const { request_id, created_at, ...cleanData } = requestData;
    
    console.log('📝 Inserting test request:', cleanData);
    
    const { data, error } = await supabase
      .from('test_request')
      .insert([cleanData])
      .select()
      .single();

    if (error) {
      console.error('❌ Add Test Request Error:', error.message);
      console.error('❌ Error details:', error);
      return null;
    }
    
    console.log('✅ Test request inserted:', data);
    return data;
  } catch (err) {
    console.error('❌ Exception in addTestRequest:', err);
    return null;
  }
}

// อัปเดต test request
async function updateTestRequest(requestId, updateData) {
  const { data, error } = await supabase
    .from('test_request')
    .update(updateData)
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
  
  const pending = data?.filter(r => {
    const status = r.status?.toLowerCase().trim();
    return status === 'pending';
  })?.length || 0;
  
  const need2Confirmation = data?.filter(r => {
    const status = r.status?.toLowerCase().trim();
    return status === 'need_2_confirmation' || status === 'need 2 confirmation';
  })?.length || 0;
  
  const need1Confirmation = data?.filter(r => {
    const status = r.status?.toLowerCase().trim();
    return status === 'need_1_confirmation' || status === 'need 1 confirmation';
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
    pending,
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

// ยืนยัน test request (confirmation)
async function confirmTestRequest(requestId, userId) {
  try {
    // Get current test request
    const { data: currentRequest, error: fetchError } = await supabase
      .from('test_request')
      .select('confirmed_by_1, confirmed_by_2, status')
      .eq('request_id', requestId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching request:', fetchError.message);
      return { success: false, message: 'ไม่พบข้อมูลคำขอ' };
    }

    // Check if request is pending (not yet ready for confirmation)
    if (currentRequest.status === 'pending') {
      return { success: false, message: 'กรุณากรอกข้อมูล Alleles ก่อนยืนยัน' };
    }

    // Check if this user already confirmed
    if (currentRequest.confirmed_by_1 === userId || currentRequest.confirmed_by_2 === userId) {
      return { success: false, message: 'คุณได้ยืนยันแล้ว ไม่สามารถยืนยันซ้ำได้' };
    }

    // Determine which confirmation slot to use
    let updateData = {};
    let newStatus = '';

    if (!currentRequest.confirmed_by_1) {
      // First confirmation: need_2_confirmation → need_1_confirmation
      updateData = {
        confirmed_by_1: userId,
        confirmed_at_1: new Date().toISOString(),
        status: 'need_1_confirmation'
      };
      newStatus = 'need_1_confirmation';
    } else if (!currentRequest.confirmed_by_2) {
      // Second confirmation: need_1_confirmation → done
      updateData = {
        confirmed_by_2: userId,
        confirmed_at_2: new Date().toISOString(),
        status: 'done'
      };
      newStatus = 'done';
    } else {
      return { success: false, message: 'เอกสารนี้ได้รับการยืนยันครบแล้ว' };
    }

    // Update the request
    const { error: updateError } = await supabase
      .from('test_request')
      .update(updateData)
      .eq('request_id', requestId);

    if (updateError) {
      console.error('❌ Error updating request:', updateError.message);
      return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึก' };
    }

    console.log('✅ Confirmed by user:', userId, '→ New status:', newStatus);
    return { 
      success: true, 
      message: newStatus === 'done' ? 'ยืนยันสำเร็จ! เอกสารผ่านการตรวจสอบครบถ้วน' : 'ยืนยันสำเร็จ! รอการยืนยันจากเจ้าหน้าที่อีก 1 คน',
      newStatus 
    };

  } catch (error) {
    console.error('❌ Exception in confirmTestRequest:', error);
    return { success: false, message: 'เกิดข้อผิดพลาด' };
  }
}

// ปฏิเสธ test request (rejection)
async function rejectTestRequest(requestId, userId, reason) {
  try {
    // Update status to reject
    const { error } = await supabase
      .from('test_request')
      .update({
        status: 'reject',
        rejected_by: userId,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('request_id', requestId);

    if (error) {
      console.error('❌ Error rejecting request:', error.message);
      return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึก' };
    }

    console.log('✅ Rejected by user:', userId);
    return { success: true, message: 'ปฏิเสธเอกสารสำเร็จ' };

  } catch (error) {
    console.error('❌ Exception in rejectTestRequest:', error);
    return { success: false, message: 'เกิดข้อผิดพลาด' };
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
  getSpecimenSLA,
  confirmTestRequest,
  rejectTestRequest
};

