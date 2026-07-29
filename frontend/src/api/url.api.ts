import { apiClient } from './axios';
import type { ApiSuccessResponse, CreateUrlPayload, CreateUrlResponse, Url } from '../types/url';

/**
 * API helpers for URL resources.
 */

export async function createShortUrl(
  payload: CreateUrlPayload,
): Promise<CreateUrlResponse> {
  const { data } = await apiClient.post<ApiSuccessResponse<CreateUrlResponse>>(
    '/api/v1/urls',
    payload,
  );
  return data.data;
}

export async function listUrls(): Promise<Url[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Url[]>>('/api/v1/urls');
  return data.data;
}

export async function getUrlById(id: number): Promise<Url> {
  const { data } = await apiClient.get<ApiSuccessResponse<Url>>(`/api/v1/urls/${id}`);
  return data.data;
}

export async function deleteUrl(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/urls/${id}`);
}
