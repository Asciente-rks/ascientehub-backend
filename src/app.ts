import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "./middlewares/rateLimit.middleware";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import gameRoutes from "./routes/game.routes";
import cartRoutes from "./routes/cart.routes";
import reviewRoutes from "./routes/review.routes";
import developerRoutes from "./routes/developer.routes";
import publicRoutes from "./routes/public.routes";
import adminRoutes from "./routes/admin.routes";
import paymentRoutes from "./routes/payment.routes";

// Dynamically load the correct .env file based on NODE_ENV
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: envFile });

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting globally (uses Redis)
app.use(rateLimit());

// Health Check Route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to the Asciente Backend API",
    status: "Active",
    database: "TiDB Serverless",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/developer", developerRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
// Future Route Imports will go here
// app.use('/api/v1/auth', authRoutes);

export default app;
