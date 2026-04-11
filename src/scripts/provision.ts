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

    console.log(
      "🏗️ Creating or updating tables (sequelize.sync({ alter: true }))...",
    );
    // alter:true will attempt to make DB schema match models without dropping data
    await sequelizeConnection.sync({ alter: true });

    console.log("✅ Database provisioned (tables created/updated).");
    process.exit(0);
  } catch (error) {
    console.error("❌ Provision failed:", error);
    process.exit(1);
  }
};

runProvision();
