import { AuthService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { setAuthCookies, clearAuthCookies } from '../utils/token.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const { user, accessToken, refreshToken } = await AuthService.register(req.body);
      setAuthCookies(res, accessToken, refreshToken);
      return sendSuccess(res, { user, accessToken }, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.login({ email, password });
      setAuthCookies(res, accessToken, refreshToken);
      return sendSuccess(res, { user, accessToken }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req, res, next) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        return sendError(res, 'Refresh token not found', 401);
      }

      const { user, accessToken, refreshToken } = await AuthService.refresh(token);
      setAuthCookies(res, accessToken, refreshToken);
      return sendSuccess(res, { user, accessToken }, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res) {
    clearAuthCookies(res);
    return sendSuccess(res, null, 'Logged out successfully');
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user.id);
      return sendSuccess(res, { user }, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
