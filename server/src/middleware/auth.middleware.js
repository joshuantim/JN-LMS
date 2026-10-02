import { verifyAccessToken } from '../utils/token.js';
import { sendError } from '../utils/response.js';
import prisma from '../config/db.js';

export const authenticateToken = async (req, res, next) => {
  try {
    // 1. Check HTTP-only cookie first, then Authorization header fallback
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required. No token provided.', 401);
    }

    // 2. Verify token
    const decoded = verifyAccessToken(token);

    // 3. Verify user is still active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatarUrl: true,
      },
    });

    if (!user || !user.isActive) {
      return sendError(res, 'User account is inactive or no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Access token expired.', 401, { code: 'TOKEN_EXPIRED' });
    }
    return sendError(res, 'Invalid or expired token.', 401);
  }
};

export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Forbidden: Role '${req.user.role}' does not have permission to access this resource. Required: ${allowedRoles.join(', ')}`,
        403
      );
    }

    next();
  };
};

export const authenticate = authenticateToken;
export const authorize = requireRoles;
