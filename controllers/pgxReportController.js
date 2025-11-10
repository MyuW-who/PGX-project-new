// controllers/pgxReportController.js
const supabase = require('../supabase');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * Compare genotype with diplotype table and get matching results
 * @param {string} geneSymbol - DNA Type (e.g., "CYP2D6")
 * @param {string} genotype - Genotype (e.g., "*1/*41")
 * @returns {Promise<Object>} Diplotype match with function details
 */
async function findDiplotype(geneSymbol, genotype) {
  try {
    // Clean genotype: remove " or" and anything after it
    const cleanedGenotype = genotype.replace(/\s+or.*/gi, '').trim();
    
    // Query with timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const { data, error } = await supabase
      .from('diplotype')
      .select('description, consultationtext, totalactivityscore')
      .eq('genesymbol', geneSymbol)
      .eq('diplotype', cleanedGenotype)
      .limit(1)
      .maybeSingle();

    clearTimeout(timeoutId);

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error finding diplotype:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('⚠️ Diplotype query timeout');
    } else {
      console.error('❌ Exception in findDiplotype:', err.message);
    }
    return null;
  }
}

/**
 * Create a report entry in the database
 * @param {Object} reportData - Report information
 * @returns {Promise<Object>} Created report with ID
 */
async function createReport(reportData) {
  try {
    const { data, error } = await supabase
      .from('report')
      .insert([{
        request_id: reportData.request_id,
        test_target: reportData.test_target,
        genotype_summary: reportData.genotype_summary,
        predicted_phenotype: reportData.predicted_phenotype,
        recommendation: reportData.recommendation,
        pdf_path: reportData.pdf_path || null,
        genotype: reportData.genotype
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating report:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('❌ Exception in createReport:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างรายงาน' };
  }
}

/**
 * Generate PDF report for PGx test
 * @param {Object} reportInfo - Complete report information
 * @returns {Promise<string>} PDF file path
 */
async function generatePGxPDF(reportInfo) {
  try {
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Create unique filename with report_id or request_id
    const timestamp = Date.now();
    const reportId = reportInfo.report_id || reportInfo.request_id || timestamp;
    const fileName = `PGx_${reportInfo.patientId}_${reportInfo.test_target}_${reportId}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Load Thai font once
    const fontPath = path.join(__dirname, '..', 'fonts', 'Sarabun-Regular.ttf');
    const fontBoldPath = path.join(__dirname, '..', 'fonts', 'Sarabun-Bold.ttf');
    
    const hasRegularFont = fs.existsSync(fontPath);
    const hasBoldFont = fs.existsSync(fontBoldPath);
    
    if (hasRegularFont) {
      doc.registerFont('THSarabun', fontPath);
      doc.font('THSarabun');
    }
    
    if (hasBoldFont) {
      doc.registerFont('THSarabunBold', fontBoldPath);
    }
    
    // Helper function for bold text
    const setBold = () => hasBoldFont && doc.font('THSarabunBold');
    const setRegular = () => hasRegularFont && doc.font('THSarabun');

    // Header - Laboratory Name
    doc.fontSize(18);
    setBold();
    doc.text('ห้องปฏิบัติการเภสัชพันธุศาสตร์', { align: 'center' });
    
    doc.fontSize(16);
    setRegular();
    doc.text('(Laboratory for Pharmacogenomics)', { align: 'center' });
    doc.moveDown(0.3);
    
    // Contact Information
    doc.fontSize(9).text(
      '6th Floor, Bumrungrat Hospital East tower, Department of Pathology, Faculty of Medicine, Ramathibodi Hospital\nTel. +662-200-4321 Fax +662-200-4322',
      { align: 'center' }
    );
    doc.moveDown(1);

    // Title
    doc.fontSize(13);
    setBold();
    doc.text('PHARMACOGENOMICS AND PERSONALIZED MEDICINE REPORT', { 
      align: 'center', 
      underline: true 
    });
    doc.moveDown(1.2);

    // Patient Information Section
    setRegular();
    doc.fontSize(11);
    
    const leftCol = 70;
    const leftVal = 200;
    const rightCol = 320;
    const rightVal = 430;
    
    // Patient info rows
    const patientInfo = [
      ['ชื่อ-สกุล (Name):', reportInfo.patientName || 'N/A', 'อายุ (Age):', `${reportInfo.patientAge || 'N/A'} ปี (years)`],
      ['เลขประจำตัวผู้ป่วย (HN):', reportInfo.patientId || 'N/A', 'เพศ (Gender):', reportInfo.patientGender || 'N/A'],
      ['ชนิดสิ่งส่งตรวจ (Specimen):', reportInfo.specimen || 'Blood', 'เลขที่รับผล (Patient#):', reportInfo.patientNumber || 'N/A'],
      ['โรงพยาบาล (Hospital):', reportInfo.hospital || 'N/A', 'วันที่รับตัวอย่าง (Create date):', reportInfo.createDate || new Date().toLocaleDateString('th-TH')],
      ['แพทย์ผู้ส่งตรวจ (Clinician):', reportInfo.doctorName || 'N/A', 'วันที่รายงานผล (Update date):', reportInfo.updateDate || new Date().toLocaleDateString('th-TH')]
    ];

    let y = doc.y;
    patientInfo.forEach(row => {
      doc.text(row[0], leftCol, y);
      doc.text(row[1], leftVal, y);
      doc.text(row[2], rightCol, y);
      doc.text(row[3], rightVal, y);
      y += 18;
    });

    doc.text('แพทย์ผู้รับผิดชอบ (Physician) / doc.name:', leftCol, y);
    doc.text(reportInfo.responsibleDoctor || reportInfo.doctorName || 'N/A', leftVal, y);

    doc.moveDown(2);

    // Test Results Section
    doc.fontSize(13);
    setBold();
    doc.text(
      `${reportInfo.test_target} genotyping: ${reportInfo.activityScore || 'n/a'}`,
      { underline: true }
    );
    doc.moveDown(0.8);

    // Gene name
    doc.fontSize(11);
    doc.text(`${reportInfo.test_target} gene`);
    setRegular();
    doc.moveDown(0.3);

    // Allele table - formatted horizontally
    if (reportInfo.alleles?.length > 0) {
      const alleleText = reportInfo.alleles.map(a => `${a.name}  ${a.value}`).join('     ');
      doc.text(alleleText);
    }

    doc.moveDown(0.8);
    
    // Results with bold labels
    const results = [
      ['Genotype:', reportInfo.genotype || 'N/A'],
      ['Total activity score:', reportInfo.activityScore || 'n/a'],
      ['Predicted Phenotype:', reportInfo.predicted_phenotype || 'N/A']
    ];

    results.forEach(([label, value]) => {
      setBold();
      doc.text(label, { continued: true });
      setRegular();
      doc.text(`  ${value}`);
    });

    doc.moveDown(1);

    // Genotype Summary
    setBold();
    doc.text('Genotype Summary:');
    setRegular();
    doc.text(reportInfo.genotype_summary || 'An individual carrying two normal function alleles', {
      align: 'left',
      width: 480,
      lineGap: 2
    });

    doc.moveDown(1);

    // Recommendation section
    setBold();
    doc.text('recommendation:');
    setRegular();
    doc.text(reportInfo.recommendation || 'Please consult a clinical pharmacist for more specific dosing information.', {
      align: 'left',
      width: 480,
      lineGap: 2
    });

    doc.moveDown(3);

    // Signature section
    doc.fontSize(10);
    doc.text('วิธีการในการตรวจและผลทดลอง\nวิธีการในการทดลองผลการทดลอง', { align: 'center' });

    // Footer - positioned at bottom of page
    const footerY = doc.page.height - 60;
    doc.fontSize(8);
    doc.text(
      `สร้างรายงาน-04-${reportInfo.createDate || new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}`,
      50,
      footerY,
      { align: 'left', width: 250 }
    );
    doc.text('Page 1 of 2', doc.page.width - 150, footerY, { align: 'right', width: 100 });

    doc.end();

    // Wait for PDF to finish writing
    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  } catch (err) {
    console.error('❌ Exception in generatePGxPDF:', err);
    throw err;
  }
}

/**
 * Upload PDF to Supabase storage
 * @param {string} filePath - Local file path
 * @param {string} fileName - Desired file name in storage
 * @returns {Promise<string>} Public URL of uploaded file
 */
async function uploadPDFToStorage(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    // Try PDF_Bucket first, then fall back to checking available buckets
    let bucketName = 'PDF_Bucket';
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      console.error('❌ Error uploading to storage:', error);
      
      // If bucket not found, list available buckets
      if (error.message?.includes('Bucket not found')) {
        const { data: buckets } = await supabase.storage.listBuckets();
        console.log('📦 Available buckets:', buckets?.map(b => b.name));
        
        // Try to find a PDF or report bucket
        const pdfBucket = buckets?.find(b => 
          b.name.toLowerCase().includes('pdf') || 
          b.name.toLowerCase().includes('report')
        );
        
        if (pdfBucket) {
          console.log(`🔄 Retrying with bucket: ${pdfBucket.name}`);
          bucketName = pdfBucket.name;
          
          const { data: retryData, error: retryError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileBuffer, {
              contentType: 'application/pdf',
              upsert: true
            });
            
          if (retryError) {
            console.error('❌ Retry failed:', retryError);
            return null;
          }
        } else {
          console.error('❌ No PDF bucket found. Please create "PDF_Bucket" in Supabase Storage.');
          return null;
        }
      } else {
        return null;
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log('✅ PDF uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (err) {
    console.error('❌ Exception in uploadPDFToStorage:', err);
    return null;
  }
}

/**
 * Complete workflow: Generate report, create PDF, upload, and save to database
 * @param {Object} testData - Complete test information
 * @returns {Promise<Object>} Result with report data and PDF path
 */
async function processCompleteReport(testData) {
  try {
    // Step 1: Try to find diplotype match (optional, with timeout)
    let diplotype = null;
    try {
      diplotype = await Promise.race([
        findDiplotype(testData.test_target, testData.genotype),
        new Promise(resolve => setTimeout(() => resolve(null), 2000))
      ]);
    } catch (err) {
      console.log('⚠️ Diplotype lookup skipped:', err.message);
    }
    
    // Get description and consultation from diplotype if available, otherwise use provided data
    const genotypeDescription = diplotype?.description || testData.genotype_summary || 'An individual carrying normal function alleles';
    const consultationText = diplotype?.consultationtext || testData.recommendation || 'Please consult a clinical pharmacist for more specific dosing information.';

    // Step 2: Prepare report data (without PDF path first)
    const reportData = {
      request_id: testData.request_id,
      test_target: testData.test_target,
      genotype: testData.genotype,
      genotype_summary: genotypeDescription,
      predicted_phenotype: testData.predicted_phenotype,
      recommendation: consultationText
    };

    // Step 3: Create report first to get report_id
    const reportResult = await createReport(reportData);
    
    if (!reportResult.success) {
      return reportResult;
    }

    const reportId = reportResult.data.report_id;

    // Step 4: Generate PDF with report_id in filename
    const pdfInfo = {
      ...testData,
      report_id: reportId,
      genotype_summary: genotypeDescription,
      recommendation: consultationText,
      activityScore: diplotype?.totalactivityscore || testData.activityScore || 'N/A'
    };

    const localPdfPath = await generatePGxPDF(pdfInfo);

    // Step 5: Upload to Supabase storage
    const fileName = path.basename(localPdfPath);
    const publicUrl = await uploadPDFToStorage(localPdfPath, fileName);

    if (!publicUrl) {
      // Report already created, just return without PDF URL
      return {
        success: true,
        warning: 'รายงานถูกสร้างแล้ว แต่ไม่สามารถอัพโหลด PDF ได้',
        data: {
          report: reportResult.data,
          pdf_url: null,
          diplotype: diplotype
        }
      };
    }

    // Step 6: Update report with PDF path
    const { error: updateError } = await supabase
      .from('report')
      .update({ pdf_path: publicUrl })
      .eq('report_id', reportId);

    if (updateError) {
      console.error('❌ Error updating PDF path:', updateError.message);
    }

    // Step 7: Clean up local file (optional)
    // fs.unlinkSync(localPdfPath);

    return {
      success: true,
      data: {
        report: reportResult.data,
        pdf_url: publicUrl,
        diplotype: diplotype
      }
    };

  } catch (err) {
    console.error('❌ Exception in processCompleteReport:', err);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างรายงาน: ' + err.message
    };
  }
}

module.exports = {
  findDiplotype,
  createReport,
  generatePGxPDF,
  uploadPDFToStorage,
  processCompleteReport
};
