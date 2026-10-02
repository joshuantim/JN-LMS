import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
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

export const redisConnection = new IORedis(redisConfig);

redisConnection.on('connect', () => {
  console.log('✓ Successfully connected to Redis');
});

redisConnection.on('error', (err) => {
  console.warn('⚠ Redis connection warning:', err.message);
});

export default redisConnection;
