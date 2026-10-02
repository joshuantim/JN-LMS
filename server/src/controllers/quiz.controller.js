import { QuizService } from '../services/quiz.service.js';
import { sendSuccess } from '../utils/response.js';

export class QuizController {
  static async list(req, res, next) {
    try {
      const { courseId } = req.query;
      const quizzes = await QuizService.listQuizzes({
        courseId,
        userId: req.user.id,
        role: req.user.role,
      });
      return sendSuccess(res, { quizzes });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const quiz = await QuizService.getQuizById(id, req.user);
      return sendSuccess(res, { quiz });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const quiz = await QuizService.createQuiz(req.body, req.user);
      return sendSuccess(res, { quiz }, 'Quiz created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const quiz = await QuizService.updateQuiz(id, req.body, req.user);
      return sendSuccess(res, { quiz }, 'Quiz updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async addQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const question = await QuizService.addQuestionToQuiz(id, req.body, req.user);
      return sendSuccess(res, { question }, 'Question added to quiz successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}
