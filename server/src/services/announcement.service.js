import prisma from '../config/db.js';

export class AnnouncementService {
  static async listAnnouncements({ courseId, userId, role }) {
    let where = {};

    if (courseId) {
      where = {
        OR: [
          { courseId },
          { isSystemWide: true },
        ],
      };
    } else if (role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { courseId: true },
      });
      const userCourseIds = enrollments.map((e) => e.courseId);

      where = {
        OR: [
          { courseId: { in: userCourseIds } },
          { isSystemWide: true },
        ],
      };
    } else if (role === 'INSTRUCTOR') {
      const courses = await prisma.course.findMany({
        where: { instructorId: userId },
        select: { id: true },
      });
      const instructorCourseIds = courses.map((c) => c.id);

      where = {
        OR: [
          { courseId: { in: instructorCourseIds } },
          { isSystemWide: true },
        ],
      };
    }

    return prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        course: {
          select: { id: true, code: true, title: true },
        },
      },
    });
  }

  static async createAnnouncement({ courseId, title, content, isSystemWide = false }, user) {
    if (isSystemWide && user.role !== 'ADMIN') {
      const error = new Error('Forbidden: Only administrators can publish system-wide announcements');
      error.statusCode = 403;
      throw error;
    }

    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        const error = new Error('Course not found');
        error.statusCode = 404;
        throw error;
      }

      if (user.role !== 'ADMIN' && course.instructorId !== user.id) {
        const error = new Error('Forbidden: You can only post announcements for courses you instruct');
        error.statusCode = 403;
        throw error;
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        courseId: courseId || null,
        authorId: user.id,
        title,
        content,
        isSystemWide,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        course: {
          select: { id: true, code: true, title: true },
        },
      },
    });

    // Notify enrolled students
    if (courseId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId, status: 'ACTIVE' },
        select: { userId: true },
      });

      const notifications = enrollments.map((e) => ({
        userId: e.userId,
        title: `Announcement: ${announcement.course?.code || 'Course'}`,
        message: `${announcement.title} - ${announcement.author.firstName} ${announcement.author.lastName}`,
        type: 'ANNOUNCEMENT',
        linkUrl: `/courses/${courseId}`,
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    }

    return announcement;
  }

  static async deleteAnnouncement(id, user) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!announcement) {
      const error = new Error('Announcement not found');
      error.statusCode = 404;
      throw error;
    }

    const isAuthor = announcement.authorId === user.id;
    const isCourseInstructor = announcement.course?.instructorId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isAuthor && !isCourseInstructor && !isAdmin) {
      const error = new Error('Forbidden: You do not have permission to delete this announcement');
      error.statusCode = 403;
      throw error;
    }

    return prisma.announcement.delete({ where: { id } });
  }
}
