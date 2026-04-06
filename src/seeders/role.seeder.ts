import Role from "../models/Role";

export const seedRoles = async () => {
  const roles = [
    { id: "550e8400-e29b-41d4-a716-446655440000", name: "User" },
    { id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", name: "Developer" },
    { id: "ad60592d-9659-4592-a1f7-e24f7627449a", name: "Admin" },
  ];

  try {
    for (const role of roles) {
      await Role.findOrCreate({
        where: { name: role.name },
        defaults: role,
      });
    }
    console.log("✅ Roles seeded!");
  } catch (error) {
    console.error("❌ Role seed error:", error);
  }
};
