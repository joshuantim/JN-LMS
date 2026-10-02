import axios from 'axios';
import { TokenBudgetService } from './src/ai/token-budget.service.js';

const API_BASE = 'http://localhost:5000/api';

async function runPhase8Tests() {
  console.log('====================================================');
  console.log('🧪 JN LMS — PHASE 8 PRODUCTION HARDENING & COST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Comprehensive Deep Health Check
    // -------------------------------------------------------------
    console.log('🔹 Test 1: Deep Health Check (/api/health)');
    const healthRes = await axios.get(`${API_BASE}/health`);
    assert(healthRes.status === 200, 'Health endpoint responds with 200 OK');
    assert(healthRes.data?.status === 'healthy', 'System status is healthy');
    assert(healthRes.data?.checks?.database?.includes('connected'), `Database check passed: ${healthRes.data?.checks?.database}`);
    assert(healthRes.data?.checks?.redis?.includes('ready'), `Redis check passed: ${healthRes.data?.checks?.redis}`);
    assert(healthRes.data?.checks?.pgvector === 'installed', `pgvector extension is installed: ${healthRes.data?.checks?.pgvector}`);
    assert(typeof healthRes.data?.uptimeSeconds === 'number', `Uptime reported: ${healthRes.data?.uptimeSeconds}s`);
    assert(healthRes.data?.memory?.rssMb > 0, `Memory telemetry reported: ${healthRes.data?.memory?.rssMb} MB RSS`);

    // -------------------------------------------------------------
    // Test 2: Rate Limiting Headers
    // -------------------------------------------------------------
    console.log('\n🔹 Test 2: Global API Rate Limiting Headers');
    const headers = healthRes.headers;
    const hasRateLimitHeader = headers['ratelimit-limit'] || headers['x-ratelimit-limit'] || headers['ratelimit-policy'];
    assert(!!hasRateLimitHeader, 'Rate limit headers are present on API responses');

    // -------------------------------------------------------------
    // Test 3: Authenticate Test Users (Admin & Student)
    // -------------------------------------------------------------
    console.log('\n🔹 Test 3: Authenticate Admin & Student for Quota Tests');
    const studentLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'student@jnlms.edu',
      password: 'Student123!',
    });
    const studentCookie = studentLogin.headers['set-cookie']?.[0];
    const studentUser = studentLogin.data.data.user;
    assert(!!studentCookie, 'Student logged in successfully with session cookie');

    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@jnlms.edu',
      password: 'Admin123!',
    });
    const adminCookie = adminLogin.headers['set-cookie']?.[0];
    assert(!!adminCookie, 'Admin logged in successfully');

    // -------------------------------------------------------------
    // Test 4: Token Budget Calculation & Recording
    // -------------------------------------------------------------
    console.log('\n🔹 Test 4: AI Token Budget Check & Usage Recording');
    // Reset student quota first to ensure a clean state
    await TokenBudgetService.resetUserQuota(studentUser.id);
    const initialQuota = await TokenBudgetService.checkQuota(studentUser.id, 'STUDENT');
    assert(initialQuota.allowed === true, 'Student starts with available AI quota');
    assert(initialQuota.limit === 50000, `Student monthly limit is 50,000 tokens (actual: ${initialQuota.limit})`);
    assert(initialQuota.currentUsage === 0, `Initial usage is 0 tokens (actual: ${initialQuota.currentUsage})`);

    // Record some token usage
    await TokenBudgetService.recordUsage(studentUser.id, 1500);
    const updatedQuota = await TokenBudgetService.checkQuota(studentUser.id, 'STUDENT');
    assert(updatedQuota.currentUsage >= 1500, `Usage accurately incremented to ${updatedQuota.currentUsage} tokens`);
    assert(updatedQuota.remaining === 50000 - updatedQuota.currentUsage, `Remaining balance updated: ${updatedQuota.remaining}`);

    // Check user /api/ai/quota endpoint
    const userQuotaRes = await axios.get(`${API_BASE}/ai/quota`, {
      headers: { Cookie: studentCookie },
    });
    assert(userQuotaRes.data.success === true, 'Student can query personal AI quota');
    assert(userQuotaRes.data.data.limit === 50000, 'Student quota limit reflected via API');

    // -------------------------------------------------------------
    // Test 5: Quota Enforcement Middleware (HTTP 429 when budget exceeded)
    // -------------------------------------------------------------
    console.log('\n🔹 Test 5: AI Token Quota Exhaustion & Hard Enforcement (429)');
    // Push student usage beyond the 50,000 limit
    await TokenBudgetService.recordUsage(studentUser.id, 55000);

    let quotaBlocked = false;
    try {
      await axios.post(
        `${API_BASE}/ai/chat`,
        { message: 'What is Bayes theorem in statistics?' },
        { headers: { Cookie: studentCookie } }
      );
    } catch (err) {
      if (err.response?.status === 429) {
        quotaBlocked = true;
        assert(true, `Exceeded quota correctly rejected with HTTP 429 Too Many Requests: "${err.response.data?.message}"`);
      } else {
        console.error('Unexpected error status:', err.response?.status);
      }
    }
    assert(quotaBlocked, 'AI request blocked when monthly budget exceeded');

    // -------------------------------------------------------------
    // Test 6: Admin Quota Reset & Unblocking
    // -------------------------------------------------------------
    console.log('\n🔹 Test 6: Admin AI Quota Reset Action');
    const resetRes = await axios.post(
      `${API_BASE}/admin/ai-usage/reset/${studentUser.id}`,
      {},
      { headers: { Cookie: adminCookie } }
    );
    assert(resetRes.status === 200 && resetRes.data.success === true, 'Admin successfully reset user token quota');

    const resetQuotaCheck = await TokenBudgetService.checkQuota(studentUser.id, 'STUDENT');
    assert(resetQuotaCheck.currentUsage === 0, 'User usage reset back to 0');
    assert(resetQuotaCheck.allowed === true, 'User is allowed to use AI again after admin reset');

    // -------------------------------------------------------------
    // Test 7: Admin AI Usage Analytics & RBAC Security
    // -------------------------------------------------------------
    console.log('\n🔹 Test 7: Admin AI Analytics Platform Report & RBAC');
    // Admin access
    const adminAnalyticsRes = await axios.get(`${API_BASE}/admin/ai-usage`, {
      headers: { Cookie: adminCookie },
    });
    assert(adminAnalyticsRes.status === 200, 'Admin can retrieve platform AI usage analytics');
    assert(typeof adminAnalyticsRes.data.data.totalTokensUsed === 'number', 'Total platform tokens reported');
    assert(typeof adminAnalyticsRes.data.data.estimatedCostUsd === 'number', `Estimated cost reported: $${adminAnalyticsRes.data.data.estimatedCostUsd}`);
    assert(Array.isArray(adminAnalyticsRes.data.data.usersUsage), `User usage breakdown array provided (${adminAnalyticsRes.data.data.usersUsage.length} users)`);

    // Student access attempt to Admin AI route (should be 403 Forbidden)
    let studentForbidden = false;
    try {
      await axios.get(`${API_BASE}/admin/ai-usage`, {
        headers: { Cookie: studentCookie },
      });
    } catch (err) {
      if (err.response?.status === 403) {
        studentForbidden = true;
      }
    }
    assert(studentForbidden, 'Non-admin (Student) blocked from Admin AI Usage with HTTP 403 Forbidden');

  } catch (err) {
    console.error('Fatal test error:', err.response?.data || err.message);
  }

  console.log('\n====================================================');
  console.log(`🎯 PHASE 8 TEST RESULTS: ${passed}/${total} assertions passed`);
  console.log('====================================================');

  if (passed === total && total > 0) {
    console.log('🚀 PHASE 8 PRODUCTION HARDENING VERIFICATION: PASSED\n');
  } else {
    console.log('⚠️ Some Phase 8 assertions failed.\n');
  }
}

runPhase8Tests();
