import prisma from '../config/db.js';

export class NotificationService {
  static async getUserNotifications(userId, { unreadOnly = false, limit = 50 } = {}) {
    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit) || 50,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  }

  static async markAsRead(id, userId) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    if (notification.userId !== userId) {
      const error = new Error('Forbidden: You can only modify your own notifications');
      error.statusCode = 403;
      throw error;
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  static async deleteNotification(id, userId) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    if (notification.userId !== userId) {
      const error = new Error('Forbidden: You can only delete your own notifications');
      error.statusCode = 403;
      throw error;
    }

    return prisma.notification.delete({
      where: { id },
    });
  }

  static async createNotification({ userId, title, message, type = 'SYSTEM', linkUrl = null }) {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        linkUrl,
      },
    });
  }
}
