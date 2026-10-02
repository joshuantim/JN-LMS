import { Router } from 'express';
import { CourseController } from '../controllers/course.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const createCourseSchema = z.object({
  code: z.string().min(2).max(20),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  courseImage: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().optional(),
});

const updateCourseSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  courseImage: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().optional(),
});

// Anyone authenticated can browse and view courses
router.get('/', authenticateToken, CourseController.list);
router.get('/:id', authenticateToken, CourseController.getById);

// Instructors and Admins can create and manage courses
router.post(
  '/',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  validateBody(createCourseSchema),
  CourseController.create
);

router.patch(
  '/:id',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  validateBody(updateCourseSchema),
  CourseController.update
);

router.delete(
  '/:id',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  CourseController.delete
);

export default router;
