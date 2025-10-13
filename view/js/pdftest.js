document.getElementById('generateBtn').addEventListener('click', async () => {
  const reportData = {
    name: document.getElementById('name').value,
    age: document.getElementById('age').value,
    gender: document.getElementById('gender').value,
    hn: document.getElementById('hn').value,
    hospital: document.getElementById('hospital').value,
  };

  const status = document.getElementById('status');
  const previewContainer = document.getElementById('pdfPreviewContainer');
  const pdfFrame = document.getElementById('pdfFrame');

  status.textContent = "กำลังสร้าง PDF...";

  const filePath = await window.electron.invoke('generate-pdf', reportData);

  // ✅ แปลงเป็น URL ให้ Electron อ่านได้
  const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
  console.log("PDF Path:", filePath);
  console.log("PDF URL:", fileUrl);

  status.textContent = "✅ สร้าง PDF สำเร็จ";
  pdfFrame.src = fileUrl;
  previewContainer.style.display = 'block';
});
