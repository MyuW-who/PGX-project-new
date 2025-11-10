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
    
    const { data, error } = await supabase
      .from('diplotype')
      .select('*')
      .eq('genesymbol', geneSymbol)
      .eq('diplotype', cleanedGenotype)
      .single();

    if (error) {
      console.error('❌ Error finding diplotype:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ Exception in findDiplotype:', err);
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

    // Create unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `PGx_${reportInfo.patientId}_${reportInfo.test_target}_${timestamp}.pdf`;
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

    // Header
    if (hasBoldFont) {
      doc.fontSize(16).font('THSarabunBold').text(
        'ห้องปฏิบัติการเภสัชพันธุศาสตร์',
        { align: 'center' }
      );
    } else {
      doc.fontSize(16).text(
        'ห้องปฏิบัติการเภสัชพันธุศาสตร์',
        { align: 'center' }
      );
    }
    
    if (hasRegularFont) {
      doc.fontSize(14).font('THSarabun').text(
        '(Laboratory for Pharmacogenomics)',
        { align: 'center' }
      );
    } else {
      doc.fontSize(14).text(
        '(Laboratory for Pharmacogenomics)',
        { align: 'center' }
      );
    }
    doc.moveDown(0.5);
    
    doc.fontSize(10).text(
      '6th Floor, Bumrungrat Hospital East tower, Department of Pathology, Faculty of Medicine, Ramathibodi Hospital Tel. +662-200-4321 Fax +662-200-4322',
      { align: 'center' }
    );
    doc.moveDown(1);

    // Title
    if (hasBoldFont) {
      doc.fontSize(14).font('THSarabunBold');
    } else {
      doc.fontSize(14);
    }
    doc.text(
      'PHARMACOGENOMICS AND PERSONALIZED MEDICINE REPORT',
      { align: 'center', underline: true }
    );
    doc.moveDown(1);

    // Patient Information
    if (hasRegularFont) {
      doc.font('THSarabun');
    }
    doc.fontSize(12);
    const leftColumn = 50;
    const rightColumn = 300;
    let yPos = doc.y;

    doc.text(`ชื่อ-สกุล (Name):`, leftColumn, yPos);
    doc.text(reportInfo.patientName || 'N/A', leftColumn + 120, yPos);
    doc.text(`อายุ (Age):`, rightColumn, yPos);
    doc.text(`${reportInfo.patientAge || 'N/A'} ปี (years)`, rightColumn + 80, yPos);

    yPos += 20;
    doc.text(`เลขประจำตัวผู้ป่วย (HN):`, leftColumn, yPos);
    doc.text(reportInfo.patientId || 'N/A', leftColumn + 120, yPos);
    doc.text(`เพศ (Gender):`, rightColumn, yPos);
    doc.text(reportInfo.patientGender || 'N/A', rightColumn + 80, yPos);

    yPos += 20;
    doc.text(`ชนิดสิ่งส่งตรวจ (Specimen):`, leftColumn, yPos);
    doc.text(reportInfo.specimen || 'Blood', leftColumn + 120, yPos);
    doc.text(`เลขที่รับผล (Patient#):`, rightColumn, yPos);
    doc.text(reportInfo.patientNumber || 'N/A', rightColumn + 80, yPos);

    yPos += 20;
    doc.text(`โรงพยาบาล (Hospital):`, leftColumn, yPos);
    doc.text(reportInfo.hospital || 'N/A', leftColumn + 120, yPos);
    doc.text(`วันที่รับตัวอย่าง (Create date):`, rightColumn, yPos);
    doc.text(reportInfo.createDate || new Date().toLocaleDateString('th-TH'), rightColumn + 80, yPos);

    yPos += 20;
    doc.text(`แพทย์ผู้ส่งตรวจ (Clinician):`, leftColumn, yPos);
    doc.text(reportInfo.doctorName || 'N/A', leftColumn + 120, yPos);
    doc.text(`วันที่รายงานผล (Update date):`, rightColumn, yPos);
    doc.text(reportInfo.updateDate || new Date().toLocaleDateString('th-TH'), rightColumn + 80, yPos);

    yPos += 20;
    doc.text(`แพทย์ผู้รับผิดชอบ (Physician) / doc.name:`, leftColumn, yPos);
    doc.text(reportInfo.responsibleDoctor || reportInfo.doctorName || 'N/A', leftColumn + 120, yPos);

    doc.moveDown(1.5);

    // Test Results Section
    doc.fontSize(14);
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text(
      `${reportInfo.test_target} genotyping: ${reportInfo.activityScore || 'N/A'}`,
      { underline: true }
    );
    doc.moveDown(0.5);

    doc.fontSize(12);
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text(`${reportInfo.test_target} gene`);
    if (hasRegularFont) doc.font('THSarabun');

    // Allele table
    if (reportInfo.alleles && reportInfo.alleles.length > 0) {
      reportInfo.alleles.forEach(allele => {
        doc.text(`${allele.name}    ${allele.value}`);
      });
    }

    doc.moveDown(0.5);
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text(`Genotype:`, { continued: true });
    if (hasRegularFont) doc.font('THSarabun');
    doc.text(`  ${reportInfo.genotype || 'N/A'}`);

    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text(`Total activity score:`, { continued: true });
    if (hasRegularFont) doc.font('THSarabun');
    doc.text(`  ${reportInfo.activityScore || 'N/A'}`);

    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text(`Predicted Phenotype:`, { continued: true });
    if (hasRegularFont) doc.font('THSarabun');
    doc.text(`  ${reportInfo.predicted_phenotype || 'N/A'}`);

    doc.moveDown(0.5);
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text(`Genotype Summary:`);
    if (hasRegularFont) doc.font('THSarabun');
    doc.text(reportInfo.genotype_summary || 'N/A', {
      align: 'justify',
      width: 500
    });

    doc.moveDown(1);

    // Recommendation section
    if (hasBoldFont) doc.font('THSarabunBold');
    doc.text(`recommendation:`);
    if (hasRegularFont) doc.font('THSarabun');
    doc.text(reportInfo.recommendation || 'N/A', {
      align: 'justify',
      width: 500
    });

    doc.moveDown(2);

    // Signature section
    doc.fontSize(10).text('วิธีการในการตรวจและผลทดลอง', { align: 'center' });
    doc.text('วิธีการในการทดลองผลการทดลอง', { align: 'center' });

    // Footer
    doc.fontSize(8).text(
      `สร้างรายงานเมื่อ: ${new Date().toLocaleString('th-TH')}`,
      50,
      doc.page.height - 50,
      { align: 'left' }
    );
    doc.text(
      `Page 1 of 2`,
      50,
      doc.page.height - 50,
      { align: 'right' }
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
    // Step 1: Find diplotype match (for validation only)
    const diplotype = await findDiplotype(testData.test_target, testData.genotype);
    
    // Get description and consultation from diplotype if available, otherwise use provided data
    const genotypeDescription = diplotype?.description || testData.genotype_summary || 'N/A';
    const consultationText = diplotype?.consultationtext || testData.recommendation || 'N/A';

    // Step 2: Prepare report data
    const reportData = {
      request_id: testData.request_id,
      test_target: testData.test_target,
      genotype: testData.genotype,
      genotype_summary: genotypeDescription,
      predicted_phenotype: testData.predicted_phenotype,
      recommendation: consultationText
    };

    // Step 3: Generate PDF
    const pdfInfo = {
      ...testData,
      genotype_summary: genotypeDescription,
      recommendation: consultationText,
      activityScore: diplotype?.totalactivityscore || testData.activityScore || 'N/A'
    };

    const localPdfPath = await generatePGxPDF(pdfInfo);

    // Step 4: Upload to Supabase storage
    const fileName = path.basename(localPdfPath);
    const publicUrl = await uploadPDFToStorage(localPdfPath, fileName);

    if (!publicUrl) {
      // Still save report even if PDF upload fails
      const reportResult = await createReport(reportData);
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

    // Step 5: Save report to database with PDF path
    reportData.pdf_path = publicUrl;
    
    const reportResult = await createReport(reportData);

    if (!reportResult.success) {
      return reportResult;
    }

    // Step 6: Clean up local file (optional)
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
