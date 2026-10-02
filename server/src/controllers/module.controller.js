import { ModuleService } from '../services/module.service.js';
import { sendSuccess } from '../utils/response.js';

export class ModuleController {
  static async create(req, res, next) {
    try {
      const { courseId } = req.params;
      const moduleItem = await ModuleService.createModule(courseId, req.body, req.user);
      return sendSuccess(res, { module: moduleItem }, 'Module created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const moduleItem = await ModuleService.updateModule(id, req.body, req.user);
      return sendSuccess(res, { module: moduleItem }, 'Module updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      await ModuleService.deleteModule(id, req.user);
      return sendSuccess(res, null, 'Module deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
