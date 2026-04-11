import { Request, Response, NextFunction } from "express";
import redis from "../utils/redis";

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

      // Use Redis when available and supports incr
      if (redis && typeof redis.incr === "function") {
        current = await redis.incr(key);
        if (current === 1 && typeof redis.expire === "function") {
          await redis.expire(key, opts.windowSeconds);
        }
        if (typeof redis.ttl === "function") {
          ttl = await redis.ttl(key);
        }
      } else {
        // Local in-memory fallback (per-process)
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
      }

      const remaining = Math.max(0, opts.maxRequests - current);

      res.setHeader("X-RateLimit-Limit", String(opts.maxRequests));
      res.setHeader("X-RateLimit-Remaining", String(remaining));
      res.setHeader("X-RateLimit-Reset", String(ttl));

      if (current > opts.maxRequests) {
        res.setHeader("Retry-After", String(ttl));
        return res.status(429).json({ message: "Too Many Requests" });
      }

      return next();
    } catch (err) {
      // Fail-open: don't block requests if rate limiter errors
      console.error("Rate limiter error:", err);
      return next();
    }
  };
}
