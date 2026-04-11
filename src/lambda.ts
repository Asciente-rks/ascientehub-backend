import { APIGatewayProxyEvent, Context } from "aws-lambda";
import serverlessExpress from "@vendia/serverless-express";
import app from "./app"; // IMPORT FROM APP
import sequelizeConnection from "./config/db.config";
import setupAssociations from "./models/associations";
import redis from "./utils/redis"; // Import Redis utility

let cachedServer: any = null;
let isDbReady = false;

// Initialize database connection and associations
const initializeDatabase = async () => {
  if (!isDbReady) {
    try {
      console.log("Initializing database connection...");
      await sequelizeConnection.authenticate();
      setupAssociations();
      await sequelizeConnection.sync(); // Only sync if model changes are made
      isDbReady = true;
      console.log("Database connected and associations set.");
    } catch (err) {
      console.error("DB Initialization Error:", err);
      throw err;
    }
  }
};

// Bootstrap the server
const bootstrap = async () => {
  if (!cachedServer) {
    console.log("Initializing server...");
    cachedServer = serverlessExpress({ app });
  }
  return cachedServer;
};

// Lambda handler
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // Initialize database (cold start optimization)
  await initializeDatabase();

  // Example: Use Redis for caching
  const cacheKey = "example_key";
  let cachedData: { message: string } | null = null;

  const cachedValue = await redis.get(cacheKey);
  if (cachedValue) {
    console.log("Cache hit, returning cached data...");
    cachedData = JSON.parse(cachedValue); // Parse the cached string into an object
  } else {
    console.log("Cache miss, querying database...");
    // Simulate a database query
    cachedData = { message: "Hello from the database!" };
    await redis.set(cacheKey, JSON.stringify(cachedData), "EX", 3600); // Cache for 1 hour
  }

  // Bootstrap the server
  const server = await bootstrap();

  // Return the cached data as an example response
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Lambda function executed successfully!",
      cachedData,
    }),
  };
};
