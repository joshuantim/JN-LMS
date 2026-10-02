import express from 'express';
import { AdminAIController } from '../controllers/admin-ai.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', AdminAIController.getUsageAnalytics);
router.post('/reset/:userId', AdminAIController.resetQuota);

export default router;
