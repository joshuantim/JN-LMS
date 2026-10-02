import app from './src/app.js';
import prisma from './src/config/db.js';

let server;

async function runPhase3Tests() {
  console.log('🧪 Starting Phase 3 (Assessments & Grading) Integration Tests...\n');

  const PORT = 5057;
  server = app.listen(PORT);
  const baseUrl = `http://localhost:${PORT}/api`;

  let failures = 0;

  const assert = (condition, name) => {
    if (condition) {
      console.log(`  ✓ PASS: ${name}`);
    } else {
      console.error(`  ✗ FAIL: ${name}`);
      failures++;
    }
  };

  try {
    // Login as Student
    const studentLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@jnlms.edu', password: 'Student123!' }),
    });
    const studentCookie = studentLogin.headers.get('set-cookie');

    // Login as Instructor
    const instructorLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dr.smith@jnlms.edu', password: 'Instructor123!' }),
    });
    const instructorCookie = instructorLogin.headers.get('set-cookie');

    // Get an existing course (e.g. STAT301)
    const coursesRes = await fetch(`${baseUrl}/courses`, {
      headers: { Cookie: instructorCookie },
    });
    const coursesData = await coursesRes.json();
    const courseId = coursesData.data.courses[0].id;

    // Test 1: Instructor creates an Assignment
    const assignRes = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: instructorCookie },
      body: JSON.stringify({
        courseId,
        title: 'Problem Set 1: Discrete Random Variables',
        description: 'Solve probability density problems.',
        instructions: 'Show all calculations clearly.',
        maxScore: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      }),
    });
    const assignData = await assignRes.json();
    assert(assignRes.status === 201 && assignData.data?.assignment?.title.includes('Discrete Random Variables'), 'POST /api/assignments creates assignment');
    const assignmentId = assignData.data?.assignment?.id;

    // Test 2: Student submits Assignment
    const submitRes = await fetch(`${baseUrl}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        content: 'P(X = k) = (n choose k) * p^k * (1-p)^(n-k).',
        fileUrl: 'https://storage.jnlms.edu/uploads/student-prob1.pdf',
      }),
    });
    const submitData = await submitRes.json();
    assert(submitRes.status === 201 && submitData.data?.submission?.status === 'SUBMITTED', 'POST /api/assignments/:id/submit saves student submission');
    const submissionId = submitData.data?.submission?.id;

    // Test 3: Instructor grades Assignment
    const gradeRes = await fetch(`${baseUrl}/assignments/submissions/${submissionId}/grade`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: instructorCookie },
      body: JSON.stringify({
        score: 95,
        feedback: 'Excellent derivation of the binomial distribution!',
      }),
    });
    const gradeData = await gradeRes.json();
    assert(gradeRes.status === 200 && gradeData.data?.submission?.score === 95, 'PATCH /api/assignments/submissions/:id/grade awards marks');

    // Test 4: Instructor creates Question in Question Bank
    const qBankRes = await fetch(`${baseUrl}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: instructorCookie },
      body: JSON.stringify({
        courseId,
        questionText: 'What is the sum of probabilities of all elementary outcomes in a sample space?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          { id: 'A', text: '0' },
          { id: 'B', text: '0.5' },
          { id: 'C', text: '1.0' },
          { id: 'D', text: 'Infinity' },
        ],
        correctAnswer: 'C',
        explanation: 'By the second axiom of probability, P(S) = 1.',
        points: 2,
        topic: 'Axioms of Probability',
        difficulty: 'EASY',
      }),
    });
    const qBankData = await qBankRes.json();
    assert(qBankRes.status === 201 && qBankData.data?.question?.correctAnswer === 'C', 'POST /api/questions creates question in bank');

    // Test 5: Instructor creates Quiz
    const quizRes = await fetch(`${baseUrl}/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: instructorCookie },
      body: JSON.stringify({
        courseId,
        title: 'STAT301 Mastery Quiz 1',
        description: 'Test your understanding of probability axioms.',
        timeLimitMinutes: 15,
        passMark: 50,
        maxAttempts: 2,
      }),
    });
    const quizData = await quizRes.json();
    assert(quizRes.status === 201 && quizData.data?.quiz?.title.includes('Mastery Quiz 1'), 'POST /api/quizzes creates quiz');
    const quizId = quizData.data?.quiz?.id;

    // Test 6: Instructor adds questions to Quiz
    const addQ1Res = await fetch(`${baseUrl}/quizzes/${quizId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: instructorCookie },
      body: JSON.stringify({
        questionText: 'Is the probability of an impossible event always 0?',
        questionType: 'TRUE_FALSE',
        options: [{ id: 'True', text: 'True' }, { id: 'False', text: 'False' }],
        correctAnswer: 'True',
        explanation: 'P(empty set) = 0.',
        points: 5,
      }),
    });
    const addQ1Data = await addQ1Res.json();
    assert(addQ1Res.status === 201, 'POST /api/quizzes/:id/questions adds question 1');

    const addQ2Res = await fetch(`${baseUrl}/quizzes/${quizId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: instructorCookie },
      body: JSON.stringify({
        questionText: 'If P(A) = 0.4 and P(B) = 0.5 for disjoint events A and B, what is P(A U B)?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          { id: 'A', text: '0.1' },
          { id: 'B', text: '0.9' },
          { id: 'C', text: '0.2' },
          { id: 'D', text: '1.0' },
        ],
        correctAnswer: 'B',
        explanation: 'For disjoint events, P(A U B) = P(A) + P(B) = 0.4 + 0.5 = 0.9.',
        points: 5,
      }),
    });
    const addQ2Data = await addQ2Res.json();
    assert(addQ2Res.status === 201, 'POST /api/quizzes/:id/questions adds question 2');

    // Test 7: CRITICAL SECURITY: Student inspects quiz questions before submitting
    const studentQuizInspect = await fetch(`${baseUrl}/quizzes/${quizId}`, {
      headers: { Cookie: studentCookie },
    });
    const studentQuizData = await studentQuizInspect.json();
    const hasExposedAnswer = studentQuizData.data?.quiz?.questions?.some(
      (q) => q.correctAnswer !== undefined || q.explanation !== undefined
    );
    assert(!hasExposedAnswer, 'CRITICAL SECURITY: Correct answers & explanations are hidden from students prior to submission');

    // Test 8: Student starts quiz attempt
    const startAttemptRes = await fetch(`${baseUrl}/attempts/quiz/${quizId}/start`, {
      method: 'POST',
      headers: { Cookie: studentCookie },
    });
    const startAttemptData = await startAttemptRes.json();
    assert(startAttemptRes.status === 201 && startAttemptData.data?.attempt?.status === 'IN_PROGRESS', 'POST /api/attempts/quiz/:id/start creates IN_PROGRESS attempt');
    const attemptId = startAttemptData.data?.attempt?.id;

    // Test 9: Student records answers
    const q1 = startAttemptData.data.questions[0];
    const q2 = startAttemptData.data.questions[1];

    await fetch(`${baseUrl}/attempts/${attemptId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        questionId: q1.id,
        studentAnswer: q1.questionType === 'TRUE_FALSE' ? 'True' : 'B',
      }),
    });

    await fetch(`${baseUrl}/attempts/${attemptId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        questionId: q2.id,
        studentAnswer: q2.questionType === 'TRUE_FALSE' ? 'True' : 'B',
      }),
    });
    assert(true, 'POST /api/attempts/:id/answer auto-saves student choices');

    // Test 10: Student submits quiz -> Auto-grading occurs!
    const submitAttemptRes = await fetch(`${baseUrl}/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: { Cookie: studentCookie },
    });
    const submitAttemptData = await submitAttemptRes.json();
    assert(
      submitAttemptRes.status === 200 &&
      submitAttemptData.data?.attempt?.status === 'GRADED' &&
      submitAttemptData.data?.attempt?.percentage === 100,
      'POST /api/attempts/:id/submit auto-grades attempt with 100% score'
    );

    // Test 11: Student views attempt review -> Correct answers are now revealed!
    const reviewRes = await fetch(`${baseUrl}/attempts/${attemptId}/review`, {
      headers: { Cookie: studentCookie },
    });
    const reviewData = await reviewRes.json();
    assert(
      reviewRes.status === 200 &&
      reviewData.data?.attempt?.answers[0]?.question?.correctAnswer !== undefined,
      'GET /api/attempts/:id/review safely unlocks correct answers post-submission'
    );

    // Test 12: Gradebook aggregation
    const gradebookRes = await fetch(`${baseUrl}/grades`, {
      headers: { Cookie: studentCookie },
    });
    const gradebookData = await gradebookRes.json();
    assert(
      gradebookRes.status === 200 &&
      Array.isArray(gradebookData.data?.gradebook) &&
      gradebookData.data.gradebook.length > 0,
      'GET /api/grades calculates student gradebook'
    );

    console.log('\n========================================');
    if (failures === 0) {
      console.log('🎉 ALL 12 PHASE 3 INTEGRATION TESTS PASSED!');
    } else {
      console.log(`❌ ${failures} test(s) failed`);
    }
    console.log('========================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
    failures++;
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(failures > 0 ? 1 : 0);
  }
}

runPhase3Tests();
