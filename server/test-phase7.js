import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  validateStatus: () => true,
});

async function runTests() {
  console.log('--- STARTING PHASE 7 AI LEARNING FEATURES TESTS ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Login as Instructor
    const instLogin = await client.post('/auth/login', {
      email: 'dr.smith@jnlms.edu',
      password: 'Instructor123!',
    });
    const instCookie = instLogin.headers['set-cookie'];
    assert(instLogin.status === 200, 'Instructor logged in');

    // 2. Login as Student
    const studentLogin = await client.post('/auth/login', {
      email: 'student@jnlms.edu',
      password: 'Student123!',
    });
    const studentCookie = studentLogin.headers['set-cookie'];
    assert(studentLogin.status === 200, 'Student logged in');

    // 3. Get STAT301 Course ID
    const coursesRes = await client.get('/courses', {
      headers: { Cookie: instCookie },
    });
    const coursesList = coursesRes.data.data.courses || coursesRes.data.data;
    const statCourse = coursesList.find((c) => c.code === 'STAT301');
    assert(Boolean(statCourse), 'Found STAT301 course');
    const courseId = statCourse.id;

    // 4. Instructor generates questions via AI
    const genQRes = await client.post('/ai/generate-questions', {
      courseId,
      count: 4,
      difficulty: 'MEDIUM',
      questionType: 'MULTIPLE_CHOICE',
      topic: 'Hypothesis Testing & P-Values',
    }, {
      headers: { Cookie: instCookie },
    });

    assert(genQRes.status === 201, 'Instructor generated AI questions');
    const generatedQuestions = genQRes.data.data;
    assert(Array.isArray(generatedQuestions) && generatedQuestions.length >= 4, 'Generated questions count matches');
    assert(generatedQuestions[0].isAiGenerated === true && generatedQuestions[0].isApproved === false, 'Questions flagged as AI generated with pending approval');
    console.log(`   (Generated question sample: "${generatedQuestions[0].questionText.slice(0, 60)}...")`);

    // 5. Student tries to generate questions (should be 403 Forbidden)
    const studGenQRes = await client.post('/ai/generate-questions', {
      courseId,
      count: 3,
    }, {
      headers: { Cookie: studentCookie },
    });
    assert(studGenQRes.status === 403, 'Student is forbidden from generating questions directly to question bank');

    // 6. Instructor one-click generates a complete Quiz
    const genQuizRes = await client.post('/ai/generate-quiz', {
      courseId,
      title: 'AI Synthesis Quiz: Statistical Inference',
      questionCount: 3,
      timeLimitMinutes: 10,
      passMark: 60,
      difficulty: 'MEDIUM',
    }, {
      headers: { Cookie: instCookie },
    });

    assert(genQuizRes.status === 201, 'Instructor one-click generated complete quiz');
    const quiz = genQuizRes.data.data;
    assert(Boolean(quiz.id) && quiz.questions.length >= 3, 'Quiz created with linked questions');
    console.log(`   (Quiz generated with ID: ${quiz.id}, title: "${quiz.title}", questions: ${quiz.questions.length})`);

    // 7. Student generates Flashcards deck for study
    const flashcardRes = await client.post('/ai/generate-flashcards', {
      courseId,
      count: 6,
      topic: 'Hypothesis Testing Terms',
    }, {
      headers: { Cookie: studentCookie },
    });

    assert(flashcardRes.status === 200, 'Student generated flashcards deck');
    const cards = flashcardRes.data.data;
    assert(Array.isArray(cards) && cards.length >= 6, 'Generated flashcards count matches');
    assert(Boolean(cards[0].front && cards[0].back), 'Flashcard contains front term and back definition');
    console.log(`   (Sample Flashcard: Front: "${cards[0].front}", Back: "${cards[0].back.slice(0, 50)}...")`);

    // 8. Student gets Adaptive Tutor Recommendations
    const tutorRes = await client.get(`/ai/tutor/recommendations?courseId=${courseId}`, {
      headers: { Cookie: studentCookie },
    });

    assert(tutorRes.status === 200, 'Student retrieved adaptive tutor recommendations');
    const tutorData = tutorRes.data.data;
    assert(typeof tutorData.overallAccuracy === 'number' || tutorData.hasHistory !== undefined, 'Tutor diagnostics structure returned');
    console.log(`   (Adaptive Tutor status: hasHistory=${tutorData.hasHistory}, attempts=${tutorData.totalAttempts || 0})`);

  } catch (error) {
    console.error('Test execution error:', error);
    failed++;
  }

  console.log(`\n--- PHASE 7 TESTS FINISHED: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) process.exit(1);
}

runTests();
