// This file uses global libraries loaded from CDNs in index.html.
// We declare them here to satisfy TypeScript.
declare const pdfjsLib: any;
declare const mammoth: any;
declare const Tesseract: any;

/** Callback used to report parsing/OCR progress to the UI. */
export type ProgressCallback = (message: string) => void;

/**
 * Checks if the extracted text from a PDF is likely garbled.
 * It does this by checking for a reasonable percentage of Kannada characters.
 * @param text The text extracted from the PDF.
 * @returns true if the text is likely garbled, false otherwise.
 */
const isGarbled = (text: string): boolean => {
  if (!text || text.trim().length === 0) {
    return true; // Empty => treat as needing OCR fallback.
  }
  const kannadaCharRegex = /[ಀ-೿]/g;
  const kannadaChars = text.match(kannadaCharRegex) || [];
  const percentage = (kannadaChars.length / text.length) * 100;

  // If less than 50% of the characters are Kannada, it's likely garbled or mixed content.
  // This threshold can be adjusted.
  return percentage < 50;
};

/**
 * Extracts the text of a single PDF page, using each text item's on-page
 * position to decide where spaces and line breaks actually belong.
 *
 * pdf.js often splits a single visual word into several small text items
 * (especially for PDFs built with legacy/complex Kannada fonts). Blindly
 * joining every item with a space — the previous approach — inserted a
 * stray space into the middle of words. Instead, we only insert a space
 * when there's a real horizontal gap between consecutive items, and a
 * newline when the next item starts on a different line.
 * @param page A loaded pdf.js page.
 * @returns The page's text, with spacing reconstructed from item positions.
 */
const extractPageText = async (page: any): Promise<string> => {
  const content = await page.getTextContent();
  const items: any[] = content.items || [];

  let text = '';
  let prevItem: any = null;

  for (const item of items) {
    if (!item.str) continue;

    if (prevItem) {
      const prevY = prevItem.transform[5];
      const curY = item.transform[5];
      const lineHeight = Math.abs(item.transform[3]) || Math.abs(item.transform[0]) || 10;
      const sameLine = Math.abs(curY - prevY) < lineHeight * 0.5;

      if (!sameLine) {
        text += '\n';
      } else {
        const prevEndX = prevItem.transform[4] + (prevItem.width || 0);
        const curX = item.transform[4];
        const gap = curX - prevEndX;
        // Only treat a real visual gap as a word boundary; small gaps between
        // glyph fragments of the same word should not become a space.
        if (gap > lineHeight * 0.25) {
          text += ' ';
        }
      }
    }

    text += item.str;
    if (item.hasEOL) {
      text += '\n';
    }

    prevItem = item;
  }

  return text;
};

/**
 * Detects lines that repeat identically across most pages (book titles,
 * running headers, footer URLs, etc.) and strips them out. Only looks at
 * the first and last non-empty line of each page, since that's where
 * running headers/footers live.
 * @param pageTexts One extracted text block per PDF page.
 * @returns The same pages with repeated header/footer lines removed.
 */
const stripRepeatedHeaderFooter = (pageTexts: string[]): string[] => {
  // Need enough pages to distinguish "recurring boilerplate" from real content.
  if (pageTexts.length < 3) return pageTexts;

  const pageLines = pageTexts.map(t => t.split('\n').map(l => l.trim()).filter(l => l.length > 0));

  const mostCommonLine = (lines: (string | undefined)[]): string | null => {
    const counts = new Map<string, number>();
    lines.forEach(l => {
      if (l) counts.set(l, (counts.get(l) || 0) + 1);
    });
    let best: string | null = null;
    let bestCount = 0;
    counts.forEach((count, line) => {
      if (count > bestCount) {
        best = line;
        bestCount = count;
      }
    });
    // Require it to show up on at least half the pages to count as boilerplate.
    return bestCount >= Math.ceil(pageTexts.length * 0.5) ? best : null;
  };

  const headerCandidate = mostCommonLine(pageLines.map(lines => lines[0]));
  const footerCandidate = mostCommonLine(pageLines.map(lines => lines[lines.length - 1]));

  return pageLines.map(lines => {
    let filtered = lines;
    if (headerCandidate && filtered[0] === headerCandidate) {
      filtered = filtered.slice(1);
    }
    if (footerCandidate && filtered.length > 0 && filtered[filtered.length - 1] === footerCandidate) {
      filtered = filtered.slice(0, -1);
    }
    return filtered.join('\n');
  });
};

/**
 * Renders a single PDF page to a canvas at 2x scale for sharper OCR glyphs.
 * @param pdf A loaded pdf.js document.
 * @param pageNum 1-based page number to render.
 */
const renderPageToCanvas = async (pdf: any, pageNum: number): Promise<HTMLCanvasElement> => {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create a canvas to render the PDF for OCR.');
  }
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
};

/**
 * Renders every page of a PDF to an image and runs Kannada OCR on it.
 * This is the reliable path for PDFs whose text layer is missing (scanned)
 * or encoded with legacy ASCII fonts (Nudi/Baraha) that extract as garbage.
 *
 * OCR is the slow part of this app, especially for books with hundreds or
 * thousands of pages, so this runs a small pool of Tesseract workers in
 * parallel (each gets its own dedicated worker thread doing the actual
 * recognition, so this is real multi-core parallelism, not just concurrency)
 * instead of one worker churning through pages one at a time.
 * @param pdf A loaded pdf.js document.
 * @param onProgress Optional progress reporter.
 * @returns One OCR-extracted text block per page, in page order.
 */
const ocrPdf = async (pdf: any, onProgress?: ProgressCallback): Promise<string[]> => {
  if (typeof Tesseract === 'undefined') {
    throw new Error('OCR engine failed to load. Please check your internet connection and try again.');
  }

  const numPages = pdf.numPages;
  // Cap the pool: each worker holds its own WASM engine + trained data in
  // memory, so more isn't free. Leave a core free for rendering/UI work.
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const workerCount = Math.max(1, Math.min(6, cores - 1, numPages));

  onProgress?.(
    workerCount > 1
      ? `Setting up ${workerCount} Kannada OCR engines (first run downloads the language model)…`
      : 'Setting up the Kannada OCR engine (first run downloads the language model)…'
  );

  // 'kan' = Kannada trained data; OEM 1 = LSTM engine.
  const workers = await Promise.all(
    Array.from({ length: workerCount }, () => Tesseract.createWorker('kan', 1))
  );

  const pageTexts: string[] = new Array(numPages).fill('');
  let nextPageIndex = 0; // 0-based, shared cursor across worker loops below
  let completedPages = 0;

  const runWorkerLoop = async (worker: any) => {
    while (true) {
      const pageIndex = nextPageIndex++;
      if (pageIndex >= numPages) return;
      const pageNum = pageIndex + 1;

      try {
        const canvas = await renderPageToCanvas(pdf, pageNum);
        const { data } = await worker.recognize(canvas);
        pageTexts[pageIndex] = data?.text || '';
      } catch (pageError) {
        // Don't let one bad page (e.g. a corrupted image) abort OCR for an
        // entire 1000-page book — skip it and keep going.
        console.error(`OCR failed on page ${pageNum}:`, pageError);
      }

      completedPages++;
      onProgress?.(`Reading the text with OCR — page ${completedPages} of ${numPages}…`);
    }
  };

  try {
    await Promise.all(workers.map(runWorkerLoop));
    return pageTexts;
  } finally {
    await Promise.all(workers.map(w => w.terminate()));
  }
};

/**
 * True when this browser can run the off-main-thread OCR path (a dedicated
 * Worker rendering pages via OffscreenCanvas). Both are broadly supported in
 * modern Chrome/Firefox/Edge; older/Safari builds may lack OffscreenCanvas
 * or nested-worker support, in which case we fall back to the main-thread path.
 */
const supportsWorkerOcr = (): boolean =>
  typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

/**
 * Runs OCR entirely inside a dedicated Worker (services/ocrWorker.js), so
 * rendering and recognition keep running at full speed even when the tab is
 * hidden or unfocused — dedicated workers aren't subject to the background
 * tab throttling that slows down the main thread.
 * @param buffer The raw PDF bytes (ownership is transferred to the worker).
 * @param onProgress Optional progress reporter.
 * @returns One OCR-extracted text block per page, in page order.
 */
const ocrPdfInWorker = (buffer: ArrayBuffer, onProgress?: ProgressCallback): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./ocrWorker.js', import.meta.url));

    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data || {};
      if (msg.type === 'progress') {
        onProgress?.(msg.message);
      } else if (msg.type === 'done') {
        worker.terminate();
        resolve(msg.pageTexts);
      } else if (msg.type === 'error') {
        worker.terminate();
        reject(new Error(msg.message || 'OCR worker failed.'));
      }
    };
    worker.onerror = (event: ErrorEvent) => {
      worker.terminate();
      reject(new Error(event.message || 'OCR worker failed to start.'));
    };

    worker.postMessage({ type: 'start', buffer }, [buffer]);
  });
};

/**
 * Parses an uploaded file (PDF, DOCX, TXT) and extracts its text content.
 * For PDFs, it first tries the fast native text layer; if that comes back
 * garbled or empty, it automatically falls back to OCR. Repeated running
 * headers/footers (book titles, page URLs, etc.) are stripped from either path.
 * @param file - The File object to parse.
 * @param onProgress - Optional callback to surface progress to the UI.
 * @param forceOcr - Skip the fast text-layer path and OCR the PDF directly.
 *   Useful when the text layer looks fine by the automatic check (still
 *   mostly Kannada characters) but is actually corrupted, e.g. from a
 *   legacy font whose glyph-to-Unicode mapping silently produces the wrong
 *   (but still Kannada) characters.
 * @returns A Promise that resolves with the extracted text as a string.
 */
export const parseFile = (file: File, onProgress?: ProgressCallback, forceOcr = false): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (!event.target?.result) {
          return reject(new Error('Failed to read PDF file.'));
        }
        try {
          onProgress?.('Opening the PDF…');
          const originalBuffer = event.target.result as ArrayBuffer;
          // pdf.js may transfer/detach the buffer it's given, so keep an
          // untouched copy in reserve in case we need it for OCR below.
          const bufferForOcr = originalBuffer.slice(0);
          const pdf = await pdfjsLib.getDocument({ data: originalBuffer }).promise;

          if (!forceOcr) {
            // 1) Fast path: try the embedded text layer.
            const pageTexts: string[] = [];
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              pageTexts.push(await extractPageText(page));
            }
            const textContent = stripRepeatedHeaderFooter(pageTexts).join('\n');

            if (!isGarbled(textContent)) {
              return resolve(textContent);
            }
          }

          // 2) Fallback path: the text layer is garbled, empty, or OCR was
          //    requested directly. Render pages to images and OCR them —
          //    this handles scanned PDFs and PDFs built with legacy fonts.
          let ocrPageTexts: string[];
          if (supportsWorkerOcr()) {
            try {
              ocrPageTexts = await ocrPdfInWorker(bufferForOcr, onProgress);
            } catch (workerError) {
              console.error('Worker-based OCR failed, falling back to main-thread OCR:', workerError);
              ocrPageTexts = await ocrPdf(pdf, onProgress);
            }
          } else {
            ocrPageTexts = await ocrPdf(pdf, onProgress);
          }
          const ocrText = stripRepeatedHeaderFooter(ocrPageTexts).join('\n');

          if (isGarbled(ocrText)) {
            return reject(new Error(
              'Could not read Kannada text from this PDF, even with OCR. The scan may be low quality. Please try a clearer file, or copy and paste the text directly from your PDF viewer.'
            ));
          }

          resolve(ocrText);
        } catch (error) {
          console.error('Error parsing PDF:', error);
          reject(new Error('Could not parse the PDF file. It might be corrupted or in an unsupported format.'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading the file.'));
      reader.readAsArrayBuffer(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      // Handle DOCX files
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (!event.target?.result) {
          return reject(new Error('Failed to read DOCX file.'));
        }
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: event.target.result });
          resolve(result.value);
        } catch (error) {
          console.error('Error parsing DOCX:', error);
          reject(new Error('Could not parse the DOCX file.'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading the file.'));
      reader.readAsArrayBuffer(file);

    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      // Handle TXT files
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read text file.'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading the file.'));
      reader.readAsText(file);

    } else {
      // Unsupported file type
      reject(new Error('Unsupported file type. Please upload a PDF, DOCX or TXT file.'));
    }
  });
};
