export class SemanticChunker {
  /**
   * Split text into semantic chunks with overlap
   * @param {Array<{ pageNumber: number, text: string }>} pages 
   * @param {Object} options
   * @param {number} options.chunkSize - Target characters per chunk (default ~1000)
   * @param {number} options.chunkOverlap - Overlap characters between consecutive chunks (default ~150)
   * @returns {Array<{ chunkIndex: number, content: string, pageNumber: number, tokenCount: number, metadata: object }>}
   */
  static chunkDocument(pages, { chunkSize = 1000, chunkOverlap = 150 } = {}) {
    const chunks = [];
    let chunkIndex = 0;

    for (const page of pages) {
      const pageText = (page.text || '').trim();
      if (!pageText) continue;

      const pageChunks = this.splitTextIntoChunks(pageText, chunkSize, chunkOverlap);

      for (const text of pageChunks) {
        if (!text || text.trim().length === 0) continue;

        const cleanText = text.trim();
        const wordCount = cleanText.split(/\s+/).length;
        // Approximate tokens: ~4 characters per token in English
        const estimatedTokens = Math.ceil(cleanText.length / 4);

        chunks.push({
          chunkIndex,
          content: cleanText,
          pageNumber: page.pageNumber || 1,
          tokenCount: estimatedTokens,
          metadata: {
            charCount: cleanText.length,
            wordCount,
            pageNumber: page.pageNumber || 1,
          },
        });

        chunkIndex++;
      }
    }

    return chunks;
  }

  static splitTextIntoChunks(text, chunkSize, chunkOverlap) {
    if (text.length <= chunkSize) {
      return [text];
    }

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;

      if (end >= text.length) {
        chunks.push(text.slice(start).trim());
        break;
      }

      // Try finding a natural break point (paragraph, sentence, or space)
      let breakPoint = -1;

      // 1. Look for paragraph break in the last 20% of the chunk window
      const searchWindowStart = Math.max(start, end - Math.floor(chunkSize * 0.25));
      const searchWindow = text.slice(searchWindowStart, end);

      const paraBreak = searchWindow.lastIndexOf('\n\n');
      if (paraBreak !== -1) {
        breakPoint = searchWindowStart + paraBreak + 2;
      } else {
        // 2. Look for sentence boundary (. , ? , ! )
        const sentenceMatch = searchWindow.match(/[.?!]\s+(?=[A-Z0-9])/g);
        if (sentenceMatch) {
          const lastSentenceEnd = searchWindow.lastIndexOf(sentenceMatch[sentenceMatch.length - 1]);
          if (lastSentenceEnd !== -1) {
            breakPoint = searchWindowStart + lastSentenceEnd + 2;
          }
        }
      }

      // 3. Fallback to space
      if (breakPoint === -1) {
        const lastSpace = searchWindow.lastIndexOf(' ');
        if (lastSpace !== -1) {
          breakPoint = searchWindowStart + lastSpace + 1;
        } else {
          // Hard cut if no space found
          breakPoint = end;
        }
      }

      const chunk = text.slice(start, breakPoint).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Advance start with overlap
      start = Math.max(start + 1, breakPoint - chunkOverlap);
    }

    return chunks;
  }
}

export default SemanticChunker;
