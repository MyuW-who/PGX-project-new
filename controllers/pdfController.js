const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

async function generatePDF(reportData) {
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

  const filePath = path.join(reportsDir, `${reportData.name || 'report'}_PGx.pdf`);
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // ✅ โหลดฟอนต์ไทย
  const fontPath = path.join(__dirname, '..', 'fonts', 'Sarabun-Regular.ttf');
  doc.registerFont('THSarabun', fontPath);

  // ใช้ฟอนต์นี้ตลอดทั้งไฟล์
  doc.font('THSarabun').fontSize(18).text(
    'รายงานผลการตรวจ Pharmacogenomics (PHARMACOGENOMICS AND PERSONALIZED MEDICINE REPORT)',
    { align: 'center' }
  );

  doc.moveDown();

  // ข้อมูลผู้ป่วย
  doc.fontSize(14);
  doc.text(`ชื่อ-สกุล: ${reportData.name}`);
  doc.text(`อายุ: ${reportData.age} ปี`);
  doc.text(`เพศ: ${reportData.gender}`);
  doc.text(`HN: ${reportData.hn}`);
  doc.text(`โรงพยาบาล: ${reportData.hospital}`);
  doc.moveDown();

  // ส่วนผลตรวจ
  doc.fontSize(16).text('CYP2C9 genotyping', { underline: true });
  doc.fontSize(14).text('Predicted Phenotype: Normal metabolizer (NM)');
  doc.text('Interpretation: สามารถใช้ยาที่มีการเปลี่ยนแปลงยาผ่านเอนไซม์นี้ได้ในขนาดมาตรฐาน');
  doc.moveDown();

  doc.fontSize(12).text('หมายเหตุ: ข้อมูลนี้ใช้เพื่อประกอบการรักษาเท่านั้น', { align: 'center' });

  doc.end();
  await new Promise((resolve) => stream.on('finish', resolve));

  return filePath;
}

module.exports = { generatePDF };
