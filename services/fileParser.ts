// This file uses global libraries loaded from CDNs in index.html.
// We declare them here to satisfy TypeScript.
declare const pdfjsLib: any;
declare const mammoth: any;


/**
 * Checks if the extracted text from a PDF is likely garbled.
 * It does this by checking for a reasonable percentage of Kannada characters.
 * @param text The text extracted from the PDF.
 * @returns true if the text is likely garbled, false otherwise.
 */
const isGarbled = (text: string): boolean => {
  if (!text || text.trim().length === 0) {
    return false; // Not garbled, just empty
  }
  const kannadaCharRegex = /[\u0C80-\u0CFF]/g;
  const kannadaChars = text.match(kannadaCharRegex) || [];
  const percentage = (kannadaChars.length / text.length) * 100;

  // If less than 50% of the characters are Kannada, it's likely garbled or mixed content.
  // This threshold can be adjusted.
  return percentage < 50;
};


/**
 * Parses an uploaded file (PDF, DOCX, TXT) and extracts its text content.
 * @param file - The File object to parse.
 * @returns A Promise that resolves with the extracted text as a string.
 */
export const parseFile = (file: File): Promise<string> => {
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
          const pdf = await pdfjsLib.getDocument({ data: event.target.result }).promise;
          let textContent = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map((s: any) => s.str).join(' ');
            textContent += '\n'; // Add newline between pages
          }
          
          if (isGarbled(textContent)) {
             return reject(new Error(
              'Failed to extract readable Kannada text from this PDF due to font encoding issues. Please copy and paste the text directly from your PDF viewer for accurate analysis.'
            ));
          }
          
          resolve(textContent);

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