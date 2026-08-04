import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { slidingWindowRateLimit } from '../middleware/rateLimit.middleware.js';
import { urlRouter } from '../modules/url/url.routes.js';
import { urlController } from '../modules/url/url.controller.js';
import { shortCodeParamSchema } from '../modules/url/url.validation.js';
import { sendError } from '../utils/response.js';
import { debugRouter } from './debug.routes.js';

/**
 * Rejects non-short-code paths (e.g. /favicon.ico, /robots.txt, crawler probes)
 * before the rate limiter runs, so they never create Redis keys.
 */
function shortCodeGuard(req: Request, res: Response, next: NextFunction): void {
  const parsed = shortCodeParamSchema.safeParse(req.params);
  if (!parsed.success) {
    sendError(res, 'Not found', 404);
    return;
  }
  next();
}

/**
 * Aggregates all application routes.
 *
 * - /api/v1/urls → CRUD API
 * - /:shortCode  → redirect (Cache Aside)
 */
const router = Router();

const redirectLimiter = slidingWindowRateLimit({
  prefix: 'rl:urls:redirect',
  windowSeconds: 60,
  maxRequests: 120,
});

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'healthy' });
});
router.get('/', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server working fine' });
});
router.use('/debug', debugRouter);
router.use('/api/v1/urls', urlRouter);

router.get('/:shortCode', shortCodeGuard, redirectLimiter, (req, res, next) => {
  void urlController.redirect(req, res, next);
});

export { router };
