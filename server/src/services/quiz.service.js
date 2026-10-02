import prisma from '../config/db.js';

export class QuizService {
  static async listQuizzes({ courseId, userId, role }) {
    let courseIds = [];

    if (courseId) {
      courseIds = [courseId];
    } else if (role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { courseId: true },
      });
      courseIds = enrollments.map((e) => e.courseId);
    } else if (role === 'INSTRUCTOR') {
      const courses = await prisma.course.findMany({
        where: { instructorId: userId },
        select: { id: true },
      });
      courseIds = courses.map((c) => c.id);
    }

    const where = {
      ...(courseIds.length > 0 ? { courseId: { in: courseIds } } : {}),
      ...(role === 'STUDENT' ? { status: { in: ['PUBLISHED', 'ARCHIVED'] } } : {}),
    };

    const quizzes = await prisma.quiz.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: { id: true, code: true, title: true },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
        attempts: role === 'STUDENT' ? {
          where: { studentId: userId },
          orderBy: { attemptNumber: 'desc' },
          select: {
            id: true,
            attemptNumber: true,
            score: true,
            percentage: true,
            passed: true,
            status: true,
            submittedAt: true,
          },
        } : undefined,
      },
    });

    return quizzes.map((q) => {
      const myAttempts = role === 'STUDENT' ? q.attempts || [] : [];
      const bestScore = myAttempts.reduce((max, a) => (a.score > max ? a.score : max), 0);
      return {
        ...q,
        myAttempts,
        bestScore,
      };
    });
  }

  static async getQuizById(quizId, user) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: {
          select: { id: true, code: true, title: true, instructorId: true },
        },
        questions: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            questionText: true,
            questionType: true,
            options: true,
            points: true,
            topic: true,
            difficulty: true,
            // CRITICAL SECURITY: Only expose answers to instructors/admins!
            ...(user.role !== 'STUDENT' ? { correctAnswer: true, explanation: true } : {}),
          },
        },
        attempts: user.role === 'STUDENT' ? {
          where: { studentId: user.id },
          orderBy: { attemptNumber: 'desc' },
        } : {
          take: 10,
          orderBy: { startedAt: 'desc' },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!quiz) {
      const error = new Error('Quiz not found');
      error.statusCode = 404;
      throw error;
    }

    return quiz;
  }

  static async createQuiz(data, user) {
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only create quizzes for courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.quiz.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        timeLimitMinutes: data.timeLimitMinutes ? parseInt(data.timeLimitMinutes) : null,
        passMark: data.passMark ? parseFloat(data.passMark) : 50,
        maxAttempts: data.maxAttempts ? parseInt(data.maxAttempts) : 1,
        shuffleQuestions: data.shuffleQuestions || false,
        showResultsImmediate: data.showResultsImmediate ?? true,
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
        availableUntil: data.availableUntil ? new Date(data.availableUntil) : null,
        status: data.status || 'PUBLISHED',
      },
      include: {
        course: {
          select: { id: true, code: true, title: true },
        },
      },
    });
  }

  static async updateQuiz(quizId, data, user) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: true },
    });

    if (!quiz) {
      const error = new Error('Quiz not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && quiz.course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only edit quizzes for courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.timeLimitMinutes !== undefined && {
          timeLimitMinutes: data.timeLimitMinutes ? parseInt(data.timeLimitMinutes) : null,
        }),
        ...(data.passMark !== undefined && { passMark: parseFloat(data.passMark) }),
        ...(data.maxAttempts !== undefined && { maxAttempts: parseInt(data.maxAttempts) }),
        ...(data.shuffleQuestions !== undefined && { shuffleQuestions: data.shuffleQuestions }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  static async addQuestionToQuiz(quizId, questionData, user) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: true },
    });

    if (!quiz) {
      const error = new Error('Quiz not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role !== 'ADMIN' && quiz.course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only add questions to quizzes you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.question.create({
      data: {
        quizId,
        courseId: quiz.courseId,
        questionText: questionData.questionText,
        questionType: questionData.questionType || 'MULTIPLE_CHOICE',
        options: questionData.options || [],
        correctAnswer: questionData.correctAnswer,
        explanation: questionData.explanation || null,
        points: questionData.points ? parseFloat(questionData.points) : 1,
        topic: questionData.topic || null,
        difficulty: questionData.difficulty || 'MEDIUM',
        isAiGenerated: questionData.isAiGenerated || false,
        isApproved: true,
      },
    });
  }
}
