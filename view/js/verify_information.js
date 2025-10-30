// verify_information.js
// Responsibilities:
// - Determine the PDF URL (from ?pdf= query) or fallback to a default local file path
// - Render it into the iframe viewer
// - Wire up Confirm/Reject buttons to proceed accordingly

(function () {
    const $ = (sel) => document.querySelector(sel);

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

    const defaultPdf = resolvePdfUrl("./PDF/Project.pdf");
    const pdfUrl = resolvePdfUrl(pdfParam) || defaultPdf;

    const hideAll = () => {
        pdfjsContainer.hidden = true;
        pdfFrame.hidden = true;
        pdfFallback.hidden = true;
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
            pdfFrame.removeEventListener("error", onFail);
        };

        pdfFrame.addEventListener("error", onFail, { once: true });
        pdfFrame.addEventListener("load", onLoad, { once: true });
    };

    const initPdfJs = async (url) => {
        if (!canvas || !ctx) return false;

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
                await loadScript(`${CDN_BASE}/pdf.worker.min.js`);
            }
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${CDN_BASE}/pdf.worker.min.js`;

            const pdf = await window.pdfjsLib.getDocument(url).promise;
            let currentPage = 1;
            const totalPages = pdf.numPages;
            pageCountEl.textContent = String(totalPages);

            const renderPage = async (num) => {
                const page = await pdf.getPage(num);
                const containerWidth = canvas.parentElement.clientWidth - 30;
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

            openExternal.href = url;
            btnDownload?.addEventListener("click", () => {
                const a = document.createElement("a");
                a.href = url;
                a.download = url.split("/").pop() ?? "document.pdf";
                a.click();
            });

            hideAll();
            pdfjsContainer.hidden = false;
            await renderPage(currentPage);
            return true;
        } catch (error) {
            console.warn("PDF.js failed, fallback to iframe", error);
            return false;
        }
    };

    btnReload?.addEventListener("click", () => window.location.reload());

    (async () => {
        const ok = await initPdfJs(pdfUrl);
        if (!ok) enableIframe(pdfUrl);
    })();

    btnConfirm?.addEventListener("click", () => {
        if (confirm("ยืนยันว่าข้อมูลในเอกสารถูกต้องใช่หรือไม่?")) {
            window.location.href = "verify_step1.html";
        }
    });

    btnReject?.addEventListener("click", () => {
        const reason = prompt("โปรดระบุเหตุผลในการปฏิเสธ (ไม่บังคับ)", "");
        // TODO: ส่ง reason ไปยัง backend หากต้องการ
        window.location.href = "information.html";
    });

    btnBack?.addEventListener("click", () => {
        if (document.referrer && window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "information.html";
        }
    });
})();

