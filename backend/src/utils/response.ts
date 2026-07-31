import type { Response } from 'express';

/**
 * Standard API success envelope.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard API error envelope.
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  details?: unknown;
}

/**
 * Application-level HTTP error with optional structured details.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

/**
 * Sends a consistent success JSON response.
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string): void {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message !== undefined ? { message } : {}),
  };

  res.status(statusCode).json(body);
}

/**
 * Sends a consistent error JSON response.
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  details?: unknown,
): void {
  const body: ApiErrorResponse = {
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
  };

  res.status(statusCode).json(body);
}
