import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

const dbName = process.env.DB_NAME as string;
const dbUser = process.env.DB_USER as string;
const dbHost = process.env.DB_HOST;
const dbPassword = process.env.DB_PASSWORD;
const dbPort = Number(process.env.DB_PORT) || 4000;

/**
 * Sequelize Connection Instance for TiDB Serverless
 */
const sequelizeConnection = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: "mysql", // TiDB is wire-compatible with MySQL
  logging: false, // Set to console.log to see raw SQL queries during debugging

  dialectOptions: {
    ssl: {
      // TiDB Serverless requires an SSL connection.
      // 'rejectUnauthorized: true' works with standard system CA certs.
      rejectUnauthorized: true,
    },
  },

  /* Pool settings are important for Serverless to avoid 
     "Too many connections" errors while keeping the app snappy.
  */
  pool: {
    max: 5, // TiDB Serverless free tier handles small pools best
    min: 0,
    acquire: 30000, // Timeout for getting a connection
    idle: 10000, // Time before a connection is released
  },
});

export default sequelizeConnection;
