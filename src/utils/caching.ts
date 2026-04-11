import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 3600 }); // Cache items for 1 hour

// Mock Redis-like interface
const redis = {
  get: async (key: string) => {
    return cache.get(key);
  },
  set: async (key: string, value: any, mode: string, ttl: number) => {
    if (mode === "EX") {
      cache.set(key, value, ttl);
    } else {
      cache.set(key, value);
    }
  },
  del: async (key: string) => {
    cache.del(key);
  },
  on: (event: string, callback: () => void) => {
    if (event === "connect") {
      process.nextTick(callback);
    }
  },
};

export default redis;
