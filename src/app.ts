import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to the Asciente Backend API",
    status: "Active",
    database: "TiDB Serverless",
  });
});

// Future Route Imports will go here
// app.use('/api/v1/auth', authRoutes);

export default app;
