import { APIGatewayProxyEvent, Context } from "aws-lambda";
import serverlessExpress from "@vendia/serverless-express";
import app from "./app"; // IMPORT FROM APP
import sequelizeConnection from "./config/db.config";
import setupAssociations from "./models/associations";
import redis from "./utils/caching"; // Import Redis utility

let cachedServer: any = null;
let isDbReady = false;

// Initialize database connection and associations
const initializeDatabase = async () => {
  const dbReadyKey = "db_ready";
  const cachedDbReady = await redis.get(dbReadyKey);

  if (!cachedDbReady) {
    try {
      console.log("Initializing database connection...");
      await sequelizeConnection.authenticate();
      setupAssociations();
      await sequelizeConnection.sync();
      isDbReady = true;
      await redis.set(dbReadyKey, "true", "EX", 3600); // Cache for 1 hour
      console.log("Database connected and associations set.");
    } catch (err) {
      console.error("DB Initialization Error:", err);
      throw err;
    }
  } else {
    console.log("Database is already initialized (cached).");
    isDbReady = true;
  }
};

// Bootstrap the server
const bootstrap = async () => {
  const serverKey = "server_ready";
  const cachedServerReady = await redis.get(serverKey);

  if (!cachedServerReady) {
    console.log("Initializing server...");
    cachedServer = serverlessExpress({ app });
    await redis.set(serverKey, "true", "EX", 3600); // Cache for 1 hour
  } else {
    console.log("Server is already initialized (cached).");
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

  // Example: Use in-memory cache for caching
  const cacheKey = "example_key";
  let cachedData: { message: string } | null = null;
  // Best-effort caching: Failures must not break the Lambda handler
  try {
    const cachedValue = await redis.get(cacheKey);
    if (cachedValue) {
      console.log("Cache hit, returning cached data...");
      try {
        cachedData = JSON.parse(cachedValue as string);
      } catch (err) {
        console.warn("Failed to parse cached JSON:", err);
      }
    } else {
      console.log("Cache miss, querying database...");
      // Simulate a database query
      cachedData = { message: "Hello from the database!" };
      try {
        await redis.set(cacheKey, JSON.stringify(cachedData), "EX", 3600);
      } catch (err) {
        console.warn("Cache set failed (non-fatal):", err);
      }
    }
  } catch (err) {
    console.warn("Cache operation failed (non-fatal):", err);
    cachedData = { message: "Hello from the database!" };
  }

  // Event-specific caching
  const eventKey = `event_${event.requestContext.requestId}`;
  const cachedEventResponse = await redis.get(eventKey);

  if (cachedEventResponse) {
    console.log("Returning cached response for event...");
    return JSON.parse(cachedEventResponse as string);
  }

  // Process the event and cache the response
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "Lambda function executed successfully!",
      cachedData,
    }),
  };
  await redis.set(eventKey, JSON.stringify(response), "EX", 300); // Cache for 5 minutes

  return response;
};
