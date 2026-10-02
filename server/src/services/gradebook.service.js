import prisma from '../config/db.js';

export class GradebookService {
  static async getStudentGradebook(studentId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: studentId, status: 'ACTIVE' },
      include: {
        course: {
          include: {
            assignments: {
              where: { status: { in: ['PUBLISHED', 'CLOSED'] } },
              include: {
                submissions: {
                  where: { studentId },
                },
              },
            },
            quizzes: {
              where: { status: { in: ['PUBLISHED', 'ARCHIVED'] } },
              include: {
                attempts: {
                  where: { studentId, status: 'GRADED' },
                  orderBy: { score: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    return enrollments.map((enr) => {
      const course = enr.course;

      const assignmentGrades = course.assignments.map((a) => {
        const sub = a.submissions[0] || null;
        return {
          id: a.id,
          title: a.title,
          type: 'ASSIGNMENT',
          maxScore: a.maxScore,
          score: sub?.score ?? null,
          status: sub ? sub.status : 'PENDING',
          feedback: sub?.feedback || null,
          submittedAt: sub?.submittedAt || null,
        };
      });

      const quizGrades = course.quizzes.map((q) => {
        const bestAttempt = q.attempts[0] || null;
        return {
          id: q.id,
          title: q.title,
          type: 'QUIZ',
          score: bestAttempt?.score ?? null,
          percentage: bestAttempt?.percentage ?? null,
          passed: bestAttempt?.passed ?? null,
          status: bestAttempt ? 'COMPLETED' : 'PENDING',
          attemptsCount: q.attempts.length,
        };
      });

      // Calculate total points earned vs possible
      let earned = 0;
      let total = 0;

      assignmentGrades.forEach((item) => {
        if (item.score !== null) {
          earned += item.score;
          total += item.maxScore;
        }
      });

      quizGrades.forEach((item) => {
        if (item.percentage !== null) {
          earned += item.percentage;
          total += 100;
        }
      });

      const overallPercentage = total > 0 ? parseFloat(((earned / total) * 100).toFixed(1)) : 100;

      return {
        courseId: course.id,
        courseCode: course.code,
        courseTitle: course.title,
        overallPercentage,
        assignments: assignmentGrades,
        quizzes: quizGrades,
      };
    });
  }
}
