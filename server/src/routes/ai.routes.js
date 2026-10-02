import express from 'express';
import { AIController } from '../controllers/ai.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rate-limit.middleware.js';
import { enforceAiQuota } from '../middleware/ai-quota.middleware.js';

const router = express.Router();

router.use(authenticate);

// AI Quota status
router.get('/quota', AIController.getMyQuota);

// Phase 6: RAG Chat
router.post('/chat', aiLimiter, enforceAiQuota, AIController.sendMessage);
router.get('/conversations', AIController.listConversations);
router.get('/conversations/:id', AIController.getConversationById);
router.delete('/conversations/:id', AIController.deleteConversation);
router.get('/search', AIController.searchMaterials);

// Phase 7: AI Learning Features
router.post('/generate-questions', authorize('INSTRUCTOR', 'ADMIN'), aiLimiter, enforceAiQuota, AIController.generateQuestions);
router.post('/generate-quiz', authorize('INSTRUCTOR', 'ADMIN'), aiLimiter, enforceAiQuota, AIController.generateQuiz);
router.post('/generate-flashcards', aiLimiter, enforceAiQuota, AIController.generateFlashcards);
router.get('/tutor/recommendations', AIController.getAdaptiveRecommendations);

export default router;

