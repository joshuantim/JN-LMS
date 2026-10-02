import prisma from '../config/db.js';

export class CourseService {
  static async listCourses({ search, instructorId, isPublished, page = 1, limit = 20, userId, role }) {
    const skip = (page - 1) * limit;

    const where = {
      ...(instructorId && { instructorId }),
      // Non-instructors/non-admins can only see published courses unless querying their own
      ...(role === 'STUDENT' ? { isPublished: true } : (isPublished !== undefined ? { isPublished } : {})),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, courses] = await Promise.all([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              modules: true,
              assignments: true,
              quizzes: true,
            },
          },
          ...(userId ? {
            enrollments: {
              where: { userId },
              select: { id: true, status: true, enrolledAt: true },
            },
          } : {}),
        },
      }),
    ]);

    const formattedCourses = courses.map((course) => {
      const isEnrolled = course.enrollments && course.enrollments.length > 0;
      const enrollmentStatus = isEnrolled ? course.enrollments[0].status : null;
      return {
        ...course,
        isEnrolled,
        enrollmentStatus,
      };
    });

    return {
      courses: formattedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getCourseById(courseId, userId = null) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            bio: true,
            avatarUrl: true,
          },
        },
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                moduleId: true,
                title: true,
                content: true,
                durationMinutes: true,
                orderIndex: true,
                isPublished: true,
                createdAt: true,
              },
            },
          },
        },
        announcements: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
            quizzes: true,
            documents: true,
          },
        },
      },
    });

    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    let isEnrolled = false;
    let enrollment = null;

    if (userId) {
      enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });
      isEnrolled = !!enrollment && enrollment.status === 'ACTIVE';
    }

    return {
      ...course,
      isEnrolled,
      enrollment,
    };
  }

  static async createCourse({ code, title, description, courseImage, isPublished = false }, instructorId) {
    const existing = await prisma.course.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      const error = new Error(`Course code '${code}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    return prisma.course.create({
      data: {
        code: code.toUpperCase(),
        title,
        description,
        courseImage,
        isPublished,
        instructorId,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  static async updateCourse(courseId, data, user) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    // Must be instructor of this course or admin
    if (user.role !== 'ADMIN' && course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only edit courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.course.update({
      where: { id: courseId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.courseImage !== undefined && { courseImage: data.courseImage }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
    });
  }

  static async deleteCourse(courseId, user) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only delete courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.course.delete({
      where: { id: courseId },
    });
  }
}
