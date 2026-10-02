import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import courseRoutes from './routes/course.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import moduleRoutes from './routes/module.routes.js';
import lessonRoutes from './routes/lesson.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import questionRoutes from './routes/question.routes.js';
import attemptRoutes from './routes/attempt.routes.js';
import gradebookRoutes from './routes/gradebook.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import discussionRoutes from './routes/discussion.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import documentRoutes from './routes/document.routes.js';
import aiRoutes from './routes/ai.routes.js';
import adminAiRoutes from './routes/admin-ai.routes.js';
import path from 'path';
import prisma from './config/db.js';
import { redisConnection } from './config/redis.js';
import { generalApiLimiter } from './middleware/rate-limit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { sendError, sendSuccess } from './utils/response.js';

dotenv.config();

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global API rate limiting
app.use('/api', generalApiLimiter);

// Comprehensive Deep Health Check endpoint
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  const checks = {
    database: 'unknown',
    redis: 'unknown',
    pgvector: 'unknown',
  };

  try {
    const dbStart = Date.now();
    await prisma.$queryRawUnsafe('SELECT 1');
    checks.database = `connected (${Date.now() - dbStart}ms)`;
  } catch (err) {
    checks.database = `disconnected: ${err.message}`;
  }

  try {
    if (redisConnection && redisConnection.status === 'ready') {
      const redisStart = Date.now();
      await redisConnection.ping();
      checks.redis = `ready (${Date.now() - redisStart}ms)`;
    } else {
      checks.redis = `inactive (status: ${redisConnection?.status || 'disconnected'})`;
    }
  } catch (err) {
    checks.redis = `error: ${err.message}`;
  }

  try {
    const vectorExt = await prisma.$queryRawUnsafe("SELECT extname FROM pg_extension WHERE extname = 'vector'");
    checks.pgvector = vectorExt && vectorExt.length > 0 ? 'installed' : 'missing';
  } catch (err) {
    checks.pgvector = 'unknown';
  }

  const isHealthy = checks.database.startsWith('connected');
  const memoryUsage = process.memoryUsage();

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    message: isHealthy ? 'JN LMS API is healthy and operational' : 'System degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: Date.now() - startTime,
    checks,
    memory: {
      rssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
      heapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
    },
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Serve uploaded documents statically
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/grades', gradebookRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin/ai-usage', adminAiRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
