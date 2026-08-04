import type { NextFunction, Request, Response } from 'express';
import { getClientIp } from '../../utils/clientIp.js';
import { sendSuccess, AppError } from '../../utils/response.js';
import { urlService } from './url.service.js';
import { createUrlSchema, shortCodeParamSchema, urlIdParamSchema } from './url.validation.js';

/**
 * HTTP adapters for the URL module.
 * Controllers validate input, call the service, and shape the response.
 * No business logic or direct database access lives here.
 */
export class UrlController {
  /**
   * POST /api/v1/urls
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createUrlSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten());
      }

      const result = await urlService.createUrl(parsed.data);
      sendSuccess(res, result, 201, 'URL shortened successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/urls
   */
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const urls = await urlService.listUrls();
      sendSuccess(res, urls);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/urls/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = urlIdParamSchema.safeParse(req.params);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten());
      }

      const url = await urlService.getUrlById(parsed.data.id);
      sendSuccess(res, url);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/urls/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = urlIdParamSchema.safeParse(req.params);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten());
      }

      await urlService.deleteUrl(parsed.data.id);
      sendSuccess(res, null, 200, 'URL deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /:shortCode — redirect to the original URL.
   */
  async redirect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = shortCodeParamSchema.safeParse(req.params);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten());
      }

      const clientIp = getClientIp(req);
      const originalUrl = await urlService.resolveShortCode(parsed.data.shortCode, clientIp);
      res.redirect(302, originalUrl);
    } catch (error) {
      next(error);
    }
  }
}

export const urlController = new UrlController();
