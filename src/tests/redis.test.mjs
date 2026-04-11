const redis = require("../utils/redis").default;

describe("Redis Tests", () => {
  afterAll(() => {
    // Ensure Redis connection is closed after all tests
    redis.disconnect();
  });

  it("should set and get a value in Redis", async () => {
    try {
      // Set a test key with expiration
      const key = "test_key";
      const value = "Hello, Redis!";
      const expiration = 60; // 60 seconds

      await redis.set(key, value, "EX", expiration);
      console.log("Key set successfully!");

      // Get the test key
      const retrievedValue = await redis.get(key);
      console.log("Retrieved value:", retrievedValue);

      // Assert the value
      expect(retrievedValue).toBe(value);

      // Validate expiration (optional, if supported by Redis library)
      const ttl = await redis.ttl(key);
      console.log("Time-to-live (TTL):", ttl);
      expect(ttl).toBeLessThanOrEqual(expiration);
    } catch (err) {
      console.error("Redis test failed:", err);
      throw err; // Fail the test if an error occurs
    }
  });
});
