import app from "./app";
import sequelizeConnection from "./config/db.config";
import setupAssociations from "./models/associations";
import authRoutes from "./routes/auth.routes";
import express from "express";
import userRoutes from "./routes/user.routes";
import gameRoutes from "./routes/game.routes";
import cartRoutes from "./routes/cart.routes";
import reviewRoutes from "./routes/review.routes";
import developerRoutes from "./routes/developer.routes";
import publicRoutes from "./routes/public.routes";
import adminRoutes from "./routes/admin.routes";

const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/developer", developerRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);

const startServer = async () => {
  try {
    await sequelizeConnection.authenticate();
    console.log("📡 Connected to TiDB.");

    setupAssociations();

    // CHANGE THIS: Remove { alter: true }
    // Just use .sync() with no arguments.
    await sequelizeConnection.sync();

    console.log("✅ Database is ready and stable.");

    app.listen(PORT, () => {
      console.log(`🚀 Asciente Server live on port ${PORT}`);
    });
  } catch (error: any) {
    // Add ': any' here
    console.error("❌ Startup failed:", error.message);
  }
};
startServer();
