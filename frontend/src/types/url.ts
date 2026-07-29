export interface Url {
  id: number;
  originalUrl: string;
  shortCode: string;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUrlPayload {
  originalUrl: string;
}

export interface CreateUrlResponse {
  id: number;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  createdAt: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  details?: unknown;
}
