import { Router } from 'express';
import { AssignmentController } from '../controllers/assignment.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const createAssignmentSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  instructions: z.string().optional(),
  maxScore: z.number().optional().default(100),
  dueDate: z.string().min(1),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).optional(),
});

const submitSchema = z.object({
  content: z.string().optional(),
  fileUrl: z.string().optional(),
});

const gradeSchema = z.object({
  score: z.number().min(0),
  feedback: z.string().optional(),
});

router.get('/', authenticateToken, AssignmentController.list);
router.get('/:id', authenticateToken, AssignmentController.getById);

router.post(
  '/',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  validateBody(createAssignmentSchema),
  AssignmentController.create
);

router.patch(
  '/:id',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  AssignmentController.update
);

router.post(
  '/:id/submit',
  authenticateToken,
  requireRoles('STUDENT'),
  validateBody(submitSchema),
  AssignmentController.submit
);

router.patch(
  '/submissions/:submissionId/grade',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  validateBody(gradeSchema),
  AssignmentController.grade
);

export default router;
