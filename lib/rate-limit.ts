
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; 
  maxRequests: number; 
}

export const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10, 
  },
  api: {
    windowMs: 60 * 1000, 
    maxRequests: 100, 
  },
  sensitive: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5, 
  },
} as const;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  if (Math.random() < 0.01) {
    cleanupExpiredEntries(now);
  }

  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
      limit: config.maxRequests,
    };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      limit: config.maxRequests,
    };
  }

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
    limit: config.maxRequests,
  };
}

function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export function getIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return `ip:${forwarded.split(",")[0].trim()}`;
  }

  if (realIp) {
    return `ip:${realIp}`;
  }

  // Fallback
  return `ip:unknown`;
}
