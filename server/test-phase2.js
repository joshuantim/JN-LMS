import app from './src/app.js';
import prisma from './src/config/db.js';

let server;

async function runPhase2Tests() {
  console.log('🧪 Starting Phase 2 (LMS Core) Integration Tests...\n');

  const PORT = 5056;
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
    // 1. Login as Student
    const studentLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@jnlms.edu', password: 'Student123!' }),
    });
    const studentCookie = studentLogin.headers.get('set-cookie');

    // 2. Login as Instructor
    const instructorLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dr.smith@jnlms.edu', password: 'Instructor123!' }),
    });
    const instructorCookie = instructorLogin.headers.get('set-cookie');

    // Test 1: List published courses
    const listRes = await fetch(`${baseUrl}/courses`, {
      headers: { Cookie: studentCookie },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200 && Array.isArray(listData.data?.courses), 'GET /api/courses returns course list');
    assert(listData.data.courses.length >= 2, 'At least 2 seeded demo courses exist');

    // Test 2: Instructor creates a new course
    const newCourseCode = `CS${Math.floor(100 + Math.random() * 899)}`;
    const createRes = await fetch(`${baseUrl}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: instructorCookie },
      body: JSON.stringify({
        code: newCourseCode,
        title: 'Advanced Machine Learning & Vector Search',
        description: 'Deep dive into transformer models, embeddings, and similarity metrics.',
        isPublished: true,
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.data?.course?.code === newCourseCode, 'POST /api/courses creates course (Instructor)');
    const createdCourseId = createData.data?.course?.id;

    // Test 3: Instructor adds a module
    const modRes = await fetch(`${baseUrl}/modules/course/${createdCourseId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: instructorCookie },
      body: JSON.stringify({
        title: 'Module 1: Vector Embeddings & Similarity',
        description: 'Cosine similarity, Euclidean distance, and high-dimensional spaces.',
      }),
    });
    const modData = await modRes.json();
    assert(modRes.status === 201 && modData.data?.module?.title.includes('Vector Embeddings'), 'POST /api/modules/course/:id adds module');
    const createdModuleId = modData.data?.module?.id;

    // Test 4: Instructor adds a lesson
    const lessonRes = await fetch(`${baseUrl}/lessons/module/${createdModuleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: instructorCookie },
      body: JSON.stringify({
        title: 'Lesson 1.1: Dot Products & Cosine Distance',
        content: 'Vectors represent semantic representations in R^d space.',
        durationMinutes: 40,
      }),
    });
    const lessonData = await lessonRes.json();
    assert(lessonRes.status === 201 && lessonData.data?.lesson?.title.includes('Dot Products'), 'POST /api/lessons/module/:id adds lesson');
    const createdLessonId = lessonData.data?.lesson?.id;

    // Test 5: Student attempts to view lesson before enrolling -> 403
    const unauthorizedLessonRes = await fetch(`${baseUrl}/lessons/${createdLessonId}`, {
      headers: { Cookie: studentCookie },
    });
    assert(unauthorizedLessonRes.status === 403, 'GET /api/lessons/:id blocks unenrolled student with 403');

    // Test 6: Student enrolls in the newly created course
    const enrollRes = await fetch(`${baseUrl}/enrollments/${createdCourseId}`, {
      method: 'POST',
      headers: { Cookie: studentCookie },
    });
    const enrollData = await enrollRes.json();
    assert(enrollRes.status === 201 && enrollData.data?.enrollment?.status === 'ACTIVE', 'POST /api/enrollments/:courseId enrolls student');

    // Test 7: Student views lesson content after enrolling -> 200 OK
    const authorizedLessonRes = await fetch(`${baseUrl}/lessons/${createdLessonId}`, {
      headers: { Cookie: studentCookie },
    });
    const authorizedLessonData = await authorizedLessonRes.json();
    assert(authorizedLessonRes.status === 200 && authorizedLessonData.data?.lesson?.content.includes('semantic representations'), 'GET /api/lessons/:id permits enrolled student with 200 OK');

    // Test 8: Student attempts to create a module -> 403 Forbidden
    const studentModuleRes = await fetch(`${baseUrl}/modules/course/${createdCourseId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({ title: 'Illegal Student Module' }),
    });
    assert(studentModuleRes.status === 403, 'POST /api/modules rejects student with 403 Forbidden');

    // Test 9: Instructor views course roster
    const rosterRes = await fetch(`${baseUrl}/enrollments/course/${createdCourseId}`, {
      headers: { Cookie: instructorCookie },
    });
    const rosterData = await rosterRes.json();
    assert(rosterRes.status === 200 && rosterData.data?.roster?.some(r => r.user?.email === 'student@jnlms.edu'), 'GET /api/enrollments/course/:id shows student on roster');

    console.log('\n========================================');
    if (failures === 0) {
      console.log('🎉 ALL 9 PHASE 2 INTEGRATION TESTS PASSED!');
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

runPhase2Tests();
