import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';
import { DocumentExtractor } from '../ai/extractor.js';
import { SemanticChunker } from '../ai/chunker.js';
import { EmbeddingService } from '../ai/embedding.service.js';
import { enqueueDocumentProcessing } from '../jobs/document.queue.js';

export class DocumentService {
  /**
   * Register a new document and enqueue for background processing
   */
  static async uploadDocument(file, { courseId, title }, user) {
    if (!file) {
      const error = new Error('File is required for document upload');
      error.statusCode = 400;
      throw error;
    }

    // Verify course access if courseId provided
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        const error = new Error('Target course not found');
        error.statusCode = 404;
        throw error;
      }

      if (user.role === 'STUDENT') {
        const enrollment = await prisma.enrollment.findFirst({
          where: { courseId, userId: user.id, status: 'ACTIVE' },
        });
        if (!enrollment) {
          const error = new Error('Forbidden: You must be enrolled in this course to upload materials');
          error.statusCode = 403;
          throw error;
        }
      } else if (user.role === 'INSTRUCTOR' && course.instructorId !== user.id) {
        const error = new Error('Forbidden: You are not an instructor of this course');
        error.statusCode = 403;
        throw error;
      }
    }

    const cleanExt = path.extname(file.originalname).toLowerCase().replace('.', '');
    const docTitle = title || file.originalname.replace(/\.[^/.]+$/, '');

    const document = await prisma.document.create({
      data: {
        courseId: courseId || null,
        uploaderId: user.id,
        title: docTitle,
        fileName: file.originalname,
        fileType: cleanExt,
        mimeType: file.mimetype,
        fileSize: file.size,
        storageKey: file.path,
        storageUrl: `/uploads/documents/${file.filename}`,
        status: 'UPLOADED',
      },
      include: {
        course: { select: { id: true, code: true, title: true } },
        uploader: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    // Enqueue document for background extraction & semantic chunking
    await enqueueDocumentProcessing(document.id, (id) => this.processDocument(id));

    return document;
  }

  /**
   * Process document: extract text, slice into semantic chunks, store in DB
   */
  static async processDocument(documentId) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      console.warn(`[Document Processor] Document ${documentId} not found`);
      return null;
    }

    try {
      // Mark as PROCESSING
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'PROCESSING', errorMessage: null },
      });

      console.log(`[Document Processor] Extracting text for ${doc.fileName} (${doc.fileType})...`);
      const extracted = await DocumentExtractor.extractText(doc.storageKey, doc.fileType);

      if (!extracted.text || extracted.text.trim().length === 0) {
        throw new Error('No readable text content could be extracted from this document.');
      }

      console.log(`[Document Processor] Chunking document (${extracted.text.length} chars, ${extracted.numPages} pages)...`);
      const chunks = SemanticChunker.chunkDocument(extracted.pages, {
        chunkSize: 1000,
        chunkOverlap: 150,
      });

      console.log(`[Document Processor] Saving ${chunks.length} chunks to database...`);

      // Idempotent chunk replacement
      await prisma.$transaction([
        prisma.documentChunk.deleteMany({ where: { documentId } }),
        prisma.documentChunk.createMany({
          data: chunks.map((c) => ({
            documentId,
            chunkIndex: c.chunkIndex,
            content: c.content,
            pageNumber: c.pageNumber,
            tokenCount: c.tokenCount,
            metadata: c.metadata,
          })),
        }),
        prisma.document.update({
          where: { id: documentId },
          data: {
            status: 'READY',
            errorMessage: null,
          },
        }),
      ]);

      // Generate and store pgvector embeddings for each chunk
      await EmbeddingService.embedDocumentChunks(documentId);

      console.log(`✓ Document ${documentId} processed and vector-embedded successfully into ${chunks.length} chunks`);

      return { success: true, chunkCount: chunks.length };
    } catch (err) {
      console.error(`❌ Error processing document ${documentId}:`, err);

      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          errorMessage: err.message || 'Unknown text extraction failure',
        },
      });

      throw err;
    }
  }

  /**
   * List documents filtered by course or user
   */
  static async listDocuments({ courseId, search }, user) {
    const where = {};

    if (courseId) {
      where.courseId = courseId;
    } else if (user.role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id, status: 'ACTIVE' },
        select: { courseId: true },
      });
      const enrolledCourseIds = enrollments.map((e) => e.courseId);

      where.OR = [
        { uploaderId: user.id },
        { courseId: { in: enrolledCourseIds } },
      ];
    } else if (user.role === 'INSTRUCTOR') {
      const courses = await prisma.course.findMany({
        where: { instructorId: user.id },
        select: { id: true },
      });
      const instructorCourseIds = courses.map((c) => c.id);

      where.OR = [
        { uploaderId: user.id },
        { courseId: { in: instructorCourseIds } },
      ];
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { fileName: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    return prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, code: true, title: true } },
        uploader: { select: { id: true, firstName: true, lastName: true, role: true } },
        _count: { select: { chunks: true } },
      },
    });
  }

  /**
   * Get single document by ID
   */
  static async getDocumentById(id, user) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, code: true, title: true } },
        uploader: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
        _count: { select: { chunks: true } },
      },
    });

    if (!document) {
      const error = new Error('Document not found');
      error.statusCode = 404;
      throw error;
    }

    return document;
  }

  /**
   * Get chunks for a specific document
   */
  static async getDocumentChunks(id, user) {
    await this.getDocumentById(id, user);

    return prisma.documentChunk.findMany({
      where: { documentId: id },
      orderBy: { chunkIndex: 'asc' },
    });
  }

  /**
   * Delete document, chunks, and file on disk
   */
  static async deleteDocument(id, user) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!document) {
      const error = new Error('Document not found');
      error.statusCode = 404;
      throw error;
    }

    const isUploader = document.uploaderId === user.id;
    const isInstructor = document.course?.instructorId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isUploader && !isInstructor && !isAdmin) {
      const error = new Error('Forbidden: You do not have permission to delete this document');
      error.statusCode = 403;
      throw error;
    }

    // Unlink physical file if exists
    if (document.storageKey) {
      try {
        if (fs.existsSync(document.storageKey)) {
          await fs.promises.unlink(document.storageKey);
        }
      } catch (err) {
        console.warn('Could not remove file on disk:', err.message);
      }
    }

    return prisma.document.delete({ where: { id } });
  }
}

export default DocumentService;
