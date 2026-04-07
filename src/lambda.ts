import { APIGatewayProxyEvent, Context } from "aws-lambda";
import serverlessExpress from "@vendia/serverless-express";
import app from "./app"; // IMPORT FROM APP
import sequelizeConnection from "./config/db.config";
import setupAssociations from "./models/associations";

let cachedServer: any = null;
let isDbReady = false;

const bootstrap = async () => {
  if (!isDbReady) {
    try {
      await sequelizeConnection.authenticate();
      setupAssociations();
      // Only sync if you've made model changes, otherwise authenticate is enough
      await sequelizeConnection.sync(); 
      isDbReady = true;
      console.log("Database connected and associations set.");
    } catch (err) {
      console.error("DB Bootstrap Error:", err);
      throw err;
    }
  }

  if (!cachedServer) {
    cachedServer = serverlessExpress({ app });
  }

  return cachedServer;
};

export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const server = await bootstrap();
  return server(event, context); 
};