import { DiscussionService } from '../services/discussion.service.js';
import { sendSuccess } from '../utils/response.js';

export class DiscussionController {
  static async listDiscussions(req, res, next) {
    try {
      const { courseId, search } = req.query;
      const discussions = await DiscussionService.listDiscussions(
        { courseId, search },
        req.user
      );
      return sendSuccess(res, discussions, 'Discussions fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getDiscussionById(req, res, next) {
    try {
      const { id } = req.params;
      const discussion = await DiscussionService.getDiscussionById(id, req.user);
      return sendSuccess(res, discussion, 'Discussion details fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createDiscussion(req, res, next) {
    try {
      const { courseId, title, content, isPinned } = req.body;
      const discussion = await DiscussionService.createDiscussion(
        { courseId, title, content, isPinned },
        req.user
      );
      return sendSuccess(res, discussion, 'Discussion created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async replyToDiscussion(req, res, next) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const reply = await DiscussionService.replyToDiscussion(id, { content }, req.user);
      return sendSuccess(res, reply, 'Reply posted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async togglePin(req, res, next) {
    try {
      const { id } = req.params;
      const discussion = await DiscussionService.togglePin(id, req.user);
      return sendSuccess(res, discussion, 'Discussion pin status updated');
    } catch (error) {
      next(error);
    }
  }

  static async deleteDiscussion(req, res, next) {
    try {
      const { id } = req.params;
      await DiscussionService.deleteDiscussion(id, req.user);
      return sendSuccess(res, null, 'Discussion deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteReply(req, res, next) {
    try {
      const { replyId } = req.params;
      await DiscussionService.deleteReply(replyId, req.user);
      return sendSuccess(res, null, 'Reply deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
