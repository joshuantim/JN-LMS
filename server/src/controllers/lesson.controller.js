import { LessonService } from '../services/lesson.service.js';
import { sendSuccess } from '../utils/response.js';

export class LessonController {
  static async create(req, res, next) {
    try {
      const { moduleId } = req.params;
      const lesson = await LessonService.createLesson(moduleId, req.body, req.user);
      return sendSuccess(res, { lesson }, 'Lesson created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const lesson = await LessonService.getLesson(id, req.user);
      return sendSuccess(res, { lesson });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const lesson = await LessonService.updateLesson(id, req.body, req.user);
      return sendSuccess(res, { lesson }, 'Lesson updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      await LessonService.deleteLesson(id, req.user);
      return sendSuccess(res, null, 'Lesson deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
