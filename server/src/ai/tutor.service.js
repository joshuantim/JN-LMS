import prisma from '../config/db.js';
import { RAGService } from './rag.service.js';

export class TutorService {
  /**
   * Analyze student's past quiz performance to generate an adaptive study remediation plan
   */
  static async getAdaptiveRecommendations(userId, courseId) {
    // 1. Fetch user's completed quiz attempts
    const attemptWhere = {
      studentId: userId,
      status: 'SUBMITTED',
    };
    if (courseId) {
      attemptWhere.quiz = { courseId };
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: attemptWhere,
      include: {
        quiz: { select: { id: true, title: true, courseId: true, course: { select: { code: true, title: true } } } },
        answers: {
          include: {
            question: { select: { id: true, questionText: true, topic: true, difficulty: true, explanation: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 10,
    });

    if (attempts.length === 0) {
      return {
        hasHistory: false,
        message: 'No completed quiz attempts found. Take a quiz to receive personalized AI recommendations!',
        weakTopics: [],
        suggestedMaterials: [],
      };
    }

    // 2. Identify missed questions and weak topic areas
    const missedAnswers = [];
    let totalQuestions = 0;
    let correctQuestions = 0;

    for (const attempt of attempts) {
      for (const ans of attempt.answers) {
        totalQuestions++;
        if (ans.isCorrect) {
          correctQuestions++;
        } else {
          missedAnswers.push(ans);
        }
      }
    }

    const overallAccuracy = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 100;

    // Group missed concepts by topic
    const topicStats = {};
    for (const m of missedAnswers) {
      const topicName = m.question?.topic || 'General Concepts';
      if (!topicStats[topicName]) {
        topicStats[topicName] = {
          topic: topicName,
          missedCount: 0,
          sampleQuestions: [],
        };
      }
      topicStats[topicName].missedCount++;
      if (topicStats[topicName].sampleQuestions.length < 2) {
        topicStats[topicName].sampleQuestions.push(m.question.questionText);
      }
    }

    const weakTopics = Object.values(topicStats).sort((a, b) => b.missedCount - a.missedCount);

    // 3. For the top weak topic, retrieve grounded course note recommendations via RAG
    const recommendations = [];
    for (const wt of weakTopics.slice(0, 3)) {
      const chunks = await RAGService.searchSimilarChunks(wt.topic, {
        courseId,
        userId,
        role: 'STUDENT',
        topK: 2,
      });

      recommendations.push({
        topic: wt.topic,
        missedQuestionsCount: wt.missedCount,
        sampleMissedConcept: wt.sampleQuestions[0] || '',
        recommendedReadings: chunks.map((c) => ({
          documentId: c.documentId,
          documentTitle: c.documentTitle,
          pageNumber: c.pageNumber,
          snippet: c.snippet,
        })),
        studyAdvice: `Focus on reviewing definitions and formulas in "${chunks[0]?.documentTitle || 'your lecture notes'}" to strengthen comprehension of ${wt.topic}.`,
      });
    }

    return {
      hasHistory: true,
      totalAttempts: attempts.length,
      overallAccuracy,
      weakTopicsCount: weakTopics.length,
      recommendations,
    };
  }
}

export default TutorService;
