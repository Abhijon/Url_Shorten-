import { redis } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/response.js';
import { urlRepository } from './url.repository.js';
import type { CreateUrlInput, CreateUrlResult, UrlResponse } from './url.types.js';

const CACHE_TTL_SECONDS = 60 * 60 * 24;   // 24 hours
/** Ignore duplicate redirect hits from the same client within this window. */
const CLICK_DEDUPE_TTL_SECONDS = 3;

/**
 * Business logic for URL shortening.
 *
 * Create flow:
 * Client URL → PostgreSQL insert → autoincrement id → Base62 short code → update row
 *
 * Redirect flow uses Cache Aside:
 * 1. Check Redis for shortCode → originalUrl
 * 2. On miss, load from PostgreSQL via repository
 * 3. Write mapping into Redis
 * 4. Return original URL for redirect
 *
 * Creation intentionally does NOT populate the cache.
 * Click counting is deduped per shortCode + client IP for a few seconds
 * so browser retries / double GETs on deploy do not inflate counts.
 */
export class UrlService {
  async createUrl(input: CreateUrlInput): Promise<CreateUrlResult> {
    const url = await urlRepository.createWithBase62ShortCode(input.originalUrl);

    return {
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl: `${env.BASE_URL}/${url.shortCode}`,
      createdAt: url.createdAt,
    };
  }

  async listUrls(): Promise<UrlResponse[]> {
    return urlRepository.findAll();
  }

  async getUrlById(id: number): Promise<UrlResponse> {
    const url = await urlRepository.findById(id);
    if (!url) {
      throw new AppError('URL not found', 404);
    }
    return url;
  }

  async deleteUrl(id: number): Promise<void> {
    const deleted = await urlRepository.deleteById(id);
    if (!deleted) {
      throw new AppError('URL not found', 404);
    }

    try {
      await redis.del(
        this.cacheKey(deleted.shortCode),
        `cache:hits:${deleted.shortCode}`,
        `cache:misses:${deleted.shortCode}`,
      );
    } catch {
      // Cache invalidation failure should not block deletion
    }
  }

  /**
   * Resolves a short code to its original URL using Cache Aside.
   * Duplicate requests from the same client within a short window
   * still redirect, but do not increment click / hit / miss counters.
   */
  async resolveShortCode(shortCode: string, clientIp = 'unknown'): Promise<string> {
    const key = this.cacheKey(shortCode);
    const shouldCount = await this.claimClickSlot(shortCode, clientIp);

    try {
      const cached = await redis.get(key);
      if (cached) {
        if (shouldCount) {
          await redis.incr(`cache:hits:${shortCode}`).catch(() => undefined);
          await urlRepository.incrementClickCount(shortCode).catch(() => undefined);
        }
        return cached;
      }
      if (shouldCount) {
        await redis.incr(`cache:misses:${shortCode}`).catch(() => undefined);
      }
    } catch {
      // On Redis errors, fall through to PostgreSQL
    }

    const url = await urlRepository.findByShortCode(shortCode);
    if (!url) {
      throw new AppError('Short URL not found', 404);
    }

    try {
      await redis.set(key, url.originalUrl, 'EX', CACHE_TTL_SECONDS);
    } catch {
      // Cache write failure should not block redirect
    }

    if (shouldCount) {
      await urlRepository.incrementClickCount(shortCode).catch(() => undefined);
    }
    return url.originalUrl;
  }

  /**
   * Atomically claims the right to count this click for (shortCode, ip).
   * Returns true on first request in the window; false for duplicates.
   * If Redis is unavailable, fails open and counts the click.
   */
  private async claimClickSlot(shortCode: string, clientIp: string): Promise<boolean> {
    const dedupeKey = `click:dedupe:${shortCode}:${clientIp}`;
    try {
      const result = await redis.set(dedupeKey, '1', 'EX', CLICK_DEDUPE_TTL_SECONDS, 'NX');
      // ioredis: 'OK' when set, null when key already exists
      return result === 'OK';
    } catch {
      return true;
    }
  }

  private cacheKey(shortCode: string): string {
    return `url:${shortCode}`;
  }
}

export const urlService = new UrlService();
