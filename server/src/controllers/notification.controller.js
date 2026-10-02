import { NotificationService } from '../services/notification.service.js';
import { sendSuccess } from '../utils/response.js';

export class NotificationController {
  static async getUserNotifications(req, res, next) {
    try {
      const { unreadOnly, limit } = req.query;
      const data = await NotificationService.getUserNotifications(req.user.id, {
        unreadOnly: unreadOnly === 'true',
        limit,
      });
      return sendSuccess(res, data, 'Notifications fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await NotificationService.markAsRead(id, req.user.id);
      return sendSuccess(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      await NotificationService.markAllAsRead(req.user.id);
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      await NotificationService.deleteNotification(id, req.user.id);
      return sendSuccess(res, null, 'Notification deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
