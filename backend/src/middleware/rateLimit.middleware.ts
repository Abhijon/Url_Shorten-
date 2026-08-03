import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { redis } from '../config/redis.js';
import { AppError } from '../utils/response.js';

type RateLimitOptions = {
  /** Redis key prefix, e.g. rl:urls:write */
  prefix: string;
  /** Sliding window length in seconds */
  windowSeconds: number;
  /** Max allowed requests in the window per IP */
  maxRequests: number;
};

/**
 * Sliding-window rate limiter backed by a Redis sorted set.
 *
 * Flow per request:
 * 1. Drop timestamps older than now - window
 * 2. Count remaining entries
 * 3. If over limit → 429 + Retry-After
 * 4. Else ZADD current timestamp, EXPIRE key, allow
 *
 * Fails open if Redis is unavailable so the API stays reachable.
 */
export function slidingWindowRateLimit(options: RateLimitOptions) {
  const { prefix, windowSeconds, maxRequests } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip ?? 'unknown';
    const key = `${prefix}:${ip}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const member = `${now}-${randomUUID()}`;

    try {
      // Remove requests that fell outside the sliding window
      await redis.zremrangebyscore(key, 0, windowStart);

      const count = await redis.zcard(key);

      if (count >= maxRequests) {
        const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        const oldestTs = oldest[1] ? Number(oldest[1]) : now;
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((oldestTs + windowSeconds * 1000 - now) / 1000),
        );

        res.setHeader('Retry-After', String(retryAfterSeconds));
        res.setHeader('X-RateLimit-Limit', String(maxRequests));
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', String(retryAfterSeconds));

        next(
          new AppError('Too many requests', 429, {
            retryAfter: retryAfterSeconds,
          }),
        );
        return;
      }

      await redis.zadd(key, now, member);
      await redis.expire(key, windowSeconds);

      const remaining = Math.max(0, maxRequests - count - 1);
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Reset', String(windowSeconds));

      next();
    } catch {
      // Redis down — do not block the request
      next();
    }
  };
}
