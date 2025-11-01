/* ============================================
   📷 SCANNER.JS - Shared Barcode Scanner Popup
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const scannerOverlay = document.getElementById('scannerOverlay');
  const scanBtn = document.getElementById('scanBarcodeBtn');
  const closeScannerBtn = document.getElementById('closeScannerBtn');

  // เมื่อกดปุ่ม "สแกนบาร์โค้ด"
  scanBtn?.addEventListener('click', () => {
    if (scannerOverlay) scannerOverlay.style.display = 'flex';
  });

  // เมื่อกดปุ่ม "ปิด" ใน scanner popup
  closeScannerBtn?.addEventListener('click', () => {
    if (scannerOverlay) scannerOverlay.style.display = 'none';
  });
});