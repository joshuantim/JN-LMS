import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const createQuizSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  timeLimitMinutes: z.number().int().optional(),
  passMark: z.number().optional().default(50),
  maxAttempts: z.number().int().optional().default(1),
  shuffleQuestions: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

router.get('/', authenticateToken, QuizController.list);
router.get('/:id', authenticateToken, QuizController.getById);

router.post(
  '/',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  validateBody(createQuizSchema),
  QuizController.create
);

router.patch(
  '/:id',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  QuizController.update
);

router.post(
  '/:id/questions',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  QuizController.addQuestion
);

export default router;
