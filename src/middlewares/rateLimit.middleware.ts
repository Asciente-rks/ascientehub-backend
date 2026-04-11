import { Request, Response, NextFunction } from "express";
import redis from "../utils/caching";

export interface RateLimitOptions {
  windowSeconds?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

const defaultOptions = (): Required<RateLimitOptions> => ({
  windowSeconds: parseInt(process.env.RATE_LIMIT_WINDOW || "60", 10),
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "60", 10),
  keyPrefix: "rl:",
});

export default function rateLimit(options?: Partial<RateLimitOptions>) {
  const opts = { ...defaultOptions(), ...(options || {}) };
  // In-memory fallback counters (used when Redis client is unavailable in tests)
  const localCounters = new Map<
    string,
    { count: number; expiresAt: number | null }
  >();

  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const ip =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        req.ip;
      const identifier = userId || ip || "unknown";

      const key = `${opts.keyPrefix}${identifier}`;

      let current: number;
      let ttl: number = -1;

      // Use Redis-like in-memory cache
      const now = Math.floor(Date.now() / 1000);
      const entry = localCounters.get(key) || { count: 0, expiresAt: null };
      if (!entry.expiresAt || entry.expiresAt <= now) {
        entry.count = 1;
        entry.expiresAt = now + opts.windowSeconds;
      } else {
        entry.count += 1;
      }
      localCounters.set(key, entry);
      current = entry.count;
      ttl = Math.max(0, (entry.expiresAt || now) - now);

      if (current > opts.maxRequests) {
        res.setHeader("Retry-After", ttl);
        return res.status(429).json({
          message: "Too many requests, please try again later.",
        });
      }

      next();
    } catch (err) {
      console.error("Rate limit middleware error:", err);
      next();
    }
  };
}
