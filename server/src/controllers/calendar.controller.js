import { CalendarService } from '../services/calendar.service.js';
import { sendSuccess } from '../utils/response.js';

export class CalendarController {
  static async getEvents(req, res, next) {
    try {
      const { startDate, endDate, courseId } = req.query;
      const events = await CalendarService.getEvents(req.user, {
        startDate,
        endDate,
        courseId,
      });
      return sendSuccess(res, events, 'Calendar events fetched successfully');
    } catch (error) {
      next(error);
    }
  }
}
