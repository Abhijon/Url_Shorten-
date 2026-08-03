import { Router } from 'express';
import { slidingWindowRateLimit } from '../../middleware/rateLimit.middleware.js';
import { urlController } from './url.controller.js';

/**
 * Versioned CRUD routes for shortened URLs.
 * Mounted at /api/v1/urls
 */
const urlRouter = Router();

const writeLimiter = slidingWindowRateLimit({
  prefix: 'rl:urls:write',
  windowSeconds: 60,
  maxRequests: 20,
});

const listLimiter = slidingWindowRateLimit({
  prefix: 'rl:urls:list',
  windowSeconds: 60,
  maxRequests: 5,
});

urlRouter.post('/', writeLimiter, (req, res, next) => {
  void urlController.create(req, res, next);
});

urlRouter.get('/', listLimiter, (req, res, next) => {
  void urlController.list(req, res, next);
});

urlRouter.get('/:id', (req, res, next) => {
  void urlController.getById(req, res, next);
});

urlRouter.delete('/:id', writeLimiter, (req, res, next) => {
  void urlController.delete(req, res, next);
});

export { urlRouter };
