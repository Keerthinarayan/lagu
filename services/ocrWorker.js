// Dedicated Web Worker: renders PDF pages (via OffscreenCanvas) and runs
// Kannada OCR on them entirely off the main thread. Browsers deprioritize a
// tab's main thread when it's hidden/backgrounded (to save CPU/battery),
// which is what makes OCR crawl when you switch away from the tab. Worker
// threads aren't subject to that same page-visibility throttling, so doing
// the rendering *and* the recognition here keeps things running at full
// speed regardless of tab focus.
//
// Plain classic (non-module) worker so it can use importScripts() to load
// the same CDN builds of pdf.js and Tesseract.js the main thread uses.

importScripts(
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'
);

const renderPageToOffscreenCanvas = async (pdf, pageNum) => {
  const page = await pdf.getPage(pageNum);
  // Render at 2x for sharper glyphs => noticeably better OCR accuracy.
  const viewport = page.getViewport({ scale: 2 });
  const canvas = new OffscreenCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
};

self.onmessage = async (event) => {
  const { type, buffer } = event.data || {};
  if (type !== 'start') return;

  try {
    // disableWorker: pdf.js would otherwise try to spin up its own nested
    // worker for core parsing; running it inline here (we're already off
    // the main thread) keeps things simpler and avoids double-nesting.
    const pdf = await pdfjsLib.getDocument({ data: buffer, disableWorker: true }).promise;
    const numPages = pdf.numPages;

    const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
    const workerCount = Math.max(1, Math.min(6, cores - 1, numPages));

    self.postMessage({
      type: 'progress',
      message: workerCount > 1
        ? `Setting up ${workerCount} Kannada OCR engines (first run downloads the language model)…`
        : 'Setting up the Kannada OCR engine (first run downloads the language model)…',
    });

    // 'kan' = Kannada trained data; OEM 1 = LSTM engine.
    const workers = await Promise.all(
      Array.from({ length: workerCount }, () => Tesseract.createWorker('kan', 1))
    );

    const pageTexts = new Array(numPages).fill('');
    let nextPageIndex = 0; // 0-based, shared cursor across worker loops below
    let completedPages = 0;

    const runWorkerLoop = async (worker) => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const pageIndex = nextPageIndex++;
        if (pageIndex >= numPages) return;
        const pageNum = pageIndex + 1;

        try {
          const canvas = await renderPageToOffscreenCanvas(pdf, pageNum);
          const { data } = await worker.recognize(canvas);
          pageTexts[pageIndex] = (data && data.text) || '';
        } catch (pageError) {
          // Don't let one bad page abort OCR for an entire 1000-page book.
          console.error(`OCR failed on page ${pageNum}:`, pageError);
        }

        completedPages++;
        self.postMessage({ type: 'progress', message: `Reading the text with OCR — page ${completedPages} of ${numPages}…` });
      }
    };

    try {
      await Promise.all(workers.map(runWorkerLoop));
    } finally {
      await Promise.all(workers.map((w) => w.terminate()));
    }

    self.postMessage({ type: 'done', pageTexts });
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Unknown OCR error.' });
  }
};
