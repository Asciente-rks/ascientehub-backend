import User from "../models/User";
import bcrypt from "bcrypt";
import { ROLES } from "../config/constants";

export const seedProductionUsers = async () => {
  try {
    const plainPassword = "Password123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const users = [
      {
        username: "Admin1",
        email: "admin1@example.com",
        roleId: ROLES.ADMIN,
      },
      {
        username: "Developer1",
        email: "developer1@example.com",
        roleId: ROLES.DEVELOPER,
      },
      {
        username: "Buyer1",
        email: "buyer1@example.com",
        roleId: ROLES.USER,
      },
    ];

    for (const u of users) {
      await User.findOrCreate({
        where: { email: u.email },
        defaults: {
          username: u.username,
          email: u.email,
          password: hashedPassword,
          roleId: u.roleId,
          isVerified: true,
          isBanned: false,
          status: "active" as const,
          provider: "local" as const,
        },
      });
    }

    console.log("✅ Production users seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding production users:", error);
    throw error;
  }
};
