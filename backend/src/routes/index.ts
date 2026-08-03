import { Router } from 'express';
import { slidingWindowRateLimit } from '../middleware/rateLimit.middleware.js';
import { urlRouter } from '../modules/url/url.routes.js';
import { urlController } from '../modules/url/url.controller.js';

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
router.use('/api/v1/urls', urlRouter);

router.get('/:shortCode', redirectLimiter, (req, res, next) => {
    console.log('Redirect route:', req.originalUrl);
  console.log('Short code:', req.params.shortCode);
  void urlController.redirect(req, res, next);
});

export { router };
