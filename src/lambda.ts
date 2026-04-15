import { Context } from "aws-lambda";
import serverlessExpress from "@vendia/serverless-express";
import app from "./app"; // IMPORT FROM APP
import sequelizeConnection from "./config/db.config";
import setupAssociations from "./models/associations";
import redis from "./utils/caching"; // Import Redis utility
import { APIGatewayProxyEventV2 } from "aws-lambda"; // Use the correct type for HTTP API Gateway

let cachedServer: any = null;
let isDbReady = false;
let dbInitPromise: Promise<void> | null = null;
let serverInitPromise: Promise<void> | null = null;

// Initialize database connection and associations
const initializeDatabase = async () => {
  if (isDbReady) {
    console.log("Database is already initialized (memory).");
    return;
  }

  if (dbInitPromise) {
    await dbInitPromise;
    return;
  }

  dbInitPromise = (async () => {
    try {
      console.log("Initializing database connection...");
      await sequelizeConnection.authenticate();
      setupAssociations();
      await sequelizeConnection.sync({ alter: true }); // AUTO-ADD missing columns
      isDbReady = true;
      console.log("Database connected and associations set.");
    } catch (err) {
      console.error("DB Initialization Error:", err);
      throw err;
    } finally {
      dbInitPromise = null;
    }
  })();

  await dbInitPromise;
};

// Bootstrap the server
const bootstrap = async () => {
  if (cachedServer) {
    console.log("Server is already initialized (memory).");
    return cachedServer;
  }

  if (serverInitPromise) {
    await serverInitPromise;
    return cachedServer;
  }

  serverInitPromise = (async () => {
    try {
      console.log("Initializing server in memory...");
      cachedServer = serverlessExpress({ app });
    } finally {
      serverInitPromise = null;
    }
  })();

  await serverInitPromise;

  return cachedServer;
};

type LambdaEvent = APIGatewayProxyEventV2;

const hasAuthHeaders = (headers?: Record<string, string | undefined>) => {
  if (!headers) return false;
  const normalized: Record<string, string | undefined> = {};
  for (const key of Object.keys(headers)) {
    normalized[key.toLowerCase()] = headers[key];
  }

  return Boolean(
    normalized["authorization"] ||
    normalized["x-access-token"] ||
    normalized["x-auth-token"] ||
    normalized["auth-token"] ||
    normalized["token"],
  );
};

const isSafePublicCachePath = (path: string) => {
  if (path.startsWith("/api/public")) {
    return true;
  }

  if (path === "/api/games") {
    return true;
  }

  if (/^\/api\/games\/[^/]+$/.test(path)) {
    return true;
  }

  return false;
};

// Lambda handler
export const handler = async (event: LambdaEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // Global base headers to ensure CORS is ALWAYS returned, even on errors
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE,PATCH",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-amz-date, x-api-key, x-amz-security-token, x-access-token, Accept",
  };

  try {
    // Determine request path and method (support APIGW v2)
    const path = event.rawPath || (event as any).path || "/";
    const method =
      (event.requestContext &&
        (event.requestContext as any).http &&
        (event.requestContext as any).http.method) ||
      (event as any).httpMethod ||
      "GET";
    const requestHasAuthHeaders = hasAuthHeaders(event.headers || {});
    const shouldUseCache =
      method === "GET" && !requestHasAuthHeaders && isSafePublicCachePath(path);

    // Handle Preflight OPTIONS rapidly FAST FAIL before DB connection
    if (method === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: "",
      };
    }

    // Initialize database (cold start optimization)
    await initializeDatabase();

    // Ensure server is bootstrapped
    const server = await bootstrap();

    // Build a cache key that includes query string
    const query = (event as any).rawQueryString || "";
    const cacheKey = `${method}_${path}_${query}`;

    // Only cache safe public GET responses without auth headers
    if (shouldUseCache) {
      try {
        const cachedValue = await redis.get(cacheKey);
        if (cachedValue) {
          console.log("Cache hit, returning cached response...");
          const parsed =
            typeof cachedValue === "string"
              ? JSON.parse(cachedValue)
              : cachedValue;

          if (!parsed.headers) parsed.headers = {};
          parsed.headers = { ...parsed.headers, ...corsHeaders };
          return parsed;
        }
      } catch (err) {
        console.warn("Cache get failed (non-fatal):", err);
      }
    }

    // No cached response — forward the request to the Express app via serverless-express
    const result = await server(event as any, context as any);

    // Force inject CORS headers to the valid result
    if (!result.headers) result.headers = {};
    result.headers = { ...result.headers, ...corsHeaders };

    // Cache only safe public GET responses
    if (shouldUseCache && result && result.statusCode === 200) {
      try {
        await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
      } catch (err) {
        console.warn("Cache set failed (non-fatal):", err);
      }
    }

    return result;
  } catch (err: any) {
    console.error("Fatal Server/Handler Error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Internal server error during boot or execution",
        details: err.message,
      }),
    };
  }
};
