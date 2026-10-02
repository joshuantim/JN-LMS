import { ChatService } from '../ai/chat.service.js';
import { RAGService } from '../ai/rag.service.js';
import { GeneratorService } from '../ai/generator.service.js';
import { FlashcardService } from '../ai/flashcard.service.js';
import { TutorService } from '../ai/tutor.service.js';
import { TokenBudgetService } from '../ai/token-budget.service.js';
import { sendSuccess } from '../utils/response.js';

export class AIController {
  static async getMyQuota(req, res, next) {
    try {
      const quota = await TokenBudgetService.checkQuota(req.user.id, req.user.role);
      return sendSuccess(res, quota, 'AI token quota retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req, res, next) {
    try {
      const { conversationId, courseId, message } = req.body;
      const result = await ChatService.sendMessage(
        { conversationId, courseId, message },
        req.user
      );
      // Record estimated token usage (prompt + response + context)
      const estimatedTokens = Math.max(250, Math.ceil(((message?.length || 0) + (result.message?.content?.length || 0)) / 3.5));
      await TokenBudgetService.recordUsage(req.user.id, estimatedTokens);
      return sendSuccess(res, result, 'Message processed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listConversations(req, res, next) {
    try {
      const conversations = await ChatService.listConversations(req.user.id);
      return sendSuccess(res, conversations, 'Conversations retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getConversationById(req, res, next) {
    try {
      const { id } = req.params;
      const conversation = await ChatService.getConversationById(id, req.user.id);
      return sendSuccess(res, conversation, 'Conversation details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteConversation(req, res, next) {
    try {
      const { id } = req.params;
      await ChatService.deleteConversation(id, req.user.id);
      return sendSuccess(res, null, 'Conversation deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async searchMaterials(req, res, next) {
    try {
      const { query, courseId, topK } = req.query;
      const results = await RAGService.searchSimilarChunks(query, {
        courseId,
        userId: req.user.id,
        role: req.user.role,
        topK: topK ? parseInt(topK, 10) : 5,
      });
      return sendSuccess(res, results, 'Similar materials retrieved via pgvector');
    } catch (error) {
      next(error);
    }
  }

  // Phase 7: Question Generation
  static async generateQuestions(req, res, next) {
    try {
      const { courseId, documentId, count, difficulty, questionType, topic } = req.body;
      const questions = await GeneratorService.generateQuestions({
        courseId,
        documentId,
        count: count ? parseInt(count, 10) : 5,
        difficulty,
        questionType,
        topic,
      });
      await TokenBudgetService.recordUsage(req.user.id, (questions?.length || 5) * 180);
      return sendSuccess(res, questions, 'Questions generated and added to Question Bank', 201);
    } catch (error) {
      next(error);
    }
  }

  // Phase 7: One-Click Quiz Assembly
  static async generateQuiz(req, res, next) {
    try {
      const { courseId, title, documentId, questionCount, timeLimitMinutes, passMark, difficulty } = req.body;
      const quiz = await GeneratorService.generateQuiz(
        {
          courseId,
          title,
          documentId,
          questionCount: questionCount ? parseInt(questionCount, 10) : 5,
          timeLimitMinutes,
          passMark,
          difficulty,
        },
        req.user
      );
      await TokenBudgetService.recordUsage(req.user.id, 1200);
      return sendSuccess(res, quiz, 'Quiz generated and published successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // Phase 7: Flashcard Deck Generation
  static async generateFlashcards(req, res, next) {
    try {
      const { courseId, documentId, count, topic } = req.body;
      const flashcards = await FlashcardService.generateFlashcards({
        courseId,
        documentId,
        count: count ? parseInt(count, 10) : 8,
        topic,
      });
      await TokenBudgetService.recordUsage(req.user.id, (flashcards?.length || 8) * 120);
      return sendSuccess(res, flashcards, 'Flashcards generated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Phase 7: Adaptive Tutor Recommendations
  static async getAdaptiveRecommendations(req, res, next) {
    try {
      const { courseId } = req.query;
      const recommendations = await TutorService.getAdaptiveRecommendations(req.user.id, courseId);
      return sendSuccess(res, recommendations, 'Adaptive tutor recommendations retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default AIController;
