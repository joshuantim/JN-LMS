import { Router } from 'express';
import { ModuleController } from '../controllers/module.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const createModuleSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  orderIndex: z.number().int().optional(),
});

const updateModuleSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  orderIndex: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

router.post(
  '/course/:courseId',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  validateBody(createModuleSchema),
  ModuleController.create
);

router.patch(
  '/:id',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  validateBody(updateModuleSchema),
  ModuleController.update
);

router.delete(
  '/:id',
  authenticateToken,
  requireRoles('INSTRUCTOR', 'ADMIN'),
  ModuleController.delete
);

export default router;
