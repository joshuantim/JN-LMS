import express from 'express';
import { DocumentController } from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { documentUpload } from '../middleware/upload.middleware.js';
import { uploadLimiter } from '../middleware/rate-limit.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/upload', uploadLimiter, documentUpload.single('file'), DocumentController.uploadDocument);
router.get('/', DocumentController.listDocuments);
router.get('/:id', DocumentController.getDocumentById);
router.get('/:id/chunks', DocumentController.getDocumentChunks);
router.delete('/:id', DocumentController.deleteDocument);

export default router;
