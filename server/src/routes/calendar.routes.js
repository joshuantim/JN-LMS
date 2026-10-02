import express from 'express';
import { CalendarController } from '../controllers/calendar.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/events', CalendarController.getEvents);

export default router;
