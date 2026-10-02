import express from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get(
  '/instructor',
  authorize('INSTRUCTOR', 'ADMIN'),
  AnalyticsController.getInstructorAnalytics
);

router.get(
  '/admin',
  authorize('ADMIN'),
  AnalyticsController.getAdminAnalytics
);

export default router;
