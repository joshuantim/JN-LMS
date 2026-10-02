import prisma from '../config/db.js';

export class ModuleService {
  static async createModule(courseId, { title, description, orderIndex }, user) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only add modules to courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    // Determine orderIndex if not supplied
    let computedIndex = orderIndex;
    if (computedIndex === undefined) {
      const last = await prisma.module.findFirst({
        where: { courseId },
        orderBy: { orderIndex: 'desc' },
      });
      computedIndex = (last?.orderIndex ?? 0) + 1;
    }

    return prisma.module.create({
      data: {
        courseId,
        title,
        description,
        orderIndex: computedIndex,
      },
      include: {
        lessons: true,
      },
    });
  }

  static async updateModule(moduleId, data, user) {
    const existing = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!existing) {
      const error = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && existing.course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only edit modules for courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.module.update({
      where: { id: moduleId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
    });
  }

  static async deleteModule(moduleId, user) {
    const existing = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!existing) {
      const error = new Error('Module not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && existing.course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only delete modules for courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.module.delete({
      where: { id: moduleId },
    });
  }
}
