import express from 'express';
import { AnnouncementController } from '../controllers/announcement.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', AnnouncementController.listAnnouncements);
router.post('/', authorize('INSTRUCTOR', 'ADMIN'), AnnouncementController.createAnnouncement);
router.delete('/:id', authorize('INSTRUCTOR', 'ADMIN'), AnnouncementController.deleteAnnouncement);

export default router;
