import { Router } from 'express';
import { AttemptController } from '../controllers/attempt.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const recordAnswerSchema = z.object({
  questionId: z.string().min(1),
  studentAnswer: z.any(),
});

// Student starts quiz attempt
router.post('/quiz/:quizId/start', authenticateToken, requireRoles('STUDENT'), AttemptController.start);

// Student saves an answer (auto-save)
router.post(
  '/:attemptId/answer',
  authenticateToken,
  requireRoles('STUDENT'),
  validateBody(recordAnswerSchema),
  AttemptController.recordAnswer
);

// Student submits quiz attempt
router.post('/:attemptId/submit', authenticateToken, requireRoles('STUDENT'), AttemptController.submit);

// Student or instructor reviews attempt
router.get('/:attemptId/review', authenticateToken, AttemptController.getReview);

export default router;
