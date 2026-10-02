import { AnalyticsService } from '../services/analytics.service.js';
import { sendSuccess } from '../utils/response.js';

export class AnalyticsController {
  static async getInstructorAnalytics(req, res, next) {
    try {
      const { courseId } = req.query;
      const data = await AnalyticsService.getInstructorAnalytics(req.user.id, { courseId });
      return sendSuccess(res, data, 'Instructor analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAdminAnalytics(req, res, next) {
    try {
      const data = await AnalyticsService.getAdminAnalytics();
      return sendSuccess(res, data, 'Admin analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
