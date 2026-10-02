import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateProfileSchema } from '../utils/validators.js';

const router = Router();

// Profile routes (Any authenticated user)
router.get('/profile', authenticateToken, UserController.getProfile);
router.patch('/profile', authenticateToken, validateBody(updateProfileSchema), UserController.updateProfile);

// Admin-only management routes
router.get('/', authenticateToken, requireRoles('ADMIN'), UserController.listUsers);
router.patch('/:id/status', authenticateToken, requireRoles('ADMIN'), UserController.updateUserStatus);
router.patch('/:id/role', authenticateToken, requireRoles('ADMIN'), UserController.updateUserRole);

export default router;
