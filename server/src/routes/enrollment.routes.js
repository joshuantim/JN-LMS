import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollment.controller.js';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Student endpoints
router.get('/my', authenticateToken, EnrollmentController.getMyEnrollments);
router.post('/:courseId', authenticateToken, requireRoles('STUDENT'), EnrollmentController.enroll);
router.delete('/:courseId', authenticateToken, requireRoles('STUDENT'), EnrollmentController.drop);

// Instructor & Admin endpoint to see roster
router.get('/course/:courseId', authenticateToken, requireRoles('INSTRUCTOR', 'ADMIN'), EnrollmentController.getCourseRoster);

export default router;
