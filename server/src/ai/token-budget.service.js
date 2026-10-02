import prisma from '../config/db.js';
import { redisConnection } from '../config/redis.js';

export const ROLE_TOKEN_LIMITS = {
  STUDENT: 50000, // 50,000 tokens / month (~37,500 words)
  INSTRUCTOR: 250000, // 250,000 tokens / month
  ADMIN: 1000000, // 1,000,000 tokens / month
};

// Blended price per 1M tokens ($0.30 / 1M tokens based on gpt-4o-mini)
const PRICE_PER_MILLION_TOKENS = 0.30;

export class TokenBudgetService {
  static getMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  static getUserRedisKey(userId) {
    return `ai:tokens:${userId}:${this.getMonthKey()}`;
  }

  /**
   * Check whether user has remaining monthly AI quota
   */
  static async checkQuota(userId, role = 'STUDENT') {
    const limit = ROLE_TOKEN_LIMITS[role] || ROLE_TOKEN_LIMITS.STUDENT;
    let currentUsage = 0;

    try {
      if (redisConnection && redisConnection.status === 'ready') {
        const val = await redisConnection.get(this.getUserRedisKey(userId));
        currentUsage = val ? parseInt(val, 10) : 0;
      }
    } catch (err) {
      console.warn('[TokenBudget] Redis read failed, falling back to 0:', err.message);
    }

    const remaining = Math.max(0, limit - currentUsage);
    const allowed = currentUsage < limit;
    const percentUsed = Math.min(100, Math.round((currentUsage / limit) * 100));

    return {
      allowed,
      currentUsage,
      limit,
      remaining,
      percentUsed,
    };
  }

  /**
   * Record token consumption for user
   */
  static async recordUsage(userId, tokensUsed = 300) {
    const safeTokens = Math.max(1, Math.round(tokensUsed));
    const key = this.getUserRedisKey(userId);

    try {
      if (redisConnection && redisConnection.status === 'ready') {
        const newTotal = await redisConnection.incrby(key, safeTokens);
        // Set 35 days TTL if newly created
        await redisConnection.expire(key, 35 * 24 * 60 * 60);
        return newTotal;
      }
    } catch (err) {
      console.warn('[TokenBudget] Redis write failed:', err.message);
    }

    return safeTokens;
  }

  /**
   * Platform-wide AI token consumption analytics for administrators
   */
  static async getPlatformUsage() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const monthKey = this.getMonthKey();
    let totalTokens = 0;
    const usersUsage = [];

    for (const u of users) {
      const key = `ai:tokens:${u.id}:${monthKey}`;
      let usage = 0;

      try {
        if (redisConnection && redisConnection.status === 'ready') {
          const val = await redisConnection.get(key);
          usage = val ? parseInt(val, 10) : 0;
        }
      } catch (err) {
        // fallback
      }

      totalTokens += usage;
      const limit = ROLE_TOKEN_LIMITS[u.role] || ROLE_TOKEN_LIMITS.STUDENT;
      const percentUsed = Math.min(100, Math.round((usage / limit) * 100));

      usersUsage.push({
        userId: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        tokensUsed: usage,
        limit,
        percentUsed,
      });
    }

    // Sort by highest token consumer first
    usersUsage.sort((a, b) => b.tokensUsed - a.tokensUsed);

    const estimatedCostUsd = parseFloat(((totalTokens / 1000000) * PRICE_PER_MILLION_TOKENS).toFixed(4));
    const activeAiUsersCount = usersUsage.filter((u) => u.tokensUsed > 0).length;

    return {
      monthKey,
      totalTokensUsed: totalTokens,
      estimatedCostUsd,
      activeAiUsersCount,
      roleLimits: ROLE_TOKEN_LIMITS,
      usersUsage,
    };
  }

  /**
   * Reset quota for a specific user
   */
  static async resetUserQuota(userId) {
    const key = this.getUserRedisKey(userId);
    try {
      if (redisConnection && redisConnection.status === 'ready') {
        await redisConnection.del(key);
      }
    } catch (err) {
      console.warn('[TokenBudget] Redis del failed:', err.message);
    }
    return { success: true, message: `Reset token quota for user ${userId}` };
  }
}

export default TokenBudgetService;
