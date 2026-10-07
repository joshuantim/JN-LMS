import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');

export class DocumentExtractor {
  static async extractText(input, fileType) {
    const ext = fileType
      ? `.${fileType.replace('.', '').toLowerCase()}`
      : typeof input === 'string'
      ? path.extname(input).toLowerCase()
      : '';

    const buffer = Buffer.isBuffer(input) ? input : await fs.promises.readFile(input);

    switch (ext) {
      case '.pdf':
        return this.extractFromPdf(buffer);
      case '.docx':
      case '.doc':
        return this.extractFromDocx(buffer);
      case '.txt':
      case '.md':
      case '.markdown':
        return this.extractFromPlainText(buffer);
      case '.pptx':
        return this.extractFromPptx(buffer);
      default:
        // Try plain text as fallback
        return this.extractFromPlainText(buffer);
    }
  }

  static async extractFromPdf(dataBuffer) {
    let fullText = '';
    let numPages = 1;
    let pages = [];

    // Support pdf-parse v2 (PDFParse class)
    if (pdfParseModule?.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: dataBuffer });
      try {
        const result = await parser.getText();
        fullText = (result.text || '').trim();
        numPages = result.total || 1;
        if (Array.isArray(result.pages) && result.pages.length > 0) {
          pages = result.pages
            .map((p, idx) => ({
              pageNumber: p.num || idx + 1,
              text: (p.text || '').trim(),
            }))
            .filter((p) => p.text.length > 0);
        }
      } finally {
        if (typeof parser.destroy === 'function') {
          await parser.destroy().catch(() => {});
        }
      }
    } else if (typeof pdfParseModule === 'function') {
      // Support pdf-parse v1 (function)
      const data = await pdfParseModule(dataBuffer);
      fullText = (data.text || '').trim();
      numPages = data.numpages || 1;
    } else if (typeof pdfParseModule?.default === 'function') {
      const data = await pdfParseModule.default(dataBuffer);
      fullText = (data.text || '').trim();
      numPages = data.numpages || 1;
    } else {
      throw new Error('PDF parsing library is unavailable or incompatible');
    }

    // Approximate pages if pages array is empty but fullText exists
    if (pages.length === 0 && fullText.length > 0) {
      if (fullText.includes('\f')) {
        const pageTexts = fullText.split('\f');
        pages = pageTexts
          .map((text, idx) => ({
            pageNumber: idx + 1,
            text: text.trim(),
          }))
          .filter((p) => p.text.length > 0);
      } else {
        const avgCharsPerPage = Math.ceil(fullText.length / Math.max(1, numPages));
        for (let i = 0; i < numPages; i++) {
          const start = i * avgCharsPerPage;
          const end = Math.min(start + avgCharsPerPage, fullText.length);
          const segment = fullText.slice(start, end).trim();
          if (segment) {
            pages.push({
              pageNumber: i + 1,
              text: segment,
            });
          }
        }
      }
    }

    if (pages.length === 0 && fullText.length > 0) {
      pages.push({ pageNumber: 1, text: fullText });
    }

    return {
      text: fullText,
      numPages,
      pages,
    };
  }

  static async extractFromDocx(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    const fullText = (result.value || '').trim();

    return {
      text: fullText,
      numPages: 1,
      pages: [{ pageNumber: 1, text: fullText }],
    };
  }

  static async extractFromPlainText(buffer) {
    const content = buffer.toString('utf8');
    const fullText = content.trim();

    return {
      text: fullText,
      numPages: 1,
      pages: [{ pageNumber: 1, text: fullText }],
    };
  }

  static async extractFromPptx(buffer) {
    // Basic text extraction for presentation slides
    try {
      const str = buffer.toString('utf8');
      // Extract XML slide text tags: <a:t>text</a:t>
      const matches = str.match(/<a:t>([^<]+)<\/a:t>/g);
      if (matches && matches.length > 0) {
        const slideTexts = matches.map((m) => m.replace(/<\/?a:t>/g, ''));
        const fullText = slideTexts.join(' ').replace(/\s+/g, ' ').trim();
        return {
          text: fullText,
          numPages: 1,
          pages: [{ pageNumber: 1, text: fullText }],
        };
      }
    } catch (err) {
      console.warn('PPTX parsing fallback:', err.message);
    }

    return this.extractFromPlainText(buffer);
  }
}

export default DocumentExtractor;
