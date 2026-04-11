import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis({
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

export default redis;
