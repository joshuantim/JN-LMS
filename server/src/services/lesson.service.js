import prisma from '../config/db.js';

export class LessonService {
  static async createLesson(moduleId, { title, content, durationMinutes, orderIndex }, user) {
    const moduleItem = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!moduleItem) {
      const error = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && moduleItem.course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only add lessons to courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    let computedIndex = orderIndex;
    if (computedIndex === undefined) {
      const last = await prisma.lesson.findFirst({
        where: { moduleId },
        orderBy: { orderIndex: 'desc' },
      });
      computedIndex = (last?.orderIndex ?? 0) + 1;
    }

    return prisma.lesson.create({
      data: {
        moduleId,
        title,
        content,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
        orderIndex: computedIndex,
      },
    });
  }

  static async getLesson(lessonId, user) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      const error = new Error('Lesson not found');
      error.statusCode = 404;
      throw error;
    }

    // Authorization check: if student, ensure active enrollment in the course
    if (user.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: lesson.module.courseId,
          },
        },
      });

      if (!enrollment || enrollment.status !== 'ACTIVE') {
        const error = new Error('Forbidden: You must be enrolled in this course to view lesson contents');
        error.statusCode = 403;
        throw error;
      }
    }

    return lesson;
  }

  static async updateLesson(lessonId, data, user) {
    const existing = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });

    if (!existing) {
      const error = new Error('Lesson not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && existing.module.course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only edit lessons for courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.durationMinutes !== undefined && {
          durationMinutes: data.durationMinutes ? parseInt(data.durationMinutes) : null,
        }),
        ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
    });
  }

  static async deleteLesson(lessonId, user) {
    const existing = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });

    if (!existing) {
      const error = new Error('Lesson not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && existing.module.course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only delete lessons for courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.lesson.delete({
      where: { id: lessonId },
    });
  }
}
