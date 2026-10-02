import { AssignmentService } from '../services/assignment.service.js';
import { sendSuccess } from '../utils/response.js';

export class AssignmentController {
  static async list(req, res, next) {
    try {
      const { courseId } = req.query;
      const assignments = await AssignmentService.listAssignments({
        courseId,
        userId: req.user.id,
        role: req.user.role,
      });
      return sendSuccess(res, { assignments });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const assignment = await AssignmentService.getAssignmentById(id, req.user.id, req.user.role);
      return sendSuccess(res, { assignment });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const assignment = await AssignmentService.createAssignment(req.body, req.user);
      return sendSuccess(res, { assignment }, 'Assignment created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const assignment = await AssignmentService.updateAssignment(id, req.body, req.user);
      return sendSuccess(res, { assignment }, 'Assignment updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async submit(req, res, next) {
    try {
      const { id } = req.params;
      const submission = await AssignmentService.submitAssignment(id, req.body, req.user.id);
      return sendSuccess(res, { submission }, 'Assignment submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async grade(req, res, next) {
    try {
      const { submissionId } = req.params;
      const submission = await AssignmentService.gradeSubmission(submissionId, req.body, req.user);
      return sendSuccess(res, { submission }, 'Submission graded successfully');
    } catch (error) {
      next(error);
    }
  }
}
