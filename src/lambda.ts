import { APIGatewayProxyEvent, Context, Callback } from "aws-lambda";
import serverlessExpress from "@vendia/serverless-express";
import app from "./app";
import sequelizeConnection from "./config/db.config";
import setupAssociations from "./models/associations";

let cachedServer: ReturnType<typeof serverlessExpress> | null = null;
let isDbReady = false;

const bootstrap = async () => {
  if (!isDbReady) {
    await sequelizeConnection.authenticate();
    setupAssociations();
    isDbReady = true;
  }

  if (!cachedServer) {
    cachedServer = serverlessExpress({ app });
  }

  return cachedServer;
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback,
) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const server = await bootstrap();
  return server(event, context, callback);
};

//Trigger CI/CD pipeline 2nd
