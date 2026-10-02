/**
 * In-Memory Sliding Window Rate Limiter untuk Keamanan Server
 * Melindungi endpoint sensitif dari Brute-Force, DoS, Flooding, dan Quota-Draining.
 */

interface RateLimitRecord {
  timestamps: number[];
  blockedUntil?: number;
}

class MemoryRateLimiter {
  private cache = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Jalankan pembersihan berkala setiap 5 menit agar memori tidak bocor
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Periksa apakah request dengan `key` masih dalam batas toleransi
   * @param key Identifier unik (misal: IP address atau IP + rute)
   * @param maxRequests Jumlah maksimal request yang diizinkan dalam jendela waktu
   * @param windowMs Durasi jendela waktu dalam milidetik
   * @param blockDurationMs Opsi memblokir IP jika melebihi batas (default 1 menit)
   */
  public check(
    key: string,
    maxRequests: number,
    windowMs: number,
    blockDurationMs = 60 * 1000
  ): { allowed: boolean; remaining: number; resetMs: number; retryAfterSec?: number } {
    const now = Date.now();
    let record = this.cache.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.cache.set(key, record);
    }

    // Jika sedang dalam masa hukuman pemblokiran
    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfterSec = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetMs: record.blockedUntil - now,
        retryAfterSec,
      };
    }

    // Bersihkan timestamp di luar jendela waktu (sliding window)
    const windowStart = now - windowMs;
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    // Cek batas request
    if (record.timestamps.length >= maxRequests) {
      record.blockedUntil = now + blockDurationMs;
      const retryAfterSec = Math.ceil(blockDurationMs / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetMs: blockDurationMs,
        retryAfterSec,
      };
    }

    // Catat request baru
    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - record.timestamps.length),
      resetMs: windowMs,
    };
  }

  /**
   * Bersihkan data usang dari memory
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.cache.entries()) {
      if (record.blockedUntil && record.blockedUntil > now) continue;
      if (record.timestamps.length === 0 || record.timestamps[record.timestamps.length - 1] < now - 15 * 60 * 1000) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Reset data limiter untuk key tertentu (misal setelah login berhasil)
   */
  public reset(key: string) {
    this.cache.delete(key);
  }
}

// Global singleton instance
const globalLimiter = new MemoryRateLimiter();

export const rateLimiter = globalLimiter;

/**
 * Helper untuk mengambil client IP address dari request headers
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  return "127.0.0.1";
}
