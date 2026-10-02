import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export class DocumentExtractor {
  static async extractText(filePath, fileType) {
    const ext = fileType ? `.${fileType.replace('.', '').toLowerCase()}` : path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.pdf':
        return this.extractFromPdf(filePath);
      case '.docx':
      case '.doc':
        return this.extractFromDocx(filePath);
      case '.txt':
      case '.md':
      case '.markdown':
        return this.extractFromPlainText(filePath);
      case '.pptx':
        return this.extractFromPptx(filePath);
      default:
        // Try plain text as fallback
        return this.extractFromPlainText(filePath);
    }
  }

  static async extractFromPdf(filePath) {
    const dataBuffer = await fs.promises.readFile(filePath);
    
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

  static async extractFromDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    const fullText = (result.value || '').trim();

    return {
      text: fullText,
      numPages: 1,
      pages: [{ pageNumber: 1, text: fullText }],
    };
  }

  static async extractFromPlainText(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const fullText = content.trim();

    return {
      text: fullText,
      numPages: 1,
      pages: [{ pageNumber: 1, text: fullText }],
    };
  }

  static async extractFromPptx(filePath) {
    // Basic text extraction for presentation slides
    try {
      const buffer = await fs.promises.readFile(filePath);
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

    return this.extractFromPlainText(filePath);
  }
}

export default DocumentExtractor;
