import { useState } from 'react';
import { createShortUrl } from '../api/url.api';
import { getApiErrorMessage } from '../api/axios';
import type { CreateUrlResponse } from '../types/url';

interface UseShortenUrlResult {
  shorten: (originalUrl: string) => Promise<CreateUrlResponse | null>;
  data: CreateUrlResponse | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Hook that wraps the create-short-URL API call.
 */
export function useShortenUrl(): UseShortenUrlResult {
  const [data, setData] = useState<CreateUrlResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function shorten(originalUrl: string): Promise<CreateUrlResponse | null> {
    setLoading(true);
    setError(null);

    try {
      const result = await createShortUrl({ originalUrl });
      setData(result);
      return result;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to shorten URL'));
      return null;
    } finally {
      setLoading(false);
    }
  }

  function reset(): void {
    setData(null);
    setError(null);
    setLoading(false);
  }

  return { shorten, data, loading, error, reset };
}
