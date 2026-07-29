/**
 * Domain types for the URL module.
 * Prisma models remain the source of truth for persistence shape;
 * these types describe API and service contracts.
 */

export interface CreateUrlInput {
  originalUrl: string;
}

export interface UrlResponse {
  id: number;
  originalUrl: string;
  shortCode: string;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUrlResult {
  id: number;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  createdAt: Date;
}
