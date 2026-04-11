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

  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      // Prefer authenticated user id when available, otherwise fall back to IP
      const userId = (req as any).user?.id;
      const ip =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        req.ip;
      const identifier = userId || ip || "unknown";

      const key = `${opts.keyPrefix}${identifier}`;

      // Increment the counter for this key
      const current = await redis.incr(key);

      // If this is the first increment, set the expiration for the window
      if (current === 1) {
        await redis.expire(key, opts.windowSeconds);
      }

      const ttl = await redis.ttl(key);
      const remaining = Math.max(0, opts.maxRequests - current);

      // Set standard rate-limit headers
      res.setHeader("X-RateLimit-Limit", String(opts.maxRequests));
      res.setHeader("X-RateLimit-Remaining", String(remaining));
      res.setHeader("X-RateLimit-Reset", String(ttl));

      if (current > opts.maxRequests) {
        // Inform client when to retry
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
