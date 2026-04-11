import Redis from "ioredis";
import "dotenv/config";
import { EventEmitter } from "events";

const useRealRedis = process.env.USE_REAL_REDIS === "true";
const isTest = process.env.NODE_ENV === "test";

let redis: any;

if (isTest && !useRealRedis) {
  class MockRedis extends EventEmitter {
    private store: Record<string, string> = {};
    private ttlMap: Record<string, number> = {};

    constructor() {
      super();
      process.nextTick(() => this.emit("connect"));
    }

    async get(key: string) {
      // lazy expire check
      const exp = this.ttlMap[key];
      if (exp && Math.floor(Date.now() / 1000) >= exp) {
        delete this.store[key];
        delete this.ttlMap[key];
        return null;
      }
      return this.store[key] ?? null;
    }

    async set(key: string, value: string, mode?: string, duration?: number) {
      this.store[key] = value;
      if ((mode === "EX" || mode === "PX") && typeof duration === "number") {
        const seconds = mode === "EX" ? duration : Math.ceil(duration / 1000);
        this.ttlMap[key] = Math.floor(Date.now() / 1000) + seconds;
      }
      return "OK";
    }

    async incr(key: string) {
      const val = parseInt(this.store[key] || "0", 10) + 1;
      this.store[key] = String(val);
      return val;
    }

    async expire(key: string, seconds: number) {
      if (this.store[key] == null) return 0;
      this.ttlMap[key] = Math.floor(Date.now() / 1000) + seconds;
      return 1;
    }

    async ttl(key: string) {
      if (!(key in this.store)) return -2;
      if (!(key in this.ttlMap)) return -1;
      const ttl = this.ttlMap[key] - Math.floor(Date.now() / 1000);
      return ttl >= 0 ? ttl : -2;
    }

    async disconnect() {
      this.removeAllListeners();
      return;
    }
  }

  redis = new MockRedis();
} else {
  redis = new Redis({
    host: process.env.REDIS_HOST, // Redis host
    port: parseInt(process.env.REDIS_PORT || "6379"), // Redis port
    username: process.env.REDIS_USERNAME, // Redis username
    password: process.env.REDIS_PASSWORD, // Redis password
  });

  redis.on("connect", () => {
    console.log("Connected to Redis");
  });

  redis.on("error", (err: Error) => {
    console.error("Redis connection error:", err);
  });
}

export default redis;
