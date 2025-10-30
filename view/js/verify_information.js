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
	const btnConfirm = $("#btnConfirm");
	const btnReject = $("#btnReject");
		const btnBack = $("#btnBack");
		const btnPrevPage = $("#btnPrevPage");
		const btnNextPage = $("#btnNextPage");
		const pageNumEl = $("#pageNum");
		const pageCountEl = $("#pageCount");

	// Parse query params
	const params = new URLSearchParams(window.location.search);
	let pdfParam = params.get("pdf");

	// If provided as a Windows path (e.g., C:\\Users\\...\\file.pdf), convert to file:/// URL
	const toFileUrl = (input) => {
		if (!input) return input;
		// Already a URL (http/https/file)
		if (/^(file|https?):\/\//i.test(input)) return input;
		// Convert Windows path -> file URL
		const normalized = input.replace(/\\/g, "/");
		if (/^[a-zA-Z]:\//.test(normalized)) {
			return `file:///${normalized}`;
		}
		// Treat as relative URL
		return input;
	};

		// Default PDF: use the bundled mockup placed next to this HTML file
		// Path is relative to verify_information.html (view/verify_information.html)
		// You can still override via ?pdf=
		let defaultPdf = "mockuppdf.pdf";

	const pdfUrl = toFileUrl(pdfParam) || defaultPdf;

		const setPdfIframe = (url) => {
		try {
			pdfFrame.src = url;
			// Small sanity: if it fails to load (blocked/404), show fallback after a timeout
			const timer = setTimeout(() => {
				// When embedded viewers are blocked, the frame may stay blank
				// Show help instead. Users can try providing ?pdf= URL/path.
				if (!pdfFrame.contentDocument) {
					pdfFallback.hidden = false;
				}
			}, 1500);
			pdfFrame.addEventListener("load", () => {
				clearTimeout(timer);
				// If contentDocument exists, keep fallback hidden
				pdfFallback.hidden = true;
			});
		} catch (err) {
			console.error("Failed to set PDF src:", err);
			pdfFallback.hidden = false;
		}
	};

		// Try to use PDF.js single-page viewer first; fallback to iframe if fails
		const initPdfJs = async (url) => {
			const CDN_BASE = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105";
			const loadScript = (src) => new Promise((resolve, reject) => {
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
				if (!window.pdfjsLib) throw new Error("PDF.js not loaded");
				window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${CDN_BASE}/pdf.worker.min.js`;

				const pdf = await window.pdfjsLib.getDocument(url).promise;
				let currentPage = 1;
				const totalPages = pdf.numPages;
				pageCountEl.textContent = String(totalPages);

				const renderPage = async (num, fit = true) => {
					const page = await pdf.getPage(num);
					let scale = 1;
					const container = canvas.parentElement;
					const viewport = page.getViewport({ scale: 1 });
					if (fit && container && container.clientWidth) {
						scale = Math.max(0.1, (container.clientWidth - 24) / viewport.width); // padding margin
					}
					const vp = page.getViewport({ scale });
					canvas.width = Math.floor(vp.width);
					canvas.height = Math.floor(vp.height);
					const renderTask = page.render({ canvasContext: ctx, viewport: vp });
					await renderTask.promise;
					pageNumEl.textContent = String(num);
				};

				// Controls
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

				// Re-render on resize (debounced)
				let resizeTimer;
				window.addEventListener("resize", () => {
					clearTimeout(resizeTimer);
					resizeTimer = setTimeout(() => renderPage(currentPage, true), 150);
				});

				// Show pdfjs viewer, hide iframe
				pdfjsContainer.hidden = false;
				pdfFrame.hidden = true;
				pdfFallback.hidden = true;

				await renderPage(currentPage);
				return true;
			} catch (err) {
				console.warn("PDF.js viewer failed, falling back to iframe:", err);
				return false;
			}
		};

		(async () => {
			const ok = await initPdfJs(pdfUrl);
			if (!ok) {
				pdfjsContainer.hidden = true;
				pdfFrame.hidden = false;
				setPdfIframe(pdfUrl);
			}
		})();

	// Actions
	btnConfirm?.addEventListener("click", () => {
		// Assumption: proceed to the first verification step
		// You can adapt this to your actual flow or dispatch IPC to main process.
		const go = () => (window.location.href = "verify_step1.html");
		if (confirm("ยืนยันว่าข้อมูลในเอกสารถูกต้องใช่หรือไม่?")) {
			go();
		}
	});

	btnReject?.addEventListener("click", () => {
		// Assumption: navigate back to information input page
		const go = () => (window.location.href = "information.html");
		const reason = prompt("โปรดระบุเหตุผลในการปฏิเสธ (ไม่บังคับ)", "");
		// You can forward 'reason' to your backend or audit log via IPC/supabase here.
		go();
	});

		btnBack?.addEventListener("click", () => {
			// Prefer browser history back, with a safe fallback route
			if (document.referrer && window.history.length > 1) {
				window.history.back();
			} else {
				// Fallback: back to previous page in your flow
				window.location.href = "information.html";
			}
		});
})();

