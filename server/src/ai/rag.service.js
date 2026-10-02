import prisma from '../config/db.js';
import { EmbeddingService } from './embedding.service.js';

export class RAGService {
  /**
   * Search for semantically relevant chunks across accessible course documents using pgvector
   */
  static async searchSimilarChunks(query, { courseId, userId, role, topK = 5, minSimilarity = 0.35 }) {
    if (!query || !query.trim()) {
      return [];
    }

    // 1. Generate query embedding vector
    const queryVector = await EmbeddingService.generateEmbedding(query);
    const vectorStr = `[${queryVector.join(',')}]`;

    // 2. Determine document scope
    let courseFilterSql = '';
    const params = [vectorStr];
    let paramIndex = 2;

    if (courseId) {
      courseFilterSql = `AND d."courseId" = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    } else if (role === 'STUDENT' && userId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { courseId: true },
      });
      const enrolledIds = enrollments.map((e) => e.courseId);

      if (enrolledIds.length > 0) {
        courseFilterSql = `AND (d."courseId" = ANY($${paramIndex}::text[]) OR d."uploaderId" = $${paramIndex + 1})`;
        params.push(enrolledIds);
        params.push(userId);
        paramIndex += 2;
      } else {
        courseFilterSql = `AND d."uploaderId" = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }
    } else if (role === 'INSTRUCTOR' && userId) {
      const instructorCourses = await prisma.course.findMany({
        where: { instructorId: userId },
        select: { id: true },
      });
      const taughtIds = instructorCourses.map((c) => c.id);

      if (taughtIds.length > 0) {
        courseFilterSql = `AND (d."courseId" = ANY($${paramIndex}::text[]) OR d."uploaderId" = $${paramIndex + 1})`;
        params.push(taughtIds);
        params.push(userId);
        paramIndex += 2;
      } else {
        courseFilterSql = `AND d."uploaderId" = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }
    }

    // 3. Execute pgvector cosine similarity search
    const limitParam = `$${paramIndex}`;
    params.push(topK);

    const rawQuery = `
      SELECT 
        dc.id,
        dc."chunkIndex",
        dc.content,
        dc."pageNumber",
        dc."tokenCount",
        dc.metadata,
        d.id as "documentId",
        d.title as "documentTitle",
        d."fileName",
        d."courseId",
        ROUND((1 - (dc.embedding <=> $1::vector))::numeric, 4) as similarity
      FROM "DocumentChunk" dc
      JOIN "Document" d ON d.id = dc."documentId"
      WHERE dc.embedding IS NOT NULL
        AND d.status = 'READY'
        ${courseFilterSql}
      ORDER BY dc.embedding <=> $1::vector ASC
      LIMIT ${limitParam};
    `;

    const results = await prisma.$queryRawUnsafe(rawQuery, ...params);

    // 4. Filter by minimum similarity threshold
    const filtered = (results || []).filter((r) => Number(r.similarity) >= minSimilarity);

    return filtered.map((r, index) => ({
      sourceIndex: index + 1,
      chunkId: r.id,
      chunkIndex: r.chunkIndex,
      documentId: r.documentId,
      documentTitle: r.documentTitle,
      fileName: r.fileName,
      courseId: r.courseId,
      content: r.content,
      pageNumber: r.pageNumber || 1,
      tokenCount: r.tokenCount || 0,
      similarity: Number(r.similarity),
      snippet: r.content.slice(0, 160).replace(/\s+/g, ' ').trim() + '...',
    }));
  }

  /**
   * Assemble grounding context and source citations for LLM injection
   */
  static assembleContext(chunks) {
    if (!chunks || chunks.length === 0) {
      return {
        contextPrompt: 'No relevant course materials were found for this query in the knowledge base.',
        citations: [],
      };
    }

    let contextPrompt = '--- START RETRIEVED COURSE MATERIALS ---\n\n';
    const citations = [];

    chunks.forEach((chunk, idx) => {
      const sourceNum = idx + 1;
      contextPrompt += `[Source ${sourceNum}: "${chunk.documentTitle}", Page: ${chunk.pageNumber}]\n`;
      contextPrompt += `${chunk.content}\n\n`;

      citations.push({
        sourceNumber: sourceNum,
        documentId: chunk.documentId,
        title: chunk.documentTitle,
        fileName: chunk.fileName,
        pageNumber: chunk.pageNumber,
        similarity: chunk.similarity,
        snippet: chunk.snippet,
      });
    });

    contextPrompt += '--- END RETRIEVED COURSE MATERIALS ---';

    return {
      contextPrompt,
      citations,
    };
  }

  /**
   * Build the structured academic system prompt with grounding instructions
   */
  static buildSystemPrompt(contextPrompt) {
    return `You are JN LMS AI Learning Assistant — an expert academic tutor and university course companion.
Your mission is to help students and instructors understand course concepts, review lecture materials, formulate answers, and build deep understanding.

CRITICAL GROUNDING RULES:
1. Base your answer primarily on the RETRIEVED COURSE MATERIALS provided below.
2. Whenever citing information, include in-text citations like [Source 1, Page X] or [Source: "Document Title", Page X].
3. If the retrieved materials contain the answer, explain it clearly, thoroughly, and pedagogically with bullet points, structured sections, and formulas where appropriate.
4. If the retrieved materials DO NOT contain the answer, explicitly state: "This topic is not explicitly covered in your uploaded course materials, but based on general academic knowledge..." and provide an accurate pedagogical answer.
5. NEVER fabricate citations or invent non-existent course notes.

${contextPrompt}`;
  }
}

export default RAGService;
