import { prisma } from '../../config/prisma.js';
import { generateShortCode } from '../../utils/generateShortCode.js';
import type { UrlResponse } from './url.types.js';

/**
 * Data-access layer for Url entities.
 * Talks only to Prisma / PostgreSQL — no HTTP or cache concerns.
 */
export class UrlRepository {
  /**
   * Create flow (ID → Base62):
   * 1. Insert originalUrl (PostgreSQL assigns autoincrement id)
   * 2. Encode id with Base62
   * 3. Persist shortCode on the same row
   */
  async createWithBase62ShortCode(originalUrl: string): Promise<UrlResponse> {
    return prisma.$transaction(async (tx) => {
      const created = await tx.url.create({
        data: { originalUrl },
      });

      const shortCode = generateShortCode(created.id);

      const updated = await tx.url.update({
        where: { id: created.id },
        data: { shortCode },
      });

      return this.toUrlResponse(updated);
    });
  }

  async findAll(): Promise<UrlResponse[]> {
    const urls = await prisma.url.findMany({
      where: { shortCode: { not: null } },
      orderBy: { createdAt: 'desc' },
    });

    return urls.map((url) => this.toUrlResponse(url));
  }

  async findById(id: number): Promise<UrlResponse | null> {
    const url = await prisma.url.findUnique({ where: { id } });
    if (!url || url.shortCode === null) {
      return null;
    }
    return this.toUrlResponse(url);
  }

  async findByShortCode(shortCode: string): Promise<UrlResponse | null> {
    const url = await prisma.url.findUnique({ where: { shortCode } });
    if (!url || url.shortCode === null) {
      return null;
    }
    return this.toUrlResponse(url);
  }

  async deleteById(id: number): Promise<UrlResponse | null> {
    const existing = await prisma.url.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }

    const deleted = await prisma.url.delete({ where: { id } });
    if (deleted.shortCode === null) {
      return null;
    }
    return this.toUrlResponse(deleted);
  }

  async incrementClickCount(shortCode: string): Promise<void> {
    await prisma.url.update({
      where: { shortCode },
      data: { clickCount: { increment: 1 } },
    });
  }

  private toUrlResponse(url: {
    id: number;
    originalUrl: string;
    shortCode: string | null;
    clickCount: number;
    createdAt: Date;
    updatedAt: Date;
  }): UrlResponse {
    if (url.shortCode === null) {
      throw new Error(`URL ${url.id} is missing a shortCode`);
    }

    return {
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      clickCount: url.clickCount,
      createdAt: url.createdAt,
      updatedAt: url.updatedAt,
    };
  }
}

export const urlRepository = new UrlRepository();
