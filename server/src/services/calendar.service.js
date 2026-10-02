import prisma from '../config/db.js';

export class CalendarService {
  static async getEvents(user, { startDate, endDate, courseId } = {}) {
    let courseIds = [];

    if (courseId) {
      courseIds = [courseId];
    } else if (user.role === 'ADMIN') {
      const allCourses = await prisma.course.findMany({ select: { id: true } });
      courseIds = allCourses.map((c) => c.id);
    } else if (user.role === 'INSTRUCTOR') {
      const instructorCourses = await prisma.course.findMany({
        where: { instructorId: user.id },
        select: { id: true },
      });
      courseIds = instructorCourses.map((c) => c.id);
    } else {
      const studentEnrollments = await prisma.enrollment.findMany({
        where: { userId: user.id, status: 'ACTIVE' },
        select: { courseId: true },
      });
      courseIds = studentEnrollments.map((e) => e.courseId);
    }

    if (courseIds.length === 0) {
      return [];
    }

    const assignmentWhere = {
      courseId: { in: courseIds },
      status: 'PUBLISHED',
    };

    const quizWhere = {
      courseId: { in: courseIds },
      status: 'PUBLISHED',
    };

    if (startDate || endDate) {
      assignmentWhere.dueDate = {};
      quizWhere.availableUntil = {};
      if (startDate) {
        assignmentWhere.dueDate.gte = new Date(startDate);
        quizWhere.availableUntil.gte = new Date(startDate);
      }
      if (endDate) {
        assignmentWhere.dueDate.lte = new Date(endDate);
        quizWhere.availableUntil.lte = new Date(endDate);
      }
    }

    // Build include configurations safely
    const assignmentInclude = {
      course: { select: { id: true, code: true, title: true } },
    };
    if (user.role === 'STUDENT') {
      assignmentInclude.submissions = {
        where: { studentId: user.id },
        select: { id: true, status: true, score: true },
      };
    }

    const quizInclude = {
      course: { select: { id: true, code: true, title: true } },
    };
    if (user.role === 'STUDENT') {
      quizInclude.attempts = {
        where: { studentId: user.id },
        select: { id: true, status: true, score: true, passed: true },
      };
    }

    // Fetch assignments and quizzes concurrently
    const [assignments, quizzes] = await Promise.all([
      prisma.assignment.findMany({
        where: assignmentWhere,
        include: assignmentInclude,
      }),
      prisma.quiz.findMany({
        where: quizWhere,
        include: quizInclude,
      }),
    ]);

    const events = [];

    // Map assignments
    for (const a of assignments) {
      const submission = a.submissions && a.submissions[0];
      events.push({
        id: `assignment-${a.id}`,
        sourceId: a.id,
        title: a.title,
        type: 'ASSIGNMENT',
        date: a.dueDate,
        courseId: a.courseId,
        courseCode: a.course.code,
        courseTitle: a.course.title,
        status: submission ? submission.status : 'PENDING',
        points: a.maxScore,
        linkUrl: `/assignments/${a.id}`,
      });
    }

    // Map quizzes
    for (const q of quizzes) {
      const attempt = q.attempts && q.attempts[0];
      events.push({
        id: `quiz-${q.id}`,
        sourceId: q.id,
        title: q.title,
        type: 'QUIZ',
        date: q.availableUntil || q.createdAt,
        courseId: q.courseId,
        courseCode: q.course.code,
        courseTitle: q.course.title,
        status: attempt ? (attempt.status === 'SUBMITTED' ? 'COMPLETED' : 'IN_PROGRESS') : 'PENDING',
        durationMinutes: q.timeLimitMinutes,
        linkUrl: `/quizzes/${q.id}/take`,
      });
    }

    // Sort chronologically
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return events;
  }
}
