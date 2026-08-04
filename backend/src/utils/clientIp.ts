import type { Request } from 'express';

/**
 * Normalizes IPv4-mapped IPv6 (e.g. ::ffff:1.2.3.4 → 1.2.3.4) and strips ports.
 */
export function normalizeIp(raw: string): string {
  let ip = raw.trim();

  // "[::1]:1234" or "1.2.3.4:5678"
  if (ip.startsWith('[')) {
    const end = ip.indexOf(']');
    if (end !== -1) {
      ip = ip.slice(1, end);
    }
  } else if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(ip)) {
    ip = ip.replace(/:\d+$/, '');
  }

  if (ip.toLowerCase().startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  return ip || 'unknown';
}

function headerValue(req: Request, name: string): string | undefined {
  const value = req.headers[name];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (Array.isArray(value) && value[0]?.trim()) {
    return value[0].trim();
  }
  return undefined;
}

/**
 * Resolves the real client IP behind Render (Cloudflare + load balancers).
 *
 * Prefer CF-Connecting-IP when present (set by Cloudflare on Render),
 * then leftmost X-Forwarded-For (client), then Express req.ip / socket.
 */
export function getClientIp(req: Request): string {
  const cfConnecting = headerValue(req, 'cf-connecting-ip');
  if (cfConnecting) {
    return normalizeIp(cfConnecting);
  }

  const trueClient = headerValue(req, 'true-client-ip');
  if (trueClient) {
    return normalizeIp(trueClient);
  }

  const forwarded = headerValue(req, 'x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return normalizeIp(first);
    }
  }

  const realIp = headerValue(req, 'x-real-ip');
  if (realIp) {
    return normalizeIp(realIp);
  }

  return normalizeIp(req.ip || req.socket.remoteAddress || 'unknown');
}

/**
 * Snapshot of IP-related headers for production debugging.
 */
export function getClientIpDebug(req: Request) {
  return {
    resolvedIp: getClientIp(req),
    reqIp: req.ip ?? null,
    remoteAddress: req.socket.remoteAddress ?? null,
    headers: {
      'x-forwarded-for': req.headers['x-forwarded-for'] ?? null,
      'x-real-ip': req.headers['x-real-ip'] ?? null,
      'cf-connecting-ip': req.headers['cf-connecting-ip'] ?? null,
      'true-client-ip': req.headers['true-client-ip'] ?? null,
      'cf-ray': req.headers['cf-ray'] ?? null,
    },
  };
}
