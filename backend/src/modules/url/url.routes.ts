import { Router } from 'express';
import { urlController } from './url.controller.js';

/**
 * Versioned CRUD routes for shortened URLs.
 * Mounted at /api/v1/urls
 */
const urlRouter = Router();

urlRouter.post('/', (req, res, next) => {
  void urlController.create(req, res, next);
});

urlRouter.get('/', (req, res, next) => {
  void urlController.list(req, res, next);
});

urlRouter.get('/:id', (req, res, next) => {
  void urlController.getById(req, res, next);
});

urlRouter.delete('/:id', (req, res, next) => {
  void urlController.delete(req, res, next);
});

export { urlRouter };
