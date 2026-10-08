import { DocumentService } from '../services/document.service.js';
import { sendSuccess } from '../utils/response.js';

export class DocumentController {
  static async uploadDocument(req, res, next) {
    try {
      const { courseId, title } = req.body;
      const document = await DocumentService.uploadDocument(
        req.file,
        { courseId, title },
        req.user
      );
      return sendSuccess(res, document, 'Document uploaded and queued for processing', 201);
    } catch (error) {
      next(error);
    }
  }

  static async listDocuments(req, res, next) {
    try {
      const { courseId, search } = req.query;
      const documents = await DocumentService.listDocuments({ courseId, search }, req.user);
      return sendSuccess(res, documents, 'Documents retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getDocumentById(req, res, next) {
    try {
      const { id } = req.params;
      const document = await DocumentService.getDocumentById(id, req.user);
      return sendSuccess(res, document, 'Document details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async downloadDocument(req, res, next) {
    try {
      const { id } = req.params;
      const { document, buffer } = await DocumentService.downloadDocument(id, req.user);

      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.fileName)}"`);
      res.setHeader('Content-Length', buffer.length);

      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  static async getDocumentChunks(req, res, next) {
    try {
      const { id } = req.params;
      const chunks = await DocumentService.getDocumentChunks(id, req.user);
      return sendSuccess(res, chunks, 'Document chunks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;
      await DocumentService.deleteDocument(id, req.user);
      return sendSuccess(res, null, 'Document deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default DocumentController;
