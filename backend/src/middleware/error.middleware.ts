import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/response.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Centralized Express error-handling middleware.
 * Must be registered after all routes.
 */
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.details);
    return;
  }

  logger.error('Unhandled error', err);

  const message = env.NODE_ENV === 'production' ? getErrorMessage(err) : getErrorMessage(err);

  sendError(res, message, 500);
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return 'Internal server error';
}
