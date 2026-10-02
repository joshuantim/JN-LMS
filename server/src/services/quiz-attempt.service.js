import prisma from '../config/db.js';

export class QuizAttemptService {
  static async startAttempt(quizId, studentId) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: true,
        questions: {
          select: {
            id: true,
            questionText: true,
            questionType: true,
            options: true,
            points: true,
            topic: true,
            difficulty: true,
            // CRITICAL: NEVER EXPOSE CORRECT ANSWERS OR EXPLANATIONS DURING ATTEMPT!
          },
        },
      },
    });

    if (!quiz) {
      const error = new Error('Quiz not found');
      error.statusCode = 404;
      throw error;
    }

    if (quiz.status !== 'PUBLISHED') {
      const error = new Error('This quiz is not currently open for attempts');
      error.statusCode = 400;
      throw error;
    }

    // Check student enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: quiz.courseId,
        },
      },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      const error = new Error('Forbidden: You must be enrolled in this course to take the quiz');
      error.statusCode = 403;
      throw error;
    }

    // Check existing attempts
    const existingAttempts = await prisma.quizAttempt.findMany({
      where: { quizId, studentId },
      orderBy: { attemptNumber: 'desc' },
    });

    // Check if an in-progress attempt already exists
    const activeAttempt = existingAttempts.find((a) => a.status === 'IN_PROGRESS');
    if (activeAttempt) {
      const answers = await prisma.attemptAnswer.findMany({
        where: { attemptId: activeAttempt.id },
      });
      return {
        attempt: activeAttempt,
        quiz: {
          id: quiz.id,
          title: quiz.title,
          timeLimitMinutes: quiz.timeLimitMinutes,
          passMark: quiz.passMark,
        },
        questions: quiz.questions,
        answers,
      };
    }

    if (existingAttempts.length >= quiz.maxAttempts) {
      const error = new Error(`Maximum attempts (${quiz.maxAttempts}) reached for this quiz`);
      error.statusCode = 400;
      throw error;
    }

    const nextAttemptNumber = existingAttempts.length + 1;

    let orderedQuestions = [...quiz.questions];
    if (quiz.shuffleQuestions) {
      orderedQuestions = orderedQuestions.sort(() => Math.random() - 0.5);
    }

    const newAttempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId,
        attemptNumber: nextAttemptNumber,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    return {
      attempt: newAttempt,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        timeLimitMinutes: quiz.timeLimitMinutes,
        passMark: quiz.passMark,
      },
      questions: orderedQuestions,
      answers: [],
    };
  }

  static async recordAnswer(attemptId, { questionId, studentAnswer }, studentId) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.studentId !== studentId) {
      const error = new Error('Attempt not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    if (attempt.status !== 'IN_PROGRESS') {
      const error = new Error('This quiz attempt has already been submitted');
      error.statusCode = 400;
      throw error;
    }

    return prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      update: {
        studentAnswer: String(studentAnswer),
        answeredAt: new Date(),
      },
      create: {
        attemptId,
        questionId,
        studentAnswer: String(studentAnswer),
      },
    });
  }

  static async submitAttempt(attemptId, studentId) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
        answers: true,
      },
    });

    if (!attempt || attempt.studentId !== studentId) {
      const error = new Error('Attempt not found');
      error.statusCode = 404;
      throw error;
    }

    if (attempt.status !== 'IN_PROGRESS') {
      const error = new Error('Attempt has already been submitted');
      error.statusCode = 400;
      throw error;
    }

    const questions = attempt.quiz.questions;
    let totalScore = 0;
    let totalPossible = 0;
    let hasSubjective = false;

    // Automated grading engine
    for (const question of questions) {
      totalPossible += question.points;

      const studentAns = attempt.answers.find((a) => a.questionId === question.id);

      if (['MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.questionType)) {
        const isMatch =
          studentAns &&
          studentAns.studentAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

        const awarded = isMatch ? question.points : 0;
        totalScore += awarded;

        if (studentAns) {
          await prisma.attemptAnswer.update({
            where: { id: studentAns.id },
            data: {
              isCorrect: isMatch,
              pointsAwarded: awarded,
              feedback: isMatch ? 'Correct! ✓' : 'Incorrect.',
            },
          });
        }
      } else {
        hasSubjective = true;
      }
    }

    const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
    const passed = percentage >= (attempt.quiz.passMark || 50);

    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: hasSubjective ? 'SUBMITTED' : 'GRADED',
        score: totalScore,
        percentage: parseFloat(percentage.toFixed(1)),
        passed,
        submittedAt: new Date(),
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    return updatedAttempt;
  }

  static async getAttemptReview(attemptId, user) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            course: true,
            questions: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!attempt) {
      const error = new Error('Attempt not found');
      error.statusCode = 404;
      throw error;
    }

    // Permission check
    if (user.role === 'STUDENT' && attempt.studentId !== user.id) {
      const error = new Error('Forbidden: You can only view your own quiz attempts');
      error.statusCode = 403;
      throw error;
    }

    return attempt;
  }
}
