import { QuizAttemptService } from '../services/quiz-attempt.service.js';
import { sendSuccess } from '../utils/response.js';

export class AttemptController {
  static async start(req, res, next) {
    try {
      const { quizId } = req.params;
      const result = await QuizAttemptService.startAttempt(quizId, req.user.id);
      return sendSuccess(res, result, 'Quiz attempt started', 201);
    } catch (error) {
      next(error);
    }
  }

  static async recordAnswer(req, res, next) {
    try {
      const { attemptId } = req.params;
      const answer = await QuizAttemptService.recordAnswer(attemptId, req.body, req.user.id);
      return sendSuccess(res, { answer }, 'Answer recorded');
    } catch (error) {
      next(error);
    }
  }

  static async submit(req, res, next) {
    try {
      const { attemptId } = req.params;
      const attempt = await QuizAttemptService.submitAttempt(attemptId, req.user.id);
      return sendSuccess(res, { attempt }, 'Quiz submitted and evaluated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getReview(req, res, next) {
    try {
      const { attemptId } = req.params;
      const attempt = await QuizAttemptService.getAttemptReview(attemptId, req.user);
      return sendSuccess(res, { attempt });
    } catch (error) {
      next(error);
    }
  }
}
