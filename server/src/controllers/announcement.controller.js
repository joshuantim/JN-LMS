import { AnnouncementService } from '../services/announcement.service.js';
import { sendSuccess } from '../utils/response.js';

export class AnnouncementController {
  static async listAnnouncements(req, res, next) {
    try {
      const { courseId } = req.query;
      const announcements = await AnnouncementService.listAnnouncements({
        courseId,
        userId: req.user.id,
        role: req.user.role,
      });
      return sendSuccess(res, announcements, 'Announcements fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createAnnouncement(req, res, next) {
    try {
      const { courseId, title, content, isSystemWide } = req.body;
      const announcement = await AnnouncementService.createAnnouncement(
        { courseId, title, content, isSystemWide },
        req.user
      );
      return sendSuccess(res, announcement, 'Announcement created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAnnouncement(req, res, next) {
    try {
      const { id } = req.params;
      await AnnouncementService.deleteAnnouncement(id, req.user);
      return sendSuccess(res, null, 'Announcement deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
