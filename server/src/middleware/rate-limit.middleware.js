import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

// Auth Rate Limiter (Brute-force protection for login / register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many authentication attempts. Please try again after 15 minutes.',
      429,
      { code: 'RATE_LIMIT_EXCEEDED', retryAfter: '15m' }
    );
  },
});

// AI Chat Rate Limiter (Prevent flooding / API exhaustion)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 25, // Limit each user / IP to 25 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'AI request rate limit reached. Please wait a moment before sending another query.',
      429,
      { code: 'AI_RATE_LIMIT_EXCEEDED', retryAfter: '60s' }
    );
  },
});

// File Upload Rate Limiter
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Max 20 file uploads per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Upload limit exceeded. Please wait a few minutes before uploading more documents.',
      429,
      { code: 'UPLOAD_RATE_LIMIT_EXCEEDED', retryAfter: '10m' }
    );
  },
});

// General API Rate Limiter
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health', // Don't rate limit health check
  handler: (req, res) => {
    return sendError(
      res,
      'Too many requests to the LMS API. Please slow down.',
      429,
      { code: 'GLOBAL_RATE_LIMIT_EXCEEDED' }
    );
  },
});
