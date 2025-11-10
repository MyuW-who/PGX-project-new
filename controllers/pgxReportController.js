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
    
    // Set a timeout of 3 seconds for the query
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 3000)
    );
    
    const queryPromise = supabase
      .from('diplotype')
      .select('*')
      .eq('genesymbol', geneSymbol)
      .eq('diplotype', cleanedGenotype)
      .limit(1)
      .single();
    
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('❌ Error finding diplotype:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ Exception in findDiplotype:', err.message);
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
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const reportId = reportInfo.report_id || reportInfo.request_id || Date.now();
    const fileName = `PGx_${reportInfo.patientId}_${reportInfo.test_target}_${reportId}_${timestamp}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Load Thai font
    const fontPath = path.join(__dirname, '..', 'fonts', 'Sarabun-Regular.ttf');
    const fontBoldPath = path.join(__dirname, '..', 'fonts', 'Sarabun-Bold.ttf');
    
    let hasRegularFont = false;
    let hasBoldFont = false;
    
    if (fs.existsSync(fontPath)) {
      doc.registerFont('THSarabun', fontPath);
      hasRegularFont = true;
    }
    
    if (fs.existsSync(fontBoldPath)) {
      doc.registerFont('THSarabunBold', fontBoldPath);
      hasBoldFont = true;
    }
    
    // Use Thai font if available, otherwise use default
    if (hasRegularFont) {
      doc.font('THSarabun');
    }

    // Header - Laboratory Name
    doc.fontSize(18);
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text('ห้องปฏิบัติการเภสัชพันธุศาสตร์', { align: 'center' });
    
    doc.fontSize(16);
    if (hasRegularFont) doc.font('THSarabun');
    doc.text('(Laboratory for Pharmacogenomics)', { align: 'center' });
    doc.moveDown(0.3);
    
    // Contact Information
    doc.fontSize(9).text(
      '6th Floor, Bumrungrat Hospital East tower, Department of Pathology, Faculty of Medicine, Ramathibodi Hospital',
      { align: 'center' }
    );
    doc.text('Tel. +662-200-4321 Fax +662-200-4322', { align: 'center' });
    doc.moveDown(1);

    // Title
    doc.fontSize(13);
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text('PHARMACOGENOMICS AND PERSONALIZED MEDICINE REPORT', { 
      align: 'center', 
      underline: true 
    });
    doc.moveDown(1.2);

    // Patient Information Section
    if (hasRegularFont) doc.font('THSarabun');
    doc.fontSize(11);
    
    const leftCol = 70;
    const leftVal = 200;
    const rightCol = 320;
    const rightVal = 430;
    let y = doc.y;

    // Row 1
    doc.text('ชื่อ-สกุล (Name):', leftCol, y);
    doc.text(reportInfo.patientName || 'N/A', leftVal, y);
    doc.text('อายุ (Age):', rightCol, y);
    doc.text(`${reportInfo.patientAge || 'N/A'} ปี (years)`, rightVal, y);

    y += 18;
    doc.text('เลขประจำตัวผู้ป่วย (HN):', leftCol, y);
    doc.text(reportInfo.patientId || 'N/A', leftVal, y);
    doc.text('เพศ (Gender):', rightCol, y);
    doc.text(reportInfo.patientGender || 'N/A', rightVal, y);

    y += 18;
    doc.text('ชนิดสิ่งส่งตรวจ (Specimen):', leftCol, y);
    doc.text(reportInfo.specimen || 'Blood', leftVal, y);
    doc.text('เลขที่รับผล (Patient#):', rightCol, y);
    doc.text(reportInfo.patientNumber || 'N/A', rightVal, y);

    y += 18;
    doc.text('โรงพยาบาล (Hospital):', leftCol, y);
    doc.text(reportInfo.hospital || 'N/A', leftVal, y);
    doc.text('วันที่รับตัวอย่าง (Create date):', rightCol, y);
    doc.text(reportInfo.createDate || new Date().toLocaleDateString('th-TH'), rightVal, y);

    y += 18;
    doc.text('แพทย์ผู้ส่งตรวจ (Clinician):', leftCol, y);
    doc.text(reportInfo.doctorName || 'N/A', leftVal, y);
    doc.text('วันที่รายงานผล (Update date):', rightCol, y);
    doc.text(reportInfo.updateDate || new Date().toLocaleDateString('th-TH'), rightVal, y);

    y += 18;
    doc.text('แพทย์ผู้รับผิดชอบ (Physician) / doc.name:', leftCol, y);
    doc.text(reportInfo.responsibleDoctor || reportInfo.doctorName || 'N/A', leftVal, y);

    doc.moveDown(2);

    // Test Results Section
    doc.fontSize(13);
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text(
      `${reportInfo.test_target} genotyping: ${reportInfo.activityScore || 'n/a'}`,
      { underline: true }
    );
    doc.moveDown(0.8);

    // Gene name
    doc.fontSize(11);
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text(`${reportInfo.test_target} gene`);
    if (hasRegularFont) doc.font('THSarabun');
    doc.moveDown(0.3);

    // Allele table - formatted horizontally
    if (reportInfo.alleles && reportInfo.alleles.length > 0) {
      let alleleText = '';
      reportInfo.alleles.forEach((allele, index) => {
        alleleText += `${allele.name}  ${allele.value}`;
        if (index < reportInfo.alleles.length - 1) {
          alleleText += '     ';
        }
      });
      doc.text(alleleText);
    }

    doc.moveDown(0.8);
    
    // Genotype
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text('Genotype:', { continued: true });
    if (hasRegularFont) doc.font('THSarabun');
    doc.text(`  ${reportInfo.genotype || 'N/A'}`);

    // Total activity score
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text('Total activity score:', { continued: true });
    if (hasRegularFont) doc.font('THSarabun');
    doc.text(`  ${reportInfo.activityScore || 'n/a'}`);

    // Predicted Phenotype
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text('Predicted Phenotype:', { continued: true });
    if (hasRegularFont) doc.font('THSarabun');
    doc.text(`  ${reportInfo.predicted_phenotype || 'N/A'}`);

    doc.moveDown(1);

    // Genotype Summary
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text('Genotype Summary:');
    if (hasRegularFont) doc.font('THSarabun');
    doc.text(reportInfo.genotype_summary || 'An individual carrying two normal function alleles', {
      align: 'left',
      width: 480,
      lineGap: 2
    });

    doc.moveDown(1);

    // Recommendation section
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text('recommendation:');
    if (hasRegularFont) doc.font('THSarabun');
    doc.text(reportInfo.recommendation || 'This result signifies that the patient has two copies of a normal function allele. Patients with this genotype are expected to require higher starting tacrolimus dosing (1.5 to 3 times the standard dose-maximum starting dose not to exceed 0.3mg/kg/day). Dosage adjustments or selection of alternative therapy may be necessary due to other factors (e.g., medication interactions, or hepatic function). Please consult a clinical pharmacist for more specific dosing information.', {
      align: 'left',
      width: 480,
      lineGap: 2
    });

    doc.moveDown(3);

    // Signature section
    doc.fontSize(10);
    if (hasRegularFont) doc.font('THSarabun');
    doc.text('วิธีการในการตรวจและผลทดลอง', { align: 'center' });
    doc.text('วิธีการในการทดลองผลการทดลอง', { align: 'center' });

    doc.moveDown(2);

    // Footer - positioned at bottom of page
    const footerY = doc.page.height - 60;
    doc.fontSize(8);
    if (hasRegularFont) doc.font('THSarabun');
    
    // Left side - report date
    doc.text(
      `สร้างรายงาน-04-${reportInfo.createDate || new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}`,
      50,
      footerY,
      { align: 'left', width: 250 }
    );
    
    // Right side - page number
    doc.text(
      'Page 1 of 2',
      doc.page.width - 150,
      footerY,
      { align: 'right', width: 100 }
    );

    doc.end();

    // Wait for PDF to finish writing
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return filePath;
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
    
    const { data, error } = await supabase.storage
      .from('PDF_Bucket')
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      console.error('❌ Error uploading to storage:', error.message);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('PDF_Bucket')
      .getPublicUrl(fileName);

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
