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
 * Renders every page of a PDF to an image and runs Kannada OCR on it.
 * This is the reliable path for PDFs whose text layer is missing (scanned)
 * or encoded with legacy ASCII fonts (Nudi/Baraha) that extract as garbage.
 * @param pdf A loaded pdf.js document.
 * @param onProgress Optional progress reporter.
 * @returns The OCR-extracted text.
 */
const ocrPdf = async (pdf: any, onProgress?: ProgressCallback): Promise<string> => {
  if (typeof Tesseract === 'undefined') {
    throw new Error('OCR engine failed to load. Please check your internet connection and try again.');
  }

  onProgress?.('Setting up the Kannada OCR engine (first run downloads the language model)…');

  // 'kan' = Kannada trained data; OEM 1 = LSTM engine.
  const worker = await Tesseract.createWorker('kan', 1);

  try {
    let fullText = '';
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
      onProgress?.(`Reading the text with OCR — page ${i} of ${numPages}…`);

      const page = await pdf.getPage(i);
      // Render at 2x for sharper glyphs => noticeably better OCR accuracy.
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not create a canvas to render the PDF for OCR.');
      }
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;

      const { data } = await worker.recognize(canvas);
      fullText += (data?.text || '') + '\n';
    }

    return fullText;
  } finally {
    await worker.terminate();
  }
};

/**
 * Parses an uploaded file (PDF, DOCX, TXT) and extracts its text content.
 * For PDFs, it first tries the fast native text layer; if that comes back
 * garbled or empty, it automatically falls back to OCR.
 * @param file - The File object to parse.
 * @param onProgress - Optional callback to surface progress to the UI.
 * @returns A Promise that resolves with the extracted text as a string.
 */
export const parseFile = (file: File, onProgress?: ProgressCallback): Promise<string> => {
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
          const pdf = await pdfjsLib.getDocument({ data: event.target.result }).promise;

          // 1) Fast path: try the embedded text layer.
          let textContent = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map((s: any) => s.str).join(' ');
            textContent += '\n'; // Add newline between pages
          }

          if (!isGarbled(textContent)) {
            return resolve(textContent);
          }

          // 2) Fallback path: the text layer is garbled or empty, so OCR the
          //    rendered pages instead. This handles scanned PDFs and PDFs built
          //    with legacy ASCII Kannada fonts.
          const ocrText = await ocrPdf(pdf, onProgress);

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
