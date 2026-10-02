import { EnrollmentService } from '../services/enrollment.service.js';
import { sendSuccess } from '../utils/response.js';

export class EnrollmentController {
  static async enroll(req, res, next) {
    try {
      const { courseId } = req.params;
      const enrollment = await EnrollmentService.enrollStudent(req.user.id, courseId);
      return sendSuccess(res, { enrollment }, 'Enrolled in course successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async drop(req, res, next) {
    try {
      const { courseId } = req.params;
      await EnrollmentService.dropEnrollment(req.user.id, courseId);
      return sendSuccess(res, null, 'Withdrawn from course successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMyEnrollments(req, res, next) {
    try {
      const enrollments = await EnrollmentService.getMyEnrollments(req.user.id);
      return sendSuccess(res, { enrollments });
    } catch (error) {
      next(error);
    }
  }

  static async getCourseRoster(req, res, next) {
    try {
      const { courseId } = req.params;
      const roster = await EnrollmentService.getCourseRoster(courseId, req.user);
      return sendSuccess(res, { roster });
    } catch (error) {
      next(error);
    }
  }
}
