import { redis } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/response.js';
import { urlRepository } from './url.repository.js';
import type { CreateUrlInput, CreateUrlResult, UrlResponse } from './url.types.js';

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

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
        `cache:misses:${deleted.shortCode}`
      );
    } catch {
      // Cache invalidation failure should not block deletion
    }
  }

  /**
   * Resolves a short code to its original URL using Cache Aside.
   */
  async resolveShortCode(shortCode: string): Promise<string> {
    const key = this.cacheKey(shortCode);

    try {
      const cached = await redis.get(key);
      if (cached) {
        await redis.incr(`cache:hits:${shortCode}`).catch(() => undefined);
        await urlRepository.incrementClickCount(shortCode).catch(() => undefined);
        return cached;
      }
      await redis.incr(`cache:misses:${shortCode}`).catch(() => undefined);
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

    await urlRepository.incrementClickCount(shortCode).catch(() => undefined);
    return url.originalUrl;
  }

  private cacheKey(shortCode: string): string {
    return `url:${shortCode}`;
  }
}

export const urlService = new UrlService();
