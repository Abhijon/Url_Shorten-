import { Router } from 'express';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { DEBUG_EVENTS_KEY } from '../middleware/rateLimit.middleware.js';
import { getClientIpDebug } from '../utils/clientIp.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Production-friendly debug routes (no Render log access on free tier).
 * Mounted at /debug — open, no auth (intentional for free-tier debugging).
 */
const debugRouter = Router();

/**
 * GET /debug/rate-limit
 *
 * Returns:
 * - how this request's client IP was resolved (headers vs proxy)
 * - active rl:* Redis keys with counts + TTLs
 * - recent 429 rate-limit events
 */
debugRouter.get('/rate-limit', async (req, res, next) => {
  try {
    const ipDebug = getClientIpDebug(req);

    const keys = await redis.keys('rl:*');
    const buckets = await Promise.all(
      keys
        .filter((key) => key !== DEBUG_EVENTS_KEY)
        .sort()
        .map(async (key) => {
          const [count, ttl] = await Promise.all([redis.zcard(key), redis.ttl(key)]);
          return { key, count, ttlSeconds: ttl };
        }),
    );

    const rawEvents = await redis.lrange(DEBUG_EVENTS_KEY, 0, 49);
    const recentEvents = rawEvents.map((entry) => {
      try {
        return JSON.parse(entry) as unknown;
      } catch {
        return { raw: entry };
      }
    });

    sendSuccess(res, {
      clientIp: ipDebug,
      trustProxy: req.app.get('trust proxy'),
      nodeEnv: env.NODE_ENV,
      rateLimitBuckets: buckets,
      recentRateLimitEvents: recentEvents,
      notes: [
        'resolvedIp should be your public IP, not a 10.x Render internal address',
        'rateLimitBuckets lists active sliding-window keys in Redis',
        'recentRateLimitEvents lists the last 429s (up to 50, TTL 1h)',
      ],
    });
  } catch (error) {
    next(error);
  }
});

export { debugRouter };
