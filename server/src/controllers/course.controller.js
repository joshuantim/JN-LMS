import { CourseService } from '../services/course.service.js';
import { sendSuccess } from '../utils/response.js';

export class CourseController {
  static async list(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search;
      const instructorId = req.query.instructorId;
      const isPublished = req.query.isPublished !== undefined ? req.query.isPublished === 'true' : undefined;

      const result = await CourseService.listCourses({
        search,
        instructorId,
        isPublished,
        page,
        limit,
        userId: req.user?.id,
        role: req.user?.role,
      });

      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const course = await CourseService.getCourseById(id, req.user?.id);
      return sendSuccess(res, { course });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const course = await CourseService.createCourse(req.body, req.user.id);
      return sendSuccess(res, { course }, 'Course created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const course = await CourseService.updateCourse(id, req.body, req.user);
      return sendSuccess(res, { course }, 'Course updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      await CourseService.deleteCourse(id, req.user);
      return sendSuccess(res, null, 'Course deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
