import { TokenBudgetService } from '../ai/token-budget.service.js';
import { sendSuccess } from '../utils/response.js';

export class AdminAIController {
  /**
   * Get platform-wide AI token analytics, cost projections, and per-user consumption
   */
  static async getUsageAnalytics(req, res, next) {
    try {
      const stats = await TokenBudgetService.getPlatformUsage();
      return sendSuccess(res, stats, 'Platform AI usage analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset a specific user's monthly AI token quota
   */
  static async resetQuota(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await TokenBudgetService.resetUserQuota(userId);
      return sendSuccess(res, result, `User AI quota reset successfully`);
    } catch (error) {
      next(error);
    }
  }
}

export default AdminAIController;
