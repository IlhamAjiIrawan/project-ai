/**
 * In-memory sliding window rate limiter for Next.js API routes.
 */

interface RateLimitRecord {
  timestamps: number[];
}

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds (default: 60,000ms = 1 minute)
  maxRequests?: number; // Maximum requests allowed per window (default: 30)
}

const ipStore = new Map<string, RateLimitRecord>();

// Cleanup stale records every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipStore.entries()) {
      // Remove timestamps older than 10 minutes
      record.timestamps = record.timestamps.filter((ts) => now - ts < 600000);
      if (record.timestamps.length === 0) {
        ipStore.delete(key);
      }
    }
  }, 300000);
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfterSeconds: number;
} {
  const windowMs = options.windowMs || 60000;
  const maxRequests = options.maxRequests || 30;
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = ipStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    ipStore.set(identifier, record);
  }

  // Filter timestamps within the current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  const requestCount = record.timestamps.length;

  if (requestCount >= maxRequests) {
    const oldestTimestamp = record.timestamps[0] || now;
    const resetTime = oldestTimestamp + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));

    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetTime,
      retryAfterSeconds,
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - record.timestamps.length,
    resetTime: now + windowMs,
    retryAfterSeconds: 0,
  };
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0].trim();
    if (ip) return ip;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}
