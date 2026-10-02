import prisma from '../config/db.js';

export class DiscussionService {
  static async verifyCourseAccess(courseId, user) {
    if (user.role === 'ADMIN') return true;

    if (user.role === 'INSTRUCTOR') {
      const course = await prisma.course.findFirst({
        where: { id: courseId, instructorId: user.id },
      });
      if (course) return true;
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { courseId, userId: user.id, status: 'ACTIVE' },
    });

    if (!enrollment) {
      const error = new Error('Forbidden: You must be enrolled in this course to access discussions');
      error.statusCode = 403;
      throw error;
    }

    return true;
  }

  static async listDiscussions({ courseId, search }, user) {
    if (!courseId) {
      const error = new Error('Course ID is required to list discussions');
      error.statusCode = 400;
      throw error;
    }

    await this.verifyCourseAccess(courseId, user);

    const where = { courseId };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.discussion.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
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
        _count: {
          select: { replies: true },
        },
      },
    });
  }

  static async getDiscussionById(id, user) {
    const discussion = await prisma.discussion.findUnique({
      where: { id },
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
          select: { id: true, code: true, title: true, instructorId: true },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
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
          },
        },
      },
    });

    if (!discussion) {
      const error = new Error('Discussion thread not found');
      error.statusCode = 404;
      throw error;
    }

    await this.verifyCourseAccess(discussion.courseId, user);

    return discussion;
  }

  static async createDiscussion({ courseId, title, content, isPinned = false }, user) {
    if (!courseId || !title || !content) {
      const error = new Error('Course ID, title, and content are required');
      error.statusCode = 400;
      throw error;
    }

    await this.verifyCourseAccess(courseId, user);

    // Only instructor or admin can pin discussions on creation
    const canPin = user.role === 'ADMIN' || user.role === 'INSTRUCTOR';
    const pinVal = canPin ? Boolean(isPinned) : false;

    return prisma.discussion.create({
      data: {
        courseId,
        authorId: user.id,
        title,
        content,
        isPinned: pinVal,
      },
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
        _count: {
          select: { replies: true },
        },
      },
    });
  }

  static async replyToDiscussion(discussionId, { content }, user) {
    if (!content || !content.trim()) {
      const error = new Error('Reply content cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      include: { course: true, author: true },
    });

    if (!discussion) {
      const error = new Error('Discussion not found');
      error.statusCode = 404;
      throw error;
    }

    await this.verifyCourseAccess(discussion.courseId, user);

    const [reply] = await prisma.$transaction([
      prisma.discussionReply.create({
        data: {
          discussionId,
          authorId: user.id,
          content,
        },
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
        },
      }),
      // Bump parent discussion updatedAt
      prisma.discussion.update({
        where: { id: discussionId },
        data: { updatedAt: new Date() },
      }),
    ]);

    // Send notification to discussion author if different user
    if (discussion.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: discussion.authorId,
          title: `New reply in: ${discussion.title.slice(0, 30)}...`,
          message: `${user.firstName} ${user.lastName} replied to your discussion.`,
          type: 'DISCUSSION',
          linkUrl: `/discussions/${discussionId}`,
        },
      });
    }

    return reply;
  }

  static async togglePin(discussionId, user) {
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      include: { course: true },
    });

    if (!discussion) {
      const error = new Error('Discussion not found');
      error.statusCode = 404;
      throw error;
    }

    const isCourseInstructor = discussion.course.instructorId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isCourseInstructor && !isAdmin) {
      const error = new Error('Forbidden: Only instructors and admins can pin or unpin discussions');
      error.statusCode = 403;
      throw error;
    }

    return prisma.discussion.update({
      where: { id: discussionId },
      data: { isPinned: !discussion.isPinned },
    });
  }

  static async deleteDiscussion(discussionId, user) {
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      include: { course: true },
    });

    if (!discussion) {
      const error = new Error('Discussion not found');
      error.statusCode = 404;
      throw error;
    }

    const isAuthor = discussion.authorId === user.id;
    const isCourseInstructor = discussion.course.instructorId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isAuthor && !isCourseInstructor && !isAdmin) {
      const error = new Error('Forbidden: You do not have permission to delete this discussion');
      error.statusCode = 403;
      throw error;
    }

    return prisma.discussion.delete({ where: { id: discussionId } });
  }

  static async deleteReply(replyId, user) {
    const reply = await prisma.discussionReply.findUnique({
      where: { id: replyId },
      include: {
        discussion: {
          include: { course: true },
        },
      },
    });

    if (!reply) {
      const error = new Error('Reply not found');
      error.statusCode = 404;
      throw error;
    }

    const isAuthor = reply.authorId === user.id;
    const isCourseInstructor = reply.discussion.course.instructorId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isAuthor && !isCourseInstructor && !isAdmin) {
      const error = new Error('Forbidden: You do not have permission to delete this reply');
      error.statusCode = 403;
      throw error;
    }

    return prisma.discussionReply.delete({ where: { id: replyId } });
  }
}
