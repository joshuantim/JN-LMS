import { Router } from 'express';
import { LessonController } from '../controllers/lesson.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const createLessonSchema = z.object({
  title: z.string().min(2).max(200),
  content: z.string().optional(),
  durationMinutes: z.number().int().optional(),
  orderIndex: z.number().int().optional(),
});

const updateLessonSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  content: z.string().optional(),
  durationMinutes: z.number().int().optional(),
  orderIndex: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

// View lesson content (Student must be enrolled, or instructor/admin)
router.get('/:id', authenticateToken, LessonController.getById);

// Instructor / Admin management
router.post(
  '/module/:moduleId',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  validateBody(createLessonSchema),
  LessonController.create
);

router.patch(
  '/:id',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  validateBody(updateLessonSchema),
  LessonController.update
);

router.delete(
  '/:id',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  LessonController.delete
);

export default router;
