import Role from "../models/Role";

export class RoleRepository {
  /**
   * FIXED: Added this method to support UUID lookups.
   * This allows the AuthService to validate the roleId (UUID) sent by the frontend.
   */
  async findById(id: string) {
    return await Role.findByPk(id);
  }

  /**
   * Fetch everything for internal/admin use.
   */
  async findAll() {
    return await Role.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });
  }

  /**
   * Still useful for internal logic (like checking if the role name is 'Developer').
   */
  async findByName(name: string) {
    return await Role.findOne({ where: { name } });
  }
}
