import { GradebookService } from '../services/gradebook.service.js';
import { sendSuccess } from '../utils/response.js';

export class GradebookController {
  static async getStudentGrades(req, res, next) {
    try {
      const targetUserId = req.query.studentId && req.user.role !== 'STUDENT' ? req.query.studentId : req.user.id;
      const grades = await GradebookService.getStudentGradebook(targetUserId);
      return sendSuccess(res, { gradebook: grades });
    } catch (error) {
      next(error);
    }
  }
}
