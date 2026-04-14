import { RoleRepository } from "../repositories/role.repository";
import { CategoryRepository } from "../repositories/category.repository";

const roleRepo = new RoleRepository();
const categoryRepo = new CategoryRepository();

export class MetaService {
  async getPublicRegistrationData() {
    const [allRoles, categories] = await Promise.all([
      roleRepo.findAll(),
      categoryRepo.findAll(),
    ]);

    // Filter out Admin roles so a random person can't register as Admin.
    // Note: older code referenced 'Buyer' but roles are seeded as 'User'.
    // Allow both 'User' and 'Buyer' for backward compatibility.
    const allowed = new Set(["User", "Buyer", "Developer"]);
    const publicRoles = allRoles.filter((role) => allowed.has(role.name));

    return { roles: publicRoles, categories };
  }

  // Future-proof: This will be used by the Superadmin dashboard
  async getAllMetadataForAdmin() {
    const [roles, categories] = await Promise.all([
      roleRepo.findAll(),
      categoryRepo.findAll(),
    ]);
    return { roles, categories };
  }
}
