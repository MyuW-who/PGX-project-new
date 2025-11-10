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
 * Generate PDF report for PGx test (in memory, no local file)
 * @param {Object} reportInfo - Complete report information
 * @returns {Promise<{buffer: Buffer, fileName: string}>} PDF buffer and filename
 */
async function generatePGxPDF(reportInfo) {
  return new Promise((resolve, reject) => {
    try {
      // Create unique filename with report_id or request_id
      const timestamp = Date.now();
      const reportId = reportInfo.report_id || reportInfo.request_id || timestamp;
      const fileName = `PGx_${reportInfo.patientId}_${reportInfo.test_target}_${reportId}.pdf`;

      const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4',
        bufferPages: true
      });
      
      // Collect PDF data in memory instead of writing to file
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve({ buffer: pdfBuffer, fileName });
      });
      doc.on('error', reject);

      // Load Thai font
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
      
      // Helper functions
      const setBold = () => hasBoldFont && doc.font('THSarabunBold');
      const setRegular = () => hasRegularFont && doc.font('THSarabun');

    // === HEADER SECTION ===
    // Purple line at top
    doc.rect(50, 40, doc.page.width - 100, 3).fill('#8B4789');
    
    // Logo area (left side) - PPM Logo placeholder
    doc.fontSize(8).fillColor('#000000');
    setRegular();
    doc.text('รหัสเอกสาร: LAB-02-2374', doc.page.width - 150, 33, { width: 100, align: 'right' });
    
    // Main header box
    const headerY = 55;
    doc.rect(50, headerY, doc.page.width - 100, 75).stroke('#000000');
    
    // Laboratory name - Thai
    doc.fontSize(14);
    setBold();
    doc.fillColor('#000000').text('ห้องปฏิบัติการเภสัชพันธุศาสตร์', 50, headerY + 12, { 
      align: 'center',
      width: doc.page.width - 100
    });
    
    // Laboratory name - English
    doc.fontSize(11);
    setRegular();
    doc.text('(Laboratory for Pharmacogenomics)', 50, headerY + 30, {
      align: 'center',
      width: doc.page.width - 100
    });
    
    // Address
    doc.fontSize(7.5);
    doc.text(
      '6th Floor, Bumrungrat Plus Department Medical Centre, Department of Pathology, Faculty of Medicine',
      50,
      headerY + 47,
      { align: 'center', width: doc.page.width - 100 }
    );
    doc.text(
      'Ramathibodi Hospital Tel. +662-200-4321 Fax +662-200-4322',
      50,
      headerY + 57,
      { align: 'center', width: doc.page.width - 100 }
    );
    
    doc.y = headerY + 85;

    // === TITLE ===
    doc.fontSize(11);
    setBold();
    doc.fillColor('#000000').text('PHARMACOGENOMICS AND PERSONALIZED MEDICINE REPORT', { 
      align: 'center'
    });
    doc.moveDown(1);

    // === PATIENT INFORMATION BOX ===
    const patientBoxY = doc.y;
    doc.rect(50, patientBoxY, doc.page.width - 100, 110).stroke('#000000');
    
    setRegular();
    doc.fontSize(9);
    doc.fillColor('#000000');
    
    // Define columns
    const col1Label = 60;
    const col1Value = 145;
    const col2Label = 310;
    const col2Value = 395;
    
    let y = patientBoxY + 10;
    const lineHeight = 16;
    
    // Row 1: Name and Age
    doc.text('ชื่อ-สกุล (Name):', col1Label, y);
    doc.text(reportInfo.patientName || 'N/A', col1Value, y);
    doc.text('อายุ (Age):', col2Label, y);
    doc.text(`${reportInfo.patientAge || 'N/A'} ปี (years)`, col2Value, y);
    
    y += lineHeight;
    // Row 2: HN and Gender
    doc.text('เลขประจำตัวผู้ป่วย (HN):', col1Label, y);
    doc.text(reportInfo.patientId || 'N/A', col1Value, y);
    doc.text('เพศ (Gender):', col2Label, y);
    doc.text(reportInfo.patientGender || 'N/A', col2Value, y);
    
    y += lineHeight;
    // Row 3: Specimen and Patient#
    doc.text('ชนิดสิ่งส่งตรวจ (Specimen):', col1Label, y);
    doc.text(reportInfo.specimen || 'Blood', col1Value, y);
    doc.text('เลขที่รับผล (Patient#):', col2Label, y);
    doc.text(reportInfo.patientNumber || reportInfo.request_id || 'N/A', col2Value, y);
    
    y += lineHeight;
    // Row 4: Hospital and Create date
    doc.text('โรงพยาบาล (Hospital):', col1Label, y);
    doc.text(reportInfo.hospital || 'hospital', col1Value, y);
    doc.text('วันที่รับตัวอย่าง (Create date):', col2Label, y);
    doc.text(reportInfo.createDate || new Date().toLocaleDateString('th-TH'), col2Value, y);
    
    y += lineHeight;
    // Row 5: Clinician and Update date
    doc.text('แพทย์ผู้ส่งตรวจ (Clinician):', col1Label, y);
    doc.text(reportInfo.doctorName || 'N/A', col1Value, y);
    doc.text('วันที่รายงานผล (Update date):', col2Label, y);
    doc.text(reportInfo.updateDate || new Date().toLocaleDateString('th-TH'), col2Value, y);
    
    y += lineHeight;
    // Row 6: Physician
    doc.text('แพทย์ผู้รับผิดชอบ (Physician) / doc.name:', col1Label, y);
    doc.text(reportInfo.responsibleDoctor || reportInfo.doctorName || 'Doc_name', col1Value, y);

    doc.y = patientBoxY + 125;

    // === TEST RESULTS SECTION ===
    // Section title with gene and score
    doc.fontSize(10);
    setBold();
    doc.text(`${reportInfo.test_target} genotyping: ${reportInfo.activityScore || 'N/A'} (จำนวนคะแนนสภาพ ${reportInfo.activityScore || ''})`, {
      align: 'left'
    });
    doc.moveDown(0.5);

    // Gene name
    doc.fontSize(9);
    setBold();
    doc.text(`${reportInfo.test_target} gene`);
    doc.moveDown(0.3);

    // === ALLELE TABLE ===
    if (reportInfo.alleles?.length > 0) {
      const tableY = doc.y;
      const tableX = 105;
      const numAlleles = reportInfo.alleles.length;
      const cellWidth = 105;
      const cellHeight = 22;
      const tableWidth = cellWidth * numAlleles;
      
      setRegular();
      doc.fontSize(9);
      
      // Draw outer box
      doc.rect(tableX, tableY, tableWidth, cellHeight * 2).stroke('#000000');
      
      // Draw vertical separators
      for (let i = 1; i < numAlleles; i++) {
        const x = tableX + (cellWidth * i);
        doc.moveTo(x, tableY).lineTo(x, tableY + cellHeight * 2).stroke('#000000');
      }
      
      // Draw horizontal separator
      doc.moveTo(tableX, tableY + cellHeight).lineTo(tableX + tableWidth, tableY + cellHeight).stroke('#000000');
      
      // Fill header and value cells
      reportInfo.alleles.forEach((allele, index) => {
        const x = tableX + (cellWidth * index);
        
        // Header (allele name)
        doc.text(allele.name, x + 5, tableY + 6, { 
          width: cellWidth - 10, 
          align: 'center' 
        });
        
        // Value
        doc.text(allele.value, x + 5, tableY + cellHeight + 6, { 
          width: cellWidth - 10, 
          align: 'center' 
        });
      });
      
      doc.y = tableY + cellHeight * 2 + 15;
    }

    // === GENOTYPE, ACTIVITY SCORE, PHENOTYPE ===
    setRegular();
    doc.fontSize(9);
    let resultY = doc.y;
    
    doc.text('Genotype:', 60, resultY);
    doc.text(reportInfo.genotype || 'N/A', 200, resultY);
    
    resultY += 15;
    doc.text('Total activity score:', 60, resultY);
    doc.text(String(reportInfo.activityScore || 'N/A'), 200, resultY);
    
    resultY += 15;
    doc.text('Predicted Phenotype:', 60, resultY);
    doc.text(reportInfo.predicted_phenotype || 'N/A', 200, resultY);
    
    doc.y = resultY + 20;

    // === GENOTYPE SUMMARY ===
    doc.fontSize(9);
    setBold();
    doc.text('Genotype Summary:');
    doc.moveDown(0.3);
    
    setRegular();
    const summaryText = reportInfo.genotype_summary || 'An individual carrying two normal function alleles';
    doc.text(summaryText, {
      width: doc.page.width - 120,
      align: 'left',
      lineGap: 1
    });
    
    doc.moveDown(1);

    // === RECOMMENDATION ===
    setBold();
    doc.text('recommendation:');
    doc.moveDown(0.3);
    
    setRegular();
    const recText = reportInfo.recommendation || 'This result signifies that the patient has [1 copy of a decreased function allele with an activity value of 0.5 (*_*)] or [2 copies of a decreased function allele with an activity value of 0.5 (*_*)] and one copy of a no function allele (*_*) OR two copies for a decreased function allele with an activity value of 0.25 (*_*). Based on the genotype result this patient is predicted to be an intermediate metabolizer for CYP2D6 substrates. This patient may be at risk for an adverse or poor response to medications that are metabolized by CYP2D6. To avoid an untoward drug response, dose adjustments may be necessary for medications metabolized by CYP2D6. Please consult a clinical pharmacist for more information about how CYP2D6 metabolic status influences drug selection and dosing.';
    doc.text(recText, {
      width: doc.page.width - 120,
      align: 'left',
      lineGap: 1
    });

    // === SIGNATURE BOX ===
    const sigBoxY = doc.page.height - 120;
    doc.rect(90, sigBoxY, 415, 40).stroke('#000000');
    
    doc.fontSize(8);
    doc.text('วิธีการและผลการตรวจของสิ่งส่ง', 95, sigBoxY + 5);
    doc.text('วิธีการและผลการตรวจของสิ่งส่ง', 310, sigBoxY + 5);

    // === FOOTER ===
    const footerY = doc.page.height - 40;
    doc.fontSize(7);
    setRegular();
    doc.text(
      `รหัสรายงาน:LAB-02-044 Rev:2 24.11.61`,
      50,
      footerY,
      { align: 'left' }
    );
    doc.text(
      `Page 1 of 2`,
      doc.page.width - 100,
      footerY,
      { align: 'right', width: 50 }
    );

    doc.end();
    } catch (err) {
      console.error('❌ Exception in generatePGxPDF:', err);
      reject(err);
    }
  });
}

/**
 * Upload PDF to Supabase storage
 * @param {Buffer} fileBuffer - PDF buffer
 * @param {string} fileName - Desired file name in storage
 * @returns {Promise<string>} Public URL of uploaded file
 */
async function uploadPDFToStorage(fileBuffer, fileName) {
  try {
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

    // Step 4: Generate PDF with report_id in filename (in memory)
    const pdfInfo = {
      ...testData,
      report_id: reportId,
      genotype_summary: genotypeDescription,
      recommendation: consultationText,
      activityScore: diplotype?.totalactivityscore || 'N/A'
    };

    const { buffer: pdfBuffer, fileName } = await generatePGxPDF(pdfInfo);

    // Step 5: Upload to Supabase storage
    const publicUrl = await uploadPDFToStorage(pdfBuffer, fileName);

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
