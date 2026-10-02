import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  validateStatus: () => true, // Don't throw on error status codes
});

async function runTests() {
  console.log('--- STARTING PHASE 4 INTEGRATION TESTS ---\n');
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

    // 3. Login as Admin
    const adminLogin = await client.post('/auth/login', {
      email: 'admin@jnlms.edu',
      password: 'Admin123!',
    });
    const adminCookie = adminLogin.headers['set-cookie'];
    assert(adminLogin.status === 200, 'Admin logged in');

    // Get STAT301 course ID
    const coursesRes = await client.get('/courses', {
      headers: { Cookie: instCookie },
    });
    const coursesList = coursesRes.data.data.courses || coursesRes.data.data;
    const statCourse = coursesList.find((c) => c.code === 'STAT301');
    assert(Boolean(statCourse), 'Found STAT301 course');
    const courseId = statCourse.id;

    // 4. Instructor posts an Announcement
    const annRes = await client.post('/announcements', {
      courseId,
      title: 'Midterm Review Session Scheduled',
      content: 'We will hold a live midterm review session this Friday at 4 PM on Zoom.',
      isSystemWide: false,
    }, { headers: { Cookie: instCookie } });
    assert(annRes.status === 201 && annRes.data.data.title === 'Midterm Review Session Scheduled', 'Instructor posted announcement');
    const announcementId = annRes.data.data.id;

    // 5. Student views announcements (should include the new course announcement)
    const studAnnRes = await client.get('/announcements', {
      headers: { Cookie: studentCookie },
    });
    const foundAnn = studAnnRes.data.data.find((a) => a.id === announcementId);
    assert(Boolean(foundAnn), 'Student can see course announcement in their feed');

    // 6. Student creates a Discussion Thread in STAT301
    const discRes = await client.post('/discussions', {
      courseId,
      title: 'Question regarding Chapter 3 Confidence Intervals',
      content: 'Could someone clarify when to use the t-distribution vs the standard normal z-distribution?',
    }, { headers: { Cookie: studentCookie } });
    assert(discRes.status === 201, 'Student created discussion thread');
    const discussionId = discRes.data.data.id;

    // 7. Student tries to pin discussion (should be 403 Forbidden)
    const studPinRes = await client.patch(`/discussions/${discussionId}/pin`, {}, {
      headers: { Cookie: studentCookie },
    });
    assert(studPinRes.status === 403, 'Student is forbidden from pinning discussions');

    // 8. Instructor pins discussion
    const instPinRes = await client.patch(`/discussions/${discussionId}/pin`, {}, {
      headers: { Cookie: instCookie },
    });
    assert(instPinRes.status === 200 && instPinRes.data.data.isPinned === true, 'Instructor successfully pinned discussion');

    // 9. Instructor replies to the discussion
    const replyRes = await client.post(`/discussions/${discussionId}/replies`, {
      content: 'Great question! Use the t-distribution when the population standard deviation sigma is unknown and the sample size is moderate.',
    }, { headers: { Cookie: instCookie } });
    assert(replyRes.status === 201, 'Instructor replied to student discussion thread');

    // 10. Student checks Notifications (should receive notification of the reply!)
    const notifRes = await client.get('/notifications', {
      headers: { Cookie: studentCookie },
    });
    assert(notifRes.status === 200 && notifRes.data.data.notifications.length > 0, 'Student received notifications');
    const firstNotif = notifRes.data.data.notifications[0];

    // Mark single notification as read
    const markReadRes = await client.patch(`/notifications/${firstNotif.id}/read`, {}, {
      headers: { Cookie: studentCookie },
    });
    assert(markReadRes.status === 200 && markReadRes.data.data.isRead === true, 'Student marked notification as read');

    // Mark all notifications read
    const markAllReadRes = await client.patch('/notifications/read-all', {}, {
      headers: { Cookie: studentCookie },
    });
    assert(markAllReadRes.status === 200, 'Student marked all notifications read');

    // 11. Student gets Academic Calendar events
    const calRes = await client.get('/calendar/events', {
      headers: { Cookie: studentCookie },
    });
    assert(calRes.status === 200 && Array.isArray(calRes.data.data), 'Student fetched calendar events');
    console.log(`   (Found ${calRes.data.data.length} academic calendar events for student)`);

    // 12. Instructor gets Course Analytics
    const instAnalyticsRes = await client.get('/analytics/instructor', {
      headers: { Cookie: instCookie },
    });
    assert(instAnalyticsRes.status === 200 && instAnalyticsRes.data.data.totalCourses >= 1, 'Instructor fetched course analytics');
    console.log(`   (Instructor analytics: ${instAnalyticsRes.data.data.totalStudents} active students, ${instAnalyticsRes.data.data.totalDiscussions} discussions)`);

    // 13. Student tries to access Admin Analytics (should be 403)
    const studAdminRes = await client.get('/analytics/admin', {
      headers: { Cookie: studentCookie },
    });
    assert(studAdminRes.status === 403, 'Student is forbidden from viewing admin analytics');

    // 14. Admin gets platform-wide Analytics
    const adminAnalyticsRes = await client.get('/analytics/admin', {
      headers: { Cookie: adminCookie },
    });
    assert(adminAnalyticsRes.status === 200 && adminAnalyticsRes.data.data.users.total >= 3, 'Admin retrieved platform-wide analytics');
    console.log(`   (Platform analytics: ${adminAnalyticsRes.data.data.users.total} users, ${adminAnalyticsRes.data.data.courses.total} courses)`);

  } catch (error) {
    console.error('Test execution error:', error);
    failed++;
  }

  console.log(`\n--- PHASE 4 TESTS FINISHED: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) process.exit(1);
}

runTests();
