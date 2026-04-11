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

  let response: any;

  const res = {
    status: (statusCode: number) => {
      return {
        json: (body: any) => {
          response = {
            statusCode,
            body: JSON.stringify(body),
          };
          return response;
        },
      };
    },
    send: (body: any) => {
      response = {
        statusCode: 200,
        body: JSON.stringify(body),
      };
      return response;
    },
    json: (body: any) => {
      response = {
        statusCode: 200,
        body: JSON.stringify(body),
      };
      return response;
    },
  } as unknown as Response;

  await login(req, res);
  return response; // Ensure the response is returned
};

// Lambda handler
export const handler = async (event: LambdaEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // Initialize database (cold start optimization)
  await initializeDatabase();

  // Ensure server is bootstrapped
  const server = await bootstrap();

  // Determine request path and method (support APIGW v2)
  const path = event.rawPath || (event as any).path || "/";
  const method =
    (event.requestContext &&
      (event.requestContext as any).http &&
      (event.requestContext as any).http.method) ||
    (event as any).httpMethod ||
    "GET";

  // Bypass cache for login endpoint (POST)
  if (path === "/api/auth/login" && method === "POST") {
    console.log("[DEBUG] Handling /api/auth/login endpoint. Cache bypass.");
    const response = await handleLogin(event);
    console.log("[DEBUG] Response from handleLogin:", response);
    return response;
  }

  // Build a cache key that includes query string
  const query = (event as any).rawQueryString || "";
  const cacheKey = `${method}_${path}_${query}`;

  // Only cache GET responses
  if (method === "GET") {
    try {
      const cachedValue = await redis.get(cacheKey);
      if (cachedValue) {
        console.log("Cache hit, returning cached response...");
        const parsed =
          typeof cachedValue === "string"
            ? JSON.parse(cachedValue)
            : cachedValue;
        return parsed;
      }
    } catch (err) {
      console.warn("Cache get failed (non-fatal):", err);
    }
  }

  // No cached response — forward the request to the Express app via serverless-express
  try {
    const result = await server(event as any, context as any);

    // Cache successful GET responses
    if (method === "GET" && result && result.statusCode === 200) {
      try {
        await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
      } catch (err) {
        console.warn("Cache set failed (non-fatal):", err);
      }
    }

    return result;
  } catch (err) {
    console.error("Server handler error:", err);
    return {
      statusCode: 502,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
