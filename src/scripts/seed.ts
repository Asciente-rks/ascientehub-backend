import bcrypt from "bcrypt";
import sequelizeConnection from "../config/db.config";
import { seedRoles } from "../seeders/role.seeder";
import { seedCategories } from "../seeders/category.seeder";
import { seedProductionUsers } from "../seeders/production-user.seeder";

// 1. Import all models
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

const runSeeder = async () => {
  try {
    console.log("🔄 Connecting to TiDB...");
    await sequelizeConnection.authenticate();

    // In production, avoid destructive sync. Run idempotent seeders only.
    if ((process.env.NODE_ENV || "development") === "production") {
      console.log("🔒 Running production-safe seed (no sync)...");

      console.log("🌱 Seeding Roles...");
      await seedRoles();

      console.log("🌱 Seeding Categories...");
      await seedCategories();

      console.log("👥 Seeding production users...");
      await seedProductionUsers();

      console.log("✨ Production seeding complete.");
      process.exit(0);
    }

    // Force models into scope for development/test flows
    const models = [
      User,
      Role,
      Category,
      Otp,
      Game,
      Cart,
      Library,
      Transaction,
      Subscription,
      Review,
    ];
    console.log(`📚 Registered ${models.length} models for synchronization.`);

    // Disable checks for a clean wipe
    await sequelizeConnection.query("SET FOREIGN_KEY_CHECKS = 0");

    // 2. Force Sync - Wipes TiDB and recreates everything
    await sequelizeConnection.sync({ force: true });
    console.log("🏗️ Database synced and all tables created.");

    await sequelizeConnection.query("SET FOREIGN_KEY_CHECKS = 1");

    // 3. Run existing seeders in development/test
    console.log("🌱 Seeding Roles...");
    await seedRoles();

    console.log("🌱 Seeding Categories...");
    await seedCategories();

    // 4. NEW: Seed the Initial Superadmin
    console.log("👤 Seeding Superadmin (Asciente Hub)...");

    const adminRole = await Role.findOne({ where: { name: "Admin" } });
    if (!adminRole)
      throw new Error("Admin role not found after seeding roles!");

    const hashedPassword = await bcrypt.hash("AdminBaguio2026!", 10);

    await User.create({
      username: "ascientehub",
      email: "ascientehub@gmail.com", // Your verified contact
      password: hashedPassword,
      roleId: adminRole.id,
      isVerified: true,
      isBanned: false,
      status: "active", // Admin is always active
      provider: "local",
    });

    console.log("✨ All tables created and Superadmin seeded successfully!");
    console.log("📧 Email: ascientehub@gmail.com");
    console.log("🔑 Pass: AdminBaguio2026!");

    // 5. Seed Test Accounts
    console.log("👥 Seeding Test Accounts...");

    const userRole = await Role.findOne({ where: { name: "User" } });
    const developerRole = await Role.findOne({ where: { name: "Developer" } });

    if (!userRole || !developerRole) throw new Error("Roles not found!");

    const testPassword = await bcrypt.hash("Password123", 10);

    // Buyer (User role)
    await User.create({
      username: "Buyer1",
      email: "buyer1@example.com",
      password: testPassword,
      roleId: userRole.id,
      isVerified: true,
      isBanned: false,
      status: "active",
      provider: "local",
    });

    // Developer
    const devUser = await User.create({
      username: "Developer1",
      email: "developer1@example.com",
      password: testPassword,
      roleId: developerRole.id,
      isVerified: true,
      isBanned: false,
      status: "active",
      provider: "local",
    });

    // Admin
    await User.create({
      username: "Admin1",
      email: "admin1@example.com",
      password: testPassword,
      roleId: adminRole.id,
      isVerified: true,
      isBanned: false,
      status: "active",
      provider: "local",
    });

    // Seed a sample game for Developer1
    const category = await Category.findOne();
    if (category) {
      await Game.create({
        title: "Sample Game",
        slug: "sample-game",
        description: "A sample game for testing the store.",
        basePrice: 9.99,
        sizeInGb: 1.5,
        developerId: devUser.id,
        categoryId: category.id,
        status: "approved",
        thumbnailUrl: "https://example.com/thumbnail.jpg", // Placeholder
      });
    }

    console.log("✅ Test accounts seeded:");
    console.log("👤 Buyer1: buyer1@example.com / Password123");
    console.log("🛠️ Developer1: developer1@example.com / Password123");
    console.log("👑 Admin1: admin1@example.com / Password123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

runSeeder();
