import { sendError } from '../utils/response.js';

export const validateBody = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const formattedErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return sendError(res, 'Validation failed', 400, formattedErrors);
    }
    req.body = parsed.data;
    next();
  } catch (err) {
    next(err);
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const formattedErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return sendError(res, 'Invalid query parameters', 400, formattedErrors);
    }
    req.query = parsed.data;
    next();
  } catch (err) {
    next(err);
  }
};
