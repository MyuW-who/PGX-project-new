// verify_information.js
// Responsibilities:
// - Determine the PDF URL (from ?pdf= query) or fallback to a default local file path
// - Render it into the iframe viewer
// - Wire up Confirm/Reject buttons to proceed accordingly

(function () {
    const $ = (sel) => document.querySelector(sel);

    // 🔹 ID ทั้งหมดนี้มีอยู่ใน index.html ใหม่แล้ว
    const loader = $("#viLoader");
    const pdfFrame = $("#pdfViewer");
    const pdfjsContainer = $("#pdfjsViewer");
    const canvas = $("#pdfCanvas");
    const ctx = canvas?.getContext("2d");
    const pdfFallback = $("#pdfFallback");
    const btnPrevPage = $("#btnPrevPage");
    const btnNextPage = $("#btnNextPage");
    const pageNumEl = $("#pageNum");
    const pageCountEl = $("#pageCount");
    const btnReload = $("#btnReload");
    const openExternal = $("#openExternal");
    const btnDownload = $("#btnDownload");
    const btnConfirm = $("#btnConfirm");
    const btnReject = $("#btnReject");
    const btnBack = $("#btnBack");

    const params = new URLSearchParams(window.location.search);
    const pdfParam = params.get("pdf");

    const resolvePdfUrl = (input) => {
        if (!input) return null;
        if (/^(file|https?):\/\//i.test(input)) return input;
        try {
            return new URL(input.replace(/\\/g, "/"), window.location.href).href;
        } catch {
            return input;
        }
    };

    // 🔹 คุณอาจต้องแก้ Path นี้ให้ถูกต้อง
    const defaultPdf = resolvePdfUrl("../reports/ada_PGx.pdf");
    const pdfUrl = resolvePdfUrl(pdfParam) || defaultPdf;

    const hideAll = () => {
        // 🔹 ใน HTML ใหม่
        // pdfjsContainer, pdfFrame, pdfFallback ทั้งหมดถูกซ่อนไว้โดย 'hidden' อยู่แล้ว
        // และ loader ก็จะถูกซ่อนโดยฟังก์ชันนี้
        pdfjsContainer.hidden = true;
        pdfFrame.hidden = true;
        pdfFallback.hidden = true;
        if (loader) loader.hidden = true;
    };

    const showFallback = () => {
        hideAll();
        pdfFallback.hidden = false;
    };

    const enableIframe = (url) => {
        hideAll();
        pdfFrame.hidden = false;
        pdfFrame.src = url;

        const onFail = () => showFallback();
        const onLoad = () => {
            // 🔹 เมื่อ Iframe โหลดเสร็จ ก็ซ่อน Loader และเปิดปุ่ม
            hideAll();
            pdfFrame.hidden = false;
            btnConfirm.disabled = false;
        };

        pdfFrame.addEventListener("error", onFail, { once: true });
        pdfFrame.addEventListener("load", onLoad, { once: true });
    };

    const initPdfJs = async (url) => {
        if (!canvas || !ctx) return false;

        // 🔹 ใช้ CDN ของ PDF.js เหมือนเดิม
        const CDN_BASE = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105";
        const loadScript = (src) =>
            new Promise((resolve, reject) => {
                const s = document.createElement("script");
                s.src = src;
                s.onload = resolve;
                s.onerror = reject;
                document.head.appendChild(s);
            });

        try {
            if (!window.pdfjsLib) {
                await loadScript(`${CDN_BASE}/pdf.min.js`);
            }
            // 🔹 แก้ไข: ตรวจสอบ worker ให้ถูกต้อง
            if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
                await loadScript(`${CDN_BASE}/pdf.worker.min.js`);
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${CDN_BASE}/pdf.worker.min.js`;
            }

            const pdf = await window.pdfjsLib.getDocument(url).promise;
            let currentPage = 1;
            const totalPages = pdf.numPages;
            pageCountEl.textContent = String(totalPages);

            const renderPage = async (num) => {
                // 🔹 ทำให้ปุ่ม Active/Inactive
                btnPrevPage.disabled = (num <= 1);
                btnNextPage.disabled = (num >= totalPages);

                const page = await pdf.getPage(num);

                // 🔹 ปรับปรุง: ใช้ clientWidth ของ parent shell
                const containerWidth = canvas.parentElement.clientWidth - 30; // 30 = padding
                const viewport = page.getViewport({ scale: 1 });
                const scale = Math.max(0.35, containerWidth / viewport.width);
                const scaledViewport = page.getViewport({ scale });
                canvas.width = Math.floor(scaledViewport.width);
                canvas.height = Math.floor(scaledViewport.height);
                await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
                pageNumEl.textContent = String(num);
            };

            btnPrevPage?.addEventListener("click", () => {
                if (currentPage > 1) {
                    currentPage -= 1;
                    renderPage(currentPage);
                }
            });

            btnNextPage?.addEventListener("click", () => {
                if (currentPage < totalPages) {
                    currentPage += 1;
                    renderPage(currentPage);
                }
            });

            let resizeTimer;
            window.addEventListener("resize", () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => renderPage(currentPage), 160);
            });

            // 🔽 [จุดแก้ไขที่ 1: ตรรกะการแสดงผล]
            // เราจะสั่งให้ render หน้าแรกให้เสร็จ *ก่อน*
            // ถ้าสำเร็จ ค่อยซ่อน Loader และแสดงผล
            

            // ถ้า render สำเร็จ:
            hideAll(); // ซ่อน Loader
            pdfjsContainer.hidden = false; // แสดง PDF.js

            await renderPage(currentPage); // ลอง render ก่อน
            
            // ย้ายมาไว้ตรงนี้
            openExternal.href = url;
            btnDownload?.addEventListener("click", () => {
                const a = document.createElement("a");
                a.href = url;
                a.download = url.split("/").pop() ?? "document.pdf";
                a.click();
            });

            return true;

        } catch (error) {
            console.warn("PDF.js failed, fallback to iframe", error);
            
            // 🔽 [จุดแก้ไขที่ 2: เพิ่ม hideAll() ใน catch]
            // ถ้าล้มเหลว (ไม่ว่าจะขั้นตอนไหน) สั่งซ่อนทุกอย่าง
            hideAll();
            return false;
        }
    };

    btnReload?.addEventListener("click", () => window.location.reload());

    (async () => {
        // 🔽 [จุดแก้ไขที่ 3: ปรับแก้ตรรกะการเรียก]
        // 1. ลอง PDF.js
        const ok = await initPdfJs(pdfUrl);

        if (ok) {
            // 2. ถ้า PDF.js สำเร็จ: เปิดปุ่ม
            // (initPdfJs จะจัดการซ่อน Loader และแสดงผลเอง)
             btnConfirm.disabled = false;
        } else {
            // 3. ถ้า PDF.js ล้มเหลว:
            // (initPdfJs จะเรียก hideAll() เพื่อซ่อน Loader แล้ว)
            // ให้ลองเปิดด้วย Iframe ต่อ
            enableIframe(pdfUrl);
        }
    })();

    btnConfirm?.addEventListener("click", () => {
        if (confirm("ยืนยันว่าข้อมูลในเอกสารถูกต้องใช่หรือไม่?")) {
            // TODO: เปลี่ยน URL ปลายทางตามที่คุณต้องการ
            window.location.href = "verify_step1.html";
        }
    });

    btnReject?.addEventListener("click", () => {
        const reason = prompt("โปรดระบุเหตุผลในการปฏิเสธ (ไม่บังคับ)", "");
        // TODO: ส่ง reason ไปยัง backend หากต้องการ
        if (reason !== null) { // เช็คว่าผู้ใช้ไม่กดยกเลิก
            // TODO: เปลี่ยน URL ปลายทางตามที่คุณต้องการ
            window.location.href = "information.html";
        }
    });

    btnBack?.addEventListener("click", () => {
        if (document.referrer && window.history.length > 1) {
            window.history.back();
        } else {
            // TODO: เปลี่ยน URL ปลายทางตามที่คุณต้องการ
            window.location.href = "information.html";
        }
    });
})();
