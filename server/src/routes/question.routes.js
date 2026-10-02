import { Router } from 'express';
import { QuestionController } from '../controllers/question.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const createQuestionSchema = z.object({
  courseId: z.string().optional(),
  quizId: z.string().optional(),
  questionText: z.string().min(3),
  questionType: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']),
  options: z.any().optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().optional(),
  points: z.number().optional().default(1),
  topic: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  isAiGenerated: z.boolean().optional(),
  isApproved: z.boolean().optional(),
});

// Instructors and Admins manage questions
router.get('/', authenticateToken, requireRoles('INSTRUCTOR', 'ADMIN'), QuestionController.list);
router.post(
  '/',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  validateBody(createQuestionSchema),
  QuestionController.create
);
router.patch(
  '/:id',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  QuestionController.update
);
router.delete(
  '/:id',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  QuestionController.delete
);

export default router;
