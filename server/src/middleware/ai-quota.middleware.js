import { TokenBudgetService } from '../ai/token-budget.service.js';

/**
 * Middleware that validates if user has remaining monthly AI token budget
 */
export const enforceAiQuota = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for AI features',
      });
    }

    const quota = await TokenBudgetService.checkQuota(req.user.id, req.user.role);

    if (!quota.allowed) {
      return res.status(429).json({
        success: false,
        message: `Monthly AI token limit reached (${quota.limit.toLocaleString()} tokens). Contact your instructor or administrator for a quota extension.`,
        data: {
          quota,
        },
      });
    }

    req.aiQuota = quota;
    next();
  } catch (error) {
    console.error('[AIQuotaMiddleware] Error checking quota:', error);
    // On unexpected error, fail open or log warning so LMS learning is not hard-blocked
    next();
  }
};

export default enforceAiQuota;
