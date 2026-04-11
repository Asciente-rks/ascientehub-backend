const redis = require("../utils/redis").default;

const shouldRunRedisTests = process.env.USE_REAL_REDIS === "true";

(shouldRunRedisTests ? describe : describe.skip)("Redis Tests", () => {
  afterAll(async () => {
    if (redis && typeof redis.disconnect === "function") {
      await redis.disconnect();
    }
  });

  it("should set and get a value in Redis", async () => {
    try {
      const key = "test_key";
      const value = "Hello, Redis!";
      const expiration = 60; // 60 seconds

      await redis.set(key, value, "EX", expiration);

      const retrievedValue = await redis.get(key);

      expect(retrievedValue).toBe(value);

      const ttl = await redis.ttl(key);
      expect(ttl).toBeLessThanOrEqual(expiration);
    } catch (err) {
      console.error("Redis test failed:", err);
      throw err; // Fail the test if an error occurs
    }
  });
});
