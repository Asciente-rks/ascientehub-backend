import { APIGatewayProxyEvent, Context } from "aws-lambda";
import serverlessExpress from "@vendia/serverless-express";
import app from "./app"; // IMPORT FROM APP
import sequelizeConnection from "./config/db.config";
import setupAssociations from "./models/associations";
import redis from "./utils/caching"; // Import Redis utility
import { login } from "./controllers/auth.controller"; // Import login logic
import { Request, Response } from "express"; // Import Express types
import { APIGatewayProxyEventV2 } from "aws-lambda"; // Use the correct type for HTTP API Gateway

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

// Update the Lambda handler and handleLogin function to use APIGatewayProxyEventV2
type LambdaEvent = APIGatewayProxyEventV2;

const handleLogin = async (event: LambdaEvent) => {
  const req = {
    body: JSON.parse(event.body || "{}"),
  } as Request;

  const res = {
    status: (statusCode: number) => {
      return {
        json: (body: any) => ({
          statusCode,
          body: JSON.stringify(body),
        }),
      };
    },
    send: (body: any) => ({
      statusCode: 200,
      body: JSON.stringify(body),
    }),
    json: (body: any) => ({
      statusCode: 200,
      body: JSON.stringify(body),
    }),
  } as unknown as Response;

  return login(req, res);
};

// Lambda handler
export const handler = async (event: LambdaEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // Initialize database (cold start optimization)
  await initializeDatabase();

  // Skip caching for login endpoint
  const path = event.rawPath; // Use rawPath for the endpoint path
  const method = event.requestContext?.http?.method; // Use requestContext.http.method for the HTTP method

  if (path === "/api/auth/login" && method === "POST") {
    console.log(
      "[DEBUG] Handling /api/auth/login endpoint. Cache bypass logic triggered.",
    );
    return await handleLogin(event); // Directly handle login without caching
  }

  // Generate a unique cache key
  const cacheKey = `${method}_${path}`;
  let cachedData: any = null;

  console.log("[DEBUG] Full Event:", JSON.stringify(event, null, 2));
  console.log("[DEBUG] Event Path:", path);
  console.log("[DEBUG] Event HTTP Method:", method);

  try {
    const cachedValue = await redis.get(cacheKey);
    if (cachedValue) {
      console.log("Cache hit, returning cached data...");
      cachedData = JSON.parse(cachedValue as string);
    } else {
      console.log("Cache miss, processing request...");
      // Simulate a database query or other processing
      cachedData = { message: "Hello from the database!" };
      await redis.set(cacheKey, JSON.stringify(cachedData), "EX", 3600);
    }
  } catch (err) {
    console.warn("Cache operation failed (non-fatal):", err);
    cachedData = { message: "Hello from the database!" };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Lambda function executed successfully!",
      cachedData,
    }),
  };
};
