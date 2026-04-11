const redis = require("../utils/redis").default;

describe("Redis Tests", () => {
  it("should set and get a value in Redis", async () => {
    try {
      // Set a test key
      await redis.set("test_key", "Hello, Redis!", "EX", 60); // Expires in 60 seconds
      console.log("Key set successfully!");

      // Get the test key
      const value = await redis.get("test_key");
      console.log("Retrieved value:", value);

      // Assert the value
      expect(value).toBe("Hello, Redis!");

      // Disconnect from Redis
      redis.disconnect();
    } catch (err) {
      console.error("Redis test failed:", err);
      throw err; // Fail the test if an error occurs
    }
  });
});
