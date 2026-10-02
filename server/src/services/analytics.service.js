import prisma from '../config/db.js';

export class AnalyticsService {
  static async getInstructorAnalytics(instructorId, { courseId } = {}) {
    const courseWhere = { instructorId };
    if (courseId) {
      courseWhere.id = courseId;
    }

    const courses = await prisma.course.findMany({
      where: courseWhere,
      select: { id: true, code: true, title: true, isPublished: true },
    });

    const courseIds = courses.map((c) => c.id);

    if (courseIds.length === 0) {
      return {
        totalCourses: 0,
        totalStudents: 0,
        totalAssignments: 0,
        totalSubmissions: 0,
        assignmentAverageGrade: 0,
        totalQuizzes: 0,
        totalQuizAttempts: 0,
        quizPassRate: 0,
        quizAverageScore: 0,
        totalDiscussions: 0,
        totalReplies: 0,
        courses: [],
        pendingGradingSubmissions: [],
      };
    }

    // Aggregations across instructor's courses
    const [
      activeEnrollments,
      assignments,
      submissions,
      quizzes,
      quizAttempts,
      discussions,
      replies,
      pendingSubmissions,
    ] = await Promise.all([
      prisma.enrollment.count({
        where: { courseId: { in: courseIds }, status: 'ACTIVE' },
      }),
      prisma.assignment.count({
        where: { courseId: { in: courseIds } },
      }),
      prisma.assignmentSubmission.findMany({
        where: {
          assignment: { courseId: { in: courseIds } },
          status: 'GRADED',
        },
        select: { score: true, assignment: { select: { maxScore: true } } },
      }),
      prisma.quiz.count({
        where: { courseId: { in: courseIds } },
      }),
      prisma.quizAttempt.findMany({
        where: {
          quiz: { courseId: { in: courseIds } },
          status: 'SUBMITTED',
        },
        select: { score: true, percentage: true, passed: true },
      }),
      prisma.discussion.count({
        where: { courseId: { in: courseIds } },
      }),
      prisma.discussionReply.count({
        where: { discussion: { courseId: { in: courseIds } } },
      }),
      prisma.assignmentSubmission.findMany({
        where: {
          assignment: { courseId: { in: courseIds } },
          status: 'SUBMITTED',
        },
        take: 10,
        orderBy: { submittedAt: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignment: { select: { id: true, title: true, courseId: true, course: { select: { code: true } } } },
        },
      }),
    ]);

    // Calculate assignment average percentage
    let totalGradedPoints = 0;
    let totalPossiblePoints = 0;
    for (const sub of submissions) {
      if (sub.score !== null && sub.assignment?.maxScore) {
        totalGradedPoints += sub.score;
        totalPossiblePoints += sub.assignment.maxScore;
      }
    }
    const assignmentAverageGrade = totalPossiblePoints > 0
      ? Math.round((totalGradedPoints / totalPossiblePoints) * 100)
      : 0;

    // Calculate quiz pass rate and average score
    const totalAttempts = quizAttempts.length;
    const passedAttempts = quizAttempts.filter((a) => a.passed).length;
    const quizPassRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
    const sumPercentage = quizAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0);
    const quizAverageScore = totalAttempts > 0 ? Math.round(sumPercentage / totalAttempts) : 0;

    return {
      totalCourses: courses.length,
      totalStudents: activeEnrollments,
      totalAssignments: assignments,
      totalSubmissions: submissions.length,
      assignmentAverageGrade,
      totalQuizzes: quizzes,
      totalQuizAttempts: totalAttempts,
      quizPassRate,
      quizAverageScore,
      totalDiscussions: discussions,
      totalReplies: replies,
      courses,
      pendingGradingSubmissions: pendingSubmissions,
    };
  }

  static async getAdminAnalytics() {
    const [
      totalStudents,
      totalInstructors,
      totalAdmins,
      courses,
      activeEnrollments,
      assignments,
      submissions,
      quizzes,
      quizAttempts,
      discussions,
      replies,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.course.findMany({
        select: { id: true, isPublished: true },
      }),
      prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      prisma.assignment.count(),
      prisma.assignmentSubmission.count(),
      prisma.quiz.count(),
      prisma.quizAttempt.count(),
      prisma.discussion.count(),
      prisma.discussionReply.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
      }),
    ]);

    const publishedCourses = courses.filter((c) => c.isPublished).length;
    const draftCourses = courses.length - publishedCourses;

    return {
      users: {
        total: totalStudents + totalInstructors + totalAdmins,
        students: totalStudents,
        instructors: totalInstructors,
        admins: totalAdmins,
        recent: recentUsers,
      },
      courses: {
        total: courses.length,
        published: publishedCourses,
        draft: draftCourses,
        enrollments: activeEnrollments,
      },
      assessments: {
        assignments,
        submissions,
        quizzes,
        quizAttempts,
      },
      community: {
        discussions,
        replies,
      },
    };
  }
}
