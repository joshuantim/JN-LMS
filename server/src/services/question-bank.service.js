import prisma from '../config/db.js';

export class QuestionBankService {
  static async listQuestions({ courseId, topic, difficulty, isApproved, isAiGenerated, search }) {
    const where = {
      ...(courseId && { courseId }),
      ...(topic && { topic: { contains: topic, mode: 'insensitive' } }),
      ...(difficulty && { difficulty }),
      ...(isApproved !== undefined ? { isApproved } : {}),
      ...(isAiGenerated !== undefined ? { isAiGenerated } : {}),
      ...(search && {
        questionText: { contains: search, mode: 'insensitive' },
      }),
    };

    return prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: { id: true, code: true, title: true },
        },
        quiz: {
          select: { id: true, title: true },
        },
      },
    });
  }

  static async createQuestion(data, user) {
    if (data.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: data.courseId },
      });
      if (course && user.role !== 'ADMIN' && course.instructorId !== user.id) {
        const error = new Error('Forbidden: You can only add questions to courses you instruct');
        error.statusCode = 403;
        throw error;
      }
    }

    return prisma.question.create({
      data: {
        courseId: data.courseId || null,
        quizId: data.quizId || null,
        questionText: data.questionText,
        questionType: data.questionType || 'MULTIPLE_CHOICE',
        options: data.options || [],
        correctAnswer: data.correctAnswer,
        explanation: data.explanation || null,
        points: data.points ? parseFloat(data.points) : 1,
        topic: data.topic || null,
        difficulty: data.difficulty || 'MEDIUM',
        isAiGenerated: data.isAiGenerated || false,
        isApproved: data.isApproved !== undefined ? data.isApproved : true,
      },
    });
  }

  static async updateQuestion(id, data, user) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!question) {
      const error = new Error('Question not found');
      error.statusCode = 404;
      throw error;
    }

    if (question.course && user.role !== 'ADMIN' && question.course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only edit questions for courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.question.update({
      where: { id },
      data: {
        ...(data.questionText !== undefined && { questionText: data.questionText }),
        ...(data.questionType !== undefined && { questionType: data.questionType }),
        ...(data.options !== undefined && { options: data.options }),
        ...(data.correctAnswer !== undefined && { correctAnswer: data.correctAnswer }),
        ...(data.explanation !== undefined && { explanation: data.explanation }),
        ...(data.points !== undefined && { points: parseFloat(data.points) }),
        ...(data.topic !== undefined && { topic: data.topic }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.isApproved !== undefined && { isApproved: data.isApproved }),
        ...(data.quizId !== undefined && { quizId: data.quizId }),
      },
    });
  }

  static async deleteQuestion(id, user) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!question) {
      const error = new Error('Question not found');
      error.statusCode = 404;
      throw error;
    }

    if (question.course && user.role !== 'ADMIN' && question.course.instructorId !== user.id) {
      const error = new Error('Forbidden: You can only delete questions for courses you instruct');
      error.statusCode = 403;
      throw error;
    }

    return prisma.question.delete({
      where: { id },
    });
  }
}
