// Provision script: safely create tables (non-destructive) using model definitions
process.env.NODE_ENV = process.env.NODE_ENV || "production";

import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import sequelizeConnection from "../config/db.config";

// Import models so Sequelize registers them
import User from "../models/User";
import Role from "../models/Role";
import Category from "../models/Category";
import Otp from "../models/Otp";
import Game from "../models/Game";
import Cart from "../models/Cart";
import Library from "../models/Library";
import Transaction from "../models/Transaction";
import Subscription from "../models/Subscription";
import Review from "../models/Review";

const runProvision = async () => {
  try {
    console.log("🔄 Connecting to database (provision)...");
    await sequelizeConnection.authenticate();

    console.log("🏗️ Creating tables if missing (sequelize.sync())...");
    await sequelizeConnection.sync();

    console.log("🧱 Ensuring additive columns exist on games table...");
    try {
      await sequelizeConnection.query(
        "ALTER TABLE games ADD COLUMN IF NOT EXISTS installerUrl TEXT NULL",
      );
      await sequelizeConnection.query(
        "ALTER TABLE games ADD COLUMN IF NOT EXISTS videoUrl VARCHAR(255) NULL",
      );
    } catch (error) {
      console.warn("⚠️ Non-fatal schema ensure warning:", error);
    }

    console.log("✅ Database provisioned (tables created/updated).");
    process.exit(0);
  } catch (error) {
    console.error("❌ Provision failed:", error);
    process.exit(1);
  }
};

runProvision();
