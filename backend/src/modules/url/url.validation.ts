import { z } from 'zod';

/**
 * Request validation schemas for the URL module.
 * Controllers parse/validate input before calling the service layer.
 */

export const createUrlSchema = z.object({
  originalUrl: z.string().min(1, 'originalUrl is required').url('originalUrl must be a valid URL'),
});

export const urlIdParamSchema = z.object({
  id: z.coerce.number().int().positive('id must be a positive integer'),
});

export const shortCodeParamSchema = z.object({
  shortCode: z
    .string()
    .min(1, 'shortCode is required')
    .max(16, 'shortCode is too long')
    .regex(/^[0-9a-zA-Z]+$/, 'shortCode must be a Base62 string'),
});

export type CreateUrlDto = z.infer<typeof createUrlSchema>;
export type UrlIdParamDto = z.infer<typeof urlIdParamSchema>;
export type ShortCodeParamDto = z.infer<typeof shortCodeParamSchema>;
