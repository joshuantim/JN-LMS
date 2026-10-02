import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Render provides a single REDIS_URL (rediss://...) with TLS.
// Local Docker dev uses individual REDIS_HOST / REDIS_PORT.
const getRedisConfig = () => {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    return {
      // Parse the full URL (handles rediss:// TLS and redis:// plain)
      lazyConnect: false,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    };
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  };
};

// Pass the URL string directly when available (ioredis parses it automatically)
export const redisConnection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, getRedisConfig())
  : new IORedis(getRedisConfig());

redisConnection.on('connect', () => {
  console.log('✓ Successfully connected to Redis');
});

redisConnection.on('error', (err) => {
  console.warn('⚠ Redis connection warning:', err.message);
});

export default redisConnection;

