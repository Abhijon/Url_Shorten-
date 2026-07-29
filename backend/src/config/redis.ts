import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Shared Redis client for cache-aside lookups of shortCode → originalUrl.
 * Retries are capped so a missing Redis does not spam the logs forever.
 */
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  let warnedOffline = false;

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 3) {
        if (!warnedOffline) {
          logger.warn('Redis unavailable — continuing without cache');
          warnedOffline = true;
        }
        return null;
      }
      return Math.min(times * 200, 1000);
    },
  });

  client.on('error', (error: Error) => {
    if (!warnedOffline) {
      logger.error('Redis connection error', error.message);
    }
  });

  client.on('connect', () => {
    warnedOffline = false;
    logger.info('Redis connected');
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
