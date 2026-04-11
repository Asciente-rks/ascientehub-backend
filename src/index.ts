import app from "./app";
import sequelizeConnection from "./config/db.config";
import setupAssociations from "./models/associations";

const PORT = process.env.PORT || 3000;

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
