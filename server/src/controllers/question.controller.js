import { QuestionBankService } from '../services/question-bank.service.js';
import { sendSuccess } from '../utils/response.js';

export class QuestionController {
  static async list(req, res, next) {
    try {
      const { courseId, topic, difficulty, isApproved, isAiGenerated, search } = req.query;
      const questions = await QuestionBankService.listQuestions({
        courseId,
        topic,
        difficulty,
        isApproved: isApproved !== undefined ? isApproved === 'true' : undefined,
        isAiGenerated: isAiGenerated !== undefined ? isAiGenerated === 'true' : undefined,
        search,
      });
      return sendSuccess(res, { questions });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const question = await QuestionBankService.createQuestion(req.body, req.user);
      return sendSuccess(res, { question }, 'Question created in bank successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const question = await QuestionBankService.updateQuestion(id, req.body, req.user);
      return sendSuccess(res, { question }, 'Question updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      await QuestionBankService.deleteQuestion(id, req.user);
      return sendSuccess(res, null, 'Question removed successfully');
    } catch (error) {
      next(error);
    }
  }
}
