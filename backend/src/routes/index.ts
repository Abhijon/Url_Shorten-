import { Router } from 'express';
import { urlRouter } from '../modules/url/url.routes.js';
import { urlController } from '../modules/url/url.controller.js';

/**
 * Aggregates all application routes.
 *
 * - /api/v1/urls → CRUD API
 * - /:shortCode  → redirect (Cache Aside)
 */
const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'OK' });
});
router.get('/', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server working fine' });
});
router.use('/api/v1/urls', urlRouter);

router.get('/:shortCode', (req, res, next) => {
  void urlController.redirect(req, res, next);
});

export { router };
