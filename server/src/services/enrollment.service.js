import prisma from '../config/db.js';

export class EnrollmentService {
  static async enrollStudent(userId, courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    if (!course.isPublished) {
      const error = new Error('Cannot enroll in an unpublished course');
      error.statusCode = 400;
      throw error;
    }

    // Upsert to handle re-enrollment after withdrawal
    return prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        status: 'ACTIVE',
        enrolledAt: new Date(),
      },
      create: {
        userId,
        courseId,
        status: 'ACTIVE',
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });
  }

  static async dropEnrollment(userId, courseId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      const error = new Error('Enrollment not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      data: {
        status: 'WITHDRAWN',
      },
    });
  }

  static async getMyEnrollments(userId) {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            modules: {
              select: {
                id: true,
                lessons: {
                  select: { id: true },
                },
              },
            },
            _count: {
              select: {
                assignments: true,
                quizzes: true,
              },
            },
          },
        },
      },
    });

    return enrollments.map((enr) => {
      const totalLessons = enr.course.modules.reduce(
        (acc, mod) => acc + (mod.lessons?.length || 0),
        0
      );
      // Mock progress calculation for active enrolled courses (e.g. 70% if lessons exist, else 0%)
      const progressPercent = totalLessons > 0 ? Math.min(100, Math.round(65 + (totalLessons * 5))) : 0;

      return {
        id: enr.id,
        enrolledAt: enr.enrolledAt,
        status: enr.status,
        progress: progressPercent,
        course: enr.course,
      };
    });
  }

  static async getCourseRoster(courseId, user) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only view the roster for courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.enrollment.findMany({
      where: { courseId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
