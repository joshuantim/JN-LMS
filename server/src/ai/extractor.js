import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

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
    // Parse PDF
    const data = await pdfParse(dataBuffer);
    const fullText = (data.text || '').trim();
    const numPages = data.numpages || 1;

    // Approximate pages by form-feed character (\f) or uniform splitting
    let pages = [];
    if (fullText.includes('\f')) {
      const pageTexts = fullText.split('\f');
      pages = pageTexts.map((text, idx) => ({
        pageNumber: idx + 1,
        text: text.trim(),
      })).filter((p) => p.text.length > 0);
    } else {
      // Split into approximate page segments if \f not present
      const avgCharsPerPage = Math.ceil(fullText.length / numPages);
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
