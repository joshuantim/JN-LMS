import { Router } from 'express';
import { GradebookController } from '../controllers/gradebook.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, GradebookController.getStudentGrades);

export default router;
