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
    // Get current test request with full data
    const { data: currentRequest, error: fetchError } = await supabase
      .from('test_request')
      .select(`
        *,
        patient:patient_id (
          patient_id,
          first_name,
          last_name,
          hospital_id,
          age,
          gender
        )
      `)
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

    // Regenerate PDF with signatures after confirmation
    try {
      console.log('🔄 Attempting to regenerate PDF with signatures...');
      const { data: reportData, error: reportError } = await supabase
        .from('report')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();

      if (reportError) {
        console.error('❌ Error fetching report:', reportError);
      }

      if (reportData) {
        console.log('📄 Report found, regenerating PDF...');
        // Import PDF generation function
        const { generatePGxPDF, uploadPDFToStorage } = require('./pgxReportController');
        
        // Get user signatures
        let signature1_url = null;
        let signature2_url = null;
        
        const confirmedBy1 = updateData.confirmed_by_1 || currentRequest.confirmed_by_1;
        const confirmedBy2 = updateData.confirmed_by_2 || currentRequest.confirmed_by_2;
        
        console.log('🔍 Fetching signatures for confirmer 1:', confirmedBy1, 'confirmer 2:', confirmedBy2);
        
        if (confirmedBy1) {
          const { data: user1 } = await supabase
            .from('system_users')
            .select('Signature_path')
            .eq('user_id', confirmedBy1)
            .single();
          
          console.log('👤 User 1 data:', user1);
          
          if (user1?.Signature_path) {
            console.log('📝 Found signature path for user 1:', user1.Signature_path);
            // Convert storage path to public URL
            if (user1.Signature_path.startsWith('http://') || user1.Signature_path.startsWith('https://')) {
              signature1_url = user1.Signature_path;
            } else {
              // It's a storage path like "signatures/userId_timestamp.png"
              const { data: urlData } = supabase.storage
                .from('Image_Bucket')
                .getPublicUrl(user1.Signature_path);
              signature1_url = urlData.publicUrl;
              console.log('🔗 Converted to URL:', signature1_url);
            }
          }
        }
        
        if (confirmedBy2) {
          const { data: user2 } = await supabase
            .from('system_users')
            .select('Signature_path')
            .eq('user_id', confirmedBy2)
            .single();
          
          console.log('👤 User 2 data:', user2);
          
          if (user2?.Signature_path) {
            console.log('📝 Found signature path for user 2:', user2.Signature_path);
            // Convert storage path to public URL
            if (user2.Signature_path.startsWith('http://') || user2.Signature_path.startsWith('https://')) {
              signature2_url = user2.Signature_path;
            } else {
              // It's a storage path like "signatures/userId_timestamp.png"
              const { data: urlData } = supabase.storage
                .from('Image_Bucket')
                .getPublicUrl(user2.Signature_path);
              signature2_url = urlData.publicUrl;
              console.log('🔗 Converted to URL:', signature2_url);
            }
          }
        }

        console.log('✍️ Final signature URLs - User 1:', signature1_url, 'User 2:', signature2_url);

        // Parse alleles if stored as JSON string
        let alleles = currentRequest.alleles;
        if (typeof alleles === 'string') {
          try {
            alleles = JSON.parse(alleles);
          } catch (e) {
            alleles = [];
          }
        }

        // Prepare PDF data
        const pdfInfo = {
          report_id: reportData.report_id,
          request_id: requestId,
          test_target: currentRequest.test_target,
          genotype: reportData.genotype,
          genotype_summary: reportData.genotype_summary,
          predicted_phenotype: reportData.predicted_phenotype,
          recommendation: reportData.recommendation,
          patientId: currentRequest.patient?.patient_id || 'N/A',
          patientName: `${currentRequest.patient?.first_name || ''} ${currentRequest.patient?.last_name || ''}`.trim(),
          patientAge: currentRequest.patient?.age || 'N/A',
          patientGender: currentRequest.patient?.gender || 'N/A',
          specimen: currentRequest.Specimen || 'Nails',
          patientNumber: currentRequest.request_id,
          hospital: currentRequest.patient?.hospital_id || '1',
          createDate: currentRequest.request_date || new Date().toISOString().split('T')[0],
          updateDate: new Date().toLocaleDateString('th-TH'),
          doctorName: currentRequest.responsible_doctor || 'N/A',
          alleles: alleles || [],
          activityScore: currentRequest.activity_score || 'N/A',
          signature1_url,
          signature2_url
        };

        console.log('📄 Generating PDF with signature URLs...');
        
        // Generate new PDF with timestamp to avoid cache issues
        const { buffer: pdfBuffer, fileName } = await generatePGxPDF(pdfInfo);
        
        // Modify filename to include timestamp for cache busting
        const uniqueFileName = fileName.replace('.pdf', `_${Date.now()}.pdf`);
        
        console.log('✅ PDF buffer created, uploading to storage as:', uniqueFileName);
        
        // Upload to storage
        const publicUrl = await uploadPDFToStorage(pdfBuffer, uniqueFileName);
        
        if (publicUrl) {
          // Update report with new PDF path
          await supabase
            .from('report')
            .update({ pdf_path: publicUrl })
            .eq('report_id', reportData.report_id);
          
          console.log('✅ PDF regenerated with signatures:', publicUrl);
        }
      } else {
        console.log('⚠️ No report found for request_id:', requestId);
      }
    } catch (pdfError) {
      console.error('⚠️ Error regenerating PDF:', pdfError);
      console.error('PDF Error stack:', pdfError.stack);
      // Don't fail the confirmation if PDF generation fails
    }
    
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

