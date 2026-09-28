/**
 * Sliding window rate limiter untuk Next.js API routes.
 *
 * - Production (Vercel): menggunakan Upstash Redis agar rate limit
 *   berfungsi lintas serverless instances.
 * - Development / fallback: menggunakan in-memory Map jika env vars
 *   Upstash tidak dikonfigurasi.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Upstash Redis Rate Limiter (Production) ─────────────────────────────────

let upstashRatelimit: Ratelimit | null = null;

function getUpstashRatelimit(): Ratelimit | null {
  if (upstashRatelimit) return upstashRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Env vars belum diset — gunakan fallback in-memory (local dev)
    return null;
  }

  try {
    const redis = new Redis({ url, token });
    upstashRatelimit = new Ratelimit({
      redis,
      // Sliding window: 30 request per 60 detik per identifier
      limiter: Ratelimit.slidingWindow(30, '60 s'),
      prefix: 'rp_rl', // Namespace key di Redis
      analytics: false,
    });
    return upstashRatelimit;
  } catch (err) {
    console.warn('[RateLimit] Gagal inisialisasi Upstash Redis, fallback ke in-memory:', err);
    return null;
  }
}

// ─── In-Memory Fallback (Local Dev) ──────────────────────────────────────────

interface RateLimitRecord {
  timestamps: number[];
}

const ipStore = new Map<string, RateLimitRecord>();

// Cleanup stale records setiap 5 menit untuk mencegah memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 600000);
      if (record.timestamps.length === 0) {
        ipStore.delete(key);
      }
    }
  }, 300000);
}

function checkRateLimitInMemory(
  identifier: string,
  windowMs: number,
  maxRequests: number
): { success: boolean; remaining: number; resetTime: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = ipStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    ipStore.set(identifier, record);
  }

  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
  const requestCount = record.timestamps.length;

  if (requestCount >= maxRequests) {
    const oldestTimestamp = record.timestamps[0] || now;
    const resetTime = oldestTimestamp + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));
    return { success: false, remaining: 0, resetTime, retryAfterSeconds };
  }

  record.timestamps.push(now);
  return {
    success: true,
    remaining: maxRequests - record.timestamps.length,
    resetTime: now + windowMs,
    retryAfterSeconds: 0,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

interface RateLimitOptions {
  windowMs?: number;    // default: 60_000 ms
  maxRequests?: number; // default: 30
}

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfterSeconds: number;
}> {
  const windowMs = options.windowMs ?? 60000;
  const maxRequests = options.maxRequests ?? 30;

  // Coba Upstash Redis terlebih dahulu
  const rl = getUpstashRatelimit();
  if (rl) {
    try {
      const result = await rl.limit(identifier);
      const retryAfterSeconds = result.success
        ? 0
        : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.reset,
        retryAfterSeconds,
      };
    } catch (err) {
      // Jika Redis error (misal: quota habis), fail-open agar user tetap bisa pakai app
      console.error('[RateLimit] Upstash error, fail-open:', err);
      return {
        success: true,
        limit: maxRequests,
        remaining: 1,
        resetTime: Date.now() + windowMs,
        retryAfterSeconds: 0,
      };
    }
  }

  // Fallback ke in-memory (local dev)
  const result = checkRateLimitInMemory(identifier, windowMs, maxRequests);
  return { limit: maxRequests, ...result };
}

// ─── IP Extraction ────────────────────────────────────────────────────────────

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
