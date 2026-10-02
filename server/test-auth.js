import app from './src/app.js';
import prisma from './src/config/db.js';

let server;

async function runTests() {
  console.log('🧪 Starting Phase 1 Integration Tests...');

  const PORT = 5055;
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
    // Test 1: Healthcheck
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success, 'GET /api/health returns 200 OK');

    // Test 2: Login as Student
    const studentLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@jnlms.edu', password: 'Student123!' }),
    });
    const studentData = await studentLogin.json();
    assert(studentLogin.status === 200 && studentData.data?.user?.role === 'STUDENT', 'POST /api/auth/login succeeds for STUDENT role');

    // Extract student cookie
    const studentCookie = studentLogin.headers.get('set-cookie');
    assert(studentCookie && studentCookie.includes('accessToken='), 'HTTP-only accessToken cookie is issued');

    // Test 3: Login as Admin
    const adminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@jnlms.edu', password: 'Admin123!' }),
    });
    const adminData = await adminLogin.json();
    assert(adminLogin.status === 200 && adminData.data?.user?.role === 'ADMIN', 'POST /api/auth/login succeeds for ADMIN role');

    const adminCookie = adminLogin.headers.get('set-cookie');

    // Test 4: Auth me endpoint
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: studentCookie },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.data?.user?.email === 'student@jnlms.edu', 'GET /api/auth/me returns student profile using cookie');

    // Test 5: Role-based authorization - Student attempting Admin route
    const forbiddenRes = await fetch(`${baseUrl}/users`, {
      headers: { Cookie: studentCookie },
    });
    assert(forbiddenRes.status === 403, 'GET /api/users rejects STUDENT with 403 Forbidden');

    // Test 6: Role-based authorization - Admin accessing Admin route
    const adminUsersRes = await fetch(`${baseUrl}/users`, {
      headers: { Cookie: adminCookie },
    });
    const adminUsersData = await adminUsersRes.json();
    assert(adminUsersRes.status === 200 && Array.isArray(adminUsersData.data?.users), 'GET /api/users permits ADMIN with 200 OK');

    // Test 7: Invalid credentials rejection
    const badLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@jnlms.edu', password: 'WrongPassword999!' }),
    });
    assert(badLogin.status === 401, 'POST /api/auth/login rejects invalid password with 401');

    console.log('\n========================================');
    if (failures === 0) {
      console.log('🎉 ALL 7 INTEGRATION TESTS PASSED!');
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

runTests();
