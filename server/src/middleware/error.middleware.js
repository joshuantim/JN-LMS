import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Error Caught]:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const target = err.meta?.target ? err.meta.target.join(', ') : 'field';
    return sendError(res, `A record with this ${target} already exists.`, 409);
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return sendError(res, 'The requested resource was not found.', 404);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token has expired.', 401);
  }

  // Fallback internal server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return sendError(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? err.errors || err.stack : undefined
  );
};
